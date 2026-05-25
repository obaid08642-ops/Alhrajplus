// CitySelect — clean dropdown (NOT search) for picking a city/district.
// Used in PostListing. Lists ALL cities of the active country directly.
// Falls back to a small inline search ONLY if user picks "أخرى..." for rare cities.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search as SearchIcon, MapPin, X } from "lucide-react";
import api from "@/lib/api";
import { tr } from "@/contexts/I18nContext";

export default function CitySelect({
    value,
    onChange,
    kind = "city",      // "city" | "district"
    country,            // ISO-2
    parentCity = "",    // for kind=district
    staticItems = [],   // array of { name_ar } from country.cities
    placeholder,
    testId,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [q, setQ] = useState("");
    const [remote, setRemote] = useState([]);
    const [loading, setLoading] = useState(false);
    const wrapRef = useRef(null);
    const debounceRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setSearchMode(false); } };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Reset search when country/city changes
    useEffect(() => { setRemote([]); setQ(""); setSearchMode(false); }, [country, parentCity]);

    // Live geo search (only when user explicitly enters search mode)
    useEffect(() => {
        if (!searchMode || q.length < 2) { setRemote([]); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const params = kind === "district"
                    ? { q, country, type: "district", lang: "ar", limit: 25 }
                    : { q, country, type: "city", lang: "ar", limit: 25 };
                const { data } = await api.get("/geo/search", { params });
                setRemote(data || []);
            } catch (_) { setRemote([]); }
            finally { setLoading(false); }
        }, 320);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [q, searchMode, kind, country]);

    const localItems = useMemo(() => {
        return (staticItems || []).map((it) => (typeof it === "string" ? { name: it } : { name: it.name_ar || it.name }));
    }, [staticItems]);

    const remoteItems = useMemo(() => {
        const seen = new Set(localItems.map((x) => x.name));
        return (remote || []).filter((r) => !seen.has(r.name)).map((r) => ({ name: r.name, parent: r.parent, fromGeo: true }));
    }, [remote, localItems]);

    const pick = (name) => {
        onChange?.(name);
        setOpen(false);
        setSearchMode(false);
        setQ("");
    };

    const displayLabel = value || (placeholder || tr(kind === "city" ? "اختر المدينة" : "اختر الحي / المنطقة"));

    return (
        <div ref={wrapRef} className="relative" data-testid={testId}>
            {/* Trigger button - shows like a real dropdown */}
            <button
                type="button"
                data-testid={`${testId}-trigger`}
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className={`w-full flex items-center justify-between gap-2 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border ${open ? "border-[var(--primary)]" : "border-[var(--border)]"} text-[var(--text)] outline-none font-arabic-body ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-[var(--primary)]/60"}`}
            >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-start">
                    <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span className={`truncate ${value ? "text-[var(--text)] font-bold" : "text-[var(--text-muted)]"}`}>{displayLabel}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-hidden flex flex-col">
                    {/* Header: simple dropdown vs search mode */}
                    {!searchMode ? (
                        <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold font-arabic text-[var(--text-muted)]">
                                {kind === "city" ? tr("اختر مدينة من القائمة") : tr("اختر حياً من القائمة")}
                            </span>
                            <button
                                type="button"
                                data-testid={`${testId}-search-toggle`}
                                onClick={() => setSearchMode(true)}
                                className="text-[10px] text-[var(--primary)] font-bold flex items-center gap-1 font-arabic hover:underline"
                            >
                                <SearchIcon className="w-3 h-3" /> {tr("لم تجدها؟ ابحث")}
                            </button>
                        </div>
                    ) : (
                        <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
                            <SearchIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                            <input
                                autoFocus
                                data-testid={`${testId}-search-input`}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder={kind === "city" ? tr("اكتب اسم المدينة...") : tr("اكتب اسم الحي...")}
                                className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)] placeholder:text-[var(--text-muted)]"
                            />
                            <button type="button" onClick={() => { setSearchMode(false); setQ(""); setRemote([]); }} className="p-1 rounded-md hover:bg-[var(--surface-elevated)]">
                                <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            </button>
                        </div>
                    )}

                    {/* Items list */}
                    <div className="overflow-y-auto flex-1">
                        {/* Local cities (always shown when not searching, or filtered when searching) */}
                        {(!searchMode || q.length === 0) && localItems.length > 0 && localItems.map((it, i) => (
                            <button
                                key={`local-${it.name}-${i}`}
                                type="button"
                                data-testid={`${testId}-opt-${i}`}
                                onClick={() => pick(it.name)}
                                className={`w-full text-start px-3 py-2.5 hover:bg-[var(--primary)]/10 border-b border-[var(--border)]/50 last:border-b-0 flex items-center justify-between gap-2 ${value === it.name ? "bg-[var(--primary)]/10" : ""}`}
                            >
                                <span className="text-sm font-arabic-body text-[var(--text)] truncate">{it.name}</span>
                                {value === it.name && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}
                            </button>
                        ))}

                        {searchMode && q.length >= 2 && (
                            <>
                                {/* Filtered local */}
                                {localItems.filter((it) => it.name.includes(q)).map((it, i) => (
                                    <button
                                        key={`flocal-${it.name}-${i}`}
                                        type="button"
                                        onClick={() => pick(it.name)}
                                        className="w-full text-start px-3 py-2.5 hover:bg-[var(--primary)]/10 border-b border-[var(--border)]/50 flex items-center justify-between"
                                    >
                                        <span className="text-sm font-arabic-body text-[var(--text)] truncate">{it.name}</span>
                                    </button>
                                ))}
                                {/* Remote (Nominatim) */}
                                {remoteItems.map((it, i) => (
                                    <button
                                        key={`geo-${it.name}-${i}`}
                                        type="button"
                                        onClick={() => pick(it.name)}
                                        className="w-full text-start px-3 py-2.5 hover:bg-[var(--primary)]/10 border-b border-[var(--border)]/50 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-arabic-body text-[var(--text)] truncate">{it.name}</div>
                                            {it.parent && <div className="text-[10px] text-[var(--text-muted)] truncate">{it.parent}</div>}
                                        </div>
                                        <span className="text-[9px] font-bold text-[var(--primary)] shrink-0">🌍</span>
                                    </button>
                                ))}
                                {loading && (
                                    <div className="px-3 py-3 text-center text-[10px] text-[var(--text-muted)] font-arabic-body flex items-center justify-center gap-2">
                                        <span className="inline-block w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></span>
                                        {tr("بحث في الخريطة...")}
                                    </div>
                                )}
                                {!loading && q.length >= 2 && remoteItems.length === 0 && localItems.filter((it) => it.name.includes(q)).length === 0 && (
                                    <div className="px-3 py-4 text-center text-[11px] text-[var(--text-muted)] font-arabic-body">
                                        {tr("لا نتائج — جرّب كلمة أخرى")}
                                    </div>
                                )}
                            </>
                        )}

                        {!searchMode && localItems.length === 0 && (
                            <div className="px-3 py-6 text-center text-[11px] text-[var(--text-muted)] font-arabic-body">
                                {kind === "district" ? tr("اختر مدينة أولاً") : tr("اختر دولتك أولاً من الأعلى")}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
