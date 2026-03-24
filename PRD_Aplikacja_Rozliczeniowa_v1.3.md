# PRD — Aplikacja Rozliczeniowa dla Lekarzy

**Wersja:** 1.3 — Draft
**Data:** 2026-03-18
**Status:** Do przeglądu

---

## ⚡ PODZIAŁ NA ETAPY — przeczytaj najpierw

Projekt realizowany jest w dwóch etapach. Podział ten jest świadomą decyzją biznesową, uzasadnioną poniżej.

---

### Etap 1 — MVP (obecny zakres dokumentu)

**Co robimy:** Wgrywamy do aplikacji dane już obliczone — podsumowanie rozliczenia oraz listę wizyt. Wszystkie złożone obliczenia (mnożniki kar, bonusy, schodki, edge case'y) są na tym etapie wykonywane ręcznie poza systemem (np. w Excelu) przez osobę przygotowującą rozliczenia. Do aplikacji trafia gotowy wynik.

**Dlaczego tak:**

1. **Szybkie wdrożenie niezależnie od istniejącego systemu.** Integracja z systemem źródłowym wymaga zaangażowania zespołu deweloperskiego i jest czasochłonna. Etap 1 można wdrożyć samodzielnie i szybko, bez czekania na zewnętrzne zasoby.

2. **Eliminacja najbardziej kosztownych ręcznych czynności.** Obecnie rozliczenia wysyłane są mailem do lekarzy zagranicznych, a faktury zbierane z różnych skrzynek i przekazywane działowi finansowemu ręcznie — co jest bardzo czasochłonne i generuje ryzyko błędów. Etap 1 to eliminuje w całości.

3. **Transparentność dla lekarzy.** Wszyscy lekarze — zarówno polscy, jak i zagraniczni — będą mogli podejrzeć szczegóły swojego wynagrodzenia: rozwinąć podsumowanie do poziomu poszczególnych wizyt.

**Zakres Etapu 1:** E0, E1, E3, E4, E5, E6, E7, E8, E9, E10

---

### Etap 2 — Docelowy (poza obecnym zakresem dokumentu)

**Co robimy:** Integracja z systemem źródłowym i automatyczne wyliczanie wynagrodzenia przez silnik rozliczeń (reguły RPL i RGL). Admin nie musi już ręcznie liczyć niczego — system pobiera dane i przelicza kwoty samodzielnie.

**Zakres Etapu 2:** E2 (silnik rozliczeń), integracja z systemem źródłowym, KSeF

> Szczegóły Etapu 2 opisane są w sekcji E2 dla celów dokumentacyjnych, ale **nie są przedmiotem bieżących prac deweloperskich.**

---

## Spis treści

1. [Kontekst i cel projektu](#1-kontekst-i-cel-projektu)
2. [Epiki](#2-epiki)
3. [User Stories](#3-user-stories)
4. [Analiza pliku wsadu](#4-analiza-pliku-wsadu)
5. [Poza zakresem](#5-poza-zakresem-out-of-scope)
6. [Otwarte pytania](#6-otwarte-pytania-i-decyzje-do-podjęcia)
7. [Słownik pojęć](#7-słownik-pojęć)

---

## 1. Kontekst i cel projektu

Obecna aplikacja rozliczeniowa nie oferuje widoku szczegółów wizyt dla lekarzy, wymaga ręcznego przesyłania rozliczeń emailem do lekarzy zagranicznych oraz ręcznego zbierania faktur z różnych skrzynek i przekazywania ich działowi finansowemu.

Nowa aplikacja rozwiązuje te problemy poprzez:

- **Etap 1 (MVP):** Wgrywanie gotowych danych rozliczeniowych z pliku. Panel lekarza z podglądem podsumowania i szczegółów wizyt. Przepływ faktur z OCR. Dashboard statusów. Statusy płatności.
- **Etap 2 (docelowo):** Automatyczna integracja z systemem źródłowym i silnik rozliczeń wyliczający kwoty na podstawie reguł.

### 1.1 Użytkownicy systemu

| Rola | Opis | Kluczowe uprawnienia |
|------|------|----------------------|
| **Lekarz** | Lekarz indywidualny — widzi własne rozliczenie (jedno lub wiele kont powiązanych z jego emailem) | Podgląd rozliczenia (podsumowanie + szczegóły wizyt), zgłaszanie reklamacji do wizyty, akceptacja rozliczenia, upload faktury PDF, zmiana języka interfejsu |
| **Główny Lekarz** | Lekarz będący przedstawicielem grupy rozliczeniowej | Wszystko co Lekarz + podgląd rozliczenia zbiorczego grupy i rozbicia na członków |
| **Admin** | Pracownik operacyjny firmy | Pełne zarządzanie: użytkownicy, wgrywanie/edycja danych rozliczeń, weryfikacja faktur, zatwierdzanie/usuwanie faktur, wysyłka powiadomień, dashboard |
| **Księgowość** | Dział finansowy | Podgląd faktur, zmiana statusów, import potwierdzeń przelewów, eksport do systemu FK, dostęp do dashboardu |

### 1.2 Typy lekarzy

| Typ | Waluta | Dane źródłowe (Etap 1) | Fakturowanie | Specyfika |
|-----|--------|------------------------|--------------|-----------|
| **Lekarze Polscy** | PLN | Wgrywanie z pliku (arkusz "Podsumowanie PL") | Upload PDF lub KSeF (docelowo) | Złożone reguły obliczane poza systemem w Etapie 1 |
| **Lekarze Zagraniczni** | EUR lub GBP (+ przeliczenie na PLN dla admina/księgowości) | Wgrywanie z pliku (arkusz "Podsumowanie GLOBAL") | Upload PDF | Reguły obliczane poza systemem w Etapie 1; widoczność kolumn zależna od kraju lekarza |

> **Rozróżnienie wizualne:** Obok nazwy lekarza wyświetlana jest flaga kraju: PLN → flaga Polski, inna waluta → flaga kraju lekarza.
>
> **Różny układ widoku:** Lekarze polscy i zagraniczni widzą różne kolumny w podsumowaniu i szczegółach — zgodnie ze strukturą pliku wsadu i regułami widoczności.

---

## 2. Epiki

### Etap 1 — MVP

| ID | Nazwa Epiku | Opis | Priorytet |
|----|-------------|------|-----------|
| E0 | Logowanie i uwierzytelnianie | Email jako login. Pierwsze logowanie przez kod. Ustanowienie hasła lub tryb "kod każdorazowo". Wielokrotne konta per email. Dwujęzyczność (PL/EN). | Must Have |
| E1 | Zarządzanie danymi rozliczeń | Wgrywanie gotowych danych (podsumowanie + lista wizyt) z pliku XLSX przez admina. Edycja i uzupełnianie wpisów. | Must Have |
| E3 | Panel Lekarza | Widok bieżącego rozliczenia: podsumowanie i szczegóły wizyt. Akceptacja rozliczenia, zgłaszanie reklamacji, historia miesięcy. | Must Have |
| E4 | Zarządzanie fakturami | Upload faktury PDF, OCR, automatyczna wysyłka, obsługa niezgodności. | Must Have |
| E5 | Panel Księgowości | Przegląd faktur, zmiana statusów, import CSV z przelewami, eksport do FK. | Must Have |
| E6 | Panel Admina | Wgrywanie danych, zarządzanie użytkownikami i grupami, obsługa faktur niezgodnych, powiadomienia, konfiguracja kursu. | Must Have |
| E7 | Powiadomienia i Workflow | Automatyczne emaile: gotowe rozliczenie, brak faktury, reklamacja, niezgodna faktura, usunięcie faktury. | Should Have |
| E8 | Dashboard statusów rozliczeń | Wykres słupkowy 5 statusów per data. Klikalne statusy → lista lekarzy. Historia zmian statusów. | Must Have |
| E9 | Statusy płatności | Import CSV z banku lub ręczna zmiana statusu. "Przelew wysłany" + data zlecenia przelewu. | Must Have |
| E10 | Filtry | Filtrowanie po roku/miesiącu, specjalizacji, lekarzu, statusie. | Must Have |

### Etap 2 — Docelowy (dokumentacja przyszłościowa)

| ID | Nazwa Epiku | Opis | Priorytet |
|----|-------------|------|-----------|
| E2 | Silnik rozliczeń | Automatyczne wyliczanie kwot na podstawie reguł RPL i RGL. | — |
| E1b | Integracja z systemem źródłowym | Automatyczne pobieranie danych z systemu. | — |

---

## 3. User Stories

### E0 — Logowanie, uwierzytelnianie i ustawienia interfejsu

---

#### US-E0-01 — Pierwsze logowanie przez kod emailowy

| | |
|--|--|
| **Aktor** | Lekarz (pierwsze logowanie) |
| **Cel** | Uzyskać dostęp do systemu bez wcześniej ustanowionego hasła. |
| **Kroki** | 1. Lekarz wchodzi na stronę logowania <br> 2. Wpisuje adres email i klika "Zaloguj się" <br> 3. System rozpoznaje że to pierwsze logowanie (brak hasła) i wysyła jednorazowy kod na email <br> 4. Lekarz wpisuje kod w aplikacji <br> 5. System weryfikuje kod i otwiera ekran pierwszego logowania (US-E0-02) |
| **Treść emaila z kodem** | ✓ Temat: np. *"Twój kod dostępu do aplikacji rozliczeniowej Telemedi"* <br> ✓ Kod czytelnie sformatowany (np. 6 cyfr) <br> ✓ Informacja o czasie ważności kodu (np. 15 minut) <br> ✓ Klauzula bezpieczeństwa: *"Jeśli to nie Ty próbowałeś/aś się zalogować, zignoruj tę wiadomość. Twoje konto pozostaje bezpieczne."* <br> ✓ Brak linków do klikania — tylko kod do przepisania (ochrona przed phishingiem) |
| **Acceptance Criteria** | ✓ Kod jest jednorazowy — po użyciu natychmiast traci ważność <br> ✓ Kod wygasa po 15 minutach <br> ✓ Wielokrotne żądania kodu unieważniają poprzedni kod |
| **Priorytet** | **Must Have** |

---

#### US-E0-02 — Ekran pierwszego logowania: ustanowienie hasła lub tryb kodu

| | |
|--|--|
| **Aktor** | Lekarz (po pierwszym wpisaniu kodu z emaila) |
| **Cel** | Wybrać sposób logowania na przyszłość — hasło lub kod emailowy za każdym razem. |
| **Opis ekranu** | Po wpisaniu prawidłowego kodu pojawia się okno dialogowe z dwoma opcjami: <br><br> **Opcja A — Ustanów hasło:** <br> — Pole "Nowe hasło" <br> — Pole "Powtórz hasło" <br> — Walidacja siły hasła (min. 8 znaków, co najmniej 1 cyfra) <br> — Walidacja zgodności obu pól <br><br> **Opcja B — Loguj kodem emailowym za każdym razem:** <br> — Informacja: *"Jeśli nie ustanowisz hasła, przy każdym logowaniu będziesz otrzymywać jednorazowy kod na adres email."* <br> — Wymagany checkbox: *"Rozumiem, że przy każdym logowaniu będę otrzymywać kod na email."* |
| **Przycisk "Przechodzę do serwisu"** | Aktywny **tylko wtedy gdy**: <br> — Opcja A: oba pola hasła wypełnione i zgodne, OR <br> — Opcja B: checkbox zaznaczony |
| **Acceptance Criteria** | ✓ Przycisk "Przechodzę do serwisu" jest nieaktywny (disabled) dopóki nie spełniono warunków jednej z opcji <br> ✓ Przy niezgodności haseł widoczny komunikat błędu, przycisk pozostaje nieaktywny <br> ✓ Wybór jest zapisany: lekarz z hasłem loguje się hasłem, lekarz bez hasła — kodem <br> ✓ Lekarz może później zmienić decyzję w ustawieniach konta |
| **Priorytet** | **Must Have** |

---

#### US-E0-03 — Standardowe logowanie hasłem (kolejne wizyty)

| | |
|--|--|
| **Aktor** | Lekarz / Admin / Księgowość |
| **Cel** | Zalogować się hasłem. |
| **Acceptance Criteria** | ✓ Błędne dane nie ujawniają czy email czy hasło jest nieprawidłowe <br> ✓ Blokada konta po kilku nieudanych próbach <br> ✓ Sesja wygasa po określonym czasie nieaktywności <br> ✓ Hasła przechowywane zahashowane (bcrypt lub argon2) |
| **Priorytet** | **Must Have** |

---

#### US-E0-04 — Logowanie kodem emailowym (kolejne wizyty — lekarz bez hasła)

| | |
|--|--|
| **Aktor** | Lekarz (wybrał Opcję B przy pierwszym logowaniu) |
| **Cel** | Zalogować się kodem przesłanym na email. |
| **Kroki** | 1. Lekarz wpisuje email i klika "Zaloguj się" <br> 2. System wysyła kod (jak w US-E0-01) <br> 3. Lekarz wpisuje kod i uzyskuje dostęp |
| **Acceptance Criteria** | ✓ Przebieg identyczny jak przy pierwszym logowaniu |
| **Priorytet** | **Must Have** |

---

#### US-E0-05 — Odzyskiwanie dostępu / resetowanie hasła

| | |
|--|--|
| **Aktor** | Lekarz / Admin / Księgowość |
| **Cel** | Odzyskać dostęp po zapomnieniu hasła. |
| **Kroki** | 1. Klik "Zapomniałem hasła" na stronie logowania <br> 2. Wpisanie emaila <br> 3. Otrzymanie kodu na email (jak US-E0-01) <br> 4. Po wpisaniu kodu: ekran ustawienia nowego hasła |
| **Acceptance Criteria** | ✓ Email wysyłany zawsze przy podaniu dowolnego adresu (brak enumeracji kont) <br> ✓ Kod jednorazowy, 15 min ważności |
| **Priorytet** | **Must Have** |

---

#### US-E0-06 — Wiele kont lekarza powiązanych z jednym emailem

| | |
|--|--|
| **Aktor** | Lekarz |
| **Cel** | Po zalogowaniu widzieć rozliczenia wszystkich kont powiązanych z jego adresem email. |
| **Kontekst** | Jeden lekarz może mieć wiele ID w systemie źródłowym (np. różne specjalizacje lub jednostki). W pliku wsadu dla jednego emaila może wystąpić wiele wierszy z różnymi ID. |
| **Kroki** | 1. Lekarz loguje się emailem <br> 2. System sprawdza liczbę kont przypisanych do tego emaila <br> 3a. Jeśli jedno konto → normalny widok panelu <br> 3b. Jeśli wiele kont → widok zbiorczy: lista wszystkich kont z nazwą/ID i kwotą rozliczenia per konto per miesiąc <br> 4. Lekarz może wejść w szczegóły każdego konta osobno |
| **Acceptance Criteria** | ✓ Lekarz z wieloma kontami widzi je wszystkie po zalogowaniu <br> ✓ Każde konto jest jednoznacznie identyfikowane (np. ID lekarza + specjalizacja) <br> ✓ Lekarz może przełączać się między kontami bez ponownego logowania |
| **Priorytet** | **Must Have** |

---

#### US-E0-07 — Zmiana języka interfejsu

| | |
|--|--|
| **Aktor** | Wszyscy użytkownicy |
| **Cel** | Przełączyć interfejs między językiem polskim a angielskim. |
| **Kroki** | 1. Na każdej stronie widoczna ikona/przełącznik języka w nagłówku (flagi PL/EN lub tekst PL / EN) <br> 2. Kliknięcie przełącza interfejs natychmiast bez przeładowania strony <br> 3. Wybrany język można ustawić jako domyślny (zapamiętany dla kolejnych logowań) |
| **Dotyczy** | Wszystkie elementy UI: etykiety, nagłówki, komunikaty, emaile systemowe (jeśli możliwe) |
| **Acceptance Criteria** | ✓ Przełącznik języka widoczny w widocznym miejscu na każdej stronie (nagłówek) <br> ✓ Zmiana języka działa natychmiast <br> ✓ Opcja "Ustaw jako domyślny" zapisuje preferencję w profilu użytkownika <br> ✓ Przy następnym logowaniu interfejs startuje w wybranym domyślnym języku <br> ✓ Lekarze zagraniczni mają domyślnie ustawiony angielski (konfigurowalne per użytkownik) |
| **Priorytet** | **Must Have** |

---

### E1 — Zarządzanie danymi rozliczeń *(Etap 1)*

> Admin wgrywa plik XLSX z trzema arkuszami: **Podsumowanie PL**, **Podsumowanie GLOBAL**, **Szczegóły wizyt**. Wymagane kolumny identyfikujące opisane w sekcji [4. Analiza pliku wsadu](#4-analiza-pliku-wsadu).

---

#### US-E1-01 — Wgrywanie pliku XLSX z danymi rozliczeniowymi

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Wgrać gotowe dane rozliczeniowe za dany miesiąc (wszystkie trzy arkusze naraz), aby były widoczne dla lekarzy. |
| **Kroki** | 1. Admin wchodzi w sekcję "Dane rozliczeń" <br> 2. Wybiera miesiąc rozliczeniowy <br> 3. Wgrywa plik XLSX <br> 4. System waliduje strukturę pliku (czy arkusze i wymagane kolumny są obecne) <br> 5. System importuje dane i przypisuje rekordy do kont lekarzy na podstawie emaila i ID lekarza <br> 6. Dane stają się widoczne dla lekarzy <br> 7. Admin widzi podsumowanie importu: liczba rekordów per arkusz, ostrzeżenia o niedopasowanych rekordach |
| **Acceptance Criteria** | ✓ System akceptuje plik XLSX z arkuszami: Podsumowanie PL, Podsumowanie GLOBAL, Szczegóły wizyt <br> ✓ Brakujące wymagane kolumny identyfikujące skutkują błędem importu z jasnym opisem <br> ✓ Ponowne wgranie dla tego samego miesiąca nadpisuje dane <br> ✓ Rekordy niedopasowane do żadnego konta lekarza są widoczne jako ostrzeżenia (import nie jest blokowany) <br> ✓ Szczegóły wizyt są przypisywane do właściwego lekarza i miesiąca |
| **Priorytet** | **Must Have** |

---

#### US-E1-02 — Edycja wgranych danych przez admina

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Poprawić lub uzupełnić dane bez usuwania istniejących wpisów. |
| **Acceptance Criteria** | ✓ Dodanie nowych wpisów nie usuwa istniejących rekordów <br> ✓ Każda zmiana zalogowana z datą i autorem <br> ✓ Lekarz widzi zaktualizowane dane |
| **Priorytet** | **Must Have** |

---

#### US-E1-03 — Podgląd historii importów

| | |
|--|--|
| **Aktor** | Admin |
| **Acceptance Criteria** | ✓ Widoczna data/godzina ostatniego importu per miesiąc <br> ✓ Status: sukces lub opis błędu |
| **Priorytet** | **Should Have** |

---

### E2 — Silnik rozliczeń *(Etap 2 — dokumentacja przyszłościowa)*

> **Ten epik nie jest częścią bieżących prac.** W Etapie 2 silnik przejmuje obliczenia wykonywane ręcznie w Etapie 1.

#### Reguły dla lekarzy polskich (Etap 2)

| ID Reguły | Nazwa | Opis |
|-----------|-------|------|
| RPL-01 | Stawka za wizytę (B2C/B2B) | Różna stawka zależna od typu kliniki pacjenta |
| RPL-02 | Stawka dzień roboczy / weekend | Inna stawka za wizyty w dni robocze vs. weekend |
| RPL-03 | Stawka bezpośrednia / specjalizacja | Inna stawka dla wizyt umówionych bezpośrednio do lekarza |
| RPL-04 | Dodatek za język obcy | Stały dodatek za konsultację w języku innym niż polski |
| RPL-05 | Bonus za konsultacje | Bonus 3 zł/wizytę przy średniej ocen ≥ 4,75 i slocie min. 7 dni wcześniej |
| RPL-06 | Mnożnik kar | Naliczanie kar z mnożnikiem wg udziału wizyt z karami: <5%→×1 … ≥20%→×5 |
| RPL-07 | Próg naliczania kar | Kary naliczane tylko gdy liczba wizyt z karami ≥ N |
| RPL-08 | No-show | Doliczanie kwoty za wizyty gdzie pacjent się nie zgłosił |
| RPL-09 | Dyżury — stawka godzinowa | Rozliczenie dyżuru wg liczby godzin |
| RPL-10 | Schodki — konsultacje | Ryczałt do progu N konsultacji + stawka za każdą powyżej |
| RPL-11 | Recepty | Stała stawka za receptę |

#### Reguły dla lekarzy zagranicznych (Etap 2)

| ID Reguły | Nazwa | Opis |
|-----------|-------|------|
| RGL-01 | Per konsultacja | Stawka za zakończoną konsultację |
| RGL-02 | Per nieudana konsultacja | Stawka za konsultacje z określonymi statusami niepowodzenia |
| RGL-03 | Per recepta | Stawka za wystawioną receptę |
| RGL-04 | Schodki — konsultacje | Ryczałt miesięczny do progu N + stawka za każdą powyżej |
| RGL-05 | Schodki — recepty | Ryczałt miesięczny do progu N recept + stawka za każdą powyżej |
| RGL-06 | Dyżur Standby — Monthly | Ryczałt miesięczny za pokrycie określonych dyżurów |
| RGL-07 | Dyżur Standby — Daily | Stawka za dyżur w oknie czasowym (DS1/DS2/DS3/Weekend) |
| RGL-08 | Ryczałt z progiem dostępności | Ryczałt miesięczny z proporcjonalną redukcją za brakujące dni |
| RGL-09 | Rozliczenie grupowe | Kilku lekarzy — jedna łączna kwota |
| RGL-10 | Rozliczenie zewnętrzne | Część kwoty fakturowana do zewnętrznego podmiotu |
| RGL-11 | Godziny dodatkowe | Stawka za godziny powyżej kontraktowego minimum |

---

### E3 — Panel Lekarza

---

#### US-E3-01 — Podsumowanie rozliczenia — lekarz polski (poziom 1)

| | |
|--|--|
| **Aktor** | Lekarz polski |
| **Cel** | Zobaczyć zbiorcze rozliczenie za bieżący miesiąc. |
| **Status rozliczenia (widoczny per rekord)** | 🔵 **Czeka na akceptację lekarza** — dane wgrane, lekarz jeszcze nie zaakceptował <br> 🔷 **Zaakceptowane przez lekarza** — lekarz kliknął "Zaakceptuj rozliczenie" <br> 🟠 **Wystawiona faktura** — lekarz wgrał fakturę PDF <br> 🟣 **Zaakceptowane** — faktura zaakceptowana (OCR zgodny lub ręcznie przez admina) <br> 🩷 **Przelew wysłany** — przelew wykonany (import CSV lub ręczna zmiana przez księgowość) |
| **Przycisk akceptacji** | Przycisk **"Zaakceptuj rozliczenie"** widoczny po lewej stronie rekordu, dostępny gdy status = "Czeka na akceptację lekarza" |
| **Kolumny widoczne dla lekarza** | Status · Miesiąc rozliczenia · Imię · Nazwisko · Liczba wizyt – wszystkie · Liczba wizyt – zwykłe · Wynagrodzenie za wizyty – zwykłe [PLN] · Liczba wizyt – pacjent nie zgłosił się · Wynagrodzenie – pacjent nie zgłosił się [PLN] · Liczba wizyt – umówionych bezpośrednio · Wynagrodzenie – umówione bezpośrednio [PLN] · Liczba wizyt – w języku obcym · Dodatek za język [PLN] · Liczba kar · Mnożnik kar · Kwota kar [PLN] · Bonus [PLN] · **Kwota do faktury [PLN]** · Data przelewu · Szczegóły (przycisk) |
| **Kolumny widoczne tylko dla admina** | Wszystkie powyższe + Telefon · Email · **Średnia stawka za konsultację [PLN]** |
| **Acceptance Criteria** | ✓ Kwota w PLN <br> ✓ Status aktualizowany automatycznie po każdej akcji lekarza/admina/księgowości <br> ✓ Przycisk "Zaakceptuj rozliczenie" aktywny tylko gdy status = "Czeka na akceptację lekarza" <br> ✓ Lekarz nie widzi rozliczeń innych lekarzy <br> ✓ Kolumna "Data przelewu" widoczna dla lekarza (pusta do czasu przelewu) |
| **Priorytet** | **Must Have** |

---

#### US-E3-02 — Podsumowanie rozliczenia — lekarz zagraniczny (poziom 1)

| | |
|--|--|
| **Aktor** | Lekarz zagraniczny |
| **Cel** | Zobaczyć zbiorcze rozliczenie za bieżący miesiąc w swoim języku i z kolumnami właściwymi dla swojego kraju. |
| **Status rozliczenia** | Identyczne 5 statusów co dla lekarzy polskich |
| **Kolumny widoczne dla lekarza zagranicznego** | Lekarz widzi kolumny oznaczone jako **"Standard"** ORAZ kolumny oznaczone jako **jego kraj** w wierszu "Widoczność" pliku wsadu. Kolumny przeznaczone dla innych krajów są **ukryte**. Nagłówki kolumn wyświetlane po angielsku (z wiersza tłumaczeń). |
| **Kolumny "Standard" (widoczne dla wszystkich zagranicznych)** | Status · First name · Last name · Company invoicing · Company invoiced · Country · Type of contract · Date · **Total to be paid in local currency** · Currency · **Total to be paid in PLN** · Consultations ended · Consultations failed · Prescriptions · Additional costs · Penalties No. · Penalties amount · Other deductions · Data przelewu / Transfer date |
| **Przykłady kolumn per kraj** | 🇨🇿 Czechy: + Consultations ended [weekdays], Consultations ended [weekends] <br> 🇪🇸 Hiszpania: + Consultations ended [day], Consultations ended [night], Shifts night <br> 🇦🇹 Austria: + Monthly Standby (shifts/days-nights/consultations/total), Daily Standby 1/2/3, Weekend/Holiday Standby |
| **Kolumny widoczne tylko dla admina i księgowości** | Wszystkie kolumny (bez ograniczeń krajowych) + **Średnia stawka za konsultację** |
| **Kwota rozliczenia w PLN** | Obliczana przez system na podstawie kolumny Waluta: EUR × kurs EUR/PLN lub GBP × kurs GBP/PLN. Kursy konfigurowane przez admina. |
| **Acceptance Criteria** | ✓ Lekarz widzi TYLKO kolumny odpowiadające jego krajowi + Standard <br> ✓ Nagłówki po angielsku (EN default dla zagranicznych) <br> ✓ Kolumna "Kwota rozliczenia w PLN" obliczana automatycznie <br> ✓ Kurs wymiany stosowany zgodnie z walutą z pliku wsadu (EUR lub GBP) <br> ✓ Średnia stawka za konsultację widoczna tylko dla admina |
| **Priorytet** | **Must Have** |

---

#### US-E3-03 — Podgląd szczegółów rozliczenia — lista wizyt (poziom 2)

| | |
|--|--|
| **Aktor** | Lekarz |
| **Cel** | Zobaczyć listę poszczególnych wizyt wchodzących w skład rozliczenia. |
| **Kolumny** | Data wizyty · Data rozpoczęcia · Data zamknięcia · Specjalizacja · Rodzaj · BU · Klinika · Pacjent · Język wizyty · Pacjent nie zgłosił się · Umówienie bezpośrednie · Opóźnienie [min.] · Kara (badge) · Kwota kary |
| **Acceptance Criteria** | ✓ Kary wyróżnione jako badge (np. czerwony "Kara") <br> ✓ Zakładki Wizyty / Recepty / Dyżury widoczne jeśli lekarz ma dane danego typu <br> ✓ Przy każdej wizycie dostępna opcja "Zgłoś reklamację" |
| **Priorytet** | **Must Have** |

---

#### US-E3-04 — Akceptacja rozliczenia przez lekarza

| | |
|--|--|
| **Aktor** | Lekarz |
| **Cel** | Zatwierdzić rozliczenie miesięczne, co zmienia status i odblokowuje upload faktury. |
| **Kroki** | 1. Lekarz klika przycisk **"Zaakceptuj rozliczenie"** (widoczny po lewej stronie rekordu) <br> 2. Modal z pytaniem o potwierdzenie <br> 3. Po zatwierdzeniu status zmienia się na "Zaakceptowane przez lekarza" <br> 4. Pojawia się przycisk "Prześlij fakturę" |
| **Acceptance Criteria** | ✓ Przycisk "Prześlij fakturę" niedostępny przed akceptacją <br> ✓ Status zaktualizowany w dashboardzie admina <br> ✓ Akceptacja zalogowana z datą i godziną |
| **Priorytet** | **Must Have** |

---

#### US-E3-05 — Zgłoszenie reklamacji do wizyty

| | |
|--|--|
| **Aktor** | Lekarz |
| **Acceptance Criteria** | ✓ Email na rozliczenia-lekarzy@telemedi.com z pełnymi danymi wizyty, treścią wiadomości lekarza, jego imieniem/nazwiskiem i miesiącem rozliczenia <br> ✓ Reklamacja zapisana w systemie i widoczna dla admina |
| **Priorytet** | **Must Have** |

---

#### US-E3-06 — Historia rozliczeń poprzednich miesięcy

| | |
|--|--|
| **Aktor** | Lekarz |
| **Acceptance Criteria** | ✓ Historia od momentu uruchomienia systemu <br> ✓ Szczegóły historycznych miesięcy tylko do odczytu |
| **Priorytet** | **Should Have** |

---

#### US-E3-07 — Widok rozliczenia grupowego — Główny Lekarz

| | |
|--|--|
| **Aktor** | Główny Lekarz |
| **Acceptance Criteria** | ✓ Kwota grupowa = suma kwot członków <br> ✓ Widoczne rozbicie na poszczególnych lekarzy <br> ✓ Zwykły lekarz w grupie widzi tylko swoje dane |
| **Priorytet** | **Must Have** |

---

### E4 — Zarządzanie fakturami

---

#### US-E4-01 — Upload faktury PDF przez lekarza

| | |
|--|--|
| **Aktor** | Lekarz |
| **Acceptance Criteria** | ✓ Dostępne po akceptacji rozliczenia (US-E3-04) <br> ✓ Format: tylko PDF <br> ✓ Status zmienia się na "Wystawiona faktura" <br> ✓ Lekarz nie może zastąpić faktury po wgraniu (tylko admin) |
| **Priorytet** | **Must Have** |

---

#### US-E4-02 — Weryfikacja kwoty faktury (OCR)

| | |
|--|--|
| **Aktor** | System |
| **Statusy OCR** | **"Kwota zgodna"** / **"Kwota się różni"** (widoczna różnica) / **"Brak faktury"** / **"Inne"** (OCR nie odczytał) |
| **Priorytet** | **Must Have** |

---

#### US-E4-03 — Automatyczna wysyłka zgodnej faktury

| | |
|--|--|
| **Aktor** | System |
| **Acceptance Criteria** | ✓ Email z PDF na invoices@telemedi.com gdy OCR = "Kwota zgodna" <br> ✓ Status zmienia się na "Zaakceptowane" |
| **Priorytet** | **Must Have** |

---

#### US-E4-04 — Obsługa faktury niezgodnej przez admina

| | |
|--|--|
| **Aktor** | Admin |
| **Opcja A — Usuń fakturę** | Admin usuwa, podaje powód → email do lekarza z powodem → lekarz może wgrać nową |
| **Opcja B — Zatwierdź mimo niezgodności** | Admin zatwierdza z uzasadnieniem → status "Zaakceptowane" → faktura na invoices@telemedi.com |
| **Priorytet** | **Must Have** |

---

#### US-E4-05 — Integracja z KSeF (lekarze polscy — Etap 2)

| | |
|--|--|
| **Priorytet** | **Should Have** |
| **Notatki** | KSeF jako rozwiązanie Etapu 2; PDF jako fallback. |

---

### E5 — Panel Księgowości

---

#### US-E5-01 — Lista faktur do przetworzenia

| | |
|--|--|
| **Acceptance Criteria** | ✓ Widoczne wszystkie statusy OCR <br> ✓ Kwoty EUR/GBP mają przeliczenie na PLN wg kursu skonfigurowanego przez admina <br> ✓ Filtry działają bez przeładowania |
| **Priorytet** | **Must Have** |

---

#### US-E5-02 — Zmiana statusu faktury

| | |
|--|--|
| **Acceptance Criteria** | ✓ "Zaakceptuj" możliwe gdy OCR = "Kwota zgodna" lub "Zatwierdzona ręcznie" <br> ✓ "Odrzuć" wymaga powodu <br> ✓ Zmiana zalogowana z datą i użytkownikiem |
| **Priorytet** | **Must Have** |

---

#### US-E5-03 — Eksport faktur do systemu FK

| | |
|--|--|
| **Acceptance Criteria** | ✓ Eksport tylko faktur zaakceptowanych <br> ✓ Po eksporcie oznaczenie "Wyeksportowana" z datą |
| **Priorytet** | **Must Have** |
| **Notatki** | Format eksportu do uzgodnienia z FK. |

---

### E6 — Panel Admina

---

#### US-E6-01 — Zarządzanie użytkownikami

| | |
|--|--|
| **Acceptance Criteria** | ✓ Zdezaktywowany lekarz nie może się zalogować <br> ✓ Email unikalny w systemie <br> ✓ Zmiany zalogowane |
| **Priorytet** | **Must Have** |

---

#### US-E6-02 — Zarządzanie grupami rozliczeniowymi

| | |
|--|--|
| **Acceptance Criteria** | ✓ Lekarz w jednej grupie <br> ✓ Kwota grupowa = suma kwot członków |
| **Priorytet** | **Must Have** |

---

#### US-E6-03 — Filtr faktur niezgodnych

| | |
|--|--|
| **Acceptance Criteria** | ✓ Filtr "Faktury niezgodne" w panelu admina <br> ✓ Licznik niezgodnych bez wchodzenia w filtr |
| **Priorytet** | **Must Have** |

---

#### US-E6-04 — Wysyłka powiadomień o brakującej fakturze

| | |
|--|--|
| **Acceptance Criteria** | ✓ Wysyłka zbiorcza do lekarzy ze statusem "Wystawiona faktura" (brak pliku) <br> ✓ Szablon konfigurowalny |
| **Priorytet** | **Must Have** |

---

#### US-E6-05 — Konfiguracja kursów walut (EUR/PLN i GBP/PLN)

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Ustawić aktualne kursy wymiany EUR→PLN i GBP→PLN stosowane w przeliczeniach dla lekarzy zagranicznych. |
| **Acceptance Criteria** | ✓ Osobny kurs dla EUR i dla GBP <br> ✓ Kursy stosowane do kolumny "Kwota rozliczenia w PLN" w podsumowaniu GLOBAL <br> ✓ Historia zmian kursów zachowana |
| **Priorytet** | **Should Have** |

---

### E7 — Powiadomienia i Workflow

---

#### US-E7-01 — Powiadomienie o gotowym rozliczeniu

| Trigger | Admin zamyka miesiąc |
|---------|---------------------|
| **Acceptance Criteria** | ✓ Email do lekarza z kwotą, miesiącem i linkiem |
| **Priorytet** | **Should Have** |

---

#### US-E7-02 — Powiadomienie o rozpatrzeniu reklamacji

| Trigger | Admin zamyka reklamację |
|---------|------------------------|
| **Acceptance Criteria** | ✓ Email z wynikiem i opisem decyzji |
| **Priorytet** | **Should Have** |

---

#### US-E7-03 — Powiadomienie o niezgodnej fakturze (do admina)

| Trigger | OCR = "Kwota się różni" lub "Inne" |
|---------|-----------------------------------|
| **Acceptance Criteria** | ✓ Email na rozliczenia-lekarzy@telemedi.com z danymi lekarza, kwotami i różnicą |
| **Priorytet** | **Must Have** |

---

#### US-E7-04 — Powiadomienie do lekarza o usunięciu faktury

| Trigger | Admin usuwa fakturę lekarza |
|---------|----------------------------|
| **Acceptance Criteria** | ✓ Email do lekarza z powodem i linkiem do panelu |
| **Priorytet** | **Must Have** |

---

### E8 — Dashboard statusów rozliczeń

> Dashboard widoczny dla **admina i księgowości**.

---

#### US-E8-01 — Wykres słupkowy statusów rozliczeń

| | |
|--|--|
| **Aktor** | Admin / Księgowość |
| **Opis wykresu** | Grouped bar chart: oś X = daty, oś Y = liczba lekarzy, każdy kolor = jeden z 5 statusów |
| **5 statusów** | 🔵 Czeka na akceptację lekarza · 🔷 Zaakceptowane przez lekarza · 🟠 Wystawiona faktura · 🟣 Zaakceptowane · 🩷 Przelew wysłany |
| **Acceptance Criteria** | ✓ Kliknięcie na słupek → lista lekarzy w danym statusie na daną datę (z imieniem, nazwiskiem, kwotą) <br> ✓ Widoczna liczba lekarzy per status per dzień |
| **Priorytet** | **Must Have** |

---

#### US-E8-02 — Historia zmian statusów rozliczenia

| | |
|--|--|
| **Acceptance Criteria** | ✓ Lista zmian statusu per lekarz per miesiąc: status poprzedni → nowy, data i godzina <br> ✓ Data ostatniej zmiany statusu widoczna w liście lekarzy |
| **Priorytet** | **Must Have** |

---

### E9 — Statusy płatności

---

#### US-E9-01 — Import pliku CSV z potwierdzeniami przelewów

| | |
|--|--|
| **Aktor** | Księgowość |
| **Cel** | Wgrać plik z potwierdzeniami wykonanych przelewów, aby system automatycznie zmienił statusy na "Przelew wysłany". |
| **Kroki** | 1. Księgowość wchodzi w "Statusy płatności" <br> 2. Wgrywa plik CSV z potwierdzeniami przelewów z banku <br> 3. System parsuje plik i odczytuje per lekarz: identyfikator oraz datę wykonania przelewu <br> 4. Dopasowuje do rozliczeń w systemie <br> 5. Zmienia status na "Przelew wysłany" i zapisuje datę przelewu <br> 6. Podsumowanie importu: liczba zaktualizowanych, lista niedopasowanych |
| **Acceptance Criteria** | ✓ Jeden plik CSV może zawierać dane dla wielu lekarzy <br> ✓ Kwota z CSV = kwota za wszystkie wizyty lekarza ze wszystkich specjalizacji <br> ✓ Data przelewu odczytywana z pliku <br> ✓ Niedopasowane rekordy jako ostrzeżenia — nie blokują reszty importu |
| **Priorytet** | **Must Have** |
| **Notatki** | Struktura pliku CSV do uzgodnienia z FK (kolumny, identyfikator lekarza, format daty). |

---

#### US-E9-02 — Ręczna zmiana statusu płatności na "Przelew wysłany"

| | |
|--|--|
| **Aktor** | Księgowość |
| **Cel** | Zmienić status ręcznie bez wgrywania pliku (np. dla pojedynczego lekarza). |
| **Acceptance Criteria** | ✓ Możliwość ręcznego ustawienia statusu "Przelew wysłany" z datą <br> ✓ Akcja zalogowana z datą i użytkownikiem |
| **Priorytet** | **Must Have** |

---

#### US-E9-03 — Wyświetlanie daty przelewu

| | |
|--|--|
| **Acceptance Criteria** | ✓ Kolumna "Data przelewu / Transfer date" widoczna dla lekarza (pusta do czasu przelewu) <br> ✓ Kolumna widoczna w panelu admina i księgowości |
| **Priorytet** | **Must Have** |

---

### E10 — Filtry

---

#### US-E10-01 — Filtrowanie listy rozliczeń

| | |
|--|--|
| **Dostępne filtry** | 📅 Rok i miesiąc · 🏥 Specjalizacja · 👤 Lekarz · 📊 Status rozliczenia (jeden lub wiele) |
| **Acceptance Criteria** | ✓ Filtry działają łącznie (AND) bez przeładowania strony <br> ✓ Aktywne filtry widocznie oznaczone (chip z możliwością usunięcia) <br> ✓ "Wyczyść filtry" resetuje wszystkie naraz <br> ✓ Wybrany zestaw filtrów zachowany przy powrocie do listy |
| **Priorytet** | **Must Have** |

---

## 4. Analiza pliku wsadu

> Poniżej analiza pliku `wsad.xlsx` i wymagane modyfikacje struktury pliku wgrywanego przez admina.

### Arkusz 1 — Podsumowanie PL

**Obecne kolumny:**

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | Imię lekarza | |
| 2 | Nazwisko lekarza | |
| 3 | Miesiąc rozliczenia | |
| 4 | Wynagrodzenie – Kwota do faktury | Formuła w pliku; system zapisuje wartość wynikową |
| 5 | Waluta | PLN |
| 6 | Liczba wizyt – wszystkie | Formuła (G+I+K) |
| 7 | Liczba wizyt – zwykłe | |
| 8 | Wynagrodzenie za wizyty – zwykłe | |
| 9 | Liczba wizyt – pacjent nie zgłosił się | |
| 10 | Wynagrodzenie – pacjent nie zgłosił się | |
| 11 | Liczba wizyt – umówione bezpośrednio | |
| 12 | Wynagrodzenie – umówione bezpośrednio | |
| 13 | Liczba wizyt – w języku obcym | |
| 14 | Dodatek za wizyty – w języku obcym | |
| 15 | Liczba kar | |
| 16 | Mnożnik kar | |
| 17 | Kwota kar | |
| 18 | Bonus | |
| 19 | Telefon | |
| 20 | e-mail | ✅ Używany jako login/identyfikator lekarza |

**Wymagane dodatkowe kolumny (do dodania do pliku):**

| Kolumna | Opis | Powód |
|---------|------|-------|
| **ID lekarza** | Unikalny identyfikator konta lekarza w systemie | Jeden email może mieć wiele kont (różne Doctor ID). Bez tego pola import nie jest w stanie rozróżnić kont i przypisać wiersza do właściwego konta. |

**Kolumny wyliczane przez system (nie w pliku):**

| Kolumna | Formuła | Widoczność |
|---------|---------|------------|
| Średnia stawka za konsultację [PLN] | Kwota do faktury ÷ Liczba wizyt wszystkie | Tylko admin |
| Status rozliczenia | Zarządzany przez system | Admin + lekarz |
| Data przelewu | Uzupełniana przy imporcie CSV | Admin + lekarz |

---

### Arkusz 2 — Podsumowanie GLOBAL

**Struktura pliku:** Trzy specjalne wiersze na początku:
- **Wiersz 1:** Nagłówki po polsku
- **Wiersz 2:** Tłumaczenia nagłówków na angielski
- **Wiersz 3:** Widoczność per kolumna (Standard / nazwa kraju)
- **Wiersze 4+:** Dane lekarzy

**Zasada widoczności kolumn:**

| Widoczność | Znaczenie |
|------------|-----------|
| **Standard** | Kolumna widoczna dla wszystkich lekarzy zagranicznych |
| **Czechy** | Kolumna widoczna tylko dla lekarzy z Czech |
| **Hiszpania** | Kolumna widoczna tylko dla lekarzy z Hiszpanii |
| **Austria** | Kolumna widoczna tylko dla lekarzy z Austrii |
| *(inne kraje)* | Analogicznie — kolumna widoczna tylko dla lekarzy z danego kraju |

**Mapowanie kolumn na widoczność (z pliku wsadu):**

| Kolumna (PL) | Kolumna (EN) | Widoczność |
|---|---|---|
| Imię lekarza | First name | Standard |
| Nazwisko lekarza | Last name | Standard |
| Firma fakturująca | Company invoicing | Standard |
| Firma – Nabywca na fakturze | Company invoiced | Standard |
| Kraj | Country | Standard |
| Forma zatrudnienia | Type of contract | Standard |
| Data | Date | Standard |
| Kwota rozliczenia miesięcznego w walucie lokalnej | Total to be paid in local currency | Standard |
| Waluta | Currency | Standard |
| Konsultacje zakończone | Consultations ended | Standard |
| Konsultacje zakończone [dzień roboczy] | Consultations ended [weekdays] | **Czechy** |
| Konsultacje zakończone [weekend] | Consultations ended [weekends] | **Czechy** |
| Konsultacje zakończone [dzień] | Consultations ended [day] | **Hiszpania** |
| Konsultacje zakończone [noc] | Consultations ended [night] | **Hiszpania** |
| Konsultacje zakończone bez odpowiedzi | Consultations failed | Standard |
| Dyżur nocny | Shifts night | **Hiszpania** |
| Dyżur miesięczny – zmiany | Monthly Standby – shifts | **Austria** |
| Dyżur miesięczny – dni/noce z konsultacjami | Monthly Standby – days/nights with consultations | **Austria** |
| Dyżur miesięczny – konsultacje | Monthly Standby – consultations | **Austria** |
| Dyżur miesięczny – kwota | Monthly Standby – total | **Austria** |
| Dyżur dzienny 1 – zmiany | Daily Standby 1 – shifts | **Austria** |
| Dyżur dzienny 1 – dni/noce z konsultacjami | Daily Standby 1 – days/nights with consultations | **Austria** |
| Dyżur dzienny 1 – konsultacje | Daily Standby 1 – consultations | **Austria** |
| Dyżur dzienny 1 – kwota | Daily Standby 1 – total | **Austria** |
| Dyżur dzienny 2 – zmiany | Daily Standby 2 – shifts | **Austria** |
| Dyżur dzienny 2 – dni/noce z konsultacjami | Daily Standby 2 – days/nights with consultations | **Austria** |
| Dyżur dzienny 2 – konsultacje | Daily Standby 2 – consultations | **Austria** |
| Dyżur dzienny 2 – kwota | Daily Standby 2 – total | **Austria** |
| Dyżur dzienny 3 – zmiany | Daily Standby 3 – shifts | **Austria** |
| Dyżur dzienny 3 – dni/noce z konsultacjami | Daily Standby 3 – days/nights with consultations | **Austria** |
| Dyżur dzienny 3 – konsultacje | Daily Standby 3 – consultations | **Austria** |
| Dyżur dzienny 3 – kwota | Daily Standby 3 – total | **Austria** |
| Dyżur weekendowy/świąteczny – zmiany | Weekend/Holiday Standby – shifts | **Austria** |
| Dyżur weekendowy/świąteczny – dni/noce z konsultacjami | Weekend/Holiday – days/nights with consultations | **Austria** |
| Dyżur weekendowy/świąteczny – konsultacje | Weekend/Holiday – consultations | **Austria** |
| Dyżur weekendowy/świąteczny – kwota | Weekend/Holiday – total | **Austria** |
| Recepty | Prescriptions | Standard |
| Dodatkowe koszty | Additional costs | Standard |
| Liczba kar | Penalties No. | Standard |
| Kwota kar | Penalties amount | Standard |
| Inne odliczenia | Other deductions | Standard |

**Wymagane dodatkowe kolumny (do dodania do pliku):**

| Kolumna | Opis | Powód |
|---------|------|-------|
| **Email lekarza** | Adres email lekarza | Brak w obecnym pliku — konieczny do przypisania rekordu do konta lekarza (login). |
| **ID lekarza** | Unikalny identyfikator konta | Jeden email może mieć wiele kont. |

**Kolumny wyliczane przez system (nie w pliku):**

| Kolumna | Formuła | Widoczność |
|---------|---------|------------|
| Kwota rozliczenia w PLN | Kwota lokalna × kurs (EUR lub GBP → PLN) | Standard (wszyscy) |
| Średnia stawka za konsultację | Kwota lokalna ÷ Consultations ended | Tylko admin |
| Status rozliczenia | Zarządzany przez system | Admin + lekarz |
| Data przelewu | Uzupełniana przy imporcie CSV | Admin + lekarz |

---

### Arkusz 3 — Szczegóły wizyt

**Obecne kolumny:**

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | Data wizyty | |
| 2 | Data rozpoczęcia wizyty | |
| 3 | Data zamknięcia wizyty | |
| 4 | Specjalizacja | |
| 5 | Rodzaj | |
| 6 | BU | B2C / B2B |
| 7 | Klinika | |
| 8 | Pacjent | |
| 9 | Język wizyty | |
| 10 | Pacjent nie zgłosił się | tak / nie |
| 11 | Umówienie bezpośrednie | tak / nie |
| 12 | Opóźnienie [min.] | Formuła w pliku |
| 13 | Kara | tak / nie |
| 14 | Kwota kary | |

**Wymagane dodatkowe kolumny (do dodania do pliku):**

| Kolumna | Opis | Powód |
|---------|------|-------|
| **Email lekarza** | Adres email lekarza | Plik nie zawiera żadnego identyfikatora lekarza — bez tego kolumna nie można przypisać wizyt do właściwego konta. |
| **ID lekarza** | Unikalny identyfikator konta | Jeden email może mieć wiele kont — wizyta musi trafić do właściwego konta. |
| **Miesiąc rozliczenia** | np. 2026-02 | Choć datę wizyty można z niej wywnioskować, jawne pole eliminuje wątpliwości przy wizytach na granicy miesięcy. |

---

## 5. Poza zakresem (Out of Scope)

- Mobilna aplikacja natywna (iOS/Android) — tylko web
- Bezpośrednia integracja z systemem FK przez API — w pierwszej wersji eksport do pliku
- Archiwum rozliczeń sprzed uruchomienia nowego systemu
- **Automatyczna integracja z systemem źródłowym — Etap 2**
- **Automatyczny silnik rozliczeń (obliczanie mnożników, bonusów, schodków) — Etap 2**
- **KSeF — Etap 2**

---

## 6. Otwarte pytania i decyzje do podjęcia

| # | Pytanie | Wpływ na | Status |
|---|---------|----------|--------|
| 1 | Jaka jest struktura pliku CSV z potwierdzeniami przelewów z banku? Jaki identyfikator lekarza, format daty? | E9 | Do ustalenia |
| 2 | Jaki docelowy format eksportu do systemu FK? | E5 | Do ustalenia |
| 3 | Kiedy "zamyka się" miesiąc — auto po ostatnim dniu czy ręcznie przez admina? | E3, E7, E8 | Do ustalenia |
| 4 | Czy kursy EUR/PLN i GBP/PLN wpisywane ręcznie, czy integracja z API NBP? | E5, E6 | Do ustalenia |
| 5 | Czy OCR ma działać na bazie biblioteki wbudowanej czy zewnętrznej usługi (np. Google Document AI)? | E4 | Do ustalenia |
| 6 | Jak jednoznacznie identyfikować konto lekarza w CSV z przelewami — czy to ID lekarza, email, czy inne pole? | E9 | Do ustalenia |
| 7 | Jak wyglądać będzie pełna lista krajów lekarzy zagranicznych i ich specyficznych kolumn? | E1, E3 | Do doprecyzowania |
| 8 | Czy rozliczenie zewnętrzne (RGL-10) ma być widoczne jako osobna pozycja dla księgowości? | E2 (Etap 2), E5 | Do ustalenia (Etap 2) |
| 9 | Jaki system źródłowy dla Etapu 2? | E2, E1b | Do ustalenia (Etap 2) |
| 10 | Jak długo przechowywać historię zmian statusów? | E8 | Do ustalenia |
| 11 | Czy emaile systemowe (powiadomienia) mają być dwujęzyczne (PL/EN wg preferencji lekarza)? | E7 | Do ustalenia |

---

## 7. Słownik pojęć

| Pojęcie | Definicja |
|---------|-----------|
| **Ended** | Zakończona konsultacja (status sukcesu) |
| **Failed / Consultations failed** | Konsultacja zakończona niepowodzeniem |
| **Presc / Recepta / Prescription** | Wystawiona e-recepta |
| **Standby** | Dyżur gotowości lekarza w określonym oknie czasowym |
| **No-show** | Wizyta gdzie pacjent nie zgłosił się |
| **B2C / B2B** | Typ kliniki pacjenta |
| **KSeF** | Krajowy System e-Faktur |
| **FK** | System finansowo-księgowy |
| **Schodki** | Model rozliczenia z progami: ryczałt do N, potem stawka za każdą kolejną |
| **Główny Lekarz** | Rola w grupie — widzi rozliczenie zbiorcze grupy |
| **Reklamacja** | Zastrzeżenie lekarza do konkretnej wizyty |
| **OCR** | Odczyt kwoty z PDF faktury |
| **Lekarz Polski** | Lekarz rozliczany w PLN |
| **Lekarz Zagraniczny** | Lekarz rozliczany w EUR lub GBP |
| **Widoczność** | Wiersz w arkuszu GLOBAL określający które kolumny widzi lekarz z danego kraju |
| **Standard** | Kolumna widoczna dla wszystkich lekarzy zagranicznych |
| **ID lekarza** | Unikalny identyfikator konta lekarza w systemie — konieczny gdy jeden email = wiele kont |
| **Etap 1** | MVP — import gotowych danych, panel lekarza, faktury, dashboard, płatności |
| **Etap 2** | Docelowy — integracja z systemem źródłowym + automatyczny silnik rozliczeń |
