# Helmflow — instrukcja dla agenta implementującego

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

## Ścieżka czytania

Przed pierwszą linią kodu, w tej kolejności: [decyzje](decyzje.md) → [model-domeny](model-domeny.md) → [model-danych](model-danych.md) → [architektura](architektura.md) → [plan-mvp](plan-mvp.md). Pozostałe dokumenty ([produkt](produkt.md), [funkcje](funkcje.md), [przeplywy](przeplywy.md), [sdk](sdk.md), [engine](engine.md), [cli](cli.md), [platforma-web](platforma-web.md), [technologia](technologia.md)) służą jako odniesienie w trakcie pracy.

## Zasady

1. Ta dokumentacja jest samodzielnym źródłem prawdy projektu; przy konflikcie [decyzje](decyzje.md) mają pierwszeństwo nad pozostałymi dokumentami, a między decyzjami wygrywa wyższy numer.
2. Nie renegocjuj decyzji D1–D9. Gdy rzeczywistość im przeczy (np. bramka fazy 1 nie przechodzi), zatrzymaj się i wróć do właściciela z opisem problemu i opcjami — nie maskuj problemu w kolejnych warstwach.
3. Każdy krok planu kończy się jego bramką wyjścia — testem, demonstracją lub artefaktem. Krok bez przejścia bramki jest nieukończony.
4. Fazy 0–1 wykonuj przed jakimkolwiek kodem produktu. Pierwszy commit produktu powstaje w kroku 6.
5. Buduj od dołu warstw: SDK z testami kontraktowymi → Engine → backend + CLI/TUI ([D9](decyzje.md)); Web dopiero po TUI. Obowiązuje konwencja matrioszki ([D9.4](decyzje.md)) i stop-loss faz ([plan-mvp](plan-mvp.md)).
6. Po fundamencie buduj najpierw MVP-0 i od jego osiągnięcia prowadź rozwój Helmflow przez Helmflow (dogfooding, [D7.2](decyzje.md)) — kolejne kroki planu jako Work Items, gdzie to możliwe. Zmierz Gate A′ i przedstaw wynik właścicielowi, zanim rozbudujesz rdzeń domenowy.
7. Wszystkie ADR-y zapisuj w `docs/adr/` od pierwszego dnia istnienia monorepo; decyzje D1–D9 przenieś tam jako ADR-y 0001–0009 (krok 2 planu).
8. Implementację `packages/sdk` zaczynaj od specyfikacji w [model-danych](model-danych.md); kontrakt bez test kitu jest nieukończony ([D9.2](decyzje.md)).
