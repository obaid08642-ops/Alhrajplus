import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, FileText, Flag, Palette, Image as ImageIcon, BarChart3, Trash2, Check, X, Plus, Edit2, Bell, Sparkles, DollarSign, Search as SearchIcon, Monitor, Gift, RefreshCw, Download, ShoppingBag, LifeBuoy } from "lucide-react";
import { tr } from "@/contexts/I18nContext";
import { canAccessAdmin } from "@/lib/accessControl";

const ECONOMY_DEFAULTS = { welcome_coins: 10, referral_coins: 25, share_open_coins: 2, referral_enabled: true, share_rewards_enabled: true, boost_products: [] };

export default function AdminPage() {
    const { user, loading } = useAuth();
    const nav = useNavigate();
    const [tab, setTab] = useState("stats");

    useEffect(() => {
        if (!loading && !canAccessAdmin(user)) nav("/");
    }, [user, loading, nav]);

    if (loading || !user) return <div className="p-10 text-center font-arabic">{tr("جاري التحميل...")}</div>;
    if (!canAccessAdmin(user)) return null;

    const tabs = [
        { key: "stats", label: tr("الإحصائيات"), icon: BarChart3 },
        { key: "analytics", label: tr("تحليلات CRM"), icon: BarChart3 },
        { key: "visitors", label: tr("الزوار المباشرون"), icon: Monitor },
        { key: "referrals", label: tr("الإحالات والنمو"), icon: Gift },
        { key: "economy", label: tr("الاقتصاد والترويج"), icon: DollarSign },
        { key: "moderation", label: tr("مراجعة الإعلانات"), icon: Shield },
        { key: "banned_words", label: tr("الكلمات المحظورة"), icon: Flag },
        { key: "listings", label: tr("جميع الإعلانات"), icon: FileText },
        { key: "lifecycle", label: tr("عمر وتنظيف الإعلانات"), icon: Trash2 },
        { key: "data_integrity", label: tr("سلامة البيانات"), icon: Shield },
        { key: "users", label: tr("المستخدمون"), icon: Users },
        { key: "reports", label: tr("البلاغات"), icon: Flag },
        { key: "finance", label: tr("المالية"), icon: DollarSign },
        { key: "seo", label: tr("SEO"), icon: SearchIcon },
        { key: "monitoring", label: tr("المراقبة والتنبيهات"), icon: Monitor },
        { key: "notifications", label: tr("الإشعارات"), icon: Bell },
        { key: "ads", label: tr("الإعلانات"), icon: ImageIcon },
        { key: "geo", label: tr("المدن والأحياء"), icon: SearchIcon },
        { key: "logs", label: tr("سجلات الأدمن"), icon: Shield },
        { key: "theme", label: tr("الهوية البصرية"), icon: Palette },
        { key: "buy_requests", label: tr("طلبات الشراء"), icon: ShoppingBag },
        { key: "support", label: tr("تذاكر الدعم"), icon: LifeBuoy },
        { key: "ai", label: tr("مزودو الذكاء الاصطناعي"), icon: Sparkles },
    ];

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24">
            <h1 className="font-arabic font-black text-2xl sm:text-3xl text-[var(--text)] mb-1 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[var(--accent)]" /> لوحة الإدارة
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-arabic-body mb-5">{tr("إدارة كاملة لمنصة الحراج بلس")}</p>

            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-2">
                {tabs.map((tb) => (
                    <button key={tb.key} data-testid={`admin-tab-${tb.key}`} onClick={() => setTab(tb.key)} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-arabic font-bold text-sm border ${tab === tb.key ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"}`}>
                        <tb.icon className="w-4 h-4" /> {tb.label}
                    </button>
                ))}
            </div>

            {tab === "stats" && <StatsPanel />}
            {tab === "analytics" && <AnalyticsPanel />}
            {tab === "visitors" && <VisitorsPanel />}
            {tab === "referrals" && <ReferralsPanel />}
            {tab === "economy" && <EconomyPanel />}
            {tab === "moderation" && <ModerationPanel />}
            {tab === "banned_words" && <BannedWordsPanel />}
            {tab === "listings" && <ListingsPanel />}
            {tab === "lifecycle" && <ListingLifecyclePanel />}
            {tab === "data_integrity" && <DataIntegrityPanel />}
            {tab === "users" && <UsersPanel />}
            {tab === "reports" && <ReportsPanel />}
            {tab === "finance" && <FinancePanel />}
            {tab === "seo" && <SEOPanel />}
            {tab === "monitoring" && <MonitoringPanel />}
            {tab === "notifications" && <NotificationsPanel />}
            {tab === "ads" && <AdsPanel />}
            {tab === "geo" && <GeoPanel />}
            {tab === "logs" && <LogsPanel />}
            {tab === "theme" && <ThemePanel />}
            {tab === "buy_requests" && <AdminBuyRequestsPanel />}
            {tab === "support" && <AdminSupportPanel />}
            {tab === "ai" && <AIProvidersPanel />}
        </div>
    );
}

function AIProvidersPanel() {
    const [rows, setRows] = useState([]);
    const [rotation, setRotation] = useState("");
    const [config, setConfig] = useState({ mode: "automatic", primary: "", rotation_enabled: true, fallback_enabled: true, max_attempts: 3, quota_threshold_pct: 90, cooldown_seconds: 60, order: [], providers: {} });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState("");
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [r, c] = await Promise.all([api.get("/ai/providers/status"), api.get("/admin/ai/config")]);
            setRows(Array.isArray(r.data?.providers) ? r.data.providers : []);
            setRotation(r.data?.rotation || "");
            setConfig(c.data || { mode: "automatic", primary: "", rotation_enabled: true, fallback_enabled: true, max_attempts: 3, quota_threshold_pct: 90, cooldown_seconds: 60, order: [], providers: {} });
        } catch (e) {
            setRows([]); setError(e?.response?.data?.detail || tr("تعذر تحميل حالة مزودي الذكاء الاصطناعي"));
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const patchProvider = (name, patch) => setConfig((old) => ({ ...old, providers: { ...old.providers, [name]: { ...(old.providers?.[name] || {}), ...patch } } }));
    const saveConfig = async () => { setSaving(true); setSaved(""); try { await api.put("/admin/ai/config", config); setSaved(tr("تم حفظ إعدادات AI")); await load(); } catch (e) { setError(e?.response?.data?.detail || tr("تعذر حفظ إعدادات AI")); } finally { setSaving(false); } };
    return <div className="space-y-4" data-testid="admin-ai-providers-panel">
        <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("مزودو الذكاء الاصطناعي")}</h2><p className="text-xs text-[var(--text-muted)]">{tr("التدوير والاستخدام والأخطاء من الخادم")}</p></div>
            <button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]" title={tr("تحديث")}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">{error}</div>}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm space-y-3"><div className="flex flex-wrap items-center gap-2"><b>{tr("ترتيب التدوير")}</b><input value={(config.order || []).join(", ")} onChange={(e) => setConfig({ ...config, order: e.target.value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) })} placeholder={rotation || "gemini, grok"} className="flex-1 min-w-[220px] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 font-mono text-xs" /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><label>{tr("الوضع")}<select value={config.mode || "automatic"} onChange={(e) => setConfig({ ...config, mode: e.target.value })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1"><option value="automatic">Automatic</option><option value="priority">Priority</option><option value="manual">Manual + fallback</option></select></label><label>{tr("المزود الأساسي")}<input value={config.primary || ""} onChange={(e) => setConfig({ ...config, primary: e.target.value.toLowerCase() })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1" /></label><label>{tr("أقصى محاولات") }<input type="number" min="1" max="20" value={config.max_attempts ?? 3} onChange={(e) => setConfig({ ...config, max_attempts: Number(e.target.value) })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label><label>{tr("عتبة الحصة %")}<input type="number" min="0" max="100" value={config.quota_threshold_pct ?? 90} onChange={(e) => setConfig({ ...config, quota_threshold_pct: Number(e.target.value) })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div><div className="flex flex-wrap gap-4 text-xs"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.rotation_enabled !== false} onChange={(e) => setConfig({ ...config, rotation_enabled: e.target.checked })} />{tr("التدوير التلقائي")}</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.fallback_enabled !== false} onChange={(e) => setConfig({ ...config, fallback_enabled: e.target.checked })} />{tr("fallback عند الفشل")}</label></div><p className="text-xs text-[var(--text-muted)]">{tr("تحكم إداري غير سري؛ مفاتيح API تبقى في متغيرات الخادم ولا تُحفظ هنا")}</p><div className="flex items-center gap-2"><button onClick={saveConfig} disabled={saving} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50">{saving ? tr("حفظ...") : tr("حفظ إعدادات AI")}</button>{saved && <span className="text-xs text-emerald-600">{saved}</span>}</div></div>
        <div className="grid gap-3">{!loading && rows.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">{tr("لا يوجد مزود AI مفعّل")}</div>}{rows.map((r) => <article key={r.name} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-[var(--text)]">{r.name} <span className="text-xs text-[var(--text-muted)]">{r.model || "—"}</span></h3><p className="text-xs text-[var(--text-muted)]">{r.configured ? tr("مهيأ") : tr("غير مهيأ")} · {r.enabled ? tr("مفعّل") : tr("متوقف")}</p></div><span className={`text-xs px-2 py-1 rounded-full ${r.last_status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>{r.last_status || tr("لم يستخدم بعد")}</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs"><div><span className="text-[var(--text-muted)]">{tr("الطلبات")}</span><b className="block font-latin">{r.requests || 0}</b></div><div><span className="text-[var(--text-muted)]">{tr("التوكنات")}</span><b className="block font-latin">{r.total_tokens || 0}</b></div><div><span className="text-[var(--text-muted)]">{tr("الأخطاء")}</span><b className="block font-latin">{r.errors || 0} ({Math.round((r.failure_rate || 0) * 100)}%)</b></div><label><span className="text-[var(--text-muted)]">{tr("الحد اليومي")}</span><input type="number" min="0" value={config.providers?.[r.name]?.daily_limit ?? r.daily_limit ?? ""} onChange={(e) => patchProvider(r.name, { daily_limit: Number(e.target.value) })} className="block w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div><div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.providers?.[r.name]?.enabled ?? r.enabled} onChange={(e) => patchProvider(r.name, { enabled: e.target.checked })} />{tr("تفعيل")}</label><label className="inline-flex items-center gap-2">{tr("الوزن")}<input type="number" min="1" max="100" value={config.providers?.[r.name]?.weight ?? r.weight ?? 1} onChange={(e) => patchProvider(r.name, { weight: Number(e.target.value) })} className="w-16 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div>{r.last_error && <p className="text-xs text-red-600 mt-3 break-words">{r.last_error}</p>}</article>)}</div>
    </div>;
}

function AdminBuyRequestsPanel() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get("/buy-requests", { params: { limit: 200 } }); setRows(Array.isArray(r.data) ? r.data : []); } catch (_) { setRows([]); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    return <div className="space-y-3" data-testid="admin-buy-requests-panel"><div className="flex items-center justify-between"><div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("طلبات الشراء")}</h2><p className="text-xs text-[var(--text-muted)]">{tr("طلبات حقيقية مرتبطة بالدولة والفئة والميزانية")}</p></div><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div><div className="grid gap-3">{!loading && rows.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">{tr("لا توجد بيانات بعد")}</div>}{rows.map((r) => <article key={r.id} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"><div className="flex justify-between gap-3"><h3 className="font-arabic font-bold text-[var(--text)]">{r.title}</h3><span className="text-xs text-[var(--primary)]">{r.status}</span></div><p className="text-sm text-[var(--text-muted)] mt-1">{r.description}</p><div className="text-xs text-[var(--text-muted)] mt-2">{r.country_code} · {r.city || "—"} · {r.category}</div></article>)}</div></div>;
}

function AdminSupportPanel() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { setLoading(true); try { const r = await api.get("/support/tickets"); setRows(Array.isArray(r.data) ? r.data : []); } catch (_) { setRows([]); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    return <div className="space-y-3" data-testid="admin-support-panel"><div className="flex items-center justify-between"><div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("تذاكر الدعم")}</h2><p className="text-xs text-[var(--text-muted)]">{tr("متابعة البلاغات والأسئلة مع سجل الرسائل")}</p></div><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div><div className="grid gap-3">{!loading && rows.length === 0 && <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">{tr("لا توجد بيانات بعد")}</div>}{rows.map((r) => <article key={r.id} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"><div className="flex justify-between gap-3"><h3 className="font-arabic font-bold text-[var(--text)]">{r.subject}</h3><span className="text-xs text-[var(--primary)]">{r.status}</span></div><p className="text-sm text-[var(--text-muted)] mt-1">{r.message}</p><div className="text-xs text-[var(--text-muted)] mt-2">{r.category} · {r.priority} · {r.id}</div></article>)}</div></div>;
}

function VisitorsPanel() {
    const [days, setDays] = useState(7);
    const [device, setDevice] = useState("");
    const [country, setCountry] = useState("");
    const [sessions, setSessions] = useState([]);
    const [breakdown, setBreakdown] = useState([]);
    const [topPaths, setTopPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [visitors, devices, paths] = await Promise.all([
                api.get("/admin/analytics/visitors", { params: { days, limit: 200, device_type: device, country_code: country } }),
                api.get("/admin/analytics/breakdown", { params: { days, dimension: "device_type" } }),
                api.get("/admin/analytics/breakdown", { params: { days, dimension: "path" } }),
            ]);
            setSessions(visitors.data?.sessions || []);
            setBreakdown(devices.data?.rows || []);
            setTopPaths(paths.data?.rows || []);
        } catch (_) {
            setSessions([]); setBreakdown([]); setTopPaths([]);
        } finally { setLoading(false); }
    }, [days, device, country]);
    useEffect(() => { load(); }, [load]);
    const active = sessions.filter((s) => Date.now() - new Date(s.last_seen || 0).getTime() < 120000).length;
    const avgDuration = sessions.length ? Math.round(sessions.reduce((sum, s) => sum + Number(s.duration_ms || 0), 0) / sessions.length / 1000) : 0;
    return (
        <div className="space-y-4" data-testid="admin-visitors-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("الزوار والجلسات المباشرة")}</h2><p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("بيانات مجمعة، بدون تخزين IP أو محتوى خاص")}</p></div>
                <div className="flex gap-2 items-center"><select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value={1}>24 ساعة</option><option value={7}>7 أيام</option><option value={30}>30 يومًا</option><option value={90}>90 يومًا</option></select><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]" title={tr("تحديث")}><RefreshCw className="w-4 h-4" /></button></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><FinanceCard label={tr("الجلسات المعروضة")} value={sessions.length} /><FinanceCard label={tr("نشطون آخر دقيقتين")} value={active} /><FinanceCard label={tr("متوسط مدة الجلسة")} value={avgDuration} suffix={tr("ثانية")} /><FinanceCard label={tr("الأجهزة المسجلة")} value={breakdown.length} /></div>
            <div className="flex flex-wrap gap-2"><select value={device} onChange={(e) => setDevice(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value="">كل الأجهزة</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select><input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={3} placeholder={tr("الدولة مثل SA")} className="w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-latin" /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="p-4 border-b border-[var(--border)]"><h3 className="font-arabic font-bold">{tr("أكثر الشاشات زيارة")}</h3></div><div className="divide-y divide-[var(--border)]">{topPaths.slice(0, 10).map((r) => <div key={r.key || r.path} className="p-3 flex justify-between gap-3 text-xs"><span className="font-mono truncate">{r.key || r.path || "—"}</span><b className="font-latin">{r.count || r.events || 0}</b></div>)}{topPaths.length === 0 && <div className="p-5 text-center text-xs text-[var(--text-muted)]">{tr("لا توجد بيانات بعد")}</div>}</div></div><div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="p-4 border-b border-[var(--border)]"><h3 className="font-arabic font-bold">{tr("توزيع الأجهزة")}</h3></div><div className="divide-y divide-[var(--border)]">{breakdown.slice(0, 10).map((r) => <div key={r.key || r.device_type} className="p-3 flex justify-between gap-3 text-xs"><span>{r.key || r.device_type || "—"}</span><b className="font-latin">{r.count || r.events || 0}</b></div>)}{breakdown.length === 0 && <div className="p-5 text-center text-xs text-[var(--text-muted)]">{tr("لا توجد بيانات بعد")}</div>}</div></div></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="p-4 border-b border-[var(--border)] flex items-center justify-between"><h3 className="font-arabic font-bold">{tr("آخر الجلسات")}</h3><span className="text-xs text-[var(--text-muted)]">{loading ? tr("جاري التحميل...") : `${sessions.length} ${tr("جلسة")}`}</span></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-start text-[var(--text-muted)] border-b border-[var(--border)]"><th className="p-3 text-start">{tr("آخر ظهور")}</th><th className="p-3 text-start">{tr("المسار")}</th><th className="p-3 text-start">{tr("الجهاز")}</th><th className="p-3 text-start">{tr("النظام/المتصفح")}</th><th className="p-3 text-start">{tr("الدولة/المصدر")}</th><th className="p-3 text-start">{tr("المدة")}</th></tr></thead><tbody>{sessions.slice(0, 100).map((s) => <tr key={s.session_id} className="border-b border-[var(--border)]/50"><td className="p-3 font-latin whitespace-nowrap">{s.last_seen ? new Date(s.last_seen).toLocaleString() : "—"}</td><td className="p-3 max-w-48 truncate font-mono">{s.last_path || "—"}</td><td className="p-3">{s.device_type || "—"}</td><td className="p-3">{[s.os, s.browser].filter(Boolean).join(" / ") || "—"}</td><td className="p-3 font-latin">{[s.country_code, s.source].filter(Boolean).join(" / ") || "—"}</td><td className="p-3 font-latin">{Math.round(Number(s.duration_ms || 0) / 1000)}s</td></tr>)}{!loading && sessions.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد بيانات بعد")}</td></tr>}</tbody></table></div></div>
        </div>
    );
}

function ReferralsPanel() {
    const [rows, setRows] = useState([]);
    const [config, setConfig] = useState({ reward_points: 100, enabled: true });
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);
    const load = useCallback(async () => {
        try { const [r, c] = await Promise.all([api.get("/admin/referrals", { params: { status, limit: 300 } }), api.get("/admin/referrals/config")]); setRows(r.data || []); setConfig(c.data || { reward_points: 100, enabled: true }); } catch (_) { setRows([]); }
    }, [status]);
    useEffect(() => { load(); }, [load]);
    const save = async () => { setBusy(true); try { await api.put("/admin/referrals/config", { reward_points: Number(config.reward_points), enabled: !!config.enabled }); await load(); } finally { setBusy(false); } };
    const qualified = rows.filter((r) => ["qualified", "rewarded"].includes(r.status)).length;
    return (
        <div className="space-y-4" data-testid="admin-referrals-panel">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("الإحالات والنمو")}</h2><p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("المكافأة لا تُحتسب إلا بعد التحقق بالبريد، مع سجل قابل للتدقيق")}</p></div><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><FinanceCard label={tr("السجلات") } value={rows.length} /><FinanceCard label={tr("إحالات مؤهلة")} value={qualified} /><FinanceCard label={tr("النقاط في العرض")} value={rows.reduce((n, r) => n + Number(r.reward_points || 0), 0)} /><FinanceCard label={tr("الحالة")} value={config.enabled ? tr("مفعلة") : tr("متوقفة")} /></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-wrap items-end gap-3"><label className="text-sm font-arabic font-bold">{tr("نقاط الدعوة المؤهلة")}<input type="number" min="0" max="100000" value={config.reward_points} onChange={(e) => setConfig({ ...config, reward_points: e.target.value })} className="block mt-1 w-40 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 font-latin" /></label><label className="flex items-center gap-2 text-sm font-arabic"><input type="checkbox" checked={!!config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} /> {tr("تفعيل البرنامج")}</label><button onClick={save} disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-4 py-2 rounded-xl font-arabic font-bold disabled:opacity-50">{busy ? tr("حفظ...") : tr("حفظ الإعدادات")}</button></div>
            <div className="flex gap-2"><select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value="">كل الحالات</option><option value="pending">معلق</option><option value="qualified">مؤهل</option><option value="rewarded">مكافأ</option><option value="rejected">مرفوض</option></select><button onClick={() => { const csv = ["id,inviter_code,invitee_id,status,reward_points,created_at", ...rows.map((r) => [r.id, r.inviter_code, r.invitee_id, r.status, r.reward_points, r.created_at].map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","))].join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "referrals.csv"; a.click(); URL.revokeObjectURL(a.href); }} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-arabic"><Download className="w-4 h-4" />{tr("تصدير CSV")}</button></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-[var(--text-muted)] border-b border-[var(--border)]"><th className="p-3 text-start">ID</th><th className="p-3 text-start">{tr("كود الداعي")}</th><th className="p-3 text-start">{tr("المدعو")}</th><th className="p-3 text-start">{tr("الحالة")}</th><th className="p-3 text-start">{tr("النقاط")}</th><th className="p-3 text-start">{tr("التاريخ")}</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-b border-[var(--border)]/50"><td className="p-3 font-mono">{String(r.id).slice(0, 8)}</td><td className="p-3 font-mono">{r.inviter_code}</td><td className="p-3 font-mono">{String(r.invitee_id).slice(0, 8)}</td><td className="p-3">{r.status}</td><td className="p-3 font-latin">{r.reward_points || 0}</td><td className="p-3 font-latin">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td></tr>)}{rows.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد إحالات بعد")}</td></tr>}</tbody></table></div></div>
        </div>
    );
}

function EconomyPanel() {
    const [config, setConfig] = useState(ECONOMY_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try { const { data } = await api.get("/economy/config"); setConfig({ ...ECONOMY_DEFAULTS, ...(data || {}) }); }
        catch (e) { setError(e?.response?.data?.detail || tr("تعذر تحميل إعدادات الاقتصاد")); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const patchProduct = (index, key, value) => setConfig((old) => ({ ...old, boost_products: old.boost_products.map((product, i) => i === index ? { ...product, [key]: value } : product) }));
    const addProduct = () => setConfig((old) => ({ ...old, boost_products: [...old.boost_products, { id: `boost_${old.boost_products.length + 1}`, cost: 100, duration_hours: 24, strength: 1 }] }));
    const save = async () => {
        setSaving(true); setNotice(""); setError("");
        try {
            const payload = { ...config, welcome_coins: Number(config.welcome_coins), referral_coins: Number(config.referral_coins), share_open_coins: Number(config.share_open_coins), boost_products: config.boost_products.map((p) => ({ id: String(p.id || "").trim().toLowerCase(), cost: Number(p.cost), duration_hours: Number(p.duration_hours), strength: Number(p.strength) })) };
            const { data } = await api.put("/admin/economy/config", payload);
            setConfig({ ...ECONOMY_DEFAULTS, ...(data || {}) }); setNotice(tr("تم حفظ إعدادات الاقتصاد"));
        } catch (e) { setError(e?.response?.data?.detail || tr("تعذر حفظ الإعدادات. تحقق من حقول المنتجات.")); }
        finally { setSaving(false); }
    };
    return <div className="space-y-4" data-testid="admin-economy-panel">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("الاقتصاد والترويج")}</h2><p className="text-xs text-[var(--text-muted)]">{tr("الـCoins مخصصة للترويج فقط؛ لا توجد مكافآت نقدية أو بوابة شحن.")}</p></div><button onClick={load} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]" title={tr("تحديث")}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div>
        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">{error}</div>}{notice && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 text-sm">{notice}</div>}
        <section className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[["welcome_coins", "Coins الترحيب"], ["referral_coins", "Coins الإحالة المؤهلة"], ["share_open_coins", "Coins فتح المشاركة"]].map(([key, label]) => <label key={key} className="text-sm font-arabic font-bold">{tr(label)}<input type="number" min="0" max="100000" value={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} className="block mt-1 w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 font-latin" /></label>)}</div><div className="flex flex-wrap gap-5 text-sm"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!config.referral_enabled} onChange={(e) => setConfig({ ...config, referral_enabled: e.target.checked })} />{tr("تفعيل مكافآت الإحالة")}</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!config.share_rewards_enabled} onChange={(e) => setConfig({ ...config, share_rewards_enabled: e.target.checked })} />{tr("تفعيل مكافآت فتح المشاركة")}</label></div></section>
        <section className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3"><div className="flex items-center justify-between"><div><h3 className="font-arabic font-black text-lg">{tr("منتجات الترويج")}</h3><p className="text-xs text-[var(--text-muted)]">{tr("مدة وقوة وتكلفة مضبوطة من الخادم، بحد أقصى 10 منتجات.")}</p></div><button onClick={addProduct} disabled={config.boost_products.length >= 10} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-sm disabled:opacity-50"><Plus className="w-4 h-4" />{tr("منتج")}</button></div><div className="space-y-2">{config.boost_products.map((product, index) => <div key={`${product.id}-${index}`} className="grid grid-cols-2 sm:grid-cols-[1.7fr_1fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl bg-[var(--surface-elevated)]"><label className="text-xs">ID<input value={product.id} maxLength="80" onChange={(e) => patchProduct(index, "id", e.target.value)} className="mt-1 block w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 font-mono" /></label><label className="text-xs">{tr("التكلفة")}<input type="number" min="1" max="1000000" value={product.cost} onChange={(e) => patchProduct(index, "cost", e.target.value)} className="mt-1 block w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 font-latin" /></label><label className="text-xs">{tr("الساعات")}<input type="number" min="1" max="744" value={product.duration_hours} onChange={(e) => patchProduct(index, "duration_hours", e.target.value)} className="mt-1 block w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 font-latin" /></label><label className="text-xs">{tr("القوة")}<input type="number" min="1" max="100" value={product.strength} onChange={(e) => patchProduct(index, "strength", e.target.value)} className="mt-1 block w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 font-latin" /></label><button onClick={() => setConfig((old) => ({ ...old, boost_products: old.boost_products.filter((_, i) => i !== index) }))} className="p-2 text-red-600 rounded-lg hover:bg-red-500/10" title={tr("حذف")}><Trash2 className="w-4 h-4" /></button></div>)}{!loading && config.boost_products.length === 0 && <div className="p-5 text-center text-sm text-[var(--text-muted)]">{tr("لا توجد منتجات؛ أضف منتجاً ثم احفظ.")}</div>}</div><button onClick={save} disabled={saving || loading} className="bg-[var(--primary)] text-[var(--primary-fg)] px-4 py-2 rounded-xl font-arabic font-bold disabled:opacity-50">{saving ? tr("حفظ...") : tr("حفظ إعدادات الاقتصاد")}</button></section>
    </div>;
}

function AnalyticsPanel() {
    const [report, setReport] = useState(null);
    const [days, setDays] = useState(7);
    useEffect(() => {
        let active = true;
        api.get("/admin/analytics/overview", { params: { days } })
            .then(({ data }) => { if (active) setReport(data); })
            .catch(() => { if (active) setReport(null); });
        return () => { active = false; };
    }, [days]);
    if (!report) return <div className="p-6 text-center font-arabic">{tr("تحميل تحليلات CRM...")}</div>;
    const funnel = report.funnel || {};
    const funnelRows = [
        ["page_view", "مشاهدات الصفحات"],
        ["search", "عمليات البحث"],
        ["listing_view", "مشاهدات الإعلانات"],
        ["contact_seller", "تواصل مع البائع"],
        ["chat_started", "بدء المحادثات"],
        ["listing_created", "إنشاء إعلان"],
        ["listing_published", "نشر إعلان"],
        ["referral_link_open", "فتح رابط الإحالة"],
        ["referral_qualified", "إحالات مؤهلة"],
        ["share_created", "روابط مشاركة منشأة"],
        ["share_opened", "مشاركات مفتوحة"],
        ["share_qualified", "مشاركات مؤهلة"],
        ["boost_purchased", "عمليات ترويج"],
        ["coins_earned", "Coins مكتسبة"],
        ["coins_spent", "Coins مصروفة"],
    ];
    const maxEvent = Math.max(1, ...(report.event_counts || []).map((x) => x.count || 0));
    const eventCount = (key) => Number(funnel[key] || (report.event_counts || []).find((row) => row.event === key)?.count || 0);
    return (
        <div className="space-y-4" data-testid="admin-analytics-panel">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("تحليلات CRM ومسار التحويل")}</h2>
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("بيانات مجهولة/محدودة عن الزوار والمستخدمين والإعلانات")}</p>
                </div>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm">
                    <option value={7}>7 أيام</option><option value={30}>30 يومًا</option><option value={90}>90 يومًا</option>
                </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FinanceCard label={tr("الأحداث")} value={report.events_total} />
                <FinanceCard label={tr("الزوار الفريدون")} value={report.unique_visitors} />
                <FinanceCard label={tr("الجلسات")} value={report.unique_sessions} />
                <FinanceCard label={tr("الإعلانات المنشورة")} value={funnel.listing_published || 0} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><FinanceCard label={tr("فتح الإحالات")} value={eventCount("referral_link_open")} /><FinanceCard label={tr("إحالات مؤهلة")} value={eventCount("referral_qualified")} /><FinanceCard label={tr("مشاركات مؤهلة")} value={eventCount("share_qualified")} /><FinanceCard label={tr("عمليات الترويج")} value={eventCount("boost_purchased")} /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><FinanceCard label={tr("روابط مشاركة")} value={eventCount("share_created")} /><FinanceCard label={tr("مشاركات مفتوحة")} value={eventCount("share_opened")} /><FinanceCard label={tr("Coins مكتسبة")} value={eventCount("coins_earned")} /><FinanceCard label={tr("Coins مصروفة")} value={eventCount("coins_spent")} /></div>
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <h3 className="font-arabic font-bold text-sm mb-3">{tr("مسار التحويل")}</h3>
                <div className="space-y-2">
                    {funnelRows.map(([key, label]) => <div key={key} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-xs">
                        <span className="font-arabic-body text-[var(--text-muted)]">{tr(label)}</span>
                        <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, ((funnel[key] || 0) / Math.max(1, funnel.page_view || 1)) * 100)}%` }} /></div>
                        <span className="font-latin font-bold text-end">{Number(funnel[key] || 0).toLocaleString()}</span>
                    </div>)}
                </div>
            </div>
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <h3 className="font-arabic font-bold text-sm mb-3">{tr("الأحداث الأكثر تكرارًا")}</h3>
                <div className="space-y-2">{(report.event_counts || []).slice(0, 10).map((row) => <div key={row.event} className="flex items-center gap-2 text-xs"><span className="w-32 truncate font-mono">{row.event}</span><div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden"><div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${(row.count / maxEvent) * 100}%` }} /></div><span className="font-latin font-bold w-12 text-end">{row.count}</span></div>)}</div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                    <h3 className="font-arabic font-bold text-sm mb-3">{tr("الفئات الأكثر مشاهدة")}</h3>
                    <div className="space-y-2">{(report.top_categories || []).map((row) => <div key={row.key} className="flex justify-between text-sm"><span className="font-arabic-body">{row.key}</span><b className="font-latin">{row.count}</b></div>)}</div>
                </div>
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                    <h3 className="font-arabic font-bold text-sm mb-3">{tr("الدول ومصادر التفاعل")}</h3>
                    <div className="space-y-2">{(report.top_countries || []).map((row) => <div key={row.key} className="flex justify-between text-sm"><span className="font-latin">{row.key}</span><b className="font-latin">{row.count}</b></div>)}</div>
                </div>
            </div>
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <h3 className="font-arabic font-bold text-sm mb-3">{tr("الإعلانات الأعلى جذبًا")}</h3>
                <div className="space-y-2">{(report.top_listings || []).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-arabic-body">{row.title || row.id}</span><span className="font-latin font-bold shrink-0">{row.views} {tr("مشاهدة")}</span></div>)}</div>
            </div>
        </div>
    );
}

function FinancePanel() {
    const [finance, setFinance] = useState(null);
    useEffect(() => {
        api.get("/admin/finance/summary").then(({ data }) => setFinance(data)).catch(() => setFinance({}));
    }, []);
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20 rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="font-arabic font-black text-lg text-[var(--text)] mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" /> {tr("ملخص المالية")}</h3>
                {finance === null ? <div className="text-sm text-[var(--text-muted)] font-arabic-body">{tr("جاري التحميل...")}</div> : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <FinanceCard label={tr("إجمالي العمولات")} value={finance.total_commission || 0} suffix="ر.س" />
                        <FinanceCard label={tr("معاملات هذا الشهر")} value={finance.this_month_count || 0} />
                        <FinanceCard label={tr("محافظ المستخدمين")} value={finance.total_wallets || 0} suffix="ر.س" />
                        <FinanceCard label={tr("سحوبات معلقة")} value={finance.pending_withdrawals || 0} />
                    </div>
                )}
            </div>
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <h4 className="font-arabic font-bold text-base text-[var(--text)] mb-3">{tr("أعلى البائعين")}</h4>
                <div className="text-sm text-[var(--text-muted)] font-arabic-body">{tr("ستظهر هنا عند تفعيل المعاملات والبائعين الموثقين.")}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-300/40 text-sm font-arabic-body text-amber-900 dark:text-amber-200">
                {tr("ℹ️ نظام العمولات والمحافظ سيُفعّل بعد ربط بوابة الدفع (Stripe). حالياً جميع المعاملات بين البائع والمشتري مباشرة وبدون رسوم.")}
            </div>
        </div>
    );
}

function FinanceCard({ label, value, suffix }) {
    return (
        <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)]">
            <div className="text-xs font-arabic-body text-[var(--text-muted)]">{label}</div>
            <div className="font-latin font-black text-xl text-[var(--text)] mt-1">{Number(value).toLocaleString()} {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}</div>
        </div>
    );
}

function MonitoringPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try { const { data: next } = await api.get("/admin/monitoring"); setData(next); }
        catch (e) { setError(e?.response?.data?.detail || tr("تعذر تحميل حالة المراقبة")); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); const id = window.setInterval(load, 60000); return () => window.clearInterval(id); }, [load]);
    const run = async () => {
        setRunning(true); setError("");
        try { await api.post("/admin/monitoring/run"); await load(); }
        catch (e) { setError(e?.response?.data?.detail || tr("تعذر تنفيذ الفحص")); }
        finally { setRunning(false); }
    };
    if (loading && !data) return <div className="p-6 text-center font-arabic">{tr("تحميل...")}</div>;
    const latest = data?.latest;
    const statusStyles = { healthy: "bg-emerald-500/10 text-emerald-700", degraded: "bg-amber-500/10 text-amber-700", down: "bg-red-500/10 text-red-700" };
    const statusLabel = { healthy: tr("سليم"), degraded: tr("بحاجة إلى متابعة"), down: tr("عطل") };
    const formatWhen = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : tr("لم يُنفذ فحص بعد");
    return <section className="space-y-4" data-testid="admin-monitoring-panel">
        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div><h3 className="font-arabic font-black text-lg text-[var(--text)]">{tr("مراقبة المنصة والفهرسة")}</h3><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("API وMongo وRedis وrobots وsitemap وSchema صفحة الإعلان")}</p></div>
                <div className="flex items-center gap-2"><span className={`px-3 py-1 rounded-full text-xs font-arabic font-bold ${statusStyles[latest?.status] || "bg-slate-500/10 text-slate-600"}`}>{statusLabel[latest?.status] || tr("بانتظار الفحص")}</span><button onClick={run} disabled={running} className="px-3 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm disabled:opacity-50">{running ? tr("جاري الفحص...") : tr("فحص الآن")}</button></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FinanceCard label={tr("فحوص فاشلة")} value={latest?.failed_count || 0} />
                <FinanceCard label={tr("تحذيرات")} value={latest?.warning_count || 0} />
                <FinanceCard label={tr("P95 API (ms)")} value={data?.metrics?.latency_ms?.p95 || 0} />
                <FinanceCard label={tr("أخطاء API")} value={data?.metrics?.errors_total || 0} />
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)] font-arabic-body">{tr("آخر فحص:")} {formatWhen(latest?.checked_at)} · {data?.email_alerts_configured ? tr("تنبيه البريد مفعّل") : tr("تنبيه البريد يحتاج إعداد Resend والبريد الإداري")}</p>
            {error && <p className="mt-3 text-xs text-red-600 font-arabic">{error}</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
            {(latest?.checks || []).map((check) => <div key={check.name} className={`rounded-xl border p-4 ${check.ok ? (check.warning ? "border-amber-400/40 bg-amber-50/30" : "border-emerald-400/30 bg-emerald-50/30") : "border-red-400/40 bg-red-50/30"}`}>
                <div className="flex items-center justify-between gap-2"><strong className="font-latin text-sm text-[var(--text)]">{check.name}</strong><span className="text-xs font-latin">{check.status_code || "—"}{check.latency_ms != null ? ` · ${check.latency_ms}ms` : ""}</span></div><p className="text-xs mt-1 font-arabic-body text-[var(--text-muted)]">{check.detail}</p>
            </div>)}
        </div>
        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]"><h4 className="font-arabic font-black text-base text-[var(--text)] mb-3">{tr("آخر حالات المراقبة")}</h4><div className="space-y-2">{(data?.history || []).slice(0, 10).map((row) => <div key={row.id || row.checked_at} className="flex items-center justify-between gap-3 text-xs border-b border-[var(--border)] pb-2 last:border-0"><span className="font-latin">{formatWhen(row.checked_at)}</span><span className={`px-2 py-1 rounded-full font-arabic ${statusStyles[row.status] || "bg-slate-100"}`}>{statusLabel[row.status] || row.status}</span><span className="font-latin text-[var(--text-muted)]">{row.failed_count || 0} / {row.warning_count || 0}</span></div>) || <p className="text-sm text-[var(--text-muted)] font-arabic">{tr("لا توجد نتائج بعد")}</p>}</div></div>
    </section>;
}

function SEOPanel() {
    const [seo, setSeo] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        api.get("/admin/seo").then(({ data }) => setSeo(data)).catch(() => setSeo({
            site_title: "الحراج بلس | بيع و اشتري",
            site_description: "أكبر سوق رقمي للخليج العربي",
            meta_keywords: "حراج, بيع, شراء, السعودية, الخليج",
            og_image: "/logo-haraj.png",
            sitemap_url: "/sitemap.xml",
            robots_txt: "User-agent: *\nAllow: /",
        }));
    }, []);
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/admin/seo", seo);
            alert(tr("✅ تم حفظ إعدادات SEO"));
        } catch (_) { alert(tr("فشل الحفظ")); } finally { setBusy(false); }
    };
    if (!seo) return <div className="p-6 text-center font-arabic">{tr("تحميل...")}</div>;
    return (
        <form onSubmit={save} className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-3">
            <h3 className="font-arabic font-black text-lg text-[var(--text)] mb-2 flex items-center gap-2"><SearchIcon className="w-5 h-5 text-[var(--primary)]" /> {tr("إعدادات SEO ومحركات البحث")}</h3>
            <SEOField label={tr("عنوان الموقع (Title)")} value={seo.site_title} onChange={(v) => setSeo({ ...seo, site_title: v })} testid="seo-title" />
            <SEOField label={tr("الوصف (Meta Description)")} value={seo.site_description} onChange={(v) => setSeo({ ...seo, site_description: v })} testid="seo-description" textarea />
            <SEOField label={tr("الكلمات المفتاحية")} value={seo.meta_keywords} onChange={(v) => setSeo({ ...seo, meta_keywords: v })} testid="seo-keywords" />
            <SEOField label={tr("صورة OpenGraph")} value={seo.og_image} onChange={(v) => setSeo({ ...seo, og_image: v })} testid="seo-og" />
            <SEOField label="robots.txt" value={seo.robots_txt} onChange={(v) => setSeo({ ...seo, robots_txt: v })} testid="seo-robots" textarea />
            <div className="flex gap-2 pt-2">
                <button type="submit" disabled={busy} data-testid="seo-save-btn" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] px-5 py-2 rounded-xl font-arabic font-bold text-sm">{busy ? tr("حفظ...") : tr("حفظ الإعدادات")}</button>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="bg-[var(--surface-elevated)] text-[var(--text)] px-4 py-2 rounded-xl font-arabic font-bold text-sm border border-[var(--border)]">{tr("عرض sitemap.xml")}</a>
            </div>
        </form>
    );
}

function SEOField({ label, value, onChange, testid, textarea }) {
    return (
        <div>
            <label className="block text-xs font-arabic font-bold text-[var(--text)] mb-1">{label}</label>
            {textarea ? (
                <textarea data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-2.5 text-sm font-mono" />
            ) : (
                <input data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-2.5 text-sm font-arabic-body" />
            )}
        </div>
    );
}

function StatsPanel() {
    const [stats, setStats] = useState(null);
    useEffect(() => { api.get("/admin/stats").then(({ data }) => setStats(data)); }, []);
    if (!stats) return <div className="p-6 text-center font-arabic">{tr("تحميل...")}</div>;
    const items = [
        { label: "إجمالي المستخدمين", value: stats.users },
        { label: "مستخدمون جدد (24س)", value: stats.new_users_24h },
        { label: "إجمالي الإعلانات", value: stats.listings },
        { label: "إعلانات نشطة", value: stats.active_listings },
        { label: "بانتظار المراجعة", value: stats.pending_moderation, danger: true },
        { label: "بلاغات مفتوحة", value: stats.open_reports, danger: true },
        { label: "إجمالي المشاهدات", value: stats.total_views || 0 },
        { label: "إجمالي النقرات", value: stats.total_clicks || 0 },
    ];
    const daily = stats.daily_7d || [];
    const maxL = Math.max(1, ...daily.map((d) => d.listings || 0));
    const maxV = Math.max(1, ...daily.map((d) => d.views || 0));
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.map((it) => (
                    <div key={it.label} className={`bg-[var(--surface)] rounded-2xl p-4 border ${it.danger && it.value > 0 ? "border-[var(--danger)]" : "border-[var(--border)]"}`}>
                        <div className={`font-latin font-black text-2xl sm:text-3xl ${it.danger && it.value > 0 ? "text-[var(--danger)]" : "text-[var(--primary)]"}`}>{it.value}</div>
                        <div className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{it.label}</div>
                    </div>
                ))}
            </div>
            {daily.length > 0 && (
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]" data-testid="admin-daily-chart">
                    <div className="font-arabic font-bold mb-3 text-sm">{tr("آخر 7 أيام")}</div>
                    <div className="flex items-end gap-2 h-32">
                        {daily.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex flex-col-reverse h-full gap-0.5">
                                    <div className="bg-[var(--primary)] rounded-t" style={{ height: `${(d.listings / maxL) * 60}%` }} title={`${d.listings} إعلان`}></div>
                                    <div className="bg-[var(--accent)] rounded-t opacity-70" style={{ height: `${(d.views / maxV) * 40}%` }} title={`${d.views} مشاهدة`}></div>
                                </div>
                                <div className="text-[9px] text-[var(--text-muted)] font-latin">{d.date.slice(5)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 text-[11px] mt-2 font-arabic-body text-[var(--text-muted)]">
                        <span><span className="inline-block w-3 h-3 bg-[var(--primary)] rounded-sm me-1"></span>{tr("الإعلانات")}</span>
                        <span><span className="inline-block w-3 h-3 bg-[var(--accent)] opacity-70 rounded-sm me-1"></span>{tr("المشاهدات")}</span>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(stats.top_categories || []).length > 0 && (
                    <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                        <div className="font-arabic font-bold mb-2 text-sm">{tr("أعلى التصنيفات")}</div>
                        {stats.top_categories.map((c) => (
                            <div key={c.category} className="flex justify-between text-xs py-1 border-b border-[var(--border)]/40">
                                <span className="font-arabic-body">{c.category}</span>
                                <span className="font-latin font-bold">{c.count}</span>
                            </div>
                        ))}
                    </div>
                )}
                {(stats.top_keywords || []).length > 0 && (
                    <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                        <div className="font-arabic font-bold mb-2 text-sm">{tr("أعلى الكلمات بحثاً")}</div>
                        {stats.top_keywords.map((k) => (
                            <div key={k.q} className="flex justify-between text-xs py-1 border-b border-[var(--border)]/40">
                                <span className="font-arabic-body">{k.q}</span>
                                <span className="font-latin font-bold">{k.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ModerationPanel() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Map moderation flag codes to human-readable Arabic labels.
    // Codes match the backend `detect_moderation_flags()` output.
    const FLAG_LABELS = {
        phone_spam: tr("رقم هاتف ضمن النص"),
        offsite_contact: tr("طلب تواصل خارج التطبيق (WhatsApp/Telegram)"),
        external_link: tr("رابط خارجي"),
        bank_request: tr("طلب تحويل بنكي / IBAN"),
    };
    const flagLabel = (code) => {
        if (code?.startsWith("banned_word:")) return tr("كلمة محظورة: ") + code.split(":", 1)[1];
        return FLAG_LABELS[code] || code;
    };

    const reload = () => {
        setLoading(true);
        api.get("/admin/listings/pending")
            .then(({ data }) => setItems(data || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };
    useEffect(() => { reload(); }, []);

    const approve = async (id) => { await api.post(`/admin/listings/${id}/approve`); reload(); };
    const reject = async (id) => { await api.post(`/admin/listings/${id}/reject`); reload(); };
    const del = async (id) => {
        if (!confirm(tr("هل تريد حذف هذا الإعلان نهائياً؟"))) return;
        await api.delete(`/admin/listings/${id}`); reload();
    };

    if (loading) return <div className="p-8 text-center font-arabic text-[var(--text-muted)]">{tr("جاري التحميل...")}</div>;
    if (items.length === 0) return <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)] text-[var(--text-muted)] font-arabic-body" data-testid="moderation-empty">{tr("لا توجد إعلانات بانتظار المراجعة ✅")}</div>;

    return (
        <div className="space-y-3" data-testid="moderation-list">
            {items.map((l) => (
                <div key={l.id} className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {l.images?.[0] && <img src={l.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                        <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic font-bold text-sm text-[var(--text)] hover:text-[var(--primary)] block">{l.title}</Link>
                        <p className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-2">{l.description}</p>
                        {l.moderation_flags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2" data-testid={`flags-${l.id}`}>
                                {l.moderation_flags.map((c) => (
                                    <span key={c} className="inline-flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-arabic-body font-bold px-2 py-0.5 rounded-full">
                                        <Flag className="w-2.5 h-2.5" /> {flagLabel(c)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button data-testid={`approve-${l.id}`} onClick={() => approve(l.id)} className="bg-[var(--success)] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" />{tr("موافقة")}</button>
                        <button data-testid={`reject-${l.id}`} onClick={() => reject(l.id)} className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" />{tr("رفض")}</button>
                        <button data-testid={`delete-${l.id}`} onClick={() => del(l.id)} className="bg-[var(--danger)] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />{tr("حذف")}</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Full listings browser — uses GET /admin/listings with filters.
function ListingsPanel() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ status: "", moderation: "", country_code: "", q: "", flagged: false, flag_kind: "" });
    const [skip, setSkip] = useState(0);
    const LIMIT = 30;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: LIMIT, skip };
            for (const k of ["status", "moderation", "country_code", "q"]) {
                if (filters[k]) params[k] = filters[k];
            }
            if (filters.flagged) params.flagged = true;
            if (filters.flag_kind) params.flag_kind = filters.flag_kind;
            const { data } = await api.get("/admin/listings", { params });
            setItems(data?.items || []);
            setTotal(data?.total || 0);
        } catch (_) {
            setItems([]); setTotal(0);
        } finally { setLoading(false); }
    }, [filters, skip]);
    useEffect(() => { load(); }, [load]);

    const onSearch = (e) => { e.preventDefault(); setSkip(0); load(); };
    const del = async (id) => {
        if (!confirm(tr("هل تريد حذف هذا الإعلان نهائياً؟"))) return;
        await api.delete(`/admin/listings/${id}`); load();
    };
    const approve = async (id) => { await api.post(`/admin/listings/${id}/approve`); load(); };

    return (
        <div className="space-y-3">
            <form onSubmit={onSearch} className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] grid grid-cols-2 sm:grid-cols-5 gap-2" data-testid="listings-filters">
                <input data-testid="filter-q" placeholder={tr("بحث في العنوان...")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="col-span-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
                <select data-testid="filter-status" value={filters.status} onChange={(e) => { setSkip(0); setFilters({ ...filters, status: e.target.value }); }} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm">
                    <option value="">{tr("كل الحالات")}</option>
                    <option value="active">{tr("نشط")}</option>
                    <option value="paused">{tr("موقوف")}</option>
                    <option value="sold">{tr("تم البيع")}</option>
                </select>
                <select data-testid="filter-mod" value={filters.moderation} onChange={(e) => { setSkip(0); setFilters({ ...filters, moderation: e.target.value }); }} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm">
                    <option value="">{tr("كل المراجعة")}</option>
                    <option value="approved">{tr("موافَق")}</option>
                    <option value="pending">{tr("بانتظار")}</option>
                    <option value="rejected">{tr("مرفوض")}</option>
                </select>
                <input data-testid="filter-country" placeholder={tr("الدولة (SA)")} value={filters.country_code} onChange={(e) => { setSkip(0); setFilters({ ...filters, country_code: e.target.value.toUpperCase() }); }} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm uppercase" />
                <div className="col-span-2 sm:col-span-5 flex flex-wrap items-center gap-2">
                    <button type="button" data-testid="filter-flagged-toggle" onClick={() => { setSkip(0); setFilters({ ...filters, flagged: !filters.flagged }); }} className={`px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1.5 border ${filters.flagged ? "bg-red-500 text-white border-red-600" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}>
                        <Flag className="w-3 h-3" /> {tr("الإعلانات المرفوع عنها علامات فقط")}
                    </button>
                    <select data-testid="filter-flag-kind" value={filters.flag_kind} onChange={(e) => { setSkip(0); setFilters({ ...filters, flag_kind: e.target.value }); }} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-3 py-1.5 text-xs font-arabic font-bold">
                        <option value="">{tr("كل أنواع العلامات")}</option>
                        <option value="banned_words">{tr("كلمات محظورة")}</option>
                        <option value="suspicious">{tr("روابط/IBAN/خارج التطبيق")}</option>
                        <option value="phone_spam">{tr("سبام جوال")}</option>
                        <option value="ai">🤖 {tr("AI رصدها")}</option>
                    </select>
                    <button type="submit" data-testid="listings-search-btn" className="flex-1 min-w-[120px] bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl py-2 text-sm font-arabic font-bold">{tr("بحث")}</button>
                </div>
            </form>

            {loading ? <div className="p-8 text-center font-arabic text-[var(--text-muted)]">{tr("جاري التحميل...")}</div> : (
                <>
                    <div className="text-xs text-[var(--text-muted)] font-arabic-body">{total} {tr("إعلان")}</div>
                    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        <table className="w-full text-sm font-arabic-body">
                            <thead className="bg-[var(--surface-elevated)]">
                                <tr>
                                    <th className="text-start p-2 font-arabic">{tr("العنوان")}</th>
                                    <th className="text-start p-2 font-arabic hidden sm:table-cell">{tr("الحالة")}</th>
                                    <th className="text-start p-2 font-arabic hidden sm:table-cell">{tr("المراجعة")}</th>
                                    <th className="text-start p-2 font-arabic hidden md:table-cell">{tr("الدولة")}</th>
                                    <th className="text-start p-2 font-arabic">{tr("إجراءات")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((l) => (
                                    <tr key={l.id} className="border-t border-[var(--border)]" data-testid={`row-${l.id}`}>
                                        <td className="p-2">
                                            <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-bold text-[var(--text)] hover:text-[var(--primary)] text-xs">{(l.title || "").slice(0, 50)}</Link>
                                            {l.moderation_flags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {l.moderation_flags.slice(0, 3).map((c) => (
                                                        <span key={c} className="inline-flex items-center gap-0.5 bg-red-500/10 text-red-600 border border-red-500/30 text-[9px] font-arabic-body font-bold px-1.5 py-0.5 rounded-full">
                                                            <Flag className="w-2 h-2" /> {c.startsWith("banned_word:") ? c.split(":")[1] : c}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2 hidden sm:table-cell text-xs">{l.status || "—"}</td>
                                        <td className="p-2 hidden sm:table-cell text-xs">{l.moderation || "—"}</td>
                                        <td className="p-2 hidden md:table-cell text-xs">{l.country_code || "—"}</td>
                                        <td className="p-2 flex gap-1">
                                            {l.moderation === "pending" && (
                                                <button data-testid={`row-approve-${l.id}`} onClick={() => approve(l.id)} className="bg-[var(--success)]/15 text-[var(--success)] px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Check className="w-3 h-3" />{tr("موافقة")}</button>
                                            )}
                                            <button data-testid={`row-del-${l.id}`} onClick={() => del(l.id)} className="bg-red-500/15 text-red-500 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />{tr("حذف")}</button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-xs text-[var(--text-muted)] font-arabic-body">{tr("لا توجد نتائج")}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex justify-between items-center text-xs">
                        <button disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - LIMIT))} className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1 font-bold disabled:opacity-40" data-testid="listings-prev">{tr("‹ السابق")}</button>
                        <span className="font-arabic-body text-[var(--text-muted)]">{skip + 1}–{Math.min(skip + LIMIT, total)} {tr("من")} {total}</span>
                        <button disabled={skip + LIMIT >= total} onClick={() => setSkip(skip + LIMIT)} className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1 font-bold disabled:opacity-40" data-testid="listings-next">{tr("التالي ›")}</button>
                    </div>
                </>
            )}
        </div>
    );
}

function ListingLifecyclePanel() {
    const [ageDays, setAgeDays] = useState(180);
    const [status, setStatus] = useState("");
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        try { const { data } = await api.get("/admin/listings/lifecycle", { params: { age_days: ageDays, status, limit: 500 } }); setItems(data?.items || []); setTotal(data?.total || 0); setSelected(new Set()); } catch (_) { setItems([]); setTotal(0); } finally { setLoading(false); }
    }, [ageDays, status]);
    useEffect(() => { load(); }, [load]);
    const toggle = (id) => setSelected((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });
    const remove = async () => {
        const explicit = Array.from(selected);
        const label = explicit.length ? `${explicit.length} ${tr("إعلان محدد")}` : `${tr("كل الإعلانات الأقدم من")} ${ageDays} ${tr("يومًا")}`;
        if (!window.confirm(`${tr("سيتم حذف")} ${label} ${tr("نهائيًا من قاعدة البيانات وجدولة حذف الصور والفيديوهات من Cloudinary. هل أنت متأكد؟")}`)) return;
        setBusy(true);
        try { const { data } = await api.post("/admin/listings/bulk-delete", explicit.length ? { ids: explicit } : { older_than_days: ageDays, status }); alert(`${tr("تم حذف")} ${data.deleted} ${tr("إعلان")}. ${tr("تمت جدولة")} ${data.media_queued} ${tr("وسيط")}.`); await load(); } catch (e) { alert(e.response?.data?.detail || tr("تعذر الحذف الجماعي")); } finally { setBusy(false); }
    };
    const preview = async () => { try { const { data } = await api.post("/admin/listings/bulk-delete", { older_than_days: ageDays, status, dry_run: true }); alert(`${tr("عدد الإعلانات المطابقة")}: ${data.matched}`); } catch (e) { alert(e.response?.data?.detail || tr("تعذر المعاينة")); } };
    return <div className="space-y-4" data-testid="listing-lifecycle-panel">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4"><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("عمر الإعلانات وتنظيف التخزين")}</h2><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("الإعلان لا تنتهي صلاحيته تلقائيًا؛ هذه أدوات مراجعة وحذف يدوية تحت تحكم الإدارة.")}</p><div className="flex flex-wrap gap-2 mt-4"><select value={ageDays} onChange={(e) => setAgeDays(Number(e.target.value))} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value={30}>أقدم من شهر</option><option value={60}>أقدم من شهرين</option><option value={180}>أقدم من 6 أشهر</option><option value={365}>أقدم من سنة</option><option value={1825}>أقدم من 5 سنوات</option></select><select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value="">كل الحالات</option><option value="active">نشط</option><option value="sold">مباع</option><option value="paused">موقوف</option></select><button onClick={preview} className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm font-arabic">{tr("معاينة المطابق")}</button><button onClick={remove} disabled={busy || (!items.length && !selected.size)} className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-arabic font-bold disabled:opacity-50">{busy ? tr("جاري الحذف...") : tr("حذف جماعي")}</button></div></div>
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-arabic-body"><span>{loading ? tr("جاري التحميل...") : `${total} ${tr("إعلان مطابق")}`}</span><button onClick={() => setSelected(new Set(items.map((x) => x.id)))} className="underline">{tr("تحديد الصفحة")}</button></div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="p-3 text-start">#</th><th className="p-3 text-start">{tr("الإعلان")}</th><th className="p-3 text-start">{tr("الحالة")}</th><th className="p-3 text-start">{tr("تاريخ الإنشاء")}</th><th className="p-3 text-start">{tr("الوسائط")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[var(--border)]/50"><td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td><td className="p-3"><Link to={`/listing/${item.id}`} target="_blank" rel="noreferrer" className="font-bold hover:text-[var(--primary)]">{item.title || item.id}</Link></td><td className="p-3">{item.status || "—"}</td><td className="p-3 font-latin">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td><td className="p-3 font-latin">{(item.images?.length || 0) + (item.videos?.length || 0)}</td></tr>)}{!loading && items.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد إعلانات مطابقة")}</td></tr>}</tbody></table></div></div>
    </div>;
}

// Data integrity tool — always previews first; mutations need confirmation and remain reversible.
function DataIntegrityPanel() {
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const [lastBatch, setLastBatch] = useState("");

    const load = () => {
        setLoadError("");
        return api.get("/admin/data-integrity")
            .then(({ data: next }) => setData(next && typeof next === "object" ? next : null))
            .catch(() => { setData(null); setLoadError(tr("تعذر قراءة سلامة البيانات من الخادم")); });
    };
    useEffect(() => { load(); }, []);

    const preview = async () => {
        setBusy(true); setNotice("");
        try {
            const { data: result } = await api.post("/admin/data-integrity/repair", { apply: false });
            const count = result?.plan?.issues_total ?? 0;
            setNotice(`${tr("تم إنشاء معاينة آمنة")} — ${count} ${tr("مخالفة قابلة للمراجعة")}`);
        } catch (_) { setNotice(tr("تعذر إنشاء معاينة الإصلاح")); }
        finally { setBusy(false); }
    };
    const apply = async () => {
        if (!confirm(tr("سيُحفظ سجل سابق لكل تعديل، وسيتم مسح المدينة المخالفة أو تصحيح العملة فقط. متابعة؟"))) return;
        setBusy(true); setNotice("");
        try {
            const { data: result } = await api.post("/admin/data-integrity/repair", { apply: true, confirm: "REPAIR_COUNTRY_INTEGRITY", repair_currency: true, clear_invalid_city: true });
            setLastBatch(result.batch_id || "");
            setNotice(`${tr("تم الإصلاح")}: ${result.changed || 0} — ${tr("يمكن التراجع عن هذه الدفعة")}`);
            await load();
        } catch (e) { setNotice(e?.response?.data?.detail || tr("فشل الإصلاح")); }
        finally { setBusy(false); }
    };
    const rollback = async () => {
        if (!lastBatch || !confirm(tr("سيتم استرجاع القيم السابقة لدفعة الإصلاح الأخيرة. متابعة؟"))) return;
        setBusy(true); setNotice("");
        try {
            const { data: result } = await api.post("/admin/data-integrity/rollback", { batch_id: lastBatch });
            setNotice(`${tr("تم التراجع")}: ${result.restored || 0}`);
            setLastBatch("");
            await load();
        } catch (e) { setNotice(e?.response?.data?.detail || tr("فشل التراجع")); }
        finally { setBusy(false); }
    };

    if (!data) return <div className="p-6 text-center font-arabic">{loadError || tr("جاري التحميل...")}</div>;
    const issuesTotal = Number(data.issues_total || 0) + Number(data.listings_without_country || 0) + Number(data.users_without_country || 0);
    const clean = issuesTotal === 0;
    return <div className="space-y-4" data-testid="data-integrity-panel">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <IntegrityMetric testId="di-listings-count" value={data.listings_without_country} label={tr("إعلانات بدون دولة")} danger={data.listings_without_country > 0} />
            <IntegrityMetric testId="di-users-count" value={data.users_without_country} label={tr("مستخدمون بدون دولة")} danger={data.users_without_country > 0} />
            <IntegrityMetric testId="di-city-mismatch" value={data.summary?.city_country_mismatch} label={tr("مدينة لا تطابق الدولة")} danger={data.summary?.city_country_mismatch > 0} />
            <IntegrityMetric testId="di-currency-mismatch" value={data.summary?.currency_country_mismatch} label={tr("عملة لا تطابق الدولة")} danger={data.summary?.currency_country_mismatch > 0} />
        </div>
        {clean ? <div className="bg-[var(--success)]/10 border border-[var(--success)]/40 rounded-2xl p-5 text-center font-arabic-body text-[var(--success)] font-bold" data-testid="di-clean">{tr("البيانات سليمة وفق فحص الدولة والمدينة والعملة")}</div> : <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] space-y-3"><p className="text-xs text-[var(--text-muted)] font-arabic-body">{tr("لا ينقل الإصلاح الإعلان بين الدول بالاستنتاج. يصحح العملة المحلية الواضحة فقط ويمسح المدينة المخالفة مع وضعها للمراجعة، بعد حفظ preimage قابل للتراجع.")}</p><div className="flex flex-wrap gap-2"><button onClick={preview} disabled={busy} data-testid="di-preview-btn" className="border border-[var(--border)] px-4 py-2 rounded-xl font-arabic font-bold text-sm disabled:opacity-60">{busy ? tr("جاري الفحص...") : tr("معاينة آمنة")}</button><button onClick={apply} disabled={busy} data-testid="di-apply-btn" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] px-4 py-2 rounded-xl font-arabic font-bold text-sm disabled:opacity-60">{tr("تطبيق مع حفظ نسخة سابقة")}</button>{lastBatch && <button onClick={rollback} disabled={busy} data-testid="di-rollback-btn" className="bg-red-600 text-white px-4 py-2 rounded-xl font-arabic font-bold text-sm disabled:opacity-60">{tr("التراجع عن آخر دفعة")}</button>}</div>{notice && <p role="status" className="text-xs font-arabic-body text-[var(--text-muted)]">{notice}</p>}</div>}
        {data.sample_issues?.length > 0 && <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]"><div className="font-arabic font-bold mb-2 text-sm">{tr("عينة من المخالفات")}</div>{data.sample_issues.map((item) => <div key={item.id} className="text-xs py-2 border-b border-[var(--border)]/40 flex justify-between gap-2"><Link to={`/listing/${item.id}`} target="_blank" rel="noreferrer" className="font-arabic-body text-[var(--text)] hover:text-[var(--primary)] truncate">{item.title || item.id}</Link><span className="font-latin text-[var(--text-muted)] text-[10px]">{(item.issue_types || []).join(" • ")}</span></div>)}</div>}
    </div>;
}

function IntegrityMetric({ testId, value, label, danger }) {
    return <div className={`rounded-2xl p-4 border ${danger ? "border-[var(--danger)] bg-red-500/5" : "border-[var(--border)] bg-[var(--surface)]"}`}><div className="font-latin font-black text-3xl text-[var(--text)]" data-testid={testId}>{Number(value || 0)}</div><div className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{label}</div></div>;
}


function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ q: "", country_code: "", banned: "", verified: "" });
    const [loading, setLoading] = useState(false);
    const [activeUserId, setActiveUserId] = useState(null);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 200 };
            if (filters.q) params.q = filters.q;
            if (filters.country_code) params.country_code = filters.country_code;
            if (filters.banned !== "") params.banned = filters.banned;
            if (filters.verified !== "") params.verified = filters.verified;
            const { data } = await api.get("/admin/users", { params });
            setUsers(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
        } catch (_) { setUsers([]); }
        finally { setLoading(false); }
    }, [filters]);
    useEffect(() => { reload(); }, [reload]);
    const submitSearch = (e) => { e.preventDefault(); reload(); };

    return (
        <div className="space-y-3">
            <form onSubmit={submitSearch} className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] grid grid-cols-2 sm:grid-cols-5 gap-2" data-testid="users-filters">
                <input data-testid="users-q" placeholder={tr("بحث (اسم / بريد / جوال)")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="col-span-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
                <input data-testid="users-cc" placeholder={tr("الدولة")} maxLength={3} value={filters.country_code} onChange={(e) => setFilters({ ...filters, country_code: e.target.value.toUpperCase() })} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm uppercase" />
                <select data-testid="users-status" value={filters.banned} onChange={(e) => setFilters({ ...filters, banned: e.target.value })} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm">
                    <option value="">{tr("كل الحالات")}</option>
                    <option value="false">{tr("نشطون")}</option>
                    <option value="true">{tr("محظورون")}</option>
                </select>
                <select data-testid="users-verified" value={filters.verified} onChange={(e) => setFilters({ ...filters, verified: e.target.value })} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-2 py-2 text-sm">
                    <option value="">{tr("التوثيق")}</option>
                    <option value="true">{tr("موثّقون")}</option>
                    <option value="false">{tr("غير موثّقين")}</option>
                </select>
            </form>
            {loading ? <div className="p-6 text-center font-arabic text-[var(--text-muted)]">{tr("جاري التحميل...")}</div> : (
                <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-sm font-arabic-body">
                        <thead className="bg-[var(--surface-elevated)]">
                            <tr>
                                <th className="text-start p-3 font-arabic">{tr("الاسم")}</th>
                                <th className="text-start p-3 font-arabic hidden sm:table-cell">{tr("البريد")}</th>
                                <th className="text-start p-3 font-arabic">{tr("الدولة")}</th>
                                <th className="text-start p-3 font-arabic">{tr("الحالة")}</th>
                                <th className="text-start p-3 font-arabic">{tr("إجراءات")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-elevated)]/50">
                                    <td className="p-3 font-bold text-[var(--text)]">
                                        <button data-testid={`user-open-${u.id}`} onClick={() => setActiveUserId(u.id)} className="text-start hover:text-[var(--primary)] hover:underline">{u.name}</button>
                                    </td>
                                    <td className="p-3 text-[var(--text-muted)] hidden sm:table-cell text-xs">{u.email}</td>
                                    <td className="p-3 text-[var(--text-muted)]">{u.country_code}</td>
                                    <td className="p-3">
                                        {u.banned ? <span className="text-red-500 font-bold">{tr("محظور")}</span> : u.verified ? <span className="text-[var(--success)] font-bold">{tr("موثّق")}</span> : <span className="text-[var(--text-muted)]">{tr("عادي")}</span>}
                                    </td>
                                    <td className="p-3 flex gap-1">
                                        {!u.verified && <button data-testid={`user-verify-${u.id}`} onClick={async () => { await api.post(`/admin/users/${u.id}/verify`); reload(); }} className="bg-[var(--primary)]/15 text-[var(--primary)] px-2 py-1 rounded-full text-xs font-bold">{tr("توثيق")}</button>}
                                        {u.banned ? (
                                            <button data-testid={`user-unban-${u.id}`} onClick={async () => { await api.post(`/admin/users/${u.id}/unban`); reload(); }} className="bg-[var(--success)]/15 text-[var(--success)] px-2 py-1 rounded-full text-xs font-bold">{tr("إلغاء حظر")}</button>
                                        ) : (
                                            <button data-testid={`user-ban-${u.id}`} onClick={async () => { await api.post(`/admin/users/${u.id}/ban`); reload(); }} className="bg-red-500/15 text-red-500 px-2 py-1 rounded-full text-xs font-bold">{tr("حظر")}</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-xs text-[var(--text-muted)]">{tr("لا توجد نتائج")}</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
            {activeUserId && <UserDetailsDrawer userId={activeUserId} onClose={() => setActiveUserId(null)} onChanged={reload} />}
        </div>
    );
}

function UserDetailsDrawer({ userId, onClose, onChanged }) {
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        let cancelled = false;
        api.get(`/admin/users/${userId}`).then(({ data }) => { if (!cancelled) setData(data); }).catch(() => { if (!cancelled) setData({ error: true }); });
        return () => { cancelled = true; };
    }, [userId]);

    const act = async (action) => {
        setBusy(true);
        try {
            await api.post(`/admin/users/${userId}/${action}`);
            const { data: fresh } = await api.get(`/admin/users/${userId}`);
            setData(fresh);
            onChanged?.();
        } catch (_) { /* swallow */ }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/50" data-testid="user-details-drawer" onClick={onClose}>
            <div className="w-full sm:w-[480px] max-w-full h-full bg-[var(--bg)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4 py-3">
                    <h3 className="font-arabic font-black text-lg text-[var(--text)]">{tr("تفاصيل المستخدم")}</h3>
                    <button data-testid="user-drawer-close" onClick={onClose} className="bg-[var(--surface-elevated)] rounded-full w-9 h-9 flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
                {!data ? <div className="p-8 text-center font-arabic">{tr("جاري التحميل...")}</div> : data.error ? <div className="p-8 text-center text-red-500 font-arabic-body">{tr("تعذر تحميل البيانات")}</div> : (
                    <div className="p-4 space-y-4">
                        <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] space-y-2">
                            <div className="flex items-center gap-3">
                                {data.user?.avatar_url
                                    ? <img src={data.user.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                                    : <div className="w-14 h-14 rounded-full bg-[var(--primary)]/15 flex items-center justify-center font-arabic font-black text-[var(--primary)] text-xl">{(data.user?.name || "?")[0]}</div>
                                }
                                <div className="min-w-0">
                                    <div className="font-arabic font-black text-lg text-[var(--text)] truncate">{data.user?.name}</div>
                                    <div className="text-xs text-[var(--text-muted)] truncate">{data.user?.email}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 text-xs font-arabic-body gap-1.5 pt-2 border-t border-[var(--border)]/40">
                                <div><span className="text-[var(--text-muted)]">{tr("الجوال")}:</span> <span className="font-bold">{data.user?.phone_full || "—"}</span></div>
                                <div><span className="text-[var(--text-muted)]">{tr("المدينة")}:</span> <span className="font-bold">{data.user?.city || "—"}</span></div>
                                <div><span className="text-[var(--text-muted)]">{tr("الدولة")}:</span> <span className="font-bold">{data.user?.country_code}</span></div>
                                <div><span className="text-[var(--text-muted)]">{tr("الدور")}:</span> <span className="font-bold">{data.user?.role}</span></div>
                                <div><span className="text-[var(--text-muted)]">{tr("التسجيل")}:</span> <span className="font-bold">{(data.user?.created_at || "").slice(0, 10)}</span></div>
                                <div><span className="text-[var(--text-muted)]">{tr("آخر دخول")}:</span> <span className="font-bold">{(data.user?.last_seen || "—").slice(0, 16)}</span></div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {!data.user?.verified && <button data-testid="drawer-verify" disabled={busy} onClick={() => act("verify")} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">{tr("توثيق الحساب")}</button>}
                                {data.user?.banned
                                    ? <button data-testid="drawer-unban" disabled={busy} onClick={() => act("unban")} className="bg-[var(--success)] text-white px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">{tr("إلغاء الحظر")}</button>
                                    : <button data-testid="drawer-ban" disabled={busy} onClick={() => act("ban")} className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">{tr("حظر")}</button>
                                }
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                            <Stat label={tr("الإعلانات")} value={data.stats?.listings_total || 0} />
                            <Stat label={tr("العروض المرسلة/المستلمة")} value={`${data.stats?.offers_sent || 0}/${data.stats?.offers_received || 0}`} />
                            <Stat label={tr("الإحالات المؤهلة")} value={`${data.stats?.referrals_qualified || 0}/${data.stats?.referrals_count || 0}`} />
                            <Stat label={tr("نقاط الإحالة")} value={data.stats?.referral_points || 0} />
                            <Stat label={tr("الجلسات")} value={data.stats?.sessions_total || 0} />
                            <Stat label={tr("بلاغات ضدّه")} value={data.stats?.reports_against || 0} />
                            <Stat label={tr("آخر رسالة")} value={(data.stats?.last_message_at || "—").slice(0, 10)} />
                        </div>

                        <div>
                            <h4 className="font-arabic font-bold text-sm text-[var(--text)] mb-2">{tr("آخر الأجهزة والجلسات")}</h4>
                            <div className="space-y-2">{(data.recent_sessions || []).map((s) => <div key={s.session_id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3 text-xs flex flex-wrap items-center gap-2"><span className="font-bold">{s.device_type || "—"}</span><span className="text-[var(--text-muted)]">{[s.os, s.browser].filter(Boolean).join(" / ") || "—"}</span><span className="text-[var(--text-muted)] font-mono truncate">{s.last_path || "—"}</span><span className="ms-auto font-latin">{s.last_seen ? new Date(s.last_seen).toLocaleString() : "—"}</span></div>)}{(data.recent_sessions || []).length === 0 && <div className="text-xs text-[var(--text-muted)] bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">{tr("لا توجد جلسات مسجلة بعد")}</div>}</div>
                        </div>

                        <div>
                            <h4 className="font-arabic font-bold text-sm text-[var(--text)] mb-2">{tr("إعلانات هذا المستخدم")}</h4>
                            {(data.listings || []).length === 0 ? <div className="text-xs text-[var(--text-muted)] font-arabic-body bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">{tr("لا توجد إعلانات")}</div> : (
                                <div className="space-y-2">
                                    {(data.listings || []).map((l) => (
                                        <div key={l.id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-2 flex items-center gap-2">
                                            {l.images?.[0] && <img src={l.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic font-bold text-xs text-[var(--text)] hover:text-[var(--primary)] block truncate">{l.title}</Link>
                                                <div className="text-[10px] text-[var(--text-muted)] font-latin">{l.price} {l.currency} • {l.status} • {l.moderation}</div>
                                                {l.moderation_flags?.length > 0 && <div className="text-[9px] text-red-500 font-arabic-body">{tr("علامات")}: {l.moderation_flags.join(", ")}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)]">
            <div className="font-latin font-black text-xl text-[var(--text)]">{value}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-arabic-body mt-0.5">{label}</div>
        </div>
    );
}

function ReportsPanel() {
    const [reports, setReports] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const reload = () => api.get("/admin/reports").then(({ data }) => setReports(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []))).catch(() => setReports([]));
    useEffect(() => { reload(); }, []);
    return (
        <div className="space-y-2">
            {reports.length === 0 && <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)] text-[var(--text-muted)] font-arabic-body">{tr("لا توجد بلاغات")}</div>}
            {reports.map((r) => {
                const isOpen = expanded === r.id;
                return (
                    <div key={r.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="p-4 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-arabic font-bold px-2 py-0.5 rounded-full ${r.target_type === "listing" ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-[var(--accent)]/15 text-[var(--accent)]"}`}>
                                        {r.target_type === "listing" ? "إعلان" : r.target_type === "user" ? "مستخدم" : r.target_type}
                                    </span>
                                    <span className="font-arabic font-bold text-sm text-[var(--text)]">#{r.target_id?.slice(0, 8)}</span>
                                    <span className="text-[10px] text-[var(--text-muted)] font-arabic-body">{r.created_at ? new Date(r.created_at).toLocaleString("ar") : ""}</span>
                                </div>
                                <div className="text-xs text-[var(--text)] font-arabic-body mt-1 line-clamp-1">السبب: {r.reason || "—"}</div>
                            </div>
                            <span className={`text-xs font-bold ${r.status === "open" ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>{r.status === "open" ? "مفتوح" : "مغلق"}</span>
                            <button onClick={() => setExpanded(isOpen ? null : r.id)} className="bg-[var(--surface-elevated)] text-[var(--text)] px-3 py-1.5 rounded-full text-xs font-bold">{isOpen ? "إخفاء" : "تفاصيل"}</button>
                            {r.status === "open" && <button onClick={async () => { await api.post(`/admin/reports/${r.id}/close`); reload(); }} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold">{tr("إغلاق")}</button>}
                        </div>
                        {isOpen && (
                            <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] space-y-2 text-xs font-arabic-body bg-[var(--surface-elevated)]">
                                <div><b>{tr("السبب الكامل:")}</b> {r.reason || "—"}</div>
                                {r.message && <div><b>{tr("تفاصيل من المُبلِّغ:")}</b> {r.message}</div>}
                                <div><b>{tr("المُبلِّغ ID:")}</b> {r.reporter_id?.slice(0, 12)}…</div>
                                <div><b>{tr("الهدف ID:")}</b> {r.target_id}</div>
                                {r.target_type === "listing" && (
                                    <Link to={`/listing/${r.target_id}`} target="_blank" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold mt-1">
                                        🔗 فتح الإعلان
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function NotificationsPanel() {
    const [form, setForm] = useState({ title: "", body: "", target: "all", country_code: "", category: "", inactive_days: 14, url: "", image: "" });
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [suggesting, setSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [schedAt, setSchedAt] = useState(""); // ISO local datetime
    const [schedBusy, setSchedBusy] = useState(false);

    const loadSchedules = async () => {
        try {
            const { data } = await api.get("/admin/notifications/schedule");
            setSchedules(data || []);
        } catch (_) { setSchedules([]); }
    };
    useEffect(() => { loadSchedules(); }, []);

    const scheduleSend = async () => {
        if (!form.title || !form.body) { alert(tr("املأ العنوان والنص")); return; }
        if (!schedAt) { alert(tr("اختر تاريخ ووقت الإرسال")); return; }
        const sendDate = new Date(schedAt);
        if (Number.isNaN(sendDate.getTime()) || sendDate <= new Date()) {
            alert(tr("اختر وقتاً مستقبلياً")); return;
        }
        setSchedBusy(true);
        try {
            await api.post("/admin/notifications/schedule", {
                ...form,
                send_at: sendDate.toISOString(),
            });
            setSchedAt("");
            setForm({ title: "", body: "", target: "all", country_code: "", category: "", inactive_days: 14, url: "", image: "" });
            await loadSchedules();
            alert(tr("تم جدولة الإشعار ✅"));
        } catch (e) {
            alert(e.response?.data?.detail || tr("تعذرت الجدولة"));
        } finally { setSchedBusy(false); }
    };

    const cancelSchedule = async (sid) => {
        if (!window.confirm(tr("إلغاء هذا الإشعار المجدول؟"))) return;
        try {
            await api.delete(`/admin/notifications/schedule/${sid}`);
            await loadSchedules();
        } catch (_) { alert(tr("فشل الإلغاء")); }
    };

    const send = async () => {
        if (!form.title || !form.body) { alert(tr("املأ العنوان والنص")); return; }
        if (!window.confirm(`سيتم إرسال هذا الإشعار للمستخدمين (${form.target}). متابعة؟`)) return;
        setBusy(true);
        try {
            const { data } = await api.post("/admin/notifications/broadcast", form);
            setResult(data);
            setForm({ title: "", body: "", target: "all", country_code: "", category: "", inactive_days: 14, url: "", image: "" });
        } catch (e) {
            alert(e.response?.data?.detail || "تعذر الإرسال");
        } finally { setBusy(false); }
    };

    const suggest = async () => {
        setSuggesting(true);
        try {
            const { data } = await api.get("/admin/notifications/ai-suggest");
            setSuggestions(data.suggestions || []);
            if (!data.suggestions?.length) alert(tr("لم يتم توليد اقتراحات"));
        } catch (_) {
            alert(tr("تعذر توليد الاقتراحات"));
        } finally { setSuggesting(false); }
    };

    const [testing, setTesting] = useState(false);
    const sendTest = async () => {
        setTesting(true);
        try {
            const { data } = await api.post("/admin/notifications/test");
            alert(`${tr("✅ تم إرسال الإشعار التجريبي إلى حسابك")}\n\nExpo: ${data?.push?.expo ?? 0}  •  Web: ${data?.push?.web ?? 0}`);
        } catch (e) {
            alert(e?.response?.data?.detail || tr("تعذر إرسال الإشعار التجريبي"));
        } finally { setTesting(false); }
    };

    return (
        <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="font-arabic font-black text-base text-[var(--text)]">{tr("إرسال إشعار جماعي")}</h3>
                </div>
                {result && (
                    <div className="bg-[var(--success)]/10 text-[var(--success)] rounded-xl p-3 text-sm font-arabic-body mb-3">
                        ✅ تم إرسال الإشعار إلى {result.sent} مستخدم ({result.target})
                    </div>
                )}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("العنوان")}</label>
                        <input data-testid="notif-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("🔥 عرض اليوم!")} />
                    </div>
                    <div>
                        <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("النص")}</label>
                        <textarea data-testid="notif-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={500} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("اكتشف صفقات حصرية على الإعلانات الجديدة!")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("رابط الفتح (Deep Link)")}</label>
                            <input data-testid="notif-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={300} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="/listing/abc123  •  /auctions  •  https://..." />
                            <p className="text-[10px] text-[var(--text-muted)] font-arabic-body mt-1">{tr("اتركه فارغاً ليُفتح التطبيق على الرئيسية")}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("صورة (اختياري)")}</label>
                            <input data-testid="notif-image" type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} maxLength={400} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="https://res.cloudinary.com/.../image.jpg" />
                            {form.image && <img src={form.image} alt="" className="mt-2 max-h-24 rounded-xl border border-[var(--border)]" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("الجمهور المستهدف")}</label>
                            <select data-testid="notif-target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]">
                                <option value="all">{tr("جميع المستخدمين")}</option>
                                <option value="verified">{tr("الموثقون فقط")}</option>
                                <option value="unverified">{tr("غير الموثقين")}</option>
                                <option value="country">{tr("حسب الدولة")}</option>
                                <option value="category">{tr("حسب التصنيف")}</option>
                                <option value="inactive">{tr("غير النشطين")}</option>
                            </select>
                        </div>
                        {form.target === "country" && (
                            <div>
                                <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("رمز الدولة")}</label>
                                <input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} maxLength={2} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="SA / AE / KW..." />
                            </div>
                        )}
                        {form.target === "category" && (
                            <div>
                                <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("التصنيف")}</label>
                                <input data-testid="notif-category" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="cars / electronics ..." />
                            </div>
                        )}
                        {form.target === "inactive" && (
                            <div>
                                <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1">{tr("غير نشطين منذ (أيام)")}</label>
                                <input data-testid="notif-inactive-days" type="number" min="1" max="365" value={form.inactive_days || 14} onChange={(e) => setForm({ ...form, inactive_days: parseInt(e.target.value || "14", 10) })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button data-testid="notif-send" onClick={send} disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                            <Bell className="w-4 h-4" /> {busy ? "جاري الإرسال..." : "إرسال للجميع"}
                        </button>
                        <button data-testid="notif-ai-suggest" onClick={suggest} disabled={suggesting} className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                            <Sparkles className="w-4 h-4" /> {suggesting ? "AI يفكر..." : "اقتراحات AI"}
                        </button>
                        <button data-testid="notif-test-btn" onClick={sendTest} disabled={testing} className="bg-[var(--success)] text-white px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50" title={tr("إرسال إشعار تجريبي لحسابك فقط")}>
                            <Bell className="w-4 h-4" /> {testing ? tr("جاري...") : tr("إشعار تجريبي")}
                        </button>
                        <div className="flex items-center gap-2 ms-auto">
                            <input
                                data-testid="notif-schedule-at"
                                type="datetime-local"
                                value={schedAt}
                                onChange={(e) => setSchedAt(e.target.value)}
                                className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-xs border border-[var(--border)] outline-none text-[var(--text)] font-arabic-body"
                            />
                            <button data-testid="notif-schedule-btn" onClick={scheduleSend} disabled={schedBusy} className="bg-amber-500 text-white px-4 py-2 rounded-full font-arabic font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
                                ⏰ {schedBusy ? tr("جاري...") : tr("جدولة")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 rounded-2xl p-4 border border-[var(--primary)]/30">
                    <h3 className="font-arabic font-black text-base text-[var(--text)] mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--primary)]" /> اقتراحات الذكاء الاصطناعي
                    </h3>
                    <div className="space-y-2">
                        {suggestions.map((s, i) => (
                            <div key={i} className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)]">
                                <div className="font-arabic font-bold text-sm text-[var(--text)] mb-1">{s.title}</div>
                                <div className="text-xs text-[var(--text-muted)] font-arabic-body mb-2">{s.body}</div>
                                <button onClick={() => setForm({ ...form, title: s.title, body: s.body })} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1 rounded-full text-xs font-bold font-arabic">{tr("استخدم هذا")}</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Scheduled broadcasts list (queue) */}
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-arabic font-black text-base text-[var(--text)] flex items-center gap-2">
                        ⏰ {tr("الإشعارات المجدولة")} <span className="text-xs text-[var(--text-muted)]">({schedules.length})</span>
                    </h3>
                    <button onClick={loadSchedules} className="text-xs text-[var(--primary)] font-arabic font-bold hover:underline">{tr("تحديث")}</button>
                </div>
                {schedules.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] font-arabic-body text-center py-3">{tr("لا توجد إشعارات مجدولة حالياً.")}</p>
                ) : (
                    <div className="space-y-2">
                        {schedules.map((s) => (
                            <div key={s.id} data-testid={`scheduled-${s.id}`} className="bg-[var(--surface-elevated)] rounded-xl p-3 border border-[var(--border)] flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{s.title}</div>
                                    <div className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-2 mt-0.5">{s.body}</div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-arabic-body">
                                        <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">⏰ {new Date(s.send_at).toLocaleString("ar")}</span>
                                        <span className="bg-[var(--primary)]/15 text-[var(--primary)] px-2 py-0.5 rounded-full font-bold">🎯 {s.target}</span>
                                    </div>
                                </div>
                                <button data-testid={`cancel-scheduled-${s.id}`} onClick={() => cancelSchedule(s.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg shrink-0" title={tr("إلغاء")}>✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AdsPanel() {
    const [ads, setAds] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const initForm = { title: "", image_url: "", link_url: "", placement: "home_top", active: true, country_code: "", ad_type: "image", iframe_url: "", iframe_width: 300, iframe_height: 250 };
    const [form, setForm] = useState(initForm);
    const reload = () => api.get("/admin/ads").then(({ data }) => setAds(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []))).catch(() => setAds([]));
    useEffect(() => { reload(); }, []);
    const create = async (e) => {
        e.preventDefault();
        const payload = { ...form, country_code: form.country_code || null };
        await api.post("/admin/ads", payload);
        setForm(initForm);
        setShowForm(false);
        reload();
    };
    const useTripBanner = () => {
        setForm({ ...form, ad_type: "iframe", iframe_url: "https://www.trip.com/partners/ad/DB16696577?Allianceid=8199633&SID=309959147&trip_sub1=alhraj", iframe_width: 300, iframe_height: 250, title: form.title || "Trip.com - حجز طيران وفنادق" });
    };
    const remove = async (id) => { if (!window.confirm(tr("حذف الإعلان؟"))) return; await api.delete(`/admin/ads/${id}`); reload(); };
    return (
        <div className="space-y-3">
            <button data-testid="new-ad-btn" onClick={() => setShowForm(!showForm)} className="bg-[var(--primary)] text-[var(--primary-fg)] px-4 py-2 rounded-full font-arabic font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" />{tr(" إضافة بنر إعلاني")}</button>
            {showForm && (
                <form onSubmit={create} className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] space-y-3 font-arabic-body">
                    {/* Type toggle */}
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setForm({ ...form, ad_type: "image" })} data-testid="ad-type-image" className={`flex-1 py-2 rounded-full text-xs font-arabic font-bold ${form.ad_type === "image" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("صورة بنر")}</button>
                        <button type="button" onClick={() => setForm({ ...form, ad_type: "iframe" })} data-testid="ad-type-iframe" className={`flex-1 py-2 rounded-full text-xs font-arabic font-bold ${form.ad_type === "iframe" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("بنر iframe (Trip.com)")}</button>
                    </div>
                    <input data-testid="ad-title-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={tr("عنوان الإعلان")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />

                    {form.ad_type === "image" ? (
                        <>
                            <input data-testid="ad-image-input" required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder={tr("رابط الصورة (https://...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
                            <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder={tr("رابط عند الضغط (اختياري)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={useTripBanner} data-testid="use-trip-default-btn" className="w-full bg-gradient-to-r from-[#287DFA] to-[#0F58D6] text-white py-2 rounded-xl text-xs font-arabic font-bold">{tr("استخدام بنر Trip.com الافتراضي")}</button>
                            <input data-testid="ad-iframe-url-input" required value={form.iframe_url} onChange={(e) => setForm({ ...form, iframe_url: e.target.value })} placeholder={tr("رابط iframe الكامل (https://trip.com/...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none ltr-text" dir="ltr" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" value={form.iframe_width} onChange={(e) => setForm({ ...form, iframe_width: parseInt(e.target.value) || 300 })} placeholder="العرض (px)" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
                                <input type="number" value={form.iframe_height} onChange={(e) => setForm({ ...form, iframe_height: parseInt(e.target.value) || 250 })} placeholder="الارتفاع (px)" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] font-arabic-body">{tr("💡 احصل على رابط البنر من لوحة Trip.com → Banner Creation → انسخ الـ src من iframe.")}</p>
                        </>
                    )}

                    <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none">
                        <option value="home_top">{tr("الرئيسية - أعلى")}</option>
                        <option value="home_middle">{tr("الرئيسية - وسط")}</option>
                        <option value="home_bottom">{tr("الرئيسية - أسفل")}</option>
                        <option value="listing_bottom">{tr("صفحة المنتج - أسفل")}</option>
                        <option value="sidebar">{tr("شريط جانبي")}</option>
                    </select>
                    <button type="submit" className="bg-[var(--success)] text-white px-4 py-2 rounded-full font-arabic font-bold text-sm">{tr("حفظ")}</button>
                </form>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ads.map((a) => (
                    <div key={a.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                        {a.ad_type === "iframe" ? (
                            <div className="w-full h-32 bg-gradient-to-br from-[#287DFA]/20 to-[#0F58D6]/30 flex items-center justify-center">
                                <span className="text-[var(--primary-hover)] font-arabic font-bold text-sm">🌐 iframe ({a.iframe_width}×{a.iframe_height})</span>
                            </div>
                        ) : (
                            <img src={a.image_url} alt={a.title} className="w-full h-32 object-cover" />
                        )}
                        <div className="p-3 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{a.title}</div>
                                <div className="text-xs text-[var(--text-muted)] font-arabic-body">{a.placement} • {a.ad_type || "image"}</div>
                                <div className="flex gap-3 mt-1 text-[11px] font-latin">
                                    <span className="text-[var(--text-muted)]">👁 {a.impressions || 0}</span>
                                    <span className="text-[var(--text-muted)]">🖱 {a.clicks || 0}</span>
                                    <span className="font-bold text-[var(--primary)]">CTR {a.ctr || 0}%</span>
                                </div>
                            </div>
                            <button data-testid={`del-ad-${a.id}`} onClick={() => remove(a.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GeoPanel() {
    const [countries, setCountries] = useState([]);
    const [selCountry, setSelCountry] = useState("SA");
    const [overrides, setOverrides] = useState(null);
    const [newCity, setNewCity] = useState({ name_ar: "", name_en: "", districts: "" });
    const [selCity, setSelCity] = useState("");
    const [newDistrict, setNewDistrict] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [c, o] = await Promise.all([
                api.get("/meta/countries"),
                api.get("/admin/geo/overrides"),
            ]);
            setCountries(c.data || []);
            const ov = (o.data || []).find((x) => x.country_code === selCountry);
            setOverrides(ov || null);
        } catch (_) {}
    }, [selCountry]);
    useEffect(() => { load(); }, [load]);

    const country = countries.find((c) => c.code === selCountry);
    const cityNames = (country?.cities || []).map((x) => x.name_ar);
    const districts = (country?.cities?.find((x) => x.name_ar === selCity)?.districts || []);

    const addCity = async () => {
        if (!newCity.name_ar.trim()) return;
        setBusy(true);
        try {
            await api.post("/admin/geo/cities/add", {
                country_code: selCountry,
                name_ar: newCity.name_ar.trim(),
                name_en: newCity.name_en.trim() || newCity.name_ar.trim(),
                districts: newCity.districts.split(",").map((s) => s.trim()).filter(Boolean),
            });
            setNewCity({ name_ar: "", name_en: "", districts: "" });
            await load();
        } catch (e) { alert(e.response?.data?.detail || tr("فشل الإضافة")); }
        finally { setBusy(false); }
    };

    const removeCity = async (name) => {
        if (!window.confirm(tr("حذف المدينة:") + " " + name + "؟")) return;
        try { await api.post("/admin/geo/cities/remove", { country_code: selCountry, name_ar: name }); await load(); }
        catch (e) { alert(e.response?.data?.detail || tr("فشل الحذف")); }
    };

    const addDistrict = async () => {
        if (!selCity || !newDistrict.trim()) return;
        try {
            await api.post("/admin/geo/districts/update", {
                country_code: selCountry, city_name_ar: selCity, add: [newDistrict.trim()],
            });
            setNewDistrict("");
            await load();
        } catch (e) { alert(e.response?.data?.detail || tr("فشل")); }
    };

    const removeDistrict = async (d) => {
        if (!window.confirm(tr("حذف الحي:") + " " + d + "؟")) return;
        try {
            await api.post("/admin/geo/districts/update", {
                country_code: selCountry, city_name_ar: selCity, remove: [d],
            });
            await load();
        } catch (e) { alert(e.response?.data?.detail || tr("فشل")); }
    };

    return (
        <div className="space-y-5">
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <h2 className="font-arabic font-black text-lg text-[var(--text)] mb-3 flex items-center gap-2">
                    🌍 {tr("إدارة المدن والأحياء")}
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-arabic-body mb-3">
                    {tr("التغييرات تظهر مباشرة لكل المستخدمين في خانة المدينة عند نشر إعلان جديد.")}
                </p>
                <div className="flex gap-2 flex-wrap mb-4">
                    {(countries || []).map((c) => (
                        <button
                            key={c.code}
                            data-testid={`geo-pick-${c.code}`}
                            onClick={() => { setSelCountry(c.code); setSelCity(""); }}
                            className={`rounded-full px-3 py-1.5 text-xs font-arabic font-bold border ${selCountry === c.code ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}
                        >
                            {c.flag} {c.name_ar} ({(c.cities || []).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Add city */}
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <h3 className="font-arabic font-black text-base text-[var(--text)] mb-3">➕ {tr("إضافة مدينة جديدة")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <input data-testid="new-city-ar" value={newCity.name_ar} onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })} placeholder={tr("الاسم بالعربية *")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" />
                    <input data-testid="new-city-en" value={newCity.name_en} onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })} placeholder={tr("English name (optional)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none" dir="ltr" />
                    <input data-testid="new-city-districts" value={newCity.districts} onChange={(e) => setNewCity({ ...newCity, districts: e.target.value })} placeholder={tr("الأحياء (مفصولة بفاصلة)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" />
                </div>
                <button data-testid="add-city-btn" onClick={addCity} disabled={busy || !newCity.name_ar.trim()} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 py-2 text-sm font-arabic font-bold disabled:opacity-50">
                    {busy ? "..." : tr("إضافة المدينة")}
                </button>
            </div>

            {/* List + manage districts */}
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <h3 className="font-arabic font-black text-base text-[var(--text)] mb-3">
                    📍 {tr("مدن")} {country?.name_ar} ({cityNames.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="max-h-[400px] overflow-y-auto border border-[var(--border)] rounded-xl">
                        {cityNames.map((cn) => (
                            <div key={cn} className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)]/50 last:border-0 ${selCity === cn ? "bg-[var(--primary)]/10" : ""}`}>
                                <button onClick={() => setSelCity(cn)} className="text-sm font-arabic-body text-[var(--text)] flex-1 text-start truncate">{cn}</button>
                                <button onClick={() => removeCity(cn)} className="text-red-500 text-xs px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">✕</button>
                            </div>
                        ))}
                    </div>
                    <div>
                        {selCity ? (
                            <div>
                                <div className="font-arabic font-bold text-sm text-[var(--text)] mb-2">{tr("أحياء")} {selCity} ({districts.length}):</div>
                                <div className="flex gap-2 mb-3">
                                    <input data-testid="new-district-input" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} placeholder={tr("اسم الحي الجديد")} className="flex-1 bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" onKeyDown={(e) => e.key === "Enter" && addDistrict()} />
                                    <button data-testid="add-district-btn" onClick={addDistrict} disabled={!newDistrict.trim()} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 py-2 text-xs font-arabic font-bold disabled:opacity-50">{tr("إضافة")}</button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-[280px] overflow-y-auto">
                                    {districts.map((d) => (
                                        <span key={d} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-2.5 py-1 text-xs font-arabic-body text-[var(--text)] flex items-center gap-1">
                                            {d}
                                            <button onClick={() => removeDistrict(d)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--text-muted)] font-arabic-body text-center py-8">{tr("اختر مدينة من اليسار لإدارة أحيائها")}</p>
                        )}
                    </div>
                </div>
            </div>

            {overrides && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 font-arabic-body">
                    ℹ️ {tr("لهذه الدولة overrides مخصصة:")} <code className="text-[10px]">add_cities={overrides.add_cities?.length || 0}, remove={overrides.remove_cities?.length || 0}</code>
                </div>
            )}
        </div>
    );
}

function LogsPanel() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get("/admin/logs", { params: { limit: 200 } }).then(({ data }) => setLogs(data || [])).finally(() => setLoading(false));
    }, []);
    if (loading) return <div className="p-6 text-center font-arabic">{tr("تحميل...")}</div>;
    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-arabic font-bold text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="col-span-3">{tr("الإجراء")}</div>
                <div className="col-span-3">{tr("الأدمن")}</div>
                <div className="col-span-3">{tr("الهدف")}</div>
                <div className="col-span-3">{tr("التاريخ")}</div>
            </div>
            {logs.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد سجلات")}</div>
            ) : logs.map((l) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b border-[var(--border)]/40 font-latin" data-testid={`admin-log-${l.id}`}>
                    <div className="col-span-3 font-arabic font-bold text-[var(--text)] truncate">{l.action}</div>
                    <div className="col-span-3 text-[var(--text-muted)] truncate">{l.admin_id?.slice(0, 8)}</div>
                    <div className="col-span-3 text-[var(--text-muted)] truncate">{l.target_id?.slice(0, 12) || "-"}</div>
                    <div className="col-span-3 text-[var(--text-muted)]">{new Date(l.ts).toLocaleString()}</div>
                </div>
            ))}
        </div>
    );
}

function BannedWordsPanel() {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState([]);
    const [filter, setFilter] = useState("");
    const [newWord, setNewWord] = useState("");
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/banned-words");
            setItems(data.items || []);
            setActive(data.active || []);
        } catch (_) {
            setItems([]); setActive([]);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const add = async (e) => {
        e?.preventDefault();
        const w = newWord.trim();
        if (!w) return;
        setBusy(true);
        try {
            await api.post("/admin/banned-words", { word: w });
            setNewWord("");
            await load();
        } catch (err) {
            alert(err?.response?.data?.detail || tr("تعذرت الإضافة"));
        } finally { setBusy(false); }
    };

    const remove = async (word) => {
        if (!window.confirm(`${tr("حذف الكلمة")}: ${word}؟`)) return;
        setBusy(true);
        try {
            await api.delete(`/admin/banned-words/${encodeURIComponent(word)}`);
            await load();
        } catch (_) { /* swallow */ }
        finally { setBusy(false); }
    };

    const filtered = items.filter((it) => {
        if (!filter) return true;
        return (it.word || "").toLowerCase().includes(filter.toLowerCase());
    });

    return (
        <div className="space-y-3" data-testid="banned-words-panel">
            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-arabic font-black text-lg text-[var(--text)] flex items-center gap-2">
                            <Flag className="w-4 h-4 text-red-500" /> {tr("الكلمات المحظورة")}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-0.5">
                            {tr("أي إعلان يحتوي هذه الكلمات يُحفَظ كـ «بانتظار المراجعة» تلقائياً")}
                        </p>
                    </div>
                    <div className="bg-[var(--primary)]/10 text-[var(--primary)] rounded-full px-3 py-1 text-xs font-bold font-latin">{active.length} {tr("نشطة")}</div>
                </div>
                <form onSubmit={add} className="flex gap-2 mb-3">
                    <input data-testid="bw-new" placeholder={tr("أضف كلمة محظورة جديدة...")} value={newWord} onChange={(e) => setNewWord(e.target.value)} maxLength={60} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
                    <button type="submit" disabled={busy || !newWord.trim()} data-testid="bw-add-btn" className="bg-[var(--primary)] text-[var(--primary-fg)] px-4 py-2 rounded-xl text-sm font-arabic font-bold disabled:opacity-50">{tr("إضافة")}</button>
                </form>
                <input data-testid="bw-filter" placeholder={tr("بحث في القائمة...")} value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
            </div>

            {loading ? (
                <div className="text-center font-arabic text-[var(--text-muted)] p-6">{tr("جاري التحميل...")}</div>
            ) : (
                <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-arabic font-bold text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                        <div className="col-span-7">{tr("الكلمة")}</div>
                        <div className="col-span-3">{tr("المصدر")}</div>
                        <div className="col-span-2 text-center">{tr("إجراء")}</div>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد نتائج")}</div>
                    ) : filtered.map((it) => (
                        <div key={it.word} data-testid={`bw-row-${it.word}`} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b border-[var(--border)]/40 items-center">
                            <div className="col-span-7 font-arabic font-bold text-[var(--text)]">{it.word}</div>
                            <div className="col-span-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${it.source === "admin" ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"}`}>
                                    {it.source === "admin" ? tr("أدمن") : tr("افتراضية")}
                                </span>
                            </div>
                            <div className="col-span-2 text-center">
                                <button data-testid={`bw-del-${it.word}`} onClick={() => remove(it.word)} disabled={busy} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-full disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ThemePanel() {
    const [theme, setTheme] = useState({});
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    useEffect(() => { api.get("/meta/theme").then(({ data }) => setTheme(data)); }, []);
    const save = async (e) => {
        e.preventDefault();
        setBusy(true); setMsg("");
        try {
            await api.post("/admin/theme", theme);
            setMsg(tr("تم الحفظ ✅ يرجى تحديث الصفحة لرؤية التغييرات"));
        } catch (_) { setMsg(tr("فشل الحفظ")); } finally { setBusy(false); }
    };
    return (
        <form onSubmit={save} className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4 max-w-2xl font-arabic-body">
            <h3 className="font-arabic font-bold text-lg text-[var(--text)]">{tr("تخصيص الهوية البصرية")}</h3>
            {msg && <div className="bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl p-3 text-sm">{msg}</div>}
            <ColorField label={tr("اللون الأساسي")} value={theme.primary_color} onChange={(v) => setTheme({ ...theme, primary_color: v })} />
            <ColorField
                label={tr("لون شريط التنقل السفلي (اختياري — الافتراضي نفس اللون الأساسي)")}
                value={theme.nav_color || theme.primary_color}
                onChange={(v) => setTheme({ ...theme, nav_color: v })}
            />
            <ColorField label={tr("اللون الثانوي")} value={theme.secondary_color} onChange={(v) => setTheme({ ...theme, secondary_color: v })} />
            <ColorField label={tr("لون التمييز")} value={theme.accent_color} onChange={(v) => setTheme({ ...theme, accent_color: v })} />
            <div>
                <label className="block text-sm font-bold mb-1 text-[var(--text)]">{tr("اسم الموقع")}</label>
                <input value={theme.site_name || ""} onChange={(e) => setTheme({ ...theme, site_name: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
            </div>
            <div>
                <label className="block text-sm font-bold mb-1 text-[var(--text)]">{tr("شعار رئيسي")}</label>
                <input value={theme.tagline_ar || ""} onChange={(e) => setTheme({ ...theme, tagline_ar: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
            </div>
            <button data-testid="save-theme-btn" disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{busy ? "جاري الحفظ..." : "حفظ"}</button>
        </form>
    );
}

function ColorField({ label, value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-bold mb-1 text-[var(--text)]">{label}</label>
            <div className="flex items-center gap-2">
                <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-12 h-10 rounded-xl border border-[var(--border)] cursor-pointer" />
                <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none font-mono" />
            </div>
        </div>
    );
}
