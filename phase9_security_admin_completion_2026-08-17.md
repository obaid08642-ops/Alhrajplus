# Phase 9 — Admin, trust/safety and transaction safety

## Verified

Admin routes are protected through `require_admin`, including the dedicated `admin_router` dependency and standalone admin routes. Admin activity is logged for sensitive moderation and Coins grant operations. Moderation, reports, listing lifecycle, analytics, visitor sessions, SEO, notifications, and referral panels are present in the Admin surface.

## Implemented

Coins spend and grant now handle a duplicate idempotency-key race after the atomic balance increment/decrement by rolling back the losing balance mutation and returning the existing ledger transaction. Welcome bonus logging now rolls back the balance mutation when a concurrent unique transaction wins. Startup now attempts unique indexes for `(user_id, idempotency_key)` in `coins_ledger` and `(user_id, type=bonus)` in `wallet_transactions`, using the existing safe-index wrapper so legacy duplicate data is logged rather than preventing server startup.

## Verification

Backend compilation passed. Web production build passed. Mobile Expo web export passed.

## Remaining evidence boundary

Mongo transactions/concurrency, Cloudinary deletion, push delivery and external moderation/SEO provider behavior need staging with real services. Static review cannot prove production-scale latency or concurrency.
