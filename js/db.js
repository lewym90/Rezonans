/* Fundament danych: IndexedDB (pliki audio, automatyczne kopie), wersja schematu z migracjami, eksport i import całości. */
(function () {
  const App = window.App;
  const DB = (App.db = {});
  const NAME = 'rezonans', VER = 1, STORES = ['audio', 'snaps', 'files'];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('Ta przeglądarka nie ma IndexedDB.'));
      const r = indexedDB.open(NAME, VER);
      r.onupgradeneeded = () => { const d = r.result; STORES.forEach((s) => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error('IndexedDB niedostępne'));
    });
    dbp.catch(() => { dbp = null; });
    return dbp;
  }
  function tx(store, mode, fn) {
    return open().then((d) => new Promise((res, rej) => {
      const t = d.transaction(store, mode), s = t.objectStore(store); let out;
      const r = fn(s); if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Zapis przerwany (brak miejsca?)'));
    }));
  }
  DB.put = (store, key, val) => tx(store, 'readwrite', (s) => s.put(val, key));
  DB.get = (store, key) => tx(store, 'readonly', (s) => s.get(key));
  DB.del = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));
  DB.keys = (store) => tx(store, 'readonly', (s) => s.getAllKeys());

  /* trwałe miejsce: przeglądarka nie usunie danych przy braku miejsca */
  DB.persist = async function () { try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) { /* ignore */ } return false; };
  DB.usage = async function () { try { if (navigator.storage && navigator.storage.estimate) return await navigator.storage.estimate(); } catch (e) { /* ignore */ } return null; };

  /* ---------- pliki audio utworów ---------- */
  DB.saveAudio = async function (songId, file) {
    const blob = file instanceof Blob ? file : new Blob([file]);
    await DB.put('audio', songId, { blob, name: file.name || 'utwor.mp3', type: blob.type || 'audio/mpeg', size: blob.size, at: Date.now() });
  };
  DB.loadAudio = (songId) => DB.get('audio', songId).catch(() => null);
  DB.dropAudio = (songId) => DB.del('audio', songId).catch(() => {});

  /* ---------- schemat danych i migracje ---------- */
  App.schema = 2;
  const MIG = {
    // v2: nowy wygląd. Kolory kanałów z projektu, presety studia, pola wydania.
    2: function (st) {
      const pal = { melodia: { bg: '#090A0D', bg2: '#14171C', accent: '#D6B36A', accent2: '#2BB8C9' }, warhead: { bg: '#090A0D', bg2: '#14171C', accent: '#FF7A1A', accent2: '#7C4DFF' } };
      (st.profiles || []).forEach((p) => {
        if (pal[p.id]) p.palette = Object.assign({}, pal[p.id]);
        p.studio = p.studio || { fx: { logo: true, flash: true, waves: true, particles: true } };
      });
      (st.songs || []).forEach((s) => { s.checks = s.checks || {}; s.results = s.results || {}; s.history = s.history || []; });
    }
  };
  App.migrate = function (st) {
    const from = st.schema || 1;
    for (let v = from + 1; v <= App.schema; v++) if (MIG[v]) MIG[v](st);
    st.schema = App.schema;
    return from;
  };

  /* ---------- automatyczne kopie (w telefonie, ostatnie 10) ---------- */
  const pack = () => { const s = App.state; return { format: 'rezonans', schema: App.schema, version: App.version, at: Date.now(), profiles: s.profiles, songs: s.songs, settings: Object.assign({}, s.settings, { gemini: '', yt: '' }), activeProfile: s.activeProfile, quick: s.quick || [], lib: s.lib || [] }; };
  App.pack = pack;
  DB.snapshot = async function (reason) {
    try {
      const k = Date.now(); await DB.put('snaps', k, { reason: reason || 'auto', data: JSON.stringify(pack()) });
      const keys = (await DB.keys('snaps')).sort((a, b) => a - b);
      while (keys.length > 10) await DB.del('snaps', keys.shift());
      App.state.settings.lastSnap = k; App.save();
    } catch (e) { /* kopia jest dodatkiem, nie blokuje pracy */ }
  };
  DB.snapshots = async function () { try { const keys = (await DB.keys('snaps')).sort((a, b) => b - a); const out = []; for (const k of keys) { const v = await DB.get('snaps', k); out.push({ at: k, reason: v.reason, size: v.data.length }); } return out; } catch (e) { return []; } };
  DB.restoreSnapshot = async function (k) { const v = await DB.get('snaps', k); if (!v) throw new Error('Nie ma takiej kopii.'); App.applyPack(JSON.parse(v.data)); };
  DB.autoSnapshot = function () { const last = App.state.settings.lastSnap || 0; if (Date.now() - last > 20 * 36e5) DB.snapshot('codzienna'); };

  /* ---------- eksport i import całego projektu ---------- */
  const b64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  DB.exportAll = async function (withAudio) {
    const data = pack(); data.audio = {};
    if (withAudio) for (const s of App.state.songs) { const a = await DB.loadAudio(s.id); if (a && a.blob) data.audio[s.id] = { name: a.name, type: a.type, b64: await b64(a.blob) }; }
    App.state.settings.lastExport = Date.now(); App.save();
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  };
  App.applyPack = function (d) {
    if (!d || !Array.isArray(d.profiles)) throw new Error('To nie jest plik kopii Rezonansu.');
    const keep = { gemini: App.state.settings.gemini, yt: App.state.settings.yt };
    App.state.profiles = d.profiles; App.state.songs = d.songs || []; App.state.activeProfile = d.activeProfile || d.profiles[0].id;
    if (d.settings) App.state.settings = Object.assign({}, App.state.settings, d.settings, keep);
    if (d.quick) App.state.quick = d.quick;
    if (d.lib) App.state.lib = d.lib;
    App.state.schema = d.schema || 1; App.migrate(App.state); App.save();
  };
  DB.importAll = async function (file) {
    const d = JSON.parse(await file.text());
    await DB.snapshot('przed importem');
    App.applyPack(d);
    const au = d.audio || {}; let n = 0;
    for (const id of Object.keys(au)) {
      const bin = Uint8Array.from(atob(au[id].b64), (c) => c.charCodeAt(0));
      await DB.put('audio', id, { blob: new Blob([bin], { type: au[id].type || 'audio/mpeg' }), name: au[id].name, type: au[id].type, size: bin.length, at: Date.now() }); n++;
    }
    return { songs: App.state.songs.length, audio: n };
  };
})();
