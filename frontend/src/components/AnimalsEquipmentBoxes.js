/**
 * Market-level Details Boxes for Animals/Livestock + Equipment categories.
 *
 *   <AnimalsDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
 *   <EquipmentDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
 *
 * STRICT 2-column grid (5 base rows for each). Both boxes implement conditional
 * logic — the visible columns/rows reshape based on a key trigger field:
 *
 *   • ANIMALS: `animal_type` drives the `breed` options (cascade) AND adds extra
 *     rows for طيور (cage_type/count) or خيول (training_level/usage).
 *   • EQUIPMENT: `rental_or_sale` toggles the rental block (rental_period +
 *     insurance_required) and the sale block (hidden when renting).
 *
 * Storage: all values land in `form.custom_fields.{key}`. Price is mirrored to
 * `form.price` so the listing's headline price stays populated — the standalone
 * global price block must be suppressed for `livestock` and `equipment` in the
 * page that hosts this component (already done in PostListing.js).
 */

/* =========================================================================
   ANIMALS / LIVESTOCK
   ========================================================================= */
const ANIMAL_TYPES = ["إبل", "أغنام", "أبقار", "خيول", "طيور", "حيوانات أليفة"];

const BREED_BY_TYPE = {
    "إبل": ["المجاهيم", "الوضح", "المغاتير", "الصفر", "الشعل", "أصيل", "حيلة", "آخر"],
    "أغنام": ["نعيمي", "نجدي", "حري", "صواكني", "عواس", "السواكني", "الحبسي", "البربري", "آخر"],
    "أبقار": ["هولشتاين", "جيرسي", "بقر بلدي", "بقر هندي", "أنغوس", "براون سويس", "شاروليه", "آخر"],
    "خيول": ["عربي أصيل", "خيل واهو", "إنجليزي ثوروبريد", "كوارتر", "آرابي", "مهجن", "آخر"],
    "طيور": ["دجاج بلدي", "دجاج لاحم", "دجاج بياض", "حمام زاجل", "حمام زينة", "بط", "إوز", "ديك رومي", "كناري", "ببغاء", "صقر", "حسون", "آخر"],
    "حيوانات أليفة": ["قطط", "كلاب", "أرانب", "هامستر", "زواحف", "أسماك زينة", "خنزير غينيا", "آخر"],
};

const ANIMAL_OPTIONS = {
    age: ["صغير (أقل من 6 شهور)", "متوسط (6 شهور - سنة)", "كبير (أكثر من سنة)", "بالأشهر — حدد", "بالسنوات — حدد"],
    gender: ["ذكر", "أنثى", "غير محدد"],
    health_status: ["سليم تماماً", "تحت العلاج", "معافى من الأمراض", "بحاجة لفحص", "حامل / عشار"],
    vaccinated: ["نعم — كامل التطعيمات", "نعم — جزئي", "لا"],
    purpose: ["للبيع", "للتربية", "للذبح", "للمزاد", "للحليب / الإنتاج", "للزينة / الأليف"],
    /* طيور branch */
    cage_type: ["قفص مفرد", "قفص جماعي", "قفص تربية", "حظيرة مفتوحة", "حظيرة مغلقة", "حظيرة أرضية", "حظيرة بطاريات"],
    /* خيول branch */
    horse_training_level: ["غير مدرب", "مبتدئ", "متوسط", "متقدم", "بطل سباقات"],
    horse_usage: ["سباق", "تربية", "ركوب / رياضة", "عرض / جمال", "تجارة"],
};

export function AnimalsDetailsBox({ form, setForm, tr, country }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const currency = country?.currency || "ر.س";

    const animalType = cf.animal_type || "";
    const breeds = BREED_BY_TYPE[animalType] || [];
    const isBirds = animalType === "طيور";
    const isHorse = animalType === "خيول";

    // When the type changes, reset the dependent breed to avoid stale values.
    const onTypeChange = (v) => set({ animal_type: v, breed: "" });

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="animals-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                🐄 {tr("تفاصيل الحيوان")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1 */}
                <SelectCell label={tr("نوع الحيوان")} value={cf.animal_type} options={ANIMAL_TYPES} required onChange={onTypeChange} testid="animal-type" />
                <SelectCell label={tr("السلالة")} value={cf.breed} options={breeds} required disabled={!animalType} hint={!animalType ? tr("اختر نوع الحيوان أولاً") : null} onChange={(v) => set({ breed: v })} testid="animal-breed" />

                {/* Row 2 */}
                <SelectCell label={tr("العمر")} value={cf.age} options={ANIMAL_OPTIONS.age} required onChange={(v) => set({ age: v })} testid="animal-age" />
                <SelectCell label={tr("الجنس")} value={cf.gender} options={ANIMAL_OPTIONS.gender} required onChange={(v) => set({ gender: v })} testid="animal-gender" />

                {/* Row 3 */}
                <SelectCell label={tr("الحالة الصحية")} value={cf.health_status} options={ANIMAL_OPTIONS.health_status} required onChange={(v) => set({ health_status: v })} testid="animal-health-status" />
                <SelectCell label={tr("التطعيم")} value={cf.vaccinated} options={ANIMAL_OPTIONS.vaccinated} required onChange={(v) => set({ vaccinated: v })} testid="animal-vaccinated" />

                {/* Row 4 */}
                <NumberCell label={tr("الوزن (كجم)")} value={cf.weight} onChange={(v) => set({ weight: v })} testid="animal-weight" suffix="كجم" />
                <NumberCell label={tr("العدد المتوفر")} value={cf.quantity} onChange={(v) => set({ quantity: v })} testid="animal-quantity" required />

                {/* Row 5 */}
                <SelectCell label={tr("الغرض")} value={cf.purpose} options={ANIMAL_OPTIONS.purpose} required onChange={(v) => set({ purpose: v })} testid="animal-purpose" />
                <PriceCell label={tr("السعر")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v })} testid="animal-price" />

                {/* ===== Birds branch ===== */}
                {isBirds && <>
                    <SelectCell label={tr("نوع القفص / السكن")} value={cf.cage_type} options={ANIMAL_OPTIONS.cage_type} required onChange={(v) => set({ cage_type: v })} testid="animal-cage-type" />
                    <NumberCell label={tr("عدد الطيور بالمجموعة")} value={cf.flock_count} onChange={(v) => set({ flock_count: v })} testid="animal-flock-count" />
                </>}

                {/* ===== Horse branch ===== */}
                {isHorse && <>
                    <SelectCell label={tr("مستوى التدريب")} value={cf.training_level} options={ANIMAL_OPTIONS.horse_training_level} required onChange={(v) => set({ training_level: v })} testid="animal-training-level" />
                    <SelectCell label={tr("الاستخدام")} value={cf.horse_usage} options={ANIMAL_OPTIONS.horse_usage} required onChange={(v) => set({ horse_usage: v })} testid="animal-horse-usage" />
                </>}
            </div>
        </div>
    );
}

/* =========================================================================
   EQUIPMENT / HEAVY MACHINERY
   ========================================================================= */
const EQUIPMENT_TYPES = ["حفارات", "شيولات", "رافعات", "معدات بناء", "مولدات", "شاحنات", "خلاطات خرسانة", "ضواغط هواء", "ضخ مياه", "آليات تشطيب"];

const EQUIPMENT_BRANDS = ["Caterpillar (CAT)", "Komatsu", "Hitachi", "Volvo", "JCB", "Hyundai", "Liebherr", "Kobelco", "Doosan", "Bobcat", "Case", "Sany", "XCMG", "Mitsubishi", "Atlas Copco", "Mercedes-Benz", "MAN", "Scania", "Iveco", "آخر"];

const EQUIPMENT_OPTIONS = {
    condition: ["جديد", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "يحتاج صيانة", "للقطع / الفك"],
    year: Array.from({ length: 31 }, (_, i) => String(2026 - i)),
    rental_or_sale: ["للبيع", "للإيجار", "للبيع أو الإيجار"],
    location_type: ["داخل الورشة", "في موقع العمل", "موقع تخزين", "متنقل / حسب الطلب"],
    availability: ["متاح الآن", "متاح خلال أسبوع", "متاح حسب الجدول", "محجوز جزئياً"],
    /* rental branch */
    rental_period: ["يومي", "أسبوعي", "شهري", "ربع سنوي", "سنوي", "حسب المشروع"],
    insurance_required: ["نعم — تأمين شامل", "نعم — تأمين أساسي", "لا", "حسب الاتفاق"],
};

export function EquipmentDetailsBox({ form, setForm, tr, country }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const currency = country?.currency || "ر.س";

    const ros = cf.rental_or_sale || "";
    const isRental = ros === "للإيجار" || ros === "للبيع أو الإيجار";

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="equipment-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                🏗️ {tr("تفاصيل المعدات")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1 */}
                <SelectCell label={tr("نوع المعدة")} value={cf.equipment_type} options={EQUIPMENT_TYPES} required onChange={(v) => set({ equipment_type: v })} testid="eq-type" />
                <SelectCell label={tr("الحالة")} value={cf.condition} options={EQUIPMENT_OPTIONS.condition} required onChange={(v) => set({ condition: v })} testid="eq-condition" />

                {/* Row 2 */}
                <SelectCell label={tr("الماركة")} value={cf.brand} options={EQUIPMENT_BRANDS} required onChange={(v) => set({ brand: v })} testid="eq-brand" />
                {/* Model is left as a free-text picker disguised as a select for forward-compat
                    with future per-brand cascades — for now it's a single-text input. */}
                <TextCell label={tr("الموديل")} value={cf.model} required onChange={(v) => set({ model: v })} placeholder={tr("مثال: CAT 320D")} testid="eq-model" />

                {/* Row 3 */}
                <SelectCell label={tr("سنة الصنع")} value={cf.year} options={EQUIPMENT_OPTIONS.year} required onChange={(v) => set({ year: v })} testid="eq-year" />
                <NumberCell label={tr("ساعات التشغيل")} value={cf.usage_hours} onChange={(v) => set({ usage_hours: v })} suffix={tr("ساعة")} testid="eq-usage-hours" />

                {/* Row 4 */}
                <SelectCell label={tr("نوع العرض")} value={cf.rental_or_sale} options={EQUIPMENT_OPTIONS.rental_or_sale} required onChange={(v) => set({ rental_or_sale: v })} testid="eq-rental-or-sale" />
                <PriceCell label={isRental ? tr("سعر الإيجار") : tr("السعر")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v })} testid="eq-price" />

                {/* Row 5 */}
                <SelectCell label={tr("موقع المعدة")} value={cf.location_type} options={EQUIPMENT_OPTIONS.location_type} required onChange={(v) => set({ location_type: v })} testid="eq-location-type" />
                <SelectCell label={tr("التوافر")} value={cf.availability} options={EQUIPMENT_OPTIONS.availability} required onChange={(v) => set({ availability: v })} testid="eq-availability" />

                {/* ===== Rental branch (only when rental_or_sale includes rent) ===== */}
                {isRental && <>
                    <SelectCell label={tr("فترة الإيجار")} value={cf.rental_period} options={EQUIPMENT_OPTIONS.rental_period} required onChange={(v) => set({ rental_period: v })} testid="eq-rental-period" />
                    <SelectCell label={tr("التأمين مطلوب؟")} value={cf.insurance_required} options={EQUIPMENT_OPTIONS.insurance_required} required onChange={(v) => set({ insurance_required: v })} testid="eq-insurance-required" />
                </>}
            </div>
        </div>
    );
}

/* =========================================================================
   Shared cell primitives
   ========================================================================= */
function SelectCell({ label, value, options, onChange, required, disabled, hint, testid }) {
    return (
        <label className={`block ${disabled ? "opacity-60" : ""}`}>
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <select
                disabled={disabled}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body disabled:cursor-not-allowed"
            >
                <option value="">—</option>
                {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {hint && <span className="block text-[9px] font-arabic-body text-[var(--text-muted)] mt-1">{hint}</span>}
        </label>
    );
}

function TextCell({ label, value, onChange, required, placeholder, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
            />
        </label>
    );
}

function NumberCell({ label, value, onChange, required, suffix, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <div className="relative">
                <input
                    type="number"
                    inputMode="numeric"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    data-testid={testid}
                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin pe-12"
                />
                {suffix && <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--primary)] pointer-events-none">{suffix}</span>}
            </div>
        </label>
    );
}

function PriceCell({ label, value, currency, onChange, required, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <div className="relative">
                <input
                    type="number"
                    inputMode="numeric"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    data-testid={testid}
                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold pe-10"
                />
                <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--primary)] pointer-events-none">{currency}</span>
            </div>
        </label>
    );
}
