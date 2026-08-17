import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, Heart, List, RefreshCw, Search, Tag, Users, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import ListingCard from "@/components/listings/ListingCard";

const views = {
  "/favorites": { key: "favorites", title: "المفضلة", icon: Heart },
  "/my-listings": { key: "mine", title: "إعلاناتي", icon: List },
  "/offers": { key: "offers", title: "العروض والمفاوضات", icon: Tag },
  "/following": { key: "following", title: "متابعاتي", icon: Users },
  "/saved-searches": { key: "saved", title: "الأبحاث المحفوظة", icon: Bookmark },
};

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.listings)) return payload.listings;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export default function AccountCollectionPage() {
  const { t } = useI18n();
  const { country } = useCountry();
  const location = useLocation();
  const config = views[location.pathname] || views["/favorites"];
  const Icon = config.icon;
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => ({
    favorites: "/favorites",
    mine: "/listings/me/mine",
    offers: "/offers/mine",
    following: "/following",
    saved: "/search/saved",
  }[config.key]), [config.key]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await api.get(endpoint, { params: { country_code: country } });
      setRows(normalizeRows(response.data));
    } catch (err) {
      setRows([]);
      setError(err?.response?.data?.detail || t("تعذر تحميل البيانات"));
    } finally {
      setBusy(false);
    }
  }, [endpoint, country, t]);

  useEffect(() => { load(); }, [load]);

  const listingRows = rows.filter((row) => row && (row.id || row.listing_id) && (row.title || row.listing));
  const otherRows = rows.filter((row) => !listingRows.includes(row));

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-5 pb-28">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)] flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
          <div className="min-w-0"><h1 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)] truncate">{t(config.title)}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body">{t("البيانات مرتبطة بالدولة المختارة")}: {country}</p></div>
        </div>
        <button onClick={load} disabled={busy} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] disabled:opacity-50" aria-label={t("تحديث")}><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
      </div>

      {error && <div className="mb-4 rounded-2xl border border-red-300/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 text-sm font-arabic-body">{error}</div>}
      {busy && <div className="py-20 text-center text-[var(--text-muted)] font-arabic-body">{t("جاري التحميل...")}</div>}
      {!busy && !error && rows.length === 0 && <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]"><Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-arabic font-bold text-[var(--text)]">{t("لا توجد بيانات بعد")}</p><Link to="/" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm">{t("استكشف الإعلانات")}</Link></div>}

      {!busy && listingRows.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{listingRows.map((row) => {
        const listing = row.listing || row;
        return <ListingCard key={listing.id || row.listing_id} listing={listing} compact={false} />;
      })}</div>}

      {!busy && otherRows.length > 0 && <div className="space-y-3 mt-2">{otherRows.map((row, index) => <div key={row.id || row.search_id || row.user_id || index} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.name || row.title || row.query || row.keyword || t("عنصر محفوظ")}</p><p className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{row.description || row.city || row.country_code || row.status || ""}</p></div>{(row.listing_id || row.id) && config.key === "offers" && <Link to={`/listing/${row.listing_id || row.id}`} className="shrink-0 p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]" aria-label={t("فتح الإعلان")}><ExternalLink className="w-4 h-4" /></Link>}</div>)}</div>}
    </main>
  );
}
