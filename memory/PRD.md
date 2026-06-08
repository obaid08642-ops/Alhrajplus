# PRD — Haraj+ Platform (Native + Web + Backend)

## Original Problem Statement
Native rebuild of Mobile App (Expo) to reach 100% feature/UI parity with Web. New requirement: a production-grade, multi-language, IP-aware location architecture (4 levels for Egypt, 3 levels for Gulf countries) replacing all hard-coded city/district pickers across Web and Mobile.

## Locations Architecture — Phases A + B + C (Egypt complete) — ✅ DONE

**Date completed:** 2026-02

### Phase A — Database (Egypt)
- 4-level Egypt hierarchy seeded into `locations` collection:
  - `adm1: 27` | `adm2: 138` | `adm3: 468` | `city: 11,614` → **12,247 docs total**.
- 7-language `names` map (`ar/en/fr/ur/hi/bn/pa`) with English fallback.
- 9,469 records with REAL Arabic translation (77 %).
- Indexes on `(country, level)`, `parent_id`, `(country, name)`.

### Phase B — Cache + UI integration
- **In-memory TTL cache** (5 min, 4096 max entries) on read endpoints; auto-busted on import.
- **`/app/frontend/src/components/LocationPicker.jsx`** wired into `pages/PostListing.js` + `pages/SearchAndMap.js`.
- **`/app/mobile/src/components/LocationPicker.js`** wired into `screens/PostScreen.js` + `screens/SearchScreen.js`.
- Legacy `form.city` / `form.district` strings still mirrored from the structured `form.location` object so the backend listing payload stays compatible.

### Phase C — Bug fixes (this round)
- 🐛 **FIXED:** Empty dropdowns when user country ≠ EG (the only seeded country).
  - Both pickers now call `/api/locations/countries` on mount and **auto-fallback to EG** when the requested country is not in the supported list. A small amber notice is shown to the user explaining the fallback.
- 🐛 **FIXED:** "Use My Location" no longer wired to the new structured picker.
  - Added new backend endpoint **`GET /api/locations/locate?lat=&lng=&country=&lang=`** that does a haversine-bounded reverse-geocode against the Geonames data and returns the full `{adm1, adm2, adm3, city}` selection path in one call. Auto-falls back to EG when the requested country has no data.
  - Mobile `useMyLocation()` (PostScreen) now calls `/locations/locate` first, populates `form.location` with the full cascading selection, falls back to the legacy `/geo/reverse` if `/locate` fails.
  - Web `geoLocateAndFill()` (PostListing) mirrors the same primary→fallback chain.

### API endpoints
- `GET /api/locations/detect-country` — IP → country.
- `GET /api/locations/countries` — countries with imported data (used for picker auto-fallback).
- `GET /api/locations/children?parent_id=&country=&level=&q=&lang=` — cascading dropdown.
- `GET /api/locations/get/{id}?lang=` — single record.
- `GET /api/locations/path/{id}?lang=` — breadcrumb.
- `GET /api/locations/locate?lat=&lng=&country=&lang=` — **NEW** reverse-geocode → full path.
- `GET /api/locations/cache/stats` — cache visibility.
- `POST /api/locations/admin/import?country=XX` — admin re-seed.

### Verification logs (Phase C)
```
[cache] entries=9 max=4096 ttl=300
[countries-with-data] [{"code":"EG","name":"EG"}]
[adm1] count=27   first=['محافظة القاهرة','لمحافظة د لڭيزة','محافظة الشرقية']
[children of Cairo Gov] count=198   first=[('Madinat an Nasr','adm3'),...]
[locate 30.04,31.24] adm1=محافظة القاهرة | adm3=مدينة نصر | city=`Abdin
[locate 24.71,46.67 SA→EG fallback] adm1=محافظة البحر الأحمر | adm3=غردقه | city=Hala'ib
[expo export --platform web] 3046 modules, 4.79 MB JS, 0 errors
[lint] all 6 touched files clean
```

## Pending
- All location work complete for Egypt + 6 Gulf countries. **Awaiting user production validation on Render.**

## Locations Architecture — Phase D (Gulf Expansion) — ✅ DONE (2026-02)

- **Data ingested from `/app/backend/data/gulf_master.txt`** via new `master_gulf_parser.py`:
  - 🇸🇦 SA: 5 regions, 28 cities, 812 districts (3 levels: Region → City → District)
  - 🇦🇪 AE: 7 emirates, 36 cities (2 levels: Emirate → City)
  - 🇰🇼 KW: 6 governorates, 34 cities (2 levels: Governorate → City)
  - 🇶🇦 QA: 7 municipalities, 20 cities (2 levels: Municipality → City)
  - 🇧🇭 BH: 4 governorates, 21 cities (2 levels: Governorate → City)
  - 🇴🇲 OM: 6 governorates, 30 cities (2 levels: Governorate → City)
  - **Total Gulf rows: 1016** | EG untouched at 3507 rows.
- **Auto-seed** added in `server.py` (`_auto_seed_gulf_locations()`): only wipes 6 Gulf countries (NEVER EG) and re-seeds when row counts drift from the parser output.
- **Dynamic cascading dropdowns** in `LocationPicker.jsx` (web) + `LocationPicker.js` (mobile):
  - SA: 3 dropdowns (المنطقة → المدينة → الحي).
  - AE: الإمارة → المدينة.
  - QA: البلدية → المدينة.
  - KW / BH / OM: المحافظة → المدينة.
  - EG: unchanged (المحافظة → المدينة/المركز → الحي/القسم → القرية/المنطقة).
- No country selector inside the picker — driven by the active country context (from `/api/locations/detect-country` or app-wide setting).
- **Cleanup:** removed hardcoded preview URL from mobile picker; added missing `api` import (pre-existing bug).

## Backlog (P2)
- AR Try-On (fashion/glasses), Escrow Payments + Wallet Topup, WebRTC voice/video, Blockchain Verified Seller.

## Constraints
- 🚫 No `testing_agent`, no screenshots — manual verification only (curl, `npx expo export`, lint).
- 🚫 No refactor of `server.py` monolith.
- 🗣 Communication strictly in Arabic.
