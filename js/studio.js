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
  /* cechy brzmienia co 0,5 s (24 pasma, widmo FFT) i wykrywanie refrenu po powtarzalności */
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < h; k++) { const xr = re[i + k + h] * cr - im[i + k + h] * ci, xi = re[i + k + h] * ci + im[i + k + h] * cr; re[i + k + h] = re[i + k] - xr; im[i + k + h] = im[i + k] - xi; re[i + k] += xr; im[i + k] += xi; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
    }
  }
  S.fft = fft;
  function timbre(a, b, sr, step) {
    const N = 4096, NB = 24, frames = Math.floor(a.length / sr / step), lo = 90, hi = Math.min(8000, sr * 0.45), bin = sr / N;
    const edges = []; for (let i = 0; i <= NB; i++) edges.push(Math.max(1, Math.round(lo * Math.pow(hi / lo, i / NB) / bin)));
    const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    const re = new Float32Array(N), im = new Float32Array(N), F = [];
    for (let f = 0; f < frames; f++) {
      const v = new Float32Array(NB);
      for (const off of [-0.12, 0.12]) {
        const c0 = Math.floor((f + 0.5) * step * sr + off * sr) - (N >> 1); re.fill(0); im.fill(0);
        for (let i = 0; i < N; i++) { const k = c0 + i; if (k >= 0 && k < a.length) re[i] = (a[k] + b[k]) * 0.5 * win[i]; }
        fft(re, im);
        for (let q = 0; q < NB; q++) { let s = 0; for (let k = edges[q]; k < Math.max(edges[q] + 1, edges[q + 1]); k++) s += re[k] * re[k] + im[k] * im[k]; v[q] += s; }
      }
      for (let q = 0; q < NB; q++) v[q] = Math.log(1e-7 + v[q] / 2);
      F.push(v);
    }
    for (let q = 0; q < NB; q++) { let m = 0, s = 0; for (const v of F) m += v[q]; m /= F.length || 1; for (const v of F) s += (v[q] - m) * (v[q] - m); s = Math.sqrt(s / (F.length || 1)) || 1; for (const v of F) v[q] = (v[q] - m) / s; }
    for (const v of F) { let n = 0; for (let q = 0; q < NB; q++) n += v[q] * v[q]; n = Math.sqrt(n) || 1; for (let q = 0; q < NB; q++) v[q] /= n; }
    return F;
  }
  function findChorus(feat, en, dur, vocalStart) {
    const F = feat.length, step = 0.5;
    if (F < 40) return { start: Math.min(Math.max(4, vocalStart), Math.max(0, dur - 12)), rep: 0 };
    const L = Math.min(32, Math.floor(F / 4)), C = new Float32Array(F * F);
    for (let i = 0; i < F; i++) for (let j = i; j < F; j++) { let s = 0; const x = feat[i], y = feat[j]; for (let q = 0; q < x.length; q++) s += x[q] * y[q]; C[i * F + j] = s; C[j * F + i] = s; }
    const win = (i, j) => { let s = 0; for (let k = 0; k < L; k++) s += C[(i + k) * F + j + k]; return s / L; };
    const i0 = Math.max(Math.ceil(Math.max(6, vocalStart - 2) / step), 0), i1 = F - L - Math.ceil(6 / step), rows = [];
    for (let i = i0; i <= i1; i++) {
      let b1 = -2, bj = -1; for (let j = 0; j + L <= F; j++) { if (Math.abs(j - i) < L) continue; const s = win(i, j); if (s > b1) { b1 = s; bj = j; } }
      let b2 = -2; for (let j = 0; j + L <= F; j++) { if (Math.abs(j - i) < L || Math.abs(j - bj) < L) continue; const s = win(i, j); if (s > b2) b2 = s; }
      let e = 0; for (let k = 0; k < L; k++) e += en[i + k] || 0;
      rows.push({ i, bj, rep: b2 > -2 ? (b1 + b2) / 2 : b1 * 0.85, e: e / L });
    }
    if (!rows.length) return { start: Math.max(4, vocalStart), rep: 0 };
    const nrm = (k) => { const mn = Math.min(...rows.map((r) => r[k])), mx = Math.max(...rows.map((r) => r[k])); return (x) => (mx > mn ? (x - mn) / (mx - mn) : 0.5); };
    const nr = nrm('rep'), ne = nrm('e'); rows.forEach((r) => { r.sc = 0.55 * nr(r.rep) + 0.45 * ne(r.e); });
    const best = Math.max(...rows.map((r) => r.sc)), pick = rows.find((r) => r.sc >= best - 0.08);
    const cands = []; rows.slice().sort((x, y) => y.sc - x.sc).forEach((r) => { if (cands.length < 5 && cands.every((c) => Math.abs(c.i - r.i) >= L / 2)) cands.push(r); });
    return { start: pick.i * step, rep: pick.rep, match: pick.bj * step, cands: cands.map((r) => ({ t: r.i * step, sc: Math.round(r.sc * 100) / 100, rep: Math.round(r.rep * 100) / 100, e: Math.round(r.e * 100) / 100 })).sort((x, y) => x.t - y.t) };
  }

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
    // początek wokalu: pierwsza chwila, gdy energia przekracza 55 %
    let vs = 8; for (let i = 4; i < en.length; i++) { if (en[i] > 0.55 && en[i + 1] > 0.5) { vs = i / 2; break; } }
    // refren: powtarzalność brzmienia (samopodobieństwo) razem z energią
    const feat = timbre(a, b, sr, 0.5), ch = findChorus(feat, en, dur, vs);
    let cstart = ch.start; const nb = beats.reduce((p, x) => (Math.abs(x - cstart) < Math.abs(p - cstart) ? x : p), beats[0] || 0); if (Math.abs(nb - cstart) < 1.5) cstart = nb;
    return { dur, bpm, beats, energyAt, en, chorus: { start: cstart, end: Math.min(dur, cstart + 20), rep: ch.rep, match: ch.match, cands: ch.cands || [] }, vocalStart: vs };
  };

  /* ---------- sceny, cięcia ---------- */
  function buildCuts(an, imgAt) {
    const cuts = [], beats = an.beats; let i = 0;
    while (i < beats.length - 1) {
      const t0 = i === 0 ? 0 : beats[i], e = an.energyAt(t0);
      const step = e > 0.7 ? 4 : 8;
      const j = Math.min(beats.length - 1, i + step), t1 = j >= beats.length - 1 ? an.dur : beats[j];
      cuts.push({ t0, t1, img: imgAt(t0 + (t1 - t0) * 0.5), motion: cuts.length % 4, soft: e < 0.4 });
      i = j;
    }
    if (!cuts.length) cuts.push({ t0: 0, t1: an.dur, img: imgAt(0), motion: 0, soft: true });
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
  /* plan kadrów: każdy kadr ilustruje fragment tekstu (from = numer pierwszej linii) */
  function planFallback(s, nLines) {
    const base = (s.scenes || []).filter(Boolean), extra = ['wide establishing shot of the place', 'medium shot of the man, face clearly visible', 'low angle shot of the man, full figure', 'silhouette of the man against the light'], n = 8, out = [];
    for (let i = 0; i < n; i++) out.push({ from: Math.floor(i * Math.max(1, nLines) / n), prompt: (base[i % Math.max(1, base.length)] || s.title || 'cinematic scene') + ', ' + extra[Math.floor(i / Math.max(1, base.length)) % extra.length] });
    return out;
  }
  const isSame = (x, i) => x.same != null && x.same >= 0 && x.same < i;
  function planMap(plan) { const idx = []; let n = 0; plan.forEach((x, i) => { idx[i] = isSame(x, i) ? idx[x.same] : n++; }); return { idx, n }; }
  S.plan = (s, M, nLines) => (M.plan && M.plan.length ? M.plan : planFallback(s, nLines));
  S.placeFlags = (s, M, nLines) => { const plan = S.plan(s, M, nLines), out = []; plan.forEach((x, i) => { if (!isSame(x, i)) out.push(!!x.place); }); return out; };
  S.thumbFromPlan = (s, M, nLines) => { const plan = S.plan(s, M, nLines), pm = planMap(plan); return plan.thumb != null && pm.idx[plan.thumb] != null ? pm.idx[plan.thumb] : (M.plan && M.plan.thumb != null && pm.idx[M.plan.thumb] != null ? pm.idx[M.plan.thumb] : 0); };
  S.prompts = function (p, s, M, nLines) { const plan = S.plan(s, M, nLines), out = []; plan.forEach((x, i) => { if (!isSame(x, i)) out.push(x.prompt + '. ' + visual(p)); }); return out; };

  /* ---------- napisy ---------- */
  S.lines = (lyrics) => (lyrics || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));
  S.heurCaps = function (lines, an) {
    const t0 = Math.max(4, an.vocalStart), t1 = an.dur - 10, tot = lines.reduce((s, l) => s + l.length + 14, 0);
    let t = t0; return lines.map((l) => { const c = { t, text: l }; t += (t1 - t0) * (l.length + 14) / tot; return c; });
  };
  function b64(ab) { const u = new Uint8Array(ab); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  /* fragment nagrania jako WAV 16 kHz mono (base64): krótkie kawałki dają dokładne czasy */
  S.wavChunk = function (buf, t0, t1) {
    const sr = buf.sampleRate, a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a, R = 16000, n = Math.max(1, Math.floor((t1 - t0) * R)), dv = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, R, true); dv.setUint32(28, R * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
    const ratio = sr / R;
    for (let i = 0; i < n; i++) { const s0 = Math.floor((t0 * R + i) * ratio), s1 = Math.min(a.length, Math.floor((t0 * R + i + 1) * ratio)); let sum = 0, c = 0; for (let k = s0; k < Math.max(s1, s0 + 1) && k < a.length; k++) { sum += (a[k] + b[k]) / 2; c++; } dv.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, c ? sum / c : 0)) * 32767), true); }
    return b64(dv.buffer);
  };
  /* podział na kawałki ok. 50 s, cięcie w najcichszym miejscu */
  S.chunks = function (an) {
    const dur = an.dur, out = []; let t = 0;
    while (dur - t > 70) { let best = t + 50, bv = 9; for (let x = t + 38; x <= t + 62 && x < dur - 10; x += 0.5) { const e = an.en[Math.floor(x * 2)]; if (e < bv) { bv = e; best = x; } } out.push([t, best]); t = best; }
    out.push([t, dur]); return out;
  };
  /* Gemini słucha nagrania kawałek po kawałku i spisuje to, co faktycznie jest śpiewane, z czasem początku i końca każdej linii */
  S.aiCaps = async function (buf, an, lines, say) {
    const dur = an.dur, ch = S.chunks(an), all = [], fails = [];
    for (let k = 0; k < ch.length; k++) {
      const t0 = ch[k][0], t1 = ch[k][1], len = t1 - t0;
      if (say) say('Gemini spisuje napisy ze słuchu… (' + (k + 1) + '/' + ch.length + ')');
      const prompt = ['Posłuchaj fragmentu piosenki (długość ' + len.toFixed(1) + ' s). Spisz linia po linii to, co jest FAKTYCZNIE śpiewane lub rapowane, w kolejności, z czasem początku i końca każdej linii w sekundach od początku TEGO fragmentu (od 0 do ' + len.toFixed(0) + ').',
        'Każde powtórzenie to osobna linia z własnym czasem. Pomiń fragmenty instrumentalne. Nie wymyślaj i nie poprawiaj słów, spisuj to, co słychać. Jeśli w tym fragmencie nie ma śpiewu, zwróć [].',
        lines.length ? 'Zamierzony tekst całej piosenki (tylko jako pomoc w pisowni; wykonanie może się różnić, wtedy spisz to, co słychać):\n' + lines.join('\n') : '',
        'Zwróć tylko JSON: tablica obiektów {"t": początek, "e": koniec, "text": "linia"}.'].filter(Boolean).join('\n');
      const data = S.wavChunk(buf, t0, t1); let arr = null, err = null;
      for (let at = 0; at < 2 && !arr; at++) {
        try { let o = JSON.parse(await App.ai.gemini(prompt, { json: true, temp: 0.1, parts: [{ inline_data: { mime_type: 'audio/wav', data } }] })); if (!Array.isArray(o)) o = o.lines || o.captions || []; arr = o; }
        catch (e) { err = e; if (/^(Darmowy limit|Ten klucz|Brak klucza)/.test(e.message)) throw e; }
      }
      if (!arr) { fails.push((k + 1) + ': ' + (err && err.message)); continue; }
      arr.forEach((x) => { const t = Number(x.t) + t0, e = Number(x.e) + t0, text = String(x.text || '').trim(); if (text && isFinite(t) && Number(x.t) >= 0 && Number(x.t) < len + 0.5) all.push({ t, e, text }); });
    }
    if (fails.length > ch.length / 2) throw new Error('Gemini nie spisał większości nagrania (' + fails[0] + ').');
    let caps = all.sort((x, y) => x.t - y.t).filter((c) => c.t < dur - 0.3);
    for (let i = 1; i < caps.length; i++) if (caps[i].t <= caps[i - 1].t) caps[i].t = caps[i - 1].t + 0.5;
    if (caps.length < 6) throw new Error('Gemini spisał za mało linii z nagrania (' + caps.length + ').');
    caps.forEach((c, i) => { const nx = caps[i + 1] ? caps[i + 1].t : dur; if (!(c.e > c.t) || c.e > nx) c.e = Math.min(nx, c.t + 5); if (c.e - c.t > 9) c.e = c.t + 9; });
    caps.fails = fails; return caps;
  };
  /* refren z tekstu: najdłuższy (do 6 linii) fragment, który wraca w tej samej kolejności; zaczyna się od pierwszej linii takiego bloku (z zapowiedzią przed refrenem) */
  S.chorusFromCaps = function (caps) {
    if (!caps || caps.length < 6) return null;
    const norm = (t) => t.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2);
    const toks = caps.map((c) => norm(c.text)), n = caps.length;
    const sim = (i, j) => { const x = toks[i], y = toks[j]; if (!x.length || !y.length) return 0; const sy = new Set(y); let k = 0; x.forEach((w) => sy.has(w) && k++); return k / Math.max(x.length, y.length); };
    const same = (i, j) => sim(i, j) >= 0.6;
    let best = null;
    for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n; j++) {
      if (!same(i, j) || (i > 0 && same(i - 1, j - 1) && j - 1 > i - 1)) continue;
      let k = 0; while (j + k < n && i + k < j && same(i + k, j + k)) k++;
      if (k < 2) continue;
      const len = Math.min(k, 6);
      if (!best || len > best.len) best = { first: i, len, j };
    }
    if (!best) return null;
    const last = best.first + best.len - 1;
    return { start: Math.max(0, caps[best.first].t - 0.4), end: caps[last].e || caps[last].t + 4, first: best.first, last };
  };

  /* ---------- rysowanie klatki ---------- */
  S.makeRenderer = function (R) {
    if (R.mode === 'brand') return S.makeBrandRenderer(R);
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
      const caps = R.caps || [], off = R.offset || 0; let ci2 = -1; for (let i = 0; i < caps.length; i++) if (caps[i].t + off <= t) ci2 = i; else break;
      if (ci2 >= 0) {
        const cp = caps[ci2], st = cp.t + off, nx = caps[ci2 + 1] ? caps[ci2 + 1].t + off : Infinity, en2 = cp.e ? cp.e + off : st + 4.5;
        if (t < Math.min(nx, Math.max(en2, st + 1.8)) + 0.15) {
          const a = Math.min(1, (t - st) / 0.18), px = vert ? W * 0.078 : H * 0.062; ctx.font = font(px, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

  /* miniatura: 16:9 (1280×720) albo 9:16 (1080×1920) ze zdjęcia z wyraźną twarzą */
  S.thumbCanvas = function (R, vertical) {
    if (R.mode === 'brand') return S.thumbBrand(R, vertical, vertical ? R.thumbVar9 : R.thumbVar16);
    const W = vertical ? 1080 : 1280, H = vertical ? 1920 : 720, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), pal = R.p.palette, im = R.imgs[R.thumbIdx || 0] || R.imgs[0];
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, sc = Math.max(W / iw, H / ih) * 1.04, dw = iw * sc, dh = ih * sc;
    ctx.drawImage(im, (W - dw) / 2, -(dh - H) * (vertical ? 0.4 : 0.3), dw, dh);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = pal.accent2 + '55'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, H * (vertical ? 0.5 : 0.28), 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.82)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const words = (R.thumbWords || R.title).toUpperCase().split(/\s+/).filter(Boolean).slice(0, 3);
    ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    const face = (px) => { ctx.font = '800 ' + px + 'px "Bricolage Grotesque", system-ui, sans-serif'; };
    if (vertical) {
      let px = 230; for (; px > 80; px -= 6) { face(px); if (Math.max(...words.map((w) => ctx.measureText(w).width)) < W - 150) break; }
      ctx.textAlign = 'center'; ctx.lineWidth = px * 0.14; ctx.strokeStyle = 'rgba(0,0,0,.9)';
      words.forEach((w, i) => { const y = H - 150 - (words.length - 1 - i) * px * 1.02; ctx.strokeText(w, W / 2, y); ctx.fillStyle = pal.accent; ctx.fillText(w, W / 2, y); });
    } else {
      const line = words.join(' '); let px = 190; ctx.textAlign = 'left';
      for (; px > 60; px -= 6) { face(px); if (ctx.measureText(line).width < 1130) break; }
      ctx.lineWidth = px * 0.14; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.strokeText(line, 70, 650); ctx.fillStyle = pal.accent; ctx.fillText(line, 70, 650);
    }
    return c;
  };
  S.thumb = (R, vertical) => new Promise((r) => S.thumbCanvas(R, vertical).toBlob(r, 'image/jpeg', 0.92));

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
      if (opt.cover) g2.drawImage(opt.cover, 0, 0, canvas.width, canvas.height);
      const stream = canvas.captureStream(30); dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      const mt = types.find((x) => window.MediaRecorder && MediaRecorder.isTypeSupported(x));
      if (!mt) throw new Error('Ta przeglądarka nie potrafi nagrywać wideo. Użyj Safari na iPhonie lub Chrome.');
      rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: opt.short ? 3.5e6 : 4.5e6, audioBitsPerSecond: 160000 }); rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
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
      an.getByteFrequencyData(freq);
      if (opt.cover && t - start < 0.7) g2.drawImage(opt.cover, 0, 0, canvas.width, canvas.height); else draw(g2, Math.min(t, start + len), freq, { W: canvas.width, H: canvas.height, t0: start, dur: len, short: opt.short });
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
  /* mode 'share': arkusz udostępniania iOS (tam jest „Zapisz wideo” do galerii), 'file': pobranie do aplikacji Pliki */
  S.save = async function (blob, name, mode) {
    const file = new File([blob], name, { type: blob.type || 'video/mp4' });
    if (mode !== 'file') {
      if (!(navigator.canShare && navigator.canShare({ files: [file] }))) throw new Error('Ten telefon nie pozwala udostępnić tak dużego pliku z aplikacji. Użyj „Wyślij na YouTube” albo „Zapisz w Plikach”.');
      try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') return; throw new Error('Udostępnianie nie powiodło się (' + (e && e.name) + '). Użyj „Wyślij na YouTube” albo „Zapisz w Plikach”.'); }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
  };

  /* ---------- wysyłka na YouTube (prywatny film) ---------- */
  const YT = (S.yt = { token: null, exp: 0 });
  function loadGsi() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((res, rej) => { const el = document.createElement('script'); el.src = 'https://accounts.google.com/gsi/client'; el.onload = res; el.onerror = () => rej(new Error('Nie udało się połączyć z Google. Sprawdź internet.')); document.head.appendChild(el); });
  }
  YT.login = async function (p) {
    if (YT.token && Date.now() < YT.exp - 60000 && YT.pid === p.id) return YT.token;
    YT.token = null;
    const cid = (App.state.settings.ytClient || '').trim();
    if (!cid) throw new Error('Wpisz Client ID Google w Ustawieniach. Instrukcja jest w README.');
    await loadGsi();
    const token = await new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({ client_id: cid, scope: 'https://www.googleapis.com/auth/youtube', prompt: 'select_account',
        callback: (r) => { if (r.error) rej(new Error('Logowanie Google: ' + r.error)); else res(r); },
        error_callback: (e) => rej(new Error('Logowanie przerwane' + (e && e.type ? ' (' + e.type + ')' : ''))) });
      tc.requestAccessToken();
    });
    // sprawdź, na jaki kanał trafi film
    const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: 'Bearer ' + token.access_token } });
    if (!r.ok) throw new Error('Nie udało się sprawdzić kanału (' + r.status + ').');
    const ch = ((await r.json()).items || [])[0];
    if (!ch) throw new Error('To konto nie ma kanału YouTube. Wybierz w oknie Google właściwy kanał.');
    const norm = (x) => (x || '').toLowerCase().replace(/^@/, '').replace(/\s+/g, '');
    const okHandle = p.handle && ch.snippet.customUrl && norm(ch.snippet.customUrl) === norm(p.handle);
    const okName = norm(ch.snippet.title) === norm(p.name);
    if (!okHandle && !okName) throw new Error('Zalogowano na kanał „' + ch.snippet.title + '”, a ten utwór należy do „' + p.name + '”. Wysyłka zatrzymana. Kliknij ponownie i w oknie Google wybierz kanał „' + p.name + '”.');
    YT.token = token.access_token; YT.exp = Date.now() + (token.expires_in || 3000) * 1000; YT.pid = p.id; YT.channel = ch.snippet.title;
    return YT.token;
  };
  YT.upload = async function (blob, meta, onProgress, p) {
    const token = await YT.login(p);
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
  YT.thumb = async function (videoId, blob, p) {
    const token = await YT.login(p);
    const r = await fetch('https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=' + videoId, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'image/jpeg' }, body: blob });
    if (!r.ok) throw new Error('Miniatura nie została ustawiona (' + r.status + '). Ustaw ją ręcznie w Studio.');
  };
  YT.playlist = async function (videoId, playlistId, p) {
    const token = await YT.login(p);
    const r = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } }) });
    if (!r.ok) throw new Error('Nie dodano do playlisty (' + r.status + ').');
  };

  /* ---------- wspólna logika (Studio i kreator) ---------- */
  S.mem = (id) => (mem[id] = mem[id] || { imgs: [], caps: null, offset: 0, status: '' });
  S.hasAudio = (id) => !!(mem[id] && mem[id].an);
  S.loadFile = async function (id, file) {
    const M = S.mem(id), s = App.song(id);
    M.file = file; M.ab = await file.arrayBuffer(); M.buf = await S.decode(M.ab.slice(0)); M.an = S.analyze(M.buf); M.cuts = null; M.caps = null; M.exact = false; M.align = ''; M.plan = null; M.chorusText = null; M.generated = false; M.notes = []; M.prepared = false; M.autoStarted = false; M.heroes = null; M.heroSel = 0; M.tc = null; M.bass = S.bassTrack(M.buf, M.an);
    if (s.chorusAuto !== false) { s.chorusStart = mmss(M.an.chorus.start); s.chorusAuto = true; }
    s.mp3 = file.name; App.save(); return M.an;
  };
  const capIdxAt = (caps, t) => { let k = -1; for (let i = 0; i < caps.length; i++) if (caps[i].t <= t) k = i; else break; return k; };
  S.mk = function (id) {
    if (S.mode(App.song(id)) === 'brand') return S.mkBrand(id);
    const s = App.song(id), p = App.profile(s.profileId), M = S.mem(id), ln = S.lines(s.lyrics);
    const mapCaps = M.exact && M.caps && M.caps.length ? M.caps : (ln.length ? S.heurCaps(ln, M.an) : []);
    const plan = S.plan(s, M, mapCaps.length), pm = planMap(plan);
    if (M.imgs.length !== pm.n) M.imgs = Array.from({ length: pm.n }, (_, i) => procArt(p, i + 3));
    if (!M.cuts) M.cuts = buildCuts(M.an, (t) => {
      const ci = capIdxAt(mapCaps, t); let k = 0; plan.forEach((x, i) => { if (x.from <= Math.max(0, ci)) k = i; });
      return pm.idx[k];
    });
    const caps = M.exact ? M.caps : (M.approx !== false ? mapCaps : []);
    return { p, an: M.an, imgs: M.imgs, cuts: M.cuts, caps, offset: M.offset, title: s.title || '', buf: M.buf, thumbWords: s.thumbWords, thumbIdx: M.thumbIdx || 0 };
  };
  const small = (im) => { const c = document.createElement('canvas'), w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, k = 384 / Math.max(w, h); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.72).split(',')[1]; };
  /* kontrola: żadnych samych dłoni czy butów, bez człowieka z twarzą; miniatura z najlepszego kadru */
  S.vetAll = async function (p, s, M, list, flags, say, notes) {
    const imgs = M.imgs, FIX = ' The man is clearly visible with his face and upper body in a medium shot. Not a close-up of hands, feet or objects alone.';
    const bad = (v, i) => v && (v.fragment || v.broken || (!v.person && !flags[i]));
    let res = await App.ai.vetImages(imgs.map(small)), tries = 0;
    while (tries < 2) {
      const redo = []; imgs.forEach((im, i) => { if (bad(res[i], i)) redo.push(i); }); if (!redo.length) break;
      tries++; const fresh = [];
      for (let k = 0; k < redo.length; k++) { say('Poprawiam kadr bez twarzy (' + (k + 1) + '/' + redo.length + ')…'); try { fresh.push(await S.genImage(list[redo[k]] + FIX)); } catch (e) { fresh.push(null); } }
      const ok = redo.filter((i, k) => fresh[k]); if (!ok.length) break;
      const v2 = await App.ai.vetImages(redo.map((i, k) => fresh[k]).filter(Boolean).map(small));
      ok.forEach((i, n) => { imgs[i] = fresh[redo.indexOf(i)]; res[i] = v2[n]; });
    }
    const good = []; imgs.forEach((im, i) => { if (res[i] && !bad(res[i], i) && res[i].face) good.push(i); });
    let fixed = 0; imgs.forEach((im, i) => { if (bad(res[i], i) && good.length) { imgs[i] = imgs[good[i % good.length]]; fixed++; } });
    if (fixed) notes.push(fixed + ' kadrów bez twarzy zastąpiłem kadrem z bohaterem.');
    M.goodIdx = good.slice();
    let bi = -1, bs = -1; imgs.forEach((im, i) => { const v = res[i]; if (v && v.face && !v.fragment && !v.broken && v.thumb > bs) { bs = v.thumb; bi = i; } });
    return bi;
  };
  /* jedno kliknięcie: napisy ze słuchu, sceny z tekstu, obrazy, refren */
  S.autoPrepare = async function (id, say) {
    const s = App.song(id), p = App.profile(s.profileId), M = S.mem(id), key = App.ai.hasKey(), notes = [];
    let keyDead = false, lines = S.lines(s.lyrics); M.exact = false; M.caps = null; M.plan = null; M.chorusText = null; M.align = lines.length ? 'przybliżone' : 'brak tekstu';
    if (key) {
      try {
        const ck = (M.file ? M.file.size : 0) + ':' + Math.round(M.an.dur * 10);
        if (s.caps && s.caps.key === ck && s.caps.list && s.caps.list.length > 5) { M.caps = s.caps.list; M.align = 'ze słuchu (zapisane)'; }
        else {
          say('Gemini słucha utworu i spisuje napisy…'); M.caps = await S.aiCaps(M.buf, M.an, lines, say); M.align = 'ze słuchu (Gemini)';
          if (M.caps.fails && M.caps.fails.length) notes.push('Część nagrania nie została spisana (' + M.caps.fails.length + ' z ' + S.chunks(M.an).length + ' kawałków). Kliknij „Spisz napisy od nowa”, żeby spróbować ponownie.');
          else { s.caps = { key: ck, list: M.caps.map((c) => ({ t: c.t, e: c.e, text: c.text })) }; App.save(); }
        }
        M.exact = true; lines = M.caps.map((c) => c.text);
      }
      catch (e) { M.caps = null; keyDead = /^(Ten klucz|Darmowy limit|Brak klucza)/.test(e.message); notes.push(keyDead ? e.message + ' Do czasu naprawy klucza pokazuję napisy przybliżone, a sceny i obrazy powstają bez kontroli Gemini.' : 'Napisy: ' + e.message + ' Pokazuję napisy przybliżone. Kliknij „Przygotuj od nowa”, żeby spróbować ponownie.'); }
      if (lines.length && !keyDead) { try { say('Gemini układa sceny pod treść tekstu…'); M.plan = await App.ai.shots(p, s, lines); } catch (e) { M.plan = null; notes.push('Sceny z tekstu: ' + e.message); } }
    } else notes.push('Brak klucza Gemini: napisy i sceny nie będą dopasowane do nagrania (Ustawienia → Klucz Gemini).');
    const list = S.prompts(p, s, M, lines.length), res = []; let fails = 0;
    for (let i = 0; i < list.length; i++) { say('Generuję obraz ' + (i + 1) + ' z ' + list.length + '…'); try { res.push(await S.genImage(list[i])); } catch (e) { fails++; res.push(procArt(p, i + 3)); } }
    M.imgs = res; M.cuts = null; M.generated = fails < list.length;
    if (fails) notes.push(fails + ' obrazów zastąpiłem kafelkami.');
    M.thumbIdx = S.thumbFromPlan(s, M, lines.length);
    if (key && !keyDead && M.generated && App.ai.peopleOK(p)) { try { say('Gemini sprawdza obrazy (twarze, kadry bez człowieka)…'); const bi = await S.vetAll(p, s, M, list, S.placeFlags(s, M, lines.length), say, notes); if (bi >= 0) M.thumbIdx = bi; } catch (e) { notes.push('Kontrola obrazów nie powiodła się: ' + e.message); } }
    if (M.exact) { M.chorusText = S.chorusFromCaps(M.caps); if (M.chorusText && s.chorusAuto !== false) { s.chorusStart = mmss(M.chorusText.start); s.chorusAuto = true; } }
    App.save(); M.notes = notes; return notes;
  };
  /* tylko napisy: ponowne spisanie ze słuchu (bez nowych obrazów) */
  S.recaption = async function (id, say) {
    const s = App.song(id), M = S.mem(id); M.notes = [];
    M.caps = await S.aiCaps(M.buf, M.an, S.lines(s.lyrics), say); M.exact = true; M.align = 'ze słuchu (Gemini)'; M.cuts = null;
    if (!(M.caps.fails && M.caps.fails.length)) s.caps = { key: (M.file ? M.file.size : 0) + ':' + Math.round(M.an.dur * 10), list: M.caps.map((c) => ({ t: c.t, e: c.e, text: c.text })) };
    M.chorusText = S.chorusFromCaps(M.caps); if (M.chorusText && s.chorusAuto !== false) { s.chorusStart = mmss(M.chorusText.start); s.chorusAuto = true; }
    App.save();
  };
  /* po zmianie klucza: wyczyść stare komunikaty i pozwól przygotować od nowa */
  S.resetPrep = () => Object.keys(mem).forEach((k) => { const M = mem[k]; if (!M.running) { M.prepared = false; M.autoStarted = false; M.notes = []; } });
  S.runPrepare = async function (id, render, mode) {
    const M = S.mem(id); if (M.running) return; M.running = true; M.notes = [];
    const say = (m) => { M.status = m; render(); };
    try { if (mode === 'caps') await S.recaption(id, say); else if (S.mode(App.song(id)) === 'brand') await S.autoPrepareBrand(id, say); else await S.autoPrepare(id, say); M.prepared = true; } catch (e) { M.notes = [e.message || 'Błąd przygotowania']; }
    M.running = false; M.status = ''; render();
  };
  /* cięcia Shorta: zmiana kadru co 4 uderzenia, przez różne obrazy z bohaterem (bez przeskoków na tym samym obrazie) */
  S.shortCuts = function (R, M, sw) {
    const an = R.an, t0 = sw.start, t1 = sw.start + sw.len;
    const pool = M.goodIdx && M.goodIdx.length >= 3 ? M.goodIdx.slice() : R.imgs.map((x, i) => i);
    const orig = R.cuts.find((c) => c.t0 <= t0 && c.t1 > t0); let cur = orig && pool.includes(orig.img) ? orig.img : pool[0];
    const bs = an.beats.filter((b) => b > t0 + 1.2 && b < t1 - 1.2), pts = [t0]; for (let i = 0; i < bs.length; i += 4) pts.push(bs[i]); pts.push(t1 + 1);
    const cuts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      if (i > 0) { const p = pool.indexOf(cur); cur = pool[(p + 1) % pool.length]; }
      cuts.push({ t0: pts[i], t1: pts[i + 1], img: cur, motion: i % 2, soft: false });
    }
    return cuts;
  };
  /* okno Shorta: od zapowiedzi refrenu, przez refren, do końca linii; 16 do 30 s */
  S.shortWindow = function (id) {
    const s = App.song(id), M = S.mem(id), dur = M.an.dur, cs = parseT(s.chorusStart), auto = s.chorusAuto !== false, txt = auto ? M.chorusText : null;
    let start = txt ? txt.start : (cs !== null && cs < dur - 8 ? cs : M.an.chorus.start);
    start = Math.max(0, Math.min(start, dur - 10));
    let end = txt ? txt.end + 0.8 : start + 22;
    if (end - start < 16) end = start + 16; if (end - start > 30) end = start + 30;
    if (M.exact && M.caps) {
      const c = M.caps.find((x) => x.t < end && (x.e || x.t + 4) > end);
      if (c) { const ce = (c.e || c.t + 4) + 0.6; end = ce - start <= 32 ? ce : c.t - 0.15; }
    }
    return { start, len: Math.max(12, Math.min(end, dur) - start) };
  };
  S.renderVideo = async function (id, short, onProgress, cv) {
    const s = App.song(id); await S.loadLogo(App.profile(s.profileId));
    const M = S.mem(id), R = S.mk(id), W = short ? 720 : 1280, H = short ? 1280 : 720, c = cv || document.createElement('canvas'); c.width = W; c.height = H;
    const sw = short ? S.shortWindow(id) : { start: 0, len: M.an.dur };
    if (short && R.mode !== 'brand') R.cuts = S.shortCuts(R, M, sw);
    const cover = S.thumbCanvas(R, short), blob = await S.play(R, c, { start: sw.start, len: sw.len, record: true, short, onProgress, cover });
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    return { blob, W, H, name: (s.title || 'teledysk').replace(/[^\w\-]+/g, '_') + (short ? '_short' : '') + '.' + ext };
  };
  S.sendPrivate = async function (id, blob, short, onProgress) {
    const s = App.song(id), p = App.profile(s.profileId), pack = App.engine.publish(p, s);
    const meta = { title: short ? (pack.shortTitles[0] || pack.hooks[0] || s.title) : pack.titles[0], description: pack.description, tags: pack.tags.join(',').length > 480 ? pack.tags.slice(0, 12) : pack.tags, lang: p.lang };
    await YT.login(p);
    const vid = await YT.upload(blob, meta, onProgress, p); s.yt = s.yt || {}; s.yt[short ? 'short' : 'full'] = vid; App.save();
    let thumbErr = null; if (!short) { try { await YT.thumb(vid, await S.thumb(S.mk(id)), p); } catch (e) { thumbErr = e.message; } }
    return { id: vid, channel: YT.channel, thumbErr };
  };

  /* ---------- ekran studia (szczegóły) ---------- */
  S.open = function (songId) {
    const K = App.ui.kit, h = App.ui.h, icon = App.ui.icon, toast = App.ui.toast;
    const s = App.song(songId), p = App.profile(s.profileId), M = S.mem(songId);
    loadGsi().catch(() => {});
    K.openSheet('Studio teledysku', (render) => S.panel(songId, render), { onClose: () => { App.save(); } });
  };
  S.panel = function (songId, render, embedded) {
    loadGsi().catch(() => {});
    const K = App.ui.kit, h = App.ui.h, icon = App.ui.icon, toast = App.ui.toast;
    const s = App.song(songId), p = App.profile(s.profileId), M = S.mem(songId);
    {
      const hasAudio = !!M.an, key = App.ai.hasKey();
      const fileIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; M.status = 'Analizuję utwór…'; render(); try { await S.loadFile(songId, f); M.status = ''; } catch (er) { M.status = 'Nie udało się wczytać pliku: ' + er.message; } render(); } });
      const cv = h('canvas', { width: 640, height: 360, class: 'studio-cv' });
      const out = h('div', { class: 'stack' });
      const bar = h('div', { class: 'mt' }, h('i', { style: { width: '0%' } }));
      const setBar = (v) => { bar.firstChild.style.width = Math.round(v * 100) + '%'; };
      let busy = false;
      const guard = (fn) => async (e) => { if (busy) return; busy = true; const b = e.currentTarget; b.disabled = true; try { await fn(); } catch (er) { toast(er.message || 'Błąd'); } busy = false; b.disabled = false; };
      const showStill = () => { try { const R = S.mk(songId); S.makeRenderer(R)(cv.getContext('2d'), M.an.chorus.start + 0.3, null, { W: cv.width, H: cv.height, t0: 0, dur: M.an.dur }); } catch (er) { /* ignore */ } };
      const renderTo = (short) => guard(async () => {
        if (M.running) { toast('Trwa przygotowanie teledysku. Poczekaj na koniec.'); return; }
        toast('Renderuję w czasie utworu. Nie wychodź z aplikacji.'); setBar(0);
        const r = await S.renderVideo(songId, short, setBar); const url = URL.createObjectURL(r.blob);
        out.textContent = '';
        out.appendChild(h('video', { src: url, controls: true, playsinline: true, class: 'studio-cv', style: { aspectRatio: r.W + '/' + r.H, maxHeight: '60vh' } }));
        out.appendChild(h('button', { class: 'btn big', onclick: () => S.save(r.blob, r.name, 'share').catch((er) => toast(er.message)) }, icon('copy', 18), 'Do galerii: Udostępnij → Zapisz wideo (' + Math.round(r.blob.size / 1e6) + ' MB)'));
        out.appendChild(h('button', { class: 'btn big ghost', onclick: () => S.save(r.blob, r.name, 'file') }, icon('copy', 18), 'Zapisz w Plikach'));
        out.appendChild(h('button', { class: 'btn big ghost', onclick: guard(async () => { toast('Zaloguj się i wybierz kanał: ' + p.name); const x = await S.sendPrivate(songId, r.blob, short, setBar); out.appendChild(h('p', { class: 'hint' }, 'Wysłano jako prywatny na kanał „' + x.channel + '”.' + (x.thumbErr ? ' ' + x.thumbErr : ''))); out.appendChild(h('a', { class: 'btn big', href: 'https://studio.youtube.com/video/' + x.id + '/edit', target: '_blank', rel: 'noopener' }, 'Otwórz w YouTube Studio')); }) }, icon('upload', 18), 'Wyślij na YouTube jako prywatny'));
        toast('Gotowe');
      });
      const brand = S.mode(s) === 'brand';
      if (hasAudio && (key || brand) && !M.prepared && !M.running && !M.autoStarted) { M.autoStarted = true; setTimeout(() => S.runPrepare(songId, render), 50); }
      if (hasAudio) showStill();
      return h('div', { class: 'stack' },
        embedded ? null : h('p', { class: 'muted' }, 'Wczytaj mp3 z Suno. Aplikacja znajdzie tempo i refren, ułoży cięcia w rytm i dopasuje napisy. Wideo powstaje w tej przeglądarce, za darmo.'),
        h('label', { class: 'btn big filebtn' }, icon('plus', 18), hasAudio ? 'Zmień plik mp3' : 'Wybierz plik mp3', fileIn),
        null,
        M.status ? h('p', { class: 'hint' }, M.status) : null,
        hasAudio ? h('div', { class: 'stack' },
          h('p', { class: 'muted small' }, 'Czas ' + mmss(M.an.dur) + ' · tempo ok. ' + Math.round(M.an.bpm) + ' bpm · Short od ' + mmss(S.shortWindow(songId).start) + (M.chorusText && s.chorusAuto !== false ? ' (refren z tekstu)' : s.chorusAuto === false ? ' (ustawiony ręcznie)' : ' (refren z dźwięku)') + ' · napisy: ' + (M.align || '—')),
          (M.notes && M.notes.length) ? h('div', { class: 'warnbox' }, M.notes.map((n) => h('p', null, n))) : null,
          (M.an.chorus.cands && M.an.chorus.cands.length) ? h('div', { class: 'stack' }, h('span', { class: 'flabel' }, 'Początek Shorta, gdyby wyszedł zły fragment:'), h('div', { class: 'row-btns' }, M.an.chorus.cands.map((c) => h('button', { class: 'btn ghost', onclick: () => { s.chorusStart = mmss(c.t); s.chorusAuto = false; App.save(); render(); } }, mmss(c.t))))) : null,
          h('p', { class: 'muted small' }, M.exact ? 'Napisy włączone: spisane ze słuchu, z dokładnymi czasami. Gdyby były przesunięte, użyj suwaka poniżej.' : (M.running ? 'Napisy włączone (na razie przybliżone, za chwilę zostaną dopasowane do nagrania).' : 'Napisy włączone, ale przybliżone: bez klucza Gemini nie da się ich dokładnie dopasować.')),
          cv,
          h('div', { class: 'row-btns' }, h('button', { class: 'btn', onclick: () => S.runPrepare(songId, render) }, icon('spark', 18), M.prepared ? 'Przygotuj od nowa (napisy, sceny, obrazy)' : 'Przygotuj teledysk automatycznie'),
            h('button', { class: 'btn ghost', onclick: guard(async () => { const R = S.mk(songId); setBar(0); await S.play(Object.assign({}, R, { cuts: S.shortCuts(R, M, S.shortWindow(songId)) }), cv, { start: S.shortWindow(songId).start, len: 15, record: false, onProgress: setBar }); showStill(); }) }, icon('refresh', 18), 'Podgląd 15 s z dźwiękiem')),
          M.exact ? h('button', { class: 'btn ghost', onclick: () => S.runPrepare(songId, render, 'caps') }, icon('refresh', 18), 'Spisz napisy od nowa (gdyby były przesunięte)') : null,
          bar,
          brand ? h('div', { class: 'stack' }, S.brandBlocks(songId, render, guard, toast)) : null,
          !brand && M.imgs.length ? h('div', { class: 'stack' }, h('span', { class: 'flabel' }, 'Obrazy w teledysku. Dotknij, żeby wybrać kadr na miniaturę (zaznaczony):'), h('div', { class: 'thumbs' }, M.imgs.map((im, i) => { const c = document.createElement('canvas'); c.width = 160; c.height = 160; const w = im.naturalWidth || im.width, hh = im.naturalHeight || im.height; c.getContext('2d').drawImage(im, 0, 0, w, hh, 0, 0, 160, 160); c.className = 'thumb' + ((M.thumbIdx || 0) === i ? ' sel' : ''); c.onclick = () => { M.thumbIdx = i; render(); }; return c; }))) : null,
          h('label', { class: 'field' }, h('span', { class: 'flabel' }, 'Przesunięcie napisów: ' + M.offset.toFixed(1) + ' s'), h('input', { type: 'range', min: -4, max: 4, step: 0.1, value: M.offset, oninput: (e) => { M.offset = +e.target.value; e.target.previousSibling.textContent = 'Przesunięcie napisów: ' + M.offset.toFixed(1) + ' s'; } })),
          h('button', { class: 'btn big', onclick: renderTo(false) }, icon('play', 18), 'Zrenderuj film 16:9 (' + mmss(M.an.dur) + ')'),
          h('button', { class: 'btn big ghost', onclick: renderTo(true) }, icon('play', 18), 'Zrenderuj Short 9:16 z refrenem'),
          ...(brand ? [] : [
          h('button', { class: 'btn big ghost', onclick: guard(async () => { const b = await S.thumb(S.mk(songId)); S.save(b, (s.title || 'miniatura').replace(/[^\w\-]+/g, '_') + '.jpg', 'share').catch(() => S.save(b, (s.title || 'miniatura').replace(/[^\w\-]+/g, '_') + '.jpg', 'file')); }) }, icon('copy', 18), 'Miniatura 1280×720'),
          h('button', { class: 'btn big ghost', onclick: guard(async () => { const b = await S.thumb(S.mk(songId), true); S.save(b, (s.title || 'miniatura').replace(/[^\w\-]+/g, '_') + '_short_9x16.jpg', 'share').catch(() => S.save(b, (s.title || 'miniatura').replace(/[^\w\-]+/g, '_') + '_short_9x16.jpg', 'file')); }) }, icon('copy', 18), 'Miniatura Shorta 9:16 (1080×1920)')
          ]),
          out) : null);
    }
  };
})();
