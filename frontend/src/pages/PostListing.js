import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import * as Icons from "lucide-react";
import { Upload, X, Image as ImageIcon, Video, ChevronRight, Check, MapPin, ChevronLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function PostListing() {
    const nav = useNavigate();
    const { user, loading } = useAuth();
    const { t } = useI18n();
    const [step, setStep] = useState(1);
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
        lat: null,
        lng: null,
        show_phone: true,
    });

    useEffect(() => {
        if (!loading && !user) nav("/login");
    }, [loading, user, nav]);

    useEffect(() => {
        api.get("/meta/categories").then(({ data }) => setCategories(data));
        api.get("/meta/countries").then(({ data }) => setCountries(data));
    }, []);

    useEffect(() => {
        if (user?.city) setForm((f) => ({ ...f, city: user.city }));
    }, [user]);

    const cat = categories.find((c) => c.key === form.category);
    const country = countries.find((c) => c.code === user?.country_code);

    const uploadImage = async (file) => {
        const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "image", folder: "listings" } });
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.api_key);
        fd.append("timestamp", sig.timestamp);
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: "POST", body: fd });
        const out = await res.json();
        return out.secure_url;
    };
    const uploadVideo = async (file) => {
        const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: "video", folder: "listings" } });
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.api_key);
        fd.append("timestamp", sig.timestamp);
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, { method: "POST", body: fd });
        const out = await res.json();
        return out.secure_url;
    };

    const onFiles = async (files, type = "image") => {
        setBusy(true); setErr("");
        try {
            const urls = [];
            for (const file of Array.from(files)) {
                const url = type === "image" ? await uploadImage(file) : await uploadVideo(file);
                if (url) urls.push(url);
            }
            setForm((f) => ({ ...f, [type === "image" ? "images" : "videos"]: [...f[type === "image" ? "images" : "videos"], ...urls] }));
        } catch (e) {
            setErr("فشل رفع الملف. حاول مرة أخرى");
        } finally { setBusy(false); }
    };

    const submit = async () => {
        setErr(""); setBusy(true);
        try {
            const payload = {
                ...form,
                price: form.price ? parseFloat(form.price) : null,
            };
            const { data } = await api.post("/listings", payload);
            nav(`/listing/${data.id}`);
        } catch (e) {
            setErr(e.response?.data?.detail || "فشل النشر");
        } finally { setBusy(false); }
    };

    const canNext = () => {
        if (step === 1) return !!form.category;
        if (step === 2) return form.title && form.description && form.city;
        if (step === 3) return form.images.length > 0;
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
                    {step === 1 && "الخطوة 1: اختر الفئة المناسبة لإعلانك"}
                    {step === 2 && "الخطوة 2: أضف التفاصيل والمواصفات"}
                    {step === 3 && "الخطوة 3: ارفع الصور والفيديو"}
                    {step === 4 && "الخطوة 4: حدد الموقع وأكّد النشر"}
                </div>
            </div>

            {err && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}

            {/* Step 1: Category */}
            {step === 1 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)]">
                    <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[var(--accent)]" /> {t("choose_category")}</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {categories.map((c) => {
                            const Icon = Icons[c.icon] || Icons.Shapes;
                            const selected = form.category === c.key;
                            return (
                                <button key={c.key} data-testid={`pick-cat-${c.key}`} onClick={() => setForm({ ...form, category: c.key, subcategory: "", custom_fields: {} })}
                                    className={`aspect-square rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all ${selected ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"}`}>
                                    <Icon className={`w-6 h-6 ${selected ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                                    <span className="font-arabic text-xs sm:text-sm font-bold text-[var(--text)] text-center">{c.name_ar}</span>
                                </button>
                            );
                        })}
                    </div>

                    {cat?.subcategories?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-arabic font-bold text-sm text-[var(--text)] mb-3">الفئة الفرعية</h3>
                            <div className="flex flex-wrap gap-2">
                                {cat.subcategories.map((s) => (
                                    <button key={s.key} data-testid={`pick-sub-${s.key}`} onClick={() => setForm({ ...form, subcategory: s.key })}
                                        className={`px-4 py-2 rounded-full text-sm font-arabic font-bold border ${form.subcategory === s.key ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}>
                                        {s.name_ar}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                    <h2 className="font-arabic font-bold text-lg text-[var(--text)]">{t("listing_details")}</h2>
                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("title")} *</label>
                        <input data-testid="post-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder="عنوان واضح وموجز" />
                    </div>
                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("description")} *</label>
                        <textarea data-testid="post-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder="اكتب وصفاً تفصيلياً..." />
                    </div>
                    {form.category !== "jobs" && form.category !== "services" && (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("price")}</label>
                                <input data-testid="post-price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder="اتركه فارغاً للسوم" />
                            </div>
                            <div className="w-24">
                                <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">العملة</label>
                                <input value={country?.currency || "ر.س"} disabled className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text-muted)] outline-none font-arabic-body" />
                            </div>
                        </div>
                    )}

                    {/* Custom fields for category */}
                    {cat?.fields?.map((f) => (
                        <div key={f.key}>
                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">
                                {f.label_ar} {f.required && <span className="text-red-500">*</span>}
                            </label>
                            {f.type === "select" ? (
                                <select data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body">
                                    <option value="">اختر...</option>
                                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : f.type === "number" ? (
                                <input data-testid={`field-${f.key}`} type="number" value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                            ) : (
                                <input data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
                            )}
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">المدينة *</label>
                        <select data-testid="post-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body">
                            <option value="">اختر المدينة</option>
                            {country?.cities.map((c) => <option key={c.name_ar} value={c.name_ar}>{c.name_ar}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Step 3: Media */}
            {step === 3 && (
                <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] space-y-4">
                    <h2 className="font-arabic font-bold text-lg text-[var(--text)]">{t("upload_media")}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="cursor-pointer bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] py-8 flex flex-col items-center justify-center gap-2 transition-all">
                            <ImageIcon className="w-6 h-6 text-[var(--primary)]" />
                            <span className="font-arabic font-bold text-sm text-[var(--text)]">إضافة صور</span>
                            <span className="text-xs text-[var(--text-muted)] font-arabic-body">حتى 10 صور</span>
                            <input data-testid="upload-images" type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files, "image")} disabled={busy} />
                        </label>
                        <label className="cursor-pointer bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] py-8 flex flex-col items-center justify-center gap-2 transition-all">
                            <Video className="w-6 h-6 text-[var(--accent)]" />
                            <span className="font-arabic font-bold text-sm text-[var(--text)]">إضافة فيديو</span>
                            <span className="text-xs text-[var(--text-muted)] font-arabic-body">حد أقصى 100MB</span>
                            <input data-testid="upload-videos" type="file" accept="video/*" className="hidden" onChange={(e) => onFiles(e.target.files, "video")} disabled={busy} />
                        </label>
                    </div>
                    {busy && <div className="text-center text-sm font-arabic text-[var(--primary)]">جاري الرفع...</div>}
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
                    <h2 className="font-arabic font-bold text-lg text-[var(--text)] flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--primary)]" /> حدد الموقع على الخريطة</h2>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body">اضغط على الخريطة لتحديد الموقع الدقيق (اختياري)</p>
                    <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-[var(--border)]">
                        <MapContainer center={[form.lat || 24.7136, form.lng || 46.6753]} zoom={form.lat ? 14 : 6} className="w-full h-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            <ClickHandler onClick={(latlng) => setForm({ ...form, lat: latlng.lat, lng: latlng.lng })} />
                            {form.lat && <Marker position={[form.lat, form.lng]} />}
                        </MapContainer>
                    </div>
                    {form.lat && <div className="text-xs text-[var(--success)] font-arabic-body">✓ تم تحديد الموقع</div>}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input data-testid="show-phone-checkbox" type="checkbox" checked={form.show_phone} onChange={(e) => setForm({ ...form, show_phone: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
                        <span className="text-sm font-arabic-body text-[var(--text)]">{t("show_phone")}</span>
                    </label>

                    <div className="bg-[var(--surface-elevated)] rounded-xl p-4 mt-4">
                        <h3 className="font-arabic font-bold text-sm text-[var(--text)] mb-2">ملخص الإعلان</h3>
                        <div className="text-sm font-arabic-body text-[var(--text-muted)] space-y-1">
                            <div>الفئة: <span className="text-[var(--text)] font-bold">{cat?.name_ar}</span></div>
                            <div>العنوان: <span className="text-[var(--text)] font-bold">{form.title}</span></div>
                            <div>السعر: <span className="text-[var(--text)] font-bold">{form.price ? `${Number(form.price).toLocaleString()} ${form.currency}` : "على السوم"}</span></div>
                            <div>المدينة: <span className="text-[var(--text)] font-bold">{form.city}</span></div>
                            <div>الصور: <span className="text-[var(--text)] font-bold">{form.images.length}</span></div>
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
