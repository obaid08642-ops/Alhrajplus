from __future__ import annotations

import asyncio
import time
from pathlib import Path

from chat_hub import ChatHub
from server import _owner_listing_card


class _Users:
    def __init__(self):
        self.updates = []

    async def update_one(self, query, update):
        self.updates.append((query, update))


class _Db:
    def __init__(self):
        self.users = _Users()


async def _presence_expiry_scenario():
    hub = ChatHub()
    db = _Db()
    socket = object()
    await hub.connect("user_a", socket)
    assert hub.is_online("user_a")

    # A connection without a recent application heartbeat must not keep the
    # user visible as online. This mirrors a suspended browser/app socket.
    hub._activity[socket] = time.monotonic() - hub._presence_ttl_seconds - 1
    await hub.expire_inactive(db)
    assert not hub.is_online("user_a")
    assert db.users.updates

    # The first later heartbeat restores the truthful online state.
    await hub.touch("user_a", socket)
    assert hub.is_online("user_a")


def test_online_requires_recent_heartbeat_and_expires_stale_socket():
    asyncio.run(_presence_expiry_scenario())


def test_owner_listing_card_hides_internal_document_fields_and_exposes_display_labels():
    raw = {
        "id": "listing-1",
        "title": "سيارة نظيفة",
        "description": "وصف",
        "category": "cars",
        "subcategory": "cars_used",
        "status": "paused",
        "images": ["https://cdn.example.test/image.jpg", None],
        "search_blob": "internal-search-content",
        "moderation_flags": ["internal_flag"],
        "contact_phone": "+966500000000",
        "user_id": "owner-1",
    }
    payload = _owner_listing_card(raw)
    assert payload["category_label"] == "السيارات"
    assert payload["subcategory_label"] == "سيارات مستعملة"
    assert payload["status_label"] == "موقوف مؤقتاً"
    assert payload["images"] == ["https://cdn.example.test/image.jpg"]
    assert "search_blob" not in payload
    assert "moderation_flags" not in payload
    assert "contact_phone" not in payload
    assert "user_id" not in payload


def test_detail_promotion_controls_exist_in_web_and_mobile_and_use_backend_endpoint():
    root = Path(__file__).resolve().parents[2]
    web = (root / "frontend" / "src" / "pages" / "ListingDetail.js").read_text(encoding="utf-8")
    mobile = (root / "mobile" / "src" / "screens" / "ListingDetailScreen.js").read_text(encoding="utf-8")
    server = (root / "backend" / "server.py").read_text(encoding="utf-8")
    profile = (root / "frontend" / "src" / "pages" / "ProfilePage.js").read_text(encoding="utf-8")
    mobile_my_listings = (root / "mobile" / "src" / "screens" / "OtherScreens.js").read_text(encoding="utf-8")

    assert 'data-testid="boost-listing-detail-btn"' in web
    assert 'api.post(`/listings/${listing.id}/boost`' in web
    assert 'testID="owner-boost-btn"' in mobile
    assert 'api.post(`/listings/${listing.id}/boost`' in mobile
    assert '@api.post("/listings/{listing_id}/boost")' in server
    assert '"coins_balance": {"$gte": cost}' in server
    assert "_OWNER_LISTING_CARD_PROJECTION" in server
    assert 'data-testid={`my-listing-meta-${l.id}`}' in profile
    assert 'testID={`my-listing-meta-${item.id}`}' in mobile_my_listings
