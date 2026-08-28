/**
 * Enhanced Tab Navigation System
 * Supports keyboard navigation, hash routing, smooth transitions, and accessibility
 */
(function () {
  'use strict';

  const buttons = Array.from(document.querySelectorAll('.tab-button'));
  if (!buttons.length) return;

  /**
   * Activate a tab by index
   */
  function activate(index, setHash = true) {
    if (index < 0 || index >= buttons.length) return;

    buttons.forEach((btn, i) => {
      const tabName = btn.getAttribute('data-tab');
      const panel = document.getElementById(tabName + '-tab');
      const isActive = i === index;

      // Update button state
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      btn.tabIndex = isActive ? 0 : -1;

      // Update panel visibility
      if (panel) {
        panel.classList.toggle('active', isActive);
        panel.setAttribute('aria-hidden', String(!isActive));
      }
    });

    // Update URL hash
    if (setHash) {
      const tabName = buttons[index].getAttribute('data-tab');
      try {
        history.replaceState(null, '', `#${tabName}`);
      } catch (e) {
        // Ignore errors in browsers that don't support history.replaceState
      }
    }

    // Announce to screen readers
    if (window.UIUtils && window.UIUtils.announce) {
      const tabName = buttons[index].getAttribute('data-tab');
      window.UIUtils.announce(`Switched to ${tabName} tab`);
    }
  }

  /**
   * Focus a tab button by index
   */
  function focusIndex(i) {
    if (i >= 0 && i < buttons.length) {
      buttons[i].focus();
    }
  }

  /**
   * Handle click events
   */
  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      activate(idx);
    });
  });

  /**
   * Handle keyboard navigation
   * Supports: ArrowLeft, ArrowRight, Home, End
   */
  buttons.forEach((btn, idx) => {
    btn.addEventListener('keydown', (e) => {
      let nextIndex = idx;
      let handled = false;

      if (e.key === 'ArrowRight') {
        nextIndex = (idx + 1) % buttons.length;
        handled = true;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (idx - 1 + buttons.length) % buttons.length;
        handled = true;
      } else if (e.key === 'Home') {
        nextIndex = 0;
        handled = true;
      } else if (e.key === 'End') {
        nextIndex = buttons.length - 1;
        handled = true;
      } else if (e.key === 'Enter' || e.key === ' ') {
        activate(idx);
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        if (nextIndex !== idx) {
          focusIndex(nextIndex);
        }
      }
    });
  });

  /**
   * Initialize from URL hash or default to first tab
   */
  function initializeFromHash() {
    const hash = location.hash ? location.hash.slice(1) : null;
    let startIndex = 0;

    if (hash) {
      startIndex = buttons.findIndex(btn => btn.getAttribute('data-tab') === hash);
      if (startIndex === -1) startIndex = 0;
    } else {
      startIndex = buttons.findIndex(btn => btn.classList.contains('active'));
      if (startIndex === -1) startIndex = 0;
    }

    activate(startIndex, false);
  }

  /**
   * Handle hash changes (when user navigates back/forward)
   */
  window.addEventListener('hashchange', () => {
    initializeFromHash();
  });

  // Initialize on load
  initializeFromHash();

  // Expose API for external control
  window.TabSystem = {
    activate,
    focusIndex,
    getCurrentTabIndex: () => buttons.findIndex(btn => btn.classList.contains('active')),
    goToTab: (tabName) => {
      const idx = buttons.findIndex(btn => btn.getAttribute('data-tab') === tabName);
      if (idx !== -1) activate(idx);
    }
  };
})();
