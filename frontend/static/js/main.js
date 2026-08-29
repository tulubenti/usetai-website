// Enhanced main.js with improved form handling, validation, theme persistence, and scroll-reveal
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const themeToggle = document.getElementById("theme-toggle");

  // ===== Form Handling with Field-Level Validation =====
  if (form) {
    // Clear individual field error on input
    form.querySelectorAll("input, textarea, select").forEach(field => {
      field.addEventListener("input", function () {
        clearFieldError(this);
      });
    });

    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      // Field-level validation with inline errors
      const valid = validateFormFields(form, payload);
      if (!valid) return;

      // Disable submit button and show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      try {
        const resp = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await resp.json();

        if (resp.ok && data.status === "success") {
          showNotification(data.message || "Message sent — thank you!", "success");
          form.reset();
          form.querySelectorAll("label").forEach(l => l.classList.remove("has-error"));
          form.querySelectorAll(".field-error").forEach(el => (el.textContent = ""));
        } else {
          showNotification((data && data.message) || "Failed to send message, please try again later.", "error");
        }
      } catch (err) {
        console.error("Contact form error:", err);
        showNotification("Network error sending message. Please try again later.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ===== Field-Level Validation Helper =====
  function validateFormFields(form, data) {
    let valid = true;
    let firstErrorField = null;

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const messageInput = form.querySelector('[name="message"]');

    if (!data.name || data.name.trim().length === 0) {
      setFieldError(nameInput, "Name is required.", false);
      if (!firstErrorField) firstErrorField = nameInput;
      valid = false;
    }

    if (!data.email || data.email.trim().length === 0) {
      setFieldError(emailInput, "Email is required.", false);
      if (!firstErrorField) firstErrorField = emailInput;
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setFieldError(emailInput, "Please enter a valid email address.", false);
      if (!firstErrorField) firstErrorField = emailInput;
      valid = false;
    }

    if (!data.message || data.message.trim().length === 0) {
      setFieldError(messageInput, "Message is required.", false);
      if (!firstErrorField) firstErrorField = messageInput;
      valid = false;
    } else if (data.message.trim().length < 10) {
      setFieldError(messageInput, "Message must be at least 10 characters.", false);
      if (!firstErrorField) firstErrorField = messageInput;
      valid = false;
    }

    if (firstErrorField) firstErrorField.focus();
    return valid;
  }

  function setFieldError(field, message, shouldFocus = true) {
    if (!field) return;
    const label = field.closest("label");
    if (label) label.classList.add("has-error");
    const errorEl = label && label.querySelector(".field-error");
    if (errorEl) errorEl.textContent = message;
    if (shouldFocus) field.focus();
  }

  function clearFieldError(field) {
    const label = field.closest("label");
    if (!label) return;
    label.classList.remove("has-error");
    const errorEl = label.querySelector(".field-error");
    if (errorEl) errorEl.textContent = "";
  }

  // ===== Notification System =====
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
      max-width: calc(100vw - 40px);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // ===== Theme Toggle with Persistence =====
  if (themeToggle) {
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

    themeToggle.addEventListener("click", function () {
      const currentTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.documentElement.classList.toggle("light", isLight);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", isLight.toString());
      themeToggle.textContent = isLight ? "🌙" : "🌗";
    }
  }

  // ===== data-tab-link: anchor links that also switch tabs =====
  document.querySelectorAll("[data-tab-link]").forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const tabName = this.getAttribute("data-tab-link");
      const tabBtn = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
      if (tabBtn) {
        e.preventDefault();
        tabBtn.click();
        tabBtn.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // ===== Smooth scroll for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || this.hasAttribute("data-tab-link")) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target && typeof UIUtils !== "undefined") {
        UIUtils.smoothScrollTo(target, 100);
      }
    });
  });

  // ===== Ripple effect on buttons =====
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      if (typeof UIUtils !== "undefined") {
        UIUtils.createRipple(this, e);
      }
    });
  });

  // ===== Scroll-reveal animations =====
  if (typeof UIUtils !== "undefined") {
    UIUtils.observeElements(".service-card, .initiative-card, .project-card", (entry) => {
      entry.target.classList.add("reveal", "visible");
    });
  } else if (window.IntersectionObserver) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".service-card, .initiative-card, .project-card").forEach(el => {
      el.classList.add("reveal");
      revealObserver.observe(el);
    });
  }
});

// ===== Slide notification keyframes =====
(function () {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to   { opacity: 0; transform: translateX(100px); }
    }
  `;
  document.head.appendChild(style);
})();
