import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { tr } from "@/contexts/I18nContext";
import { isWebPushSupported, getWebPushStatus, subscribeWebPush, unsubscribeWebPush, sendTestPush } from "@/lib/webPush";
import api from "@/lib/api";

/**
 * NotificationsPanel — settings UI for web push & per-type preferences.
 *
 * Two sections:
 *   1. Browser permission / subscription toggle.
 *   2. Per-event preferences (messages, listing_status, deals, watchlist, broadcasts, comments).
 */

const PREF_KEYS = [
    { key: "messages", label: "رسائل المحادثة الجديدة" },
    { key: "listing_status", label: "موافقة / رفض إعلاناتك" },
    { key: "deals", label: "صفقات اليوم والمزادات" },
    { key: "watchlist", label: "تحديثات قائمة الاهتمام (مثل تخفيض الأسعار)" },
    { key: "comments", label: "التعليقات والردود" },
    { key: "broadcasts", label: "إعلانات الإدارة والعروض" },
];

export default function NotificationsPanel() {
    const supported = isWebPushSupported();
    const [status, setStatus] = useState("default");
    const [busy, setBusy] = useState(false);
    const [prefs, setPrefs] = useState(null);
    const [msg, setMsg] = useState("");

    const refreshStatus = async () => setStatus(await getWebPushStatus());

    useEffect(() => {
        if (supported) refreshStatus();
        api.get("/push/preferences").then(({ data }) => setPrefs(data)).catch(() => {});
    }, [supported]);

    const enable = async () => {
        setBusy(true); setMsg("");
        const r = await subscribeWebPush();
        if (r.ok) setMsg(tr("✅ تم تفعيل الإشعارات على هذا المتصفح"));
        else if (r.reason === "denied") setMsg(tr("❌ تم رفض الإذن — فعّلها من إعدادات المتصفح"));
        else if (r.reason === "unsupported") setMsg(tr("❌ المتصفح لا يدعم Web Push"));
        else setMsg(tr("❌ تعذّر التفعيل: ") + (r.reason || ""));
        await refreshStatus();
        setBusy(false);
    };

    const disable = async () => {
        setBusy(true); setMsg("");
        await unsubscribeWebPush();
        setMsg(tr("تم إيقاف الإشعارات على هذا المتصفح"));
        await refreshStatus();
        setBusy(false);
    };

    const testIt = async () => {
        setBusy(true); setMsg("");
        const r = await sendTestPush();
        setMsg(r.ok ? tr("📤 تم إرسال إشعار تجريبي — تحقق خلال ثوانٍ") : tr("❌ تعذّر الإرسال: ") + (r.reason || ""));
        setBusy(false);
    };

    const togglePref = async (key) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        try { await api.put("/push/preferences", { [key]: next[key] }); } catch (_) {}
    };

    return (
        <div data-testid="notifications-panel" className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="font-arabic font-bold text-base text-[var(--text)]">{tr("الإشعارات")}</h2>
            </div>

            {/* Browser subscription */}
            <div className="rounded-xl bg-[var(--surface-elevated)] p-3 mb-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="font-arabic font-bold text-sm text-[var(--text)] mb-1">{tr("إشعارات المتصفح")}</div>
                        <div className="text-xs text-[var(--text-muted)] font-arabic-body flex items-center gap-1">
                            {!supported && <><XCircle className="w-3.5 h-3.5 text-[var(--danger)]" /> {tr("غير مدعوم في هذا المتصفح")}</>}
                            {supported && status === "subscribed" && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {tr("مفعّل على هذا الجهاز")}</>}
                            {supported && status === "denied" && <><XCircle className="w-3.5 h-3.5 text-[var(--danger)]" /> {tr("الإذن مرفوض — فعّلها من إعدادات المتصفح")}</>}
                            {supported && (status === "default" || status === "granted-unsubscribed") && <><BellOff className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {tr("غير مفعّل")}</>}
                        </div>
                    </div>
                    {supported && status === "subscribed" ? (
                        <div className="flex gap-2">
                            <button data-testid="webpush-test" onClick={testIt} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:border-[var(--primary)]">
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : tr("اختبار")}
                            </button>
                            <button data-testid="webpush-disable" onClick={disable} disabled={busy} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold border border-red-500/30">
                                {tr("إيقاف")}
                            </button>
                        </div>
                    ) : supported && status !== "denied" ? (
                        <button data-testid="webpush-enable" onClick={enable} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold disabled:opacity-50">
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : tr("تفعيل")}
                        </button>
                    ) : null}
                </div>
                {msg && <div className="mt-2 text-xs text-[var(--text-muted)] font-arabic-body">{msg}</div>}
            </div>

            {/* Per-type prefs */}
            {prefs && (
                <div className="space-y-1.5">
                    <div className="text-xs text-[var(--text-muted)] font-arabic-body mb-2">{tr("اختر أنواع الإشعارات التي تريد استلامها:")}</div>
                    {PREF_KEYS.map((p) => (
                        <label key={p.key} data-testid={`pref-${p.key}`} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-elevated)] cursor-pointer">
                            <span className="font-arabic-body text-sm text-[var(--text)]">{tr(p.label)}</span>
                            <button
                                type="button"
                                onClick={() => togglePref(p.key)}
                                data-testid={`pref-toggle-${p.key}`}
                                className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${prefs[p.key] ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                            >
                                <span className={`absolute top-0.5 ${prefs[p.key] ? "left-0.5" : "left-5"} w-4 h-4 bg-white rounded-full transition-all shadow`}></span>
                            </button>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
