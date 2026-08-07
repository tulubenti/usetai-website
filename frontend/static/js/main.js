// Small client helper: submit the contact form as JSON and show simple feedback.
// This file was referenced by index.html but not present; adding it enables
// progressive enhancement for the contact flow.

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Basic client-side validation
    if (!payload.name || !payload.email || !payload.message) {
      alert("Please complete name, email and message fields.");
      return;
    }

    try {
      const resp = await fetch(form.action || "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.status === "success") {
        alert(data.message || "Message sent — thank you!");
        form.reset();
      } else {
        alert((data && data.message) || "Failed to send message, please try again later.");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      alert("Network error sending message. Please try again later.");
    }
  });

  // Theme toggle (basic, matches markup)
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const pressed = themeToggle.getAttribute("aria-pressed") === "true";
      themeToggle.setAttribute("aria-pressed", (!pressed).toString());
      document.documentElement.classList.toggle("dark", !pressed);
    });
  }
});
