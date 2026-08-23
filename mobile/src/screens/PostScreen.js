// PostScreen — full rebuild matching web /app/frontend/src/pages/PostListing.js
// Supports: category picker, dynamic category fields, city+district pickers,
// multi-image upload, AI autofill, location pin, edit mode.
import { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, Camera, ImageIcon, MapPin, X, Check, ChevronLeft, Search, Shapes, Video as VideoIcon, Play, Package, Clapperboard, Gavel, BriefcaseBusiness, Wrench } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import * as Location from "expo-location";
import * as LucideIcons from "lucide-react-native";
import api, { formatApiError } from "../api";
import { useI18n } from "../I18nContext";
import { useCountry } from "../CountryContext";
import { useAuth } from "../AuthContext";
import { useThemeMode } from "../ThemeContext";
import { colors, radius, shadow } from "../theme";
import { CarCascadeMobile, PhoneCascadeMobile, FurnitureCascadeMobile, HomeAppliancesCascadeMobile } from "../components/CategoryCascadesMobile";
import { JobsDetailsBoxMobile, RealEstateDetailsBoxMobile } from "../components/JobsRealEstateBoxesMobile";
import { AuctionsDetailsBoxMobile, ServicesProDetailsBoxMobile } from "../components/AuctionsServicesBoxesMobile";
import { AnimalsDetailsBoxMobile, EquipmentDetailsBoxMobile } from "../components/AnimalsEquipmentBoxesMobile";
import LocationPicker from "../components/LocationPicker";
export default function PostScreen({
  navigation,
  route
}) {
  const { t, lang } = useI18n();
  const { palette } = useThemeMode();
  
  const {
    current: country
  } = useCountry();
  const {
    user
  } = useAuth();
  const insets = useSafeAreaInsets();
  const editId = route.params?.editId;
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(null); // 'city' | 'district' | null
  const [err, setErr] = useState("");
  const [discovery, setDiscovery] = useState(null);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    title: "",
    description: "",
    price: "",
    currency: country?.currency_code || "SAR",
    custom_fields: {},
    images: [],
    videos: [],
    city: "",
    district: "",
    location: {},
    lat: null,
    lng: null,
    show_phone: true,
    // Phase 2: phone source. "account" = use user.phone_full; "custom" = use
    // a different number entered just for this listing.
    phone_source: "account",
    custom_phone: "",
    custom_phone_country: country?.code || "SA"
  });

  // Keep currency in sync if the user changes country after the form mounts.
  useEffect(() => {
    if (country?.currency_code && form.currency !== country.currency_code && !editId) {
      setForm(f => ({
        ...f,
        currency: country.currency_code
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country?.currency_code]);
  useEffect(() => {
    api.get("/meta/categories", {
      params: {
        lang
      }
    }).then(({
      data
    }) => setCategories(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []))).catch(() => setCategories([]));
  }, [lang]);
  useEffect(() => {
    if (!editId) return;
    api.get(`/listings/${editId}`).then(({
      data
    }) => {
      if (!data || typeof data !== "object") return;
      setForm(f => ({
        ...f,
        ...data,
        images: Array.isArray(data.images) ? data.images : [],
        videos: Array.isArray(data.videos) ? data.videos : [],
        custom_fields: data.custom_fields && typeof data.custom_fields === "object" ? data.custom_fields : {},
        price: data.price?.toString() || ""
      }));
      setStep(2);
    });
  }, [editId]);
  if (!user) {
    return <View style={s.guestWrap}>
                <Text style={s.guestTitle}>{t("سجّل دخولك للنشر")}</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={s.guestBtn}>
                    <Text style={s.guestBtnText}>{t("تسجيل الدخول")}</Text>
                </TouchableOpacity>
            </View>;
  }
  const cat = useMemo(() => categories.find(c => c.key === form.category), [categories, form.category]);
  const cityObj = useMemo(() => country?.cities?.find(c => c.name_ar === form.city), [country, form.city]);
  const districts = cityObj?.districts || [];

  // Phase 2: explicit choice between Camera and Gallery via ActionSheet.
  // We no longer try the camera silently first; the user picks.
  const _pickAIImageSource = () => new Promise((resolve) => {
    Alert.alert(
      t("التعبئة بالذكاء الاصطناعي"),
      t("اختر مصدر الصورة"),
      [
        { text: t("التقاط صورة بالكاميرا"), onPress: () => resolve("camera") },
        { text: t("اختيار من المعرض"), onPress: () => resolve("gallery") },
        { text: t("إلغاء"), style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });

  const _captureForAI = async () => {
    const source = await _pickAIImageSource();
    if (!source) return null;
    if (source === "camera") {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) {
        Alert.alert(t("إذن الكاميرا"), t("الرجاء السماح بالوصول للكاميرا من الإعدادات"));
        return null;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
        allowsEditing: false,
      });
      if (res.canceled || !res.assets?.[0]?.base64) return null;
      return res.assets[0];
    }
    // gallery
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libPerm.granted) {
      Alert.alert(t("إذن"), t("نحتاج صلاحية الصور"));
      return null;
    }
    const res2 = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (res2.canceled || !res2.assets?.[0]?.base64) return null;
    return res2.assets[0];
  };

  const aiAutofill = async () => {
    try {
      const asset = await _captureForAI();
      if (!asset) return;
      setAiBusy(true);
      const { data } = await api.post("/ai/listing-autofill", {
        image_base64: asset.base64
      });
      // Hard-validate that we actually got useful data — otherwise warn.
      const gotTitle = (data?.title || "").trim();
      const gotDesc = (data?.description || "").trim();
      if (!gotTitle && !gotDesc && !data?.category_key) {
        Alert.alert(t("لم يتمكن المساعد من قراءة الصورة"), t("جرّب صورة أوضح للمنتج"));
        return;
      }
      setForm(f => ({
        ...f,
        title: gotTitle || f.title,
        description: gotDesc || f.description,
        category: data.category_key || f.category,
        subcategory: data.subcategory || f.subcategory,
        custom_fields: { ...(f.custom_fields || {}), ...(data.custom_fields || {}) },
        price: data.suggested_price_range?.mid ? String(data.suggested_price_range.mid) : f.price
      }));
      setStep(2);
      // Confirm to the user which fields were auto-filled.
      const filledMsg = [
        gotTitle && t("✓ العنوان"),
        gotDesc && t("✓ الوصف"),
        data.category_key && t("✓ الفئة"),
        data.suggested_price_range?.mid && t("✓ السعر المقترح"),
      ].filter(Boolean).join("\n");
      Alert.alert(t("تم بالذكاء الاصطناعي"), filledMsg || t("تم"));
    } catch (e) {
      Alert.alert(t("خطأ"), formatApiError(e) || t("تعذر التعبئة"));
    } finally {
      setAiBusy(false);
    }
  };
  const uploadAssets = async assets => {
    setUploadingImg(true);
    try {
      const {
        data: sig
      } = await api.get("/cloudinary/signature", {
        params: {
          resource_type: "image",
          folder: "listings"
        }
      });
      const urls = [];
      for (const a of assets) {
        const fd = new FormData();
        fd.append("file", {
          uri: a.uri,
          type: "image/jpeg",
          name: `img_${Date.now()}.jpg`
        });
        fd.append("api_key", sig.api_key);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
          method: "POST",
          body: fd
        });
        const out = await res.json();
        if (out.secure_url) urls.push(out.secure_url);
      }
      setForm(f => ({
        ...f,
        images: [...f.images, ...urls]
      }));
    } catch (_) {
      Alert.alert(t("خطأ"), t("فشل رفع الصورة"));
    } finally {
      setUploadingImg(false);
    }
  };
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("إذن"), t("نحتاج صلاحية الصور"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true
    });
    if (!result.canceled) await uploadAssets(result.assets);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("إذن"), t("نحتاج صلاحية الكاميرا"));
      return;
    }
    // Owner directive: camera should also allow VIDEO capture (not just
    // photos). Present an action sheet to choose photo vs. video.
    Alert.alert(t("الكاميرا"), t("ماذا تريد التقاطه؟"), [
      {
        text: t("صورة"),
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled) await uploadAssets(result.assets);
        },
      },
      {
        text: t("فيديو"),
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 0.8,
            videoMaxDuration: 60,
          });
          if (!result.canceled && result.assets?.[0]) await uploadVideoAsset(result.assets[0]);
        },
      },
      { text: t("إلغاء"), style: "cancel" },
    ]);
  };
  const pickModel3D = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["model/gltf-binary", "application/octet-stream"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!/\.glb$/i.test(asset.name || "")) { Alert.alert(t("خطأ"), t("يرجى اختيار ملف GLB للعرض الأصلي")); return; }
    if (asset.size && asset.size > 80 * 1024 * 1024) { Alert.alert(t("خطأ"), t("ملف 3D أكبر من 80 ميجابايت")); return; }
    setUploadingModel(true);
    try {
      const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "raw", folder: "listings" } });
      const fd = new FormData();
      fd.append("file", { uri: asset.uri, type: asset.mimeType || "model/gltf-binary", name: asset.name || `model_${Date.now()}.glb` });
      fd.append("api_key", sig.api_key); fd.append("timestamp", String(sig.timestamp)); fd.append("signature", sig.signature); fd.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/raw/upload`, { method: "POST", body: fd });
      const out = await res.json();
      if (!out.secure_url) throw new Error("upload_failed");
      setForm(f => ({ ...f, custom_fields: { ...f.custom_fields, model_3d_url: out.secure_url } }));
    } catch (_) { Alert.alert(t("خطأ"), t("فشل رفع نموذج 3D")); }
    finally { setUploadingModel(false); }
  };
  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("إذن"), t("نحتاج صلاحية الوسائط"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 60
    });
    if (result.canceled || !result.assets?.[0]) return;
    await uploadVideoAsset(result.assets[0]);
  };
  // Shared video uploader so both `pickVideo` (gallery) and `takePhoto`
  // (camera-video branch) push to Cloudinary via the same path.
  const uploadVideoAsset = async (asset) => {
    setUploadingVid(true);
    try {
      const {
        data: sig
      } = await api.get("/cloudinary/signature", {
        params: {
          resource_type: "video",
          folder: "listings_videos"
        }
      });
      const fd = new FormData();
      const ext = (asset.uri.split(".").pop() || "mp4").toLowerCase();
      fd.append("file", {
        uri: asset.uri,
        type: `video/${ext === "mov" ? "quicktime" : "mp4"}`,
        name: `vid_${Date.now()}.${ext}`
      });
      fd.append("api_key", sig.api_key);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
        method: "POST",
        body: fd
      });
      const out = await res.json();
      if (out.secure_url) {
        setForm(f => ({
          ...f,
          videos: [...(f.videos || []), out.secure_url]
        }));
      } else {
        Alert.alert(t("خطأ"), t("فشل رفع الفيديو"));
      }
    } catch (_) {
      Alert.alert(t("خطأ"), t("فشل رفع الفيديو"));
    } finally {
      setUploadingVid(false);
    }
  };
  const removeVideo = idx => setForm(f => ({
    ...f,
    videos: (f.videos || []).filter((_, k) => k !== idx)
  }));
  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع"));
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      // Primary: hit the new Geonames-backed /locations/locate which returns
      // the FULL cascading path (adm1/adm2/adm3/city). Auto-falls back to EG
      // server-side if the user's country has no data yet.
      try {
        const { data } = await api.get("/locations/locate", { params: { lat, lng, country: country?.code || "SA", lang } });
        const sel = data?.selection || {};
        const leaf = sel.city || sel.adm3 || sel.adm2 || sel.adm1;
        setForm(f => ({
          ...f,
          lat, lng,
          location: sel,
          city: sel.adm2?.name || sel.adm1?.name || leaf?.name || "",
          district: sel.adm3?.name || sel.city?.name || "",
        }));
        Alert.alert("✅", `${t("تم اقتراح:")} ${leaf?.name || ""}\n${t("يمكنك تغييرها يدوياً.")}`);
        return;
      } catch (_) { /* fall through to legacy /geo/reverse */ }
      // Legacy fallback (older /geo/reverse — kept for safety).
      try {
        const { data } = await api.get("/geo/reverse", { params: { lat, lng, lang: "ar" } });
        if (data?.out_of_area) {
          setForm(f => ({ ...f, lat, lng }));
          Alert.alert("⚠️", t("موقعك خارج المنطقة المدعومة. اختر المدينة يدوياً."));
        } else if (data?.city) {
          setForm(f => ({ ...f, lat, lng, city: data.city, district: data.district || "" }));
          Alert.alert("✅", `${t("تم اقتراح:")} ${data.city}${data.district ? " — " + data.district : ""}\n${t("يمكنك تغييرها يدوياً.")}`);
        } else {
          setForm(f => ({ ...f, lat, lng }));
          Alert.alert("✅", t("تم تحديد موقعك. اختر المدينة يدوياً."));
        }
      } catch (_) {
        setForm(f => ({ ...f, lat, lng }));
        Alert.alert("✅", t("تم تحديد موقعك"));
      }
    } catch (_) {
      Alert.alert(t("خطأ"), t("تعذّر الوصول للموقع"));
    }
  };
  // Categories that ship with their own dedicated PRO Details Box (cascading
  // UI with internal validation). For these, the cascade-specific field keys
  // (phone_brand, car_brand, …) do NOT match the backend's generic field keys
  // (brand, make, …), so falling back on `cat.fields[*].required` produces
  // false-positive "حقل مطلوب: الماركة" errors. The cascade components are
  // responsible for blocking submission until their own required fields are
  // filled (via disabled selects + visual cues), so we skip the generic loop.
  const CATEGORIES_WITH_CUSTOM_BOX = new Set([
    "cars", "phones", "services", "jobs", "realestate",
    "furniture", "electronics", "auctions", "livestock", "equipment"
  ]);

  const validateSpecializedFields = () => {
    const cf = form.custom_fields || {};
    const required = {
      cars: [["make", "الماركة"], ["model", "الموديل"], ["year", "سنة الصنع"], ["transmission", "ناقل الحركة"], ["fuel_type", "نوع الوقود"], ["condition", "الحالة"]],
      phones: [["brand", "الماركة"], ["model", "الموديل"], ["condition", "الحالة"]],
      electronics: [["brand", "الماركة"], ["model", "الموديل"], ["condition", "الحالة"]],
      jobs: [["job_title", "المسمى الوظيفي"], ["employment_type", "نوع الوظيفة"], ["experience_level", "مستوى الخبرة"], ["education", "المؤهل العلمي"], ["industry", "المجال"]],
      realestate: [["property_type", "نوع العقار"], ["listing_type", "نوع الإعلان"], ["rooms", "عدد الغرف"], ["bathrooms", "عدد الحمامات"], ["area_m2", "المساحة"], ["furnishing", "الفرش"], ["condition", "حالة العقار"], ["building_age", "عمر البناء"], ["payment_method", "طريقة الدفع"]],
    }[form.category] || [];
    const aliases = { make: ["make", "car_brand"], model: ["model", "car_model"], year: ["year", "car_year"], brand: ["brand", "phone_brand"], employment_type: ["employment_type", "job_type"], education: ["education", "education_level"], industry: ["industry", "field"], area_m2: ["area_m2", "area"] };
    for (const [key, label] of required) {
      if (!(aliases[key] || [key]).some(name => String(cf[name] ?? "").trim())) return `${t("حقل مطلوب:")} ${t(label)}`;
    }
    return null;
  };

  const validateRequiredFields = () => {
    if (!form.title || !form.description) return t("الرجاء إكمال العنوان والوصف");
    const specializedError = validateSpecializedFields();
    if (specializedError) return specializedError;
    if (!form.city) return t("الرجاء اختيار المدينة");
    const isStory = form.subcategory === "story" || form.custom_fields?.is_story;
    if (isStory && (!form.videos || form.videos.length === 0)) {
      return t("الستوري يتطلب رفع فيديو قصير");
    }
    // Generic field validation ONLY for categories without a custom Details Box.
    if (!CATEGORIES_WITH_CUSTOM_BOX.has(form.category)) {
      for (const f of cat?.fields || []) {
        if (f.required && !form.custom_fields[f.key]) return `${t("حقل مطلوب:")} ${f.label_ar || f.key}`;
      }
    }
    return null;
  };
  const previewDiscovery = async () => {
    setDiscoveryBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/listings/discovery-preview", {
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        category: form.category,
        city: form.city,
        district: form.district,
        custom_fields: form.custom_fields || {},
        images: form.images || [],
        post_type: form.post_type || "offer",
      });
      setDiscovery(data || null);
    } catch (e) {
      setErr(formatApiError(e) || t("تعذر تقييم اكتمال الإعلان"));
    } finally {
      setDiscoveryBusy(false);
    }
  };

  const submit = async () => {
    setErr("");
    const v = validateRequiredFields();
    if (v) {
      setErr(v);
      return;
    }
    // An account number becomes a listing contact only after real OTP verification.
    if (form.show_phone && form.phone_source === "account" && !user?.phone_verified) {
      setErr(t("وثّق رقم هاتفك أولاً أو اختر رقمًا مخصصًا للإعلان"));
      return;
    }
    // Phase 2: validate custom phone if user picked "different number".
    if (form.show_phone && form.phone_source === "custom") {
      const num = (form.custom_phone || "").trim();
      if (!num || num.length < 6) {
        setErr(t("الرجاء إدخال رقم جوال صالح للإعلان"));
        return;
      }
    }
    setBusy(true);
    try {
      // Build dial-coded phone for the listing if a custom number was supplied.
      const _DIAL = {
        SA: "+966", AE: "+971", KW: "+965", QA: "+974", BH: "+973",
        OM: "+968", EG: "+20", JO: "+962", LB: "+961", IQ: "+964",
        SY: "+963", YE: "+967", PS: "+970", MA: "+212", DZ: "+213",
        TN: "+216", LY: "+218", SD: "+249", TR: "+90", PK: "+92",
        IN: "+91", BD: "+880", ID: "+62", MY: "+60", US: "+1",
        GB: "+44", FR: "+33"
      };
      const customCountry = form.custom_phone_country || country?.code || "SA";
      const customFull = form.custom_phone
        ? `${_DIAL[customCountry] || "+966"}${form.custom_phone.replace(/^0+/, "")}`
        : "";
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        country_code: country?.code || "SA",
        // Server-side reads these to decide which phone to expose on the listing.
        contact_phone_source: form.phone_source,
        contact_phone: form.phone_source === "custom" ? customFull : ""
      };
      if (editId) {
        const {
          data
        } = await api.put(`/listings/${editId}`, payload);
        api.delete("/users/me/draft-listing").catch(() => {});
        navigation.replace("ListingDetail", {
          id: data.id
        });
      } else {
        const {
          data
        } = await api.post("/listings", payload);
        api.delete("/users/me/draft-listing").catch(() => {});
        navigation.replace("ListingDetail", {
          id: data.id
        });
      }
    } catch (e) {
      setErr(formatApiError(e) || t("تعذر النشر"));
    } finally {
      setBusy(false);
    }
  };

  // Persist a lightweight draft snapshot so the backend can nudge the user
  // with a push notification if they abandon the flow for ~10 minutes.
  useEffect(() => {
    if (editId) return;
    if (step !== 2) return;
    if (!form.title && !form.category) return;
    const tid = setTimeout(() => {
      api.post("/users/me/draft-listing", {
        title: form.title || "",
        category: form.category || "",
        city: form.city || "",
        price: form.price ? parseFloat(form.price) : null,
        images_count: (form.images || []).length
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(tid);
  }, [step, form.title, form.category, form.city, form.price, form.images, editId]);
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
    flex: 1,
    backgroundColor: palette.bg
  }}>
            {/* Slim app bar — minimal vertical space (was eating ¼ of screen). */}
            <View style={[s.header, {
      paddingTop: Math.min(insets.top + 2, insets.top + 4)
    }]}>
                <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)} style={s.headBtn} hitSlop={8}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.headTitle}>{editId ? t("تعديل الإعلان") : step === 1 ? t("اختر التصنيف") : t("تفاصيل الإعلان")}</Text>
                <View style={s.stepDots}>
                    <View style={[s.stepDot, s.stepDotActive]} />
                    <View style={[s.stepDot, step === 2 && s.stepDotActive]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={{
      padding: 16,
      paddingBottom: 160
    }} keyboardShouldPersistTaps="handled">
                {step === 1 ? <Step1 onAI={aiAutofill} aiBusy={aiBusy} categories={categories} onPick={key => {
        if (key === "__story__") {
          // Story mode = same form but enforces video upload + brief
          setForm({
            ...form,
            category: form.category || "general",
            subcategory: "story",
            custom_fields: {
              is_story: true
            }
          });
          setStep(2);
        } else if (key === "auction") {
          setForm({
            ...form,
            category: "auctions",
            subcategory: "",
            custom_fields: {
              is_auction: true
            }
          });
          setStep(2);
        } else {
          setForm({
            ...form,
            category: key,
            subcategory: "",
            custom_fields: {}
          });
          setStep(2);
        }
      }} /> : <><Step2 form={form} setForm={setForm} cat={cat} categories={categories} onPickerOpen={setPickerOpen} country={country} user={user} onPickImage={pickImage} onTakePhoto={takePhoto} uploadingImg={uploadingImg} onPickVideo={pickVideo} onRemoveVideo={removeVideo} uploadingVid={uploadingVid} uploadingModel={uploadingModel} onPickModel3D={pickModel3D} onUseLocation={useMyLocation} /><DiscoveryReadinessCard discovery={discovery} t={t} /></>}
            </ScrollView>

            {/* Bottom CTA */}
            {step === 2 && <View style={[s.bottomBar, {
      paddingBottom: Math.max(insets.bottom, 12)
    }]}>
                    {err ? <Text style={s.errText}>{err}</Text> : null}
                    <TouchableOpacity onPress={previewDiscovery} disabled={discoveryBusy || busy} style={[s.discoveryBtn, (discoveryBusy || busy) && { opacity: 0.5 }]} accessibilityRole="button" testID="post-discovery-preview"><Sparkles size={16} color={colors.primary} /><Text style={s.discoveryBtnText}>{discoveryBusy ? t("جاري التقييم...") : discovery ? t("تحديث تقييم الظهور") : t("تقييم ظهور الإعلان")}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={submit} disabled={busy} style={[s.submitBtn, busy && {
        opacity: 0.5
      }]}>
                        <LinearGradient colors={[colors.primary, "#2A8CBD"]} style={StyleSheet.absoluteFillObject} start={{
          x: 0,
          y: 0
        }} end={{
          x: 1,
          y: 0
        }} />
                        {busy ? <ActivityIndicator color="#fff" /> : <>
                                <Check size={18} color="#fff" />
                                <Text style={s.submitText}>{editId ? t("حفظ التعديلات") : t("نشر الإعلان")}</Text>
                            </>}
                    </TouchableOpacity>
                </View>}

            {/* City picker — supports static list + live geo search */}
            <GeoPickerModal visible={pickerOpen === "city"} onClose={() => setPickerOpen(null)} title={t("اختر المدينة")} country={country?.code} lang={lang} staticItems={(country?.cities || []).map(c => ({
      name: c.name_ar
    }))} kind="city" current={form.city} onPick={name => {
      setForm({
        ...form,
        city: name,
        district: ""
      });
      setPickerOpen(null);
    }} />
            {/* District picker — Nominatim/Overpass-powered (covers every neighborhood) */}
            <GeoPickerModal visible={pickerOpen === "district"} onClose={() => setPickerOpen(null)} title={t("اختر الحي")} country={country?.code} lang={lang} staticItems={(districts || []).map(d => ({
      name: d
    }))} kind="district" parent={form.city} current={form.district} onPick={name => {
      setForm({
        ...form,
        district: name
      });
      setPickerOpen(null);
    }} />
        </KeyboardAvoidingView>;
}

// =============== Geo Picker Modal (uses /api/geo/search or /api/geo/districts) ===============
function GeoPickerModal({
  visible,
  onClose,
  title,
  staticItems,
  kind,
  parent,
  country,
  lang,
  current,
  onPick
}) {
  const { t } = useI18n();
  
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!visible) {
      setQ("");
      setRemote([]);
      return;
    }
    // Auto-load full list on open (cities OR districts) so user can scroll without searching
    setLoading(true);
    if (kind === "district" && parent) {
      api.get("/geo/districts", {
        params: {
          city: parent,
          country,
          lang,
          limit: 100
        }
      }).then(({
        data
      }) => setRemote(data || [])).catch(() => setRemote([])).finally(() => setLoading(false));
    } else if (kind === "city" && country) {
      // Pre-load ALL cities of the selected country (no search needed)
      api.get("/geo/cities", {
        params: {
          country,
          lang,
          limit: 100
        }
      }).then(({
        data
      }) => setRemote(data || [])).catch(() => setRemote([])).finally(() => setLoading(false));
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
        const params = kind === "district" ? {
          q,
          country,
          type: "district",
          lang,
          limit: 30
        } : {
          q,
          country,
          type: "city",
          lang,
          limit: 30
        };
        const {
          data
        } = await api.get("/geo/search", {
          params
        });
        setRemote(data || []);
      } catch (_) {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [q, visible, kind, country, lang]);

  // For cities: static list comes from country.cities (already country-filtered).
  // For districts: static list is from selected city only.
  // Merge: static first then remote, dedupe by name.
  const items = useMemo(() => {
    const localFiltered = q ? staticItems.filter(it => (it.name || "").includes(q)) : staticItems;
    const seen = new Set(localFiltered.map(x => x.name));
    const merged = [...localFiltered];
    for (const r of remote) {
      if (!seen.has(r.name)) {
        merged.push({
          name: r.name,
          parent: r.parent,
          fromGeo: true
        });
        seen.add(r.name);
      }
    }
    return merged;
  }, [staticItems, remote, q]);
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.modalBg}>
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>{title}</Text>
                    <View style={s.searchPill}>
                        <Search size={14} color={colors.textMuted} />
                        <TextInput value={q} onChangeText={setQ} placeholder={kind === "city" ? t("ابحث أو اختر من القائمة...") : t("ابحث أو اختر الحي...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
                        {loading && <ActivityIndicator size="small" color={colors.primary} />}
                    </View>
                    {items.length === 0 && !loading && <Text style={{
          padding: 30,
          textAlign: "center",
          color: colors.textMuted,
          fontSize: 12
        }}>
                            {q ? t("لا نتائج") : kind === "district" ? t("اختر مدينة أولاً") : t("اكتب اسم المدينة")}
                        </Text>}
                    <FlatList data={items} keyExtractor={(it, i) => `${it.name}-${i}`} renderItem={({
          item
        }) => {
          const isCur = item.name === current;
          return <TouchableOpacity onPress={() => onPick(item.name)} style={[s.modalRow, isCur && s.modalRowActive]}>
                                    <View style={{
              flex: 1
            }}>
                                        <Text style={[s.modalRowText, isCur && {
                color: colors.primary,
                fontWeight: "900"
              }]}>{item.name}</Text>
                                        {item.parent && <Text style={{
                fontSize: 10,
                color: colors.textMuted,
                marginTop: 2
              }}>{item.parent}</Text>}
                                    </View>
                                    {item.fromGeo && <Text style={{
              fontSize: 9,
              color: colors.primary,
              fontWeight: "800"
            }}>🌍</Text>}
                                    {isCur && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>;
        }} style={{
          maxHeight: 420
        }} />
                    <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
                        <Text style={s.modalCloseText}>{t("إلغاء")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>;
}

// =============== STEP 1: Entry Cards (6 cards, mirrors web premium flow) ===============
function Step1({
  categories,
  onPick,
  onAI,
  aiBusy
}) {
  const { t } = useI18n();
  
  const jobsCat = categories.find(c => c.key === "jobs");
  const servicesCat = categories.find(c => c.key === "services");
  return <>
            {/* Hero AI Autofill */}
            <TouchableOpacity onPress={onAI} disabled={aiBusy} style={[s.aiCta, shadow.card]}>
                <LinearGradient colors={[colors.primary, "#7CCAEC", colors.accent]} style={StyleSheet.absoluteFillObject} start={{
        x: 0,
        y: 0
      }} end={{
        x: 1,
        y: 1
      }} />
                <View style={s.aiIcon}><Sparkles size={20} color="#fff" /></View>
                <View style={{
        flex: 1
      }}>
                    <Text style={s.aiTitle}>{t("بيع بالذكاء الاصطناعي")}</Text>
                    <Text style={s.aiSub}>{t("التقط صورة وسيُكمل الذكاء الاصطناعي العنوان والوصف والسعر")}</Text>
                </View>
                {aiBusy && <ActivityIndicator color="#fff" />}
            </TouchableOpacity>

            {/* Main entry layout per user spec:
                1) Big "Add Listing" card (full width) with t("كل الفئات") subtitle
                2) Row: نشر ستوري + إنشاء مزاد
                3) Row: وظائف + خدمات
                Removed: t("صفقات اليوم") card (per user request). */}
            <View style={{
      marginTop: 4
    }}>
                {/* Primary: Add Listing (full width) */}
                <TouchableOpacity onPress={() => onPick("")} activeOpacity={0.9} style={s.primaryEntryCard}>
                    <LinearGradient colors={["#DBEAFE", "#EFF6FF"]} style={StyleSheet.absoluteFillObject} start={{
          x: 0,
          y: 0
        }} end={{
          x: 1,
          y: 1
        }} />
                    <View style={s.primaryEntryIcon}><Package size={28} color={colors.primary} strokeWidth={2.1} /></View>
                    <View style={{
          flex: 1
        }}>
                        <Text style={s.primaryEntryLabel}>{t("إضافة إعلان")}</Text>
                        <Text style={s.primaryEntrySub} numberOfLines={2}>{t("كل الفئات — سيارات • عقارات • إلكترونيات • أثاث • أزياء ...")}</Text>
                    </View>
                    <Text style={s.primaryEntryChev}>‹</Text>
                </TouchableOpacity>

                {/* Row 1: Story + Auction */}
                <View style={s.entryRow}>
                    <EntryCard Icon={Clapperboard} label={t("نشر ستوري")} sub={t("فيديو قصير")} bg={["#FCE7F3", "#FDF2F8"]} accent="#EC4899" onPress={() => onPick("__story__")} />
                    <EntryCard Icon={Gavel} label={t("إنشاء مزاد")} sub={t("مزايدة حية")} bg={["#FEF3C7", "#FEF9C3"]} accent="#F59E0B" onPress={() => onPick("auction")} />
                </View>

                {/* Row 2: Jobs + Services */}
                <View style={s.entryRow}>
                    {jobsCat && <EntryCard Icon={BriefcaseBusiness} label={jobsCat.name || t("وظائف")} sub={t("ابحث أو وظّف")} bg={["#D1FAE5", "#ECFDF5"]} accent="#10B981" onPress={() => onPick("jobs")} />}
                    {servicesCat && <EntryCard Icon={Wrench} label={servicesCat.name || t("خدمات")} sub={t("اعرض خدمتك")} bg={["#FED7AA", "#FFEDD5"]} accent="#EA580C" onPress={() => onPick("services")} />}
                </View>
            </View>
        </>;
}
function EntryCard({
  Icon,
  label,
  sub,
  bg,
  accent,
  onPress
}) {
  return <TouchableOpacity onPress={onPress} style={s.entryCard} activeOpacity={0.85}>
            <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} start={{
      x: 0,
      y: 0
    }} end={{
      x: 1,
      y: 1
    }} />
            <Icon size={28} color={accent} strokeWidth={2.1} />
            <Text style={[s.entryLabel, {
      color: accent
    }]} numberOfLines={1}>{label}</Text>
            <Text style={s.entrySub} numberOfLines={1}>{sub}</Text>
        </TouchableOpacity>;
}

// =============== STEP 2: Details Form ===============
function Step2({
  form,
  setForm,
  cat,
  categories,
  onPickerOpen,
  country,
  user,
  onPickImage,
  onTakePhoto,
  uploadingImg,
  onPickVideo,
  onRemoveVideo,
  uploadingVid,
  uploadingModel,
  onPickModel3D,
  onUseLocation
}) {
  const { t } = useI18n();
  
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const update = (k, v) => setForm({
    ...form,
    [k]: v
  });
  const updateCF = (k, v) => setForm({
    ...form,
    custom_fields: {
      ...form.custom_fields,
      [k]: v
    }
  });

  // Auto-suggest category from title using keyword match. Keys MUST match
  // backend category keys (seen via /api/meta/categories): phones, cars,
  // realestate, jobs, services, furniture, electronics, livestock, equipment,
  // auctions, fashion, etc. (NOT real_estate, NOT mobile→electronics).
  useEffect(() => {
    if (form.category || !form.title || form.title.length < 4) return;
    const title = form.title.toLowerCase();
    const KEYWORDS = {
      phones:     ["موبايل", "جوال", "ايفون", "آيفون", "سامسونج", "iphone", "samsung", "xiaomi", "هواوي", "بكسل", "pixel", "تابلت", "ايباد", "آيباد", "ipad"],
      cars:       ["سيارة", "سياره", "كامري", "كرولا", "هوندا", "تويوتا", "نيسان", "بي ام", "مرسيدس", "car", "هيونداي", "كيا", "لاندكروزر", "لاند كروزر", "باترول", "اكسنت"],
      realestate: ["شقة", "فيلا", "أرض", "ارض", "بيت", "عمارة", "محل", "مكتب", "ايجار", "إيجار", "تمليك", "دور", "عمائر", "استراحة", "مزرعة"],
      electronics: ["لاب توب", "تلفزيون", "كمبيوتر", "بلايستيشن", "اكس بوكس", "playstation", "xbox", "laptop", "شاشة", "ساعة ذكية", "smart watch", "ابل ووتش", "apple watch"],
      furniture:  ["كنبة", "كنب", "كرسي", "طاولة", "غرفة نوم", "سرير", "ديكور", "مجلس", "خزانة", "مكتب"],
      fashion:    ["ثوب", "عباية", "حذاء", "ملابس", "حقيبة", "شنطة", "ساعة", "نظارة", "عطر"],
      jobs:       ["وظيفة", "موظف", "موظفة", "مطلوب", "للعمل", "شاغرة", "توظيف", "دوام"],
      services:   ["خدمة", "تركيب", "صيانة", "نقل", "تنظيف", "سباك", "كهربائي", "حداد", "دهان", "نقل عفش"],
      livestock:  ["حصان", "غنم", "خروف", "ابل", "إبل", "ماعز", "بقر", "دجاج", "صقر", "قطة", "كلب", "حيوان"],
      equipment:  ["شيول", "حفار", "رافعة", "بوبكات", "معدات", "تركتر", "جرار", "لودر"],
      auctions:   ["مزاد", "مزايدة"],
    };
    for (const [k, words] of Object.entries(KEYWORDS)) {
      if (words.some(w => title.includes(w))) {
        if (categories.find(c => c.key === k)) {
          setForm({
            ...form,
            category: k
          });
          break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);
  return <>
            {/* Story mode banner */}
            {form.subcategory === "story" && <View style={s.storyBanner}>
                    <Text style={s.storyBannerIcon}>🎬</Text>
                    <View style={{
        flex: 1
      }}>
                        <Text style={s.storyBannerText}>{t("وضع الستوري — فيديو قصير فقط")}</Text>
                        <Text style={s.storyBannerSub}>{t("ارفع فيديو قصير + عنوان + سعر + مدينة. لا حاجة لتفاصيل كثيرة.")}</Text>
                    </View>
                </View>}
            {/* Auction mode banner */}
            {form.custom_fields?.is_auction && <View style={[s.storyBanner, {
      backgroundColor: "#FEF3C7",
      borderColor: "#F59E0B"
    }]}>
                    <Text style={s.storyBannerIcon}>🔨</Text>
                    <View style={{
        flex: 1
      }}>
                        <Text style={s.storyBannerText}>{t("وضع المزاد")}</Text>
                        <Text style={s.storyBannerSub}>{t("السعر الذي ستضعه = السعر الابتدائي للمزايدة")}</Text>
                    </View>
                </View>}

            {/* ===== Services-only Listing Type selector at the very TOP ===== */}
            {form.category === "services" && <View style={s.postTypeBox} testID="services-post-type-top">
                    <Text style={s.postTypeTitle}>🔧 {t("ما نوع الإعلان؟")}</Text>
                    <View style={s.postTypeRow}>
                        {[{
          key: "تقديم خدمة",
          sub: t("أنا مقدّم خدمة"),
          badge: "🟢"
        }, {
          key: "طلب خدمة",
          sub: t("أحتاج هذه الخدمة"),
          badge: "🔵"
        }].map(opt => {
          const active = form.custom_fields?.post_type === opt.key;
          return <TouchableOpacity key={opt.key} onPress={() => setForm({
            ...form,
            custom_fields: {
              ...form.custom_fields,
              post_type: opt.key
            }
          })} style={[s.postTypeBtn, active && s.postTypeBtnActive]} activeOpacity={0.85}>
                                    <Text style={[s.postTypeBtnLabel, active && {
              color: "#fff"
            }]}>{opt.badge} {opt.key}</Text>
                                    <Text style={[s.postTypeBtnSub, active && {
              color: "rgba(255,255,255,0.85)"
            }]}>{opt.sub}</Text>
                                </TouchableOpacity>;
        })}
                    </View>
                </View>}

            {/* ===== Jobs-only Listing Type selector at the very TOP =====
                Mirrors services: 2 large pills (Hiring vs Looking for Job). */}
            {form.category === "jobs" && <View style={s.postTypeBox} testID="jobs-post-type-top">
                    <Text style={s.postTypeTitle}>💼 {t("ما نوع الإعلان؟")}</Text>
                    <View style={s.postTypeRow}>
                        {[{
          key: "عرض وظيفة",
          sub: t("أنا أوظّف شخص"),
          badge: "🟢"
        }, {
          key: "باحث عن عمل",
          sub: t("أنا أبحث عن وظيفة"),
          badge: "🔵"
        }].map(opt => {
          const active = form.custom_fields?.post_type === opt.key;
          return <TouchableOpacity key={opt.key} onPress={() => setForm({
            ...form,
            custom_fields: {
              ...form.custom_fields,
              post_type: opt.key
            },
            subcategory: opt.key === "عرض وظيفة" ? "job_offer" : "job_seeker"
          })} style={[s.postTypeBtn, active && s.postTypeBtnActive]} activeOpacity={0.85}>
                                    <Text style={[s.postTypeBtnLabel, active && {
              color: "#fff"
            }]}>{opt.badge} {opt.key}</Text>
                                    <Text style={[s.postTypeBtnSub, active && {
              color: "rgba(255,255,255,0.85)"
            }]}>{opt.sub}</Text>
                                </TouchableOpacity>;
        })}
                    </View>
                </View>}

<Field label={t("العنوان") + " *"}>
                <TextInput value={form.title} onChangeText={v => update("title", v)} placeholder={t("مثال: تويوتا كامري 2020 ممتازة")} placeholderTextColor={colors.textMuted} style={s.input} />
            </Field>

                        {/* Category selector */}
            <Field label={t("التصنيف") + " *"}>
                <TouchableOpacity onPress={() => setCatPickerOpen(true)} style={s.input}>
                    <Text style={form.category ? s.inputText : s.inputPh}>
                        {cat ? cat.name || cat.name_ar : t("اختر التصنيف")}
                    </Text>
                </TouchableOpacity>
                {!form.category && form.title && form.title.length >= 4 && <Text style={{
        fontSize: 10.5,
        color: colors.primary,
        marginTop: 4
      }}>
                        ✨ {t("اكتب العنوان واختر تصنيفاً مقترحاً تلقائياً")}
                    </Text>}
            </Field>
            <Modal visible={catPickerOpen} transparent animationType="slide" onRequestClose={() => setCatPickerOpen(false)}>
                <View style={s.modalBg}>
                    <View style={s.modalSheet}>
                        <Text style={s.modalTitle}>{t("اختر التصنيف")}</Text>
                        <FlatList data={categories} keyExtractor={c => c.key} style={{
            maxHeight: 480
          }} renderItem={({
            item
          }) => {
            const Icon = LucideIcons[item.icon] || Shapes;
            const isCur = item.key === form.category;
            return <TouchableOpacity onPress={() => {
              setForm({
                ...form,
                category: item.key,
                subcategory: form.subcategory === "story" ? "story" : "",
                custom_fields: form.custom_fields?.is_story ? {
                  is_story: true
                } : form.custom_fields?.is_auction ? {
                  is_auction: true
                } : {}
              });
              setCatPickerOpen(false);
            }} style={[s.modalRow, isCur && s.modalRowActive]}>
                                        <Icon size={22} color={colors.primary} />
                                        <Text style={[s.modalRowText, {
                flex: 1,
                marginStart: 10
              }, isCur && {
                color: colors.primary,
                fontWeight: "900"
              }]}>{item.name || item.name_ar}</Text>
                                        {isCur && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>;
          }} />
                        <TouchableOpacity onPress={() => setCatPickerOpen(false)} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>{t("إلغاء")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Field label={t("الوصف") + " *"}>
                <TextInput value={form.description} onChangeText={v => update("description", v)} placeholder={t("اوصف منتجك بالتفصيل...")} placeholderTextColor={colors.textMuted} style={[s.input, {
        height: 110,
        textAlignVertical: "top"
      }]} multiline />
            </Field>

            {/* ===== PHONES Details Box (AFTER description, BEFORE price) =====
                Strict 2-column cascade. Generic renderer below is suppressed for `phones`
                so there are zero duplicates. */}
            {form.category === "phones" && <PhoneCascadeMobile value={form.custom_fields} onChange={patch => setForm({
      ...form,
      custom_fields: {
        ...form.custom_fields,
        ...patch
      }
    })} />}

            {/* ===== FURNITURE Details Box (AFTER description) =====
                Strict 2-col. Generic renderer below is suppressed for `furniture`. */}
            {form.category === "furniture" && <FurnitureCascadeMobile value={form.custom_fields} onChange={patch => setForm({
      ...form,
      custom_fields: {
        ...form.custom_fields,
        ...patch
      }
    })} />}

            {/* ===== HOME APPLIANCES Details Box (AFTER description) =====
                Strict 2-col. Wired for `electronics` category. Generic renderer below is
                suppressed. */}
            {form.category === "electronics" && <HomeAppliancesCascadeMobile value={form.custom_fields} onChange={patch => setForm({
      ...form,
      custom_fields: {
        ...form.custom_fields,
        ...patch
      }
    })} />}

            {/* ===== SERVICES PRO Details Box (AFTER description) =====
                Strict 2-col with full conditional logic per service_type bucket
                (delivery / cleaning / dev / education). Generic renderer below is
                suppressed for `services` → no duplicates. */}
            {form.category === "services" && <ServicesProDetailsBoxMobile form={form} setForm={setForm} />}

            {/* ===== AUCTIONS Details Box (AFTER description) =====
                Strict 2-col, 5 rows × 2 fields. Auto-calculates end_time from duration;
                flags low bid_increment and buy_now_below_start with inline warnings.
                Generic renderer below is suppressed for `auctions` → no duplicates. */}
            {form.category === "auctions" && <AuctionsDetailsBoxMobile form={form} setForm={setForm} />}

            {/* ===== ANIMALS / LIVESTOCK Details Box (AFTER description) =====
                Strict 2-col, 5 base rows + conditional branches (طيور / خيول).
                Generic renderer below is suppressed for `livestock`. */}
            {form.category === "livestock" && <AnimalsDetailsBoxMobile form={form} setForm={setForm} />}

            {/* ===== EQUIPMENT / HEAVY MACHINERY Details Box (AFTER description) =====
                Strict 2-col, 5 base rows + rental block when rental_or_sale includes إيجار.
                Generic renderer below is suppressed for `equipment`. */}
            {form.category === "equipment" && <EquipmentDetailsBoxMobile form={form} setForm={setForm} />}

            {/* ===== JOBS Details Box (AFTER description) — strict 2-col grid ===== */}
            {form.category === "jobs" && <JobsDetailsBoxMobile form={form} setForm={setForm} />}

            {/* ===== REAL ESTATE Details Box (AFTER description) — strict 2-col grid =====
                Price is rendered INSIDE this box (the standalone price block below is hidden
                for `realestate` to avoid duplication). */}
            {form.category === "realestate" && <RealEstateDetailsBoxMobile form={form} setForm={setForm} />}

            {form.category !== "jobs" && form.category !== "services" && form.category !== "realestate" && form.category !== "auctions" && form.category !== "livestock" && form.category !== "equipment" && <Field label={t("السعر") + ` (${form.currency})`}>
                    <View style={s.priceWrap}>
                        <TextInput value={form.price} onChangeText={v => update("price", v.replace(/[^0-9.]/g, ""))} placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={[s.input, {
          flex: 1,
          paddingEnd: 50
        }]} keyboardType="numeric" />
                        <Text style={s.currencyBadge}>{form.currency}</Text>
                    </View>
                    <MarketPriceHint form={form} country={country} onPick={(v) => update("price", String(v))} />
                </Field>}

            {/* Cascading brand→model→year→trim (cars). Phones cascade is rendered at the TOP
                of step 2 (above title) per the latest UX brief. */}
            {form.category === "cars" && <CarCascadeMobile value={form.custom_fields} onChange={patch => setForm({
      ...form,
      custom_fields: {
        ...form.custom_fields,
        ...patch
      }
    })} />}

            {/* Dynamic category fields */}
            {/* Suppress the generic renderer for cars / phones / services / jobs / realestate /
                furniture / electronics — each has its own structured 2-column Details Box above. */}
            {!(form.category === "cars" || form.category === "phones" || form.category === "services" || form.category === "jobs" || form.category === "realestate" || form.category === "furniture" || form.category === "electronics" || form.category === "auctions" || form.category === "livestock" || form.category === "equipment") && (cat?.fields || []).filter(f => f.key !== "post_type").map(f => <Field key={f.key} label={`${f.label_ar || f.label_en || f.key}${f.required ? " *" : ""}`}>
                    {f.type === "select" ? <SelectInput value={form.custom_fields[f.key] || ""} options={(f.options_ar || f.options || []).map((opt, i) => ({
        value: f.options_ar?.[i] || opt,
        label: opt
      }))} placeholder={t("اختر...")} onChange={v => updateCF(f.key, v)} /> : f.type === "number" ? <TextInput value={String(form.custom_fields[f.key] || "")} onChangeText={v => updateCF(f.key, v)} keyboardType="numeric" placeholder={f.placeholder || ""} placeholderTextColor={colors.textMuted} style={s.input} /> : <TextInput value={form.custom_fields[f.key] || ""} onChangeText={v => updateCF(f.key, v)} keyboardType={f.type === "url" ? "url" : "default"} placeholder={f.type === "date" ? "YYYY-MM-DD" : (f.placeholder || "")} placeholderTextColor={colors.textMuted} style={s.input} />}
                </Field>)}

            {/* City / District — Geonames cascading picker (محافظة → مركز → حي → قرية for EG) */}
            <Field label={t("الموقع") + " *"}>
                <LocationPicker
                    country={country?.code || "SA"}
                    value={form.location || {}}
                    onChange={(next) => {
                        // Mirror to legacy city/district string fields so the existing
                        // backend payload + draft-listing flow stays compatible.
                        setForm(f => ({
                            ...f,
                            location: next,
                            city: next.adm2?.name || next.adm1?.name || next.city?.name || "",
                            district: next.adm3?.name || next.city?.name || "",
                        }));
                    }}
                />
            </Field>

            {/* Video (required for stories, optional otherwise) */}
            {(() => {
      const isStory = form.subcategory === "story" || form.custom_fields?.is_story;
      return <Field label={t("الفيديو") + (isStory ? " *" : ` (${t("اختياري")})`)}>
                        <TouchableOpacity onPress={onPickVideo} style={[s.imgBtn, {
          flexDirection: "row",
          justifyContent: "center",
          borderColor: isStory ? "#EC4899" : colors.border,
          borderWidth: isStory ? 1.5 : 1
        }]} testID="post-pick-video-btn">
                            <VideoIcon size={20} color={isStory ? "#EC4899" : colors.primary} />
                            <Text style={[s.imgBtnText, {
            marginStart: 8
          }]}>
                                {(form.videos?.length || 0) > 0 ? t("تغيير الفيديو") : isStory ? t("ارفع فيديو قصير (مطلوب)") : t("أضف فيديو")}
                            </Text>
                        </TouchableOpacity>
                        {uploadingVid && <ActivityIndicator color={colors.primary} style={{
          marginTop: 8
        }} />}
                        {(form.videos || []).map((url, i) => <VideoPreview key={`${url}-${i}`} url={url} onRemove={() => onRemoveVideo(i)} testID={`post-video-preview-${i}`} />)}
                    </Field>;
    })()}

            <Field label={t("نموذج 3D") + (form.custom_fields?.model_3d_url ? " ✓" : "")}>
                <TouchableOpacity onPress={onPickModel3D} style={[s.imgBtn, { borderColor: "#7C3AED", borderWidth: 1.5 }]} testID="post-pick-model-3d-btn">
                    <Text style={[s.imgBtnText, { color: "#7C3AED" }]}>{form.custom_fields?.model_3d_url ? t("استبدال نموذج 3D") : t("رفع ملف GLB")}</Text>
                </TouchableOpacity>
                {form.custom_fields?.model_3d_url && <TouchableOpacity onPress={() => setForm(f => ({ ...f, custom_fields: { ...f.custom_fields, model_3d_url: "" } }))} style={[s.imgBtn, { borderColor: colors.danger, borderWidth: 1.5, marginTop: 8 }]} testID="post-remove-model-3d-btn">
                    <Text style={[s.imgBtnText, { color: colors.danger }]}>{t("إزالة نموذج 3D")}</Text>
                </TouchableOpacity>}
                {uploadingModel && <ActivityIndicator color="#7C3AED" style={{ marginTop: 8 }} />}
                <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>{t("يمكن إنشاء الملف خارجيًا من الصور أو الفيديو ثم رفعه هنا")}</Text>
            </Field>

            {/* Images */}
            <Field label={t("الصور")}>
                <View style={{
        flexDirection: "row",
        gap: 10
      }}>
                    <TouchableOpacity onPress={onTakePhoto} style={s.imgBtn}>
                        <Camera size={22} color={colors.primary} />
                        <Text style={s.imgBtnText}>{t("التقط")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onPickImage} style={s.imgBtn}>
                        <ImageIcon size={22} color={colors.primary} />
                        <Text style={s.imgBtnText}>{t("من المعرض")}</Text>
                    </TouchableOpacity>
                </View>
                {uploadingImg && <ActivityIndicator color={colors.primary} style={{
        marginTop: 8
      }} />}
                {form.images.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{
        marginTop: 10
      }}>
                        {form.images.map((url, i) => <View key={i} style={s.thumbWrap}>
                                <Image source={{
            uri: url
          }} style={s.thumb} />
                                <TouchableOpacity onPress={() => setForm(f => ({
            ...f,
            images: f.images.filter((_, k) => k !== i)
          }))} style={s.thumbX}>
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                                {i === 0 && <View style={s.mainImgTag}><Text style={s.mainImgText}>{t("رئيسية")}</Text></View>}
                            </View>)}
                    </ScrollView>}
            </Field>

            {/* Location pin */}
            <TouchableOpacity onPress={onUseLocation} style={[s.locBtn, form.lat && s.locBtnActive]}>
                <MapPin size={18} color={form.lat ? "#10B981" : colors.primary} />
                <Text style={[s.locBtnText, form.lat && {
        color: "#10B981"
      }]}>
                    {form.lat ? t("📍 تم تحديد الموقع") : t("استخدم موقعي الحالي")}
                </Text>
            </TouchableOpacity>

            {/* Show phone toggle */}
            <TouchableOpacity onPress={() => update("show_phone", !form.show_phone)} style={s.toggle} testID="post-show-phone-toggle">
                <View style={[s.toggleBox, form.show_phone && s.toggleBoxActive]}>{form.show_phone && <Check size={14} color="#fff" />}</View>
                <Text style={s.toggleText}>{t("عرض رقم جوالي للمشترين")}</Text>
            </TouchableOpacity>

            {/* Phone source selector — visible only when show_phone is ON */}
            {form.show_phone ? <View style={s.phoneBlock}>
                <Text style={s.phoneBlockTitle}>{t("ما هو الرقم الذي يصل إليه المشتري؟")}</Text>
                <TouchableOpacity
                    onPress={() => user?.phone_verified ? update("phone_source", "account") : setErr(t("وثّق رقم هاتفك أولاً أو اختر رقمًا مخصصًا"))}
                    style={[s.radioRow, form.phone_source === "account" && user?.phone_verified && s.radioRowActive, !user?.phone_verified && { opacity: 0.55 }]}
                    testID="post-phone-source-account"
                >
                    <View style={[s.radioDot, form.phone_source === "account" && s.radioDotActive]}>
                        {form.phone_source === "account" && <View style={s.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.radioLabel}>{t("استخدام رقمي المسجل في الحساب")}</Text>
                        <Text style={s.radioSub} numberOfLines={1}>{user?.phone_verified ? (user?.phone_full || user?.phone || "") : t("يلزم توثيق رقم الحساب أولاً")}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => update("phone_source", "custom")}
                    style={[s.radioRow, form.phone_source === "custom" && s.radioRowActive]}
                    testID="post-phone-source-custom"
                >
                    <View style={[s.radioDot, form.phone_source === "custom" && s.radioDotActive]}>
                        {form.phone_source === "custom" && <View style={s.radioInner} />}
                    </View>
                    <Text style={s.radioLabel}>{t("إضافة رقم آخر مخصص لهذا الإعلان")}</Text>
                </TouchableOpacity>
                {form.phone_source === "custom" ? <View style={s.customPhoneWrap}>
                    <TextInput
                        value={form.custom_phone}
                        onChangeText={v => update("custom_phone", v.replace(/[^\d]/g, ""))}
                        placeholder={t("مثال: 5xxxxxxxx (بدون كود الدولة)")}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        style={s.customPhoneInput}
                        testID="post-custom-phone-input"
                    />
                </View> : null}
            </View> : null}
        </>;
}

// =============== Video Preview (uses expo-video) ===============
function VideoPreview({
  url,
  onRemove,
  testID
}) {
  const player = useVideoPlayer(url, p => {
    if (p) {
      p.loop = true;
      p.muted = true;
    }
  });
  return <View style={s.videoPreviewWrap} testID={testID}>
            <VideoView player={player} style={s.videoPreview} contentFit="cover" nativeControls allowsFullscreen={false} allowsPictureInPicture={false} />
            <TouchableOpacity onPress={onRemove} style={s.videoRemoveBtn} testID={`${testID}-remove`}>
                <X size={14} color="#fff" />
            </TouchableOpacity>
            <View style={s.videoBadge}>
                <Play size={10} color="#fff" fill="#fff" />
                <Text style={s.videoBadgeText}>VIDEO</Text>
            </View>
        </View>;
}

// =============== Reusable Field wrapper ===============
function Field({
  label,
  children
}) {
  return <View style={{
    marginBottom: 14
  }}>
            <Text style={s.fieldLabel}>{label}</Text>
            {children}
        </View>;
}

// =============== Market Price Hint ===============
// Calls POST /listings/suggest-price when category / brand / model change
// and shows a tappable price-range chip so the seller can adopt the median.
function MarketPriceHint({ form, country, onPick }) {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // Debounced fetch keyed on category + key identifying fields.
  const cf = form.custom_fields || {};
  const key = JSON.stringify({
    cat: form.category,
    sub: form.subcategory,
    brand: cf.phone_brand || cf.car_brand || cf.brand || cf.make,
    model: cf.phone_model || cf.car_model || cf.model,
    year: cf.year,
    cond: cf.condition,
    country: country?.code,
  });
  useEffect(() => {
    if (!form.category) return;
    let cancelled = false;
    const tid = setTimeout(async () => {
      setLoading(true);
      try {
        const { data: out } = await api.post("/listings/suggest-price", {
          category: form.category,
          subcategory: form.subcategory || null,
          custom_fields: cf,
          country_code: country?.code || "SA",
          title: form.title || null,
        });
        if (!cancelled) setData(out);
      } catch (_) {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(tid); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (loading) {
    return <View style={s.mpRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={s.mpHint}>{t("جاري حساب متوسط السوق...")}</Text></View>;
  }
  if (!data || !data.suggested) {
    return data && data.confidence === "none"
      ? <Text style={s.mpHint}>{t("لا توجد إعلانات مشابهة كافية بعد")}</Text>
      : null;
  }
  const fmt = (n) => Number(n).toLocaleString();
  return <View style={s.mpBox} testID="market-price-hint">
            <View style={s.mpHeaderRow}>
                <Text style={s.mpTitle}>💹 {t("متوسط السوق")}</Text>
                <Text style={[s.mpConf, data.confidence === "high" ? s.mpConfHigh : data.confidence === "medium" ? s.mpConfMid : s.mpConfLow]}>
                    {data.confidence === "high" ? t("ثقة عالية") : data.confidence === "medium" ? t("ثقة متوسطة") : t("عينة قليلة")}
                </Text>
            </View>
            <View style={s.mpRangeRow}>
                <View style={s.mpCell}><Text style={s.mpCellLabel}>{t("منخفض")}</Text><Text style={s.mpCellVal}>{fmt(data.p25)}</Text></View>
                <TouchableOpacity onPress={() => onPick(data.median)} style={s.mpCellMid} testID="market-price-pick-median">
                    <Text style={s.mpCellLabel}>{t("الوسيط (اضغط للاستخدام)")}</Text>
                    <Text style={s.mpCellMidVal}>{fmt(data.median)}</Text>
                </TouchableOpacity>
                <View style={s.mpCell}><Text style={s.mpCellLabel}>{t("مرتفع")}</Text><Text style={s.mpCellVal}>{fmt(data.p75)}</Text></View>
            </View>
            <Text style={s.mpFooter}>{data.note}</Text>
        </View>;
}

// =============== Select Input (modal-based) ===============
function SelectInput({
  value,
  options,
  placeholder,
  onChange
}) {
  const { t } = useI18n();
  
  const [open, setOpen] = useState(false);
  const sel = options.find(o => o.value === value);
  return <>
            <TouchableOpacity onPress={() => setOpen(true)} style={s.input}>
                <Text style={value ? s.inputText : s.inputPh}>{sel?.label || placeholder}</Text>
            </TouchableOpacity>
            <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
                <View style={s.modalBg}>
                    <View style={s.modalSheet}>
                        <Text style={s.modalTitle}>{placeholder}</Text>
                        <FlatList data={options} keyExtractor={(o, i) => `${o.value}-${i}`} renderItem={({
            item
          }) => <TouchableOpacity onPress={() => {
            onChange(item.value);
            setOpen(false);
          }} style={[s.modalRow, item.value === value && s.modalRowActive]}>
                                    <Text style={[s.modalRowText, item.value === value && {
              color: colors.primary,
              fontWeight: "900"
            }]}>{item.label}</Text>
                                    {item.value === value && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>} style={{
            maxHeight: "70%"
          }} />
                        <TouchableOpacity onPress={() => setOpen(false)} style={s.modalCloseBtn}>
                            <Text style={s.modalCloseText}>{value ? t("إغلاق") : t("إلغاء")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>;
}

// =============== Generic Picker Modal ===============
function PickerModal({
  visible,
  onClose,
  title,
  items,
  getLabel,
  onPick,
  current
}) {
  const { t } = useI18n();
  
  const [q, setQ] = useState("");
  const filtered = q ? items.filter(it => getLabel(it).includes(q)) : items;
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={s.modalBg}>
                <View style={s.modalSheet}>
                    <Text style={s.modalTitle}>{title}</Text>
                    <View style={s.searchPill}>
                        <Search size={14} color={colors.textMuted} />
                        <TextInput value={q} onChangeText={setQ} placeholder={t("ابحث...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
                    </View>
                    <FlatList data={filtered} keyExtractor={(_, i) => String(i)} renderItem={({
          item
        }) => {
          const lbl = getLabel(item);
          const isCur = (item.name_ar || lbl) === current;
          return <TouchableOpacity onPress={() => onPick(item)} style={[s.modalRow, isCur && s.modalRowActive]}>
                                    <Text style={[s.modalRowText, isCur && {
              color: colors.primary,
              fontWeight: "900"
            }]}>{lbl}</Text>
                                    {isCur && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>;
        }} style={{
          maxHeight: 400
        }} />
                    <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
                        <Text style={s.modalCloseText}>{t("إلغاء")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>;
}
function DiscoveryReadinessCard({ discovery, t }) {
  if (!discovery) return null;
  const missingLabels = {
    title_present: "العنوان", descriptive_title: "عنوان وصفي", description_present: "وصف كافٍ", location_present: "المدينة", image_present: "صورة", price_or_contact: "سعر أو طريقة تواصل", category_fields_present: "تفاصيل الفئة",
  };
  const score = Math.max(0, Math.min(100, Number(discovery.quality_score || 0)));
  const scoreColor = score >= 85 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  return <View style={s.discoveryCard} testID="post-discovery-readiness">
    <View style={s.discoveryHeader}><View style={{ flex: 1 }}><Text style={s.discoveryTitle}>{t("جاهزية الظهور والاكتشاف")}</Text><Text style={s.discoverySub}>{t("تقييم من حقائق الإعلان الحالية فقط؛ لا يضمن ترتيبًا أو فهرسة.")}</Text></View><Text style={[s.discoveryScore, { color: scoreColor }]}>{score}</Text></View>
    {!!discovery.missing?.length && <View style={s.discoveryMissing}><Text style={s.discoverySection}>{t("أكمل هذه العناصر")}</Text><Text style={s.discoveryText}>{discovery.missing.map(key => t(missingLabels[key] || key)).join(" · ")}</Text></View>}
    {!!discovery.facts?.length && <View style={s.discoveryFacts}><Text style={s.discoverySection}>{t("حقائق ستظهر للمستخدم ومحركات البحث")}</Text><Text style={s.discoveryText}>{discovery.facts.slice(0, 6).map(item => `${t(item.label)}: ${item.value}`).join(" · ")}</Text></View>}
    {!!discovery.keywords?.length && <Text style={s.discoveryKeywords}>{t("كلمات مستخرجة من الإعلان:")} {discovery.keywords.slice(0, 12).join(" · ")}</Text>}
  </View>;
}

const s = StyleSheet.create({
  guestWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  guestTitle: {
    fontSize: 16,
    color: colors.textMuted
  },
  guestBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999
  },
  guestBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 8
  },
  headBtn: {
    padding: 6
  },
  headTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: colors.text
  },
  stepDots: {
    flexDirection: "row",
    gap: 4
  },
  stepDot: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border
  },
  stepDotActive: {
    backgroundColor: colors.primary
  },
  // AI cta
  aiCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    overflow: "hidden"
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center"
  },
  aiTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13.5
  },
  aiSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10.5,
    marginTop: 2
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    fontSize: 11,
    color: colors.textMuted,
    paddingHorizontal: 10,
    fontWeight: "700"
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  catCard: {
    width: "31.5%",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    padding: 14,
    gap: 8
  },
  catIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(137,207,240,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  catName: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center"
  },
  // Entry cards (new layout: 1 big + 2 rows of 2)
  primaryEntryCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(137,207,240,0.35)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  primaryEntryIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryEntryLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1D4ED8"
  },
  primaryEntrySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: "600"
  },
  primaryEntryChev: {
    fontSize: 28,
    color: "#1D4ED8",
    fontWeight: "900",
    marginStart: 6
  },
  entryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  entryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 10
  },
  entryCard: {
    flex: 1,
    aspectRatio: 1.1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 4
  },
  entryLabel: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4
  },
  entrySub: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: "600"
  },
  // Story/Auction banner
  storyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#FCE7F3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EC4899",
    marginBottom: 14
  },
  storyBannerIcon: {
    fontSize: 24
  },
  storyBannerText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text
  },
  storyBannerSub: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2
  },
  // Step 2
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(137,207,240,0.12)",
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14
  },
  catChipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800"
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 44,
    justifyContent: "center"
  },
  inputText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600"
  },
  inputPh: {
    fontSize: 14,
    color: colors.textMuted
  },
  priceWrap: {
    position: "relative"
  },
  currencyBadge: {
    position: "absolute",
    end: 12,
    top: 13,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 12
  },
  imgBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: "center",
    gap: 5
  },
  imgBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text
  },
  thumbWrap: {
    position: "relative",
    marginEnd: 8
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12
  },
  thumbX: {
    position: "absolute",
    top: -4,
    end: -4,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center"
  },
  mainImgTag: {
    position: "absolute",
    bottom: 2,
    start: 2,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  mainImgText: {
    fontSize: 8,
    fontWeight: "900",
    color: colors.secondary
  },
  // Video preview
  videoPreviewWrap: {
    marginTop: 10,
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
    aspectRatio: 16 / 9
  },
  videoPreview: {
    width: "100%",
    height: "100%"
  },
  videoRemoveBtn: {
    position: "absolute",
    top: 6,
    end: 6,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.95)",
    alignItems: "center",
    justifyContent: "center"
  },
  videoBadge: {
    position: "absolute",
    top: 6,
    start: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  videoBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4
  },
  locBtnActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.06)"
  },
  locBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14
  },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  toggleBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  toggleText: {
    fontSize: 12.5,
    color: colors.text,
    fontWeight: "700"
  },
  // Phone source block (Phase 2)
  phoneBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8
  },
  phoneBlockTitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: "800",
    marginBottom: 2
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAFCFE"
  },
  radioRowActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(95,182,224,0.08)"
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  radioDotActive: {
    borderColor: colors.primary
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  radioLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "700"
  },
  radioSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 1
  },
  customPhoneWrap: {
    marginTop: 4
  },
  customPhoneInput: {
    backgroundColor: "#FAFCFE",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    textAlign: "right"
  },
  // Market price hint
  mpBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    gap: 8
  },
  mpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6
  },
  mpHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700"
  },
  mpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  mpTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text
  },
  mpConf: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  mpConfHigh: {
    backgroundColor: "rgba(16,185,129,0.15)",
    color: "#0F7E5C"
  },
  mpConfMid: {
    backgroundColor: "rgba(95,182,224,0.18)",
    color: colors.primaryDeep
  },
  mpConfLow: {
    backgroundColor: "rgba(245,158,11,0.18)",
    color: "#9A5A05"
  },
  mpRangeRow: {
    flexDirection: "row",
    gap: 6
  },
  mpCell: {
    flex: 1,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: "center"
  },
  mpCellMid: {
    flex: 1.3,
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center"
  },
  mpCellLabel: {
    fontSize: 9.5,
    color: colors.textMuted,
    fontWeight: "800"
  },
  mpCellVal: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text,
    marginTop: 2
  },
  mpCellMidVal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    marginTop: 2
  },
  mpFooter: {
    fontSize: 10.5,
    color: colors.textMuted,
    textAlign: "right"
  },
  // Bottom bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 12
  },
  errText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center"
  },
  discoveryCard: { marginTop: 16, marginHorizontal: 16, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, discoveryHeader: { flexDirection: "row", alignItems: "center", gap: 12 }, discoveryTitle: { color: colors.text, fontWeight: "900", fontSize: 14, textAlign: "right" }, discoverySub: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 3, textAlign: "right" }, discoveryScore: { fontSize: 27, fontWeight: "900", fontVariant: ["tabular-nums"] }, discoveryMissing: { marginTop: 10, borderRadius: 10, backgroundColor: "#FEF3C7", padding: 10 }, discoveryFacts: { marginTop: 10, borderRadius: 10, backgroundColor: "#EFF6FF", padding: 10 }, discoverySection: { color: colors.text, fontSize: 11, fontWeight: "800", textAlign: "right" }, discoveryText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 3, textAlign: "right" }, discoveryKeywords: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 10, textAlign: "right" },
  discoveryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 40, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface, borderRadius: 14, marginBottom: 8 },
  discoveryBtnText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  submitBtn: {
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    overflow: "hidden"
  },
  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15
  },
  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    maxHeight: "80%"
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 8
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  modalRowActive: {
    backgroundColor: "rgba(137,207,240,0.08)"
  },
  modalRowText: {
    fontSize: 14,
    color: colors.text
  },
  modalCloseBtn: {
    padding: 12,
    alignItems: "center",
    marginTop: 8
  },
  modalCloseText: {
    color: colors.textMuted,
    fontWeight: "700"
  },
  // Post-type selector (jobs/services) shown at the TOP of step 2.
  postTypeBox: {
    backgroundColor: "rgba(137,207,240,0.07)",
    borderColor: "rgba(137,207,240,0.35)",
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14
  },
  postTypeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    marginBottom: 10
  },
  postTypeRow: {
    flexDirection: "row",
    gap: 8
  },
  postTypeBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 10,
    alignItems: "center"
  },
  postTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  postTypeBtnLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text
  },
  postTypeBtnSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: "600"
  },
  // Services Details Box — strict 2-column grid (matches phones cascade visual style).
  detailsBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14
  },
  detailsBoxTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 10
  },
  svcRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  svcCell: {
    flex: 1
  },
  svcLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: "700"
  },
  svcHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: "italic"
  }
});