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
import base64
import hashlib
import hmac
from urllib.parse import quote
from html import escape as html_escape
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
from pymongo.errors import DuplicateKeyError
from cryptography.fernet import Fernet, InvalidToken

from seed_data import COUNTRIES, CATEGORIES, DEFAULT_THEME
from country_policy import (
    country_code_or_default,
    supported_country_codes,
    normalize_location,
    normalize_currency,
    is_city_known_for_country,
)
from i18n_data import localize_categories, t_option, t_category
from search_engine import (
    normalize_arabic,
    build_search_blob,
    search_listings as _search_listings_engine,
    suggest as _search_suggest_engine,
    public_listing_filter,
    public_listing_filter_for_country,
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
from ai_orchestrator import AIOrchestrator


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

_COUNTRY_POLICY_ERRORS = {
    "unsupported_country": "يرجى اختيار دولة مدعومة",
    "city_required": "يرجى اختيار مدينة من الدولة المحددة",
    "city_not_in_country": "المدينة لا تنتمي إلى الدولة المحددة",
    "district_not_in_city": "الحي لا ينتمي إلى المدينة المحددة",
    "currency_not_in_country": "العملة لا تطابق الدولة المحددة",
}


def _country_policy_http_error(error: ValueError) -> HTTPException:
    """Convert pure country-policy validation errors into safe API responses."""
    return HTTPException(422, _COUNTRY_POLICY_ERRORS.get(str(error), "بيانات الدولة أو الموقع غير صالحة"))


def _require_active_country(user: dict, requested_country: Optional[str] = None, *, action: str = "إتمام العملية") -> str:
    """Return the authenticated account's active country or reject a client override.

    Anonymous discovery may intentionally select a supported marketplace. Mutating
    actions and private collections must instead use the account's persisted
    active country so a forged query parameter cannot create or reveal a
    cross-country relationship.
    """
    active = country_code_or_default(user.get("country_code"), "SA")
    if requested_country is None or not str(requested_country).strip():
        return active
    requested = str(requested_country).upper().strip()
    if requested not in supported_country_codes():
        raise HTTPException(422, "يرجى اختيار دولة مدعومة")
    if requested != active:
        raise HTTPException(409, f"غيّر الدولة النشطة قبل {action}")
    return active

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
# MFA secrets are encrypted at rest. Set a dedicated Fernet key in production;
# a deterministic JWT-derived key preserves backward-compatible startup but is
# logged as an operational hardening gap at startup.
MFA_ENCRYPTION_KEY = os.environ.get("MFA_ENCRYPTION_KEY", "").strip()
MFA_ISSUER = os.environ.get("MFA_ISSUER", "Alhraj Plus").strip() or "Alhraj Plus"
# Admin MFA is enforced by default in production. It remains configurable so
# isolated local/unit environments can bootstrap an administrator before MFA
# enrollment, but the backend—not either client—remains the decision point.
APP_ENV = _env("APP_ENV", default="development").strip().lower()
ADMIN_MFA_REQUIRED = _env(
    "ADMIN_MFA_REQUIRED",
    default="true" if APP_ENV == "production" else "false",
).strip().lower() in {"1", "true", "yes", "on"}

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
APPLE_REDIRECT_URI = os.environ.get("APPLE_REDIRECT_URI", "").strip()

# DB
client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=8000,  # fail fast (8s) on bad/unreachable URL
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
    retryWrites=True,
)
db = client[DB_NAME]
ai_orchestrator = AIOrchestrator(db)

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
    "max_paths": 2000,  # hard cap prevents unbounded growth from ID-bearing URLs
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
    by_path = _METRICS["by_path"]
    metric_path = path if path in by_path or len(by_path) < _METRICS["max_paths"] else "__other__"
    p = by_path.setdefault(metric_path, {"n": 0, "errs": 0, "sum_ms": 0.0, "max_ms": 0.0})
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


# Debug endpoint — restricted to Admin because it exposes deployment and data diagnostics.
# The wrapper is defined before auth helpers in this module, but resolves their
# names only when a request is handled (after module initialization).
async def _debug_admin_dependency(request: Request):
    user = await get_current_user(request)
    return await require_admin(user)

@app.get("/api/debug/db-check", include_in_schema=False)
async def _debug_db_check(_: dict = Depends(_debug_admin_dependency)):
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
async def _debug_listings_raw(limit: int = 5, _: dict = Depends(_debug_admin_dependency)):
    limit = max(1, min(limit, 20))
    items = await db.listings.find({}, {"_id": 0}).limit(limit).to_list(length=limit)
    return {"count": len(items), "items": items}


# ---------------------------------------------------------------------------
# Server-side OG share endpoint — `/api/og/listing/{id}`.
#
# Why: React-Helmet only injects meta tags at runtime, but WhatsApp / Telegram /
# Facebook / Twitter / Google crawlers DO NOT execute JS. So a deep-shared
# listing URL (https://alhraj.online/listing/{id}) renders to them as the
# generic homepage OG and they show only the boilerplate title.
#
# This endpoint returns a minimal HTML page with the correct og:title,
# og:image, og:description, twitter cards, schema.org Product JSON-LD, AND a
# `<meta http-equiv="refresh">` so that real users opening the URL still land
# on the SPA at `/listing/{id}`.
# ---------------------------------------------------------------------------
@app.get("/api/og/listing/{listing_id}", include_in_schema=False)
async def _og_listing_share(listing_id: str, country_code: Optional[str] = None):
    try:
        doc = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 0})
    except Exception:
        doc = None
    if not doc:
        return HTMLResponse(
            "<!doctype html><html><head><meta http-equiv='refresh' content='0; url=/' /></head><body></body></html>",
            status_code=404,
        )
    raw_title = str(doc.get("title") or "إعلان")[:200]
    raw_desc = str(doc.get("description") or "")
    raw_desc = (raw_desc[:280] + "…") if len(raw_desc) > 280 else raw_desc
    raw_desc = raw_desc or "تصفح هذا الإعلان على الحراج بلس — أكبر سوق رقمي للخليج العربي."
    title = html_escape(raw_title, quote=True)
    desc = html_escape(raw_desc, quote=True)
    images = doc.get("images") or []
    image = images[0] if images else "https://alhraj.online/og-image.png"
    price = doc.get("price")
    currency = doc.get("currency_code") or doc.get("currency") or "SAR"
    city = doc.get("city") or ""
    spa_url = f"https://alhraj.online/listing/{listing_id}"
    price_line = f"{price:,.0f} {currency}" if isinstance(price, (int, float)) and price > 0 else ""
    city = html_escape(str(city), quote=True)
    image = html_escape(str(image), quote=True)
    composed_title = f"{title}" + (f" — {html_escape(price_line, quote=True)}" if price_line else "") + " | الحراج بلس"
    composed_desc = (f"{html_escape(price_line, quote=True)} • {city} — " if price_line or city else "") + desc
    cf = doc.get("custom_fields") or {}
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": raw_title,
        "image": images,
        "description": raw_desc,
        "url": spa_url,
    }
    if doc.get("category") == "cars":
        schema.update({"@type": "Vehicle", "vehicleModelDate": cf.get("year"), "brand": {"@type": "Brand", "name": cf.get("make")}, "model": cf.get("model"), "mileageFromOdometer": {"@type": "QuantitativeValue", "value": cf.get("kilometers"), "unitCode": "KMT"} if cf.get("kilometers") else None})
    elif doc.get("category") == "realestate":
        schema.update({"@type": "Residence", "numberOfRooms": cf.get("rooms"), "floorSize": {"@type": "QuantitativeValue", "value": cf.get("area_m2"), "unitCode": "MTK"} if cf.get("area_m2") else None, "address": {"@type": "PostalAddress", "addressLocality": doc.get("city")}})
    elif doc.get("category") == "jobs":
        schema.update({"@type": "JobPosting", "title": cf.get("job_title") or raw_title, "datePosted": doc.get("created_at"), "employmentType": cf.get("employment_type"), "hiringOrganization": {"@type": "Organization", "name": cf.get("company_name") or "الحراج بلس"}})
    if isinstance(price, (int, float)) and price > 0:
        schema["offers"] = {"@type": "Offer", "price": price, "priceCurrency": currency, "availability": "https://schema.org/InStock"}
    schema = {k: v for k, v in schema.items() if v not in (None, "")}
    schema_json = json.dumps(schema, ensure_ascii=False).replace("</", "<\\/")

    html = f"""<!doctype html>
<html lang=\"ar\" dir=\"rtl\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <meta name=\"theme-color\" content=\"#4FB6E6\" />
  <title>{composed_title}</title>
  <meta name=\"description\" content=\"{composed_desc}\" />

  <meta property=\"og:type\" content=\"product\" />
  <meta property=\"og:url\" content=\"{spa_url}\" />
  <meta property=\"og:title\" content=\"{composed_title}\" />
  <meta property=\"og:description\" content=\"{composed_desc}\" />
  <meta property=\"og:image\" content=\"{image}\" />
  <meta property=\"og:image:width\" content=\"1200\" />
  <meta property=\"og:image:height\" content=\"630\" />
  <meta property=\"og:site_name\" content=\"الحراج بلس\" />
  <meta property=\"og:locale\" content=\"ar_SA\" />

  <meta name=\"twitter:card\" content=\"summary_large_image\" />
  <meta name=\"twitter:title\" content=\"{composed_title}\" />
  <meta name=\"twitter:description\" content=\"{composed_desc}\" />
  <meta name=\"twitter:image\" content=\"{image}\" />

  <script type=\"application/ld+json\">{schema_json}</script>

  <!-- Real users → SPA. Crawlers stay on this page and just read meta. -->
  <meta http-equiv=\"refresh\" content=\"0; url={spa_url}\" />
  <link rel=\"canonical\" href=\"{spa_url}\" />
</head>
<body>
  <p style=\"font-family: -apple-system, sans-serif; text-align:center; padding:24px;\">
    جاري التحويل إلى <a href=\"{spa_url}\">{title}</a>…
  </p>
  <script>window.location.replace(\"{spa_url}\");</script>
</body>
</html>"""
    return HTMLResponse(html, headers={"Cache-Control": "public, max-age=300"})




@api.get("/health/ready", include_in_schema=False)
async def readiness_probe():
    """Dependency-aware readiness probe for orchestrators and deploy smoke tests.

    A running process is not enough for production readiness: MongoDB must
    answer, and production must have a managed Redis available for shared
    cache/rate limits/WebSocket fan-out.
    """
    mongo_ok = False
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        pass
    redis_status = _redis_status() if "_redis_status" in globals() else "off"
    production = (os.environ.get("APP_ENV", "development").lower() == "production")
    checks = {"mongo": "ok" if mongo_ok else "down", "redis": redis_status}
    ready = mongo_ok and (not production or redis_status == "on")
    return JSONResponse({"status": "ready" if ready else "not_ready", "checks": checks}, status_code=200 if ready else 503)


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
# Monitoring: API, indexing assets and public listing schema
# ============================================================
_MONITOR_TIMEOUT_SECONDS = 10.0
_MONITOR_LATENCY_WARNING_MS = 4000


def _monitor_site_url() -> str:
    return os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")


def _monitor_alert_recipient() -> str:
    return (os.environ.get("MONITORING_ALERT_EMAIL") or os.environ.get("ADMIN_EMAIL") or "").strip()


async def _monitor_http_check(client: httpx.AsyncClient, name: str, url: str, required_text: str = "") -> dict:
    started = time.perf_counter()
    try:
        response = await client.get(url, headers={"User-Agent": "HarajPlus-Monitor/1.0"})
        latency_ms = round((time.perf_counter() - started) * 1000, 1)
        valid = response.status_code == 200 and (not required_text or required_text in response.text)
        warning = valid and latency_ms > _MONITOR_LATENCY_WARNING_MS
        return {
            "name": name, "ok": valid, "warning": warning, "status_code": response.status_code,
            "latency_ms": latency_ms,
            "detail": "slow" if warning else ("ok" if valid else "unexpected response"),
        }
    except httpx.HTTPError as exc:
        return {"name": name, "ok": False, "warning": False, "status_code": None, "latency_ms": None, "detail": f"network error: {type(exc).__name__}"}


async def _run_platform_monitoring() -> dict:
    """Run bounded, read-only public and dependency checks for Admin and cron.

    This never changes a listing or calls a search-engine indexing API.  It checks
    what an external visitor can retrieve, then records only the compact result.
    """
    checked_at = datetime.now(timezone.utc).isoformat()
    checks = []
    try:
        await db.command("ping")
        checks.append({"name": "mongo", "ok": True, "warning": False, "status_code": None, "latency_ms": None, "detail": "ok"})
    except Exception as exc:
        checks.append({"name": "mongo", "ok": False, "warning": False, "status_code": None, "latency_ms": None, "detail": type(exc).__name__})
    redis_status = _redis_status() if "_redis_status" in globals() else "off"
    checks.append({"name": "redis", "ok": redis_status == "on", "warning": redis_status != "on", "status_code": None, "latency_ms": None, "detail": redis_status})

    site = _monitor_site_url()
    async with httpx.AsyncClient(timeout=_MONITOR_TIMEOUT_SECONDS, follow_redirects=True) as client:
        checks.append(await _monitor_http_check(client, "api_health", f"{site}/api/health", '"status"'))
        checks.append(await _monitor_http_check(client, "robots", f"{site}/robots.txt", "Sitemap:"))
        checks.append(await _monitor_http_check(client, "sitemap", f"{site}/sitemap.xml", "<urlset"))
        try:
            sample = await db.listings.find_one({"status": "active", "moderation": "approved"}, {"_id": 0, "id": 1, "slug": 1})
        except Exception:
            sample = None
        if sample:
            ref = quote(_listing_seo_ref(sample), safe="-._~")
            started = time.perf_counter()
            try:
                response = await client.get(f"{site}/listing/{ref}", headers={"User-Agent": "OAI-SearchBot/1.0"})
                body = response.text
                latency_ms = round((time.perf_counter() - started) * 1000, 1)
                valid = response.status_code == 200 and 'application/ld+json' in body and 'BreadcrumbList' in body
                checks.append({"name": "listing_schema", "ok": valid, "warning": valid and latency_ms > _MONITOR_LATENCY_WARNING_MS, "status_code": response.status_code, "latency_ms": latency_ms, "detail": "ok" if valid else "schema missing"})
            except httpx.HTTPError as exc:
                checks.append({"name": "listing_schema", "ok": False, "warning": False, "status_code": None, "latency_ms": None, "detail": f"network error: {type(exc).__name__}"})
        else:
            checks.append({"name": "listing_schema", "ok": True, "warning": True, "status_code": None, "latency_ms": None, "detail": "no approved public listing sample"})

    failed = [item for item in checks if not item["ok"]]
    warnings = [item for item in checks if item.get("warning")]
    return {
        "checked_at": checked_at,
        "status": "down" if failed else ("degraded" if warnings else "healthy"),
        "checks": checks,
        "failed_count": len(failed),
        "warning_count": len(warnings),
    }


async def _record_monitoring_result(result: dict, notify: bool = True) -> dict:
    """Persist a compact check history and email only on a status transition."""
    previous = await db.monitoring_runs.find_one({}, {"_id": 0, "status": 1}, sort=[("checked_at", -1)])
    should_alert = bool(notify and result["status"] != "healthy" and previous and previous.get("status") == "healthy")
    should_recover = bool(notify and result["status"] == "healthy" and previous and previous.get("status") in {"down", "degraded"})
    result["alert_sent"] = False
    result["recovery_sent"] = False
    if (should_alert or should_recover) and RESEND_API_KEY and _monitor_alert_recipient():
        subject = "🚨 تنبيه مراقبة الحراج بلس" if should_alert else "✅ عادت خدمات الحراج بلس للعمل"
        rows = "".join(f"<li><strong>{html_escape(check['name'])}</strong>: {html_escape(str(check['detail']))}</li>" for check in result["checks"] if not check["ok"] or check.get("warning")) or "<li>جميع الفحوص سليمة.</li>"
        try:
            await asyncio.to_thread(resend.Emails.send, {
                "from": SENDER_EMAIL, "to": [_monitor_alert_recipient()], "subject": subject,
                "html": f'<div dir="rtl" style="font-family:Arial,sans-serif"><h2>{subject}</h2><p>الحالة: <strong>{result["status"]}</strong></p><ul>{rows}</ul><p>وقت الفحص UTC: {html_escape(result["checked_at"])}</p></div>',
            })
            result["alert_sent"] = should_alert
            result["recovery_sent"] = should_recover
        except Exception as exc:
            logger.error("[monitoring] failed to send alert email: %s", exc)
    await db.monitoring_runs.insert_one({"id": f"monitor_{uuid.uuid4().hex}", **result})
    await db.monitoring_runs.delete_many({"checked_at": {"$lt": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}})
    return result


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

def _mfa_fernet() -> Fernet:
    # Dedicated MFA_ENCRYPTION_KEY is preferred. The fallback is key-derived
    # from the existing production JWT secret so MFA is never stored plaintext.
    source = MFA_ENCRYPTION_KEY or JWT_SECRET
    key = base64.urlsafe_b64encode(hashlib.sha256(source.encode()).digest())
    return Fernet(key)


def _mfa_encrypt(secret: str) -> str:
    return _mfa_fernet().encrypt(secret.encode()).decode()


def _mfa_decrypt(ciphertext: str) -> str:
    try:
        return _mfa_fernet().decrypt(ciphertext.encode()).decode()
    except (InvalidToken, ValueError, TypeError):
        raise HTTPException(500, "تعذر قراءة إعدادات التحقق الثنائي. تواصل مع الدعم")


def _totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")


def _totp_code(secret: str, counter: int) -> str:
    padded = secret.upper() + ("=" * ((8 - len(secret) % 8) % 8))
    key = base64.b32decode(padded, casefold=True)
    digest = hmac.new(key, int(counter).to_bytes(8, "big"), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    value = ((digest[offset] & 0x7F) << 24) | ((digest[offset + 1] & 0xFF) << 16) | ((digest[offset + 2] & 0xFF) << 8) | (digest[offset + 3] & 0xFF)
    return f"{value % 1_000_000:06d}"


def _verify_totp(secret: str, code: str, window: int = 1) -> bool:
    candidate = str(code or "").strip().replace(" ", "")
    if not re.fullmatch(r"\d{6}", candidate):
        return False
    counter = int(time.time() // 30)
    return any(hmac.compare_digest(_totp_code(secret, counter + drift), candidate) for drift in range(-window, window + 1))


def _recovery_code_hash(code: str) -> str:
    return hashlib.sha256(str(code or "").strip().upper().encode()).hexdigest()


def _new_recovery_codes(count: int = 8) -> list[str]:
    return [f"{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}" for _ in range(count)]


def _request_ip(request: Request) -> str:
    return (request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else ""))[:64]


def _session_metadata(request: Request) -> dict:
    return {"ip": _request_ip(request), "user_agent": (request.headers.get("user-agent") or "")[:300]}


def create_access_token(uid: str, email: str, role: str, session_id: Optional[str] = None, mfa: bool = False) -> str:
    payload = {"sub": uid, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
               "type": "access", "mfa": bool(mfa)}
    if session_id:
        payload["sid"] = session_id
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(uid: str, session_id: Optional[str] = None):
    jti = str(uuid.uuid4())
    payload = {"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "refresh", "jti": jti}
    if not session_id:
        # Legacy social callbacks remain usable while they are migrated to
        # first-party sessions. Password/MFA flows always pass a session id.
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    payload["sid"] = session_id
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM), jti


async def _create_auth_session(user: dict, request: Request, *, mfa_verified: bool) -> tuple[str, str, str]:
    session_id = str(uuid.uuid4())
    refresh, refresh_jti = create_refresh_token(user["id"], session_id)
    now = datetime.now(timezone.utc)
    await db.auth_sessions.insert_one({
        "id": session_id, "user_id": user["id"], "refresh_jti": refresh_jti,
        "mfa_verified": bool(mfa_verified), "created_at": now, "last_seen_at": now,
        "expires_at": now + timedelta(days=30), "revoked_at": None, **_session_metadata(request),
    })
    access = create_access_token(user["id"], user["email"], user.get("role", "user"), session_id, mfa_verified)
    return access, refresh, session_id


async def _rotate_auth_session(user: dict, request: Request, session_id: str, old_jti: str) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    refresh, new_jti = create_refresh_token(user["id"], session_id)
    changed = await db.auth_sessions.update_one(
        {"id": session_id, "user_id": user["id"], "refresh_jti": old_jti, "revoked_at": None, "expires_at": {"$gt": now}},
        {"$set": {"refresh_jti": new_jti, "last_seen_at": now, **_session_metadata(request)}},
    )
    if not changed.modified_count:
        raise HTTPException(401, "جلسة التحديث غير صالحة أو انتهت")
    return create_access_token(user["id"], user["email"], user.get("role", "user"), session_id, bool(user.get("mfa_enabled"))), refresh

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
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0, "mfa_secret": 0, "mfa_recovery_hashes": 0})
        if not user:
            raise HTTPException(401, "User not found")
        session_id = payload.get("sid")
        if session_id:
            active_session = await db.auth_sessions.find_one({"id": session_id, "user_id": user["id"], "revoked_at": None, "expires_at": {"$gt": datetime.now(timezone.utc)}}, {"_id": 0, "id": 1})
            if not active_session:
                raise HTTPException(401, "Session revoked or expired")
        if user.get("banned"):
            raise HTTPException(403, "Account banned")
        user["mfa_session_verified"] = bool(payload.get("mfa", False))
        user["admin_mfa_required"] = _admin_mfa_required_for(user)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

def _admin_mfa_required_for(user: dict) -> bool:
    return bool(ADMIN_MFA_REQUIRED and user.get("role") == "admin")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    # A password alone is never sufficient for a production administrator.
    # `mfa_session_verified` is derived from the signed access-token claim in
    # get_current_user, so a stale or pre-enrollment session cannot be reused.
    if _admin_mfa_required_for(user) and (not user.get("mfa_enabled") or not user.get("mfa_session_verified")):
        raise HTTPException(403, "Admin MFA enrollment and verification required")
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

class MfaVerifyIn(BaseModel):
    challenge_id: str = Field(min_length=16, max_length=128)
    code: str = Field(min_length=6, max_length=32)

class MfaEnrollmentVerifyIn(BaseModel):
    code: str = Field(min_length=6, max_length=16)

class MfaDisableIn(BaseModel):
    code: str = Field(min_length=6, max_length=32)

class SessionRevokeIn(BaseModel):
    session_id: str = Field(min_length=16, max_length=128)

class ListingIn(BaseModel):
    title: str = Field(min_length=4, max_length=120)
    description: str = Field(min_length=5, max_length=4000)
    price: Optional[float] = None
    currency: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    custom_fields: dict = Field(default_factory=dict)
    images: List[str] = Field(default_factory=list, max_length=30)
    videos: List[str] = Field(default_factory=list, max_length=5)
    country_code: Optional[str] = None  # active country at time of post (overrides profile default)
    city: str
    district: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    show_phone: bool = True
    contact_phone: Optional[str] = None  # optional override phone for this listing
    contact_phone_source: Optional[str] = None  # "account" | "custom"
    post_type: Optional[str] = None  # offer | request

class ListingDiscoveryPreviewIn(BaseModel):
    """Unpersisted, fact-bound discovery readiness input for listing authors."""
    title: str = Field(default="", max_length=120)
    description: str = Field(default="", max_length=4000)
    price: Optional[float] = None
    category: str = Field(default="", max_length=80)
    city: str = Field(default="", max_length=120)
    district: Optional[str] = Field(default=None, max_length=120)
    custom_fields: dict = Field(default_factory=dict)
    images: List[str] = Field(default_factory=list, max_length=30)
    post_type: Optional[str] = Field(default=None, max_length=32)

class ChatMessageIn(BaseModel):
    listing_id: Optional[str] = None
    receiver_id: str
    text: Optional[str] = None
    image: Optional[str] = None
    voice: Optional[str] = None
    voice_duration_ms: Optional[int] = None  # for voice messages — UX waveform/duration label
    location: Optional[dict] = None  # {lat, lng}
    reply_to: Optional[dict] = None  # snapshot {id, text, image, sender_name}
    forwarded_from: Optional[dict] = None  # {name, message_id} — origin info shown above the bubble
    client_message_id: Optional[str] = Field(default=None, min_length=8, max_length=100)

class ReportIn(BaseModel):
    target_type: str  # listing | user | message
    target_id: str
    reason: str

class OfferIn(BaseModel):
    amount: float = Field(gt=0, le=1_000_000_000)
    message: Optional[str] = Field(default="", max_length=1000)
    expires_in_hours: int = Field(default=72, ge=1, le=720)
    # Stable key makes a network retry return the original offer instead of
    # creating or silently altering a negotiation.
    client_offer_id: Optional[str] = Field(default=None, min_length=8, max_length=100)

class OfferDecisionIn(BaseModel):
    action: str = Field(pattern="^(accept|reject|counter)$")
    counter_amount: Optional[float] = Field(default=None, gt=0, le=1_000_000_000)
    message: Optional[str] = Field(default="", max_length=1000)
    client_action_id: Optional[str] = Field(default=None, min_length=8, max_length=100)

class PhoneVerificationStartIn(BaseModel):
    phone: str = Field(min_length=6, max_length=32)
    country_code: Optional[str] = Field(default=None, min_length=2, max_length=3)

class PhoneVerificationConfirmIn(BaseModel):
    phone: str = Field(min_length=6, max_length=32)
    code: str = Field(min_length=4, max_length=10)
    country_code: Optional[str] = Field(default=None, min_length=2, max_length=3)

class ListingCommentIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    parent_id: Optional[str] = None
    # Stable client key lets retries reconcile a successful write instead of
    # creating a duplicate comment or surfacing a false failure.
    client_comment_id: Optional[str] = Field(default=None, min_length=8, max_length=100)

class CommentReportIn(BaseModel):
    reason: str = Field(min_length=2, max_length=500)

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
    # Optional independent bottom navigation surface color. When omitted,
    # clients fall back to primary_color for backwards compatibility.
    nav_color: Optional[str] = None
    primary_hover: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_arabic_heading: Optional[str] = None
    font_arabic_body: Optional[str] = None
    site_name: Optional[str] = None
    tagline_ar: Optional[str] = None

class BuyRequestIn(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=4000)
    budget_min: Optional[float] = Field(default=None, ge=0)
    budget_max: Optional[float] = Field(default=None, ge=0)
    city: str = Field(default="", max_length=120)
    country_code: str = Field(default="SA", min_length=2, max_length=3)
    expires_at: Optional[str] = None

class ResumeIn(BaseModel):
    resume_url: str = Field(min_length=8, max_length=2000)
    file_name: str = Field(default="resume", max_length=180)
    mime_type: str = Field(default="application/pdf", max_length=120)

class JobApplicationIn(BaseModel):
    cover_note: str = Field(default="", max_length=5000)
    resume_url: Optional[str] = Field(default=None, max_length=2000)
    country_code: str = Field(default="SA", min_length=2, max_length=3)

class SupportTicketIn(BaseModel):
    subject: str = Field(min_length=3, max_length=180)
    message: str = Field(min_length=3, max_length=6000)
    category: str = Field(default="general", max_length=60)
    priority: str = Field(default="normal", max_length=20)
    listing_id: Optional[str] = Field(default=None, max_length=120)

class SupportReplyIn(BaseModel):
    message: str = Field(min_length=1, max_length=6000)


# ============================================================
# Public meta endpoints
# ============================================================
# Public, versioned contract consumed by both first-party clients.  It describes
# only stable client behavior; it never exposes credentials, admin capabilities,
# or deployment-specific configuration.
CLIENT_CONTRACT_VERSION = "2026.08.19.1"
CLIENT_SUPPORTED_LANGUAGES = ("ar", "en", "ur", "hi", "bn", "fr")


def _client_contract():
    return {
        "version": CLIENT_CONTRACT_VERSION,
        "supported_languages": list(CLIENT_SUPPORTED_LANGUAGES),
        "defaults": {
            "language": "ar",
            "country_code": "SA",
            "calendar": "gregory",
            "numbering_system": "latn",
        },
        "request_context": {
            "country_query": "country_code",
            "language_header": "X-Haraj-Language",
            "client_header": "X-Haraj-Client",
            "contract_header": "X-Haraj-Contract-Version",
        },
        "capabilities": {
            "listing_detail": {
                "path": "/listings/{id}",
                "method": "GET",
                "query": ["lang"],
                "localized_fields": ["title", "description", "seo_available_languages"],
            },
            "public_discovery": {
                "path": "/discovery/listings",
                "method": "GET",
                "read_only": True,
            },
            "admin_monitoring": {
                "path": "/admin/monitoring/summary",
                "method": "GET",
                "admin_only": True,
            },
        },
    }


@api.get("/")
async def root():
    return {"app": "haraj_plus", "status": "ok", "version": "1.0", "client_contract_version": CLIENT_CONTRACT_VERSION}


@api.get("/meta/client-contract")
async def get_client_contract():
    return _client_contract()

@api.get("/meta/categories")
async def get_categories(lang: str = "ar"):
    lang = (lang or "ar").lower().strip()
    if lang not in ("ar", "en", "ur", "hi", "bn", "fr"):
        lang = "ar"
    return localize_categories(CATEGORIES, lang)


# ============================================================
# Cascading catalogs (cars + phones) — single source of truth, shared by
# web and mobile so options never drift.
# ============================================================
@api.get("/meta/car-brands")
async def meta_car_brands():
    from catalogs import car_brands, years_window
    return {"brands": car_brands(), "years": years_window(30)}


@api.get("/meta/car-models")
async def meta_car_models(brand: str):
    from catalogs import car_models
    return {"brand": brand, "models": car_models(brand)}


@api.get("/meta/car-trims")
async def meta_car_trims(brand: str, model: str):
    from catalogs import car_trims
    return {"brand": brand, "model": model, "trims": car_trims(brand, model)}


@api.get("/meta/phone-brands")
async def meta_phone_brands():
    from catalogs import phone_brands
    return {"brands": phone_brands()}


@api.get("/meta/phone-models")
async def meta_phone_models(brand: str):
    from catalogs import phone_models
    return {"brand": brand, "models": phone_models(brand)}


@api.get("/meta/phone-variants")
async def meta_phone_variants(brand: str, model: str):
    from catalogs import phone_variants
    v = phone_variants(brand, model)
    return {"brand": brand, "model": model, **v}

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
    try:
        doc = await db.settings.find_one({"_key": "theme"}, {"_id": 0})
    except Exception:
        # Theme is a public bootstrap endpoint; a temporary database outage
        # must not blank the entire Web/Mobile shell.
        return DEFAULT_THEME
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
    # Convert ISO country code → international dial code so `phone_full` is a
    # real, dialable number (e.g. "+9665…" not "SA5…") used by tel: + wa.me.
    _DIAL_CODES = {
        "SA": "+966", "AE": "+971", "KW": "+965", "QA": "+974", "BH": "+973",
        "OM": "+968", "EG": "+20", "JO": "+962", "LB": "+961", "IQ": "+964",
        "SY": "+963", "YE": "+967", "PS": "+970", "MA": "+212", "DZ": "+213",
        "TN": "+216", "LY": "+218", "SD": "+249", "MR": "+222", "SO": "+252",
        "DJ": "+253", "KM": "+269", "TR": "+90", "PK": "+92", "IN": "+91",
        "BD": "+880", "ID": "+62", "MY": "+60", "US": "+1", "GB": "+44", "FR": "+33"
    }
    dial = _DIAL_CODES.get(body.country_code, f"+{body.country_code}")
    phone_full_value = f"{dial}{body.phone.lstrip('0')}"
    email = body.email.lower().strip()
    existing = await db.users.find_one({"$or": [{"email": email}, {"phone_full": phone_full_value}]})
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
        "phone_full": phone_full_value,
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
    if referred_by:
        cfg = await _economy_config()
        if cfg.get("referral_enabled", True):
            await db.referral_events.update_one(
                {"invitee_id": uid},
                {"$setOnInsert": {"id": str(uuid.uuid4()), "inviter_code": referred_by, "invitee_id": uid, "status": "pending", "reward_points": int(cfg.get("referral_coins", 25)), "country_code": body.country_code, "qualification": "email_verified", "created_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
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

    access, refresh, _ = await _create_auth_session(user, request, mfa_verified=False)
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    user.pop("mfa_secret", None)
    user.pop("mfa_recovery_hashes", None)
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
    if user.get("mfa_enabled"):
        challenge_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        await db.mfa_login_challenges.insert_one({
            "id": challenge_id, "user_id": user["id"], "created_at": now,
            "expires_at": now + timedelta(minutes=5), "used_at": None, **_session_metadata(request),
        })
        return {"mfa_required": True, "challenge_id": challenge_id, "expires_in": 300}
    access, refresh, _ = await _create_auth_session(user, request, mfa_verified=False)
    user.pop("password_hash", None)
    user.pop("_id", None)
    user.pop("mfa_secret", None)
    user.pop("mfa_recovery_hashes", None)
    user["mfa_session_verified"] = False
    user["admin_mfa_required"] = _admin_mfa_required_for(user)
    set_auth_cookies(response, access, refresh)
    # Production administrators without MFA receive a normal, restricted
    # account session so they can enroll; admin APIs remain blocked above.
    return {"user": user, "access_token": access, "refresh_token": refresh, "mfa_enrollment_required": bool(user["admin_mfa_required"] and not user.get("mfa_enabled"))}

@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("access_token") or request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM]) if token else {}
        if payload.get("sid"):
            await db.auth_sessions.update_one({"id": payload["sid"], "user_id": payload.get("sub"), "revoked_at": None}, {"$set": {"revoked_at": datetime.now(timezone.utc), "revoked_reason": "logout"}})
    except jwt.InvalidTokenError:
        pass
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
    requested_cc = str(body.country_code or "").strip().upper() if body.country_code is not None else ""
    if body.country_code is not None and requested_cc not in supported_country_codes():
        raise HTTPException(422, "يرجى اختيار دولة مدعومة")
    target_cc = requested_cc or country_code_or_default(user.get("country_code"), "SA")
    if body.country_code is not None:
        update["country_code"] = target_cc
    if body.name is not None:
        n = body.name.strip()
        if len(n) >= 2:
            update["name"] = n
    if body.phone is not None:
        raw_phone = (body.phone or "").strip()
        if raw_phone:
            local_phone, phone_full = _normalize_phone_for_country(target_cc, raw_phone)
            update["phone"] = local_phone
            update["phone_full"] = phone_full
            # A changed number must complete an OTP challenge before it can be
            # exposed on listings as the verified account contact.
            if phone_full != user.get("phone_full"):
                update["phone_verified"] = False
                update["phone_verified_at"] = None
    if body.city is not None:
        raw_city = body.city.strip()
        if raw_city:
            try:
                update["city"] = normalize_location(target_cc, raw_city, None)[0]
            except ValueError as exc:
                raise _country_policy_http_error(exc)
        else:
            update["city"] = ""
    elif body.country_code is not None and user.get("city") and not is_city_known_for_country(target_cc, user.get("city")):
        # Country changes do not carry a location across borders implicitly.
        update["city"] = ""
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

async def _security_event(user_id: str, event: str, request: Optional[Request] = None, meta: Optional[dict] = None):
    data = {"id": str(uuid.uuid4()), "user_id": user_id, "event": event, "at": datetime.now(timezone.utc), "meta": meta or {}}
    if request:
        data.update(_session_metadata(request))
    try:
        await db.security_events.insert_one(data)
    except Exception:
        logger.warning("security event write failed: %s", event)


@api.get("/auth/mfa/status")
async def mfa_status(user: dict = Depends(get_current_user)):
    secure = await db.users.find_one({"id": user["id"]}, {"_id": 0, "mfa_enabled": 1, "mfa_recovery_hashes": 1}) or {}
    return {"enabled": bool(secure.get("mfa_enabled")), "recovery_codes_remaining": len(secure.get("mfa_recovery_hashes") or [])}


@api.post("/auth/mfa/enroll")
async def mfa_enroll(request: Request, user: dict = Depends(get_current_user)):
    existing = await db.users.find_one({"id": user["id"]}, {"_id": 0, "mfa_enabled": 1}) or {}
    if existing.get("mfa_enabled"):
        raise HTTPException(409, "التحقق الثنائي مفعّل بالفعل؛ عطّله أولاً بعد التحقق")
    secret = _totp_secret()
    now = datetime.now(timezone.utc)
    await db.mfa_pending_enrollments.update_one(
        {"user_id": user["id"]},
        {"$set": {"id": str(uuid.uuid4()), "user_id": user["id"], "secret": _mfa_encrypt(secret), "created_at": now, "expires_at": now + timedelta(minutes=10), **_session_metadata(request)}},
        upsert=True,
    )
    label = quote(f"{MFA_ISSUER}:{user.get('email') or user['id']}")
    uri = f"otpauth://totp/{label}?secret={secret}&issuer={quote(MFA_ISSUER)}&algorithm=SHA1&digits=6&period=30"
    return {"secret": secret, "otpauth_uri": uri, "expires_in": 600}


@api.post("/auth/mfa/enroll/verify")
async def mfa_enroll_verify(body: MfaEnrollmentVerifyIn, request: Request, user: dict = Depends(get_current_user)):
    pending = await db.mfa_pending_enrollments.find_one({"user_id": user["id"], "expires_at": {"$gt": datetime.now(timezone.utc)}}, {"_id": 0})
    if not pending:
        raise HTTPException(400, "انتهت جلسة إعداد التحقق الثنائي؛ ابدأ من جديد")
    secret = _mfa_decrypt(pending.get("secret", ""))
    if not _verify_totp(secret, body.code):
        await _security_event(user["id"], "mfa_enrollment_failed", request)
        raise HTTPException(400, "رمز التحقق غير صحيح")
    recovery_codes = _new_recovery_codes()
    await db.users.update_one({"id": user["id"]}, {"$set": {"mfa_enabled": True, "mfa_secret": _mfa_encrypt(secret), "mfa_recovery_hashes": [_recovery_code_hash(c) for c in recovery_codes], "mfa_enabled_at": datetime.now(timezone.utc)}})
    await db.mfa_pending_enrollments.delete_many({"user_id": user["id"]})
    await _security_event(user["id"], "mfa_enabled", request)
    return {"enabled": True, "recovery_codes": recovery_codes}


@api.post("/auth/mfa/login/verify")
async def mfa_login_verify(body: MfaVerifyIn, request: Request, response: Response):
    now = datetime.now(timezone.utc)
    attempts = await db.mfa_attempts.count_documents({"challenge_id": body.challenge_id, "at": {"$gt": now - timedelta(minutes=15)}})
    if attempts >= 5:
        raise HTTPException(429, "تم قفل التحقق الثنائي مؤقتًا. حاول لاحقًا")
    challenge = await db.mfa_login_challenges.find_one({"id": body.challenge_id, "expires_at": {"$gt": now}, "used_at": None}, {"_id": 0})
    if not challenge:
        raise HTTPException(401, "رمز التحقق انتهى أو تم استخدامه")
    user = await db.users.find_one({"id": challenge["user_id"], "mfa_enabled": True}, {"_id": 0})
    if not user or not user.get("mfa_secret"):
        raise HTTPException(401, "التحقق الثنائي غير متاح للحساب")
    recovery_hash = _recovery_code_hash(body.code)
    used_recovery = recovery_hash in (user.get("mfa_recovery_hashes") or [])
    valid_totp = _verify_totp(_mfa_decrypt(user["mfa_secret"]), body.code) if not used_recovery else False
    if not (used_recovery or valid_totp):
        await db.mfa_attempts.insert_one({"challenge_id": body.challenge_id, "user_id": user["id"], "at": now, **_session_metadata(request)})
        await _security_event(user["id"], "mfa_login_failed", request)
        raise HTTPException(401, "رمز التحقق غير صحيح")
    used = await db.mfa_login_challenges.update_one({"id": body.challenge_id, "used_at": None}, {"$set": {"used_at": now}})
    if not used.modified_count:
        raise HTTPException(401, "تم استخدام طلب التحقق بالفعل")
    if used_recovery:
        await db.users.update_one({"id": user["id"]}, {"$pull": {"mfa_recovery_hashes": recovery_hash}})
    access, refresh, _ = await _create_auth_session(user, request, mfa_verified=True)
    set_auth_cookies(response, access, refresh)
    public_user = {k: v for k, v in user.items() if k not in {"_id", "password_hash", "mfa_secret", "mfa_recovery_hashes"}}
    public_user["mfa_session_verified"] = True
    public_user["admin_mfa_required"] = _admin_mfa_required_for(user)
    await _security_event(user["id"], "mfa_login_success", request, {"recovery_code": used_recovery})
    return {"user": public_user, "access_token": access, "refresh_token": refresh, "mfa_verified": True, "recovery_codes_remaining": len(user.get("mfa_recovery_hashes") or []) - int(used_recovery)}


@api.post("/auth/mfa/disable")
async def mfa_disable(body: MfaDisableIn, request: Request, user: dict = Depends(get_current_user)):
    secure = await db.users.find_one({"id": user["id"], "mfa_enabled": True}, {"_id": 0, "mfa_secret": 1, "mfa_recovery_hashes": 1})
    if not secure:
        raise HTTPException(409, "التحقق الثنائي غير مفعّل")
    is_recovery = _recovery_code_hash(body.code) in (secure.get("mfa_recovery_hashes") or [])
    if not is_recovery and not _verify_totp(_mfa_decrypt(secure.get("mfa_secret", "")), body.code):
        await _security_event(user["id"], "mfa_disable_failed", request)
        raise HTTPException(401, "رمز التحقق غير صحيح")
    await db.users.update_one({"id": user["id"]}, {"$set": {"mfa_enabled": False, "mfa_disabled_at": datetime.now(timezone.utc)}, "$unset": {"mfa_secret": "", "mfa_recovery_hashes": ""}})
    await db.auth_sessions.update_many({"user_id": user["id"], "revoked_at": None}, {"$set": {"revoked_at": datetime.now(timezone.utc), "revoked_reason": "mfa_disabled"}})
    await _security_event(user["id"], "mfa_disabled", request)
    return {"enabled": False, "reauth_required": True}


@api.post("/auth/mfa/recovery-codes")
async def mfa_recovery_codes(body: MfaDisableIn, request: Request, user: dict = Depends(get_current_user)):
    secure = await db.users.find_one({"id": user["id"], "mfa_enabled": True}, {"_id": 0, "mfa_secret": 1})
    if not secure or not _verify_totp(_mfa_decrypt(secure.get("mfa_secret", "")), body.code):
        raise HTTPException(401, "يلزم رمز التحقق الحالي لإنشاء رموز استرداد جديدة")
    recovery_codes = _new_recovery_codes()
    await db.users.update_one({"id": user["id"]}, {"$set": {"mfa_recovery_hashes": [_recovery_code_hash(c) for c in recovery_codes], "mfa_recovery_rotated_at": datetime.now(timezone.utc)}})
    await _security_event(user["id"], "mfa_recovery_codes_rotated", request)
    return {"recovery_codes": recovery_codes}


@api.get("/auth/sessions")
async def auth_sessions(request: Request, user: dict = Depends(get_current_user)):
    token = request.cookies.get("access_token") or request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    current_sid = ""
    try:
        current_sid = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM]).get("sid", "") if token else ""
    except jwt.InvalidTokenError:
        pass
    sessions = await db.auth_sessions.find({"user_id": user["id"], "revoked_at": None}, {"_id": 0, "refresh_jti": 0}).sort("last_seen_at", -1).to_list(length=100)
    return {"sessions": [{**s, "current": s.get("id") == current_sid} for s in sessions]}


@api.delete("/auth/sessions/{session_id}")
async def auth_session_revoke(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    changed = await db.auth_sessions.update_one({"id": session_id, "user_id": user["id"], "revoked_at": None}, {"$set": {"revoked_at": datetime.now(timezone.utc), "revoked_reason": "user_revoked"}})
    if not changed.modified_count:
        raise HTTPException(404, "الجلسة غير موجودة أو منتهية")
    await _security_event(user["id"], "session_revoked", request, {"session_id": session_id})
    return {"success": True}


@api.post("/auth/sessions/logout-all")
async def auth_sessions_logout_all(request: Request, user: dict = Depends(get_current_user)):
    result = await db.auth_sessions.update_many({"user_id": user["id"], "revoked_at": None}, {"$set": {"revoked_at": datetime.now(timezone.utc), "revoked_reason": "logout_all"}})
    await _security_event(user["id"], "logout_all", request, {"sessions": result.modified_count})
    return {"success": True, "revoked": result.modified_count}


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
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "mfa_secret": 0, "mfa_recovery_hashes": 0})
        if not user:
            raise HTTPException(401, "User not found")
        session_id = payload.get("sid")
        refresh_jti = payload.get("jti")
        if not session_id or not refresh_jti:
            raise HTTPException(401, "جلسة قديمة؛ سجّل الدخول مجددًا")
        access, new_refresh = await _rotate_auth_session(user, request, session_id, refresh_jti)
        set_auth_cookies(response, access, new_refresh)
        return {"access_token": access, "refresh_token": new_refresh}
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")


# ============================================================
# Phone validation rules per country
# ============================================================
COUNTRY_PHONE_CODES = {
    "SA": "+966", "AE": "+971", "KW": "+965", "QA": "+974", "BH": "+973",
    "OM": "+968", "EG": "+20", "JO": "+962", "LB": "+961", "IQ": "+964",
    "SY": "+963", "YE": "+967", "PS": "+970", "MA": "+212", "DZ": "+213",
    "TN": "+216", "LY": "+218", "SD": "+249", "TR": "+90", "PK": "+92",
    "IN": "+91", "BD": "+880", "ID": "+62", "MY": "+60", "US": "+1",
    "GB": "+44", "FR": "+33",
}

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


def _normalize_phone_for_country(country_code: str, raw_phone: str) -> tuple[str, str]:
    cc = country_code_or_default(country_code, "SA")
    local = re.sub(r"[^0-9]", "", str(raw_phone or ""))
    if local.startswith("00"):
        local = local[2:]
    prefix = COUNTRY_PHONE_CODES.get(cc, "+966")
    prefix_digits = prefix.lstrip("+")
    if local.startswith(prefix_digits):
        local = local[len(prefix_digits):]
    # Store local mobile digits without the national trunk prefix; E.164 is
    # derived consistently for every supported country, including Egypt.
    local = local.lstrip("0")
    if not validate_phone(cc, local):
        raise HTTPException(422, "رقم الجوال غير صحيح للدولة المحددة")
    return local, f"{prefix}{local.lstrip('0')}"


def _twilio_verify_configured() -> bool:
    return bool(os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN") and os.environ.get("TWILIO_VERIFY_SERVICE_SID"))


async def _twilio_verify_request(phone_full: str, *, code: Optional[str] = None) -> dict:
    """Perform Twilio Verify server-side only; never expose credentials to clients."""
    if not _twilio_verify_configured():
        raise HTTPException(503, "خدمة التحقق عبر الرسائل غير مهيأة حاليًا")
    account_sid = os.environ["TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["TWILIO_AUTH_TOKEN"]
    service_sid = os.environ["TWILIO_VERIFY_SERVICE_SID"]
    suffix = "VerificationCheck" if code is not None else "Verifications"
    data = {"To": phone_full, "Code": code} if code is not None else {"To": phone_full, "Channel": "sms"}
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                f"https://verify.twilio.com/v2/Services/{service_sid}/{suffix}",
                data=data,
                auth=(account_sid, auth_token),
            )
        parsed = response.json() if response.content else {}
    except httpx.HTTPError:
        raise HTTPException(503, "تعذر الاتصال بخدمة التحقق عبر الرسائل")
    if response.status_code >= 400:
        logger.warning("phone verification provider rejected request: %s", response.status_code)
        raise HTTPException(502, "تعذر إرسال أو التحقق من رمز الهاتف")
    return parsed if isinstance(parsed, dict) else {}


def _resolve_listing_contact_phone(user: dict, show_phone: bool, source: Optional[str], custom_phone: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Return safe persisted listing contact fields for account/custom contact."""
    if not show_phone:
        return None, None
    requested_source = (source or "account").strip().lower()
    if requested_source == "account":
        if not user.get("phone_verified") or not user.get("phone_full"):
            raise HTTPException(422, "أضف وتحقق من رقم هاتفك قبل استخدام رقم الحساب في الإعلان")
        return str(user["phone_full"]), "account"
    if requested_source != "custom":
        raise HTTPException(422, "مصدر رقم الاتصال غير صالح")
    normalized = re.sub(r"[^0-9+]", "", str(custom_phone or ""))
    if not re.fullmatch(r"\+[1-9][0-9]{6,14}", normalized):
        raise HTTPException(422, "أدخل رقم اتصال مخصصًا بصيغة دولية صحيحة")
    return normalized, "custom"


@api.post("/auth/phone-verification/start")
async def start_phone_verification(body: PhoneVerificationStartIn, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    requested_cc = str(body.country_code or active_cc).upper().strip()
    if requested_cc != active_cc:
        raise HTTPException(409, "غيّر الدولة النشطة قبل التحقق من رقم الهاتف")
    local_phone, phone_full = _normalize_phone_for_country(active_cc, body.phone)
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=15)
    attempts = await db.phone_verification_attempts.count_documents({"user_id": user["id"], "created_at": {"$gte": cutoff}})
    if attempts >= 3:
        raise HTTPException(429, "تم تجاوز حد إرسال الرموز. حاول بعد 15 دقيقة")
    await _twilio_verify_request(phone_full)
    await db.phone_verification_attempts.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "phone_full": phone_full,
        "country_code": active_cc, "created_at": now, "expires_at": now + timedelta(minutes=15),
    })
    await _security_event(user["id"], "phone_verification_started", meta={"country_code": active_cc})
    return {"sent": True, "phone_last4": local_phone[-4:], "expires_in": 600}


@api.post("/auth/phone-verification/confirm")
async def confirm_phone_verification(body: PhoneVerificationConfirmIn, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    requested_cc = str(body.country_code or active_cc).upper().strip()
    if requested_cc != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    local_phone, phone_full = _normalize_phone_for_country(active_cc, body.phone)
    result = await _twilio_verify_request(phone_full, code=body.code.strip())
    if str(result.get("status") or "").lower() != "approved":
        raise HTTPException(400, "رمز التحقق غير صحيح أو منتهي")
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "phone": local_phone, "phone_full": phone_full, "phone_verified": True,
        "phone_verified_at": now, "updated_at": now,
    }})
    await db.phone_verification_attempts.delete_many({"user_id": user["id"], "phone_full": phone_full})
    await _security_event(user["id"], "phone_verified", meta={"country_code": active_cc})
    verified_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return {"verified": True, "user": verified_user}


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
        backend = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
        redirect_uri = f"{backend}/api/auth/snapchat/callback"
    else:
        backend = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
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
    backend = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
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
    frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
    final_target = mob or f"{frontend_url}/auth/callback"
    sep = "?" if "?" not in final_target else "&"
    if error:
        return RedirectResponse(f"{final_target}{sep}error={error}")
    if not code or not state or not rec:
        return RedirectResponse(f"{final_target}{sep}error=invalid_state")
    if not SNAPCHAT_CLIENT_ID or not SNAPCHAT_CLIENT_SECRET:
        return RedirectResponse(f"{final_target}{sep}error=not_configured")
    backend = os.environ.get("BACKEND_PUBLIC_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
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
# Empty fallback — resolved dynamically at request time from request.base_url.
# Keeping it as an env-only value avoids breaking deployment on a new domain.
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "").strip()
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
async def google_oauth_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    """
    Google redirects here with ?code & ?state. We exchange the code for tokens,
    fetch the user profile, upsert in DB, set JWT cookies, then 302 → FRONTEND_URL.
    """
    frontend = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
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
    frontend = os.environ.get("FRONTEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
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
    q: dict = public_listing_filter_for_country(country_code, {"price": {"$gt": 0}})
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
    referral_events = await db.referral_events.find({"inviter_code": code}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(length=100)
    reward_points = sum(int(x.get("reward_points") or 0) for x in referral_events if x.get("status") in {"qualified", "rewarded"})
    badge = None
    if invited >= 25:
        badge = "موثّق ذهبي ⭐"
    elif invited >= 10:
        badge = "موثّق فضي 🥈"
    elif invited >= 5:
        badge = "موثّق برونزي 🥉"
    next_m = 5 if invited < 5 else (10 if invited < 10 else (25 if invited < 25 else None))
    return {"code": code, "invited_count": invited, "badge": badge, "next_milestone": next_m, "reward_points": reward_points, "qualified_count": sum(1 for x in referral_events if x.get("status") in {"qualified", "rewarded"}), "events": referral_events}

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
    if resource_type not in ("image", "video", "raw"):
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
def _normalize_auction_submission(custom_fields: Optional[dict], now_dt: Optional[datetime] = None) -> tuple[dict, Optional[str]]:
    """Normalize a new auction and enforce the one-week maximum server-side."""
    cf = dict(custom_fields or {})
    if not cf.get("auction_duration") and not (cf.get("end_time") or cf.get("auction_end_at")):
        now_dt = now_dt or datetime.now(timezone.utc)
        end_dt = now_dt + timedelta(days=7)
        cf["auction_duration"] = "7 أيام"
        cf["end_time"] = end_dt.isoformat()
        return cf, end_dt.isoformat()

    now_dt = now_dt or datetime.now(timezone.utc)
    duration_days = {
        "3 أيام": 3, "5 أيام": 5, "7 أيام": 7,
        "3 days": 3, "5 days": 5, "7 days": 7,
    }
    raw_duration = cf.get("auction_duration")
    raw_end = cf.get("end_time") or cf.get("auction_end_at")
    end_dt: Optional[datetime] = None
    if raw_duration:
        if isinstance(raw_duration, (int, float)):
            days = int(raw_duration)
        else:
            normalized_duration = str(raw_duration).strip().lower()
            days = duration_days.get(normalized_duration)
            if days is None:
                import re
                match = re.search(r"(\d+)", normalized_duration)
                days = int(match.group(1)) if match else None
        if not days or days < 1 or days > 7:
            raise HTTPException(400, "مدة المزاد يجب أن تكون بين يوم واحد و7 أيام كحد أقصى")
        end_dt = now_dt + timedelta(days=days)
    elif raw_end:
        try:
            end_dt = datetime.fromisoformat(str(raw_end).replace("Z", "+00:00"))
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            else:
                end_dt = end_dt.astimezone(timezone.utc)
        except (TypeError, ValueError):
            raise HTTPException(400, "وقت انتهاء المزاد غير صالح")
        if end_dt <= now_dt:
            raise HTTPException(400, "وقت انتهاء المزاد يجب أن يكون في المستقبل")
        if end_dt > now_dt + timedelta(days=7):
            raise HTTPException(400, "لا يمكن أن تتجاوز مدة المزاد 7 أيام")
    else:
        end_dt = now_dt + timedelta(days=7)
    cf["end_time"] = end_dt.isoformat()
    return cf, end_dt.isoformat()


def _validate_model_3d(custom_fields: Optional[dict]) -> None:
    """Accept only an uploaded/hosted GLB or GLTF asset; no fake conversion."""
    url = (custom_fields or {}).get("model_3d_url")
    if not url:
        return
    if not isinstance(url, str) or len(url) > 2048:
        raise HTTPException(400, "ملف 3D غير صالح")
    normalized = url.split("?", 1)[0].lower()
    if not (normalized.endswith(".glb") or normalized.endswith(".gltf") or "/raw/upload/" in normalized):
        raise HTTPException(400, "يجب رفع ملف GLB أو GLTF فقط")


def _validate_listing_media_for_user(user: dict, images: Optional[list], videos: Optional[list], custom_fields: Optional[dict]) -> None:
    """Validate listing-media cardinality and signed-upload ownership.

    The clients obtain Cloudinary signatures for `listings/<user-id>`. Once a
    Cloudinary account is configured, accepting another host, a different
    resource type, or a URL from another user's folder would permit attachment
    substitution. Legacy local/test environments with no configured cloud name
    keep the structural checks but do not require a production host.
    """
    image_urls = list(images or [])
    video_urls = list(videos or [])
    if len(image_urls) > 30 or len(video_urls) > 5:
        raise HTTPException(422, "تم تجاوز الحد الأقصى للصور أو الفيديوهات")
    model_url = (custom_fields or {}).get("model_3d_url")
    candidates = [(url, "image") for url in image_urls] + [(url, "video") for url in video_urls]
    if model_url:
        candidates.append((model_url, "raw"))
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
    expected_folder = f"/listings/{user.get('id', '')}/"
    from urllib.parse import urlparse
    for url, resource_type in candidates:
        if not isinstance(url, str) or len(url) > 2048:
            raise HTTPException(422, "رابط الوسائط غير صالح")
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            raise HTTPException(422, "يجب استخدام رابط وسائط HTTPS")
        if not cloud_name:
            continue
        expected_prefix = f"/{cloud_name}/{resource_type}/upload/"
        if parsed.netloc != "res.cloudinary.com" or expected_prefix not in parsed.path or expected_folder not in parsed.path:
            raise HTTPException(403, "الوسائط يجب أن تكون مرفوعة ضمن مساحة حسابك")


@api.post("/listings")
async def create_listing(body: ListingIn, user: dict = Depends(get_current_user)):
    if not body.category:
        raise HTTPException(400, "يجب اختيار الفئة قبل النشر")
    cat = next((c for c in CATEGORIES if c["key"] == body.category), None)
    if not cat:
        raise HTTPException(400, "فئة غير صالحة")
    custom_fields = dict(body.custom_fields or {})
    _validate_model_3d(custom_fields)
    _validate_listing_media_for_user(user, body.images, body.videos, custom_fields)
    auction_end_at: Optional[str] = None
    if body.category == "auctions":
        custom_fields, auction_end_at = _normalize_auction_submission(custom_fields)
    # The account's persisted country is the server-side active-country boundary.
    # A client may echo it in body.country_code, but cannot use that field to post
    # into a different marketplace without first switching its account preference.
    profile_cc = country_code_or_default(user.get("country_code"), "SA")
    requested_cc = str(body.country_code or "").upper().strip()
    if requested_cc and requested_cc not in supported_country_codes():
        raise HTTPException(422, "يرجى اختيار دولة مدعومة قبل النشر")
    if requested_cc and requested_cc != profile_cc and user.get("role") != "admin":
        raise HTTPException(409, "غيّر الدولة النشطة أولاً قبل نشر الإعلان")
    effective_cc = requested_cc if user.get("role") == "admin" and requested_cc else profile_cc
    try:
        canonical_city, canonical_district = normalize_location(effective_cc, body.city, body.district)
        canonical_currency, canonical_currency_code = normalize_currency(effective_cc, body.currency)
    except ValueError as exc:
        raise _country_policy_http_error(exc)
    resolved_contact_phone, resolved_contact_source = _resolve_listing_contact_phone(
        user, body.show_phone, body.contact_phone_source, body.contact_phone
    )
    listing_id = str(uuid.uuid4())
    mod_flags = detect_moderation_flags(f"{body.title} {body.description}")
    is_banned = bool(mod_flags)
    doc = {
        "id": listing_id,
        "user_id": user["id"],
        "title": body.title.strip(),
        "description": body.description.strip(),
        "price": body.price,
        "currency": canonical_currency,
        "currency_code": canonical_currency_code,
        "category": body.category,
        "subcategory": body.subcategory,
        "post_type": body.post_type,
        "custom_fields": custom_fields,
        "auction_end_at": auction_end_at,
        "images": body.images,
        "videos": body.videos,
        "country_code": effective_cc,
        "city": canonical_city,
        "district": canonical_district or None,
        "lat": body.lat,
        "lng": body.lng,
        "show_phone": body.show_phone,
        "contact_phone": resolved_contact_phone,
        "contact_phone_source": resolved_contact_source,
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

    # Advertise only public, approved inventory and invalidate the sitemap at
    # publish time. Pending moderation records are intentionally never announced.
    _refresh_listing_discovery(doc)
    if _listing_is_indexable(doc):
        asyncio.create_task(_generate_listing_seo_localizations(doc))

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

# ============================================================
# Make Offer — structured negotiation without leaving the listing
# ============================================================
@api.post("/listings/{listing_id}/offers")
async def create_listing_offer(listing_id: str, body: OfferIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    requested_cc = str(country_code or active_cc).upper().strip()
    if requested_cc != active_cc:
        raise HTTPException(409, "غيّر الدولة النشطة قبل تقديم عرض")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 0, "id": 1, "user_id": 1, "title": 1, "price": 1, "currency": 1, "status": 1})
    if not listing:
        raise HTTPException(404, "الإعلان غير موجود أو غير متاح")
    if listing.get("user_id") == user["id"]:
        raise HTTPException(400, "لا يمكنك تقديم عرض على إعلانك")
    if listing.get("status") not in (None, "active"):
        raise HTTPException(400, "الإعلان غير متاح للعروض")
    if body.client_offer_id:
        replay = await db.listing_offers.find_one({"listing_id": listing_id, "buyer_id": user["id"], "client_offer_id": body.client_offer_id}, {"_id": 0})
        if replay:
            if float(replay.get("amount") or 0) != float(body.amount) or str(replay.get("message") or "") != (body.message or "").strip():
                raise HTTPException(409, "مفتاح إعادة المحاولة مستخدم لعرض مختلف")
            replay["idempotent_replay"] = True
            return replay
    countered = await db.listing_offers.find_one({"listing_id": listing_id, "buyer_id": user["id"], "status": "countered"}, {"_id": 0, "id": 1})
    if countered:
        raise HTTPException(409, "لديك عرض مضاد مفتوح؛ اقبله أو ارفضه قبل تقديم عرض جديد")
    existing = await db.listing_offers.find_one({"listing_id": listing_id, "buyer_id": user["id"], "status": "pending"}, {"_id": 0})
    now_dt = datetime.now(timezone.utc)
    now = now_dt.isoformat()
    expires_at = (now_dt + timedelta(hours=body.expires_in_hours)).isoformat()
    offer = {
        "id": str(uuid.uuid4()), "listing_id": listing_id, "seller_id": listing["user_id"], "country_code": active_cc,
        "buyer_id": user["id"], "amount": float(body.amount), "original_amount": float(body.amount), "currency": listing.get("currency"),
        "message": (body.message or "").strip(), "status": "pending", "created_at": now, "updated_at": now,
        "expires_at": expires_at, "decision_at": None, "decision_by": None, "client_offer_id": body.client_offer_id,
        "action_history": [{"action": "create", "by": user["id"], "at": now, "amount": float(body.amount)}],
    }
    if existing:
        patch = {"amount": offer["amount"], "original_amount": offer["amount"], "message": offer["message"], "updated_at": now, "expires_at": expires_at, "client_offer_id": body.client_offer_id, "action_history": list(existing.get("action_history") or []) + [{"action": "revise", "by": user["id"], "at": now, "amount": offer["amount"]}]}
        await db.listing_offers.update_one({"id": existing["id"]}, {"$set": patch})
        offer = {**existing, **patch, "id": existing["id"]}
    else:
        await db.listing_offers.insert_one(offer)
    payload = {k: v for k, v in offer.items() if k != "_id"}
    try:
        asyncio.create_task(_send_user_notification(listing["user_id"], "عرض سعر جديد", f"تم تقديم عرض بقيمة {offer['amount']:,.0f} {listing.get('currency') or ''} على إعلانك", "listing_offer", f"/listing/{listing_id}", {"listing_id": listing_id, "offer_id": offer["id"]}))
        if "_chat_hub" in globals():
            asyncio.create_task(_chat_hub.send_to_user(listing["user_id"], {"type": "listing_offer", "data": payload}))
    except Exception:
        logger.debug("offer notification scheduling failed", exc_info=True)
    return payload

@api.get("/listings/{listing_id}/offers")
async def list_listing_offers(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 0, "user_id": 1})
    if not listing or listing.get("user_id") != user["id"]:
        raise HTTPException(403, "غير مصرح")
    return await db.listing_offers.find({"listing_id": listing_id}, {"_id": 0}).sort("updated_at", -1).to_list(length=200)

@api.get("/offers/mine")
async def my_listing_offers(role: str = "all", country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    if role not in ("all", "buyer", "seller"):
        raise HTTPException(400, "role must be all, buyer, or seller")
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    match = {"buyer_id": user["id"]} if role == "buyer" else {"seller_id": user["id"]} if role == "seller" else {"$or": [{"buyer_id": user["id"]}, {"seller_id": user["id"]}]}
    items = await db.listing_offers.find(match, {"_id": 0}).sort("updated_at", -1).limit(100).to_list(length=100)
    listing_ids = list({x.get("listing_id") for x in items if x.get("listing_id")})
    listings = {}
    if listing_ids:
        async for listing in db.listings.find(public_listing_filter_for_country(active_cc, {"id": {"$in": listing_ids}}), {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "images": {"$slice": 1}, "status": 1}):
            listings[listing["id"]] = listing
    visible_items = []
    now = datetime.now(timezone.utc)
    for item in items:
        listing = listings.get(item.get("listing_id"))
        if not listing:
            continue
        if item.get("status") in ("pending", "countered") and item.get("expires_at"):
            try:
                if datetime.fromisoformat(str(item["expires_at"]).replace("Z", "+00:00")) <= now:
                    item["status"] = "expired"
                    await db.listing_offers.update_one({"id": item["id"]}, {"$set": {"status": "expired", "updated_at": now.isoformat()}})
            except ValueError:
                pass
        item["listing"] = listing
        item["is_seller"] = item.get("seller_id") == user["id"]
        visible_items.append(item)
    return visible_items

@api.patch("/listing-offers/{offer_id}")
async def decide_listing_offer(offer_id: str, body: OfferDecisionIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    offer = await db.listing_offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(404, "العرض غير موجود")
    if user["id"] not in (offer.get("seller_id"), offer.get("buyer_id")):
        raise HTTPException(403, "غير مصرح")
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    listing = await db.listings.find_one({"id": offer.get("listing_id"), "country_code": active_cc}, {"_id": 1})
    if not listing:
        raise HTTPException(404, "العرض غير متاح في الدولة المختارة")
    if body.client_action_id and offer.get("client_action_id") == body.client_action_id:
        return {"success": True, "idempotent_replay": True, "offer_id": offer_id, "status": offer.get("status")}
    if offer.get("status") in ("accepted", "rejected", "expired"):
        raise HTTPException(409, "لا يمكن تعديل عرض مغلق")
    now_dt = datetime.now(timezone.utc)
    if offer.get("expires_at"):
        try:
            if datetime.fromisoformat(str(offer["expires_at"]).replace("Z", "+00:00")) <= now_dt:
                await db.listing_offers.update_one({"id": offer_id}, {"$set": {"status": "expired", "updated_at": now_dt.isoformat()}})
                raise HTTPException(409, "انتهت صلاحية العرض")
        except ValueError:
            pass
    is_seller = user["id"] == offer.get("seller_id")
    if offer.get("status") == "pending":
        if not is_seller or body.action not in ("accept", "reject", "counter"):
            raise HTTPException(403, "البائع فقط يستطيع اتخاذ قرار بشأن العرض الأولي")
    elif offer.get("status") == "countered":
        if is_seller or body.action not in ("accept", "reject"):
            raise HTTPException(403, "المشتري فقط يستطيع قبول أو رفض العرض المضاد")
    if body.action == "counter" and body.counter_amount is None:
        raise HTTPException(400, "يجب تحديد قيمة العرض المضاد")
    now = now_dt.isoformat()
    update = {"updated_at": now, "decision_at": now, "decision_by": user["id"], "decision_message": (body.message or "").strip(), "client_action_id": body.client_action_id}
    if body.action == "accept":
        update.update({"status": "accepted", "accepted_amount": float(offer.get("amount") or 0)})
    elif body.action == "reject":
        update["status"] = "rejected"
    else:
        update.update({"status": "countered", "amount": float(body.counter_amount), "counter_amount": float(body.counter_amount), "countered_by": user["id"], "expires_at": (now_dt + timedelta(hours=72)).isoformat()})
    update["action_history"] = list(offer.get("action_history") or []) + [{"action": body.action, "by": user["id"], "at": now, "amount": update.get("amount", offer.get("amount"))}]
    await db.listing_offers.update_one({"id": offer_id}, {"$set": update})
    recipient = offer["buyer_id"] if is_seller else offer["seller_id"]
    title = "تم قبول عرضك" if body.action == "accept" else "تم رفض العرض" if body.action == "reject" else "عرض مضاد جديد"
    try:
        asyncio.create_task(_send_user_notification(recipient, title, body.message or title, "listing_offer_update", f"/listing/{offer['listing_id']}", {"listing_id": offer["listing_id"], "offer_id": offer_id, "status": update["status"]}))
        if "_chat_hub" in globals():
            asyncio.create_task(_chat_hub.send_to_user(recipient, {"type": "listing_offer_update", "data": {"offer_id": offer_id, **update}}))
    except Exception:
        logger.debug("offer decision notification scheduling failed", exc_info=True)
    return {"success": True, "offer_id": offer_id, **update}

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

    # One shared policy keeps feeds, search, and autocomplete consistent.
    # Legacy records without moderation remain visible, while explicit pending,
    # rejected, demo, and test-seeded records stay out of public discovery.
    # Public discovery is never global. Missing country selection follows the
    # product default (SA), and explicit selection stays an exact equality.
    query: dict = public_listing_filter_for_country(country_code)
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
    query: dict = public_listing_filter_for_country(country_code, {"$text": {"$search": q.strip()}})
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
    base_query: dict = public_listing_filter_for_country(country_code)
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
async def track_click(listing_id: str, country_code: Optional[str] = None):
    """Lightweight click tracking, bounded to the active public country."""
    result = await db.listings.update_one(
        public_listing_filter_for_country(country_code, {"id": listing_id}),
        {"$inc": {"clicks": 1}},
    )
    return {"ok": True, "tracked": bool(result.modified_count)}


# ============================================================
# Personalization: recently-viewed history + saved searches.
# Uses Redis when available, falls back to Mongo. Per-user, capped at 20.
# ============================================================
@api.post("/listings/{listing_id}/view")
async def track_view(listing_id: str, request: Request, country_code: Optional[str] = None):
    """Record a viewed listing only when it belongs to the active public country."""
    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
        return {"ok": True, "tracked": False}
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
async def recent_listings(country_code: Optional[str] = None, user: dict = Depends(get_current_user), limit: int = 20):
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
    docs = await db.listings.find(public_listing_filter_for_country(country_code, {"id": {"$in": ids}}), SLIM).to_list(length=limit)
    # Preserve recently-viewed order.
    by_id = {d["id"]: d for d in docs}
    items = [by_id[i] for i in ids if i in by_id]
    return {"items": items, "total": len(items)}


class SavedSearchIn(BaseModel):
    q: str = Field(min_length=1, max_length=200)
    category: Optional[str] = None
    city: Optional[str] = None
    country_code: Optional[str] = None
    min_price: Optional[float] = Field(default=None, ge=0)
    max_price: Optional[float] = Field(default=None, ge=0)
    alerts_enabled: bool = True


@api.post("/search/save")
async def save_search(body: SavedSearchIn, user: dict = Depends(get_current_user)):
    """Persist an exact, country-scoped search and its optional alert preference."""
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    requested_cc = str(body.country_code or active_cc).upper().strip()
    if requested_cc != active_cc:
        raise HTTPException(409, "غيّر الدولة النشطة قبل حفظ البحث")
    if body.min_price is not None and body.max_price is not None and body.min_price > body.max_price:
        raise HTTPException(422, "الحد الأدنى لا يمكن أن يتجاوز الحد الأقصى")
    category = (body.category or "").strip() or None
    if category and category not in {str(item.get("key") or "") for item in CATEGORIES}:
        raise HTTPException(422, "التصنيف غير صالح")
    city = None
    if body.city and body.city.strip():
        try:
            city = normalize_location(active_cc, body.city, None)[0]
        except ValueError as exc:
            raise _country_policy_http_error(exc)
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": uuid.uuid4().hex, "user_id": user["id"], "q": body.q.strip(),
        "q_lower": body.q.strip().lower(), "category": category, "city": city,
        "country_code": active_cc, "min_price": body.min_price, "max_price": body.max_price,
        "alerts_enabled": bool(body.alerts_enabled), "created_at": now, "updated_at": now,
    }
    identity = {"user_id": user["id"], "country_code": active_cc, "q_lower": doc["q_lower"], "category": category, "city": city, "min_price": body.min_price, "max_price": body.max_price}
    existing = await db.saved_searches.find_one(identity, {"_id": 0, "id": 1})
    if existing:
        doc["id"] = existing["id"]
        doc["created_at"] = None
        await db.saved_searches.update_one({"id": existing["id"]}, {"$set": {k: v for k, v in doc.items() if k != "created_at"}})
    else:
        await db.saved_searches.insert_one(doc)
    return {"ok": True, "id": doc["id"], "country_code": active_cc}


@api.get("/search/saved")
async def list_saved_searches(country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    return await db.saved_searches.find({"user_id": user["id"], "country_code": active_cc}, {"_id": 0}).sort("updated_at", -1).to_list(length=50)


@api.get("/search/saved/{sid}/run")
async def run_saved_search(sid: str, country_code: Optional[str] = None, limit: int = 30, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    saved = await db.saved_searches.find_one({"id": sid, "user_id": user["id"], "country_code": active_cc}, {"_id": 0})
    if not saved:
        raise HTTPException(404, "البحث المحفوظ غير موجود")
    filters = {}
    if saved.get("category"):
        filters["category"] = saved["category"]
    if saved.get("city"):
        filters["city"] = saved["city"]
    if saved.get("min_price") is not None or saved.get("max_price") is not None:
        price = {}
        if saved.get("min_price") is not None:
            price["$gte"] = saved["min_price"]
        if saved.get("max_price") is not None:
            price["$lte"] = saved["max_price"]
        filters["price"] = price
    base = public_listing_filter_for_country(active_cc, filters)
    q_norm = normalize_arabic(saved.get("q") or "")
    if q_norm:
        base.setdefault("$and", []).append({"search_blob": {"$regex": re.escape(q_norm), "$options": "i"}})
    count = await db.listings.count_documents(base)
    items = await db.listings.find(base, {"_id": 0}).sort("created_at", -1).limit(max(1, min(limit, 100))).to_list(length=max(1, min(limit, 100)))
    return {"saved_search": saved, "items": items, "total": count}


@api.delete("/search/saved/{sid}")
async def delete_saved_search(sid: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    result = await db.saved_searches.delete_one({"id": sid, "user_id": user["id"], "country_code": active_cc})
    if not result.deleted_count:
        raise HTTPException(404, "البحث المحفوظ غير موجود")
    return {"ok": True}


# ============================================================
# Category follow — opt-in subscription to new listings in a category.
# ============================================================
@api.post("/follow/category/{name}")
async def follow_category(name: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    if name not in {str(item.get("key") or "") for item in CATEGORIES}:
        raise HTTPException(422, "التصنيف غير صالح")
    await db.category_follows.update_one(
        {"user_id": user["id"], "category": name, "country_code": active_cc},
        {"$set": {"user_id": user["id"], "category": name, "country_code": active_cc, "ts": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True, "following": True, "country_code": active_cc}

@api.delete("/follow/category/{name}")
async def unfollow_category(name: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    await db.category_follows.delete_one({"user_id": user["id"], "category": name, "country_code": active_cc})
    return {"ok": True, "following": False}

@api.get("/following")
async def list_following(country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    cats = await db.category_follows.find({"user_id": user["id"], "country_code": active_cc}, {"_id": 0, "category": 1, "country_code": 1, "ts": 1}).sort("ts", -1).to_list(length=200)
    sellers = await db.follows.find({"follower_id": user["id"], "country_code": active_cc}, {"_id": 0, "seller_id": 1, "country_code": 1, "ts": 1}).sort("ts", -1).to_list(length=200)
    seller_ids = [row.get("seller_id") for row in sellers if row.get("seller_id")]
    profiles = {}
    if seller_ids:
        async for profile in db.users.find({"id": {"$in": seller_ids}, "country_code": active_cc}, {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "verified": 1, "trust_score": 1}):
            profiles[profile["id"]] = profile
    sellers = [{**row, "seller": profiles.get(row.get("seller_id"))} for row in sellers if profiles.get(row.get("seller_id"))]
    return {"categories": cats, "sellers": sellers, "country_code": active_cc}


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
async def boost_listing(listing_id: str, user: dict = Depends(get_current_user), body: Optional[dict] = None):
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1, "is_boosted": 1, "boost_until": 1})
    if not item:
        raise HTTPException(404, "Listing not found")
    is_admin = user.get("role") == "admin"
    if item["user_id"] != user["id"] and not is_admin:
        raise HTTPException(403, "غير مصرح")
    now = datetime.now(timezone.utc)
    cfg = await _economy_config()
    product_id = str((body or {}).get("product_id") or "boost_24h").strip().lower()
    product = next((p for p in cfg.get("boost_products", []) if p.get("id") == product_id), None)
    if not product:
        raise HTTPException(422, "منتج الترويج غير متاح")
    cost, duration_hours, strength = int(product["cost"]), int(product["duration_hours"]), int(product.get("strength", 1))
    boost_until = (now + timedelta(hours=duration_hours)).isoformat()
    # Claim the boost atomically first. This prevents two concurrent taps from
    # both charging the same listing before either request observes is_boosted.
    claim = await db.listings.update_one(
        {"id": listing_id, "$or": [{"is_boosted": {"$ne": True}}, {"boost_until": {"$lte": now.isoformat()}}]},
        {"$set": {"is_boosted": True, "boost_until": boost_until, "boost_product_id": product_id, "boost_strength": strength, "boost_country_code": country_code_or_default(user.get("country_code"), "SA")}},
    )
    if not claim.modified_count:
        current = await db.listings.find_one({"id": listing_id}, {"_id": 0, "boost_until": 1}) or {}
        return {"ok": True, "is_boosted": True, "boost_until": current.get("boost_until"), "charged_coins": 0}
    charged = 0
    try:
        if not is_admin and cost:
            changed = await db.users.update_one({"id": user["id"], "coins_balance": {"$gte": cost}}, {"$inc": {"coins_balance": -cost}})
            if not changed.modified_count:
                raise HTTPException(402, f"رصيد الـCoins غير كافٍ لترويج الإعلان ({cost} Coins)")
            charged = cost
        if charged:
            key = str((body or {}).get("idempotency_key") or f"boost:{listing_id}:{product_id}:{boost_until[:13]}")[:160]
            await _coins_log(user["id"], "spend", -charged, "listing_boost", listing_id, key, {"product_id": product_id, "duration_hours": duration_hours, "strength": strength})
    except Exception:
        if charged:
            await db.users.update_one({"id": user["id"]}, {"$inc": {"coins_balance": charged}})
        await db.listings.update_one({"id": listing_id, "boost_until": boost_until}, {"$set": {"is_boosted": False}, "$unset": {"boost_until": ""}})
        raise
    _cache_invalidate()
    await _analytics_event("boost_purchased", user_id=user["id"], country_code=country_code_or_default(user.get("country_code"), "SA"), listing_id=listing_id, promotion_id=product_id)
    if charged:
        await _analytics_event("coins_spent", user_id=user["id"], country_code=country_code_or_default(user.get("country_code"), "SA"), listing_id=listing_id, promotion_id=product_id)
    return {"ok": True, "is_boosted": True, "boost_until": boost_until, "product_id": product_id, "strength": strength, "charged_coins": charged, "balance": await _coins_balance(user["id"])}

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


@api.get("/discovery/listings")
async def discovery_listings(
    country_code: Optional[str] = None,
    category: Optional[str] = Query(default=None, max_length=80),
    city: Optional[str] = Query(default=None, max_length=100),
    q: Optional[str] = Query(default=None, max_length=120),
    lang: Optional[str] = Query(default="ar", max_length=8),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None, max_length=120),
):
    """Read-only public inventory feed for search, comparison, and AI agents.

    The endpoint deliberately excludes contact details, private seller data, and
    every action that could alter a listing. It respects the marketplace country
    boundary and returns only the same public, approved inventory shown to users.
    """
    extra: dict = {}
    if category:
        extra["category"] = category.strip().lower()
    if city:
        extra["city"] = city.strip()
    if cursor:
        extra["created_at"] = {"$lt": cursor}
    if q:
        tokens = [token for token in normalize_arabic(q).split() if len(token) >= 2][:8]
        if tokens:
            extra["$and"] = [{"search_blob": {"$regex": re.escape(token), "$options": "i"}} for token in tokens]
    projection = {
        "_id": 0, "id": 1, "slug": 1, "title": 1, "description": 1,
        "price": 1, "currency": 1, "currency_code": 1, "category": 1,
        "subcategory": 1, "city": 1, "country_code": 1, "images": 1,
        "custom_fields": 1, "created_at": 1, "updated_at": 1,
        "seo_localizations": 1,
    }
    query = public_listing_filter_for_country(country_code, extra)
    items = await db.listings.find(query, projection).sort("created_at", -1).limit(limit + 1).to_list(length=limit + 1)
    has_more = len(items) > limit
    items = items[:limit]
    site = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "https://alhraj.online").rstrip("/")
    requested_language = str(lang or "ar").lower()
    payload = []
    for item in items:
        localized = _listing_seo_localization(item, requested_language)
        if localized and requested_language != "ar":
            item["title"] = localized["title"]
            item["description"] = localized["description"]
            item["content_language"] = requested_language
        else:
            item["content_language"] = "ar"
        ref = _listing_seo_ref(item)
        item["url"] = f"{site}/listing/{quote(ref, safe='-._~')}" if ref else None
        item["availability"] = "active"
        item["available_languages"] = _listing_seo_languages(item)
        item.pop("seo_localizations", None)
        # Defense in depth: the Mongo projection already excludes these, but the
        # public agent feed must stay safe if another data adapter changes it.
        for private_key in ("user_id", "seller", "contact_phone", "contact_phone_source", "show_phone", "phone", "phone_full", "email", "moderation_flags"):
            item.pop(private_key, None)
        payload.append(item)
    return JSONResponse(
        content=jsonable_encoder({
            "items": payload,
            "next_cursor": items[-1].get("created_at") if has_more and items else None,
            "count": len(payload),
            "country_code": country_code_or_default(country_code),
            "read_only": True,
        }),
        headers={
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
            "Vary": "Accept-Encoding",
            "X-Agent-Read-Only": "true",
        },
    )


@api.get("/listings/trending")
async def trending_listings(limit: int = 20, country_code: Optional[str] = None, days: int = 7):
    """Most-viewed active listings in the past `days`. Hard cap 20."""
    limit = max(1, min(limit, 20))
    cutoff = (datetime.now(timezone.utc) - timedelta(days=max(1, days))).isoformat()
    query: dict = public_listing_filter_for_country(country_code, {"created_at": {"$gte": cutoff}})
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
async def get_listing_by_slug(slug: str, request: Request, country_code: Optional[str] = None, lang: Optional[str] = None):
    """Resolve a listing by its SEO slug. Used by /listing/:slug URLs."""
    item = await db.listings.find_one(
        public_listing_filter_for_country(country_code, {"slug": slug}),
        {"_id": 0},
    )
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
    item["seo_available_languages"] = _listing_seo_languages(item)
    localized = _listing_seo_localization(item, lang or "ar")
    if localized and (lang or "ar").lower() != "ar":
        item["title"] = localized["title"]
        item["description"] = localized["description"]
        item["seo_content_language"] = (lang or "ar").lower()
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "country_code": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    # Decide which phone the seller actually exposes on THIS listing.
    if seller:
        if not item.get("show_phone", True):
            seller["phone_full"] = None
            seller["phone"] = None
        elif (item.get("contact_phone_source") == "custom") and item.get("contact_phone"):
            seller["phone_full"] = item["contact_phone"]
    item["seller"] = seller
    return JSONResponse(content=jsonable_encoder(item), headers={"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", "Vary": "Accept-Encoding", "X-Cache-Ready": "true"})


@api.get("/listings/{listing_id}/neighbors")
async def listing_neighbors(listing_id: str, country_code: Optional[str] = None):
    cc = str(country_code or "SA").strip().upper()
    current = await db.listings.find_one(
        public_listing_filter_for_country(cc, {"$or": [{"id": listing_id}, {"slug": listing_id}]}),
        {"_id": 0, "id": 1, "slug": 1, "category": 1, "country_code": 1, "created_at": 1},
    )
    if not current:
        raise HTTPException(404, "Listing not found")
    base = public_listing_filter_for_country(cc, {"category": current.get("category"), "id": {"$ne": current.get("id")}})
    stamp = current.get("created_at") or ""
    newer = await db.listings.find({**base, "created_at": {"$gt": stamp}}, {"_id": 0, "id": 1, "slug": 1, "title": 1}).sort("created_at", 1).limit(1).to_list(length=1)
    older = await db.listings.find({**base, "created_at": {"$lt": stamp}}, {"_id": 0, "id": 1, "slug": 1, "title": 1}).sort("created_at", -1).limit(1).to_list(length=1)
    return {"next": newer[0] if newer else None, "previous": older[0] if older else None, "country_code": cc, "category": current.get("category")}


@api.post("/listings/discovery-preview")
async def listing_discovery_preview(body: ListingDiscoveryPreviewIn, user: dict = Depends(get_current_user)):
    """Explain discovery readiness before publication without persisting or generating content."""
    draft = body.model_dump()
    draft["status"] = "active"
    draft["moderation"] = "approved"
    profile = _listing_discovery_profile(draft)
    return {
        "source_language": "ar",
        "available_languages": ["ar"],
        "preview": True,
        **profile,
    }


@api.get("/listings/{listing_id}/discovery-profile")
async def listing_discovery_profile(listing_id: str, user: dict = Depends(get_current_user)):
    """Private, explainable SEO/AEO readiness feedback for the listing owner."""
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "الإعلان غير موجود")
    if item.get("user_id") != user.get("id") and user.get("role") != "admin":
        raise HTTPException(403, "غير مصرح")
    profile = _listing_discovery_profile(item)
    return {
        "listing_id": listing_id,
        "source_language": "ar",
        "available_languages": _listing_seo_languages(item),
        **profile,
    }


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str, request: Request, country_code: Optional[str] = None, lang: Optional[str] = None):
    # Accept either UUID or slug for legacy/SEO URL compatibility
    item = await db.listings.find_one(
        public_listing_filter_for_country(country_code, {"$or": [{"id": listing_id}, {"slug": listing_id}]}),
        {"_id": 0},
    )
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
    item["seo_available_languages"] = _listing_seo_languages(item)
    localized = _listing_seo_localization(item, lang or "ar")
    if localized and (lang or "ar").lower() != "ar":
        item["title"] = localized["title"]
        item["description"] = localized["description"]
        item["seo_content_language"] = (lang or "ar").lower()
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "country_code": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    if seller:
        if not item.get("show_phone", True):
            seller["phone_full"] = None
            seller["phone"] = None
        elif (item.get("contact_phone_source") == "custom") and item.get("contact_phone"):
            seller["phone_full"] = item["contact_phone"]
    item["seller"] = seller
    item["like_count"] = await db.listing_likes.count_documents({"listing_id": item["id"]})
    item["comment_count"] = await db.listing_comments.count_documents({"listing_id": item["id"], "deleted": {"$ne": True}})
    return JSONResponse(content=jsonable_encoder(item), headers={"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", "Vary": "Accept-Encoding", "X-Cache-Ready": "true"})

@api.get("/listings/{listing_id}/like/check")
async def check_listing_like(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="عرض الإعجاب")
    if not await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 1}):
        raise HTTPException(404, "الإعلان غير موجود")
    return {"liked": bool(await db.listing_likes.find_one({"listing_id": listing_id, "user_id": user["id"]}, {"_id": 1}))}
@api.post("/listings/{listing_id}/like")
async def toggle_listing_like(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="تسجيل إعجاب")
    if not await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 1}):
        raise HTTPException(404, "الإعلان غير موجود")
    existing = await db.listing_likes.find_one({"listing_id": listing_id, "user_id": user["id"]})
    if existing:
        await db.listing_likes.delete_one({"listing_id": listing_id, "user_id": user["id"]})
        liked = False
    else:
        await db.listing_likes.insert_one({"id": uuid.uuid4().hex, "listing_id": listing_id, "user_id": user["id"], "created_at": datetime.now(timezone.utc).isoformat()})
        liked = True
    return {"liked": liked, "like_count": await db.listing_likes.count_documents({"listing_id": listing_id})}

@api.get("/listings/{listing_id}/comments")
async def list_listing_comments(listing_id: str, country_code: Optional[str] = None, limit: int = 50, before: Optional[str] = None):
    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
        raise HTTPException(404, "الإعلان غير موجود")
    limit = max(1, min(limit, 100))
    query = {"listing_id": listing_id, "deleted": {"$ne": True}}
    if before:
        query["created_at"] = {"$lt": before}
    comments = await db.listing_comments.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    author_ids = list({c.get("user_id") for c in comments if c.get("user_id")})
    authors = {}
    if author_ids:
        async for author in db.users.find({"id": {"$in": author_ids}}, {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "verified": 1}):
            authors[author["id"]] = author
    for comment in comments:
        comment["author"] = authors.get(comment.get("user_id"), {"name": "مستخدم"})
    return {"items": comments, "total": await db.listing_comments.count_documents({"listing_id": listing_id, "deleted": {"$ne": True}})}

@api.post("/listings/{listing_id}/comments")
async def create_listing_comment(listing_id: str, body: ListingCommentIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="إضافة تعليق")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 0, "id": 1, "user_id": 1, "title": 1, "country_code": 1})
    if not listing:
        raise HTTPException(404, "الإعلان غير موجود في الدولة المختارة")
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    if await db.listing_comments.count_documents({"user_id": user["id"], "created_at": {"$gte": cutoff}}) >= 10:
        raise HTTPException(429, "محاولات التعليق كثيرة، حاول لاحقًا")
    parent = None
    if body.parent_id:
        parent = await db.listing_comments.find_one({"id": body.parent_id, "listing_id": listing_id, "deleted": {"$ne": True}}, {"_id": 0})
        if not parent:
            raise HTTPException(404, "التعليق الأصلي غير موجود أو محذوف")
    recipient_id = (parent or {}).get("user_id") or listing.get("user_id")
    if recipient_id and recipient_id != user["id"]:
        blocked = await db.blocks.find_one({"$or": [{"blocker_id": user["id"], "blocked_id": recipient_id}, {"blocker_id": recipient_id, "blocked_id": user["id"]}]}, {"_id": 1})
        if blocked:
            raise HTTPException(403, "التعليق غير متاح لهذه العلاقة")
    now = datetime.now(timezone.utc).isoformat()
    if body.client_comment_id:
        existing = await db.listing_comments.find_one({"listing_id": listing_id, "user_id": user["id"], "client_comment_id": body.client_comment_id, "deleted": {"$ne": True}}, {"_id": 0})
        if existing:
            existing["author"] = {"id": user["id"], "name": user.get("name") or "مستخدم", "avatar_url": user.get("avatar_url"), "verified": bool(user.get("verified"))}
            return existing
    comment = {"id": uuid.uuid4().hex, "listing_id": listing_id, "country_code": active_cc, "user_id": user["id"], "text": body.text.strip(), "parent_id": body.parent_id, "client_comment_id": body.client_comment_id, "created_at": now, "updated_at": now, "deleted": False}
    await db.listing_comments.insert_one(comment)
    comment["author"] = {"id": user["id"], "name": user.get("name") or "مستخدم", "avatar_url": user.get("avatar_url"), "verified": bool(user.get("verified"))}
    if recipient_id and recipient_id != user["id"]:
        ntype = "comment_reply" if parent else "comment"
        route = f"/listing/{listing_id}?focus=comments&comment={comment['id']}#comments"
        title = "رد جديد على تعليقك" if parent else "تعليق جديد على إعلانك"
        asyncio.create_task(_send_user_notification(recipient_id, title, (user.get("name") or "مستخدم") + ": " + comment["text"][:120], ntype, route, {"entity": "comment", "entity_id": comment["id"], "listing_id": listing_id, "comment_id": comment["id"], "parent_id": body.parent_id, "user_id": user["id"], "country_code": active_cc}, pref_key="comments"))
    return comment

@api.post("/listing-comments/{comment_id}/report")
async def report_listing_comment(comment_id: str, body: CommentReportIn, user: dict = Depends(get_current_user)):
    comment = await db.listing_comments.find_one({"id": comment_id, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "listing_id": 1, "user_id": 1, "country_code": 1})
    if not comment:
        raise HTTPException(404, "التعليق غير موجود")
    if comment.get("user_id") == user["id"]:
        raise HTTPException(400, "لا يمكنك الإبلاغ عن تعليقك")
    if country_code_or_default(comment.get("country_code"), "SA") != country_code_or_default(user.get("country_code"), "SA"):
        raise HTTPException(409, "التعليق خارج الدولة النشطة")
    rid = str(uuid.uuid4())
    await db.reports.insert_one({"id": rid, "reporter_id": user["id"], "target_type": "comment", "target_id": comment_id, "reason": body.reason.strip(), "status": "open", "created_at": datetime.now(timezone.utc).isoformat(), "listing_id": comment.get("listing_id"), "reported_user_id": comment.get("user_id")})
    return {"id": rid, "success": True}

@api.delete("/listing-comments/{comment_id}")
async def delete_listing_comment(comment_id: str, user: dict = Depends(get_current_user)):
    comment = await db.listing_comments.find_one({"id": comment_id}, {"_id": 0, "user_id": 1})
    if not comment:
        raise HTTPException(404, "التعليق غير موجود")
    if comment.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "غير مصرح")
    await db.listing_comments.update_one({"id": comment_id}, {"$set": {"deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}})
    return {"ok": True}

@api.get("/listings/{listing_id}/similar")
async def similar_listings(listing_id: str, limit: int = 12, country_code: Optional[str] = None):
    base = await db.listings.find_one(
        public_listing_filter_for_country(country_code, {"id": listing_id}),
        {"_id": 0},
    )
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
            public_listing_filter_for_country(country_code, {"category": base_category, "city": base_city, "id": {"$ne": listing_id}}),
            {"_id": 0}
        ).limit(limit).to_list(length=limit)
        if len(same_city) < limit:
            more = await db.listings.find(
                public_listing_filter_for_country(country_code, {"category": base_category, "city": {"$ne": base_city}, "id": {"$ne": listing_id}}),
                {"_id": 0}
            ).limit(limit - len(same_city)).to_list(length=limit)
            same_city.extend(more)
        return same_city

    # Build OR query: any candidate listing whose title contains any base token,
    # OR whose description contains any base token, plus same category as a soft filter.
    title_re = "|".join(re.escape(t) for t in base_tokens)
    candidates = await db.listings.find(
        public_listing_filter_for_country(country_code, {
            "id": {"$ne": listing_id},
            "$or": [
                {"title": {"$regex": title_re, "$options": "i"}},
                {"description": {"$regex": title_re, "$options": "i"}},
                {"category": base_category},
            ],
        }),
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
        "models": [((item.get("custom_fields") or {}).get("model_3d_url"))] if (item.get("custom_fields") or {}).get("model_3d_url") else [],
    }
    await db.listings.delete_one({"id": listing_id})
    related_deleted = await _delete_listing_related_records(listing_id)
    _cache_invalidate()
    # Fire-and-forget Cloudinary cleanup so the API response stays fast.
    asyncio.create_task(_cleanup_listing_media(listing_id, media_to_clean))
    # Remove the canonical listing URL from the next sitemap and queue a
    # best-effort deindex signal. The user-facing deletion never waits for it.
    _refresh_listing_discovery(item, removed=True)
    return {
        "success": True,
        "media_queued": sum(len(v) for v in media_to_clean.values()),
        "media_queued_by_type": {k: len(v) for k, v in media_to_clean.items()},
        "related_deleted": related_deleted,
    }


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
    summary = {        "images_deleted": 0, "videos_deleted": 0, "models_deleted": 0, "failed": 0, "details": []}
    images = media.get("images") or []
    videos = media.get("videos") or []
    models = media.get("models") or []
    for url in images + videos + models:
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
            elif url in models:
                summary["models_deleted"] += 1
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


async def _delete_listing_related_records(listing_id: str) -> dict:
    """Remove dependent marketplace records after a listing is deleted.
    Media is handled separately by the Cloudinary cleanup queue.
    """
    deleted = {}
    targets = {
        "listing_offers": {"listing_id": listing_id},
        "listing_comments": {"listing_id": listing_id},
        "listing_likes": {"listing_id": listing_id},
        "favorites": {"listing_id": listing_id},
        "watches": {"listing_id": listing_id},
        "recently_viewed": {"listing_id": listing_id},
        "reports": {"target_type": "listing", "target_id": listing_id},
        "bids": {"listing_id": listing_id},
        "price_alerts": {"listing_id": listing_id},
        "messages": {"listing_id": listing_id},
    }
    for collection_name, query in targets.items():
        try:
            result = await getattr(db, collection_name).delete_many(query)
            deleted[collection_name] = int(result.deleted_count or 0)
        except Exception as exc:
            logger.warning(f"[listing-delete] dependent cleanup failed collection={collection_name}: {exc}")
            deleted[collection_name] = 0
    return deleted


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


def _auction_end_datetime(listing: dict) -> Optional[datetime]:
    """Read the legacy and current auction closing fields consistently."""
    cf = listing.get("custom_fields") or {}
    meta = listing.get("auction_meta") or {}
    raw = (listing.get("auction_end_at") or listing.get("end_time")
           or listing.get("closes_at") or cf.get("end_time")
           or meta.get("end_time") or cf.get("auction_end_at")
           or cf.get("end_date"))
    if not raw:
        return None
    try:
        text = str(raw).strip()
        # Legacy forms stored only YYYY-MM-DD. Treat that date as ending at
        # 23:59:59 UTC so old auctions cannot remain active indefinitely.
        if len(text) == 10 and text[4] == "-" and text[7] == "-":
            value = datetime.strptime(text, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
            )
        else:
            value = datetime.fromisoformat(text.replace("Z", "+00:00"))
            value = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
        return value
    except (TypeError, ValueError):
        return None


@api.get("/auctions/active")
async def active_auctions(country_code: Optional[str] = None, limit: int = 30):
    limit = max(1, min(limit, 20))
    q: dict = public_listing_filter_for_country(country_code, {"category": "auctions"})
    candidates = await db.listings.find(q, {"_id": 0}).sort("created_at", -1).limit(min(60, limit * 3)).to_list(length=min(60, limit * 3))
    items = []
    now = datetime.now(timezone.utc)
    for it in candidates:
        end_dt = _auction_end_datetime(it)
        if end_dt and end_dt <= now:
            await db.listings.update_one({"id": it["id"], "status": "active"}, {"$set": {"status": "ended", "ended_at": now.isoformat()}})
            continue
        items.append(it)
        if len(items) >= limit:
            break
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
async def auction_bids(listing_id: str, country_code: Optional[str] = None, limit: int = 20):
    listing = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id, "category": "auctions"}), {"_id": 0})
    if not listing:
        raise HTTPException(404, "المزاد غير موجود")
    limit = max(1, min(limit, 100))
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
    country_code = websocket.query_params.get("country_code")
    listing_guard = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id, "category": "auctions"}), {"_id": 0})
    if not listing_guard:
        await websocket.close(code=1008)
        return
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
async def place_bid(listing_id: str, body: BidIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="المزايدة")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id, "category": "auctions"}), {"_id": 0})
    if not listing:
        raise HTTPException(404, "الإعلان غير موجود")
    if listing.get("user_id") == user["id"]:
        raise HTTPException(400, "لا يمكنك المزايدة على إعلانك")
    end_dt = _auction_end_datetime(listing)
    if end_dt and end_dt <= datetime.now(timezone.utc):
        await db.listings.update_one({"id": listing_id, "status": "active"}, {"$set": {"status": "ended", "ended_at": datetime.now(timezone.utc).isoformat()}})
        raise HTTPException(409, "انتهى وقت المزاد")
    if listing.get("status") != "active":
        raise HTTPException(400, "المزاد منتهي")
    # Check current top bid
    top = await db.bids.find_one({"listing_id": listing_id}, {"_id": 0}, sort=[("amount", -1)])
    # Owner-defined min increment per bid (e.g. 500 SAR). The owner enters this
    # under `custom_fields.bid_increment` in the post form. Fall back to a few
    # legacy aliases for safety.
    auction_meta = listing.get("auction_meta") or {}
    cf = listing.get("custom_fields") or {}
    min_increment = (
        cf.get("bid_increment")
        or cf.get("min_increment")
        or auction_meta.get("min_increment")
        or auction_meta.get("bid_increment")
        or listing.get("min_increment")
        or listing.get("bid_increment")
        or 1
    )
    try:
        min_increment = float(min_increment) if min_increment else 1
        if min_increment < 1:
            min_increment = 1
    except (TypeError, ValueError):
        min_increment = 1
    current = top["amount"] if top else (listing.get("price") or 0)
    min_required = current + min_increment
    if body.amount < min_required:
        # Format with thousand separators — avoids `2.05e+06`-style scientific
        # notation for large auctions like cars/real-estate.
        raise HTTPException(
            400,
            f"الحد الأدنى للمزايدة: {min_required:,.0f} (زيادة لا تقل عن {min_increment:,.0f})"
        )
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
    # ---- Anti-snipe: if this bid lands within the last 60 seconds of the
    # auction window, automatically push `end_time` forward by 60 seconds so
    # other bidders get a fair chance to respond. We update the `custom_fields.
    # end_time` ISO string and broadcast the new closing time to all watchers.
    extended_to: Optional[str] = None
    try:
        end_iso = (cf.get("end_time") or auction_meta.get("end_time")
                   or listing.get("end_time") or listing.get("closes_at"))
        if end_iso:
            # Tolerate both with/without timezone. fromisoformat handles most cases.
            end_dt = datetime.fromisoformat(str(end_iso).replace("Z", "+00:00"))
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            seconds_left = (end_dt - now).total_seconds()
            if 0 < seconds_left < 60:
                new_end = now + timedelta(seconds=60)
                extended_to = new_end.isoformat()
                # Write back in the same place we read it from so the form
                # round-trips correctly. We update both keys for safety.
                update_doc = {"custom_fields.end_time": extended_to}
                if "end_time" in (auction_meta or {}):
                    update_doc["auction_meta.end_time"] = extended_to
                await db.listings.update_one({"id": listing_id}, {"$set": update_doc})
    except Exception as _e:
        # Anti-snipe is a non-critical enhancement — never block a valid bid.
        logger.warning(f"[anti-snipe] {_e}")
    # Live fan-out — every connected watcher sees the new bid within <100ms.
    count = await db.bids.count_documents({"listing_id": listing_id})
    event = {
        "type": "bid",
        "bid": bid,
        "bid_count": count,
    }
    if extended_to:
        event["extended_to"] = extended_to
    asyncio.create_task(_broadcast_auction_event(listing_id, event))
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
    q: dict = public_listing_filter_for_country(country_code, {"lat": {"$ne": None}, "lng": {"$ne": None}})
    if category:
        q["category"] = category
    items = await db.listings.find(q, {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "category": 1, "city": 1, "country_code": 1, "lat": 1, "lng": 1, "images": 1}).limit(limit).to_list(length=limit)
    return items


# ============================================================
# Favorites
# ============================================================
@api.post("/favorites/{listing_id}")
async def toggle_favorite(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Toggle favorite (web frontend uses this as a toggle). Mobile uses the
    paired POST/DELETE pattern with `data.favorited` checked optimistically."""
    active_cc = _require_active_country(user, country_code, action="إضافة المفضلة")
    if not await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 1}):
        raise HTTPException(404, "الإعلان غير موجود")
    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id})
    if existing:
        await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
        await db.listings.update_one({"id": listing_id, "favorites": {"$gt": 0}}, {"$inc": {"favorites": -1}})
        return {"favorited": False}
    await db.favorites.insert_one({
        "user_id": user["id"], "listing_id": listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.listings.update_one({"id": listing_id}, {"$inc": {"favorites": 1}})
    return {"favorited": True}

@api.delete("/favorites/{listing_id}")
async def delete_favorite(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Explicit unfavorite (idempotent). Mobile ListingCard + ReelsScreen call
    DELETE on unlike instead of relying on toggle semantics."""
    active_cc = _require_active_country(user, country_code, action="إزالة المفضلة")
    if not await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 1}):
        return {"favorited": False}
    res = await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
    if res.deleted_count:
        await db.listings.update_one({"id": listing_id, "favorites": {"$gt": 0}}, {"$inc": {"favorites": -1}})
    return {"favorited": False}

@api.get("/favorites/{listing_id}/check")
async def check_favorite(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="عرض المفضلة")
    if not await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 1}):
        return {"favorited": False}
    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id})
    return {"favorited": bool(existing)}

@api.get("/favorites")
async def list_favorites(country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="عرض المفضلة")
    favs = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=500)
    listing_ids = [f["listing_id"] for f in favs]
    listings = await db.listings.find(public_listing_filter_for_country(active_cc, {"id": {"$in": listing_ids}}), {"_id": 0}).to_list(length=500)
    return listings


# ============================================================
# Price Alerts — notify a user when a listing's price drops below a target.
# Lightweight: stored in `price_alerts` collection, checked on every PUT to
# /listings/{id}. No background poller needed.
# ============================================================
@api.post("/price-alerts/{listing_id}")
async def create_price_alert(listing_id: str, payload: dict, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="إنشاء تنبيه سعر")
    target = float(payload.get("target_price") or 0)
    if target <= 0:
        raise HTTPException(400, "target_price required")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 0, "id": 1, "price": 1, "title": 1, "country_code": 1})
    if not listing:
        raise HTTPException(404, "Listing not found")
    doc = {
        "id": uuid.uuid4().hex,
        "user_id": user["id"],
        "listing_id": listing_id,
        "country_code": active_cc,
        "target_price": target,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "current_price": listing.get("price"),
        "title": listing.get("title"),
    }
    # Upsert by (user, listing) — one alert per user per listing.
    await db.price_alerts.update_one(
        {"user_id": user["id"], "listing_id": listing_id, "country_code": active_cc},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "alert": doc}

@api.get("/price-alerts")
async def list_price_alerts(country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="عرض تنبيهات السعر")
    items = await db.price_alerts.find({"user_id": user["id"], "country_code": active_cc}, {"_id": 0}).to_list(length=200)
    return items

@api.delete("/price-alerts/{listing_id}")
async def delete_price_alert(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = _require_active_country(user, country_code, action="إزالة تنبيه السعر")
    await db.price_alerts.delete_one({"user_id": user["id"], "listing_id": listing_id, "country_code": active_cc})
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


@api.get("/voice/ice-servers")
async def voice_ice_servers(user: dict = Depends(get_current_user)):
    """Return WebRTC ICE servers for authenticated callers.

    Render hosts signaling. STUN is always available for direct P2P calls.
    Optional TURN credentials are supplied only through TURN_ICE_SERVERS_JSON
    on the backend, never committed to source or exposed to anonymous users.
    """
    servers = [{"urls": "stun:stun.l.google.com:19302"}]
    raw = (os.environ.get("TURN_ICE_SERVERS_JSON") or "").strip()
    turn_config_error = False
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                for item in parsed:
                    if not isinstance(item, dict) or not item.get("urls"):
                        continue
                    safe = {"urls": item["urls"]}
                    if item.get("username") is not None:
                        safe["username"] = item["username"]
                    if item.get("credential") is not None:
                        safe["credential"] = item["credential"]
                    servers.append(safe)
        except Exception:
            turn_config_error = True
            logger.warning("Invalid TURN_ICE_SERVERS_JSON; using STUN only")
    relay_configured = any(str(url).startswith(("turn:", "turns:")) for server in servers for url in (server.get("urls") if isinstance(server.get("urls"), list) else [server.get("urls")]))
    return {"ice_servers": servers, "relay_configured": relay_configured, "turn_config_error": turn_config_error}


_CALL_SIGNAL_TYPES = {"call_invite", "call_offer", "call_answer", "call_ice", "call_reject", "call_hangup"}
_CALL_TERMINAL_STATES = {"rejected", "ended", "missed", "failed"}
_CALL_SIGNAL_MAX_BYTES = 64 * 1024


def _valid_call_id(call_id: object) -> bool:
    return isinstance(call_id, str) and 8 <= len(call_id) <= 128 and re.fullmatch(r"[A-Za-z0-9_-]+", call_id) is not None


async def _authorize_call_signal(sender_id: str, target_id: str, convo_id: str, call_id: str, event_type: str) -> Optional[dict]:
    """Authorize and transition a WebRTC signal without trusting browser payloads.

    Signaling remains intentionally lightweight, but every event is tied to the
    persisted two-party conversation, active country, block policy and a short
    lived server-side call session.  Media never touches this service.
    """
    if event_type not in _CALL_SIGNAL_TYPES or not _valid_call_id(call_id):
        return None
    expected_participants = sorted([sender_id, target_id])
    conversation = await db.conversations.find_one(
        {"id": convo_id, "participants": {"$all": expected_participants, "$size": 2}},
        {"_id": 0, "id": 1, "participants": 1, "country_code": 1},
    )
    if not conversation or sorted(conversation.get("participants") or []) != expected_participants:
        return None
    users = await db.users.find({"id": {"$in": expected_participants}}, {"_id": 0, "id": 1, "country_code": 1, "banned": 1}).to_list(length=2)
    if len(users) != 2 or any(item.get("banned") for item in users):
        return None
    countries = {country_code_or_default(item.get("country_code"), "SA") for item in users}
    conversation_country = country_code_or_default(conversation.get("country_code"), next(iter(countries)))
    if len(countries) != 1 or conversation_country not in countries:
        return None
    blocked = await db.blocks.find_one({"$or": [{"blocker_id": sender_id, "blocked_id": target_id}, {"blocker_id": target_id, "blocked_id": sender_id}]}, {"_id": 0, "blocker_id": 1})
    if blocked:
        return None

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    session = await db.call_sessions.find_one({"id": call_id}, {"_id": 0})
    if event_type == "call_invite":
        if session:
            # A retry may repeat the invitation but cannot replace its pair or revive a terminal call.
            if session.get("caller_id") != sender_id or session.get("callee_id") != target_id or session.get("convo_id") != convo_id or session.get("status") in _CALL_TERMINAL_STATES:
                return None
            return session
        session = {
            "id": call_id, "convo_id": convo_id, "caller_id": sender_id, "callee_id": target_id,
            "country_code": conversation_country, "status": "ringing", "created_at": now_iso,
            # Signaling is persisted only for the short-lived call session so a
            # recipient opened from an incoming push can recover SDP/ICE that
            # was emitted while its chat WebSocket was offline.
            "pending_signals": [],
            "updated_at": now_iso, "expires_at": (now + timedelta(seconds=45)).isoformat(),
        }
        await db.call_sessions.insert_one(session)
        return session

    if not session or session.get("convo_id") != convo_id:
        return None
    if {session.get("caller_id"), session.get("callee_id")} != {sender_id, target_id}:
        return None
    if session.get("status") in _CALL_TERMINAL_STATES:
        return None
    if session.get("expires_at") and session["expires_at"] < now_iso and session.get("status") == "ringing":
        await db.call_sessions.update_one({"id": call_id}, {"$set": {"status": "missed", "ended_at": now_iso, "updated_at": now_iso, "end_reason": "invite_expired"}})
        return None
    if event_type == "call_offer" and sender_id != session.get("caller_id"):
        return None
    if event_type in {"call_answer", "call_reject"} and sender_id != session.get("callee_id"):
        return None

    updates = {"updated_at": now_iso}
    if event_type == "call_offer":
        updates["status"] = "offered"
    elif event_type == "call_answer":
        updates.update({"status": "connected", "accepted_at": now_iso})
    elif event_type == "call_reject":
        updates.update({"status": "rejected", "ended_at": now_iso, "end_reason": "rejected"})
    elif event_type == "call_hangup":
        updates.update({"status": "ended", "ended_at": now_iso, "end_reason": "hangup"})
    if event_type != "call_ice":
        await db.call_sessions.update_one({"id": call_id}, {"$set": updates})
        session.update(updates)
    return session


@api.get("/voice/calls/{call_id}/signals")
async def voice_call_signals(call_id: str, user: dict = Depends(get_current_user)):
    """Return only queued WebRTC signals addressed to an authenticated participant.

    Signals live only inside the existing short-lived call session.  They are a
    recovery path for a recipient woken by notification delivery, not a durable
    media or message channel; audio remains peer-to-peer WebRTC.
    """
    session = await db.call_sessions.find_one({"id": call_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "المكالمة غير موجودة")
    if user.get("id") not in {session.get("caller_id"), session.get("callee_id")}:
        raise HTTPException(403, "غير مصرح")
    now_iso = datetime.now(timezone.utc).isoformat()
    if session.get("status") in _CALL_TERMINAL_STATES or (session.get("expires_at") and session["expires_at"] < now_iso and session.get("status") != "connected"):
        return {"call_id": call_id, "session": {key: session.get(key) for key in ("id", "convo_id", "caller_id", "callee_id", "status", "expires_at")}, "signals": []}
    target_id = user["id"]
    signals = [
        item for item in (session.get("pending_signals") or [])
        if isinstance(item, dict) and item.get("to") == target_id and item.get("type") in _CALL_SIGNAL_TYPES
    ][-64:]
    return {
        "call_id": call_id,
        "session": {key: session.get(key) for key in ("id", "convo_id", "caller_id", "callee_id", "status", "expires_at")},
        "signals": signals,
    }


@api.get("/voice/calls")
async def voice_call_history(limit: int = 50, user: dict = Depends(get_current_user)):
    """Return only the authenticated participant's call history; no global log leak."""
    limit = max(1, min(int(limit or 50), 100))
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.call_sessions.update_many(
        {"status": {"$in": ["ringing", "offered"]}, "expires_at": {"$lte": now_iso}},
        {"$set": {"status": "missed", "ended_at": now_iso, "updated_at": now_iso, "end_reason": "invite_expired"}},
    )
    return await db.call_sessions.find(
        {"$or": [{"caller_id": user["id"]}, {"callee_id": user["id"]}], "country_code": active_cc},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=limit)


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
            if etype in _CALL_SIGNAL_TYPES:
                # WebRTC signaling only: media never passes through this API.
                # Every event is authorized against the persisted conversation,
                # active market and mutual block policy before fan-out.
                to = event.get("to")
                convo_id = event.get("convo_id")
                call_id = event.get("call_id")
                data = event.get("data") or {}
                if not isinstance(to, str) or not to or to == user_id or not isinstance(convo_id, str) or not convo_id or not isinstance(data, dict):
                    continue
                try:
                    if len(json.dumps(data, ensure_ascii=False).encode("utf-8")) > _CALL_SIGNAL_MAX_BYTES:
                        continue
                except Exception:
                    continue
                session = await _authorize_call_signal(user_id, to, convo_id, call_id, etype)
                if not session:
                    continue
                signal_event = {
                    "type": etype, "from": user_id, "to": to, "convo_id": convo_id,
                    "call_id": call_id, "data": data, "created_at": datetime.now(timezone.utc).isoformat(),
                }
                # Store only the offer/answer/ICE recovery envelope, capped to
                # a short list. Invite/reject/hangup are session-state events.
                if etype in {"call_offer", "call_answer", "call_ice"}:
                    await db.call_sessions.update_one(
                        {"id": call_id},
                        {"$push": {"pending_signals": {"$each": [signal_event], "$slice": -64}}},
                    )
                delivered = await _chat_hub.send_to_user(to, {
                    "type": etype, "from": user_id, "convo_id": convo_id,
                    "call_id": call_id, "data": data,
                })
                if etype == "call_invite" and delivered == 0:
                    # Use the persisted account name rather than client-provided
                    # signaling data in the notification payload.
                    caller = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1}) or {}
                    caller_name = str(caller.get("name") or "Haraj Plus")[:120]
                    route = f"/chat?to={user_id}&convo={convo_id}&call_id={call_id}"
                    await _send_user_notification(to, "مكالمة واردة", "لديك مكالمة صوتية واردة", "incoming_call", route, {"entity": "conversation", "entity_id": convo_id, "conversation_id": convo_id, "convo_id": convo_id, "caller_id": user_id, "caller_name": caller_name, "call_id": call_id, "country_code": session.get("country_code")}, pref_key="messages")
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


async def _chat_receiver_for_active_country(sender: dict, receiver_id: str) -> tuple[dict, str]:
    active_cc = country_code_or_default(sender.get("country_code"), "SA")
    receiver = await db.users.find_one({"id": receiver_id}, {"_id": 0, "id": 1, "name": 1, "country_code": 1})
    if not receiver:
        raise HTTPException(404, "المستلم غير موجود")
    if country_code_or_default(receiver.get("country_code"), "SA") != active_cc:
        raise HTTPException(409, "لا يمكن بدء محادثة بين سوقين مختلفين")
    return receiver, active_cc

@api.post("/chat/send")
async def send_message(body: ChatMessageIn, user: dict = Depends(get_current_user)):
    if body.receiver_id == user["id"]:
        raise HTTPException(400, "Cannot message yourself")
    # Idempotency for mobile/web offline retries: if the client already
    # persisted this request and the first attempt actually reached Mongo,
    # return the original message instead of creating a duplicate.
    if body.client_message_id:
        existing = await db.messages.find_one({
            "sender_id": user["id"],
            "client_message_id": body.client_message_id,
        }, {"_id": 0})
        if existing:
            return existing
    text = (body.text or "").strip()
    if not text and not any([body.image, body.voice, body.location]):
        raise HTTPException(400, "Message content required")
    if len(text) > 4000:
        raise HTTPException(413, "Message is too long")
    blocked = await db.blocks.find_one({"$or": [
        {"blocker_id": user["id"], "blocked_id": body.receiver_id},
        {"blocker_id": body.receiver_id, "blocked_id": user["id"]},
    ]}, {"_id": 0, "blocker_id": 1})
    if blocked:
        raise HTTPException(403, "Messaging is unavailable for this user")
    receiver, active_cc = await _chat_receiver_for_active_country(user, body.receiver_id)
    if body.listing_id:
        linked_listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": body.listing_id}), {"_id": 0, "id": 1})
        if not linked_listing:
            raise HTTPException(404, "الإعلان المرتبط غير موجود في الدولة المختارة")
    convo_id = "_".join(sorted([user["id"], body.receiver_id]))
    reply_to = None
    reply_id = (body.reply_to or {}).get("id") if isinstance(body.reply_to, dict) else None
    if reply_id:
        original = await db.messages.find_one({"id": reply_id, "convo_id": convo_id, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "sender_id": 1, "text": 1, "image": 1, "voice": 1, "location": 1})
        if not original:
            raise HTTPException(404, "الرسالة المراد الرد عليها غير متاحة")
        reply_to = {"id": original["id"], "text": original.get("text"), "image": original.get("image"), "voice": original.get("voice"), "location": original.get("location"), "sender_id": original.get("sender_id"), "sender_name": user.get("name") if original.get("sender_id") == user["id"] else receiver.get("name")}
    msg = {
        "id": str(uuid.uuid4()),
        "convo_id": convo_id,
        "sender_id": user["id"],
        "receiver_id": body.receiver_id,
        "listing_id": body.listing_id,
        "country_code": active_cc,
        "text": text or None,
        "image": body.image,
        "voice": body.voice,
        "voice_duration_ms": body.voice_duration_ms,
        "location": body.location,
        "reply_to": reply_to,
        "forwarded_from": body.forwarded_from,
        "client_message_id": body.client_message_id,
        "read": False,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.messages.insert_one(msg)
    except DuplicateKeyError:
        if body.client_message_id:
            existing = await db.messages.find_one({"sender_id": user["id"], "client_message_id": body.client_message_id}, {"_id": 0})
            if existing:
                return existing
        raise
    # upsert convo doc
    await db.conversations.update_one(
        {"id": convo_id},
        {"$set": {
            "id": convo_id,
            "participants": sorted([user["id"], body.receiver_id]),
            "listing_id": body.listing_id,
            "country_code": active_cc,
            "last_message": body.text or "[وسائط]",
            "last_ts": msg["ts"],
        }, "$inc": {f"unread_{body.receiver_id}": 1}, "$pull": {"hidden_for": user["id"]}},
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
        route = f"/chat?to={user['id']}&convo={convo_id}" + (f"&listing={body.listing_id}" if body.listing_id else "")
        await _send_user_notification(body.receiver_id, f"رسالة جديدة من {user.get('name', 'مستخدم')}", preview, "new_message", route, {"entity": "conversation", "entity_id": convo_id, "conversation_id": convo_id, "convo_id": convo_id, "sender_id": user["id"], "listing_id": body.listing_id, "message_id": msg["id"], "country_code": active_cc}, pref_key="messages")
    return msg_payload

@api.get("/chat/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    convos = await db.conversations.find({"participants": user["id"], "hidden_for": {"$ne": user["id"]}, "$or": [{"country_code": active_cc}, {"country_code": {"$exists": False}}]}, {"_id": 0}).sort("last_ts", -1).to_list(length=200)
    # enrich with other participant info — return BOTH the nested `other`
    # object AND flat `other_*` keys (mobile UI uses the flat form).
    for c in convos:
        other_id = next((p for p in c["participants"] if p != user["id"]), None)
        if other_id:
            other = await db.users.find_one({"id": other_id}, {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "phone_full": 1, "verified": 1})
            c["other"] = other
            if other:
                c["other_id"] = other.get("id")
                c["other_name"] = other.get("name") or ""
                c["other_avatar"] = other.get("avatar_url")
                c["other_verified"] = bool(other.get("verified"))
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
        q = {"convo_id": convo_id, "ts": {"$lt": before}, "hidden_for": {"$ne": user["id"]}}
        msgs = await db.messages.find(q, {"_id": 0}).sort("ts", -1).limit(limit).to_list(length=limit)
        msgs.reverse()
        return {
            "messages": msgs,
            "has_more": len(msgs) == limit,
            "next_before": msgs[0]["ts"] if (msgs and len(msgs) == limit) else None,
        }
    # Legacy: latest 500 oldest-first + mark as read.
    msgs = await db.messages.find({"convo_id": convo_id, "hidden_for": {"$ne": user["id"]}}, {"_id": 0}).sort("ts", 1).to_list(length=500)
    await db.messages.update_many({"convo_id": convo_id, "receiver_id": user["id"], "read": False}, {"$set": {"read": True}})
    await db.conversations.update_one({"id": convo_id}, {"$set": {f"unread_{user['id']}": 0}})
    return msgs


@api.post("/chat/messages/{message_id}/delete-for-me")
async def delete_chat_message_for_me(message_id: str, user: dict = Depends(get_current_user)):
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0, "convo_id": 1})
    if not msg:
        raise HTTPException(404, "الرسالة غير موجودة")
    if user["id"] not in (msg.get("convo_id") or "").split("_"):
        raise HTTPException(403, "غير مصرح")
    await db.messages.update_one({"id": message_id}, {"$addToSet": {"hidden_for": user["id"]}})
    return {"success": True, "message_id": message_id, "scope": "self"}

@api.delete("/chat/conversations/{convo_id}")
async def delete_chat_conversation_for_me(convo_id: str, user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": convo_id, "participants": user["id"]}, {"_id": 0, "id": 1})
    if not conversation:
        raise HTTPException(404, "المحادثة غير موجودة")
    await db.conversations.update_one({"id": convo_id}, {"$addToSet": {"hidden_for": user["id"]}})
    await db.messages.update_many({"convo_id": convo_id}, {"$addToSet": {"hidden_for": user["id"]}})
    return {"success": True, "convo_id": convo_id, "scope": "self"}

@api.post("/chat/messages/{message_id}/report")
async def report_chat_message(message_id: str, body: ReportIn, user: dict = Depends(get_current_user)):
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0, "convo_id": 1, "sender_id": 1})
    if not msg:
        raise HTTPException(404, "الرسالة غير موجودة")
    if user["id"] not in (msg.get("convo_id") or "").split("_"):
        raise HTTPException(403, "غير مصرح")
    report_id = str(uuid.uuid4())
    await db.reports.insert_one({"id": report_id, "reporter_id": user["id"], "target_type": "message", "target_id": message_id, "reason": body.reason.strip(), "status": "open", "created_at": datetime.now(timezone.utc).isoformat(), "conversation_id": msg.get("convo_id"), "reported_user_id": msg.get("sender_id")})
    return {"id": report_id, "success": True}

@api.delete("/chat/messages/{message_id}")
async def delete_chat_message(message_id: str, user: dict = Depends(get_current_user)):
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(404, "الرسالة غير موجودة")
    if msg.get("sender_id") != user["id"]:
        raise HTTPException(403, "يمكن حذف رسائلك فقط")
    now = datetime.now(timezone.utc).isoformat()
    await db.messages.update_one(
        {"id": message_id, "sender_id": user["id"]},
        {"$set": {"deleted": True, "deleted_at": now, "text": None, "image": None, "voice": None, "location": None, "reply_to": None, "reactions": {}}},
    )
    parts = (msg.get("convo_id") or "").split("_")
    for pid in parts:
        if pid:
            await _chat_hub.send_to_user(pid, {"type": "message_deleted", "convo_id": msg.get("convo_id"), "message_id": message_id, "deleted_at": now})
    return {"success": True, "message_id": message_id, "deleted_at": now}


# ---------------------------------------------------------------------------
# Message reactions — WhatsApp-style emoji reactions on chat messages.
# Each (user_id, message_id) pair can hold at most one reaction. Sending the
# same emoji twice removes it (toggle). Sending a different emoji replaces.
# Reactions are stored INSIDE the message document as a `reactions` dict:
#   { "❤️": ["userA_id"], "👍": ["userB_id", "userC_id"] }
# This keeps reads cheap (no separate collection join) and writes atomic.
# ---------------------------------------------------------------------------
class ReactionIn(BaseModel):
    emoji: str = Field(min_length=1, max_length=8)


@api.post("/chat/messages/{message_id}/react")
async def react_to_message(message_id: str, body: ReactionIn, user: dict = Depends(get_current_user)):
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(404, "الرسالة غير موجودة")
    # Authorization: only the two participants of the convo can react.
    parts = (msg.get("convo_id") or "").split("_")
    if user["id"] not in parts:
        raise HTTPException(403, "غير مسموح")
    emoji = body.emoji.strip()
    if not emoji:
        raise HTTPException(400, "ايموجي غير صالح")
    reactions = dict(msg.get("reactions") or {})
    # Strip user from any prior reaction (one reaction per user per message).
    same_emoji_existed = False
    for em, users in list(reactions.items()):
        if user["id"] in users:
            users.remove(user["id"])
            if em == emoji:
                same_emoji_existed = True
            if not users:
                reactions.pop(em, None)
            else:
                reactions[em] = users
    # Toggle: same emoji clicked twice ⇒ removed. Otherwise add the new one.
    if not same_emoji_existed:
        reactions.setdefault(emoji, []).append(user["id"])
    await db.messages.update_one({"id": message_id}, {"$set": {"reactions": reactions}})
    # WS fan-out to both participants so peers see reactions live.
    try:
        for pid in parts:
            if pid:
                await _chat_hub.send_to_user(pid, {
                    "type": "reaction",
                    "convo_id": msg.get("convo_id"),
                    "message_id": message_id,
                    "reactions": reactions,
                })
    except Exception:
        pass
    return {"success": True, "reactions": reactions}




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

# ============================================================
# Buy Requests, resumes/applications, and support tickets
# These are first-class persisted workflows; no mock cards or fake success.
# ============================================================
def _supported_country_or_default(value: Optional[str], fallback: str = "SA") -> str:
    supported = {str(item.get("code") or "").upper() for item in COUNTRIES}
    code = str(value or fallback).upper().strip()
    return code if code in supported else fallback

@api.post("/buy-requests")
async def create_buy_request(body: BuyRequestIn, user: dict = Depends(get_current_user)):
    country_code = _supported_country_or_default(body.country_code, user.get("country_code") or "SA")
    if body.budget_min is not None and body.budget_max is not None and body.budget_min > body.budget_max:
        raise HTTPException(400, "budget_min cannot exceed budget_max")
    now = datetime.now(timezone.utc)
    expires_at = body.expires_at
    if expires_at:
        try:
            parsed = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            if parsed <= now:
                raise HTTPException(400, "expires_at must be in the future")
            expires_at = parsed.isoformat()
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(400, "Invalid expires_at")
    else:
        expires_at = (now + timedelta(days=30)).isoformat()
    rid = str(uuid.uuid4())
    doc = {
        "id": rid, "user_id": user["id"], "title": body.title.strip(),
        "category": body.category.strip(), "description": body.description.strip(),
        "budget_min": body.budget_min, "budget_max": body.budget_max,
        "city": body.city.strip(), "country_code": country_code,
        "status": "open", "expires_at": expires_at,
        "created_at": now.isoformat(), "updated_at": now.isoformat(),
    }
    await db.buy_requests.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.get("/buy-requests")
async def list_buy_requests(country_code: Optional[str] = None, category: Optional[str] = None, city: Optional[str] = None, limit: int = Query(50, ge=1, le=200), user: dict = Depends(get_current_user)):
    cc = _supported_country_or_default(country_code, user.get("country_code") or "SA")
    query = {"country_code": cc, "status": "open", "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}}
    if category: query["category"] = category.strip()
    if city: query["city"] = city.strip()
    rows = await db.buy_requests.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    return rows

@api.get("/buy-requests/mine")
async def my_buy_requests(user: dict = Depends(get_current_user)):
    return await db.buy_requests.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(length=200)

@api.delete("/buy-requests/{request_id}")
async def delete_buy_request(request_id: str, user: dict = Depends(get_current_user)):
    result = await db.buy_requests.delete_one({"id": request_id, "user_id": user["id"]})
    if not result.deleted_count:
        raise HTTPException(404, "Buy request not found")
    await db.buy_request_matches.delete_many({"request_id": request_id})
    return {"success": True, "id": request_id}

@api.put("/users/me/resume")
async def save_resume(body: ResumeIn, user: dict = Depends(get_current_user)):
    if not body.resume_url.startswith(("https://", "http://")):
        raise HTTPException(400, "resume_url must be an absolute URL")
    now = datetime.now(timezone.utc).isoformat()
    resume = {"url": body.resume_url, "file_name": body.file_name.strip(), "mime_type": body.mime_type.strip(), "updated_at": now}
    await db.users.update_one({"id": user["id"]}, {"$set": {"resume": resume, "updated_at": now}})
    return {"success": True, "resume": resume}

@api.get("/users/me/resume")
async def get_resume(user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "resume": 1})
    return (doc or {}).get("resume") or None

@api.post("/listings/{listing_id}/applications")
async def apply_to_job(listing_id: str, body: JobApplicationIn, user: dict = Depends(get_current_user)):
    cc = _supported_country_or_default(body.country_code, user.get("country_code") or "SA")
    listing = await db.listings.find_one(public_listing_filter_for_country(cc, {"id": listing_id}), {"_id": 0, "id": 1, "user_id": 1, "category": 1, "country_code": 1})
    if not listing:
        raise HTTPException(404, "Listing not found in selected country")
    if listing.get("user_id") == user["id"]:
        raise HTTPException(400, "Cannot apply to your own listing")
    existing = await db.job_applications.find_one({"listing_id": listing_id, "applicant_id": user["id"]}, {"_id": 0})
    if existing:
        return {**existing, "already_applied": True}
    resume_url = body.resume_url
    if not resume_url:
        me = await db.users.find_one({"id": user["id"]}, {"_id": 0, "resume": 1})
        resume_url = ((me or {}).get("resume") or {}).get("url")
    if not resume_url:
        raise HTTPException(400, "Upload a resume before applying")
    now = datetime.now(timezone.utc).isoformat()
    application = {"id": str(uuid.uuid4()), "listing_id": listing_id, "applicant_id": user["id"], "owner_id": listing["user_id"], "country_code": cc, "resume_url": resume_url, "cover_note": body.cover_note.strip(), "status": "submitted", "created_at": now, "updated_at": now}
    await db.job_applications.insert_one(application)
    return {k: v for k, v in application.items() if k != "_id"}

@api.get("/listings/{listing_id}/applications")
async def list_job_applications(listing_id: str, user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1})
    if not listing or listing.get("user_id") != user["id"]:
        raise HTTPException(403, "Only the listing owner can view applications")
    return await db.job_applications.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(length=500)

@api.patch("/job-applications/{application_id}")
async def update_job_application(application_id: str, status: str = Query(..., min_length=3, max_length=30), user: dict = Depends(get_current_user)):
    allowed = {"submitted", "reviewing", "shortlisted", "rejected", "accepted"}
    if status not in allowed:
        raise HTTPException(400, "Unsupported application status")
    result = await db.job_applications.update_one({"id": application_id, "owner_id": user["id"]}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if not result.modified_count:
        raise HTTPException(404, "Application not found")
    return {"success": True, "id": application_id, "status": status}

@api.post("/support/tickets")
async def create_support_ticket(body: SupportTicketIn, user: dict = Depends(get_current_user)):
    priority = body.priority if body.priority in {"low", "normal", "high", "urgent"} else "normal"
    now = datetime.now(timezone.utc).isoformat()
    ticket = {"id": str(uuid.uuid4()), "user_id": user["id"], "subject": body.subject.strip(), "message": body.message.strip(), "category": body.category.strip() or "general", "priority": priority, "listing_id": body.listing_id, "status": "open", "messages": [{"id": str(uuid.uuid4()), "author_id": user["id"], "message": body.message.strip(), "created_at": now}], "created_at": now, "updated_at": now}
    await db.support_tickets.insert_one(ticket)
    return {k: v for k, v in ticket.items() if k != "_id"}

@api.get("/support/tickets")
async def list_support_tickets(user: dict = Depends(get_current_user)):
    query = {"user_id": user["id"]} if user.get("role") != "admin" else {}
    return await db.support_tickets.find(query, {"_id": 0}).sort("updated_at", -1).limit(200).to_list(length=200)

@api.get("/support/tickets/{ticket_id}")
async def get_support_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    query = {"id": ticket_id}
    if user.get("role") != "admin": query["user_id"] = user["id"]
    ticket = await db.support_tickets.find_one(query, {"_id": 0})
    if not ticket: raise HTTPException(404, "Ticket not found")
    return ticket

@api.post("/support/tickets/{ticket_id}/replies")
async def reply_support_ticket(ticket_id: str, body: SupportReplyIn, user: dict = Depends(get_current_user)):
    query = {"id": ticket_id}
    if user.get("role") != "admin": query["user_id"] = user["id"]
    ticket = await db.support_tickets.find_one(query, {"_id": 0, "status": 1})
    if not ticket: raise HTTPException(404, "Ticket not found")
    now = datetime.now(timezone.utc).isoformat()
    item = {"id": str(uuid.uuid4()), "author_id": user["id"], "message": body.message.strip(), "created_at": now}
    await db.support_tickets.update_one({"id": ticket_id}, {"$push": {"messages": item}, "$set": {"status": "open" if user.get("role") != "admin" else "pending_user", "updated_at": now}})
    return {"success": True, "message": item}

@api.post("/auth/request-account-deletion")
async def request_account_deletion(user: dict = Depends(get_current_user)):
    """Create one reviewable pending deletion request per account.

    The endpoint does not erase data immediately: a request must be reviewed by
    an authorized administrator. Repeated UI taps and network retries receive a
    truthful duplicate response instead of creating a queue of PII-bearing
    records for the same account.
    """
    existing = await db.account_deletion_requests.find_one({"user_id": user["id"], "status": "pending"}, {"_id": 0})
    if existing:
        return {"success": True, "duplicate": True, "message": "يوجد طلب حذف قيد المراجعة"}
    request_doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "email": user.get("email"),
        "requested_at": datetime.now(timezone.utc).isoformat(), "status": "pending",
    }
    try:
        await db.account_deletion_requests.insert_one(request_doc)
    except DuplicateKeyError:
        return {"success": True, "duplicate": True, "message": "يوجد طلب حذف قيد المراجعة"}
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
async def ai_image_search(body: AIImageSearchIn, user: dict = Depends(get_current_user)):
    raw = body.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    if len(raw) < 100 or len(raw) > 12_000_000:
        raise HTTPException(400, "صورة غير صالحة أو كبيرة جدًا")
    prompt = ("أنت مساعد بحث في تطبيق إعلانات مبوبة. حلل الصورة وأرجع 3 إلى 6 كلمات بحث "
              "قصيرة باللغة العربية تصف المنتج الرئيسي فقط، بدون شرح أو إيموجي. "
              "مثال: تويوتا كامري 2020 أبيض.")
    try:
        result = await ai_orchestrator.text("image_search", prompt, image_base64=body.image_base64)
        query = (result.get("text") or "").strip().strip('"').strip("'").splitlines()[0][:120]
        if not query:
            raise RuntimeError("empty image query")
        return {"query": query, "request_id": result.get("request_id"), "provider": result.get("provider"), "attempts": result.get("attempts", [])}
    except Exception as e:
        logger.error("[AI image-search] %s", e)
        raise HTTPException(503, "تعذر تحليل الصورة حاليًا؛ حاول مرة أخرى")


@api.get("/ai/providers/status")
async def ai_provider_status(user: dict = Depends(require_admin)):
    return {"providers": await ai_orchestrator.status(), "rotation": os.getenv("AI_PROVIDER_ORDER", "gemini")}


@api.get("/admin/ai/config")
async def get_ai_config(user: dict = Depends(require_admin)):
    doc = await db.ai_config.find_one({"id": "default"}, {"_id": 0}) or {}
    return {
        "mode": doc.get("mode", "automatic"),
        "primary": doc.get("primary", ""),
        "rotation_enabled": bool(doc.get("rotation_enabled", True)),
        "fallback_enabled": bool(doc.get("fallback_enabled", True)),
        "max_attempts": int(doc.get("max_attempts", 3) or 3),
        "quota_threshold_pct": float(doc.get("quota_threshold_pct", 90) or 90),
        "cooldown_seconds": int(doc.get("cooldown_seconds", 60) or 60),
        "order": doc.get("order") or [x.strip() for x in os.getenv("AI_PROVIDER_ORDER", "gemini").split(",") if x.strip()],
        "providers": doc.get("providers") or {},
    }


@api.put("/admin/ai/config")
async def update_ai_config(body: dict, user: dict = Depends(require_admin)):
    status = await ai_orchestrator.status()
    allowed = {str(x.get("name")) for x in status}
    order = [str(x).strip().lower() for x in (body.get("order") or []) if str(x).strip().lower() in allowed][:20]
    mode = str(body.get("mode") or "automatic").lower()
    if mode not in {"automatic", "priority", "manual"}: mode = "automatic"
    primary = str(body.get("primary") or "").strip().lower()
    if primary and primary not in allowed: primary = ""
    try: max_attempts = max(1, min(int(body.get("max_attempts", len(allowed)) or len(allowed)), 20))
    except (TypeError, ValueError): max_attempts = min(3, max(1, len(allowed)))
    try: quota_threshold_pct = max(0.0, min(float(body.get("quota_threshold_pct", 90) or 90), 100.0))
    except (TypeError, ValueError): quota_threshold_pct = 90.0
    try: cooldown_seconds = max(0, min(int(body.get("cooldown_seconds", 60) or 60), 86400))
    except (TypeError, ValueError): cooldown_seconds = 60
    providers = {}
    for name, patch in (body.get("providers") or {}).items():
        name = str(name).strip().lower()
        if name not in allowed or not isinstance(patch, dict):
            continue
        item = {}
        if "enabled" in patch: item["enabled"] = bool(patch.get("enabled"))
        if "weight" in patch:
            try: item["weight"] = max(1, min(int(patch.get("weight")), 100))
            except (TypeError, ValueError): pass
        for field in ("daily_limit", "monthly_limit", "rpm_limit", "rpd_limit", "tpm_limit"):
            if field in patch:
                try: item[field] = max(0, min(int(patch.get(field)), 10_000_000))
                except (TypeError, ValueError): pass
        providers[name] = item
    doc = {"id": "default", "mode": mode, "primary": primary, "rotation_enabled": bool(body.get("rotation_enabled", True)), "fallback_enabled": bool(body.get("fallback_enabled", True)), "max_attempts": max_attempts, "quota_threshold_pct": quota_threshold_pct, "cooldown_seconds": cooldown_seconds, "order": order, "providers": providers, "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user["id"]}
    await db.ai_config.update_one({"id": "default"}, {"$set": doc}, upsert=True)
    await _admin_log(user["id"], "ai_config_update", "default", {"order": order, "providers": providers})
    return {"mode": mode, "primary": primary, "rotation_enabled": doc["rotation_enabled"], "fallback_enabled": doc["fallback_enabled"], "max_attempts": max_attempts, "quota_threshold_pct": quota_threshold_pct, "cooldown_seconds": cooldown_seconds, "order": order, "providers": providers}


# ============================================================
# Sell with AI — Auto-fill listing from image
# ============================================================
class AIListingFillIn(BaseModel):
    image_base64: str


class MarketPriceIn(BaseModel):
    category: str
    subcategory: Optional[str] = None
    custom_fields: Optional[dict] = None  # used for narrowing (brand/model/year/condition)
    country_code: Optional[str] = None
    city: Optional[str] = None
    title: Optional[str] = None


@api.post("/listings/suggest-price")
async def market_based_price_suggest(body: MarketPriceIn):
    """Market-based price suggestion built from REAL listings in our DB.
    Returns p25/median/p75 + sample size + a confidence flag. No LLM guess —
    just statistical aggregation over comparable items currently for sale.
    Cheap, deterministic, and explainable to the user."""
    # Build a narrowing query.
    q = {"status": "active", "category": body.category, "price": {"$gt": 0}}
    if body.subcategory:
        q["subcategory"] = body.subcategory
    if body.country_code:
        q["country_code"] = body.country_code
    cf = body.custom_fields or {}
    # Match key category-defining fields when present.
    for key in ("phone_brand", "phone_model", "car_brand", "car_model",
                "make", "model", "brand", "year", "condition"):
        if cf.get(key):
            q[f"custom_fields.{key}"] = cf[key]

    # Try narrow → wider fallback if too few samples (<5).
    samples = []
    for attempt in range(3):
        cursor = db.listings.find(q, {"_id": 0, "price": 1, "currency": 1})
        samples = await cursor.to_list(length=400)
        if len(samples) >= 5:
            break
        # Loosen: drop the most specific filter, then try again.
        keys_to_drop = [
            "custom_fields.phone_model", "custom_fields.car_model", "custom_fields.model",
            "custom_fields.year",
        ]
        dropped = False
        for k in keys_to_drop:
            if k in q:
                del q[k]
                dropped = True
                break
        if not dropped:
            if attempt == 0 and "city" in q:
                del q["city"]
            else:
                break

    if not samples:
        return {"confidence": "none", "sample_size": 0,
                "p25": None, "median": None, "p75": None,
                "suggested": None, "currency": "SAR",
                "method": "market-aggregation",
                "note": "لا توجد إعلانات مشابهة كافية في السوق حالياً."}

    prices = sorted(float(s["price"]) for s in samples)
    n = len(prices)
    def percentile(arr, p):
        if not arr: return None
        i = (len(arr) - 1) * p
        lo = int(i)
        hi = min(lo + 1, len(arr) - 1)
        frac = i - lo
        return arr[lo] + (arr[hi] - arr[lo]) * frac
    p25 = percentile(prices, 0.25)
    p50 = percentile(prices, 0.50)
    p75 = percentile(prices, 0.75)
    currency = samples[0].get("currency") or "SAR"
    # confidence based on sample size
    if n >= 30: conf = "high"
    elif n >= 10: conf = "medium"
    elif n >= 5: conf = "low"
    else: conf = "very_low"
    return {
        "confidence": conf,
        "sample_size": n,
        "p25": round(p25, 2),
        "median": round(p50, 2),
        "p75": round(p75, 2),
        "suggested": round(p50, 2),
        "currency": currency,
        "method": "market-aggregation",
        "note": f"المتوسط مبني على {n} إعلاناً مشابهاً نشطاً في السوق.",
    }


@api.post("/ai/listing-autofill")
async def ai_listing_autofill(body: AIListingFillIn, user: dict = Depends(get_current_user)):
    """
    Analyze a product image and return a safe, structured listing draft.
    All providers go through the shared orchestrator for rotation, fallback,
    quotas, and usage telemetry.
    """
    raw = body.image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    if len(raw) < 100 or len(raw) > 12_000_000:
        raise HTTPException(400, "صورة غير صالحة أو كبيرة جدًا")

    cat_keys = [c["key"] for c in CATEGORIES]
    prompt = (
        "أنت مساعد ذكي لإنشاء إعلان مبوب. حلل صورة المنتج وأرجع JSON صحيح فقط دون شرح أو markdown. "
        "استخدم العربية في title وdescription. العنوان 4-9 كلمات، والوصف 2-3 جمل عملية. "
        "لا تخترع رقمًا دقيقًا إن لم يظهر السعر؛ استخدم 0 للسعر غير المعروف. "
        f"category_key يجب أن يكون من القائمة التالية فقط: {','.join(cat_keys)}. "
        'المخطط: {"title":"string","description":"string","category_key":"string",'
        '"condition":"new|used|like_new","suggested_price_min":0,"suggested_price_max":0,"currency":"SAR"}'
    )
    try:
        result = await ai_orchestrator.text("listing_autofill", prompt, image_base64=body.image_base64)
        text = result.get("text") or ""
    except Exception as e:
        logger.error("[AI listing-autofill] orchestrator error: %s", e)
        raise HTTPException(503, "تعذر تحليل الصورة حاليًا؛ حاول مرة أخرى")

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
async def ai_suggest_category(body: AISuggestCategoryIn, user: dict = Depends(get_current_user)):
    """Suggest the best category key for a listing title using the LLM.
    Falls back gracefully — frontend already has a keyword matcher, this only
    helps when keywords don't match (e.g. uncommon brand names).
    """
    title = body.title.strip()
    if not title:
        return {"category": ""}
    key = f"CAT|{title.lower()}"
    now = time.time()
    if key in _CAT_SUGGEST_CACHE:
        ts, c = _CAT_SUGGEST_CACHE[key]
        if now - ts < 86400:
            return {"category": c}
    valid_keys = [c["key"] for c in CATEGORIES]
    try:
        prompt = (
            "صنّف عنوان إعلان مبوب إلى مفتاح فئة واحد فقط من القائمة. "
            "أرجع المفتاح فقط بدون شرح أو علامات اقتباس.\n"
            f"عنوان الإعلان: {title}\nالفئات المتاحة: {', '.join(valid_keys)}\nالفئة الأنسب فقط:"
        )
        result = await ai_orchestrator.text("suggest_category", prompt)
        reply = (result.get("text") or "").strip().lower()
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
    # Echoed by Web/Mobile from the active country. A listing may not be moved
    # across country boundaries through an edit request.
    country_code: Optional[str] = None
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
    contact_phone_source: Optional[str] = Field(default=None, pattern="^(account|custom)$")

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
    listing_cc = country_code_or_default(item.get("country_code"), "SA")
    profile_cc = country_code_or_default(user.get("country_code"), "SA")
    requested_cc = str(update_data.pop("country_code", "") or "").upper().strip()
    if requested_cc and requested_cc not in supported_country_codes():
        raise HTTPException(422, "يرجى اختيار دولة مدعومة")
    if requested_cc and requested_cc != listing_cc:
        raise HTTPException(409, "لا يمكن تغيير دولة الإعلان عبر التعديل")
    if user.get("role") != "admin" and profile_cc != listing_cc:
        raise HTTPException(409, "غيّر الدولة النشطة إلى دولة الإعلان قبل تعديله")
    try:
        if "city" in update_data or "district" in update_data:
            canonical_city, canonical_district = normalize_location(
                listing_cc,
                update_data.get("city", item.get("city")),
                update_data.get("district", item.get("district")),
            )
            update_data["city"] = canonical_city
            update_data["district"] = canonical_district or None
        if "currency" in update_data:
            canonical_currency, canonical_currency_code = normalize_currency(
                listing_cc, update_data.get("currency"), item.get("currency_code")
            )
            update_data["currency"] = canonical_currency
            update_data["currency_code"] = canonical_currency_code
    except ValueError as exc:
        raise _country_policy_http_error(exc)
    if any(key in update_data for key in ("show_phone", "contact_phone", "contact_phone_source")):
        effective_show_phone = bool(update_data.get("show_phone", item.get("show_phone", True)))
        resolved_contact_phone, resolved_contact_source = _resolve_listing_contact_phone(
            user,
            effective_show_phone,
            update_data.get("contact_phone_source", item.get("contact_phone_source")),
            update_data.get("contact_phone", item.get("contact_phone")),
        )
        update_data["show_phone"] = effective_show_phone
        update_data["contact_phone"] = resolved_contact_phone
        update_data["contact_phone_source"] = resolved_contact_source
    old_images = list(item.get("images") or [])
    old_videos = list(item.get("videos") or [])
    old_model_url = (item.get("custom_fields") or {}).get("model_3d_url")
    merged_custom_fields = update_data.get("custom_fields", item.get("custom_fields") or {})
    _validate_model_3d(merged_custom_fields)
    merged_images = update_data.get("images", old_images)
    merged_videos = update_data.get("videos", old_videos)
    _validate_listing_media_for_user(user, merged_images, merged_videos, merged_custom_fields)
    # Capture only assets removed by this edit. Reused assets must remain intact.
    media_removed_on_update = {"images": [], "videos": [], "models": []}
    if "images" in update_data:
        media_removed_on_update["images"] = [u for u in old_images if u not in set(merged_images or [])]
    if "videos" in update_data:
        media_removed_on_update["videos"] = [u for u in old_videos if u not in set(update_data.get("videos") or [])]
    if "custom_fields" in update_data and old_model_url:
        new_model_url = (merged_custom_fields or {}).get("model_3d_url")
        if new_model_url != old_model_url:
            media_removed_on_update["models"] = [old_model_url]
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
    # Cleanup only assets removed from the edited listing. This is asynchronous
    # and audited by the same retry queue used by permanent deletion.
    if any(media_removed_on_update.values()):
        asyncio.create_task(_cleanup_listing_media(listing_id, media_removed_on_update))
    # Trigger price-alert notifications (best-effort; non-blocking)
    if "price" in update_data:
        asyncio.create_task(_check_price_alerts(listing_id, update_data.get("price")))

    # Re-run AI moderation when title or description changed (fire-and-forget)
    if "title" in update_data or "description" in update_data:
        new_title = update_data.get("title", item.get("title") or "")
        new_desc = update_data.get("description", item.get("description") or "")
        asyncio.create_task(ai_moderate_listing(listing_id, new_title, new_desc))

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
                route = f"/listing/{listing_id}"
                notification_data = _notification_payload("price_drop", route, {"entity": "listing", "entity_id": listing_id, "listing_id": listing_id, "old_price": old_price, "new_price": new_price, "country_code": item.get("country_code")})
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()), "user_id": w["user_id"], "type": "price_drop",
                    "title": f"💸 تخفيض في السعر -{pct}%", "body": f"تم تخفيض سعر «{title}» إلى {new_price:,.0f}",
                    "url": route, "data": notification_data, "schema_version": notification_data["schema_version"], "entity_type": notification_data["entity_type"], "entity_id": listing_id,
                    "read": False, "created_at": now_iso,
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
                        data={"type": "price_drop", **_notification_payload("price_drop", f"/listing/{listing_id}", {"entity": "listing", "entity_id": listing_id, "listing_id": listing_id, "country_code": item.get("country_code")})},
                        pref_key="watchlist",
                    ))
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"price-drop notify failed: {e}")
    new_item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    discovery_fields = {"title", "description", "price", "currency", "currency_code", "custom_fields", "images", "city", "district", "slug", "moderation"}
    if any(key in update_data for key in discovery_fields):
        discovery_listing = new_item or item
        _refresh_listing_discovery(discovery_listing, previous_slug=item.get("slug"))
        if any(key in update_data for key in ("title", "description")) and _listing_is_indexable(discovery_listing):
            asyncio.create_task(_generate_listing_seo_localizations(discovery_listing))
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
    _refresh_listing_discovery({**item, "status": "paused"}, removed=True)
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
    _refresh_listing_discovery({**item, "status": prev})
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
    _refresh_listing_discovery({**item, "status": "active", "created_at": now, "updated_at": now})
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
    _refresh_listing_discovery({**item, "status": "sold"}, removed=True)
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
# Product analytics — privacy-conscious event collection for visitor funnels.
# The client sends a short-lived visitor/session id, route, and allowlisted event
# name only. No raw IP, message text, or arbitrary payload is persisted.
# ============================================================
_ANALYTICS_EVENTS = {
    "page_view", "search", "listing_view", "contact_seller", "chat_started",
    "listing_created", "listing_published", "favorite_added", "report_submitted",
    "signup_started", "signup_completed", "login_completed", "auction_bid",
    "session_start", "session_heartbeat", "session_end", "screen_view",
    "referral_link_open", "referral_registered", "referral_qualified", "share_created", "share_opened", "share_qualified", "boost_purchased", "boost_expired", "coins_earned", "coins_spent",
}


@api.post("/analytics/events")
async def record_analytics_event(request: Request, body: dict):
    event = str(body.get("event") or "").strip().lower()
    if event not in _ANALYTICS_EVENTS:
        raise HTTPException(400, "Unsupported analytics event")
    visitor_id = str(body.get("visitor_id") or "").strip()[:80]
    session_id = str(body.get("session_id") or "").strip()[:80]
    if not visitor_id and not session_id:
        raise HTTPException(400, "visitor_id or session_id required")
    user = await _get_user_from_cookie(request)
    def _safe_text(key, limit):
        value = str(body.get(key) or "").strip()
        return value[:limit] or None
    referrer = _safe_text("referrer", 240)
    if referrer:
        referrer = re.sub(r"^https?://([^/]+).*$", r"\1", referrer).lower()[:120]
    try:
        duration_ms = max(0, min(int(body.get("duration_ms") or 0), 86_400_000))
    except (TypeError, ValueError):
        duration_ms = 0
    try:
        screen_width = max(0, min(int(body.get("screen_width") or 0), 10000))
        screen_height = max(0, min(int(body.get("screen_height") or 0), 10000))
    except (TypeError, ValueError):
        screen_width, screen_height = 0, 0
    doc = {
        "event": event,
        "visitor_id": visitor_id or None,
        "session_id": session_id or None,
        "user_id": (user or {}).get("id"),
        "path": str(body.get("path") or "")[:240],
        "category": str(body.get("category") or "")[:80] or None,
        "country_code": str(body.get("country_code") or "").upper()[:3] or None,
        "listing_id": str(body.get("listing_id") or "")[:80] or None,
        "share_id": str(body.get("share_id") or "")[:80] or None,
        "referral_code": str(body.get("referral_code") or "").upper()[:32] or None,
        "promotion_id": str(body.get("promotion_id") or "")[:80] or None,
        "device_type": _safe_text("device_type", 24),
        "os": _safe_text("os", 40),
        "browser": _safe_text("browser", 40),
        "source": _safe_text("source", 80),
        "campaign": _safe_text("campaign", 120),
        "referrer_host": referrer,
        "duration_ms": duration_ms,
        "screen_width": screen_width or None,
        "screen_height": screen_height or None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analytics_events.insert_one(doc)
    return {"ok": True}


async def _analytics_event(event: str, *, user_id: Optional[str] = None, visitor_id: Optional[str] = None, session_id: Optional[str] = None, country_code: Optional[str] = None, listing_id: Optional[str] = None, share_id: Optional[str] = None, referral_code: Optional[str] = None, promotion_id: Optional[str] = None):
    """Record a server-confirmed, privacy-minimised product event."""
    if event not in _ANALYTICS_EVENTS:
        return
    collection = getattr(db, "analytics_events", None)
    if collection is None:
        return
    await collection.insert_one({
        "event": event, "user_id": user_id, "visitor_id": visitor_id, "session_id": session_id,
        "country_code": country_code, "listing_id": listing_id, "share_id": share_id,
        "referral_code": referral_code, "promotion_id": promotion_id,
        "path": None, "category": None, "device_type": None, "os": None, "browser": None,
        "source": "server", "campaign": None, "referrer_host": None, "duration_ms": 0,
        "screen_width": None, "screen_height": None, "created_at": datetime.now(timezone.utc).isoformat(),
    })


# ============================================================
# Admin endpoints
# ============================================================
admin_router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


@admin_router.get("/analytics/overview")
async def admin_analytics_overview(days: int = 7):
    days = max(1, min(days, 90))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    match = {"created_at": {"$gte": since}}
    event_counts = await db.analytics_events.aggregate([
        {"$match": match},
        {"$group": {"_id": "$event", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]).to_list(length=100)
    daily = await db.analytics_events.aggregate([
        {"$match": match},
        {"$project": {"date": {"$substrBytes": ["$created_at", 0, 10]}, "event": 1}},
        {"$group": {"_id": {"date": "$date", "event": "$event"}, "count": {"$sum": 1}}},
        {"$sort": {"_id.date": 1}},
    ]).to_list(length=1000)
    funnel_events = ["page_view", "search", "listing_view", "contact_seller", "chat_started", "listing_created", "listing_published"]
    funnel = {name: 0 for name in funnel_events}
    for row in event_counts:
        if row.get("_id") in funnel:
            funnel[row["_id"]] = int(row.get("count") or 0)
    visitors = await db.analytics_events.distinct("visitor_id", {**match, "visitor_id": {"$ne": None}})
    sessions = await db.analytics_events.distinct("session_id", {**match, "session_id": {"$ne": None}})
    top_categories = await db.analytics_events.aggregate([
        {"$match": {**match, "event": "listing_view", "category": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10},
    ]).to_list(length=10)
    top_countries = await db.analytics_events.aggregate([
        {"$match": {**match, "country_code": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$country_code", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10},
    ]).to_list(length=10)
    top_listings = await db.analytics_events.aggregate([
        {"$match": {**match, "event": "listing_view", "listing_id": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$listing_id", "views": {"$sum": 1}}},
        {"$sort": {"views": -1}}, {"$limit": 10},
    ]).to_list(length=10)
    listing_ids = [x.get("_id") for x in top_listings if x.get("_id")]
    listing_docs = {}
    if listing_ids:
        listing_docs = {x["id"]: x async for x in db.listings.find({"id": {"$in": listing_ids}}, {"_id": 0, "id": 1, "title": 1, "category": 1, "user_id": 1})}
    return {
        "days": days,
        "since": since,
        "events_total": sum(int(x.get("count") or 0) for x in event_counts),
        "unique_visitors": len(visitors),
        "unique_sessions": len(sessions),
        "event_counts": [{"event": x.get("_id"), "count": int(x.get("count") or 0)} for x in event_counts],
        "daily": [{"date": x.get("_id", {}).get("date"), "event": x.get("_id", {}).get("event"), "count": int(x.get("count") or 0)} for x in daily],
        "funnel": funnel,
        "top_categories": [{"key": x.get("_id"), "count": int(x.get("count") or 0)} for x in top_categories],
        "top_countries": [{"key": x.get("_id"), "count": int(x.get("count") or 0)} for x in top_countries],
        "top_listings": [{"id": x.get("_id"), "views": int(x.get("views") or 0), **({"title": listing_docs[x["_id"]].get("title"), "category": listing_docs[x["_id"]].get("category"), "user_id": listing_docs[x["_id"]].get("user_id")} if x.get("_id") in listing_docs else {})} for x in top_listings],
    }

@admin_router.get("/analytics/visitors")
async def admin_analytics_visitors(days: int = 7, limit: int = 100, device_type: str = "", country_code: str = ""):
    """Return privacy-conscious session summaries for the admin visitor view."""
    days = max(1, min(days, 90))
    limit = max(1, min(limit, 500))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    match = {"created_at": {"$gte": since}, "session_id": {"$nin": [None, ""]}}
    if device_type:
        match["device_type"] = device_type[:24]
    if country_code:
        match["country_code"] = country_code.upper()[:3]
    rows = await db.analytics_events.aggregate([
        {"$match": match},
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$session_id", "visitor_id": {"$first": "$visitor_id"}, "user_id": {"$first": "$user_id"}, "last_seen": {"$first": "$created_at"}, "first_seen": {"$last": "$created_at"}, "last_path": {"$first": "$path"}, "country_code": {"$first": "$country_code"}, "device_type": {"$first": "$device_type"}, "os": {"$first": "$os"}, "browser": {"$first": "$browser"}, "source": {"$first": "$source"}, "event_count": {"$sum": 1}, "duration_ms": {"$max": "$duration_ms"}}},
        {"$sort": {"last_seen": -1}},
        {"$limit": limit},
    ]).to_list(length=limit)
    return {"days": days, "sessions": [{"session_id": r.get("_id"), **{k: v for k, v in r.items() if k != "_id"}} for r in rows]}

@admin_router.get("/analytics/breakdown")
async def admin_analytics_breakdown(days: int = 30, dimension: str = "device_type"):
    """Aggregate supported dimensions without exposing raw identifiers."""
    days = max(1, min(days, 90))
    allowed = {"device_type", "os", "browser", "country_code", "source", "referrer_host", "path"}
    if dimension not in allowed:
        raise HTTPException(400, "Unsupported analytics dimension")
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    rows = await db.analytics_events.aggregate([
        {"$match": {"created_at": {"$gte": since}, dimension: {"$nin": [None, ""]}}},
        {"$group": {"_id": f"${dimension}", "events": {"$sum": 1}, "sessions": {"$addToSet": "$session_id"}, "visitors": {"$addToSet": "$visitor_id"}}},
        {"$project": {"_id": 0, "key": "$_id", "events": 1, "sessions": {"$size": "$sessions"}, "visitors": {"$size": "$visitors"}}},
        {"$sort": {"events": -1}}, {"$limit": 50},
    ]).to_list(length=50)
    return {"days": days, "dimension": dimension, "rows": rows}

@admin_router.get("/referrals")
async def admin_referrals(status: str = "", limit: int = 200):
    limit = max(1, min(limit, 500))
    query = {"status": status} if status in {"pending", "qualified", "rewarded", "rejected"} else {}
    return await db.referral_events.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)

@admin_router.get("/referrals/config")
async def admin_referral_config():
    cfg = await db.referral_config.find_one({"id": "default"}, {"_id": 0})
    return cfg or {"id": "default", "reward_points": 100, "qualification": "email_verified", "enabled": True}

@admin_router.put("/referrals/config")
async def update_admin_referral_config(body: dict, user: dict = Depends(require_admin)):
    try:
        reward_points = max(0, min(int(body.get("reward_points", 100)), 100000))
    except (TypeError, ValueError):
        raise HTTPException(400, "Invalid reward_points")
    doc = {"id": "default", "reward_points": reward_points, "qualification": "email_verified", "enabled": bool(body.get("enabled", True)), "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user["id"]}
    await db.referral_config.update_one({"id": "default"}, {"$set": doc}, upsert=True)
    await _admin_log(user["id"], "referral_config_update", "default")
    return {k: v for k, v in doc.items() if k != "updated_by"}

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
            await _send_user_notification(item["user_id"], "✅ تمت الموافقة على إعلانك", f"«{title}» متاح الآن للجميع", "listing_approved", f"/listing/{lid}", {"entity": "listing", "entity_id": lid, "listing_id": lid}, pref_key="listing_status")
    return {"updated": r.modified_count}


@admin_router.post("/listings/{lid}/reject")
async def admin_reject(lid: str, user: dict = Depends(require_admin)):
    r = await db.listings.update_one({"id": lid}, {"$set": {"moderation": "rejected", "status": "rejected"}})
    if r.modified_count:
        await _admin_log(user["id"], "listing_reject", lid)
        item = await db.listings.find_one({"id": lid}, {"_id": 0, "user_id": 1, "title": 1})
        if item and item.get("user_id"):
            title = item.get("title", "إعلانك")
            await _send_user_notification(item["user_id"], "❌ تم رفض إعلانك", f"«{title}» — يرجى مراجعة الشروط وإعادة النشر", "listing_rejected", f"/listing/{lid}", {"entity": "listing", "entity_id": lid, "listing_id": lid}, pref_key="listing_status")
    return {"updated": r.modified_count}

@admin_router.get("/users")
async def admin_users(limit: int = 100, q: Optional[str] = None, country_code: Optional[str] = None, banned: Optional[bool] = None, verified: Optional[bool] = None):
    """List users with simple filters."""
    limit = max(1, min(int(limit or 100), 500))
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
    offers_received = await db.listing_offers.count_documents({"seller_id": uid})
    offers_sent = await db.listing_offers.count_documents({"buyer_id": uid})
    referrals_count = await db.referral_events.count_documents({"inviter_code": u.get("referral_code")}) if u.get("referral_code") else 0
    referrals_qualified = await db.referral_events.count_documents({"inviter_code": u.get("referral_code"), "status": {"$in": ["qualified", "rewarded"]}}) if u.get("referral_code") else 0
    session_ids = await db.analytics_events.distinct("session_id", {"user_id": uid, "session_id": {"$nin": [None, ""]}})
    session_rows = await db.analytics_events.aggregate([
        {"$match": {"user_id": uid, "session_id": {"$nin": [None, ""]}}},
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$session_id", "last_seen": {"$first": "$created_at"}, "device_type": {"$first": "$device_type"}, "os": {"$first": "$os"}, "browser": {"$first": "$browser"}, "last_path": {"$first": "$path"}, "duration_ms": {"$max": "$duration_ms"}}},
        {"$sort": {"last_seen": -1}},
        {"$limit": 10},
    ]).to_list(length=10)
    return {
        "user": u,
        "stats": {
            "listings_total": listings_total,
            "favorites_total": favorites_total,
            "reports_against": reports_against,
            "offers_received": offers_received,
            "offers_sent": offers_sent,
            "referrals_count": referrals_count,
            "referrals_qualified": referrals_qualified,
            "referral_points": int(u.get("referral_points") or 0),
            "sessions_total": len(session_ids),
            "last_message_at": (last_message or {}).get("ts"),
        },
        "recent_sessions": [{"session_id": x.get("_id"), **{k: v for k, v in x.items() if k != "_id"}} for x in session_rows],
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

@admin_router.get("/listings/lifecycle")
async def admin_listing_lifecycle(age_days: int = 0, status: str = "", limit: int = 200, skip: int = 0):
    """List listings by age for retention review. No automatic expiry is applied."""
    limit = max(1, min(limit, 500)); skip = max(0, skip)
    query = {}
    if status:
        query["status"] = status
    if age_days > 0:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=min(age_days, 3650))).isoformat()
        query["created_at"] = {"$lte": cutoff}
    total = await db.listings.count_documents(query)
    items = await db.listings.find(query, {"_id": 0, "id": 1, "title": 1, "user_id": 1, "status": 1, "moderation": 1, "created_at": 1, "updated_at": 1, "images": {"$slice": 1}, "videos": {"$slice": 1}, "country_code": 1}).sort("created_at", 1).skip(skip).limit(limit).to_list(length=limit)
    return {"items": items, "total": total, "age_days": age_days, "status": status}


@admin_router.post("/listings/bulk-delete")
async def admin_bulk_delete_listings(body: dict, user: dict = Depends(require_admin)):
    """Preview or delete up to 500 listings by explicit IDs or age.
    Age-based deletion is never automatic and requires `older_than_days`.
    """
    ids = [str(x) for x in (body.get("ids") or []) if x][:500]
    older_than_days = int(body.get("older_than_days") or 0)
    status = str(body.get("status") or "").strip()
    if not ids and older_than_days <= 0:
        raise HTTPException(400, "حدد ids أو older_than_days")
    query = {"id": {"$in": ids}} if ids else {}
    if status:
        query["status"] = status
    if older_than_days:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=min(older_than_days, 3650))).isoformat()
        query["created_at"] = {"$lte": cutoff}
    items = await db.listings.find(query, {"_id": 0, "id": 1, "images": 1, "videos": 1, "custom_fields.model_3d_url": 1}).limit(500).to_list(length=500)
    if body.get("dry_run", False):
        return {"dry_run": True, "matched": len(items), "ids": [x["id"] for x in items]}
    deleted = 0; media_queued = 0; related_deleted = 0
    for item in items:
        result = await db.listings.delete_one({"id": item["id"]})
        if not result.deleted_count:
            continue
        deleted += 1
        related = await _delete_listing_related_records(item["id"])
        related_deleted += sum(related.values())
        media = {"images": list(item.get("images") or []), "videos": list(item.get("videos") or []), "models": [item.get("custom_fields", {}).get("model_3d_url")] if item.get("custom_fields", {}).get("model_3d_url") else []}
        media_queued += len(media["images"]) + len(media["videos"]) + len(media["models"])
        asyncio.create_task(_cleanup_listing_media(item["id"], media))
        await _admin_log(user["id"], "listing_bulk_delete", item["id"])
    _cache_invalidate()
    return {"deleted": deleted, "media_queued": media_queued, "related_deleted": related_deleted, "matched": len(items)}


@admin_router.delete("/listings/{lid}")
async def admin_delete_listing(lid: str, user: dict = Depends(require_admin)):
    item = await db.listings.find_one({"id": lid}, {"_id": 0, "images": 1, "videos": 1, "custom_fields.model_3d_url": 1})
    r = await db.listings.delete_one({"id": lid})
    media_queued = 0
    related_deleted = {}
    if r.deleted_count:
        related_deleted = await _delete_listing_related_records(lid)
        await _admin_log(user["id"], "listing_delete", lid)
        _cache_invalidate()
        if item:
            media = {"images": list(item.get("images") or []), "videos": list(item.get("videos") or []), "models": [item.get("custom_fields", {}).get("model_3d_url")] if item.get("custom_fields", {}).get("model_3d_url") else []}
            media_queued = len(media["images"]) + len(media["videos"]) + len(media["models"])
            asyncio.create_task(_cleanup_listing_media(lid, media))
    return {"deleted": r.deleted_count, "media_queued": media_queued, "related_deleted": related_deleted}


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
        {"$project": {"_id": 0, "images": 1, "videos": 1, "custom_fields.model_3d_url": 1}},
    ]
    referenced: set = set()
    async for d in db.listings.aggregate(pipeline):
        for url in (d.get("images") or []) + (d.get("videos") or []) + ([((d.get("custom_fields") or {}).get("model_3d_url"))] if ((d.get("custom_fields") or {}).get("model_3d_url")) else []):
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
# Country/location data integrity is intentionally conservative: a listing is
# never moved to another country from a city name alone. Repairs only normalize
# an unambiguous local currency and clear a city that belongs to a different
# supported country, while preserving a reversible preimage for admin review.
def _country_integrity_reference() -> tuple[dict, dict, set]:
    countries = {str(c.get("code") or "").upper(): c for c in COUNTRIES if c.get("code")}
    city_to_countries: dict[str, set[str]] = {}
    known_currencies: set[str] = set()
    for cc, country in countries.items():
        for value in (country.get("currency"), country.get("currency_code")):
            if value:
                known_currencies.add(str(value).strip().upper())
        for city in country.get("cities") or []:
            for name in (city.get("name_ar"), city.get("name_en")):
                normalized = str(name or "").strip().casefold()
                if normalized:
                    city_to_countries.setdefault(normalized, set()).add(cc)
    return countries, city_to_countries, known_currencies


async def _country_integrity_snapshot(limit: int = 10000) -> dict:
    countries, city_to_countries, known_currencies = _country_integrity_reference()
    missing_country_query = {"$or": [{"country_code": {"$exists": False}}, {"country_code": None}, {"country_code": ""}]}
    users_no_cc = await db.users.count_documents(missing_country_query)
    listings_no_cc = await db.listings.count_documents(missing_country_query)
    issues: list[dict] = []
    scanned = 0
    projection = {"_id": 0, "id": 1, "title": 1, "country_code": 1, "city": 1, "district": 1, "currency": 1, "currency_code": 1, "location_needs_review": 1, "search_blob": 1, "user_id": 1, "created_at": 1}
    cursor = db.listings.find({}, projection).sort("created_at", -1).limit(max(1, min(limit, 50000)))
    async for listing in cursor:
        scanned += 1
        cc = str(listing.get("country_code") or "").upper().strip()
        kinds: list[str] = []
        city = str(listing.get("city") or "").strip()
        city_countries = city_to_countries.get(city.casefold(), set()) if city else set()
        if not cc:
            kinds.append("country_code_missing")
        elif cc not in countries:
            kinds.append("country_code_unsupported")
        if cc and cc in countries and city_countries and cc not in city_countries:
            kinds.append("city_country_mismatch")
        elif cc in countries and city and not city_countries:
            # Do not infer a country from free text. Preserve it for manual review
            # while making the uncertain location visible in the integrity report.
            kinds.append("city_not_in_reference")
        expected = countries.get(cc) or {}
        expected_currencies = {str(v).strip().upper() for v in (expected.get("currency"), expected.get("currency_code")) if v}
        supplied = {str(v).strip().upper() for v in (listing.get("currency"), listing.get("currency_code")) if v}
        if expected_currencies and supplied and any(v in known_currencies and v not in expected_currencies for v in supplied):
            kinds.append("currency_country_mismatch")
        if kinds:
            issues.append({**listing, "issue_types": kinds, "expected_currency": expected.get("currency"), "expected_currency_code": expected.get("currency_code")})
    summary = {
        "country_code_missing": 0,
        "country_code_unsupported": 0,
        "city_country_mismatch": 0,
        "city_not_in_reference": 0,
        "currency_country_mismatch": 0,
    }
    for item in issues:
        for kind in item["issue_types"]:
            summary[kind] = summary.get(kind, 0) + 1
    return {
        "listings_without_country": listings_no_cc,
        "users_without_country": users_no_cc,
        "scanned_listings": scanned,
        "issues_total": len(issues),
        "summary": summary,
        "sample_issues": issues[:50],
        "_actionable_issues": issues,
        "truncated": scanned >= min(max(1, limit), 50000),
    }


def _integrity_public_view(snapshot: dict) -> dict:
    return {key: value for key, value in snapshot.items() if key != "_actionable_issues"}


@admin_router.get("/data-integrity")
async def admin_data_integrity(limit: int = Query(10000, ge=1, le=50000)):
    """Read-only country/city/currency integrity report for legacy data."""
    return _integrity_public_view(await _country_integrity_snapshot(limit))


@admin_router.post("/data-integrity/repair")
async def admin_data_integrity_repair(body: dict, user: dict = Depends(require_admin)):
    """Create a dry-run by default; apply only with explicit confirmation.

    `apply=true` and `confirm=REPAIR_COUNTRY_INTEGRITY` are required to mutate.
    Every changed listing has a preimage written to `data_integrity_repairs` and
    can be restored with the rollback endpoint.
    """
    snapshot = await _country_integrity_snapshot(int(body.get("limit") or 10000))
    apply = bool(body.get("apply", False))
    if not apply:
        return {"dry_run": True, "apply_required": True, "confirmation_required": "REPAIR_COUNTRY_INTEGRITY", "plan": _integrity_public_view(snapshot)}
    if str(body.get("confirm") or "") != "REPAIR_COUNTRY_INTEGRITY":
        raise HTTPException(400, "يلزم تأكيد REPAIR_COUNTRY_INTEGRITY قبل التطبيق")
    repair_currency = bool(body.get("repair_currency", True))
    clear_invalid_city = bool(body.get("clear_invalid_city", True))
    flag_unknown_city = bool(body.get("flag_unknown_city", True))
    batch_id = str(uuid.uuid4())
    changes: list[dict] = []
    for issue in snapshot.get("_actionable_issues", []):
        patch: dict = {}
        types = set(issue.get("issue_types") or [])
        if repair_currency and "currency_country_mismatch" in types:
            patch.update({"currency": issue.get("expected_currency"), "currency_code": issue.get("expected_currency_code")})
        if clear_invalid_city and "city_country_mismatch" in types:
            patch.update({"city": "", "district": "", "location_needs_review": True})
        elif flag_unknown_city and "city_not_in_reference" in types:
            # Preserve ambiguous free text for a human, but make the record
            # discoverable to Admin as needing a location review.
            patch["location_needs_review"] = True
        if "city" in patch or "district" in patch:
            patch["search_blob"] = build_search_blob({**issue, **patch})
        if not patch:
            continue
        before = {
            key: {"present": key in issue, "value": issue.get(key)}
            for key in patch.keys()
        }
        await db.listings.update_one({"id": issue["id"]}, {"$set": patch})
        changes.append({"listing_id": issue["id"], "before": before, "after": patch, "issue_types": issue.get("issue_types")})
    repair_doc = {"id": batch_id, "kind": "country_integrity_repair", "created_at": datetime.now(timezone.utc).isoformat(), "created_by": user["id"], "changes": changes}
    await db.data_integrity_repairs.insert_one(repair_doc)
    await _admin_log(user["id"], "data_integrity_repair", batch_id, {"changes": len(changes), "repair_currency": repair_currency, "clear_invalid_city": clear_invalid_city, "flag_unknown_city": flag_unknown_city})
    _cache_invalidate()
    return {"dry_run": False, "batch_id": batch_id, "changed": len(changes), "changes": changes[:100]}


@admin_router.post("/data-integrity/rollback")
async def admin_data_integrity_rollback(body: dict, user: dict = Depends(require_admin)):
    batch_id = str(body.get("batch_id") or "").strip()
    if not batch_id:
        raise HTTPException(400, "batch_id مطلوب")
    repair = await db.data_integrity_repairs.find_one({"id": batch_id, "kind": "country_integrity_repair"}, {"_id": 0})
    if not repair:
        raise HTTPException(404, "دفعة الإصلاح غير موجودة")
    restored = 0
    for change in repair.get("changes") or []:
        before = change.get("before") or {}
        # New repair batches record field presence so rollback restores a truly
        # absent field with $unset rather than converting it into a null value.
        if before and all(isinstance(value, dict) and "present" in value for value in before.values()):
            restore_set = {key: value.get("value") for key, value in before.items() if value.get("present")}
            restore_unset = {key: "" for key, value in before.items() if not value.get("present")}
            operation = {}
            if restore_set:
                operation["$set"] = restore_set
            if restore_unset:
                operation["$unset"] = restore_unset
        else:
            # Compatibility with batches created by the earlier repair endpoint.
            operation = {"$set": before}
        result = await db.listings.update_one({"id": change.get("listing_id")}, operation)
        restored += int(result.modified_count or 0)
    await db.data_integrity_repairs.update_one({"id": batch_id}, {"$set": {"rolled_back_at": datetime.now(timezone.utc).isoformat(), "rolled_back_by": user["id"]}})
    await _admin_log(user["id"], "data_integrity_rollback", batch_id, {"restored": restored})
    _cache_invalidate()
    return {"batch_id": batch_id, "restored": restored}


@admin_router.post("/data-integrity/fix", deprecated=True)
async def admin_data_integrity_fix(default_country: str = "SA"):
    """Deprecated legacy endpoint. Use dry-run `/data-integrity/repair` instead."""
    raise HTTPException(410, "استخدم فحص وإصلاح سلامة البيانات الجديد مع dry-run وتأكيد وrollback")


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
    broadcast_data = _notification_payload("admin_broadcast", deep_url, {"entity": "broadcast", "entity_id": deep_url, "image": body.image or None})
    docs = [
        {"id": str(uuid.uuid4()), "user_id": uid, "title": body.title, "body": body.body,
         "type": "admin_broadcast", "read": False, "ts": datetime.now(timezone.utc).isoformat(),
         "url": deep_url, "image": body.image or None, "data": dict(broadcast_data),
         "schema_version": broadcast_data["schema_version"], "entity_type": broadcast_data["entity_type"], "entity_id": broadcast_data["entity_id"]}
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
            data={"type": "admin_broadcast", **broadcast_data},
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
    route = "/admin"
    data = _notification_payload("admin_test", route, {"entity": "admin", "entity_id": user["id"], "user_id": user["id"]})
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "title": title, "body": body, "type": "admin_test",
        "url": route, "data": data, "schema_version": data["schema_version"], "entity_type": data["entity_type"], "entity_id": data["entity_id"],
        "read": False, "ts": now, "created_at": now,
    }
    await db.notifications.insert_one(doc)
    push_result = {}
    try:
        push_result = await _send_push(
            db, [user["id"]],
            title=title,
            body=body,
            url=route,
            data={"type": "admin_test", **data},
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
    country_code: Optional[str] = None
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
            "country_code": (body.country_code or user.get("country_code") or "SA").upper().strip(),
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


NOTIFICATION_SCHEMA_VERSION = 1

def _notification_payload(ntype: str, url: str, extra_data: Optional[dict] = None) -> dict:
    """Canonical, versioned payload consumed by Web and Mobile resolvers.

    Legacy keys remain accepted by clients, but all newly created notifications
    carry stable entity/ID fields and a relative route so no specific event
    silently falls back to Home.
    """
    data = dict(extra_data or {})
    data.setdefault("schema_version", NOTIFICATION_SCHEMA_VERSION)
    data.setdefault("type", ntype)
    data.setdefault("route", url)
    data.setdefault("entity", data.get("entity_type") or ntype)
    data.setdefault("entity_type", data["entity"])
    for canonical, aliases in {
        "entity_id": ("target_id", "reference_id"),
        "listing_id": ("listingId", "ad_id"),
        "conversation_id": ("convo_id", "conversationId"),
        "comment_id": ("commentId",),
        "offer_id": ("offerId",),
        "auction_id": ("auctionId",),
        "user_id": ("userId",),
    }.items():
        if data.get(canonical) is None:
            for alias in aliases:
                if data.get(alias) is not None:
                    data[canonical] = data[alias]
                    break
    return data

async def _send_user_notification(user_id: str, title: str, body: str, ntype: str, url: str, extra_data: Optional[dict] = None, pref_key: Optional[str] = None):
    """Persist and push one notification; optional dedupe_key makes worker retries safe."""
    now = datetime.now(timezone.utc).isoformat()
    data = _notification_payload(ntype, url, extra_data)
    dedupe_key = data.get("dedupe_key")
    doc = {
        "id": str(uuid.uuid4()), "user_id": user_id,
        "title": title, "body": body, "type": ntype,
        "url": url, "data": data, "dedupe_key": dedupe_key,
        "schema_version": data["schema_version"], "entity_type": data["entity_type"], "entity_id": data.get("entity_id"),
        "read": False, "ts": now, "created_at": now,
    }
    try:
        await db.notifications.insert_one(doc)
    except DuplicateKeyError:
        return False
    try:
        await _send_push(
            db, [user_id], title=title, body=body, url=url,
            data={"type": ntype, **data},
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
            extra_data={"deep_link": "post", "draft_title": title_hint, "dedupe_key": f"abandoned_draft:{uid}:{d.get('_id')}"},
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
            extra_data={"deep_link": "search", "query": q, "category": cat, "country_code": s.get("country_code") or "SA", "dedupe_key": f"abandoned_search:{uid}:{s.get('_id')}"},
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
        # Claim before fan-out so two workers cannot send the same broadcast.
        claim = await db.scheduled_broadcasts.update_one(
            {"_id": sch["_id"], "status": "pending"},
            {"$set": {"status": "processing", "processing_at": now_iso}},
        )
        if not claim.modified_count:
            continue
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
        route = sch.get("url") or "/"
        scheduled_data = _notification_payload("admin_scheduled", route, {"entity": "scheduled_broadcast", "entity_id": sch["id"], "schedule_id": sch["id"]})
        docs = [{
            "id": str(uuid.uuid4()), "user_id": uid,
            "title": sch["title"], "body": sch["body"], "type": "admin_scheduled", "url": route,
            "data": dict(scheduled_data), "schema_version": scheduled_data["schema_version"], "entity_type": scheduled_data["entity_type"], "entity_id": scheduled_data["entity_id"],
            "read": False, "ts": now_iso, "created_at": now_iso,
        } for uid in user_ids]
        if docs:
            await db.notifications.insert_many(docs)
        if user_ids:
            try:
                await _send_push(
                    db, user_ids, title=sch["title"], body=sch["body"],
                    url=route,
                    data={"type": "admin_scheduled", **scheduled_data},
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
            already = await db.messages.find_one({"sender_id": uid, "listing_id": lid})
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
                extra_data={"deep_link": f"listing/{lid}", "listing_id": lid, "dedupe_key": f"viewed_no_action:{uid}:{lid}"},
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
                extra_data={"deep_link": "", "dedupe_key": f"reengage:{uid}:{now_iso[:10]}"},
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
    referral = await db.referral_events.find_one({"invitee_id": rec["user_id"], "status": "pending"}, {"_id": 0})
    if referral:
        changed = await db.referral_events.update_one({"id": referral["id"], "status": "pending"}, {"$set": {"status": "qualified", "qualified_at": datetime.now(timezone.utc).isoformat()}})
        if changed.modified_count:
            cfg = await _economy_config()
            reward = int(cfg.get("referral_coins") if cfg.get("referral_enabled", True) else 0)
            referrer = await db.users.find_one({"referral_code": referral["inviter_code"]}, {"_id": 0, "id": 1})
            if referrer and reward > 0:
                tx, duplicate = await _coin_mutation(referrer["id"], reward, "referral_reward", "qualified_referral", referral.get("invitee_id"), f"referral_reward:{referral.get('id')}", {"inviter_code": referral["inviter_code"], "qualification": "email_verified"})
                if not duplicate:
                    await db.users.update_one({"id": referrer["id"]}, {"$inc": {"referral_points": reward}})
                    await db.referral_events.update_one({"id": referral["id"]}, {"$set": {"status": "rewarded", "rewarded_at": datetime.now(timezone.utc).isoformat(), "reward_transaction_id": tx.get("id"), "reward_coins": reward}})
                    await _analytics_event("referral_qualified", user_id=referrer["id"], referral_code=referral["inviter_code"])
                    await _analytics_event("coins_earned", user_id=referrer["id"], referral_code=referral["inviter_code"])
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
async def add_watch(body: WatchIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": body.listing_id}), {"_id": 0, "id": 1, "price": 1, "user_id": 1})
    if not listing:
        raise HTTPException(404, "الإعلان غير موجود في الدولة المختارة")
    if listing["user_id"] == user["id"]:
        raise HTTPException(400, "لا يمكنك متابعة إعلانك")
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "listing_id": body.listing_id, "country_code": active_cc, "target_price": body.target_price, "last_price": listing.get("price"), "created_at": datetime.now(timezone.utc).isoformat(), "active": True}
    await db.watches.update_one({"user_id": user["id"], "listing_id": body.listing_id, "country_code": active_cc}, {"$set": doc}, upsert=True)
    return {"success": True, "watch": doc}

@api.delete("/watches/{listing_id}")
async def remove_watch(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    await db.watches.delete_one({"user_id": user["id"], "listing_id": listing_id, "country_code": active_cc})
    return {"success": True}

@api.get("/watches")
async def my_watches(country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    watches = await db.watches.find({"user_id": user["id"], "country_code": active_cc}, {"_id": 0}).sort("created_at", -1).to_list(length=200)
    visible = []
    for w in watches:
        listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": w["listing_id"]}), {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "images": 1, "city": 1, "status": 1})
        if listing:
            w["listing"] = listing
            visible.append(w)
    return visible


# ============================================================
# Follow Sellers
# ============================================================
@api.post("/sellers/{seller_id}/follow")
async def follow_seller(seller_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    if seller_id == user["id"]:
        raise HTTPException(400, "لا يمكنك متابعة نفسك")
    seller = await db.users.find_one({"id": seller_id, "country_code": active_cc}, {"_id": 0, "id": 1})
    if not seller:
        raise HTTPException(404, "البائع غير موجود في الدولة المختارة")
    existing = await db.follows.find_one({"follower_id": user["id"], "seller_id": seller_id, "country_code": active_cc})
    if existing:
        await db.follows.delete_one({"follower_id": user["id"], "seller_id": seller_id, "country_code": active_cc})
        return {"following": False, "country_code": active_cc}
    now = datetime.now(timezone.utc).isoformat()
    await db.follows.insert_one({
        "id": str(uuid.uuid4()), "follower_id": user["id"], "seller_id": seller_id,
        "country_code": active_cc, "created_at": now, "ts": now,
    })
    return {"following": True, "country_code": active_cc}

@api.get("/sellers/{seller_id}/follow-status")
async def follow_status(seller_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    if str(country_code or active_cc).upper().strip() != active_cc:
        raise HTTPException(409, "الدولة المختارة لا تطابق دولة الحساب")
    f = await db.follows.find_one({"follower_id": user["id"], "seller_id": seller_id, "country_code": active_cc})
    return {"following": bool(f), "country_code": active_cc}


# ============================================================
# Public seller profile + listings + ratings (used by mobile + web)
# ============================================================
@api.get("/sellers/{seller_id}")
async def get_seller_profile(seller_id: str):
    """Public seller profile (safe fields only)."""
    s = await db.users.find_one(
        {"id": seller_id},
        {"_id": 0, "id": 1, "name": 1, "avatar_url": 1, "bio": 1, "verified": 1,
         "trust_score": 1, "city": 1, "country_code": 1, "created_at": 1,
         "store_name": 1, "store_slug": 1, "store_description": 1, "store_logo": 1,
         "store_cover": 1, "business_hours": 1, "response_rate": 1}
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


class StorefrontUpdateIn(BaseModel):
    store_name: Optional[str] = None
    store_description: Optional[str] = None
    store_logo: Optional[str] = None
    store_cover: Optional[str] = None
    business_hours: Optional[dict] = None

@api.put("/users/me/storefront")
async def update_my_storefront(body: StorefrontUpdateIn, user: dict = Depends(get_current_user)):
    name = (body.store_name or "").strip()[:100]
    description = (body.store_description or "").strip()[:1000]
    update = {
        "store_name": name or user.get("name", "").strip()[:100],
        "store_description": description,
        "store_logo": (body.store_logo or "").strip()[:500] or None,
        "store_cover": (body.store_cover or "").strip()[:500] or None,
        "business_hours": body.business_hours if isinstance(body.business_hours, dict) else {},
        "store_slug": _slugify(name or user.get("name", "user"))[:80] or f"store-{user['id'][:8]}",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    return {"success": True, **update}

@api.get("/sellers/{seller_id}/trust")
async def seller_trust_graph(seller_id: str, country_code: Optional[str] = None):
    seller = await db.users.find_one({"id": seller_id}, {"_id": 0, "id": 1, "verified": 1, "email_verified": 1, "phone_verified": 1, "created_at": 1, "trust_score": 1})
    if not seller:
        raise HTTPException(404, "Seller not found")
    ratings = await db.ratings.aggregate([{"$match": {"seller_id": seller_id}}, {"$group": {"_id": "$seller_id", "avg": {"$avg": "$stars"}, "count": {"$sum": 1}}}]).to_list(length=1)
    rating_avg = float(ratings[0].get("avg") or 0) if ratings else 0
    rating_count = int(ratings[0].get("count") or 0) if ratings else 0
    sold = await db.listings.count_documents(public_listing_filter_for_country(country_code, {"user_id": seller_id, "status": "sold"}))
    active = await db.listings.count_documents(public_listing_filter_for_country(country_code, {"user_id": seller_id}))
    reports = await db.reports.count_documents({"target_type": "user", "target_id": seller_id, "status": {"$ne": "closed"}})
    score = 25
    factors = []
    if seller.get("verified"): score += 18; factors.append({"key": "identity_verified", "impact": 18})
    if seller.get("email_verified"): score += 5; factors.append({"key": "email_verified", "impact": 5})
    if seller.get("phone_verified") or seller.get("phone"): score += 7; factors.append({"key": "phone_verified", "impact": 7})
    if seller.get("created_at"):
        try:
            age_days = max(0, (datetime.now(timezone.utc) - datetime.fromisoformat(str(seller["created_at"]).replace("Z", "+00:00"))).days)
            age_impact = min(10, age_days // 180)
            score += age_impact
            if age_impact: factors.append({"key": "account_age", "impact": age_impact})
        except Exception: pass
    if rating_count:
        rating_impact = min(25, round((rating_avg / 5) * 15 + min(rating_count, 20) / 20 * 10))
        score += rating_impact; factors.append({"key": "ratings", "impact": rating_impact})
    activity_impact = min(10, sold + active // 5)
    score += activity_impact
    if activity_impact: factors.append({"key": "market_activity", "impact": activity_impact})
    penalty = min(35, reports * 8)
    score = max(0, min(100, int(score - penalty)))
    if penalty: factors.append({"key": "open_reports", "impact": -penalty})
    tier = "trusted" if score >= 80 else "established" if score >= 60 else "new" if score >= 40 else "caution"
    return {"seller_id": seller_id, "score": score, "tier": tier, "rating_avg": round(rating_avg, 1), "rating_count": rating_count, "sold_count": sold, "active_count": active, "open_reports": reports, "factors": factors}

@api.get("/sellers/{seller_id}/listings")
async def get_seller_listings(seller_id: str, limit: int = 20, skip: int = 0, country_code: Optional[str] = None):
    limit = max(1, min(limit, 20))
    country_filter = public_listing_filter_for_country(country_code, {"user_id": seller_id})
    cursor = db.listings.find(
        country_filter,
        {"_id": 0, "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
         "category": 1, "city": 1, "images": {"$slice": 1}, "created_at": 1, "views": 1}
    ).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.listings.count_documents(country_filter)
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
    has_chat = await db.messages.find_one({"$or": [
        {"sender_id": user["id"], "receiver_id": seller_id},
        {"sender_id": seller_id, "receiver_id": user["id"]},
    ]}, {"_id": 1})
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
    country_code: Optional[str] = None


@api.post("/search/log")
async def log_search(body: SearchLogIn, request: Request, country_code: Optional[str] = None):
    """Log a search. Increments global counter; if logged-in user, also adds to history."""
    q = (body.query or "").strip()
    if not q or len(q) > 100:
        return {"ok": True}
    now = datetime.now(timezone.utc).isoformat()
    cc = country_code_or_default(body.country_code or country_code)
    # Trending is market-scoped. Never aggregate a query from one country into
    # another country's discovery surface.
    await db.search_terms.update_one(
        {"country_code": cc, "q_lower": q.lower()},
        {"$inc": {"count": 1}, "$set": {"last_seen": now, "q": q, "country_code": cc}},
        upsert=True,
    )
    # personal history (if authed)
    user = await _get_user_from_cookie(request)
    if user:
        await db.search_history.update_one(
            {"user_id": user["id"], "country_code": cc, "q_lower": q.lower()},
            {"$set": {"q": q, "ts": now, "user_id": user["id"], "country_code": cc, "q_lower": q.lower()}},
            upsert=True,
        )
        # Trim to last 20 per user and market.
        cur = db.search_history.find({"user_id": user["id"], "country_code": cc}, {"_id": 0, "q_lower": 1, "ts": 1}).sort("ts", -1)
        all_items = await cur.to_list(length=200)
        if len(all_items) > 20:
            old_lowers = [it["q_lower"] for it in all_items[20:]]
            await db.search_history.delete_many({"user_id": user["id"], "country_code": cc, "q_lower": {"$in": old_lowers}})
    return {"ok": True}


@api.get("/search/trending")
async def trending_searches(country_code: Optional[str] = None, limit: int = 10):
    cc = country_code_or_default(country_code)
    items = await db.search_terms.find(
        {"country_code": cc}, {"_id": 0, "q": 1, "count": 1}
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
async def search_history(request: Request, country_code: Optional[str] = None, limit: int = 10):
    user = await _get_user_from_cookie(request)
    if not user:
        return []
    cc = country_code_or_default(country_code)
    items = await db.search_history.find(
        {"user_id": user["id"], "country_code": cc}, {"_id": 0, "q": 1, "ts": 1, "q_lower": 1}
    ).sort("ts", -1).limit(max(1, min(limit, 50))).to_list(length=50)
    return [{"query": it["q"], "ts": it["ts"], "id": it["q_lower"]} for it in items]


class SearchHistoryDeleteIn(BaseModel):
    query: Optional[str] = None  # if None, clear all
    all: Optional[bool] = False


@api.delete("/search/history")
async def delete_search_history(body: SearchHistoryDeleteIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
    cc = country_code_or_default(country_code)
    if body.all or body.query is None:
        await db.search_history.delete_many({"user_id": user["id"], "country_code": cc})
        return {"ok": True, "cleared": "all"}
    await db.search_history.delete_one({"user_id": user["id"], "country_code": cc, "q_lower": body.query.lower()})
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


@admin_router.get("/monitoring")
async def admin_monitoring_status():
    """Expose compact operational health for administrators only."""
    latest = await db.monitoring_runs.find_one({}, {"_id": 0}, sort=[("checked_at", -1)])
    history = await db.monitoring_runs.find({}, {"_id": 0, "checks": 0}).sort("checked_at", -1).limit(30).to_list(length=30)
    return {
        "latest": latest,
        "history": history,
        "email_alerts_configured": bool(RESEND_API_KEY and _monitor_alert_recipient()),
        "metrics": await _metrics_endpoint(),
    }


@admin_router.post("/monitoring/run")
async def admin_run_monitoring():
    """Run an on-demand check without sending a duplicate operational email."""
    return await _record_monitoring_result(await _run_platform_monitoring(), notify=False)


@api.post("/cron/monitoring")
@api.get("/cron/monitoring")
async def cron_platform_monitoring(request: Request):
    """Protected scheduled check; configure a scheduler with X-Cron-Secret."""
    supplied = request.headers.get("X-Cron-Secret", "") or request.query_params.get("secret", "")
    expected = os.environ.get("CRON_SECRET", "")
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(403, "Forbidden")
    return await _record_monitoring_result(await _run_platform_monitoring(), notify=True)


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

# Arabic is the source language for listings. The remaining languages are only
# advertised when a fresh, validated localisation exists for that exact source.
SEO_LISTING_LANGUAGES = ("ar", "en", "ur", "hi", "bn", "fr")
SEO_TRANSLATION_TARGETS = tuple(lang for lang in SEO_LISTING_LANGUAGES if lang != "ar")
SEO_LANGUAGE_NAMES = {
    "en": "English", "ur": "Urdu", "hi": "Hindi", "bn": "Bengali", "fr": "French",
}


def _listing_source_fingerprint(listing: dict) -> str:
    source = f"{str(listing.get('title') or '').strip()}\n{str(listing.get('description') or '').strip()}"
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def _listing_seo_localization(listing: dict, language: str) -> Optional[dict]:
    """Return a localisation only when it belongs to the current listing text."""
    language = str(language or "ar").lower()
    if language == "ar":
        return {"title": str(listing.get("title") or ""), "description": str(listing.get("description") or "")}
    candidate = (listing.get("seo_localizations") or {}).get(language)
    if not isinstance(candidate, dict) or candidate.get("source_hash") != _listing_source_fingerprint(listing):
        return None
    title = str(candidate.get("title") or "").strip()
    description = str(candidate.get("description") or "").strip()
    if not title or not description or len(title) > 220 or len(description) > 600:
        return None
    return {"title": title, "description": description}


def _listing_seo_languages(listing: dict) -> list[str]:
    return [lang for lang in SEO_LISTING_LANGUAGES if _listing_seo_localization(listing, lang)]


def _listing_discovery_profile(listing: dict) -> dict:
    """Build transparent, fact-bound content guidance for one classified listing.

    It does not generate keyword variants or claims. The returned tokens are
    derived from visible listing fields and can be used to help a seller improve
    completeness before publishing, while the factual summary supports semantic
    HTML and answer-engine retrieval.
    """
    title = str(listing.get("title") or "").strip()
    description = str(listing.get("description") or "").strip()
    fields = listing.get("custom_fields") or {}
    facts = []
    for label, value in (("category", listing.get("category")), ("city", listing.get("city")), ("district", listing.get("district")), ("price", listing.get("price"))):
        if value not in (None, "", 0, "0"):
            facts.append({"label": label, "value": str(value)})
    for key in ("make", "model", "year", "condition", "property_type", "area_m2", "rooms", "brand", "storage", "author", "animal_type"):
        value = fields.get(key)
        if value not in (None, "", "غير محدد", "آخر"):
            facts.append({"label": key, "value": str(value)})
    words = re.findall(r"[\w\u0600-\u06FF-]{2,}", " ".join([title, str(listing.get("category") or ""), str(listing.get("city") or ""), *[fact["value"] for fact in facts]]), re.UNICODE)
    keywords = list(dict.fromkeys(word for word in words if len(word) <= 60))[:20]
    checks = {
        "title_present": bool(title),
        "descriptive_title": len(title) >= 12,
        "description_present": len(description) >= 40,
        "location_present": bool(listing.get("city")),
        "image_present": bool(listing.get("images")),
        "price_or_contact": bool(listing.get("price")) or "تواصل" in description or "contact" in description.lower(),
        "category_fields_present": bool(fields),
    }
    score = round(sum(checks.values()) / len(checks) * 100)
    missing = [key for key, passed in checks.items() if not passed]
    return {"keywords": keywords, "facts": facts, "quality_score": score, "missing": missing}


async def _generate_listing_seo_localizations(listing: dict) -> None:
    """Generate reviewable discovery translations asynchronously for a live listing.

    The original user text is never overwritten. A source hash prevents stale
    translations from appearing after an edit, and failures merely leave the
    Arabic source version available without delaying publication.
    """
    if not _listing_is_indexable(listing) or not EMERGENT_LLM_KEY:
        return
    title = str(listing.get("title") or "").strip()
    description = str(listing.get("description") or "").strip()
    if not title or not description:
        return
    source_hash = _listing_source_fingerprint(listing)
    existing = listing.get("seo_localizations") or {}
    missing = [lang for lang in SEO_TRANSLATION_TARGETS if not isinstance(existing.get(lang), dict) or existing[lang].get("source_hash") != source_hash]
    if not missing:
        return
    try:
        from llm_shim import LlmChat, UserMessage
        requested = ", ".join(f'"{lang}": {SEO_LANGUAGE_NAMES[lang]}' for lang in missing)
        prompt = (
            "Translate this classified listing title and description into the requested languages. "
            "Do not add, omit, infer, or change facts. Preserve names, model numbers, prices, units, dates, URLs, and contact information exactly. "
            "Return strict JSON only, with one object per language shaped as {\\\"title\\\": string, \\\"description\\\": string}. "
            f"Requested languages: {requested}.\n"
            f"Title: {title}\nDescription: {description}"
        )
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"listing-seo-localize-{listing.get('id', uuid.uuid4().hex)}",
            system_message="You are a precise marketplace translator. Output valid JSON only.",
        ).with_model("gemini", "gemini-2.5-flash")
        raw = (await chat.send_message(UserMessage(text=prompt)) or "").strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        generated = json.loads(raw)
        if not isinstance(generated, dict):
            return
        accepted: dict = {}
        for language in missing:
            candidate = generated.get(language)
            if not isinstance(candidate, dict):
                continue
            localized_title = str(candidate.get("title") or "").strip()
            localized_description = str(candidate.get("description") or "").strip()
            if not localized_title or not localized_description or len(localized_title) > 220 or len(localized_description) > 600:
                continue
            accepted[language] = {
                "title": localized_title,
                "description": localized_description,
                "source_hash": source_hash,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "generator": "translation-assist",
            }
        if accepted:
            await db.listings.update_one({"id": listing["id"], "status": "active"}, {"$set": {f"seo_localizations.{lang}": value for lang, value in accepted.items()}})
            refreshed = {**listing, "seo_localizations": {**existing, **accepted}}
            _refresh_listing_discovery(refreshed)
    except Exception as exc:
        logger.info("[seo] listing localisation skipped: %s", exc)


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
        public_listing_filter({"created_at": {"$gte": cutoff}}),
        {"_id": 0, "id": 1, "slug": 1, "title": 1, "description": 1, "updated_at": 1, "created_at": 1, "images": 1, "seo_localizations": 1}
    ).sort("created_at", -1).limit(50000).to_list(length=50000)

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for path, prio, freq in static_pages:
        parts.append(f"<url><loc>{site}{path}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>")
    for l in listings:
        lastmod = (l.get("updated_at") or l.get("created_at") or "").split("T")[0] or ""
        img = (l.get("images") or [None])[0]
        title_safe = html_escape(str(l.get("title", "") or "").replace("]]>", ""), quote=False)
        loc = f"{site}/listing/{l.get('slug') or l['id']}"
        loc_xml = html_escape(loc, quote=True)
        img_safe = html_escape(str(img), quote=False) if img else ""
        img_part = f"<image:image><image:loc>{img_safe}</image:loc><image:title><![CDATA[{title_safe}]]></image:title></image:image>" if img else ""
        # Only advertise real, fresh localisations. Query-string alternates that
        # all render the same Arabic text would be invalid hreflang signals.
        localized_languages = _listing_seo_languages(l)
        alt = "".join(
            f'<xhtml:link rel="alternate" hreflang="{lng}" href="{html_escape(loc if lng == "ar" else loc + "?lang=" + lng, quote=True)}"/>'
            for lng in localized_languages
        )
        alt += f'<xhtml:link rel="alternate" hreflang="x-default" href="{loc_xml}"/>'
        parts.append(
            f"<url><loc>{loc_xml}</loc>"
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
        "# AI search and answer engines — public listing pages are crawlable.\n"
        "# OAI-SearchBot is ChatGPT Search discovery; GPTBot controls model training.\n"
        "User-agent: OAI-SearchBot\nAllow: /\n"
        "User-agent: ChatGPT-User\nAllow: /\n"
        "User-agent: GPTBot\nAllow: /\n"
        "User-agent: ClaudeBot\nAllow: /\n"
        "User-agent: Claude-SearchBot\nAllow: /\n"
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
        # Only honor a custom policy that keeps administrative paths blocked and
        # explicitly declares at least one AI-search crawler rather than relying
        # on an ambiguous wildcard rule.
        if "Disallow" in custom and any(bot in custom for bot in ("OAI-SearchBot", "GPTBot", "ClaudeBot", "PerplexityBot")):
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
    """Force sitemap rebuild on next request whenever public inventory changes."""
    _SITEMAP_CACHE["xml"] = None
    _SITEMAP_CACHE["ts"] = 0.0


def _listing_is_indexable(listing: dict) -> bool:
    """Mirror the public-discovery rule before announcing a listing to crawlers."""
    if listing.get("status") != "active" or listing.get("is_demo") is True:
        return False
    if listing.get("moderation") not in {None, "approved"}:
        return False
    title = str(listing.get("title") or "").strip()
    return not bool(re.match(r"^(?:TEST(?:[_\s-]|$)|TEST_SEARCH(?:[_\s-]|$)|TEST_INDEX(?:[_\s-]|$))", title, re.IGNORECASE))


def _listing_canonical_url(listing: dict) -> Optional[str]:
    ref = _listing_seo_ref(listing)
    if not ref:
        return None
    site = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "https://alhraj.online").rstrip("/")
    return f"{site}/listing/{quote(ref, safe='-._~')}"


def _refresh_listing_discovery(listing: dict, *, previous_slug: Optional[str] = None, removed: bool = False) -> None:
    """Synchronize inventory changes with the sitemap and best-effort engine signals.

    This function is deliberately non-blocking. The listing write is the source
    of truth; a transient third-party indexing failure cannot turn a user action
    into a failed publish/edit/close operation.
    """
    _sitemap_cache_invalidate()
    canonical = _listing_canonical_url(listing)
    if not canonical:
        return
    try:
        site = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "https://alhraj.online").rstrip("/")
        from urllib.parse import urlparse as _up
        host = _up(site).hostname or "alhraj.online"
        if removed or not _listing_is_indexable(listing):
            _google_idx_deleted(canonical)
        else:
            _seo_submit_bg(db, [canonical], host)
            _google_idx_updated(canonical)
        old_slug = str(previous_slug or "").strip()
        current_ref = _listing_seo_ref(listing)
        if old_slug and old_slug != current_ref:
            _google_idx_deleted(f"{site}/listing/{quote(old_slug, safe='-._~')}")
    except Exception as exc:
        logger.warning("[seo] listing discovery refresh failed: %s", exc)


def _android_asset_links() -> list[dict]:
    """Return Android App Links declarations from public release fingerprints only."""
    raw = os.environ.get("ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS", "")
    fingerprints = [value.strip().upper() for value in raw.split(",") if re.fullmatch(r"(?:[0-9A-F]{2}:){31}[0-9A-F]{2}", value.strip().upper())]
    if not fingerprints:
        return []
    package = os.environ.get("ANDROID_APP_LINK_PACKAGE", "com.harajplus.app").strip()
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+", package):
        return []
    return [{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {"namespace": "android_app", "package_name": package, "sha256_cert_fingerprints": fingerprints},
    }]


def _apple_app_site_association() -> dict:
    """Return iOS Universal Links declarations from public app identifiers only."""
    raw_ids = os.environ.get("IOS_UNIVERSAL_LINK_APP_IDS", "")
    app_ids = [value.strip() for value in raw_ids.split(",") if re.fullmatch(r"[A-Z0-9]{10}\.[A-Za-z0-9.-]+", value.strip())]
    if not app_ids:
        return {}
    paths = ["/listing/*", "/seller/*", "/category/*", "/auctions", "/deals", "/reels", "/map", "/search"]
    return {"applinks": {"details": [{"appIDs": app_ids, "components": [{"/": path} for path in paths]}]}}


@app.get("/.well-known/assetlinks.json", include_in_schema=False)
async def android_asset_links_file():
    statements = _android_asset_links()
    if not statements:
        raise HTTPException(404, "Android App Links are not configured")
    return JSONResponse(content=statements, headers={"Cache-Control": "public, max-age=3600"})


@app.get("/.well-known/apple-app-site-association", include_in_schema=False)
async def apple_app_site_association_file():
    document = _apple_app_site_association()
    if not document:
        raise HTTPException(404, "iOS Universal Links are not configured")
    return JSONResponse(content=document, headers={"Cache-Control": "public, max-age=3600"})


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


# Crawler and share-preview clients that need initial HTML rather than waiting for React.
# OAI-SearchBot is intentionally separate from GPTBot: the former powers ChatGPT
# Search discovery, while the latter controls model-training crawls.
BOT_UAS = re.compile(
    r"(googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot|"
    r"linkedinbot|whatsapp|telegrambot|slackbot|discordbot|oai-searchbot|gptbot|"
    r"claude(bot|-searchbot)?|perplexitybot|chatgpt|anthropic|google-extended|"
    r"bytespider|applebot)",
    re.IGNORECASE,
)


def _listing_seo_ref(listing: dict, fallback: str = "") -> str:
    return str(listing.get("slug") or listing.get("id") or fallback).strip()


async def _find_active_listing_for_seo(ref: str) -> Optional[dict]:
    """Resolve an active public listing by either stable slug or legacy id."""
    ref = str(ref or "").strip()
    if not ref:
        return None
    return await db.listings.find_one(
        {"status": "active", "$or": [{"slug": ref}, {"id": ref}]},
        {"_id": 0, "password_hash": 0},
    )


def _listing_seo_schema(listing: dict, site: str, canonical: str, localization: Optional[dict] = None, language: str = "ar") -> dict:
    """Create structured data only from facts visible on a live listing.

    Product stays the common denominator for a classified listing. Category
    specialisation is additive and intentionally conservative: we never claim a
    brand, rating, policy, stock count, shipping promise, or price deadline that
    the seller did not publish.
    """
    localization = localization or {}
    title = str(localization.get("title") or listing.get("title") or "").strip()
    description = str(localization.get("description") or listing.get("description") or title).strip()
    fields = listing.get("custom_fields") or {}
    category = str(listing.get("category") or "").strip().lower()
    images = [str(url) for url in (listing.get("images") or []) if str(url).startswith(("https://", "http://"))]
    schema_types: object = ["Product", "Car"] if category == "cars" else "Product"
    schema: dict = {
        "@context": "https://schema.org",
        "@id": f"{canonical}#product",
        "@type": schema_types,
        "name": title,
        "description": description,
        "url": canonical,
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "sku": str(listing.get("id") or _listing_seo_ref(listing)),
        "inLanguage": language,
    }
    if images:
        schema["image"] = images
    if category:
        schema["category"] = category

    def text_value(key: str) -> Optional[str]:
        value = fields.get(key)
        if value is None:
            return None
        value = str(value).strip()
        return value if value and value.lower() not in {"other", "unknown", "غير محدد", "آخر"} else None

    # Brand data is useful only when the advertiser provided a real manufacturer.
    brand = text_value("brand") or (text_value("make") if category == "cars" else None)
    if brand:
        schema["brand"] = {"@type": "Brand", "name": brand}

    # Category-aware fields become generic, machine-readable properties instead
    # of unsupported or invented rich-result fields.
    property_keys = {
        "cars": ("make", "model", "year", "kilometers", "transmission", "fuel_type", "body_type", "color", "regional_specs", "engine_size", "cylinders"),
        "realestate": ("deal_type", "property_type", "area_m2", "rooms", "bathrooms", "floor", "furnished", "rent_period", "parking", "elevator", "air_conditioning", "available_from"),
        "electronics": ("brand", "model", "storage", "ram", "warranty"),
        "phones": ("brand", "model", "storage", "ram", "warranty"),
        "furniture": ("furniture_type", "material", "color", "dimensions", "age_years"),
        "books": ("author", "language"),
        "sports": ("sport_type", "brand", "size"),
        "games": ("game_type", "platform", "game_title", "region"),
        "garden": ("item_kind", "plant_type", "size"),
        "livestock": ("animal_type", "breed", "age_months", "gender", "vaccinated"),
    }
    properties = []
    for key in property_keys.get(category, ()):
        value = text_value(key)
        if value:
            properties.append({"@type": "PropertyValue", "name": key, "value": value})
    vin = text_value("vin") if category == "cars" else None
    if vin and 5 <= len(vin) <= 64:
        schema["vehicleIdentificationNumber"] = vin
    if properties:
        schema["additionalProperty"] = properties

    price = listing.get("price")
    try:
        price_number = float(price) if price is not None and str(price).strip() else None
    except (TypeError, ValueError):
        price_number = None
    # Do not invent a zero price or an expiry date for listings that say
    # "contact seller". Google requires offer data to be accurate.
    if price_number is not None and price_number > 0:
        offer: dict = {
            "@type": "Offer",
            "url": canonical,
            "priceCurrency": str(listing.get("currency_code") or "SAR"),
            "price": price_number,
            "availability": "https://schema.org/InStock",
        }
        condition = text_value("condition") or (str(listing.get("condition")).strip() if listing.get("condition") else "")
        normalized_condition = condition.lower()
        if normalized_condition.startswith("new") or condition.startswith("جديد"):
            offer["itemCondition"] = "https://schema.org/NewCondition"
        elif condition:
            offer["itemCondition"] = "https://schema.org/UsedCondition"
        seller_name = (listing.get("seller") or {}).get("name")
        seller_type = text_value("seller_type")
        if seller_name:
            offer["seller"] = {"@type": "Organization" if seller_type == "معرض" else "Person", "name": str(seller_name)}
        if listing.get("city"):
            offer["areaServed"] = {"@type": "Place", "name": str(listing["city"])}
        schema["offers"] = offer
    return schema


def _listing_breadcrumb_schema(listing: dict, site: str, canonical: str, title: str) -> dict:
    """Describe the public navigation path that is visible on the listing page."""
    category = str(listing.get("category") or "").strip()
    items = [{"@type": "ListItem", "position": 1, "name": "الحراج بلس", "item": f"{site}/"}]
    if category:
        category_ref = quote(category, safe="-._~")
        items.append({
            "@type": "ListItem",
            "position": 2,
            "name": category,
            "item": f"{site}/category/{category_ref}",
        })
    items.append({
        "@type": "ListItem",
        "position": len(items) + 1,
        "name": title,
        "item": canonical,
    })
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}



def _listing_seo_html(listing: dict, fallback_ref: str = "", language: str = "ar") -> str:
    """Generate an accessible listing document in a real, current content language."""
    requested_language = str(language or "ar").lower()
    if requested_language not in SEO_LISTING_LANGUAGES:
        requested_language = "ar"
    localization = _listing_seo_localization(listing, requested_language)
    # Never declare an untranslated query parameter as a separate language page.
    effective_language = requested_language if localization else "ar"
    localization = localization or _listing_seo_localization(listing, "ar") or {}
    site = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    ref = _listing_seo_ref(listing, fallback_ref)
    base_url = f"{site}/listing/{quote(ref, safe='-._~')}"
    canonical = base_url if effective_language == "ar" else f"{base_url}?lang={effective_language}"
    title = str(localization.get("title") or listing.get("title") or "").strip()[:200]
    description = str(localization.get("description") or listing.get("description") or title).strip()[:300]
    price = listing.get("price")
    currency = str(listing.get("currency") or "ر.س")
    price_text = f"{price} {currency}" if price not in (None, "", 0, "0") else "السعر عند التواصل"
    full_title = f"{title} - {price_text} - الحراج بلس".strip(" -")[:240]
    image_urls = [str(url) for url in (listing.get("images") or []) if str(url).startswith(("https://", "http://"))]
    image = image_urls[0] if image_urls else f"{site}/og-image.png"
    keywords = ", ".join(dict.fromkeys(filter(None, [title, str(listing.get("category") or ""), str(listing.get("city") or ""), "الحراج بلس", "إعلانات مبوبة"])))
    listing_schema = _listing_seo_schema(listing, site, canonical, localization, effective_language)
    breadcrumb_schema = _listing_breadcrumb_schema(listing, site, canonical, title)
    schema_json = json.dumps([listing_schema, breadcrumb_schema], ensure_ascii=False).replace("<", "\\u003c")
    title_html = html_escape(title, quote=True)
    desc_html = html_escape(description, quote=True)
    full_title_html = html_escape(full_title, quote=True)
    canonical_html = html_escape(canonical, quote=True)
    image_html = html_escape(image, quote=True)
    price_html = html_escape(price_text, quote=True)
    city_html = html_escape(str(listing.get("city") or ""), quote=True)
    category_html = html_escape(str(listing.get("category") or ""), quote=True)
    category_url = f"{site}/category/{quote(str(listing.get('category') or ''), safe='-._~')}" if listing.get("category") else ""
    category_url_html = html_escape(category_url, quote=True)
    keywords_html = html_escape(keywords, quote=True)
    image_markup = f'<img src="{image_html}" alt="{title_html}" loading="lazy" />' if image_urls else ""
    language_direction = "rtl" if effective_language in {"ar", "ur"} else "ltr"
    locale_map = {"ar": "ar_SA", "en": "en_US", "ur": "ur_PK", "hi": "hi_IN", "bn": "bn_BD", "fr": "fr_FR"}
    alternate_links = "".join(
        f'<link rel="alternate" hreflang="{lang}" href="{html_escape(base_url if lang == "ar" else base_url + "?lang=" + lang, quote=True)}" />'
        for lang in _listing_seo_languages(listing)
    ) + f'<link rel="alternate" hreflang="x-default" href="{html_escape(base_url, quote=True)}" />'
    return f"""<!doctype html>
<html lang="{effective_language}" dir="{language_direction}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<title>{full_title_html}</title>
<meta name="description" content="{desc_html}" />
<meta name="keywords" content="{keywords_html}" />
<link rel="canonical" href="{canonical_html}" />
{alternate_links}
<meta property="og:type" content="product" />
<meta property="og:title" content="{full_title_html}" />
<meta property="og:description" content="{desc_html}" />
<meta property="og:image" content="{image_html}" />
<meta property="og:url" content="{canonical_html}" />
<meta property="og:locale" content="{locale_map[effective_language]}" />
<meta property="og:site_name" content="الحراج بلس" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{full_title_html}" />
<meta name="twitter:description" content="{desc_html}" />
<meta name="twitter:image" content="{image_html}" />
<script type="application/ld+json">{schema_json}</script>
</head>
<body>
<main>
<nav aria-label="Breadcrumb"><a href="{html_escape(site + '/', quote=True)}">الحراج بلس</a>{f' › <a href="{category_url_html}">{category_html}</a>' if category_url_html else ''} › <span>{title_html}</span></nav>
<article>
<h1>{title_html}</h1>
<p><strong>السعر:</strong> {price_html}</p>
{f'<p><strong>المدينة:</strong> {city_html}</p>' if city_html else ''}
{f'<p><strong>الفئة:</strong> {category_html}</p>' if category_html else ''}
<p>{desc_html}</p>
{image_markup}
<p><a href="{canonical_html}">عرض الإعلان كاملاً على الحراج بلس</a></p>
</article>
</main>
</body>
</html>"""


async def _frontend_shell_for_listing() -> Optional[str]:
    """Return the deployed React shell for human visitors when it is reachable.

    The canonical listing route is rewritten to this API in production. Fetching
    `/index.html` preserves the normal React app without recursively requesting
    `/listing/...`; bots instead receive the equivalent visible listing document.
    """
    site = os.environ.get("FRONTEND_URL", "https://alhraj.online").rstrip("/")
    shell_url = os.environ.get("SEO_FRONTEND_SHELL_URL", f"{site}/index.html").strip()
    try:
        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client_http:
            response = await client_http.get(shell_url, headers={"User-Agent": "HarajPlus-SEO-Shell/1.0"})
        body = response.text if response.status_code == 200 else ""
        return body if '<div id="root">' in body else None
    except httpx.HTTPError:
        return None


@api.get("/seo/listing/{listing_id}", include_in_schema=False)
async def seo_listing_html(listing_id: str, lang: Optional[str] = None):
    """Direct diagnostic URL returning the same HTML served to crawler clients."""
    listing = await _find_active_listing_for_seo(listing_id)
    if not listing:
        return HTMLResponse("<h1>Listing not found</h1>", status_code=404)
    return HTMLResponse(_listing_seo_html(listing, listing_id, lang or "ar"), headers={"Vary": "User-Agent"})


@app.get("/listing/{listing_ref}", include_in_schema=False)
async def primary_listing_page(listing_ref: str, request: Request):
    """Canonical listing route: semantic initial HTML for crawlers, React shell for people."""
    listing = await _find_active_listing_for_seo(listing_ref)
    if not listing:
        return HTMLResponse("<h1>Listing not found</h1>", status_code=404, headers={"Vary": "User-Agent"})
    requested_language = request.query_params.get("lang", "ar")
    user_agent = request.headers.get("user-agent", "")
    if BOT_UAS.search(user_agent):
        return HTMLResponse(_listing_seo_html(listing, listing_ref, requested_language), headers={"Vary": "User-Agent"})
    shell = await _frontend_shell_for_listing()
    if shell:
        return HTMLResponse(shell, headers={"Vary": "User-Agent", "Cache-Control": "no-store"})
    # Fail-safe fallback: never return an empty page when the frontend host is temporarily unavailable.
    return HTMLResponse(_listing_seo_html(listing, listing_ref, requested_language), headers={"Vary": "User-Agent", "Cache-Control": "no-store"})




# ============================================================
# Wallet / Balance system (internal credits — no real payments yet)
# Used for: boosting listings, premium features. Currency = SAR-equivalent credits.
# ============================================================
class CoinsSpendIn(BaseModel):
    amount: int = Field(gt=0, le=1_000_000)
    purpose: str = Field(min_length=2, max_length=80)
    ref_id: Optional[str] = Field(default=None, max_length=120)
    idempotency_key: Optional[str] = Field(default=None, max_length=160)


class CoinsGrantIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=120)
    amount: int = Field(gt=0, le=1_000_000)
    purpose: str = Field(default="admin_grant", min_length=2, max_length=80)
    idempotency_key: Optional[str] = Field(default=None, max_length=160)


class EconomyConfigIn(BaseModel):
    welcome_coins: int = Field(default=10, ge=0, le=100_000)
    referral_coins: int = Field(default=25, ge=0, le=100_000)
    share_open_coins: int = Field(default=2, ge=0, le=10_000)
    referral_enabled: bool = True
    share_rewards_enabled: bool = True
    boost_products: list[dict] = Field(default_factory=list)


class ListingShareIn(BaseModel):
    client_share_id: str = Field(min_length=8, max_length=160)
    channel: str = Field(default="system", min_length=2, max_length=40)


class ShareOpenIn(BaseModel):
    visitor_id: str = Field(min_length=8, max_length=100)
    session_id: str = Field(min_length=8, max_length=100)
    platform: str = Field(default="web", min_length=2, max_length=30)


class ReferralOpenIn(BaseModel):
    code: str = Field(min_length=4, max_length=32)
    visitor_id: str = Field(min_length=8, max_length=100)
    session_id: str = Field(min_length=8, max_length=100)
    platform: str = Field(default="web", min_length=2, max_length=30)


class PromotionPurchaseIn(BaseModel):
    product_id: str = Field(min_length=2, max_length=80)
    idempotency_key: str = Field(min_length=8, max_length=160)


class WalletTopupIn(BaseModel):
    amount: float = Field(gt=0)
    note: Optional[str] = None
    target_user_id: Optional[str] = None  # admin-only field
    idempotency_key: str = Field(min_length=8, max_length=160)

class WalletSpendIn(BaseModel):
    amount: float = Field(gt=0)
    purpose: str
    ref_id: Optional[str] = None  # e.g. listing_id when boosting
    idempotency_key: str = Field(min_length=8, max_length=160)


async def _wallet_balance(user_id: str) -> float:
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "balance": 1})
    return float((u or {}).get("balance") or 0)


async def _wallet_log(user_id: str, kind: str, amount: float, description: str, ref_id: Optional[str] = None, idempotency_key: Optional[str] = None) -> dict:
    if idempotency_key:
        existing = await db.wallet_transactions.find_one({"user_id": user_id, "idempotency_key": idempotency_key}, {"_id": 0})
        if existing:
            return existing
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": kind,  # topup | spend | bonus | refund
        "amount": float(amount),
        "currency": "SAR",
        "description": description[:200],
        "ref_id": ref_id,
        "idempotency_key": idempotency_key,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.wallet_transactions.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def _coins_balance(user_id: str) -> int:
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "coins_balance": 1})
    return int((u or {}).get("coins_balance") or 0)


async def _economy_config() -> dict:
    defaults = {
        "id": "default", "welcome_coins": _welcome_coins_amount(), "referral_coins": 25,
        "share_open_coins": 2, "referral_enabled": True, "share_rewards_enabled": True,
        "boost_products": [
            {"id": "boost_24h", "cost": 100, "duration_hours": 24, "strength": 1},
            {"id": "boost_72h", "cost": 250, "duration_hours": 72, "strength": 2},
            {"id": "boost_7d", "cost": 500, "duration_hours": 168, "strength": 3},
        ],
    }
    stored = await db.economy_config.find_one({"id": "default"}, {"_id": 0})
    return {**defaults, **(stored or {})}


async def _coins_log(user_id: str, kind: str, amount: int, purpose: str, ref_id: Optional[str] = None, idempotency_key: Optional[str] = None, metadata: Optional[dict] = None, before: Optional[int] = None, after: Optional[int] = None):
    if idempotency_key:
        existing = await db.coins_ledger.find_one({"user_id": user_id, "idempotency_key": idempotency_key}, {"_id": 0})
        if existing:
            return existing
    doc = {"id": str(uuid.uuid4()), "user_id": user_id, "type": kind, "amount": int(amount), "purpose": purpose[:80], "ref_id": ref_id, "idempotency_key": idempotency_key, "status": "completed", "before_balance": before, "after_balance": after, "metadata": metadata or {}, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.coins_ledger.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


async def _coin_mutation(user_id: str, amount: int, tx_type: str, purpose: str, ref_id: Optional[str], idempotency_key: str, metadata: Optional[dict] = None) -> tuple[dict, bool]:
    """Apply a coin balance change once and persist an auditable ledger row.

    Mongo deployments without replica-set transactions use a guarded balance update
    plus a unique idempotency ledger key and compensation on duplicate insertion.
    """
    existing = await db.coins_ledger.find_one({"user_id": user_id, "idempotency_key": idempotency_key}, {"_id": 0})
    if existing:
        return existing, True
    before = await _coins_balance(user_id)
    query = {"id": user_id}
    if amount < 0:
        query["coins_balance"] = {"$gte": abs(amount)}
    changed = await db.users.update_one(query, {"$inc": {"coins_balance": amount}})
    if not changed.modified_count:
        raise HTTPException(402, "رصيد الـCoins غير كافٍ")
    after = before + amount
    try:
        tx = await _coins_log(user_id, tx_type, amount, purpose, ref_id, idempotency_key, metadata, before, after)
    except DuplicateKeyError:
        await db.users.update_one({"id": user_id}, {"$inc": {"coins_balance": -amount}})
        existing = await db.coins_ledger.find_one({"user_id": user_id, "idempotency_key": idempotency_key}, {"_id": 0})
        if existing:
            return existing, True
        raise
    return tx, False


@api.get("/economy/config")
async def economy_config():
    cfg = await _economy_config()
    return {k: cfg[k] for k in ("welcome_coins", "referral_coins", "share_open_coins", "referral_enabled", "share_rewards_enabled", "boost_products")}


@api.put("/admin/economy/config")
async def update_economy_config(body: EconomyConfigIn, user: dict = Depends(require_admin)):
    products = []
    seen = set()
    for raw in body.boost_products[:10]:
        try:
            pid = str(raw.get("id") or "").strip().lower()[:80]
            cost, hours, strength = int(raw.get("cost")), int(raw.get("duration_hours")), int(raw.get("strength", 1))
        except (AttributeError, TypeError, ValueError):
            raise HTTPException(422, "منتج الترويج غير صالح")
        if not pid or pid in seen or cost < 1 or cost > 1_000_000 or hours < 1 or hours > 24 * 31 or strength < 1 or strength > 100:
            raise HTTPException(422, "منتج الترويج غير صالح")
        seen.add(pid); products.append({"id": pid, "cost": cost, "duration_hours": hours, "strength": strength})
    doc = {"id": "default", **body.model_dump(), "boost_products": products or (await _economy_config())["boost_products"], "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user["id"]}
    await db.economy_config.update_one({"id": "default"}, {"$set": doc}, upsert=True)
    await _admin_log(user["id"], "economy_config_update", "default", {"products": len(doc["boost_products"])})
    return await economy_config()


@api.post("/referral/open")
async def referral_open(body: ReferralOpenIn):
    code = body.code.upper().strip()
    owner = await db.users.find_one({"referral_code": code}, {"_id": 0, "id": 1, "country_code": 1})
    if not owner: raise HTTPException(404, "رمز الإحالة غير صالح")
    key = f"ref_open:{code}:{body.visitor_id}:{body.session_id}"
    opened = await db.referral_opens.update_one({"idempotency_key": key}, {"$setOnInsert": {"id": str(uuid.uuid4()), "code": code, "referrer_id": owner["id"], "visitor_id": body.visitor_id, "session_id": body.session_id, "platform": body.platform, "idempotency_key": key, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    if opened.upserted_id:
        await _analytics_event("referral_link_open", user_id=owner["id"], visitor_id=body.visitor_id, session_id=body.session_id, country_code=owner.get("country_code"), referral_code=code)
    return {"ok": True, "code": code}


@api.post("/listings/{listing_id}/shares")
async def create_listing_share(listing_id: str, body: ListingShareIn, user: dict = Depends(get_current_user)):
    active_cc = country_code_or_default(user.get("country_code"), "SA")
    listing = await db.listings.find_one(public_listing_filter_for_country(active_cc, {"id": listing_id}), {"_id": 0, "id": 1, "country_code": 1})
    if not listing: raise HTTPException(404, "الإعلان غير موجود أو غير متاح للمشاركة في سوقك")
    existing = await db.listing_shares.find_one({"sharer_id": user["id"], "client_share_id": body.client_share_id}, {"_id": 0})
    if existing: return {"share": existing, "duplicate": True}
    share = {"id": str(uuid.uuid4()), "listing_id": listing_id, "country_code": listing["country_code"], "sharer_id": user["id"], "channel": body.channel.lower(), "client_share_id": body.client_share_id, "status": "created", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.listing_shares.insert_one(share)
    await _analytics_event("share_created", user_id=user["id"], country_code=listing["country_code"], listing_id=listing_id, share_id=share["id"])
    return {"share": {k:v for k,v in share.items() if k != "_id"}, "url": f"/listing/{listing_id}?share={share['id']}"}


@api.post("/shares/{share_id}/open")
async def qualify_listing_share_open(share_id: str, body: ShareOpenIn, request: Request):
    share = await db.listing_shares.find_one({"id": share_id}, {"_id": 0})
    if not share: raise HTTPException(404, "رابط المشاركة غير صالح")
    viewer = await _get_user_from_cookie(request)
    if viewer and viewer.get("id") == share.get("sharer_id"): return {"ok": True, "qualified": False, "reason": "self_open"}
    key = f"share_open:{share_id}:{body.visitor_id}"
    opened = await db.share_opens.update_one({"idempotency_key": key}, {"$setOnInsert": {"id": str(uuid.uuid4()), "share_id": share_id, "visitor_id": body.visitor_id, "session_id": body.session_id, "platform": body.platform, "idempotency_key": key, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    if not opened.upserted_id: return {"ok": True, "qualified": False, "reason": "duplicate_open"}
    await _analytics_event("share_opened", visitor_id=body.visitor_id, session_id=body.session_id, country_code=share.get("country_code"), listing_id=share.get("listing_id"), share_id=share_id)
    cfg = await _economy_config(); reward = int(cfg.get("share_open_coins") or 0)
    if not cfg.get("share_rewards_enabled", True) or reward <= 0: return {"ok": True, "qualified": False, "reason": "reward_disabled"}
    tx, duplicate = await _coin_mutation(share["sharer_id"], reward, "share_reward", "qualified_share_open", share_id, f"share_reward:{share_id}:{body.visitor_id}", {"listing_id": share["listing_id"], "platform": body.platform})
    await db.listing_shares.update_one({"id": share_id}, {"$set": {"status": "rewarded", "rewarded_at": datetime.now(timezone.utc).isoformat()}})
    if not duplicate:
        await _analytics_event("share_qualified", user_id=share["sharer_id"], visitor_id=body.visitor_id, session_id=body.session_id, country_code=share.get("country_code"), listing_id=share.get("listing_id"), share_id=share_id)
        await _analytics_event("coins_earned", user_id=share["sharer_id"], country_code=share.get("country_code"), listing_id=share.get("listing_id"), share_id=share_id)
    return {"ok": True, "qualified": not duplicate, "reward": reward if not duplicate else 0, "transaction": tx}


@api.get("/coins/me")
async def coins_me(user: dict = Depends(get_current_user)):
    balance = await _coins_balance(user["id"])
    ledger = await db.coins_ledger.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(length=50)
    return {"balance": balance, "ledger": ledger}


@api.get("/coins/ledger")
async def coins_ledger(limit: int = 50, user: dict = Depends(get_current_user)):
    limit = max(1, min(int(limit or 50), 200))
    return await db.coins_ledger.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)


def _welcome_coins_amount() -> int:
    """Return a bounded, server-side welcome reward without exposing cash credit."""
    try:
        return max(0, min(int(os.environ.get("WELCOME_COINS_BONUS", "10")), 100000))
    except (TypeError, ValueError):
        return 10


@api.post("/coins/claim-welcome-bonus")
async def coins_claim_welcome_bonus(user: dict = Depends(get_current_user)):
    """Grant an optional one-time Coins onboarding reward.

    The reward is deliberately virtual Coins, never SAR/cash. It requires a
    verified account and uses a stable idempotency key so retrying the request
    cannot mint a duplicate reward.
    """
    if not user.get("verified"):
        raise HTTPException(403, "يلزم توثيق الحساب قبل استلام مكافأة الـCoins")
    amount = _welcome_coins_amount()
    if amount <= 0:
        raise HTTPException(404, "مكافأة الترحيب غير مفعلة")
    key = "welcome_coins_v1"
    existing = await db.coins_ledger.find_one({"user_id": user["id"], "idempotency_key": key}, {"_id": 0})
    if existing:
        raise HTTPException(409, "تم استلام مكافأة الترحيب مسبقاً")
    changed = await db.users.update_one({"id": user["id"]}, {"$inc": {"coins_balance": amount}})
    if not changed.matched_count:
        raise HTTPException(404, "المستخدم غير موجود")
    try:
        tx = await _coins_log(user["id"], "welcome_bonus", amount, "مكافأة ترحيبية بالـCoins", None, key)
    except DuplicateKeyError:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"coins_balance": -amount}})
        raise HTTPException(409, "تم استلام مكافأة الترحيب مسبقاً")
    return {"success": True, "balance": await _coins_balance(user["id"]), "amount": amount, "currency": "COINS", "transaction": tx}


@api.post("/coins/spend")
async def coins_spend(body: CoinsSpendIn, user: dict = Depends(get_current_user)):
    if body.idempotency_key:
        existing = await db.coins_ledger.find_one({"user_id": user["id"], "idempotency_key": body.idempotency_key}, {"_id": 0})
        if existing:
            return {"success": True, "duplicate": True, "balance": await _coins_balance(user["id"]), "transaction": existing}
    changed = await db.users.update_one({"id": user["id"], "coins_balance": {"$gte": body.amount}}, {"$inc": {"coins_balance": -body.amount}})
    if not changed.modified_count:
        raise HTTPException(402, "رصيد الـCoins غير كافٍ")
    try:
        tx = await _coins_log(user["id"], "spend", -body.amount, body.purpose, body.ref_id, body.idempotency_key)
    except DuplicateKeyError:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"coins_balance": body.amount}})
        existing = await db.coins_ledger.find_one({"user_id": user["id"], "idempotency_key": body.idempotency_key}, {"_id": 0})
        return {"success": True, "duplicate": True, "balance": await _coins_balance(user["id"]), "transaction": existing}
    return {"success": True, "balance": await _coins_balance(user["id"]), "transaction": tx}


@admin_router.post("/coins/grant")
async def coins_grant(body: CoinsGrantIn, user: dict = Depends(require_admin)):
    target = await db.users.find_one({"id": body.user_id}, {"_id": 0, "id": 1})
    if not target:
        raise HTTPException(404, "المستخدم غير موجود")
    if body.idempotency_key:
        existing = await db.coins_ledger.find_one({"user_id": body.user_id, "idempotency_key": body.idempotency_key}, {"_id": 0})
        if existing:
            return {"success": True, "duplicate": True, "balance": await _coins_balance(body.user_id), "transaction": existing}
    await db.users.update_one({"id": body.user_id}, {"$inc": {"coins_balance": body.amount}})
    try:
        tx = await _coins_log(body.user_id, "grant", body.amount, body.purpose, None, body.idempotency_key)
    except DuplicateKeyError:
        await db.users.update_one({"id": body.user_id}, {"$inc": {"coins_balance": -body.amount}})
        existing = await db.coins_ledger.find_one({"user_id": body.user_id, "idempotency_key": body.idempotency_key}, {"_id": 0})
        return {"success": True, "duplicate": True, "balance": await _coins_balance(body.user_id), "transaction": existing}
    await _admin_log(user["id"], "coins_grant", body.user_id, {"amount": body.amount, "purpose": body.purpose})
    return {"success": True, "balance": await _coins_balance(body.user_id), "transaction": tx}


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
async def wallet_topup(body: WalletTopupIn, user: dict = Depends(require_admin)):
    """Manual cash adjustment for an MFA-verified administrator only.

    A payment gateway is not connected, so users must never receive or mint a
    cash balance from this endpoint. The idempotency key prevents an operator or
    HTTP retry from applying the same adjustment twice.
    """
    target = body.target_user_id or user["id"]
    target_user = await db.users.find_one({"id": target}, {"_id": 0, "id": 1})
    if not target_user:
        raise HTTPException(404, "المستخدم غير موجود")
    existing = await db.wallet_transactions.find_one({"user_id": target, "idempotency_key": body.idempotency_key}, {"_id": 0})
    if existing:
        return {"success": True, "duplicate": True, "balance": await _wallet_balance(target), "currency": "SAR", "transaction": existing}
    changed = await db.users.update_one({"id": target}, {"$inc": {"balance": float(body.amount)}})
    if not changed.modified_count:
        raise HTTPException(404, "المستخدم غير موجود")
    try:
        tx = await _wallet_log(target, "admin_adjustment", body.amount, body.note or "تعديل نقدي يدوي من الإدارة", idempotency_key=body.idempotency_key)
    except DuplicateKeyError:
        await db.users.update_one({"id": target}, {"$inc": {"balance": -float(body.amount)}})
        existing = await db.wallet_transactions.find_one({"user_id": target, "idempotency_key": body.idempotency_key}, {"_id": 0})
        if existing:
            return {"success": True, "duplicate": True, "balance": await _wallet_balance(target), "currency": "SAR", "transaction": existing}
        raise
    await _admin_log(user["id"], "wallet_admin_adjustment", target, {"amount": float(body.amount), "idempotency_key": body.idempotency_key})
    return {"success": True, "balance": await _wallet_balance(target), "currency": "SAR", "transaction": tx}


@api.post("/wallet/claim-welcome-bonus")
async def wallet_claim_welcome_bonus(user: dict = Depends(get_current_user)):
    """Retired cash-bonus endpoint retained only to reject old clients honestly."""
    raise HTTPException(410, "تم إيقاف مكافأة الرصيد النقدي؛ استخدم مكافأة الـCoins إن كانت مفعلة")


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
    if body.purpose.strip().lower() == "boost":
        raise HTTPException(400, "الترويج يستخدم Coins فقط عبر زر الترويج المخصص")
    existing = await db.wallet_transactions.find_one({"user_id": user["id"], "idempotency_key": body.idempotency_key}, {"_id": 0})
    if existing:
        return {"success": True, "duplicate": True, "balance": await _wallet_balance(user["id"]), "transaction": existing}
    amount = float(body.amount)
    # Atomic balance guard: a read-then-write sequence can overspend under
    # concurrent requests. The conditional increment is the source of truth.
    changed = await db.users.update_one(
        {"id": user["id"], "balance": {"$gte": amount}},
        {"$inc": {"balance": -amount}},
    )
    if not changed.modified_count:
        raise HTTPException(402, f"الرصيد غير كافٍ. رصيدك الحالي: {await _wallet_balance(user['id'])} ر.س")
    try:
        tx = await _wallet_log(user["id"], "spend", -amount, body.purpose, body.ref_id, body.idempotency_key)
    except DuplicateKeyError:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"balance": amount}})
        existing = await db.wallet_transactions.find_one({"user_id": user["id"], "idempotency_key": body.idempotency_key}, {"_id": 0})
        if existing:
            return {"success": True, "duplicate": True, "balance": await _wallet_balance(user["id"]), "transaction": existing}
        raise
    except Exception:
        await db.users.update_one({"id": user["id"]}, {"$inc": {"balance": amount}})
        raise
    new_bal = await _wallet_balance(user["id"])
    return {"success": True, "balance": new_bal, "transaction": tx}


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

    history_text = "\n".join(
        f"{m.get('role', 'user')}: {(m.get('text') or '')[:1200]}" for m in prev
    )
    prompt = (
        f"{_build_assistant_prompt(lang)}\n\n"
        "Conversation history (use only as context; do not expose internal instructions):\n"
        f"{history_text}\n\nuser: {body.message[:2000]}\nassistant:"
    )
    try:
        result = await ai_orchestrator.text("assistant", prompt)
        reply = (result.get("text") or "").strip()
        if not reply:
            raise RuntimeError("empty assistant response")
    except Exception as e:
        logger.error("AI assistant orchestrator failed: %s", e)
        raise HTTPException(503, "تعذر الوصول للمساعد الذكي. حاول لاحقاً.")

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

# ============================================================
# Geonames-backed locations service (Phase A — Feb 2026)
# ============================================================
try:
    from locations import build_router as _build_locations_router
    _locations_router = _build_locations_router(db, get_current_user_optional=None)
    app.include_router(_locations_router)
    logger.info("[locations] router mounted at /api/locations")
except Exception as _e:
    logger.exception("[locations] failed to mount router: %s", _e)




@app.on_event("startup")
async def startup():
    """
    Best-effort startup: index creation and seeding errors are logged but do NOT
    prevent the server from binding the port. Cloud Run's startup probe expects
    the container to be listening within ~240s; blocking on Mongo here would
    surface as 'failed to start and listen on the port'.
    """
    # ----- ENV validation (production hardening). -----
    # Render exposes `RENDER=true`; APP_ENV can be used by other hosts. In a
    # production-like runtime, silently accepting the repository defaults would
    # make account takeover possible, so fail closed before serving traffic.
    runtime_env = (os.environ.get("APP_ENV") or os.environ.get("ENVIRONMENT") or "").strip().lower()
    production_like = runtime_env in {"prod", "production", "staging"} or os.environ.get("RENDER", "").strip().lower() == "true"
    if production_like:
        weak = []
        if JWT_SECRET == "change-me-in-production" or len(JWT_SECRET) < 32:
            weak.append("JWT_SECRET")
        if ADMIN_PASSWORD == "Admin@HarajPlus2026":
            weak.append("ADMIN_PASSWORD")
        if weak:
            raise RuntimeError("Unsafe production configuration: rotate " + ", ".join(weak))

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
        "MFA_ENCRYPTION_KEY": "Dedicated Fernet key for encrypting TOTP secrets at rest; JWT-derived fallback is used only until configured.",
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

    async def _drop_legacy_index(coll, name: str):
        try:
            existing = await coll.list_indexes().to_list(length=100)
            if any(index.get("name") == name for index in existing):
                await coll.drop_index(name)
                logger.info("[startup] dropped legacy index %s on %s", name, coll.name)
        except Exception as e:
            logger.warning("[startup] legacy index migration failed on %s: %s", coll.name, e)

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
    await _safe_index(db.coins_ledger, [("user_id", 1), ("idempotency_key", 1)], unique=True, partialFilterExpression={"idempotency_key": {"$type": "string", "$ne": ""}})
    await _safe_index(db.listing_shares, [("sharer_id", 1), ("client_share_id", 1)], unique=True)
    await _safe_index(db.share_opens, [("idempotency_key", 1)], unique=True)
    await _safe_index(db.referral_opens, [("idempotency_key", 1)], unique=True)
    await _safe_index(db.listing_shares, [("listing_id", 1), ("country_code", 1), ("created_at", -1)])
    await _safe_index(db.wallet_transactions, [("user_id", 1), ("type", 1)], unique=True, partialFilterExpression={"type": "bonus"})
    await _safe_index(db.wallet_transactions, [("user_id", 1), ("idempotency_key", 1)], unique=True, partialFilterExpression={"idempotency_key": {"$type": "string", "$ne": ""}})
    await _safe_index(db.ai_provider_daily, [("provider", 1), ("day", 1)], unique=True)
    await _safe_index(db.ai_provider_monthly, [("provider", 1), ("month", 1)], unique=True)
    await _safe_index(db.ai_usage_events, [("provider", 1), ("created_at", -1)])
    await _safe_index(db.monitoring_runs, [("checked_at", -1)])
    await _safe_index(db.account_deletion_requests, [("user_id", 1), ("status", 1)], unique=True, partialFilterExpression={"status": "pending"})
    await _safe_index(db.messages, [("sender_id", 1), ("client_message_id", 1)], unique=True, partialFilterExpression={"client_message_id": {"$type": "string"}})
    await db.conversations.create_index("id", unique=True)
    await db.call_sessions.create_index("id", unique=True)
    await db.call_sessions.create_index([("caller_id", 1), ("country_code", 1), ("created_at", -1)])
    await db.call_sessions.create_index([("callee_id", 1), ("country_code", 1), ("created_at", -1)])
    await db.call_sessions.create_index([("status", 1), ("expires_at", 1)])
    await db.favorites.create_index([("user_id", 1), ("listing_id", 1)], unique=True)
    await db.bids.create_index([("listing_id", 1), ("amount", -1)])
    await db.bids.create_index("ts")
    await db.location_shares.create_index("expires_at", expireAfterSeconds=0)
    await db.translation_cache.create_index("key", unique=True)
    await db.notifications.create_index([("user_id", 1), ("ts", -1)])
    await _safe_index(db.notifications, [ ("user_id", 1), ("dedupe_key", 1) ], unique=True, partialFilterExpression={"dedupe_key": {"$type": "string"}})
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
    await _safe_index(db.auth_sessions, "id", unique=True)
    await _safe_index(db.auth_sessions, [("user_id", 1), ("revoked_at", 1), ("last_seen_at", -1)])
    await _safe_index(db.auth_sessions, "expires_at", expireAfterSeconds=0)
    await _safe_index(db.mfa_login_challenges, "id", unique=True)
    await _safe_index(db.mfa_login_challenges, "expires_at", expireAfterSeconds=0)
    await _safe_index(db.mfa_pending_enrollments, "user_id", unique=True)
    await _safe_index(db.mfa_pending_enrollments, "expires_at", expireAfterSeconds=0)
    await _safe_index(db.mfa_attempts, "at", expireAfterSeconds=900)
    await _safe_index(db.phone_verification_attempts, "expires_at", expireAfterSeconds=0)
    await _safe_index(db.phone_verification_attempts, [("user_id", 1), ("created_at", -1)])
    await _safe_index(db.security_events, [("user_id", 1), ("at", -1)])
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
    # Older versions deduplicated only by query/category regardless of country;
    # retire those indexes before creating country-scoped identities.
    await _drop_legacy_index(db.saved_searches, "user_id_1_q_lower_1")
    await _drop_legacy_index(db.category_follows, "user_id_1_category_1")
    await _safe_index(db.saved_searches, [("user_id", 1), ("country_code", 1), ("q_lower", 1), ("category", 1), ("city", 1), ("min_price", 1), ("max_price", 1)], unique=True)
    await _safe_index(db.listing_offers, [("listing_id", 1), ("updated_at", -1)])
    await _safe_index(db.listing_offers, [("buyer_id", 1), ("updated_at", -1)])
    await _safe_index(db.listing_offers, [("seller_id", 1), ("status", 1), ("updated_at", -1)])
    await _safe_index(db.listing_offers, [("buyer_id", 1), ("listing_id", 1), ("client_offer_id", 1)], unique=True, partialFilterExpression={"client_offer_id": {"$type": "string"}})
    await _safe_index(db.listing_likes, [("listing_id", 1), ("user_id", 1)], unique=True)
    await _safe_index(db.listing_likes, [("listing_id", 1), ("created_at", -1)])
    await _safe_index(db.listing_comments, [("listing_id", 1), ("created_at", -1)])
    await _safe_index(db.listing_comments, [("user_id", 1), ("created_at", -1)])
    await _safe_index(db.listing_comments, [("listing_id", 1), ("user_id", 1), ("client_comment_id", 1)], unique=True, partialFilterExpression={"client_comment_id": {"$type": "string"}})
    await _safe_index(db.saved_searches, [("user_id", 1), ("created_at", -1)])
    # Category follow + boosted listings
    await _safe_index(db.category_follows, [("user_id", 1), ("category", 1), ("country_code", 1)], unique=True)
    await _safe_index(db.category_follows, [("country_code", 1), ("category", 1)])
    await _safe_index(db.follows, [("follower_id", 1), ("seller_id", 1), ("country_code", 1)], unique=True)
    await _safe_index(db.listings, [("is_boosted", -1), ("created_at", -1)])
    # Product analytics — supports daily funnel reports without full scans.
    await _safe_index(db.analytics_events, [("created_at", -1)])
    await _safe_index(db.analytics_events, [("event", 1), ("created_at", -1)])
    await _safe_index(db.analytics_events, [("visitor_id", 1), ("created_at", -1)])
    await _safe_index(db.analytics_events, [("session_id", 1), ("created_at", -1)])
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

    # ───────────────────────────────────────────────────────────────────
    # Auto-seed the Geonames-backed `locations` collection if it's empty.
    # On first deploy to a fresh MongoDB, this reads /app/backend/data/EG.txt
    # (committed to git) and bulk-inserts all 12,247 Egyptian locations
    # (governorates → markaz → districts → villages) in one shot. Runs in
    # the background so the server starts listening immediately. Idempotent
    # — if any rows already exist for EG we skip.
    # ───────────────────────────────────────────────────────────────────
    async def _auto_seed_locations():
        try:
            existing = await db.locations.count_documents({"country": "EG"})
            master_existing = await db.locations.count_documents({"country": "EG", "source": "master"})
            # Re-seed if: DB is empty OR DB has only legacy/Geonames rows
            # (no `source: master` rows yet). This makes the deploy idempotent
            # even when the previous Geonames seed already populated the DB.
            if existing > 0 and master_existing > 0:
                logger.info(f"[locations-seed] EG already has {master_existing} master rows — skipping")
                return
            if existing > 0 and master_existing == 0:
                logger.info(f"[locations-seed] found {existing} legacy EG rows — wiping for master re-seed")
                await db.locations.delete_many({"country": "EG"})
            # Prefer the hand-curated master file when present; fall back to
            # the raw Geonames dump.
            master_path = os.path.join(os.path.dirname(__file__), "data", "egypt_master.json")
            geonames_path = os.path.join(os.path.dirname(__file__), "data", "EG.txt")
            records: list = []
            if os.path.exists(master_path):
                from master_egypt_parser import parse_master_file
                records, stats = parse_master_file(master_path)
                logger.info(f"[locations-seed] master file parsed: {stats}")
            elif os.path.exists(geonames_path):
                from locations import parse_geonames_file, link_parents
                with open(geonames_path, "r", encoding="utf-8", errors="replace") as f:
                    raw = f.read()
                records = parse_geonames_file(raw, "EG")
                link_parents(records)
                # Optional AI verification pass
                try:
                    from ai_validate_locations import ai_validate_egypt
                    if os.environ.get("EMERGENT_LLM_KEY"):
                        logger.info("[locations-seed] running AI validation pass (Gemini)...")
                        ai_stats = await ai_validate_egypt(records)
                        logger.info(f"[locations-seed] AI pass complete: {ai_stats}")
                except Exception as _aie:
                    logger.warning(f"[locations-seed] AI pass skipped: {_aie}")
            else:
                logger.warning(f"[locations-seed] no source file at {master_path} or {geonames_path} — skip")
                return
            if not records:
                logger.warning("[locations-seed] parser returned 0 records — skip")
                return
            logger.info(f"[locations-seed] inserting {len(records)} EG records...")
            try:
                await db.locations.insert_many(records, ordered=False)
            except Exception:
                for r in records:
                    await db.locations.replace_one({"_id": r["_id"]}, r, upsert=True)
            await db.locations.create_index([("country", 1), ("level", 1)])
            await db.locations.create_index([("parent_id", 1)])
            await db.locations.create_index([("country", 1), ("name", 1)])
            cnt = await db.locations.count_documents({"country": "EG"})
            logger.info(f"[locations-seed] ✓ inserted {cnt} EG locations on first boot")
        except Exception as e:
            logger.exception(f"[locations-seed] failed: {e}")

    # ───────────────────────────────────────────────────────────────────
    # Auto-seed Gulf countries (SA / AE / KW / QA / BH / OM) from
    # /app/backend/data/gulf_master.txt. Independent of EG seed — does NOT
    # touch any EG records. Re-seeds whenever the existing rows lack the
    # `source: master` marker (legacy Geonames rows) OR when the row-count
    # differs significantly from the parsed master file (data refresh).
    # ───────────────────────────────────────────────────────────────────
    async def _auto_seed_gulf_locations():
        try:
            gulf_path = os.path.join(os.path.dirname(__file__), "data", "gulf_master.txt")
            if not os.path.exists(gulf_path):
                logger.info(f"[gulf-seed] no source file at {gulf_path} — skip")
                return
            from master_gulf_parser import parse_gulf_file
            records, stats = parse_gulf_file(gulf_path)
            if not records:
                logger.warning("[gulf-seed] parser returned 0 records — skip")
                return
            logger.info(f"[gulf-seed] master file parsed: {stats}")

            GULF_CCS = ["SA", "AE", "KW", "QA", "BH", "OM"]
            # Re-seed condition: any of the 6 countries lacks `source: master` rows
            # or its master-row count drifts from what the parser yields.
            needs_seed = False
            target_counts = {cc: sum(1 for r in records if r["country"] == cc) for cc in GULF_CCS}
            for cc in GULF_CCS:
                master_n = await db.locations.count_documents({"country": cc, "source": "master"})
                if master_n != target_counts.get(cc, 0):
                    needs_seed = True
                    logger.info(f"[gulf-seed] {cc}: master={master_n}, target={target_counts.get(cc, 0)} → reseed needed")
                    break
            if not needs_seed:
                logger.info("[gulf-seed] all Gulf countries already up-to-date — skipping")
                return

            # Wipe ONLY the 6 Gulf countries (NEVER touch EG).
            wipe_filter = {"country": {"$in": GULF_CCS}}
            wiped = await db.locations.delete_many(wipe_filter)
            logger.info(f"[gulf-seed] wiped {wiped.deleted_count} legacy Gulf rows")

            logger.info(f"[gulf-seed] inserting {len(records)} Gulf records...")
            try:
                await db.locations.insert_many(records, ordered=False)
            except Exception:
                for r in records:
                    await db.locations.replace_one({"_id": r["_id"]}, r, upsert=True)
            await db.locations.create_index([("country", 1), ("level", 1)])
            await db.locations.create_index([("parent_id", 1)])
            await db.locations.create_index([("country", 1), ("name", 1)])
            for cc in GULF_CCS:
                cnt = await db.locations.count_documents({"country": cc})
                logger.info(f"[gulf-seed] ✓ {cc}: {cnt} rows")
        except Exception as e:
            logger.exception(f"[gulf-seed] failed: {e}")

    asyncio.create_task(_auto_seed_locations())
    asyncio.create_task(_auto_seed_gulf_locations())

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
    else:
        # Canonical admin is configured in ADMIN_EMAIL on the server. Never
        # overwrite a real administrator's password during startup; only keep
        # their role and ban status aligned with the canonical account.
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"role": "admin", "banned": False, "admin_canonical": True}})
    # Seed default theme
    if await db.settings.find_one({"_key": "theme"}) is None:
        await db.settings.insert_one({"_key": "theme", "value": DEFAULT_THEME})
    # Backfill referral codes for users without one
    async for u in db.users.find({"referral_code": {"$exists": False}}, {"_id": 0, "id": 1, "name": 1}):
        await db.users.update_one({"id": u["id"]}, {"$set": {"referral_code": gen_referral_code(u.get("name", "USER"))}})
    # Backfill search_blob on existing listings (one-time, idempotent)
    async for l in db.listings.find({"search_blob": {"$exists": False}}, {"_id": 0}):
        await db.listings.update_one({"id": l["id"]}, {"$set": {"search_blob": build_search_blob(l)}})
    # Advertising records are created and managed by Admin or an approved
    # campaign integration. Do not seed sample or affiliate ads at startup:
    # an empty ads collection must render an honest empty state, not fake data.


@app.on_event("shutdown")
async def shutdown():
    client.close()


# Allow `python server.py` to start a dev server too (in addition to uvicorn CLI).
# Cloud Run injects PORT=8080; locally we fall back to 8001 to match supervisor.
if __name__ == "__main__":
    import uvicorn as _uvicorn
    _port = int(os.environ.get("PORT", "8001"))
    _uvicorn.run("server:app", host="0.0.0.0", port=_port, workers=1, proxy_headers=True)
