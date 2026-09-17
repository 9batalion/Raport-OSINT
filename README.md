# ARGUS OSINT Studio 1.0

Aktualizacja 1.5.0: lewa nawigacja prowadzi przez rozdziały w kolejności spisu treści: 01–08 → Własne rozdziały → 09–11. Każdy rozdział ma własny ekran, edytowalną treść oraz właściwy rejestr, jeśli dotyczy. Przyciski Wstecz / Dalej prowadzą do sąsiednich kroków; po zamknięciu raportu prowadzą do kontroli jakości. Nowy projekt otwiera rozdział 01, z dostępem do metryki i presetów. Pulpit, cały raport i eksport, kontrola jakości, zadania oraz narzędzia pozostają dostępne poza numeracją rozdziałów. Kliknięcie kroku zapisuje bieżące zmiany przed przejściem. Wciąż można przejść bezpośrednio do dowolnego rozdziału, np. dodać źródło przed opisaniem ustalenia. Wszystkie rozdziały są dostępne w edytorze również przy wybranym eksporcie skróconym; taki eksport zachowuje dotychczasowe pomijanie części rejestrów.

Przy publikacji dołącz nowy moduł `workflow.js` i aktualny `sw.js`. Test `node verify-workflow.mjs` sprawdza zgodność nawigacji ze spisem treści, 12 kroków, renderowanie rejestrów, przyciski przejść oraz zapis wszystkich 17 pól w symulowanym DOM. Pełnego testu wizualnego w przeglądarce nie wykonano.

Aktualizacja 1.4.0: ciągły skład rozdziałów w PDF i ODT. Okładka i spis treści pozostają wydzielone; pozostałe rozdziały zajmują nową stronę tylko w razie potrzeby. Ten sam pełny wzór PDF skrócił się z 14 do 6 stron. Zaktualizowano także Word: 5 zamiast 13 stron. Rozmiar dokumentu zależy od treści.

Raport → „Presety oszustw (20)” otwiera wybór scenariusza i podgląd pytań oraz materiałów. Zastosowanie presetu zastępuje puste pola, niezmienione teksty ogólnego wzoru i niezmienione treści poprzedniego presetu. Własne opisy i rejestry pozostają zachowane; komunikat podaje liczbę zmienionych i zachowanych pól. Dlatego raport po zastosowaniu presetu może nadal zawierać wcześniejsze własne treści — należy je przejrzeć w kontekście nowego scenariusza. Wszystkie teksty można edytować. Preset nie tworzy fikcyjnych ustaleń ani nie rozstrzyga kwalifikacji sprawy.

Scenariusze: zakup na portalu ogłoszeniowym; fałszywy sklep; BLIK; podszycie pod bank; dopłata do przesyłki; fałszywa zaległość za usługę; link do odbioru pieniędzy; fałszywa inwestycja; inwestycja w kryptowaluty; relacja romantyczna; podszycie pod rodzinę; podszycie pod instytucję; BEC / CEO; podmiana rachunku na fakturze; fałszywa praca; płatne zadania; fałszywy wynajem; pożyczka z opłatą wstępną; wykorzystanie cudzej tożsamości; fałszywe odzyskiwanie środków.

Treści presetów są autorskimi wskazówkami do analizy, inspirowanymi publicznymi opisami mechanizmów: [CERT Polska — płatności](https://cert.pl/baza-wiedzy/niebezpieczne-platnosci/), [CERT Polska — inwestycje](https://cert.pl/falszywe-inwestycje/), [Europol — scenariusze oszustw](https://www.europol.europa.eu/operations-services-and-innovation/public-awareness-and-prevention-guides/take-control-of-your-digital-life). Nie są formularzami ani procedurami tych organizacji. Przy publikacji dołącz nowy plik `fraud-presets.js` i aktualny `sw.js`. Przykład: `PRESET-BLIK.odt`.

Aktualizacja 1.3.0: nowe projekty otrzymują edytowalne treści wyjściowe dla rozdziałów 01–11 oraz opcjonalny „Własny rozdział”. Cel, pytania i zakres są dostępne również w edytorze raportu. Wprowadzenia do rejestrów pojawiają się w PDF i ODT przed wpisami. Wypełnij fragmenty w nawiasach kwadratowych i usuń niepotrzebne wskazówki. Wzór nie tworzy fikcyjnych podmiotów, źródeł ani ustaleń.

W istniejącym projekcie wybierz Raport → „Uzupełnij puste pola wzorem”. Operacja wypełnia wyłącznie puste pola, zachowuje własne treści i dodaje własny rozdział tylko wtedy, gdy lista rozdziałów jest pusta. Samo otwarcie lub eksport starego projektu nie wstawia domyślnych treści. Każdy fragment można zmienić albo usunąć. Przy publikacji dołącz `report-defaults.js`. Przykład pełnego wzoru: `WZOR-RAPORTU.odt` i `WZOR-RAPORTU.pdf`.

Aktualizacja 1.2.0: dodano edytowalny eksport ODT. W sekcji Raport wybierz „Generuj PDF / ODT”, a następnie format ODT i zakres pełny lub publiczny. Dokument zawiera metrykę, rozdziały, klikalny spis treści, źródła, wykaz materiałów, opcjonalny graf i obrazy. ODT zachowuje stylistykę wzoru, a edytor tekstu ustala podział stron. Manifest SHA-256 dotyczy pobranego pliku; po jego edycji skrót będzie inny. Podgląd w aplikacji nadal pokazuje PDF. Nowy plik `odt.js` trzeba przesłać wraz z pozostałymi plikami aplikacji. Eksport działa lokalnie, bez dodatkowych usług.

Przykład: `PRZYKLADOWY-RAPORT.odt`. Testy: `node verify-odt.mjs` z katalogu nadrzędnego projektu. Weryfikacja obejmuje pakiet ZIP, XML, znaki specjalne, pełny i publiczny zakres, wariant skrócony, długą treść oraz otwarcie w LibreOffice i renderowanie grafu SVG. Nie sprawdzono Microsoft Word ani osadzania obrazów przez rzeczywistą przeglądarkę. Implementację pakietu oparto na [specyfikacji OpenDocument 1.3, część 2](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part2-packages/OpenDocument-v1.3-os-part2-packages.html).

Aktualizacja 1.1.0: uniwersalny „Raport z ustaleń”, zgodny strukturą i stylistyką z wzorem RAPORT.docx. Jasne tło, subtelny akcent marginesowy, 11 rozdziałów, metryka sprawy i miejsce na podpis. Ustawienia projektu zawierają numer sprawy, datę i miejsce, okres oraz wersję. Edytor raportu zawiera dalsze czynności i weryfikację. Podgląd otwiera rzeczywisty PDF. Dane i rejestry dotychczasowych projektów pozostają zachowane. Domyślny profil nowych projektów to „Raport uniwersalny”; starsze profile korzystają z nowej stylistyki. Warianty skrócone nadal pomijają część rejestrów.

Wzór Word jest edytowalnym dokumentem do wypełnienia. ARGUS automatycznie wypełnia odpowiadające mu rozdziały danymi projektu i dostosowuje liczbę stron do treści. Nie jest to eksport DOCX ani odwzorowanie podziału stron Worda dla dowolnej treści. Własne rozdziały pojawiają się przed wykazem źródeł. Pola „Weryfikacja / akceptacja” oraz linia podpisu nie wykonują podpisu elektronicznego.

Przy publikacji prześlij również nowy plik `report-template.js`. Po aktualizacji zamknij wszystkie okna aplikacji i otwórz ją ponownie; nie czyść danych witryny.

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
