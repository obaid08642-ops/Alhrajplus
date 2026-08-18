import asyncio

import server


class _Requests:
    def __init__(self, existing=None):
        self.existing = existing
        self.inserted = []

    async def find_one(self, _query, *_args, **_kwargs):
        return dict(self.existing) if self.existing else None

    async def insert_one(self, doc):
        self.inserted.append(dict(doc))


class _Db:
    def __init__(self, existing=None):
        self.account_deletion_requests = _Requests(existing)


def test_account_deletion_request_is_idempotent_when_pending(monkeypatch):
    db = _Db({"id": "old", "user_id": "u1", "status": "pending"})
    monkeypatch.setattr(server, "db", db)
    result = asyncio.run(server.request_account_deletion({"id": "u1", "email": "u@example.test"}))
    assert result["success"] is True
    assert result["duplicate"] is True
    assert db.account_deletion_requests.inserted == []


def test_account_deletion_request_is_review_request_not_immediate_erasure(monkeypatch):
    db = _Db()
    monkeypatch.setattr(server, "db", db)
    result = asyncio.run(server.request_account_deletion({"id": "u1", "email": "u@example.test"}))
    assert result == {"success": True, "message": "تم استلام طلب الحذف"}
    assert db.account_deletion_requests.inserted[0]["user_id"] == "u1"
    assert db.account_deletion_requests.inserted[0]["status"] == "pending"
