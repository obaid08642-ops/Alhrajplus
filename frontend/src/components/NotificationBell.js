import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, X, MessageCircle, Tag, Hammer, CheckCircle2, XCircle, Megaphone } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useChatSocket } from "@/lib/useChatSocket";
import { playNotificationSound } from "@/lib/notificationSound";

/**
 * Bell icon for the TopBar.
 *
 * - Polls /api/notifications every 60s (cheap, just an unread count).
 * - Refreshes immediately when a WS event fires (so chat messages bump the
 *   badge in real time without polling).
 * - Dropdown lists the latest 20 notifications with deep-links.
 */

const TYPE_ICONS = {
    new_message: { Icon: MessageCircle, color: "text-blue-500" },
    listing_offer: { Icon: Tag, color: "text-amber-500" },
    listing_offer_update: { Icon: CheckCircle2, color: "text-emerald-500" },
    listing_approved: { Icon: CheckCircle2, color: "text-emerald-500" },
    listing_rejected: { Icon: XCircle, color: "text-red-500" },
    price_drop: { Icon: Tag, color: "text-orange-500" },
    auction: { Icon: Hammer, color: "text-purple-500" },
    comment: { Icon: MessageCircle, color: "text-cyan-500" },
    comment_reply: { Icon: MessageCircle, color: "text-cyan-500" },
    search_alert: { Icon: Bell, color: "text-indigo-500" },
    saved_search: { Icon: Bell, color: "text-indigo-500" },
    new_follower: { Icon: Megaphone, color: "text-pink-500" },
    admin_broadcast: { Icon: Megaphone, color: "text-amber-500" },
};

function urlFor(n) {
    if (n?.data?.url) return n.data.url;
    switch (n?.type) {
        case "new_message": return n.data?.sender_id ? `/chat?to=${n.data.sender_id}` : "/chat";
        case "listing_approved":
        case "listing_rejected":
        case "price_drop":
        case "listing_offer":
        case "listing_offer_update":
        case "auction":
        case "comment":
        case "comment_reply": return n.data?.listing_id ? `/listing/${n.data.listing_id}#comments` : "/";
        case "search_alert":
        case "saved_search": return n.data?.query ? `/search?q=${encodeURIComponent(n.data.query)}` : "/search";
        case "new_follower": return n.data?.user_id ? `/seller/${n.data.user_id}` : "/profile";
        default: return "/";
    }
}

export default function NotificationBell() {
    const { user } = useAuth();
    const { lang } = useI18n();
    const locale = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "tr" ? "tr-TR" : "en-US";
    const direction = lang === "ar" ? "rtl" : "ltr";
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);
    const lastUnreadRef = useRef(null);
    const { subscribe } = useChatSocket();

    const fetchList = useCallback(async () => {
        if (!user || user === false) { setItems([]); setUnread(0); return; }
        setLoading(true);
        try {
            const { data } = await api.get("/notifications", { params: { limit: 20 } });
            const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
            const nextUnread = list.filter((n) => !n.read).length;
            // Ping the user when unread count goes UP — never on initial load
            // or when the user just marked some read.
            if (lastUnreadRef.current != null && nextUnread > lastUnreadRef.current) {
                try { playNotificationSound(); } catch (_) {}
            }
            lastUnreadRef.current = nextUnread;
            setItems(list);
            setUnread(nextUnread);
        } catch (_) { /* keep previous state */ }
        finally { setLoading(false); }
    }, [user]);

    // Initial + periodic
    useEffect(() => {
        if (!user) return;
        fetchList();
        const id = setInterval(fetchList, 60000);
        return () => clearInterval(id);
    }, [user, fetchList]);

    // Real-time refresh on WS message events
    useEffect(() => {
        if (!user) return;
        const refresh = () => fetchList();
        const offMessage = subscribe("message", refresh);
        const offOffer = subscribe("listing_offer", refresh);
        const offOfferUpdate = subscribe("listing_offer_update", refresh);
        return () => { offMessage?.(); offOffer?.(); offOfferUpdate?.(); };
    }, [user, subscribe, fetchList]);

    // Click outside to close
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const markAllRead = async () => {
        try {
            await api.post("/notifications/read-all");
            setItems((xs) => xs.map((n) => ({ ...n, read: true })));
            setUnread(0);
        } catch (_) {}
    };

    const markOneRead = async (id) => {
        setItems((xs) => xs.map((n) => n.id === id ? { ...n, read: true } : n));
        setUnread((u) => Math.max(0, u - 1));
        try { await api.post(`/notifications/${id}/read`); } catch (_) {}
    };

    if (!user || user === false) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                data-testid="notif-bell-btn"
                onClick={() => setOpen((o) => !o)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 border border-white/25 dark:border-white/15 flex items-center justify-center transition-all backdrop-blur"
                aria-label={tr("الإشعارات")}
            >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                {unread > 0 && (
                    <span data-testid="notif-badge" className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-white/40">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div data-testid="notif-dropdown" className="absolute top-12 end-0 w-[92vw] sm:w-96 max-h-[70vh] bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] z-50 flex flex-col" dir={direction}>
                    <div className="flex items-center justify-between gap-2 p-3 border-b border-[var(--border)]">
                        <h3 className="font-arabic font-bold text-sm text-[var(--text)] flex-1">{tr("الإشعارات")}</h3>
                        {unread > 0 && (
                            <button data-testid="notif-mark-all" onClick={markAllRead} className="text-[11px] text-[var(--primary)] hover:underline font-bold">
                                {tr("تعليم الكل كمقروء")}
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: "contain" }}>
                        {loading && items.length === 0 ? (
                            <div className="p-6 text-center text-xs text-[var(--text-muted)]">{tr("جاري التحميل...")}</div>
                        ) : items.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)] font-arabic-body text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                {tr("لا توجد إشعارات بعد")}
                            </div>
                        ) : items.map((n) => {
                            const meta = TYPE_ICONS[n.type] || { Icon: Bell, color: "text-[var(--primary)]" };
                            const Icon = meta.Icon;
                            return (
                                <Link
                                    key={n.id}
                                    to={urlFor(n)}
                                    onClick={() => { setOpen(false); if (!n.read) markOneRead(n.id); }}
                                    data-testid={`notif-item-${n.id}`}
                                    className={`flex items-start gap-3 p-3 hover:bg-[var(--surface-elevated)] border-b border-[var(--border)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}
                                >
                                    <div className={`w-9 h-9 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center shrink-0 ${meta.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{n.title}</div>
                                        {n.body && <div className="text-xs text-[var(--text-muted)] font-arabic-body line-clamp-2 mt-0.5">{n.body}</div>}
                                        <div className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(n.created_at || n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</div>
                                    </div>
                                    {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 shrink-0" />}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
