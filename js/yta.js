/* YouTube Analytics API: prawdziwe dane dzienne kanału (wyświetlenia, czas, subskrypcje, % obejrzenia, klikalność).
   Darmowe, przez to samo logowanie Google co wysyłka filmów. Każdy kanał łączy się osobno. */
(function () {
  const App = window.App, Y = (App.yta = {});
  const SCOPE = 'https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly';
  const tok = {};
  const iso = (d) => d.toISOString().slice(0, 10);
  const norm = (x) => (x || '').toLowerCase().replace(/^@/, '').replace(/\s+/g, '');

  function gsi() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((res, rej) => { const el = document.createElement('script'); el.src = 'https://accounts.google.com/gsi/client'; el.onload = res; el.onerror = () => rej(new Error('Nie udało się połączyć z Google. Sprawdź internet.')); document.head.appendChild(el); });
  }
  Y.preload = () => gsi().catch(() => {});

  async function login(p) {
    const t = tok[p.id]; if (t && Date.now() < t.exp - 60000) return t.token;
    const cid = (App.state.settings.ytClient || '').trim(); if (!cid) throw new Error('Brak Google OAuth Client ID w Ustawieniach.');
    await gsi();
    const r = await new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({ client_id: cid, scope: SCOPE, prompt: 'select_account',
        callback: (x) => (x.error ? rej(new Error('Logowanie Google: ' + x.error)) : res(x)),
        error_callback: (e) => rej(new Error('Logowanie przerwane' + (e && e.type ? ' (' + e.type + ')' : ''))) });
      tc.requestAccessToken();
    });
    const ch = await get('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', r.access_token);
    const c = (ch.items || [])[0]; if (!c) throw new Error('To konto nie ma kanału YouTube. Wybierz w oknie Google kanał „' + p.name + '”.');
    const ok = (p.handle && c.snippet.customUrl && norm(c.snippet.customUrl) === norm(p.handle)) || norm(c.snippet.title) === norm(p.name);
    if (!ok) throw new Error('Zalogowano na kanał „' + c.snippet.title + '”, a dane są dla „' + p.name + '”. Kliknij ponownie i w oknie Google wybierz kanał „' + p.name + '”.');
    tok[p.id] = { token: r.access_token, exp: Date.now() + (r.expires_in || 3000) * 1000 };
    p.yt = Object.assign(p.yt || {}, { channelId: c.id, title: c.snippet.title, subs: +(c.statistics.subscriberCount || 0), views: +(c.statistics.viewCount || 0), videos: +(c.statistics.videoCount || 0) });
    return r.access_token;
  }
  async function get(url, token) {
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) {
      let m = String(r.status); try { const j = await r.json(); m = (j.error && j.error.message) || m; } catch (e) { /* ignore */ }
      if (/has not been used|is disabled|accessNotConfigured/i.test(m)) throw new Error('W Google Cloud nie jest włączone „YouTube Analytics API”. Instrukcja: Wyniki → Jak połączyć.');
      throw Object.assign(new Error('YouTube: ' + m), { status: r.status });
    }
    return r.json();
  }
  const rows = (j) => { const h = (j.columnHeaders || []).map((c) => c.name); return (j.rows || []).map((r) => { const o = {}; h.forEach((k, i) => { o[k] = r[i]; }); return o; }); };
  const rep = (token, q) => get('https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&' + new URLSearchParams(q).toString(), token);

  /* pobiera 180 dni danych dziennych (żeby porównać okres z poprzednim) i wyniki filmów */
  Y.sync = async function (p) {
    const token = await login(p), end = new Date(Date.now() - 864e5), start = new Date(end.getTime() - 179 * 864e5);
    const base = { startDate: iso(start), endDate: iso(end), dimensions: 'day', sort: 'day' };
    const M = 'views,estimatedMinutesWatched,averageViewPercentage,subscribersGained,subscribersLost';
    let days, hasCtr = true;
    try { days = rows(await rep(token, Object.assign({ metrics: M + ',videoThumbnailImpressions,videoThumbnailImpressionsClickRate' }, base))); }
    catch (e) { if (e.status === 400) { hasCtr = false; days = rows(await rep(token, Object.assign({ metrics: M }, base))); } else throw e; }
    // filmy: wyniki z całego okresu
    let vids = [];
    try { vids = rows(await rep(token, { startDate: iso(start), endDate: iso(end), dimensions: 'video', metrics: 'views,estimatedMinutesWatched,averageViewPercentage,subscribersGained', sort: '-views', maxResults: 50 })); } catch (e) { /* opcjonalne */ }
    // godziny do progu: 365 dni, tylko długie filmy (Shorty się nie liczą)
    let hours365 = null;
    try {
      const yr = rows(await rep(token, { startDate: iso(new Date(end.getTime() - 364 * 864e5)), endDate: iso(end), dimensions: 'creatorContentType', metrics: 'estimatedMinutesWatched' }));
      const vod = yr.find((r) => /videoOnDemand|VIDEO_ON_DEMAND/i.test(r.creatorContentType)); if (vod) hours365 = +(vod.estimatedMinutesWatched / 60).toFixed(1);
    } catch (e) { /* zostaje null */ }
    if (hours365 == null) { try { const yr = rows(await rep(token, { startDate: iso(new Date(end.getTime() - 364 * 864e5)), endDate: iso(end), metrics: 'estimatedMinutesWatched' })); if (yr[0]) { hours365 = +(yr[0].estimatedMinutesWatched / 60).toFixed(1); p.yt.hoursAll = true; } } catch (e) { /* ignore */ } }
    const d = days.map((r) => ({ d: r.day, views: +r.views || 0, min: +r.estimatedMinutesWatched || 0, avp: +r.averageViewPercentage || 0, subs: (+r.subscribersGained || 0) - (+r.subscribersLost || 0), impr: hasCtr ? +r.videoThumbnailImpressions || 0 : null, ctr: hasCtr ? +r.videoThumbnailImpressionsClickRate || 0 : null }));
    p.yt = Object.assign(p.yt || {}, { at: Date.now(), days: d, hasCtr, videos: vids, hours365 });
    // historia progów: jeden wpis dziennie
    const hist = (p.yt.hist = p.yt.hist || []), today = iso(new Date());
    const entry = { d: today, subs: p.yt.subs, hours: hours365 };
    if (hist.length && hist[hist.length - 1].d === today) hist[hist.length - 1] = entry; else hist.push(entry);
    if (hist.length > 400) hist.splice(0, hist.length - 400);
    p.stats = Object.assign({}, p.stats, { subs: p.yt.subs, views: p.yt.views }, hours365 != null ? { hours: hours365 } : {});
    App.save();
    return p.yt;
  };

  /* podsumowanie okresu i porównanie z poprzednim okresem tej samej długości */
  Y.period = function (p, n) {
    const src = (p.yt && p.yt.days) || (p.analytics && p.analytics.daily) || null;
    if (!src || !src.length) return null;
    const cur = src.slice(-n), prev = src.slice(-2 * n, -n);
    const sum = (a, k) => a.reduce((s, x) => s + (+x[k] || 0), 0);
    const wavg = (a, k, w) => { const tw = sum(a, w); return tw ? a.reduce((s, x) => s + (+x[k] || 0) * (+x[w] || 0), 0) / tw : null; };
    const agg = (a) => ({ views: sum(a, 'views'), subs: sum(a, 'subs'), min: sum(a, 'min'), avp: wavg(a, 'avp', 'views'), ctr: a.some((x) => x.ctr != null) ? wavg(a, 'ctr', 'impr') : null, impr: sum(a, 'impr') });
    const c = agg(cur), pv = prev.length === n ? agg(prev) : null;
    return { n, series: cur, cur: c, prev: pv, src: p.yt && p.yt.days ? 'YouTube Analytics' : 'eksport ze Studio', at: p.yt && p.yt.at ? p.yt.at : (p.analytics && p.analytics.at) };
  };
})();
