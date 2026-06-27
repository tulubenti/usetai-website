// Main UI wiring: theme toggle, contact form validation, counters
(function(){
  // Theme toggle persisted in localStorage
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  function applyTheme(theme){
    if (theme === 'light') root.setAttribute('data-theme','light');
    else root.removeAttribute('data-theme');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  }
  const saved = localStorage.getItem('usetai:theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(saved);
  if (themeToggle){
    themeToggle.addEventListener('click', ()=>{
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem('usetai:theme', next);
    });
  }

  // Basic contact form front-end validation + submit to /api/contact
  const form = document.getElementById('contact-form');
  if (form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const data = new FormData(form);
      const payload = {
        name: (data.get('name') || '').toString().trim(),
        email: (data.get('email') || '').toString().trim(),
        organization: (data.get('organization') || '').toString().trim(),
        industry: (data.get('industry') || '').toString().trim(),
        interest: (data.get('interest') || '').toString().trim(),
        message: (data.get('message') || '').toString().trim()
      };
      // simple validation
      if (!payload.name || !payload.email || !payload.message){
        alert('Please complete name, email and message before submitting.');
        return;
      }
      try {
        const resp = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await resp.json();
        if (resp.ok && json.ok){
          form.reset();
          alert('Thanks — your message has been sent. We will reply within two business days.');
        } else {
          alert(json.error || 'Submission failed — please try again later.');
        }
      } catch (err){
        console.error(err);
        alert('Network error — please try again later.');
      }
    });
  }

  // Lightweight animated counters (progressive enhancement)
  document.querySelectorAll('[data-counter-to]').forEach(el=>{
    const to = parseInt(el.getAttribute('data-counter-to'),10) || 0;
    let started = false;
    function animate(){
      if (started) return; started = true;
      const duration = 1200;
      const start = performance.now();
      const from = 0;
      requestAnimationFrame(function tick(now){
        const t = Math.min(1, (now - start)/duration);
        el.textContent = Math.round(from + (to - from) * t).toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
      });
    }
    // start when element is visible
    const obs = new IntersectionObserver((entries, ob)=>{
      entries.forEach(entry=>{ if (entry.isIntersecting){ animate(); ob.disconnect(); }});
    });
    obs.observe(el);
  });
})();
