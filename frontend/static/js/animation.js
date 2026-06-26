// Diagonal Particles — fast, crisp, non-trailing animation
(function () {
  const canvas = document.getElementById('diagonal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  let particles = [];
  const config = {
    count: 120,          // number of particles
    speedMin: 220,       // px / second
    speedMax: 520,
    sizeMin: 2,
    sizeMax: 6,
    angleDeg: -35,       // diagonal angle in degrees (negative = up-right)
    colors: ['#00e09a', '#38ffc9', '#7effc0', '#b6ffdf']
  };

  function initSize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);

    // Use integer-aligned drawing in CSS pixels to avoid subpixel blur:
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function createParticles(){
    particles = new Array(config.count).fill(0).map(() => {
      const size = Math.random() * (config.sizeMax - config.sizeMin) + config.sizeMin;
      const speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
      // start at random positions across the screen
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.round(size),
        speed,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        life: Math.random() * 1 // for subtle alpha variation
      };
    });
  }

  // convert angle to vx,vy relative to pixels/sec
  const angleRad = (config.angleDeg * Math.PI) / 180;
  function step(dt){
    // clear fully each frame to avoid trailing/blur
    ctx.clearRect(0, 0, width, height);

    // draw particles
    for (let p of particles){
      // integer-align positions to prevent smear
      const ix = Math.round(p.x);
      const iy = Math.round(p.y);
      ctx.fillStyle = p.color;
      // draw a small rounded rectangle by using fillRect (crisp)
      ctx.fillRect(ix, iy, p.size, p.size);

      // update position
      const vx = Math.cos(angleRad) * p.speed * (dt / 1000);
      const vy = Math.sin(angleRad) * p.speed * (dt / 1000);
      p.x += vx;
      p.y += vy;

      // recycle when off-screen (give a margin so particles exit cleanly)
      if (p.x > width + 20 || p.x < -20 || p.y > height + 20 || p.y < -20) {
        // re-enter from the opposite side or random edge for variety
        if (Math.random() < 0.5) {
          p.x = Math.random() * width;
          p.y = (Math.random() < 0.5) ? -10 : height + 10;
        } else {
          p.x = (Math.random() < 0.5) ? -10 : width + 10;
          p.y = Math.random() * height;
        }
        p.size = Math.round(Math.random() * (config.sizeMax - config.sizeMin) + config.sizeMin);
        p.speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
        p.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      }
    }
  }

  let last = performance.now();
  let raf = null;
  function loop(now){
    const dt = Math.min(50, now - last); // cap delta to avoid jumps
    step(dt);
    last = now;
    raf = requestAnimationFrame(loop);
  }

  // Debounced resize
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initSize();
      // re-create particles proportional to size (keep config.count)
      createParticles();
    }, 120);
  });

  // initialize and start
  initSize();
  createParticles();
  raf = requestAnimationFrame(loop);

  // expose for debugging
  window.USETAI_DIAGONAL_ANIM = {
    stop: () => { if (raf) cancelAnimationFrame(raf); raf = null; },
    start: () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } },
    config, particles
  };
})();
