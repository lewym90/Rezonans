/* Dane startowe: DNA kanałów wyciągnięte z analizy YouTube Studio i promptów Suno użytkownika. */
(function () {
  const App = (window.App = window.App || {});

  const melodia = {
    id: 'melodia', name: 'Melodia Maszyny', handle: '@MelodiaMaszyny', lang: 'pl',
    url: 'https://youtube.com/@melodiamaszyny',
    tagline: 'Trap, metal i orkiestra. Motywacja, trening, siła.',
    palette: { bg: '#0f0c09', bg2: '#1c140b', accent: '#e3b454', accent2: '#41d1f5' },
    stats: { subs: 22, hours: 49.8, views: 5776 },
    publish: { time: '20:30', note: 'Wrzucałeś dotąd między 20 a 22. Sprawdź w Studio, kiedy widzowie są online, i porównaj z wynikami.' },
    dna: {
      genre: 'agresywny polski hip-hop i trap z orkiestrą oraz metalowy marsz wojenny',
      voice: 'męski baryton, rapowany',
      themes: ['motywacja', 'trening', 'siła', 'upór', 'powrót z dna', 'samotność na szczycie', 'ból jako paliwo', 'wojownik'],
      symbols: ['wilk', 'lew', 'orzeł', 'byk', 'kruk', 'niedźwiedź', 'kowadło', 'sztanga', 'ring', 'ogień', 'stal', 'żelazna brama', 'rycerz w zbroi', 'popiół'],
      hashtags: ['#motywacja', '#trening', '#siła'],
      tags: ['muzyka na trening', 'muzyka motywacyjna', 'motywacja', 'polski rap', 'trap', 'heavy metal', 'siłownia', 'workout music', 'muzyka na siłownię'],
      used: ['wilk na szczycie', 'moja stal', 'wchodzę po swoje', 'ring', 'z popiołu wstaje znak', 'ogień pod skórą', 'wstań', 'gdzie kończy się krew', 'krew i stal', 'nie odpuszczaj', 'gotowy na wojnę', 'żelazo pod stopą'],
      usedSymbols: ['wilk', 'ring', 'ogień', 'stal', 'rycerz w zbroi', 'popiół']
    },
    styleVariants: [
      { id: 'trap', name: 'Trap i orkiestra', note: 'Wzorzec: „Wilk na szczycie” (najlepszy wynik kanału)',
        style: 'aggressive Polish hip-hop, heavyweight trap drums, massive sub-bass and distorted 808s, dark minor-key piano stabs, tense orchestral hits, sparse menacing synths, charismatic deep gritty male rap vocal, forceful clipped delivery, dense internal rhymes, hard punchy modern mix, dramatic beat drops before the hook, polished professional club-ready production' },
      { id: 'march', name: 'Metalowy marsz', note: 'Wzorzec: „Gotowy na wojnę”, „Żelazo pod stopą”',
        style: 'extreme aggressive gangsta rap, heavy metal fusion, militaristic war march, live orchestral low brass, ominous cellos, pounding taiko, marching snare, crushing down-tuned guitars, deep 808 sub-bass, gritty male baritone rap, massed vocal battle chant chorus, dense cinematic mix' },
      { id: 'stomp', name: 'Ciężki stomp', note: 'Wzorzec: „Moja Stal”',
        style: 'aggressive heavy metal fused with gangsta rap, slow crushing stomp groove, heavily syncopated taiko and cinematic war drums, massive low brass hits, downtuned palm-muted guitar riffs, thick sub bass, hard punchy kick and snare, ominous orchestral risers, commanding deep male baritone rap-sung' }
    ],
    insights: [
      { t: 'good', x: '„Wilk na szczycie” to najlepszy utwór: 24,1 z 49,8 godziny oglądania i 9 z 22 subskrypcji.' },
      { t: 'good', x: 'Pełne filmy przyciągają nowych widzów (328 wobec 17 z Shortów w 28 dni). Shorty dają wyświetlenia, film daje subskrypcje.' },
      { t: 'info', x: 'Najlepsze Shorty miały w tytule frazy o motywacji i treningu. Długie opisowe tytuły wypadły słabiej.' },
      { t: 'warn', x: 'Ruch z wyszukiwarki to praktycznie zero. Frazy w tytule i opisie to darmowy zasięg.' },
      { t: 'warn', x: 'Widzowie nie wracają (mniej niż 0,1% regularnych). Potrzebna seria i zaproszenie do kanału.' }
    ],
    ideas: [
      { id: 'm-lew', title: 'Lew nie ogląda się za siebie', shout: 'Lew', symbol: 'lew', branch: 'trap',
        premise: 'Samotny przywódca zostaje na czele mimo zdrady. Chłód zamiast krzyku.',
        pairs: ['Honor — nie ma ceny', 'Pazury — milczą do czasu', 'Grzywa — płonie na wietrze', 'Ryk — gasi każdy szept'],
        closing: 'Lew na czele — reszta idzie z tyłu',
        scenes: ['lew na skalnym grzbiecie, burzowe niebo', 'zbliżenie na oko, w źrenicy odbicie ognia', 'cienie cofają się w mgle', 'lew idzie w stronę wschodu słońca'] },
      { id: 'm-runda', title: 'Ostatnia runda', shout: 'Gong', symbol: 'ring', branch: 'trap',
        premise: 'Dwunasta runda, krew w ustach, ręce ciężkie jak beton. Wstajesz na liczeniu.',
        pairs: ['Ręce — ciężkie jak beton', 'Serce — bije jak werbel', 'Oddech — pali jak lód', 'Wola — liczy do dziesięciu i wstaje'],
        closing: 'Ostatnia runda — a ja jeszcze stoję',
        scenes: ['pusty ring i jedno światło', 'zabandażowane dłonie w zbliżeniu', 'pot i kurz w blasku reflektora', 'sylwetka wstaje z maty'] },
      { id: 'm-mlot', title: 'Pod młotem', shout: 'Młot', symbol: 'kowadło', branch: 'stomp',
        premise: 'Ból formuje stal. Każde uderzenie to dzień, którego nie oddasz.',
        pairs: ['Ogień — wyciąga słabość', 'Kowadło — zna moje imię', 'Iskra — zostaje na skórze', 'Stal — pamięta każdy cios'],
        closing: 'Pod młotem rodzi się miecz',
        scenes: ['kuźnia w ciemności, żar', 'młot opada, fruwają iskry', 'rozgrzany miecz w wodzie, para', 'postać z gotową bronią w drzwiach'] },
      { id: 'm-piata', title: 'Piąta rano', shout: 'Piąta', symbol: 'sztanga', branch: 'trap',
        premise: 'Zimny budzik, pusta siłownia, jedno światło. Wygrywasz, zanim świat wstanie.',
        pairs: ['Mróz — za oknem, ogień w żyłach', 'Żelazo — zimne jak decyzja', 'Cisza — pęka pod ciężarem', 'Nawyk — silniejszy niż nastrój'],
        closing: 'Piąta rano — a ja już wygrywam',
        scenes: ['ciemna ulica w mrozie', 'pusta siłownia, światło nad sztangą', 'dłonie w magnezji', 'wschód słońca w oknie'] },
      { id: 'm-byk', title: 'Byk nie zawraca', shout: 'Byk', symbol: 'byk', branch: 'stomp',
        premise: 'Napór, kopyta w piachu, ściana, która pęka pierwsza.',
        pairs: ['Kopyta — orzą arenę', 'Kark — nie zna zakrętów', 'Para — bije z nozdrzy', 'Cel — jest jeden'],
        closing: 'Byk nie zawraca — mur zawraca pierwszy',
        scenes: ['arena w kurzu', 'para z nozdrzy w zbliżeniu', 'szarża w zwolnionym tempie', 'pęknięty mur'] },
      { id: 'm-kruk', title: 'Kruk widzi wszystko', shout: 'Kruk', symbol: 'kruk', branch: 'trap',
        premise: 'Chłodny obserwator. Cierpliwość jako broń, plan zamiast hałasu.',
        pairs: ['Oko — czyta każdy ruch', 'Cień — pada przed ciosem', 'Cisza — to moja strategia', 'Skrzydło — zasłania księżyc'],
        closing: 'Kruk już wie — zanim zrobisz krok',
        scenes: ['kruk na martwym drzewie we mgle', 'oko w zbliżeniu', 'lot nad ruinami', 'sylwetka wojownika w cieniu'] },
      { id: 'm-brama', title: 'Brama pada o świcie', shout: 'Brama', symbol: 'żelazna brama', branch: 'march',
        premise: 'Oblężenie trwa całą noc. O świcie brama ustępuje.',
        pairs: ['Bębny — grzmią w żelazie', 'Tarcza — pęka, ale trzyma', 'Szereg — idzie jak jedno ciało', 'Świt — należy do nas'],
        closing: 'Brama pada o świcie — wchodzimy razem',
        scenes: ['mury w dymie', 'tarcze i włócznie w szeregu', 'taran uderza w bramę', 'światło świtu przez wyłom'] },
      { id: 'm-niedzwiedz', title: 'Niedźwiedź budzi się głodny', shout: 'Niedźwiedź', symbol: 'niedźwiedź', branch: 'trap',
        premise: 'Zimowy sen się kończy, siła wraca po miesiącach ciszy. Powrót po porażce.',
        pairs: ['Łapa — łamie lód', 'Głód — pcha do przodu', 'Ryk — zrywa śnieg z gałęzi', 'Wiosna — należy do mnie'],
        closing: 'Niedźwiedź wstał — las się cofa',
        scenes: ['jaskinia w śniegu', 'otwarte oko w ciemności', 'krok w głębokim śniegu', 'sylwetka we mgle na tle świtu'] },
      { id: 'm-orzel', title: 'Tam, gdzie nikt nie dolatuje', shout: 'Orzeł', symbol: 'orzeł', branch: 'trap',
        premise: 'Wysokość to samotność. Wyżej niż opinie, chmury i ci, co liczyli na upadek.',
        pairs: ['Skrzydło — tnie wiatr', 'Wzrok — widzi przez mgłę', 'Szpon — nie puszcza celu', 'Szczyt — zna jedno imię'],
        closing: 'Orzeł wyżej — reszta patrzy w górę',
        scenes: ['orzeł nad przepaścią, burzowe chmury', 'szpony w zbliżeniu', 'lot w pierwszych promieniach', 'widok z góry na dolinę'] },
      { id: 'm-dyscyplina', title: 'Bez litości dla siebie', shout: 'Dyscyplina', symbol: 'stal', branch: 'stomp',
        premise: 'Żadnych wymówek. Plan, powtórzenia i dzień, którego nie da się oszukać.',
        pairs: ['Plan — nie zna wyjątków', 'Powtórzenie — jest przysięgą', 'Zmęczenie — to tylko opinia', 'Efekt — nie pyta o nastrój'],
        closing: 'Bez litości dla siebie — z szacunkiem dla wyniku',
        scenes: ['zeszyt z planem i sztanga', 'pot w świetle lampy', 'kalendarz z przekreślonymi dniami', 'spojrzenie w lustrze'] }
    ]
  };

  const willa = {
    id: 'willa', name: 'Willa Hayes', handle: '@WillaHayesMusic', lang: 'en',
    url: 'https://youtube.com/@willahayesmusic',
    tagline: 'Late night country. Spokojne, nocne, szczere.',
    palette: { bg: '#080c13', bg2: '#101a2a', accent: '#f2a65a', accent2: '#7fa9d6' },
    stats: { subs: 2, hours: 3.2, views: 1890 },
    publish: { time: '22:30', note: 'Zgodnie z dotychczasowym planem. Dane pokazują Polskę, Japonię i USA, więc warto porównać inne godziny.' },
    dna: {
      genre: 'late night country, spokojny i melancholijny',
      voice: 'intymny kobiecy wokal z przodu miksu, wyraźna dykcja, close-mic, bez rapu, krzyku, opery, EDM i auto-tune',
      themes: ['leaving', 'waiting', 'quiet after goodbye', 'night drive', 'rain', 'small town', 'almost'],
      symbols: ['porch light', 'empty road', 'headlights', 'dress on a clothesline', 'pier at dusk', 'paper on a table', 'open window', 'rain on glass'],
      hashtags: ['#countrymusic', '#latenightcountry', '#sadcountry'],
      tags: ['late night country', 'sad country songs', 'country ballad', 'country music', 'new country', 'acoustic country', 'heartbreak country'],
      used: ['don\'t look back twice', 'i waited too long', 'i\'m already walking', 'only rain came calling', 'you can keep the quiet', 'saving your side', 'frost set in', 'still hanging', 'paper thin', 'halfway gone', 'i left the window open', 'i leave the pins alone'],
      usedSymbols: ['dress on a clothesline', 'paper on a table', 'open window', 'pier at dusk']
    },
    styleVariants: [
      { id: 'ballad', name: 'Wolna ballada', note: 'Z Twojego screena: fortepian, miotełki, pedal steel. Wzorzec startowy.',
        style: 'slow country ballad, 70 bpm, piano and brushed drums, soft pedal steel, lots of space, intimate female vocal in front of the mix, clear diction, close-mic, no rap, no scream, no opera, no EDM, no auto-tune' },
      { id: 'sparse', name: 'Sparse, sama gitara', note: 'Z Twojego screena: solo gitara akustyczna, prawie bez perkusji.',
        style: 'sparse country, 66 bpm, solo acoustic guitar, room vocal, almost no drums, intimate female vocal in front of the mix, clear diction, close-mic, no rap, no scream, no opera, no EDM, no auto-tune' },
      { id: 'twolane', name: 'Szybszy two-lane', note: 'Z Twojego screena: elektryk, suchy snare na 2 i 4, bez pedal steel. Zmienia tempo, gdy kanał robi się monotonny.',
        style: 'faster two-lane country, 108 bpm, electric guitar, dry snare on 2 and 4, no pedal steel, intimate female vocal in front of the mix, clear diction, close-mic, no rap, no scream, no opera, no EDM, no auto-tune' }
    ],
    insights: [
      { t: 'good', x: 'Cały ruch dają Shorty: 431, 369, 216, 136 i 105 wyświetleń. Długie filmy mają po kilkadziesiąt.' },
      { t: 'good', x: 'Tytuł Shorta w formie zdania z tekstu („I waited too long”) działa lepiej niż „Nazwa — late night country”.' },
      { t: 'warn', x: '99,3% widzów to nowi, a w 90 dni przybyły tylko 3 subskrypcje. Shorty nie zamieniają widza w subskrybenta.' },
      { t: 'info', x: 'Odbiorcy: Polska 17,8%, Japonia 3,8%, USA 2,9% (reszta nieznana). Godzina pod USA nie musi być trafiona.' }
    ],
    ideas: [
      { id: 'w-porch', title: 'The porch light stays on', hook: 'I left the porch light on', answer: 'In case you change your mind', symbol: 'porch light',
        premise: 'Czekanie na kogoś, kto obiecał wrócić. Małe rytuały, które trzymają nadzieję.',
        scenes: ['ganek o zmierzchu, jedno ciepłe światło', 'ćmy wokół lampy', 'puste krzesło', 'reflektory na drodze, ale auto przejeżdża dalej'] },
      { id: 'w-marker', title: 'Mile marker thirty-one', hook: 'I passed mile marker thirty-one', answer: 'And I still can\'t say your name', symbol: 'empty road',
        premise: 'Nocna jazda i miejsce na drodze, w którym coś się skończyło.',
        scenes: ['pusta autostrada nocą', 'słupek z numerem w światłach', 'ręka na kierownicy', 'świt na horyzoncie'] },
      { id: 'w-dash', title: 'Dust on the dashboard', hook: 'There\'s dust on the dashboard', answer: 'Where your hand used to be', symbol: 'headlights',
        premise: 'Auto, które pamięta pasażera. Drobne ślady po kimś, kogo nie ma.',
        scenes: ['deska rozdzielcza w półmroku', 'pusty fotel pasażera', 'kurz w świetle latarni', 'zaparowana szyba'] },
      { id: 'w-coat', title: 'I kept your coat', hook: 'I kept your coat', answer: 'But I gave your name away', symbol: 'coat on a chair',
        premise: 'Rzecz zostawiona po rozstaniu i decyzja, co z nią zrobić.',
        scenes: ['płaszcz na oparciu krzesła', 'kuchnia nocą', 'dłoń na kieszeni, w środku klucz', 'drzwi wejściowe lekko uchylone'] },
      { id: 'w-bus', title: 'Last bus out of town', hook: 'Last bus leaves at half past ten', answer: 'And I\'m not on it yet', symbol: 'bus stop',
        premise: 'Wyjazd, który jeszcze się nie odbył. Wahanie na przystanku.',
        scenes: ['samotny przystanek w deszczu', 'rozkład jazdy w świetle lampy', 'torba przy nodze', 'światła autobusu we mgle'] },
      { id: 'w-screen', title: 'The screen door never closed right', hook: 'The screen door never closed right', answer: 'I stopped fixing it the night you left', symbol: 'screen door',
        premise: 'Mały defekt domu jako pamiątka po rozstaniu.',
        scenes: ['siatkowe drzwi na wietrze', 'ganek, wieczorny wiatr', 'narzędzia na parapecie', 'pusty dom i otwarte drzwi'] },
      { id: 'w-coffee', title: 'Coffee gone cold by the window', hook: 'Coffee gone cold by the window', answer: 'Ten years of mornings in a cup', symbol: 'coffee cup',
        premise: 'Poranek, w którym już nikt nie przychodzi do kuchni.',
        scenes: ['kubek na parapecie, mgła na szybie', 'dwie filiżanki, jedna pusta', 'światło poranka', 'ręka sięga po wyłącznik'] },
      { id: 'w-roof', title: 'Rain on the tin roof', hook: 'Rain on the tin roof tonight', answer: 'Sounds a lot like you leaving', symbol: 'tin roof',
        premise: 'Deszcz o blaszany dach jako dźwięk rozstania.',
        scenes: ['blaszany dach w ulewie', 'okno z kroplami', 'lampa i książka', 'światło wschodzi po burzy'] }
    ]
  };

  App.DATA = {
    profiles: [melodia, willa],
    presets: [
      { n: 'Złoto i cyjan', bg: '#0f0c09', bg2: '#1c140b', accent: '#e3b454', accent2: '#41d1f5' },
      { n: 'Zmierzch', bg: '#080c13', bg2: '#101a2a', accent: '#f2a65a', accent2: '#7fa9d6' },
      { n: 'Karmin', bg: '#100809', bg2: '#240f14', accent: '#ff5a64', accent2: '#ffb27a' },
      { n: 'Szmaragd', bg: '#07100d', bg2: '#0d2019', accent: '#4fe0a8', accent2: '#e6e27a' },
      { n: 'Fiolet', bg: '#0b0912', bg2: '#1a1330', accent: '#a98bff', accent2: '#ff8bd2' },
      { n: 'Lód', bg: '#0a0e12', bg2: '#13202b', accent: '#9fe3ff', accent2: '#e8f4ff' }
    ],
    structure: ['Intro', 'Verse 1', 'Pre-Chorus', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Final Chorus', 'Outro'],
    moods: [
      { id: 'chant', n: 'Chór bojowy w refrenie', en: 'massed vocal chant in the chorus' },
      { id: 'orch', n: 'Więcej orkiestry', en: 'bigger cinematic orchestra' },
      { id: 'slow', n: 'Wolniejsze tempo', en: 'slower heavy tempo' },
      { id: 'fast', n: 'Wyższa energia', en: 'high energy, driving tempo' },
      { id: 'bass', n: 'Więcej basu', en: 'extra deep sub-bass' },
      { id: 'dark', n: 'Ciemniej', en: 'darker and more ominous' }
    ]
  };

  App.DATA.stylegen = {
    melodia: {
      genre: ['aggressive Polish hip-hop', 'extreme aggressive gangsta rap with heavy metal fusion', 'cinematic war trap', 'drill with orchestral strings', 'industrial rap metal', 'epic orchestral battle rap', 'dark phonk-trap hybrid', 'nu-metal rap', 'militaristic hip-hop', 'boom-bap with crushing metal guitars', 'gothic trap with church organ', 'rap metal war anthem'],
      groove: ['slow crushing stomp groove, 72 bpm', 'heavyweight trap drums, 140 bpm half-time', 'militaristic marching snare, 98 bpm', 'pounding taiko and war drums, 84 bpm', 'driving double-time drums, 160 bpm', 'heavy halftime breakbeat, 90 bpm', 'rolling hi-hats and 808 slides, 130 bpm', 'slow menacing boom-bap, 80 bpm'],
      lead: ['live orchestral low brass', 'ominous cellos and low strings', 'downtuned palm-muted guitar riffs', 'dark minor-key piano stabs', 'male choir chanting in Latin', 'distorted 808 sub-bass', 'detuned analog synth brass', 'church organ and heavy guitars', 'war horns and timpani', 'tense staccato violins', 'sparse menacing synths', 'cinematic risers and impacts'],
      vocal: ['charismatic deep gritty male rap vocal, forceful clipped delivery', 'commanding male baritone rap-sung', 'fast aggressive double-time male flow', 'slow menacing half-spoken male delivery', 'raw shouted male vocal with melodic hook', 'dense internal rhymes, gritty male baritone'],
      hook: ['massed vocal battle chant chorus', 'anthemic sung hook with gang vocals', 'stripped chorus, single voice over drums', 'call-and-response chorus'],
      mix: ['dramatic beat drop before the hook', 'hard punchy modern mix', 'wide cinematic mix', 'raw gritty mix', 'polished professional club-ready production']
    },
    willa: {
      genre: ['late night country ballad', 'sparse country', 'two-lane country', 'country waltz in 3/4', 'outlaw country shuffle', 'slow-burn country soul', 'americana porch song', 'honky-tonk heartbreak two-step', 'country-blues slow drag', 'alt-country noir', 'dusty desert country', 'country lullaby', 'gospel-tinged country'],
      groove: ['slow, 62 bpm', 'slow, 70 bpm', 'mid-tempo, 88 bpm', 'mid-tempo shuffle, 96 bpm', 'faster, 108 bpm', 'brisk, 118 bpm', 'waltz time, 84 bpm'],
      lead: ['piano', 'brushed drums', 'soft pedal steel', 'solo acoustic guitar', 'electric guitar with light tremolo', 'upright bass', 'fiddle', 'dobro', 'harmonica', 'Wurlitzer', 'fingerpicked banjo', 'lap steel', 'warm organ pad', 'mandolin', 'nylon-string guitar'],
      rhythm: ['almost no drums', 'brushed drums', 'dry snare on 2 and 4', 'soft kick and rim click', 'stomp and clap, no drums', 'lots of space'],
      vocal: ['intimate female vocal in front of the mix, clear diction, close-mic, no rap, no scream, no opera, no EDM, no auto-tune']
    }
  };
})();
