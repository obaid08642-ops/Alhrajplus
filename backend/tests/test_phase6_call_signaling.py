"""Phase 6 deterministic contracts for authorized WebRTC call signaling."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class _Result:
    inserted_id = "x"


class _Cursor:
    def __init__(self, rows):
        self.rows = rows

    async def to_list(self, length=None):
        return [dict(row) for row in self.rows[:length]]

    def sort(self, *_args):
        return self


class _Conversations:
    async def find_one(self, query, *_args, **_kwargs):
        if query.get("id") == "u1_u2" and query.get("participants", {}).get("$all") == ["u1", "u2"]:
            return {"id": "u1_u2", "participants": ["u1", "u2"], "country_code": "SA"}
        return None


class _Users:
    def find(self, query, *_args, **_kwargs):
        ids = set(query.get("id", {}).get("$in", []))
        rows = [{"id": "u1", "country_code": "SA"}, {"id": "u2", "country_code": "SA"}] if ids == {"u1", "u2"} else []
        return _Cursor(rows)


class _Blocks:
    async def find_one(self, *_args, **_kwargs):
        return None


class _CallSessions:
    def __init__(self):
        self.docs = {}

    async def find_one(self, query, *_args, **_kwargs):
        doc = self.docs.get(query.get("id"))
        return dict(doc) if doc else None

    async def insert_one(self, doc):
        self.docs[doc["id"]] = dict(doc)
        return _Result()

    async def update_one(self, query, update):
        self.docs[query["id"]].update(update.get("$set", {}))
        return _Result()

    async def update_many(self, _query, _update):
        return _Result()

    def find(self, query, *_args, **_kwargs):
        user_id = query["$or"][0]["caller_id"]
        return _Cursor([doc for doc in self.docs.values() if user_id in {doc.get("caller_id"), doc.get("callee_id")}])


class _CallDb:
    def __init__(self):
        self.conversations = _Conversations()
        self.users = _Users()
        self.blocks = _Blocks()
        self.call_sessions = _CallSessions()


def test_call_invite_requires_persisted_pair_and_creates_short_lived_session(monkeypatch):
    db = _CallDb()
    monkeypatch.setattr(server, "db", db)

    async def scenario():
        allowed = await server._authorize_call_signal("u1", "u2", "u1_u2", "call_valid_123", "call_invite")
        denied = await server._authorize_call_signal("u3", "u2", "u1_u2", "call_wrong_123", "call_invite")
        return allowed, denied

    allowed, denied = asyncio.run(scenario())
    assert allowed["status"] == "ringing"
    assert allowed["country_code"] == "SA"
    assert allowed["caller_id"] == "u1"
    assert db.call_sessions.docs["call_valid_123"]["callee_id"] == "u2"
    assert denied is None


def test_only_callee_can_reject_and_rejection_is_durable(monkeypatch):
    db = _CallDb()
    monkeypatch.setattr(server, "db", db)

    async def scenario():
        await server._authorize_call_signal("u1", "u2", "u1_u2", "call_reject_123", "call_invite")
        caller_reject = await server._authorize_call_signal("u1", "u2", "u1_u2", "call_reject_123", "call_reject")
        callee_reject = await server._authorize_call_signal("u2", "u1", "u1_u2", "call_reject_123", "call_reject")
        return caller_reject, callee_reject

    caller_reject, callee_reject = asyncio.run(scenario())
    assert caller_reject is None
    assert callee_reject["status"] == "rejected"
    assert db.call_sessions.docs["call_reject_123"]["end_reason"] == "rejected"


def test_call_history_is_scoped_to_authenticated_participant_and_country(monkeypatch):
    db = _CallDb()
    db.call_sessions.docs["call_history_123"] = {"id": "call_history_123", "caller_id": "u1", "callee_id": "u2", "country_code": "SA"}
    monkeypatch.setattr(server, "db", db)
    rows = asyncio.run(server.voice_call_history(limit=50, user={"id": "u1", "country_code": "SA"}))
    assert [row["id"] for row in rows] == ["call_history_123"]


def test_queued_call_signals_are_scoped_to_the_target_participant(monkeypatch):
    db = _CallDb()
    db.call_sessions.docs["call_signal_queue_123"] = {
        "id": "call_signal_queue_123",
        "convo_id": "u1_u2",
        "caller_id": "u1",
        "callee_id": "u2",
        "country_code": "SA",
        "status": "offered",
        "expires_at": "2999-01-01T00:00:00+00:00",
        "pending_signals": [
            {"type": "call_offer", "from": "u1", "to": "u2", "call_id": "call_signal_queue_123", "data": {"type": "offer"}},
            {"type": "call_ice", "from": "u1", "to": "u2", "call_id": "call_signal_queue_123", "data": {"candidate": "candidate-u2"}},
            {"type": "call_answer", "from": "u2", "to": "u1", "call_id": "call_signal_queue_123", "data": {"type": "answer"}},
        ],
    }
    monkeypatch.setattr(server, "db", db)

    payload = asyncio.run(server.voice_call_signals("call_signal_queue_123", user={"id": "u2"}))
    assert [event["type"] for event in payload["signals"]] == ["call_offer", "call_ice"]
    assert all(event["to"] == "u2" for event in payload["signals"])
    assert payload["session"]["convo_id"] == "u1_u2"


def test_queued_call_signals_reject_non_participants(monkeypatch):
    db = _CallDb()
    db.call_sessions.docs["call_signal_denied_123"] = {
        "id": "call_signal_denied_123",
        "caller_id": "u1",
        "callee_id": "u2",
        "status": "ringing",
        "expires_at": "2999-01-01T00:00:00+00:00",
    }
    monkeypatch.setattr(server, "db", db)

    try:
        asyncio.run(server.voice_call_signals("call_signal_denied_123", user={"id": "intruder"}))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("non-participant could read queued call signals")
