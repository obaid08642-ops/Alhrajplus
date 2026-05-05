import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Globe, Moon, Sun, User, LogOut, Mic, Camera, Shield, Settings as SettingsIcon, Info, FileText, Mail, Clock, TrendingUp, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";

export default function TopBar() {
    const { isDark, toggle } = useTheme();
    const { user, logout } = useAuth();
    const { t, lang, setLang, available } = useI18n();
    const nav = useNavigate();
    const [openMenu, setOpenMenu] = useState(null);
    const [showSugg, setShowSugg] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const [trending, setTrending] = useState([]);
    const [history, setHistory] = useState([]);
    const ref = useRef();
    const searchRef = useRef();
    const inputRef = useRef();

    useEffect(() => {
        const close = (e) => {
            if (!ref.current?.contains(e.target)) setOpenMenu(null);
            if (!searchRef.current?.contains(e.target)) setShowSugg(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    // Load trending + history when search opens
    const loadSuggestions = async () => {
        try {
            const [t1, h1] = await Promise.all([
                api.get("/search/trending", { params: { limit: 8 } }),
                user ? api.get("/search/history", { params: { limit: 8 } }) : Promise.resolve({ data: [] }),
            ]);
            setTrending(t1.data || []);
            setHistory(h1.data || []);
        } catch (e) { /* silent */ }
    };

    const submitSearch = async (q) => {
        const query = (q || "").trim();
        if (!query) return;
        try { await api.post("/search/log", { query }); } catch (e) { /* silent */ }
        setShowSugg(false);
        nav(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleSearchKey = (e) => {
        if (e.key === "Enter") submitSearch(searchVal || e.target.value);
    };

    const onSearchFocus = () => {
        setShowSugg(true);
        loadSuggestions();
    };

    const removeHistoryItem = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete("/search/history", { data: { query: id } });
            setHistory((h) => h.filter((x) => x.id !== id));
        } catch (err) { /* silent */ }
    };

    const clearAllHistory = async () => {
        try {
            await api.delete("/search/history", { data: { all: true } });
            setHistory([]);
        } catch (err) { /* silent */ }
    };

    const startVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert(tr("المتصفح لا يدعم البحث الصوتي. جرّب Chrome أو Safari الحديث")); return; }
        const r = new SR();
        r.lang = "ar-SA";
        r.continuous = false;
        r.interimResults = false;
        r.onresult = (e) => {
            const text = e.results[0][0].transcript;
            submitSearch(text);
        };
        r.onerror = () => alert(tr("تعذر تشغيل الميكروفون. تحقق من الأذونات"));
        r.start();
    };

    const startImageSearch = async (file) => {
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) { alert(tr("حجم الصورة كبير جداً (الحد الأقصى 8MB)")); return; }
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const dataUrl = reader.result;
                const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/image-search`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image_base64: dataUrl }),
                });
                if (!res.ok) { alert(tr("تعذر تحليل الصورة. حاول لاحقاً.")); return; }
                const data = await res.json();
                const q = (data.query || "").trim();
                if (!q) { alert(tr("لم نتمكن من فهم الصورة. حاول بصورة أوضح.")); return; }
                nav(`/search?q=${encodeURIComponent(q)}&from=image`);
            } catch (e) {
                alert(tr("خطأ في البحث بالصورة"));
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-b from-[#4FB6E6] to-[#3AA9DD] dark:from-[#0F1B3A] dark:to-[#152244] border-b border-[#2196D9]/40 dark:border-white/10 shadow-md">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-3" ref={ref}>
                <Link to="/" className="flex items-baseline gap-1 sm:gap-1.5 select-none shrink-0" data-testid="logo-link">
                    <img src="/logo-haraj.png" alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md" />
                </Link>

                {/* Search with suggestions */}
                <div className="flex-1 mx-1 sm:mx-2 relative" ref={searchRef}>
                    <div className={`flex items-center bg-white/95 dark:bg-[var(--surface)]/90 rounded-full px-3 py-2 border-2 border-white/30 dark:border-white/10 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-white transition-all`}>
                        <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <input
                            ref={inputRef}
                            data-testid="search-input"
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            onFocus={onSearchFocus}
                            placeholder={t("search_placeholder")}
                            onKeyDown={handleSearchKey}
                            className="bg-transparent flex-1 mx-2 outline-none text-xs sm:text-sm placeholder:text-[var(--text-muted)] text-[var(--text)] font-arabic-body min-w-0"
                        />
                        <button data-testid="voice-search-btn" onClick={startVoice} title={tr("بحث صوتي")} className="text-[var(--text-muted)] hover:text-[var(--primary-hover)] transition-colors shrink-0">
                            <Mic className="w-4 h-4" />
                        </button>
                        <label data-testid="image-search-btn" title={tr("بحث بالصورة")} className="text-[var(--text-muted)] hover:text-[var(--primary-hover)] transition-colors shrink-0 ms-1.5 cursor-pointer">
                            <Camera className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => startImageSearch(e.target.files[0])} />
                        </label>
                    </div>

                    {/* Suggestions dropdown */}
                    {showSugg && (
                        <div data-testid="search-suggestions" className="absolute top-12 inset-x-0 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-2 z-50 max-h-[70vh] overflow-y-auto font-arabic-body">
                            {history.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between px-4 py-2 text-xs text-[var(--text-muted)]">
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {tr("آخر بحوثاتك")}</span>
                                        <button data-testid="search-history-clear-all" onClick={clearAllHistory} className="text-red-500 hover:underline">{tr("مسح الكل")}</button>
                                    </div>
                                    {history.map((h) => (
                                        <div key={h.id} data-testid={`search-history-${h.id}`} className="flex items-center group hover:bg-[var(--primary)]/10 px-4 py-2 cursor-pointer">
                                            <button onClick={() => submitSearch(h.query)} className="flex-1 text-start text-sm text-[var(--text)] truncate">{h.query}</button>
                                            <button data-testid={`search-history-del-${h.id}`} onClick={(e) => removeHistoryItem(h.id, e)} className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {trending.length > 0 && (
                                <div className={history.length > 0 ? "border-t border-[var(--border)] mt-1 pt-1" : ""}>
                                    <div className="px-4 py-2 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" /> {tr("الأكثر بحثاً")}
                                    </div>
                                    {trending.map((trd) => (
                                        <button key={trd.query} data-testid={`search-trending-${trd.query.replace(/\s/g, '_')}`} onClick={() => submitSearch(trd.query)} className="w-full flex items-center justify-between px-4 py-2 text-start text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]">
                                            <span className="truncate">{trd.query}</span>
                                            <span className="text-[10px] text-[var(--text-muted)] shrink-0 ms-2">🔥 {trd.count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {history.length === 0 && trending.length === 0 && (
                                <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                                    {tr("ابدأ بالبحث لتظهر اقتراحات هنا")}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Language */}
                <div className="relative">
                    <button data-testid="lang-btn" onClick={() => setOpenMenu(openMenu === "lang" ? null : "lang")} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center border border-white/25 dark:border-white/15 transition-all backdrop-blur">
                        <Globe className="w-4 h-4 text-white" />
                    </button>
                    {openMenu === "lang" && (
                        <div className="absolute top-12 end-0 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-2 min-w-[150px] z-50">
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

                <button data-testid="theme-toggle-btn" onClick={toggle} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center border border-white/25 dark:border-white/15 transition-all backdrop-blur">
                    {isDark ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4 text-white" />}
                </button>

                {/* User menu */}
                {user ? (
                    <div className="relative">
                        <button data-testid="user-menu-btn" onClick={() => setOpenMenu(openMenu === "user" ? null : "user")} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[var(--primary-hover)] hover:bg-white/90 flex items-center justify-center transition-all shadow-md">
                            <span className="font-bold text-sm font-arabic">{user.name?.[0] || "U"}</span>
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
                                <Link to="/settings" data-testid="settings-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
                                    <SettingsIcon className="w-4 h-4" /> {tr("الإعدادات")}
                                </Link>
                                <Link to="/about" data-testid="about-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
                                    <Info className="w-4 h-4" /> {tr("عن التطبيق")}
                                </Link>
                                <Link to="/terms" data-testid="terms-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
                                    <FileText className="w-4 h-4" /> {tr("الشروط")}
                                </Link>
                                <Link to="/contact" data-testid="contact-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
                                    <Mail className="w-4 h-4" /> {tr("تواصل / الإعلان")}
                                </Link>
                                {user.role === "admin" && (
                                    <Link to="/admin" data-testid="admin-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--accent)] font-bold border-t border-[var(--border)]" onClick={() => setOpenMenu(null)}>
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
                    <Link to="/login" data-testid="login-cta" className="bg-[var(--secondary)] dark:bg-[var(--accent)] text-white dark:text-[#0A1128] px-3 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm hover:scale-105 hover:shadow-lg transition-all font-arabic shrink-0 border border-white/15">
                        {t("login")}
                    </Link>
                )}
            </div>
        </header>
    );
}
