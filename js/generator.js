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

  /* ---------- analiza odwrotna: pełna dekompozycja brzmienia -> pola Suno ---------- */
  const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const KMAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], KMIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  const corr = (x, y) => { const n = x.length; let mx = 0, my = 0; for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; } mx /= n; my /= n; let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / (Math.sqrt(b * c) || 1); };
  const db = (x) => Math.round(20 * Math.log10(Math.max(1e-6, x)) * 10) / 10;
  /* twarde pomiary z sygnału: tonacja, jasność, zawartość basu, dynamika, gęstość perkusji, stereo, przebieg energii */
  G.features = function (buf, an) {
    const S = App.studio, sr = buf.sampleRate, a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a, n = a.length, dur = n / sr;
    const out = {};
    // tonacja (chroma z 40 równo rozłożonych ramek)
    const N = 8192, re = new Float32Array(N), im = new Float32Array(N), win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    const chroma = new Array(12).fill(0), bandE = [0, 0, 0, 0, 0, 0], edges = [0, 60, 250, 500, 2000, 5000, 1e9]; let cent = 0, centW = 0;
    const FR = 48;
    for (let f = 0; f < FR; f++) {
      const c0 = Math.floor((f + 0.5) / FR * n) - N / 2; re.fill(0); im.fill(0);
      for (let i = 0; i < N; i++) { const k = c0 + i; if (k >= 0 && k < n) re[i] = (a[k] + b[k]) * 0.5 * win[i]; }
      S.fft(re, im);
      for (let k = 1; k < N / 2; k++) {
        const fr = k * sr / N, p = re[k] * re[k] + im[k] * im[k];
        for (let q = 0; q < 6; q++) if (fr >= edges[q] && fr < edges[q + 1]) { bandE[q] += p; break; }
        if (fr > 50) { cent += fr * p; centW += p; }
        if (fr >= 65 && fr <= 1800) { const m = 12 * Math.log2(fr / 440) + 69, pc = ((Math.round(m) % 12) + 12) % 12; chroma[pc] += Math.sqrt(p); }
      }
    }
    const rot = (p, r) => p.map((_, i) => p[(i - r + 12) % 12]);
    let bestK = null; for (let r = 0; r < 12; r++) for (const [nm, pr] of [['dur', KMAJ], ['moll', KMIN]]) { const c = corr(chroma, rot(pr, r)); if (!bestK || c > bestK.c) bestK = { c, name: NOTE[r] + ' ' + (nm === 'dur' ? 'major' : 'minor') }; }
    out.key = bestK.name; out.keyConf = Math.round(bestK.c * 100) / 100;
    const tot = bandE.reduce((x, y) => x + y, 0) || 1; const names = ['sub bas <60 Hz', 'bas 60-250 Hz', 'dół środka 250-500 Hz', 'środek 0,5-2 kHz', 'prezencja 2-5 kHz', 'góra >5 kHz'];
    out.bands = names.map((nm, i) => nm + ': ' + Math.round(bandE[i] / tot * 1000) / 10 + '%').join('; ');
    out.centroid = Math.round(cent / (centW || 1));
    // dynamika
    let pk = 0, ss = 0; for (let i = 0; i < n; i += 2) { const x = (a[i] + b[i]) * 0.5; ss += x * x; const ax = Math.abs(a[i]); if (ax > pk) pk = ax; }
    const rms = Math.sqrt(ss / (n / 2)), W = Math.floor(sr * 0.5), seg = []; for (let i = 0; i + W <= n; i += W) { let s = 0; for (let k = i; k < i + W; k += 4) { const x = (a[k] + b[k]) * 0.5; s += x * x; } seg.push(20 * Math.log10(Math.sqrt(s / (W / 4)) + 1e-6)); }
    const so = seg.slice().sort((x, y) => x - y);
    out.rmsDb = db(rms); out.peakDb = db(pk); out.crest = Math.round((out.peakDb - out.rmsDb) * 10) / 10; out.range = Math.round((so[Math.floor(so.length * 0.95)] - so[Math.floor(so.length * 0.1)]) * 10) / 10;
    // stereo
    const L = [], R = []; for (let i = 0; i < n; i += 50) { L.push(a[i]); R.push(b[i]); } let mid = 0, side = 0; for (let i = 0; i < L.length; i++) { mid += (L[i] + R[i]) ** 2; side += (L[i] - R[i]) ** 2; }
    out.stereo = buf.numberOfChannels > 1 ? Math.round(Math.sqrt(side / (mid || 1)) * 100) / 100 : 0;
    // gęstość perkusji: flux widmowy w paśmie basowym (stopa) i wysokim (hi-hat, talerze)
    const M = 1024, H = 512, bin = sr / M, lowTo = Math.round(150 / bin), hiFrom = Math.round(6000 / bin), hiTo = Math.min(M / 2 - 1, Math.round(14000 / bin));
    const w2 = new Float32Array(M); for (let i = 0; i < M; i++) w2[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (M - 1));
    const r2 = new Float32Array(M), i2 = new Float32Array(M), pl = new Float32Array(M / 2), fl = [], fh = []; let prevL = 0, prevH = 0, fcount = 0;
    const maxF = Math.min(Math.floor((n - M) / H), Math.floor(240 * sr / H));
    for (let f = 0; f < maxF; f++) {
      const c0 = f * H; for (let i = 0; i < M; i++) { r2[i] = (a[c0 + i] + b[c0 + i]) * 0.5 * w2[i]; i2[i] = 0; } S.fft(r2, i2);
      let l = 0, hh = 0; for (let k = 1; k <= lowTo; k++) l += Math.sqrt(r2[k] * r2[k] + i2[k] * i2[k]); for (let k = hiFrom; k <= hiTo; k++) hh += Math.sqrt(r2[k] * r2[k] + i2[k] * i2[k]);
      fl.push(Math.max(0, l - prevL)); fh.push(Math.max(0, hh - prevH)); prevL = l; prevH = hh; fcount++;
    }
    const peaks = (x) => { const m = x.reduce((s, v) => s + v, 0) / (x.length || 1), sd = Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length || 1)), th = m + 1.2 * sd; let c = 0, last = -9; for (let i = 1; i < x.length - 1; i++) if (x[i] > th && x[i] >= x[i - 1] && x[i] >= x[i + 1] && i - last > 3) { c++; last = i; } return c; };
    const secs = fcount * H / sr || 1, beatsPerSec = an.bpm / 60;
    out.kickPerBeat = Math.round(peaks(fl) / secs / beatsPerSec * 100) / 100; out.hatPerBeat = Math.round(peaks(fh) / secs / beatsPerSec * 100) / 100;
    // przebieg energii co 5 s (0-9) i rozkład sekcji
    const cur = []; for (let t = 0; t < dur; t += 5) { let s = 0, c = 0; for (let k = Math.floor(t * 2); k < Math.min(an.en.length, Math.floor((t + 5) * 2)); k++) { s += an.en[k]; c++; } cur.push(c ? Math.min(9, Math.round(s / c * 9)) : 0); }
    out.curve = cur.join('');
    out.dur = Math.round(dur); out.bpm = Math.round(an.bpm * 10) / 10; out.vocalStart = Math.round(an.vocalStart); out.chorus = Math.round(an.chorus.start);
    return out;
  };
  G.facts = (f) => [
    'ZMIERZONE FAKTY (twarde pomiary z sygnału, traktuj jako dane, ale tempo i tonację zweryfikuj na słuch):',
    '- długość ' + f.dur + ' s; algorytm tempa: ' + f.bpm + ' BPM (możliwe też ' + Math.round(f.bpm / 2) + ' lub ' + Math.round(f.bpm * 2) + ' BPM jako półtempo/podwójne tempo; sprawdź czy to feel half-time)',
    '- tonacja z analizy chromy: ' + f.key + ' (pewność ' + f.keyConf + ', poniżej 0,6 niepewna)',
    '- rozkład energii widma: ' + f.bands + '; środek ciężkości widma ' + f.centroid + ' Hz (ponad 2500 Hz = jasne, poniżej 1500 Hz = ciemne, ciężkie)',
    '- głośność RMS ' + f.rmsDb + ' dBFS, szczyt ' + f.peakDb + ' dBFS, crest ' + f.crest + ' dB (poniżej 10 dB = mocno skompresowane, ponad 14 dB = dynamiczne), rozpiętość głośności sekcji ' + f.range + ' dB',
    '- szerokość stereo (side/mid) ' + f.stereo,
    '- uderzenia basowe/stopy na jedno uderzenie tempa: ' + f.kickPerBeat + '; zdarzenia wysokich pasm (hi-hat, talerze) na uderzenie: ' + f.hatPerBeat,
    '- przebieg energii w sekundach co 5 s (0 cicho, 9 najgłośniej): ' + f.curve,
    '- wokal zaczyna się ok. ' + f.vocalStart + ' s, najbardziej powtarzalny fragment (prawdopodobny refren) ok. ' + f.chorus + ' s'
  ].join('\n');

  const SHAPE_DECOMP = '{"genre":"","subgenre":"","lineage":"z jakich nurtów i epok wyrasta to brzmienie, bez nazw artystów","era":"dekada/era produkcji","tempo":{"bpm":0,"feel":"half-time/normal/double","groove":"prosty/swing/shuffle/synkopowany"},"key":{"tonic":"","mode":"","harmony":"typowe progresje, np. mollowe i-VI-III-VII, power chordy, pedał basowy"},"drums":{"kit_sound":"np. akustyczny ciężki, elektroniczny 808, sample, industrial","pattern":"opis wzoru: stopa, werbel, hi-hat, double bass, blast, fill-e","sounds":"charakter brzmienia werbla, stopy, talerzy"},"bass":{"type":"gitara basowa, syntezator, 808, sub","character":"czysty/przesterowany/zniekształcony, długość nut","role":"podąża za stopą, linia melodyczna, pedał"},"guitars":{"present":true,"rhythm":"","lead":"","tone":"gain, strój (np. drop), brzmienie, palm mute"},"keys_synths":"pady, arpeggia, pianino, organy, orkiestra, chóry, leady","fx_samples":"efekty, sample, ambient, vinyl, riser","vocals":{"lead":"płeć, wiek, barwa, rejestr, siła","delivery":"śpiew/rap/scream/growl/szept, flow, rytmika, melodyka","doubles":"podwojenia, chórki, adlibs, harmonie","effects":"autotune, vocoder, reverb, delay, dystorsja","language":"","energy":""},"mix":{"space":"suchy/duży pogłos/stereo","low_end":"","highs":"","loudness":"mastering, kompresja, saturacja"},"arrangement":[{"time":"0:00","section":"intro/verse/pre/chorus/bridge/drop/outro","what":"co się dzieje (instrumenty wchodzą, wychodzą, zmiana energii)"}],"hooks":"co jest najbardziej charakterystyczne i zapamiętywalne w brzmieniu","mood":"","energy":"","lyric_theme":"temat bez cytatów","signature":["5 do 8 najważniejszych cech, które MUSZĄ być w każdym podobnym utworze, uszeregowane od najważniejszej"]}';

  G.decompPrompt = function (an, f) {
    return [
      'Jesteś doświadczonym producentem muzycznym, inżynierem miksu i analitykiem brzmienia. Posłuchaj CAŁEJ piosenki bardzo uważnie, od początku do końca, i zrób jej PEŁNĄ dekompozycję: rytm, bas, gitary, klawisze i syntezatory, wokal, harmonia, miks, budowa utworu. Nie zgaduj z gatunku: opisuj to, co SŁYCHAĆ w tym konkretnym nagraniu, nawet gdy jest nietypowe lub miesza gatunki.',
      G.facts(f),
      'ZASADY: nie podawaj nazw artystów, zespołów, albumów ani tytułów. Nie cytuj tekstu. Każde pole wypełnij konkretem (żadnych ogólników typu „energetyczny utwór"). Jeśli czegoś w nagraniu nie ma (np. gitar), wpisz "brak". Jeśli nie masz pewności, napisz najbardziej prawdopodobną wersję i dodaj „(niepewne)". "arrangement" ma mieć wpis dla każdej wyraźnej zmiany w utworze z czasem m:ss.',
      'Zwróć tylko JSON o strukturze: ' + SHAPE_DECOMP
    ].join('\n');
  };
  G.stylePrompt = function (dec, f, o, theme) {
    const lang = o.lang === 'pl' ? 'polski' : o.lang === 'en' ? 'angielski' : 'ten sam język, który słychać w nagraniu';
    return [
      'Jesteś ekspertem od promptów do Suno (v4.5 i nowsze). Poniżej pełna dekompozycja piosenki, którą użytkownik lubi. Zamień ją na pola Suno, które dadzą utwór W TYM SAMYM STYLU I BRZMIENIU (nie kopię melodii ani tekstu).',
      'DEKOMPOZYCJA:\n' + JSON.stringify(dec),
      'REGUŁY PISANIA POLA STYLES (kluczowe dla jakości):',
      '- po angielsku, rozdzielone przecinkami, bez nazw artystów i zespołów;',
      '- Suno najmocniej słucha PIERWSZYCH haseł: zacznij od gatunku i podgatunku (najdokładniejszych), potem tempo "' + (dec.tempo && dec.tempo.bpm ? dec.tempo.bpm : f.bpm) + ' BPM" i feel, potem 3 najważniejsze cechy z "signature", potem wokal (płeć, barwa, sposób), potem perkusja, bas, gitary/klawisze, potem miks i produkcja;',
      '- używaj konkretnych, powszechnie rozpoznawanych terminów (np. "downtuned palm-muted riffs", "booming 808 bass", "half-time groove", "gritty male rap vocals", "gang vocals"), nie opisowych zdań;',
      '- nie dawaj sprzecznych haseł; tonację podaj tylko, jeśli pewna (np. "A minor");',
      '- wariant 1 "Bardzo podobny": 750 do 950 znaków, maksymalnie wierny, pokrywa KAŻDĄ cechę z dekompozycji; wariant 2 "Luźniejszy": ok. 350 znaków, same najważniejsze cechy; wariant 3 "Mocniejszy": jak pierwszy, ale ciężej, głośniej, agresywniej;',
      '- "exclude": po angielsku 6 do 12 haseł tego, co zepsułoby to brzmienie (czego w oryginale NIE MA, np. jeśli brak akustycznych instrumentów: acoustic, ballad; jeśli brak autotune: autotune; jeśli męski wokal: female vocals).',
      'Dodatkowo:',
      '- "structure_tags": lista meta-tagów do wstawienia w tekst (Lyrics) w Suno, dopasowana do budowy oryginału, np. "[Intro: slow riff, no drums]", "[Verse 1: rap, aggressive]", "[Drop]", "[Chorus: gang vocals]" w kolejności utworu (po angielsku, 8 do 14 pozycji);',
      '- "tip": jedno zdanie po polsku, jak ustawić suwaki i że warto wygenerować 2 wersje i wybrać bliższą;',
      theme ? '- "title" i "lyrics": NOWY, oryginalny tekst na temat: „' + theme + '”, w języku: ' + lang + '. Ta sama rytmika, długość linii i energia co w nagraniu, zupełnie inne słowa. Nagłówki sekcji z meta-tagami z "structure_tags" zgodne z budową, co najmniej 30 różnych linii, limit 4500 znaków. ' + (o.harsh ? '' : 'Zakaz wulgaryzmów. ') : '- "title" i "lyrics": puste ("").',
      'Zwróć tylko JSON: {"variants":[{"label":"Bardzo podobny","styles":"","exclude":"","weirdness":25,"influence":85},{"label":"Luźniejszy","styles":"","exclude":"","weirdness":40,"influence":65},{"label":"Mocniejszy","styles":"","exclude":"","weirdness":35,"influence":80}],"structure_tags":[""],"tip":"","title":"","lyrics":""}'
    ].join('\n');
  };
  G.checkPrompt = function (variants, dec) {
    return [
      'Posłuchaj ponownie tej piosenki. Poniżej propozycje pola Styles dla Suno, które mają dać utwór o takim samym brzmieniu. Sprawdź je na słuch i POPRAW: usuń hasła, których w nagraniu nie słychać lub które są sprzeczne z nagraniem (np. zły gatunek, zły wokal, złe tempo, zły bas), dodaj brakujące najbardziej charakterystyczne cechy, ułóż hasła od najważniejszego. Zachowaj angielski, przecinki, brak nazw artystów, limity (wariant 1: do 950 znaków, wariant 2: do 400, wariant 3: do 950).',
      'PROPOZYCJE:\n' + JSON.stringify(variants.map((v) => ({ label: v.label, styles: v.styles, exclude: v.exclude }))),
      'Zwróć tylko JSON: {"verdict":"jedno zdanie po polsku: co się zgadzało, co poprawiono","variants":[{"label":"","styles":"","exclude":""}]}'
    ].join('\n');
  };
  const J = (t) => { const r = JSON.parse(clean(t)); return Array.isArray(r) ? r[0] : r; };
  const str = (x) => (typeof x === 'string' ? x : x == null ? '' : typeof x === 'object' ? Object.values(x).map(str).filter(Boolean).join('; ') : String(x));
  /* okno audio wysyłane do Gemini: cały utwór, a przy dłuższych niż 5 minut 300 s wokół refrenu */
  G.window = (an) => { if (an.dur <= 300) return [0, an.dur]; const t0 = Math.max(0, Math.min(an.dur - 300, an.chorus.start - 120)); return [t0, t0 + 300]; };
  G.analyzeRef = async function (file, o, theme, say) {
    const S = App.studio; say('Wczytuję nagranie…');
    const buf = await S.decode(await file.arrayBuffer()); const an = S.analyze(buf);
    say('Mierzę tempo, tonację i brzmienie…');
    const f = G.features(buf, an), win = G.window(an), data = S.wavChunk(buf, win[0], win[1]);
    G.lastAudio = { name: file.name, data };
    const part = [{ inline_data: { mime_type: 'audio/wav', data } }];
    say('1/3 Gemini słucha całej piosenki i rozkłada ją na części…');
    const dec = J(await App.ai.gemini(G.decompPrompt(an, f), { json: true, temp: 0.2, parts: part }));
    if (!dec || !dec.genre) throw new Error('Gemini nie rozłożył nagrania. Spróbuj ponownie.');
    say('2/3 Układam pola Suno z wyników…');
    const sr = J(await App.ai.gemini(G.stylePrompt(dec, f, o, theme), { json: true, temp: 0.6 }));
    let vs = (sr.variants || []).filter((v) => v && v.styles).map((v) => ({ label: String(v.label || 'Wariant'), styles: String(v.styles).trim(), exclude: String(v.exclude || '').trim(), weirdness: Math.round(Number(v.weirdness)) || 40, influence: Math.round(Number(v.influence)) || 70 }));
    if (!vs.length) throw new Error('Gemini nie ułożył stylu. Spróbuj ponownie.');
    let verdict = '';
    try {
      say('3/3 Gemini sprawdza styl na słuch i poprawia…');
      const ck = J(await App.ai.gemini(G.checkPrompt(vs, dec), { json: true, temp: 0.3, parts: part }));
      verdict = str(ck.verdict);
      (ck.variants || []).forEach((c, i) => { if (c && c.styles && vs[i]) { vs[i].styles = String(c.styles).trim(); if (c.exclude) vs[i].exclude = String(c.exclude).trim(); } });
    } catch (e) { verdict = ''; }
    vs.forEach((v, i) => { v.styles = v.styles.slice(0, i === 1 ? 600 : 995); });
    return {
      id: App.uid('r'), kind: 'ref', name: file.name.replace(/\.[^.]+$/, ''), theme: theme || '', at: Date.now(), measured: f, dec, verdict,
      variants: vs, tags: [].concat(sr.structure_tags || []).map(str).filter(Boolean), tip: str(sr.tip), title: str(sr.title).trim(), lyrics: str(sr.lyrics).trim()
    };
  };
  /* porównanie: oryginał kontra to, co wygenerowało Suno; Gemini podaje różnice i poprawiony styl */
  G.compare = async function (fileSuno, r, say) {
    const S = App.studio; say('Wczytuję wynik z Suno…');
    const buf = await S.decode(await fileSuno.arrayBuffer()), an = S.analyze(buf), f = G.features(buf, an), win = G.window(an), data = S.wavChunk(buf, win[0], Math.min(win[1], win[0] + 150));
    if (!G.lastAudio || G.lastAudio.name.replace(/\.[^.]+$/, '') !== r.name) throw new Error('Do porównania potrzebny jest oryginał. Przeanalizuj go jeszcze raz w tej sesji (aplikacja nie przechowuje nagrań).');
    say('Gemini porównuje oba nagrania…');
    const v1 = r.variants[0], orig = G.lastAudio.data;
    const prompt = [
      'Dostajesz dwa nagrania. NAGRANIE 1 to wzór (piosenka, którą użytkownik lubi). NAGRANIE 2 to utwór wygenerowany w Suno z poniższymi polami, mający brzmieć jak wzór (styl, nie kopia).',
      'Styles użyte w Suno: ' + v1.styles, 'Exclude: ' + v1.exclude,
      'Zmierzone cechy nagrania 2: tempo ' + f.bpm + ' BPM, tonacja ' + f.key + ', środek ciężkości widma ' + f.centroid + ' Hz, crest ' + f.crest + ' dB, ' + f.bands + '. Zmierzone cechy wzoru: tempo ' + r.measured.bpm + ' BPM, tonacja ' + r.measured.key + ', środek ciężkości widma ' + r.measured.centroid + ' Hz, crest ' + r.measured.crest + ' dB, ' + r.measured.bands + '.',
      'Porównaj dokładnie: tempo i feel, perkusja, bas, gitary/klawisze, wokal (płeć, barwa, flow, efekty), miks i jasność, energia, budowa. Wypisz, co się zgadza, a co NIE (po polsku, konkretnie). Potem popraw pola Suno tak, by zbliżyć się do wzoru: dodaj brakujące hasła na początek, usuń lub przenieś do Exclude to, co przeszkadza, zmień suwaki. Bez nazw artystów. Styles po angielsku do 950 znaków.',
      'Zwróć tylko JSON: {"match":["co się zgadza"],"diff":["co się różni i dlaczego"],"styles":"","exclude":"","weirdness":0,"influence":0,"advice":"jedno zdanie po polsku"}'
    ].join('\n');
    const c = J(await App.ai.gemini(prompt, { json: true, temp: 0.3, parts: [{ text: 'NAGRANIE 1 (wzór):' }, { inline_data: { mime_type: 'audio/wav', data: orig } }, { text: 'NAGRANIE 2 (wynik z Suno):' }, { inline_data: { mime_type: 'audio/wav', data } }] }));
    return { match: [].concat(c.match || []).map(str), diff: [].concat(c.diff || []).map(str), styles: str(c.styles).slice(0, 995), exclude: str(c.exclude), weirdness: Math.round(Number(c.weirdness)) || v1.weirdness, influence: Math.round(Number(c.influence)) || v1.influence, advice: str(c.advice) };
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
    root.appendChild(h('p', { class: 'muted' }, 'Wgraj piosenkę, którą lubisz (mp3 z telefonu). Gemini posłucha całego utworu, aplikacja zmierzy tempo, tonację i brzmienie, rozłoży piosenkę na części (rytm, bas, gitary, wokal, miks, budowa) i zamieni to w gotowe pola do Suno. Dostajesz styl, a nie kopię: bez nazw artystów, bez cytowania tekstu.'));
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
    root.appendChild(h('p', { class: 'muted small' }, 'Plik zostaje na telefonie. Do Gemini idzie jednorazowo cały utwór (do 5 minut), bez zapisywania. Analiza to 3 zapytania i trwa do minuty.'));
    if (st.err) root.appendChild(h('div', { class: 'warnbox' }, h('p', null, st.err)));
    const r = st.ref;
    if (r) {
      const d = r.dec || {}, f = r.measured || {}, row = (k, v) => { v = str(v); return v ? h('p', null, h('b', null, k + ': '), v) : null; };
      const fld = (label, val, rows, extra) => h('label', { class: 'field' }, h('span', { class: 'flabel' }, label, extra || null, K.copyBtn(() => val, label)), h('textarea', { rows, readonly: 'true', value: val }));
      const sec = (title, ...rows) => h('div', { class: 'okbox stack' }, h('b', null, title), ...rows);
      const dr = d.drums || {}, bs = d.bass || {}, gt = d.guitars || {}, vc = d.vocals || {}, mx = d.mix || {}, tp = d.tempo || {}, ky = d.key || {};
      root.appendChild(h('h3', { class: 'sec' }, 'Pełna dekompozycja „' + r.name + '”'));
      root.appendChild(sec('Gatunek i tempo', row('Gatunek', [d.genre, d.subgenre].filter(Boolean).join(' / ')), row('Korzenie brzmienia', d.lineage), row('Epoka', d.era), row('Tempo', (tp.bpm || f.bpm) + ' BPM, ' + [tp.feel, tp.groove].filter(Boolean).join(', ') + ' (algorytm: ' + f.bpm + ')'), row('Tonacja', [str(ky.tonic), str(ky.mode)].filter(Boolean).join(' ') + (f.key ? ' (pomiar: ' + f.key + ')' : '')), row('Harmonia', ky.harmony)));
      root.appendChild(sec('Rytm i perkusja', row('Brzmienie zestawu', dr.kit_sound), row('Wzór', dr.pattern), row('Dźwięki', dr.sounds)));
      root.appendChild(sec('Bas', row('Rodzaj', bs.type), row('Charakter', bs.character), row('Rola', bs.role)));
      root.appendChild(sec('Gitary, klawisze, efekty', row('Gitary rytmiczne', gt.rhythm), row('Gitary prowadzące', gt.lead), row('Brzmienie gitar', gt.tone), row('Klawisze i syntezatory', d.keys_synths), row('Efekty i sample', d.fx_samples)));
      root.appendChild(sec('Wokal', row('Głos', vc.lead), row('Sposób wykonania', vc.delivery), row('Podwojenia i chórki', vc.doubles), row('Efekty', vc.effects), row('Język', vc.language)));
      root.appendChild(sec('Produkcja i miks', row('Przestrzeń', mx.space), row('Dół', mx.low_end), row('Góra', mx.highs), row('Głośność i mastering', mx.loudness), row('Pomiar', f.bands ? 'środek ciężkości ' + f.centroid + ' Hz, crest ' + f.crest + ' dB, stereo ' + f.stereo : '')));
      root.appendChild(sec('Budowa utworu', ...(d.arrangement || []).map((x) => h('p', null, h('b', null, str(x.time) + ' ' + str(x.section) + ': '), str(x.what))), row('Nastrój', [d.mood, d.energy].filter(Boolean).join('; ')), row('Temat tekstu', d.lyric_theme)));
      if (d.signature && d.signature.length) root.appendChild(sec('Cechy, które muszą być w każdym podobnym utworze', ...[].concat(d.signature).map((x, i) => h('p', null, (i + 1) + '. ' + str(x)))));
      root.appendChild(h('h3', { class: 'sec' }, 'Wpisz w Suno (Create → Custom)'));
      root.appendChild(h('p', { class: 'muted small' }, 'Zacznij od „Bardzo podobny”. Suno za każdym razem losuje, więc wygeneruj dwie wersje i wybierz bliższą. Pole Styles wklejasz całe, kolejność haseł ma znaczenie.'));
      if (r.verdict) root.appendChild(h('div', { class: 'okbox' }, h('b', null, 'Sprawdzenie na słuch: '), r.verdict));
      r.variants.forEach((v) => root.appendChild(h('div', { class: 'stack' },
        h('h4', null, v.label), fld('Styl (Styles)', v.styles, 6, h('span', { class: 'count' }, v.styles.length + ' / 1000')), v.exclude ? fld('Wyklucz (Exclude styles)', v.exclude, 2) : null,
        h('p', { class: 'muted small' }, 'Suwaki: Weirdness ' + v.weirdness + '%, Style Influence ' + v.influence + '%'))));
      if (r.tags && r.tags.length) root.appendChild(fld('Meta-tagi budowy do tekstu (Lyrics)', r.tags.join('\n'), 8));
      if (r.lyrics) { root.appendChild(h('h3', { class: 'sec' }, 'Nowy tekst w tym klimacie')); root.appendChild(fld('Tytuł (Song Title)', r.title, 1)); root.appendChild(fld('Tekst (Lyrics)', r.lyrics, 14, h('span', { class: 'count' }, r.lyrics.length + ' / 5000'))); }
      if (r.tip) root.appendChild(h('div', { class: 'okbox' }, r.tip));
      root.appendChild(h('a', { class: 'btn big', href: 'https://suno.com/create', target: '_blank', rel: 'noopener' }, icon('link', 18), 'Otwórz Suno'));
      /* pętla poprawek */
      root.appendChild(h('h3', { class: 'sec' }, 'Nadal nie brzmi tak samo?'));
      root.appendChild(h('p', { class: 'muted small' }, 'Wygeneruj utwór w Suno, pobierz go i wgraj tutaj. Gemini posłucha wzoru i Twojego wyniku, wypisze różnice i poda poprawiony styl. Najlepiej zrób to w tej samej sesji, zaraz po analizie wzoru (nagrania nie są zapisywane).'));
      const cIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: (e) => { st.cfile = e.target.files[0] || null; rerender(); } });
      root.appendChild(h('label', { class: 'btn big ghost filebtn' }, icon('plus', 18), st.cfile ? 'Wynik z Suno: ' + st.cfile.name : 'Wybierz utwór z Suno', cIn));
      root.appendChild(h('button', { class: 'btn big', disabled: st.cbusy || !st.cfile ? 'true' : null, onclick: async () => {
        st.cbusy = true; st.cerr = ''; st.cstatus = ''; rerender();
        try { st.cmp = await G.compare(st.cfile, r, (m) => { st.cstatus = m; rerender(); }); } catch (e) { st.cerr = e.message || 'Błąd'; }
        st.cbusy = false; st.cstatus = ''; rerender();
      } }, icon('spark', 18), st.cbusy ? (st.cstatus || 'Porównuję…') : 'Porównaj z wzorem i popraw'));
      if (st.cerr) root.appendChild(h('div', { class: 'warnbox' }, h('p', null, st.cerr)));
      const c = st.cmp;
      if (c) {
        root.appendChild(sec('Zgadza się', ...c.match.map((x) => h('p', null, '✓ ' + x))));
        root.appendChild(sec('Różni się', ...c.diff.map((x) => h('p', null, '• ' + x))));
        root.appendChild(h('h4', null, 'Poprawiony styl'));
        root.appendChild(fld('Styl (Styles)', c.styles, 6, h('span', { class: 'count' }, c.styles.length + ' / 1000')));
        if (c.exclude) root.appendChild(fld('Wyklucz (Exclude styles)', c.exclude, 2));
        root.appendChild(h('div', { class: 'okbox' }, 'Suwaki: Weirdness ' + c.weirdness + '%, Style Influence ' + c.influence + '%. ' + c.advice));
      }
    }
    history(root, st, rerender);
  }
})();
