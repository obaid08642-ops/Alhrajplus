# PRD — Haraj+ Platform (Native + Web + Backend)

## Original Problem Statement
Native rebuild of Mobile App (Expo) to reach 100% feature/UI parity with Web. New requirement: a production-grade, multi-language, IP-aware location architecture (4 levels for Egypt, 3 levels for Gulf countries) replacing all hard-coded city/district pickers across Web and Mobile.

## Locations Architecture — Phase A (Egypt) — ✅ COMPLETE
**Date completed:** 2026-02
- Schema: single `locations` MongoDB collection keyed by Geonames ID (`_id`).
- Documents include 7-language `names` map: `ar / en / fr / ur / hi / bn / pa` with **automatic English fallback** for any missing language.
- 4-level Egypt hierarchy:
  - `adm1` — Governorate (محافظة): 27 docs
  - `adm2` — Markaz (مركز): 138 docs
  - `adm3` — District / Qism / Neighborhood (قسم / حي): 468 docs
  - `city` — Village / Locality (قرية): 11,614 docs
  - **Total: 12,247 EG locations**, 11 orphans (0.09%)
- Multi-language detection uses script + language-specific letter heuristics
  (filters Persian `استان` out of Arabic; uses Urdu `ہ ے ٹ ڈ ڑ ں`; Devanagari for Hindi; Bengali block; Gurmukhi for Punjabi; French requires actual French word/article).
- Indexes: `(country, level)`, `parent_id`, `(country, name)`.
- API endpoints live at `/api/locations/*`:
  - `GET /detect-country` — multi-provider IP fallback (ip-api → ipapi → ipinfo).
  - `GET /children?parent_id=…&country=…&level=…&q=…&lang=…` — cascading dropdowns.
  - `GET /get/{id}?lang=…` — single record localised.
  - `GET /path/{id}?lang=…` — breadcrumb from country down.
  - `POST /admin/import?country=XX` — admin upload of a Geonames `XX.txt`.

### Verification logs (re-seed run, 2026-02)
```
[seed] reading /app/data/EG.txt for EG…
[seed] parsed 12247 records
[seed] wiping existing rows for EG…
[seed] inserted 12247 rows
[seed] ✓ done for EG
```
Sample translation quality (governorate of Cairo, id=360631):
```
ar: محافظة القاهرة
en: Cairo Governorate
fr: Le Caire
ur: صوبہ قاہرہ
hi: क़ाहिरा मुहाफ़ज़ाह
bn: কায়রো
pa: ਕਾਹਿਰਾ
```
Cascading test: Cairo Governorate has 198 direct children (adm3 districts).
Search test: `q=جيزة` returns Giza district + markaz + village.
Fallback test: `lang=fr` on a record without French ⇒ returns the English value.

## Pending (P0) — Locations Phase B & C
- B1: Import Gulf countries (SA, AE, KW, QA, BH, OM) via `/api/locations/admin/import` once user provides each Geonames `XX.txt`.
- C1: Replace hardcoded city/district pickers in Mobile `PostScreen.js` and `SearchScreen.js` with `<LocationPicker />`.
- C2: Add equivalent cascading dropdowns to Web ad-creation and filter pages.
- C3: Wire `CountryContext` to auto-call `/detect-country` on first launch.

## Backlog (P2)
- AR Try-On (fashion/glasses)
- Escrow Payments (Stripe/PayPal) + Wallet Topup
- Live Voice/Video Calls (WebRTC)
- Verified Seller Badge (Blockchain reviews)

## Tech Stack
- Backend: FastAPI + MongoDB (motor), httpx for IP detection.
- Web: React 19 + Tailwind.
- Mobile: React Native (Expo SDK 54).

## Constraints
- 🚫 No `testing_agent`, no screenshots — manual verification only (curl, python -c, lint).
- 🚫 No refactor of `server.py` monolith.
- 🗣 Communication strictly in Arabic.
