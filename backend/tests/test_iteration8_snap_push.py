"""Iteration 8 tests — Snapchat OAuth start/callback + Expo Push register/unregister + admin broadcast push integration.

Also runs Session 7+8 regression: register, login, admin login, X OAuth start/callback,
forgot-password.
"""
import os
import re
import uuid
import pytest
import requests
from urllib.parse import urlparse, parse_qs

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://platform-inspect.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


# ----------------------------- Fixtures -----------------------------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"no token in admin login response: {data}"
    return token


@pytest.fixture(scope="session")
def admin_client(http, admin_token):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}",
    })
    return s


@pytest.fixture(scope="session")
def test_user(http):
    """Create a fresh test user and return (email, password, token, user_id)."""
    email = f"TEST_iter8_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass@2026"
    phone = f"5{uuid.uuid4().int % 10**8:08d}"
    payload = {
        "name": "Iter8 Tester",
        "email": email,
        "password": password,
        "phone": phone,
        "country_code": "SA",
    }
    r = http.post(f"{API}/auth/register", json=payload)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    user = data.get("user") or {}
    assert token and user.get("id"), f"missing token/user in register: {data}"
    return {"email": email, "password": password, "token": token, "id": user["id"]}


@pytest.fixture
def user_client(test_user):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {test_user['token']}",
    })
    return s


# ----------------------------- Snapchat OAuth -----------------------------
class TestSnapchatOAuth:
    def test_snap_start_returns_valid_auth_url(self, http):
        r = http.get(f"{API}/auth/snapchat/start")
        assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
        data = r.json()
        assert "auth_url" in data
        url = data["auth_url"]
        parsed = urlparse(url)
        assert parsed.scheme == "https"
        assert "snapchat.com" in parsed.netloc, f"unexpected host: {parsed.netloc}"
        assert "/accounts/oauth2/auth" in parsed.path
        qs = parse_qs(parsed.query)
        # Required OAuth2 PKCE params
        for key in ("client_id", "redirect_uri", "scope", "state",
                    "code_challenge", "code_challenge_method", "response_type"):
            assert key in qs, f"missing {key} in auth_url"
        assert qs["response_type"][0] == "code"
        assert qs["code_challenge_method"][0] == "S256"
        # PKCE challenge is base64url SHA256 — ~43 chars, no padding
        assert re.match(r"^[A-Za-z0-9_-]{40,64}$", qs["code_challenge"][0])
        # Real production client id (per .env)
        assert qs["client_id"][0].startswith("383e7c1e-")
        # Snap scopes
        scope = qs["scope"][0]
        assert "user.display_name" in scope
        assert "user.bitmoji.avatar" in scope
        assert "user.external_id" in scope
        # Redirect URI must point at our callback
        assert qs["redirect_uri"][0].endswith("/auth/snapchat/callback")

    def test_snap_callback_rejects_unknown_state(self, http):
        r = http.post(f"{API}/auth/snapchat/callback",
                      json={"code": "fake_code_xyz", "state": "bogus_state_value"})
        assert r.status_code == 400, f"expected 400 got {r.status_code} {r.text[:200]}"

    def test_snap_callback_rejects_missing_fields(self, http):
        r = http.post(f"{API}/auth/snapchat/callback", json={"code": "x"})
        assert r.status_code == 422
        r2 = http.post(f"{API}/auth/snapchat/callback", json={})
        assert r2.status_code == 422


# ----------------------------- Push Notifications -----------------------------
class TestPushTokens:
    def test_push_register_requires_auth(self):
        # Fresh session — no cookies — to avoid reusing admin token from session-scoped http fixture
        r = requests.post(f"{API}/push/register",
                          json={"expo_token": "ExponentPushToken[anonymous]"},
                          headers={"Content-Type": "application/json"})
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"

    def test_push_register_validates_token_length(self, user_client):
        r = user_client.post(f"{API}/push/register", json={"expo_token": "short"})
        assert r.status_code == 422, f"{r.status_code} {r.text[:200]}"

    def test_push_register_upserts(self, user_client, test_user):
        token = f"ExponentPushToken[TEST_{uuid.uuid4().hex}]"
        r1 = user_client.post(f"{API}/push/register",
                              json={"expo_token": token, "platform": "ios"})
        assert r1.status_code == 200, f"{r1.status_code} {r1.text[:200]}"
        assert r1.json().get("success") is True
        # Re-register same token (upsert) — should not 409
        r2 = user_client.post(f"{API}/push/register",
                              json={"expo_token": token, "platform": "ios"})
        assert r2.status_code == 200
        assert r2.json().get("success") is True
        # store on test_user for later cleanup
        test_user["expo_token"] = token

    def test_push_unregister_requires_auth(self):
        # Fresh session — no cookies
        r = requests.delete(f"{API}/push/unregister",
                            params={"expo_token": "anything"},
                            headers={"Content-Type": "application/json"})
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"

    def test_push_unregister_works(self, user_client, test_user):
        token = test_user.get("expo_token") or f"ExponentPushToken[TEST_{uuid.uuid4().hex}]"
        # ensure it exists first
        user_client.post(f"{API}/push/register",
                         json={"expo_token": token, "platform": "android"})
        r = user_client.delete(f"{API}/push/unregister",
                               params={"expo_token": token})
        assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
        assert r.json().get("success") is True


# ----------------------------- Admin broadcast w/ push -----------------------------
class TestAdminBroadcastWithPush:
    def test_broadcast_returns_push_devices_count(self, admin_client, user_client, test_user):
        # register a push token for our test user so push_devices > 0 for `target=all`
        token = f"ExponentPushToken[TEST_brd_{uuid.uuid4().hex}]"
        reg = user_client.post(f"{API}/push/register",
                               json={"expo_token": token, "platform": "android"})
        assert reg.status_code == 200

        r = admin_client.post(f"{API}/admin/notifications/broadcast", json={
            "title": "TEST_iter8_broadcast",
            "body": "Testing push integration in broadcast",
            "target": "all",
        })
        assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
        data = r.json()
        assert "sent" in data
        assert "target" in data and data["target"] == "all"
        assert "push_devices" in data, f"push_devices missing in response: {data}"
        assert isinstance(data["push_devices"], int)
        assert data["push_devices"] >= 1, f"expected >=1 push device, got {data}"

        # cleanup
        user_client.delete(f"{API}/push/unregister", params={"expo_token": token})

    def test_broadcast_requires_admin(self, user_client):
        r = user_client.post(f"{API}/admin/notifications/broadcast",
                             json={"title": "nope", "body": "nope", "target": "all"})
        assert r.status_code in (401, 403)


# ----------------------------- Regression (Session 7+8) -----------------------------
class TestRegression:
    def test_login_admin(self, http):
        r = http.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json().get("user", {}).get("role") == "admin"

    def test_register_and_login_flow(self, http):
        email = f"TEST_reg8_{uuid.uuid4().hex[:8]}@example.com"
        password = "RegTest@2026"
        phone = f"5{uuid.uuid4().int % 10**8:08d}"
        r = http.post(f"{API}/auth/register", json={
            "name": "Reg Tester", "email": email, "password": password,
            "phone": phone, "country_code": "SA",
        })
        assert r.status_code in (200, 201)
        r2 = http.post(f"{API}/auth/login", json={"email": email, "password": password})
        assert r2.status_code == 200

    def test_forgot_password(self, http):
        r = http.post(f"{API}/auth/forgot-password",
                      json={"email": ADMIN_EMAIL})
        assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"

    def test_x_oauth_start_still_works(self, http):
        r = http.get(f"{API}/auth/x/start")
        assert r.status_code == 200
        url = r.json().get("auth_url", "")
        assert "twitter.com" in url or "x.com" in url

    def test_x_callback_unknown_state(self, http):
        r = http.post(f"{API}/auth/x/callback",
                      json={"code": "fake", "state": "unknown_state_xxx"})
        assert r.status_code == 400

    def test_meta_categories(self, http):
        r = http.get(f"{API}/meta/categories")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_meta_countries(self, http):
        r = http.get(f"{API}/meta/countries")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
