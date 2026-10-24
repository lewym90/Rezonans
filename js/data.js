/* Dane startowe: DNA kanałów wyciągnięte z analizy YouTube Studio i promptów Suno użytkownika. */
(function () {
  const App = (window.App = window.App || {});

  const melodia = {
    id: 'melodia', name: 'Melodia Maszyny', handle: '@MelodiaMaszyny', lang: 'pl',
    url: 'https://youtube.com/@melodiamaszyny',
    tagline: 'Trap, metal i orkiestra. Motywacja, trening, siła.',
    palette: { bg: '#0f0c09', bg2: '#1c140b', accent: '#e3b454', accent2: '#41d1f5' },
    stats: { subs: 22, hours: 49.8, views: 5776 },
    brand: { logo: 'assets/logos/melodia-emblem.png', fx: 'dust', slogan: '' },
    visual: 'epic cinematic photograph, dark teal and gold color grade, volumetric light, smoke and embers, heroic, hyperreal, 35mm, no text, no watermark',
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
      { t: 'good', x: 'Dane z eksportu (2.09 do 20.10, 5776 wyświetleń, 49,8 h, 22 subskrypcje). „Wilk na szczycie” daje 24,2 h oglądania i 9 subskrypcji, czyli ponad 40 % wszystkich.' },
      { t: 'good', x: 'Pełne utwory: 6,1 subskrypcji na 1000 wyświetleń i 91 % godzin oglądania. Shorty: 1,6 na 1000. Shorty mają służyć jako zapowiedź pełnego utworu.' },
      { t: 'good', x: 'Playlisty to 4 % wyświetleń, ale 21 % czasu oglądania (średnio 2:41, 75 % obejrzenia). Każdy nowy utwór trafia na playlistę „Hymny bojowe” i ma ekran końcowy z kolejnym.' },
      { t: 'good', x: 'Krótkie tytuły w trybie rozkazującym mają najlepszą klikalność: „Nie odpuszczaj” 6,5 %, „Gdzie kończy się krew” 4,5 %, „Wstań!” 3,6 %. Średnia kanału to 2,45 %.' },
      { t: 'warn', x: '„Żelazo pod stopą” (pełny utwór) miał 2837 wyświetleń miniatury, klikalność 0,85 % i obejrzenie 7 %. Początek nie trzyma widza. Pierwsze 15 sekund musi mieć mocne wejście.' },
      { t: 'info', x: 'Widownia to 76 % mężczyzn, 59 % to wiek 35 do 54. Grupa 25 do 34 lat to tylko 10 % wyświetleń, ale 37 % czasu oglądania. To najbardziej zaangażowany widz i warto pisać pod niego.' },
      { t: 'info', x: 'Polska to 66 % wyświetleń. Niemcy i Irlandia oglądają prawie do końca, ale to garstka widzów. Angielskie tytuły i opisy mogą otworzyć te kraje.' },
      { t: 'warn', x: 'Po 12 dniach publikowania (2 do 13.09) była przerwa do 15.10 i wyświetlenia spadły do ok. 10 dziennie. Regularność liczy się bardziej niż liczba utworów naraz.' },
      { t: 'warn', x: 'Wyszukiwarka daje 3 % wyświetleń. Tytuły z hashtagami w Shortach nie pomogły. Fraza w pierwszej linii opisu to darmowy zasięg.' }
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

  const warhead = {
    id: 'warhead', name: 'Warhead Bass', handle: '@WARHEAD_BASS', lang: 'en',
    url: 'https://www.youtube.com/@WARHEAD_BASS',
    tagline: 'Armed with bass. Built to break glass.',
    palette: { bg: '#0b0b0d', bg2: '#2a2d33', accent: '#ff4a1c', accent2: '#ffb347' },
    stats: { subs: 0, hours: 0, views: 0 },
    visual: 'dark cinematic photograph, black steel and molten orange glow, sparks and embers, heavy industrial atmosphere, volumetric smoke, hyperreal, 35mm, no text, no watermark',
    brand: { logo: 'assets/logos/warhead.png', fx: 'embers', slogan: 'Turn it up. Load the bar.' },
    publish: { time: '23:30', note: 'Cel to widzowie z USA: 17:00 do 20:00 czasu wschodniego (ET), czyli ok. 23:00 do 2:00 w Polsce. Zaplanuj premierę w Studio z wyprzedzeniem.' },
    dna: {
      genre: 'symphonic heavy metal, industrial, dark rap and sub-bass electronic for night drives, the gym and raw energy',
      voice: 'aggressive male vocals: growl or shouted verses with a clean anthemic chorus, gang vocals on hooks, English lyrics',
      themes: ['lift', 'drive', 'destroy', 'iron', 'night drive', 'war', 'pain into power', 'forge', 'volume'],
      symbols: ['warhead', 'cracked subwoofer', 'forge and sparks', 'night highway', 'barbell', 'speaker wall', 'steel plate', 'hammer', 'smoke and embers', 'war drums'],
      hashtags: ['#heavymetal', '#gymmusic', '#bassboosted'],
      tags: ['heavy metal', 'symphonic metal', 'epic metal', 'gym music', 'workout music', 'gym motivation', 'car music', 'bass boosted', 'car audio', 'night drive', 'industrial metal', 'dark trap', 'hard bass'],
      used: [],
      usedSymbols: []
    },
    styleVariants: [
      { id: 'metal', name: 'Heavy metal i orkiestra (flagowiec)', note: 'Z planu kanału. 128 BPM.',
        style: 'heavy metal, symphonic, cinematic orchestra, brutal drop-tuned guitars, double kick, war drums, choir, epic, aggressive male growl and clean chorus, 128 bpm, massive low end, tight punchy mix, loud mastering' },
      { id: 'rap', name: 'Rap / industrial trap', note: 'Z planu kanału. 140 BPM.',
        style: 'aggressive American rap, hard trap drums, distorted 808, dark orchestral stabs, industrial, 140 bpm, shouted hook, gym anthem, English lyrics, loud mastering' },
      { id: 'car', name: 'Car bass / electronic', note: 'Z planu kanału. 130 BPM, test car audio.',
        style: 'bass house, heavy sub bass, distorted 808s, car audio test, hard kick, midnight drive, dark synth, minimal vocals, 130 bpm, punchy mix' },
      { id: 'gym', name: 'Gym metal-electro', note: 'Z planu kanału. 150 BPM.',
        style: 'industrial metal x hardstyle, pounding kick, saw synth, guitars, shouted gang vocals, 150 bpm, relentless energy, workout' }
    ],
    insights: [
      { t: 'info', x: 'Kanał jest globalny i po angielsku, cel to USA (potem UK, Kanada, Australia). Tytuły, opisy, tagi, miniatury i teksty tylko po angielsku.' },
      { t: 'warn', x: 'Polityka „inauthentic content”: surowy output z Suno wrzucany seryjnie z tą samą grafiką to główny powód odrzucenia monetyzacji. Każdy film ma własne wizualia, a utwór przerobiony (extend, cover, stems) i zmiksowany.' },
      { t: 'info', x: 'Próg YPP: 1000 subskrybentów i 4000 godzin oglądania długich filmów w 12 miesięcy albo 10 mln wyświetleń Shorts w 90 dni.' },
      { t: 'warn', x: 'Prawa komercyjne w Suno tylko na planie płatnym i dla utworów pobranych w trakcie subskrypcji. Utwory z darmowego planu nie nadają się do monetyzacji.' },
      { t: 'good', x: 'Format: single 3 do 4 minut, miksy 60 do 90 minut (godziny oglądania) i codzienny Short z drop-em 20 do 30 s. Publikacje 17:00 do 20:00 ET.' },
      { t: 'info', x: 'Miniatury: ciemne, jeden element (głośnik, wzmacniacz, sztanga), akcent czerwono-pomarańczowy, maksymalnie 3 słowa. Pomijaj kilogramy, używaj funtów.' },
      { t: 'info', x: 'Przy publikacji zaznacz „altered or synthetic content” i sprawdź Copyright Checker w Studio. Mastering głośny, ok. -9 do -8 LUFS, bez przesterów.' }
    ],
    ideas: [
      { id: 'wb-lift', title: 'Lift. Drive. Destroy.', hook: 'Lift. Drive. Destroy.', answer: 'Turn it up and load the bar', symbol: 'barbell', branch: 'gym',
        premise: 'Trzy słowa jako skandowany hook na siłownię i do auta. Gang vocals, ciężki beat.',
        scenes: ['sztanga w czerwonym świetle kuźni', 'iskry z rozgrzanej stali', 'dłonie w magnezji na gryfie', 'ściana głośników i dym'] },
      { id: 'wb-glass', title: 'Built to break glass', hook: 'Built to break glass', answer: 'Turn it up', symbol: 'cracked subwoofer', branch: 'car',
        premise: 'Test car audio: bas, który trzęsie szybami. Nocna jazda, sub i zniekształcone 808.',
        scenes: ['pęknięty subwoofer w bagażniku, pył na membranie', 'autostrada nocą, światła w deszczu', 'szyba drży od basu', 'wnętrze auta w pomarańczowym blasku'] },
      { id: 'wb-warhead', title: 'Armed with bass', hook: 'Armed with bass', answer: 'Fire when ready', symbol: 'warhead', branch: 'metal',
        premise: 'Symfoniczny metal wojenny: głowica, odliczanie, orkiestra i chór.',
        scenes: ['głowica na wyrzutni w mgle', 'bębny wojenne i orkiestra w ciemnej sali', 'chór w czerwonym świetle', 'wybuch i fala uderzeniowa'] },
      { id: 'wb-forge', title: 'Iron and embers', hook: 'Iron and embers', answer: 'This is how we rebuild', symbol: 'forge and sparks', branch: 'metal',
        premise: 'Ból zamienia się w siłę. Kuźnia, młot, rozgrzana stal.',
        scenes: ['kuźnia w półmroku, żar', 'młot opada, iskry w powietrzu', 'rozżarzona stal w wodzie, para', 'sylwetka w drzwiach z gotową bronią'] },
      { id: 'wb-night', title: 'Midnight drive, no brakes', hook: 'Midnight drive, no brakes', answer: 'Sub bass in my chest', symbol: 'night highway', branch: 'car',
        premise: 'Nocna autostrada i ciężki sub. Minimalny wokal, mroczne syntezatory.',
        scenes: ['pusta autostrada, neonowe znaki', 'prędkościomierz w ciemnym wnętrzu', 'tunel i światła w rytm basu', 'świt nad drogą'] },
      { id: 'wb-iron', title: 'Pound for pound', hook: 'Pound for pound', answer: 'I never come down', symbol: 'barbell', branch: 'rap',
        premise: 'Rap industrialny o treningu: funty na gryfie, skandowany hook, 808.',
        scenes: ['talerze na sztandze w świetle sufitowym', 'pot i kurz w blasku lampy', 'ściana luster i cienie', 'sylwetka przy gryfie w ciemnej hali'] }
    ]
  };

  App.DATA = {
    profiles: [melodia, warhead],
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
    warhead: {
      genre: ['symphonic heavy metal', 'industrial metal', 'aggressive American rap with industrial trap', 'bass house', 'industrial metal x hardstyle', 'dark orchestral metal', 'cinematic war metal', 'dark trap with metal guitars', 'hard bass electronic', 'symphonic industrial trap'],
      groove: ['128 bpm', '140 bpm half-time trap drums', '130 bpm', '150 bpm relentless', '120 bpm heavy stomp', '160 bpm double kick', '100 bpm war march'],
      lead: ['brutal drop-tuned guitars', 'cinematic orchestra', 'war drums', 'choir', 'distorted 808s', 'heavy sub bass', 'saw synth', 'dark orchestral stabs', 'pounding kick', 'low brass', 'industrial percussion', 'detuned synth lead'],
      vocal: ['aggressive male growl and clean chorus', 'shouted gang vocals', 'aggressive male rap vocal, shouted hook', 'minimal vocals', 'powerful clean male vocal with gang chant'],
      hook: ['chanted one-line hook like Lift. Drive. Destroy.', 'anthemic chorus with gang vocals', 'chanted one-line hook'],
      mix: ['massive low end, tight punchy mix, loud mastering', 'car audio test, punchy mix', 'wide cinematic mix, loud mastering']
    }
  };
})();
