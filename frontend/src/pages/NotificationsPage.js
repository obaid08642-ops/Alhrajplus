import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, CheckCheck, MessageCircle, Tag, Hammer, CheckCircle2, XCircle, Megaphone } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useChatSocket } from "@/lib/useChatSocket";

const ICONS = { new_message: MessageCircle, listing_offer: Tag, listing_offer_update: CheckCircle2, listing_approved: CheckCircle2, listing_rejected: XCircle, price_drop: Tag, auction: Hammer, admin_broadcast: Megaphone };
const urlFor = (n) => {
    const d = n?.data || {};
    if (d.url) return d.url;
    const listingId = d.listing_id || d.entity_id;
    if (n?.type === "new_message" || n?.type === "chat") {
        const sender = d.sender_id || d.user_id;
        return sender ? `/chat?to=${encodeURIComponent(sender)}${listingId ? `&listing=${encodeURIComponent(listingId)}` : ""}` : "/chat";
    }
    if (["comment", "comment_reply"].includes(n?.type) && listingId) return `/listing/${encodeURIComponent(listingId)}#comments`;
    if (["search_alert", "saved_search"].includes(n?.type)) return `/search?q=${encodeURIComponent(d.query || d.search_query || "")}`;
    if (n?.type === "new_follower") return d.user_id ? `/seller/${encodeURIComponent(d.user_id)}` : "/profile";
    if (n?.type === "auction" && listingId) return `/auctions?openBidFor=${encodeURIComponent(listingId)}`;
    return listingId ? `/listing/${encodeURIComponent(listingId)}` : "/notifications";
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const { lang } = useI18n();
    const { subscribe } = useChatSocket();
    const locale = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "tr" ? "tr-TR" : "en-US";
    const direction = lang === "ar" ? "rtl" : "ltr";
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => { if (!user) return; setLoading(true); try { const { data } = await api.get("/notifications", { params: { limit: 100 } }); setItems(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])); } catch (_) { setItems([]); } finally { setLoading(false); } }, [user]);
    useEffect(() => { load(); const off = subscribe("message", load); const offOffer = subscribe("listing_offer", load); return () => { off?.(); offOffer?.(); }; }, [load, subscribe]);
    const markOne = async (id) => { setItems((xs) => xs.map((n) => n.id === id ? { ...n, read: true } : n)); try { await api.post(`/notifications/${id}/read`); } catch (_) {} };
    const markAll = async () => { try { await api.post("/notifications/read-all"); setItems((xs) => xs.map((n) => ({ ...n, read: true }))); } catch (_) {} };
    if (!user) return <main className="max-w-3xl mx-auto px-4 py-16 text-center font-arabic-body">{tr("سجل الدخول لعرض الإشعارات")}</main>;
    return <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-24" dir={direction} data-testid="notifications-page"><div className="flex items-center justify-between mb-5"><div><h1 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2"><Bell className="w-6 h-6 text-[var(--primary)]" />{tr("الإشعارات")}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("رسائل فورية، عروض، تحديثات الإعلانات والتنبيهات المهمة")}</p></div>{items.some((n) => !n.read) && <button onClick={markAll} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-arabic font-bold flex items-center gap-1"><CheckCheck className="w-4 h-4" />{tr("تعليم الكل كمقروء")}</button>}</div>{loading ? <div className="py-16 text-center text-[var(--text-muted)] font-arabic-body">{tr("جاري التحميل...")}</div> : items.length === 0 ? <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] font-arabic-body"><Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />{tr("لا توجد إشعارات بعد")}</div> : <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">{items.map((n) => { const Icon = ICONS[n.type] || Bell; return <Link key={n.id} to={urlFor(n)} onClick={() => !n.read && markOne(n.id)} className={`flex gap-3 p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-elevated)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}><div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center shrink-0 text-[var(--primary)]"><Icon className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-arabic font-bold text-sm text-[var(--text)] truncate">{n.title}</h2>{!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}</div>{n.body && <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{n.body}</p>}<time className="block text-[10px] text-[var(--text-muted)] mt-2">{new Date(n.created_at || n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</time></div>{!n.read && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}</Link>; })}</div>}</main>;
}
