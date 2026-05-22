import { useEffect, useState, Fragment, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import * as Icons from "lucide-react";
import { Plus, Sparkles, ChevronDown, Briefcase, Wrench } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import AdSlot from "@/components/listings/AdSlot";

export default function HomePage() {
    const { t, pickName, tr, lang } = useI18n();
    const { user } = useAuth();
    const { country } = useCountry();
    const [categories, setCategories] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [layout, setLayout] = useState(localStorage.getItem("hp_layout") || "grid");
    const [showAllCats, setShowAllCats] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef(null);

    useEffect(() => { localStorage.setItem("hp_layout", layout); }, [layout]);

    // Initial load — categories + page 1 of listings
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setPage(1);
            setHasMore(true);
            try {
                const params = { limit: 20, page: 1 };
                if (country) params.country_code = country;
                const [cats, lists] = await Promise.all([
                    api.get("/meta/categories", { params: { lang } }),
                    api.get("/listings", { params })
                ]);
                setCategories(cats.data);
                const items = lists.data.items || [];
                setListings(items);
                if (items.length < 20 || items.length >= (lists.data.total || 0)) setHasMore(false);
            } catch (_) {} finally { setLoading(false); }
        };
        load();
    }, [country, lang]);

    // Infinite scroll — fetches the next 20 when the sentinel scrolls into view
    const loadMore = useCallback(async () => {
        if (loadingMore || loading || !hasMore) return;
        setLoadingMore(true);
        try {
            const params = { limit: 20, page: page + 1 };
            if (country) params.country_code = country;
            const { data } = await api.get("/listings", { params });
            const next = data.items || [];
            setListings((prev) => [...prev, ...next]);
            setPage(page + 1);
            if (next.length < 20) setHasMore(false);
        } catch (_) { setHasMore(false); }
        finally { setLoadingMore(false); }
    }, [country, page, hasMore, loadingMore, loading]);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const io = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore(); },
            { rootMargin: "400px" }
        );
        io.observe(sentinelRef.current);
        return () => io.disconnect();
    }, [loadMore, hasMore]);

    return (
        <div className="space-y-5 sm:space-y-8 pb-6">
            <Hero t={t} />
            <QuickActions />
            <CategoriesStrip categories={categories} t={t} pickName={pickName} expanded={showAllCats} onToggle={() => setShowAllCats(!showAllCats)} />
            <NearbySection listings={listings} loading={loading} t={t} layout={layout} setLayout={setLayout} loadingMore={loadingMore} hasMore={hasMore} sentinelRef={sentinelRef} />
            <CTASection t={t} user={user} />
        </div>
    );
}

function QuickActions() {
    const items = [
        { to: "/deals", icon: "🔥", label: tr("صفقات اليوم"), color: "from-emerald-100 to-red-50 dark:from-emerald-900/20 dark:to-red-900/10" },
        { to: "/auctions", icon: "🔨", label: tr("مزادات"), color: "from-amber-100 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10" },
        { to: "/reels", icon: "🎬", label: tr("قصص فيديو"), color: "from-pink-100 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/10" },
        { to: "/flights", icon: "✈️", label: tr("حجز طيران"), color: "from-blue-100 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/10" },
        { to: "/map", icon: "🗺️", label: tr("خريطة"), color: "from-emerald-100 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10" },
    ];
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {items.map((it) => (
                    <Link key={it.label} to={it.to} data-testid={`quick-${it.label}`} className={`relative bg-gradient-to-br ${it.color} rounded-2xl p-3 sm:p-4 border border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5 transition-all flex flex-col items-center gap-1.5`}>
                        <span className="text-2xl sm:text-3xl">{it.icon}</span>
                        <span className="font-arabic font-bold text-[10px] sm:text-sm text-[var(--text)] text-center">{it.label}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function Hero({ t }) {
    return (
        <section className="max-w-7xl mx-auto mt-3 px-3 sm:px-6">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--secondary)] via-[#1A2952] to-[var(--secondary)] grain-overlay shadow-lg">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--primary)]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-3xl"></div>
                <div className="relative px-5 py-7 sm:px-12 sm:py-10 flex items-center gap-5">
                    <img src="/logo-haraj.png" alt="" className="hidden sm:block w-24 h-24 lg:w-32 lg:h-32 object-contain drop-shadow-2xl shrink-0" />
                    <div className="flex-1">
                        <span className="inline-flex items-center gap-1.5 bg-[var(--primary)]/15 backdrop-blur-md border border-[var(--primary)]/30 text-[var(--primary)] rounded-full px-2.5 py-1 text-[10px] font-bold mb-2 font-arabic">
                            <Sparkles className="w-3 h-3" /> {tr("مدعوم بالذكاء الاصطناعي")}
                        </span>
                        <h1 className="font-arabic font-black text-2xl sm:text-4xl text-white leading-tight tracking-tight mb-2">
                            {tr("بيع، اشترِ، استأجر،")}<br className="sm:hidden"/> <span className="text-[var(--primary)]">{tr("وظّف")}</span>
                        </h1>
                        <p className="text-white/70 text-xs sm:text-sm font-arabic-body mb-4 max-w-md">{tr("أكبر سوق رقمي للخليج العربي — كل شيء في مكان واحد")}</p>
                        <div className="flex gap-2">
                            <Link to="/post" data-testid="hero-post-btn" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 font-arabic">
                                <Plus className="w-4 h-4" /> {tr("أنشر مجاناً")}
                            </Link>
                            <Link to="/map" data-testid="hero-map-btn" className="bg-white/10 backdrop-blur border border-white/30 text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-xs sm:text-sm hover:bg-white/20 transition-all font-arabic">
                                🗺️ {tr("خريطة قريبة منك")}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CategoriesStrip({ categories, t, pickName, expanded, onToggle }) {
    const visibleCount = expanded ? categories.length : 7;
    const visible = categories.slice(0, visibleCount);
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-arabic font-black text-lg sm:text-xl text-[var(--text)]">{t("sec_categories")}</h2>
                <button data-testid="toggle-categories" onClick={onToggle} className="text-xs text-[var(--primary)] font-bold font-arabic flex items-center gap-1">
                    {expanded ? tr("عرض أقل") : tr("عرض الكل")} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
            </div>
            <div className={`grid ${expanded ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8" : "grid-cols-4 sm:grid-cols-6 lg:grid-cols-7"} gap-2 sm:gap-3`}>
                {visible.map((c, i) => {
                    const Icon = Icons[c.icon] || Icons.Shapes;
                    return (
                        <Link key={c.key} to={`/category/${c.key}`} data-testid={`cat-${c.key}`}
                            className="group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-up"
                            style={{ animationDelay: `${i * 20}ms` }}>
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--primary)]/15 group-hover:bg-[var(--primary)]/25 flex items-center justify-center transition-all">
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" strokeWidth={2.2} />
                            </div>
                            <span className="font-arabic font-bold text-[11px] sm:text-xs text-[var(--text)] text-center line-clamp-1">{pickName(c)}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function NearbySection({ listings, loading, t, layout, setLayout, loadingMore, hasMore, sentinelRef }) {
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <div>
                    <h2 className="font-arabic font-black text-lg sm:text-xl text-[var(--text)]">{t("sec_nearby")}</h2>
                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-arabic-body">{t("sec_nearby_sub")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[var(--surface-elevated)] rounded-full p-1 flex border border-[var(--border)]">
                        <button data-testid="layout-grid" onClick={() => setLayout("grid")} className={`px-2.5 py-1 rounded-full text-[10px] font-arabic font-bold ${layout === "grid" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "text-[var(--text-muted)]"}`}>{t("layout_grid")}</button>
                        <button data-testid="layout-wide" onClick={() => setLayout("wide")} className={`px-2.5 py-1 rounded-full text-[10px] font-arabic font-bold ${layout === "wide" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "text-[var(--text-muted)]"}`}>{t("layout_wide")}</button>
                    </div>
                </div>
            </div>
            {loading ? (
                <div className={layout === "wide" ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"}>
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`${layout === "wide" ? "h-28" : "aspect-[4/3]"} rounded-2xl bg-[var(--surface-elevated)] animate-pulse`}></div>)}
                </div>
            ) : listings.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)]">
                    <p className="text-[var(--text-muted)] font-arabic-body text-sm">{t("no_results")}</p>
                </div>
            ) : layout === "wide" ? (
                <div className="space-y-3">
                    {listings.map((l, i) => (
                        <Fragment key={l.id}>
                            <WideListingCard listing={l} />
                            {i === 4 && <AdSlotInline />}
                        </Fragment>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {listings.map((l, i) => (
                        <Fragment key={l.id}>
                            <ListingCard listing={l} compact />
                            {(i === 7 || i === 15) && <AdSlotInline />}
                        </Fragment>
                    ))}
                </div>
            )}

            {/* Infinite-scroll sentinel + skeleton row for next page */}
            {!loading && hasMore && (
                <div ref={sentinelRef} className="mt-4">
                    {loadingMore && (
                        <div className={layout === "wide" ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className={`${layout === "wide" ? "h-28" : "aspect-[4/3]"} rounded-2xl bg-[var(--surface-elevated)] animate-pulse`}></div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function AdSlotInline() {
    const { t, tr } = useI18n();
    const [ads, setAds] = useState([]);
    useEffect(() => { api.get("/ads", { params: { placement: "home_middle" } }).then(({ data }) => setAds(data || [])).catch(() => {}); }, []);
    if (!ads.length) return null;
    const ad = ads[0];
    return (
        <a href={ad.link_url || "#"} target="_blank" rel="noopener noreferrer" data-testid="ad-inline" className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] transition-all relative block">
            <div className="aspect-[4/3] overflow-hidden">
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="p-2.5">
                <div className="flex items-center gap-1 mb-1">
                    <span className="bg-[var(--accent)]/15 text-[var(--accent)] text-[8px] font-bold px-1.5 py-0.5 rounded font-arabic">{t("ad_label")}</span>
                </div>
                <h3 className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2">{ad.title}</h3>
            </div>
        </a>
    );
}

function WideListingCard({ listing }) {
    return (
        <Link to={`/listing/${listing.id}`} className="group flex bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all">
            <div className="w-32 sm:w-48 shrink-0 aspect-square overflow-hidden bg-[var(--surface-elevated)]">
                {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs font-arabic">{tr("لا توجد صورة")}</div>}
            </div>
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                <div>
                    <h3 className="font-arabic font-bold text-sm sm:text-base text-[var(--text)] line-clamp-2 mb-1 group-hover:text-[var(--primary)]">{listing.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-2">{listing.description}</p>
                </div>
                <div className="flex items-baseline justify-between mt-2 gap-2">
                    <div>
                        {listing.price ? (
                            <span className="font-latin font-black text-lg sm:text-xl text-[var(--primary)]">{Number(listing.price).toLocaleString()} <span className="text-xs">{listing.currency}</span></span>
                        ) : <span className="text-xs text-[var(--text-muted)] font-arabic">{tr("على السوم")}</span>}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-arabic-body truncate">{listing.city}</span>
                </div>
            </div>
        </Link>
    );
}

function CTASection({ t, user }) {
    if (user) return null;
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 mt-6">
            <div className="rounded-3xl bg-gradient-to-r from-[var(--secondary)] to-[#1A2952] dark:from-[var(--surface)] dark:to-[var(--surface-elevated)] p-5 sm:p-10 border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl"></div>
                <div className="relative">
                    <h3 className="font-arabic font-black text-lg sm:text-2xl text-white dark:text-[var(--text)] mb-2">{tr("انضم اليوم — مجاناً تماماً")}</h3>
                    <p className="text-white/80 dark:text-[var(--text-muted)] font-arabic-body mb-4 text-xs sm:text-sm">{tr("سجّل في دقيقة وابدأ البيع والشراء")}</p>
                    <Link to="/register" data-testid="cta-register-btn" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-5 py-2 font-bold text-xs sm:text-sm hover:bg-[var(--primary-hover)] font-arabic">{t("register")}</Link>
                </div>
            </div>
        </section>
    );
}
