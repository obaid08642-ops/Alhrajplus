import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import ListingCard from "@/components/listings/ListingCard";
import { Search as SearchIcon, Mic } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Hologram pin: floating, glowing price chip with concentric rings
function buildHologramIcon({ price, currency }) {
    const display = price ? Number(price).toLocaleString() : "★";
    const sub = price ? (currency || "ر.س") : "إعلان";
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
    const { t, tr } = useI18n();
    const [q, setQ] = useState(searchParams.get("q") || "");
    const [results, setResults] = useState([]);
    const [fuzzy, setFuzzy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);

    useEffect(() => {
        const search = async () => {
            setLoading(true);
            try {
                const params = { q: q || undefined, country_code: user?.country_code, limit: 30 };
                const { data } = await api.get("/listings", { params });
                setResults(data.items);
                setFuzzy(Boolean(data.fuzzy));
            } catch (_) {} finally { setLoading(false); }
        };
        search();
    }, [q, user]);

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
            </div>

            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">{q ? `نتائج: "${q}"` : "كل الإعلانات"} <span className="text-sm text-[var(--text-muted)]">({results.length})</span></h2>

            {fuzzy && q && results.length > 0 && (
                <div data-testid="fuzzy-match-banner" className="mb-3 px-4 py-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl text-sm text-[var(--text)] font-arabic-body flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>{tr("لم نجد نتائج مطابقة بالضبط، عرضنا نتائج مشابهة لـ")} <strong>"{q}"</strong></span>
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
    const [items, setItems] = useState([]);
    const [myPos, setMyPos] = useState(null);
    const center = [24.7136, 46.6753];

    useEffect(() => {
        api.get("/listings/map/nearby", { params: { country_code: user?.country_code, limit: 200 } })
            .then(({ data }) => setItems(data));
    }, [user]);

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
                <button data-testid="map-locate-btn" onClick={locate} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 py-2 font-bold text-xs flex items-center gap-1.5 font-arabic">
                    📍 موقعي الحالي
                </button>
            </div>
            <div className="h-[70vh] rounded-3xl overflow-hidden border border-[var(--border)]">
                <MapContainer center={myPos || (items[0] ? [items[0].lat, items[0].lng] : center)} zoom={myPos ? 13 : (items.length ? 10 : 6)} className="w-full h-full" key={myPos ? myPos.join(",") : "default"}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    {myPos && <Marker position={myPos} icon={buildMyLocationIcon()}><Popup>{tr("موقعك الحالي")}</Popup></Marker>}
                    {items.map((it) => (
                        <Marker key={it.id} position={[it.lat, it.lng]} icon={buildHologramIcon({ price: it.price, currency: it.currency })}>
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
