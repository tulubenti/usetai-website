// Diagonal Particles — density, palette, and additive glow tuned for a high-tech AI/ML look
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('diagonal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  let particles = [];

  // Tweakable controls:
  const controls = {
    densityMultiplier: 0.65,    // 0.0 to ~1.2 (lower = fewer particles)
    minCount: 28,
    maxCount: 260,
    speedMin: 110,
    speedMax: 380,
    sizeMin: 0.8,
    sizeMax: 5.5,
    angleDeg: -35,
    palette: [
      'rgba(0,224,154,0.95)',
      'rgba(56,255,201,0.88)',
      'rgba(107,227,255,0.82)',
      'rgba(120,130,255,0.62)',
      'rgba(180,100,255,0.42)'
    ],
    trailAlpha: 0.16,          // background cover alpha (lower = longer trails)
    maxShadow: 28
  };

  function computeCount() {
    const base = Math.floor((width * height) / (1280 * 720) * 120 * controls.densityMultiplier);
    return Math.max(controls.minCount, Math.min(controls.maxCount, base));
  }

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

  function createParticles() {
    const count = computeCount();
    particles = new Array(count).fill(0).map(() => {
      const size = Math.random() * (controls.sizeMax - controls.sizeMin) + controls.sizeMin;
      const speed = Math.random() * (controls.speedMax - controls.speedMin) + controls.speedMin;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.max(0.6, size),
        speed,
        color: controls.palette[Math.floor(Math.random() * controls.palette.length)],
        alpha: 0.6 + Math.random() * 0.35,
        rot: Math.random() * Math.PI * 2
      };
    });
  }

  const angleRad = (controls.angleDeg * Math.PI) / 180;

  function step(dt) {
    // gentle cover fill for trailing effect
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(6,10,18,${controls.trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // set additive for glowing particles
    ctx.globalCompositeOperation = 'lighter';

    for (let p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = Math.min(controls.maxShadow, p.size * 4);
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const vx = Math.cos(angleRad) * p.speed * (dt / 1000);
      const vy = Math.sin(angleRad) * p.speed * (dt / 1000);
      p.x += vx;
      p.y += vy;

      if (p.x > width + 60 || p.x < -60 || p.y > height + 60 || p.y < -60) {
        if (Math.random() < 0.65) {
          p.x = Math.random() * width;
          p.y = (Math.random() < 0.5) ? -20 : height + 20;
        } else {
          p.x = (Math.random() < 0.5) ? -20 : width + 20;
          p.y = Math.random() * height;
        }
        p.alpha = 0.55 + Math.random() * 0.4;
      }
    }

    // reset composite op to default for other drawing
    ctx.globalCompositeOperation = 'source-over';
  }

  let last = performance.now(), raf = null;
  function loop(now) {
    const dt = Math.min(60, now - last);
    step(dt);
    last = now;
    raf = requestAnimationFrame(loop);
  }

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initSize();
      createParticles();
    }, 140);
  });

  initSize();
  createParticles();
  raf = requestAnimationFrame(loop);

  window.USETAI_DIAGONAL_ANIM = {
    stop: () => { if (raf) cancelAnimationFrame(raf); raf = null; },
    start: () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } },
    setDensity: (v) => { controls.densityMultiplier = Math.max(0, Number(v) || 0.5); createParticles(); },
    setPalette: (arr) => { if (Array.isArray(arr) && arr.length) controls.palette = arr; createParticles(); }
  };
})();
