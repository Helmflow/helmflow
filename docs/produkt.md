# Helmflow — produkt

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

## 1. Czym jest Helmflow

Helmflow jest przede wszystkim **SDK** — biblioteką udostępniającą funkcje DSH i pozostałych zależności w ramach jednolitego modelu danych i API. Na SDK zbudowany jest **silnik** prowadzenia pełnego procesu SDLC przez sekwencję niezależnych agentów programistycznych, a na silniku **platforma** (backend + frontend Next.js). Self-hosting jest sposobem dostarczenia platformy, nie istotą produktu.

> **Helmflow prowadzi projekt przez kolejne etapy SDLC wykonywane przez niezależnych agentów, zachowując pełną historię ich działań, zmian plików, przekazań pracy i decyzji człowieka.**

Helmflow obsługuje dwa równorzędne przypadki użycia na tym samym silniku i modelu domeny:

1. **Wytwarzanie** — dodawanie i zmiana funkcji oprogramowania przez sekwencję agentów (analiza → architektura → implementacja → testy → review).
2. **Rozumienie** — rozpracowanie programu, którego zespół nie zna: rekonstrukcja modelu domeny, modelu danych, kontraktów i architektury wraz z rejestrem problemów, w formie artefaktów z dowodami ([przeplywy, rozdz. 7](przeplywy.md)). Zatwierdzone artefakty zrozumienia stają się wiedzą repozytorium i zasilają kolejne przepływy wytwarzania.

Oba przypadki mogą korzystać z Managed Environments — izolowanych, prawdziwych środowisk (maszyn wirtualnych z zainstalowanymi platformami), wykorzystywanych przez agentów w granicach projektu (kontrakt w MVP, implementacja po MVP — [D8.3](decyzje.md)).

### Problem

Programista pracujący z agentami kodującymi:

- traci kontakt z własną bazą kodu — przestaje wiedzieć, co i dlaczego się zmieniło,
- obserwuje spadek jakości: funkcje przestają działać, narastają błędy,
- nie jest w stanie osobiście pilnować wdrażania prostych funkcji, testów i architektury — a bez niego nikt tego nie pilnuje.

Helmflow istnieje po to, aby właściciel projektu mógł **rozdzielić swoje umiejętności między agentów w SDLC** — utrwalić swoją wiedzę w wersjonowanych agentach i paczkach wiedzy — oraz **czytelnie obserwować zmiany, wersje i różnice**, zachowując kontrolę bez ręcznego nadzoru nad każdym krokiem.

### Grupa docelowa

Programiści open source, którzy chcą zautomatyzować własny SDLC i zachować nad nim kontrolę. Pierwszym użytkownikiem i punktem odniesienia produktu jest właściciel projektu (rozdział 7); MVP jest budowane i mierzone dla tego jednego użytkownika, a poszerzenie na grupę docelową wymaga walidacji po MVP.

### Filary produktu

1. **Agent nie należy do projektu** — istnieje Global Agent Catalog; projekty forkują wersje globalne do wersji projektowych i mogą je w kontrolowany sposób promować z powrotem.
2. **Pełny SDLC, nie pojedyncze zadanie** — praca płynie przez zdefiniowany flow etapów, a każdy etap wykonuje osobny agent w osobnym sandboxie.
3. **Przekazanie pracy tylko przez Project Space** — agenci nie współdzielą środowisk; między etapami przepływa wyłącznie niezmienna Project Version + Handoff Package.
4. **Cztery niezależne źródła historii** — trajectory agenta, historia plików, historia wersji projektu i historia decyzji człowieka; żadne nie udaje pozostałych.
5. **Człowiek zachowuje kontrolę** — agent nie zatwierdza własnej pracy; Approved ≠ Integrated.
6. **Warstwy produktu: Helmflow SDK → Engine → Platform** — platforma (Next.js + backend), CLI i aplikacje użytkownika korzystają z tego samego silnika zbudowanego na SDK ([D3](decyzje.md)).

**Platforma** oznacza warstwę aplikacyjną produktu: backend + frontend Next.js, dostarczane razem jako instalacja self-hosted. Skala wykonania (wiele projektów, agentów, sandboxów, użytkowników) jest własnością silnika — zmiana skali nie zmienia modelu domenowego.

## 2. Pozycjonowanie względem alternatyw

- **Jeden mocny agent (Claude Code, Codex i podobne).** Najlepszy do interaktywnej pracy z człowiekiem przy klawiaturze. Nie rozwiązuje problemu, dla którego istnieje Helmflow: nie utrwala wiedzy właściciela w wersjonowanych rolach, nie daje niezależnej od agenta historii zmian, nie prowadzi wieloetapowego procesu z bramkami i nie odpowiada na pytanie „kto, co i dlaczego zmienił" po tygodniu pracy wielu sesji. Gate A′ w planie jawnie porównuje Helmflow z tym punktem odniesienia.
- **Dify (langgenius/dify).** Platforma workflow dla aplikacji LLM (RAG, chatboty, agenci function-calling z narzędziami). Inny rodzaj agenta: nie utrzymuje workspace'u plikowego, sesji kodowania z resume ani śledzenia zmian repozytorium. Architektonicznie jest wdrażaną usługą (API + Celery + Redis + własny frontend), nie osadzalną biblioteką — sprzeczne z [D3](decyzje.md). Dobra inspiracja UX dla wizualnej edycji flow.
- **Polygraph.** Meta-harness nad istniejącymi agentami: widoczność cross-repo, pamięć sesji, handoff. Najbliższy duchowo; nie prowadzi jednak zdefiniowanego SDLC z etapami, bramkami, budżetami i audytem per etap. Lekcja produktowa: cienki klin wydany wcześnie — stąd MVP-0 i dogfooding w planie.
- **Harness.io.** Enterprise'owa platforma „governed autonomy" dla SDLC — wartość jej mechanizmów nadzoru rośnie z liczbą ludzi i wymogami compliance. Helmflow bierze z tego DNA audytu i bramek, ale celuje w pojedynczego programistę open source, nie w organizację; nadzór ma służyć właścicielowi, nie procedurze.

## 3. Dane i prywatność

- Kontekst zadań (fragmenty kodu, instrukcje, wiedza) jest wysyłany do dostawcy modelu — obecnie MiniMax — przez LiteLLM. LiteLLM pełni rolę warstwy wymienności: zmiana dostawcy modelu nie zmienia produktu ([D5.2](decyzje.md)).
- Decyzja właściciela (2026-09-04): prywatność danych wysyłanych do modelu **nie jest obecnie wymaganiem produktu**; priorytet może wzrosnąć wraz z rozwojem grupy docelowej.
- Stan audytowy, wersje projektu i wiedza nigdy nie opuszczają instalacji. Produkt nie wysyła telemetrii.

## 4. Licencja i dystrybucja

- Licencja: **AGPL-3.0-only dla wszystkich produktów, łącznie z Helmflow SDK** — decyzja właściciela (2026-09-04). Obowiązki copyleft powstają przy dystrybucji oraz przy udostępnianiu zmodyfikowanej wersji użytkownikom przez sieć; samo wewnętrzne użycie ich nie tworzy. Świadomie akceptowany koszt: AGPL na SDK ogranicza adopcję kontraktów przez projekty komercyjne i na licencjach permissive ([rejestr ryzyk w plan-mvp](plan-mvp.md)).
- Dystrybucja: monorepo w organizacji GitHub `Helmflow`; Helmflow SDK docelowo na PyPI; wydania instalacyjne (Compose + obrazy) wraz z release notes.

## 5. Wymagania niefunkcjonalne

Decyzja właściciela (2026-09-04): wartości docelowe zostaną **ustalone eksperymentalnie** w fazie 1 i na MVP-0 — dokument definiuje, co podlega pomiarowi, i nie przesądza liczb:

- czas uruchomienia sandboxa i handshake gotowości,
- opóźnienie od zdarzenia DSH do jego prezentacji w TUI,
- liczba równoległych Agent Runs na referencyjnym hoście,
- koszt (tokeny, waluta) i czas referencyjnego SDLC Run dla przepływu wytwarzania i przepływu zrozumienia,
- narzut Workspace Trackera na wykonanie,
- przyrost przestrzeni na wersje, artefakty i logi oraz domyślna retencja.

Po pomiarach wartości zostają wpisane do dokumentacji jako wymagania wydania MVP.

## 6. Wersjonowanie i kompatybilność

- Wszystkie produkty stosują SemVer; do wydania 1.0 (MVP) wersje 0.x nie niosą gwarancji stabilności.
- Publiczne Helmflow SDK: od wersji 1.0 zmiany łamiące wyłącznie w wersjach głównych. Kontrakt SDK jest wersjonowany razem ze swoim test kitem ([D9.2](decyzje.md)) — zmiana kontraktu bez zmiany test kitu jest niedozwolona.
- Macierz zgodności: Engine deklaruje obsługiwany zakres wersji SDK; Platform i CLI deklarują obsługiwany zakres kontraktu Engine; wydanie instalacyjne przypina spójny zestaw wersji wszystkich produktów.
- Schemat bazy: migracje wyłącznie w przód (Alembic); każda wersja Engine wskazuje wymaganą rewizję schematu; powrót do starszej wersji wyłącznie przez restore z backupu.
- Backup i restore obejmują spójny punkt wszystkich trzech magazynów stanu (PostgreSQL, wewnętrzne repozytoria git, storage artefaktów); restore częściowy jest niedozwolony.
- Wersja DSH i obraz `dsh-runner` są przypięte per wydanie; ich zmiana jest kontrolowaną zmianą techniczną poprzedzoną testami kontraktowymi ([D5.1](decyzje.md)).

## 7. Zależności zewnętrzne

| Zależność | Rola | Status | Licencja | Postępowanie przy problemie |
|---|---|---|---|---|
| DeepSeek Harness + Python SDK | runtime agenta | developer preview, wersja przypięta | do potwierdzenia przy przypinaniu wersji (krok 6) | granica `runtime-dsh` + testy kontraktowe; awaryjnie wymiana runtime'u za kontraktem SDK |
| MiniMax | model domyślny | usługa zewnętrzna | komercyjna | wymiana dostawcy przez LiteLLM bez zmian produktu |
| LiteLLM | brama modelowa | aktywny OSS | MIT | wymienny za kontraktem Model Profile |
| PostgreSQL | stan domenowy | stabilny OSS | PostgreSQL License | — |
| Podman / Docker (rootless) | sandbox | stabilny OSS | Apache-2.0 | wymienny za kontraktem sandboxa |
| Pydantic, SQLAlchemy, FastAPI, Textual, Next.js | biblioteki warstw | stabilny OSS | MIT / Apache / BSD | standardowa wymiana w obrębie warstwy |

Licencje wszystkich zależności podlegają weryfikacji zgodności z licencją produktu (rozdział 4) podczas przypinania wersji w kroku 6. Pochodzenie poszczególnych funkcji produktu (DSH kontra Helmflow kontra pozostałe): [architektura](architektura.md).

## 8. Mierniki sukcesu

- **Miernik nadrzędny** (decyzja właściciela): subiektywna ocena właściciela, że jego wiedza i umiejętności zostały skutecznie zautomatyzowane w SDLC — że może powierzyć agentom pilnowanie testów, architektury i prostych wdrożeń bez utraty kontaktu z bazą kodu.
- Mierniki pomocnicze (obiektywne): wynik Gate A′; odsetek SDLC Runs zaakceptowanych bez ręcznych poprawek; czas od rejestracji nieznanego repozytorium do zatwierdzonego modelu domeny.

## 9. Otwarte kwestie

| Kwestia | Rozstrzyga | Termin |
|---|---|---|
| Wartości wymagań niefunkcjonalnych (rozdział 5) | eksperymenty fazy 1 i MVP-0 | Gate A′ |
| ADR modeli danych | agent implementujący + właściciel | krok 6 |
| Koszt atrybucji liniowej | właściciel po pomiarze | krok 19 |
| Wybór technologii proxy egress | agent implementujący | krok 14 |
| Wykonalność nienadzorowanej instalacji systemów na VM | eksperyment | przed implementacją Environment Controllera |

## 10. Roadmapa po MVP

Lista wykluczeń zakresu MVP znajduje się w [plan-mvp](plan-mvp.md); roadmapa nadaje im kolejność realizacji po wydaniu:

1. **Environment Controller** — implementacja Managed Environments ([D8.3](decyzje.md)): instalowanie prawdziwych platform na maszynach wirtualnych, przypisywanie do etapów, wykorzystanie w przepływie zrozumienia. Pierwszy priorytet po MVP — decyzja właściciela (2026-09-04).
2. Dalsze kierunki — kolejność do decyzji przy planowaniu pierwszego wydania po MVP: Web UI do parytetu z TUI ([D9.3](decyzje.md)), tryb plikowy silnika (SQLite, [D3](decyzje.md)), obsługa kolejnych harnessów za kontraktem SDK.
