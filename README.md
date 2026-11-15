# CampusPrep

CampusPrep is a placement experience sharing platform for students of IIT Bhilai.
Students can read interview and online assessment (OA) experiences shared by their
peers, search by company, and submit their own. Every submission is reviewed by
an admin before it goes live.

## Features

**Students**
- Sign in with their institute Google account (`@iitbhilai.ac.in` only)
- Choose a role after login: viewer or contributor
- Browse approved placement experiences
- Search by company name
- Filter by type: All, OA, Interview
- Submit a new experience (optionally anonymous) — saved as `pending`

**Admins**
- View all pending posts
- Approve or reject submissions
- Admin access is granted via the `ADMIN_EMAILS` environment variable

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express 5
- **Auth:** Google OAuth 2.0 via Passport (`passport-google-oauth20`)
- **Sessions:** `express-session`
- **Data storage:** JSON files on disk (no database)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

Dependencies: `dotenv`, `express`, `express-session`, `passport`,
`passport-google-oauth20`.

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=any-long-random-string
ADMIN_EMAILS=admin1@iitbhilai.ac.in,admin2@iitbhilai.ac.in
```

- `ADMIN_EMAILS` is a comma-separated list; matching is case-insensitive.
- Configure your Google OAuth consent screen / credentials with the callback
  URL `http://localhost:3000/auth/google/callback`.

### 3. Run the server

```bash
npm start
```

The app runs on `http://localhost:3000`. On first startup the server
auto-creates `public/data/posts.json` and `public/data/pending-posts.json`
if they don't exist.

## Application Flow

```
[ Google OAuth Sign-In ]
          |
          v
 Email ends with @iitbhilai.ac.in?
      /            \
    NO             YES
    |               |
    v               v
[Denied]    [ /choose-role.html ]
                /      |      \
           viewer  contributor  admin (if in ADMIN_EMAILS)
             |          |          |
             v          v          v
       veiwer.html  contributor/  admin.html
                     contributor.html
                          |
                          v
                  POST /api/posts
                  (status: pending)
                          |
                          v
              Admin approves -> posts.json
              Post goes live on student feed
```

## Post Lifecycle

| Status     | Meaning                                   | Visible to students |
|------------|-------------------------------------------|---------------------|
| `pending`  | Submitted, waiting for admin review       | No                  |
| `approved` | Approved by an admin                      | Yes                 |
| `rejected` | Rejected by an admin (or entry deleted)   | No                  |

## Data Storage

All data lives in JSON files under `public/data/`:

- `posts.json` — approved posts shown on the student feed
- `pending-posts.json` — the moderation queue (pending + decided posts)

Each post record contains: `id`, `company`, `type` (`oa` | `interview`),
`year`, `branch`, `questions`, `experience`, `tips`, `isAnonymous`,
`authorName`, `authorEmail`, `status`, `createdAt`, and (once approved)
`approvedAt` / `approvedBy`.

## API Overview

| Method | Route                          | Guard               | Purpose                        |
|--------|--------------------------------|---------------------|--------------------------------|
| GET    | `/auth/google`                 | —                   | Start Google OAuth             |
| GET    | `/auth/google/callback`        | —                   | OAuth callback → role select   |
| GET    | `/api/me`                      | `requireLogin`      | Current user info              |
| POST   | `/select-role`                 | `requireLogin`      | Set `req.session.selectedRole` |
| GET    | `/api/posts/approved`          | `requireLogin`      | List approved posts            |
| POST   | `/api/posts`                   | `requireContributor`| Submit a new experience        |
| GET    | `/api/admin/pending-posts`     | `requireAdmin`      | List pending submissions       |
| POST   | `/api/admin/approve/:id`       | `requireAdmin`      | Approve a submission           |

## Project Structure

```
campusprep/
├── server.js                  # Express backend (auth, routes, JSON read/write)
├── veiwer.html                # Student feed page (note: filename is misspelled)
├── script.js                  # Frontend logic (search, filtering, rendering)
├── style.css                  # Dark theme
├── admin.html                 # Admin moderation dashboard
├── choose-role.html           # Role selection page
├── contributor/
│   ├── contributor.html       # Submission form
│   ├── contributor.js         # Form logic → POST /api/posts
│   └── contributor.css
├── public/
│   └── data/
│       ├── posts.json         # Approved posts
│       └── pending-posts.json # Moderation queue
├── .env                       # Secrets (not committed)
├── package.json
└── README.md
```
```

---

## Key details this README is based on

- **Env vars & admin list:** `ADMIN_EMAILS` is parsed from `process.env` and lowercased [2](#0-1) ; `SESSION_SECRET` is required by `express-session` [3](#0-2) .
- **Auto-provisioned data files:** the server creates `public/data/posts.json` and `pending-posts.json` on startup [4](#0-3) .
- **Role flow:** `/select-role` maps roles to `veiwer.html`, `contributor/contributor.html`, and `admin.html` [5](#0-4) .
- **Submission → moderation:** `POST /api/posts` writes to `PENDING_FILE` with `status: "pending"` [6](#0-5) ; approval copies the post into `POSTS_FILE` [7](#0-6) .
- **Dependencies & start script:** [8](#0-7) [9](#0-8) .

## Notes

- The existing `README.md` lists `data/posts.json` at the root, but the actual path is `public/data/` [10](#0-9)  — the draft above corrects this.
- The viewer page filename is genuinely `veiwer.html` (misspelled) [11](#0-10) ; the README notes this so nobody "fixes" the link and breaks routing.
- I inferred `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env var names from `passport-google-oauth20` usage [12](#0-11) ; verify the exact names in the strategy config section of `server.js` (lines ~96–121 weren't fully shown to me) before committing.
- If you want me to actually write this file into the repo, start a Devin session — this interface is read-only Q&A.

Wiki pages you might want to explore:
- [Overview (codey0514-creator/CampusPrep)](/wiki/codey0514-creator/CampusPrep#1)
- [Glossary (codey0514-creator/CampusPrep)](/wiki/codey0514-creator/CampusPrep#4)

### Citations

**File:** README.md (L1-3)
```markdown
# CampusPrep

CampusPrep is a placement experience sharing platform for students of IIT Bhilai. Students can read interview and online assessment (OA) experiences shared by their peers, search by company, and submit their own. Every submission is reviewed by an admin before it goes live.
```

**File:** server.js (L4-5)
```javascript
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
```

**File:** server.js (L14-16)
```javascript
const DATA_DIR = path.join(__dirname, "public", "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const PENDING_FILE = path.join(DATA_DIR, "pending-posts.json");
```

**File:** server.js (L18-21)
```javascript
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
```

**File:** server.js (L25-34)
```javascript
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
```

**File:** server.js (L39-49)
```javascript
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, "[]");
}

if (!fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(PENDING_FILE, "[]");
}
```

**File:** server.js (L176-180)
```javascript
    const redirects = {
        viewer: "/veiwer.html",
        contributor: "/contributor/contributor.html",
        admin: "/admin.html"
    };
```

**File:** server.js (L221-238)
```javascript
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
        authorName: isAnonymous ? "" : authorName.trim(),
        authorEmail: req.user.email,
        status: "pending",
        createdAt: new Date().toISOString()
    };

    pendingPosts.push(newPost);
    writeJSON(PENDING_FILE, pendingPosts);
```

**File:** server.js (L279-294)
```javascript
    const approvedPost = {
        ...post,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: req.user.email
    };

    approvedPosts.push(approvedPost);

    writeJSON(POSTS_FILE, approvedPosts);

    post.status = "approved";
    post.approvedAt = approvedPost.approvedAt;
    post.approvedBy = req.user.email;

    writeJSON(PENDING_FILE, pendingPosts);
```

**File:** package.json (L6-9)
```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
```

**File:** package.json (L21-27)
```json
  "dependencies": {
    "dotenv": "^18.0.10",
    "express": "^5.3.0",
    "express-session": "^1.19.0",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0"
  }
```
