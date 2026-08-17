# Phase 8 — Listing UX and swipe navigation

## Implemented

Web ListingDetail already uses the country-and-category constrained `/listings/{id}/neighbors` endpoint and navigates to the previous/next item after a horizontal threshold. Mobile ListingDetail now fetches the same endpoint after the listing loads and installs a native horizontal PanResponder that ignores vertical movement and navigates with `navigation.replace`, preserving the current detail stack. The existing image carousel remains responsible for image-level swipes inside its nested FlatList.

## Verification

Web production build passed. Mobile Expo web export passed. Backend compilation passed.

## Remaining evidence boundary

The gesture has not been physically tested on iOS/Android touch hardware in this sandbox. It must still be checked for nested carousel gesture arbitration, RTL gesture expectations, and accessibility alternatives on real devices.
