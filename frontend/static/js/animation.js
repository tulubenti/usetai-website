// Diagonal Particles — AI/ML enhanced visual: pulsing nodes, neural links, and subtle flow field
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('diagonal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const config = {
    densityMultiplier: 0.5, // 0.2..1.2
    minCount: 18,
    maxCount: 380,
    speedMin: 60,
    speedMax: 420,
    sizeMin: 0.6,
    sizeMax: 7,
    angleDeg: -34,
    palette: [
      'rgba(0,224,154,0.95)',
      'rgba(56,255,201,0.88)',
      'rgba(107,227,255,0.82)',
      'rgba(140,120,255,0.64)',
      'rgba(200,110,255,0.42)'
    ],
    trailAlpha: 0.12,
    maxShadow: 34,
    linkDistance: 140,
    maxLinksPerParticle: 4,
    linkWidth: 1.0,
    linkBaseOpacity: 0.14,
    fieldStrength: 0.14 // subtle flow field influence
  };

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  let particles = [];

  function computeCount() {
    const base = Math.floor((width * height) / (1280 * 720) * 120 * config.densityMultiplier);
    return Math.max(config.minCount, Math.min(config.maxCount, base));
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

  function rand(a, b) { return Math.random() * (b - a) + a; }

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

  // Simple pseudo-flow field using sin/cos (cheap alternative to noise libs)
  function flowField(x, y, t) {
    // Combine a few sin/cos patterns for complexity
    const nx = x / 300;
    const ny = y / 300;
    const s1 = Math.sin((nx + t * 0.0006) * 2.2 + ny * 1.3);
    const s2 = Math.cos((ny - t * 0.00045) * 1.9 + nx * 1.1);
    const s3 = Math.sin((nx + ny) * 1.4 + t * 0.0003);
    return { fx: (s1 + s3 * 0.6) * 0.5, fy: (s2 + s3 * 0.4) * 0.5 };
  }

  function rgbaBlend(c1, c2, t, overrideAlpha) {
    try {
      const p = /rgba?\(([^)]+)\)/;
      const m1 = c1.match(p)[1].split(',').map(s => parseFloat(s));
      const m2 = c2.match(p)[1].split(',').map(s => parseFloat(s));
      const r = Math.round(m1[0] * (1 - t) + m2[0] * t);
      const g = Math.round(m1[1] * (1 - t) + m2[1] * t);
      const b = Math.round(m1[2] * (1 - t) + m2[2] * t);
      const a1 = (m1.length > 3) ? m1[3] : 1; const a2 = (m2.length > 3) ? m2[3] : 1;
      const a = overrideAlpha !== undefined ? overrideAlpha : (a1 * (1 - t) + a2 * t);
      return `rgba(${r},${g},${b},${a})`;
    } catch (e) { return c1; }
  }

  const angleRad = (config.angleDeg * Math.PI) / 180;

  function step(dt, now) {
    // trailing background cover (longer trails for elegance)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(6,10,18,${config.trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // additive glow for particles and links
    ctx.globalCompositeOperation = 'lighter';

    // update and draw particles
    for (let p of particles) {
      // apply flow field influence
      const f = flowField(p.x, p.y, now);
      p.vx = Math.cos(angleRad) * p.speed * (dt / 1000) + f.fx * config.fieldStrength * p.speed * 0.6 + p.driftX * 6 * (dt / 1000);
      p.vy = Math.sin(angleRad) * p.speed * (dt / 1000) + f.fy * config.fieldStrength * p.speed * 0.6 + p.driftY * 6 * (dt / 1000);
      p.x += p.vx; p.y += p.vy;

      // subtle pulsing to convey 'alive' nodes
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

      // respawn logic
      if (p.x > width + 90 || p.x < -90 || p.y > height + 90 || p.y < -90) {
        if (Math.random() < 0.72) { p.x = Math.random() * width; p.y = (Math.random() < 0.5) ? -40 : height + 40; }
        else { p.x = (Math.random() < 0.5) ? -40 : width + 40; p.y = Math.random() * height; }
        p.alpha = rand(0.35, 0.95);
      }
    }

    // draw neural links (limited per particle) with gradient blending
    ctx.lineWidth = config.linkWidth;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      let links = 0;
      // sample a reasonable neighbor window for performance
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

    // restore default composite
    ctx.globalCompositeOperation = 'source-over';
  }

  let last = performance.now(), raf = null;
  function loop(now) {
    const dt = Math.min(60, now - last);
    step(dt, now);
    last = now;
    raf = requestAnimationFrame(loop);
  }

  let resizeTimeout = null;
  window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { initSize(); createParticles(); }, 160); });

  // init
  initSize();
  createParticles();
  raf = requestAnimationFrame(loop);

  // runtime API
  window.USETAI_DIAGONAL_ANIM = {
    stop: () => { if (raf) cancelAnimationFrame(raf); raf = null; },
    start: () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } },
    setDensity: (v) => { config.densityMultiplier = Math.max(0, Number(v) || config.densityMultiplier); createParticles(); },
    setLinks: (d) => { config.linkDistance = Number(d) || config.linkDistance; },
    setPalette: (arr) => { if (Array.isArray(arr) && arr.length) config.palette = arr; createParticles(); }
  };
})();
