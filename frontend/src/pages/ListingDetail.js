import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Heart, Phone, MessageCircle, MapPin, Eye, Calendar, Share2, Flag, ChevronLeft, Star, ChevronRight, Sparkles, TrendingUp, ShieldAlert, Maximize2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import ListingCard from "@/components/listings/ListingCard";
import AdSlot from "@/components/listings/AdSlot";
import ImageViewer from "@/components/ImageViewer";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ListingDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const { t, pickName, pickLabel } = useI18n();
    const [listing, setListing] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [activeImg, setActiveImg] = useState(0);
    const [showViewer, setShowViewer] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [l, s, c] = await Promise.all([
                    api.get(`/listings/${id}`),
                    api.get(`/listings/${id}/similar`),
                    api.get("/meta/categories"),
                ]);
                setListing(l.data);
                setSimilar(s.data);
                setCategories(c.data);
            } catch (_) { nav("/"); }
        };
        load();
    }, [id, nav]);

    if (!listing) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;

    const cat = categories.find((c) => c.key === listing.category);
    const ts = new Date(listing.created_at);

    const startChat = () => {
        if (!user) return nav("/login");
        nav(`/chat?to=${listing.user_id}&listing=${listing.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-4 font-arabic"><ChevronLeft className="w-4 h-4 rotate-180" /> العودة</Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left/Main */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Image gallery */}
                    <div className="bg-[var(--surface)] rounded-3xl overflow-hidden border border-[var(--border)]">
                        <div className="relative aspect-[16/10] bg-[var(--surface-elevated)] cursor-zoom-in" onClick={() => listing.images?.length && setShowViewer(true)}>
                            {listing.images?.length ? (
                                <img src={listing.images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-arabic">لا توجد صور</div>
                            )}
                            <div className="absolute top-3 start-3 flex gap-2">
                                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full font-arabic backdrop-blur">{pickName(cat)}</span>
                            </div>
                            {listing.images?.length > 0 && (
                                <button data-testid="open-viewer-btn" onClick={(e) => { e.stopPropagation(); setShowViewer(true); }} className="absolute top-3 end-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1 backdrop-blur hover:bg-black/80">
                                    <Maximize2 className="w-3 h-3" /> عرض كامل
                                </button>
                            )}
                            <div className="absolute bottom-3 end-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-arabic backdrop-blur">{activeImg + 1} / {listing.images?.length || 0}</div>
                        </div>
                        {listing.images?.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
                                {listing.images.map((img, i) => (
                                    <button key={i} data-testid={`img-thumb-${i}`} onClick={() => setActiveImg(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${activeImg === i ? "border-[var(--primary)]" : "border-transparent"}`}>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Title + price */}
                    <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h1 className="font-arabic font-black text-xl sm:text-3xl text-[var(--text)] flex-1">{listing.title}</h1>
                            <button data-testid="share-btn" className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)]"><Share2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            {listing.price ? (
                                <>
                                    <span className="font-latin font-black text-3xl sm:text-4xl text-[var(--secondary)] dark:text-[var(--primary)]">{Number(listing.price).toLocaleString()}</span>
                                    <span className="text-sm text-[var(--text-muted)] font-arabic-body">{listing.currency || "ر.س"}</span>
                                    <span className="ms-2 inline-flex items-center gap-1 bg-[var(--success)]/15 text-[var(--success)] text-xs font-bold px-2.5 py-1 rounded-full font-arabic"><TrendingUp className="w-3 h-3" /> سعر مناسب</span>
                                </>
                            ) : (
                                <span className="text-xl text-[var(--text-muted)] font-arabic">على السوم</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-[var(--text-muted)] font-arabic-body">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {listing.city}{listing.district ? ` - ${listing.district}` : ""}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ts.toLocaleDateString("ar")}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views || 0} مشاهدة</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                        <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">الوصف</h2>
                        <p className="text-sm sm:text-base text-[var(--text)] font-arabic-body whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                    </div>

                    {/* Custom fields */}
                    {listing.custom_fields && Object.keys(listing.custom_fields).length > 0 && (
                        <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">المواصفات</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-arabic-body">
                                {cat?.fields?.filter((f) => listing.custom_fields[f.key]).map((f) => (
                                    <div key={f.key} className="bg-[var(--surface-elevated)] rounded-xl p-3 border border-[var(--border)]">
                                        <div className="text-xs text-[var(--text-muted)] mb-1">{pickLabel(f)}</div>
                                        <div className="text-sm font-bold text-[var(--text)]">{listing.custom_fields[f.key]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Videos */}
                    {listing.videos?.length > 0 && (
                        <div className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)]">
                            <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-3">الفيديو</h2>
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
                                    <Marker position={[listing.lat, listing.lng]}>
                                        <Popup>
                                            <div className="font-arabic">
                                                <div className="font-bold">{listing.title}</div>
                                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline text-xs">افتح الاتجاهات</a>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    )}

                    {/* Ad slot under listing */}
                    <AdSlot placement="listing_bottom" />

                    {/* Similar listings */}
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

                {/* Right/Sidebar - Seller */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[var(--surface)] rounded-3xl p-5 border border-[var(--border)] sticky top-24">
                        <h3 className="font-arabic font-bold text-base text-[var(--text)] mb-4">{t("seller_info")}</h3>
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-fg)] font-bold text-lg font-arabic">
                                {listing.seller?.name?.[0] || "U"}
                            </div>
                            <div className="flex-1">
                                <div className="font-arabic font-bold text-sm text-[var(--text)] flex items-center gap-1">
                                    {listing.seller?.name}
                                    {listing.seller?.verified && <Star className="w-3.5 h-3.5 fill-[var(--primary)] text-[var(--primary)]" />}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] font-arabic-body">
                                    {t("joined")} {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString("ar") : ""}
                                </div>
                            </div>
                        </div>

                        {/* Contact actions */}
                        <div className="space-y-2.5">
                            {listing.show_phone !== false && listing.seller?.phone_full ? (
                                <>
                                    <a data-testid="call-link" href={`tel:${listing.seller.phone_full}`} className="w-full bg-[var(--success)] hover:opacity-90 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
                                        <Phone className="w-4 h-4" /> {showPhone ? listing.seller.phone_full : "اتصال مباشر"}
                                    </a>
                                    {!showPhone && (
                                        <button data-testid="show-phone-btn" onClick={() => setShowPhone(true)} className="w-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)] rounded-xl py-2 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic">
                                            <Eye className="w-3.5 h-3.5" /> إظهار رقم الجوال
                                        </button>
                                    )}
                                    <a data-testid="whatsapp-link" href={`https://wa.me/${listing.seller.phone_full.replace("+", "")}?text=${encodeURIComponent(`مرحباً، بخصوص إعلان: ${listing.title}`)}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic hover:opacity-90">
                                        <MessageCircle className="w-4 h-4" /> {t("whatsapp")}
                                    </a>
                                </>
                            ) : null}
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

            {showViewer && <ImageViewer images={listing.images} initialIndex={activeImg} onClose={() => setShowViewer(false)} />}
        </div>
    );
}
