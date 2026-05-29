# PRD — Native Mobile Rebuild & Feature Parity

## Original Problem Statement
Native rebuild of mobile app for 100% UI/feature parity with web app. Polished Post Listing flow with cascading dropdowns, strict 2-column layouts, conditional logic across 10+ categories (Cars, Phones, Real Estate, Jobs, Services, Furniture, Electronics, Animals, Equipment, Auctions). Market-based AI pricing required.

## Constraints
- Strict 2-column Details Boxes, no duplicate fields.
- Expo Go must boot without runtime crashes.
- NO testing_agent, NO screenshots (extreme low-credit mode).
- Manual testing only: linting / curl / metro bundle / `python -c`.
- Communication strictly in Arabic.

## Architecture
- `/app/backend/server.py` — FastAPI monolith (~7500 LOC; refactor FORBIDDEN per user).
- `/app/frontend/` — React 19 + Tailwind web app.
- `/app/mobile/` — Expo SDK 54 React Native app.
- MongoDB (`MONGO_URL`, `DB_NAME` from `.env`).
- Gemini AI via Emergent LLM Key + `emergentintegrations`.

## Done
- Post Listing UX standardized (2-column grids) for: Phones, Services (PRO), Jobs, Real Estate, Furniture, Home Appliances, Animals, Equipment, Auctions.
- Top-level module scope crashes in Expo Go (`Property 't' doesn't exist`) — fixed via mass AST rewrite (82+ inner-fn t() scope issues).
- **Feb 2026**: React Hook violations (Invalid hook call) — 7 violations fixed across AuctionsScreen, ChatScreen, MapScreen, OtherScreens, WalletScreen. Audit clean (0 violations). Metro bundle succeeds (3311 modules, 13.9 MB iOS dev bundle).

## P1 — Pending
- Market-Based AI Price Suggestion (external scraping / dataset aggregation → `/api/listings/suggest-price`).
- Voice Messages in Mobile/Web Chat (record, send, playback).
- Chat "Forward Message" feature.

## P2 — Future
- AR Try-On (fashion/glasses).
- Escrow Payments (Stripe/PayPal) + Mobile Wallet Stripe SDK Topup.
- Live Voice/Video calls (WebRTC).
- Verified Seller Badge via blockchain reviews.

## Known Open Issues
- Mobile TopBar overflow on small screens (visual polish).

## Test Credentials
See `/app/memory/test_credentials.md`.
