# Helmflow — plan MVP

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

24 kroki w 7 fazach, uzupełnione kamieniem milowym **MVP-0** (po fazie 1) i krokiem **21a** (katalog i promocje, przeniesione z fazy 3 — [D7.3](decyzje.md)). Kolejność faz jest wiążąca; bramki decyzyjne (rozdział „Bramy") są twarde.

**Mechanizm stop-loss:** przed rozpoczęciem każdej fazy agent implementujący zapisuje szacunek jej czasu i budżetu tokenów; przekroczenie dwukrotności szacunku zatrzymuje fazę i eskaluje do właściciela. Dogfooding od MVP-0 obowiązuje, chyba że właściciel jawnie zwolni z niego dany krok.

Zasady dekompozycji: ryzyko przed rozbudową; zależności przed równoległością; jedno główne zobowiązanie na krok; mierzalna bramka wyjścia; oddzielenie źródeł prawdy; pionowe przyrosty.

## Scenariusz odbioru MVP

MVP musi obsłużyć poniższy scenariusz bez ręcznej ingerencji w stan serwera, w TUI i headless przez kontrakt silnika ([D9.3](decyzje.md)):

1. Użytkownik posiada globalny katalog agentów niezależny od projektów.
2. Dodaje Project Space i repozytorium.
3. Wybiera globalne wersje agentów albo tworzy ich wersje projektowe.
4. Przypisuje agentom wersjonowaną wiedzę globalną i projektową.
5. Tworzy Work Item wraz z kryteriami akceptacji.
6. Wybiera flow: szablon wytwarzania albo szablon zrozumienia ([D8.1](decyzje.md)).
7. Przypisuje konkretną wersję agenta do każdego etapu.
8. Uruchamia SDLC Run ze znanej bazowej Project Version.
9. Dla każdego Stage Run powstaje osobny sandbox, workspace i Harness home.
10. DSH działa z MiniMax przez LiteLLM i zapisuje trajectory tego agenta.
11. Agent przekazuje do Project Space artefakty, nową Project Version i Handoff Package.
12. Następny agent rozpoczyna pracę w świeżym sandboxie od kontrolowanego wyjścia poprzednika.
13. Użytkownik obserwuje cały SDLC Run oraz trajectory każdego agenta osobno.
14. Użytkownik ogląda historię pliku i diff per agent, etap albo globalnie.
15. Etap testów lub review może skierować pracę ponownie do implementacji (w granicach limitu powrotów).
16. Końcowy Project Deliverable zawiera zmiany, dowody, handoffy i ryzyka wszystkich etapów.
17. Użytkownik akceptuje rezultat albo żąda dalszych poprawek.
18. Projektowa wersja agenta może zostać zgłoszona do kontrolowanej promocji.
19. Usunięcie sandboxów nie usuwa historii audytowej ani wersji projektu.

---

## Faza 0 — definicja i granice

### Krok 1. Definition of Done produktu

**Cel:** zamienić wizję w jeden mierzalny scenariusz odbioru.

Prace:
- Spisać głównego użytkownika: właściciel projektu w roli Engineering Managera / Tech Leada.
- Wybrać repozytorium demonstracyjne i przygotować Work Item demonstracyjny (szkic w rozdziale „Pierwsze prace").
- Zdefiniować kryteria akceptacji zadania demonstracyjnego.
- Ustalić, jakie informacje muszą być widoczne podczas sesji i w końcowym Deliverable.
- Rozróżnić „agent zakończył pracę", „człowiek zaakceptował" i „zmiana została zintegrowana".
- Zamrozić listę funkcji poza MVP (rozdział „Poza MVP").

**Bramka:** cały proces da się przejść „na papierze" ze wskazaniem widocznego rezultatu każdego etapu.

### Krok 2. ADR-y i minimalny threat model

**Cel:** zapisać decyzje, których późniejsza zmiana byłaby kosztowna.

Prace:
- Przenieść decyzje [D1–D9](decyzje.md) do `docs/adr/` jako ADR-y 0001–0009 (do czasu utworzenia monorepo w kroku 6 ADR-y żyją w katalogu projektu i wchodzą do repo pierwszym commitem).
- Opisać chronione zasoby: kod, klucz modelu, repozytoria, host, logi, decyzje review.
- Opisać zagrożenia: odczyt hosta, wyciek sekretu, niekontrolowany egress, manipulacja `.git`, zapełnienie dysku, fork bomb, utrata logów, podszycie się pod zdarzenie, **łańcuch dostaw pakietów z rejestrów** ([D7.4](decyzje.md)).
- Ustalić jawne ograniczenia bezpieczeństwa kontenerowego MVP ([D5.6](decyzje.md)).

**Bramka:** każda uprzywilejowana operacja ma wskazanego właściciela; żaden komponent poza Sandbox Controllerem nie wymaga socketu kontenerowego.

---

## Faza 1 — redukcja ryzyka technicznego

### Krok 3. Minimalne uruchomienie DSH Python SDK

**Cel:** potwierdzić, że przypięta wersja SDK wykona zadanie w kontrolowanym katalogu i zapisze sesję.

Prace:
- Wybrać i przypiąć konkretną wersję pakietu oraz runtime'u DSH.
- Utworzyć minimalny program uruchamiający DSH z jawnymi ścieżkami `cwd`, `dsh_home` i jawnym `session_id`.
- Uruchomić na jednorazowej kopii małego repozytorium; potwierdzić log JSONL w osobnym Harness home.
- Sprawdzić zachowanie dla sukcesu, błędu narzędzia i przerwania procesu.
- Zapisać dokładną wersję runtime'u i sposób reprodukcji.

Uwaga: według dokumentacji DSH minimalny profil SDK (`sdk-minimal`) pracuje lokalnym shellem bez ograniczeń uprawnień (`danger-full-access`) — dlatego wyłącznie jednorazowe kopie repozytoriów, docelowo praca w kontenerze.

**Bramka:** dwa uruchomienia z różnymi `session_id` i Harness home nie mieszają konfiguracji ani logów.

### Krok 4. Walidacja LiteLLM i MiniMax

**Cel:** udowodnić rzeczywistą, nie deklarowaną kompatybilność MiniMax z DSH przez LiteLLM.

Prace:
- Uruchomić LiteLLM lokalnie; skonfigurować alias modelu i DSH jako klienta endpointu zgodnego z OpenAI.
- Sprawdzić: odpowiedź tekstową; tool calling z wieloma kolejnymi wywołaniami; system prompt i role wiadomości; limit odpowiedzi i długi kontekst; retry, timeout, anulowanie, błąd dostawcy; streaming i usage.
- Ustalić wymagane ustawienia kompatybilności (role, pola limitów tokenów, format reasoning).
- Zmierzyć jakość na co najmniej dwóch małych zadaniach programistycznych, nie na pytaniu tekstowym.
- Potwierdzić, że główny klucz MiniMax znajduje się wyłącznie w LiteLLM.

**Bramka:** agent kończy zadanie odczyt→edycja→test→podsumowanie bez klucza MiniMax w środowisku DSH. Tego kroku nie wolno zastąpić sprawdzeniem samego `GET /models`.

### Krok 5. Zdarzenia, trwałość, resume + spike handoffu

**Cel:** potwierdzić obserwowalność i wznawialność wykonania oraz najbardziej ryzykowną nowość modelu — handoff między dwoma Agent Runs.

Prace:
- Zidentyfikować zdarzenia dostępne z Python SDK; ustalić, które wymagają pluginu Cordis eksportującego je na zewnątrz.
- Przechwycić co najmniej: rozpoczęcie, odpowiedź modelu, wywołanie i rezultat narzędzia, zmianę planu, zakończenie, błąd.
- Sprawdzić kolejność, identyfikatory i zachowanie zdarzeń przy retry; możliwość dostarczenia więcej niż raz; zdefiniować idempotentny zapis po stronie platformy.
- Przerwać proces po zmianie pliku i wznowić z tym samym workspace, Harness home i `session_id`; potwierdzić jedną logiczną historię.
- Sprawdzić zachowanie przy uszkodzeniu lub braku elementu stanu.
- **Spike handoffu:** dwa kolejne Agent Runs (implementacja → niezależne testy) połączone wyłącznie Project Version i Handoffem.

**Bramka:** po przerwaniu agent kontynuuje tę samą sesję z pełną historią; drugi agent wykonuje pracę na wyjściu pierwszego bez dostępu do jego środowiska.

**Gate A** po kroku 5 — patrz rozdział „Bramy".

### Kamień milowy MVP-0 — minimalna pętla produktu i początek dogfoodingu ([D7.2](decyzje.md))

MVP-0 powstaje najwcześniej, jak pozwala fundament — na minimalnych wersjach kroków 6–8 — i celowo wyprzedza pełny rdzeń domenowy. Zawartość (minimum; rozszerzanie dopiero po osiągnięciu bramki):

- predefiniowane flow o długości 1–3 etapów, wybierane z zamkniętej listy (agent pojedynczy; implementacja → testy; analiza → implementacja → testy), bez edytora Flow Definition — decyzja właściciela 2026-09-05,
- Work Item i wersja agenta jako proste rekordy (bez katalogu globalnego, bez promocji, bez Knowledge Packs — instrukcje agenta inline),
- sandbox per Agent Run (dopuszczalna uproszczona mechanika z PoC fazy 1),
- przekazanie Project Version + minimalny Handoff między etapami,
- widok Run (trajectory na żywo) i widok Review (diff + Approve / Request Changes / Reject) w TUI ([D9.3](decyzje.md)),
- bez Web i bez pozostałych widoków.

**Bramka wyjścia:** jeden realny Work Item z rozwoju Helmflow przechodzi pętlę end-to-end (implementacja → testy → review → akceptacja), a na MVP-0 zmierzono **Gate A′**.

**Zasada dogfoodingu:** od osiągnięcia MVP-0 rozwój Helmflow jest prowadzony przez Helmflow — kolejne kroki planu realizuje się w miarę możliwości jako Work Items w produkcie.

---

## Faza 2 — fundament

### Krok 6. Monorepo i standardy pracy

Prace:
- Utworzyć strukturę monorepo z granicami produktów i **konwencją matrioszki** ([technologia](technologia.md), [D9.4](decyzje.md)).
- Skonfigurować zarządzanie zależnościami (uv workspace) i przypinanie wersji, w tym DSH i obrazów.
- Dodać formatowanie, linting, kontrolę typów, testy jednostkowe; skanowanie sekretów i podatności zależności; weryfikację zgodności licencji zależności z AGPL-3.0.
- Ustalić konwencje logowania i identyfikatorów korelacyjnych.
- Utworzyć CI wykonujące testy bez produkcyjnych kluczy, budujące matrioszkę od SDK w górę.
- Dodać katalogi `docs/adr/` i `docs/runbooks/`; zatwierdzić ADR modeli danych ([model-danych](model-danych.md)).

**Bramka:** czysty checkout przechodzi CI i uruchamia szkielet lokalnie; zbudowanie każdego produktu jednym poleceniem buduje rekurencyjnie jego warstwy niższe.

### Krok 7. SDK, silnik, worker, trwały stan

Prace:
- Warstwy według [D3](decyzje.md): SDK = model danych + kontrakty ([model-danych](model-danych.md), [sdk](sdk.md)); silnik = SDK + implementacje.
- **Testy kontraktowe SDK pisane razem z kontraktami — wspólny test kit weryfikuje każdą implementację ([D9.2](decyzje.md)).**
- Kontrakt silnika z operacjami async, streamingiem zdarzeń, cancel i resume ([engine](engine.md)).
- Cienki host API (backend = silnik + API) z uwierzytelnieniem pojedynczego użytkownika ([D6.3](decyzje.md)); osobny proces worker.
- PostgreSQL + migracje; trwała kolejka pracy bez polegania na pamięci procesu; idempotencja operacji uruchomienia, zatrzymania i wznowienia; wykrywanie pracy porzuconej po restarcie.
- Abstrakcja storage artefaktów; rozróżnienie metadanych domenowych od dużych artefaktów; zegar i generowanie identyfikatorów jako kontrolowane zależności testowe.

**Bramka:** test integracyjny tworzy zlecenie, zatrzymuje worker przed wykonaniem, uruchamia ponownie i potwierdza wykonanie bez duplikatu; każda implementacja kontraktu SDK przechodzi test kit tego kontraktu.

### Krok 8. CLI/TUI i komunikacja na żywo

Prace:
- Tryb komendowy CLI i szkielet TUI (Textual) na kontrakcie silnika — nawigacja: Global Agents, Projects, Knowledge, Work Items, SDLC Runs, Reviews ([cli](cli.md)).
- Strumień zdarzeń z reconnect i wznowieniem od ostatniego znanego kursora; rozróżnienie stanu bieżącego od strumienia historii.
- Wspólna obsługa błędów i stanów ładowania; ekran diagnostyczny ze sztucznym strumieniem zdarzeń.
- Cienki host API jako fundament pod przyszły Web ([D9.3](decyzje.md)) — bez budowy frontendu.

**Bramka:** po zerwaniu i odtworzeniu połączenia TUI nie gubi ani nie duplikuje zdarzeń.

### Krok 9. Obserwowalność platformy

Prace:
- Strukturalne logi z identyfikatorami Project Space, Work Item, SDLC Run, Stage Run, Agent Run i sandboxa.
- Metryki: czasy oczekiwania i startu sandboxa, długości sesji, liczby aktywnych/zakończonych/osieroconych sesji.
- Rozdzielenie klas błędów: platforma / sandbox / DSH / model gateway / zadanie użytkownika; healthchecki usług.
- Redakcja sekretów i wrażliwego payloadu; polityka retencji logów technicznych; podstawowe polecenia diagnostyczne.

**Bramka:** celowo wywołane błędy bazy, sandboxa i LiteLLM są rozróżnialne bez przeglądania surowego logu DSH.

---

## Faza 3 — rdzeń domenowy

### Krok 10. Project Space, repozytorium, Project Versions

Prace:
- Zaimplementować Project i Project Space jako granicę wiedzy, procesów, artefaktów i audytu.
- Rejestracja jednego repozytorium dla projektu; weryfikacja dostępu bez uruchamiania agenta; utrwalenie kanonicznego adresu, gałęzi i bazowej rewizji.
- Pobieranie kodu przez kontrolowany komponent; rozdział poświadczeń repozytorium od poświadczeń modelu; preferencja odczytu i eksportu patcha zamiast uprawnień push.
- Niezmienne Project Versions: wewnętrzne bare git + manifest ([D4](decyzje.md)); zapis bazowej wersji dla każdego SDLC Run; artefakty etapów obok kodu, poza sandboxami.
- Obsłużyć niedostępne repozytorium, nieistniejącą rewizję i zmienioną gałąź.

**Bramka:** dwukrotne przygotowanie tej samej Project Version daje identyczny stan; zmiana w pierwszej kopii nie pojawia się w drugiej.

### Krok 11. Wersje agentów — minimum domenowe

Prace:
- Role, Agent Definition, niezmienne wersje agentów jako rekordy; zamrożenie wersji użytej przez rozpoczęty Agent Run; nowa wersja na podstawie poprzedniej; diff wersji w interfejsie (TUI).
- Kompilator domenowej wersji agenta do manifestu uruchomienia; bez struktur DSH w rdzeniu domenowym.
- Global Agent Catalog, fork projektowy z pochodzeniem i promocje **przeniesione do kroku 21a** ([D7.3](decyzje.md)).

**Bramka:** zmiana instrukcji tworzy nową wersję, a historyczny Agent Run nadal wskazuje niezmienioną konfigurację.

### Krok 12. Wiedza

Prace:
- Knowledge Packs w zakresach z [modelu domeny](model-domeny.md); niezmienne Knowledge Versions; przypisanie do projektu, roli lub konkretnego agenta.
- Knowledge Manifest per Agent Run: deterministyczna kolejność składania, limity rozmiaru, ostrzeżenia o konfliktach, pochodzenie każdego fragmentu, podgląd dokładnej treści przed startem.
- Knowledge Promotion Candidate **przeniesiony do kroku 21a** ([D7.3](decyzje.md)).
- Bez semantycznego wyszukiwania, dopóki statyczne paczki nie okażą się niewystarczające.

**Bramka:** ten sam zestaw wersji daje ten sam uporządkowany kontekst niezależnie od nowszych paczek.

### Krok 13. Work Items, flow, etapy, przydziały

Prace:
- Work Item z celem, zakresem i ograniczeniami; Acceptance Criteria jako jawne warunki odbioru.
- Flow Definition z szablonami wytwarzania i zrozumienia ([D8.1](decyzje.md)), bramkami człowieka i **limitami pętli ([D6.1](decyzje.md))**; flow o długości 1+ ([D6.7](decyzje.md)).
- SDLC Run / Stage / Stage Run; Agent Assignment wiążący Stage Run z konkretną wersją agenta; zamrożenie wersji agenta i manifestu wiedzy per Agent Run.
- Stany całego flow i osobne stany Stage Run; dozwolone przejścia z przyczyną; stan **Blocked** ([D6.2](decyzje.md)); powrót testy/review → implementacja; rozdzielenie zakończenia agenta, etapu i całego runa; zakaz samodzielnego Approve przez agenta; historia zmian stanu; ponowne przydzielenie bez usuwania historii (niezmiennik 30).

**Bramka:** testy domenowe odrzucają pominięcie bramki i potwierdzają powrót Review → Implementation → Tests bez utraty historii; niezmiennik jednego aktywnego Stage Run egzekwowany.

**Gate B** po kroku 13.

---

## Faza 4 — kontrolowane wykonanie

### Krok 14. Sandbox Controller

Prace:
- Wydzielić Sandbox Controller jako osobny proces o interfejsie ograniczonym do potrzeb platformy (kanał: gniazdo Unix, [architektura](architektura.md)).
- Tworzenie, start, stop, inspekcja, usunięcie; jednoznaczny związek sandbox ↔ Agent Run; osobne volumes dla workspace i Harness home; świeży sandbox dla każdego kolejnego agenta; zakaz montowania workspace poprzednika; import wyłącznie Project Version i artefaktów Handoffu.
- Kontener bez roota; usunięte zbędne capabilities; limity CPU, RAM, procesów, czasu i dysku; read-only root z jawnymi miejscami zapisu; bez katalogu użytkownika, repozytorium hosta i socketu kontenerowego w kontenerze.
- **Proxy egress — trasy: LiteLLM, ingest zdarzeń i rejestry pakietów z cache według allowlisty projektu ([D7.4](decyzje.md)); bez filtrowania per kontener w sieci rootless.**
- Automatyczne sprzątanie zasobów osieroconych; etykiety i identyfikatory do reconciliation po restarcie; rozróżnienie zatrzymania z zachowaniem stanu od trwałego usunięcia.

**Bramka:** proces w sandboxie nie widzi hosta, sandboxa poprzednika ani mechanizmu kontenerowego; połączenie poza proxy jest niemożliwe; przekroczenie limitu zatrzymuje.

### Krok 15. Obraz `dsh-runner` i profil `helmflow-standard`

Prace:
- Minimalny obraz bazowy z Pythonem, Git i narzędziami; przypięta wersja `deepseek-harness-sdk`; obraz przypięty po digest.
- Profil `helmflow-standard`; pluginy: wstrzyknięcie instrukcji agenta, zadania i Knowledge Manifest; eksport zdarzeń; narzędzia raportowania **Change Rationale** i **Handoff** ([D6.4](decyzje.md)).
- Usunięcie narzędzi niepotrzebnych w MVP; wyłącznie jawny workspace i Harness home; deterministyczny startup i jednoznaczne raportowanie gotowości.
- SBOM obrazu; skan podatności z zapisem zaakceptowanych wyjątków.

**Bramka:** PoC z fazy 1 działa wewnątrz sandboxa z tym samym obrazem i manifestem; wersje runtime widoczne w historii sesji.

### Krok 16. Orkiestracja SDLC Run, Stage Run i Agent Run

Prace:
- SDLC Run dla Work Item i bazowej Project Version; kolejne Stage Runs według Flow Definition; wybór wersji agenta per Stage Run.
- Utworzenie Agent Run z zamrożeniem: Agent Version, Knowledge Manifest, Runtime Profile, Model Profile, wejściowa Project Version.
- Zlecenie sandboxa; świeży workspace z wejściowej wersji; świeży Harness home; ograniczone poświadczenie LiteLLM per uruchomienie; wyłącznie sesyjne sekrety; handshake gotowości; zmiana stanu dopiero po potwierdzonym starcie; timeout startu i sprzątanie częściowych zasobów.
- Odbiór Stage Deliverable, Project Version i Handoff Package; umieszczenie rezultatu w Project Space poza sandboxem; przygotowanie środowiska następnego agenta z tego rezultatu; pętla testy/review → poprawki → ponowne testy.
- **Egzekwowanie budżetów tokenów/kosztu i limitów czasu ([D6.1](decyzje.md))**; zapis wszystkich wersji i identyfikatorów do audytu.

**Bramka:** agent kończy etap, jego sandbox zostaje odłączony, a następny agent otrzymuje wyłącznie Project Version i Handoff Package w nowym środowisku.

### Krok 17. Ingest i prezentacja trajectory

Prace:
- Odbiór eksportowanych zdarzeń DSH poza sandboxem; identyfikatory SDLC Run / Stage Run / Agent Run, sekwencja i czas odbioru; zachowanie oryginalnego typu i znormalizowanej kategorii prezentacyjnej.
- Zapis idempotentny; obsługa dostarczeń opóźnionych, powtórzonych i nieuporządkowanych; **trasa ingest uwierzytelniona poświadczeniem per Agent Run — zdarzenie nie może podszyć się pod cudzy run.**
- Redakcja sekretów, nagłówków autoryzacji i wrażliwych wartości; rozróżnienie danych do interfejsu od pełnego artefaktu źródłowego; odnośnik do źródłowego JSONL.
- Streaming nowych zdarzeń do interfejsów; odtworzenie historii po ponownym otwarciu; timeline całego SDLC Run + osobne trajectory każdego agenta; prezentacja co najmniej: agenta, etapu, planu, komunikatów, narzędzi, poleceń, wyników, błędów i stanu Agent Run.

**Bramka:** historia po zakończeniu jest logicznie zgodna z logiem DSH; ponowne dostarczenie tych samych zdarzeń nie tworzy duplikatów.

### Krok 18. Stop, cancel, awarie, resume

Prace:
- Rozróżnienie stop-z-możliwością-wznowienia od cancel i trwałego zakończenia; łagodne anulowanie pracy DSH; wymuszone zatrzymanie po przekroczeniu limitu.
- Zachowanie workspace i Harness home wyłącznie dla Agent Run przeznaczonego do resume; wznowienie tego samego Agent Run z tym samym `session_id` i zgodną wersją obrazu; blokada resume przy braku stanu lub niezgodnej wersji; resume nigdy jako przekazanie pracy innemu agentowi.
- Odzysk stanu po restarcie API, workera i Sandbox Controllera; wykrywanie osieroconych kontenerów i sesji bez procesu; unieważnianie poświadczeń LiteLLM po zakończeniu lub anulowaniu; polityka retencji zatrzymanych workspace'ów.
- **Obsługa Blocked → odpowiedź człowieka → wznowienie ([D6.2](decyzje.md))**; prezentacja przyczyny awarii i możliwych działań.

**Bramka:** test fault-injection — wymuszone zakończenie runnera po edycji pliku i restart usług kończą się kontynuacją tego samego Agent Run bez zmieszania historii.

**Gate C** po kroku 18.

---

## Faza 5 — traceability zmian

### Krok 19. Workspace Tracker

Prace:
- Zachowanie poza sandboxem wejściowej Project Version i czystego punktu odniesienia każdego Agent Run; mechanizm obserwacji niedostępny do modyfikacji przez agenta ([architektura](architektura.md)).
- Wykrywanie plików zmodyfikowanych, nowych, usuniętych i przeniesionych; pliki untracked spoza `git diff`; pliki binarne z limitami rozmiaru; kontrolowana polityka ignorowania build artifacts i sekretów; manifest ścieżek i hashy.
- File Change Events po zdarzeniach narzędzi + skan okresowy + debounce; File Versions przy checkpointach i publikacji Project Version; patche i snapshoty poza sandboxem.
- Końcowe porównanie wyeksportowanego workspace z niezależnym punktem odniesienia; wykrywanie rozbieżności między obserwacją a stanem końcowym.
- Projekcje: historia jednego pliku przez wszystkie etapy; diff wejście–wyjście per Agent Run; diff per Stage Run; Global Project Diff; historia zmiany zastąpionej przez późniejszego agenta.
- **Bramka kosztowa atrybucji liniowej ([D2](decyzje.md)):** po pomiarze kosztu — jawna decyzja właściciela zamiast samodzielnej redukcji zakresu.

**Bramka:** test z dwoma kolejnymi agentami pokazuje poprawne wersje pliku, diff każdego agenta i globalny — także gdy drugi agent nadpisuje fragment pracy pierwszego.

### Krok 20. Change Sets, uzasadnienia, checkpointy

Prace:
- Change Set jako logiczna grupa zmian jednego zamiaru, przypisana do dokładnie jednego Agent Run; zgłaszanie logicznego etapu pracy przez agenta.
- Wymagany jawny opis (Change Rationale): intencja, powód, kryterium, weryfikacja, ryzyko; surowy reasoning nie jest uzasadnieniem audytowym.
- Powiązanie Change Setu ze zdarzeniami trajectory, diffem i wersjami plików; status zmiany: aktualna / zmodyfikowana / zastąpiona / wycofana / częściowa; bez osobnego Change Setu na każdy zapis pliku.
- Checkpointy: przed sesją, po etapie logicznym, po testach, na końcu, ręczne; odtwarzalne niezależnie od `.git` sandboxa; porównanie checkpointów.

**Bramka:** osoba nieoglądająca procesu na żywo przechodzi od kryterium do etapu, agenta, uzasadnienia, diffu, trajectory i wyniku weryfikacji.

### Krok 21. Stage Deliverables, Project Deliverable, Handoff

Prace:
- Stage Deliverable jako rezultat Stage Run: diff agenta i etapu, Change Sets, mapowanie kryteriów na dowody, wykonane kontrole, ryzyka, ograniczenia.
- Handoff Package: wersja projektu, artefakty, decyzje, kryteria spełnione/otwarte, ryzyka, otwarte pytania; **handoff zastępczy i degradacja przy braku ([D6.4](decyzje.md))**.
- Project Deliverable: Global Project Diff, łańcuch Project Versions i Handoffów, dowody wszystkich etapów.
- Rozróżnienie dowodu zaobserwowanego przez platformę od deklaracji agenta; weryfikacja stanu końcowego niezależnym skanem; znacznik niespójności; niemodyfikowalność gotowych rezultatów — poprawki tworzą rewizję; trwałość artefaktów po usunięciu sandboxa.

**Bramka:** Project Deliverable i wszystkie Stage Deliverables pozostają czytelne po usunięciu wszystkich sandboxów.

**Gate D** po kroku 21.

---

## Faza 6 — pełny produkt i wydanie

### Krok 21a. Global Agent Catalog i promocje (przeniesione z kroków 11–12, [D7.3](decyzje.md))

Prace:
- Global Agent Catalog niezależny od Project Space; wybór wersji globalnej przez projekt; Project Agent Version wyprowadzona z globalnej z zachowanym pochodzeniem.
- Agent Promotion Candidate i Knowledge Promotion Candidate: oddzielenie treści ogólnej od projektowej, redakcja danych poufnych, review człowieka; promocja tworzy nową wersję globalną bez automatycznej aktualizacji projektów.

**Bramka:** promocja zachowuje pochodzenie i nie zmienia żadnych historycznych ani aktywnych Agent Runs; niezależność katalogu od Project Space potwierdzona testem.

### Krok 22. Pełny przepływ TUI

Prace:
- Okna i zakładki ([D8.2](decyzje.md)) obejmujące widoki z [cli](cli.md): pipeline SDLC Run z kontrolami, trajectory Agent Run, Changed Files z filtrami, przełączniki diffu (per agent / etap / plik / globalnie), historia wersji pliku z atrybucją, timeline Change Sets z uzasadnieniami, checkpointy z porównaniem, Handoff i Stage Deliverable, Project Deliverable z mapą kryteria→dowody, artefakty analityczne, review.
- W każdym widoku wersje agenta, wiedzy, modelu, DSH i obrazu sandboxa; **budżety widoczne ([D6.1](decyzje.md))**; potwierdzenia operacji destrukcyjnych z dokładnym celem; czytelne stany błędu, zatrzymania, resume i utraty połączenia.
- Web GUI realizowany po TUI, poza ścieżką krytyczną MVP ([D9.3](decyzje.md), [platforma-web](platforma-web.md)).

**Bramka:** test użyteczności według scenariusza z kroku 1 przeprowadzony w TUI — każda wymagana informacja odnaleziona bez dostępu do bazy i filesystemu hosta.

### Krok 23. Human Review, poprawki, kontrolowana integracja

Prace:
- Review jako bramka opcjonalna po Stage Deliverable i obowiązkowa dla Project Deliverable; komentarze do całości, Change Setu i fragmentu diffu.
- Decyzje Approve / Request Changes / Reject; uzasadnienie wymagane dla odrzucenia i żądania poprawek; zapis osoby, czasu i podstawy każdej decyzji; zakaz decyzji Approve dla agenta.
- Request Changes zawsze kieruje flow do wskazanego etapu jako nowy Stage Run z nowym Agent Run (niezmienniki 8 i 12); uwagi review jako jawny kontekst; poprzednia rewizja Deliverable zachowana.
- Rozdzielenie Approved od Integrated; eksport patcha lub kontrolowany commit; push (jeśli włączony) przez osobne, krótkotrwałe uprawnienie, bez bezpośredniej zmiany gałęzi głównej.

**Bramka:** demonstracja zawiera błąd znaleziony przez etap testów, powrót do implementacji w nowym sandboxie i kolejną wersję projektu bez utraty wcześniejszych trajectory, handoffów i review.

### Krok 24. Utwardzenie, test odbiorczy, wydanie self-hosted

Prace — testy funkcjonalne:
- Pełny happy path; bazowy SDLC (analiza → architektura → implementacja → testy → review); nowy sandbox i Harness home dla każdego kolejnego agenta; etap testów z wykrytym błędem; powrót do implementacji i ponowne testy; Request Changes i resume tego samego Agent Run; anulowanie; odrzucenie Stage i Project Deliverable; restart każdej usługi podczas aktywnej sesji; przepływ zrozumienia z artefaktami i dowodami.

Prace — testy traceability:
- Kompletność początkowej rewizji; manifest wersji agenta i wiedzy; Project Versions i Handoffy między etapami; końcowy diff kontra niezależny checkout; diff per agent, etap i globalnie; historia pliku zmienianego przez dwóch agentów; pliki nowe, usunięte, przemianowane, binarne i untracked; korelacja Change Set → trajectory → diff → dowód → review; czytelność historii po usunięciu sandboxa.

Prace — testy bezpieczeństwa:
- Próba odczytu plików hosta; workspace poprzedniego lub równoległego Agent Run; połączenia poza dozwolony egress; odczytu głównego klucza MiniMax; dostępu do socketu kontenerowego; proces przekraczający limity CPU/RAM/procesów/czasu; redakcja sekretów w logach, trajectory, błędach i artefaktach; usuwanie i wygasanie krótkotrwałych poświadczeń; **nieuwierzytelniony dostęp do API ([D6.3](decyzje.md))**; próba podszycia zdarzenia pod cudzy Agent Run.

Prace — instalacja i operacje:
- Wersjonowany Docker Compose; przypięte obrazy i zależności; migracje i procedura pierwszego uruchomienia; konfiguracja LiteLLM bez sekretów w repozytorium; backup i restore spójnego punktu trzech magazynów; runbook dla osieroconych sandboxów i zawieszonych runów; limity i retencja domyślna; release notes z wersją DSH i znanymi ograniczeniami.
- **Headless test pełnego przepływu przez kontrakt silnika.**

**Bramka:** na czystym hoście instalacja według dokumentacji, pełny wieloetapowy SDLC przez TUI, ten sam przepływ headless przez kontrakt silnika; historia dostępna po usunięciu sandboxów. Web, jeżeli już powstał, realizuje te same przypadki użycia.

**Gate E** po kroku 24.

---

## Bramy decyzyjne (twarde)

| Gate | Po | Warunek kontynuacji |
|---|---|---|
| **A — wykonalność runtime'u** | krok 5 | Stabilny DSH SDK; MiniMax przez LiteLLM z tool callingiem; odbiór zdarzeń; resume z jawnego stanu; **działający handoff dwóch Agent Runs**. Brak = zmiana decyzji o runtime, nie obejście w interfejsie. |
| **A′ — teza produktowa ([D7.1](decyzje.md))** | MVP-0 | Ten sam Work Item wykonany (a) jednym agentem i (b) flow 3-etapowym (analiza → implementacja → testy): porównanie jakości rezultatu, kosztu tokenów i czasu. Jeżeli flow wieloetapowy nie wygrywa wyraźnie, właściciel decyduje o repozycjonowaniu rdzenia (izolacja + audyt + review nad pojedynczym agentem; wieloetapowość jako opcja). Protokół pomiaru: co najmniej 2 Work Itemy i 2 powtórzenia na wariant; mierzone koszt, czas i przejście testów; ocena jakości w zaślepieniu. Bramka kończy się jawną decyzją właściciela; kontynuacja bez tej decyzji jest niedopuszczalna. |
| **B — spójność domeny** | krok 13 | Niezmienność wersji agenta i wiedzy; poprawne stany z limitami pętli; Handoff + łańcuch Project Versions; zamrożenie konfiguracji; domena bez DSH. Niezależność katalogu, pochodzenie i promocje weryfikuje bramka kroku 21a. |
| **C — kontrolowane wykonanie** | krok 18 | Izolacja każdego Agent Run; brak dostępu następnego agenta do sandboxa poprzednika; praca płynie tylko przez Project Space; brak socketu kontenerowego w kontenerze; ograniczone poświadczenia; stop/cancel/recovery/resume/Blocked; zdarzenia trwałe poza procesem DSH. |
| **D — traceability** | krok 21 | Diff per agent, etap i projekt; historia wersji pliku; wykrywanie zmian spoza edytora DSH; niezależność od `.git` agenta; zmiany powiązane z intencją i dowodem; audyt trwa po usunięciu sandboxa. |
| **E — MVP** | krok 24 | Niezależna osoba wdraża system i przechodzi pełny przepływ bez ręcznego poprawiania stanu. |

Gdzie bramka wymaga niezależnej osoby lub testu użyteczności, dopuszczalnym zastępnikiem jest agent AI bez dostępu do historii projektu, wykonujący spisany protokół zadań; udział osoby trzeciej pozostaje preferowany.

## Równoległość

- Po fazie 1 równolegle: **minimalna pętla MVP-0 (priorytet, [D7.2](decyzje.md))**, repo+CI, cienki host API, Sandbox Controller v1, model domenowy (agenci, wiedza, flow, Project Space; katalog i promocje dopiero w kroku 21a).
- Po kroku 16 równolegle: widoki SDLC Run i Agent Run w TUI, ingest trajectory, Workspace Tracker, testy awarii.
- Nigdy równolegle bez wspólnego punktu integracji: format Change Set ↔ narzędzie raportowania; Stage/Project Deliverable ↔ widok Review; mechanizm resume ↔ retencja workspace'ów; model stanów ↔ kontrolki zmieniające stany.

## Rejestr ryzyk

| Ryzyko | Skutek | Walidacja | Zabezpieczenie |
|---|---|---|---|
| DSH developer preview | breaking changes | kroki 3, 5 | przypięta wersja, testy kontraktowe, własna granica runtime |
| Niepełna zgodność MiniMax | niestabilny agent | krok 4 | profil kompatybilności, zadania testowe |
| Utrata zdarzeń | niepełna historia | kroki 5, 17 | idempotentny ingest, źródłowe JSONL |
| Docker jako słaba izolacja | dostęp do hosta | kroki 2, 14, 24 | rootless, limity, brak mountów; docelowo gVisor/microVM |
| Agent manipuluje Git | fałszywy diff | krok 19 | zewnętrzny baseline, końcowa rekonsyliacja |
| Kolejny agent dziedziczy ukryty stan | nieodtwarzalne wyniki | kroki 5, 14, 16 | świeży sandbox, formalny Handoff |
| Późniejszy agent nadpisuje zmianę | błędna atrybucja | kroki 19–20 | File Versions, diff per Agent Run |
| Atrybucja liniowa zbyt kosztowna | nieproporcjonalny rozrost kroku 19 | krok 19 | bramka kosztowa: jawna decyzja właściciela ([D2](decyzje.md)) |
| Pętla poprawek bez końca | wyczerpany budżet | kroki 13, 16 | limit powrotów + budżety + eskalacja ([D6.1](decyzje.md)) |
| Kaskada złej jakości (zła analiza → zła implementacja) | rezultat droższy i gorszy niż praca pojedynczego agenta | **Gate A′ na MVP-0**, odbiór w 24 | porównanie z pojedynczym agentem zanim powstanie rdzeń; flow o długości 1+ jako punkt odniesienia |
| Filtrowanie egress per kontener w rootless | niekompletna polityka sieciowa | krok 14 | proxy egress jako jedyna trasa wyjściowa ([D7.4](decyzje.md)) |
| Łańcuch dostaw pakietów z rejestrów | złośliwa zależność w sandboxie | kroki 2, 14 | allowlista per projekt w Sandbox Policy, cache, zapis w audycie |
| Wiedza projektowa wycieka przy promocji | ujawnienie danych | krok 21a | redakcja + review + nowa wersja globalna |
| Sekrety w logach | wyciek | kroki 9, 17, 24 | redakcja, scoped tokeny, testy |
| Reasoning udaje uzasadnienie | nieczytelny audyt | krok 20 | jawny Change Rationale |
| Resume używa innego runtime | niespójna sesja | krok 18 | przypięty obraz, kontrola zgodności |
| AGPL na SDK ogranicza adopcję ekosystemu | mniej zewnętrznych implementacji kontraktów | [produkt, rozdz. 4](produkt.md) | świadoma akceptacja właściciela; zmiana licencji SDK pozostaje jego decyzją |
| Rozrost zakresu | brak MVP | krok 1 + bramy | zamrożona lista poza MVP; stop-loss faz |

## Poza MVP (zamrożone)

Równoległa modyfikacja tej samej Project Version; automatyczne rozwiązywanie konfliktów; dynamiczny manager AI tworzący zespoły; harnessy inne niż DSH (OpenHands, OpenCode); publiczny marketplace; automatyczna promocja wiedzy/agentów; publiczny multi-tenant SaaS; automatyczny deployment; Kubernetes jako wymaganie; pełna izolacja microVM; semantyczne wyszukiwanie wiedzy; tryb plikowy silnika bez serwera bazy (kierunek zachowany w abstrakcji, [D3](decyzje.md)); implementacja Environment Controllera i Managed Environments (kontrakt SDK i pojęcie domenowe powstają w MVP, [D8.3](decyzje.md)); Web UI ([D9.3](decyzje.md), realizowany po TUI). Kolejność po MVP: [produkt, rozdz. 10](produkt.md).

## Pierwsze prace w praktyce

Szkic scenariusza demonstracyjnego (uszczegóławiany w kroku 1): repozytorium demonstracyjne — mały projekt Pythona z testami pytest (np. narzędzie wiersza poleceń); Work Item wytwarzania — dodanie jednej funkcji ze zmianą kodu i testem, kryteria: testy przechodzą, zmiana udokumentowana; Work Item zrozumienia — rekonstrukcja modelu domeny tego samego projektu z dowodami plik/linia.

1. Wybrać małe repozytorium demonstracyjne i Work Item demonstracyjny.
2. Przypiąć DSH; uruchomić przykład Python SDK z osobnym workspace i Harness home.
3. Postawić LiteLLM i skierować DSH do MiniMax.
4. Wykonać **dwa kolejne Agent Runs**: implementacja → niezależne testy.
5. Przechwycić zdarzenia; wyeksportować Project Version; uruchomić drugiego agenta w świeżym środowisku.
6. Wymusić zakończenie procesu i wykazać resume tego samego Agent Run.
7. Dopiero wtedy utworzyć monorepo produktu i przenieść PoC do obrazu runnera.

Pierwszym ważnym artefaktem nie jest ekran logowania ani dashboard. Jest nim **odtwarzalny handoff między dwoma Agent Runs — każdy z własnym DSH, trajectory i sandboxem, połączone wyłącznie Project Version i Handoff Package**.

## Ostateczna definicja ukończenia MVP

MVP jest ukończone, gdy jednocześnie:

- instalacja działa na czystym hoście według jednej procedury,
- użytkownik wybiera agentów z globalnego katalogu, tworzy wersje projektowe i zgłasza je do promocji (pełny przepływ kandydat → redakcja → review),
- użytkownik tworzy Work Item i sekwencyjny SDLC Flow (długość 1+; bazowy pełny flow obsłużony w odbiorze),
- każdy Stage Run ma przypisaną konkretną wersję agenta; każdy Agent Run działa przez DSH i MiniMax w osobnym sandboxie,
- sandbox, workspace i Harness home nie są współdzielone; etapy łączy wyłącznie Project Version + artefakty + Handoff,
- trajectory każdego agenta widoczne osobno i w timeline całego SDLC Run,
- historia obejmuje zmiany per agent, etap, plik i projekt — również untracked, usunięcia i rename,
- logiczne zmiany mają jawne uzasadnienia; Deliverables zawierają diffy, dowody, ryzyka i wersje konfiguracji,
- człowiek albo etap testów kieruje flow do wcześniejszego etapu w granicach limitu pętli; przekroczenie budżetu skutkuje eskalacją do człowieka, nie cichym przerwaniem,
- agent może zablokować się pytaniem do człowieka i zostać wznowiony z odpowiedzią,
- agent nie może zatwierdzić własnego rezultatu; Approved ≠ Integrated,
- historia dostępna po usunięciu wszystkich środowisk wykonawczych,
- awaria procesu nie powoduje cichej utraty ani podwójnego wykonania,
- główny klucz MiniMax nie trafia do sandboxa; API wymaga uwierzytelnienia,
- ten sam przepływ działa przez CLI/TUI i headless przez kontrakt silnika (Web nie jest warunkiem ukończenia MVP — [D9.3](decyzje.md)),
- użytkownik może uruchomić przepływ zrozumienia i otrzymać artefakty analizy z dowodami odnoszącymi się do kodu ([D8.1](decyzje.md)),
- znane ograniczenia bezpieczeństwa i runtime są jawnie udokumentowane.

Jeżeli brakuje niezależnego śledzenia zmian, oddzielnych sandboxów kolejnych agentów, formalnego handoffu, review albo recovery — system jest demonstratorem harnessu, a nie MVP Helmflow.
