"""
Iteration 5 — Top Deals of the Day Backend Tests

Covers:
- GET /api/deals/today (response shape, sorting, filtering, limit, regression of structure)
- Light regression: price-badge endpoint, auth login, listings search.
"""

import os
import pytest
import requests

def _read_frontend_env_url():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        return None
    return None

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env_url() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be configured"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} - {r.text[:200]}")
    return r.json().get("access_token") or r.json().get("token")


# -------------------- Deals of the Day --------------------
class TestDealsToday:
    def test_endpoint_reachable_and_returns_list(self, session):
        r = session.get(f"{API}/deals/today")
        assert r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_deal_shape_has_required_fields(self, session):
        r = session.get(f"{API}/deals/today", params={"limit": 30})
        assert r.status_code == 200
        deals = r.json()
        # If at least one deal exists, validate shape
        if not deals:
            pytest.skip("No deals available — DB does not have enough listings to compute medians (>=3 per category+subcategory).")
        d = deals[0]
        for f in ("id", "title", "price", "market_median", "savings", "discount_pct", "category"):
            assert f in d, f"Missing field '{f}' in deal: {list(d.keys())}"
        assert d["price"] < d["market_median"], "Price must be below market median"
        assert d["savings"] == int(d["market_median"] - d["price"]), "Savings field mismatch"
        assert d["discount_pct"] >= 20, f"Deals must be >=20% off (got {d['discount_pct']}%)"
        # _id should be excluded
        assert "_id" not in d

    def test_sorted_by_discount_pct_desc(self, session):
        r = session.get(f"{API}/deals/today", params={"limit": 30})
        assert r.status_code == 200
        deals = r.json()
        if len(deals) < 2:
            pytest.skip("Need >=2 deals to verify sort order")
        pcts = [d["discount_pct"] for d in deals]
        assert pcts == sorted(pcts, reverse=True), f"Not sorted DESC: {pcts}"

    def test_limit_param_respected(self, session):
        r = session.get(f"{API}/deals/today", params={"limit": 3})
        assert r.status_code == 200
        deals = r.json()
        assert len(deals) <= 3

    def test_country_code_filter(self, session):
        r_sa = session.get(f"{API}/deals/today", params={"country_code": "SA", "limit": 50})
        r_all = session.get(f"{API}/deals/today", params={"limit": 50})
        assert r_sa.status_code == 200 and r_all.status_code == 200
        for d in r_sa.json():
            assert d.get("country_code") in (None, "SA"), f"Got cc={d.get('country_code')}"

    def test_unknown_country_returns_empty_or_subset(self, session):
        r = session.get(f"{API}/deals/today", params={"country_code": "ZZ"})
        assert r.status_code == 200
        assert r.json() == []


# -------------------- Regression: Price Badge --------------------
class TestPriceBadgeRegression:
    def test_price_badge_endpoint(self, session):
        # AI price badge expects /ai/price-badge/{listing_id}
        r = session.get(f"{API}/listings", params={"limit": 1})
        items = r.json().get("items", [])
        if not items:
            pytest.skip("No listings to verify price-badge")
        lid = items[0]["id"]
        r2 = session.get(f"{API}/ai/price-badge/{lid}")
        assert r2.status_code == 200, f"Got {r2.status_code}: {r2.text[:200]}"
        data = r2.json()
        assert "badge" in data and "label" in data


# -------------------- Regression: Auth --------------------
class TestAuthRegression:
    def test_admin_login(self, admin_token):
        assert admin_token and isinstance(admin_token, str) and len(admin_token) > 10

    def test_me_endpoint(self, session, admin_token):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data.get("email") == ADMIN_EMAIL


# -------------------- Regression: Listings --------------------
class TestListingsRegression:
    def test_list_listings(self, session):
        r = session.get(f"{API}/listings", params={"limit": 5})
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_get_single_listing(self, session):
        r = session.get(f"{API}/listings", params={"limit": 1})
        items = r.json().get("items", [])
        if not items:
            pytest.skip("No listings to inspect")
        lid = items[0]["id"]
        r2 = session.get(f"{API}/listings/{lid}")
        assert r2.status_code == 200
        assert r2.json().get("id") == lid
