# Dokumentacja produktowa Helmflow

**Wersja zestawu:** 0.9 (2026-09-06). Zestaw jest samodzielnym źródłem prawdy projektu; przy konflikcie [decyzje](decyzje.md) mają pierwszeństwo, a między decyzjami wygrywa wyższy numer.

## Mapa dokumentów

| Dokument | Treść |
|---|---|
| [produkt](produkt.md) | czym jest Helmflow, problem, grupa docelowa, pozycjonowanie, prywatność, licencja, NFR, wersjonowanie, zależności zewnętrzne, mierniki, otwarte kwestie, roadmapa |
| [decyzje](decyzje.md) | wiążące decyzje D1–D9 z nowelizacjami i regułą pierwszeństwa |
| [model-domeny](model-domeny.md) | pojęcia biznesowe, relacje, 30 niezmienników, przykład przebiegu |
| [model-danych](model-danych.md) | zasady budowy modeli i specyfikacja startowa klas SDK; mapowanie encji na magazyny |
| [funkcje](funkcje.md) | zakres funkcjonalny MVP z mapowaniem na kroki planu i produkty |
| [przeplywy](przeplywy.md) | aktorzy i siedem diagramów przepływów użytkownika |
| [architektura](architektura.md) | warstwy, odpowiedzialności komponentów, granice zaufania, pochodzenie funkcji (DSH / Helmflow / inne) |
| [sdk](sdk.md) | produkt 1: zawartość, zależności, szkic sygnatur kontraktów, wersjonowanie |
| [engine](engine.md) | produkt 2: logika biznesowa, kontrakt silnika, koordynacja procesów, implementacje kontraktów |
| [cli](cli.md) | produkt 4: tryb komendowy + TUI, widoki, zachowanie operacyjne |
| [platforma-web](platforma-web.md) | produkt 3: backend (w MVP) i frontend Next.js (odroczony po TUI) |
| [technologia](technologia.md) | stos, kształt monorepo, konwencja matrioszki, konkretne zależności |
| [plan-mvp](plan-mvp.md) | scenariusz odbioru, fazy i 24+1 kroków z pełnymi listami prac, MVP-0, bramy, ryzyka, definicja ukończenia |
| [instrukcja-agenta](instrukcja-agenta.md) | zasady pracy agenta implementującego i ścieżka czytania |
| `archive/` | dokumenty historyczne: monolit 0.8 (źródło tego podziału) i koncepcje HarnessPlatform |

## Kolejność czytania

- **Nowa osoba:** [produkt](produkt.md) → [model-domeny](model-domeny.md) → [przeplywy](przeplywy.md) → [architektura](architektura.md) → reszta według potrzeb.
- **Agent implementujący:** [instrukcja-agenta](instrukcja-agenta.md) (definiuje pełną ścieżkę: decyzje → model domeny → model danych → architektura → plan).

## Rejestr zmian

| Wersja | Data | Zakres zmian |
|---|---|---|
| 0.1 | 2026-09-03 | Synteza koncepcji produktu; decyzje D1–D6; model domeny; plan 24 kroków |
| 0.2 | 2026-09-04 | Decyzje D7–D9; architektura warstw; przepływy użytkownika; przegląd tonu |
| 0.3 | 2026-09-04 | Wymiary produktowe (problem, dane i prywatność, licencja, NFR, wersjonowanie, zależności, mierniki, otwarte kwestie); pełna lista niezmienników; dokument samodzielny |
| 0.4 | 2026-09-04 | Licencja AGPL-3.0-only dla wszystkich produktów (w tym SDK); roadmapa po MVP z Environment Controllerem jako pierwszym priorytetem |
| 0.5 | 2026-09-05 | Iteracja po niezależnej recenzji: Web poza DoD MVP (nowelizacja D2) i reguła pierwszeństwa decyzji; MVP-0 z flow 1–3 etapów i protokół Gate A′; rejestry pakietów w proxy egress; Workspace Tracker w architekturze; definicje Change Rationale i Reviewer Agent; kontekst DSH; semantyka Request Changes; stop-loss faz |
| 0.6 | 2026-09-05 | Specyfikacja startowa modeli danych SDK; niezmiennik 30; rozstrzygnięcia z modelowania |
| 0.7 | 2026-09-05 | Konwencja budowy matrioszki (D9.4) |
| 0.8 | 2026-09-06 | Zależności Helmflow SDK i mapa pochodzenia funkcji (DSH / Helmflow / pozostałe); lista funkcji niedelegowanych do DSH |
| 0.9 | 2026-09-06 | Podział monolitu na zestaw dokumentów tematycznych; uszczegółowienia: pozycjonowanie, przykład przebiegu na pojęciach, mapowanie encji na magazyny, mapowanie funkcji na kroki i produkty, szkic sygnatur kontraktów SDK, katalog operacji kontraktu silnika, szkic widoków TUI, granice zaufania, pełne listy prac per krok planu |
