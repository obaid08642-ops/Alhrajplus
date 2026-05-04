import { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import api, { formatApiError, BACKEND_URL } from "../api";
import { theme } from "../theme";

export default function PostScreen({ navigation, route }) {
    const editId = route.params?.editId;
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        category: "", subcategory: "", title: "", description: "", price: "",
        currency: "ر.س", custom_fields: {}, images: [], videos: [],
        city: "", district: "", lat: null, lng: null, show_phone: true,
    });
    const [busy, setBusy] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/meta/categories").then(({ data }) => setCategories(data));
    }, []);

    useEffect(() => {
        if (!editId) return;
        api.get(`/listings/${editId}`).then(({ data }) => {
            setForm((f) => ({ ...f, ...data, price: data.price?.toString() || "" }));
            setStep(2);
        });
    }, [editId]);

    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert("إذن", "نحتاج صلاحية الوصول للصور"); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: true,
        });
        if (result.canceled) return;
        await uploadAssets(result.assets);
    };

    const takePhoto = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert("إذن", "نحتاج صلاحية الكاميرا"); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (result.canceled) return;
        await uploadAssets(result.assets);
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
        } catch (e) {
            Alert.alert("خطأ", "فشل رفع الصورة");
        } finally { setUploadingImg(false); }
    };

    const useMyLocation = async () => {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) { Alert.alert("إذن", "نحتاج صلاحية الموقع"); return; }
        const loc = await Location.getCurrentPositionAsync({});
        setForm((f) => ({ ...f, lat: loc.coords.latitude, lng: loc.coords.longitude }));
        Alert.alert("✅", "تم تحديد موقعك");
    };

    const submit = async () => {
        setErr(""); setBusy(true);
        try {
            const payload = { ...form, price: form.price ? parseFloat(form.price) : null };
            if (editId) {
                const { data } = await api.put(`/listings/${editId}`, payload);
                navigation.replace("ListingDetail", { id: data.id });
            } else {
                const { data } = await api.post("/listings", payload);
                navigation.replace("ListingDetail", { id: data.id });
            }
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || "تعذر النشر");
        } finally { setBusy(false); }
    };

    return (
        <SafeAreaView style={styles.wrap}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                <Text style={styles.header}>{editId ? "تعديل الإعلان" : "إضافة إعلان جديد"}</Text>

                {step === 1 && (
                    <>
                        <Text style={styles.label}>اختر الفئة</Text>
                        <View style={styles.catGrid}>
                            {categories.map((c) => (
                                <TouchableOpacity
                                    key={c.key}
                                    onPress={() => { setForm({ ...form, category: c.key }); setStep(2); }}
                                    style={[styles.catBtn, form.category === c.key && styles.catActive]}
                                >
                                    <Text style={styles.catText}>{c.name_ar}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text style={styles.label}>العنوان</Text>
                        <TextInput value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} style={styles.input} placeholder="عنوان جذاب" placeholderTextColor={theme.colors.textMuted} />

                        <Text style={styles.label}>الوصف</Text>
                        <TextInput value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} style={[styles.input, { height: 100, textAlignVertical: "top" }]} placeholder="وصف تفصيلي..." placeholderTextColor={theme.colors.textMuted} multiline />

                        <Text style={styles.label}>السعر</Text>
                        <TextInput value={form.price} onChangeText={(v) => setForm({ ...form, price: v.replace(/[^0-9.]/g, "") })} style={styles.input} placeholder="اتركه فارغاً للسوم" placeholderTextColor={theme.colors.textMuted} keyboardType="numeric" />

                        <Text style={styles.label}>المدينة</Text>
                        <TextInput value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} style={styles.input} placeholder="الرياض، جدة..." placeholderTextColor={theme.colors.textMuted} />

                        <Text style={styles.label}>الصور</Text>
                        <View style={styles.imageRow}>
                            <TouchableOpacity onPress={takePhoto} style={styles.imageBtn}>
                                <Text style={styles.imageBtnIcon}>📷</Text>
                                <Text style={styles.imageBtnText}>كاميرا</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
                                <Text style={styles.imageBtnIcon}>🖼️</Text>
                                <Text style={styles.imageBtnText}>من المعرض</Text>
                            </TouchableOpacity>
                        </View>
                        {uploadingImg && <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 10 }} />}
                        {form.images.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                                {form.images.map((url, i) => (
                                    <View key={i} style={styles.thumbWrap}>
                                        <Image source={{ uri: url }} style={styles.thumb} />
                                        <TouchableOpacity onPress={() => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }))} style={styles.removeBtn}>
                                            <Text style={styles.removeText}>×</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity onPress={useMyLocation} style={[styles.locBtn, form.lat && { borderColor: theme.colors.success }]}>
                            <Text style={styles.locBtnText}>📍 {form.lat ? "تم تحديد الموقع" : "استخدم موقعي"}</Text>
                        </TouchableOpacity>

                        {err ? <Text style={styles.error}>{err}</Text> : null}

                        <TouchableOpacity onPress={submit} disabled={busy || !form.title || !form.description || !form.city} style={[styles.submit, (busy || !form.title) && styles.disabled]}>
                            <Text style={styles.submitText}>{busy ? "جاري النشر..." : (editId ? "حفظ التعديلات" : "نشر الإعلان")}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    header: { fontSize: 20, fontWeight: "900", color: theme.colors.text, marginBottom: 16, textAlign: "right" },
    label: { fontSize: 13, fontWeight: "800", color: theme.colors.text, marginTop: 10, marginBottom: 6, textAlign: "right" },
    input: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: theme.colors.text, textAlign: "right" },
    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    catBtn: { backgroundColor: theme.colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border },
    catActive: { borderColor: theme.colors.primary, backgroundColor: "rgba(79,182,230,0.1)" },
    catText: { fontSize: 12, fontWeight: "700", color: theme.colors.text },
    imageRow: { flexDirection: "row", gap: 10 },
    imageBtn: { flex: 1, backgroundColor: theme.colors.surface, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
    imageBtnIcon: { fontSize: 22 },
    imageBtnText: { fontSize: 12, fontWeight: "700", color: theme.colors.text, marginTop: 4 },
    thumbWrap: { position: "relative", marginEnd: 8 },
    thumb: { width: 72, height: 72, borderRadius: 10 },
    removeBtn: { position: "absolute", top: -6, end: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.danger, justifyContent: "center", alignItems: "center" },
    removeText: { color: "#fff", fontWeight: "900", fontSize: 14, lineHeight: 16 },
    locBtn: { marginTop: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
    locBtnText: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
    error: { color: theme.colors.danger, fontSize: 12, marginTop: 10, textAlign: "right" },
    submit: { marginTop: 20, backgroundColor: theme.colors.primary, padding: 14, borderRadius: theme.radius.md, alignItems: "center" },
    submitText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 14 },
    disabled: { opacity: 0.5 },
});
