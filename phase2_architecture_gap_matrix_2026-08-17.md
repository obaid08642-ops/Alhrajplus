# Phase 2 — Architecture and UI/API/DB Gap Matrix

## Verified architecture

| Layer | Verified evidence | Assessment |
|---|---|---|
| Web | 113 JS/JSX files; App routes include search, listing, chat, notifications, auctions, reels, wallet, post, profile, map and admin. | Route coverage is broad; route registration is not proof that every flow works. |
| Mobile | 49 JS/JSX/TSX files; centralized notification resolver and PostScreen are present. | Mobile has stronger phone-flow parity than Web; device-only features still require device tests. |
| Backend | 44 Python files; REST API includes listings, search, AI, chat, notifications, referrals, Coins, wallet, auctions, SEO, analytics and push. | Core contracts exist, but each client path needs response/error/persistence verification. |
| Database | Mongo collections are used by settings, users, listings, notifications and ledgers. | Live Render health previously confirmed DB connectivity; isolated local test environment has no Mongo URL. |
| Admin | Admin routes and AI provider configuration/status routes are present. | Admin controls exist, but exact usage/quota/error fields and authorization need end-to-end verification. |

## Evidence-based gaps found

| Requirement | Evidence | Classification | Planned fix phase |
|---|---|---|---|
| Web account/custom phone selection | `frontend/src/pages/PostListing.js` stores only `show_phone` and `contact_phone`; it does not expose Mobile's `phone_source` flow or verified-phone gating. | Incomplete | Phase 5 |
| Mobile phone contract | `mobile/src/screens/PostScreen.js:454-484` validates custom phone and sends `contact_phone_source`/`contact_phone`. | Implemented in code; device/runtime test pending | Phase 5 |
| Listing relative time | `ListingCard.js:104-111` returns Arabic abbreviations (`الآن`, `د`, `س`, `ي`, `ش`) regardless of locale. | Defect | Phase 7 |
| Listing verified badge | `ListingCard.js:65-68` hardcodes `موثّق`. | Defect | Phase 7 |
| Notification full page | `NotificationsPage.js` prevents popup clipping structurally. | Partially implemented | Phase 6/7 |
| Notification locale | `NotificationsPage.js:31` hardcodes `dir="rtl"` and `toLocaleString("ar")`. | Defect | Phase 6/7 |
| Notification route coverage | `NotificationsPage.js:10-19` handles `new_message` then falls back to listing/home; `NotificationBell.js` has richer maps. | Inconsistent implementations | Phase 6 |
| Mobile cold start | `mobile/src/notifications.js:28-39,61-72,130-147` retains pending URL and replays notification response. | Implemented URL-based routing; structured payload requirements not fully proven | Phase 6 |
| AI search | `TopBar.js` has visible Web status and image-search call; voice relies on browser SpeechRecognition. | Partially implemented; cross-platform and failure matrix pending | Phase 4 |
| Swipe navigation | Web has neighbors endpoint and touch handlers, but logical result-set context and end-of-set/pagination semantics require validation; Mobile parity not yet proven. | Incomplete | Phase 8 |
| Alert-driven UX | Inventory found many `alert()`/`Alert.alert()` calls in Admin, posting, AI, upload and location flows. | Premium UX defect and silent/error-state risk | Phases 4–9 |
| Dynamic provider facts | Orchestrator/Admin code exists, but official current pricing/quota data must be fetched and documented without hardcoding unsupported limits. | Needs research and validation | Phase 3 |

## Traceability result

The architecture now has a concrete map from user-facing routes to the major Backend contracts. The most important conclusion is that the remaining work is not a missing-platform rewrite. It is a set of **incomplete parity contracts, inconsistent notification/localization surfaces, device-dependent search behavior, and insufficient verification**. The next implementation phases will modify existing contracts rather than introduce parallel systems.

## Phase 2 acceptance gate

The architecture phase is accepted only for planning purposes after this inventory. It is not a claim that all features work. The implementation gate remains: each affected path must be tested at unit/endpoint/UI level, and unavailable Mongo/provider/device tests must be explicitly listed as unverified.
