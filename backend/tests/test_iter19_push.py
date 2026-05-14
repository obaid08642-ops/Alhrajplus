"""
Iteration 19 - Push Notifications (Expo + Web Push/VAPID) + OAuth regression tests.
Targets:
  - GET  /api/push/web/vapid-public-key (no auth)
  - POST /api/push/web/subscribe / unsubscribe (auth)
  - POST /api/push/register / DELETE /api/push/unregister (auth)
  - GET/PUT /api/push/preferences (auth, defaults + merge)
  - POST /api/push/test (auth)
  - POST /api/admin/notifications/broadcast (admin)
  - POST /api/chat/send → db.notifications row for receiver
  - POST /api/admin/listings/{id}/approve|reject → notifications
  - Regression: /api/auth/google/start, /api/auth/x/start, /api/auth/snapchat/start
  - mobile_redirect support on /api/auth/x/start
  - GET /api/listings still works
  - GET /api/chat/messages/{convo_id} still works
  - Perf: chat/send + admin approve/reject under 2s
Backend base URL: REACT_APP_BACKEND_URL from frontend/.env.
"""
import os
import time
import base64
import uuid

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE_URL = "https://platform-inspect.preview.emergentagent.com"
ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "haraj_plus_db")


# ---------------- Fixtures ----------------

@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Disable cookie storage entirely → forces every endpoint to authenticate via
    # the Authorization: Bearer header alone (prevents cookie cross-contamination).
    from http.cookiejar import DefaultCookiePolicy
    s.cookies.set_policy(DefaultCookiePolicy(allowed_domains=[]))
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("access_token") or r.json().get("token")
    if not tok:
        pytest.skip("no token")
    # IMPORTANT: clear cookies so Bearer-only behaviour is consistent across tests.
    api.cookies.clear()
    return tok


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def admin_id(api, admin_headers):
    r = api.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
    assert r.status_code == 200, r.text
    return r.json()["id"]


@pytest.fixture(scope="session")
def user_b():
    """Register a second user (receiver for chat tests) using a SEPARATE session
    so its cookies do not contaminate the admin session."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    from http.cookiejar import DefaultCookiePolicy
    s.cookies.set_policy(DefaultCookiePolicy(allowed_domains=[]))
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_push_{suffix}@example.com"
    # Random 9-digit phone to avoid phone-uniqueness collision across runs
    phone = "5" + str(uuid.uuid4().int)[:8]
    payload = {
        "name": f"TEST Push {suffix}",
        "email": email,
        "password": "Passw0rd!2026",
        "phone": phone,
        "country_code": "SA",
    }
    r = s.post(f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code not in (200, 201):
        pytest.skip(f"register failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    if not tok:
        rl = s.post(f"{BASE_URL}/api/auth/login",
                    json={"email": email, "password": payload["password"]})
        tok = rl.json().get("access_token") or rl.json().get("token")
    s.cookies.clear()
    h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    me = s.get(f"{BASE_URL}/api/auth/me", headers=h)
    return {"email": email, "token": tok, "headers": h, "id": me.json()["id"], "session": s}


# ---------------- 1. VAPID public key ----------------

class TestVapid:
    def test_vapid_public_key_no_auth(self, api):
        r = api.get(f"{BASE_URL}/api/push/web/vapid-public-key")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "public_key" in data
        pub = data["public_key"]
        assert isinstance(pub, str) and len(pub) > 60
        # Should be url-safe base64 (no padding, no + or /)
        assert "+" not in pub and "/" not in pub and "=" not in pub
        # Decode → 65 bytes (uncompressed P-256 public key starts with 0x04)
        padded = pub + "=" * (-len(pub) % 4)
        raw = base64.urlsafe_b64decode(padded)
        assert len(raw) == 65
        assert raw[0] == 0x04


# ---------------- 2. Web push subscribe/unsubscribe ----------------

class TestWebPush:
    SUB = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/TEST_endpoint_iter19_" + uuid.uuid4().hex[:8],
        "keys": {"p256dh": "BHFakeP256dhKeyForTestingPurposesOnly1234567890abcdef", "auth": "fakeAuthSecret1234"},
        "user_agent": "pytest/iter19",
    }

    def test_subscribe_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/push/web/subscribe", json=self.SUB)
        assert r.status_code in (401, 403)

    def test_subscribe_with_auth(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/push/web/subscribe", json=self.SUB, headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_unsubscribe(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/push/web/unsubscribe", json=self.SUB, headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True


# ---------------- 3. Expo token register/unregister ----------------

class TestExpoToken:
    TOKEN = "ExponentPushToken[TEST_iter19_" + uuid.uuid4().hex[:12] + "]"

    def test_register_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/push/register",
                     json={"expo_token": self.TOKEN, "platform": "ios"})
        assert r.status_code in (401, 403)

    def test_register(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/push/register",
                     json={"expo_token": self.TOKEN, "platform": "ios"}, headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_unregister(self, api, admin_headers):
        r = api.delete(f"{BASE_URL}/api/push/unregister?expo_token={self.TOKEN}",
                       headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True


# ---------------- 4. Preferences GET (defaults) / PUT (merge) ----------------

class TestPreferences:
    def test_defaults_all_true(self, api, user_b):
        """First-call GET on a fresh user should return all prefs = True."""
        r = api.get(f"{BASE_URL}/api/push/preferences", headers=user_b["headers"])
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("messages", "listing_status", "deals", "watchlist", "broadcasts", "comments"):
            assert data.get(k) is True, f"{k} should default True; got {data}"

    def test_partial_merge(self, api, user_b):
        # Flip two prefs
        r = api.put(f"{BASE_URL}/api/push/preferences",
                    json={"messages": False, "broadcasts": False},
                    headers=user_b["headers"])
        assert r.status_code == 200, r.text
        # Read back
        r2 = api.get(f"{BASE_URL}/api/push/preferences", headers=user_b["headers"])
        d = r2.json()
        assert d["messages"] is False
        assert d["broadcasts"] is False
        # Untouched ones still true
        assert d["listing_status"] is True
        assert d["deals"] is True
        assert d["watchlist"] is True
        assert d["comments"] is True
        # Restore so other tests see defaults again
        api.put(f"{BASE_URL}/api/push/preferences",
                json={"messages": True, "broadcasts": True},
                headers=user_b["headers"])


# ---------------- 5. Test push endpoint ----------------

class TestPushTest:
    def test_push_test_returns_delivered_counts(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/push/test", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("success") is True
        assert "delivered" in d
        assert "expo" in d["delivered"] and "web" in d["delivered"]
        # Counts should be ints >= 0 (admin has no real device — both 0 is fine)
        assert isinstance(d["delivered"]["expo"], int)
        assert isinstance(d["delivered"]["web"], int)


# ---------------- 6. Admin broadcast ----------------

class TestBroadcast:
    def test_broadcast_admin(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/admin/notifications/broadcast",
                     json={"title": "TEST_iter19 Broadcast", "body": "test broadcast payload",
                           "target": "all"},
                     headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "sent" in d
        assert isinstance(d["sent"], int) and d["sent"] >= 1
        assert d.get("target") == "all"
        assert "push_devices" in d

    def test_broadcast_requires_admin(self, api, user_b):
        r = api.post(f"{BASE_URL}/api/admin/notifications/broadcast",
                     json={"title": "x", "body": "y", "target": "all"},
                     headers=user_b["headers"])
        assert r.status_code in (401, 403)


# ---------------- 7. Chat send creates notification ----------------

class TestChatNotification:
    def test_chat_send_inserts_notification_for_receiver(self, api, admin_headers, admin_id, user_b):
        """POST /api/chat/send → check db.notifications has new_message for receiver."""
        text = f"TEST_iter19 chat ping {uuid.uuid4().hex[:6]}"
        t0 = time.time()
        r = api.post(f"{BASE_URL}/api/chat/send",
                     json={"receiver_id": user_b["id"], "text": text},
                     headers=admin_headers)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        msg = r.json()
        # _id should NOT be present (mongo objectid excluded)
        assert "_id" not in msg
        assert msg["text"] == text
        # Perf: push fan-out is create_task → call should be non-blocking
        assert elapsed < 2.0, f"chat/send took {elapsed:.2f}s (>2s budget)"

        # Poll Mongo via Motor for the notification (insert is synchronous before push fan-out)
        async def _check():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            # small wait — server inserts synchronously, but allow propagation
            for _ in range(10):
                doc = await db.notifications.find_one(
                    {"user_id": user_b["id"], "type": "new_message",
                     "body": text[:80]},
                    {"_id": 0},
                )
                if doc:
                    client.close()
                    return doc
                await asyncio.sleep(0.2)
            client.close()
            return None

        doc = asyncio.get_event_loop().run_until_complete(_check()) if not _has_running_loop() else _run_async(_check())
        assert doc is not None, "expected db.notifications row for receiver was not found"
        assert doc["type"] == "new_message"
        assert doc.get("data", {}).get("sender_id") == admin_id


def _has_running_loop() -> bool:
    try:
        asyncio.get_running_loop()
        return True
    except RuntimeError:
        return False


def _run_async(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


# ---------------- 8. Admin approve/reject create notifications ----------------

class TestAdminListingNotifications:
    @pytest.fixture(scope="class")
    def seller_listings(self, api, user_b):
        """user_b creates 2 listings, then we force them to moderation='pending'
        via Mongo so admin approve/reject actually transitions state and triggers
        the notification insert."""
        ids = []
        for label in ("approve", "reject"):
            payload = {
                "title": f"TEST_iter19_{label} {uuid.uuid4().hex[:6]}",
                "description": "iter19 push test listing",
                "category": "personal",
                "subcategory": "misc",
                "city": "Riyadh",
                "country_code": "SA",
                "price": 100,
                "currency": "SAR",
                "images": [],
            }
            r = api.post(f"{BASE_URL}/api/listings", json=payload, headers=user_b["headers"])
            assert r.status_code in (200, 201), r.text
            ids.append(r.json()["id"])

        # Force moderation=pending so admin approve/reject has work to do.
        async def _force_pending():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            await db.listings.update_many(
                {"id": {"$in": ids}},
                {"$set": {"moderation": "pending", "status": "pending"}},
            )
            client.close()
        _run_async(_force_pending())

        yield ids
        # cleanup
        for lid in ids:
            api.delete(f"{BASE_URL}/api/listings/{lid}", headers=user_b["headers"])

    def test_approve_creates_notification(self, api, admin_headers, user_b, seller_listings):
        lid = seller_listings[0]
        t0 = time.time()
        r = api.post(f"{BASE_URL}/api/admin/listings/{lid}/approve", headers=admin_headers)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        assert r.json().get("updated", 0) >= 0
        assert elapsed < 2.0, f"approve took {elapsed:.2f}s"

        async def _check():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            for _ in range(10):
                doc = await db.notifications.find_one(
                    {"user_id": user_b["id"], "type": "listing_approved",
                     "data.listing_id": lid},
                    {"_id": 0},
                )
                if doc:
                    client.close()
                    return doc
                await asyncio.sleep(0.2)
            client.close()
            return None

        doc = _run_async(_check())
        assert doc is not None, "expected listing_approved notification"

    def test_reject_creates_notification(self, api, admin_headers, user_b, seller_listings):
        lid = seller_listings[1]
        t0 = time.time()
        r = api.post(f"{BASE_URL}/api/admin/listings/{lid}/reject", headers=admin_headers)
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text
        assert elapsed < 2.0, f"reject took {elapsed:.2f}s"

        async def _check():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            for _ in range(10):
                doc = await db.notifications.find_one(
                    {"user_id": user_b["id"], "type": "listing_rejected",
                     "data.listing_id": lid},
                    {"_id": 0},
                )
                if doc:
                    client.close()
                    return doc
                await asyncio.sleep(0.2)
            client.close()
            return None

        doc = _run_async(_check())
        assert doc is not None, "expected listing_rejected notification"


# ---------------- 9. OAuth regression ----------------

class TestOAuthRegression:
    def test_google_start(self, api):
        r = api.get(f"{BASE_URL}/api/auth/google/start")
        # 200 → auth_url; 503 only if GOOGLE_CLIENT_ID is unset (allowed)
        assert r.status_code in (200, 503), r.text
        if r.status_code == 200:
            assert "accounts.google.com" in r.json().get("auth_url", "")

    def test_x_start(self, api):
        r = api.get(f"{BASE_URL}/api/auth/x/start")
        assert r.status_code in (200, 503), r.text
        if r.status_code == 200:
            url = r.json().get("auth_url", "")
            assert "twitter.com/i/oauth2/authorize" in url
            assert "code_challenge=" in url
            assert "state=" in url

    def test_x_start_with_mobile_redirect(self, api):
        r = api.get(f"{BASE_URL}/api/auth/x/start",
                    params={"mobile_redirect": "harajplus://auth/callback"})
        assert r.status_code in (200, 503), r.text
        if r.status_code == 200:
            url = r.json().get("auth_url", "")
            # With mobile_redirect → redirect_uri must point at BACKEND callback-redirect
            assert "callback-redirect" in url, f"expected backend redirect_uri, got: {url}"

    def test_snap_start(self, api):
        r = api.get(f"{BASE_URL}/api/auth/snapchat/start")
        assert r.status_code in (200, 503), r.text
        if r.status_code == 200:
            url = r.json().get("auth_url", "")
            assert "snapchat.com" in url or "accounts.snapchat" in url


# ---------------- 10. Listings + Chat polling regression ----------------

class TestRoutingRegression:
    def test_listings_route(self, api):
        r = api.get(f"{BASE_URL}/api/listings")
        assert r.status_code == 200, r.text
        body = r.json()
        # Existing shape is dict with items
        assert isinstance(body, (list, dict))

    def test_chat_messages_polling(self, api, admin_headers, admin_id, user_b):
        # ensure a message exists
        api.post(f"{BASE_URL}/api/chat/send",
                 json={"receiver_id": user_b["id"], "text": "poll-test"},
                 headers=admin_headers)
        convo_id = "_".join(sorted([admin_id, user_b["id"]]))
        r = api.get(f"{BASE_URL}/api/chat/messages/{convo_id}", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        # _id should not leak
        for m in data:
            assert "_id" not in m
