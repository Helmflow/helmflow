# Wyniki eksperymentu OpenUI (2026-09-06)

**Status: teza potwierdzona.** MiniMax-M3 przez LiteLLM komponuje poprawne widoki z naszego katalogu komponentów, a te same komponenty obsługują widoki predefiniowane karmione danymi z silnika. Oba tryby renderuje jeden `<Renderer>`.

## Co zmierzono

| Sprawdzian | Wynik |
|---|---|
| Widok predefiniowany „Repozytoria" (dane na żywo z Forgejo) | root OK, 10 statements, 0 nierozwiązanych referencji, **0 błędów walidacji** |
| Widok predefiniowany „Praca agenta" (trajectory JSONL, 45 zdarzeń) | root OK, 31 statements, 0 nierozwiązanych, **0 błędów walidacji** |
| Ad-hoc: „przegląd repozytoriów jako kafelki i tabela" | 0 błędów; użyte komponenty: Root, Section, Row, RepoCard, StatTile, DataTable, StatusBadge, Text; 1190/431 tok; 5,4 s |
| Ad-hoc: „widok pracy agenta: status, tokeny, oś czasu" | 0 błędów; Root, Section, StatusBadge, StatTile, DataTable; 1195/533 tok; 5,1 s |
| Ad-hoc: „porównaj repozytoria + sekcja ostrzeżeń" | 0 błędów; 1197/564 tok; 7,0 s |
| System prompt generowany z katalogu | 3 469 znaków (9 komponentów z kontraktami Zod) |

Jakość kompozycji ad-hoc (fragment faktycznego wyjścia modelu):

```
root = Root("Praca agenta", [header_section, status_section, tokens_section, ...], "Podgląd sesji nadzoru")
status_badge = StatusBadge("Zakończono pomyślnie", "ok")
events_tile = StatTile("Zdarzeń w przebiegu", "45", "Pełna trajektoria dostępna")
prompt_tokens_tile = StatTile("Tokeny wejściowe (prompt)", "145 646")
```

Model poprawnie wciągnął realne dane z kontekstu (45 zdarzeń, 145 646 tokenów, commit `a189a2d2`), dobrał komponenty do treści (badge dla statusu, tabela dla osi czasu) i zachował składnię pozycyjną.

## Błąd wykryty przez właściciela i naprawa (ta sama sesja)

Pierwsza wersja **parsowała się bez błędów, ale renderowała puste widoki** — użytkownik zobaczył same zakładki i źródło Lang zamiast interfejsu. Przyczyna: nieudokumentowany w README kontrakt renderera. `@openuidev/react-lang` wywołuje komponent jako:

```js
jsx(Comp, { props: el.props, renderNode, statementId })
```

czyli właściwe propsy są **zagnieżdżone pod kluczem `props`**, a zagnieżdżone komponenty (children) to węzły AST, które trzeba wyrenderować funkcją `renderNode(node)`. Pierwotne komponenty destrukturyzowały propsy bezpośrednio (`({ title, children })`), więc dostawały `undefined`, a dzieci nigdy nie trafiały do drzewa. Kontrakt ustalono, czytając kod `dist` pakietu; naprawa objęła wszystkie 9 komponentów.

**Lekcja metodyczna, ważniejsza od samej poprawki:** walidacja parsera (0 błędów, rozwiązane referencje) **nie jest dowodem, że UI działa**. Dowodem jest wyrenderowany HTML zawierający konkretne dane. Test `src/test-render.tsx` renderuje każdy widok przez `renderToString` i sprawdza obecność faktycznych wartości (nazwa repozytorium, SHA commita, liczba zdarzeń) — po naprawie **3/3 widoków przechodzi**:

| Widok | HTML | Tekst | Wyrenderowane komponenty |
|---|---|---|---|
| predefiniowany: Repozytoria | 1 404 zn. | 419 zn. | root, section, row, tile, repo, table-wrap |
| predefiniowany: Praca agenta | 8 222 zn. | 3 234 zn. | root, section, row, tile |
| ad-hoc (model, 248 tok, 2,6 s) | 1 400 zn. | 368 zn. | root, section, row, tile, repo, table-wrap |

Ta sama zasada obowiązuje w produkcie: dowodem działania widoku jest test renderujący z danymi, nie walidacja schematu ([D9.2](../../docs/decyzje.md) — kontrakt bez testu jest nieukończony).

## Wnioski dla planu

1. **Teza właściciela się broni**: UI może być zestawem kompozycji generowanych przez AI, w którym część widoków jest predefiniowana i karmiona danymi z silnika, a część powstaje na żądanie — **z jednego katalogu komponentów i jednego renderera**.
2. **Bezpieczeństwo modelu jest zgodne z naszymi zasadami**: model nigdy nie wykonuje kodu, tylko komponuje zarejestrowane komponenty; renderer waliduje propsy wobec schematów Zod przed renderem. UI pozostaje bez logiki domenowej ([D3](../../docs/decyzje.md)).
3. **Koszt widoku ad-hoc jest niski**: ~1,2 k tokenów wejścia i ~0,5 k wyjścia, 5–7 s. OpenUI Lang jest znacząco tańszy od JSON-owego opisu UI.
4. **Widoki, których nie ma nigdzie indziej**, powstają najtaniej: „Praca agenta" (trajectory) to widok, którego Forgejo nie ma i mieć nie będzie — a kosztował jedną funkcję budującą Lang z danych.
5. **Hybryda z Forgejo pozostaje spójna**: warstwa agentowa nasza (ten mechanizm), warstwa kodu i review w Forgejo.

## Ryzyka i znaleziska

- **Telemetria zależności**: `@openuidev/lang-core` wysyła pseudonimową telemetrię instalacyjną w `postinstall`, a runtime opcjonalnie z 10% wywołań serwerowych. W eksperymencie postinstall został zablokowany przez npm 11 (`allow-scripts`), a dodatkowo ustawiamy `OPENUI_TELEMETRY_DISABLED=1` i `DO_NOT_TRACK=1`. **Przy ewentualnym wejściu do produktu telemetria musi być wyłączona jawnie i udokumentowana** — nasza zasada zero telemetrii ([produkt, rozdz. 3](../../docs/produkt.md)).
- **Licencja**: OpenUI jest na MIT — zgodna z AGPL-3.0 produktu.
- **Dojrzałość**: standard młody (pakiety 0.2.x); wiązanie się z nim wymagałoby przypięcia wersji i testów kontraktowych jak przy DSH ([D5.1](../../docs/decyzje.md)). Katalog komponentów to zwykłe komponenty React — przenośne, więc lock-in jest ograniczony.
- **Zmienność kompozycji**: ten sam prompt daje różne układy przy kolejnych wywołaniach (raz płaskie zagnieżdżenia inline, raz referencje). Dla widoków kanonicznych to argument za trybem predefiniowanym: generujesz raz, przeglądasz, commitujesz.
- Nie testowano: streamingu (`isStreaming`), trybu edycji (`mergeStatements`), wiązań i zapytań w runtime (`bindings`, `toolCalls`) — to naturalny drugi etap, gdyby kierunek wszedł do produktu.

## Odstępstwo od zatwierdzonego planu

Zamiast backendu FastAPI użyto **serwera Node (Express)**: generowanie promptu systemowego (`library.prompt()`) wymaga katalogu komponentów zdefiniowanego w JavaScripcie, więc dokładanie drugiego języka do eksperymentu nie wnosiłoby nic poza złożonością. Zakres i cel bez zmian: proxy danych (Forgejo, trajectory) plus brama do modelu, z sekretami po stronie serwera. W produkcie warstwą API pozostaje FastAPI zgodnie z [D3](../../docs/decyzje.md).
