"""
Durable IndexNow delivery for public listing discovery.

The sitemap remains the canonical discovery mechanism for Google and all crawlers.
Google's Indexing API is reserved for eligible JobPosting and livestreaming
BroadcastEvent pages, so it is intentionally not used for marketplace listings.
IndexNow supplements the sitemap for participating engines when a public URL is
added, updated, moved, hidden, or deleted. Delivery is persisted in MongoDB so a
temporary network outage never turns a listing write into a failed user action or a
lost signal.
"""
from __future__ import annotations

import asyncio
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional
from urllib.parse import urlparse

import httpx
from pymongo import ReturnDocument

logger = logging.getLogger(__name__)

INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"
INDEXNOW_MAX_URLS = 10_000
INDEXNOW_MAX_ATTEMPTS = 8
INDEXNOW_RETRY_BASE_SECONDS = 30


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.isoformat()


def _normalise_urls(urls: List[str], host: str) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for raw in urls:
        url = str(raw or "").strip()
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.hostname != host or not parsed.path:
            continue
        if url not in seen:
            result.append(url)
            seen.add(url)
    return result[:INDEXNOW_MAX_URLS]


async def get_or_create_indexnow_key(db) -> str:
    """Return a stable ownership key without logging or exposing it."""
    doc = await db.system.find_one({"_id": "indexnow_key"})
    if doc and doc.get("key"):
        return doc["key"]
    key = secrets.token_hex(16)
    await db.system.update_one(
        {"_id": "indexnow_key"},
        {"$set": {"key": key}},
        upsert=True,
    )
    return key


async def submit_urls(db, urls: List[str], host: str, timeout: float = 8.0) -> Optional[dict]:
    """Submit one validated batch to IndexNow; caller owns retries and persistence."""
    urls = _normalise_urls(urls, host)
    if not urls:
        return {"status": "skipped", "submitted": 0}
    try:
        key = await get_or_create_indexnow_key(db)
        payload = {
            "host": host,
            "key": key,
            "keyLocation": f"https://{host}/{key}.txt",
            "urlList": urls,
        }
        async with httpx.AsyncClient(timeout=timeout) as client_http:
            response = await client_http.post(INDEXNOW_ENDPOINT, json=payload)
        if response.status_code in (200, 202):
            logger.info("[IndexNow] accepted %d URL(s): %s", len(urls), response.status_code)
            return {"status": response.status_code, "submitted": len(urls)}
        logger.warning("[IndexNow] rejected batch: status=%s", response.status_code)
        return {"status": response.status_code, "submitted": 0}
    except Exception as exc:
        logger.warning("[IndexNow] delivery failed: %s", type(exc).__name__)
        return None


async def queue_urls(db, urls: List[str], host: str, trigger: str) -> Optional[str]:
    """Persist a discovery event, then make a best-effort first delivery attempt."""
    urls = _normalise_urls(urls, host)
    if not urls:
        return None
    now = _now()
    event_id = f"indexnow_{uuid.uuid4().hex}"
    await db.indexnow_outbox.insert_one({
        "id": event_id,
        "host": host,
        "urls": urls,
        "trigger": trigger,
        "status": "pending",
        "attempts": 0,
        "created_at": _iso(now),
        "updated_at": _iso(now),
        "next_attempt_at": _iso(now),
    })
    await flush_pending(db, limit=1)
    return event_id


def enqueue_in_background(db, urls: List[str], host: str, trigger: str = "listing_change") -> None:
    """Queue delivery asynchronously so publication and edits never wait on a crawler."""
    try:
        asyncio.create_task(queue_urls(db, urls, host, trigger))
    except RuntimeError:
        logger.warning("[IndexNow] no active event loop; event was not queued")


async def flush_pending(db, limit: int = 20) -> dict[str, int]:
    """Claim and deliver queued events. Safe to call from the protected cron route."""
    delivered = failed = 0
    for _ in range(max(0, min(int(limit), 100))):
        now = _now()
        event = await db.indexnow_outbox.find_one_and_update(
            {"status": "pending", "next_attempt_at": {"$lte": _iso(now)}},
            {"$set": {"status": "processing", "updated_at": _iso(now), "processing_started_at": _iso(now)}, "$inc": {"attempts": 1}},
            sort=[("created_at", 1)],
            return_document=ReturnDocument.AFTER,
        )
        if not event:
            break
        result = await submit_urls(db, event.get("urls") or [], event.get("host") or "")
        completed_at = _now()
        if result and result.get("status") in (200, 202):
            await db.indexnow_outbox.update_one(
                {"id": event["id"], "status": "processing"},
                {"$set": {"status": "delivered", "delivered_at": _iso(completed_at), "updated_at": _iso(completed_at), "result": result}, "$unset": {"processing_started_at": ""}},
            )
            delivered += 1
            continue
        attempts = int(event.get("attempts") or 1)
        terminal = attempts >= INDEXNOW_MAX_ATTEMPTS
        delay = min(3600, INDEXNOW_RETRY_BASE_SECONDS * (2 ** min(attempts, 7)))
        update: dict[str, Any] = {
            "status": "failed" if terminal else "pending",
            "updated_at": _iso(completed_at),
            "last_failure_at": _iso(completed_at),
            "next_attempt_at": _iso(completed_at + timedelta(seconds=delay)),
            "result": result or {"status": "network_error"},
        }
        await db.indexnow_outbox.update_one(
            {"id": event["id"], "status": "processing"},
            {"$set": update, "$unset": {"processing_started_at": ""}},
        )
        failed += 1
    return {"delivered": delivered, "failed": failed}


async def queue_summary(db) -> dict[str, int]:
    """Return safe aggregate queue counts for the admin monitoring dashboard."""
    pending = await db.indexnow_outbox.count_documents({"status": "pending"})
    processing = await db.indexnow_outbox.count_documents({"status": "processing"})
    failed = await db.indexnow_outbox.count_documents({"status": "failed"})
    return {"pending": pending, "processing": processing, "failed": failed}
