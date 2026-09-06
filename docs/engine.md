# Helmflow Engine

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Produkt 2 — silnik = SDK + inne ([D3](decyzje.md)): implementacje kontraktów SDK (integracja DSH, sandbox, wewnętrzny git, storage, PostgreSQL) oraz przypadki użycia i orkiestracja SDLC. Ma własny, stabilny kontrakt programistyczny — nie jest wewnętrznym API backendu. Pakiet `packages/engine`; komponenty pomocnicze: `packages/runtime-dsh`, `services/sandbox-controller`.

## 1. Logika biznesowa

Engine implementuje całość logiki biznesowej produktu na kontraktach SDK. Zakres, pogrupowany według obszarów domeny:

1. **Katalog i wersje agentów** — tworzenie Agent Definition; publikacja niezmiennych wersji; fork do wersji projektowej z zachowaniem pochodzenia; kompilacja wersji agenta do manifestu uruchomienia; przepływ promocji (kandydat → redakcja → review → nowa wersja globalna, bez automatycznej aktualizacji projektów); blokada modyfikacji wersji użytej przez rozpoczęty Agent Run.
2. **Wiedza** — wersjonowanie Knowledge Packs; budowa Knowledge Manifest per Agent Run: deterministyczna kolejność składania, limity rozmiaru, ostrzeżenia o konfliktach, pochodzenie każdego fragmentu; przepływ promocji wiedzy.
3. **Project Space i wersje projektu** — rejestracja i weryfikacja repozytorium; utrwalenie bazowej rewizji; publikacja niezmiennych Project Versions (commit w wewnętrznym git + manifest, [D4](decyzje.md)); utrzymanie łańcucha wersji SDLC Run; przygotowanie czystej kopii wersji dla nowego sandboxa.
4. **Cykl życia SDLC** — utworzenie SDLC Run dla Work Item; sekwencjonowanie Stage Runs według Flow Definition; egzekwowanie maszyny stanów z przyczyną każdego przejścia; niezmiennik jednego aktywnego Stage Run; powroty do wcześniejszych etapów z licznikiem i limitem ([D6.1](decyzje.md)); rozdzielenie zakończenia agenta, zakończenia etapu i zakończenia całego SDLC Run.
5. **Orkiestracja Agent Run** — zamrożenie pełnej konfiguracji wykonania (wersja agenta, manifest wiedzy, Runtime Profile, Model Profile, wejściowa Project Version); zlecenie sandboxa do Sandbox Controllera; wstrzyknięcie kontekstu i wyłącznie sesyjnych sekretów; handshake gotowości; generowanie i unieważnianie ograniczonych poświadczeń LiteLLM; stop, cancel, resume (Execution Attempts) i stan Blocked z odpowiedzią człowieka ([D6.2](decyzje.md)); wykrywanie pracy porzuconej i osieroconych sandboxów; egzekwowanie budżetów tokenów i kosztu oraz limitów czasu.
6. **Śledzenie zmian i dowodów** — idempotentny ingest trajectory z redakcją sekretów; rejestracja File Change Events i utrwalanie File Versions ([Workspace Tracker](architektura.md)); checkpointy automatyczne i ręczne; końcowa rekonsyliacja workspace'u z niezależnym punktem odniesienia jako źródło prawdy ([D6.5](decyzje.md)); budowa diffów per agent, etap, plik i projekt wraz z atrybucją; korelacja Change Set ↔ trajectory ↔ diff ↔ dowód; oznaczanie rezultatu jako niespójny przy rozbieżności.
7. **Handoff i Deliverables** — walidacja Handoff Package według schematu; handoff zastępczy i degradacja etapu przy jego braku ([D6.4](decyzje.md)); komponowanie Stage Deliverable i Project Deliverable z mapowaniem kryteriów akceptacji na dowody; rozróżnienie dowodu zaobserwowanego przez platformę od deklaracji agenta; niemodyfikowalność gotowych rezultatów i tworzenie rewizji.
8. **Review i integracja** — bramki opcjonalne per etap i obowiązkowa dla Project Deliverable; decyzje Approve / Request Changes / Reject z wymaganym uzasadnieniem oraz zapisem osoby, czasu i podstawy; zakaz decyzji Approve dla agenta; skierowanie flow do wskazanego etapu po Request Changes z przekazaniem uwag jako jawnego kontekstu; rozdzielenie Approved od Integrated; eksport patcha lub kontrolowany commit.
9. **Egzekwowanie niezmienników i trwałość audytu** — niezmienniki przekrojowe z [modelu domeny](model-domeny.md) w przypadkach użycia i ograniczeniach bazy (jednoobiektowe egzekwuje model SDK); trwałość pełnego śladu audytowego po usunięciu sandboxów; idempotencja operacji uruchomienia, zatrzymania i wznowienia; odzysk stanu po restarcie procesów.

## 2. Kontrakt silnika

Kontrakt silnika (operacje asynchroniczne, streaming zdarzeń, cancel, resume) jest **jedynym programistycznym wejściem** warstw wyższych: backendu, CLI i testu headless pełnego przepływu. Katalog operacji per obszar (nazwy robocze; sygnatury ustala implementacja kroku 7 na typach z [model-danych](model-danych.md)):

| Obszar | Operacje kontraktu |
|---|---|
| Projekty | `create_project`, `register_repository`, `get_project_version`, `list_project_versions` |
| Agenci | `create_agent_definition`, `publish_agent_version`, `fork_agent_version`, `diff_agent_versions`, `propose_promotion`, `review_promotion` |
| Wiedza | `create_knowledge_pack`, `publish_knowledge_version`, `assign_knowledge`, `preview_manifest`, `propose_knowledge_promotion` |
| Work Items i flow | `create_work_item`, `define_flow`, `assign_agent_to_stage` |
| Wykonanie | `start_sdlc_run`, `stop_agent_run`, `cancel_agent_run`, `resume_agent_run`, `answer_blocked_question` |
| Obserwacja | `stream_events` (od kursora, bez utraty i duplikacji), `get_trajectory`, `get_run_timeline`, `list_file_changes` |
| Zmiany i dowody | `get_diff` (per agent / etap / plik / projekt), `list_change_sets`, `list_checkpoints`, `compare_checkpoints`, `list_evidence` |
| Review | `get_deliverable`, `submit_review_decision`, `integrate` (eksport patcha / commit / PR) |

Reguły kontraktu: operacje długotrwałe zwracają natychmiast identyfikator i raportują postęp strumieniem zdarzeń; wszystkie operacje mutujące są idempotentne (klucz idempotencji); `stream_events` wznawia od ostatniego znanego kursora.

## 3. Koordynacja procesów

- Silnik jest **biblioteką** osadzaną in-process przez backend, CLI i worker ([D3](decyzje.md)); koordynacja wyłącznie przez współdzielony trwały stan w PostgreSQL: trwała kolejka pracy, idempotencja, zdarzenia przez `LISTEN/NOTIFY`.
- **Worker** jest właścicielem wykonania długotrwałych operacji (orkiestracja Agent Runs); interfejsy są zleceniodawcami i obserwatorami — zamknięcie TUI nie przerywa pracy.
- Restart dowolnego procesu nie gubi zleconej pracy ani nie powoduje podwójnego wykonania (test bramki kroku 7).
- Komunikacja z Sandbox Controllerem: lokalny kanał techniczny (gniazdo Unix), patrz [architektura](architektura.md).

## 4. Implementacje kontraktów SDK

| Kontrakt SDK | Implementacja w Engine |
|---|---|
| `AgentRuntime` | `runtime-dsh` — integracja z DSH przez jego Python SDK i pluginy `helmflow-standard` |
| `SandboxProvider` | klient Sandbox Controllera |
| `EnvironmentProvider` | Environment Controller (po MVP; kontrakt i stub od MVP) |
| `VersionStore` | wewnętrzne bare-repozytoria git + manifesty w PostgreSQL ([D4](decyzje.md)) |
| `ArtifactStore` | lokalny filesystem; sterownik S3/MinIO jako druga implementacja |
| `EventStream` | PostgreSQL `LISTEN/NOTIFY` + trwały log zdarzeń |
| `StateRepository` | SQLAlchemy 2 (async) + Alembic; mapowanie ORM ↔ modele SDK wewnątrz silnika |

Każda implementacja przechodzi test kit swojego kontraktu ([D9.2](decyzje.md)); wymiana implementacji (inny harness, inny storage) nie zmienia warstw wyższych.
