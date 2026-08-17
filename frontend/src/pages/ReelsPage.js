import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Heart, MessageCircle, Share2, ChevronUp, ChevronDown, Volume2, VolumeX, ArrowLeft, Clapperboard, Plus, Pause, Play } from "lucide-react";
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
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState({});
    const refs = useRef([]);
    const scrollerRef = useRef(null);

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
            if (i === active && !paused) v.play().catch(() => {}); else v.pause();
        });
    }, [active, reels, paused]);

    const onScroll = (e) => {
        const idx = Math.round(e.target.scrollTop / e.target.clientHeight);
        if (idx !== active) { setActive(idx); setPaused(false); }
    };
    const goTo = (index) => {
        const next = Math.max(0, Math.min(reels.length - 1, index));
        scrollerRef.current?.scrollTo({ top: next * scrollerRef.current.clientHeight, behavior: "smooth" });
        setActive(next); setPaused(false);
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

    const goBack = () => {
        if (window.history.length > 1) nav(-1);
        else nav("/");
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
        <main data-testid="reels-viewer" className="fixed inset-0 z-[70] h-[100dvh] w-screen overflow-hidden bg-black text-white" role="main" aria-label={tr("فيديوهات الإعلانات")}>
            {/* The viewer intentionally covers the app chrome. Controls use the device safe-area so they are never hidden behind a notch or browser UI. */}
            <button data-testid="reels-back-btn" onClick={goBack} aria-label={tr("رجوع")} style={{ top: "max(0.75rem, env(safe-area-inset-top))" }} className="absolute start-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-white">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} style={{ top: "max(0.75rem, env(safe-area-inset-top))" }} className="absolute end-3 z-30 flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-white">
                <Plus className="w-4 h-4" strokeWidth={2.8} />
                <span className="text-xs font-arabic font-bold">{tr("ارفع ستوري")}</span>
            </Link>

            <div ref={scrollerRef} onScroll={onScroll} className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
                {reels.map((l, i) => (
                    <div key={l.id} className="h-full w-full snap-start relative flex items-center justify-center">
                        <video ref={(el) => (refs.current[i] = el)} src={l.videos[0]} muted={muted} playsInline preload={i === active ? "metadata" : "none"} poster={l.images?.[0] || undefined} onTimeUpdate={(e) => setProgress((p) => ({ ...p, [i]: e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0 }))} onEnded={() => i < reels.length - 1 ? goTo(i + 1) : goTo(0)} onError={() => setLoadError(tr("تعذر تشغيل الفيديو"))} className="w-full h-full object-cover" />
                        <div className="absolute top-[max(4rem,calc(env(safe-area-inset-top)+3.25rem))] inset-x-4 z-20 flex gap-1" aria-label={tr("تقدم الفيديوهات")}>{reels.map((_, bar) => <button key={bar} onClick={() => goTo(bar)} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden" aria-label={`${tr("فيديو")} ${bar + 1}`}><span className="block h-full bg-white" style={{ width: `${bar < active ? 100 : bar === active ? (progress[active] || 0) * 100 : 0}%` }} /></button>)}</div>
                        {/* Overlay info */}
                        <div className="absolute inset-x-0 bottom-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 via-black/60 to-transparent">
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
                        <div className="absolute end-3 bottom-36 flex flex-col gap-4 text-white" style={{ bottom: "max(9rem, calc(env(safe-area-inset-bottom) + 8rem))" }}>
                            <button data-testid={`reel-fav-${l.id}`} onClick={() => toggleFav(l)} className="flex flex-col items-center gap-1"><div className={`w-11 h-11 rounded-full backdrop-blur flex items-center justify-center ${favs[l.id] ? "bg-red-500" : "bg-white/15"}`}><Heart className={`w-5 h-5 ${favs[l.id] ? "fill-white" : ""}`} /></div><span className="text-[10px]">{tr("مفضلة")}</span></button>
                            <button data-testid={`reel-msg-${l.id}`} onClick={() => messageSeller(l)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div><span className="text-[10px]">{tr("رسالة")}</span></button>
                            <button data-testid={`reel-share-${l.id}`} onClick={() => shareReel(l)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Share2 className="w-5 h-5" /></div><span className="text-[10px]">{tr("شارك")}</span></button>
                            <button onClick={() => goTo(active - 1)} disabled={active === 0} className="flex flex-col items-center gap-1 disabled:opacity-35" aria-label={tr("السابق")}><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><ChevronUp className="w-5 h-5" /></div></button>
                            <button onClick={() => setPaused((v) => !v)} className="flex flex-col items-center gap-1" aria-label={paused ? tr("تشغيل") : tr("إيقاف مؤقت")}><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">{paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}</div></button>
                            <button onClick={() => setMuted(!muted)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</div></button>
                            <button onClick={() => goTo(active + 1)} disabled={active === reels.length - 1} className="flex flex-col items-center gap-1 disabled:opacity-35" aria-label={tr("التالي")}><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><ChevronDown className="w-5 h-5" /></div></button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
