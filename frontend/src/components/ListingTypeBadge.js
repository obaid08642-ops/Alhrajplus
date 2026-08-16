/**
 * Compact overlay badge that surfaces intent on listing cards.
 *
 *   <ListingTypeBadge listing={listing} />
 *
 * Recognised signals (in order):
 *   1. `listing.custom_fields.post_type`
 *        "عرض وظيفة"  | "باحث عن عمل"   → Jobs
 *        "تقديم خدمة" | "طلب خدمة"      → Services
 *   2. `listing.custom_fields.deal_type`
 *        "للبيع"   | "للإيجار" | "للتقبيل / تنازل"  → Real Estate
 *
 * Renders a coloured pill — green for "offer/sale", blue for "request/rent",
 * amber for "transfer/تنازل". Returns null when no recognised tag is set.
 */
import { BriefcaseBusiness, Wrench, House } from "lucide-react";

export default function ListingTypeBadge({ listing, className = "", size = "sm" }) {
    const pt = listing?.custom_fields?.post_type;
    const dt = listing?.custom_fields?.deal_type;

    let label = null;
    let Icon = null;
    let tone = "neutral"; // "offer" | "request" | "transfer"

    if (pt === "عرض وظيفة" || pt === "باحث عن عمل") {
        label = pt;
        Icon = BriefcaseBusiness;
        tone = pt === "عرض وظيفة" ? "offer" : "request";
    } else if (pt === "تقديم خدمة" || pt === "طلب خدمة") {
        label = pt;
        Icon = Wrench;
        tone = pt === "تقديم خدمة" ? "offer" : "request";
    } else if (dt === "للبيع" || dt === "للإيجار" || dt === "للتقبيل / تنازل" || dt === "للتقبيل") {
        label = dt;
        Icon = House;
        if (dt === "للبيع") tone = "offer";
        else if (dt === "للإيجار") tone = "request";
        else tone = "transfer";
    } else {
        return null;
    }

    const toneCls = tone === "offer"
        ? "bg-emerald-500 text-white"
        : tone === "request"
            ? "bg-sky-500 text-white"
            : "bg-amber-500 text-white";

    const sizeCls = size === "lg"
        ? "text-xs px-2.5 py-1"
        : "text-[9px] px-1.5 py-0.5";

    return (
        <span
            data-testid={`listing-type-${tone}`}
            className={`inline-flex items-center gap-0.5 ${sizeCls} ${toneCls} rounded-full font-arabic font-bold shadow-sm ${className}`}
        >
            {Icon && <Icon className={size === "lg" ? "w-3.5 h-3.5" : "w-3 h-3"} strokeWidth={2.2} />}
            <span>{label}</span>
        </span>
    );
}
