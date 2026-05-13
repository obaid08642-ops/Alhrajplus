import { Link, useLocation } from "react-router-dom";
import { Home, Film, MessageCircle, Menu, Plus } from "lucide-react";
import { useI18n, tr } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * BottomNav — Floating glass-pill with center FAB.
 * - 4 side items: الرئيسية / ستوري / محادثة / المزيد
 * - Center: Floating "+" hologram add-listing FAB in baby-blue with animated gradient + pulse rings
 */
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
                const total = (data || []).reduce((s, c) => s + (c.unread || 0), 0);
                setUnread(total);
            } catch (_) {}
        };
        fetchUnread();
        const id = setInterval(fetchUnread, 15000);
        return () => clearInterval(id);
    }, [user]);

    const isActive = (to) => to === "/" ? pathname === "/" : pathname.startsWith(to);

    const SideItem = ({ to, icon: Icon, label, navKey: k, badge }) => {
        const active = isActive(to);
        return (
            <Link
                to={to}
                data-testid={`nav-${k}`}
                aria-label={label}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 sm:px-4 py-1.5 rounded-2xl transition-all duration-300 ${
                    active ? "bg-[#4FB6E6]/20 dark:bg-[#4FB6E6]/30" : "hover:bg-white/40 dark:hover:bg-white/5"
                }`}
            >
                <div className="relative">
                    <Icon
                        className={`w-6 h-6 transition-all ${active ? "text-[#1F7BBF] dark:text-[#6CC2EE] scale-110" : "text-[#88B8DC] dark:text-[#7AA9D4]"}`}
                        strokeWidth={active ? 2.6 : 2}
                        fill={active ? "currentColor" : "none"}
                    />
                    {badge > 0 && (
                        <span data-testid={`nav-badge-${k}`} className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none ring-2 ring-white dark:ring-[#152244]">
                            {badge > 9 ? "9+" : badge}
                        </span>
                    )}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-arabic font-bold leading-tight ${active ? "text-[#1F7BBF] dark:text-[#6CC2EE]" : "text-[#7A9CBA] dark:text-[#8AA9C8]"}`}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <>
            {/* Floating "+" Hologram FAB (Add Listing) */}
            <Link
                to="/post"
                data-testid="nav-post-fab"
                aria-label={tr("نشر إعلان")}
                className="fixed left-1/2 -translate-x-1/2 z-[51] group"
                style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
            >
                {/* Hologram pulse rings */}
                <span className="absolute inset-0 rounded-full bg-[#4FB6E6]/40 animate-ping pointer-events-none"></span>
                <span className="absolute inset-0 rounded-full bg-[#4FB6E6]/20 animate-pulse pointer-events-none" style={{ animationDuration: "2s" }}></span>
                {/* Holographic gradient core */}
                <span className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_32px_-4px_rgba(79,182,230,0.7)] overflow-hidden bg-gradient-to-tr from-[#4FB6E6] via-[#7CCAEC] to-[#3AA9DD] group-hover:scale-110 group-active:scale-95 transition-all duration-300 border-2 border-white/60 dark:border-white/30">
                    {/* Hologram shimmer overlay */}
                    <span className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"></span>
                    <span className="absolute -top-2 -left-2 w-6 h-6 bg-white/50 blur-lg rounded-full"></span>
                    {/* Animated rotating border */}
                    <span className="absolute inset-0.5 rounded-full bg-conic-gradient pointer-events-none" style={{ background: "conic-gradient(from 0deg, rgba(255,255,255,0.6), transparent 50%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0.6))", animation: "spin 3s linear infinite", maskImage: "radial-gradient(circle, transparent 60%, black 70%)" }}></span>
                    <Plus className="w-7 h-7 text-white relative z-10 drop-shadow-md" strokeWidth={3} />
                </span>
            </Link>

            <nav data-testid="bottom-nav-pill" className="fixed left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-1rem)] sm:w-auto" style={{ bottom: "env(safe-area-inset-bottom, 0px)" }} dir="rtl">
                <div className="flex items-center justify-around bg-white/75 dark:bg-[#152244]/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(15,27,58,0.35)] border border-white/60 dark:border-white/10 px-2 py-2">
                    <SideItem to="/" icon={Home} label={tr("الرئيسية")} navKey="home" />
                    <SideItem to="/reels" icon={Film} label={tr("ستوري")} navKey="reels" />

                    {/* Center spacer for FAB */}
                    <div className="w-14 h-1 shrink-0" aria-hidden="true"></div>

                    <SideItem to="/chat" icon={MessageCircle} label={tr("محادثة")} navKey="messages" badge={unread} />
                    <SideItem to="/profile" icon={Menu} label={tr("المزيد")} navKey="more" />
                </div>
            </nav>
        </>
    );
}
