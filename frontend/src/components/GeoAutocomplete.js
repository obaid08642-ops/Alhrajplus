// GeoAutocomplete — web component for city/district autocomplete via /api/geo
// Uses static country.cities list + /api/geo/search (Nominatim) + /api/geo/districts (Overpass)
// to cover EVERY city and district in every country we serve.
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { tr } from "@/contexts/I18nContext";

export default function GeoAutocomplete({
    value,
    onChange,
    kind = "city", // "city" | "district"
    country,       // ISO-2 code, e.g. "SA"
    lang = "ar",
    staticItems = [], // [{ name_ar, ... }] from country.cities
    parentCity = "",  // required when kind === "district"
    placeholder,
    testId,
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState(value || "");
    const [remote, setRemote] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const wrapRef = useRef(null);

    useEffect(() => setQ(value || ""), [value]);

    // Click outside closes dropdown
    useEffect(() => {
        const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Auto-load districts for a city on open
    useEffect(() => {
        if (!open || kind !== "district" || !parentCity || q.length > 1) return;
        setLoading(true);
        api.get("/geo/districts", { params: { city: parentCity, country, lang, limit: 60 } })
            .then(({ data }) => setRemote(data || []))
            .catch(() => setRemote([]))
            .finally(() => setLoading(false));
    }, [open, kind, parentCity, country, lang, q]);

    // Debounced search on typing
    useEffect(() => {
        if (!open || q.length < 2) { return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const params = kind === "district"
                    ? { q, country, type: "district", lang, limit: 20 }
                    : { q, country, type: "city", lang, limit: 20 };
                const { data } = await api.get("/geo/search", { params });
                setRemote(data || []);
            } catch (_) { setRemote([]); }
            finally { setLoading(false); }
        }, 320);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [q, open, kind, country, lang]);

    // Merge static + remote, dedupe by name
    const items = useMemo(() => {
        const localFiltered = q
            ? staticItems.filter((it) => (it.name_ar || it.name || "").includes(q))
            : staticItems;
        const local = localFiltered.map((c) => ({ name: c.name_ar || c.name, source: "local" }));
        const seen = new Set(local.map((x) => x.name));
        for (const r of remote) {
            if (!seen.has(r.name)) {
                local.push({ name: r.name, parent: r.parent, source: "geo" });
                seen.add(r.name);
            }
        }
        return local;
    }, [staticItems, remote, q]);

    const pick = (name) => { onChange?.(name); setQ(name); setOpen(false); };

    return (
        <div ref={wrapRef} className="relative">
            <input
                data-testid={testId}
                value={q}
                onChange={(e) => { setQ(e.target.value); setOpen(true); onChange?.(e.target.value); }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder || tr(kind === "city" ? "ابحث عن مدينة..." : "ابحث عن حي...")}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
            />
            {open && (items.length > 0 || loading) && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    {loading && (
                        <div className="px-3 py-2 text-[10px] text-[var(--text-muted)] font-arabic-body flex items-center gap-2">
                            <span className="inline-block w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></span>
                            {tr("بحث في الخريطة...")}
                        </div>
                    )}
                    {items.map((it, i) => (
                        <button
                            key={`${it.name}-${i}`}
                            data-testid={`${testId}-opt-${i}`}
                            type="button"
                            onClick={() => pick(it.name)}
                            className="w-full text-start px-3 py-2 hover:bg-[var(--surface-elevated)] border-b border-[var(--border)] last:border-b-0 flex items-center justify-between gap-2"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-arabic-body text-[var(--text)] truncate">{it.name}</div>
                                {it.parent && <div className="text-[10px] text-[var(--text-muted)] truncate">{it.parent}</div>}
                            </div>
                            {it.source === "geo" && <span className="text-[9px] font-bold text-[var(--primary)] shrink-0">🌍 خريطة</span>}
                        </button>
                    ))}
                    {!loading && items.length === 0 && (
                        <div className="px-3 py-3 text-center text-[10px] text-[var(--text-muted)] font-arabic-body">
                            {tr("لا نتائج — جرّب كلمة أخرى")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
