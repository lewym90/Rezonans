/* AI (opcjonalnie, darmowy klucz Gemini) i import kanału z YouTube (opcjonalny klucz YouTube Data API). */
(function () {
  const App = (window.App = window.App || {});
  const AI = (App.ai = {});

  AI.hasKey = () => !!(App.state.settings.gemini || '').trim();

  AI.gemini = async function (prompt, opts) {
    const s = App.state.settings;
    if (!s.gemini) throw new Error('Brak klucza Gemini. Dodaj go w ustawieniach.');
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(s.model || 'gemini-2.5-flash') + ':generateContent';
    const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: (opts && opts.temp) || 0.95 } };
    if (opts && opts.json) body.generationConfig.responseMimeType = 'application/json';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.gemini }, body: JSON.stringify(body) });
    if (!r.ok) {
      let m = r.status + '';
      try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (e) { /* ignore */ }
      throw new Error('Gemini: ' + m);
    }
    const j = await r.json();
    const t = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map((x) => x.text).join('');
    if (!t) throw new Error('Gemini nie zwrócił odpowiedzi. Spróbuj ponownie.');
    return t.trim();
  };

  AI.lyrics = async function (p, idea, variantId, clean) {
    const prompt = App.engine.chatPrompt(p, idea, variantId, clean);
    let t = await AI.gemini(prompt);
    t = t.replace(/^```\w*\n?|```$/g, '').trim();
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
