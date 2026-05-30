# PRD — Native Mobile Rebuild & Feature Parity

## Original Problem Statement
Native rebuild of mobile app for 100% UI/feature parity with web app. Polished Post Listing flow with cascading dropdowns, strict 2-column layouts, conditional logic across 10+ categories. Market-based AI pricing required.

## Constraints (User-Enforced)
- ❌ NO testing_agent, NO screenshots (extreme low-credit mode).
- ✅ Runtime verification via `expo start --web` + curl + bundle eval ONLY.
- ✅ Communication strictly in Arabic.
- ✅ Phased delivery — Phase 1 → 2 → 3 → 4.

## Architecture
- `/app/backend/server.py` — FastAPI monolith (~7585 LOC; refactor FORBIDDEN per user).
- `/app/frontend/` — React 19 + Tailwind web app.
- `/app/mobile/` — Expo SDK 54 React Native app.
- MongoDB (`MONGO_URL`, `DB_NAME` from `.env`).
- Gemini AI via Emergent LLM Key + `emergentintegrations`.

## ✅ Phase 1 — Crashes & UI/UX (DONE, commit `5e5e7ea`)
- Hook violations: nested `useFocusEffect(useCallback(...))` in NotificationBell/ChatScreen/ProfileScreen.
- `useI18n()` inside callbacks/effects in 5+ screens.
- AuctionsScreen `BidModal`: missing `useSafeAreaInsets()` — was the "insets doesn't exist" crash.
- FloatingTabBar: RTL-aware (الرئيسية on RIGHT for Arabic).
- GPS-first country detection (no popup on first launch).
- SettingsScreen: proper language + country picker modals.
- Dropdowns: centered modal (was pinned to bottom corner).
- theme.js: WCAG AA contrast (primary darker, textMuted darker, borders visible).
- Removed corrupted zero-byte filename `mobile/\x01\x90\xf8@@\xd0\xc39@8` (was blocking macOS clones — commit `e8dbc24`).

## ✅ Phase 2 — Post Listing (DONE, commit `b5c0a4e`)
- "حقل مطلوب" false-positive: PostScreen now skips generic `cat.fields` loop for categories with custom Details Box (cars/phones/services/jobs/realestate/furniture/electronics/auctions/livestock/equipment). The cascade components own their internal validation.
- "تكرار" error: same root cause — resolved by the same fix.
- Verified end-to-end: `POST /api/listings` with phones cascade fields → status `active`, listing_id returned.

## ✅ Phase 3 — Chat + AI + Camera + Country code (DONE, commit `b5c0a4e`)
- ChatScreen "red screen" / "rendered fewer hooks": early-return `if (!user)` was BEFORE `useCallback`/`useEffect`/`useMemo`. Moved guest-gate AFTER all hooks.
- AI autofill: now opens CAMERA first via `ImagePicker.launchCameraAsync` (gallery is fallback only), mirroring web behaviour. Calls `/api/ai/listing-autofill` and writes full result into form including `custom_fields`.
- Country code: backend `/auth/register` was storing `phone_full = "SA0501234567"`. Now resolves ISO country code → international dial code (`+966`, `+20`, `+971`, etc.) with a 30-country map. Verified: SA→+966, EG→+20 via curl.
- Category auto-suggest: keyword map updated to backend keys (`phones` not `electronics`, `realestate` not `real_estate`). "آيفون 15" now correctly suggests `phones`.

## ✅ Phase 4 — Reels/Stories + Map (DONE, commit `b5c0a4e`)
- ReelsScreen: full-screen `REEL_H = SCREEN_H`. Bottom tab bar hidden via `useFocusEffect` on parent navigator. `disableIntervalMomentum` + `snapToInterval` for TikTok-smooth swipes.
- Side action rail added: Like (with optimistic toggle + `/favorites` API), Share (native `Share` sheet), price pill, location chip — mirroring web reels UI.
- MapScreen hologram: category-specific emoji icons (🚗 cars / 📱 phones / 🏠 realestate / 💼 jobs / 🛠️ services / 🛋️ furniture / 💻 electronics / 🐪 livestock / 🚜 equipment / 🔨 auctions). No more "all stars". Chip shape changed from pill to rounded rectangle to accommodate emoji + price.

## Runtime Verification (no testing_agent / no screenshots)
- Backend: `python3 -m py_compile server.py` → ✅
- Curl `/api/auth/register` (SA): `phone_full: +966501234567` ✅
- Curl `/api/auth/register` (EG): `phone_full: +201001234567` ✅
- Curl `/api/listings` (phones cascade): `status: active`, id returned ✅
- Web Metro bundle: 11.1 MB, 3065 modules built ✅
- AST hook audit: 0 violations ✅
- Static analysis: insets-binding audit clean, t()-binding audit clean ✅

## Remaining/Future
- Voice messages in chat (record/send/playback).
- Chat "Forward Message" feature.
- Market-based AI pricing via external scraping (deferred — `/api/listings/suggest-price` placeholder).
- AR Try-On, Escrow Payments, WebRTC calls, Blockchain verified-seller badge.

## Test Credentials
See `/app/memory/test_credentials.md`.
