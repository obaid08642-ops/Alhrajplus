# Phase 1 implementation inventory

## Git
[31m??[m pasted_content_6_master_plan_2026-08-17.md
[31m??[m phase1_project_inventory_2026-08-17.md
[33mbaf81b2[m fix: close notification translation and mobile search gaps
[33m752775b[m complete provider controls and audit evidence
[33m3be60e8[m audit and harden cross-platform marketplace flows
[33mcf43757[m fix: keep public theme bootstrap resilient
[33mc54f3e5[m feat: add country-safe listing swipe navigation

## Top-level
.
./.emergent
./.pytest_cache
./.pytest_cache/v
./backend
./backend/.pytest_cache
./backend/__pycache__
./backend/data
./backend/data_raw
./backend/tests
./data
./frontend
./frontend/build
./frontend/node_modules
./frontend/plugins
./frontend/public
./frontend/scripts
./frontend/src
./memory
./mobile
./mobile/.expo
./mobile/assets
./mobile/dist
./mobile/node_modules
./mobile/scripts
./mobile/src
./scripts
./test_reports
./test_reports/pytest
./tests
./tools

## Source counts
backend_py=44
web_js=114
mobile_js=49

## API and route references
backend/i18n_data.py:3:and dropdown option values. Used by /api/meta/categories?lang=<code>.
backend/locations.py:10:• Cascading API: `/api/locations/children?parent_id=...`
backend/locations.py:448:    router = APIRouter(prefix="/api/locations", tags=["locations"])
backend/locations.py:734:            GET /api/locations/admin/import?country=EG
backend/push_service.py:25:EXPO_API = "https://exp.host/--/api/v2/push/send"
backend/seed_locations.py:8:    POST /api/locations/admin/import?country=EG  (multipart file)
backend/server.py:149:# Google OAuth is now handled directly — see /api/auth/google/start and /callback.
backend/server.py:204:@api.get("/health", include_in_schema=False)
backend/server.py:205:@api.head("/health", include_in_schema=False)
backend/server.py:257:# Also keeps rolling counters for /api/_metrics so ops can grep p95 + error rate.
backend/server.py:288:@app.middleware("http")
backend/server.py:297:@app.middleware("http")
backend/server.py:322:# Only enforced on hot paths (/api/listings + /api/auth/*) to keep overhead
backend/server.py:329:    "listings": int(os.environ.get("RATE_LIMIT_LISTINGS", "100")),  # /api/listings
backend/server.py:330:    "auth":     int(os.environ.get("RATE_LIMIT_AUTH", "30")),       # /api/auth/*
backend/server.py:342:    if path.startswith("/api/auth"):
backend/server.py:344:    if path == "/api/listings" or path.startswith("/api/listings?"):
backend/server.py:348:@app.middleware("http")
backend/server.py:400:# Both /health (root) and /api/health (api router) are exposed so any
backend/server.py:404:@app.get("/health", include_in_schema=False)
backend/server.py:405:@app.head("/health", include_in_schema=False)
backend/server.py:410:@app.get("/", include_in_schema=False)
backend/server.py:411:@app.head("/", include_in_schema=False)
backend/server.py:418:@app.get("/api/debug/db-check", include_in_schema=False)
backend/server.py:471:@app.get("/api/debug/listings-raw", include_in_schema=False)
backend/server.py:479:# Server-side OG share endpoint — `/api/og/listing/{id}`.
backend/server.py:491:@app.get("/api/og/listing/{listing_id}", include_in_schema=False)
backend/server.py:581:@api.get("/health/ready", include_in_schema=False)
backend/server.py:605:@app.get("/api/_metrics", include_in_schema=False)
backend/server.py:812:@api.post("/cron/daily-digest")
backend/server.py:813:@api.get("/cron/daily-digest")
backend/server.py:1034:@api.get("/")
backend/server.py:1038:@api.get("/meta/categories")
backend/server.py:1050:@api.get("/meta/car-brands")
backend/server.py:1056:@api.get("/meta/car-models")
backend/server.py:1062:@api.get("/meta/car-trims")
backend/server.py:1068:@api.get("/meta/phone-brands")
backend/server.py:1074:@api.get("/meta/phone-models")
backend/server.py:1080:@api.get("/meta/phone-variants")
backend/server.py:1086:@api.get("/auth/providers")
backend/server.py:1099:@api.get("/meta/countries")
backend/server.py:1149:@api.get("/meta/theme")
backend/server.py:1165:@api.post("/auth/register")
backend/server.py:1247:@api.post("/auth/login")
backend/server.py:1276:@api.post("/auth/logout")
backend/server.py:1281:@api.get("/auth/me")
backend/server.py:1295:@api.put("/users/me")
backend/server.py:1296:@api.put("/auth/me")
backend/server.py:1340:@api.get("/auth/me/stats")
backend/server.py:1352:@api.post("/auth/refresh")
backend/server.py:1415:@api.post("/auth/forgot-password")
backend/server.py:1444:@api.post("/auth/reset-password")
backend/server.py:1470:@api.get("/auth/x/start")
backend/server.py:1489:        redirect_uri = f"{backend}/api/auth/x/callback-redirect"
backend/server.py:1505:@api.post("/auth/x/callback")
backend/server.py:1594:@app.get("/api/auth/x/callback-redirect", include_in_schema=False)
backend/server.py:1607:    redirect_uri = f"{backend}/api/auth/x/callback-redirect"
backend/server.py:1658:@api.get("/auth/snapchat/start")
backend/server.py:1674:        redirect_uri = f"{backend}/api/auth/snapchat/callback"
backend/server.py:1677:        redirect_uri = f"{backend}/api/auth/snapchat/callback"
backend/server.py:1678:    scope = "https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar https://auth.snapchat.com/oauth2/api/user.external_id"
backend/server.py:1692:@api.post("/auth/snapchat/callback")
backend/server.py:1710:    redirect_uri = f"{backend}/api/auth/snapchat/callback"
backend/server.py:1774:#   https://alhrajplus.onrender.com/api/auth/snapchat/callback
backend/server.py:1775:@app.get("/api/auth/snapchat/callback", include_in_schema=False)
backend/server.py:1794:    redirect_uri = f"{backend}/api/auth/snapchat/callback"
backend/server.py:1852:@app.get("/api/auth/snapchat/callback-redirect", include_in_schema=False)
backend/server.py:1883:@api.post("/push/register")
backend/server.py:1899:@api.delete("/push/unregister")
backend/server.py:1905:@api.get("/push/web/vapid-public-key")
backend/server.py:1911:@api.post("/push/web/subscribe")
backend/server.py:1929:@api.post("/push/web/unsubscribe")
backend/server.py:1935:@api.get("/push/preferences")
backend/server.py:1949:@api.put("/push/preferences")
backend/server.py:1961:@api.post("/push/test")
backend/server.py:1988:                "https://exp.host/--/api/v2/push/send",
backend/server.py:2001:#   1. Frontend → GET  /api/auth/google/start         → returns auth_url
backend/server.py:2003:#   3. Google   → GET  /api/auth/google/callback?code=... → backend exchanges code,
backend/server.py:2055:@api.get("/auth/google/start")
backend/server.py:2086:@app.get("/api/auth/google/callback", include_in_schema=False)
backend/server.py:2165:@api.post("/auth/google")
backend/server.py:2175:#   1. /api/auth/apple/start  → returns Apple consent URL.
backend/server.py:2176:#   2. Apple → POST /api/auth/apple/callback with code, state, [user JSON on
backend/server.py:2273:@api.post("/auth/apple/native")
backend/server.py:2332:@api.get("/auth/apple/start")
backend/server.py:2361:@app.post("/api/auth/apple/callback", include_in_schema=False)
backend/server.py:2488:@api.post("/ai/price-suggest")
backend/server.py:2510:@api.get("/ai/price-badge/{listing_id}")
backend/server.py:2552:@api.get("/deals/today")
backend/server.py:2602:@api.get("/referral/me")
backend/server.py:2621:@api.get("/referral/leaderboard")
backend/server.py:2641:@api.get("/cloudinary/signature")
backend/server.py:2732:@api.post("/listings")
backend/server.py:2997:@api.post("/listings/{listing_id}/offers")
backend/server.py:3030:@api.get("/listings/{listing_id}/offers")
backend/server.py:3037:@api.get("/offers/mine")
backend/server.py:3053:@api.patch("/listing-offers/{offer_id}")
backend/server.py:3093:@api.get("/listings")
backend/server.py:3350:@api.get("/search")
backend/server.py:3397:@api.get("/listings/recommended")
backend/server.py:3432:@api.post("/listings/{listing_id}/click")
backend/server.py:3446:@api.post("/listings/{listing_id}/view")
backend/server.py:3471:@api.get("/listings/recent")
backend/server.py:3499:@api.post("/search/save")
backend/server.py:3527:@api.get("/search/saved")
backend/server.py:3533:@api.delete("/search/saved/{sid}")
backend/server.py:3542:@api.post("/follow/category/{name}")
backend/server.py:3551:@api.delete("/follow/category/{name}")
backend/server.py:3556:@api.get("/following")
backend/server.py:3573:@api.get("/users/me/notifications/settings")
backend/server.py:3585:@api.put("/users/me/notifications/settings")
backend/server.py:3599:@api.post("/listings/{listing_id}/boost")
backend/server.py:3629:@api.delete("/listings/{listing_id}/boost")
backend/server.py:3670:@api.get("/listings/trending")
backend/server.py:3692:@api.get("/listings/by-slug/{slug}")
backend/server.py:3714:@api.get("/listings/{listing_id}/neighbors")
backend/server.py:3727:@api.get("/listings/{listing_id}")
backend/server.py:3749:@api.get("/listings/{listing_id}/like/check")
backend/server.py:3754:@api.post("/listings/{listing_id}/like")
backend/server.py:3767:@api.get("/listings/{listing_id}/comments")
backend/server.py:3785:@api.post("/listings/{listing_id}/comments")
backend/server.py:3806:@api.delete("/listing-comments/{comment_id}")
backend/server.py:3816:@api.get("/listings/{listing_id}/similar")
backend/server.py:3915:@api.delete("/listings/{listing_id}")
backend/server.py:4131:@api.get("/listings/me/mine")
backend/server.py:4160:@api.get("/auctions/active")
backend/server.py:4186:@api.get("/auctions/{listing_id}/bids")
backend/server.py:4224:@app.websocket("/api/ws/auctions/{listing_id}")
backend/server.py:4275:@api.post("/auctions/{listing_id}/bid")
backend/server.py:4384:@api.get("/listings/map/nearby")
backend/server.py:4400:@api.post("/favorites/{listing_id}")
backend/server.py:4418:@api.delete("/favorites/{listing_id}")
backend/server.py:4429:@api.get("/favorites/{listing_id}/check")
backend/server.py:4436:@api.get("/favorites")
backend/server.py:4449:@api.post("/price-alerts/{listing_id}")
backend/server.py:4474:@api.get("/price-alerts")
backend/server.py:4479:@api.delete("/price-alerts/{listing_id}")
backend/server.py:4488:@api.post("/blocks/{target_id}")
backend/server.py:4499:@api.delete("/blocks/{target_id}")
backend/server.py:4504:@api.get("/blocks/{target_id}/status")
backend/server.py:4534:@api.get("/voice/ice-servers")
backend/server.py:4562:@app.websocket("/api/ws/chat")
backend/server.py:4670:@api.get("/chat/presence/{user_id}")
backend/server.py:4679:@api.post("/chat/send")
backend/server.py:4788:@api.get("/chat/conversations")
backend/server.py:4806:@api.get("/chat/messages/{convo_id}")
backend/server.py:4831:@api.delete("/chat/messages/{message_id}")
backend/server.py:4862:@api.post("/chat/messages/{message_id}/react")
backend/server.py:4910:@api.post("/reports")
backend/server.py:4934:@api.post("/contact")
backend/server.py:4960:@api.post("/buy-requests")
backend/server.py:4993:@api.get("/buy-requests")
backend/server.py:5002:@api.get("/buy-requests/mine")
backend/server.py:5006:@api.delete("/buy-requests/{request_id}")
backend/server.py:5014:@api.put("/users/me/resume")
backend/server.py:5023:@api.get("/users/me/resume")
backend/server.py:5028:@api.post("/listings/{listing_id}/applications")
backend/server.py:5050:@api.get("/listings/{listing_id}/applications")
backend/server.py:5057:@api.patch("/job-applications/{application_id}")
backend/server.py:5067:@api.post("/support/tickets")
backend/server.py:5075:@api.get("/support/tickets")
backend/server.py:5080:@api.get("/support/tickets/{ticket_id}")
backend/server.py:5088:@api.post("/support/tickets/{ticket_id}/replies")
backend/server.py:5099:@api.post("/auth/request-account-deletion")
backend/server.py:5111:@api.get("/ads")
backend/server.py:5125:@api.post("/ads/{aid}/impression")
backend/server.py:5130:@api.post("/ads/{aid}/click")
backend/server.py:5151:@api.post("/ai/image-search")
backend/server.py:5172:@api.get("/ai/providers/status")
backend/server.py:5177:@api.get("/admin/ai/config")
backend/server.py:5193:@api.put("/admin/ai/config")
backend/server.py:5245:@api.post("/listings/suggest-price")
backend/server.py:5326:@api.post("/ai/listing-autofill")
backend/server.py:5429:@api.post("/ai/suggest-category")
backend/server.py:5471:@api.post("/ai/translate")
backend/server.py:5533:@api.put("/listings/{listing_id}")
backend/server.py:5648:@api.post("/listings/{listing_id}/pause")
backend/server.py:5671:@api.post("/listings/{listing_id}/resume")
backend/server.py:5693:@api.post("/listings/{listing_id}/republish")
backend/server.py:5724:@api.post("/listings/{listing_id}/mark-sold")
backend/server.py:5750:@api.post("/chat/location-share")
backend/server.py:5785:@api.get("/chat/location-share/{share_id}")
backend/server.py:5802:@api.post("/chat/location-share/{share_id}/stop")
backend/server.py:5826:@api.post("/analytics/events")
backend/server.py:6741:@api.get("/notifications")
backend/server.py:6754:@api.post("/notifications/{nid}/read")
backend/server.py:6759:@api.post("/notifications/read-all")
backend/server.py:6765:@api.get("/notifications/unread-count")
backend/server.py:6788:@api.post("/users/me/draft-listing")
backend/server.py:6810:@api.delete("/users/me/draft-listing")
backend/server.py:6826:@api.post("/users/me/search-event")
backend/server.py:7306:@api.get("/auth/verify-email")
backend/server.py:7332:@api.post("/auth/resend-verification")
backend/server.py:7355:@api.post("/watches")
backend/server.py:7379:@api.delete("/watches/{listing_id}")
backend/server.py:7384:@api.get("/watches")
backend/server.py:7397:@api.post("/sellers/{seller_id}/follow")
backend/server.py:7416:@api.get("/sellers/{seller_id}/follow-status")
backend/server.py:7425:@api.get("/sellers/{seller_id}")
backend/server.py:7460:@api.put("/users/me/storefront")
backend/server.py:7476:@api.get("/sellers/{seller_id}/trust")
backend/server.py:7511:@api.get("/sellers/{seller_id}/listings")
backend/server.py:7524:@api.get("/sellers/{seller_id}/ratings")
backend/server.py:7546:@api.post("/sellers/{seller_id}/ratings")
backend/server.py:7581:@api.post("/search/log")
backend/server.py:7611:@api.get("/search/trending")
backend/server.py:7619:@api.get("/search/suggest")
backend/server.py:7628:@api.get("/search/history")
backend/server.py:7644:@api.delete("/search/history")
backend/server.py:7673:@api.post("/admin/digest/test")
backend/server.py:7679:@api.delete("/admin/demo-listings")
backend/server.py:7688:# In Emergent preview, only /api/* routes hit backend; in production (Firebase/Cloudflare),
backend/server.py:7689:# we use rewrites to expose /sitemap.xml → /api/sitemap.xml at the root URL.
backend/server.py:7745:        "Disallow: /api/\n"
backend/server.py:7766:# Both /api/sitemap.xml and /sitemap.xml work (frontend rewrites for the latter in production)
backend/server.py:7790:@api.get("/sitemap.xml", include_in_schema=False)
backend/server.py:7796:@app.get("/sitemap.xml", include_in_schema=False)
backend/server.py:7805:@app.get("/{key}.txt", include_in_schema=False)
backend/server.py:7824:@api.get("/seo/indexnow/key", include_in_schema=False)
backend/server.py:7832:@api.post("/seo/indexnow/resubmit-all", include_in_schema=False)
backend/server.py:7851:@api.get("/robots.txt", include_in_schema=False)
backend/server.py:7857:@app.get("/robots.txt", include_in_schema=False)
backend/server.py:7872:@api.get("/seo/listing/{listing_id}", include_in_schema=False)
backend/server.py:8010:@api.get("/coins/me")
backend/server.py:8017:@api.get("/coins/ledger")
backend/server.py:8023:@api.post("/coins/spend")
backend/server.py:8061:@api.get("/wallet/me")
backend/server.py:8070:@api.get("/wallet/transactions")
backend/server.py:8079:@api.post("/wallet/topup")
backend/server.py:8102:@api.post("/wallet/claim-welcome-bonus")
backend/server.py:8176:@api.get("/static-pages/{slug}")
backend/server.py:8184:@api.post("/wallet/spend")
backend/server.py:8238:@api.post("/ai/assistant")
backend/server.py:8290:@api.get("/ai/assistant/history")
backend/server.py:8305:@api.post("/ai/transcribe")
backend/server.py:8366:@api.get("/geo/detect-country")
backend/server.py:8420:@api.get("/geo/reverse")
backend/server.py:8490:@api.get("/geo/search")
backend/server.py:8609:@api.get("/geo/districts")
backend/server.py:8703:                "https://overpass-api.de/api/interpreter",
backend/server.py:8743:@api.get("/geo/cities")
backend/server.py:8801:                "https://overpass-api.de/api/interpreter",
backend/server.py:8843:    logger.info("[locations] router mounted at /api/locations")
backend/server.py:8850:@app.on_event("startup")
backend/server.py:9193:@app.on_event("shutdown")
backend/tests/test_iter12_features.py:3:- Follow Sellers (POST /api/sellers/{id}/follow toggle, GET follow-status)
backend/tests/test_iter12_features.py:4:- Watches (POST /api/watches, DELETE /api/watches/{listing_id}, GET /api/watches)
backend/tests/test_iter12_features.py:5:- Price-drop notification trigger on PUT /api/listings/{id}
backend/tests/test_iter13_regression.py:4:  - /api/auth/login (admin)
backend/tests/test_iter13_regression.py:5:  - /api/listings (list)
backend/tests/test_iter13_regression.py:6:  - /api/search/trending
backend/tests/test_iter13_regression.py:7:  - /api/admin/finance/summary
backend/tests/test_iter13_regression.py:8:  - /api/admin/seo
backend/tests/test_iter13_regression.py:9:  - /api/ai/listing-autofill
backend/tests/test_iter13_regression.py:10:  - /api/watches (CRUD via create listing)
backend/tests/test_iter13_regression.py:11:  - /api/sellers/{id}/follow (toggle)
backend/tests/test_iter13_regression.py:12:  - /api/listings/{id} PUT (price drop)
backend/tests/test_iter13_regression.py:26:    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
backend/tests/test_iter13_regression.py:41:    r = requests.get(f"{BASE_URL}/api/listings?limit=10", timeout=20)
backend/tests/test_iter13_regression.py:49:    r = requests.get(f"{BASE_URL}/api/search/trending", timeout=20)
backend/tests/test_iter13_regression.py:61:    r = requests.get(f"{BASE_URL}/api/admin/finance/summary", headers=admin_headers, timeout=20)
backend/tests/test_iter13_regression.py:68:    r = requests.get(f"{BASE_URL}/api/admin/seo", headers=admin_headers, timeout=20)
backend/tests/test_iter13_regression.py:75:    r = requests.post(f"{BASE_URL}/api/ai/listing-autofill", json=payload, headers=admin_headers, timeout=60)
backend/tests/test_iter13_regression.py:95:    r = requests.post(f"{BASE_URL}/api/listings", json=payload, headers=admin_headers, timeout=20)
backend/tests/test_iter13_regression.py:101:    requests.delete(f"{BASE_URL}/api/listings/{lid}", headers=admin_headers, timeout=10)
backend/tests/test_iter13_regression.py:106:    r = requests.post(f"{BASE_URL}/api/watches", json={"listing_id": admin_listing}, headers=admin_headers, timeout=20)
backend/tests/test_iter13_regression.py:112:    me = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers, timeout=10).json()
backend/tests/test_iter13_regression.py:114:    r = requests.post(f"{BASE_URL}/api/sellers/{my_id}/follow", headers=admin_headers, timeout=15)
backend/tests/test_iter13_regression.py:120:        f"{BASE_URL}/api/listings/{admin_listing}",
backend/tests/test_iter13_regression.py:126:    g = requests.get(f"{BASE_URL}/api/listings/{admin_listing}", timeout=15)
backend/tests/test_iter14_trip_egypt.py:18:    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
backend/tests/test_iter14_trip_egypt.py:35:        r = requests.get(f"{BASE_URL}/api/meta/countries", timeout=15)
backend/tests/test_iter14_trip_egypt.py:65:        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("1012345678"), timeout=20)
backend/tests/test_iter14_trip_egypt.py:69:        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("1512345678"), timeout=20)
backend/tests/test_iter14_trip_egypt.py:73:        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("9912345678"), timeout=20)
backend/tests/test_iter14_trip_egypt.py:81:        r = requests.post(f"{BASE_URL}/api/auth/register", json=self._payload("100000000"), timeout=20)
backend/tests/test_iter14_trip_egypt.py:101:        r = requests.post(f"{BASE_URL}/api/admin/ads", json=payload, headers=admin_headers, timeout=20)
backend/tests/test_iter14_trip_egypt.py:118:        r = requests.get(f"{BASE_URL}/api/ads", params={"placement": "home_middle"}, timeout=15)
backend/tests/test_iter14_trip_egypt.py:138:        r = requests.post(f"{BASE_URL}/api/admin/ads", json=payload, headers=admin_headers, timeout=20)
backend/tests/test_iter14_trip_egypt.py:149:                requests.delete(f"{BASE_URL}/api/admin/ads/{ad_id}", headers=admin_headers, timeout=10)
backend/tests/test_iter15_trip_ads.py:9:    r = requests.get(f"{BASE_URL}/api/ads", params={"placement": placement}, timeout=15)
backend/tests/test_iter15_trip_ads.py:10:    assert r.status_code == 200, f"GET /api/ads?placement={placement} -> {r.status_code}"
backend/tests/test_iter15_trip_ads.py:37:    r = requests.get(f"{BASE_URL}/api/ads", params={"placement": "listing_top"}, timeout=15)
backend/tests/test_iter16_features.py:4:2. PUT /api/auth/me phone validation per country (admin SA → prefix 5, length 9)
backend/tests/test_iter16_features.py:5:3. POST /api/admin/digest/test (admin auth) returns sent boolean
backend/tests/test_iter16_features.py:6:4. POST /api/cron/daily-digest with bad secret → 403
backend/tests/test_iter16_features.py:8:6. GET /api/listings/{id}/similar — text-similarity ordering (token overlap)
backend/tests/test_iter16_features.py:23:    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
backend/tests/test_iter16_features.py:38:        r = requests.get(f"{BASE_URL}/api/ads", params={"placement": placement})
backend/tests/test_iter16_features.py:54:# 2. PUT /api/auth/me phone validation
backend/tests/test_iter16_features.py:59:        r = admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "512345678"})
backend/tests/test_iter16_features.py:66:        r = admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "99"})
backend/tests/test_iter16_features.py:74:        r = admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "912345678"})
backend/tests/test_iter16_features.py:79:        admin_session.put(f"{BASE_URL}/api/auth/me", json={"phone": "500000000"})
backend/tests/test_iter16_features.py:87:        r = admin_session.post(f"{BASE_URL}/api/admin/digest/test")
backend/tests/test_iter16_features.py:95:        r = requests.post(f"{BASE_URL}/api/admin/digest/test")
backend/tests/test_iter16_features.py:104:        r = requests.post(f"{BASE_URL}/api/cron/daily-digest", headers={"X-Cron-Secret": "invalid"})
backend/tests/test_iter16_features.py:108:        r = requests.post(f"{BASE_URL}/api/cron/daily-digest")
backend/tests/test_iter16_features.py:118:            f"{BASE_URL}/api/auth/me",
backend/tests/test_iter16_features.py:131:            f"{BASE_URL}/api/auth/me",
backend/tests/test_iter16_features.py:165:            r = admin_session.post(f"{BASE_URL}/api/listings", json=body)
backend/tests/test_iter16_features.py:171:            admin_session.post(f"{BASE_URL}/api/admin/listings/{lid}/approve")
backend/tests/test_iter16_features.py:176:                admin_session.delete(f"{BASE_URL}/api/listings/{lid}")
backend/tests/test_iter16_features.py:182:        r = requests.get(f"{BASE_URL}/api/listings/{base_id}/similar", params={"limit": 8})
backend/tests/test_iter17_seo.py:4:  - GET /api/sitemap.xml — XML, urlset namespaces, static pages, listing entries with image:image
backend/tests/test_iter17_seo.py:5:  - GET /api/robots.txt — text/plain, AI agent allowlist, Sitemap reference
backend/tests/test_iter17_seo.py:6:  - GET /api/seo/listing/{id} — full HTML with title/desc/keywords/OG/Twitter/JSON-LD Product
backend/tests/test_iter17_seo.py:7:  - GET /api/seo/listing/{nonexistent} — 404
backend/tests/test_iter17_seo.py:8:  - Regression: /api/listings, /api/auth/me, /api/ads, /api/listings/{id}/similar, /api/admin/seo
backend/tests/test_iter17_seo.py:29:    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
backend/tests/test_iter17_seo.py:37:    r = session.get(f"{BASE_URL}/api/listings?limit=5", timeout=15)
backend/tests/test_iter17_seo.py:50:        r = session.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
backend/tests/test_iter17_seo.py:61:        r = session.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
backend/tests/test_iter17_seo.py:73:        r = session.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
backend/tests/test_iter17_seo.py:85:        r = session.get(f"{BASE_URL}/api/robots.txt", timeout=15)
backend/tests/test_iter17_seo.py:92:        assert "Disallow: /api/" in body
backend/tests/test_iter17_seo.py:95:        body = session.get(f"{BASE_URL}/api/robots.txt", timeout=15).text
backend/tests/test_iter17_seo.py:100:        body = session.get(f"{BASE_URL}/api/robots.txt", timeout=15).text
backend/tests/test_iter17_seo.py:107:        r = session.get(f"{BASE_URL}/api/seo/listing/{sample_listing_id}", timeout=20)
backend/tests/test_iter17_seo.py:135:        r = session.get(f"{BASE_URL}/api/seo/listing/this-id-does-not-exist-zzz", timeout=15)
backend/tests/test_iter17_seo.py:143:        r = session.get(f"{BASE_URL}/api/listings?limit=5", timeout=15)
backend/tests/test_iter17_seo.py:147:        r = session.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
backend/tests/test_iter17_seo.py:152:        r = session.get(f"{BASE_URL}/api/ads?placement=home_top", timeout=15)
backend/tests/test_iter17_seo.py:157:        r = session.get(f"{BASE_URL}/api/listings/{sample_listing_id}/similar", timeout=15)
backend/tests/test_iter17_seo.py:161:        r = session.get(f"{BASE_URL}/api/admin/seo", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
backend/tests/test_iter18_search.py:4:  - GET /api/listings?q=... (exact, fuzzy, normalization, digits)
backend/tests/test_iter18_search.py:5:  - GET /api/search/suggest
backend/tests/test_iter18_search.py:6:  - POST /api/listings + immediate searchability (index hook)
backend/tests/test_iter18_search.py:7:  - PUT /api/listings/{id} + search_blob refresh
backend/tests/test_iter18_search.py:32:    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
backend/tests/test_iter18_search.py:101:        r = requests.post(f"{BASE_URL}/api/listings", json=p, headers=auth_headers, timeout=20)
backend/tests/test_iter18_search.py:111:            requests.delete(f"{BASE_URL}/api/listings/{lid}", headers=auth_headers, timeout=10)
backend/tests/test_iter18_search.py:120:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدس"})
backend/tests/test_iter18_search.py:131:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدسس"})
backend/tests/test_iter18_search.py:142:            r = api.get(f"{BASE_URL}/api/listings", params={"q": variant})
backend/tests/test_iter18_search.py:150:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "سي ٢٠٠"})
backend/tests/test_iter18_search.py:155:        r2 = api.get(f"{BASE_URL}/api/listings", params={"q": "2020"})
backend/tests/test_iter18_search.py:163:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "republish"})
backend/tests/test_iter18_search.py:172:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "republsh"})
backend/tests/test_iter18_search.py:183:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "xyzqwerty"})
backend/tests/test_iter18_search.py:191:        r = api.get(f"{BASE_URL}/api/listings")
backend/tests/test_iter18_search.py:200:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدس", "category": "cars"})
backend/tests/test_iter18_search.py:209:        r = api.get(f"{BASE_URL}/api/listings", params={"q": "مرسيدس", "category": "electronics"})
backend/tests/test_iter18_search.py:217:# ---------------- 4. /api/search/suggest ----------------
backend/tests/test_iter18_search.py:221:        r = api.get(f"{BASE_URL}/api/search/suggest", params={"q": "مر", "limit": 8})
backend/tests/test_iter18_search.py:231:        r = api.get(f"{BASE_URL}/api/search/suggest", params={"q": ""})
backend/tests/test_iter18_search.py:237:        r = api.get(f"{BASE_URL}/api/search/suggest", params={"q": "TEST_SEARCH", "limit": 3})
backend/tests/test_iter18_search.py:260:        r = requests.post(f"{BASE_URL}/api/listings", json=payload, headers=auth_headers, timeout=20)
backend/tests/test_iter18_search.py:270:            r2 = requests.get(f"{BASE_URL}/api/listings", params={"q": "زمرد_خاص"}, timeout=15)
backend/tests/test_iter18_search.py:276:            requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=auth_headers, timeout=10)
backend/tests/test_iter18_search.py:283:            f"{BASE_URL}/api/listings",
backend/tests/test_iter18_search.py:304:            r1 = requests.get(f"{BASE_URL}/api/listings", params={"q": "ياقوت_فريد"}, timeout=15)
backend/tests/test_iter18_search.py:309:                f"{BASE_URL}/api/listings/{listing_id}",
backend/tests/test_iter18_search.py:318:            r2 = requests.get(f"{BASE_URL}/api/listings", params={"q": "زبرجد_جديد"}, timeout=15)
backend/tests/test_iter18_search.py:324:            r3 = requests.get(f"{BASE_URL}/api/listings", params={"q": "ياقوت_فريد"}, timeout=15)
backend/tests/test_iter18_search.py:334:            requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=auth_headers, timeout=10)
backend/tests/test_iter18_search.py:341:        r = api.get(f"{BASE_URL}/api/search/trending")
backend/tests/test_iter18_search.py:346:        r = api.post(f"{BASE_URL}/api/search/log", json={"query": "مرسيدس"})
backend/tests/test_iter18_search.py:351:        r = requests.get(f"{BASE_URL}/api/search/history", headers=auth_headers, timeout=10)
backend/tests/test_iter19_push.py:4:  - GET  /api/push/web/vapid-public-key (no auth)
backend/tests/test_iter19_push.py:5:  - POST /api/push/web/subscribe / unsubscribe (auth)
backend/tests/test_iter19_push.py:6:  - POST /api/push/register / DELETE /api/push/unregister (auth)
backend/tests/test_iter19_push.py:7:  - GET/PUT /api/push/preferences (auth, defaults + merge)
backend/tests/test_iter19_push.py:8:  - POST /api/push/test (auth)
backend/tests/test_iter19_push.py:9:  - POST /api/admin/notifications/broadcast (admin)
backend/tests/test_iter19_push.py:10:  - POST /api/chat/send → db.notifications row for receiver
backend/tests/test_iter19_push.py:11:  - POST /api/admin/listings/{id}/approve|reject → notifications
backend/tests/test_iter19_push.py:12:  - Regression: /api/auth/google/start, /api/auth/x/start, /api/auth/snapchat/start
backend/tests/test_iter19_push.py:13:  - mobile_redirect support on /api/auth/x/start
backend/tests/test_iter19_push.py:14:  - GET /api/listings still works
backend/tests/test_iter19_push.py:15:  - GET /api/chat/messages/{convo_id} still works
backend/tests/test_iter19_push.py:52:    r = api.post(f"{BASE_URL}/api/auth/login",
backend/tests/test_iter19_push.py:71:    r = api.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
backend/tests/test_iter19_push.py:95:    r = s.post(f"{BASE_URL}/api/auth/register", json=payload)
backend/tests/test_iter19_push.py:101:        rl = s.post(f"{BASE_URL}/api/auth/login",
backend/tests/test_iter19_push.py:106:    me = s.get(f"{BASE_URL}/api/auth/me", headers=h)
backend/tests/test_iter19_push.py:114:        r = api.get(f"{BASE_URL}/api/push/web/vapid-public-key")
backend/tests/test_iter19_push.py:139:        r = api.post(f"{BASE_URL}/api/push/web/subscribe", json=self.SUB)
backend/tests/test_iter19_push.py:143:        r = api.post(f"{BASE_URL}/api/push/web/subscribe", json=self.SUB, headers=admin_headers)
backend/tests/test_iter19_push.py:148:        r = api.post(f"{BASE_URL}/api/push/web/unsubscribe", json=self.SUB, headers=admin_headers)
backend/tests/test_iter19_push.py:159:        r = api.post(f"{BASE_URL}/api/push/register",
backend/tests/test_iter19_push.py:164:        r = api.post(f"{BASE_URL}/api/push/register",
backend/tests/test_iter19_push.py:170:        r = api.delete(f"{BASE_URL}/api/push/unregister?expo_token={self.TOKEN}",
backend/tests/test_iter19_push.py:181:        r = api.get(f"{BASE_URL}/api/push/preferences", headers=user_b["headers"])
backend/tests/test_iter19_push.py:189:        r = api.put(f"{BASE_URL}/api/push/preferences",
backend/tests/test_iter19_push.py:194:        r2 = api.get(f"{BASE_URL}/api/push/preferences", headers=user_b["headers"])
backend/tests/test_iter19_push.py:204:        api.put(f"{BASE_URL}/api/push/preferences",
backend/tests/test_iter19_push.py:213:        r = api.post(f"{BASE_URL}/api/push/test", headers=admin_headers)
backend/tests/test_iter19_push.py:228:        r = api.post(f"{BASE_URL}/api/admin/notifications/broadcast",
backend/tests/test_iter19_push.py:240:        r = api.post(f"{BASE_URL}/api/admin/notifications/broadcast",
backend/tests/test_iter19_push.py:250:        """POST /api/chat/send → check db.notifications has new_message for receiver."""
backend/tests/test_iter19_push.py:253:        r = api.post(f"{BASE_URL}/api/chat/send",
backend/tests/test_iter19_push.py:322:            r = api.post(f"{BASE_URL}/api/listings", json=payload, headers=user_b["headers"])
backend/tests/test_iter19_push.py:340:            api.delete(f"{BASE_URL}/api/listings/{lid}", headers=user_b["headers"])
backend/tests/test_iter19_push.py:345:        r = api.post(f"{BASE_URL}/api/admin/listings/{lid}/approve", headers=admin_headers)
backend/tests/test_iter19_push.py:373:        r = api.post(f"{BASE_URL}/api/admin/listings/{lid}/reject", headers=admin_headers)
backend/tests/test_iter19_push.py:402:        r = api.get(f"{BASE_URL}/api/auth/google/start")
backend/tests/test_iter19_push.py:409:        r = api.get(f"{BASE_URL}/api/auth/x/start")
backend/tests/test_iter19_push.py:418:        r = api.get(f"{BASE_URL}/api/auth/x/start",
backend/tests/test_iter19_push.py:427:        r = api.get(f"{BASE_URL}/api/auth/snapchat/start")

## Mock/placeholder/TODO markers
backend/seed_data.py:209:            {"key": "vin", "label_ar": "رقم الهيكل VIN", "label_en": "VIN", "type": "text", "required": False, "placeholder": "17 characters"},
backend/seed_data.py:331:            {"key": "schedule", "label_ar": "متى تحتاج الخدمة؟", "label_en": "Schedule", "type": "text", "required": False, "placeholder": "مثلاً: غداً 8 صباحاً، أو خلال الأسبوع"},
backend/seed_data.py:445:            {"key": "game_title", "label_ar": "اسم اللعبة", "label_en": "Game Title", "type": "text", "required": False, "placeholder": "FIFA 24 / GTA / EA Sports..."},
backend/seed_data.py:459:            {"key": "plant_type", "label_ar": "نوع النبات (إن وُجد)", "label_en": "Plant Type", "type": "text", "required": False, "placeholder": "نخيل / ورد / صبار..."},
backend/seed_data.py:474:            {"key": "brand", "label_ar": "الماركة", "label_en": "Brand", "type": "text", "required": False, "placeholder": "Nike / Adidas / Trek..."},
backend/seed_data.py:475:            {"key": "size", "label_ar": "المقاس", "label_en": "Size", "type": "text", "required": False, "placeholder": "M / L / 42 / 26 inch..."},
backend/seed_data.py:504:            {"key": "model", "label_ar": "الموديل", "label_en": "Model", "type": "text", "required": True, "placeholder": "iPhone 15 Pro / Galaxy S24..."},
backend/seed_data.py:523:            {"key": "breed", "label_ar": "السلالة", "label_en": "Breed", "type": "text", "required": False, "placeholder": "شيرازي / بريش..."},
backend/seed_data.py:524:            {"key": "age", "label_ar": "العمر", "label_en": "Age", "type": "text", "required": False, "placeholder": "3 شهور / سنة..."},
backend/seed_data.py:554:            {"key": "weight", "label_ar": "الوزن/الكمية", "label_en": "Weight", "type": "text", "required": False, "placeholder": "1 كجم / علبة..."},
backend/seed_data.py:566:            {"key": "industry", "label_ar": "النشاط", "label_en": "Industry", "type": "text", "required": False, "placeholder": "مطعم / كافيه / تجارة..."},
backend/server.py:1561:    # X does not return email by default; use x_id@x.local as placeholder
backend/server.py:1562:    placeholder_email = f"x_{x_id}@x.local"
backend/server.py:1563:    user = await db.users.find_one({"$or": [{"x_id": x_id}, {"email": placeholder_email}]})
backend/server.py:1567:            "id": uid, "name": x_name, "email": placeholder_email,
backend/server.py:1631:    placeholder_email = f"x_{x_id}@x.local"
backend/server.py:1632:    user = await db.users.find_one({"$or": [{"x_id": x_id}, {"email": placeholder_email}]})
backend/server.py:1639:            "id": uid, "name": x_name, "email": placeholder_email,
backend/server.py:1744:    placeholder_email = f"snap_{snap_id}@snapchat.local"
backend/server.py:1745:    user = await db.users.find_one({"$or": [{"snap_id": snap_id}, {"email": placeholder_email}]})
backend/server.py:1749:            "id": uid, "name": snap_name, "email": placeholder_email,
backend/server.py:1823:    placeholder_email = f"snap_{snap_id}@snapchat.local"
backend/server.py:1824:    user = await db.users.find_one({"$or": [{"snap_id": snap_id}, {"email": placeholder_email}]})
backend/server.py:1828:            "id": uid, "name": snap_name, "email": placeholder_email,
backend/server.py:2035:            # disabled-password placeholder — user must use Google or password-reset
backend/server.py:2234:        # Apple may not return an email if the user chose private relay; fall back to placeholder.
backend/server.py:2721:    """Accept only an uploaded/hosted GLB or GLTF asset; no fake conversion."""
backend/server.py:2942:                "categories ممكن أن تحتوي: scam, drugs, adult, fraud, weapons, hate, fake, prohibited. "
backend/server.py:4953:# These are first-class persisted workflows; no mock cards or fake success.
backend/server.py:9190:    # an empty ads collection must render an honest empty state, not fake data.
backend/tests/test_haraj_plus.py:477:            "target_id": "fake-listing-id",
backend/tests/test_iter12_features.py:75:        "images": ["https://via.placeholder.com/400"],
backend/tests/test_iter19_push.py:134:        "keys": {"p256dh": "BHFakeP256dhKeyForTestingPurposesOnly1234567890abcdef", "auth": "fakeAuthSecret1234"},
backend/tests/test_iteration7_x_oauth.py:53:            json={"code": "fake_code_abc", "state": "this-state-does-not-exist"},
backend/tests/test_iteration8_snap_push.py:113:                      json={"code": "fake_code_xyz", "state": "bogus_state_value"})
backend/tests/test_iteration8_snap_push.py:232:                      json={"code": "fake", "state": "unknown_state_xxx"})
backend/tests/conftest.py:6:mock/test server or staging URL is started.
frontend/src/components/AIAssistantWidget.js:277:                            <input data-testid="ai-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={tr("اكتب رسالتك...")} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm font-arabic-body text-[var(--text)] outline-none focus:border-[var(--primary)]" disabled={busy} />
frontend/src/components/AnimalsEquipmentBoxes.js:143:                <TextCell label={tr("الموديل")} value={cf.model} required onChange={(v) => set({ model: v })} placeholder={tr("مثال: CAT 320D")} testid="eq-model" />
frontend/src/components/AnimalsEquipmentBoxes.js:191:function TextCell({ label, value, onChange, required, placeholder, testid }) {
frontend/src/components/AnimalsEquipmentBoxes.js:201:                placeholder={placeholder}
frontend/src/components/AuctionsServicesBoxes.js:202:                    <TextCell label={tr("نقطة الالتقاط")} value={cf.pickup_location} required onChange={(v) => set({ pickup_location: v })} placeholder={tr("المدينة، الحي")} testid="svc-pickup" />
frontend/src/components/AuctionsServicesBoxes.js:203:                    <TextCell label={tr("نقطة الوصول")} value={cf.dropoff_location} required onChange={(v) => set({ dropoff_location: v })} placeholder={tr("المدينة، الحي")} testid="svc-dropoff" />
frontend/src/components/AuctionsServicesBoxes.js:286:function TextCell({ label, value, onChange, required, placeholder, testid }) {
frontend/src/components/AuctionsServicesBoxes.js:296:                placeholder={placeholder}
frontend/src/components/CategoryCascades.js:96:                <Field label={tr("اللون")} value={v.color || ""} onChange={(x) => set({ color: x })} placeholder={tr("مثال: أبيض / أسود")} testid="car-color" />
frontend/src/components/CategoryCascades.js:163:                <Field label={tr("الماركة / المصدر")} value={v.brand || ""} onChange={(x) => set({ brand: x })} placeholder={tr("مثال: IKEA / محلي")} testid="furn-brand" />
frontend/src/components/CategoryCascades.js:214:function Field({ label, value, onChange, placeholder, testid }) {
frontend/src/components/CategoryCascades.js:222:                placeholder={placeholder}
frontend/src/components/CitySelect.js:16:    placeholder,
frontend/src/components/CitySelect.js:72:    const displayLabel = value || (placeholder || tr(kind === "city" ? "اختر المدينة" : "اختر الحي / المنطقة"));
frontend/src/components/CitySelect.js:117:                                placeholder={kind === "city" ? tr("اكتب اسم المدينة...") : tr("اكتب اسم الحي...")}
frontend/src/components/CitySelect.js:118:                                className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)] placeholder:text-[var(--text-muted)]"
frontend/src/components/GeoAutocomplete.js:16:    placeholder,
frontend/src/components/GeoAutocomplete.js:96:                placeholder={placeholder || tr(kind === "city" ? "ابحث عن مدينة..." : "ابحث عن حي...")}
frontend/src/components/JobsRealEstateBoxes.js:55:                <TextCell label={tr("المسمى الوظيفي")} value={cf.job_title} required onChange={(v) => set({ job_title: v })} placeholder={tr("مثال: مهندس برمجيات أول")} testid="job-title" />
frontend/src/components/JobsRealEstateBoxes.js:60:                    <TextCell label={tr("الراتب المتوقع")} value={cf.expected_salary} onChange={(v) => set({ expected_salary: v })} placeholder={tr("مثال: 8,000 ر.س")} testid="job-expected-salary" />
frontend/src/components/JobsRealEstateBoxes.js:62:                    <TextCell label={tr("نطاق الراتب")} value={cf.salary_range} onChange={(v) => set({ salary_range: v })} placeholder={tr("مثال: 6,000 - 10,000 ر.س")} testid="job-salary-range" />
frontend/src/components/JobsRealEstateBoxes.js:77:                    <TextAreaCell colSpan label={tr("المهارات والقدرات")} value={cf.skills} onChange={(v) => set({ skills: v })} placeholder={tr("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} testid="job-skills" />
frontend/src/components/JobsRealEstateBoxes.js:79:                    <TextAreaCell colSpan label={tr("المتطلبات والشروط")} value={cf.requirements} onChange={(v) => set({ requirements: v })} placeholder={tr("اذكر المؤهلات والمتطلبات الإلزامية...")} testid="job-requirements" />
frontend/src/components/JobsRealEstateBoxes.js:170:function TextCell({ label, value, onChange, required, placeholder, testid }) {
frontend/src/components/JobsRealEstateBoxes.js:180:                placeholder={placeholder}
frontend/src/components/JobsRealEstateBoxes.js:230:function TextAreaCell({ label, value, onChange, placeholder, colSpan, testid }) {
frontend/src/components/JobsRealEstateBoxes.js:238:                placeholder={placeholder}
frontend/src/components/LocationPicker.jsx:150:                            placeholder={tr("ابحث...")}
frontend/src/components/LocationPicker.jsx:152:                            className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)] placeholder:text-[var(--text-muted)]"
frontend/src/components/layout/TopBar.js:166:                            placeholder={t("search_placeholder")}
frontend/src/components/layout/TopBar.js:168:                            className="bg-transparent flex-1 mx-2 outline-none text-xs sm:text-sm placeholder:text-[var(--text-muted)] text-[var(--text)] font-arabic-body min-w-0"
frontend/src/components/ui/command.jsx:41:        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
frontend/src/components/ui/input.jsx:10:        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
frontend/src/components/ui/select.jsx:17:      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
frontend/src/components/ui/textarea.jsx:9:        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
frontend/src/contexts/I18nContext.js:23:        search_placeholder: "ابحث عن أي شيء... (AI)",
frontend/src/contexts/I18nContext.js:63:        search_placeholder: "Search anything... (AI)",
frontend/src/contexts/I18nContext.js:103:        search_placeholder: "تلاش کریں...",
frontend/src/contexts/I18nContext.js:142:        search_placeholder: "कुछ भी खोजें...",
frontend/src/contexts/I18nContext.js:179:        search_placeholder: "যেকোনো কিছু খুঁজুন...",
frontend/src/contexts/I18nContext.js:216:        search_placeholder: "Rechercher...",
frontend/src/hooks/useAuctionLive.js:101:        // No-op manual refresh placeholder so callers used to polling can switch
frontend/src/pages/AdminPage.js:112:        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm space-y-3"><div className="flex flex-wrap items-center gap-2"><b>{tr("ترتيب التدوير")}</b><input value={(config.order || []).join(", ")} onChange={(e) => setConfig({ ...config, order: e.target.value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) })} placeholder={rotation || "gemini, grok"} className="flex-1 min-w-[220px] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 font-mono text-xs" /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><label>{tr("الوضع")}<select value={config.mode || "automatic"} onChange={(e) => setConfig({ ...config, mode: e.target.value })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1"><option value="automatic">Automatic</option><option value="priority">Priority</option><option value="manual">Manual + fallback</option></select></label><label>{tr("المزود الأساسي")}<input value={config.primary || ""} onChange={(e) => setConfig({ ...config, primary: e.target.value.toLowerCase() })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1" /></label><label>{tr("أقصى محاولات") }<input type="number" min="1" max="20" value={config.max_attempts ?? 3} onChange={(e) => setConfig({ ...config, max_attempts: Number(e.target.value) })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label><label>{tr("عتبة الحصة %")}<input type="number" min="0" max="100" value={config.quota_threshold_pct ?? 90} onChange={(e) => setConfig({ ...config, quota_threshold_pct: Number(e.target.value) })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div><div className="flex flex-wrap gap-4 text-xs"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.rotation_enabled !== false} onChange={(e) => setConfig({ ...config, rotation_enabled: e.target.checked })} />{tr("التدوير التلقائي")}</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.fallback_enabled !== false} onChange={(e) => setConfig({ ...config, fallback_enabled: e.target.checked })} />{tr("fallback عند الفشل")}</label></div><p className="text-xs text-[var(--text-muted)]">{tr("تحكم إداري غير سري؛ مفاتيح API تبقى في متغيرات الخادم ولا تُحفظ هنا")}</p><div className="flex items-center gap-2"><button onClick={saveConfig} disabled={saving} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50">{saving ? tr("حفظ...") : tr("حفظ إعدادات AI")}</button>{saved && <span className="text-xs text-emerald-600">{saved}</span>}</div></div>
frontend/src/pages/AdminPage.js:166:            <div className="flex flex-wrap gap-2"><select value={device} onChange={(e) => setDevice(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value="">كل الأجهزة</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select><input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={3} placeholder={tr("الدولة مثل SA")} className="w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-latin" /></div>
frontend/src/pages/AdminPage.js:532:                <input data-testid="filter-q" placeholder={tr("بحث في العنوان...")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="col-span-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AdminPage.js:545:                <input data-testid="filter-country" placeholder={tr("الدولة (SA)")} value={filters.country_code} onChange={(e) => { setSkip(0); setFilters({ ...filters, country_code: e.target.value.toUpperCase() }); }} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm uppercase" />
frontend/src/pages/AdminPage.js:749:                <input data-testid="users-q" placeholder={tr("بحث (اسم / بريد / جوال)")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="col-span-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AdminPage.js:750:                <input data-testid="users-cc" placeholder={tr("الدولة")} maxLength={3} value={filters.country_code} onChange={(e) => setFilters({ ...filters, country_code: e.target.value.toUpperCase() })} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm uppercase" />
frontend/src/pages/AdminPage.js:1055:                        <input data-testid="notif-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("🔥 عرض اليوم!")} />
frontend/src/pages/AdminPage.js:1059:                        <textarea data-testid="notif-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={500} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("اكتشف صفقات حصرية على الإعلانات الجديدة!")} />
frontend/src/pages/AdminPage.js:1064:                            <input data-testid="notif-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={300} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="/listing/abc123  •  /auctions  •  https://..." />
frontend/src/pages/AdminPage.js:1069:                            <input data-testid="notif-image" type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} maxLength={400} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="https://res.cloudinary.com/.../image.jpg" />
frontend/src/pages/AdminPage.js:1088:                                <input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} maxLength={2} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="SA / AE / KW..." />
frontend/src/pages/AdminPage.js:1094:                                <input data-testid="notif-category" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="cars / electronics ..." />
frontend/src/pages/AdminPage.js:1208:                    <input data-testid="ad-title-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={tr("عنوان الإعلان")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1212:                            <input data-testid="ad-image-input" required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder={tr("رابط الصورة (https://...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1213:                            <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder={tr("رابط عند الضغط (اختياري)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1218:                            <input data-testid="ad-iframe-url-input" required value={form.iframe_url} onChange={(e) => setForm({ ...form, iframe_url: e.target.value })} placeholder={tr("رابط iframe الكامل (https://trip.com/...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none ltr-text" dir="ltr" />
frontend/src/pages/AdminPage.js:1220:                                <input type="number" value={form.iframe_width} onChange={(e) => setForm({ ...form, iframe_width: parseInt(e.target.value) || 300 })} placeholder="العرض (px)" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1221:                                <input type="number" value={form.iframe_height} onChange={(e) => setForm({ ...form, iframe_height: parseInt(e.target.value) || 250 })} placeholder="الارتفاع (px)" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1362:                    <input data-testid="new-city-ar" value={newCity.name_ar} onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })} placeholder={tr("الاسم بالعربية *")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" />
frontend/src/pages/AdminPage.js:1363:                    <input data-testid="new-city-en" value={newCity.name_en} onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })} placeholder={tr("English name (optional)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none" dir="ltr" />
frontend/src/pages/AdminPage.js:1364:                    <input data-testid="new-city-districts" value={newCity.districts} onChange={(e) => setNewCity({ ...newCity, districts: e.target.value })} placeholder={tr("الأحياء (مفصولة بفاصلة)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" />
frontend/src/pages/AdminPage.js:1390:                                    <input data-testid="new-district-input" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} placeholder={tr("اسم الحي الجديد")} className="flex-1 bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" onKeyDown={(e) => e.key === "Enter" && addDistrict()} />
frontend/src/pages/AdminPage.js:1511:                    <input data-testid="bw-new" placeholder={tr("أضف كلمة محظورة جديدة...")} value={newWord} onChange={(e) => setNewWord(e.target.value)} maxLength={60} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AdminPage.js:1514:                <input data-testid="bw-filter" placeholder={tr("بحث في القائمة...")} value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AuctionsPage.js:256:                        <input data-testid="bid-amount" type="number" min={minRequired} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${minRequired}`} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-3 text-base font-bold text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin" />
frontend/src/pages/Auth.js:193:                    <Field icon={Mail} type="email" placeholder={t("email")} value={email} onChange={setEmail} testid="login-email" />
frontend/src/pages/Auth.js:196:                        <input data-testid="login-password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")}
frontend/src/pages/Auth.js:290:                    <Field icon={User} placeholder={t("name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="reg-name" />
frontend/src/pages/Auth.js:291:                    <Field icon={Mail} type="email" placeholder={t("email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="reg-email" />
frontend/src/pages/Auth.js:292:                    <PasswordFieldWithStrength value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={`${t("password")} (8 أحرف على الأقل)`} testid="reg-password" />
frontend/src/pages/Auth.js:293:                    <PasswordFieldWithStrength value={confirmPw} onChange={setConfirmPw} placeholder={tr("تأكيد كلمة المرور")} testid="reg-confirm-password" />
frontend/src/pages/Auth.js:306:                            <input data-testid="reg-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder={tr("رقم الجوال")} maxLength={cur?.phone_length || 9}
frontend/src/pages/Auth.js:320:                    <Field icon={Gift} placeholder={tr("كود الإحالة (اختياري)")} value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v.toUpperCase() })} testid="reg-referral" />
frontend/src/pages/Auth.js:381:                        <Field icon={Mail} type="email" placeholder={t("email")} value={email} onChange={setEmail} testid="forgot-email" />
frontend/src/pages/Auth.js:409:function PasswordFieldWithStrength({ value, onChange, placeholder, testid }) {
frontend/src/pages/Auth.js:416:                <input data-testid={testid} type={show ? "text" : "password"} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
frontend/src/pages/Auth.js:473:                        <PasswordFieldWithStrength value={password} onChange={setPassword} placeholder={tr("كلمة المرور الجديدة")} testid="reset-password" />
frontend/src/pages/Auth.js:474:                        <PasswordFieldWithStrength value={confirmPw} onChange={setConfirmPw} placeholder={tr("تأكيد كلمة المرور")} testid="reset-confirm-password" />
frontend/src/pages/Auth.js:483:function Field({ icon: Icon, type = "text", placeholder, value, onChange, testid, minLength }) {
frontend/src/pages/Auth.js:487:            <input data-testid={testid} type={type} minLength={minLength} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
frontend/src/pages/CategoryPage.js:125:                    <input data-testid="filter-min-price" type="number" placeholder={tr("السعر من")} value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:126:                    <input data-testid="filter-max-price" type="number" placeholder={tr("السعر إلى")} value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:127:                    <input data-testid="filter-city" type="text" placeholder={tr("المدينة")} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/ChatPage.js:833:                                    rows={1} placeholder={tr("اكتب رسالتك...")}
frontend/src/pages/DownloadPage.js:13: *   If the URL is empty we stay on the page and show the QR placeholders.
frontend/src/pages/DownloadPage.js:16: *   greyed-out placeholder showing "قريباً" so the page is always usable
frontend/src/pages/FlightsPage.js:153:                            placeholder={tr("ابحث عن مدينة أو مطار أو رمز IATA...")}
frontend/src/pages/ListingDetail.js:412:                                <input data-testid="listing-comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={1000} placeholder={tr("اكتب تعليقًا عامًا...")} className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/ListingDetail.js:649:                        <input autoFocus required type="number" min="1" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-3" placeholder={listing.price ? String(listing.price) : "0"} />
frontend/src/pages/ListingDetail.js:651:                        <textarea rows={3} value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-4" placeholder={tr("اكتب رسالة للبائع...")} />
frontend/src/pages/PostListing.js:685:                        <input data-testid="post-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("مثال: تويوتا كامري 2020 — وارد الخليج")} />
frontend/src/pages/PostListing.js:731:                        <textarea data-testid="post-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("اكتب وصفاً تفصيلياً...")} />
frontend/src/pages/PostListing.js:806:                                    <input data-testid="post-price" type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl ps-4 pe-16 py-3 text-base border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold tracking-wider" placeholder={tr("اتركه فارغاً للسوم")} style={{ minHeight: "48px" }} />
frontend/src/pages/PostListing.js:848:                                <input data-testid={`field-${f.key}`} type={f.type} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
frontend/src/pages/PostListing.js:850:                                <input data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
frontend/src/pages/PostListing.js:1011:                        placeholder based on the active country (NOT always +966). */}
frontend/src/pages/PostListing.js:1071:                                            placeholder={ph}
frontend/src/pages/ProfilePage.js:357:                <input data-testid="profile-phone-input" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="5xxxxxxxx" className="flex-1 bg-[var(--surface-elevated)] rounded-lg px-3 py-1.5 text-sm border border-[var(--primary)] outline-none font-latin tracking-wider" autoFocus />
frontend/src/pages/SearchAndMap.js:186:                    <input data-testid="search-page-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSearchParams({ q })} placeholder={t("search_placeholder")} className="bg-transparent flex-1 mx-3 outline-none text-sm text-[var(--text)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:213:                            <input data-testid="filter-min" type="number" placeholder={tr("السعر من")} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:214:                            <input data-testid="filter-max" type="number" placeholder={tr("السعر إلى")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/StaticPages.js:165:                    <input data-testid="contact-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={tr("الموضوع")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/StaticPages.js:166:                    <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={tr("اكتب رسالتك...")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]"></textarea>
frontend/src/pages/WorkflowPage.js:36:      {isBuy ? <><input required minLength={3} value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("عنوان الطلب")} className="field" /><div className="grid sm:grid-cols-2 gap-3"><input required value={form.category} onChange={e => set("category", e.target.value)} placeholder={t("الفئة")} className="field" /><input value={form.city} onChange={e => set("city", e.target.value)} placeholder={t("المدينة")} className="field" /></div><div className="grid sm:grid-cols-2 gap-3"><input type="number" min="0" value={form.budget_min} onChange={e => set("budget_min", e.target.value)} placeholder={t("الميزانية من")} className="field" /><input type="number" min="0" value={form.budget_max} onChange={e => set("budget_max", e.target.value)} placeholder={t("الميزانية إلى")} className="field" /></div><textarea required value={form.description} onChange={e => set("description", e.target.value)} placeholder={t("وصف الطلب")} className="field min-h-28" /></> : <><input required minLength={3} value={form.subject} onChange={e => set("subject", e.target.value)} placeholder={t("موضوع التذكرة")} className="field" /><div className="grid sm:grid-cols-2 gap-3"><select value={form.category} onChange={e => set("category", e.target.value)} className="field"><option value="general">{t("عام")}</option><option value="account">{t("الحساب")}</option><option value="listing">{t("إعلان")}</option><option value="payment">{t("الدفع")}</option><option value="report">{t("بلاغ")}</option></select><select value={form.priority} onChange={e => set("priority", e.target.value)} className="field"><option value="normal">{t("عادي")}</option><option value="high">{t("مرتفع")}</option><option value="urgent">{t("عاجل")}</option></select></div><textarea required value={form.message} onChange={e => set("message", e.target.value)} placeholder={t("اكتب رسالتك")} className="field min-h-28" /></>}
mobile/src/components/AnimalsEquipmentBoxesMobile.js:105:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:110:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:125:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:139:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:218:        })} placeholder={t("مثال: CAT 320D")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:232:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:247:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:85:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:90:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:98:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:103:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:116:        })} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:230:          })} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:242:          })} placeholder={t("المدينة، الحي")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:247:          })} placeholder={t("المدينة، الحي")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:266:          })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:271:          })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/CategoryCascadesMobile.js:24:  placeholder,
mobile/src/components/CategoryCascadesMobile.js:34:                <Text style={value ? ps.txt : ps.ph}>{value || placeholder || "—"}</Text>
mobile/src/components/CategoryCascadesMobile.js:108:                <Lab text={t("الماركة")}><Picker value={v.car_brand || ""} options={brands} placeholder="—" onChange={b => set({
mobile/src/components/CategoryCascadesMobile.js:113:                <Lab text={t("الموديل")}><Picker value={v.car_model || ""} options={models} placeholder="—" disabled={!v.car_brand} onChange={m => set({
mobile/src/components/CategoryCascadesMobile.js:119:                <Lab text={t("السنة")}><Picker value={v.car_year || ""} options={years} placeholder="—" onChange={y => set({
mobile/src/components/CategoryCascadesMobile.js:122:                <Lab text={t("الفئة")}><Picker value={v.car_trim || ""} options={trims} placeholder="—" disabled={!v.car_model} onChange={tx => set({
mobile/src/components/CategoryCascadesMobile.js:127:                <Lab text={t("الممشى (كم)")}><Picker value={v.mileage || ""} options={CAR_OPTS.mileage} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:130:                <Lab text={t("ناقل الحركة")}><Picker value={v.transmission || ""} options={CAR_OPTS.transmission} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:135:                <Lab text={t("نوع الوقود")}><Picker value={v.fuel_type || ""} options={CAR_OPTS.fuel_type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:138:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={CAR_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:143:                <Lab text={t("نوع الإعلان")}><Picker value={v.listing_type || ""} options={CAR_OPTS.listing_type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:146:                <Lab text={t("اللون")}><Picker value={v.color || ""} options={CAR_OPTS.color} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:209:                <Lab text={t("الماركة")}><Picker value={v.phone_brand || ""} options={brands} placeholder="—" onChange={b => set({
mobile/src/components/CategoryCascadesMobile.js:215:                <Lab text={t("الموديل")}><Picker value={v.phone_model || ""} options={models} placeholder="—" disabled={!v.phone_brand} onChange={m => set({
mobile/src/components/CategoryCascadesMobile.js:222:                <Lab text={t("السعة")}><Picker value={v.phone_storage || ""} options={storages} placeholder="—" disabled={!v.phone_model} onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:225:                <Lab text={t("اللون")}><Picker value={v.phone_color || ""} options={palette} placeholder="—" disabled={!v.phone_model} onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:230:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={PHONE_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:233:                <Lab text={t("الذاكرة (RAM)")}><Picker value={v.ram || ""} options={PHONE_OPTS.ram} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:238:                <Lab text={t("الضمان")}><Picker value={v.warranty || ""} options={PHONE_OPTS.warranty} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:281:                <Lab text={t("نوع الأثاث")}><Picker value={v.furniture_type || ""} options={FURNITURE_OPTS.type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:284:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={FURNITURE_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:289:                <Lab text={t("الخامة")}><Picker value={v.material || ""} options={FURNITURE_OPTS.material} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:292:                <Lab text={t("اللون")}><Picker value={v.color || ""} options={FURNITURE_OPTS.color} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:297:                <Lab text={t("مدة الاستخدام")}><Picker value={v.usage_duration || ""} options={FURNITURE_OPTS.usage_duration} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:300:                <Lab text={t("الماركة / المصدر")}><Picker value={v.brand || ""} options={FURNITURE_OPTS.brand} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:305:                <Lab text={t("المقاس")}><Picker value={v.size || ""} options={FURNITURE_OPTS.size} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:308:                <Lab text={t("مكان الاستخدام")}><Picker value={v.location || ""} options={FURNITURE_OPTS.location} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:328:                <Lab text={t("نوع الجهاز")}><Picker value={v.appliance_type || ""} options={APPLIANCE_OPTS.appliance_type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:331:                <Lab text={t("الماركة")}><Picker value={v.brand || ""} options={APPLIANCE_OPTS.brand} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:336:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={APPLIANCE_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:339:                <Lab text={t("الضمان")}><Picker value={v.warranty || ""} options={APPLIANCE_OPTS.warranty} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:344:                <Lab text={t("استهلاك الطاقة")}><Picker value={v.power || ""} options={APPLIANCE_OPTS.power} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:347:                <Lab text={t("نوع الاستخدام")}><Picker value={v.usage || ""} options={APPLIANCE_OPTS.usage} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:352:                <Lab text={t("الفولت / الجهد")}><Picker value={v.voltage || ""} options={APPLIANCE_OPTS.voltage} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:355:                <Lab text={t("بلد المنشأ")}><Picker value={v.origin || ""} options={APPLIANCE_OPTS.origin} placeholder="—" onChange={x => set({
mobile/src/components/JobsRealEstateBoxesMobile.js:47:        })} placeholder={t("مثال: مهندس برمجيات أول")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:61:        })} placeholder={t("مثال: 8,000 ر.س")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:65:        })} placeholder={t("مثال: 6,000 - 10,000 ر.س")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:109:      })} placeholder={t("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/components/JobsRealEstateBoxesMobile.js:119:      })} placeholder={t("اذكر المؤهلات والمتطلبات الإلزامية...")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/components/JobsRealEstateBoxesMobile.js:191:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:197:        })} keyboardType="numeric" placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/LocationPicker.js:217:                placeholder={t("ابحث...")}
mobile/src/components/LocationPicker.js:218:                placeholderTextColor={palette.textSubtle}
mobile/src/components/Skeleton.js:1:// Lightweight pulsing skeleton placeholders. No external libs — uses Animated.
mobile/src/components/Skeleton.js:34:// Listing card placeholder (matches ListingCard footprint roughly)
mobile/src/screens/AIAssistantScreen.js:154:                <TextInput value={input} onChangeText={setInput} placeholder={t("اكتب رسالتك...")} placeholderTextColor={colors.textMuted} style={styles.input} editable={!busy} multiline maxLength={2000} />
mobile/src/screens/AuctionsScreen.js:282:                        <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={String(minRequired)} placeholderTextColor={colors.textMuted} style={styles.bidInput} />
mobile/src/screens/AuthScreens.js:237:                    <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="mobile-login-email" />
mobile/src/screens/AuthScreens.js:238:                    <TextInput placeholder={t("كلمة المرور")} placeholderTextColor={theme.colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry style={styles.input} testID="mobile-login-password" />
mobile/src/screens/AuthScreens.js:336:                    <TextInput placeholder={t("الاسم الكامل")} placeholderTextColor={theme.colors.textMuted} value={form.name} onChangeText={v => setForm({
mobile/src/screens/AuthScreens.js:340:                    <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={form.email} onChangeText={v => setForm({
mobile/src/screens/AuthScreens.js:344:                    <TextInput placeholder={t("كلمة المرور")} placeholderTextColor={theme.colors.textMuted} value={form.password} onChangeText={v => setForm({
mobile/src/screens/AuthScreens.js:348:                    <TextInput placeholder={t("رقم الجوال") + ` (${phoneExampleFor(form.country_code)})`} placeholderTextColor={theme.colors.textMuted} value={form.phone} onChangeText={v => setForm({
mobile/src/screens/ChatScreen.js:274:                    <TextInput value={search} onChangeText={setSearch} placeholder={t("ابحث عن محادثة...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
mobile/src/screens/ChatScreen.js:999:                <TextInput value={input} onChangeText={handleInputChange} placeholder={t("رسالة...")} placeholderTextColor={colors.textMuted} style={s.composerInput} multiline maxLength={2000} onBlur={() => sendTyping(false)} />
mobile/src/screens/FlightsScreen.js:306:                        <TextInput value={q} onChangeText={setQ} placeholder={t("ابحث عن مدينة أو رمز (مثل RUH, DXB)")} placeholderTextColor={colors.textMuted} style={pStyles.input} autoFocus />
mobile/src/screens/ListingDetailScreen.js:419:                    <TextInput value={commentText} onChangeText={setCommentText} maxLength={1000} placeholder={t("اكتب تعليقًا عامًا...")} placeholderTextColor={theme.colors.textMuted} style={styles.commentInput} multiline />
mobile/src/screens/MapScreen.js:84:                        placeholder={t("ابحث في الخريطة...")}
mobile/src/screens/MapScreen.js:85:                        placeholderTextColor="#94A3B8"
mobile/src/screens/PasswordReset.js:45:                        <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="mobile-forgot-email" />
mobile/src/screens/PasswordReset.js:91:                <TextInput placeholder={t("رمز التحقق")} placeholderTextColor={theme.colors.textMuted} value={token} onChangeText={setToken} autoCapitalize="none" style={styles.input} testID="mobile-reset-token" />
mobile/src/screens/PasswordReset.js:92:                <TextInput placeholder={t("كلمة المرور الجديدة")} placeholderTextColor={theme.colors.textMuted} value={pw} onChangeText={setPw} secureTextEntry style={styles.input} testID="mobile-reset-password" />
mobile/src/screens/PostScreen.js:741:                        <TextInput value={q} onChangeText={setQ} placeholder={kind === "city" ? t("ابحث أو اختر من القائمة...") : t("ابحث أو اختر الحي...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
mobile/src/screens/PostScreen.js:1043:                <TextInput value={form.title} onChangeText={v => update("title", v)} placeholder={t("مثال: تويوتا كامري 2020 ممتازة")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/screens/PostScreen.js:1103:                <TextInput value={form.description} onChangeText={v => update("description", v)} placeholder={t("اوصف منتجك بالتفصيل...")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/screens/PostScreen.js:1173:                        <TextInput value={form.price} onChangeText={v => update("price", v.replace(/[^0-9.]/g, ""))} placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/screens/PostScreen.js:1199:      }))} placeholder={t("اختر...")} onChange={v => updateCF(f.key, v)} /> : f.type === "number" ? <TextInput value={String(form.custom_fields[f.key] || "")} onChangeText={v => updateCF(f.key, v)} keyboardType="numeric" placeholder={f.placeholder || ""} placeholderTextColor={colors.textMuted} style={s.input} /> : <TextInput value={form.custom_fields[f.key] || ""} onChangeText={v => updateCF(f.key, v)} keyboardType={f.type === "url" ? "url" : "default"} placeholder={f.type === "date" ? "YYYY-MM-DD" : (f.placeholder || "")} placeholderTextColor={colors.textMuted} style={s.input} />}
mobile/src/screens/PostScreen.js:1334:                        placeholder={t("مثال: 5xxxxxxxx (بدون كود الدولة)")}
mobile/src/screens/PostScreen.js:1335:                        placeholderTextColor={colors.textMuted}
mobile/src/screens/PostScreen.js:1456:  placeholder,
mobile/src/screens/PostScreen.js:1465:                <Text style={value ? s.inputText : s.inputPh}>{sel?.label || placeholder}</Text>
mobile/src/screens/PostScreen.js:1470:                        <Text style={s.modalTitle}>{placeholder}</Text>
mobile/src/screens/PostScreen.js:1514:                        <TextInput value={q} onChangeText={setQ} placeholder={t("ابحث...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
mobile/src/screens/SearchScreen.js:317:        }} onSubmitEditing={() => runSearch()} placeholder={t("ابحث عن أي شيء...")} placeholderTextColor={colors.textMuted} style={s.searchInput} autoFocus={!initialQ} returnKeyType="search" />
mobile/src/screens/SearchScreen.js:509:            })} placeholder={t("من")} placeholderTextColor={colors.textMuted} keyboardType="numeric" style={s.priceInput} />
mobile/src/screens/SearchScreen.js:514:            })} placeholder={t("إلى")} placeholderTextColor={colors.textMuted} keyboardType="numeric" style={s.priceInput} />
mobile/src/screens/SellerProfile.js:190:                        <TextInput value={comment} onChangeText={setComment} placeholder={t("اكتب تعليقك (اختياري)")} placeholderTextColor={theme.colors.textMuted} multiline style={s.input} testID="mobile-rating-comment" />
mobile/src/screens/OffersScreen.js:53:    <Modal visible={!!counter} transparent animationType="fade" onRequestClose={() => setCounter(null)}><View style={s.modalBg}><View style={[s.modal, { backgroundColor: palette.surface }]}><Text style={[s.modalTitle, { color: palette.text }]}>{t("العرض المضاد")}</Text><TextInput value={counterAmount} onChangeText={setCounterAmount} keyboardType="decimal-pad" placeholder={t("قيمة العرض")} placeholderTextColor={palette.textMuted} style={[s.input, { color: palette.text, borderColor: palette.border }]} /><View style={s.modalActions}><TouchableOpacity onPress={() => setCounter(null)} style={[s.modalBtn, { backgroundColor: palette.surfaceElevated }]}><Text style={{ color: palette.text, fontWeight: "800" }}>{t("إلغاء")}</Text></TouchableOpacity><TouchableOpacity onPress={() => counterAmount && decide(counter, "counter", counterAmount)} style={[s.modalBtn, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryFg, fontWeight: "800" }}>{t("إرسال")}</Text></TouchableOpacity></View></View></View></Modal>
mobile/src/screens/WorkflowScreens.js:8:function Field({ value, onChangeText, placeholder, multiline = false, keyboardType }) {
mobile/src/screens/WorkflowScreens.js:10:  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.muted} keyboardType={keyboardType} multiline={multiline} style={[s.field, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }, multiline && s.multiline]} />;
mobile/src/screens/WorkflowScreens.js:27:  return <SafeAreaView style={[s.root, { backgroundColor: palette.bg }]}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><FlatList data={rows} keyExtractor={(x) => String(x.id)} refreshing={loading} onRefresh={load} contentContainerStyle={s.content} ListHeaderComponent={<View><Text style={[s.title, { color: palette.text }]}>{t(buy ? "طلبات الشراء" : "الدعم والمساعدة")}</Text><Text style={[s.caption, { color: palette.muted }]}>{t(buy ? "اطلب منتجًا أو خدمة في الدولة المختارة" : "أنشئ تذكرة وتابع حالتها")}</Text>{buy ? <><Field value={form.title} onChangeText={(v) => set("title", v)} placeholder={t("عنوان الطلب")} /><Field value={form.category} onChangeText={(v) => set("category", v)} placeholder={t("الفئة")} /><Field value={form.city} onChangeText={(v) => set("city", v)} placeholder={t("المدينة")} /><View style={s.row}><Field value={form.budget_min} onChangeText={(v) => set("budget_min", v)} placeholder={t("الميزانية من")} keyboardType="numeric" /><Field value={form.budget_max} onChangeText={(v) => set("budget_max", v)} placeholder={t("الميزانية إلى")} keyboardType="numeric" /></View><Field value={form.description} onChangeText={(v) => set("description", v)} placeholder={t("وصف الطلب")} multiline /></> : <><Field value={form.subject} onChangeText={(v) => set("subject", v)} placeholder={t("موضوع التذكرة")} /><Field value={form.message} onChangeText={(v) => set("message", v)} placeholder={t("اكتب رسالتك")} multiline /></>}<TouchableOpacity disabled={busy} onPress={submit} style={[s.button, { backgroundColor: palette.primary }]}><Text style={s.buttonText}>{busy ? t("جاري الحفظ...") : t(buy ? "نشر طلب الشراء" : "إرسال التذكرة")}</Text></TouchableOpacity>{notice ? <Text style={[s.notice, { color: palette.text }]}>{notice}</Text> : null}<Text style={[s.section, { color: palette.text }]}>{t("السجلات السابقة")}</Text></View>} renderItem={({ item }) => <View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={s.cardHeader}><Text style={[s.cardTitle, { color: palette.text }]}>{item.title || item.subject}</Text><Text style={[s.status, { color: palette.primary }]}>{item.status}</Text></View><Text style={[s.cardBody, { color: palette.muted }]}>{item.description || item.message}</Text></View>} ListEmptyComponent={!loading ? <Text style={[s.empty, { color: palette.muted }]}>{t("لا توجد بيانات بعد")}</Text> : <ActivityIndicator color={palette.primary} />} /></KeyboardAvoidingView></SafeAreaView>;
