let allPosts = [];
let activeFilter = "all";

const searchInput = document.getElementById("companySearch");
const searchButton = document.getElementById("searchButton");
const filterButtons = document.querySelectorAll(".filter-button");
const experiencesEl = document.getElementById("experiences");

const pendingPostsEl = document.getElementById("pending-posts");
const pendingCountEl = document.getElementById("pending-count");
const adminMessageEl = document.getElementById("admin-message");
const refreshButton = document.getElementById("refreshPending");
const TYPE_LABELS = {
    oa: "OA",
    interview: "Interview"
};

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

function getQuestions(questions) {
    if (Array.isArray(questions)) {
        return questions;
    }

    if (typeof questions === "string") {
        return questions.split("\n").map(q => q.trim()).filter(Boolean);
    }

    return [];
}

// ---------------- VIEWER PAGE ----------------

async function loadPosts() {
    try {
        const res = await fetch("/api/posts/approved");

        if (!res.ok) {
            throw new Error("Request failed: " + res.status);
        }

        allPosts = await res.json();
    } catch (err) {
        console.error("Could not load posts:", err);
        allPosts = [];
    }

    renderViewer();
}

function getVisiblePosts() {
    const query = searchInput.value.trim().toLowerCase();

    return allPosts
        .filter(p => activeFilter === "all" || p.type === activeFilter)
        .filter(p => (p.company || "").toLowerCase().includes(query))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildViewerCard(p) {
    const meta = [p.year, p.branch]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" • ");

    const questions = getQuestions(p.questions);

    const questionsSection = questions.length
        ? `<div class="card-section">
               <h4>Questions</h4>
               <ul>${questions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
           </div>`
        : "";

    const experience = p.experience
        ? `<div class="card-section">
               <h4>Experience</h4>
               <p>${escapeHtml(p.experience)}</p>
           </div>`
        : "";

    const tips = p.tips
        ? `<div class="card-section">
               <h4>Tips</h4>
               <p>${escapeHtml(p.tips)}</p>
           </div>`
        : "";

    return `
        <div class="experience-card">
            <h3>${escapeHtml(p.company)}</h3>
            <div class="card-meta">
                <span class="type">${TYPE_LABELS[p.type] || escapeHtml(p.type)}</span>
                <span class="year-branch">${meta}</span>
            </div>
            ${questionsSection}
            ${experience}
            ${tips}
        </div>
    `;
}

function renderViewer() {
    const posts = getVisiblePosts();

    if (posts.length === 0) {
        experiencesEl.innerHTML = "<p>No experiences found.</p>";
        return;
    }

    experiencesEl.innerHTML = posts.map(buildViewerCard).join("");
}

if (experiencesEl) {
    searchButton.addEventListener("click", renderViewer);
    searchInput.addEventListener("input", renderViewer);

    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") renderViewer();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            activeFilter = btn.dataset.filter;

            filterButtons.forEach(b => {
                b.classList.toggle("active", b === btn);
            });

            renderViewer();
        });
    });

    loadPosts();
}

// ---------------- ADMIN PAGE ----------------

async function loadPendingPosts() {
    adminMessageEl.textContent = "Loading submissions...";
    adminMessageEl.className = "";

    try {
        const response = await fetch("/api/admin/pending-posts");

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not load submissions.");
        }

        renderPendingPosts(result);
        adminMessageEl.textContent = "";
    } catch (error) {
        adminMessageEl.textContent = error.message;
        adminMessageEl.className = "admin-error";
        pendingCountEl.textContent = "0";
        pendingPostsEl.innerHTML = "";
    }
}

function buildPendingCard(p) {
    const meta = [p.year, p.branch]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" • ");

    const questions = getQuestions(p.questions);

    const questionsSection = questions.length
        ? `<div class="card-section">
               <h4>Questions</h4>
               <ul>${questions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
           </div>`
        : "";

    const experience = p.experience
        ? `<div class="card-section">
               <h4>Experience</h4>
               <p>${escapeHtml(p.experience)}</p>
           </div>`
        : "";

    const tips = p.tips
        ? `<div class="card-section">
               <h4>Tips</h4>
               <p>${escapeHtml(p.tips)}</p>
           </div>`
        : "";

    const author = p.isAnonymous
        ? "Anonymous"
        : (p.authorName || "Unknown contributor");

    const date = p.createdAt
        ? new Date(p.createdAt).toLocaleString()
        : "Date unavailable";

    return `
        <div class="experience-card admin-card">
            <h3>${escapeHtml(p.company)}</h3>

            <div class="card-meta">
                <span class="type">${TYPE_LABELS[p.type] || escapeHtml(p.type)}</span>
                <span class="year-branch">${meta}</span>
            </div>

            <p class="admin-author">Submitted by: ${escapeHtml(author)}</p>
            <p class="admin-date">Submitted: ${escapeHtml(date)}</p>

            ${questionsSection}
            ${experience}
            ${tips}

            <div class="admin-actions">
                <button class="approve-button" data-action="approve" data-id="${escapeHtml(p.id)}">
                    Approve
                </button>
                <button class="reject-button" data-action="reject" data-id="${escapeHtml(p.id)}">
                    Reject
                </button>
            </div>
        </div>
    `;
}

function renderPendingPosts(posts) {
    pendingCountEl.textContent = posts.length;

    if (posts.length === 0) {
        pendingPostsEl.innerHTML = "<p>No pending submissions.</p>";
        return;
    }

    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    pendingPostsEl.innerHTML = posts.map(buildPendingCard).join("");
}

async function handleAdminAction(action, id, button) {
    const actionName = action === "approve" ? "approve" : "reject";

    if (!confirm(`Are you sure you want to ${actionName} this submission?`)) {
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(`/api/admin/${action}/${encodeURIComponent(id)}`, {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Action failed.");
        }

        adminMessageEl.textContent = result.message;
        adminMessageEl.className = "admin-success";

        await loadPendingPosts();
    } catch (error) {
        adminMessageEl.textContent = error.message;
        adminMessageEl.className = "admin-error";
        button.disabled = false;
    }
}

if (pendingPostsEl) {
    pendingPostsEl.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        handleAdminAction(
            button.dataset.action,
            button.dataset.id,
            button
        );
    });

    refreshButton.addEventListener("click", loadPendingPosts);

    loadPendingPosts();
}