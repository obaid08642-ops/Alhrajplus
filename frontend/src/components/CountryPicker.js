import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { tr } from "@/contexts/I18nContext";
import { normalizePhone, COUNTRY_DIAL } from "@/lib/phone";

/**
 * CountryPicker — shown once after first OAuth login when the user has no country set.
 *
 * Why:  Google/X/Snap don't include country in their profile, so we must ask before
 *       the user can browse country-scoped listings.
 *
 * Behavior: blocking modal; on submit, PATCH /api/users/me with country + optional phone,
 *           then refresh the auth context to dismiss itself.
 */

const COUNTRIES = [
    { code: "SA", flag: "🇸🇦", name_ar: "السعودية", dial: "+966" },
    { code: "AE", flag: "🇦🇪", name_ar: "الإمارات", dial: "+971" },
    { code: "KW", flag: "🇰🇼", name_ar: "الكويت", dial: "+965" },
    { code: "QA", flag: "🇶🇦", name_ar: "قطر", dial: "+974" },
    { code: "BH", flag: "🇧🇭", name_ar: "البحرين", dial: "+973" },
    { code: "OM", flag: "🇴🇲", name_ar: "عُمان", dial: "+968" },
    { code: "EG", flag: "🇪🇬", name_ar: "مصر", dial: "+20" },
    { code: "JO", flag: "🇯🇴", name_ar: "الأردن", dial: "+962" },
    { code: "IQ", flag: "🇮🇶", name_ar: "العراق", dial: "+964" },
    { code: "YE", flag: "🇾🇪", name_ar: "اليمن", dial: "+967" },
    { code: "MA", flag: "🇲🇦", name_ar: "المغرب", dial: "+212" },
    { code: "DZ", flag: "🇩🇿", name_ar: "الجزائر", dial: "+213" },
    { code: "TN", flag: "🇹🇳", name_ar: "تونس", dial: "+216" },
    { code: "LY", flag: "🇱🇾", name_ar: "ليبيا", dial: "+218" },
    { code: "SD", flag: "🇸🇩", name_ar: "السودان", dial: "+249" },
    { code: "LB", flag: "🇱🇧", name_ar: "لبنان", dial: "+961" },
    { code: "SY", flag: "🇸🇾", name_ar: "سوريا", dial: "+963" },
    { code: "PS", flag: "🇵🇸", name_ar: "فلسطين", dial: "+970" },
];

const NEEDS_COUNTRY_KEY = "hp_skip_country_picker";  // session-only skip flag

export default function CountryPicker() {
    const { user, refresh } = useAuth();
    const [country, setCountry] = useState("SA");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [skipped, setSkipped] = useState(false);

    useEffect(() => {
        try { setSkipped(sessionStorage.getItem(NEEDS_COUNTRY_KEY) === "1"); } catch (_) {}
    }, []);

    if (!user || user === false) return null;
    if (user.country_code && user.country_code.length === 2) return null;
    if (skipped) return null;

    const submit = async () => {
        setErr("");
        setSaving(true);
        try {
            const body = { country_code: country };
            if (phone.trim()) {
                const norm = normalizePhone(phone, country);
                if (!norm) { setErr(tr("رقم الجوال غير صحيح")); setSaving(false); return; }
                body.phone_full = norm;
            }
            await api.put("/users/me", body);
            await refresh();
        } catch (e) {
            setErr(e?.response?.data?.detail || tr("تعذر الحفظ. حاول مجدداً"));
        } finally {
            setSaving(false);
        }
    };

    const skip = () => {
        try { sessionStorage.setItem(NEEDS_COUNTRY_KEY, "1"); } catch (_) {}
        setSkipped(true);
    };

    const dial = COUNTRIES.find(c => c.code === country)?.dial || "";

    return (
        <div data-testid="country-picker-modal" className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl">
                <div className="text-center mb-4">
                    <div className="text-5xl mb-2">🌍</div>
                    <h2 className="font-arabic font-bold text-xl text-[var(--text)] mb-1">{tr("اختر دولتك")}</h2>
                    <p className="font-arabic-body text-sm text-[var(--text-muted)]">{tr("لنعرض لك الإعلانات في بلدك")}</p>
                </div>

                <label className="block text-sm font-arabic-body text-[var(--text)] mb-1">{tr("الدولة")}</label>
                <select
                    data-testid="country-select"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] font-arabic-body text-base text-[var(--text)] mb-4 outline-none focus:border-[var(--primary)]"
                >
                    {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name_ar} ({c.dial})</option>
                    ))}
                </select>

                <label className="block text-sm font-arabic-body text-[var(--text)] mb-1">
                    {tr("رقم الجوال (اختياري)")}
                </label>
                <div className="flex items-stretch gap-2 mb-1">
                    <div className="px-3 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] font-arabic-body text-sm text-[var(--text-muted)] flex items-center" dir="ltr">{dial}</div>
                    <input
                        data-testid="country-picker-phone"
                        type="tel"
                        inputMode="tel"
                        dir="ltr"
                        placeholder="5XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] font-arabic-body text-base outline-none focus:border-[var(--primary)] text-[var(--text)]"
                    />
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-4 font-arabic-body">{tr("لتسهيل تواصل المشترين معك")}</p>

                {err && <div className="text-sm text-[var(--danger)] mb-2 font-arabic-body">{err}</div>}

                <button
                    data-testid="country-picker-submit"
                    onClick={submit}
                    disabled={saving}
                    className="w-full py-3 rounded-2xl bg-[var(--primary)] text-[var(--primary-fg)] font-bold font-arabic disabled:opacity-60"
                >
                    {saving ? tr("جاري الحفظ...") : tr("متابعة")}
                </button>
                <button
                    data-testid="country-picker-skip"
                    onClick={skip}
                    className="w-full mt-2 py-2 text-sm text-[var(--text-muted)] font-arabic-body hover:text-[var(--text)]"
                >
                    {tr("تخطي الآن")}
                </button>
            </div>
        </div>
    );
}
