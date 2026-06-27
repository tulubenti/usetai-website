// Accessible tabs: supports arrow keys, Home/End, Enter/Space, hash navigation
(function(){
  const buttons = Array.from(document.querySelectorAll('.tab-button'));
  if (!buttons.length) return;
  function activate(index, setHash = true){
    buttons.forEach((b,i) => {
      const panel = document.getElementById(b.getAttribute('data-tab') + '-tab');
      const active = i === index;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
      if (panel) panel.classList.toggle('active', active);
    });
    if (setHash) {
      const tabName = buttons[index].getAttribute('data-tab');
      try { history.replaceState(null, '', `#${tabName}`); } catch(e){}
    }
  }
  function focusIndex(i){ buttons[i].focus(); }
  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', ()=> activate(idx));
    btn.addEventListener('keydown', (e) => {
      if (['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){
        e.preventDefault();
        let next = idx;
        if (e.key === 'ArrowRight') next = (idx + 1) % buttons.length;
        if (e.key === 'ArrowLeft') next = (idx - 1 + buttons.length) % buttons.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = buttons.length - 1;
        focusIndex(next);
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(idx); }
    });
  });
  // initial activation from hash if available
  const initialTab = location.hash ? location.hash.replace('#','') : null;
  const startIndex = initialTab ? buttons.findIndex(b => b.getAttribute('data-tab') === initialTab) : buttons.findIndex(b=>b.classList.contains('active'));
  activate(startIndex >= 0 ? startIndex : 0, false);
})();
