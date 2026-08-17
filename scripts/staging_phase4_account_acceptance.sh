#!/usr/bin/env bash
# Read-only Phase 4 staging acceptance. Credentials come from environment only.
# Required: PHASE4_TEST_EMAIL, PHASE4_TEST_PASSWORD
set -euo pipefail

base="${PHASE4_BASE_URL:-https://alhrajplus.onrender.com/api}"
email="${PHASE4_TEST_EMAIL:?PHASE4_TEST_EMAIL is required}"
password="${PHASE4_TEST_PASSWORD:?PHASE4_TEST_PASSWORD is required}"

json_field() {
  local key="$1"
  python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1], ""))' "$key"
}
status_of() { curl -sS -o /tmp/phase4_body.json -w '%{http_code}' --max-time 35 "$@"; }

health="$(curl -sS --max-time 35 "$base/health")"
printf '%s' "$health" | grep -q '"status"' || { echo "health payload invalid: $health" >&2; exit 1; }
echo "PASS health"

login="$(curl -sS --max-time 35 -H 'Content-Type: application/json' -d "{\"email\":\"$email\",\"password\":\"$password\"}" "$base/auth/login")"
token="$(printf '%s' "$login" | json_field access_token)"
[ -n "$token" ] || { echo "login did not return an access token" >&2; exit 1; }
auth=(-H "Authorization: Bearer $token")

me="$(curl -sS --max-time 35 "${auth[@]}" "$base/auth/me")"
country="$(printf '%s' "$me" | json_field country_code)"
[ -n "$country" ] || { echo "auth/me has no country_code" >&2; exit 1; }
echo "PASS auth country=$country"

for path in "/offers/mine?country_code=$country" "/watches?country_code=$country" "/following?country_code=$country" "/search/saved?country_code=$country" "/favorites?country_code=$country"; do
  code="$(status_of "${auth[@]}" "$base$path")"
  [ "$code" = "200" ] || { echo "FAIL $path expected 200 got $code: $(cat /tmp/phase4_body.json)" >&2; exit 1; }
  echo "PASS $path"
done

# The client must not impersonate another country through the country parameter.
other="EG"; [ "$country" = "EG" ] && other="SA"
code="$(status_of "${auth[@]}" "$base/offers/mine?country_code=$other")"
[ "$code" = "409" ] || { echo "FAIL foreign-country offers expected 409 got $code: $(cat /tmp/phase4_body.json)" >&2; exit 1; }
echo "PASS foreign-country offers rejected"

# OTP must never report success without an SMS provider. A 503 is the honest
# expected result when provider credentials are deliberately absent. Do not call
# this endpoint here: a configured provider would send a real SMS.
echo "MANUAL: verify no-phone/verified-phone and real SMS OTP with an authorized device."
echo "MANUAL: run buyer/seller offer lifecycle using two authorized staging accounts."
