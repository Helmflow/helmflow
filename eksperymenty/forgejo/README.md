# Eksperyment: Forgejo jako lokalna platforma kodu dla Helmflow

Lokalny Forgejo (v13, kontener, port 127.0.0.1:3000) uruchamiany bez ekranu rejestracji: instalacja zamknięta konfiguracją środowiskową (`INSTALL_LOCK`), rejestracja wyłączona, jedyne konto (`helmflow`) i token tworzone przez CLI w `setup.sh`. Zero telemetrii (wyłączony update checker). Agent (MiniMax-M3 przez LiteLLM z eksperymentu [harness-build](../harness-build/README.md)) tworzy repozytorium **przez API Forgejo** i zasila je projektem z testami — dowód, że pełny cykl „utwórz → sklonuj → zbuduj → wypchnij → zweryfikuj" działa na tej platformie bez człowieka.

## Potencjał względem planu MVP

| Zastosowanie | Gdzie w planie |
|---|---|
| **Pierwsza integracja `Repository`** — czyste REST API + tokeny + webhooki; kandydat na implementację rejestracji repozytorium i eksportu patcha/PR | [plan-mvp, krok 10 i 23](../../docs/plan-mvp.md) |
| **Stały serwis testowy** — lekki (jeden kontener, SQLite), deterministyczny start bez rejestracji; idealny fixture dla testów integracyjnych i e2e zamiast zależności od GitHuba | [plan-mvp, krok 24 / strategia testów](../../docs/plan-mvp.md) |
| **Repozytorium demonstracyjne przepływu zrozumienia** — duży, obcy, realny codebase (Go) do „rozpracuj mi ten program" | [przeplywy, rozdz. 7](../../docs/przeplywy.md) |
| **Hosting dogfoodingu** — Work Items rozwoju Helmflow mogą żyć w lokalnym Forgejo jako `Repository` Project Space | [D7.2](../../docs/decyzje.md) |
| **Forgejo Actions jako źródło Verification Evidence** — CI platformy jako niezależny dowód po integracji (kierunek po MVP) | [produkt, rozdz. 10](../../docs/produkt.md) |
| Zbieżność filozofii: GPL, governance non-profit (Codeberg e.V.), grupa docelowa = programiści open source | [produkt, rozdz. 1](../../docs/produkt.md) |

## Układ

| Plik | Rola |
|---|---|
| `docker-compose.yml` | Forgejo 13 (port 127.0.0.1:3000), konfiguracja w pełni z env |
| `setup.sh` | start + admin `helmflow` + token przez CLI → `.env` |
| `zadanie.md` | zadanie agenta: repo przez API + projekt z testami + push |
| `.env` (poza repo) | `FORGEJO_TOKEN` |
| `praca/` (poza repo) | katalog roboczy agenta, trajectory, log |
| `WYNIKI.md` | wynik przebiegu |

## Uruchomienie

```bash
./setup.sh                      # Forgejo + admin + token
export $(grep LITELLM_MASTER_KEY ../harness-build/.env | xargs)
export $(grep FORGEJO_TOKEN .env | xargs)
python3 ../harness-build/agent.py --task-file zadanie.md --workdir praca --trajectory praca/trajectory.jsonl
```

Wymagany działający LiteLLM z eksperymentu harness-build (`docker compose up -d` w tamtym katalogu).
