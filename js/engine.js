/* Silnik: pomysły, ocena pomysłu, pakiet Suno, kontrola wulgaryzmów, pakiet publikacji, plan. */
(function () {
  const App = (window.App = window.App || {});
  const E = (App.engine = {});

  const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  E.norm = norm;
  const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

  /* ---------- pomysły ---------- */
  E.isUsed = function (p, idea, songs) {
    const used = (p.dna.used || []).map(norm).concat((songs || []).map((s) => norm(s.title)));
    return used.includes(norm(idea.title));
  };
  E.reasons = function (p, idea) {
    const r = [];
    if (p.id === 'melodia') {
      if (idea.shout) r.push('Hasło-okrzyk „' + idea.shout + '!” to wzorzec z najlepszego utworu kanału (9 z 22 subskrypcji).');
      if (idea.branch === 'trap') r.push('Gałąź trap i orkiestra dała najlepszy wynik, więc jest bezpieczniejsza do testu.');
      if (idea.branch === 'march') r.push('Metalowy marsz wypadł słabiej. Używaj go raz na kilka utworów, jako kontrast w serii.');
      if (idea.branch === 'stomp') r.push('Ciężki stomp ma za sobą „Moją Stal” (524 wyświetlenia w Shortach).');
      if (!(p.dna.usedSymbols || []).includes(idea.symbol)) r.push('Nowy symbol („' + idea.symbol + '”) odświeża kanał bez zmiany stylu. Zmieniaj jedną rzecz naraz.');
      r.push('Tytuł zawiera frazę do wyszukiwania: ' + idea.title.toLowerCase() + '.');
    } else {
      r.push('Pierwsza linia refrenu („' + idea.hook + '”) jest gotowym tytułem Shorta, a ten format wygrywa u Willi.');
      if (!(p.dna.usedSymbols || []).includes(idea.symbol)) r.push('Nowy obraz („' + idea.symbol + '”) zmienia scenerię bez zmiany klimatu.');
      r.push('Krótka linia po angielsku, prosty język, jedna konkretna rzecz. Tak brzmią najlepsze Shorty kanału.');
    }
    return r;
  };
  E.suggest = function (p, songs, n) {
    const pool = (p.ideas || []).filter((i) => !E.isUsed(p, i, songs));
    const fresh = pool.filter((i) => !(p.dna.usedSymbols || []).includes(i.symbol));
    const ordered = pick(fresh, 99).concat(pick(pool.filter((i) => !fresh.includes(i)), 99));
    return ordered.slice(0, n || 3);
  };

  /* ---------- ocena pomysłu użytkownika ---------- */
  E.score = function (p, text, songs) {
    const t = norm(text);
    const checks = [];
    let score = 0;
    const add = (ok, pts, good, bad) => { if (ok) score += pts; checks.push({ ok, x: ok ? good : bad }); };
    const words = t ? t.split(' ').length : 0;
    if (p.id === 'melodia' || p.lang === 'pl') {
      const sym = (p.dna.symbols || []).find((s) => t.includes(norm(s).slice(0, Math.max(4, norm(s).length - 1))));
      add(!!sym, 22, 'Jest konkretny symbol (' + sym + '). Łatwo go pokazać w teledysku i zrobić z niego hasło.', 'Brak konkretnego symbolu. Dodaj jeden obraz (np. wilk, ring, kowadło), bo abstrakcje słabo działają.');
      const th = (p.dna.themes || []).find((s) => t.includes(norm(s).slice(0, 5)));
      add(!!th || /trening|silown|sztang|ciezar|walk|upor|wstan|dno|bol/.test(t), 20, 'Temat trafia w publiczność kanału (motywacja i trening).', 'Dodaj powiązanie z motywacją, treningiem lub walką. To publiczność kanału.');
      add(/powrot|wstan|dno|upad|po porazce|mimo|zdrad|samotn/.test(t), 15, 'Jest łuk fabularny (upadek i powrót albo samotność), więc refren ma o co się opierać.', 'Dodaj prostą historię: skąd wychodzisz i dokąd idziesz.');
      add(words > 0 && words <= 28, 12, 'Pomysł jest zwięzły.', 'Pomysł jest rozwlekły. Skróć do jednego zdania.');
      const dup = (p.dna.used || []).some((u) => t.includes(norm(u)));
      add(!dup, 16, 'Nie powtarza istniejącego tytułu.', 'Pomysł powtarza istniejący tytuł. Zmień obraz albo punkt widzenia.');
      add(!/pierdol|kurw|jeb|chuj/.test(t), 15, 'Brak wulgaryzmów w założeniu, więc łatwiej o pełne reklamy.', 'Wulgaryzmy w założeniu mogą ograniczyć reklamy.');
    } else {
      const obj = (p.dna.symbols || []).concat(['door', 'coat', 'bus', 'window', 'road', 'light', 'cup', 'rain', 'car', 'porch', 'roof']).find((s) => t.includes(norm(s).split(' ').pop()));
      add(!!obj, 25, 'Jest konkretny przedmiot lub miejsce (' + obj + ').', 'Dodaj jedną konkretną rzecz (drzwi, płaszcz, droga, okno). Tak zaczynają się najlepsze teksty tego kanału.');
      add(/leav|wait|goodbye|gone|night|rain|quiet|almost|left|miss|cold|alone|zostaw|czek|odejs|noc|deszcz|cisz|rozsta/.test(t), 20, 'Temat pasuje do klimatu (rozstanie, czekanie, noc).', 'Dodaj wątek rozstania, czekania lub nocy.');
      add(words > 0 && words <= 12, 15, 'Krótko, więc linia nadaje się na tytuł Shorta.', 'Skróć do jednej linii, którą da się zaśpiewać jako pierwszą w refrenie.');
      const ascii = text && (text.match(/[ąćęłńóśźż]/gi) || []).length === 0;
      add(ascii, 15, 'Język jest zgodny z kanałem.', 'Ten kanał jest po angielsku. Wpisz pomysł lub linię po angielsku.');
      const dup = (p.dna.used || []).some((u) => t.includes(norm(u)));
      add(!dup, 25, 'Nie powtarza istniejącego tytułu.', 'Pomysł powtarza istniejący tytuł. Zmień przedmiot lub miejsce.');
    }
    return { score: Math.max(0, Math.min(100, Math.round(score))), checks };
  };

  /* z wolnego tekstu robi koncept pasujący do kanału */
  E.fromText = function (p, text) {
    const t = norm(text);
    const match = (p.ideas || []).find((i) => t.includes(norm(i.symbol).split(' ').pop().slice(0, 4)) || t.includes(norm(i.shout || i.hook || '').slice(0, 5)));
    const clean = String(text).trim().replace(/[.!?]+$/, '');
    const words = clean.split(/\s+/);
    const cap1 = (s) => s.replace(/^./, (c) => c.toUpperCase());
    if (match) {
      return Object.assign({}, match, { id: App.uid('idea'), title: words.length <= 6 ? cap1(clean) : match.title, premise: String(text).trim(), custom: true });
    }
    const any = pick(p.ideas || [], 1)[0] || {};
    return { id: App.uid('idea'), title: words.length <= 6 ? cap1(clean) : (p.lang === 'pl' ? 'Roboczy tytuł' : 'Working title'), premise: String(text).trim(), hook: p.lang === 'pl' ? undefined : clean, answer: '', symbol: '', branch: any.branch, scenes: any.scenes || [], custom: true };
  };

  /* ---------- pakiet Suno ---------- */
  E.variantOf = (p, id) => (p.styleVariants || []).find((v) => v.id === id) || (p.styleVariants || [])[0];
  E.buildStyle = function (p, variantId, moods) {
    const v = E.variantOf(p, variantId);
    let s = v ? v.style : '';
    const extra = (moods || []).map((id) => (App.DATA.moods.find((m) => m.id === id) || {}).en).filter(Boolean);
    if (extra.length) s += ', ' + extra.join(', ');
    return s;
  };
  E.skeleton = function (p, idea) {
    const lines = [];
    const chorus = [];
    if (p.lang === 'pl' && idea.pairs) {
      idea.pairs.forEach((x) => chorus.push(idea.shout + '! ' + x));
      chorus.push(idea.closing);
    } else {
      chorus.push(idea.hook || idea.title, idea.answer || '', idea.hook || idea.title);
    }
    const block = (tag, body) => lines.push('[' + tag + ']', body ? body.join('\n') : '', '');
    block('Intro'); block('Verse 1'); block('Pre-Chorus'); block('Chorus', chorus);
    block('Verse 2'); block('Chorus', chorus); block('Bridge'); block('Final Chorus', chorus);
    block('Outro', [idea.closing || idea.hook || idea.title]);
    return lines.join('\n').trim();
  };
  E.chatPrompt = function (p, idea, variantId, clean) {
    const v = E.variantOf(p, variantId);
    const pl = p.lang === 'pl';
    const hook = pl ? 'Refren: cztery linie w formie „' + (idea.shout || 'Hasło') + '! Słowo — krótka fraza”, potem linia tytułowa: „' + (idea.closing || idea.title) + '”.' : 'Chorus: start with the line “' + (idea.hook || idea.title) + '”, answer with “' + (idea.answer || '') + '”, keep it plain and sayable.';
    return [
      'Napisz tekst piosenki do Suno dla kanału „' + p.name + '”.',
      'Język tekstu: ' + (pl ? 'polski' : 'angielski') + '. Gatunek i wokal: ' + p.dna.genre + '; ' + p.dna.voice + '.',
      'Tytuł: ' + idea.title + '. Założenie: ' + (idea.premise || '') + '.',
      hook,
      'Struktura (nagłówki w nawiasach kwadratowych): ' + App.DATA.structure.join(', ') + '.',
      'Zasady: jedna spójna metafora od początku do końca, gęste rymy wewnętrzne, krótkie wersy łatwe do rapowania, bez nawiasów okrągłych i bez instrukcji dla wykonawcy w tekście, zwrotki 4 do 8 linii.',
      clean ? 'Zakaz wulgaryzmów i przekleństw.' : 'Wulgaryzmy ogranicz do minimum.',
      'Limit: do 4500 znaków łącznie. Zwróć tylko sam tekst z nagłówkami sekcji.',
      v ? 'Brzmienie (dla kontekstu): ' + v.style : ''
    ].filter(Boolean).join('\n');
  };

  /* ---------- wulgaryzmy ---------- */
  const BAD_PL = /(kurw\w*|pierdol\w*|spierdal\w*|jeb\w*|chuj\w*|pizd\w*|skurwy\w*|sukinsyn\w*)/gi;
  const BAD_EN = /\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|motherfuck\w*|cunt\w*)\b/gi;
  E.scan = function (text) {
    const out = [];
    String(text || '').split('\n').forEach((line, i) => {
      const m = line.match(BAD_PL) || line.match(BAD_EN);
      if (m) out.push({ line: i + 1, text: line.trim(), words: m });
    });
    return out;
  };
  E.clean = function (text) {
    return String(text || '').replace(/skurwysyn\w*/gi, 'drań').replace(/kurw\w*/gi, 'cholera').replace(/pierdol\w*/gi, 'olewam').replace(/spierdal\w*/gi, 'znikaj').replace(/jeb\w*/gi, 'wal').replace(/chuj\w*/gi, 'cholera').replace(/pizd\w*/gi, 'cholera')
      .replace(/motherfuck\w*/gi, 'devil').replace(/fuck\w*/gi, 'damn').replace(/shit\w*/gi, 'dust').replace(/bitch\w*/gi, 'liar').replace(/asshole\w*/gi, 'fool');
  };

  /* ---------- hooki z tekstu ---------- */
  E.hooks = function (lyrics) {
    const lines = String(lyrics || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));
    const count = {};
    lines.forEach((l) => { const k = norm(l); if (k) count[k] = (count[k] || { n: 0, l }); if (k) count[k].n++; });
    const rep = Object.values(count).filter((c) => c.n > 1 && c.l.length <= 70).sort((a, b) => b.n - a.n || a.l.length - b.l.length).map((c) => c.l);
    const sh = lines.filter((l) => /^[\p{L}ĄĆĘŁŃÓŚŹŻ]+!/u.test(l)).slice(0, 4);
    return Array.from(new Set(rep.concat(sh))).slice(0, 5);
  };

  /* ---------- pakiet publikacji ---------- */
  const cap = (s) => String(s || '').replace(/^./, (c) => c.toUpperCase());
  E.publish = function (p, song) {
    const pl = p.lang === 'pl';
    const title = song.title || 'Bez tytułu';
    const hooks = E.hooks(song.lyrics);
    const hook = hooks[0] || title;
    const tags = Array.from(new Set((p.dna.tags || []).concat(title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)))).slice(0, 14);
    const h3 = (p.dna.hashtags || []).slice(0, 3).join(' ');
    const titles = pl
      ? [title, title + ' | muzyka na trening i motywację', title + ' – polski rap z orkiestrą', hook + ' ' + (p.dna.hashtags || []).slice(0, 2).join(' ')]
      : [title + ' — late night country', title, hook, title + ' | sad country song'];
    const shortTitles = hooks.slice(0, 3).map((h) => (pl ? h.replace(/!$/, '') + ' ' + (p.dna.hashtags || [])[0] : h));
    const desc = pl
      ? [
          title + ' — muzyka na trening i motywację, polski rap z orkiestrą.',
          '',
          'Muzyka na trening i motywację: ' + (p.dna.genre || '') + '. Włącz głośno, ruszaj się, nie odpuszczaj.',
          '',
          'Zapisz kanał i włącz powiadomienia, żeby nie przegapić następnej premiery.',
          'Co chciałbyś usłyszeć następne? Napisz w komentarzu.',
          '',
          'Utwór stworzony z użyciem AI (Suno).',
          '',
          h3
        ]
      : [
          title + ' — a late night country song for the quiet hours.',
          '',
          'A quiet one for the late hours. ' + cap(p.dna.genre || '') + '.',
          '',
          'Subscribe for new songs every week, and tell me in the comments where you are listening from.',
          '',
          'Created with AI (Suno).',
          '',
          h3
        ];
    if (song.lyrics && song.includeLyrics) desc.splice(desc.length - 2, 0, '', pl ? 'Tekst:' : 'Lyrics:', song.lyrics.replace(/\n{3,}/g, '\n\n'));
    const pinned = pl
      ? 'Który fragment robi największy zryw? Napisz w komentarzu. Pełny film i nowe utwory co tydzień: zapisz kanał.'
      : 'Which line stayed with you? Tell me in the comments. New songs every week, subscribe so you don\'t miss the next one.';
    const t0 = App.nextAt(p.publish.time, song.publishAt ? new Date(song.publishAt) : undefined);
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    return {
      titles, shortTitles, description: desc.join('\n'), tags, hashtags: h3, pinned, hooks,
      schedule: [
        { k: 'Premiera: pełny film', at: t0.toISOString() },
        { k: 'Short 1 (hook z refrenu)', at: addDays(t0, 1).toISOString() },
        { k: 'Short 2 (inny fragment)', at: addDays(t0, 3).toISOString() }
      ],
      thumb: (pl ? 'Jeden mocny symbol, bez twarzy i bez tekstu, ciemne tło, kolory kanału. Kadr: ' : 'One strong object, no faces, no text, dark moody frame, channel colors. Frame: ') + ((song.scenes || [])[0] || song.symbol || title)
    };
  };

  /* ---------- checklista ---------- */
  E.checklist = function (p, song) {
    const t = p.publish.time;
    return [
      { id: 'audio', x: 'Wgraj nagranie i odsłuchaj na słuchawkach do końca refrenu' },
      { id: 'art', x: 'Miniatura: jeden mocny symbol, bez twarzy i bez tekstu' },
      { id: 'video', x: 'Teledysk 16:9 i Short z refrenu (do 18 s)' },
      { id: 'copy', x: 'Skopiuj tytuł, opis i hashtagi z pakietu' },
      { id: 'upload', x: 'Wyślij na YouTube: zaplanuj na ' + t + ', publiczny, oznacz treść syntetyczną' },
      { id: 'shorts', x: 'Zaplanuj dwa Shorty z refrenu na kolejne dni' },
      { id: 'pin', x: 'Przypnij komentarz i dodaj utwór do playlisty serii' }
    ];
  };
  E.progress = (p, song) => { const c = E.checklist(p, song); const done = c.filter((x) => (song.checks || {})[x.id]).length; return { done, total: c.length }; };

  /* ---------- plan tygodnia ---------- */
  E.week = function (p) {
    const t = p.publish.time;
    return [
      { d: 1, n: 'poniedziałek', k: 'make', x: 'Pomysł i Suno', s: 'Wybierz pomysł, wygeneruj dwa warianty w Suno, wybierz lepszy.' },
      { d: 2, n: 'wtorek', k: 'pub', x: 'Premiera 1', s: 'Pełny film o ' + t + '. Pakiet z aplikacji, oznaczenie AI.' },
      { d: 3, n: 'środa', k: 'short', x: 'Short 1', s: 'Hook z refrenu, osobny tytuł, odnośnik do pełnego filmu.' },
      { d: 4, n: 'czwartek', k: 'make', x: 'Drugi utwór', s: 'Zmień jedną rzecz: symbol albo gałąź stylu.' },
      { d: 5, n: 'piątek', k: 'pub', x: 'Premiera 2', s: 'Pełny film o ' + t + '. Nowy symbol, ta sama marka.' },
      { d: 6, n: 'sobota', k: 'short', x: 'Short 2', s: 'Inny fragment niż w Shorcie 1.' },
      { d: 0, n: 'niedziela', k: 'review', x: 'Przegląd wyników', s: 'Wpisz wyświetlenia, subskrypcje i procent obejrzenia. Aplikacja porówna style i motywy.' }
    ];
  };

  /* ---------- wnioski z wyników ---------- */
  E.learn = function (p, songs) {
    const rated = songs.filter((s) => s.results && Number(s.results.views) > 0);
    if (rated.length < 2) return null;
    const by = {};
    rated.forEach((s) => { const k = s.variantId || '?'; (by[k] = by[k] || []).push(s); });
    const rows = Object.entries(by).map(([k, arr]) => ({ k, name: (E.variantOf(p, k) || {}).name || k, n: arr.length, avg: Math.round(arr.reduce((a, s) => a + Number(s.results.views), 0) / arr.length), subs: arr.reduce((a, s) => a + Number(s.results.subs || 0), 0) })).sort((a, b) => b.avg - a.avg);
    return rows;
  };
})();
