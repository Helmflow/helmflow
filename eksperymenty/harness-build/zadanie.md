Zadanie: zbuduj lokalnie projekt Harness Open Source (https://github.com/harness/harness) i udowodnij, że działa.

Kroki oczekiwane (możesz je dostosować do rzeczywistości):

1. Sklonuj repozytorium płytko (`--depth 1`) do katalogu `harness/`.
2. Rozpoznaj sposób budowania (Dockerfile w repozytorium) — przeczytaj go zanim zbudujesz.
3. Zbuduj obraz Dockera z tagiem `harness-eksperyment:local`. To długa operacja — ustaw timeout_s co najmniej 3000 i nie przerywaj jej.
4. Uruchom kontener z portem opublikowanym na 127.0.0.1:3000.
5. Zweryfikuj, że aplikacja odpowiada po HTTP (np. `curl -sI http://127.0.0.1:3000`), bez zakładania w niej żadnego konta.
6. Zakończ narzędziem finish: status, podsumowanie, dowody (dokładne polecenia i ich wyniki: id obrazu, status kontenera, odpowiedź HTTP).

Zasady: pracujesz w katalogu roboczym; jedno polecenie na raz; po każdym poleceniu oceń wynik. Jeżeli budowa z Dockerfile wymaga argumentów (np. wersji), odczytaj je z plików repozytorium. Jeżeli coś nie działa — zdiagnozuj i spróbuj naprawić, a jeśli po kilku próbach się nie da, zakończ finish ze statusem failure i pełną diagnozą.
