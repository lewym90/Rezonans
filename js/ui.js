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
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
    idea: '<path d="M13 2 4.5 13.5H11L10 22l9-12h-6.5z"/>',
    songs: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M6.8 12a5.2 5.2 0 0 1 5.2-5.2"/>',
    plan: '<rect x="3" y="5" width="18" height="16" rx="3.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    deck: '<path d="m12 3-9 5 9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H16"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    wave: '<path d="M4 12v0M8 8v8M12 4v16M16 9v6M20 11v2"/>'
  };
  function icon(name, size) {
    const s = size || 22;
    return h('span', { class: 'ico', html: '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>' });
  }
  UI.icon = icon;

  /* ---------- motyw ---------- */
  UI.applyTheme = function () {
    const p = App.profile(), r = document.documentElement.style;
    r.setProperty('--bg', p.palette.bg); r.setProperty('--bg2', p.palette.bg2);
    r.setProperty('--accent', p.palette.accent); r.setProperty('--accent2', p.palette.accent2);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', p.palette.bg);
  };

  function toast(msg) {
    const t = h('div', { class: 'toast', role: 'status' }, msg);
    $('#layer').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 1900);
  }
  UI.toast = toast;
  async function copy(text, label) { const ok = await App.copy(text); toast(ok ? (label || 'Skopiowano') : 'Nie udało się skopiować. Zaznacz tekst ręcznie.'); }

  function mono(p, size) {
    const s = size || 56, ini = p.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const gid = 'g' + p.id.replace(/\W/g, '');
    return h('span', { class: 'mono', style: { width: s + 'px', height: s + 'px' }, html:
      '<svg viewBox="0 0 56 56" width="' + s + '" height="' + s + '" aria-hidden="true"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.palette.accent + '"/><stop offset="1" stop-color="' + p.palette.accent2 + '"/></linearGradient></defs>' +
      '<circle cx="28" cy="28" r="25" fill="' + p.palette.bg + '" stroke="url(#' + gid + ')" stroke-width="2.4"/>' +
      '<g stroke="url(#' + gid + ')" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M12 28v0M16 24v8M20 20v16M36 20v16M40 24v8M44 28v0"/></g>' +
      '<text x="28" y="33.5" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="16" fill="' + p.palette.accent + '">' + App.esc(ini) + '</text></svg>' });
  }

  function ring(done, total, size) {
    const s = size || 72, r = s / 2 - 6, c = 2 * Math.PI * r, f = total ? done / total : 0;
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
    closeSheet();
    const back = h('div', { class: 'sheet-back', onclick: closeSheet });
    const body = h('div', { class: 'sheet-body' });
    const sh = h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'grab' }),
      h('header', { class: 'sheet-h' }, h('h2', null, title), h('button', { class: 'iconbtn', 'aria-label': 'Zamknij', onclick: closeSheet }, icon('close', 20))),
      body);
    const wrap = h('div', { class: 'sheet-wrap' }, back, sh);
    $('#layer').appendChild(wrap); document.body.classList.add('lock');
    sheetEl = { wrap, body, build, opts: opts || {} };
    const render = () => { const y = body.scrollTop; body.textContent = ''; body.appendChild(build(render)); body.scrollTop = y; };
    sheetEl.render = render; render();
    return render;
  }
  function closeSheet() {
    if (!sheetEl) return;
    const w = sheetEl.wrap; const onClose = sheetEl.opts.onClose; sheetEl = null;
    w.classList.add('out'); document.body.classList.remove('lock');
    setTimeout(() => w.remove(), 240);
    if (onClose) onClose();
  }
  UI.closeSheet = closeSheet;

  /* ---------- nawigacja ---------- */
  const TABS = [['today', 'Dziś', 'today'], ['ideas', 'Pomysł', 'idea'], ['songs', 'Utwory', 'songs'], ['plan', 'Plan', 'plan'], ['profiles', 'Kanały', 'deck']];
  UI.renderTabs = function () {
    const nav = $('#tabbar'); nav.textContent = '';
    TABS.forEach((t) => nav.appendChild(h('button', { class: 'tab' + (App.state.tab === t[0] ? ' on' : ''), 'aria-current': App.state.tab === t[0] ? 'page' : null, onclick: () => UI.go(t[0]) }, icon(t[2], 22), h('span', null, t[1]))));
  };
  UI.go = function (tab) { App.state.tab = tab; UI.renderTabs(); UI.render(); window.scrollTo(0, 0); };
  UI.render = function () {
    UI.applyTheme();
    const v = $('#view'); v.textContent = '';
    const fn = { today: renderToday, ideas: renderIdeas, songs: renderSongs, plan: renderPlan, profiles: renderProfiles }[App.state.tab];
    v.appendChild(fn());
  };
  UI.refreshBody = function () { // odświeża tylko część pod talią
    if (App.state.tab !== 'today') return UI.render();
    UI.applyTheme(); const b = $('#todayBody'); if (b) { b.textContent = ''; b.appendChild(todayBody()); }
  };

  function header(title, sub, right) {
    return h('header', { class: 'hdr' }, h('div', null, h('h1', null, title), sub ? h('p', { class: 'sub' }, sub) : null), right || null);
  }
  const gear = () => h('button', { class: 'iconbtn', 'aria-label': 'Ustawienia', onclick: openSettings }, icon('sliders', 21));

  function currentSong() {
    const list = App.songsOf().filter((s) => s.status !== 'opublikowany').sort((a, b) => b.created - a.created);
    return list[0] || null;
  }

  /* ================= DZIŚ ================= */
  function setActive(id) {
    if (App.state.activeProfile === id) return;
    App.state.activeProfile = id; App.save(); UI.applyTheme();
    document.querySelectorAll('.dcard').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
    UI.refreshBody();
  }
  function renderToday() {
    const root = h('div', { class: 'screen' });
    root.appendChild(header('Dziś', App.fmtDate(new Date()), gear()));
    const deck = h('div', { class: 'deck', role: 'listbox', 'aria-label': 'Kanały' });
    App.state.profiles.forEach((p) => {
      const on = p.id === App.state.activeProfile;
      deck.appendChild(h('button', { class: 'dcard' + (on ? ' on' : ''), 'data-id': p.id, role: 'option', 'aria-selected': on ? 'true' : 'false', style: { '--c1': p.palette.accent, '--c2': p.palette.accent2, '--cb': p.palette.bg }, onclick: (e) => { const el = e.currentTarget; setActive(p.id); el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } },
        h('div', { class: 'dtop' }, mono(p, 52), h('div', null, h('div', { class: 'dname' }, p.name), h('div', { class: 'dhandle' }, p.handle))),
        h('p', { class: 'dtag' }, p.tagline),
        h('div', { class: 'dstats' }, stat(p.stats.subs, 'subskrypcji'), stat(String(p.stats.hours).replace('.', ','), 'godzin'), stat(p.stats.views, 'wyświetleń'))));
    });
    let t; deck.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => {
      const c = deck.getBoundingClientRect(), mid = c.left + c.width / 2; let best, bd = 1e9;
      Array.prototype.forEach.call(deck.children, (el) => { const r = el.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = el; } });
      if (best) setActive(best.dataset.id);
    }, 110); }, { passive: true });
    root.appendChild(deck);
    root.appendChild(h('div', { id: 'todayBody' }, todayBody()));
    requestAnimationFrame(() => { const a = deck.querySelector('.dcard.on'); if (a) deck.scrollLeft = a.offsetLeft - (deck.clientWidth - a.offsetWidth) / 2; });
    return root;
  }
  function stat(n, l) { return h('div', { class: 'st' }, h('b', null, typeof n === 'number' ? n.toLocaleString('pl-PL') : n), h('span', null, l)); }

  function todayBody() {
    const p = App.profile(), frag = document.createDocumentFragment();
    const song = currentSong();
    const week = E.week(p), td = new Date().getDay(), today = week.find((w) => w.d === td);

    /* następny krok */
    if (song) {
      const pr = E.progress(p, song), steps = E.checklist(p, song), next = steps.find((x) => !(song.checks || {})[x.id]);
      const at = song.publishAt ? new Date(song.publishAt) : App.nextAt(p.publish.time);
      frag.appendChild(h('section', { class: 'hero' },
        ring(pr.done, pr.total, 78),
        h('div', { class: 'hero-t' }, h('h2', null, song.title), h('p', null, next ? next.x : 'Wszystko gotowe. Zostaje publikacja.'),
          h('p', { class: 'muted small' }, 'Publikacja za ' + App.countdown(at) + ', ' + App.fmtDT(at.toISOString()))),
        h('button', { class: 'btn', onclick: () => openSong(song.id) }, 'Kontynuuj')));
    } else {
      frag.appendChild(h('section', { class: 'hero empty' },
        h('div', { class: 'hero-t' }, h('h2', null, 'Zacznij od pomysłu'), h('p', null, 'Opisz swój albo pozwól, żeby aplikacja zaproponowała utwór dopasowany do danych kanału.')),
        h('button', { class: 'btn', onclick: () => { App.state.ui = { ideaMode: 'surprise' }; UI.go('ideas'); } }, 'Nowy pomysł')));
    }

    /* plan na dziś */
    if (today) frag.appendChild(h('section', { class: 'block' }, h('h3', null, 'Plan na dziś'),
      h('button', { class: 'row link', onclick: () => UI.go(today.k === 'make' ? 'ideas' : (today.k === 'review' ? 'songs' : 'plan')) },
        h('div', { class: 'row-m' }, h('b', null, today.x), h('span', { class: 'muted' }, today.s)), icon('chev', 18))));

    /* dane */
    frag.appendChild(h('section', { class: 'block' }, h('h3', null, 'Co mówią dane'),
      h('ul', { class: 'ins' }, p.insights.map((i) => h('li', { class: i.t }, h('i', { 'aria-hidden': 'true' }), h('span', null, i.x))))));

    /* monetyzacja */
    const sp = Math.min(100, (p.stats.subs / 1000) * 100), hp = Math.min(100, (p.stats.hours / 4000) * 100);
    frag.appendChild(h('section', { class: 'block' }, h('h3', null, 'Droga do monetyzacji'),
      meter('Subskrypcje', p.stats.subs + ' z 1000', sp), meter('Godziny oglądania', String(p.stats.hours).replace('.', ',') + ' z 4000', hp),
      h('p', { class: 'muted small' }, 'Próg YouTube Partner Program: 1000 subskrypcji i 4000 godzin w ostatnich 12 miesiącach. Aktualizuj liczby w ustawieniach kanału.')));

    /* wnioski */
    const learn = E.learn(p, App.songsOf());
    frag.appendChild(h('section', { class: 'block' }, h('h3', null, 'Wnioski z wyników'),
      learn ? h('div', { class: 'tbl' }, learn.map((r, i) => h('div', { class: 'tr' + (i === 0 ? ' top' : '') }, h('b', null, r.name), h('span', null, r.n + ' utw.'), h('span', null, 'śr. ' + r.avg + ' wyśw.'), h('span', null, r.subs + ' sub.'))))
        : h('p', { class: 'muted' }, 'Po dodaniu wyników przynajmniej dwóch utworów (w widoku utworu) pokażę, który styl i motyw działa najlepiej.')));
    return frag;
  }
  function meter(l, v, pct) {
    return h('div', { class: 'meter' }, h('div', { class: 'mh' }, h('span', null, l), h('b', null, v)), h('div', { class: 'mt' }, h('i', { style: { width: Math.max(1.5, pct) + '%' } })));
  }

  /* ================= POMYSŁ ================= */
  function renderIdeas() {
    const p = App.profile(), ui = (App.state.ui = App.state.ui || {});
    ui.ideaMode = ui.ideaMode || 'own';
    const root = h('div', { class: 'screen' });
    root.appendChild(header('Pomysł', 'Dla kanału ' + p.name));
    root.appendChild(h('div', { class: 'seg', role: 'tablist' },
      ['own', 'surprise'].map((m) => h('button', { role: 'tab', 'aria-selected': ui.ideaMode === m ? 'true' : 'false', class: ui.ideaMode === m ? 'on' : '', onclick: () => { ui.ideaMode = m; ui.result = null; UI.render(); } }, m === 'own' ? 'Mam pomysł' : 'Zaskocz mnie'))));
    const out = h('div', { id: 'ideaOut' });
    if (ui.ideaMode === 'own') {
      const ta = h('textarea', { rows: 3, placeholder: p.lang === 'pl' ? 'Np. rano o piątej, pusta siłownia, wygrywam zanim świat wstanie' : 'E.g. the porch light stays on for someone who isn\'t coming back', value: ui.text || '', oninput: (e) => { ui.text = e.target.value; } });
      root.appendChild(h('div', { class: 'compose' }, ta,
        h('button', { class: 'btn', onclick: () => runOwn() }, icon('spark', 18), 'Oceń i wzmocnij')));
    } else {
      root.appendChild(h('div', { class: 'compose' }, h('p', { class: 'muted' }, 'Propozycje biorą pod uwagę dane kanału, gałąź stylu, która działa, i symbole, których jeszcze nie użyłeś.'),
        h('button', { class: 'btn', onclick: () => runSurprise() }, icon('refresh', 18), ui.ideas && ui.ideas.length ? 'Inne propozycje' : 'Wylosuj pomysły')));
    }
    root.appendChild(out);
    if (ui.result) out.appendChild(resultView(ui.result));
    else if (ui.ideaMode === 'surprise' && !ui.ideas) setTimeout(runSurprise, 30);
    if (ui.ideaMode === 'surprise' && ui.ideas && !ui.result) out.appendChild(h('div', { class: 'ideas' }, ui.ideas.map(ideaCard)));
    return root;
  }
  function busy(msg) { const o = $('#ideaOut'); if (o) { o.textContent = ''; o.appendChild(h('div', { class: 'busy' }, h('i'), msg || 'Pracuję…')); } }
  async function runSurprise() {
    const p = App.profile(), ui = App.state.ui;
    ui.result = null;
    let ideas = E.suggest(p, App.songsOf(), 3);
    if (AI.hasKey()) { busy('Gemini układa propozycje…'); try { ideas = await AI.ideas(p, '', App.songsOf()); } catch (e) { toast(e.message); } }
    ui.ideas = ideas; const o = $('#ideaOut'); if (o) { o.textContent = ''; o.appendChild(h('div', { class: 'ideas' }, ideas.map(ideaCard))); }
    const b = document.querySelector('.compose .btn'); if (b) b.lastChild.textContent = 'Inne propozycje';
  }
  async function runOwn() {
    const p = App.profile(), ui = App.state.ui, text = (ui.text || '').trim();
    if (!text) return toast('Wpisz pomysł albo przejdź do „Zaskocz mnie”.');
    const sc = E.score(p, text, App.songsOf());
    let ideas = [E.fromText(p, text)];
    const extra = E.suggest(p, App.songsOf(), 2);
    ideas = ideas.concat(extra);
    if (AI.hasKey()) { busy('Gemini wzmacnia pomysł…'); try { const g = await AI.ideas(p, text, App.songsOf()); ideas = g; } catch (e) { toast(e.message); } }
    ui.result = { score: sc, ideas }; UI.render();
  }
  function resultView(r) {
    const col = r.score.score >= 75 ? 'good' : r.score.score >= 50 ? 'mid' : 'low';
    return h('div', null,
      h('section', { class: 'score ' + col }, h('div', { class: 'sc-n' }, h('b', null, r.score.score), h('span', null, 'dopasowanie do kanału')),
        h('ul', { class: 'chk' }, r.score.checks.map((c) => h('li', { class: c.ok ? 'ok' : 'no' }, h('i', null, icon(c.ok ? 'check' : 'plus', 14)), h('span', null, c.x))))),
      h('h3', { class: 'sec' }, 'Wersje dopasowane do kanału'),
      h('div', { class: 'ideas' }, r.ideas.map(ideaCard)));
  }
  function ideaCard(idea) {
    const p = App.profile(), v = E.variantOf(p, idea.branch), reasons = E.reasons(p, idea);
    return h('article', { class: 'idea' },
      h('h4', null, idea.title), h('p', { class: 'premise' }, idea.premise),
      h('div', { class: 'chips' }, idea.symbol ? h('span', { class: 'tag' }, idea.symbol) : null, v ? h('span', { class: 'tag' }, v.name) : null, idea.shout ? h('span', { class: 'tag' }, 'okrzyk: ' + idea.shout + '!') : null),
      h('details', null, h('summary', null, 'Dlaczego to powinno zadziałać'), h('ul', null, reasons.map((x) => h('li', null, x)))),
      h('button', { class: 'btn', onclick: () => openBuilder(idea) }, 'Zbuduj dla Suno'));
  }

  /* ---------- kreator Suno ---------- */
  function openBuilder(idea) {
    const p = App.profile();
    const st = { title: idea.title, variant: idea.branch && E.variantOf(p, idea.branch) ? idea.branch : (p.styleVariants[0] || {}).id, moods: [], clean: false,
      lyrics: E.skeleton(p, idea), style: '' };
    st.style = E.buildStyle(p, st.variant, st.moods);
    openSheet('Pakiet dla Suno', (render) => {
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
        h('div', null, h('span', { class: 'flabel' }, 'Gałąź stylu'), h('div', { class: 'chips' }, p.styleVariants.map((v) => chip(v.name, st.variant === v.id, () => { st.variant = v.id; st.style = E.buildStyle(p, st.variant, st.moods); render(); })))),
        p.styleVariants.find((v) => v.id === st.variant) ? h('p', { class: 'muted small' }, p.styleVariants.find((v) => v.id === st.variant).note) : null,
        h('div', null, h('span', { class: 'flabel' }, 'Dopasuj brzmienie'), h('div', { class: 'chips' }, App.DATA.moods.map((m) => chip(m.n, st.moods.includes(m.id), () => { st.moods = st.moods.includes(m.id) ? st.moods.filter((x) => x !== m.id) : st.moods.concat(m.id); st.style = E.buildStyle(p, st.variant, st.moods); render(); })))),
        field('Styl (Styles)', styleTa, [counter(styleTa, 1000), copyBtn(() => st.style, 'Styl')]),
        field('Tekst (Lyrics)', lyrTa, [counter(lyrTa, 5000), copyBtn(() => st.lyrics, 'Tekst')]),
        empty ? h('p', { class: 'hint' }, 'Zwrotki są puste. Refren i hasło gotowe. Dopisz zwrotki albo wygeneruj cały tekst poniżej.') : null,
        warn,
        h('div', { class: 'row-btns' },
          AI.hasKey() ? h('button', { class: 'btn', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Piszę tekst…'; try { st.lyrics = await AI.lyrics(p, Object.assign({}, idea, { title: st.title }), st.variant, st.clean); toast('Tekst gotowy. Przeczytaj go uważnie.'); } catch (er) { toast(er.message); } render(); } }, icon('spark', 18), 'Wygeneruj tekst (Gemini)') : null,
          h('button', { class: 'btn ghost', onclick: () => copy(E.chatPrompt(p, Object.assign({}, idea, { title: st.title }), st.variant, st.clean), 'Prompt skopiowany. Wklej go do dowolnego czatu AI.') }, icon('copy', 18), 'Kopiuj prompt do czatu')),
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.clean, onchange: (e) => { st.clean = e.target.checked; } }), h('span', null, 'Czysta wersja bez wulgaryzmów w prompcie')),
        h('button', { class: 'btn big', onclick: () => {
          const s = { id: App.uid('song'), profileId: p.id, title: st.title, premise: idea.premise, variantId: st.variant, style: st.style, lyrics: st.lyrics, symbol: idea.symbol, scenes: idea.scenes || [], status: 'suno', created: Date.now(), checks: {}, results: {} };
          App.state.songs.push(s); App.save(); closeSheet(); toast('Zapisano w Utworach'); App.state.ui = {}; UI.go('songs');
        } }, 'Zapisz utwór'));
    });
  }

  /* ================= UTWORY ================= */
  function renderSongs() {
    const p = App.profile(), songs = App.songsOf().sort((a, b) => b.created - a.created);
    const root = h('div', { class: 'screen' });
    root.appendChild(header('Utwory', p.name, h('button', { class: 'iconbtn', 'aria-label': 'Dodaj utwór', onclick: () => { const s = { id: App.uid('song'), profileId: p.id, title: '', premise: '', variantId: (p.styleVariants[0] || {}).id, lyrics: '', status: 'gotowy', created: Date.now(), checks: {}, results: {}, scenes: [] }; App.state.songs.push(s); App.save(); openSong(s.id); } }, icon('plus', 22))));
    if (!songs.length) root.appendChild(h('div', { class: 'emptystate' }, h('b', null, 'Brak utworów w tym kanale'), h('p', null, 'Zacznij od pomysłu albo dodaj utwór, który już masz.'), h('button', { class: 'btn', onclick: () => UI.go('ideas') }, 'Nowy pomysł')));
    else root.appendChild(h('div', { class: 'list' }, songs.map((s) => {
      const pr = E.progress(p, s);
      return h('button', { class: 'row link', onclick: () => openSong(s.id) },
        ring(pr.done, pr.total, 44),
        h('div', { class: 'row-m' }, h('b', null, s.title || 'Bez tytułu'), h('span', { class: 'muted' }, s.status), s.results && s.results.views ? h('span', { class: 'muted' }, s.results.views + ' wyśw.') : null), icon('chev', 18));
    })));
    return root;
  }

  function openSong(id) {
    const s = App.song(id); if (!s) return;
    const p = App.profile(s.profileId);
    if (p.id !== App.state.activeProfile) { App.state.activeProfile = p.id; UI.applyTheme(); }
    openSheet(s.title || 'Nowy utwór', (render) => {
      const pack = E.publish(p, s);
      const save = () => App.save();
      const pr = E.progress(p, s);
      const lyr = h('textarea', { rows: 8, class: 'lyr', placeholder: 'Wklej tekst piosenki (z Suno)', value: s.lyrics || '', oninput: (e) => { s.lyrics = e.target.value; save(); } });
      const desc = h('textarea', { rows: 11, value: pack.description });
      const row = (txt, extra) => h('div', { class: 'cp' }, h('span', null, txt), copyBtn(txt));
      const pub = s.publishAt || App.toLocalInput(App.nextAt(p.publish.time));
      return h('div', { class: 'stack' },
        h('div', { class: 'sum' }, ring(pr.done, pr.total, 64), h('div', null, h('b', null, pr.done === pr.total ? 'Gotowe do publikacji' : 'Do zrobienia: ' + (pr.total - pr.done)), h('p', { class: 'muted small' }, 'Postęp w checkliście poniżej'))),
        field('Tytuł', h('input', { value: s.title || '', oninput: (e) => { s.title = e.target.value; save(); } })),
        h('div', null, h('span', { class: 'flabel' }, 'Status'), h('div', { class: 'chips' }, ['szkic', 'suno', 'gotowy', 'opublikowany'].map((x) => chip(x, s.status === x, () => { s.status = x; save(); render(); })))),
        field('Premiera', h('input', { type: 'datetime-local', value: pub, onchange: (e) => { s.publishAt = e.target.value ? new Date(e.target.value).toISOString() : ''; save(); render(); } })),
        field('Tekst', lyr, copyBtn(() => s.lyrics, 'Tekst')),
        field('Początek refrenu (mm:ss)', h('input', { value: s.chorusStart || '', placeholder: '0:48', inputmode: 'numeric', oninput: (e) => { s.chorusStart = e.target.value; save(); } })),
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
        s.chorusStart ? h('p', { class: 'muted small' }, 'Wytnij Short od ' + s.chorusStart + ', maksymalnie 18 sekund.') : null,
        h('p', { class: 'flabel' }, 'Harmonogram'), h('ul', { class: 'sched' }, pack.schedule.map((x) => h('li', null, h('span', null, x.k), h('b', null, App.fmtDT(x.at))))),
        h('p', { class: 'flabel' }, 'Miniatura'), row(pack.thumb),

        h('h3', { class: 'sec' }, 'Checklista'),
        h('ul', { class: 'todo' }, E.checklist(p, s).map((c) => h('li', null, h('button', { class: 'cb' + ((s.checks || {})[c.id] ? ' on' : ''), role: 'checkbox', 'aria-checked': (s.checks || {})[c.id] ? 'true' : 'false', onclick: () => { s.checks = s.checks || {}; s.checks[c.id] = !s.checks[c.id]; save(); render(); } }, icon('check', 16), h('span', null, c.x))))),

        h('h3', { class: 'sec' }, 'Wyniki po 7 dniach'),
        h('div', { class: 'grid3' }, [['views', 'Wyświetlenia'], ['subs', 'Subskrypcje'], ['avp', 'Obejrzenie %']].map((f) => field(f[1], h('input', { type: 'number', inputmode: 'decimal', value: (s.results || {})[f[0]] || '', oninput: (e) => { s.results = s.results || {}; s.results[f[0]] = e.target.value; save(); } })))),
        h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Usunąć ten utwór?')) { App.state.songs = App.state.songs.filter((x) => x.id !== s.id); save(); closeSheet(); UI.render(); } } }, icon('trash', 18), 'Usuń utwór'));
    }, { onClose: () => { App.save(); UI.render(); } });
  }
  UI.openSong = openSong;

  /* ================= PLAN ================= */
  function renderPlan() {
    const p = App.profile(), week = E.week(p), td = new Date().getDay();
    const root = h('div', { class: 'screen' });
    root.appendChild(header('Plan', 'Dwie premiery w tygodniu, reszta to Shorty i wnioski'));
    root.appendChild(h('div', { class: 'list' }, week.map((w) => h('div', { class: 'row plan' + (w.d === td ? ' today' : ''), 'data-k': w.k }, h('i', { class: 'dot', 'aria-hidden': 'true' }), h('div', { class: 'row-m' }, h('b', null, w.n.replace(/^./, (c) => c.toUpperCase()) + ': ' + w.x), h('span', { class: 'muted' }, w.s))))));
    const time = h('input', { type: 'time', value: p.publish.time, onchange: (e) => { p.publish.time = e.target.value || p.publish.time; App.save(); toast('Godzina zapisana'); } });
    root.appendChild(h('section', { class: 'block' }, h('h3', null, 'Godzina premiery'), field('Czas warszawski', time), h('p', { class: 'muted small' }, p.publish.note),
      h('p', { class: 'muted small' }, 'Rzadziej i lepiej: YouTube ogranicza monetyzację treści powtarzalnych i masowych. Dwie dopracowane premiery tygodniowo to rozsądny rytm.')));
    return root;
  }

  /* ================= KANAŁY ================= */
  function renderProfiles() {
    const root = h('div', { class: 'screen' });
    root.appendChild(header('Kanały', 'DNA każdego profilu', h('button', { class: 'iconbtn', 'aria-label': 'Dodaj kanał', onclick: () => openProfile(null) }, icon('plus', 22))));
    root.appendChild(h('div', { class: 'list' }, App.state.profiles.map((p) => h('button', { class: 'row link', onclick: () => openProfile(p.id) }, mono(p, 46), h('div', { class: 'row-m' }, h('b', null, p.name), h('span', { class: 'muted' }, p.handle + ', ' + (p.lang === 'pl' ? 'polski' : 'angielski')), h('span', { class: 'muted' }, p.dna.genre)), icon('chev', 18)))));
    root.appendChild(h('div', { class: 'row-btns pad' }, h('button', { class: 'btn', onclick: openImport }, icon('link', 18), 'Importuj kanał z YouTube'), h('button', { class: 'btn ghost', onclick: openSettings }, icon('sliders', 18), 'Ustawienia i kopia zapasowa')));
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

  function openSettings() {
    const s = App.state.settings;
    openSheet('Ustawienia', () => h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Klucze zostają w tej przeglądarce na tym urządzeniu. Nie trafiają do repozytorium ani na żaden serwer poza usługą, do której należą.'),
      field('Klucz Gemini (darmowy, aistudio.google.com)', h('input', { type: 'password', value: s.gemini, autocomplete: 'off', placeholder: 'AIza…', oninput: (e) => { s.gemini = e.target.value.trim(); App.save(); } })),
      field('Model Gemini', h('input', { value: s.model, oninput: (e) => { s.model = e.target.value.trim(); App.save(); } })),
      field('Klucz YouTube Data API (opcjonalny)', h('input', { type: 'password', value: s.yt, autocomplete: 'off', placeholder: 'AIza…', oninput: (e) => { s.yt = e.target.value.trim(); App.save(); } })),
      h('h3', { class: 'sec' }, 'Kopia zapasowa'),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn', onclick: () => { const blob = new Blob([JSON.stringify({ profiles: App.state.profiles, songs: App.state.songs, activeProfile: App.state.activeProfile }, null, 2)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'rezonans-kopia.json' }); document.body.appendChild(a); a.click(); a.remove(); } }, icon('download', 18), 'Pobierz kopię'),
        h('label', { class: 'btn ghost filebtn' }, 'Wczytaj kopię', h('input', { type: 'file', accept: 'application/json', onchange: (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => { try { const d = JSON.parse(t); if (!Array.isArray(d.profiles)) throw new Error('x'); App.state.profiles = d.profiles; App.state.songs = d.songs || []; App.state.activeProfile = d.activeProfile || d.profiles[0].id; App.save(); closeSheet(); UI.render(); toast('Kopia wczytana'); } catch (er) { toast('To nie jest plik kopii Rezonansu.'); } }); } }))),
      h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Przywrócić dane startowe? Utwory i własne kanały zostaną usunięte.')) { try { localStorage.removeItem('rezonans.v1'); } catch (e) { /* ignore */ } location.reload(); } } }, icon('trash', 18), 'Przywróć dane startowe')));
  }
})();
