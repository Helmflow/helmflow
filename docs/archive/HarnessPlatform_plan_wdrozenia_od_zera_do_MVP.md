# HarnessPlatform — plan wdrożenia od zera do MVP

## Szczegółowa kolejność prac, zależności i kryteria odbioru

**Status dokumentu:** plan implementacji MVP  
**Powiązany dokument:** „HarnessPlatform — opis platformy, założenia i model domeny”  
**Cel:** doprowadzenie od pustego repozytorium do działającego produktu SDK-first, w którym człowiek wybiera agentów z globalnej puli lub tworzy ich wersje projektowe, uruchamia sekwencyjny przepływ SDLC, obserwuje pracę każdego agenta w osobnym sandboxie oraz ocenia zmiany per agent, etap, plik i cały projekt. Web jest interfejsem domyślnym, terminal alternatywnym, a „platforma” oznacza skalę wykonania, nie osobny produkt.

---

## 1. Jak został wykonany podział prac

### 1.1. Punkt wyjścia: jeden przepływ wartości

Plan nie został podzielony według warstw technicznych typu „najpierw cały backend, później cały frontend”. Podstawą podziału jest jeden przepływ wartości MVP:

```text
Globalni i projektowi agenci
→ Work Item i kryteria
→ sekwencja etapów SDLC
→ osobny sandbox i trajectory każdego agenta
→ Project Version oraz Handoff pomiędzy etapami
→ zmiany per agent, etap, plik i cały projekt
→ końcowy rezultat z dowodami
→ review człowieka, poprawki albo integracja
```

Każdy krok usuwa konkretną przeszkodę blokującą ten przepływ.

### 1.2. Sześć zasad dekompozycji

Liczba i kolejność kroków wynikają z sześciu reguł:

1. **Ryzyko przed rozbudową** — najpierw sprawdzane są DSH Python SDK, MiniMax przez LiteLLM, odbieranie zdarzeń i resume. Bez tego nie ma sensu budować właściwego produktu.
2. **Zależności przed równoległością** — pojęcia i cykle życia powstają przed GUI, które będzie je prezentowało.
3. **Jedno główne zobowiązanie na krok** — krok ma jeden dominujący rezultat, np. działający sandbox albo kompletna rejestracja zmian.
4. **Mierzalna bramka wyjścia** — każdy krok kończy się testem, demonstracją lub artefaktem, który można jednoznacznie odebrać.
5. **Oddzielenie źródeł prawdy** — domena, DSH trajectory, stan plików i review są wdrażane jako osobne odpowiedzialności.
6. **Pionowe przyrosty** — po zakończeniu kolejnych faz system jest coraz bardziej używalny, a nie tylko bardziej rozbudowany wewnętrznie.

### 1.3. Dlaczego dokładnie 24 kroki

Plan zawiera **24 kroki w 7 fazach**. Liczba nie jest estymacją czasu ani docelową liczbą ticketów. Jest liczbą minimalnych punktów kontrolnych potrzebnych, aby:

- osobno zamknąć cztery główne ryzyka techniczne,
- nie połączyć domeny z detalami DSH,
- potraktować sandbox jako funkcję bezpieczeństwa, a nie polecenie `docker run`,
- zbudować historię zmian niezależną od rozmowy agenta,
- rozdzielić sandboxy następujących po sobie agentów,
- wprowadzić kontrolowane przekazanie Project Version i Handoff Package,
- zachować pochodzenie globalnych i projektowych wersji agentów,
- zakończyć proces kontrolowaną decyzją człowieka,
- przeprowadzić odbiór i przygotować powtarzalne wydanie self-hosted.

Mniejsza liczba kroków łączyłaby różne ryzyka w duże, trudne do odebrania zadania. Większa liczba na tym poziomie opisu schodziłaby już do ticketów implementacyjnych, które powinny powstać dopiero po spike'u technicznym.

### 1.4. Fazy i ich funkcja

| Faza | Kroki | Cel bramki |
|---|---:|---|
| 0. Definicja MVP | 1–2 | wiadomo, co budujemy i czego świadomie nie budujemy |
| 1. Redukcja ryzyka | 3–5 | potwierdzono działanie DSH, MiniMax, zdarzeń i resume |
| 2. Fundament platformy | 6–9 | istnieje uruchamialny szkielet produktu i środowiska |
| 3. Rdzeń domenowy | 10–13 | istnieją globalni i projektowi agenci, Project Space oraz SDLC Flow |
| 4. Kontrolowane wykonanie | 14–18 | kolejne etapy działają w oddzielnych, obserwowalnych sandboxach |
| 5. Traceability zmian | 19–21 | zmiany są widoczne per agent, etap, plik i cały projekt |
| 6. Produkt i wydanie MVP | 22–24 | użytkownik przechodzi pełny proces i może wdrożyć system |

### 1.5. Kroki nie są sprintami

Krok może wymagać kilku małych ticketów i może być realizowany przez kilka osób. Nie należy przypisywać mu daty przed zakończeniem fazy redukcji ryzyka. Dopiero wyniki kroków 3–5 pokażą:

- jak stabilne jest SDK,
- jak wygląda rzeczywisty format zdarzeń,
- czy potrzebny jest plugin TypeScript/Cordis, czy wystarczy warstwa Python,
- jak zachowuje się MiniMax podczas długiego tool callingu,
- ile pracy wymaga wznowienie sesji i korelacja diffów.

---

## 2. Zamrożona definicja MVP

### 2.1. Scenariusz użytkownika

MVP musi obsłużyć następujący scenariusz bez ręcznej ingerencji w stan serwera:

1. Użytkownik posiada globalny katalog agentów niezależny od projektów.
2. Dodaje Project Space i repozytorium.
3. Wybiera globalne wersje agentów albo tworzy ich wersje projektowe.
4. Przypisuje agentom wersjonowaną wiedzę globalną i projektową.
5. Tworzy Work Item wraz z kryteriami akceptacji.
6. Wybiera sekwencyjny SDLC Flow: analiza, plan/architektura, implementacja, testy i review.
7. Przypisuje konkretną wersję agenta do każdego etapu.
8. Uruchamia SDLC Run ze znanej bazowej Project Version.
9. Dla pierwszego Stage Run powstaje osobny sandbox, workspace i Harness home.
10. DSH działa z MiniMax przez LiteLLM i zapisuje trajectory tego agenta.
11. Agent przekazuje do Project Space artefakty, nową Project Version i Handoff Package.
12. Sandbox pierwszego agenta nie jest przekazywany kolejnemu agentowi.
13. Następny agent rozpoczyna pracę w świeżym sandboxie od kontrolowanego wyjścia poprzednika.
14. Użytkownik obserwuje cały SDLC Run oraz trajectory każdego agenta osobno.
15. Użytkownik może oglądać historię pliku i diff per agent, etap albo globalnie.
16. Etap testów lub review może skierować pracę ponownie do implementacji.
17. Końcowy Project Deliverable zawiera zmiany, dowody, handoffy i ryzyka wszystkich etapów.
18. Użytkownik akceptuje rezultat albo żąda dalszych poprawek.
19. Projektowa wersja agenta może zostać zgłoszona do kontrolowanej promocji do globalnej puli.
20. Usunięcie sandboxów nie usuwa historii audytowej ani wersji projektu.

### 2.2. Ograniczenia MVP

MVP przyjmuje świadome ograniczenia:

- jeden człowiek korzystający z pojedynczej instalacji,
- jedno repozytorium na Work Item,
- wielu agentów następujących po sobie w sekwencyjnym SDLC Flow,
- jeden agent wykonujący pojedynczy Stage Run,
- osobny sandbox dla każdego Agent Run,
- brak bezpośredniego współdzielenia writable workspace pomiędzy agentami,
- DeepSeek Harness jako jedyny runtime,
- MiniMax jako domyślny model,
- LiteLLM jako jedyna brama modelowa,
- Docker lub Podman jako pierwsza implementacja sandboxa,
- brak automatycznego managera agentów,
- brak równoległego modyfikowania tej samej Project Version,
- brak automatycznego rozwiązywania konfliktów równoległych gałęzi,
- brak automatycznego merge i deploymentu,
- brak publicznego SaaS i pełnej wielodostępności,
- brak obsługi OpenHands i OpenCode.

### 2.3. Rekomendowany stos początkowy

Poniższy stos jest rekomendacją startową, a nie nienaruszalnym elementem domeny:

- rdzeń i publiczne SDK: Python 3.12,
- cienki host Web: FastAPI wywołujące publiczne SDK,
- runtime agenta: `deepseek-harness-sdk` z przypiętą wersją,
- frontend: React + TypeScript,
- stan domenowy: PostgreSQL,
- artefakty, logi i patche: storage obiektowy zgodny z S3 albo lokalny storage za jedną abstrakcją,
- zdarzenia na żywo: SSE lub WebSocket,
- model gateway: LiteLLM,
- sandbox MVP: rootless Docker lub Podman,
- środowisko deweloperskie i instalacja MVP: Docker Compose,
- kontrola jakości: pytest, testy frontendowe i testy end-to-end.

Nie należy dodawać Redis, Kubernetes ani osobnej platformy workflow, dopóki konkretna potrzeba nie zostanie potwierdzona. W MVP prostszy worker oraz trwała kolejka oparta na istniejącym magazynie stanu mogą być wystarczające.

---

## 3. Docelowy kształt repozytorium MVP

Rekomendowany podział kodu:

```text
HarnessPlatform/
├── apps/
│   ├── api/                   # wejście do rdzenia aplikacji
│   ├── worker/                # orkiestracja długich operacji
│   └── web/                   # GUI użytkownika
├── packages/
│   ├── domain/                # pojęcia i reguły domenowe
│   ├── application/           # przypadki użycia
│   ├── sdk/                   # publiczne wejście dla Web, CLI i aplikacji
│   └── runtime-dsh/           # integracja z DSH bez domeny produktu
├── services/
│   └── sandbox-controller/    # wąski właściciel mechanizmu kontenerowego
├── plugins/
│   └── dsh-harnessplatform/   # pluginy i profile DSH
├── images/
│   └── dsh-runner/            # przypięty obraz Agent Run
├── infra/
│   └── compose/               # lokalna i self-hosted instalacja
├── tests/
│   ├── integration/
│   ├── contract/
│   └── e2e/
└── docs/
    ├── adr/
    └── runbooks/
```

Najważniejsza zasada: `packages/domain` nie importuje bibliotek DSH, Docker SDK, FastAPI ani klienta LiteLLM.

---

# Faza 0. Definicja i granice MVP

## Krok 1. Ustalenie Definition of Done produktu

### Cel

Zamienić ogólną wizję platformy w jeden mierzalny scenariusz odbioru.

### Prace

- Spisać głównego użytkownika: właściciel projektu pełniący rolę Engineering Managera lub Tech Leada.
- Wybrać jedno reprezentatywne repozytorium demonstracyjne.
- Przygotować jedno realistyczne zadanie demonstracyjne obejmujące zmianę kodu i test.
- Zdefiniować kryteria akceptacji tego zadania.
- Ustalić, jakie informacje muszą być widoczne podczas sesji.
- Ustalić, jakie informacje muszą znaleźć się w końcowym Deliverable.
- Rozróżnić „agent zakończył pracę”, „człowiek zaakceptował” oraz „zmiana została zintegrowana”.
- Zamrozić listę funkcji poza MVP.

### Rezultat

Jednostronicowy opis demonstracji końcowej oraz lista warunków zaliczenia MVP.

### Kryterium wyjścia

Zespół potrafi przeprowadzić na papierze cały proces od utworzenia agenta do decyzji review i dla każdego etapu wskazać oczekiwany rezultat widoczny dla użytkownika.

### Zależności

Brak.

### Typowy błąd

Uznanie „agent zmienił plik” za wystarczający wynik. MVP ma udowodnić kontrolowany proces, a nie jednorazowe uruchomienie modelu.

---

## Krok 2. Decyzje architektoniczne i minimalny threat model

### Cel

Zapisać decyzje, których późniejsza zmiana byłaby kosztowna lub ryzykowna.

### Prace

- Utworzyć ADR: DSH jest jedynym runtime'em MVP.
- Utworzyć ADR: DSH jest rozszerzany pluginami, a nie modyfikowany w rdzeniu.
- Utworzyć ADR: domena HarnessPlatform jest niezależna od konfiguracji DSH.
- Utworzyć ADR: MiniMax jest dostępny wyłącznie przez LiteLLM.
- Utworzyć ADR: cały Python SDK i DSH działają wewnątrz sandboxa.
- Utworzyć ADR: trajectory, historia plików i review są odrębnymi źródłami informacji.
- Utworzyć ADR: audytowe źródło prawdy znajduje się poza sandboxem.
- Opisać chronione zasoby: kod, klucz modelu, repozytoria, host, logi, decyzje review.
- Opisać podstawowe zagrożenia: odczyt hosta, wyciek sekretu, niekontrolowany egress, modyfikacja `.git`, zapełnienie dysku, fork bomb, utrata logów, podszycie się pod zdarzenie.
- Ustalić jawne ograniczenia bezpieczeństwa kontenerowego MVP.

### Rezultat

Zestaw krótkich ADR oraz threat model wskazujący zabezpieczenia wymagane przed uruchomieniem agenta.

### Kryterium wyjścia

Każda uprzywilejowana operacja ma wskazanego właściciela, a żaden komponent poza Sandbox Controllerem nie wymaga Docker socketu.

### Zależności

Krok 1.

---

# Faza 1. Redukcja ryzyka technicznego

## Krok 3. Minimalne uruchomienie DeepSeek Harness Python SDK

### Cel

Potwierdzić, że przypięta wersja Python SDK może wykonać zadanie w kontrolowanym katalogu i zapisać sesję.

### Prace

- Wybrać i przypiąć konkretną wersję pakietu oraz runtime'u DSH.
- Utworzyć minimalny program uruchamiający `DeepSeekHarness`.
- Przekazać jawne ścieżki `cwd`, `dsh_home` i jawny `session_id`.
- Uruchomić DSH na jednorazowej kopii małego repozytorium.
- Potwierdzić utworzenie logu JSONL w osobnym Harness home.
- Sprawdzić zachowanie dla sukcesu, błędu narzędzia i przerwania procesu.
- Zapisać dokładną wersję runtime'u i sposób reprodukcji testu.
- Nie integrować jeszcze backendu ani GUI.

### Rezultat

Powtarzalny skrypt PoC wykonujący proste zadanie i pozostawiający kompletny log sesji.

### Kryterium wyjścia

Ten sam test uruchomiony dwukrotnie z różnymi `session_id` i różnymi Harness home nie miesza konfiguracji ani logów.

### Zależności

Krok 2.

### Krytyczna uwaga

Dokumentacja DSH wskazuje, że profil `sdk-minimal` używa lokalnego shella i `danger-full-access`; test musi odbywać się na disposable workspace, a docelowo wewnątrz kontenera. [DSH Python SDK](https://deepseek-harness.github.io/deepseek-harness/en/guide/python-sdk)

---

## Krok 4. Walidacja LiteLLM i MiniMax

### Cel

Udowodnić rzeczywistą, a nie deklarowaną kompatybilność MiniMax z DSH przez LiteLLM.

### Prace

- Uruchomić LiteLLM lokalnie jako osobny serwis.
- Skonfigurować alias modelu używany przez HarnessPlatform.
- Skonfigurować DSH jako klienta niestandardowego endpointu zgodnego z OpenAI.
- Sprawdzić zwykłą odpowiedź tekstową.
- Sprawdzić tool calling z wieloma kolejnymi wywołaniami.
- Sprawdzić przekazanie system promptu i ról wiadomości.
- Sprawdzić obsługę limitu odpowiedzi i długiego kontekstu.
- Sprawdzić retry, timeout, anulowanie oraz błąd dostawcy.
- Sprawdzić, czy odpowiedzi strumieniowe i usage są poprawnie przekazywane.
- Ustalić wymagane ustawienia kompatybilności, w szczególności `developer role`, pole limitu tokenów i format reasoning.
- Zmierzyć jakość na co najmniej dwóch małych zadaniach programistycznych, a nie tylko na pytaniu tekstowym.
- Potwierdzić, że główny klucz MiniMax znajduje się tylko w LiteLLM.

### Rezultat

Zamrożona konfiguracja połączenia DSH → LiteLLM → MiniMax i raport znanych ograniczeń.

### Kryterium wyjścia

Agent kończy reprezentatywne zadanie obejmujące odczyt pliku, edycję, wykonanie testu i podsumowanie, a żądania nie wymagają bezpośredniego klucza MiniMax w środowisku DSH.

### Zależności

Krok 3.

### Krytyczna uwaga

DSH ostrzega, że endpoint opisany jako OpenAI-compatible może różnić się obsługą ról i pól tokenów. Tego kroku nie wolno zastąpić sprawdzeniem samego `GET /models`. [Konfiguracja modeli DSH](https://deepseek-harness.github.io/deepseek-harness/en/guide/providers)

---

## Krok 5. Walidacja zdarzeń, trwałości i resume

### Cel

Potwierdzić, że platforma będzie mogła obserwować i wznowić wykonanie bez opierania się wyłącznie na końcowej odpowiedzi SDK.

### Prace

- Zidentyfikować zdarzenia i notyfikacje dostępne z Python SDK.
- Ustalić, które zdarzenia wymagają pluginu Cordis eksportującego je do HarnessPlatform.
- Przechwycić co najmniej: rozpoczęcie, odpowiedź modelu, wywołanie narzędzia, rezultat narzędzia, zmianę planu, zakończenie i błąd.
- Sprawdzić kolejność, identyfikatory i zachowanie zdarzeń podczas retry.
- Sprawdzić, czy zdarzenia mogą zostać dostarczone więcej niż raz.
- Zdefiniować zasady idempotentnego zapisu po stronie platformy.
- Przerwać proces po zmianie pliku i uruchomić go ponownie z tym samym workspace'em, Harness home i `session_id`.
- Potwierdzić, że kontynuacja nie tworzy niezależnej historii.
- Sprawdzić zachowanie po uszkodzeniu lub braku jednego z elementów stanu.
- Zdecydować, czy MVP korzysta z profilu minimalnego rozszerzonego patchami, czy z własnego profilu opartego na pełniejszej kompozycji.

### Rezultat

PoC eksportu zdarzeń oraz udokumentowana procedura resume.

### Kryterium wyjścia

Po kontrolowanym przerwaniu agent kontynuuje tę samą sesję, a platforma otrzymuje jedną logiczną, uporządkowaną historię bez utraty wcześniejszych zdarzeń.

### Zależności

Kroki 3–4.

### Bramka fazy 1

Jeżeli DSH nie pozwala stabilnie eksportować zdarzeń, MiniMax nie obsługuje potrzebnego tool callingu albo resume wymaga odtworzenia niejawnego stanu, należy zatrzymać budowę produktu i zmienić decyzję techniczną. Nie należy maskować tego problemu dodatkowym GUI.

---

# Faza 2. Fundament platformy

## Krok 6. Utworzenie repozytorium i standardów pracy

### Cel

Stworzyć powtarzalne środowisko, w którym kolejne elementy powstają według tych samych reguł.

### Prace

- Utworzyć strukturę monorepo.
- Skonfigurować zarządzanie zależnościami Pythona i frontendu.
- Dodać formatowanie, linting, testy jednostkowe i kontrolę typów.
- Ustalić konwencje logowania i identyfikatorów korelacyjnych.
- Dodać skanowanie sekretów.
- Dodać podstawowe sprawdzanie zależności pod kątem znanych podatności.
- Przygotować przykładową konfigurację bez sekretów.
- Ustalić sposób przypinania obrazów i wersji DSH.
- Utworzyć CI wykonujące testy bez dostępu do produkcyjnych kluczy.
- Dodać katalog ADR i runbooków.

### Rezultat

Repozytorium, które można sklonować, uruchomić i przetestować jedną udokumentowaną procedurą.

### Kryterium wyjścia

Czysty checkout przechodzi lint, type check i testy w CI oraz uruchamia szkielet usług lokalnie.

### Zależności

Bramka fazy 1.

---

## Krok 7. Application Engine, publiczne SDK, worker i trwały stan

### Cel

Zbudować wspólny silnik i publiczne Python SDK, z których korzystają wszystkie interfejsy, oraz oddzielić krótkie operacje użytkownika od długotrwałych uruchomień agentów.

### Prace

- Utworzyć Application Engine realizujący przypadki użycia bez zależności od Web i CLI.
- Utworzyć publiczne Python SDK jako jedyne programistyczne wejście do Engine.
- Zapewnić w SDK operacje asynchroniczne, streaming zdarzeń, cancel i resume.
- Utworzyć cienki proces API wywołujący SDK bez własnych reguł domenowych.
- Utworzyć osobny proces worker odpowiedzialny za orkiestrację sesji.
- Uruchomić PostgreSQL i mechanizm migracji.
- Zapewnić trwałe zapisywanie zmian stanu domenowego.
- Dodać trwały mechanizm zlecania pracy workerowi, bez polegania wyłącznie na pamięci procesu.
- Dodać idempotency dla operacji uruchomienia, zatrzymania i wznowienia.
- Dodać mechanizm wykrywania pracy porzuconej po restarcie procesu.
- Przygotować storage artefaktów za jednym interfejsem implementacyjnym.
- Rozróżnić metadane domenowe od dużych artefaktów, takich jak logi i patche.
- Wprowadzić zegar i generowanie identyfikatorów jako kontrolowane zależności testowe.

### Rezultat

SDK, cienki host Web i worker współpracujące przez trwały stan; restart jednego procesu nie usuwa zleconej pracy.

### Kryterium wyjścia

Test integracyjny tworzy zlecenie, zatrzymuje worker przed wykonaniem, uruchamia go ponownie i potwierdza wykonanie bez podwójnego rezultatu.

### Zależności

Krok 6.

---

## Krok 8. Domyślny Web GUI, terminal i komunikacja na żywo

### Cel

Przygotować domyślny interfejs Web, alternatywny interfejs terminalowy oraz wspólny kanał prezentowania długotrwałych operacji SDK.

### Prace

- Utworzyć aplikację React/TypeScript.
- Dopilnować, aby host Web wywoływał wyłącznie publiczne SDK.
- Utworzyć minimalne CLI wywołujące te same przypadki użycia bez osobnej logiki biznesowej.
- Dodać podstawową nawigację: Global Agents, Projects, Knowledge, Work Items, SDLC Runs i Reviews.
- Wprowadzić wspólną obsługę błędów i stanów ładowania.
- Wybrać SSE albo WebSocket na podstawie potrzeb komunikacji.
- Zaimplementować reconnect oraz wznowienie od ostatniego znanego zdarzenia.
- Rozróżnić aktualny stan sesji od strumienia historycznych zdarzeń.
- Dodać prosty ekran diagnostyczny pokazujący sztuczny strumień zdarzeń.
- Zapewnić, że odświeżenie przeglądarki nie powoduje utraty historii.

### Rezultat

Web GUI i CLI korzystające z tego samego SDK; Web potrafi wyświetlić trwałą historię oraz nowe zdarzenia w czasie rzeczywistym.

### Kryterium wyjścia

Po zerwaniu i odtworzeniu połączenia UI nie gubi ani nie duplikuje widocznych zdarzeń.

### Zależności

Krok 7.

---

## Krok 9. Obserwowalność samej platformy

### Cel

Zapewnić możliwość diagnozowania platformy niezależnie od trajectory agenta.

### Prace

- Wprowadzić strukturalne logi z identyfikatorami Project Space, Work Item, SDLC Run, Stage Run, Agent Run i sandboxa.
- Dodać metryki czasu oczekiwania, czasu uruchomienia sandboxa i długości sesji.
- Dodać metryki liczby aktywnych, zakończonych i osieroconych sesji.
- Rozdzielić błędy platformy, sandboxa, DSH, model gateway i zadania użytkownika.
- Dodać healthchecki usług.
- Dodać redakcję sekretów oraz wrażliwego payloadu.
- Ustalić politykę retencji logów technicznych.
- Dodać prosty widok administracyjny lub zestaw poleceń diagnostycznych.

### Rezultat

Minimalny zestaw logów i metryk pozwalający zlokalizować awarię w konkretnym komponencie.

### Kryterium wyjścia

Celowo wywołane błędy bazy, sandboxa i LiteLLM są rozróżnialne bez przeglądania surowego logu DSH.

### Zależności

Kroki 7–8.

---

# Faza 3. Rdzeń domenowy

## Krok 10. Project Space, repozytorium i Project Versions

### Cel

Ustanowić trwałą przestrzeń projektu oraz kontrolowane wersje kodu i artefaktów przekazywane pomiędzy agentami.

### Prace

- Zaimplementować Project oraz Project Space jako granicę wiedzy, procesów, artefaktów i audytu projektu.
- Zaimplementować rejestrację jednego repozytorium dla projektu w MVP.
- Zweryfikować dostęp do repozytorium bez uruchamiania agenta.
- Odczytać i utrwalić kanoniczny adres oraz domyślną gałąź.
- Ustalić sposób pobierania kodu przez kontrolowany komponent, nie przez GUI.
- Oddzielić poświadczenia repozytorium od poświadczeń modelu.
- W MVP preferować odczyt repozytorium i eksport patcha zamiast uprawnień do push.
- Zaimplementować niezmienną Project Version jako wejście i wyjście etapów.
- Zapisywać bazową Project Version oraz commit dla każdego SDLC Run.
- Zapewnić, że Project Space nie jest jednym współdzielonym writable workspace.
- Przechowywać artefakty etapów obok wersji kodu, ale poza sandboxami agentów.
- Obsłużyć niedostępne repozytorium, nieistniejącą rewizję i zmienioną gałąź.

### Rezultat

Project Space może wskazać repozytorium, przechować wersje projektu i przygotować czystą kopię wybranej Project Version dla nowego agenta.

### Kryterium wyjścia

Platforma dwukrotnie przygotowuje identyczny stan projektu dla tej samej Project Version, a zmiana w pierwszej kopii nie pojawia się w drugiej.

### Zależności

Krok 7.

---

## Krok 11. Global Agent Catalog i projektowe wersje agentów

### Cel

Pozwolić użytkownikowi zarządzać agentami niezależnie od projektów, tworzyć wersje projektowe i kontrolowanie promować je do globalnej puli.

### Prace

- Zaimplementować Role jako opis odpowiedzialności.
- Zaimplementować Agent Definition jako trwałą tożsamość agenta.
- Zaimplementować Global Agent Catalog niezależny od Project Space.
- Zaimplementować niezmienne Global Agent Versions.
- Pozwolić projektowi wybrać konkretną wersję globalną.
- Zaimplementować Project Agent Version wyprowadzoną z wersji globalnej albo utworzoną lokalnie.
- Zachować pochodzenie projektowej wersji agenta.
- Ująć w wersji agenta jego instrukcje, rolę, domyślny profil modelu i wymagane polityki.
- Uniemożliwić zmianę wersji agenta użytej już przez rozpoczęty Agent Run.
- Pozwolić utworzyć nową wersję na podstawie poprzedniej.
- Pokazać różnicę pomiędzy wersjami w GUI.
- Zaimplementować Agent Promotion Candidate.
- Podczas promocji wymagać oddzielenia wiedzy ogólnej od projektowej i review człowieka.
- Promocja tworzy nową wersję globalną i nie aktualizuje automatycznie istniejących projektów.
- Przygotować kompilator domenowej Agent Version do manifestu uruchomienia.
- Nie umieszczać struktur DSH w rdzeniu domenowym.

### Rezultat

Użytkownik wybiera agenta globalnego, tworzy jego projektową wersję, używa jej w etapie SDLC i może zgłosić ją do globalnej puli bez wpływu na inne projekty.

### Kryterium wyjścia

Promocja Project Agent Version tworzy nową Global Agent Version, zachowuje pochodzenie i nie zmienia historycznych ani aktywnych Agent Runs.

### Zależności

Kroki 7–8.

---

## Krok 12. Knowledge Pack, wersje i manifest wiedzy

### Cel

Dostarczyć agentowi kontrolowaną i odtwarzalną wiedzę bez budowania nieograniczonego RAG.

### Prace

- Zaimplementować Knowledge Pack jako spójny zestaw instrukcji lub materiałów.
- Rozróżnić wiedzę globalną, projektową, repozytoryjną, roli, etapu i Work Item.
- Zaimplementować niezmienne Knowledge Versions.
- Pozwolić przypisać Knowledge Pack do projektu, roli lub agenta.
- Utworzyć Knowledge Manifest dla konkretnego Agent Run.
- Ustalić deterministyczną kolejność składania instrukcji.
- Dodać limity rozmiaru i ostrzeżenia o konflikcie instrukcji.
- Zapisywać pochodzenie każdego fragmentu kontekstu.
- Przygotować prosty podgląd dokładnej wiedzy przekazywanej agentowi.
- Zaimplementować Knowledge Promotion Candidate dla wiedzy projektowej możliwej do uogólnienia.
- Wymagać review i usunięcia danych projektowych przed promocją globalną.
- Nie implementować semantycznego wyszukiwania, dopóki statyczne paczki wiedzy nie okażą się niewystarczające.

### Rezultat

Agent otrzymuje zamknięty manifest konkretnych wersji wiedzy, a użytkownik może zobaczyć jego zawartość przed startem Agent Run.

### Kryterium wyjścia

Ponowne przygotowanie manifestu z tymi samymi wersjami daje ten sam uporządkowany kontekst, niezależnie od nowszych wersji paczek.

### Zależności

Krok 11.

---

## Krok 13. Work Items, SDLC Flow, etapy i przydziały agentów

### Cel

Utworzyć bazowy pełny SDLC, w którym kolejni agenci realizują etapy i przekazują kontrolowane rezultaty.

### Prace

- Zaimplementować Work Item, którego najprostszym rodzajem jest Task.
- Zaimplementować Acceptance Criteria jako jawne warunki odbioru.
- Zaimplementować SDLC Flow Definition jako uporządkowaną definicję etapów i bramek.
- Dostarczyć bazowy flow: analiza → architektura/plan → implementacja → testy → review.
- Zaimplementować SDLC Run dla konkretnego Work Item i bazowej Project Version.
- Zaimplementować Stage oraz Stage Run.
- Zaimplementować Agent Assignment wiążący Stage Run z konkretną globalną albo projektową wersją agenta.
- Zdefiniować wejścia, oczekiwane artefakty i warunki zakończenia etapu.
- Zaimplementować Handoff Package pomiędzy etapami.
- Zamrozić wersję agenta i manifest wiedzy osobno dla każdego Agent Run.
- Zaimplementować stany całego flow oraz osobne stany Stage Run.
- Zaimplementować dozwolone przejścia oraz przyczynę każdego przejścia.
- Pozwolić testom albo review skierować wykonanie z powrotem do implementacji.
- Rozdzielić zakończenie agenta, zakończenie etapu i zakończenie całego SDLC Run.
- Uniemożliwić agentowi samodzielne przejście do Approved.
- Dodać historię zmian stanu widoczną dla użytkownika.
- Obsłużyć ponowne przydzielenie bez usuwania wcześniejszej historii.

### Rezultat

Użytkownik może przygotować Work Item, wybrać sekwencyjny SDLC Flow i przypisać wersje agentów do jego etapów.

### Kryterium wyjścia

Testy domenowe odrzucają pominięcie wymaganego etapu lub bramki i potwierdzają powrót `Review → Implementation → Tests` bez utraty wcześniejszej historii.

### Bramka fazy 3

Można skonfigurować wszystko, czego potrzebuje uruchomienie, ale system nie musi jeszcze faktycznie uruchamiać agenta.

---

# Faza 4. Kontrolowane wykonanie

## Krok 14. Sandbox Controller i cykl życia środowiska

### Cel

Utworzyć jedyny komponent uprawniony do zarządzania izolowanymi środowiskami.

### Prace

- Wydzielić Sandbox Controller jako osobny proces lub usługę.
- Ograniczyć jego interfejs do operacji potrzebnych platformie.
- Zaimplementować tworzenie, start, stop, inspekcję i usunięcie sandboxa.
- Nadać każdemu sandboxowi jednoznaczny związek z jednym Agent Run i Project Space.
- Tworzyć osobne volumes dla workspace'u i Harness home.
- Tworzyć świeży sandbox dla każdego kolejnego agenta w SDLC Run.
- Zabronić montowania writable workspace'u poprzedniego agenta.
- Dopuszczać wyłącznie import wskazanej Project Version i kontrolowanych artefaktów Handoff Package.
- Uruchamiać kontener jako użytkownik bez roota.
- Usunąć zbędne capabilities.
- Wprowadzić limity CPU, RAM, liczby procesów, czasu i miejsca na dysku.
- Ustawić read-only root filesystem z jawnymi miejscami zapisu.
- Nie montować katalogu użytkownika, repozytorium hosta ani Docker socketu do kontenera agenta.
- Zaimplementować automatyczne sprzątanie zasobów osieroconych.
- Dodać etykiety i identyfikatory pozwalające przeprowadzić reconciliation po restarcie.
- Rozróżnić zatrzymanie z zachowaniem stanu od trwałego usunięcia.

### Rezultat

Sandbox Controller potrafi niezawodnie zarządzać pustym środowiskiem Agent Run.

### Kryterium wyjścia

Test bezpieczeństwa potwierdza, że proces w sandboxie nie widzi plików hosta, sandboxa poprzedniego agenta ani mechanizmu kontenerowego oraz zostaje zatrzymany po przekroczeniu limitu.

### Zależności

Kroki 2 i 7.

### Ograniczenie

Kontener nie jest pełną granicą bezpieczeństwa dla wrogiego, publicznego multi-tenant SaaS. Jest świadomym kompromisem lokalnego, self-hostowanego MVP.

---

## Krok 15. Obraz DSH Runner i profil HarnessPlatform

### Cel

Zbudować powtarzalne środowisko zawierające przypięty runtime, Python SDK oraz pluginy platformy.

### Prace

- Przygotować minimalny obraz bazowy z Pythonem, Git i potrzebnymi narzędziami.
- Zainstalować przypiętą wersję `deepseek-harness-sdk`.
- Przypiąć obraz po digest, nie tylko po ruchomym tagu.
- Utworzyć profil `hp-standard` przeznaczony dla HarnessPlatform.
- Dodać plugin wstrzykujący instrukcje agenta, zadanie i Knowledge Manifest.
- Dodać plugin eksportujący zdarzenia DSH.
- Dodać narzędzie lub plugin pozwalający agentowi jawnie raportować intencję, uzasadnienie, weryfikację i ryzyko zmiany.
- Usunąć narzędzia niepotrzebne w MVP.
- Zapewnić, że runner używa wyłącznie jawnego workspace'u i Harness home.
- Dodać deterministyczny startup i jednoznaczne raportowanie gotowości.
- Wygenerować SBOM obrazu.
- Uruchomić skan podatności oraz zapisać zaakceptowane wyjątki.

### Rezultat

Wersjonowany obraz `dsh-runner`, który może wykonać zadanie bez dostępu do hosta.

### Kryterium wyjścia

Ten sam obraz i manifest uruchomienia wykonują PoC z fazy 1 wewnątrz sandboxa, a wersje runtime'u są widoczne w historii sesji.

### Zależności

Kroki 5, 12 i 14.

---

## Krok 16. Orkiestracja SDLC Run, Stage Run i Agent Run

### Cel

Połączyć Work Item z sekwencją etapów, agentów, wersji projektu i odseparowanych sandboxów.

### Prace

- Utworzyć SDLC Run dla Work Item i bazowej Project Version.
- Tworzyć kolejne Stage Runs zgodnie z SDLC Flow Definition.
- Dla Stage Run wybrać konkretną Global Agent Version albo Project Agent Version.
- Utworzyć Agent Run i zamrozić Agent Version, Knowledge Manifest, Runtime Profile, Model Profile oraz wejściową Project Version.
- Poprosić Sandbox Controller o utworzenie nowego środowiska dla Agent Run.
- Przygotować świeży workspace z wejściowej Project Version bez współdzielenia go z poprzednikiem.
- Utworzyć świeży Harness home.
- Wygenerować ograniczone poświadczenie LiteLLM dla uruchomienia albo zastosować równoważny mechanizm ograniczenia.
- Wstrzyknąć wyłącznie sekrety potrzebne danej sesji.
- Uruchomić runner i przeprowadzić handshake gotowości.
- Zmienić stan Stage Run dopiero po potwierdzonym starcie.
- Obsłużyć timeout startu i częściowo utworzone zasoby.
- Zapisać wszystkie wersje i identyfikatory potrzebne do audytu.
- Po zakończeniu odebrać Stage Deliverable, Project Version i Handoff Package.
- Umieścić rezultat w Project Space poza sandboxem agenta.
- Dopiero z tego rezultatu przygotować świeże środowisko następnego agenta.
- Obsłużyć pętlę testy/review → poprawki → ponowne testy.

### Rezultat

Przycisk uruchomienia flow tworzy SDLC Run, a każdy jego etap uruchamia odpowiednią wersję agenta w nowym sandboxie DSH.

### Kryterium wyjścia

Agent analityczny kończy etap, jego sandbox zostaje odłączony, a agent następnego etapu otrzymuje tylko Project Version i Handoff Package w nowym workspace, Harness home i session ID.

### Zależności

Kroki 10–15.

---

## Krok 17. Ingest i prezentacja trajectory

### Cel

Zapewnić użytkownikowi obserwację każdego agenta osobno oraz całego SDLC Run w czasie rzeczywistym i po zakończeniu.

### Prace

- Odbierać eksportowane zdarzenia DSH poza sandboxem.
- Nadawać im identyfikator SDLC Run, Stage Run, Agent Run, sekwencję i czas odbioru.
- Zachować oryginalny typ oraz znormalizowaną kategorię prezentacyjną.
- Zapisywać zdarzenia idempotentnie.
- Obsłużyć opóźnione, powtórzone i chwilowo nieuporządkowane dostarczenie.
- Rozróżnić dane do UI od pełnego artefaktu źródłowego.
- Redagować sekrety, nagłówki autoryzacji i potencjalnie wrażliwe wartości.
- Strumieniować nowe zdarzenia do przeglądarki.
- Umożliwić odtworzenie historii po odświeżeniu strony.
- Pokazać co najmniej: agenta, etap, plan, komunikaty, narzędzia, polecenia, wyniki, błędy i stan Agent Run.
- Dodać timeline całego SDLC Run grupujący kolejne trajectory agentów.
- Zachować odnośnik do źródłowego logu DSH.

### Rezultat

Ekran SDLC Run pokazujący stabilną timeline procesu i oddzielne trajectory każdego agenta.

### Kryterium wyjścia

Historia widoczna po zakończeniu jest logicznie zgodna z logiem DSH, a ponowne dostarczenie tych samych zdarzeń nie tworzy duplikatów.

### Zależności

Kroki 8, 15 i 16.

---

## Krok 18. Stop, cancel, awarie i resume

### Cel

Uczynić Agent Run zarządzalnym również wtedy, gdy model, proces lub host nie działa prawidłowo.

### Prace

- Rozróżnić stop z możliwością wznowienia od cancel i trwałego zakończenia.
- Zaimplementować łagodne anulowanie pracy DSH.
- Po przekroczeniu limitu zastosować wymuszone zatrzymanie.
- Zachować workspace i Harness home wyłącznie dla Agent Run przeznaczonego do resume.
- Wznowić ten sam Agent Run z tym samym `session_id` oraz zgodną wersją obrazu.
- Nigdy nie wykorzystywać resume jako sposobu przekazania pracy innemu agentowi.
- Zablokować resume, jeśli brakuje niezbędnego stanu lub wersja runtime'u jest niezgodna.
- Odzyskać stan po restarcie API, workera i Sandbox Controllera.
- Wykrywać osierocone kontenery oraz sesje bez procesu.
- Unieważniać poświadczenie LiteLLM po zakończeniu lub anulowaniu.
- Dodać politykę retencji zatrzymanych workspace'ów.
- Pokazać użytkownikowi przyczynę awarii i możliwe działania.

### Rezultat

Sesję można zatrzymać, wznowić, anulować i odzyskać po awarii bez utraty dotychczasowego śladu.

### Kryterium wyjścia

Test fault-injection zabija runner po edycji pliku, restartuje usługi i potwierdza kontynuację tego samego Agent Run bez zmieszania historii.

### Bramka fazy 4

Platforma potrafi już bezpiecznie uruchomić i obserwować agenta, ale nie ma jeszcze wiarygodnego, niezależnego Change Ledger. Nie należy na tym etapie nazywać produktu audytowalnym.

---

# Faza 5. Traceability zmian projektu

## Krok 19. Niezależny Workspace Tracker

### Cel

Rejestrować faktyczny stan plików w czasie każdego Agent Run oraz budować spójną historię wersji całego Project Space.

### Prace

- Zachować poza sandboxem wejściową Project Version i czysty punkt odniesienia każdego Agent Run.
- Utworzyć mechanizm obserwowania workspace'u niedostępny do modyfikacji przez agenta.
- Wykrywać pliki zmodyfikowane, nowe, usunięte i przeniesione.
- Uwzględnić pliki untracked, które nie pojawiają się w zwykłym `git diff`.
- Rozpoznawać pliki binarne i stosować limity rozmiaru.
- Respektować kontrolowaną politykę ignorowania build artifacts i sekretów.
- Tworzyć manifest ścieżek i hashy zawartości.
- Rejestrować File Change Events z czasem oraz powiązaniem do Agent Run i zdarzenia DSH.
- Utrwalać File Versions przy checkpointach i publikowaniu Project Version.
- Wykonywać skan po zdarzeniach narzędzi mogących modyfikować pliki.
- Dodać okresowy skan bezpieczeństwa jako fallback dla zmian wykonanych przez shell.
- Stosować debounce, aby nie zapisywać wersji po każdym znaku.
- Przechowywać patche i snapshoty poza sandboxem.
- Na końcu porównać wyeksportowany workspace z niezależnym czystym punktem odniesienia.
- Wykrywać rozbieżność między zmianami obserwowanymi w trakcie a stanem końcowym.
- Zbudować projekcję historii jednego pliku przez wszystkie etapy SDLC Run.
- Zbudować diff wejście–wyjście per Agent Run.
- Zbudować diff per Stage Run.
- Zbudować Global Project Diff od bazowej do aktualnej Project Version.
- Zachować historię zmiany później zastąpionej przez kolejnego agenta.

### Rezultat

Pełna, odporna na manipulację historia zmian per agent, etap, plik i cały projekt.

### Kryterium wyjścia

Test z dwoma następującymi po sobie agentami pokazuje poprawne wersje pliku, diff każdego agenta i globalny diff, również gdy drugi agent nadpisze fragment pracy pierwszego.

### Zależności

Kroki 14–18.

---

## Krok 20. Change Sets, uzasadnienia i checkpointy

### Cel

Zamienić techniczną listę zapisów plików w historię zrozumiałą dla człowieka.

### Prace

- Zaimplementować Change Set jako logiczną grupę zmian realizujących jeden zamiar.
- Przypisać każdy Change Set do dokładnie jednego Agent Run.
- Pozwolić agentowi rozpocząć albo zgłosić logiczny etap pracy.
- Wymagać jawnego opisu: intencja, powód, kryterium, weryfikacja i ryzyko.
- Nie traktować surowego reasoning jako uzasadnienia audytowego.
- Powiązać Change Set ze zdarzeniami trajectory.
- Powiązać Change Set z diffem i konkretnymi wersjami plików.
- Pokazać, czy dana zmiana pozostaje w aktualnej Project Version, została zmodyfikowana czy zastąpiona w późniejszym etapie.
- Pozwolić oznaczyć zmianę jako częściową albo wycofaną.
- Utworzyć checkpoint przed sesją, po logicznym etapie, po testach i na końcu.
- Dodać ręczne utworzenie checkpointu przez użytkownika.
- Zapewnić odtwarzalność checkpointu niezależnie od `.git` w sandboxie.
- Pokazać różnicę pomiędzy checkpointami.
- Nie tworzyć osobnego Change Setu dla każdego zapisu pliku.

### Rezultat

Czytelna historia „co i dlaczego” połączona z technicznym „jak”.

### Kryterium wyjścia

Osoba, która nie oglądała procesu na żywo, potrafi przejść od kryterium do etapu, agenta, uzasadnienia, diffu, trajectory i wyniku weryfikacji.

### Zależności

Kroki 17 i 19.

---

## Krok 21. Stage Deliverables, Project Deliverable i Handoff

### Cel

Przygotować kontrolowane rezultaty poszczególnych etapów oraz kompletny rezultat całego SDLC Run.

### Prace

- Zaimplementować Stage Deliverable jako rezultat jednego Stage Run.
- Zaimplementować Handoff Package przekazujący wersję projektu, artefakty, decyzje, ryzyka i otwarte pytania.
- Zaimplementować Project Deliverable jako rezultat całego SDLC Run.
- Dołączyć diff agenta i etapu do Stage Deliverable.
- Dołączyć Global Project Diff do Project Deliverable.
- Dołączyć listę Change Sets.
- Dołączyć mapowanie kryteriów akceptacji na dowody.
- Dołączyć wykonane testy, kompilację, lint i inne kontrole.
- Rozróżnić dowód zaobserwowany przez platformę od deklaracji agenta.
- Dołączyć znane ryzyka, ograniczenia i pominięte testy.
- Zweryfikować końcowy stan workspace'u niezależnym skanem.
- Oznaczyć rezultat jako niespójny, jeśli końcowy stan nie zgadza się z zarejestrowaną historią.
- Uniemożliwić modyfikację gotowego Stage Deliverable; poprawki tworzą kolejną rewizję i nowy Agent Run albo kontrolowane resume tego samego agenta.
- Zachować łańcuch Project Versions oraz Handoff Packages całego SDLC Run.
- Zachować źródłowe artefakty nawet po usunięciu sandboxa.

### Rezultat

Samowystarczalne rezultaty etapów i końcowy pakiet odpowiadający: który agent, w jakim etapie, co zmienił, dlaczego, jak przekazał pracę i jak rezultat został zweryfikowany.

### Kryterium wyjścia

Project Deliverable i wszystkie Stage Deliverables pozostają czytelne po usunięciu wszystkich sandboxów.

### Bramka fazy 5

Platforma posiada faktyczne traceability. DSH trajectory, stan projektu i uzasadnienia są skorelowane, ale żaden z tych elementów nie udaje pozostałych.

---

# Faza 6. Pełny produkt i wydanie MVP

## Krok 22. Pełny przepływ Web GUI

### Cel

Połączyć wcześniej wdrożone możliwości w jeden czytelny proces użytkownika.

### Prace

- Dokończyć ekran Projects z informacją o repozytorium.
- Dodać Project Space z wersjami projektu, artefaktami i historią SDLC Runs.
- Dokończyć Global Agent Catalog z rolą, wiedzą i historią wersji.
- Dodać widok Project Agent Versions, pochodzenia i promocji do globalnej puli.
- Dokończyć ekran Knowledge z paczkami, wersjami i podglądem manifestu.
- Dokończyć ekran Work Items z kryteriami i wyborem SDLC Flow.
- Dodać edycję sekwencji etapów oraz przypisanie wersji agentów.
- Dokończyć ekran SDLC Run z pipeline'em etapów i kontrolami procesu.
- Dodać osobny widok Agent Run z trajectory konkretnego agenta.
- Dodać widok Changed Files z filtrami i statystyką zmian.
- Dodać przełączniki diffu: per agent, per etap i globalnie.
- Dodać historię wersji wybranego pliku z informacją, który agent dokonał zmiany.
- Dodać timeline Change Sets z uzasadnieniami.
- Dodać widok checkpointów i porównanie wybranych stanów.
- Dodać widok Handoff Package oraz Stage Deliverable.
- Dodać ekran Project Deliverable mapujący kryteria na dowody całego flow.
- Dodać czytelne stany błędu, zatrzymania, resume i utraty połączenia.
- W każdym widoku pokazywać wersję agenta, wiedzy, modelu, DSH i obrazu sandboxa.
- Zapewnić, że destrukcyjne operacje wymagają potwierdzenia i pokazują dokładny cel.

### Rezultat

Użytkownik przechodzi pełny scenariusz MVP bez terminala i ręcznego odczytywania logów.

### Kryterium wyjścia

Test użyteczności przeprowadzony według scenariusza z kroku 1 kończy się odnalezieniem każdej wymaganej informacji bez dostępu do bazy lub filesystemu hosta.

### Zależności

Kroki 10–21.

---

## Krok 23. Human Review, poprawki i kontrolowana integracja

### Cel

Zamknąć pętlę zarządzania pracą decyzją człowieka.

### Prace

- Zaimplementować Review jako opcjonalną bramkę po Stage Deliverable i obowiązkową bramkę dla końcowego Project Deliverable.
- Pozwolić użytkownikowi komentować całość, Change Set i konkretny fragment diffu.
- Dodać decyzje: Approve, Request Changes i Reject.
- Wymagać uzasadnienia dla odrzucenia i żądania poprawek.
- Po Request Changes skierować SDLC Run do wskazanego wcześniejszego etapu, tworząc nowy Stage Run; ten sam agent może wykonać nowy Agent Run albo wznowić własny, jeśli review dotyczy niedokończonej pracy.
- Przekazać uwagi review jako nowy, jawny kontekst agenta.
- Zachować poprzednią rewizję Deliverable.
- Uniemożliwić agentowi utworzenie decyzji Approve.
- Rozdzielić Approved od Integrated.
- W MVP preferować eksport patcha lub kontrolowany commit zamiast automatycznego push.
- Jeżeli włączony jest push, użyć osobnego, krótkotrwałego uprawnienia i zabronić bezpośredniej zmiany gałęzi głównej.
- Zapisać osobę, czas i podstawę każdej decyzji.

### Rezultat

Kompletna pętla wielu agentów: etap → handoff → następny etap → review → powrót do właściwego etapu → ponowna weryfikacja → decyzja.

### Kryterium wyjścia

Demonstracja zawiera błąd znaleziony przez Test Agent, powrót do Developer Agenta w nowym sandboxie oraz kolejną wersję projektu bez utraty wcześniejszych trajectory, handoffów i review.

### Zależności

Kroki 18, 21 i 22.

---

## Krok 24. Utwardzenie, test odbiorczy i wydanie self-hosted

### Cel

Przekształcić działający prototyp w powtarzalne MVP możliwe do uruchomienia przez użytkownika.

### Prace

#### Testy funkcjonalne

- Przeprowadzić pełny happy path.
- Przeprowadzić bazowy SDLC: analiza, architektura, implementacja, testy i review.
- Potwierdzić nowy sandbox oraz Harness home dla każdego kolejnego agenta.
- Przeprowadzić etap testów zakończony wykryciem błędu.
- Przeprowadzić powrót do implementacji i ponowne testy.
- Przeprowadzić Request Changes i resume tego samego Agent Run.
- Przeprowadzić anulowanie zadania.
- Przeprowadzić odrzucenie Stage Deliverable i Project Deliverable.
- Sprawdzić restart każdej usługi podczas aktywnej sesji.

#### Testy traceability

- Zweryfikować kompletność początkowego SHA.
- Zweryfikować manifest wersji agenta i wiedzy.
- Zweryfikować pochodzenie globalnej i projektowej wersji agenta.
- Zweryfikować Project Versions oraz Handoff Packages pomiędzy etapami.
- Porównać końcowy diff z niezależnym checkoutem.
- Porównać diff per agent, per etap i globalnie.
- Sprawdzić historię jednego pliku zmienianego przez dwóch agentów.
- Sprawdzić pliki nowe, usunięte, przemianowane, binarne i untracked.
- Sprawdzić korelację Change Set → trajectory → diff → evidence → review.
- Sprawdzić czytelność historii po usunięciu sandboxa.

#### Testy bezpieczeństwa

- Spróbować odczytać pliki hosta.
- Spróbować odczytać workspace poprzedniego lub równoległego Agent Run.
- Spróbować połączyć się poza dozwolony egress.
- Spróbować odczytać główny klucz MiniMax.
- Spróbować uzyskać dostęp do Docker socketu.
- Uruchomić proces przekraczający limity CPU, RAM, liczby procesów i czasu.
- Sprawdzić redakcję sekretów w logach, trajectory, błędach i artefaktach.
- Sprawdzić usuwanie oraz wygasanie krótkotrwałych credentials.

#### Instalacja i operacje

- Przygotować wersjonowany Docker Compose.
- Przypiąć obrazy i zależności.
- Dodać migracje oraz procedurę pierwszego uruchomienia.
- Dodać konfigurację LiteLLM bez sekretów w repozytorium.
- Przygotować procedurę backupu stanu domenowego i artefaktów.
- Przygotować procedurę restore.
- Przygotować runbook dla osieroconych sandboxów oraz zawieszonych Agent Runs i SDLC Runs.
- Ustalić limity i retencję domyślną.
- Utworzyć release notes z dokładną wersją DSH i znanymi ograniczeniami.

### Rezultat

Wersjonowane wydanie MVP wraz z instalacją, dokumentacją operacyjną, testem odbiorczym i listą znanych ograniczeń.

### Kryterium wyjścia

Na czystym hoście można uruchomić produkt przez domyślny Web, wykonać wieloetapowy SDLC, przejść powrót z testów do implementacji i zaakceptować końcowy Project Deliverable. To samo SDK obsługuje alternatywny terminal, a historia pozostaje dostępna po usunięciu wszystkich sandboxów.

---

## 4. Bramy decyzyjne

### Gate A — wykonalność runtime'u

**Po kroku 5.** Kontynuacja wymaga potwierdzenia:

- stabilnego uruchomienia DSH Python SDK,
- zgodności MiniMax przez LiteLLM,
- odbioru potrzebnych zdarzeń,
- wznowienia Agent Run z jawnego stanu.

Brak któregokolwiek elementu oznacza powrót do decyzji o runtime, a nie obejście w GUI.

### Gate B — spójność domeny

**Po kroku 13.** Przed uruchamianiem agentów należy potwierdzić:

- niezmienność wersji agenta i wiedzy,
- niezależność Global Agent Catalog od Project Space,
- pochodzenie i promocję Project Agent Version,
- poprawne stany SDLC Run i Stage Run,
- Handoff Package oraz łańcuch Project Versions,
- zamrożenie konfiguracji wykonania,
- niezależność domeny od DSH.

### Gate C — kontrolowane wykonanie

**Po kroku 18.** Przed nazywaniem systemu bezpiecznym należy potwierdzić:

- izolację każdego Agent Run,
- brak dostępu następnego agenta do sandboxa poprzednika,
- przekazywanie pracy wyłącznie przez Project Space,
- brak Docker socketu w kontenerze,
- ograniczone credentials,
- stop, cancel, recovery i resume,
- trwałość zdarzeń poza procesem DSH.

### Gate D — traceability

**Po kroku 21.** Przed rozpoczęciem review należy potwierdzić:

- kompletny diff per agent, etap i cały projekt,
- historię wersji pliku przez kolejne etapy,
- wykrywanie zmian poza edytorem DSH,
- niezależność od `.git` kontrolowanego przez agenta,
- powiązanie zmian z intencją i dowodem,
- dostępność audytu po usunięciu sandboxa.

### Gate E — MVP

**Po kroku 24.** Produkt jest MVP tylko wtedy, gdy niezależna osoba potrafi go wdrożyć i przejść pełny przepływ bez ręcznego poprawiania stanu.

---

## 5. Co można realizować równolegle

Plan pokazuje zależności logiczne, ale nie wszystkie zadania muszą być wykonywane sekwencyjnie.

Po zakończeniu fazy 1 można równolegle prowadzić:

- repozytorium i CI,
- szkielet Web GUI,
- pierwszą wersję Sandbox Controllera,
- model domenowy agentów i wiedzy.
- model SDLC Flow, Project Space i promocji agentów.

Po zakończeniu kroku 16 można równolegle prowadzić:

- ekran SDLC Run i Agent Run,
- ingest trajectory,
- Workspace Tracker,
- testy awarii i resume.

Nie powinny być realizowane równolegle bez wspólnego punktu integracji:

- format Change Set i narzędzie raportowania uzasadnień,
- Stage Deliverables, Project Deliverable i ekran Review,
- mechanizm resume i polityka retencji workspace'u,
- model stanów SDLC Run, Stage Run i przyciski zmieniające te stany.

---

## 6. Strategia testów

### 6.1. Testy jednostkowe

Obejmują przede wszystkim:

- przejścia stanów,
- niezmienność wersji,
- pochodzenie i promocję wersji agentów,
- kolejność etapów SDLC i reguły powrotu,
- przekazanie Project Version pomiędzy etapami,
- budowę Knowledge Manifest,
- reguły review,
- korelację zdarzeń,
- decyzje dotyczące retencji.

### 6.2. Testy kontraktowe komponentów technicznych

Mają wcześnie wykrywać zmiany łamiące kompatybilność:

- przypiętej wersji DSH Python SDK,
- pluginów Cordis,
- formatu zdarzeń,
- LiteLLM,
- MiniMax,
- Sandbox Controllera.

### 6.3. Testy integracyjne

Powinny uruchamiać rzeczywiste komponenty:

- PostgreSQL,
- LiteLLM z testowym providerem lub kontrolowaną odpowiedzią,
- Sandbox Controller,
- obraz DSH Runner,
- storage artefaktów.

### 6.4. Testy end-to-end

Minimalny zestaw scenariuszy:

1. Pełna sekwencja analiza → architektura → implementacja → testy → review.
2. Każdy agent otrzymuje świeży sandbox i wejściową Project Version.
3. Test Agent wykrywa błąd i kieruje flow ponownie do implementacji.
4. Developer Agent poprawia kod w nowym sandboxie, a Test Agent ponownie go sprawdza.
5. Przerwanie oraz resume tego samego Agent Run.
6. Agent modyfikuje `.git`, ale jego diff i Global Project Diff nadal są poprawne.
7. Dwóch agentów zmienia ten sam plik, a historia zachowuje obie wersje i atrybucję.
8. Agent tworzy plik untracked i usuwa istniejący plik.
9. Agent próbuje odczytać sandbox poprzednika albo zasób poza workspace'em.
10. LiteLLM lub MiniMax chwilowo nie odpowiada.
11. Worker restartuje się podczas aktywnego etapu.
12. Wszystkie sandboxy zostają usunięte, ale trajectory, handoffy, wersje i review pozostają kompletne.
13. Projektowa wersja agenta jest promowana jako nowa wersja globalna bez zmiany innych projektów.

---

## 7. Rejestr najważniejszych ryzyk

| Ryzyko | Skutek | Wczesna walidacja | Zabezpieczenie |
|---|---|---|---|
| DSH developer preview | breaking changes | kroki 3 i 5 | przypięta wersja, testy kontraktowe, własna granica runtime |
| Niepełna zgodność MiniMax | niestabilny agent | krok 4 | profil kompatybilności i zadania testowe |
| Utrata zdarzeń | niepełna historia | kroki 5 i 17 | idempotentny ingest i źródłowe logi JSONL |
| Docker jako słaba izolacja | dostęp do hosta | kroki 2, 14 i 24 | rootless, limity, brak mountów, docelowo gVisor/microVM |
| Agent manipuluje Git | fałszywy diff | krok 19 | zewnętrzny baseline i końcowa rekonsyliacja |
| Pliki untracked są pomijane | niekompletny rezultat | krok 19 | skan całego workspace'u |
| Reasoning udaje uzasadnienie | nieczytelny audyt | krok 20 | jawny Change Rationale |
| Wiedza rośnie bez kontroli | koszt i konflikty | krok 12 | wersje, manifest i limity |
| Wiedza projektowa wycieka przy promocji | ujawnienie danych projektu | kroki 11–12 | review, redakcja i nowa wersja globalna |
| Kolejny agent dziedziczy ukryty stan | nieodtwarzalne wyniki | kroki 14 i 16 | nowy sandbox i formalny Handoff Package |
| Późniejszy agent nadpisuje zmianę | błędna atrybucja | kroki 19–20 | historia File Versions i diff per Agent Run |
| Resume używa innego runtime'u | niespójna sesja | krok 18 | przypięty obraz i kontrola zgodności |
| Sekrety trafiają do logów | wyciek credentials | kroki 9, 17 i 24 | redakcja, scoped token, testy bezpieczeństwa |
| Rozrost zakresu | brak działającego MVP | krok 1 i bramy | zamrożona lista poza MVP |

---

## 8. Kolejność pierwszych prac w praktyce

Pierwsze prace powinny wyglądać następująco:

1. Wybrać małe repozytorium i Work Item demonstracyjny.
2. Przypiąć DSH oraz uruchomić przykład Python SDK z osobnym workspace'em i Harness home.
3. Postawić LiteLLM i skierować DSH do MiniMax.
4. Wykonać dwa następujące po sobie Agent Runs: implementację i niezależne testy.
5. Przechwycić zdarzenia Agent Run.
6. Wyeksportować Project Version i uruchomić drugiego agenta w świeżym środowisku.
7. Zabić proces i udowodnić resume tego samego Agent Run.
8. Dopiero wtedy utworzyć monorepo produktu i przenieść PoC do obrazu runnera.

Pierwszym ważnym artefaktem nie powinien być ekran logowania ani makieta dashboardu. Powinien nim być **odtwarzalny handoff pomiędzy dwoma Agent Runs: każdy z własnym DSH, trajectory i sandboxem, połączone wyłącznie Project Version i Handoff Package**.

---

## 9. Ostateczna definicja ukończenia MVP

MVP jest ukończone, gdy spełnione są jednocześnie wszystkie warunki:

- instalacja działa na czystym hoście według jednej procedury,
- użytkownik może wybierać agentów z globalnego katalogu,
- użytkownik może tworzyć projektowe wersje agentów i zgłaszać je do promocji,
- użytkownik może utworzyć Work Item i sekwencyjny SDLC Flow,
- każdy Stage Run jest przypisany do konkretnej wersji agenta,
- każdy Agent Run działa przez DSH i MiniMax w osobnym sandboxie,
- sandbox, workspace i Harness home nie są współdzielone pomiędzy agentami,
- kolejne etapy przekazują wyłącznie Project Version, artefakty i Handoff Package,
- trajectory każdego agenta jest widoczne osobno i w timeline całego SDLC Run,
- historia obejmuje zmiany per agent, etap, plik i cały projekt, również pliki untracked, usunięcia i rename,
- logiczne zmiany posiadają jawne uzasadnienia,
- Stage Deliverables i Project Deliverable zawierają diffy, dowody, ryzyka i użyte wersje konfiguracji,
- człowiek albo etap testów może skierować flow do wcześniejszego etapu,
- agent nie może zatwierdzić własnego rezultatu,
- historia pozostaje dostępna po usunięciu środowiska wykonawczego,
- awaria procesu nie powoduje cichej utraty ani podwójnego wykonania,
- główny klucz MiniMax nie trafia do sandboxa,
- znane ograniczenia bezpieczeństwa i runtime'u są jawnie udokumentowane.

Jeżeli brakuje niezależnego śledzenia zmian, oddzielnych sandboxów kolejnych agentów, formalnego handoffu, review albo recovery, system jest demonstratorem harnessu, a nie MVP HarnessPlatform.
