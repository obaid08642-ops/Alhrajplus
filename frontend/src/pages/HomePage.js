import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Icons from "lucide-react";
import { Plus, Sparkles } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import AdSlot from "@/components/listings/AdSlot";

const HERO_BG = "https://images.unsplash.com/photo-1709626011483-5bb4b5470ac9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

export default function HomePage() {
    const { t, pickName } = useI18n();
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [layout, setLayout] = useState(localStorage.getItem("hp_layout") || "grid");

    useEffect(() => { localStorage.setItem("hp_layout", layout); }, [layout]);

    useEffect(() => {
        const load = async () => {
            try {
                const [cats, lists] = await Promise.all([
                    api.get("/meta/categories"),
                    api.get("/listings", { params: { country_code: user?.country_code, limit: 24 } })
                ]);
                setCategories(cats.data);
                setListings(lists.data.items || []);
            } catch (_) {} finally { setLoading(false); }
        };
        load();
    }, [user]);

    return (
        <div className="space-y-6 sm:space-y-10 pb-6">
            <Hero t={t} />
            <CategoriesGrid categories={categories} t={t} pickName={pickName} />
            <AdSlot placement="home_top" className="max-w-7xl mx-auto px-4 sm:px-6" />
            <NearbySection listings={listings} loading={loading} t={t} layout={layout} setLayout={setLayout} />
            <AdSlot placement="home_middle" className="max-w-7xl mx-auto px-4 sm:px-6" />
            <CTASection t={t} user={user} />
        </div>
    );
}

function Hero({ t }) {
    return (
        <section className="max-w-7xl mx-auto mt-4 px-3 sm:px-6">
            <div className="relative rounded-3xl overflow-hidden h-[220px] sm:h-[300px] grain-overlay shadow-lg">
                <img src={HERO_BG} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-[var(--secondary)]/85 via-[var(--secondary)]/45 to-transparent"></div>
                <div className="relative h-full flex flex-col justify-center p-5 sm:p-12 max-w-2xl">
                    <span className="inline-flex items-center gap-2 bg-[var(--primary)]/20 backdrop-blur-md border border-[var(--primary)]/30 text-white rounded-full px-3 py-1.5 text-xs font-bold w-fit mb-3 font-arabic">
                        <Sparkles className="w-3.5 h-3.5" /> مدعوم بالذكاء الاصطناعي
                    </span>
                    <h1 className="font-arabic font-black text-2xl sm:text-5xl text-white leading-[1.1] tracking-tight mb-2 sm:mb-3">
                        كل ما تحتاجه<br/>
                        <span className="text-[var(--primary)]">في مكان واحد</span>
                    </h1>
                    <p className="text-white/85 text-xs sm:text-base font-arabic-body mb-4 max-w-md">
                        أكثر من 500K إعلان حقيقي حولك في الخليج
                    </p>
                    <div className="flex gap-2 sm:gap-3">
                        <Link to="/post" data-testid="hero-post-btn" className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 font-arabic">
                            <Plus className="w-4 h-4" /> {t("cta_post")}
                        </Link>
                        <Link to="/search" data-testid="hero-explore-btn" className="bg-white/10 backdrop-blur border border-white/30 text-white rounded-full px-4 sm:px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm hover:bg-white/20 transition-all font-arabic">
                            {t("cta_explore")}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CategoriesGrid({ categories, t, pickName }) {
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
                <div>
                    <h2 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)]">{t("sec_categories")}</h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body mt-0.5">{t("sec_categories_sub")}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-2.5 sm:gap-4">
                {categories.map((c, i) => {
                    const Icon = Icons[c.icon] || Icons.Shapes;
                    return (
                        <Link
                            key={c.key}
                            to={`/category/${c.key}`}
                            data-testid={`cat-${c.key}`}
                            className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-2 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-[var(--primary)] hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                            style={{ animationDelay: `${i * 25}ms` }}
                        >
                            <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-[var(--primary)]/15 group-hover:bg-[var(--primary)]/25 flex items-center justify-center transition-all">
                                <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--primary)]" strokeWidth={2.2} />
                            </div>
                            <span className="relative font-arabic font-bold text-xs sm:text-base text-[var(--text)] text-center">{pickName(c)}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function NearbySection({ listings, loading, t, layout, setLayout }) {
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex items-center justify-between mb-3 sm:mb-5 gap-2">
                <div>
                    <h2 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)]">{t("sec_nearby")}</h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body mt-0.5">{t("sec_nearby_sub")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[var(--surface-elevated)] rounded-full p-1 flex border border-[var(--border)]">
                        <button data-testid="layout-grid" onClick={() => setLayout("grid")} className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-arabic font-bold transition-all ${layout === "grid" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "text-[var(--text-muted)]"}`}>{t("layout_grid")}</button>
                        <button data-testid="layout-wide" onClick={() => setLayout("wide")} className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-arabic font-bold transition-all ${layout === "wide" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "text-[var(--text-muted)]"}`}>{t("layout_wide")}</button>
                    </div>
                    <Link to="/search" data-testid="view-all-listings" className="text-xs sm:text-sm text-[var(--primary)] font-bold font-arabic">{t("view_all")} →</Link>
                </div>
            </div>
            {loading ? (
                <div className={layout === "wide" ? "space-y-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`${layout === "wide" ? "h-28" : "aspect-[4/3]"} rounded-2xl bg-[var(--surface-elevated)] animate-pulse`}></div>
                    ))}
                </div>
            ) : listings.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)]">
                    <p className="text-[var(--text-muted)] font-arabic-body">{t("no_results")} — كن أول من ينشر!</p>
                </div>
            ) : layout === "wide" ? (
                <div className="space-y-3">
                    {listings.map((l) => <WideListingCard key={l.id} listing={l} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {listings.map((l) => <ListingCard key={l.id} listing={l} compact />)}
                </div>
            )}
        </section>
    );
}

function WideListingCard({ listing }) {
    return (
        <Link to={`/listing/${listing.id}`} data-testid={`wide-listing-${listing.id}`} className="group flex bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all">
            <div className="w-32 sm:w-48 shrink-0 aspect-square overflow-hidden bg-[var(--surface-elevated)]">
                {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">لا توجد صورة</div>}
            </div>
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                <div>
                    <h3 className="font-arabic font-bold text-sm sm:text-base text-[var(--text)] line-clamp-2 mb-1 group-hover:text-[var(--primary)]">{listing.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-2">{listing.description}</p>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                    <div>
                        {listing.price ? (
                            <span className="font-latin font-black text-lg sm:text-xl text-[var(--primary)]">{Number(listing.price).toLocaleString()} <span className="text-xs">{listing.currency}</span></span>
                        ) : <span className="text-xs text-[var(--text-muted)] font-arabic">على السوم</span>}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-arabic-body">{listing.city}</span>
                </div>
            </div>
        </Link>
    );
}

function CTASection({ t, user }) {
    if (user) return null;
    return (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 mt-8">
            <div className="rounded-3xl bg-gradient-to-r from-[var(--secondary)] to-[var(--surface-elevated)] dark:from-[var(--surface)] dark:to-[var(--surface-elevated)] p-6 sm:p-12 border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl"></div>
                <div className="relative">
                    <h3 className="font-arabic font-black text-xl sm:text-3xl text-white dark:text-[var(--text)] mb-2">انضم اليوم — مجاناً تماماً</h3>
                    <p className="text-white/80 dark:text-[var(--text-muted)] font-arabic-body mb-5 text-sm">سجّل في دقيقة وابدأ البيع والشراء</p>
                    <Link to="/register" data-testid="cta-register-btn" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-6 py-3 font-bold text-sm hover:bg-[var(--primary-hover)] font-arabic">{t("register")}</Link>
                </div>
            </div>
        </section>
    );
}
