import { Helmet } from "react-helmet-async";

/**
 * Dynamic SEO meta tags + JSON-LD Product schema for listing detail pages.
 * Crawlers (Google, Bing) and AI agents (ChatGPT, Perplexity, Claude) read these
 * to understand the page content. Open Graph + Twitter cards for rich social sharing.
 */
export function ListingSEO({ listing }) {
    if (!listing) return null;
    const SITE = "https://alhraj.online";
    // Prefer SEO-friendly slug; fall back to id for older listings.
    const ref = listing.slug || listing.id;
    const url = `${SITE}/listing/${ref}`;
    const title = `${listing.title} ${listing.price ? `بسعر ${listing.price.toLocaleString()} ${listing.currency || "ر.س"}` : ""} | ${listing.city || ""} - الحراج بلس`.slice(0, 200);
    const description = (listing.description || listing.title).slice(0, 300);
    const image = listing.images?.[0] || `${SITE}/og-image.png`;
    const tokens = (listing.title + " " + (listing.description || "")).split(/\s+/).filter(w => w.length > 2).slice(0, 30);
    const keywords = [...new Set([listing.title, listing.category, listing.city, ...tokens, "حراج", "بيع", "شراء"])].filter(Boolean).join(", ");
    const LANGS = ["ar", "en", "hi", "ur", "bn", "fr"];
    const LANG_LOCALE = { ar: "ar_SA", en: "en_US", hi: "hi_IN", ur: "ur_PK", bn: "bn_BD", fr: "fr_FR" };

    // Schema.org Product JSON-LD (for Google rich snippets + AI agents)
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": listing.title,
        "description": description,
        "image": listing.images || [image],
        "url": url,
        "sku": listing.id,
        "brand": listing.custom_fields?.brand || "الحراج بلس",
        "category": listing.category,
        "offers": {
            "@type": "Offer",
            "url": url,
            "priceCurrency": listing.currency_code || "SAR",
            "price": listing.price || 0,
            "priceValidUntil": new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
            "availability": listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": listing.custom_fields?.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
            "seller": {
                "@type": "Person",
                "name": listing.seller?.name || "بائع",
            },
            "areaServed": {
                "@type": "Place",
                "name": listing.city || "السعودية",
            }
        },
    };

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />

            {/* hreflang alternates — tells Google which URL serves which language */}
            {LANGS.map((lng) => (
                <link key={lng} rel="alternate" hrefLang={lng} href={`${url}?lang=${lng}`} />
            ))}
            <link rel="alternate" hrefLang="x-default" href={url} />

            {/* Mobile app deep-link — iOS Smart Banner + Android App Link hints */}
            <meta name="apple-itunes-app" content={`app-id=000000000, app-argument=${url}`} />
            <link rel="alternate" href={`harajplus://listing/${ref}`} />

            <meta property="og:type" content="product" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content="الحراج بلس" />
            <meta property="og:locale" content="ar_SA" />
            {LANGS.filter(l => l !== "ar").map((lng) => (
                <meta key={`alt-${lng}`} property="og:locale:alternate" content={LANG_LOCALE[lng]} />
            ))}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Product Schema for Google Rich Snippets + AI Agents */}
            <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
    );
}

/**
 * Generic SEO for static pages (Home, Category, About, etc.)
 */
export function PageSEO({ title, description, keywords, path, image }) {
    const SITE = "https://alhraj.online";
    const url = `${SITE}${path || "/"}`;
    const fullTitle = title ? `${title} | الحراج بلس` : "الحراج بلس | بيع، اشترِ، استأجر، وظّف";
    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={url} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}
            <meta property="og:locale" content="ar_SA" />
        </Helmet>
    );
}
