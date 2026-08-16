import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import api, { formatApiError } from "@/lib/api";
import { CarCascade, PhoneCascade, FurnitureCascade, HomeAppliancesCascade } from "@/components/CategoryCascades";
import { JobsDetailsBox, RealEstateDetailsBox } from "@/components/JobsRealEstateBoxes";
import { AuctionsDetailsBox, ServicesProDetailsBox } from "@/components/AuctionsServicesBoxes";
import { AnimalsDetailsBox, EquipmentDetailsBox } from "@/components/AnimalsEquipmentBoxes";
import * as Icons from "lucide-react";
import { Upload, X, Image as ImageIcon, Video, ChevronRight, Check, MapPin, ChevronLeft, Sparkles, Camera as CameraIcon, Sparkle, Locate, Megaphone, Gavel, Briefcase, Wrench, Film, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import GeoAutocomplete from "@/components/GeoAutocomplete";
import CitySelect from "@/components/CitySelect";
import LocationPicker from "@/components/LocationPicker";

export default function PostListing() {
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("edit");
    const { user, loading } = useAuth();
    const { t, pickName, pickLabel, lang } = useI18n();
    const { country: ctxCountryCode, openPicker } = useCountry();
    const [step, setStep] = useState(editId ? 2 : 1);
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [form, setForm] = useState({
        category: "",
        subcategory: "",
        title: "",
        description: "",
        price: "",
        currency: "ر.س",
        custom_fields: {},
        images: [],
        videos: [],
        city: "",
        district: "",
        location: {},  // { adm1: {id,name}, adm2: {id,name}, adm3: {id,name}, city: {id,name} } — Geonames-backed
        lat: null,
        lng: null,
        show_phone: true,
        contact_phone: "",
    });

    useEffect(() => {
        if (!loading && !user) nav("/login");
    }, [loading, user, nav]);

    useEffect(() => {
        api.get("/meta/categories", { params: { lang } }).then(({ data }) => setCategories(data));
        api.get("/meta/countries").then(({ data }) => setCountries(data));
    }, [lang]);

    // Derived values must be computed BEFORE any useEffect that depends on them
    // (otherwise we get a "Cannot access ... before initialization" TDZ error).
    const cat = categories.find((c) => c.key === form.category);
    const activeCountryCode = (ctxCountryCode || user?.country_code || "").toUpperCase();
    const country = countries.find((c) => c.code === activeCountryCode);

    // Load existing listing for editing
    useEffect(() => {
        if (!editId) return;
        api.get(`/listings/${editId}`).then(({ data }) => {
            setForm({
                category: data.category || "",
                subcategory: data.subcategory || "",
                title: data.title || "",
                description: data.description || "",
                price: data.price?.toString() || "",
                currency: data.currency || "ر.س",
                custom_fields: data.custom_fields || {},
                images: data.images || [],
                videos: data.videos || [],
                city: data.city || "",
                district: data.district || "",
                lat: data.lat || null,
                lng: data.lng || null,
                show_phone: data.show_phone !== false,
                contact_phone: data.contact_phone || "",
            });
        }).catch(() => alert(tr("تعذر تحميل الإعلان")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId]);

    useEffect(() => {
        if (user?.city) setForm((f) => ({ ...f, city: user.city }));
    }, [user]);

    // When user switches active country, clear stale city/district from previous country.
    useEffect(() => {
        if (!activeCountryCode) return;
        const c = countries.find((x) => x.code === activeCountryCode);
        if (!c || !form.city) return;
        const stillValid = (c.cities || []).some((x) => x.name_ar === form.city);
        if (!stillValid) {
            setForm((f) => ({ ...f, city: "", district: "" }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCountryCode, countries]);

    // Auto-suggest category from the title (keyword match + AI fallback).
    // Runs only when no category yet. Debounced.
    useEffect(() => {
        if (form.category) return;
        if (!form.title || form.title.trim().length < 4) return;
        const titleNorm = form.title.toLowerCase();
        const KEYWORDS = {
            cars: ["سيارة", "سياره", "كامري", "كرولا", "هوندا", "تويوتا", "نيسان", "بي ام", "بمب", "مرسيدس", "لكزس", "هيونداي", "كيا", "فورد", "car", "toyota", "honda", "bmw"],
            real_estate: ["شقة", "فيلا", "أرض", "ارض", "بيت", "منزل", "عمارة", "محل", "مكتب", "إيجار", "للإيجار", "تمليك", "للبيع شقة", "دور", "استراحة"],
            phones: ["ايفون", "آيفون", "iphone", "سامسونج", "samsung", "هواوي", "huawei", "شاومي", "xiaomi", "ساعة ذكية", "smart watch", "تابلت", "tablet", "ايباد", "ipad", "جوال", "موبايل", "هاتف"],
            electronics: ["لاب توب", "لابتوب", "laptop", "تلفزيون", "tv", "كمبيوتر", "سماعة", "بلايستيشن", "playstation", "اكس بوكس", "xbox", "شاشة", "مكيف", "ثلاجة", "غسالة"],
            furniture: ["كنبة", "كنب", "كرسي", "طاولة", "غرفة نوم", "سرير", "ديكور", "مفروشات", "ستارة", "خزانة"],
            fashion: ["ثوب", "عباية", "حذاء", "ملابس", "حقيبة", "شنطة", "جزمة", "فستان", "قميص", "بنطلون"],
            jobs: ["وظيفة", "موظف", "موظفة", "للعمل", "للتوظيف", "مطلوب موظف", "مطلوب عامل"],
            services: ["خدمة", "تركيب", "صيانة", "نقل عفش", "تنظيف", "سباك", "كهربائي", "دهان", "نجار"],
            pets: ["قطة", "قط ", "كلب", "كلاب", "طيور", "عصافير", "ببغاء", "اسماك", "أسماك", "هامستر", "أرنب"],
            beauty_health: ["عطر", "عطور", "مكياج", "كريم", "سيروم", "مكمل", "vitamin", "فيتامين", "perfume"],
            food: ["عسل", "تمر", "حلويات", "كيك", "أكل منزلي", "اكل منزلي", "مخبوزات", "بقالة"],
            equipment: ["لودر", "حفار", "شيول", "كرين", "خلاطة", "جرار", "مولد", "شاحنة", "تريلا", "ديانة"],
            books_courses: ["كتاب", "كتب", "رواية", "كورس", "دورة", "مذكرة", "ملخص"],
            tickets_events: ["تذاكر", "تذكرة", "حفل", "حفلة", "مباراة", "concert"],
            sports: ["دراجة", "سيكل", "جيم", "كرة", "كرسي رياضي", "تخييم", "هوب"],
            kids: ["مهد", "عربة اطفال", "كرسي سيارة", "حفاضات", "حفاظات", "العاب اطفال", "ألعاب أطفال", "لعبة طفل"],
            games: ["بلايستيشن", "ps5", "ps4", "xbox", "نينتندو", "ألعاب فيديو", "لعبة"],
            garden: ["نخلة", "ورد", "نبات", "بذور", "تربة", "سماد"],
            business: ["مشروع", "محل للبيع", "تنازل", "خلو", "شراكة"],
        };
        for (const [k, words] of Object.entries(KEYWORDS)) {
            if (words.some((w) => titleNorm.includes(w))) {
                const exists = categories.find((c) => c.key === k);
                if (exists) {
                    setForm((f) => ({ ...f, category: k }));
                    return;
                }
            }
        }
        // No keyword match — fall back to AI suggestion (debounced).
        const tid = setTimeout(async () => {
            try {
                const { data } = await api.post("/ai/suggest-category", { title: form.title.trim() });
                if (!data?.category) return;
                if (categories.find((c) => c.key === data.category)) {
                    setForm((f) => f.category ? f : { ...f, category: data.category });
                }
            } catch (_) { /* ignore — best-effort autofill */ }
        }, 1200);
        return () => clearTimeout(tid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.title]);

    // ===== Upload pipeline (parallel + client compression + per-file progress) =====
    // OLX-grade: each picked file is compressed to ~1.6MB max, 1920px max
    // dimension, then uploaded in parallel via XHR so we can report progress.
    // Heavy lifting (Canvas + WebP encode) is done by browser-image-compression
    // which itself uses a Web Worker — keeps the UI buttery while images upload.
    //
    // Limits (enforced client-side, mirrored by backend):
    //   • image: ≤ 15 MB raw, compresses to ~1.5 MB / 1920px
    //   • video: ≤ 60 MB raw, max 60s recommended
    const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
    const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
    const MAX_MODEL_BYTES = 80 * 1024 * 1024;
    const [uploads, setUploads] = useState([]); // [{ id, name, type, progress, status, url, error }]

    const xhrUpload = (url, formData, onProgress) =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
            xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch (err) { reject(err); } };
            xhr.onerror = () => reject(new Error("network"));
            xhr.send(formData);
        });

    const uploadImage = async (file, onProgress) => {
        // 1. Validate
        if (file.size > MAX_IMAGE_BYTES) throw new Error(tr("الصورة أكبر من 15 ميجابايت"));
        // 2. Compress (Web Worker → no UI freeze). Output is WebP when possible.
        let compressed = file;
        try {
            compressed = await imageCompression(file, {
                maxSizeMB: 1.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: "image/webp",
                initialQuality: 0.82,
            });
        } catch (_) {
            // Compression failed (e.g., HEIC on some browsers). Fall back to original.
            compressed = file;
        }
        // 3. Get signed upload params from backend
        const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "image", folder: "listings" } });
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("api_key", sig.api_key);
        fd.append("timestamp", sig.timestamp);
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        // 4. XHR upload with progress
        const out = await xhrUpload(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, fd, onProgress);
        return out.secure_url;
    };

    const uploadVideo = async (file, onProgress) => {
        if (file.size > MAX_VIDEO_BYTES) throw new Error(tr("الفيديو أكبر من 60 ميجابايت"));
        const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "video", folder: "listings" } });
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.api_key);
        fd.append("timestamp", sig.timestamp);
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const out = await xhrUpload(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, fd, onProgress);
        return out.secure_url;
    };

    const uploadModel3D = async (file, onProgress) => {
        if (file.size > MAX_MODEL_BYTES) throw new Error(tr("ملف 3D أكبر من 80 ميجابايت"));
        const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "raw", folder: "listings" } });
        const fd = new FormData(); fd.append("file", file); fd.append("api_key", sig.api_key); fd.append("timestamp", sig.timestamp); fd.append("signature", sig.signature); fd.append("folder", sig.folder);
        const out = await xhrUpload(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/raw/upload`, fd, onProgress);
        return out.secure_url;
    };

    const onFiles = async (files, type = "image") => {
        setErr("");
        const arr = Array.from(files);
        if (!arr.length) return;
        // Seed the progress tracker so the UI shows all files at 0% immediately.
        const seeds = arr.map((f, i) => ({
            id: `${Date.now()}-${i}`,
            name: f.name,
            type,
            progress: 0,
            status: "uploading",
            url: null,
            error: null,
        }));
        setUploads((u) => [...u, ...seeds]);
        setBusy(true);
        // 🚀 Parallel — Promise.all so 5 photos go in 5 lanes, not one after another.
        const results = await Promise.all(seeds.map(async (seed, idx) => {
            const file = arr[idx];
            const setProg = (p) => setUploads((u) => u.map((it) => it.id === seed.id ? { ...it, progress: p } : it));
            try {
                const url = type === "image"
                    ? await uploadImage(file, setProg)
                    : type === "video" ? await uploadVideo(file, setProg) : await uploadModel3D(file, setProg);
                setUploads((u) => u.map((it) => it.id === seed.id ? { ...it, progress: 100, status: "done", url } : it));
                return url;
            } catch (e) {
                setUploads((u) => u.map((it) => it.id === seed.id ? { ...it, status: "error", error: e?.message || "failed" } : it));
                return null;
            }
        }));
        const okUrls = results.filter(Boolean);
        if (okUrls.length) {
            setForm((f) => type === "model"
                ? { ...f, custom_fields: { ...f.custom_fields, model_3d_url: okUrls[0] } }
                : { ...f, [type === "image" ? "images" : "videos"]: [...f[type === "image" ? "images" : "videos"], ...okUrls] });
        }
        if (okUrls.length !== arr.length) {
            setErr(tr("بعض الملفات فشل رفعها"));
        }
        setBusy(false);
        // Auto-clear completed entries after 2.5s so the row list doesn't grow.
        setTimeout(() => {
            setUploads((u) => u.filter((it) => it.status === "uploading" || it.status === "error"));
        }, 2500);
    };


    const submit = async () => {
        setErr("");
        setBusy(true);
        try {
            const payload = {
                ...form,
                price: form.price ? parseFloat(form.price) : null,
                country_code: activeCountryCode || undefined,  // STRICT: post in active country
            };
            if (editId) {
                const { data } = await api.put(`/listings/${editId}`, payload);
                api.delete("/users/me/draft-listing").catch(() => {});
                nav(`/listing/${data.id}`);
            } else {
                const { data } = await api.post("/listings", payload);
                api.delete("/users/me/draft-listing").catch(() => {});
                nav(`/listing/${data.id}`);
            }
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || e.message || "فشل النشر");
        } finally { setBusy(false); }
    };

    // Save a lightweight draft snapshot whenever the user makes meaningful progress
    // in Step 2. If they leave without publishing, the backend worker will nudge
    // them with a push notification after ~10 minutes. Debounced to avoid spam.
    useEffect(() => {
        if (editId) return;            // editing existing — no draft tracking
        if (step !== 2) return;
        if (!form.title && !form.category) return;
        const tid = setTimeout(() => {
            api.post("/users/me/draft-listing", {
                title: form.title || "",
                category: form.category || "",
                city: form.city || "",
                price: form.price ? parseFloat(form.price) : null,
                images_count: (form.images || []).length,
            }).catch(() => {});
        }, 1500);
        return () => clearTimeout(tid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, form.title, form.category, form.city, form.price, form.images]);

    const aiSuggestPrice = async () => {
        try {
            const { data } = await api.post("/ai/price-suggest", {
                category: form.category,
                custom_fields: form.custom_fields,
                title: form.title,
                country_code: user?.country_code,
            });
            if (data.suggested_min) {
                setForm((f) => ({ ...f, price: String(Math.round((data.suggested_min + data.suggested_max) / 2)) }));
                alert(`💡 ${data.note}\nنطاق السوق: ${data.suggested_min.toLocaleString()} - ${data.suggested_max.toLocaleString()}`);
            } else {
                alert(data.note || "لا توجد بيانات كافية");
            }
        } catch (_) { alert(tr("تعذر اقتراح السعر")); }
    };

    // Sell-with-AI: upload image and auto-fill listing fields
    const [aiBusy, setAiBusy] = useState(false);
    const [geoBusy, setGeoBusy] = useState(false);
    const [geoMsg, setGeoMsg] = useState("");

    // Try to auto-fill the cascading location picker from the user's GPS.
    // Primary: hit our Geonames-backed /locations/locate (returns full path).
    // Fallback: legacy /geo/reverse (city/district strings only).
    const geoLocateAndFill = () => {
        if (!navigator.geolocation) { setGeoMsg(tr("❌ المتصفح لا يدعم تحديد الموقع")); return; }
        setGeoBusy(true); setGeoMsg("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                // 1) Try Geonames cascading reverse-geocode.
                try {
                    const { data } = await api.get("/locations/locate", {
                        params: { lat, lng, country: country?.code || "EG", lang },
                    });
                    const sel = data?.selection || {};
                    const leaf = sel.city || sel.adm3 || sel.adm2 || sel.adm1;
                    if (leaf) {
                        setForm((f) => ({
                            ...f,
                            lat, lng,
                            location: sel,
                            city: sel.adm2?.name || sel.adm1?.name || leaf.name,
                            district: sel.adm3?.name || sel.city?.name || "",
                        }));
                        setGeoMsg(`✓ ${tr("تم اقتراح:")} ${leaf.name} ${tr("(يمكنك تغييرها)")}`);
                        setGeoBusy(false);
                        return;
                    }
                } catch (_) { /* fall through to legacy reverse */ }
                // 2) Legacy fallback.
                try {
                    const { data } = await api.get("/geo/reverse", { params: { lat, lng, lang: "ar" } });
                    if (data.out_of_area) {
                        setGeoMsg(tr("⚠️ موقعك خارج المنطقة المدعومة (الخليج + مصر). يرجى اختيار المدينة يدوياً."));
                    } else if (!data.city) {
                        setGeoMsg(tr("⚠️ تعذّر تحديد المدينة من موقعك. اختر يدوياً من القائمة."));
                    } else {
                        setForm((f) => ({
                            ...f,
                            lat, lng,
                            city: data.city,
                            district: data.district || "",
                        }));
                        setGeoMsg(`✓ ${tr("تم اقتراح:")} ${data.city}${data.district ? " — " + data.district : ""} ${tr("(يمكنك تغييرها)")}`);
                    }
                } catch (_) {
                    setGeoMsg(tr("⚠️ تعذّر الاتصال بخدمة الموقع. حاول لاحقاً."));
                } finally { setGeoBusy(false); }
            },
            (err) => {
                setGeoBusy(false);
                const msg = err?.code === 1
                    ? tr("⚠️ رفضت الإذن للوصول للموقع. فعّل الموقع من إعدادات المتصفح ثم حاول مرة أخرى.")
                    : tr("⚠️ تعذّر الوصول للموقع. تأكد من تفعيل GPS.");
                setGeoMsg(msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    const sellWithAI = async (file) => {
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) { alert(tr("حجم الصورة كبير جداً (الحد الأقصى 8MB)")); return; }
        setAiBusy(true); setErr("");
        try {
            // Upload image to cloudinary first
            const imageUrl = await uploadImage(file);
            // Convert to base64 for AI
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const { data } = await api.post("/ai/listing-autofill", { image_base64: dataUrl });
            const midPrice = data.suggested_price_min && data.suggested_price_max
                ? Math.round((data.suggested_price_min + data.suggested_price_max) / 2)
                : "";
            setForm((f) => ({
                ...f,
                category: data.category_key || f.category,
                title: data.title || f.title,
                description: data.description || f.description,
                price: midPrice ? String(midPrice) : f.price,
                images: imageUrl ? [imageUrl, ...f.images] : f.images,
            }));
            setStep(2);
            alert(tr("✨ تم تعبئة الإعلان بالذكاء الاصطناعي! راجع التفاصيل وعدّل ما تشاء."));
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || tr("فشل تحليل الصورة بالذكاء الاصطناعي"));
        } finally { setAiBusy(false); }
    };

    const canNext = () => {
        // Step 1 auto-advances on card click; skip the "category required" gate here.
        if (step === 1) return true;
        if (step === 2) return form.title && form.description && form.city;
        return true;
    };

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24">
            <div className="mb-6">
                <h1 className="font-arabic font-black text-2xl sm:text-3xl text-[var(--text)] mb-2">{t("post_title")}</h1>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex-1 flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-arabic transition-all ${step >= n ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"}`}>
                                {step > n ? <Check className="w-4 h-4" /> : n}
                            </div>
                            {n < 4 && <div className={`flex-1 h-0.5 transition-all ${step > n ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}></div>}
                        </div>
                    ))}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-2 font-arabic-body">
                    {step === 1 && tr("الخطوة 1: اختر الفئة المناسبة لإعلانك")}
                    {step === 2 && tr("الخطوة 2: أضف التفاصيل والمواصفات")}
                    {step === 3 && tr("الخطوة 3: ارفع الصور والفيديو")}
                    {step === 4 && tr("الخطوة 4: حدد الموقع وأكّد النشر")}
                </div>
            </div>

            {err && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}

            {/* Step 1: Category */}
            {step === 1 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)]">
                    {/* Sell with AI - hero CTA */}
                    <label data-testid="sell-with-ai-btn" className={`block relative overflow-hidden rounded-2xl border-2 border-[#4FB6E6] bg-gradient-to-br from-[#4FB6E6]/15 to-[#D4AF37]/10 p-4 mb-5 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all ${aiBusy ? "pointer-events-none opacity-70" : ""}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => sellWithAI(e.target.files?.[0])} />
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4FB6E6] to-[#2196D9] flex items-center justify-center shrink-0 shadow-lg">
                                {aiBusy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkle className="w-6 h-6 text-white" />}
                            </div>
                            <div className="flex-1">
                                <div className="font-arabic font-black text-base text-[var(--text)] flex items-center gap-1.5">
                                    {tr("بِع بالذكاء الاصطناعي")} <span className="bg-[#D4AF37] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">AI</span>
                                </div>
                                <div className="font-arabic-body text-xs text-[var(--text-muted)] mt-0.5">
                                    {aiBusy ? tr("جارٍ تحليل الصورة...") : tr("ارفع صورة المنتج وسنُعبّئ العنوان والوصف والسعر تلقائياً")}
                                </div>
                            </div>
                            <CameraIcon className="w-6 h-6 text-[#4FB6E6] shrink-0" />
                        </div>
                    </label>

                    {/* Main actions per user spec:
                        1) Big "Add Listing" with "كل الفئات" subtitle  → goes to Step 2 to pick category
                        2) Row of 2 big cards: نشر ستوري + إنشاء مزاد
                        3) Row of 2 cards: وظائف + خدمات
                    */}
                    <h2 className="font-arabic font-black text-lg text-[var(--text)] mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" /> {tr("ماذا تريد أن تنشر؟")}
                    </h2>

                    {/* Primary CTA: Add Listing (full width) */}
                    <button
                        type="button"
                        data-testid="entry-listing"
                        onClick={() => { setForm({ ...form, custom_fields: {} }); setStep(2); }}
                        className="w-full mb-3 relative overflow-hidden rounded-2xl border-2 border-[var(--primary)]/60 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 p-5 text-start hover:scale-[1.01] hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-black/30 flex items-center justify-center shadow-sm shrink-0">
                                <Megaphone className="w-7 h-7 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-arabic font-black text-lg text-blue-700 dark:text-blue-300">{tr("إضافة إعلان")}</h3>
                                <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-0.5">{tr("كل الفئات — سيارات • عقارات • إلكترونيات • أثاث • أزياء ...")}</p>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-blue-600 shrink-0" />
                        </div>
                    </button>

                    {/* Row 1: Story + Auction */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                            type="button"
                            data-testid="entry-story"
                            onClick={() => { setForm({ ...form, subcategory: "story", custom_fields: { is_story: true } }); setStep(2); }}
                            className="relative overflow-hidden rounded-2xl border-2 border-pink-400/60 bg-gradient-to-br from-pink-100 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/10 p-4 text-start aspect-[5/4] flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-white/70 dark:bg-black/30 flex items-center justify-center shadow-sm">
                                <Film className="w-6 h-6 text-pink-600" />
                            </div>
                            <div>
                                <h3 className="font-arabic font-black text-base text-pink-600">{tr("نشر ستوري")}</h3>
                                <p className="text-[11px] text-[var(--text-muted)] font-arabic-body line-clamp-1">{tr("فيديو قصير")}</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            data-testid="entry-auction"
                            onClick={() => { setForm({ ...form, category: "auctions", subcategory: "", custom_fields: { is_auction: true } }); setStep(2); }}
                            className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/10 p-4 text-start aspect-[5/4] flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-white/70 dark:bg-black/30 flex items-center justify-center shadow-sm">
                                <Gavel className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-arabic font-black text-base text-amber-600">{tr("إنشاء مزاد")}</h3>
                                <p className="text-[11px] text-[var(--text-muted)] font-arabic-body line-clamp-1">{tr("ابدأ مزايدة حية")}</p>
                            </div>
                        </button>
                    </div>

                    {/* Row 2: Jobs + Services */}
                    <div className="grid grid-cols-2 gap-3">
                        <button data-testid="quick-jobs" type="button" onClick={() => { setForm({ ...form, category: "jobs", subcategory: "", custom_fields: {} }); setStep(2); }}
                            className="relative overflow-hidden rounded-2xl p-4 border-2 border-[var(--border)] bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 hover:border-emerald-400 text-start transition-all">
                            <Briefcase className="w-7 h-7 text-emerald-600 mb-2" />
                            <h3 className="font-arabic font-black text-base text-[var(--text)]">{tr("وظائف 💼")}</h3>
                            <p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("عرض وظيفة • طلب عمل")}</p>
                        </button>
                        <button data-testid="quick-services" type="button" onClick={() => { setForm({ ...form, category: "services", subcategory: "", custom_fields: {} }); setStep(2); }}
                            className="relative overflow-hidden rounded-2xl p-4 border-2 border-[var(--border)] bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:border-orange-400 text-start transition-all">
                            <Wrench className="w-7 h-7 text-orange-600 mb-2" />
                            <h3 className="font-arabic font-black text-base text-[var(--text)]">{tr("خدمات 🔧")}</h3>
                            <p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("سباك • كهربائي • نظافة • نقل ...")}</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                    {/* Mode banners */}
                    {form.custom_fields?.is_story && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50 dark:bg-pink-900/20 border border-pink-300 dark:border-pink-700">
                            <Film className="w-5 h-5 text-pink-600 shrink-0" />
                            <div className="flex-1">
                                <div className="font-arabic font-black text-sm text-[var(--text)]">{tr("وضع الستوري — فيديو قصير مطلوب")}</div>
                                <div className="font-arabic-body text-[11px] text-[var(--text-muted)]">{tr("ارفع فيديو + عنوان + سعر + مدينة. لا حاجة لتفاصيل كثيرة.")}</div>
                            </div>
                        </div>
                    )}
                    {form.custom_fields?.is_auction && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700">
                            <Gavel className="w-5 h-5 text-amber-600 shrink-0" />
                            <div className="flex-1">
                                <div className="font-arabic font-black text-sm text-[var(--text)]">{tr("وضع المزاد")}</div>
                                <div className="font-arabic-body text-[11px] text-[var(--text-muted)]">{tr("السعر الذي تضعه هنا = السعر الابتدائي للمزايدة.")}</div>
                            </div>
                        </div>
                    )}
                    {form.custom_fields?.is_deal && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
                            <Tag className="w-5 h-5 text-red-600 shrink-0" />
                            <div className="flex-1">
                                <div className="font-arabic font-black text-sm text-[var(--text)]">{tr("وضع صفقة اليوم")}</div>
                                <div className="font-arabic-body text-[11px] text-[var(--text-muted)]">{tr("يظهر إعلانك في قسم الصفقات المميزة بسعر منافس.")}</div>
                            </div>
                        </div>
                    )}

                    <h2 className="font-arabic font-bold text-lg text-[var(--text)]">{t("listing_details")}</h2>

                    {/* ===== Services-only Listing Type selector at TOP =====
                        User explicitly requested this before title + description so the
                        intent (Offer vs Request) is the first decision. */}
                    {form.category === "services" && (
                        <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 border-2 border-[var(--primary)]/30 rounded-2xl p-3" data-testid="services-post-type-top">
                            <label className="block text-sm font-arabic font-black text-[var(--text)] mb-2 text-center">
                                🔧 {tr("ما نوع الإعلان؟")}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    data-testid="post-type-service-offer"
                                    onClick={() => setForm({ ...form, custom_fields: { ...form.custom_fields, post_type: "تقديم خدمة" } })}
                                    className={`rounded-xl py-3 px-3 font-arabic font-black text-sm border-2 transition-all ${form.custom_fields.post_type === "تقديم خدمة" ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                                >
                                    🟢 {tr("تقديم خدمة")}
                                    <div className="text-[10px] font-arabic-body font-normal opacity-80 mt-0.5">{tr("أنا مقدّم خدمة")}</div>
                                </button>
                                <button
                                    type="button"
                                    data-testid="post-type-service-request"
                                    onClick={() => setForm({ ...form, custom_fields: { ...form.custom_fields, post_type: "طلب خدمة" } })}
                                    className={`rounded-xl py-3 px-3 font-arabic font-black text-sm border-2 transition-all ${form.custom_fields.post_type === "طلب خدمة" ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                                >
                                    🔵 {tr("طلب خدمة")}
                                    <div className="text-[10px] font-arabic-body font-normal opacity-80 mt-0.5">{tr("أحتاج هذه الخدمة")}</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== Jobs-only Listing Type selector at TOP =====
                        Mirrors services. User explicitly requested at the very TOP
                        (before title) so the user decides Hiring vs Looking-for-Work first. */}
                    {form.category === "jobs" && (
                        <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 border-2 border-[var(--primary)]/30 rounded-2xl p-3" data-testid="jobs-post-type-top">
                            <label className="block text-sm font-arabic font-black text-[var(--text)] mb-2 text-center">
                                💼 {tr("ما نوع الإعلان؟")}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    data-testid="post-type-job-offer"
                                    onClick={() => setForm({ ...form, custom_fields: { ...form.custom_fields, post_type: "عرض وظيفة" }, subcategory: "job_offer" })}
                                    className={`rounded-xl py-3 px-3 font-arabic font-black text-sm border-2 transition-all ${form.custom_fields.post_type === "عرض وظيفة" ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                                >
                                    🟢 {tr("عرض وظيفة")}
                                    <div className="text-[10px] font-arabic-body font-normal opacity-80 mt-0.5">{tr("أنا أوظّف شخص")}</div>
                                </button>
                                <button
                                    type="button"
                                    data-testid="post-type-job-seeker"
                                    onClick={() => setForm({ ...form, custom_fields: { ...form.custom_fields, post_type: "باحث عن عمل" }, subcategory: "job_seeker" })}
                                    className={`rounded-xl py-3 px-3 font-arabic font-black text-sm border-2 transition-all ${form.custom_fields.post_type === "باحث عن عمل" ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                                >
                                    🔵 {tr("باحث عن عمل")}
                                    <div className="text-[10px] font-arabic-body font-normal opacity-80 mt-0.5">{tr("أنا أبحث عن وظيفة")}</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TITLE FIRST — so auto-suggest can fill the category dropdown below. */}
                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("title")} *</label>
                        <input data-testid="post-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("مثال: تويوتا كامري 2020 — وارد الخليج")} />
                    </div>

                    {/* Category dropdown — pre-filled by auto-suggest from the title above. */}
                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">
                            {tr("التصنيف")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                data-testid="category-dropdown"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })}
                                className="w-full appearance-none bg-[var(--surface-elevated)] rounded-xl px-3 py-3 pr-10 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body cursor-pointer"
                            >
                                <option value="">{tr("— اختر التصنيف —")}</option>
                                {categories.map((c) => (
                                    <option key={c.key} value={c.key}>{pickName(c)}</option>
                                ))}
                            </select>
                            <ChevronLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] -rotate-90 pointer-events-none" />
                        </div>
                        {!form.category && form.title && form.title.length >= 4 && (
                            <p className="text-[11px] text-[var(--primary)] mt-1.5 font-arabic-body flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {tr("سنقترح الفئة تلقائياً من العنوان أثناء الكتابة")}
                            </p>
                        )}
                        {form.category && (
                            <p className="text-[11px] text-emerald-600 mt-1.5 font-arabic-body flex items-center gap-1">
                                ✓ {tr("الفئة:")} <span className="font-bold">{pickName(categories.find((c) => c.key === form.category))}</span>
                            </p>
                        )}
                    </div>

                    {/* Cascading brand→model→year→trim for cars only. Phones cascade lives
                        AFTER the description as a Details Box. */}
                    {form.category === "cars" && (
                        <CarCascade
                            value={form.custom_fields}
                            onChange={(patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } })}
                            tr={tr}
                        />
                    )}

                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("description")} *</label>
                        <textarea data-testid="post-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("اكتب وصفاً تفصيلياً...")} />
                    </div>

                    {/* ===== PHONES Details Box (placed AFTER description, BEFORE price) =====
                        Strict 2-column grid (brand | model / storage | color / condition | RAM /
                        warranty | —). Lives inside <CarCascade/PhoneCascade> components which
                        already render `grid grid-cols-2`. Generic renderer below is suppressed
                        for `phones` so there are zero duplicates. */}
                    {form.category === "phones" && (
                        <PhoneCascade
                            value={form.custom_fields}
                            onChange={(patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } })}
                            tr={tr}
                        />
                    )}

                    {/* ===== FURNITURE Details Box (AFTER description) =====
                        Strict 2-col, mirrors PhoneCascade visual style. Generic renderer below
                        is suppressed for `furniture` so there are zero duplicates. */}
                    {form.category === "furniture" && (
                        <FurnitureCascade
                            value={form.custom_fields}
                            onChange={(patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } })}
                            tr={tr}
                        />
                    )}

                    {/* ===== HOME APPLIANCES Details Box (AFTER description) =====
                        Strict 2-col. Wired for `electronics` category (where أجهزة منزلية lives
                        in seed_data subcategories). Generic renderer below is suppressed. */}
                    {form.category === "electronics" && (
                        <HomeAppliancesCascade
                            value={form.custom_fields}
                            onChange={(patch) => setForm({ ...form, custom_fields: { ...form.custom_fields, ...patch } })}
                            tr={tr}
                        />
                    )}

                    {/* ===== SERVICES PRO Details Box (AFTER description) =====
                        Strict 2-col with full conditional logic per service_type bucket
                        (delivery / cleaning / dev / education). Generic renderer below is
                        suppressed for `services` → no duplicates. */}
                    {form.category === "services" && (
                        <ServicesProDetailsBox form={form} setForm={setForm} tr={tr} />
                    )}

                    {/* ===== AUCTIONS Details Box (AFTER description) =====
                        Strict 2-col, 5 rows × 2 fields. Auto-calculates end_time from duration;
                        flags low bid_increment and buy_now_below_start with inline warnings.
                        Generic renderer below is suppressed for `auctions` → no duplicates. */}
                    {form.category === "auctions" && (
                        <AuctionsDetailsBox form={form} setForm={setForm} tr={tr} currency={country?.currency || "ر.س"} />
                    )}

                    {/* ===== ANIMALS / LIVESTOCK Details Box (AFTER description) =====
                        Strict 2-col, 5 base rows + conditional branches (طيور adds 1 row,
                        خيول adds 1 row). breed cascade is bound to animal_type. Price renders
                        inside the box → standalone price block is suppressed for `livestock`. */}
                    {form.category === "livestock" && (
                        <AnimalsDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
                    )}

                    {/* ===== EQUIPMENT / HEAVY MACHINERY Details Box (AFTER description) =====
                        Strict 2-col, 5 base rows + rental block (rental_period +
                        insurance_required) when rental_or_sale includes إيجار. Generic renderer
                        is suppressed for `equipment`. */}
                    {form.category === "equipment" && (
                        <EquipmentDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
                    )}

                    {form.category !== "jobs" && form.category !== "services" && form.category !== "realestate" && form.category !== "auctions" && form.category !== "livestock" && form.category !== "equipment" && (
                        <div>
                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("price")}</label>
                            <div className="flex gap-2 items-stretch">
                                <div className="flex-1 min-w-0 relative">
                                    <input data-testid="post-price" type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl ps-4 pe-16 py-3 text-base border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold tracking-wider" placeholder={tr("اتركه فارغاً للسوم")} style={{ minHeight: "48px" }} />
                                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--primary)] font-arabic-body pointer-events-none whitespace-nowrap">{country?.currency || "ر.س"}</span>
                                </div>
                                <button type="button" data-testid="ai-price-btn" onClick={aiSuggestPrice} className="shrink-0 flex items-center gap-1 bg-gradient-to-r from-[var(--accent)] to-amber-400 text-[var(--secondary)] rounded-xl px-3 py-2.5 text-xs font-bold font-arabic" style={{ minHeight: "48px" }}>
                                    <Sparkle className="w-3.5 h-3.5" /> {t("ai_price_suggest")}
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] font-arabic-body mt-1.5">{tr("💡 يمكنك إدخال أرقام كبيرة بدون قلق — العملة تظهر داخل الحقل")}</p>
                        </div>
                    )}

                    {/* ===== JOBS Details Box (full OLX/Haraj-level spec) =====
                        Strict 2-column grid. Generic renderer below is suppressed for `jobs`. */}
                    {form.category === "jobs" && (
                        <JobsDetailsBox form={form} setForm={setForm} tr={tr} />
                    )}

                    {/* ===== REAL ESTATE Details Box (full OLX/Haraj-level spec) =====
                        Strict 2-column grid. Price moves INTO the box (global price hidden
                        for realestate). Generic renderer below is suppressed for `realestate`. */}
                    {form.category === "realestate" && (
                        <RealEstateDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
                    )}

                    {/* Custom fields for category — skip post_type since it's at the top for jobs/services */}
                    {/* Generic dynamic fields renderer (from i18n_data CATEGORIES.fields).
                        Skipped entirely for cars / phones / services / jobs / realestate /
                        furniture / electronics — each has its own structured Details Box above. */}
                    {!(form.category === "cars" || form.category === "phones" || form.category === "services" || form.category === "jobs" || form.category === "realestate" || form.category === "furniture" || form.category === "electronics" || form.category === "auctions" || form.category === "livestock" || form.category === "equipment") && cat?.fields?.filter((f) => f.key !== "post_type").map((f) => (
                        <div key={f.key}>
                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">
                                {pickLabel(f)} {f.required && <span className="text-red-500">*</span>}
                            </label>
                            {f.type === "select" ? (
                                <select data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body">
                                    <option value="">{tr("اختر...")}</option>
                                    {(f.options_ar || f.options || []).map((canonical, i) => {
                                        const label = (f.options && f.options[i]) || canonical;
                                        return <option key={canonical} value={canonical}>{label}</option>;
                                    })}
                                </select>
                            ) : f.type === "number" || f.type === "date" || f.type === "url" ? (
                                <input data-testid={`field-${f.key}`} type={f.type} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
                            ) : (
                                <input data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
                            )}
                        </div>
                    ))}

                    <div>
                        <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                            <label className="block text-sm font-arabic font-bold text-[var(--text)]">
                                {tr("المدينة")} <span className="text-red-500">*</span>
                                {country?.flag && <span className="ms-2 text-[11px] font-normal text-[var(--text-muted)]">({country.flag} {country.name_ar})</span>}
                            </label>
                            <button
                                type="button"
                                data-testid="post-geo-locate-btn"
                                onClick={geoLocateAndFill}
                                disabled={geoBusy}
                                className="text-[11px] font-arabic font-bold text-emerald-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                title={tr("اقترح المدينة والحي من موقعك الحالي")}
                            >
                                {geoBusy
                                    ? <><span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span> {tr("جاري التحديد...")}</>
                                    : <><Locate className="w-3 h-3" /> {tr("📍 استخدم موقعي")}</>}
                            </button>
                        </div>
                        {geoMsg && (
                            <div className="text-[11px] font-arabic-body mb-2 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {geoMsg}
                            </div>
                        )}
                        <LocationPicker
                            country={country?.code || "EG"}
                            value={form.location || {}}
                            onChange={(next) => {
                                // Mirror the legacy `city`/`district` string fields so the
                                // existing backend / draft-listing flow keeps working.
                                const leaf = next.city || next.adm3 || next.adm2 || next.adm1;
                                const district = next.city ? (next.adm3?.name || "") : "";
                                setForm({
                                    ...form,
                                    location: next,
                                    city: next.adm2?.name || next.adm1?.name || leaf?.name || "",
                                    district: next.adm3?.name || (next.city?.name && district) || "",
                                });
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Media */}
            {step === 3 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                    <h2 className="font-arabic font-bold text-lg text-[var(--text)]">{t("upload_media")}</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="cursor-pointer bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] py-6 flex flex-col items-center justify-center gap-2 transition-all">
                            <ImageIcon className="w-6 h-6 text-[var(--primary)]" />
                            <span className="font-arabic font-bold text-xs text-[var(--text)]">{t("gallery")}</span>
                            <input data-testid="upload-images" type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files, "image")} disabled={busy} />
                        </label>
                        <label className="cursor-pointer bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] py-6 flex flex-col items-center justify-center gap-2 transition-all">
                            <CameraIcon className="w-6 h-6 text-[var(--primary)]" />
                            <span className="font-arabic font-bold text-xs text-[var(--text)]">{t("camera")}</span>
                            <input data-testid="capture-camera" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFiles(e.target.files, "image")} disabled={busy} />
                        </label>
                        <label className="cursor-pointer bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] py-6 flex flex-col items-center justify-center gap-2 transition-all">
                            <Video className="w-6 h-6 text-[var(--accent)]" />
                            <span className="font-arabic font-bold text-xs text-[var(--text)]">{tr("فيديو")}</span>
                            <input data-testid="upload-videos" type="file" accept="video/*" className="hidden" onChange={(e) => onFiles(e.target.files, "video")} disabled={busy} />
                        </label>
                        <label className="cursor-pointer bg-[var(--surface-elevated)] hover:bg-cyan-500/10 rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 py-6 flex flex-col items-center justify-center gap-2 transition-all">
                            <Icons.Box className="w-6 h-6 text-cyan-500" />
                            <span className="font-arabic font-bold text-xs text-[var(--text)]">{tr("نموذج 3D")}</span>
                            <input data-testid="upload-model-3d" type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="hidden" onChange={(e) => onFiles(e.target.files, "model")} disabled={busy} />
                        </label>
                    </div>
                    <div className="mt-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs font-arabic-body text-[var(--text-muted)]">
                        <div className="font-arabic font-black text-[var(--text)] mb-1">{tr("لا تملك ملف GLB أو GLTF؟")}</div>
                        <p>{tr("حوّل صور المنتج أو الفيديو إلى نموذج 3D في خدمة خارجية، نزّل الملف بصيغة GLB ثم ارفعه هنا. جودة النموذج تعتمد على الصور؛ راجع شروط الخدمة والخصوصية قبل رفع الصور.")}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <a href="https://www.meshy.ai/features/image-to-3d" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] font-arabic font-bold">Meshy — Image to 3D</a>
                            <a href="https://poly.cam/tools/photogrammetry" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] font-arabic font-bold">Polycam — Photogrammetry</a>
                        </div>
                    </div>
                    {/* Per-file upload progress — replaces the generic busy spinner.
                        Shows live percentage from XHR upload events, including failed rows. */}
                    {uploads.length > 0 && (
                        <div data-testid="upload-progress-list" className="space-y-1.5">
                            {uploads.map((u) => (
                                <div key={u.id} className={`bg-[var(--surface-elevated)] rounded-xl px-3 py-2 border ${u.status === "error" ? "border-red-300" : u.status === "done" ? "border-emerald-300" : "border-[var(--border)]"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {u.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <Video className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                                        <span className="font-arabic-body text-xs text-[var(--text)] truncate flex-1">{u.name}</span>
                                        <span className="font-latin font-bold text-[10px] tabular-nums" data-testid={`progress-${u.id}`}>
                                            {u.status === "error" ? tr("فشل") : u.status === "done" ? "✓" : `${u.progress}%`}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[var(--border)]/40 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-200 ${u.status === "error" ? "bg-red-500" : u.status === "done" ? "bg-emerald-500" : "bg-[var(--primary)]"}`}
                                            style={{ width: `${u.status === "error" ? 100 : u.progress}%` }}
                                        />
                                    </div>
                                    {u.error && <div className="text-[10px] text-red-500 mt-1 font-arabic-body">{u.error}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                    {form.images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {form.images.map((src, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)]">
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                    <button data-testid={`remove-img-${i}`} onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    {form.videos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                            {form.videos.map((src, i) => (
                                <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black">
                                    <video src={src} controls className="w-full h-full object-cover" />
                                    <button data-testid={`remove-vid-${i}`} onClick={() => setForm({ ...form, videos: form.videos.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Location + Confirm */}
            {step === 4 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="font-arabic font-bold text-lg text-[var(--text)] flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--primary)]" />{tr(" حدد الموقع")}</h2>
                        <button type="button" data-testid="use-my-location-btn" onClick={() => {
                            if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
                            navigator.geolocation.getCurrentPosition(
                                (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
                                () => alert(tr("تعذر الوصول للموقع. تأكد من السماح بالموقع"))
                            );
                        }} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 font-arabic">
                            <Locate className="w-3.5 h-3.5" /> {t("use_my_location")}
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("اضغط على الخريطة أو استخدم زر الموقع الحالي")}</p>
                    <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-[var(--border)]">
                        <MapContainer center={[form.lat || 24.7136, form.lng || 46.6753]} zoom={form.lat ? 14 : 6} className="w-full h-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            <ClickHandler onClick={(latlng) => setForm({ ...form, lat: latlng.lat, lng: latlng.lng })} />
                            {form.lat && <Marker position={[form.lat, form.lng]} />}
                        </MapContainer>
                    </div>
                    {form.lat && <div className="text-xs text-[var(--success)] font-arabic-body">{tr("✓ تم تحديد الموقع")}</div>}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input data-testid="show-phone-checkbox" type="checkbox" checked={form.show_phone} onChange={(e) => setForm({ ...form, show_phone: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
                        <span className="text-sm font-arabic-body text-[var(--text)]">{t("show_phone")}</span>
                    </label>

                    {/* Optional override phone for this listing (different from account phone).
                        Pre-fills the user's signup phone + shows the correct country code
                        placeholder based on the active country (NOT always +966). */}
                    {form.show_phone && (() => {
                        const DIAL_BY_CC = { SA: "+966", AE: "+971", KW: "+965", QA: "+974", BH: "+973", OM: "+968", EG: "+20" };
                        const PLACEHOLDER_BY_CC = {
                            SA: "+966 5X XXX XXXX", AE: "+971 5X XXX XXXX", KW: "+965 XXXX XXXX",
                            QA: "+974 XXXX XXXX", BH: "+973 XXXX XXXX", OM: "+968 XXXX XXXX",
                            EG: "+20 1X XXXX XXXX",
                        };
                        const dial = DIAL_BY_CC[activeCountryCode] || "+966";
                        const ph = PLACEHOLDER_BY_CC[activeCountryCode] || "+9665XXXXXXXX";
                        const accountPhone = user?.phone_full || (user?.country_code && user?.phone ? `${DIAL_BY_CC[user.country_code] || ""}${user.phone}` : "");
                        const useAccountPhone = () => setForm({ ...form, contact_phone: "" });
                        const useOtherPhone = () => setForm({ ...form, contact_phone: dial + " " });
                        const usingOther = !!form.contact_phone;
                        return (
                            <div>
                                <label className="block text-sm font-arabic-body text-[var(--text-muted)] mb-2">
                                    {tr("رقم التواصل لهذا الإعلان")}
                                </label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button
                                        type="button"
                                        data-testid="use-account-phone-btn"
                                        onClick={useAccountPhone}
                                        className={`rounded-xl py-2.5 px-3 text-xs font-arabic font-bold border-2 transition-all ${!usingOther ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                                    >
                                        ✓ {tr("استخدم رقم حسابي")}
                                        {accountPhone && <div className="text-[10px] font-normal opacity-80 mt-0.5" dir="ltr">{accountPhone}</div>}
                                    </button>
                                    <button
                                        type="button"
                                        data-testid="use-other-phone-btn"
                                        onClick={useOtherPhone}
                                        className={`rounded-xl py-2.5 px-3 text-xs font-arabic font-bold border-2 transition-all ${usingOther ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                                    >
                                        ✎ {tr("استخدم رقم آخر")}
                                    </button>
                                </div>
                                {usingOther && (
                                    <div className="flex items-stretch gap-0">
                                        <select
                                            data-testid="contact-phone-dial-select"
                                            value={(form.contact_phone || "").split(" ")[0] || dial}
                                            onChange={(e) => {
                                                const newDial = e.target.value;
                                                const rest = (form.contact_phone || "").split(" ").slice(1).join(" ");
                                                setForm({ ...form, contact_phone: `${newDial} ${rest}`.trim() });
                                            }}
                                            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-s-xl px-2 py-3 text-sm font-arabic-body cursor-pointer outline-none focus:border-[var(--primary)]"
                                            dir="ltr"
                                        >
                                            {Object.entries(DIAL_BY_CC).map(([cc, d]) => (
                                                <option key={cc} value={d}>{d} ({cc})</option>
                                            ))}
                                        </select>
                                        <input
                                            data-testid="contact-phone-input"
                                            type="tel"
                                            inputMode="tel"
                                            dir="ltr"
                                            placeholder={ph}
                                            value={(form.contact_phone || "").split(" ").slice(1).join(" ")}
                                            onChange={(e) => {
                                                const d = (form.contact_phone || "").split(" ")[0] || dial;
                                                setForm({ ...form, contact_phone: `${d} ${e.target.value}`.trim() });
                                            }}
                                            className="flex-1 px-4 py-3 rounded-e-xl bg-[var(--surface-elevated)] border border-s-0 border-[var(--border)] font-arabic-body text-sm outline-none focus:border-[var(--primary)]"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className="bg-[var(--surface-elevated)] rounded-xl p-4 mt-4">
                        <h3 className="font-arabic font-bold text-sm text-[var(--text)] mb-2">{tr("ملخص الإعلان")}</h3>
                        <div className="text-sm font-arabic-body text-[var(--text-muted)] space-y-1">
                            <div>{tr("الفئة: ")}<span className="text-[var(--text)] font-bold">{pickName(cat)}</span></div>
                            <div>{tr("العنوان: ")}<span className="text-[var(--text)] font-bold">{form.title}</span></div>
                            <div>{tr("السعر: ")}<span className="text-[var(--text)] font-bold">{form.price ? `${Number(form.price).toLocaleString()} ${form.currency}` : "على السوم"}</span></div>
                            <div>{tr("المدينة: ")}<span className="text-[var(--text)] font-bold">{form.city}</span></div>
                            <div>{tr("الصور: ")}<span className="text-[var(--text)] font-bold">{form.images.length}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer nav */}
            <div className="flex justify-between mt-6 sticky bottom-20 sm:bottom-6 bg-[var(--bg)]/80 backdrop-blur p-2 -mx-3 sm:mx-0 z-10">
                <button data-testid="step-back-btn" disabled={step === 1} onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text)] font-bold font-arabic disabled:opacity-40 flex items-center gap-1.5 text-sm">
                    <ChevronRight className="w-4 h-4" /> {t("back")}
                </button>
                {step < 4 ? (
                    <button data-testid="step-next-btn" disabled={!canNext()} onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] font-bold font-arabic disabled:opacity-40 flex items-center gap-1.5 text-sm hover:bg-[var(--primary-hover)]">
                        {t("next")} <ChevronLeft className="w-4 h-4" />
                    </button>
                ) : (
                    <button data-testid="submit-listing-btn" disabled={busy} onClick={submit} className="px-6 py-2.5 rounded-full bg-[var(--success)] text-white font-bold font-arabic disabled:opacity-40 flex items-center gap-1.5 text-sm hover:opacity-90">
                        <Check className="w-4 h-4" /> {busy ? t("loading") : t("publish")}
                    </button>
                )}
            </div>
        </div>
    );
}

function ClickHandler({ onClick }) {
    useMapEvents({ click: (e) => onClick(e.latlng) });
    return null;
}

function EntryCard({ icon: Icon, label, sub, color, accent, border, onClick, testId }) {
    return (
        <button
            type="button"
            data-testid={testId}
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl border-2 ${border} bg-gradient-to-br ${color} p-4 text-start aspect-[5/4] flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all`}
        >
            <div className={`w-11 h-11 rounded-2xl bg-white/70 dark:bg-black/30 flex items-center justify-center shadow-sm`}>
                <Icon className={`w-6 h-6 ${accent}`} />
            </div>
            <div>
                <h3 className={`font-arabic font-black text-base ${accent} mb-0.5`}>{label}</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-arabic-body line-clamp-1">{sub}</p>
            </div>
        </button>
    );
}
