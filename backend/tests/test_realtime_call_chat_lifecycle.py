from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class _Result:
    inserted_id = "x"


class _Messages:
    def __init__(self):
        self.docs = {}

    async def update_one(self, query, update, upsert=False):
        key = query.get("id")
        current = self.docs.get(key, {})
        current.update(update.get("$set", {}))
        self.docs[key] = current
        return _Result()


class _TimelineDb:
    def __init__(self):
        self.messages = _Messages()


class _Hub:
    def __init__(self):
        self.events = []

    async def send_to_user(self, user_id, event):
        self.events.append((user_id, event))
        return 1


class _UsersQuery:
    async def to_list(self, length):
        return [
            {"id": "u1", "country_code": "SA", "banned": False},
            {"id": "u2", "country_code": "SA", "banned": False},
        ]


class _FirstCallCollection:
    def __init__(self):
        self.docs = {}

    async def find_one(self, query, projection=None):
        return self.docs.get(query.get("id"))

    async def update_one(self, query, update, upsert=False):
        key = query.get("id")
        current = self.docs.get(key, {})
        if upsert and not current:
            current.update(update.get("$setOnInsert", {}))
        current.update(update.get("$set", {}))
        self.docs[key] = current
        return _Result()

    async def insert_one(self, doc):
        self.docs[doc["id"]] = dict(doc)
        return _Result()


class _FirstCallDb:
    def __init__(self):
        self.conversations = _FirstCallCollection()
        self.call_sessions = _FirstCallCollection()
        self.blocks = _FirstCallCollection()
        self.users = self

    def find(self, query, projection=None):
        return _UsersQuery()


class _MessageCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, query, projection=None):
        for item in self.docs:
            if all(item.get(key) == value for key, value in query.items()):
                return dict(item)
        return None

    async def insert_one(self, doc):
        self.docs.append(dict(doc))
        return _Result()

    async def update_one(self, query, update, upsert=False):
        return _Result()


class _OfflineSendDb:
    def __init__(self):
        self.messages = _MessageCollection()
        self.blocks = _FirstCallCollection()
        self.conversations = _FirstCallCollection()
        self.users = self

    async def find_one(self, query, projection=None):
        if query.get("id") == "u2":
            return {"id": "u2", "name": "Receiver", "country_code": "SA"}
        return None


class _OfflineHub:
    async def send_to_user(self, user_id, event):
        return 0


def test_durable_message_returns_before_offline_notification_work(monkeypatch):
    db = _OfflineSendDb()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(server, "_chat_hub", _OfflineHub())

    notifications_started = []

    async def slow_notification(*args, **kwargs):
        notifications_started.append(True)
        await asyncio.sleep(0)
        raise RuntimeError("push must not fail chat send")

    monkeypatch.setattr(server, "_send_user_notification", slow_notification)

    async def scenario():
        body = server.ChatMessageIn(receiver_id="u2", text="hello", client_message_id="offline_notification_message_001")
        result = await server.send_message(body, {"id": "u1", "name": "Sender", "country_code": "SA"})
        await asyncio.sleep(0)
        return result

    result = asyncio.run(scenario())
    assert result["text"] == "hello"
    assert len(db.messages.docs) == 1
    assert notifications_started == [True]


def test_first_call_creates_conversation_before_authorizing_invite(monkeypatch):
    db = _FirstCallDb()
    monkeypatch.setattr(server, "db", db)

    session = asyncio.run(server._authorize_call_signal("u1", "u2", "u1_u2", "call_first_123", "call_invite"))

    assert session is not None
    assert session["status"] == "ringing"
    assert db.conversations.docs["u1_u2"]["participants"] == ["u1", "u2"]
    assert db.conversations.docs["u1_u2"]["last_message"] == "مكالمة صوتية"
    assert db.call_sessions.docs["call_first_123"]["convo_id"] == "u1_u2"


def test_call_timeline_is_single_durable_message_with_server_duration(monkeypatch):
    db = _TimelineDb()
    hub = _Hub()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(server, "_chat_hub", hub)
    accepted_at = (datetime.now(timezone.utc) - timedelta(seconds=125)).isoformat()
    session = {
        "id": "call_timeline_123",
        "convo_id": "u1_u2",
        "caller_id": "u1",
        "callee_id": "u2",
        "country_code": "SA",
        "status": "ended",
        "created_at": accepted_at,
        "accepted_at": accepted_at,
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "end_reason": "hangup",
    }

    asyncio.run(server._broadcast_call_timeline(session))
    doc = db.messages.docs["call_timeline_call_timeline_123"]
    assert doc["system_type"] == "call"
    assert doc["call"]["status"] == "ended"
    assert doc["call"]["duration_seconds"] >= 124
    assert {user_id for user_id, _ in hub.events} == {"u1", "u2"}


def test_realtime_contract_keeps_call_and_receipt_data_durable():
    source = (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
    assert '"system_type": "call"' in source
    assert '"duration_seconds": duration_seconds' in source
    assert '"delivered_at": None' in source
    assert '"read_at": None' in source
    assert '"ts": delivered_at' in source
    assert '"read": True, "read_at": now' in source
    assert '"convo_id": convo_id if isinstance(convo_id, str) else None' in source


def test_clients_render_backend_call_timeline_and_do_not_replay_stale_typing():
    root = Path(__file__).resolve().parents[2]
    web = (root / "frontend" / "src" / "pages" / "ChatPage.js").read_text(encoding="utf-8")
    mobile = (root / "mobile" / "src" / "screens" / "ChatScreen.js").read_text(encoding="utf-8")
    web_socket = (root / "frontend" / "src" / "lib" / "useChatSocket.js").read_text(encoding="utf-8")
    mobile_socket = (root / "mobile" / "src" / "useChatSocket.js").read_text(encoding="utf-8")
    web_call = (root / "frontend" / "src" / "components" / "VoiceCallModal.js").read_text(encoding="utf-8")
    native_call = (root / "mobile" / "src" / "components" / "NativeVoiceCall.native.js").read_text(encoding="utf-8")
    assert 'm.system_type === "call"' in web
    assert 'm?.system_type === "call"' in mobile
    assert "convo_id: activeConvoId" in web
    assert "convo_id: convoId" in mobile
    assert '"typing", "call_invite"' not in web_socket
    assert '"typing", "call_invite"' not in mobile_socket
    assert "setNativeCallSpeaker(callId, next)" in native_call
    assert 'accessibilityLabel={t("مكبر الصوت")}' in native_call
    assert "audio.setSinkId" in web_call
    assert 'CallControl label={tr("مكبر الصوت")}' in web_call
    assert 'if not conversation:' in (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
    assert 'if event_type != "call_invite":' in (Path(__file__).resolve().parents[1] / "server.py").read_text(encoding="utf-8")
