/**
 * Market-level Details Boxes for Auctions + Services (PRO with conditional logic).
 *
 *   <AuctionsDetailsBox form={form} setForm={setForm} tr={tr} currency={..} />
 *   <ServicesProDetailsBox form={form} setForm={setForm} tr={tr} />
 *
 * Both render in STRICT 2-column grid. Services PRO branches its row layout
 * based on `custom_fields.service_type` so each service category gets the
 * fields it actually needs (delivery, cleaning, dev/design, education).
 *
 * All values land in `form.custom_fields.{key}` — except the auction starting
 * price which mirrors to `form.price` (so the listing's headline price stays
 * populated and the auction infra has its own `starting_price` snapshot).
 */

import { Sparkle } from "lucide-react";
import { useEffect } from "react";

/* =========================================================================
   AUCTIONS — 5 rows × 2 cols (10 fields)
   ========================================================================= */
const AUC_OPTIONS = {
    item_condition: ["جديد", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "للهواة / للجمع", "للترميم"],
    category_type: ["سيارات", "عقارات", "ساعات وإكسسوارات فاخرة", "مجوهرات", "تحف وأنتيكات", "نوادر وعملات", "إلكترونيات", "فن وأعمال يدوية", "أزياء فاخرة", "لوحات سيارات مميزة", "ماشية وخيل", "أخرى"],
    auction_duration: ["3 أيام", "5 أيام", "7 أيام", "10 أيام", "14 يوم", "30 يوم", "حسب التاريخ المحدد"],
    shipping_option: ["استلام من البائع", "شحن داخل المدينة", "شحن داخل الدولة", "شحن دولي", "حسب الاتفاق"],
    payment_method: ["تحويل بنكي", "نقدي عند الاستلام", "Apple Pay / STC Pay", "بطاقة ائتمانية", "كاش حصراً", "Escrow (ضمان وسيط)"],
};

const DURATION_TO_DAYS = {
    "3 أيام": 3, "5 أيام": 5, "7 أيام": 7, "10 أيام": 10, "14 يوم": 14, "30 يوم": 30,
};

export function AuctionsDetailsBox({ form, setForm, tr, currency = "ر.س" }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });

    // ─── Auto-calculate end_time from auction_duration ────────────────────
    useEffect(() => {
        const d = cf.auction_duration;
        if (!d || d === "حسب التاريخ المحدد") return;
        const days = DURATION_TO_DAYS[d];
        if (!days) return;
        const end = new Date(Date.now() + days * 86400 * 1000);
        // Format for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
        const pad = (n) => String(n).padStart(2, "0");
        const iso = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
        if (cf.end_time !== iso) set({ end_time: iso });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cf.auction_duration]);

    // ─── Validation hints ──────────────────────────────────────────────────
    const startNum = parseFloat(form.price || cf.starting_price || 0);
    const incrementNum = parseFloat(cf.bid_increment || 0);
    const reserveNum = parseFloat(cf.reserve_price || 0);
    const buyNowNum = parseFloat(cf.buy_now_price || 0);
    const incrementTooLow = incrementNum > 0 && startNum > 0 && incrementNum < startNum * 0.01;
    const buyNowBelowStart = buyNowNum > 0 && startNum > 0 && buyNowNum <= startNum;

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="auctions-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                🏷️ {tr("تفاصيل المزاد")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1 */}
                <SelectCell label={tr("حالة المعروض")} value={cf.item_condition} options={AUC_OPTIONS.item_condition} required onChange={(v) => set({ item_condition: v })} testid="auc-condition" />
                <SelectCell label={tr("نوع التصنيف")} value={cf.category_type} options={AUC_OPTIONS.category_type} required onChange={(v) => set({ category_type: v })} testid="auc-category-type" />

                {/* Row 2 */}
                <PriceCell label={tr("سعر البداية")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v, custom_fields: { ...form.custom_fields, starting_price: v } })} testid="auc-starting-price" />
                <NumberCell label={tr("أقل زيادة للمزايدة")} value={cf.bid_increment} required onChange={(v) => set({ bid_increment: v })} suffix={currency} testid="auc-bid-increment" />

                {/* Row 3 */}
                <NumberCell label={tr("السعر الاحتياطي (سري)")} value={cf.reserve_price} onChange={(v) => set({ reserve_price: v })} suffix={currency} testid="auc-reserve-price" hint={tr("لن يُباع تحته")} />
                <NumberCell label={tr("اشتر الآن (Buy Now)")} value={cf.buy_now_price} onChange={(v) => set({ buy_now_price: v })} suffix={currency} testid="auc-buy-now" hint={buyNowNum > 0 ? "⚡ " + tr("سيُبرز في الكرت") : null} />

                {/* Row 4 */}
                <SelectCell label={tr("مدة المزاد")} value={cf.auction_duration} options={AUC_OPTIONS.auction_duration} required onChange={(v) => set({ auction_duration: v })} testid="auc-duration" />
                <DateTimeCell label={tr("وقت الانتهاء")} value={cf.end_time} onChange={(v) => set({ end_time: v })} testid="auc-end-time" hint={cf.auction_duration && cf.auction_duration !== "حسب التاريخ المحدد" ? tr("✓ تلقائي من المدة") : null} />

                {/* Row 5 */}
                <SelectCell label={tr("خيار الشحن")} value={cf.shipping_option} options={AUC_OPTIONS.shipping_option} required onChange={(v) => set({ shipping_option: v })} testid="auc-shipping" />
                <SelectCell label={tr("طريقة الدفع")} value={cf.payment_method} options={AUC_OPTIONS.payment_method} required onChange={(v) => set({ payment_method: v })} testid="auc-payment-method" />
            </div>

            {/* Inline validation messages */}
            {(incrementTooLow || buyNowBelowStart) && (
                <div className="text-[10px] font-arabic-body text-amber-600 dark:text-amber-400 mt-1 space-y-0.5" data-testid="auc-validation">
                    {incrementTooLow && <div>⚠️ {tr("أقل زيادة منخفضة جداً (يفضّل 1% من سعر البداية أو أعلى)")}</div>}
                    {buyNowBelowStart && <div>⚠️ {tr("سعر «اشتر الآن» يجب أن يكون أعلى من سعر البداية")}</div>}
                </div>
            )}

            {cf.end_time && (
                <CountdownPreview iso={cf.end_time} tr={tr} />
            )}
        </div>
    );
}

function CountdownPreview({ iso, tr }) {
    // UI hook only — purely visual preview of the live countdown.
    const target = new Date(iso).getTime();
    const now = Date.now();
    const delta = Math.max(0, target - now);
    const d = Math.floor(delta / 86400000);
    const h = Math.floor((delta % 86400000) / 3600000);
    const m = Math.floor((delta % 3600000) / 60000);
    return (
        <div className="text-[10px] font-arabic-body text-[var(--text-muted)] mt-1" data-testid="auc-countdown-preview">
            ⏱️ {tr("الوقت المتبقي عند النشر:")} <span className="font-bold text-[var(--primary)]">{d} {tr("يوم")} {h} {tr("س")} {m} {tr("د")}</span>
        </div>
    );
}

/* =========================================================================
   SERVICES PRO — conditional rows per service_type
   ========================================================================= */
const SVC_BUCKETS = {
    DELIVERY: ["توصيل / نقل", "نقل عفش"],
    CLEANING: ["تنظيف", "خدمات منزلية", "صيانة"],
    DEV: ["تصميم", "برمجة", "خدمات أعمال"],
    EDUCATION: ["تعليم"],
};

const SVC_OPTIONS = {
    service_type: [
        "توصيل / نقل", "نقل عفش", "تنظيف", "صيانة", "تعليم", "تصميم", "برمجة",
        "خدمات منزلية", "خدمات أعمال",
    ],
    pricing_type: ["بالساعة", "بالزيارة", "بالقطعة / المهمة", "متر مربع", "اشتراك شهري", "حسب الاتفاق"],

    /* DELIVERY */
    schedule_type: ["الآن", "تحديد وقت لاحق"],
    time_window: ["8 ص - 12 ظ", "12 ظ - 4 م", "4 م - 8 م", "8 م - 12 ل", "ليلاً (12 - 6 ص)"],
    vehicle_type: ["دباب صغير", "سيارة سيدان", "سيارة SUV", "بيك أب", "ونيت / لوري", "شاحنة كبيرة", "شاحنة مبردة"],
    load_type: ["خفيف (أقل من 50 كجم)", "متوسط (50-200 كجم)", "ثقيل (200-1000 كجم)", "ثقيل جداً (+1000 كجم)"],
    delivery_recurrence: ["لمرة واحدة", "يومي", "أسبوعي", "شهري"],
    package_type: ["وثائق / مستندات", "طرود صغيرة", "أثاث", "أجهزة كبيرة", "بضائع تجارية", "أخرى"],

    /* CLEANING / HOME */
    property_type: ["شقة", "فيلا", "بيت", "استوديو", "مكتب", "محل تجاري", "مستودع", "شاليه / استراحة"],
    rooms: ["استوديو", "غرفة 1", "غرفة 2", "غرفة 3", "غرفة 4", "غرفة 5+"],
    service_duration: ["ساعة", "ساعتان", "نصف يوم (4 ساعات)", "يوم كامل (8 ساعات)", "أكثر من يوم"],
    frequency: ["مرة واحدة", "أسبوعي", "كل أسبوعين", "شهري", "اشتراك دائم"],
    preferred_time: ["صباحاً (6 - 12)", "ظهراً (12 - 4)", "مساءً (4 - 9)", "ليلاً (9+)", "مرن"],
    materials_included: ["نعم — مواد التنظيف من المزود", "لا — العميل يوفّر المواد", "حسب الاتفاق"],

    /* DEV / DESIGN / BUSINESS */
    project_type: ["موقع ويب", "تطبيق جوال", "تصميم هوية / لوقو", "تصميم UI/UX", "موشن جرافيك", "تسويق رقمي", "دراسة جدوى", "استشارات أعمال", "ترجمة محتوى", "كتابة محتوى", "آخر"],
    experience_level: ["مبتدئ (Junior)", "متوسط (Mid)", "متقدم (Senior)", "خبير (Expert)"],
    delivery_time: ["24 ساعة", "3 أيام", "أسبوع", "أسبوعان", "شهر", "أكثر من شهر", "حسب المشروع"],
    revisions: ["مراجعة واحدة", "2-3 مراجعات", "حتى الرضا التام", "غير محدد"],
    budget_range: ["أقل من 500", "500 - 1000", "1000 - 3000", "3000 - 5000", "5000 - 10000", "أكثر من 10000", "حسب العرض"],
    communication_method: ["WhatsApp", "Zoom / Google Meet", "Email", "Slack / Discord", "هاتف", "حضوري"],

    /* EDUCATION */
    edu_subject: ["رياضيات", "علوم / فيزياء / كيمياء", "أحياء", "إنجليزي", "عربي", "حاسب آلي / برمجة", "تصميم", "موسيقى", "تحفيظ قرآن", "تأسيس ابتدائي", "لغات أجنبية", "آخر"],
    edu_level: ["تأسيس / روضة", "ابتدائي", "متوسط", "ثانوي", "جامعي", "تحضيري / مهارات", "كبار"],
    session_duration: ["30 دقيقة", "45 دقيقة", "ساعة", "ساعة ونصف", "ساعتان"],
    sessions_count: ["جلسة واحدة", "5 جلسات", "10 جلسات", "20 جلسة", "شهري (اشتراك)", "حسب الاتفاق"],
    delivery_mode: ["أونلاين (Zoom / Meet)", "حضوري في منزل الطالب", "حضوري في مكان المعلم", "هجين"],
    edu_schedule: ["صباحي", "مسائي", "نهاية الأسبوع", "يومي", "مرن"],
};

export function ServicesProDetailsBox({ form, setForm, tr }) {
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const sType = cf.service_type || "";
    const isDelivery = SVC_BUCKETS.DELIVERY.includes(sType);
    const isCleaning = SVC_BUCKETS.CLEANING.includes(sType);
    const isDev = SVC_BUCKETS.DEV.includes(sType);
    const isEdu = SVC_BUCKETS.EDUCATION.includes(sType);
    const isScheduled = cf.schedule_type === "تحديد وقت لاحق";

    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="services-pro-details-box">
            <h4 className="text-xs font-arabic font-black text-[var(--text)] mb-1 flex items-center gap-1">
                🛠️ {tr("تفاصيل الخدمة")}
            </h4>

            <div className="grid grid-cols-2 gap-2">
                {/* Row 1: Service Type | Pricing Type — ALWAYS shown */}
                <SelectCell label={tr("نوع الخدمة")} value={cf.service_type} options={SVC_OPTIONS.service_type} required onChange={(v) => set({ service_type: v })} testid="svc-type" />
                <SelectCell label={tr("طريقة التسعير")} value={cf.pricing_type} options={SVC_OPTIONS.pricing_type} required onChange={(v) => set({ pricing_type: v })} testid="svc-pricing-type" />

                {/* ===== DELIVERY / TRANSPORT branch ===== */}
                {isDelivery && <>
                    <SelectCell label={tr("متى تريد الخدمة؟")} value={cf.schedule_type} options={SVC_OPTIONS.schedule_type} required onChange={(v) => set({ schedule_type: v })} testid="svc-schedule-type" />
                    <div /> {/* spacer to keep 2-col rhythm */}

                    {isScheduled && <DateCell label={tr("التاريخ")} value={cf.delivery_date} onChange={(v) => set({ delivery_date: v })} testid="svc-delivery-date" />}
                    {isScheduled && <SelectCell label={tr("الوقت")} value={cf.delivery_time_window} options={SVC_OPTIONS.time_window} onChange={(v) => set({ delivery_time_window: v })} testid="svc-time-window" />}

                    <TextCell label={tr("نقطة الالتقاط")} value={cf.pickup_location} required onChange={(v) => set({ pickup_location: v })} placeholder={tr("المدينة، الحي")} testid="svc-pickup" />
                    <TextCell label={tr("نقطة الوصول")} value={cf.dropoff_location} required onChange={(v) => set({ dropoff_location: v })} placeholder={tr("المدينة، الحي")} testid="svc-dropoff" />

                    <SelectCell label={tr("نوع المركبة")} value={cf.vehicle_type} options={SVC_OPTIONS.vehicle_type} required onChange={(v) => set({ vehicle_type: v })} testid="svc-vehicle-type" />
                    <SelectCell label={tr("حجم / وزن الحمولة")} value={cf.load_type} options={SVC_OPTIONS.load_type} onChange={(v) => set({ load_type: v })} testid="svc-load-type" />

                    <NumberCell label={tr("السعر المقترح")} value={cf.price_estimate} onChange={(v) => set({ price_estimate: v })} testid="svc-price-estimate" />
                    <NumberCell label={tr("المسافة التقريبية (كم)")} value={cf.distance_km} onChange={(v) => set({ distance_km: v })} testid="svc-distance" />

                    <SelectCell label={tr("التكرار")} value={cf.delivery_recurrence} options={SVC_OPTIONS.delivery_recurrence} onChange={(v) => set({ delivery_recurrence: v })} testid="svc-recurrence" />
                    <SelectCell label={tr("نوع الشحنة")} value={cf.package_type} options={SVC_OPTIONS.package_type} onChange={(v) => set({ package_type: v })} testid="svc-package-type" />
                </>}

                {/* ===== CLEANING / HOME branch ===== */}
                {isCleaning && <>
                    <SelectCell label={tr("نوع العقار")} value={cf.property_type} options={SVC_OPTIONS.property_type} required onChange={(v) => set({ property_type: v })} testid="svc-property-type" />
                    <SelectCell label={tr("عدد الغرف")} value={cf.rooms} options={SVC_OPTIONS.rooms} onChange={(v) => set({ rooms: v })} testid="svc-rooms" />

                    <SelectCell label={tr("مدة الخدمة")} value={cf.service_duration} options={SVC_OPTIONS.service_duration} required onChange={(v) => set({ service_duration: v })} testid="svc-duration" />
                    <SelectCell label={tr("التكرار")} value={cf.frequency} options={SVC_OPTIONS.frequency} required onChange={(v) => set({ frequency: v })} testid="svc-frequency" />

                    <SelectCell label={tr("الوقت المفضل")} value={cf.preferred_time} options={SVC_OPTIONS.preferred_time} onChange={(v) => set({ preferred_time: v })} testid="svc-preferred-time" />
                    <SelectCell label={tr("المواد متضمنة؟")} value={cf.materials_included} options={SVC_OPTIONS.materials_included} onChange={(v) => set({ materials_included: v })} testid="svc-materials-included" />
                </>}

                {/* ===== DEV / DESIGN / BUSINESS branch ===== */}
                {isDev && <>
                    <SelectCell label={tr("نوع المشروع")} value={cf.project_type} options={SVC_OPTIONS.project_type} required onChange={(v) => set({ project_type: v })} testid="svc-project-type" />
                    <SelectCell label={tr("مستوى الخبرة")} value={cf.experience_level} options={SVC_OPTIONS.experience_level} required onChange={(v) => set({ experience_level: v })} testid="svc-experience-level" />

                    <SelectCell label={tr("مدة التسليم")} value={cf.delivery_time} options={SVC_OPTIONS.delivery_time} required onChange={(v) => set({ delivery_time: v })} testid="svc-delivery-time" />
                    <SelectCell label={tr("التعديلات")} value={cf.revisions} options={SVC_OPTIONS.revisions} onChange={(v) => set({ revisions: v })} testid="svc-revisions" />

                    <SelectCell label={tr("النطاق المالي")} value={cf.budget_range} options={SVC_OPTIONS.budget_range} onChange={(v) => set({ budget_range: v })} testid="svc-budget-range" />
                    <SelectCell label={tr("وسيلة التواصل")} value={cf.communication_method} options={SVC_OPTIONS.communication_method} onChange={(v) => set({ communication_method: v })} testid="svc-communication" />
                </>}

                {/* ===== EDUCATION branch ===== */}
                {isEdu && <>
                    <SelectCell label={tr("المادة")} value={cf.edu_subject} options={SVC_OPTIONS.edu_subject} required onChange={(v) => set({ edu_subject: v })} testid="svc-edu-subject" />
                    <SelectCell label={tr("المستوى")} value={cf.edu_level} options={SVC_OPTIONS.edu_level} required onChange={(v) => set({ edu_level: v })} testid="svc-edu-level" />

                    <SelectCell label={tr("مدة الجلسة")} value={cf.session_duration} options={SVC_OPTIONS.session_duration} required onChange={(v) => set({ session_duration: v })} testid="svc-session-duration" />
                    <SelectCell label={tr("عدد الجلسات")} value={cf.sessions_count} options={SVC_OPTIONS.sessions_count} onChange={(v) => set({ sessions_count: v })} testid="svc-sessions-count" />

                    <SelectCell label={tr("نمط التدريس")} value={cf.delivery_mode} options={SVC_OPTIONS.delivery_mode} required onChange={(v) => set({ delivery_mode: v })} testid="svc-delivery-mode" />
                    <SelectCell label={tr("الجدول الزمني")} value={cf.edu_schedule} options={SVC_OPTIONS.edu_schedule} onChange={(v) => set({ edu_schedule: v })} testid="svc-edu-schedule" />
                </>}
            </div>

            {/* Empty state hint */}
            {!sType && (
                <p className="text-[10px] text-[var(--text-muted)] font-arabic-body mt-1">
                    💡 {tr("اختر «نوع الخدمة» أعلاه لتظهر الحقول التفصيلية الخاصة بها.")}
                </p>
            )}
        </div>
    );
}

/* =========================================================================
   Shared 2-col cell primitives (kept local for zero-coupling)
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

function NumberCell({ label, value, onChange, required, suffix, hint, testid }) {
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
            {hint && <span className="block text-[9px] font-arabic-body text-[var(--text-muted)] mt-1">{hint}</span>}
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

function DateCell({ label, value, onChange, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label}</span>
            <input
                type="date"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
            />
        </label>
    );
}

function DateTimeCell({ label, value, onChange, hint, testid }) {
    return (
        <label className="block">
            <span className="block text-[10px] font-arabic font-bold text-[var(--text-muted)] mb-1">{label}</span>
            <input
                type="datetime-local"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-[var(--surface-elevated)] rounded-xl px-2 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin"
            />
            {hint && <span className="block text-[9px] font-arabic-body text-emerald-600 mt-1">{hint}</span>}
        </label>
    );
}

// Silence unused-var linter for Sparkle (kept available for future per-row AI hints).
void Sparkle;
