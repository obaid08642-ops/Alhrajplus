import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Apple, Smartphone, Globe, Download as DownloadIcon, QrCode } from "lucide-react";
import { tr } from "@/contexts/I18nContext";
import { detectPlatform, STORE_URLS, storeUrlFor } from "@/lib/platform";

/**
 * Download landing page (/download).
 *
 * Behaviour:
 * - Mobile users (iOS / Android / Huawei) are auto-redirected to their
 *   matching store URL **if** the env variable for that platform is set.
 *   If the URL is empty we stay on the page and show the QR placeholders.
 * - Desktop users always see the full grid of 3 store buttons + QR codes.
 * - Buttons / QR codes for a platform whose env URL is empty render as a
 *   greyed-out placeholder showing "قريباً" so the page is always usable
 *   even before stores are configured.
 */
export default function DownloadPage() {
    const [platform, setPlatform] = useState("unknown");
    const [redirectAttempted, setRedirectAttempted] = useState(false);

    useEffect(() => {
        const p = detectPlatform();
        setPlatform(p);
        // Auto-redirect mobile users to the correct store if configured.
        if (p !== "desktop" && p !== "unknown") {
            const target = storeUrlFor(p);
            if (target) {
                // Tiny delay so SSR / hydration finishes and the user sees
                // a brief "redirecting…" flash instead of a blank page.
                const t = setTimeout(() => {
                    window.location.replace(target);
                }, 250);
                setRedirectAttempted(true);
                return () => clearTimeout(t);
            }
        }
    }, []);

    const stores = useMemo(() => ([
        {
            key: "appstore",
            label: tr("App Store"),
            sub: "iOS",
            url: STORE_URLS.appstore,
            icon: Apple,
            color: "from-black to-neutral-700",
            fg: "text-white",
        },
        {
            key: "playstore",
            label: tr("Google Play"),
            sub: "Android",
            url: STORE_URLS.playstore,
            icon: Smartphone,
            color: "from-emerald-500 to-emerald-700",
            fg: "text-white",
        },
        {
            key: "appgallery",
            label: tr("AppGallery"),
            sub: "Huawei",
            url: STORE_URLS.appgallery,
            icon: Globe,
            color: "from-red-500 to-red-700",
            fg: "text-white",
        },
    ]), []);

    return (
        <div className="min-h-screen bg-[var(--bg)] flex items-start justify-center px-4 py-10" data-testid="download-page">
            <div className="w-full max-w-4xl">
                {redirectAttempted && (
                    <div data-testid="redirect-notice" className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] rounded-2xl p-3 text-center font-arabic-body text-sm mb-4">
                        {tr("جاري تحويلك إلى المتجر...")} <a className="font-bold underline" href={storeUrlFor(platform)}>{tr("اضغط هنا إن لم يتم التحويل")}</a>
                    </div>
                )}

                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full px-4 py-1.5 text-xs font-arabic font-bold mb-3">
                        <DownloadIcon className="w-3.5 h-3.5" /> {tr("التطبيق الرسمي")}
                    </div>
                    <h1 className="font-arabic font-black text-3xl sm:text-5xl text-[var(--text)] mb-2">{tr("حمّل التطبيق")}</h1>
                    <p className="font-arabic-body text-[var(--text-muted)] text-sm sm:text-base max-w-xl mx-auto">
                        {tr("تجربة أسرع، إشعارات فورية، ودردشة لحظية على جوالك")}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                    {stores.map((s) => (
                        <StoreCard key={s.key} store={s} />
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <p className="font-arabic-body text-[var(--text-muted)] text-xs">
                        {tr("امسح الـ QR من كاميرا جوالك أو اضغط الزر مباشرة")}
                    </p>
                </div>
            </div>
        </div>
    );
}

function StoreCard({ store }) {
    const Icon = store.icon;
    const available = !!store.url;

    return (
        <div
            data-testid={`store-card-${store.key}`}
            className={`relative bg-[var(--surface)] border ${available ? "border-[var(--border)]" : "border-dashed border-[var(--text-muted)]/40"} rounded-3xl p-5 flex flex-col items-center text-center ${!available ? "opacity-70" : ""}`}
        >
            {!available && (
                <span data-testid={`badge-soon-${store.key}`} className="absolute top-3 start-3 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full px-2 py-0.5 font-arabic-body">
                    {tr("قريباً")}
                </span>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${store.color} ${store.fg} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-7 h-7" />
            </div>
            <div className="font-arabic font-black text-lg text-[var(--text)] leading-tight">{store.label}</div>
            <div className="font-latin text-xs text-[var(--text-muted)] mb-3">{store.sub}</div>

            <div className="bg-white p-2 rounded-xl mb-3 shadow-sm border border-[var(--border)]" data-testid={`qr-${store.key}`}>
                {available ? (
                    <QRCodeSVG value={store.url} size={140} level="M" includeMargin={false} />
                ) : (
                    <div className="w-[140px] h-[140px] flex items-center justify-center text-[var(--text-muted)]">
                        <QrCode className="w-14 h-14 opacity-40" />
                    </div>
                )}
            </div>

            {available ? (
                <a
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`btn-${store.key}`}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-2xl py-2.5 font-arabic font-bold text-sm flex items-center justify-center gap-1.5 transition"
                >
                    <DownloadIcon className="w-4 h-4" /> {tr("تحميل")}
                </a>
            ) : (
                <button
                    disabled
                    data-testid={`btn-${store.key}-disabled`}
                    className="w-full bg-[var(--surface-elevated)] text-[var(--text-muted)] rounded-2xl py-2.5 font-arabic font-bold text-sm cursor-not-allowed"
                >
                    {tr("غير متاح حالياً")}
                </button>
            )}
        </div>
    );
}
