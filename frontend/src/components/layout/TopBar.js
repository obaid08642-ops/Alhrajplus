import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Globe, Moon, Sun, User, LogOut, Mic, Camera, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useState, useRef, useEffect } from "react";

export default function TopBar() {
    const { isDark, toggle } = useTheme();
    const { user, logout } = useAuth();
    const { t, lang, setLang, available } = useI18n();
    const nav = useNavigate();
    const [openMenu, setOpenMenu] = useState(null);
    const ref = useRef();

    useEffect(() => {
        const close = (e) => { if (!ref.current?.contains(e.target)) setOpenMenu(null); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const handleSearch = (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
            nav(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
        }
    };

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--surface)]/75 border-b border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3" ref={ref}>
                <Link to="/" className="flex items-baseline gap-1 sm:gap-1.5 select-none shrink-0" data-testid="logo-link">
                    <span className="font-arabic font-black text-xl sm:text-2xl tracking-tight text-[var(--secondary)] dark:text-white">الحراج</span>
                    <span className="font-arabic font-bold text-xs sm:text-sm text-[var(--primary)] -mt-1">بلس</span>
                </Link>

                <div className="flex-1 mx-1 sm:mx-3 relative">
                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-full px-3 sm:px-4 py-2 sm:py-2.5 border border-[var(--border)] hover:border-[var(--primary)] transition-all">
                        <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <input
                            data-testid="search-input"
                            placeholder={t("search_placeholder")}
                            onKeyDown={handleSearch}
                            className="bg-transparent flex-1 mx-2 sm:mx-3 outline-none text-sm placeholder:text-[var(--text-muted)] text-[var(--text)] font-arabic-body min-w-0"
                        />
                        <button data-testid="voice-search-btn" title="بحث صوتي" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors hidden sm:block">
                            <Mic className="w-4 h-4" />
                        </button>
                        <button data-testid="image-search-btn" title="بحث بالصورة" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors hidden sm:block ms-2">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Language */}
                <div className="relative">
                    <button data-testid="lang-btn" onClick={() => setOpenMenu(openMenu === "lang" ? null : "lang")} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/20 flex items-center justify-center border border-[var(--border)] transition-all">
                        <Globe className="w-4 h-4 text-[var(--text)]" />
                    </button>
                    {openMenu === "lang" && (
                        <div className="absolute top-12 end-0 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-2 min-w-[140px] z-50">
                            {available.map((l) => (
                                <button key={l} onClick={() => { setLang(l); setOpenMenu(null); }} data-testid={`lang-opt-${l}`}
                                    className={`w-full px-4 py-2 text-sm text-start hover:bg-[var(--primary)]/10 ${lang === l ? "text-[var(--primary)] font-bold" : "text-[var(--text)]"}`}>
                                    {l === "ar" && "🇸🇦 العربية"}
                                    {l === "en" && "🇬🇧 English"}
                                    {l === "ur" && "🇵🇰 اردو"}
                                    {l === "hi" && "🇮🇳 हिन्दी"}
                                    {l === "bn" && "🇧🇩 বাংলা"}
                                    {l === "fr" && "🇫🇷 Français"}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button data-testid="theme-toggle-btn" onClick={toggle} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/20 flex items-center justify-center border border-[var(--border)] transition-all">
                    {isDark ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4 text-[var(--secondary)]" />}
                </button>

                {/* User menu */}
                {user ? (
                    <div className="relative">
                        <button data-testid="user-menu-btn" onClick={() => setOpenMenu(openMenu === "user" ? null : "user")} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] flex items-center justify-center transition-all">
                            <span className="text-[var(--primary-fg)] font-bold text-sm font-arabic">{user.name?.[0] || "U"}</span>
                        </button>
                        {openMenu === "user" && (
                            <div className="absolute top-12 end-0 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-2 min-w-[200px] z-50 font-arabic">
                                <div className="px-4 py-2 border-b border-[var(--border)]">
                                    <div className="font-bold text-sm text-[var(--text)]">{user.name}</div>
                                    <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
                                </div>
                                <Link to="/profile" data-testid="profile-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
                                    <User className="w-4 h-4" /> {t("nav_profile")}
                                </Link>
                                {user.role === "admin" && (
                                    <Link to="/admin" data-testid="admin-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--accent)] font-bold" onClick={() => setOpenMenu(null)}>
                                        <Shield className="w-4 h-4" /> {t("admin_panel")}
                                    </Link>
                                )}
                                <button data-testid="logout-btn" onClick={async () => { await logout(); setOpenMenu(null); nav("/"); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                                    <LogOut className="w-4 h-4" /> {t("logout")}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" data-testid="login-cta" className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-all font-arabic shrink-0">
                        {t("login")}
                    </Link>
                )}
            </div>
        </header>
    );
}
