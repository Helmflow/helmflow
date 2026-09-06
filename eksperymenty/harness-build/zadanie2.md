Zadanie: zasil pusty projekt w lokalnym serwerze git realnym kodem z testami.

Kontekst: pod http://127.0.0.1:3000 działa lokalny serwer Harness Open Source. Istnieje w nim puste repozytorium `Testing123/testrepo` (gałąź domyślna: main). Adres git: `http://admin:TOKEN@127.0.0.1:3000/git/Testing123/testrepo.git`, gdzie TOKEN znajdziesz w zmiennej środowiskowej `GITNESS_PAT` (użyj `$GITNESS_PAT` w poleceniach; nigdy nie wypisuj jego wartości).

Kroki oczekiwane:

1. Sklonuj repozytorium do katalogu `testrepo/`.
2. Utwórz w nim mały, kompletny projekt Pythona: narzędzie wiersza poleceń `licznik` zliczające linie, słowa i znaki w plikach tekstowych (moduł + funkcja main), z testami pytest pokrywającymi przypadki brzegowe (plik pusty, brak pliku).
3. Dodaj `README.md` z opisem i sposobem uruchomienia oraz `pyproject.toml`.
4. Uruchom testy (`python -m pytest`) i upewnij się, że przechodzą; jeśli pytest nie jest dostępny, zainstaluj go w lokalnym venv w katalogu roboczym.
5. Skonfiguruj tożsamość gita jako `Agent Eksperymentu <agent@helmflow.local>`, zrób jeden commit z sensownym komunikatem i wypchnij na `main`.
6. Zweryfikuj wypchnięcie przez `git ls-remote` (ref main musi istnieć).
7. Zakończ narzędziem finish: status, podsumowanie, dowody (wynik testów, hash commita, wynik ls-remote).

Zasady: jedno polecenie na raz; oceniaj wynik każdego; nie wypisuj wartości tokenu w poleceniach echo/log.
