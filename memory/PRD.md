# PRD — Haraj+ Platform (Native + Web + Backend)

## Original Problem Statement
Native rebuild of Mobile App (Expo) to reach 100% feature/UI parity with Web. New requirement: a production-grade, multi-language, IP-aware location architecture (4 levels for Egypt, 3 levels for Gulf countries) replacing all hard-coded city/district pickers across Web and Mobile.

## Locations Architecture — Phases A + B (Egypt + UI) — ✅ COMPLETE
**Date completed:** 2026-02

### Phase A — Database (Egypt)
- Single `locations` MongoDB collection, keyed by Geonames ID (`_id`).
- 7-language `names` map: `ar / en / fr / ur / hi / bn / pa` with automatic English fallback.
- 4-level Egypt hierarchy (محافظة → مركز → قسم/حي → قرية):
  - `adm1: 27` | `adm2: 138` | `adm3: 468` | `city: 11,614` → **12,247 docs total**, 11 orphans (0.09%).
- Indexes: `(country, level)`, `parent_id`, `(country, name)`.

### Phase B — Backend caching + UI integration (Egypt-only as per user directive)
- **In-memory TTL cache** wrapping `/locations/children`, `/get/{id}`, `/path/{id}`.
  - TTL = 5 min, hard ceiling 4096 entries, auto-busted on `admin/import`.
  - Verified: cold call 234ms → warm call 142ms (most of which is network — backend itself ~5ms warm).
  - Stats endpoint: `GET /api/locations/cache/stats`.
- **Web LocationPicker** (`/app/frontend/src/components/LocationPicker.jsx`)
  - Reactively re-fetches on `lang` change + on parent selection.
  - Per-level inline search box.
  - Integrated into:
    - `pages/PostListing.js` (Create Ad → step 4 location section, replaces two `<CitySelect>` blocks).
    - `pages/SearchAndMap.js` (Search filter panel, with “Clear location filter” button).
- **Mobile LocationPicker** (`/app/mobile/src/components/LocationPicker.js`)
  - Same cascading + lang reactivity (uses `useI18n`).
  - Integrated into:
    - `screens/PostScreen.js` (Step 2, replaces old `City + District` modal fields).
    - `screens/SearchScreen.js` (Filters modal, replaces hardcoded city tag list).
- Both apps mirror the new structured `form.location` object back to the legacy `form.city` / `form.district` strings so the backend listing payload stays compatible without server changes.

### API endpoints
- `GET /api/locations/detect-country`  — IP→country (ip-api → ipapi → ipinfo).
- `GET /api/locations/children?parent_id=&country=&level=&q=&lang=` — cascading dropdown.
- `GET /api/locations/get/{id}?lang=` — single localised record.
- `GET /api/locations/path/{id}?lang=` — breadcrumb.
- `GET /api/locations/cache/stats` — cache visibility.
- `POST /api/locations/admin/import?country=XX` — admin re-seed.

### Verification logs (Phase B)
```
[seed] inserted 12247 rows
[cache] entries=9 max=4096 ttl=300
[lang switch] Cairo gov → ar=محافظة القاهرة | en=Cairo Governorate | fr=Le Caire |
                          ur=صوبہ قاہرہ | hi=क़ाहिरा मुहाफ़ज़ाह |
                          bn=কায়রো | pa=ਕਾਹਿਰਾ
[mobile bundle] expo export → web bundle 4.78 MB, 3046 modules, 0 errors
[lint] backend/locations.py ✓ | frontend/LocationPicker.jsx ✓ |
       mobile/PostScreen.js ✓ | mobile/SearchScreen.js ✓ |
       frontend/PostListing.js ✓ | frontend/SearchAndMap.js ✓
```

## Pending
- **P0 (next, waiting on user):** Gulf country GeoNames files (SA / AE / KW / QA / BH / OM). Once provided → import via `POST /api/locations/admin/import?country=XX`.

## Backlog (P2)
- AR Try-On (fashion/glasses)
- Escrow Payments (Stripe/PayPal) + Wallet Topup
- Live Voice/Video Calls (WebRTC)
- Verified Seller Badge (Blockchain reviews)

## Constraints
- 🚫 No `testing_agent`, no screenshots — manual verification only (curl, python -c, lint, `npx expo export`).
- 🚫 No refactor of `server.py` monolith.
- 🗣 Communication strictly in Arabic.
