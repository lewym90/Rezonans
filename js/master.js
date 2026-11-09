/* AUDIO MASTER CHECK: kontrola jakości pliku liczona w telefonie, bez internetu i bez AI.
   Głośność według ITU-R BS.1770 (K-weighting, bramkowanie), True Peak (nadpróbkowanie 4x), przestery, RMS,
   dynamika, cisza na początku i końcu, balans kanałów, korelacja stereo, rozkład pasm i zakres częstotliwości. */
(function () {
  const App = window.App, MC = (App.master = {});
  const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

  function biquad(x, b0, b1, b2, a1, a2) {
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = x[i], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; }
    return y;
  }
  function kWeight(x, fs) {
    // etap 1: półka wysokich tonów
    let f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / fs);
    const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
    const s1 = biquad(x, (Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0);
    // etap 2: filtr górnoprzepustowy (RLB)
    f0 = 38.13547087602444; Q = 0.5003270373238773; K = Math.tan(Math.PI * f0 / fs);
    const d = 1 + K / Q + K * K;
    return biquad(s1, 1, -2, 1, 2 * (K * K - 1) / d, (1 - K / Q + K * K) / d);
  }
  /* bloki energii po K-weighting: suma kanałów, okno w sekundach, krok w sekundach */
  function blocks(kw, fs, win, step) {
    const n = Math.round(win * fs), st = Math.round(step * fs), out = [];
    const cum = kw.map((c) => { const a = new Float64Array(c.length + 1); for (let i = 0; i < c.length; i++) a[i + 1] = a[i] + c[i] * c[i]; return a; });
    for (let s = 0; s + n <= kw[0].length; s += st) { let z = 0; cum.forEach((a) => { z += (a[s + n] - a[s]) / n; }); out.push(z); }
    return out;
  }
  const lufsOf = (z) => -0.691 + 10 * Math.log10(z);
  function integrated(zs) {
    const abs = zs.filter((z) => lufsOf(z) > -70); if (!abs.length) return -Infinity;
    const m1 = abs.reduce((a, b) => a + b, 0) / abs.length, rel = lufsOf(m1) - 10;
    const g = abs.filter((z) => lufsOf(z) > rel); return lufsOf(g.reduce((a, b) => a + b, 0) / g.length);
  }
  function lra(st) {
    const abs = st.filter((z) => lufsOf(z) > -70); if (abs.length < 3) return null;
    const m = abs.reduce((a, b) => a + b, 0) / abs.length, rel = lufsOf(m) - 20;
    const v = abs.filter((z) => lufsOf(z) > rel).map(lufsOf).sort((a, b) => a - b);
    const q = (p) => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
    return q(0.95) - q(0.10);
  }
  /* True Peak: nadpróbkowanie 4x filtrem sinc (okno Kaisera), liczone tylko wokół głośnych próbek */
  const TAPS = 16, PH = 4, KERN = (function () {
    const k = []; const bessel = (x) => { let s = 1, t = 1; for (let i = 1; i < 25; i++) { t *= (x / (2 * i)) * (x / (2 * i)); s += t; } return s; };
    const beta = 8, i0b = bessel(beta);
    for (let p = 1; p < PH; p++) { const f = []; for (let j = -TAPS + 1; j <= TAPS; j++) { const t = j - p / PH, x = Math.PI * t; const sinc = Math.abs(t) < 1e-9 ? 1 : Math.sin(x) / x; const r = t / TAPS; const w = Math.abs(r) <= 1 ? bessel(beta * Math.sqrt(1 - r * r)) / i0b : 0; f.push(sinc * w); } k.push(f); }
    return k;
  })();
  function truePeak(c, sp) {
    let tp = sp; const thr = sp * 0.6;
    for (let i = TAPS; i < c.length - TAPS; i++) {
      if (Math.abs(c[i]) < thr && Math.abs(c[i + 1]) < thr) continue;
      for (let p = 0; p < PH - 1; p++) { const f = KERN[p]; let s = 0; for (let j = 0; j < f.length; j++) s += f[j] * c[i + j - TAPS + 1]; const a = Math.abs(s); if (a > tp) tp = a; }
    }
    return tp;
  }
  /* prosta FFT (radix-2) do rozkładu pasm */
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr; re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
  }

  MC.BANDS = [['Sub', 20, 60], ['Bas', 60, 250], ['Niski środek', 250, 500], ['Środek', 500, 2000], ['Wysoki środek', 2000, 6000], ['Góra', 6000, 16000], ['Powietrze', 16000, 22050]];

  MC.measure = function (buf) {
    const fs = buf.sampleRate, ch = []; for (let i = 0; i < Math.min(2, buf.numberOfChannels); i++) ch.push(buf.getChannelData(i));
    if (ch.length === 1) ch.push(ch[0]);
    const N = ch[0].length, dur = N / fs;
    // szczyty, RMS, przestery
    const peak = [0, 0], sum2 = [0, 0]; let clipRuns = 0, overs = 0;
    ch.forEach((c, k) => { let run = 0; for (let i = 0; i < N; i++) { const a = Math.abs(c[i]); if (a > peak[k]) peak[k] = a; sum2[k] += c[i] * c[i]; if (a > 1.0) overs++; if (a >= 0.9995) { run++; if (run === 3) clipRuns++; } else run = 0; } });
    const rms = sum2.map((s) => Math.sqrt(s / N));
    const sp = Math.max(peak[0], peak[1]);
    // głośność BS.1770
    const kw = ch.map((c) => kWeight(c, fs));
    const mom = blocks(kw, fs, 0.4, 0.1), st = blocks(kw, fs, 3, 0.5);
    const I = integrated(mom), stMax = st.length ? Math.max(...st.map(lufsOf)) : null, LRA = lra(st);
    const tp = Math.max(truePeak(ch[0], peak[0]), truePeak(ch[1], peak[1]));
    // cisza
    const thr = 0.001; let s0 = 0, s1 = N - 1;
    while (s0 < N && Math.abs(ch[0][s0]) < thr && Math.abs(ch[1][s0]) < thr) s0++;
    while (s1 > 0 && Math.abs(ch[0][s1]) < thr && Math.abs(ch[1][s1]) < thr) s1--;
    // korelacja i stereo
    let lr = 0, ll = 0, rr = 0, mid = 0, side = 0;
    for (let i = 0; i < N; i += 2) { const l = ch[0][i], r = ch[1][i]; lr += l * r; ll += l * l; rr += r * r; const m = (l + r) / 2, s = (l - r) / 2; mid += m * m; side += s * s; }
    const corr = ll && rr ? lr / Math.sqrt(ll * rr) : 1;
    // pasma i zakres częstotliwości
    const F = 4096, frames = Math.min(160, Math.floor((N - F) / F)), stepF = Math.max(F, Math.floor((N - F) / Math.max(1, frames))), spec = new Float64Array(F / 2);
    const win = new Float32Array(F); for (let i = 0; i < F; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (F - 1));
    let used = 0;
    for (let f = 0; f < frames; f++) { const o = f * stepF; if (o + F > N) break; const re = new Float64Array(F), im = new Float64Array(F); for (let i = 0; i < F; i++) re[i] = (ch[0][o + i] + ch[1][o + i]) * 0.5 * win[i]; fft(re, im); for (let i = 0; i < F / 2; i++) spec[i] += re[i] * re[i] + im[i] * im[i]; used++; }
    const hz = (i) => i * fs / F, tot = spec.reduce((a, b) => a + b, 0) || 1;
    const bands = MC.BANDS.map((b) => { let e = 0; for (let i = 1; i < F / 2; i++) { const f0 = hz(i); if (f0 >= b[1] && f0 < b[2]) e += spec[i]; } return { n: b[0], from: b[1], to: b[2], pct: e / tot * 100 }; });
    // górna granica pasma: najwyższa częstotliwość, gdzie widmo jest nie niżej niż 50 dB pod maksimum (wygładzone)
    const sm = []; for (let i = 0; i < F / 2; i += 8) { let e = 0; for (let j = 0; j < 8; j++) e += spec[i + j] || 0; sm.push({ f: hz(i + 4), e: e / 8 }); }
    const mx = Math.max(...sm.map((x) => x.e)); let cutoff = 0; sm.forEach((x) => { if (x.e > mx * 1e-5) cutoff = x.f; });
    return {
      at: Date.now(), dur, fs, channels: buf.numberOfChannels,
      lufs: I, stMax, lra: LRA, tp: db(tp), sp: db(sp), plr: db(tp) - I,
      rms: rms.map(db), balance: db(rms[0]) - db(rms[1]), crest: db(sp) - db(Math.max(rms[0], rms[1])),
      clipRuns, overs, silStart: s0 / fs, silEnd: (N - 1 - s1) / fs,
      corr, side: mid ? 10 * Math.log10((side || 1e-12) / mid) : -99, bands, cutoff, frames: used
    };
  };

  /* zakresy dla kanału: różne gatunki, nie jedna liczba dla wszystkich */
  MC.target = function (p) {
    if (p.master) return p.master;
    const g = ((p.dna && p.dna.genre) || '').toLowerCase();
    if (/metal|industrial|bass|hardstyle|edm|dubstep/.test(g)) return { lufs: [-10, -7], tp: -1, plr: 6, name: 'ciężkie gitary, bas, elektronika' };
    if (/rap|hip-hop|trap/.test(g)) return { lufs: [-11, -8], tp: -1, plr: 7, name: 'rap i trap z orkiestrą' };
    if (/akust|ballad|jazz|klasy|orkiestr|ambient|folk/.test(g)) return { lufs: [-16, -11], tp: -1, plr: 10, name: 'muzyka dynamiczna' };
    return { lufs: [-13, -8], tp: -1, plr: 7, name: 'muzyka popularna' };
  };

  const f1 = (x) => (x == null || !isFinite(x) ? '—' : (Math.round(x * 10) / 10).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  MC.f1 = f1;
  /* raport: ostrzeżenia i sugestie */
  MC.report = function (m, p) {
    const T = MC.target(p), out = [], add = (lvl, k, v, x) => out.push({ lvl, k, v, x });
    if (m.lufs < T.lufs[0] - 3) add('warn', 'Głośność zintegrowana', f1(m.lufs) + ' LUFS', 'Wyraźnie ciszej niż typowo w tym gatunku (' + T.lufs[0] + ' do ' + T.lufs[1] + ' LUFS). YouTube nie podgłaśnia cichych utworów, więc zabrzmi słabiej od konkurencji.');
    else if (m.lufs > T.lufs[1] + 1) add('warn', 'Głośność zintegrowana', f1(m.lufs) + ' LUFS', 'Głośniej niż typowo w tym gatunku (' + T.lufs[0] + ' do ' + T.lufs[1] + ' LUFS). YouTube i tak ściszy utwór do ok. -14 LUFS, a nadmierna kompresja zabiera uderzenie.');
    else add('ok', 'Głośność zintegrowana', f1(m.lufs) + ' LUFS', 'W typowym zakresie dla gatunku: ' + T.name + ' (' + T.lufs[0] + ' do ' + T.lufs[1] + ' LUFS). YouTube odtworzy go z poziomem ok. -14 LUFS.');
    if (m.tp > 0) add('bad', 'True Peak', f1(m.tp) + ' dBTP', 'Szczyty powyżej 0 dB po rekonstrukcji. Po konwersji YouTube (AAC/Opus) usłyszysz trzaski. Obniż limiter do ok. ' + T.tp + ' dBTP.');
    else if (m.tp > T.tp) add('warn', 'True Peak', f1(m.tp) + ' dBTP', 'Bez zapasu. Bezpiecznie jest ' + T.tp + ' dBTP lub niżej, bo kodowanie YouTube podnosi szczyty.');
    else add('ok', 'True Peak', f1(m.tp) + ' dBTP', 'Jest zapas na kodowanie YouTube.');
    if (m.overs > 0) add('bad', 'Przester w pliku', m.overs.toLocaleString('pl-PL') + ' próbek', 'Plik ma wartości powyżej pełnej skali. To słyszalny przester: wygeneruj lub wyeksportuj jeszcze raz z niższym poziomem.');
    else if (m.clipRuns > 20) add('warn', 'Ścięte szczyty', m.clipRuns + ' miejsc', 'Fala jest „ścięta” na pełnej skali w wielu miejscach. Przy ciężkim brzmieniu bywa celowe, ale może brzmieć szorstko.');
    else add('ok', 'Ścięte szczyty', m.clipRuns ? m.clipRuns + ' miejsc' : 'brak', m.clipRuns ? 'Pojedyncze miejsca, w normie.' : 'Brak ściętych szczytów.');
    const plr = m.plr;
    if (plr < T.plr - 1.5) add('warn', 'Dynamika (szczyt do głośności)', f1(plr) + ' dB', 'Mocno spłaszczone. Typowo co najmniej ' + T.plr + ' dB w tym gatunku. Stopa i werbel mogą tracić uderzenie.');
    else add('ok', 'Dynamika (szczyt do głośności)', f1(plr) + ' dB', 'W porządku dla gatunku (' + T.plr + ' dB lub więcej).' + (m.lra != null ? ' Zakres głośności (LRA): ' + f1(m.lra) + ' LU.' : ''));
    if (m.silStart > 1.0) add('warn', 'Cisza na początku', f1(m.silStart) + ' s', 'Widz słyszy ciszę. Pierwsze sekundy decydują, czy zostanie: utnij początek.');
    else add('ok', 'Cisza na początku', f1(m.silStart) + ' s', 'Utwór wchodzi od razu.');
    if (m.silEnd > 4) add('warn', 'Cisza na końcu', f1(m.silEnd) + ' s', 'Długa cisza na końcu obniża średni czas oglądania. Skróć zakończenie.');
    else add('ok', 'Cisza na końcu', f1(m.silEnd) + ' s', 'Zakończenie bez długiej ciszy.');
    const bal = m.balance;
    if (Math.abs(bal) > 1.5) add('warn', 'Balans kanałów', (bal > 0 ? 'lewy +' : 'prawy +') + f1(Math.abs(bal)) + ' dB', 'Jeden kanał jest wyraźnie głośniejszy. Na słuchawkach będzie to słychać.');
    else add('ok', 'Balans kanałów', f1(Math.abs(bal)) + ' dB różnicy', 'Kanały są wyrównane.');
    if (m.corr < 0) add('bad', 'Korelacja stereo', Math.round(m.corr * 100) + '%', 'Kanały są w przeciwfazie. W mono (telefon, głośnik) część dźwięku zniknie.');
    else if (m.corr < 0.3) add('warn', 'Korelacja stereo', Math.round(m.corr * 100) + '%', 'Bardzo szerokie stereo. Sprawdź utwór na głośniku telefonu (mono), bo bas i wokal mogą osłabnąć.');
    else if (m.corr > 0.985 && m.channels > 1) add('warn', 'Korelacja stereo', Math.round(m.corr * 100) + '%', 'Praktycznie mono. Brzmi węziej niż konkurencja.');
    else add('ok', 'Korelacja stereo', Math.round(m.corr * 100) + '%', 'Stereo zgodne z mono.');
    const sub = m.bands[0].pct + m.bands[1].pct;
    if (sub > 70) add('warn', 'Bas w miksie', Math.round(sub) + '% energii', 'Bardzo dużo energii poniżej 250 Hz. Na słabych głośnikach może dudnić i zagłuszać wokal.');
    else if (sub < 15) add('warn', 'Bas w miksie', Math.round(sub) + '% energii', 'Mało basu jak na ten kanał.');
    else add('ok', 'Bas w miksie', Math.round(sub) + '% energii', 'Proporcje dołu i reszty w normie.');
    if (m.cutoff && m.cutoff < 15500) add('warn', 'Zakres częstotliwości', 'do ok. ' + Math.round(m.cutoff / 100) / 10 + ' kHz', 'Góra jest ucięta (typowe dla mocno skompresowanego MP3). Jeśli możesz, pobierz plik WAV albo MP3 w lepszej jakości.');
    else add('ok', 'Zakres częstotliwości', 'do ok. ' + Math.round(m.cutoff / 100) / 10 + ' kHz', 'Pełne pasmo.');
    const bad = out.filter((x) => x.lvl === 'bad').length, warn = out.filter((x) => x.lvl === 'warn').length;
    const verdict = bad ? 'Do poprawy przed publikacją' : warn > 2 ? 'Do przejrzenia' : warn ? 'Dobrze, z uwagami' : 'Gotowe do publikacji';
    return { items: out, bad, warn, verdict, target: T };
  };

  MC.run = function (songId) {
    const s = App.song(songId), M = App.studio.mem(songId), p = App.profile(s.profileId);
    if (!M.buf) throw new Error('Najpierw wczytaj plik mp3.');
    const m = MC.measure(M.buf); s.master = { m, file: s.mp3 }; App.save(); return { m, r: MC.report(m, p) };
  };

  /* widok raportu */
  MC.view = function (songId, render) {
    const UI = App.ui, h = UI.h, icon = UI.icon, s = App.song(songId), p = App.profile(s.profileId), M = App.studio.mem(songId);
    const has = s.master && s.master.m, r = has ? MC.report(s.master.m, p) : null, m = has ? s.master.m : null;
    const go = () => { M.mcBusy = true; render(); setTimeout(() => { try { MC.run(songId); s.history = (s.history || []).concat({ at: Date.now(), x: 'Audio Master Check: ' + MC.report(s.master.m, p).verdict }); App.save(); } catch (e) { UI.toast(e.message); } M.mcBusy = false; render(); }, 40); };
    if (M.mcBusy) return h('div', { class: 'busy' }, h('i'), 'Mierzę plik w telefonie (kilka sekund)…');
    if (!has) return h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'Sprawdza głośność (LUFS), True Peak, przestery, dynamikę, ciszę, balans, stereo i pasmo. Liczy się w telefonie, bez internetu.'),
      h('button', { class: 'btn ghost', disabled: M.an ? null : 'true', onclick: go }, icon('shield', 18), 'Sprawdź jakość pliku'));
    const col = r.bad ? 'var(--bad)' : r.warn > 2 ? 'var(--warn)' : 'var(--good)';
    return h('div', { class: 'stack' },
      h('div', { class: 'mcv', style: { '--mc': col } }, h('b', null, r.verdict), h('span', null, s.master.file + ' · ' + MC.f1(m.dur / 60) + ' min · ' + Math.round(m.fs / 100) / 10 + ' kHz')),
      h('div', { class: 'mini3' }, h('div', null, h('b', { class: 'num' }, MC.f1(m.lufs)), h('span', null, 'LUFS')), h('div', null, h('b', { class: 'num' }, MC.f1(m.tp)), h('span', null, 'dBTP')), h('div', null, h('b', { class: 'num' }, MC.f1(m.plr)), h('span', null, 'dynamika dB'))),
      h('ul', { class: 'mcl' }, r.items.map((i) => h('li', { class: i.lvl }, h('span', { class: 'dot' }), h('div', null, h('div', { class: 'mh' }, h('span', null, i.k), h('b', { class: 'num' }, i.v)), h('p', null, i.x))))),
      h('div', { class: 'bands' }, m.bands.map((b) => h('div', null, h('i', { style: { height: Math.max(3, Math.min(100, b.pct * 1.6)) + '%' } }), h('span', null, b.n.split(' ').map((w) => w[0]).join('').toUpperCase())))),
      h('p', { class: 'why' }, 'Pasma: S sub, B bas, NŚ niski środek, Ś środek, WŚ wysoki środek, G góra, P powietrze. Zakresy dla kanału ' + p.name + ': ' + r.target.lufs[0] + ' do ' + r.target.lufs[1] + ' LUFS, True Peak do ' + r.target.tp + ' dBTP. To wskazówki, nie jedna norma dla wszystkich.'),
      h('button', { class: 'btn ghost sm', disabled: M.an ? null : 'true', onclick: go }, icon('refresh', 16), M.an ? 'Zmierz ponownie' : 'Wczytaj plik, żeby zmierzyć ponownie'),
      MC.compareBlock(songId, render));
  };

  /* porównanie dwóch wersji utworu (np. przed i po masteringu, dwie wersje z Suno) */
  MC.compareBlock = function (songId, render) {
    const UI = App.ui, h = UI.h, icon = UI.icon, s = App.song(songId), p = App.profile(s.profileId), M = App.studio.mem(songId), a = s.master && s.master.m, b = M.cmp;
    const fi = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; M.cmpBusy = true; render(); try { const buf = await App.studio.decode(await f.arrayBuffer()); M.cmp = Object.assign(MC.measure(buf), { name: f.name }); } catch (er) { UI.toast('Nie udało się wczytać pliku: ' + er.message); } M.cmpBusy = false; render(); } });
    const rows = [['Głośność', 'lufs', ' LUFS', 0], ['True Peak', 'tp', ' dBTP', -1], ['Dynamika', 'plr', ' dB', 1], ['LRA', 'lra', ' LU', 1], ['Korelacja', 'corr', '%', 0], ['Bas (do 250 Hz)', 'bass', '%', 0], ['Górna granica', 'cutoff', ' kHz', 1], ['Długość', 'dur', ' s', 0]];
    const val = (m, k) => (k === 'bass' ? m.bands[0].pct + m.bands[1].pct : k === 'corr' ? m.corr * 100 : k === 'cutoff' ? m.cutoff / 1000 : m[k]);
    return h('div', { class: 'stack', style: { marginTop: '6px' } },
      h('label', { class: 'btn ghost sm filebtn' }, icon('sliders', 16), M.cmpBusy ? 'Mierzę drugą wersję…' : b ? 'Porównaj z innym plikiem' : 'Porównaj z inną wersją pliku', fi),
      a && b ? h('div', { class: 'cmpt' },
        h('div', { class: 'ch' }, h('span'), h('b', null, 'Ta wersja'), h('b', null, (b.name || 'Druga').slice(0, 18))),
        rows.map((r) => { const x = val(a, r[1]), y = val(b, r[1]); const better = r[3] === 0 || x == null || y == null ? '' : (r[3] > 0 ? (y > x + 0.3 ? 'b' : x > y + 0.3 ? 'a' : '') : (y < x - 0.3 ? 'b' : x < y - 0.3 ? 'a' : ''));
          return h('div', { class: 'cr' }, h('span', null, r[0]), h('b', { class: 'num' + (better === 'a' ? ' win' : '') }, f1(x) + r[2]), h('b', { class: 'num' + (better === 'b' ? ' win' : '') }, f1(y) + r[2])); }),
        h('p', { class: 'why', style: { gridColumn: '1 / -1' } }, 'Zielone: lepszy wynik technicznie (więcej dynamiki, niższy True Peak, szersze pasmo). To pomiar, nie ocena, która wersja lepiej brzmi.')) : null);
  };
})();
