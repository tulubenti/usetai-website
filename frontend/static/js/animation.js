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
    speedMin: 160,
    speedMax: 420,
    sizeMin: 1,
    sizeMax: 6,
    angleDeg: -35,
    colors: ['rgba(0,224,154,0.95)', 'rgba(56,255,201,0.9)', 'rgba(107,227,255,0.85)', 'rgba(60,120,255,0.65)']
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
    ctx.imageSmoothingEnabled = true;
  }

  function createParticles(){
    particles = new Array(config.count).fill(0).map(() => {
      const size = Math.random() * (config.sizeMax - config.sizeMin) + config.sizeMin;
      const speed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
      return { x: Math.random()*width, y: Math.random()*height, size:Math.round(size)+0.5, speed, color: config.colors[Math.floor(Math.random()*config.colors.length)], alpha: 0.8 + Math.random()*0.2 };
    });
  }

  const angleRad = (config.angleDeg * Math.PI)/180;
  function step(dt){
    // gentle clear to create trailing impression
    ctx.fillStyle = 'rgba(5,8,15,0.18)';
    ctx.fillRect(0,0,width,height);

    for (let p of particles){
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = Math.min(20, p.size * 3);
      ctx.shadowColor = p.color;
      // draw glowing particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      const vx = Math.cos(angleRad) * p.speed * (dt/1000);
      const vy = Math.sin(angleRad) * p.speed * (dt/1000);
      p.x += vx; p.y += vy;
      if (p.x > width + 40 || p.x < -40 || p.y > height + 40 || p.y < -40){
        // respawn along edge with some bias
        if (Math.random() < 0.6){ p.x = Math.random()*width; p.y = (Math.random()<0.5)? -20 : height + 20; }
        else { p.x = (Math.random() < 0.5) ? -20 : width + 20; p.y = Math.random()*height; }
        p.alpha = 0.7 + Math.random()*0.3;
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

  window.USETAI_DIAGONAL_ANIM = { stop: () => { if (raf) cancelAnimationFrame(raf); raf = null; }, start: () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } } };
})();
