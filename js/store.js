(function () {
  const App = (window.App = window.App || {});
  const KEY = 'rezonans.v1';
  App.uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  App.state = {
    profiles: [], songs: [], activeProfile: 'melodia', tab: 'today',
    settings: { gemini: '', yt: '', model: 'gemini-3.8-flash', img: 'https://rezonans-img.lewandowski-m-90.workers.dev/', ytClient: '43164945118-f2o3h3ko4vamm6oj27m2ajm8819p5okc.apps.googleusercontent.com' }
  };
  App.clone = (o) => JSON.parse(JSON.stringify(o));
  App.save = function () {
    try {
      const s = App.state;
      localStorage.setItem(KEY, JSON.stringify({ profiles: s.profiles, songs: s.songs, settings: s.settings, activeProfile: s.activeProfile }));
    } catch (e) { /* storage unavailable */ }
  };
  App.load = function () {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (raw) { try { Object.assign(App.state, JSON.parse(raw)); } catch (e) { /* ignore */ } }
    if (!App.state.profiles || !App.state.profiles.length) App.state.profiles = App.clone(App.DATA.profiles);
    if (!App.state.profiles.find((p) => p.id === App.state.activeProfile)) App.state.activeProfile = App.state.profiles[0].id;
    App.state.settings = Object.assign({ gemini: '', yt: '', model: 'gemini-3.8-flash', img: 'https://rezonans-img.lewandowski-m-90.workers.dev/', ytClient: '43164945118-f2o3h3ko4vamm6oj27m2ajm8819p5okc.apps.googleusercontent.com' }, App.state.settings || {});
  };
  App.profile = (id) => App.state.profiles.find((p) => p.id === (id || App.state.activeProfile)) || App.state.profiles[0];
  App.songsOf = (pid) => App.state.songs.filter((s) => s.profileId === (pid || App.state.activeProfile));
  App.song = (id) => App.state.songs.find((s) => s.id === id);

  /* czas */
  const DAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  App.dayName = (d) => DAYS[d.getDay()];
  App.fmtDate = (d) => d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  App.fmtDT = (iso) => { const d = new Date(iso); return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); };
  App.nextAt = function (time, from) {
    const [h, m] = (time || '18:00').split(':').map(Number);
    const d = new Date(from || Date.now());
    d.setHours(h, m, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  };
  App.countdown = function (target) {
    const ms = new Date(target).getTime() - Date.now();
    if (ms <= 0) return 'teraz';
    const min = Math.floor(ms / 60000), d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), mm = min % 60;
    if (d > 0) return d + ' d ' + h + ' godz.';
    if (h > 0) return h + ' godz. ' + mm + ' min';
    return mm + ' min';
  };
  App.toLocalInput = function (d) {
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  App.copy = async function (text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove(); return ok;
    }
  };
  App.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
})();
