"""Phase 5 deterministic contracts for comments, chat privacy and notifications."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class _InsertResult:
    inserted_id = "x"


class _CommentCollection:
    def __init__(self, parent=None):
        self.parent = parent
        self.inserted = []

    async def count_documents(self, _query):
        return 0

    async def find_one(self, query, *_args, **_kwargs):
        if query.get("id") == "parent-1" and self.parent and self.parent.get("listing_id") == query.get("listing_id"):
            return dict(self.parent)
        return None

    async def insert_one(self, doc):
        self.inserted.append(dict(doc))
        return _InsertResult()


class _Listings:
    async def find_one(self, query, *_args, **_kwargs):
        # public_listing_filter_for_country composes nested $and/$or clauses;
        # this stub only needs to acknowledge the intended SA listing.
        if "listing-1" in str(query) and "SA" in str(query):
            return {"id": "listing-1", "user_id": "owner", "country_code": "SA", "title": "Test"}
        return None


class _Blocks:
    async def find_one(self, *_args, **_kwargs):
        return None


class _CommentDb:
    def __init__(self, parent=None):
        self.listings = _Listings()
        self.listing_comments = _CommentCollection(parent)
        self.blocks = _Blocks()


def test_versioned_notification_payload_has_canonical_entity_and_ids():
    data = server._notification_payload(
        "comment_reply", "/listing/listing-1?focus=comments&comment=comment-2#comments",
        {"entity": "comment", "entity_id": "comment-2", "listing_id": "listing-1", "comment_id": "comment-2"},
    )
    assert data["schema_version"] == 1
    assert data["entity"] == "comment"
    assert data["entity_type"] == "comment"
    assert data["entity_id"] == "comment-2"
    assert data["route"].endswith("#comments")


def test_comment_reply_notifies_parent_author_with_deep_focus(monkeypatch):
    db = _CommentDb({"id": "parent-1", "listing_id": "listing-1", "user_id": "parent-author", "deleted": False})
    sent = []

    async def fake_notify(*args, **kwargs):
        sent.append((args, kwargs))

    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(server, "_send_user_notification", fake_notify)

    async def scenario():
        result = await server.create_listing_comment(
            "listing-1", server.ListingCommentIn(text="رد موثوق", parent_id="parent-1", client_comment_id="comment-retry-123"),
            "SA", {"id": "replier", "name": "Replier", "country_code": "SA"},
        )
        await asyncio.sleep(0)
        return result

    result = asyncio.run(scenario())
    assert result["parent_id"] == "parent-1"
    assert db.listing_comments.inserted[0]["country_code"] == "SA"
    assert sent[0][0][0] == "parent-author"
    assert sent[0][0][3] == "comment_reply"
    assert sent[0][0][4].endswith(f"comment={result['id']}#comments")
    assert sent[0][0][5]["comment_id"] == result["id"]


def test_comment_rejects_parent_from_another_listing(monkeypatch):
    db = _CommentDb({"id": "parent-1", "listing_id": "other-listing", "user_id": "parent-author", "deleted": False})
    monkeypatch.setattr(server, "db", db)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(server.create_listing_comment(
            "listing-1", server.ListingCommentIn(text="invalid", parent_id="parent-1", client_comment_id="comment-retry-456"),
            "SA", {"id": "replier", "country_code": "SA"},
        ))
    assert exc.value.status_code == 404


class _ConversationCollection:
    def __init__(self):
        self.update = None

    async def find_one(self, query, *_args, **_kwargs):
        return {"id": query.get("id"), "participants": ["u1", "u2"]} if query.get("participants") == "u1" else None

    async def update_one(self, _query, update):
        self.update = update
        return _InsertResult()


class _MessagesCollection:
    def __init__(self):
        self.update = None

    async def update_many(self, _query, update):
        self.update = update
        return _InsertResult()


class _ChatDeleteDb:
    def __init__(self):
        self.conversations = _ConversationCollection()
        self.messages = _MessagesCollection()


def test_delete_conversation_for_me_marks_only_calling_user_hidden(monkeypatch):
    db = _ChatDeleteDb()
    monkeypatch.setattr(server, "db", db)
    result = asyncio.run(server.delete_chat_conversation_for_me("u1_u2", {"id": "u1", "country_code": "SA"}))
    assert result == {"success": True, "convo_id": "u1_u2", "scope": "self"}
    assert db.conversations.update == {"$addToSet": {"hidden_for": "u1"}}
    assert db.messages.update == {"$addToSet": {"hidden_for": "u1"}}
