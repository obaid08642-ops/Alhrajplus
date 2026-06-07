// LocationPicker (Web) — cascading dropdown backed by /api/locations/children.
// Mirrors mobile LocationPicker. Renders one chip per level (governorate →
// city → district → village). Auto-refreshes when `lang` changes and clears
// descendants on selection. Includes an inline search box per level.
//
// Props:
//   country   : ISO-2 (e.g. "EG"). Drives the level set + initial filter.
//   value     : { adm1, adm2, adm3, city }  (each is { id, name, ... } | null)
//   onChange  : (next) => void   new value with selected levels.
//   className : optional outer wrapper className.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X, Search as SearchIcon, MapPin, Check } from "lucide-react";
import { useI18n, tr } from "@/contexts/I18nContext";

// 🔒 EMERGENCY HARDCODE — bypass the shared axios `api` instance + any
// env-injection path. The picker MUST always reach the Geonames-backed
// preview backend regardless of `REACT_APP_BACKEND_URL` / build env.
const LOCATIONS_BASE = "https://platform-inspect.preview.emergentagent.com/api/locations";
const LEVELS_BY_COUNTRY = {
    EG: ["adm1", "adm2", "adm3", "city"],
    default: ["adm2", "city"],
};

function levelsFor(country) {
    return LEVELS_BY_COUNTRY[country] || LEVELS_BY_COUNTRY.default;
}

function labelFor(country, level) {
    if (country === "EG") {
        if (level === "adm1") return tr("المحافظة");
        if (level === "adm2") return tr("المدينة / المركز");
        if (level === "adm3") return tr("الحي / القسم");
        if (level === "city") return tr("القرية / المنطقة");
    }
    if (level === "adm1") return tr("المنطقة");
    if (level === "adm2") return tr("المدينة");
    if (level === "city") return tr("الحي");
    return tr("الموقع");
}

function LevelRow({ country, level, value, parent, lang, onPick, disabled }) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const wrapRef = useRef(null);

    // Close on outside click.
    useEffect(() => {
        const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Fetch children when opened or when language/parent changes.
    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setFetchError("");
            const sp = new URLSearchParams({ lang: lang || "ar", level, country: country || "EG", limit: "800" });
            if (parent?.id) sp.set("parent_id", String(parent.id));
            const url = `${LOCATIONS_BASE}/children?${sp.toString()}`;
            try {
                // eslint-disable-next-line no-console
                console.info("[LocationPicker] GET", url);
                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const data = await r.json();
                const list = Array.isArray(data) ? data : [];
                // eslint-disable-next-line no-console
                console.info(`[LocationPicker] ✓ ${level} → ${list.length} records`);
                if (!cancelled) setOptions(list);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[LocationPicker] FAIL", e?.message, "URL=", url);
                if (!cancelled) { setOptions([]); setFetchError(`${e?.message || "network"} @ ${url}`); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [open, lang, level, country, parent?.id]);

    const filtered = useMemo(() => {
        if (!q.trim()) return options;
        const s = q.toLowerCase();
        return options.filter((o) => (o.name || "").toLowerCase().includes(s));
    }, [q, options]);

    const label = labelFor(country, level);
    return (
        <div ref={wrapRef} className="relative" data-testid={`location-picker-${level}`}>
            <label className="block text-[11px] font-arabic font-bold text-[var(--text-muted)] mb-1.5">{label}</label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                data-testid={`location-picker-${level}-trigger`}
                className={`w-full flex items-center justify-between gap-2 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border ${open ? "border-[var(--primary)]" : "border-[var(--border)]"} text-[var(--text)] outline-none font-arabic-body ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--primary)]/60"}`}
            >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-start">
                    <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span className={`truncate ${value ? "text-[var(--text)] font-bold" : "text-[var(--text-muted)]"}`}>
                        {value?.name || tr("اختر")}
                    </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-hidden flex flex-col">
                    <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
                        <SearchIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={tr("ابحث...")}
                            data-testid={`location-picker-${level}-search`}
                            className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)] placeholder:text-[var(--text-muted)]"
                        />
                        {q && (
                            <button type="button" onClick={() => setQ("")} className="p-1 rounded hover:bg-[var(--surface-elevated)]">
                                <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="px-3 py-6 text-center text-[11px] text-[var(--text-muted)] font-arabic-body flex items-center justify-center gap-2">
                                <span className="inline-block w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></span>
                                {tr("جاري التحميل...")}
                            </div>
                        ) : fetchError ? (
                            <div className="px-3 py-4 text-center text-[11px] text-red-500 font-arabic-body break-all">
                                ⚠️ {tr("خطأ في الاتصال")}: {fetchError}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-[11px] text-[var(--text-muted)] font-arabic-body">
                                {tr("لا توجد نتائج")}
                            </div>
                        ) : (
                            filtered.map((it) => (
                                <button
                                    key={it.id}
                                    type="button"
                                    onClick={() => { onPick(it); setOpen(false); setQ(""); }}
                                    data-testid={`location-opt-${it.id}`}
                                    className={`w-full text-start px-3 py-2.5 hover:bg-[var(--primary)]/10 border-b border-[var(--border)]/50 last:border-b-0 flex items-center justify-between gap-2 ${value?.id === it.id ? "bg-[var(--primary)]/10" : ""}`}
                                >
                                    <span className="text-sm font-arabic-body text-[var(--text)] truncate">{it.name}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {it.population > 1000 && (
                                            <span className="text-[10px] text-[var(--text-muted)]">{it.population.toLocaleString()}</span>
                                        )}
                                        {value?.id === it.id && <Check className="w-4 h-4 text-[var(--primary)]" />}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LocationPicker({ country = "EG", value, onChange, className = "" }) {
    const { lang } = useI18n();
    const [supportedCountries, setSupportedCountries] = useState(null);
    const [bootError, setBootError] = useState("");
    // Auto-fallback: if the requested country has no imported data yet (e.g.
    // user is on SA but only EG is seeded), silently switch to EG so the
    // dropdown is never empty.
    useEffect(() => {
        let cancelled = false;
        const url = `${LOCATIONS_BASE}/countries`;
        // eslint-disable-next-line no-console
        console.info("[LocationPicker] booting — fetching", url);
        fetch(url)
            .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then((data) => {
                const codes = (data || []).map((x) => x.code);
                // eslint-disable-next-line no-console
                console.info("[LocationPicker] supported countries:", codes);
                if (!cancelled) setSupportedCountries(codes);
            })
            .catch((e) => {
                // eslint-disable-next-line no-console
                console.error("[LocationPicker] /countries FAILED:", e?.message, "URL=", url);
                if (!cancelled) { setSupportedCountries([]); setBootError(e?.message || "network"); }
            });
        return () => { cancelled = true; };
    }, []);

    // While only Egypt is imported, hard-lock the picker to EG regardless of
    // the user's selected country. As soon as additional Gulf countries are
    // imported (and surfaced via /locations/countries) this falls back to the
    // dynamic supported-list logic.
    const effectiveCountry = useMemo(() => {
        if (!supportedCountries || supportedCountries.length === 0) {
            // No data fetched yet → still default to EG so the picker
            // labels render with the 4-level Egyptian hierarchy.
            return "EG";
        }
        if (supportedCountries.includes(country)) return country;
        return supportedCountries.includes("EG") ? "EG" : supportedCountries[0];
    }, [country, supportedCountries]);

    const levels = levelsFor(effectiveCountry);
    const showFallbackNotice = effectiveCountry !== country && supportedCountries && supportedCountries.length > 0;

    const handlePick = (level, item) => {
        const idx = levels.indexOf(level);
        const next = { ...(value || {}) };
        next[level] = item;
        // Clear all descendant levels — the chain restarts from here.
        for (let j = idx + 1; j < levels.length; j++) delete next[levels[j]];
        onChange?.(next);
    };

    return (
        <div className={className} data-testid="location-picker-root">
            {bootError && (
                <div className="mb-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 font-arabic-body break-all">
                    ⚠️ {tr("لا يمكن الاتصال بخدمة المواقع")}: <code>{bootError}</code> @ <code>{LOCATIONS_BASE}</code>
                </div>
            )}
            {showFallbackNotice && (
                <div className="mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 font-arabic-body">
                    {tr("بيانات الموقع متاحة حالياً لـ")} <strong>{effectiveCountry}</strong> {tr("فقط — استخدامه مؤقتاً.")}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {levels.map((lvl, i) => {
                    const parent = i === 0 ? null : value?.[levels[i - 1]];
                    const disabled = i > 0 && !parent;
                    return (
                        <LevelRow
                            key={`${effectiveCountry}-${lvl}-${lang}`}
                            country={effectiveCountry}
                            level={lvl}
                            value={value?.[lvl]}
                            parent={parent}
                            lang={lang}
                            disabled={disabled}
                            onPick={(item) => handlePick(lvl, item)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
