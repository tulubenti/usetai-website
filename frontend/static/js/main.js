document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const themeToggle = document.getElementById("theme-toggle");
  const scrollTopButton = document.getElementById("scroll-top");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  setupThemeToggle(themeToggle);
  setupAnchorLinks();
  setupButtonRipples();
  setupScrollTop(scrollTopButton);
  setupRevealAnimations(prefersReducedMotion);
  setupHeroParallax(prefersReducedMotion);

  if (form) {
    setupFormEnhancements(form);
  }
});

function setupFormEnhancements(form) {
  const submitBtn = form.querySelector("#contact-submit") || form.querySelector('button[type="submit"]');
  const fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]'),
  };
  const progressBar = document.getElementById("form-progress-bar");
  const charCount = document.getElementById("message-char-count");
  const statusRegion = document.getElementById("form-status");

  if (fields.name) fields.name.focus();

  const validateField = (fieldName) => {
    const field = fields[fieldName];
    const feedback = form.querySelector(`[data-feedback-for="${fieldName}"]`);
    const label = field ? field.closest("label") : null;
    if (!field) return true;

    const value = field.value.trim();
    let message = "";

    // Validation rules:
    // - name: required
    // - email: required + basic format
    // - message: required + min length 10
    if (fieldName === "name" && !value) message = "Name is required.";
    if (fieldName === "email" && !value) message = "Email is required.";
    if (fieldName === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Please enter a valid email.";
    if (fieldName === "message" && !value) message = "Message is required.";
    if (fieldName === "message" && value && value.length < 10) message = "Message must be at least 10 characters.";

    const isValid = message.length === 0;
    field.classList.toggle("is-invalid", !isValid);
    field.classList.toggle("is-valid", isValid && value.length > 0);
    if (label) label.classList.toggle("is-valid", isValid && value.length > 0);

    if (feedback) {
      feedback.textContent = message;
      feedback.classList.toggle("visible", !isValid);
    }

    return isValid;
  };

  const updateFormState = () => {
    const allValid = ["name", "email", "message"].every(validateField);
    const filledCount = ["name", "email", "message"].filter((key) => fields[key] && fields[key].value.trim().length > 0).length;
    if (progressBar) progressBar.style.width = `${(filledCount / 3) * 100}%`;
    if (submitBtn) submitBtn.disabled = !allValid;
    return allValid;
  };

  Object.keys(fields).forEach((fieldName) => {
    const field = fields[fieldName];
    if (!field) return;
    field.addEventListener("input", updateFormState);
    field.addEventListener("blur", () => validateField(fieldName));
  });

  if (fields.message && charCount) {
    fields.message.addEventListener("input", () => {
      charCount.textContent = `${fields.message.value.length} / 1000`;
    });
  }

  updateFormState();

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (!updateFormState()) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      if (statusRegion) statusRegion.textContent = "Please fix the highlighted fields before submitting.";
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : "";
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      submitBtn.textContent = "Sending...";
    }

    try {
      const resp = await fetch(form.action || "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      if (resp.ok && data.status === "success") {
        showNotification(data.message || "Message sent — thank you!", "success");
        if (statusRegion) statusRegion.textContent = "Form submitted successfully.";
        form.reset();
        if (charCount) charCount.textContent = "0 / 1000";
      } else {
        showNotification((data && data.message) || "Failed to send message, please try again later.", "error");
        if (statusRegion) statusRegion.textContent = "Failed to submit form.";
      }
    } catch (err) {
      console.error("Contact form error:", err);
      showNotification("Network error sending message. Please try again later.", "error");
      if (statusRegion) statusRegion.textContent = "Network error while submitting form.";
    } finally {
      if (submitBtn) {
        submitBtn.classList.remove("is-loading");
        submitBtn.textContent = originalText;
      }
      updateFormState();
    }
  });
}

function showNotification(message, type = "info") {
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.setAttribute("role", "status");
  notification.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === "success" ? "rgba(0, 224, 154, 0.9)" : "rgba(255, 110, 110, 0.9)"};
    color: ${type === "success" ? "#000" : "#fff"};
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function setupThemeToggle(themeToggle) {
  if (!themeToggle) return;
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme, themeToggle);

  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme, themeToggle);
    localStorage.setItem("theme", newTheme);
  });
}

function applyTheme(theme, themeToggle) {
  const isLight = theme === "light";
  document.documentElement.classList.toggle("light", isLight);
  themeToggle.setAttribute("aria-pressed", isLight.toString());
  themeToggle.textContent = isLight ? "🌙" : "🌗";
}

function setupAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target && window.UIUtils) {
        UIUtils.smoothScrollTo(target, 100);
      }
    });
  });
}

function setupButtonRipples() {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      if (window.UIUtils) UIUtils.createRipple(this, e);
    });
  });
}

function setupRevealAnimations(prefersReducedMotion) {
  const revealTargets = document.querySelectorAll(".service-card, .initiative-card, .project-card");
  revealTargets.forEach((el, index) => {
    el.classList.add("reveal-item");
    el.style.setProperty("--stagger-delay", `${(index % 4) * 80}ms`);
  });

  if (prefersReducedMotion || !window.UIUtils) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  UIUtils.observeElements(".reveal-item", (entry) => {
    entry.target.classList.add("is-visible");
  }, { threshold: 0.15 });
}

function setupHeroParallax(prefersReducedMotion) {
  if (prefersReducedMotion || !window.UIUtils) return;
  const root = document.documentElement;
  const updateParallax = () => {
    const offset = Math.min(window.scrollY * 0.2, 30);
    root.style.setProperty("--parallax-offset", `${offset}px`);
  };
  const onScroll = UIUtils.rafThrottle(updateParallax);
  window.addEventListener("scroll", onScroll, { passive: true });
  updateParallax();
}

function setupScrollTop(button) {
  if (!button || !window.UIUtils) return;
  const toggle = () => button.classList.toggle("visible", window.scrollY > 400);
  const onScroll = UIUtils.debounce(() => requestAnimationFrame(toggle), 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  toggle();

  button.addEventListener("click", () => {
    UIUtils.smoothScrollTo(document.body, 0);
  });
}

const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOutRight {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
  }
`;
document.head.appendChild(style);
