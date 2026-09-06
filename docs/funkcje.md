# Helmflow — funkcje MVP

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Zakres funkcjonalny MVP według obszarów. Kolumny „Krok" i „Produkt" mapują funkcję na krok planu ([plan-mvp](plan-mvp.md)) i produkt, który ją realizuje ([architektura](architektura.md)).

## 1. Katalog i agenci

| Funkcja | Krok | Produkt |
|---|---|---|
| Wersje agentów — minimum domenowe: Role, Agent Definition, niezmienne wersje, zamrożenie wersji użytej przez Agent Run, nowa wersja na podstawie poprzedniej, diff wersji w interfejsie | 11 | Engine + CLI |
| Global Agent Catalog: fork projektowy z pochodzeniem | 21a | Engine + CLI |
| Promocja: Agent Promotion Candidate z redakcją i review; nowa wersja globalna bez auto-aktualizacji projektów | 21a | Engine + CLI |
| Kompilator domenowej wersji agenta do manifestu uruchomienia (bez struktur DSH w domenie) | 11 | Engine |

## 2. Wiedza

| Funkcja | Krok | Produkt |
|---|---|---|
| Knowledge Packs w zakresach z [modelu domeny](model-domeny.md) (globalna, projektowa, repozytoryjna, roli, etapu, Work Item) i niezmienne Knowledge Versions; przypisanie paczek do projektu, roli lub konkretnego agenta | 12 | Engine |
| Knowledge Manifest per Agent Run: deterministyczne składanie, limity rozmiaru, ostrzeżenia o konfliktach, podgląd dokładnej treści przed startem | 12 | Engine + CLI |
| Knowledge Promotion Candidate z redakcją i review | 21a | Engine + CLI |
| Bez semantycznego wyszukiwania, dopóki statyczne paczki nie okażą się niewystarczające | — | — |

## 3. Projekt i SDLC

| Funkcja | Krok | Produkt |
|---|---|---|
| Project Space z rejestracją jednego repozytorium, weryfikacją dostępu i utrwaleniem bazowej rewizji | 10 | Engine |
| Niezmienne Project Versions ([D4](decyzje.md)) i ich łańcuch przez cały SDLC Run | 10 | Engine |
| SDLC Flow Definition: edycja sekwencji etapów, bramek człowieka, limitów pętli; szablony przepływu wytwarzania i przepływu zrozumienia ([D8.1](decyzje.md)); flow o długości 1+ ([D6.7](decyzje.md)) | 13 | Engine + CLI |
| Work Items z kryteriami akceptacji; Agent Assignment per etap; zamrożenie konfiguracji per Agent Run | 13 | Engine + CLI |
| Stany SDLC Run i Stage Run z dozwolonymi przejściami, przyczynami i widoczną historią; powrót testy/review → implementacja | 13 | Engine |

## 4. Wykonanie

| Funkcja | Krok | Produkt |
|---|---|---|
| Sandbox Controller: pełny cykl życia; rootless, bez socketu kontenerowego w kontenerze, limity, read-only root, osobne volumes, sprzątanie, reconciliation; proxy egress z trasami wg [D7.4](decyzje.md) | 14 | Sandbox Controller |
| Obraz `dsh-runner` przypięty po digest z profilem `helmflow-standard` i pluginami (kontekst, eksport zdarzeń, Change Rationale, Handoff); SBOM i skan podatności | 15 | komponent wykonawczy |
| Orkiestracja: SDLC Run → Stage Runs → Agent Runs; handshake gotowości; timeout startu; poświadczenie LiteLLM per uruchomienie, unieważniane po zakończeniu | 16 | Engine |
| Stop / cancel / resume: resume tylko tego samego Agent Run (nowy Execution Attempt), zgodność wersji obrazu, odzysk po restarcie każdej usługi, wykrywanie sesji osieroconych | 18 | Engine |
| Stan Blocked z pytaniem do człowieka i wznowieniem ([D6.2](decyzje.md)) | 13, 18 | Engine + CLI |
| Budżety tokenów/kosztu per SDLC Run i Agent Run, egzekwowane i widoczne ([D6.1](decyzje.md)) | 13, 16 | Engine + CLI |
| Kontrakt Managed Environments w SDK i pojęcie domenowe (implementacja Environment Controllera poza MVP, [D8.3](decyzje.md)) | 7 | SDK |

## 5. Traceability

| Funkcja | Krok | Produkt |
|---|---|---|
| Workspace Tracker: File Change Events, File Versions, manifest hashy, skan po zdarzeniach + okresowy + debounce, końcowa rekonsyliacja jako źródło prawdy ([D6.5](decyzje.md)); odporność na manipulację `.git`; pliki untracked, binarne, rename, usunięcia | 19 | Engine |
| Change Sets z jawnym uzasadnieniem (Change Rationale), powiązane z trajectory, diffem i wersjami plików; status zmiany | 20 | Engine |
| Checkpointy automatyczne (start, etap logiczny, po testach, koniec) i ręczne; porównanie checkpointów | 20 | Engine + CLI |
| Cztery perspektywy diffu: per Agent Run, per Stage Run, per plik (File Timeline), Global Project Diff; atrybucja zgodnie z [D2](decyzje.md) | 19 | Engine + CLI |
| Ingest trajectory: idempotentny, odporny na duplikaty i zmianę kolejności, z redakcją sekretów; trasa uwierzytelniona poświadczeniem per Agent Run; timeline SDLC Run + osobne trajectory agentów; odnośnik do źródłowego JSONL | 17 | Engine + CLI |

## 6. Review i integracja

| Funkcja | Krok | Produkt |
|---|---|---|
| Stage Deliverables (bramki opcjonalne) i Project Deliverable (bramka obowiązkowa) | 21 | Engine |
| Komentarze do całości, Change Setu i fragmentu diffu; decyzje Approve / Request Changes / Reject z uzasadnieniem; zapis osoby, czasu i podstawy | 23 | Engine + CLI |
| Request Changes zawsze kieruje flow do wskazanego etapu jako nowy Stage Run z nowym Agent Run; resume dotyczy wyłącznie Agent Run przerwanego przed zgłoszeniem Deliverable (niezmienniki 8 i 12); uwagi review jako jawny kontekst | 23 | Engine |
| Integracja: eksport patcha lub kontrolowany commit/branch/PR; push (jeśli włączony) przez krótkotrwałe uprawnienie, bez bezpośredniej zmiany gałęzi głównej | 23 | Engine |

## 7. Interfejsy

| Funkcja | Krok | Produkt |
|---|---|---|
| **Helmflow CLI (tryb komendowy + TUI, [D8.2](decyzje.md))**: okna i zakładki, podgląd pracy agentów na żywo, przeglądanie prac i rezultatów, zlecanie zadań, review; działa bez backendu | 8, 22 | CLI |
| **Web (docelowy interfejs domyślny; realizacja odroczona po TUI, [D9.3](decyzje.md))**: pełen zestaw widoków, widok artefaktów analitycznych obok diffów, live przez SSE | po MVP | Platform |
| **Kontrakt silnika**: operacje asynchroniczne, streaming zdarzeń, cancel, resume; jedyne programistyczne wejście interfejsów; test headless pełnego przepływu jest częścią odbioru | 7 | Engine |
| Uwierzytelnienie hostowanego API ([D6.3](decyzje.md)) | 7 | Platform (backend) |

## 8. Operacje i obserwowalność

| Funkcja | Krok | Produkt |
|---|---|---|
| Strukturalne logi z identyfikatorami (Project Space, Work Item, SDLC Run, Stage Run, Agent Run, sandbox); metryki; rozdzielone klasy błędów; healthchecki; redakcja sekretów; retencja | 9 | Engine |
| Instalacja: wersjonowany Docker Compose, migracje, pierwsze uruchomienie, backup/restore, runbooki, release notes z wersją DSH | 24 | Platform |
