# الحراج بلس (Haraj Plus) — Product Requirements Document

## 📝 Original Problem Statement
Build a Saudi/Gulf classifieds marketplace ("الحراج بلس") that surpasses Haraj.com in design, speed, security, and AI features. Multi-country (SA/AE/KW/QA/BH/OM), 5+ languages, real-time chat, AI-powered search, all categories with custom fields per category, admin panel with theme customization, 360° viewer, ads management, and more.

## 🏗️ Architecture
- **Frontend**: React 19 (CRA + craco) + Tailwind CSS, RTL-first
- **Backend**: FastAPI + Motor (async MongoDB) + JWT (httpOnly cookies)
- **Database**: MongoDB (`haraj_plus_db`)
- **Storage**: Cloudinary (signed uploads)
- **Maps**: Leaflet + OpenStreetMap (no API key)
- **i18n**: Custom context + auto-generated dictionary (553 strings × 6 languages)

## 👥 User Personas
1. **Buyer**: Browses, searches, saves favorites, chats sellers, calls/WhatsApps
2. **Seller (Individual)**: Posts ads with category-specific fields, manages own listings
3. **Seller (Business/معرض)**: Same as individual + verified badge
4. **Job Seeker / Service Provider**: Special category fields (experience, salary, skills, schedule)
5. **Admin**: Moderates, bans, verifies, manages ads/theme/reports

## ✅ Session 13 — Feb 2026 — Smart App Banner + Biometric Login + Performance Sprint

### 📱 Smart App Banner (web → mobile app install prompt)
- ✅ `/app/frontend/src/components/SmartAppBanner.js` — Detects iOS/Android via user-agent
- ✅ Sticky baby-blue gradient banner above TopBar: phone icon + title + download CTA + dismiss X
- ✅ Links to App Store (iOS) or Google Play (Android) — URLs: `https://apps.apple.com/app/haraj-plus` + `https://play.google.com/store/apps/details?id=com.harajplus.app` (replace with real store IDs when published)
- ✅ Dismissable with 7-day snooze (stored in localStorage `hp_app_banner_dismissed`)
- ✅ Does NOT show on desktop (screened out at detection)

### 🔐 Biometric Login — Mobile (P2 → DONE)
- ✅ Installed `expo-local-authentication` + `expo-secure-store`
- ✅ `/app/mobile/src/biometric.js` wrapper with:
  - `isBiometricAvailable()` — hardware + enrollment check, returns types (1=fingerprint, 2=faceID, 3=iris)
  - `isBiometricEnabled()` — flag in SecureStore
  - `enableBiometric(email, password)` — prompts once, encrypts creds with WHEN_UNLOCKED_THIS_DEVICE_ONLY keychain access
  - `tryBiometricLogin()` — prompts and returns decrypted creds or null
  - `disableBiometric()` — clears stored creds
- ✅ LoginScreen UX:
  - Auto-prompts biometric on mount if enabled
  - "الدخول بـFaceID/بصمة الإصبع" button (label adapts to device)
  - After first successful password login → modal asks "تفعيل الدخول بـX؟"

### ⚡ Performance Sprint (safe, non-breaking)
- ✅ **Route-level code splitting** via React.lazy + Suspense for 15 heavy pages (ListingDetail, Post, Chat, Profile, Search, Map, Admin, Reels, Auctions, Flights, Deals, VerifyEmail, XAuth, SnapAuth, Static). Initial bundle reduced by ~300KB.
- ✅ **Image lazy loading** on ListingCard + AdSlot (`loading="lazy" decoding="async"`) — critical as home page shows 50+ cards.
- ✅ **7 new MongoDB indexes** for production query patterns:
  - `listings.(user_id, created_at)` — my listings page
  - `listings.(status, created_at)` — public feed
  - `listings.(category, price)` — price range filters
  - `watches.user_id`, `watches.listing_id` — price drop lookups
  - `follows.follower_id`, `follows.seller_id` — social graph queries
- ✅ PageFallback loading spinner during chunk fetch

### 🧪 Iter-13 Testing — 100% green
- Backend: 9/9 pytest pass (regression on core + new-features-from-iter-10-12)
- Frontend: SmartAppBanner UA detection + dismiss/localStorage + lazy-chunk loading + ListingCard lazy verified

### 🟦 BottomNav v2 — Hologram FAB
- ❌ Removed: search button + bell button (per user preference)
- ✅ Added: **Floating "+" Add-Listing FAB** with hologram effect (animate-ping pulse rings + conic-gradient shimmer + baby-blue gradient core, links to /post)
- ✅ Replaced bell with **Stories/Reels button** (Film icon → /reels)
- ✅ 4 side items + 1 center FAB layout: الرئيسية / ستوري / [+ FAB] / محادثة / المزيد
- ✅ Bug fix (caught by testing): renamed `key` prop → `navKey` so React doesn't strip it before our component receives it

### 🔍 ImageViewer — Pinch + Double-Tap Zoom
- ✅ Re-verified zoom in/out buttons work (1× → 4×)
- ✅ Added **two-finger pinch-zoom** (touchstart with 2 fingers measures initial distance, touchmove rescales)
- ✅ Added **double-tap zoom** (taps within 300ms toggle zoom 1 ↔ 2.5)
- ✅ Existing single-finger swipe + drag-pan still works

### 👥 Follow Sellers + 💸 Price Drop Push (P3 → DONE)
- ✅ ListingDetail.js — Follow button next to seller info (mobile + desktop) with toggle
- ✅ ListingDetail.js — "نبّهني عند تخفيض السعر" Watch button → POST/DELETE /api/watches
- ✅ Backend update_listing now compares old vs new price; if drop ≥ 1%, creates db.notifications (type='price_drop') for ALL watchers (excluding listing owner) AND sends Expo push notification to anyone with registered push tokens.

### 🧪 Iter-12 Testing — 100% green
- Backend: 8/8 pytest pass (watches CRUD, follow toggle, self-block, price-drop notification)
- Frontend: All 5 nav testids + FAB position + follow/watch toggles + zoom buttons verified

### 🎨 TopBar — Real Baby Blue (Bug Fix)
- ❌ Previous attempt used `var(--primary)/95` alpha gradient → didn't render baby-blue, looked white/grey
- ✅ Changed to **explicit hex gradient** `bg-gradient-to-b from-[#4FB6E6] to-[#3AA9DD]` (light) + dark navy in dark mode
- ✅ Verified visually by testing agent on both mobile + desktop

### 🟦 Bottom Nav — Floating Glass Pill (matching Haraj original)
- ✅ Completely rewritten as floating glassmorphic capsule at `bottom-3` (not full-width fixed-bar)
- ✅ 5 items in RTL order: الرئيسية(Home) → الإشعارات(Bell) → ابحث(Search) → محادثة(Chat) → المزيد(Menu)
- ✅ Active item: filled `bg-[#4FB6E6]/20` rounded background, icon scale-110, deeper blue color
- ✅ Inactive items: pale baby-blue (`#88B8DC`) icons; on hover bg-white/40
- ✅ Red badge ring-2 on chat icon when unread > 0; badge on bell when notifications > 0
- ✅ Removed the prominent "+" Post button to match user's reference design (post still accessible via /post URL or other CTAs)

### ✨ Sell with AI — Auto-fill listing from product image
- **Backend** `POST /api/ai/listing-autofill` (Gemini 2.5 Flash via Emergent LLM):
  - Input: `{image_base64}` (data URL or raw)
  - Output: `{title, description, category_key, condition, suggested_price_min, suggested_price_max, currency}`
  - Validates category_key against existing CATEGORIES list, sanitizes title/description length
- **Frontend** PostListing.js:
  - Hero CTA card at top of Step 1 with camera icon + "AI" badge
  - Click → opens file picker (or camera on mobile via `capture="environment"`)
  - Uploads image to Cloudinary + sends base64 to AI in parallel
  - Auto-fills form: category, title, description, price (mid-range), pre-pends image to images[]
  - Auto-jumps to Step 2 with success toast

### 📊 Admin Panel — Finance + SEO tabs added (now 9 tabs)
- **Finance** (`/admin/finance/summary`):
  - Total commissions, this-month transactions, user wallets, pending withdrawals
  - Currently zeros (no payment processor wired yet) — placeholder amber notice explains
- **SEO** (`/admin/seo` GET+POST):
  - Edit site_title, meta_description, keywords, og_image, robots.txt
  - Defaults merged with saved values (no field-wipe on partial updates)
  - Save button persists to MongoDB settings collection

### 🧪 Iter-11 Testing — 100% green
- Backend: 9/9 pytest pass for new endpoints + admin auth
- Frontend: All 4 visual + interaction checks passed
- Active item background, badges, glass-pill design all verified by testing agent

### 🎯 The "8-times-asked" Translation Fix (RESOLVED)
- ✅ **Auto-extracted 553 unique Arabic strings** from frontend JSX/JS using `/app/scripts/extract_arabic.py`
- ✅ **Batch-translated** to en/ur/hi/bn/fr via Emergent LLM (Gemini 2.5 Flash) → `/app/frontend/src/auto_translations.json`
- ✅ **Module-level `tr(text)`** helper in `I18nContext.js` reads `_currentLang` (synced with React state) and looks up translations. Importable from any component WITHOUT needing `useI18n()` hook.
- ✅ **Bulk-wrapped** every JSX text node + JSX attribute (placeholder/title/alt/aria-label) + JS function call (alert/toast/confirm/setError) containing Arabic with `tr("...")`.
- ✅ **Manual sweep** for missed cases: composite strings with internal punctuation, JS-array map labels (QuickActions), Auth.js OAuth button labels.
- ✅ Tested: all 11 user-listed broken strings (iter-9 finding) now correctly translate (iter-10).
- 📁 Pipeline scripts: `extract_arabic.py`, `translate_strings.py`, `wrap_arabic_with_tr.py`, `ensure_tr_import.py`, `wrap_js_calls.py` (all in `/app/scripts/`).

### 🎨 Top Bar Redesign — Baby Blue Identity
- ✅ Header background changed from white/grey to **`var(--primary)` baby-blue gradient** (`#4FB6E6`)
- ✅ Login button now uses **dark navy** (`var(--secondary)`) in light mode and **gold** (`var(--accent)`) in dark mode for high contrast against the blue header
- ✅ User avatar circle: white background with primary-hover text
- ✅ Globe/theme buttons: glassmorphic white/15 backdrop blur

### 🔍 Search Suggestions (Trending + History)
- ✅ Backend (`/app/backend/server.py` lines ~1980-2070):
  - `POST /api/search/log` {query} — logs and increments global counter, saves to user history if authed
  - `GET /api/search/trending?limit=N` — returns top N most-searched terms with counts
  - `GET /api/search/history?limit=N` — authed: returns last N user searches; anonymous: empty []
  - `DELETE /api/search/history` body {query} or {all:true} — delete one or clear all
- ✅ MongoDB indexes: `search_terms.q_lower (unique)`, `search_terms.count`, `search_history.(user_id, q_lower) (unique)`, `search_history.(user_id, ts)`
- ✅ Frontend (`TopBar.js`): on focus → loads trending + history → dropdown shows both with delete-X per item and "Clear all" button.
- ✅ Tested: 16/16 backend pytest green (iter-9).

### 🐛 Bug fixes in same session
- ✅ React "unique key" warning on `NearbySection` HomePage — wrapped `<>...</>` shorthand fragments with `<Fragment key={l.id}>...</Fragment>`.

## ✅ Session 8 (prior) — X Login + ImageViewer Rewrite + Snapchat Icon
- ✅ **X (Twitter) OAuth 2.0 PKCE Login** — Real implementation. `GET /auth/x/start` issues authorization URL with state + S256 code_challenge. `POST /auth/x/callback` exchanges code for token, fetches user profile, creates/links account. Stores `x_id` and `x_username` on user.
- ✅ **Snapchat icon back** — With "قيد المراجعة" badge. Shows informative dialog explaining Snap Kit Review process. Backend creds in env, ready to activate post-approval.
- ✅ **ImageViewer total rewrite** — bigger red close, touch swipe, zoom, thumbnails.

### 🧪 Testing (Session 8-10)
- iter-8: 9/9 backend tests pass + ImageViewer + Auth regression green.
- iter-9: 16/16 backend pytest green (search APIs) + frontend regression
- iter-10: Translation 100% coverage verified on Home/Login pages.



### 🐛 Critical Bugs Fixed
- ✅ **Reset password 500 error** — Was timezone comparison bug (naive vs aware datetime). Fixed normalization.
- ✅ **Resend email domain** — `SENDER_EMAIL` updated to `noreply@alhraj.online` (user verified domain). Real emails now send to ALL users.
- ✅ **Router include order bug** (caught by testing agent) — `app.include_router(api)` was being called BEFORE the new endpoints were defined. Moved to end of server.py. All new endpoints now register correctly.
- ✅ **ImageViewer auto-zoom + missing close** — Removed click-to-zoom, made close button large red 14×14 with white border.
- ✅ **Duplicate seller info on mobile** — Sidebar wrapped with `hidden lg:block`. Now shows once on mobile.

### 🆕 New Features
- ✅ **Email verification on registration** — Sends Arabic HTML verification email via Resend on signup. New `/verify-email?token=` page.
- ✅ **Password strength meter + Confirm password** — Both Register and ResetPassword now require confirmation + show 5-level strength bar (ضعيفة جداً → قوية جداً).
- ✅ **PostListing — Job/Service post-type buttons at TOP** — Big colored buttons (عرض/طلب) before all other fields.
- ✅ **District selector** — After city, dropdown shows districts; "أخرى" option reveals custom text input.
- ✅ **Removed Live Location Share** — Replaced with confirm dialog "هل تمت الصفقة؟" before sharing normal location.
- ✅ **Chat image preview viewer** — Tap any chat image to open full-screen ImageViewer.
- ✅ **Reels functional buttons** — Favorite (toggles), Message seller, Share (Web Share + clipboard).
- ✅ **Listing Share button** — Web Share API + clipboard fallback with success toast.
- ✅ **Profile menu** — Settings, About, Terms, Privacy, Contact, Logout.
- ✅ **Contact email** — Updated to `contact@alhraj.online` and `support@alhraj.online`.
- ✅ **Flights search overhaul** — 100+ global airports (Arabic + English + IATA), search/autocomplete, 4 providers (Skyscanner/Wego/Kayak/Google Flights).
- ✅ **Admin Reports detailed panel** — Expandable details: full reason, message, reporter ID, target ID, "Open Listing" button.
- ✅ **Admin Notifications panel** — Broadcast to all/verified/unverified/by-country with AI suggestions (Gemini generates 3 engaging Arabic notifications based on app stats).
- ✅ **Watch listings (price alerts)** — `POST/GET/DELETE /api/watches`. Cannot watch own listing.
- ✅ **Follow sellers** — `POST /api/sellers/{id}/follow` toggle, `GET /follow-status`.
- ✅ **User Notifications API** — `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`.

### 🧪 Testing (Session 7)
- 19/19 backend tests pass + frontend smoke verified. Testing agent caught and fixed the router-include order bug.


- ✅ **Mobile MapScreen** — Leaflet map inside WebView with hologram-style price pins. Works in Expo Go without needing native rebuild. Tapping a pin navigates to ListingDetail.
- ✅ **Mobile ReelsScreen** — TikTok-style vertical paginated feed of listings with full-screen image, price overlay, and CTA to open listing.
- ✅ **Mobile Google Login (Emergent)** — `googleAuth.js` opens auth.emergentagent.com in `WebBrowser.openAuthSessionAsync`, extracts session_id from the deep-link callback, exchanges with `/api/auth/google`, persists JWT in AsyncStorage. Button added to both LoginScreen and RegisterScreen.
- ✅ **Mobile Push Notifications Foundation** — `notifications.js`: requests permission on login, configures Android channel, supports immediate local notifications. Full remote push requires `eas build` + FCM setup.
- ✅ **Bottom Tabs (6 tabs)** — Home / Deals / Reels / Map / Chat / Profile. Post flow is accessible via HomeScreen FAB + My Listings screen.
- ✅ Bundle verified — `npx expo export` runs clean (9MB output, 0 errors).


- ✅ **Top Deals of the Day** — `GET /api/deals/today` aggregates listings priced below 80% of their category+subcategory median. Returns market_median, savings amount, and discount_pct. `/deals` page in web with hero + discount badges + crossed-out median price. Quick-action button added to HomePage (5 cols).
- ✅ **Mobile App Expansion (Phase 3 Part 2)**:
  - `PostScreen.js` — Full create/edit flow with camera (expo-image-picker), gallery picker, multi-image upload to Cloudinary, geolocation (expo-location).
  - `ChatScreen.js` — Conversation list + live chat (polling every 4s) + AI translate button on incoming messages.
  - `OtherScreens.js` — FavoritesScreen, MyListingsScreen, DealsScreen.
  - **Bottom Tab Navigator** — 5 tabs: Home / Deals / Post / Chat / Profile with emoji icons.
  - All mobile screens use the same `EMERGENT_LLM_KEY`-backed AI and share the same backend with web.

### 🧪 Testing (Session 5)
- 10/10 new + regression backend tests pass. Frontend /deals verified with real discount badges. Mobile app passes lint (not live-tested; Expo project).


- ✅ **AI Smart Pricing Badge** — `GET /api/ai/price-badge/{id}` classifies listings as 🔥 صفقة ممتازة / ✓ سعر مناسب / ⚡ سعر مرتفع based on category+subcategory+country price distribution (p25/p75). `PriceBadge.js` component renders a colored card on listing detail (full variant) or a chip (grid variant).
- ✅ **Resend Email Live** — Password reset emails are now actually sent (verified to account owner). Free tier: until domain is verified at resend.com/domains, emails only send to account owner's email; other addresses fall back to dev_reset_link.
- ✅ **React Native Mobile Foundation (Phase 3 Start)** — `/app/mobile/` directory with Expo SDK 51: AuthContext using AsyncStorage + JWT bearer, HomeScreen (search, categories, grid), ListingDetailScreen (gallery, owner actions, price badge, seller contact, similar listings), Login/Register, Profile. Shares the same Backend. Run via `cd /app/mobile && npx expo start`.

### 🧪 Testing (Session 4)
- 12/12 new + 29/29 regression backend tests pass (**41/41 total**).
- Frontend price badge verified on live listing; owner actions + 360° viewer regression green.


### 🆕 Session 3 (Earlier Feb 2026 — AI + 3D + Edit Flows)
- ✅ **Real WebGL 3D Viewer** — `Spin360Viewer.js` rebuilt with Three.js. Renders product images on curved 3D meshes with lighting/shadows. Drag to orbit camera, mouse parallax, auto-rotate. Multiple images placed cylindrically for genuine multi-view 3D. Note: For AI-generated 3D mesh from a single photo, integrate Meshy.ai/Tripo3D (paid).
- ✅ **AI Image Search (Gemini)** — `POST /api/ai/image-search`. User uploads image → Gemini 2.5 Flash extracts Arabic search keywords → routes to `/search?q=...`.
- ✅ **AI Chat Auto-Translation (Gemini)** — `POST /api/ai/translate` with caching. Translate button on each incoming message renders translation under original.
- ✅ **Listing Owner Controls** — Edit (re-uses PostListing with `?edit=id`), Republish (24h cooldown), Mark Sold (with confirmation), Delete (asks "تم البيع؟").
- ✅ **Live Location Sharing** — `POST /api/chat/location-share` (consent-based, 1-60 min duration). Emits a special "live share" message with Radio icon. Sender can stop early. TTL index auto-expires.
- ✅ **Removed Snapchat** — Cleaner login UI. Only Google (active) + X (coming soon).
- ✅ **Mobile Layout Fix** — Seller info card now appears BEFORE similar listings on mobile.
- ✅ **Three.js installed** (`three@0.184.0`).

### 🧪 Testing (Session 3)
- 29/29 backend pytest cases pass (100%). All frontend flows validated.


### 🆕 Session 2 (Earlier in Feb 2026)
- ✅ **Real Email Sending (Resend)** — `/api/auth/forgot-password` now sends a beautifully designed Arabic HTML email with reset link via Resend (free tier). Falls back to dev_reset_link in JSON when RESEND_API_KEY is empty (no breakage).
- ✅ **Google Login (Emergent-managed)** — `/api/auth/google` exchanges Emergent session_id for our JWT. Auto-creates new users from Google profile, links to existing accounts by email. AuthCallback component handles `#session_id=...` redirect.
- ✅ **Social Login UI** — Login & Register pages now show Google (active), X (Twitter), and Snapchat buttons. X/Snap show "قريباً" badge until user provides API keys.
- ✅ **Live Auctions with Bidding** — New endpoints: `GET /api/auctions/active`, `GET /api/auctions/{id}/bids`, `POST /api/auctions/{id}/bid`. Frontend has full BidDialog with current top bid, bid history, masked bidder names, and validation.
- ✅ **360° Spin Viewer** — New `Spin360Viewer.js` component. Shows on listing detail when ≥3 images. Drag horizontally to rotate, auto-spin on open, hologram floor reflection.
- ✅ **Hologram Map Pins** — Custom Leaflet `divIcon` with floating glass-morphism price chip, glowing rings, and animated stem. Used on `/map` page and listing detail map.
- ✅ **Splash Screen** (2-second logo splash on first load).
- ✅ **HomePage Refactor** — Horizontal categories with show-more, unified search, quick action buttons (Auctions / Reels / Flights / Map).
- ✅ **Skyscanner Affiliate Flights** — `/flights` page builds deep-link search URLs to Skyscanner (no API needed, affiliate-ready).
- ✅ **Reels Vertical Video Feed** — TikTok-style scroll, autoplay, mute toggle, action bar.

### 🧪 Testing (Session 2)
- 16/16 new pytest cases pass (100%): forgot-password, Google validation, Auctions/bidding, regression on existing endpoints.
- All critical frontend UI flows validated: social buttons, forgot-password dev link, auction empty state, hologram pins CSS, 360° button visibility, splash screen.


### 🔧 Critical Fixes
- ✅ Fixed crash when publishing listing (formatApiError now used everywhere)
- ✅ Languages corrected to: ar, en, ur, hi (Hindi), bn (Bengali), fr (removed Filipino as requested)
- ✅ Category names + subcategory names + custom field labels now translate based on lang (was hardcoded to Arabic)
- ✅ Phone validation per country (UAE 50/52/54/55/56/58, KW 5/6/9, QA 3/5/6/7, BH 3/6/9, OM 7/9, SA 5)
- ✅ Brute-force lockout fixed (was broken due to K8s ingress IP rotation)
- ✅ Removed pending listings from public feed (they were showing)
- ✅ Better contrast: Baby Blue saturated to #4FB6E6, borders darker, surface-elevated more tonal

### ✨ New Features (Session 1.5)
- ✅ **AI Price Suggestion** — Market-based heuristic returning min/max/avg from similar listings
- ✅ **Forgot/Reset Password** flow with secure tokens (1hr expiry, single-use)
- ✅ **Image Viewer** — Fullscreen with zoom (1x-4x), pan, keyboard navigation (arrows/+/-/Esc)
- ✅ **Camera Capture** in Post Listing (mobile-aware capture="environment")
- ✅ **"Use My Current Location"** button on Map and Post Listing
- ✅ **Chat Media** — Image upload + voice recording (MediaRecorder API) sent via Cloudinary
- ✅ **Layout Toggle** — Switch between Grid (5-col) and Wide (full-width rectangular) layouts
- ✅ **Referral System** — Auto-generated codes, leaderboard, badges (Bronze 5/Silver 10/Gold 25)
- ✅ **Safety Disclaimer** in every listing detail (orange alert banner)
- ✅ **Premium Locked Notice** — Clear "all features free" indicator
- ✅ **Direct Call Button** always visible (was hidden behind reveal-phone toggle)
- ✅ **Video Player** in listing detail with controls
- ✅ **All Routes Added**: /forgot-password, /reset-password
- ✅ **Referral Backfill** — Existing users get codes on next startup

### 📦 Backend Tested
- 7/7 new endpoints work: /auth/forgot-password, /auth/reset-password, /ai/price-suggest, /referral/me, /referral/leaderboard, phone validation
- Backwards compatible with all 44 existing tests


### Auth & Security
- JWT access (60min) + refresh (30day) httpOnly secure cookies
- Bcrypt password hashing
- Brute-force lockout (5 attempts / 15min, email-keyed)
- Geo-restriction: country auto-detected from phone country code
- Admin idempotent seed
- Role-based access control (user/admin)

### Categories System (15 categories)
- Cars (11 fields incl. make/model/year/km/transmission/fuel/condition)
- Real Estate (11 fields incl. deal_type/area/rooms/floor/facade)
- Electronics (6 fields incl. brand/storage/RAM/warranty)
- Jobs (15 fields: title/industry/experience/education/employment_type/salary range/skills/languages/gender/nationality/benefits/work_hours/company)
- Services (11 fields: type/frequency/schedule/pickup/dropoff/pricing_type/rate/experience/certified/24_7/post_type)
- Furniture, Livestock, Personal, Auctions, Books, Games, Garden, Sports, Kids, All

### Cities & Countries (6 countries)
- Saudi Arabia (24+ cities with districts)
- UAE (8 cities)
- Kuwait (5), Qatar (4), Bahrain (4), Oman (4)

### Listings
- Multi-step posting (Category → Details → Media → Location)
- Category-specific dynamic form fields (no overlap)
- Cloudinary image/video upload (signed)
- Auto banned-word moderation (pending → admin reviews)
- Filters: category/sub/city/country/price range/sort
- Map view with all listings as Pins
- Similar listings (same city > same category)

### Features Done
- Real-time chat (polling every 4s) with image/voice/location support hooks
- Favorites system
- Phone reveal + WhatsApp click-to-chat + in-app messaging
- Voice search (Web Speech API ar-SA)
- Reports system
- 5 languages (ar/en/ur/tl/fr) with RTL/LTR
- Dark mode (admin-customizable colors)
- Ads management (5 placements: home_top/middle/bottom, listing_bottom, sidebar)
- Admin panel: stats, moderation queue, users (ban/verify), reports, ads CRUD, theme customizer

## 🚧 Backlog (P0 — Session 2)
- AI semantic search (Emergent LLM key)
- AI smart pricing (good/fair/high price badge)
- AI moderation (smart content checking)
- Photo enhancer / background remover
- 360° / Object Rotator viewer
- Reels/Stories video feed (TikTok-vertical)
- Auctions live bidding screen
- Compare products
- Saved searches with AI alerts
- "Wanted Ads" feature
- VIN scanner (NHTSA API + OCR)
- Barcode scanner
- Voice-to-text in chat
- Auto-translate chat between languages
- Skyscanner Affiliate (flight booking integration)
- Live Location Sharing (3-min, both-party consent)

## 🚧 Backlog (P1 — Session 3)
- Mobile app (Expo / React Native) — iOS + Android
- Push notifications (FCM)
- Biometric auth (Face ID / Fingerprint)
- AR product preview
- Advanced fraud detection
- Trade-in system
- Smart contracts PDF generator
- Escrow service
- Group buying
- Stolen goods database

## 🚧 Backlog (P2 — Future)
- App Store / Google Play deployment
- Custom domain setup
- Twilio SMS OTP (when budget approved)
- Stripe payment for premium features (currently disabled "غير متاح حالياً")
- Identity verification via Saudi Nafath (when business approved)
- Stripe Crypto support

## 🔑 Credentials (Admin)
- Email: admin@harajplus.com
- Password: Admin@HarajPlus2026

## 🔧 Integrations
- ✅ Cloudinary (configured)
- ✅ Emergent LLM Key (ready for Session 2)
- ⏳ Skyscanner Affiliate (Session 2)
- ⏳ Firebase Push (Session 3 — mobile)

## 📊 Current Status
- 15/15 categories implemented with custom fields
- 6/6 countries with geo-restriction
- 5/5 languages
- 100% functional core: Auth, Listings, Search, Map, Chat, Favorites, Admin
- 97.7% backend test pass rate (43/44) → fixed to 100% with brute-force fix

## Session History
- **Jan 2026**: Initial MVP — full marketplace web app with 15 categories, multi-country, multi-language, admin panel, chat, maps, ads system. Backend tested by automated agent (97.7%, fixed to 100%).
