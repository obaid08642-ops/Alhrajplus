// Market-level Details Boxes for Auctions + Services (PRO) — Mobile.
// Strict 2-column rows mirroring the web implementation in
// /app/frontend/src/components/AuctionsServicesBoxes.js.

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
import { useI18n } from "../I18nContext";
import { colors } from "../theme";

/* =========================================================================
   AUCTIONS
   ========================================================================= */
const AUC_OPTS = {
  item_condition: ["جديد", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "للهواة / للجمع", "للترميم"],
  category_type: ["سيارات", "عقارات", "ساعات وإكسسوارات فاخرة", "مجوهرات", "تحف وأنتيكات", "نوادر وعملات", "إلكترونيات", "فن وأعمال يدوية", "أزياء فاخرة", "لوحات سيارات مميزة", "ماشية وخيل", "أخرى"],
  auction_duration: ["3 أيام", "5 أيام", "7 أيام", "10 أيام", "14 يوم", "30 يوم", "حسب التاريخ المحدد"],
  shipping_option: ["استلام من البائع", "شحن داخل المدينة", "شحن داخل الدولة", "شحن دولي", "حسب الاتفاق"],
  payment_method: ["تحويل بنكي", "نقدي عند الاستلام", "Apple Pay / STC Pay", "بطاقة ائتمانية", "كاش حصراً", "Escrow (ضمان وسيط)"]
};
const DUR_TO_DAYS = {
  "3 أيام": 3,
  "5 أيام": 5,
  "7 أيام": 7,
  "10 أيام": 10,
  "14 يوم": 14,
  "30 يوم": 30
};
export function AuctionsDetailsBoxMobile({
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

  // Auto-calculate end_time when duration changes (mirrors web logic)
  useEffect(() => {
    const d = cf.auction_duration;
    if (!d || d === "حسب التاريخ المحدد") return;
    const days = DUR_TO_DAYS[d];
    if (!days) return;
    const end = new Date(Date.now() + days * 86400 * 1000);
    const pad = n => String(n).padStart(2, "0");
    const iso = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
    if (cf.end_time !== iso) set({
      end_time: iso
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cf.auction_duration]);
  const startNum = parseFloat(form.price || cf.starting_price || 0);
  const incrementNum = parseFloat(cf.bid_increment || 0);
  const buyNowNum = parseFloat(cf.buy_now_price || 0);
  const incrementTooLow = incrementNum > 0 && startNum > 0 && incrementNum < startNum * 0.01;
  const buyNowBelowStart = buyNowNum > 0 && startNum > 0 && buyNowNum <= startNum;
  return <View style={s.box} testID="auctions-details-box">
            <Text style={s.title}>🏷️ {t("تفاصيل المزاد")}</Text>

            <View style={s.row}>
                <Cell label={t("حالة المعروض") + " *"}>
                    <PickerCell value={cf.item_condition} options={AUC_OPTS.item_condition} onChange={v => set({
          item_condition: v
        })} />
                </Cell>
                <Cell label={t("نوع التصنيف") + " *"}>
                    <PickerCell value={cf.category_type} options={AUC_OPTS.category_type} onChange={v => set({
          category_type: v
        })} />
                </Cell>
            </View>

            <View style={s.row}>
                <Cell label={t("سعر البداية") + ` (${form.currency || "ر.س"}) *`}>
                    <TextInput value={form.price || ""} onChangeText={v => setForm({
          ...form,
          price: v.replace(/[^0-9.]/g, ""),
          custom_fields: {
            ...form.custom_fields,
            starting_price: v.replace(/[^0-9.]/g, "")
          }
        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("أقل زيادة للمزايدة") + " *"}>
                    <TextInput value={String(cf.bid_increment || "")} onChangeText={v => set({
          bid_increment: v.replace(/[^0-9.]/g, "")
        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            <View style={s.row}>
                <Cell label={t("السعر الاحتياطي (سري)")}>
                    <TextInput value={String(cf.reserve_price || "")} onChangeText={v => set({
          reserve_price: v.replace(/[^0-9.]/g, "")
        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
                <Cell label={t("اشتر الآن (Buy Now)")}>
                    <TextInput value={String(cf.buy_now_price || "")} onChangeText={v => set({
          buy_now_price: v.replace(/[^0-9.]/g, "")
        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                </Cell>
            </View>

            <View style={s.row}>
                <Cell label={t("مدة المزاد") + " *"}>
                    <PickerCell value={cf.auction_duration} options={AUC_OPTS.auction_duration} onChange={v => set({
          auction_duration: v
        })} />
                </Cell>
                <Cell label={t("وقت الانتهاء")}>
                    <TextInput value={cf.end_time || ""} onChangeText={v => set({
          end_time: v
        })} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={colors.textMuted} style={s.input} />
                    {cf.auction_duration && cf.auction_duration !== "حسب التاريخ المحدد" && <Text style={s.hintOk}>✓ {t("تلقائي من المدة")}</Text>}
                </Cell>
            </View>

            <View style={s.row}>
                <Cell label={t("خيار الشحن") + " *"}>
                    <PickerCell value={cf.shipping_option} options={AUC_OPTS.shipping_option} onChange={v => set({
          shipping_option: v
        })} />
                </Cell>
                <Cell label={t("طريقة الدفع") + " *"}>
                    <PickerCell value={cf.payment_method} options={AUC_OPTS.payment_method} onChange={v => set({
          payment_method: v
        })} />
                </Cell>
            </View>

            {(incrementTooLow || buyNowBelowStart) && <View style={{
      marginTop: 4
    }}>
                    {incrementTooLow && <Text style={s.warn}>⚠️ {t("أقل زيادة منخفضة جداً (يفضّل 1% من سعر البداية أو أعلى)")}</Text>}
                    {buyNowBelowStart && <Text style={s.warn}>⚠️ {t("سعر «اشتر الآن» يجب أن يكون أعلى من سعر البداية")}</Text>}
                </View>}
        </View>;
}

/* =========================================================================
   SERVICES PRO (conditional rows by service_type)
   ========================================================================= */
const SVC_BUCKETS = {
  DELIVERY: ["توصيل / نقل", "نقل عفش"],
  CLEANING: ["تنظيف", "خدمات منزلية", "صيانة"],
  DEV: ["تصميم", "برمجة", "خدمات أعمال"],
  EDUCATION: ["تعليم"]
};
const SVC_OPTS = {
  service_type: ["توصيل / نقل", "نقل عفش", "تنظيف", "صيانة", "تعليم", "تصميم", "برمجة", "خدمات منزلية", "خدمات أعمال"],
  pricing_type: ["بالساعة", "بالزيارة", "بالقطعة / المهمة", "متر مربع", "اشتراك شهري", "حسب الاتفاق"],
  schedule_type: ["الآن", "تحديد وقت لاحق"],
  time_window: ["8 ص - 12 ظ", "12 ظ - 4 م", "4 م - 8 م", "8 م - 12 ل", "ليلاً (12 - 6 ص)"],
  vehicle_type: ["دباب صغير", "سيارة سيدان", "سيارة SUV", "بيك أب", "ونيت / لوري", "شاحنة كبيرة", "شاحنة مبردة"],
  load_type: ["خفيف (أقل من 50 كجم)", "متوسط (50-200 كجم)", "ثقيل (200-1000 كجم)", "ثقيل جداً (+1000 كجم)"],
  delivery_recurrence: ["لمرة واحدة", "يومي", "أسبوعي", "شهري"],
  package_type: ["وثائق / مستندات", "طرود صغيرة", "أثاث", "أجهزة كبيرة", "بضائع تجارية", "أخرى"],
  property_type: ["شقة", "فيلا", "بيت", "استوديو", "مكتب", "محل تجاري", "مستودع", "شاليه / استراحة"],
  rooms: ["استوديو", "غرفة 1", "غرفة 2", "غرفة 3", "غرفة 4", "غرفة 5+"],
  service_duration: ["ساعة", "ساعتان", "نصف يوم (4 ساعات)", "يوم كامل (8 ساعات)", "أكثر من يوم"],
  frequency: ["مرة واحدة", "أسبوعي", "كل أسبوعين", "شهري", "اشتراك دائم"],
  preferred_time: ["صباحاً (6 - 12)", "ظهراً (12 - 4)", "مساءً (4 - 9)", "ليلاً (9+)", "مرن"],
  materials_included: ["نعم — مواد التنظيف من المزود", "لا — العميل يوفّر المواد", "حسب الاتفاق"],
  project_type: ["موقع ويب", "تطبيق جوال", "تصميم هوية / لوقو", "تصميم UI/UX", "موشن جرافيك", "تسويق رقمي", "دراسة جدوى", "استشارات أعمال", "ترجمة محتوى", "كتابة محتوى", "آخر"],
  experience_level: ["مبتدئ (Junior)", "متوسط (Mid)", "متقدم (Senior)", "خبير (Expert)"],
  delivery_time: ["24 ساعة", "3 أيام", "أسبوع", "أسبوعان", "شهر", "أكثر من شهر", "حسب المشروع"],
  revisions: ["مراجعة واحدة", "2-3 مراجعات", "حتى الرضا التام", "غير محدد"],
  budget_range: ["أقل من 500", "500 - 1000", "1000 - 3000", "3000 - 5000", "5000 - 10000", "أكثر من 10000", "حسب العرض"],
  communication_method: ["WhatsApp", "Zoom / Google Meet", "Email", "Slack / Discord", "هاتف", "حضوري"],
  edu_subject: ["رياضيات", "علوم / فيزياء / كيمياء", "أحياء", "إنجليزي", "عربي", "حاسب آلي / برمجة", "تصميم", "موسيقى", "تحفيظ قرآن", "تأسيس ابتدائي", "لغات أجنبية", "آخر"],
  edu_level: ["تأسيس / روضة", "ابتدائي", "متوسط", "ثانوي", "جامعي", "تحضيري / مهارات", "كبار"],
  session_duration: ["30 دقيقة", "45 دقيقة", "ساعة", "ساعة ونصف", "ساعتان"],
  sessions_count: ["جلسة واحدة", "5 جلسات", "10 جلسات", "20 جلسة", "شهري (اشتراك)", "حسب الاتفاق"],
  delivery_mode: ["أونلاين (Zoom / Meet)", "حضوري في منزل الطالب", "حضوري في مكان المعلم", "هجين"],
  edu_schedule: ["صباحي", "مسائي", "نهاية الأسبوع", "يومي", "مرن"]
};
export function ServicesProDetailsBoxMobile({
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
  const sType = cf.service_type || "";
  const isDelivery = SVC_BUCKETS.DELIVERY.includes(sType);
  const isCleaning = SVC_BUCKETS.CLEANING.includes(sType);
  const isDev = SVC_BUCKETS.DEV.includes(sType);
  const isEdu = SVC_BUCKETS.EDUCATION.includes(sType);
  const isScheduled = cf.schedule_type === "تحديد وقت لاحق";
  return <View style={s.box} testID="services-pro-details-box">
            <Text style={s.title}>🛠️ {t("تفاصيل الخدمة")}</Text>

            <View style={s.row}>
                <Cell label={t("نوع الخدمة") + " *"}>
                    <PickerCell value={cf.service_type} options={SVC_OPTS.service_type} onChange={v => set({
          service_type: v
        })} />
                </Cell>
                <Cell label={t("طريقة التسعير") + " *"}>
                    <PickerCell value={cf.pricing_type} options={SVC_OPTS.pricing_type} onChange={v => set({
          pricing_type: v
        })} />
                </Cell>
            </View>

            {/* DELIVERY */}
            {isDelivery && <>
                    <View style={s.row}>
                        <Cell label={t("متى تريد الخدمة؟") + " *"}>
                            <PickerCell value={cf.schedule_type} options={SVC_OPTS.schedule_type} onChange={v => set({
            schedule_type: v
          })} />
                        </Cell>
                        <View style={s.cell} />
                    </View>
                    {isScheduled && <View style={s.row}>
                            <Cell label={t("التاريخ")}>
                                <TextInput value={cf.delivery_date || ""} onChangeText={v => set({
            delivery_date: v
          })} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={s.input} />
                            </Cell>
                            <Cell label={t("الوقت")}>
                                <PickerCell value={cf.delivery_time_window} options={SVC_OPTS.time_window} onChange={v => set({
            delivery_time_window: v
          })} />
                            </Cell>
                        </View>}
                    <View style={s.row}>
                        <Cell label={t("نقطة الالتقاط") + " *"}>
                            <TextInput value={cf.pickup_location || ""} onChangeText={v => set({
            pickup_location: v
          })} placeholder={t("المدينة، الحي")} placeholderTextColor={colors.textMuted} style={s.input} />
                        </Cell>
                        <Cell label={t("نقطة الوصول") + " *"}>
                            <TextInput value={cf.dropoff_location || ""} onChangeText={v => set({
            dropoff_location: v
          })} placeholder={t("المدينة، الحي")} placeholderTextColor={colors.textMuted} style={s.input} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("نوع المركبة") + " *"}>
                            <PickerCell value={cf.vehicle_type} options={SVC_OPTS.vehicle_type} onChange={v => set({
            vehicle_type: v
          })} />
                        </Cell>
                        <Cell label={t("حجم / وزن الحمولة")}>
                            <PickerCell value={cf.load_type} options={SVC_OPTS.load_type} onChange={v => set({
            load_type: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("السعر المقترح")}>
                            <TextInput value={String(cf.price_estimate || "")} onChangeText={v => set({
            price_estimate: v.replace(/[^0-9.]/g, "")
          })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                        </Cell>
                        <Cell label={t("المسافة (كم)")}>
                            <TextInput value={String(cf.distance_km || "")} onChangeText={v => set({
            distance_km: v.replace(/[^0-9.]/g, "")
          })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("التكرار")}>
                            <PickerCell value={cf.delivery_recurrence} options={SVC_OPTS.delivery_recurrence} onChange={v => set({
            delivery_recurrence: v
          })} />
                        </Cell>
                        <Cell label={t("نوع الشحنة")}>
                            <PickerCell value={cf.package_type} options={SVC_OPTS.package_type} onChange={v => set({
            package_type: v
          })} />
                        </Cell>
                    </View>
                </>}

            {/* CLEANING / HOME */}
            {isCleaning && <>
                    <View style={s.row}>
                        <Cell label={t("نوع العقار") + " *"}>
                            <PickerCell value={cf.property_type} options={SVC_OPTS.property_type} onChange={v => set({
            property_type: v
          })} />
                        </Cell>
                        <Cell label={t("عدد الغرف")}>
                            <PickerCell value={cf.rooms} options={SVC_OPTS.rooms} onChange={v => set({
            rooms: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("مدة الخدمة") + " *"}>
                            <PickerCell value={cf.service_duration} options={SVC_OPTS.service_duration} onChange={v => set({
            service_duration: v
          })} />
                        </Cell>
                        <Cell label={t("التكرار") + " *"}>
                            <PickerCell value={cf.frequency} options={SVC_OPTS.frequency} onChange={v => set({
            frequency: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("الوقت المفضل")}>
                            <PickerCell value={cf.preferred_time} options={SVC_OPTS.preferred_time} onChange={v => set({
            preferred_time: v
          })} />
                        </Cell>
                        <Cell label={t("المواد متضمنة؟")}>
                            <PickerCell value={cf.materials_included} options={SVC_OPTS.materials_included} onChange={v => set({
            materials_included: v
          })} />
                        </Cell>
                    </View>
                </>}

            {/* DEV / DESIGN / BUSINESS */}
            {isDev && <>
                    <View style={s.row}>
                        <Cell label={t("نوع المشروع") + " *"}>
                            <PickerCell value={cf.project_type} options={SVC_OPTS.project_type} onChange={v => set({
            project_type: v
          })} />
                        </Cell>
                        <Cell label={t("مستوى الخبرة") + " *"}>
                            <PickerCell value={cf.experience_level} options={SVC_OPTS.experience_level} onChange={v => set({
            experience_level: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("مدة التسليم") + " *"}>
                            <PickerCell value={cf.delivery_time} options={SVC_OPTS.delivery_time} onChange={v => set({
            delivery_time: v
          })} />
                        </Cell>
                        <Cell label={t("التعديلات")}>
                            <PickerCell value={cf.revisions} options={SVC_OPTS.revisions} onChange={v => set({
            revisions: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("النطاق المالي")}>
                            <PickerCell value={cf.budget_range} options={SVC_OPTS.budget_range} onChange={v => set({
            budget_range: v
          })} />
                        </Cell>
                        <Cell label={t("وسيلة التواصل")}>
                            <PickerCell value={cf.communication_method} options={SVC_OPTS.communication_method} onChange={v => set({
            communication_method: v
          })} />
                        </Cell>
                    </View>
                </>}

            {/* EDUCATION */}
            {isEdu && <>
                    <View style={s.row}>
                        <Cell label={t("المادة") + " *"}>
                            <PickerCell value={cf.edu_subject} options={SVC_OPTS.edu_subject} onChange={v => set({
            edu_subject: v
          })} />
                        </Cell>
                        <Cell label={t("المستوى") + " *"}>
                            <PickerCell value={cf.edu_level} options={SVC_OPTS.edu_level} onChange={v => set({
            edu_level: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("مدة الجلسة") + " *"}>
                            <PickerCell value={cf.session_duration} options={SVC_OPTS.session_duration} onChange={v => set({
            session_duration: v
          })} />
                        </Cell>
                        <Cell label={t("عدد الجلسات")}>
                            <PickerCell value={cf.sessions_count} options={SVC_OPTS.sessions_count} onChange={v => set({
            sessions_count: v
          })} />
                        </Cell>
                    </View>
                    <View style={s.row}>
                        <Cell label={t("نمط التدريس") + " *"}>
                            <PickerCell value={cf.delivery_mode} options={SVC_OPTS.delivery_mode} onChange={v => set({
            delivery_mode: v
          })} />
                        </Cell>
                        <Cell label={t("الجدول الزمني")}>
                            <PickerCell value={cf.edu_schedule} options={SVC_OPTS.edu_schedule} onChange={v => set({
            edu_schedule: v
          })} />
                        </Cell>
                    </View>
                </>}

            {!sType && <Text style={s.emptyHint}>💡 {t("اختر «نوع الخدمة» أعلاه لتظهر الحقول التفصيلية الخاصة بها.")}</Text>}
        </View>;
}

/* =========================================================================
   Shared primitives
   ========================================================================= */
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
    borderRadius: 10,
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
  hintOk: {
    fontSize: 9,
    color: "#10b981",
    marginTop: 3
  },
  warn: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "700",
    marginTop: 2
  },
  emptyHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: "italic"
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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