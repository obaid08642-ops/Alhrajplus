import { Link, useLocation } from "react-router-dom";
import { Home, Search, Bell, MessageCircle, Menu } from "lucide-react";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * BottomNav — Floating glass-pill design inspired by Haraj original app.
 * - 5 items: الرئيسية (Home), الإشعارات (Notifications), ابحث (Search), محادثة (Chat), المزيد (More)
 * - Glassmorphic capsule with backdrop-blur
 * - Active item: filled rounded baby-blue background highlight
 * - Inactive items: pale baby-blue icons
 */
export default function BottomNav() {
    const { pathname } = useLocation();
    const { t } = useI18n();
    const { user } = useAuth();
    const [unread, setUnread] = useState(0);
    const [notifications, setNotifications] = useState(0);

    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const { data } = await api.get("/chat/conversations");
                const total = (data || []).reduce((s, c) => s + (c.unread || 0), 0);
                setUnread(total);
            } catch (_) {}
        };
        const fetchNotifs = async () => {
            try {
                const { data } = await api.get("/notifications/unread-count").catch(() => ({ data: { count: 0 } }));
                setNotifications(data?.count || 0);
            } catch (_) {}
        };
        fetchUnread();
        fetchNotifs();
        const id = setInterval(() => { fetchUnread(); fetchNotifs(); }, 15000);
        return () => clearInterval(id);
    }, [user]);

    const items = [
        { to: "/", icon: Home, label: tr("الرئيسية"), key: "home" },
        { to: "/notifications", icon: Bell, label: tr("الإشعارات"), key: "notif", badge: notifications },
        { to: "/search", icon: Search, label: tr("ابحث"), key: "search" },
        { to: "/chat", icon: MessageCircle, label: tr("محادثة"), key: "messages", badge: unread },
        { to: "/profile", icon: Menu, label: tr("المزيد"), key: "more" },
    ];
    const isActive = (to) => to === "/" ? pathname === "/" : pathname.startsWith(to);

    return (
        <nav data-testid="bottom-nav-pill" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-1.5rem)] sm:w-auto" dir="rtl">
            <div className="flex items-center justify-around bg-white/75 dark:bg-[#152244]/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(15,27,58,0.35)] border border-white/60 dark:border-white/10 px-2 py-2">
                {items.map(({ to, icon: Icon, label, key, badge }) => {
                    const active = isActive(to);
                    return (
                        <Link
                            key={key}
                            to={to}
                            data-testid={`nav-${key}`}
                            aria-label={label}
                            className={`relative flex flex-col items-center justify-center gap-0.5 px-3 sm:px-4 py-1.5 rounded-2xl transition-all duration-300 ${
                                active
                                    ? "bg-[#4FB6E6]/20 dark:bg-[#4FB6E6]/30"
                                    : "hover:bg-white/40 dark:hover:bg-white/5"
                            }`}
                        >
                            <div className="relative">
                                <Icon
                                    className={`w-6 h-6 transition-all ${active ? "text-[#1F7BBF] dark:text-[#6CC2EE] scale-110" : "text-[#88B8DC] dark:text-[#7AA9D4]"}`}
                                    strokeWidth={active ? 2.6 : 2}
                                    fill={active ? "currentColor" : "none"}
                                />
                                {badge > 0 && (
                                    <span data-testid={`nav-badge-${key}`} className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none ring-2 ring-white dark:ring-[#152244]">
                                        {badge > 9 ? "9+" : badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-arabic font-bold leading-tight ${active ? "text-[#1F7BBF] dark:text-[#6CC2EE]" : "text-[#7A9CBA] dark:text-[#8AA9C8]"}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
