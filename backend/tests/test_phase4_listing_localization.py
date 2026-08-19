"""Phase 4 — localized listing-detail contract shared by Web and Mobile."""

import asyncio
import json
from copy import deepcopy
from pathlib import Path

import server
from starlette.requests import Request


class _Listings:
    def __init__(self, listing):
        self.listing = listing
        self.view_updates = []

    async def find_one(self, *args, **kwargs):
        return deepcopy(self.listing)

    async def update_one(self, query, update):
        self.view_updates.append((query, update))


class _Users:
    async def find_one(self, *args, **kwargs):
        return {"id": "seller-1", "name": "Verified seller", "phone": "+966500000000"}


class _Counter:
    async def count_documents(self, *args, **kwargs):
        return 0


class _DB:
    def __init__(self, listing):
        self.listings = _Listings(listing)
        self.users = _Users()
        self.listing_likes = _Counter()
        self.listing_comments = _Counter()


def _request():
    return Request({
        "type": "http",
        "method": "GET",
        "path": "/api/listings/listing-localized",
        "query_string": b"lang=en",
        "headers": [],
    })


def test_listing_detail_returns_only_a_fresh_requested_localization():
    listing = {
        "id": "listing-localized",
        "slug": "arabic-listing",
        "user_id": "seller-1",
        "status": "active",
        "moderation": "approved",
        "country_code": "SA",
        "title": "إعلان عربي أصلي",
        "description": "وصف عربي أصلي ودقيق",
        "price": 120,
        "currency": "ر.س",
        "category": "cars",
        "images": [],
    }
    source_hash = server._listing_source_fingerprint(listing)
    listing["seo_localizations"] = {
        "en": {
            "title": "Accurate English listing",
            "description": "Accurate English description",
            "source_hash": source_hash,
        },
        # The stale French copy must never be returned to either client.
        "fr": {
            "title": "Ancien titre",
            "description": "Ancienne description",
            "source_hash": "stale-source",
        },
    }
    previous_db = server.db
    fake_db = _DB(listing)
    server.db = fake_db
    try:
        english_response = asyncio.run(server.get_listing("listing-localized", _request(), country_code="SA", lang="en"))
        english = json.loads(english_response.body)
        assert english["title"] == "Accurate English listing"
        assert english["description"] == "Accurate English description"
        assert english["seo_content_language"] == "en"
        assert english["seo_available_languages"] == ["ar", "en"]

        french_response = asyncio.run(server.get_listing("listing-localized", _request(), country_code="SA", lang="fr"))
        french = json.loads(french_response.body)
        assert french["title"] == "إعلان عربي أصلي"
        assert french["description"] == "وصف عربي أصلي ودقيق"
        assert "seo_content_language" not in french
        assert french["seo_available_languages"] == ["ar", "en"]
        assert len(fake_db.listings.view_updates) == 2
    finally:
        server.db = previous_db


def test_mobile_listing_detail_passes_language_and_deduplicates_view_events():
    source = (
        Path(__file__).resolve().parents[2]
        / "mobile"
        / "src"
        / "screens"
        / "ListingDetailScreen.js"
    ).read_text(encoding="utf-8")
    assert "const { t, lang } = useI18n();" in source
    assert "api.get(`/listings/${id}`, { params: { lang } })" in source
    assert "const viewedListingId = useRef(null);" in source
    assert "const firstLocalizedLoad = viewedListingId.current !== l.data.id;" in source
    assert "if (firstLocalizedLoad) api.post(`/listings/${id}/view`).catch(() => {});" in source
    assert "[id, lang]" in source
