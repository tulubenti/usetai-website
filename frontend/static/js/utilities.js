/**
 * Utility functions for enhanced interactivity and effects
 */

const UIUtils = (() => {
  'use strict';

  /**
   * Smooth scroll to element with optional offset
   */
  const smoothScrollTo = (target, offset = 60) => {
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    if (!target) return;
    
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  /**
   * Add ripple effect to elements
   */
  const createRipple = (element, event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      top: ${y}px;
      left: ${x}px;
      pointer-events: none;
      animation: rippleEffect 600ms ease-out;
    `;
    
    if (element.style.position !== 'absolute' && element.style.position !== 'relative') {
      element.style.position = 'relative';
    }
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  };

  /**
   * Debounce function for resize/scroll events
   */
  const debounce = (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  /**
   * Throttle function using requestAnimationFrame for scroll/paint-heavy handlers
   */
  const rafThrottle = (func) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        func(...args);
        ticking = false;
      });
    };
  };

  /**
   * Throttle function for high-frequency events
   */
  const throttle = (func, limit = 300) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  /**
   * Observe elements for visibility (lazy loading)
   */
  const observeElements = (selector, callback, options = {}) => {
    if (!window.IntersectionObserver) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, ...options });
    
    document.querySelectorAll(selector).forEach(el => observer.observe(el));
    return observer;
  };

  /**
   * Detect if element is in viewport
   */
  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0
    );
  };

  /**
   * Get computed CSS variable value
   */
  const getCSSVariable = (variable) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  /**
   * Set CSS variable value
   */
  const setCSSVariable = (variable, value) => {
    document.documentElement.style.setProperty(variable, value);
  };

  /**
   * Animate counter numbers
   */
  const animateCounter = (element, target, duration = 1000) => {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  };

  /**
   * Announce to screen readers
   */
  const announce = (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  /**
   * Copy to clipboard with feedback
   */
  const copyToClipboard = (text, feedbackElement = null) => {
    return navigator.clipboard.writeText(text).then(() => {
      if (feedbackElement) {
        const original = feedbackElement.textContent;
        feedbackElement.textContent = 'Copied!';
        setTimeout(() => {
          feedbackElement.textContent = original;
        }, 2000);
      }
      announce('Copied to clipboard');
      return true;
    }).catch(() => {
      announce('Failed to copy', 'assertive');
      return false;
    });
  };

  return {
    smoothScrollTo,
    createRipple,
    debounce,
    rafThrottle,
    throttle,
    observeElements,
    isInViewport,
    getCSSVariable,
    setCSSVariable,
    animateCounter,
    announce,
    copyToClipboard
  };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIUtils;
}
