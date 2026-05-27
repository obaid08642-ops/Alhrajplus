"""
الحراج بلس - Backend FastAPI
JWT Auth + Listings + Categories + Cities + Chat + Admin + Cloudinary + Ads
"""
from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import time
import asyncio
import json
import logging
import secrets
import bcrypt
import jwt
import httpx
import resend
import re
import cloudinary
import cloudinary.utils
import cloudinary.uploader
import cloudinary.api
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query, APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.responses import RedirectResponse, HTMLResponse, PlainTextResponse, JSONResponse, Response
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient

from seed_data import COUNTRIES, CATEGORIES, DEFAULT_THEME
from i18n_data import localize_categories, t_option, t_category
from search_engine import (
    normalize_arabic,
    build_search_blob,
    search_listings as _search_listings_engine,
    suggest as _search_suggest_engine,
)
from seo_submitter import (
    submit_in_background as _seo_submit_bg,
    get_or_create_indexnow_key as _get_indexnow_key,
    ping_google_sitemap as _ping_google_sitemap,
)
from google_indexing import (
    enqueue_updated as _google_idx_updated,
    enqueue_deleted as _google_idx_deleted,
)


# ============================================================
# Slug generation — SEO-friendly URLs for listings
# Converts "مرسيدس C200 2022" → "mercedes-c200-2022"
# Falls back to UUID prefix if title yields nothing latin.
# ============================================================
import re as _re_slug
import unicodedata as _ud_slug

# Light Arabic → Latin transliteration (just enough to get readable slugs).
_AR_MAP = {
    "ا": "a", "أ": "a", "إ": "i", "آ": "a", "ب": "b", "ت": "t", "ث": "th",
    "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "th", "ر": "r", "ز": "z",
    "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a",
    "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
    "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "h", "ء": "", "ؤ": "w",
    "ئ": "y", "َ": "", "ُ": "", "ِ": "", "ّ": "", "ْ": "", "ً": "", "ٌ": "", "ٍ": "",
}


def _slugify(text: str, max_len: int = 80) -> str:
    if not text:
        return ""
    # Arabic transliteration
    out = []
    for ch in text:
        if ch in _AR_MAP:
            out.append(_AR_MAP[ch])
        else:
            out.append(ch)
    s = "".join(out)
    # Unicode normalize → strip non-ascii diacritics for Latin scripts
    s = _ud_slug.normalize("NFKD", s)
    s = s.encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = _re_slug.sub(r"[^a-z0-9]+", "-", s).strip("-")
    s = _re_slug.sub(r"-{2,}", "-", s)
    return s[:max_len].strip("-")


async def _unique_slug(base: str, listing_id: str) -> str:
    """Append short suffix from listing_id if base is empty or already taken."""
    base = base or "listing"
    suffix = listing_id.replace("-", "")[:6]
    candidate = base
    existing = await db.listings.find_one({"slug": candidate, "id": {"$ne": listing_id}}, {"_id": 0, "id": 1})
    if existing:
        candidate = f"{base}-{suffix}"
    return candidate

logger = logging.getLogger("haraj_plus")

# ============================================================
# Configuration — fail-soft: missing env vars log a warning but
# do NOT crash the app at import time (which would prevent uvicorn
# from binding the PORT and trigger Cloud Run's "failed to listen
# on the port" error before logs even appear).
# ============================================================
ROOT_DIR = Path(__file__).parent

def _env(key: str, *, required: bool = False, default: str = "") -> str:
    val = os.environ.get(key, default)
    if required and not val:
        # Log loudly but DO NOT raise — startup hook will fail clearly later.
        logging.basicConfig(level=logging.INFO)
        logger.error(f"[config] MISSING required env var: {key}")
    return val

MONGO_URL = _env("MONGO_URL", required=True, default="mongodb://localhost:27017")
DB_NAME = _env("DB_NAME", required=True, default="haraj_plus_db")
JWT_SECRET = _env("JWT_SECRET", required=True, default="change-me-in-production")
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = _env("ADMIN_EMAIL", default="admin@harajplus.com")
ADMIN_PASSWORD = _env("ADMIN_PASSWORD", default="Admin@HarajPlus2026")

# Cloudinary — config is lazy; missing keys only fail when an upload is attempted
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
    secure=True,
)

# Resend (email)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev").strip()
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Emergent Auth
# Emergent Auth — DEPRECATED (kept for backward compat only; not used).
# Google OAuth is now handled directly — see /api/auth/google/start and /callback.
EMERGENT_AUTH_URL = ""

# Emergent LLM Key (for AI features)
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()
# Fallback to direct Gemini API key when running outside Emergent platform
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not EMERGENT_LLM_KEY and GEMINI_API_KEY:
    EMERGENT_LLM_KEY = GEMINI_API_KEY  # Gemini keys are accepted directly by llm_shim
X_CLIENT_ID = os.environ.get("X_CLIENT_ID", "").strip()
X_CLIENT_SECRET = os.environ.get("X_CLIENT_SECRET", "").strip()
SNAPCHAT_CLIENT_ID = os.environ.get("SNAPCHAT_CLIENT_ID", "").strip()
SNAPCHAT_CLIENT_SECRET = os.environ.get("SNAPCHAT_CLIENT_SECRET", "").strip()
# Apple Sign In (web)
# APPLE_CLIENT_ID = Services ID (com.alhrajplus.web), APPLE_TEAM_ID = Apple developer team id,
# APPLE_KEY_ID = id of the .p8 private key, APPLE_PRIVATE_KEY = full .p8 contents (newlines as \n).
APPLE_CLIENT_ID = os.environ.get("APPLE_CLIENT_ID", "").strip()
APPLE_TEAM_ID = os.environ.get("APPLE_TEAM_ID", "").strip()
APPLE_KEY_ID = os.environ.get("APPLE_KEY_ID", "").strip()
APPLE_PRIVATE_KEY = os.environ.get("APPLE_PRIVATE_KEY", "").replace("\\n", "\n").strip()
APPLE_REDIRECT_URI = os.environ.get(
    "APPLE_REDIRECT_URI",
    "https://alhrajplus.onrender.com/api/auth/apple/callback",
).strip()

# DB
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=8000,  # fail fast (8s) on bad/unreachable URL
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
    retryWrites=True,
)
db = client[DB_NAME]

# Startup banner — masks credentials but shows DB selection so deployment
# misconfiguration (wrong DB_NAME / wrong cluster) is obvious in container logs.
def _mask_mongo_url(u: str) -> str:
    try:
        if "@" in u:
            scheme, rest = u.split("://", 1)
            creds, host = rest.split("@", 1)
            return f"{scheme}://***@{host}"
        return u
    except Exception:
        return "***"
logger.info("[db] MONGO_URL=%s DB_NAME=%s", _mask_mongo_url(MONGO_URL), DB_NAME)

# ============================================================
# App
# ============================================================
app = FastAPI(title="Haraj Plus API", version="1.0")
api = APIRouter(prefix="/api")


_APP_START_TIME = None

@api.get("/health", include_in_schema=False)
@api.head("/health", include_in_schema=False)
async def health_api():
    """DB-aware health check. Returns 200 even if DB is slow — frontend just needs proof the server is up."""
    global _APP_START_TIME
    import time as _t
    if _APP_START_TIME is None:
        _APP_START_TIME = _t.time()
    db_ok = False
    try:
        await asyncio.wait_for(client.admin.command("ping"), timeout=2.0)
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "ok",
        "db": "connected" if db_ok else "down",
        "uptime": int(_t.time() - _APP_START_TIME),
    }

# Default CORS origins (production domains pre-wired so it works after migration without code edits)
# Render allows the backend to receive requests from any of these by default.
# To override, set CORS_ORIGINS env var as a comma-separated list (e.g. "https://my-app.vercel.app,https://alhraj.online")
DEFAULT_CORS = ",".join([
    "https://alhraj.online",
    "https://www.alhraj.online",
    "https://haraj-plus.web.app",
    "https://haraj-plus.firebaseapp.com",
    # Vercel preview + production (wildcards not supported by FastAPI CORS — match exact subdomains via regex below)
    "https://haraj-plus.vercel.app",
    "https://alhrajplus.vercel.app",
    # Hostinger (when user moves there)
    "https://alhrajplus.com",
    "https://www.alhrajplus.com",
    # Local dev
    "http://localhost:3000",
    "http://127.0.0.1:3000",
])
cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", DEFAULT_CORS).split(",") if o.strip()]
# Matches any *.vercel.app preview URL (e.g. haraj-plus-git-main-user.vercel.app)
_CORS_REGEX = os.environ.get("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app$")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],
    allow_origin_regex=_CORS_REGEX if "*" not in cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Lightweight perf monitor: logs request duration + 5xx errors only.
# No external services, no overhead beyond a time.perf_counter() pair.
# Also keeps rolling counters for /api/_metrics so ops can grep p95 + error rate.
_METRICS = {
    "requests_total": 0,
    "errors_total": 0,
    "slow_total": 0,  # > 500ms
    "durations_ms": [],  # rolling window, max 500 entries
    "by_path": {},  # { path: {"n": int, "errs": int, "sum_ms": float, "max_ms": float} }
    "started_at": __import__("time").time(),
}

def _track_metric(path: str, status: int, dur_ms: float):
    _METRICS["requests_total"] += 1
    if status >= 500:
        _METRICS["errors_total"] += 1
    if dur_ms > 500:
        _METRICS["slow_total"] += 1
    dl = _METRICS["durations_ms"]
    dl.append(dur_ms)
    if len(dl) > 500:
        del dl[: len(dl) - 500]
    p = _METRICS["by_path"].setdefault(path, {"n": 0, "errs": 0, "sum_ms": 0.0, "max_ms": 0.0})
    p["n"] += 1
    p["sum_ms"] += dur_ms
    if dur_ms > p["max_ms"]:
        p["max_ms"] = dur_ms
    if status >= 500:
        p["errs"] += 1

# Force UTF-8 charset on all JSON responses so Arabic / RTL text renders
# correctly even when intermediaries (CDN, browser) misinterpret the
# default `application/json` as ISO-8859-1.
@app.middleware("http")
async def _utf8_json_charset(request, call_next):
    response = await call_next(request)
    ct = response.headers.get("content-type", "")
    if ct.startswith("application/json") and "charset" not in ct.lower():
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response


@app.middleware("http")
async def _perf_logger(request, call_next):
    import time as _t
    start = _t.perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
    except Exception as e:
        dur_ms = (_t.perf_counter() - start) * 1000
        _track_metric(request.url.path, 500, dur_ms)
        logger.error(f"[perf] {request.method} {request.url.path} 500 {dur_ms:.0f}ms err={e}")
        raise
    dur_ms = (_t.perf_counter() - start) * 1000
    _track_metric(request.url.path, status, dur_ms)
    # Only log slow (>500ms) or error responses to keep stdout clean
    if dur_ms > 500 or response.status_code >= 500:
        logger.warning(f"[perf] {request.method} {request.url.path} {response.status_code} {dur_ms:.0f}ms")
    # Add Server-Timing so the browser DevTools shows duration
    response.headers["Server-Timing"] = f"app;dur={dur_ms:.0f}"
    return response


# ============================================================
# Lightweight in-process rate limiter — fixed 60-second window per IP.
# Only enforced on hot paths (/api/listings + /api/auth/*) to keep overhead
# negligible for the rest of the API. Counters are kept in a plain dict so
# the limiter survives without Redis. For multi-process deploys behind a
# load balancer, swap this to a Redis-backed INCR with EX.
# ============================================================
_RL_WINDOW_S = 60
_RL_LIMITS = {
    "listings": int(os.environ.get("RATE_LIMIT_LISTINGS", "100")),  # /api/listings
    "auth":     int(os.environ.get("RATE_LIMIT_AUTH", "30")),       # /api/auth/*
}
_RL_BUCKETS: dict = {}  # { "<kind>:<ip>": (window_start_ts, count) }

def _client_ip(req) -> str:
    # Honor X-Forwarded-For when behind a proxy (Vercel/Cloudflare).
    fwd = req.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return (req.client.host if req.client else "unknown")

def _rl_kind(path: str) -> Optional[str]:
    if path.startswith("/api/auth"):
        return "auth"
    if path == "/api/listings" or path.startswith("/api/listings?"):
        return "listings"
    return None

@app.middleware("http")
async def _rate_limit(request, call_next):
    import time as _t
    # Abuse protection: cap request body size on writes (10 MB hard limit).
    # Reject early — protects DB, JSON parser, and memory from hostile clients.
    if request.method in ("POST", "PUT", "PATCH"):
        cl = request.headers.get("content-length")
        try:
            if cl and int(cl) > 10 * 1024 * 1024:
                return JSONResponse(status_code=413, content={"detail": "Payload too large (max 10MB)"})
        except Exception:
            pass
    kind = _rl_kind(request.url.path)
    if not kind:
        return await call_next(request)
    limit = _RL_LIMITS[kind]
    ip = _client_ip(request)
    key = f"{kind}:{ip}"
    now = _t.time()
    ws, cnt = _RL_BUCKETS.get(key, (now, 0))
    if now - ws >= _RL_WINDOW_S:
        ws, cnt = now, 0
    cnt += 1
    _RL_BUCKETS[key] = (ws, cnt)
    # Periodic GC: every ~200 calls, drop expired buckets so memory stays bounded.
    if _METRICS["requests_total"] % 200 == 0:
        cutoff = now - _RL_WINDOW_S
        expired = [k for k, v in list(_RL_BUCKETS.items()) if v[0] < cutoff]
        for k in expired:
            _RL_BUCKETS.pop(k, None)
    remaining = max(0, limit - cnt)
    retry = max(1, int(_RL_WINDOW_S - (now - ws)))
    if cnt > limit:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too Many Requests"},
            headers={
                "Retry-After": str(retry),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(retry),
            },
        )
    response = await call_next(request)
    # Surface remaining quota on every successful rate-limited response.
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response


# ============================================================
# Health endpoints (used by Render keep-alive cron / Vercel health checks)
# Both /health (root) and /api/health (api router) are exposed so any
# uptime monitor or rewrite rule works without extra config.
# Lightweight — no DB hit on the root endpoint so cold-start ping is fast.
# ============================================================
@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health_root():
    return {"status": "ok", "service": "haraj-plus-backend"}


@app.get("/", include_in_schema=False)
@app.head("/", include_in_schema=False)
async def root_index():
    return {"status": "ok", "service": "haraj-plus-backend", "docs": "/docs"}


# Debug endpoint — confirms which Mongo cluster + DB the live container is using
# and reports counts. No auth required so deployment misconfig is one curl away.
@app.get("/api/debug/db-check", include_in_schema=False)
async def _debug_db_check():
    try:
        ping = await asyncio.wait_for(client.admin.command("ping"), timeout=4.0)
    except Exception as e:
        return JSONResponse(status_code=500, content={"ok": False, "ping_error": str(e), "mongo_url_masked": _mask_mongo_url(MONGO_URL), "db_name": DB_NAME})
    cols = []
    try:
        cols = sorted(await db.list_collection_names())
    except Exception as e:
        return {"ok": False, "list_error": str(e), "mongo_url_masked": _mask_mongo_url(MONGO_URL), "db_name": DB_NAME}
    counts = {}
    for name in ("listings", "users", "messages", "conversations", "ads", "categories", "cities", "meta_categories"):
        try:
            counts[name] = await db[name].count_documents({})
        except Exception:
            counts[name] = -1
    # Surface filters the API applies so we can see if data is "hidden" by status/moderation.
    filters = {
        "listings_total": counts.get("listings", 0),
        "listings_active": await db.listings.count_documents({"status": "active"}) if counts.get("listings", 0) else 0,
        "listings_approved": await db.listings.count_documents({"moderation": "approved"}) if counts.get("listings", 0) else 0,
        "listings_visible": await db.listings.count_documents({"status": "active", "moderation": "approved"}) if counts.get("listings", 0) else 0,
    }
    note = "categories & cities are SERVED FROM CODE (i18n_data.py), not from DB collections — empty DB collections are expected."
    # Sample one document + distinct field values — helps spot data shape drift
    # (e.g. status saved as "Active" vs "active", moderation as bool vs string).
    sample = None
    distinct_status: list = []
    distinct_mod: list = []
    try:
        sample = await db.listings.find_one({}, {"_id": 0, "id": 1, "title": 1, "status": 1, "moderation": 1, "country_code": 1, "category": 1, "is_demo": 1, "created_at": 1})
        distinct_status = sorted([x for x in await db.listings.distinct("status") if x is not None])
        distinct_mod = sorted([x for x in await db.listings.distinct("moderation") if x is not None])
    except Exception:
        pass
    return {
        "ok": True,
        "mongo_url_masked": _mask_mongo_url(MONGO_URL),
        "db_name": DB_NAME,
        "ping": ping,
        "collections": cols,
        "counts": counts,
        "filters": filters,
        "distinct_status_values": distinct_status,
        "distinct_moderation_values": distinct_mod,
        "sample_listing": sample,
        "note": note,
    }


# Debug-only: raw listings (no status/moderation filter). Use to confirm whether
# the issue is "no data in DB" vs "filters hiding visible data".
@app.get("/api/debug/listings-raw", include_in_schema=False)
async def _debug_listings_raw(limit: int = 5):
    limit = max(1, min(limit, 20))
    items = await db.listings.find({}, {"_id": 0}).limit(limit).to_list(length=limit)
    return {"count": len(items), "items": items}


# Lightweight metrics endpoint — no Prometheus, just enough to grep latency/errors
# from the live container. Numbers reset on restart, which is fine for a single
# process; switch to Redis/Prom if you scale horizontally.
@app.get("/api/_metrics", include_in_schema=False)
async def _metrics_endpoint():
    import time as _t, os as _os
    dl = list(_METRICS["durations_ms"])
    dl_sorted = sorted(dl)
    n = len(dl_sorted)
    def _pct(p):
        if not n:
            return 0
        idx = min(n - 1, int(n * p))
        return round(dl_sorted[idx], 1)
    top_paths = sorted(
        [
            {
                "path": k,
                "n": v["n"],
                "errs": v["errs"],
                "avg_ms": round(v["sum_ms"] / max(1, v["n"]), 1),
                "max_ms": round(v["max_ms"], 1),
            }
            for k, v in _METRICS["by_path"].items()
        ],
        key=lambda x: x["n"],
        reverse=True,
    )[:20]
    hits = _METRICS.get("cache_hits", 0)
    misses = _METRICS.get("cache_misses", 0)
    cache_total = hits + misses
    redis_status = _redis_status() if "_redis_status" in globals() else "off"
    # Lightweight memory probe via /proc (no psutil dep).
    mem_mb = 0
    try:
        with open(f"/proc/{_os.getpid()}/status") as f:
            for ln in f:
                if ln.startswith("VmRSS:"):
                    mem_mb = round(int(ln.split()[1]) / 1024, 1)
                    break
    except Exception:
        pass
    uptime_s = round(_t.time() - _METRICS.get("started_at", _t.time()), 1)
    rpm = round(_METRICS["requests_total"] / max(0.01, uptime_s) * 60, 1)
    return {
        "uptime_s": uptime_s,
        "memory_mb": mem_mb,
        "requests_total": _METRICS["requests_total"],
        "requests_per_min": rpm,
        "errors_total": _METRICS["errors_total"],
        "slow_total_gt_500ms": _METRICS["slow_total"],
        "error_rate": round(_METRICS["errors_total"] / max(1, _METRICS["requests_total"]), 4),
        "avg_ms": round(sum(dl) / max(1, n), 1),
        "latency_ms": {
            "p50": _pct(0.50),
            "p90": _pct(0.90),
            "p95": _pct(0.95),
            "p99": _pct(0.99),
            "samples": n,
        },
        "cache": {
            "redis": redis_status,
            "cache_layer": "redis" if redis_status == "on" else "memory",
            "listings_entries": len(_LISTINGS_CACHE) if "_LISTINGS_CACHE" in globals() else 0,
            "hits": hits,
            "misses": misses,
            "hit_rate": round(hits / max(1, cache_total), 4),
        },
        "rate_limit": {
            "active_buckets": len(_RL_BUCKETS) if "_RL_BUCKETS" in globals() else 0,
        },
        "top_paths": top_paths,
    }


# ============================================================
# Email helper (Resend)
# ============================================================
async def send_password_reset_email(to_email: str, reset_url: str, user_name: str = "") -> bool:
    """Send password reset email via Resend. Returns True if sent, False if no API key."""
    if not RESEND_API_KEY:
        return False
    html = f"""
    <div style="font-family:Arial,Tahoma,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#0F1A35;direction:rtl">
      <div style="text-align:center;padding:20px 0;border-bottom:2px solid #4FB6E6">
        <h1 style="color:#0F1A35;font-size:28px;margin:0">الحراج <span style="color:#4FB6E6">بلس</span></h1>
      </div>
      <h2 style="color:#0F1A35;font-size:20px">مرحباً {user_name or 'عزيزي المستخدم'} 👋</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7">
        لقد طلبت إعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة.
        صلاحية الرابط <strong>ساعة واحدة</strong> فقط.
      </p>
      <div style="text-align:center;padding:24px 0">
        <a href="{reset_url}" style="background:#4FB6E6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;font-size:14px;display:inline-block">إعادة تعيين كلمة المرور</a>
      </div>
      <p style="color:#94A3B8;font-size:12px;line-height:1.7">
        إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد.<br>
        أو انسخ الرابط: <span style="color:#4FB6E6;word-break:break-all">{reset_url}</span>
      </p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
      <p style="color:#94A3B8;font-size:11px;text-align:center">© 2026 الحراج بلس - السوق الذكي للخليج العربي</p>
    </div>
    """
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": "إعادة تعيين كلمة المرور - الحراج بلس",
        "html": html,
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        logger.error(f"[Resend] Failed: {e}")
        return False


# ============================================================
# Daily Digest Email — sent to sellers each evening
# ============================================================
async def send_daily_digest_to(user_id: str) -> bool:
    """Build and send a daily digest email to a single seller. Returns True if sent."""
    if not RESEND_API_KEY:
        return False
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "name": 1, "id": 1})
    if not user or not user.get("email"):
        return False

    # Time window: last 24 hours
    from datetime import timedelta
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    # Aggregate metrics
    my_listings = await db.listings.find({"user_id": user_id, "status": "active"}, {"_id": 0, "id": 1, "title": 1, "views": 1, "favorites": 1, "price": 1, "currency": 1}).to_list(length=200)
    if not my_listings:
        return False  # nothing to report

    listing_ids = [l["id"] for l in my_listings]
    total_views = sum(l.get("views", 0) for l in my_listings)
    favs_count = await db.favorites.count_documents({"listing_id": {"$in": listing_ids}, "created_at": {"$gte": since}})
    unread_msgs = await db.messages.count_documents({"to_user": user_id, "read": False})
    new_followers = await db.follows.count_documents({"seller_id": user_id, "created_at": {"$gte": since}})
    # Top listing of the day
    top = sorted(my_listings, key=lambda x: x.get("views", 0), reverse=True)[:3]

    rows = "".join([
        f'<tr><td style="padding:8px;border-bottom:1px solid #E8F2FA">{l["title"][:50]}</td>'
        f'<td style="padding:8px;text-align:center;border-bottom:1px solid #E8F2FA">👁 {l.get("views", 0)}</td></tr>'
        for l in top
    ])

    html = f"""
    <div style="font-family:Arial,Tahoma,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#F0F8FE;direction:rtl">
      <div style="background:linear-gradient(135deg,#4FB6E6 0%,#3AA9DD 100%);padding:32px 24px;text-align:center;color:#fff">
        <h1 style="margin:0;font-size:26px">📊 ملخص يومك على الحراج بلس</h1>
        <p style="margin:8px 0 0;opacity:.9;font-size:14px">مرحباً {user.get('name', 'بائع متميز')}</p>
      </div>
      <div style="padding:24px;background:#fff">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px">
          <div style="background:#F0F8FE;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#4FB6E6">{total_views}</div>
            <div style="font-size:12px;color:#64748B">مشاهدة إجمالية</div>
          </div>
          <div style="background:#FEF3C7;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#D97706">{favs_count}</div>
            <div style="font-size:12px;color:#64748B">مفضل اليوم</div>
          </div>
          <div style="background:#DBEAFE;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#2563EB">{unread_msgs}</div>
            <div style="font-size:12px;color:#64748B">رسالة لم تُقرأ</div>
          </div>
          <div style="background:#DCFCE7;border-radius:12px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:900;color:#16A34A">{new_followers}</div>
            <div style="font-size:12px;color:#64748B">متابع جديد</div>
          </div>
        </div>

        <h3 style="color:#0F1A35;font-size:16px;margin:24px 0 8px">🔥 إعلاناتك الأكثر مشاهدة</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          {rows or '<tr><td style="padding:8px;color:#94A3B8">لا توجد إعلانات نشطة حالياً</td></tr>'}
        </table>

        <div style="text-align:center;padding:24px 0">
          <a href="https://alhraj.online/profile" style="background:#4FB6E6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;font-size:14px;display:inline-block">عرض لوحة التحكم</a>
        </div>

        <p style="color:#94A3B8;font-size:11px;text-align:center;margin-top:16px">
          💡 نصيحة اليوم: حدّث صور إعلانك بصور عالية الجودة لزيادة المشاهدات بنسبة 3 أضعاف!
        </p>
      </div>
      <div style="background:#0F1A35;color:#94A3B8;padding:16px;text-align:center;font-size:11px">
        © 2026 الحراج بلس | <a href="https://alhraj.online/settings" style="color:#4FB6E6">إيقاف التنبيهات اليومية</a>
      </div>
    </div>
    """
    params = {
        "from": SENDER_EMAIL,
        "to": [user["email"]],
        "subject": f"📊 ملخصك اليومي - {total_views} مشاهدة، {unread_msgs} رسالة جديدة",
        "html": html,
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        logger.error(f"[Digest] Failed for {user_id}: {e}")
        return False


# Public endpoint to trigger daily digest (called by Cloud Scheduler / cron at 8 PM)
@api.post("/cron/daily-digest")
@api.get("/cron/daily-digest")
async def cron_daily_digest(request: Request):
    """
    Send daily digest to all active sellers. Protected by CRON_SECRET header.
    Setup with Cloud Scheduler / cron-job.org: HTTP GET or POST every day at 20:00.
    Authentication: pass the secret via either:
      - Header:  X-Cron-Secret: <CRON_SECRET>
      - Query:   ?secret=<CRON_SECRET>   (handy for cron-job.org / UptimeRobot)
    """
    secret_header = request.headers.get("X-Cron-Secret", "") or request.query_params.get("secret", "")
    expected = os.environ.get("CRON_SECRET", "")
    if not expected or secret_header != expected:
        raise HTTPException(403, "Forbidden — provide a valid X-Cron-Secret header or ?secret= query param")
    # Find all users who have at least one active listing
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$user_id"}},
    ]
    user_ids = [doc["_id"] async for doc in db.listings.aggregate(pipeline)]
    sent = 0
    failed = 0
    for uid in user_ids:
        try:
            ok = await send_daily_digest_to(uid)
            if ok: sent += 1
            else: failed += 1
        except Exception as e:
            logger.error(f"[digest] error {uid}: {e}")
            failed += 1
    return {"sent": sent, "failed": failed, "total_sellers": len(user_ids)}


# Admin: trigger digest for self (for testing) — defined later after get_current_user is available


# ============================================================
# Security helpers
# ============================================================
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(uid: str, email: str, role: str) -> str:
    payload = {"sub": uid, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
               "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(uid: str) -> str:
    payload = {"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(resp: Response, access: str, refresh: str):
    resp.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=2592000, path="/")

def clear_auth_cookies(resp: Response):
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        if user.get("banned"):
            raise HTTPException(403, "Account banned")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user


# ============================================================
# Models
# ============================================================
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=8, max_length=20)
    country_code: str = Field(min_length=2, max_length=3)
    city: Optional[str] = None
    referral_code: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ListingIn(BaseModel):
    title: str = Field(min_length=4, max_length=120)
    description: str = Field(min_length=5, max_length=4000)
    price: Optional[float] = None
    currency: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    custom_fields: dict = {}
    images: List[str] = []
    videos: List[str] = []
    country_code: Optional[str] = None  # active country at time of post (overrides profile default)
    city: str
    district: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    show_phone: bool = True
    contact_phone: Optional[str] = None  # optional override phone for this listing
    post_type: Optional[str] = None  # offer | request

class ChatMessageIn(BaseModel):
    listing_id: Optional[str] = None
    receiver_id: str
    text: Optional[str] = None
    image: Optional[str] = None
    voice: Optional[str] = None
    location: Optional[dict] = None  # {lat, lng}
    reply_to: Optional[dict] = None  # snapshot {id, text, image, sender_name}

class ReportIn(BaseModel):
    target_type: str  # listing | user | message
    target_id: str
    reason: str

class AdIn(BaseModel):
    title: str
    image_url: Optional[str] = ""  # not required for iframe ads
    link_url: Optional[str] = ""
    placement: str  # home_top | home_middle | home_bottom | listing_bottom | sidebar
    active: bool = True
    country_code: Optional[str] = None  # filter by country, None = all
    # Iframe-based banners (e.g., Trip.com affiliate banners)
    ad_type: Optional[str] = "image"  # image | iframe
    iframe_url: Optional[str] = ""
    iframe_width: Optional[int] = 300
    iframe_height: Optional[int] = 250

class ThemeIn(BaseModel):
    primary_color: Optional[str] = None
    primary_hover: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_arabic_heading: Optional[str] = None
    font_arabic_body: Optional[str] = None
    site_name: Optional[str] = None
    tagline_ar: Optional[str] = None


# ============================================================
# Public meta endpoints
# ============================================================
@api.get("/")
async def root():
    return {"app": "haraj_plus", "status": "ok", "version": "1.0"}

@api.get("/meta/categories")
async def get_categories(lang: str = "ar"):
    lang = (lang or "ar").lower().strip()
    if lang not in ("ar", "en", "ur", "hi", "bn", "fr"):
        lang = "ar"
    return localize_categories(CATEGORIES, lang)

@api.get("/auth/providers")
async def get_auth_providers():
    """Returns which OAuth providers are configured on the server.
    The frontend uses this to hide buttons for providers that lack credentials,
    so users don't see misleading "غير مُعد على الخادم" alerts.
    """
    return {
        "google": bool(os.environ.get("GOOGLE_CLIENT_ID", "").strip()),
        "apple": bool(APPLE_CLIENT_ID and APPLE_TEAM_ID and APPLE_KEY_ID and APPLE_PRIVATE_KEY),
        "x": bool(X_CLIENT_ID and X_CLIENT_SECRET),
        "snapchat": bool(SNAPCHAT_CLIENT_ID and SNAPCHAT_CLIENT_SECRET),
    }

@api.get("/meta/countries")
async def get_countries():
    """Return the country list with any admin geo overrides merged in.
    Overrides live in `db.geo_overrides` (one doc per country_code) and let
    the admin add/remove cities and districts without code changes."""
    overrides = {}
    try:
        async for d in db.geo_overrides.find({}, {"_id": 0}):
            overrides[d["country_code"]] = d
    except Exception:
        pass
    if not overrides:
        return COUNTRIES
    out = []
    for c in COUNTRIES:
        ov = overrides.get(c["code"])
        if not ov:
            out.append(c)
            continue
        merged = dict(c)
        cities = list(c.get("cities") or [])
        # Apply add_cities (skip duplicates by name_ar)
        names = {x.get("name_ar") for x in cities if isinstance(x, dict)}
        for nc in (ov.get("add_cities") or []):
            if isinstance(nc, dict) and nc.get("name_ar") and nc["name_ar"] not in names:
                cities.append(nc)
                names.add(nc["name_ar"])
        # Apply remove_cities (by name_ar)
        rm = set(ov.get("remove_cities") or [])
        if rm:
            cities = [x for x in cities if x.get("name_ar") not in rm]
        # Apply per-city district add/remove
        dist_ov = ov.get("districts") or {}  # {city_name_ar: {"add":[...], "remove":[...]}}
        if dist_ov:
            for i, city in enumerate(cities):
                co = dist_ov.get(city.get("name_ar"))
                if not co:
                    continue
                dlist = list(city.get("districts") or [])
                for nd in (co.get("add") or []):
                    if nd and nd not in dlist:
                        dlist.append(nd)
                rmd = set(co.get("remove") or [])
                if rmd:
                    dlist = [x for x in dlist if x not in rmd]
                cities[i] = {**city, "districts": dlist}
        merged["cities"] = cities
        out.append(merged)
    return out

@api.get("/meta/theme")
async def get_theme():
    doc = await db.settings.find_one({"_key": "theme"}, {"_id": 0})
    if not doc:
        return DEFAULT_THEME
    return doc.get("value", DEFAULT_THEME)


# ============================================================
# Auth endpoints
# ============================================================
@api.post("/auth/register")
async def register(body: RegisterIn, request: Request, response: Response):
    valid_codes = {c["code"] for c in COUNTRIES}
    if body.country_code not in valid_codes:
        raise HTTPException(400, "Invalid country code")
    # Validate phone format per country
    if not validate_phone(body.country_code, body.phone):
        raise HTTPException(400, f"رقم الجوال غير صحيح لدولة {body.country_code}. تحقق من البادئة والطول")
    email = body.email.lower().strip()
    existing = await db.users.find_one({"$or": [{"email": email}, {"phone_full": f"{body.country_code}{body.phone}"}]})
    if existing:
        raise HTTPException(400, "البريد أو رقم الجوال مسجل مسبقاً")
    uid = str(uuid.uuid4())
    # Validate referral code if provided
    referred_by = None
    if body.referral_code:
        rcode = body.referral_code.strip().upper()
        ref_user = await db.users.find_one({"referral_code": rcode})
        if ref_user:
            referred_by = rcode
    user = {
        "id": uid,
        "name": body.name.strip(),
        "email": email,
        "phone": body.phone,
        "country_code": body.country_code,
        "phone_full": f"{body.country_code}{body.phone}",
        "city": body.city,
        "password_hash": hash_password(body.password),
        "role": "user",
        "verified": False,
        "email_verified": False,
        "trust_score": 50,
        "avatar_url": None,
        "bio": "",
        "language": "ar",
        "banned": False,
        "referral_code": gen_referral_code(body.name),
        "referred_by": referred_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)

    # Send verification email (non-blocking failure)
    try:
        verify_token = secrets.token_urlsafe(32)
        await db.email_verify_tokens.insert_one({
            "token": verify_token, "user_id": uid,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
            "created_at": datetime.now(timezone.utc),
        })
        origin = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
        await send_verification_email(email, f"{origin}/verify-email?token={verify_token}", user["name"])
    except Exception as e:
        logger.error(f"[Register verify-email] {e}")

    user.pop("password_hash", None)
    user.pop("_id", None)
    access = create_access_token(uid, email, "user")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"user": user, "access_token": access, "refresh_token": refresh}

@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    # Identifier keyed per-account (email-only) — IP-based keying breaks behind K8s ingress
    identifier = email
    # brute force lockout
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    fails = await db.login_attempts.count_documents({
        "identifier": identifier,
        "ts": {"$gt": cutoff}
    })
    if fails >= 5:
        raise HTTPException(429, "تم قفل الحساب مؤقتاً. حاول بعد 15 دقيقة")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.insert_one({"identifier": identifier, "ts": datetime.now(timezone.utc)})
        raise HTTPException(401, "البريد أو كلمة المرور غير صحيحة")
    if user.get("banned"):
        raise HTTPException(403, "تم حظر حسابك")
    # success, clear attempts
    await db.login_attempts.delete_many({"identifier": identifier})
    access = create_access_token(user["id"], email, user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access, "refresh_token": refresh}

@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"success": True}

@api.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


class MeUpdateIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    country_code: Optional[str] = None  # 2-letter ISO; restricted to GCC + EG
    avatar_url: Optional[str] = None
    show_phone: Optional[bool] = None  # control whether buyers see the phone


@api.put("/users/me")
@api.put("/auth/me")
async def update_me(body: MeUpdateIn, user: dict = Depends(get_current_user)):
    update = {}
    if body.name is not None:
        n = body.name.strip()
        if len(n) >= 2:
            update["name"] = n
    if body.phone is not None:
        p = (body.phone or "").strip().replace(" ", "").replace("-", "")
        if p:
            cc = (body.country_code or user.get("country_code", "SA")).upper()
            rule = PHONE_RULES.get(cc)
            if rule:
                pref = rule["prefix"] if isinstance(rule["prefix"], list) else [rule["prefix"]]
                if len(p) != rule["length"] or not any(p.startswith(pp) for pp in pref):
                    raise HTTPException(400, "رقم الجوال غير صحيح")
            update["phone"] = p
            country_phone_codes = {"SA": "+966", "AE": "+971", "KW": "+965", "QA": "+974", "BH": "+973", "OM": "+968", "EG": "+20"}
            update["phone_full"] = f"{country_phone_codes.get(cc, '+966')}{p}"
    if body.city is not None:
        update["city"] = body.city.strip()
    if body.country_code is not None:
        cc = (body.country_code or "").strip().upper()
        if cc in {"SA", "AE", "KW", "QA", "BH", "OM", "EG"}:
            update["country_code"] = cc
    if body.avatar_url is not None:
        update["avatar_url"] = body.avatar_url
    if body.show_phone is not None:
        update["show_phone"] = bool(body.show_phone)
    if not update:
        return user
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    new_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return new_user


@api.get("/auth/me/stats")
async def get_me_stats(user: dict = Depends(get_current_user)):
    """User-facing profile stats: total listings, active, sold, join date."""
    uid = user["id"]
    return {
        "total_listings": await db.listings.count_documents({"user_id": uid}),
        "active_listings": await db.listings.count_documents({"user_id": uid, "status": "active"}),
        "sold_listings": await db.listings.count_documents({"user_id": uid, "status": "sold"}),
        "favorites_count": await db.favorites.count_documents({"user_id": uid}),
        "joined_at": user.get("created_at"),
    }

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    # Accept refresh from: (1) cookie, (2) JSON body { refresh_token }, (3) Authorization header
    token = request.cookies.get("refresh_token", "")
    if not token:
        try:
            body = await request.json()
            token = (body or {}).get("refresh_token", "") or ""
        except Exception:
            token = ""
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:].strip()
    if not token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(401, "User not found")
        access = create_access_token(user["id"], user["email"], user.get("role", "user"))
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return {"access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")


# ============================================================
# Phone validation rules per country
# ============================================================
PHONE_RULES = {
    "SA": {"prefix": "5", "length": 9},
    "AE": {"prefix": ["50", "52", "54", "55", "56", "58"], "length": 9},
    "KW": {"prefix": ["5", "6", "9"], "length": 8},
    "QA": {"prefix": ["3", "5", "6", "7"], "length": 8},
    "BH": {"prefix": ["3", "6", "9"], "length": 8},
    "OM": {"prefix": ["7", "9"], "length": 8},
    "EG": {"prefix": ["10", "11", "12", "15"], "length": 10},
}

def validate_phone(country_code: str, phone: str) -> bool:
    rule = PHONE_RULES.get(country_code)
    if not rule:
        return True
    if len(phone) != rule["length"]:
        return False
    prefixes = rule["prefix"] if isinstance(rule["prefix"], list) else [rule["prefix"]]
    return any(phone.startswith(p) for p in prefixes)


# ============================================================
# Forgot Password
# ============================================================
class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn, request: Request):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    reset_link = None
    email_sent = False
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": user["id"],
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False, "created_at": datetime.now(timezone.utc),
        })
        # Build absolute reset URL using request origin or env
        origin = os.environ.get("FRONTEND_URL", "").rstrip("/")
        if not origin:
            origin = str(request.base_url).rstrip("/")
        reset_url = f"{origin}/reset-password?token={token}"
        reset_link = f"/reset-password?token={token}"
        # Try sending email
        email_sent = await send_password_reset_email(email, reset_url, user.get("name", ""))
        logger.info(f"[PWD-RESET] {email} sent={email_sent} -> {reset_url}")
    return {
        "message": "إذا كان البريد مسجلاً، فسيتم إرسال رابط إعادة التعيين",
        "email_sent": email_sent,
        # Provide dev link only when email service is not configured
        "dev_reset_link": None if email_sent else reset_link,
    }

@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(400, "رابط غير صالح أو مستخدم")
    expires_at = rec.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "انتهت صلاحية الرابط")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"success": True}


# ============================================================
# X (Twitter) OAuth 2.0 — PKCE
# ============================================================
import base64 as _b64
import hashlib as _hashlib

def _b64url(b: bytes) -> str:
    return _b64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

@api.get("/auth/x/start")
async def x_oauth_start(request: Request, mobile_redirect: Optional[str] = None):
    if not X_CLIENT_ID:
        raise HTTPException(503, "X login غير مفعّل")
    state = secrets.token_urlsafe(16)
    code_verifier = secrets.token_urlsafe(64)[:96]
    code_challenge = _b64url(_hashlib.sha256(code_verifier.encode()).digest())
    mob = (mobile_redirect or "").strip() or None
    await db.x_oauth_states.insert_one({
        "state": state, "code_verifier": code_verifier,
        "mobile_redirect": mob,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "created_at": datetime.now(timezone.utc),
    })
    # For mobile flow, X redirects directly to the BACKEND GET handler (so
    # we control the deep-link redirect server-side and the mobile app
    # never has to round-trip through a web frontend).
    if mob:
        backend = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/") or str(request.base_url).rstrip("/").replace("/api", "")
        redirect_uri = f"{backend}/api/auth/x/callback-redirect"
    else:
        origin = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
        redirect_uri = f"{origin}/auth/x/callback"
    auth_url = (
        "https://twitter.com/i/oauth2/authorize"
        f"?response_type=code&client_id={X_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}&scope=tweet.read%20users.read"
        f"&state={state}&code_challenge={code_challenge}&code_challenge_method=S256"
    )
    return {"auth_url": auth_url}

class XCallbackIn(BaseModel):
    code: str
    state: str

@api.post("/auth/x/callback")
async def x_oauth_callback(body: XCallbackIn, request: Request, response: Response):
    if not X_CLIENT_ID or not X_CLIENT_SECRET:
        raise HTTPException(503, "X login غير مفعّل")
    rec = await db.x_oauth_states.find_one({"state": body.state})
    if not rec:
        raise HTTPException(400, "state غير صالح")
    expires_at = rec.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "انتهت صلاحية الجلسة")
    await db.x_oauth_states.delete_one({"state": body.state})

    origin = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
    redirect_uri = f"{origin}/auth/x/callback"

    basic = _b64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=15.0) as cx:
            tok = await cx.post(
                "https://api.twitter.com/2/oauth2/token",
                headers={"Authorization": f"Basic {basic}", "Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "code": body.code,
                    "grant_type": "authorization_code",
                    "client_id": X_CLIENT_ID,
                    "redirect_uri": redirect_uri,
                    "code_verifier": rec["code_verifier"],
                },
            )
            if tok.status_code != 200:
                logger.error(f"[X token] {tok.status_code} {tok.text[:200]}")
                raise HTTPException(401, "فشل التحقق من X")
            token_data = tok.json()
            access_x = token_data.get("access_token")
            me = await cx.get(
                "https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url",
                headers={"Authorization": f"Bearer {access_x}"},
            )
            if me.status_code != 200:
                raise HTTPException(401, "فشل قراءة الحساب من X")
            x_user = me.json().get("data", {})
    except httpx.HTTPError as e:
        logger.error(f"[X HTTP] {e}")
        raise HTTPException(502, "تعذر الاتصال بـ X")

    x_id = x_user.get("id")
    x_username = x_user.get("username") or "x_user"
    x_name = x_user.get("name") or x_username
    x_avatar = x_user.get("profile_image_url")
    if not x_id:
        raise HTTPException(400, "لا يوجد معرف من X")

    # X does not return email by default; use x_id@x.local as placeholder
    placeholder_email = f"x_{x_id}@x.local"
    user = await db.users.find_one({"$or": [{"x_id": x_id}, {"email": placeholder_email}]})
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "name": x_name, "email": placeholder_email,
            "phone": "", "country_code": "SA", "phone_full": "", "city": None,
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "role": "user", "verified": False, "trust_score": 60,
            "avatar_url": x_avatar, "bio": "", "language": "ar",
            "banned": False, "x_id": x_id, "x_username": x_username,
            "referral_code": gen_referral_code(x_name), "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"id": user["id"]}, {"$set": {"x_id": x_id, "x_username": x_username, "avatar_url": user.get("avatar_url") or x_avatar}})

    if user.get("banned"):
        raise HTTPException(403, "تم حظر حسابك")

    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access}


# Mobile deep-link callback for X — Twitter redirects here (server-to-server),
# we exchange the code, issue our JWT, and finally redirect to the custom
# scheme so the Expo app receives the token via Linking.
@app.get("/api/auth/x/callback-redirect", include_in_schema=False)
async def x_oauth_callback_mobile(request: Request, code: str = "", state: str = "", error: str = ""):
    if error:
        return RedirectResponse(f"harajplus://auth/callback?error={error}")
    if not code or not state:
        return RedirectResponse("harajplus://auth/callback?error=missing_code")
    rec = await db.x_oauth_states.find_one_and_delete({"state": state})
    if not rec:
        return RedirectResponse("harajplus://auth/callback?error=invalid_state")
    mob = (rec.get("mobile_redirect") or "harajplus://auth/callback").strip()
    if not X_CLIENT_ID or not X_CLIENT_SECRET:
        return RedirectResponse(f"{mob}?error=not_configured")
    backend = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/") or str(request.base_url).rstrip("/").replace("/api", "")
    redirect_uri = f"{backend}/api/auth/x/callback-redirect"
    basic = _b64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=15.0) as cx:
            tok = await cx.post(
                "https://api.twitter.com/2/oauth2/token",
                headers={"Authorization": f"Basic {basic}", "Content-Type": "application/x-www-form-urlencoded"},
                data={"code": code, "grant_type": "authorization_code", "client_id": X_CLIENT_ID, "redirect_uri": redirect_uri, "code_verifier": rec["code_verifier"]},
            )
            if tok.status_code != 200:
                logger.error(f"[X mobile token] {tok.status_code} {tok.text[:200]}")
                return RedirectResponse(f"{mob}?error=token_exchange")
            access_x = tok.json().get("access_token")
            me = await cx.get("https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url",
                              headers={"Authorization": f"Bearer {access_x}"})
            if me.status_code != 200:
                return RedirectResponse(f"{mob}?error=userinfo")
            x_user = me.json().get("data", {})
    except httpx.HTTPError as e:
        logger.error(f"[X mobile HTTP] {e}")
        return RedirectResponse(f"{mob}?error=network")
    x_id = x_user.get("id")
    if not x_id:
        return RedirectResponse(f"{mob}?error=no_id")
    placeholder_email = f"x_{x_id}@x.local"
    user = await db.users.find_one({"$or": [{"x_id": x_id}, {"email": placeholder_email}]})
    x_username = x_user.get("username") or "x_user"
    x_name = x_user.get("name") or x_username
    x_avatar = x_user.get("profile_image_url")
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "name": x_name, "email": placeholder_email,
            "phone": "", "country_code": "SA", "phone_full": "", "city": None,
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "role": "user", "verified": False, "trust_score": 60,
            "avatar_url": x_avatar, "bio": "", "language": "ar",
            "banned": False, "x_id": x_id, "x_username": x_username,
            "referral_code": gen_referral_code(x_name), "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"id": user["id"]}, {"$set": {"x_id": x_id, "x_username": x_username}})
    if user.get("banned"):
        return RedirectResponse(f"{mob}?error=banned")
    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    import urllib.parse as _up
    frag = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "x"})
    return RedirectResponse(f"{mob}#{frag}")
@api.get("/auth/snapchat/start")
async def snap_oauth_start(request: Request, mobile_redirect: Optional[str] = None):
    if not SNAPCHAT_CLIENT_ID:
        raise HTTPException(503, "Snapchat login غير مفعّل")
    state = secrets.token_urlsafe(16)
    code_verifier = secrets.token_urlsafe(64)[:96]
    code_challenge = _b64url(_hashlib.sha256(code_verifier.encode()).digest())
    mob = (mobile_redirect or "").strip() or None
    await db.snap_oauth_states.insert_one({
        "state": state, "code_verifier": code_verifier,
        "mobile_redirect": mob,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "created_at": datetime.now(timezone.utc),
    })
    if mob:
        backend = os.environ.get("BACKEND_PUBLIC_URL", "https://alhrajplus.onrender.com").rstrip("/")
        redirect_uri = f"{backend}/api/auth/snapchat/callback"
    else:
        backend = os.environ.get("BACKEND_PUBLIC_URL", "https://alhrajplus.onrender.com").rstrip("/")
        redirect_uri = f"{backend}/api/auth/snapchat/callback"
    scope = "https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar https://auth.snapchat.com/oauth2/api/user.external_id"
    auth_url = (
        "https://accounts.snapchat.com/accounts/oauth2/auth"
        f"?response_type=code&client_id={SNAPCHAT_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}&scope={scope.replace(' ', '+').replace(':', '%3A').replace('/', '%2F')}"
        f"&state={state}&code_challenge={code_challenge}&code_challenge_method=S256"
    )
    return {"auth_url": auth_url}


class SnapCallbackIn(BaseModel):
    code: str
    state: str

@api.post("/auth/snapchat/callback")
async def snap_oauth_callback(body: SnapCallbackIn, request: Request, response: Response):
    if not SNAPCHAT_CLIENT_ID or not SNAPCHAT_CLIENT_SECRET:
        raise HTTPException(503, "Snapchat login غير مفعّل")
    rec = await db.snap_oauth_states.find_one({"state": body.state})
    if not rec:
        raise HTTPException(400, "state غير صالح")
    expires_at = rec.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "انتهت صلاحية الجلسة")
    await db.snap_oauth_states.delete_one({"state": body.state})

    origin = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")  # noqa: F841 (kept for parity)
    backend = os.environ.get("BACKEND_PUBLIC_URL", "https://alhrajplus.onrender.com").rstrip("/")
    redirect_uri = f"{backend}/api/auth/snapchat/callback"
    basic = _b64.b64encode(f"{SNAPCHAT_CLIENT_ID}:{SNAPCHAT_CLIENT_SECRET}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=15.0) as cx:
            tok = await cx.post(
                "https://accounts.snapchat.com/login/oauth2/access_token",
                headers={"Authorization": f"Basic {basic}", "Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "code": body.code, "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri, "code_verifier": rec["code_verifier"],
                },
            )
            if tok.status_code != 200:
                logger.error(f"[Snap token] {tok.status_code} {tok.text[:200]}")
                raise HTTPException(401, "فشل التحقق من Snapchat")
            access_snap = tok.json().get("access_token")
            me = await cx.post(
                "https://kit.snapchat.com/v1/me",
                headers={"Authorization": f"Bearer {access_snap}", "Content-Type": "application/json"},
                json={"query": "{me{externalId displayName bitmoji{avatar}}}"},
            )
            if me.status_code != 200:
                raise HTTPException(401, "فشل قراءة الحساب من Snapchat")
            data = (me.json() or {}).get("data", {}).get("me", {})
    except httpx.HTTPError as e:
        logger.error(f"[Snap HTTP] {e}")
        raise HTTPException(502, "تعذر الاتصال بـ Snapchat")

    snap_id = data.get("externalId")
    snap_name = data.get("displayName") or "مستخدم Snapchat"
    snap_avatar = (data.get("bitmoji") or {}).get("avatar")
    if not snap_id:
        raise HTTPException(400, "لا يوجد معرف من Snapchat")

    placeholder_email = f"snap_{snap_id}@snapchat.local"
    user = await db.users.find_one({"$or": [{"snap_id": snap_id}, {"email": placeholder_email}]})
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "name": snap_name, "email": placeholder_email,
            "phone": "", "country_code": "SA", "phone_full": "", "city": None,
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "role": "user", "verified": False, "trust_score": 60,
            "avatar_url": snap_avatar, "bio": "", "language": "ar",
            "banned": False, "snap_id": snap_id,
            "referral_code": gen_referral_code(snap_name), "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"id": user["id"]}, {"$set": {"snap_id": snap_id, "avatar_url": user.get("avatar_url") or snap_avatar}})

    if user.get("banned"):
        raise HTTPException(403, "تم حظر حسابك")
    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access}


# GET callback hit DIRECTLY by Snapchat OAuth (web + mobile use the same URL).
# This is the single source of truth callback per Snap Developer Portal:
#   https://alhrajplus.onrender.com/api/auth/snapchat/callback
@app.get("/api/auth/snapchat/callback", include_in_schema=False)
async def snap_oauth_callback_get(request: Request, code: str = "", state: str = "", error: str = ""):
    # Decide where to send the final tokens — mobile deep-link or web frontend
    rec = await db.snap_oauth_states.find_one_and_delete({"state": state}) if state else None
    mob = (rec or {}).get("mobile_redirect")
    is_mobile = bool(mob)
    # IMPORTANT: For web, always send users back to the FRONTEND domain (alhraj.online),
    # NOT to the backend onrender.com. The generic /auth/callback page on the frontend
    # captures tokens from the URL fragment and logs the user in via localStorage.
    frontend_url = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    final_target = mob or f"{frontend_url}/auth/callback"
    sep = "?" if "?" not in final_target else "&"
    if error:
        return RedirectResponse(f"{final_target}{sep}error={error}")
    if not code or not state or not rec:
        return RedirectResponse(f"{final_target}{sep}error=invalid_state")
    if not SNAPCHAT_CLIENT_ID or not SNAPCHAT_CLIENT_SECRET:
        return RedirectResponse(f"{final_target}{sep}error=not_configured")
    backend = os.environ.get("BACKEND_PUBLIC_URL", "https://alhrajplus.onrender.com").rstrip("/")
    redirect_uri = f"{backend}/api/auth/snapchat/callback"
    basic = _b64.b64encode(f"{SNAPCHAT_CLIENT_ID}:{SNAPCHAT_CLIENT_SECRET}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=15.0) as cx:
            tok = await cx.post(
                "https://accounts.snapchat.com/login/oauth2/access_token",
                headers={"Authorization": f"Basic {basic}", "Content-Type": "application/x-www-form-urlencoded"},
                data={"code": code, "grant_type": "authorization_code", "redirect_uri": redirect_uri, "code_verifier": rec["code_verifier"]},
            )
            if tok.status_code != 200:
                logger.error(f"[Snap callback token] {tok.status_code} {tok.text[:200]}")
                return RedirectResponse(f"{final_target}{sep}error=token_exchange")
            access_snap = tok.json().get("access_token")
            me = await cx.post(
                "https://kit.snapchat.com/v1/me",
                headers={"Authorization": f"Bearer {access_snap}", "Content-Type": "application/json"},
                json={"query": "{me{externalId displayName bitmoji{avatar}}}"},
            )
            if me.status_code != 200:
                return RedirectResponse(f"{final_target}{sep}error=userinfo")
            data = (me.json() or {}).get("data", {}).get("me", {})
    except httpx.HTTPError as e:
        logger.error(f"[Snap callback HTTP] {e}")
        return RedirectResponse(f"{final_target}{sep}error=network")
    snap_id = data.get("externalId")
    if not snap_id:
        return RedirectResponse(f"{final_target}{sep}error=no_id")
    snap_name = data.get("displayName") or "مستخدم Snapchat"
    snap_avatar = (data.get("bitmoji") or {}).get("avatar")
    placeholder_email = f"snap_{snap_id}@snapchat.local"
    user = await db.users.find_one({"$or": [{"snap_id": snap_id}, {"email": placeholder_email}]})
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "name": snap_name, "email": placeholder_email,
            "phone": "", "country_code": "SA", "phone_full": "", "city": None,
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "role": "user", "verified": False, "trust_score": 60,
            "avatar_url": snap_avatar, "bio": "", "language": "ar",
            "banned": False, "snap_id": snap_id,
            "referral_code": gen_referral_code(snap_name), "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one({"id": user["id"]}, {"$set": {"snap_id": snap_id}})
    if user.get("banned"):
        return RedirectResponse(f"{final_target}{sep}error=banned")
    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    import urllib.parse as _up
    payload = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "snapchat"})
    # Tokens go in URL fragment for BOTH web and mobile — fragments are not sent to servers
    # (safer than query string) and the frontend /auth/callback page reads them from window.location.hash.
    return RedirectResponse(f"{final_target}#{payload}")


# Backwards-compat alias (older builds may still hit /callback-redirect)
@app.get("/api/auth/snapchat/callback-redirect", include_in_schema=False)
async def snap_oauth_callback_mobile(request: Request, code: str = "", state: str = "", error: str = ""):
    return await snap_oauth_callback_get(request, code=code, state=state, error=error)


# ============================================================
# Push Notifications (Expo + Web Push / VAPID)
# ============================================================
from push_service import send_push_to_users as _send_push, VAPID_PUBLIC_KEY


class PushTokenIn(BaseModel):
    expo_token: str = Field(min_length=10)
    platform: Optional[str] = None  # ios|android|web


class WebPushSubscriptionIn(BaseModel):
    endpoint: str = Field(min_length=10)
    keys: dict  # {"p256dh": "...", "auth": "..."}
    user_agent: Optional[str] = None


class NotificationPrefsIn(BaseModel):
    messages: Optional[bool] = None
    listing_status: Optional[bool] = None
    deals: Optional[bool] = None
    watchlist: Optional[bool] = None
    broadcasts: Optional[bool] = None
    comments: Optional[bool] = None


@api.post("/push/register")
async def register_push_token(body: PushTokenIn, user: dict = Depends(get_current_user)):
    await db.push_tokens.update_one(
        {"expo_token": body.expo_token},
        {"$set": {
            "user_id": user["id"],
            "kind": "expo",
            "expo_token": body.expo_token,
            "platform": body.platform,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    return {"success": True}


@api.delete("/push/unregister")
async def unregister_push_token(expo_token: str, user: dict = Depends(get_current_user)):
    await db.push_tokens.delete_one({"expo_token": expo_token, "user_id": user["id"]})
    return {"success": True}


@api.get("/push/web/vapid-public-key")
async def get_vapid_public_key():
    """Public VAPID key — required by the browser's PushManager.subscribe()."""
    return {"public_key": VAPID_PUBLIC_KEY}


@api.post("/push/web/subscribe")
async def web_push_subscribe(body: WebPushSubscriptionIn, user: dict = Depends(get_current_user)):
    sub = {"endpoint": body.endpoint, "keys": body.keys}
    await db.push_tokens.update_one(
        {"web_subscription.endpoint": body.endpoint},
        {"$set": {
            "user_id": user["id"],
            "kind": "web",
            "web_subscription": sub,
            "platform": "web",
            "user_agent": body.user_agent,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    return {"success": True}


@api.post("/push/web/unsubscribe")
async def web_push_unsubscribe(body: WebPushSubscriptionIn, user: dict = Depends(get_current_user)):
    await db.push_tokens.delete_one({"kind": "web", "web_subscription.endpoint": body.endpoint, "user_id": user["id"]})
    return {"success": True}


@api.get("/push/preferences")
async def get_notification_prefs(user: dict = Depends(get_current_user)):
    prefs = user.get("notification_prefs") or {}
    # Defaults: everything on
    return {
        "messages": prefs.get("messages", True),
        "listing_status": prefs.get("listing_status", True),
        "deals": prefs.get("deals", True),
        "watchlist": prefs.get("watchlist", True),
        "broadcasts": prefs.get("broadcasts", True),
        "comments": prefs.get("comments", True),
    }


@api.put("/push/preferences")
async def set_notification_prefs(body: NotificationPrefsIn, user: dict = Depends(get_current_user)):
    update = {}
    for k, v in body.dict(exclude_unset=True).items():
        if v is not None:
            update[f"notification_prefs.{k}"] = bool(v)
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    return {"success": True}


# Test push — useful for users to verify their device receives notifications
@api.post("/push/test")
async def test_push(user: dict = Depends(get_current_user)):
    res = await _send_push(
        db, [user["id"]],
        title="🔔 إشعار تجريبي",
        body="تم تفعيل الإشعارات على هذا الجهاز بنجاح",
        url="/profile",
        data={"type": "test"},
    )
    return {"success": True, "delivered": res}


async def expo_send_push(tokens: list, title: str, body: str, data: Optional[dict] = None):
    """Backward-compat shim used by older call sites that pass raw Expo tokens.

    Prefer `_send_push(db, user_ids, ...)` for new code so the user's web
    subscription is also notified.
    """
    if not tokens:
        return {"sent": 0}
    messages = [
        {"to": t, "sound": "default", "title": title, "body": body, "data": data or {}, "priority": "high", "channelId": "default"}
        for t in tokens
    ]
    try:
        async with httpx.AsyncClient(timeout=15.0) as cx:
            r = await cx.post(
                "https://exp.host/--/api/v2/push/send",
                json=messages,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
            )
            return {"sent": len(tokens), "status": r.status_code}
    except Exception as e:
        logger.error(f"[Expo Push] {e}")
        return {"sent": 0, "error": str(e)}


# ============================================================
# Google OAuth — Direct (no third-party auth proxy)
# Flow:
#   1. Frontend → GET  /api/auth/google/start         → returns auth_url
#   2. Browser  → Google consent screen
#   3. Google   → GET  /api/auth/google/callback?code=... → backend exchanges code,
#                  sets httpOnly cookies, then 302-redirects to FRONTEND_URL.
# ============================================================
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI",
    "https://alhrajplus.onrender.com/api/auth/google/callback",
).strip()
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


async def _upsert_google_user(g_email: str, g_name: str, g_picture: Optional[str]) -> dict:
    """Find or create the user record from a verified Google identity."""
    g_email = g_email.lower().strip()
    user = await db.users.find_one({"email": g_email})
    if user:
        upd: dict = {"google_linked": True}
        if not user.get("avatar_url") and g_picture:
            upd["avatar_url"] = g_picture
        await db.users.update_one({"id": user["id"]}, {"$set": upd})
    else:
        uid = str(uuid.uuid4())
        user = {
            "id": uid,
            "name": g_name or "مستخدم",
            "email": g_email,
            "phone": "",
            "country_code": "SA",
            "phone_full": "",
            "city": None,
            # disabled-password placeholder — user must use Google or password-reset
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "role": "user",
            "verified": False,
            "trust_score": 60,
            "avatar_url": g_picture,
            "bio": "",
            "language": "ar",
            "banned": False,
            "google_linked": True,
            "referral_code": gen_referral_code(g_name or "USER"),
            "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    if user.get("banned"):
        raise HTTPException(403, "تم حظر حسابك")
    return user


@api.get("/auth/google/start")
async def google_oauth_start(request: Request, mobile_redirect: Optional[str] = None):
    """Return Google OAuth consent URL with a CSRF state token cookie.

    When `mobile_redirect` (a custom URI scheme like `harajplus://auth/callback`)
    is provided, the final callback will redirect to that scheme instead of the
    web FRONTEND_URL — enabling deep-link return into the native Expo app.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Google OAuth غير مُعد على الخادم")
    state = secrets.token_urlsafe(32)
    # Store state in MongoDB (short TTL) so it survives across the auth redirect
    await db.google_oauth_states.insert_one({
        "state": state,
        "mobile_redirect": (mobile_redirect or "").strip() or None,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    })
    from urllib.parse import urlencode
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "include_granted_scopes": "true",
        "prompt": "select_account",
        "state": state,
    }
    return {"auth_url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}


@app.get("/api/auth/google/callback", include_in_schema=False)
async def google_oauth_callback(code: str = "", state: str = "", error: str = ""):
    """
    Google redirects here with ?code & ?state. We exchange the code for tokens,
    fetch the user profile, upsert in DB, set JWT cookies, then 302 → FRONTEND_URL.
    """
    frontend = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    if error:
        return RedirectResponse(f"{frontend}/login?error={error}")
    if not code or not state:
        return RedirectResponse(f"{frontend}/login?error=missing_code")
    # CSRF check
    found = await db.google_oauth_states.find_one_and_delete({"state": state})
    if not found:
        return RedirectResponse(f"{frontend}/login?error=invalid_state")
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return RedirectResponse(f"{frontend}/login?error=server_misconfigured")

    # Exchange code → tokens
    try:
        async with httpx.AsyncClient(timeout=15.0) as client_http:
            tok_res = await client_http.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
        if tok_res.status_code != 200:
            logger.error(f"[GoogleOAuth] token exchange {tok_res.status_code}: {tok_res.text[:300]}")
            return RedirectResponse(f"{frontend}/login?error=token_exchange")
        tokens = tok_res.json()
        access_token = tokens.get("access_token", "")
        if not access_token:
            return RedirectResponse(f"{frontend}/login?error=no_access_token")
        # Fetch userinfo
        async with httpx.AsyncClient(timeout=15.0) as client_http:
            info_res = await client_http.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if info_res.status_code != 200:
            return RedirectResponse(f"{frontend}/login?error=userinfo_failed")
        info = info_res.json()
    except httpx.HTTPError as e:
        logger.error(f"[GoogleOAuth] HTTP error: {e}")
        return RedirectResponse(f"{frontend}/login?error=network")

    g_email = info.get("email") or ""
    if not g_email:
        return RedirectResponse(f"{frontend}/login?error=no_email")

    try:
        user = await _upsert_google_user(g_email, info.get("name") or "", info.get("picture"))
    except HTTPException:
        return RedirectResponse(f"{frontend}/login?error=banned")

    # Issue our JWTs. Set cookies for browsers that allow third-party cookies,
    # AND pass tokens via URL fragment (#) so the frontend can store them in
    # localStorage for browsers that block cross-site cookies (Safari ITP, iOS,
    # Brave). Fragment is never sent to the server, so it stays in browser only.
    access = create_access_token(user["id"], g_email, user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    import urllib.parse as _up
    frag = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "google"})
    # Mobile deep-link return path takes priority when set on the state record.
    mobile_redirect = (found.get("mobile_redirect") or "").strip()
    if mobile_redirect:
        return RedirectResponse(f"{mobile_redirect}#{frag}")
    resp = RedirectResponse(f"{frontend}/auth/callback#{frag}")
    set_auth_cookies(resp, access, refresh)
    return resp


# Legacy endpoint kept temporarily so existing in-flight sessions don't break.
# Returns 410 GONE so frontend code paths that still POST here surface a clear error.
@api.post("/auth/google")
async def google_auth_legacy():
    raise HTTPException(410, "تم تحديث طريقة تسجيل الدخول. الرجاء تحديث الصفحة.")


# ============================================================
# Apple Sign In — Direct (web flow)
#
# Apple posts back to the callback as application/x-www-form-urlencoded
# (response_mode=form_post). We:
#   1. /api/auth/apple/start  → returns Apple consent URL.
#   2. Apple → POST /api/auth/apple/callback with code, state, [user JSON on
#      first consent only], [id_token].
#   3. Backend builds a client_secret JWT (ES256), exchanges code → tokens,
#      verifies id_token via Apple JWKS (RS256), upserts user, then redirects
#      to FRONTEND_URL/auth/callback#access_token=...
# ============================================================
APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"

_apple_jwks_cache = {"keys": None, "fetched_at": 0.0}

async def _apple_get_jwks() -> dict:
    now = time.time()
    if _apple_jwks_cache["keys"] and (now - _apple_jwks_cache["fetched_at"]) < 3600:
        return _apple_jwks_cache["keys"]
    async with httpx.AsyncClient(timeout=10.0) as cx:
        r = await cx.get(APPLE_JWKS_URL)
        r.raise_for_status()
        data = r.json()
    _apple_jwks_cache["keys"] = data
    _apple_jwks_cache["fetched_at"] = now
    return data


def _apple_make_client_secret() -> str:
    """Builds the ES256-signed JWT used as client_secret when exchanging the auth code."""
    if not (APPLE_CLIENT_ID and APPLE_TEAM_ID and APPLE_KEY_ID and APPLE_PRIVATE_KEY):
        raise HTTPException(503, "Apple Sign In غير مُعد على الخادم")
    now = datetime.now(timezone.utc)
    payload = {
        "iss": APPLE_TEAM_ID,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
        "aud": "https://appleid.apple.com",
        "sub": APPLE_CLIENT_ID,
    }
    return jwt.encode(
        payload,
        APPLE_PRIVATE_KEY,
        algorithm="ES256",
        headers={"kid": APPLE_KEY_ID},
    )


async def _upsert_apple_user(apple_sub: str, email: str, name: str, picture: Optional[str] = None) -> dict:
    """Find by apple_id first, then by email; create if missing."""
    email_norm = (email or "").lower().strip()
    user = await db.users.find_one({"apple_id": apple_sub})
    if not user and email_norm:
        user = await db.users.find_one({"email": email_norm})
    if user:
        upd: dict = {"apple_linked": True, "apple_id": apple_sub}
        if not user.get("avatar_url") and picture:
            upd["avatar_url"] = picture
        await db.users.update_one({"id": user["id"]}, {"$set": upd})
    else:
        uid = str(uuid.uuid4())
        # Apple may not return an email if the user chose private relay; fall back to placeholder.
        if not email_norm:
            email_norm = f"apple_{apple_sub.split('.')[-1]}@apple.local"
        user = {
            "id": uid,
            "name": name or "مستخدم Apple",
            "email": email_norm,
            "phone": "",
            "country_code": "SA",
            "phone_full": "",
            "city": None,
            "password_hash": hash_password(secrets.token_urlsafe(24)),
            "role": "user",
            "verified": False,
            "trust_score": 60,
            "avatar_url": picture,
            "bio": "",
            "language": "ar",
            "banned": False,
            "apple_linked": True,
            "apple_id": apple_sub,
            "referral_code": gen_referral_code(name or "USER"),
            "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    if user.get("banned"):
        raise HTTPException(403, "تم حظر حسابك")
    return user


class AppleNativeIn(BaseModel):
    identity_token: str
    authorization_code: Optional[str] = None
    user_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None


@api.post("/auth/apple/native")
async def apple_native_signin(body: AppleNativeIn):
    """Native Sign-In with Apple (iOS).
    iOS sends us the `identity_token` (JWT signed by Apple). We verify the
    signature using Apple's public JWKS, extract the `sub` (Apple user id) and
    email, then upsert the user and issue OUR JWT tokens.
    """
    if not body.identity_token:
        raise HTTPException(400, "Missing identity_token")
    if not APPLE_CLIENT_ID:
        raise HTTPException(503, "Apple Sign-In is not configured on the server")
    try:
        # Fetch Apple JWKS (cached short-term via httpx)
        async with httpx.AsyncClient(timeout=8.0) as cli:
            jwks_r = await cli.get("https://appleid.apple.com/auth/keys")
            jwks_r.raise_for_status()
            jwks = jwks_r.json()
        # Decode header to find the right key
        unverified_header = jwt.get_unverified_header(body.identity_token)
        kid = unverified_header.get("kid")
        key_dict = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key_dict = k
                break
        if not key_dict:
            raise HTTPException(401, "Apple key id not found in JWKS")
        # Build the public key from JWK
        from jose import jwk as jose_jwk
        pub_key = jose_jwk.construct(key_dict, algorithm="RS256")
        # Apple supports multiple audiences: Services ID (web) AND App Bundle IDs (native).
        allowed_aud = [a.strip() for a in (APPLE_CLIENT_ID + "," + os.environ.get("APPLE_BUNDLE_ID", "")).split(",") if a.strip()]
        claims = jwt.decode(
            body.identity_token,
            pub_key,
            algorithms=["RS256"],
            audience=allowed_aud if len(allowed_aud) > 1 else allowed_aud[0],
            issuer="https://appleid.apple.com",
            options={"verify_at_hash": False},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"[apple/native] token verify failed: {e}")
        raise HTTPException(401, "تعذر التحقق من تسجيل دخول Apple")

    apple_sub = claims.get("sub") or body.user_id
    if not apple_sub:
        raise HTTPException(401, "Apple sub missing")
    email = claims.get("email") or body.email or ""
    name = body.full_name or ""

    user = await _upsert_apple_user(apple_sub, email, name)
    access = create_access_token(user["id"], user.get("email", ""), user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"access_token": access, "refresh_token": refresh, "token": access, "user": safe_user}


@api.get("/auth/apple/start")
async def apple_oauth_start(mobile_redirect: Optional[str] = None):
    """Return Apple OAuth consent URL with a CSRF state token stored in DB.

    If `mobile_redirect` is set (custom URI scheme), the callback will redirect
    to that scheme instead of the web frontend — enabling Apple sign-in inside
    the Expo mobile app.
    """
    if not APPLE_CLIENT_ID:
        raise HTTPException(503, "Apple Sign In غير مُعد على الخادم")
    state = secrets.token_urlsafe(32)
    await db.apple_oauth_states.insert_one({
        "state": state,
        "mobile_redirect": (mobile_redirect or "").strip() or None,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "created_at": datetime.now(timezone.utc),
    })
    from urllib.parse import urlencode
    params = {
        "client_id": APPLE_CLIENT_ID,
        "redirect_uri": APPLE_REDIRECT_URI,
        "response_type": "code id_token",
        "response_mode": "form_post",
        "scope": "name email",
        "state": state,
    }
    return {"auth_url": f"{APPLE_AUTH_URL}?{urlencode(params)}"}


@app.post("/api/auth/apple/callback", include_in_schema=False)
async def apple_oauth_callback(request: Request):
    """
    Apple posts back with form-encoded: code, state, [user] (first time only), [id_token].
    We verify the id_token via Apple's JWKS, upsert the user, and redirect to FRONTEND/auth/callback#token=...
    """
    frontend = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    form = await request.form()
    code = (form.get("code") or "").strip()
    state = (form.get("state") or "").strip()
    user_blob = form.get("user") or ""
    id_token_form = (form.get("id_token") or "").strip()
    error = form.get("error")
    if error:
        return RedirectResponse(f"{frontend}/login?error={error}", status_code=303)
    if not code or not state:
        return RedirectResponse(f"{frontend}/login?error=missing_code", status_code=303)

    found = await db.apple_oauth_states.find_one_and_delete({"state": state})
    if not found:
        return RedirectResponse(f"{frontend}/login?error=invalid_state", status_code=303)

    # Build client_secret then exchange code for tokens (we still want a fresh id_token).
    try:
        client_secret = _apple_make_client_secret()
    except HTTPException:
        return RedirectResponse(f"{frontend}/login?error=server_misconfigured", status_code=303)
    except Exception as e:
        logger.error(f"[AppleOAuth] client_secret error: {e}")
        return RedirectResponse(f"{frontend}/login?error=server_error", status_code=303)

    try:
        async with httpx.AsyncClient(timeout=15.0) as cx:
            tok_res = await cx.post(
                APPLE_TOKEN_URL,
                data={
                    "client_id": APPLE_CLIENT_ID,
                    "client_secret": client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": APPLE_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        if tok_res.status_code != 200:
            logger.error(f"[AppleOAuth] token exchange {tok_res.status_code}: {tok_res.text[:300]}")
            return RedirectResponse(f"{frontend}/login?error=token_exchange", status_code=303)
        tokens = tok_res.json()
    except httpx.HTTPError as e:
        logger.error(f"[AppleOAuth] HTTP error: {e}")
        return RedirectResponse(f"{frontend}/login?error=network", status_code=303)

    id_token = tokens.get("id_token") or id_token_form
    if not id_token:
        return RedirectResponse(f"{frontend}/login?error=no_id_token", status_code=303)

    # Verify id_token signature with Apple JWKS
    try:
        jwks = await _apple_get_jwks()
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        key_dict = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key_dict:
            # one retry with fresh fetch
            _apple_jwks_cache["fetched_at"] = 0.0
            jwks = await _apple_get_jwks()
            key_dict = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key_dict:
            return RedirectResponse(f"{frontend}/login?error=invalid_kid", status_code=303)
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_dict)
        decoded = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com",
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"[AppleOAuth] invalid id_token: {e}")
        return RedirectResponse(f"{frontend}/login?error=invalid_token", status_code=303)
    except Exception as e:
        logger.error(f"[AppleOAuth] verify error: {e}")
        return RedirectResponse(f"{frontend}/login?error=verify_failed", status_code=303)

    apple_sub = decoded.get("sub")
    apple_email = decoded.get("email", "")
    if not apple_sub:
        return RedirectResponse(f"{frontend}/login?error=no_sub", status_code=303)

    # First-time consent ships user name as JSON in the form ('user' field).
    apple_name = ""
    if user_blob:
        try:
            import json as _json
            ub = _json.loads(user_blob)
            n = ub.get("name") or {}
            apple_name = (f"{n.get('firstName','')} {n.get('lastName','')}").strip()
        except Exception:
            pass

    try:
        user = await _upsert_apple_user(apple_sub, apple_email, apple_name)
    except HTTPException:
        return RedirectResponse(f"{frontend}/login?error=banned", status_code=303)

    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    import urllib.parse as _up
    frag = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "apple"})
    # Mobile deep-link path: redirect to scheme (e.g. harajplus://auth/callback)
    mobile_redirect = (found.get("mobile_redirect") or "").strip()
    if mobile_redirect:
        return RedirectResponse(f"{mobile_redirect}#{frag}", status_code=303)
    resp = RedirectResponse(f"{frontend}/auth/callback#{frag}", status_code=303)
    set_auth_cookies(resp, access, refresh)
    return resp


# ============================================================
# AI Price Suggestion (market-based heuristic)
# ============================================================
class PriceSuggestIn(BaseModel):
    category: str
    custom_fields: dict = {}
    title: str = ""
    country_code: Optional[str] = None

@api.post("/ai/price-suggest")
async def ai_price_suggest(body: PriceSuggestIn):
    q: dict = {"category": body.category, "status": "active", "moderation": "approved", "price": {"$gt": 0}}
    if body.country_code:
        q["country_code"] = body.country_code
    cursor = db.listings.find(q, {"_id": 0, "price": 1}).limit(100)
    items = await cursor.to_list(length=100)
    if len(items) < 2:
        return {"suggested_min": None, "suggested_max": None, "average": None, "samples": len(items),
                "note": "لا توجد بيانات كافية بعد. كن أول من ينشر!"}
    prices = sorted([i["price"] for i in items if i.get("price")])
    avg = sum(prices) / len(prices)
    p25 = prices[len(prices) // 4]
    p75 = prices[(3 * len(prices)) // 4]
    return {"suggested_min": round(p25, 2), "suggested_max": round(p75, 2),
            "average": round(avg, 2), "samples": len(prices),
            "note": f"متوسط السوق بناءً على {len(prices)} إعلان مماثل"}


# ============================================================
# AI Smart Pricing Badge — classifies a listing's price vs market
# ============================================================
@api.get("/ai/price-badge/{listing_id}")
async def price_badge(listing_id: str):
    """Returns a badge (deal/fair/high) for a listing based on its category's price distribution."""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "price": 1, "category": 1, "country_code": 1, "subcategory": 1})
    if not listing or not listing.get("price"):
        return {"badge": None}
    q: dict = {
        "category": listing["category"],
        "status": "active",
        "moderation": "approved",
        "price": {"$gt": 0},
        "id": {"$ne": listing_id},
    }
    if listing.get("country_code"):
        q["country_code"] = listing["country_code"]
    if listing.get("subcategory"):
        q["subcategory"] = listing["subcategory"]
    cursor = db.listings.find(q, {"_id": 0, "price": 1}).limit(200)
    items = await cursor.to_list(length=200)
    if len(items) < 3:
        return {"badge": None, "reason": "عينة غير كافية للمقارنة"}
    prices = sorted([i["price"] for i in items if i.get("price")])
    p = listing["price"]
    p25 = prices[len(prices) // 4]
    p75 = prices[(3 * len(prices)) // 4]
    avg = sum(prices) / len(prices)
    if p < p25:
        return {"badge": "deal", "label": "صفقة ممتازة",
                "sub": f"أقل من 75% من إعلانات مماثلة (متوسط السوق {int(avg):,})",
                "color": "emerald", "icon": "🔥", "samples": len(prices)}
    if p > p75:
        return {"badge": "high", "label": "سعر مرتفع",
                "sub": f"أعلى من 75% من إعلانات مماثلة (متوسط السوق {int(avg):,})",
                "color": "amber", "icon": "⚡", "samples": len(prices)}
    return {"badge": "fair", "label": "سعر مناسب",
            "sub": f"ضمن متوسط السوق ({int(avg):,})",
            "color": "blue", "icon": "✓", "samples": len(prices)}


# ============================================================
# Top Deals of the Day — aggregates best deals across categories
# ============================================================
@api.get("/deals/today")
async def todays_deals(country_code: Optional[str] = None, limit: int = 20):
    """Returns today's best deals: listings priced significantly below their category median."""
    # Get all active listings (small subset for performance)
    q: dict = {"status": "active", "moderation": "approved", "price": {"$gt": 0}}
    if country_code:
        q["country_code"] = country_code
    cursor = db.listings.find(q, {"_id": 0}).limit(500)
    all_items = await cursor.to_list(length=500)

    # Group prices by category+subcategory for median computation
    from collections import defaultdict
    groups: dict = defaultdict(list)
    for it in all_items:
        k = (it.get("category"), it.get("subcategory") or "")
        groups[k].append(it.get("price", 0))
    medians = {}
    for k, prices in groups.items():
        prices_sorted = sorted(p for p in prices if p > 0)
        if len(prices_sorted) >= 3:
            medians[k] = prices_sorted[len(prices_sorted) // 2]

    # Find deals: price < 80% of category median
    deals = []
    for it in all_items:
        k = (it.get("category"), it.get("subcategory") or "")
        median = medians.get(k)
        if not median:
            continue
        price = it.get("price", 0)
        if price and price < median * 0.8:
            savings = int(median - price)
            pct_off = int((1 - price / median) * 100)
            deals.append({
                **it,
                "market_median": int(median),
                "savings": savings,
                "discount_pct": pct_off,
            })

    # Sort by discount percentage
    deals.sort(key=lambda d: d["discount_pct"], reverse=True)
    return deals[:limit]


# ============================================================
# Referral System
# ============================================================
def gen_referral_code(name: str) -> str:
    base = "".join(c for c in name if c.isalnum())[:4].upper() or "USER"
    return f"{base}{secrets.token_hex(3).upper()}"

@api.get("/referral/me")
async def get_my_referral(user: dict = Depends(get_current_user)):
    code = user.get("referral_code")
    if not code:
        code = gen_referral_code(user["name"])
        await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": code}})
    invited = await db.users.count_documents({"referred_by": code})
    badge = None
    if invited >= 25:
        badge = "موثّق ذهبي ⭐"
    elif invited >= 10:
        badge = "موثّق فضي 🥈"
    elif invited >= 5:
        badge = "موثّق برونزي 🥉"
    next_m = 5 if invited < 5 else (10 if invited < 10 else (25 if invited < 25 else None))
    return {"code": code, "invited_count": invited, "badge": badge, "next_milestone": next_m}

@api.get("/referral/leaderboard")
async def referral_leaderboard():
    pipeline = [
        {"$match": {"referred_by": {"$ne": None, "$exists": True}}},
        {"$group": {"_id": "$referred_by", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10},
    ]
    rows = await db.users.aggregate(pipeline).to_list(length=10)
    enriched = []
    for r in rows:
        u = await db.users.find_one({"referral_code": r["_id"]}, {"_id": 0, "name": 1, "city": 1, "verified": 1})
        if u:
            u["invites"] = r["count"]
            enriched.append(u)
    return enriched


# ============================================================
# Cloudinary upload signing
# ============================================================
@api.get("/cloudinary/signature")
async def cloudinary_signature(
    resource_type: str = Query("image"),
    folder: str = Query("listings"),
    user: dict = Depends(get_current_user),
):
    if resource_type not in ("image", "video"):
        raise HTTPException(400, "Invalid resource_type")
    allowed = ("listings/", "stories/", "avatars/", "ads/", "chat/")
    folder_with_user = f"{folder}/{user['id']}"
    if not any(folder.startswith(p.rstrip("/")) for p in allowed):
        raise HTTPException(400, "Invalid folder")

    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder_with_user}
    sig = cloudinary.utils.api_sign_request(params, os.environ["CLOUDINARY_API_SECRET"])
    return {
        "signature": sig,
        "timestamp": timestamp,
        "cloud_name": os.environ["CLOUDINARY_CLOUD_NAME"],
        "api_key": os.environ["CLOUDINARY_API_KEY"],
        "folder": folder_with_user,
        "resource_type": resource_type,
    }


# ============================================================
# Listings
# ============================================================
@api.post("/listings")
async def create_listing(body: ListingIn, user: dict = Depends(get_current_user)):
    if not body.category:
        raise HTTPException(400, "يجب اختيار الفئة قبل النشر")
    cat = next((c for c in CATEGORIES if c["key"] == body.category), None)
    if not cat:
        raise HTTPException(400, "فئة غير صالحة")
    # Hard country-isolation guard. The user MUST have a country on file or
    # we refuse to publish — otherwise the listing leaks into every country's
    # feed (because the listings endpoint only filters when country_code is set).
    user_cc = (user.get("country_code") or "").upper().strip()
    if not user_cc:
        raise HTTPException(400, "يرجى اختيار بلدك من الإعدادات قبل النشر")
    listing_id = str(uuid.uuid4())
    mod_flags = detect_moderation_flags(f"{body.title} {body.description}")
    is_banned = bool(mod_flags)
    doc = {
        "id": listing_id,
        "user_id": user["id"],
        "title": body.title.strip(),
        "description": body.description.strip(),
        "price": body.price,
        "currency": body.currency or "ر.س",
        "category": body.category,
        "subcategory": body.subcategory,
        "post_type": body.post_type,
        "custom_fields": body.custom_fields,
        "images": body.images,
        "videos": body.videos,
        "country_code": user_cc,
        "city": body.city,
        "district": body.district,
        "lat": body.lat,
        "lng": body.lng,
        "show_phone": body.show_phone,
        "contact_phone": (body.contact_phone or "").strip() or None,
        "status": "active",
        "moderation": "pending" if is_banned else "approved",
        "moderation_flags": mod_flags,
        "views": 0,
        "favorites": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    doc["search_blob"] = build_search_blob(doc)
    # Generate SEO-friendly slug. Always include short suffix for uniqueness so
    # parallel creates with similar titles never collide.
    base_slug = _slugify(body.title)
    doc["slug"] = f"{base_slug}-{listing_id.replace('-', '')[:6]}" if base_slug else f"listing-{listing_id.replace('-', '')[:8]}"
    await db.listings.insert_one(doc)
    doc.pop("_id", None)
    _cache_invalidate()

    # If a banned word or suspicious pattern triggered moderation, ping all admins
    # with the specific flag codes so the queue at /admin/listings/pending is actionable.
    if is_banned:
        try:
            admins = await db.users.find({"role": "admin"}, {"_id": 0, "id": 1}).limit(10).to_list(length=10)
            flags_summary = ", ".join(mod_flags[:3]) or "محتوى مشبوه"
            for adm in admins:
                await _send_user_notification(
                    user_id=adm["id"],
                    title="🚩 إعلان بانتظار المراجعة",
                    body=f"تم احتجاز إعلان «{(body.title or '')[:50]}» — السبب: {flags_summary}",
                    ntype="moderation_flagged",
                    url=f"/admin/listings/{listing_id}",
                    extra_data={"listing_id": listing_id, "flags": mod_flags},
                    pref_key="broadcasts",
                )
        except Exception as e:
            logger.warning(f"[mod] admin notify failed: {e}")

    # Instant search-engine submission (IndexNow → Bing, Yandex, Seznam, Naver).
    # Fire-and-forget; never blocks listing creation.
    try:
        fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
        from urllib.parse import urlparse as _up
        host = _up(fe).hostname or "alhraj.online"
        _seo_submit_bg(db, [f"{fe}/listing/{doc['slug']}", f"{fe}/listing/{doc['id']}"], host)
        _google_idx_updated(f"{fe}/listing/{doc['slug']}")
    except Exception as _e:        logger.warning(f"[IndexNow] enqueue failed: {_e}")

    # Smart notification: tell users who recently viewed the same category.
    if doc.get("moderation") == "approved":
        asyncio.create_task(_notify_category_watchers(doc))

    # Async AI moderation pass (Gemini classifier). Re-flags risky listings.
    # CRITICAL: must NOT block the HTTP response. We use asyncio.ensure_future
    # with a small initial sleep so the event loop yields to the response writer
    # before Gemini's first network call kicks in. Otherwise the LLM dispatch
    # can hold up the response by 3-6s on every create.
    async def _delayed_ai_mod():
        await asyncio.sleep(0.05)  # let the response flush first
        try:
            await ai_moderate_listing(doc["id"], doc.get("title", ""), doc.get("description", ""))
        except Exception as e:
            logger.warning(f"[ai-mod.deferred] {e}")
    asyncio.ensure_future(_delayed_ai_mod())

    return doc


BANNED_WORDS_SEED = [
    # Arabic — drugs / weapons / fraud
    "مخدرات", "حشيش", "كوكايين", "هيروين", "كبتاجون", "كبتاغون", "ترامادول", "كرستال", "شبو",
    "سلاح", "اسلحة", "أسلحة", "مسدس", "بندقية", "رشاش", "ذخيرة", "قنبلة",
    "احتيال", "نصب", "قرض ربوي", "تسليف فوري", "غسيل اموال", "غسيل أموال",
    # Arabic — adult / illegal services
    "دعارة", "علاقة محرمة", "اشتراك +18",
    # English — common spam / illegal
    "drugs", "cocaine", "heroin", "weapons", "guns", "ammo",
    "money laundering", "loan shark", "fast cash loan",
    "porn", "adult only", "escort service",
    # Crypto-scam vocabulary
    "double your money", "guaranteed roi", "تضاعف رأس مالك",
    # Urdu / Hindi / Bengali — drugs
    "ड्रग्स", "ہیروئن", "মাদক",
]

# Runtime mutable copy — hot-reloaded from db.banned_words on startup and after
# every admin write. Falls back to the seed list when the collection is empty
# (so the system is never unprotected, even on a brand-new database).
BANNED_WORDS: list = list(BANNED_WORDS_SEED)


async def _reload_banned_words():
    """Refresh `BANNED_WORDS` from db.banned_words. Called on startup AND after
    every admin add/remove so the in-memory check stays consistent without an
    app restart. If the collection is empty, the seed list stays in place."""
    global BANNED_WORDS
    try:
        rows = await db.banned_words.find({}, {"_id": 0, "word": 1}).to_list(length=5000)
        words = [r.get("word", "").strip() for r in rows if r.get("word")]
        if words:
            BANNED_WORDS = words
        else:
            BANNED_WORDS = list(BANNED_WORDS_SEED)
        logger.info(f"[banned_words] reloaded {len(BANNED_WORDS)} entries")
    except Exception as e:
        logger.warning(f"[banned_words] reload failed: {e}")


# Spam-pattern regex. Order matters — kept small so it stays cheap (<1 ms).
import re as _mod_re  # local alias to avoid clashing with module-level `re`
_SUSPICIOUS_PATTERNS = [
    # Phone numbers obviously hidden inside the description (10+ digits clustered).
    (_mod_re.compile(r"(?:\+?\d[\s\-\u200f.\u00a0]?){10,}"), "phone_spam"),
    # Off-platform contact requests with explicit cues.
    (_mod_re.compile(r"(?i)(whatsapp|واتس\s*اب|واتساب|تيليجرام|telegram|سيجنال|signal)\s*[:\-]?\s*\+?\d"), "offsite_contact"),
    # External URLs (we still allow them but flag for review).
    (_mod_re.compile(r"(?i)https?://(?!alhraj\.online|alhrajplus\.com)[\w.\-]+"), "external_link"),
    # IBAN / bank-transfer requests (common scam pattern).
    (_mod_re.compile(r"(?i)(iban|آيبان|تحويل\s*بنكي|paypal\s*me|بايبال)"), "bank_request"),
]


def any_banned_word(text: str) -> bool:
    """True if the text contains any banned keyword (case-insensitive)."""
    t = (text or "").lower()
    return any(w.lower() in t for w in BANNED_WORDS)


def detect_moderation_flags(text: str) -> list:
    """Return list of flag codes triggered by `text`. Empty list = clean.
    Used by listing create/update to mark `moderation=pending` AND tell the admin
    exactly what tripped the filter (so they can act in one click)."""
    flags = []
    t_lower = (text or "").lower()
    for w in BANNED_WORDS:
        if w.lower() in t_lower:
            flags.append(f"banned_word:{w}")
            break
    for rx, code in _SUSPICIOUS_PATTERNS:
        if rx.search(text or ""):
            flags.append(code)
    return flags


async def ai_moderate_listing(listing_id: str, title: str, description: str) -> None:
    """Best-effort AI moderation pass using Gemini. Classifies listings against
    sensitive categories (scam, drugs, adult, fraud, weapons, hate). Writes back:
      ai_moderation_score: float 0..1  (higher = more risky)
      ai_moderation_categories: ["scam", ...]
      moderation_flags: appended with 'ai:<category>' for any with score >= 0.6
    On error or missing LLM key, silently no-op so listing flow is never blocked.
    """
    if not EMERGENT_LLM_KEY:
        return
    blob = (title or "")[:300] + "\n" + (description or "")[:1500]
    if not blob.strip():
        return
    try:
        from llm_shim import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"mod-{listing_id[:8]}",
            system_message=(
                "أنت نظام كشف محتوى لتطبيق إعلانات مبوّبة عربي يعمل في دول الخليج ومصر. "
                "صنّف الإعلان عبر إرجاع JSON فقط بهذا الشكل بدون أي شرح إضافي: "
                "{\"score\":0.0-1.0,\"categories\":[],\"reason\":\"...\"} "
                "categories ممكن أن تحتوي: scam, drugs, adult, fraud, weapons, hate, fake, prohibited. "
                "score = أعلى احتمال للمحتوى الضار (0=آمن، 1=مؤكد). reason ≤ 80 حرف عربي."
            ),
        ).with_model("gemini", "gemini-2.5-flash")
        text = await chat.send_message(UserMessage(text=f"إعلان للتصنيف:\n{blob}"))
        import re as _re, json as _json
        m = _re.search(r"\{.*\}", text or "", _re.DOTALL)
        if not m:
            return
        result = _json.loads(m.group(0))
        score = float(result.get("score") or 0)
        cats = [c for c in (result.get("categories") or []) if isinstance(c, str)][:6]
        reason = (result.get("reason") or "")[:120]
        update: dict = {
            "ai_moderation_score": round(score, 3),
            "ai_moderation_categories": cats,
            "ai_moderation_reason": reason,
            "ai_moderation_at": datetime.now(timezone.utc).isoformat(),
        }
        risky = score >= 0.6 and len(cats) > 0
        if risky:
            # Force re-review by an admin
            update["moderation"] = "pending"
            # Append AI categories to existing flags (deduped)
            existing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "moderation_flags": 1}) or {}
            current_flags = list(existing.get("moderation_flags") or [])
            for c in cats:
                tag = f"ai:{c}"
                if tag not in current_flags:
                    current_flags.append(tag)
            update["moderation_flags"] = current_flags
        await db.listings.update_one({"id": listing_id}, {"$set": update})
        _cache_invalidate()
        # Notify admins for risky AI flags (cap at 10 admins)
        if risky:
            try:
                admins = await db.users.find({"role": "admin"}, {"_id": 0, "id": 1}).limit(10).to_list(length=10)
                for adm in admins:
                    await _send_user_notification(
                        user_id=adm["id"],
                        title="🤖 AI رصد إعلاناً مشتبهاً",
                        body=f"درجة الخطر {int(score*100)}% — {', '.join(cats[:3])}",
                        ntype="ai_moderation_flagged",
                        url=f"/admin/listings/{listing_id}",
                        extra_data={"listing_id": listing_id, "score": score, "categories": cats, "reason": reason},
                        pref_key="broadcasts",
                    )
            except Exception as _ae:
                logger.warning(f"[ai-mod] admin notify failed: {_ae}")
    except Exception as e:
        logger.warning(f"[ai-mod] {e}")

@api.get("/listings")
async def list_listings(
    request: Request,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    city: Optional[str] = None,
    country_code: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "newest",
    days: Optional[int] = None,  # 1=last 24h, 7=last week, 30=last month, None=all time
    lat: Optional[float] = None,  # for nearest sorting
    lng: Optional[float] = None,
    limit: int = 20,
    skip: int = 0,
    page: Optional[int] = None,
    cursor: Optional[str] = None,  # ISO created_at of last item — O(1) deep pagination
    fields: str = "slim",  # "slim" = list-card fields only; "full" = legacy full doc
):
    # Production hard cap: never return more than 20 per request — keeps payload
    # under ~10KB even on slow networks, scalable to millions of listings.
    limit = max(1, min(limit, 20))
    # Allow ?page=2 in addition to ?skip=N. page is 1-indexed.
    if page and page > 0:
        skip = (page - 1) * limit
    skip = max(0, skip)

    # Check in-memory cache before hitting Mongo. Honors If-None-Match.
    cache_key = f"{request.url.path}?{request.url.query}" if request else None
    if cache_key and not (q and q.strip()):
        cached = _cache_get(cache_key)
        if cached:
            _METRICS["cache_hits"] = _METRICS.get("cache_hits", 0) + 1
            payload_cached, etag_cached = cached
            inm_c = request.headers.get("if-none-match") if request else None
            hdrs = {
                "ETag": f'"{etag_cached}"',
                "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
                "Vary": "Accept-Encoding",
                "X-Cache-Ready": "true",
            }
            if inm_c and inm_c.strip('"') == etag_cached:
                return Response(status_code=304, headers=hdrs)
            return JSONResponse(content=payload_cached, headers={**hdrs, "X-Cache": "HIT"})
        else:
            _METRICS["cache_misses"] = _METRICS.get("cache_misses", 0) + 1

    # Visibility filter: keep the public feed clean. We accept legacy docs that
    # predate the `moderation` field (treat missing as "approved") so historical
    # data created before that column was added stays visible.
    query: dict = {
        "status": "active",
        "$or": [
            {"moderation": "approved"},
            {"moderation": {"$exists": False}},
            {"moderation": None},
        ],
    }
    if country_code:
        query["country_code"] = country_code
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if city:
        query["city"] = city
    if min_price is not None or max_price is not None:
        pq: dict = {}
        if min_price is not None:
            pq["$gte"] = min_price
        if max_price is not None:
            pq["$lte"] = max_price
        query["price"] = pq
    if days is not None and days > 0:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        query["created_at"] = {"$gte": cutoff}

    # Cursor pagination: when client passes ?cursor=<last_created_at>, we filter
    # by created_at < cursor instead of using skip(). This stays O(log n) even
    # at page 10,000 — critical for Haraj/OLX scale.
    using_cursor = bool(cursor)
    if using_cursor and sort in ("newest", "oldest"):
        op = "$lt" if sort != "oldest" else "$gt"
        existing = query.get("created_at")
        if isinstance(existing, dict):
            existing[op] = cursor
        else:
            query["created_at"] = {op: cursor}

    sort_field = [("is_boosted", -1), ("created_at", -1)]
    if sort == "oldest":
        sort_field = [("is_boosted", -1), ("created_at", 1)]
    elif sort == "price_asc":
        sort_field = [("is_boosted", -1), ("price", 1)]
    elif sort == "price_desc":
        sort_field = [("is_boosted", -1), ("price", -1)]
    elif sort == "popular":
        sort_field = [("is_boosted", -1), ("views", -1)]

    # Slim projection — only the fields a listing card actually renders.
    # Cuts response size by ~70% (no custom_fields/search_blob/media_urls/etc).
    SLIM_PROJ = {
        "_id": 0,
        "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
        "currency_code": 1, "category": 1, "subcategory": 1, "city": 1,
        "country_code": 1, "images": {"$slice": 1}, "videos": 1, "created_at": 1,
        "views": 1, "favorites": 1, "is_demo": 1, "demo_label": 1,
        "user_id": 1, "status": 1,
    }
    projection = SLIM_PROJ if fields != "full" else {"_id": 0}

    if q and q.strip():
        items, total, fuzzy_used = await _search_listings_engine(
            db, q.strip(), query, sort_field, limit=limit, skip=skip
        )
        return {"total": total, "items": items, "fuzzy": fuzzy_used, "page": page or (skip // limit + 1), "limit": limit}

    if sort in ("nearest", "farthest") and lat is not None and lng is not None:
        pool = await db.listings.find(query, projection).limit(500).to_list(length=500)
        def _dist(it):
            la, ln = it.get("lat"), it.get("lng")
            if la is None or ln is None:
                return float("inf")
            return (la - lat) ** 2 + (ln - lng) ** 2
        pool.sort(key=_dist, reverse=(sort == "farthest"))
        items = pool[skip:skip + limit]
        return {"total": len(pool), "items": items, "page": page or (skip // limit + 1), "limit": limit}

    # Skip the expensive count when paginating by cursor — Mongo can't short-circuit
    # count() on large filtered collections, so it dominates request time.
    total = None if using_cursor else await db.listings.count_documents(query)
    effective_skip = 0 if using_cursor else skip
    cursor_q = db.listings.find(query, projection).sort(sort_field).skip(effective_skip).limit(limit)
    items = await cursor_q.to_list(length=limit)
    next_cursor = items[-1].get("created_at") if (using_cursor and items and len(items) == limit) else None
    body = {"total": total, "items": items, "page": page or (skip // limit + 1), "limit": limit, "next_cursor": next_cursor}
    # Edge-cacheable for 120s with 300s stale-while-revalidate.
    import hashlib as _hl
    payload_str = jsonable_encoder(body)
    etag = _hl.md5(str(payload_str).encode("utf-8")).hexdigest()
    inm = request.headers.get("if-none-match") if request else None
    final_hdrs = {
        "ETag": f'"{etag}"',
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        "Vary": "Accept-Encoding",
        "X-Cache-Ready": "true",
    }
    if inm and inm.strip('"') == etag:
        return Response(status_code=304, headers=final_hdrs)
    # Stash in memory for the next 60s so repeated identical requests skip the DB
    cache_key = f"{request.url.path}?{request.url.query}" if request else None
    if cache_key:
        _cache_set(cache_key, (payload_str, etag))
    return JSONResponse(content=payload_str, headers=final_hdrs)


# ============================================================
# Two-tier cache for listings: Redis (if REDIS_URL set) → in-memory fallback.
# - Invalidated on create/update/delete via _cache_invalidate().
# - All operations are sync to keep call sites trivial; Redis client is sync.
# ============================================================
_LISTINGS_CACHE: dict = {}
_LISTINGS_CACHE_TTL = 60   # listings list — 60s
_DETAIL_CACHE_TTL = 120    # listing detail — 120s
_CATEGORIES_CACHE_TTL = 300  # categories/search — 300s

# Optional Redis. Imported lazily so the app still boots when redis-py is absent.
_REDIS = None
_REDIS_URL = os.environ.get("REDIS_URL", "").strip()
if not _REDIS_URL:
    logger.error("[cache] REDIS REQUIRED FOR PRODUCTION — set REDIS_URL to a managed Redis (Upstash/Redis Cloud/ElastiCache). Falling back to in-memory cache (NOT multi-instance safe).")
if _REDIS_URL:
    # Production-safety guard: warn loudly when someone points at a local Redis.
    # External managed Redis (Upstash / Redis Cloud / ElastiCache) is required.
    if "localhost" in _REDIS_URL or "127.0.0.1" in _REDIS_URL or "::1" in _REDIS_URL:
        logger.warning("[cache] REDIS_URL points at localhost — NOT PRODUCTION SAFE. Use a managed Redis (Upstash/Redis Cloud/ElastiCache).")
    try:
        import redis as _redis_pkg  # type: ignore
        _REDIS = _redis_pkg.Redis.from_url(_REDIS_URL, socket_timeout=0.5, socket_connect_timeout=0.5, decode_responses=True)
        # Probe once so we know it's reachable; fall back silently otherwise.
        _REDIS.ping()
        logger.info("[cache] Redis connected: %s", _REDIS_URL.split("@")[-1])
    except Exception as _e:
        logger.warning("[cache] Redis unavailable, using in-memory only: %s", _e)
        _REDIS = None

def _redis_status() -> str:
    if not _REDIS_URL:
        return "missing"  # critical for production
    if _REDIS is None:
        return "fallback"
    try:
        _REDIS.ping()
        return "on"
    except Exception:
        return "fallback"

def _cache_get(key: str):
    import time as _t, json as _json, gzip as _gz, base64 as _b64
    # Try Redis first when available
    if _REDIS is not None:
        try:
            raw = _REDIS.get(f"hp:v1:{key}")
            if raw:
                # Gzipped payloads are stored as `gz:<base64>`; decompress transparently.
                if raw.startswith("gz:"):
                    raw = _gz.decompress(_b64.b64decode(raw[3:])).decode("utf-8")
                obj = _json.loads(raw)
                return (obj["payload"], obj["etag"])
        except Exception:
            pass  # fall through to memory
    item = _LISTINGS_CACHE.get(key)
    if not item:
        return None
    if _t.time() - item[1] > _LISTINGS_CACHE_TTL:
        _LISTINGS_CACHE.pop(key, None)
        return None
    return item[0]

def _cache_set(key: str, value, ttl: Optional[int] = None):
    import time as _t, json as _json, gzip as _gz, base64 as _b64
    payload, etag = value
    effective_ttl = ttl or _LISTINGS_CACHE_TTL
    if _REDIS is not None:
        try:
            raw = _json.dumps({"payload": payload, "etag": etag})
            # Gzip when payload exceeds ~4KB — saves ~70% on listing pages.
            if len(raw) > 4096:
                raw = "gz:" + _b64.b64encode(_gz.compress(raw.encode("utf-8"))).decode("ascii")
            _REDIS.setex(f"hp:v1:{key}", effective_ttl, raw)
        except Exception:
            pass  # silent fallback to memory
    # Cap cache at 200 entries (LRU-ish — oldest gets evicted)
    if len(_LISTINGS_CACHE) > 200:
        try:
            oldest = min(_LISTINGS_CACHE.items(), key=lambda kv: kv[1][1])[0]
            _LISTINGS_CACHE.pop(oldest, None)
        except Exception:
            _LISTINGS_CACHE.clear()
    _LISTINGS_CACHE[key] = (value, _t.time())

def _cache_invalidate():
    _LISTINGS_CACHE.clear()
    if _REDIS is not None:
        try:
            # SCAN+DEL is non-blocking; cap iterations to stay safe.
            for k in _REDIS.scan_iter(match="hp:v1:*", count=200):
                _REDIS.delete(k)
        except Exception:
            pass
    # Also force sitemap rebuild so newly created/updated/deleted listings
    # appear in /sitemap.xml within seconds (was capped to 1h TTL before).
    try:
        _sitemap_cache_invalidate()
    except Exception:
        pass


# ============================================================
# Lightweight search + trending. Uses Mongo's built-in text index
# (already created on title+description) + plain count_documents.
# No ElasticSearch, no fancy ranking — keeps infra cost flat.
# ============================================================
@api.get("/search")
async def search_listings(q: str = "", limit: int = 20, country_code: Optional[str] = None):
    """Full-text search over active listings. Ranked by score=views*0.7 + recency*0.3. Hard cap 20."""
    limit = max(1, min(limit, 20))
    if not q or not q.strip():
        return {"items": [], "total": 0, "q": ""}
    query: dict = {
        "status": "active",
        "moderation": "approved",
        "$text": {"$search": q.strip()},
    }
    if country_code:
        query["country_code"] = country_code
    SLIM = {
        "_id": 0, "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
        "currency_code": 1, "category": 1, "city": 1, "country_code": 1,
        "images": {"$slice": 1}, "created_at": 1, "views": 1, "clicks": 1, "is_demo": 1,
    }
    # Pull a slightly bigger candidate set, then score in Python (cheap, ≤ 60 docs).
    try:
        pool = await db.listings.find(query, SLIM).sort([("created_at", -1)]).limit(60).to_list(length=60)
    except Exception:
        # Text index not yet ready — fall back to a case-insensitive regex
        # so the endpoint always returns something usable.
        import re as _re
        rx = {"$regex": _re.escape(q.strip()), "$options": "i"}
        fallback_query = {k: v for k, v in query.items() if k != "$text"}
        fallback_query["$or"] = [{"title": rx}, {"description": rx}]
        pool = await db.listings.find(fallback_query, SLIM).sort([("created_at", -1)]).limit(60).to_list(length=60)
    # Score: views*0.7 + recency*0.3 (recency = fraction of last 30 days remaining).
    now_ts = datetime.now(timezone.utc).timestamp()
    max_views = max((it.get("views") or 0) for it in pool) if pool else 1
    max_views = max(1, max_views)
    def _score(it):
        v_norm = (it.get("views") or 0) / max_views
        try:
            age_days = max(0.0, (now_ts - datetime.fromisoformat(it["created_at"].replace("Z","+00:00")).timestamp()) / 86400)
        except Exception:
            age_days = 999
        recency = max(0.0, 1.0 - min(1.0, age_days / 30.0))
        return v_norm * 0.7 + recency * 0.3
    pool.sort(key=_score, reverse=True)
    items = pool[:limit]
    return JSONResponse(
        content=jsonable_encoder({"items": items, "total": len(items), "q": q.strip()}),
        headers={
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
            "Vary": "Accept-Encoding",
            "X-Cache-Ready": "true",
        },
    )


@api.get("/listings/recommended")
async def recommended_listings(category: Optional[str] = None, country_code: Optional[str] = None, limit: int = 20):
    """Lightweight recommendation: 60% category similarity + 40% trending mix.
    Anonymous-friendly — works for logged-out users too."""
    limit = max(1, min(limit, 20))
    SLIM = {
        "_id": 0, "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
        "currency_code": 1, "category": 1, "city": 1, "country_code": 1,
        "images": {"$slice": 1}, "created_at": 1, "views": 1, "is_demo": 1,
    }
    base_query: dict = {"status": "active", "moderation": "approved"}
    if country_code:
        base_query["country_code"] = country_code
    cat_split = max(1, int(limit * 0.6))
    trend_split = limit - cat_split
    cat_items = []
    if category:
        cq = {**base_query, "category": category}
        cat_items = await db.listings.find(cq, SLIM).sort([("created_at", -1)]).limit(cat_split).to_list(length=cat_split)
    # Trending: views DESC + recent
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    tq = {**base_query, "created_at": {"$gte": cutoff}}
    if cat_items:
        seen = [it["id"] for it in cat_items]
        tq["id"] = {"$nin": seen}
    trend_items = await db.listings.find(tq, SLIM).sort([("views", -1), ("created_at", -1)]).limit(trend_split or limit).to_list(length=trend_split or limit)
    merged = (cat_items + trend_items)[:limit]
    return JSONResponse(
        content=jsonable_encoder({"items": merged, "total": len(merged)}),
        headers={
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
            "Vary": "Accept-Encoding",
            "X-Cache-Ready": "true",
        },
    )


@api.post("/listings/{listing_id}/click")
async def track_click(listing_id: str):
    """Lightweight click tracking — anonymous, fire-and-forget."""
    await db.listings.update_one({"id": listing_id}, {"$inc": {"clicks": 1}})
    return {"ok": True}


# ============================================================
# Personalization: recently-viewed history + saved searches.
# Uses Redis when available, falls back to Mongo. Per-user, capped at 20.
# ============================================================
@api.post("/listings/{listing_id}/view")
async def track_view(listing_id: str, request: Request):
    """Record that the current user viewed this listing (for /listings/recent)."""
    user = await _get_user_from_cookie(request)
    if not user:
        return {"ok": True, "tracked": False}
    now_iso = datetime.now(timezone.utc).isoformat()
    # Upsert into Mongo so we survive Redis flushes / multi-instance restarts.
    await db.recently_viewed.update_one(
        {"user_id": user["id"], "listing_id": listing_id},
        {"$set": {"user_id": user["id"], "listing_id": listing_id, "ts": now_iso}},
        upsert=True,
    )
    # Cap to last 20 per user — delete oldest if needed.
    count = await db.recently_viewed.count_documents({"user_id": user["id"]})
    if count > 20:
        # Drop the (count-20) oldest entries.
        olds = await db.recently_viewed.find({"user_id": user["id"]}, {"_id": 1, "ts": 1}).sort("ts", 1).limit(count - 20).to_list(length=50)
        if olds:
            await db.recently_viewed.delete_many({"_id": {"$in": [o["_id"] for o in olds]}})
    return {"ok": True, "tracked": True}


@api.get("/listings/recent")
async def recent_listings(user: dict = Depends(get_current_user), limit: int = 20):
    """Recently viewed listings for the authenticated user, newest first."""
    limit = max(1, min(limit, 20))
    rv = await db.recently_viewed.find({"user_id": user["id"]}, {"_id": 0, "listing_id": 1, "ts": 1}).sort("ts", -1).limit(limit).to_list(length=limit)
    ids = [r["listing_id"] for r in rv]
    if not ids:
        return {"items": [], "total": 0}
    SLIM = {
        "_id": 0, "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
        "currency_code": 1, "category": 1, "city": 1, "country_code": 1,
        "images": {"$slice": 1}, "created_at": 1, "views": 1, "is_demo": 1,
    }
    docs = await db.listings.find({"id": {"$in": ids}, "status": "active"}, SLIM).to_list(length=limit)
    # Preserve recently-viewed order.
    by_id = {d["id"]: d for d in docs}
    items = [by_id[i] for i in ids if i in by_id]
    return {"items": items, "total": len(items)}


class SavedSearchIn(BaseModel):
    q: str = Field(min_length=1, max_length=200)
    category: Optional[str] = None
    country_code: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None


@api.post("/search/save")
async def save_search(body: SavedSearchIn, user: dict = Depends(get_current_user)):
    """Persist a search so we can notify the user when matching new listings appear."""
    sid = uuid.uuid4().hex
    doc = {
        "id": sid,
        "user_id": user["id"],
        "q": body.q.strip(),
        "q_lower": body.q.strip().lower(),
        "category": body.category,
        "country_code": body.country_code,
        "min_price": body.min_price,
        "max_price": body.max_price,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Upsert so saving the same query twice doesn't duplicate.
    await db.saved_searches.update_one(
        {"user_id": user["id"], "q_lower": doc["q_lower"]},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "id": sid}


@api.get("/search/saved")
async def list_saved_searches(user: dict = Depends(get_current_user)):
    items = await db.saved_searches.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=50)
    return items


@api.delete("/search/saved/{sid}")
async def delete_saved_search(sid: str, user: dict = Depends(get_current_user)):
    await db.saved_searches.delete_one({"id": sid, "user_id": user["id"]})
    return {"ok": True}


# ============================================================
# Category follow — opt-in subscription to new listings in a category.
# ============================================================
@api.post("/follow/category/{name}")
async def follow_category(name: str, user: dict = Depends(get_current_user)):
    await db.category_follows.update_one(
        {"user_id": user["id"], "category": name},
        {"$set": {"user_id": user["id"], "category": name, "ts": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True, "following": True}

@api.delete("/follow/category/{name}")
async def unfollow_category(name: str, user: dict = Depends(get_current_user)):
    await db.category_follows.delete_one({"user_id": user["id"], "category": name})
    return {"ok": True, "following": False}

@api.get("/following")
async def list_following(user: dict = Depends(get_current_user)):
    cats = await db.category_follows.find({"user_id": user["id"]}, {"_id": 0, "category": 1, "ts": 1}).sort("ts", -1).to_list(length=200)
    sellers = await db.follows.find({"follower_id": user["id"]}, {"_id": 0, "seller_id": 1, "ts": 1}).sort("ts", -1).to_list(length=200)
    return {"categories": cats, "sellers": sellers}


# ============================================================
# Notification preferences — per-user toggles.
# Stored as a sub-document on the user row to avoid an extra collection.
# ============================================================
class NotifPrefsIn(BaseModel):
    price_alerts: Optional[bool] = None
    category_alerts: Optional[bool] = None
    chat: Optional[bool] = None
    listing_status: Optional[bool] = None

@api.get("/users/me/notifications/settings")
async def get_notif_settings(user: dict = Depends(get_current_user)):
    prefs = (user.get("notification_prefs") or {})
    return {
        "price_alerts": prefs.get("price_alerts", True),
        "category_alerts": prefs.get("category_alerts", True),
        "messages": prefs.get("messages", True),
        "listing_status": prefs.get("listing_status", True),
        "watchlist": prefs.get("watchlist", True),
        "broadcasts": prefs.get("broadcasts", True),
    }

@api.put("/users/me/notifications/settings")
async def update_notif_settings(body: NotifPrefsIn, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if not update:
        return {"ok": True}
    prefixed = {f"notification_prefs.{k}": v for k, v in update.items()}
    await db.users.update_one({"id": user["id"]}, {"$set": prefixed})
    return {"ok": True, "prefs": update}


# ============================================================
# Boost (monetization-ready, no payment yet).
# Sets is_boosted=true + boost_until=now+7d. Sort uses (-is_boosted, -created_at).
# ============================================================
@api.post("/listings/{listing_id}/boost")
async def boost_listing(listing_id: str, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1})
    if not item:
        raise HTTPException(404, "Listing not found")
    if item["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "غير مصرح")
    boost_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"is_boosted": True, "boost_until": boost_until}},
    )
    _cache_invalidate()
    return {"ok": True, "is_boosted": True, "boost_until": boost_until}

@api.delete("/listings/{listing_id}/boost")
async def unboost_listing(listing_id: str, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1})
    if not item:
        raise HTTPException(404, "Listing not found")
    if item["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "غير مصرح")
    await db.listings.update_one({"id": listing_id}, {"$set": {"is_boosted": False}})
    _cache_invalidate()
    return {"ok": True, "is_boosted": False}


async def _notify_category_watchers(listing: dict):
    """When a new listing is approved, push to users who recently viewed the same
    category. Caps at 200 recipients per listing to keep the burst bounded."""
    cat = listing.get("category")
    if not cat:
        return
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
        # Distinct users who recently viewed any listing in the same category.
        cat_listing_ids = await db.listings.distinct("id", {"category": cat})
        if not cat_listing_ids:
            return
        watchers = await db.recently_viewed.distinct(
            "user_id",
            {"listing_id": {"$in": cat_listing_ids[:500]}, "ts": {"$gte": cutoff}},
        )
        owner = listing.get("user_id")
        watchers = [w for w in watchers if w != owner][:200]
        for uid in watchers:
            asyncio.create_task(_send_push(
                uid,
                "🆕 إعلان جديد في تصنيفك",
                listing.get("title") or "",
                {"type": "category_new", "listing_id": listing.get("id"), "category": cat},
            ))
    except Exception as _e:
        logger.warning(f"[notify] category-watchers failed: {_e}")


@api.get("/listings/trending")
async def trending_listings(limit: int = 20, country_code: Optional[str] = None, days: int = 7):
    """Most-viewed active listings in the past `days`. Hard cap 20."""
    limit = max(1, min(limit, 20))
    cutoff = (datetime.now(timezone.utc) - timedelta(days=max(1, days))).isoformat()
    query: dict = {"status": "active", "moderation": "approved", "created_at": {"$gte": cutoff}}
    if country_code:
        query["country_code"] = country_code
    SLIM = {
        "_id": 0, "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
        "currency_code": 1, "category": 1, "city": 1, "country_code": 1,
        "images": {"$slice": 1}, "created_at": 1, "views": 1, "is_demo": 1,
    }
    cursor = db.listings.find(query, SLIM).sort([("views", -1), ("created_at", -1)]).limit(limit)
    items = await cursor.to_list(length=limit)
    return JSONResponse(
        content=jsonable_encoder({"items": items, "total": len(items)}),
        headers={
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
            "Vary": "Accept-Encoding",
            "X-Cache-Ready": "true",
        },
    )

@api.get("/listings/by-slug/{slug}")
async def get_listing_by_slug(slug: str, request: Request):
    """Resolve a listing by its SEO slug. Used by /listing/:slug URLs."""
    item = await db.listings.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "country_code": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    item["seller"] = seller
    return JSONResponse(content=jsonable_encoder(item), headers={"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", "Vary": "Accept-Encoding", "X-Cache-Ready": "true"})


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str, request: Request):
    # Accept either UUID or slug for legacy/SEO URL compatibility
    item = await db.listings.find_one({"$or": [{"id": listing_id}, {"slug": listing_id}]}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "country_code": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    item["seller"] = seller
    return JSONResponse(content=jsonable_encoder(item), headers={"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", "Vary": "Accept-Encoding", "X-Cache-Ready": "true"})

@api.get("/listings/{listing_id}/similar")
async def similar_listings(listing_id: str, limit: int = 12):
    base = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not base:
        raise HTTPException(404)

    base_title = (base.get("title") or "").strip()
    base_desc = (base.get("description") or "").strip()
    base_city = base.get("city")
    base_category = base.get("category")

    # Tokenize title (Arabic-aware): split on whitespace, keep words ≥ 2 chars,
    # strip Arabic diacritics for fair matching.
    import re
    AR_DIACRITICS = re.compile(r"[\u064B-\u065F\u0670]")
    def normalize(s):
        return AR_DIACRITICS.sub("", (s or "").lower()).strip()
    def tokenize(s):
        return [w for w in re.split(r"\s+", normalize(s)) if len(w) >= 2 and w not in {"the","and","or","في","من","الى","إلى","على","عن"}]

    base_tokens = tokenize(base_title)
    if not base_tokens:
        # Fallback: original behavior (category + city)
        same_city = await db.listings.find(
            {"category": base_category, "city": base_city, "id": {"$ne": listing_id}, "status": "active"},
            {"_id": 0}
        ).limit(limit).to_list(length=limit)
        if len(same_city) < limit:
            more = await db.listings.find(
                {"category": base_category, "city": {"$ne": base_city}, "id": {"$ne": listing_id}, "status": "active"},
                {"_id": 0}
            ).limit(limit - len(same_city)).to_list(length=limit)
            same_city.extend(more)
        return same_city

    # Build OR query: any candidate listing whose title contains any base token,
    # OR whose description contains any base token, plus same category as a soft filter.
    title_re = "|".join(re.escape(t) for t in base_tokens)
    candidates = await db.listings.find(
        {
            "id": {"$ne": listing_id},
            "status": "active",
            "$or": [
                {"title": {"$regex": title_re, "$options": "i"}},
                {"description": {"$regex": title_re, "$options": "i"}},
                {"category": base_category},
            ],
        },
        {"_id": 0}
    ).limit(200).to_list(length=200)

    base_token_set = set(base_tokens)
    base_desc_tokens = set(tokenize(base_desc))

    def score(c):
        # Higher = better match. Components:
        #   - title token overlap (most weight)
        #   - description token overlap
        #   - same city (city bonus)
        #   - same category (small bonus)
        #   - seller verified small boost
        c_title_tokens = set(tokenize(c.get("title")))
        c_desc_tokens = set(tokenize(c.get("description")))
        title_overlap = len(base_token_set & c_title_tokens)
        desc_overlap = len(base_desc_tokens & c_desc_tokens) + len(base_token_set & c_desc_tokens) * 0.5
        # Phrase match: how many CONSECUTIVE base tokens appear in title
        c_norm_title = normalize(c.get("title"))
        phrase_score = 0
        for size in range(min(len(base_tokens), 5), 1, -1):
            phrase = " ".join(base_tokens[:size])
            if phrase and phrase in c_norm_title:
                phrase_score = size * 3
                break
        s = title_overlap * 5 + desc_overlap + phrase_score
        if base_city and c.get("city") == base_city:
            s += 4  # city bonus
        if c.get("category") == base_category:
            s += 1
        if (c.get("seller") or {}).get("verified") or c.get("verified"):
            s += 0.5
        # tie-breaker: newer listings preferred
        return s

    # Sort by (score desc, created_at desc — newer first as tiebreaker)
    ranked = sorted(candidates, key=lambda c: (-score(c), c.get("created_at") or ""), reverse=False)
    # The reverse=False with -score handles score order; for created_at we need newer first.
    # Re-sort by negated score then by negative timestamp string trick:
    def _ts(c):
        try:
            return datetime.fromisoformat((c.get("created_at") or "1970-01-01T00:00:00+00:00").replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0
    ranked = sorted(candidates, key=lambda c: (-score(c), -_ts(c)))
    # Filter out completely-irrelevant items (zero score)
    ranked = [c for c in ranked if score(c) > 0]
    return ranked[:limit]

@api.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id})
    if not item:
        raise HTTPException(404)
    if item["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403)
    # Capture media URLs BEFORE delete so we can clean Cloudinary asynchronously.
    media_to_clean = {
        "images": list(item.get("images") or []),
        "videos": list(item.get("videos") or []),
    }
    await db.listings.delete_one({"id": listing_id})
    _cache_invalidate()
    # Fire-and-forget Cloudinary cleanup so the API response stays fast.
    asyncio.create_task(_cleanup_listing_media(listing_id, media_to_clean))
    # Tell Google to deindex — best-effort, never blocks the response.
    try:
        fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
        slug = item.get("slug")
        if slug:
            _google_idx_deleted(f"{fe}/listing/{slug}")
        _google_idx_deleted(f"{fe}/listing/{listing_id}")
    except Exception as _e:
        logger.warning(f"[google_indexing] delete enqueue failed: {_e}")
    return {"success": True, "media_queued": len(media_to_clean["images"]) + len(media_to_clean["videos"])}


def _cloudinary_extract_public_id(url: str) -> Optional[tuple]:
    """Parse a Cloudinary URL → (public_id, resource_type).
    Supports:
      .../image/upload/v123/folder/name.jpg          → ("folder/name", "image")
      .../video/upload/v123/folder/name.mp4          → ("folder/name", "video")
      .../image/upload/c_fill,w_300/v123/foo/bar.png → ("foo/bar", "image")
    Returns None for non-Cloudinary URLs.
    """
    if not url or "res.cloudinary.com" not in url:
        return None
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        # path = /<cloud>/image/upload/<transforms?>/v<ver>/<folder>/<id>.<ext>
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) < 4:
            return None
        # parts[0]=cloud, parts[1]=resource_type, parts[2]=upload, then maybe transforms then v<ver> then folder/id
        resource_type = parts[1] if parts[1] in ("image", "video", "raw") else "image"
        # Skip everything up to and including the version segment (v\d+)
        import re as _re
        rest = parts[3:]
        while rest and not _re.match(r"^v\d+$", rest[0]):
            rest = rest[1:]
        if rest and _re.match(r"^v\d+$", rest[0]):
            rest = rest[1:]
        if not rest:
            return None
        # Strip extension from last segment
        last = rest[-1]
        if "." in last:
            last = last.rsplit(".", 1)[0]
        public_id = "/".join(rest[:-1] + [last])
        return public_id, resource_type
    except Exception:
        return None


async def _cleanup_listing_media(listing_id: str, media: dict) -> dict:
    """Delete Cloudinary images + videos associated with a deleted listing.
    Records the outcome in db.media_cleanup_log so an admin can audit.
    Has retry logic: each public_id is attempted up to 3 times with backoff;
    permanently-failed items are stored in db.media_cleanup_failed for the
    background retry worker to pick up later.
    """
    summary = {"images_deleted": 0, "videos_deleted": 0, "failed": 0, "details": []}
    images = media.get("images") or []
    videos = media.get("videos") or []
    for url in images + videos:
        info = _cloudinary_extract_public_id(url)
        if not info:
            continue
        public_id, rtype = info
        # Retry up to 3 times with linear backoff (0.5s, 1s, 2s).
        last_status = None
        last_error = None
        for attempt in range(3):
            try:
                res = await asyncio.to_thread(cloudinary.uploader.destroy, public_id, resource_type=rtype, invalidate=True)
                last_status = (res or {}).get("result", "unknown")
                if last_status == "ok" or last_status == "not found":
                    break
            except Exception as e:
                last_error = str(e)[:140]
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            if last_status == "ok":
                break
            # Transient retry on unexpected response
            await asyncio.sleep(0.5 * (attempt + 1))
        entry = {"public_id": public_id, "resource_type": rtype, "status": last_status, "url": url[:200]}
        if last_error:
            entry["error"] = last_error
        summary["details"].append(entry)
        if last_status == "ok":
            if rtype == "video":
                summary["videos_deleted"] += 1
            else:
                summary["images_deleted"] += 1
        elif last_status == "not found":
            # Already gone — treat as success for counting purposes.
            pass
        else:
            summary["failed"] += 1
            # Persist into the failed-queue so a background retry can attempt
            # it later (handles outages of Cloudinary control plane).
            try:
                await db.media_cleanup_failed.update_one(
                    {"public_id": public_id, "resource_type": rtype},
                    {"$set": {
                        "public_id": public_id,
                        "resource_type": rtype,
                        "listing_id": listing_id,
                        "url": url[:300],
                        "last_status": last_status,
                        "last_error": last_error,
                        "attempts": 3,
                        "next_retry_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True,
                )
            except Exception as _fe:
                logger.warning(f"[media-cleanup] failed-queue insert error: {_fe}")
    # Persist audit log
    try:
        await db.media_cleanup_log.insert_one({
            "id": str(uuid.uuid4()),
            "listing_id": listing_id,
            "summary": {k: v for k, v in summary.items() if k != "details"},
            "details": summary["details"][:50],
            "at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as _e:
        logger.warning(f"[media-cleanup] audit log failed: {_e}")
    logger.info(f"[media-cleanup] listing={listing_id} img={summary['images_deleted']} vid={summary['videos_deleted']} fail={summary['failed']}")
    return summary


async def _media_cleanup_retry_worker():
    """Background loop that retries permanently-failed media deletions every
    10 minutes. Picks items whose `next_retry_at` has passed."""
    while True:
        try:
            await asyncio.sleep(600)  # 10 min
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor = db.media_cleanup_failed.find({"next_retry_at": {"$lte": now_iso}}).limit(50)
            async for item in cursor:
                pid = item.get("public_id")
                rtype = item.get("resource_type", "image")
                try:
                    res = await asyncio.to_thread(cloudinary.uploader.destroy, pid, resource_type=rtype, invalidate=True)
                    status = (res or {}).get("result")
                    if status in ("ok", "not found"):
                        await db.media_cleanup_failed.delete_one({"public_id": pid, "resource_type": rtype})
                        logger.info(f"[media-cleanup.retry] cleared public_id={pid}")
                    else:
                        await db.media_cleanup_failed.update_one(
                            {"public_id": pid, "resource_type": rtype},
                            {"$inc": {"attempts": 1}, "$set": {
                                "last_status": status,
                                "next_retry_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
                            }},
                        )
                except Exception as e:
                    await db.media_cleanup_failed.update_one(
                        {"public_id": pid, "resource_type": rtype},
                        {"$inc": {"attempts": 1}, "$set": {
                            "last_error": str(e)[:140],
                            "next_retry_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
                        }},
                    )
        except Exception as e:
            logger.warning(f"[media-cleanup.retry] worker error: {e}")


@api.get("/listings/me/mine")
async def my_listings(user: dict = Depends(get_current_user)):
    items = await db.listings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=200)
    return items


# ============================================================
# Auctions / Bidding
# ============================================================
class BidIn(BaseModel):
    amount: float = Field(gt=0)

@api.get("/auctions/active")
async def active_auctions(country_code: Optional[str] = None, limit: int = 30):
    q: dict = {"category": "auctions", "status": "active", "moderation": "approved"}
    if country_code:
        q["country_code"] = country_code
    items = await db.listings.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    # Attach top bid for each
    for it in items:
        top = await db.bids.find_one(
            {"listing_id": it["id"]},
            {"_id": 0},
            sort=[("amount", -1)],
        )
        it["top_bid"] = top
        it["bid_count"] = await db.bids.count_documents({"listing_id": it["id"]})
    return items

@api.get("/auctions/{listing_id}/bids")
async def auction_bids(listing_id: str, limit: int = 20):
    bids = await db.bids.find({"listing_id": listing_id}, {"_id": 0}).sort("amount", -1).limit(limit).to_list(length=limit)
    # Mask bidder names
    for b in bids:
        u = await db.users.find_one({"id": b["user_id"]}, {"_id": 0, "name": 1, "verified": 1})
        if u:
            name = u.get("name") or "مستخدم"
            b["bidder_name"] = name[:1] + "***" + (name[-1:] if len(name) > 1 else "")
            b["verified"] = u.get("verified", False)
    return bids

# ============================================================
# Auctions live WebSocket — fan-out new bids to all watchers of a listing.
# In-memory pub/sub (single-instance). For multi-instance we'd swap this with
# Redis pub/sub — the public API stays the same.
# ============================================================
_AUCTION_WATCHERS: dict = {}  # listing_id -> set of WebSocket


async def _broadcast_auction_event(listing_id: str, event: dict) -> None:
    conns = _AUCTION_WATCHERS.get(listing_id) or set()
    if not conns:
        return
    dead = []
    for ws in list(conns):
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for d in dead:
        conns.discard(d)


@app.websocket("/api/ws/auctions/{listing_id}")
async def auctions_ws(websocket: WebSocket, listing_id: str):
    """Live bid stream. On connect we push the current top bid + bid count so
    the client can render instantly without an extra REST call. Then any new
    bid placed via POST /auctions/{id}/bid is fanned out as:
      {type:"bid", amount, user_id, ts, count}
    Clients should treat dropped sockets as a signal to reconnect with backoff."""
    await websocket.accept()
    conns = _AUCTION_WATCHERS.setdefault(listing_id, set())
    conns.add(websocket)
    try:
        # Snapshot — current state at connect time.
        top = await db.bids.find_one({"listing_id": listing_id}, {"_id": 0}, sort=[("amount", -1)])
        count = await db.bids.count_documents({"listing_id": listing_id})
        listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "price": 1, "auction_end_at": 1, "status": 1})
        await websocket.send_json({
            "type": "snapshot",
            "top_bid": top,
            "bid_count": count,
            "starting_price": (listing or {}).get("price"),
            "auction_end_at": (listing or {}).get("auction_end_at"),
            "status": (listing or {}).get("status"),
        })
        # Keep the connection alive — we only push from server side. Read loop
        # handles client-side ping messages and ignores everything else.
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=60)
                if msg == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Heartbeat from server every 60s so proxies don't kill the socket.
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"[auctions.ws] {e}")
    finally:
        conns.discard(websocket)
        if not conns:
            _AUCTION_WATCHERS.pop(listing_id, None)


@api.post("/auctions/{listing_id}/bid")
async def place_bid(listing_id: str, body: BidIn, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "الإعلان غير موجود")
    if listing.get("category") != "auctions":
        raise HTTPException(400, "هذا الإعلان ليس مزاد")
    if listing.get("user_id") == user["id"]:
        raise HTTPException(400, "لا يمكنك المزايدة على إعلانك")
    if listing.get("status") != "active":
        raise HTTPException(400, "المزاد منتهي")
    # Check current top bid
    top = await db.bids.find_one({"listing_id": listing_id}, {"_id": 0}, sort=[("amount", -1)])
    min_required = (top["amount"] if top else (listing.get("price") or 0)) + 1
    if body.amount < min_required:
        raise HTTPException(400, f"الحد الأدنى للمزايدة: {min_required}")
    bid_id = str(uuid.uuid4())
    bid = {
        "id": bid_id,
        "listing_id": listing_id,
        "user_id": user["id"],
        "amount": body.amount,
        "currency": listing.get("currency", "ر.س"),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db.bids.insert_one(bid)
    bid.pop("_id", None)
    # Live fan-out — every connected watcher sees the new bid within <100ms.
    count = await db.bids.count_documents({"listing_id": listing_id})
    asyncio.create_task(_broadcast_auction_event(listing_id, {
        "type": "bid",
        "bid": bid,
        "bid_count": count,
    }))
    # Notify the previous top bidder they were outbid (best-effort push).
    if top and top.get("user_id") != user["id"]:
        try:
            asyncio.create_task(_send_user_notification(
                user_id=top["user_id"],
                title="📈 تم تجاوز عرضك!",
                body=f"عرض جديد بقيمة {body.amount} {listing.get('currency', 'ر.س')} على «{(listing.get('title') or '')[:40]}»",
                ntype="auction_outbid",
                url=f"/listing/{listing_id}",
                extra_data={"listing_id": listing_id, "amount": body.amount},
                pref_key="broadcasts",
            ))
        except Exception:
            pass
    return {"success": True, "bid": bid, "bid_count": count}

# Map endpoint - returns listings with lat/lng
@api.get("/listings/map/nearby")
async def listings_map(
    country_code: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 200,
):
    q: dict = {"lat": {"$ne": None}, "lng": {"$ne": None}, "status": "active"}
    if country_code:
        q["country_code"] = country_code
    if category:
        q["category"] = category
    items = await db.listings.find(q, {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "category": 1, "city": 1, "lat": 1, "lng": 1, "images": 1}).limit(limit).to_list(length=limit)
    return items


# ============================================================
# Favorites
# ============================================================
@api.post("/favorites/{listing_id}")
async def toggle_favorite(listing_id: str, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id})
    if existing:
        await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
        await db.listings.update_one({"id": listing_id}, {"$inc": {"favorites": -1}})
        return {"favorited": False}
    await db.favorites.insert_one({
        "user_id": user["id"], "listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.listings.update_one({"id": listing_id}, {"$inc": {"favorites": 1}})
    return {"favorited": True}

@api.get("/favorites")
async def list_favorites(user: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=500)
    listing_ids = [f["listing_id"] for f in favs]
    listings = await db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0}).to_list(length=500)
    return listings


# ============================================================
# Price Alerts — notify a user when a listing's price drops below a target.
# Lightweight: stored in `price_alerts` collection, checked on every PUT to
# /listings/{id}. No background poller needed.
# ============================================================
@api.post("/price-alerts/{listing_id}")
async def create_price_alert(listing_id: str, payload: dict, user: dict = Depends(get_current_user)):
    target = float(payload.get("target_price") or 0)
    if target <= 0:
        raise HTTPException(400, "target_price required")
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "id": 1, "price": 1, "title": 1})
    if not listing:
        raise HTTPException(404, "Listing not found")
    doc = {
        "id": uuid.uuid4().hex,
        "user_id": user["id"],
        "listing_id": listing_id,
        "target_price": target,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "current_price": listing.get("price"),
        "title": listing.get("title"),
    }
    # Upsert by (user, listing) — one alert per user per listing.
    await db.price_alerts.update_one(
        {"user_id": user["id"], "listing_id": listing_id},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "alert": doc}

@api.get("/price-alerts")
async def list_price_alerts(user: dict = Depends(get_current_user)):
    items = await db.price_alerts.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=200)
    return items

@api.delete("/price-alerts/{listing_id}")
async def delete_price_alert(listing_id: str, user: dict = Depends(get_current_user)):
    await db.price_alerts.delete_one({"user_id": user["id"], "listing_id": listing_id})
    return {"ok": True}


# ============================================================
# Block user — hides their listings + prevents messaging.
# ============================================================
@api.post("/blocks/{target_id}")
async def block_user(target_id: str, user: dict = Depends(get_current_user)):
    if target_id == user["id"]:
        raise HTTPException(400, "لا يمكنك حظر نفسك")
    await db.blocks.update_one(
        {"blocker_id": user["id"], "blocked_id": target_id},
        {"$set": {"blocker_id": user["id"], "blocked_id": target_id, "ts": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True, "blocked": True}

@api.delete("/blocks/{target_id}")
async def unblock_user(target_id: str, user: dict = Depends(get_current_user)):
    await db.blocks.delete_one({"blocker_id": user["id"], "blocked_id": target_id})
    return {"ok": True, "blocked": False}

@api.get("/blocks/{target_id}/status")
async def block_status(target_id: str, user: dict = Depends(get_current_user)):
    exists = await db.blocks.find_one({"blocker_id": user["id"], "blocked_id": target_id}, {"_id": 0, "blocker_id": 1})
    return {"blocked": bool(exists)}

async def _check_price_alerts(listing_id: str, new_price: Optional[float]):
    """Fire push notifications to anyone whose target_price >= new_price."""
    if new_price is None:
        return
    alerts = await db.price_alerts.find({"listing_id": listing_id, "target_price": {"$gte": new_price}}, {"_id": 0}).to_list(length=500)
    for a in alerts:
        try:
            asyncio.create_task(_send_push(
                a["user_id"],
                "🔔 سعر مناسب!",
                f"{a.get('title','إعلان')} — السعر الآن {new_price}",
                {"type": "price_alert", "listing_id": listing_id},
            ))
        except Exception:
            pass
        # Auto-remove the alert so the user is only notified once.
        await db.price_alerts.delete_one({"id": a["id"]})


# ============================================================
# Chat
# ============================================================
from chat_hub import hub as _chat_hub


@app.websocket("/api/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str = Query("")):
    """Single per-user real-time chat channel.

    Authenticates via JWT supplied as query string (browsers can't set custom
    headers on WebSocket handshakes). Falls back to httpOnly cookie if the
    query token is missing.
    """
    # Decode token (query first, then cookie)
    user_id: Optional[str] = None
    try:
        if token:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub")
        else:
            cookie_token = websocket.cookies.get("access_token")
            if cookie_token:
                payload = jwt.decode(cookie_token, JWT_SECRET, algorithms=["HS256"])
                user_id = payload.get("sub")
    except jwt.InvalidTokenError:
        user_id = None

    if not user_id:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    await _chat_hub.connect(user_id, websocket)
    # Clear last_seen "offline" flag — best-effort
    try:
        await db.users.update_one({"id": user_id}, {"$set": {"last_seen": None}})
    except Exception:
        pass

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
            except Exception:
                continue
            etype = event.get("type")
            if etype == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue
            if etype == "typing":
                to = event.get("to")
                if to and isinstance(to, str):
                    await _chat_hub.send_to_user(to, {
                        "type": "typing",
                        "from": user_id,
                        "is_typing": bool(event.get("is_typing")),
                    })
                continue
            if etype == "read":
                convo_id = event.get("convo_id")
                if convo_id and isinstance(convo_id, str):
                    # Mark all unread messages in this conversation as read
                    now = datetime.now(timezone.utc).isoformat()
                    await db.messages.update_many(
                        {"convo_id": convo_id, "receiver_id": user_id, "read": False},
                        {"$set": {"read": True, "read_at": now}},
                    )
                    # Reset unread counter on conversation
                    await db.conversations.update_one(
                        {"id": convo_id},
                        {"$set": {f"unread_{user_id}": 0}},
                    )
                    # Notify the other participant
                    parts = convo_id.split("_")
                    other = next((p for p in parts if p != user_id), None)
                    if other:
                        await _chat_hub.send_to_user(other, {
                            "type": "read",
                            "convo_id": convo_id,
                            "by": user_id,
                            "ts": now,
                        })
                continue
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"[ws/chat] {e}")
    finally:
        await _chat_hub.disconnect(user_id, websocket, db)


@api.get("/chat/presence/{user_id}")
async def get_presence(user_id: str, _: dict = Depends(get_current_user)):
    """Online/last-seen status for a single user."""
    if _chat_hub.is_online(user_id):
        return {"user_id": user_id, "online": True}
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "last_seen": 1})
    return {"user_id": user_id, "online": False, "last_seen": (u or {}).get("last_seen")}


@api.post("/chat/send")
async def send_message(body: ChatMessageIn, user: dict = Depends(get_current_user)):
    if body.receiver_id == user["id"]:
        raise HTTPException(400, "Cannot message yourself")
    receiver = await db.users.find_one({"id": body.receiver_id}, {"_id": 0, "id": 1, "name": 1})
    if not receiver:
        raise HTTPException(404, "Receiver not found")
    convo_id = "_".join(sorted([user["id"], body.receiver_id]))
    msg = {
        "id": str(uuid.uuid4()),
        "convo_id": convo_id,
        "sender_id": user["id"],
        "receiver_id": body.receiver_id,
        "listing_id": body.listing_id,
        "text": body.text,
        "image": body.image,
        "voice": body.voice,
        "location": body.location,
        "reply_to": body.reply_to,
        "read": False,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    # upsert convo doc
    await db.conversations.update_one(
        {"id": convo_id},
        {"$set": {
            "id": convo_id,
            "participants": sorted([user["id"], body.receiver_id]),
            "listing_id": body.listing_id,
            "last_message": body.text or "[وسائط]",
            "last_ts": msg["ts"],
        }, "$inc": {f"unread_{body.receiver_id}": 1}},
        upsert=True
    )
    msg.pop("_id", None)
    # Real-time fan-out via WebSocket (instant). Both receiver AND sender's
    # other devices/tabs get the message so they all stay in sync.
    sender_meta = {"id": user["id"], "name": user.get("name"), "avatar_url": user.get("avatar_url")}
    msg_payload = {**msg, "sender": sender_meta}
    delivered = await _chat_hub.send_to_user(body.receiver_id, {"type": "message", "data": msg_payload})
    await _chat_hub.send_to_user(user["id"], {"type": "message", "data": msg_payload})
    # If receiver is online, instantly mark as delivered and inform sender
    if delivered > 0:
        try:
            await db.messages.update_one({"id": msg["id"]}, {"$set": {"delivered": True, "delivered_at": datetime.now(timezone.utc).isoformat()}})
        except Exception:
            pass
        await _chat_hub.send_to_user(user["id"], {
            "type": "delivered",
            "convo_id": convo_id,
            "message_id": msg["id"],
            "by": body.receiver_id,
        })
    # In-app notification + push (respects user's `messages` pref) — only if
    # receiver is NOT actively connected (saves on no-op push).
    if delivered == 0:
        preview = (body.text or "[وسائط]")[:80]
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": body.receiver_id,
            "type": "new_message",
            "title": f"رسالة جديدة من {user.get('name', 'مستخدم')}",
            "body": preview,
            "data": {"convo_id": convo_id, "sender_id": user["id"]},
            "read": False,
            "created_at": msg["ts"],
        })
        asyncio.create_task(_send_push(
            db, [body.receiver_id],
            title=f"💬 {user.get('name', 'رسالة جديدة')}",
            body=preview,
            url=f"/chat?to={user['id']}",
            data={"type": "new_message", "convo_id": convo_id, "sender_id": user["id"]},
            pref_key="messages",
        ))
    return msg_payload

@api.get("/chat/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    convos = await db.conversations.find({"participants": user["id"]}, {"_id": 0}).sort("last_ts", -1).to_list(length=200)
    # enrich with other participant info
    for c in convos:
        other_id = next((p for p in c["participants"] if p != user["id"]), None)
        if other_id:
            other = await db.users.find_one({"id": other_id}, {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "phone_full": 1, "verified": 1})
            c["other"] = other
        c["unread"] = c.get(f"unread_{user['id']}", 0)
    return convos

@api.get("/chat/messages/{convo_id}")
async def get_messages(convo_id: str, before: Optional[str] = None, limit: int = 50, user: dict = Depends(get_current_user)):
    """Cursor-paginated messages. When `before` (ISO ts) is provided, returns
    {messages, has_more, next_before} for "load older" scroll. Otherwise returns
    the legacy list shape (newest 500 ascending) so existing clients keep working."""
    parts = convo_id.split("_")
    if user["id"] not in parts:
        raise HTTPException(403)
    if before:
        limit = max(1, min(limit, 100))
        q = {"convo_id": convo_id, "ts": {"$lt": before}}
        msgs = await db.messages.find(q, {"_id": 0}).sort("ts", -1).limit(limit).to_list(length=limit)
        msgs.reverse()
        return {
            "messages": msgs,
            "has_more": len(msgs) == limit,
            "next_before": msgs[0]["ts"] if (msgs and len(msgs) == limit) else None,
        }
    # Legacy: latest 500 oldest-first + mark as read.
    msgs = await db.messages.find({"convo_id": convo_id}, {"_id": 0}).sort("ts", 1).to_list(length=500)
    await db.messages.update_many({"convo_id": convo_id, "receiver_id": user["id"], "read": False}, {"$set": {"read": True}})
    await db.conversations.update_one({"id": convo_id}, {"$set": {f"unread_{user['id']}": 0}})
    return msgs


# ============================================================
# Reports / Moderation
# ============================================================
@api.post("/reports")
async def submit_report(body: ReportIn, user: dict = Depends(get_current_user)):
    rid = str(uuid.uuid4())
    await db.reports.insert_one({
        "id": rid,
        "reporter_id": user["id"],
        "target_type": body.target_type,
        "target_id": body.target_id,
        "reason": body.reason,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": rid, "success": True}


# ============================================================
# Contact + Account deletion
# ============================================================
class ContactIn(BaseModel):
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=5, max_length=4000)
    email: Optional[EmailStr] = None
    name: Optional[str] = None

@api.post("/contact")
async def submit_contact(body: ContactIn, request: Request):
    try:
        user = await get_current_user(request)
        author_email = user.get("email")
        author_name = user.get("name")
    except Exception:
        author_email = body.email
        author_name = body.name
    cid = str(uuid.uuid4())
    await db.contact_messages.insert_one({
        "id": cid, "subject": body.subject, "message": body.message,
        "author_email": author_email, "author_name": author_name,
        "status": "open", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": cid, "success": True}

@api.post("/auth/request-account-deletion")
async def request_account_deletion(user: dict = Depends(get_current_user)):
    await db.account_deletion_requests.insert_one({
        "user_id": user["id"], "email": user.get("email"),
        "requested_at": datetime.now(timezone.utc).isoformat(), "status": "pending",
    })
    return {"success": True, "message": "تم استلام طلب الحذف"}


# ============================================================
# Ads (banner ads, managed by Admin)
# ============================================================
@api.get("/ads")
async def public_ads(placement: Optional[str] = None, country_code: Optional[str] = None):
    q: dict = {"active": True}
    if placement:
        q["placement"] = placement
    if country_code:
        q["$or"] = [{"country_code": country_code}, {"country_code": None}, {"country_code": ""}]
    ads = await db.ads.find(q, {"_id": 0}).sort("created_at", -1).to_list(length=20)
    return ads


# Ads analytics: fire-and-forget impression + click tracking. Both endpoints
# accept anonymous calls (no auth) because ads are public surfaces. Counters
# are stored on the ad doc; aggregated CTR is computed in admin stats.
@api.post("/ads/{aid}/impression")
async def ad_impression(aid: str):
    await db.ads.update_one({"id": aid}, {"$inc": {"impressions": 1}})
    return {"ok": True}

@api.post("/ads/{aid}/click")
async def ad_click(aid: str):
    await db.ads.update_one({"id": aid}, {"$inc": {"clicks": 1}})
    return {"ok": True}


# ============================================================
# AI Features (Image search + Translate) — Emergent LLM Key
# ============================================================
class AIImageSearchIn(BaseModel):
    image_base64: str  # data URL or raw base64

class AITranslateIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    target_lang: str = Field(min_length=2, max_length=5)  # ar|en|ur|hi|bn|fr

LANG_NAMES = {
    "ar": "Arabic", "en": "English", "ur": "Urdu",
    "hi": "Hindi", "bn": "Bengali", "fr": "French",
}

@api.post("/ai/image-search")
async def ai_image_search(body: AIImageSearchIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "خدمة الذكاء الاصطناعي غير مفعلة")
    # Strip data URL prefix if present
    raw = body.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    if len(raw) < 100:
        raise HTTPException(400, "صورة غير صالحة")

    try:
        from llm_shim import LlmChat, UserMessage, ImageContent
    except Exception as e:
        logger.error(f"llm_shim import failed: {e}")
        raise HTTPException(500, "خدمة الذكاء الاصطناعي غير متوفرة")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"img-search-{uuid.uuid4().hex[:8]}",
        system_message=(
            "أنت مساعد بحث في تطبيق إعلانات مبوبة. مهمتك تحليل الصورة وإرجاع كلمات بحث "
            "قصيرة ومركزة باللغة العربية (3 إلى 6 كلمات فقط) تصف المنتج الرئيسي في الصورة. "
            "أرجع الكلمات فقط بدون أي شرح أو إيموجي. مثال: 'تويوتا كامري 2020 أبيض'."
        ),
    ).with_model("gemini", "gemini-2.5-flash")

    img = ImageContent(image_base64=raw)
    msg = UserMessage(text="حلل هذه الصورة وأرجع كلمات البحث المناسبة فقط:", file_contents=[img])
    try:
        text = await chat.send_message(msg)
        # Sanitize
        query = (text or "").strip().strip('"').strip("'").splitlines()[0][:120]
        return {"query": query}
    except Exception as e:
        logger.error(f"[AI image-search] {e}")
        raise HTTPException(500, "تعذر تحليل الصورة")


# ============================================================
# Sell with AI — Auto-fill listing from image
# ============================================================
class AIListingFillIn(BaseModel):
    image_base64: str


@api.post("/ai/listing-autofill")
async def ai_listing_autofill(body: AIListingFillIn):
    """
    Analyze a product image and return suggested {title, description, category_key, suggested_price_range, condition}.
    Uses Gemini Vision via Emergent LLM Key.
    """
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "خدمة الذكاء الاصطناعي غير مفعلة")
    raw = body.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    if len(raw) < 100:
        raise HTTPException(400, "صورة غير صالحة")

    # Available categories
    cat_keys = [c["key"] for c in CATEGORIES]

    try:
        from llm_shim import LlmChat, UserMessage, ImageContent
    except Exception as e:
        logger.error(f"llm_shim import failed: {e}")
        raise HTTPException(500, "خدمة الذكاء الاصطناعي غير متوفرة")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sell-ai-{uuid.uuid4().hex[:8]}",
        system_message=(
            "أنت مساعد ذكي لإنشاء إعلانات بيع في تطبيق الحراج بلس. "
            "مهمتك: تحليل صورة المنتج وإرجاع JSON صحيح فقط بهذا الشكل بالضبط:\n"
            '{"title":"...","description":"...","category_key":"...","condition":"new|used|like_new","suggested_price_min":N,"suggested_price_max":N,"currency":"SAR"}\n'
            f"category_key يجب أن يكون من هذه القائمة فقط: {','.join(cat_keys)}.\n"
            "العنوان: 4-9 كلمات بالعربية، يصف المنتج بدقة (الماركة + الموديل + سنة/مواصفة بارزة).\n"
            "الوصف: 2-3 جمل عربية مختصرة وجذابة (اللون + الحالة + ميزات بارزة).\n"
            "السعر التقديري: بالريال السعودي بناءً على متوسط السوق الخليجي (الحد الأدنى والأقصى).\n"
            "أرجع فقط JSON صحيح بدون أي شرح أو ```."
        ),
    ).with_model("gemini", "gemini-2.5-flash")

    img = ImageContent(image_base64=raw)
    msg = UserMessage(
        text="حلل المنتج في هذه الصورة وأرجع JSON بتفاصيل الإعلان:",
        file_contents=[img],
    )
    try:
        text = await chat.send_message(msg)
    except Exception as e:
        logger.error(f"[AI listing-autofill] LLM error: {e}")
        raise HTTPException(500, "تعذر تحليل الصورة")

    # Parse JSON from response (strip code fences if present)
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```", 2)[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    # Extract first JSON object
    import json as _json
    import re as _re
    m = _re.search(r"\{.*\}", cleaned, _re.DOTALL)
    if not m:
        raise HTTPException(500, "تعذر فهم استجابة الذكاء الاصطناعي")
    try:
        data = _json.loads(m.group(0))
    except Exception:
        raise HTTPException(500, "تنسيق غير صالح من الذكاء الاصطناعي")

    # Validate / sanitize
    valid_categories = set(cat_keys)
    cat = data.get("category_key") or "other"
    if cat not in valid_categories:
        cat = "other"
    title = (data.get("title") or "")[:120]
    desc = (data.get("description") or "")[:1000]
    cond = data.get("condition") or "used"
    if cond not in {"new", "used", "like_new"}:
        cond = "used"
    try:
        pmin = float(data.get("suggested_price_min") or 0)
        pmax = float(data.get("suggested_price_max") or pmin)
    except Exception:
        pmin, pmax = 0, 0
    currency = data.get("currency") or "SAR"

    return {
        "title": title,
        "description": desc,
        "category_key": cat,
        "condition": cond,
        "suggested_price_min": pmin,
        "suggested_price_max": pmax,
        "currency": currency,
    }



class AISuggestCategoryIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)


_CAT_SUGGEST_CACHE: dict = {}


@api.post("/ai/suggest-category")
async def ai_suggest_category(body: AISuggestCategoryIn):
    """Suggest the best category key for a listing title using the LLM.
    Falls back gracefully — frontend already has a keyword matcher, this only
    helps when keywords don't match (e.g. uncommon brand names).
    """
    title = body.title.strip()
    if not title or not EMERGENT_LLM_KEY:
        return {"category": ""}
    key = f"CAT|{title.lower()}"
    now = time.time()
    if key in _CAT_SUGGEST_CACHE:
        ts, c = _CAT_SUGGEST_CACHE[key]
        if now - ts < 86400:
            return {"category": c}
    valid_keys = [c["key"] for c in CATEGORIES]
    try:
        from llm_shim import LlmChat, UserMessage
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"cat-{title[:30]}", system_message=(
            "أنت مصنّف ذكي للإعلانات المبوبة. سأعطيك عنوان إعلان وقائمة فئات صالحة. "
            "أرجع فقط مفتاح الفئة الأنسب من القائمة (key بالإنجليزية)، بدون أي شرح أو علامات اقتباس."
        ))
        chat.with_model("gemini", "gemini-2.5-flash")
        msg = UserMessage(text=f"عنوان الإعلان: {title}\nالفئات المتاحة: {', '.join(valid_keys)}\nالفئة الأنسب فقط:")
        reply = (await chat.send_message(msg) or "").strip().lower()
        # Clean reply — sometimes the model wraps in backticks
        reply = reply.replace("`", "").replace("\"", "").replace("'", "").replace("-", "_").strip()
        # Use the first matching valid key in the reply.
        # Also tolerate the model returning hyphen/underscore variants.
        chosen = ""
        for k in valid_keys:
            if k in reply or k.replace("_", "") in reply.replace("_", ""):
                chosen = k
                break
        if chosen:
            _CAT_SUGGEST_CACHE[key] = (now, chosen)
        return {"category": chosen}
    except Exception as e:
        logger.warning(f"[ai/suggest-category] {e}")
        return {"category": ""}


@api.post("/ai/translate")
async def ai_translate(body: AITranslateIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "خدمة الترجمة غير مفعلة")
    target = body.target_lang.lower()
    if target not in LANG_NAMES:
        raise HTTPException(400, "لغة غير مدعومة")
    # Cache by hash to avoid repeat calls
    import hashlib
    cache_key = hashlib.sha1(f"{target}:{body.text}".encode()).hexdigest()
    cached = await db.translation_cache.find_one({"key": cache_key}, {"_id": 0})
    if cached:
        return {"text": cached["translated"], "cached": True}

    try:
        from llm_shim import LlmChat, UserMessage
    except Exception as e:
        logger.error(f"llm_shim import failed: {e}")
        raise HTTPException(500, "خدمة الترجمة غير متوفرة")

    target_name = LANG_NAMES[target]
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"translate-{uuid.uuid4().hex[:8]}",
        system_message=(
            f"You are a professional translator. Translate the user's message to {target_name}. "
            "Output ONLY the translated text without any explanation, prefix, or quotes. "
            "Preserve numbers, prices, phone numbers, and proper nouns as-is."
        ),
    ).with_model("gemini", "gemini-2.5-flash")
    try:
        translated = await chat.send_message(UserMessage(text=body.text))
        out = (translated or "").strip().strip('"').strip("'")
        await db.translation_cache.insert_one({
            "key": cache_key, "target": target, "source": body.text,
            "translated": out, "ts": datetime.now(timezone.utc).isoformat(),
        })
        return {"text": out, "cached": False}
    except Exception as e:
        logger.error(f"[AI translate] {e}")
        raise HTTPException(500, "تعذر الترجمة")


# ============================================================
# Listing Edit / Republish / Sold
# ============================================================
class ListingUpdateIn(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    custom_fields: Optional[dict] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    city: Optional[str] = None
    district: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    show_phone: Optional[bool] = None
    contact_phone: Optional[str] = None

@api.put("/listings/{listing_id}")
async def update_listing(listing_id: str, body: ListingUpdateIn, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "الإعلان غير موجود")
    if item["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "غير مصرح بتعديل هذا الإعلان")
    update_data = body.model_dump(exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(400, "لا يوجد بيانات للتعديل")
    # Re-moderate if title/description changed
    if "title" in update_data or "description" in update_data:
        text_check = f"{update_data.get('title', item['title'])} {update_data.get('description', item['description'])}"
        new_flags = detect_moderation_flags(text_check)
        update_data["moderation"] = "pending" if new_flags else "approved"
        update_data["moderation_flags"] = new_flags
        # Notify admins if new flags appeared on this update (best-effort)
        if new_flags and not (item.get("moderation_flags") == new_flags):
            try:
                admins = await db.users.find({"role": "admin"}, {"_id": 0, "id": 1}).limit(10).to_list(length=10)
                flags_summary = ", ".join(new_flags[:3]) or "محتوى مشبوه"
                edited_title = update_data.get("title", item.get("title") or "")
                for adm in admins:
                    await _send_user_notification(
                        user_id=adm["id"],
                        title="🚩 تعديل إعلان بانتظار المراجعة",
                        body=f"«{edited_title[:50]}» — {flags_summary}",
                        ntype="moderation_flagged",
                        url=f"/admin/listings/{listing_id}",
                        extra_data={"listing_id": listing_id, "flags": new_flags, "kind": "update"},
                        pref_key="broadcasts",
                    )
            except Exception as _ne:
                logger.warning(f"[mod-update] admin notify failed: {_ne}")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    old_price = item.get("price") or 0
    new_price = update_data.get("price", old_price)
    # Refresh searchable blob if any text-bearing field changed
    if any(k in update_data for k in ("title", "description", "category", "subcategory", "city", "district", "custom_fields")):
        merged = {**item, **update_data}
        update_data["search_blob"] = build_search_blob(merged)
    # Refresh slug when title changes (preserves SEO short suffix for uniqueness)
    if "title" in update_data:
        base_slug = _slugify(update_data["title"])
        update_data["slug"] = f"{base_slug}-{listing_id.replace('-', '')[:6]}" if base_slug else item.get("slug") or f"listing-{listing_id.replace('-', '')[:8]}"
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    _cache_invalidate()
    # Trigger price-alert notifications (best-effort; non-blocking)
    if "price" in update_data:
        asyncio.create_task(_check_price_alerts(listing_id, update_data.get("price")))

    # Re-run AI moderation when title or description changed (fire-and-forget)
    if "title" in update_data or "description" in update_data:
        new_title = update_data.get("title", item.get("title") or "")
        new_desc = update_data.get("description", item.get("description") or "")
        asyncio.create_task(ai_moderate_listing(listing_id, new_title, new_desc))

    # Re-submit to IndexNow when meaningful content changes (so search engines re-crawl)
    try:
        if any(k in update_data for k in ("title", "description", "price", "media_urls")):
            fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
            from urllib.parse import urlparse as _up
            host = _up(fe).hostname or "alhraj.online"
            urls = [f"{fe}/listing/{listing_id}"]
            new_slug = update_data.get("slug") or item.get("slug")
            if new_slug:
                urls.append(f"{fe}/listing/{new_slug}")
            _seo_submit_bg(db, urls, host)
            if new_slug:
                _google_idx_updated(f"{fe}/listing/{new_slug}")
    except Exception as _e:
        logger.warning(f"[IndexNow] update enqueue failed: {_e}")

    # Price drop alert: notify watchers when price decreases by ≥1%
    try:
        if "price" in update_data and new_price and old_price and new_price < old_price * 0.99:
            watchers = await db.watches.find({"listing_id": listing_id}, {"_id": 0, "user_id": 1}).to_list(length=10000)
            now_iso = datetime.now(timezone.utc).isoformat()
            pct = round((1 - (new_price / old_price)) * 100)
            title = item.get("title", "إعلان")
            for w in watchers:
                if w["user_id"] == item["user_id"]:
                    continue
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": w["user_id"],
                    "type": "price_drop",
                    "title": f"💸 تخفيض في السعر -{pct}%",
                    "body": f"تم تخفيض سعر «{title}» إلى {new_price:,.0f}",
                    "data": {"listing_id": listing_id, "old_price": old_price, "new_price": new_price},
                    "read": False,
                    "created_at": now_iso,
                })
            # Push (unified Expo + Web)
            try:
                watcher_ids = [w["user_id"] for w in watchers if w["user_id"] != item["user_id"]]
                if watcher_ids:
                    asyncio.create_task(_send_push(
                        db, watcher_ids,
                        title=f"💸 تخفيض سعر -{pct}%",
                        body=f"«{title}» الآن بـ {new_price:,.0f}",
                        url=f"/listing/{listing_id}",
                        data={"type": "price_drop", "listing_id": listing_id},
                        pref_key="watchlist",
                    ))
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"price-drop notify failed: {e}")
    new_item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return new_item

@api.post("/listings/{listing_id}/pause")
async def pause_listing(listing_id: str, user: dict = Depends(get_current_user)):
    """Soft-pause a listing: it stays in the DB and the seller can resume it
    anytime, but it is hidden from public listings/search/auctions/stories.
    Different from delete (permanent) and sold (final)."""
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "الإعلان غير موجود")
    if item["user_id"] != user["id"]:
        raise HTTPException(403, "غير مصرح")
    if item.get("status") == "paused":
        return {"ok": True, "already_paused": True}
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "paused",
            "previous_status": item.get("status", "active"),
            "paused_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"ok": True}


@api.post("/listings/{listing_id}/resume")
async def resume_listing(listing_id: str, user: dict = Depends(get_current_user)):
    """Resume a paused listing back to its previous status (usually active)."""
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "الإعلان غير موجود")
    if item["user_id"] != user["id"]:
        raise HTTPException(403, "غير مصرح")
    if item.get("status") != "paused":
        return {"ok": True, "not_paused": True}
    prev = item.get("previous_status") or "active"
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": prev,
            "resumed_at": datetime.now(timezone.utc).isoformat(),
        },
         "$unset": {"paused_at": "", "previous_status": ""}},
    )
    return {"ok": True, "status": prev}


@api.post("/listings/{listing_id}/republish")
async def republish_listing(listing_id: str, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "الإعلان غير موجود")
    if item["user_id"] != user["id"]:
        raise HTTPException(403, "غير مصرح")
    last_repub = item.get("last_republished_at") or item.get("created_at")
    try:
        last_dt = datetime.fromisoformat(last_repub) if isinstance(last_repub, str) else last_repub
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
    except Exception:
        last_dt = datetime.now(timezone.utc) - timedelta(days=2)
    elapsed = datetime.now(timezone.utc) - last_dt
    if elapsed < timedelta(hours=24):
        remaining_h = max(0, 24 - int(elapsed.total_seconds() // 3600))
        raise HTTPException(400, f"يمكن التجديد كل 24 ساعة. متبقي ~{remaining_h} ساعة")
    now = datetime.now(timezone.utc).isoformat()
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "active",
            "last_republished_at": now,
            "created_at": now,  # bumps to top of newest sort
            "updated_at": now,
        },
         "$inc": {"republish_count": 1}},
    )
    return {"success": True, "message": "تم تجديد الإعلان وإعادة نشره في الأعلى"}

@api.post("/listings/{listing_id}/mark-sold")
async def mark_sold(listing_id: str, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id})
    if not item:
        raise HTTPException(404, "الإعلان غير موجود")
    if item["user_id"] != user["id"]:
        raise HTTPException(403, "غير مصرح")
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {
            "status": "sold",
            "sold_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"success": True}


# ============================================================
# Live Location Sharing (consent-based, time-limited)
# ============================================================
class LocationShareIn(BaseModel):
    receiver_id: str
    lat: float
    lng: float
    duration_minutes: int = Field(default=15, ge=1, le=60)

@api.post("/chat/location-share")
async def share_live_location(body: LocationShareIn, user: dict = Depends(get_current_user)):
    if body.receiver_id == user["id"]:
        raise HTTPException(400, "لا يمكنك مشاركة موقعك مع نفسك")
    receiver = await db.users.find_one({"id": body.receiver_id}, {"_id": 0, "id": 1})
    if not receiver:
        raise HTTPException(404, "المستقبل غير موجود")
    sid = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(minutes=body.duration_minutes)
    doc = {
        "id": sid,
        "sender_id": user["id"],
        "receiver_id": body.receiver_id,
        "lat": body.lat, "lng": body.lng,
        "expires_at": expires.isoformat(),
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.location_shares.insert_one(doc)
    # Also send a chat message for the share
    convo_id = "_".join(sorted([user["id"], body.receiver_id]))
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "convo_id": convo_id,
        "sender_id": user["id"],
        "receiver_id": body.receiver_id,
        "text": f"📍 شارك موقعه الحي ({body.duration_minutes} دقيقة)",
        "image": None, "voice": None,
        "location": {"lat": body.lat, "lng": body.lng, "live_share_id": sid, "expires_at": expires.isoformat()},
        "read": False,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    doc.pop("_id", None)
    return doc

@api.get("/chat/location-share/{share_id}")
async def get_location_share(share_id: str, user: dict = Depends(get_current_user)):
    doc = await db.location_shares.find_one({"id": share_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "غير موجود")
    if user["id"] not in (doc["sender_id"], doc["receiver_id"]):
        raise HTTPException(403, "غير مصرح")
    expires_at = doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.location_shares.update_one({"id": share_id}, {"$set": {"active": False}})
        doc["active"] = False
    return doc

@api.post("/chat/location-share/{share_id}/stop")
async def stop_location_share(share_id: str, user: dict = Depends(get_current_user)):
    doc = await db.location_shares.find_one({"id": share_id})
    if not doc:
        raise HTTPException(404)
    if doc["sender_id"] != user["id"]:
        raise HTTPException(403)
    await db.location_shares.update_one({"id": share_id}, {"$set": {"active": False}})
    return {"success": True}


# ============================================================
# Admin endpoints
# ============================================================
admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])

@admin_router.get("/stats")
async def admin_stats():
    today = datetime.now(timezone.utc) - timedelta(days=1)
    # Sum total views + clicks across all listings (single aggregation, cheap).
    agg = await db.listings.aggregate([
        {"$group": {"_id": None, "views": {"$sum": "$views"}, "clicks": {"$sum": "$clicks"}}}
    ]).to_list(length=1)
    totals = agg[0] if agg else {"views": 0, "clicks": 0}
    # Top 5 categories by active-listing count.
    top_cats = await db.listings.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$category", "n": {"$sum": 1}}},
        {"$sort": {"n": -1}},
        {"$limit": 5},
    ]).to_list(length=5)
    top_categories = [{"category": c["_id"], "count": c["n"]} for c in top_cats if c.get("_id")]
    # Top 5 searched keywords (from search_terms collection — already maintained).
    top_kw = await db.search_terms.find({}, {"_id": 0, "q_lower": 1, "count": 1}).sort("count", -1).limit(5).to_list(length=5)
    top_keywords = [{"q": k.get("q_lower"), "count": k.get("count", 0)} for k in top_kw if k.get("q_lower")]
    # Daily series for the last 7 days — users created, listings created, views accrued.
    daily = []
    for i in range(6, -1, -1):
        day_start = (datetime.now(timezone.utc) - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        s_iso, e_iso = day_start.isoformat(), day_end.isoformat()
        u = await db.users.count_documents({"created_at": {"$gte": s_iso, "$lt": e_iso}})
        l = await db.listings.count_documents({"created_at": {"$gte": s_iso, "$lt": e_iso}})
        # Views per day — listings created up to that day with new views since then is expensive to compute
        # cheaply, so we approximate by counting views on listings created that day.
        agg_v = await db.listings.aggregate([
            {"$match": {"created_at": {"$gte": s_iso, "$lt": e_iso}}},
            {"$group": {"_id": None, "v": {"$sum": "$views"}}},
        ]).to_list(length=1)
        daily.append({
            "date": day_start.date().isoformat(),
            "users": u,
            "listings": l,
            "views": int(agg_v[0]["v"]) if agg_v else 0,
        })
    return {
        "users": await db.users.count_documents({}),
        "listings": await db.listings.count_documents({}),
        "active_listings": await db.listings.count_documents({"status": "active"}),
        "pending_moderation": await db.listings.count_documents({"moderation": "pending"}),
        "open_reports": await db.reports.count_documents({"status": "open"}),
        "messages_24h": await db.messages.count_documents({"ts": {"$gt": today.isoformat()}}),
        "new_users_24h": await db.users.count_documents({"created_at": {"$gt": today.isoformat()}}),
        "ads": await db.ads.count_documents({"active": True}),
        "total_views": int(totals.get("views") or 0),
        "total_clicks": int(totals.get("clicks") or 0),
        "top_categories": top_categories,
        "top_keywords": top_keywords,
        "daily_7d": daily,
    }

@admin_router.get("/listings/pending")
async def admin_pending():
    return await db.listings.find({"moderation": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(length=200)


@admin_router.get("/listings")
async def admin_listings(
    status: Optional[str] = None,
    moderation: Optional[str] = None,
    country_code: Optional[str] = None,
    q: Optional[str] = None,
    flagged: Optional[bool] = None,
    flag_kind: Optional[str] = None,  # banned_words | suspicious | phone_spam | ai
    limit: int = 50,
    skip: int = 0,
):
    """Full admin listing browser. Supports filter + lightweight search.
    `flagged=true`  → only listings with at least one moderation_flag.
    `flag_kind` ∈ {banned_words, suspicious, phone_spam, ai} narrows the type.
    """
    limit = max(1, min(int(limit or 50), 200))
    skip = max(0, int(skip or 0))
    query: dict = {}
    if status: query["status"] = status
    if moderation: query["moderation"] = moderation
    if country_code: query["country_code"] = country_code.upper()
    if flagged or flag_kind:
        query["moderation_flags"] = {"$exists": True, "$not": {"$size": 0}}
    # Narrow by flag kind via $regex on the array element (Mongo allows this on each entry)
    if flag_kind:
        kind_map = {
            "banned_words": "^banned_word:",
            "suspicious": "^(offsite_contact|bank_request|external_link)$",
            "phone_spam": "^phone_spam$",
            "ai": "^ai:",
        }
        rx = kind_map.get(flag_kind)
        if rx:
            query["moderation_flags"] = {"$elemMatch": {"$regex": rx}}
    if q:
        import re as _re
        rx = {"$regex": _re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"title": rx}, {"description": rx}]
    total = await db.listings.count_documents(query)
    items = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return {"items": items, "total": total, "limit": limit, "skip": skip}

@admin_router.post("/listings/{lid}/approve")
async def admin_approve(lid: str, user: dict = Depends(require_admin)):
    r = await db.listings.update_one({"id": lid}, {"$set": {"moderation": "approved"}})
    if r.modified_count:
        await _admin_log(user["id"], "listing_approve", lid)
        item = await db.listings.find_one({"id": lid}, {"_id": 0, "user_id": 1, "title": 1})
        if item and item.get("user_id"):
            title = item.get("title", "إعلانك")
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": item["user_id"],
                "type": "listing_approved",
                "title": "✅ تمت الموافقة على إعلانك",
                "body": f"«{title}» متاح الآن للجميع",
                "data": {"listing_id": lid},
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            asyncio.create_task(_send_push(
                db, [item["user_id"]],
                title="✅ تمت الموافقة على إعلانك",
                body=f"«{title}» متاح الآن للجميع",
                url=f"/listing/{lid}",
                data={"type": "listing_approved", "listing_id": lid},
                pref_key="listing_status",
            ))
    return {"updated": r.modified_count}


@admin_router.post("/listings/{lid}/reject")
async def admin_reject(lid: str, user: dict = Depends(require_admin)):
    r = await db.listings.update_one({"id": lid}, {"$set": {"moderation": "rejected", "status": "rejected"}})
    if r.modified_count:
        await _admin_log(user["id"], "listing_reject", lid)
        item = await db.listings.find_one({"id": lid}, {"_id": 0, "user_id": 1, "title": 1})
        if item and item.get("user_id"):
            title = item.get("title", "إعلانك")
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": item["user_id"],
                "type": "listing_rejected",
                "title": "❌ تم رفض إعلانك",
                "body": f"«{title}» — يرجى مراجعة الشروط وإعادة النشر",
                "data": {"listing_id": lid},
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            asyncio.create_task(_send_push(
                db, [item["user_id"]],
                title="❌ تم رفض إعلانك",
                body=f"«{title}» — راجع الشروط وأعد النشر",
                url=f"/listing/{lid}",
                data={"type": "listing_rejected", "listing_id": lid},
                pref_key="listing_status",
            ))
    return {"updated": r.modified_count}

@admin_router.get("/users")
async def admin_users(limit: int = 100, q: Optional[str] = None, country_code: Optional[str] = None, banned: Optional[bool] = None, verified: Optional[bool] = None):
    """List users with simple filters."""
    query: dict = {}
    if country_code: query["country_code"] = country_code.upper()
    if banned is True: query["banned"] = True
    elif banned is False: query["$or"] = [{"banned": False}, {"banned": {"$exists": False}}]
    if verified is True: query["verified"] = True
    elif verified is False: query["$or"] = [{"verified": False}, {"verified": {"$exists": False}}]
    if q:
        import re as _re
        rx = {"$regex": _re.escape(q.strip()), "$options": "i"}
        # We use $and so that the user-filter $or above is preserved if both apply
        existing_or = query.pop("$or", None)
        ors = [{"name": rx}, {"email": rx}, {"phone_full": rx}, {"phone": rx}]
        query["$and"] = [{"$or": ors}] + ([{"$or": existing_or}] if existing_or else [])
    return await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)


@admin_router.get("/users/{uid}")
async def admin_user_details(uid: str):
    """Full profile + activity for a single user (admin view)."""
    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not u:
        raise HTTPException(404, "User not found")
    listings = await db.listings.find({"user_id": uid}, {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "status": 1, "moderation": 1, "moderation_flags": 1, "created_at": 1, "images": 1, "country_code": 1}).sort("created_at", -1).limit(50).to_list(length=50)
    listings_total = await db.listings.count_documents({"user_id": uid})
    favorites_total = await db.favorites.count_documents({"user_id": uid}) if hasattr(db, "favorites") else 0
    reports_against = await db.reports.count_documents({"target_id": uid, "target_type": "user"})
    last_message = None
    try:
        last_message = await db.messages.find_one({"$or": [{"sender_id": uid}, {"receiver_id": uid}]}, {"_id": 0, "ts": 1}, sort=[("ts", -1)])
    except Exception:
        pass
    return {
        "user": u,
        "stats": {
            "listings_total": listings_total,
            "favorites_total": favorites_total,
            "reports_against": reports_against,
            "last_message_at": (last_message or {}).get("ts"),
        },
        "listings": listings,
    }

@admin_router.post("/users/{uid}/ban")
async def admin_ban(uid: str, user: dict = Depends(require_admin)):
    r = await db.users.update_one({"id": uid}, {"$set": {"banned": True}})
    if r.modified_count:
        await _admin_log(user["id"], "user_ban", uid)
    return {"updated": r.modified_count}

@admin_router.post("/users/{uid}/unban")
async def admin_unban(uid: str, user: dict = Depends(require_admin)):
    r = await db.users.update_one({"id": uid}, {"$set": {"banned": False}})
    if r.modified_count:
        await _admin_log(user["id"], "user_unban", uid)
    return {"updated": r.modified_count}

@admin_router.post("/users/{uid}/verify")
async def admin_verify(uid: str, user: dict = Depends(require_admin)):
    r = await db.users.update_one({"id": uid}, {"$set": {"verified": True}})
    if r.modified_count:
        await _admin_log(user["id"], "user_verify", uid)
    return {"updated": r.modified_count}

@admin_router.get("/reports")
async def admin_reports():
    return await db.reports.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(length=200)

@admin_router.post("/reports/{rid}/close")
async def admin_close_report(rid: str, user: dict = Depends(require_admin)):
    r = await db.reports.update_one({"id": rid}, {"$set": {"status": "closed"}})
    if r.modified_count:
        await _admin_log(user["id"], "report_close", rid)
    return {"updated": r.modified_count}

@admin_router.delete("/listings/{lid}")
async def admin_delete_listing(lid: str, user: dict = Depends(require_admin)):
    item = await db.listings.find_one({"id": lid}, {"_id": 0, "images": 1, "videos": 1})
    r = await db.listings.delete_one({"id": lid})
    media_queued = 0
    if r.deleted_count:
        await _admin_log(user["id"], "listing_delete", lid)
        _cache_invalidate()
        if item:
            media = {"images": list(item.get("images") or []), "videos": list(item.get("videos") or [])}
            media_queued = len(media["images"]) + len(media["videos"])
            asyncio.create_task(_cleanup_listing_media(lid, media))
    return {"deleted": r.deleted_count, "media_queued": media_queued}


@admin_router.get("/media-cleanup/log")
async def admin_media_cleanup_log(limit: int = 50):
    """Recent media-cleanup audit entries (newest first)."""
    items = await db.media_cleanup_log.find({}, {"_id": 0}).sort("at", -1).limit(limit).to_list(length=limit)
    return {"items": items, "count": len(items)}


@admin_router.post("/media-cleanup/scan")
async def admin_media_cleanup_scan(folder: str = "listings", max_resources: int = 200):
    """Scan Cloudinary for orphan media — public_ids whose listing no longer exists.
    Does NOT delete anything; returns a list the admin can choose to clean.
    """
    try:
        # List Cloudinary resources in the listings folder (default).
        res = await asyncio.to_thread(cloudinary.api.resources, type="upload", prefix=folder, max_results=max_resources)
    except Exception as e:
        raise HTTPException(500, f"Cloudinary list failed: {e}")
    resources = res.get("resources", []) or []
    # Collect all media URLs currently referenced by any listing
    pipeline = [
        {"$project": {"_id": 0, "images": 1, "videos": 1}},
    ]
    referenced: set = set()
    async for d in db.listings.aggregate(pipeline):
        for url in (d.get("images") or []) + (d.get("videos") or []):
            info = _cloudinary_extract_public_id(url)
            if info:
                referenced.add(info[0])
    orphans = [r for r in resources if r.get("public_id") not in referenced]
    return {
        "scanned": len(resources),
        "orphans_count": len(orphans),
        "orphans": [{"public_id": r.get("public_id"), "resource_type": r.get("resource_type"), "bytes": r.get("bytes"), "created_at": r.get("created_at")} for r in orphans[:100]],
    }


@admin_router.post("/media-cleanup/delete")
async def admin_media_cleanup_delete(body: dict, user: dict = Depends(require_admin)):
    """Delete a specific list of public_ids from Cloudinary.
    Body: {"items": [{"public_id": "...", "resource_type": "image|video"}, ...]}
    """
    items = body.get("items") or []
    if not items:
        return {"deleted": 0, "failed": 0}
    deleted = 0
    failed = 0
    details = []
    for it in items[:100]:
        pid = it.get("public_id")
        rtype = it.get("resource_type", "image")
        if not pid:
            continue
        try:
            res = await asyncio.to_thread(cloudinary.uploader.destroy, pid, resource_type=rtype, invalidate=True)
            ok = (res or {}).get("result") == "ok"
            if ok:
                deleted += 1
            else:
                failed += 1
            details.append({"public_id": pid, "status": (res or {}).get("result")})
        except Exception as e:
            failed += 1
            details.append({"public_id": pid, "error": str(e)[:80]})
    await _admin_log(user["id"], "media_cleanup_delete", f"count={len(items)}")
    return {"deleted": deleted, "failed": failed, "details": details[:50]}


# Theme settings
@admin_router.get("/data-integrity")
async def admin_data_integrity():
    """Snapshot of data-integrity issues so an admin can spot any cross-country
    leakage from legacy rows. Read-only."""
    listings_no_cc = await db.listings.count_documents({
        "$or": [
            {"country_code": {"$exists": False}},
            {"country_code": None},
            {"country_code": ""},
        ]
    })
    users_no_cc = await db.users.count_documents({
        "$or": [
            {"country_code": {"$exists": False}},
            {"country_code": None},
            {"country_code": ""},
        ]
    })
    # Show a sample of offenders so the admin can act quickly.
    sample_listings = await db.listings.find(
        {"$or": [{"country_code": {"$exists": False}}, {"country_code": None}, {"country_code": ""}]},
        {"_id": 0, "id": 1, "title": 1, "user_id": 1, "created_at": 1},
    ).sort("created_at", -1).limit(10).to_list(length=10)
    return {
        "listings_without_country": listings_no_cc,
        "users_without_country": users_no_cc,
        "sample_offending_listings": sample_listings,
    }


@admin_router.post("/data-integrity/fix")
async def admin_data_integrity_fix(default_country: str = "SA"):
    """One-off cleanup: copy the user's country onto their orphan listings.
    Listings whose owner ALSO has no country get `default_country` so they stop
    leaking into every feed. Returns the counts touched."""
    default_country = (default_country or "SA").upper()
    # 1) Patch users with no country to the default.
    users_fixed = await db.users.update_many(
        {"$or": [{"country_code": {"$exists": False}}, {"country_code": None}, {"country_code": ""}]},
        {"$set": {"country_code": default_country}},
    )
    # 2) For each listing without country, copy from owner.
    fixed_listings = 0
    cursor = db.listings.find(
        {"$or": [{"country_code": {"$exists": False}}, {"country_code": None}, {"country_code": ""}]},
        {"_id": 0, "id": 1, "user_id": 1},
    )
    async for l_doc in cursor:
        owner = await db.users.find_one({"id": l_doc.get("user_id")}, {"_id": 0, "country_code": 1})
        cc = ((owner or {}).get("country_code") or default_country).upper()
        await db.listings.update_one({"id": l_doc["id"]}, {"$set": {"country_code": cc}})
        fixed_listings += 1
    _cache_invalidate()
    return {"users_fixed": users_fixed.modified_count, "listings_fixed": fixed_listings, "default_country": default_country}


@admin_router.post("/theme")
async def admin_set_theme(body: ThemeIn):
    current = await db.settings.find_one({"_key": "theme"}, {"_id": 0}) or {"_key": "theme", "value": DEFAULT_THEME.copy()}
    payload = current.get("value", DEFAULT_THEME.copy())
    update_data = body.model_dump(exclude_unset=True, exclude_none=True)
    payload.update(update_data)
    await db.settings.update_one({"_key": "theme"}, {"$set": {"_key": "theme", "value": payload}}, upsert=True)
    return payload

# Ads management
@admin_router.get("/ads")
async def admin_list_ads():
    ads = await db.ads.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=200)
    # Compute CTR per ad. Safe-divide; missing counters = 0.
    for a in ads:
        imp = int(a.get("impressions") or 0)
        clk = int(a.get("clicks") or 0)
        a["ctr"] = round((clk / imp) * 100, 2) if imp > 0 else 0.0
        a["impressions"] = imp
        a["clicks"] = clk
    return ads


# ============================================================
# Admin audit log: every privileged mutation appends a row to admin_logs.
# Lightweight insert (no joins, no indexes beyond ts) — keeps writes fast.
# ============================================================
async def _admin_log(admin_id: str, action: str, target_id: Optional[str] = None, meta: Optional[dict] = None):
    try:
        await db.admin_logs.insert_one({
            "id": str(uuid.uuid4()),
            "admin_id": admin_id,
            "action": action,
            "target_id": target_id,
            "meta": meta or {},
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as _e:
        logger.warning(f"[admin_log] insert failed: {_e}")

@admin_router.get("/logs")
async def admin_list_logs(limit: int = 100):
    limit = max(1, min(limit, 500))
    return await db.admin_logs.find({}, {"_id": 0}).sort("ts", -1).limit(limit).to_list(length=limit)


# ----- Banned words management -----
@admin_router.get("/banned-words")
async def admin_banned_words_list():
    """List the active banned-words set. When db.banned_words is empty we still
    return the seed list so the admin always sees what's enforcing the filter."""
    rows = await db.banned_words.find({}, {"_id": 0}).sort("word", 1).to_list(length=5000)
    if not rows:
        rows = [{"word": w, "source": "seed"} for w in BANNED_WORDS_SEED]
    return {"items": rows, "count": len(rows), "active": BANNED_WORDS}


@admin_router.post("/banned-words")
async def admin_banned_words_add(body: dict, user: dict = Depends(require_admin)):
    word = (body or {}).get("word", "").strip()
    if not word or len(word) > 60:
        raise HTTPException(400, "word required (1..60 chars)")
    # First write: seed the collection so the admin's set replaces the hardcoded list.
    if await db.banned_words.count_documents({}) == 0:
        await db.banned_words.insert_many([{"word": w, "source": "seed", "ts": datetime.now(timezone.utc).isoformat()} for w in BANNED_WORDS_SEED])
    await db.banned_words.update_one(
        {"word": word},
        {"$set": {"word": word, "source": "admin", "ts": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    await _admin_log(user["id"], "banned_word_add", word)
    await _reload_banned_words()
    return {"added": word, "count": len(BANNED_WORDS)}


@admin_router.delete("/banned-words/{word}")
async def admin_banned_words_remove(word: str, user: dict = Depends(require_admin)):
    # If still empty, seed first so we can "delete" a seed entry permanently.
    if await db.banned_words.count_documents({}) == 0:
        await db.banned_words.insert_many([{"word": w, "source": "seed", "ts": datetime.now(timezone.utc).isoformat()} for w in BANNED_WORDS_SEED])
    r = await db.banned_words.delete_one({"word": word})
    await _admin_log(user["id"], "banned_word_remove", word)
    await _reload_banned_words()
    return {"removed": r.deleted_count, "count": len(BANNED_WORDS)}

@admin_router.post("/ads")
async def admin_create_ad(body: AdIn):
    aid = str(uuid.uuid4())
    doc = body.model_dump()
    doc["id"] = aid
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.ads.insert_one(doc)
    doc.pop("_id", None)
    return doc

@admin_router.delete("/ads/{aid}")
async def admin_delete_ad(aid: str):
    r = await db.ads.delete_one({"id": aid})
    return {"deleted": r.deleted_count}

@admin_router.put("/ads/{aid}")
async def admin_update_ad(aid: str, body: AdIn):
    r = await db.ads.update_one({"id": aid}, {"$set": body.model_dump()})
    return {"updated": r.modified_count}


# ============================================================
# Admin: Notifications (broadcast + AI suggestions)
# ============================================================
class BroadcastIn(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    body: str = Field(min_length=2, max_length=500)
    target: str = Field(default="all", pattern="^(all|verified|unverified|country|category|inactive)$")
    country_code: Optional[str] = None
    category: Optional[str] = None  # used when target=category
    inactive_days: Optional[int] = None  # used when target=inactive (default 14)
    # NEW: optional deep-link URL the notification should open (e.g. /listing/<id>,
    # /chat, /auctions, or an absolute https URL). Mobile uses Linking, web uses
    # window.location. Empty string → default to "/".
    url: Optional[str] = None
    # NEW: optional image URL (rich push). Expo supports `richContent.image`,
    # web push uses the icon. If omitted, no image is attached.
    image: Optional[str] = None

# ============================================================
# Admin Finance + SEO
# ============================================================
@admin_router.get("/finance/summary")
async def admin_finance_summary():
    """Returns finance overview. Currently zeros (no payment processor yet)."""
    total_listings = await db.listings.count_documents({})
    paid_listings = await db.listings.count_documents({"paid": True})
    return {
        "total_commission": 0,
        "this_month_count": paid_listings,
        "total_wallets": 0,
        "pending_withdrawals": 0,
        "total_listings": total_listings,
        "currency": "SAR",
    }


@admin_router.get("/seo")
async def admin_seo_get():
    defaults = {
        "site_title": "الحراج بلس | بيع و اشتري | جديد أو مستعمل",
        "site_description": "أكبر سوق رقمي للخليج العربي - بيع، اشترِ، استأجر، وظّف",
        "meta_keywords": "حراج, بيع, شراء, السعودية, الخليج, إعلانات",
        "og_image": "/logo-haraj.png",
        "robots_txt": "User-agent: *\nAllow: /\nSitemap: https://alhraj.online/sitemap.xml",
    }
    rec = await db.settings.find_one({"_key": "seo"}, {"_id": 0, "value": 1})
    if rec and rec.get("value"):
        return {**defaults, **rec["value"]}
    return defaults


class SEOIn(BaseModel):
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    og_image: Optional[str] = None
    robots_txt: Optional[str] = None


@admin_router.post("/seo")
async def admin_seo_save(body: SEOIn):
    payload = {k: v for k, v in body.dict().items() if v is not None}
    await db.settings.update_one({"_key": "seo"}, {"$set": {"value": payload}}, upsert=True)
    return {"ok": True}


@admin_router.post("/notifications/broadcast")
async def broadcast_notification(body: BroadcastIn):
    q: dict = {"banned": {"$ne": True}}
    if body.target == "verified":
        q["verified"] = True
    elif body.target == "unverified":
        q["verified"] = {"$ne": True}
    elif body.target == "country" and body.country_code:
        q["country_code"] = body.country_code
    elif body.target == "category" and body.category:
        # Users who follow this category OR posted in it.
        followers = await db.category_follows.distinct("user_id", {"category": body.category})
        posters = await db.listings.distinct("user_id", {"category": body.category})
        ids = list({*(followers or []), *(posters or [])})
        if not ids:
            return {"sent": 0, "target": body.target, "push_devices": 0}
        q["id"] = {"$in": ids}
    elif body.target == "inactive":
        # Users whose last_seen is older than N days (default 14).
        days = max(1, int(body.inactive_days or 14))
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        q["$or"] = [
            {"last_seen": {"$lt": cutoff}},
            {"last_seen": None},
            {"last_seen": {"$exists": False}},
        ]
    user_ids = [u["id"] async for u in db.users.find(q, {"_id": 0, "id": 1})]
    deep_url = (body.url or "/").strip() or "/"
    docs = [
        {"id": str(uuid.uuid4()), "user_id": uid, "title": body.title, "body": body.body,
         "type": "admin_broadcast", "read": False, "ts": datetime.now(timezone.utc).isoformat(),
         "url": deep_url, "image": body.image or None,
         "data": {"type": "admin_broadcast", "url": deep_url, "image": body.image or None}}
        for uid in user_ids
    ]
    if docs:
        await db.notifications.insert_many(docs)
    # Push (Expo + Web), respects user broadcasts preference
    if user_ids:
        asyncio.create_task(_send_push(
            db, user_ids,
            title=body.title,
            body=body.body,
            url=deep_url,
            data={"type": "admin_broadcast", "url": deep_url, "image": body.image or None},
            pref_key="broadcasts",
            image=body.image or None,
        ))
    return {"sent": len(docs), "target": body.target, "url": deep_url, "image": body.image or None,
            "push_devices": await db.push_tokens.count_documents({"user_id": {"$in": user_ids}}) if user_ids else 0}


@admin_router.post("/notifications/test")
async def admin_notification_test(user: dict = Depends(require_admin)):
    """Send a quick test notification (in-app + push) to the calling admin so
    they can verify the full pipeline (DB insert → Expo Push → Web Push) end
    to end without spamming users."""
    title = "🔔 إشعار تجريبي من لوحة الأدمن"
    body = "إذا وصلك هذا الإشعار، فإن نظام الإشعارات يعمل بشكل سليم ✅"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": title,
        "body": body,
        "type": "admin_test",
        "read": False,
        "ts": now,
        "created_at": now,
    }
    await db.notifications.insert_one(doc)
    push_result = {}
    try:
        push_result = await _send_push(
            db, [user["id"]],
            title=title,
            body=body,
            url="/admin",
            data={"type": "admin_test"},
            pref_key=None,  # ignore prefs for test
        ) or {}
    except Exception as e:
        push_result = {"error": str(e)}
    return {"sent": True, "notification_id": doc["id"], "push": push_result}

@admin_router.get("/notifications/ai-suggest")
async def ai_suggest_notifications():
    """Use Gemini to suggest 3 engaging push notifications based on app activity."""
    if not EMERGENT_LLM_KEY:
        return {"suggestions": []}
    # Compute simple stats
    total_users = await db.users.count_documents({})
    new_listings_24h = await db.listings.count_documents({
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()}
    })
    active_auctions = await db.listings.count_documents({"category": "auctions", "status": "active"})

    try:
        from llm_shim import LlmChat, UserMessage
        chat = LlmChat(            api_key=EMERGENT_LLM_KEY,
            session_id=f"notif-{uuid.uuid4().hex[:8]}",
            system_message=(
                "أنت مدير تسويق لتطبيق إعلانات مبوبة عربي اسمه 'الحراج بلس'. "
                "اقترح 3 إشعارات Push قصيرة وجذابة (عنوان + نص قصير، 60 حرف للعنوان و120 للنص) "
                "بناءً على الإحصائيات. الإشعارات يجب أن تكون عربية وتحفّز فتح التطبيق. "
                "أرجع JSON فقط بشكل: [{\"title\":\"...\",\"body\":\"...\"},...]"
            ),
        ).with_model("gemini", "gemini-2.5-flash")
        prompt = f"إحصائيات اليوم: {total_users} مستخدم، {new_listings_24h} إعلان جديد آخر 24 ساعة، {active_auctions} مزاد نشط. اقترح 3 إشعارات."
        text = await chat.send_message(UserMessage(text=prompt))
        import re
        import json as _json
        m = re.search(r"\[.*\]", text or "", re.DOTALL)
        if m:
            arr = _json.loads(m.group(0))
            return {"suggestions": arr[:3]}
    except Exception as e:
        logger.error(f"[AI notif suggest] {e}")
    return {"suggestions": []}


# ============================================================
# User Notifications API
# ============================================================
@api.get("/notifications")
async def my_notifications(user: dict = Depends(get_current_user), limit: int = 50):
    # Some legacy docs use `ts`, newer use `created_at`. Sort by both via aggregation.
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$addFields": {"_when": {"$ifNull": ["$created_at", "$ts"]}}},
        {"$sort": {"_when": -1}},
        {"$limit": limit},
        {"$project": {"_id": 0, "_when": 0}},
    ]
    items = await db.notifications.aggregate(pipeline).to_list(length=limit)
    return items

@api.post("/notifications/{nid}/read")
async def mark_notif_read(nid: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"success": True}

@api.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"success": True}


@api.get("/notifications/unread-count")
async def notifications_unread_count(user: dict = Depends(get_current_user)):
    n = await db.notifications.count_documents({"user_id": user["id"], "read": {"$ne": True}})
    return {"count": int(n)}


# ============================================================
# Smart Notifications — abandoned drafts + abandoned searches
# + scheduled admin broadcasts. Background worker runs every minute.
# ============================================================

class DraftListingIn(BaseModel):
    """Snapshot of an in-progress new listing.
    Frontend POSTs this whenever the user enters Step 2 (or makes meaningful
    edits) so we can nudge them later if they don't actually publish.
    """
    title: Optional[str] = ""
    category: Optional[str] = ""
    city: Optional[str] = ""
    price: Optional[float] = None
    images_count: Optional[int] = 0


@api.post("/users/me/draft-listing")
async def save_draft_listing(body: DraftListingIn, user: dict = Depends(get_current_user)):
    """Upsert the user's current in-progress listing draft."""
    now = datetime.now(timezone.utc).isoformat()
    await db.draft_listings.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"],
            "title": (body.title or "")[:120],
            "category": body.category or "",
            "city": body.city or "",
            "price": body.price,
            "images_count": int(body.images_count or 0),
            "updated_at": now,
            "reminded": False,
        },
         "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return {"ok": True}


@api.delete("/users/me/draft-listing")
async def clear_draft_listing(user: dict = Depends(get_current_user)):
    """Called after a successful publish — removes the draft so we don't nudge."""
    await db.draft_listings.delete_one({"user_id": user["id"]})
    return {"ok": True}


class SearchEventIn(BaseModel):
    """Snapshot of a meaningful search the user just performed."""
    query: str = Field(default="", max_length=200)
    category: Optional[str] = ""
    city: Optional[str] = ""
    results_count: Optional[int] = 0


@api.post("/users/me/search-event")
async def save_search_event(body: SearchEventIn, user: dict = Depends(get_current_user)):
    """Record the user's latest search so we can re-engage them if they bounce.
    Only stores ONE row per user (we always upsert) — we only care about the
    *last* search, not the full history.
    """
    if not body.query.strip() and not body.category:
        return {"ok": True, "skipped": True}
    now = datetime.now(timezone.utc).isoformat()
    await db.search_events.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"],
            "query": body.query.strip()[:200],
            "category": body.category or "",
            "city": body.city or "",
            "results_count": int(body.results_count or 0),
            "updated_at": now,
            "reminded": False,
        }, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return {"ok": True}


# ----- Admin: scheduled broadcasts -----
class ScheduleBroadcastIn(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    body: str = Field(min_length=2, max_length=500)
    send_at: str  # ISO-8601 UTC timestamp
    target: str = Field(default="all", pattern="^(all|verified|unverified|country|category|inactive)$")
    country_code: Optional[str] = None
    category: Optional[str] = None
    inactive_days: Optional[int] = None
    url: Optional[str] = "/"


@admin_router.post("/notifications/schedule")
async def create_scheduled_broadcast(body: ScheduleBroadcastIn):
    try:
        send_at_dt = datetime.fromisoformat(body.send_at.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(400, "send_at must be ISO-8601 datetime")
    if send_at_dt <= datetime.now(timezone.utc):
        raise HTTPException(400, "send_at must be in the future")
    doc = {
        "id": str(uuid.uuid4()),
        "title": body.title,
        "body": body.body,
        "send_at": send_at_dt.isoformat(),
        "target": body.target,
        "country_code": body.country_code,
        "category": body.category,
        "inactive_days": body.inactive_days,
        "url": body.url or "/",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.scheduled_broadcasts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.get("/geo/overrides")
async def list_geo_overrides():
    docs = await db.geo_overrides.find({}, {"_id": 0}).to_list(length=50)
    return docs


class AddCityIn(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    name_ar: str = Field(min_length=2, max_length=80)
    name_en: Optional[str] = ""
    districts: List[str] = []


@admin_router.post("/geo/cities/add")
async def admin_add_city(body: AddCityIn):
    cc = body.country_code.upper()
    await db.geo_overrides.update_one(
        {"country_code": cc},
        {"$push": {"add_cities": {
            "name_ar": body.name_ar.strip(),
            "name_en": (body.name_en or "").strip(),
            "districts": list(body.districts or []),
        }},
         "$setOnInsert": {"country_code": cc}},
        upsert=True,
    )
    return {"ok": True}


class RemoveCityIn(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    name_ar: str = Field(min_length=1, max_length=80)


@admin_router.post("/geo/cities/remove")
async def admin_remove_city(body: RemoveCityIn):
    cc = body.country_code.upper()
    await db.geo_overrides.update_one(
        {"country_code": cc},
        {"$addToSet": {"remove_cities": body.name_ar.strip()},
         "$setOnInsert": {"country_code": cc}},
        upsert=True,
    )
    return {"ok": True}


class DistrictsIn(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    city_name_ar: str = Field(min_length=1, max_length=80)
    add: List[str] = []
    remove: List[str] = []


@admin_router.post("/geo/districts/update")
async def admin_update_districts(body: DistrictsIn):
    cc = body.country_code.upper()
    key = f"districts.{body.city_name_ar}"
    setters = {}
    if body.add:
        setters[f"{key}.add"] = list(set([x.strip() for x in body.add if x.strip()]))
    if body.remove:
        setters[f"{key}.remove"] = list(set([x.strip() for x in body.remove if x.strip()]))
    if not setters:
        return {"ok": True, "skipped": True}
    await db.geo_overrides.update_one(
        {"country_code": cc},
        {"$set": setters, "$setOnInsert": {"country_code": cc}},
        upsert=True,
    )
    return {"ok": True}


@admin_router.get("/notifications/schedule")
async def list_scheduled_broadcasts(status: str = "pending"):
    q: dict = {} if status == "all" else {"status": status}
    items = await db.scheduled_broadcasts.find(q, {"_id": 0}).sort("send_at", 1).to_list(length=200)
    return items


@admin_router.delete("/notifications/schedule/{sid}")
async def cancel_scheduled_broadcast(sid: str):
    res = await db.scheduled_broadcasts.update_one(
        {"id": sid, "status": "pending"},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Not found or already sent")
    return {"ok": True}


async def _send_user_notification(user_id: str, title: str, body: str, ntype: str, url: str, extra_data: Optional[dict] = None, pref_key: Optional[str] = None):
    """Internal helper: persist to db.notifications + push to devices.
    Used by the smart-notifications worker.
    """
    now = datetime.now(timezone.utc).isoformat()
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id,
        "title": title, "body": body, "type": ntype,
        "url": url, "data": extra_data or {},
        "read": False, "ts": now, "created_at": now,
    })
    try:
        await _send_push(
            db, [user_id], title=title, body=body, url=url,
            data={"type": ntype, **(extra_data or {})},
            pref_key=pref_key,
        )
    except Exception as e:
        logger.warning(f"[smart-notif] push failed for {user_id}: {e}")


async def _process_abandoned_drafts(now_iso: str, cutoff_iso: str) -> int:
    """Find users who started a listing but didn't publish within ~10 minutes,
    and nudge them ONCE. We mark them as reminded so we don't spam.
    """
    sent = 0
    cursor = db.draft_listings.find({
        "reminded": False,
        "updated_at": {"$lt": cutoff_iso},
    })
    async for d in cursor:
        uid = d.get("user_id")
        if not uid:
            continue
        # If a real listing was published since, skip + clear draft.
        recent = await db.listings.count_documents({
            "user_id": uid,
            "created_at": {"$gte": d.get("created_at") or d.get("updated_at")},
        })
        if recent > 0:
            await db.draft_listings.delete_one({"_id": d["_id"]})
            continue
        title_hint = (d.get("title") or "").strip()
        body_text = (
            f"إعلانك «{title_hint}» في انتظارك — أكمله الآن لتظهر للمشترين 🚀"
            if title_hint else
            "بدأت نشر إعلان ولم تكمله — أكمله الآن ليصل لآلاف المشترين 🚀"
        )
        await _send_user_notification(
            user_id=uid,
            title="📝 أكمل إعلانك الآن",
            body=body_text,
            ntype="abandoned_draft",
            url="/post",
            extra_data={"deep_link": "post", "draft_title": title_hint},
            pref_key="broadcasts",
        )
        await db.draft_listings.update_one(
            {"_id": d["_id"]},
            {"$set": {"reminded": True, "reminded_at": now_iso}},
        )
        sent += 1
    return sent


async def _process_abandoned_searches(now_iso: str, cutoff_iso: str) -> int:
    """Re-engage users who searched recently and bounced.
    We only nudge if the search appears to have failed (low results) OR if
    they haven't returned within ~30 minutes.
    """
    sent = 0
    cursor = db.search_events.find({
        "reminded": False,
        "updated_at": {"$lt": cutoff_iso},
    })
    async for s in cursor:
        uid = s.get("user_id")
        if not uid:
            continue
        # Skip if user has been active since the search (last_seen newer)
        u = await db.users.find_one({"id": uid}, {"_id": 0, "last_seen": 1})
        if u and u.get("last_seen") and u["last_seen"] > s.get("updated_at", ""):
            await db.search_events.update_one({"_id": s["_id"]}, {"$set": {"reminded": True}})
            continue
        q = (s.get("query") or "").strip()
        cat = s.get("category") or ""
        if q:
            title = f"🔎 لقد بحثت عن «{q}»"
            body_text = "يوجد لدينا الكثير من الإعلانات — حاول مرة أخرى وقد تجد أفضل صفقة لك إن شاء الله 🛍️"
            deep_url = f"/search?q={q}"
        elif cat:
            title = f"🛍️ إعلانات جديدة في «{cat}»"
            body_text = "تصفّح أحدث الإعلانات في الفئة التي تهمّك — قد تجد ما تبحث عنه بأفضل سعر."
            deep_url = f"/c/{cat}"
        else:
            await db.search_events.update_one({"_id": s["_id"]}, {"$set": {"reminded": True}})
            continue
        await _send_user_notification(
            user_id=uid, title=title, body=body_text,
            ntype="abandoned_search", url=deep_url,
            extra_data={"deep_link": "search", "query": q, "category": cat},
            pref_key="broadcasts",
        )
        await db.search_events.update_one(
            {"_id": s["_id"]},
            {"$set": {"reminded": True, "reminded_at": now_iso}},
        )
        sent += 1
    return sent


async def _process_due_schedules(now_iso: str) -> int:
    """Send any admin-scheduled broadcasts whose send_at has passed."""
    sent = 0
    cursor = db.scheduled_broadcasts.find({
        "status": "pending",
        "send_at": {"$lte": now_iso},
    })
    async for sch in cursor:
        # Build the audience using same rules as the live broadcast endpoint.
        target = sch.get("target") or "all"
        q: dict = {"banned": {"$ne": True}}
        if target == "verified":
            q["verified"] = True
        elif target == "unverified":
            q["verified"] = {"$ne": True}
        elif target == "country" and sch.get("country_code"):
            q["country_code"] = sch["country_code"]
        elif target == "category" and sch.get("category"):
            followers = await db.category_follows.distinct("user_id", {"category": sch["category"]})
            posters = await db.listings.distinct("user_id", {"category": sch["category"]})
            ids = list({*(followers or []), *(posters or [])})
            if not ids:
                await db.scheduled_broadcasts.update_one(
                    {"_id": sch["_id"]},
                    {"$set": {"status": "sent", "sent_at": now_iso, "recipients": 0}},
                )
                continue
            q["id"] = {"$in": ids}
        elif target == "inactive":
            days = max(1, int(sch.get("inactive_days") or 14))
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
            q["$or"] = [
                {"last_seen": {"$lt": cutoff}},
                {"last_seen": None},
                {"last_seen": {"$exists": False}},
            ]
        user_ids = [u["id"] async for u in db.users.find(q, {"_id": 0, "id": 1})]
        docs = [{
            "id": str(uuid.uuid4()), "user_id": uid,
            "title": sch["title"], "body": sch["body"],
            "type": "admin_scheduled", "url": sch.get("url") or "/",
            "read": False, "ts": now_iso, "created_at": now_iso,
        } for uid in user_ids]
        if docs:
            await db.notifications.insert_many(docs)
        if user_ids:
            try:
                await _send_push(
                    db, user_ids, title=sch["title"], body=sch["body"],
                    url=sch.get("url") or "/",
                    data={"type": "admin_scheduled", "schedule_id": sch["id"]},
                    pref_key="broadcasts",
                )
            except Exception as e:
                logger.warning(f"[smart-notif] scheduled push failed: {e}")
        await db.scheduled_broadcasts.update_one(
            {"_id": sch["_id"]},
            {"$set": {"status": "sent", "sent_at": now_iso, "recipients": len(user_ids)}},
        )
        sent += len(user_ids)
    return sent


_SMART_NOTIF_TASK: Optional[asyncio.Task] = None
_MEDIA_CLEANUP_TASK: Optional[asyncio.Task] = None


async def _process_viewed_no_action(now_iso: str, cutoff_iso: str) -> int:
    """Users who viewed a listing >24h ago but never messaged the seller, favorited,
    or returned. We send ONE "still interested?" nudge per (user, listing)."""
    sent = 0
    cursor = db.recently_viewed.find({
        "ts": {"$lte": cutoff_iso},
        "reminded": {"$ne": True},
    }).limit(50)
    async for rv in cursor:
        try:
            uid = rv.get("user_id"); lid = rv.get("listing_id")
            if not uid or not lid:
                await db.recently_viewed.update_one({"_id": rv["_id"]}, {"$set": {"reminded": True}})
                continue
            # Skip if user already messaged about this listing or favorited it.
            already = await db.messages.find_one({"from_user": uid, "listing_id": lid})
            if not already:
                already = await db.favorites.find_one({"user_id": uid, "listing_id": lid})
            if already:
                await db.recently_viewed.update_one({"_id": rv["_id"]}, {"$set": {"reminded": True}})
                continue
            listing = await db.listings.find_one({"id": lid, "status": "active"}, {"_id": 0, "title": 1, "price": 1, "currency": 1})
            if not listing:
                await db.recently_viewed.update_one({"_id": rv["_id"]}, {"$set": {"reminded": True}})
                continue
            await _send_user_notification(
                user_id=uid,
                title="هل لا زلت مهتماً؟",
                body=f"إعلان «{(listing.get('title') or '')[:50]}» ينتظرك — اضغط لإعادة فتحه.",
                ntype="viewed_no_action",
                url=f"/listing/{lid}",
                extra_data={"deep_link": f"listing/{lid}", "listing_id": lid},
                pref_key="broadcasts",
            )
            await db.recently_viewed.update_one({"_id": rv["_id"]}, {"$set": {"reminded": True}})
            sent += 1
        except Exception as e:
            logger.warning(f"[smart-notif] viewed-no-action skip: {e}")
    return sent


async def _process_inactive_users(now_iso: str, cutoff_iso: str) -> int:
    """Users whose last activity is >14 days ago — we re-engage them once."""
    sent = 0
    cursor = db.users.find({
        "last_seen": {"$lte": cutoff_iso},
        "reengaged_at": {"$exists": False},
        "notifications_enabled": {"$ne": False},
    }, {"_id": 0, "id": 1, "name": 1}).limit(30)
    async for u in cursor:
        try:
            uid = u["id"]
            await _send_user_notification(
                user_id=uid,
                title="اشتقنا لك 👋",
                body="إعلانات جديدة وصفقات في بلدك بانتظارك — افتح الحراج بلس الآن.",
                ntype="reengage",
                url="/",
                extra_data={"deep_link": ""},
                pref_key="broadcasts",
            )
            await db.users.update_one({"id": uid}, {"$set": {"reengaged_at": now_iso}})
            sent += 1
        except Exception as e:
            logger.warning(f"[smart-notif] inactive-user skip: {e}")
    return sent


async def _smart_notifications_worker():
    """Background loop. Runs every 60 seconds.
    - Sends abandoned-draft reminders (>10 min idle, never reminded).
    - Sends abandoned-search reminders (>30 min idle, never reminded).
    - Sends viewed-no-action reminders (>24h, no follow-up).
    - Sends re-engagement notifications to inactive users (>14 days).
    - Fires admin-scheduled broadcasts whose time has come.
    """
    DRAFT_DELAY_MIN = 10
    SEARCH_DELAY_MIN = 30
    VIEW_DELAY_HOURS = 24
    INACTIVE_DAYS = 14
    INTERVAL_S = 60
    logger.info("[smart-notif] worker starting (every 60s)")
    while True:
        try:
            now = datetime.now(timezone.utc)
            now_iso = now.isoformat()
            d_cutoff = (now - timedelta(minutes=DRAFT_DELAY_MIN)).isoformat()
            s_cutoff = (now - timedelta(minutes=SEARCH_DELAY_MIN)).isoformat()
            v_cutoff = (now - timedelta(hours=VIEW_DELAY_HOURS)).isoformat()
            i_cutoff = (now - timedelta(days=INACTIVE_DAYS)).isoformat()
            d = await _process_abandoned_drafts(now_iso, d_cutoff)
            s = await _process_abandoned_searches(now_iso, s_cutoff)
            v = await _process_viewed_no_action(now_iso, v_cutoff)
            i = await _process_inactive_users(now_iso, i_cutoff)
            sch = await _process_due_schedules(now_iso)
            if d or s or v or i or sch:
                logger.info(f"[smart-notif] sent drafts={d} searches={s} viewed={v} reengage={i} scheduled={sch}")
        except Exception as e:
            logger.error(f"[smart-notif] worker error: {e}")
        await asyncio.sleep(INTERVAL_S)


# ============================================================
# Email verification (on registration)
# ============================================================
async def send_verification_email(to_email: str, verify_url: str, name: str = "") -> bool:
    if not RESEND_API_KEY:
        return False
    html = f"""
    <div style="font-family:Arial,Tahoma,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#0F1A35;direction:rtl">
      <div style="text-align:center;padding:20px 0;border-bottom:2px solid #4FB6E6">
        <h1 style="color:#0F1A35;font-size:28px;margin:0">الحراج <span style="color:#4FB6E6">بلس</span></h1>
      </div>
      <h2 style="color:#0F1A35;font-size:20px">مرحباً {name or 'عزيزي'} 👋</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7">
        شكراً لتسجيلك في الحراج بلس! اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.
      </p>
      <div style="text-align:center;padding:24px 0">
        <a href="{verify_url}" style="background:#4FB6E6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;font-size:14px;display:inline-block">تأكيد البريد الإلكتروني</a>
      </div>
      <p style="color:#94A3B8;font-size:12px;line-height:1.7">
        أو انسخ الرابط: <span style="color:#4FB6E6;word-break:break-all">{verify_url}</span><br>
        إذا لم تسجل في الحراج بلس، تجاهل هذا البريد.
      </p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
      <p style="color:#94A3B8;font-size:11px;text-align:center">© 2026 الحراج بلس - alhraj.online</p>
    </div>
    """
    params = {"from": SENDER_EMAIL, "to": [to_email], "subject": "أهلاً بك في الحراج بلس - تأكيد البريد", "html": html}
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        logger.error(f"[Resend verify] {e}")
        return False


@api.get("/auth/verify-email")
async def verify_email(token: str, request: Request):
    rec = await db.email_verify_tokens.find_one({"token": token})
    if not rec:
        raise HTTPException(400, "رابط غير صالح")
    expires_at = rec.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "انتهت صلاحية الرابط")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"email_verified": True}})
    await db.email_verify_tokens.delete_one({"token": token})
    return {"success": True, "message": "تم تأكيد البريد بنجاح"}


@api.post("/auth/resend-verification")
async def resend_verification(request: Request, user: dict = Depends(get_current_user)):
    if user.get("email_verified"):
        return {"already_verified": True}
    token = secrets.token_urlsafe(32)
    await db.email_verify_tokens.insert_one({
        "token": token, "user_id": user["id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
        "created_at": datetime.now(timezone.utc),
    })
    origin = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
    verify_url = f"{origin}/verify-email?token={token}"
    sent = await send_verification_email(user["email"], verify_url, user.get("name", ""))
    return {"sent": sent}


# ============================================================
# Watch Listings (Price Alerts)
# ============================================================
class WatchIn(BaseModel):
    listing_id: str
    target_price: Optional[float] = None  # alert when price drops at or below

@api.post("/watches")
async def add_watch(body: WatchIn, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": body.listing_id}, {"_id": 0, "id": 1, "price": 1, "user_id": 1})
    if not listing:
        raise HTTPException(404, "الإعلان غير موجود")
    if listing["user_id"] == user["id"]:
        raise HTTPException(400, "لا يمكنك متابعة إعلانك")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "listing_id": body.listing_id,
        "target_price": body.target_price,
        "last_price": listing.get("price"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "active": True,
    }
    # upsert
    await db.watches.update_one(
        {"user_id": user["id"], "listing_id": body.listing_id},
        {"$set": doc},
        upsert=True,
    )
    return {"success": True}

@api.delete("/watches/{listing_id}")
async def remove_watch(listing_id: str, user: dict = Depends(get_current_user)):
    await db.watches.delete_one({"user_id": user["id"], "listing_id": listing_id})
    return {"success": True}

@api.get("/watches")
async def my_watches(user: dict = Depends(get_current_user)):
    watches = await db.watches.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=200)
    # Enrich with current listing data
    for w in watches:
        listing = await db.listings.find_one({"id": w["listing_id"]}, {"_id": 0, "title": 1, "price": 1, "currency": 1, "images": 1, "city": 1, "status": 1})
        w["listing"] = listing
    return watches


# ============================================================
# Follow Sellers
# ============================================================
@api.post("/sellers/{seller_id}/follow")
async def follow_seller(seller_id: str, user: dict = Depends(get_current_user)):
    if seller_id == user["id"]:
        raise HTTPException(400, "لا يمكنك متابعة نفسك")
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "id": 1})
    if not seller:
        raise HTTPException(404, "البائع غير موجود")
    existing = await db.follows.find_one({"follower_id": user["id"], "seller_id": seller_id})
    if existing:
        await db.follows.delete_one({"follower_id": user["id"], "seller_id": seller_id})
        return {"following": False}
    await db.follows.insert_one({
        "id": str(uuid.uuid4()),
        "follower_id": user["id"],
        "seller_id": seller_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"following": True}

@api.get("/sellers/{seller_id}/follow-status")
async def follow_status(seller_id: str, user: dict = Depends(get_current_user)):
    f = await db.follows.find_one({"follower_id": user["id"], "seller_id": seller_id})
    return {"following": bool(f)}


# ============================================================
# Public seller profile + listings + ratings (used by mobile + web)
# ============================================================
@api.get("/sellers/{seller_id}")
async def get_seller_profile(seller_id: str):
    """Public seller profile (safe fields only)."""
    s = await db.users.find_one(
        {"id": seller_id},
        {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "bio": 1, "verified": 1,
         "trust_score": 1, "city": 1, "country_code": 1, "created_at": 1}
    )
    if not s:
        raise HTTPException(404, "Seller not found")
    # Aggregate rating stats
    pipeline = [
        {"$match": {"seller_id": seller_id}},
        {"$group": {"_id": "$seller_id", "avg": {"$avg": "$stars"}, "count": {"$sum": 1}}},
    ]
    agg = await db.ratings.aggregate(pipeline).to_list(length=1)
    if agg:
        s["rating_avg"] = round(agg[0]["avg"], 1)
        s["rating_count"] = agg[0]["count"]
    else:
        s["rating_avg"] = 0
        s["rating_count"] = 0
    s["followers"] = await db.follows.count_documents({"seller_id": seller_id})
    return s


@api.get("/sellers/{seller_id}/listings")
async def get_seller_listings(seller_id: str, limit: int = 20, skip: int = 0):
    limit = max(1, min(limit, 20))
    cursor = db.listings.find(
        {"user_id": seller_id, "status": "active"},
        {"_id": 0, "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
         "category": 1, "city": 1, "images": {"$slice": 1}, "created_at": 1, "views": 1}
    ).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.listings.count_documents({"user_id": seller_id, "status": "active"})
    return {"items": items, "total": total}


@api.get("/sellers/{seller_id}/ratings")
async def get_seller_ratings(seller_id: str, limit: int = 20):
    limit = max(1, min(limit, 20))
    ratings = await db.ratings.find(
        {"seller_id": seller_id}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    # Hydrate author names
    author_ids = list({r.get("author_id") for r in ratings if r.get("author_id")})
    authors = {}
    if author_ids:
        async for u in db.users.find({"id": {"$in": author_ids}}, {"_id": 0, "id": 1, "name": 1, "avatar_url": 1}):
            authors[u["id"]] = u
    for r in ratings:
        r["author"] = authors.get(r.get("author_id"), {"name": "مستخدم"})
    return ratings


class RatingIn(BaseModel):
    stars: int  # 1-5
    comment: str = ""


@api.post("/sellers/{seller_id}/ratings")
async def rate_seller(seller_id: str, body: RatingIn, user: dict = Depends(get_current_user)):
    if seller_id == user["id"]:
        raise HTTPException(400, "لا يمكنك تقييم نفسك")
    if not (1 <= body.stars <= 5):
        raise HTTPException(400, "stars must be between 1 and 5")
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "id": 1})
    if not seller:
        raise HTTPException(404, "Seller not found")
    # Requires at least one chat or one completed listing interaction (basic anti-spam).
    has_chat = await db.chat_messages.find_one({"$or": [
        {"from_user": user["id"], "to_user": seller_id},
        {"from_user": seller_id, "to_user": user["id"]},
    ]})
    if not has_chat:
        raise HTTPException(403, "يجب التعامل مع البائع أولاً قبل التقييم")
    now = datetime.now(timezone.utc).isoformat()
    # Upsert — one rating per (author, seller) pair, latest wins
    await db.ratings.update_one(
        {"author_id": user["id"], "seller_id": seller_id},
        {"$set": {"stars": body.stars, "comment": body.comment[:500], "updated_at": now},
         "$setOnInsert": {"id": str(uuid.uuid4()), "author_id": user["id"],
                          "seller_id": seller_id, "created_at": now}},
        upsert=True,
    )
    return {"success": True}


# ============================================================
# Search Suggestions: Trending + User History
# ============================================================
class SearchLogIn(BaseModel):
    query: str


@api.post("/search/log")
async def log_search(body: SearchLogIn, request: Request):
    """Log a search. Increments global counter; if logged-in user, also adds to history."""
    q = (body.query or "").strip()
    if not q or len(q) > 100:
        return {"ok": True}
    now = datetime.now(timezone.utc).isoformat()
    # global counter
    await db.search_terms.update_one(
        {"q_lower": q.lower()},
        {"$inc": {"count": 1}, "$set": {"last_seen": now, "q": q}},
        upsert=True,
    )
    # personal history (if authed)
    user = await _get_user_from_cookie(request)
    if user:
        await db.search_history.update_one(
            {"user_id": user["id"], "q_lower": q.lower()},
            {"$set": {"q": q, "ts": now, "user_id": user["id"], "q_lower": q.lower()}},
            upsert=True,
        )
        # Trim to last 20 per user
        cur = db.search_history.find({"user_id": user["id"]}, {"_id": 0, "q_lower": 1, "ts": 1}).sort("ts", -1)
        all_items = await cur.to_list(length=200)
        if len(all_items) > 20:
            old_lowers = [it["q_lower"] for it in all_items[20:]]
            await db.search_history.delete_many({"user_id": user["id"], "q_lower": {"$in": old_lowers}})
    return {"ok": True}


@api.get("/search/trending")
async def trending_searches(limit: int = 10):
    items = await db.search_terms.find(
        {}, {"_id": 0, "q": 1, "count": 1}
    ).sort("count", -1).limit(max(1, min(limit, 30))).to_list(length=30)
    return [{"query": it["q"], "count": it.get("count", 0)} for it in items]


@api.get("/search/suggest")
async def search_suggest(q: str, country_code: Optional[str] = None, limit: int = 8):
    """Autocomplete suggestions from active listing titles (Arabic-normalized)."""
    if not q or not q.strip():
        return {"items": []}
    items = await _search_suggest_engine(db, q.strip(), country_code, limit=max(1, min(limit, 20)))
    return {"items": items}


@api.get("/search/history")
async def search_history(request: Request, limit: int = 10):
    user = await _get_user_from_cookie(request)
    if not user:
        return []
    items = await db.search_history.find(
        {"user_id": user["id"]}, {"_id": 0, "q": 1, "ts": 1, "q_lower": 1}
    ).sort("ts", -1).limit(max(1, min(limit, 50))).to_list(length=50)
    return [{"query": it["q"], "ts": it["ts"], "id": it["q_lower"]} for it in items]


class SearchHistoryDeleteIn(BaseModel):
    query: Optional[str] = None  # if None, clear all
    all: Optional[bool] = False


@api.delete("/search/history")
async def delete_search_history(body: SearchHistoryDeleteIn, user: dict = Depends(get_current_user)):
    if body.all or body.query is None:
        await db.search_history.delete_many({"user_id": user["id"]})
        return {"ok": True, "cleared": "all"}
    await db.search_history.delete_one({"user_id": user["id"], "q_lower": body.query.lower()})
    return {"ok": True, "cleared": body.query}


# Helper: get user from cookie or None (no exception)
async def _get_user_from_cookie(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            return None
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        u = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
        return u
    except Exception:
        return None


# ============================================================
# Mount routers (MUST be after ALL endpoint definitions)
# ============================================================
api.include_router(admin_router)


# Admin digest test endpoint (placed after admin_router to access require_admin)
@api.post("/admin/digest/test")
async def admin_test_digest(user: dict = Depends(require_admin)):
    ok = await send_daily_digest_to(user["id"])
    return {"sent": ok}


@api.delete("/admin/demo-listings")
async def admin_delete_demo_listings(user: dict = Depends(require_admin)):
    """Bulk-remove all listings flagged `is_demo: true`. Demo seller is preserved."""
    res = await db.listings.delete_many({"is_demo": True})
    return {"deleted": res.deleted_count}


# ============================================================
# SEO: Dynamic Sitemap.xml + Robots.txt + Bot prerender
# In Emergent preview, only /api/* routes hit backend; in production (Firebase/Cloudflare),
# we use rewrites to expose /sitemap.xml → /api/sitemap.xml at the root URL.
# ============================================================


async def _build_sitemap_xml() -> str:
    site = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    static_pages = [
        ("", 1.0, "daily"),
        ("/auctions", 0.9, "daily"),
        ("/deals", 0.9, "daily"),
        ("/reels", 0.8, "daily"),
        ("/flights", 0.7, "weekly"),
        ("/about", 0.5, "monthly"),
        ("/terms", 0.4, "monthly"),
        ("/privacy", 0.4, "monthly"),
        ("/contact", 0.4, "monthly"),
    ]
    cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    listings = await db.listings.find(
        {"status": "active", "created_at": {"$gte": cutoff}},
        {"_id": 0, "id": 1, "slug": 1, "title": 1, "updated_at": 1, "created_at": 1, "images": 1}
    ).sort("created_at", -1).limit(50000).to_list(length=50000)

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for path, prio, freq in static_pages:
        parts.append(f"<url><loc>{site}{path}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>")
    LANGS = ["ar", "en", "hi", "ur", "bn", "fr"]
    for l in listings:
        lastmod = (l.get("updated_at") or l.get("created_at") or "").split("T")[0] or ""
        img = (l.get("images") or [None])[0]
        title_safe = (l.get("title", "") or "").replace("]]>", "")
        img_part = f"<image:image><image:loc>{img}</image:loc><image:title><![CDATA[{title_safe}]]></image:title></image:image>" if img else ""
        # Prefer SEO slug; fall back to id for older listings
        ref = l.get("slug") or l["id"]
        loc = f"{site}/listing/{ref}"
        # hreflang alternates so Google can serve the right language version
        alt = "".join(f'<xhtml:link rel="alternate" hreflang="{lng}" href="{loc}?lang={lng}"/>' for lng in LANGS)
        alt += f'<xhtml:link rel="alternate" hreflang="x-default" href="{loc}"/>'
        parts.append(
            f"<url><loc>{loc}</loc>"
            + (f"<lastmod>{lastmod}</lastmod>" if lastmod else "")
            + "<changefreq>weekly</changefreq><priority>0.7</priority>"
            + alt + img_part + "</url>"
        )
    parts.append('</urlset>')
    return "\n".join(parts)


async def _build_robots_txt() -> str:
    site = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    DEFAULT = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /api/\n"
        "\n"
        "# AI agents — allow them to crawl listings for AI search results\n"
        "User-agent: GPTBot\nAllow: /\n"
        "User-agent: ClaudeBot\nAllow: /\n"
        "User-agent: PerplexityBot\nAllow: /\n"
        "User-agent: Google-Extended\nAllow: /\n"
        "User-agent: anthropic-ai\nAllow: /\n"
        "User-agent: Applebot-Extended\nAllow: /\n"
        "\n"
        f"Sitemap: {site}/sitemap.xml\n"
    )
    rec = await db.settings.find_one({"_key": "seo"}, {"_id": 0, "value": 1})
    if rec and rec.get("value", {}).get("robots_txt"):
        custom = rec["value"]["robots_txt"]
        # Only honor if custom is comprehensive (has Disallow + AI bots)
        if "Disallow" in custom and "GPTBot" in custom:
            return custom
    return DEFAULT


# Both /api/sitemap.xml and /sitemap.xml work (frontend rewrites for the latter in production)
# In-memory cache (1 hour TTL) so we don't rebuild XML on every crawler hit.
_SITEMAP_CACHE = {"xml": None, "ts": 0.0}
_SITEMAP_TTL_SECONDS = 3600


async def _cached_sitemap_xml() -> str:
    import time as _t
    now = _t.time()
    if _SITEMAP_CACHE["xml"] and (now - _SITEMAP_CACHE["ts"]) < _SITEMAP_TTL_SECONDS:
        return _SITEMAP_CACHE["xml"]
    xml = await _build_sitemap_xml()
    _SITEMAP_CACHE["xml"] = xml
    _SITEMAP_CACHE["ts"] = now
    return xml


def _sitemap_cache_invalidate():
    """Force sitemap rebuild on next request. Called from listing create/update/delete
    so search engines always see fresh inventory within seconds."""
    _SITEMAP_CACHE["xml"] = None
    _SITEMAP_CACHE["ts"] = 0.0


@api.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml_api():
    xml = await _cached_sitemap_xml()
    return Response(content=xml, media_type="application/xml", headers={"Cache-Control": "public, max-age=3600"})


@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml_root():
    xml = await _cached_sitemap_xml()
    return Response(content=xml, media_type="application/xml", headers={"Cache-Control": "public, max-age=3600"})


# ============================================================
# IndexNow — instant search-engine submission (Bing, Yandex, Seznam, Naver)
# ============================================================
@app.get("/{key}.txt", include_in_schema=False)
async def indexnow_key_file(key: str):
    """
    IndexNow ownership verification.
    Search engines fetch https://alhraj.online/{KEY}.txt — we return the key
    only if it matches the one we registered. Anything else returns 404.
    """
    # Special case: this catch-all otherwise shadows /robots.txt
    if key.lower() == "robots":
        text = await _build_robots_txt()
        return PlainTextResponse(text)
    if not key or len(key) < 8 or not all(c in "0123456789abcdef" for c in key.lower()):
        raise HTTPException(404, "Not Found")
    our_key = await _get_indexnow_key(db)
    if key.lower() != our_key.lower():
        raise HTTPException(404, "Not Found")
    return PlainTextResponse(our_key)


@api.get("/seo/indexnow/key", include_in_schema=False)
async def seo_indexnow_key_view(user: dict = Depends(require_admin)):
    """Admin: view IndexNow key + verification URL (for manual checks)."""
    key = await _get_indexnow_key(db)
    fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
    return {"key": key, "verification_url": f"{fe}/{key}.txt"}


@api.post("/seo/indexnow/resubmit-all", include_in_schema=False)
async def seo_resubmit_all_listings(user: dict = Depends(require_admin)):
    """Admin: bulk re-submit all active listings to IndexNow (use sparingly)."""
    from seo_submitter import submit_urls as _submit_urls
    fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
    from urllib.parse import urlparse as _up
    host = _up(fe).hostname or "alhraj.online"
    urls: List[str] = []
    cursor = db.listings.find({"status": "active"}, {"_id": 0, "id": 1}).limit(10000)
    async for it in cursor:
        urls.append(f"{fe}/listing/{it['id']}")
    # Also include sitemap + top static pages so engines re-crawl them
    urls.extend([f"{fe}/", f"{fe}/sitemap.xml"])
    res = await _submit_urls(db, urls, host)
    # Best-effort Google sitemap ping
    await _ping_google_sitemap(f"{fe}/sitemap.xml")
    return {"total": len(urls), "indexnow": res}


@api.get("/robots.txt", include_in_schema=False)
async def robots_txt_api():
    text = await _build_robots_txt()
    return PlainTextResponse(text)


@app.get("/robots.txt", include_in_schema=False)
async def robots_txt_root():
    text = await _build_robots_txt()
    return PlainTextResponse(text)


# Bot User-Agents that don't render JS — serve HTML stub with full meta tags
BOT_UAS = re.compile(
    r"(googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|"
    r"linkedinbot|whatsapp|telegrambot|slackbot|discordbot|gptbot|claudebot|"
    r"perplexitybot|chatgpt|anthropic|google-extended|bytespider|applebot)",
    re.IGNORECASE,
)


@api.get("/seo/listing/{listing_id}", include_in_schema=False)
async def seo_listing_html(listing_id: str):
    """Pre-rendered HTML for crawlers. Frontend can also call this to get meta tags."""
    listing = await db.listings.find_one({"id": listing_id, "status": "active"}, {"_id": 0, "password_hash": 0})
    if not listing:
        return HTMLResponse("<h1>Listing not found</h1>", status_code=404)
    site = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    title = (listing.get("title") or "")[:200]
    desc = (listing.get("description") or listing.get("title") or "")[:300]
    price = listing.get("price") or 0
    currency = listing.get("currency") or "ر.س"
    image = (listing.get("images") or [f"{site}/og-image.png"])[0]
    keywords = ", ".join({title, listing.get("category", ""), listing.get("city", ""), "حراج", "بيع", "شراء"})
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title,
        "description": desc,
        "image": listing.get("images") or [image],
        "url": f"{site}/listing/{listing_id}",
        "sku": listing_id,
        "category": listing.get("category"),
        "offers": {
            "@type": "Offer",
            "url": f"{site}/listing/{listing_id}",
            "priceCurrency": listing.get("currency_code") or "SAR",
            "price": float(price) if price else 0,
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "Person", "name": (listing.get("seller") or {}).get("name", "بائع")},
            "areaServed": {"@type": "Place", "name": listing.get("city", "السعودية")},
        },
    }
    import json as _json
    schema_json = _json.dumps(schema, ensure_ascii=False)
    html = f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>{title} - {price} {currency} - الحراج بلس</title>
<meta name="description" content="{desc}" />
<meta name="keywords" content="{keywords}" />
<link rel="canonical" href="{site}/listing/{listing_id}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:image" content="{image}" />
<meta property="og:url" content="{site}/listing/{listing_id}" />
<meta property="og:locale" content="ar_SA" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{image}" />
<script type="application/ld+json">{schema_json}</script>
</head>
<body>
<h1>{title}</h1>
<p><strong>السعر:</strong> {price} {currency}</p>
<p><strong>المدينة:</strong> {listing.get("city", "")}</p>
<p><strong>الفئة:</strong> {listing.get("category", "")}</p>
<p>{desc}</p>
{f'<img src="{image}" alt="{title}" loading="lazy" />' if image else ''}
<p><a href="{site}/listing/{listing_id}">عرض الإعلان كاملاً على الحراج بلس</a></p>
</body>
</html>"""
    return HTMLResponse(html)




# ============================================================
# Wallet / Balance system (internal credits — no real payments yet)
# Used for: boosting listings, premium features. Currency = SAR-equivalent credits.
# ============================================================
class WalletTopupIn(BaseModel):
    amount: float = Field(gt=0)
    note: Optional[str] = None
    target_user_id: Optional[str] = None  # admin-only field

class WalletSpendIn(BaseModel):
    amount: float = Field(gt=0)
    purpose: str
    ref_id: Optional[str] = None  # e.g. listing_id when boosting


async def _wallet_balance(user_id: str) -> float:
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "balance": 1})
    return float((u or {}).get("balance") or 0)


async def _wallet_log(user_id: str, kind: str, amount: float, description: str, ref_id: Optional[str] = None):
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": kind,  # topup | spend | bonus | refund
        "amount": float(amount),
        "currency": "SAR",
        "description": description,
        "ref_id": ref_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


@api.get("/wallet/me")
async def wallet_me(user: dict = Depends(get_current_user)):
    bal = await _wallet_balance(user["id"])
    txs = await db.wallet_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(length=20)
    return {"balance": bal, "currency": "SAR", "transactions": txs}


@api.get("/wallet/transactions")
async def wallet_transactions(limit: int = 50, user: dict = Depends(get_current_user)):
    limit = max(1, min(int(limit or 50), 200))
    txs = await db.wallet_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    return txs


@api.post("/wallet/topup")
async def wallet_topup(body: WalletTopupIn, user: dict = Depends(get_current_user)):
    """Admins can top-up any user (via target_user_id). Non-admins get a 5 SAR welcome bonus only once."""
    is_admin = user.get("role") == "admin"
    target = body.target_user_id if (is_admin and body.target_user_id) else user["id"]
    if not is_admin:
        # Non-admin self-topup is only allowed once as welcome bonus (≤ 5 SAR)
        already = await db.wallet_transactions.find_one({"user_id": user["id"], "type": "bonus"})
        if already:
            raise HTTPException(403, "إعادة الشحن متاحة عبر بوابة الدفع قريباً")
        if body.amount > 5:
            raise HTTPException(400, "الحد الأقصى للمكافأة الترحيبية: 5 ر.س")
        kind = "bonus"
        desc = body.note or "مكافأة الانضمام"
    else:
        kind = "topup"
        desc = body.note or "شحن يدوي من الإدارة"
    await db.users.update_one({"id": target}, {"$inc": {"balance": float(body.amount)}})
    await _wallet_log(target, kind, body.amount, desc)
    new_bal = await _wallet_balance(target)
    return {"success": True, "balance": new_bal}


@api.post("/wallet/claim-welcome-bonus")
async def wallet_claim_welcome_bonus(user: dict = Depends(get_current_user)):
    """Idempotent welcome-bonus endpoint. Backend owns the amount + label so
    clients never hardcode payment numbers. Returns 409 if already claimed."""
    BONUS_AMOUNT = 5.0
    BONUS_LABEL = "مكافأة الانضمام"
    already = await db.wallet_transactions.find_one({"user_id": user["id"], "type": "bonus"})
    if already:
        raise HTTPException(409, "تم استلام مكافأة الانضمام مسبقاً")
    await db.users.update_one({"id": user["id"]}, {"$inc": {"balance": BONUS_AMOUNT}})
    await _wallet_log(user["id"], "bonus", BONUS_AMOUNT, BONUS_LABEL)
    new_bal = await _wallet_balance(user["id"])
    return {"success": True, "balance": new_bal, "amount": BONUS_AMOUNT, "label": BONUS_LABEL}


# ============================================================
# Static pages — single source of truth shared by web + mobile.
# Content mirrors /app/frontend/src/pages/StaticPages.js so both
# platforms display identical text without drift.
# ============================================================
STATIC_PAGES = {
    "terms": {
        "title": "الشروط والأحكام",
        "body": (
            "أهلاً بك في الحراج بلس. باستخدامك هذا التطبيق فإنك توافق على الشروط التالية:\n\n"
            "1. الحراج بلس منصة وسيطة فقط لربط البائعين بالمشترين، ولا نتلقى أي مدفوعات أو نضمن أي صفقة.\n\n"
            "2. يلتزم البائع بصحة المعلومات والصور المعروضة، ويتحمل وحده مسؤولية محتوى إعلانه.\n\n"
            "3. يُمنع نشر أي محتوى مخالف للأنظمة أو الذوق العام، وستُحذف الإعلانات المخالفة فوراً.\n\n"
            "4. ننصح بعقد الصفقات في أماكن عامة آمنة، والتحقق من المنتج قبل الدفع.\n\n"
            "5. تحتفظ إدارة الحراج بلس بحقها في تعليق أو حذف أي حساب يخالف الشروط."
        ),
    },
    "privacy": {
        "title": "سياسة الخصوصية",
        "body": (
            "نحرص على حماية بياناتك. إليك ما نجمعه وكيف نستخدمه:\n\n"
            "• البريد الإلكتروني ورقم الجوال — لإنشاء حسابك والتواصل معك.\n"
            "• الموقع الجغرافي — لعرض الإعلانات القريبة منك (اختياري).\n"
            "• الصور والوسائط — لرفع إعلاناتك فقط.\n"
            "• لا نبيع بياناتك لأي طرف ثالث.\n"
            "• يمكنك طلب حذف حسابك في أي وقت من الإعدادات."
        ),
    },
    "about": {
        "title": "عن الحراج بلس",
        "body": (
            "الحراج بلس هي منصة بيع وشراء عربية حديثة لدول الخليج، مدعومة بالذكاء الاصطناعي "
            "لجعل عملية البيع والشراء أسرع وأذكى وأكثر أماناً.\n\n"
            "نهدف إلى ربط البائعين والمشترين في الخليج العربي عبر تجربة فاخرة وسلسة، مع ميزات حصرية مثل:\n\n"
            "• اقتراح السعر بالذكاء الاصطناعي\n"
            "• عارض صور احترافي وفيديو\n"
            "• شات مباشر بكل الوسائط\n"
            "• خرائط وإعلانات قريبة منك\n"
            "• 5+ لغات لخدمة كل المقيمين\n\n"
            "الإصدار 1.5 — 2026"
        ),
    },
    "contact": {
        "title": "تواصل معنا",
        "body": (
            "للأعمال والإعلان وطلبات الشراكة:\n\n"
            "📧 contact@alhraj.online\n"
            "📧 support@alhraj.online\n"
            "🌐 الموقع: alhraj.online\n\n"
            "💬 آلية التواصل: نرد على رسائلكم خلال 24-48 ساعة."
        ),
    },
}


@api.get("/static-pages/{slug}")
async def get_static_page(slug: str):
    page = STATIC_PAGES.get(slug)
    if not page:
        raise HTTPException(404, "الصفحة غير موجودة")
    return {"slug": slug, "title": page["title"], "body": page["body"]}


@api.post("/wallet/spend")
async def wallet_spend(body: WalletSpendIn, user: dict = Depends(get_current_user)):
    bal = await _wallet_balance(user["id"])
    if bal < body.amount:
        raise HTTPException(402, f"الرصيد غير كافٍ. رصيدك الحالي: {bal} ر.س")
    await db.users.update_one({"id": user["id"]}, {"$inc": {"balance": -float(body.amount)}})
    await _wallet_log(user["id"], "spend", -float(body.amount), body.purpose, body.ref_id)
    # If purpose is "boost" with a listing_id, also flip is_boosted
    if body.purpose == "boost" and body.ref_id:
        boost_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.listings.update_one(
            {"id": body.ref_id, "user_id": user["id"]},
            {"$set": {"is_boosted": True, "boost_until": boost_until}},
        )
    new_bal = await _wallet_balance(user["id"])
    return {"success": True, "balance": new_bal}


# ============================================================
# AI Assistant — multi-turn shopping/support chatbot (Gemini 2.5 Flash)
# ============================================================
class AssistantIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None
    lang: Optional[str] = None  # ar|en|ur|hi|bn|fr — overrides language detection


_LANG_NAMES = {
    "ar": "Arabic (العربية)",
    "en": "English",
    "ur": "Urdu (اردو)",
    "hi": "Hindi (हिन्दी)",
    "bn": "Bengali (বাংলা)",
    "fr": "French (Français)",
}


def _build_assistant_prompt(lang_code: str) -> str:
    lang_name = _LANG_NAMES.get(lang_code, "Arabic (العربية)")
    return (
        f"You are the assistant of 'Haraj Plus' (الحراج بلس) — the largest digital marketplace "
        f"for the Arab Gulf and Egypt. You help users with: finding listings (cars, real estate, "
        f"electronics, jobs, services), tips for safe buying and selling, market price estimates, "
        f"how to post, flights, and auctions.\n\n"
        f"CRITICAL LANGUAGE RULES:\n"
        f"1. Always respond in {lang_name}. This is the user's preferred app language.\n"
        f"2. If the user writes their message in a DIFFERENT language than {lang_name}, "
        f"   reply in the SAME language the user wrote in (mirror the user's language).\n"
        f"3. Keep replies short (3-5 sentences), friendly, and helpful.\n\n"
        f"If asked about prices, suggest visiting the 'Deals' section or using the 'Price suggestion' tool. "
        f"Do not fabricate listings or specific prices. Do not discuss politics or religion."
    )


@api.post("/ai/assistant")
async def ai_assistant(body: AssistantIn, request: Request):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "Assistant temporarily unavailable")
    try:
        from llm_shim import LlmChat, UserMessage
    except Exception as e:
        logger.error(f"llm_shim import failed: {e}")
        raise HTTPException(503, "Failed to load AI library")

    # Pick language: body.lang > Accept-Language header > "ar" default
    lang = (body.lang or "").lower().strip()
    if lang not in _LANG_NAMES:
        accept = (request.headers.get("accept-language") or "").lower()
        for code in _LANG_NAMES.keys():
            if accept.startswith(code) or f",{code}" in accept or f" {code}" in accept:
                lang = code
                break
    if lang not in _LANG_NAMES:
        lang = "ar"

    sid = body.session_id or f"anon-{_client_ip(request)}-{int(time.time() // 600)}"
    # Load previous history for this session (last 10 turns) so multi-turn works
    prev = await db.ai_chats.find(
        {"session_id": sid}, {"_id": 0, "role": 1, "text": 1}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    prev.reverse()

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=sid,
        system_message=_build_assistant_prompt(lang),
    ).with_model("gemini", "gemini-2.5-flash")

    try:
        # Replay short history so model has context
        for m in prev:
            if m.get("role") == "user":
                await chat.send_message(UserMessage(text=m.get("text") or ""))
        reply = await chat.send_message(UserMessage(text=body.message))
    except Exception as e:
        logger.error(f"AI assistant failed: {e}")
        raise HTTPException(502, "تعذر الوصول للمساعد الذكي. حاول لاحقاً.")

    now = datetime.now(timezone.utc).isoformat()
    await db.ai_chats.insert_many([
        {"id": str(uuid.uuid4()), "session_id": sid, "role": "user", "text": body.message, "created_at": now},
        {"id": str(uuid.uuid4()), "session_id": sid, "role": "assistant", "text": reply, "created_at": now},
    ])
    return {"session_id": sid, "reply": reply}


@api.get("/ai/assistant/history")
async def ai_assistant_history(session_id: str, limit: int = 30):
    if not session_id:
        return []
    limit = max(1, min(int(limit or 30), 100))
    msgs = await db.ai_chats.find(
        {"session_id": session_id}, {"_id": 0, "role": 1, "text": 1, "created_at": 1}
    ).sort("created_at", 1).limit(limit).to_list(length=limit)
    return msgs


# ============================================================
# Voice → Text transcription (for voice search & voice notes)
# Uses OpenAI Whisper via Emergent LLM key.
# ============================================================
@api.post("/ai/transcribe")
async def ai_transcribe(audio: UploadFile = File(...), lang: Optional[str] = Form(None)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "Service unavailable")
    try:
        from openai import OpenAI
    except Exception:
        raise HTTPException(503, "OpenAI SDK not available")

    # Read audio bytes
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio")
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(413, "Audio too large (max 25MB)")

    # Save to temp file (Whisper SDK needs a file-like with filename)
    import tempfile
    suffix = ".m4a"
    if audio.filename and "." in audio.filename:
        suffix = "." + audio.filename.rsplit(".", 1)[-1].lower()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        client = OpenAI(
            api_key=EMERGENT_LLM_KEY,
            base_url="https://integrations.emergentagent.com/llm",
        )
        with open(tmp_path, "rb") as fh:
            kwargs = {"model": "whisper-1", "file": fh}
            if lang:
                kwargs["language"] = lang
            resp = client.audio.transcriptions.create(**kwargs)
        text = (resp.text or "").strip() if hasattr(resp, "text") else ""
        return {"text": text}
    except Exception as e:
        logger.error(f"transcribe failed: {e}")
        raise HTTPException(502, "Transcription failed")
    finally:
        try:
            import os as _os
            _os.unlink(tmp_path)
        except Exception:
            pass


# ============================================================
# Geographic autocomplete — OpenStreetMap Nominatim proxy.
# Lets us cover EVERY city and district in every country we serve
# without maintaining a static list.
# Cached for 24h to respect Nominatim's 1 req/sec policy.
# ============================================================
# Geo autocomplete uses httpx (already imported at top of file as `httpx`)
# Restricted to countries we serve: GCC + Egypt
_ALLOWED_GEO_COUNTRIES = {"sa", "ae", "kw", "qa", "bh", "om", "eg"}
_GEO_CACHE: dict[str, tuple[float, list]] = {}
_GEO_TTL = 86400  # 24h


@api.get("/geo/detect-country")
async def geo_detect_country(request: Request):
    """Auto-detect the user's country from their IP address.

    Used by the frontend on first visit to pre-select a country instead of
    forcing the user to manually choose. The selection is always overridable
    via the country picker in the topbar / profile.

    Falls back to "SA" when:
      * IP is private/loopback (dev environment)
      * The IP lookup fails (network error, rate limit)
      * The detected country is OUTSIDE our serviced area (GCC + Egypt)

    Result is cached per-IP for 1 hour to be polite with the free service.
    """
    ALLOWED = {"SA", "AE", "KW", "QA", "BH", "OM", "EG"}
    # Prefer X-Forwarded-For (set by ingress) — first IP in the chain is the real client.
    xff = request.headers.get("x-forwarded-for", "")
    ip = (xff.split(",")[0].strip() if xff else (request.client.host if request.client else "")) or ""
    if not ip or ip.startswith(("127.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.30.", "172.31.")):
        return {"country": "SA", "detected": False, "reason": "private_or_local_ip"}

    cache_key = f"IPCC|{ip}"
    now = time.time()
    if cache_key in _GEO_CACHE:
        ts, cached = _GEO_CACHE[cache_key]
        if now - ts < 3600:
            return cached

    cc = None
    try:
        async with httpx.AsyncClient(timeout=4.0) as cli:
            # ip-api.com is free, no key needed, supports HTTPS, ~45 req/min/IP.
            r = await cli.get(
                f"https://ip-api.com/json/{ip}",
                params={"fields": "status,countryCode,country"},
                headers={"User-Agent": "HarajPlus/1.0"},
            )
            data = r.json() if r.status_code == 200 else {}
        if (data.get("status") or "").lower() == "success":
            cc = (data.get("countryCode") or "").upper()
    except Exception as e:
        logger.warning(f"[geo/detect-country] ip-api failed: {e}")

    if cc and cc in ALLOWED:
        result = {"country": cc, "detected": True, "raw_country": cc}
    else:
        # User is outside the serviced area or detection failed → default to SA.
        result = {"country": "SA", "detected": False, "raw_country": cc, "reason": "outside_supported_area" if cc else "lookup_failed"}

    _GEO_CACHE[cache_key] = (now, result)
    return result


@api.get("/geo/reverse")
async def geo_reverse(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    lang: str = Query("ar", max_length=2),
):
    """Reverse-geocode a lat/lng pair into {country, city, district} using Nominatim.
    Used by the Post Listing screen to auto-suggest city/district from the user's
    current GPS location. Restricted to our serviced countries (GCC + Egypt).
    """
    key = f"REV|{round(lat,4)}|{round(lng,4)}|{lang}"
    now = time.time()
    if key in _GEO_CACHE:
        ts, cached = _GEO_CACHE[key]
        if now - ts < _GEO_TTL:
            return cached
    try:
        async with httpx.AsyncClient(timeout=10.0) as cli:
            r = await cli.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": str(lat), "lon": str(lng),
                    "format": "jsonv2", "zoom": "14",
                    "accept-language": lang,
                    "addressdetails": "1",
                },
                headers={"User-Agent": "HarajPlus/1.0 (https://alhraj.online)"},
            )
            r.raise_for_status()
            data = r.json() or {}
    except Exception as e:
        logger.warning(f"[geo/reverse] nominatim failed: {e}")
        return {"country": None, "city": None, "district": None}

    addr = data.get("address") or {}
    cc = (addr.get("country_code") or "").lower()
    if cc and cc not in _ALLOWED_GEO_COUNTRIES:
        return {"country": cc.upper(), "city": None, "district": None, "out_of_area": True}

    # City candidates in order of specificity
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("municipality")
        or addr.get("county")
        or addr.get("state_district")
        or addr.get("state")
    )
    # District/neighbourhood candidates
    district = (
        addr.get("neighbourhood")
        or addr.get("suburb")
        or addr.get("quarter")
        or addr.get("city_district")
        or addr.get("residential")
        or addr.get("hamlet")
    )

    result = {
        "country": cc.upper() if cc else None,
        "country_name": addr.get("country"),
        "city": city,
        "district": district,
        "display_name": data.get("display_name"),
    }
    _GEO_CACHE[key] = (now, result)
    return result


@api.get("/geo/search")
async def geo_search(
    q: str = Query(..., min_length=2, max_length=80),
    country: str = Query("", max_length=2),
    type: str = Query("city", regex="^(city|district|any)$"),
    lang: str = Query("ar", max_length=2),
    limit: int = Query(10, ge=1, le=20),
):
    """Search cities/districts using OpenStreetMap Nominatim.
    type=city → returns cities/towns/villages (administrative places)
    type=district → returns neighbourhoods/suburbs/quarters
    """
    # Reject countries outside our service area (GCC + Egypt only) — checked BEFORE cache
    cc = country.lower().strip()
    if cc and cc not in _ALLOWED_GEO_COUNTRIES:
        return []
    # If no country given, restrict search to the 7 countries we serve
    countries_filter = cc if cc else ",".join(sorted(_ALLOWED_GEO_COUNTRIES))

    key = f"{q.lower()}|{cc}|{type}|{lang}|{limit}"
    now = time.time()
    if key in _GEO_CACHE:
        ts, cached = _GEO_CACHE[key]
        if now - ts < _GEO_TTL:
            return cached

    # Build Nominatim params
    feature_classes = {
        "city": "P",   # populated places
        "district": "P",
        "any": "",
    }
    feature_codes_filter = None
    if type == "city":
        # Match cities/towns/villages by featuretype
        params = {
            "q": q,
            "format": "json",
            "addressdetails": "1",
            "limit": str(limit),
            "accept-language": lang,
            "featuretype": "city",
        }
    elif type == "district":
        params = {
            "q": q,
            "format": "json",
            "addressdetails": "1",
            "limit": str(limit),
            "accept-language": lang,
        }
    else:
        params = {
            "q": q,
            "format": "json",
            "addressdetails": "1",
            "limit": str(limit),
            "accept-language": lang,
        }
    if country:
        params["countrycodes"] = country.lower()
    else:
        # Restrict to GCC + Egypt always
        params["countrycodes"] = countries_filter

    try:
        async with httpx.AsyncClient(timeout=8.0) as cli:
            r = await cli.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers={"User-Agent": "HarajPlus/1.0 (https://alhraj.online)"},
            )
            r.raise_for_status()
            data = r.json() or []
    except Exception as e:
        logger.warning(f"[geo/search] Nominatim error: {e}")
        return []

    # Normalize results
    out = []
    seen = set()
    for item in data:
        addr = item.get("address", {})
        # Pick best label
        if type == "district":
            name = (
                addr.get("neighbourhood") or addr.get("suburb")
                or addr.get("quarter") or addr.get("city_district")
                or addr.get("residential") or item.get("name")
            )
            parent = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("state")
        else:
            name = (
                addr.get("city") or addr.get("town") or addr.get("village")
                or addr.get("municipality") or item.get("name")
            )
            parent = addr.get("state") or addr.get("region") or addr.get("country")

        if not name or name in seen:
            continue
        seen.add(name)
        out.append({
            "name": name,
            "parent": parent or "",
            "country": addr.get("country_code", "").upper(),
            "lat": float(item.get("lat") or 0),
            "lng": float(item.get("lon") or 0),
            "display_name": item.get("display_name") or name,
        })

    _GEO_CACHE[key] = (now, out)
    # Cap cache to prevent unbounded growth
    if len(_GEO_CACHE) > 5000:
        # Drop oldest 1000 entries
        for k in list(_GEO_CACHE.keys())[:1000]:
            _GEO_CACHE.pop(k, None)
    return out


@api.get("/geo/districts")
async def geo_districts(
    city: str = Query(..., min_length=2, max_length=80),
    country: str = Query("", max_length=2),
    lang: str = Query("ar", max_length=2),
    limit: int = Query(50, ge=1, le=100),
):
    """List all neighbourhoods/suburbs inside a given city using Overpass API (OSM).
    Returns up to `limit` districts for the matched city.
    Cached for 24h.
    """
    key = f"DISTRICTS|{city.lower()}|{country}|{lang}|{limit}"
    now = time.time()
    if key in _GEO_CACHE:
        ts, cached = _GEO_CACHE[key]
        if now - ts < _GEO_TTL:
            return cached

    # Reject countries outside our service area
    cc = country.lower().strip()
    if cc and cc not in _ALLOWED_GEO_COUNTRIES:
        return []

    # Step 1: Find the city's OSM relation/area (prefer relation for Overpass `area()`)
    try:
        async with httpx.AsyncClient(timeout=10.0) as cli:
            params = {
                "q": city,
                "format": "json",
                "limit": "5",  # ask more so we can prefer relations
                "accept-language": lang,
                "featuretype": "city",
                "extratags": "1",
            }
            if country:
                params["countrycodes"] = country.lower()
            else:
                # Always restrict to GCC + Egypt
                params["countrycodes"] = ",".join(sorted(_ALLOWED_GEO_COUNTRIES))
            r = await cli.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers={"User-Agent": "HarajPlus/1.0 (https://alhraj.online)"},
            )
            r.raise_for_status()
            found = r.json() or []
    except Exception as e:
        logger.warning(f"[geo/districts] Nominatim lookup failed: {e}")
        return []

    if not found:
        _GEO_CACHE[key] = (now, [])
        return []

    # Prefer relations (Overpass `area()` requires it). Fallback to first result.
    relation = next((r for r in found if (r.get("osm_type") or "").lower() == "relation"), None)
    osm = relation or found[0]
    osm_id = osm.get("osm_id")
    osm_type = (osm.get("osm_type") or "").lower()
    if not osm_id:
        return []

    # If we don't have a relation, query by bounding box instead.
    if osm_type != "relation":
        try:
            lat = float(osm.get("lat") or 0)
            lon = float(osm.get("lon") or 0)
            # ~0.25 degree box around the city center (~25km radius)
            bbox = f"{lat-0.25},{lon-0.25},{lat+0.25},{lon+0.25}"
            overpass_q = f"""
            [out:json][timeout:25];
            (
              node["place"~"^(neighbourhood|suburb|quarter|district)$"]({bbox});
              way["place"~"^(neighbourhood|suburb|quarter|district)$"]({bbox});
            );
            out tags center {limit};
            """
        except Exception:
            return []
    else:
        area_id = int(osm_id) + 3600000000
        overpass_q = f"""
        [out:json][timeout:25];
        area({area_id})->.searchArea;
        (
          node["place"~"^(neighbourhood|suburb|quarter|district)$"](area.searchArea);
          way["place"~"^(neighbourhood|suburb|quarter|district)$"](area.searchArea);
        );
        out tags center {limit};
        """

    try:
        async with httpx.AsyncClient(timeout=20.0) as cli:
            r = await cli.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_q},
                headers={"User-Agent": "HarajPlus/1.0 (https://alhraj.online)"},
            )
            r.raise_for_status()
            data = r.json() or {}
    except Exception as e:
        logger.warning(f"[geo/districts] Overpass failed: {e}")
        return []

    out = []
    seen = set()
    for el in (data.get("elements") or []):
        tags = el.get("tags", {})
        # Prefer Arabic name when lang=ar
        name = (
            tags.get(f"name:{lang}")
            or tags.get("name:ar")
            or tags.get("name")
        )
        if not name or name in seen:
            continue
        seen.add(name)
        center = el.get("center") or {}
        out.append({
            "name": name,
            "name_en": tags.get("name:en") or tags.get("name") or name,
            "lat": center.get("lat") or el.get("lat") or 0,
            "lng": center.get("lon") or el.get("lon") or 0,
            "place": tags.get("place") or "",
        })
        if len(out) >= limit:
            break

    # Sort alphabetically for stable UX
    out.sort(key=lambda x: x.get("name") or "")
    _GEO_CACHE[key] = (now, out)
    return out


@api.get("/geo/cities")
async def geo_cities(
    country: str = Query(..., min_length=2, max_length=2),
    lang: str = Query("ar", max_length=2),
    limit: int = Query(80, ge=10, le=200),
):
    """List ALL major cities + governorates within a country (no search needed).
    Returns up to `limit` populated places (P-class) inside the country boundary.
    """
    cc = country.lower().strip()
    if cc not in _ALLOWED_GEO_COUNTRIES:
        return []
    key = f"CITIES|{cc}|{lang}|{limit}"
    now = time.time()
    if key in _GEO_CACHE:
        ts, cached = _GEO_CACHE[key]
        if now - ts < _GEO_TTL:
            return cached

    # 1. Resolve country relation id via Nominatim (use country=NAME for proper relation match)
    _country_names = {
        "sa": "Saudi Arabia", "ae": "United Arab Emirates", "kw": "Kuwait",
        "qa": "Qatar", "bh": "Bahrain", "om": "Oman", "eg": "Egypt",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as cli:
            r = await cli.get(
                "https://nominatim.openstreetmap.org/search",
                params={"country": _country_names.get(cc, cc), "format": "json", "limit": "3"},
                headers={"User-Agent": "HarajPlus/1.0 (https://alhraj.online)"},
            )
            r.raise_for_status()
            found = r.json() or []
    except Exception as e:
        logger.warning(f"[geo/cities] nominatim failed: {e}")
        return []
    if not found:
        return []
    rel = next((x for x in found if (x.get("osm_type") or "").lower() == "relation"), found[0])
    osm_id = rel.get("osm_id")
    if not osm_id or (rel.get("osm_type") or "").lower() != "relation":
        return []
    area_id = int(osm_id) + 3600000000

    # 2. Query Overpass for cities + towns + administrative centres
    overpass_q = f"""
    [out:json][timeout:30];
    area({area_id})->.country;
    (
      node["place"~"^(city|town)$"](area.country);
      relation["place"~"^(city|town)$"]["admin_level"~"^(4|5|6|7)$"](area.country);
      node["admin_centre"="yes"](area.country);
    );
    out tags center {limit};
    """
    try:
        async with httpx.AsyncClient(timeout=25.0) as cli:
            r = await cli.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": overpass_q},
                headers={"User-Agent": "HarajPlus/1.0 (https://alhraj.online)"},
            )
            r.raise_for_status()
            data = r.json() or {}
    except Exception as e:
        logger.warning(f"[geo/cities] overpass failed: {e}")
        return []

    out, seen = [], set()
    for el in (data.get("elements") or []):
        tags = el.get("tags", {})
        name = tags.get(f"name:{lang}") or tags.get("name:ar") or tags.get("name")
        if not name or name in seen:
            continue
        seen.add(name)
        center = el.get("center") or {}
        out.append({
            "name": name,
            "name_en": tags.get("name:en") or tags.get("name") or name,
            "place": tags.get("place") or "city",
            "lat": center.get("lat") or el.get("lat") or 0,
            "lng": center.get("lon") or el.get("lon") or 0,
        })
        if len(out) >= limit:
            break

    out.sort(key=lambda x: x.get("name") or "")
    _GEO_CACHE[key] = (now, out)
    return out


app.include_router(api)




@app.on_event("startup")
async def startup():
    """
    Best-effort startup: index creation and seeding errors are logged but do NOT
    prevent the server from binding the port. Cloud Run's startup probe expects
    the container to be listening within ~240s; blocking on Mongo here would
    surface as 'failed to start and listen on the port'.
    """
    # ----- ENV validation (production hardening). Log warnings only, never crash. -----
    _env_advice = {
        "JWT_SECRET": "JWT signing secret — set to a 32+ random string in production.",
        "MONGO_URL": "MongoDB connection string.",
        "EMERGENT_LLM_KEY": "Unlocks Gemini/Claude/OpenAI AI features. Get it from Profile → Universal Key.",
        "RESEND_API_KEY": "Required to send real emails (verification, password reset, digest). Optional in dev.",
        "BACKEND_PUBLIC_URL": "Public HTTPS URL of this backend — used by mobile OAuth callbacks and Apple Sign-In.",
        "EXPO_PROJECT_ID": "Expo project id — required to send push to the mobile app via Expo Push.",
        "EXPO_ACCESS_TOKEN": "Optional, only needed for Expo Push v2 enhanced rate limits.",
        "VAPID_PUBLIC_KEY": "Web Push public key — required for browser push subscriptions.",
        "VAPID_PRIVATE_KEY": "Web Push private key — required to actually deliver browser push.",
        "CLOUDINARY_CLOUD_NAME": "Cloudinary cloud name — required for image/video uploads.",
        "CLOUDINARY_API_KEY": "Cloudinary API key — required for signed uploads.",
        "CLOUDINARY_API_SECRET": "Cloudinary API secret — required for signed uploads.",
    }
    for k, advice in _env_advice.items():
        if not os.environ.get(k, "").strip():
            logger.warning(f"[env] ⚠️  {k} is NOT set — {advice}")
        else:
            logger.info(f"[env] ✅ {k} configured")

    try:
        # Probe Mongo with a short timeout — if it fails we still come up so
        # the platform can show a useful error in the response body.
        await asyncio.wait_for(client.admin.command("ping"), timeout=8.0)
        # Print collections + key counts so deployment mistakes (wrong DB, fresh
        # cluster, dropped collection) are obvious in container logs.
        try:
            cols = await db.list_collection_names()
            logger.info("[db] Collections (%d): %s", len(cols), ", ".join(sorted(cols)[:30]))
            for name in ("listings", "users", "messages", "ads"):
                logger.info("[db] %s count = %d", name, await db[name].count_documents({}))
        except Exception as _e:
            logger.warning("[db] count probe failed: %s", _e)
    except Exception as e:
        logger.error(f"[startup] Mongo ping failed (continuing anyway): {e}")
        return

    async def _safe_index(coll, *args, **kwargs):
        try:
            await coll.create_index(*args, **kwargs)
        except Exception as e:
            logger.warning(f"[startup] index failed on {coll.name}: {e}")

    # Indexes
    await _safe_index(db.users, "email", unique=True)
    await _safe_index(db.users, "phone_full")
    await _safe_index(db.users, "id", unique=True)
    await _safe_index(db.listings, "id", unique=True)
    await _safe_index(db.listings, "slug")  # NEW: fast lookup by SEO slug
    await _safe_index(db.listings, "is_demo")  # NEW: fast demo filter / bulk delete
    await _safe_index(db.listings, [("created_at", -1)])  # NEW: list-newest pagination
    await _safe_index(db.listings, [("category", 1), ("city", 1), ("created_at", -1)])
    await _safe_index(db.listings, [("country_code", 1), ("status", 1)])
    await _safe_index(db.listings, [("title", "text"), ("description", "text")])
    await _safe_index(db.listings, "search_blob")
    await _safe_index(db.google_oauth_states, "state", unique=True)
    await _safe_index(db.google_oauth_states, "expires_at", expireAfterSeconds=0)
    await db.messages.create_index([("convo_id", 1), ("ts", 1)])
    await db.conversations.create_index("id", unique=True)
    await db.favorites.create_index([("user_id", 1), ("listing_id", 1)], unique=True)
    await db.bids.create_index([("listing_id", 1), ("amount", -1)])
    await db.bids.create_index("ts")
    await db.location_shares.create_index("expires_at", expireAfterSeconds=0)
    await db.translation_cache.create_index("key", unique=True)
    await db.notifications.create_index([("user_id", 1), ("ts", -1)])
    await db.x_oauth_states.create_index("expires_at", expireAfterSeconds=0)
    await db.snap_oauth_states.create_index("expires_at", expireAfterSeconds=0)
    # Push tokens — older deployments used a plain unique index on expo_token
    # which conflicts with web push entries that have no expo_token at all.
    # Drop and re-create as a partial index so both kinds coexist.
    try:
        for ix in await db.push_tokens.list_indexes().to_list(length=50):
            if ix.get("name") == "expo_token_1" and "partialFilterExpression" not in ix:
                await db.push_tokens.drop_index("expo_token_1")
                break
    except Exception:
        pass
    await db.push_tokens.create_index("expo_token", unique=True, partialFilterExpression={"expo_token": {"$type": "string"}})
    await db.push_tokens.create_index("web_subscription.endpoint", unique=True, partialFilterExpression={"web_subscription.endpoint": {"$type": "string"}})
    await db.push_tokens.create_index("user_id")
    await db.login_attempts.create_index("ts", expireAfterSeconds=900)
    await db.reports.create_index("status")
    await db.search_terms.create_index("q_lower", unique=True)
    await db.search_terms.create_index([("count", -1)])
    await db.search_history.create_index([("user_id", 1), ("q_lower", 1)], unique=True)
    await db.search_history.create_index([("user_id", 1), ("ts", -1)])
    # Performance indexes
    await db.listings.create_index([("user_id", 1), ("created_at", -1)])  # my listings
    await db.listings.create_index([("status", 1), ("created_at", -1)])  # public feed
    await db.listings.create_index([("category", 1), ("price", 1)])  # price filters
    await db.watches.create_index([("user_id", 1)])
    await db.watches.create_index([("listing_id", 1)])
    await db.follows.create_index([("follower_id", 1)])
    await db.follows.create_index([("seller_id", 1)])
    await _safe_index(db.ratings, [("seller_id", 1), ("created_at", -1)])
    # Price alerts — fast lookup by user + listing
    await _safe_index(db.price_alerts, [("user_id", 1), ("listing_id", 1)], unique=True)
    await _safe_index(db.price_alerts, "listing_id")
    # Block user
    await _safe_index(db.blocks, [("blocker_id", 1), ("blocked_id", 1)], unique=True)
    # Personalization
    await _safe_index(db.recently_viewed, [("user_id", 1), ("ts", -1)])
    await _safe_index(db.recently_viewed, [("user_id", 1), ("listing_id", 1)], unique=True)
    await _safe_index(db.saved_searches, [("user_id", 1), ("q_lower", 1)], unique=True)
    await _safe_index(db.saved_searches, [("user_id", 1), ("created_at", -1)])
    # Category follow + boosted listings
    await _safe_index(db.category_follows, [("user_id", 1), ("category", 1)], unique=True)
    await _safe_index(db.category_follows, "category")
    await _safe_index(db.listings, [("is_boosted", -1), ("created_at", -1)])
    # Admin audit log
    await _safe_index(db.admin_logs, [("ts", -1)])
    await _safe_index(db.admin_logs, [("admin_id", 1), ("ts", -1)])
    await _safe_index(db.ratings, [("author_id", 1), ("seller_id", 1)], unique=False)

    # Backfill SEO slugs for any listings that don't have one yet. Runs in the
    # background so startup isn't blocked. Idempotent — each listing's slug gets
    # set exactly once.
    async def _backfill_slugs():
        try:
            cursor = db.listings.find({"$or": [{"slug": {"$exists": False}}, {"slug": None}, {"slug": ""}]}, {"_id": 0, "id": 1, "title": 1}).limit(5000)
            async for l in cursor:
                base = _slugify(l.get("title") or "")
                slug = f"{base}-{l['id'].replace('-', '')[:6]}" if base else f"listing-{l['id'].replace('-', '')[:8]}"
                await db.listings.update_one({"id": l["id"]}, {"$set": {"slug": slug}})
        except Exception as e:
            logger.warning(f"[startup] slug backfill failed: {e}")
    asyncio.create_task(_backfill_slugs())

    # Hot-reload banned words from db so admin-curated set takes effect immediately.
    try:
        await _reload_banned_words()
    except Exception as _bwe:
        logger.warning(f"[startup] banned_words reload failed: {_bwe}")

    # Start the smart notifications worker (abandoned drafts/searches + scheduled).
    global _SMART_NOTIF_TASK
    if _SMART_NOTIF_TASK is None or _SMART_NOTIF_TASK.done():
        _SMART_NOTIF_TASK = asyncio.create_task(_smart_notifications_worker())

    # Start the media-cleanup retry worker (background — retries every 10 min)
    global _MEDIA_CLEANUP_TASK
    if _MEDIA_CLEANUP_TASK is None or _MEDIA_CLEANUP_TASK.done():
        _MEDIA_CLEANUP_TASK = asyncio.create_task(_media_cleanup_retry_worker())

    # Seed admin (idempotent)
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid,
            "name": "مدير الموقع",
            "email": ADMIN_EMAIL,
            "phone": "500000000",
            "country_code": "SA",
            "phone_full": "+966500000000",
            "city": "الرياض",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "verified": True,
            "trust_score": 100,
            "banned": False,
            "language": "ar",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin", "banned": False}})
    # Seed default theme
    if await db.settings.find_one({"_key": "theme"}) is None:
        await db.settings.insert_one({"_key": "theme", "value": DEFAULT_THEME})
    # Backfill referral codes for users without one
    async for u in db.users.find({"referral_code": {"$exists": False}}, {"_id": 0, "id": 1, "name": 1}):
        await db.users.update_one({"id": u["id"]}, {"$set": {"referral_code": gen_referral_code(u.get("name", "USER"))}})
    # Backfill search_blob on existing listings (one-time, idempotent)
    async for l in db.listings.find({"search_blob": {"$exists": False}}, {"_id": 0}):
        await db.listings.update_one({"id": l["id"]}, {"$set": {"search_blob": build_search_blob(l)}})
    # Seed sample ad
    if await db.ads.count_documents({}) == 0:
        await db.ads.insert_one({
            "id": str(uuid.uuid4()),
            "title": "مرحباً بكم في الحراج بلس",
            "image_url": "https://images.unsplash.com/photo-1709626011483-5bb4b5470ac9?w=1200&q=80",
            "link_url": "",
            "placement": "home_middle",
            "active": True,
            "country_code": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


    # Seed Trip.com affiliate banner (idempotent: only if no Trip.com ad exists yet)
    if await db.ads.count_documents({"link_url": {"$regex": "trip.com", "$options": "i"}}) == 0:
        now_iso = datetime.now(timezone.utc).isoformat()
        TRIP_BANNER = "https://customer-assets.emergentagent.com/job_platform-inspect/artifacts/qxdi93hp_IMG_2109.jpeg"
        TRIP_LINK = "https://www.trip.com/t/AYKu00NZbU2"
        for placement in ["home_middle", "listing_top", "listing_bottom"]:
            await db.ads.insert_one({
                "id": str(uuid.uuid4()),
                "title": "Trip.com — احجز الآن وادفع لاحقاً",
                "image_url": TRIP_BANNER,
                "link_url": TRIP_LINK,
                "placement": placement,
                "active": True,
                "country_code": None,
                "ad_type": "image",
                "created_at": now_iso,
            })




@app.on_event("shutdown")
async def shutdown():
    client.close()


# Allow `python server.py` to start a dev server too (in addition to uvicorn CLI).
# Cloud Run injects PORT=8080; locally we fall back to 8001 to match supervisor.
if __name__ == "__main__":
    import uvicorn as _uvicorn
    _port = int(os.environ.get("PORT", "8001"))
    _uvicorn.run("server:app", host="0.0.0.0", port=_port, workers=1, proxy_headers=True)
