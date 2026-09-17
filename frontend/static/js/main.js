document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const themeToggle = document.getElementById("theme-toggle");
  const scrollTopButton = document.getElementById("scroll-top");
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  setupThemeToggle(themeToggle);
  setupAnchorLinks();
  setupButtonRipples(prefersReducedMotion);
  setupScrollTop(scrollTopButton);
  setupRevealAnimations(prefersReducedMotion);
  setupHeroParallax(prefersReducedMotion);
  setupDynamicSections(prefersReducedMotion);

  if (form) {
    setupFormEnhancements(form);
  }
});

const revealObservers = new WeakMap();

function setupDynamicSections(prefersReducedMotion) {
  [
    {
      gridId: "services-grid",
      searchId: "services-search",
      filterId: "services-filters",
      statusId: "services-status",
      resultsId: "services-results",
      retryId: "services-retry",
      endpoint: "/api/services",
      dataKey: "services",
      cardClass: "service-card",
      emptyMessage:
        "No services matched your search yet. Try a broader capability or reset the filters.",
      loadingMessage: "Loading the live services catalog…",
      fallbackMessage:
        "Live service data is temporarily unavailable. Showing the built-in catalog instead.",
      itemLabel: "services",
      renderItem: renderServiceCard,
      getTags: (item) => item.tags || [],
      matchesSearch: (item) =>
        [item.title, item.description].concat(item.bullets || [], item.tags || []).join(" "),
      skeletonCount: 4,
    },
    {
      gridId: "projects-grid",
      searchId: "projects-search",
      filterId: "projects-filters",
      statusId: "projects-status",
      resultsId: "projects-results",
      retryId: "projects-retry",
      endpoint: "/api/projects",
      dataKey: "projects",
      cardClass: "project-card",
      emptyMessage:
        "No case studies matched your search yet. Try another topic or clear the filters.",
      loadingMessage: "Loading the latest case studies…",
      fallbackMessage:
        "Live case studies are temporarily unavailable. Showing the built-in highlights instead.",
      itemLabel: "case studies",
      renderItem: renderProjectCard,
      getTags: (item) => item.tags || [],
      matchesSearch: (item) =>
        [item.title, item.summary, item.outcome].concat(item.tags || []).join(" "),
      skeletonCount: 2,
    },
  ].forEach((config) => setupDynamicSection(config, prefersReducedMotion));
}

function setupDynamicSection(config, prefersReducedMotion) {
  const grid = document.getElementById(config.gridId);
  const searchInput = document.getElementById(config.searchId);
  const filterContainer = document.getElementById(config.filterId);
  const status = document.getElementById(config.statusId);
  const results = document.getElementById(config.resultsId);
  const retryButton = document.getElementById(config.retryId);

  if (!grid || !searchInput || !filterContainer || !status || !results || !retryButton) {
    return;
  }

  const fallbackMarkup = grid.innerHTML;
  const fallbackCount = grid.querySelectorAll(`.${config.cardClass}`).length;
  let allItems = [];
  let activeTag = "All";
  let isFallbackMode = false;

  const setStatus = (message, state = "info") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const renderSkeletons = () => {
    if (prefersReducedMotion) {
      grid.classList.remove("is-loading-cards");
      return;
    }

    grid.classList.add("is-loading-cards");
    grid.innerHTML = new Array(config.skeletonCount)
      .fill("")
      .map(
        () => `
          <article class="${config.cardClass} card-skeleton" aria-hidden="true">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line medium"></div>
          </article>
        `
      )
      .join("");
  };

  const renderEmptyState = () => {
    grid.classList.remove("is-loading-cards");
    grid.innerHTML = `
      <article class="${config.cardClass} state-card">
        <h3>No matches found</h3>
        <p>${escapeHtml(config.emptyMessage)}</p>
      </article>
    `;
  };

  const syncFilterButtons = () => {
    filterContainer
      .querySelectorAll(".filter-chip")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filterTag === activeTag)
        )
      );
  };

  const renderFilters = () => {
    const tags = Array.from(
      new Set(
        allItems
          .flatMap((item) => config.getTags(item))
          .filter(Boolean)
      )
    ).slice(0, 8);
    const tagList = ["All"].concat(tags);
    filterContainer.innerHTML = tagList
      .map(
        (tag) => `
          <button
            type="button"
            class="filter-chip"
            data-filter-tag="${escapeHtml(tag)}"
            aria-pressed="${String(tag === activeTag)}"
          >
            ${escapeHtml(tag)}
          </button>
        `
      )
      .join("");

    filterContainer.querySelectorAll(".filter-chip").forEach((button) => {
      button.addEventListener("click", function () {
        activeTag = this.dataset.filterTag || "All";
        syncFilterButtons();
        updateView();
      });
    });
  };

  const updateView = () => {
    if (isFallbackMode) {
      return;
    }

    const query = normalizeText(searchInput.value);
    const filteredItems = allItems.filter((item) => {
      const matchesTag =
        activeTag === "All" || (config.getTags(item) || []).includes(activeTag);
      const matchesQuery = !query || item._searchIndex.includes(query);
      return matchesTag && matchesQuery;
    });

    results.textContent = `Showing ${filteredItems.length} of ${allItems.length} ${config.itemLabel}.`;

    if (!filteredItems.length) {
      setStatus(config.emptyMessage);
      renderEmptyState();
      return;
    }

    setStatus("");
    grid.classList.remove("is-loading-cards");
    grid.innerHTML = filteredItems.map(config.renderItem).join("");
    applyRevealState(
      grid.querySelectorAll(`.${config.cardClass}`),
      prefersReducedMotion
    );
  };

  const restoreFallback = () => {
    isFallbackMode = true;
    searchInput.disabled = true;
    filterContainer.innerHTML = "";
    grid.classList.remove("is-loading-cards");
    grid.innerHTML = fallbackMarkup;
    results.textContent = `Showing ${fallbackCount} curated ${config.itemLabel}.`;
    applyRevealState(
      grid.querySelectorAll(`.${config.cardClass}`),
      prefersReducedMotion
    );
  };

  const loadItems = async () => {
    renderSkeletons();
    retryButton.hidden = true;
    results.textContent = config.loadingMessage;
    setStatus(config.loadingMessage);

    try {
      const response = await fetch(config.endpoint, {
        headers: { Accept: "application/json" },
      });
      const payload = await readResponseData(response);

      if (!response.ok) {
        throw new Error(payload.message || `Unable to load ${config.itemLabel}.`);
      }

      if (!Array.isArray(payload[config.dataKey])) {
        throw new Error(`Invalid ${config.itemLabel} payload.`);
      }

      isFallbackMode = false;
      searchInput.disabled = false;
      allItems = payload[config.dataKey].map((item) => ({
        ...item,
        _searchIndex: normalizeText(config.matchesSearch(item)),
      }));
      activeTag = "All";
      renderFilters();

      if (!allItems.length) {
        results.textContent = `Showing 0 ${config.itemLabel}.`;
        setStatus(`No ${config.itemLabel} are available right now.`);
        renderEmptyState();
        return;
      }

      updateView();
    } catch (error) {
      console.error(`Failed to load ${config.itemLabel}:`, error);
      restoreFallback();
      setStatus(config.fallbackMessage, "error");
      retryButton.hidden = false;
    }
  };

  searchInput.addEventListener(
    "input",
    window.UIUtils && window.UIUtils.debounce
      ? window.UIUtils.debounce(updateView, 120)
      : updateView
  );
  retryButton.addEventListener("click", loadItems);

  loadItems();
}

function setupFormEnhancements(form) {
  const submitBtn =
    form.querySelector("#contact-submit") || form.querySelector('button[type="submit"]');
  const fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]'),
  };
  const requiredFields = ["name", "email", "message"];
  const progressBar = document.getElementById("form-progress-bar");
  const charCount = document.getElementById("message-char-count");
  const statusRegion = document.getElementById("form-status");
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

  const contactPanel = form.closest(".tab-content");
  const focusNameField = () => {
    if (fields.name && contactPanel && contactPanel.classList.contains("active")) {
      fields.name.focus();
    }
  };
  focusNameField();
  document.addEventListener("tab:activated", (event) => {
    if (event.detail && event.detail.tabName === "contact") {
      focusNameField();
    }
  });

  const announceMessage = (message, priority = "polite") => {
    if (window.UIUtils && message) {
      window.UIUtils.announce(message, priority);
    }
  };

  const validateField = (fieldName, options = {}) => {
    const field = fields[fieldName];
    const feedback = form.querySelector(`[data-feedback-for="${fieldName}"]`);
    const label = field ? field.closest("label") : null;
    if (!field) return true;

    const value = field.value.trim();
    let message = "";

    if (fieldName === "name" && !value) message = "Name is required.";
    if (fieldName === "email" && !value) message = "Email is required.";
    if (fieldName === "email" && value && !emailPattern.test(value)) {
      message = "Please enter a valid email address.";
    }
    if (fieldName === "message" && !value) message = "Message is required.";
    if (fieldName === "message" && value && value.length < 10) {
      message = "Message must be at least 10 characters.";
    }

    const isValid = message.length === 0;
    field.classList.toggle("is-invalid", !isValid);
    field.classList.toggle("is-valid", isValid && value.length > 0);
    field.setAttribute("aria-invalid", String(!isValid));
    if (label) label.classList.toggle("is-valid", isValid && value.length > 0);

    if (feedback) {
      feedback.textContent = message;
      feedback.classList.toggle("visible", !isValid);
    }

    if (!isValid && options.announce) {
      announceMessage(message, "assertive");
    }

    return isValid;
  };

  const updateFormState = () => {
    const allValid = requiredFields.every((fieldName) => validateField(fieldName));
    const filledCount = requiredFields.filter(
      (key) => fields[key] && fields[key].value.trim().length > 0
    ).length;
    if (progressBar) progressBar.style.width = `${(filledCount / 3) * 100}%`;
    if (submitBtn) submitBtn.disabled = !allValid;
    return allValid;
  };

  const clearValidationUI = () => {
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      if (!field) return;
      field.classList.remove("is-invalid", "is-valid");
      field.setAttribute("aria-invalid", "false");
      const label = field.closest("label");
      if (label) label.classList.remove("is-valid");
      const feedback = form.querySelector(`[data-feedback-for="${fieldName}"]`);
      if (feedback) {
        feedback.textContent = "";
        feedback.classList.remove("visible");
      }
    });
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
      if (statusRegion) {
        statusRegion.textContent =
          "Please fix the highlighted fields before submitting.";
      }
      announceMessage(
        "Please fix the highlighted fields before submitting the form.",
        "assertive"
      );
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : "";
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    let wasSuccessful = false;

    form.setAttribute("aria-busy", "true");
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
      const data = await readResponseData(resp);

      if (resp.ok && data.status === "success") {
        showNotification(data.message || "Message sent — thank you!", "success");
        if (statusRegion) statusRegion.textContent = "Form submitted successfully.";
        announceMessage("Your message was sent successfully.");
        form.reset();
        if (charCount) charCount.textContent = "0 / 1000";
        if (progressBar) progressBar.style.width = "0%";
        clearValidationUI();
        if (submitBtn) submitBtn.disabled = true;
        wasSuccessful = true;
      } else {
        showNotification(
          (data && data.message) ||
            "Failed to send message, please try again later.",
          "error"
        );
        if (statusRegion) statusRegion.textContent = "Failed to submit form.";
        announceMessage(
          (data && data.message) || "Failed to submit the form.",
          "assertive"
        );
      }
    } catch (err) {
      console.error("Contact form error:", err);
      showNotification(
        "Network error sending message. Please try again later.",
        "error"
      );
      if (statusRegion) statusRegion.textContent = "Network error while submitting form.";
      announceMessage(
        "A network error prevented the form from being submitted.",
        "assertive"
      );
    } finally {
      form.setAttribute("aria-busy", "false");
      if (submitBtn) {
        submitBtn.classList.remove("is-loading");
        submitBtn.textContent = originalText;
      }
      if (!wasSuccessful) updateFormState();
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

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("is-exiting");
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function setupThemeToggle(themeToggle) {
  if (!themeToggle) return;
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme, themeToggle);

  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
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
        window.UIUtils.smoothScrollTo(target, 100);
      }
    });
  });
}

function setupButtonRipples(prefersReducedMotion) {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.classList.remove("ripple-active");
      window.requestAnimationFrame(() => this.classList.add("ripple-active"));
      window.setTimeout(() => this.classList.remove("ripple-active"), 450);
    });
  });
}

function setupRevealAnimations(prefersReducedMotion) {
  document
    .querySelectorAll(".services-grid, .initiatives-grid, .projects-grid")
    .forEach((container) => {
      applyRevealState(
        container.querySelectorAll(
          ".service-card, .initiative-card, .project-card"
        ),
        prefersReducedMotion,
        container
      );
    });
}

function applyRevealState(elements, prefersReducedMotion, observerKey) {
  const revealTargets = Array.from(elements || []);
  revealTargets.forEach((el, index) => {
    el.classList.add("reveal-item");
    el.style.setProperty("--stagger-delay", `${(index % 4) * 80}ms`);
  });

  if (prefersReducedMotion || !window.UIUtils) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  revealTargets.forEach((el) => el.classList.remove("is-visible"));
  if (!window.IntersectionObserver) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const existingObserver = observerKey && revealObservers.get(observerKey);
  if (existingObserver) {
    existingObserver.disconnect();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  if (observerKey) {
    revealObservers.set(observerKey, observer);
  }

  revealTargets.forEach((el) => observer.observe(el));
}

function setupHeroParallax(prefersReducedMotion) {
  if (prefersReducedMotion || !window.UIUtils) return;
  const root = document.documentElement;
  const updateParallax = () => {
    const offset = Math.min(window.scrollY * 0.2, 30);
    root.style.setProperty("--parallax-offset", `${offset}px`);
  };
  const onScroll = window.UIUtils.rafThrottle(updateParallax);
  window.addEventListener("scroll", onScroll, { passive: true });
  updateParallax();
}

function setupScrollTop(button) {
  if (!button || !window.UIUtils) return;
  const toggle = () => button.classList.toggle("visible", window.scrollY > 400);
  const onScroll = window.UIUtils.rafThrottle(toggle);
  window.addEventListener("scroll", onScroll, { passive: true });
  toggle();

  button.addEventListener("click", () => {
    window.UIUtils.smoothScrollTo(document.body, 0);
  });
}

function renderServiceCard(item) {
  const bullets = Array.isArray(item.bullets) && item.bullets.length
    ? `<ul>${item.bullets
        .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
        .join("")}</ul>`
    : "";

  return `
    <article class="service-card" id="${escapeHtml(item.id || "")}">
      <h3>${escapeHtml(item.title || "")}</h3>
      <p>${escapeHtml(item.description || "")}</p>
      ${renderTags(item.tags, "Service focus areas")}
      ${bullets}
    </article>
  `;
}

function renderProjectCard(item) {
  return `
    <article class="project-card" id="${escapeHtml(item.id || "")}">
      <h3>${escapeHtml(item.title || "")}</h3>
      <p>${escapeHtml(item.summary || "")}</p>
      ${
        item.outcome
          ? `<p class="card-outcome">${escapeHtml(item.outcome)}</p>`
          : ""
      }
      ${renderTags(item.tags, "Case study topics")}
    </article>
  `;
}

function renderTags(tags, label) {
  if (!Array.isArray(tags) || !tags.length) return "";
  return `
    <div class="card-tags" aria-label="${escapeHtml(label)}">
      ${tags
        .map((tag) => `<span class="tag-badge">${escapeHtml(tag)}</span>`)
        .join("")}
    </div>
  `;
}

async function readResponseData(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const fallbackResponse = response.clone();

    try {
      return await response.json();
    } catch (error) {
      const text = await fallbackResponse.text();
      return { message: text.trim() || "Invalid JSON response" };
    }
  }

  const text = await response.text();
  return { message: text.trim() };
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
