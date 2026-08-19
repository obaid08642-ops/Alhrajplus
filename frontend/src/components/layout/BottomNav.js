import { Link, useLocation } from "react-router-dom";
import { Home, Film, MessageCircle, User, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { tr } from "@/contexts/I18nContext";

const FLOATING_FAB_COLOR = "#B7F20A";
const FLOATING_FAB_FOREGROUND = "#062C1F";
const TRANSPARENT_NOTCH_MASK = "radial-gradient(circle 46px at 50% 0, transparent 0 44px, #000 46px)";

/**
 * BottomNav — web counterpart of the mobile FloatingTabBar.
 * The bar surface uses --nav-bg, which the administrator can control
 * independently. The publication FAB intentionally keeps its approved
 * lime-green identity and floats over a fully transparent notch.
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
                <div
                    data-testid={`nav-icon-${key}`}
                    className="relative flex h-7 min-w-7 items-center justify-center rounded-2xl px-2 transition-[background-color,transform] duration-200"
                    style={{ backgroundColor: active ? "color-mix(in srgb, var(--nav-fg) 16%, transparent)" : "transparent" }}
                >
                    <Icon
                        className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                        style={{ color: active ? "var(--nav-fg)" : "var(--nav-inactive-fg)" }}
                        strokeWidth={active ? 2.6 : 2}
                        fill="none"
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
            <div className="relative h-[46px] pb-[env(safe-area-inset-bottom)]">
                {/* This masked surface is the bar itself. The notch has no background layer,
                    so cards, maps, or any page content visibly pass through the cut-out. */}
                <div
                    data-testid="bottom-nav-surface"
                    className="absolute inset-x-0 bottom-0 flex h-[46px] items-center justify-around px-2 shadow-[0_-7px_24px_-12px_rgba(15,27,58,0.32)]"
                    style={{
                        backgroundColor: "var(--nav-bg)",
                        borderTop: "1px solid color-mix(in srgb, var(--nav-fg) 26%, transparent)",
                        maskImage: TRANSPARENT_NOTCH_MASK,
                        WebkitMaskImage: TRANSPARENT_NOTCH_MASK,
                    }}
                >
                    <SideItem to="/" icon={Home} label={tr("الرئيسية")} navKey="home" />
                    <SideItem to="/reels" icon={Film} label={tr("قصص")} navKey="reels" />
                    <div className="relative z-0 w-16 shrink-0" aria-hidden="true" />
                    <SideItem to="/chat" icon={MessageCircle} label={tr("رسائلي")} navKey="messages" badge={unread} />
                    <SideItem to="/profile" icon={User} label={tr("حسابي")} navKey="more" />
                </div>

                <Link
                    to="/post"
                    data-testid="nav-post-fab"
                    aria-label={tr("نشر إعلان")}
                    className="group absolute left-1/2 top-0 z-20 flex h-[74px] w-[52px] -translate-x-1/2 -translate-y-[52%] flex-col items-center justify-center rounded-full px-1 transition-transform duration-200 hover:scale-105 active:scale-95"
                    style={{
                        backgroundColor: FLOATING_FAB_COLOR,
                        boxShadow: "0 8px 20px -6px rgba(2, 32, 26, 0.38)",
                    }}
                >
                    <Plus className="relative z-10 h-6 w-6" style={{ color: FLOATING_FAB_FOREGROUND }} strokeWidth={3.2} />
                    <span className="relative z-10 mt-0.5 whitespace-nowrap font-arabic text-[9px] font-black leading-none" style={{ color: FLOATING_FAB_FOREGROUND }}>{tr("أضف إعلان")}</span>
                </Link>
            </div>
        </nav>
    );
}
