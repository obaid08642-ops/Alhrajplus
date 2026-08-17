# Phase 5 — Coins, referrals, promotion and phone identity

## Verified implementation

The repository contains separate Coins endpoints and a ledger (`/coins/me`, `/coins/ledger`, `/coins/spend`), referral endpoints and Admin referral configuration. The Web and Mobile Profile surfaces expose Coins balance/ledger UI, and Admin has referral monitoring/configuration. Boost requests are connected to Coins spending in the Backend with idempotency and rollback behavior documented in the preceding implementation history.

Mobile `PostScreen` already validates the custom-phone branch and sends `contact_phone_source` plus `contact_phone`. Web `PostListing` already had the selector UI but was sending only the generic form payload. It now validates a custom number and explicitly sends `contact_phone_source` as `custom`, `account`, or `null` when phone display is disabled, matching the Backend contract.

## Verification

Web production build passed, Mobile Expo web export passed, and Backend compilation passed after the phone contract change.

## Remaining evidence boundary

Referral qualification, atomic reward issuance, Coins double-spend protection, and Boost rollback require a MongoDB-backed staging test with two test accounts and concurrent requests. The local environment does not provide a safe production-like Mongo dataset, so these are not claimed as live-verified here.
