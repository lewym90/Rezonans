/* DNA TRACK: pamięć twórcza kanału i kontrola podobieństwa. LABORATORIUM SUNO: biblioteka sprawdzonych stylów.
   Wszystko liczone w telefonie, bez AI. Analiza brzmienia (co jest w stylu) jest oddzielona od oceny wyników (co działało). */
(function () {
  const App = window.App, D = (App.dna = {}), L = (App.lib = {});
  const STOP = new Set(('i w z na do nie się to że jak a o po za od ale czy już tak tylko mnie mi mój moja moje ten ta te tu tam jest są był być dla przez bo gdy kiedy co kto ja ty on my wy oni ich jego jej was nas aż lecz albo ani by więc '
    + 'the a an and or of to in on at for with my your you me we us our it is are was be been i im i\'m its this that these those all no not never up down out from by as so just like now one oh yeah hey get got go gon na').split(/\s+/));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  const stem = (w) => (w.length > 5 ? w.slice(0, 5) : w);
  const words = (s) => (norm(String(s || '').replace(/\[[^\]]*\]/g, ' ')).match(/[a-z']{3,}/g) || []).filter((w) => !STOP.has(w)).map(stem);
  const lines = (lyr) => String(lyr || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));
  const tri = (s) => { const t = ' ' + norm(s).replace(/[^a-z0-9 ]/g, '') + ' ', m = new Map(); for (let i = 0; i < t.length - 2; i++) { const g = t.slice(i, i + 3); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const cos = (a, b) => { let d = 0, na = 0, nb = 0; a.forEach((v, k) => { na += v * v; if (b.has(k)) d += v * b.get(k); }); b.forEach((v) => { nb += v * v; }); return na && nb ? d / Math.sqrt(na * nb) : 0; };
  const jac = (a, b) => { if (!a.size || !b.size) return 0; let i = 0; a.forEach((x) => { if (b.has(x)) i++; }); return i / (a.size + b.size - i); };
  const tags = (style) => new Set(String(style || '').toLowerCase().split(',').map((x) => x.trim().replace(/\s+/g, ' ')).filter((x) => x && x.length > 2 && !/^\d+\s*bpm$/.test(x)));
  const sections = (lyr) => (String(lyr || '').match(/^\[([^\]:]+)/gm) || []).map((x) => x.slice(1).replace(/\s*\d+$/, '').trim());
  D.helpers = { words, lines, tags, sections, norm };

  /* odcisk utworu */
  D.print = function (s, p) {
    const E = App.engine, lyr = s.lyrics || '', hk = E.hooks(lyr);
    const symbols = (p.dna.symbols || []).filter((x) => norm(lyr + ' ' + (s.title || '') + ' ' + (s.premise || '')).includes(norm(x).slice(0, Math.max(4, norm(x).length - 1))));
    if (s.symbol && !symbols.includes(s.symbol)) symbols.push(s.symbol);
    return { id: s.id, title: s.title || 'Bez tytułu', words: new Set(words((s.title || '') + ' ' + lyr + ' ' + (s.premise || ''))), hooks: hk, hookTri: hk.slice(0, 2).map(tri), titleTri: tri(s.title || ''), tags: tags(s.style), symbols, bpm: s.bpm || null, struct: sections(lyr).join(' › '), published: s.status === 'opublikowany' || (s.checks || {}).upload, created: s.created };
  };
  D.catalog = (p) => App.songsOf(p.id).map((s) => D.print(s, p));

  /* podobieństwo nowego pomysłu lub utworu do katalogu kanału */
  D.similar = function (p, q, skipId) {
    const qp = { words: new Set(words((q.title || '') + ' ' + (q.text || '') + ' ' + (q.lyrics || ''))), hookTri: App.engine.hooks(q.lyrics || '').slice(0, 2).map(tri), titleTri: tri(q.title || ''), tags: tags(q.style), symbols: [].concat(q.symbol || []), bpm: q.bpm || null };
    const out = D.catalog(p).filter((c) => c.id !== skipId).map((c) => {
      const why = []; let sc = 0;
      const tw = jac(qp.words, c.words); if (tw > 0.18) { why.push('wspólne słowa i motywy (' + Math.round(tw * 100) + '%)'); } sc += tw * 45;
      const tt = q.title ? cos(qp.titleTri, c.titleTri) : 0; if (tt > 0.55) why.push('podobny tytuł'); sc += tt * 20;
      const ct = norm(c.title).replace(/[^a-z0-9 ]/g, '').trim(), qt = norm((q.title || '') + ' ' + (q.text || '')).replace(/[^a-z0-9 ]/g, ' ');
      if (ct.length > 6 && qt.includes(ct)) { why.unshift('powtarza tytuł istniejącego utworu'); sc += 40; }
      let hk = 0; qp.hookTri.forEach((a) => c.hookTri.forEach((b) => { hk = Math.max(hk, cos(a, b)); })); if (hk > 0.6) why.push('podobny refren'); sc += hk * 25;
      const st = jac(qp.tags, c.tags); if (st > 0.35) why.push('ten sam zestaw brzmienia (' + Math.round(st * 100) + '% haseł stylu)'); sc += st * 20;
      const sy = qp.symbols.filter((x) => c.symbols.includes(x)); if (sy.length) { why.push('ten sam symbol: ' + sy.join(', ')); sc += 12; }
      if (qp.bpm && c.bpm && Math.abs(qp.bpm - c.bpm) <= 3) { why.push('to samo tempo (' + c.bpm + ' BPM)'); sc += 5; }
      return { id: c.id, title: c.title, score: Math.min(100, Math.round(sc)), why, published: c.published };
    }).filter((x) => x.score >= 12).sort((a, b) => b.score - a.score);
    const top = out[0] ? out[0].score : 0;
    return { top, level: top >= 55 ? 'bad' : top >= 30 ? 'warn' : 'ok', list: out.slice(0, 4), n: D.catalog(p).length };
  };

  /* statystyki pamięci twórczej */
  D.stats = function (p) {
    const cat = D.catalog(p), cnt = (arr) => { const m = {}; arr.forEach((x) => { if (x) m[x] = (m[x] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const symUsed = cnt(cat.flatMap((c) => c.symbols).concat(p.dna.usedSymbols || []));
    const usedSet = new Set(symUsed.map((x) => x[0]));
    const fresh = (p.dna.symbols || []).filter((x) => !usedSet.has(x));
    const allW = cnt(cat.flatMap((c) => Array.from(c.words))).filter((x) => x[1] >= 2).slice(0, 14);
    const tg = cnt(cat.flatMap((c) => Array.from(c.tags))).filter((x) => x[1] >= 2).slice(0, 12);
    const struct = cnt(cat.map((c) => c.struct).filter(Boolean)).slice(0, 4);
    const bpms = cat.map((c) => c.bpm).filter(Boolean).sort((a, b) => a - b);
    // powtarzające się linie między utworami
    const lineMap = {}; App.songsOf(p.id).forEach((s) => new Set(lines(s.lyrics).map((l) => norm(l).replace(/[^a-z0-9 ]/g, '').trim()).filter((l) => l.length > 12)).forEach((l) => { (lineMap[l] = lineMap[l] || []).push(s.title || '?'); }));
    const repLines = Object.entries(lineMap).filter((x) => x[1].length > 1).sort((a, b) => b[1].length - a[1].length).slice(0, 6);
    const vis = App.songsOf(p.id).map((s) => s.visual).filter(Boolean);
    return { n: cat.length, symUsed, fresh, words: allW, tags: tg, struct, bpms, repLines, titles: cat.map((c) => c.title).concat(p.dna.used || []), vis };
  };

  /* ---------- LABORATORIUM SUNO: biblioteka stylów ---------- */
  L.list = () => (App.state.lib = App.state.lib || []);
  L.add = function (e) {
    const list = L.list(), key = String(e.styles || '').trim().toLowerCase();
    if (!key) return null;
    let x = list.find((y) => y.styles.trim().toLowerCase() === key && y.ch === e.ch);
    if (x) { Object.assign(x, { name: e.name || x.name, exclude: e.exclude || x.exclude, w: e.w || x.w, inf: e.inf || x.inf }); x.at = Date.now(); }
    else { x = Object.assign({ id: App.uid('sty'), at: Date.now(), star: false, ver: 1 }, e); list.unshift(x); }
    App.save(); return x;
  };
  /* wpisy z utworów (z wynikami) + zapisane ręcznie + wzorce kanału */
  L.forChannel = function (p) {
    const map = new Map(), add = (k, base) => { const kk = k.trim().toLowerCase(); if (!kk) return null; if (!map.has(kk)) map.set(kk, Object.assign({ songs: [], styles: k.trim() }, base)); return map.get(kk); };
    (p.styleVariants || []).forEach((v) => { if (v.style) add(v.style, { name: v.name, src: 'wzorzec kanału', note: v.note }); });
    L.list().filter((x) => x.ch === p.id).forEach((x) => { const e = add(x.styles, {}); Object.assign(e, { name: x.name || e.name, src: e.src || 'biblioteka', star: x.star, lib: x, exclude: x.exclude, w: x.w, inf: x.inf }); });
    App.songsOf(p.id).forEach((s) => { if (!s.style) return; const e = add(s.style, { name: s.styleName || (s.style.split(',')[0] || 'styl'), src: 'utwór', exclude: s.exclude, w: s.weirdness, inf: s.influence }); e.songs.push(s); });
    return Array.from(map.values()).map((e) => {
      const rated = e.songs.filter((s) => s.results && Number(s.results.views) > 0);
      const avg = rated.length ? Math.round(rated.reduce((a, s) => a + Number(s.results.views), 0) / rated.length) : null;
      const subs = rated.reduce((a, s) => a + Number(s.results.subs || 0), 0);
      return Object.assign(e, { used: e.songs.length, rated: rated.length, avg, subs, last: e.songs.length ? Math.max(...e.songs.map((s) => s.created || 0)) : (e.lib ? e.lib.at : 0) });
    }).sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0) || (b.avg || -1) - (a.avg || -1) || b.used - a.used || b.last - a.last);
  };
  /* automatyczne wykrywanie powtarzających się rozwiązań w ostatnich utworach */
  L.repeats = function (p) {
    const last = App.songsOf(p.id).filter((s) => s.style).sort((a, b) => b.created - a.created).slice(0, 5);
    if (last.length < 3) return [];
    const m = {}; last.forEach((s) => tags(s.style).forEach((t) => { m[t] = (m[t] || 0) + 1; }));
    return Object.entries(m).filter((x) => x[1] >= Math.max(3, Math.ceil(last.length * 0.8))).map((x) => ({ t: x[0], n: x[1], of: last.length })).slice(0, 8);
  };
  /* katalogi: wokale i struktury (z wpisów biblioteki i utworów) */
  L.catalogs = function (p) {
    const VOC = /(male|female|vocal|rap|growl|scream|choir|chant|baryton|baritone|tenor|soprano|whisper|spoken|gang)/;
    const voc = {}, inst = {};
    L.forChannel(p).forEach((e) => tags(e.styles).forEach((t) => { if (VOC.test(t)) voc[t] = (voc[t] || 0) + 1; else if (/(guitar|drum|bass|808|synth|piano|brass|string|orchestra|cello|taiko|kick|snare|choir)/.test(t)) inst[t] = (inst[t] || 0) + 1; }));
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { voc: top(voc), inst: top(inst), struct: D.stats(p).struct };
  };

  /* ---------- widoki ---------- */
  const chipsOf = (h, arr, fmt) => h('div', { class: 'chips' }, arr.map((x) => h('span', { class: 'tag' }, fmt ? fmt(x) : x)));
  D.simBox = function (sim) {
    const UI = App.ui, h = UI.h, icon = UI.icon;
    if (!sim.n) return h('p', { class: 'why' }, 'DNA Track: kanał nie ma jeszcze utworów, nie ma z czym porównać.');
    if (!sim.list.length) return h('div', { class: 'okbox' }, h('b', null, 'Świeży pomysł. '), 'Nie przypomina żadnego z ' + sim.n + ' utworów kanału.');
    return h('div', { class: sim.level === 'ok' ? 'infobox' : 'warnbox' },
      h('p', null, icon(sim.level === 'ok' ? 'check' : 'warn', 18), h('b', null, sim.level === 'bad' ? 'Bardzo podobne do istniejącego utworu' : sim.level === 'warn' ? 'Częściowo podobne do katalogu' : 'Lekkie podobieństwa')),
      sim.list.map((x) => h('p', { class: 'small', style: { display: 'block' } }, '„' + x.title + '” ' + x.score + '%: ' + (x.why.join(', ') || 'drobne podobieństwa') + '.')),
      sim.level !== 'ok' ? h('p', { class: 'small muted', style: { display: 'block' } }, 'Zmień jedną rzecz: symbol, punkt widzenia, tempo albo instrument wiodący. Powtarzalne treści utrudniają monetyzację.') : null);
  };

  D.open = function (pid) {
    const UI = App.ui, h = UI.h, icon = UI.icon, p = App.profile(pid);
    UI.kit.openSheet('DNA Track: ' + p.name, () => {
      const st = D.stats(p), rep = L.repeats(p);
      const sec = (t, body) => h('div', { class: 'stack' }, h('h3', null, t), body);
      return h('div', { class: 'stack' },
        h('div', { class: 'infobox' }, 'Pamięć twórcza kanału: co już było w ' + st.n + ' utworach. Przed nowym utworem aplikacja sprawdza podobieństwo do tego katalogu (w Pomyśle i w pakiecie Suno).'),
        sec('Symbole użyte', st.symUsed.length ? chipsOf(h, st.symUsed, (x) => x[0] + ' ×' + x[1]) : h('p', { class: 'muted small' }, 'Brak.')),
        sec('Symbole jeszcze nieużyte', st.fresh.length ? chipsOf(h, st.fresh) : h('p', { class: 'muted small' }, 'Wszystkie symbole z DNA były już użyte. Dopisz nowe w ustawieniach kanału.')),
        sec('Najczęstsze słowa i motywy', st.words.length ? chipsOf(h, st.words, (x) => x[0] + '… ×' + x[1]) : h('p', { class: 'muted small' }, 'Za mało tekstów.')),
        sec('Powtarzające się linie między utworami', st.repLines.length ? h('ul', { class: 'vers' }, st.repLines.map((x) => h('li', null, h('b', { class: 'small' }, x[0]), h('span', null, x[1].length + ' utw.')))) : h('p', { class: 'muted small' }, 'Brak powtórzeń linii między utworami.')),
        sec('Brzmienie: hasła stylu', st.tags.length ? chipsOf(h, st.tags, (x) => x[0] + ' ×' + x[1]) : h('p', { class: 'muted small' }, 'Brak danych.')),
        rep.length ? h('div', { class: 'warnbox' }, h('p', null, icon('warn', 18), h('b', null, 'Powtarzasz te same rozwiązania')), rep.map((r) => h('p', { class: 'small', style: { display: 'block' } }, '„' + r.t + '” w ' + r.n + ' z ' + r.of + ' ostatnich utworów.'))) : null,
        sec('Tempo', st.bpms.length ? h('p', { class: 'techline' }, st.bpms.map((b) => b + ' BPM').join(' · ')) : h('p', { class: 'muted small' }, 'Tempo zapisuje się po wczytaniu mp3.')),
        sec('Struktury', st.struct.length ? h('ul', { class: 'vers' }, st.struct.map((x) => h('li', null, h('span', { class: 'small' }, x[0]), h('b', null, '×' + x[1])))) : h('p', { class: 'muted small' }, 'Brak danych.')),
        h('p', { class: 'why' }, 'Liczone w telefonie z tytułów, tekstów, stylów i plików. To opis katalogu, nie ocena jakości.'));
    }, { icon: 'brain' });
  };

  /* laboratorium: widok w zakładce Suno */
  L.view = function (root, rerender) {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, p = App.profile();
    const items = L.forChannel(p), rep = L.repeats(p), cat = L.catalogs(p);
    root.appendChild(h('p', { class: 'muted small', style: { margin: '0 16px 12px' } }, 'Biblioteka stylów kanału ' + p.name + '. Zmień kanał na ekranie Dziś. Wyniki to średnie wyświetlenia utworów, które użyły stylu (po 7 dniach).'));
    if (rep.length) root.appendChild(h('div', { class: 'warnbox', style: { margin: '0 16px 14px' } }, h('p', null, icon('warn', 18), h('b', null, 'Powtarzające się rozwiązania')), rep.map((r) => h('p', { class: 'small', style: { display: 'block' } }, '„' + r.t + '” w ' + r.n + ' z ' + r.of + ' ostatnich stylów. Zmień je w następnym utworze.'))));
    if (!items.length) { root.appendChild(h('div', { class: 'emptystate' }, h('b', null, 'Biblioteka jest pusta'), h('p', null, 'Style trafiają tu z utworów i z generatora („Zapisz w bibliotece”).'))); return; }
    const sel = (App.state.ui = App.state.ui || {}).cmp = (App.state.ui.cmp || []).filter((k) => items.some((e) => e.styles === k));
    root.appendChild(h('div', { class: 'list' }, items.map((e) => {
      const on = sel.includes(e.styles);
      return h('div', { class: 'row', style: { flexDirection: 'column', alignItems: 'stretch', gap: '8px' } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('b', { style: { flex: 1, font: '700 16px var(--f-head)' } }, (e.star ? '★ ' : '') + (e.name || 'Styl')),
          h('button', { class: 'iconbtn sm', 'aria-label': e.star ? 'Usuń gwiazdkę' : 'Oznacz jako sprawdzony', style: e.star ? { color: 'var(--gold)' } : null, onclick: () => { const x = e.lib || L.add({ ch: p.id, name: e.name, styles: e.styles, exclude: e.exclude, w: e.w, inf: e.inf, src: e.src }); x.star = !x.star; App.save(); rerender(); } }, h('span', { class: 'ico', html: '<svg width="19" height="19" viewBox="0 0 24 24" fill="' + (e.star ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.9z"/></svg>' })),
          K.copyBtn(e.styles, 'Styl')),
        h('p', { class: 'small muted' }, e.styles),
        h('div', { class: 'chips' }, h('span', { class: 'tag' }, e.src), h('span', { class: 'tag' }, 'użyty ' + e.used + '×'), e.avg != null ? h('span', { class: 'tag' }, 'śr. ' + e.avg.toLocaleString('pl-PL') + ' wyśw. (' + e.rated + ')') : h('span', { class: 'tag' }, 'bez wyników'), e.w ? h('span', { class: 'tag' }, 'W ' + e.w + '% · SI ' + e.inf + '%') : null,
          h('button', { class: 'chip' + (on ? ' on' : ''), style: { minHeight: '30px' }, onclick: () => { const c = App.state.ui.cmp; if (on) c.splice(c.indexOf(e.styles), 1); else { c.push(e.styles); if (c.length > 3) c.shift(); } rerender(); } }, on ? 'Porównuję' : 'Porównaj')));
    })));
    if (sel.length >= 2) {
      const sets = sel.map((k) => tags(k)), all = new Set(sets.flatMap((s) => Array.from(s)));
      const common = Array.from(all).filter((t) => sets.every((s) => s.has(t)));
      root.appendChild(h('section', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'card-h' }, icon('sliders', 22), h('h3', null, 'Porównanie ' + sel.length + ' stylów')),
        h('p', { class: 'flabel' }, 'Wspólne'), common.length ? chipsOf(h, common) : h('p', { class: 'muted small' }, 'Brak wspólnych haseł.'),
        sel.map((k, i) => h('div', { class: 'stack', style: { marginTop: '10px' } }, h('p', { class: 'flabel' }, 'Tylko w stylu ' + (i + 1) + ': ' + ((items.find((e) => e.styles === k) || {}).name || '')), chipsOf(h, Array.from(sets[i]).filter((t) => !common.includes(t))))),
        h('p', { class: 'why' }, 'Porównanie haseł (co jest w brzmieniu). Ocena, który działa lepiej, wynika tylko z wyników utworów.')));
    }
    root.appendChild(h('section', { class: 'card', style: { marginTop: '14px' } }, h('div', { class: 'card-h' }, icon('note', 22), h('h3', null, 'Katalog wokali i instrumentów')),
      h('p', { class: 'flabel' }, 'Wokale'), cat.voc.length ? chipsOf(h, cat.voc, (x) => x[0] + ' ×' + x[1]) : h('p', { class: 'muted small' }, 'Brak.'),
      h('p', { class: 'flabel', style: { marginTop: '10px' } }, 'Instrumenty i brzmienie'), cat.inst.length ? chipsOf(h, cat.inst, (x) => x[0] + ' ×' + x[1]) : h('p', { class: 'muted small' }, 'Brak.'),
      h('p', { class: 'flabel', style: { marginTop: '10px' } }, 'Struktury utworów'), cat.struct.length ? h('ul', { class: 'vers' }, cat.struct.map((x) => h('li', null, h('span', { class: 'small' }, x[0]), h('b', null, '×' + x[1])))) : h('p', { class: 'muted small' }, 'Struktury pojawią się z tekstów z nagłówkami [Verse], [Chorus].')));
  };
})();
