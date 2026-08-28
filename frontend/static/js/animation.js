/**
 * Enhanced Diagonal Particles Animation
 * Features:
 * - Pulsing nodes with neural network links
 * - Subtle flow field influence
 * - Responsive particle density
 * - Performance optimizations
 * - Reduced motion support
 */
(function () {
  'use strict';

  // Skip animation if user prefers reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const canvas = document.getElementById('diagonal-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  /**
   * Configuration object
   */
  const config = {
    // Density multiplier: 0.2 = sparse, 1.2 = dense
    densityMultiplier: 0.5,
    minCount: 20,
    maxCount: 400,
    speedMin: 60,
    speedMax: 420,
    sizeMin: 0.6,
    sizeMax: 7,
    angleDeg: -34,
    // Color palette
    palette: [
      'rgba(0, 224, 154, 0.95)',      // Accent primary
      'rgba(56, 255, 201, 0.88)',     // Accent secondary
      'rgba(107, 227, 255, 0.82)',    // Accent tertiary
      'rgba(140, 120, 255, 0.64)',    // Accent purple
      'rgba(255, 126, 95, 0.42)'      // Accent warm
    ],
    trailAlpha: 0.12,
    maxShadow: 34,
    linkDistance: 140,
    maxLinksPerParticle: 4,
    linkWidth: 1.0,
    linkBaseOpacity: 0.14,
    fieldStrength: 0.14 // Subtle flow field influence
  };

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  let particles = [];

  /**
   * Compute optimal particle count based on screen size
   */
  function computeCount() {
    const base = Math.floor((width * height) / (1280 * 720) * 120 * config.densityMultiplier);
    return Math.max(config.minCount, Math.min(config.maxCount, base));
  }

  /**
   * Initialize or reinitialize canvas size
   */
  function initSize() {
    DPR = Math.max(1, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  /**
   * Random number between min and max
   */
  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  /**
   * Create particle array
   */
  function createParticles() {
    const count = computeCount();
    particles = new Array(count).fill(0).map(() => {
      const size = rand(config.sizeMin, config.sizeMax);
      const speed = rand(config.speedMin, config.speedMax);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.max(0.4, size),
        speed,
        color: config.palette[Math.floor(Math.random() * config.palette.length)],
        alpha: rand(0.35, 0.95),
        phase: Math.random() * Math.PI * 2,
        vx: 0,
        vy: 0,
        driftX: rand(-0.9, 0.9),
        driftY: rand(-0.9, 0.9)
      };
    });
  }

  /**
   * Pseudo-flow field using sin/cos patterns
   */
  function flowField(x, y, t) {
    const nx = x / 300;
    const ny = y / 300;
    const s1 = Math.sin((nx + t * 0.0006) * 2.2 + ny * 1.3);
    const s2 = Math.cos((ny - t * 0.00045) * 1.9 + nx * 1.1);
    const s3 = Math.sin((nx + ny) * 1.4 + t * 0.0003);
    return {
      fx: (s1 + s3 * 0.6) * 0.5,
      fy: (s2 + s3 * 0.4) * 0.5
    };
  }

  /**
   * Blend two RGBA colors
   */
  function rgbaBlend(c1, c2, t, overrideAlpha) {
    try {
      const p = /rgba?\(([^)]+)\)/;
      const m1 = c1.match(p)[1].split(',').map(s => parseFloat(s));
      const m2 = c2.match(p)[1].split(',').map(s => parseFloat(s));
      const r = Math.round(m1[0] * (1 - t) + m2[0] * t);
      const g = Math.round(m1[1] * (1 - t) + m2[1] * t);
      const b = Math.round(m1[2] * (1 - t) + m2[2] * t);
      const a1 = (m1.length > 3) ? m1[3] : 1;
      const a2 = (m2.length > 3) ? m2[3] : 1;
      const a = overrideAlpha !== undefined ? overrideAlpha : (a1 * (1 - t) + a2 * t);
      return `rgba(${r},${g},${b},${a})`;
    } catch (e) {
      return c1;
    }
  }

  const angleRad = (config.angleDeg * Math.PI) / 180;

  /**
   * Main animation step
   */
  function step(dt, now) {
    // Trailing background for motion blur effect
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(10, 14, 39, ${config.trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // Use additive blending for particle glow
    ctx.globalCompositeOperation = 'lighter';

    // Update and draw particles
    for (let p of particles) {
      // Apply flow field influence
      const f = flowField(p.x, p.y, now);
      p.vx = Math.cos(angleRad) * p.speed * (dt / 1000) +
             f.fx * config.fieldStrength * p.speed * 0.6 +
             p.driftX * 6 * (dt / 1000);
      p.vy = Math.sin(angleRad) * p.speed * (dt / 1000) +
             f.fy * config.fieldStrength * p.speed * 0.6 +
             p.driftY * 6 * (dt / 1000);
      p.x += p.vx;
      p.y += p.vy;

      // Subtle pulsing to convey 'alive' nodes
      const pulse = 1 + 0.12 * Math.sin((now / 700) + p.phase);
      const r = Math.max(0.35, p.size * pulse);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = Math.min(config.maxShadow, r * 5.0);
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Respawn particles that exit the viewport
      if (p.x > width + 90 || p.x < -90 || p.y > height + 90 || p.y < -90) {
        if (Math.random() < 0.72) {
          p.x = Math.random() * width;
          p.y = (Math.random() < 0.5) ? -40 : height + 40;
        } else {
          p.x = (Math.random() < 0.5) ? -40 : width + 40;
          p.y = Math.random() * height;
        }
        p.alpha = rand(0.35, 0.95);
      }
    }

    // Draw neural links between nearby particles
    ctx.lineWidth = config.linkWidth;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      let links = 0;
      // Sample a reasonable neighbor window for performance
      for (let j = i + 1; j < particles.length && links < config.maxLinksPerParticle; j++) {
        const b = particles[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < (config.linkDistance * config.linkDistance)) {
          const d = Math.sqrt(d2);
          const t = 1 - (d / config.linkDistance);
          const opa = config.linkBaseOpacity * t * (a.alpha + b.alpha) * 0.6;
          ctx.strokeStyle = rgbaBlend(a.color, b.color, 0.5, opa);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          links++;
        }
      }
    }

    // Restore default composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  let last = performance.now(), raf = null;

  /**
   * Animation loop
   */
  function loop(now) {
    const dt = Math.min(60, now - last);
    step(dt, now);
    last = now;
    raf = requestAnimationFrame(loop);
  }

  /**
   * Handle window resize
   */
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initSize();
      createParticles();
    }, 160);
  });

  // Initialize
  initSize();
  createParticles();
  raf = requestAnimationFrame(loop);

  /**
   * Public API for controlling animation
   */
  window.USETAI_DIAGONAL_ANIM = {
    stop: () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
    start: () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    },
    setDensity: (v) => {
      config.densityMultiplier = Math.max(0, Number(v) || config.densityMultiplier);
      createParticles();
    },
    setLinks: (d) => {
      config.linkDistance = Number(d) || config.linkDistance;
    },
    setPalette: (arr) => {
      if (Array.isArray(arr) && arr.length) config.palette = arr;
      createParticles();
    },
    getConfig: () => ({ ...config }),
    updateConfig: (newConfig) => {
      Object.assign(config, newConfig);
      createParticles();
    }
  };
})();
