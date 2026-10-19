(function () {
  const buttons = Array.from(document.querySelectorAll(".tab-button[role='tab']"));
  if (!buttons.length) return;

  const panels = buttons.map((button) => document.getElementById(`${button.getAttribute("data-tab")}-tab`));
  const panelAnimationTimers = new WeakMap();

  function activate(index, setHash = true, focusPanel = false, historyMode = "replace") {
    if (!buttons[index]) return;
    buttons.forEach((button, i) => {
      const isActive = i === index;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
      const panel = panels[i];
      if (panel) {
        panel.classList.toggle("active", isActive);
        panel.classList.toggle("entering", isActive);
        panel.hidden = !isActive;
        panel.setAttribute("aria-hidden", String(!isActive));
        if (isActive) {
          const previousTimer = panelAnimationTimers.get(panel);
          if (previousTimer) clearTimeout(previousTimer);
          const nextTimer = setTimeout(() => panel.classList.remove("entering"), 350);
          panelAnimationTimers.set(panel, nextTimer);
          if (focusPanel) {
            panel.tabIndex = -1;
            panel.focus({ preventScroll: true });
          }
        }
      }
    });

    if (setHash) {
      const tabName = buttons[index].getAttribute("data-tab");
      try {
        history[`${historyMode}State`](null, "", `#${tabName}`);
      } catch (e) {}
    }

    const activeTabName = buttons[index].getAttribute("data-tab");
    document.dispatchEvent(new CustomEvent("tab:activated", { detail: { tabName: activeTabName } }));
  }

  function moveAndActivate(index) {
    buttons[index].focus();
    activate(index);
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activate(index, true, false, "push"));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowRight") return moveAndActivate((index + 1) % buttons.length);
      if (event.key === "ArrowLeft") return moveAndActivate((index - 1 + buttons.length) % buttons.length);
      if (event.key === "Home") return moveAndActivate(0);
      if (event.key === "End") return moveAndActivate(buttons.length - 1);
      activate(index, true, true);
    });
  });

  const tabLinks = document.querySelectorAll("[data-tab-link]");
  tabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const name = link.getAttribute("data-tab-link");
      const idx = buttons.findIndex((button) => button.getAttribute("data-tab") === name);
      if (idx < 0) return;
      event.preventDefault();
      activate(idx, true, false, "push");
    });
  });

  function syncFromHash() {
    const initialTab = location.hash.slice(1);
    const index = buttons.findIndex((button) => button.getAttribute("data-tab") === initialTab);
    if (index >= 0) activate(index, false);
  }

  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("popstate", syncFromHash);

  const initialTab = location.hash.slice(1);
  const startIndex = initialTab
    ? buttons.findIndex((button) => button.getAttribute("data-tab") === initialTab)
    : buttons.findIndex((button) => button.classList.contains("active"));
  activate(startIndex >= 0 ? startIndex : 0, false);
})();
