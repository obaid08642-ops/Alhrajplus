from __future__ import annotations

import json
import os
import sys
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "https://alhrajplus.onrender.com"
EMAIL = os.environ.get("STAGING_EMAIL", "")
PASSWORD = os.environ.get("STAGING_PASSWORD", "")


def request(path: str, method: str = "GET", body=None, token: str | None = None):
    headers = {"Accept": "application/json", "Content-Type": "application/json", "User-Agent": "Alhrajplus-staging-auth-smoke/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = None if body is None else json.dumps(body).encode("utf-8")
    req = Request(BASE + path, data=payload, headers=headers, method=method)
    try:
        with urlopen(req, timeout=40) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"raw": raw}
        return exc.code, parsed


if not EMAIL or not PASSWORD:
    raise SystemExit("Set STAGING_EMAIL and STAGING_PASSWORD only for this local smoke test")

result = {}
status, login = request("/api/auth/login", "POST", {"email": EMAIL, "password": PASSWORD})
result["login"] = {"status": status, "ok": status == 200, "keys": sorted(login) if isinstance(login, dict) else []}
token = login.get("access_token") or login.get("token") if isinstance(login, dict) else None

if not token:
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1)

status, me = request("/api/auth/me", token=token)
result["me"] = {"status": status, "ok": status == 200, "country_code": me.get("country_code") if isinstance(me, dict) else None}
selected_country = (me.get("country_code") if isinstance(me, dict) else None) or "SA"

for country in (selected_country, "EG" if selected_country != "EG" else "SA"):
    status, payload = request("/api/listings?" + urlencode({"limit": 100, "country_code": country}), token=token)
    items = payload.get("items", []) if isinstance(payload, dict) else []
    mismatches = [item.get("country_code") for item in items if item.get("country_code") != country]
    result[f"listings_{country}"] = {"status": status, "items_checked": len(items), "mismatches": mismatches}

print(json.dumps(result, ensure_ascii=False, indent=2))
if result["login"]["status"] != 200 or result["me"]["status"] != 200 or any(v.get("mismatches") for k, v in result.items() if k.startswith("listings_")):
    raise SystemExit(1)
