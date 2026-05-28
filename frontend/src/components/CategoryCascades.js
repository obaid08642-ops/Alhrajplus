import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * Cascading + structured selectors for cars + phones.
 *
 * Designed to be the SINGLE source of truth for these two categories — the
 * generic `cat.fields` renderer in PostListing.js is suppressed when one of
 * these cascades is mounted so there's zero duplication below the price.
 *
 * All values land under `value` (a plain object) which is forwarded to
 * `form.custom_fields` by the parent. The backend treats `custom_fields`
 * as a free-form blob so adding new keys is zero-risk.
 */

const TR = (s) => s;

const CAR_STATIC_OPTIONS = {
    mileage: ["أقل من 10,000 كم", "10,000 - 50,000 كم", "50,000 - 100,000 كم", "100,000 - 200,000 كم", "أكثر من 200,000 كم"],
    transmission: ["أوتوماتيك", "عادي (يدوي)"],
    fuel_type: ["بنزين", "ديزل", "هايبرد", "كهرباء"],
    condition: ["جديدة", "مستعملة", "ممتازة", "تحتاج إصلاحات"],
    listing_type: ["للبيع", "تحويل بنكي", "أقساط"],
};

const PHONE_STATIC_OPTIONS = {
    condition: ["جديد", "مستعمل", "كالجديد"],
    ram: ["4GB", "6GB", "8GB", "12GB", "16GB"],
    warranty: ["نعم", "لا", "منتهي"],
};

const FURNITURE_OPTIONS = {
    type: ["كنب / مجلس", "سرير", "خزانة / دولاب", "طاولة طعام", "طاولة قهوة", "كراسي", "مكتب", "ركن", "تحفة / ديكور", "سجاد", "ستائر", "غرفة نوم كاملة", "آخر"],
    condition: ["جديد بالكرتون", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "يحتاج ترميم"],
    material: ["خشب طبيعي", "خشب MDF", "معدن", "قماش", "جلد طبيعي", "جلد صناعي", "بلاستيك", "زجاج", "روطان", "آخر"],
    color: ["أبيض", "أسود", "بني", "رمادي", "بيج", "أزرق", "أحمر", "أخضر", "ذهبي", "فضي", "آخر"],
    usage_duration: ["جديد - لم يستخدم", "أقل من 6 أشهر", "6 شهور - سنة", "1-3 سنوات", "3-5 سنوات", "أكثر من 5 سنوات"],
    size: ["صغير", "متوسط", "كبير", "ضخم", "مفرد", "مزدوج", "كينج", "كوين"],
    location: ["مجلس", "صالة", "غرفة نوم", "غرفة أطفال", "مطبخ", "مكتب", "خارجي / حديقة", "مدخل", "آخر"],
};

const APPLIANCE_OPTIONS = {
    appliance_type: ["ثلاجة", "غسالة ملابس", "نشافة", "غسالة صحون", "فرن كهربائي", "فرن غاز", "ميكروويف", "مكيف سبليت", "مكيف شباك", "فريزر", "خلاط", "محضرة طعام", "مكنسة كهربائية", "سخان مياه", "مروحة", "تلفزيون", "آخر"],
    brand: ["LG", "Samsung", "Daewoo", "Toshiba", "Panasonic", "Hitachi", "Sharp", "Sony", "Whirlpool", "Bosch", "Siemens", "Hoover", "Westpoint", "GE", "Midea", "Haier", "آخر"],
    condition: ["جديد بالكرتون", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "يحتاج صيانة"],
    warranty: ["ضمان وكيل", "ضمان محل", "ضمان منتهٍ", "بدون ضمان"],
    power: ["موفر للطاقة (Inverter)", "عادي", "موفر للطاقة", "غير محدد"],
    usage: ["منزلي", "تجاري / مطعم", "مكتبي", "صناعي"],
    voltage: ["110V", "220V", "110V/220V", "غير محدد"],
    origin: ["كوريا الجنوبية", "اليابان", "ألمانيا", "الصين", "تركيا", "إيطاليا", "أمريكا", "السعودية", "الإمارات", "تايلاند", "آخر"],
};


export function CarCascade({ value, onChange, tr = TR }) {
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
        api.get("/meta/car-models", { params: { brand: v.car_brand } })
            .then(({ data }) => setModels(data.models || []))
            .catch(() => setModels([]));
    }, [v.car_brand]);

    useEffect(() => {
        if (!v.car_brand || !v.car_model) { setTrims([]); return; }
        api.get("/meta/car-trims", { params: { brand: v.car_brand, model: v.car_model } })
            .then(({ data }) => setTrims(data.trims || []))
            .catch(() => setTrims([]));
    }, [v.car_brand, v.car_model]);

    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="car-cascade">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">🚗 {tr("تفاصيل السيارة")}</h4>
            <div className="grid grid-cols-2 gap-2">
                <Pick label={tr("الماركة")} value={v.car_brand || ""} options={brands} onChange={(b) => set({ car_brand: b, car_model: "", car_trim: "" })} testid="car-brand" />
                <Pick label={tr("الموديل")} value={v.car_model || ""} options={models} onChange={(m) => set({ car_model: m, car_trim: "" })} disabled={!v.car_brand} testid="car-model" />
                <Pick label={tr("السنة")} value={v.car_year || ""} options={years} onChange={(y) => set({ car_year: y })} testid="car-year" />
                <Pick label={tr("الفئة")} value={v.car_trim || ""} options={trims} onChange={(t) => set({ car_trim: t })} disabled={!v.car_model} testid="car-trim" />
                <Pick label={tr("الممشى (كم)")} value={v.mileage || ""} options={CAR_STATIC_OPTIONS.mileage} onChange={(x) => set({ mileage: x })} testid="car-mileage" />
                <Pick label={tr("ناقل الحركة")} value={v.transmission || ""} options={CAR_STATIC_OPTIONS.transmission} onChange={(x) => set({ transmission: x })} testid="car-transmission" />
                <Pick label={tr("نوع الوقود")} value={v.fuel_type || ""} options={CAR_STATIC_OPTIONS.fuel_type} onChange={(x) => set({ fuel_type: x })} testid="car-fuel" />
                <Pick label={tr("الحالة")} value={v.condition || ""} options={CAR_STATIC_OPTIONS.condition} onChange={(x) => set({ condition: x })} testid="car-condition" />
                <Field label={tr("اللون")} value={v.color || ""} onChange={(x) => set({ color: x })} placeholder={tr("مثال: أبيض / أسود")} testid="car-color" />
                <Pick label={tr("نوع الإعلان")} value={v.listing_type || ""} options={CAR_STATIC_OPTIONS.listing_type} onChange={(x) => set({ listing_type: x })} testid="car-listing-type" />
            </div>
        </div>
    );
}


export function PhoneCascade({ value, onChange, tr = TR }) {
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
        api.get("/meta/phone-models", { params: { brand: v.phone_brand } })
            .then(({ data }) => setModels(data.models || []))
            .catch(() => setModels([]));
    }, [v.phone_brand]);

    useEffect(() => {
        if (!v.phone_brand || !v.phone_model) { setStorages([]); setColors([]); return; }
        api.get("/meta/phone-variants", { params: { brand: v.phone_brand, model: v.phone_model } })
            .then(({ data }) => {
                setStorages(data.storage || []);
                setColors(data.color || []);
            }).catch(() => { setStorages([]); setColors([]); });
    }, [v.phone_brand, v.phone_model]);

    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="phone-cascade">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">📱 {tr("تفاصيل الجوال")}</h4>
            <div className="grid grid-cols-2 gap-2">
                <Pick label={tr("الماركة")} value={v.phone_brand || ""} options={brands} onChange={(b) => set({ phone_brand: b, phone_model: "", phone_storage: "", phone_color: "" })} testid="phone-brand" />
                <Pick label={tr("الموديل")} value={v.phone_model || ""} options={models} onChange={(m) => set({ phone_model: m, phone_storage: "", phone_color: "" })} disabled={!v.phone_brand} testid="phone-model" />
                <Pick label={tr("السعة")} value={v.phone_storage || ""} options={storages} onChange={(s) => set({ phone_storage: s })} disabled={!v.phone_model} testid="phone-storage" />
                <Pick label={tr("اللون")} value={v.phone_color || ""} options={colors} onChange={(c) => set({ phone_color: c })} disabled={!v.phone_model} testid="phone-color" />
                <Pick label={tr("الحالة")} value={v.condition || ""} options={PHONE_STATIC_OPTIONS.condition} onChange={(x) => set({ condition: x })} testid="phone-condition" />
                <Pick label={tr("الذاكرة (RAM)")} value={v.ram || ""} options={PHONE_STATIC_OPTIONS.ram} onChange={(x) => set({ ram: x })} testid="phone-ram" />
                <Pick label={tr("الضمان")} value={v.warranty || ""} options={PHONE_STATIC_OPTIONS.warranty} onChange={(x) => set({ warranty: x })} testid="phone-warranty" />
            </div>
        </div>
    );
}


export function FurnitureCascade({ value, onChange, tr = TR }) {
    const v = value || {};
    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="furniture-cascade">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">🛋️ {tr("تفاصيل الأثاث")}</h4>
            <div className="grid grid-cols-2 gap-2">
                <Pick label={tr("نوع الأثاث")} value={v.furniture_type || ""} options={FURNITURE_OPTIONS.type} onChange={(x) => set({ furniture_type: x })} testid="furn-type" />
                <Pick label={tr("الحالة")} value={v.condition || ""} options={FURNITURE_OPTIONS.condition} onChange={(x) => set({ condition: x })} testid="furn-condition" />
                <Pick label={tr("الخامة")} value={v.material || ""} options={FURNITURE_OPTIONS.material} onChange={(x) => set({ material: x })} testid="furn-material" />
                <Pick label={tr("اللون")} value={v.color || ""} options={FURNITURE_OPTIONS.color} onChange={(x) => set({ color: x })} testid="furn-color" />
                <Pick label={tr("مدة الاستخدام")} value={v.usage_duration || ""} options={FURNITURE_OPTIONS.usage_duration} onChange={(x) => set({ usage_duration: x })} testid="furn-usage-duration" />
                <Field label={tr("الماركة / المصدر")} value={v.brand || ""} onChange={(x) => set({ brand: x })} placeholder={tr("مثال: IKEA / محلي")} testid="furn-brand" />
                <Pick label={tr("المقاس")} value={v.size || ""} options={FURNITURE_OPTIONS.size} onChange={(x) => set({ size: x })} testid="furn-size" />
                <Pick label={tr("مكان الاستخدام")} value={v.location || ""} options={FURNITURE_OPTIONS.location} onChange={(x) => set({ location: x })} testid="furn-location" />
            </div>
        </div>
    );
}


export function HomeAppliancesCascade({ value, onChange, tr = TR }) {
    const v = value || {};
    const set = (patch) => onChange({ ...v, ...patch });

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="appliances-cascade">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">⚡ {tr("تفاصيل الجهاز")}</h4>
            <div className="grid grid-cols-2 gap-2">
                <Pick label={tr("نوع الجهاز")} value={v.appliance_type || ""} options={APPLIANCE_OPTIONS.appliance_type} onChange={(x) => set({ appliance_type: x })} testid="app-type" />
                <Pick label={tr("الماركة")} value={v.brand || ""} options={APPLIANCE_OPTIONS.brand} onChange={(x) => set({ brand: x })} testid="app-brand" />
                <Pick label={tr("الحالة")} value={v.condition || ""} options={APPLIANCE_OPTIONS.condition} onChange={(x) => set({ condition: x })} testid="app-condition" />
                <Pick label={tr("الضمان")} value={v.warranty || ""} options={APPLIANCE_OPTIONS.warranty} onChange={(x) => set({ warranty: x })} testid="app-warranty" />
                <Pick label={tr("استهلاك الطاقة")} value={v.power || ""} options={APPLIANCE_OPTIONS.power} onChange={(x) => set({ power: x })} testid="app-power" />
                <Pick label={tr("نوع الاستخدام")} value={v.usage || ""} options={APPLIANCE_OPTIONS.usage} onChange={(x) => set({ usage: x })} testid="app-usage" />
                <Pick label={tr("الفولت / الجهد")} value={v.voltage || ""} options={APPLIANCE_OPTIONS.voltage} onChange={(x) => set({ voltage: x })} testid="app-voltage" />
                <Pick label={tr("بلد المنشأ")} value={v.origin || ""} options={APPLIANCE_OPTIONS.origin} onChange={(x) => set({ origin: x })} testid="app-origin" />
            </div>
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


function Field({ label, value, onChange, placeholder, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label}</span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm text-[var(--text)] font-arabic-body outline-none focus:border-[var(--primary)]"
            />
        </label>
    );
}
