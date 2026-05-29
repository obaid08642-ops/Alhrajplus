// Mobile cascading selectors for cars + phones. Shares backend endpoints with
// the web client so options stay in sync (single source of truth).
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import api from "../api";
import { useI18n } from "../I18nContext";
import { colors } from "../theme";
const CAR_OPTS = {
  mileage: ["أقل من 10,000 كم", "10,000 - 50,000 كم", "50,000 - 100,000 كم", "100,000 - 200,000 كم", "أكثر من 200,000 كم"],
  transmission: ["أوتوماتيك", "عادي (يدوي)"],
  fuel_type: ["بنزين", "ديزل", "هايبرد", "كهرباء"],
  condition: ["جديدة", "مستعملة", "ممتازة", "تحتاج إصلاحات"],
  listing_type: ["للبيع", "تحويل بنكي", "أقساط"],
  color: ["أبيض", "أسود", "فضي", "رمادي", "أزرق", "أحمر", "أخضر", "ذهبي", "بني", "أخرى"]
};
const PHONE_OPTS = {
  condition: ["جديد", "مستعمل", "كالجديد"],
  ram: ["4GB", "6GB", "8GB", "12GB", "16GB"],
  warranty: ["نعم", "لا", "منتهي"]
};
function Picker({
  value,
  options,
  placeholder,
  onChange,
  disabled
}) {
  const [open, setOpen] = useState(false);
  const valid = !disabled && (options || []).length > 0;
  return <>
            <TouchableOpacity disabled={!valid} onPress={() => setOpen(true)} style={[ps.input, !valid && {
      opacity: 0.5
    }]}>
                <Text style={value ? ps.txt : ps.ph}>{value || placeholder || "—"}</Text>
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={ps.backdrop}>
                    <View style={ps.sheet}>
                        <FlatList data={options || []} keyExtractor={(o, i) => `${o}-${i}`} renderItem={({
            item
          }) => <TouchableOpacity onPress={() => {
            onChange(item);
            setOpen(false);
          }} style={ps.item}>
                                    <Text style={[ps.itemTxt, item === value && {
              color: colors.primary,
              fontWeight: "800"
            }]}>{item}</Text>
                                </TouchableOpacity>} />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>;
}
export function CarCascadeMobile({
  value,
  onChange
}) {
  const { t } = useI18n();
  
  const v = value || {};
  const [brands, setBrands] = useState([]);
  const [years, setYears] = useState([]);
  const [models, setModels] = useState([]);
  const [trims, setTrims] = useState([]);
  useEffect(() => {
    api.get("/meta/car-brands").then(({
      data
    }) => {
      setBrands(data.brands || []);
      setYears(data.years || []);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!v.car_brand) {
      setModels([]);
      return;
    }
    api.get("/meta/car-models", {
      params: {
        brand: v.car_brand
      }
    }).then(({
      data
    }) => setModels(data.models || [])).catch(() => setModels([]));
  }, [v.car_brand]);
  useEffect(() => {
    if (!v.car_brand || !v.car_model) {
      setTrims([]);
      return;
    }
    api.get("/meta/car-trims", {
      params: {
        brand: v.car_brand,
        model: v.car_model
      }
    }).then(({
      data
    }) => setTrims(data.trims || [])).catch(() => setTrims([]));
  }, [v.car_brand, v.car_model]);
  const set = patch => onChange({
    ...v,
    ...patch
  });
  return <View style={s.wrap}>
            <Text style={s.title}>🚗 {t("تفاصيل السيارة")}</Text>
            <View style={s.row}>
                <Lab text={t("الماركة")}><Picker value={v.car_brand || ""} options={brands} placeholder="—" onChange={b => set({
          car_brand: b,
          car_model: "",
          car_trim: ""
        })} /></Lab>
                <Lab text={t("الموديل")}><Picker value={v.car_model || ""} options={models} placeholder="—" disabled={!v.car_brand} onChange={m => set({
          car_model: m,
          car_trim: ""
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("السنة")}><Picker value={v.car_year || ""} options={years} placeholder="—" onChange={y => set({
          car_year: y
        })} /></Lab>
                <Lab text={t("الفئة")}><Picker value={v.car_trim || ""} options={trims} placeholder="—" disabled={!v.car_model} onChange={tx => set({
          car_trim: tx
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("الممشى (كم)")}><Picker value={v.mileage || ""} options={CAR_OPTS.mileage} placeholder="—" onChange={x => set({
          mileage: x
        })} /></Lab>
                <Lab text={t("ناقل الحركة")}><Picker value={v.transmission || ""} options={CAR_OPTS.transmission} placeholder="—" onChange={x => set({
          transmission: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("نوع الوقود")}><Picker value={v.fuel_type || ""} options={CAR_OPTS.fuel_type} placeholder="—" onChange={x => set({
          fuel_type: x
        })} /></Lab>
                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={CAR_OPTS.condition} placeholder="—" onChange={x => set({
          condition: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("نوع الإعلان")}><Picker value={v.listing_type || ""} options={CAR_OPTS.listing_type} placeholder="—" onChange={x => set({
          listing_type: x
        })} /></Lab>
                <Lab text={t("اللون")}><Picker value={v.color || ""} options={CAR_OPTS.color} placeholder="—" onChange={x => set({
          color: x
        })} /></Lab>
            </View>
        </View>;
}
export function PhoneCascadeMobile({
  value,
  onChange
}) {
  const { t } = useI18n();
  
  const v = value || {};
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [storages, setStorages] = useState([]);
  const [palette, setPalette] = useState([]);
  useEffect(() => {
    api.get("/meta/phone-brands").then(({
      data
    }) => setBrands(data.brands || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (!v.phone_brand) {
      setModels([]);
      return;
    }
    api.get("/meta/phone-models", {
      params: {
        brand: v.phone_brand
      }
    }).then(({
      data
    }) => setModels(data.models || [])).catch(() => setModels([]));
  }, [v.phone_brand]);
  useEffect(() => {
    if (!v.phone_brand || !v.phone_model) {
      setStorages([]);
      setPalette([]);
      return;
    }
    api.get("/meta/phone-variants", {
      params: {
        brand: v.phone_brand,
        model: v.phone_model
      }
    }).then(({
      data
    }) => {
      setStorages(data.storage || []);
      setPalette(data.color || []);
    }).catch(() => {
      setStorages([]);
      setPalette([]);
    });
  }, [v.phone_brand, v.phone_model]);
  const set = patch => onChange({
    ...v,
    ...patch
  });
  return <View style={s.wrap}>
            <Text style={s.title}>📱 {t("تفاصيل الجوال")}</Text>
            <View style={s.row}>
                <Lab text={t("الماركة")}><Picker value={v.phone_brand || ""} options={brands} placeholder="—" onChange={b => set({
          phone_brand: b,
          phone_model: "",
          phone_storage: "",
          phone_color: ""
        })} /></Lab>
                <Lab text={t("الموديل")}><Picker value={v.phone_model || ""} options={models} placeholder="—" disabled={!v.phone_brand} onChange={m => set({
          phone_model: m,
          phone_storage: "",
          phone_color: ""
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("السعة")}><Picker value={v.phone_storage || ""} options={storages} placeholder="—" disabled={!v.phone_model} onChange={x => set({
          phone_storage: x
        })} /></Lab>
                <Lab text={t("اللون")}><Picker value={v.phone_color || ""} options={palette} placeholder="—" disabled={!v.phone_model} onChange={x => set({
          phone_color: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={PHONE_OPTS.condition} placeholder="—" onChange={x => set({
          condition: x
        })} /></Lab>
                <Lab text={t("الذاكرة (RAM)")}><Picker value={v.ram || ""} options={PHONE_OPTS.ram} placeholder="—" onChange={x => set({
          ram: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("الضمان")}><Picker value={v.warranty || ""} options={PHONE_OPTS.warranty} placeholder="—" onChange={x => set({
          warranty: x
        })} /></Lab>
                <View style={{
        flex: 1
      }} />
            </View>
        </View>;
}
const FURNITURE_OPTS = {
  type: ["كنب / مجلس", "سرير", "خزانة / دولاب", "طاولة طعام", "طاولة قهوة", "كراسي", "مكتب", "ركن", "تحفة / ديكور", "سجاد", "ستائر", "غرفة نوم كاملة", "آخر"],
  condition: ["جديد بالكرتون", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "يحتاج ترميم"],
  material: ["خشب طبيعي", "خشب MDF", "معدن", "قماش", "جلد طبيعي", "جلد صناعي", "بلاستيك", "زجاج", "روطان", "آخر"],
  color: ["أبيض", "أسود", "بني", "رمادي", "بيج", "أزرق", "أحمر", "أخضر", "ذهبي", "فضي", "آخر"],
  usage_duration: ["جديد - لم يستخدم", "أقل من 6 أشهر", "6 شهور - سنة", "1-3 سنوات", "3-5 سنوات", "أكثر من 5 سنوات"],
  size: ["صغير", "متوسط", "كبير", "ضخم", "مفرد", "مزدوج", "كينج", "كوين"],
  location: ["مجلس", "صالة", "غرفة نوم", "غرفة أطفال", "مطبخ", "مكتب", "خارجي / حديقة", "مدخل", "آخر"],
  brand: ["IKEA", "Home Centre", "ساكو (SACO)", "Pan Home", "Homes r Us", "محلي", "مستورد", "صناعة يدوية", "آخر"]
};
const APPLIANCE_OPTS = {
  appliance_type: ["ثلاجة", "غسالة ملابس", "نشافة", "غسالة صحون", "فرن كهربائي", "فرن غاز", "ميكروويف", "مكيف سبليت", "مكيف شباك", "فريزر", "خلاط", "محضرة طعام", "مكنسة كهربائية", "سخان مياه", "مروحة", "تلفزيون", "آخر"],
  brand: ["LG", "Samsung", "Daewoo", "Toshiba", "Panasonic", "Hitachi", "Sharp", "Sony", "Whirlpool", "Bosch", "Siemens", "Hoover", "Westpoint", "GE", "Midea", "Haier", "آخر"],
  condition: ["جديد بالكرتون", "كالجديد", "مستعمل ممتاز", "مستعمل جيد", "يحتاج صيانة"],
  warranty: ["ضمان وكيل", "ضمان محل", "ضمان منتهٍ", "بدون ضمان"],
  power: ["موفر للطاقة (Inverter)", "عادي", "موفر للطاقة", "غير محدد"],
  usage: ["منزلي", "تجاري / مطعم", "مكتبي", "صناعي"],
  voltage: ["110V", "220V", "110V/220V", "غير محدد"],
  origin: ["كوريا الجنوبية", "اليابان", "ألمانيا", "الصين", "تركيا", "إيطاليا", "أمريكا", "السعودية", "الإمارات", "تايلاند", "آخر"]
};
export function FurnitureCascadeMobile({
  value,
  onChange
}) {
  const { t } = useI18n();
  
  const v = value || {};
  const set = patch => onChange({
    ...v,
    ...patch
  });
  return <View style={s.wrap}>
            <Text style={s.title}>🛋️ {t("تفاصيل الأثاث")}</Text>
            <View style={s.row}>
                <Lab text={t("نوع الأثاث")}><Picker value={v.furniture_type || ""} options={FURNITURE_OPTS.type} placeholder="—" onChange={x => set({
          furniture_type: x
        })} /></Lab>
                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={FURNITURE_OPTS.condition} placeholder="—" onChange={x => set({
          condition: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("الخامة")}><Picker value={v.material || ""} options={FURNITURE_OPTS.material} placeholder="—" onChange={x => set({
          material: x
        })} /></Lab>
                <Lab text={t("اللون")}><Picker value={v.color || ""} options={FURNITURE_OPTS.color} placeholder="—" onChange={x => set({
          color: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("مدة الاستخدام")}><Picker value={v.usage_duration || ""} options={FURNITURE_OPTS.usage_duration} placeholder="—" onChange={x => set({
          usage_duration: x
        })} /></Lab>
                <Lab text={t("الماركة / المصدر")}><Picker value={v.brand || ""} options={FURNITURE_OPTS.brand} placeholder="—" onChange={x => set({
          brand: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("المقاس")}><Picker value={v.size || ""} options={FURNITURE_OPTS.size} placeholder="—" onChange={x => set({
          size: x
        })} /></Lab>
                <Lab text={t("مكان الاستخدام")}><Picker value={v.location || ""} options={FURNITURE_OPTS.location} placeholder="—" onChange={x => set({
          location: x
        })} /></Lab>
            </View>
        </View>;
}
export function HomeAppliancesCascadeMobile({
  value,
  onChange
}) {
  const { t } = useI18n();
  
  const v = value || {};
  const set = patch => onChange({
    ...v,
    ...patch
  });
  return <View style={s.wrap}>
            <Text style={s.title}>⚡ {t("تفاصيل الجهاز")}</Text>
            <View style={s.row}>
                <Lab text={t("نوع الجهاز")}><Picker value={v.appliance_type || ""} options={APPLIANCE_OPTS.appliance_type} placeholder="—" onChange={x => set({
          appliance_type: x
        })} /></Lab>
                <Lab text={t("الماركة")}><Picker value={v.brand || ""} options={APPLIANCE_OPTS.brand} placeholder="—" onChange={x => set({
          brand: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={APPLIANCE_OPTS.condition} placeholder="—" onChange={x => set({
          condition: x
        })} /></Lab>
                <Lab text={t("الضمان")}><Picker value={v.warranty || ""} options={APPLIANCE_OPTS.warranty} placeholder="—" onChange={x => set({
          warranty: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("استهلاك الطاقة")}><Picker value={v.power || ""} options={APPLIANCE_OPTS.power} placeholder="—" onChange={x => set({
          power: x
        })} /></Lab>
                <Lab text={t("نوع الاستخدام")}><Picker value={v.usage || ""} options={APPLIANCE_OPTS.usage} placeholder="—" onChange={x => set({
          usage: x
        })} /></Lab>
            </View>
            <View style={s.row}>
                <Lab text={t("الفولت / الجهد")}><Picker value={v.voltage || ""} options={APPLIANCE_OPTS.voltage} placeholder="—" onChange={x => set({
          voltage: x
        })} /></Lab>
                <Lab text={t("بلد المنشأ")}><Picker value={v.origin || ""} options={APPLIANCE_OPTS.origin} placeholder="—" onChange={x => set({
          origin: x
        })} /></Lab>
            </View>
        </View>;
}
function Lab({
  text,
  children
}) {
  return <View style={{
    flex: 1
  }}>
            <Text style={s.label}>{text}</Text>
            {children}
        </View>;
}
const s = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: "700"
  }
});
const ps = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10
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