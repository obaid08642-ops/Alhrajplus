"""
Iteration 20 — WhatsApp-style real-time chat module (WebSocket).

Targets:
  - WebSocket /api/ws/chat?token=<jwt>: accept + ping/pong
  - WebSocket bad/missing token → close 4401
  - POST /api/chat/send: returns 200, body has sender meta + reply_to
  - POST /api/chat/send: WS broadcast to receiver AND sender (both connected)
  - WS 'typing' event from A → delivered to B
  - WS 'read' event from A: marks messages where receiver_id=A read=true, notifies peer
  - GET  /api/chat/presence/{user_id}: online true when WS alive, else false + last_seen
  - On WS disconnect: db.users.last_seen updated
  - GET  /api/notifications: sorted desc by created_at|ts (admin)
  - POST /api/notifications/{id}/read marks one as read
  - POST /api/notifications/read-all marks all as read
  - Regression: GET /api/listings (200), GET /api/push/web/vapid-public-key (200)
  - Performance: /api/chat/send completes in < 2s with WS broadcast

Backend base URL: from frontend/.env REACT_APP_BACKEND_URL. WS URL uses wss://.
"""
import os
import time
import json
import uuid
import asyncio
from http.cookiejar import DefaultCookiePolicy
from urllib.parse import urlparse

import pytest
import requests
import websockets
from websockets.exceptions import ConnectionClosed, InvalidStatus
from motor.motor_asyncio import AsyncIOMotorClient

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------
BASE_URL = "https://platform-inspect.preview.emergentagent.com"
parsed = urlparse(BASE_URL)
WS_BASE = f"wss://{parsed.netloc}/api/ws/chat"

ADMIN_EMAIL = "admin@harajplus.com"
ADMIN_PASSWORD = "Admin@HarajPlus2026"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "haraj_plus_db")


# --------------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------------
def _bearer_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # Force Bearer-only auth across the suite — prevents cookie cross-contamination
    s.cookies.set_policy(DefaultCookiePolicy(allowed_domains=[]))
    return s


@pytest.fixture(scope="session")
def api():
    return _bearer_session()


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text[:200]}")
    tok = r.json().get("access_token") or r.json().get("token")
    if not tok:
        pytest.skip("no admin token")
    api.cookies.clear()
    return tok


def _register_user(email_prefix: str):
    """Register a fresh user via /api/auth/register and return (user_id, token, session)."""
    s = _bearer_session()
    rand = uuid.uuid4().hex[:10]
    email = f"test_{email_prefix}_{rand}@gmail.com"
    # Phone derived from uuid → unique
    phone = "5" + rand[:8]
    payload = {
        "name": f"Test {email_prefix} {rand[:4]}",
        "email": email,
        "password": "TestPass@2026",
        "phone": phone,
        "country_code": "SA",
    }
    r = s.post(f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code not in (200, 201):
        pytest.skip(f"register failed for {email_prefix}: {r.status_code} {r.text[:200]}")
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    user = data.get("user") or {}
    uid = user.get("id")
    if not tok or not uid:
        # try /auth/me
        s.headers["Authorization"] = f"Bearer {tok}"
        me = s.get(f"{BASE_URL}/api/auth/me")
        if me.status_code == 200:
            uid = me.json().get("id")
    s.headers["Authorization"] = f"Bearer {tok}"
    s.cookies.clear()
    return uid, tok, s


@pytest.fixture(scope="session")
def user_a():
    uid, tok, sess = _register_user("a")
    return {"id": uid, "token": tok, "session": sess}


@pytest.fixture(scope="session")
def user_b():
    uid, tok, sess = _register_user("b")
    return {"id": uid, "token": tok, "session": sess}


# --------------------------------------------------------------------------
# WebSocket helpers
# --------------------------------------------------------------------------
async def _ws_connect(token: str):
    """Open a WS to /api/ws/chat?token=... and return the connection."""
    url = f"{WS_BASE}?token={token}"
    return await websockets.connect(url, open_timeout=10, ping_interval=None)


async def _recv_json(ws, timeout: float = 5.0):
    raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
    try:
        return json.loads(raw)
    except Exception:
        return {"_raw": raw}


async def _drain(ws, ms: float = 0.3):
    """Drain any pending messages (presence broadcasts etc.) for `ms` seconds."""
    end = asyncio.get_event_loop().time() + ms
    msgs = []
    while asyncio.get_event_loop().time() < end:
        try:
            msgs.append(await asyncio.wait_for(ws.recv(), timeout=0.1))
        except asyncio.TimeoutError:
            break
        except Exception:
            break
    return [json.loads(m) if isinstance(m, str) else m for m in msgs]


# --------------------------------------------------------------------------
# Tests — WebSocket lifecycle
# --------------------------------------------------------------------------
class TestWebSocketLifecycle:
    def test_ws_connects_and_pongs(self, user_a):
        async def run():
            ws = await _ws_connect(user_a["token"])
            try:
                await _drain(ws, ms=0.2)  # consume any presence broadcasts
                await ws.send(json.dumps({"type": "ping"}))
                msg = await _recv_json(ws, timeout=5)
                # presence broadcasts may interleave — loop until we see pong
                tries = 0
                while msg.get("type") != "pong" and tries < 5:
                    msg = await _recv_json(ws, timeout=5)
                    tries += 1
                assert msg.get("type") == "pong", f"expected pong, got {msg}"
            finally:
                await ws.close()
        asyncio.run(run())

    def test_ws_rejects_missing_token(self):
        async def run():
            closed_code = None
            try:
                ws = await websockets.connect(WS_BASE, open_timeout=10, ping_interval=None)
                try:
                    await asyncio.wait_for(ws.recv(), timeout=5)
                except ConnectionClosed as cc:
                    closed_code = cc.code
                finally:
                    await ws.close()
            except InvalidStatus as e:
                closed_code = getattr(e.response, "status_code", None)
            except Exception as e:
                closed_code = repr(e)
            return closed_code
        code = asyncio.run(run())
        assert code in (4401, 401, 403), f"expected 4401/401/403, got {code}"

    def test_ws_rejects_bad_token(self):
        async def run():
            bad = "eyJhbGciOiJIUzI1NiJ9.bad.signature"
            closed_code = None
            try:
                ws = await websockets.connect(f"{WS_BASE}?token={bad}",
                                              open_timeout=10, ping_interval=None)
                try:
                    await asyncio.wait_for(ws.recv(), timeout=5)
                except ConnectionClosed as cc:
                    closed_code = cc.code
                finally:
                    await ws.close()
            except InvalidStatus as e:
                closed_code = getattr(e.response, "status_code", None)
            return closed_code
        code = asyncio.run(run())
        assert code in (4401, 401, 403), f"expected 4401/401/403, got {code}"


# --------------------------------------------------------------------------
# Tests — chat/send broadcast & shape
# --------------------------------------------------------------------------
class TestChatSendBroadcast:
    def test_send_returns_200_with_sender_and_reply_to(self, user_a, user_b):
        # reply_to is a dict snapshot {id, text, sender_name, ...}
        reply_snap = {"id": "msg_12345", "text": "original", "sender_name": "x"}
        body = {
            "receiver_id": user_b["id"],
            "text": "hello with reply",
            "reply_to": reply_snap,
        }
        t0 = time.time()
        r = user_a["session"].post(f"{BASE_URL}/api/chat/send", json=body)
        elapsed = time.time() - t0
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"
        data = r.json()
        assert data.get("reply_to") == reply_snap, f"reply_to mismatch: {data.get('reply_to')}"
        sender = data.get("sender") or {}
        assert sender.get("id") == user_a["id"]
        assert "name" in sender
        # perf
        assert elapsed < 2.0, f"chat/send took {elapsed:.2f}s (>=2s)"

    def test_send_broadcasts_to_receiver_and_sender_ws(self, user_a, user_b):
        async def run():
            ws_a = await _ws_connect(user_a["token"])
            ws_b = await _ws_connect(user_b["token"])
            try:
                await _drain(ws_a, ms=0.4)
                await _drain(ws_b, ms=0.4)
                text = f"hello-{uuid.uuid4().hex[:6]}"
                # Send via REST in a thread so we can await WS events concurrently
                async def do_send():
                    return await asyncio.to_thread(
                        user_a["session"].post,
                        f"{BASE_URL}/api/chat/send",
                        json={"receiver_id": user_b["id"], "text": text},
                    )
                send_task = asyncio.create_task(do_send())

                async def wait_message(ws):
                    for _ in range(8):
                        msg = await _recv_json(ws, timeout=5)
                        if msg.get("type") == "message":
                            return msg
                    return None

                got_b = await wait_message(ws_b)
                got_a = await wait_message(ws_a)
                r = await send_task
                assert r.status_code == 200
                assert got_b is not None and got_b["data"]["text"] == text, f"receiver did not get WS msg: {got_b}"
                assert got_a is not None and got_a["data"]["text"] == text, f"sender did not get WS msg (echo): {got_a}"
                # delivered receipt should reach sender too (peer was online)
                delivered_seen = False
                for _ in range(4):
                    try:
                        m = await _recv_json(ws_a, timeout=2)
                    except asyncio.TimeoutError:
                        break
                    if m.get("type") == "delivered":
                        delivered_seen = True
                        break
                assert delivered_seen, "sender did not receive 'delivered' receipt"
            finally:
                await ws_a.close()
                await ws_b.close()
        asyncio.run(run())


# --------------------------------------------------------------------------
# Tests — typing & read events
# --------------------------------------------------------------------------
class TestTypingAndRead:
    def test_typing_event_fanout(self, user_a, user_b):
        async def run():
            ws_a = await _ws_connect(user_a["token"])
            ws_b = await _ws_connect(user_b["token"])
            try:
                await _drain(ws_a, ms=0.3)
                await _drain(ws_b, ms=0.3)
                await ws_a.send(json.dumps({"type": "typing", "to": user_b["id"], "is_typing": True}))
                got = None
                for _ in range(6):
                    msg = await _recv_json(ws_b, timeout=4)
                    if msg.get("type") == "typing":
                        got = msg
                        break
                assert got is not None, "B did not receive typing event"
                assert got.get("from") == user_a["id"]
                assert got.get("is_typing") is True
            finally:
                await ws_a.close()
                await ws_b.close()
        asyncio.run(run())

    def test_read_event_marks_messages_and_notifies_peer(self, user_a, user_b):
        # Pre-create at least one unread message: A → B
        text = f"toread-{uuid.uuid4().hex[:6]}"
        r = user_a["session"].post(f"{BASE_URL}/api/chat/send",
                                   json={"receiver_id": user_b["id"], "text": text})
        assert r.status_code == 200
        msg = r.json()
        convo_id = msg["convo_id"]
        msg_id = msg["id"]

        async def run():
            ws_a = await _ws_connect(user_a["token"])
            ws_b = await _ws_connect(user_b["token"])
            try:
                await _drain(ws_a, ms=0.3)
                await _drain(ws_b, ms=0.3)
                # B reads
                await ws_b.send(json.dumps({"type": "read", "convo_id": convo_id}))
                got = None
                for _ in range(6):
                    m = await _recv_json(ws_a, timeout=4)
                    if m.get("type") == "read":
                        got = m
                        break
                assert got is not None, "A did not receive read receipt"
                assert got.get("convo_id") == convo_id
                assert got.get("by") == user_b["id"]
            finally:
                await ws_a.close()
                await ws_b.close()
        asyncio.run(run())

        # DB-level assertion: message read=true
        async def check_db():
            client = AsyncIOMotorClient(MONGO_URL)
            try:
                db = client[DB_NAME]
                doc = await db.messages.find_one({"id": msg_id})
                assert doc is not None, "message not persisted"
                assert doc.get("read") is True, f"message not marked read: {doc}"
            finally:
                client.close()
        asyncio.run(check_db())


# --------------------------------------------------------------------------
# Tests — presence
# --------------------------------------------------------------------------
class TestPresence:
    def test_presence_online_then_offline_updates_last_seen(self, user_a, user_b):
        # Initially user_b may be offline (no live WS in this test)
        async def run():
            # Open WS for B, presence should be online
            ws_b = await _ws_connect(user_b["token"])
            try:
                await _drain(ws_b, ms=0.3)
                r = user_a["session"].get(f"{BASE_URL}/api/chat/presence/{user_b['id']}")
                assert r.status_code == 200, r.text
                assert r.json().get("online") is True, f"expected online=true, got {r.json()}"
            finally:
                await ws_b.close()
            # Give server a moment to process disconnect + persist last_seen
            await asyncio.sleep(0.8)
            r2 = user_a["session"].get(f"{BASE_URL}/api/chat/presence/{user_b['id']}")
            assert r2.status_code == 200
            j = r2.json()
            assert j.get("online") is False, f"expected online=false after disconnect, got {j}"
            # last_seen should be set (ISO string)
            assert j.get("last_seen"), f"expected last_seen to be set, got {j}"
        asyncio.run(run())


# --------------------------------------------------------------------------
# Tests — Notifications API
# --------------------------------------------------------------------------
class TestNotifications:
    def test_list_sorted_desc(self, api, admin_token):
        api.headers["Authorization"] = f"Bearer {admin_token}"
        r = api.get(f"{BASE_URL}/api/notifications?limit=50")
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        # If we have ≥2 items, verify desc sort by created_at|ts
        def _key(it):
            return it.get("created_at") or it.get("ts") or ""
        keys = [_key(i) for i in items if _key(i)]
        assert keys == sorted(keys, reverse=True), "notifications not sorted desc by created_at|ts"

    def test_mark_one_read_and_read_all(self, api, admin_token, user_a, user_b):
        # Generate a fresh notification for user_b by sending offline (close WS) →
        # actually B is offline in this test (no WS open). chat/send will create notif.
        text = f"notif-{uuid.uuid4().hex[:6]}"
        r = user_a["session"].post(f"{BASE_URL}/api/chat/send",
                                   json={"receiver_id": user_b["id"], "text": text})
        assert r.status_code == 200
        # B fetches notifications
        user_b["session"].headers["Authorization"] = f"Bearer {user_b['token']}"
        r2 = user_b["session"].get(f"{BASE_URL}/api/notifications?limit=50")
        assert r2.status_code == 200
        items = r2.json()
        assert isinstance(items, list)
        if not items:
            pytest.skip("no notifications were created for receiver (peer was online?)")
        unread = [n for n in items if not n.get("read")]
        if unread:
            nid = unread[0]["id"]
            r3 = user_b["session"].post(f"{BASE_URL}/api/notifications/{nid}/read")
            assert r3.status_code == 200
            # Verify it is now read
            r4 = user_b["session"].get(f"{BASE_URL}/api/notifications?limit=50")
            after = next((n for n in r4.json() if n["id"] == nid), None)
            assert after is not None and after.get("read") is True
        # mark all read
        r5 = user_b["session"].post(f"{BASE_URL}/api/notifications/read-all")
        assert r5.status_code == 200
        r6 = user_b["session"].get(f"{BASE_URL}/api/notifications?limit=50")
        any_unread = any(not n.get("read") for n in r6.json())
        assert not any_unread, "expected all notifications to be marked read"


# --------------------------------------------------------------------------
# Tests — regression
# --------------------------------------------------------------------------
class TestRegression:
    def test_listings_endpoint(self, api):
        r = api.get(f"{BASE_URL}/api/listings?limit=5")
        assert r.status_code == 200
        body = r.json()
        # API returns either a list (legacy) or {items, total} (paged)
        items = body if isinstance(body, list) else body.get("items")
        assert isinstance(items, list), f"unexpected listings shape: {body}"

    def test_push_vapid_public_key(self, api):
        r = api.get(f"{BASE_URL}/api/push/web/vapid-public-key")
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, dict)
        # Accept either snake_case or camelCase
        key = body.get("public_key") or body.get("publicKey")
        assert key, f"no vapid public key in response: {body}"

    def test_auth_me_works(self, user_a):
        r = user_a["session"].get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json().get("id") == user_a["id"]
