"""Non-destructive Phase 3 country-isolation acceptance test for staging.

Required environment variables:
  PHASE3_TEST_EMAIL
  PHASE3_TEST_PASSWORD
Optional:
  PHASE3_BASE_URL (default: Render staging API)

The script performs only reads plus requests expected to fail *before* any data
mutation: cross-country listing creation, wrong-country city/currency, and
unsupported profile country. It deliberately does not call repair/apply.
"""
from __future__ import annotations

import os
import sys
from typing import Any

import requests

BASE = os.environ.get("PHASE3_BASE_URL", "https://alhrajplus.onrender.com/api").rstrip("/")
EMAIL = os.environ.get("PHASE3_TEST_EMAIL", "")
PASSWORD = os.environ.get("PHASE3_TEST_PASSWORD", "")
TIMEOUT = 35

CITIES = {"SA": "الرياض", "EG": "القاهرة"}
CURRENCIES = {"SA": "SAR", "EG": "EGP"}


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def request(method: str, path: str, **kwargs: Any) -> requests.Response:
    response = requests.request(method, f"{BASE}{path}", timeout=TIMEOUT, **kwargs)
    print(f"{method} {path} -> {response.status_code}")
    return response


def listing_items(response: requests.Response) -> list[dict]:
    data = response.json()
    return data.get("items", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])


def assert_exact_country(path: str, country: str) -> None:
    response = request("GET", f"{path}?country_code={country}&limit=100")
    if response.status_code != 200:
        fail(f"{path} for {country} returned {response.status_code}: {response.text[:300]}")
    bad = [item.get("id") for item in listing_items(response) if str(item.get("country_code") or "").upper() != country]
    if bad:
        fail(f"{path} leaked {len(bad)} item(s) into {country}: {bad[:5]}")


def main() -> None:
    if not EMAIL or not PASSWORD:
        fail("PHASE3_TEST_EMAIL and PHASE3_TEST_PASSWORD are required")

    for country in ("SA", "EG"):
        for path in ("/listings", "/listings/map/nearby", "/auctions/active", "/listings/recommended", "/listings/trending", "/deals/today"):
            assert_exact_country(path, country)

    egypt = request("GET", "/listings?country_code=EG&limit=1")
    egypt_items = listing_items(egypt)
    if egypt_items:
        listing_id = egypt_items[0].get("id")
        cross = request("GET", f"/listings/{listing_id}?country_code=SA")
        if cross.status_code != 404:
            fail(f"EG listing detail was visible under SA: HTTP {cross.status_code}")

    login = request("POST", "/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if login.status_code != 200:
        fail(f"normal-user login failed: {login.text[:300]}")
    payload = login.json()
    if payload.get("mfa_required"):
        fail("test account has MFA enabled; use a dedicated non-MFA normal-user test account")
    token = payload.get("access_token")
    user = payload.get("user") or {}
    if not token:
        fail("login did not return an access token")
    active = str(user.get("country_code") or "SA").upper()
    if active not in CITIES:
        fail(f"test account country {active!r} is outside current deterministic test matrix")
    other = "EG" if active == "SA" else "SA"
    headers = {"Authorization": f"Bearer {token}"}

    # Every request below must fail before inserting/updating data.
    common = {
        "title": "Phase 3 negative validation test",
        "description": "This request must be rejected before any listing is saved.",
        "category": "phones",
    }
    cross_post = request("POST", "/listings", headers=headers, json={**common, "country_code": other, "city": CITIES[other], "currency": CURRENCIES[other]})
    if cross_post.status_code != 409:
        fail(f"cross-country create expected 409, got {cross_post.status_code}: {cross_post.text[:300]}")

    invalid_city = request("POST", "/listings", headers=headers, json={**common, "country_code": active, "city": CITIES[other], "currency": CURRENCIES[active]})
    if invalid_city.status_code != 422:
        fail(f"wrong-country city expected 422, got {invalid_city.status_code}: {invalid_city.text[:300]}")

    wrong_currency = CURRENCIES[other]
    invalid_currency = request("POST", "/listings", headers=headers, json={**common, "country_code": active, "city": CITIES[active], "currency": wrong_currency})
    if invalid_currency.status_code != 422:
        fail(f"wrong-country currency expected 422, got {invalid_currency.status_code}: {invalid_currency.text[:300]}")

    unsupported_profile = request("PUT", "/users/me", headers=headers, json={"country_code": "UA"})
    if unsupported_profile.status_code != 422:
        fail(f"unsupported profile country expected 422, got {unsupported_profile.status_code}: {unsupported_profile.text[:300]}")

    no_admin_integrity = request("GET", "/admin/data-integrity")
    if no_admin_integrity.status_code != 401:
        fail(f"anonymous integrity report expected 401, got {no_admin_integrity.status_code}")

    print(f"PASS: Phase 3 country acceptance completed for active user country {active}")


if __name__ == "__main__":
    main()
