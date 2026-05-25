import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import { Heart, ListIcon, LogOut, Star, Edit3, Trash2, Gift, Copy, Award, Settings, Info, FileText, Mail, Shield, ChevronLeft, Wallet, Globe } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";

// Bold country card — primary entry point for changing country (per UX spec).
function CountryCard() {
    const { country, setCountry } = useCountry();
    const [open, setOpen] = useState(false);
    const COUNTRIES = [
        { code: "SA", flag: "🇸🇦", name_ar: "السعودية" },
        { code: "AE", flag: "🇦🇪", name_ar: "الإمارات" },
        { code: "KW", flag: "🇰🇼", name_ar: "الكويت" },
        { code: "QA", flag: "🇶🇦", name_ar: "قطر" },
        { code: "BH", flag: "🇧🇭", name_ar: "البحرين" },
        { code: "OM", flag: "🇴🇲", name_ar: "عُمان" },
        { code: "EG", flag: "🇪🇬", name_ar: "مصر" },
    ];
    const current = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl p-5 border-2 border-emerald-300/40 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-black/30 flex items-center justify-center text-2xl shadow-sm">{current.flag}</div>
                <div className="flex-1 min-w-0">
                    <div className="font-arabic font-black text-base text-[var(--text)] flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-600" /> {tr("الدولة الحالية")}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-arabic-body mt-0.5">{tr("كل الإعلانات والستوريز والمزادات ستظهر لهذه الدولة فقط")}</div>
                </div>
                <button data-testid="profile-change-country-btn" onClick={() => setOpen((o) => !o)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full font-arabic font-black text-sm">
                    {current.name_ar}
                </button>
            </div>
            {open && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {COUNTRIES.map((c) => (
                        <button
                            key={c.code}
                            data-testid={`profile-country-pick-${c.code}`}
                            onClick={() => { setCountry(c.code); setOpen(false); }}
                            className={`rounded-xl py-2 px-2 flex flex-col items-center gap-1 border-2 transition-all ${country === c.code ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" : "border-[var(--border)] bg-[var(--surface)] hover:border-emerald-400"}`}
                        >
                            <span className="text-2xl">{c.flag}</span>
                            <span className="text-[11px] font-arabic font-bold text-[var(--text)]">{c.name_ar}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const { t, tr } = useI18n();
    const nav = useNavigate();
    const [tab, setTab] = useState("listings");
    const [myListings, setMyListings] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [referral, setReferral] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (!loading && !user) nav("/login");
    }, [loading, user, nav]);

    useEffect(() => {
        if (!user) return;
        api.get("/listings/me/mine").then(({ data }) => setMyListings(data));
        api.get("/favorites").then(({ data }) => setFavorites(data));
        api.get("/referral/me").then(({ data }) => setReferral(data));
        api.get("/auth/me/stats").then(({ data }) => setStats(data)).catch(() => {});
    }, [user]);

    const togglePhoneVisibility = async () => {
        try {
            const next = !(user.show_phone ?? true);
            await api.put("/auth/me", { show_phone: next });
            window.location.reload();
        } catch (_) {}
    };

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
                        <PhoneEditor user={user} />
                        {stats && (
                            <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-latin" data-testid="profile-stats">
                                <span className="text-[var(--text-muted)]">📦 {stats.total_listings} {tr("إعلان")}</span>
                                <span className="text-[var(--text-muted)]">✓ {stats.active_listings} {tr("نشط")}</span>
                                <span className="text-[var(--text-muted)]">❤ {stats.favorites_count}</span>
                                {stats.joined_at && (
                                    <span className="text-[var(--text-muted)]">📅 {tr("انضم في")} {new Date(stats.joined_at).toLocaleDateString()}</span>
                                )}
                            </div>
                        )}
                        <button onClick={togglePhoneVisibility} className="mt-2 text-[11px] font-arabic-body text-[var(--primary)] hover:underline" data-testid="toggle-phone-visibility">
                            {user.show_phone === false ? tr("📵 الجوال مخفي - إظهار") : tr("📞 الجوال ظاهر - إخفاء")}
                        </button>
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

            {/* Country switcher — bold card. The ONLY place to change country
                besides initial signup. Per UX spec, removed from topbar + post screen. */}
            <CountryCard />

            {/* Premium locked notice */}
            <div className="bg-[var(--surface)] rounded-2xl p-3 border border-dashed border-[var(--border)] mb-4 text-center text-xs text-[var(--text-muted)] font-arabic-body">
                {t("premium_locked")}
            </div>

            {/* Quick menu — Settings / About / Terms / Contact / Logout */}
            <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] mb-6 overflow-hidden">
                <Link to="/wallet" data-testid="menu-wallet" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
                    <Wallet className="w-5 h-5 text-[var(--accent)]" />
                    <span className="flex-1 font-arabic font-bold text-sm text-[var(--text)]">{tr("محفظتي")}</span>
                    <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                </Link>
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

function PhoneEditor({ user }) {
    const [editing, setEditing] = useState(false);
    const [phone, setPhone] = useState(user.phone || "");
    const [busy, setBusy] = useState(false);
    const display = user.phone_full || user.phone;

    const save = async () => {
        const clean = phone.trim().replace(/\s/g, "");
        if (!clean) return setEditing(false);
        setBusy(true);
        try {
            await api.put("/auth/me", { phone: clean });
            window.location.reload();
        } catch (e) {
            alert(e.response?.data?.detail || tr("تعذر حفظ الرقم"));
            setBusy(false);
        }
    };

    if (editing) {
        return (
            <div className="mt-2 flex items-center gap-2 max-w-sm">
                <span className="text-sm font-bold font-latin shrink-0 text-[var(--text-muted)]">{user.country_code === "EG" ? "+20" : user.country_code === "AE" ? "+971" : user.country_code === "KW" ? "+965" : user.country_code === "QA" ? "+974" : user.country_code === "BH" ? "+973" : user.country_code === "OM" ? "+968" : "+966"}</span>
                <input data-testid="profile-phone-input" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="5xxxxxxxx" className="flex-1 bg-[var(--surface-elevated)] rounded-lg px-3 py-1.5 text-sm border border-[var(--primary)] outline-none font-latin tracking-wider" autoFocus />
                <button data-testid="profile-phone-save" onClick={save} disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-lg text-xs font-arabic font-bold disabled:opacity-50">{busy ? "..." : tr("حفظ")}</button>
                <button onClick={() => { setEditing(false); setPhone(user.phone || ""); }} className="text-[var(--text-muted)] text-xs font-arabic">{tr("إلغاء")}</button>
            </div>
        );
    }
    return (
        <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1 flex items-center gap-2 flex-wrap">
            {display ? (
                <>
                    <span className="font-latin tracking-wider">{display}</span>
                    {user.city && <span> • {user.city}</span>}
                </>
            ) : (
                <span className="text-amber-600 dark:text-amber-400">{tr("⚠️ لم يتم إضافة رقم جوال")}</span>
            )}
            <button data-testid="profile-phone-edit" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline text-[10px] font-arabic font-bold">
                <Edit3 className="w-3 h-3" /> {display ? tr("تعديل") : tr("إضافة الجوال")}
            </button>
        </p>
    );
}
