"""
Iteration 12 backend tests:
- Follow Sellers (POST /api/sellers/{id}/follow toggle, GET follow-status)
- Watches (POST /api/watches, DELETE /api/watches/{listing_id}, GET /api/watches)
- Price-drop notification trigger on PUT /api/listings/{id}
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASS = "Admin@HarajPlus2026"


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    token = r.json().get("token") or r.json().get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def watcher_session():
    """Register a fresh non-admin user (the watcher/follower)."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_iter12_watcher_{suffix}@example.com"
    # SA phone format per server: 9 digits starting with 5 (no +966 prefix)
    digits = "".join([c for c in uuid.uuid4().hex if c.isdigit()])[:8].ljust(8, "1")
    phone = f"5{digits}"
    payload = {
        "email": email,
        "password": "Watcher@2026Pass",
        "name": f"TEST Watcher {suffix}",
        "phone": phone,
        "country_code": "SA",
    }
    r = s.post(f"{API}/auth/register", json=payload)
    assert r.status_code in (200, 201), f"register failed {r.status_code}: {r.text}"
    token = r.json().get("token") or r.json().get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200
    s._user = me.json()
    s._email = email
    return s


@pytest.fixture(scope="module")
def admin_listing(admin_session):
    """Create a listing owned by admin so non-admin watcher can follow / watch it."""
    payload = {
        "title": f"TEST_iter12_listing_{uuid.uuid4().hex[:6]}",
        "description": "TEST listing for price-drop notifications testing iteration 12",
        "category": "cars",
        "category_key": "cars",
        "price": 10000,
        "currency": "SAR",
        "country_code": "SA",
        "city": "Riyadh",
        "condition": "used",
        "images": ["https://via.placeholder.com/400"],
    }
    r = admin_session.post(f"{API}/listings", json=payload)
    assert r.status_code in (200, 201), f"create listing failed {r.status_code} {r.text}"
    j = r.json()
    lid = j.get("id") or j.get("_id") or j.get("listing", {}).get("id")
    assert lid, f"no id in response: {j}"
    yield {"id": lid, "owner_id": j.get("user_id"), "price": payload["price"]}
    # cleanup
    try:
        admin_session.delete(f"{API}/listings/{lid}")
    except Exception:
        pass


# ---------- Follow Seller ----------
class TestFollowSellers:
    def test_follow_seller_toggle_on(self, watcher_session, admin_listing):
        seller_id = admin_listing["owner_id"]
        assert seller_id, "admin listing has no owner_id"
        r = watcher_session.post(f"{API}/sellers/{seller_id}/follow")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("following") is True

        # GET status
        r2 = watcher_session.get(f"{API}/sellers/{seller_id}/follow-status")
        assert r2.status_code == 200
        assert r2.json().get("following") is True

    def test_follow_seller_toggle_off(self, watcher_session, admin_listing):
        seller_id = admin_listing["owner_id"]
        r = watcher_session.post(f"{API}/sellers/{seller_id}/follow")
        assert r.status_code == 200
        assert r.json().get("following") is False

        r2 = watcher_session.get(f"{API}/sellers/{seller_id}/follow-status")
        assert r2.status_code == 200
        assert r2.json().get("following") is False

    def test_cannot_follow_self(self, admin_session):
        me = admin_session.get(f"{API}/auth/me").json()
        r = admin_session.post(f"{API}/sellers/{me['id']}/follow")
        assert r.status_code == 400


# ---------- Watches ----------
class TestWatches:
    def test_create_watch(self, watcher_session, admin_listing):
        r = watcher_session.post(f"{API}/watches", json={"listing_id": admin_listing["id"]})
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

        r2 = watcher_session.get(f"{API}/watches")
        assert r2.status_code == 200
        ids = [w["listing_id"] for w in r2.json()]
        assert admin_listing["id"] in ids

    def test_cannot_watch_own_listing(self, admin_session, admin_listing):
        r = admin_session.post(f"{API}/watches", json={"listing_id": admin_listing["id"]})
        assert r.status_code == 400

    def test_delete_watch(self, watcher_session, admin_listing):
        # ensure exists first (idempotent upsert)
        watcher_session.post(f"{API}/watches", json={"listing_id": admin_listing["id"]})
        r = watcher_session.delete(f"{API}/watches/{admin_listing['id']}")
        assert r.status_code == 200
        r2 = watcher_session.get(f"{API}/watches")
        ids = [w["listing_id"] for w in r2.json()]
        assert admin_listing["id"] not in ids


# ---------- Price-Drop Notification Trigger ----------
class TestPriceDropTrigger:
    def test_price_drop_creates_notification_for_watcher(
        self, admin_session, watcher_session, admin_listing
    ):
        # 1. watcher subscribes to the listing
        r = watcher_session.post(f"{API}/watches", json={"listing_id": admin_listing["id"]})
        assert r.status_code == 200, r.text

        # 2. snapshot watcher's notifications BEFORE
        before = watcher_session.get(f"{API}/notifications").json()
        before_count = sum(1 for n in before if n.get("type") == "price_drop"
                           and n.get("data", {}).get("listing_id") == admin_listing["id"])

        # 3. admin (owner) drops price by 30% (10000 -> 7000) - well above 1% threshold
        new_price = 7000
        r = admin_session.put(
            f"{API}/listings/{admin_listing['id']}",
            json={"price": new_price},
        )
        assert r.status_code == 200, f"update listing failed: {r.status_code} {r.text}"
        assert r.json().get("price") == new_price

        # 4. give backend a moment to flush notification insert
        time.sleep(1.0)

        # 5. watcher should see a NEW price_drop notification
        after = watcher_session.get(f"{API}/notifications").json()
        matching = [
            n for n in after
            if n.get("type") == "price_drop"
            and n.get("data", {}).get("listing_id") == admin_listing["id"]
        ]
        assert len(matching) > before_count, (
            f"No new price_drop notification for watcher. before={before_count} after={len(matching)} "
            f"all={after}"
        )

        # 6. Verify content
        n = matching[0]
        assert n["user_id"] == watcher_session._user["id"]
        assert n["data"]["new_price"] == new_price
        assert n["data"]["old_price"] >= new_price
        assert n.get("read") is False

    def test_owner_does_not_get_self_notification(
        self, admin_session, admin_listing
    ):
        """Owner should NEVER receive a price_drop notification for their own listing."""
        admin_id = admin_session.get(f"{API}/auth/me").json()["id"]
        notifs = admin_session.get(f"{API}/notifications").json()
        self_drop = [
            n for n in notifs
            if n.get("type") == "price_drop"
            and n.get("data", {}).get("listing_id") == admin_listing["id"]
            and n.get("user_id") == admin_id
        ]
        assert len(self_drop) == 0, "Owner received own price_drop notification (should be excluded)"
