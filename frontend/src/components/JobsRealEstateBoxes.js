/**
 * OLX/Haraj/OpenSooq-grade Details Boxes for Jobs + Real Estate categories.
 *
 *   <JobsDetailsBox form={form} setForm={setForm} tr={tr} />
 *   <RealEstateDetailsBox form={form} setForm={setForm} tr={tr} country={country} aiSuggestPrice={fn} />
 *
 * Both render in a STRICT 2-column grid (grid-cols-2). Each row has exactly two
 * cells (or one full-width cell at the end of a row when noted in the spec).
 *
 * Stores values inside `form.custom_fields.{key}` — except `price` for real estate
 * which writes directly to `form.price` so the listing's actual price field is
 * populated (and the standalone price block is hidden upstream to avoid duplication).
 *
 * Option lists below are tuned for the GCC / Saudi market — they're intentionally
 * realistic, not placeholder. Multi-select fields (benefits, amenities) store the
 * selected values as a comma-separated string in custom_fields.
 */

import { Sparkle } from "lucide-react";

/* =========================================================================
   JOBS — 7-row OLX/Haraj-grade form
   ========================================================================= */
const JOB_OPTIONS = {
    industry: [
        "تقنية المعلومات", "هندسة", "طب وصحة", "تعليم وتدريس", "مبيعات وتسويق",
        "محاسبة ومالية", "موارد بشرية", "قانون", "إعلام وصحافة", "ضيافة وسياحة",
        "بناء ومقاولات", "صناعة وإنتاج", "نقل ولوجستيات", "خدمة عملاء", "إداري ومكتبي",
        "تصميم وإبداع", "أمن وحراسة", "تجزئة ومتاجر", "عقارات", "زراعة", "أخرى",
    ],
    employment_type: [
        "دوام كامل", "دوام جزئي", "عقد محدد المدة", "تدريب / Internship",
        "فريلانس / عمل حر", "موسمي", "تطوع",
    ],
    work_mode: ["في الموقع (On-site)", "عن بُعد (Remote)", "هجين (Hybrid)"],
    salary_currency: ["ر.س", "د.إ", "د.ك", "ر.ق", "د.ب", "ر.ع", "ج.م", "USD", "EUR"],
    experience_level: [
        "مبتدئ (Entry)", "مهنية مبكرة (Junior)", "متوسط (Mid-level)",
        "متقدم (Senior)", "قيادي (Lead)", "مدير (Manager)", "تنفيذي (Director / VP)",
    ],
    experience_years: [
        "بدون خبرة", "أقل من سنة", "1-2 سنة", "3-5 سنوات",
        "6-10 سنوات", "أكثر من 10 سنوات",
    ],
    education: ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "غير محدد"],
    language_requirement: [
        "العربية فقط", "الإنجليزية فقط", "العربية + الإنجليزية",
        "متعدد اللغات", "غير محدد",
    ],
    company_type: [
        "شركة خاصة", "حكومي", "شبه حكومي", "متعدد الجنسيات",
        "شركة ناشئة (Startup)", "مؤسسة غير ربحية", "فرد / حر",
    ],
    benefits: [
        "سكن", "تأمين طبي", "تأمين عائلي", "مواصلات", "تذاكر سنوية",
        "بدل اتصالات", "حافز شهري", "إجازة مدفوعة", "بدل طعام",
        "تدريب وتطوير", "بونص نهاية السنة", "ترقية سريعة", "ساعات مرنة",
    ],
};

export function JobsDetailsBox({ form, setForm, tr }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="jobs-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                💼 {tr("تفاصيل الوظيفة")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1: Job Title | Job Category */}
                <TextCell label={tr("المسمى الوظيفي")} value={cf.job_title} required onChange={(v) => set({ job_title: v })} placeholder={tr("مثال: مهندس برمجيات أول")} testid="job-title" />
                <SelectCell label={tr("المجال / التصنيف")} value={cf.industry} options={JOB_OPTIONS.industry} required onChange={(v) => set({ industry: v })} testid="job-industry" />

                {/* Row 2: Job Type | Work Mode */}
                <SelectCell label={tr("نوع الوظيفة")} value={cf.employment_type} options={JOB_OPTIONS.employment_type} required onChange={(v) => set({ employment_type: v })} testid="job-employment-type" />
                <SelectCell label={tr("نمط العمل")} value={cf.work_mode} options={JOB_OPTIONS.work_mode} required onChange={(v) => set({ work_mode: v })} testid="job-work-mode" />

                {/* Row 3: Salary Range | Currency */}
                <SalaryRangeCell label={tr("نطاق الراتب")} min={cf.salary_min} max={cf.salary_max} onChange={(min, max) => set({ salary_min: min, salary_max: max })} />
                <SelectCell label={tr("العملة")} value={cf.salary_currency} options={JOB_OPTIONS.salary_currency} onChange={(v) => set({ salary_currency: v })} testid="job-salary-currency" />

                {/* Row 4: Experience Level | Years of Experience */}
                <SelectCell label={tr("مستوى الخبرة")} value={cf.experience_level} options={JOB_OPTIONS.experience_level} required onChange={(v) => set({ experience_level: v })} testid="job-experience-level" />
                <SelectCell label={tr("سنوات الخبرة")} value={cf.experience_years} options={JOB_OPTIONS.experience_years} required onChange={(v) => set({ experience_years: v })} testid="job-experience-years" />

                {/* Row 5: Education Level | Language Requirement */}
                <SelectCell label={tr("المؤهل العلمي")} value={cf.education} options={JOB_OPTIONS.education} required onChange={(v) => set({ education: v })} testid="job-education" />
                <SelectCell label={tr("اللغات المطلوبة")} value={cf.language_requirement} options={JOB_OPTIONS.language_requirement} onChange={(v) => set({ language_requirement: v })} testid="job-language" />

                {/* Row 6: Company Name | Company Type */}
                <TextCell label={tr("اسم الشركة")} value={cf.company_name} onChange={(v) => set({ company_name: v })} placeholder={tr("مثال: شركة الخليج للتقنية")} testid="job-company-name" />
                <SelectCell label={tr("نوع الشركة")} value={cf.company_type} options={JOB_OPTIONS.company_type} onChange={(v) => set({ company_type: v })} testid="job-company-type" />
            </div>

            {/* Row 7: Benefits (multi-select, full width) */}
            <MultiSelectCell label={tr("المزايا والمميزات")} value={cf.benefits} options={JOB_OPTIONS.benefits} onChange={(v) => set({ benefits: v })} testid="job-benefits" />
        </div>
    );
}

/* =========================================================================
   REAL ESTATE — 8-row OLX/Haraj-grade form
   ========================================================================= */
const RE_OPTIONS = {
    property_type: [
        "شقة", "فيلا", "بيت شعبي", "دور", "دوبلكس", "بنتهاوس", "استوديو", "غرفة",
        "أرض سكنية", "أرض تجارية", "أرض زراعية", "مزرعة", "استراحة",
        "محل تجاري", "مكتب", "مستودع / مخزن", "عمارة كاملة", "عمارة سكنية",
        "مجمع تجاري", "شاليه", "روف",
    ],
    deal_type: ["للبيع", "للإيجار", "للتقبيل / تنازل"],
    payment_frequency: ["يومي", "أسبوعي", "شهري", "ربع سنوي", "نصف سنوي", "سنوي"],
    furnished: ["مفروشة بالكامل", "مفروشة جزئياً", "غير مفروشة", "مع أجهزة فقط"],
    age_years: [
        "تحت الإنشاء", "جديد (0-1 سنة)", "2-5 سنوات", "6-10 سنوات",
        "11-20 سنة", "أكثر من 20 سنة",
    ],
    condition: ["جديد", "ممتاز", "جيد جداً", "جيد", "يحتاج تجديد", "للهدم"],
    parking: ["مرآب / كراج خاص", "مواقف مظللة", "مواقف مكشوفة", "مدفوع منفصل", "لا يوجد"],
    elevator: ["نعم", "لا", "تحت الإنشاء"],
    amenities: [
        "مسبح", "حديقة", "نادي صحي / جيم", "أمن 24/7", "مصعد", "إنترنت / واي فاي",
        "تكييف مركزي", "تدفئة مركزية", "بلكونة / تراس", "حارس", "ملعب أطفال",
        "مواقف ضيوف", "غرفة خادمة", "غرفة سائق", "مخزن", "مدخل خاص",
        "إطلالة بحرية", "إطلالة جبلية", "قريب من المسجد", "قريب من المدرسة",
        "قريب من المستشفى", "قريب من المول", "قريب من المترو",
    ],
};

export function RealEstateDetailsBox({ form, setForm, tr, country, aiSuggestPrice }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const isRent = cf.deal_type === "للإيجار";

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="realestate-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                🏠 {tr("تفاصيل العقار")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1: Property Type | Listing Type */}
                <SelectCell label={tr("نوع العقار")} value={cf.property_type} options={RE_OPTIONS.property_type} required onChange={(v) => set({ property_type: v })} testid="re-property-type" />
                <SelectCell label={tr("نوع الإعلان")} value={cf.deal_type} options={RE_OPTIONS.deal_type} required onChange={(v) => set({ deal_type: v })} testid="re-deal-type" />

                {/* Row 2: Price | Payment Frequency */}
                <PriceCell
                    label={tr("السعر")}
                    value={form.price}
                    currency={country?.currency || "ر.س"}
                    onChange={(v) => setForm({ ...form, price: v })}
                    onAi={aiSuggestPrice}
                    tr={tr}
                />
                <SelectCell
                    label={tr("نظام الدفع")}
                    value={cf.payment_frequency}
                    options={RE_OPTIONS.payment_frequency}
                    onChange={(v) => set({ payment_frequency: v })}
                    disabled={!isRent}
                    hint={!isRent ? tr("اختر «للإيجار» لتفعيل الدفع") : null}
                    testid="re-payment-frequency"
                />

                {/* Row 3: Area | Furnished */}
                <NumberCell label={tr("المساحة (م²)")} value={cf.area_m2} required onChange={(v) => set({ area_m2: v })} testid="re-area" />
                <SelectCell label={tr("الفرش")} value={cf.furnished} options={RE_OPTIONS.furnished} onChange={(v) => set({ furnished: v })} testid="re-furnished" />

                {/* Row 4: Rooms | Bathrooms */}
                <NumberCell label={tr("عدد الغرف")} value={cf.rooms} onChange={(v) => set({ rooms: v })} testid="re-rooms" />
                <NumberCell label={tr("عدد الحمامات")} value={cf.bathrooms} onChange={(v) => set({ bathrooms: v })} testid="re-bathrooms" />

                {/* Row 5: Floor | Total Floors */}
                <NumberCell label={tr("الدور")} value={cf.floor_num} onChange={(v) => set({ floor_num: v })} testid="re-floor" />
                <NumberCell label={tr("عدد الأدوار الكلي")} value={cf.total_floors} onChange={(v) => set({ total_floors: v })} testid="re-total-floors" />

                {/* Row 6: Property Age | Condition */}
                <SelectCell label={tr("عمر العقار")} value={cf.age_years} options={RE_OPTIONS.age_years} onChange={(v) => set({ age_years: v })} testid="re-age" />
                <SelectCell label={tr("حالة العقار")} value={cf.condition} options={RE_OPTIONS.condition} onChange={(v) => set({ condition: v })} testid="re-condition" />

                {/* Row 7: Parking | Elevator */}
                <SelectCell label={tr("المواقف")} value={cf.parking} options={RE_OPTIONS.parking} onChange={(v) => set({ parking: v })} testid="re-parking" />
                <SelectCell label={tr("المصعد")} value={cf.elevator} options={RE_OPTIONS.elevator} onChange={(v) => set({ elevator: v })} testid="re-elevator" />
            </div>

            {/* Row 8: Amenities (multi-select, full width) */}
            <MultiSelectCell label={tr("الميزات والمرافق")} value={cf.amenities} options={RE_OPTIONS.amenities} onChange={(v) => set({ amenities: v })} testid="re-amenities" />
        </div>
    );
}

/* =========================================================================
   Shared 2-col cell primitives
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

function NumberCell({ label, value, onChange, required, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <input
                type="number"
                inputMode="numeric"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
            />
        </label>
    );
}

function SalaryRangeCell({ label, min, max, onChange }) {
    return (
        <div>
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label}</span>
            <div className="flex gap-1 items-stretch">
                <input
                    type="number"
                    inputMode="numeric"
                    placeholder="من"
                    value={min || ""}
                    onChange={(e) => onChange(e.target.value, max)}
                    data-testid="job-salary-min"
                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
                />
                <input
                    type="number"
                    inputMode="numeric"
                    placeholder="إلى"
                    value={max || ""}
                    onChange={(e) => onChange(min, e.target.value)}
                    data-testid="job-salary-max"
                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
                />
            </div>
        </div>
    );
}

function PriceCell({ label, value, currency, onChange, onAi, tr }) {
    return (
        <div>
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label} *</span>
            <div className="flex gap-1">
                <div className="flex-1 relative">
                    <input
                        type="number"
                        inputMode="numeric"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        data-testid="post-price"
                        placeholder={tr("اتركه فارغاً للسوم")}
                        className="w-full bg-[var(--surface-elevated)] rounded-xl ps-2 pe-12 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold"
                    />
                    <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--primary)] pointer-events-none">{currency}</span>
                </div>
                {onAi && (
                    <button
                        type="button"
                        onClick={onAi}
                        data-testid="ai-price-btn"
                        className="shrink-0 flex items-center gap-0.5 bg-gradient-to-r from-[var(--accent)] to-amber-400 text-[var(--secondary)] rounded-xl px-2 py-2 text-[10px] font-bold font-arabic"
                        title={tr("اقتراح بالذكاء الاصطناعي")}
                    >
                        <Sparkle className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

function MultiSelectCell({ label, value, options, onChange, testid }) {
    // `value` is stored as a comma-separated string for forward compatibility
    // with the existing custom_fields free-form blob.
    const selected = (value || "").split(",").map((s) => s.trim()).filter(Boolean);
    const toggle = (opt) => {
        const next = selected.includes(opt)
            ? selected.filter((s) => s !== opt)
            : [...selected, opt];
        onChange(next.join(", "));
    };
    return (
        <div className="col-span-2 mt-1" data-testid={testid}>
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1.5">{label}</span>
            <div className="flex flex-wrap gap-1.5">
                {(options || []).map((opt) => {
                    const active = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => toggle(opt)}
                            className={`text-[10px] font-arabic font-bold px-2.5 py-1 rounded-full border transition-all ${active ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]"}`}
                        >
                            {active ? "✓ " : "+ "}{opt}
                        </button>
                    );
                })}
            </div>
            {selected.length > 0 && (
                <span className="block text-[9px] text-emerald-600 mt-1 font-arabic-body">
                    {selected.length} {selected.length === 1 ? "محدّد" : "محدّدة"}
                </span>
            )}
        </div>
    );
}
