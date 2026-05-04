import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Sparkles } from "lucide-react";

const COLORS = {
    emerald: "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
    blue: "bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400",
    amber: "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-500",
};

/**
 * Compact version: used in listing cards (small chip).
 * Full version: used in listing detail (card with icon + label + sub).
 */
export default function PriceBadge({ listingId, variant = "full" }) {
    const [badge, setBadge] = useState(null);

    useEffect(() => {
        if (!listingId) return;
        let cancelled = false;
        api.get(`/ai/price-badge/${listingId}`)
            .then(({ data }) => { if (!cancelled) setBadge(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [listingId]);

    if (!badge || !badge.badge) return null;
    const color = COLORS[badge.color] || COLORS.blue;

    if (variant === "chip") {
        return (
            <span data-testid={`price-chip-${badge.badge}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-arabic font-black border ${color}`}>
                <span>{badge.icon}</span>{badge.label}
            </span>
        );
    }

    return (
        <div data-testid={`price-badge-${badge.badge}`} className={`rounded-2xl border p-3 flex items-start gap-3 ${color}`}>
            <div className="text-2xl leading-none">{badge.icon}</div>
            <div className="flex-1 min-w-0">
                <div className="font-arabic font-black text-sm flex items-center gap-1.5">
                    {badge.label}
                    <Sparkles className="w-3 h-3 opacity-80" />
                </div>
                <p className="text-[11px] opacity-80 font-arabic-body mt-0.5">
                    {badge.sub}
                </p>
            </div>
        </div>
    );
}
