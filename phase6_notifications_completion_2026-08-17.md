# Phase 6 — Notifications and deep links

## Implemented and verified in code

The dedicated Web notifications page now resolves structured notification data for chat, comments, saved searches/search alerts, followers, auctions and listing entities, instead of handling only `new_message` and falling back blindly. The notification bell retains its richer route map. Both Web notification surfaces now derive direction and timestamp locale from the active language instead of forcing RTL and Arabic formatting.

Mobile already has a centralized cold-start resolver that preserves a pending route until navigation is ready, maps listing/comment focus, chat, seller, search, auctions, reels, map, offers and other top-level routes, and replays the last notification response. Its remaining limitation is that the server payload is still primarily URL-based; structured payload fields are not yet normalized centrally.

## Verification

Web production build passed. Mobile Expo web export passed.

## Remaining evidence boundary

Actual notification delivery while the app is terminated, OS permission behavior, iOS/Android notification tap routing, and push provider payload shape require real device builds and configured push credentials. They are not claimed as live-verified in this sandbox.
