# Helmflow — technologia

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Rekomendacja startowa stosu; formalne przypięcie wersji następuje w kroku 6 planu. Zasady budowy modeli danych: [model-danych](model-danych.md).

## 1. Stos

| Warstwa | Wybór |
|---|---|
| SDK i silnik | Python 3.12; SDK = jednolity model danych i kontrakty, silnik = SDK + implementacje ([D3](decyzje.md)) |
| Host Web (backend) | FastAPI — cienki proces osadzający silnik |
| CLI | Python, tryb komendowy + TUI ([D8.2](decyzje.md)) |
| Frontend | Next.js (React + TypeScript) — serwuje wyłącznie UI, zero logiki domenowej; realizacja odroczona po TUI ([D9.3](decyzje.md)) |
| Stan domenowy | PostgreSQL (+ `LISTEN/NOTIFY` dla zdarzeń na żywo); abstrakcja trwałości nie zamyka przyszłego trybu plikowego |
| Artefakty / logi / patche | storage obiektowy zgodny z S3 albo lokalny — za jedną abstrakcją |
| Wersje projektu | wewnętrzne bare git per Project Space + manifest ([D4](decyzje.md)) |
| Runtime agenta | `deepseek-harness-sdk`, wersja przypięta; pluginy przez Cordis — natywny mechanizm rozszerzeń DSH |
| Brama modelowa | LiteLLM → MiniMax |
| Sandbox | rootless Docker / Podman; kierunek po MVP: gVisor / microVM |
| Instalacja / dev | Docker Compose |
| Jakość | pytest, testy kontraktowe, integracyjne i e2e; testy frontendowe po podjęciu prac nad Web ([D9.3](decyzje.md)); lint, typy, skan sekretów i zależności |

Ograniczenia obowiązujące do odwołania: **bez Redis, bez Kubernetes, bez osobnej platformy workflow** — dopóki konkretna potrzeba nie zostanie udowodniona.

## 2. Kształt monorepo — jedno repozytorium, kilka produktów

Monorepo jest podzielone według granic produktów z [D3](decyzje.md). Każdy produkt ma własny `pyproject` (lub `package.json`), własne wersjonowanie i może być publikowany niezależnie (SDK docelowo na PyPI); CI, standardy i ADR-y są wspólne.

```text
helmflow/
├── packages/
│   ├── sdk/                   # PRODUKT 1: Helmflow SDK — jednolity model danych i kontrakty części składowych
│   ├── engine/                # PRODUKT 2: Helmflow Engine = SDK + implementacje kontraktów, przypadki użycia, orkiestracja, stan
│   └── runtime-dsh/           # składnik silnika: implementacja kontraktu runtime'u na DSH, bez pojęć produktu
├── apps/
│   ├── api/                   # PRODUKT 3: Helmflow Platform — backend (Engine + API, FastAPI)
│   ├── web/                   # PRODUKT 3: Helmflow Platform — frontend Next.js (wyłącznie UI)
│   ├── worker/                # platforma: orkiestracja długich operacji (osadza silnik)
│   └── cli/                   # PRODUKT 4: Helmflow CLI — osadza Engine lokalnie, działa bez backendu
├── services/
│   └── sandbox-controller/    # składnik silnika: jedyny właściciel mechanizmu kontenerowego
├── plugins/
│   └── dsh-helmflow/          # pluginy i profil DSH (helmflow-standard)
├── images/
│   └── dsh-runner/            # przypięty obraz Agent Run
├── infra/
│   └── compose/               # instalacja self-hosted platformy
├── tests/
│   ├── integration/
│   ├── contract/
│   └── e2e/
└── docs/
    ├── adr/                   # w tym decyzje D1–D9 jako ADR-y 0001–0009
    └── runbooks/
```

Reguła nienaruszalna: `packages/sdk` nie importuje DSH, Docker SDK, FastAPI, klienta LiteLLM ani żadnej innej zależności technicznej — to czysty model danych i kontrakty. Zależności produktów płyną wyłącznie w dół: platforma → silnik → SDK, nigdy odwrotnie.

## 3. Konwencja budowy: matrioszka ([D9.4](decyzje.md))

Repozytorium obowiązuje zagnieżdżona konwencja budowy: zbudowanie produktu wyższej warstwy zawsze pociąga za sobą zbudowanie wszystkich warstw niższych — **z lokalnych źródeł tego samego monorepo** (pakiety workspace uv, zależności ścieżkowe; odpowiednik submodułów bez mechaniki git submodules), nigdy z opublikowanych paczek.

Łańcuchy budowy:

- **platforma (frontend)** → pociąga backend,
- **backend** → pociąga silnik + warstwę API,
- **CLI** → pociąga silnik (bez backendu, zgodnie z [D3](decyzje.md)),
- **silnik** → pociąga SDK oraz lokalne wersje swoich komponentów bazowych (implementacje kontraktów: `runtime-dsh`, klient Sandbox Controllera, magazyn wersji, storage),
- **SDK** → pociąga zbudowanie własnych lokalnych komponentów bazowych.

Zasady:

1. Build każdej warstwy jest wywoływalny jednym poleceniem i rekurencyjnie buduje warstwy niższe.
2. Testy analogicznie: uruchomienie testów warstwy uruchamia najpierw test kity warstw niższych, od SDK w górę ([D9.1](decyzje.md)).
3. Paczki publikowane (PyPI) są wyłącznie artefaktem wydania — wewnątrz monorepo żaden produkt nigdy nie zależy od opublikowanej wersji innego produktu Helmflow.
4. CI buduje matrioszkę od środka: SDK → silnik → backend i CLI → platforma; niepowodzenie budowy lub testów warstwy niższej zatrzymuje budowę warstw wyższych.

## 4. Proponowane konkretne zależności (do zatwierdzenia jako ADR w kroku 6)

| Obszar | Propozycja | Rola |
|---|---|---|
| Współbieżność | `asyncio` (stdlib) | operacje async kontraktu silnika: streaming, cancel, resume |
| Modele i walidacja | Pydantic v2 | model danych SDK, walidowane schematy (Handoff Package, Change Rationale, manifesty) |
| Dostęp do bazy | SQLAlchemy 2 (async) + Alembic + psycopg 3 | stan domenowy, migracje, `LISTEN/NOTIFY` |
| Git wewnętrzny ([D4](decyzje.md)) | `git` plumbing przez subprocess; pygit2 w razie potwierdzonych potrzeb wydajnościowych | bare-repozytoria Project Versions, diffy, historia plików |
| Storage artefaktów | lokalny filesystem za abstrakcją; sterownik S3 (MinIO/boto3) jako druga implementacja | logi, patche, artefakty wielkogabarytowe |
| HTTP wychodzący | httpx | administracja LiteLLM (poświadczenia per uruchomienie), API repozytoriów |
| Sandbox Controller | podman-py / Docker SDK for Python (przez socket dostępny tylko temu procesowi) | cykl życia kontenerów |
| Host Web | FastAPI + uvicorn; SSE przez sse-starlette | jedyny proces domenowego HTTP; cienka warstwa nad kontraktem silnika |
| Frontend | Next.js (React + TypeScript); TanStack Query; `EventSource` dla SSE | GUI (odroczony, [D9.3](decyzje.md)); API routes Next.js nie zawierają logiki domenowej — całość domeny idzie do hosta FastAPI |
| CLI | Typer + Rich + Textual | tryb komendowy i TUI w zakresie MVP ([D8.2](decyzje.md), [D9.3](decyzje.md)); interfejs nad kontraktem silnika |
| Pakiety i monorepo | uv (workspace) | zależności i środowiska wszystkich pakietów Pythona |
| Jakość | pytest + pytest-asyncio, ruff (lint + format), mypy, gitleaks, pip-audit | bramki CI |
