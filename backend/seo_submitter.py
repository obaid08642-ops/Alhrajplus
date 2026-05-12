"""
IndexNow + Google Indexing submitter.

Submits new/updated listing URLs to multiple search engines INSTANTLY (instead of
waiting weeks for the next crawl).

Supported engines (via IndexNow protocol — a single submission goes to all):
  - Bing
  - Yandex
  - Seznam
  - Naver
  - DuckDuckGo (uses Bing index)

Google: IndexNow is not adopted by Google. We add the listing URL to sitemap.xml
(already done) which Google fetches frequently. For instant Google submission, a
proper Indexing API requires a Google Cloud Service Account (out of scope for free tier).

The IndexNow key is a random hex string we generate on first run and store in MongoDB.
A file `/{KEY}.txt` is served at the site root so search engines can verify ownership.

All submissions are FIRE-AND-FORGET — if a search engine is down, listing creation
succeeds anyway. Calls are non-blocking (background tasks) so they never slow down
the user-facing API.
"""
from __future__ import annotations
import asyncio
import secrets
import logging
from typing import List, Optional
import httpx

logger = logging.getLogger(__name__)

# Single endpoint that fans out to all participating search engines.
INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"


async def get_or_create_indexnow_key(db) -> str:
    """Idempotent: returns the same key on subsequent calls."""
    doc = await db.system.find_one({"_id": "indexnow_key"})
    if doc and doc.get("key"):
        return doc["key"]
    key = secrets.token_hex(16)  # 32-char hex, IndexNow spec accepts 8-128
    await db.system.update_one(
        {"_id": "indexnow_key"},
        {"$set": {"key": key}},
        upsert=True,
    )
    return key


async def submit_urls(
    db,
    urls: List[str],
    host: str,
    timeout: float = 8.0,
) -> Optional[dict]:
    """
    Submit a batch of up to 10,000 URLs to IndexNow.
    Returns the API response or None on failure (errors are logged, never raised).

    `host` should be just the domain: e.g. 'alhraj.online' (no scheme).
    """
    if not urls:
        return None
    # IndexNow requires all URLs to share the same host
    urls = [u for u in urls if host in u]
    if not urls:
        return None
    try:
        key = await get_or_create_indexnow_key(db)
        payload = {
            "host": host,
            "key": key,
            "keyLocation": f"https://{host}/{key}.txt",
            "urlList": urls[:10000],
        }
        async with httpx.AsyncClient(timeout=timeout) as client_http:
            r = await client_http.post(INDEXNOW_ENDPOINT, json=payload)
        if r.status_code in (200, 202):
            logger.info(f"[IndexNow] submitted {len(urls)} url(s) → {r.status_code}")
            return {"status": r.status_code, "submitted": len(urls)}
        logger.warning(f"[IndexNow] {r.status_code}: {r.text[:200]}")
        return {"status": r.status_code, "error": r.text[:200]}
    except Exception as e:
        logger.warning(f"[IndexNow] submission failed: {e}")
        return None


def submit_in_background(db, urls: List[str], host: str) -> None:
    """
    Schedule submission without awaiting. Use this from request handlers so
    listing-create/update endpoints return immediately to the user.
    """
    try:
        asyncio.create_task(submit_urls(db, urls, host))
    except RuntimeError:
        # No running loop — happens during startup tasks; just skip
        pass


async def ping_google_sitemap(sitemap_url: str, timeout: float = 5.0) -> None:
    """
    Legacy 'sitemap ping' to Google. Google deprecated this in 2023 but it still
    works for many sites and is harmless. Best-effort; ignores errors.
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client_http:
            await client_http.get(
                "https://www.google.com/ping",
                params={"sitemap": sitemap_url},
            )
    except Exception:
        pass
