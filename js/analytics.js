/* Import eksportu z YouTube Studio, wnioski i przewodnik rozwoju */
(function () {
  const App = window.App;
  const A = (App.analytics = {});
  const num = (x) => { const v = parseFloat(String(x == null ? '' : x).replace(',', '.')); return isNaN(v) ? 0 : v; };

  A.parseCSV = function (text) {
    text = text.replace(/^﻿/, ''); const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; } else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    if (!rows.length) return [];
    const head = rows[0]; return rows.slice(1).map((r) => { const o = {}; head.forEach((k, i) => { o[k] = r[i]; }); return o; });
  };
  let jszip = null;
  function loadZipLib() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (jszip) return jszip;
    jszip = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = () => res(window.JSZip); s.onerror = () => rej(new Error('Nie udało się wczytać obsługi ZIP. Rozpakuj plik i wybierz same pliki CSV.')); document.head.appendChild(s); });
    return jszip;
  }
  A.readFiles = async function (files) {
    const texts = [];
    for (const f of files) {
      if (/\.zip$/i.test(f.name)) { const Z = await loadZipLib(); const z = await Z.loadAsync(await f.arrayBuffer()); for (const n of Object.keys(z.files)) if (/\.csv$/i.test(n)) texts.push({ name: n, text: await z.files[n].async('string') }); }
      else if (/\.csv$/i.test(f.name)) texts.push({ name: f.name, text: await f.text() });
    }
    const b = { content: null, sources: null, regions: null, ages: null, genders: null, daily: null };
    texts.forEach((t) => {
      const rows = A.parseCSV(t.text); if (!rows.length) return; const k = Object.keys(rows[0])[0];
      if (k === 'Treść' && rows[0]['Tytuł filmu'] !== undefined) b.content = rows;
      else if (k === 'Źródło wizyt') b.sources = rows;
      else if (k === 'Region') b.regions = rows;
      else if (k === 'Wiek widza') b.ages = rows;
      else if (k === 'Płeć widza') b.genders = rows;
      else if (k === 'Data' && /Razem/i.test(t.name)) b.daily = rows;
    });
    if (!b.content) throw new Error('Nie znalazłem tabeli „Treść”. Wyeksportuj zakładkę Treść w Trybie zaawansowanym i dodaj ją.');
    return b;
  };
  const key = (rows, re) => Object.keys(rows[0] || {}).find((k) => re.test(k.replace(/\u00a0/g, ' ')));
  const nf = (x) => String(x).replace('.', ',');
  A.compute = function (b) {
    const rows = b.content, total = rows.find((r) => r['Tytuł filmu'] === '' || r['Treść'] === 'Suma') || {}, vids = rows.filter((r) => r['Treść'] !== 'Suma');
    const H = key(rows, /^Czas oglądania \(w\s*godzinach\)/), V = 'Wyświetlenia', IMP = 'Wyświetlenia miniatury', CTR = key(rows, /^Współczynnik klikalności/), AVP = key(rows, /^Średni procent/), SUB = 'Subskrybenci';
    const videos = vids.map((r) => ({ id: r['Treść'], title: (r['Tytuł filmu'] || '').trim(), date: r['Data i godzina publikacji filmu'] || '', dur: num(r['Czas trwania']), views: num(r[V]), hours: num(r[H]), subs: num(r[SUB]), impr: num(r[IMP]), ctr: num(r[CTR]), avp: num(r[AVP]) }));
    const grp = (f) => { const g = videos.filter(f), v = g.reduce((s, x) => s + x.views, 0), s = g.reduce((a, x) => a + x.subs, 0), imp = g.reduce((a, x) => a + x.impr, 0); return { n: g.length, views: v, hours: +g.reduce((a, x) => a + x.hours, 0).toFixed(1), subs: s, per1k: v ? +(s / v * 1000).toFixed(1) : 0, impr: imp, ctr: imp ? +(g.reduce((a, x) => a + x.ctr * x.impr, 0) / imp).toFixed(2) : 0, avp: g.length ? +(g.reduce((a, x) => a + x.avp, 0) / g.length).toFixed(0) : 0 }; };
    const a = { at: Date.now(), totals: { views: num(total[V]) || videos.reduce((s, x) => s + x.views, 0), hours: +(num(total[H]) || videos.reduce((s, x) => s + x.hours, 0)).toFixed(1), subs: num(total[SUB]) || videos.reduce((s, x) => s + x.subs, 0), impr: num(total[IMP]), ctr: num(total[CTR]) }, shorts: grp((x) => x.dur <= 60), long: grp((x) => x.dur > 60 && x.dur <= 480), comp: grp((x) => x.dur > 480), videos };
    if (b.sources) { const SV = key(b.sources, /^Wyświetlenia$/), SH = key(b.sources, /^Czas oglądania/); a.sources = b.sources.filter((r) => r['Źródło wizyt'] !== 'Suma').map((r) => ({ k: r['Źródło wizyt'], views: num(r[SV]), hours: num(r[SH]) })); }
    if (b.regions) { const RV = key(b.regions, /^Wyświetlenia$/), sm = b.regions.find((r) => r['Region'] === 'Suma'); a.regionTotal = sm ? num(sm[RV]) : 0; a.regions = b.regions.filter((r) => r['Region'] !== 'Suma').map((r) => ({ k: r['Region'], views: num(r[RV]) })).filter((x) => x.views > 0); }
    if (b.genders) { const m = b.genders.find((r) => /Mężczyźni/.test(r['Płeć widza'])); a.male = m ? num(m[key(b.genders, /^Wyświetlenia \(%\)/)]) : null; }
    if (b.ages && b.ages.length > 2) a.ages = b.ages.map((r) => ({ k: r['Wiek widza'], views: num(r[key(b.ages, /^Wyświetlenia \(%\)/)]), hours: num(r[key(b.ages, /^Czas oglądania/)]), avp: num(r[key(b.ages, /^Średni procent/)]) }));
    if (b.daily) { a.days = b.daily.length; }
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const dates = videos.map((x) => { const m = /(\w{3}) (\d+), (\d{4})/.exec(x.date); return m ? new Date(+m[3], months[m[1]], +m[2]).getTime() : 0; }).filter(Boolean);
    a.firstUpload = dates.length ? Math.min.apply(null, dates) : 0; a.lastUpload = dates.length ? Math.max.apply(null, dates) : 0;
    a.days = a.days || Math.max(7, Math.round((Date.now() - (a.firstUpload || Date.now() - 28 * 864e5)) / 864e5));
    a.rate = { subs: a.totals.subs / a.days, hours: a.totals.hours / a.days };
    return a;
  };
  const pct = (x, t) => (t ? Math.round(x / t * 100) : 0);
  A.insights = function (p, a) {
    const out = [], T = a.totals, S = a.shorts, L = a.long, pl = p.lang === 'pl';
    out.push({ t: 'good', x: 'Dane z eksportu: ' + T.views + ' wyświetleń, ' + nf(T.hours) + ' h oglądania, ' + T.subs + ' subskrypcji (' + a.days + ' dni).' });
    if (S.n && L.n) {
      if (L.per1k >= S.per1k * 2) out.push({ t: 'good', x: 'Pełne utwory: ' + nf(L.per1k) + ' subskrypcji na 1000 wyświetleń, Shorty: ' + nf(S.per1k) + '. Shorty mają zapowiadać pełny utwór.' });
      else if (S.per1k > L.per1k) out.push({ t: 'info', x: 'Shorty: ' + nf(S.per1k) + ' subskrypcji na 1000 wyświetleń, pełne utwory: ' + nf(L.per1k) + '. Shorty są teraz głównym motorem, ale muszą kierować do pełnych utworów.' });
      out.push({ t: 'info', x: 'Udział w wyświetleniach: Shorty ' + pct(S.views, T.views) + ' %, pełne utwory ' + pct(L.views, T.views) + ' %. Udział w godzinach oglądania: Shorty ' + pct(S.hours, T.hours) + ' %, pełne ' + pct(L.hours, T.hours) + ' %.' });
    }
    const best = a.videos.filter((v) => v.impr >= 500 && v.dur > 60).sort((x, y) => y.ctr - x.ctr).slice(0, 3);
    if (best.length) out.push({ t: 'good', x: 'Najlepsza klikalność pełnych utworów: ' + best.map((v) => '„' + v.title.replace(/\s#.*$/, '') + '” ' + nf(v.ctr) + ' %').join(', ') + '. Średnia kanału: ' + nf(T.ctr || L.ctr) + ' %. Pisz tytuły w tej formie.' });
    const bad = a.videos.filter((v) => v.impr >= 1500 && v.dur > 60 && (v.ctr < 1.2 || v.avp < 15)).sort((x, y) => y.impr - x.impr).slice(0, 2);
    bad.forEach((v) => out.push({ t: 'warn', x: '„' + v.title.slice(0, 40) + '”: ' + v.impr + ' wyświetleń miniatury, klikalność ' + nf(v.ctr) + ' %, obejrzenie ' + Math.round(v.avp) + ' %. ' + (v.avp < 15 ? 'Widzowie odchodzą na początku, zmień intro.' : 'Zmień tytuł i miniaturę.') }));
    if (a.comp.n && a.comp.views < 30) out.push({ t: 'warn', x: 'Składanki (powyżej 8 min): ' + a.comp.n + ' filmy, ' + a.comp.views + ' wyświetleń. Nie publikuj ich, dopóki nie masz stałej widowni.' });
    if (a.sources) { const tv = a.sources.reduce((s, x) => s + x.views, 0), th = a.sources.reduce((s, x) => s + x.hours, 0), pls = a.sources.find((x) => x.k === 'Playlisty'), se = a.sources.find((x) => x.k === 'Wyszukiwarka w YouTube');
      if (pls && pls.views && th && pls.hours / th > (pls.views / tv) * 2) out.push({ t: 'good', x: 'Playlisty: ' + pct(pls.views, tv) + ' % wyświetleń, ale ' + pct(pls.hours, th) + ' % czasu oglądania. Dodawaj każdy utwór do playlisty serii.' });
      if (se && pct(se.views, tv) < 5) out.push({ t: 'warn', x: 'Wyszukiwarka daje ' + pct(se.views, tv) + ' % wyświetleń. Fraza do wyszukania w pierwszej linii opisu to darmowy zasięg.' }); }
    if (a.regions && a.regions.length) { const tv = a.regionTotal || a.regions.reduce((s, x) => s + x.views, 0), top = a.regions.slice().sort((x, y) => y.views - x.views)[0]; out.push({ t: 'info', x: 'Największy kraj: ' + top.k + ' (' + pct(top.views, tv) + ' % wyświetleń).' }); }
    if (a.male != null) out.push({ t: 'info', x: 'Mężczyźni: ' + Math.round(a.male) + ' % wyświetleń.' });
    if (a.ages) { const young = a.ages.slice().sort((x, y) => y.hours - x.hours)[0]; if (young) out.push({ t: 'info', x: 'Najwięcej czasu oglądania daje grupa ' + young.k + ' (' + Math.round(young.hours) + ' %). Pisz i dobieraj styl pod nią.' }); }
    const gap = a.lastUpload ? Math.floor((Date.now() - a.lastUpload) / 864e5) : 0;
    if (gap > 7) out.push({ t: 'warn', x: 'Ostatnia premiera była ' + gap + ' dni temu. Regularność liczy się bardziej niż wielkie serie naraz.' });
    return out;
  };
  A.apply = function (p, a) { p.analytics = a; p.stats = { subs: a.totals.subs, hours: a.totals.hours, views: a.totals.views }; p.insights = A.insights(p, a); App.save(); };

  /* ---------- przewodnik A do Z ---------- */
  A.phases = [
    { id: 'f1', n: 'Fundament', from: 0, to: 100, goal: 'Do 100 subskrypcji: stała seria, dobre tytuły i pierwszy rytm premier.', steps: [
      ['f1a', 'Dwie premiery pełnych utworów tygodniowo, każda z teledyskiem ze Studia. Nie więcej naraz.'],
      ['f1b', 'Jedna playlista serii. Każdy nowy utwór trafia na nią od razu, a ekran końcowy wskazuje następny utwór.'],
      ['f1c', 'Tytuł to krótka fraza z refrenu, bez hashtagów i dopisków gatunku. Fraza do wyszukania jest w pierwszej linii opisu.'],
      ['f1d', 'Miniatura: jeden symbol, 1 do 3 dużych słów, wysoki kontrast, kolory kanału.'],
      ['f1e', 'Do każdego utworu jeden Short z refrenem i powiązanym filmem (opcja w Studio). Przypięty komentarz z nazwą utworu.'],
      ['f1f', 'W niedzielę: eksport ze Studio (Treść, Źródło ruchu, Region), import w aplikacji, przejrzenie wniosków.']] },
    { id: 'f2', n: 'Widownia', from: 100, to: 500, goal: 'Od 100 do 500 subskrypcji: powtarzaj to, co działa, i testuj jedną rzecz naraz.', steps: [
      ['f2a', 'Wybierz 2 najlepsze style z wyników i produkuj w nich 70 % utworów, 30 % to testy nowych.'],
      ['f2b', 'Testuj godzinę premiery: 3 premiery o jednej porze, 3 o drugiej. Porównaj wyświetlenia z pierwszych 48 godzin.'],
      ['f2c', 'Odpowiadaj na każdy komentarz w pierwszej godzinie po premierze.'],
      ['f2d', 'Dodaj opis i napisy w drugim języku tam, gdzie widzisz kraje spoza głównego rynku.'],
      ['f2e', 'Zrób drugą playlistę tematyczną z najlepszymi utworami (np. do treningu, na noc).']] },
    { id: 'f3', n: 'Próg monetyzacji', from: 500, to: 1000, goal: 'Od 500 do 1000 subskrypcji: przygotuj kanał do wniosku o Partner Program.', steps: [
      ['f3a', 'W Studio sprawdź zakładkę Zarabianie. Wymagania YouTube się zmieniają, tam jest aktualna lista.'],
      ['f3b', 'Typowe progi: 1000 subskrypcji i 4000 godzin oglądania w 12 miesiącach albo 10 mln wyświetleń Shortów w 90 dni. Wcześniejszy dostęp: 500 subskrypcji i 3000 godzin lub 3 mln Shortów.'],
      ['f3c', 'Włącz weryfikację dwuetapową i zweryfikuj kanał telefonem, to warunek wniosku.'],
      ['f3d', 'Oznaczaj treści generowane przez AI zgodnie z formularzem wgrywania i nie kopiuj cudzych utworów ani obrazów.'],
      ['f3e', 'Nie masowo: publikuj utwory z własnym tekstem, własnym teledyskiem i opisem. Treści powtarzalne mogą nie dostać monetyzacji.']] },
    { id: 'f4', n: 'Po monetyzacji', from: 1000, to: 1e9, goal: 'Od 1000 subskrypcji: zarabiaj i rozwijaj markę kanału.', steps: [
      ['f4a', 'Przejrzyj Partner Program: reklamy, a potem Super Thanks, członkostwa, jeśli kanał je ma.'],
      ['f4b', 'Zwiększ liczbę premier tylko jeśli utrzymasz jakość i wyniki z eksportu.'],
      ['f4c', 'Stwórz markę: stały motyw w miniaturach, powtarzalny układ opisu i seria odcinków.']] }
  ];
  A.phaseOf = (subs) => A.phases.find((f) => subs >= f.from && subs < f.to) || A.phases[0];
  A.guide = function (p) {
    const a = p.analytics, subs = (p.stats && p.stats.subs) || 0, hours = (p.stats && p.stats.hours) || 0, ph = A.phaseOf(subs);
    const eta = (rem, rate) => (rate > 0 ? Math.round(rem / rate) : null);
    const g = { phase: ph, subs, hours, left: { subs: Math.max(0, 1000 - subs), hours: Math.max(0, 4000 - hours) }, recs: [], etaDays: null };
    if (a) { g.etaDays = Math.max(eta(g.left.subs, a.rate.subs) || 0, eta(g.left.hours, a.rate.hours) || 0) || null; if (!a.rate.subs || !a.rate.hours) g.etaDays = null; }
    const R = (pri, x) => g.recs.push({ pri, x });
    if (!a) { R(1, 'Dodaj dane ze Studio (import), a przewodnik ułoży rekomendacje na podstawie wyników kanału.'); return g; }
    const gap = a.lastUpload ? Math.floor((Date.now() - a.lastUpload) / 864e5) : 99;
    if (gap > 7) R(1, 'Opublikuj nowy pełny utwór. Od ostatniej premiery minęło ' + gap + ' dni.');
    if (a.long.n && (a.long.ctr < 1.5 || a.long.avp < 25)) R(2, 'Popraw pakiet pełnych utworów: klikalność ' + nf(a.long.ctr) + ' %, średnie obejrzenie ' + a.long.avp + ' %. Tytuł jako fraza z refrenu, duże słowa na miniaturze, mocne pierwsze 15 sekund.');
    if (a.shorts.views > a.long.views * 2) R(2, 'Shorty dają ' + Math.round(a.shorts.views / a.totals.views * 100) + ' % wyświetleń, ale niewiele subskrypcji. Do każdego Shorta dodaj powiązany pełny utwór.');
    if (a.comp.n) R(3, 'Nie publikuj składanek, dopóki pojedyncze utwory nie mają stałej widowni.');
    R(2, 'Każdy nowy utwór dodaj do playlisty serii i ustaw ekran końcowy na kolejny utwór.');
    if (g.etaDays) R(4, 'Przy tempie z eksportu do 1000 subskrypcji i 4000 godzin potrzeba ok. ' + (g.etaDays > 700 ? Math.round(g.etaDays / 365) + ' lat' : g.etaDays + ' dni') + '. Cel to podwojenie tempa, nie zgadywanie.');
    g.recs.sort((x, y) => x.pri - y.pri); return g;
  };
})();
