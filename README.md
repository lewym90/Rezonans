# Rezonans

Od pomysłu do publikacji: studio dla twórców muzyki z Suno. Aplikacja działa w przeglądarce (PWA), bez serwera i bez kosztów.

## Co potrafi (etap 1)
- **Kanały** z DNA (gatunek, motywy, symbole, style do Suno, dane z YouTube Studio). Start: Melodia Maszyny i Willa Hayes. Kolory całej aplikacji dostosowują się do aktywnego kanału.
- **Pomysł**: „Mam pomysł" (ocena dopasowania do kanału i wzmocnienie) albo „Zaskocz mnie" (propozycje z danych kanału).
- **Pakiet dla Suno**: tytuł, prompt stylu (limit 1000 znaków), tekst (limit 5000), kontrola wulgaryzmów, prompt do dowolnego czatu AI. Opcjonalnie tekst z Gemini.
- **Pakiet publikacji**: tytuły, opis, hashtagi, tagi, przypięty komentarz, hooki do Shortów, harmonogram, miniatura.
- **Plan tygodnia**, checklista z licznikiem, wyniki utworów i wnioski.
- **Import kanału** z YouTube (opcjonalny klucz YouTube Data API) albo z wklejonych tytułów.

## Uruchomienie na GitHub Pages
1. Utwórz nowe repozytorium na GitHubie i wgraj zawartość tego folderu (plik `index.html` w głównym katalogu).
2. Settings → Pages → Source: *Deploy from a branch*, gałąź `main`, katalog `/ (root)`.
3. Otwórz adres `https://TWOJ-LOGIN.github.io/NAZWA-REPO/` w Safari na iPhonie.
4. Udostępnij → *Dodaj do ekranu początkowego*. Aplikacja otworzy się na pełnym ekranie jak natywna.

## Klucze (opcjonalne, darmowe)
Ustawienia w aplikacji. Klucze zostają w pamięci przeglądarki na Twoim urządzeniu, nie trafiają do repozytorium.
- **Gemini** (aistudio.google.com): teksty piosenek, wzmacnianie pomysłów, ulepszanie opisów.
- **YouTube Data API** (Google Cloud Console): import tytułów i wyświetleń kanału.

## Kopia zapasowa
Ustawienia → Pobierz kopię. Dane (kanały, utwory) są w localStorage tej przeglądarki.

## Plan
- Etap 2: studio teledysków (sceny z analizy utworu, ruch kamery, napisy w rytm, wizualizer, render 16:9 i 9:16).
- Etap 3: odczyt screenów ze Studio YouTube i uczenie szablonów z wyników.

## Struktura
`index.html`, `css/app.css`, `js/` (data, store, engine, ai, ui, main), `sw.js`, `manifest.webmanifest`, `icons/`.

## Studio teledysku
W karcie utworu: „Studio teledysku”. Wczytaj mp3 z Suno, aplikacja znajdzie tempo i refren, ułoży cięcia w rytm, dopasuje napisy i wyrenderuje film 16:9, Short 9:16 oraz miniaturę. Obrazy generuje Worker z folderu `worker/` (Cloudflare Workers AI, darmowy limit). Adres Workera wpisz w Ustawieniach.
