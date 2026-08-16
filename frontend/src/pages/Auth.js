import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Globe, MapPin, ArrowLeft, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import api, { formatApiError } from "@/lib/api";

// Floating language switcher for the unauthenticated screens. Placed at the top-
// left of every Auth card so visitors can pick their language before signing in.
function LangButton() {
    const { lang, setLang, available } = useI18n();
    const [open, setOpen] = useState(false);
    const labels = { ar: "🇸🇦 العربية", en: "🇬🇧 English", ur: "🇵🇰 اردو", hi: "🇮🇳 हिन्दी", bn: "🇧🇩 বাংলা", fr: "🇫🇷 Français" };
    return (
        <div className="relative">
            <button
                type="button"
                data-testid="auth-lang-btn"
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text)] font-arabic-body hover:border-[var(--primary)]"
            >
                <Globe className="w-3.5 h-3.5" />
                <span>{labels[lang] || lang}</span>
            </button>
            {open && (
                <div data-testid="auth-lang-menu" className="absolute top-10 start-0 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-1.5 min-w-[150px] z-50">
                    {available.map((l) => (
                        <button
                            key={l}
                            type="button"
                            data-testid={`auth-lang-opt-${l}`}
                            onClick={() => { setLang(l); setOpen(false); }}
                            className={`w-full px-4 py-2 text-sm text-start hover:bg-[var(--primary)]/10 ${lang === l ? "text-[var(--primary)] font-bold" : "text-[var(--text)]"}`}
                        >
                            {labels[l]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Direct Google OAuth — no third-party auth proxy.
// Backend exposes /api/auth/google/start which returns a Google consent URL.
async function startGoogleLogin() {
    try {
        const { data } = await api.get("/auth/google/start");
        if (data?.auth_url) {
            window.location.href = data.auth_url;
        } else {
            alert(tr("تعذر بدء تسجيل الدخول بـ Google"));
        }
    } catch (e) {
        alert(tr("Google OAuth غير مُعد على الخادم. تواصل مع الدعم."));
    }
}

function SocialLoginButtons() {
    // Fetch which OAuth providers are configured on the backend so we can hide buttons
    // that would otherwise show a misleading "غير مُعد على الخادم" error.
    const [providers, setProviders] = useState({ google: true, apple: true, x: true, snapchat: true });
    useEffect(() => {
        api.get("/auth/providers").then(({ data }) => setProviders(data)).catch(() => {});
    }, []);

    const startX = async () => {
        try {
            const { data } = await api.get("/auth/x/start");
            window.location.href = data.auth_url;
        } catch (e) {
            alert(tr("تعذر بدء تسجيل الدخول بـ X — تأكد من إعدادات Developer Portal"));
        }
    };
    const startSnap = async () => {
        try {
            const { data } = await api.get("/auth/snapchat/start");
            window.location.href = data.auth_url;
        } catch (e) {
            alert(tr("تعذر بدء تسجيل الدخول بـ Snapchat. تأكد من إعدادات Snap Developer Portal."));
        }
    };
    const startApple = async () => {
        try {
            const { data } = await api.get("/auth/apple/start");
            if (data?.auth_url) {
                window.location.href = data.auth_url;
            } else {
                alert(tr("تعذر بدء تسجيل الدخول بـ Apple"));
            }
        } catch (e) {
            alert(tr("Apple Sign In غير مُعد على الخادم. تواصل مع الدعم."));
        }
    };
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-[var(--border)]"></div>
                <span className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("أو")}</span>
                <div className="flex-1 h-px bg-[var(--border)]"></div>
            </div>
            <button
                type="button"
                data-testid="google-login-btn"
                onClick={startGoogleLogin}
                style={{ display: providers.google ? undefined : "none" }}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-[var(--border)] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all font-arabic"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {tr("متابعة بحساب Google")}
            </button>
            <button
                type="button"
                data-testid="apple-login-btn"
                onClick={startApple}
                style={{ display: providers.apple ? undefined : "none" }}
                className="w-full bg-black hover:bg-gray-900 text-white border border-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all font-arabic"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.04 12.65c-.02-2.18 1.78-3.23 1.86-3.28-1.02-1.49-2.6-1.69-3.16-1.71-1.34-.14-2.62.79-3.31.79-.68 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.59 2.17-1.53 2.65-.39 6.58 1.1 8.73.73 1.05 1.59 2.24 2.72 2.2 1.09-.04 1.51-.71 2.83-.71 1.32 0 1.69.71 2.85.69 1.18-.02 1.92-1.07 2.63-2.13.83-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.97 6.16c.6-.73 1-1.74.89-2.74-.86.04-1.9.57-2.52 1.29-.56.64-1.05 1.67-.92 2.65.96.08 1.94-.49 2.55-1.2z" />
                </svg>
                {tr("متابعة بحساب Apple")}
            </button>
            <div className="grid grid-cols-2 gap-2" style={{ display: (providers.x || providers.snapchat) ? undefined : "none" }}>
                <button
                    type="button"
                    data-testid="x-login-btn"
                    onClick={startX}
                    style={{ display: providers.x ? undefined : "none" }}
                    className="bg-black hover:bg-gray-900 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all font-arabic"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.55 8.625L23 22h-6.844l-5.36-7.005L4.62 22H1.36l8.07-9.225L1 2h7l4.846 6.405L18.244 2zm-1.197 18h1.86L7.04 4H5.07l11.977 16z"/></svg>
                    {tr("متابعة بـ X")}
                </button>
                <button
                    type="button"
                    data-testid="snapchat-login-btn"
                    onClick={startSnap}
                    style={{ display: providers.snapchat ? undefined : "none" }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all font-arabic"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166.34c2.853-.04 5.49 1.92 6.34 4.6.31 1.05.21 2.18.21 3.27 0 .85-.21 1.7-.07 2.55.31 0 .61-.07.92-.13.21-.04.42-.07.62-.04.42.07.85.21.92.71.07.55-.42.85-.85.99-.42.21-.92.28-1.34.42-.42.21-.71.55-.85.99-.07.21-.07.42 0 .62.42 1.27 1.34 2.4 2.55 3.06.42.21.92.42 1.41.42.21 0 .42-.07.62.07.21.21.21.55 0 .78-.34.42-.85.71-1.34.99-.71.34-1.55.42-2.33.42-.42 0-.85.13-1.2.42-.42.34-.62.85-.92 1.27-.34.42-.78.55-1.27.55-.42 0-.85-.13-1.27-.21-.42-.07-.85-.07-1.27 0-.55.07-1.06.34-1.55.42-.21.07-.42.07-.62 0-.42-.13-.71-.42-.92-.78-.34-.42-.62-.85-1.06-1.13-.42-.28-.99-.34-1.48-.42-.71-.07-1.41-.13-2.05-.42-.55-.21-.99-.55-1.34-.99-.21-.21-.21-.55-.07-.78.21-.21.42-.13.62-.13.42 0 .85-.13 1.27-.34 1.27-.62 2.26-1.84 2.69-3.21.07-.21 0-.42-.07-.62-.21-.42-.55-.78-.99-.92-.42-.13-.85-.21-1.27-.42-.42-.13-.92-.42-.85-.99 0-.42.42-.62.85-.71.21-.07.42 0 .62.04.34.07.62.13.92.13.13-.85-.07-1.7-.07-2.55 0-1.06-.07-2.18.21-3.21C6.747 2.18 9.319.3 12.166.34z"/></svg>
                    Snapchat
                </button>
            </div>
        </div>
    );
}

export function LoginPage() {
    const { login } = useAuth();
    const { t, tr } = useI18n();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr(""); setBusy(true);
        try {
            await login(email, password);
            nav("/");
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || e.message);
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                    <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />{tr(" الرئيسية")}</Link>
                    <LangButton />
                </div>
                <div className="flex items-baseline gap-1.5 justify-center mb-2 select-none">
                    <span className="font-arabic font-black text-3xl tracking-tight text-[var(--secondary)] dark:text-white">{tr("الحراج")}</span>
                    <span className="font-arabic font-bold text-base text-[var(--primary)]">{tr("بلس")}</span>
                </div>
                <h1 className="font-arabic font-bold text-xl text-center text-[var(--text)] mb-1">{t("login")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">{tr("مرحباً بعودتك 👋")}</p>

                {err && <div data-testid="login-error" className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}

                <form onSubmit={submit} className="space-y-3">
                    <Field icon={Mail} type="email" placeholder={t("email")} value={email} onChange={setEmail} testid="login-email" />
                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                        <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                        <input data-testid="login-password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")}
                            className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="text-[var(--text-muted)]">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <Link to="/forgot-password" data-testid="forgot-password-link" className="text-xs text-[var(--primary)] font-bold font-arabic-body">{t("forgot_password")}</Link>
                    </div>
                    <button data-testid="login-submit" disabled={busy} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-xl font-bold text-sm hover:bg-[var(--primary-hover)] transition-all font-arabic disabled:opacity-50">
                        {busy ? t("loading") : t("login")}
                    </button>
                </form>

                <SocialLoginButtons />

                <div className="text-center mt-5 text-sm font-arabic-body text-[var(--text-muted)]">
                    {t("no_account")} <Link to="/register" data-testid="goto-register" className="text-[var(--primary)] font-bold">{t("register")}</Link>
                </div>
            </div>
        </div>
    );
}

export function RegisterPage() {
    const { register } = useAuth();
    const { t, tr } = useI18n();
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const refFromUrl = searchParams.get("ref") || "";
    const [form, setForm] = useState({
        name: "", email: "", password: "", phone: "", country_code: "SA", city: "", referral_code: refFromUrl,
    });
    const [confirmPw, setConfirmPw] = useState("");
    const [countries, setCountries] = useState([]);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    // Country metadata is requested once; tr is a stable translation helper for the fallback message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        api.get("/meta/countries")
            .then(({ data }) => setCountries(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])))
            .catch(() => { setCountries([]); setErr(tr("تعذر تحميل الدول، يمكنك المتابعة بالدولة الافتراضية السعودية")); });
    }, []);

    const safeCountries = Array.isArray(countries) ? countries : [];
    const cur = safeCountries.find((c) => c.code === form.country_code) || { code: "SA", phone_code: "+966", phone_length: 9, cities: [] };

    const phoneHint = (() => {
        const map = {
            SA: "يبدأ بـ 5، 9 أرقام",
            AE: "يبدأ بـ 50/52/54/55/56/58، 9 أرقام",
            KW: "يبدأ بـ 5/6/9، 8 أرقام",
            QA: "يبدأ بـ 3/5/6/7، 8 أرقام",
            BH: "يبدأ بـ 3/6/9، 8 أرقام",
            OM: "يبدأ بـ 7/9، 8 أرقام",
        };
        return map[form.country_code] || "";
    })();

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        if (form.password.length < 8) { setErr("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
        if (form.password !== confirmPw) { setErr("كلمتا المرور غير متطابقتين"); return; }
        const s = passwordStrength(form.password);
        if (s.label === "ضعيفة جداً") { setErr("كلمة المرور ضعيفة جداً. استخدم أحرف كبيرة وصغيرة وأرقام."); return; }
        setBusy(true);
        try {
            await register(form);
            nav("/");
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || e.message);
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                    <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />{tr(" الرئيسية")}</Link>
                    <LangButton />
                </div>
                <div className="flex items-baseline gap-1.5 justify-center mb-2 select-none">
                    <span className="font-arabic font-black text-3xl tracking-tight text-[var(--secondary)] dark:text-white">{tr("الحراج")}</span>
                    <span className="font-arabic font-bold text-base text-[var(--primary)]">{tr("بلس")}</span>
                </div>
                <h1 className="font-arabic font-bold text-xl text-center text-[var(--text)] mb-1">{t("register")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">{tr("انضم لمجتمع الخليج 🇸🇦🇦🇪🇰🇼🇶🇦🇧🇭🇴🇲")}</p>

                {err && <div data-testid="register-error" className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}

                <form onSubmit={submit} className="space-y-3">
                    <Field icon={User} placeholder={t("name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="reg-name" />
                    <Field icon={Mail} type="email" placeholder={t("email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="reg-email" />
                    <PasswordFieldWithStrength value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={`${t("password")} (8 أحرف على الأقل)`} testid="reg-password" />
                    <PasswordFieldWithStrength value={confirmPw} onChange={setConfirmPw} placeholder={tr("تأكيد كلمة المرور")} testid="reg-confirm-password" />

                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                        <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                        <select data-testid="reg-country" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value, city: "", phone: "" })} className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body">
                            {safeCountries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name_ar} ({c.phone_code})</option>)}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                            <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-sm text-[var(--text-muted)] font-arabic-body px-2">{cur?.phone_code}</span>
                            <input data-testid="reg-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder={tr("رقم الجوال")} maxLength={cur?.phone_length || 9}
                                className="flex-1 bg-transparent outline-none px-2 py-3 text-sm text-[var(--text)] font-arabic-body" />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 font-arabic-body">{phoneHint}</p>
                    </div>

                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                        <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                        <select data-testid="reg-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body">
                            <option value="">{tr("اختر المدينة")}</option>
                            {(Array.isArray(cur?.cities) ? cur.cities : []).map((ct) => <option key={ct.name_ar} value={ct.name_ar}>{ct.name_ar}</option>)}
                        </select>
                    </div>

                    <Field icon={Gift} placeholder={tr("كود الإحالة (اختياري)")} value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v.toUpperCase() })} testid="reg-referral" />

                    <button data-testid="reg-submit" disabled={busy} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-xl font-bold text-sm hover:bg-[var(--primary-hover)] transition-all font-arabic disabled:opacity-50">
                        {busy ? t("loading") : t("register")}
                    </button>
                </form>

                <SocialLoginButtons />

                <div className="text-center mt-5 text-sm font-arabic-body text-[var(--text-muted)]">
                    {t("already_have_account")} <Link to="/login" data-testid="goto-login" className="text-[var(--primary)] font-bold">{t("login")}</Link>
                </div>
            </div>
        </div>
    );
}

export function ForgotPasswordPage() {
    const { t, tr } = useI18n();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resetLink, setResetLink] = useState("");
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post("/auth/forgot-password", { email });
            setSent(true);
            setEmailSent(!!data.email_sent);
            if (data.dev_reset_link) setResetLink(data.dev_reset_link);
        } catch (_) {} finally { setBusy(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
                <Link to="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />{tr(" العودة")}</Link>
                <h1 className="font-arabic font-black text-2xl text-center text-[var(--text)] mb-1">{t("forgot_password")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">{tr("سنرسل لك رابط إعادة التعيين على بريدك الإلكتروني")}</p>
                {sent ? (
                    <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-4 text-sm font-arabic-body">
                        {emailSent ? (
                            <>
                                <div className="text-base font-bold mb-1">{tr("✅ تم إرسال الرابط بنجاح!")}</div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">{tr("تحقق من صندوق البريد الوارد ومجلد الـ Spam. الرابط صالح لمدة ساعة.")}</p>
                            </>
                        ) : (
                            <>
                                <div className="text-base font-bold mb-1">{tr("✅ تم إنشاء الرابط")}</div>
                                {resetLink && (
                                    <div className="mt-3 pt-3 border-t border-[var(--success)]/30">
                                        <p className="text-xs text-[var(--text-muted)] mb-2">⚠️ <b>{tr("وضع تطوير:")}</b>{tr(" خدمة الإيميل غير مفعّلة بعد. استخدم الرابط مباشرة:")}</p>
                                        <Link to={resetLink} data-testid="dev-reset-link" className="bg-[var(--primary)] text-[var(--primary-fg)] inline-block px-4 py-2 rounded-full text-xs font-bold">{tr("إعادة تعيين الآن")}</Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        <Field icon={Mail} type="email" placeholder={t("email")} value={email} onChange={setEmail} testid="forgot-email" />
                        <button data-testid="forgot-submit" disabled={busy} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-xl font-bold text-sm hover:bg-[var(--primary-hover)] transition-all font-arabic disabled:opacity-50">
                            {busy ? t("loading") : "إرسال رابط الاستعادة"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function passwordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
        { label: "ضعيفة جداً", color: "bg-red-500", width: "w-1/5" },
        { label: "ضعيفة", color: "bg-orange-500", width: "w-2/5" },
        { label: "متوسطة", color: "bg-yellow-500", width: "w-3/5" },
        { label: "قوية", color: "bg-emerald-500", width: "w-4/5" },
        { label: "قوية جداً", color: "bg-emerald-600", width: "w-full" },
    ];
    return levels[Math.max(0, Math.min(score - 1, 4))];
}

function PasswordFieldWithStrength({ value, onChange, placeholder, testid }) {
    const [show, setShow] = useState(false);
    const s = value ? passwordStrength(value) : null;
    return (
        <div>
            <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                <input data-testid={testid} type={show ? "text" : "password"} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                    className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body" />
                <button type="button" onClick={() => setShow(!show)} className="text-[var(--text-muted)]">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {s && (
                <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                        <div className={`${s.color} ${s.width} h-full transition-all`}></div>
                    </div>
                    <span className="text-[10px] font-arabic-body text-[var(--text-muted)]">{s.label}</span>
                </div>
            )}
        </div>
    );
}

export function ResetPasswordPage() {
    const { t, tr } = useI18n();
    const nav = useNavigate();
    const [params] = useSearchParams();
    const token = params.get("token");
    const [password, setPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        if (password.length < 8) { setErr("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
        if (password !== confirmPw) { setErr("كلمتا المرور غير متطابقتين"); return; }
        const s = passwordStrength(password);
        if (s.label === "ضعيفة جداً" || s.label === "ضعيفة") {
            setErr("كلمة المرور ضعيفة. استخدم أحرف كبيرة وصغيرة وأرقام ورموز.");
            return;
        }
        setBusy(true);
        try {
            await api.post("/auth/reset-password", { token, new_password: password });
            setSuccess(true);
            setTimeout(() => nav("/login"), 2000);
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || e.message || "حدث خطأ، حاول لاحقاً");
        } finally { setBusy(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
                <h1 className="font-arabic font-black text-2xl text-center text-[var(--text)] mb-2">{t("reset_password")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">{tr("اختر كلمة مرور قوية وآمنة")}</p>
                {success ? (
                    <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-4 text-sm font-arabic-body text-center">{tr("✅ تم تغيير كلمة المرور بنجاح! جاري تحويلك...")}</div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        {err && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 font-arabic-body">{err}</div>}
                        <PasswordFieldWithStrength value={password} onChange={setPassword} placeholder={tr("كلمة المرور الجديدة")} testid="reset-password" />
                        <PasswordFieldWithStrength value={confirmPw} onChange={setConfirmPw} placeholder={tr("تأكيد كلمة المرور")} testid="reset-confirm-password" />
                        <button data-testid="reset-submit" disabled={busy || !token} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-xl font-bold text-sm font-arabic disabled:opacity-50">{busy ? t("loading") : "حفظ كلمة المرور الجديدة"}</button>
                    </form>
                )}
            </div>
        </div>
    );
}

function Field({ icon: Icon, type = "text", placeholder, value, onChange, testid, minLength }) {
    return (
        <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
            <Icon className="w-4 h-4 text-[var(--text-muted)]" />
            <input data-testid={testid} type={type} minLength={minLength} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body" />
        </div>
    );
}
