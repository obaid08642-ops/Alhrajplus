"""Regression tests for Phase 3 country isolation rules.

These tests stay deterministic and Mongo-free. They cover the pure policy used by
listing/profile mutations and inspect the query constructed by autocomplete.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from country_policy import country_code_or_default, normalize_currency, normalize_location
from search_engine import suggest


def _country_code(query: dict) -> str:
    return next(clause["country_code"] for clause in query["$and"] if "country_code" in clause)


def test_unknown_country_defaults_to_sa_for_public_boundaries():
    assert country_code_or_default(None) == "SA"
    assert country_code_or_default("ua") == "SA"
    assert country_code_or_default("eg") == "EG"


def test_location_is_canonicalized_in_selected_country():
    assert normalize_location("EG", "Cairo", "مدينة نصر") == ("القاهرة", "مدينة نصر")
    assert normalize_location("SA", "الرياض", None) == ("الرياض", "")


@pytest.mark.parametrize(
    "country,city,district,error",
    [
        ("SA", "الإسكندرية", None, "city_not_in_country"),
        ("EG", "القاهرة", "العليا", "district_not_in_city"),
        ("EG", "", None, "city_required"),
    ],
)
def test_location_rejects_cross_country_or_invalid_values(country, city, district, error):
    with pytest.raises(ValueError, match=error):
        normalize_location(country, city, district)


def test_currency_is_canonicalized_and_cross_country_currency_is_rejected():
    assert normalize_currency("EG", "EGP") == ("ج.م", "EGP")
    assert normalize_currency("SA", None) == ("ر.س", "SAR")
    with pytest.raises(ValueError, match="currency_not_in_country"):
        normalize_currency("EG", "ر.س")


class _EmptyCursor:
    def sort(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def __aiter__(self):
        async def _iterate():
            if False:
                yield None
        return _iterate()


class _ListingProbe:
    def __init__(self):
        self.query = None

    def find(self, query, *_args, **_kwargs):
        self.query = query
        return _EmptyCursor()


class _DbProbe:
    def __init__(self):
        self.listings = _ListingProbe()


def test_autocomplete_is_country_scoped_when_country_missing_or_unsupported():
    db = _DbProbe()
    asyncio.run(suggest(db, "كامري", None))
    assert _country_code(db.listings.query) == "SA"

    asyncio.run(suggest(db, "كامري", "UA"))
    assert _country_code(db.listings.query) == "SA"

    asyncio.run(suggest(db, "كامري", "EG"))
    assert _country_code(db.listings.query) == "EG"


class _InsertOnlyListings:
    def __init__(self):
        self.inserted = []

    async def insert_one(self, doc):
        self.inserted.append(dict(doc))


class _CreateDb:
    def __init__(self):
        self.listings = _InsertOnlyListings()


def _listing_body(**overrides):
    from server import ListingIn

    data = {
        "title": "هاتف للبيع بحالة ممتازة",
        "description": "هاتف نظيف مع كامل الملحقات وبحالة ممتازة.",
        "category": "phones",
        "city": "القاهرة",
        "country_code": "EG",
        "currency": "EGP",
    }
    data.update(overrides)
    return ListingIn(**data)


def test_create_listing_enforces_account_country_and_canonical_location_currency(monkeypatch):
    import server
    from fastapi import HTTPException

    fake_db = _CreateDb()
    monkeypatch.setattr(server, "db", fake_db)
    monkeypatch.setattr(server, "_cache_invalidate", lambda: None)
    monkeypatch.setattr(server, "_seo_submit_bg", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(server, "_google_idx_updated", lambda *_args, **_kwargs: None)
    # The handler schedules best-effort AI work after returning. Close the test
    # coroutine deliberately so the unit test never invokes an external service.
    monkeypatch.setattr(server.asyncio, "ensure_future", lambda coroutine: coroutine.close())

    created = asyncio.run(server.create_listing(_listing_body(), {"id": "u-eg", "country_code": "EG", "role": "user"}))
    assert created["country_code"] == "EG"
    assert created["city"] == "القاهرة"
    assert created["currency"] == "ج.م"
    assert created["currency_code"] == "EGP"
    assert fake_db.listings.inserted[0]["currency"] == "ج.م"

    with pytest.raises(HTTPException) as cross_country:
        asyncio.run(server.create_listing(_listing_body(country_code="SA", city="الرياض", currency="SAR"), {"id": "u-eg", "country_code": "EG", "role": "user"}))
    assert cross_country.value.status_code == 409

    with pytest.raises(HTTPException) as bad_city:
        asyncio.run(server.create_listing(_listing_body(city="الإسكندرية"), {"id": "u-sa", "country_code": "SA", "role": "user"}))
    assert bad_city.value.status_code == 409

    with pytest.raises(HTTPException) as bad_currency:
        asyncio.run(server.create_listing(_listing_body(currency="ر.س"), {"id": "u-eg", "country_code": "EG", "role": "user"}))
    assert bad_currency.value.status_code == 422


class _UpdateOnlyListings:
    def __init__(self, item):
        self.item = dict(item)

    async def find_one(self, *_args, **_kwargs):
        return dict(self.item)

    async def update_one(self, _query, operation):
        self.item.update(operation.get("$set", {}))


class _UpdateDb:
    def __init__(self, item):
        self.listings = _UpdateOnlyListings(item)


def test_update_listing_enforces_country_scope_and_normalizes_mutated_fields(monkeypatch):
    import server
    from fastapi import HTTPException

    item = {
        "id": "listing-eg", "user_id": "u-eg", "country_code": "EG",
        "title": "هاتف للبيع بحالة ممتازة", "description": "وصف كامل للهاتف بحالة ممتازة.",
        "city": "القاهرة", "district": "مدينة نصر", "currency": "ج.م", "currency_code": "EGP",
        "images": [], "videos": [], "custom_fields": {}, "price": 1000,
    }
    fake_db = _UpdateDb(item)
    monkeypatch.setattr(server, "db", fake_db)
    monkeypatch.setattr(server, "_cache_invalidate", lambda: None)

    body = server.ListingUpdateIn(country_code="EG", city="Giza", district="الهرم", currency="EGP")
    updated = asyncio.run(server.update_listing("listing-eg", body, {"id": "u-eg", "country_code": "EG", "role": "user"}))
    assert updated["city"] == "الجيزة"
    assert updated["district"] == "الهرم"
    assert updated["currency"] == "ج.م"
    assert updated["currency_code"] == "EGP"

    with pytest.raises(HTTPException) as move_country:
        asyncio.run(server.update_listing("listing-eg", server.ListingUpdateIn(country_code="SA"), {"id": "u-eg", "country_code": "EG", "role": "user"}))
    assert move_country.value.status_code == 409

    with pytest.raises(HTTPException) as inactive_country:
        asyncio.run(server.update_listing("listing-eg", server.ListingUpdateIn(country_code="EG"), {"id": "u-eg", "country_code": "SA", "role": "user"}))
    assert inactive_country.value.status_code == 409

    with pytest.raises(HTTPException) as bad_currency:
        asyncio.run(server.update_listing("listing-eg", server.ListingUpdateIn(country_code="EG", currency="SAR"), {"id": "u-eg", "country_code": "EG", "role": "user"}))
    assert bad_currency.value.status_code == 422


class _ProfileUsers:
    def __init__(self, item):
        self.item = dict(item)

    async def update_one(self, _query, operation):
        self.item.update(operation.get("$set", {}))

    async def find_one(self, *_args, **_kwargs):
        return dict(self.item)


class _ProfileDb:
    def __init__(self, item):
        self.users = _ProfileUsers(item)


def test_profile_country_switch_clears_stale_city_and_rejects_invalid_pair(monkeypatch):
    import server
    from fastapi import HTTPException

    fake_db = _ProfileDb({"id": "u-profile", "country_code": "SA", "city": "الرياض"})
    monkeypatch.setattr(server, "db", fake_db)
    user = {"id": "u-profile", "country_code": "SA", "city": "الرياض"}

    switched = asyncio.run(server.update_me(server.MeUpdateIn(country_code="EG"), user))
    assert switched["country_code"] == "EG"
    assert switched["city"] == ""

    with pytest.raises(HTTPException) as invalid_pair:
        asyncio.run(server.update_me(server.MeUpdateIn(country_code="SA", city="الإسكندرية"), user))
    assert invalid_pair.value.status_code == 422

    with pytest.raises(HTTPException) as invalid_country:
        asyncio.run(server.update_me(server.MeUpdateIn(country_code="UA"), user))
    assert invalid_country.value.status_code == 422


class _AsyncRows:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def __aiter__(self):
        async def _iterate():
            for row in self.rows:
                yield dict(row)
        return _iterate()


class _WriteResult:
    def __init__(self, modified_count=1):
        self.modified_count = modified_count


class _IntegrityListings:
    def __init__(self, rows):
        self.rows = {row["id"]: dict(row) for row in rows}

    async def count_documents(self, query):
        if "$or" in query:
            return sum(not row.get("country_code") for row in self.rows.values())
        return 0

    def find(self, *_args, **_kwargs):
        return _AsyncRows(list(self.rows.values()))

    async def update_one(self, query, operation):
        row = self.rows[query["id"]]
        row.update(operation.get("$set", {}))
        for key in operation.get("$unset", {}):
            row.pop(key, None)
        return _WriteResult()


class _IntegrityRepairs:
    def __init__(self):
        self.rows = {}

    async def insert_one(self, doc):
        self.rows[doc["id"]] = dict(doc)

    async def find_one(self, query, *_args, **_kwargs):
        row = self.rows.get(query.get("id"))
        return dict(row) if row and row.get("kind") == query.get("kind") else None

    async def update_one(self, query, operation):
        self.rows[query["id"]].update(operation.get("$set", {}))
        return _WriteResult()


class _CountOnly:
    async def count_documents(self, _query):
        return 0


class _IntegrityDb:
    def __init__(self, rows):
        self.listings = _IntegrityListings(rows)
        self.users = _CountOnly()
        self.data_integrity_repairs = _IntegrityRepairs()


def test_integrity_repair_is_dry_run_first_and_rollback_restores_preimage(monkeypatch):
    import server

    listing = {
        "id": "legacy-sa", "title": "سيارة كامري", "description": "سيارة نظيفة للبيع",
        "country_code": "SA", "city": "الإسكندرية", "district": "سيدي جابر",
        "currency": "ج.م", "currency_code": "EGP", "created_at": "2026-01-01T00:00:00+00:00",
        "search_blob": "سيارة كامري الاسكندرية سيدي جابر",
    }
    fake_db = _IntegrityDb([listing])
    monkeypatch.setattr(server, "db", fake_db)
    monkeypatch.setattr(server, "_cache_invalidate", lambda: None)

    async def _no_admin_log(*_args, **_kwargs):
        return None

    monkeypatch.setattr(server, "_admin_log", _no_admin_log)
    dry = asyncio.run(server.admin_data_integrity_repair({"apply": False}, {"id": "admin"}))
    assert dry["dry_run"] is True
    assert dry["plan"]["summary"]["city_country_mismatch"] == 1
    assert dry["plan"]["summary"]["currency_country_mismatch"] == 1

    applied = asyncio.run(server.admin_data_integrity_repair({"apply": True, "confirm": "REPAIR_COUNTRY_INTEGRITY"}, {"id": "admin"}))
    assert applied["changed"] == 1
    repaired = fake_db.listings.rows["legacy-sa"]
    assert repaired["city"] == ""
    assert repaired["district"] == ""
    assert repaired["currency"] == "ر.س"
    assert repaired["currency_code"] == "SAR"
    assert repaired["location_needs_review"] is True
    assert "الاسكندرية" not in repaired["search_blob"]

    rolled_back = asyncio.run(server.admin_data_integrity_rollback({"batch_id": applied["batch_id"]}, {"id": "admin"}))
    assert rolled_back["restored"] == 1
    restored = fake_db.listings.rows["legacy-sa"]
    assert restored["city"] == "الإسكندرية"
    assert restored["district"] == "سيدي جابر"
    assert restored["currency"] == "ج.م"
    assert restored["currency_code"] == "EGP"
    assert "location_needs_review" not in restored
    assert restored["search_blob"] == listing["search_blob"]
