import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, FileText, Flag, Palette, Image as ImageIcon, BarChart3, Trash2, Check, X, Plus, Edit2, Bell, Sparkles, DollarSign, Search as SearchIcon } from "lucide-react";
import { tr } from "@/contexts/I18nContext";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const nav = useNavigate();
    const [tab, setTab] = useState("stats");

    useEffect(() => {
        if (!loading && (!user || user.role !== "admin")) nav("/");
    }, [user, loading, nav]);

    if (loading || !user) return <div className="p-10 text-center font-arabic">{tr("جاري التحميل...")}</div>;
    if (user.role !== "admin") return null;

    const tabs = [
        { key: "stats", label: tr("الإحصائيات"), icon: BarChart3 },
        { key: "moderation", label: tr("مراجعة الإعلانات"), icon: Shield },
        { key: "users", label: tr("المستخدمون"), icon: Users },
        { key: "reports", label: tr("البلاغات"), icon: Flag },
        { key: "finance", label: tr("المالية"), icon: DollarSign },
        { key: "seo", label: tr("SEO"), icon: SearchIcon },
        { key: "notifications", label: tr("الإشعارات"), icon: Bell },
        { key: "ads", label: tr("الإعلانات"), icon: ImageIcon },
        { key: "logs", label: tr("سجلات الأدمن"), icon: Shield },
        { key: "theme", label: tr("الهوية البصرية"), icon: Palette },
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
            {tab === "moderation" && <ModerationPanel />}
            {tab === "users" && <UsersPanel />}
            {tab === "reports" && <ReportsPanel />}
            {tab === "finance" && <FinancePanel />}
            {tab === "seo" && <SEOPanel />}
            {tab === "notifications" && <NotificationsPanel />}
            {tab === "ads" && <AdsPanel />}
            {tab === "logs" && <LogsPanel />}
            {tab === "theme" && <ThemePanel />}
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
    const reload = () => api.get("/admin/listings/pending").then(({ data }) => setItems(data));
    useEffect(() => { reload(); }, []);
    const approve = async (id) => { await api.post(`/admin/listings/${id}/approve`); reload(); };
    const reject = async (id) => { await api.post(`/admin/listings/${id}/reject`); reload(); };
    if (items.length === 0) return <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)] text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات بانتظار المراجعة ✅")}</div>;
    return (
        <div className="space-y-3">
            {items.map((l) => (
                <div key={l.id} className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {l.images?.[0] && <img src={l.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover" />}
                    <div className="flex-1">
                        <Link to={`/listing/${l.id}`} target="_blank" className="font-arabic font-bold text-sm text-[var(--text)] hover:text-[var(--primary)]">{l.title}</Link>
                        <p className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-2">{l.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <button data-testid={`approve-${l.id}`} onClick={() => approve(l.id)} className="bg-[var(--success)] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" />{tr(" موافقة")}</button>
                        <button data-testid={`reject-${l.id}`} onClick={() => reject(l.id)} className="bg-[var(--danger)] text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" />{tr(" رفض")}</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function UsersPanel() {
    const [users, setUsers] = useState([]);
    const reload = () => api.get("/admin/users").then(({ data }) => setUsers(data));
    useEffect(() => { reload(); }, []);
    return (
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
                        <tr key={u.id} className="border-t border-[var(--border)]">
                            <td className="p-3 font-bold text-[var(--text)]">{u.name}</td>
                            <td className="p-3 text-[var(--text-muted)] hidden sm:table-cell text-xs">{u.email}</td>
                            <td className="p-3 text-[var(--text-muted)]">{u.country_code}</td>
                            <td className="p-3">
                                {u.banned ? <span className="text-red-500 font-bold">{tr("محظور")}</span> : u.verified ? <span className="text-[var(--success)] font-bold">{tr("موثّق")}</span> : <span className="text-[var(--text-muted)]">{tr("عادي")}</span>}
                            </td>
                            <td className="p-3 flex gap-1">
                                {!u.verified && <button onClick={async () => { await api.post(`/admin/users/${u.id}/verify`); reload(); }} className="bg-[var(--primary)]/15 text-[var(--primary)] px-2 py-1 rounded-full text-xs font-bold">{tr("توثيق")}</button>}
                                {u.banned ? (
                                    <button onClick={async () => { await api.post(`/admin/users/${u.id}/unban`); reload(); }} className="bg-[var(--success)]/15 text-[var(--success)] px-2 py-1 rounded-full text-xs font-bold">{tr("إلغاء حظر")}</button>
                                ) : (
                                    <button onClick={async () => { await api.post(`/admin/users/${u.id}/ban`); reload(); }} className="bg-red-500/15 text-red-500 px-2 py-1 rounded-full text-xs font-bold">{tr("حظر")}</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ReportsPanel() {
    const [reports, setReports] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const reload = () => api.get("/admin/reports").then(({ data }) => setReports(data));
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
    const [form, setForm] = useState({ title: "", body: "", target: "all", country_code: "", category: "", inactive_days: 14 });
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [suggesting, setSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const send = async () => {
        if (!form.title || !form.body) { alert(tr("املأ العنوان والنص")); return; }
        if (!window.confirm(`سيتم إرسال هذا الإشعار للمستخدمين (${form.target}). متابعة؟`)) return;
        setBusy(true);
        try {
            const { data } = await api.post("/admin/notifications/broadcast", form);
            setResult(data);
            setForm({ title: "", body: "", target: "all", country_code: "", category: "", inactive_days: 14 });
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
                    <div className="flex gap-2">
                        <button data-testid="notif-send" onClick={send} disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                            <Bell className="w-4 h-4" /> {busy ? "جاري الإرسال..." : "إرسال للجميع"}
                        </button>
                        <button data-testid="notif-ai-suggest" onClick={suggest} disabled={suggesting} className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                            <Sparkles className="w-4 h-4" /> {suggesting ? "AI يفكر..." : "اقتراحات AI"}
                        </button>
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
        </div>
    );
}

function AdsPanel() {
    const [ads, setAds] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const initForm = { title: "", image_url: "", link_url: "", placement: "home_top", active: true, country_code: "", ad_type: "image", iframe_url: "", iframe_width: 300, iframe_height: 250 };
    const [form, setForm] = useState(initForm);
    const reload = () => api.get("/admin/ads").then(({ data }) => setAds(data));
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
