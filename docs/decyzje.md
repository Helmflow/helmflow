# Helmflow — decyzje wiążące (D1–D9)

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Poniższe decyzje zostały podjęte przez właściciela i **nie podlegają renegocjacji przez agenta implementującego**. Zmiana którejkolwiek wymaga powrotu do właściciela. Przy konflikcie między decyzjami pierwszeństwo ma decyzja o wyższym numerze (późniejsza); nowelizacje są odnotowane przy decyzji pierwotnej. Decyzje D1–D9 zostaną przeniesione do `docs/adr/` jako ADR-y 0001–0009 w kroku 2 planu ([plan-mvp](plan-mvp.md)).

## Tabela skrótowa

| Nr | Data | Decyzja jednym zdaniem | Nowelizacje |
|---|---|---|---|
| D1 | 2026-09-03 | Nazwa produktu i repozytorium: Helmflow | — |
| D2 | 2026-09-03 | Pełny zakres funkcjonalny MVP | 2026-09-05: Web poza Definition of Done MVP |
| D3 | 2026-09-04 | Warstwy produktu: SDK → Engine → backend → Platform; SDK nigdy nie jest klientem HTTP | — |
| D4 | 2026-09-03 | Project Version = wewnętrzny git + manifest | — |
| D5 | 2026-09-03/04 | Decyzje bazowe: DSH jako runtime, MiniMax przez LiteLLM, izolacja per Agent Run, audyt poza sandboxem | — |
| D6 | 2026-09-03 | Uzupełnienia z analizy: budżety, Blocked, uwierzytelnienie, fallback handoffu, FCE jako telemetria | — |
| D7 | 2026-09-04 | Poprawki przebiegu planu: Gate A′, MVP-0, katalog w 21a, proxy egress | 2026-09-05: rejestry pakietów w proxy |
| D8 | 2026-09-04 | Rozszerzenia produktowe: przypadek użycia „rozumienie", TUI, Managed Environments | — |
| D9 | 2026-09-04/05 | Kolejność budowy od SDK z testami kontraktowymi; Web odroczony; konwencja matrioszki | — |

## D1. Nazwa: Helmflow

Produkt, repozytorium i przestrzenie nazw kodu używają nazwy **Helmflow**. Organizacja GitHub: `Helmflow`.

## D2. Zakres: pełny zakres MVP

MVP obejmuje pełny zakres funkcjonalny produktu, w tym:

- Global Agent Catalog z wersjonowaniem i projektowymi forkami,
- pełne przepływy promocji (Agent Promotion Candidate i Knowledge Promotion Candidate: kandydat → redakcja → review → nowa wersja globalna),
- CLI jako pełnoprawny drugi interfejs obok Web,
- wszystkie cztery perspektywy diffu (per agent, per etap, per plik, globalna) z pełną atrybucją zmian między agentami.

Nowelizacja (2026-09-05, wynika z D9.3): Web pozostaje w zakresie produktu, ale nie jest warunkiem ukończenia MVP — Definition of Done realizują TUI i headless przez kontrakt silnika.

Uwaga wykonawcza: atrybucja na poziomie **wersji pliku** jest wymogiem twardym; atrybucja na poziomie linii („który agent ostatnio dotknął ten fragment") jest w zakresie, ale jej koszt należy zweryfikować w kroku 19 — jeśli okaże się nieproporcjonalny, agent implementujący przedstawia problem właścicielowi zamiast samodzielnie redukować zakres.

## D3. Warstwy produktu: Helmflow SDK → Engine → Platform

Sformułowanie właściciela (ostateczne, 2026-09-04): *SDK to jednolity model danych i kontrakty części składowych. Silnik = SDK + inne. Backend = silnik + API. Platforma = Next.js + backend.*

Obowiązująca interpretacja — warstwy, które są zarazem granicami produktów:

- **Helmflow SDK (fundament)** — jednolity model danych i kontrakty (interfejsy) części składowych: runtime agenta, sandbox, wersje projektu, wiedza, zdarzenia, storage. Czysta, publikowalna samodzielnie biblioteka Pythona bez zależności technicznych; zewnętrzny konsument może implementować jej kontrakty bez pozostałych warstw. **SDK nie jest klientem HTTP i nie wolno go tak implementować** — konsumenci używają go przez import, nigdy przez sieć.
- **Helmflow Engine (silnik) = SDK + inne** — implementacje kontraktów SDK (integracja DSH, sandbox, wewnętrzny git, storage, PostgreSQL) oraz przypadki użycia, orkiestracja SDLC, trwały stan, kolejka i zdarzenia. Ma własny, stabilny kontrakt programistyczny — nie jest wewnętrznym API backendu.
- **Backend = Engine + API** — cienki host FastAPI osadzający silnik in-process i wystawiający API przeglądarce; jedyne domenowe HTTP w systemie. Zero własnych reguł domenowych.
- **Helmflow Platform (platforma) = backend + frontend Next.js** — frontend serwuje wyłącznie UI (zero logiki domenowej); razem dostarczane jako instalacja self-hosted (Compose), wraz z workerem do długich operacji. Backend i frontend pozostają jednym produktem, dopóki nie pojawi się drugi konsument backendu — przedwczesny rozdział mnoży wersjonowanie bez korzyści.
- **Helmflow CLI** osadza silnik lokalnie i działa bez backendu.
- Koordynacja wielu procesów osadzających silnik odbywa się **wyłącznie przez współdzielony trwały stan** (PostgreSQL): trwała kolejka pracy, idempotencja operacji, zdarzenia na żywo przez `LISTEN/NOTIFY`. Żaden proces nie trzyma stanu domenowego wyłącznie w pamięci. Skalowanie (workery i sandboxy na innych maszynach) realizuje się przez kolejne procesy osadzające silnik i podpięte do tej samej bazy — nie przez zdalne SDK.
- Kierunek po MVP (nie w zakresie MVP): tryb w pełni lokalny bez serwera bazy — stan jako plik (np. SQLite) za tą samą abstrakcją repozytorium stanu. Abstrakcję warstwy trwałości projektować tak, by tej opcji nie zamknąć.

Rozstrzygnięcie nazewnicze: w projekcie istnieją **dwa różne SDK** — `deepseek-harness-sdk` (runtime agenta, działa **wewnątrz** sandboxa) i **Helmflow SDK** (jednolity model danych i kontrakty, działa **poza** sandboxem). ADR z kroku 2 brzmi: „DSH i jego Python SDK działają wewnątrz sandboxa; Helmflow SDK i silnik działają poza nim."

## D4. Project Version: wewnętrzny git + manifest

- Każdy Project Space posiada **wewnętrzne bare-repozytorium git** zarządzane przez platformę, przechowywane poza zasięgiem sandboxów. Kod każdej Project Version jest commitem w tym repozytorium.
- **Artefakty etapów (analizy, plany, raporty testów) są plikami w workspace** — dzięki temu płyną naturalnie przez Project Versions i podlegają tej samej historii co kod.
- **Manifest Project Version** w PostgreSQL wiąże: SHA commitu wewnętrznego, identyfikatory artefaktów wielkogabarytowych w storage obiektowym, metadane (SDLC Run, Stage Run, Agent Run, czas, poprzednik).
- Diffy, historia plików i porównania wersji wykorzystują mechanikę git (plumbing) na wewnętrznym repozytorium — nie na `.git` widzianym przez agenta, który nie jest zaufany.
- Repozytorium użytkownika jest źródłem bazowej rewizji i celem integracji (patch/commit/PR); pomiędzy etapami kod żyje wyłącznie w magazynie wewnętrznym.

## D5. Decyzje bazowe (potwierdzone)

1. DeepSeek Harness (DSH) jest jedynym runtime'em agenta w MVP. DSH to harness agenta kodującego: prowadzi pętlę model–narzędzia (edycja plików, wykonywanie poleceń), utrzymuje sesję z możliwością wznowienia i zapisuje append-only trajectory (kontekst, wywołania narzędzi, wyniki) w logu JSONL. Wersja przypięta (pakiet i obraz po digest); rozszerzany pluginami, nigdy modyfikowany w rdzeniu. Właściciel potwierdził tę decyzję 2026-09-04, świadomie akceptując ryzyko developer preview; ubezpieczeniem pozostają granica `packages/runtime-dsh` i testy kontraktowe.
2. MiniMax jest modelem domyślnym, dostępnym **wyłącznie** przez LiteLLM; główny klucz MiniMax nigdy nie trafia do sandboxa; sesje dostają ograniczone, krótkotrwałe poświadczenia.
3. Jeden Agent Run = jeden sandbox = jeden workspace = jeden Harness home = jeden session ID DSH. Innymi słowy: każde wykonanie agenta otrzymuje własny, jednorazowy komplet — kontener, w którym działa (sandbox), świeżą kopię projektu, na której pracuje (workspace), osobny katalog stanu i logów DSH (Harness home) oraz własną sesję DSH; żaden element kompletu nie jest współdzielony z innym wykonaniem, a resume podpina się zawsze do tego samego kompletu.
4. Audytowe źródło prawdy (wersje, zdarzenia, checkpointy, diffy, decyzje) żyje poza sandboxem.
5. Trajectory DSH, historia plików, historia wersji projektu i review to odrębne, skorelowane zapisy.
6. Izolacją wykonania w MVP są kontenery (rootless Docker lub Podman). Kontener skutecznie ogranicza agenta, ale nie daje gwarancji izolacji na poziomie maszyny wirtualnej — to akceptowalny poziom ochrony dla instalacji, w której jedyny użytkownik uruchamia agentów na własnej maszynie. Nie jest to poziom wystarczający dla publicznej usługi, w której obcy sobie użytkownicy współdzielą infrastrukturę; mocniejsza izolacja (gVisor, microVM) pozostaje kierunkiem po MVP.

## D6. Uzupełnienia przyjęte na podstawie analizy (wiążące)

1. **Budżety i limity pętli.** SDLC Flow Definition określa maksymalną liczbę powrotów do wcześniejszego etapu (domyślnie 2); SDLC Run i Agent Run mają budżet tokenów/kosztu — definiowany w Model Profile, egzekwowany przez silnik — widoczny w UI. Przekroczenie budżetu zatrzymuje pracę i wymaga decyzji człowieka; przerwanie bez sygnalizacji jest niedopuszczalne.
2. **Stan Blocked.** Agent Run może przejść w stan Blocked z jawnym pytaniem do człowieka; odpowiedź człowieka wraca jako jawny kontekst i wznawia ten sam Agent Run. To jedyny kanał eskalacji w trakcie etapu. Powiadomienie jest widoczne w TUI, także przy jego następnym otwarciu; dodatkowe kanały powiadomień po MVP.
3. **Uwierzytelnienie.** Instalacja jednoosobowa ≠ brak logowania. Hostowane API (backend) wymaga uwierzytelnienia: pojedynczy użytkownik, token/sesja. CLI osadza silnik in-process, więc jego granicą ochrony jest dostęp do bazy i plików instalacji, nie osobne logowanie. Testy bezpieczeństwa obejmują nieuwierzytelniony dostęp do API, nie tylko ucieczkę z sandboxa.
4. **Fallback handoffu.** Handoff Package ma walidowany schemat i jest tworzony przez agenta narzędziem platformy. Gdy agent zakończy pracę bez poprawnego handoffu, platforma składa **minimalny handoff zastępczy** (Project Version, diff, artefakty, brak sekcji decyzyjnych) i oznacza Stage Deliverable jako zdegradowany — etap zostaje domknięty, a status degradacji jest widoczny w review.
5. **File Change Events są telemetrią.** Źródłem prawdy o zmianach jest rekonsyliacja Project Version wejściowej z wyjściową (niezależny skan). Strumień FCE służy obserwacji na żywo i korelacji z trajectory; jego ewentualne luki nie unieważniają audytu.
6. **Niezmiennik sekwencyjności:** SDLC Run ma w danym momencie co najwyżej jeden aktywny Stage Run.
7. **Flow o długości 1+ jest pełnoprawny.** Platforma dostarcza bazowy flow (analiza → architektura → implementacja → testy → review) jako szablon, ale run z mniejszą liczbą etapów (np. implementacja → testy) jest poprawny. Bazowy pełny flow musi być obsłużony w teście odbiorczym.

## D7. Poprawki przebiegu planu (2026-09-04)

Przyjęte przez właściciela po ocenie krytycznej planu:

1. **Gate A′ — bramka tezy produktowej** ([plan-mvp](plan-mvp.md)): przed rozbudową rdzenia porównujemy ten sam Work Item wykonany jednym agentem i flow wieloetapowym. Plan przestaje testować najdroższe ryzyko — wartość wieloagentowego SDLC — dopiero na końcu.
2. **Kamień milowy MVP-0 (dogfooding)**: minimalna pętla produktu powstaje bezpośrednio po fundamencie (minimalne wersje kroków 6–8) i od tego momentu Helmflow jest rozwijany Helmflowem.
3. **Katalog globalny i promocje przeniesione na koniec** (z kroków 11–12 do kroku 21a): rdzeń domenowy potrzebuje wcześniej wyłącznie niezmiennych wersji agentów jako rekordów; nic w krokach 13–21 nie zależy od katalogu ani promocji.
4. **Proxy egress zamiast filtrowania per kontener**: cały ruch wychodzący sandboxa idzie przez proxy egress. Dozwolone trasy: LiteLLM, ingest zdarzeń oraz — decyzją właściciela z 2026-09-05 — oficjalne rejestry pakietów (np. PyPI, npm) z cache, według allowlisty per projekt zapisanej w Sandbox Policy i widocznej w audycie. Rezygnujemy z filtrowania sieci per kontener w trybie rootless; ryzyko łańcucha dostaw pakietów wchodzi jawnie do threat modelu (krok 2).

Zakres MVP (D2) pozostaje pełny — zmienia się kolejność i punkty pomiaru, nie lista funkcji. Właściciel potwierdził jednocześnie DSH jako jedyny runtime (świadoma akceptacja ryzyka developer preview — patrz D5.1).

## D8. Rozszerzenia produktowe (2026-09-04)

Przyjęte przez właściciela po analizie przypadków użycia:

1. **Dwa równorzędne przypadki użycia: wytwarzanie i rozumienie.** Przepływ zrozumienia programu jest szablonem flow dostarczanym w MVP ([przeplywy](przeplywy.md)). Dowód twierdzenia analitycznego ma postać odnośnika do kodu (plik, linia) wraz z metodą ustalenia; twierdzenie bez dowodu jest oznaczane jako deklaracja agenta. Zatwierdzone artefakty analizy są promowane do wiedzy repozytorium (Knowledge Candidate) i zasilają przepływy wytwarzania.
2. **Helmflow CLI = tryb komendowy + TUI.** TUI (Textual) z oknami i zakładkami: podgląd pracy agentów na żywo, przeglądanie prac i rezultatów, zlecanie zadań, review. Parytet z Web jest definiowany na poziomie przypadków użycia — gwarantowany wspólnym kontraktem Engine — nie na poziomie lustrzanych ekranów.
3. **Managed Environments.** Projekt może posiadać izolowane, długożyjące środowiska: prawdziwe platformy instalowane na maszynach wirtualnych (np. system operacyjny w VirtualBox/libvirt), przypisywalne do etapów (np. testów), zasilane kodem z repozytorium lub Project Version, dostępne do edycji, uruchamiania i weryfikacji. Środowisko jest zasobem, na którym agent operuje wyłącznie przez Environment Controller; agent nigdy nie otrzymuje dostępu do hosta. Kontrakt środowisk w SDK i pojęcie domenowe powstają w MVP; implementacja kontrolera następuje po MVP.

## D9. Kolejność budowy i priorytet interfejsów (2026-09-04)

Przyjęte przez właściciela:

1. **Budowa od dołu warstw.** Kolejność realizacji: najpierw **Helmflow SDK** w wersji minimalnej, rozbudowywane iteracyjnie; następnie **Engine**; następnie **backend + CLI/TUI**. Warstwa wyższa nie powstaje przed użytecznym minimum warstwy niższej.
2. **Jakość przez testy kontraktowe od pierwszego pakietu.** Każdy kontrakt SDK powstaje razem z zestawem testów kontraktowych niezależnym od implementacji (wspólny test kit); każda implementacja kontraktu w Engine musi przechodzić ten sam zestaw. Kontrakt bez testów jest nieukończony.
3. **Web UI odroczony.** Web pozostaje w docelowym zakresie produktu, ale nie jest budowany teraz — pierwszym interfejsem użytkownika jest CLI/TUI (D8.2), a odbiór MVP następuje przez TUI i headless przez kontrakt silnika. MVP-0 jest realizowane w TUI, bez Web. Backend (host API) powstaje jako fundament pod przyszły Web, lecz żaden krok nie jest blokowany przez interfejs przeglądarkowy.
4. **Konwencja matrioszki (2026-09-05).** Budowa produktu wyższej warstwy zawsze pociąga za sobą zbudowanie z lokalnych źródeł monorepo wszystkich warstw niższych — szczegóły w [technologia](technologia.md).
