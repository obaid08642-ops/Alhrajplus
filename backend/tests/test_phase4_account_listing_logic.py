"""Deterministic regression tests for Phase 4 account/listing contracts."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


def test_phone_normalization_uses_valid_local_digits_and_e164():
    assert server._normalize_phone_for_country("SA", "050 123 4567") == ("501234567", "+966501234567")
    assert server._normalize_phone_for_country("EG", "+20 01012345678") == ("1012345678", "+201012345678")
    with pytest.raises(HTTPException) as bad_phone:
        server._normalize_phone_for_country("SA", "411111111")
    assert bad_phone.value.status_code == 422


def test_listing_account_phone_requires_verified_user_and_custom_is_e164_only():
    unverified = {"id": "u", "phone_full": "+966501234567", "phone_verified": False}
    with pytest.raises(HTTPException) as blocked:
        server._resolve_listing_contact_phone(unverified, True, "account", None)
    assert blocked.value.status_code == 422

    verified = {**unverified, "phone_verified": True}
    assert server._resolve_listing_contact_phone(verified, True, "account", None) == ("+966501234567", "account")
    assert server._resolve_listing_contact_phone(unverified, True, "custom", "+201012345678") == ("+201012345678", "custom")
    with pytest.raises(HTTPException):
        server._resolve_listing_contact_phone(unverified, True, "custom", "01012345678")


def test_offer_input_and_decision_support_retry_keys():
    offer = server.OfferIn(amount=25, client_offer_id="offer-key-123")
    decision = server.OfferDecisionIn(action="accept", client_action_id="action-key-123")
    assert offer.client_offer_id == "offer-key-123"
    assert decision.client_action_id == "action-key-123"


class _Result:
    modified_count = 1


class _Offers:
    def __init__(self, offer):
        self.offer = dict(offer)
        self.patch = None

    async def find_one(self, query, *_args, **_kwargs):
        if query.get("id") == self.offer["id"]:
            return dict(self.offer)
        return None

    async def update_one(self, _query, operation):
        self.patch = operation.get("$set", {})
        self.offer.update(self.patch)
        return _Result()


class _Listings:
    async def find_one(self, query, *_args, **_kwargs):
        if query.get("id") == "listing-sa" and query.get("country_code") == "SA":
            return {"id": "listing-sa"}
        return None


class _OfferDb:
    def __init__(self, offer):
        self.listing_offers = _Offers(offer)
        self.listings = _Listings()


def test_buyer_cannot_accept_pending_offer_but_can_accept_counter(monkeypatch):
    base = {
        "id": "offer-1", "listing_id": "listing-sa", "seller_id": "seller", "buyer_id": "buyer",
        "status": "pending", "amount": 100, "expires_at": "2999-01-01T00:00:00+00:00", "action_history": [],
    }
    db = _OfferDb(base)
    monkeypatch.setattr(server, "db", db)
    with pytest.raises(HTTPException) as pending:
        asyncio.run(server.decide_listing_offer("offer-1", server.OfferDecisionIn(action="accept"), "SA", {"id": "buyer", "country_code": "SA"}))
    assert pending.value.status_code == 403

    base["status"] = "countered"
    db = _OfferDb(base)
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(server.asyncio, "create_task", lambda coroutine: coroutine.close())
    result = asyncio.run(server.decide_listing_offer("offer-1", server.OfferDecisionIn(action="accept", client_action_id="action-key-123"), "SA", {"id": "buyer", "country_code": "SA"}))
    assert result["status"] == "accepted"
    assert db.listing_offers.patch["accepted_amount"] == 100.0
    assert db.listing_offers.patch["client_action_id"] == "action-key-123"
