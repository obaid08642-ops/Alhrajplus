import { useCountry } from "@/contexts/CountryContext";
import { tr } from "@/contexts/I18nContext";
import { Globe2 } from "lucide-react";

/**
 * Compact button shown in the TopBar that opens the CountryPicker.
 * Displays the current country flag (or a globe if not chosen yet).
 */
export default function CountrySwitcher({ className = "" }) {
    const { current, openPicker } = useCountry();
    return (
        <button
            data-testid="country-switcher-btn"
            onClick={openPicker}
            title={tr("اختر الدولة")}
            className={`flex items-center justify-center gap-1 w-9 h-9 sm:w-auto sm:px-2.5 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 border border-white/25 dark:border-white/15 transition-all backdrop-blur ${className}`}
        >
            {current ? (
                <>
                    <span className="text-lg leading-none">{current.flag}</span>
                    <span className="hidden sm:inline text-xs text-white font-arabic-body">{current.name_ar}</span>
                </>
            ) : (
                <Globe2 className="w-4 h-4 text-white" />
            )}
        </button>
    );
}
