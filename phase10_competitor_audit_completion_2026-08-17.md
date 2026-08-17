# Phase 10 — competitor audit and prioritization

## Evidence-based findings

Haraj’s official homepage makes a broad taxonomy, brand shortcuts, region shortcuts, nearby discovery, and deep car/property/device subcategories immediately visible. OpenSooq’s official localized homepage exposes city and category selectors, favorites, user posts, notifications, Add Listing, Reviews & Ratings, Sell Now, newly listed discovery, vehicle brand/city/year tabs, and SEO-oriented landing sections. Dubizzle’s public root was blank in the sandbox, so no feature was claimed from that source beyond the separately indexed official app presence; a real regional Dubizzle session would be needed for a fair screen-by-screen audit.

## Priority matrix

| Priority | Opportunity | Current Alhrajplus evidence | Decision |
|---|---|---|---|
| P0 | Same-country discovery isolation | Implemented in Backend public listing filters and neighbors | Keep under regression tests |
| P0 | Search history/trending/suggestions and image search | Implemented in Web; image-search state machine verified | Add native marketplace search parity |
| P1 | Reviews/ratings discoverability | Backend/profile/listing review surfaces exist but are not as prominent as OpenSooq’s homepage entry | Improve navigation and listing trust summary |
| P1 | Category/brand/city/year SEO landing pages | Category and SEO support exist; competitor landing taxonomy is more visible | Expand generated landing metadata and indexable routes |
| P1 | Saved search alerts and fresh-listing discovery | Search alert/deep-link contracts exist | Expose a clear saved-search management screen |
| P2 | Snap-photo listing flow | Web Sell with AI exists; native marketplace top search/creation parity is incomplete | Implement native camera-to-draft flow |
| P2 | Nearby and region shortcuts | Map/country features exist | Improve visible shortcuts and filter persistence |

## Limitation

A public homepage inspection cannot establish private workflows, paid promotion ranking algorithms, moderation SLAs, or backend scale. Those items remain hypotheses until tested through official product sessions or documented APIs.
