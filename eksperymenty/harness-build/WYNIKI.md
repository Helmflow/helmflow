# Wyniki eksperymentu (2026-09-06)

**Status: sukces.** Agent (MiniMax-M3 przez LiteLLM, pętla `run_shell`+`finish`) samodzielnie zbudował i uruchomił Harness Open Source; działanie zweryfikowane niezależnie od deklaracji agenta.

## Metryki przebiegu

| Metryka | Wartość |
|---|---|
| Iteracje pętli (wywołania modelu) | 20 |
| Tokeny wejściowe / wyjściowe | 166 075 / 5 477 |
| Czas budowy obrazu | ~227 s |
| Obraz | `harness-eksperyment:local`, `sha256:2e1548f7…`, 361 MB |
| Weryfikacja | kontener Up, `curl -sI http://127.0.0.1:3000` → HTTP/1.1 200, `<title>Harness Open Source</title>`, migracje SQLite w logach |
| Konta | żadne konto nie zostało założone (bootstrap admina wyłącznie przez lokalne zmienne środowiskowe kontenera) |

## Przebieg (z trajectory)

1. Płytki klon repozytorium; inwentaryzacja plików Dockerfile.
2. **Przeczytanie Dockerfile przed budową**; rozpoznanie ARG (`GIT_COMMIT`, `GITNESS_VERSION_MAJOR/MINOR/PATCH`); pobranie najnowszego stabilnego tagu (`v3.3.0`) przez `git ls-remote --tags`.
3. `docker build` z poprawnymi argumentami i samodzielnie dobranym timeoutem 3000 s.
4. Diagnoza konfliktu portu 3000 (`ss -tlnp`), identyfikacja zajmującego kontenera i zwolnienie portu.
5. Uruchomienie kontenera (port wyłącznie na 127.0.0.1), odczekanie na gotowość pętlą, weryfikacja: nagłówki HTTP, tożsamość aplikacji w body, `/login`, logi startu i migracji.
6. `finish` ze statusem success i kompletem dowodów (dokładne polecenia i wyniki).

## Ocena pod bramkę kroku 4 (LiteLLM + MiniMax)

Potwierdzone:

- tool calling z wieloma kolejnymi wywołaniami — 20 iteracji bez zgubienia protokołu narzędziowego, poprawny JSON argumentów za każdym razem;
- role wiadomości i długi kontekst (166 k tokenów wejścia narastająco) — bez błędów po stronie LiteLLM;
- jakość wykonawcza: czytanie plików przed działaniem, dobór timeoutów, diagnoza i naprawa nieprzewidzianego problemu (konflikt portu), weryfikacja wieloma metodami zamiast deklaracji;
- obsługa bloków `<think>` modelu rozumującego (filtrowane w pętli; LiteLLM przekazuje je w `content`).

Niezweryfikowane w tym eksperymencie (pozostaje w kroku 4): odpowiedzi strumieniowe, anulowanie w trakcie generacji, zachowanie retry przy błędzie dostawcy, limity odpowiedzi przy dłuższych generacjach.

## Incydent poglądowy: skutek uboczny na hoście

Agent, zwalniając port 3000, **zatrzymał istniejący na hoście kontener `harness`** należący do właściciela. Zadanie na to pozwalało („zdiagnozuj i napraw"), a wykonanie było poprawne — ale to modelowa ilustracja, dlaczego produkt wymaga sandboxa bez dostępu do hosta ([D5](../../docs/decyzje.md), niezmiennik 10): w Helmflow taka operacja byłaby niemożliwa, a konflikt portu nie istniałby, bo środowiska są izolowane. Incydent odnotowany jako dowód wartości architektury, nie usterka eksperymentu.

## Uzupełnienie: przejście na endpoint zgodny z Anthropic

Po zakończeniu przebiegu, decyzją właściciela, trasę LiteLLM przełączono z endpointu zgodnego z OpenAI na **oficjalny, rekomendowany przez MiniMax endpoint zgodny z API Anthropic** (`https://api.minimax.io/anthropic`, `anthropic/MiniMax-M3`). Test dymny po przełączeniu: odpowiedź tekstowa i tool calling poprawne; dodatkowa obserwacja — w formacie Anthropic treść przychodzi bez wtrąconych bloków `<think>` (rozumowanie niesione osobno), co upraszcza obsługę po stronie klienta. Sam przebieg budowy harness/harness wykonano jeszcze na trasie OpenAI-zgodnej; wyniki pozostają ważne, a zmiana trasy nie wymagała żadnych zmian w agencie — dokładnie to zadanie warstwy wymienności LiteLLM ([D5.2](../../docs/decyzje.md)).

## Wnioski dla planu

1. Ścieżka LiteLLM → MiniMax-M3 jest zdatna do dalszych kroków fazy 1; konfiguracja połączenia z tego eksperymentu może być punktem wyjścia zamrożonej konfiguracji kroku 4.
2. Format trajectory JSONL (zadanie → odpowiedzi modelu → wyniki narzędzi → finish) okazał się wystarczający do audytu przebiegu — dobre wejście pod ingest kroku 17.
3. Koszt referencyjnego zadania wykonawczego (~172 k tokenów łącznie) to pierwszy punkt danych do wymagań niefunkcjonalnych ([produkt, rozdz. 5](../../docs/produkt.md)).
