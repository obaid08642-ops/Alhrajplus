import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Heart, MessageCircle, Share2, ChevronUp, ChevronDown, Volume2, VolumeX, ArrowLeft, Clapperboard, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";

export default function ReelsPage() {
    const nav = useNavigate();
    const { user } = useAuth();
    const { country, dataVersion } = useCountry();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [active, setActive] = useState(0);
    const [muted, setMuted] = useState(true);
    const [favs, setFavs] = useState({}); // {listingId: bool}
    const refs = useRef([]);

    const loadReels = useCallback(async (signal) => {
        setLoading(true);
        setLoadError("");
        try {
            const { data } = await api.get("/listings", { params: { limit: 30, country_code: country || "SA" }, signal });
            const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
            const withVideos = items.map((listing) => {
                const videos = Array.isArray(listing?.videos) && listing.videos.length
                    ? listing.videos
                    : [listing?.video_url || listing?.video].filter(Boolean);
                return videos.length ? { ...listing, videos } : null;
            }).filter(Boolean);
            setReels(withVideos);
            setActive(0);
        } catch (err) {
            if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError") return;
            setReels([]);
            setLoadError(tr("تعذر تحميل الفيديوهات"));
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [country]);

    useEffect(() => {
        const ctrl = new AbortController();
        loadReels(ctrl.signal);
        return () => ctrl.abort();
    }, [loadReels, dataVersion]);

    useEffect(() => {
        refs.current.forEach((v, i) => {
            if (!v) return;
            if (i === active) v.play().catch(() => {}); else v.pause();
        });
    }, [active, reels]);

    const onScroll = (e) => {
        const idx = Math.round(e.target.scrollTop / e.target.clientHeight);
        if (idx !== active) setActive(idx);
    };

    const toggleFav = async (l) => {
        if (!user) return nav("/login");
        try {
            const { data } = await api.post(`/favorites/${l.id}`);
            setFavs((f) => ({ ...f, [l.id]: data.favorited }));
        } catch (_) {}
    };

    const messageSeller = (l) => {
        if (!user) return nav("/login");
        nav(`/chat?to=${l.user_id}&listing=${l.id}`);
    };

    const shareReel = async (l) => {
        const url = `${window.location.origin}/listing/${l.id}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: l.title, text: `${l.title} - الحراج بلس`, url });
            } else {
                await navigator.clipboard.writeText(url);
                alert(tr("✅ تم نسخ رابط الإعلان"));
            }
        } catch (_) {}
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
            <div className="text-center max-w-md px-4">
                <Clapperboard className="w-16 h-16 text-[var(--primary)] mx-auto mb-3 animate-pulse" strokeWidth={1.7} />
                <p className="font-arabic font-bold text-[var(--text)]">{tr("جاري تحميل الفيديوهات...")}</p>
            </div>
        </div>
    );

    if (loadError) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
                <Clapperboard className="w-16 h-16 text-[var(--danger)] mx-auto mb-3" strokeWidth={1.7} />
                <p className="font-arabic font-bold text-[var(--text)] mb-4">{loadError}</p>
                <button onClick={() => loadReels()} className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("إعادة المحاولة")}</button>
            </div>
        </div>
    );

    if (reels.length === 0) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
                <Clapperboard className="w-16 h-16 text-[var(--primary)] mx-auto mb-3" strokeWidth={1.7} />
                <h2 className="font-arabic font-black text-2xl text-[var(--text)] mb-2">{tr("لا توجد فيديوهات متاحة الآن")}</h2>
                <p className="text-sm text-[var(--text-muted)] font-arabic-body mb-4">{tr("لا توجد فيديوهات بعد. كن أول من يرفع فيديو لمنتجاته!")}</p>
                <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("أنشر إعلان بفيديو")}</Link>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-x-0 top-16 bottom-16 sm:relative sm:inset-auto sm:h-[calc(100vh-160px)] sm:max-w-md sm:mx-auto sm:rounded-3xl sm:overflow-hidden bg-black">
            {/* Back + Upload buttons */}
            <button data-testid="reels-back-btn" onClick={() => nav(-1)} aria-label={tr("رجوع")} className="absolute top-3 start-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" strokeWidth={2.8} />
                <span className="text-xs font-arabic font-bold">{tr("ارفع ستوري")}</span>
            </Link>

            <div onScroll={onScroll} className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
                {reels.map((l, i) => (
                    <div key={l.id} className="h-full w-full snap-start relative flex items-center justify-center">
                        <video ref={(el) => (refs.current[i] = el)} src={l.videos[0]} loop muted={muted} playsInline className="w-full h-full object-cover" />
                        {/* Overlay info */}
                        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 via-black/60 to-transparent">
                            <Link to={`/listing/${l.id}`} className="block text-white mb-3">
                                <h3 className="font-arabic font-bold text-base line-clamp-2 mb-1">{l.title}</h3>
                                {l.price && <div className="font-latin font-black text-xl text-[var(--primary)]">{Number(l.price).toLocaleString()} {l.currency}</div>}
                                <div className="text-xs text-white/70 font-arabic-body">{l.city}</div>
                            </Link>
                            {/* Twin CTA row — owner mandate: never leave the
                                bottom of the reel empty. Primary = view ad,
                                Accent = chat with seller. */}
                            <div className="flex gap-2">
                                <Link
                                    to={`/listing/${l.id}`}
                                    data-testid={`reel-open-${l.id}`}
                                    className="flex-1 text-center bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] py-3 rounded-2xl font-arabic font-black text-sm shadow-lg shadow-[var(--primary)]/30 active:scale-95 transition-all"
                                >
                                    {tr("عرض الإعلان")}
                                </Link>
                                <button
                                    onClick={() => messageSeller(l)}
                                    data-testid={`reel-contact-${l.id}`}
                                    className="flex-1 text-center bg-[var(--accent)] hover:opacity-90 text-white py-3 rounded-2xl font-arabic font-black text-sm shadow-lg shadow-[var(--accent)]/30 active:scale-95 transition-all"
                                >
                                    {tr("تواصل مع البائع")}
                                </button>
                            </div>
                        </div>
                        {/* Right action bar */}
                        <div className="absolute end-3 bottom-32 flex flex-col gap-4 text-white">
                            <button data-testid={`reel-fav-${l.id}`} onClick={() => toggleFav(l)} className="flex flex-col items-center gap-1"><div className={`w-11 h-11 rounded-full backdrop-blur flex items-center justify-center ${favs[l.id] ? "bg-red-500" : "bg-white/15"}`}><Heart className={`w-5 h-5 ${favs[l.id] ? "fill-white" : ""}`} /></div><span className="text-[10px]">{tr("مفضلة")}</span></button>
                            <button data-testid={`reel-msg-${l.id}`} onClick={() => messageSeller(l)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div><span className="text-[10px]">{tr("رسالة")}</span></button>
                            <button data-testid={`reel-share-${l.id}`} onClick={() => shareReel(l)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Share2 className="w-5 h-5" /></div><span className="text-[10px]">{tr("شارك")}</span></button>
                            <button onClick={() => setMuted(!muted)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</div></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
