const form = document.getElementById("contribution-form");
const message = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const post = {
        company: document.getElementById("company").value.trim(),
        type: document.getElementById("type").value,
        year: Number(document.getElementById("year").value),
        branch: document.getElementById("branch").value.trim(),
        questions: document.getElementById("questions").value.trim(),
        experience: document.getElementById("experience").value.trim(),
        tips: document.getElementById("tips").value.trim(),
        isAnonymous: document.getElementById("anonymous").checked
    };

    if (
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

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Submission failed.");
        }

        showMessage(
            "Your experience has been submitted for admin approval!",
            "success"
        );

        form.reset();

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