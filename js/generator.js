/* Generator Suno: z jednego zdania robi tytuł, styl, wykluczenia, tekst i ustawienia do wpisania w Suno. Bez kanałów, bez teledysku. */
(function () {
  const App = window.App, G = (App.gen = {});
  const OPT = { lang: 'auto', vocal: 'auto', harsh: true };
  const LANG = [['auto', 'Język z opisu'], ['pl', 'Polski'], ['en', 'Angielski']];
  const VOC = [['auto', 'Wokal dowolny'], ['male', 'Męski'], ['female', 'Żeński'], ['inst', 'Bez słów']];

  G.prompt = function (idea, o) {
    const lang = o.lang === 'pl' ? 'polski' : o.lang === 'en' ? 'angielski' : 'ten sam język, w którym napisano opis; jeśli opis jest mieszany, polski';
    const voc = { auto: 'dobierz wokal do nastroju', male: 'męski wokal', female: 'żeński wokal', inst: 'utwór instrumentalny, bez słów' }[o.vocal];
    return [
      'Jesteś producentem muzycznym i ekspertem od promptów do Suno (model v4.5 i nowsze). Z krótkiego opisu użytkownika zrób komplet pól do trybu Custom w Suno.',
      'Opis użytkownika: „' + idea.trim() + '”.',
      'Język tekstu: ' + lang + '. Wokal: ' + voc + '. ' + (o.harsh ? 'Ostre słownictwo jest dozwolone, jeśli pasuje do nastroju, ale nie jest obowiązkowe.' : 'Zakaz wulgaryzmów i przekleństw.'),
      'Pola do zwrócenia:',
      '1. "title": krótki, mocny tytuł (do 6 słów), w języku tekstu.',
      '2. "styles": pole Styles dla Suno, PO ANGIELSKU, rozdzielone przecinkami, do 400 znaków: gatunek i podgatunek, tempo w BPM, nastrój, kluczowe instrumenty, charakter i barwa wokalu oraz sposób śpiewania lub rapowania, produkcja i miks. Bez nazw artystów i zespołów.',
      '3. "exclude": pole Exclude styles, po angielsku, 4 do 8 krótkich haseł tego, czego Suno ma unikać (np. soft, acoustic, lo-fi, ballad).',
      '4. "lyrics": kompletny tekst z nagłówkami w nawiasach kwadratowych. ' + (o.vocal === 'inst' ? 'Utwór instrumentalny: same nagłówki i krótkie wskazówki w nawiasach kwadratowych, np. [Intro], [Build-up], [Drop], [Breakdown], [Solo], [Final Drop], [Outro], bez żadnych słów do śpiewania.' : 'Struktura: [Intro], [Verse 1] 8 linii, [Pre-Chorus] 2 do 4 linie, [Chorus] 4 linie, [Verse 2] 8 linii, [Chorus], [Bridge] 4 linie, [Verse 3] 4 do 8 linii, [Final Chorus] z jedną zmienioną linią, [Outro]. Każda zwrotka inna, z konkretnymi obrazami, co najmniej 30 różnych linii poza refrenem, rymy czyste lub wewnętrzne, linie po 8 do 12 sylab. Refren krótki i łatwy do zapamiętania. Zakaz pustych sekcji i instrukcji w nawiasach okrągłych. Limit 4500 znaków.'),
      '5. "weirdness": liczba 0-100, proponowane ustawienie suwaka Weirdness (dla mocnego, klasycznego brzmienia niżej, dla eksperymentu wyżej).',
      '6. "influence": liczba 0-100, proponowane ustawienie suwaka Style Influence.',
      '7. "tip": jedno zdanie po polsku z poradą, co kliknąć lub jak wybrać lepszą z dwóch wersji w Suno.',
      'Zwróć tylko JSON: {"title","styles","exclude","lyrics","weirdness","influence","tip"}.'
    ].join('\n');
  };
  /* wersja do wklejenia w dowolny czat AI (bez klucza) */
  G.chatPrompt = (idea, o) => G.prompt(idea, o).replace('Zwróć tylko JSON: {"title","styles","exclude","lyrics","weirdness","influence","tip"}.', 'Zwróć odpowiedź jako osobne, podpisane bloki: Title, Styles, Exclude styles, Lyrics, Weirdness, Style Influence, Tip. Każdy blok gotowy do skopiowania.');

  const clean = (t) => String(t || '').replace(/^```\w*\n?|```$/g, '').trim();
  G.run = async function (idea, o) {
    const prompt = G.prompt(idea, o);
    const parse = async (extra) => {
      const r = JSON.parse(clean(await App.ai.gemini(prompt + (extra || ''), { json: true, temp: 1 })));
      const x = Array.isArray(r) ? r[0] : r;
      return { title: String(x.title || '').trim(), styles: String(x.styles || '').trim().slice(0, 980), exclude: String(x.exclude || '').trim(), lyrics: String(x.lyrics || '').trim(), weirdness: Math.round(Number(x.weirdness)) || 40, influence: Math.round(Number(x.influence)) || 70, tip: String(x.tip || '').trim() };
    };
    let r = await parse();
    if (o.vocal !== 'inst') { let q = App.engine.lyricsQuality(r.lyrics); if (!q.ok) { r = await parse('\nPoprzednia wersja miała za mało różnych linii (' + q.unique + '). Napisz od nowa: pełne, różne zwrotki, min. 30 unikalnych linii.'); } }
    if (!r.title || !r.styles || !r.lyrics) throw new Error('Gemini zwrócił niepełny wynik. Kliknij ponownie.');
    return Object.assign(r, { id: App.uid('q'), idea: idea.trim(), opts: Object.assign({}, o), at: Date.now() });
  };

  /* ---------- analiza odwrotna: z piosenki do pól Suno ---------- */
  G.refPrompt = function (an, secs, o, theme) {
    const lang = o.lang === 'pl' ? 'polski' : o.lang === 'en' ? 'angielski' : 'ten sam język, który słychać w nagraniu';
    return [
      'Jesteś producentem muzycznym i ekspertem od promptów do Suno (model v4.5 i nowsze). Posłuchaj fragmentu piosenki (ok. ' + Math.round(secs) + ' s, wybrany z okolic refrenu). Zmierzone tempo: ok. ' + Math.round(an.bpm) + ' BPM (algorytm bywa o połowę lub dwukrotnie za wolny albo za szybki, oceń na słuch).',
      'ZADANIE: opisz brzmienie tak, żeby w Suno powstał utwór W PODOBNYM STYLU, a NIE kopia. Zasady: nie podawaj nazw artystów, zespołów, albumów ani tytułów; nie cytuj i nie przepisuj tekstu oryginału; opisuj brzmienie i charakter, nie melodię nuta po nucie.',
      'Zwróć JSON o strukturze:',
      '{"analysis":{"genre":"","subgenre":"","bpm":"","energy":"","mood":"","instruments":["..."],"vocals":"typ, barwa, sposób śpiewania lub rapowania, język","production":"miks, bas, perkusja, efekty","structure":"jak zbudowany jest utwór","lyric_theme":"o czym ogólnie jest tekst, sam temat bez cytatów"},',
      '"variants":[{"label":"Bardzo podobny","styles":"","exclude":"","weirdness":30,"influence":85},{"label":"Luźniejszy","styles":"","exclude":"","weirdness":45,"influence":65},{"label":"Mocniejszy","styles":"","exclude":"","weirdness":40,"influence":75}],',
      '"tip":"jedno zdanie po polsku z poradą do Suno","title":"","lyrics":""}',
      'Pola "analysis" po polsku, krótko i konkretnie. Pola "styles" i "exclude" PO ANGIELSKU, "styles" do 400 znaków: gatunek i podgatunek, tempo w BPM, nastrój, kluczowe instrumenty, charakter wokalu i sposób śpiewania, produkcja i miks. Trzy warianty mają się realnie różnić: pierwszy najwierniejszy brzmieniu, drugi luźniejszy (mniej szczegółów, więcej swobody dla Suno), trzeci mocniejszy lub bardziej agresywny.',
      theme ? '"title" i "lyrics": napisz NOWY, oryginalny tekst na temat: „' + theme + '”, w języku: ' + lang + '. Ta sama energia i rytmika co w nagraniu, ale zupełnie inne słowa i obrazy niż w oryginale. Pełna struktura z nagłówkami [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Chorus], [Bridge], [Final Chorus], [Outro], co najmniej 30 różnych linii, limit 4500 znaków. ' + (o.harsh ? '' : 'Zakaz wulgaryzmów. ') : '"title" i "lyrics": zostaw puste teksty (""), użytkownik nie prosił o tekst.',
      'Zwróć tylko JSON.'
    ].join('\n');
  };
  G.analyzeRef = async function (file, o, theme, say) {
    const S = App.studio; say('Wczytuję nagranie…');
    const buf = await S.decode(await file.arrayBuffer()); const an = S.analyze(buf);
    const t0 = Math.max(0, Math.min(an.chorus.start - 20, an.dur - 20)), t1 = Math.min(an.dur, t0 + 90);
    say('Gemini słucha nagrania…');
    const data = S.wavChunk(buf, t0, t1);
    const prompt = G.refPrompt(an, t1 - t0, o, theme);
    const parse = async () => {
      const r = JSON.parse(clean(await App.ai.gemini(prompt, { json: true, temp: 0.5, parts: [{ inline_data: { mime_type: 'audio/wav', data } }] })));
      const a = r.analysis || {}, vs = (r.variants || []).filter((v) => v && v.styles).map((v) => ({ label: String(v.label || 'Wariant'), styles: String(v.styles).trim().slice(0, 980), exclude: String(v.exclude || '').trim(), weirdness: Math.round(Number(v.weirdness)) || 40, influence: Math.round(Number(v.influence)) || 70 }));
      if (!vs.length) throw new Error('Gemini nie opisał stylu. Spróbuj ponownie.');
      return { analysis: { genre: String(a.genre || ''), subgenre: String(a.subgenre || ''), bpm: String(a.bpm || Math.round(an.bpm)), energy: String(a.energy || ''), mood: String(a.mood || ''), instruments: [].concat(a.instruments || []).map(String), vocals: String(a.vocals || ''), production: String(a.production || ''), structure: String(a.structure || ''), lyric_theme: String(a.lyric_theme || '') }, variants: vs, tip: String(r.tip || ''), title: String(r.title || '').trim(), lyrics: String(r.lyrics || '').trim() };
    };
    const r = await parse();
    return Object.assign(r, { id: App.uid('r'), kind: 'ref', name: file.name.replace(/\.[^.]+$/, ''), theme: theme || '', measuredBpm: Math.round(an.bpm), at: Date.now() });
  };

  G.view = function () {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, toast = UI.toast;
    const st = (App.state.gen = App.state.gen || { idea: '', opts: Object.assign({}, OPT), busy: false, err: '', cur: null }); st.mode = st.mode || 'idea'; if (!st.rtheme) st.rtheme = '';
    if (!App.state.quick) App.state.quick = [];
    const root = h('div', { class: 'screen' });
    const rerender = () => { if (App.state.tab === 'gen') UI.render(); };
    root.appendChild(h('header', { class: 'hdr' }, h('div', null, h('h1', null, 'Generator Suno'), h('p', { class: 'sub' }, 'Z pomysłu albo z piosenki, którą lubisz. Dostajesz wszystko do Suno.'))));
    root.appendChild(h('div', { class: 'seg', role: 'tablist' }, [['idea', 'Z pomysłu'], ['ref', 'Z piosenki']].map((m) => h('button', { role: 'tab', 'aria-selected': st.mode === m[0] ? 'true' : 'false', class: st.mode === m[0] ? 'on' : '', onclick: () => { st.mode = m[0]; rerender(); } }, m[1]))));
    if (st.mode === 'ref') { refView(root, st, rerender); return root; }
    const ta = h('textarea', { rows: 4, placeholder: 'Np. idę na siłownię, chcę czegoś potężnego, co rozniesie mi mózg na słuchawkach i pozwoli przerzucić setki kilogramów więcej', value: st.idea, oninput: (e) => { st.idea = e.target.value; } });
    const seg = (label, list, key) => h('div', { class: 'stack' }, h('span', { class: 'flabel' }, label), h('div', { class: 'row-btns' }, list.map((x) => K.chip(x[1], st.opts[key] === x[0], () => { st.opts[key] = x[0]; rerender(); }))));
    const hasKey = App.ai.hasKey();
    const go = async () => {
      if (st.busy) return; if (st.idea.trim().length < 5) { toast('Opisz w zdaniu, czego chcesz posłuchać.'); return; }
      st.busy = true; st.err = ''; rerender();
      try { st.cur = await G.run(st.idea, st.opts); App.state.quick.unshift(st.cur); App.state.quick = App.state.quick.slice(0, 30); App.save(); }
      catch (e) { st.err = e.message || 'Błąd'; }
      st.busy = false; rerender();
    };
    root.appendChild(h('div', { class: 'compose' }, ta, seg('Język tekstu', LANG, 'lang'), seg('Wokal', VOC, 'vocal'),
      h('label', { class: 'field', style: { flexDirection: 'row', alignItems: 'center', gap: '12px' } }, h('input', { type: 'checkbox', checked: st.opts.harsh, onchange: (e) => { st.opts.harsh = e.target.checked; } }), h('span', null, 'Ostre słownictwo dozwolone')),
      hasKey ? h('button', { class: 'btn big', disabled: st.busy ? 'true' : null, onclick: go }, icon('spark', 18), st.busy ? 'Piszę… (kilkanaście sekund)' : (st.cur ? 'Wygeneruj inną wersję' : 'Wygeneruj dla Suno'))
        : h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'Bez klucza Gemini nie mogę pisać za Ciebie. Skopiuj gotowy prompt, wklej go do dowolnego czatu AI (ChatGPT, Claude, Gemini) i skopiuj z niego wynik do Suno.'),
          h('button', { class: 'btn big', onclick: () => { if (st.idea.trim().length < 5) { toast('Opisz w zdaniu, czego chcesz posłuchać.'); return; } UI.copy(G.chatPrompt(st.idea, st.opts), 'Prompt skopiowany. Wklej go do czatu AI.'); } }, icon('copy', 18), 'Kopiuj prompt do czatu AI'))));
    if (st.err) root.appendChild(h('div', { class: 'warnbox' }, h('p', null, st.err)));
    const fld = (label, val, rows, max, extra) => { const t = h('textarea', { rows, readonly: 'true', value: val }); return h('label', { class: 'field' }, h('span', { class: 'flabel' }, label, extra || null, K.copyBtn(() => val, label)), t); };
    const show = (r) => {
      const all = () => 'Title: ' + r.title + '\n\nStyles:\n' + r.styles + '\n\nExclude styles:\n' + r.exclude + '\n\nLyrics:\n' + r.lyrics + '\n\nWeirdness: ' + r.weirdness + '%  ·  Style Influence: ' + r.influence + '%';
      return h('div', { class: 'stack wz' },
        h('h3', { class: 'sec' }, 'Gotowe do Suno'),
        h('p', { class: 'muted small' }, 'W Suno wybierz Create → Custom. Wklej pola poniżej (kopiujesz kropką obok nazwy).'),
        fld('Tytuł (Song Title)', r.title, 1), fld('Styl (Styles)', r.styles, 4, 1000, h('span', { class: 'count' }, r.styles.length + ' / 1000')),
        fld('Wyklucz (Exclude styles)', r.exclude, 2), fld('Tekst (Lyrics)', r.lyrics, 14, 5000, h('span', { class: 'count' }, r.lyrics.length + ' / 5000')),
        h('div', { class: 'okbox' }, h('b', null, 'Suwaki w Suno: '), 'Weirdness ' + r.weirdness + '%, Style Influence ' + r.influence + '%.' + (r.tip ? ' ' + r.tip : '')),
        h('a', { class: 'btn big', href: 'https://suno.com/create', target: '_blank', rel: 'noopener' }, icon('link', 18), 'Otwórz Suno'),
        h('button', { class: 'btn big ghost', onclick: () => UI.copy(all(), 'Wszystko skopiowane') }, icon('copy', 18), 'Kopiuj wszystko naraz'));
    };
    if (st.cur) root.appendChild(show(st.cur));
    history(root, st, rerender);
    return root;
  };

  /* lista ostatnich wyników (z pomysłu i z piosenki) */
  function history(root, st, rerender) {
    const UI = App.ui, h = UI.h, icon = UI.icon;
    if (!App.state.quick || !App.state.quick.length) return;
    root.appendChild(h('h3', { class: 'sec' }, 'Ostatnie'));
    App.state.quick.forEach((r) => {
      const lab = r.kind === 'ref' ? 'Analiza · ' + r.name : r.title + ' · ' + (r.idea.length > 40 ? r.idea.slice(0, 40) + '…' : r.idea);
      root.appendChild(h('div', { class: 'cp', style: { cursor: 'pointer' } },
        h('span', { onclick: () => { if (r.kind === 'ref') { st.mode = 'ref'; st.ref = r; } else { st.mode = 'idea'; st.cur = r; st.idea = r.idea; } rerender(); window.scrollTo(0, 0); } }, lab),
        h('button', { class: 'iconbtn sm', 'aria-label': 'Usuń', onclick: () => { App.state.quick = App.state.quick.filter((x) => x.id !== r.id); if (st.cur && st.cur.id === r.id) st.cur = null; if (st.ref && st.ref.id === r.id) st.ref = null; App.save(); rerender(); } }, icon('close', 16))));
    });
  }

  /* tryb „Z piosenki” */
  function refView(root, st, rerender) {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, toast = UI.toast;
    const o = st.opts, hasKey = App.ai.hasKey();
    root.appendChild(h('p', { class: 'muted' }, 'Wgraj piosenkę, którą lubisz (mp3 z telefonu). Gemini posłucha fragmentu z refrenem i opisze brzmienie, a aplikacja zamieni to w gotowe pola do Suno. Dostajesz styl, a nie kopię: bez nazw artystów, bez cytowania tekstu.'));
    const fileIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: (e) => { st.rfile = e.target.files[0] || null; rerender(); } });
    const theme = h('textarea', { rows: 2, placeholder: 'Opcjonalnie: temat NOWEGO tekstu, np. trening o piątej rano i pokonywanie własnych słabości', value: st.rtheme, oninput: (e) => { st.rtheme = e.target.value; } });
    const seg = (label, list, key) => h('div', { class: 'stack' }, h('span', { class: 'flabel' }, label), h('div', { class: 'row-btns' }, list.map((x) => K.chip(x[1], o[key] === x[0], () => { o[key] = x[0]; rerender(); }))));
    const go = async () => {
      if (st.busy) return; if (!st.rfile) { toast('Najpierw wybierz plik z piosenką.'); return; }
      st.busy = true; st.err = ''; st.status = ''; rerender();
      try { st.ref = await G.analyzeRef(st.rfile, o, st.rtheme.trim(), (m) => { st.status = m; rerender(); }); App.state.quick.unshift(st.ref); App.state.quick = App.state.quick.slice(0, 30); App.save(); }
      catch (e) { st.err = e.message || 'Błąd'; }
      st.busy = false; st.status = ''; rerender();
    };
    root.appendChild(h('div', { class: 'compose' },
      h('label', { class: 'btn big ghost filebtn' }, icon('plus', 18), st.rfile ? 'Wybrany: ' + st.rfile.name : 'Wybierz plik z piosenką', fileIn),
      theme, seg('Język nowego tekstu', LANG, 'lang'),
      hasKey ? h('button', { class: 'btn big', disabled: st.busy ? 'true' : null, onclick: go }, icon('spark', 18), st.busy ? (st.status || 'Analizuję…') : 'Przeanalizuj i przygotuj dla Suno')
        : h('div', { class: 'warnbox' }, h('p', null, 'Ta funkcja wymaga klucza Gemini (Ustawienia → Klucz Gemini), bo to Gemini słucha nagrania.'))));
    root.appendChild(h('p', { class: 'muted small' }, 'Plik zostaje na telefonie. Do Gemini idzie jednorazowo ok. 90 sekund fragmentu, bez zapisywania.'));
    if (st.err) root.appendChild(h('div', { class: 'warnbox' }, h('p', null, st.err)));
    const r = st.ref;
    if (r) {
      const a = r.analysis, row = (k, v) => v ? h('p', null, h('b', null, k + ': '), v) : null;
      const fld = (label, val, rows, extra) => h('label', { class: 'field' }, h('span', { class: 'flabel' }, label, extra || null, K.copyBtn(() => val, label)), h('textarea', { rows, readonly: 'true', value: val }));
      root.appendChild(h('h3', { class: 'sec' }, 'Co słychać w „' + r.name + '”'));
      root.appendChild(h('div', { class: 'okbox stack' }, row('Gatunek', a.genre + (a.subgenre ? ' / ' + a.subgenre : '')), row('Tempo', a.bpm + ' BPM (zmierzone ok. ' + r.measuredBpm + ')'), row('Energia i nastrój', [a.energy, a.mood].filter(Boolean).join('; ')), row('Instrumenty', a.instruments.join(', ')), row('Wokal', a.vocals), row('Produkcja', a.production), row('Budowa', a.structure), row('Temat tekstu', a.lyric_theme)));
      root.appendChild(h('h3', { class: 'sec' }, 'Wpisz w Suno (Create → Custom)'));
      root.appendChild(h('p', { class: 'muted small' }, 'Trzy warianty stylu. Zacznij od pierwszego, a jeśli brzmi zbyt sztywno, spróbuj luźniejszego albo mocniejszego. Każdy wariant to osobne pole Styles.'));
      r.variants.forEach((v) => root.appendChild(h('div', { class: 'stack' },
        h('h4', null, v.label), fld('Styl (Styles)', v.styles, 4, h('span', { class: 'count' }, v.styles.length + ' / 1000')), v.exclude ? fld('Wyklucz (Exclude styles)', v.exclude, 2) : null,
        h('p', { class: 'muted small' }, 'Suwaki: Weirdness ' + v.weirdness + '%, Style Influence ' + v.influence + '%'))));
      if (r.lyrics) { root.appendChild(h('h3', { class: 'sec' }, 'Nowy tekst w tym klimacie')); root.appendChild(fld('Tytuł (Song Title)', r.title, 1)); root.appendChild(fld('Tekst (Lyrics)', r.lyrics, 14, h('span', { class: 'count' }, r.lyrics.length + ' / 5000'))); }
      if (r.tip) root.appendChild(h('div', { class: 'okbox' }, r.tip));
      root.appendChild(h('a', { class: 'btn big', href: 'https://suno.com/create', target: '_blank', rel: 'noopener' }, icon('link', 18), 'Otwórz Suno'));
    }
    history(root, st, rerender);
  }
})();
