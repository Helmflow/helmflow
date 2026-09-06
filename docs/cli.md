# Helmflow CLI

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Produkt 4 — pierwszy interfejs użytkownika ([D9.3](decyzje.md)): **tryb komendowy + TUI** (Textual, [D8.2](decyzje.md)). Osadza Engine in-process i działa bez backendu; realizuje te same przypadki użycia co platforma, bez osobnej logiki biznesowej. Pakiet `apps/cli`.

## 1. Dwa tryby

- **Tryb komendowy** — skryptowalne polecenia (`helmflow run ...`, `helmflow review ...`) nad kontraktem silnika; podstawa automatyzacji i testu headless.
- **TUI** — pełnoekranowy interfejs z oknami i zakładkami: podgląd pracy agentów na żywo, przeglądanie prac i rezultatów, zlecanie zadań, review.

Parytet z Web jest definiowany na poziomie przypadków użycia — gwarantowany wspólnym kontraktem Engine — nie na poziomie lustrzanych ekranów.

## 2. Zachowanie operacyjne

- Wykonanie zawsze należy do workera — TUI jest obserwatorem i zleceniodawcą; **zamknięcie TUI nie przerywa aktywnych Agent Runs**.
- Powiadomienie o stanie Blocked jest widoczne w TUI, także przy jego następnym otwarciu ([D6.2](decyzje.md)).
- Granicą ochrony CLI jest dostęp do bazy i plików instalacji, nie osobne logowanie ([D6.3](decyzje.md)).
- Strumień zdarzeń wznawia od ostatniego znanego kursora — zerwanie i odtworzenie połączenia nie gubi ani nie duplikuje zdarzeń (bramka kroku 8).

## 3. Szkic układu widoków TUI

Docelowy zestaw (krok 22 planu); MVP-0 zawiera wyłącznie widoki Run i Review ([plan-mvp](plan-mvp.md)).

| Widok (zakładka) | Zawartość |
|---|---|
| **Projects** | Project Space: repozytorium, wersje projektu, historia SDLC Runs |
| **Work Items** | lista z kryteriami i stanem; tworzenie; wybór flow i przydział agentów do etapów |
| **Runs** | lista SDLC Runs; pipeline etapów z bieżącym stanem, licznikiem powrotów i zużyciem budżetu |
| **Run → Agent Run** | trajectory na żywo (plan, komunikaty, narzędzia, polecenia, wyniki, błędy), kontrole: stop / cancel / resume, odpowiedź na Blocked |
| **Changed Files** | zmiany per Agent Run z filtrami; przełączniki diffu: per agent / per etap / per plik (File Timeline) / globalny |
| **Change Sets** | timeline z uzasadnieniami (Change Rationale), statusy zmian, powiązania z trajectory i dowodami |
| **Checkpoints** | lista i porównanie wybranych stanów |
| **Review** | Stage/Project Deliverable: diff, mapa kryteria→dowody (z rozróżnieniem dowód platformy / deklaracja agenta), ryzyka, handoffy; decyzje Approve / Request Changes / Reject z uzasadnieniem; widok artefaktów analitycznych |
| **Agents** | wersje agentów, diff wersji, fork projektowy; katalog globalny i promocje (od kroku 21a) |
| **Knowledge** | paczki, wersje, przypisania, podgląd manifestu |

Zasady wspólne: w każdym widoku wersje agenta/wiedzy/modelu/DSH/obrazu sandboxa; operacje destrukcyjne wymagają potwierdzenia i pokazują dokładny cel; czytelne stany błędu, zatrzymania, resume i utraty połączenia; budżety widoczne ([D6.1](decyzje.md)).

## 4. Technologia

Typer (tryb komendowy) + Textual (TUI) + Rich (formatowanie); szczegóły stosu: [technologia](technologia.md). Budowa CLI pociąga zbudowanie Engine z lokalnych źródeł (konwencja matrioszki, [D9.4](decyzje.md)).
