// OLX/Haraj-grade Details Boxes for Jobs + Real Estate — Mobile.
// Strict 2-column rows mirroring /app/frontend/src/components/JobsRealEstateBoxes.js.
//
// Jobs adapts its bottom block based on `post_type`:
//   • "عرض وظيفة"   → salary_range + requirements
//   • "باحث عن عمل" → expected_salary + skills

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
import { useI18n } from "../I18nContext";
import { colors } from "../theme";

/* ============================================================
   JOBS
   ============================================================ */
const JOB_OPTS = {
  job_type: ["دوام كامل", "دوام جزئي", "عقد محدد المدة", "تدريب / Internship", "فريلانس / عمل حر", "موسمي", "تطوع"],
  experience_level: ["مبتدئ (Entry)", "مهنية مبكرة (Junior)", "متوسط (Mid-level)", "متقدم (Senior)", "قيادي (Lead)", "مدير (Manager)", "تنفيذي (Director / VP)"],
  education_level: ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "غير محدد"],
  work_schedule: ["دوام صباحي", "دوام مسائي", "دوامين", "نهاية الأسبوع", "مرن / متغير"],
  location_type: ["في الموقع (On-site)", "عن بُعد (Remote)", "هجين (Hybrid)"],
  field: ["تقنية المعلومات", "هندسة", "طب وصحة", "تعليم وتدريس", "مبيعات وتسويق", "محاسبة ومالية", "موارد بشرية", "قانون", "إعلام وصحافة", "ضيافة وسياحة", "بناء ومقاولات", "صناعة وإنتاج", "نقل ولوجستيات", "خدمة عملاء", "إداري ومكتبي", "تصميم وإبداع", "أمن وحراسة", "تجزئة ومتاجر", "عقارات", "زراعة", "أخرى"]
};
export function JobsDetailsBoxMobile({
  form,
  setForm
}) {
  const { t } = useI18n();
  
  const cf = form.custom_fields || {};
  const set = patch => setForm({
    ...form,
    custom_fields: {
      ...form.custom_fields,
      ...patch
    }
  });
  const isSeeker = cf.post_type === "باحث عن عمل";
  return <View style={s.box} testID="jobs-details-box">
            <Text style={s.title}>💼 {t("تفاصيل الوظيفة")}</Text>

            {/* Row 1 */}
            <View style={s.row}>
                <Cell label={t("المسمى الوظيفي") + " *"}>
                    <TextInput value={cf.job_title || ""} onChangeText={v => set({
          job_title: v
        })} placeholder={t("مثال: مهندس برمجيات أول")} placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("نوع الوظيفة") + " *"}>
                    <PickerCell value={cf.job_type} options={JOB_OPTS.job_type} onChange={v => set({
          job_type: v
        })} />
                </Cell>
            </View>

            {/* Row 2 — salary_range OR expected_salary */}
            <View style={s.row}>
                {isSeeker ? <Cell label={t("الراتب المتوقع")}>
                        <TextInput value={cf.expected_salary || ""} onChangeText={v => set({
          expected_salary: v
        })} placeholder={t("مثال: 8,000 ر.س")} placeholderTextColor={colors.textMuted} style={s.input} />
                    </Cell> : <Cell label={t("نطاق الراتب")}>
                        <TextInput value={cf.salary_range || ""} onChangeText={v => set({
          salary_range: v
        })} placeholder={t("مثال: 6,000 - 10,000 ر.س")} placeholderTextColor={colors.textMuted} style={s.input} />
                    </Cell>}
                <Cell label={t("مستوى الخبرة") + " *"}>
                    <PickerCell value={cf.experience_level} options={JOB_OPTS.experience_level} onChange={v => set({
          experience_level: v
        })} />
                </Cell>
            </View>

            {/* Row 3 */}
            <View style={s.row}>
                <Cell label={t("المؤهل العلمي") + " *"}>
                    <PickerCell value={cf.education_level} options={JOB_OPTS.education_level} onChange={v => set({
          education_level: v
        })} />
                </Cell>
                <Cell label={t("جدول العمل")}>
                    <PickerCell value={cf.work_schedule} options={JOB_OPTS.work_schedule} onChange={v => set({
          work_schedule: v
        })} />
                </Cell>
            </View>

            {/* Row 4 */}
            <View style={s.row}>
                <Cell label={t("نمط الموقع") + " *"}>
                    <PickerCell value={cf.location_type} options={JOB_OPTS.location_type} onChange={v => set({
          location_type: v
        })} />
                </Cell>
                <Cell label={t("المجال / التخصص") + " *"}>
                    <PickerCell value={cf.field} options={JOB_OPTS.field} onChange={v => set({
          field: v
        })} />
                </Cell>
            </View>

            {/* Conditional bottom block */}
            {isSeeker ? <View style={{
      marginTop: 4
    }}>
                    <Text style={s.label}>{t("المهارات والقدرات")}</Text>
                    <TextInput value={cf.skills || ""} onChangeText={v => set({
        skills: v
      })} placeholder={t("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} placeholderTextColor={colors.textMuted} style={[s.input, {
        height: 80,
        textAlignVertical: "top"
      }]} multiline />
                </View> : <View style={{
      marginTop: 4
    }}>
                    <Text style={s.label}>{t("المتطلبات والشروط")}</Text>
                    <TextInput value={cf.requirements || ""} onChangeText={v => set({
        requirements: v
      })} placeholder={t("اذكر المؤهلات والمتطلبات الإلزامية...")} placeholderTextColor={colors.textMuted} style={[s.input, {
        height: 80,
        textAlignVertical: "top"
      }]} multiline />
                </View>}
        </View>;
}

/* ============================================================
   REAL ESTATE
   ============================================================ */
const RE_OPTS = {
  property_type: ["شقة", "فيلا", "بيت شعبي", "دور", "دوبلكس", "بنتهاوس", "استوديو", "غرفة", "أرض سكنية", "أرض تجارية", "أرض زراعية", "مزرعة", "استراحة", "محل تجاري", "مكتب", "مستودع / مخزن", "عمارة كاملة", "عمارة سكنية", "مجمع تجاري", "شاليه", "روف"],
  listing_type: ["للبيع", "للإيجار"],
  rooms: ["1", "2", "3", "4", "5+"],
  bathrooms: ["1", "2", "3", "4+"],
  furnishing: ["مفروشة بالكامل", "مفروشة جزئياً", "غير مفروشة", "مع أجهزة فقط"],
  condition: ["جديد", "ممتاز", "جيد جداً", "جيد", "يحتاج تجديد", "للهدم"],
  building_age: ["تحت الإنشاء", "جديد (0-1 سنة)", "2-5 سنوات", "6-10 سنوات", "11-20 سنة", "أكثر من 20 سنة"],
  payment_method: ["كاش", "بنكي / تمويل", "كاش + بنكي", "أقساط من المالك", "تحويل بنكي شهري", "حسب الاتفاق"]
};
export function RealEstateDetailsBoxMobile({
  form,
  setForm
}) {
  const { t } = useI18n();
  
  const cf = form.custom_fields || {};
  const set = patch => setForm({
    ...form,
    custom_fields: {
      ...form.custom_fields,
      ...patch
    }
  });
  return <View style={s.box} testID="realestate-details-box">
            <Text style={s.title}>🏠 {t("تفاصيل العقار")}</Text>

            {/* Row 1 */}
            <View style={s.row}>
                <Cell label={t("نوع العقار") + " *"}>
                    <PickerCell value={cf.property_type} options={RE_OPTS.property_type} onChange={v => set({
          property_type: v
        })} />
                </Cell>
                <Cell label={t("نوع الإعلان") + " *"}>
                    <PickerCell value={cf.listing_type} options={RE_OPTS.listing_type} onChange={v => set({
          listing_type: v,
          deal_type: v
        })} />
                </Cell>
            </View>

            {/* Row 2 */}
            <View style={s.row}>
                <Cell label={t("عدد الغرف") + " *"}>
                    <PickerCell value={cf.rooms} options={RE_OPTS.rooms} onChange={v => set({
          rooms: v
        })} />
                </Cell>
                <Cell label={t("عدد الحمامات") + " *"}>
                    <PickerCell value={cf.bathrooms} options={RE_OPTS.bathrooms} onChange={v => set({
          bathrooms: v
        })} />
                </Cell>
            </View>

            {/* Row 3 */}
            <View style={s.row}>
                <Cell label={t("المساحة (م²)") + " *"}>
                    <TextInput value={String(cf.area || "")} onChangeText={v => set({
          area: v.replace(/[^0-9.]/g, "")
        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("السعر") + ` (${form.currency || "ر.س"}) *`}>
                    <TextInput value={form.price || ""} onChangeText={v => setForm({
          ...form,
          price: v.replace(/[^0-9.]/g, "")
        })} keyboardType="numeric" placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            {/* Row 4 */}
            <View style={s.row}>
                <Cell label={t("الفرش") + " *"}>
                    <PickerCell value={cf.furnishing} options={RE_OPTS.furnishing} onChange={v => set({
          furnishing: v
        })} />
                </Cell>
                <Cell label={t("حالة العقار") + " *"}>
                    <PickerCell value={cf.condition} options={RE_OPTS.condition} onChange={v => set({
          condition: v
        })} />
                </Cell>
            </View>

            {/* Row 5 */}
            <View style={s.row}>
                <Cell label={t("عمر البناء") + " *"}>
                    <PickerCell value={cf.building_age} options={RE_OPTS.building_age} onChange={v => set({
          building_age: v
        })} />
                </Cell>
                <Cell label={t("طريقة الدفع") + " *"}>
                    <PickerCell value={cf.payment_method} options={RE_OPTS.payment_method} onChange={v => set({
          payment_method: v
        })} />
                </Cell>
            </View>
        </View>;
}

/* ============================================================
   Shared primitives
   ============================================================ */
function Cell({
  label,
  children
}) {
  return <View style={s.cell}>
            <Text style={s.label}>{label}</Text>
            {children}
        </View>;
}
function PickerCell({
  value,
  options,
  onChange,
  disabled
}) {
  const [open, setOpen] = useState(false);
  const valid = !disabled && (options || []).length > 0;
  return <>
            <TouchableOpacity disabled={!valid} onPress={() => setOpen(true)} style={[s.input, !valid && {
      opacity: 0.5
    }]}>
                <Text style={value ? s.txt : s.ph}>{value || "—"}</Text>
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={s.backdrop}>
                    <View style={s.sheet}>
                        <FlatList data={options || []} keyExtractor={(o, i) => `${o}-${i}`} renderItem={({
            item
          }) => <TouchableOpacity onPress={() => {
            onChange(item);
            setOpen(false);
          }} style={s.item}>
                                    <Text style={[s.itemTxt, item === value && {
              color: colors.primary,
              fontWeight: "800"
            }]}>{item}</Text>
                                </TouchableOpacity>} />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>;
}
const s = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14
  },
  title: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  cell: {
    flex: 1
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: "700"
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
    color: colors.text,
    fontSize: 13
  },
  txt: {
    color: colors.text,
    fontSize: 13
  },
  ph: {
    color: colors.textMuted,
    fontSize: 13
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 20
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxHeight: "70%",
    paddingVertical: 8
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  itemTxt: {
    color: colors.text,
    fontSize: 14
  }
});