from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class Result:
    def __init__(self, modified=1, upserted=True):
        self.modified_count = modified
        self.matched_count = modified
        self.upserted_id = "new" if upserted else None


class Collection:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.inserts = []

    async def find_one(self, query, *_args, **_kwargs):
        for row in self.rows:
            if all(row.get(k) == v for k, v in query.items() if not isinstance(v, dict)):
                return dict(row)
        return None

    async def update_one(self, query, update, upsert=False):
        for row in self.rows:
            if all(row.get(k) == v for k, v in query.items() if not isinstance(v, dict)):
                if "$set" in update:
                    row.update(update["$set"])
                return Result(0, False) if "$setOnInsert" in update else Result()
        if upsert:
            row = dict(update.get("$setOnInsert", {})); row.update(update.get("$set", {})); self.rows.append(row); return Result(1, True)
        return Result(0, False)

    async def insert_one(self, doc):
        self.rows.append(dict(doc)); self.inserts.append(dict(doc)); return Result()

    async def delete_one(self, query):
        for index, row in enumerate(self.rows):
            if all(row.get(k) == v for k, v in query.items()):
                self.rows.pop(index)
                return Result()
        return Result(0, False)


class BoostListings(Collection):
    async def find_one(self, query, *_args, **_kwargs):
        # public_listing_filter_for_country wraps required predicates in $and.
        clauses = query.get("$and", [query])
        for row in self.rows:
            match = True
            for clause in clauses:
                for key, value in clause.items():
                    if key == "$or":
                        continue  # Test fixtures use legacy moderation (allowed by policy).
                    if isinstance(value, dict):
                        if "$ne" in value and row.get(key) == value["$ne"]:
                            match = False
                    elif row.get(key) != value:
                        match = False
            if match:
                return dict(row)
        return None

    async def update_one(self, query, update, upsert=False):
        for row in self.rows:
            if row.get("id") != query.get("id"):
                continue
            # The test listing starts unboosted, so it satisfies the endpoint's $or gate.
            row.update(update.get("$set", {}))
            for key in update.get("$unset", {}):
                row.pop(key, None)
            return Result()
        return Result(0, False)


class Users(Collection):
    async def update_one(self, query, update, upsert=False):
        for row in self.rows:
            if row.get("id") == query.get("id") and ("coins_balance" not in query or row.get("coins_balance", 0) >= query["coins_balance"].get("$gte", 0)):
                row.update(update.get("$set", {}))
                row["coins_balance"] = row.get("coins_balance", 0) + update.get("$inc", {}).get("coins_balance", 0)
                return Result()
        return Result(0, False)


class Db:
    def __init__(self):
        self.users = Users([{"id": "sharer", "coins_balance": 300, "country_code": "SA"}, {"id": "viewer", "coins_balance": 0, "country_code": "SA"}])
        self.listing_shares = Collection([{"id": "share-1", "listing_id": "listing-1", "sharer_id": "sharer", "country_code": "SA"}])
        self.share_opens = Collection()
        self.coins_ledger = Collection()
        self.analytics_events = Collection()
        self.listings = BoostListings([{"id": "listing-1", "country_code": "SA", "status": "active", "user_id": "seller"}, {"id": "listing-boost", "country_code": "SA", "user_id": "sharer", "is_boosted": False}])
        self.economy_config = Collection([{"id": "default", "share_open_coins": 2, "share_rewards_enabled": True}])
        self.referral_events = Collection()
        self.email_verify_tokens = Collection()


def test_share_open_rewards_once_and_blocks_self(monkeypatch):
    db = Db(); monkeypatch.setattr(server, "db", db)

    async def no_user(_request): return None
    monkeypatch.setattr(server, "_get_user_from_cookie", no_user)

    body = server.ShareOpenIn(visitor_id="visitor-123", session_id="session-123", platform="web")
    result = asyncio.run(server.qualify_listing_share_open("share-1", body, object()))
    assert result["qualified"] is True
    assert db.users.rows[0]["coins_balance"] == 302
    again = asyncio.run(server.qualify_listing_share_open("share-1", body, object()))
    assert again["qualified"] is False
    assert db.users.rows[0]["coins_balance"] == 302

    async def self_user(_request): return {"id": "sharer"}
    monkeypatch.setattr(server, "_get_user_from_cookie", self_user)
    self_open = asyncio.run(server.qualify_listing_share_open("share-1", server.ShareOpenIn(visitor_id="visitor-other", session_id="session-other", platform="web"), object()))
    assert self_open["reason"] == "self_open"


def test_coin_mutation_rejects_insufficient_balance(monkeypatch):
    db = Db(); db.users.rows[0]["coins_balance"] = 0; monkeypatch.setattr(server, "db", db)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(server._coin_mutation("sharer", -1, "spend", "boost", "listing-1", "spend-1"))
    assert exc.value.status_code == 402


def test_admin_economy_config_updates_runtime_products(monkeypatch):
    db = Db(); monkeypatch.setattr(server, "db", db)

    async def no_log(*_args, **_kwargs):
        return None
    monkeypatch.setattr(server, "_admin_log", no_log)

    body = server.EconomyConfigIn(welcome_coins=17, referral_coins=31, share_open_coins=4, referral_enabled=True, share_rewards_enabled=True, boost_products=[{"id": "priority_48h", "cost": 77, "duration_hours": 48, "strength": 3}])
    result = asyncio.run(server.update_economy_config(body, {"id": "admin", "role": "admin"}))
    assert result["welcome_coins"] == 17
    assert result["boost_products"] == [{"id": "priority_48h", "cost": 77, "duration_hours": 48, "strength": 3}]
    assert asyncio.run(server._economy_config())["share_open_coins"] == 4


def test_email_verification_qualifies_referral_once(monkeypatch):
    db = Db(); monkeypatch.setattr(server, "db", db)
    db.users.rows[0]["referral_code"] = "REF123"
    db.users.rows.append({"id": "invitee", "coins_balance": 0, "country_code": "SA", "email_verified": False})
    db.referral_events.rows.append({"id": "ref-1", "invitee_id": "invitee", "inviter_code": "REF123", "status": "pending"})
    db.email_verify_tokens.rows.append({"token": "verify-token", "user_id": "invitee", "expires_at": server.datetime.now(server.timezone.utc) + server.timedelta(hours=1)})

    result = asyncio.run(server.verify_email("verify-token", object()))
    assert result["success"] is True
    assert db.users.rows[0]["coins_balance"] == 325
    assert db.referral_events.rows[0]["status"] == "rewarded"
    assert db.users.rows[2]["email_verified"] is True
    assert db.email_verify_tokens.rows == []


def test_listing_share_and_boost_use_runtime_product(monkeypatch):
    db = Db(); monkeypatch.setattr(server, "db", db)

    share = asyncio.run(server.create_listing_share("listing-1", server.ListingShareIn(client_share_id="client-share-123", channel="native"), {"id": "sharer", "country_code": "SA"}))
    assert share["share"]["sharer_id"] == "sharer"
    assert "?share=" in share["url"]
    duplicate = asyncio.run(server.create_listing_share("listing-1", server.ListingShareIn(client_share_id="client-share-123", channel="native"), {"id": "sharer", "country_code": "SA"}))
    assert duplicate["duplicate"] is True

    db.economy_config.rows[0]["boost_products"] = [{"id": "priority_48h", "cost": 77, "duration_hours": 48, "strength": 3}]
    response = asyncio.run(server.boost_listing("listing-boost", {"id": "sharer", "role": "user", "country_code": "SA"}, {"product_id": "priority_48h", "idempotency_key": "boost-test-123"}))
    assert response["charged_coins"] == 77
    assert response["product_id"] == "priority_48h"
    assert db.users.rows[0]["coins_balance"] == 223
    assert db.listings.rows[1]["boost_strength"] == 3
