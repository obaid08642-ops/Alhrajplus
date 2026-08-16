import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { telLink, whatsappLink, normalizePhone } from "@/lib/phone";
import { Heart, Phone, MessageCircle, MapPin, Eye, Calendar, Share2, Flag, ChevronLeft, Star, ChevronRight, Sparkles, TrendingUp, ShieldAlert, Maximize2, Edit3, RefreshCw, CheckCircle2, Trash2, Bell, Tag, Box } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import ListingTypeBadge from "@/components/ListingTypeBadge";
import ListingCard from "@/components/listings/ListingCard";
import AdSlot from "@/components/listings/AdSlot";
import ImageViewer from "@/components/ImageViewer";
import Model3DViewer from "@/components/Model3DViewer";
import { ListingSEO } from "@/components/SEO";
import PriceBadge from "@/components/PriceBadge";
import { optimizeImage, buildSrcSet } from "@/lib/imageOptimizer";
import { trackEvent } from "@/lib/analytics";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function buildHologramIcon({ price, currency }) {
    const display = price ? Number(price).toLocaleString() : "★";
    const sub = price ? (currency || "ر.س") : "إعلان";
    return L.divIcon({
        className: "hologram-pin-wrap",
        iconSize: [78, 78],
        iconAnchor: [39, 70],
        popupAnchor: [0, -64],
        html: `<div class="hologram-pin"><div class="hp-ring hp-ring-1"></div><div class="hp-ring hp-ring-2"></div><div class="hp-chip"><div class="hp-price">${display}</div><div class="hp-curr">${sub}</div></div><div class="hp-stem"></div><div class="hp-base"></div></div>`,
    });
}

export default function ListingDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const { t, pickName, pickLabel, tr, lang } = useI18n();
    const [listing, setListing] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [activeImg, setActiveImg] = useState(0);
    const [showViewer, setShowViewer] = useState(false);
    const [show3D, setShow3D] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [categories, setCategories] = useState([]);
    const [following, setFollowing] = useState(false);
    const [watching, setWatching] = useState(false);
    const [showOffer, setShowOffer] = useState(false);
    const [offerAmount, setOfferAmount] = useState("");
    const [offerMessage, setOfferMessage] = useState("");
    const [offerSaving, setOfferSaving] = useState(false);
    const [sellerTrust, setSellerTrust] = useState(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [commentBusy, setCommentBusy] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [l, s, c] = await Promise.all([
                    api.get(`/listings/${id}`),
                    api.get(`/listings/${id}/similar`),
                    api.get("/meta/categories", { params: { lang } }),
                ]);
                setListing(l.data);
                trackEvent("listing_view", { listing_id: l.data.id, category: l.data.category, country_code: l.data.country_code });
                setSimilar(s.data);
                setCategories(c.data);
                setLikeCount(Number(l.data.like_count || 0));
                api.get(`/listings/${l.data.id}/comments`).then(({ data }) => setComments(data?.items || [])).catch(() => {});
                api.get(`/sellers/${l.data.user_id}/trust`).then(({ data }) => setSellerTrust(data)).catch(() => {});
                if (user) api.get(`/listings/${l.data.id}/like/check`).then(({ data }) => setLiked(!!data.liked)).catch(() => {});
                if (user && l.data.user_id !== user.id) {
                    api.get(`/sellers/${l.data.user_id}/follow-status`).then(({ data }) => setFollowing(!!data.following)).catch(() => {});
                    api.get(`/watches`).then(({ data }) => setWatching((data || []).some((w) => w.listing_id === l.data.id))).catch(() => {});
                }
            } catch (_) { nav("/"); }
        };
        load();
    }, [id, nav, user, lang]);

    const toggleFollow = async () => {
        if (!user) return nav("/login");
        try {
            const { data } = await api.post(`/sellers/${listing.user_id}/follow`);
            setFollowing(!!data.following);
        } catch (_) { alert(tr("تعذر تنفيذ الإجراء")); }
    };
    const toggleWatch = async () => {
        if (!user) return nav("/login");
        try {
            if (watching) {
                await api.delete(`/watches/${listing.id}`);
                setWatching(false);
            } else {
                await api.post(`/watches`, { listing_id: listing.id, target_price: listing.price });
                setWatching(true);
                alert(tr("✅ تم تفعيل تنبيه الأسعار. ستتلقى إشعاراً عند تخفيض السعر."));
            }
        } catch (_) { alert(tr("تعذر تنفيذ الإجراء")); }
    };

    if (!listing) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;

    const cat = categories.find((c) => c.key === listing.category);
    const ts = new Date(listing.created_at);

    const startChat = () => {
        if (!user) return nav("/login");
        trackEvent("chat_started", { listing_id: listing.id, category: listing.category, country_code: listing.country_code });
        nav(`/chat?to=${listing.user_id}&listing=${listing.id}`);
    };

    const isOwner = user && user.id === listing.user_id;

    const toggleLike = async () => {
        if (!user) return nav("/login");
        const previous = liked;
        setLiked(!previous);
        setLikeCount((count) => Math.max(0, count + (previous ? -1 : 1)));
        try {
            const { data } = await api.post(`/listings/${listing.id}/like`);
            setLiked(!!data.liked);
            setLikeCount(Number(data.like_count || 0));
        } catch (_) {
            setLiked(previous);
            setLikeCount((count) => Math.max(0, count + (previous ? 1 : -1)));
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!user) return nav("/login");
        const text = commentText.trim();
        if (!text) return;
        setCommentBusy(true);
        try {
            const { data } = await api.post(`/listings/${listing.id}/comments`, { text });
            setComments((items) => [data, ...items]);
            setCommentText("");
        } catch (e) { alert(e.response?.data?.detail || tr("تعذر نشر التعليق")); }
        finally { setCommentBusy(false); }
    };

    const submitOffer = async (e) => {
        e.preventDefault();
        if (!user) return nav("/login");
        const amount = Number(offerAmount);
        if (!Number.isFinite(amount) || amount <= 0) return alert(tr("أدخل قيمة عرض صحيحة"));
        setOfferSaving(true);
        try {
            await api.post(`/listings/${listing.id}/offers`, { amount, message: offerMessage });
            setShowOffer(false);
            setOfferAmount("");
            setOfferMessage("");
            alert(tr("تم إرسال عرضك للبائع بنجاح"));
        } catch (e) {
            alert(e.response?.data?.detail || tr("تعذر إرسال العرض"));
        } finally { setOfferSaving(false); }
    };

    const handleRepublish = async () => {
        if (!confirm(tr("سيتم إعادة نشر الإعلان في أعلى القائمة. متابعة؟"))) return;
        try {
            const { data } = await api.post(`/listings/${listing.id}/republish`);
            alert(data.message || "تم التجديد");
            const r = await api.get(`/listings/${listing.id}`);
            setListing(r.data);
        } catch (e) {
            alert(e.response?.data?.detail || "تعذر التجديد");
        }
    };

    const handleMarkSold = async () => {
        if (!confirm(tr("هل تم بيع المنتج فعلاً؟ سيتم إخفاء الإعلان من القائمة العامة."))) return;
        try {
            await api.post(`/listings/${listing.id}/mark-sold`);
            alert(tr("✅ تم تحديد الإعلان كمباع. شكراً لاستخدامك الحراج بلس!"));
            nav("/profile");
        } catch (e) {
            alert(e.response?.data?.detail || "تعذر التحديث");
        }
    };

    const handleDelete = async () => {
        const sold = confirm(tr("هل تم بيع المنتج؟ اختر OK = تم البيع، Cancel = حذف فقط"));
        try {
            if (sold) {
                await api.post(`/listings/${listing.id}/mark-sold`);
            }
            await api.delete(`/listings/${listing.id}`);
            alert(sold ? "✅ شكراً، نتمنى لك بيعاً موفقاً دائماً!" : "تم حذف الإعلان");
            nav("/profile");
        } catch (e) {
            alert(e.response?.data?.detail || "تعذر الحذف");
        }
    };

    const handleEdit = () => {
        nav(`/post?edit=${listing.id}`);
    };

    const handlePauseToggle = async () => {
        const isPaused = listing.status === "paused";
        const msg = isPaused
            ? tr("سيتم استئناف الإعلان وإظهاره مجدداً للمشترين. متابعة؟")
            : tr("سيتم إيقاف الإعلان مؤقتاً (لن يظهر في القوائم) لكنه لن يُحذف. تستطيع استئنافه أي وقت. متابعة؟");
        if (!window.confirm(msg)) return;
        try {
            await api.post(`/listings/${listing.id}/${isPaused ? "resume" : "pause"}`);
            const r = await api.get(`/listings/${listing.id}`);
            setListing(r.data);
            alert(isPaused ? tr("✓ تم استئناف الإعلان") : tr("⏸️ تم إيقاف الإعلان مؤقتاً"));
        } catch (e) {
            alert(e.response?.data?.detail || tr("تعذر التحديث"));
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24">
            <ListingSEO listing={listing} />
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-4 font-arabic"><ChevronLeft className="w-4 h-4 rotate-180" />{tr(" العودة")}</Link>

            {isOwner && (
                <div data-testid="owner-actions" className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10 border border-[var(--primary)]/30 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-arabic font-bold text-[var(--text)] me-auto flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" /> هذا إعلانك — تحكم به
                    </span>
                    <button data-testid="edit-listing-btn" onClick={handleEdit} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> تعديل
                    </button>
                    <button data-testid="republish-btn" onClick={handleRepublish} className="bg-[var(--success)] hover:opacity-90 text-white rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> تجديد النشر
                    </button>
                    <button data-testid="pause-resume-btn" onClick={handlePauseToggle} className={`${listing.status === "paused" ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"} rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1`}>
                        {listing.status === "paused" ? <>▶ {tr("استئناف")}</> : <>⏸ {tr("إيقاف مؤقت")}</>}
                    </button>
                    <button data-testid="mark-sold-btn" onClick={handleMarkSold} className="bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> تم البيع
                    </button>
                    <button data-testid="delete-listing-btn" onClick={handleDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> حذف
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left/Main */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Image gallery */}
                    <div className="bg-[var(--surface)] rounded-3xl overflow-hidden border border-[var(--border)]">
                        <div className="relative aspect-[16/10] bg-[var(--surface-elevated)] cursor-zoom-in" onClick={() => listing.images?.length && setShowViewer(true)}>
                            {listing.images?.length ? (
                                <img src={optimizeImage(listing.images[activeImg], { w: 1024 })} srcSet={buildSrcSet(listing.images[activeImg], [480, 768, 1024, 1280])} sizes="(max-width: 1024px) 100vw, 1024px" alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-arabic">{tr("لا توجد صور")}</div>
                            )}
                            <div className="absolute top-3 start-3 flex gap-2">
                                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full font-arabic backdrop-blur">{pickName(cat)}</span>
                            </div>
                            {listing.images?.length > 0 && (
                                <button data-testid="open-viewer-btn" onClick={(e) => { e.stopPropagation(); setShowViewer(true); }} className="absolute top-3 end-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1 backdrop-blur hover:bg-black/80">
                                    <Maximize2 className="w-3 h-3" /> عرض كامل
                                </button>
                            )}
                            {/* Show the real 3D viewer only when the listing has a GLB/GLTF URL. */}
                            {listing.custom_fields?.model_3d_url && (
                                <button data-testid="open-model3d-btn" onClick={(e) => { e.stopPropagation(); setShow3D(true); }} className="absolute top-3 start-3 bg-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1 backdrop-blur shadow-lg"><Box className="w-3.5 h-3.5" /> {tr("عرض 3D")}</button>
                            )}
                            <div className="absolute bottom-3 end-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-arabic backdrop-blur">{activeImg + 1} / {listing.images?.length || 0}</div>
                        </div>
                        {listing.images?.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
                                {listing.images.map((img, i) => (
                                    <button key={i} data-testid={`img-thumb-${i}`} onClick={() => setActiveImg(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${activeImg === i ? "border-[var(--primary)]" : "border-transparent"}`}>
                                        <img src={optimizeImage(img, { w: 160 })} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Title + price */}
                    <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                        <div className="mb-2"><ListingTypeBadge listing={listing} size="lg" /></div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)] flex-1">{listing.title}</h1>
                            <div className="flex items-center gap-2 shrink-0">
                            <button data-testid="like-btn" onClick={toggleLike} className={`px-3 h-10 rounded-full flex items-center justify-center gap-1.5 font-arabic-body text-sm font-bold transition-colors ${liked ? "bg-red-500/10 text-red-600" : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-red-600"}`} title={tr("إعجاب بالإعلان")}><Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> <span>{likeCount}</span></button>
                            <button data-testid="share-btn" onClick={async () => {
                                const url = window.location.href;
                                const shareData = { title: listing.title, text: `${listing.title} - الحراج بلس`, url };
                                try {
                                    if (navigator.share) {
                                        await navigator.share(shareData);
                                    } else {
                                        await navigator.clipboard.writeText(url);
                                        alert(tr("✅ تم نسخ رابط الإعلان"));
                                    }
                                } catch (_) {}
                            }} className="px-3 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body text-sm font-bold whitespace-nowrap" title={tr("مشاركة الإعلان")}><Share2 className="w-4 h-4" /><span>{tr("مشاركة الإعلان")}</span></button>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4 flex-wrap">
                            {listing.price ? (
                                <>
                                    <span className="font-latin font-black text-3xl sm:text-4xl text-[var(--secondary)] dark:text-[var(--primary)]">{Number(listing.price).toLocaleString()}</span>
                                    <span className="text-sm text-[var(--text-muted)] font-arabic-body">{listing.currency || "ر.س"}</span>
                                </>
                            ) : (
                                <span className="text-xl text-[var(--text-muted)] font-arabic">{tr("على السوم")}</span>
                            )}
                        </div>
                        {listing.price && <div className="mb-3"><PriceBadge listingId={listing.id} variant="full" /></div>}
                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {listing.city}{listing.district ? ` - ${listing.district}` : ""}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ts.toLocaleDateString("ar")}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views || 0} مشاهدة</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                        <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">{tr("الوصف")}</h2>
                        <p className="text-sm sm:text-base text-[var(--text)] font-arabic-body whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                    </div>

                    {/* Public comments */}
                    <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-4"><h2 className="font-arabic font-bold text-lg text-[var(--text)]">{tr("التعليقات")}</h2><span className="text-xs text-[var(--text-muted)] font-latin">{comments.length}</span></div>
                        {user ? (
                            <form onSubmit={submitComment} className="flex gap-2 mb-4">
                                <input data-testid="listing-comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={1000} placeholder={tr("اكتب تعليقًا عامًا...")} className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
                                <button data-testid="listing-comment-submit" disabled={commentBusy || !commentText.trim()} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl px-4 py-2 font-arabic font-bold text-xs disabled:opacity-50">{commentBusy ? tr("جارٍ النشر...") : tr("نشر")}</button>
                            </form>
                        ) : <button onClick={() => nav("/login")} className="w-full mb-4 rounded-xl py-2.5 bg-[var(--surface-elevated)] text-[var(--primary)] font-arabic font-bold text-sm">{tr("سجل الدخول لكتابة تعليق")}</button>}
                        {comments.length === 0 ? <p className="text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد تعليقات بعد")}</p> : <div className="space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-2xl bg-[var(--surface-elevated)] p-3"><div className="flex items-center gap-2 mb-1"><span className="font-arabic font-bold text-xs text-[var(--text)]">{comment.author?.name || tr("مستخدم")}</span>{comment.author?.verified && <CheckCircle2 className="w-3 h-3 text-[var(--primary)]" />}<span className="text-[10px] text-[var(--text-muted)] font-latin ms-auto">{new Date(comment.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}</span></div><p className="text-sm text-[var(--text)] font-arabic-body whitespace-pre-wrap">{comment.text}</p></div>)}</div>}
                    </div>

                    {/* Custom fields */}
                    {listing.custom_fields && Object.keys(listing.custom_fields).length > 0 && (
                        <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">{tr("المواصفات")}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-arabic-body">
                                {cat?.fields?.filter((f) => listing.custom_fields[f.key]).map((f) => {
                                    const rawVal = listing.custom_fields[f.key];
                                    let displayVal = rawVal;
                                    if (Array.isArray(f.options_ar) && Array.isArray(f.options)) {
                                        const idx = f.options_ar.indexOf(rawVal);
                                        if (idx >= 0 && f.options[idx]) displayVal = f.options[idx];
                                    }
                                    return (
                                        <div key={f.key} className="bg-[var(--surface-elevated)] rounded-xl p-3 border border-[var(--border)]">
                                            <div className="text-xs text-[var(--text-muted)] mb-1">{pickLabel(f)}</div>
                                            <div className="text-sm font-bold text-[var(--text)]">{displayVal}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Videos */}
                    {listing.videos?.length > 0 && (
                        <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">{tr("الفيديو")}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {listing.videos.map((v, i) => (
                                    <video key={i} src={v} controls preload="metadata" className="w-full rounded-2xl bg-black aspect-video" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    {listing.lat && listing.lng && (
                        <div className="bg-[var(--surface)] rounded-3xl overflow-hidden border border-[var(--border)]">
                            <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
                                <h2 className="font-arabic font-bold text-lg text-[var(--text)] flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--primary)]" /> {t("location_on_map")}</h2>
                                <a data-testid="open-in-maps" href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`} target="_blank" rel="noopener noreferrer" className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-3 py-1.5 text-xs font-arabic font-bold flex items-center gap-1">
                                    🧭 الاتجاهات
                                </a>
                            </div>
                            <div className="h-72 mt-4">
                                <MapContainer center={[listing.lat, listing.lng]} zoom={14} className="w-full h-full" scrollWheelZoom={false}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                    <Marker position={[listing.lat, listing.lng]} icon={buildHologramIcon({ price: listing.price, currency: listing.currency, category: listing.category })}>
                                        <Popup>
                                            <div className="font-arabic">
                                                <div className="font-bold">{listing.title}</div>
                                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline text-xs">{tr("افتح الاتجاهات")}</a>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    )}

                    {/* Ad slot under listing */}
                    <AdSlot placement="listing_top" />

                    {/* Seller Info & Contact (always before similar listings) */}
                    <div data-testid="seller-info-block" className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)] lg:hidden">
                        <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-4">{t("seller_info")}</h2>
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-fg)] font-bold text-lg font-arabic">
                                {listing.seller?.name?.[0] || "U"}
                            </div>
                            <div className="flex-1">
                                <div className="font-arabic font-bold text-sm text-[var(--text)] flex items-center gap-1">
                                    <Link to={`/seller/${listing.user_id}`} className="hover:text-[var(--primary)] hover:underline">{listing.seller?.name}</Link>
                                    {listing.seller?.verified && <Star className="w-3.5 h-3.5 fill-[var(--primary)] text-[var(--primary)]" />}
                                    {sellerTrust && <span title={tr("درجة مبنية على التوثيق والتقييمات والنشاط والبلاغات")} className={`text-[10px] rounded-full px-1.5 py-0.5 font-latin ${sellerTrust.score >= 80 ? "bg-emerald-100 text-emerald-700" : sellerTrust.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{sellerTrust.score}/100</span>}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] font-arabic-body">
                                    {t("joined")} {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString("ar") : ""}
                                </div>
                            </div>
                            {!isOwner && user && (
                                <button data-testid="follow-seller-btn-mobile" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
                                </button>
                            )}
                        </div>
                        {!isOwner && user && (
                            <button data-testid="watch-price-btn-mobile" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
                                <Bell className="w-3.5 h-3.5" /> {watching ? tr("✓ تنبيه السعر مفعّل") : tr("نبّهني عند تخفيض السعر")}
                            </button>
                        )}
                        <div className="space-y-2.5">
                            {listing.show_phone !== false && (listing.contact_phone || listing.seller?.phone_full) && (() => {
                                const ph = listing.contact_phone || listing.seller.phone_full;
                                const cc = listing.country_code || listing.seller?.country_code || "";
                                const norm = normalizePhone(ph, cc);
                                const waMsg = `مرحباً، بخصوص إعلان: ${listing.title}`;
                                return (
                                    <>
                                        <a href={telLink(ph, cc)} className="w-full bg-[var(--success)] hover:opacity-90 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                            <Phone className="w-4 h-4" /> {showPhone ? norm : "اتصال مباشر"}
                                        </a>
                                        <a href={whatsappLink(ph, waMsg, cc)} rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
                                            <MessageCircle className="w-4 h-4" /> {t("whatsapp")}
                                        </a>
                                    </>
                                );
                            })()}
                            {!isOwner && (
                                <button data-testid="make-offer-btn-mobile" onClick={() => { if (!user) return nav("/login"); setOfferAmount(listing.price ? String(listing.price) : ""); setShowOffer(true); }} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                    <Tag className="w-4 h-4" /> {tr("قدم عرض سعر")}
                                </button>
                            )}
                            <>
                                <button onClick={startChat} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                    <MessageCircle className="w-4 h-4" /> {t("chat_inapp")}
                                </button>
                            </>
                        </div>
                    </div>

                    {/* Sponsored ad — between contact info and similar listings (per user request) */}
                    <AdSlot placement="listing_bottom" />

                    {/* Similar listings — placed AFTER seller info as requested */}
                    {similar.length > 0 && (
                        <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--accent)]" /> {t("similar_listings")}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {similar.map((s) => <ListingCard key={s.id} listing={s} compact />)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right/Sidebar - Seller (Desktop only) */}
                <div className="hidden lg:block lg:col-span-1 space-y-4">
                    <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] sticky top-24">
                        <h3 className="font-arabic font-bold text-base text-[var(--text)] mb-4">{t("seller_info")}</h3>
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-fg)] font-bold text-lg font-arabic">
                                {listing.seller?.name?.[0] || "U"}
                            </div>
                            <div className="flex-1">
                                <div className="font-arabic font-bold text-sm text-[var(--text)] flex items-center gap-1">
                                    <Link to={`/seller/${listing.user_id}`} className="hover:text-[var(--primary)] hover:underline">{listing.seller?.name}</Link>
                                    {listing.seller?.verified && <Star className="w-3.5 h-3.5 fill-[var(--primary)] text-[var(--primary)]" />}
                                    {sellerTrust && <span title={tr("درجة مبنية على التوثيق والتقييمات والنشاط والبلاغات")} className={`text-[10px] rounded-full px-1.5 py-0.5 font-latin ${sellerTrust.score >= 80 ? "bg-emerald-100 text-emerald-700" : sellerTrust.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{sellerTrust.score}/100</span>}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] font-arabic-body">
                                    {t("joined")} {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString("ar") : ""}
                                </div>
                            </div>
                            {!isOwner && user && (
                                <button data-testid="follow-seller-btn-desktop" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
                                </button>
                            )}
                        </div>

                        {!isOwner && user && (
                            <button data-testid="watch-price-btn-desktop" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
                                <Bell className="w-3.5 h-3.5" /> {watching ? tr("✓ تنبيه السعر مفعّل") : tr("نبّهني عند تخفيض السعر")}
                            </button>
                        )}

                        {/* Contact actions */}
                        <div className="space-y-2.5">
                            {listing.show_phone !== false && (listing.contact_phone || listing.seller?.phone_full) ? (
                                <>
                                    {(() => {
                                        const ph = listing.contact_phone || listing.seller.phone_full;
                                        const cc = listing.country_code || listing.seller?.country_code || "";
                                        const norm = normalizePhone(ph, cc);
                                        const waMsg = `مرحباً، بخصوص إعلان: ${listing.title}`;
                                        return (
                                            <>
                                                <a data-testid="call-link" href={telLink(ph, cc)} className="w-full bg-[var(--success)] hover:opacity-90 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                                    <Phone className="w-4 h-4" /> {showPhone ? norm : "اتصال مباشر"}
                                                </a>
                                                {!showPhone && (
                                                    <button data-testid="show-phone-btn" onClick={() => setShowPhone(true)} className="w-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)] rounded-xl py-2 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic">
                                                        <Eye className="w-3.5 h-3.5" /> إظهار رقم الجوال
                                                    </button>
                                                )}
                                                <a data-testid="whatsapp-link" href={whatsappLink(ph, waMsg, cc)} rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
                                                    <MessageCircle className="w-4 h-4" /> {t("whatsapp")}
                                                </a>
                                            </>
                                        );
                                    })()}
                                </>
                            ) : null}
                            {!isOwner && (
                                <button data-testid="make-offer-btn-desktop" onClick={() => { if (!user) return nav("/login"); setOfferAmount(listing.price ? String(listing.price) : ""); setShowOffer(true); }} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                    <Tag className="w-4 h-4" /> {tr("قدم عرض سعر")}
                                </button>
                            )}
                            <button data-testid="chat-with-seller-btn" onClick={startChat} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                <MessageCircle className="w-4 h-4" /> {t("chat_inapp")}
                            </button>
                            <button data-testid="report-btn" className="w-full bg-[var(--surface-elevated)] hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-600 rounded-xl py-2 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-colors">
                                <Flag className="w-3.5 h-3.5" /> الإبلاغ عن الإعلان
                            </button>
                        </div>

                        {/* Safety disclaimer */}
                        <div className="mt-4 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-2xl p-3">
                            <div className="flex items-start gap-2">
                                <ShieldAlert className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-arabic font-bold text-xs text-[var(--text)] mb-1">{t("disclaimer_short")}</div>
                                    <p className="text-[11px] text-[var(--text-muted)] font-arabic-body leading-relaxed">{t("disclaimer_text")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showOffer && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={tr("قدم عرض سعر")}>
                    <form onSubmit={submitOffer} className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-2xl p-5 font-arabic">
                        <div className="flex items-center justify-between mb-4">
                            <div><h2 className="font-black text-lg text-[var(--text)]">{tr("قدم عرض سعر")}</h2><p className="text-xs text-[var(--text-muted)] mt-1">{listing.title}</p></div>
                            <button type="button" onClick={() => setShowOffer(false)} className="text-[var(--text-muted)] text-xl" aria-label={tr("إغلاق")}>×</button>
                        </div>
                        <label className="block text-xs font-bold text-[var(--text)] mb-1">{tr("قيمة العرض")}</label>
                        <input autoFocus required type="number" min="1" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-3" placeholder={listing.price ? String(listing.price) : "0"} />
                        <label className="block text-xs font-bold text-[var(--text)] mb-1">{tr("رسالة اختيارية")}</label>
                        <textarea rows={3} value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-4" placeholder={tr("اكتب رسالة للبائع...")} />
                        <button disabled={offerSaving} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl py-3 font-black disabled:opacity-60">{offerSaving ? tr("جارٍ الإرسال...") : tr("إرسال العرض")}</button>
                    </form>
                </div>
            )}
            {showViewer && <ImageViewer images={listing.images} initialIndex={activeImg} onClose={() => setShowViewer(false)} />}
            {show3D && <Model3DViewer src={listing.custom_fields?.model_3d_url} onClose={() => setShow3D(false)} />}

            {/* Sticky bottom CTA bar — fills the space left by the hidden
                BottomNav. Auctions show "مزايدة الآن", regular listings show
                "تواصل مع البائع". Hidden for the owner of the listing. */}
            {!isOwner && listing.seller?.id && (
                <div data-testid="listing-sticky-cta" className="fixed inset-x-0 bottom-0 z-40 bg-[var(--surface)]/96 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-4px_18px_rgba(0,0,0,0.08)]">
                    <div className="max-w-7xl mx-auto px-3 py-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 12px)" }}>
                        {(listing.category === "auctions" || listing.auction_meta || listing.is_auction) ? (
                            <button
                                data-testid="listing-sticky-bid-btn"
                                onClick={() => nav(`/auctions?openBidFor=${listing.id}`)}
                                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:opacity-95 text-white py-4 rounded-2xl font-arabic font-black text-base shadow-lg shadow-[var(--accent)]/40 active:scale-[0.98] transition-all"
                            >
                                <span className="text-xl">🔨</span> {tr("مزايدة الآن")}
                            </button>
                        ) : (
                            <button
                                data-testid="listing-sticky-contact-btn"
                                onClick={() => {
                                    if (!user) { nav("/auth"); return; }
                                    nav(`/chat?to=${listing.seller.id}&listing_id=${listing.id}`);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] py-4 rounded-2xl font-arabic font-black text-base shadow-lg shadow-[var(--primary)]/40 active:scale-[0.98] transition-all"
                            >
                                <MessageCircle className="w-5 h-5" /> {tr("تواصل مع البائع")}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
