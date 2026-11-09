/* REZONANS INTELLIGENCE i EXPERIMENT LAB: rekomendacje z danych kanału, liczone w telefonie.
   Każda rekomendacja podaje źródło, liczbę utworów, okres, poziom pewności i ograniczenia. Korelacja to nie przyczyna. */
(function () {
  const App = window.App, I = (App.intel = {}), X = (App.exp = {});
  const num = (v) => (v == null || v === '' || isNaN(+v) ? null : +v);
  const conf = (n) => (n >= 16 ? 'umiarkowana' : n >= 8 ? 'niska' : 'bardzo niska');
  const pl = (n, a, b, c) => n + ' ' + (n === 1 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c);

  /* zbiór danych: utwory kanału z cechami i wynikami (7 dni, a gdy brak, 28 dni) */
  I.dataset = function (p) {
    return App.songsOf(p.id).map((s) => {
      const r7 = s.results || {}, r28 = s.results28 || {}, v = num(r7.views) != null ? num(r7.views) : num(r28.views);
      const pub = s.publishAt ? new Date(s.publishAt) : null;
      return {
        s, views: v, avp: num(r7.avp) != null ? num(r7.avp) : num(r28.avp), subs: num(r7.subs) != null ? num(r7.subs) : num(r28.subs),
        f: { bpm: s.bpm || null, dur: s.dur || null, vocalIn: s.vocalIn != null ? s.vocalIn : null, chorusAt: s.chorusAt || null, titleWords: s.title ? s.title.trim().split(/\s+/).length : null, hour: pub ? pub.getHours() + pub.getMinutes() / 60 : null, style: s.styleName || s.variantId || null }
      };
    }).filter((d) => d.views != null && d.views > 0);
  };

  const FEATS = [
    { k: 'vocalIn', n: 'wejściem wokalu', src: 'wejście wokalu', u: ' s' },
    { k: 'dur', n: 'długością', src: 'długość utworu', u: ' s' },
    { k: 'chorusAt', n: 'pierwszym refrenem', src: 'pierwszy refren', u: ' s' },
    { k: 'bpm', n: 'tempem', src: 'tempo', u: ' BPM' },
    { k: 'titleWords', n: 'tytułem', src: 'długość tytułu', u: ' słów' },
    { k: 'hour', n: 'premierą', src: 'godzina premiery', u: '' }
  ];
  const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const nf = (v) => (Math.round(v * 10) / 10).toLocaleString('pl-PL');
  const fmtF = (k, v) => (k === 'hour' ? Math.floor(v) + ':' + String(Math.round((v % 1) * 60)).padStart(2, '0') : nf(v));

  /* rekomendacje: podział na dwie grupy wokół mediany cechy i porównanie wyników */
  I.recs = function (p) {
    const ds = I.dataset(p), out = [], dates = ds.map((d) => d.s.publishAt).filter(Boolean).sort();
    const period = dates.length ? new Date(dates[0]).toLocaleDateString('pl-PL') + ' – ' + new Date(dates[dates.length - 1]).toLocaleDateString('pl-PL') : 'brak dat premier';
    FEATS.forEach((F) => {
      const rows = ds.filter((d) => d.f[F.k] != null); if (rows.length < 4) return;
      const m = med(rows.map((d) => d.f[F.k])), lo = rows.filter((d) => d.f[F.k] <= m), hi = rows.filter((d) => d.f[F.k] > m);
      if (lo.length < 2 || hi.length < 2) return;
      const cmp = (metric) => { const a = lo.filter((d) => d[metric] != null).map((d) => d[metric]), b = hi.filter((d) => d[metric] != null).map((d) => d[metric]); if (a.length < 2 || b.length < 2) return null; const A = avg(a), B = avg(b); return { d: metric === 'avp' ? A - B : (A - B) / Math.max(1, B) * 100, n: a.length + b.length }; };
      const av = cmp('avp'), vw = cmp('views');
      const sigA = av && Math.abs(av.d) >= 4, sigV = vw && Math.abs(vw.d) >= 25;
      if (!sigA && !sigV) return;
      const lead = (sigA ? av.d : vw.d) > 0; // true: niższa wartość cechy wygrywa
      const parts = [];
      if (sigA && (av.d > 0) === lead) parts.push('średni % obejrzenia wyższy o ' + nf(Math.abs(av.d)) + ' pp');
      if (sigV && (vw.d > 0) === lead) { const r = Math.abs(vw.d); parts.push(lead ? 'o ' + Math.round(r) + '% więcej wyświetleń' : 'o ' + Math.round(r) + '% więcej wyświetleń'); }
      if (!parts.length) return;
      const edge = fmtF(F.k, m) + F.u, n = Math.max(av ? av.n : 0, vw ? vw.n : 0);
      const unit = F.k === 'hour' ? (lead ? 'premierą do ' + edge : 'premierą po ' + edge) : F.n + ' ' + (lead ? 'do ' : 'powyżej ') + edge;
      out.push({ t: 'good', x: 'Utwory z ' + unit + ' miały ' + parts.join(' i ') + ' niż pozostałe. Rozważ tę konstrukcję w kolejnym utworze.', src: 'wyniki utworów (7/28 dni), cecha: ' + F.src, n, period, c: conf(n), lim: 'Korelacja, nie dowód przyczyny. Na wynik wpływają też temat, miniatura i pora.' + (n < 8 ? ' Bardzo mała próba.' : '') });
    });
    // style: który wzorzec ma lepsze wyniki
    const byS = {}; ds.forEach((d) => { if (d.f.style) (byS[d.f.style] = byS[d.f.style] || []).push(d); });
    const st = Object.entries(byS).filter((x) => x[1].length >= 2).map((x) => ({ k: x[0], n: x[1].length, v: avg(x[1].map((d) => d.views)) })).sort((a, b) => b.v - a.v);
    if (st.length >= 2 && st[0].v > st[1].v * 1.3) out.push({ t: 'good', metric: 'views', x: 'Styl „' + st[0].k + '” ma średnio ' + Math.round(st[0].v) + ' wyświetleń, „' + st[1].k + '” ' + Math.round(st[1].v) + '. Rozważ 70% produkcji w lepszym stylu, 30% testów.', src: 'Wyniki utworów według stylu', n: st[0].n + st[1].n, period, c: conf(st[0].n + st[1].n), lim: 'Style różnią się też tematami utworów. Korelacja, nie przyczyna.' });
    // Shorty kontra pełne utwory: nie porównujemy bezpośrednio (zasada), tylko informujemy o segmentacji
    return { list: out.sort((a, b) => (a.t === 'good' ? -1 : 1) - (b.t === 'good' ? -1 : 1)), n: ds.length, period };
  };

  /* ---------- EXPERIMENT LAB ---------- */
  X.TYPES = [['title', 'Tytuł A/B'], ['thumb', 'Miniatura A/B'], ['intro', 'Krótkie / długie intro'], ['genre', 'Gatunek'], ['length', 'Długość utworu'], ['hour', 'Godzina premiery']];
  X.METRICS = [['views', 'Wyświetlenia (7 dni)'], ['avp', '% obejrzenia'], ['subs', 'Subskrypcje'], ['ctr', 'Klikalność (wynik testu YouTube)']];
  X.list = (p) => (p.exps = p.exps || []);
  X.evaluate = function (e) {
    if (e.manual && e.manual.winner) return { done: true, verdict: 'Wynik z testu YouTube: wygrało ' + e.manual.winner + (e.manual.share ? ' (' + e.manual.share + '% czasu oglądania)' : '') + '.', ok: true };
    const val = (id) => { const s = App.song(id); if (!s) return null; const r = (s.results && num(s.results[e.metric]) != null) ? s.results : s.results28 || {}; return num(r[e.metric]); };
    const A = (e.a.songs || []).map(val).filter((v) => v != null), B = (e.b.songs || []).map(val).filter((v) => v != null);
    if (!A.length || !B.length) return { done: false, verdict: 'Czekam na wyniki: przypisz utwory i wpisz ich wyniki po 7 dniach.', A, B };
    const a = avg(A), b = avg(B), diff = e.metric === 'avp' ? a - b : (a - b) / Math.max(1, b) * 100;
    const small = A.length < 3 || B.length < 3 || (e.metric === 'views' && Math.min(a, b) < 100);
    const unit = e.metric === 'avp' ? ' pp' : '%';
    const lead = Math.abs(diff) < (e.metric === 'avp' ? 2 : 10) ? 'Brak wyraźnej różnicy' : (diff > 0 ? 'Wariant A lepszy' : 'Wariant B lepszy') + ' o ' + Math.abs(Math.round(diff * 10) / 10) + unit;
    return { done: true, verdict: lead + '. A: ' + Math.round(a * 10) / 10 + ' (' + pl(A.length, 'utwór', 'utwory', 'utworów') + '), B: ' + Math.round(b * 10) / 10 + ' (' + pl(B.length, 'utwór', 'utwory', 'utworów') + ').' + (small ? ' Za mała próba, żeby wyciągać wnioski: powtórz test.' : ''), A, B, small };
  };

  X.open = function (p, e) {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, toast = UI.toast, isNew = !e;
    e = e || { id: App.uid('exp'), type: 'intro', hyp: '', metric: 'avp', a: { d: '', songs: [] }, b: { d: '', songs: [] }, created: Date.now(), status: 'trwa', note: '' };
    const songs = App.songsOf(p.id).sort((x, y) => y.created - x.created);
    K.openSheet(isNew ? 'Nowy eksperyment' : 'Eksperyment', (render) => {
      const ev = X.evaluate(e), side = (k, lab) => h('div', { class: 'stack', style: { gap: '8px' } }, h('span', { class: 'flabel' }, lab),
        h('input', { value: e[k].d, placeholder: k === 'a' ? 'np. intro 5 s, wokal od razu' : 'np. intro 20 s z orkiestrą', oninput: (x) => { e[k].d = x.target.value; } }),
        songs.length ? h('div', { class: 'chips' }, songs.map((s) => K.chip(s.title || 'Bez tytułu', e[k].songs.includes(s.id), () => { const o = k === 'a' ? 'b' : 'a'; e[o].songs = e[o].songs.filter((x) => x !== s.id); e[k].songs = e[k].songs.includes(s.id) ? e[k].songs.filter((x) => x !== s.id) : e[k].songs.concat(s.id); render(); }))) : null);
      return h('div', { class: 'stack' },
        h('div', { class: 'stack', style: { gap: '8px' } }, h('span', { class: 'flabel' }, 'Co testujesz'), h('div', { class: 'chips' }, X.TYPES.map((t) => K.chip(t[1], e.type === t[0], () => { e.type = t[0]; if (t[0] === 'title' || t[0] === 'thumb') e.metric = 'ctr'; render(); })))),
        (e.type === 'title' || e.type === 'thumb') ? h('div', { class: 'infobox' }, 'Tytuł i miniaturę najlepiej testować narzędziem YouTube: Studio → film → „Testuj i porównaj” (A/B na tym samym filmie). Tutaj zapisz hipotezę, a po teście wpisz zwycięzcę.') : null,
        UI.kit.field('Hipoteza', h('textarea', { rows: 2, value: e.hyp, placeholder: 'np. Krótsze intro zwiększy % obejrzenia, bo widz szybciej słyszy wokal.', oninput: (x) => { e.hyp = x.target.value; } })),
        h('div', { class: 'stack', style: { gap: '8px' } }, h('span', { class: 'flabel' }, 'Czym mierzysz'), h('div', { class: 'chips' }, X.METRICS.map((m) => K.chip(m[1], e.metric === m[0], () => { e.metric = m[0]; render(); })))),
        side('a', 'Wariant A (opis i utwory)'), side('b', 'Wariant B (opis i utwory)'),
        e.metric === 'ctr' ? h('div', { class: 'stack', style: { gap: '8px' } }, h('span', { class: 'flabel' }, 'Wynik testu YouTube'), h('div', { class: 'chips' }, ['A', 'B'].map((w) => K.chip('Wygrał ' + w, e.manual && e.manual.winner === w, () => { e.manual = Object.assign({}, e.manual, { winner: w }); render(); }))), h('input', { type: 'number', inputmode: 'decimal', placeholder: 'udział zwycięzcy w czasie oglądania, %', value: (e.manual && e.manual.share) || '', oninput: (x) => { e.manual = Object.assign({}, e.manual, { share: x.target.value }); } })) : null,
        h('div', { class: ev.done && !ev.small ? 'okbox' : 'infobox' }, h('b', null, 'Wynik: '), ev.verdict),
        UI.kit.field('Wniosek (Twoje słowa)', h('textarea', { rows: 2, value: e.note, placeholder: 'np. Zostaję przy krótkim intro.', oninput: (x) => { e.note = x.target.value; } })),
        h('div', { class: 'chips' }, ['trwa', 'zakończony'].map((st) => K.chip(st, e.status === st, () => { e.status = st; render(); }))),
        h('button', { class: 'btn big', onclick: () => { const l = X.list(p); if (!l.includes(e)) l.unshift(e); App.save(); K.closeSheet(); toast('Eksperyment zapisany'); UI.render(); } }, 'Zapisz eksperyment'),
        isNew ? null : h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Usunąć eksperyment?')) { p.exps = X.list(p).filter((x) => x !== e); App.save(); K.closeSheet(); UI.render(); } } }, icon('trash', 18), 'Usuń'));
    }, { icon: 'sliders' });
  };

  /* bloki do ekranu Wyniki */
  I.block = function (p) {
    const UI = App.ui, h = UI.h, icon = UI.icon, r = I.recs(p);
    return h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('brain', 24, 1.6), h('h3', null, 'Rezonans Intelligence')),
      r.list.length ? h('ul', { class: 'ins' }, r.list.slice(0, 5).map((x) => h('li', { class: x.t }, h('i', null, icon(x.t === 'good' ? 'check' : 'chev', 14, 2.4)), h('span', null, x.x, h('span', { class: 'conf' }, 'Źródło: ' + x.src + '. Utworów: ' + x.n + '. Okres: ' + x.period + '. Pewność: ' + x.c + '. ' + x.lim)))))
        : h('p', { class: 'muted' }, r.n < 4 ? 'Potrzeba wyników co najmniej 4 utworów (masz ' + r.n + '). Wpisuj wyniki po 7 dniach albo połącz YouTube, a porównania wejścia wokalu, długości, refrenu, tempa, tytułów i godzin premier pojawią się tutaj.' : 'Na razie żadna cecha utworów nie różnicuje wyników wyraźnie. To też informacja: decyduje coś innego niż konstrukcja.'),
      h('p', { class: 'why' }, 'Liczone w telefonie. Cechy z pliku (wejście wokalu, refren, tempo, długość) zapisują się po wczytaniu mp3. Shorty i pełne utwory nie są porównywane ze sobą.'));
  };
  X.block = function (p) {
    const UI = App.ui, h = UI.h, icon = UI.icon, l = X.list(p);
    return h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('sliders', 24, 1.6), h('h3', null, 'Experiment Lab'), h('button', { class: 'more', onclick: () => X.open(p) }, 'Nowy')),
      l.length ? h('div', { class: 'list', style: { margin: 0 } }, l.map((e) => { const ev = X.evaluate(e); return h('button', { class: 'row link', style: { flexDirection: 'column', alignItems: 'stretch', gap: '4px' }, onclick: () => X.open(p, e) },
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('b', { style: { flex: 1, font: '700 15.5px var(--f-head)' } }, (X.TYPES.find((t) => t[0] === e.type) || [0, 'Eksperyment'])[1]), h('span', { class: 'st-pill' + (e.status === 'zakończony' ? ' ok' : ' go') }, e.status)),
        e.hyp ? h('span', { class: 'muted small' }, e.hyp) : null, h('span', { class: 'small' }, ev.verdict)); }))
        : h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Zapisuj testy: hipoteza, warianty A i B, utwory, wynik i wniosek. Testuj jedną rzecz naraz.'), h('button', { class: 'btn ghost', onclick: () => X.open(p) }, icon('plus', 18), 'Nowy eksperyment')));
  };
})();
