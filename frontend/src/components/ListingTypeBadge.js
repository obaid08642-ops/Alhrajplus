/**
 * Small overlay badge that surfaces job/service post intent on listing cards.
 *
 *   <ListingTypeBadge listing={listing} />
 *
 * Reads `listing.custom_fields.post_type` ∈
 *   "عرض وظيفة" | "باحث عن عمل" | "تقديم خدمة" | "طلب خدمة"
 * and renders a coloured pill (green for "offering", blue for "requesting").
 * Returns null for anything else so cards stay clean for other categories.
 */
export default function ListingTypeBadge({ listing, className = "", size = "sm" }) {
    const pt = listing?.custom_fields?.post_type;
    if (!pt) return null;

    const isOffer = pt === "عرض وظيفة" || pt === "تقديم خدمة";
    const isJob = pt === "عرض وظيفة" || pt === "باحث عن عمل";
    const icon = isJob ? "💼" : "🔧";
    const colorCls = isOffer
        ? "bg-emerald-500 text-white"
        : "bg-sky-500 text-white";
    const sizeCls = size === "lg"
        ? "text-xs px-2.5 py-1"
        : "text-[9px] px-1.5 py-0.5";

    return (
        <span
            data-testid={`listing-type-${isOffer ? "offer" : "request"}`}
            className={`inline-flex items-center gap-0.5 ${sizeCls} ${colorCls} rounded-full font-arabic font-bold shadow-sm ${className}`}
        >
            <span>{icon}</span>
            <span>{pt}</span>
        </span>
    );
}
