import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, Heart, List, RefreshCw, Search, Tag, Users, BellRing, Trash2, Check, X, RotateCcw, ExternalLink, Eye } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import ListingCard from "@/components/listings/ListingCard";

const views = {
  "/favorites": { key: "favorites", title: "المفضلة", icon: Heart },
  "/watchlist": { key: "watches", title: "قائمة المتابعة", icon: BellRing },
  "/my-listings": { key: "mine", title: "إعلاناتي", icon: List },
  "/offers": { key: "offers", title: "العروض والمفاوضات", icon: Tag },
  "/following": { key: "following", title: "متابعاتي", icon: Users },
  "/saved-searches": { key: "saved", title: "الأبحاث المحفوظة", icon: Bookmark },
};
const randomKey = () => globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const rowsOf = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];

export default function AccountCollectionPage() {
  const { t } = useI18n();
  const { country } = useCountry();
  const location = useLocation();
  const config = views[location.pathname] || views["/favorites"];
  const Icon = config.icon;
  const [rows, setRows] = useState([]);
  const [following, setFollowing] = useState({ categories: [], sellers: [] });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [runResult, setRunResult] = useState(null);

  const endpoint = useMemo(() => ({ favorites: "/favorites", watches: "/watches", mine: "/listings/me/mine", offers: "/offers/mine", following: "/following", saved: "/search/saved" }[config.key]), [config.key]);
  const load = useCallback(async () => {
    setBusy(true); setError(""); setRunResult(null);
    try {
      const { data } = await api.get(endpoint, { params: { country_code: country } });
      if (config.key === "following") setFollowing(data || { categories: [], sellers: [] });
      else setRows(rowsOf(data));
    } catch (err) { setRows([]); setFollowing({ categories: [], sellers: [] }); setError(err?.response?.data?.detail || t("تعذر تحميل البيانات")); }
    finally { setBusy(false); }
  }, [endpoint, country, config.key, t]);
  useEffect(() => { load(); }, [load]);

  const perform = async (id, task, after) => {
    setActionBusy(id);
    try { await task(); after?.(); }
    catch (e) { setError(e?.response?.data?.detail || t("تعذر تنفيذ الإجراء")); }
    finally { setActionBusy(""); }
  };
  const decide = (offer, action) => perform(`${offer.id}-${action}`, async () => {
    let counter_amount;
    if (action === "counter") {
      const proposed = window.prompt(t("أدخل قيمة العرض المضاد"), String(offer.amount || ""));
      counter_amount = Number(proposed);
      if (!Number.isFinite(counter_amount) || counter_amount <= 0) throw new Error(t("قيمة العرض غير صالحة"));
    }
    await api.patch(`/listing-offers/${offer.id}`, { action, counter_amount, client_action_id: randomKey() });
  }, load);
  const runSearch = (row) => perform(`run-${row.id}`, async () => {
    const { data } = await api.get(`/search/saved/${row.id}/run`, { params: { country_code: country } });
    setRunResult({ label: row.q, items: rowsOf(data?.items), total: data?.total || 0 });
  });

  const empty = <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]"><Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-arabic font-bold text-[var(--text)]">{t("لا توجد بيانات بعد")}</p><Link to="/" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm">{t("استكشف الإعلانات")}</Link></div>;
  const Action = ({ id, onClick, children, danger = false }) => <button disabled={actionBusy === id} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-arabic font-bold disabled:opacity-50 ${danger ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300" : "bg-[var(--primary)]/10 text-[var(--primary)]"}`}>{children}</button>;

  return <main className="max-w-6xl mx-auto px-3 sm:px-6 py-5 pb-28">
    <div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-3 min-w-0"><div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)] flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div><div className="min-w-0"><h1 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)] truncate">{t(config.title)}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body">{t("البيانات مرتبطة بالدولة المختارة")}: {country}</p></div></div><button onClick={load} disabled={busy} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-50" aria-label={t("تحديث")}><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button></div>
    {error && <div className="mb-4 rounded-2xl border border-red-300/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 text-sm font-arabic-body flex justify-between gap-3"><span>{error}</span><button onClick={load} className="underline font-bold shrink-0">{t("إعادة المحاولة")}</button></div>}
    {busy ? <div className="py-20 text-center text-[var(--text-muted)] font-arabic-body">{t("جاري التحميل...")}</div> : config.key === "following" ? <Following data={following} country={country} Action={Action} perform={perform} t={t} reload={load} /> : rows.length === 0 ? empty : <CollectionRows kind={config.key} rows={rows} Action={Action} perform={perform} decide={decide} runSearch={runSearch} country={country} t={t} reload={load} />}
    {runResult && <section className="mt-7"><div className="flex items-center justify-between mb-3"><h2 className="font-arabic font-black text-lg text-[var(--text)]">{t("نتائج البحث المحفوظ")}: {runResult.label}</h2><span className="text-xs text-[var(--text-muted)]">{runResult.total}</span></div>{runResult.items.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{runResult.items.map((item) => <ListingCard key={item.id} listing={item} />)}</div> : empty}</section>}
  </main>;
}

function CollectionRows({ kind, rows, Action, perform, decide, runSearch, country, t, reload }) {
  if (["favorites", "watches", "mine"].includes(kind)) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{rows.map((row) => { const listing = row.listing || row; const id = listing.id || row.listing_id; return <div key={id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"><ListingCard listing={listing} />{kind === "favorites" && <div className="p-3 pt-0"><Action id={`fav-${id}`} danger onClick={() => perform(`fav-${id}`, () => api.delete(`/favorites/${id}`), reload)}><Heart className="w-3.5 h-3.5" />{t("إزالة من المفضلة")}</Action></div>}{kind === "watches" && <div className="p-3 pt-0 flex items-center justify-between gap-2"><span className="text-[11px] text-[var(--text-muted)] font-arabic-body">{row.target_price ? `${t("تنبيه عند")} ${Number(row.target_price).toLocaleString()}` : t("متابعة الإعلان")}</span><Action id={`watch-${id}`} danger onClick={() => perform(`watch-${id}`, () => api.delete(`/watches/${id}`), reload)}><Trash2 className="w-3.5 h-3.5" />{t("إلغاء المتابعة")}</Action></div>}</div>; })}</div>;
  }
  if (kind === "offers") return <div className="space-y-3">{rows.map((offer) => <OfferRow key={offer.id} offer={offer} Action={Action} decide={decide} t={t} />)}</div>;
  return <div className="space-y-3">{rows.map((row) => <div key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.q}</p><p className="text-xs text-[var(--text-muted)] font-arabic-body">{[row.category, row.city, row.min_price != null ? `${row.min_price}–${row.max_price ?? "∞"}` : null].filter(Boolean).join(" · ") || country}</p><p className="text-[11px] text-[var(--text-muted)] mt-1">{row.alerts_enabled === false ? t("التنبيهات متوقفة") : t("تنبيهات مفعلة")}</p></div><div className="flex gap-2"><Action id={`run-${row.id}`} onClick={() => runSearch(row)}><Eye className="w-3.5 h-3.5" />{t("تشغيل")}</Action><Action id={`saved-${row.id}`} danger onClick={() => perform(`saved-${row.id}`, () => api.delete(`/search/saved/${row.id}`, { params: { country_code: country } }), reload)}><Trash2 className="w-3.5 h-3.5" />{t("حذف")}</Action></div></div>)}</div>;
}

function OfferRow({ offer, Action, decide, t }) {
  const sellerPending = offer.is_seller && offer.status === "pending";
  const buyerCountered = !offer.is_seller && offer.status === "countered";
  const label = offer.status === "accepted" ? t("مقبول") : offer.status === "rejected" ? t("مرفوض") : offer.status === "expired" ? t("منتهي") : offer.status === "countered" ? t("عرض مضاد") : t("قيد المراجعة");
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><div className="flex items-center justify-between gap-3"><Link to={`/listing/${offer.listing_id}`} className="min-w-0 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center"><Tag className="w-5 h-5" /></div><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{offer.listing?.title || t("إعلان غير متاح")}</p><p className="text-xs text-[var(--text-muted)]">{offer.is_seller ? t("عرض وارد") : t("عرضي")} · {Number(offer.amount || 0).toLocaleString()} {offer.currency || ""}</p></div></Link><span className="text-[10px] rounded-full px-2 py-1 bg-[var(--surface-elevated)] text-[var(--text-muted)] font-arabic font-bold">{label}</span></div>{offer.expires_at && !["accepted", "rejected", "expired"].includes(offer.status) && <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 font-arabic-body">{t("ينتهي")}: {new Date(offer.expires_at).toLocaleString()}</p>}{(sellerPending || buyerCountered) && <div className="mt-3 flex flex-wrap gap-2">{sellerPending && <Action id={`${offer.id}-counter`} onClick={() => decide(offer, "counter")}><RotateCcw className="w-3.5 h-3.5" />{t("عرض مضاد")}</Action>}<Action id={`${offer.id}-accept`} onClick={() => decide(offer, "accept")}><Check className="w-3.5 h-3.5" />{t("قبول")}</Action><Action id={`${offer.id}-reject`} danger onClick={() => decide(offer, "reject")}><X className="w-3.5 h-3.5" />{t("رفض")}</Action></div>}</div>;
}

function Following({ data, country, Action, perform, t, reload }) {
  const cats = data?.categories || [], sellers = data?.sellers || [];
  if (!cats.length && !sellers.length) return <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]"><Users className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-arabic font-bold text-[var(--text)]">{t("لا توجد متابعات بعد")}</p></div>;
  return <div className="space-y-6"><section><h2 className="font-arabic font-black text-base text-[var(--text)] mb-3">{t("التصنيفات")}</h2><div className="space-y-2">{cats.map((row) => <div key={row.category} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><Link to={`/?category=${encodeURIComponent(row.category)}`} className="font-arabic font-bold text-[var(--text)]">{row.category}</Link><Action id={`cat-${row.category}`} danger onClick={() => perform(`cat-${row.category}`, () => api.delete(`/follow/category/${encodeURIComponent(row.category)}`, { params: { country_code: country } }), reload)}><Trash2 className="w-3.5 h-3.5" />{t("إلغاء المتابعة")}</Action></div>)}</div></section><section><h2 className="font-arabic font-black text-base text-[var(--text)] mb-3">{t("البائعون")}</h2><div className="space-y-2">{sellers.map((row) => <div key={row.seller_id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><Link to={`/seller/${row.seller_id}`} className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 overflow-hidden flex items-center justify-center text-[var(--primary)] font-bold">{row.seller?.avatar_url ? <img src={row.seller.avatar_url} alt="" className="w-full h-full object-cover" /> : String(row.seller?.name || t("بائع")).slice(0, 1)}</div><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.seller?.name || t("بائع")}</p><p className="text-[11px] text-[var(--text-muted)]">{row.seller?.verified ? t("موثّق") : t("بائع")}{row.seller?.trust_score != null ? ` · ${t("درجة الموثوقية")} ${row.seller.trust_score}` : ""}</p></div></Link><Action id={`seller-${row.seller_id}`} danger onClick={() => perform(`seller-${row.seller_id}`, () => api.post(`/sellers/${row.seller_id}/follow`, null, { params: { country_code: country } }), reload)}><Trash2 className="w-3.5 h-3.5" />{t("إلغاء المتابعة")}</Action></div>)}</div></section></div>;
}
