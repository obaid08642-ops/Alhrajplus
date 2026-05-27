import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Gavel, Clock, TrendingUp, Users, X, Sparkles, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import { useAuctionLive } from "@/hooks/useAuctionLive";

export default function AuctionsPage() {
    const { user } = useAuth();
    const { country } = useCountry();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(null); // listing being bid on
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const params = { limit: 30 };
        if (country) params.country_code = country;
        api.get("/auctions/active", { params })
            .then(({ data }) => setItems(data || []))
            .finally(() => setLoading(false));
    }, [country, refreshKey]);

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
            {/* Hero */}
            <div className="bg-gradient-to-br from-[var(--accent)]/15 via-[var(--primary)]/10 to-[var(--secondary)]/10 rounded-3xl p-5 sm:p-8 border border-[var(--accent)]/30 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--primary)]/15 rounded-full blur-3xl"></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-lg">
                        <Gavel className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--secondary)]" />
                    </div>
                    <div className="flex-1">
                        <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)]">{tr("المزادات الحية")}</h1>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body">{tr("سيارات نادرة • عقارات مميزة • مقتنيات تراثية")}</p>
                    </div>
                </div>
                <div className="relative mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-[var(--surface)] rounded-full px-3 py-1.5 border border-[var(--accent)]/40 text-xs font-arabic font-bold text-[var(--text)]">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> مزايدة فورية
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-[var(--surface)] rounded-full px-3 py-1.5 border border-[var(--primary)]/40 text-xs font-arabic font-bold text-[var(--text)]">
                        <Users className="w-3.5 h-3.5 text-[var(--primary)]" /> مشاركة من جميع الدول
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                    <h2 className="font-arabic font-bold text-base text-[var(--text)]">{tr("المزادات النشطة ")}<span className="text-[var(--text-muted)] text-xs">({items.length})</span></h2>
                </div>
                <Link to="/post" data-testid="auction-create-btn" className="bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] rounded-full px-4 py-1.5 text-xs font-bold font-arabic">
                    + أنشئ مزاد
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-[var(--surface-elevated)] animate-pulse"></div>)}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-2xl p-10 text-center border border-[var(--border)]">
                    <Gavel className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-muted)] font-arabic-body mb-3">{tr("لا توجد مزادات نشطة الآن")}</p>
                    <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{tr("أنشئ أول مزاد")}</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((l) => <AuctionCard key={l.id} listing={l} onBid={() => setActive(l)} />)}
                </div>
            )}

            {active && <BidDialog listing={active} onClose={() => setActive(null)} onPlaced={() => { setActive(null); setRefreshKey((k) => k + 1); }} />}
        </div>
    );
}

function AuctionCard({ listing, onBid }) {
    const top = listing.top_bid;
    const startPrice = listing.price || 0;
    const currentPrice = top?.amount || startPrice;
    return (
        <div data-testid={`auction-card-${listing.id}`} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-lg transition-all flex flex-col">
            <Link to={`/listing/${listing.id}`} className="block aspect-[5/3] bg-[var(--surface-elevated)] overflow-hidden relative">
                {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-arabic">{tr("لا توجد صورة")}</div>
                )}
                <span className="absolute top-2 start-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full font-arabic flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> مباشر
                </span>
                <span className="absolute top-2 end-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full font-arabic flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {listing.bid_count} مزايدة
                </span>
            </Link>
            <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-1 mb-1">{listing.title}</h3>
                <p className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-1 mb-3">{listing.city}</p>
                <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-[var(--border)] flex-wrap">
                    <div className="min-w-0">
                        <div className="text-[10px] text-[var(--text-muted)] font-arabic-body">{top ? "أعلى مزايدة" : "السعر الابتدائي"}</div>
                        <div className="font-latin font-black text-lg text-[var(--accent)] truncate">{Number(currentPrice).toLocaleString()} <span className="text-[10px] text-[var(--text-muted)]">{listing.currency || "ر.س"}</span></div>
                    </div>
                    <button data-testid={`bid-btn-${listing.id}`} onClick={onBid} className="shrink-0 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-4 py-2 text-xs font-bold font-arabic flex items-center gap-1 active:scale-95 transition-transform">
                        <Gavel className="w-3 h-3" /> زايد الآن
                    </button>
                </div>
            </div>
        </div>
    );
}

function BidDialog({ listing, onClose, onPlaced }) {
    const { user } = useAuth();
    const [bids, setBids] = useState([]);
    const [amount, setAmount] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    // Live subscription — replaces 2-3s polling. Returns latest top bid + count
    // pushed directly from the server via WebSocket. Falls back to REST bids
    // history below for the timeline list.
    const live = useAuctionLive(listing.id);
    const top = live.topBid || bids[0] || null;
    const liveCount = live.bidCount || bids.length;
    const minRequired = (top?.amount || listing.price || 0) + 1;

    useEffect(() => {
        api.get(`/auctions/${listing.id}/bids`).then(({ data }) => setBids(data || []));
    }, [listing.id]);

    // Whenever a new live event arrives, refresh the history list so names appear.
    useEffect(() => {
        if (!live.lastEventAt) return;
        api.get(`/auctions/${listing.id}/bids`).then(({ data }) => setBids(data || [])).catch(() => { });
    }, [live.lastEventAt, listing.id]);

    const submit = async (e) => {
        e.preventDefault();
        if (!user) {
            window.location.href = "/login";
            return;
        }
        setErr(""); setBusy(true);
        try {
            await api.post(`/auctions/${listing.id}/bid`, { amount: parseFloat(amount) });
            onPlaced();
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || "تعذر إيداع المزايدة");
        } finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3" onClick={onClose}>
            <div data-testid="bid-dialog" onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-[var(--border)] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h3 className="font-arabic font-black text-lg text-[var(--text)] flex items-center gap-2"><Gavel className="w-5 h-5 text-[var(--primary)]" /> المزايدة على {listing.title}</h3>
                    <div className="flex items-center gap-1.5">
                        <span data-testid="bid-live-status" title={live.connected ? "Live updates ON" : "Reconnecting..."} className={`inline-flex items-center gap-1 text-[10px] font-arabic font-bold px-2 py-1 rounded-full ${live.connected ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                            {live.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {live.connected ? tr("مباشر") : tr("جاري الاتصال")}
                        </span>
                        <button data-testid="bid-close-btn" onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-[var(--text-muted)] font-arabic-body">{top ? "أعلى مزايدة" : "السعر الابتدائي"}</div>
                            <div className="font-latin font-black text-2xl text-[var(--accent)]">{Number(top?.amount || listing.price || 0).toLocaleString()} <span className="text-xs">{listing.currency || "ر.س"}</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-[var(--text-muted)] font-arabic-body">{tr("عدد المزايدات")}</div>
                            <div className="font-arabic font-black text-xl text-[var(--text)]" data-testid="bid-live-count">{liveCount}</div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-2">
                        <label className="block text-xs font-arabic font-bold text-[var(--text)]">{tr("مبلغ المزايدة ")}<span className="text-[var(--text-muted)] font-arabic-body">(الحد الأدنى: {minRequired.toLocaleString()})</span></label>
                        <input data-testid="bid-amount" type="number" min={minRequired} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${minRequired}`} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-3 text-base font-bold text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin" />
                        {err && <div className="text-xs text-red-600 font-arabic-body">{err}</div>}
                        <button data-testid="bid-submit" disabled={busy || !amount} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] py-3 rounded-xl font-arabic font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                            <Gavel className="w-4 h-4" /> {busy ? "جاري الإيداع..." : "أكد المزايدة"}
                        </button>
                    </form>

                    {bids.length > 0 && (
                        <div>
                            <div className="text-xs font-arabic font-bold text-[var(--text)] mb-2">{tr("تاريخ المزايدات")}</div>
                            <div className="max-h-48 overflow-y-auto space-y-1.5">
                                {bids.map((b, i) => (
                                    <div key={b.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${i === 0 ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30" : "bg-[var(--surface-elevated)]"}`}>
                                        <div className="font-arabic-body text-xs text-[var(--text)]">
                                            {b.bidder_name} {b.verified && "✓"} {i === 0 && <span className="text-[var(--primary)] font-bold">{tr("(الأعلى)")}</span>}
                                        </div>
                                        <div className="font-latin font-bold text-sm text-[var(--text)]">{Number(b.amount).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
