import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * Cascading selector for cars: brand → model → year → trim.
 * Stores the picked values into `attrs.car_brand / car_model / car_year / car_trim`
 * inside the parent form via the `onChange` callback.
 *
 * Designed for the post-listing flow. Loads each level on demand so we don't
 * ship a 200KB catalog blob to the client. Cache is per-mount which is fine
 * since users typically pick once per listing.
 */
export function CarCascade({ value, onChange, tr = (s) => s }) {
    const v = value || {};
    const [brands, setBrands] = useState([]);
    const [years, setYears] = useState([]);
    const [models, setModels] = useState([]);
    const [trims, setTrims] = useState([]);

    useEffect(() => {
        api.get("/meta/car-brands").then(({ data }) => {
            setBrands(data.brands || []);
            setYears(data.years || []);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!v.car_brand) { setModels([]); return; }
        api.get("/meta/car-models", { params: { brand: v.car_brand } }).then(({ data }) => setModels(data.models || [])).catch(() => setModels([]));
    }, [v.car_brand]);

    useEffect(() => {
        if (!v.car_brand || !v.car_model) { setTrims([]); return; }
        api.get("/meta/car-trims", { params: { brand: v.car_brand, model: v.car_model } }).then(({ data }) => setTrims(data.trims || [])).catch(() => setTrims([]));
    }, [v.car_brand, v.car_model]);

    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="car-cascade">
            <Pick label={tr("الماركة")} value={v.car_brand || ""} options={brands} onChange={(brand) => set({ car_brand: brand, car_model: "", car_trim: "" })} testid="car-brand" />
            <Pick label={tr("الموديل")} value={v.car_model || ""} options={models} onChange={(m) => set({ car_model: m, car_trim: "" })} disabled={!v.car_brand} testid="car-model" />
            <Pick label={tr("السنة")} value={v.car_year || ""} options={years} onChange={(y) => set({ car_year: y })} testid="car-year" />
            <Pick label={tr("الفئة")} value={v.car_trim || ""} options={trims} onChange={(t) => set({ car_trim: t })} disabled={!v.car_model} testid="car-trim" />
        </div>
    );
}


/**
 * Cascading selector for phones: brand → model → storage → color.
 * Storage & color come back together from /meta/phone-variants so we save a
 * round-trip vs. fetching them separately.
 */
export function PhoneCascade({ value, onChange, tr = (s) => s }) {
    const v = value || {};
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [storages, setStorages] = useState([]);
    const [colors, setColors] = useState([]);

    useEffect(() => {
        api.get("/meta/phone-brands").then(({ data }) => setBrands(data.brands || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!v.phone_brand) { setModels([]); return; }
        api.get("/meta/phone-models", { params: { brand: v.phone_brand } }).then(({ data }) => setModels(data.models || [])).catch(() => setModels([]));
    }, [v.phone_brand]);

    useEffect(() => {
        if (!v.phone_brand || !v.phone_model) { setStorages([]); setColors([]); return; }
        api.get("/meta/phone-variants", { params: { brand: v.phone_brand, model: v.phone_model } }).then(({ data }) => {
            setStorages(data.storage || []);
            setColors(data.color || []);
        }).catch(() => { setStorages([]); setColors([]); });
    }, [v.phone_brand, v.phone_model]);

    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="phone-cascade">
            <Pick label={tr("الماركة")} value={v.phone_brand || ""} options={brands} onChange={(b) => set({ phone_brand: b, phone_model: "", phone_storage: "", phone_color: "" })} testid="phone-brand" />
            <Pick label={tr("الموديل")} value={v.phone_model || ""} options={models} onChange={(m) => set({ phone_model: m, phone_storage: "", phone_color: "" })} disabled={!v.phone_brand} testid="phone-model" />
            <Pick label={tr("السعة")} value={v.phone_storage || ""} options={storages} onChange={(s) => set({ phone_storage: s })} disabled={!v.phone_model} testid="phone-storage" />
            <Pick label={tr("اللون")} value={v.phone_color || ""} options={colors} onChange={(c) => set({ phone_color: c })} disabled={!v.phone_model} testid="phone-color" />
        </div>
    );
}


function Pick({ label, value, options, onChange, disabled, testid }) {
    return (
        <label className={`block ${disabled ? "opacity-60" : ""}`}>
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label}</span>
            <select
                disabled={disabled || !options?.length}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm text-[var(--text)] font-arabic-body outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed"
            >
                <option value="">—</option>
                {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </label>
    );
}
