// Diagonal Particles — performance-conscious, respects reduced motion
(function () {
  // Respect user reduced-motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('diagonal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  let particles = [];
  const config = {
    count: Math.max(40, Math.floor((window.innerWidth * window.innerHeight) / (1280*720) * 120)), // scale by viewport
    speedMin: 220,
    speedMax: 520,
    sizeMin: 1,
    sizeMax: 6,
    angleDeg: -35,
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
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function createParticles(){
    particles = new Array(config.count).fill(0).map(() => {
      const size = Math.random() * (config.sizeMax - config.sizeMin) + config.sizeMin;
      const speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
      return { x: Math.random()*width, y: Math.random()*height, size:Math.round(size), speed, color: config.colors[Math.floor(Math.random()*config.colors.length)] };
    });
  }

  const angleRad = (config.angleDeg * Math.PI)/180;
  function step(dt){
    ctx.clearRect(0,0,width,height);
    for (let p of particles){
      const ix = Math.round(p.x), iy = Math.round(p.y);
      ctx.fillStyle = p.color;
      ctx.fillRect(ix, iy, p.size, p.size);
      const vx = Math.cos(angleRad) * p.speed * (dt/1000);
      const vy = Math.sin(angleRad) * p.speed * (dt/1000);
      p.x += vx; p.y += vy;
      if (p.x > width + 20 || p.x < -20 || p.y > height + 20 || p.y < -20){
        if (Math.random() < 0.5){ p.x = Math.random()*width; p.y = (Math.random()<0.5)? -10 : height + 10; }
        else { p.x = (Math.random() < 0.5) ? -10 : width + 10; p.y = Math.random()*height; }
      }
    }
  }

  let last = performance.now(), raf = null;
  function loop(now){
    const dt = Math.min(50, now - last);
    step(dt);
    last = now;
    raf = requestAnimationFrame(loop);
  }

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(()=>{ initSize(); createParticles(); }, 120);
  });

  initSize();
  createParticles();
  raf = requestAnimationFrame(loop);

  window.USETAI_DIAGONAL_ANIM = { stop: () => { if (raf) cancelAnimationFrame(raf); raf = null; }, start: () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }, config, particles };
})();
