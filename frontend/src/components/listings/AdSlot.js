import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { optimizeImage, buildSrcSet } from "@/lib/imageOptimizer";

export default function AdSlot({ placement, className = "" }) {
    const { t } = useI18n();
    const [ads, setAds] = useState([]);

    useEffect(() => {
        api.get(`/ads`, { params: { placement } }).then(({ data }) => setAds(data || []))
           .catch(() => setAds([]));
    }, [placement]);

    // Track impression once per ad render. IntersectionObserver would be nicer
    // but causes layout thrash on long pages; the simple "render = impression"
    // matches industry standard for above-the-fold inventory.
    useEffect(() => {
        if (!ads.length) return;
        const ad = ads[0];
        if (ad?.id) api.post(`/ads/${ad.id}/impression`).catch(() => {});
    }, [ads]);

    if (!ads.length) return null;
    const ad = ads[0];

    const onClickAd = () => { if (ad?.id) api.post(`/ads/${ad.id}/click`).catch(() => {}); };

    // Iframe ad (e.g., Trip.com affiliate banner)
    if (ad.ad_type === "iframe" && ad.iframe_url) {
        const w = ad.iframe_width || 300;
        const h = ad.iframe_height || 250;
        return (
            <div className={`my-6 ${className}`} data-testid={`ad-slot-${placement}`}>
                <div className="relative flex justify-center bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-3 overflow-hidden">
                    <iframe
                        title={ad.title || "Ad"}
                        src={ad.iframe_url}
                        width={w}
                        height={h}
                        scrolling="no"
                        frameBorder="0"
                        style={{ border: "none", maxWidth: "100%" }}
                    />
                    <span className="absolute top-2 start-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-arabic z-10">{t("ad_label")}</span>
                </div>
            </div>
        );
    }

    // Image ad (default)
    const inner = (
        <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] group">
            <img src={optimizeImage(ad.image_url, { w: 768 })} srcSet={buildSrcSet(ad.image_url, [320, 480, 768, 1024])} sizes="(max-width: 768px) 100vw, 768px" alt={ad.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            <span className="absolute top-2 start-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-arabic">{t("ad_label")}</span>
        </div>
    );

    return (
        <div className={`my-6 ${className}`} data-testid={`ad-slot-${placement}`}>
            {ad.link_url ? (
                <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={onClickAd} className="block">{inner}</a>
            ) : inner}
        </div>
    );
}
