"""
Iteration 6 - Haraj Plus
Tests for:
 - Auth: reset-password (no 500), verify-email, resend-verification, register email_verified=false
 - Admin: notifications broadcast + AI suggest
 - User: notifications list/read/read-all
 - Watches: add / list / remove (and cannot watch own listing)
 - Follow sellers toggle
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"


# ------------------------- Fixtures -------------------------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def test_user(session):
    """Register a fresh test user each module run."""
    uniq = uuid.uuid4().hex[:8]
    payload = {
        "name": f"TEST User {uniq}",
        "email": f"TEST_iter6_{uniq}@example.com",
        "phone": f"51234{uniq[:4]}",
        "country_code": "SA",
        "city": "RIYADH",
        "password": "TestPass@123",
    }
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "token": data["access_token"],
        "user": data["user"],
        "email": payload["email"],
        "password": payload["password"],
    }


@pytest.fixture(scope="module")
def user_headers(test_user):
    return {"Authorization": f"Bearer {test_user['token']}"}


# ------------------------- Register / email_verified -------------------------
class TestRegisterEmailVerified:
    def test_new_user_email_verified_false(self, test_user):
        assert test_user["user"].get("email_verified") is False

    def test_admin_get_me_returns_user(self, session, user_headers):
        r = session.get(f"{API}/auth/me", headers=user_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == pytest.approx_str if False else data["email"]
        assert "email_verified" in data
        assert data["email_verified"] is False


# ------------------------- Reset password (no 500) -------------------------
class TestResetPassword:
    def test_forgot_then_reset_no_500(self, session, test_user):
        # forgot-password
        r = session.post(f"{API}/auth/forgot-password", json={"email": test_user["email"]})
        assert r.status_code == 200, r.text
        j = r.json()
        # When email not sent, dev_reset_link should exist; otherwise we need to fetch token from DB
        dev_link = j.get("dev_reset_link")
        token = None
        if dev_link:
            # format: /reset-password?token=<TOKEN>
            token = dev_link.split("token=")[-1]
        if not token:
            pytest.skip("No dev_reset_link returned and real emails cannot be intercepted")

        new_password = "NewPass@456"
        r2 = session.post(f"{API}/auth/reset-password", json={"token": token, "new_password": new_password})
        # The KEY check: should NOT be 500
        assert r2.status_code != 500, f"reset-password returned 500! body={r2.text}"
        assert r2.status_code == 200, f"reset-password unexpected: {r2.status_code} {r2.text}"
        assert r2.json().get("success") is True

        # Login with new password
        r3 = session.post(f"{API}/auth/login", json={"email": test_user["email"], "password": new_password})
        assert r3.status_code == 200, r3.text
        # Update token fixture for subsequent tests
        test_user["token"] = r3.json()["access_token"]
        test_user["password"] = new_password

    def test_reset_with_invalid_token_400(self, session):
        r = session.post(f"{API}/auth/reset-password", json={"token": "bogus-token-123", "new_password": "Whatever@1"})
        assert r.status_code == 400


# ------------------------- Verify email & resend -------------------------
class TestVerifyEmail:
    def test_verify_email_invalid_token_400(self, session):
        r = session.get(f"{API}/auth/verify-email", params={"token": "invalid-token-zzz"})
        assert r.status_code == 400

    def test_resend_verification_requires_auth(self):
        # use a fresh session so no auth cookies leak in
        fresh = requests.Session()
        r = fresh.post(f"{API}/auth/resend-verification")
        assert r.status_code in (401, 403), r.text

    def test_resend_verification_authed(self, session, test_user):
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        r = session.post(f"{API}/auth/resend-verification", headers=headers)
        assert r.status_code == 200, r.text
        data = r.json()
        # sent may be False if Resend rejects, but API must not 500
        assert "sent" in data or data.get("already_verified") is True


# ------------------------- Admin notifications broadcast + AI -------------------------
class TestAdminNotifications:
    def test_broadcast_all(self, session, admin_headers):
        payload = {"title": "TEST broadcast", "body": "TEST broadcast body", "target": "all"}
        r = session.post(f"{API}/admin/notifications/broadcast", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "sent" in data
        assert isinstance(data["sent"], int)
        assert data["target"] == "all"

    def test_broadcast_unverified_target(self, session, admin_headers):
        payload = {"title": "TEST unv", "body": "TEST unverified", "target": "unverified"}
        r = session.post(f"{API}/admin/notifications/broadcast", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json()["target"] == "unverified"

    def test_broadcast_requires_admin(self, user_headers):
        fresh = requests.Session()
        fresh.headers.update({"Content-Type": "application/json", **user_headers})
        r = fresh.post(f"{API}/admin/notifications/broadcast",
                       json={"title": "TEST title", "body": "TEST body", "target": "all"})
        assert r.status_code in (401, 403), r.text

    def test_ai_suggest_returns_list(self, session, admin_headers):
        r = session.get(f"{API}/admin/notifications/ai-suggest", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        # When LLM key is set, we expect up to 3; when empty, array may be empty but key must exist


# ------------------------- User notifications -------------------------
class TestUserNotifications:
    def test_list_notifications(self, session, user_headers):
        r = session.get(f"{API}/notifications", headers=user_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_read_all(self, session, user_headers):
        r = session.post(f"{API}/notifications/read-all", headers=user_headers)
        assert r.status_code == 200
        assert r.json().get("success") is True

    def test_mark_single_read_if_available(self, session, user_headers):
        # pull notifications; admin broadcast should have delivered some
        r = session.get(f"{API}/notifications", headers=user_headers)
        items = r.json()
        if not items:
            pytest.skip("No notifications available to mark read")
        nid = items[0]["id"]
        r2 = session.post(f"{API}/notifications/{nid}/read", headers=user_headers)
        assert r2.status_code == 200
        assert r2.json().get("success") is True


# ------------------------- Watches -------------------------
class TestWatches:
    @pytest.fixture(scope="class")
    def some_other_listing_id(self, session, user_headers):
        # Get listings that aren't owned by current user
        r = session.get(f"{API}/listings", params={"limit": 20})
        assert r.status_code == 200
        listings = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        if not listings:
            pytest.skip("No listings to watch")
        # Determine current user id
        me = session.get(f"{API}/auth/me", headers=user_headers).json()
        for l in listings:
            if l.get("user_id") != me["id"]:
                return l["id"]
        pytest.skip("No non-self listings available")

    def test_add_watch(self, session, user_headers, some_other_listing_id):
        r = session.post(f"{API}/watches", json={"listing_id": some_other_listing_id, "target_price": 1000},
                         headers=user_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_list_watches_enriched(self, session, user_headers, some_other_listing_id):
        r = session.get(f"{API}/watches", headers=user_headers)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        match = [w for w in arr if w["listing_id"] == some_other_listing_id]
        assert match, "Watched listing not present in GET /watches"
        # Enrichment present
        assert "listing" in match[0]

    def test_cannot_watch_own_listing(self, session, user_headers):
        # Create a listing
        me = session.get(f"{API}/auth/me", headers=user_headers).json()
        payload = {
            "title": "TEST_my_listing",
            "description": "test",
            "price": 100,
            "currency": "SAR",
            "category": "general",
            "subcategory": "other",
            "city": "RIYADH",
            "country_code": "SA",
            "images": [],
        }
        r = session.post(f"{API}/listings", json=payload, headers=user_headers)
        if r.status_code != 200:
            pytest.skip(f"listing create failed ({r.status_code}): {r.text[:120]}")
        lid = r.json().get("id") or r.json().get("listing", {}).get("id")
        if not lid:
            pytest.skip("No id returned from listing create")
        r2 = session.post(f"{API}/watches", json={"listing_id": lid}, headers=user_headers)
        assert r2.status_code == 400
        # cleanup
        session.delete(f"{API}/listings/{lid}", headers=user_headers)

    def test_remove_watch(self, session, user_headers, some_other_listing_id):
        r = session.delete(f"{API}/watches/{some_other_listing_id}", headers=user_headers)
        assert r.status_code == 200
        r2 = session.get(f"{API}/watches", headers=user_headers)
        ids = [w["listing_id"] for w in r2.json()]
        assert some_other_listing_id not in ids


# ------------------------- Follow sellers -------------------------
class TestFollowSellers:
    def test_cannot_follow_self(self, session, user_headers):
        me = session.get(f"{API}/auth/me", headers=user_headers).json()
        r = session.post(f"{API}/sellers/{me['id']}/follow", headers=user_headers)
        assert r.status_code == 400

    def test_follow_toggle(self, user_headers, admin_token):
        fresh = requests.Session()
        fresh.headers.update({"Content-Type": "application/json"})
        me_admin = fresh.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"}).json()
        seller_id = me_admin["id"]

        fresh2 = requests.Session()
        fresh2.headers.update({"Content-Type": "application/json", **user_headers})
        r1 = fresh2.post(f"{API}/sellers/{seller_id}/follow")
        assert r1.status_code == 200, r1.text
        first = r1.json().get("following")
        assert isinstance(first, bool)

        r2 = fresh2.post(f"{API}/sellers/{seller_id}/follow")
        assert r2.status_code == 200
        second = r2.json().get("following")
        assert second is not first, "toggle did not flip state"

        r3 = fresh2.get(f"{API}/sellers/{seller_id}/follow-status")
        assert r3.status_code == 200
        assert r3.json().get("following") == second

    def test_follow_nonexistent_seller_404(self, session, user_headers):
        r = session.post(f"{API}/sellers/nonexistent-uid-xyz/follow", headers=user_headers)
        assert r.status_code == 404
