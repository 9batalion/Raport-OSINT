# ARGUS OSINT Studio 1.0

Polska, lokalna aplikacja PWA do dokumentowania dochodzeń i tworzenia raportów PDF. Nie wymaga konta, kluczy API, kompilowania ani serwera aplikacyjnego.

## Publikacja na GitHub Pages

1. Rozpakuj paczkę. Otwórz folder `argus`.
2. Utwórz repozytorium GitHub i prześlij **zawartość** tego folderu (index.html musi znaleźć się w katalogu głównym repozytorium). Wszystkie pliki są w jednym folderze, bez podfolderów.
3. W repozytorium: Settings → Pages → Build and deployment → Deploy from a branch.
4. Wybierz gałąź `main`, katalog `/ (root)` i Save.
5. Po zakończeniu publikacji otwórz adres pokazany w sekcji Pages.

Nie przesyłaj do repozytorium rzeczywistych raportów, materiałów ani plików `.osintpkg`. Repozytorium zawiera tylko aplikację. Nie trzeba edytować ścieżek dla adresu `uzytkownik.github.io/nazwa-repo/`.

## Pierwsze uruchomienie

Utwórz projekt albo wybierz fikcyjne demo. Kolejność pracy: Źródła → Materiały → Podmioty → Ustalenia → Relacje / Oś czasu / Hipotezy → Raport → Kontrola jakości → Generuj PDF.

Pola formularzy zapisują się po zatwierdzeniu. Teksty raportu zapisują się automatycznie po krótkiej przerwie w pisaniu oraz po opuszczeniu pola. Każda operacja zapisu czeka na zakończenie transakcji IndexedDB. Zapis dotyczy konkretnej przeglądarki, urządzenia i originu. Zalecana jedna otwarta karta ARGUS na danym urządzeniu (aplikacja blokuje drugą kartę, jeśli dostępne jest Web Locks API).

Na iPhone: Safari → Udostępnij → Do ekranu początkowego. Na komputerze / Androidzie: instalacja aplikacji w menu przeglądarki. Do instalacji i szyfrowania wymagane HTTPS lub localhost. Poczekaj na komunikat o gotowości offline. PDF i oba fonty są przechowywane lokalnie w pamięci offline. Nie otwieraj index.html przez `file://` — moduły, PWA i baza nie będą działać prawidłowo.

## Co działa

- wiele projektów; rejestry z tworzeniem, edycją, koszem i przywracaniem;
- źródła z cytatami, datami, wiarygodnością i niezależnością;
- podmioty, relacje i graf SVG, chronologia, zadania oraz hipotezy;
- ustalenia: fakt, ocena, pewność, źródła za/przeciw i materiały;
- import materiałów (15 MB na plik, 100 MB łącznie na projekt), SHA-256 i wykrywanie duplikatów;
- redakcja kopii obrazów PNG/JPEG/WebP: wypalone czarne maski, bez warstwy z oryginałem;
- lokalny edytor raportu z własnymi rozdziałami i kolejnością;
- PDF z tekstem, polskimi znakami, spisem treści, paginacją, grafem, źródłami, linkami oraz obrazami;
- pełny i publiczny zakres PDF oraz warianty skrócone;
- manifest SHA-256 PDF i materiałów;
- jawny lub szyfrowany eksport/import projektu z załącznikami;
- punkty przywracania opisów (10 ostatnich) i dziennik (500 wpisów);
- lokalne narzędzia ekstrakcji, nagłówków e-mail, WHOIS, czasu, skrótu i porównywania wierszy;
- wyszukiwanie w bieżącym rejestrze, jasny i ciemny motyw, układ mobilny.

## Ważne ograniczenia i bezpieczeństwo

Lokalna baza IndexedDB **nie jest szyfrowana**. Chroniona hasłem jest wyłącznie kopia eksportu. Nie jest to system do przechowywania informacji niejawnych ani automatycznie zatwierdzone narzędzie służbowe. Użycie materiałów służbowych wymaga stosownych zasad i zgód organizacji.

Pobieraj regularnie kopie w „Kopie i historia”. Czyszczenie danych przeglądarki, utrata urządzenia lub usunięcie strony może usunąć bazę. Pamięć trwała nie zastępuje backupu. Nie ma synchronizacji ani odzyskiwania hasła.

Format szyfrowany: PBKDF2-SHA256 (310 000 iteracji, losowa sól 16 bajtów), AES-256-GCM (losowy IV 12 bajtów). Hasło nie jest zapisywane. Import tworzy osobny projekt i weryfikuje SHA-256 wszystkich materiałów. Zachowuje bieżące rekordy, kosz i dziennik; lokalne punkty przywracania są zerowane przy imporcie. Limit importu: 160 MB, 5000 rekordów w każdym rejestrze, 200 własnych rozdziałów. Limity pamięci konkretnej przeglądarki mogą być niższe; wielkie projekty należy dzielić.

Znacznik „Wewnętrzny” wyklucza cały rekord z publicznego PDF. Nie usuwa nazw z innych akapitów ani informacji z obrazów. Własne rozdziały również można oznaczyć jako wewnętrzne. Zawsze przeglądaj publiczny raport. Przed publikacją redakcji oznacz oryginalny obraz jako wewnętrzny. Eksport projektu `.osintpkg` zawsze zawiera pełne dane, w tym kosz i historię.

Materiały binarne nie są osadzane jako załączniki PDF. Dokument zawiera ich wykaz; wspierane obrazy mogą zostać osadzone. PDF nie jest PDF/A, nie ma podpisu kwalifikowanego ani zaufanego znacznika czasu. Dziennik jest lokalny i edytowalny; hash nie dowodzi prawdziwości treści. Nie należy interpretować wykresu relacji jako automatycznej oceny winy.

Nie ma automatycznego pobierania stron, OCR, AI, map geograficznych ani integracji API. Parsery WHOIS i e-mail porządkują podany tekst, nie weryfikują jego autentyczności. Nagłówki i informacje rejestrowe trzeba samodzielnie sprawdzić. Warianty profili zmieniają etykietę raportu; dwa szablony skrócone pomijają rejestry podmiotów, relacji, osi czasu i hipotez.

Brak telemetrii w kodzie. Otwarcie zewnętrznego źródła lub wyszukiwarki ujawnia zapytanie dostawcy; GitHub może rejestrować wejście na stronę. Aplikacja nie wysyła danych projektu. Nie instaluj jej obok niezaufanych aplikacji na tym samym originie i chroń konto repozytorium — aktualizacja kodu ma dostęp do lokalnej bazy po uruchomieniu.

## Aktualizacja

Zrób kopie projektów. Zastąp pliki aplikacji i zmień wersję CACHE w sw.js przy każdej kolejnej publikacji. Po komunikacie o aktualizacji zamknij wszystkie karty i okna ARGUS, następnie otwórz ponownie. Nie czyść danych witryny. Zmiana domeny tworzy nową przestrzeń danych — przenieś projekty przez eksport/import.

## Lokalnie dla programisty

W katalogu argus uruchom `python -m http.server 8080`, następnie otwórz `http://localhost:8080`. Pliki są zwykłymi modułami JavaScript. Raport testów znajduje się w pliku `WYNIKI-TESTOW.md` w tym samym folderze. Testy logiki oraz symulowanego DOM nie zastępują testów Safari, instalacji PWA i rzeczywistego trybu offline.

Biblioteki: pdf-lib 1.17.1 (MIT), @pdf-lib/fontkit 1.1.1 (MIT), DejaVu Sans (licencja w LICENSE-DejaVu.txt). Zależności są dołączone lokalnie, bez CDN. Pliki źródłowe aplikacji są dołączone w całości do dalszej modyfikacji.
