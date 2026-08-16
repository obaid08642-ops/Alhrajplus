# Staging findings — 2026-08-16

## Initial Web smoke

- Web URL: https://www.alhraj.online
- Backend URL: https://alhrajplus.onrender.com
- The page loads and renders the home layout after waiting; it is not a permanent blank screen.
- The live page is predominantly English on first render, including `Login`, `Sell, Buy, Rent, Hire`, `Post for Free`, `Map near you`, `Today's Deals`, `Auctions`, `Video Stories`, `Book Flight`, `Categories`, `Near You`, `No results`, and bottom navigation labels.
- The page includes an Arabic AI accessibility label (`إخفاء المساعد`) while most visible UI is English, confirming inconsistent/delayed translation state.
- The live home feed currently shows `No results` / skeleton-like cards in the captured viewport, requiring API and country-filter investigation rather than assuming the feed is healthy.
- Visible routes include `/post`, `/map`, `/deals`, `/auctions`, `/reels`, `/flights`, `/register`, `/chat`, `/profile`, and category routes.
- Bottom navigation is visible on the live Web page; visual verification of active-state color still needs route-by-route checks.

## Live API country test

The deployed backend returned 12 Saudi listings for `GET /api/listings?country_code=SA&limit=5`; every returned item had `country_code: SA`. It returned 4 Egyptian listings for the same endpoint with `country_code=EG`; every returned item had `country_code: EG`. Therefore the deployed API country filter is functioning for this endpoint. The mismatch is now narrowed to the Web home feed/request state, not the basic listings query itself. The live data includes usable listing IDs/slugs, including `faaea6f9-11fa-437b-b269-37d27f873883` / `jms-anfwa-faaea6` for a Saudi listing and `f7108a5f-9ca7-41ff-ac14-7d74086ba2d2` / `mwbayl-f7108a` for an Egyptian listing.

## Listing detail reproduction

Opening `https://www.alhraj.online/listing/jms-anfwa-faaea6` with a real Saudi listing slug does not render the detail page. It briefly shows `Loading...`, then the browser returns to the home URL (`https://www.alhraj.online/`) with the normal home layout and `No results`. This reproduces the user's report that listing pages do not open. The backend slug endpoint must be checked next, followed by the Web route's API call and error/redirect behavior.

## Detail API diagnosis

The deployed backend returns the full Saudi listing successfully from `/api/listings/by-slug/jms-anfwa-faaea6?country_code=SA`, including seller data. The deployed `/api/listings/faaea6f9-11fa-437b-b269-37d27f873883/similar?country_code=SA` also returns a valid array. Therefore the detail-page redirect is not caused by those two basic backend endpoints. The Web component currently uses `Promise.all` for listing, similar, and `/meta/categories`; any failure of categories causes the entire page to catch and call `nav('/')`. This is a confirmed P0 frontend design bug: optional metadata must not be able to redirect a valid listing to home. The comments/trust/like requests are already launched after the main Promise and should be isolated as optional requests as well.

## Confirmed P0 fixes prepared locally

The Web detail page used one `Promise.all` for the required listing and optional similar/categories metadata. Because the catch handler navigated to `/`, a failure in `/meta/categories` or similar made every valid listing appear not to open. The component was changed to load the listing first, use `Promise.allSettled` for optional metadata, isolate comments/trust/like/watch requests, and show a real translated error instead of redirecting or remaining on infinite loading.

The translation dictionary was missing several exact keys used by the live UI, including `تواصل مع البائع`, `إظهار المساعد الذكي`, `ارفع ستوري`, `ارفع ستوري فيديو`, `نشر ستوري`, `ستوري`, and listing-load error messages. Eleven keys were added for English, Urdu, Hindi, Bengali, and French. Web production build succeeded after both changes.

The live deployment has not yet received these fixes; they are prepared locally and require commit/push plus the user's deployment cycle before the same browser tests can be repeated against production.
