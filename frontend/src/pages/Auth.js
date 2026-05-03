import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Globe, MapPin, ArrowLeft, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import api, { formatApiError } from "@/lib/api";

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
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await api.post("/auth/forgot-password", { email }); setSent(true); } catch (_) {} finally { setBusy(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-10">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 sm:p-8 shadow-2xl">
                <Link to="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> العودة</Link>
                <h1 className="font-arabic font-black text-2xl text-center text-[var(--text)] mb-1">{t("forgot_password")}</h1>
                <p className="text-sm text-center text-[var(--text-muted)] mb-6 font-arabic-body">سنرسل لك رابط إعادة التعيين</p>
                {sent ? (
                    <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-4 text-sm font-arabic-body text-center">
                        ✅ {t("forgot_email_sent")}
                        <p className="text-xs text-[var(--text-muted)] mt-2">(للاختبار: تحقق من سجلات الخادم لرؤية الرابط)</p>
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
