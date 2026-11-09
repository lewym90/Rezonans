(function () {
  const App = (window.App = window.App || {});
  const E = App.engine, AI = App.ai;
  const UI = (App.ui = {});

  /* ---------- helpery DOM ---------- */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    const kids = Array.prototype.slice.call(arguments, 2);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else if (k === 'style' && typeof v === 'object') { for (const sk in v) { if (sk.slice(0, 2) === '--') el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; } }
      else el.setAttribute(k, v === true ? '' : v);
    }
    (function add(list) { list.forEach((c) => { if (c == null || c === false) return; if (Array.isArray(c)) return add(c); el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); }); })(kids);
    return el;
  }
  UI.h = h;
  const $ = (s, r) => (r || document).querySelector(s);

  const ICONS = {
    home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2V16h5v0c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/><path d="M12 1v0M4.2 4.2l.7.7M1 11h1M22 11h1M19.1 4.9l.7-.7"/>',
    note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    notes: '<path d="M8 17V6l12-2.5V15"/><circle cx="5.5" cy="17" r="2.5"/><circle cx="17.5" cy="15" r="2.5"/><path d="M8 9.5 20 7"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    plan: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h0M8 17h2M12 17h2"/>',
    playbox: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10.5 9 4.5 3-4.5 3z"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    larrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.6"/><path d="M21 3l-7.5 7.5"/>',
    clap: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9l1.5-5L21 6.5 20 9"/><path d="M8 4.7 10 8.5M13 5.4 15 9"/><path d="m10.5 13 4 2.2-4 2.2z"/>',
    pulse: '<rect x="4" y="4" width="10" height="10" rx="2"/><path d="M17 8h3M17 12h3M8 17v3M12 17v3"/><path d="m8 9 2 2 3-3"/>',
    flash: '<path d="M13 2 5 13h6l-1 9 8-11h-6z"/><path d="M19 3l1.5-1.5M21 7h2"/>',
    waves: '<rect x="8" y="8" width="8" height="8" rx="1.5"/><path d="M4.5 9V6a1.5 1.5 0 0 1 1.5-1.5h3M15 4.5h3A1.5 1.5 0 0 1 19.5 6v3M19.5 15v3a1.5 1.5 0 0 1-1.5 1.5h-3M9 19.5H6A1.5 1.5 0 0 1 4.5 18v-3"/>',
    dust: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="10" r="1.3"/><circle cx="11" cy="15" r="1.5"/><path d="M8 20v-2M16 20v-2"/>',
    warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    db: '<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H16"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    tri: '<path d="M8 5v14l10-7z" fill="currentColor" stroke="none"/>',
    upload: '<path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    spark: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 15v5M16.5 17.5h5"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    dup: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 4H6.5A2.5 2.5 0 0 0 4 6.5V16M14 11v6M11 14h6"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3V4z"/><circle cx="12" cy="12" r="2.3"/>',
    wave: '<path d="M4 12v0M8 8v8M12 4v16M16 9v6M20 11v2"/>',
    today: '<circle cx="12" cy="12" r="4"/>', idea: '<path d="M13 2 4.5 13.5H11L10 22l9-12h-6.5z"/>', songs: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>', deck: '<path d="m12 3-9 5 9 5 9-5z"/><path d="m3 13 9 5 9-5"/>'
  };
  function icon(name, size, sw) {
    const s = size || 22;
    return h('span', { class: 'ico', html: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>' });
  }
  UI.icon = icon;

  /* ---------- motyw: marka stała, akcenty z kanału ---------- */
  const lum = (hex) => { const n = parseInt(String(hex).replace('#', ''), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  UI.applyTheme = function () {
    const p = App.profile(), r = document.documentElement.style, pal = p.palette || {};
    const a = pal.accent || '#FF7A1A', b = pal.accent2 || '#7C4DFF';
    r.setProperty('--accent', a); r.setProperty('--accent2', b);
    r.setProperty('--on', lum(a) > 0.42 ? '#17120a' : '#fff'); r.setProperty('--on2', lum(b) > 0.42 ? '#0b1416' : '#fff');
    document.documentElement.dataset.ch = p.id;
  };

  function toast(msg) {
    const t = h('div', { class: 'toast', role: 'status' }, msg);
    $('#layer').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2200);
  }
  UI.toast = toast;
  async function copy(text, label) { const ok = await App.copy(text); toast(ok ? (label || 'Skopiowano') : 'Nie udało się skopiować. Zaznacz tekst ręcznie.'); }
  const fmt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('pl-PL'));
  const fmt1 = (n) => (n == null || isNaN(n) ? '—' : (Math.round(n * 10) / 10).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const logoOf = (p) => (p.brand && p.brand.logo) || 'assets/logos/rezonans-128.png';

  function mono(p, size) {
    const s = size || 48;
    return h('img', { class: 'chimg', src: logoOf(p), alt: '', style: { width: s + 'px', height: s + 'px' } });
  }

  function ring(done, total, size) {
    const s = size || 72, r = s / 2 - 5, c = 2 * Math.PI * r, f = total ? done / total : 0;
    const el = h('span', { class: 'ring', style: { width: s + 'px', height: s + 'px' }, role: 'img', 'aria-label': done + ' z ' + total, html:
      '<svg viewBox="0 0 ' + s + ' ' + s + '" width="' + s + '" height="' + s + '"><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" class="rt"/><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" class="rp" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/></svg><b>' + done + '<i>/' + total + '</i></b>' });
    requestAnimationFrame(() => requestAnimationFrame(() => { const p = el.querySelector('.rp'); if (p) p.style.strokeDashoffset = c * (1 - f); }));
    return el;
  }

  function field(label, input, extra) {
    return h('label', { class: 'field' }, h('span', { class: 'flabel' }, label, extra || null), input);
  }
  function counter(input, max) {
    const c = h('span', { class: 'count' });
    const upd = () => { const n = input.value.length; c.textContent = n + ' / ' + max; c.classList.toggle('over', n > max); };
    input.addEventListener('input', upd); upd(); return c;
  }
  function chip(label, on, fn, cls) { return h('button', { type: 'button', class: 'chip' + (on ? ' on' : '') + (cls ? ' ' + cls : ''), 'aria-pressed': on ? 'true' : 'false', onclick: fn }, label); }
  function copyBtn(getText, label) { return h('button', { type: 'button', class: 'iconbtn sm', 'aria-label': 'Kopiuj ' + (label || ''), onclick: () => copy(typeof getText === 'function' ? getText() : getText, label ? label + ' skopiowane' : 'Skopiowano') }, icon('copy', 18)); }

  /* ---------- arkusze ---------- */
  let sheetEl = null;
  function openSheet(title, build, opts) {
    closeSheet(true);
    opts = opts || {};
    const back = h('div', { class: 'sheet-back', onclick: () => closeSheet() });
    const body = h('div', { class: 'sheet-body' });
    const sh = h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'grab' }),
      h('header', { class: 'sheet-h' }, h('h2', null, opts.icon ? icon(opts.icon, 26) : null, title), h('button', { class: 'iconbtn', 'aria-label': 'Zamknij', onclick: () => closeSheet() }, icon('close', 20))),
      body);
    const wrap = h('div', { class: 'sheet-wrap' }, back, sh);
    $('#layer').appendChild(wrap); document.body.classList.add('lock');
    sheetEl = { wrap, body, build, opts };
    const render = () => { const y = body.scrollTop; body.textContent = ''; body.appendChild(build(render)); body.scrollTop = y; };
    sheetEl.render = render; render();
    return render;
  }
  function closeSheet(instant) {
    if (!sheetEl) return;
    const w = sheetEl.wrap; const onClose = sheetEl.opts.onClose; sheetEl = null;
    if (instant === true) w.remove(); else { w.classList.add('out'); setTimeout(() => w.remove(), 240); }
    document.body.classList.remove('lock');
    if (onClose) onClose();
  }
  UI.closeSheet = closeSheet;

  /* ---------- nawigacja ---------- */
  const TABS = [['today', 'Dziś', 'home'], ['ideas', 'Pomysł', 'bulb'], ['gen', 'Suno', 'note'], ['songs', 'Utwory', 'notes'], ['plan', 'Wyniki', 'chart'], ['profiles', 'Kanały', 'playbox']];
  UI.renderTabs = function () {
    const nav = $('#tabbar'); nav.textContent = '';
    TABS.forEach((t) => nav.appendChild(h('button', { class: 'tab' + (App.state.tab === t[0] ? ' on' : ''), 'aria-current': App.state.tab === t[0] ? 'page' : null, onclick: () => UI.go(t[0]) }, icon(t[2], 25, 1.6), h('span', null, t[1]))));
  };
  UI.go = function (tab) { App.state.tab = tab; UI.renderTabs(); UI.render(); window.scrollTo(0, 0); };
  let tick = null;
  UI.render = function () {
    UI.applyTheme();
    if (tick) { clearInterval(tick); tick = null; }
    const v = $('#view'); v.textContent = '';
    const fn = { today: renderToday, ideas: renderIdeas, songs: renderSongs, plan: renderResults, profiles: renderProfiles, gen: () => App.gen.view() }[App.state.tab] || renderToday;
    v.appendChild(fn());
  };
  UI.refreshBody = function () { if (App.state.tab === 'today' && !document.body.classList.contains('lock')) UI.render(); };

  /* nagłówek ekranu: wstecz (do Dziś), tytuł na środku, opcjonalna akcja */
  function topbar(title, sub, act, ic) {
    return h('header', { class: 'tophdr' + (ic ? ' icon' : '') },
      h('button', { class: 'back', 'aria-label': 'Wróć do Dziś', onclick: () => UI.go('today') }, icon('back', 26, 2)),
      h('h1', null, ic ? icon(ic, 30) : null, title),
      act || h('span'),
      sub ? h('p', { class: 'tsub' }, sub) : null);
  }
  UI.topbar = topbar;
  function header(title, sub, right) { return topbar(title, sub, right); }

  function currentSong() {
    const list = App.songsOf().filter((s) => s.status !== 'opublikowany' || (s.publishAt && Date.now() - new Date(s.publishAt).getTime() < 2 * 864e5)).sort((a, b) => {
      const ta = a.publishAt ? new Date(a.publishAt).getTime() : 9e15, tb = b.publishAt ? new Date(b.publishAt).getTime() : 9e15;
      const fa = ta > Date.now() - 864e5 ? ta : 9e15 + ta, fb = tb > Date.now() - 864e5 ? tb : 9e15 + tb;
      return fa - fb || b.created - a.created;
    });
    return list[0] || null;
  }

  /* ================= DZIŚ: centrum dowodzenia ================= */
  const pad2 = (n) => String(n).padStart(2, '0');
  const hm = (d) => pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const atTime = (day, time) => { const [H, M] = String(time || '18:00').split(':').map(Number); const d = new Date(day); d.setHours(H, M, 0, 0); return d; };

  /* plan wydania utworu: Short 1 w dniu premiery, premiera, Short 2 następnego dnia */
  function release(p, s) {
    const pub = s.publishAt ? new Date(s.publishAt) : App.nextAt(p.publish.time);
    const sh = p.publish.short || { time: '18:00', time2: '12:30' };
    const c = s.checks || {};
    return {
      pub,
      items: [
        { id: 'video', at: null, x: 'Utwór gotowy do premiery' },
        { id: 'upload', at: pub, x: 'Opublikuj o ' + hm(pub) },
        { id: 'sh1', at: atTime(pub, sh.time), x: 'Short #1 o ' + sh.time },
        { id: 'sh2', at: atTime(addDays(pub, 1), sh.time2 || '12:30'), x: 'Short #2 ' + (sameDay(pub, new Date()) ? 'jutro' : App.dayName(addDays(pub, 1))) + ' o ' + (sh.time2 || '12:30') }
      ].map((i) => Object.assign(i, { done: !!c[i.id] }))
    };
  }

  /* NAJWAŻNIEJSZA DECYZJA: jedna rzecz, która da dziś najwięcej. Liczone lokalnie, bez AI. */
  App.decide = function (p) {
    const songs = App.songsOf(p.id), now = Date.now(), D = 864e5;
    const pubT = (s) => (s.publishAt ? new Date(s.publishAt).getTime() : null);
    const published = songs.filter((s) => s.status === 'opublikowany' || (s.checks || {}).upload);
    const open = songs.filter((s) => !published.includes(s));
    // 1. premiera dziś lub jutro, a teledysk niegotowy
    const soon = open.filter((s) => pubT(s) && pubT(s) > now && pubT(s) - now < 1.5 * D && !(s.checks || {}).video).sort((a, b) => pubT(a) - pubT(b))[0];
    if (soon) return { t: 'Dokończ teledysk do „' + (soon.title || 'utworu') + '”', x: 'Premiera za ' + App.countdown(soon.publishAt) + ', a utwór nie jest oznaczony jako gotowy. Bez tego nic innego dziś nie ma sensu.', why: 'Na podstawie: termin premiery i lista wydania utworu.', act: ['Otwórz utwór', () => App.wizard.open(soon.id, 3)] };
    // 2. premiera minęła, a film nie jest oznaczony jako wysłany
    const missed = open.filter((s) => pubT(s) && pubT(s) < now - 3 * 36e5).sort((a, b) => pubT(b) - pubT(a))[0];
    if (missed) return { t: 'Sprawdź premierę „' + (missed.title || 'utworu') + '”', x: 'Termin minął ' + App.fmtDT(missed.publishAt) + ', a publikacja nie jest odhaczona. Jeśli film jest już na kanale, odhacz to. Jeśli nie, ustaw nowy termin.', why: 'Na podstawie: termin premiery i lista wydania.', act: ['Otwórz publikację', () => App.wizard.open(missed.id, 4)] };
    // 3. niewykorzystany Short z ostatniej premiery
    const lastPub = published.filter((s) => pubT(s) && now - pubT(s) < 8 * D).sort((a, b) => pubT(b) - pubT(a))[0];
    if (lastPub) {
      const c = lastPub.checks || {}, miss = ['sh1', 'sh2'].filter((k) => !c[k]);
      if (miss.length) return { t: 'Nie twórz dziś kolejnego utworu', x: 'Masz ' + (miss.length === 2 ? 'dwa niewykorzystane Shorty' : 'niewykorzystany Short') + ' z premiery „' + (lastPub.title || '') + '”. Przygotuj ' + (miss.length === 2 ? 'je' : 'go') + ' i opublikuj z odnośnikiem do pełnego utworu.', why: 'Na podstawie: lista po premierze. Short z refrenu prowadzi widzów do pełnego filmu.', act: ['Zadania po premierze', () => App.wizard.open(lastPub.id, 5)] };
    }
    // 4. wyniki po 7 dniach
    const due = published.filter((s) => pubT(s) && now - pubT(s) >= 7 * D && !(s.results && Number(s.results.views) > 0)).sort((a, b) => pubT(b) - pubT(a))[0];
    if (due) return { t: 'Wpisz wyniki „' + (due.title || '') + '”', x: 'Minęło 7 dni od premiery. Wyniki są potrzebne, żeby aplikacja porównywała style i podpowiadała, co powtarzać.', why: 'Na podstawie: data premiery i brak wyników.', act: ['Wpisz wyniki', () => App.wizard.open(due.id, 6)] };
    // 5. utwór w produkcji bez terminu
    const wip = open.filter((s) => !s.publishAt).sort((a, b) => b.created - a.created)[0];
    if (wip) { const st = App.wizard.stepOf(wip); return { t: 'Dokończ „' + (wip.title || 'nowy utwór') + '”', x: 'Utwór czeka na kroku „' + App.wizard.steps[st - 1].n + '”. Dokończ go i ustaw termin premiery, zanim zaczniesz kolejny.', why: 'Na podstawie: utwory w produkcji. Jeden dokończony jest wart więcej niż dwa zaczęte.', act: ['Prowadź dalej', () => App.wizard.open(wip.id)] }; }
    // 6. przerwa w publikacjach
    const lastT = Math.max(0, ...published.map((s) => pubT(s) || 0), (p.analytics && p.analytics.lastUpload) || 0);
    const gap = lastT ? Math.floor((now - lastT) / D) : null;
    if (gap != null && gap > 6) return { t: 'Wróć do regularnych premier', x: 'Od ostatniej premiery minęło ' + gap + ' dni. Regularność liczy się bardziej niż liczba utworów naraz. Zacznij nowy pomysł dziś.', why: 'Na podstawie: data ostatniej premiery' + (p.analytics ? ' i eksport ze Studio' : '') + '.', act: ['Nowy pomysł', () => UI.go('ideas')] };
    const day = E.week(p).find((w) => w.d === new Date().getDay());
    return { t: day ? day.x : 'Nowy pomysł', x: day ? day.s : 'Zacznij od pomysłu dopasowanego do kanału.', why: 'Na podstawie: plan tygodnia kanału.', act: [day && day.k === 'review' ? 'Wyniki' : 'Nowy pomysł', () => UI.go(day && day.k === 'review' ? 'plan' : 'ideas')] };
  };

  /* powiadomienia w aplikacji (dzwonek) */
  App.notices = function () {
    const out = [], s = App.state.settings, p = App.profile(), now = Date.now(), D = 864e5;
    App.songsOf(p.id).forEach((x) => {
      const t = x.publishAt ? new Date(x.publishAt).getTime() : null, c = x.checks || {};
      if (t && t > now && t - now < D && !c.upload) out.push({ lvl: 'warn', ic: 'clock', t: 'Premiera za ' + App.countdown(x.publishAt), x: '„' + (x.title || 'Utwór') + '” o ' + hm(new Date(t)) + '.', act: ['Otwórz', () => App.wizard.open(x.id, 4)] });
      if (t && c.upload) { const r = release(p, x); r.items.slice(2).forEach((i) => { if (!i.done && i.at && Math.abs(i.at.getTime() - now) < 12 * 36e5) out.push({ lvl: 'warn', ic: 'film', t: i.x.replace(/^Short/, 'Czas na Short'), x: 'Do premiery „' + (x.title || '') + '”.', act: ['Zadania', () => App.wizard.open(x.id, 5)] }); }); }
    });
    const hasData = App.state.songs.length > 0;
    const lastEx = s.lastExport || 0;
    if (hasData && now - lastEx > 7 * D) out.push({ lvl: 'warn', ic: 'db', t: 'Zrób kopię zapasową do pliku', x: lastEx ? 'Ostatnia kopia do pliku: ' + App.fmtDT(new Date(lastEx).toISOString()) + '.' : 'Nie masz jeszcze kopii do pliku. Kopie w telefonie robią się same, ale plik chroni przed utratą telefonu.', act: ['Kopia i dane', () => openData()] });
    if (App.saveFailed) out.push({ lvl: 'warn', ic: 'warn', t: 'Zapis danych się nie udał', x: 'Pamięć przeglądarki jest pełna albo zablokowana. Zrób kopię do pliku.', act: ['Kopia i dane', () => openData()] });
    if (p.yt && p.yt.at && now - p.yt.at > 7 * D) out.push({ lvl: 'info', ic: 'chart', t: 'Odśwież dane z YouTube', x: 'Ostatnie pobranie: ' + App.fmtDT(new Date(p.yt.at).toISOString()) + '.', act: ['Wyniki', () => UI.go('plan')] });
    if (!App.ai.hasKey()) out.push({ lvl: 'info', ic: 'spark', t: 'Brak klucza Gemini', x: 'Aplikacja liczy lokalnie wszystko, co się da. Klucz jest potrzebny tylko do pisania tekstów, napisów ze słuchu i teł.', act: ['Ustawienia', () => openSettings()] });
    return out;
  };
  function openNotices() {
    openSheet('Powiadomienia', () => {
      const list = App.notices();
      if (!list.length) return h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Nic pilnego. Wszystko jest na bieżąco.'));
      return h('ul', { class: 'notes' }, list.map((n) => h('li', { class: n.lvl }, icon(n.ic, 22), h('div', null, h('b', null, n.t), h('p', null, n.x), n.act ? h('div', { class: 'act' }, h('button', { class: 'btn sm ghost', onclick: () => { closeSheet(true); n.act[1](); } }, n.act[0])) : null))));
    }, { icon: 'bell' });
  }

  function pickChannel() {
    openSheet('Kanał', () => h('div', { class: 'list', style: { margin: 0 } }, App.state.profiles.map((p) => h('button', { class: 'row link' + (p.id === App.state.activeProfile ? ' sel' : ''), style: p.id === App.state.activeProfile ? { boxShadow: 'inset 0 0 0 1.5px ' + p.palette.accent } : null, onclick: () => { App.state.activeProfile = p.id; App.save(); closeSheet(true); UI.render(); } },
      mono(p, 46), h('div', { class: 'row-m' }, h('b', null, p.name), h('span', { class: 'muted small' }, p.handle + ' · ' + (p.lang === 'pl' ? 'polski' : 'angielski'))), p.id === App.state.activeProfile ? icon('check', 20) : icon('chev', 18)))));
  }

  const waveSvg = () => h('span', { html: '<svg width="96" height="26" viewBox="0 0 96 26" aria-hidden="true"><g stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--accent)">' + [3, 5, 4, 8, 12, 18, 24, 15, 9, 13, 6, 4, 3, 2].map((v, i) => '<line x1="' + (6 + i * 6.4) + '" x2="' + (6 + i * 6.4) + '" y1="' + (13 - v / 2) + '" y2="' + (13 + v / 2) + '"/>').join('') + '</g></svg>' });

  function countdownRing(target, label, size) {
    const s = size || 136, r = s / 2 - 7, c = 2 * Math.PI * r;
    const el = h('div', { class: 'cd' + (s < 130 ? ' small' : ''), style: { width: s + 'px', height: s + 'px' } });
    el.innerHTML = '<svg viewBox="0 0 ' + s + ' ' + s + '"><circle class="tr" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '"/><circle class="pr" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/></svg>';
    const tb = h('b', null, '--:--:--');
    el.appendChild(h('div', { class: 'in' }, tb, h('span', null, label)));
    const upd = () => {
      const ms = target.getTime() - Date.now();
      if (ms <= 0) { tb.textContent = 'teraz'; } else {
        const sec = Math.floor(ms / 1000), d = Math.floor(sec / 86400), hh = Math.floor((sec % 86400) / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
        tb.textContent = d > 0 ? d + ' d ' + pad2(hh) + ':' + pad2(mm) : pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss);
      }
      const frac = ms <= 0 ? 1 : Math.max(0.02, 1 - Math.min(1, ms / 864e5));
      const pr = el.querySelector('.pr'); if (pr) pr.style.strokeDashoffset = c * (1 - frac);
    };
    upd(); el._upd = upd; return el;
  }

  function renderToday() {
    const p = App.profile(), root = h('div', { class: 'screen today' }), song = currentSong();
    const nb = App.notices().filter((n) => n.lvl === 'warn').length;
    const hero = h('div', { class: 'hero-img' + (p.id === 'melodia' || p.id === 'warhead' ? '' : ' noimg') });
    if (p.id === 'melodia' || p.id === 'warhead') hero.style.backgroundImage = 'url(assets/hero/' + p.id + '.jpg)';
    hero.appendChild(h('div', { class: 'appbar' },
      h('img', { class: 'logo', src: 'assets/logos/rezonans-128.png', alt: 'Rezonans' }),
      h('span', { class: 'word' }, 'REZONANS'),
      h('button', { class: 'iconbtn', 'aria-label': 'Powiadomienia', onclick: openNotices }, icon('bell', 25, 1.7), nb ? h('span', { class: 'badge' }, nb) : null),
      h('button', { class: 'iconbtn', 'aria-label': 'Ustawienia', onclick: () => openSettings() }, icon('gear', 25, 1.6))));
    hero.appendChild(h('div', { class: 'hero-txt' }, h('h1', null, 'Dziś'), h('p', null, 'Twoje studio muzyki AI'),
      h('div', { class: 'hero-wave' }, waveSvg(), h('button', { class: 'chpill', onclick: pickChannel, 'aria-label': 'Zmień kanał' }, h('img', { src: logoOf(p), alt: '' }), p.name, icon('chev', 14, 2)))));
    root.appendChild(hero);

    /* najważniejsze teraz */
    const timers = [];
    if (song) {
      const r = release(p, song), done = r.items.filter((i) => i.done).length, pct = Math.round(done / r.items.length * 100);
      const cd = countdownRing(r.pub, r.pub.getTime() > Date.now() ? 'do premiery' : 'po premierze'); timers.push(cd);
      root.appendChild(h('section', { class: 'card now' },
        h('div', { class: 'card-h' }, icon('target', 30, 1.6), h('h3', null, 'Najważniejsze teraz')),
        h('p', { class: 'muted small', style: { margin: '-6px 0 8px 41px' } }, '„' + (song.title || 'Nowy utwór') + '” · premiera ' + App.fmtDT(r.pub.toISOString())),
        h('div', { class: 'now-grid' },
          h('div', { class: 'ckl' }, r.items.map((i) => h('button', { class: i.done ? 'on' : '', role: 'checkbox', 'aria-checked': i.done ? 'true' : 'false', onclick: () => { song.checks = song.checks || {}; song.checks[i.id] = !song.checks[i.id]; if (i.id === 'upload' && song.checks.upload) song.status = 'opublikowany'; App.save(); UI.render(); } }, h('span', { class: 'box' }, icon('check', 15, 2.6)), h('span', null, i.x)))),
          cd),
        h('div', { class: 'dayprog inset' }, h('div', { class: 'lab' }, h('span', null, 'Postęp wydania')), h('div', { class: 'row2' }, h('div', { class: 'bar' }, h('i', { style: { width: Math.max(2, pct) + '%' } })), h('b', null, pct + '%')))));
    } else {
      const next = App.nextAt(p.publish.time), cd = countdownRing(next, 'do premiery', 116); timers.push(cd);
      root.appendChild(h('section', { class: 'card now' },
        h('div', { class: 'card-h' }, icon('target', 30, 1.6), h('h3', null, 'Najważniejsze teraz')),
        h('div', { class: 'now-grid' }, h('div', null, h('p', { style: { fontSize: '15.5px' } }, 'Nie masz utworu w produkcji.'), h('p', { class: 'muted small', style: { marginTop: '6px' } }, 'Najbliższa godzina premiery według planu kanału: ' + p.publish.time + '.')), cd)));
    }

    root.appendChild(h('div', { class: 'duo' },
      h('button', { class: 'tile a', onclick: () => { App.state.ui = { ideaMode: 'own' }; UI.go('ideas'); } }, icon('bulb', 34, 1.6), h('span', null, 'Zacznij od', h('br'), 'pomysłu')),
      h('button', { class: 'tile b', onclick: () => App.own.open() }, icon('note', 34, 1.8), h('span', null, 'Mam gotowy', h('br'), 'utwór'))));

    /* plan na dziś */
    const plan = todayPlan(p);
    root.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('plan', 24, 1.6), h('h3', null, 'Plan na dziś')),
      plan.length ? h('ul', { class: 'tl' }, plan.map((x) => h('li', { class: (x.cur ? 'cur ' : '') + (x.done ? 'done' : ''), onclick: x.go || null },
        h('span', { class: 't' }, x.t || '—'), h('span', { class: 'sep' }), h('span', { class: 'pl' }, icon('tri', 13)), h('span', { class: 'x' }, x.x), x.done ? h('span', { class: 'ok' }, icon('check', 14, 2.6)) : h('span'))))
        : h('p', { class: 'muted' }, 'Na dziś nic nie jest zaplanowane.')));

    /* najważniejsza decyzja */
    const d = App.decide(p);
    root.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('brain', 24, 1.6), h('h3', null, 'Najważniejsza decyzja')),
      h('div', { class: 'decide' }, h('div', null, h('b', null, d.t), h('p', null, d.x), h('p', { class: 'why' }, d.why))),
      d.act ? h('button', { class: 'btn ghost', style: { width: '100%', marginTop: '12px' }, onclick: d.act[1] }, d.act[0]) : null));

    /* ostatnie wyniki */
    const per = App.yta.period(p, 7);
    root.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('chart', 24, 1.6), h('h3', null, 'Ostatnie wyniki'), h('button', { class: 'more', onclick: () => UI.go('plan') }, 'Więcej')),
      per ? h('div', { class: 'mini3' }, h('div', null, h('b', null, fmt(per.cur.views)), h('span', null, 'wyświetleń, 7 dni')), h('div', null, h('b', null, (per.cur.subs >= 0 ? '+' : '') + fmt(per.cur.subs)), h('span', null, 'subskrypcji')), h('div', null, h('b', null, per.cur.avp != null ? fmt1(per.cur.avp) + '%' : '—'), h('span', null, 'śr. obejrzenia')))
        : h('div', { class: 'mini3' }, h('div', null, h('b', null, fmt(p.stats.subs)), h('span', null, 'subskrypcji')), h('div', null, h('b', null, fmt1(p.stats.hours)), h('span', null, 'godzin')), h('div', null, h('b', null, fmt(p.stats.views)), h('span', null, 'wyświetleń'))),
      per ? null : h('p', { class: 'muted small', style: { marginTop: '10px' } }, 'Dane dzienne pojawią się po połączeniu z YouTube w zakładce Wyniki.')));

    tick = setInterval(() => { if (!document.body.contains(root)) return; timers.forEach((t) => t._upd()); }, 1000);
    return root;
  }

  function todayPlan(p) {
    const now = new Date(), items = [];
    App.songsOf(p.id).forEach((s) => {
      if (!s.publishAt) return;
      const r = release(p, s);
      r.items.slice(1).forEach((i) => { if (i.at && sameDay(i.at, now)) items.push({ at: i.at, t: hm(i.at), x: i.id === 'upload' ? 'Premiera „' + (s.title || 'utworu') + '”' : i.id === 'sh1' ? 'Short #1 (zapowiedź)' : 'Short #2 (następnego dnia)', done: i.done, go: () => App.wizard.open(s.id, i.id === 'upload' ? 4 : 5) }); });
    });
    items.sort((a, b) => a.at - b.at);
    if (!items.length) { const w = E.week(p).find((x) => x.d === now.getDay()); if (w) items.push({ t: w.k === 'pub' ? p.publish.time : '', x: w.x + ': ' + w.s, done: false, go: () => UI.go(w.k === 'make' ? 'ideas' : w.k === 'review' ? 'plan' : 'songs') }); }
    const cur = items.find((x) => !x.done); if (cur) cur.cur = true;
    return items;
  }

  /* ================= POMYSŁ ================= */
  function renderIdeas() {
    const p = App.profile(), ui = (App.state.ui = App.state.ui || {});
    ui.ideaMode = ui.ideaMode || 'own';
    const root = h('div', { class: 'screen' });
    root.appendChild(topbar('Pomysł', 'Dla kanału ' + p.name));
    root.appendChild(h('div', { class: 'seg', role: 'tablist' },
      ['own', 'surprise'].map((m) => h('button', { role: 'tab', 'aria-selected': ui.ideaMode === m ? 'true' : 'false', class: ui.ideaMode === m ? 'on' : '', onclick: () => { ui.ideaMode = m; ui.result = null; UI.render(); } }, m === 'own' ? 'Mam pomysł' : 'Zaskocz mnie'))));
    const out = h('div', { id: 'ideaOut' });
    if (ui.ideaMode === 'own') {
      const ta = h('textarea', { rows: 3, placeholder: p.lang === 'pl' ? 'Np. motywacja, siła, trening, nigdy się nie poddawaj' : 'E.g. lift, drive, destroy. Night highway and heavy sub bass.', value: ui.text || '', oninput: (e) => { ui.text = e.target.value; } });
      root.appendChild(h('div', { class: 'compose' }, h('span', { class: 'flabel' }, 'Twój pomysł'), ta,
        AI.hasKey()
          ? h('button', { class: 'btn ai big', onclick: () => runOwn(true) }, icon('spark', 20), 'Rozwiń pomysł (Gemini)')
          : h('button', { class: 'btn big', onclick: () => runOwn(false) }, icon('check', 20), 'Oceń pomysł'),
        AI.hasKey() ? h('button', { class: 'btn ghost sm', onclick: () => runOwn(false) }, 'Tylko oceń, bez Gemini') : null));
    } else {
      root.appendChild(h('div', { class: 'compose' }, h('p', { class: 'muted' }, 'Propozycje z danych kanału: gałąź stylu, która działa, i symbole, których jeszcze nie użyłeś.'),
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn', onclick: () => runSurprise(false) }, icon('refresh', 18), ui.ideas && ui.ideas.length ? 'Inne propozycje' : 'Wylosuj pomysły'),
          AI.hasKey() ? h('button', { class: 'btn ai', onclick: () => runSurprise(true) }, icon('spark', 18), 'Od Gemini') : null)));
    }
    root.appendChild(out);
    if (ui.result) out.appendChild(resultView(ui.result));
    else if (ui.ideaMode === 'surprise' && !ui.ideas) setTimeout(() => runSurprise(false), 30);
    if (ui.ideaMode === 'surprise' && ui.ideas && !ui.result) out.appendChild(h('div', { class: 'ideas' }, ui.ideas.map(ideaCard)));
    return root;
  }
  function busy(msg) { const o = $('#ideaOut'); if (o) { o.textContent = ''; o.appendChild(h('div', { class: 'busy' }, h('i'), msg || 'Pracuję…')); } }
  async function runSurprise(ai) {
    const p = App.profile(), ui = App.state.ui;
    ui.result = null;
    let ideas = E.suggest(p, App.songsOf(), 3);
    if (ai && AI.hasKey()) { busy('Gemini układa propozycje…'); try { ideas = await AI.ideas(p, '', App.songsOf()); } catch (e) { toast(e.message); } }
    ui.ideas = ideas; if (App.state.tab === 'ideas') UI.render();
  }
  async function runOwn(ai) {
    const p = App.profile(), ui = App.state.ui, text = (ui.text || '').trim();
    if (!text) return toast('Wpisz pomysł albo przejdź do „Zaskocz mnie”.');
    const sc = E.score(p, text, App.songsOf());
    let ideas = [E.fromText(p, text)].concat(E.suggest(p, App.songsOf(), 2));
    if (ai && AI.hasKey()) { busy('Gemini rozwija pomysł…'); try { ideas = await AI.ideas(p, text, App.songsOf()); } catch (e) { toast(e.message); } }
    ui.result = { score: sc, ideas, ai: !!ai }; UI.render();
  }
  function fitRing(v) {
    const s = 92, r = 39, c = 2 * Math.PI * r, col = v >= 75 ? 'var(--good)' : v >= 50 ? 'var(--warn)' : 'var(--bad)';
    const el = h('div', { class: 'ring2', style: { '--rc': col }, html: '<svg viewBox="0 0 92 92"><circle class="tr" cx="46" cy="46" r="' + r + '"/><circle class="pr" cx="46" cy="46" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" transform="rotate(-90 46 46)"/></svg>' }, h('b', null, v + '%'));
    requestAnimationFrame(() => requestAnimationFrame(() => { const pr = el.querySelector('.pr'); if (pr) pr.style.strokeDashoffset = c * (1 - v / 100); }));
    return el;
  }
  function resultView(r) {
    const v = r.score.score, verdict = v >= 85 ? 'Świetne dopasowanie do DNA kanału' : v >= 70 ? 'Dobre dopasowanie do DNA kanału' : v >= 50 ? 'Częściowe dopasowanie. Popraw punkty z wykrzyknikiem.' : 'Słabe dopasowanie do kanału. Zobacz, co zmienić.';
    const first = r.ideas[0];
    return h('div', null,
      h('section', { class: 'card' }, h('h3', null, 'Ocena dopasowania'),
        h('div', { class: 'fit' }, fitRing(v), h('p', null, verdict)),
        h('h3', null, 'Dlaczego to zadziała?'),
        h('ul', { class: 'whyl' }, r.score.checks.map((c) => h('li', { class: c.ok ? 'ok' : 'no' }, h('span', { class: 'ci' }, icon(c.ok ? 'check' : 'warn', c.ok ? 14 : 20, 2.4)), h('span', null, c.x)))),
        h('p', { class: 'why' }, 'Ocena liczona w telefonie z DNA kanału, bez AI.')),
      h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('brain', 22, 1.6), h('h3', null, 'DNA Track: podobieństwo')),
        App.dna.simBox(App.dna.similar(App.profile(), { title: first ? first.title : '', text: (App.state.ui.text || '') + ' ' + (first ? first.premise || '' : ''), symbol: first && first.symbol }))),
      first ? h('button', { class: 'packbtn', onclick: () => openBuilder(first) }, h('span', { class: 'ib' }, icon('note', 22, 1.8)), h('span', null, 'Gotowy pakiet Suno'), icon('chev', 18)) : null,
      h('h3', { class: 'sec' }, r.ai ? 'Wersje od Gemini' : 'Wersje dopasowane do kanału'),
      h('div', { class: 'ideas' }, r.ideas.map(ideaCard)));
  }
  function ideaCard(idea) {
    const p = App.profile(), v = E.variantOf(p, idea.branch), reasons = E.reasons(p, idea);
    return h('article', { class: 'idea' },
      h('h4', null, idea.title), h('p', { class: 'premise' }, idea.premise),
      h('div', { class: 'chips' }, idea.symbol ? h('span', { class: 'tag' }, idea.symbol) : null, v ? h('span', { class: 'tag' }, v.name) : null, idea.shout ? h('span', { class: 'tag' }, 'okrzyk: ' + idea.shout + '!') : null),
      h('details', null, h('summary', null, 'Dlaczego to powinno zadziałać'), h('ul', null, reasons.map((x) => h('li', null, x)))),
      h('button', { class: 'btn', onclick: () => openBuilder(idea) }, icon('note', 18), 'Zbuduj dla Suno'));
  }
  /* ---------- kreator Suno ---------- */
  function openBuilder(idea, forceOld) {
    if (!forceOld && AI.hasKey()) return openBuilderAI(idea);
    const p = App.profile();
    const st = { title: idea.title, variant: idea.branch && E.variantOf(p, idea.branch) ? idea.branch : (p.styleVariants[0] || {}).id, moods: [], clean: false,
      lyrics: E.skeleton(p, idea), style: '' };
    const avoid = E.styleAvoid(p); const roll = () => { const g = E.genStyle(p, avoid); st.base = g.style; st.moods = []; st.style = g.style; st.styleName = g.name; st.sig = g.sig; avoid.unshift(g.sig); };
    roll();
    const writeLyrics = async () => {
      if (st.busy) return; st.busy = true; if (st.rerender) st.rerender();
      try { st.lyrics = await AI.lyrics(p, Object.assign({}, idea, { title: st.title }), st.variant, st.clean); toast('Pełny tekst gotowy. Przeczytaj go uważnie.'); }
      catch (er) { toast(er.message); }
      st.busy = false; if (st.rerender) st.rerender();
    };
    st.rerender = openSheet('Pakiet dla Suno', (render) => {
      const styleTa = h('textarea', { rows: 7, value: st.style, oninput: (e) => { st.style = e.target.value; } });
      const lyrTa = h('textarea', { rows: 14, class: 'lyr', value: st.lyrics, oninput: (e) => { st.lyrics = e.target.value; scanBox(); } });
      const warn = h('div', { class: 'warnbox' });
      function scanBox() {
        const found = E.scan(st.lyrics); warn.textContent = '';
        if (found.length) {
          warn.appendChild(h('p', null, icon('shield', 18), 'Wulgaryzmy w ' + found.length + ' lini. Mogą ograniczyć reklamy, szczególnie na początku utworu.'));
          found.slice(0, 4).forEach((f) => warn.appendChild(h('p', { class: 'muted small' }, 'Linia ' + f.line + ': ' + f.text)));
          warn.appendChild(h('button', { class: 'btn ghost sm', onclick: () => { st.lyrics = E.clean(st.lyrics); lyrTa.value = st.lyrics; scanBox(); toast('Zamieniono na czystą wersję'); } }, 'Zamień na czystą wersję'));
        }
      }
      scanBox();
      const empty = /\[(Intro|Verse \d|Pre-Chorus|Bridge|Outro)\]\s*\n\s*\n/.test(st.lyrics);
      return h('div', { class: 'stack' },
        field('Tytuł', h('input', { value: st.title, oninput: (e) => { st.title = e.target.value; } }), h('span', { class: 'count' }, 'wklej w pole Song Title')),
        h('div', null, h('span', { class: 'flabel' }, 'Styl wylosowany pod ten kanał: ' + st.styleName), h('div', { class: 'row-btns' }, h('button', { class: 'btn', onclick: () => { roll(); render(); } }, icon('spark', 18), 'Losuj inny styl'))),
        h('div', null, h('span', { class: 'flabel' }, 'Albo wzorzec z kanału'), h('div', { class: 'chips' }, p.styleVariants.map((v) => chip(v.name, st.variant === v.id && st.styleName === v.name, () => { st.variant = v.id; st.styleName = v.name; st.sig = [v.name]; st.base = E.buildStyle(p, st.variant, []); st.moods = []; st.style = st.base; render(); })))),
        p.styleVariants.find((v) => v.id === st.variant) ? h('p', { class: 'muted small' }, p.styleVariants.find((v) => v.id === st.variant).note) : null,
        h('div', null, h('span', { class: 'flabel' }, 'Dopasuj brzmienie'), h('div', { class: 'chips' }, App.DATA.moods.map((m) => chip(m.n, st.moods.includes(m.id), () => { st.moods = st.moods.includes(m.id) ? st.moods.filter((x) => x !== m.id) : st.moods.concat(m.id); st.style = [st.base].concat(st.moods.map((id) => (App.DATA.moods.find((x) => x.id === id) || {}).en)).filter(Boolean).join(', '); render(); })))),
        field('Styl (Styles)', styleTa, [counter(styleTa, 1000), copyBtn(() => st.style, 'Styl')]),
        field('Tekst (Lyrics)', lyrTa, [counter(lyrTa, 5000), copyBtn(() => st.lyrics, 'Tekst')]),
        (empty || st.busy) ? h('div', { class: 'warnbox' }, h('p', null, icon('shield', 18), st.busy ? 'Piszę pełny tekst z nowymi zwrotkami…' : 'Zwrotki są puste. Suno powtórzy wtedy sam refren w kółko. Napisz pełny tekst przed wklejeniem do Suno.'),
          (!st.busy) ? (AI.hasKey() ? h('button', { class: 'btn', onclick: writeLyrics }, icon('spark', 18), 'Napisz pełny tekst') : h('button', { class: 'btn', onclick: () => copy(E.chatPrompt(p, Object.assign({}, idea, { title: st.title }), st.variant, st.clean), 'Prompt skopiowany. Wklej go do czatu AI i wklej tekst tutaj.') }, icon('copy', 18), 'Kopiuj prompt do czatu AI')) : null) : null,
        warn,
        h('div', { class: 'row-btns' },
          AI.hasKey() ? h('button', { class: 'btn', onclick: writeLyrics }, icon('spark', 18), 'Napisz tekst od nowa (Gemini)') : null,
          h('button', { class: 'btn ghost', onclick: () => copy(E.chatPrompt(p, Object.assign({}, idea, { title: st.title }), st.variant, st.clean), 'Prompt skopiowany. Wklej go do dowolnego czatu AI.') }, icon('copy', 18), 'Kopiuj prompt do czatu')),
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.clean, onchange: (e) => { st.clean = e.target.checked; } }), h('span', null, 'Czysta wersja bez wulgaryzmów w prompcie')),
        h('button', { class: 'btn big', onclick: () => {
          const s = { sunoVer: [{ at: Date.now(), label: st.styleName, styles: st.style }], lyricsVer: [{ at: Date.now(), text: st.lyrics, src: 'szkic' }], history: [{ at: Date.now(), x: 'Utworzony z pomysłu „' + idea.title + '”' }], id: App.uid('song'), profileId: p.id, title: st.title, premise: idea.premise, variantId: st.variant, styleName: st.styleName, styleSig: st.sig, style: st.style, lyrics: st.lyrics, symbol: idea.symbol, scenes: idea.scenes || [], status: 'suno', created: Date.now(), checks: {}, results: {} };
          App.state.songs.push(s); s.step = 1; App.save(); closeSheet(); App.state.ui = {}; UI.go('songs'); setTimeout(() => App.wizard.open(s.id, 1), 260);
        } }, 'Zapisz utwór'));
    });
    if (AI.hasKey() && /\[(Verse 1)\]\s*\n\s*\n/.test(st.lyrics)) setTimeout(writeLyrics, 150);
  }

  /* kreator z Gemini: od razu pełny pakiet (style, wykluczenia, suwaki, cały tekst) */
  function openBuilderAI(idea) {
    const p = App.profile(), st = { title: idea.title, pack: null, vi: 0, busy: false, err: '', clean: false };
    const run = async () => {
      st.busy = true; st.err = ''; if (st.rerender) st.rerender();
      try { st.pack = await App.gen.channelPack(p, Object.assign({}, idea, { title: st.title }), { clean: st.clean }); st.title = st.pack.title || st.title; st.vi = 0; }
      catch (e) { st.err = e.message || 'Błąd'; }
      st.busy = false; if (st.rerender) st.rerender();
    };
    st.rerender = openSheet('Pakiet dla Suno', (render) => {
      const pk = st.pack, v = pk ? pk.variants[Math.min(st.vi, pk.variants.length - 1)] : null;
      const fld = (label, val, rows, extra) => h('label', { class: 'field' }, h('span', { class: 'flabel' }, label, extra || null, copyBtn(() => val, label)), h('textarea', { rows, readonly: 'true', value: val }));
      if (st.busy) return h('div', { class: 'stack' }, h('div', { class: 'okbox' }, h('b', null, 'Gemini pisze pełny pakiet: '), 'styl w trzech wariantach, wykluczenia, suwaki i cały tekst ze zwrotkami. Zajmuje to od kilkunastu sekund do minuty.'));
      if (!pk) return h('div', { class: 'stack' }, st.err ? h('div', { class: 'warnbox' }, h('p', null, st.err)) : null,
        h('button', { class: 'btn big', onclick: run }, icon('spark', 18), 'Wygeneruj pakiet'),
        h('button', { class: 'btn ghost', onclick: () => { closeSheet(); setTimeout(() => openBuilder(idea, true), 280); } }, 'Użyj prostego szkicu (bez Gemini)'));
      const all = () => 'Title: ' + st.title + '\n\nStyles:\n' + v.styles + '\n\nExclude styles:\n' + v.exclude + '\n\nLyrics:\n' + pk.lyrics + '\n\nWeirdness: ' + v.weirdness + '%  ·  Style Influence: ' + v.influence + '%';
      const found = E.scan(pk.lyrics);
      return h('div', { class: 'stack' },
        h('p', { class: 'muted small' }, 'W Suno wybierz Create → Custom i wklej pola poniżej (kropka obok nazwy kopiuje). Zacznij od wariantu „Główny”.'),
        field('Tytuł (Song Title)', h('input', { value: st.title, oninput: (e) => { st.title = e.target.value; } }), copyBtn(() => st.title, 'Tytuł')),
        h('div', { class: 'chips' }, pk.variants.map((x, i) => chip(x.label, i === st.vi, () => { st.vi = i; render(); }))),
        fld('Styl (Styles)', v.styles, 6, h('span', { class: 'count' }, v.styles.length + ' / 1000')),
        fld('Wyklucz (Exclude styles)', v.exclude, 2),
        h('div', { class: 'okbox' }, h('b', null, 'Suwaki w Suno: '), 'Weirdness ' + v.weirdness + '%, Style Influence ' + v.influence + '%.' + (pk.tip ? ' ' + pk.tip : '')),
        fld('Tekst (Lyrics)', pk.lyrics, 16, h('span', { class: 'count' }, pk.lyrics.length + ' / 5000')),
        App.dna.simBox(App.dna.similar(p, { title: st.title, lyrics: pk.lyrics, style: v.styles, symbol: idea.symbol })),
        found.length ? h('div', { class: 'warnbox' }, h('p', null, icon('shield', 18), 'Wulgaryzmy w ' + found.length + ' lini. Mogą ograniczyć reklamy.'), h('button', { class: 'btn ghost sm', onclick: () => { pk.lyrics = E.clean(pk.lyrics); render(); toast('Zamieniono na czystą wersję'); } }, 'Zamień na czystą wersję')) : null,
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.clean, onchange: (e) => { st.clean = e.target.checked; } }), h('span', null, 'Czysta wersja bez wulgaryzmów (przy kolejnym generowaniu)')),
        h('div', { class: 'row-btns' }, h('button', { class: 'btn', onclick: run }, icon('refresh', 18), 'Wygeneruj ponownie'), h('button', { class: 'btn ghost', onclick: () => copy(all(), 'Wszystko skopiowane') }, icon('copy', 18), 'Kopiuj wszystko')),
        h('button', { class: 'btn big', onclick: () => {
          const sunoVer = pk.variants.map((x) => ({ at: Date.now(), label: x.label, styles: x.styles, exclude: x.exclude, weirdness: x.weirdness, influence: x.influence }));
          const s = { sunoVer, lyricsVer: [{ at: Date.now(), text: pk.lyrics, src: 'Gemini' }], history: [{ at: Date.now(), x: 'Utworzony z pomysłu „' + idea.title + '” (pakiet Gemini, wariant ' + v.label + ')' }], id: App.uid('song'), profileId: p.id, title: st.title, premise: idea.premise, variantId: idea.branch || (p.styleVariants[0] || {}).id, styleName: (E.variantOf(p, idea.branch) || {}).name || v.styles.split(',')[0], styleSig: v.styles.split(',').slice(0, 5).map((x) => x.trim()), style: v.styles, exclude: v.exclude, weirdness: v.weirdness, influence: v.influence, tip: pk.tip, lyrics: pk.lyrics, symbol: idea.symbol, scenes: idea.scenes || [], status: 'suno', created: Date.now(), checks: {}, results: {} };
          App.state.songs.push(s); s.step = 1; App.save(); closeSheet(); App.state.ui = {}; UI.go('songs'); setTimeout(() => App.wizard.open(s.id, 1), 260);
        } }, 'Zapisz utwór i prowadź dalej'));
    });
    setTimeout(run, 60);
  }


  /* ================= UTWORY ================= */
  /* kontrola, czy publikacja nie trafia do złego kanału (język tytułu i tekstu) */
  App.channelCheck = function (s) {
    const p = App.profile(s.profileId), out = [], txt = ((s.title || '') + '\n' + (s.lyrics || '')).replace(/\[[^\]]*\]/g, ' ');
    const pl = (txt.match(/[ąćęłńóśźż]/gi) || []).length, words = txt.toLowerCase().match(/[a-ząćęłńóśźż']+/g) || [];
    const en = words.filter((w) => /^(the|you|your|my|and|i'm|i|we|in|on|of|to|it|is|are|me|this|that|with|for|no|not|never|all|up|down|like)$/.test(w)).length;
    const plw = words.filter((w) => /^(i|nie|się|jak|to|na|w|z|że|mnie|mój|moja|jest|tak|już|tylko|dla|do|po|bo|ten|ta)$/.test(w)).length;
    if (p.lang === 'en' && (pl >= 3 || plw > en + 3)) out.push('Tytuł lub tekst wygląda na polski, a kanał ' + p.name + ' jest po angielsku. Sprawdź, czy to właściwy kanał.');
    if (p.lang === 'pl' && words.length > 20 && pl === 0 && en > plw + 3) out.push('Tekst wygląda na angielski, a kanał ' + p.name + ' jest po polsku. Sprawdź, czy to właściwy kanał.');
    App.state.profiles.forEach((o) => { if (o.id !== p.id && o.name && txt.toLowerCase().includes(o.name.toLowerCase())) out.push('W tytule lub tekście jest nazwa innego kanału („' + o.name + '”).'); });
    return out;
  };
  /* gotowość wydania: jedna kratka na każdy element */
  App.readiness = function (s) {
    const p = App.profile(s.profileId), c = s.checks || {}, yt = s.yt || {}, rn = s.rendered || {}, r = s.results || {}, r28 = s.results28 || {};
    const mr = s.master && s.master.m && App.master ? App.master.report(s.master.m, p) : null;
    const pubT = s.publishAt ? new Date(s.publishAt).getTime() : 0, age = pubT ? (Date.now() - pubT) / 864e5 : -1;
    const cell = (k, ic, st) => ({ k, ic, st });
    return [
      cell('Termin', 'clock', s.publishAt ? 'ok' : 'warn'),
      cell('Plik mp3', 'note', s.mp3 ? 'ok' : ''),
      cell('Jakość', 'shield', mr ? (mr.bad ? 'bad' : mr.warn > 2 ? 'warn' : 'ok') : ''),
      cell('Teledysk', 'film', rn.full || c.video ? 'ok' : ''),
      cell('Miniatura', 'playbox', s.thumbDone || (yt.full && !s.thumbErr) ? 'ok' : ''),
      cell('Opis', 'copy', c.copy || yt.full ? 'ok' : ''),
      cell('Shorty', 'flash', c.sh1 && c.sh2 ? 'ok' : (rn.short || c.sh1) ? 'warn' : ''),
      cell('Wysłany', 'upload', yt.full || c.upload ? 'ok' : (pubT && age > 0 ? 'bad' : '')),
      cell('Playlista', 'notes', c.pl1 ? 'ok' : ''),
      cell('Po premierze', 'check', c.pin && c.cm ? 'ok' : (c.pin || c.cm) ? 'warn' : ''),
      cell('Wyniki 7 dni', 'chart', r.views ? 'ok' : age >= 7 ? 'warn' : ''),
      cell('Wyniki 28 dni', 'chart', r28.views ? 'ok' : age >= 28 ? 'warn' : '')
    ];
  };
  function releaseControl(p) {
    const list = App.songsOf(p.id).filter((s) => !(s.results28 && s.results28.views)).sort((a, b) => (a.publishAt ? new Date(a.publishAt).getTime() : 9e15) - (b.publishAt ? new Date(b.publishAt).getTime() : 9e15) || b.created - a.created).slice(0, 6);
    if (!list.length) return null;
    return h('section', { class: 'block' }, h('h3', null, 'Centrum premier'),
      h('div', { class: 'rc' }, list.map((s) => {
        const cells = App.readiness(s), ok = cells.filter((x) => x.st === 'ok').length, warns = App.channelCheck(s);
        return h('div', { class: 'rc-item' + (warns.length ? ' alert' : ''), onclick: () => openSongDetails(s.id) },
          h('div', { class: 'rc-top' }, ring(ok, cells.length, 46), h('div', { class: 'row-m' }, h('b', null, s.title || 'Bez tytułu'), h('span', { class: 'muted small' }, p.name + ' · ' + (s.publishAt ? 'premiera ' + App.fmtDT(s.publishAt) : 'bez terminu'))), icon('chev', 18)),
          h('div', { class: 'rc-grid' }, cells.map((x) => h('div', { class: 'rc-c ' + x.st }, icon(x.st === 'ok' ? 'check' : x.st === 'bad' ? 'warn' : x.ic, 18, 2), h('span', null, x.k)))),
          warns.map((w) => h('p', { class: 'rc-warn' }, icon('warn', 16, 2), h('span', null, w))));
      })));
  }
  const stPill = (s) => { const st = s.status || 'szkic'; return h('span', { class: 'st-pill' + (st === 'opublikowany' ? ' ok' : st === 'gotowy' || st === 'suno' ? ' go' : '') }, st); };
  function renderSongs() {
    const p = App.profile(), songs = App.songsOf().sort((a, b) => b.created - a.created);
    const root = h('div', { class: 'screen' });
    root.appendChild(topbar('Utwory', p.name, h('button', { class: 'act', 'aria-label': 'Dodaj utwór', onclick: () => { const s = { id: App.uid('song'), profileId: p.id, title: '', premise: '', variantId: (p.styleVariants[0] || {}).id, lyrics: '', status: 'szkic', created: Date.now(), checks: {}, results: {}, scenes: [] }; App.state.songs.push(s); App.save(); openSong(s.id); } }, icon('plus', 26, 2))));
    root.appendChild(h('div', { class: 'duo' },
      h('button', { class: 'tile a', style: { minHeight: '84px' }, onclick: () => { App.state.ui = { ideaMode: 'own' }; UI.go('ideas'); } }, icon('bulb', 28, 1.6), 'Nowy pomysł'),
      h('button', { class: 'tile b', style: { minHeight: '84px' }, onclick: () => App.own.open() }, icon('note', 28, 1.8), 'Mam gotowy utwór')));
    if (!songs.length) root.appendChild(h('div', { class: 'emptystate' }, h('b', null, 'Brak utworów w tym kanale'), h('p', null, 'Zacznij od pomysłu albo wgraj utwór, który już masz.')));
    else { const rc = releaseControl(p); if (rc) root.appendChild(rc); root.appendChild(h('h3', { class: 'sec', style: { padding: '0 16px' } }, 'Wszystkie utwory')); }
    if (songs.length) root.appendChild(h('div', { class: 'list' }, songs.map((s) => {
      const r = release(p, s), done = r.items.filter((i) => i.done).length, st = App.wizard.stepOf(s);
      return h('button', { class: 'row link', onclick: () => openSong(s.id) },
        ring(done, r.items.length, 46),
        h('div', { class: 'row-m' }, h('b', null, s.title || 'Bez tytułu'),
          h('span', { class: 'muted small' }, 'Krok ' + st + ': ' + App.wizard.steps[st - 1].n + (s.publishAt ? ' · premiera ' + App.fmtDT(s.publishAt) : '')),
          h('span', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, stPill(s), s.audioSaved ? h('span', { class: 'st-pill' }, 'mp3 zapisane') : null, s.results && s.results.views ? h('span', { class: 'muted small' }, s.results.views + ' wyśw.') : null)),
        icon('chev', 18));
    })));
    return root;
  }

  function openSong(id) { App.wizard.open(id); }
  function duplicate(s) {
    const c = App.clone(s);
    Object.assign(c, { id: App.uid('song'), title: (s.title || 'Utwór') + ' (kopia)', created: Date.now(), status: 'szkic', publishAt: '', checks: {}, results: {}, done: {}, step: 1, mp3: '', audioSaved: false, caps: null, yt: null, rendered: null, master: null, results28: {}, thumbDone: false, lyricsVer: [], history: [{ at: Date.now(), x: 'Utworzony jako kopia „' + (s.title || '') + '”' }] });
    App.state.songs.push(c); App.save(); return c;
  }
  function openSongDetails(id) {
    const s = App.song(id); if (!s) return;
    const p = App.profile(s.profileId);
    if (p.id !== App.state.activeProfile) { App.state.activeProfile = p.id; UI.applyTheme(); }
    openSheet(s.title || 'Nowy utwór', (render) => {
      const pack = E.publish(p, s);
      const save = () => App.save();
      const r = release(p, s), done = r.items.filter((i) => i.done).length;
      const before = s.lyrics || '';
      const lyr = h('textarea', { rows: 8, class: 'lyr', placeholder: 'Wklej tekst piosenki (z Suno)', value: s.lyrics || '', oninput: (e) => { s.lyrics = e.target.value; save(); }, onchange: () => { if (before && before !== s.lyrics) { s.lyricsVer = (s.lyricsVer || []).concat({ at: Date.now(), text: before, src: 'przed edycją' }).slice(-12); s.history = (s.history || []).concat({ at: Date.now(), x: 'Zmieniono tekst' }); save(); } } });
      const warns = App.channelCheck(s), M = App.studio.mem(s.id);
      const desc = h('textarea', { rows: 11, value: pack.description });
      const row = (txt) => h('div', { class: 'cp' }, h('span', null, txt), copyBtn(txt));
      const pub = s.publishAt ? App.toLocalInput(new Date(s.publishAt)) : App.toLocalInput(App.nextAt(p.publish.time));
      return h('div', { class: 'stack' },
        h('div', { class: 'sum' }, ring(done, r.items.length, 64), h('div', null, h('b', null, done === r.items.length ? 'Wydanie zakończone' : 'Do zrobienia: ' + (r.items.length - done)), h('p', { class: 'muted small' }, 'Kanał: ' + p.name + (s.mp3 ? ' · plik: ' + s.mp3 + (s.audioSaved ? ' (zapisany w telefonie)' : '') : '')))),
        warns.length ? h('div', { class: 'warnbox' }, warns.map((w) => h('p', null, icon('warn', 18), w))) : null,
        (s.lyrics || s.style) ? (function () { const sim = App.dna.similar(p, { title: s.title, lyrics: s.lyrics, style: s.style, symbol: s.symbol, bpm: s.bpm }, s.id); return sim.level === 'ok' ? null : App.dna.simBox(sim); })() : null,
        h('div', { class: 'rc-grid' }, App.readiness(s).map((x) => h('div', { class: 'rc-c ' + x.st }, icon(x.st === 'ok' ? 'check' : x.st === 'bad' ? 'warn' : x.ic, 18, 2), h('span', null, x.k)))),
        field('Tytuł', h('input', { value: s.title || '', oninput: (e) => { s.title = e.target.value; save(); } })),
        h('div', null, h('span', { class: 'flabel' }, 'Kanał'), h('div', { class: 'chips' }, App.state.profiles.map((o) => chip(o.name, s.profileId === o.id, () => { if (s.profileId === o.id) return; if (confirm('Przenieść utwór do kanału ' + o.name + '?')) { s.profileId = o.id; s.history = (s.history || []).concat({ at: Date.now(), x: 'Przeniesiono do kanału ' + o.name }); App.state.activeProfile = o.id; save(); UI.applyTheme(); render(); } })))),
        h('div', null, h('span', { class: 'flabel' }, 'Status'), h('div', { class: 'chips' }, ['szkic', 'suno', 'gotowy', 'opublikowany'].map((x) => chip(x, s.status === x, () => { s.status = x; save(); render(); })))),
        field('Premiera', h('input', { type: 'datetime-local', value: pub, onchange: (e) => { s.publishAt = e.target.value ? new Date(e.target.value).toISOString() : ''; save(); render(); } })),
        field('Tekst', lyr, copyBtn(() => s.lyrics, 'Tekst')),
        (s.lyricsVer && s.lyricsVer.length) ? h('details', { class: 'phase' }, h('summary', null, h('b', null, 'Wersje tekstu'), h('span', { class: 'muted small' }, s.lyricsVer.length + ' zapisanych')),
          h('ul', { class: 'vers' }, s.lyricsVer.slice().reverse().map((v) => h('li', null, h('span', null, App.fmtDT(new Date(v.at).toISOString()) + ' · ' + v.src + ' · ' + v.text.split('\n').filter(Boolean).length + ' linii'), h('button', { class: 'btn ghost sm', onclick: () => { if (!confirm('Przywrócić tę wersję tekstu? Obecna zostanie zapisana jako wersja.')) return; s.lyricsVer.push({ at: Date.now(), text: s.lyrics || '', src: 'przed przywróceniem' }); s.lyrics = v.text; save(); render(); } }, 'Przywróć'))))) : null,
        (s.style || (s.sunoVer && s.sunoVer.length)) ? h('details', { class: 'phase' }, h('summary', null, h('b', null, 'Parametry Suno'), h('span', { class: 'muted small' }, s.weirdness ? 'W ' + s.weirdness + '% · SI ' + s.influence + '%' : 'styl')),
          h('div', { class: 'stack', style: { padding: '6px 0 12px' } },
            s.style ? h('div', { class: 'cp' }, h('span', { class: 'small' }, s.style), copyBtn(s.style, 'Styl')) : null,
            s.exclude ? h('div', { class: 'cp' }, h('span', { class: 'small' }, 'Exclude: ' + s.exclude), copyBtn(s.exclude, 'Exclude')) : null,
            (s.sunoVer || []).length > 1 ? h('ul', { class: 'vers' }, s.sunoVer.slice().reverse().map((v) => h('li', null, h('span', null, App.fmtDT(new Date(v.at).toISOString()) + ' · ' + (v.label || 'wersja')), copyBtn(v.styles, 'Styl')))) : null)) : null,
        h('details', { class: 'phase', open: !!(s.master && s.master.m) }, h('summary', null, h('b', null, 'Audio Master Check'), h('span', { class: 'muted small' }, s.master && s.master.m ? App.master.report(s.master.m, p).verdict : 'nie sprawdzono')),
          h('div', { style: { padding: '6px 0 12px' } }, (!M.an && s.mp3 && !M.restoreTried) ? (setTimeout(() => App.studio.restore(s.id, render), 30), h('p', { class: 'muted small' }, 'Wczytuję zapisany plik…')) : App.master.view(s.id, render))),
        field('Początek refrenu (mm:ss)', h('input', { value: s.chorusStart || '', placeholder: '0:48', inputmode: 'numeric', oninput: (e) => { s.chorusStart = e.target.value; s.chorusAuto = false; save(); } })),
        h('button', { class: 'btn ghost', onclick: render }, icon('refresh', 18), 'Odśwież pakiet po zmianach'),

        h('h3', { class: 'sec' }, 'Pakiet publikacji'),
        h('p', { class: 'flabel' }, 'Tytuł filmu'), h('div', { class: 'cps' }, pack.titles.map((t) => row(t))),
        h('p', { class: 'flabel' }, 'Opis'), desc,
        h('div', { class: 'row-btns' }, h('button', { class: 'btn', onclick: () => copy(desc.value, 'Opis skopiowany') }, icon('copy', 18), 'Kopiuj opis'),
          AI.hasKey() ? h('button', { class: 'btn ghost', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; try { desc.value = await AI.refinePack(p, s, pack); toast('Opis ulepszony'); } catch (er) { toast(er.message); } b.disabled = false; } }, icon('spark', 18), 'Ulepsz (Gemini)') : null),
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: !!s.includeLyrics, onchange: (e) => { s.includeLyrics = e.target.checked; save(); render(); } }), h('span', null, 'Dołącz tekst piosenki do opisu')),
        h('p', { class: 'flabel' }, 'Hashtagi (trzy pierwsze widać nad tytułem)'), row(pack.hashtags),
        h('p', { class: 'flabel' }, 'Tagi'), row(pack.tags.join(', ')),
        h('p', { class: 'flabel' }, 'Przypięty komentarz'), row(pack.pinned),
        h('p', { class: 'flabel' }, 'Shorty: hooki z tekstu'), pack.hooks.length ? h('div', { class: 'cps' }, pack.hooks.slice(0, 3).map((x, i) => row(pack.shortTitles[i] || x))) : h('p', { class: 'muted small' }, 'Wklej tekst, a znajdę powtarzające się linie na hooki.'),
        h('p', { class: 'flabel' }, 'Wydanie'), h('ul', { class: 'sched' }, r.items.slice(1).map((i) => h('li', null, h('span', null, i.x), h('b', null, App.fmtDT(i.at.toISOString()))))),
        h('button', { class: 'btn big', onclick: () => { closeSheet(true); App.wizard.open(s.id); } }, icon('film', 18), 'Prowadź mnie krok po kroku'),

        h('h3', { class: 'sec' }, 'Checklista'),
        h('ul', { class: 'todo' }, E.checklist(p, s).map((c) => h('li', null, h('button', { class: 'cb' + ((s.checks || {})[c.id] ? ' on' : ''), role: 'checkbox', 'aria-checked': (s.checks || {})[c.id] ? 'true' : 'false', onclick: () => { s.checks = s.checks || {}; s.checks[c.id] = !s.checks[c.id]; save(); render(); } }, icon('check', 15, 2.6), h('span', null, c.x))))),

        h('h3', { class: 'sec' }, 'Wyniki po 7 dniach'),
        h('div', { class: 'grid3' }, [['views', 'Wyświetlenia'], ['subs', 'Subskrypcje'], ['avp', 'Obejrzenie %']].map((f) => field(f[1], h('input', { type: 'number', inputmode: 'decimal', value: (s.results || {})[f[0]] || '', oninput: (e) => { s.results = s.results || {}; s.results[f[0]] = e.target.value; save(); } })))),
        h('h3', { class: 'sec' }, 'Wyniki po 28 dniach'),
        h('div', { class: 'grid3' }, [['views', 'Wyświetlenia'], ['subs', 'Subskrypcje'], ['avp', 'Obejrzenie %']].map((f) => field(f[1], h('input', { type: 'number', inputmode: 'decimal', value: (s.results28 || {})[f[0]] || '', oninput: (e) => { s.results28 = s.results28 || {}; s.results28[f[0]] = e.target.value; save(); } })))),
        s.yt && s.yt.full ? h('p', { class: 'muted small' }, 'Film jest połączony z YouTube, więc wyniki 7 i 28 dni wpiszą się same przy „Pobierz dane” w Wynikach.') : null,
        (s.history && s.history.length) ? h('div', null, h('h3', { class: 'sec' }, 'Historia'), h('ul', { class: 'sched' }, s.history.slice(-8).reverse().map((x) => h('li', null, h('span', null, x.x), h('b', null, App.fmtDT(new Date(x.at).toISOString())))))) : null,
        h('button', { class: 'btn ghost', onclick: () => { const c = duplicate(s); closeSheet(true); toast('Utworzono kopię projektu'); UI.go('songs'); setTimeout(() => openSongDetails(c.id), 300); } }, icon('dup', 18), 'Duplikuj jako nowy utwór'),
        h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Usunąć ten utwór razem z zapisanym plikiem mp3?')) { App.state.songs = App.state.songs.filter((x) => x.id !== s.id); if (App.db) App.db.dropAudio(s.id); save(); closeSheet(); UI.render(); } } }, icon('trash', 18), 'Usuń utwór'));
    }, { onClose: () => { App.save(); UI.render(); } });
  }
  UI.openSong = openSong;
  UI.openSongDetails = openSongDetails;
  UI.copy = copy;
  UI.kit = { openSheet, closeSheet, field, chip, copyBtn };
  UI.release = release;

  /* ================= WYNIKI I ROZWÓJ ================= */
  function openAnalyticsImport(p) {
    openSheet('Eksport z YouTube Studio', () => {
      const fi = h('input', { type: 'file', multiple: true, accept: '.zip,.csv', onchange: async (e) => {
        const files = Array.from(e.target.files || []); if (!files.length) return;
        try { const b = await App.analytics.readFiles(files); const a = App.analytics.compute(b); App.analytics.apply(p, a); toast('Zaimportowano ' + a.videos.length + ' filmów' + (a.daily ? ' i ' + a.daily.length + ' dni' : '')); closeSheet(); UI.render(); }
        catch (er) { toast(er.message || 'Nie udało się odczytać plików'); }
      } });
      const a = p.analytics;
      return h('div', { class: 'stack' },
        h('p', { class: 'muted' }, 'Zapasowa droga, gdy nie chcesz łączyć YouTube. W Studio na komputerze: Analityka → Tryb zaawansowany → zakres „Cały czas” → strzałka w dół → Plik CSV. Zrób to dla zakładek Treść (wymagana), Źródło ruchu, Region, Płeć i Wiek. Wybierz pobrane pliki naraz.'),
        a ? h('p', { class: 'hint' }, 'Ostatni import: ' + App.fmtDT(new Date(a.at).toISOString()) + ', ' + a.videos.length + ' filmów.') : null,
        h('label', { class: 'btn big filebtn' }, icon('plus', 18), 'Wybierz pliki ze Studio', fi),
        h('p', { class: 'muted small' }, 'Dane zostają w tym telefonie.'));
    });
  }
  function openYtHelp() {
    openSheet('Jak połączyć YouTube', () => h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Robisz to raz. Używamy tego samego projektu Google, przez który aplikacja wysyła filmy. Wszystko jest darmowe.'),
      h('ol', { class: 'wz-ol' },
        h('li', null, 'W Safari otwórz console.cloud.google.com i zaloguj się na konto Google, na którym są oba kanały.'),
        h('li', null, 'U góry, obok logo Google Cloud, dotknij nazwy projektu i wybierz ten sam projekt co przy wysyłce filmów.'),
        h('li', null, 'Dotknij menu (trzy kreski) → „Interfejsy API i usługi” → „Biblioteka”.'),
        h('li', null, 'W polu wyszukiwania wpisz: YouTube Analytics API. Dotknij wyniku „YouTube Analytics API”.'),
        h('li', null, 'Dotknij niebieskiego przycisku „Włącz”. Poczekaj, aż strona się przeładuje.'),
        h('li', null, 'Wróć do Rezonansu → Wyniki → „Połącz z YouTube”. W oknie Google wybierz konto, potem kanał, którego dane chcesz (np. Warhead Bass).'),
        h('li', null, 'Google pokaże ostrzeżenie „Aplikacja nie została zweryfikowana”. To normalne dla Twojego prywatnego projektu: dotknij „Zaawansowane”, potem „Przejdź do …”, i zaznacz oba uprawnienia (tylko odczyt).'),
        h('li', null, 'Drugi kanał łączysz tak samo: przełącz kanał w aplikacji (na ekranie Dziś) i w Wynikach dotknij „Połącz z YouTube”.')),
      h('div', { class: 'infobox' }, 'Uprawnienia są tylko do odczytu: statystyki i lista filmów. Aplikacja nie może nic zmienić na kanale tą drogą. Dane zostają w telefonie.')), { icon: 'link' });
  }

  function chartSvg(series, key) {
    const W = 340, H = 150, P = 6, vals = series.map((x) => +x[key] || 0), max = Math.max(1, ...vals), min = 0;
    const nice = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v))); const m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };
    const top = nice(max), X = (i) => P + (W - 2 * P) * (series.length > 1 ? i / (series.length - 1) : 0.5), Y = (v) => H - 14 - (H - 26) * (v - min) / (top - min);
    const pts = vals.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1));
    let g = '<defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".55"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>';
    for (let k = 0; k <= 4; k++) { const v = top * k / 4, y = Y(v).toFixed(1); g += '<line class="gl" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>' + (k ? '<text class="yl" x="2" y="' + (+y - 3) + '">' + fmt(v) + '</text>' : ''); }
    g += '<polygon fill="url(#ar)" points="' + X(0).toFixed(1) + ',' + Y(0) + ' ' + pts.join(' ') + ' ' + X(vals.length - 1).toFixed(1) + ',' + Y(0) + '"/>';
    g += '<polyline class="ln" points="' + pts.join(' ') + '"/>';
    if (series.length <= 31) vals.forEach((v, i) => { g += '<circle class="dt" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (i === vals.length - 1 ? 4.5 : 3.2) + '"/>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Wykres wyświetleń dziennie">' + g + '</svg>';
  }
  const dShort = (iso) => { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }); };
  function delta(cur, prev, kind) {
    if (prev == null || cur == null) return h('i', null, 'brak porównania');
    if (kind === 'pp') { const d = cur - prev; return h('i', { class: d > 0.05 ? 'up' : d < -0.05 ? 'down' : '' }, (d >= 0 ? '↑ +' : '↓ ') + fmt1(d) + ' pp'); }
    if (!prev) return h('i', null, 'poprzednio 0');
    const d = (cur - prev) / Math.abs(prev) * 100;
    return h('i', { class: d > 0.5 ? 'up' : d < -0.5 ? 'down' : '' }, (d >= 0 ? '↑ +' : '↓ ') + Math.round(d) + '%');
  }

  /* wnioski liczone lokalnie z danych dziennych, filmów i wyników utworów */
  function localInsights(p, per) {
    const out = [], songs = App.songsOf(p.id);
    if (per) {
      const c = per.cur, pv = per.prev, nDays = per.series.length;
      const conf = (n) => (n >= 60 ? 'średnia' : n >= 21 ? 'niska do średniej' : 'niska');
      if (pv && pv.views >= 50) { const d = (c.views - pv.views) / pv.views * 100; out.push({ t: d >= 0 ? 'good' : 'warn', x: 'Wyświetlenia ' + (d >= 0 ? 'wzrosły' : 'spadły') + ' o ' + Math.abs(Math.round(d)) + '% względem poprzednich ' + per.n + ' dni.', c: 'Źródło: ' + per.src + ', ' + nDays + ' dni. Pewność: ' + conf(nDays) + '. To opis zmiany, nie jej przyczyna.' }); }
      if (c.ctr != null && pv && pv.ctr != null && c.impr >= 500) { const d = c.ctr - pv.ctr; if (Math.abs(d) >= 0.5) out.push({ t: d > 0 ? 'good' : 'warn', x: 'Klikalność miniatur ' + (d > 0 ? 'wyższa' : 'niższa') + ' o ' + fmt1(Math.abs(d)) + ' pp (' + fmt1(c.ctr) + '%).' + (d < 0 ? ' Sprawdź tytuły i miniatury ostatnich filmów.' : ''), c: 'Źródło: ' + per.src + ', ' + fmt(c.impr) + ' wyświetleń miniatur.' }); }
      const vids = (p.yt && p.yt.videos) || [];
      if (vids.length >= 3) { const top = vids[0]; const share = top.views / vids.reduce((s, v) => s + (+v.views || 0), 0) * 100; if (share > 40) out.push({ t: 'info', x: 'Jeden film daje ' + Math.round(share) + '% wyświetleń z 180 dni. Sprawdź, co go wyróżnia (tytuł, początek, miniatura), i powtórz to w kolejnym.', c: 'Źródło: YouTube Analytics, ' + vids.length + ' filmów.' }); }
    }
    const rated = songs.filter((s) => s.results && Number(s.results.views) > 0);
    const learn = E.learn(p, songs);
    if (learn && learn.length >= 2 && learn[0].n >= 2) out.push({ t: 'good', x: 'Powtórz styl: ' + learn[0].name + ' (śr. ' + fmt(learn[0].avg) + ' wyśw.).', c: 'Na podstawie ' + rated.length + ' utworów z wynikami. Pewność niska: mała próba.' });
    (p.insights || []).slice(0, 5).forEach((i) => out.push({ t: i.t, x: i.x, c: p.analytics ? 'Źródło: eksport ze Studio z ' + App.fmtDT(new Date(p.analytics.at).toISOString()) + '.' : 'Źródło: dane startowe kanału.' }));
    return out.slice(0, 7);
  }

  function monetBlock(p, per) {
    const subs = +p.stats.subs || 0, hours = +p.stats.hours || 0;
    let fc = 'Za mało danych dziennych, żeby uczciwie prognozować.';
    const days = (p.yt && p.yt.days) || (p.analytics && p.analytics.daily);
    if (days && days.length >= 28) {
      const last = days.slice(-56), wk = []; for (let i = 0; i + 7 <= last.length; i += 7) wk.push(last.slice(i, i + 7).reduce((s, x) => s + (+x.subs || 0), 0));
      const mean = wk.reduce((a, b) => a + b, 0) / wk.length, sd = Math.sqrt(wk.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, wk.length - 1));
      const left = Math.max(0, 1000 - subs), lo = mean + sd, hi = Math.max(0.01, mean - sd);
      if (left === 0) fc = 'Próg subskrypcji osiągnięty.';
      else if (mean <= 0) fc = 'W ostatnich tygodniach subskrypcji netto nie przybywa. Prognoza nie ma sensu, dopóki to się nie zmieni.';
      else fc = 'Przy tempie z ostatnich ' + wk.length + ' tygodni (średnio ' + fmt1(mean) + ' subskrypcji tygodniowo, wahania ±' + fmt1(sd) + '): 1000 subskrypcji za ok. ' + fmt(left / lo) + '–' + (mean - sd > 0.05 ? fmt(left / hi) : 'wiele') + ' tygodni. To szacunek, nie obietnica.';
    }
    return h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('target', 24, 1.6), h('h3', null, 'Droga do monetyzacji')),
      meter('Subskrypcje', fmt(subs) + ' z 1000', Math.min(100, subs / 10)),
      meter('Godziny oglądania (12 mies., długie filmy)', fmt1(hours) + ' z 4000', Math.min(100, hours / 40)),
      p.yt && p.yt.hoursAll ? h('p', { class: 'muted small' }, 'Godziny obejmują też Shorty (YouTube nie rozdzielił typów treści), więc realny wynik jest niższy.') : null,
      h('p', { class: 'muted small' }, fc),
      h('p', { class: 'muted small', style: { marginTop: '6px' } }, 'Aktualne progi sprawdzisz w Studio → Zarabianie. YouTube je zmienia.'));
  }
  function meter(l, v, pct) {
    return h('div', { class: 'meter' }, h('div', { class: 'mh' }, h('span', null, l), h('b', null, v)), h('div', { class: 'mt' }, h('i', { style: { width: Math.max(1.5, pct) + '%' } })));
  }
  function guideBlock(p) {
    const g = App.analytics.guide(p), ph = g.phase, done = (p.guideDone = p.guideDone || {});
    return h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('plan', 24, 1.6), h('h3', null, 'Przewodnik: ' + ph.n)),
      h('p', { class: 'muted small' }, ph.goal),
      h('ul', { class: 'ins', style: { margin: '8px 0' } }, g.recs.slice(0, 4).map((r) => h('li', { class: 'info' }, h('i', null, icon('chev', 14, 2.4)), h('span', null, r.x)))),
      h('div', { class: 'stack' }, App.analytics.phases.map((f) => h('details', { class: 'phase', open: f.id === ph.id },
        h('summary', null, h('b', null, f.n), h('span', { class: 'muted small' }, f.from + '–' + (f.to > 1e6 ? '∞' : f.to) + ' subskrypcji')),
        h('ul', { class: 'todo' }, f.steps.map((s) => h('li', null, h('button', { class: 'cb' + (done[s[0]] ? ' on' : ''), role: 'checkbox', 'aria-checked': done[s[0]] ? 'true' : 'false', onclick: () => { done[s[0]] = !done[s[0]]; App.save(); UI.render(); } }, icon('check', 15, 2.6), h('span', null, s[1])))))))));
  }

  function renderResults() {
    const p = App.profile(), ui = (App.state.ui = App.state.ui || {}), n = ui.rp || 7;
    const root = h('div', { class: 'screen' });
    const syncBtn = h('button', { class: 'act', 'aria-label': 'Pobierz dane z YouTube', onclick: () => sync() }, icon('refresh', 24, 1.8));
    root.appendChild(topbar('Wyniki i rozwój', p.name, syncBtn));
    const sync = async () => { syncBtn.disabled = true; toast('Zaloguj się i wybierz kanał: ' + p.name); try { await App.yta.sync(p); toast('Dane pobrane'); UI.render(); } catch (e) { toast(e.message); } syncBtn.disabled = false; };
    root.appendChild(h('div', { class: 'seg flat' }, [7, 28, 90].map((d) => h('button', { class: n === d ? 'on' : '', onclick: () => { ui.rp = d; UI.render(); } }, d + ' dni'))));
    const per = App.yta.period(p, n);
    if (per && per.series.length) {
      const s = per.series;
      root.appendChild(h('div', { class: 'chart' }, h('div', { html: chartSvg(s, 'views') }), h('div', { class: 'meta' }, h('span', null, dShort(s[0].d)), h('span', null, 'wyświetlenia dziennie'), h('span', null, dShort(s[s.length - 1].d)))));
      const c = per.cur, pv = per.prev;
      root.appendChild(h('div', { class: 'kpis' },
        h('div', { class: 'kpi' }, h('span', null, 'Wyświetlenia'), h('b', null, fmt(c.views)), delta(c.views, pv && pv.views)),
        h('div', { class: 'kpi' }, h('span', null, 'Subskrypcje'), h('b', null, (c.subs >= 0 ? '+' : '') + fmt(c.subs)), delta(c.subs, pv && pv.subs)),
        h('div', { class: 'kpi' }, h('span', null, 'Śr. % obejrzenia'), h('b', null, c.avp != null ? fmt1(c.avp) + '%' : '—'), delta(c.avp, pv && pv.avp, 'pp')),
        h('div', { class: 'kpi' }, h('span', null, 'Klikalność (CTR)'), h('b', null, c.ctr != null ? fmt1(c.ctr) + '%' : '—'), c.ctr != null ? delta(c.ctr, pv && pv.ctr, 'pp') : h('i', null, 'brak w danych'))));
      root.appendChild(h('p', { class: 'muted small', style: { margin: '-4px 16px 14px' } }, 'Źródło: ' + per.src + (per.at ? ', stan na ' + App.fmtDT(new Date(per.at).toISOString()) : '') + '. YouTube podaje dane z 2–3 dniowym opóźnieniem.'));
    } else {
      root.appendChild(h('div', { class: 'emptystate' }, h('b', null, 'Brak danych dziennych dla kanału ' + p.name),
        h('p', null, 'Połącz kanał z YouTube (darmowe, tylko odczyt), a wykres, liczby i porównania z poprzednim okresem pojawią się tutaj. Pokazuję wyłącznie prawdziwe dane.'),
        h('button', { class: 'btn', style: { width: '100%' }, onclick: () => sync() }, icon('link', 18), 'Połącz z YouTube'),
        h('div', { class: 'row-btns', style: { width: '100%' } }, h('button', { class: 'btn ghost sm', onclick: openYtHelp }, 'Jak połączyć (raz)'), h('button', { class: 'btn ghost sm', onclick: () => openAnalyticsImport(p) }, 'Import ze Studio'))));
    }
    const ins = localInsights(p, per);
    root.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('brain', 24, 1.6), h('h3', null, 'Wnioski z wyników')),
      ins.length ? h('ul', { class: 'ins' }, ins.map((i) => h('li', { class: i.t }, h('i', null, icon(i.t === 'warn' ? 'warn' : i.t === 'good' ? 'check' : 'chev', i.t === 'warn' ? 20 : 14, 2.4)), h('span', null, i.x, i.c ? h('span', { class: 'conf' }, i.c) : null))))
        : h('p', { class: 'muted' }, 'Za mało danych na wnioski. Połącz YouTube albo wpisz wyniki utworów po 7 dniach.'),
      h('p', { class: 'why' }, 'Liczone w telefonie, bez AI. Korelacja to nie dowód przyczyny.')));
    root.appendChild(monetBlock(p, per));
    root.appendChild(guideBlock(p));

    /* plan tygodnia i godziny */
    const week = E.week(p), td = new Date().getDay();
    root.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('plan', 24, 1.6), h('h3', null, 'Plan tygodnia')),
      h('ul', { class: 'tl' }, week.map((w) => h('li', { class: w.d === td ? 'cur' : '' }, h('span', { class: 't' }, w.n.slice(0, 3)), h('span', { class: 'sep' }), h('span', { class: 'pl' }, icon('tri', 13)), h('span', { class: 'x' }, w.x, h('span', { class: 'conf' }, w.s)), h('span'))))));
    const sh = p.publish.short = p.publish.short || { time: '18:00', time2: '12:30', note: '' };
    const ti = (val, fn) => h('input', { type: 'time', value: val, onchange: (e) => { fn(e.target.value); App.save(); toast('Godzina zapisana'); } });
    root.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-h' }, icon('clock', 24, 1.6), h('h3', null, 'Godziny publikacji')),
      h('div', { class: 'grid3' }, field('Premiera', ti(p.publish.time, (v) => { p.publish.time = v || p.publish.time; })), field('Short #1', ti(sh.time, (v) => { sh.time = v || sh.time; })), field('Short #2 (nast. dnia)', ti(sh.time2 || '', (v) => { sh.time2 = v || sh.time2; }))),
      h('p', { class: 'muted small', style: { marginTop: '10px' } }, p.publish.note || ''), sh.note ? h('p', { class: 'muted small', style: { marginTop: '6px' } }, sh.note) : null));
    root.appendChild(h('div', { class: 'row-btns pad' }, h('button', { class: 'btn ghost', onclick: () => openAnalyticsImport(p) }, icon('upload', 18), 'Import ze Studio'), h('button', { class: 'btn ghost', onclick: openYtHelp }, icon('link', 18), 'Jak połączyć YouTube')));
    return root;
  }

  /* ================= KANAŁY ================= */
  function renderProfiles() {
    const root = h('div', { class: 'screen' });
    root.appendChild(topbar('Kanały', 'DNA i tożsamość każdego kanału', h('button', { class: 'act', 'aria-label': 'Dodaj kanał', onclick: () => openProfile(null) }, icon('plus', 26, 2))));
    root.appendChild(h('div', { class: 'list' }, App.state.profiles.map((p) => {
      const on = p.id === App.state.activeProfile, n = App.songsOf(p.id).length;
      return h('button', { class: 'row link', style: on ? { boxShadow: 'inset 0 0 0 1.5px ' + p.palette.accent } : null, onclick: () => openProfile(p.id) }, mono(p, 52),
        h('div', { class: 'row-m' }, h('b', null, p.name), h('span', { class: 'muted small' }, p.handle + ' · ' + (p.lang === 'pl' ? 'polski' : 'angielski') + ' · ' + n + ' utw.'), h('span', { class: 'muted small', style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, p.dna.genre)),
        h('span', { style: { display: 'flex', gap: '4px' } }, h('i', { style: { width: '12px', height: '12px', borderRadius: '50%', background: p.palette.accent } }), h('i', { style: { width: '12px', height: '12px', borderRadius: '50%', background: p.palette.accent2 } })));
    })));
    root.appendChild(h('div', { class: 'row-btns pad', style: { marginTop: '14px' } }, h('button', { class: 'btn', onclick: () => App.dna.open(App.state.activeProfile) }, icon('brain', 18), 'DNA Track: ' + App.profile().name)));
    root.appendChild(h('div', { class: 'row-btns pad' }, h('button', { class: 'btn ghost', onclick: openImport }, icon('link', 18), 'Importuj kanał z YouTube')));
    root.appendChild(h('div', { class: 'row-btns pad' }, h('button', { class: 'btn ghost', onclick: () => openData() }, icon('db', 18), 'Kopia i dane'), h('button', { class: 'btn ghost', onclick: () => openSettings() }, icon('gear', 18), 'Ustawienia')));
    return root;
  }
  function openProfile(id, prefill) {
    const isNew = !id;
    const base = isNew ? Object.assign({ id: App.uid('ch'), name: '', handle: '', lang: 'pl', url: '', tagline: '', palette: App.clone(App.DATA.presets[4]), stats: { subs: 0, hours: 0, views: 0 }, publish: { time: '18:00', note: '' }, dna: { genre: '', voice: '', themes: [], symbols: [], hashtags: [], tags: [], used: [], usedSymbols: [] }, styleVariants: [{ id: 'v1', name: 'Główny styl', note: '', style: '' }], insights: [], ideas: [] }, prefill || {}) : App.clone(App.profile(id));
    const d = base;
    const csv = (a) => (a || []).join(', ');
    const parse = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
    openSheet(isNew ? 'Nowy kanał' : 'Kanał: ' + d.name, (render) => {
      const inp = (key, ph) => h('input', { value: d[key] || '', placeholder: ph || '', oninput: (e) => { d[key] = e.target.value; } });
      return h('div', { class: 'stack' },
        field('Nazwa', inp('name')), field('Adres kanału', inp('handle', '@nazwa')), field('Opis jednym zdaniem', inp('tagline')),
        h('div', null, h('span', { class: 'flabel' }, 'Język utworów'), h('div', { class: 'chips' }, [['pl', 'Polski'], ['en', 'Angielski']].map((l) => chip(l[1], d.lang === l[0], () => { d.lang = l[0]; render(); })))),
        h('div', null, h('span', { class: 'flabel' }, 'Kolory kanału'), h('div', { class: 'chips' }, App.DATA.presets.map((pr) => h('button', { type: 'button', class: 'sw' + (d.palette.accent === pr.accent ? ' on' : ''), 'aria-label': pr.n, style: { background: 'linear-gradient(135deg,' + pr.accent + ',' + pr.accent2 + ')' }, onclick: () => { d.palette = App.clone(pr); render(); } })))),
        field('Gatunek i klimat', h('textarea', { rows: 2, value: d.dna.genre, oninput: (e) => { d.dna.genre = e.target.value; } })),
        field('Wokal', h('input', { value: d.dna.voice, oninput: (e) => { d.dna.voice = e.target.value; } })),
        field('Motywy (po przecinku)', h('input', { value: csv(d.dna.themes), oninput: (e) => { d.dna.themes = parse(e.target.value); } })),
        field('Symbole (po przecinku)', h('input', { value: csv(d.dna.symbols), oninput: (e) => { d.dna.symbols = parse(e.target.value); } })),
        field('Hashtagi (po przecinku)', h('input', { value: csv(d.dna.hashtags), oninput: (e) => { d.dna.hashtags = parse(e.target.value); } })),
        field('Tagi (po przecinku)', h('input', { value: csv(d.dna.tags), oninput: (e) => { d.dna.tags = parse(e.target.value); } })),
        h('div', { class: 'grid3' }, [['subs', 'Subskrypcje'], ['hours', 'Godziny'], ['views', 'Wyświetlenia']].map((f) => field(f[1], h('input', { type: 'number', inputmode: 'decimal', value: d.stats[f[0]], oninput: (e) => { d.stats[f[0]] = Number(e.target.value) || 0; } })))),
        field('Godzina premiery', h('input', { type: 'time', value: d.publish.time, onchange: (e) => { d.publish.time = e.target.value; } })),
        h('h3', { class: 'sec' }, 'Style do Suno'),
        d.styleVariants.map((v, i) => h('div', { class: 'variant' },
          field('Nazwa stylu', h('input', { value: v.name, oninput: (e) => { v.name = e.target.value; } })),
          field('Prompt stylu', (function () { const t = h('textarea', { rows: 5, value: v.style, oninput: (e) => { v.style = e.target.value; v.draft = false; } }); return [t, counter(t, 1000)]; })()),
          d.styleVariants.length > 1 ? h('button', { class: 'btn ghost sm danger', onclick: () => { d.styleVariants.splice(i, 1); render(); } }, 'Usuń styl') : null)),
        h('button', { class: 'btn ghost', onclick: () => { d.styleVariants.push({ id: App.uid('v'), name: 'Nowy styl', note: '', style: '' }); render(); } }, icon('plus', 18), 'Dodaj styl'),
        h('button', { class: 'btn big', onclick: () => {
          if (!d.name.trim()) return toast('Podaj nazwę kanału.');
          if (isNew) App.state.profiles.push(d); else App.state.profiles = App.state.profiles.map((x) => (x.id === d.id ? d : x));
          App.state.activeProfile = d.id; App.save(); closeSheet(); toast('Kanał zapisany'); UI.render();
        } }, 'Zapisz kanał'),
        !isNew && App.state.profiles.length > 1 ? h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Usunąć kanał i jego utwory?')) { App.state.profiles = App.state.profiles.filter((x) => x.id !== d.id); App.state.songs = App.state.songs.filter((x) => x.profileId !== d.id); App.state.activeProfile = App.state.profiles[0].id; App.save(); closeSheet(); UI.render(); } } }, icon('trash', 18), 'Usuń kanał') : null);
    });
  }

  function openImport() {
    const st = { input: '', titles: '', res: null, err: '' };
    openSheet('Import kanału', (render) => {
      const res = st.res;
      return h('div', { class: 'stack' },
        h('p', { class: 'muted' }, 'Wklej link do kanału, a aplikacja pobierze tytuły, opisy i wyświetlenia (potrzebny darmowy klucz YouTube Data API w ustawieniach). Możesz też wkleić same tytuły.'),
        field('Link lub @nazwa', h('input', { value: st.input, placeholder: 'youtube.com/@nazwa', oninput: (e) => { st.input = e.target.value; } })),
        h('button', { class: 'btn', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; st.err = ''; try { const r = await AI.importYouTube(st.input); st.res = { meta: r, an: AI.analyzeTitles(r.items) }; } catch (er) { st.err = er.message; } render(); } }, icon('link', 18), 'Pobierz z YouTube'),
        field('Albo tytuły (po jednym w linii)', h('textarea', { rows: 5, value: st.titles, oninput: (e) => { st.titles = e.target.value; } })),
        h('button', { class: 'btn ghost', onclick: () => { const items = st.titles.split('\n').map((x) => ({ title: x.trim() })).filter((x) => x.title); if (!items.length) { st.err = 'Wklej przynajmniej jeden tytuł.'; } else { st.err = ''; st.res = { meta: { name: '', handle: '', items }, an: AI.analyzeTitles(items) }; } render(); } }, 'Analizuj tytuły'),
        st.err ? h('p', { class: 'errbox' }, st.err) : null,
        res && res.an ? h('section', { class: 'block' }, h('h3', null, 'Wynik analizy'),
          h('ul', { class: 'ins' },
            h('li', { class: 'info' }, h('i'), h('span', null, 'Filmów: ' + res.an.n + ', język: ' + (res.an.lang === 'pl' ? 'polski' : 'angielski') + ', średnia długość tytułu: ' + res.an.avgLen + ' znaków.')),
            h('li', { class: 'info' }, h('i'), h('span', null, 'Hashtagi w tytule ma ' + res.an.withTags + ' z ' + res.an.n + ' filmów, separator (— lub |) ' + res.an.dash + '.')),
            res.an.top.length ? h('li', { class: 'info' }, h('i'), h('span', null, 'Najczęstsze słowa: ' + res.an.top.join(', ') + '.')) : null,
            res.an.best.length ? h('li', { class: 'good' }, h('i'), h('span', null, 'Najlepsze: ' + res.an.best.map((b) => b.title + ' (' + b.views + ')').join('; '))) : null),
          h('button', { class: 'btn big', onclick: () => { closeSheet(); const m = res.meta, a = res.an; setTimeout(() => openProfile(null, { name: m.name || '', handle: m.handle || '', lang: a.lang, tagline: m.description ? m.description.split('\n')[0].slice(0, 90) : '', stats: { subs: m.subs || 0, hours: 0, views: m.views || 0 }, dna: { genre: '', voice: '', themes: a.top.slice(0, 6), symbols: [], hashtags: a.hashtags.slice(0, 3), tags: a.top, used: a.titles.map((t) => t.toLowerCase()), usedSymbols: [] }, insights: [{ t: 'info', x: 'Import: ' + a.n + ' filmów. Najczęstsze słowa w tytułach: ' + a.top.slice(0, 5).join(', ') + '.' }].concat(a.best.length ? [{ t: 'good', x: 'Najlepszy film: ' + a.best[0].title + ' (' + a.best[0].views + ' wyśw.).' }] : []) }), 200); } }, 'Utwórz kanał z tych danych')) : null);
    });
  }

  /* ================= USTAWIENIA ================= */
  /* pokaż / ukryj klucz i skopiuj go (pole jest zamaskowane kropkami) */
  function keyTools(get, label) {
    const eye = h('button', { type: 'button', class: 'iconbtn sm', 'aria-label': 'Pokaż ' + label, onclick: (e) => { e.preventDefault(); const inp = e.currentTarget.closest('label').querySelector('input'); const hide = inp.classList.toggle('secret'); e.currentTarget.style.color = hide ? '' : 'var(--accent)'; } }, h('span', { class: 'ico', html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' }));
    const cp = h('button', { type: 'button', class: 'iconbtn sm', 'aria-label': 'Kopiuj ' + label, onclick: (e) => { e.preventDefault(); const v = get(); if (!v) return toast('Pole jest puste.'); copy(v, label + ' skopiowany'); } }, icon('copy', 18));
    return h('span', { style: { display: 'inline-flex', gap: '2px', marginLeft: 'auto' } }, eye, cp);
  }
  function openSettings() {
    const s = App.state.settings;
    const sec = (attrs) => h('input', Object.assign({ type: 'text', class: 'secret', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', 'data-lpignore': 'true' }, attrs));
    openSheet('Ustawienia', (render) => h('div', { class: 'stack' },
      h('div', { class: 'infobox' }, 'Klucze zostają w tym telefonie i trafiają tylko do usługi, do której należą. Nagranie wysyłasz do Gemini wyłącznie przyciskiem, który to mówi (napisy ze słuchu, analiza utworu). Wszystko inne liczy się w telefonie.'),
      field('Klucz Gemini (darmowy, aistudio.google.com)', sec({ name: 'rz-gemini', value: s.gemini, placeholder: 'AIza…', oninput: (e) => { s.gemini = e.target.value.trim(); App.save(); if (App.studio && App.studio.resetPrep) App.studio.resetPrep(); } }), keyTools(() => s.gemini, 'Klucz Gemini')),
      h('button', { class: 'btn ghost', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Sprawdzam…'; try { await App.ai.gemini('Odpowiedz jednym słowem: OK', { temp: 0 }); toast('Klucz działa. Model: ' + App.state.settings.model); } catch (er) { toast(er.message); } b.disabled = false; b.textContent = 'Sprawdź klucz Gemini'; } }, 'Sprawdź klucz Gemini'),
      field('Model Gemini', h('input', { value: s.model, oninput: (e) => { s.model = e.target.value.trim(); App.save(); } })),
      field('Klucz YouTube Data API (opcjonalny, import kanału)', sec({ name: 'rz-yt', value: s.yt, placeholder: 'AIza…', oninput: (e) => { s.yt = e.target.value.trim(); App.save(); } }), keyTools(() => s.yt, 'Klucz YouTube')),
      field('Google OAuth Client ID (wysyłka i statystyki YouTube)', h('input', { value: s.ytClient || '', placeholder: '…apps.googleusercontent.com', oninput: (e) => { s.ytClient = e.target.value.trim(); App.save(); } })),
      field('Adres generatora obrazów (Cloudflare Worker)', h('input', { value: s.img || '', placeholder: 'https://…workers.dev/', oninput: (e) => { s.img = e.target.value.trim(); App.save(); } })),
      h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Usunąć klucze Gemini i YouTube z tego telefonu?')) { s.gemini = ''; s.yt = ''; App.save(); render(); toast('Klucze usunięte'); } } }, icon('trash', 18), 'Usuń klucze z telefonu'),
      h('h3', { class: 'sec' }, 'Ekran'),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: s.awake !== false, onchange: (e) => { s.awake = e.target.checked; App.save(); if (App.awake) App.awake.refresh(); } }), h('span', null, 'Nie wygaszaj ekranu, gdy aplikacja jest otwarta')),
      h('h3', { class: 'sec' }, 'Dane'),
      h('button', { class: 'btn ghost', onclick: () => { closeSheet(true); openData(); } }, icon('db', 18), 'Kopia zapasowa, eksport i import'),
      h('h3', { class: 'sec' }, 'Wersja aplikacji'),
      h('p', { class: 'muted small' }, 'Wersja ' + App.version + ' · dane w schemacie ' + App.schema + '. Jeśli po aktualizacji widzisz stare zachowanie, odśwież. Twoje dane zostają.'),
      h('button', { class: 'btn ghost', onclick: async () => { try { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } catch (e) { /* ignore */ } location.reload(); } }, icon('refresh', 18), 'Odśwież do najnowszej wersji')), { icon: 'gear' });
  }
  UI.openSettings = openSettings;

  /* ================= KOPIA I DANE ================= */
  function download(blob, name) { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  function openData() {
    const st = { snaps: null, usage: null, persisted: null, busy: '' };
    const load = async (render) => { st.snaps = await App.db.snapshots(); st.usage = await App.db.usage(); try { st.persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; } catch (e) { st.persisted = null; } render(); };
    const mb = (b) => (b / 1048576).toLocaleString('pl-PL', { maximumFractionDigits: 1 }) + ' MB';
    const r = openSheet('Kopia i dane', (render) => {
      const s = App.state.settings, nAudio = App.state.songs.filter((x) => x.audioSaved).length;
      const stamp = new Date().toISOString().slice(0, 10);
      const exp = async (withAudio) => { st.busy = 'Przygotowuję plik…'; render(); try { const b = await App.db.exportAll(withAudio); download(b, 'rezonans-' + stamp + (withAudio ? '-z-audio' : '') + '.json'); toast('Kopia zapisana (' + mb(b.size) + ')'); } catch (e) { toast(e.message); } st.busy = ''; render(); };
      return h('div', { class: 'stack' },
        h('div', { class: 'infobox' }, h('b', null, 'Gdzie są dane: '), 'kanały, utwory i ustawienia w pamięci przeglądarki, pliki mp3 w bazie IndexedDB tego telefonu. Nic nie trafia na żaden serwer. Kopie automatyczne robią się raz dziennie i przed każdą aktualizacją (ostatnie 10).'),
        h('div', { class: 'mini3' },
          h('div', null, h('b', null, App.state.songs.length), h('span', null, 'utworów')),
          h('div', null, h('b', null, nAudio), h('span', null, 'plików mp3')),
          h('div', null, h('b', null, st.usage ? mb(st.usage.usage || 0) : '…'), h('span', null, 'zajęte'))),
        st.persisted === false ? h('div', { class: 'warnbox' }, h('p', null, icon('warn', 18), 'Przeglądarka może usunąć dane przy braku miejsca. Dodaj aplikację do ekranu początkowego i rób kopie do pliku.')) : null,
        h('p', { class: 'muted small' }, 'Ostatnia kopia do pliku: ' + (s.lastExport ? App.fmtDT(new Date(s.lastExport).toISOString()) : 'jeszcze nie było') + '.'),
        st.busy ? h('p', { class: 'hint' }, st.busy) : null,
        h('button', { class: 'btn big', onclick: () => exp(false) }, icon('download', 18), 'Pobierz kopię (bez plików mp3)'),
        h('button', { class: 'btn big ghost', onclick: () => exp(true) }, icon('download', 18), 'Pobierz pełną kopię z plikami mp3'),
        h('label', { class: 'btn big ghost filebtn' }, icon('upload', 18), 'Wczytaj kopię z pliku', h('input', { type: 'file', accept: 'application/json,.json', onchange: async (e) => {
          const f = e.target.files[0]; if (!f) return;
          if (!confirm('Wczytać kopię? Obecne dane zostaną zastąpione (przed tym zrobię automatyczną kopię w telefonie).')) return;
          try { const x = await App.db.importAll(f); closeSheet(true); UI.render(); toast('Wczytano: ' + x.songs + ' utworów, ' + x.audio + ' plików mp3'); } catch (er) { toast(er.message || 'To nie jest plik kopii Rezonansu.'); }
        } })),
        h('h3', { class: 'sec' }, 'Kopie automatyczne w telefonie'),
        st.snaps == null ? h('p', { class: 'muted small' }, 'Wczytuję…') : !st.snaps.length ? h('p', { class: 'muted small' }, 'Jeszcze nie ma kopii.') :
          h('ul', { class: 'sched' }, st.snaps.map((k) => h('li', null, h('span', null, App.fmtDT(new Date(k.at).toISOString()) + ' · ' + k.reason), h('button', { class: 'btn ghost sm', onclick: async () => { if (!confirm('Przywrócić dane z tej kopii? Obecny stan zapiszę jako osobną kopię.')) return; try { await App.db.snapshot('przed przywróceniem'); await App.db.restoreSnapshot(k.at); closeSheet(true); UI.render(); toast('Przywrócono'); } catch (e) { toast(e.message); } } }, 'Przywróć')))),
        h('button', { class: 'btn ghost', onclick: async () => { await App.db.snapshot('ręczna'); load(render); toast('Kopia w telefonie zapisana'); } }, icon('db', 18), 'Zrób kopię w telefonie teraz'),
        h('h3', { class: 'sec' }, 'Diagnostyka'),
        h('button', { class: 'btn ghost', onclick: () => { const rep = { at: new Date().toISOString(), version: App.version, schema: App.schema, ua: navigator.userAgent, songs: App.state.songs.length, profiles: App.state.profiles.map((p) => p.id), usage: st.usage, persisted: st.persisted, errors: App.errors || [] }; download(new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' }), 'rezonans-diagnostyka.json'); } }, icon('download', 18), 'Pobierz raport błędów'),
        h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Przywrócić dane startowe? Utwory i własne kanały zostaną usunięte (kopia w telefonie zostanie zrobiona przedtem).')) { App.db.snapshot('przed resetem').then(() => { try { localStorage.removeItem('rezonans.v1'); } catch (e) { /* ignore */ } location.reload(); }); } } }, icon('trash', 18), 'Przywróć dane startowe'));
    }, { icon: 'db' });
    load(r);
  }
  UI.openData = openData;
})();
