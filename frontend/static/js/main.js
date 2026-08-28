/**
 * Main application logic
 * Handles:
 * - Contact form submission with validation
 * - Theme toggle (light/dark mode)
 * - Form success/error feedback
 * - Accessibility announcements
 */
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const themeToggle = document.getElementById('theme-toggle');

  // ============================================
  // FORM HANDLING
  // ============================================

  if (form) {
    /**
     * Validate form field
     */
    function validateField(field) {
      const value = field.value.trim();
      let isValid = true;
      let errorMessage = '';

      if (field.name === 'name') {
        if (!value) {
          errorMessage = 'Name is required';
          isValid = false;
        } else if (value.length < 2) {
          errorMessage = 'Name must be at least 2 characters';
          isValid = false;
        }
      }

      if (field.name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errorMessage = 'Email is required';
          isValid = false;
        } else if (!emailRegex.test(value)) {
          errorMessage = 'Please enter a valid email address';
          isValid = false;
        }
      }

      if (field.name === 'message') {
        if (!value) {
          errorMessage = 'Message is required';
          isValid = false;
        } else if (value.length < 10) {
          errorMessage = 'Message must be at least 10 characters';
          isValid = false;
        }
      }

      updateFieldError(field, isValid, errorMessage);
      return isValid;
    }

    /**
     * Display validation error for a field
     */
    function updateFieldError(field, isValid, errorMessage) {
      const label = field.closest('label');
      if (!label) return;

      const errorEl = label.querySelector('.field-error');

      if (isValid) {
        field.setAttribute('aria-invalid', 'false');
        if (errorEl) errorEl.remove();
        field.classList.remove('error');
      } else {
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('error');
        if (errorEl) {
          errorEl.textContent = errorMessage;
        } else {
          const error = document.createElement('span');
          error.className = 'field-error';
          error.setAttribute('role', 'alert');
          error.textContent = errorMessage;
          label.appendChild(error);
        }
      }
    }

    /**
     * Real-time validation on input
     */
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.value.trim()) {
          validateField(field);
        }
      });
    });

    /**
     * Show form feedback message
     */
    function showFeedback(message, type = 'success') {
      const feedbackEl = form.querySelector('.form-feedback');
      if (feedbackEl) feedbackEl.remove();

      const feedback = document.createElement('div');
      feedback.className = `form-feedback form-feedback--${type}`;
      feedback.setAttribute('role', 'alert');
      feedback.innerHTML = `
        <span class="feedback-icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="feedback-text">${message}</span>
      `;
      form.insertBefore(feedback, form.firstChild);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        feedback.classList.add('fade-out');
        setTimeout(() => feedback.remove(), 300);
      }, 5000);
    }

    /**
     * Handle form submission
     */
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate all required fields
      let isFormValid = true;
      requiredFields.forEach(field => {
        if (!validateField(field)) {
          isFormValid = false;
        }
      });

      if (!isFormValid) {
        showFeedback('Please fix the errors in the form', 'error');
        return;
      }

      // Prepare form data
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(form.action || '/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          showFeedback(data.message || 'Message sent successfully!', 'success');
          form.reset();
          requiredFields.forEach(field => {
            field.setAttribute('aria-invalid', 'false');
            const errorEl = field.closest('label').querySelector('.field-error');
            if (errorEl) errorEl.remove();
          });

          if (window.UIUtils && window.UIUtils.announce) {
            window.UIUtils.announce('Your message has been sent successfully');
          }
        } else {
          showFeedback(data.message || 'Failed to send message, please try again', 'error');
        }
      } catch (error) {
        console.error('Contact form error:', error);
        showFeedback('Network error. Please try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ============================================
  // THEME TOGGLE
  // ============================================

  if (themeToggle) {
    /**
     * Initialize theme based on saved preference or system
     */
    function initializeTheme() {
      const savedTheme = localStorage.getItem('app-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

      setTheme(isDark ? 'dark' : 'light');
    }

    /**
     * Apply theme to document
     */
    function setTheme(theme) {
      const isDark = theme === 'dark';
      document.documentElement.classList.toggle('light', !isDark);
      localStorage.setItem('app-theme', theme);
      themeToggle.setAttribute('aria-pressed', isDark.toString());
      themeToggle.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }

    /**
     * Toggle theme
     */
    function toggleTheme() {
      const currentTheme = localStorage.getItem('app-theme') || 'dark';
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    themeToggle.addEventListener('click', toggleTheme);

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('app-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Initialize theme on load
    initializeTheme();
  }

  // ============================================
  // SMOOTH SCROLL FOR LINKS
  // ============================================

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const target = link.getAttribute('href');
    if (!target || target === '#') return;

    const element = document.querySelector(target);
    if (!element) return;

    e.preventDefault();

    if (window.UIUtils && window.UIUtils.smoothScrollTo) {
      window.UIUtils.smoothScrollTo(element, 80);
    } else {
      // Fallback
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ============================================
  // ANIMATIONS ON SCROLL
  // ============================================

  if (window.UIUtils && window.UIUtils.observeElements) {
    window.UIUtils.observeElements('.service-card, .initiative-card, .project-card', (entry) => {
      entry.target.style.animation = 'fadeInUp 0.6s ease-out';
    });
  }

  // Expose for debugging
  if (typeof window.APP === 'undefined') {
    window.APP = {};
  }
  window.APP.formHandler = { validateField, showFeedback };
})();

/* Form feedback styles (injected) */
if (!document.getElementById('form-feedback-styles')) {
  const style = document.createElement('style');
  style.id = 'form-feedback-styles';
  style.textContent = `
    .form-feedback {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      animation: slideDown 0.3s ease-out;
      border-left: 4px solid;
    }

    .form-feedback--success {
      background: rgba(0, 224, 154, 0.1);
      border-left-color: var(--accent-primary);
      color: var(--accent-primary);
    }

    .form-feedback--error {
      background: rgba(255, 127, 95, 0.1);
      border-left-color: #ff7f5f;
      color: #ff7f5f;
    }

    .feedback-icon {
      font-weight: bold;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .feedback-text {
      flex-grow: 1;
    }

    .form-feedback.fade-out {
      animation: slideUp 0.3s ease-out forwards;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }

    .field-error {
      display: block;
      color: #ff7f5f;
      font-size: 0.85rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    input.error,
    select.error,
    textarea.error {
      border-color: #ff7f5f !important;
      background: rgba(255, 127, 95, 0.05) !important;
    }
  `;
  document.head.appendChild(style);
}
