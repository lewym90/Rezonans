/* Styl „marka”: jedna wybrana grafika w tle, logo kanału pulsujące na uderzenia basu, tytuł, nazwa kanału,
   cząstki i fale uderzeniowe w rytm. Miniatury 16:9 i 9:16 (3 propozycje każda). */
(function () {
  const App = window.App, S = App.studio, AI = App.ai;
  const mmss = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const font = (px, w) => (w || 800) + ' ' + px + 'px "Bricolage Grotesque", system-ui, -apple-system, sans-serif';

  S.mode = () => 'brand';

  /* ---------- logo ---------- */
  const logos = {};
  S.loadLogo = function (p) {
    const src = p.brand && p.brand.logo; if (!src) return Promise.resolve(null);
    if (logos[src]) return logos[src].p;
    const im = new Image(), pr = new Promise((res) => { im.onload = () => res(im); im.onerror = () => res(null); });
    im.src = src; logos[src] = { im, p: pr }; return pr;
  };
  S.logoImg = (p) => { const l = p.brand && logos[p.brand.logo]; return l && l.im.complete && l.im.naturalWidth ? l.im : null; };

  /* ---------- ścieżka basu: momenty uderzeń (stopa, sub) i obwiednia ---------- */
  S.bassTrack = function (buf, an) {
    const sr = buf.sampleRate, a = buf.getChannelData(0), b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a, hop = Math.round(sr / 200), F = Math.floor(a.length / hop);
    const k = 1 - Math.exp(-2 * Math.PI * 110 / sr); let y1 = 0, y2 = 0; const e = new Float32Array(F);
    for (let f = 0; f < F; f++) { let s = 0; for (let i = f * hop, z = i + hop; i < z; i++) { const x = (a[i] + b[i]) * 0.5; y1 += k * (x - y1); y2 += k * (y1 - y2); s += y2 * y2; } e[f] = Math.sqrt(s / hop); }
    const srt = Array.from(e).sort((x, y) => x - y), p95 = srt[Math.floor(F * 0.95)] || 1;
    const env = new Float32Array(F); for (let f = 0; f < F; f++) env[f] = Math.min(1, e[f] / p95);
    const d = new Float32Array(F); for (let f = 8; f < F; f++) { let m = 0; for (let j = 1; j <= 8; j++) m += env[f - j]; d[f] = Math.max(0, env[f] - m / 8); }
    const ds = Array.from(d).sort((x, y) => x - y), d95 = ds[Math.floor(F * 0.95)] || 0.1;
    const W = 200, kicks = [];
    const ma = new Float32Array(F); let acc = 0; for (let f = 0; f < F; f++) { acc += d[f]; if (f >= W) acc -= d[f - W]; ma[f] = acc / Math.min(f + 1, W); }
    let last = -99;
    for (let f = 2; f < F - 2; f++) {
      const thr = Math.max(1.6 * ma[f], 0.18 * d95);
      if (d[f] > thr && d[f] >= d[f - 1] && d[f] >= d[f + 1] && f - last > 36) { kicks.push({ t: f * hop / sr, s: Math.min(1, 0.35 + d[f] / (d95 * 1.3)) }); last = f; }
    }
    let src = 'sygnał';
    if (an && kicks.length < (a.length / sr) * 0.35 && an.beats && an.beats.length) { kicks.length = 0; an.beats.forEach((t, i) => kicks.push({ t, s: i % 4 === 0 ? 0.9 : 0.55 })); src = 'siatka tempa'; }
    return { kicks, env, fps: 200, src };
  };
  function kickEnv(bt, t) {
    const ks = bt.kicks; let lo = 0, hi = ks.length - 1, i = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (ks[m].t <= t) { i = m; lo = m + 1; } else hi = m - 1; }
    let v = 0; for (let j = i; j >= 0 && t - ks[j].t < 0.5; j--) v += ks[j].s * Math.exp(-(t - ks[j].t) * 9);
    return { k: Math.min(1.15, v), i };
  }

  /* ---------- napisy (te same co w trybie scen) ---------- */
  function wrap(ctx, text, maxW) { const w = text.split(' '), out = []; let l = ''; w.forEach((x) => { const t = l ? l + ' ' + x : x; if (ctx.measureText(t).width > maxW && l) { out.push(l); l = x; } else l = t; }); if (l) out.push(l); return out; }
  function drawCaps(ctx, R, t, W, H, vert) {
    const caps = R.caps || [], off = R.offset || 0; let ci = -1; for (let i = 0; i < caps.length; i++) if (caps[i].t + off <= t) ci = i; else break;
    if (ci < 0) return;
    const cp = caps[ci], st = cp.t + off, nx = caps[ci + 1] ? caps[ci + 1].t + off : Infinity, en = cp.e ? cp.e + off : st + 4.5;
    if (t >= Math.min(nx, Math.max(en, st + 1.8)) + 0.15) return;
    const a = Math.min(1, (t - st) / 0.18), px = vert ? W * 0.074 : H * 0.056; ctx.font = font(px, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ls = wrap(ctx, cp.text.toUpperCase(), W * (vert ? 0.86 : 0.78)), lh = px * 1.16, y0 = (vert ? H * 0.69 : H * 0.755) - (ls.length - 1) * lh / 2 + (1 - a) * px * 0.4;
    ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.lineWidth = px * 0.16; ctx.strokeStyle = 'rgba(0,0,0,.88)';
    ls.forEach((l, i) => { ctx.strokeText(l, W / 2, y0 + i * lh); ctx.fillStyle = '#fff6e5'; ctx.fillText(l, W / 2, y0 + i * lh); });
    ctx.globalAlpha = 1;
  }

  function cover(ctx, im, W, H, zoom, ox, oy) {
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, sc = Math.max(W / iw, H / ih) * zoom, w = iw * sc, h = ih * sc;
    ctx.drawImage(im, (W - w) / 2 + ox, (H - h) / 2 + oy, w, h);
  }
  function drawLogo(ctx, logo, cx, cy, box, scale) {
    const iw = logo.naturalWidth, ih = logo.naturalHeight, k = Math.min(box / iw, box / ih) * scale, w = iw * k, h = ih * k;
    ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h); return { w, h };
  }

  /* ---------- renderer klatek w stylu „marka” ---------- */
  S.makeBrandRenderer = function (R) {
    const { p, an } = R, pal = p.palette, fx = (p.brand && p.brand.fx) || 'embers', pl = p.lang === 'pl';
    const bt = R.bass || { kicks: [], env: new Float32Array(1), fps: 200 };
    const N_AMB = 90;
    return function draw(ctx, t, freq, o) {
      const W = o.W, H = o.H, vert = H > W, u0 = o.t0 || 0, rel = t - u0, total = o.dur, e = an.energyAt(t), ko = kickEnv(bt, t), k = ko.k;
      const bi = Math.min(bt.env.length - 1, Math.max(0, Math.round(t * bt.fps))), b = bt.env[bi] || 0, S1 = Math.min(W, H);
      ctx.save(); ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      // tło: wolny najazd, uderzenie basu lekko je „kopie”, drżenie kadru
      const zoom = 1.07 + 0.05 * Math.min(1, rel / Math.max(1, total)) + 0.03 * k, sh = S1 * 0.006 * k;
      cover(ctx, R.hero, W, H, zoom, Math.sin(t * 53) * sh, Math.cos(t * 61) * sh);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.22 - 0.1 * Math.min(1, k)) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = hexA(pal.accent2, 0.22); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
      const vg = ctx.createRadialGradient(W / 2, H / 2, S1 * 0.3, W / 2, H / 2, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hexA(pal.accent2, 0.3 * Math.min(1, k) * Math.min(1, k)); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
      const cx = W / 2, cy = vert ? H * 0.34 : H * 0.4, box = vert ? W * 0.46 : H * 0.4, R0 = box * 0.46;
      // poświata za logo
      const gl = ctx.createRadialGradient(cx, cy, R0 * 0.2, cx, cy, R0 * (1.7 + 0.5 * k)); gl.addColorStop(0, hexA(pal.accent, 0.16 + 0.42 * Math.min(1, k) + 0.1 * b)); gl.addColorStop(1, hexA(pal.accent, 0));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      // fale uderzeniowe z mocnych uderzeń
      ctx.lineCap = 'round';
      for (let j = ko.i; j >= 0 && t - bt.kicks[j].t < 1.0; j--) {
        const kk = bt.kicks[j]; if (kk.s < 0.72) continue; const u = (t - kk.t) / 1.0;
        for (let r = 0; r < 2; r++) { const uu = u - r * 0.12; if (uu <= 0) continue; ctx.strokeStyle = hexA(pal.accent, Math.pow(1 - uu, 2) * 0.55 * kk.s); ctx.lineWidth = Math.max(1, S1 * 0.012 * (1 - uu)); ctx.beginPath(); ctx.arc(cx, cy, R0 * (0.75 + 2.1 * uu), 0, 7); ctx.stroke(); }
      }
      // cząstki tła: żar unosi się, pył opada i migocze; szybkość rośnie z energią
      for (let i = 0; i < N_AMB; i++) {
        const sd = hash(i + 1), sx = hash(i + 101), sp = (fx === 'dust' ? 10 : 40) + sd * (fx === 'dust' ? 30 : 110), ph = hash(i + 201), sz = (0.6 + hash(i + 301) * 2.2) * S1 / 720;
        const run = (t * sp * (0.7 + e) * S1 / 720 + ph * H * 1.2) % (H * 1.2);
        const x = sx * W + Math.sin(t * (0.6 + sd) + i) * 14 * S1 / 720, y = fx === 'dust' ? run - H * 0.1 : H * 1.05 - run;
        const tw = fx === 'dust' ? 0.35 + 0.65 * Math.abs(Math.sin(t * (1.2 + sd * 2) + i)) : 0.5 + 0.5 * Math.sin(t * 3 + i), al = (0.25 + 0.5 * tw) * (0.5 + 0.8 * Math.min(1, b + k * 0.5));
        ctx.fillStyle = hexA(i % 3 ? pal.accent : pal.accent2, Math.min(0.9, al)); ctx.beginPath(); ctx.arc(x, y, sz * (1 + 0.8 * k), 0, 7); ctx.fill();
      }
      // wybuch cząstek z uderzenia
      for (let j = ko.i; j >= 0 && t - bt.kicks[j].t < 1.5; j--) {
        const kk = bt.kicks[j]; if (kk.s < 0.55) continue; const tau = t - kk.t, u = tau / 1.5, n = Math.round(10 + 22 * kk.s);
        for (let q = 0; q < n; q++) {
          const ang = hash(j * 31 + q * 7 + 1) * 6.283, spd = (120 + hash(j * 17 + q * 3 + 5) * 460) * kk.s * S1 / 720, g = fx === 'dust' ? 20 : 180 * S1 / 720;
          const x = cx + Math.cos(ang) * spd * tau * (1 - 0.3 * tau) , y = cy + Math.sin(ang) * spd * tau * (1 - 0.3 * tau) + 0.5 * g * tau * tau * (fx === 'dust' ? -0.2 : 1);
          ctx.fillStyle = hexA(q % 3 ? pal.accent : pal.accent2, Math.pow(1 - u, 1.5) * 0.9); ctx.beginPath(); ctx.arc(x, y, (1 + hash(q + j) * 2.6) * S1 / 720 * (1 - 0.5 * u), 0, 7); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      // cienkie słupki widma przy dole
      if (freq) {
        const NB = vert ? 36 : 72, bw = W / NB, base = H - (vert ? H * 0.018 : H * 0.028); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < NB; i++) { const bin = Math.floor(1 + Math.pow(i / NB, 1.6) * 140), v = Math.min(1, freq[bin] / 255 * 1.2), hh = Math.max(2, v * H * 0.09); ctx.fillStyle = hexA(pal.accent, 0.12 + 0.4 * v); ctx.fillRect(i * bw + bw * 0.2, base - hh, bw * 0.6, hh); }
        ctx.globalCompositeOperation = 'source-over';
      }
      // logo: pulsuje na stopę
      if (R.logo) { const sc = 1 + 0.085 * Math.min(1.1, k) + 0.025 * b; ctx.globalAlpha = 1; drawLogo(ctx, R.logo, cx, cy, box, sc); }
      // błysk na mocnym uderzeniu
      const fl = Math.max(0, k - 0.6) * 0.16; if (fl > 0.004) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hexA(pal.accent, fl); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      // napisy z tekstu
      drawCaps(ctx, R, t, W, H, vert);
      // tytuł i nazwa kanału
      const fa = Math.min(1, rel / 0.7); ctx.globalAlpha = fa; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
      const tpx = vert ? W * 0.085 : H * 0.07; ctx.font = font(tpx, 800);
      let tl = wrap(ctx, (R.title || '').toUpperCase(), W * (vert ? 0.88 : 0.8)); if (tl.length > 2) tl = tl.slice(0, 2);
      const ty = vert ? H * 0.855 : H * 0.865, lh = tpx * 1.05, ysS = ty - (tl.length - 1) * lh;
      ctx.lineWidth = tpx * 0.16; ctx.strokeStyle = 'rgba(0,0,0,.9)';
      tl.forEach((l, i) => { const y = ysS + i * lh; ctx.strokeText(l, W / 2, y); ctx.fillStyle = '#f2f2f2'; ctx.fillText(l, W / 2, y); });
      const npx = tpx * 0.42; ctx.font = font(npx, 700); const nm = (p.name || '').toUpperCase().split('').join(' '); ctx.lineWidth = npx * 0.2; const ny = ty + npx * 1.7;
      ctx.strokeText(nm, W / 2, ny); ctx.fillStyle = pal.accent; ctx.fillText(nm, W / 2, ny); ctx.globalAlpha = 1;
      // zakończenie
      const tail = o.short ? 2.2 : 5;
      if (rel > total - tail) {
        const a = Math.min(1, (rel - (total - tail)) / 0.6), px = vert ? W * 0.07 : H * 0.06; ctx.globalAlpha = a; ctx.font = font(px, 800); ctx.lineWidth = px * 0.18; ctx.strokeStyle = 'rgba(0,0,0,.88)';
        const msg = o.short ? (pl ? 'Pełny utwór na kanale' : 'Full track on the channel') : (pl ? 'Subskrybuj kanał' : 'Subscribe'); const yy = vert ? H * 0.12 : H * 0.14;
        ctx.strokeText(msg, W / 2, yy); ctx.fillStyle = pal.accent; ctx.fillText(msg, W / 2, yy);
        const hd = p.handle ? (p.handle[0] === '@' ? p.handle : '@' + p.handle) : ''; ctx.font = font(px * 0.6, 600); ctx.strokeText(hd, W / 2, yy + px * 1.05); ctx.fillStyle = '#f2f2f2'; ctx.fillText(hd, W / 2, yy + px * 1.05); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = hexA(pal.accent, 0.95); ctx.fillRect(0, H - 3, W * Math.min(1, rel / total), 3);
      ctx.restore();
    };
  };

  /* ---------- miniatury: 3 układy, 16:9 (1280×720) i 9:16 (1080×1920) ---------- */
  S.THUMB_NAMES = ['Logo na środku', 'Napis z lewej', 'Wielki napis'];
  S.thumbBrand = function (R, vertical, v) {
    const W = vertical ? 1080 : 1280, H = vertical ? 1920 : 720, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), p = R.p, pal = p.palette, heroes = R.heroes && R.heroes.length ? R.heroes : [R.hero], sel = R.heroSel || 0;
    const im = heroes[(sel + v) % heroes.length], logo = R.logo, S1 = Math.min(W, H);
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
    cover(ctx, im, W, H, v === 2 ? 1.25 : 1.1, v === 1 ? -W * 0.06 : 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = hexA(pal.accent2, 0.25); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(W / 2, H / 2, S1 * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.72)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const words = (R.thumbWords || R.title || '').toUpperCase().split(/\s+/).filter(Boolean).slice(0, 3);
    const glow = (x, y, r, a) => { const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r); g.addColorStop(0, hexA(pal.accent, a)); g.addColorStop(1, hexA(pal.accent, 0)); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; };
    const face = (px) => { ctx.font = font(px, 800); };
    const txt = (s, x, y, px, fill) => { face(px); ctx.lineJoin = 'round'; ctx.lineWidth = px * 0.14; ctx.strokeStyle = 'rgba(0,0,0,.92)'; ctx.strokeText(s, x, y); ctx.fillStyle = fill || pal.accent; ctx.fillText(s, x, y); };
    const fit = (arr, maxW, start) => { let px = start; for (; px > 50; px -= 6) { face(px); if (Math.max(...arr.map((w) => ctx.measureText(w).width)) < maxW) break; } return px; };
    ctx.textBaseline = 'alphabetic';
    if (!vertical) {
      if (v === 0) {
        glow(W / 2, H * 0.4, H * 0.7, 0.5); if (logo) drawLogo(ctx, logo, W / 2, H * 0.4, H * 0.66, 1);
        const line = words.join(' '); let px = 150; for (; px > 50; px -= 6) { face(px); if (ctx.measureText(line).width < W - 140) break; }
        ctx.textAlign = 'center'; txt(line, W / 2, H - 42, px, '#f2f2f2');
      } else if (v === 1) {
        glow(W * 0.76, H * 0.5, H * 0.8, 0.45); if (logo) drawLogo(ctx, logo, W * 0.76, H * 0.5, H * 0.78, 1);
        const px = fit(words, W * 0.5, 190); ctx.textAlign = 'left'; const lh = px * 0.98, y0 = H / 2 + (words.length - 1) * lh / 2 + px * 0.34;
        words.forEach((w, i) => txt(w, 60, y0 - (words.length - 1 - i) * lh, px, i === words.length - 1 ? pal.accent : '#f2f2f2'));
      } else {
        glow(W / 2, H * 0.5, H * 0.9, 0.35); if (logo) drawLogo(ctx, logo, W / 2, H * 0.17, H * 0.3, 1);
        const line = words.join(' '); let px = 220; for (; px > 60; px -= 6) { face(px); if (ctx.measureText(line).width < W - 100) break; }
        ctx.textAlign = 'center'; txt(line, W / 2, H * 0.74, px, pal.accent);
      }
      ctx.textAlign = 'left'; face(30); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6; const nm = (p.name || '').toUpperCase().split('').join(' '); ctx.strokeStyle = 'rgba(0,0,0,.85)'; if (v !== 1) { ctx.strokeText(nm, 40, 62); ctx.fillText(nm, 40, 62); }
    } else {
      if (v === 0) {
        glow(W / 2, H * 0.36, W * 0.9, 0.5); if (logo) drawLogo(ctx, logo, W / 2, H * 0.36, W * 0.84, 1);
        const px = fit(words, W - 120, 230); ctx.textAlign = 'center'; const lh = px * 0.98; words.forEach((w, i) => txt(w, W / 2, H - 150 - (words.length - 1 - i) * lh, px, i === words.length - 1 ? pal.accent : '#f2f2f2'));
      } else if (v === 1) {
        glow(W / 2, H * 0.24, W * 0.8, 0.45); if (logo) drawLogo(ctx, logo, W / 2, H * 0.24, W * 0.7, 1);
        const px = fit(words, W - 120, 260); ctx.textAlign = 'left'; const lh = px * 0.98; words.forEach((w, i) => txt(w, 60, H * 0.62 + i * lh, px, i === 0 ? pal.accent : '#f2f2f2'));
      } else {
        glow(W / 2, H * 0.5, W * 1.1, 0.35); if (logo) drawLogo(ctx, logo, W / 2, H * 0.14, W * 0.42, 1);
        const px = fit(words, W - 100, 300); ctx.textAlign = 'center'; const lh = px * 1.0; words.forEach((w, i) => txt(w, W / 2, H * 0.52 + (i - (words.length - 1) / 2) * lh + px * 0.34, px, pal.accent));
      }
      ctx.textAlign = 'center'; face(38); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.fillStyle = 'rgba(255,255,255,.88)'; const nm = (p.name || '').toUpperCase().split('').join(' '); ctx.strokeText(nm, W / 2, H - 70); ctx.fillText(nm, W / 2, H - 70);
    }
    return c;
  };

  /* ---------- obiekt R dla trybu „marka” ---------- */
  S.mkBrand = function (id) {
    const s = App.song(id), p = App.profile(s.profileId), M = S.mem(id), ln = S.lines(s.lyrics);
    const caps = M.exact && M.caps && M.caps.length ? M.caps : (M.approx !== false && ln.length ? S.heurCaps(ln, M.an) : []);
    const heroes = M.heroes && M.heroes.length ? M.heroes : [S.procArt(p, 3)], sel = Math.min(M.heroSel || 0, heroes.length - 1);
    return { mode: 'brand', p, an: M.an, bass: M.bass, hero: heroes[sel], heroes, heroSel: sel, logo: S.logoImg(p), caps, offset: M.offset, title: s.title || '', buf: M.buf, thumbWords: s.thumbWords || '', thumbVar16: M.thumbVar16 || 0, thumbVar9: M.thumbVar9 || 0, cuts: [], imgs: heroes };
  };

  /* ---------- trzy tła do wyboru ---------- */
  const SCENES = {
    warhead: ['ruined industrial forge, molten metal glow, drifting embers, heavy smoke', 'empty night highway under a storm, orange sodium lights, rain on asphalt', 'dark underground gym hall lit by a single red light, steel racks, chalk dust in the air', 'wall of massive speaker stacks in a dark warehouse, cracked cones, dust floating in beams of orange light', 'rocket silo at night, countdown glow, fog and sparks'],
    melodia: ['stormy battlefield at dusk, torn banners, embers drifting', 'lone wolf silhouette on a rocky ridge, golden storm light', 'iron gate in a ruined fortress, teal fog and gold light', 'empty boxing ring under one hard light, smoke', 'blacksmith forge at night, sparks flying']
  };
  AI.heroes = async function (p, song, lines) {
    const peopleOK = AI.peopleOK(p);
    const prompt = [
      'Projektujesz 3 grafiki tła do teledysku muzycznego, które zostaną użyte jako jedno tło całego filmu.',
      'Kanał: ' + p.name + '. Styl wizualny kanału: ' + p.visual + '. Gatunek: ' + p.dna.genre + '. Tytuł utworu: ' + (song.title || '') + '.',
      lines.length ? 'Fragment tekstu utworu (dla nastroju):\n' + lines.slice(0, 14).join('\n') : '',
      'Zwróć JSON {"scenes":["","",""]}: trzy RÓŻNE opisy kadru PO ANGIELSKU, każdy jedno zdanie (miejsce, atmosfera, światło, detale), pasujące do nastroju tego utworu. Zasady: środek kadru ciemniejszy i mało zagracony, bo tam wchodzi logo; bez tekstu, liter, logo i znaków wodnych; ' + (peopleOK ? 'najwyżej jedna postać, widoczna w całości z twarzą, z boku kadru, albo bez postaci' : 'bez ludzi') + '; trzy kompozycje wyraźnie różne od siebie.'
    ].filter(Boolean).join('\n');
    const r = JSON.parse(String(await AI.gemini(prompt, { json: true, temp: 0.9 })).replace(/^```\w*\n?|```$/g, '').trim());
    const arr = (Array.isArray(r) ? r : r.scenes || []).map(String).filter((x) => x.length > 8).slice(0, 3);
    if (arr.length < 3) throw new Error('Gemini zwrócił za mało scen.');
    return arr;
  };
  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const heroPrompt = (p, scene) => scene + '. ' + p.visual + '. Wide cinematic composition, dark centered area, no text, no letters, no watermark.';
  S.makeHeroes = async function (id, say, notes) {
    const s = App.song(id), p = App.profile(s.profileId), M = S.mem(id), key = App.ai.hasKey();
    let scenes = null; const lines = M.caps && M.caps.length ? M.caps.map((c) => c.text) : S.lines(s.lyrics);
    if (key) { try { say('Gemini układa trzy tła pod ten utwór…'); scenes = await AI.heroes(p, s, lines); } catch (e) { notes.push('Tła z Gemini: ' + e.message + ' Użyłem scen domyślnych kanału.'); } }
    if (!scenes) scenes = shuffle(SCENES[p.id] || SCENES.melodia).slice(0, 3);
    const out = []; let fails = 0;
    for (let i = 0; i < 3; i++) { say('Generuję tło ' + (i + 1) + ' z 3…'); try { out.push(await S.genImage(heroPrompt(p, scenes[i]))); } catch (e) { fails++; out.push(S.procArt(p, i + 5)); } }
    if (fails) notes.push(fails + ' z 3 teł zastąpiłem grafiką zastępczą (generator obrazów nie odpowiedział).');
    M.heroes = out; M.heroSel = 0; M.heroPrompts = scenes; M.tc = null; M.generated = fails < 3;
  };
  S.newHeroes = async function (id, render) {
    const M = S.mem(id); if (M.running) return; M.running = true; M.notes = [];
    const say = (m) => { M.status = m; render(); };
    try { await S.makeHeroes(id, say, M.notes); } catch (e) { M.notes = [e.message || 'Błąd']; }
    M.running = false; M.status = ''; render();
  };
  /* przygotowanie w trybie „marka”: napisy ze słuchu + trzy tła + analiza utworu dla opisu */
  S.autoPrepareBrand = async function (id, say) {
    const s = App.song(id), p = App.profile(s.profileId), M = S.mem(id), key = App.ai.hasKey(), notes = [];
    let lines = S.lines(s.lyrics); M.exact = false; M.caps = null; M.align = lines.length ? 'przybliżone' : 'brak tekstu';
    if (key) {
      try {
        const ck = (M.file ? M.file.size : 0) + ':' + Math.round(M.an.dur * 10);
        if (s.caps && s.caps.key === ck && s.caps.list && s.caps.list.length > 5) { M.caps = s.caps.list; M.align = 'ze słuchu (zapisane)'; }
        else {
          say('Gemini słucha utworu i spisuje napisy…'); M.caps = await S.aiCaps(M.buf, M.an, lines, say); M.align = 'ze słuchu (Gemini)';
          if (M.caps.fails && M.caps.fails.length) notes.push('Część nagrania nie została spisana. Kliknij „Spisz napisy od nowa”, żeby spróbować ponownie.');
          else { s.caps = { key: ck, list: M.caps.map((c) => ({ t: c.t, e: c.e, text: c.text })) }; App.save(); }
        }
        M.exact = true; lines = M.caps.map((c) => c.text);
      } catch (e) { M.caps = null; notes.push('Napisy: ' + e.message + ' Pokazuję napisy przybliżone.'); }
    } else notes.push('Brak klucza Gemini: napisy nie będą dopasowane do nagrania, a tła powstaną ze scen domyślnych (Ustawienia → Klucz Gemini).');
    if (M.exact) { M.chorusText = S.chorusFromCaps(M.caps); if (M.chorusText && s.chorusAuto !== false) { s.chorusStart = mmss(M.chorusText.start); s.chorusAuto = true; } }
    if (s.own && App.own && key) { try { await App.own.describe(id, say, notes); } catch (e) { notes.push('Opis utworu: ' + e.message); } }
    await S.makeHeroes(id, say, notes);
    App.save(); M.notes = notes; return notes;
  };

  /* ---------- fragmenty panelu: wybór tła, miniatur, napisu ---------- */
  function small(c, w) { const o = document.createElement('canvas'); o.width = w; o.height = Math.round(w * c.height / c.width); o.getContext('2d').drawImage(c, 0, 0, o.width, o.height); return o; }
  S.brandBlocks = function (songId, render, guard, toast) {
    const h = App.ui.h, icon = App.ui.icon, s = App.song(songId), p = App.profile(s.profileId), M = S.mem(songId), out = [];
    S.loadLogo(p).then(() => { if (!M.logoShown) { M.logoShown = true; render(); } });
    if (!M.heroes || !M.heroes.length) return out;
    const sel = Math.min(M.heroSel || 0, M.heroes.length - 1);
    out.push(h('div', { class: 'stack' }, h('span', { class: 'flabel' }, '1. Tło teledysku: dotknij, żeby wybrać jedno'),
      h('div', { class: 'thumbs' }, M.heroes.map((im, i) => { const c = small(im, 240); c.className = 'thumb' + (i === sel ? ' sel' : ''); c.onclick = () => { M.heroSel = i; M.tc = null; render(); }; return c; })),
      h('button', { class: 'btn ghost', disabled: M.running ? 'true' : null, onclick: () => S.newHeroes(songId, render) }, icon('refresh', 18), 'Wygeneruj inne 3 tła')));
    const words = h('input', { value: s.thumbWords || (s.title || '').toUpperCase().split(/\s+/).slice(0, 3).join(' '), maxlength: 40, oninput: (e) => { s.thumbWords = e.target.value; } });
    out.push(h('label', { class: 'field' }, h('span', { class: 'flabel' }, 'Napis na miniaturze (maksymalnie 3 słowa)'), words,
      h('button', { class: 'btn ghost sm', onclick: () => { s.thumbWords = words.value.toUpperCase().trim(); M.tc = null; App.save(); render(); } }, 'Odśwież miniatury')));
    const R = S.mk(songId), key = (s.thumbWords || s.title || '') + '|' + M.heroes.length + '|' + sel + '|' + (R.logo ? 1 : 0);
    if (!M.tc || M.tc.key !== key) {
      const c16 = [0, 1, 2].map((v) => S.thumbBrand(R, false, v)), c9 = [0, 1, 2].map((v) => S.thumbBrand(R, true, v));
      M.tc = { key, c16, c9 };
    }
    const pick = (list, w, selKey, label, vertical) => h('div', { class: 'stack' }, h('span', { class: 'flabel' }, label),
      h('div', { class: 'thumbs' + (vertical ? '' : ' wide') }, list.map((c, i) => { const sm = small(c, w); sm.className = 'thumb' + (i === (M[selKey] || 0) ? ' sel' : ''); sm.onclick = () => { M[selKey] = i; render(); }; return sm; })),
      h('button', { class: 'btn ghost', onclick: guard(async () => { const b = await new Promise((r) => list[M[selKey] || 0].toBlob(r, 'image/jpeg', 0.92)); const nm = (s.title || 'miniatura').replace(/[^\w\-]+/g, '_') + (vertical ? '_9x16.jpg' : '_16x9.jpg'); S.save(b, nm, 'share').catch(() => S.save(b, nm, 'file')); }) }, icon('copy', 18), 'Zapisz wybraną miniaturę'));
    out.push(pick(M.tc.c16, 300, 'thumbVar16', '2. Miniatura 16:9 (1280×720): wybierz jedną. Jest też pierwszym kadrem teledysku.', false));
    out.push(pick(M.tc.c9, 170, 'thumbVar9', '3. Miniatura Shorta 9:16 (1080×1920): wybierz jedną. Jest pierwszym kadrem Shorta.', true));
    return out;
  };
})();
