// Editable starting text. Brackets identify content that still needs completion.
export const PROJECT_DEFAULTS = {
  goal: "Celem raportu jest uporządkowanie i ocena informacji dotyczących [przedmiot sprawy] oraz przedstawienie ustaleń istotnych dla [cel czynności]. Raport ma wskazywać podstawy ustaleń, występujące rozbieżności i kwestie wymagające dalszego wyjaśnienia.",
  questions: "1. Jakie okoliczności wymagają ustalenia? [opisz]\n2. Jakie podmioty, identyfikatory, zdarzenia i powiązania mają znaczenie dla sprawy? [wskaż]\n3. Które informacje znajdują potwierdzenie w materiałach, a które wymagają weryfikacji? [wskaż]",
  scope: "Zakres przedmiotowy: [obszary objęte analizą].\nZakres czasowy: [okres od–do; strefa czasowa, jeśli dotyczy].\nMateriały objęte analizą: [rodzaje i identyfikatory].\nPoza zakresem pozostają: [obszary wyłączone i powody].",
};

export const REPORT_DEFAULTS = {
  method: "Przy opracowaniu raportu należy oddzielać obserwacje wynikające z materiałów od ocen i hipotez. Każde istotne ustalenie powinno wskazywać źródło lub materiał umożliwiający jego sprawdzenie.\nWykonane czynności: [opisz kolejność, daty i osoby wykonujące].\nSposób pozyskania i weryfikacji informacji: [opisz].\nUżyte narzędzia i wersje: [wymień lub wpisz „nie dotyczy”].\nSposób dokumentowania czasu, przechowywania oryginałów i wykonywania kopii: [opisz].",
  summary: "Raport dotyczy [przedmiot] w okresie [okres]. Opracowanie obejmuje [zakres materiałów i czynności].\nNajważniejsze ustalenia: [podaj 3–5 krótkich punktów z identyfikatorami ustaleń].\nZnaczenie ustaleń dla celu raportu: [opisz].\nNajważniejsze kwestie nierozstrzygnięte i ograniczenia: [wskaż].\n[Uzupełnij streszczenie po zakończeniu części analitycznej; nie przedstawiaj hipotez jako potwierdzonych faktów.]",
  entitiesIntro: "W tej części należy opisać podmioty i identyfikatory istotne dla sprawy. Dla każdego wpisu wskaż rodzaj, nazwę lub identyfikator, aliasy, podstawę identyfikacji i źródła. Zbieżność nazw lub identyfikatorów wymaga odrębnej weryfikacji.\nZakres identyfikacji i zastrzeżenia: [uzupełnij].",
  findingsIntro: "Ustalenia należy przedstawiać jako odrębne, możliwe do sprawdzenia obserwacje. Każdy wpis powinien zawierać opis faktu, ocenę analityczną, poziom pewności z uzasadnieniem oraz odwołania do źródeł i materiałów. Uwzględnij informacje potwierdzające, przeczące i alternatywne wyjaśnienia.\nZasady oceny pewności przyjęte w raporcie: [opisz].",
  relationsIntro: "W tej części należy przedstawić powiązania pomiędzy zidentyfikowanymi podmiotami. Dla każdej relacji wskaż jej rodzaj, okres, podstawę źródłową i stopień potwierdzenia. Samo współwystępowanie danych nie przesądza o istnieniu relacji.\nKontekst i ograniczenia analizy powiązań: [uzupełnij].",
  chronologyIntro: "Chronologia powinna porządkować zdarzenia według czasu ich wystąpienia. Odróżniaj datę zdarzenia od daty publikacji, pozyskania lub importu materiału. Przy datach przybliżonych zaznacz niepewność; przy godzinach wskaż strefę czasową.\nZakres chronologii i przyjęte zasady datowania: [uzupełnij].",
  hypothesesIntro: "Hipotezy służą wyjaśnianiu kwestii nierozstrzygniętych i nie stanowią ustalonych faktów. Dla każdej hipotezy wskaż argumenty za i przeciw, alternatywy oraz informacje potrzebne do jej weryfikacji.\nGłówne kwestie wymagające wyjaśnienia: [wymień].",
  conclusions: "Na podstawie opisanych ustaleń należy sformułować odpowiedzi na pytania określone w celu raportu.\n1. [Wniosek i identyfikatory ustaleń stanowiących jego podstawę].\n2. [Wniosek i podstawa].\nKwestie, co do których nie można sformułować jednoznacznej oceny: [wskaż i uzasadnij].",
  limitations: "Kompletność materiałów: [opisz braki lub wpisz, że nie stwierdzono ich w określonym zakresie].\nWiarygodność i niezależność źródeł: [zastrzeżenia].\nSprzeczności i niepewność identyfikacji lub datowania: [opisz].\nOgraniczenia metod i narzędzi: [wskaż].\nWpływ powyższych ograniczeń na wnioski: [oceń].",
  nextSteps: "1. [Czynność do wykonania, jej cel i powiązana kwestia do wyjaśnienia].\n2. [Materiał do pozyskania lub informacja do sprawdzenia].\n[Jeśli nie proponujesz dalszych czynności, wpisz „Nie wskazano dalszych czynności” i podaj uzasadnienie.]",
  sourcesIntro: "Wykaz źródeł powinien umożliwiać odtworzenie podstaw ustaleń. Każdy wpis powinien zawierać jednoznaczny identyfikator, autora lub wydawcę, lokalizację źródła, daty publikacji i dostępu, istotny fragment treści oraz ocenę wiarygodności i niezależności.\nZasady oznaczania i weryfikowania źródeł: [uzupełnij].",
  materialsIntro: "Wykaz materiałów powinien łączyć identyfikator materiału z nazwą pliku, źródłem, sposobem i czasem pozyskania oraz opisem jego znaczenia. Dla plików wskaż skrót SHA-256, jeśli jest dostępny. Opisz przechowywanie oryginałów, wykonane kopie i przekształcenia. Obrazy i zrzuty powinny mieć podpisy pozwalające powiązać je z ustaleniami.\nZasady przechowywania i opisu materiałów: [uzupełnij].",
  closingIntro: "Raport sporządzono w celu wskazanym w części 01, na podstawie materiałów opisanych w wykazach.\nStan informacji na dzień: [data].\nWersja i zakres ostatniej zmiany: [uzupełnij].\nStatus opracowania: [roboczy / zakończony].\n[Przed zamknięciem sprawdź zgodność odwołań, kompletność wykazów i usuń niewypełnione fragmenty wzoru.]",
  review: "[Imię i nazwisko / identyfikator osoby weryfikującej, data i zakres weryfikacji; jeśli nie przeprowadzono weryfikacji, wpisz to wprost.]",
};
export const REPORT_FIELDS = [
  ["goal", "01 / Cel"], ["questions", "01 / Pytania do wyjaśnienia"], ["scope", "01 / Zakres"], ["method", "01 / Metodyka"],
  ["summary", "02 / Streszczenie"], ["entitiesIntro", "03 / Podmioty i identyfikatory — wprowadzenie"],
  ["findingsIntro", "04 / Ustalenia — wprowadzenie"], ["relationsIntro", "05 / Powiązania — wprowadzenie"],
  ["chronologyIntro", "06 / Chronologia — wprowadzenie"], ["hypothesesIntro", "07 / Hipotezy i kwestie do wyjaśnienia — wprowadzenie"],
  ["conclusions", "08 / Wnioski"], ["limitations", "08 / Ograniczenia"], ["nextSteps", "08 / Dalsze czynności"],
  ["sourcesIntro", "09 / Wykaz źródeł — wprowadzenie"], ["materialsIntro", "10 / Wykaz materiałów i załączniki — wprowadzenie"],
  ["closingIntro", "11 / Zamknięcie raportu"], ["review", "11 / Weryfikacja / akceptacja"],
];
export const CUSTOM_DEFAULT = { title: "Własny rozdział", text: "[Nadaj rozdziałowi tytuł odpowiadający jego treści lub usuń rozdział, jeśli nie jest potrzebny.]\nCel rozdziału: [uzupełnij].\nOpis zagadnienia lub wykonanych czynności: [uzupełnij].\nUstalenia i ich podstawa: [wskaż identyfikatory źródeł, materiałów i ustaleń].\nZnaczenie dla sprawy i ograniczenia: [opisz]." };

export function fillReportDefaults(p) {
  for (const [key,value] of Object.entries(PROJECT_DEFAULTS)) if (!String(p[key] ?? "").trim()) p[key]=value;
  for (const [key,value] of Object.entries(REPORT_DEFAULTS)) if (!String(p.report[key] ?? "").trim()) p.report[key]=value;
  if (!p.report.sections.length) p.report.sections.push({id:crypto.randomUUID(),...CUSTOM_DEFAULT,sources:[],private:false});
  return p;
}
