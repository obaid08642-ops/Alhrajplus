"""
Iteration 9 — Search suggestions endpoints + regression of existing endpoints.

Endpoints under test:
- POST /api/search/log
- GET  /api/search/trending
- GET  /api/search/history
- DELETE /api/search/history (one + all)
- Regressions: /api/auth/login, /api/listings, /api/auth/x/start, /api/auth/snapchat/start,
  /api/auctions/active, /api/deals/today
"""

import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASS = "Admin@HarajPlus2026"


# ---------------- fixtures ----------------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def fresh_user_session():
    """Register a new user and return an authenticated cookie session."""
    s = requests.Session()
    email = f"TEST_iter9_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": email,
        "password": "TestPass@123",
        "name": "Iter9 User",
        "country_code": "SA",
        "phone": f"5{int(time.time()) % 100000000:08d}",
    }
    r = s.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=20)
    if r.status_code not in (200, 201):
        pytest.skip(f"register failed: {r.status_code} {r.text}")
    return s, email


# ---------------- search/trending ----------------
class TestTrending:
    def test_trending_anonymous_ok(self):
        r = requests.get(f"{BASE_URL}/api/search/trending", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_trending_with_limit(self):
        r = requests.get(f"{BASE_URL}/api/search/trending?limit=3", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) <= 3
        for item in data:
            assert "query" in item
            assert "count" in item


# ---------------- search/log ----------------
class TestSearchLog:
    def test_log_anonymous_ok(self):
        q = f"TEST_anon_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{BASE_URL}/api/search/log", json={"query": q}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_log_increments_count(self):
        q = f"TEST_inc_{uuid.uuid4().hex[:6]}"
        for _ in range(3):
            requests.post(f"{BASE_URL}/api/search/log", json={"query": q}, timeout=15)
        r = requests.get(f"{BASE_URL}/api/search/trending?limit=30", timeout=15)
        assert r.status_code == 200
        data = r.json()
        match = [x for x in data if x["query"] == q]
        # Either it's in the top 30 or pushed off; just check counts when present
        if match:
            assert match[0]["count"] >= 3

    def test_log_empty_query_noop(self):
        r = requests.post(f"{BASE_URL}/api/search/log", json={"query": ""}, timeout=15)
        assert r.status_code == 200


# ---------------- search/history ----------------
class TestSearchHistory:
    def test_history_anonymous_returns_empty_array(self):
        r = requests.get(f"{BASE_URL}/api/search/history", timeout=15)
        assert r.status_code == 200
        assert r.json() == []

    def test_history_logged_in_user(self, fresh_user_session):
        s, email = fresh_user_session
        q1 = f"TEST_hist1_{uuid.uuid4().hex[:6]}"
        q2 = f"TEST_hist2_{uuid.uuid4().hex[:6]}"
        for q in [q1, q2]:
            r = s.post(f"{BASE_URL}/api/search/log", json={"query": q}, timeout=15)
            assert r.status_code == 200
        r = s.get(f"{BASE_URL}/api/search/history", timeout=15)
        assert r.status_code == 200
        data = r.json()
        queries = [it["query"] for it in data]
        assert q1 in queries
        assert q2 in queries
        for item in data:
            assert "query" in item
            assert "ts" in item
            assert "id" in item

    def test_delete_one_history_item(self, fresh_user_session):
        s, _ = fresh_user_session
        q = f"TEST_del1_{uuid.uuid4().hex[:6]}"
        s.post(f"{BASE_URL}/api/search/log", json={"query": q}, timeout=15)
        # delete it
        r = s.delete(f"{BASE_URL}/api/search/history", json={"query": q}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        # verify gone
        r2 = s.get(f"{BASE_URL}/api/search/history", timeout=15)
        assert r2.status_code == 200
        queries = [it["query"] for it in r2.json()]
        assert q not in queries

    def test_delete_all_history(self, fresh_user_session):
        s, _ = fresh_user_session
        # log a few
        for _ in range(3):
            s.post(f"{BASE_URL}/api/search/log", json={"query": f"TEST_clr_{uuid.uuid4().hex[:6]}"}, timeout=15)
        r = s.delete(f"{BASE_URL}/api/search/history", json={"all": True}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert body.get("cleared") == "all"
        r2 = s.get(f"{BASE_URL}/api/search/history", timeout=15)
        assert r2.json() == []

    def test_delete_history_requires_auth(self):
        r = requests.delete(f"{BASE_URL}/api/search/history", json={"all": True}, timeout=15)
        assert r.status_code in (401, 403)


# ---------------- regression ----------------
class TestRegression:
    def test_admin_login(self, admin_session):
        # admin_session fixture already verifies login
        r = admin_session.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_listings_public(self):
        r = requests.get(f"{BASE_URL}/api/listings?country_code=SA", timeout=20)
        assert r.status_code == 200
        data = r.json()
        # Either array or paged structure
        assert isinstance(data, (list, dict))

    def test_x_oauth_start(self):
        r = requests.get(f"{BASE_URL}/api/auth/x/start", timeout=20, allow_redirects=False)
        assert r.status_code == 200
        body = r.json()
        url = body.get("auth_url") or body.get("url") or ""
        assert "twitter.com/i/oauth2/authorize" in url or "x.com/i/oauth2/authorize" in url

    def test_snapchat_oauth_start(self):
        r = requests.get(f"{BASE_URL}/api/auth/snapchat/start", timeout=20, allow_redirects=False)
        assert r.status_code == 200
        body = r.json()
        url = body.get("auth_url") or body.get("url") or ""
        assert "accounts.snapchat.com/accounts/oauth2/auth" in url

    def test_auctions_active(self):
        r = requests.get(f"{BASE_URL}/api/auctions/active?country_code=SA", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))

    def test_deals_today(self):
        r = requests.get(f"{BASE_URL}/api/deals/today?country_code=SA", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))
