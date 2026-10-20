(function () {
  const App = window.App;
  App.load();
  App.ui.renderTabs();
  App.ui.render();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {}));
    let first = !navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (first) { first = false; return; } if (!document.body.classList.contains('lock')) location.reload(); });
  }
  setInterval(() => { if (App.state.tab === 'today' && !document.body.classList.contains('lock')) App.ui.refreshBody(); }, 60000);
})();
