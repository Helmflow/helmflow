# Helmflow SDK

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Produkt 1 — fundament warstw ([D3](decyzje.md)): jednolity model danych i kontrakty części składowych, jako czysta, publikowalna samodzielnie biblioteka Pythona (`packages/sdk`, docelowo PyPI). Zewnętrzny konsument może implementować jej kontrakty bez pozostałych warstw. **SDK nie jest klientem HTTP i nie wolno go tak implementować** — konsumenci używają go przez import, nigdy przez sieć.

## 1. Zawartość

- **model danych** — niemutowalne klasy pojęć domenowych z typowanymi identyfikatorami; pełna specyfikacja: [model-danych](model-danych.md),
- **kontrakty części składowych** — interfejsy wymienione w rozdziale 3,
- **schematy wymiany** — Handoff Package, Change Rationale, Knowledge Manifest, manifest uruchomienia (generowane z klas, nie pisane ręcznie),
- **niezmienniki jednoobiektowe** — egzekwowane w konstruktorach i walidatorach modeli.

SDK nie zawiera implementacji, operacji wejścia/wyjścia ani logiki procesowej.

## 2. Zależności

- **runtime:** Python 3.12+, Pydantic v2 (model danych, walidacja, generowanie JSON Schema) oraz biblioteka standardowa — nic więcej;
- **zero zależności technicznych:** DSH, Docker SDK, SQLAlchemy, FastAPI, httpx i klient LiteLLM żyją wyłącznie w silniku jako implementacje kontraktów (reguła nienaruszalna: [technologia](technologia.md));
- **test kit** kontraktów jest dystrybuowany razem z SDK jako opcjonalny dodatek (`helmflow-sdk[testkit]`, zależność: pytest) — każda implementacja kontraktu, także zewnętrzna, weryfikuje się tym samym zestawem ([D9.2](decyzje.md));
- narzędzia deweloperskie (mypy, ruff) nie są zależnościami pakietu.

## 3. Kontrakty części składowych — szkic sygnatur

Pseudokod interfejsów (typy z [model-danych](model-danych.md)); sygnatury są punktem wyjścia dla ADR kroku 6, nie ostatecznym API. Wszystkie operacje asynchroniczne.

```python
class AgentRuntime(Protocol):
    """Runtime agenta (implementacja MVP: runtime-dsh)."""
    async def start(spec: RunStartSpec) -> AttemptHandle          # workspace, home, manifest, poświadczenia
    async def resume(attempt: ExecutionAttempt, spec: RunStartSpec) -> AttemptHandle
    async def cancel(handle: AttemptHandle, graceful: bool) -> None
    def events(handle: AttemptHandle) -> AsyncIterator[RuntimeEvent]   # trajectory + sygnały cyklu życia

class SandboxProvider(Protocol):
    """Cykl życia sandboxa (implementacja: klient Sandbox Controllera)."""
    async def create(policy: SandboxPolicy, mounts: MountSpec) -> SandboxId
    async def start(id: SandboxId) -> None
    async def stop(id: SandboxId, preserve_state: bool) -> None
    async def destroy(id: SandboxId) -> None
    async def inspect(id: SandboxId) -> SandboxInfo

class EnvironmentProvider(Protocol):
    """Managed Environments (implementacja po MVP — D8.3); kontrakt istnieje od MVP."""
    async def provision(spec: Mapping) -> EnvironmentId
    async def snapshot(id: EnvironmentId, label: str | None) -> SnapshotId
    async def restore(id: EnvironmentId, snapshot: SnapshotId) -> None
    async def deploy(id: EnvironmentId, version: ProjectVersionId) -> None
    async def execute(id: EnvironmentId, command: str) -> ExecutionResult
    async def destroy(id: EnvironmentId) -> None

class VersionStore(Protocol):
    """Magazyn Project Versions (implementacja: wewnętrzny bare git + manifest, D4)."""
    async def publish(project: ProjectId, tree: WorkspaceExport,
                      parent: ProjectVersionId | None,
                      produced_by: AgentRunId | None) -> ProjectVersion
    async def materialize(version: ProjectVersionId, target_dir: Path) -> None
    async def diff(base: ProjectVersionId, head: ProjectVersionId) -> ArtifactRef
    async def file_history(project: ProjectId, path: str) -> tuple[FileVersion, ...]

class ArtifactStore(Protocol):
    async def put(content: bytes | Path, media_type: str) -> ArtifactRef
    async def get(ref: ArtifactRef) -> Path

class EventStream(Protocol):
    """Zdarzenia domenowe na żywo (implementacja: PostgreSQL LISTEN/NOTIFY)."""
    async def publish(event: DomainEvent) -> None
    def subscribe(selector: EventSelector, after: EventCursor | None) -> AsyncIterator[DomainEvent]

class StateRepository(Protocol):
    """Trwały stan domenowy (implementacja: PostgreSQL); operacje per agregat + kolejka pracy."""
    async def get(...) -> Model | None
    async def save(...) -> None            # zapis idempotentny, nowa instancja zamiast mutacji
    async def enqueue(job: WorkOrder) -> None
    async def claim_next(worker: str) -> WorkOrder | None
```

## 4. Wersjonowanie kontraktów

- Kontrakt jest wersjonowany **razem ze swoim test kitem** — zmiana kontraktu bez zmiany test kitu jest niedozwolona ([D9.2](decyzje.md)).
- SemVer; do 1.0 bez gwarancji stabilności; od 1.0 zmiany łamiące wyłącznie w wersjach głównych ([produkt, rozdz. 6](produkt.md)).
- Z klas generowane są JSON Schema, a z nich typy TypeScript dla przyszłego frontendu (CI).

## 5. Reguła czystości

`packages/sdk` nie importuje DSH, Docker SDK, FastAPI, klienta LiteLLM ani żadnej innej zależności technicznej — to czysty model danych i kontrakty. Zależności produktów płyną wyłącznie w dół: platforma → silnik → SDK, nigdy odwrotnie. Budowa SDK pociąga zbudowanie wyłącznie jego lokalnych komponentów (konwencja matrioszki, [D9.4](decyzje.md)).
