=== DETAIL UI ACTIONS ===
4:import { telLink, whatsappLink, normalizePhone } from "@/lib/phone";
5:import { Heart, Phone, MessageCircle, MapPin, Eye, Calendar, Share2, Flag, ChevronLeft, Star, ChevronRight, Sparkles, TrendingUp, ShieldAlert, Maximize2, RotateCw, Edit3, RefreshCw, CheckCircle2, Trash2, Bell, Tag } from "lucide-react";
52:    const [showPhone, setShowPhone] = useState(false);
54:    const [following, setFollowing] = useState(false);
55:    const [watching, setWatching] = useState(false);
76:                    api.get(`/sellers/${l.data.user_id}/follow-status`).then(({ data }) => setFollowing(!!data.following)).catch(() => {});
77:                    api.get(`/watches`).then(({ data }) => setWatching((data || []).some((w) => w.listing_id === l.data.id))).catch(() => {});
87:            const { data } = await api.post(`/sellers/${listing.user_id}/follow`);
88:            setFollowing(!!data.following);
94:            if (watching) {
95:                await api.delete(`/watches/${listing.id}`);
98:                await api.post(`/watches`, { listing_id: listing.id, target_price: listing.price });
264:                            <button data-testid="share-btn" onClick={async () => {
266:                                const shareData = { title: listing.title, text: `${listing.title} - الحراج بلس`, url };
268:                                    if (navigator.share) {
269:                                        await navigator.share(shareData);
275:                            }} className="px-3 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body text-sm font-bold whitespace-nowrap" title={tr("مشاركة الإعلان")}><Share2 className="w-4 h-4" /><span>{tr("مشاركة الإعلان")}</span></button>
291:                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views || 0} مشاهدة</span>
382:                                <button data-testid="follow-seller-btn-mobile" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
383:                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
388:                            <button data-testid="watch-price-btn-mobile" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
389:                                <Bell className="w-3.5 h-3.5" /> {watching ? tr("✓ تنبيه السعر مفعّل") : tr("نبّهني عند تخفيض السعر")}
396:                                const norm = normalizePhone(ph, cc);
401:                                            <Phone className="w-4 h-4" /> {showPhone ? norm : "اتصال مباشر"}
403:                                        <a href={whatsappLink(ph, waMsg, cc)} rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
404:                                            <MessageCircle className="w-4 h-4" /> {t("whatsapp")}
462:                                <button data-testid="follow-seller-btn-desktop" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
463:                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
469:                            <button data-testid="watch-price-btn-desktop" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
470:                                <Bell className="w-3.5 h-3.5" /> {watching ? tr("✓ تنبيه السعر مفعّل") : tr("نبّهني عند تخفيض السعر")}
481:                                        const norm = normalizePhone(ph, cc);
486:                                                    <Phone className="w-4 h-4" /> {showPhone ? norm : "اتصال مباشر"}
488:                                                {!showPhone && (
489:                                                    <button data-testid="show-phone-btn" onClick={() => setShowPhone(true)} className="w-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)] rounded-xl py-2 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic">
493:                                                <a data-testid="whatsapp-link" href={whatsappLink(ph, waMsg, cc)} rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
494:                                                    <MessageCircle className="w-4 h-4" /> {t("whatsapp")}
=== BACKEND FAVORITE/REACTION BLOCKS ===
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
    q: dict = public_listing_filter({"lat": {"$ne": None}, "lng": {"$ne": None}})
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
    """Toggle favorite (web frontend uses this as a toggle). Mobile uses the
    paired POST/DELETE pattern with `data.favorited` checked optimistically."""
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

@api.delete("/favorites/{listing_id}")
async def delete_favorite(listing_id: str, user: dict = Depends(get_current_user)):
    """Explicit unfavorite (idempotent). Mobile ListingCard + ReelsScreen call
    DELETE on unlike instead of relying on toggle semantics."""
    res = await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
    if res.deleted_count:
        await db.listings.update_one({"id": listing_id}, {"$inc": {"favorites": -1}})
    return {"favorited": False}

@api.get("/favorites/{listing_id}/check")
async def check_favorite(listing_id: str, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id})
    return {"favorited": bool(existing)}

@api.get("/favorites")
async def list_favorites(user: dict = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=500)
    listing_ids = [f["listing_id"] for f in favs]
    listings = await db.listings.find(public_listing_filter({"id": {"$in": listing_ids}}), {"_id": 0}).to_list(length=500)
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

=== BACKEND LISTING DETAIL/VIEWS ===
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
    query: dict = public_listing_filter({"created_at": {"$gte": cutoff}})
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
=== TEST COVERAGE NAMES ===
backend/tests/__pycache__/conftest.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_chat_hub_unit.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_haraj_plus.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_haraj_plus.cpython-312.pyc
backend/tests/__pycache__/test_iter12_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter12_features.cpython-312.pyc
backend/tests/__pycache__/test_iter13_regression.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter13_regression.cpython-312.pyc
backend/tests/__pycache__/test_iter14_trip_egypt.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter14_trip_egypt.cpython-312.pyc
backend/tests/__pycache__/test_iter15_trip_ads.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter15_trip_ads.cpython-312.pyc
backend/tests/__pycache__/test_iter16_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter16_features.cpython-312.pyc
backend/tests/__pycache__/test_iter17_seo.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter17_seo.cpython-312.pyc
backend/tests/__pycache__/test_iter18_search.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter18_search.cpython-312.pyc
backend/tests/__pycache__/test_iter19_push.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter19_push.cpython-312.pyc
backend/tests/__pycache__/test_iter20_chat_ws.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter20_chat_ws.cpython-312.pyc
backend/tests/__pycache__/test_iter21_i18n_categories.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter21_i18n_categories.cpython-312.pyc
backend/tests/__pycache__/test_iteration11_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration11_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration3_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration3_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration4_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration4_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration5_deals.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration5_deals.cpython-312.pyc
backend/tests/__pycache__/test_iteration6_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration6_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration7_x_oauth.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration7_x_oauth.cpython-312.pyc
backend/tests/__pycache__/test_iteration8_snap_push.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration8_snap_push.cpython-312.pyc
backend/tests/__pycache__/test_iteration9_search.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration9_search.cpython-312.pyc
backend/tests/__pycache__/test_new_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_new_features.cpython-312.pyc
backend/tests/__pycache__/test_public_visibility_policy.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_public_visibility_policy.cpython-312.pyc
backend/tests/conftest.py
backend/tests/test_chat_hub_unit.py
backend/tests/test_haraj_plus.py
backend/tests/test_iter12_features.py
backend/tests/test_iter13_regression.py
backend/tests/test_iter14_trip_egypt.py
backend/tests/test_iter15_trip_ads.py
backend/tests/test_iter16_features.py
backend/tests/test_iter17_seo.py
backend/tests/test_iter18_search.py
backend/tests/test_iter19_push.py
backend/tests/test_iter20_chat_ws.py
backend/tests/test_iter21_i18n_categories.py
backend/tests/test_iteration11_features.py
backend/tests/test_iteration3_features.py
backend/tests/test_iteration4_features.py
backend/tests/test_iteration5_deals.py
backend/tests/test_iteration6_features.py
backend/tests/test_iteration7_x_oauth.py
backend/tests/test_iteration8_snap_push.py
backend/tests/test_iteration9_search.py
backend/tests/test_new_features.py
backend/tests/test_public_visibility_policy.py
