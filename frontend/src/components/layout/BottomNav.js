import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function BottomNav() {
    const { pathname } = useLocation();
    const { t } = useI18n();
    const { user } = useAuth();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const { data } = await api.get("/chat/conversations");
                const total = data.reduce((s, c) => s + (c.unread || 0), 0);
                setUnread(total);
            } catch (_) {}
        };
        fetchUnread();
        const id = setInterval(fetchUnread, 15000);
        return () => clearInterval(id);
    }, [user]);

    const items = [
        { to: "/", icon: Home, label: t("nav_home"), key: "home" },
        { to: "/search", icon: Search, label: t("nav_search"), key: "search" },
        { to: "/post", icon: Plus, label: t("nav_post"), key: "post", primary: true },
        { to: "/chat", icon: MessageCircle, label: t("nav_messages"), key: "messages", badge: unread },
        { to: "/profile", icon: User, label: t("nav_profile"), key: "profile" },
    ];
    const isActive = (to) => to === "/" ? pathname === "/" : pathname.startsWith(to);
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/85 backdrop-blur-xl border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto flex items-center justify-around py-1.5 sm:py-2 px-2">
                {items.map(({ to, icon: Icon, label, key, primary, badge }) => {
                    const active = isActive(to);
                    return (
                        <Link
                            key={key}
                            to={to}
                            data-testid={`nav-${key}`}
                            className={`relative flex flex-col items-center gap-0.5 px-2 sm:px-3 py-2 rounded-2xl transition-all ${
                                primary
                                    ? "bg-[var(--primary)] text-[var(--primary-fg)] -mt-7 w-12 h-12 sm:w-14 sm:h-14 justify-center shadow-lg shadow-[var(--primary)]/40 hover:bg-[var(--primary-hover)]"
                                    : active
                                        ? "text-[var(--primary)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                            }`}
                        >
                            <div className="relative">
                                <Icon className={primary ? "w-5 h-5 sm:w-6 sm:h-6" : "w-5 h-5"} strokeWidth={primary ? 2.5 : 2} />
                                {badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[var(--danger)] text-white text-[9px] rounded-full flex items-center justify-center font-bold">{badge > 99 ? "99+" : badge}</span>
                                )}
                            </div>
                            {!primary && <span className="text-[10px] font-arabic font-bold">{label}</span>}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
