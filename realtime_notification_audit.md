=== BACKEND PUSH ===
539:  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
856:def create_access_token(uid: str, email: str, role: str) -> str:
862:def create_refresh_token(uid: str) -> str:
867:    resp.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
868:    resp.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=2592000, path="/")
871:    resp.delete_cookie("access_token", path="/")
872:    resp.delete_cookie("refresh_token", path="/")
875:    token = request.cookies.get("access_token")
876:    if not token:
879:            token = auth[7:]
880:    if not token:
883:        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
885:            raise HTTPException(401, "Invalid token type")
895:        raise HTTPException(401, "Invalid token")
1178:        verify_token = secrets.token_urlsafe(32)
1179:        await db.email_verify_tokens.insert_one({
1180:            "token": verify_token, "user_id": uid,
1185:        await send_verification_email(email, f"{origin}/verify-email?token={verify_token}", user["name"])
1191:    access = create_access_token(uid, email, "user")
1192:    refresh = create_refresh_token(uid)
1194:    return {"user": user, "access_token": access, "refresh_token": refresh}
1218:    access = create_access_token(user["id"], email, user.get("role", "user"))
1219:    refresh = create_refresh_token(user["id"])
1223:    return {"user": user, "access_token": access, "refresh_token": refresh}
1302:async def refresh_token(request: Request, response: Response):
1303:    # Accept refresh from: (1) cookie, (2) JSON body { refresh_token }, (3) Authorization header
1304:    token = request.cookies.get("refresh_token", "")
1305:    if not token:
1308:            token = (body or {}).get("refresh_token", "") or ""
1310:            token = ""
1311:    if not token:
1314:            token = auth[7:].strip()
1315:    if not token:
1316:        raise HTTPException(401, "No refresh token")
1318:        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
1320:            raise HTTPException(401, "Invalid token")
1324:        access = create_access_token(user["id"], user["email"], user.get("role", "user"))
1325:        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
1326:        return {"access_token": access}
1328:        raise HTTPException(401, "Invalid refresh token")
1361:    token: str
1371:        token = secrets.token_urlsafe(32)
1372:        await db.password_reset_tokens.insert_one({
1373:            "token": token, "user_id": user["id"],
1381:        reset_url = f"{origin}/reset-password?token={token}"
1382:        reset_link = f"/reset-password?token={token}"
1395:    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
1406:    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
1423:    state = secrets.token_urlsafe(16)
1424:    code_verifier = secrets.token_urlsafe(64)[:96]
1477:                "https://api.twitter.com/2/oauth2/token",
1488:                logger.error(f"[X token] {tok.status_code} {tok.text[:200]}")
1490:            token_data = tok.json()
1491:            access_x = token_data.get("access_token")
1518:            "password_hash": hash_password(secrets.token_urlsafe(24)),
1532:    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
1533:    refresh = create_refresh_token(user["id"])
1537:    return {"user": user, "access_token": access}
1542:# scheme so the Expo app receives the token via Linking.
1561:                "https://api.twitter.com/2/oauth2/token",
1566:                logger.error(f"[X mobile token] {tok.status_code} {tok.text[:200]}")
1567:                return RedirectResponse(f"{mob}?error=token_exchange")
1568:            access_x = tok.json().get("access_token")
1590:            "password_hash": hash_password(secrets.token_urlsafe(24)),
1602:    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
1603:    refresh = create_refresh_token(user["id"])
1605:    frag = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "x"})
1611:    state = secrets.token_urlsafe(16)
1612:    code_verifier = secrets.token_urlsafe(64)[:96]
1664:                "https://accounts.snapchat.com/login/oauth2/access_token",
1672:                logger.error(f"[Snap token] {tok.status_code} {tok.text[:200]}")
1674:            access_snap = tok.json().get("access_token")
1700:            "password_hash": hash_password(secrets.token_urlsafe(24)),
1713:    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
1714:    refresh = create_refresh_token(user["id"])
1718:    return {"user": user, "access_token": access}
1726:    # Decide where to send the final tokens — mobile deep-link or web frontend
1732:    # captures tokens from the URL fragment and logs the user in via localStorage.
1748:                "https://accounts.snapchat.com/login/oauth2/access_token",
1753:                logger.error(f"[Snap callback token] {tok.status_code} {tok.text[:200]}")
1754:                return RedirectResponse(f"{final_target}{sep}error=token_exchange")
1755:            access_snap = tok.json().get("access_token")
1779:            "password_hash": hash_password(secrets.token_urlsafe(24)),
1791:    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
1792:    refresh = create_refresh_token(user["id"])
1794:    payload = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "snapchat"})
1807:# Push Notifications (Expo + Web Push / VAPID)
1809:from push_service import send_push_to_users as _send_push, VAPID_PUBLIC_KEY
1812:class PushTokenIn(BaseModel):
1813:    expo_token: str = Field(min_length=10)
1817:class WebPushSubscriptionIn(BaseModel):
1832:@api.post("/push/register")
1833:async def register_push_token(body: PushTokenIn, user: dict = Depends(get_current_user)):
1834:    await db.push_tokens.update_one(
1835:        {"expo_token": body.expo_token},
1839:            "expo_token": body.expo_token,
1848:@api.delete("/push/unregister")
1849:async def unregister_push_token(expo_token: str, user: dict = Depends(get_current_user)):
1850:    await db.push_tokens.delete_one({"expo_token": expo_token, "user_id": user["id"]})
1854:@api.get("/push/web/vapid-public-key")
1856:    """Public VAPID key — required by the browser's PushManager.subscribe()."""
1857:    return {"public_key": VAPID_PUBLIC_KEY}
1860:@api.post("/push/web/subscribe")
1861:async def web_push_subscribe(body: WebPushSubscriptionIn, user: dict = Depends(get_current_user)):
1863:    await db.push_tokens.update_one(
1878:@api.post("/push/web/unsubscribe")
1879:async def web_push_unsubscribe(body: WebPushSubscriptionIn, user: dict = Depends(get_current_user)):
1880:    await db.push_tokens.delete_one({"kind": "web", "web_subscription.endpoint": body.endpoint, "user_id": user["id"]})
1884:@api.get("/push/preferences")
1885:async def get_notification_prefs(user: dict = Depends(get_current_user)):
1886:    prefs = user.get("notification_prefs") or {}
1898:@api.put("/push/preferences")
1899:async def set_notification_prefs(body: NotificationPrefsIn, user: dict = Depends(get_current_user)):
1903:            update[f"notification_prefs.{k}"] = bool(v)
1909:# Test push — useful for users to verify their device receives notifications
1910:@api.post("/push/test")
1911:async def test_push(user: dict = Depends(get_current_user)):
1912:    res = await _send_push(
1922:async def expo_send_push(tokens: list, title: str, body: str, data: Optional[dict] = None):
1923:    """Backward-compat shim used by older call sites that pass raw Expo tokens.
1925:    Prefer `_send_push(db, user_ids, ...)` for new code so the user's web
1928:    if not tokens:
1932:        for t in tokens
1937:                "https://exp.host/--/api/v2/push/send",
1941:            return {"sent": len(tokens), "status": r.status_code}
1943:        logger.error(f"[Expo Push] {e}")
1961:GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
1985:            "password_hash": hash_password(secrets.token_urlsafe(24)),
2006:    """Return Google OAuth consent URL with a CSRF state token cookie.
2014:    state = secrets.token_urlsafe(32)
2038:    Google redirects here with ?code & ?state. We exchange the code for tokens,
2053:    # Exchange code → tokens
2067:            logger.error(f"[GoogleOAuth] token exchange {tok_res.status_code}: {tok_res.text[:300]}")
2068:            return RedirectResponse(f"{frontend}/login?error=token_exchange")
2069:        tokens = tok_res.json()
2070:        access_token = tokens.get("access_token", "")
2071:        if not access_token:
2072:            return RedirectResponse(f"{frontend}/login?error=no_access_token")
2077:                headers={"Authorization": f"Bearer {access_token}"},
2096:    # AND pass tokens via URL fragment (#) so the frontend can store them in
2099:    access = create_access_token(user["id"], g_email, user.get("role", "user"))
2100:    refresh = create_refresh_token(user["id"])
2102:    frag = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "google"})
2126:#      first consent only], [id_token].
2127:#   3. Backend builds a client_secret JWT (ES256), exchanges code → tokens,
2128:#      verifies id_token via Apple JWKS (RS256), upserts user, then redirects
2129:#      to FRONTEND_URL/auth/callback#access_token=...
2132:APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
2194:            "password_hash": hash_password(secrets.token_urlsafe(24)),
2215:    identity_token: str
2225:    iOS sends us the `identity_token` (JWT signed by Apple). We verify the
2227:    email, then upsert the user and issue OUR JWT tokens.
2229:    if not body.identity_token:
2230:        raise HTTPException(400, "Missing identity_token")
2240:        unverified_header = jwt.get_unverified_header(body.identity_token)
2255:            body.identity_token,
2265:        logger.warning(f"[apple/native] token verify failed: {e}")
2275:    access = create_access_token(user["id"], user.get("email", ""), user.get("role", "user"))
2276:    refresh = create_refresh_token(user["id"])
2278:    return {"access_token": access, "refresh_token": refresh, "token": access, "user": safe_user}
2283:    """Return Apple OAuth consent URL with a CSRF state token stored in DB.
2291:    state = secrets.token_urlsafe(32)
2302:        "response_type": "code id_token",
2313:    Apple posts back with form-encoded: code, state, [user] (first time only), [id_token].
2314:    We verify the id_token via Apple's JWKS, upsert the user, and redirect to FRONTEND/auth/callback#token=...
2321:    id_token_form = (form.get("id_token") or "").strip()
2332:    # Build client_secret then exchange code for tokens (we still want a fresh id_token).
2355:            logger.error(f"[AppleOAuth] token exchange {tok_res.status_code}: {tok_res.text[:300]}")
2356:            return RedirectResponse(f"{frontend}/login?error=token_exchange", status_code=303)
2357:        tokens = tok_res.json()
2362:    id_token = tokens.get("id_token") or id_token_form
2363:    if not id_token:
2364:        return RedirectResponse(f"{frontend}/login?error=no_id_token", status_code=303)
2366:    # Verify id_token signature with Apple JWKS
2369:        unverified_header = jwt.get_unverified_header(id_token)
2381:            id_token,
2388:        logger.error(f"[AppleOAuth] invalid id_token: {e}")
2389:        return RedirectResponse(f"{frontend}/login?error=invalid_token", status_code=303)
2415:    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
2416:    refresh = create_refresh_token(user["id"])
2418:    frag = _up.urlencode({"access_token": access, "refresh_token": refresh, "login": "apple"})
2551:    return f"{base}{secrets.token_hex(3).upper()}"
2680:                await _send_user_notification(
2702:    # Smart notification: tell users who recently viewed the same category.
2858:                    await _send_user_notification(
2898:        asyncio.create_task(_send_user_notification(listing["user_id"], "عرض سعر جديد", f"تم تقديم عرض بقيمة {offer['amount']:,.0f} {listing.get('currency') or ''} على إعلانك", "listing_offer", f"/listing/{listing_id}", {"listing_id": listing_id, "offer_id": offer["id"]}))
2902:        logger.debug("offer notification scheduling failed", exc_info=True)
2951:        asyncio.create_task(_send_user_notification(recipient, title, body.message or title, "listing_offer_update", f"/listing/{offer['listing_id']}", {"listing_id": offer["listing_id"], "offer_id": offer_id, "status": update["status"]}))
2955:        logger.debug("offer decision notification scheduling failed", exc_info=True)
3437:@api.get("/users/me/notifications/settings")
3439:    prefs = (user.get("notification_prefs") or {})
3449:@api.put("/users/me/notifications/settings")
3454:    prefixed = {f"notification_prefs.{k}": v for k, v in update.items()}
3491:    """When a new listing is approved, push to users who recently viewed the same
3509:            asyncio.create_task(_send_push(
3665:    def tokenize(s):
3668:    base_tokens = tokenize(base_title)
3669:    if not base_tokens:
3683:    # Build OR query: any candidate listing whose title contains any base token,
3684:    # OR whose description contains any base token, plus same category as a soft filter.
3685:    title_re = "|".join(re.escape(t) for t in base_tokens)
3698:    base_token_set = set(base_tokens)
3699:    base_desc_tokens = set(tokenize(base_desc))
3703:        #   - title token overlap (most weight)
3704:        #   - description token overlap
3708:        c_title_tokens = set(tokenize(c.get("title")))
3709:        c_desc_tokens = set(tokenize(c.get("description")))
3710:        title_overlap = len(base_token_set & c_title_tokens)
3711:        desc_overlap = len(base_desc_tokens & c_desc_tokens) + len(base_token_set & c_desc_tokens) * 0.5
3712:        # Phrase match: how many CONSECUTIVE base tokens appear in title
3715:        for size in range(min(len(base_tokens), 5), 1, -1):
3716:            phrase = " ".join(base_tokens[:size])
3993:    """Live bid stream. On connect we push the current top bid + bid count so
4014:        # Keep the connection alive — we only push from server side. Read loop
4091:    # auction window, automatically push `end_time` forward by 60 seconds so
4127:    # Notify the previous top bidder they were outbid (best-effort push).
4130:            asyncio.create_task(_send_user_notification(
4266:    """Fire push notifications to anyone whose target_price >= new_price."""
4272:            asyncio.create_task(_send_push(
4291:async def chat_websocket(websocket: WebSocket, token: str = Query("")):
4296:    query token is missing.
4298:    # Decode token (query first, then cookie)
4301:        if token:
4302:            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
4305:            cookie_token = websocket.cookies.get("access_token")
4306:            if cookie_token:
4307:                payload = jwt.decode(cookie_token, JWT_SECRET, algorithms=["HS256"])
4436:    # other devices/tabs get the message so they all stay in sync.
4453:    # In-app notification + push (respects user's `messages` pref) — only if
4454:    # receiver is NOT actively connected (saves on no-op push).
4457:        await db.notifications.insert_one({
4467:        asyncio.create_task(_send_push(
5057:                    await _send_user_notification(
5081:    # Trigger price-alert notifications (best-effort; non-blocking)
5117:                await db.notifications.insert_one({
5127:            # Push (unified Expo + Web)
5131:                    asyncio.create_task(_send_push(
5520:            await db.notifications.insert_one({
5530:            asyncio.create_task(_send_push(
5549:            await db.notifications.insert_one({
5559:            asyncio.create_task(_send_push(
5901:    # NEW: optional deep-link URL the notification should open (e.g. /listing/<id>,
5905:    # NEW: optional image URL (rich push). Expo supports `richContent.image`,
5906:    # web push uses the icon. If omitted, no image is attached.
5957:@admin_router.post("/notifications/broadcast")
5958:async def broadcast_notification(body: BroadcastIn):
5972:            return {"sent": 0, "target": body.target, "push_devices": 0}
5993:        await db.notifications.insert_many(docs)
5994:    # Push (Expo + Web), respects user broadcasts preference
5996:        asyncio.create_task(_send_push(
6006:            "push_devices": await db.push_tokens.count_documents({"user_id": {"$in": user_ids}}) if user_ids else 0}
6009:@admin_router.post("/notifications/test")
6010:async def admin_notification_test(user: dict = Depends(require_admin)):
6011:    """Send a quick test notification (in-app + push) to the calling admin so
6012:    they can verify the full pipeline (DB insert → Expo Push → Web Push) end
6027:    await db.notifications.insert_one(doc)
6028:    push_result = {}
6030:        push_result = await _send_push(
6039:        push_result = {"error": str(e)}
6040:    return {"sent": True, "notification_id": doc["id"], "push": push_result}
6042:@admin_router.get("/notifications/ai-suggest")
6043:async def ai_suggest_notifications():
6044:    """Use Gemini to suggest 3 engaging push notifications based on app activity."""
6060:                "اقترح 3 إشعارات Push قصيرة وجذابة (عنوان + نص قصير، 60 حرف للعنوان و120 للنص) "
6081:@api.get("/notifications")
6082:async def my_notifications(user: dict = Depends(get_current_user), limit: int = 50):
6091:    items = await db.notifications.aggregate(pipeline).to_list(length=limit)
6094:@api.post("/notifications/{nid}/read")
6096:    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
6099:@api.post("/notifications/read-all")
6101:    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
6105:@api.get("/notifications/unread-count")
6106:async def notifications_unread_count(user: dict = Depends(get_current_user)):
6107:    n = await db.notifications.count_documents({"user_id": user["id"], "read": {"$ne": True}})
6202:@admin_router.post("/notifications/schedule")
6246:        {"$push": {"add_cities": {
6300:@admin_router.get("/notifications/schedule")
6307:@admin_router.delete("/notifications/schedule/{sid}")
6318:async def _send_user_notification(user_id: str, title: str, body: str, ntype: str, url: str, extra_data: Optional[dict] = None, pref_key: Optional[str] = None):
6319:    """Internal helper: persist to db.notifications + push to devices.
6320:    Used by the smart-notifications worker.
6323:    await db.notifications.insert_one({
6330:        await _send_push(
6336:        logger.warning(f"[smart-notif] push failed for {user_id}: {e}")
6366:        await _send_user_notification(
6415:        await _send_user_notification(
6473:            await db.notifications.insert_many(docs)
6476:                await _send_push(
6483:                logger.warning(f"[smart-notif] scheduled push failed: {e}")
6521:            await _send_user_notification(
6543:        "notifications_enabled": {"$ne": False},
6548:            await _send_user_notification(
6564:async def _smart_notifications_worker():
6569:    - Sends re-engagement notifications to inactive users (>14 days).
6634:async def verify_email(token: str, request: Request):
6635:    rec = await db.email_verify_tokens.find_one({"token": token})
6646:    await db.email_verify_tokens.delete_one({"token": token})
6654:    token = secrets.token_urlsafe(32)
6655:    await db.email_verify_tokens.insert_one({
6656:        "token": token, "user_id": user["id"],
6661:    verify_url = f"{origin}/verify-email?token={token}"
6949:        token = request.cookies.get("access_token")
6950:        if not token:
6952:        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
8080:        "EXPO_PROJECT_ID": "Expo project id — required to send push to the mobile app via Expo Push.",
8081:        "EXPO_ACCESS_TOKEN": "Optional, only needed for Expo Push v2 enhanced rate limits.",
8082:        "VAPID_PUBLIC_KEY": "Web Push public key — required for browser push subscriptions.",
8083:        "VAPID_PRIVATE_KEY": "Web Push private key — required to actually deliver browser push.",
8138:    await db.notifications.create_index([("user_id", 1), ("ts", -1)])
8141:    # Push tokens — older deployments used a plain unique index on expo_token
8142:    # which conflicts with web push entries that have no expo_token at all.
8145:        for ix in await db.push_tokens.list_indexes().to_list(length=50):
8146:            if ix.get("name") == "expo_token_1" and "partialFilterExpression" not in ix:
8147:                await db.push_tokens.drop_index("expo_token_1")
8151:    await db.push_tokens.create_index("expo_token", unique=True, partialFilterExpression={"expo_token": {"$type": "string"}})
8152:    await db.push_tokens.create_index("web_subscription.endpoint", unique=True, partialFilterExpression={"web_subscription.endpoint": {"$type": "string"}})
8153:    await db.push_tokens.create_index("user_id")
8220:    # Start the smart notifications worker (abandoned drafts/searches + scheduled).
8223:        _SMART_NOTIF_TASK = asyncio.create_task(_smart_notifications_worker())
=== MOBILE NOTIFICATIONS ===
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import Constants from "expo-constants";
import api from "./api";

// SDK 53+ exposes new banner/list iOS keys. Set them ALL so the OS shows
// the alert and plays sound both in the foreground AND when the app is
// fully closed (cold start).
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        // iOS 14+ — present as banner + list entry.
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Route a tapped notification → navigate to the listing/chat/etc.
 * Backend always includes `url` in the payload (e.g. "/listing/abc",
 * "/chat?to=xyz"). We open it via the harajplus:// scheme so deep-link
 * handlers inside the app pick it up.
 */
let _navigationRef = null;
export function setNotificationNavigationRef(ref) { _navigationRef = ref; }

// Lightweight pub/sub so UI badges can refresh on every incoming push without
// each consumer setting up its own Notifications.addNotificationReceivedListener.
const _notifyListeners = new Set();
export function onNotificationReceived(cb) {
    _notifyListeners.add(cb);
    return () => _notifyListeners.delete(cb);
}
function _emitReceived(notif) {
    for (const cb of _notifyListeners) {
        try { cb(notif); } catch (_) { /* noop */ }
    }
}

function routeFromUrl(url) {
    if (!url) return;
    // Listing detail
    let m = url.match(/^\/listing\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) { _navigationRef.navigate("ListingDetail", { id: m[1] }); return; }
    // Seller profile
    m = url.match(/^\/seller\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) { _navigationRef.navigate("SellerProfile", { sellerId: m[1] }); return; }
    // Chat
    m = url.match(/^\/chat(\?to=([^&]+))?/);
    if (m && _navigationRef?.navigate) {
        const to = m[2];
        _navigationRef.navigate("Chat", to ? { to } : {});
        return;
    }
    // Post listing (abandoned-draft reminder)
    if (url === "/post" || url.startsWith("/post?")) {
        if (_navigationRef?.navigate) { _navigationRef.navigate("Post"); return; }
    }
    // Search (abandoned-search reminder) — supports /search?q=... or /c/{category}
    m = url.match(/^\/search(?:\?q=([^&]+))?/);
    if (m && _navigationRef?.navigate) {
        const q = m[1] ? decodeURIComponent(m[1]) : "";
        _navigationRef.navigate("Search", q ? { q } : {});
        return;
    }
    m = url.match(/^\/c\/([^/?#]+)/);
    if (m && _navigationRef?.navigate) {
        _navigationRef.navigate("Search", { category: decodeURIComponent(m[1]) });
        return;
    }
    // Fallback — try built-in deep linking
    try { Linking.openURL(`harajplus://${url.startsWith("/") ? url.slice(1) : url}`); } catch (_) {}
}

let _listenersAttached = false;
function attachListenersOnce() {
    if (_listenersAttached) return;
    _listenersAttached = true;
    // Tap on a foreground/background notification
    Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data || {};
        routeFromUrl(data.url);
    });
    // Fired the moment a notification arrives — let UI badges refresh live.
    Notifications.addNotificationReceivedListener((notif) => {
        _emitReceived(notif);
    });
    // Cold start — app opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
        const data = response?.notification?.request?.content?.data || {};
        if (data?.url) routeFromUrl(data.url);
    });
}

export async function registerForNotifications() {
    try {
        attachListenersOnce();
        if (Platform.OS === "android") {
            // Owner mandate: notifications must play sound + arrive when
            // the app is fully closed. Importance MAX + bypassDnd ensures
            // delivery even in Do Not Disturb mode; sound: "default"
            // explicitly enables audio.
            await Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4FB6E6",
                sound: "default",
                bypassDnd: false,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                enableLights: true,
                enableVibrate: true,
            });
        }

        if (!Device.isDevice) return null; // Push not supported on simulators

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== "granted") {
            const req = await Notifications.requestPermissionsAsync();
            status = req.status;
        }
        if (status !== "granted") return null;

        // Get Expo push token
        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ||
            Constants.easConfig?.projectId;
        const tokenResp = projectId
            ? await Notifications.getExpoPushTokenAsync({ projectId })
            : await Notifications.getExpoPushTokenAsync();

        const expoToken = tokenResp.data;
        if (!expoToken) return null;

        // Send to backend (auth required)
        try {
            await api.post("/push/register", {
                expo_token: expoToken,
                platform: Platform.OS,
            });
        } catch (e) {
            // ignore — token will be retried next launch
        }
        return expoToken;
    } catch (e) {
        return null;
    }
}

export async function fireLocalNotification(title, body, data = {}) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data, sound: true },
            trigger: null,
        });
    } catch (_) {}
}
=== MOBILE APP ENTRY/DEEP LINKS ===
mobile/src/AuthContext.js:2:import * as Linking from "expo-linking";
mobile/src/AuthContext.js:41:        const sub = Linking.addEventListener("url", (e) => handle(e.url));
mobile/src/AuthContext.js:42:        Linking.getInitialURL().then(handle);
mobile/src/I18nContext.js:57:        "إعدادات الإشعارات": "Notification Settings",
mobile/src/I18nContext.js:119:        "الإشعارات": "Notifications",
mobile/src/I18nContext.js:351:        "لا توجد إشعارات": "No notifications",
mobile/src/I18nContext.js:1817:        "إعدادات الإشعارات": "Paramètres des notifications",
mobile/src/I18nContext.js:1879:        "الإشعارات": "Notifications",
mobile/src/I18nContext.js:2111:        "لا توجد إشعارات": "Aucune notification",
mobile/src/components/NotificationBell.js:1:// NotificationBell — bell icon + red unread-count badge.
mobile/src/components/NotificationBell.js:2:// Polls GET /api/notifications/unread-count when the host screen comes into
mobile/src/components/NotificationBell.js:10:import { onNotificationReceived } from "../notifications";
mobile/src/components/NotificationBell.js:13:export default function NotificationBell({ tintLight = false }) {
mobile/src/components/NotificationBell.js:20:        api.get("/notifications/unread-count")
mobile/src/components/NotificationBell.js:29:    // Live refresh whenever a push notification arrives — no reload needed.
mobile/src/components/NotificationBell.js:31:        const unsub = onNotificationReceived(() => refresh());
mobile/src/components/NotificationBell.js:37:            onPress={() => nav.navigate(user ? "Notifications" : "Login")}
mobile/src/components/NotificationBell.js:39:            testID="notification-bell-btn"
mobile/src/components/NotificationBell.js:45:                <View style={styles.badge} testID="notification-bell-badge">
mobile/src/notifications.js:1:import * as Notifications from "expo-notifications";
mobile/src/notifications.js:3:import * as Linking from "expo-linking";
mobile/src/notifications.js:11:Notifications.setNotificationHandler({
mobile/src/notifications.js:12:    handleNotification: async () => ({
mobile/src/notifications.js:23: * Route a tapped notification → navigate to the listing/chat/etc.
mobile/src/notifications.js:29:export function setNotificationNavigationRef(ref) { _navigationRef = ref; }
mobile/src/notifications.js:32:// each consumer setting up its own Notifications.addNotificationReceivedListener.
mobile/src/notifications.js:34:export function onNotificationReceived(cb) {
mobile/src/notifications.js:75:    // Fallback — try built-in deep linking
mobile/src/notifications.js:76:    try { Linking.openURL(`harajplus://${url.startsWith("/") ? url.slice(1) : url}`); } catch (_) {}
mobile/src/notifications.js:83:    // Tap on a foreground/background notification
mobile/src/notifications.js:84:    Notifications.addNotificationResponseReceivedListener((response) => {
mobile/src/notifications.js:85:        const data = response?.notification?.request?.content?.data || {};
mobile/src/notifications.js:88:    // Fired the moment a notification arrives — let UI badges refresh live.
mobile/src/notifications.js:89:    Notifications.addNotificationReceivedListener((notif) => {
mobile/src/notifications.js:92:    // Cold start — app opened from a notification
mobile/src/notifications.js:93:    Notifications.getLastNotificationResponseAsync().then((response) => {
mobile/src/notifications.js:94:        const data = response?.notification?.request?.content?.data || {};
mobile/src/notifications.js:99:export async function registerForNotifications() {
mobile/src/notifications.js:103:            // Owner mandate: notifications must play sound + arrive when
mobile/src/notifications.js:107:            await Notifications.setNotificationChannelAsync("default", {
mobile/src/notifications.js:109:                importance: Notifications.AndroidImportance.MAX,
mobile/src/notifications.js:114:                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
mobile/src/notifications.js:122:        const { status: existing } = await Notifications.getPermissionsAsync();
mobile/src/notifications.js:125:            const req = await Notifications.requestPermissionsAsync();
mobile/src/notifications.js:135:            ? await Notifications.getExpoPushTokenAsync({ projectId })
mobile/src/notifications.js:136:            : await Notifications.getExpoPushTokenAsync();
mobile/src/notifications.js:156:export async function fireLocalNotification(title, body, data = {}) {
mobile/src/notifications.js:158:        await Notifications.scheduleNotificationAsync({
mobile/src/screens/ChatScreen.js:5:import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking, PanResponder, Animated } from "react-native";
mobile/src/screens/ChatScreen.js:73: * that call Linking.openURL on tap. Same-origin links could be parsed and
mobile/src/screens/ChatScreen.js:87:          onPress={() => Linking.openURL(part).catch(() => {})}
mobile/src/screens/ChatScreen.js:765:          Linking.openURL(`tel:${phone}`);
mobile/src/screens/ChatScreen.js:1113:                    </TouchableOpacity> : isVoice && url ? <VoicePlayer url={url} isMine={isMine} duration_ms={m.voice_duration_ms} /> : isLocation && url ? <TouchableOpacity onPress={() => Linking.openURL(url)} style={s.locationBubble}>
mobile/src/screens/FlightsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Linking, Alert, Platform } from "react-native";
mobile/src/screens/FlightsScreen.js:414:    Linking.openURL(url).catch(() => {});
mobile/src/screens/HomeScreen.js:17:import NotificationBell from "../components/NotificationBell";
mobile/src/screens/HomeScreen.js:239:                    <NotificationBell />
mobile/src/screens/ListingDetailScreen.js:2:import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal, TextInput } from "react-native";
mobile/src/screens/ListingDetailScreen.js:118:  const call = () => _normalizedPhone && Linking.openURL(`tel:${_normalizedPhone}`);
mobile/src/screens/ListingDetailScreen.js:119:  const wa = () => _normalizedPhone && Linking.openURL(`https://wa.me/${_normalizedPhone.replace("+", "")}?text=${encodeURIComponent(`${t("مرحباً بخصوص:")} ${listing.title}`)}`);
mobile/src/screens/ListingDetailScreen.js:254:    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`);
mobile/src/screens/MoreScreens.js:2: * Search + Category browsing + Notifications + Static pages — bundle of
mobile/src/screens/MoreScreens.js:131:// ---------- NOTIFICATIONS SCREEN ----------
mobile/src/screens/MoreScreens.js:132:export function NotificationsScreen({
mobile/src/screens/MoreScreens.js:142:    api.get("/notifications").then(({
mobile/src/screens/MoreScreens.js:148:      await api.post(`/notifications/${n.id}/read`);
mobile/src/screens/MoreScreens.js:150:    // Owner mandate: tapping a notification MUST navigate to the relevant
mobile/src/screens/MoreScreens.js:173:    // 2) Type-based fallback (legacy notifications without `url`).
mobile/src/screens/MoreScreens.js:195:  // Visual icon + tint per notification type — clean baby-blue family.
mobile/src/screens/MoreScreens.js:275:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Notifications")}>
mobile/src/screens/MoreScreens.js:487:  // New card-based notification design — soft shadow + 20 radius + icon avatar.
mobile/src/screens/MoreScreens.js:754:// ---------- NOTIFICATION SETTINGS ----------
mobile/src/screens/MoreScreens.js:763:    api.get("/users/me/notifications/settings").then(({
mobile/src/screens/MoreScreens.js:777:      await api.put("/users/me/notifications/settings", {
mobile/src/screens/PostScreen.js:486:  // with a push notification if they abandon the flow for ~10 minutes.
mobile/src/screens/ProfileScreen.js:10:import { Platform, Linking } from "react-native";
mobile/src/screens/ProfileScreen.js:225:                <MenuRow icon={Bell} label={t("الإشعارات")} onPress={() => nav.navigate("Notifications")} />
mobile/src/screens/ProfileScreen.js:265:    const open = (u) => { if (u) Linking.openURL(u).catch(() => {}); };
mobile/src/screens/SearchScreen.js:198:        // Also save a re-engageable search event (smart notifications).
mobile/src/socialAuth.js:2:import * as Linking from "expo-linking";
mobile/src/socialAuth.js:25:    const returnUrl = Linking.createURL("/auth/callback"); // harajplus://auth/callback
=== WEB SERVICE WORKER/PUSH ===
frontend/public/sw.js
frontend/src/components/NotificationBell.js
frontend/src/components/NotificationsPanel.js
frontend/src/lib/notificationSound.js
frontend/src/lib/webPush.js
frontend/node_modules/lodash/_arrayPush.js
frontend/node_modules/safe-push-apply/.eslintrc
frontend/node_modules/safe-push-apply/.nycrc
frontend/node_modules/safe-push-apply/CHANGELOG.md
frontend/node_modules/safe-push-apply/LICENSE
frontend/node_modules/safe-push-apply/README.md
frontend/node_modules/safe-push-apply/index.d.ts
frontend/node_modules/safe-push-apply/index.js
frontend/node_modules/safe-push-apply/package.json
frontend/node_modules/safe-push-apply/tsconfig.json
frontend/node_modules/workbox-window/messageSW.js
frontend/build/sw.js
frontend/src/components/NotificationBell.js:84:        const offMessage = subscribe("message", refresh);
frontend/src/components/NotificationBell.js:85:        const offOffer = subscribe("listing_offer", refresh);
frontend/src/components/NotificationBell.js:86:        const offOfferUpdate = subscribe("listing_offer_update", refresh);
frontend/src/components/NotificationsPanel.js:4:import { isWebPushSupported, getWebPushStatus, subscribeWebPush, unsubscribeWebPush, sendTestPush, getWebPushUnsupportedReason } from "@/lib/webPush";
frontend/src/components/NotificationsPanel.js:32:    const supported = isWebPushSupported();
frontend/src/components/NotificationsPanel.js:38:    const refreshStatus = async () => setStatus(await getWebPushStatus());
frontend/src/components/NotificationsPanel.js:47:        const r = await subscribeWebPush();
frontend/src/components/NotificationsPanel.js:58:        await unsubscribeWebPush();
frontend/src/components/NotificationsPanel.js:94:                                        const reason = getWebPushUnsupportedReason();
frontend/src/components/NotificationsPanel.js:106:                            <button data-testid="webpush-test" onClick={testIt} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:border-[var(--primary)]">
frontend/src/components/NotificationsPanel.js:109:                            <button data-testid="webpush-disable" onClick={disable} disabled={busy} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold border border-red-500/30">
frontend/src/components/NotificationsPanel.js:114:                        <button data-testid="webpush-enable" onClick={enable} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold disabled:opacity-50">
frontend/src/lib/useChatSocket.js:14: *     subscribe(type, handler),     // returns unsubscribe()
frontend/src/lib/webPush.js:6: * - Subscribes the browser to push via PushManager with our VAPID public key
frontend/src/lib/webPush.js:28:export function isWebPushSupported() {
frontend/src/lib/webPush.js:33:        "serviceWorker" in navigator &&
frontend/src/lib/webPush.js:34:        "PushManager" in window &&
frontend/src/lib/webPush.js:40:export function getWebPushUnsupportedReason() {
frontend/src/lib/webPush.js:43:    if (!("serviceWorker" in navigator)) return "no-service-worker";
frontend/src/lib/webPush.js:44:    if (!("PushManager" in window)) return "no-push-api";
frontend/src/lib/webPush.js:49:export async function getWebPushStatus() {
frontend/src/lib/webPush.js:50:    if (!isWebPushSupported()) return "unsupported";
frontend/src/lib/webPush.js:53:        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
frontend/src/lib/webPush.js:55:        const sub = await reg.pushManager.getSubscription();
frontend/src/lib/webPush.js:63:export async function subscribeWebPush() {
frontend/src/lib/webPush.js:64:    if (!isWebPushSupported()) return { ok: false, reason: "unsupported" };
frontend/src/lib/webPush.js:72:        const reg = await navigator.serviceWorker.register("/sw.js");
frontend/src/lib/webPush.js:73:        await navigator.serviceWorker.ready;
frontend/src/lib/webPush.js:76:        let sub = await reg.pushManager.getSubscription();
frontend/src/lib/webPush.js:90:        sub = await reg.pushManager.subscribe({
frontend/src/lib/webPush.js:102:        console.error("[webpush] subscribe failed", e);
frontend/src/lib/webPush.js:107:export async function unsubscribeWebPush() {
frontend/src/lib/webPush.js:108:    if (!isWebPushSupported()) return { ok: false };
frontend/src/lib/webPush.js:110:        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
frontend/src/lib/webPush.js:112:        const sub = await reg.pushManager.getSubscription();
frontend/src/lib/webPush.js:115:            await sub.unsubscribe();
frontend/src/pages/ChatPage.js:446:        offs.push(subscribe("message", (ev) => {
frontend/src/pages/ChatPage.js:484:        offs.push(subscribe("typing", (ev) => {
frontend/src/pages/ChatPage.js:488:        offs.push(subscribe("presence", (ev) => {
frontend/src/pages/ChatPage.js:492:        offs.push(subscribe("delivered", (ev) => {
frontend/src/pages/ChatPage.js:496:        offs.push(subscribe("read", (ev) => {
frontend/src/pages/ChatPage.js:503:        offs.push(subscribe("reaction", (ev) => {
frontend/src/pages/ChatPage.js:508:        offs.push(subscribe("message_deleted", (ev) => {
frontend/public/sw.js:35:    event.waitUntil(self.registration.showNotification(title, options));
=== CHAT SOCKET ===
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Single shared WebSocket connection for chat real-time events.
 *
 * Reconnects automatically with exponential backoff (max 30s). Pings every
 * 25s to keep the connection alive through Render/Vercel idle timeouts.
 *
 * Returns:
 *   {
 *     send(eventObj),               // queue or send
 *     connected,                    // bool
 *     subscribe(type, handler),     // returns unsubscribe()
 *   }
 */
export function useChatSocket() {
    const { user } = useAuth();
    const wsRef = useRef(null);
    const handlersRef = useRef(new Map()); // type → Set<handler>
    const reconnectAttempt = useRef(0);
    const pingTimer = useRef(null);
    const reconnectTimer = useRef(null);
    const [connected, setConnected] = useState(false);
    const userId = user?.id;
    const connectRef = useRef(null);

    const dispatch = useCallback((event) => {
        const set = handlersRef.current.get(event.type);
        if (set) set.forEach((h) => { try { h(event); } catch (_) {} });
        const wildcard = handlersRef.current.get("*");
        if (wildcard) wildcard.forEach((h) => { try { h(event); } catch (_) {} });
    }, []);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;
        const attempt = Math.min(reconnectAttempt.current + 1, 6);
        reconnectAttempt.current = attempt;
        const delay = Math.min(1000 * 2 ** attempt, 30000); // 2s,4s,8s,16s,30s cap
        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connectRef.current?.();
        }, delay);
    }, []);

    const connect = useCallback(() => {
        if (!userId) return;
        const token = (() => {
            try { return localStorage.getItem("hp_access_token") || ""; } catch (_) { return ""; }
        })();
        if (!token) return;

        // Build wss:// URL from REACT_APP_BACKEND_URL (https://...) → wss://
        const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/i, "ws");
        const url = `${base}/api/ws/chat?token=${encodeURIComponent(token)}`;
        let ws;
        try {
            ws = new WebSocket(url);
        } catch (_) {
            scheduleReconnect();
            return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnectAttempt.current = 0;
            // Keep-alive ping every 25s (avoids idle proxies dropping us)
            if (pingTimer.current) clearInterval(pingTimer.current);
            pingTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {}
                }
            }, 25000);
        };
        ws.onmessage = (e) => {
            try {
                const ev = JSON.parse(e.data);
                dispatch(ev);
            } catch (_) {}
        };
        ws.onclose = () => {
            setConnected(false);
            if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
            scheduleReconnect();
        };
        ws.onerror = () => {
            try { ws.close(); } catch (_) {}
        };
    }, [userId, dispatch, scheduleReconnect]);

    connectRef.current = connect;

    useEffect(() => {
        connect();
        return () => {
            if (pingTimer.current) clearInterval(pingTimer.current);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            try { wsRef.current?.close(); } catch (_) {}
            wsRef.current = null;
        };
    }, [userId, connect]);

    const send = useCallback((obj) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return false;
        try { ws.send(JSON.stringify(obj)); return true; } catch (_) { return false; }
    }, []);

    const subscribe = useCallback((type, handler) => {
        if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set());
        handlersRef.current.get(type).add(handler);
        return () => {
            const set = handlersRef.current.get(type);
            if (set) {
                set.delete(handler);
                if (set.size === 0) handlersRef.current.delete(type);
            }
        };
    }, []);

    return { send, connected, subscribe };
}
mobile/src/screens/ChatScreen.js:1:// ChatScreen — Premium WhatsApp-grade design with typing/presence/last-seen/read receipts.
mobile/src/screens/ChatScreen.js:2:// Two views: conversations list  +  chat thread (selected by route.params.to or list tap).
mobile/src/screens/ChatScreen.js:120:  // already have seller_name/avatar/id in the route params. Use them
mobile/src/screens/ChatScreen.js:121:  // immediately so the thread opens INSTANTLY without waiting for the
mobile/src/screens/ChatScreen.js:126:  // Eagerly seed the active thread from route params on FIRST render so the
mobile/src/screens/ChatScreen.js:159:  // Hide the bottom tab bar whenever a 1:1 chat thread is open.
mobile/src/screens/ChatScreen.js:165:    const inThread = !!(activeOther && activeOther.id);
mobile/src/screens/ChatScreen.js:166:    nav.setOptions({ tabBarStyle: inThread ? { display: "none" } : undefined });
mobile/src/screens/ChatScreen.js:169:  // away while still inside a thread).
mobile/src/screens/ChatScreen.js:174:  // If user navigated with a target user, open that thread INSTANTLY using
mobile/src/screens/ChatScreen.js:175:  // any data we already have (from route params), then enrich asynchronously.
mobile/src/screens/ChatScreen.js:179:    //    different seller after the screen was already mounted, and also
mobile/src/screens/ChatScreen.js:205:  const openThread = other => {
mobile/src/screens/ChatScreen.js:211:  const closeThread = () => {
mobile/src/screens/ChatScreen.js:225:  // before useCallback/useEffect/useMemo were called, causing the dreaded
mobile/src/screens/ChatScreen.js:240:    return <ChatThread convoId={activeConvoId} other={activeOther} listing={activeListing} onBack={closeThread} />;
mobile/src/screens/ChatScreen.js:269:    }) => <ConvoRow convo={item} onPress={() => openThread({
mobile/src/screens/ChatScreen.js:285:  const unread = convo.unread || 0;
mobile/src/screens/ChatScreen.js:304:                    <Text style={[s.convoMsg, unread > 0 && {
mobile/src/screens/ChatScreen.js:310:                    {unread > 0 && <View style={s.unreadBadge}>
mobile/src/screens/ChatScreen.js:311:                            <Text style={s.unreadText}>{unread > 99 ? "99+" : unread}</Text>
mobile/src/screens/ChatScreen.js:318:// =============== Chat Thread (single conversation) ===============
mobile/src/screens/ChatScreen.js:319:function ChatThread({
mobile/src/screens/ChatScreen.js:369:      // Mark conversation as read
mobile/src/screens/ChatScreen.js:371:        type: "read",
mobile/src/screens/ChatScreen.js:403:      // Auto-mark as read since we're viewing
mobile/src/screens/ChatScreen.js:405:        type: "read",
mobile/src/screens/ChatScreen.js:417:    const unsubRead = subscribe("read", ev => {
mobile/src/screens/ChatScreen.js:421:        read: true,
mobile/src/screens/ChatScreen.js:422:        read_at: ev.ts
mobile/src/screens/ChatScreen.js:425:    const unsubDelivered = subscribe("delivered", ev => {
mobile/src/screens/ChatScreen.js:429:        delivered: true,
mobile/src/screens/ChatScreen.js:430:        delivered_at: ev.ts || new Date().toISOString()
mobile/src/screens/ChatScreen.js:447:      unsubRead();
mobile/src/screens/ChatScreen.js:448:      unsubDelivered();
mobile/src/screens/ChatScreen.js:464:  //  • a ref so we only fire ONCE per mount of this thread
mobile/src/screens/ChatScreen.js:465:  //  • a scan of loaded history — if the same listing id was already
mobile/src/screens/ChatScreen.js:472:    const alreadyMentioned = (messages || []).some(
mobile/src/screens/ChatScreen.js:475:    if (alreadyMentioned) { autoSentRef.current = true; return; }
mobile/src/screens/ChatScreen.js:723:            {/* Thread header */}
mobile/src/screens/ChatScreen.js:724:            <View style={[s.threadHeader, {
mobile/src/screens/ChatScreen.js:737:                <View style={s.threadAvatar}>
mobile/src/screens/ChatScreen.js:755:                        <Text style={s.threadName} numberOfLines={1}>{other.name}</Text>
mobile/src/screens/ChatScreen.js:758:                    <Text style={s.threadStatus} numberOfLines={1}>
mobile/src/screens/ChatScreen.js:1027:  // natural reading direction (RTL → swipe LEFT, LTR → swipe RIGHT) triggers
mobile/src/screens/ChatScreen.js:1050:  // ✅ NEW unified schema: read media from dedicated fields (matches Web).
mobile/src/screens/ChatScreen.js:1131:                      : m.read ? <CheckCheck size={14} color="#B5E61D" strokeWidth={3} />
mobile/src/screens/ChatScreen.js:1132:                      : m.delivered ? <CheckCheck size={14} color="rgba(181,230,29,0.55)" strokeWidth={3} />
mobile/src/screens/ChatScreen.js:1190:        // If clip already finished, rewind before playing again.
mobile/src/screens/ChatScreen.js:1429:  unreadBadge: {
mobile/src/screens/ChatScreen.js:1438:  unreadText: {
mobile/src/screens/ChatScreen.js:1466:  // Thread header
mobile/src/screens/ChatScreen.js:1467:  threadHeader: {
mobile/src/screens/ChatScreen.js:1477:  threadAvatar: {
mobile/src/screens/ChatScreen.js:1486:  threadName: {
mobile/src/screens/ChatScreen.js:1498:  threadStatus: {
frontend/src/pages/ChatPage.js:202:                    : m.read_at ? <CheckCheck className="w-3.5 h-3.5" style={{ color: "#B5E61D", strokeWidth: 3 }} />
frontend/src/pages/ChatPage.js:203:                    : m.delivered ? <CheckCheck className="w-3.5 h-3.5" style={{ color: "rgba(181,230,29,0.55)", strokeWidth: 3 }} />
frontend/src/pages/ChatPage.js:244:    // Acts as a persistent reference at the top of the thread so buyer + seller
frontend/src/pages/ChatPage.js:261:        // Avoid refetch if we already have the right listing pinned
frontend/src/pages/ChatPage.js:277:        // If any existing message already references this listing, skip — we
frontend/src/pages/ChatPage.js:279:        const alreadyRefs = (messages || []).some((m) => m.listing_id === initialListing);
frontend/src/pages/ChatPage.js:280:        if (alreadyRefs) { autoSentRef.current.add(key); return; }
frontend/src/pages/ChatPage.js:296:    // True only for the very first render after opening a thread — used to do
frontend/src/pages/ChatPage.js:340:    // Reads window.visualViewport.height (shrinks when the on-screen keyboard
frontend/src/pages/ChatPage.js:396:        // `initial` flag tells the auto-scroll guard "we just opened this thread,
frontend/src/pages/ChatPage.js:403:            // One-time jump to latest message when the thread first opens.
frontend/src/pages/ChatPage.js:412:            wsSend({ type: "read", convo_id: activeConvoId });
frontend/src/pages/ChatPage.js:465:                    // Immediately mark conversation as read since we're viewing it
frontend/src/pages/ChatPage.js:466:                    wsSend({ type: "read", convo_id: activeConvoId });
frontend/src/pages/ChatPage.js:469:                // scroll for incoming messages — let the user read in peace.
frontend/src/pages/ChatPage.js:478:                    const base = idx >= 0 ? cs[idx] : { id: m.convo_id, other: { id: m.sender_id, name: m.sender?.name || tr("مستخدم") }, unread: 0 };
frontend/src/pages/ChatPage.js:479:                    return [{ ...base, last_message: m.text || "[وسائط]", last_ts: m.ts, unread: (base.unread || 0) + (m.sender_id !== user.id ? 1 : 0) }, ...others];
frontend/src/pages/ChatPage.js:492:        offs.push(subscribe("delivered", (ev) => {
frontend/src/pages/ChatPage.js:493:            setMessages((prev) => prev.map((m) => m.id === ev.message_id ? { ...m, delivered: true } : m));
frontend/src/pages/ChatPage.js:496:        offs.push(subscribe("read", (ev) => {
frontend/src/pages/ChatPage.js:498:                setMessages((prev) => prev.map((m) => m.sender_id === user.id ? { ...m, read_at: ev.ts || new Date().toISOString() } : m));
frontend/src/pages/ChatPage.js:683:                                {c.unread > 0 && <span className="bg-[var(--danger)] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{c.unread}</span>}
mobile/src/AuthContext.js:25:    // harajplus://auth/callback#access_token=... while the app was already open
mobile/src/CountryContext.js:49:            //    (saved by AuthContext on login) is already here, so we DO NOT
mobile/src/CountryContext.js:58:            // 4a) GPS (only if permission already granted — never prompts here)
mobile/src/CountryContext.js:82:            // Offline/device fallback: use the region embedded in the OS locale
mobile/src/I18nContext.js:369:        "لديك حساب بالفعل؟": "Already have an account?",
mobile/src/I18nContext.js:2277:                // effect on all already-mounted views. Use expo-updates when
mobile/src/api.js:51:// param enforces STRICT country isolation across all reads (listings, stories,
mobile/src/biometric.js:52:            requireAuthentication: false, // we already authenticated above; avoid double prompt on retrieve
mobile/src/components/AIAssistantFab.js:22: * Helper — read the leaf route name from the container ref. Drills into
mobile/src/components/AIAssistantFab.js:24: * screen inside the Main tab navigator. Returns "" if the ref isn't ready
mobile/src/components/AIAssistantFab.js:49:        // Initial read after first paint when the ref is hooked up.
mobile/src/components/FloatingTabBar.js:70:  // Reels and the chat-thread mode to hide the bar.
mobile/src/components/NotificationBell.js:1:// NotificationBell — bell icon + red unread-count badge.
mobile/src/components/NotificationBell.js:2:// Polls GET /api/notifications/unread-count when the host screen comes into
mobile/src/components/NotificationBell.js:3:// focus so the badge stays fresh without a websocket.
mobile/src/components/NotificationBell.js:20:        api.get("/notifications/unread-count")
mobile/src/screens/ChatScreen.js:1:// ChatScreen — Premium WhatsApp-grade design with typing/presence/last-seen/read receipts.
mobile/src/screens/ChatScreen.js:2:// Two views: conversations list  +  chat thread (selected by route.params.to or list tap).
mobile/src/screens/ChatScreen.js:120:  // already have seller_name/avatar/id in the route params. Use them
mobile/src/screens/ChatScreen.js:121:  // immediately so the thread opens INSTANTLY without waiting for the
mobile/src/screens/ChatScreen.js:126:  // Eagerly seed the active thread from route params on FIRST render so the
mobile/src/screens/ChatScreen.js:159:  // Hide the bottom tab bar whenever a 1:1 chat thread is open.
mobile/src/screens/ChatScreen.js:165:    const inThread = !!(activeOther && activeOther.id);
mobile/src/screens/ChatScreen.js:166:    nav.setOptions({ tabBarStyle: inThread ? { display: "none" } : undefined });
mobile/src/screens/ChatScreen.js:169:  // away while still inside a thread).
mobile/src/screens/ChatScreen.js:174:  // If user navigated with a target user, open that thread INSTANTLY using
mobile/src/screens/ChatScreen.js:175:  // any data we already have (from route params), then enrich asynchronously.
mobile/src/screens/ChatScreen.js:179:    //    different seller after the screen was already mounted, and also
mobile/src/screens/ChatScreen.js:205:  const openThread = other => {
mobile/src/screens/ChatScreen.js:211:  const closeThread = () => {
mobile/src/screens/ChatScreen.js:225:  // before useCallback/useEffect/useMemo were called, causing the dreaded
mobile/src/screens/ChatScreen.js:240:    return <ChatThread convoId={activeConvoId} other={activeOther} listing={activeListing} onBack={closeThread} />;
mobile/src/screens/ChatScreen.js:269:    }) => <ConvoRow convo={item} onPress={() => openThread({
mobile/src/screens/ChatScreen.js:285:  const unread = convo.unread || 0;
mobile/src/screens/ChatScreen.js:304:                    <Text style={[s.convoMsg, unread > 0 && {
mobile/src/screens/ChatScreen.js:310:                    {unread > 0 && <View style={s.unreadBadge}>
mobile/src/screens/ChatScreen.js:311:                            <Text style={s.unreadText}>{unread > 99 ? "99+" : unread}</Text>
mobile/src/screens/ChatScreen.js:318:// =============== Chat Thread (single conversation) ===============
mobile/src/screens/ChatScreen.js:319:function ChatThread({
mobile/src/screens/ChatScreen.js:369:      // Mark conversation as read
mobile/src/screens/ChatScreen.js:371:        type: "read",
mobile/src/screens/ChatScreen.js:403:      // Auto-mark as read since we're viewing
mobile/src/screens/ChatScreen.js:405:        type: "read",
mobile/src/screens/ChatScreen.js:417:    const unsubRead = subscribe("read", ev => {
mobile/src/screens/ChatScreen.js:421:        read: true,
mobile/src/screens/ChatScreen.js:422:        read_at: ev.ts
mobile/src/screens/ChatScreen.js:425:    const unsubDelivered = subscribe("delivered", ev => {
mobile/src/screens/ChatScreen.js:429:        delivered: true,
mobile/src/screens/ChatScreen.js:430:        delivered_at: ev.ts || new Date().toISOString()
mobile/src/screens/ChatScreen.js:447:      unsubRead();
mobile/src/screens/ChatScreen.js:448:      unsubDelivered();
mobile/src/screens/ChatScreen.js:464:  //  • a ref so we only fire ONCE per mount of this thread
mobile/src/screens/ChatScreen.js:465:  //  • a scan of loaded history — if the same listing id was already
mobile/src/screens/ChatScreen.js:472:    const alreadyMentioned = (messages || []).some(
mobile/src/screens/ChatScreen.js:475:    if (alreadyMentioned) { autoSentRef.current = true; return; }
mobile/src/screens/ChatScreen.js:723:            {/* Thread header */}
mobile/src/screens/ChatScreen.js:724:            <View style={[s.threadHeader, {
mobile/src/screens/ChatScreen.js:737:                <View style={s.threadAvatar}>
mobile/src/screens/ChatScreen.js:755:                        <Text style={s.threadName} numberOfLines={1}>{other.name}</Text>
mobile/src/screens/ChatScreen.js:758:                    <Text style={s.threadStatus} numberOfLines={1}>
mobile/src/screens/ChatScreen.js:1027:  // natural reading direction (RTL → swipe LEFT, LTR → swipe RIGHT) triggers
mobile/src/screens/ChatScreen.js:1050:  // ✅ NEW unified schema: read media from dedicated fields (matches Web).
mobile/src/screens/ChatScreen.js:1131:                      : m.read ? <CheckCheck size={14} color="#B5E61D" strokeWidth={3} />
mobile/src/screens/ChatScreen.js:1132:                      : m.delivered ? <CheckCheck size={14} color="rgba(181,230,29,0.55)" strokeWidth={3} />
mobile/src/screens/ChatScreen.js:1190:        // If clip already finished, rewind before playing again.
mobile/src/screens/ChatScreen.js:1429:  unreadBadge: {
mobile/src/screens/ChatScreen.js:1438:  unreadText: {
mobile/src/screens/ChatScreen.js:1466:  // Thread header
mobile/src/screens/ChatScreen.js:1467:  threadHeader: {
mobile/src/screens/ChatScreen.js:1477:  threadAvatar: {
mobile/src/screens/ChatScreen.js:1486:  threadName: {
mobile/src/screens/ChatScreen.js:1498:  threadStatus: {
mobile/src/screens/ListingDetailScreen.js:120:  const shareAd = async () => {
mobile/src/screens/ListingDetailScreen.js:463:                <TouchableOpacity onPress={shareAd} style={styles.shareBtn} testID="mobile-share-btn">
mobile/src/screens/MoreScreens.js:148:      await api.post(`/notifications/${n.id}/read`);
mobile/src/screens/MoreScreens.js:151:    // screen (chat thread / listing / etc.). Previous logic only checked
mobile/src/screens/MoreScreens.js:217:                return <TouchableOpacity onPress={() => open(item)} style={[s.notifCard, !item.read && s.notifCardUnread]} testID={`notif-${item.id}`}>
mobile/src/screens/MoreScreens.js:226:                  {!item.read && <View style={s.notifDot} />}
mobile/src/screens/MoreScreens.js:330:// Local fallback used only when the network call fails — keeps UX intact offline.
mobile/src/screens/MoreScreens.js:484:  notifUnread: {
mobile/src/screens/MoreScreens.js:498:  notifCardUnread: {
mobile/src/screens/PostScreen.js:457:        // Server-side reads these to decide which phone to expose on the listing.
mobile/src/screens/PostScreen.js:692:  // For cities: static list comes from country.cities (already country-filtered).
mobile/src/screens/ProfileScreen.js:260:    // Store URLs are read from Expo extra config so we never hardcode them.
mobile/src/useChatSocket.js:2: * Mobile WebSocket hook — production-ready real-time chat client.
mobile/src/useChatSocket.js:3: * Uses the native React Native WebSocket implementation (no extra deps).
mobile/src/useChatSocket.js:5: * Token is read from secure storage (api.js → SecureStore). URL is derived from
mobile/src/useChatSocket.js:15:async function readToken() {
mobile/src/useChatSocket.js:28:    const reconnect = useRef(0);
mobile/src/useChatSocket.js:39:        const token = await readToken();
mobile/src/useChatSocket.js:43:        try { ws = new WebSocket(url); } catch (_) { scheduleRetry(); return; }
mobile/src/useChatSocket.js:47:            reconnect.current = 0;
mobile/src/useChatSocket.js:50:                if (ws.readyState === 1) { try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {} }
mobile/src/useChatSocket.js:67:        const a = Math.min(reconnect.current + 1, 6);
mobile/src/useChatSocket.js:68:        reconnect.current = a;
mobile/src/useChatSocket.js:83:        if (!ws || ws.readyState !== 1) return false;


## Responsive smoke checkpoint — 2026-08-16

تم فتح Web build المحلي على `http://127.0.0.1:4173/`. نجح تركيب React وظهرت الصفحة الرئيسية والعناصر التفاعلية والـ navigation دون شاشة بيضاء أو runtime crash. ظهرت حالة `No results` لأن النسخة المحلية لا تتصل بقاعدة بيانات/backend staging، وليست نتيجة فشل في render. لم يُعتبر ذلك اختبارًا بديلًا عن أجهزة iOS/Android الفعلية أو viewport matrix كاملة.

تم أيضًا التحقق من service worker الموجود في `frontend/public/sw.js` وإصلاح مسارات الأيقونات من ملفات غير موجودة إلى `/favicon-192.png` الموجودة فعليًا.


## Web Push runtime checkpoint — 2026-08-16

تم فتح `http://127.0.0.1:4173/sw.js` من Web build المحلي، وظهر service worker فعليًا من الجذر. يحتوي على `push` handler و`showNotification` و`notificationclick` مع focus/navigation أو فتح نافذة جديدة للرابط الموجود في payload. هذا يثبت وجود طبقة التنفيذ المحلية، ولا يثبت delivery الخارجي حتى يتم اختبار VAPID/Redis/worker من staging حقيقي.


## Cold-start deep-link verification — 2026-08-16

تمت مراجعة `mobile/src/notifications.js` و`mobile/App.js`. كان listener يستدعي `getLastNotificationResponseAsync()` مبكرًا، بينما يتم ربط navigation ref لاحقًا في `NavigationContainer.onReady`. أضيفت آلية pending URL: يحفظ التطبيق رابط الإعلان أو المحادثة إذا وصل الإشعار قبل جاهزية navigator، ثم يعيد توجيهه فور `onReady`. نجح `npx expo export --platform web` بعد التعديل. يظل اختبار APNs/FCM/HMS الفعلي عند cold start على جهاز حقيقي مطلوبًا قبل الاعتماد النهائي.

Commit: `4c5a871`.
