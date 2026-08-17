# Phase 7 — Localization, relative time and direction

## Implemented

Listing cards now format relative times with `Intl.RelativeTimeFormat` for Arabic, English, French and Turkish rather than Arabic-only abbreviated units. Listing prices and Wallet balances/transactions use the active locale. The Web Wallet and Mobile Wallet no longer force Arabic timestamp formatting. Web notification surfaces also use active locale and direction.

The source inventory identified additional legacy RTL-only callback/auth screens and a few Admin filter labels that remain candidates for a later full translation sweep. They were recorded rather than silently described as complete.

## Verification

Web production build passed. Mobile Expo web export passed. The localization inventory is saved in `phase7_localization_inventory_2026-08-17.txt`.
