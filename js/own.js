/* Ścieżka „Mam gotowy utwór”: wgrywasz mp3 zrobiony poza aplikacją, Gemini go słucha i przygotowuje pakiet publikacji. */
(function () {
  const App = window.App, O = (App.own = {});
  const clean = (t) => String(t || '').replace(/^```\w*\n?|```$/g, '').trim();
  const secOf = (m) => { const x = /^(\d+):(\d{1,2})$/.exec(String(m || '').trim()); return x ? +x[1] * 60 + +x[2] : null; };
  const mmss = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

  /* Gemini słucha całego utworu i podaje to, czego trzeba do publikacji */
  O.describe = async function (id, say, notes) {
    const S = App.studio, s = App.song(id), p = App.profile(s.profileId), M = S.mem(id), G = App.gen;
    if (!App.ai.hasKey()) return;
    say('Gemini słucha utworu i przygotowuje tytuł, opis i rozdziały…');
    const f = G.features(M.buf, M.an), win = G.window(M.an), data = S.wavChunk(M.buf, win[0], win[1]), pl = p.lang === 'pl';
    const prompt = [
      'Jesteś producentem muzycznym i menedżerem kanału YouTube „' + p.name + '” (' + p.dna.genre + '). Posłuchaj całego utworu i przygotuj dane do publikacji.',
      G.facts(f),
      'Język tytułów i etykiet: ' + (pl ? 'polski' : 'angielski') + '. Zasady: nie podawaj nazw artystów; nie cytuj dłuższych fragmentów tekstu.',
      'Zwróć JSON: {"titles":["3 różne, krótkie, mocne tytuły piosenki (do 5 słów), pasujące do nastroju i tekstu"],"genre_label":"krótka etykieta gatunku do tytułu filmu po ' + (pl ? 'polsku' : 'angielsku') + ', np. ' + (pl ? '„Polski rap z orkiestrą na trening”' : '„Symphonic Metal Gym Music”, „Bass Boosted Car Audio Test”, „Dark Rap Gym Anthem”') + ' (do 45 znaków)","thumb_words":"do 3 słów (wielkie litery) na miniaturę, najmocniejszy hook utworu","chapters":[{"t":"0:00","n":"Intro"}],"mood":"","style_note":"jedno zdanie po polsku o brzmieniu"}',
      '"chapters": rozdziały YouTube z prawdziwymi czasami m:ss ' + (win[0] > 0 ? 'liczonymi od początku fragmentu' : 'od początku utworu') + ', pierwszy musi być 0:00, minimum 3, odstęp co najmniej 15 s, etykiety po angielsku lub polsku jak język kanału, np. Intro, Verse, Drop, Chorus, Bridge, Final Chorus, Outro.',
      'Zwróć tylko JSON.'
    ].join('\n');
    const r = JSON.parse(clean(await App.ai.gemini(prompt, { json: true, temp: 0.6, parts: [{ inline_data: { mime_type: 'audio/wav', data } }] })));
    const x = Array.isArray(r) ? r[0] : r;
    s.titleOptions = [].concat(x.titles || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 3);
    if (x.genre_label) s.genreLabel = String(x.genre_label).trim().slice(0, 60);
    if ((!s.title || s.titleAuto) && s.titleOptions[0]) { s.title = s.titleOptions[0]; s.titleAuto = true; }
    if (win[0] === 0) {
      let ch = [].concat(x.chapters || []).map((c) => ({ sec: secOf(c.t), n: String(c.n || '').trim() })).filter((c) => c.sec !== null && c.n).sort((a, b) => a.sec - b.sec);
      const out = []; ch.forEach((c) => { if (!out.length) { if (c.sec <= 2) out.push({ sec: 0, n: c.n }); } else if (c.sec - out[out.length - 1].sec >= 12 && c.sec < M.an.dur - 8) out.push(c); });
      if (!out.length && ch.length) out.push({ sec: 0, n: ch[0].n });
      s.chapters = out.length >= 3 ? out.map((c) => ({ t: mmss(c.sec), n: c.n })) : [];
    } else s.chapters = [];
    if (!s.lyrics && M.exact && M.caps && M.caps.length) s.lyrics = M.caps.map((c) => c.text).join('\n');
    s.styleNote = String(x.style_note || '');
    App.save();
  };

  /* okno: dodaj gotowy utwór */
  O.open = function () {
    const UI = App.ui, h = UI.h, icon = UI.icon, K = UI.kit, toast = UI.toast, p = App.profile();
    const st = { file: null, title: '', busy: false, status: '' };
    K.openSheet('Mam gotowy utwór', (render) => {
      const fi = h('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.m4a', onchange: (e) => { st.file = e.target.files[0] || null; render(); } });
      const go = async () => {
        if (st.busy) return; if (!st.file) { toast('Najpierw wybierz plik z utworem.'); return; }
        st.busy = true; st.status = 'Wczytuję i analizuję utwór…'; render();
        try {
          const s = { id: App.uid('song'), profileId: p.id, title: st.title.trim(), titleAuto: !st.title.trim(), premise: '', variantId: (p.styleVariants[0] || {}).id, lyrics: '', status: 'gotowy', created: Date.now(), checks: {}, results: {}, own: true, look: 'brand', scenes: [] };
          App.state.songs.push(s); App.save();
          await App.studio.loadFile(s.id, st.file);
          if (!s.title) { s.title = st.file.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').trim(); }
          s.step = 3; App.save(); K.closeSheet(); UI.go('songs'); setTimeout(() => App.wizard.open(s.id, 3), 280);
        } catch (e) { st.busy = false; st.status = 'Nie udało się wczytać pliku: ' + e.message; render(); }
      };
      return h('div', { class: 'stack' },
        h('p', { class: 'muted' }, 'Utwór zrobiony poza aplikacją (np. w Suno), zmiksowany i gotowy. Dla kanału „' + p.name + '” aplikacja go przesłucha i przygotuje: tytuł, opis z rozdziałami, tagi, napisy, trzy tła do wyboru, miniatury 16:9 i 9:16, teledysk 16:9 i Short z refrenu.'),
        h('label', { class: 'btn big filebtn' }, icon('plus', 18), st.file ? 'Wybrany: ' + st.file.name : 'Wybierz plik mp3', fi),
        h('label', { class: 'field' }, h('span', { class: 'flabel' }, 'Tytuł (zostaw puste, a Gemini zaproponuje)'), h('input', { value: st.title, placeholder: p.lang === 'pl' ? 'np. Wilk na szczycie' : 'e.g. Armed with bass', oninput: (e) => { st.title = e.target.value; } })),
        App.ai.hasKey() ? null : h('div', { class: 'warnbox' }, h('p', null, 'Bez klucza Gemini nie zrobię napisów ze słuchu ani rozdziałów (Ustawienia → Klucz Gemini). Teledysk i miniatury powstaną mimo to.')),
        h('button', { class: 'btn big', disabled: st.busy ? 'true' : null, onclick: go }, icon('spark', 18), st.busy ? (st.status || 'Pracuję…') : 'Wczytaj i przygotuj publikację'),
        st.status && !st.busy ? h('p', { class: 'hint' }, st.status) : null);
    });
  };
})();
