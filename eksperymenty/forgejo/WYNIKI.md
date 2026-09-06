# Wyniki eksperymentu Forgejo (2026-09-06)

**Status: sukces.** Pełny cykl bez udziału człowieka: agent utworzył repozytorium **przez API Forgejo**, sklonował je, zbudował projekt z testami i wypchnął — wszystko zweryfikowane niezależnie od jego deklaracji.

## Metryki

| Metryka | Wartość |
|---|---|
| Iteracje / tokeny | 22 zapisy trajectory; 145 646 wej. + 7 133 wyj. |
| Repozytorium | `helmflow/demo-agenta` utworzone przez `POST /api/v1/user/repos` (HTTP 201) |
| Rezultat | pakiet `suma` (parser z błędami z numerem linii, CLI z kodami wyjścia 0/2/3, entry point), **15 testów pytest — 15/15 PASSED** |
| Commit | `a189a2d` autorstwa `Agent Eksperymentu <agent@helmflow.local>`, wypchnięty na `main` |
| Weryfikacja niezależna | `git ls-remote` (HEAD=main=a189a2d), API: commit z właściwym autorem, pliki widoczne |
| Higiena sekretu | token wyłącznie przez `$FORGEJO_TOKEN`; dowody zapisane przez agenta do `artifacts/` bez tokena; ls-remote do dowodów wykonany celowo bez poświadczeń |
| Trasa modelu | w całości endpoint zgodny z API Anthropic ([harness-build/WYNIKI](../harness-build/WYNIKI.md)) |

## Co ten przebieg dodaje ponad eksperyment harness-build

1. **API platformy w pętli agenta** — poprzednio repozytorium tworzył człowiek; tu agent przeszedł pełny cykl utwórz → sklonuj → zbuduj → wypchnij → zweryfikuj przez REST API. To dokładnie operacje, których Engine użyje w implementacji kontraktu `Repository` (krok 10 i 23 planu).
2. **Forgejo jako deterministyczny fixture potwierdzony w praktyce**: start bez ekranu rejestracji (konfiguracja env + CLI), admin i token w pełni skryptowe — gotowy wzorzec dla środowiska testów integracyjnych i e2e (krok 24).
3. Obserwacja jakościowa: agent z własnej inicjatywy odkładał dowody do `artifacts/` z dbałością o niewyciekanie tokena i wykonał kontrolny `ls-remote` bez poświadczeń.

## Wnioski

- Kandydatura Forgejo na pierwszą integrację `Repository` i serwis testowy e2e — potwierdzona praktycznie (patrz [README](README.md), tabela potencjału względem planu).
- Drugi niezależny punkt danych kosztowych: pełny cykl repo-przez-API ≈ 153 k tokenów łącznie.
