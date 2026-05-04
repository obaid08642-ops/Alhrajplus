"""
Haraj Plus — Iteration 3 tests for newly added features:
- POST /api/ai/translate (Gemini) + translation caching
- POST /api/ai/image-search (validation + Gemini vision)
- PUT /api/listings/{id} (auth + ownership)
- POST /api/listings/{id}/republish (24h guard + success via DB patch)
- POST /api/listings/{id}/mark-sold (owner-only)
- POST /api/chat/location-share (+ GET + /stop)
- Regression: auth, listings CRUD, auctions, forgot-password, Google
"""
import os
import uuid
import base64
import pytest
import requests
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "haraj_plus_db")


# ---------- Fixtures ----------
def _register(name_prefix: str):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_{name_prefix}_{suffix}@example.com"
    payload = {
        "name": f"TEST {name_prefix}",
        "email": email,
        "password": "StrongPass@123",
        "phone": f"5{uuid.uuid4().int % 100000000:08d}",
        "country_code": "SA",
    }
    r = s.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    s._email = email
    s._user_id = data["user"]["id"]
    return s


@pytest.fixture(scope="module")
def owner_session():
    return _register("owner")


@pytest.fixture(scope="module")
def other_session():
    return _register("other")


def _create_listing(sess, title="TEST إعلان اختبار", category="cars"):
    r = requests.post(f"{API}/listings", json={
        "title": title,
        "description": "وصف للاختبار — " + uuid.uuid4().hex[:6],
        "price": 10000,
        "category": category,
        "subcategory": "sedan",
        "city": "الرياض",
    }, headers={"Authorization": sess.headers["Authorization"]}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


# ============ AI Translate ============
class TestAITranslate:
    def test_translate_arabic_to_english_returns_text(self):
        payload = {"text": "مرحبا كيف حالك اليوم", "target_lang": "en"}
        r = requests.post(f"{API}/ai/translate", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "text" in data
        assert isinstance(data["text"], str) and len(data["text"]) > 0
        assert data.get("cached") in (False, True)

    def test_translate_second_call_returns_cached(self):
        unique = f"شكرا لك على المساعدة {uuid.uuid4().hex[:6]}"
        p = {"text": unique, "target_lang": "en"}
        r1 = requests.post(f"{API}/ai/translate", json=p, timeout=60)
        assert r1.status_code == 200, r1.text
        r2 = requests.post(f"{API}/ai/translate", json=p, timeout=30)
        assert r2.status_code == 200, r2.text
        assert r2.json().get("cached") is True
        assert r2.json()["text"] == r1.json()["text"]

    def test_translate_unsupported_language_returns_400(self):
        r = requests.post(f"{API}/ai/translate", json={"text": "hello", "target_lang": "zz"}, timeout=15)
        assert r.status_code == 400

    def test_translate_missing_text_returns_422(self):
        r = requests.post(f"{API}/ai/translate", json={"target_lang": "en"}, timeout=15)
        assert r.status_code == 422


# ============ AI Image Search ============
class TestAIImageSearch:
    def test_image_search_missing_field_returns_422(self):
        r = requests.post(f"{API}/ai/image-search", json={}, timeout=15)
        assert r.status_code == 422

    def test_image_search_tiny_image_returns_400(self):
        # 10 chars of base64 is definitely too small (< 100)
        r = requests.post(f"{API}/ai/image-search", json={"image_base64": "AAAA"}, timeout=15)
        assert r.status_code == 400

    def test_image_search_tiny_image_with_dataurl_prefix_returns_400(self):
        r = requests.post(f"{API}/ai/image-search", json={"image_base64": "data:image/png;base64,AAAA"}, timeout=15)
        assert r.status_code == 400


# ============ Listings Update / Republish / Mark Sold ============
class TestListingEdit:
    def test_update_listing_no_auth_returns_401(self, owner_session):
        l = _create_listing(owner_session, "TEST cars أوليّ")
        r = requests.put(f"{API}/listings/{l['id']}", json={"title": "hack"}, timeout=15)
        assert r.status_code == 401

    def test_update_listing_other_user_returns_403(self, owner_session, other_session):
        l = _create_listing(owner_session, "TEST عنوان أصلي")
        r = requests.put(
            f"{API}/listings/{l['id']}",
            json={"title": "TEST عنوان مسروق"},
            headers={"Authorization": other_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 403

    def test_update_listing_as_owner_updates_fields(self, owner_session):
        l = _create_listing(owner_session, "TEST عنوان قبل التعديل")
        new_title = "TEST عنوان بعد التعديل"
        r = requests.put(
            f"{API}/listings/{l['id']}",
            json={"title": new_title, "price": 99999},
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["title"] == new_title
        assert r.json()["price"] == 99999
        # Persistence via GET
        g = requests.get(f"{API}/listings/{l['id']}", timeout=15)
        assert g.status_code == 200
        assert g.json()["title"] == new_title
        assert g.json()["price"] == 99999

    def test_update_listing_empty_body_returns_400(self, owner_session):
        l = _create_listing(owner_session, "TEST empty body")
        r = requests.put(
            f"{API}/listings/{l['id']}",
            json={},
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 400

    def test_update_listing_not_found_returns_404(self, owner_session):
        r = requests.put(
            f"{API}/listings/{uuid.uuid4()}",
            json={"title": "x"},
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 404


class TestRepublish:
    def test_republish_within_24h_returns_400(self, owner_session):
        l = _create_listing(owner_session, "TEST republish fresh")
        r = requests.post(
            f"{API}/listings/{l['id']}/republish",
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 400
        # Should indicate remaining hours
        assert "ساعة" in r.text or "24" in r.text

    def test_republish_other_user_returns_403(self, owner_session, other_session):
        l = _create_listing(owner_session, "TEST republish other")
        r = requests.post(
            f"{API}/listings/{l['id']}/republish",
            headers={"Authorization": other_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 403

    def test_republish_not_found_returns_404(self, owner_session):
        r = requests.post(
            f"{API}/listings/{uuid.uuid4()}/republish",
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 404

    def test_republish_success_after_db_patch_25h_ago(self, owner_session):
        l = _create_listing(owner_session, "TEST republish success")
        # Patch created_at to 25 hours ago via motor
        async def _patch():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            past = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
            await db.listings.update_one(
                {"id": l["id"]},
                {"$set": {"created_at": past, "last_republished_at": past}},
            )
            client.close()
        asyncio.get_event_loop().run_until_complete(_patch())
        r = requests.post(
            f"{API}/listings/{l['id']}/republish",
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["success"] is True


class TestMarkSold:
    def test_mark_sold_owner_success(self, owner_session):
        l = _create_listing(owner_session, "TEST mark sold")
        r = requests.post(
            f"{API}/listings/{l['id']}/mark-sold",
            headers={"Authorization": owner_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Persistence via GET
        g = requests.get(f"{API}/listings/{l['id']}", timeout=15)
        assert g.status_code == 200
        assert g.json()["status"] == "sold"

    def test_mark_sold_other_user_returns_403(self, owner_session, other_session):
        l = _create_listing(owner_session, "TEST mark sold wrong user")
        r = requests.post(
            f"{API}/listings/{l['id']}/mark-sold",
            headers={"Authorization": other_session.headers["Authorization"]},
            timeout=15,
        )
        assert r.status_code == 403

    def test_mark_sold_no_auth_returns_401(self, owner_session):
        l = _create_listing(owner_session, "TEST mark sold no auth")
        r = requests.post(f"{API}/listings/{l['id']}/mark-sold", timeout=15)
        assert r.status_code == 401


# ============ Live Location Sharing ============
class TestLocationShare:
    def test_share_requires_auth(self):
        r = requests.post(f"{API}/chat/location-share",
                          json={"receiver_id": "x", "lat": 1, "lng": 1}, timeout=15)
        assert r.status_code == 401

    def test_share_to_self_returns_400(self, owner_session):
        r = requests.post(f"{API}/chat/location-share",
                          json={"receiver_id": owner_session._user_id, "lat": 24.7, "lng": 46.7},
                          headers={"Authorization": owner_session.headers["Authorization"]},
                          timeout=15)
        assert r.status_code == 400

    def test_share_unknown_receiver_returns_404(self, owner_session):
        r = requests.post(f"{API}/chat/location-share",
                          json={"receiver_id": str(uuid.uuid4()), "lat": 24.7, "lng": 46.7},
                          headers={"Authorization": owner_session.headers["Authorization"]},
                          timeout=15)
        assert r.status_code == 404

    def test_share_creates_doc_and_message(self, owner_session, other_session):
        r = requests.post(f"{API}/chat/location-share",
                          json={"receiver_id": other_session._user_id, "lat": 24.7, "lng": 46.7, "duration_minutes": 15},
                          headers={"Authorization": owner_session.headers["Authorization"]},
                          timeout=15)
        assert r.status_code == 200, r.text
        share = r.json()
        assert share["sender_id"] == owner_session._user_id
        assert share["receiver_id"] == other_session._user_id
        assert share["active"] is True
        assert "id" in share
        # Verify chat message created with live_share_id via GET messages
        convo_id = "_".join(sorted([owner_session._user_id, other_session._user_id]))
        m = requests.get(f"{API}/chat/messages/{convo_id}",
                         headers={"Authorization": owner_session.headers["Authorization"]}, timeout=15)
        assert m.status_code == 200
        msgs = m.json()
        assert any(
            (x.get("location") or {}).get("live_share_id") == share["id"]
            for x in msgs
        ), "No chat message was created containing location.live_share_id"

        # GET share as sender
        g1 = requests.get(f"{API}/chat/location-share/{share['id']}",
                          headers={"Authorization": owner_session.headers["Authorization"]}, timeout=15)
        assert g1.status_code == 200
        # GET share as receiver
        g2 = requests.get(f"{API}/chat/location-share/{share['id']}",
                          headers={"Authorization": other_session.headers["Authorization"]}, timeout=15)
        assert g2.status_code == 200
        # GET share as a third user -> 403
        third = _register("third")
        g3 = requests.get(f"{API}/chat/location-share/{share['id']}",
                          headers={"Authorization": third.headers["Authorization"]}, timeout=15)
        assert g3.status_code == 403

        # STOP: only sender can stop
        s_other = requests.post(f"{API}/chat/location-share/{share['id']}/stop",
                                headers={"Authorization": other_session.headers["Authorization"]}, timeout=15)
        assert s_other.status_code == 403
        s_owner = requests.post(f"{API}/chat/location-share/{share['id']}/stop",
                                headers={"Authorization": owner_session.headers["Authorization"]}, timeout=15)
        assert s_owner.status_code == 200
        assert s_owner.json()["success"] is True

        # After stop, active should be False
        g_after = requests.get(f"{API}/chat/location-share/{share['id']}",
                               headers={"Authorization": owner_session.headers["Authorization"]}, timeout=15)
        assert g_after.status_code == 200
        assert g_after.json()["active"] is False


# ============ Regression ============
class TestRegression:
    def test_admin_login(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "admin@harajplus.com", "password": "Admin@HarajPlus2026",
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_listings_list(self):
        r = requests.get(f"{API}/listings", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data

    def test_auctions_active(self):
        r = requests.get(f"{API}/auctions/active", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_forgot_password_dev_link(self, owner_session):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": owner_session._email}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("email_sent") is False
        assert isinstance(d.get("dev_reset_link"), str)

    def test_google_empty_session_rejected(self):
        r = requests.post(f"{API}/auth/google", json={"session_id": ""}, timeout=15)
        assert r.status_code in (400, 422)

    def test_listing_delete_requires_auth(self):
        r = requests.delete(f"{API}/listings/{uuid.uuid4()}", timeout=15)
        assert r.status_code == 401
