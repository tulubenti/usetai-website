/**
 * Binary Rain — streaming zeros and ones background animation
 *
 * This script renders a continuous falling stream of binary digits (0 and 1)
 * onto a full-screen canvas to create a "binary rain" background.
 *
 * Implementation notes:
 * - Uses an HTMLCanvasElement and requestAnimationFrame for smooth animation.
 * - Characters are drawn in a green palette to evoke matrix/binary styling.
 * - Resizes gracefully on window resize and adjusts to devicePixelRatio for crisp rendering.
 *
 * The canvas element must be present in the DOM with id "binary-canvas".
 *
 * Behavior tuning:
 * - change `fontSize`, `fallSpeed`, or `columns` for different visual density.
 *
 * Accessibility:
 * - Canvas is marked `aria-hidden="true"` in the HTML to avoid interfering with assistive tech.
 */

(function () {
  const canvas = document.getElementById("binary-canvas");
  if (!canvas) {
    console.warn("Binary canvas element not found (id='binary-canvas')");
    return;
  }
  const ctx = canvas.getContext("2d", { alpha: true });

  // Config
  const config = {
    baseFontSize: 18, // px at devicePixelRatio = 1
    fallSpeed: 40, // vertical speed multiplier
    columnSpacing: null, // computed from font size
    charColors: ["#7eea7b", "#5ad869", "#3cc34f", "#b7f7c1"],
    backgroundAlpha: 0.06, // clearing alpha to create trailing effect
  };

  let width, height, devicePixelRatio;
  let columns = []; // for each column track y position
  let fontSize;
  let rafId;

  function resize() {
    devicePixelRatio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.floor(width * devicePixelRatio);
    canvas.height = Math.floor(height * devicePixelRatio);

    // scale drawing context to devicePixelRatio for crisp text
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    // recompute font size and columns
    fontSize = Math.max(12, config.baseFontSize * Math.max(0.6, Math.min(1.6, width / 1200)));
    config.columnSpacing = Math.floor(fontSize * 0.9);
    const columnCount = Math.ceil(width / config.columnSpacing);

    // initialize columns with random start positions
    columns = new Array(columnCount).fill(0).map(() => {
      return {
        x: Math.floor(Math.random() * columnCount) * config.columnSpacing,
        y: Math.random() * height * -1, // start above view
        speed: (0.5 + Math.random() * 1.5) * config.fallSpeed * (fontSize / config.baseFontSize),
        hueIndex: Math.floor(Math.random() * config.charColors.length),
      };
    });

    // font settings
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
  }

  function draw() {
    // fade background slightly so characters leave a trail
    ctx.fillStyle = `rgba(0,0,0,${config.backgroundAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // draw each column's character
    columns.forEach((col) => {
      // pick 0 or 1
      const char = Math.random() > 0.5 ? "1" : "0";
      // color selection cycles with slight randomness
      const color = config.charColors[col.hueIndex];
      ctx.fillStyle = color;
      ctx.fillText(char, col.x, col.y);

      // sometimes draw a bright head character
      if (Math.random() < 0.08) {
        ctx.fillStyle = "#e9ffe9";
        ctx.fillText(char, col.x, col.y - fontSize * 0.4);
      }

      col.y += col.speed * (1 / 60); // normalize to roughly 60fps basis

      // recycle column when it passes bottom
      if (col.y > height + fontSize * 2) {
        col.y = -Math.random() * height * 0.5; // restart above the top
        col.speed = (0.5 + Math.random() * 1.5) * config.fallSpeed * (fontSize / config.baseFontSize);
        col.hueIndex = (col.hueIndex + Math.floor(Math.random() * 3)) % config.charColors.length;
      }
    });
  }

  function animate() {
    draw();
    rafId = requestAnimationFrame(animate);
  }

  // Setup and start
  window.addEventListener("resize", () => {
    // Debounce resize with a short timeout to avoid repeated heavy work
    clearTimeout(window._usetai_resize_timeout);
    window._usetai_resize_timeout = setTimeout(resize, 120);
  });

  // initial resize then start animation
  resize();
  // draw a few frames to build background quickly
  for (let i = 0; i < 4; i++) draw();
  animate();

  // Expose a simple API for debugging (optional)
  window.USETAI_BINARY_RAIN = {
    stop: () => {
      if (rafId) cancelAnimationFrame(rafId);
    },
    start: () => {
      if (!rafId) animate();
    },
    config,
  };
})();
