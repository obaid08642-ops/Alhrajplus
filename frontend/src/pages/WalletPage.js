import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Gift, Sparkles, Loader2, Coins as CoinsIcon, ShieldCheck } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { Link } from "react-router-dom";

const emptyCash = { balance: 0, currency: "SAR", transactions: [] };
const emptyCoins = { balance: 0, ledger: [] };

export default function WalletPage() {
    const { user } = useAuth();
    const { lang } = useI18n();
    const locale = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "tr" ? "tr-TR" : "en-US";
    const [cash, setCash] = useState(emptyCash);
    const [coins, setCoins] = useState(emptyCoins);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [msg, setMsg] = useState("");

    const load = () => {
        if (!user) return;
        setLoading(true);
        Promise.all([
            api.get("/wallet/me").then(({ data }) => data).catch(() => emptyCash),
            api.get("/coins/me").then(({ data }) => data).catch(() => emptyCoins),
        ]).then(([walletData, coinsData]) => {
            setCash({ ...emptyCash, ...walletData, transactions: Array.isArray(walletData?.transactions) ? walletData.transactions : [] });
            setCoins({ ...emptyCoins, ...coinsData, ledger: Array.isArray(coinsData?.ledger) ? coinsData.ledger : [] });
        }).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasWelcomeCoins = coins.ledger.some((tx) => tx.type === "welcome_bonus" || tx.idempotency_key === "welcome_coins_v1");
    const claimWelcomeCoins = async () => {
        setClaiming(true);
        setMsg("");
        try {
            const { data } = await api.post("/coins/claim-welcome-bonus");
            setMsg(`${tr("تم استلام مكافأة الـCoins")} +${Number(data.amount || 0).toLocaleString(locale)} Coins`);
            setCoins((old) => ({ ...old, balance: data.balance }));
            load();
        } catch (e) {
            setMsg(formatApiError(e.response?.data?.detail) || tr("تعذر استلام مكافأة الـCoins"));
        } finally {
            setClaiming(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-10 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="font-arabic-body text-[var(--text-muted)] mb-4">{tr("سجّل دخولك لعرض محفظتك")}</p>
                <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("تسجيل الدخول")}</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 pb-24" data-testid="wallet-page">
            <div className="grid gap-4 sm:grid-cols-2 mb-5">
                <section className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-[var(--accent)] rounded-3xl p-6 text-[var(--primary-fg)] relative overflow-hidden shadow-2xl" data-testid="cash-wallet-card">
                    <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2 opacity-90"><Wallet className="w-5 h-5" /><span className="font-arabic-body text-sm">{tr("الرصيد النقدي")}</span></div>
                        <div className="font-latin font-black text-4xl sm:text-5xl mb-1 tabular-nums" data-testid="wallet-balance">{Number(cash.balance || 0).toLocaleString(locale)}</div>
                        <div className="font-arabic-body text-sm opacity-90">{cash.currency === "SAR" ? tr("ريال سعودي") : cash.currency}</div>
                        <p className="mt-4 text-xs leading-5 text-white/85 font-arabic-body">{tr("شحن الرصيد النقدي غير متاح حالياً؛ لن يتم إنشاء أي رصيد أو دفعة تلقائياً.")}</p>
                    </div>
                </section>

                <section className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/25 dark:to-yellow-900/15 rounded-3xl p-6 border border-amber-300/50 relative overflow-hidden" data-testid="coins-wallet-card">
                    <div className="flex items-center gap-2 mb-2"><CoinsIcon className="w-5 h-5 text-amber-700 dark:text-amber-300" /><span className="font-arabic-body text-sm text-[var(--text)]">{tr("رصيد Coins")}</span></div>
                    <div className="font-latin font-black text-4xl sm:text-5xl mb-1 tabular-nums text-amber-700 dark:text-amber-300" data-testid="coins-balance">{Number(coins.balance || 0).toLocaleString(locale)}</div>
                    <p className="text-xs leading-5 text-[var(--text-muted)] font-arabic-body">{tr("Coins مكافآت افتراضية داخل المنصة وليست ريالاً سعودياً، وتُستخدم للترويج فقط وفق الشروط المتاحة.")}</p>
                </section>
            </div>

            {user.verified && !hasWelcomeCoins && (
                <section className="bg-[var(--surface)] border-2 border-dashed border-amber-400 rounded-2xl p-5 mb-5 flex items-center gap-3" data-testid="welcome-coins-card">
                    <div className="w-12 h-12 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0"><Gift className="w-6 h-6 text-amber-600" /></div>
                    <div className="flex-1"><div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("مكافأة الترحيب بالـCoins")}</div><div className="font-arabic-body text-xs text-[var(--text-muted)]">{tr("مكافأة افتراضية اختيارية بعد توثيق الحساب؛ لا تضيف أي رصيد نقدي.")}</div></div>
                    <button data-testid="claim-welcome-coins-btn" onClick={claimWelcomeCoins} disabled={claiming} className="bg-amber-400 hover:opacity-90 text-[var(--secondary)] px-4 py-2 rounded-full font-arabic font-bold text-sm shrink-0 disabled:opacity-50 flex items-center gap-1.5">
                        {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{tr("استلم Coins")}
                    </button>
                </section>
            )}
            {!user.verified && <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-5 flex items-center gap-3 text-sm font-arabic-body text-[var(--text-muted)]"><ShieldCheck className="w-5 h-5 text-[var(--primary)] shrink-0" />{tr("وثّق حسابك أولاً لإتاحة مكافأة الترحيب بالـCoins إن كانت مفعلة.")}</div>}
            {msg && <div role="status" className="text-center text-xs font-arabic-body text-[var(--text-muted)] mb-4">{msg}</div>}

            <div className="grid grid-cols-2 gap-3 mb-5">
                <Link to="/my-listings" data-testid="boost-listing-link" className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors"><Sparkles className="w-6 h-6 text-[var(--primary)] mb-2" /><div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("عزّز إعلاناً")}</div><div className="font-arabic-body text-xs text-[var(--text-muted)]">{tr("يُخصم من رصيد Coins فقط")}</div></Link>
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] opacity-70" data-testid="cash-topup-unavailable"><Wallet className="w-6 h-6 text-[var(--text-muted)] mb-2" /><div className="font-arabic font-bold text-sm text-[var(--text)]">{tr("شحن الرصيد النقدي")}</div><div className="font-arabic-body text-xs text-[var(--text-muted)]">{tr("غير متاح حتى ربط بوابة دفع حقيقية")}</div></div>
            </div>

            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-[var(--border)] font-arabic font-bold text-sm text-[var(--text)]">{tr("سجل Coins")}</div>
                {loading ? <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--text-muted)]" /></div> : coins.ledger.length === 0 ? <div className="p-7 text-center font-arabic-body text-xs text-[var(--text-muted)]">{tr("لا توجد حركات Coins بعد")}</div> : <div className="divide-y divide-[var(--border)]">{coins.ledger.map((tx) => <LedgerRow key={tx.id} tx={tx} locale={locale} />)}</div>}
            </section>

            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] font-arabic font-bold text-sm text-[var(--text)]">{tr("سجل الرصيد النقدي")}</div>
                {loading ? <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--text-muted)]" /></div> : cash.transactions.length === 0 ? <div className="p-7 text-center font-arabic-body text-xs text-[var(--text-muted)]">{tr("لا توجد عمليات نقدية بعد")}</div> : <div className="divide-y divide-[var(--border)]">{cash.transactions.map((tx) => <LedgerRow key={tx.id} tx={tx} locale={locale} cash />)}</div>}
            </section>
        </div>
    );
}

function LedgerRow({ tx, locale, cash = false }) {
    const positive = Number(tx.amount || 0) > 0;
    const description = tx.description || tx.purpose || tx.type || "—";
    return <div className="px-4 py-3 flex items-center gap-3" data-testid={`tx-${tx.id}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${positive ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"}`}>{positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}</div>
        <div className="flex-1 min-w-0"><div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{description}</div><div className="font-arabic-body text-[10px] text-[var(--text-muted)]">{tx.created_at ? new Date(tx.created_at).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" }) : ""}</div></div>
        <div className={`font-latin font-black text-base tabular-nums ${positive ? "text-emerald-600" : "text-red-600"}`}>{positive ? "+" : ""}{Number(tx.amount || 0).toLocaleString(locale)}{cash ? " SAR" : ""}</div>
    </div>;
}
