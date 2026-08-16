import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import ListingCard from "@/components/listings/ListingCard";
import AdSlot from "@/components/listings/AdSlot";
import { Filter, ChevronLeft } from "lucide-react";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { PremiumCategoryIcon } from "@/lib/categoryIcons";

export default function CategoryPage() {
    const { categoryKey } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { country } = useCountry();
    const { t, pickName, tr, lang } = useI18n();
    const [category, setCategory] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        subcategory: searchParams.get("sub") || "",
        city: searchParams.get("city") || "",
        min_price: searchParams.get("min") || "",
        max_price: searchParams.get("max") || "",
        sort: searchParams.get("sort") || "newest",
        days: searchParams.get("days") || "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [userLoc, setUserLoc] = useState(null);

    // Cache geolocation once so nearest/farthest sort works
    useEffect(() => {
        if (navigator?.geolocation && (filters.sort === "nearest" || filters.sort === "farthest")) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserLoc(null),
                { timeout: 4000 }
            );
        }
    }, [filters.sort]);

    useEffect(() => {
        api.get("/meta/categories", { params: { lang } }).then(({ data }) => {
            setCategory(data.find((c) => c.key === categoryKey));
        });
    }, [categoryKey, lang]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = {
                    category: categoryKey,
                    limit: 30,
                };
                if (country) params.country_code = country;
                if (filters.subcategory) params.subcategory = filters.subcategory;
                if (filters.city) params.city = filters.city;
                if (filters.min_price) params.min_price = filters.min_price;
                if (filters.max_price) params.max_price = filters.max_price;
                if (filters.sort) params.sort = filters.sort;
                if (filters.days) params.days = filters.days;
                if ((filters.sort === "nearest" || filters.sort === "farthest") && userLoc) {
                    params.lat = userLoc.lat;
                    params.lng = userLoc.lng;
                }
                const { data } = await api.get("/listings", { params });
                setListings(data.items || []);
            } catch (_) {} finally { setLoading(false); }
        };
        load();
    }, [categoryKey, user, filters, userLoc, country]);

    const updateFilter = (k, v) => {
        const newF = { ...filters, [k]: v };
        setFilters(newF);
        const params = {};
        Object.entries(newF).forEach(([key, val]) => {
            if (!val) return;
            const shortKey = key === "subcategory" ? "sub" : key === "min_price" ? "min" : key === "max_price" ? "max" : key;
            params[shortKey] = val;
        });
        setSearchParams(params);
    };

    if (!category) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Link to="/" className="text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronLeft className="w-5 h-5 rotate-180" /></Link>
                <div>
                    <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)]">{pickName(category)}</h1>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body">{listings.length} إعلان</p>
                </div>
                <button data-testid="toggle-filters" onClick={() => setShowFilters(!showFilters)} className="ms-auto flex items-center gap-1.5 bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text)] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-[var(--border)] transition-all font-arabic">
                    <Filter className="w-3.5 h-3.5" /> فلترة
                </button>
            </div>

            {/* Subcategories chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2">
                <button data-testid="sub-all" onClick={() => updateFilter("subcategory", "")} className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-arabic font-bold border ${!filters.subcategory ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"}`}>{tr("الكل")}</button>
                {category.subcategories?.map((s) => (
                    <button key={s.key} data-testid={`sub-${s.key}`} onClick={() => updateFilter("subcategory", s.key)} className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-arabic font-bold border ${filters.subcategory === s.key ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"}`}>
                        <PremiumCategoryIcon categoryKey={categoryKey} subcategoryKey={s.key} size={16} className="text-[var(--primary)]" />
                        <span>{pickName(s)}</span>
                    </button>
                ))}
            </div>

            {showFilters && (
                <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-3 font-arabic-body">
                    <input data-testid="filter-min-price" type="number" placeholder={tr("السعر من")} value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                    <input data-testid="filter-max-price" type="number" placeholder={tr("السعر إلى")} value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                    <input data-testid="filter-city" type="text" placeholder={tr("المدينة")} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                    <select data-testid="filter-sort" value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none">
                        <option value="newest">{tr("الأحدث")}</option>
                        <option value="oldest">{tr("الأقدم")}</option>
                        <option value="price_asc">{tr("السعر: من الأقل")}</option>
                        <option value="price_desc">{tr("السعر: من الأعلى")}</option>
                        <option value="popular">{tr("الأكثر مشاهدة")}</option>
                        <option value="nearest">{tr("الأقرب")}</option>
                        <option value="farthest">{tr("الأبعد")}</option>
                    </select>
                    <select data-testid="filter-days" value={filters.days} onChange={(e) => updateFilter("days", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none">
                        <option value="">{tr("كل الوقت")}</option>
                        <option value="1">{tr("آخر يوم")}</option>
                        <option value="7">{tr("آخر أسبوع")}</option>
                        <option value="30">{tr("آخر شهر")}</option>
                    </select>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-[var(--surface-elevated)] animate-pulse"></div>)}
                </div>
            ) : listings.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-10 text-center border border-[var(--border)]">
                    <p className="text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات في هذه الفئة بعد")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {listings.map((l, i) => (
                        <ListingCard key={l.id} listing={l} compact />
                    ))}
                </div>
            )}
            <div className="mt-6">
                <AdSlot placement="home_middle" />
            </div>
        </div>
    );
}
