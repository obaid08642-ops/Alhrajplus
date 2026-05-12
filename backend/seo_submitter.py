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
import os
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
    Schedule submission to ALL configured engines without awaiting.
    - IndexNow (Bing, Yandex, Seznam, Naver) — always
    - Google Indexing API — only if GOOGLE_INDEXING_SA_JSON env is set
    """
    try:
        asyncio.create_task(submit_urls(db, urls, host))
        # Google Indexing — fan-out in parallel; no-op if not configured
        asyncio.create_task(submit_google(urls, "URL_UPDATED"))
    except RuntimeError:
        # No running loop — happens during startup tasks; just skip
        pass


async def ping_google_sitemap(sitemap_url: str, timeout: float = 5.0) -> None:
    """Legacy Google sitemap ping (deprecated 2023, harmless if it fails)."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client_http:
            await client_http.get("https://www.google.com/ping", params={"sitemap": sitemap_url})
    except Exception:
        pass
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


# ============================================================
# Google Indexing API
# ============================================================
# Officially supports JobPosting + BroadcastEvent. In practice many sites use it
# for general pages too. Requires a Google Cloud Service Account JSON file with
# "Owner" permission in Search Console for the property.
#
# Setup steps (one-time, manual):
#   1. https://console.cloud.google.com → enable "Indexing API"
#   2. IAM → Service Accounts → Create → grant role "Service Account User"
#   3. Keys → Add Key → JSON → download
#   4. Search Console → Property → Settings → Users & permissions → add the
#      service account email with "Owner" role
#   5. Set env GOOGLE_INDEXING_SA_JSON to the JSON file contents (full string)
# ============================================================
_GOOGLE_INDEX_SCOPES = ["https://www.googleapis.com/auth/indexing"]
_google_index_client = None  # lazy, cached


def _build_google_indexing_client():
    """Return a cached google-api client, or None if not configured."""
    global _google_index_client
    if _google_index_client is not None:
        return _google_index_client
    import json
    sa_json = os.environ.get("GOOGLE_INDEXING_SA_JSON", "").strip()
    if not sa_json:
        return None
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        info = json.loads(sa_json)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=_GOOGLE_INDEX_SCOPES
        )
        _google_index_client = build("indexing", "v3", credentials=creds, cache_discovery=False)
        return _google_index_client
    except Exception as e:
        logger.warning(f"[GoogleIndexing] client init failed: {e}")
        return None


async def submit_google(urls: List[str], action: str = "URL_UPDATED") -> Optional[dict]:
    """
    Submit URLs to Google Indexing API. action ∈ {"URL_UPDATED", "URL_DELETED"}.
    Returns count of successes/failures or None when not configured.
    """
    cli = _build_google_indexing_client()
    if cli is None or not urls:
        return None
    # google-api-python-client is sync; run in executor to keep loop free
    def _do():
        ok, fail = 0, 0
        for u in urls:
            try:
                cli.urlNotifications().publish(body={"url": u, "type": action}).execute()
                ok += 1
            except Exception as e:
                logger.warning(f"[GoogleIndexing] {u} → {e}")
                fail += 1
        return {"ok": ok, "fail": fail}
    try:
        return await asyncio.to_thread(_do)
    except Exception as e:
        logger.warning(f"[GoogleIndexing] batch failed: {e}")
        return None
