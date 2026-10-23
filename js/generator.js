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

  G.view = function () {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, toast = UI.toast;
    const st = (App.state.gen = App.state.gen || { idea: '', opts: Object.assign({}, OPT), busy: false, err: '', cur: null });
    if (!App.state.quick) App.state.quick = [];
    const root = h('div', { class: 'screen' });
    const rerender = () => { if (App.state.tab === 'gen') UI.render(); };
    root.appendChild(h('header', { class: 'hdr' }, h('div', null, h('h1', null, 'Generator Suno'), h('p', { class: 'sub' }, 'Jedno zdanie, a dostajesz wszystko do Suno.'))));
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
    if (App.state.quick.length) {
      root.appendChild(h('h3', { class: 'sec' }, 'Ostatnie'));
      App.state.quick.forEach((r) => root.appendChild(h('div', { class: 'cp', style: { cursor: 'pointer' } }, h('span', { onclick: () => { st.cur = r; st.idea = r.idea; rerender(); window.scrollTo(0, 0); } }, r.title + ' · ' + (r.idea.length > 48 ? r.idea.slice(0, 48) + '…' : r.idea)),
        h('button', { class: 'iconbtn sm', 'aria-label': 'Usuń', onclick: () => { App.state.quick = App.state.quick.filter((x) => x.id !== r.id); if (st.cur && st.cur.id === r.id) st.cur = null; App.save(); rerender(); } }, icon('close', 16)))));
    }
    return root;
  };
})();
