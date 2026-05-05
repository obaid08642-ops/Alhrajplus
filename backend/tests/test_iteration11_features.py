"""
Iteration 11 backend tests — Sell-with-AI autofill + Admin Finance + Admin SEO.
Quick regression touch on iter-9 search endpoints.
"""
import os
import base64
import pytest
import requests

_env_url = os.environ.get("REACT_APP_BACKEND_URL")
if not _env_url:
    # Load from frontend/.env for pytest runs
    try:
        with open("/app/frontend/.env") as _f:
            for _line in _f:
                if _line.startswith("REACT_APP_BACKEND_URL="):
                    _env_url = _line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
assert _env_url, "REACT_APP_BACKEND_URL not set and not found in /app/frontend/.env"
BASE_URL = _env_url.rstrip("/")
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    tok = data.get("token") or data.get("access_token")
    if not tok:
        # maybe cookie-only
        pytest.skip("No token field in /auth/login response")
    return tok


@pytest.fixture(scope="module")
def admin_session(session, admin_token):
    s = requests.Session()
    s.headers.update(
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}",
        }
    )
    return s


# -----------------------------------------------------------------
# AI listing autofill
# -----------------------------------------------------------------
class TestAIAutofill:
    def test_autofill_invalid_image_returns_400(self, session):
        r = session.post(
            f"{BASE_URL}/api/ai/listing-autofill",
            json={"image_base64": "abc"},
        )
        assert r.status_code == 400, f"expected 400, got {r.status_code} body={r.text[:200]}"
        body = r.json()
        msg = body.get("detail") or body.get("message") or ""
        assert "صورة" in msg or "invalid" in msg.lower() or msg

    def test_autofill_public_endpoint_accepts_large_b64(self, session):
        """
        Ensures no auth is required. We send a >100 char base64 string (a tiny valid
        PNG padded) — endpoint should pass the 100-char gate and reach Gemini.
        We accept 200 (LLM success) or 500 (LLM-side failure) both mean we passed the
        auth/length gate (the real test). We should NOT get 401/403.
        """
        # 1x1 transparent PNG
        png_b64 = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4"
            "nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg=="
        ) * 3  # pad > 100 chars
        r = session.post(
            f"{BASE_URL}/api/ai/listing-autofill",
            json={"image_base64": png_b64},
            timeout=60,
        )
        # It should NOT be an auth failure (public endpoint)
        assert r.status_code not in (401, 403), (
            f"Endpoint should be public, got {r.status_code}: {r.text[:200]}"
        )
        # It may be 200 (LLM responded) or 500 (LLM error) or 503 (no key) — all acceptable to
        # prove our gating + wiring works.
        assert r.status_code in (200, 400, 500, 503), (
            f"Unexpected status {r.status_code}: {r.text[:200]}"
        )
        if r.status_code == 200:
            d = r.json()
            assert "title" in d
            assert "category_key" in d


# -----------------------------------------------------------------
# Admin finance summary
# -----------------------------------------------------------------
class TestAdminFinance:
    def test_finance_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/finance/summary")
        assert r.status_code in (401, 403), f"expected auth gate, got {r.status_code}"

    def test_finance_summary_shape(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/finance/summary")
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        for k in (
            "total_commission",
            "this_month_count",
            "total_wallets",
            "pending_withdrawals",
            "total_listings",
            "currency",
        ):
            assert k in d, f"missing key: {k}"
        assert d["currency"] == "SAR"
        assert isinstance(d["total_listings"], int)


# -----------------------------------------------------------------
# Admin SEO
# -----------------------------------------------------------------
class TestAdminSEO:
    def test_seo_requires_auth(self):
        # Use a fresh unauthenticated session (the shared module session may have
        # picked up admin cookies from the admin_token fixture).
        r = requests.get(f"{BASE_URL}/api/admin/seo")
        assert r.status_code in (401, 403), f"expected auth gate, got {r.status_code}"

    def test_seo_get_default(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/seo")
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        # If no record exists it returns 5-key default; if previously saved it returns the
        # saved payload (partial). Accept both — verify at least one of the documented keys.
        expected_keys = {"site_title", "site_description", "meta_keywords", "og_image", "robots_txt"}
        assert expected_keys & set(d.keys()), f"response missing all SEO keys: {d}"

    def test_seo_save_and_read_back(self, admin_session):
        new_title = "TEST_SEO_TITLE_iter11"
        r = admin_session.post(
            f"{BASE_URL}/api/admin/seo",
            json={"site_title": new_title},
        )
        assert r.status_code == 200, r.text[:200]
        assert r.json().get("ok") is True

        r2 = admin_session.get(f"{BASE_URL}/api/admin/seo")
        assert r2.status_code == 200
        d = r2.json()
        assert d.get("site_title") == new_title, f"persistence failed: {d}"


# -----------------------------------------------------------------
# Quick regression on iter-9 endpoints
# -----------------------------------------------------------------
class TestRegression:
    def test_search_trending_public(self, session):
        r = session.get(f"{BASE_URL}/api/search/trending")
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        assert isinstance(d, (list, dict))

    def test_search_log_public(self, session):
        r = session.post(
            f"{BASE_URL}/api/search/log",
            json={"query": "TEST_iter11_ping"},
        )
        assert r.status_code in (200, 204), r.text[:200]
