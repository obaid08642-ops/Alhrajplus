# الحراج بلس (Haraj Plus) — Product Requirements Document

## 📝 Original Problem Statement
Build a Saudi/Gulf classifieds marketplace ("الحراج بلس") that surpasses Haraj.com in design, speed, security, and AI features. Multi-country (SA/AE/KW/QA/BH/OM), 5+ languages, real-time chat, AI-powered search, all categories with custom fields per category, admin panel with theme customization, 360° viewer, ads management, and more.

## 🏗️ Architecture
- **Frontend**: React 19 (CRA + craco) + Tailwind CSS, RTL-first
- **Backend**: FastAPI + Motor (async MongoDB) + JWT (httpOnly cookies)
- **Database**: MongoDB (`haraj_plus_db`)
- **Storage**: Cloudinary (signed uploads)
- **Maps**: Leaflet + OpenStreetMap (no API key)
- **i18n**: Custom context (5 languages)

## 👥 User Personas
1. **Buyer**: Browses, searches, saves favorites, chats sellers, calls/WhatsApps
2. **Seller (Individual)**: Posts ads with category-specific fields, manages own listings
3. **Seller (Business/معرض)**: Same as individual + verified badge
4. **Job Seeker / Service Provider**: Special category fields (experience, salary, skills, schedule)
5. **Admin**: Moderates, bans, verifies, manages ads/theme/reports

## ✅ Implemented (Session 2 - Feb 2026 — Major Feature Push)
### 🆕 New Features
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
