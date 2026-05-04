import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, Bell, Globe, Shield, FileText, Info, Mail, HelpCircle, Lock, Trash2, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { useState } from "react";
import api from "@/lib/api";

export function SettingsPage() {
    const { user, logout } = useAuth();
    const { isDark, toggle } = useTheme();
    const { t, lang, setLang, available } = useI18n();
    const nav = useNavigate();

    const items = [
        { icon: Bell, label: "الإشعارات", to: "#", desc: "تخصيص رنين وأنواع الإشعارات" },
        { icon: Lock, label: "الأمان والخصوصية", to: "#", desc: "كلمة المرور، حذف الحساب، البيانات" },
        { icon: HelpCircle, label: "المساعدة والدعم", to: "/contact", desc: "تواصل معنا، الأسئلة الشائعة" },
        { icon: FileText, label: "الشروط والأحكام", to: "/terms" },
        { icon: Shield, label: "سياسة الخصوصية", to: "/privacy" },
        { icon: Info, label: "عن التطبيق", to: "/about" },
    ];

    const deleteAccount = async () => {
        if (!window.confirm("سيتم تعطيل حسابك. هل أنت متأكد؟")) return;
        try {
            await api.post("/auth/request-account-deletion");
            alert("تم استلام طلب حذف الحساب. سيتم مراجعته من قبل الإدارة خلال 48 ساعة.");
        } catch (_) { alert("تعذر إرسال الطلب"); }
    };

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <div className="flex items-center gap-2 mb-5">
                <Link to="/profile" className="text-[var(--text-muted)]"><ArrowLeft className="w-5 h-5" /></Link>
                <h1 className="font-arabic font-black text-2xl text-[var(--text)]">الإعدادات</h1>
            </div>

            {/* Theme + Lang quick toggles */}
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] mb-3">
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-[var(--primary)]" />
                        <span className="font-arabic font-bold text-sm text-[var(--text)]">الوضع الداكن</span>
                    </div>
                    <button onClick={toggle} data-testid="settings-theme-toggle" className={`relative w-12 h-6 rounded-full transition-all ${isDark ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}>
                        <div className={`absolute top-0.5 ${isDark ? "left-0.5" : "left-6"} w-5 h-5 bg-white rounded-full transition-all shadow`}></div>
                    </button>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-[var(--primary)]" />
                        <span className="font-arabic font-bold text-sm text-[var(--text)]">اللغة</span>
                    </div>
                    <select value={lang} onChange={(e) => setLang(e.target.value)} data-testid="settings-lang-select" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text)] outline-none font-arabic-body">
                        {available.map((l) => <option key={l} value={l}>
                            {l === "ar" && "🇸🇦 العربية"}{l === "en" && "🇬🇧 English"}{l === "ur" && "🇵🇰 اردو"}
                            {l === "hi" && "🇮🇳 हिन्दी"}{l === "bn" && "🇧🇩 বাংলা"}{l === "fr" && "🇫🇷 Français"}
                        </option>)}
                    </select>
                </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] mb-3 overflow-hidden">
                {items.map((it) => (
                    <Link key={it.label} to={it.to} data-testid={`settings-${it.label}`} className="flex items-center gap-3 p-4 hover:bg-[var(--surface-elevated)]">
                        <it.icon className="w-5 h-5 text-[var(--primary)] shrink-0" />
                        <div className="flex-1">
                            <div className="font-arabic font-bold text-sm text-[var(--text)]">{it.label}</div>
                            {it.desc && <div className="text-xs text-[var(--text-muted)] font-arabic-body mt-0.5">{it.desc}</div>}
                        </div>
                        <ChevronLeft className="w-4 h-4 text-[var(--text-muted)] rotate-180" />
                    </Link>
                ))}
            </div>

            <button data-testid="delete-account-btn" onClick={deleteAccount} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl p-4 font-arabic font-bold text-sm flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> طلب حذف الحساب
            </button>
        </div>
    );
}

export function StaticPage({ title, children }) {
    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <Link to="/profile" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> العودة</Link>
            <h1 className="font-arabic font-black text-2xl sm:text-3xl text-[var(--text)] mb-5">{title}</h1>
            <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)] font-arabic-body text-sm text-[var(--text)] leading-relaxed space-y-4">
                {children}
            </div>
        </div>
    );
}

export function TermsPage() {
    return (
        <StaticPage title="الشروط والأحكام">
            <p>أهلاً بك في الحراج بلس. باستخدامك هذا التطبيق فإنك توافق على الشروط التالية:</p>
            <p>1. الحراج بلس منصة وسيطة فقط لربط البائعين بالمشترين، ولا نتلقى أي مدفوعات أو نضمن أي صفقة.</p>
            <p>2. يلتزم البائع بصحة المعلومات والصور المعروضة، ويتحمل وحده مسؤولية محتوى إعلانه.</p>
            <p>3. يُمنع نشر أي محتوى مخالف للأنظمة أو الذوق العام، وستُحذف الإعلانات المخالفة فوراً.</p>
            <p>4. ننصح بعقد الصفقات في أماكن عامة آمنة، والتحقق من المنتج قبل الدفع.</p>
            <p>5. تحتفظ إدارة الحراج بلس بحقها في تعليق أو حذف أي حساب يخالف الشروط.</p>
        </StaticPage>
    );
}
export function PrivacyPage() {
    return (
        <StaticPage title="سياسة الخصوصية">
            <p>نحرص على حماية بياناتك. إليك ما نجمعه وكيف نستخدمه:</p>
            <p>• البريد الإلكتروني ورقم الجوال — لإنشاء حسابك والتواصل معك.</p>
            <p>• الموقع الجغرافي — لعرض الإعلانات القريبة منك (اختياري).</p>
            <p>• الصور والوسائط — لرفع إعلاناتك فقط.</p>
            <p>• لا نبيع بياناتك لأي طرف ثالث.</p>
            <p>• يمكنك طلب حذف حسابك في أي وقت من الإعدادات.</p>
        </StaticPage>
    );
}
export function AboutPage() {
    return (
        <StaticPage title="عن الحراج بلس">
            <div className="flex justify-center mb-4">
                <img src="/logo-haraj.png" alt="logo" className="w-24 h-24 object-contain" />
            </div>
            <p>الحراج بلس هي منصة بيع وشراء عربية حديثة لدول الخليج، مدعومة بالذكاء الاصطناعي لجعل عملية البيع والشراء أسرع وأذكى وأكثر أماناً.</p>
            <p>نهدف إلى ربط البائعين والمشترين في الخليج العربي عبر تجربة فاخرة وسلسة، مع ميزات حصرية مثل:</p>
            <ul className="list-disc ms-5 space-y-1">
                <li>اقتراح السعر بالذكاء الاصطناعي</li>
                <li>عارض صور احترافي وفيديو</li>
                <li>شات مباشر بكل الوسائط</li>
                <li>خرائط وإعلانات قريبة منك</li>
                <li>5+ لغات لخدمة كل المقيمين</li>
            </ul>
            <p className="text-center font-bold text-[var(--primary)] mt-4">الإصدار 1.5 — 2026</p>
        </StaticPage>
    );
}
export function ContactPage() {
    const [form, setForm] = useState({ subject: "", message: "" });
    const [busy, setBusy] = useState(false);
    const [ok, setOk] = useState(false);
    const submit = async (e) => {
        e.preventDefault(); setBusy(true);
        try {
            await api.post("/contact", form);
            setOk(true); setForm({ subject: "", message: "" });
        } catch (_) {} finally { setBusy(false); }
    };
    return (
        <StaticPage title="تواصل معنا">
            <p className="font-bold">للأعمال والإعلان وطلبات الشراكة:</p>
            <p>📧 contact@harajplus.com</p>
            <p>💬 يمكنك أيضاً مراسلتنا مباشرة من النموذج أدناه:</p>
            {ok ? (
                <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-3 font-bold">✅ تم استلام رسالتك. سنرد عليك قريباً.</div>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    <input data-testid="contact-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="الموضوع" className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                    <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="اكتب رسالتك..." className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]"></textarea>
                    <button data-testid="contact-send" disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-bold text-sm font-arabic disabled:opacity-50">
                        {busy ? "جاري الإرسال..." : "إرسال"}
                    </button>
                </form>
            )}
        </StaticPage>
    );
}
