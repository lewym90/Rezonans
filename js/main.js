(function () {
  const App = window.App;
  App.load();
  App.ui.renderTabs();
  App.ui.render();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  setInterval(() => { if (App.state.tab === 'today' && !document.body.classList.contains('lock')) App.ui.refreshBody(); }, 60000);
})();
