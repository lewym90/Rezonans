/* Kreator utworu: krok po kroku od Suno do wyników */
(function () {
  const App = window.App;
  const W = (App.wizard = {});
  const STEPS = [
    { n: 'Suno', t: 'Zrób utwór w Suno' },
    { n: 'MP3', t: 'Pobierz i wczytaj plik mp3' },
    { n: 'Teledysk', t: 'Zrób teledysk i Shorta' },
    { n: 'Publikacja', t: 'Wrzuć na YouTube' },
    { n: 'Po premierze', t: 'Zadania po premierze' },
    { n: 'Wyniki', t: 'Wyniki po 7 dniach' }
  ];
  W.steps = STEPS;
  W.stepOf = (s) => s.step || (s.mp3 ? 3 : 1);
  W.open = function (id, step) {
    const UI = App.ui, K = UI.kit, h = UI.h, icon = UI.icon, toast = UI.toast, E = App.engine, S = App.studio;
    const s = App.song(id); if (!s) return;
    const p = App.profile(s.profileId);
    if (p.id !== App.state.activeProfile) { App.state.activeProfile = p.id; UI.applyTheme(); }
    if (step) s.step = step; else s.step = W.stepOf(s);
    s.done = s.done || {};
    K.openSheet(s.title || 'Nowy utwór', (render) => {
      const cur = s.step, pack = E.publish(p, s), save = () => App.save();
      const go = (n) => { s.step = Math.max(1, Math.min(6, n)); save(); render(); const b = document.querySelector('.sheet-body'); if (b) b.scrollTop = 0; };
      const next = () => { s.done[cur] = true; go(cur + 1); };
      const nav = h('div', { class: 'wz-nav' },
        cur > 1 ? h('button', { class: 'btn ghost', onclick: () => go(cur - 1) }, 'Wstecz') : h('span'),
        cur < 6 ? h('button', { class: 'btn', onclick: next }, 'Dalej') : h('button', { class: 'btn', onclick: () => { s.done[6] = true; save(); K.closeSheet(); toast('Utwór zamknięty'); } }, 'Zakończ'));
      const stepper = h('div', { class: 'wz-steps', role: 'list' }, STEPS.map((st, i) => h('button', { class: 'wz-dot' + (i + 1 === cur ? ' on' : '') + (s.done[i + 1] ? ' done' : ''), onclick: () => go(i + 1), 'aria-label': 'Krok ' + (i + 1) + ': ' + st.n, 'aria-current': i + 1 === cur ? 'step' : 'false' }, h('b', null, s.done[i + 1] && i + 1 !== cur ? icon('check', 14) : String(i + 1)), h('span', null, st.n))));
      const head = h('div', { class: 'wz-head' }, h('p', { class: 'flabel' }, 'Krok ' + cur + ' z 6'), h('h3', null, STEPS[cur - 1].t));
      const field = (label, value, rows) => h('div', { class: 'wz-field' }, h('div', { class: 'wz-fh' }, h('span', { class: 'flabel' }, label), K.copyBtn(() => value, label)), rows ? h('textarea', { rows, readonly: true, value }) : h('div', { class: 'wz-val' }, value));
      const ol = (items) => h('ol', { class: 'wz-ol' }, items.map((x) => h('li', null, x)));
      let body;
      if (cur === 1) {
        const empty = !s.lyrics || /\[(Verse \d)\]\s*\n\s*\n/.test(s.lyrics);
        body = h('div', { class: 'stack' },
          ol(['Otwórz Suno i wejdź w Create, potem w tryb Custom.', 'Wklej poniższe trzy rzeczy do trzech pól: tytuł, styl i tekst. Skopiuj każdą kropką obok nazwy.', 'Kliknij Create. Suno robi dwie wersje. Posłuchaj obu na słuchawkach i wybierz lepszą.']),
          h('a', { class: 'btn big', href: 'https://suno.com/create', target: '_blank', rel: 'noopener' }, icon('link', 18), 'Otwórz Suno'),
          field('Tytuł (Song Title)', s.title || ''), field('Styl (Styles)', s.style || '', 5), field('Tekst (Lyrics)', s.lyrics || '', 12),
          empty ? h('div', { class: 'warnbox' }, h('p', null, icon('shield', 18), 'Zwrotki są puste. Suno powtórzy wtedy w kółko refren. Wróć do pomysłu i kliknij „Napisz pełny tekst”.')) : null,
          h('p', { class: 'muted small' }, 'Gdy masz wybraną wersję, kliknij Dalej.'));
      } else if (cur === 2) {
        const has = S.hasAudio(id), M = S.mem(id);
        const fi = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; M.status = 'Analizuję utwór…'; render(); try { await S.loadFile(id, f); M.status = ''; s.done[2] = true; go(3); } catch (er) { M.status = 'Nie udało się wczytać pliku: ' + er.message; render(); } } });
        body = h('div', { class: 'stack' },
          ol(['W Suno otwórz wybraną piosenkę, dotknij ⋯ (trzy kropki) → Download → MP3 Audio.', 'Plik zapisze się na telefonie. Na iPhonie jest w aplikacji Pliki, w folderze Pobrane.', 'Wróć tutaj i kliknij poniżej, żeby wybrać ten plik.']),
          h('label', { class: 'btn big filebtn' }, icon('plus', 18), has ? 'Wybierz inny plik mp3' : 'Wybierz plik mp3', fi),
          M.status ? h('p', { class: 'hint' }, M.status) : null,
          has ? h('div', { class: 'okbox' }, h('b', null, 'Plik wczytany: ' + (s.mp3 || '')), h('p', { class: 'muted small' }, 'Aplikacja wykryła tempo ok. ' + Math.round(M.an.bpm) + ' bpm. Refren ustalę dokładniej po spisaniu napisów.')) : null,
          h('p', { class: 'muted small' }, 'Plik zostaje w pamięci aplikacji. Jeśli masz klucz Gemini, przy przygotowaniu teledysku nagranie jest jednorazowo wysyłane do Gemini, żeby spisać napisy ze słuchu. Nie jest nigdzie zapisywane przez aplikację.'));
      } else if (cur === 3) {
        body = h('div', { class: 'stack' },
          ol(['Kliknij „Przygotuj teledysk automatycznie”. Aplikacja ułoży sceny z tekstu, wygeneruje obrazy i dopasuje napisy.', 'Obejrzyj podgląd 15 sekund z dźwiękiem.', 'Zrenderuj film 16:9 i Short 9:16. Trwa tyle, ile utwór. Nie wychodź z aplikacji.', 'Zapisz plik albo od razu wyślij na YouTube jako prywatny.']),
          S.panel(id, render, true));
      } else if (cur === 4) {
        const pubV = s.publishAt || App.toLocalInput(App.nextAt(p.publish.time));
        const row = (txt) => h('div', { class: 'cp' }, h('span', null, txt), K.copyBtn(txt));
        body = h('div', { class: 'stack' },
          h('div', { class: 'okbox' }, s.yt && s.yt.full ? 'Film jest już na kanale jako prywatny. Wejdź w YouTube Studio → Treści i ustaw go na publiczny.' : 'Jeśli film nie jest jeszcze na kanale, wyślij go w poprzednim kroku jednym kliknięciem albo wgraj ręcznie: YouTube Studio → Utwórz → Prześlij film.'),
          ol(['Wybierz jeden z tytułów i skopiuj.', 'Wklej opis i tagi do formularza filmu.', 'Wybierz godzinę premiery: Widoczność → Zaplanuj.', 'Na pytanie o dzieci wybierz „Nie, to nie jest film dla dzieci”. Przy pytaniu o treści zmienione lub syntetyczne zaznacz zgodnie z prawdą, bo głos i obraz są tworzone przez AI.']),
          h('p', { class: 'flabel' }, 'Tytuł (wybierz jeden)'), h('div', { class: 'cps' }, pack.titles.map((t) => row(t))),
          h('p', { class: 'flabel' }, 'Opis'), h('textarea', { rows: 9, readonly: true, value: pack.description }), h('button', { class: 'btn ghost', onclick: () => App.ui.copy(pack.description, 'Opis skopiowany') }, icon('copy', 18), 'Kopiuj opis'),
          h('p', { class: 'flabel' }, 'Tagi'), row(pack.tags.join(', ')),
          h('label', { class: 'field' }, h('span', { class: 'flabel' }, 'Premiera'), h('input', { type: 'datetime-local', value: pubV, onchange: (e) => { s.publishAt = e.target.value ? new Date(e.target.value).toISOString() : ''; save(); } })),
          h('p', { class: 'muted small' }, 'Wskazówka z danych kanału: ' + p.publish.note));
      } else if (cur === 5) {
        const items = [
          ['pl1', 'Dodaj film do playlisty serii i ustaw ekran końcowy na następny utwór.'],
          ['pin', 'Przypnij komentarz: ' + pack.pinned],
          ['sh1', 'Opublikuj Short z refrenem i dodaj do niego „powiązany film” (Studio → Edycja Shorta). Tytuł Shorta: ' + (pack.shortTitles[0] || '')],
          ['sh2', 'Zaplanuj drugi Short z innego fragmentu na kolejne dni.'],
          ['cm', 'W pierwszej godzinie odpowiedz na komentarze.']];
        s.checks = s.checks || {};
        body = h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'To 5 drobnych rzeczy, które zwiększają zasięg. Odhaczaj po kolei.'),
          h('ul', { class: 'todo' }, items.map((c) => h('li', null, h('button', { class: 'cb' + (s.checks[c[0]] ? ' on' : ''), role: 'checkbox', 'aria-checked': s.checks[c[0]] ? 'true' : 'false', onclick: () => { s.checks[c[0]] = !s.checks[c[0]]; save(); render(); } }, icon('check', 16), h('span', null, c[1]))))));
      } else {
        const due = new Date((s.publishAt ? new Date(s.publishAt) : new Date()).getTime() + 7 * 864e5);
        s.results = s.results || {};
        const inp = (k, lab) => h('label', { class: 'field' }, h('span', { class: 'flabel' }, lab), h('input', { type: 'number', inputmode: 'decimal', value: s.results[k] || '', oninput: (e) => { s.results[k] = e.target.value; save(); } }));
        body = h('div', { class: 'stack' },
          ol(['Po 7 dniach od premiery (' + App.fmtDate(due) + ') wejdź w YouTube Studio → Treści → film → Analityka.', 'Wpisz liczby poniżej. Aplikacja porówna style i podpowie, co powtórzyć.']),
          h('div', { class: 'grid3' }, inp('views', 'Wyświetlenia'), inp('subs', 'Subskrypcje'), inp('avp', 'Obejrzenie %')),
          h('p', { class: 'muted small' }, 'Raz w tygodniu zaimportuj też pełny eksport ze Studio (zakładka Plan). Wtedy wnioski i przewodnik odświeżą się same.'));
      }
      return h('div', { class: 'stack wz' }, stepper, head, body, nav,
        h('button', { class: 'btn ghost sm', onclick: () => { K.closeSheet(); setTimeout(() => UI.openSongDetails(id), 280); } }, 'Wszystkie szczegóły utworu'));
    }, { onClose: () => { App.save(); UI.render(); } });
  };
})();
