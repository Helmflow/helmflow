# Eksperyment: budowa harness/harness przez agenta (LiteLLM + MiniMax-M3)

Eksperyment fazy 1 planu ([docs/plan-mvp.md](../../docs/plan-mvp.md), krok 4): walidacja rzeczywistej — nie deklarowanej — współpracy modelu MiniMax-M3 z bramą LiteLLM na realnym zadaniu wykonawczym: **zbudowanie i uruchomienie projektu [Harness Open Source](https://github.com/harness/harness) w Dockerze**, lokalnie, bez zakładania jakichkolwiek kont (wykorzystany istniejący klucz MiniMax; aplikacja weryfikowana bez rejestracji).

## Czego dowodzi

- LiteLLM jako brama do MiniMax-M3: odpowiedzi, tool calling z wieloma kolejnymi wywołaniami, usage, obsługa bloków `<think>` modelu rozumującego,
- zdolność modelu do prowadzenia wieloetapowego zadania narzędziowego (klonowanie, analiza Dockerfile, długa budowa, uruchomienie, weryfikacja HTTP),
- append-only trajectory (JSONL) jako zapis przebiegu — prototyp formatu z [docs/model-domeny.md](../../docs/model-domeny.md).

## Czego NIE dowodzi i czym NIE jest

To **nie jest kod produktu**: pętla agenta w produkcie należy do DSH ([D5.1](../../docs/decyzje.md)), a wykonanie odbywa się w sandboxie bez dostępu do hosta. Tutaj polecenia agenta biegną na hoście w katalogu `praca/` — świadome odstępstwo na potrzeby eksperymentu, niedopuszczalne w produkcie.

## Układ

| Plik | Rola |
|---|---|
| `docker-compose.yml` | LiteLLM (port 127.0.0.1:4000) |
| `litellm.config.yaml` | alias `helmflow-default` → `MiniMax-M3` przez endpoint zgodny z OpenAI |
| `agent.py` | minimalna pętla narzędziowa: `run_shell` + `finish`, trajectory JSONL, licznik tokenów |
| `zadanie.md` | treść zadania dla agenta |
| `.env` (poza repo) | `MINIMAX_API_KEY`, `LITELLM_MASTER_KEY` |
| `praca/` (poza repo) | katalog roboczy agenta: klon harness, `trajectory.jsonl`, `agent.log` |
| `WYNIKI.md` | wynik przebiegu |

## Uruchomienie

```bash
cp .env.example .env   # uzupełnij MINIMAX_API_KEY; LITELLM_MASTER_KEY dowolny lokalny
docker compose up -d
export $(grep LITELLM_MASTER_KEY .env)
python3 agent.py --task-file zadanie.md --workdir praca --trajectory praca/trajectory.jsonl
```

Wymagania: Docker z uruchomionym demonem, Python 3.12+ z pakietem `openai`.
