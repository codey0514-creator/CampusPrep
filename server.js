require("dotenv").config();

const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "public", "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const PENDING_FILE = path.join(DATA_DIR, "pending-posts.json");

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

app.use(express.json({ limit: "1mb" }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, "[]");
}

if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, "[]");
}

// Read and write JSON files
function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

// Authentication middleware
function requireLogin(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    next();
}

function requireContributor(req, res, next) {
    if (
        !req.isAuthenticated() ||
        !["contributor", "admin"].includes(req.session.selectedRole)
    ) {
        return res.status(403).json({
            message: "Please select the Contributor role."
        });
    }

    next();
}

function requireAdmin(req, res, next) {
    if (
        !req.isAuthenticated() ||
        !req.user.isAdmin ||
        req.session.selectedRole !== "admin"
    ) {
        return res.status(403).json({
            message: "Admin access required."
        });
    }

    next();
}

// Google authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
function(accessToken, refreshToken, profile, done) {

    const email = profile.emails?.[0]?.value?.toLowerCase();
    const emailVerified = profile._json.email_verified;

    if (
        !email ||
        !emailVerified ||
        !email.endsWith("@iitbhilai.ac.in")
    ) {
        return done(null, false);
    }

    const user = {
        name: profile.displayName,
        email: email,
        isAdmin: ADMIN_EMAILS.includes(email)
    };

    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google login
app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// Google callback
app.get("/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/?error=denied"
    }),
    (req, res, next) => {
        req.session.selectedRole = null;

        req.session.save(err => {
            if (err) return next(err);
            res.redirect("/choose-role.html");
        });
    }
);

// Get logged-in user
app.get("/api/me", requireLogin, (req, res) => {
    res.json({
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin
    });
});

// Select role
app.post("/select-role", requireLogin, (req, res, next) => {
    const role = req.body.role;

    const allowedRoles = ["viewer", "contributor"];

    if (req.user.isAdmin) {
        allowedRoles.push("admin");
    }

    if (!allowedRoles.includes(role)) {
        return res.status(403).json({
            message: "You are not authorized to select this role."
        });
    }

    req.session.selectedRole = role;

    const redirects = {
        viewer: "/veiwer.html",
        contributor: "/contributor/contributor.html",
        admin: "/admin.html"
    };

    req.session.save(err => {
        if (err) return next(err);

        res.json({
            redirect: redirects[role]
        });
    });
});

// Submit a new experience
app.post("/api/posts", requireContributor, (req, res) => {
    const {
        company,
        type,
        year,
        branch,
        questions,
        experience,
        tips,
        isAnonymous
    } = req.body;

    if (
        typeof company !== "string" ||
        !company.trim() ||
        !["oa", "interview"].includes(type) ||
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100 ||
        typeof branch !== "string" ||
        !branch.trim() ||
        typeof questions !== "string" ||
        !questions.trim() ||
        typeof experience !== "string" ||
        !experience.trim() ||
        (tips !== undefined && typeof tips !== "string") ||
        (isAnonymous !== undefined && typeof isAnonymous !== "boolean")
    ) {
        return res.status(400).json({
            message: "Please provide valid information in all required fields."
        });
    }

    const pendingPosts = readJSON(PENDING_FILE);

    const newPost = {
        id: crypto.randomUUID(),
        company: company.trim(),
        type: type,
        year: year,
        branch: branch.trim(),
        questions: questions.trim(),
        experience: experience.trim(),
        tips: (tips || "").trim(),
        isAnonymous: isAnonymous === true,
        authorName: isAnonymous ? "Anonymous" : req.user.name,
        authorEmail: req.user.email,
        status: "pending",
        createdAt: new Date().toISOString()
    };

    pendingPosts.push(newPost);
    writeJSON(PENDING_FILE, pendingPosts);

    req.session.selectedRole = "viewer";

    req.session.save(err => {
        if (err) {
            return res.status(500).json({
                message: "Submission saved, but redirect failed."
            });
        }

        res.status(201).json({
            success: true,
            message: "Your experience has been submitted for admin approval.",
            redirect: "/veiwer.html"
        });
    });
});

// Get all pending submissions (admin only)
app.get("/api/admin/pending-posts", requireAdmin, (req, res) => {
    const pendingPosts = readJSON(PENDING_FILE);

    const posts = pendingPosts.filter(post => post.status === "pending");

    res.json(posts);
});

// Approve a submission
app.post("/api/admin/approve/:id", requireAdmin, (req, res) => {
    const pendingPosts = readJSON(PENDING_FILE);
    const approvedPosts = readJSON(POSTS_FILE);

    const post = pendingPosts.find(
        item => item.id === req.params.id && item.status === "pending"
    );

    if (!post) {
        return res.status(404).json({
            message: "Pending submission not found."
        });
    }

    const approvedPost = {
        ...post,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: req.user.email
    };

    approvedPosts.push(approvedPost);

    // Add to the public approved posts file
    writeJSON(POSTS_FILE, approvedPosts);

    // Mark the original submission as approved
    post.status = "approved";
    post.approvedAt = approvedPost.approvedAt;
    post.approvedBy = req.user.email;

    writeJSON(PENDING_FILE, pendingPosts);

    res.json({
        success: true,
        message: "Experience approved successfully."
    });
});

// Reject a submission
app.post("/api/admin/reject/:id", requireAdmin, (req, res) => {
    const pendingPosts = readJSON(PENDING_FILE);

    const post = pendingPosts.find(
        item => item.id === req.params.id && item.status === "pending"
    );

    if (!post) {
        return res.status(404).json({
            message: "Pending submission not found."
        });
    }

    post.status = "rejected";
    post.rejectedAt = new Date().toISOString();
    post.rejectedBy = req.user.email;

    writeJSON(PENDING_FILE, pendingPosts);

    res.json({
        success: true,
        message: "Submission rejected."
    });
});

// Get approved experiences
app.get("/api/posts/approved", (req, res) => {
    const posts = readJSON(POSTS_FILE);

    res.json(posts.filter(post => !post.status || post.status === "approved"));
});

// Protect viewer page
app.get("/veiwer.html", (req, res, next) => {
    if (
        !req.isAuthenticated() ||
        !["viewer", "admin"].includes(req.session.selectedRole)
    ) {
        return res.redirect("/choose-role.html");
    }

    next();
});

// Protect contributor page
app.get("/contributor/contributor.html", (req, res, next) => {
    if (
        !req.isAuthenticated() ||
        !["contributor", "admin"].includes(req.session.selectedRole)
    ) {
        return res.redirect("/choose-role.html");
    }

    next();
});

// Protect admin page
app.get("/admin.html", (req, res, next) => {
    if (
        !req.isAuthenticated() ||
        !req.user.isAdmin ||
        req.session.selectedRole !== "admin"
    ) {
        return res.redirect("/choose-role.html");
    }
    res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

// Prevent public access to private pending submissions
app.use("/public/data/pending-posts.json", (req, res) => {
    res.status(404).send("Not found");
});

// Logout
app.get("/auth/logout", (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);

        req.session.destroy(() => {
            res.redirect("/");
        });
    });
});

// Serve frontend files
app.use(express.static(__dirname, {
    dotfiles: "deny"
}));

app.listen(PORT, () => {
    console.log(`CampusPrep running at http://localhost:${PORT}`);
});