/* Studio teledysku: analiza utworu, sceny, napisy, render w przeglądarce */
(function () {
  const App = window.App;
  const S = (App.studio = {});
  const mem = {}; // songId -> { buf, an, imgs, status }
  const DEFAULT_IMG = 'https://rezonans-img.lewandowski-m-90.workers.dev/';
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const mmss = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const parseT = (s) => { const m = /^(\d+):(\d{1,2})$/.exec((s || '').trim()); return m ? +m[1] * 60 + +m[2] : null; };

  /* ---------- analiza dźwięku ---------- */
  S.decode = function (ab) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    return new Promise((res, rej) => ctx.decodeAudioData(ab, (b) => { ctx.close && ctx.close(); res(b); }, rej));
  };
  S.analyze = function (buf) {
    const sr = buf.sampleRate, n = buf.length, a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a;
    const hop = Math.round(sr / 100), F = Math.floor(n / hop);
    const env = new Float32Array(F), low = new Float32Array(F);
    let lp = 0; const k = Math.exp(-2 * Math.PI * 150 / sr);
    for (let f = 0; f < F; f++) {
      let s = 0, sl = 0;
      for (let i = f * hop, e = i + hop; i < e; i++) { const x = (a[i] + b[i]) * 0.5; lp = (1 - k) * x + k * lp; s += x * x; sl += lp * lp; }
      env[f] = Math.sqrt(s / hop); low[f] = Math.sqrt(sl / hop);
    }
    const on = new Float32Array(F);
    for (let f = 4; f < F; f++) { const m = (low[f - 1] + low[f - 2] + low[f - 3] + low[f - 4]) / 4; on[f] = Math.max(0, low[f] - m) + Math.max(0, env[f] - env[f - 2]) * 0.4; }
    // tempo: autokorelacja, potem siatka dokładna
    let best = 0, bl = 60;
    for (let lag = 35; lag <= 86; lag++) { let s = 0; for (let f = lag; f < F; f++) s += on[f] * on[f - lag]; for (let f = lag * 2; f < F; f += 1) s += 0.5 * on[f] * on[f - lag * 2]; if (s > best) { best = s; bl = lag; } }
    let P0 = bl; // klatki na uderzenie
    while (6000 / P0 > 150) P0 *= 2; while (6000 / P0 < 75) P0 /= 2;
    let bestS = -1, P = P0, ph = 0;
    for (let q = -0.03; q <= 0.0301; q += 0.002) {
      const Pq = P0 * (1 + q);
      for (let p0 = 0; p0 < Pq; p0 += 1) { let s = 0; for (let x = p0; x < F - 2; x += Pq) { const i = Math.round(x); s += on[i] + 0.5 * (on[i - 1] || 0) + 0.5 * (on[i + 1] || 0); } if (s > bestS) { bestS = s; P = Pq; ph = p0; } }
    }
    const beats = []; for (let x = ph; x < F; x += P) beats.push(x / 100);
    const dur = n / sr, bpm = Math.round(6000 / P * 10) / 10;
    // energia co 0,5 s
    const E = []; for (let t = 0; t < dur; t += 0.5) { let s = 0, c = 0; for (let f = Math.floor(t * 100); f < Math.min(F, Math.floor((t + 0.5) * 100)); f++) { s += env[f]; c++; } E.push(c ? s / c : 0); }
    const sorted = E.slice().sort((x, y) => x - y), ref = sorted[Math.floor(sorted.length * 0.95)] || 1;
    const en = E.map((x) => Math.min(1, x / ref));
    const energyAt = (t) => en[Math.min(en.length - 1, Math.max(0, Math.floor(t * 2)))];
    // refren: najgłośniejsze okno ok. 20 s
    const W = 40; let cb = -1, cs = Math.floor(dur * 0.12 * 2);
    const sc = []; for (let i = Math.floor(dur * 0.12 * 2); i + W < en.length - 8; i++) { let s = 0; for (let j = 0; j < W; j++) s += en[i + j]; sc.push([i, s]); if (s > cb) cb = s; }
    for (const [i, s] of sc) if (s >= cb * 0.86) { cs = i; break; }
    let cstart = cs / 2; const nb = beats.reduce((p, x) => (Math.abs(x - cstart) < Math.abs(p - cstart) ? x : p), beats[0] || 0); cstart = nb;
    // początek wokalu: pierwsza chwila, gdy energia przekracza 55 %
    let vs = 8; for (let i = 4; i < en.length; i++) { if (en[i] > 0.55 && en[i + 1] > 0.5) { vs = i / 2; break; } }
    return { dur, bpm, beats, energyAt, en, chorus: { start: cstart, end: Math.min(dur, cstart + 20) }, vocalStart: vs };
  };

  /* ---------- sceny, cięcia ---------- */
  function buildCuts(an, nImg) {
    const cuts = [], beats = an.beats; let i = 0, last = -1;
    while (i < beats.length - 1) {
      const t0 = i === 0 ? 0 : beats[i], e = an.energyAt(t0);
      const step = e > 0.7 ? 4 : e > 0.4 ? 8 : 8;
      const j = Math.min(beats.length - 1, i + step), t1 = j >= beats.length - 1 ? an.dur : beats[j];
      let img; do { img = Math.floor(Math.random() * nImg); } while (nImg > 1 && img === last); last = img;
      cuts.push({ t0, t1, img, motion: cuts.length % 4, soft: e < 0.4 });
      i = j;
    }
    if (!cuts.length) cuts.push({ t0: 0, t1: an.dur, img: 0, motion: 0, soft: true });
    cuts[cuts.length - 1].t1 = an.dur + 1;
    return cuts;
  }
  S.buildCuts = buildCuts;
  function procArt(p, seed) {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), pal = p.palette;
    let r = seed * 9301 + 49297; const R = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    const g = x.createLinearGradient(0, 0, 1024, 1024); g.addColorStop(0, pal.bg2); g.addColorStop(1, pal.bg); x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    x.globalAlpha = 0.5; for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? pal.accent : pal.accent2; x.globalAlpha = 0.06 + R() * 0.12; const s = 80 + R() * 220; x.save(); x.translate(R() * 1024, R() * 1024); x.rotate(R() * 3); x.fillRect(-s, -s / 6, s * 2, s / 3); x.restore(); }
    x.globalAlpha = 0.25; x.strokeStyle = pal.accent; x.lineWidth = 3; const cx = 300 + R() * 420, cy = 300 + R() * 420; for (let i = 1; i < 8; i++) { x.beginPath(); x.arc(cx, cy, i * 70, 0, 7); x.stroke(); }
    x.globalAlpha = 0.5; for (let i = 0; i < 40; i++) { x.fillStyle = pal.accent2; x.globalAlpha = 0.05 + R() * 0.18; const s = 28 + R() * 40; x.fillRect(Math.floor(R() * 16) * 64, Math.floor(R() * 16) * 64, s, s); }
    x.globalAlpha = 1; return c;
  }
  S.procArt = procArt;
  function loadImg(blob) {
    return new Promise((res, rej) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
  }
  S.genImage = async function (prompt) {
    const url = (App.state.settings.img || DEFAULT_IMG).trim();
    for (let a = 0; a < 2; a++) {
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, steps: 4 }) });
        if (!r.ok) throw new Error(r.status + '');
        return await loadImg(await r.blob());
      } catch (e) { if (a) throw e; await new Promise((z) => setTimeout(z, 1200)); }
    }
  };
  function visual(p) {
    if (p.visual) return p.visual;
    return 'cinematic music video still, ' + (p.dna.genre || 'moody') + ', dramatic light, no text, no watermark';
  }
  S.prompts = function (p, s) {
    const base = (s.shots && s.shots.length ? s.shots : (s.scenes || [])).filter(Boolean);
    const extra = ['wide establishing shot', 'extreme close-up detail', 'silhouette against the light', 'low angle dramatic shot'];
    const out = base.slice(0, 6); for (let i = 0; out.length < 6; i++) out.push((base[i % Math.max(1, base.length)] || s.title || p.name) + ', ' + extra[i % extra.length]);
    return out.map((x) => x + '. ' + visual(p));
  };

  /* ---------- napisy ---------- */
  S.lines = (lyrics) => (lyrics || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));
  S.heurCaps = function (lines, an) {
    const t0 = Math.max(4, an.vocalStart), t1 = an.dur - 10, tot = lines.reduce((s, l) => s + l.length + 14, 0);
    let t = t0; return lines.map((l) => { const c = { t, text: l }; t += (t1 - t0) * (l.length + 14) / tot; return c; });
  };
  function b64(ab) { const u = new Uint8Array(ab); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  S.aiCaps = async function (ab, mime, lines) {
    const prompt = 'Posłuchaj piosenki. Poniżej numerowane linie tekstu w kolejności śpiewania (powtórzenia są osobnymi liniami). Dla każdej linii podaj sekundę, w której zaczyna się jej śpiewanie. Zwróć tylko JSON: tablica obiektów {"i": numer, "t": sekundy}.\n' + lines.map((l, i) => i + ': ' + l).join('\n');
    const raw = await App.ai.gemini(prompt, { json: true, temp: 0.1, parts: [{ inline_data: { mime_type: mime || 'audio/mpeg', data: b64(ab) } }] });
    const arr = JSON.parse(raw); let prev = -1;
    const caps = lines.map((l, i) => { const o = arr.find((x) => x.i === i); return { t: o ? Number(o.t) : NaN, text: l }; });
    caps.forEach((c) => { if (!(c.t > prev)) c.t = NaN; else prev = c.t; });
    if (caps.filter((c) => !isNaN(c.t)).length < lines.length * 0.7) throw new Error('Gemini zwrócił za mało czasów');
    for (let i = 0; i < caps.length; i++) if (isNaN(caps[i].t)) { const a = caps.slice(0, i).reverse().find((c) => !isNaN(c.t)), b = caps.slice(i).find((c) => !isNaN(c.t)); caps[i].t = a && b ? (a.t + b.t) / 2 : (a ? a.t + 3 : b.t - 3); }
    return caps;
  };

  /* ---------- rysowanie klatki ---------- */
  S.makeRenderer = function (R) {
    const { p, an, imgs, cuts } = R, pal = p.palette, pl = p.lang === 'pl';
    const font = (px, w) => (w || 800) + ' ' + px + 'px "Bricolage Grotesque", system-ui, -apple-system, sans-serif';
    const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
    const cutAt = (t) => { let lo = 0, hi = cuts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (cuts[m].t0 <= t) lo = m; else hi = m - 1; } return lo; };
    function cover(ctx, im, W, H, zoom, ox, oy) {
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, sc = Math.max(W / iw, H / ih) * zoom;
      const w = iw * sc, h = ih * sc; ctx.drawImage(im, (W - w) / 2 + ox * (w - W), (H - h) / 2 + oy * (h - H), w, h);
    }
    function scene(ctx, ci, t, W, H, punch) {
      const c = cuts[ci], im = imgs[c.img % imgs.length], u = Math.min(1, Math.max(0, (t - c.t0) / Math.max(0.5, c.t1 - c.t0)));
      let z = 1.12, ox = 0, oy = 0;
      if (c.motion === 0) z = 1.08 + 0.14 * u; else if (c.motion === 1) z = 1.22 - 0.14 * u; else if (c.motion === 2) { z = 1.2; ox = 0.5 - u; } else { z = 1.2; ox = u - 0.5; oy = 0.15 * (u - 0.5); }
      cover(ctx, im, W, H, z * punch, ox * 0.9, oy);
    }
    function wrap(ctx, text, maxW) { const w = text.split(' '), out = []; let l = ''; w.forEach((x) => { const t = l ? l + ' ' + x : x; if (ctx.measureText(t).width > maxW && l) { out.push(l); l = x; } else l = t; }); if (l) out.push(l); return out; }
    return function draw(ctx, t, freq, o) {
      const W = o.W, H = o.H, vert = H > W, u0 = o.t0 || 0, e = an.energyAt(t);
      ctx.save(); ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      let bi = 0; { let lo = 0, hi = an.beats.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (an.beats[m] <= t) lo = m; else hi = m - 1; } bi = lo; }
      const bd = Math.max(0, t - an.beats[bi]), down = bi % 4 === 0, punch = 1 + (down ? 0.026 : 0.012) * Math.exp(-bd * 9) * (0.4 + e);
      const ci = cutAt(t), c = cuts[ci], el = t - c.t0;
      if (c.soft && ci > 0 && el < 0.4) { scene(ctx, ci - 1, c.t0, W, H, punch); ctx.globalAlpha = el / 0.4; scene(ctx, ci, t, W, H, punch); ctx.globalAlpha = 1; }
      else scene(ctx, ci, t, W, H, punch);
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = hexA(pal.accent2, 0.28); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.62)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, H * 0.55, 0, H); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = bg; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      const fl = Math.exp(-bd * 14) * (down ? 0.13 : 0.05) * e + (el < 0.1 && !c.soft ? (0.1 - el) * 2.2 : 0);
      if (fl > 0.003) { ctx.fillStyle = hexA(pal.accent, Math.min(0.4, fl)); ctx.fillRect(0, 0, W, H); }
      // kafelkowy wizualizer
      const N = vert ? 22 : 44, tile = W / N, gap = tile * 0.2, maxRows = vert ? 7 : 6, base = H - (vert ? H * 0.045 : H * 0.05);
      for (let i = 0; i < N; i++) {
        const bin = freq ? Math.floor(2 + Math.pow(i / N, 1.7) * 150) : 0, v = freq ? Math.min(1, freq[bin] / 255 * 1.25) : 0, rows = Math.max(1, Math.round(v * maxRows));
        for (let r = 0; r < rows; r++) { ctx.fillStyle = hexA(r > maxRows - 3 ? pal.accent2 : pal.accent, 0.35 + 0.55 * (1 - r / maxRows)); const s = tile - gap; ctx.fillRect(i * tile + gap / 2, base - (r + 1) * tile * 0.9, s, s * 0.78); }
      }
      // napisy
      const caps = R.caps || []; let ci2 = -1; for (let i = 0; i < caps.length; i++) if (caps[i].t + (R.offset || 0) <= t) ci2 = i; else break;
      if (ci2 >= 0) {
        const cp = caps[ci2], st = cp.t + (R.offset || 0), nx = caps[ci2 + 1] ? caps[ci2 + 1].t + (R.offset || 0) : st + 5;
        if (t < Math.min(nx + 0.2, st + 7)) {
          const a = Math.min(1, (t - st) / 0.22), px = vert ? W * 0.078 : H * 0.062; ctx.font = font(px, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const ls = wrap(ctx, cp.text.toUpperCase(), W * (vert ? 0.86 : 0.8)), lh = px * 1.18, y0 = (vert ? H * 0.66 : H * 0.72) - (ls.length - 1) * lh / 2 + (1 - a) * px * 0.4;
          ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.lineWidth = px * 0.16; ctx.strokeStyle = 'rgba(0,0,0,.85)';
          ls.forEach((l, i) => { ctx.strokeText(l, W / 2, y0 + i * lh); ctx.fillStyle = '#fff6e5'; ctx.fillText(l, W / 2, y0 + i * lh); });
          ctx.globalAlpha = 1;
        }
      }
      // plansza tytułowa i zakończenie
      const rel = t - u0, total = o.dur;
      if (!o.short && rel < 4.5) {
        const a = rel < 0.6 ? rel / 0.6 : rel > 3.6 ? Math.max(0, (4.5 - rel) / 0.9) : 1; ctx.globalAlpha = a; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H * 0.001);
        ctx.font = font(vert ? W * 0.1 : H * 0.1, 800); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.8)';
        const tl = wrap(ctx, (R.title || '').toUpperCase(), W * 0.84), px = vert ? W * 0.1 : H * 0.1;
        tl.forEach((l, i) => { const y = H * 0.4 + i * px * 1.1; ctx.strokeText(l, W / 2, y); ctx.fillStyle = pal.accent; ctx.fillText(l, W / 2, y); });
        ctx.font = font(px * 0.32, 600); ctx.fillStyle = '#fff6e5'; ctx.fillText(p.name.toUpperCase(), W / 2, H * 0.4 + tl.length * px * 1.1 + px * 0.2); ctx.globalAlpha = 1;
      }
      if (rel > total - (o.short ? 2.2 : 5)) {
        const a = Math.min(1, (rel - (total - (o.short ? 2.2 : 5))) / 0.6), px = vert ? W * 0.07 : H * 0.06; ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = font(px, 800); ctx.lineWidth = px * 0.18; ctx.strokeStyle = 'rgba(0,0,0,.85)';
        const msg = o.short ? (pl ? 'Pełny utwór na kanale' : 'Full song on the channel') : (pl ? 'Subskrybuj kanał' : 'Subscribe');
        ctx.strokeText(msg, W / 2, H * 0.3); ctx.fillStyle = pal.accent; ctx.fillText(msg, W / 2, H * 0.3);
        ctx.font = font(px * 0.62, 600); ctx.strokeText(p.name + (p.handle ? '  ' + (p.handle[0] === '@' ? p.handle : '@' + p.handle) : ''), W / 2, H * 0.3 + px * 1.1); ctx.fillStyle = '#fff6e5'; ctx.fillText(p.name + (p.handle ? '  ' + (p.handle[0] === '@' ? p.handle : '@' + p.handle) : ''), W / 2, H * 0.3 + px * 1.1); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = hexA(pal.accent, 0.9); ctx.fillRect(0, H - 3, W * Math.min(1, rel / total), 3);
      ctx.restore();
    };
  };

  S.thumb = async function (R) {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const ctx = c.getContext('2d'), pal = R.p.palette, im = R.imgs[0];
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, 1280, 720);
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, sc = Math.max(1280 / iw, 720 / ih) * 1.05; ctx.drawImage(im, (1280 - iw * sc) / 2, (720 - ih * sc) / 2, iw * sc, ih * sc);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = pal.accent2 + '55'; ctx.fillRect(0, 0, 1280, 720); ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 200, 0, 720); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.8)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    const words = (R.thumbWords || R.title).toUpperCase().split(/\s+/).slice(0, 3).join(' ');
    let px = 190; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    for (; px > 60; px -= 6) { ctx.font = '800 ' + px + 'px "Bricolage Grotesque", system-ui, sans-serif'; if (ctx.measureText(words).width < 1130) break; }
    ctx.lineJoin = 'round'; ctx.lineWidth = px * 0.14; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.strokeText(words, 70, 650); ctx.fillStyle = pal.accent; ctx.fillText(words, 70, 650);
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
  };

  /* ---------- odtwarzanie i nagrywanie ---------- */
  S.play = async function (R, canvas, opt) {
    const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
    if (ctx.state === 'suspended') await ctx.resume();
    const draw = S.makeRenderer(R), g2 = canvas.getContext('2d'), start = opt.start, len = opt.len;
    const src = ctx.createBufferSource(); src.buffer = R.buf; const gain = ctx.createGain(); const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.6;
    src.connect(gain); gain.connect(an);
    let rec = null, chunks = [], stopFn;
    if (opt.record) {
      const dest = ctx.createMediaStreamDestination(); an.connect(dest);
      const stream = canvas.captureStream(30); dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mt = types.find((x) => window.MediaRecorder && MediaRecorder.isTypeSupported(x));
      if (!mt) throw new Error('Ta przeglądarka nie potrafi nagrywać wideo. Użyj Safari na iPhonie lub Chrome.');
      rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 7e6, audioBitsPerSecond: 192000 }); rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.mt = mt;
    } else an.connect(ctx.destination);
    let wl = null; try { wl = await navigator.wakeLock.request('screen'); } catch (e) { /* ignore */ }
    const freq = new Uint8Array(an.frequencyBinCount); let raf = 0, done = false;
    const finished = new Promise((res) => { stopFn = res; });
    if (rec) rec.start(500);
    const t0 = ctx.currentTime + 0.15; src.start(t0, start, len);
    gain.gain.setValueAtTime(1, t0 + len - 0.7); gain.gain.linearRampToValueAtTime(0, t0 + len);
    const loop = () => {
      const t = start + Math.max(0, ctx.currentTime - t0);
      an.getByteFrequencyData(freq); draw(g2, Math.min(t, start + len), freq, { W: canvas.width, H: canvas.height, t0: start, dur: len, short: opt.short });
      if (opt.onProgress) opt.onProgress(Math.min(1, (t - start) / len));
      if (t >= start + len + 0.1 || done) { stopFn(); return; } raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    opt.stop = () => { done = true; };
    await finished; cancelAnimationFrame(raf); try { src.stop(); } catch (e) { /* ignore */ }
    let blob = null;
    if (rec) { await new Promise((res) => { rec.onstop = res; rec.stop(); }); blob = new Blob(chunks, { type: rec.mt.split(';')[0] }); }
    try { ctx.close(); } catch (e) { /* ignore */ } if (wl) { try { wl.release(); } catch (e) { /* ignore */ } }
    return blob;
  };
  S.save = async function (blob, name) {
    const file = new File([blob], name, { type: blob.type });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
  };


  /* ---------- wysyłka na YouTube (prywatny film) ---------- */
  const YT = (S.yt = { token: null, exp: 0 });
  function loadGsi() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((res, rej) => { const el = document.createElement('script'); el.src = 'https://accounts.google.com/gsi/client'; el.onload = res; el.onerror = () => rej(new Error('Nie udało się połączyć z Google. Sprawdź internet.')); document.head.appendChild(el); });
  }
  YT.login = async function () {
    if (YT.token && Date.now() < YT.exp - 60000) return YT.token;
    const cid = (App.state.settings.ytClient || '').trim();
    if (!cid) throw new Error('Wpisz Client ID Google w Ustawieniach. Instrukcja jest w README.');
    await loadGsi();
    return new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({ client_id: cid, scope: 'https://www.googleapis.com/auth/youtube', prompt: 'select_account',
        callback: (r) => { if (r.error) rej(new Error('Logowanie Google: ' + r.error)); else { YT.token = r.access_token; YT.exp = Date.now() + (r.expires_in || 3000) * 1000; res(YT.token); } },
        error_callback: (e) => rej(new Error('Logowanie przerwane' + (e && e.type ? ' (' + e.type + ')' : ''))) });
      tc.requestAccessToken();
    });
  };
  YT.upload = async function (blob, meta, onProgress) {
    const token = await YT.login();
    const body = { snippet: { title: meta.title.slice(0, 100), description: meta.description.slice(0, 4900), tags: meta.tags, categoryId: '10', defaultLanguage: meta.lang, defaultAudioLanguage: meta.lang }, status: { privacyStatus: 'private', selfDeclaredMadeForKids: false } };
    const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': blob.type || 'video/mp4', 'X-Upload-Content-Length': String(blob.size) }, body: JSON.stringify(body) });
    if (!init.ok) { let m = init.status + ''; try { m = (await init.json()).error.message; } catch (e) { /* ignore */ } throw new Error('YouTube odrzucił wysyłkę: ' + m); }
    const loc = init.headers.get('Location'); if (!loc) throw new Error('YouTube nie zwrócił adresu wysyłki.');
    const res = await new Promise((ok, no) => {
      const x = new XMLHttpRequest(); x.open('PUT', loc); x.setRequestHeader('Content-Type', blob.type || 'video/mp4');
      x.upload.onprogress = (e) => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => (x.status >= 200 && x.status < 300 ? ok(JSON.parse(x.responseText)) : no(new Error('Wysyłka przerwana: ' + x.status + ' ' + (x.responseText || '').slice(0, 160))));
      x.onerror = () => no(new Error('Przerwano połączenie podczas wysyłki. Spróbuj ponownie przy lepszym Wi-Fi.')); x.send(blob);
    });
    return res.id;
  };
  YT.thumb = async function (videoId, blob) {
    const token = await YT.login();
    const r = await fetch('https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=' + videoId, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'image/jpeg' }, body: blob });
    if (!r.ok) throw new Error('Miniatura nie została ustawiona (' + r.status + '). Ustaw ją ręcznie w Studio.');
  };
  YT.playlist = async function (videoId, playlistId) {
    const token = await YT.login();
    const r = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } }) });
    if (!r.ok) throw new Error('Nie dodano do playlisty (' + r.status + ').');
  };

  /* ---------- ekran studia ---------- */
  S.open = function (songId) {
    const K = App.ui.kit, h = App.ui.h, icon = App.ui.icon, toast = App.ui.toast;
    const s = App.song(songId), p = App.profile(s.profileId);
    const M = (mem[songId] = mem[songId] || { imgs: [], caps: null, offset: 0, status: '' });
    K.openSheet('Studio teledysku', (render) => {
      const hasAudio = !!M.an;
      const key = App.ai.hasKey();
      const fileIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: async (e) => {
        const f = e.target.files[0]; if (!f) return; M.status = 'Analizuję utwór…'; render();
        try { M.file = f; M.ab = await f.arrayBuffer(); M.buf = await S.decode(M.ab.slice(0)); M.an = S.analyze(M.buf); M.cuts = null; if (!s.chorusStart) { s.chorusStart = mmss(M.an.chorus.start); App.save(); } M.status = ''; M.caps = null; }
        catch (er) { M.status = 'Nie udało się wczytać pliku: ' + er.message; } render();
      } });
      const prompts = S.prompts(p, s);
      const mk = () => {
        if (!M.imgs.length) M.imgs = prompts.map((x, i) => procArt(p, i + 3));
        if (!M.cuts) M.cuts = buildCuts(M.an, M.imgs.length);
        if (!M.caps) { const ln = S.lines(s.lyrics); M.caps = ln.length ? S.heurCaps(ln, M.an) : []; M.align = ln.length ? 'przybliżone' : 'brak tekstu'; }
        return { p, an: M.an, imgs: M.imgs, cuts: M.cuts, caps: M.caps, offset: M.offset, title: s.title || '', buf: M.buf, thumbWords: s.thumbWords };
      };
      const cv = h('canvas', { width: 640, height: 360, class: 'studio-cv' });
      const out = h('div', { class: 'stack' });
      const bar = h('div', { class: 'mt' }, h('i', { style: { width: '0%' } }));
      const setBar = (v) => { bar.firstChild.style.width = Math.round(v * 100) + '%'; };
      let busy = false;
      const guard = (fn) => async (e) => { if (busy) return; busy = true; const b = e.currentTarget; b.disabled = true; try { await fn(); } catch (er) { toast(er.message || 'Błąd'); } busy = false; b.disabled = false; };
      const showStill = () => { try { const R = mk(); S.makeRenderer(R)(cv.getContext('2d'), M.an.chorus.start + 0.3, null, { W: cv.width, H: cv.height, t0: 0, dur: M.an.dur }); } catch (er) { /* ignore */ } };
      const renderTo = (short) => guard(async () => {
        const R = mk(), W = short ? 720 : 1280, H = short ? 1280 : 720, c = document.createElement('canvas'); c.width = W; c.height = H;
        const cs = parseT(s.chorusStart), start = short ? (cs !== null && cs < M.an.dur - 8 ? cs : M.an.chorus.start) : 0, len = short ? Math.min(28, M.an.dur - start) : M.an.dur;
        toast('Renderuję w czasie utworu. Nie wychodź z aplikacji.'); setBar(0);
        const blob = await S.play(R, c, { start, len, record: true, short, onProgress: setBar });
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm', name = (s.title || 'teledysk').replace(/[^\w\-]+/g, '_') + (short ? '_short' : '') + '.' + ext;
        out.textContent = ''; const url = URL.createObjectURL(blob);
        out.appendChild(h('video', { src: url, controls: true, playsinline: true, class: 'studio-cv', style: { aspectRatio: W + '/' + H, maxHeight: '60vh' } }));
        out.appendChild(h('button', { class: 'btn big', onclick: () => S.save(blob, name) }, icon('copy', 18), 'Zapisz plik (' + Math.round(blob.size / 1e6) + ' MB)'));
        const ytbtn = h('button', { class: 'btn big ghost', onclick: guard(async () => {
          const E = App.engine, pack = E.publish(p, s), meta = { title: short ? (pack.shortTitles[0] || pack.hooks[0] || s.title) : pack.titles[0], description: pack.description, tags: pack.tags.join(',').length > 480 ? pack.tags.slice(0, 12) : pack.tags, lang: p.lang };
          toast('Wysyłam na YouTube jako prywatny. Nie wychodź z aplikacji.'); setBar(0);
          const id = await YT.upload(blob, meta, setBar); s.yt = s.yt || {}; s.yt[short ? 'short' : 'full'] = id; App.save();
          if (!short) { try { await YT.thumb(id, await S.thumb(mk())); } catch (er) { toast(er.message); } }
          out.appendChild(h('p', { class: 'hint' }, 'Wysłano jako prywatny. Otwórz w Studio, sprawdź i ustaw na publiczny: https://studio.youtube.com/video/' + id + '/edit'));
          out.appendChild(h('a', { class: 'btn big', href: 'https://studio.youtube.com/video/' + id + '/edit', target: '_blank', rel: 'noopener' }, 'Otwórz w YouTube Studio')); toast('Film jest na kanale jako prywatny');
        }) }, icon('upload', 18), 'Wyślij na YouTube jako prywatny');
        out.appendChild(ytbtn);
        toast('Gotowe');
      });
      if (hasAudio) showStill();
      return h('div', { class: 'stack' },
        h('p', { class: 'muted' }, 'Wczytaj mp3 z Suno. Aplikacja znajdzie tempo i refren, ułoży cięcia w rytm i dopasuje napisy. Wideo powstaje w tej przeglądarce, za darmo.'),
        h('label', { class: 'btn big filebtn' }, icon('plus', 18), hasAudio ? 'Zmień plik mp3' : 'Wybierz plik mp3', fileIn),
        M.status ? h('p', { class: 'hint' }, M.status) : null,
        hasAudio ? h('div', { class: 'stack' },
          h('p', { class: 'muted small' }, 'Czas ' + mmss(M.an.dur) + ' · tempo ok. ' + Math.round(M.an.bpm) + ' bpm · refren od ' + mmss(M.an.chorus.start) + ' · napisy: ' + (M.align || '—')),
          cv,
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn ghost', onclick: guard(async () => { const R = mk(); setBar(0); await S.play(R, cv, { start: M.an.chorus.start, len: 15, record: false, onProgress: setBar }); showStill(); }) }, icon('refresh', 18), 'Podgląd 15 s z dźwiękiem')),
          bar,
          h('h3', { class: 'sec' }, 'Sceny'),
          h('p', { class: 'muted small' }, M.imgs.length && M.generated ? 'Obrazy wygenerowane. Możesz wygenerować od nowa.' : 'Teraz używam kafelków w kolorach kanału. Wygeneruj obrazy, żeby sceny pasowały do tekstu.'),
          h('div', { class: 'row-btns' },
            key ? h('button', { class: 'btn ghost', onclick: guard(async () => { toast('Gemini pisze sceny…'); s.shots = await App.ai.shots(p, s); App.save(); M.generated = false; render(); }) }, icon('spark', 18), 'Wymyśl sceny z tekstu') : null,
            h('button', { class: 'btn', onclick: guard(async () => {
              const list = S.prompts(p, s), res = []; let fails = 0;
              for (let i = 0; i < list.length; i++) { toast('Obraz ' + (i + 1) + ' z ' + list.length); setBar(i / list.length); try { res.push(await S.genImage(list[i])); } catch (er) { fails++; res.push(procArt(p, i + 3)); } }
              M.imgs = res; M.cuts = null; M.generated = fails < list.length; setBar(1); toast(fails ? 'Część obrazów zastąpiłem kafelkami (' + fails + ')' : 'Obrazy gotowe'); render();
            }) }, icon('spark', 18), 'Generuj obrazy')),
          M.imgs.length ? h('div', { class: 'thumbs' }, M.imgs.map((im) => { const c = document.createElement('canvas'); c.width = 160; c.height = 160; const w = im.naturalWidth || im.width, hh = im.naturalHeight || im.height; c.getContext('2d').drawImage(im, 0, 0, w, hh, 0, 0, 160, 160); c.className = 'thumb'; return c; })) : null,
          h('h3', { class: 'sec' }, 'Napisy'),
          s.lyrics ? h('div', { class: 'row-btns' },
            key ? h('button', { class: 'btn ghost', onclick: guard(async () => { toast('Gemini słucha utworu…'); M.caps = await S.aiCaps(M.ab, M.file && M.file.type, S.lines(s.lyrics)); M.align = 'dokładne (Gemini)'; render(); }) }, icon('spark', 18), 'Zsynchronizuj z piosenką') : null) : h('p', { class: 'hint' }, 'Brak tekstu w utworze. Wklej go w karcie utworu, żeby dodać napisy.'),
          h('label', { class: 'field' }, h('span', { class: 'flabel' }, 'Przesunięcie napisów: ' + M.offset.toFixed(1) + ' s'), h('input', { type: 'range', min: -4, max: 4, step: 0.1, value: M.offset, oninput: (e) => { M.offset = +e.target.value; e.target.previousSibling.textContent = 'Przesunięcie napisów: ' + M.offset.toFixed(1) + ' s'; } })),
          h('h3', { class: 'sec' }, 'Gotowe pliki'),
          h('button', { class: 'btn big', onclick: renderTo(false) }, icon('play', 18), 'Zrenderuj film 16:9 (' + mmss(M.an.dur) + ')'),
          h('button', { class: 'btn big ghost', onclick: renderTo(true) }, icon('play', 18), 'Zrenderuj Short 9:16 z refrenem'),
          h('button', { class: 'btn big ghost', onclick: guard(async () => { const b = await S.thumb(mk()); S.save(b, (s.title || 'miniatura').replace(/[^\w\-]+/g, '_') + '.jpg'); }) }, icon('copy', 18), 'Miniatura 1280×720'),
          out) : null);
    }, { onClose: () => { App.save(); } });
  };
})();
