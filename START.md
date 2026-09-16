# ARGUS OSINT Studio — jeden folder

Wszystko znajduje się w folderze `argus`, bez podfolderów. Pliki aplikacji, biblioteki, czcionki, instrukcje i przykładowy raport leżą obok `index.html`.

## Publikacja

1. Rozpakuj ZIP i otwórz folder `argus`.
2. Prześlij całą jego zawartość do katalogu głównego repozytorium GitHub.
3. W Settings → Pages wybierz Deploy from a branch → main → / (root) → Save.
4. Otwórz adres HTTPS podany przez GitHub Pages.

Nie trzeba kompilować aplikacji, zmieniać ścieżek ani konfigurować API. Nie uruchamiaj jej przez dwuklik w index.html — PWA wymaga HTTPS albo localhost.

Na początek wybierz „Otwórz przykład fikcyjny”. Pełna instrukcja jest w README.md, wyniki testów w WYNIKI-TESTOW.md, a przykładowy dokument w PRZYKLADOWY-RAPORT.pdf. Dokumenty dołączone do paczki zawierają wyłącznie dane demonstracyjne i można opublikować je wraz z aplikacją.

Własne projekty i materiały pozostają w lokalnej bazie przeglądarki. Nie przesyłaj rzeczywistych raportów ani kopii .osintpkg do publicznego repozytorium. Regularnie pobieraj zaszyfrowane kopie. Hasło zabezpiecza plik kopii, nie lokalną bazę.

Przy aktualizacji istniejącej strony wgraj nowe pliki, zamknij wszystkie okna ARGUS i otwórz stronę ponownie. Przed aktualizacją wyeksportuj projekty; nie czyść danych witryny.
