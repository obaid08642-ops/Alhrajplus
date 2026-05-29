/**
 * OLX/Haraj-grade Details Boxes for Jobs + Real Estate categories.
 *
 *   <JobsDetailsBox form={form} setForm={setForm} tr={tr} />
 *   <RealEstateDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
 *
 * STRICT 2-column grid. Every row has exactly two cells — no full-width inputs
 * (except multi-line free-text fields like requirements/skills which live at the
 * bottom and are scoped to a single column with a small note above).
 *
 * Both boxes are mounted AFTER `description` in PostListing.js. The standalone
 * global price block is suppressed for both categories so the price input shown
 * here is the single source of truth (writes directly to `form.price`).
 *
 * Storage keys → `form.custom_fields.{key}`; price → `form.price`.
 *
 * Option lists target the GCC / Saudi market.
 */

/* =========================================================================
   JOBS — 4 rows × 2 cols + conditional block per post_type
   ========================================================================= */
const JOB_OPTIONS = {
    job_type: [
        "دوام كامل", "دوام جزئي", "عقد محدد المدة", "تدريب / Internship",
        "فريلانس / عمل حر", "موسمي", "تطوع",
    ],
    experience_level: [
        "مبتدئ (Entry)", "مهنية مبكرة (Junior)", "متوسط (Mid-level)",
        "متقدم (Senior)", "قيادي (Lead)", "مدير (Manager)", "تنفيذي (Director / VP)",
    ],
    education_level: ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "غير محدد"],
    work_schedule: ["دوام صباحي", "دوام مسائي", "دوامين", "نهاية الأسبوع", "مرن / متغير"],
    location_type: ["في الموقع (On-site)", "عن بُعد (Remote)", "هجين (Hybrid)"],
    field: [
        "تقنية المعلومات", "هندسة", "طب وصحة", "تعليم وتدريس", "مبيعات وتسويق",
        "محاسبة ومالية", "موارد بشرية", "قانون", "إعلام وصحافة", "ضيافة وسياحة",
        "بناء ومقاولات", "صناعة وإنتاج", "نقل ولوجستيات", "خدمة عملاء", "إداري ومكتبي",
        "تصميم وإبداع", "أمن وحراسة", "تجزئة ومتاجر", "عقارات", "زراعة", "أخرى",
    ],
};

export function JobsDetailsBox({ form, setForm, tr }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const isSeeker = cf.post_type === "باحث عن عمل";

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="jobs-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                💼 {tr("تفاصيل الوظيفة")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1: job_title (input) | job_type (dropdown) */}
                <TextCell label={tr("المسمى الوظيفي")} value={cf.job_title} required onChange={(v) => set({ job_title: v })} placeholder={tr("مثال: مهندس برمجيات أول")} testid="job-title" />
                <SelectCell label={tr("نوع الوظيفة")} value={cf.job_type} options={JOB_OPTIONS.job_type} required onChange={(v) => set({ job_type: v })} testid="job-type" />

                {/* Row 2: salary_range OR expected_salary | experience_level */}
                {isSeeker ? (
                    <TextCell label={tr("الراتب المتوقع")} value={cf.expected_salary} onChange={(v) => set({ expected_salary: v })} placeholder={tr("مثال: 8,000 ر.س")} testid="job-expected-salary" />
                ) : (
                    <TextCell label={tr("نطاق الراتب")} value={cf.salary_range} onChange={(v) => set({ salary_range: v })} placeholder={tr("مثال: 6,000 - 10,000 ر.س")} testid="job-salary-range" />
                )}
                <SelectCell label={tr("مستوى الخبرة")} value={cf.experience_level} options={JOB_OPTIONS.experience_level} required onChange={(v) => set({ experience_level: v })} testid="job-experience-level" />

                {/* Row 3: education_level | work_schedule */}
                <SelectCell label={tr("المؤهل العلمي")} value={cf.education_level} options={JOB_OPTIONS.education_level} required onChange={(v) => set({ education_level: v })} testid="job-education-level" />
                <SelectCell label={tr("جدول العمل")} value={cf.work_schedule} options={JOB_OPTIONS.work_schedule} onChange={(v) => set({ work_schedule: v })} testid="job-work-schedule" />

                {/* Row 4: location_type | field */}
                <SelectCell label={tr("نمط الموقع")} value={cf.location_type} options={JOB_OPTIONS.location_type} required onChange={(v) => set({ location_type: v })} testid="job-location-type" />
                <SelectCell label={tr("المجال / التخصص")} value={cf.field} options={JOB_OPTIONS.field} required onChange={(v) => set({ field: v })} testid="job-field" />

                {/* Conditional bottom block — span both cols so the textarea has breathing room
                    while everything above stays strict 2-col. */}
                {isSeeker ? (
                    <TextAreaCell colSpan label={tr("المهارات والقدرات")} value={cf.skills} onChange={(v) => set({ skills: v })} placeholder={tr("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} testid="job-skills" />
                ) : (
                    <TextAreaCell colSpan label={tr("المتطلبات والشروط")} value={cf.requirements} onChange={(v) => set({ requirements: v })} placeholder={tr("اذكر المؤهلات والمتطلبات الإلزامية...")} testid="job-requirements" />
                )}
            </div>
        </div>
    );
}

/* =========================================================================
   REAL ESTATE — 5 rows × 2 cols
   ========================================================================= */
const RE_OPTIONS = {
    property_type: [
        "شقة", "فيلا", "بيت شعبي", "دور", "دوبلكس", "بنتهاوس", "استوديو", "غرفة",
        "أرض سكنية", "أرض تجارية", "أرض زراعية", "مزرعة", "استراحة",
        "محل تجاري", "مكتب", "مستودع / مخزن", "عمارة كاملة", "عمارة سكنية",
        "مجمع تجاري", "شاليه", "روف",
    ],
    listing_type: ["للبيع", "للإيجار"],
    rooms: ["1", "2", "3", "4", "5+"],
    bathrooms: ["1", "2", "3", "4+"],
    furnishing: ["مفروشة بالكامل", "مفروشة جزئياً", "غير مفروشة", "مع أجهزة فقط"],
    condition: ["جديد", "ممتاز", "جيد جداً", "جيد", "يحتاج تجديد", "للهدم"],
    building_age: [
        "تحت الإنشاء", "جديد (0-1 سنة)", "2-5 سنوات", "6-10 سنوات",
        "11-20 سنة", "أكثر من 20 سنة",
    ],
    payment_method: [
        "كاش", "بنكي / تمويل", "كاش + بنكي", "أقساط من المالك",
        "تحويل بنكي شهري", "حسب الاتفاق",
    ],
};

export function RealEstateDetailsBox({ form, setForm, tr, country }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const currency = country?.currency || "ر.س";

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="realestate-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                🏠 {tr("تفاصيل العقار")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1 */}
                <SelectCell label={tr("نوع العقار")} value={cf.property_type} options={RE_OPTIONS.property_type} required onChange={(v) => set({ property_type: v })} testid="re-property-type" />
                {/* Mirror to both `listing_type` and `deal_type` so the badge component
                    (which reads deal_type) keeps working without a separate field. */}
                <SelectCell label={tr("نوع الإعلان")} value={cf.listing_type} options={RE_OPTIONS.listing_type} required onChange={(v) => set({ listing_type: v, deal_type: v })} testid="re-listing-type" />

                {/* Row 2 */}
                <SelectCell label={tr("عدد الغرف")} value={cf.rooms} options={RE_OPTIONS.rooms} required onChange={(v) => set({ rooms: v })} testid="re-rooms" />
                <SelectCell label={tr("عدد الحمامات")} value={cf.bathrooms} options={RE_OPTIONS.bathrooms} required onChange={(v) => set({ bathrooms: v })} testid="re-bathrooms" />

                {/* Row 3 */}
                <NumberCell label={tr("المساحة (م²)")} value={cf.area} required onChange={(v) => set({ area: v })} testid="re-area" suffix="م²" />
                <PriceCell label={tr("السعر")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v })} testid="re-price" />

                {/* Row 4 */}
                <SelectCell label={tr("الفرش")} value={cf.furnishing} options={RE_OPTIONS.furnishing} required onChange={(v) => set({ furnishing: v })} testid="re-furnishing" />
                <SelectCell label={tr("حالة العقار")} value={cf.condition} options={RE_OPTIONS.condition} required onChange={(v) => set({ condition: v })} testid="re-condition" />

                {/* Row 5 */}
                <SelectCell label={tr("عمر البناء")} value={cf.building_age} options={RE_OPTIONS.building_age} required onChange={(v) => set({ building_age: v })} testid="re-building-age" />
                <SelectCell label={tr("طريقة الدفع")} value={cf.payment_method} options={RE_OPTIONS.payment_method} required onChange={(v) => set({ payment_method: v })} testid="re-payment-method" />
            </div>
        </div>
    );
}

/* =========================================================================
   Shared 2-col cell primitives
   ========================================================================= */
function SelectCell({ label, value, options, onChange, required, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body"
            >
                <option value="">—</option>
                {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
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
                    className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin pe-10"
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

function TextAreaCell({ label, value, onChange, placeholder, colSpan, testid }) {
    return (
        <label className={`block ${colSpan ? "col-span-2" : ""}`}>
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label}</span>
            <textarea
                rows={3}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body resize-none"
            />
        </label>
    );
}
