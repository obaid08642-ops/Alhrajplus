// PostScreen — full rebuild matching web /app/frontend/src/pages/PostListing.js
// Supports: category picker, dynamic category fields, city+district pickers,
// multi-image upload, AI autofill, location pin, edit mode.
import { useEffect, useMemo, useState, useRef } from "react";
import {
    View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
    Image, Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, Camera, ImageIcon, MapPin, X, Check, ChevronLeft, Search, Shapes } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as LucideIcons from "lucide-react-native";
import api, { formatApiError } from "../api";
import { useI18n } from "../I18nContext";
import { useCountry } from "../CountryContext";
import { useAuth } from "../AuthContext";
import { colors, radius, shadow } from "../theme";

export default function PostScreen({ navigation, route }) {
    const { lang, t } = useI18n();
    const { current: country } = useCountry();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const editId = route.params?.editId;

    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState([]);
    const [busy, setBusy] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const [aiBusy, setAiBusy] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(null); // 'city' | 'district' | null
    const [err, setErr] = useState("");

    const [form, setForm] = useState({
        category: "", subcategory: "", title: "", description: "", price: "",
        currency: country?.currency_code || "SAR",
        custom_fields: {}, images: [], videos: [],
        city: "", district: "", lat: null, lng: null, show_phone: true,
    });

    useEffect(() => {
        api.get("/meta/categories", { params: { lang } }).then(({ data }) => setCategories(data || []));
    }, [lang]);

    useEffect(() => {
        if (!editId) return;
        api.get(`/listings/${editId}`).then(({ data }) => {
            setForm((f) => ({ ...f, ...data, price: data.price?.toString() || "" }));
            setStep(2);
        });
    }, [editId]);

    if (!user) {
        return (
            <View style={s.guestWrap}>
                <Text style={s.guestTitle}>{t("سجّل دخولك للنشر")}</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={s.guestBtn}>
                    <Text style={s.guestBtnText}>{t("تسجيل الدخول")}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const cat = useMemo(() => categories.find((c) => c.key === form.category), [categories, form.category]);
    const cityObj = useMemo(() => country?.cities?.find((c) => c.name_ar === form.city), [country, form.city]);
    const districts = cityObj?.districts || [];

    const aiAutofill = async () => {
        try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) { Alert.alert(t("إذن"), t("نحتاج صلاحية الصور")); return; }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, base64: true });
            if (result.canceled || !result.assets?.[0]?.base64) return;
            setAiBusy(true);
            const { data } = await api.post("/ai/listing-autofill", { image_base64: result.assets[0].base64 });
            setForm((f) => ({
                ...f, title: data.title || f.title, description: data.description || f.description,
                category: data.category_key || f.category,
                price: data.suggested_price_range?.mid ? String(data.suggested_price_range.mid) : f.price,
            }));
            setStep(2);
            Alert.alert("✨", t("تم التعبئة بنجاح"));
        } catch (e) {
            Alert.alert(t("خطأ"), formatApiError(e.response?.data?.detail) || t("تعذر التعبئة"));
        } finally { setAiBusy(false); }
    };

    const uploadAssets = async (assets) => {
        setUploadingImg(true);
        try {
            const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "image", folder: "listings" } });
            const urls = [];
            for (const a of assets) {
                const fd = new FormData();
                fd.append("file", { uri: a.uri, type: "image/jpeg", name: `img_${Date.now()}.jpg` });
                fd.append("api_key", sig.api_key);
                fd.append("timestamp", String(sig.timestamp));
                fd.append("signature", sig.signature);
                fd.append("folder", sig.folder);
                const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: "POST", body: fd });
                const out = await res.json();
                if (out.secure_url) urls.push(out.secure_url);
            }
            setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
        } catch (_) { Alert.alert(t("خطأ"), t("فشل رفع الصورة")); }
        finally { setUploadingImg(false); }
    };

    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert(t("إذن"), t("نحتاج صلاحية الصور")); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsMultipleSelection: true });
        if (!result.canceled) await uploadAssets(result.assets);
    };

    const takePhoto = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert(t("إذن"), t("نحتاج صلاحية الكاميرا")); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) await uploadAssets(result.assets);
    };

    const useMyLocation = async () => {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) { Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع")); return; }
        const loc = await Location.getCurrentPositionAsync({});
        setForm((f) => ({ ...f, lat: loc.coords.latitude, lng: loc.coords.longitude }));
        Alert.alert("✅", t("تم تحديد موقعك"));
    };

    const validateRequiredFields = () => {
        if (!form.title || !form.description) return t("الرجاء إكمال العنوان والوصف");
        if (!form.city) return t("الرجاء اختيار المدينة");
        for (const f of (cat?.fields || [])) {
            if (f.required && !form.custom_fields[f.key]) return `${t("حقل مطلوب:")} ${f.label_ar || f.key}`;
        }
        return null;
    };

    const submit = async () => {
        setErr("");
        const v = validateRequiredFields();
        if (v) { setErr(v); return; }
        setBusy(true);
        try {
            const payload = { ...form, price: form.price ? parseFloat(form.price) : null, country_code: country?.code };
            if (editId) {
                const { data } = await api.put(`/listings/${editId}`, payload);
                navigation.replace("ListingDetail", { id: data.id });
            } else {
                const { data } = await api.post("/listings", payload);
                navigation.replace("ListingDetail", { id: data.id });
            }
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || t("تعذر النشر"));
        } finally { setBusy(false); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 6 }]}>
                <TouchableOpacity onPress={() => (step === 1 ? navigation.goBack() : setStep(1))} style={s.headBtn} hitSlop={8}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.headTitle}>{editId ? t("تعديل الإعلان") : (step === 1 ? t("اختر التصنيف") : t("تفاصيل الإعلان"))}</Text>
                <View style={s.stepDots}>
                    <View style={[s.stepDot, s.stepDotActive]} />
                    <View style={[s.stepDot, step === 2 && s.stepDotActive]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
                {step === 1 ? (
                    <Step1 onAI={aiAutofill} aiBusy={aiBusy} categories={categories} onPick={(key) => {
                        if (key === "__story__") {
                            // Story mode = same form but enforces video upload + brief
                            setForm({ ...form, category: form.category || "general", subcategory: "story", custom_fields: { is_story: true } });
                            setStep(2);
                        } else if (key === "auction") {
                            setForm({ ...form, custom_fields: { ...form.custom_fields, is_auction: true } });
                            setStep(2);
                        } else {
                            setForm({ ...form, category: key, subcategory: "", custom_fields: {} });
                            setStep(2);
                        }
                    }} />
                ) : (
                    <Step2
                        form={form} setForm={setForm} cat={cat}
                        categories={categories}
                        onPickerOpen={setPickerOpen} country={country}
                        onPickImage={pickImage} onTakePhoto={takePhoto}
                        uploadingImg={uploadingImg}
                        onUseLocation={useMyLocation}
                    />
                )}
            </ScrollView>

            {/* Bottom CTA */}
            {step === 2 && (
                <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    {err ? <Text style={s.errText}>{err}</Text> : null}
                    <TouchableOpacity onPress={submit} disabled={busy} style={[s.submitBtn, busy && { opacity: 0.5 }]}>
                        <LinearGradient colors={[colors.primary, "#2A8CBD"]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                        {busy ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Check size={18} color="#fff" />
                                <Text style={s.submitText}>{editId ? t("حفظ التعديلات") : t("نشر الإعلان")}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* City picker — supports static list + live geo search */}
            <GeoPickerModal
                visible={pickerOpen === "city"} onClose={() => setPickerOpen(null)}
                title={t("اختر المدينة")} country={country?.code} lang={lang}
                staticItems={(country?.cities || []).map((c) => ({ name: c.name_ar }))}
                kind="city"
                current={form.city}
                onPick={(name) => { setForm({ ...form, city: name, district: "" }); setPickerOpen(null); }}
            />
            {/* District picker — Nominatim/Overpass-powered (covers every neighborhood) */}
            <GeoPickerModal
                visible={pickerOpen === "district"} onClose={() => setPickerOpen(null)}
                title={t("اختر الحي")} country={country?.code} lang={lang}
                staticItems={(districts || []).map((d) => ({ name: d }))}
                kind="district" parent={form.city}
                current={form.district}
                onPick={(name) => { setForm({ ...form, district: name }); setPickerOpen(null); }}
            />
        </KeyboardAvoidingView>
    );
}

// =============== Geo Picker Modal (uses /api/geo/search or /api/geo/districts) ===============
function GeoPickerModal({ visible, onClose, title, staticItems, kind, parent, country, lang, current, onPick }) {
    const [q, setQ] = useState("");
    const [remote, setRemote] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!visible) { setQ(""); setRemote([]); return; }
        // Auto-load full list on open (cities OR districts) so user can scroll without searching
        setLoading(true);
        if (kind === "district" && parent) {
            api.get("/geo/districts", { params: { city: parent, country, lang, limit: 100 } })
                .then(({ data }) => setRemote(data || []))
                .catch(() => setRemote([]))
                .finally(() => setLoading(false));
        } else if (kind === "city" && country) {
            // Pre-load ALL cities of the selected country (no search needed)
            api.get("/geo/cities", { params: { country, lang, limit: 100 } })
                .then(({ data }) => setRemote(data || []))
                .catch(() => setRemote([]))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, kind, parent, country, lang]);

    useEffect(() => {
        if (!visible || q.length < 2) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const params = kind === "district"
                    ? { q, country, type: "district", lang, limit: 30 }
                    : { q, country, type: "city", lang, limit: 30 };
                const { data } = await api.get("/geo/search", { params });
                setRemote(data || []);
            } catch (_) { setRemote([]); }
            finally { setLoading(false); }
        }, 350);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [q, visible, kind, country, lang]);

    // For cities: static list comes from country.cities (already country-filtered).
    // For districts: static list is from selected city only.
    // Merge: static first then remote, dedupe by name.
    const items = useMemo(() => {
        const localFiltered = q
            ? staticItems.filter((it) => (it.name || "").includes(q))
            : staticItems;
        const seen = new Set(localFiltered.map((x) => x.name));
        const merged = [...localFiltered];
        for (const r of remote) {
            if (!seen.has(r.name)) {
                merged.push({ name: r.name, parent: r.parent, fromGeo: true });
                seen.add(r.name);
            }
        }
        return merged;
    }, [staticItems, remote, q]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.modalBg}>
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>{title}</Text>
                    <View style={s.searchPill}>
                        <Search size={14} color={colors.textMuted} />
                        <TextInput value={q} onChangeText={setQ} placeholder={kind === "city" ? "ابحث أو اختر من القائمة..." : "ابحث أو اختر الحي..."} placeholderTextColor={colors.textMuted} style={s.searchInput} />
                        {loading && <ActivityIndicator size="small" color={colors.primary} />}
                    </View>
                    {items.length === 0 && !loading && (
                        <Text style={{ padding: 30, textAlign: "center", color: colors.textMuted, fontSize: 12 }}>
                            {q ? "لا نتائج" : (kind === "district" ? "اختر مدينة أولاً" : "اكتب اسم المدينة")}
                        </Text>
                    )}
                    <FlatList
                        data={items}
                        keyExtractor={(it, i) => `${it.name}-${i}`}
                        renderItem={({ item }) => {
                            const isCur = item.name === current;
                            return (
                                <TouchableOpacity onPress={() => onPick(item.name)} style={[s.modalRow, isCur && s.modalRowActive]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.modalRowText, isCur && { color: colors.primary, fontWeight: "900" }]}>{item.name}</Text>
                                        {item.parent && <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{item.parent}</Text>}
                                    </View>
                                    {item.fromGeo && <Text style={{ fontSize: 9, color: colors.primary, fontWeight: "800" }}>🌍</Text>}
                                    {isCur && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        }}
                        style={{ maxHeight: 420 }}
                    />
                    <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
                        <Text style={s.modalCloseText}>إلغاء</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// =============== STEP 1: Entry Cards (6 cards, mirrors web premium flow) ===============
function Step1({ categories, onPick, onAI, aiBusy }) {
    const { t } = useI18n();
    const nav = require("@react-navigation/native").useNavigation();

    const isAdsCat = (k) => !["jobs", "services"].includes(k);
    const jobsCat = categories.find((c) => c.key === "jobs");
    const servicesCat = categories.find((c) => c.key === "services");

    return (
        <>
            {/* Hero AI Autofill */}
            <TouchableOpacity onPress={onAI} disabled={aiBusy} style={[s.aiCta, shadow.card]}>
                <LinearGradient colors={[colors.primary, "#7CCAEC", colors.accent]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={s.aiIcon}><Sparkles size={20} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                    <Text style={s.aiTitle}>{t("بيع بالذكاء الاصطناعي")}</Text>
                    <Text style={s.aiSub}>{t("التقط صورة وسيُكمل الذكاء الاصطناعي العنوان والوصف والسعر")}</Text>
                </View>
                {aiBusy && <ActivityIndicator color="#fff" />}
            </TouchableOpacity>

            {/* 6 entry cards in 2x3 grid */}
            <View style={s.entryGrid}>
                <EntryCard
                    icon="📦" label={t("إضافة إعلان")} sub={t("كل الفئات")}
                    bg={["#DBEAFE", "#EFF6FF"]} accent={colors.primary}
                    onPress={() => onPick("")}
                />
                <EntryCard
                    icon="🔨" label={t("رفع مزاد")} sub={t("ابدأ مزايدة حية")}
                    bg={["#FEF3C7", "#FEF9C3"]} accent="#F59E0B"
                    onPress={() => onPick("auction")}
                />
                {servicesCat && (
                    <EntryCard
                        icon="🛠️" label={servicesCat.name || t("خدمات")} sub={t("اعرض خدمتك")}
                        bg={["#D1FAE5", "#ECFDF5"]} accent="#10B981"
                        onPress={() => onPick("services")}
                    />
                )}
                {jobsCat && (
                    <EntryCard
                        icon="💼" label={jobsCat.name || t("وظائف")} sub={t("ابحث أو وظّف")}
                        bg={["#EDE9FE", "#F5F3FF"]} accent="#8B5CF6"
                        onPress={() => onPick("jobs")}
                    />
                )}
                <EntryCard
                    icon="🎬" label={t("نشر ستوري")} sub={t("فيديو قصير")}
                    bg={["#FCE7F3", "#FDF2F8"]} accent="#EC4899"
                    onPress={() => onPick("__story__")}
                />
                <EntryCard
                    icon="🏷️" label={t("صفقات اليوم")} sub={t("سعر مميز")}
                    bg={["#FEE2E2", "#FEF2F2"]} accent="#EF4444"
                    onPress={() => { nav.navigate("Deals"); }}
                />
            </View>
        </>
    );
}

function EntryCard({ icon, label, sub, bg, accent, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={s.entryCard} activeOpacity={0.85}>
            <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={{ fontSize: 28 }}>{icon}</Text>
            <Text style={[s.entryLabel, { color: accent }]} numberOfLines={1}>{label}</Text>
            <Text style={s.entrySub} numberOfLines={1}>{sub}</Text>
        </TouchableOpacity>
    );
}

// =============== STEP 2: Details Form ===============
function Step2({ form, setForm, cat, categories, onPickerOpen, country, onPickImage, onTakePhoto, uploadingImg, onUseLocation }) {
    const { t } = useI18n();
    const [catPickerOpen, setCatPickerOpen] = useState(false);
    const update = (k, v) => setForm({ ...form, [k]: v });
    const updateCF = (k, v) => setForm({ ...form, custom_fields: { ...form.custom_fields, [k]: v } });

    // Auto-suggest category from title using simple keyword match
    useEffect(() => {
        if (form.category || !form.title || form.title.length < 4) return;
        const title = form.title.toLowerCase();
        const KEYWORDS = {
            cars: ["سيارة", "سياره", "كامري", "كرولا", "هوندا", "تويوتا", "نيسان", "بي ام", "مرسيدس", "car"],
            real_estate: ["شقة", "فيلا", "أرض", "ارض", "بيت", "عمارة", "محل", "مكتب", "إيجار", "تمليك"],
            electronics: ["موبايل", "جوال", "ايفون", "آيفون", "سامسونج", "لاب توب", "تلفزيون", "كمبيوتر", "iphone", "samsung"],
            furniture: ["كنبة", "كرسي", "طاولة", "غرفة نوم", "سرير", "ديكور"],
            fashion: ["ثوب", "عباية", "حذاء", "ملابس", "حقيبة"],
            jobs: ["وظيفة", "موظف", "موظفة", "مطلوب", "للعمل"],
            services: ["خدمة", "تركيب", "صيانة", "نقل", "تنظيف"],
        };
        for (const [k, words] of Object.entries(KEYWORDS)) {
            if (words.some((w) => title.includes(w))) {
                if (categories.find((c) => c.key === k)) {
                    setForm({ ...form, category: k });
                    break;
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.title]);

    return (
        <>
            {/* Story mode banner */}
            {form.subcategory === "story" && (
                <View style={s.storyBanner}>
                    <Text style={s.storyBannerIcon}>🎬</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={s.storyBannerText}>{t("وضع الستوري — فيديو قصير فقط")}</Text>
                        <Text style={s.storyBannerSub}>{t("ارفع فيديو قصير + عنوان + سعر + مدينة. لا حاجة لتفاصيل كثيرة.")}</Text>
                    </View>
                </View>
            )}
            {/* Auction mode banner */}
            {form.custom_fields?.is_auction && (
                <View style={[s.storyBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
                    <Text style={s.storyBannerIcon}>🔨</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={s.storyBannerText}>{t("وضع المزاد")}</Text>
                        <Text style={s.storyBannerSub}>{t("السعر الذي ستضعه = السعر الابتدائي للمزايدة")}</Text>
                    </View>
                </View>
            )}

            {/* Category selector */}
            <Field label={t("التصنيف") + " *"}>
                <TouchableOpacity onPress={() => setCatPickerOpen(true)} style={s.input}>
                    <Text style={form.category ? s.inputText : s.inputPh}>
                        {cat ? (cat.name || cat.name_ar) : t("اختر التصنيف")}
                    </Text>
                </TouchableOpacity>
                {!form.category && form.title && form.title.length >= 4 && (
                    <Text style={{ fontSize: 10.5, color: colors.primary, marginTop: 4 }}>
                        ✨ {t("اكتب العنوان واختر تصنيفاً مقترحاً تلقائياً")}
                    </Text>
                )}
            </Field>
            <Modal visible={catPickerOpen} transparent animationType="slide" onRequestClose={() => setCatPickerOpen(false)}>
                <View style={s.modalBg}>
                    <View style={s.modalSheet}>
                        <Text style={s.modalTitle}>{t("اختر التصنيف")}</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(c) => c.key}
                            style={{ maxHeight: 480 }}
                            renderItem={({ item }) => {
                                const Icon = LucideIcons[item.icon] || Shapes;
                                const isCur = item.key === form.category;
                                return (
                                    <TouchableOpacity onPress={() => { setForm({ ...form, category: item.key, subcategory: form.subcategory === "story" ? "story" : "", custom_fields: form.custom_fields?.is_story ? { is_story: true } : form.custom_fields?.is_auction ? { is_auction: true } : {} }); setCatPickerOpen(false); }} style={[s.modalRow, isCur && s.modalRowActive]}>
                                        <Icon size={22} color={colors.primary} />
                                        <Text style={[s.modalRowText, { flex: 1, marginStart: 10 }, isCur && { color: colors.primary, fontWeight: "900" }]}>{item.name || item.name_ar}</Text>
                                        {isCur && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <TouchableOpacity onPress={() => setCatPickerOpen(false)} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>إلغاء</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Field label={t("العنوان") + " *"}>
                <TextInput value={form.title} onChangeText={(v) => update("title", v)} placeholder={t("مثال: تويوتا كامري 2020 ممتازة")} placeholderTextColor={colors.textMuted} style={s.input} />
            </Field>
            <Field label={t("الوصف") + " *"}>
                <TextInput value={form.description} onChangeText={(v) => update("description", v)} placeholder={t("اوصف منتجك بالتفصيل...")} placeholderTextColor={colors.textMuted} style={[s.input, { height: 110, textAlignVertical: "top" }]} multiline />
            </Field>
            <Field label={t("السعر") + ` (${form.currency})`}>
                <View style={s.priceWrap}>
                    <TextInput value={form.price} onChangeText={(v) => update("price", v.replace(/[^0-9.]/g, ""))} placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={[s.input, { flex: 1, paddingEnd: 50 }]} keyboardType="numeric" />
                    <Text style={s.currencyBadge}>{form.currency}</Text>
                </View>
            </Field>

            {/* Dynamic category fields */}
            {(cat?.fields || []).filter((f) => f.key !== "post_type" || (form.category !== "jobs" && form.category !== "services")).map((f) => (
                <Field key={f.key} label={`${f.label_ar || f.label_en || f.key}${f.required ? " *" : ""}`}>
                    {f.type === "select" ? (
                        <SelectInput
                            value={form.custom_fields[f.key] || ""}
                            options={(f.options_ar || f.options || []).map((opt, i) => ({ value: (f.options_ar?.[i] || opt), label: opt }))}
                            placeholder={t("اختر...")}
                            onChange={(v) => updateCF(f.key, v)}
                        />
                    ) : f.type === "number" ? (
                        <TextInput value={String(form.custom_fields[f.key] || "")} onChangeText={(v) => updateCF(f.key, v)} keyboardType="numeric" placeholder={f.placeholder || ""} placeholderTextColor={colors.textMuted} style={s.input} />
                    ) : (
                        <TextInput value={form.custom_fields[f.key] || ""} onChangeText={(v) => updateCF(f.key, v)} placeholder={f.placeholder || ""} placeholderTextColor={colors.textMuted} style={s.input} />
                    )}
                </Field>
            ))}

            {/* City / District (geo autocomplete + fallback to local list) */}
            <Field label={t("المدينة") + " *"}>
                <TouchableOpacity onPress={() => onPickerOpen("city")} style={s.input}>
                    <Text style={form.city ? s.inputText : s.inputPh}>{form.city || t("اختر المدينة")}</Text>
                </TouchableOpacity>
            </Field>
            {form.city && (
                <Field label={t("الحي / المنطقة")}>
                    <TouchableOpacity onPress={() => onPickerOpen("district")} style={s.input}>
                        <Text style={form.district ? s.inputText : s.inputPh}>{form.district || t("اختر الحي (اختياري)")}</Text>
                    </TouchableOpacity>
                </Field>
            )}

            {/* Images */}
            <Field label={t("الصور")}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity onPress={onTakePhoto} style={s.imgBtn}>
                        <Camera size={22} color={colors.primary} />
                        <Text style={s.imgBtnText}>{t("التقط")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onPickImage} style={s.imgBtn}>
                        <ImageIcon size={22} color={colors.primary} />
                        <Text style={s.imgBtnText}>{t("من المعرض")}</Text>
                    </TouchableOpacity>
                </View>
                {uploadingImg && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
                {form.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                        {form.images.map((url, i) => (
                            <View key={i} style={s.thumbWrap}>
                                <Image source={{ uri: url }} style={s.thumb} />
                                <TouchableOpacity onPress={() => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }))} style={s.thumbX}>
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                                {i === 0 && <View style={s.mainImgTag}><Text style={s.mainImgText}>{t("رئيسية")}</Text></View>}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </Field>

            {/* Location pin */}
            <TouchableOpacity onPress={onUseLocation} style={[s.locBtn, form.lat && s.locBtnActive]}>
                <MapPin size={18} color={form.lat ? "#10B981" : colors.primary} />
                <Text style={[s.locBtnText, form.lat && { color: "#10B981" }]}>
                    {form.lat ? t("📍 تم تحديد الموقع") : t("استخدم موقعي الحالي")}
                </Text>
            </TouchableOpacity>

            {/* Show phone toggle */}
            <TouchableOpacity onPress={() => update("show_phone", !form.show_phone)} style={s.toggle}>
                <View style={[s.toggleBox, form.show_phone && s.toggleBoxActive]}>{form.show_phone && <Check size={14} color="#fff" />}</View>
                <Text style={s.toggleText}>{t("عرض رقم جوالي للمشترين")}</Text>
            </TouchableOpacity>
        </>
    );
}

// =============== Reusable Field wrapper ===============
function Field({ label, children }) {
    return (
        <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

// =============== Select Input (modal-based) ===============
function SelectInput({ value, options, placeholder, onChange }) {
    const [open, setOpen] = useState(false);
    const sel = options.find((o) => o.value === value);
    return (
        <>
            <TouchableOpacity onPress={() => setOpen(true)} style={s.input}>
                <Text style={value ? s.inputText : s.inputPh}>{sel?.label || placeholder}</Text>
            </TouchableOpacity>
            <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
                <View style={s.modalBg}>
                    <View style={s.modalSheet}>
                        <Text style={s.modalTitle}>{placeholder}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(o, i) => `${o.value}-${i}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => { onChange(item.value); setOpen(false); }} style={[s.modalRow, item.value === value && s.modalRowActive]}>
                                    <Text style={[s.modalRowText, item.value === value && { color: colors.primary, fontWeight: "900" }]}>{item.label}</Text>
                                    {item.value === value && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                            )}
                            style={{ maxHeight: "70%" }}
                        />
                        <TouchableOpacity onPress={() => setOpen(false)} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>{value ? "إغلاق" : "إلغاء"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

// =============== Generic Picker Modal ===============
function PickerModal({ visible, onClose, title, items, getLabel, onPick, current }) {
    const [q, setQ] = useState("");
    const filtered = q ? items.filter((it) => getLabel(it).includes(q)) : items;
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.modalBg}>
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>{title}</Text>
                    <View style={s.searchPill}>
                        <Search size={14} color={colors.textMuted} />
                        <TextInput value={q} onChangeText={setQ} placeholder="ابحث..." placeholderTextColor={colors.textMuted} style={s.searchInput} />
                    </View>
                    <FlatList
                        data={filtered}
                        keyExtractor={(_, i) => String(i)}
                        renderItem={({ item }) => {
                            const lbl = getLabel(item);
                            const isCur = (item.name_ar || lbl) === current;
                            return (
                                <TouchableOpacity onPress={() => onPick(item)} style={[s.modalRow, isCur && s.modalRowActive]}>
                                    <Text style={[s.modalRowText, isCur && { color: colors.primary, fontWeight: "900" }]}>{lbl}</Text>
                                    {isCur && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        }}
                        style={{ maxHeight: 400 }}
                    />
                    <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
                        <Text style={s.modalCloseText}>إلغاء</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    guestWrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 14 },
    guestTitle: { fontSize: 16, color: colors.textMuted },
    guestBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
    guestBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
    // Header
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, gap: 8 },
    headBtn: { padding: 6 },
    headTitle: { flex: 1, fontSize: 15, fontWeight: "900", color: colors.text },
    stepDots: { flexDirection: "row", gap: 4 },
    stepDot: { width: 18, height: 4, borderRadius: 999, backgroundColor: colors.border },
    stepDotActive: { backgroundColor: colors.primary },
    // AI cta
    aiCta: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, overflow: "hidden" },
    aiIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
    aiTitle: { color: "#fff", fontWeight: "900", fontSize: 13.5 },
    aiSub: { color: "rgba(255,255,255,0.85)", fontSize: 10.5, marginTop: 2 },
    divider: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 11, color: colors.textMuted, paddingHorizontal: 10, fontWeight: "700" },
    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    catCard: { width: "31.5%", backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: "center", padding: 14, gap: 8 },
    catIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: "rgba(79,182,230,0.12)", alignItems: "center", justifyContent: "center" },
    catName: { fontSize: 11.5, fontWeight: "800", color: colors.text, textAlign: "center" },
    // Entry cards (6-card grid)
    entryGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 10 },
    entryCard: { width: "47%", aspectRatio: 1.1, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: 12, gap: 4 },
    entryLabel: { fontSize: 14, fontWeight: "900", marginTop: 4 },
    entrySub: { fontSize: 10.5, color: colors.textMuted, fontWeight: "600" },
    // Story/Auction banner
    storyBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#FCE7F3", borderRadius: 14, borderWidth: 1, borderColor: "#EC4899", marginBottom: 14 },
    storyBannerIcon: { fontSize: 24 },
    storyBannerText: { fontSize: 13, fontWeight: "900", color: colors.text },
    storyBannerSub: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
    // Step 2
    catChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(79,182,230,0.12)", borderColor: colors.primary, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
    catChipText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
    fieldLabel: { fontSize: 13, fontWeight: "800", color: colors.text, marginBottom: 6 },
    input: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, minHeight: 44, justifyContent: "center" },
    inputText: { fontSize: 14, color: colors.text, fontWeight: "600" },
    inputPh: { fontSize: 14, color: colors.textMuted },
    priceWrap: { position: "relative" },
    currencyBadge: { position: "absolute", end: 12, top: 13, color: colors.primary, fontWeight: "800", fontSize: 12 },
    imgBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: "center", gap: 5 },
    imgBtnText: { fontSize: 11, fontWeight: "800", color: colors.text },
    thumbWrap: { position: "relative", marginEnd: 8 },
    thumb: { width: 80, height: 80, borderRadius: 12 },
    thumbX: { position: "absolute", top: -4, end: -4, width: 22, height: 22, borderRadius: 999, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
    mainImgTag: { position: "absolute", bottom: 2, start: 2, backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    mainImgText: { fontSize: 8, fontWeight: "900", color: colors.secondary },
    locBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
    locBtnActive: { borderColor: "#10B981", backgroundColor: "rgba(16,185,129,0.06)" },
    locBtnText: { fontSize: 13, fontWeight: "800", color: colors.text },
    toggle: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
    toggleBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    toggleBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleText: { fontSize: 12.5, color: colors.text, fontWeight: "700" },
    // Bottom bar
    bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, padding: 12 },
    errText: { color: "#EF4444", fontSize: 12, marginBottom: 8, textAlign: "center" },
    submitBtn: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, overflow: "hidden" },
    submitText: { color: "#fff", fontWeight: "900", fontSize: 15 },
    // Modal
    modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, maxHeight: "80%" },
    modalTitle: { fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 10 },
    searchPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surfaceElevated, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
    searchInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 8 },
    modalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: colors.border },
    modalRowActive: { backgroundColor: "rgba(79,182,230,0.08)" },
    modalRowText: { fontSize: 14, color: colors.text },
    modalCloseBtn: { padding: 12, alignItems: "center", marginTop: 8 },
    modalCloseText: { color: colors.textMuted, fontWeight: "700" },
});
