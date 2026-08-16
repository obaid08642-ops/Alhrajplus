import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Flame, TrendingDown, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";

export default function DealsPage() {
    const { user } = useAuth();
    const { country } = useCountry();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const params = { limit: 30 };
        if (country) params.country_code = country;
        setError("");
        api.get("/deals/today", { params })
            .then(({ data }) => setDeals(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])))
            .catch(() => { setDeals([]); setError(tr("تعذر تحميل الصفقات الحالية")); })
            .finally(() => setLoading(false));
    }, [country]);

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="bg-gradient-to-br from-emerald-500/20 via-[var(--primary)]/10 to-red-500/10 rounded-3xl p-5 sm:p-8 border border-emerald-500/30 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 shadow-xl">
                        <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)]">{tr("صفقات اليوم الذهبية")}</h1>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body">
                            <Sparkles className="inline w-3 h-3 text-[var(--primary)]" /> {tr("أفضل الأسعار تحت متوسط السوق — مختارة بذكاء اصطناعي")}
                        </p>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-8 text-center font-arabic-body">{error}</div>
            ) : loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-[var(--surface-elevated)] animate-pulse"></div>)}
                </div>
            ) : deals.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-10 text-center border border-[var(--border)]">
                    <Flame className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                    <p className="text-[var(--text-muted)] font-arabic-body mb-2">{tr("لا توجد صفقات بارزة الآن")}</p>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body mb-4">{tr("نحتاج المزيد من الإعلانات لمقارنة الأسعار")}</p>
                    <Link to="/" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">
                        <ArrowLeft className="inline w-4 h-4" /> {tr("العودة للرئيسية")}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(Array.isArray(deals) ? deals : []).map((d) => <DealCard key={d.id} deal={d} />)}
                </div>
            )}
        </div>
    );
}

function DealCard({ deal }) {
    return (
        <Link to={`/listing/${deal.id}`} data-testid={`deal-card-${deal.id}`} className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all flex flex-col relative">
            <div className="absolute top-2 start-2 z-10 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full px-2.5 py-1 text-[10px] font-black font-arabic flex items-center gap-1 shadow-lg">
                <TrendingDown className="w-3 h-3" /> -{deal.discount_pct}%
            </div>
            <div className="absolute top-2 end-2 z-10 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-[9px] font-black font-arabic flex items-center gap-1">
                <Flame className="w-3 h-3" /> {tr("صفقة")}
            </div>
            <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-elevated)]">
                {deal.images?.[0] ? (
                    <img src={deal.images[0]} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs font-arabic">{tr("لا توجد صورة")}</div>
                )}
            </div>
            <div className="p-2.5 flex-1 flex flex-col">
                <h3 className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2 min-h-[2.5em] mb-2 group-hover:text-emerald-600">{deal.title}</h3>
                <div className="mt-auto">
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-latin font-black text-base text-emerald-600">{Number(deal.price).toLocaleString()}</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-arabic-body">{deal.currency || "ر.س"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-arabic-body mt-0.5">
                        <span className="line-through">{Number(deal.market_median).toLocaleString()}</span>
                        <span className="text-emerald-600 font-bold">وفّر {Number(deal.savings).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-arabic-body mt-1 truncate">{deal.city}</div>
                </div>
            </div>
        </Link>
    );
}
