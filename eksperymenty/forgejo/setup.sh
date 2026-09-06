#!/usr/bin/env bash
# Automatyczna inicjalizacja lokalnego Forgejo: admin + token, bez ekranu rejestracji.
# Wynik: FORGEJO_TOKEN dopisany do .env (plik poza repozytorium).
set -euo pipefail
cd "$(dirname "$0")"

docker compose up -d

echo -n "Czekam na Forgejo"
for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/v1/version >/dev/null 2>&1; then echo " — żyje."; break; fi
  echo -n "."; sleep 2
done

ADMIN_PASS="${FORGEJO_ADMIN_PASS:-changeit-forgejo}"

docker exec -u git forgejo-eksperyment forgejo admin user create \
  --admin --username helmflow --email admin@helmflow.local \
  --password "$ADMIN_PASS" --must-change-password=false 2>/dev/null \
  && echo "Admin utworzony." || echo "Admin już istnieje."

TOKEN=$(docker exec -u git forgejo-eksperyment forgejo admin user generate-access-token \
  --username helmflow --token-name "eksperyment-$(date +%s)" --scopes all --raw)

grep -v '^FORGEJO_TOKEN=' .env 2>/dev/null > .env.tmp || true
printf 'FORGEJO_TOKEN=%s\n' "$TOKEN" >> .env.tmp
mv .env.tmp .env
echo "Token zapisany w .env (nie wyświetlam wartości)."

curl -sf -H "Authorization: token $TOKEN" http://127.0.0.1:3000/api/v1/user \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('API OK, zalogowany jako:', d['login'], '| admin:', d['is_admin'])"
