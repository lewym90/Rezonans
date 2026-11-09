/* Serie, EP i albumy; generatory w Pomyśle (seria, alternatywne refreny, struktury); LIBRARY: centralna biblioteka zasobów. */
(function () {
  const App = window.App, P = (App.projects = {}), LB = (App.library = {}), G2 = (App.gen2 = {});
  const clean = (t) => String(t || '').replace(/^```\w*\n?|```$/g, '').trim();

  /* ---------- projekty: seria / EP / album ---------- */
  P.KINDS = [['seria', 'Seria', 4], ['ep', 'EP', 5], ['album', 'Album', 8]];
  P.list = (pid) => (App.state.projects = App.state.projects || []).filter((x) => !pid || x.ch === pid);
  P.save = (x) => { const l = (App.state.projects = App.state.projects || []); if (!l.includes(x)) l.unshift(x); App.save(); };

  /* struktury utworów do wyboru (lokalnie, bez AI) */
  G2.STRUCTS = [
    { id: 'classic', n: 'Klasyczna', d: 'Intro, 2 zwrotki, refreny, bridge. Ok. 3:00–3:30.', tags: ['[Intro]', '[Verse 1]', '[Pre-Chorus]', '[Chorus]', '[Verse 2]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Final Chorus]', '[Outro]'] },
    { id: 'hook', n: 'Refren na start', d: 'Hook w pierwszych sekundach, dobre pod retencję i Shorty.', tags: ['[Intro: hook, short]', '[Chorus]', '[Verse 1]', '[Chorus]', '[Verse 2]', '[Bridge]', '[Final Chorus]', '[Outro: hook]'] },
    { id: 'short', n: 'Krótka (do 2:30)', d: 'Szybkie wejście wokalu, bez długiego intro.', tags: ['[Verse 1: vocals start immediately]', '[Chorus]', '[Verse 2]', '[Chorus]', '[Final Chorus]', '[Outro: short]'] },
    { id: 'drop', n: 'Z dropem', d: 'Narastanie i drop. Pod bas, siłownię i auto.', tags: ['[Intro: build-up]', '[Verse 1]', '[Build]', '[Drop]', '[Verse 2]', '[Build]', '[Drop]', '[Breakdown]', '[Final Drop]', '[Outro]'] },
    { id: 'anthem', n: 'Hymn', d: 'Skandowany refren, chóry, kulminacja na końcu.', tags: ['[Intro: war drums]', '[Verse 1]', '[Chorus: gang vocals]', '[Verse 2]', '[Chorus: gang vocals]', '[Bridge: half-time]', '[Final Chorus: choir, key change]', '[Outro]'] }
  ];

  /* seria z DNA kanału (lokalnie): łącznik + utwory z puli pomysłów, bez powtórzeń symboli */
  G2.seriesLocal = function (p, kind, theme) {
    const n = (P.KINDS.find((k) => k[0] === kind) || P.KINDS[0])[2], E = App.engine;
    const ideas = E.suggest(p, App.songsOf(p.id), n), th = theme || (p.dna.themes || [])[0] || 'siła';
    const name = (kind === 'album' ? 'Album' : kind === 'ep' ? 'EP' : 'Seria') + ': ' + th.charAt(0).toUpperCase() + th.slice(1);
    return { name, concept: 'Wspólny temat: ' + th + '. Każdy utwór ma inny symbol (' + ideas.map((i) => i.symbol).filter(Boolean).join(', ') + '), ta sama marka i kolory. Publikuj po kolei, każdy na playlistę serii.', ideas, short: ideas.length < n ? 'Pula pomysłów kanału ma tylko ' + ideas.length + ' nieużyte. Resztę dopisz albo użyj Gemini.' : '' };
  };
  G2.seriesAI = async function (p, kind, theme) {
    const n = (P.KINDS.find((k) => k[0] === kind) || P.KINDS[0])[2], used = (p.dna.used || []).concat(App.songsOf(p.id).map((s) => s.title)).join('; ');
    const pl = p.lang === 'pl';
    const prompt = ['Jesteś producentem muzycznym i strategiem YouTube. Kanał „' + p.name + '” (' + p.dna.genre + '). Język utworów: ' + (pl ? 'polski' : 'angielski') + '.',
      'Zaprojektuj ' + (kind === 'album' ? 'album' : kind === 'ep' ? 'EP' : 'serię utworów') + ' z ' + n + ' utworów połączonych jednym motywem' + (theme ? ': ' + theme : '') + '. Motywy kanału: ' + (p.dna.themes || []).join(', ') + '. Symbole: ' + (p.dna.symbols || []).join(', ') + '. Nie powtarzaj istniejących tytułów: ' + used + '.',
      'Każdy utwór inny symbol i inna energia (kolejność jak na płycie: mocne otwarcie, kulminacja, zamknięcie).',
      'Zwróć JSON: {"name":"nazwa projektu","concept":"2 zdania po polsku o łączniku serii","ideas":[{"title","symbol","premise":"po polsku, 1 zdanie","hook":"pierwsza linia refrenu w języku utworu","scenes":["4 krótkie kadry po polsku"]}]}. Tylko JSON.'].join('\n');
    const r = JSON.parse(clean(await App.ai.gemini(prompt, { json: true, temp: 0.95 })));
    const x = Array.isArray(r) ? r[0] : r;
    return { name: String(x.name || 'Nowa seria'), concept: String(x.concept || ''), ideas: [].concat(x.ideas || []).slice(0, n).map((i) => Object.assign({ id: App.uid('idea'), branch: (p.styleVariants[0] || {}).id }, i)) };
  };
  G2.choruses = async function (p, idea) {
    const pl = p.lang === 'pl';
    const prompt = ['Kanał „' + p.name + '” (' + p.dna.genre + '). Utwór: „' + idea.title + '”. Założenie: ' + (idea.premise || '') + '.',
      'Napisz 3 RÓŻNE refreny (każdy 4 krótkie linie, ' + (pl ? 'po polsku' : 'po angielsku') + ', bez wulgaryzmów): 1) skandowany hook z jednym słowem-kluczem, 2) melodyjny, 3) pytanie i odpowiedź. Bez nazw artystów.',
      'Zwróć JSON: {"choruses":[{"label":"krótka nazwa po polsku","lines":["","","",""]}]}. Tylko JSON.'].join('\n');
    const r = JSON.parse(clean(await App.ai.gemini(prompt, { json: true, temp: 1 })));
    return [].concat((Array.isArray(r) ? r[0] : r).choruses || []).slice(0, 3);
  };

  /* widok: blok „Więcej” w karcie pomysłu (refreny i struktury) */
  G2.ideaExtras = function (idea) {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, p = App.profile();
    const box = h('div', { class: 'stack', style: { marginTop: '6px' } });
    const draw = () => {
      box.textContent = '';
      box.appendChild(h('span', { class: 'flabel' }, 'Struktura utworu (do pola Lyrics)'));
      box.appendChild(h('div', { class: 'chips' }, G2.STRUCTS.map((s) => K.chip(s.n, idea._struct === s.id, () => { idea._struct = s.id; draw(); }))));
      const s = G2.STRUCTS.find((x) => x.id === idea._struct);
      if (s) box.appendChild(h('div', { class: 'cp' }, h('span', { class: 'small' }, s.d + ' ' + s.tags.join(' ')), K.copyBtn(s.tags.join('\n\n'), 'Struktura')));
      if (idea._ch) idea._ch.forEach((c) => box.appendChild(h('div', { class: 'cp' }, h('span', { class: 'small' }, h('b', null, c.label + ': '), (c.lines || []).join(' / ')), K.copyBtn((c.lines || []).join('\n'), 'Refren'))));
      if (App.ai.hasKey()) box.appendChild(h('button', { class: 'btn ghost sm', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Gemini pisze refreny…'; try { idea._ch = await G2.choruses(p, idea); } catch (er) { UI.toast(er.message); } draw(); } }, icon('spark', 16), idea._ch ? 'Inne 3 refreny (Gemini)' : '3 alternatywne refreny (Gemini)'));
    };
    draw();
    return h('details', null, h('summary', null, 'Refreny i struktury'), box);
  };

  /* odbiorcy: tylko z prawdziwych danych kanału */
  G2.audience = function (p) {
    const a = p.analytics; if (!a) return null;
    const parts = [];
    if (a.male != null) parts.push('mężczyźni ' + Math.round(a.male) + '%');
    if (a.ages && a.ages.length) { const t = a.ages.slice().sort((x, y) => y.views - x.views)[0], w = a.ages.slice().sort((x, y) => y.hours - x.hours)[0]; parts.push('najwięcej wyświetleń: ' + t.k); if (w.k !== t.k) parts.push('najdłużej ogląda: ' + w.k); }
    if (a.regions && a.regions.length) { const r = a.regions.slice().sort((x, y) => y.views - x.views)[0]; parts.push('główny kraj: ' + r.k); }
    return parts.length ? parts.join(', ') : null;
  };

  /* ---------- widok: generator serii w Pomyśle ---------- */
  G2.seriesView = function (root) {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, p = App.profile(), ui = App.state.ui;
    ui.sKind = ui.sKind || 'seria';
    const out = h('div');
    const show = (r) => {
      out.textContent = '';
      out.appendChild(h('section', { class: 'card' }, h('h3', null, r.name), h('p', { class: 'muted', style: { marginTop: '6px' } }, r.concept), r.short ? h('p', { class: 'hint', style: { marginTop: '6px' } }, r.short) : null,
        h('button', { class: 'btn', style: { width: '100%', marginTop: '12px' }, onclick: () => { const pr = { id: App.uid('prj'), ch: p.id, kind: ui.sKind, name: r.name, concept: r.concept, ideas: r.ideas, songs: [], created: Date.now() }; P.save(pr); UI.toast('Projekt zapisany w zakładce Utwory'); P.open(pr.id); } }, icon('plus', 18), 'Zapisz jako projekt')));
      out.appendChild(h('div', { class: 'ideas' }, r.ideas.map((i, n) => h('article', { class: 'idea' }, h('h4', null, (n + 1) + '. ' + i.title), h('p', { class: 'premise' }, i.premise || ''), h('div', { class: 'chips' }, i.symbol ? h('span', { class: 'tag' }, i.symbol) : null, i.hook ? h('span', { class: 'tag' }, '„' + i.hook + '”') : null)))));
    };
    root.appendChild(h('div', { class: 'compose' },
      h('div', { class: 'chips' }, P.KINDS.map((k) => K.chip(k[1] + ' (' + k[2] + ')', ui.sKind === k[0], () => { ui.sKind = k[0]; UI.render(); }))),
      h('input', { value: ui.sTheme || '', placeholder: 'Temat łączący (opcjonalnie), np. powrót z dna', oninput: (e) => { ui.sTheme = e.target.value; } }),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn', onclick: () => { ui.series = G2.seriesLocal(p, ui.sKind, (ui.sTheme || '').trim()); show(ui.series); } }, icon('refresh', 18), 'Ułóż z DNA kanału'),
        App.ai.hasKey() ? h('button', { class: 'btn ai', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; out.textContent = ''; out.appendChild(h('div', { class: 'busy' }, h('i'), 'Gemini układa projekt…')); try { ui.series = await G2.seriesAI(p, ui.sKind, (ui.sTheme || '').trim()); show(ui.series); } catch (er) { UI.toast(er.message); out.textContent = ''; } b.disabled = false; } }, icon('spark', 18), 'Z Gemini') : null)));
    root.appendChild(out);
    if (ui.series) show(ui.series);
  };

  /* ---------- widok projektu ---------- */
  P.open = function (id) {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, pr = P.list().find((x) => x.id === id); if (!pr) return;
    const p = App.profile(pr.ch);
    K.openSheet(pr.name, (render) => {
      const songs = App.songsOf(p.id).sort((a, b) => b.created - a.created), mine = pr.songs.map((sid) => App.song(sid)).filter(Boolean);
      const pub = mine.filter((s) => s.status === 'opublikowany' || (s.checks || {}).upload).length, total = Math.max(mine.length, (pr.ideas || []).length);
      return h('div', { class: 'stack' },
        K.field('Nazwa', h('input', { value: pr.name, oninput: (e) => { pr.name = e.target.value; App.save(); } })),
        h('div', { class: 'chips' }, P.KINDS.map((k) => K.chip(k[1], pr.kind === k[0], () => { pr.kind = k[0]; App.save(); render(); }))),
        K.field('Koncepcja', h('textarea', { rows: 3, value: pr.concept || '', oninput: (e) => { pr.concept = e.target.value; App.save(); } })),
        h('div', { class: 'meter' }, h('div', { class: 'mh' }, h('span', null, 'Opublikowane'), h('b', null, pub + ' z ' + total)), h('div', { class: 'mt' }, h('i', { style: { width: Math.max(2, total ? pub / total * 100 : 0) + '%' } }))),
        (pr.ideas || []).length ? h('div', { class: 'stack' }, h('h3', null, 'Plan utworów'), pr.ideas.map((i, n) => {
          const made = mine.find((s) => s.ideaId === i.id);
          return h('div', { class: 'cp' }, h('span', null, h('b', null, (n + 1) + '. ' + i.title), h('br'), h('span', { class: 'muted small' }, i.premise || '')),
            made ? h('span', { class: 'st-pill ok' }, made.status) : h('button', { class: 'btn sm', onclick: () => { K.closeSheet(true); App.state.ui = App.state.ui || {}; App.state.ui.pendingProject = { pid: pr.id, ideaId: i.id }; UI.openBuilder(i); } }, 'Suno'));
        })) : null,
        h('h3', null, 'Utwory w projekcie'),
        songs.length ? h('div', { class: 'chips' }, songs.map((s) => K.chip(s.title || 'Bez tytułu', pr.songs.includes(s.id), () => { pr.songs = pr.songs.includes(s.id) ? pr.songs.filter((x) => x !== s.id) : pr.songs.concat(s.id); App.save(); render(); }))) : h('p', { class: 'muted small' }, 'Kanał nie ma jeszcze utworów.'),
        h('p', { class: 'why' }, 'Wskazówka: utwory serii dodawaj do jednej playlisty, a na ekranie końcowym ustaw następny utwór z serii.'),
        h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Usunąć projekt? Utwory zostają.')) { App.state.projects = P.list().filter((x) => x !== pr); App.save(); K.closeSheet(); UI.render(); } } }, icon('trash', 18), 'Usuń projekt'));
    }, { icon: 'notes', onClose: () => UI.render() });
  };
  P.block = function (p) {
    const UI = App.ui, h = UI.h, icon = UI.icon, l = P.list(p.id);
    return h('section', { class: 'block' }, h('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '10px' } }, h('h3', { style: { flex: 1 } }, 'Serie, EP i albumy'), h('button', { class: 'btn ghost sm', onclick: () => { App.state.ui = { ideaMode: 'series' }; UI.go('ideas'); } }, icon('plus', 16), 'Nowy')),
      l.length ? h('div', { class: 'list', style: { margin: 0 } }, l.map((pr) => { const mine = pr.songs.map((id) => App.song(id)).filter(Boolean), pub = mine.filter((s) => s.status === 'opublikowany' || (s.checks || {}).upload).length, total = Math.max(mine.length, (pr.ideas || []).length);
        return h('button', { class: 'row link', onclick: () => P.open(pr.id) }, h('span', { class: 'st-pill go' }, (P.KINDS.find((k) => k[0] === pr.kind) || [0, 'Seria'])[1]), h('div', { class: 'row-m' }, h('b', null, pr.name), h('span', { class: 'muted small' }, pub + ' z ' + total + ' opublikowanych')), icon('chev', 18)); }))
        : h('p', { class: 'muted small' }, 'Połącz utwory w serię, EP albo album. Generator w Pomyśle ułoży plan z DNA kanału.'));
  };

  /* ---------- LIBRARY: wszystkie zasoby w jednym miejscu ---------- */
  LB.TYPES = [['all', 'Wszystko'], ['song', 'Utwory'], ['text', 'Teksty'], ['prompt', 'Prompty i style'], ['img', 'Grafiki'], ['thumb', 'Miniatury'], ['preset', 'Presety'], ['video', 'Filmy'], ['tpl', 'Szablony opisu']];
  LB.items = async function () {
    const out = [], P2 = App.state.profiles, nm = (id) => (App.profile(id) || {}).name || id;
    App.state.songs.forEach((s) => {
      const used = s.status === 'opublikowany' || (s.checks || {}).upload, genre = s.styleName || s.variantId || '';
      out.push({ type: 'song', ch: s.profileId, title: s.title || 'Bez tytułu', at: s.created, status: s.status || 'szkic', genre, used, sub: (s.publishAt ? 'premiera ' + App.fmtDT(s.publishAt) : 'bez terminu'), open: () => App.ui.openSongDetails(s.id) });
      if (s.lyrics) out.push({ type: 'text', ch: s.profileId, title: s.title || 'Tekst', at: s.created, status: s.status, genre, used, sub: s.lyrics.split('\n').filter(Boolean).length + ' linii' + (s.lyricsVer && s.lyricsVer.length ? ', wersji: ' + (s.lyricsVer.length + 1) : ''), copy: s.lyrics });
      if (s.yt && (s.yt.full || s.yt.short)) ['full', 'short'].forEach((k) => { if (s.yt[k]) out.push({ type: 'video', ch: s.profileId, title: (s.title || 'Film') + (k === 'short' ? ' (Short)' : ''), at: (s.rendered && s.rendered[k]) || s.created, status: s.status, genre, used: true, sub: 'YouTube: ' + s.yt[k], link: 'https://studio.youtube.com/video/' + s.yt[k] + '/edit' }); });
    });
    App.lib.list().forEach((x) => out.push({ type: 'prompt', ch: x.ch, title: (x.star ? '★ ' : '') + (x.name || 'Styl'), at: x.at, status: x.src || 'biblioteka', genre: x.name || '', used: App.state.songs.some((s) => s.style && s.style.trim().toLowerCase() === x.styles.trim().toLowerCase()), sub: x.styles.slice(0, 90), copy: x.styles }));
    (App.state.quick || []).forEach((r) => { if (r.styles) out.push({ type: 'prompt', ch: '', title: r.title || 'Generator', at: r.at || 0, status: 'generator', genre: '', used: false, sub: r.styles.slice(0, 90), copy: 'Title: ' + r.title + '\n\nStyles:\n' + r.styles + '\n\nExclude styles:\n' + (r.exclude || '') + '\n\nLyrics:\n' + (r.lyrics || '') }); });
    P2.forEach((p) => {
      ((p.studio && p.studio.presets) || []).forEach((x) => out.push({ type: 'preset', ch: p.id, title: x.n, at: 0, status: 'preset studia', genre: '', used: true, sub: 'szablon ' + (x.cfg.tpl || 'własny') + ', wizualizer ' + x.cfg.viz }));
      (p.descTpl || []).forEach((x, i) => out.push({ type: 'tpl', ch: p.id, title: x.n, at: x.at || 0, status: 'szablon opisu', genre: '', used: true, sub: x.text.slice(0, 90), copy: x.text, del: () => { p.descTpl.splice(i, 1); App.save(); } }));
    });
    try {
      const keys = await App.db.keys('files');
      for (const k of keys) {
        const [sid, kind] = String(k).split(':'), s = App.song(sid); if (!s) continue;
        if (kind === 'heroes') { const v = await App.db.get('files', k); (v.blobs || []).forEach((b, i) => out.push({ type: 'img', ch: s.profileId, title: (s.title || 'Utwór') + ' · tło ' + (i + 1) + (i === v.sel && v.picked ? ' (wybrane)' : ''), at: v.at, status: s.status, genre: s.styleName || '', used: i === v.sel && v.picked, sub: (v.prompts || [])[i] || '', blob: b })); }
        if (kind === 'thumb16' || kind === 'thumb9') { const v = await App.db.get('files', k); if (v && v.blob) out.push({ type: 'thumb', ch: s.profileId, title: (s.title || 'Utwór') + (kind === 'thumb9' ? ' · 9:16' : ' · 16:9'), at: v.at, status: s.status, genre: '', used: !!(s.yt && s.yt.full), sub: 'zapisana miniatura', blob: v.blob }); }
      }
    } catch (e) { /* grafiki są opcjonalne */ }
    out.forEach((x) => { x.chName = x.ch ? nm(x.ch) : 'wszystkie kanały'; });
    return out.sort((a, b) => (b.at || 0) - (a.at || 0));
  };
  LB.open = function () {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, st = { type: 'all', ch: '', q: '', used: '', items: null };
    const render = K.openSheet('Biblioteka zasobów', (r) => {
      if (!st.items) return h('div', { class: 'busy' }, h('i'), 'Zbieram zasoby…');
      const q = st.q.toLowerCase(), list = st.items.filter((x) => (st.type === 'all' || x.type === st.type) && (!st.ch || x.ch === st.ch || !x.ch) && (!st.used || (st.used === 'yes' ? x.used : !x.used)) && (!q || (x.title + ' ' + x.sub + ' ' + x.genre + ' ' + x.status).toLowerCase().includes(q)));
      const counts = {}; st.items.forEach((x) => { counts[x.type] = (counts[x.type] || 0) + 1; });
      return h('div', { class: 'stack' },
        h('input', { value: st.q, placeholder: 'Szukaj: tytuł, styl, gatunek, status…', oninput: (e) => { st.q = e.target.value; clearTimeout(st.t); st.t = setTimeout(r, 250); } }),
        h('div', { class: 'chips' }, LB.TYPES.filter((t) => t[0] === 'all' || counts[t[0]]).map((t) => K.chip(t[1] + (t[0] === 'all' ? '' : ' ' + counts[t[0]]), st.type === t[0], () => { st.type = t[0]; r(); }))),
        h('div', { class: 'chips' }, [['', 'Oba kanały']].concat(App.state.profiles.map((p) => [p.id, p.name])).map((c) => K.chip(c[1], st.ch === c[0], () => { st.ch = c[0]; r(); })), K.chip('Wykorzystane', st.used === 'yes', () => { st.used = st.used === 'yes' ? '' : 'yes'; r(); }), K.chip('Niewykorzystane', st.used === 'no', () => { st.used = st.used === 'no' ? '' : 'no'; r(); })),
        h('p', { class: 'muted small' }, 'Pozycji: ' + list.length),
        h('div', { class: 'list', style: { margin: 0 } }, list.slice(0, 120).map((x) => h('div', { class: 'row', style: { alignItems: 'flex-start' } },
          x.blob ? h('img', { src: URL.createObjectURL(x.blob), alt: '', style: { width: '64px', height: '40px', objectFit: 'cover', borderRadius: '8px', flex: 'none' } }) : null,
          h('div', { class: 'row-m' }, h('b', null, x.title), h('span', { class: 'muted small' }, (LB.TYPES.find((t) => t[0] === x.type) || [0, ''])[1] + ' · ' + x.chName + ' · ' + x.status + (x.used ? ' · wykorzystane' : '')), x.sub ? h('span', { class: 'muted small', style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, x.sub) : null),
          x.copy ? K.copyBtn(x.copy, x.title) : null,
          x.blob ? h('button', { class: 'iconbtn sm', 'aria-label': 'Zapisz', onclick: () => App.studio.save(x.blob, (x.title.replace(/[^\w\-]+/g, '_') || 'grafika') + '.jpg', 'share').catch(() => App.studio.save(x.blob, 'grafika.jpg', 'file')) }, icon('download', 18)) : null,
          x.link ? h('a', { class: 'iconbtn sm', href: x.link, target: '_blank', rel: 'noopener', 'aria-label': 'Otwórz w YouTube Studio' }, icon('link', 18)) : null,
          x.open ? h('button', { class: 'iconbtn sm', 'aria-label': 'Otwórz', onclick: () => { K.closeSheet(true); x.open(); } }, icon('chev', 18)) : null,
          x.del ? h('button', { class: 'iconbtn sm', 'aria-label': 'Usuń', onclick: () => { if (confirm('Usunąć?')) { x.del(); st.items = null; LB.items().then((i) => { st.items = i; r(); }); } } }, icon('trash', 16)) : null))));
    }, { icon: 'db' });
    LB.items().then((i) => { st.items = i; render(); });
  };
})();
