# Helmflow — przepływy użytkownika i diagramy użycia

Część dokumentacji produktowej Helmflow, wersja zestawu 0.9 (2026-09-06). Indeks: [README](README.md).

Przepływy opisują przypadki użycia niezależnie od interfejsu — realizuje je wspólny kontrakt Engine. Pierwszym interfejsem jest CLI/TUI ([D9.3](decyzje.md)); Web realizuje te same przepływy później. Widoki interfejsów: [cli](cli.md), [platforma-web](platforma-web.md).

## 1. Aktorzy i przypadki użycia

| Aktor | Przypadki użycia |
|---|---|
| **Właściciel** (Engineering Manager / Tech Lead) | zarządzanie katalogiem agentów i wersjami projektowymi; zarządzanie wiedzą; definiowanie Work Item, kryteriów i SDLC Flow; uruchamianie i kontrola SDLC Run (stop, cancel, resume); obserwacja trajectory i zmian; odpowiadanie na pytania agentów (Blocked); review i decyzje (Approve / Request Changes / Reject); integracja rezultatu; promocja agentów i wiedzy |
| **Agent wykonawczy** (przez DSH, w sandboxie) | wykonanie etapu na wejściowej Project Version; raportowanie Change Rationale; tworzenie Handoff Package; zgłoszenie Stage Deliverable; zadanie pytania właścicielowi (Blocked) |
| **Silnik** (automatyka) | zamrażanie konfiguracji; tworzenie i sprzątanie sandboxów; śledzenie zmian i rekonsyliacja; egzekwowanie budżetów, limitów pętli i bramek; publikacja Project Versions |

## 2. Przepływ główny (happy path)

```mermaid
flowchart TD
    A["Utworzenie Project Space<br/>i rejestracja repozytorium"] --> B["Wybór wersji agentów z katalogu<br/>lub utworzenie wersji projektowych"]
    B --> C["Przypisanie wiedzy<br/>(Knowledge Packs)"]
    C --> D["Utworzenie Work Item<br/>z kryteriami akceptacji"]
    D --> E["Konfiguracja SDLC Flow<br/>i przydział agentów do etapów"]
    E --> F["Uruchomienie SDLC Run<br/>z bazowej Project Version"]
    F --> G["Kolejne Stage Runs<br/>(osobny sandbox per Agent Run)"]
    G --> H["Obserwacja: trajectory,<br/>zmiany plików, Change Sets"]
    H --> I["Project Deliverable<br/>(diff, dowody, ryzyka)"]
    I --> J{"Review właściciela"}
    J -->|Approve| K["Integracja: patch,<br/>commit, branch lub PR"]
    J -->|Request Changes| G
    J -->|Reject| L["Zamknięcie SDLC Run<br/>z zachowaniem historii"]
```

## 3. Sekwencja pojedynczego Stage Run

```mermaid
sequenceDiagram
    participant W as Właściciel
    participant S as Silnik
    participant SC as Sandbox Controller
    participant AG as Agent (DSH)
    participant PS as Project Space

    W->>S: uruchomienie etapu (lub automatyczne przejście flow)
    S->>S: zamrożenie wersji agenta, wiedzy, modelu i wejściowej Project Version
    S->>SC: utworzenie sandboxa (workspace + Harness home)
    S->>AG: kontekst: instrukcje, zadanie, Knowledge Manifest, Handoff poprzednika
    AG->>S: zdarzenia trajectory (na bieżąco)
    S->>S: Workspace Tracker rejestruje File Change Events
    AG->>S: Change Sets z uzasadnieniami
    AG->>S: Handoff Package + Stage Deliverable
    S->>S: rekonsyliacja workspace'u z niezależnym punktem odniesienia
    S->>PS: publikacja nowej Project Version i artefaktów
    opt bramka człowieka na etapie
        S->>W: Stage Deliverable do oceny
        W->>S: decyzja (kontynuacja / poprawki)
    end
    S->>SC: zatrzymanie lub usunięcie sandboxa (wg retencji)
    S->>S: przygotowanie następnego Stage Run z nowej Project Version
```

## 4. Pętla poprawek

```mermaid
flowchart TD
    T["Etap testów: wynik negatywny<br/>lub Review: Request Changes"] --> C{"Limit powrotów<br/>wyczerpany?"}
    C -->|nie| R["Nowy Stage Run implementacji<br/>(świeży sandbox, licznik powrotów +1)"]
    R --> V["Uwagi z testów lub review<br/>jako jawny kontekst agenta"]
    V --> P["Ponowne testy<br/>na nowej Project Version"]
    P -->|wynik pozytywny| OK["Kontynuacja flow"]
    P -->|wynik negatywny| C
    C -->|tak| E["Eskalacja do właściciela:<br/>decyzja o dalszym postępowaniu"]
```

## 5. Pytanie agenta do właściciela (stan Blocked)

```mermaid
sequenceDiagram
    participant AG as Agent (DSH)
    participant S as Silnik
    participant W as Właściciel

    AG->>S: pytanie wymagające decyzji człowieka
    S->>S: Agent Run przechodzi w stan Blocked
    S->>W: powiadomienie z treścią pytania i kontekstem
    W->>S: odpowiedź (decyzja)
    S->>AG: odpowiedź jako jawny kontekst; wznowienie tego samego Agent Run
    Note over S: pytanie i odpowiedź trafiają do śladu audytowego
```

## 6. Promocja wersji projektowej do puli globalnej

```mermaid
flowchart TD
    A["Wersja projektowa agenta lub wiedzy<br/>sprawdzona w praktyce projektu"] --> B["Utworzenie Promotion Candidate"]
    B --> C["Redakcja: oddzielenie treści ogólnej<br/>od projektowej, usunięcie danych poufnych"]
    C --> D{"Review właściciela"}
    D -->|akceptacja| E["Nowa wersja globalna<br/>z zachowanym pochodzeniem"]
    D -->|odrzucenie| F["Kandydat zamknięty,<br/>wersja projektowa bez zmian"]
    E --> G["Projekty migrują na nową wersję<br/>wyłącznie jawną decyzją, nigdy automatycznie"]
```

## 7. Przepływ zrozumienia programu

```mermaid
flowchart TD
    A["Rejestracja repozytorium<br/>nieznanego programu"] --> B["Inwentaryzacja: struktura,<br/>zależności, punkty wejścia"]
    B --> C["Rekonstrukcja modelu domeny<br/>i modelu danych"]
    C --> D["Mapa kontraktów: API,<br/>zdarzenia, integracje"]
    D --> E["Ocena architektury:<br/>warstwy, cykle, hot-spoty"]
    E --> F["Rejestr problemów i ryzyk<br/>z dowodami (plik, linia, metoda)"]
    F --> G{"Review właściciela"}
    G -->|akceptacja| H["Promocja artefaktów<br/>do wiedzy repozytorium"]
    G -->|Request Changes| B
    H --> I["Wiedza zasila przepływy wytwarzania<br/>i zrozumienie właściciela"]
```

Zasady przepływu zrozumienia:

- każdy etap wytwarza artefakty analityczne zamiast zmian kodu; Project Version niesie je jak każdy inny artefakt,
- dowodem twierdzenia analitycznego jest odnośnik do kodu (plik, linia) wraz z metodą ustalenia ([D8.1](decyzje.md)); twierdzenia bez dowodu są oznaczane jako deklaracje agenta,
- weryfikacja hipotez o działaniu programu może wymagać jego uruchomienia — w MVP w sandboxie Agent Run, po MVP także w Managed Environments ([D8.3](decyzje.md)),
- zatwierdzone artefakty przechodzą przepływ promocji wiedzy (rozdział 6) i stają się wiedzą repozytorium dla przepływów wytwarzania.
