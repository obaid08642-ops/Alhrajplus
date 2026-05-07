import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";

export default function AdSlot({ placement, className = "" }) {
    const { t } = useI18n();
    const [ads, setAds] = useState([]);

    useEffect(() => {
        api.get(`/ads`, { params: { placement } }).then(({ data }) => setAds(data || []))
           .catch(() => setAds([]));
    }, [placement]);

    if (!ads.length) return null;
    const ad = ads[0];

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
            <img src={ad.image_url} alt={ad.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            <span className="absolute top-2 start-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-arabic">{t("ad_label")}</span>
        </div>
    );

    return (
        <div className={`my-6 ${className}`} data-testid={`ad-slot-${placement}`}>
            {ad.link_url ? (
                <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>
            ) : inner}
        </div>
    );
}
