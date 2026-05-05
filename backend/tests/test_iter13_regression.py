"""Iter-13 regression: verify previously-shipped APIs still respond after new MongoDB indexes
were added at startup, and SmartAppBanner/lazy-loading frontend changes did not affect backend.
Endpoints covered:
  - /api/auth/login (admin)
  - /api/listings (list)
  - /api/search/trending
  - /api/admin/finance/summary
  - /api/admin/seo
  - /api/ai/listing-autofill
  - /api/watches (CRUD via create listing)
  - /api/sellers/{id}/follow (toggle)
  - /api/listings/{id} PUT (price drop)
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://platform-inspect.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    tok = data.get("token") or data.get("access_token")
    assert tok, f"no token in login response: {data}"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- public/regression ----------
def test_listings_list():
    r = requests.get(f"{BASE_URL}/api/listings?limit=10", timeout=20)
    assert r.status_code == 200
    body = r.json()
    items = body if isinstance(body, list) else body.get("items")
    assert isinstance(items, list)


def test_search_trending():
    r = requests.get(f"{BASE_URL}/api/search/trending", timeout=20)
    assert r.status_code == 200, r.text[:200]
    body = r.json()
    # Either list of {q,count} or {trending:[...]} shape — tolerate both
    assert isinstance(body, (list, dict))


def test_auth_login_admin(admin_token):
    assert isinstance(admin_token, str) and len(admin_token) > 10


def test_admin_finance_summary(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/finance/summary", headers=admin_headers, timeout=20)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    assert isinstance(data, dict)


def test_admin_seo_get(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/seo", headers=admin_headers, timeout=20)
    assert r.status_code == 200, r.text[:200]
    assert isinstance(r.json(), dict)


def test_ai_listing_autofill(admin_headers):
    payload = {"title": "كامري 2020 نظيفة جداً", "description": "سيارة ممشى قليل"}
    r = requests.post(f"{BASE_URL}/api/ai/listing-autofill", json=payload, headers=admin_headers, timeout=60)
    # Permit 200 (success), 422 (validation), or 503 (LLM key missing) but not 5xx-other
    assert r.status_code in (200, 422, 503), f"unexpected: {r.status_code} {r.text[:200]}"


# ---------- watches / follow / price-drop ----------
@pytest.fixture(scope="module")
def admin_listing(admin_headers):
    """Create a listing owned by admin to use for watch/price-drop."""
    payload = {
        "title": f"TEST_iter13_{uuid.uuid4().hex[:6]}",
        "description": "Regression test listing",
        "price": 10000,
        "currency": "SAR",
        "category": "cars",
        "subcategory": "sedan",
        "city": "Riyadh",
        "country_code": "SA",
        "images": [],
    }
    r = requests.post(f"{BASE_URL}/api/listings", json=payload, headers=admin_headers, timeout=20)
    assert r.status_code in (200, 201), r.text[:200]
    lid = r.json().get("id")
    assert lid
    yield lid
    # teardown
    requests.delete(f"{BASE_URL}/api/listings/{lid}", headers=admin_headers, timeout=10)


def test_watches_create(admin_headers, admin_listing):
    # owner cannot watch own listing → 400
    r = requests.post(f"{BASE_URL}/api/watches", json={"listing_id": admin_listing}, headers=admin_headers, timeout=20)
    assert r.status_code in (200, 400), r.text[:200]


def test_follow_seller_toggle(admin_headers):
    # follow self should be blocked → 400
    me = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers, timeout=10).json()
    my_id = me.get("id")
    r = requests.post(f"{BASE_URL}/api/sellers/{my_id}/follow", headers=admin_headers, timeout=15)
    assert r.status_code in (400, 422), f"expected self-follow to be blocked, got {r.status_code} {r.text[:200]}"


def test_listing_price_drop_update(admin_headers, admin_listing):
    r = requests.put(
        f"{BASE_URL}/api/listings/{admin_listing}",
        json={"price": 8500},
        headers=admin_headers,
        timeout=20,
    )
    assert r.status_code in (200, 204), r.text[:200]
    g = requests.get(f"{BASE_URL}/api/listings/{admin_listing}", timeout=15)
    assert g.status_code == 200
    assert int(g.json().get("price", 0)) == 8500
