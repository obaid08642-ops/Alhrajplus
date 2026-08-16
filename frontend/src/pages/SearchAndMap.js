import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import ListingCard from "@/components/listings/ListingCard";
import LocationPicker from "@/components/LocationPicker";
import { Search as SearchIcon, Mic } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Category emoji map (mirrors web categories)
// ============================================================
// Category-specific SVG icons for map pins. Lucide-equivalent paths, inlined
// as 14px white glyphs so they render crisp at any DPR. Replaces flat emoji
// (😀 don't always render in Leaflet divIcon on Safari + old Android Chrome).
// Stroke=2 with linejoin=round matches the lucide-react aesthetic the rest
// of the app uses.
// ============================================================
const SVG_BASE = "stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"";
const CATEGORY_SVG = {
    cars: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M19 17h2v-3.28a1.81 1.81 0 0 0-1.06-1.66l-1.66-.76l-1.21-1.95A1.94 1.94 0 0 0 15.39 8H8.61a2 2 0 0 0-1.7.95L5.71 11l-1.66.74A1.85 1.85 0 0 0 3 13.5V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
    motors: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 17.5h-5L8 11l4-3 4 6"/></svg>`,
    real_estate: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    apartments: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>`,
    electronics: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    mobiles: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    computers: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    furniture: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M3 18v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6"/><path d="M2 21v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/><path d="M4 18h16"/></svg>`,
    fashion: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`,
    jewelry: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="11" y1="3" x2="8" y2="9"/><line x1="13" y1="3" x2="16" y2="9"/><line x1="2" y1="9" x2="22" y2="9"/></svg>`,
    jobs: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    services: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    sports: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/></svg>`,
    games: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"/></svg>`,
    books: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    food: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M3 11h18M3 11l1 7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-7"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    pets: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10z"/></svg>`,
    baby: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="12" cy="12" r="10"/><path d="M9 12h.01M15 12h.01M9.5 16a3.5 3.5 0 0 0 5 0"/></svg>`,
    beauty: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
    industrial: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>`,
    agricultural: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5a4 4 0 0 0 6 0a5.5 5.5 0 0 1 3.3-1.5c1.71.06 3.13.74 4 2.2"/><path d="M2 16c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5a4 4 0 0 0 6 0a5.5 5.5 0 0 1 3.3-1.5c1.71.06 3.13.74 4 2.2"/><path d="M12 2v6M9 5l3 3 3-3"/></svg>`,
    art: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="13.5" cy="6.5" r=".5" fill="white"/><circle cx="17.5" cy="10.5" r=".5" fill="white"/><circle cx="8.5" cy="7.5" r=".5" fill="white"/><circle cx="6.5" cy="12.5" r=".5" fill="white"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    auction: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`,
    general: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
};

function svgForCategory(category) {
    return CATEGORY_SVG[category] || CATEGORY_SVG.general;
}

// Hologram pin: floating, glowing price chip + category SVG icon
function buildHologramIcon({ price, currency, category }) {
    const display = price ? Number(price).toLocaleString() : "★";
    const sub = price ? (currency || "ر.س") : (category || "—");
    const svg = svgForCategory(category);
    return L.divIcon({
        className: "hologram-pin-wrap",
        iconSize: [78, 78],
        iconAnchor: [39, 70],
        popupAnchor: [0, -64],
        html: `
          <div class="hologram-pin">
            <div class="hp-ring hp-ring-1"></div>
            <div class="hp-ring hp-ring-2"></div>
            <div class="hp-chip">
              <div class="hp-emoji" style="display:flex;align-items:center;justify-content:center;margin-bottom:2px">${svg}</div>
              <div class="hp-price">${display}</div>
              <div class="hp-curr">${sub}</div>
            </div>
            <div class="hp-stem"></div>
            <div class="hp-base"></div>
          </div>
        `,
    });
}

function buildMyLocationIcon() {
    return L.divIcon({
        className: "hologram-pin-wrap",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: `<div class="me-pin"><div class="me-core"></div><div class="me-pulse"></div></div>`,
    });
}

export function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { country } = useCountry();
    const { t, tr } = useI18n();
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [results, setResults] = useState([]);
    const [fuzzy, setFuzzy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
    const [days, setDays] = useState(searchParams.get("days") || "");
    const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
    const [locationFilter, setLocationFilter] = useState({});
    const [userLoc, setUserLoc] = useState(null);

    useEffect(() => {
        if ((sortBy === "nearest" || sortBy === "farthest") && navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserLoc(null),
                { timeout: 4000 }
            );
        }
    }, [sortBy]);

    useEffect(() => {
        // Debounce search input by 300ms and cancel any previous in-flight request.
        const ctrl = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const params = { q: q || undefined, country_code: user?.country_code, limit: 30, sort: sortBy };
                if (days) params.days = days;
                if (minPrice) params.min_price = minPrice;
                if (maxPrice) params.max_price = maxPrice;
                // Geonames-backed location filter — pick the deepest selected level as the `city` server filter.
                const leaf = locationFilter?.city || locationFilter?.adm3 || locationFilter?.adm2 || locationFilter?.adm1;
                if (leaf?.name) params.city = leaf.name;
                if ((sortBy === "nearest" || sortBy === "farthest") && userLoc) {
                    params.lat = userLoc.lat;
                    params.lng = userLoc.lng;
                }
                const { data } = await api.get("/listings", { params, signal: ctrl.signal });
                setResults(data.items);
                setFuzzy(Boolean(data.fuzzy));
                // Log a search event so the smart-notif worker can re-engage the user
                // if they bounce. Fire-and-forget; ignore errors for guests / aborts.
                if (q && q.trim().length >= 2) {
                    api.post("/users/me/search-event", {
                        query: q.trim(),
                        city: user?.city || "",
                        results_count: (data.items || []).length,
                    }).catch(() => {});
                }
            } catch (_) { /* ignore — search aborted or transient network */ } finally { setLoading(false); }
        }, 300);
        return () => { clearTimeout(timer); ctrl.abort(); };
    }, [q, user, sortBy, days, minPrice, maxPrice, userLoc, country, locationFilter]);

    const startVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            alert(tr("المتصفح لا يدعم البحث الصوتي"));
            return;
        }
        const r = new SR();
        r.lang = "ar-SA";
        r.continuous = false;
        r.interimResults = false;
        setVoiceActive(true);
        r.onresult = (e) => {
            const text = e.results[0][0].transcript;
            setQ(text);
            setSearchParams({ q: text });
            setVoiceActive(false);
        };
        r.onerror = () => setVoiceActive(false);
        r.onend = () => setVoiceActive(false);
        r.start();
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="bg-[var(--surface)] rounded-3xl p-4 border border-[var(--border)] mb-5 sticky top-20 z-30 backdrop-blur-xl">
                <div className="flex items-center bg-[var(--surface-elevated)] rounded-full px-4 py-2.5 border border-[var(--border)] focus-within:border-[var(--primary)]">
                    <SearchIcon className="w-4 h-4 text-[var(--text-muted)]" />
                    <input data-testid="search-page-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSearchParams({ q })} placeholder={t("search_placeholder")} className="bg-transparent flex-1 mx-3 outline-none text-sm text-[var(--text)] font-arabic-body" />
                    <button data-testid="voice-search-btn-page" onClick={startVoice} className={`text-[var(--text-muted)] hover:text-[var(--primary)] ${voiceActive ? "animate-pulse text-[var(--danger)]" : ""}`}><Mic className="w-4 h-4" /></button>
                </div>
                {/* Filter pills */}
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <button data-testid="toggle-filters-btn" onClick={() => setShowFilters(s => !s)} className="px-3 py-1.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-bold font-arabic hover:bg-[var(--primary)]/25">
                        {showFilters ? tr("إخفاء الفلاتر") : tr("الفلاتر")}
                    </button>
                    <select data-testid="search-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text)] font-arabic">
                        <option value="newest">{tr("الأحدث")}</option>
                        <option value="oldest">{tr("الأقدم")}</option>
                        <option value="price_asc">{tr("الأرخص")}</option>
                        <option value="price_desc">{tr("الأغلى")}</option>
                        <option value="popular">{tr("الأكثر مشاهدة")}</option>
                        <option value="nearest">{tr("الأقرب")}</option>
                        <option value="farthest">{tr("الأبعد")}</option>
                    </select>
                    <select data-testid="search-days" value={days} onChange={(e) => setDays(e.target.value)} className="px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text)] font-arabic">
                        <option value="">{tr("كل الوقت")}</option>
                        <option value="1">{tr("آخر يوم")}</option>
                        <option value="7">{tr("آخر أسبوع")}</option>
                        <option value="30">{tr("آخر شهر")}</option>
                    </select>
                </div>
                {showFilters && (
                    <div data-testid="filter-panel" className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <input data-testid="filter-min" type="number" placeholder={tr("السعر من")} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                            <input data-testid="filter-max" type="number" placeholder={tr("السعر إلى")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                        </div>
                        {/* Geonames cascading location filter (محافظة → مركز → حي → قرية for EG) */}
                        <LocationPicker country={country || "EG"} value={locationFilter} onChange={setLocationFilter} />
                        {Object.keys(locationFilter).length > 0 && (
                            <button type="button" data-testid="clear-location-filter" onClick={() => setLocationFilter({})} className="text-[11px] font-arabic text-[var(--danger)] hover:underline">
                                {tr("مسح فلتر الموقع")}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">{q ? `نتائج: "${q}"` : "كل الإعلانات"} <span className="text-sm text-[var(--text-muted)]">({results.length})</span></h2>

            {fuzzy && q && results.length > 0 && (
                <div data-testid="fuzzy-match-banner" className="mb-3 px-4 py-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl text-sm text-[var(--text)] font-arabic-body flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>{tr("لم نجد نتائج مطابقة بالضبط، عرضنا نتائج مشابهة لـ")} <strong>&ldquo;{q}&rdquo;</strong></span>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-[var(--surface-elevated)] animate-pulse"></div>)}
                </div>
            ) : results.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-10 text-center border border-[var(--border)]">
                    <p className="text-[var(--text-muted)] font-arabic-body">{t("no_results")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {results.map((l) => <ListingCard key={l.id} listing={l} compact />)}
                </div>
            )}
        </div>
    );
}

export function MapPage() {
    const { user } = useAuth();
    const { country } = useCountry();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [myPos, setMyPos] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("");
    const center = [24.7136, 46.6753];

    useEffect(() => {
        const params = { limit: 200 };
        if (country) params.country_code = country;
        if (categoryFilter) params.category = categoryFilter;
        setLoading(true);
        setLoadError("");
        api.get("/listings/map/nearby", { params })
            .then(({ data }) => {
                const next = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
                setItems(next);
                if (!Array.isArray(data) && !Array.isArray(data?.items)) setLoadError(tr("تعذر قراءة بيانات الخريطة"));
            })
            .catch(() => { setItems([]); setLoadError(tr("تعذر تحميل الإعلانات على الخريطة")); })
            .finally(() => setLoading(false));
    }, [country, categoryFilter]);

    const locate = () => {
        if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
            () => alert(tr("تعذر الوصول للموقع"))
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="flex items-center justify-between mb-3">
                <h1 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)]">{tr("الإعلانات على الخريطة")}</h1>
                <div className="flex items-center gap-2">
                    <select data-testid="map-category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-full px-3 py-2 text-xs font-arabic">
                        <option value="">{tr("كل الفئات")}</option>
                        <option value="cars">{tr("سيارات")}</option>
                        <option value="realestate">{tr("عقارات")}</option>
                        <option value="phones">{tr("جوالات")}</option>
                        <option value="electronics">{tr("إلكترونيات")}</option>
                        <option value="jobs">{tr("وظائف")}</option>
                        <option value="services">{tr("خدمات")}</option>
                        <option value="furniture">{tr("أثاث")}</option>
                        <option value="livestock">{tr("مواشي")}</option>
                    </select>
                    <button data-testid="map-locate-btn" onClick={locate} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 py-2 font-bold text-xs flex items-center gap-1.5 font-arabic">
                        {tr("موقعي الحالي")}
                    </button>
                </div>
            </div>
            <div className="h-[70vh] rounded-3xl overflow-hidden border border-[var(--border)]">
                {loading && <div className="absolute z-[1000] m-3 rounded-full bg-[var(--surface)]/90 px-3 py-2 text-xs font-arabic shadow">{tr("جاري تحميل الخريطة...")}</div>}
                {loadError && <div className="absolute z-[1000] left-1/2 -translate-x-1/2 mt-3 rounded-xl bg-red-50 text-red-700 px-3 py-2 text-xs font-arabic shadow">{loadError}</div>}
                <MapContainer center={myPos || (items[0] ? [items[0].lat, items[0].lng] : center)} zoom={myPos ? 13 : (items.length ? 10 : 6)} className="w-full h-full" key={myPos ? myPos.join(",") : "default"}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    {myPos && <Marker position={myPos} icon={buildMyLocationIcon()}><Popup>{tr("موقعك الحالي")}</Popup></Marker>}
                    {(Array.isArray(items) ? items : []).map((it) => (
                        <Marker key={it.id} position={[it.lat, it.lng]} icon={buildHologramIcon({ price: it.price, currency: it.currency, category: it.category })}>
                            <Popup>
                                <div className="font-arabic">
                                    <div className="font-bold text-sm">{it.title}</div>
                                    {it.price && <div className="text-[var(--primary)] font-bold">{Number(it.price).toLocaleString()} {it.currency}</div>}
                                    <Link to={`/listing/${it.id}`} className="text-xs text-[var(--primary)] underline">{tr("عرض الإعلان")}</Link>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
