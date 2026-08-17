# Phase 3 — UX Journey Matrix

## Status semantics
PASS means evidence exists for the required path and its recovery states. PARTIAL means some UI/API states exist but the complete cross-platform journey is not proven. BLOCKED means a real device, credential, or external service is required. UNVERIFIED means the journey requires manual visual/device confirmation.

| Persona / journey | Web | Mobile | Backend/data | UX gate status | Main verification needed |
|---|---|---|---|---|---|
| New visitor: home, country, language, theme | PARTIAL | PARTIAL | PARTIAL | PARTIAL | first-launch detection and persistence on real browser/device |
| Visitor: search, filters, categories, map, nearby | PARTIAL | PARTIAL | PARTIAL | PARTIAL | country-scoped results, empty/loading/error and responsive map |
| Visitor: listing card/detail/gallery/share | PARTIAL | PARTIAL | PARTIAL | PARTIAL | full-screen media, seller context, similar listings, accessibility |
| Registered buyer: login/profile/favorites/watchlist | PARTIAL | PARTIAL | PASS for shared API paths | PARTIAL | same-account Web↔Mobile mutation test |
| Buyer: comments/replies/ratings/reviews/follow | PARTIAL | PARTIAL | PARTIAL | PARTIAL | thread focus, authorization, notification destination |
| Seller: create/edit/publish listing | PARTIAL | PARTIAL | PARTIAL | PARTIAL | field matrix, draft resume, media retry and publish confirmation |
| Seller: phone source and privacy | PASS contract | PASS contract | PASS contract | PARTIAL | staging account with account/custom/hidden phone cases |
| Seller: listing quality and AI assistance | PARTIAL | PARTIAL | PARTIAL | UNVERIFIED | real provider staging and user-confirmed suggestions |
| Seller: views/leads/calls/messages/promotion | PARTIAL | PARTIAL | PARTIAL | PARTIAL | seller analytics and promotion lifecycle |
| Power seller: repost/store/business profile/packages | PARTIAL | PARTIAL | PARTIAL | UNVERIFIED | feature parity and Admin-configured eligibility |
| Wallet/Coins/referral | PASS ledger paths | PASS display paths | PASS ledger/idempotency paths | PARTIAL | Mongo concurrency and qualification rules |
| Chat: send/read/reply/reconnect/delete-for-me/block/report | PARTIAL | PARTIAL | PARTIAL | PARTIAL | two-account realtime, offline/reconnection and visual states |
| Calls: App↔App, Web↔App, App↔Web | PARTIAL foundation | PARTIAL wrapper | PARTIAL signaling | BLOCKED | real devices, permissions, background, TURN/network switching |
| Notifications: bell/list/push/cold start | PASS resolver build | PARTIAL parser | PARTIAL payloads | PARTIAL | OS push credentials and every ntype on cold start |
| Auctions: create/bid/minimum/duration/archive | PARTIAL | PARTIAL | PARTIAL | UNVERIFIED | end-to-end lifecycle and seven-day maximum enforcement |
| Stories/video | PARTIAL | PARTIAL | PARTIAL | UNVERIFIED | upload/playback/expiry/moderation on devices |
| Admin: users/listings/moderation/AI/Coins/reports | PARTIAL | should be restricted | PARTIAL | PARTIAL | role/MFA/session security and audit evidence |
| Admin CRM: visitors/devices/duration/leads | PARTIAL | N/A for full dashboard | PARTIAL | UNVERIFIED | telemetry schema, retention, privacy and report accuracy |
| Slow network/new device/returning user | PARTIAL | UNVERIFIED | PARTIAL | UNVERIFIED | network throttling, cache invalidation and recovery |
| Arabic/English/RTL/LTR | PARTIAL | PARTIAL | N/A | PARTIAL | full translation sweep and directional visual review |
| Accessibility: keyboard, focus, screen reader, touch targets | PARTIAL | PARTIAL | N/A | UNVERIFIED | automated and manual accessibility checks |

## Required state vocabulary

Important actions must expose their state rather than fail silently. Search uses permission/listening/processing/searching/results/error; image search uses pick/uploading/analyzing/matching/results/error; listing uses saving/validating/publishing/published/error; referral uses validating/qualified/awarded/rejected; promotion uses checking balance/applying/success/insufficient; notifications use opening/resolving/target/error.

## Phase 3 decision

The inventory is complete as a diagnostic artifact, but it does not declare all journeys production-ready. The next implementation phase is the design-system and premium-UI phase, and it must close visual, responsive, accessibility, and navigation gaps without breaking the baseline builds.
