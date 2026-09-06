# Eksperyment: AI-generowane UI nad silnikiem (OpenUI + MiniMax)

Sprawdza tezę: **UI Helmflow może być zestawem kompozycji generowanych przez AI z jednego katalogu komponentów** — część widoków predefiniowana i karmiona danymi z silnika, część składana na żądanie w czasie działania.

Wykorzystuje [OpenUI](https://github.com/thesysdev/openui) (MIT) — otwarty standard generative UI, w którym model **komponuje zarejestrowane komponenty, nigdy nie wykonuje kodu**, a renderer waliduje propsy wobec schematów Zod. Model: MiniMax-M3 przez LiteLLM (ta sama brama co w [harness-build](../harness-build/README.md)).

Wyniki i ocena: [WYNIKI.md](WYNIKI.md).

## Trzy widoki w aplikacji

| Zakładka | Tryb | Skąd dane |
|---|---|---|
| **Repozytoria** | predefiniowany | API Forgejo (repozytoria, commity) — udaje/zastępuje widok Forgejo |
| **Praca agenta** | predefiniowany | `trajectory.jsonl` z eksperymentu Forgejo — widok, którego Forgejo nie ma |
| **Wygeneruj widok** | ad-hoc | model komponuje z tego samego katalogu na podstawie promptu i danych |

## Układ

| Plik | Rola |
|---|---|
| `src/components.tsx` | katalog 9 komponentów (`defineComponent` + Zod): Root, Section, Row, StatTile, RepoCard, DataTable, TimelineEvent, StatusBadge, Text |
| `src/views.ts` | widoki predefiniowane — funkcje budujące OpenUI Lang z danych silnika |
| `src/App.tsx` | zakładki, pobieranie danych, `<Renderer>`, podgląd źródła Lang |
| `server.mjs` | proxy danych (Forgejo, trajectory) + brama do modelu; sekrety wyłącznie po stronie serwera |
| `src/test-adhoc.ts` | test: walidacja obu trybów parserem OpenUI (kontrakty propsów, referencje) |

## Uruchomienie

Wymaga działającego Forgejo ([../forgejo](../forgejo/README.md)) i LiteLLM ([../harness-build](../harness-build/README.md)).

```bash
npm install
export OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1   # zero telemetrii (patrz WYNIKI)
node server.mjs &                                    # backend na 127.0.0.1:8787
npx vite                                             # UI na 127.0.0.1:5173
```

Test bez przeglądarki:

```bash
npx vite build --ssr src/test-adhoc.ts --outDir dist-test && node dist-test/test-adhoc.js
```
