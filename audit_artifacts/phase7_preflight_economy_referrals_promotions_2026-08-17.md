# Phase 7 Preflight — Economy, Referrals, Sharing, Promotions, and Analytics

## Verified current foundation

The platform already separates `coins_balance` from the SAR-denominated cash wallet. The cash welcome endpoint returns `410`, while the verified-account welcome reward uses Coins. Existing coin spending and the seven-day listing boost have idempotency fragments and partial compensation logic. Web and Mobile both show wallet/coin balances and ledgers, and the admin has a basic referral configuration and generic analytics overview.

| Domain | Existing implementation | Confirmed Phase 7 gap |
|---|---|---|
| Referral | Registration captures a valid code and creates a pending event; email verification qualifies it. | No attribution for link creation, click, open, app/device/platform, qualification reason, self/fraud detection, or shared-event lifecycle. The reward is effectively a static points/coins increment rather than a generalized ledger transaction. |
| Referral configuration | Admin can set `enabled` and `reward_points`. | No configurable Coins-based onboarding/referral/share/boost catalogue, qualification policy, duration, trust rule, anti-fraud policy, or runtime promotion settings. |
| Listing share | Web/Mobile share static URLs. | No server-side share link identity, qualified open event, recipient/session/device dedupe, anti-replay or reward-once policy. |
| Coins ledger | Separate ledger and balance; welcome/spend/admin grant records exist. | The balance update and ledger insert are not one reusable atomic transaction contract with before/after/status/source/reference metadata. Expiration/refund types and reconciliation are incomplete. |
| Boost/promotion | One fixed-cost, seven-day boost; basic atomic claim before charge. | No product catalogue, duration/strength/country/category eligibility/concurrency/moderation/expiration contract; unboost lacks a formal refund policy; ranking policy and sponsored query relevance are not fully encoded. |
| Analytics | Privacy-conscious generic event endpoint and overview. | Event allowlist/schema lacks referral/share-open/qualification/coin/promotion telemetry; no economy reconciliation or dedicated referral/share/promotion aggregates. |
| Web/Mobile/Admin | Basic referral card, wallet ledger, boost link, and shallow referral admin tab. | No tracked referral/share journey, reward state explanation, promotion product selection, or rich admin control/analytics. |

## Delivery implications

Phase 7 must extend the existing collections and APIs instead of creating an independent economy. Backend remains the enforcement boundary for link attribution, reward qualification, idempotency, country scope, promotion eligibility, and ranking. The existing cash wallet remains separate and is not used to pay for promotions.

## Initial blockers

A true recipient/device fraud signal cannot be inferred safely from IP or undisclosed tracking. The implementation must rely on first-party opaque visitor/session/device tokens, self-referral checks, authenticated identity, and idempotency. Attribution across app installation or a closed app requires a configured deep-link/attribution provider or platform capability; any unavailable external proof will be documented rather than faked.

## Implementation progress (not an acceptance result)

The first Backend implementation pass now adds a runtime economy configuration, promotion product definitions, reusable coin mutation metadata, referral-open attribution, listing-share creation, qualified share-open reward dedupe, extended economy analytics fields, and required indexes. Existing email-verification referral qualification has begun migration to the shared coin mutation contract. This is **not** Phase 7 completion: Web/Mobile/Admin integration, promotion ranking semantics, reconciliation analytics, comprehensive negative tests, builds, staging validation, and publication remain outstanding.

## Current execution boundary

No Phase 7 commit or deployment has been made yet. The working tree intentionally retains the Backend contract changes and Phase 7 tests until the Web, Mobile, and Admin integration plus final end-to-end validation are complete.

The next Phase 7 implementation slice is the client/admin integration: tracked referral/share links, promotion product selection, runtime configuration controls, and aggregate reconciliation views. These are intentionally not represented by placeholder UI in the current working state.
