from __future__ import annotations

import json
import sys
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "https://alhrajplus.onrender.com"


def get(path: str):
    req = Request(BASE + path, headers={"Accept": "application/json", "User-Agent": "Alhrajplus-staging-smoke/1.0"})
    with urlopen(req, timeout=40) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


results = {}
status, health = get("/api/health")
results["health"] = {"status": status, "body": health}
for country in ("SA", "EG"):
    query = urlencode({"limit": 100, "country_code": country})
    status, payload = get("/api/listings?" + query)
    items = payload.get("items", []) if isinstance(payload, dict) else []
    mismatches = [
        {"id": item.get("id"), "country_code": item.get("country_code"), "city": item.get("city")}
        for item in items
        if item.get("country_code") != country
    ]
    results[country] = {
        "status": status,
        "total": payload.get("total") if isinstance(payload, dict) else None,
        "items_checked": len(items),
        "mismatches": mismatches,
    }

print(json.dumps(results, ensure_ascii=False, indent=2))
if results["health"]["status"] != 200 or any(r["mismatches"] for c, r in results.items() if c in ("SA", "EG")):
    raise SystemExit(1)
