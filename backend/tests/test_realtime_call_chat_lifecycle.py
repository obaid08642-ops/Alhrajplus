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
