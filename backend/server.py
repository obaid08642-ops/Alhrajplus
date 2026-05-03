"""
الحراج بلس - Backend FastAPI
JWT Auth + Listings + Categories + Cities + Chat + Admin + Cloudinary + Ads
"""
from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import time
import secrets
import bcrypt
import jwt
import cloudinary
import cloudinary.utils
import cloudinary.uploader
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient

from seed_data import COUNTRIES, CATEGORIES, DEFAULT_THEME

# ============================================================
# Configuration
# ============================================================
ROOT_DIR = Path(__file__).parent
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

# Cloudinary
cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True,
)

# DB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ============================================================
# App
# ============================================================
app = FastAPI(title="Haraj Plus API", version="1.0")
api = APIRouter(prefix="/api")

cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    country_code: str = Field(min_length=2, max_length=3)  # SA, AE, ...
    city: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ListingIn(BaseModel):
    title: str = Field(min_length=4, max_length=120)
    description: str = Field(min_length=10, max_length=4000)
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

class ChatMessageIn(BaseModel):
    listing_id: Optional[str] = None
    receiver_id: str
    text: Optional[str] = None
    image: Optional[str] = None
    voice: Optional[str] = None
    location: Optional[dict] = None  # {lat, lng}

class ReportIn(BaseModel):
    target_type: str  # listing | user | message
    target_id: str
    reason: str

class AdIn(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = ""
    placement: str  # home_top | home_middle | home_bottom | listing_bottom | sidebar
    active: bool = True
    country_code: Optional[str] = None  # filter by country, None = all

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
async def get_categories():
    return CATEGORIES

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
async def register(body: RegisterIn, response: Response):
    # validate country
    valid_codes = {c["code"] for c in COUNTRIES}
    if body.country_code not in valid_codes:
        raise HTTPException(400, "Invalid country code")
    email = body.email.lower().strip()
    existing = await db.users.find_one({"$or": [{"email": email}, {"phone_full": f"{body.country_code}{body.phone}"}]})
    if existing:
        raise HTTPException(400, "البريد أو رقم الجوال مسجل مسبقاً")
    uid = str(uuid.uuid4())
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
        "trust_score": 50,
        "avatar_url": None,
        "bio": "",
        "language": "ar",
        "banned": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    user.pop("password_hash", None)
    user.pop("_id", None)
    access = create_access_token(uid, email, "user")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"user": user, "access_token": access}

@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "0.0.0.0"
    identifier = f"{ip}:{email}"
    # brute force lockout
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    fails = await db.login_attempts.count_documents({
        "identifier": identifier,
        "ts": {"$gt": cutoff.isoformat()}
    })
    if fails >= 5:
        raise HTTPException(429, "تم قفل الحساب مؤقتاً. حاول بعد 15 دقيقة")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.insert_one({"identifier": identifier, "ts": datetime.now(timezone.utc).isoformat()})
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
    return {"user": user, "access_token": access}

@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"success": True}

@api.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
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
    doc = {
        "id": listing_id,
        "user_id": user["id"],
        "title": body.title.strip(),
        "description": body.description.strip(),
        "price": body.price,
        "currency": body.currency or "ر.س",
        "category": body.category,
        "subcategory": body.subcategory,
        "custom_fields": body.custom_fields,
        "images": body.images,
        "videos": body.videos,
        "country_code": user.get("country_code"),
        "city": body.city,
        "district": body.district,
        "lat": body.lat,
        "lng": body.lng,
        "show_phone": body.show_phone,
        "status": "active",  # active | pending | rejected | sold
        "moderation": "pending" if any_banned_word(f"{body.title} {body.description}") else "approved",
        "views": 0,
        "favorites": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.listings.insert_one(doc)
    doc.pop("_id", None)
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
    limit: int = 30,
    skip: int = 0,
):
    query: dict = {"status": "active", "moderation": {"$ne": "rejected"}}
    if country_code:
        query["country_code"] = country_code
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if city:
        query["city"] = city
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    if min_price is not None or max_price is not None:
        pq: dict = {}
        if min_price is not None:
            pq["$gte"] = min_price
        if max_price is not None:
            pq["$lte"] = max_price
        query["price"] = pq
    sort_field = [("created_at", -1)]
    if sort == "price_asc":
        sort_field = [("price", 1)]
    elif sort == "price_desc":
        sort_field = [("price", -1)]
    elif sort == "popular":
        sort_field = [("views", -1)]

    total = await db.listings.count_documents(query)
    cursor = db.listings.find(query, {"_id": 0}).sort(sort_field).skip(skip).limit(min(limit, 60))
    items = await cursor.to_list(length=limit)
    return {"total": total, "items": items}

@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    item = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    # fetch seller minimal info
    seller = await db.users.find_one({"id": item["user_id"]}, {"_id": 0, "id": 1, "name": 1, "phone": 1, "phone_full": 1, "verified": 1, "trust_score": 1, "avatar_url": 1, "created_at": 1})
    item["seller"] = seller
    return item

@api.get("/listings/{listing_id}/similar")
async def similar_listings(listing_id: str, limit: int = 8):
    base = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not base:
        raise HTTPException(404)
    # similarity: same category + same city > same category + nearby
    same_city = await db.listings.find(
        {"category": base["category"], "city": base["city"], "id": {"$ne": listing_id}, "status": "active"},
        {"_id": 0}
    ).limit(limit).to_list(length=limit)
    if len(same_city) < limit:
        more = await db.listings.find(
            {"category": base["category"], "city": {"$ne": base["city"]}, "id": {"$ne": listing_id}, "status": "active"},
            {"_id": 0}
        ).limit(limit - len(same_city)).to_list(length=limit)
        same_city.extend(more)
    return same_city

@api.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user: dict = Depends(get_current_user)):
    item = await db.listings.find_one({"id": listing_id})
    if not item:
        raise HTTPException(404)
    if item["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403)
    await db.listings.delete_one({"id": listing_id})
    return {"success": True}

@api.get("/listings/me/mine")
async def my_listings(user: dict = Depends(get_current_user)):
    items = await db.listings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=200)
    return items

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
    return msg

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
    return {"updated": r.modified_count}

@admin_router.post("/listings/{lid}/reject")
async def admin_reject(lid: str):
    r = await db.listings.update_one({"id": lid}, {"$set": {"moderation": "rejected", "status": "rejected"}})
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
# Mount routers
# ============================================================
api.include_router(admin_router)
app.include_router(api)


# ============================================================
# Startup: indexes + seed admin
# ============================================================
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone_full")
    await db.users.create_index("id", unique=True)
    await db.listings.create_index("id", unique=True)
    await db.listings.create_index([("category", 1), ("city", 1), ("created_at", -1)])
    await db.listings.create_index([("country_code", 1), ("status", 1)])
    await db.listings.create_index([("title", "text"), ("description", "text")])
    await db.messages.create_index([("convo_id", 1), ("ts", 1)])
    await db.conversations.create_index("id", unique=True)
    await db.favorites.create_index([("user_id", 1), ("listing_id", 1)], unique=True)
    await db.login_attempts.create_index("ts", expireAfterSeconds=900)
    await db.reports.create_index("status")
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


@app.on_event("shutdown")
async def shutdown():
    client.close()
