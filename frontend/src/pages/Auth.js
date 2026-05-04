import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Globe, MapPin, ArrowLeft, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import api, { formatApiError } from "@/lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function startGoogleLogin() {
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

function SocialLoginButtons() {
    const comingSoon = (provider) => () => {
        alert(`تسجيل الدخول عبر ${provider} قريباً — بانتظار توفير مفاتيح API`);
    };
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-[var(--border)]"></div>
                <span className="text-xs text-[var(--text-muted)] font-arabic-body">أو</span>
                <div className="flex-1 h-px bg-[var(--border)]"></div>
            </div>
            <button
                type="button"
                data-testid="google-login-btn"
                onClick={startGoogleLogin}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-[var(--border)] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all font-arabic"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                متابعة بحساب Google
            </button>
            <div className="grid grid-cols-1 gap-2">
                <button
                    type="button"
                    data-testid="x-login-btn"
                    onClick={comingSoon("X (Twitter)")}
                    className="bg-black hover:bg-gray-900 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all font-arabic relative"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.55 8.625L23 22h-6.844l-5.36-7.005L4.62 22H1.36l8.07-9.225L1 2h7l4.846 6.405L18.244 2zm-1.197 18h1.86L7.04 4H5.07l11.977 16z"/></svg>
                    متابعة بـ X (Twitter)
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full">قريباً</span>
                </button>
            </div>
        </div>
    );
}

export function LoginPage() {
    const { login } = useAuth();
    const { t } = useI18n();
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
                <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> الرئيسية</Link>
                <div className="flex items-baseline gap-1.5 justify-center mb-2 select-none">
                    <span className="font-arabic font-black text-3xl tracking-tight text-[var(--secondary)] dark:text-white">الحراج</span>
                    <span className="font-arabic font-bold text-base text-[var(--primary)]">بلس</span>
                </div>
                <h1 className="font-arabic font-bold text-xl text-center text-[var(--text)] mb-1">{t("login")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">مرحباً بعودتك 👋</p>

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
    const { t } = useI18n();
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const refFromUrl = searchParams.get("ref") || "";
    const [form, setForm] = useState({
        name: "", email: "", password: "", phone: "", country_code: "SA", city: "", referral_code: refFromUrl,
    });
    const [countries, setCountries] = useState([]);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.get("/meta/countries").then(({ data }) => setCountries(data));
    }, []);

    const cur = countries.find((c) => c.code === form.country_code);

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
        setErr(""); setBusy(true);
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
                <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> الرئيسية</Link>
                <div className="flex items-baseline gap-1.5 justify-center mb-2 select-none">
                    <span className="font-arabic font-black text-3xl tracking-tight text-[var(--secondary)] dark:text-white">الحراج</span>
                    <span className="font-arabic font-bold text-base text-[var(--primary)]">بلس</span>
                </div>
                <h1 className="font-arabic font-bold text-xl text-center text-[var(--text)] mb-1">{t("register")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">انضم لمجتمع الخليج 🇸🇦🇦🇪🇰🇼🇶🇦🇧🇭🇴🇲</p>

                {err && <div data-testid="register-error" className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl p-3 mb-4 font-arabic-body">{err}</div>}

                <form onSubmit={submit} className="space-y-3">
                    <Field icon={User} placeholder={t("name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="reg-name" />
                    <Field icon={Mail} type="email" placeholder={t("email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="reg-email" />
                    <Field icon={Lock} type="password" placeholder={`${t("password")} (8 أحرف على الأقل)`} value={form.password} onChange={(v) => setForm({ ...form, password: v })} testid="reg-password" minLength={8} />

                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                        <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                        <select data-testid="reg-country" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value, city: "", phone: "" })} className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body">
                            {countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name_ar} ({c.phone_code})</option>)}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                            <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-sm text-[var(--text-muted)] font-arabic-body px-2">{cur?.phone_code}</span>
                            <input data-testid="reg-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder="رقم الجوال" maxLength={cur?.phone_length || 9}
                                className="flex-1 bg-transparent outline-none px-2 py-3 text-sm text-[var(--text)] font-arabic-body" />
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 font-arabic-body">{phoneHint}</p>
                    </div>

                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] px-3">
                        <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                        <select data-testid="reg-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="flex-1 bg-transparent outline-none px-3 py-3 text-sm text-[var(--text)] font-arabic-body">
                            <option value="">اختر المدينة</option>
                            {cur?.cities.map((ct) => <option key={ct.name_ar} value={ct.name_ar}>{ct.name_ar}</option>)}
                        </select>
                    </div>

                    <Field icon={Gift} placeholder="كود الإحالة (اختياري)" value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v.toUpperCase() })} testid="reg-referral" />

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
    const { t } = useI18n();
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
                <Link to="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> العودة</Link>
                <h1 className="font-arabic font-black text-2xl text-center text-[var(--text)] mb-1">{t("forgot_password")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">سنرسل لك رابط إعادة التعيين على بريدك الإلكتروني</p>
                {sent ? (
                    <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-4 text-sm font-arabic-body">
                        {emailSent ? (
                            <>
                                <div className="text-base font-bold mb-1">✅ تم إرسال الرابط بنجاح!</div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">تحقق من صندوق البريد الوارد ومجلد الـ Spam. الرابط صالح لمدة ساعة.</p>
                            </>
                        ) : (
                            <>
                                <div className="text-base font-bold mb-1">✅ تم إنشاء الرابط</div>
                                {resetLink && (
                                    <div className="mt-3 pt-3 border-t border-[var(--success)]/30">
                                        <p className="text-xs text-[var(--text-muted)] mb-2">⚠️ <b>وضع تطوير:</b> خدمة الإيميل غير مفعّلة بعد. استخدم الرابط مباشرة:</p>
                                        <Link to={resetLink} data-testid="dev-reset-link" className="bg-[var(--primary)] text-[var(--primary-fg)] inline-block px-4 py-2 rounded-full text-xs font-bold">إعادة تعيين الآن</Link>
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

export function ResetPasswordPage() {
    const { t } = useI18n();
    const nav = useNavigate();
    const [params] = useSearchParams();
    const token = params.get("token");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr(""); setBusy(true);
        try {
            await api.post("/auth/reset-password", { token, new_password: password });
            setSuccess(true);
            setTimeout(() => nav("/login"), 2000);
        } catch (e) {
            setErr(formatApiError(e.response?.data?.detail) || e.message);
        } finally { setBusy(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
                <h1 className="font-arabic font-black text-2xl text-center text-[var(--text)] mb-6">{t("reset_password")}</h1>
                {success ? (
                    <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-4 text-sm font-arabic-body text-center">✅ تم تغيير كلمة المرور. سيتم تحويلك...</div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        {err && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 font-arabic-body">{err}</div>}
                        <Field icon={Lock} type="password" placeholder={t("new_password")} value={password} onChange={setPassword} testid="reset-password" minLength={8} />
                        <button data-testid="reset-submit" disabled={busy || !token} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] py-3 rounded-xl font-bold text-sm font-arabic disabled:opacity-50">{busy ? t("loading") : t("save")}</button>
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
