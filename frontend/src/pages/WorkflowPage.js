import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import { useCountry } from "@/contexts/CountryContext";
import { LifeBuoy, Plus, RefreshCw, Send, ShoppingBag } from "lucide-react";

export default function WorkflowPage({ kind = "buy" }) {
  const { t } = useI18n();
  const { country } = useCountry();
  const isBuy = kind === "buy";
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(isBuy ? { title: "", category: "", description: "", budget_min: "", budget_max: "", city: "" } : { subject: "", message: "", category: "general", priority: "normal" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    try { const r = await api.get(isBuy ? "/buy-requests/mine" : "/support/tickets", { params: { country_code: country } }); setRows(Array.isArray(r.data) ? r.data : []); }
    catch (e) { setRows([]); setMessage(e?.response?.data?.detail || t("تعذر تحميل البيانات")); }
    finally { setLoading(false); }
  }, [country, isBuy, t]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMessage("");
    try { await api.post(isBuy ? "/buy-requests" : "/support/tickets", { ...form, ...(isBuy ? { country_code: country, budget_min: form.budget_min === "" ? null : Number(form.budget_min), budget_max: form.budget_max === "" ? null : Number(form.budget_max) } : {}) }); setMessage(t("تم الحفظ بنجاح")); setForm(isBuy ? { title: "", category: "", description: "", budget_min: "", budget_max: "", city: "" } : { subject: "", message: "", category: "general", priority: "normal" }); await load(); }
    catch (e2) { setMessage(e2?.response?.data?.detail || t("تعذر حفظ البيانات")); }
    finally { setBusy(false); }
  };
  const set = (key, value) => setForm((x) => ({ ...x, [key]: value }));
  return <main className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-28">
    <div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)] flex items-center justify-center">{isBuy ? <ShoppingBag className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}</div><div><h1 className="font-arabic font-black text-xl sm:text-2xl text-[var(--text)]">{t(isBuy ? "طلبات الشراء" : "الدعم والمساعدة")}</h1><p className="text-xs text-[var(--text-muted)]">{t(isBuy ? "اطلب منتجًا أو خدمة من البائعين في الدولة المختارة" : "أنشئ تذكرة وتابع حالتها مع فريق الدعم")}</p></div></div><button onClick={load} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button></div>
    {message && <div className="mb-4 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-arabic-body">{message}</div>}
    <form onSubmit={submit} className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 sm:p-6 mb-6 space-y-3">
      {isBuy ? <><input required minLength={3} value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("عنوان الطلب")} className="field" /><div className="grid sm:grid-cols-2 gap-3"><input required value={form.category} onChange={e => set("category", e.target.value)} placeholder={t("الفئة")} className="field" /><input value={form.city} onChange={e => set("city", e.target.value)} placeholder={t("المدينة")} className="field" /></div><div className="grid sm:grid-cols-2 gap-3"><input type="number" min="0" value={form.budget_min} onChange={e => set("budget_min", e.target.value)} placeholder={t("الميزانية من")} className="field" /><input type="number" min="0" value={form.budget_max} onChange={e => set("budget_max", e.target.value)} placeholder={t("الميزانية إلى")} className="field" /></div><textarea required value={form.description} onChange={e => set("description", e.target.value)} placeholder={t("وصف الطلب")} className="field min-h-28" /></> : <><input required minLength={3} value={form.subject} onChange={e => set("subject", e.target.value)} placeholder={t("موضوع التذكرة")} className="field" /><div className="grid sm:grid-cols-2 gap-3"><select value={form.category} onChange={e => set("category", e.target.value)} className="field"><option value="general">{t("عام")}</option><option value="account">{t("الحساب")}</option><option value="listing">{t("إعلان")}</option><option value="payment">{t("الدفع")}</option><option value="report">{t("بلاغ")}</option></select><select value={form.priority} onChange={e => set("priority", e.target.value)} className="field"><option value="normal">{t("عادي")}</option><option value="high">{t("مرتفع")}</option><option value="urgent">{t("عاجل")}</option></select></div><textarea required value={form.message} onChange={e => set("message", e.target.value)} placeholder={t("اكتب رسالتك")} className="field min-h-28" /></>}
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 font-arabic font-bold disabled:opacity-50"><Send className="w-4 h-4" />{busy ? t("جاري الحفظ...") : t(isBuy ? "نشر طلب الشراء" : "إرسال التذكرة")}</button>
    </form>
    <div className="space-y-3">{!loading && rows.length === 0 && <div className="text-center py-10 text-[var(--text-muted)] font-arabic-body">{t("لا توجد بيانات بعد")}</div>}{rows.map((row) => <article key={row.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-arabic font-bold text-[var(--text)]">{row.title || row.subject}</h2><p className="text-sm text-[var(--text-muted)] mt-1">{row.description || row.message}</p></div><span className="text-xs rounded-full px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)]">{row.status}</span></div><div className="mt-3 text-xs text-[var(--text-muted)]">{row.country_code || row.category || ""} · {row.created_at ? new Date(row.created_at).toLocaleString() : ""}</div></article>)}</div>
  </main>;
}
