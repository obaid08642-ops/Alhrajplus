import { useState } from "react";
import { tr } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import { X } from "lucide-react";

/**
 * CountryPicker — global country selector modal.
 *
 * Opens on first visit (no country saved) OR when the user clicks the country
 * button in the TopBar via `openPicker()` from the context.
 *
 * Works for both anonymous and logged-in users. When logged in, the choice is
 * also synced to /users/me so push notifications / recommendations target the
 * right country.
 */
export default function CountryPicker() {
    const { COUNTRIES, country, setCountry, showPicker, dismissPicker } = useCountry();
    const [selected, setSelected] = useState(country || "SA");
    const [saving, setSaving] = useState(false);

    if (!showPicker) return null;

    const submit = async () => {
        setSaving(true);
        try {
            await setCountry(selected);
            dismissPicker();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            data-testid="country-picker-modal"
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            dir="rtl"
            onClick={(e) => { if (e.target === e.currentTarget) dismissPicker(); }}
        >
            <div className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl relative">
                <button
                    data-testid="country-picker-close"
                    onClick={dismissPicker}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full hover:bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)]"
                    aria-label={tr("إغلاق")}
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="text-center mb-4">
                    <div className="text-5xl mb-2">🌍</div>
                    <h2 className="font-arabic font-bold text-xl text-[var(--text)] mb-1">{tr("اختر دولتك")}</h2>
                    <p className="font-arabic-body text-sm text-[var(--text-muted)]">{tr("لعرض الإعلانات المتاحة في بلدك")}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pe-1 mb-4">
                    {COUNTRIES.map(c => (
                        <button
                            key={c.code}
                            data-testid={`country-opt-${c.code}`}
                            onClick={() => setSelected(c.code)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-start transition-all ${
                                selected === c.code
                                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                    : "border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--surface-elevated)]"
                            }`}
                        >
                            <span className="text-2xl shrink-0">{c.flag}</span>
                            <span className="font-arabic-body text-sm text-[var(--text)] flex-1 truncate">{c.name_ar}</span>
                        </button>
                    ))}
                </div>

                <button
                    data-testid="country-picker-submit"
                    onClick={submit}
                    disabled={saving}
                    className="w-full py-3 rounded-2xl bg-[var(--primary)] text-[var(--primary-fg)] font-bold font-arabic disabled:opacity-60"
                >
                    {saving ? tr("جاري الحفظ...") : tr("تطبيق")}
                </button>
            </div>
        </div>
    );
}
