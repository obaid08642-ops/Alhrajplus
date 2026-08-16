import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Star, Users, ArrowLeft, MessageCircle, Grid3X3 } from "lucide-react";
import api from "@/lib/api";
import { tr } from "@/contexts/I18nContext";

export default function SellerStorefrontPage() {
    const { sellerId } = useParams();
    const [seller, setSeller] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        Promise.all([api.get(`/sellers/${sellerId}`), api.get(`/sellers/${sellerId}/listings`, { params: { limit: 24 } })])
            .then(([s, l]) => { if (active) { setSeller(s.data); setItems(l.data?.items || []); } })
            .catch(() => { if (active) setSeller(null); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [sellerId]);
    if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-arabic">{tr("جاري التحميل...")}</div>;
    if (!seller) return <div className="min-h-[60vh] flex items-center justify-center font-arabic text-[var(--text-muted)]">{tr("البائع غير موجود")}</div>;
    const title = seller.store_name || seller.name;
    return (
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5" dir="rtl" data-testid="seller-storefront-page">
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                <div className="h-36 sm:h-52 bg-gradient-to-br from-[#102b3f] via-[#19556d] to-[#4FB6E6]">
                    {seller.store_cover && <img src={seller.store_cover} alt="" className="w-full h-full object-cover opacity-70" />}
                </div>
                <div className="px-4 sm:px-8 pb-6 -mt-10 relative">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="w-24 h-24 rounded-3xl bg-[var(--surface)] border-4 border-[var(--surface)] shadow-lg overflow-hidden flex items-center justify-center text-3xl font-black text-[var(--primary)]">
                            {seller.store_logo || seller.avatar_url ? <img src={seller.store_logo || seller.avatar_url} alt="" className="w-full h-full object-cover" /> : (seller.name || "U")[0]}
                        </div>
                        <div className="flex-1 min-w-[220px] pt-8"><h1 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2">{title}{seller.verified && <BadgeCheck className="w-5 h-5 text-[var(--primary)]" />}</h1><div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--text-muted)] font-arabic-body"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[seller.city, seller.country_code].filter(Boolean).join("، ") || tr("الموقع غير محدد")}</span><span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{seller.followers || 0} {tr("متابع")}</span><span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{seller.rating_avg || 0} ({seller.rating_count || 0})</span></div></div>
                        <Link to={`/chat?to=${seller.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm"><MessageCircle className="w-4 h-4" />{tr("تواصل مع المتجر")}</Link>
                    </div>
                    {(seller.store_description || seller.bio) && <p className="max-w-3xl mt-5 text-sm leading-7 text-[var(--text-muted)] font-arabic-body">{seller.store_description || seller.bio}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><StoreStat label={tr("الإعلانات النشطة")} value={items.length} icon={<Grid3X3 className="w-4 h-4" />} /><StoreStat label={tr("المتابعون")} value={seller.followers || 0} icon={<Users className="w-4 h-4" />} /><StoreStat label={tr("التقييم")} value={seller.rating_avg || 0} icon={<Star className="w-4 h-4" />} /><StoreStat label={tr("التوثيق")} value={seller.verified ? tr("موثّق") : tr("حساب عادي")} icon={<BadgeCheck className="w-4 h-4" />} /></div>
            <section><div className="flex items-center justify-between mb-3"><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("كتالوج المتجر")}</h2><span className="text-xs text-[var(--text-muted)] font-arabic-body">{items.length} {tr("إعلان")}</span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{items.map((item) => <Link key={item.id} to={`/listing/${item.id}`} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg transition-all"><div className="aspect-[4/3] bg-[var(--surface-elevated)]">{item.images?.[0] && <img src={item.images[0]} alt={item.title || ""} className="w-full h-full object-cover" loading="lazy" />}</div><div className="p-3"><div className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2 min-h-10">{item.title}</div><div className="mt-2 flex justify-between gap-2 text-xs"><b className="font-latin text-[var(--primary)]">{item.price ? `${Number(item.price).toLocaleString()} ${item.currency || ""}` : tr("السعر عند التواصل")}</b><span className="text-[var(--text-muted)]">{item.views || 0} {tr("مشاهدة")}</span></div></div></Link>)}</div>{items.length === 0 && <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات نشطة")}</div>}</section>
        </main>
    );
}

function StoreStat({ label, value, icon }) { return <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">{icon}</div><div><div className="font-black font-latin text-lg text-[var(--text)]">{value}</div><div className="text-xs text-[var(--text-muted)] font-arabic-body">{label}</div></div></div>; }
