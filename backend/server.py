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
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query, APIRouter, WebSocket, WebSocketDisconnect
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
    EMERGENT_LLM_KEY = GEMINI_API_KEY  # emergentintegrations accepts direct Gemini keys too
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

# ============================================================
# App
# ============================================================
app = FastAPI(title="Haraj Plus API", version="1.0")
api = APIRouter(prefix="/api")


@api.get("/health", include_in_schema=False)
@api.head("/health", include_in_schema=False)
async def health_api():
    """DB-aware health check. Returns 200 even if DB is slow — frontend just needs proof the server is up."""
    db_ok = False
    try:
        await asyncio.wait_for(client.admin.command("ping"), timeout=2.0)
        db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok", "db": "up" if db_ok else "down"}

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
@app.middleware("http")
async def _perf_logger(request, call_next):
    import time as _t
    start = _t.perf_counter()
    try:
        response = await call_next(request)
    except Exception as e:
        dur_ms = (_t.perf_counter() - start) * 1000
        logger.error(f"[perf] {request.method} {request.url.path} 500 {dur_ms:.0f}ms err={e}")
        raise
    dur_ms = (_t.perf_counter() - start) * 1000
    # Only log slow (>500ms) or error responses to keep stdout clean
    if dur_ms > 500 or response.status_code >= 500:
        logger.warning(f"[perf] {request.method} {request.url.path} {response.status_code} {dur_ms:.0f}ms")
    # Add Server-Timing so the browser DevTools shows duration
    response.headers["Server-Timing"] = f"app;dur={dur_ms:.0f}"
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
    return COUNTRIES

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
    avatar_url: Optional[str] = None


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
            cc = user.get("country_code", "SA")
            rule = PHONE_RULES.get(cc)
            if rule:
                pref = rule["prefix"] if isinstance(rule["prefix"], list) else [rule["prefix"]]
                if len(p) != rule["length"] or not any(p.startswith(pp) for pp in pref):
                    raise HTTPException(400, "رقم الجوال غير صحيح")
            update["phone"] = p
            # Build phone_full from country code
            country_phone_codes = {"SA": "+966", "AE": "+971", "KW": "+965", "QA": "+974", "BH": "+973", "OM": "+968", "EG": "+20"}
            update["phone_full"] = f"{country_phone_codes.get(cc, '+966')}{p}"
    if body.city is not None:
        update["city"] = body.city.strip()
    if body.avatar_url is not None:
        update["avatar_url"] = body.avatar_url
    if not update:
        return user
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    new_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return new_user

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
    listing_id = str(uuid.uuid4())
    is_banned = any_banned_word(f"{body.title} {body.description}")
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
        "country_code": user.get("country_code"),
        "city": body.city,
        "district": body.district,
        "lat": body.lat,
        "lng": body.lng,
        "show_phone": body.show_phone,
        "contact_phone": (body.contact_phone or "").strip() or None,
        "status": "active",
        "moderation": "pending" if is_banned else "approved",
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

    # Instant search-engine submission (IndexNow → Bing, Yandex, Seznam, Naver).
    # Fire-and-forget; never blocks listing creation.
    try:
        fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
        from urllib.parse import urlparse as _up
        host = _up(fe).hostname or "alhraj.online"
        _seo_submit_bg(db, [f"{fe}/listing/{doc['slug']}", f"{fe}/listing/{doc['id']}"], host)
        _google_idx_updated(f"{fe}/listing/{doc['slug']}")
    except Exception as _e:
        logger.warning(f"[IndexNow] enqueue failed: {_e}")

    return doc


BANNED_WORDS = ["مخدرات", "سلاح", "حشيش", "كوكايين", "احتيال", "نصب"]
def any_banned_word(text: str) -> bool:
    t = text.lower()
    return any(w in t for w in BANNED_WORDS)

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
    fields: str = "slim",  # "slim" = list-card fields only; "full" = legacy full doc
):
    # Production hard cap: never return more than 20 per request — keeps payload
    # under ~10KB even on slow networks, scalable to millions of listings.
    limit = max(1, min(limit, 20))
    # Allow ?page=2 in addition to ?skip=N. page is 1-indexed.
    if page and page > 0:
        skip = (page - 1) * limit
    skip = max(0, skip)

    query: dict = {"status": "active", "moderation": "approved"}
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

    sort_field = [("created_at", -1)]
    if sort == "oldest":
        sort_field = [("created_at", 1)]
    elif sort == "price_asc":
        sort_field = [("price", 1)]
    elif sort == "price_desc":
        sort_field = [("price", -1)]
    elif sort == "popular":
        sort_field = [("views", -1)]

    # Slim projection — only the fields a listing card actually renders.
    # Cuts response size by ~70% (no custom_fields/search_blob/media_urls/etc).
    SLIM_PROJ = {
        "_id": 0,
        "id": 1, "slug": 1, "title": 1, "price": 1, "currency": 1,
        "currency_code": 1, "category": 1, "subcategory": 1, "city": 1,
        "country_code": 1, "images": {"$slice": 1}, "created_at": 1,
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

    total = await db.listings.count_documents(query)
    cursor = db.listings.find(query, projection).sort(sort_field).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    body = {"total": total, "items": items, "page": page or (skip // limit + 1), "limit": limit}
    # Edge-cacheable for 60s; ETag lets browsers skip the body when nothing changed.
    import hashlib as _hl
    payload_str = jsonable_encoder(body)
    etag = _hl.md5(str(payload_str).encode("utf-8")).hexdigest()
    inm = request.headers.get("if-none-match") if request else None
    if inm and inm.strip('"') == etag:
        return Response(status_code=304, headers={"ETag": f'"{etag}"', "Cache-Control": "public, max-age=60"})
    return JSONResponse(content=payload_str, headers={"ETag": f'"{etag}"', "Cache-Control": "public, max-age=60"})

@api.get("/listings/by-slug/{slug}")
async def get_listing_by_slug(slug: str):
    """Resolve a listing by its SEO slug. Used by /listing/:slug URLs."""
    item = await db.listings.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "country_code": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    item["seller"] = seller
    return item


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    # Accept either UUID or slug for legacy/SEO URL compatibility
    item = await db.listings.find_one({"$or": [{"id": listing_id}, {"slug": listing_id}]}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
    # fetch seller minimal info
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "country_code": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    item["seller"] = seller
    return item

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
    await db.listings.delete_one({"id": listing_id})
    # Tell Google to deindex — best-effort, never blocks the response.
    try:
        fe = (os.environ.get("FRONTEND_URL", "https://alhraj.online") or "").rstrip("/")
        slug = item.get("slug")
        if slug:
            _google_idx_deleted(f"{fe}/listing/{slug}")
        _google_idx_deleted(f"{fe}/listing/{listing_id}")
    except Exception as _e:
        logger.warning(f"[google_indexing] delete enqueue failed: {_e}")
    return {"success": True}

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
    return {"success": True, "bid": bid}

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
async def get_messages(convo_id: str, user: dict = Depends(get_current_user)):
    parts = convo_id.split("_")
    if user["id"] not in parts:
        raise HTTPException(403)
    msgs = await db.messages.find({"convo_id": convo_id}, {"_id": 0}).sort("ts", 1).to_list(length=500)
    # mark as read
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
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    except Exception as e:
        logger.error(f"emergentintegrations import failed: {e}")
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
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    except Exception as e:
        logger.error(f"emergentintegrations import failed: {e}")
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
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        logger.error(f"emergentintegrations import failed: {e}")
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
        update_data["moderation"] = "pending" if any_banned_word(text_check) else "approved"
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
    return {
        "users": await db.users.count_documents({}),
        "listings": await db.listings.count_documents({}),
        "active_listings": await db.listings.count_documents({"status": "active"}),
        "pending_moderation": await db.listings.count_documents({"moderation": "pending"}),
        "open_reports": await db.reports.count_documents({"status": "open"}),
        "messages_24h": await db.messages.count_documents({"ts": {"$gt": today.isoformat()}}),
        "new_users_24h": await db.users.count_documents({"created_at": {"$gt": today.isoformat()}}),
        "ads": await db.ads.count_documents({"active": True}),
    }

@admin_router.get("/listings/pending")
async def admin_pending():
    return await db.listings.find({"moderation": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(length=200)

@admin_router.post("/listings/{lid}/approve")
async def admin_approve(lid: str):
    r = await db.listings.update_one({"id": lid}, {"$set": {"moderation": "approved"}})
    if r.modified_count:
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
async def admin_reject(lid: str):
    r = await db.listings.update_one({"id": lid}, {"$set": {"moderation": "rejected", "status": "rejected"}})
    if r.modified_count:
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
async def admin_users(limit: int = 100):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)

@admin_router.post("/users/{uid}/ban")
async def admin_ban(uid: str):
    r = await db.users.update_one({"id": uid}, {"$set": {"banned": True}})
    return {"updated": r.modified_count}

@admin_router.post("/users/{uid}/unban")
async def admin_unban(uid: str):
    r = await db.users.update_one({"id": uid}, {"$set": {"banned": False}})
    return {"updated": r.modified_count}

@admin_router.post("/users/{uid}/verify")
async def admin_verify(uid: str):
    r = await db.users.update_one({"id": uid}, {"$set": {"verified": True}})
    return {"updated": r.modified_count}

@admin_router.get("/reports")
async def admin_reports():
    return await db.reports.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(length=200)

@admin_router.post("/reports/{rid}/close")
async def admin_close_report(rid: str):
    r = await db.reports.update_one({"id": rid}, {"$set": {"status": "closed"}})
    return {"updated": r.modified_count}

# Theme settings
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
    return await db.ads.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=200)

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
    target: str = Field(default="all", pattern="^(all|verified|unverified|country)$")
    country_code: Optional[str] = None

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
    user_ids = [u["id"] async for u in db.users.find(q, {"_id": 0, "id": 1})]
    docs = [
        {"id": str(uuid.uuid4()), "user_id": uid, "title": body.title, "body": body.body,
         "type": "admin_broadcast", "read": False, "ts": datetime.now(timezone.utc).isoformat()}
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
            url="/",
            data={"type": "admin_broadcast"},
            pref_key="broadcasts",
        ))
    return {"sent": len(docs), "target": body.target, "push_devices": await db.push_tokens.count_documents({"user_id": {"$in": user_ids}}) if user_ids else 0}

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
        from emergentintegrations.llm.chat import LlmChat, UserMessage
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


app.include_router(api)




@app.on_event("startup")
async def startup():
    """
    Best-effort startup: index creation and seeding errors are logged but do NOT
    prevent the server from binding the port. Cloud Run's startup probe expects
    the container to be listening within ~240s; blocking on Mongo here would
    surface as 'failed to start and listen on the port'.
    """
    try:
        # Probe Mongo with a short timeout — if it fails we still come up so
        # the platform can show a useful error in the response body.
        await asyncio.wait_for(client.admin.command("ping"), timeout=8.0)
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
