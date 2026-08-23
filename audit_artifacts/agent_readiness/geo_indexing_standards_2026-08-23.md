# GEO and indexing standards used in this implementation

## Google Search and AI features

Google's AI-feature guidance states that the same SEO fundamentals apply to AI Overviews and AI Mode: pages must be indexed and eligible to appear as a snippet, should expose helpful original content, and should use structured data that matches visible page content. Google does not provide a special AI-only meta tag or schema that guarantees visibility.

Source: <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>

## Google Indexing API eligibility

Google's Indexing API quickstart limits direct URL notifications to JobPosting and livestreaming BroadcastEvent pages. Marketplace listing URLs must not be submitted through this API. Their normal discovery route is sitemap, internal linking, and Search Console verification/reporting.

Source: <https://developers.google.com/search/apis/indexing-api/v3/quickstart>

## IndexNow

IndexNow accepts URLs when content has been added, updated, or deleted. It is a notification mechanism for participating engines, not a guarantee of crawl or indexing; the URL must remain accessible to search engines and the ownership key must be served from the same host.

Source: <https://www.indexnow.org/documentation>

## Application decisions

The application uses a sitemap index split into static and listing documents, includes only public approved listings and non-empty category hubs, updates the sitemap cache on publication transitions, and uses a persisted IndexNow outbox with bounded retry rather than a synchronous user-facing request. Google is intentionally sitemap/Search Console only for marketplace listings.
