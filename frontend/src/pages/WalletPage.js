import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Gift, Sparkles, Loader2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { Link } from "react-router-dom";

export default function WalletPage() {
    const { user } = useAuth();
    useI18n(); // subscribe so the page re-renders when language changes
    const [data, setData] = useState({ balance: 0, currency: "SAR", transactions: [] });
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [msg, setMsg] = useState("");

    const load = () => {
        setLoading(true);
        api.get("/wallet/me")
            .then(({ data }) => setData(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (user) load();
    }, [user]);

    const claimBonus = async () => {
        setClaiming(true);
        setMsg("");
        try {
            const { data: r } = await api.post("/wallet/topup", { amount: 5, note: "مكافأة الانضمام" });
            setMsg(tr("تم استلام مكافأتك! 🎉"));
            setData((d) => ({ ...d, balance: r.balance }));
            load();
        } catch (e) {
            setMsg(formatApiError(e.response?.data?.detail) || tr("تعذر استلام المكافأة"));
        } finally {
            setClaiming(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-10 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="font-arabic-body text-[var(--text-muted)] mb-4">{tr("سجّل دخولك لعرض محفظتك")}</p>
                <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">
                    {tr("تسجيل الدخول")}
                </Link>
            </div>
        );
    }

    const hasBonus = data.transactions.some((t) => t.type === "bonus");

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 pb-24" data-testid="wallet-page">
            {/* Balance hero */}
            <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-[var(--accent)] rounded-3xl p-6 sm:p-8 text-[var(--primary-fg)] mb-5 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Wallet className="w-5 h-5" />
                        <span className="font-arabic-body text-sm">{tr("رصيد محفظتك")}</span>
                    </div>
                    <div className="font-latin font-black text-5xl sm:text-6xl mb-1 tabular-nums" data-testid="wallet-balance">
                        {Number(data.balance || 0).toLocaleString()}
                    </div>
                    <div className="font-arabic-body text-sm opacity-90">{data.currency === "SAR" ? "ريال سعودي" : data.currency}</div>
                </div>
            </div>

            {/* Welcome bonus */}
            {!hasBonus && (
                <div className="bg-[var(--surface)] border-2 border-dashed border-[var(--accent)] rounded-2xl p-5 mb-5 flex items-center gap-3" data-testid="welcome-bonus-card">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                        <Gift className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div className="flex-1">
                        <div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("مكافأة الانضمام")}</div>
                        <div className="font-arabic-body text-xs text-[var(--text-muted)]">{tr("احصل على 5 ر.س مجاناً لتجربة التعزيز")}</div>
                    </div>
                    <button
                        data-testid="claim-bonus-btn"
                        onClick={claimBonus}
                        disabled={claiming}
                        className="bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] px-4 py-2 rounded-full font-arabic font-bold text-sm shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {tr("استلم")}
                    </button>
                </div>
            )}
            {msg && <div className="text-center text-xs font-arabic-body text-[var(--text-muted)] mb-4">{msg}</div>}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <Link to="/my-listings" data-testid="boost-listing-link" className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                    <Sparkles className="w-6 h-6 text-[var(--primary)] mb-2" />
                    <div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("عزّز إعلاناً")}</div>
                    <div className="font-arabic-body text-xs text-[var(--text-muted)]">{tr("5 ر.س / أسبوع")}</div>
                </Link>
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] opacity-60">
                    <Wallet className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                    <div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("شحن المحفظة")}</div>
                    <div className="font-arabic-body text-xs text-[var(--text-muted)]">{tr("قريباً عبر بوابة الدفع")}</div>
                </div>
            </div>

            {/* Transactions */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] font-arabic font-bold text-sm text-[var(--text)]">
                    {tr("سجل العمليات")}
                </div>
                {loading ? (
                    <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--text-muted)]" /></div>
                ) : data.transactions.length === 0 ? (
                    <div className="p-8 text-center font-arabic-body text-xs text-[var(--text-muted)]">{tr("لا توجد عمليات بعد")}</div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {data.transactions.map((t) => {
                            const positive = (t.amount || 0) > 0;
                            return (
                                <div key={t.id} className="px-4 py-3 flex items-center gap-3" data-testid={`tx-${t.id}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${positive ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>
                                        {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{t.description}</div>
                                        <div className="font-arabic-body text-[10px] text-[var(--text-muted)]">{new Date(t.created_at).toLocaleString("ar")}</div>
                                    </div>
                                    <div className={`font-latin font-black text-base tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>
                                        {positive ? "+" : ""}{Number(t.amount).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
