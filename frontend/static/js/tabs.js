// Simple accessible tabs implementation
(function(){
  const buttons = document.querySelectorAll('.tab-button');
  function activate(button){
    buttons.forEach(b=>{
      const tab = b.getAttribute('data-tab');
      const panel = document.getElementById(tab + '-tab');
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-selected', String(b === button));
      if (panel) panel.classList.toggle('active', b === button);
    });
  }
  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=> activate(btn));
    btn.addEventListener('keydown', (e)=>{
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
        const idx = Array.from(buttons).indexOf(btn);
        const next = (e.key === 'ArrowRight') ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(btn); }
    });
  });
  // ensure initial state
  const initial = document.querySelector('.tab-button.active') || buttons[0];
  if (initial) activate(initial);
})();
