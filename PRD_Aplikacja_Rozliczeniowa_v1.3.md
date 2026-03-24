# PRD — Aplikacja Rozliczeniowa dla Lekarzy

**Wersja:** 1.4 — Draft
**Data:** 2026-03-24
**Status:** Do przeglądu

---

## ⚡ PODZIAŁ NA ETAPY — przeczytaj najpierw

Projekt realizowany jest w dwóch etapach. Podział ten jest świadomą decyzją biznesową, uzasadnioną poniżej.

---

### Etap 1 — MVP (obecny zakres dokumentu)

**Co robimy:** Admin wgrywa do aplikacji **surowe dane źródłowe** z pliku Excel (wizyty, sloty, dyżury, recepty, oceny). Aplikacja **automatycznie oblicza wynagrodzenie** na podstawie reguł RPL i RGL skonfigurowanych przez admina w panelu ustawień. Admin nie liczy nic ręcznie — przygotowuje tylko plik wsadu z danymi źródłowymi i utrzymuje stawki w systemie.

**Dlaczego tak:**

1. **Szybkie wdrożenie niezależnie od istniejącego systemu.** Integracja z systemem źródłowym wymaga zaangażowania zespołu deweloperskiego i jest czasochłonna. Etap 1 opiera się na plikach Excel eksportowanych ręcznie przez admina — bez integracji z systemem.

2. **Eliminacja ręcznych obliczeń i ręcznej wysyłki.** Dotychczas obliczenia wykonywano w Excelu poza systemem, rozliczenia wysyłano mailem do lekarzy zagranicznych, a faktury zbierano ręcznie. Etap 1 eliminuje to wszystko: aplikacja liczy, lekarze widzą szczegóły online, faktury wgrywane są przez system.

3. **Transparentność dla lekarzy.** Wszyscy lekarze — zarówno polscy, jak i zagraniczni — mogą podejrzeć szczegóły swojego wynagrodzenia: podsumowanie, poszczególne wizyty, dyżury, recepty.

**Zakres Etapu 1:** E0, E1, E3, E4, E5, E6, E7, E8, E9, E10, E11

---

### Etap 2 — Docelowy (poza obecnym zakresem dokumentu)

**Co robimy:** Integracja z systemem źródłowym — dane (wizyty, dyżury, recepty, sloty) pobierane są automatycznie bez ręcznego przygotowania pliku Excel. Silnik rozliczeń i reguły RPL/RGL pozostają te same co w Etapie 1 — zmienia się tylko źródło danych.

**Zakres Etapu 2:** E1b (integracja z systemem źródłowym), KSeF

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
| **Lekarze Polscy** | PLN | Wgrywanie surowych danych z pliku XLSX (wizyty, sloty, dyżury, recepty, oceny) | Upload PDF lub KSeF (docelowo) | Reguły RPL skonfigurowane w aplikacji; system oblicza wynagrodzenie automatycznie |
| **Lekarze Zagraniczni** | EUR lub GBP (+ przeliczenie na PLN dla admina/księgowości) | Wgrywanie surowych danych z pliku XLSX (wizyty, dyżury/sloty, recepty) | Upload PDF | Reguły RGL skonfigurowane w aplikacji; system oblicza wynagrodzenie automatycznie; widoczność kolumn zależna od kraju lekarza |

> **Rozróżnienie wizualne:** Obok nazwy lekarza wyświetlany jest badge tekstowy: lekarze polscy → brak dodatkowego oznaczenia, lekarze zagraniczni → badge **„GLOBAL"** (bez flagi kraju).
>
> **Różny układ widoku:** Lekarze polscy i zagraniczni widzą różne kolumny w podsumowaniu i szczegółach — zgodnie ze strukturą arkuszy wsadu i regułami widoczności.

---

## 2. Epiki

### Etap 1 — MVP

| ID | Nazwa Epiku | Opis | Priorytet |
|----|-------------|------|-----------|
| E0 | Logowanie i uwierzytelnianie | Email jako login. Pierwsze logowanie przez kod. Ustanowienie hasła lub tryb "kod każdorazowo". Wielokrotne konta per email. Dwujęzyczność (PL/EN). | Must Have |
| E1 | Zarządzanie danymi rozliczeń | Wgrywanie surowych danych źródłowych (wizyty, sloty, dyżury, recepty, oceny) z pliku XLSX przez admina. Aplikacja oblicza wynagrodzenie na podstawie reguł z E11. Edycja i uzupełnianie wpisów. | Must Have |
| E3 | Panel Lekarza | Widok bieżącego rozliczenia: podsumowanie i szczegóły wizyt. Akceptacja rozliczenia, zgłaszanie reklamacji, historia miesięcy. | Must Have |
| E4 | Zarządzanie fakturami | Upload faktury PDF, OCR, automatyczna wysyłka, obsługa niezgodności. | Must Have |
| E5 | Panel Księgowości | Przegląd faktur, zmiana statusów, import CSV z przelewami, eksport do FK. | Must Have |
| E6 | Panel Admina | Wgrywanie danych, zarządzanie użytkownikami i grupami, obsługa faktur niezgodnych, powiadomienia, konfiguracja kursu. | Must Have |
| E7 | Powiadomienia i Workflow | Automatyczne emaile: gotowe rozliczenie, brak faktury, reklamacja, niezgodna faktura, usunięcie faktury. | Should Have |
| E8 | Dashboard statusów rozliczeń | Wykres słupkowy 5 statusów per data. Klikalne statusy → lista lekarzy. Historia zmian statusów. | Must Have |
| E9 | Statusy płatności | Import CSV z banku lub ręczna zmiana statusu. "Przelew wysłany" + data zlecenia przelewu. | Must Have |
| E10 | Filtry | Filtrowanie po roku/miesiącu, specjalizacji, lekarzu, statusie. | Must Have |
| E11 | Konfiguracja ustawień rozliczeniowych | Panel admina: konfiguracja stawek per reguła (RPL/RGL), ustawienia bonusów i mnożników kar per lekarz i specjalizacja. | Must Have |

### Etap 2 — Docelowy (dokumentacja przyszłościowa)

| ID | Nazwa Epiku | Opis | Priorytet |
|----|-------------|------|-----------|
| E2 | Silnik rozliczeń (dokumentacja) | Opis reguł RPL i RGL — zaimplementowane w Etapie 1 na podstawie pliku Excel; w Etapie 2 dane źródłowe pobierane automatycznie z systemu. | — |
| E1b | Integracja z systemem źródłowym | Automatyczne pobieranie danych z systemu (zastąpienie pliku Excel). | — |

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
| **Cel** | Wgrać surowe dane źródłowe za dany miesiąc (wszystkie arkusze naraz), aby system mógł automatycznie wyliczyć wynagrodzenia i udostępnić je lekarzom. |
| **Kroki** | 1. Admin wchodzi w sekcję "Dane rozliczeń" <br> 2. Wybiera miesiąc rozliczeniowy <br> 3. Wgrywa plik XLSX (jeden plik z wieloma arkuszami) <br> 4. System waliduje strukturę pliku (czy wymagane arkusze i kolumny identyfikujące są obecne) <br> 5. System importuje dane, przypisuje rekordy do kont lekarzy na podstawie Email + ID lekarza <br> 6. System oblicza wynagrodzenia na podstawie reguł skonfigurowanych w E11 <br> 7. Wyliczone rozliczenia stają się widoczne dla lekarzy <br> 8. Admin widzi podsumowanie importu: liczba rekordów per arkusz, ostrzeżenia o niedopasowanych rekordach, lista ewentualnych błędów obliczeniowych |
| **Acceptance Criteria** | ✓ System akceptuje plik XLSX z arkuszami: Wizyty PL, Sloty PL, Recepty PL, Oceny, Wizyty GLOBAL, Sloty/Dyżury GLOBAL, Recepty GLOBAL <br> ✓ Brakujące wymagane kolumny identyfikujące (Email lekarza, ID lekarza, Miesiąc rozliczenia) skutkują błędem importu z jasnym opisem <br> ✓ Ponowne wgranie dla tego samego miesiąca nadpisuje dane i przelicza wynagrodzenia od nowa <br> ✓ Rekordy niedopasowane do żadnego konta lekarza są widoczne jako ostrzeżenia (import nie jest blokowany) <br> ✓ System stosuje reguły obliczeniowe skonfigurowane w E11 (stawki, bonusy, mnożniki kar) <br> ✓ Ustawienia per lekarz + specjalizacja z E11 (bonusy tak/nie, mnożniki kar tak/nie) uwzględniane przy obliczeniach |
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
| **Oznaczenie lekarza zagranicznego** | Obok nazwy lekarza wyświetlany jest badge **„GLOBAL"** (bez flagi kraju). |
| **Kolumny widoczne dla lekarza zagranicznego** | Lekarz widzi kolumny oznaczone jako **"Standard"** ORAZ kolumny oznaczone jako **jego kraj** w konfiguracji widoczności. Kolumny przeznaczone dla innych krajów są **ukryte**. Nagłówki kolumn wyświetlane po angielsku. |
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

### E11 — Konfiguracja ustawień rozliczeniowych *(Etap 1)*

> Panel admina do zarządzania regułami obliczeniowymi: stawkami per typ reguły (RPL/RGL), ustawieniami bonusów i mnożników kar per lekarz i specjalizacja. Zmiany w konfiguracji stosowane są przy kolejnym imporcie pliku wsadu (lub przeliczeniu istniejących danych na żądanie admina).

---

#### US-E11-01 — Konfiguracja wzorców kontraktu i stawek (lekarze GLOBAL)

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Przypisać każdemu lekarzowi zagranicznemu wzorzec kontraktu (W1–W10) wraz z parametrami, tak aby system mógł automatycznie obliczyć wynagrodzenie z danych wsadu. |
| **Mechanizm** | Admin wybiera jeden z 10 wzorców i uzupełnia jego parametry dla danego lekarza. Formularz pokazuje tylko pola właściwe dla wybranego wzorca (dynamiczny formularz). |
| **Funkcja „Kopiuj z lekarza"** | Przy przypisywaniu wzorca admin może wybrać innego lekarza z listy — system kopiuje wzorzec i wszystkie parametry. Przydatne gdy wielu lekarzy ma identyczne reguły (np. „jak Caroline Seeberger"). |
| **Acceptance Criteria** | ✓ Admin może wybrać jeden z 10 wzorców dla każdego lekarza GLOBAL <br> ✓ Formularz parametrów jest dynamiczny — pokazuje tylko pola dla wybranego wzorca <br> ✓ Funkcja „Kopiuj z lekarza" — kopiuje wzorzec i parametry, admin może edytować kopię <br> ✓ Wszystkie zmiany parametrów logowane (data, autor, wartość poprzednia/nowa) <br> ✓ System stosuje parametry aktualne w momencie importu wsadu |
| **Priorytet** | **Must Have** |

> ##### Wzorce kontraktu RGL (W1–W10)

---

**W1 — Dyżury Standby**
> Wynagrodzenie za dyżury gotowości (DS1/DS2/DS3/W/H) i ryczałt miesięczny (Monthly Standby). Używany m.in. przez lekarzy z kontraktami dyżurowymi (Austria).

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Stawka bazowa per zmiana — DS1 / DS2 / DS3 / W/H [€] | Wynagrodzenie za jedną zmianę danego typu dyżuru | DS1: 20, DS2: 20, DS3: 20, W/H: 70 |
| Stawka per konsultacja w dyżurze — DS1 / DS2 / DS3 / W/H [€] | Dodatkowe wynagrodzenie za każdą konsultację przeprowadzoną w trakcie dyżuru | DS1: 40, DS2: 40, DS3: 45, W/H: 70 |
| Minimalna liczba slotów per zmiana — DS1 / DS2 / DS3 / W/H | Liczba slotów wymaganych aby zmiana była rozliczana | 1 |
| Monthly Standby: ryczałt miesięczny [€] lub mnożnik (×) | Stała kwota za gotowość miesięczną LUB mnożnik sumy wszystkich DS danego miesiąca | ×2 lub stała kwota |

---

**W2 — Per konsultacja**
> Stawki za każdą zakończoną i nieudaną konsultację, opcjonalnie za recepty i typy nocne. Używany m.in. przez lekarzy czeskich i hiszpańskich.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Stawka ended dzień [€] | Za zakończoną konsultację (pora dzienna) | 10 |
| Stawka ended noc [€] *(opcjonalne)* | Za zakończoną konsultację nocną | 12 |
| Statusy failed | Lista statusów wizyty kwalifikujących do „failed" | {102, 103, 104} |
| Stawka failed [€] | Za konsultację nieudaną | 4 |
| Stawka presc [€] *(opcjonalne)* | Za każdą receptę | 5 |
| REMPe — stawka [€] *(opcjonalne)* | Dodatek za receptę specjalną (typ REMPe) | 9 |
| Stawka dyżur nocny (Shifts night) [€] *(opcjonalne)* | Wynagrodzenie za całą zmianę nocną | 50 |
| Stawka extra ended noc [€] *(opcjonalne)* | Za dodatkową konsultację nocną ponad normę | 12 |
| Stawka extra failed noc [€] *(opcjonalne)* | Za nieudaną konsultację nocną ponad normę | 6 |

---

**W3 — Extra hours (godzinowy)**
> Ryczałt za kontraktowe godziny/tydzień + wynagrodzenie za konsultacje po progu i za nadgodziny. Używany m.in. przez lekarzy portugalskich.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Ryczałt miesięczny [€] | Stała kwota za kontraktowy limit godzin tygodniowo | 300 lub 150 |
| Tygodniowy limit godzin kontraktowych | Godziny objęte ryczałtem | 14 lub 7 |
| Próg konsultacji wliczonych w ryczałt | Liczba konsultacji bez dodatkowego wynagrodzenia | 20 lub 10 |
| Stawka ended po progu [€] | Za każdą konsultację zakończoną powyżej progu | 14 |
| Stawka failed po progu [€] | Za każdą konsultację nieudaną powyżej progu | 6 |
| Stawka extra hour [€] | Za każdą godzinę powyżej limitu kontraktowego | 5 |
| Odliczenie za godzinę z konsultacją [€/h] | Koszt godziny zajętej konsultacją — odliczany od nadgodzin | 5 |
| Stawka presc [€] | Za każdą receptę | 8 |

---

**W4 — Ryczałt dzienny ze schodkami i warunkiem slotów**
> Ryczałt bazowy + schodki konsultacji dziennych, redukowany proporcjonalnie za dni bez wymaganych slotów. Opcja: osobny ryczałt nocny. Używany m.in. przez lekarzy z kontraktem OPL.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Ryczałt bazowy [€] | Do progu 1 (konsultacji dziennych) | 2700 |
| Próg 1 (cons) | Górna granica ryczałtu bazowego | 60 |
| Stawka per cons dzienna — schodek 1 [€] | Za każdą cons między progiem 1 a 2 | 36 |
| Próg 2 (cons) | Górna granica schodka 1 | 150 |
| Stawka per cons dzienna — schodek 2 [€] | Za każdą cons powyżej progu 2 | 25 |
| Stawka presc [€] | Za każdą receptę | 12 |
| Harmonogram slotów: dni robocze | Wymagane bloki godzinowe w dni powszednie (format HH–HH, UTC±X) | 9–13, 16–20 UTC+1 |
| Harmonogram slotów: weekend | Wymagane bloki godzinowe w weekend | 9–12, 17–20 UTC+1 |
| Redukcja proporcjonalna | Ryczałt obcinany proporcjonalnie do liczby dni bez pełnych slotów | tak |
| *(Opcja nocna)* Ryczałt nocny [€] | Dodatkowy ryczałt za nocne sloty | 1000 |
| *(Opcja nocna)* Próg cons nocnych | Do progu: ryczałt nocny; powyżej: stawka | 10 |
| *(Opcja nocna)* Stawka cons nocna [€] | Za każdą nocną cons powyżej progu nocnego | 80 |
| *(Opcja nocna)* Harmonogram slotów nocnych | Wymagane godziny nocne (każdy dzień miesiąca) | 0–6 |

---

**W5 — Ryczałt uproszczony ze schodkiem i slotami**
> Jeden próg konsultacji, pełna dostępność całodniowa wymagana, proporcjonalna redukcja za dni bez slotów. Używany m.in. przez lekarzy z kontraktami UAB.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Ryczałt [€] | Do progu konsultacji | 1000 |
| Próg (cons) | Po przekroczeniu: stawka per cons | 15 |
| Stawka per cons powyżej progu [€] | | 25 |
| Harmonogram slotów | Wymagane godziny w każdy dzień miesiąca (UTC±X) | 8–22 UTC+3 |
| Redukcja proporcjonalna | Ryczałt obcinany proporcjonalnie za dni bez pełnych slotów | tak |

---

**W6 — Ryczałt z dwublokowymi slotami dziennymi**
> Podobny do W5, ale wymagane dwa bloki godzinowe dziennie (rano i popołudniu). Używany m.in. przez lekarzy Milmedika i KRUPAFARM.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Ryczałt [€] | Do progu konsultacji | 600 lub 450 |
| Próg (cons) | Po przekroczeniu: stawka per cons | 40 lub 30 |
| Stawka per cons powyżej progu [€] | | 15 |
| Blok 1: wymagane godziny slotów | Np. poranny blok | 9–13 |
| Blok 2: wymagane godziny slotów | Np. popołudniowy blok | 16–20 |
| Redukcja proporcjonalna | Ryczałt obcinany proporcjonalnie za dni bez pełnych slotów | tak |

---

**W7 — Ryczałt nocny ze schodkiem i slotami**
> Ryczałt za dyżury nocne + stawka za konsultacje nocne powyżej progu. Warunek: określona liczba nocy tygodniowo z pełnymi slotami.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Ryczałt [€] | Do progu konsultacji nocnych | 520 |
| Próg (cons) | | 13 |
| Stawka per cons nocna powyżej progu [€] | | 30 |
| Wymagana liczba nocy/tydzień z dyżurem nocnym | | 5 |
| Godziny dyżuru nocnego | | 0:00–7:00 |
| Stawka presc [€] *(opcjonalne)* | Za każdą receptę | 5 |

---

**W8 — Rozliczenie grupowe z podmiotem zewnętrznym**
> Kilku lekarzy tworzy grupę rozliczeniową. Na podstawie łącznej liczby zakończonych konsultacji całej grupy wyliczana jest faktura do podmiotu zewnętrznego (np. ubezpieczyciela) — Telemedi wypłaca grupie pozostałość z ryczałtu.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Ryczałt grupowy [€] | Łączna kwota do wypłaty przez Telemedi dla grupy | 600 |
| Nazwa podmiotu zewnętrznego | Klient fakturowany na podstawie konsultacji grupy | Uniqa |
| Stawka per cons do faktury zewnętrznej [€] | Za każdą zakończoną konsultację sumarycznie w grupie | 20 |
| Wzór faktury do podmiotu zewnętrznego | Invoice_zewnętrzna = stawka × suma ended całej grupy | ended_grupa × 20 |
| Wzór rozliczenia Telemedi | Kwota do wypłaty przez Telemedi | Ryczałt − Invoice_zewnętrzna |

---

**W9 — Per recepty**
> Wynagrodzenie oparte głównie lub wyłącznie na liczbie recept. Trzy tryby: stała stawka, schodkowa lub ryczałt ze schodkiem. Opcja: dodatek RxWhizz. Używany m.in. przez lekarzy UK.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Tryb | `stały` / `schodkowy` / `ryczałt+schodek` | |
| *Tryb stały:* Stawka presc [€] | Za każdą receptę | 6, 7, 8, 9, 10, 13 |
| *Tryb schodkowy:* Stawka presc do progu [€] | | 11 lub 8 |
| *Tryb schodkowy:* Próg recept | | 30 |
| *Tryb schodkowy:* Stawka presc po progu [€] | | 10 lub 7 |
| *Tryb ryczałt+schodek:* Ryczałt [€] | Do progu recept | 330 |
| *Tryb ryczałt+schodek:* Próg recept | | 20 |
| *Tryb ryczałt+schodek:* Stawka per presc powyżej progu [€] | | 16 |
| RxWhizz dodatek [€] *(opcjonalne)* | Stały dodatek za każdą receptę wystawioną przez platformę RxWhizz | 5 |

---

**W10 — Mieszany (konsultacje + recepty)**
> Prosta kombinacja stawki za zakończone konsultacje i/lub recepty.

| Parametr | Opis | Przykładowe wartości |
|---|---|---|
| Stawka ended [€] | Za każdą konsultację zakończoną | 20 |
| Stawka presc [€] *(opcjonalne)* | Za każdą receptę | 8 |

---

#### US-E11-02 — Ustawienia bonusów per lekarz i specjalizacja

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Określić dla każdego lekarza i każdej jego specjalizacji, czy bonus (RPL-05) ma być uwzględniany przy obliczaniu wynagrodzenia. |
| **Kontekst** | Domyślnie bonus jest uwzględniany. Admin może wyłączyć bonus dla konkretnej pary lekarz+specjalizacja, jeśli wynika to z warunków umowy lub innych ustaleń. |
| **Kroki** | 1. Admin wchodzi w profil lekarza → zakładka "Ustawienia rozliczeniowe" <br> 2. Widzi listę specjalizacji przypisanych do lekarza <br> 3. Dla każdej specjalizacji toggle: "Uwzględniaj bonus" (domyślnie: **nie**) <br> 4. Zapisuje zmiany |
| **Acceptance Criteria** | ✓ Ustawienie per lekarz + specjalizacja (jeden lekarz może mieć bonus włączony dla specjalizacji A i wyłączony dla B) <br> ✓ Domyślna wartość: bonus **nie** uwzględniany (wymaga jawnego włączenia przez admina) <br> ✓ Zmiana skutkuje automatycznym przeliczeniem rozliczenia przy kolejnym imporcie lub na żądanie <br> ✓ Zmiana zalogowana z datą i autorem |
| **Priorytet** | **Must Have** |

---

#### US-E11-04 — Sprawdzanie zgodności slotów i redukcja proporcjonalna

| | |
|--|--|
| **Aktor** | System (automatycznie przy imporcie wsadu) |
| **Cel** | Weryfikować, czy lekarz z kontraktem W4/W5/W6/W7 miał wymagane sloty w każdym dniu miesiąca, i proporcjonalnie redukować ryczałt za dni bez pełnych slotów. |
| **Kontekst** | Wzorce W4, W5, W6, W7 zawierają wymagany harmonogram slotów (godziny, dni, strefa czasowa). Admin konfiguruje harmonogram w E11-01. System przy imporcie Arkusza 6 (Sloty/Dyżury GLOBAL) sprawdza zgodność i oblicza współczynnik dostępności. |
| **Kroki** | 1. System pobiera z E11 wymagany harmonogram slotów dla lekarza (wzorzec W4/W5/W6/W7) <br> 2. Liczy liczbę dni roboczych i weekendowych w danym miesiącu <br> 3. Dla każdego dnia sprawdza w Arkuszu 6 czy wymagane bloki godzinowe są pokryte slotami <br> 4. Oblicza współczynnik dostępności: (liczba dni z pełnymi slotami) ÷ (liczba dni wymaganych) <br> 5. Mnoży ryczałt bazowy przez współczynnik dostępności <br> 6. Wynik widoczny w szczegółach rozliczenia: ile dni z pełnymi slotami / ile wymaganych |
| **Acceptance Criteria** | ✓ Dla wzorców W4/W5/W6/W7: ryczałt redukowany proporcjonalnie za dni bez pełnych slotów <br> ✓ Dla W4: osobne liczenie dla dni roboczych i weekendowych (różne harmonogramy) <br> ✓ Dla W4 opcja nocna: osobny współczynnik dostępności nocnej <br> ✓ Współczynnik dostępności widoczny w szczegółach rozliczenia (admin + lekarz) <br> ✓ Liczba dni z pełnymi slotami i liczba wymaganych dni widoczne per rozliczenie <br> ✓ Jeżeli lekarz nie ma slotów w danym miesiącu w Arkuszu 6: ryczałt = 0 z ostrzeżeniem dla admina |
| **Priorytet** | **Must Have** |

---

#### US-E11-03 — Ustawienia mnożników kar per lekarz i specjalizacja

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Określić dla każdego lekarza i każdej jego specjalizacji, czy kary mają być liczone z mnożnikiem (RPL-06), czy pojedynczo (bez mnożnika). |
| **Kontekst** | Większość lekarzy ma kary liczone pojedynczo (mnożnik = ×1 niezależnie od udziału wizyt z karami). Mnożnik stosowany jest tylko dla wybranych lekarzy — tam gdzie wynika to z umowy. Kar nie można wyłączyć całkowicie — wyłączyć można jedynie mechanizm mnożnika. |
| **Kroki** | 1. Admin wchodzi w profil lekarza → zakładka "Ustawienia rozliczeniowe" <br> 2. Widzi listę specjalizacji przypisanych do lekarza <br> 3. Dla każdej specjalizacji toggle: "Stosuj mnożnik kar" (domyślnie: nie) <br> 4. Zapisuje zmiany |
| **Acceptance Criteria** | ✓ Ustawienie per lekarz + specjalizacja <br> ✓ Domyślna wartość: mnożnik nie stosowany (kary liczone pojedynczo) <br> ✓ Gdy mnożnik wyłączony: kary sumowane bez stosowania progów z RPL-06 (kwota kary = suma kwot kar z Arkusza 1) <br> ✓ Gdy mnożnik włączony: kary obliczane zgodnie z RPL-06 (progi udziału wizyt z karami → mnożnik) <br> ✓ Zmiana zalogowana z datą i autorem |
| **Priorytet** | **Must Have** |

---

#### US-E11-05 — Konfiguracja stawki za receptę per lekarz

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Ustawić indywidualną stawkę za receptę dla konkretnego lekarza, niezależnie od globalnych parametrów wzorca. Dotyczy zarówno lekarzy PL (RPL-11), jak i GLOBAL (szczególnie W9 i lekarzy z mieszanymi kontraktami). |
| **Kontekst** | Stawka za receptę jest jednym z najczęściej zróżnicowanych parametrów — lekarze mogą mieć różne stawki nawet w ramach tego samego wzorca kontraktu (np. W9: presc×6, ×7, ×8, ×9, ×10, ×13). Osobne okno ustawień upraszcza zarządzanie bez konieczności edytowania całego wzorca. |
| **Kroki** | 1. Admin wchodzi w profil lekarza → zakładka „Ustawienia rozliczeniowe" <br> 2. Sekcja „Stawka za receptę" — wyświetla aktualną stawkę (z wzorca lub własną) <br> 3. Admin wpisuje stawkę [€] lub [PLN] dla danego lekarza <br> 4. Zapisuje — stawka indywidualna nadpisuje stawkę z wzorca |
| **Acceptance Criteria** | ✓ Stawka per receptę konfigurowalna dla każdego lekarza (PL i GLOBAL) <br> ✓ Jeśli ustawiona stawka indywidualna: system używa jej zamiast stawki z wzorca W <br> ✓ Jeśli brak stawki indywidualnej: system używa stawki presc z przypisanego wzorca <br> ✓ Zmiana stawki zalogowana z datą i autorem <br> ✓ Aktualna stawka widoczna w widoku listy lekarzy (kolumna admina) |
| **Priorytet** | **Must Have** |

---

#### US-E11-06 — Konfiguracja reguł RPL (lekarze polscy)

| | |
|--|--|
| **Aktor** | Admin |
| **Cel** | Skonfigurować stawki i progi dla wszystkich reguł rozliczeniowych lekarzy polskich (RPL-01 do RPL-11), tak aby system automatycznie obliczał wynagrodzenia z Arkuszy 1–4. |
| **Zakres reguł** | RPL-01: stawka B2C / B2B · RPL-02: stawka dzień roboczy / weekend · RPL-03: stawka bezpośrednia / specjalizacja · RPL-04: dodatek za język obcy · RPL-05: kwota bonusu per wizyta + próg średniej ocen (aktywacja per lekarz+spec w E11-02) · RPL-06: progi mnożników kar (udział wizyt z karami → mnożnik; aktywacja per lekarz+spec w E11-03) · RPL-07: minimalna liczba wizyt z karami do naliczenia kar · RPL-08: stawka no-show · RPL-10: schodki konsultacji (progi i stawki per specjalizacja) · RPL-11: stawka za receptę (nadpisywalna per lekarz w E11-05) |
| **Acceptance Criteria** | ✓ Każda reguła RPL ma dedykowany formularz edycji z odpowiednimi polami <br> ✓ RPL-02 / RPL-03: stawki mogą różnić się per specjalizacja <br> ✓ RPL-06: konfiguracja progów (% wizyt z karami → mnożnik) działa globalnie, aktywacja per lekarz w E11-03 <br> ✓ Zmiany stawek logowane (data, autor, wartości) <br> ✓ Historia zmian widoczna dla admina |
| **Priorytet** | **Must Have** |
| **Notatki** | RPL-09 (stawka godzinowa dyżurów PL) poza zakresem Etapu 1 — brak arkusza dyżurów PL w pliku wsadu. |

---

## 4. Struktura pliku wsadu (XLSX)

> Admin wgrywa **jeden plik XLSX z siedmioma arkuszami**. Plik zawiera surowe dane źródłowe — aplikacja na ich podstawie oblicza wynagrodzenia zgodnie z regułami skonfigurowanymi w E11. Nie ma arkuszy z gotowymi podsumowaniami — te są generowane przez system.
>
> **Kolumny identyfikujące (wymagane we wszystkich arkuszach):** `Email lekarza` · `ID lekarza` · `Miesiąc rozliczenia` (format YYYY-MM). Brak którejkolwiek z tych kolumn = błąd importu z jasnym opisem.

---

### Arkusz 1 — Wizyty PL

> Podstawa obliczeń dla lekarzy polskich: stawki za wizyty (RPL-01, RPL-02, RPL-03), język obcy (RPL-04), kary (RPL-06, RPL-07), no-show (RPL-08).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Data wizyty | |
| 5 | Data rozpoczęcia wizyty | |
| 6 | Data zamknięcia wizyty | |
| 7 | Specjalizacja | |
| 8 | Rodzaj | |
| 9 | BU | B2C / B2B |
| 10 | Klinika | |
| 11 | Pacjent | |
| 12 | Język wizyty | |
| 13 | Pacjent nie zgłosił się | tak / nie |
| 14 | Umówienie bezpośrednie | tak / nie |
| 15 | Opóźnienie [min.] | |
| 16 | Kara | tak / nie |
| 17 | Kwota kary | Kwota jednostkowa kary przed zastosowaniem mnożnika |

**Kolumny wyliczane przez system (nie w pliku):**

| Kolumna | Formuła / Źródło | Widoczność |
|---------|-----------------|------------|
| Mnożnik kar | Zależny od udziału wizyt z karami (RPL-06) + ustawień per lekarz (E11) | Admin |
| Kwota kar z mnożnikiem | Suma kar × mnożnik | Admin + lekarz |
| Bonus | Na podstawie arkusza Oceny + Sloty PL (RPL-05) + ustawień per lekarz+spec (E11) | Admin + lekarz |
| Wynagrodzenie za wizyty | Obliczone wg RPL-01 do RPL-04 na podstawie stawek z E11 | Admin + lekarz |
| Kwota do faktury | Suma składników − kary + bonus | Admin + lekarz |
| Średnia stawka za konsultację [PLN] | Kwota do faktury ÷ Liczba wizyt | Tylko admin |
| Status rozliczenia | Zarządzany przez system | Admin + lekarz |
| Data przelewu | Uzupełniana przy imporcie CSV | Admin + lekarz |

---

### Arkusz 2 — Sloty PL

> Podstawa do obliczenia bonusu RPL-05: bonus 3 zł/wizytę gdy slot zaplanowany ≥ 7 dni przed wizytą i średnia ocen ≥ 4,75 (oceny z Arkusza 5).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Data wizyty | Klucz łączący z Arkuszem 1 |
| 5 | Data zaplanowania slotu przez pacjenta | System oblicza różnicę z datą wizyty; ≥ 7 dni = wizyta kwalifikuje się do bonusu |

---

### Arkusz 3 — Recepty PL

> Podstawa do obliczenia wynagrodzenia za recepty lekarzy polskich (RPL-11: stała stawka za receptę).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Liczba recept | Podstawa do RPL-11 |

---

### Arkusz 4 — Oceny

> Podstawa do weryfikacji warunku bonusu RPL-05 (średnia ocen ≥ 4,75). Arkusz wspólny — zawiera oceny zarówno dla lekarzy PL, jak i dla lekarzy GLOBAL (jeśli dotyczy).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Specjalizacja | Oceny mogą różnić się per specjalizacja |
| 5 | Średnia ocen | Wartość dziesiętna; system porównuje z progiem z E11 |

---

### Arkusz 5 — Wizyty GLOBAL

> Podstawa do obliczeń dla lekarzy zagranicznych: konsultacje zakończone (RGL-01), nieudane (RGL-02), schodki (RGL-04). Kolumny widoczne per kraj określone są w konfiguracji systemu (nie w strukturze pliku wsadu).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Kraj lekarza | Określa widoczność kolumn w panelu lekarza |
| 5 | Data wizyty | |
| 6 | Status wizyty | ended / failed |
| 7 | Typ dnia | dzień roboczy / weekend (Czechy) lub dzień / noc (Hiszpania); puste dla innych krajów |
| 8 | Język wizyty | |

**Kolumny wyliczane przez system (nie w pliku):**

| Kolumna | Formuła / Źródło | Widoczność |
|---------|-----------------|------------|
| Total to be paid in local currency | Suma składników wg RGL-01 do RGL-11 | Standard (Admin + lekarz) |
| Total to be paid in PLN | Kwota lokalna × kurs (EUR/GBP → PLN) z konfiguracji admina | Standard (Admin + lekarz) |
| Średnia stawka za konsultację | Kwota lokalna ÷ Consultations ended | Tylko admin |
| Status rozliczenia | Zarządzany przez system | Admin + lekarz |
| Data przelewu | Uzupełniana przy imporcie CSV | Admin + lekarz |

---

### Arkusz 6 — Sloty/Dyżury GLOBAL

> Podstawa do obliczenia wynagrodzenia za dyżury lekarzy zagranicznych (RGL-06: Monthly Standby, RGL-07: Daily Standby DS1/DS2/DS3/Weekend, RGL-08: ryczałt z progiem dostępności).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Kraj lekarza | |
| 5 | Typ dyżuru | Monthly Standby / DS1 / DS2 / DS3 / Weekend-Holiday Standby |
| 6 | Data dyżuru | |
| 7 | Data/godzina początku | |
| 8 | Data/godzina końca | |
| 9 | Liczba konsultacji w dyżurze | Używana do RGL-07 i RGL-08 |

---

### Arkusz 7 — Recepty GLOBAL

> Podstawa do obliczenia wynagrodzenia za recepty lekarzy zagranicznych (RGL-03: stawka per recepta, RGL-05: schodki recept).

| # | Kolumna | Uwagi |
|---|---------|-------|
| 1 | **Email lekarza** | ✅ Identyfikator |
| 2 | **ID lekarza** | ✅ Identyfikator |
| 3 | **Miesiąc rozliczenia** | ✅ Identyfikator (YYYY-MM) |
| 4 | Kraj lekarza | Potrzebny dla RGL-05 (schodki — progi mogą różnić się per kraj) |
| 5 | Liczba recept | |

---

### Widoczność kolumn w panelu lekarza zagranicznego

> Zasada widoczności kolumn z poprzednich wersji dokumentu (oparcie na wierszu widoczności w pliku) zostaje zastąpiona przez **konfigurację w systemie** (E11). Adminnistrator definiuje które kolumny wynikowe są widoczne dla lekarzy z danego kraju.

| Widoczność | Znaczenie |
|------------|-----------|
| **Standard** | Kolumna widoczna dla wszystkich lekarzy zagranicznych |
| **Czechy** | Konsultacje zakończone [dzień roboczy], Konsultacje zakończone [weekend] |
| **Hiszpania** | Konsultacje zakończone [dzień], Konsultacje zakończone [noc], Dyżur nocny |
| **Austria** | Monthly Standby (zmiany/dni-noce/konsultacje/kwota), Daily Standby 1/2/3, Weekend/Holiday Standby |
| *(inne kraje)* | Definiowane przez admina w konfiguracji widoczności kolumn |

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
| 7 | Jak wyglądać będzie pełna lista krajów lekarzy zagranicznych i ich specyficznych kolumn wynikowych? | E11, E3 | Do doprecyzowania |
| 8 | Czy rozliczenie zewnętrzne (RGL-10) ma być widoczne jako osobna pozycja dla księgowości? | E2 (Etap 2), E5 | Do ustalenia (Etap 2) |
| 9 | Jaki system źródłowy dla Etapu 2? | E1b | Do ustalenia (Etap 2) |
| 10 | Jak długo przechowywać historię zmian statusów? | E8 | Do ustalenia |
| 11 | Czy emaile systemowe (powiadomienia) mają być dwujęzyczne (PL/EN wg preferencji lekarza)? | E7 | Do ustalenia |
| 12 | Czy przy zmianie stawek w E11 istniejące rozliczenia powinny być automatycznie przeliczone, czy dopiero przy kolejnym imporcie wsadu? | E11, E1 | Do ustalenia |
| 13 | Czy próg średniej ocen dla bonusu RPL-05 (4,75) jest stały globalnie, czy konfigurowalny per lekarz/specjalizacja w E11? | E11 | Do ustalenia |
| 14 | Czy arkusz Oceny (Arkusz 4) zawiera oceny tylko dla lekarzy PL (bonus RPL-05), czy także dla GLOBAL? | E1, Arkusz 4 | Do ustalenia |
| 15 | W modelu W8: Invoice_zewnętrzna = stawka × suma ended całej grupy; Telemedi wypłaca: Ryczałt − Invoice_zewnętrzna (kwota grupowa). | E11 W8 | ✅ Zamknięte |
| 16 | *(Połączone z pyt. 15)* | E11 W8 | ✅ Zamknięte |
| 17 | Czy statusy failed {102, 103, 104} są stałe dla wszystkich lekarzy W2, czy konfigurowalne per lekarz? | E11 W2 | Do ustalenia |
| 18 | W modelu W4 (OPL): jak liczyć proporcjonalną redukcję — per brakujący dzień, czy per brakujący blok godzinowy? | E11 W4, US-E11-04 | Do ustalenia |
| 19 | Czy stawka indywidualna za receptę z E11-05 nadpisuje stawkę presc tylko w obliczeniach, czy też jest widoczna osobno w szczegółach rozliczenia? | E11-05 | Do ustalenia |
| 20 | RPL-09 (dyżury godzinowe PL) — czy lekarz Polski może mieć dyżury godzinowe i czy planowane jest dodanie arkusza dyżurów PL w przyszłości, czy ta reguła odpada? | E1, E11-06 | Do ustalenia |

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
| **Lekarz Zagraniczny** | Lekarz rozliczany w EUR lub GBP; oznaczony badge'em „GLOBAL" w interfejsie |
| **Badge GLOBAL** | Tekstowy znacznik wyświetlany obok nazwy lekarza zagranicznego (zamiast flagi kraju) |
| **Widoczność kolumn** | Konfiguracja w systemie (E11) określająca które kolumny wynikowe widzi lekarz z danego kraju |
| **Standard** | Kolumna widoczna dla wszystkich lekarzy zagranicznych |
| **ID lekarza** | Unikalny identyfikator konta lekarza w systemie — konieczny gdy jeden email = wiele kont |
| **Slot** | Zaplanowany termin wizyty; data zaplanowania slotu używana do obliczenia bonusu RPL-05 (min. 7 dni przed wizytą) |
| **Mnożnik kar** | Współczynnik stosowany do sumy kar, zależny od udziału wizyt z karami (RPL-06); stosowany tylko dla wybranych lekarzy per ustawienia E11 |
| **Etap 1** | MVP — import surowych danych z pliku Excel, silnik obliczeniowy oparty na stawkach z E11, panel lekarza, faktury, dashboard, płatności |
| **Etap 2** | Docelowy — integracja z systemem źródłowym (zastąpienie pliku Excel automatycznym pobieraniem danych) |
| **RPL** | Reguły rozliczeniowe dla lekarzy Polskich |
| **RGL** | Reguły rozliczeniowe dla lekarzy Globalnych (zagranicznych) |
| **Wzorzec kontraktu (W1–W10)** | Predefiniowany typ reguły rozliczeniowej przypisywany do lekarza GLOBAL; definiuje logikę i parametry obliczania wynagrodzenia |
| **REMPe** | Specjalny typ recepty generujący dodatkowe wynagrodzenie dla lekarzy z W2 (dotyczy m.in. Hiszpanii) |
| **RxWhizz** | Platforma recept UK; recepty RxWhizz mogą generować dodatkowy stały dodatek [€] w W9 |
| **DS1 / DS2 / DS3** | Typy dyżurów dziennych w modelu Standby (W1); różnią się stawkami bazowymi |
| **W/H Standby** | Dyżur weekendowy/świąteczny w modelu Standby (W1) |
| **MS (Monthly Standby)** | Ryczałt miesięczny za gotowość w modelu Standby (W1) |
| **Ended / Consultations ended** | Konsultacja zakończona sukcesem (status sukcesu) |
| **Failed / Consultations failed** | Konsultacja zakończona niepowodzeniem (konkretne statusy, np. {102, 103, 104}) |
| **Redukcja proporcjonalna** | Mechanizm obcinania ryczałtu w W4/W5/W6/W7 proporcjonalnie do dni bez wymaganych slotów |
| **Współczynnik dostępności** | Wynik obliczenia: (dni z pełnymi slotami) ÷ (dni wymaganych); mnożnik ryczałtu w W4–W7 |
| **OPL** | Oznaczenie klienta/kontraktu dla grupy lekarzy (UTC+1); obsługiwany przez wzorzec W4 |
| **UAB** | Oznaczenie klienta/kontraktu dla grupy lekarzy (UTC+3); obsługiwany przez wzorzec W5 |
