"""
Google Indexing API integration.

Spec: https://developers.google.com/search/apis/indexing-api/v3/quickstart

Auth: a Google Cloud service account with the Indexing API enabled and added
to Google Search Console as an Owner of the verified property.

Configuration (env vars):
  GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON  — full JSON blob (recommended for cloud
                                          deployments — paste the file contents)
  GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE  — path to a .json file (recommended for
                                          local dev)

Behaviour:
- Endpoint is rate-limited (default ~200/day per service account). We enforce
  a simple per-process token bucket + an in-memory queue with a background
  worker so we never block the request that triggered the indexing.
- Errors are logged but never raised — indexing is best-effort.
"""
from __future__ import annotations
import os
import json
import asyncio
import logging
from typing import Optional, Literal

logger = logging.getLogger("haraj_plus.google_indexing")

# Lazy-imported to keep startup cheap when the integration isn't configured.
_creds_cache = None
_initialized = False
_queue: "asyncio.Queue[tuple[str, str]]" = asyncio.Queue(maxsize=10000)
_worker_started = False
# Throttle: 1 request every 0.5s ≈ 7200/day cap — well below quota with a buffer.
_MIN_INTERVAL_S = 0.5

NotificationType = Literal["URL_UPDATED", "URL_DELETED"]


def _load_credentials():
    """Return google.oauth2 Credentials or None if not configured."""
    global _creds_cache, _initialized
    if _initialized:
        return _creds_cache
    _initialized = True

    raw = os.environ.get("GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON", "").strip()
    path = os.environ.get("GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE", "").strip()

    info: Optional[dict] = None
    if raw:
        try:
            info = json.loads(raw)
        except Exception as e:
            logger.error(f"[google_indexing] failed to parse GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON: {e}")
            return None
    elif path and os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                info = json.load(f)
        except Exception as e:
            logger.error(f"[google_indexing] failed to read {path}: {e}")
            return None
    else:
        # Not configured — silently disabled. The queue worker will discard
        # incoming items rather than crash.
        return None

    try:
        from google.oauth2 import service_account  # type: ignore
        _creds_cache = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/indexing"]
        )
        logger.info("[google_indexing] service account loaded — Indexing API enabled")
        return _creds_cache
    except Exception as e:
        logger.error(f"[google_indexing] credential init failed: {e}")
        return None


def is_configured() -> bool:
    return _load_credentials() is not None


async def _publish(url: str, type_: NotificationType) -> bool:
    """Single synchronous call wrapped in a thread to avoid blocking the loop."""
    creds = _load_credentials()
    if not creds:
        return False
    try:
        # Refresh + build authenticated session in a worker thread.
        def _do():
            from google.auth.transport.requests import Request as _Req  # type: ignore
            from google.auth.transport.requests import AuthorizedSession  # type: ignore
            if not creds.valid:
                creds.refresh(_Req())
            session = AuthorizedSession(creds)
            r = session.post(
                "https://indexing.googleapis.com/v3/urlNotifications:publish",
                json={"url": url, "type": type_},
                timeout=10,
            )
            return r.status_code, (r.text or "")[:300]
        status, text = await asyncio.to_thread(_do)
        if 200 <= status < 300:
            logger.info(f"[google_indexing] {type_} ok url={url}")
            return True
        # 429 = quota exceeded for the day; 403 = perms; 404 = URL not in scope.
        logger.warning(f"[google_indexing] {type_} status={status} body={text}")
        return False
    except Exception as e:
        logger.warning(f"[google_indexing] publish failed url={url} err={e}")
        return False


async def _worker():
    """Drain the queue at the throttled rate. Runs forever."""
    while True:
        try:
            url, type_ = await _queue.get()
            await _publish(url, type_)
            await asyncio.sleep(_MIN_INTERVAL_S)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.warning(f"[google_indexing.worker] {e}")
            await asyncio.sleep(_MIN_INTERVAL_S)


def _ensure_worker():
    global _worker_started
    if _worker_started:
        return
    if not is_configured():
        return  # No worker if not configured — items get silently dropped.
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(_worker())
        _worker_started = True
        logger.info("[google_indexing] background worker started")
    except RuntimeError:
        # Outside of an event loop (rare) — caller will retry later.
        pass


def enqueue(url: str, type_: NotificationType = "URL_UPDATED") -> None:
    """
    Fire-and-forget queueing. Safe to call from any code path that already
    runs in an event loop. Never raises.
    """
    if not url:
        return
    if not is_configured():
        return
    _ensure_worker()
    try:
        _queue.put_nowait((url, type_))
    except asyncio.QueueFull:
        logger.warning(f"[google_indexing] queue full, dropping url={url}")


def enqueue_updated(url: str) -> None:
    enqueue(url, "URL_UPDATED")


def enqueue_deleted(url: str) -> None:
    enqueue(url, "URL_DELETED")
