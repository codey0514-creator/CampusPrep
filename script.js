let allPosts = [];          
let activeFilter = "all";   
const searchInput = document.getElementById("companySearch");
const searchButton = document.getElementById("searchButton");
const filterButtons = document.querySelectorAll(".filter-button");
const experiencesEl = document.getElementById("experiences");
const TYPE_LABELS = {
    oa: "OA",
    interview: "Interview"
};
async function loadPosts() {
    try {
        const res = await fetch("public/data/posts.json");
        if (!res.ok) throw new Error("Request failed: " + res.status);
        allPosts = await res.json();
    } catch (err) {
        console.error("Could not load posts:", err);
        allPosts = [];
    }
    render();
}
function getVisiblePosts() {
    const query = searchInput.value.trim().toLowerCase();

    return allPosts
        .filter(p => activeFilter === "all" || p.type === activeFilter)
        .filter(p => p.company.toLowerCase().includes(query))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function buildCard(p) {
    const meta = [p.year, p.branch].filter(Boolean).map(escapeHtml).join(" • ");

    const questions = (p.questions && p.questions.length)
        ? `<div class="card-section">
               <h4>Questions</h4>
               <ul>${p.questions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
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
            ${questions}
            ${experience}
            ${tips}
        </div>
    `;
}
function render() {
    const posts = getVisiblePosts();

    if (posts.length === 0) {
        experiencesEl.innerHTML = "<p>No experiences found.</p>";
        return;
    }

    experiencesEl.innerHTML = posts.map(buildCard).join("");
}
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
searchButton.addEventListener("click", render);
searchInput.addEventListener("input", render);
searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") render();
});
filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        filterButtons.forEach(b => b.classList.toggle("active", b === btn));
        render();
    });
});
loadPosts();