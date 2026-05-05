"""Iteration 7 — X (Twitter) OAuth 2.0 PKCE backend tests + regression for auth."""
import os
import re
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend/.env directly since pytest runs without the frontend's env loaded
    import pathlib
    env = pathlib.Path("/app/frontend/.env").read_text()
    m = re.search(r"REACT_APP_BACKEND_URL=(.+)", env)
    BASE_URL = (m.group(1).strip() if m else "").rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- X OAuth (PKCE) ----------
class TestXOAuth:
    def test_x_start_returns_auth_url(self, session):
        r = session.get(f"{API}/auth/x/start", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "auth_url" in data
        url = data["auth_url"]
        assert url.startswith("https://twitter.com/i/oauth2/authorize")
        # PKCE + state + scope + redirect_uri present
        assert "code_challenge=" in url
        assert "code_challenge_method=S256" in url
        assert "state=" in url
        assert "client_id=" in url
        assert "redirect_uri=" in url
        assert "scope=tweet.read" in url and "users.read" in url

    def test_x_start_state_uniqueness(self, session):
        r1 = session.get(f"{API}/auth/x/start").json()
        r2 = session.get(f"{API}/auth/x/start").json()
        s1 = re.search(r"state=([^&]+)", r1["auth_url"]).group(1)
        s2 = re.search(r"state=([^&]+)", r2["auth_url"]).group(1)
        assert s1 != s2, "state must be unique per /auth/x/start call"

    def test_x_callback_invalid_state_400(self, session):
        r = session.post(
            f"{API}/auth/x/callback",
            json={"code": "fake_code_abc", "state": "this-state-does-not-exist"},
            timeout=10,
        )
        assert r.status_code == 400, r.text

    def test_x_callback_missing_fields_422(self, session):
        r = session.post(f"{API}/auth/x/callback", json={}, timeout=10)
        assert r.status_code in (400, 422), r.text

    def test_x_callback_missing_code_422(self, session):
        r = session.post(f"{API}/auth/x/callback", json={"state": "x"}, timeout=10)
        assert r.status_code in (400, 422), r.text


# ---------- Regression: existing auth ----------
class TestAuthRegression:
    def test_health(self, session):
        r = session.get(f"{API}/meta/categories", timeout=10)
        assert r.status_code == 200

    def test_forgot_password_no_500(self, session):
        # random email — should not 500 (returns generic 200 + dev link if no Resend)
        email = f"noone_{uuid.uuid4().hex[:8]}@example.com"
        r = session.post(f"{API}/auth/forgot-password", json={"email": email}, timeout=15)
        assert r.status_code in (200, 204), r.text

    def test_register_and_login(self, session):
        email = f"TEST_iter7_{uuid.uuid4().hex[:8]}@example.com"
        password = "TestPass@2026"
        import random
        phone = "5" + "".join(str(random.randint(0, 9)) for _ in range(8))
        payload = {
            "name": "Iter7 Tester",
            "email": email,
            "password": password,
            "phone": phone,
            "country_code": "SA",
            "city": "الرياض",
        }
        r = session.post(f"{API}/auth/register", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("user", {}).get("email", "").lower() == email.lower()

        # Login with the new password
        r2 = requests.post(
            f"{API}/auth/login",
            json={"email": email, "password": password},
            timeout=15,
        )
        assert r2.status_code == 200, r2.text
        assert "user" in r2.json()

    def test_admin_login(self, session):
        r = requests.post(
            f"{API}/auth/login",
            json={"email": "admin@harajplus.com", "password": "Admin@HarajPlus2026"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        u = r.json().get("user") or {}
        assert u.get("role") == "admin"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
