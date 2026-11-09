(function () {
  const App = window.App;
  App.errors = [];
  window.addEventListener('error', (e) => { App.errors.push({ at: new Date().toISOString(), msg: String(e.message || e.error), src: (e.filename || '').split('/').pop() + ':' + (e.lineno || '') }); if (App.errors.length > 30) App.errors.shift(); });
  window.addEventListener('unhandledrejection', (e) => { App.errors.push({ at: new Date().toISOString(), msg: String((e.reason && e.reason.message) || e.reason) }); if (App.errors.length > 30) App.errors.shift(); });
  App.load();
  if (App.db) {
    App.db.persist();
    if (App.preMigrate) App.db.put('snaps', Date.now(), { reason: 'przed aktualizacją do wersji ' + App.version, data: App.preMigrate }).catch(() => {});
    setTimeout(() => App.db.autoSnapshot(), 1500);
  }
  App.ui.renderTabs();
  App.ui.render();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {}));
    let first = !navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (first) { first = false; return; } if (!document.body.classList.contains('lock')) location.reload(); });
  }
  setInterval(() => { if (App.state.tab === 'today' && !document.body.classList.contains('lock')) App.ui.refreshBody(); }, 300000);
})();
