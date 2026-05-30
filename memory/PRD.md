# PRD — Native Mobile Rebuild & Feature Parity

## Original Problem Statement
Native rebuild of mobile app for 100% UI/feature parity with web app. Polished Post Listing flow with cascading dropdowns, strict 2-column layouts, conditional logic across 10+ categories. Market-based AI pricing required.

## Constraints (User-Enforced)
- ❌ NO testing_agent, NO screenshots except for genuinely new bugs (extreme low-credit mode).
- ✅ Local runtime verification via `expo start --web` + Playwright BEFORE any cloud build.
- ✅ Communication strictly in Arabic.
- ✅ Phased delivery — Phase 1 → 2 → 3 → 4 with clear scope.

## Architecture
- `/app/backend/server.py` — FastAPI monolith (~7500 LOC; refactor FORBIDDEN per user).
- `/app/frontend/` — React 19 + Tailwind web app.
- `/app/mobile/` — Expo SDK 54 React Native app.
- MongoDB (`MONGO_URL`, `DB_NAME` from `.env`).
- Gemini AI via Emergent LLM Key + `emergentintegrations`.

## Phased Plan

### ✅ Phase 1 — Crashes & UI/UX (DONE Feb 2026)
- Fixed `useFocusEffect(useCallback(...))` nested-hook violations (NotificationBell, ChatScreen, ProfileScreen).
- Fixed `useI18n()` calls in inner functions (AuctionsScreen, ChatScreen, MapScreen, OtherScreens, WalletScreen).
- Fixed AuctionsScreen `BidModal` crash (missing `useSafeAreaInsets()`).
- Fixed FloatingTabBar RTL order (Home on RIGHT for Arabic).
- GPS-first country detection (replaces popup on first launch).
- Settings: proper language + country picker modals (was just cycling).
- Dropdowns centered (was pinned to bottom-left corner).
- Theme color contrast strengthened (WCAG AA).
- Runtime-verified via `npx expo start --web` + Playwright: 0 JS runtime errors, Home + Auctions + Profile all open.
- Removed corrupted zero-byte filename `mobile/\x01\x90\xf8@@\xd0\xc39@8` (was blocking macOS clones).

### 🟠 Phase 2 — Post Listing (PENDING)
- "Required field" false-positive on filled brand selector.
- "Service duplicate" error blocking creation.
- Verify form submission reaches server + listing appears in feed.

### 🟡 Phase 3 — Chat + AI + Camera + GPS (PENDING)
- Chat black/red error screen on open.
- AI button: open camera (not just gallery) + actually fill data via Gemini.
- Phone number country code: use real `+966 / +20` etc. (not "SA").
- Category auto-suggest: fix matching between title and category.

### 🟢 Phase 4 — Reels/Stories + Map + Web parity features (PENDING)
- Smooth swipe (YouTube Shorts / TikTok feel).
- Hide bottom nav when stories open.
- Position "View Ad" button correctly.
- Map hologram: category-specific icons (car/animal/phone) instead of stars.
- Add side icons: like / share / price / location (mirror web).

## Critical Notes
- Lucide-react-native@1.16.0 confirms `Flame`, `Rocket`, all standard icons exported correctly.
- Single `react@19.1.0` instance confirmed via `npm ls react`.
- expo-doctor: 18/18 checks pass.
- Backend CORS errors during web preview are environmental only — do NOT affect device runtime.

## Test Credentials
See `/app/memory/test_credentials.md`.
