# Helmflow Platform — backend i frontend Web

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Produkt 3 — platforma = backend + frontend Next.js ([D3](decyzje.md)), dostarczana jako instalacja self-hosted (Compose) wraz z workerem. Backend i frontend pozostają jednym produktem, dopóki nie pojawi się drugi konsument backendu. Pakiety `apps/api`, `apps/web`, `apps/worker`.

## 1. Backend (Engine + API) — budowany w MVP

Cienki host FastAPI osadzający silnik in-process:

- mapuje kontrakt silnika ([engine](engine.md)) na HTTP i SSE — **jedyne domenowe HTTP w systemie**; zero własnych reguł domenowych,
- uwierzytelnienie: pojedynczy użytkownik, token/sesja ([D6.3](decyzje.md)); testy bezpieczeństwa obejmują nieuwierzytelniony dostęp do API,
- strumień zdarzeń przez SSE z reconnect i wznowieniem od ostatniego znanego kursora,
- powstaje w kroku 7–8 jako fundament pod przyszły Web; żaden krok MVP nie jest blokowany przez interfejs przeglądarkowy.

## 2. Frontend (Next.js) — odroczony po TUI

**Status: realizacja odroczona ([D9.3](decyzje.md)).** Web pozostaje docelowym interfejsem domyślnym produktu, ale nie jest warunkiem ukończenia MVP (nowelizacja [D2](decyzje.md)).

Zasady wiążące przyszłego wykonawcę:

- Next.js serwuje **wyłącznie UI** — zero logiki domenowej; API routes Next.js nie są proxy do bazy ani do silnika,
- wywołania domenowe i strumień SSE idą z przeglądarki **bezpośrednio do backendu** (adres przez zmienną środowiskową),
- typy TypeScript generowane z JSON Schema modeli SDK (CI) — frontend nie definiuje własnych kształtów danych domenowych,
- zakres widoków: pełen zestaw z [cli, rozdz. 3](cli.md) plus wygody przeglądarkowe (widok artefaktów analitycznych z diagramami, bogate porównania diffów),
- parytet przypadków użycia z TUI gwarantowany wspólnym kontraktem silnika — bez lustrzanego kopiowania ekranów.

Warunki podjęcia prac: ukończone TUI (krok 22), decyzja właściciela w ramach roadmapy ([produkt, rozdz. 10](produkt.md)).

## 3. Worker

Osobny proces osadzający silnik; właściciel wykonania długotrwałych operacji (orkiestracja Agent Runs). Restart workera nie gubi zleconej pracy ani nie powoduje podwójnego wykonania (trwała kolejka w PostgreSQL, [D3](decyzje.md)).

## 4. Instalacja

Wersjonowany Docker Compose: backend, worker, PostgreSQL, LiteLLM, Sandbox Controller, proxy egress; migracje i procedura pierwszego uruchomienia; backup/restore obejmujący spójny punkt trzech magazynów stanu ([produkt, rozdz. 6](produkt.md)); szczegóły w kroku 24 planu ([plan-mvp](plan-mvp.md)).
