/* AI (opcjonalnie, darmowy klucz Gemini) i import kanału z YouTube (opcjonalny klucz YouTube Data API). */
(function () {
  const App = (window.App = window.App || {});
  const AI = (App.ai = {});

  AI.hasKey = () => !!(App.state.settings.gemini || '').trim();

  AI.models = async function () {
    const s = App.state.settings;
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': s.gemini } });
    if (!r.ok) throw new Error('Gemini: nie mogę pobrać listy modeli (' + r.status + '). Sprawdź klucz.');
    const list = ((await r.json()).models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace(/^models\//, ''));
    const ver = (n) => { const m = /^gemini-(\d+(?:\.\d+)?)-flash(-lite)?$/.exec(n); return m ? parseFloat(m[1]) - (m[2] ? 0.01 : 0) : -1; };
    return list.filter((n) => ver(n) > 0).sort((x, y) => ver(y) - ver(x));
  };
  AI.pickModel = async function (skip) {
    const s = App.state.settings, all = await AI.models(), best = all.find((n) => !(skip || []).includes(n));
    if (!best) throw new Error('Gemini: nie znalazłem dostępnego modelu dla tego klucza.');
    s.model = best; App.save(); return best;
  };
  AI.gemini = async function (prompt, opts, tried) {
    const s = App.state.settings; tried = tried || [];
    if (!s.gemini) throw new Error('Brak klucza Gemini. Dodaj go w ustawieniach.');
    const model = s.model || 'gemini-3.8-flash'; tried.push(model);
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
    const body = { contents: [{ parts: ((opts && opts.parts) || []).concat([{ text: prompt }]) }], generationConfig: { temperature: (opts && opts.temp) || 0.95 } };
    if (opts && opts.json) body.generationConfig.responseMimeType = 'application/json';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.gemini }, body: JSON.stringify(body) });
    if (!r.ok) {
      let m = r.status + '';
      try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (e) { /* ignore */ }
      if (/prepayment|billing|credits are depleted/i.test(m)) throw new Error('Ten klucz Gemini należy do projektu z płatnymi rozliczeniami, a środki przedpłaty się skończyły. Utwórz darmowy klucz w projekcie bez rozliczeń: aistudio.google.com → Get API key → Create API key → projekt „Rezonans”. Wklej go w Ustawieniach.');
      const busy = [500, 502, 503, 504].includes(r.status) || /high demand|overloaded|unavailable|try again later/i.test(m);
      if (busy) {
        const n = (opts && opts._n) || 0;
        if (n < 3) { await new Promise((z) => setTimeout(z, [2500, 6000, 12000][n])); tried.pop(); return AI.gemini(prompt, Object.assign({}, opts, { _n: n + 1 }), tried); }
        if (tried.length < 6) { try { await AI.pickModel(tried); return AI.gemini(prompt, Object.assign({}, opts, { _n: 0 }), tried); } catch (e) { /* zgłoś poniżej */ } }
        throw new Error('Serwery Gemini są chwilowo przeciążone. Odczekaj minutę i kliknij „Przygotuj od nowa”.');
      }
      const quota = r.status === 429 || /quota|exhausted|rate limit/i.test(m), gone = r.status === 404 || /no longer available|not found|not supported/i.test(m);
      if ((quota || gone) && tried.length < 6) {
        try { await AI.pickModel(tried); return AI.gemini(prompt, opts, tried); }
        catch (e) { if (quota) throw new Error('Darmowy limit Gemini jest na dziś wyczerpany dla wszystkich dostępnych modeli. Odnawia się codziennie (ok. 9:00 czasu polskiego). Do tego czasu użyj „Kopiuj prompt do czatu AI”, wklej tekst z czatu i zapisz utwór.'); throw e; }
      }
      throw new Error('Gemini: ' + m);
    }
    const j = await r.json();
    const t = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map((x) => x.text).join('');
    if (!t) throw new Error('Gemini nie zwrócił odpowiedzi. Spróbuj ponownie.');
    return t.trim();
  };

  AI.lyrics = async function (p, idea, variantId, clean) {
    const prompt = App.engine.chatPrompt(p, idea, variantId, clean);
    const clear = (t) => t.replace(/^```\w*\n?|```$/g, '').trim();
    let t = clear(await AI.gemini(prompt, { temp: 1 }));
    let q = App.engine.lyricsQuality(t);
    if (!q.ok) {
      t = clear(await AI.gemini(prompt + '\nPoprzednia wersja miała za mało różnych linii (' + q.unique + ') i za krótkie zwrotki. Napisz od nowa: pełne zwrotki z nową treścią w każdej, min. 30 unikalnych linii.', { temp: 1 }));
      q = App.engine.lyricsQuality(t);
    }
    if (!q.ok) throw new Error('Tekst wyszedł za krótki lub powtarzalny. Kliknij ponownie.');
    return t;
  };

  AI.ideas = async function (p, text, songs) {
    const used = (p.dna.used || []).concat(songs.map((s) => s.title)).join('; ');
    const prompt = [
      'Jesteś producentem muzycznym i strategiem YouTube. Kanał: ' + p.name + ' (' + p.dna.genre + '). Język utworów: ' + (p.lang === 'pl' ? 'polski' : 'angielski') + '.',
      'Dane kanału: ' + p.insights.map((i) => i.x).join(' '),
      'Motywy: ' + p.dna.themes.join(', ') + '. Symbole: ' + p.dna.symbols.join(', ') + '. Istniejące tytuły (nie powtarzaj): ' + used + '.',
      text ? 'Pomysł użytkownika do wzmocnienia: ' + text : 'Wymyśl nowe pomysły, które pasują do kanału, ale odświeżają go jednym nowym symbolem.',
      'Zwróć JSON: tablica 3 obiektów {"title","shout","symbol","premise","pairs":[4 krótkie linie],"closing","scenes":[4 krótkie opisy kadrów po polsku], "hook","answer"}.',
      p.lang === 'pl' ? '"pairs" w formie „Słowo — fraza”, "shout" to jedno słowo okrzyku. Pomiń "hook" i "answer".' : '"hook" to pierwsza linia refrenu (do 8 słów), "answer" to linia odpowiedzi. Pomiń "pairs", "shout" i "closing".'
    ].join('\n');
    const raw = await AI.gemini(prompt, { json: true });
    const arr = JSON.parse(raw);
    return (Array.isArray(arr) ? arr : [arr]).slice(0, 3).map((x) => Object.assign({ id: App.uid('idea'), branch: (p.styleVariants[0] || {}).id }, x));
  };

  AI.peopleOK = (p) => !/no people/i.test(p.visual || '');
  /* plan kadrów pod treść: każdy kadr ilustruje konkretny fragment tekstu; powrót refrenu = ten sam kadr */
  AI.shots = async function (p, song, lines) {
    const ppl = AI.peopleOK(p);
    const prompt = ['Jesteś reżyserem teledysku. Piosenka „' + song.title + '” (kanał ' + p.name + '). Styl wizualny kanału: ' + (p.visual || p.dna.genre) + '.',
      'Linie tekstu w kolejności śpiewania (numer: linia):\n' + lines.slice(0, 90).map((l, i) => i + ': ' + l).join('\n'),
      'Zaplanuj 12 kadrów po ANGIELSKU dla generatora obrazów, po jednym na kolejny fragment tekstu. Dla każdego podaj "from" (numer pierwszej linii, którą kadr ilustruje; rosnąco, pierwszy kadr ma from 0) i "prompt".',
      'Zasady: kadr pokazuje KONKRETNY obraz z tych linii (miejsce, przedmiot, gest, pora dnia), a nie ogólny nastrój. Różne plany. Bez napisów, liter, logo, znaków wodnych. Refren, gdy wraca, ma ten sam kadr: zamiast "prompt" podaj "same_as" (numer wcześniejszego kadru, liczony od 0).',
      ppl ? 'ZASADA NAJWAŻNIEJSZA: w KAŻDYM kadrze widać człowieka-bohatera z wyraźną twarzą albo co najmniej górną połową sylwetki (np. "medium shot of the man, face clearly visible, ..."). ZAKAZANE są kadry samej dłoni, stopy, buta, przedmiotu lub fragmentu ciała bez twarzy; detal wolno pokazać tylko w kadrze, w którym widać też twarz. Jedyny wyjątek: do 2 szerokich kadrów miejsca bez człowieka (np. dźwig w mgle), oznacz je "place": true. Bohater zawsze wygląda tak samo: opisz go raz w "hero" i wpisuj ten opis w każdy kadr z człowiekiem.' : 'W kadrach nie ma ludzi: pokaż miejsca i przedmioty w jednym spójnym świecie.',
      'Dodatkowo wskaż w "thumb" numer kadru (od 0) najlepszego na miniaturę YouTube: wyraźna twarz bohatera, emocja, czytelna kompozycja z miejscem na tytuł (nigdy kadr bez twarzy).',
      'Zwróć JSON: {"hero":"...","thumb":0,"shots":[{"from":0,"prompt":"..."},{"from":5,"prompt":"...","place":true},{"from":9,"same_as":2}]}'].join('\n');
    const o = JSON.parse(await AI.gemini(prompt, { json: true, temp: 0.8 }));
    const arr = (o.shots || o || []).filter((x) => x && isFinite(Number(x.from))).map((x) => ({ from: Math.max(0, Math.round(Number(x.from))), prompt: x.prompt ? String(x.prompt) : '', same: x.same_as != null && isFinite(Number(x.same_as)) ? Math.round(Number(x.same_as)) : null, place: !!x.place }));
    arr.sort((x, y) => x.from - y.from);
    const out = arr.slice(0, 16).filter((x, i) => x.prompt || (x.same != null && x.same < i));
    if (out.length < 4) throw new Error('Gemini zwrócił za mało kadrów.');
    out[0].from = 0; out.thumb = Number.isFinite(Number(o.thumb)) ? Math.round(Number(o.thumb)) : null; out.hero = String(o.hero || '');
    return out;
  };

  /* kontrola obrazów: Gemini ogląda każdy obraz (twarz, sam fragment ciała, nadaje się na miniaturę) */
  AI.vetImages = async function (smalls) {
    const parts = []; smalls.forEach((d, i) => { parts.push({ text: 'Obraz ' + i + ':' }); parts.push({ inline_data: { mime_type: 'image/jpeg', data: d } }); });
    const prompt = 'Oceń każdy z ' + smalls.length + ' obrazów do teledysku. Dla każdego zwróć: "face" (czy wyraźnie widać twarz człowieka), "person" (czy widać człowieka: twarz lub górną część sylwetki), "fragment" (true, gdy widać tylko fragment ciała, np. samą dłoń, stopę lub but, bez twarzy i tułowia), "thumb" (0-10: jak dobra jest miniatura YouTube: wyraźna twarz, emocja, czytelna kompozycja). Zwróć tylko JSON: [{"i":0,"face":true,"person":true,"fragment":false,"thumb":8}].';
    let arr = JSON.parse(await AI.gemini(prompt, { json: true, temp: 0.1, parts })); if (!Array.isArray(arr)) arr = arr.images || [];
    const out = []; arr.forEach((x) => { const i = Number(x.i); if (i >= 0 && i < smalls.length) out[i] = { face: !!x.face, person: !!x.person, fragment: !!x.fragment, thumb: Number(x.thumb) || 0 }; });
    return out;
  };

  AI.refinePack = async function (p, song, pack) {
    const prompt = [
      'Popraw opis publikacji YouTube utworu „' + song.title + '” (kanał ' + p.name + ', język: ' + (p.lang === 'pl' ? 'polski' : 'angielski') + ').',
      'Wymagania: pierwsze dwa wersy zawierają frazę wyszukiwania i obietnicę, bez clickbaitu, 3 hashtagi na końcu, zaproszenie do subskrypcji, linia o użyciu AI (Suno).',
      'Aktualny opis:\n' + pack.description,
      'Zwróć tylko poprawiony opis.'
    ].join('\n');
    return AI.gemini(prompt, { temp: 0.7 });
  };

  /* ---------- import z YouTube ---------- */
  AI.parseHandle = function (s) {
    s = String(s || '').trim();
    const m = s.match(/youtube\.com\/(@[\w.\-]+)/i) || s.match(/^(@[\w.\-]+)/);
    if (m) return { handle: m[1] };
    const c = s.match(/channel\/(UC[\w\-]+)/i);
    if (c) return { id: c[1] };
    return null;
  };

  AI.analyzeTitles = function (items) {
    const titles = items.map((i) => i.title).filter(Boolean);
    if (!titles.length) return null;
    const all = titles.join(' ');
    const pl = (all.match(/[ąćęłńóśźż]/gi) || []).length;
    const lang = pl > titles.length * 0.3 ? 'pl' : 'en';
    const withTags = titles.filter((t) => /#\w/.test(t)).length;
    const avgLen = Math.round(titles.reduce((a, t) => a + t.length, 0) / titles.length);
    const dash = titles.filter((t) => /[—–|]/.test(t)).length;
    const stop = new Set('the and for you your with that this from have are was but not all can her his she him how our out one jak nie ale dla ten tej jest sie się oraz przez'.split(' '));
    const freq = {};
    titles.forEach((t) => t.toLowerCase().replace(/#\S+/g, '').split(/[^\p{L}]+/u).filter((w) => w.length > 3 && !stop.has(w)).forEach((w) => { freq[w] = (freq[w] || 0) + 1; }));
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);
    const hashtags = Array.from(new Set(all.match(/#[\p{L}\d_]+/gu) || [])).slice(0, 6);
    const best = items.filter((i) => i.views != null).sort((a, b) => b.views - a.views).slice(0, 3);
    return { n: titles.length, lang, withTags, avgLen, dash, top, hashtags, best, titles };
  };

  AI.importYouTube = async function (input) {
    const key = App.state.settings.yt;
    if (!key) throw new Error('Do pobrania z YouTube potrzebny jest klucz YouTube Data API (Ustawienia). Możesz też wkleić same tytuły.');
    const ref = AI.parseHandle(input);
    if (!ref) throw new Error('Wklej link do kanału (youtube.com/@nazwa) albo samą nazwę z @.');
    const api = 'https://www.googleapis.com/youtube/v3/';
    const q = ref.handle ? 'forHandle=' + encodeURIComponent(ref.handle) : 'id=' + ref.id;
    const get = async (path) => { const r = await fetch(api + path + '&key=' + encodeURIComponent(key)); const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || 'Błąd YouTube API'); return j; };
    const ch = await get('channels?part=snippet,statistics,contentDetails&' + q);
    if (!ch.items || !ch.items.length) throw new Error('Nie znaleziono kanału.');
    const c = ch.items[0];
    const uploads = c.contentDetails.relatedPlaylists.uploads;
    const pl = await get('playlistItems?part=snippet&maxResults=50&playlistId=' + uploads);
    const ids = pl.items.map((i) => i.snippet.resourceId.videoId).join(',');
    const vids = ids ? await get('videos?part=statistics,contentDetails&id=' + ids) : { items: [] };
    const vmap = {}; vids.items.forEach((v) => { vmap[v.id] = v; });
    const items = pl.items.map((i) => ({ title: i.snippet.title, views: vmap[i.snippet.resourceId.videoId] ? Number(vmap[i.snippet.resourceId.videoId].statistics.viewCount || 0) : null, desc: i.snippet.description }));
    return {
      name: c.snippet.title, handle: c.snippet.customUrl || ref.handle || '', description: c.snippet.description,
      subs: Number(c.statistics.subscriberCount || 0), views: Number(c.statistics.viewCount || 0), items
    };
  };
})();
