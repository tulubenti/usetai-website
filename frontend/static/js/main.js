// Enhanced main.js with improved form handling, validation, and theme persistence
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const themeToggle = document.getElementById("theme-toggle");
  
  // Form Handling with Enhanced Validation
  if (form) {
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      
      // Enhanced client-side validation
      const validationErrors = validateForm(payload);
      if (validationErrors.length > 0) {
        showNotification(validationErrors.join(", "), "error");
        return;
      }
      
      // Disable submit button and show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      
      try {
        const resp = await fetch(form.action || "/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const data = await resp.json();
        
        if (resp.ok && data.status === "success") {
          showNotification(data.message || "Message sent — thank you!", "success");
          form.reset();
          // Reset button
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        } else {
          showNotification((data && data.message) || "Failed to send message, please try again later.", "error");
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        console.error("Contact form error:", err);
        showNotification("Network error sending message. Please try again later.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  // Form Validation Helper
  function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required");
    }
    
    if (!data.email || data.email.trim().length === 0) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Please enter a valid email address");
    }
    
    if (!data.message || data.message.trim().length === 0) {
      errors.push("Message is required");
    } else if (data.message.trim().length < 10) {
      errors.push("Message must be at least 10 characters");
    }
    
    return errors;
  }
  
  // Notification System
  function showNotification(message, type = "info") {
    // Remove existing notification
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
  
  // Theme Toggle with Persistence
  if (themeToggle) {
    // Load saved theme preference
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
  
  // Smooth scroll to sections
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        UIUtils.smoothScrollTo(target, 100);
      }
    });
  });
  
  // Add ripple effect to buttons
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      if (e.target.classList.contains("btn")) {
        UIUtils.createRipple(this, e);
      }
    });
  });
});

// Add slide animations for notifications
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`;
document.head.appendChild(style);
