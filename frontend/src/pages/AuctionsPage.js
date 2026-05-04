import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Gavel, Clock, TrendingUp } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";

export default function AuctionsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/listings", { params: { category: "auctions", limit: 30 } })
            .then(({ data }) => setItems(data.items || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="bg-gradient-to-br from-[var(--accent)]/15 to-[var(--primary)]/10 rounded-3xl p-5 sm:p-8 border border-[var(--accent)]/30 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/20 rounded-full blur-3xl"></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center shrink-0">
                        <Gavel className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--secondary)]" />
                    </div>
                    <div>
                        <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)]">المزادات الحية</h1>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body">سيارات نادرة • عقارات مميزة • مقتنيات تراثية</p>
                    </div>
                </div>
                <div className="relative mt-4 inline-flex items-center gap-2 bg-[var(--surface)] rounded-full px-3 py-1.5 border border-[var(--accent)]/40">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="text-xs font-arabic font-bold text-[var(--text)]">قريباً: المزايدة الحية بفيديو ودردشة</span>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="font-arabic font-bold text-base text-[var(--text)]">المزادات النشطة</h2>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-[var(--surface-elevated)] animate-pulse"></div>)}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-10 text-center border border-[var(--border)]">
                    <Gavel className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-muted)] font-arabic-body">لا توجد مزادات نشطة الآن</p>
                    <Link to="/post" className="inline-block mt-3 bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">أنشئ مزاد</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((l) => <ListingCard key={l.id} listing={l} compact />)}
                </div>
            )}
        </div>
    );
}
