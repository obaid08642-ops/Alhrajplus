// Market-level Details Boxes for Animals/Livestock + Equipment — Mobile.
// Strict 2-column rows mirroring /app/frontend/src/components/AnimalsEquipmentBoxes.js.
//
// • Animals: breed list cascades from animal_type; طيور adds (cage_type / count);
//            خيول adds (training_level / horse_usage).
// • Equipment: rental_or_sale toggles a rental block (rental_period + insurance_required).

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
import { useI18n } from "../I18nContext";
import { colors } from "../theme";

/* ============================================================
   ANIMALS / LIVESTOCK
   ============================================================ */
const ANIMAL_TYPES = ["إبل", "أغنام", "أبقار", "خيول", "طيور", "حيوانات أليفة"];

const BREED_BY_TYPE = {
    "إبل": ["المجاهيم", "الوضح", "المغاتير", "الصفر", "الشعل", "أصيل", "حيلة", "آخر"],
    "أغنام": ["نعيمي", "نجدي", "حري", "صواكني", "عواس", "السواكني", "الحبسي", "البربري", "آخر"],
    "أبقار": ["هولشتاين", "جيرسي", "بقر بلدي", "بقر هندي", "أنغوس", "براون سويس", "شاروليه", "آخر"],
    "خيول": ["عربي أصيل", "خيل واهو", "إنجليزي ثوروبريد", "كوارتر", "آرابي", "مهجن", "آخر"],
    "طيور": ["دجاج بلدي", "دجاج لاحم", "دجاج بياض", "حمام زاجل", "حمام زينة", "بط", "إوز", "ديك رومي", "كناري", "ببغاء", "صقر", "حسون", "آخر"],
    "حيوانات أليفة": ["قطط", "كلاب", "أرانب", "هامستر", "زواحف", "أسماك زينة", "خنزير غينيا", "آخر"],
};

const ANIMAL_OPTS = {
    age: ["صغير (أقل من 6 شهور)", "متوسط (6 شهور - سنة)", "كبير (أكثر من سنة)", "بالأشهر — حدد", "بالسنوات — حدد"],
    gender: ["ذكر", "أنثى", "غير محدد"],
    health_status: ["سليم تماماً", "تحت العلاج", "معافى من الأمراض", "بحاجة لفحص", "حامل / عشار"],
    vaccinated: ["نعم — كامل التطعيمات", "نعم — جزئي", "لا"],
    purpose: ["للبيع", "للتربية", "للذبح", "للمزاد", "للحليب / الإنتاج", "للزينة / الأليف"],
    cage_type: ["قفص مفرد", "قفص جماعي", "قفص تربية", "حظيرة مفتوحة", "حظيرة مغلقة", "حظيرة أرضية", "حظيرة بطاريات"],
    horse_training_level: ["غير مدرب", "مبتدئ", "متوسط", "متقدم", "بطل سباقات"],
    horse_usage: ["سباق", "تربية", "ركوب / رياضة", "عرض / جمال", "تجارة"],
};

export function AnimalsDetailsBoxMobile({ form, setForm }) {
    const { t } = useI18n();
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });

    const animalType = cf.animal_type || "";
    const breeds = BREED_BY_TYPE[animalType] || [];
    const isBirds = animalType === "طيور";
    const isHorse = animalType === "خيول";

    return (
        <View style={s.box} testID="animals-details-box">
            <Text style={s.title}>🐄 {t("تفاصيل الحيوان")}</Text>

            {/* Row 1 */}
            <View style={s.row}>
                <Cell label={t("نوع الحيوان") + " *"}>
                    <PickerCell value={cf.animal_type} options={ANIMAL_TYPES} onChange={(v) => set({ animal_type: v, breed: "" })} />
                </Cell>
                <Cell label={t("السلالة") + " *"}>
                    <PickerCell value={cf.breed} options={breeds} disabled={!animalType} onChange={(v) => set({ breed: v })} />
                    {!animalType && <Text style={s.hint}>{t("اختر نوع الحيوان أولاً")}</Text>}
                </Cell>
            </View>

            {/* Row 2 */}
            <View style={s.row}>
                <Cell label={t("العمر") + " *"}>
                    <PickerCell value={cf.age} options={ANIMAL_OPTS.age} onChange={(v) => set({ age: v })} />
                </Cell>
                <Cell label={t("الجنس") + " *"}>
                    <PickerCell value={cf.gender} options={ANIMAL_OPTS.gender} onChange={(v) => set({ gender: v })} />
                </Cell>
            </View>

            {/* Row 3 */}
            <View style={s.row}>
                <Cell label={t("الحالة الصحية") + " *"}>
                    <PickerCell value={cf.health_status} options={ANIMAL_OPTS.health_status} onChange={(v) => set({ health_status: v })} />
                </Cell>
                <Cell label={t("التطعيم") + " *"}>
                    <PickerCell value={cf.vaccinated} options={ANIMAL_OPTS.vaccinated} onChange={(v) => set({ vaccinated: v })} />
                </Cell>
            </View>

            {/* Row 4 */}
            <View style={s.row}>
                <Cell label={t("الوزن (كجم)")}>
                    <TextInput value={String(cf.weight || "")} onChangeText={(v) => set({ weight: v.replace(/[^0-9.]/g, "") })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("العدد المتوفر") + " *"}>
                    <TextInput value={String(cf.quantity || "")} onChangeText={(v) => set({ quantity: v.replace(/[^0-9]/g, "") })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 5 */}
            <View style={s.row}>
                <Cell label={t("الغرض") + " *"}>
                    <PickerCell value={cf.purpose} options={ANIMAL_OPTS.purpose} onChange={(v) => set({ purpose: v })} />
                </Cell>
                <Cell label={t("السعر") + ` (${form.currency || "ر.س"}) *`}>
                    <TextInput value={form.price || ""} onChangeText={(v) => setForm({ ...form, price: v.replace(/[^0-9.]/g, "") })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Birds branch */}
            {isBirds && (
                <View style={s.row}>
                    <Cell label={t("نوع القفص / السكن") + " *"}>
                        <PickerCell value={cf.cage_type} options={ANIMAL_OPTS.cage_type} onChange={(v) => set({ cage_type: v })} />
                    </Cell>
                    <Cell label={t("عدد الطيور بالمجموعة")}>
                        <TextInput value={String(cf.flock_count || "")} onChangeText={(v) => set({ flock_count: v.replace(/[^0-9]/g, "") })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                    </Cell>
                </View>
            )}

            {/* Horse branch */}
            {isHorse && (
                <View style={s.row}>
                    <Cell label={t("مستوى التدريب") + " *"}>
                        <PickerCell value={cf.training_level} options={ANIMAL_OPTS.horse_training_level} onChange={(v) => set({ training_level: v })} />
                    </Cell>
                    <Cell label={t("الاستخدام") + " *"}>
                        <PickerCell value={cf.horse_usage} options={ANIMAL_OPTS.horse_usage} onChange={(v) => set({ horse_usage: v })} />
                    </Cell>
                </View>
            )}
        </View>
    );
}

/* ============================================================
   EQUIPMENT / HEAVY MACHINERY
   ============================================================ */
const EQUIPMENT_TYPES = ["حفارات", "شيولات", "رافعات", "معدات بناء", "مولدات", "شاحنات", "خلاطات خرسانة", "ضواغط هواء", "ضخ مياه", "آليات تشطيب"];

const EQUIPMENT_BRANDS = ["Caterpillar (CAT)", "Komatsu", "Hitachi", "Volvo", "JCB", "Hyundai", "Liebherr", "Kobelco", "Doosan", "Bobcat", "Case", "Sany", "XCMG", "Mitsubishi", "Atlas Copco", "Mercedes-Benz", "MAN", "Scania", "Iveco", "آخر"];

const EQUIPMENT_OPTS = {
    condition: ["جديد", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "يحتاج صيانة", "للقطع / الفك"],
    year: Array.from({ length: 31 }, (_, i) => String(2026 - i)),
    rental_or_sale: ["للبيع", "للإيجار", "للبيع أو الإيجار"],
    location_type: ["داخل الورشة", "في موقع العمل", "موقع تخزين", "متنقل / حسب الطلب"],
    availability: ["متاح الآن", "متاح خلال أسبوع", "متاح حسب الجدول", "محجوز جزئياً"],
    rental_period: ["يومي", "أسبوعي", "شهري", "ربع سنوي", "سنوي", "حسب المشروع"],
    insurance_required: ["نعم — تأمين شامل", "نعم — تأمين أساسي", "لا", "حسب الاتفاق"],
};

export function EquipmentDetailsBoxMobile({ form, setForm }) {
    const { t } = useI18n();
    const cf = form.custom_fields || {};
    const set = (patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } });
    const ros = cf.rental_or_sale || "";
    const isRental = ros === "للإيجار" || ros === "للبيع أو الإيجار";

    return (
        <View style={s.box} testID="equipment-details-box">
            <Text style={s.title}>🏗️ {t("تفاصيل المعدات")}</Text>

            {/* Row 1 */}
            <View style={s.row}>
                <Cell label={t("نوع المعدة") + " *"}>
                    <PickerCell value={cf.equipment_type} options={EQUIPMENT_TYPES} onChange={(v) => set({ equipment_type: v })} />
                </Cell>
                <Cell label={t("الحالة") + " *"}>
                    <PickerCell value={cf.condition} options={EQUIPMENT_OPTS.condition} onChange={(v) => set({ condition: v })} />
                </Cell>
            </View>

            {/* Row 2 */}
            <View style={s.row}>
                <Cell label={t("الماركة") + " *"}>
                    <PickerCell value={cf.brand} options={EQUIPMENT_BRANDS} onChange={(v) => set({ brand: v })} />
                </Cell>
                <Cell label={t("الموديل") + " *"}>
                    <TextInput value={cf.model || ""} onChangeText={(v) => set({ model: v })} placeholder={t("مثال: CAT 320D")} placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 3 */}
            <View style={s.row}>
                <Cell label={t("سنة الصنع") + " *"}>
                    <PickerCell value={cf.year} options={EQUIPMENT_OPTS.year} onChange={(v) => set({ year: v })} />
                </Cell>
                <Cell label={t("ساعات التشغيل")}>
                    <TextInput value={String(cf.usage_hours || "")} onChangeText={(v) => set({ usage_hours: v.replace(/[^0-9]/g, "") })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 4 */}
            <View style={s.row}>
                <Cell label={t("نوع العرض") + " *"}>
                    <PickerCell value={cf.rental_or_sale} options={EQUIPMENT_OPTS.rental_or_sale} onChange={(v) => set({ rental_or_sale: v })} />
                </Cell>
                <Cell label={(isRental ? t("سعر الإيجار") : t("السعر")) + ` (${form.currency || "ر.س"}) *`}>
                    <TextInput value={form.price || ""} onChangeText={(v) => setForm({ ...form, price: v.replace(/[^0-9.]/g, "") })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 5 */}
            <View style={s.row}>
                <Cell label={t("موقع المعدة") + " *"}>
                    <PickerCell value={cf.location_type} options={EQUIPMENT_OPTS.location_type} onChange={(v) => set({ location_type: v })} />
                </Cell>
                <Cell label={t("التوافر") + " *"}>
                    <PickerCell value={cf.availability} options={EQUIPMENT_OPTS.availability} onChange={(v) => set({ availability: v })} />
                </Cell>
            </View>

            {/* Rental branch */}
            {isRental && (
                <View style={s.row}>
                    <Cell label={t("فترة الإيجار") + " *"}>
                        <PickerCell value={cf.rental_period} options={EQUIPMENT_OPTS.rental_period} onChange={(v) => set({ rental_period: v })} />
                    </Cell>
                    <Cell label={t("التأمين مطلوب؟") + " *"}>
                        <PickerCell value={cf.insurance_required} options={EQUIPMENT_OPTS.insurance_required} onChange={(v) => set({ insurance_required: v })} />
                    </Cell>
                </View>
            )}
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
});
