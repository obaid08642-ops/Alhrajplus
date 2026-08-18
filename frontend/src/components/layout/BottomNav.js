import { Link, useLocation } from "react-router-dom";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { tr } from "@/contexts/I18nContext";

/**
 * BottomNav — web counterpart of the mobile FloatingTabBar.
 * The surface uses --nav-bg, which defaults to the primary brand color and
 * can be overridden independently from the admin visual-identity panel.
 */
export default function BottomNav() {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const [unread, setUnread] = useState(0);
    const [aiOpen, setAiOpen] = useState(false);

    useEffect(() => {
        const update = () => setAiOpen(document.body.classList.contains("ai-panel-open"));
        update();
        const obs = new MutationObserver(update);
        obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!user) {
            setUnread(0);
            return undefined;
        }
        const fetchUnread = async () => {
            try {
                const { data } = await api.get("/chat/conversations");
                setUnread((data || []).reduce((sum, conversation) => sum + (conversation.unread || 0), 0));
            } catch (_) {}
        };
        fetchUnread();
        const id = setInterval(fetchUnread, 15000);
        return () => clearInterval(id);
    }, [user]);

    const onReels = pathname.startsWith("/reels");
    const onListing = /^\/listing\/[^/]+/.test(pathname);
    const onAuction = /^\/auctions?\/[^/]+/.test(pathname);
    if (onReels || onListing || onAuction || aiOpen) return null;

    const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
    const SideItem = ({ to, icon: Icon, label, navKey: key, badge }) => {
        const active = isActive(to);
        return (
            <Link
                to={to}
                data-testid={`nav-${key}`}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 active:scale-95"
            >
                <div className="relative">
                    <Icon
                        className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                        style={{ color: active ? "var(--nav-fg)" : "var(--nav-inactive-fg)" }}
                        strokeWidth={active ? 2.8 : 2}
                        fill={active ? "currentColor" : "none"}
                    />
                    {badge > 0 && (
                        <span data-testid={`nav-badge-${key}`} className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--nav-bg)]">
                            {badge > 9 ? "9+" : badge}
                        </span>
                    )}
                </div>
                <span className="font-arabic text-[9.5px] font-bold leading-tight sm:text-[10px]" style={{ color: active ? "var(--nav-fg)" : "var(--nav-inactive-fg)" }}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <nav data-testid="bottom-nav-pill" className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-xl" dir="rtl">
            <div
                className="relative flex h-[52px] items-center justify-around overflow-visible px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(15,27,58,0.35)]"
                style={{ backgroundColor: "var(--nav-bg)", borderTop: "1px solid color-mix(in srgb, var(--nav-fg) 26%, transparent)" }}
            >
                {/* Mobile parity: a circular transparent notch separates the FAB from the bar. */}
                <span aria-hidden="true" className="absolute left-1/2 top-0 h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: "var(--bg)" }} />

                <SideItem to="/" icon={Home} label={tr("الرئيسية")} navKey="home" />
                <SideItem to="/reels" icon={Film} label={tr("قصص")} navKey="reels" />
                <div className="relative z-0 w-16 shrink-0" aria-hidden="true" />
                <SideItem to="/chat" icon={MessageCircle} label={tr("رسائلي")} navKey="messages" badge={unread} />
                <SideItem to="/profile" icon={User} label={tr("حسابي")} navKey="more" />

                <Link
                    to="/post"
                    data-testid="nav-post-fab"
                    aria-label={tr("نشر إعلان")}
                    className="group absolute left-1/2 top-0 z-20 flex h-[74px] w-[52px] -translate-x-1/2 -translate-y-[58%] flex-col items-center justify-center rounded-full border-2 border-[var(--primary-fg)]/70 bg-[var(--primary)] px-1 shadow-[0_8px_24px_-4px_var(--primary)] transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                    <span className="absolute inset-[-8px] rounded-full border-2 border-[var(--primary)]/35 opacity-70" />
                    <Plus className="relative z-10 h-6 w-6 text-[var(--primary-fg)]" strokeWidth={3.2} />
                    <span className="relative z-10 mt-0.5 whitespace-nowrap font-arabic text-[9px] font-black leading-none text-[var(--primary-fg)]">{tr("أضف إعلان")}</span>
                </Link>
            </div>
        </nav>
    );
}
