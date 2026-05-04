"""
Iteration 4 — Tests for:
1. AI Smart Pricing Badge: GET /api/ai/price-badge/{listing_id}
2. Forgot-password with real RESEND_API_KEY (key owner gets email_sent=True; others get dev_reset_link)
3. Quick regression sweep on Session 3 features (translate, listing CRUD/republish/mark-sold, location-share, auctions)
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fall back to reading frontend/.env so pytest can be invoked via pytest path/ directly
    try:
        with open("/app/frontend/.env") as f:
            for ln in f:
                if ln.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = ln.split("=", 1)[1].strip().strip('"').rstrip("/")
                    break
    except Exception:
        pass
assert BASE_URL, "REACT_APP_BACKEND_URL not set"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"
RESEND_OWNER_EMAIL = "obaid08642@gmail.com"


# ============================================================
# Fixtures
# ============================================================
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def real_listing_id():
    """An active+approved listing with a price."""
    r = requests.get(f"{BASE_URL}/api/listings", params={"limit": 5})
    assert r.status_code == 200
    items = r.json().get("items", [])
    for it in items:
        if it.get("price") and it.get("moderation") == "approved" and it.get("status") == "active":
            return it["id"]
    pytest.skip("No active+approved listing with price available for badge test")


# ============================================================
# 1. AI Smart Pricing Badge
# ============================================================
class TestPriceBadge:
    def test_badge_nonexistent_returns_null(self):
        r = requests.get(f"{BASE_URL}/api/ai/price-badge/nonexistent-id-xyz-9999")
        assert r.status_code == 200
        data = r.json()
        assert data.get("badge") is None

    def test_badge_for_real_listing_classifies(self, real_listing_id):
        r = requests.get(f"{BASE_URL}/api/ai/price-badge/{real_listing_id}")
        assert r.status_code == 200
        data = r.json()
        # If sample size insufficient, badge=null with reason
        if data.get("badge") is None:
            assert "reason" in data, "Expected reason key when badge is null with insufficient samples"
            return
        assert data["badge"] in ("deal", "fair", "high")
        # Required fields
        for k in ("label", "sub", "color", "icon", "samples"):
            assert k in data, f"Missing key: {k}"
        assert data["color"] in ("emerald", "blue", "amber")
        assert isinstance(data["samples"], int) and data["samples"] >= 3
        assert isinstance(data["label"], str) and len(data["label"]) > 0

    def test_badge_color_matches_classification(self, real_listing_id):
        r = requests.get(f"{BASE_URL}/api/ai/price-badge/{real_listing_id}")
        data = r.json()
        if not data.get("badge"):
            pytest.skip("No classification produced")
        mapping = {"deal": "emerald", "fair": "blue", "high": "amber"}
        assert data["color"] == mapping[data["badge"]]


# ============================================================
# 2. Forgot Password with real RESEND_API_KEY
# ============================================================
class TestForgotPassword:
    def test_forgot_for_resend_owner_email_sent_true(self, session):
        """Resend free tier ONLY sends to the API key owner — should return email_sent=True."""
        # First: ensure user exists or register
        # Try forgot-password directly (server returns generic message even if user not found)
        r = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": RESEND_OWNER_EMAIL})
        assert r.status_code == 200
        data = r.json()
        # If owner is not registered, server returns email_sent=False with no link.
        # We need to register them first to get a real attempt.
        if data.get("email_sent") is False and data.get("dev_reset_link") is None:
            # User not registered — register and retry
            reg = session.post(f"{BASE_URL}/api/auth/register", json={
                "email": RESEND_OWNER_EMAIL,
                "password": "TempPass#2026",
                "name": "TEST_Resend_Owner",
                "country_code": "SA",
                "phone": "+966500099999",
            })
            # Either succeeds (200/201) or already exists
            assert reg.status_code in (200, 201, 400, 409), f"register: {reg.status_code} {reg.text}"
            r = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": RESEND_OWNER_EMAIL})
            assert r.status_code == 200
            data = r.json()
        # For Resend key owner, expect email_sent=True (real email delivery)
        assert data.get("email_sent") is True, f"Expected email_sent=True for Resend key owner, got: {data}"
        assert data.get("dev_reset_link") is None, "dev_reset_link must be None when email is sent"

    def test_forgot_for_other_email_returns_dev_link(self, session):
        """Non-owner email cannot receive real Resend free-tier email; expect email_sent=False + dev link."""
        # Use admin email — guaranteed to exist
        r = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL})
        assert r.status_code == 200
        data = r.json()
        assert data.get("email_sent") is False, f"Expected email_sent=False for non-Resend-owner, got: {data}"
        link = data.get("dev_reset_link")
        assert link and link.startswith("/reset-password?token="), f"Expected dev_reset_link, got: {data}"

    def test_forgot_unknown_email_safe_response(self, session):
        r = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "TEST_unknown_user_9999@example.com"})
        assert r.status_code == 200
        data = r.json()
        # Generic message — should not leak existence
        assert "message" in data
        assert data.get("email_sent") is False
        assert data.get("dev_reset_link") is None


# ============================================================
# 3. Regression — Session 3 features quick sweep
# ============================================================
class TestRegression:
    def test_listings_list_works(self):
        r = requests.get(f"{BASE_URL}/api/listings", params={"limit": 3})
        assert r.status_code == 200
        assert "items" in r.json()

    def test_ai_translate_endpoint(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/ai/translate",
            headers=admin_headers,
            json={"text": "مرحبا كيف حالك", "target_lang": "en"},
        )
        # Must return 200 with translation; allow up to 30s for AI
        assert r.status_code == 200, f"translate failed: {r.status_code} {r.text[:200]}"
        d = r.json()
        assert "translated" in d or "text" in d or "translation" in d

    def test_ai_image_search_validation_rejects_short(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/ai/image-search",
            headers=admin_headers,
            json={"image_b64": "abc"},
        )
        assert r.status_code in (400, 422), f"Expected validation error, got {r.status_code}"

    def test_auctions_active_endpoint(self):
        r = requests.get(f"{BASE_URL}/api/auctions/active", params={"country_code": "SA"})
        assert r.status_code == 200
        # Should be a list (possibly empty)
        body = r.json()
        assert isinstance(body, (list, dict))

    def test_admin_login_still_works(self, admin_token):
        # If admin_token fixture succeeded, login works.
        assert admin_token

    def test_me_endpoint(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert r.status_code == 200
        u = r.json()
        assert u.get("email") == ADMIN_EMAIL
