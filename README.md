# Rezonans

CREATE. PRODUCE. RELEASE. Studio dla twórców muzyki AI: od pomysłu do publikacji. Aplikacja działa w przeglądarce (PWA), bez serwera i bez kosztów.

Adres: https://lewym90.github.io/Rezonans/

## Kanały
- **Melodia Maszyny** (@MelodiaMaszyny, po polsku): agresywny polski rap i trap z orkiestrą, metalowy marsz. Motywacja i trening.
- **Warhead Bass** (@WARHEAD_BASS, po angielsku, cel USA): symfoniczny heavy metal, industrial, dark rap, car bass.

Każdy kanał ma DNA (gatunek, wokal, motywy, symbole, tagi, style do Suno, wnioski z YouTube Studio, gotowe pomysły), własne logo, kolory i godziny premier. Kolory całej aplikacji dostosowują się do aktywnego kanału.

## Co potrafi
- **Pomysł**: „Mam pomysł” (ocena dopasowania do kanału i wzmocnienie) albo „Zaskocz mnie” (propozycje z danych kanału, bez powtórek).
- **Pakiet dla Suno z Gemini**: tytuł, 3 warianty Styles (Główny, Luźniejszy, Mocniejszy) z Exclude i suwakami Weirdness i Style Influence, pełny tekst z meta-tagami, kontrola jakości tekstu i wulgaryzmów, prompt do dowolnego czatu AI.
- **Generator Suno**: „Z pomysłu” (jedno zdanie → komplet pól) i „Z piosenki” (analiza odwrotna: pomiar tempa, tonacji i brzmienia, protokół odsłuchu Gemini, dekompozycja, Styles, nowy tekst, porównanie wyniku z Suno ze wzorem).
- **Kreator utworu** w 6 krokach: Suno, mp3, teledysk, publikacja, po premierze, wyniki po 7 dniach.
- **Mam gotowy utwór**: wgraj mp3 zrobione poza aplikacją, a dostaniesz tytuły, opis z rozdziałami, tagi, napisy, tła, miniatury, teledysk 16:9 i Short.
- **Pakiet publikacji**: tytuły, opis, hashtagi, tagi, przypięty komentarz, hooki do Shortów, harmonogram, miniatura.
- **Plan**: plan tygodnia, godziny premier i Shortów, import danych ze Studio, wnioski, droga do monetyzacji, przewodnik od A do Z.
- **Import kanału** z YouTube (opcjonalny klucz YouTube Data API) albo z wklejonych tytułów.
- Układ na telefon, tablet i laptop. Ekran nie gaśnie przy otwartej aplikacji.

## Studio teledysku
Wczytaj mp3, a aplikacja znajdzie tempo i refren, spisze napisy ze słuchu (Gemini) i przygotuje teledysk w stylu marki: jedna grafika w tle (3 propozycje pod temat utworu), logo kanału pulsujące na stopę, błysk, fale i cząstki w rytm basu, tytuł i nazwa kanału. Miniatury: 3 propozycje 16:9 i 3 propozycje 9:16, wybrana jest pierwszym kadrem filmu. Render filmu 16:9 i Shorta 9:16 z refrenu powstaje w przeglądarce. Obrazy generuje Worker z folderu `worker/` (Cloudflare Workers AI, FLUX schnell, darmowy limit). Adres Workera jest w Ustawieniach. Logo leżą w `assets/logos/`.

## Uruchomienie na GitHub Pages
1. Settings → Pages → Source: *Deploy from a branch*, gałąź `main`, katalog `/ (root)`.
2. Otwórz adres w Safari na iPhonie.
3. Udostępnij → *Dodaj do ekranu początkowego*. Aplikacja otworzy się na pełnym ekranie jak natywna.

## Klucze (opcjonalne, darmowe)
Ustawienia w aplikacji. Klucze zostają w pamięci przeglądarki na Twoim urządzeniu, nie trafiają do repozytorium.
- **Gemini** (aistudio.google.com): teksty, pakiety Suno, analiza nagrań, napisy ze słuchu, tła, opisy.
- **YouTube Data API** (Google Cloud Console): import tytułów i wyświetleń kanału.

## Wysyłka na YouTube jako prywatny film
1. Wejdź na console.cloud.google.com i utwórz projekt.
2. APIs & Services → Library → włącz YouTube Data API v3.
3. APIs & Services → OAuth consent screen → External → wypełnij nazwę aplikacji i swój e-mail. W sekcji Test users dodaj swój adres Google i zapisz. Zostaw aplikację w trybie Testing.
4. Credentials → Create credentials → OAuth client ID → Web application. W Authorized JavaScript origins dodaj `https://lewym90.github.io`. Skopiuj Client ID.
5. W aplikacji: Ustawienia → Google OAuth Client ID → wklej.
6. W Studio teledysku po renderze kliknij „Wyślij na YouTube jako prywatny”. W oknie Google wybierz konto i kanał (Melodia Maszyny albo Warhead Bass). Aplikacja sprawdza, na jaki kanał trafi film, ustawia miniaturę i dodaje film do playlisty. Publiczny ustawiasz sam w YouTube Studio.

Projekty API bez weryfikacji i tak zawsze wgrywają filmy jako prywatne.

## Dane ze Studio
Plan → Importuj dane ze Studio. Wybierz pliki ZIP lub CSV wyeksportowane z Analityki (Tryb zaawansowany, zakres Cały czas). Aplikacja odświeży statystyki, wnioski i przewodnik.

## Kopia zapasowa
Ustawienia → Pobierz kopię. Dane (kanały, utwory) są w localStorage tej przeglądarki.

## Plan
- Etap 3: odczyt zrzutów ekranu ze Studio YouTube i uczenie szablonów z wyników.

## Struktura
`index.html`, `css/app.css`, `js/` (data, store, engine, ai, ui, analytics, studio, brand, own, wizard, generator, awake, main), `worker/`, `assets/logos/`, `sw.js`, `manifest.webmanifest`, `icons/`.

## Wersja 47: nowy wygląd i fundament danych
- Wygląd według projektu: nowa ikona, fonty Inter, Manrope i IBM Plex Mono, marka złota, akcenty kanału (Warhead: pomarańcz i fiolet, Melodia: złoto i turkus), grafika nagłówka dla każdego kanału (`assets/hero/`).
- Dziś: Najważniejsze teraz (lista wydania i odliczanie do premiery), Plan na dziś, Najważniejsza decyzja (liczona lokalnie), ostatnie wyniki, dzwonek z powiadomieniami w aplikacji.
- Wyniki i rozwój (dawniej Plan): YouTube Analytics API (darmowe, tylko odczyt), wykres 7/28/90 dni, porównanie z poprzednim okresem, wnioski z poziomem pewności, prognoza progu z wahaniami.
- Studio: 4 kroki (Analiza, Napisy, Tła, Render), przełączane efekty zapisywane dla kanału (logo, błyski, fale, cząstki), kontrola przed renderem (czas, rozmiar, miejsce).
- Dane: wersja schematu z migracjami, mp3 i tła zapisane w IndexedDB, automatyczne kopie w telefonie (codziennie i przed aktualizacją), eksport i import całości (z mp3 lub bez), raport błędów.
- Utwory: duplikowanie projektu, historia zdarzeń.

## Wersja 49: Audio Master Check i Centrum premier
- Audio Master Check (js/master.js), liczony w telefonie: głośność LUFS według ITU-R BS.1770 (zgodna z ffmpeg ebur128), True Peak z nadpróbkowaniem 4x, przestery i ścięte szczyty, dynamika (PLR, LRA), cisza na początku i końcu, balans, korelacja stereo, rozkład pasm, górna granica pasma. Zakresy zależą od gatunku kanału, nie jedna liczba dla wszystkich. Raport pojawia się po wczytaniu mp3 i w karcie utworu.
- Centrum premier w zakładce Utwory: 12 kratek gotowości (termin, plik, jakość, teledysk, miniatura, opis, Shorty, wysyłka, playlista, po premierze, wyniki 7 i 28 dni).
- Kontrola kanału: ostrzeżenie, gdy język tytułu lub tekstu nie pasuje do kanału albo pojawia się nazwa innego kanału (w karcie, w Centrum premier i przed renderem).
- Karta utworu: wybór kanału, wersje tekstu z przywracaniem, wersje parametrów Suno, wyniki po 28 dniach. Dla filmów wysłanych z aplikacji wyniki 7 i 28 dni wpisują się same przy pobraniu danych z YouTube.

## Wersja 50: DNA Track i laboratorium Suno
- DNA Track (Kanały → DNA Track): symbole użyte i nieużyte, najczęstsze motywy, linie powtarzające się między utworami, hasła stylu, tempo, struktury, ostrzeżenie o powtarzanych rozwiązaniach.
- Kontrola podobieństwa do katalogu kanału (tytuł, motywy, refren, styl, symbol, tempo) w Pomyśle, w pakiecie Suno i w karcie utworu.
- Laboratorium Suno (Suno → Biblioteka): style z utworów, wzorców kanału i zapisane z generatora; gwiazdka „sprawdzony”, średnie wyniki utworów, porównanie 2–3 stylów, katalog wokali, instrumentów i struktur.

## Wersja 51: szablony i presety Studio
- 4 szablony animacji (Marka, Słupki, Pierścień, Minimal), wizualizery dźwięku (słupki, fala, pierścień), układ logo i tytułu, intensywność efektów, kolor efektów, czcionka tytułu.
- Presety zapisywane dla kanału; własna grafika jako tło; podgląd miniatury w rzeczywistych rozmiarach YouTube.

## Wersja 52: Rezonans Intelligence i Experiment Lab
- Intelligence (Wyniki): porównanie wyników utworów według wejścia wokalu, długości, pierwszego refrenu, tempa, długości tytułu, godziny premiery i stylu. Każda rekomendacja ma źródło, liczbę utworów, okres, poziom pewności i ograniczenia.
- Experiment Lab (Wyniki): hipoteza, warianty A i B z przypisanymi utworami, miara, automatyczny wynik z ostrzeżeniem o małej próbie, wniosek; tytuły i miniatury przez „Testuj i porównaj” w YouTube.

## Wersja 53: Library, serie i albumy
- Biblioteka zasobów (Kanały): utwory, teksty, prompty i style, grafiki, miniatury, presety, filmy na YouTube, szablony opisu; wyszukiwarka i filtry (typ, kanał, wykorzystanie).
- Serie, EP i albumy (Utwory): koncepcja, plan utworów, przypisane utwory, postęp publikacji; generator w Pomyśle („Seria / EP”) z DNA kanału albo z Gemini.
- W kartach pomysłów: 5 struktur utworu do skopiowania (lokalnie) i 3 alternatywne refreny (Gemini, na kliknięcie). Widownia kanału z prawdziwych danych przy ocenie pomysłu.
- Szablony opisu kanału ({tytuł}, {kanał}); porównanie dwóch wersji pliku w Audio Master Check.

## Historia zmian (skrót)
- v29: zawsze nowy tekst do analizowanego utworu, układ na tablet i laptop.
- v30: Warhead Bass zamiast Willa Hayes, teledysk w stylu marki, miniatury 3+3, ścieżka „Mam gotowy utwór”.
- v31: nowe logo z przezroczystością.
- v32: pełny pakiet Suno z Gemini dla kanału (3 warianty Styles, Exclude, suwaki, cały tekst z meta-tagami).
- v33: przycisk „Mam gotowy utwór” na ekranie Dziś i w Pomyśle.
- v34–v37: jeden styl teledysku (tło i logo w rytm basu, błysk na uderzeniach), tła pod temat utworu, miniatury ze słów tytułu.
- v38–v46: rzetelniejsza analiza „Z piosenki” (protokół odsłuchu, 3 niezależne odsłuchy, wskazówka gatunku i pole BPM, lepszy pomiar tempa, słownik haseł Suno, bez popowych dopisków przy rapie), model pro do analizy nagrań, godziny Shortów.
