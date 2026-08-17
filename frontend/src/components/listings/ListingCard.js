import { Link } from "react-router-dom";
import { Heart, MapPin, TrendingUp, Star, Sparkles, Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { optimizeImage, buildSrcSet, lqipUrl } from "@/lib/imageOptimizer";
import ListingTypeBadge from "@/components/ListingTypeBadge";

export default function ListingCard({ listing, compact = true }) {
    const { user } = useAuth();
    const { lang } = useI18n();
    const [fav, setFav] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);
    const swipeStartX = useRef(null);
    const images = (listing.images || []).filter(Boolean);

    useEffect(() => {
        let cancelled = false;
        if (!user || !listing?.id) {
            setFav(false);
            return undefined;
        }
        api.get(`/favorites/${listing.id}/check`).then(({ data }) => {
            if (!cancelled) setFav(!!data?.favorited);
        }).catch(() => { if (!cancelled) setFav(false); });
        return () => { cancelled = true; };
    }, [user, listing?.id]);

    useEffect(() => {
        if (images.length < 2) return undefined;
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (reduceMotion) return undefined;
        const id = window.setInterval(() => setImageIndex((i) => (i + 1) % images.length), 2800);
        return () => window.clearInterval(id);
    }, [listing.id, images.length]);

    const toggleFav = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!user) return;
        try {
            const { data } = await api.post(`/favorites/${listing.id}`);
            setFav(data.favorited);
        } catch (_) {}
    };

    const ts = listing.created_at ? new Date(listing.created_at) : null;
    const timeAgo = ts ? formatTimeAgo(ts, lang) : "";
    const numberLocale = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "tr" ? "tr-TR" : "en-US";

    return (
        <Link
            to={`/listing/${listing.id}`}
            data-testid={`listing-card-${listing.id}`}
            className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--primary)]/15 transition-all duration-300 cursor-pointer flex flex-col"
        >
            <div className={`relative overflow-hidden select-none ${compact ? "aspect-[4/3]" : "aspect-square"}`} onPointerDown={(e) => { swipeStartX.current = e.clientX; }} onPointerUp={(e) => { if (swipeStartX.current == null || images.length < 2) return; const dx = e.clientX - swipeStartX.current; swipeStartX.current = null; if (Math.abs(dx) < 24) return; setImageIndex((i) => (i + (dx < 0 ? 1 : -1) + images.length) % images.length); }} style={listing.images?.[0] ? { backgroundImage: `url(${lqipUrl(listing.images[0])})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {images[imageIndex] ? (
                    <img key={images[imageIndex]} src={optimizeImage(images[imageIndex], { w: 480 })} srcSet={buildSrcSet(images[imageIndex], [240, 320, 480, 640])} sizes="(max-width: 640px) 50vw, 240px" alt={listing.title} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} style={{ opacity: 0, transition: "opacity 280ms ease-out" }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)] text-xs font-arabic">{tr("لا توجد صورة")}</div>
                )}
                {images.length > 1 && <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 pointer-events-none">{images.slice(0, 5).map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imageIndex % Math.min(images.length, 5) ? "bg-white" : "bg-white/45"}`} />)}</div>}
                <button onClick={toggleFav} data-testid={`fav-btn-${listing.id}`} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow-md backdrop-blur">
                    <Heart className={`w-3.5 h-3.5 ${fav ? "fill-red-500 text-red-500" : "text-[var(--secondary)]"}`} />
                </button>
                {listing.verified && (
                    <span className="absolute top-2 left-2 bg-[var(--primary)]/95 text-[var(--primary-fg)] rounded-full px-2 py-0.5 text-[9px] font-black font-arabic flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> {tr("موثّق")}
                    </span>
                )}
                {listing.ai_badge === "good" && (
                    <span className="absolute bottom-2 left-2 bg-[var(--success)]/95 text-white rounded-full px-2 py-0.5 text-[9px] font-black font-arabic flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> صفقة
                    </span>
                )}
                {/* Jobs / services intent badge — shown on top-right corner of the image overlay.
                    Auto-hidden for non-job/service listings via the component itself. */}
                <div className="absolute bottom-2 right-2 z-[1]">
                    <ListingTypeBadge listing={listing} />
                </div>
            </div>
            <div className="p-2.5 flex-1 flex flex-col justify-between">
                <h3 className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2 mb-1.5 group-hover:text-[var(--primary)] transition-colors min-h-[2.5em]">{listing.title}</h3>
                <div>
                    <div className="flex items-baseline gap-1 mb-1">
                        {listing.price ? (
                            <>
                                <span className="font-latin font-black text-base text-[var(--secondary)] dark:text-[var(--primary)]">{Number(listing.price).toLocaleString(numberLocale)}</span>
                                <span className="text-[10px] text-[var(--text-muted)] font-arabic-body">{listing.currency || "ر.س"}</span>
                            </>
                        ) : (
                            <span className="text-xs text-[var(--text-muted)] font-arabic">{tr("على السوم")}</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-arabic-body">
                        <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5 shrink-0" /> {listing.city}</span>
                        <span className="shrink-0">{timeAgo}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function formatTimeAgo(date, lang = "ar") {
    const diff = Math.max(0, (Date.now() - date.getTime()) / 1000);
    const locale = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "tr" ? "tr-TR" : "en-US";
    const rtf = typeof Intl !== "undefined" && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(locale, { numeric: "auto" }) : null;
    const choose = diff < 60 ? [Math.floor(diff), "second"] : diff < 3600 ? [Math.floor(diff / 60), "minute"] : diff < 86400 ? [Math.floor(diff / 3600), "hour"] : diff < 2592000 ? [Math.floor(diff / 86400), "day"] : [Math.floor(diff / 2592000), "month"];
    if (rtf) return rtf.format(-choose[0], choose[1]);
    return `${choose[0]} ${choose[1]}`;
}
