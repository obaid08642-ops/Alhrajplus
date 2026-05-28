// OLX/Haraj/OpenSooq-grade Details Boxes for Jobs + Real Estate categories — Mobile.
// Strict 2-column rows mirroring the web implementation in
// /app/frontend/src/components/JobsRealEstateBoxes.js.
//
// Multi-select fields (benefits, amenities) store selections as a
// comma-separated string in custom_fields (forward-compatible with the
// existing backend blob).

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
import { useI18n } from "../I18nContext";
import { colors } from "../theme";

/* ============================================================
   JOBS
   ============================================================ */
const JOB_OPTS = {
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

export function JobsDetailsBoxMobile({ form, setForm }) {
    const { t } = useI18n();
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });

    return (
        <View style={s.box} testID="jobs-details-box">
            <Text style={s.title}>💼 {t("تفاصيل الوظيفة")}</Text>

            {/* Row 1 */}
            <View style={s.row}>
                <Cell label={t("المسمى الوظيفي") + " *"}>
                    <TextInput value={cf.job_title || ""} onChangeText={(v) => set({ job_title: v })} placeholder={t("مثال: مهندس برمجيات أول")} placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("المجال / التصنيف") + " *"}>
                    <PickerCell value={cf.industry} options={JOB_OPTS.industry} onChange={(v) => set({ industry: v })} />
                </Cell>
            </View>

            {/* Row 2 */}
            <View style={s.row}>
                <Cell label={t("نوع الوظيفة") + " *"}>
                    <PickerCell value={cf.employment_type} options={JOB_OPTS.employment_type} onChange={(v) => set({ employment_type: v })} />
                </Cell>
                <Cell label={t("نمط العمل") + " *"}>
                    <PickerCell value={cf.work_mode} options={JOB_OPTS.work_mode} onChange={(v) => set({ work_mode: v })} />
                </Cell>
            </View>

            {/* Row 3: Salary Range | Currency */}
            <View style={s.row}>
                <Cell label={t("نطاق الراتب")}>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                        <TextInput value={String(cf.salary_min || "")} onChangeText={(v) => set({ salary_min: v })} keyboardType="numeric" placeholder={t("من")} placeholderTextColor={colors.textMuted} style={[s.input, { flex: 1 }]} />
                        <TextInput value={String(cf.salary_max || "")} onChangeText={(v) => set({ salary_max: v })} keyboardType="numeric" placeholder={t("إلى")} placeholderTextColor={colors.textMuted} style={[s.input, { flex: 1 }]} />
                    </View>
                </Cell>
                <Cell label={t("العملة")}>
                    <PickerCell value={cf.salary_currency} options={JOB_OPTS.salary_currency} onChange={(v) => set({ salary_currency: v })} />
                </Cell>
            </View>

            {/* Row 4 */}
            <View style={s.row}>
                <Cell label={t("مستوى الخبرة") + " *"}>
                    <PickerCell value={cf.experience_level} options={JOB_OPTS.experience_level} onChange={(v) => set({ experience_level: v })} />
                </Cell>
                <Cell label={t("سنوات الخبرة") + " *"}>
                    <PickerCell value={cf.experience_years} options={JOB_OPTS.experience_years} onChange={(v) => set({ experience_years: v })} />
                </Cell>
            </View>

            {/* Row 5 */}
            <View style={s.row}>
                <Cell label={t("المؤهل العلمي") + " *"}>
                    <PickerCell value={cf.education} options={JOB_OPTS.education} onChange={(v) => set({ education: v })} />
                </Cell>
                <Cell label={t("اللغات المطلوبة")}>
                    <PickerCell value={cf.language_requirement} options={JOB_OPTS.language_requirement} onChange={(v) => set({ language_requirement: v })} />
                </Cell>
            </View>

            {/* Row 6 */}
            <View style={s.row}>
                <Cell label={t("اسم الشركة")}>
                    <TextInput value={cf.company_name || ""} onChangeText={(v) => set({ company_name: v })} placeholder={t("مثال: شركة الخليج للتقنية")} placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("نوع الشركة")}>
                    <PickerCell value={cf.company_type} options={JOB_OPTS.company_type} onChange={(v) => set({ company_type: v })} />
                </Cell>
            </View>

            {/* Row 7: Benefits (full width multi-select) */}
            <MultiSelectChips label={t("المزايا والمميزات")} value={cf.benefits} options={JOB_OPTS.benefits} onChange={(v) => set({ benefits: v })} />
        </View>
    );
}

/* ============================================================
   REAL ESTATE
   ============================================================ */
const RE_OPTS = {
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

export function RealEstateDetailsBoxMobile({ form, setForm }) {
    const { t } = useI18n();
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const isRent = cf.deal_type === "للإيجار";

    return (
        <View style={s.box} testID="realestate-details-box">
            <Text style={s.title}>🏠 {t("تفاصيل العقار")}</Text>

            {/* Row 1 */}
            <View style={s.row}>
                <Cell label={t("نوع العقار") + " *"}>
                    <PickerCell value={cf.property_type} options={RE_OPTS.property_type} onChange={(v) => set({ property_type: v })} />
                </Cell>
                <Cell label={t("نوع الإعلان") + " *"}>
                    <PickerCell value={cf.deal_type} options={RE_OPTS.deal_type} onChange={(v) => set({ deal_type: v })} />
                </Cell>
            </View>

            {/* Row 2: Price | Payment frequency */}
            <View style={s.row}>
                <Cell label={t("السعر") + ` (${form.currency})`}>
                    <TextInput value={form.price || ""} onChangeText={(v) => setForm({ ...form, price: v.replace(/[^0-9.]/g, "") })} keyboardType="numeric" placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("نظام الدفع")}>
                    <PickerCell value={cf.payment_frequency} options={RE_OPTS.payment_frequency} onChange={(v) => set({ payment_frequency: v })} disabled={!isRent} />
                    {!isRent && <Text style={s.hint}>{t("اختر «للإيجار» لتفعيل الدفع")}</Text>}
                </Cell>
            </View>

            {/* Row 3 */}
            <View style={s.row}>
                <Cell label={t("المساحة (م²)") + " *"}>
                    <TextInput value={String(cf.area_m2 || "")} onChangeText={(v) => set({ area_m2: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("الفرش")}>
                    <PickerCell value={cf.furnished} options={RE_OPTS.furnished} onChange={(v) => set({ furnished: v })} />
                </Cell>
            </View>

            {/* Row 4 */}
            <View style={s.row}>
                <Cell label={t("عدد الغرف")}>
                    <TextInput value={String(cf.rooms || "")} onChangeText={(v) => set({ rooms: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("عدد الحمامات")}>
                    <TextInput value={String(cf.bathrooms || "")} onChangeText={(v) => set({ bathrooms: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 5 */}
            <View style={s.row}>
                <Cell label={t("الدور")}>
                    <TextInput value={String(cf.floor_num || "")} onChangeText={(v) => set({ floor_num: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("عدد الأدوار الكلي")}>
                    <TextInput value={String(cf.total_floors || "")} onChangeText={(v) => set({ total_floors: v })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 6 */}
            <View style={s.row}>
                <Cell label={t("عمر العقار")}>
                    <PickerCell value={cf.age_years} options={RE_OPTS.age_years} onChange={(v) => set({ age_years: v })} />
                </Cell>
                <Cell label={t("حالة العقار")}>
                    <PickerCell value={cf.condition} options={RE_OPTS.condition} onChange={(v) => set({ condition: v })} />
                </Cell>
            </View>

            {/* Row 7 */}
            <View style={s.row}>
                <Cell label={t("المواقف")}>
                    <PickerCell value={cf.parking} options={RE_OPTS.parking} onChange={(v) => set({ parking: v })} />
                </Cell>
                <Cell label={t("المصعد")}>
                    <PickerCell value={cf.elevator} options={RE_OPTS.elevator} onChange={(v) => set({ elevator: v })} />
                </Cell>
            </View>

            {/* Row 8: Amenities (full width multi-select) */}
            <MultiSelectChips label={t("الميزات والمرافق")} value={cf.amenities} options={RE_OPTS.amenities} onChange={(v) => set({ amenities: v })} />
        </View>
    );
}

/* ============================================================
   Shared primitives
   ============================================================ */
function Cell({ label, children }) {
    return (
        <View style={s.cell}>
            <Text style={s.label}>{label}</Text>
            {children}
        </View>
    );
}

function PickerCell({ value, options, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const valid = !disabled && (options || []).length > 0;
    return (
        <>
            <TouchableOpacity disabled={!valid} onPress={() => setOpen(true)} style={[s.input, !valid && { opacity: 0.5 }]}>
                <Text style={value ? s.txt : s.ph}>{value || "—"}</Text>
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={s.backdrop}>
                    <View style={s.sheet}>
                        <FlatList
                            data={options || []}
                            keyExtractor={(o, i) => `${o}-${i}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => { onChange(item); setOpen(false); }} style={s.item}>
                                    <Text style={[s.itemTxt, item === value && { color: colors.primary, fontWeight: "800" }]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

function MultiSelectChips({ label, value, options, onChange }) {
    const selected = (value || "").split(",").map((x) => x.trim()).filter(Boolean);
    const toggle = (opt) => {
        const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt];
        onChange(next.join(", "));
    };
    return (
        <View style={{ marginTop: 6 }}>
            <Text style={s.label}>{label}</Text>
            <View style={s.chipRow}>
                {(options || []).map((opt) => {
                    const active = selected.includes(opt);
                    return (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => toggle(opt)}
                            style={[s.chip, active && s.chipActive]}
                            activeOpacity={0.85}
                        >
                            <Text style={[s.chipTxt, active && { color: "#fff" }]}>{active ? "✓ " : "+ "}{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    box: { backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
    title: { fontSize: 12.5, fontWeight: "900", color: colors.text, marginBottom: 10 },
    row: { flexDirection: "row", gap: 8, marginBottom: 8 },
    cell: { flex: 1 },
    label: { fontSize: 10, color: colors.textMuted, marginBottom: 4, fontWeight: "700" },
    input: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, minHeight: 40, justifyContent: "center", color: colors.text, fontSize: 13 },
    txt: { color: colors.text, fontSize: 13 },
    ph: { color: colors.textMuted, fontSize: 13 },
    hint: { fontSize: 9, color: colors.textMuted, marginTop: 3, fontStyle: "italic" },
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "70%", paddingVertical: 8 },
    item: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemTxt: { color: colors.text, fontSize: 14 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipTxt: { fontSize: 10.5, color: colors.text, fontWeight: "700" },
});
