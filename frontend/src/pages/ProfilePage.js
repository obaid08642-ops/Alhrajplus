import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { Heart, ListIcon, LogOut, Star, Edit3, Trash2, Gift, Copy, Award, Settings, Info, FileText, Mail, Shield, ChevronLeft } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const { t, tr } = useI18n();
    const nav = useNavigate();
    const [tab, setTab] = useState("listings");
    const [myListings, setMyListings] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [referral, setReferral] = useState(null);

    useEffect(() => {
        if (!loading && !user) nav("/login");
    }, [loading, user, nav]);

    useEffect(() => {
        if (!user) return;
        api.get("/listings/me/mine").then(({ data }) => setMyListings(data));
        api.get("/favorites").then(({ data }) => setFavorites(data));
        api.get("/referral/me").then(({ data }) => setReferral(data));
    }, [user]);

    const removeListing = async (id) => {
        if (!window.confirm(tr("متأكد من حذف الإعلان؟"))) return;
        await api.delete(`/listings/${id}`);
        setMyListings((l) => l.filter((x) => x.id !== id));
    };

    if (loading || !user) return <div className="p-10 text-center font-arabic">{t("loading")}</div>;

    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="bg-[var(--surface)] rounded-3xl p-5 sm:p-8 border border-[var(--border)] mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center font-black text-2xl sm:text-3xl font-arabic">
                        {user.name?.[0]}
                    </div>
                    <div className="flex-1">
                        <h1 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)] flex items-center gap-2">
                            {user.name}
                            {user.verified && <Star className="w-5 h-5 fill-[var(--primary)] text-[var(--primary)]" />}
                        </h1>
                        <p className="text-sm text-[var(--text-muted)] font-arabic-body">{user.email}</p>
                        <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{user.phone_full} • {user.city}</p>
                    </div>
                    <button data-testid="profile-logout" onClick={async () => { await logout(); nav("/"); }} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 font-bold text-sm font-arabic">
                        <LogOut className="w-4 h-4" /> {t("logout")}
                    </button>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <Stat label={tr("إعلاناتي")} value={myListings.length} />
                    <Stat label={tr("المفضلة")} value={favorites.length} />
                    <Stat label={tr("درجة الموثوقية")} value={user.trust_score || 50} />
                </div>
            </div>

            {/* Referral Card */}
            {referral && (
                <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 rounded-3xl p-5 border border-[var(--primary)]/30 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Gift className="w-5 h-5 text-[var(--primary)]" />
                        <h3 className="font-arabic font-black text-base text-[var(--text)]">{t("referral_program")}</h3>
                        {referral.badge && <span className="ms-auto text-xs font-bold text-[var(--accent)] font-arabic">{referral.badge}</span>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body mb-3">{tr("ادعُ أصدقاءك واحصل على شارات موثّقة مجاناً (5 = 🥉 برونزي، 10 = 🥈 فضي، 25 = ⭐ ذهبي)")}</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[var(--surface)] rounded-xl px-3 py-2 border border-[var(--border)] flex items-center justify-between">
                            <span className="font-mono font-black text-sm text-[var(--primary)]">{referral.code}</span>
                            <span className="text-xs text-[var(--text-muted)] font-arabic-body">{referral.invited_count} مدعو</span>
                        </div>
                        <button data-testid="copy-referral-btn" onClick={() => {
                            const link = `${window.location.origin}/register?ref=${referral.code}`;
                            navigator.clipboard.writeText(link);
                            alert(tr("تم نسخ رابط الدعوة ✅"));
                        }} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl px-4 py-2 font-arabic font-bold text-xs flex items-center gap-1">
                            <Copy className="w-3.5 h-3.5" /> {t("copy_link")}
                        </button>
                    </div>
                    {referral.next_milestone && (
                        <div className="mt-3 text-[10px] text-[var(--text-muted)] font-arabic-body">
                            بقي {referral.next_milestone - referral.invited_count} أصدقاء للوصول للمستوى التالي
                        </div>
                    )}
                </div>
            )}

            {/* Premium locked notice */}
            <div className="bg-[var(--surface)] rounded-2xl p-3 border border-dashed border-[var(--border)] mb-4 text-center text-xs text-[var(--text-muted)] font-arabic-body">
                {t("premium_locked")}
            </div>

            {/* Quick menu — Settings / About / Terms / Contact / Logout */}
            <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] mb-6 overflow-hidden">
                <Link to="/settings" data-testid="menu-settings" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
                    <Settings className="w-5 h-5 text-[var(--primary)]" />
                    <span className="flex-1 font-arabic font-bold text-sm text-[var(--text)]">{tr("الإعدادات")}</span>
                    <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
                <Link to="/about" data-testid="menu-about" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
                    <Info className="w-5 h-5 text-[var(--primary)]" />
                    <span className="flex-1 font-arabic font-bold text-sm text-[var(--text)]">{tr("عن التطبيق")}</span>
                    <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
                <Link to="/terms" data-testid="menu-terms" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
                    <FileText className="w-5 h-5 text-[var(--primary)]" />
                    <span className="flex-1 font-arabic font-bold text-sm text-[var(--text)]">{tr("الشروط والأحكام")}</span>
                    <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
                <Link to="/privacy" data-testid="menu-privacy" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
                    <Shield className="w-5 h-5 text-[var(--primary)]" />
                    <span className="flex-1 font-arabic font-bold text-sm text-[var(--text)]">{tr("سياسة الخصوصية")}</span>
                    <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
                <Link to="/contact" data-testid="menu-contact" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
                    <Mail className="w-5 h-5 text-[var(--primary)]" />
                    <span className="flex-1 font-arabic font-bold text-sm text-[var(--text)]">{tr("تواصل معنا / الإعلان")}</span>
                    <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
                <button data-testid="menu-logout" onClick={async () => { await logout(); nav("/"); }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600">
                    <LogOut className="w-5 h-5" />
                    <span className="flex-1 font-arabic font-bold text-sm text-start">{tr("تسجيل الخروج")}</span>
                </button>
            </div>

            <div className="flex gap-2 mb-4">
                <button data-testid="tab-listings" onClick={() => setTab("listings")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center justify-center gap-2 ${tab === "listings" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"}`}>
                    <ListIcon className="w-4 h-4" /> {t("my_listings")}
                </button>
                <button data-testid="tab-favorites" onClick={() => setTab("favorites")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center justify-center gap-2 ${tab === "favorites" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"}`}>
                    <Heart className="w-4 h-4" /> {t("favorites")}
                </button>
            </div>

            {tab === "listings" ? (
                myListings.length === 0 ? (
                    <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)]">
                        <p className="text-[var(--text-muted)] font-arabic-body mb-3">{tr("لم تنشر أي إعلان بعد")}</p>
                        <Link to="/post" data-testid="profile-post-cta" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{t("cta_post")}</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {myListings.map((l) => (
                            <div key={l.id} className="relative group">
                                <ListingCard listing={l} compact />
                                <button data-testid={`del-listing-${l.id}`} onClick={() => removeListing(l.id)} className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                favorites.length === 0 ? (
                    <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)]">
                        <p className="text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات في المفضلة")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {favorites.map((l) => <ListingCard key={l.id} listing={l} compact />)}
                    </div>
                )
            )}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-[var(--surface-elevated)] rounded-2xl p-3 border border-[var(--border)]">
            <div className="font-latin font-black text-xl text-[var(--primary)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)] font-arabic-body">{label}</div>
        </div>
    );
}
