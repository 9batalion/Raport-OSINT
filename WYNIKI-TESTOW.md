# Weryfikacja ARGUS OSINT Studio 1.0

## Sprawdzone automatycznie

- składnia modułów JavaScript;
- zapis i odczyt transakcyjny w implementacji testowej IndexedDB;
- eksport/import AES-256-GCM, nieprawidłowe hasło i naruszenie integralności;
- znany wektor SHA-256;
- filtrowanie prywatnych źródeł i czyszczenie odwołań w eksporcie publicznym;
- wykrywanie odwołań do usuniętych rekordów;
- ucieczka HTML i odrzucenie niebezpiecznego schematu URL;
- walidacja identyfikatorów i struktury importu;
- obecność wszystkich lokalnych plików wymaganych przez service workera;
- start aplikacji, wszystkie widoki, formularze tworzenia/edycji źródła, kosz i przywrócenie, własny rozdział oraz zapis treści raportu w symulowanym DOM;
- rzeczywisty silnik PDF: 9-stronicowy raport z długim tekstem, grafem, obrazem, osadzonymi fontami, polskimi znakami i aktywnymi linkami.

Raport PDF został wyrenderowany do obrazów i sprawdzony wizualnie. Testy używają fikcyjnych danych. Testy DOM (jsdom) oraz bazy (fake-indexeddb) nie stanowią testów rzeczywistej przeglądarki.

## Niezweryfikowane w tym środowisku

Brak działającego Chromium uniemożliwił uruchomienie testu end-to-end. Nie potwierdzono wizualnie interfejsu w rzeczywistej przeglądarce, instalacji PWA, działania service workera offline, gestów redakcji obrazu ani zgodności z Safari na iPhone. Ograniczenie nie oznacza, że te funkcje nie zostały zaimplementowane.

## Lista kontroli po publikacji

1. Otwórz demo, dodaj źródło i przeładuj stronę — dane powinny pozostać.
2. Dodaj obraz, zredaguj kopię i sprawdź ją po pobraniu. Oryginał oznacz jako wewnętrzny.
3. Wygeneruj pełny oraz publiczny PDF; sprawdź różnice, linki i polskie znaki.
4. Pobierz zaszyfrowany projekt, zaimportuj go jako nowy i porównaj materiały.
5. Poczekaj na gotowość offline, odłącz Internet, przeładuj stronę i wygeneruj PDF.
6. Zainstaluj PWA na docelowym urządzeniu; sprawdź układ, formularze i pobieranie plików.
7. Sprawdź blokadę drugiego okna, jeżeli przeglądarka obsługuje Web Locks.

Do czasu takiego testu używaj materiałów demonstracyjnych i zachowuj oryginały poza aplikacją.
