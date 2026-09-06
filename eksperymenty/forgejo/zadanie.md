Zadanie: utwórz repozytorium w lokalnym Forgejo przez jego API i zasil je projektem z testami.

Kontekst: pod http://127.0.0.1:3000 działa lokalne Forgejo. Masz token administracyjny w zmiennej środowiskowej `FORGEJO_TOKEN` (używaj `$FORGEJO_TOKEN` w poleceniach; nigdy nie wypisuj jego wartości). Użytkownik: `helmflow`.

Kroki oczekiwane:

1. Utwórz przez API repozytorium `demo-agenta` (POST `/api/v1/user/repos`, nagłówek `Authorization: token $FORGEJO_TOKEN`, pole `"default_branch":"main"`). Zweryfikuj odpowiedź.
2. Sklonuj je: `http://helmflow:${FORGEJO_TOKEN}@127.0.0.1:3000/helmflow/demo-agenta.git` do katalogu `demo-agenta/`.
3. Utwórz mały, kompletny projekt Pythona: narzędzie wiersza poleceń `suma` czytające plik z liczbami (jedna na linię) i wypisujące ich sumę, minimum i maksimum; moduł + `python -m suma`; testy pytest z przypadkami brzegowymi (plik pusty, linia niebędąca liczbą, brak pliku).
4. Dodaj `README.md` i `pyproject.toml`; uruchom testy i upewnij się, że przechodzą (venv, jeśli trzeba).
5. Tożsamość gita: `Agent Eksperymentu <agent@helmflow.local>`; jeden commit; push na `main`.
6. Zweryfikuj przez `git ls-remote` oraz przez API (`GET /api/v1/repos/helmflow/demo-agenta/commits`).
7. Zakończ narzędziem finish: status, podsumowanie, dowody (odpowiedź API tworzenia repo, wynik testów, hash commita, ls-remote).

Zasady: jedno polecenie na raz; oceniaj wynik każdego; tokenu nie wypisuj.
