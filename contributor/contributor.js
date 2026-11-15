
const form = document.getElementById("contribution-form");
const message = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
const nameInput = document.getElementById("authorName");
const anonymousCheckbox = document.getElementById("anonymous");

anonymousCheckbox.addEventListener("change", function() {
    nameInput.required = !this.checked;
    nameInput.disabled = this.checked;

    if (this.checked) {
        nameInput.value = "";
    }
});

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const isAnonymous = anonymousCheckbox.checked;

    const post = {
        authorName: isAnonymous ? "" : nameInput.value.trim(),
        isAnonymous: isAnonymous,
        company: document.getElementById("company").value.trim(),
        type: document.getElementById("type").value,
        year: Number(document.getElementById("year").value),
        branch: document.getElementById("branch").value.trim(),
        questions: document.getElementById("questions").value.trim(),
        experience: document.getElementById("experience").value.trim(),
        tips: document.getElementById("tips").value.trim()
    };

    if (
        (!isAnonymous && !post.authorName) ||
        !post.company ||
        !post.type ||
        !post.year ||
        !post.branch ||
        !post.questions ||
        !post.experience
    ) {
        showMessage("Please fill in all required fields.", "error");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(post)
        });

        const responseText = await response.text();

console.log("Status:", response.status);
console.log("Response:", responseText);

const result = JSON.parse(responseText);

        if (!response.ok) {
            throw new Error(result.message || "Submission failed.");
        }

        showMessage(
            "Your experience has been submitted for admin approval!",
            "success"
        );

        setTimeout(() => {
            window.location.href = result.redirect;
        }, 1200);

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit for Review";
    }
});

function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
}
