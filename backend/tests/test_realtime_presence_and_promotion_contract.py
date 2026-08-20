from __future__ import annotations

import asyncio
import time
from pathlib import Path

from chat_hub import ChatHub


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


def test_detail_promotion_controls_exist_in_web_and_mobile_and_use_backend_endpoint():
    root = Path(__file__).resolve().parents[2]
    web = (root / "frontend" / "src" / "pages" / "ListingDetail.js").read_text(encoding="utf-8")
    mobile = (root / "mobile" / "src" / "screens" / "ListingDetailScreen.js").read_text(encoding="utf-8")
    server = (root / "backend" / "server.py").read_text(encoding="utf-8")

    assert 'data-testid="boost-listing-detail-btn"' in web
    assert 'api.post(`/listings/${listing.id}/boost`' in web
    assert 'testID="owner-boost-btn"' in mobile
    assert 'api.post(`/listings/${listing.id}/boost`' in mobile
    assert '@api.post("/listings/{listing_id}/boost")' in server
    assert '"coins_balance": {"$gte": cost}' in server
