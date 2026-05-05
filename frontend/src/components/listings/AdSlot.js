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
