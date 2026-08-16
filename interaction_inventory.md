=== BACKEND ROUTES ===
1603:@api.get("/auth/snapchat/start")
1637:@api.post("/auth/snapchat/callback")
3301:@api.post("/listings/{listing_id}/click")
3312:@api.post("/listings/{listing_id}/view")
3402:@api.post("/follow/category/{name}")
3411:@api.delete("/follow/category/{name}")
3416:@api.get("/following")
3433:@api.get("/users/me/notifications/settings")
3445:@api.put("/users/me/notifications/settings")
4098:@api.post("/favorites/{listing_id}")
4114:@api.delete("/favorites/{listing_id}")
4123:@api.get("/favorites/{listing_id}/check")
4128:@api.get("/favorites")
4313:@api.get("/chat/presence/{user_id}")
4322:@api.post("/chat/send")
4413:@api.get("/chat/conversations")
4431:@api.get("/chat/messages/{convo_id}")
4456:@api.delete("/chat/messages/{message_id}")
4487:@api.post("/chat/messages/{message_id}/react")
4535:@api.post("/reports")
4607:@api.post("/ads/{aid}/click")
5184:@api.post("/chat/location-share")
5219:@api.get("/chat/location-share/{share_id}")
5236:@api.post("/chat/location-share/{share_id}/stop")
6017:@api.get("/notifications")
6030:@api.post("/notifications/{nid}/read")
6035:@api.post("/notifications/read-all")
6041:@api.get("/notifications/unread-count")
6651:@api.post("/sellers/{seller_id}/follow")
6670:@api.get("/sellers/{seller_id}/follow-status")
6679:@api.get("/sellers/{seller_id}")
6705:@api.get("/sellers/{seller_id}/trust")
6740:@api.get("/sellers/{seller_id}/listings")
6753:@api.get("/sellers/{seller_id}/ratings")
6775:@api.post("/sellers/{seller_id}/ratings")
=== FRONTEND USAGE ===
frontend/src/App.js:23:const ChatPage = lazy(() => import("@/pages/ChatPage"));
frontend/src/App.js:57:        trackEvent("page_view");
frontend/src/App.js:95:            <Route path="/auth/snapchat/callback" element={<SnapAuthCallback />} />
frontend/src/App.js:100:            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
frontend/src/components/AIAssistantWidget.js:36:    const [messages, setMessages] = useState(() => {
frontend/src/components/AIAssistantWidget.js:52:    // Hidden flag: user clicked ×. Restored on next visit unless they unhide it
frontend/src/components/AIAssistantWidget.js:90:    // Re-clamp on viewport resize so the FAB never gets stuck off-screen.
frontend/src/components/AIAssistantWidget.js:144:        try { localStorage.setItem(HIST_KEY, JSON.stringify(messages.slice(-30))); } catch { /* noop */ }
frontend/src/components/AIAssistantWidget.js:148:    }, [messages, open]);
frontend/src/components/AIAssistantWidget.js:155:        const nextMsgs = [...messages, { role: "user", text }];
frontend/src/components/AIAssistantWidget.js:156:        setMessages(nextMsgs);
frontend/src/components/AIAssistantWidget.js:160:            const { data } = await api.post("/ai/assistant", { message: text, session_id: getSessionId(), lang });
frontend/src/components/AIAssistantWidget.js:161:            setMessages([...nextMsgs, { role: "assistant", text: data.reply || "" }]);
frontend/src/components/AIAssistantWidget.js:164:            setMessages([...nextMsgs, { role: "assistant", text: `⚠️ ${errText}` }]);
frontend/src/components/AIAssistantWidget.js:171:        setMessages([]);
frontend/src/components/AIAssistantWidget.js:181:                onClick={() => setHidden(false)}
frontend/src/components/AIAssistantWidget.js:220:                    onClick={(e) => { e.stopPropagation(); setHidden(true); }}
frontend/src/components/AIAssistantWidget.js:231:                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={() => setOpen(false)}>
frontend/src/components/AIAssistantWidget.js:232:                    <div data-testid="ai-assistant-panel" onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-[var(--border)] shadow-2xl flex flex-col max-h-[85vh]">
frontend/src/components/AIAssistantWidget.js:241:                            {messages.length > 0 && (
frontend/src/components/AIAssistantWidget.js:242:                                <button data-testid="ai-reset-btn" onClick={reset} className="text-[10px] font-arabic-body text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1 rounded-md">{tr("جلسة جديدة")}</button>
frontend/src/components/AIAssistantWidget.js:244:                            <button data-testid="ai-close-btn" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
frontend/src/components/AIAssistantWidget.js:248:                            {messages.length === 0 ? (
frontend/src/components/AIAssistantWidget.js:254:                                            <button key={i} data-testid={`ai-suggest-${i}`} onClick={() => setInput(s)} className="text-start bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 rounded-xl px-3 py-2 font-arabic-body text-xs text-[var(--text)] border border-[var(--border)]">{s}</button>
frontend/src/components/AIAssistantWidget.js:259:                                messages.map((m, i) => (
frontend/src/components/AnimalsEquipmentBoxes.js:168:   Shared cell primitives
frontend/src/components/AuctionsServicesBoxes.js:87:            {/* Inline validation messages */}
frontend/src/components/AuctionsServicesBoxes.js:96:                <CountdownPreview iso={cf.end_time} tr={tr} />
frontend/src/components/AuctionsServicesBoxes.js:102:function CountdownPreview({ iso, tr }) {
frontend/src/components/AuctionsServicesBoxes.js:103:    // UI hook only — purely visual preview of the live countdown.
frontend/src/components/AuctionsServicesBoxes.js:111:        <div className="text-[10px] font-arabic-body text-[var(--text-muted)] mt-1" data-testid="auc-countdown-preview">
frontend/src/components/AuctionsServicesBoxes.js:257:   Shared 2-col cell primitives (kept local for zero-coupling)
frontend/src/components/AuthCallback.js:10: * Backend (Google/X/Snapchat) redirects here with tokens in the URL fragment:
frontend/src/components/AuthCallback.js:90:                console.warn("[AuthCallback] /auth/me failed, navigating home anyway:", e?.message || e);
frontend/src/components/AuthCallback.js:114:                        onClick={() => nav("/login", { replace: true })}
frontend/src/components/CitySelect.js:28:    // Close on outside click
frontend/src/components/CitySelect.js:76:            {/* Trigger button - shows like a real dropdown */}
frontend/src/components/CitySelect.js:81:                onClick={() => setOpen((o) => !o)}
frontend/src/components/CitySelect.js:103:                                onClick={() => setSearchMode(true)}
frontend/src/components/CitySelect.js:120:                            <button type="button" onClick={() => { setSearchMode(false); setQ(""); setRemote([]); }} className="p-1 rounded-md hover:bg-[var(--surface-elevated)]">
frontend/src/components/CitySelect.js:134:                                onClick={() => pick(it.name)}
frontend/src/components/CitySelect.js:149:                                        onClick={() => pick(it.name)}
frontend/src/components/CitySelect.js:160:                                        onClick={() => pick(it.name)}
frontend/src/components/CountryPicker.js:9: * Opens on first visit (no country saved) OR when the user clicks the country
frontend/src/components/CountryPicker.js:38:            onClick={(e) => { if (e.target === e.currentTarget) dismissPicker(); }}
frontend/src/components/CountryPicker.js:43:                    onClick={dismissPicker}
frontend/src/components/CountryPicker.js:60:                            onClick={() => setSelected(c.code)}
frontend/src/components/CountryPicker.js:75:                    onClick={submit}
frontend/src/components/CountrySwitcher.js:14:            onClick={openPicker}
frontend/src/components/GeoAutocomplete.js:28:    // Click outside closes dropdown
frontend/src/components/GeoAutocomplete.js:112:                            onClick={() => pick(it.name)}
frontend/src/components/ImageViewer.js:5:export default function ImageViewer({ images = [], initialIndex = 0, onClose }) {
frontend/src/components/ImageViewer.js:117:        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" data-testid="image-viewer-overlay">
frontend/src/components/ImageViewer.js:118:            <button data-testid="iv-close" onClick={onClose} aria-label={tr("إغلاق")} className="absolute top-3 end-3 w-14 h-14 rounded-full bg-red-500/95 hover:bg-red-500 shadow-2xl text-white flex items-center justify-center z-[110] border-2 border-white/40"><X className="w-7 h-7" /></button>
frontend/src/components/ImageViewer.js:125:                <button data-testid="iv-zoom-out" onClick={() => setZoom((z) => Math.max(z - 0.5, 1))} className="w-10 h-10 rounded-full text-white hover:bg-white/25 flex items-center justify-center"><ZoomOut className="w-5 h-5" /></button>
frontend/src/components/ImageViewer.js:127:                <button data-testid="iv-zoom-in" onClick={() => setZoom((z) => Math.min(z + 0.5, 4))} className="w-10 h-10 rounded-full text-white hover:bg-white/25 flex items-center justify-center"><ZoomIn className="w-5 h-5" /></button>
frontend/src/components/ImageViewer.js:133:                    <button data-testid="iv-prev" onClick={prev} aria-label={tr("السابق")} className="absolute end-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronRight className="w-6 h-6" /></button>
frontend/src/components/ImageViewer.js:135:                    <button data-testid="iv-next" onClick={next} aria-label={tr("التالي")} className="absolute start-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 backdrop-blur text-white flex items-center justify-center shadow-lg z-[105] mt-7"><ChevronLeft className="w-6 h-6" /></button>
frontend/src/components/ImageViewer.js:146:                            onClick={() => setIdx(i)}
frontend/src/components/JobsRealEstateBoxes.js:8: * (except multi-line free-text fields like requirements/skills which live at the
frontend/src/components/JobsRealEstateBoxes.js:149:   Shared 2-col cell primitives
frontend/src/components/NotificationBell.js:3:import { Bell, Check, X, MessageCircle, Tag, Hammer, CheckCircle2, XCircle, Megaphone } from "lucide-react";
frontend/src/components/NotificationBell.js:7:import { useChatSocket } from "@/lib/useChatSocket";
frontend/src/components/NotificationBell.js:14: * - Refreshes immediately when a WS event fires (so chat messages bump the
frontend/src/components/NotificationBell.js:20:    new_message: { Icon: MessageCircle, color: "text-blue-500" },
frontend/src/components/NotificationBell.js:33:        case "new_message": return n.data?.sender_id ? `/chat?to=${n.data.sender_id}` : "/chat";
frontend/src/components/NotificationBell.js:51:    const { subscribe } = useChatSocket();
frontend/src/components/NotificationBell.js:80:    // Real-time refresh on WS message events
frontend/src/components/NotificationBell.js:84:        const offMessage = subscribe("message", refresh);
frontend/src/components/NotificationBell.js:87:        return () => { offMessage?.(); offOffer?.(); offOfferUpdate?.(); };
frontend/src/components/NotificationBell.js:90:    // Click outside to close
frontend/src/components/NotificationBell.js:118:                onClick={() => setOpen((o) => !o)}
frontend/src/components/NotificationBell.js:135:                            <button data-testid="notif-mark-all" onClick={markAllRead} className="text-[11px] text-[var(--primary)] hover:underline font-bold">
frontend/src/components/NotificationBell.js:155:                                    onClick={() => { setOpen(false); if (!n.read) markOneRead(n.id); }}
frontend/src/components/NotificationsPanel.js:19: *   2. Per-event preferences (messages, listing_status, deals, watchlist, broadcasts, comments).
frontend/src/components/NotificationsPanel.js:23:    { key: "messages", label: "رسائل المحادثة الجديدة" },
frontend/src/components/NotificationsPanel.js:27:    { key: "comments", label: "التعليقات والردود" },
frontend/src/components/NotificationsPanel.js:106:                            <button data-testid="webpush-test" onClick={testIt} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:border-[var(--primary)]">
frontend/src/components/NotificationsPanel.js:109:                            <button data-testid="webpush-disable" onClick={disable} disabled={busy} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold border border-red-500/30">
frontend/src/components/NotificationsPanel.js:114:                        <button data-testid="webpush-enable" onClick={enable} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold disabled:opacity-50">
frontend/src/components/NotificationsPanel.js:131:                                onClick={() => togglePref(p.key)}
frontend/src/components/SEO.js:5: * Crawlers (Google, Bing) and AI agents (ChatGPT, Perplexity, Claude) read these
frontend/src/components/SEO.js:41:            "seller": {
frontend/src/components/SEO.js:43:                "name": listing.seller?.name || "بائع",
frontend/src/components/SmartAppBanner.js:42:    // in App" buttons Twitter/Reddit show on shared links.
frontend/src/components/SmartAppBanner.js:82:                <button onClick={openApp} data-testid="app-banner-open" className="shrink-0 bg-white text-[#1F7BBF] font-bold text-[11px] sm:text-xs rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:scale-105 transition-transform shadow">
frontend/src/components/SmartAppBanner.js:86:                    <a href={storeUrl} target="_blank" rel="noopener noreferrer" data-testid="app-banner-store" onClick={dismiss} className="hidden sm:inline shrink-0 underline text-white/90 text-[11px]">
frontend/src/components/SmartAppBanner.js:90:                <button data-testid="app-banner-dismiss" onClick={dismiss} aria-label={tr("إغلاق")} className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
frontend/src/components/Spin360Viewer.js:7: * Real 3D Viewer using Three.js / WebGL.
frontend/src/components/Spin360Viewer.js:14: * (paid). This viewer renders genuine 3D scene (WebGL), not a 2D frame switcher.
frontend/src/components/Spin360Viewer.js:16:export default function Spin360Viewer({ images = [], onClose }) {
frontend/src/components/Spin360Viewer.js:64:        // with N images we get genuine multi-view 3D.
frontend/src/components/Spin360Viewer.js:253:        <div className="fixed inset-0 z-[60] bg-gradient-to-br from-black via-[#0F1A35] to-black flex flex-col items-center justify-center" data-testid="spin360-viewer">
frontend/src/components/Spin360Viewer.js:254:            <button data-testid="spin360-close" onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white z-10">
frontend/src/components/Spin360Viewer.js:267:                    onClick={toggleAuto}
frontend/src/components/Viewer360.js:6: * Lightweight 360° image-sequence viewer (web).
frontend/src/components/Viewer360.js:8: * No 3D, no WebGL — just a swipe-to-rotate frame-flip viewer powered by the
frontend/src/components/Viewer360.js:10: * 360 viewers used on car marketplaces.
frontend/src/components/Viewer360.js:16:export default function Viewer360({ images = [], onClose }) {
frontend/src/components/Viewer360.js:64:        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none" data-testid="viewer-360-modal">
frontend/src/components/Viewer360.js:98:                data-testid="viewer-360-close"
frontend/src/components/Viewer360.js:99:                onClick={onClose}
frontend/src/components/Viewer360.js:114:                    data-testid="viewer-360-zoom-out"
frontend/src/components/Viewer360.js:115:                    onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
frontend/src/components/Viewer360.js:121:                <div className="bg-white/15 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20" data-testid="viewer-360-index">
frontend/src/components/Viewer360.js:125:                    data-testid="viewer-360-zoom-in"
frontend/src/components/Viewer360.js:126:                    onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
frontend/src/components/Viewer360.js:133:                    data-testid="viewer-360-autospin"
frontend/src/components/Viewer360.js:134:                    onClick={() => setAutoSpin((s) => !s)}
frontend/src/components/layout/BottomNav.js:2:import { Home, Film, MessageCircle, Menu, Plus } from "lucide-react";
frontend/src/components/layout/BottomNav.js:33:                const { data } = await api.get("/chat/conversations");
frontend/src/components/layout/BottomNav.js:49:    //  - Active chat thread on mobile (chat-active class)
frontend/src/components/layout/BottomNav.js:119:                    <SideItem to="/chat" icon={MessageCircle} label={tr("محادثة")} navKey="messages" badge={unread} />
frontend/src/components/layout/TopBar.js:155:                        <button data-testid="voice-search-btn" onClick={startVoice} title={tr("بحث صوتي")} className="text-[var(--text-muted)] hover:text-[var(--primary-hover)] transition-colors shrink-0">
frontend/src/components/layout/TopBar.js:177:                                            onClick={() => submitSearch(s)}
frontend/src/components/layout/TopBar.js:190:                                        <button data-testid="search-history-clear-all" onClick={clearAllHistory} className="text-red-500 hover:underline">{tr("مسح الكل")}</button>
frontend/src/components/layout/TopBar.js:194:                                            <button onClick={() => submitSearch(h.query)} className="flex-1 text-start text-sm text-[var(--text)] truncate">{h.query}</button>
frontend/src/components/layout/TopBar.js:195:                                            <button data-testid={`search-history-del-${h.id}`} onClick={(e) => removeHistoryItem(h.id, e)} className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
frontend/src/components/layout/TopBar.js:208:                                        <button key={trd.query} data-testid={`search-trending-${trd.query.replace(/\s/g, '_')}`} onClick={() => submitSearch(trd.query)} className="w-full flex items-center justify-between px-4 py-2 text-start text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]">
frontend/src/components/layout/TopBar.js:233:                    <button data-testid="lang-btn" onClick={() => setOpenMenu(openMenu === "lang" ? null : "lang")} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center border border-white/25 dark:border-white/15 transition-all backdrop-blur">
frontend/src/components/layout/TopBar.js:239:                                <button key={l} onClick={() => { setLang(l); setOpenMenu(null); }} data-testid={`lang-opt-${l}`}
frontend/src/components/layout/TopBar.js:253:                <button data-testid="theme-toggle-btn" onClick={toggle} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center border border-white/25 dark:border-white/15 transition-all backdrop-blur">
frontend/src/components/layout/TopBar.js:260:                        <button data-testid="user-menu-btn" onClick={() => setOpenMenu(openMenu === "user" ? null : "user")} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[var(--primary-hover)] hover:bg-white/90 flex items-center justify-center transition-all shadow-md">
frontend/src/components/layout/TopBar.js:269:                                <Link to="/profile" data-testid="profile-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
frontend/src/components/layout/TopBar.js:272:                                <Link to="/settings" data-testid="settings-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
frontend/src/components/layout/TopBar.js:275:                                <Link to="/about" data-testid="about-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
frontend/src/components/layout/TopBar.js:278:                                <Link to="/terms" data-testid="terms-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
frontend/src/components/layout/TopBar.js:281:                                <Link to="/contact" data-testid="contact-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--text)]" onClick={() => setOpenMenu(null)}>
frontend/src/components/layout/TopBar.js:285:                                    <Link to="/admin" data-testid="admin-link" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--primary)]/10 text-[var(--accent)] font-bold border-t border-[var(--border)]" onClick={() => setOpenMenu(null)}>
frontend/src/components/layout/TopBar.js:289:                                <button data-testid="logout-btn" onClick={async () => { await logout(); setOpenMenu(null); nav("/"); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
frontend/src/components/listings/AdSlot.js:27:    const onClickAd = () => { if (ad?.id) api.post(`/ads/${ad.id}/click`).catch(() => {}); };
frontend/src/components/listings/AdSlot.js:62:                <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={onClickAd} className="block">{inner}</a>
frontend/src/components/listings/ListingCard.js:18:            const { data } = await api.post(`/favorites/${listing.id}`);
frontend/src/components/listings/ListingCard.js:19:            setFav(data.favorited);
frontend/src/components/listings/ListingCard.js:38:                <button onClick={toggleFav} data-testid={`fav-btn-${listing.id}`} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow-md backdrop-blur">
frontend/src/contexts/I18nContext.js:9:        nav_home: "الرئيسية", nav_search: "بحث", nav_post: "إعلان", nav_messages: "الرسائل", nav_profile: "حسابي",
frontend/src/contexts/I18nContext.js:22:        all_categories: "جميع الأقسام", view_all: "عرض الكل",
frontend/src/contexts/I18nContext.js:24:        call: "اتصال", whatsapp: "واتساب", message: "مراسلة", chat_inapp: "مراسلة داخل التطبيق",
frontend/src/contexts/I18nContext.js:28:        my_listings: "إعلاناتي", favorites: "المفضلة",
frontend/src/contexts/I18nContext.js:29:        seller_info: "معلومات البائع", joined: "انضم في",
frontend/src/contexts/I18nContext.js:40:        view_layout: "طريقة العرض", layout_grid: "شبكة", layout_wide: "عريض",
frontend/src/contexts/I18nContext.js:48:        nav_home: "Home", nav_search: "Search", nav_post: "Post", nav_messages: "Messages", nav_profile: "Profile",
frontend/src/contexts/I18nContext.js:61:        all_categories: "All Categories", view_all: "View All",
frontend/src/contexts/I18nContext.js:63:        call: "Call", whatsapp: "WhatsApp", message: "Message", chat_inapp: "In-App Message",
frontend/src/contexts/I18nContext.js:67:        my_listings: "My Listings", favorites: "Favorites",
frontend/src/contexts/I18nContext.js:68:        seller_info: "Seller Info", joined: "Joined",
frontend/src/contexts/I18nContext.js:72:        disclaimer_text: "Haraj Plus is only a marketplace platform connecting buyers and sellers. We do NOT process payments. Please verify the product, meet in public safe places, and exercise caution when completing the deal.",
frontend/src/contexts/I18nContext.js:79:        view_layout: "Layout", layout_grid: "Grid", layout_wide: "Wide",
frontend/src/contexts/I18nContext.js:87:        nav_home: "ہوم", nav_search: "تلاش", nav_post: "اشتہار", nav_messages: "پیغامات", nav_profile: "پروفائل",
frontend/src/contexts/I18nContext.js:100:        all_categories: "تمام", view_all: "سب",
frontend/src/contexts/I18nContext.js:102:        call: "کال", whatsapp: "واٹس ایپ", message: "پیغام", chat_inapp: "ایپ میں پیغام",
frontend/src/contexts/I18nContext.js:106:        my_listings: "میرے اشتہارات", favorites: "پسندیدہ",
frontend/src/contexts/I18nContext.js:107:        seller_info: "بائع معلومات", joined: "شامل ہوا",
frontend/src/contexts/I18nContext.js:118:        view_layout: "ترتیب", layout_grid: "گرڈ", layout_wide: "چوڑا",
frontend/src/contexts/I18nContext.js:126:        nav_home: "होम", nav_search: "खोज", nav_post: "पोस्ट", nav_messages: "संदेश", nav_profile: "प्रोफ़ाइल",
frontend/src/contexts/I18nContext.js:139:        all_categories: "सभी", view_all: "सब देखें",
frontend/src/contexts/I18nContext.js:141:        call: "कॉल", whatsapp: "व्हाट्सएप", message: "संदेश", chat_inapp: "ऐप संदेश",
frontend/src/contexts/I18nContext.js:145:        my_listings: "मेरे विज्ञापन", favorites: "पसंदीदा",
frontend/src/contexts/I18nContext.js:146:        seller_info: "विक्रेता जानकारी", joined: "शामिल हुए",
frontend/src/contexts/I18nContext.js:155:        view_layout: "लेआउट", layout_grid: "ग्रिड", layout_wide: "वाइड",
frontend/src/contexts/I18nContext.js:163:        nav_home: "হোম", nav_search: "অনুসন্ধান", nav_post: "পোস্ট", nav_messages: "বার্তা", nav_profile: "প্রোফাইল",
frontend/src/contexts/I18nContext.js:176:        all_categories: "সব", view_all: "সব দেখুন",
frontend/src/contexts/I18nContext.js:178:        call: "কল", whatsapp: "হোয়াটসঅ্যাপ", message: "বার্তা", chat_inapp: "অ্যাপ বার্তা",
frontend/src/contexts/I18nContext.js:182:        my_listings: "আমার বিজ্ঞাপন", favorites: "পছন্দের",
frontend/src/contexts/I18nContext.js:183:        seller_info: "বিক্রেতা তথ্য", joined: "যোগ দিয়েছেন",
frontend/src/contexts/I18nContext.js:192:        view_layout: "লেআউট", layout_grid: "গ্রিড", layout_wide: "প্রশস্ত",
frontend/src/contexts/I18nContext.js:200:        nav_home: "Accueil", nav_search: "Rechercher", nav_post: "Publier", nav_messages: "Messages", nav_profile: "Profil",
frontend/src/contexts/I18nContext.js:213:        all_categories: "Toutes", view_all: "Tout voir",
frontend/src/contexts/I18nContext.js:215:        call: "Appeler", whatsapp: "WhatsApp", message: "Message", chat_inapp: "Message app",
frontend/src/contexts/I18nContext.js:219:        my_listings: "Mes annonces", favorites: "Favoris",
frontend/src/contexts/I18nContext.js:220:        seller_info: "Vendeur", joined: "Inscrit",
frontend/src/contexts/I18nContext.js:229:        view_layout: "Disposition", layout_grid: "Grille", layout_wide: "Large",
frontend/src/contexts/I18nContext.js:277:        // The first visit follows the device; after the user changes language,
frontend/src/hooks/useAuctionLive.js:51:                ws.onmessage = (e) => {
frontend/src/index.js:24:    const message = this.state.error?.message || "Unknown runtime error";
frontend/src/index.js:30:          <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 999, padding: "11px 22px", cursor: "pointer", background: "#4fb6e6", color: "white", fontWeight: 700 }}>إعادة المحاولة</button>
frontend/src/index.js:31:          {process.env.NODE_ENV !== "production" && <pre style={{ marginTop: 18, textAlign: "left", whiteSpace: "pre-wrap", fontSize: 11, color: "#b91c1c" }}>{message}</pre>}
frontend/src/lib/imageOptimizer.js:66: * Lets the browser pick the smallest acceptable variant per viewport.
frontend/src/lib/phone.js:64: * Returns a normalized phone like "+966510510455" or "" if it can't be normalized.
frontend/src/lib/phone.js:124:export function whatsappLink(rawPhone, message = "", countryCode = "") {
frontend/src/lib/phone.js:128:    const m = message ? `?text=${encodeURIComponent(message)}` : "";
frontend/src/lib/platform.js:1:// Shared platform detection used by SmartAppBanner + DownloadPage.
frontend/src/lib/platform.js:5:// - HMS / EMUI devices report "HMSCore" or "HuaweiBrowser" in UA.
frontend/src/lib/useChatSocket.js:5: * Single shared WebSocket connection for chat real-time events.
frontend/src/lib/useChatSocket.js:17:export function useChatSocket() {
frontend/src/lib/useChatSocket.js:55:        const url = `${base}/api/ws/chat?token=${encodeURIComponent(token)}`;
frontend/src/lib/useChatSocket.js:76:        ws.onmessage = (e) => {
frontend/src/lib/webPush.js:103:        return { ok: false, reason: e.message || "error" };
frontend/src/lib/webPush.js:119:        return { ok: false, reason: e.message };
frontend/src/lib/webPush.js:128:        return { ok: false, reason: e?.response?.data?.detail || e.message };
frontend/src/pages/AdminPage.js:28:        { key: "reports", label: tr("البلاغات"), icon: Flag },
frontend/src/pages/AdminPage.js:47:                    <button key={tb.key} data-testid={`admin-tab-${tb.key}`} onClick={() => setTab(tb.key)} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-arabic font-bold text-sm border ${tab === tb.key ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"}`}>
frontend/src/pages/AdminPage.js:60:            {tab === "reports" && <ReportsPanel />}
frontend/src/pages/AdminPage.js:73:    const [report, setReport] = useState(null);
frontend/src/pages/AdminPage.js:77:        api.get("/admin/analytics/overview", { params: { days } })
frontend/src/pages/AdminPage.js:78:            .then(({ data }) => { if (active) setReport(data); })
frontend/src/pages/AdminPage.js:79:            .catch(() => { if (active) setReport(null); });
frontend/src/pages/AdminPage.js:82:    if (!report) return <div className="p-6 text-center font-arabic">{tr("تحميل تحليلات CRM...")}</div>;
frontend/src/pages/AdminPage.js:83:    const funnel = report.funnel || {};
frontend/src/pages/AdminPage.js:85:        ["page_view", "مشاهدات الصفحات"],
frontend/src/pages/AdminPage.js:87:        ["listing_view", "مشاهدات الإعلانات"],
frontend/src/pages/AdminPage.js:88:        ["contact_seller", "تواصل مع البائع"],
frontend/src/pages/AdminPage.js:89:        ["chat_started", "بدء المحادثات"],
frontend/src/pages/AdminPage.js:93:    const maxEvent = Math.max(1, ...(report.event_counts || []).map((x) => x.count || 0));
frontend/src/pages/AdminPage.js:106:                <FinanceCard label={tr("الأحداث")} value={report.events_total} />
frontend/src/pages/AdminPage.js:107:                <FinanceCard label={tr("الزوار الفريدون")} value={report.unique_visitors} />
frontend/src/pages/AdminPage.js:108:                <FinanceCard label={tr("الجلسات")} value={report.unique_sessions} />
frontend/src/pages/AdminPage.js:116:                        <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, ((funnel[key] || 0) / Math.max(1, funnel.page_view || 1)) * 100)}%` }} /></div>
frontend/src/pages/AdminPage.js:123:                <div className="space-y-2">{(report.event_counts || []).slice(0, 10).map((row) => <div key={row.event} className="flex items-center gap-2 text-xs"><span className="w-32 truncate font-mono">{row.event}</span><div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden"><div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${(row.count / maxEvent) * 100}%` }} /></div><span className="font-latin font-bold w-12 text-end">{row.count}</span></div>)}</div>
frontend/src/pages/AdminPage.js:128:                    <div className="space-y-2">{(report.top_categories || []).map((row) => <div key={row.key} className="flex justify-between text-sm"><span className="font-arabic-body">{row.key}</span><b className="font-latin">{row.count}</b></div>)}</div>
frontend/src/pages/AdminPage.js:132:                    <div className="space-y-2">{(report.top_countries || []).map((row) => <div key={row.key} className="flex justify-between text-sm"><span className="font-latin">{row.key}</span><b className="font-latin">{row.count}</b></div>)}</div>
frontend/src/pages/AdminPage.js:137:                <div className="space-y-2">{(report.top_listings || []).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-arabic-body">{row.title || row.id}</span><span className="font-latin font-bold shrink-0">{row.views} {tr("مشاهدة")}</span></div>)}</div>
frontend/src/pages/AdminPage.js:242:        { label: "بلاغات مفتوحة", value: stats.open_reports, danger: true },
frontend/src/pages/AdminPage.js:243:        { label: "إجمالي المشاهدات", value: stats.total_views || 0 },
frontend/src/pages/AdminPage.js:244:        { label: "إجمالي النقرات", value: stats.total_clicks || 0 },
frontend/src/pages/AdminPage.js:248:    const maxV = Math.max(1, ...daily.map((d) => d.views || 0));
frontend/src/pages/AdminPage.js:267:                                    <div className="bg-[var(--accent)] rounded-t opacity-70" style={{ height: `${(d.views / maxV) * 40}%` }} title={`${d.views} مشاهدة`}></div>
frontend/src/pages/AdminPage.js:362:                        <button data-testid={`approve-${l.id}`} onClick={() => approve(l.id)} className="bg-[var(--success)] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" />{tr("موافقة")}</button>
frontend/src/pages/AdminPage.js:363:                        <button data-testid={`reject-${l.id}`} onClick={() => reject(l.id)} className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" />{tr("رفض")}</button>
frontend/src/pages/AdminPage.js:364:                        <button data-testid={`delete-${l.id}`} onClick={() => del(l.id)} className="bg-[var(--danger)] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />{tr("حذف")}</button>
frontend/src/pages/AdminPage.js:424:                    <button type="button" data-testid="filter-flagged-toggle" onClick={() => { setSkip(0); setFilters({ ...filters, flagged: !filters.flagged }); }} className={`px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1.5 border ${filters.flagged ? "bg-red-500 text-white border-red-600" : "bg-[var(--surface-elevated)] text-[var(--text)] border-[var(--border)]"}`}>
frontend/src/pages/AdminPage.js:472:                                                <button data-testid={`row-approve-${l.id}`} onClick={() => approve(l.id)} className="bg-[var(--success)]/15 text-[var(--success)] px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Check className="w-3 h-3" />{tr("موافقة")}</button>
frontend/src/pages/AdminPage.js:474:                                            <button data-testid={`row-del-${l.id}`} onClick={() => del(l.id)} className="bg-red-500/15 text-red-500 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />{tr("حذف")}</button>
frontend/src/pages/AdminPage.js:486:                        <button disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - LIMIT))} className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1 font-bold disabled:opacity-40" data-testid="listings-prev">{tr("‹ السابق")}</button>
frontend/src/pages/AdminPage.js:488:                        <button disabled={skip + LIMIT >= total} onClick={() => setSkip(skip + LIMIT)} className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1 font-bold disabled:opacity-40" data-testid="listings-next">{tr("التالي ›")}</button>
frontend/src/pages/AdminPage.js:496:// Data Integrity tool — shows orphan records and one-click fix.
frontend/src/pages/AdminPage.js:542:                        <button onClick={fix} disabled={busy} data-testid="di-fix-btn" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] px-5 py-2 rounded-xl font-arabic font-bold text-sm disabled:opacity-60">
frontend/src/pages/AdminPage.js:620:                                        <button data-testid={`user-open-${u.id}`} onClick={() => setActiveUserId(u.id)} className="text-start hover:text-[var(--primary)] hover:underline">{u.name}</button>
frontend/src/pages/AdminPage.js:628:                                        {!u.verified && <button data-testid={`user-verify-${u.id}`} onClick={async () => { await api.post(`/admin/users/${u.id}/verify`); reload(); }} className="bg-[var(--primary)]/15 text-[var(--primary)] px-2 py-1 rounded-full text-xs font-bold">{tr("توثيق")}</button>}
frontend/src/pages/AdminPage.js:630:                                            <button data-testid={`user-unban-${u.id}`} onClick={async () => { await api.post(`/admin/users/${u.id}/unban`); reload(); }} className="bg-[var(--success)]/15 text-[var(--success)] px-2 py-1 rounded-full text-xs font-bold">{tr("إلغاء حظر")}</button>
frontend/src/pages/AdminPage.js:632:                                            <button data-testid={`user-ban-${u.id}`} onClick={async () => { await api.post(`/admin/users/${u.id}/ban`); reload(); }} className="bg-red-500/15 text-red-500 px-2 py-1 rounded-full text-xs font-bold">{tr("حظر")}</button>
frontend/src/pages/AdminPage.js:668:        <div className="fixed inset-0 z-[200] flex justify-end bg-black/50" data-testid="user-details-drawer" onClick={onClose}>
frontend/src/pages/AdminPage.js:669:            <div className="w-full sm:w-[480px] max-w-full h-full bg-[var(--bg)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
frontend/src/pages/AdminPage.js:672:                    <button data-testid="user-drawer-close" onClick={onClose} className="bg-[var(--surface-elevated)] rounded-full w-9 h-9 flex items-center justify-center"><X className="w-4 h-4" /></button>
frontend/src/pages/AdminPage.js:696:                                {!data.user?.verified && <button data-testid="drawer-verify" disabled={busy} onClick={() => act("verify")} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">{tr("توثيق الحساب")}</button>}
frontend/src/pages/AdminPage.js:698:                                    ? <button data-testid="drawer-unban" disabled={busy} onClick={() => act("unban")} className="bg-[var(--success)] text-white px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">{tr("إلغاء الحظر")}</button>
frontend/src/pages/AdminPage.js:699:                                    : <button data-testid="drawer-ban" disabled={busy} onClick={() => act("ban")} className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50">{tr("حظر")}</button>
frontend/src/pages/AdminPage.js:706:                            <Stat label={tr("بلاغات ضدّه")} value={data.stats?.reports_against || 0} />
frontend/src/pages/AdminPage.js:707:                            <Stat label={tr("آخر رسالة")} value={(data.stats?.last_message_at || "—").slice(0, 10)} />
frontend/src/pages/AdminPage.js:743:function ReportsPanel() {
frontend/src/pages/AdminPage.js:744:    const [reports, setReports] = useState([]);
frontend/src/pages/AdminPage.js:746:    const reload = () => api.get("/admin/reports").then(({ data }) => setReports(data));
frontend/src/pages/AdminPage.js:750:            {reports.length === 0 && <div className="bg-[var(--surface)] rounded-2xl p-8 text-center border border-[var(--border)] text-[var(--text-muted)] font-arabic-body">{tr("لا توجد بلاغات")}</div>}
frontend/src/pages/AdminPage.js:751:            {reports.map((r) => {
frontend/src/pages/AdminPage.js:767:                            <button onClick={() => setExpanded(isOpen ? null : r.id)} className="bg-[var(--surface-elevated)] text-[var(--text)] px-3 py-1.5 rounded-full text-xs font-bold">{isOpen ? "إخفاء" : "تفاصيل"}</button>
frontend/src/pages/AdminPage.js:768:                            {r.status === "open" && <button onClick={async () => { await api.post(`/admin/reports/${r.id}/close`); reload(); }} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold">{tr("إغلاق")}</button>}
frontend/src/pages/AdminPage.js:773:                                {r.message && <div><b>{tr("تفاصيل من المُبلِّغ:")}</b> {r.message}</div>}
frontend/src/pages/AdminPage.js:774:                                <div><b>{tr("المُبلِّغ ID:")}</b> {r.reporter_id?.slice(0, 12)}…</div>
frontend/src/pages/AdminPage.js:938:                        <button data-testid="notif-send" onClick={send} disabled={busy} className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50">
frontend/src/pages/AdminPage.js:941:                        <button data-testid="notif-ai-suggest" onClick={suggest} disabled={suggesting} className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50">
frontend/src/pages/AdminPage.js:944:                        <button data-testid="notif-test-btn" onClick={sendTest} disabled={testing} className="bg-[var(--success)] text-white px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center gap-2 disabled:opacity-50" title={tr("إرسال إشعار تجريبي لحسابك فقط")}>
frontend/src/pages/AdminPage.js:955:                            <button data-testid="notif-schedule-btn" onClick={scheduleSend} disabled={schedBusy} className="bg-amber-500 text-white px-4 py-2 rounded-full font-arabic font-bold text-xs flex items-center gap-1.5 disabled:opacity-50">
frontend/src/pages/AdminPage.js:973:                                <button onClick={() => setForm({ ...form, title: s.title, body: s.body })} className="bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1 rounded-full text-xs font-bold font-arabic">{tr("استخدم هذا")}</button>
frontend/src/pages/AdminPage.js:986:                    <button onClick={loadSchedules} className="text-xs text-[var(--primary)] font-arabic font-bold hover:underline">{tr("تحديث")}</button>
frontend/src/pages/AdminPage.js:1002:                                <button data-testid={`cancel-scheduled-${s.id}`} onClick={() => cancelSchedule(s.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg shrink-0" title={tr("إلغاء")}>✕</button>
frontend/src/pages/AdminPage.js:1033:            <button data-testid="new-ad-btn" onClick={() => setShowForm(!showForm)} className="bg-[var(--primary)] text-[var(--primary-fg)] px-4 py-2 rounded-full font-arabic font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" />{tr(" إضافة بنر إعلاني")}</button>
frontend/src/pages/AdminPage.js:1038:                        <button type="button" onClick={() => setForm({ ...form, ad_type: "image" })} data-testid="ad-type-image" className={`flex-1 py-2 rounded-full text-xs font-arabic font-bold ${form.ad_type === "image" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("صورة بنر")}</button>
frontend/src/pages/AdminPage.js:1039:                        <button type="button" onClick={() => setForm({ ...form, ad_type: "iframe" })} data-testid="ad-type-iframe" className={`flex-1 py-2 rounded-full text-xs font-arabic font-bold ${form.ad_type === "iframe" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("بنر iframe (Trip.com)")}</button>
frontend/src/pages/AdminPage.js:1050:                            <button type="button" onClick={useTripBanner} data-testid="use-trip-default-btn" className="w-full bg-gradient-to-r from-[#287DFA] to-[#0F58D6] text-white py-2 rounded-xl text-xs font-arabic font-bold">{tr("استخدام بنر Trip.com الافتراضي")}</button>
frontend/src/pages/AdminPage.js:1086:                                    <span className="text-[var(--text-muted)]">🖱 {a.clicks || 0}</span>
frontend/src/pages/AdminPage.js:1090:                            <button data-testid={`del-ad-${a.id}`} onClick={() => remove(a.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
frontend/src/pages/AdminPage.js:1182:                            onClick={() => { setSelCountry(c.code); setSelCity(""); }}
frontend/src/pages/AdminPage.js:1199:                <button data-testid="add-city-btn" onClick={addCity} disabled={busy || !newCity.name_ar.trim()} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 py-2 text-sm font-arabic font-bold disabled:opacity-50">
frontend/src/pages/AdminPage.js:1213:                                <button onClick={() => setSelCity(cn)} className="text-sm font-arabic-body text-[var(--text)] flex-1 text-start truncate">{cn}</button>
frontend/src/pages/AdminPage.js:1214:                                <button onClick={() => removeCity(cn)} className="text-red-500 text-xs px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">✕</button>
frontend/src/pages/AdminPage.js:1224:                                    <button data-testid="add-district-btn" onClick={addDistrict} disabled={!newDistrict.trim()} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-4 py-2 text-xs font-arabic font-bold disabled:opacity-50">{tr("إضافة")}</button>
frontend/src/pages/AdminPage.js:1230:                                            <button onClick={() => removeDistrict(d)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
frontend/src/pages/AdminPage.js:1370:                                <button data-testid={`bw-del-${it.word}`} onClick={() => remove(it.word)} disabled={busy} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-full disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
frontend/src/pages/AuctionsPage.js:121:                    <button data-testid={`bid-btn-${listing.id}`} onClick={onBid} className="shrink-0 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-4 py-2 text-xs font-bold font-arabic flex items-center gap-1 active:scale-95 transition-transform">
frontend/src/pages/AuctionsPage.js:196:        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3" onClick={onClose}>
frontend/src/pages/AuctionsPage.js:197:            <div data-testid="bid-dialog" onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-[var(--border)] shadow-2xl overflow-hidden">
frontend/src/pages/AuctionsPage.js:205:                        <button data-testid="bid-close-btn" onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
frontend/src/pages/Auth.js:19:                onClick={() => setOpen(o => !o)}
frontend/src/pages/Auth.js:32:                            onClick={() => { setLang(l); setOpen(false); }}
frontend/src/pages/Auth.js:62:    const [providers, setProviders] = useState({ google: true, apple: true, x: true, snapchat: true });
frontend/src/pages/Auth.js:77:            const { data } = await api.get("/auth/snapchat/start");
frontend/src/pages/Auth.js:80:            alert(tr("تعذر بدء تسجيل الدخول بـ Snapchat. تأكد من إعدادات Snap Developer Portal."));
frontend/src/pages/Auth.js:105:                onClick={startGoogleLogin}
frontend/src/pages/Auth.js:109:                <svg className="w-5 h-5" viewBox="0 0 24 24">
frontend/src/pages/Auth.js:120:                onClick={startApple}
frontend/src/pages/Auth.js:124:                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
frontend/src/pages/Auth.js:129:            <div className="grid grid-cols-2 gap-2" style={{ display: (providers.x || providers.snapchat) ? undefined : "none" }}>
frontend/src/pages/Auth.js:133:                    onClick={startX}
frontend/src/pages/Auth.js:137:                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.55 8.625L23 22h-6.844l-5.36-7.005L4.62 22H1.36l8.07-9.225L1 2h7l4.846 6.405L18.244 2zm-1.197 18h1.86L7.04 4H5.07l11.977 16z"/></svg>
frontend/src/pages/Auth.js:142:                    data-testid="snapchat-login-btn"
frontend/src/pages/Auth.js:143:                    onClick={startSnap}
frontend/src/pages/Auth.js:144:                    style={{ display: providers.snapchat ? undefined : "none" }}
frontend/src/pages/Auth.js:147:                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166.34c2.853-.04 5.49 1.92 6.34 4.6.31 1.05.21 2.18.21 3.27 0 .85-.21 1.7-.07 2.55.31 0 .61-.07.92-.13.21-.04.42-.07.62-.04.42.07.85.21.92.71.07.55-.42.85-.85.99-.42.21-.92.28-1.34.42-.42.21-.71.55-.85.99-.07.21-.07.42 0 .62.42 1.27 1.34 2.4 2.55 3.06.42.21.92.42 1.41.42.21 0 .42-.07.62.07.21.21.21.55 0 .78-.34.42-.85.71-1.34.99-.71.34-1.55.42-2.33.42-.42 0-.85.13-1.2.42-.42.34-.62.85-.92 1.27-.34.42-.78.55-1.27.55-.42 0-.85-.13-1.27-.21-.42-.07-.85-.07-1.27 0-.55.07-1.06.34-1.55.42-.21.07-.42.07-.62 0-.42-.13-.71-.42-.92-.78-.34-.42-.62-.85-1.06-1.13-.42-.28-.99-.34-1.48-.42-.71-.07-1.41-.13-2.05-.42-.55-.21-.99-.55-1.34-.99-.21-.21-.21-.55-.07-.78.21-.21.42-.13.62-.13.42 0 .85-.13 1.27-.34 1.27-.62 2.26-1.84 2.69-3.21.07-.21 0-.42-.07-.62-.21-.42-.55-.78-.99-.92-.42-.13-.85-.21-1.27-.42-.42-.13-.92-.42-.85-.99 0-.42.42-.62.85-.71.21-.07.42 0 .62.04.34.07.62.13.92.13.13-.85-.07-1.7-.07-2.55 0-1.06-.07-2.18.21-3.21C6.747 2.18 9.319.3 12.166.34z"/></svg>
frontend/src/pages/Auth.js:148:                    Snapchat
frontend/src/pages/Auth.js:172:            setErr(formatApiError(e.response?.data?.detail) || e.message);
frontend/src/pages/Auth.js:198:                        <button type="button" onClick={() => setShowPw(!showPw)} className="text-[var(--text-muted)]">
frontend/src/pages/Auth.js:264:            setErr(formatApiError(e.response?.data?.detail) || e.message);
frontend/src/pages/Auth.js:413:                <button type="button" onClick={() => setShow(!show)} className="text-[var(--text-muted)]">
frontend/src/pages/Auth.js:455:            setErr(formatApiError(e.response?.data?.detail) || e.message || "حدث خطأ، حاول لاحقاً");
frontend/src/pages/CategoryPage.js:97:                <button data-testid="toggle-filters" onClick={() => setShowFilters(!showFilters)} className="ms-auto flex items-center gap-1.5 bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text)] px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-[var(--border)] transition-all font-arabic">
frontend/src/pages/CategoryPage.js:104:                <button data-testid="sub-all" onClick={() => updateFilter("subcategory", "")} className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-arabic font-bold border ${!filters.subcategory ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"}`}>{tr("الكل")}</button>
frontend/src/pages/CategoryPage.js:106:                    <button key={s.key} data-testid={`sub-${s.key}`} onClick={() => updateFilter("subcategory", s.key)} className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-arabic font-bold border ${filters.subcategory === s.key ? "bg-[var(--primary)] text-[var(--primary-fg)] border-[var(--primary)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]"}`}>
frontend/src/pages/ChatPage.js:5:    Send, ChevronRight, MessageCircle, Image as ImageIcon, Mic, X, Square,
frontend/src/pages/ChatPage.js:10:import ImageViewer from "@/components/ImageViewer";
frontend/src/pages/ChatPage.js:11:import { useChatSocket } from "@/lib/useChatSocket";
frontend/src/pages/ChatPage.js:13:import "@/styles/chat.css";
frontend/src/pages/ChatPage.js:38: * Linkify plain message text: detect http(s) URLs and listing slugs/ids.
frontend/src/pages/ChatPage.js:40: *   SPA router intercepts the click and never reloads the page.
frontend/src/pages/ChatPage.js:60:                    <Link key={i} to={u.pathname + u.search + u.hash} className="underline text-[var(--primary)] break-all" data-testid="chat-msg-link">
frontend/src/pages/ChatPage.js:67:            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-[var(--primary)] break-all" data-testid="chat-msg-link">
frontend/src/pages/ChatPage.js:75:/** Single message bubble — memoised so list updates don't rerender history. */
frontend/src/pages/ChatPage.js:76:const Bubble = ({ m, mine, firstOfRun, onReply, onImageClick, onTranslate, translation, isTranslating, onReact, onDelete }) => {
frontend/src/pages/ChatPage.js:77:    const liveShare = m.location?.live_share_id;
frontend/src/pages/ChatPage.js:107:            onDoubleClick={() => onReply?.(m)}
frontend/src/pages/ChatPage.js:114:            {/* Reactions picker strip — long-press / right-click to open */}
frontend/src/pages/ChatPage.js:119:                                    onClick={(e) => { e.stopPropagation(); onDelete?.(m); setShowReactStrip(false); }}
frontend/src/pages/ChatPage.js:127:                            onClick={(e) => { e.stopPropagation(); onReact?.(m, em); setShowReactStrip(false); }}
frontend/src/pages/ChatPage.js:148:                <span className="italic opacity-70" data-testid="deleted-message">{tr("تم حذف هذه الرسالة")}</span>
frontend/src/pages/ChatPage.js:150:            {m.image && <img src={m.image} alt="" onClick={() => onImageClick(m.image)} className="rounded-lg max-w-full max-h-64 object-cover cursor-zoom-in" />}
frontend/src/pages/ChatPage.js:152:            {m.location && !liveShare && (
frontend/src/pages/ChatPage.js:157:            {liveShare && (
frontend/src/pages/ChatPage.js:165:            {/* Backward-compat: legacy mobile messages stored URLs inside `text`
frontend/src/pages/ChatPage.js:173:            {/* If a legacy text-with-emoji-URL message has NO media field,
frontend/src/pages/ChatPage.js:177:                <img src={m.text.slice("📷 ".length).trim()} alt="" onClick={() => onImageClick(m.text.slice("📷 ".length).trim())} className="rounded-lg max-w-full max-h-64 object-cover cursor-zoom-in" />
frontend/src/pages/ChatPage.js:194:                    <button onClick={() => onTranslate(m)} disabled={isTranslating} className="hover:underline">
frontend/src/pages/ChatPage.js:207:            {/* Reactions chips — WhatsApp-style under the bubble */}
frontend/src/pages/ChatPage.js:209:            {m.reactions && !m.deleted && Object.keys(m.reactions).length > 0 && (
frontend/src/pages/ChatPage.js:210:                <div className="absolute -bottom-3 end-2 flex gap-0.5" data-testid={`bubble-reactions-${m.id}`}>
frontend/src/pages/ChatPage.js:211:                    {Object.entries(m.reactions).map(([em, users]) => (
frontend/src/pages/ChatPage.js:223:export default function ChatPage() {
frontend/src/pages/ChatPage.js:233:    const [messages, setMessages] = useState([]);
frontend/src/pages/ChatPage.js:237:    const [imgPreview, setImgPreview] = useState(null);
frontend/src/pages/ChatPage.js:243:    // Listing context card — fetched once when the chat opens with ?listing=<id>.
frontend/src/pages/ChatPage.js:244:    // Acts as a persistent reference at the top of the thread so buyer + seller
frontend/src/pages/ChatPage.js:245:    // both know which ad they're discussing (sellers often have many ads).
frontend/src/pages/ChatPage.js:253:    // inside its messages and pin that listing as the sticky context card —
frontend/src/pages/ChatPage.js:254:    // so the link stays visible across reloads and after switching chats.
frontend/src/pages/ChatPage.js:258:        const withListing = (messages || []).find((m) => m.listing_id || m.listing?.id);
frontend/src/pages/ChatPage.js:264:    }, [activeConvoId, messages, initialListing, listingCtx]);
frontend/src/pages/ChatPage.js:266:    // ----------- Auto-send "listing card" first message -----------
frontend/src/pages/ChatPage.js:267:    // When the user opens the chat from a listing detail page (?to=<seller>&listing=<id>)
frontend/src/pages/ChatPage.js:268:    // and the conversation has NO prior message referencing this listing,
frontend/src/pages/ChatPage.js:269:    // send a templated intro message so both buyer and seller have a clear
frontend/src/pages/ChatPage.js:277:        // If any existing message already references this listing, skip — we
frontend/src/pages/ChatPage.js:279:        const alreadyRefs = (messages || []).some((m) => m.listing_id === initialListing);
frontend/src/pages/ChatPage.js:286:        api.post("/chat/send", {
frontend/src/pages/ChatPage.js:291:    }, [user, activeConvoId, activeOther?.id, initialListing, listingCtx, messages, tr]);
frontend/src/pages/ChatPage.js:298:    // the user is the sender of the new message.
frontend/src/pages/ChatPage.js:304:    const { send: wsSend, connected, subscribe } = useChatSocket();
frontend/src/pages/ChatPage.js:316:            loadOlderMessages?.()?.then?.(() => {
frontend/src/pages/ChatPage.js:317:                // Preserve visual position after older messages prepend.
frontend/src/pages/ChatPage.js:334:        if (activeConvoId) document.body.classList.add("chat-active");
frontend/src/pages/ChatPage.js:335:        else document.body.classList.remove("chat-active");
frontend/src/pages/ChatPage.js:336:        return () => document.body.classList.remove("chat-active");
frontend/src/pages/ChatPage.js:340:    // Reads window.visualViewport.height (shrinks when the on-screen keyboard
frontend/src/pages/ChatPage.js:341:    // opens) and writes it to --hp-vh so the fixed chat shell stays clamped
frontend/src/pages/ChatPage.js:347:            const h = window.visualViewport?.height || window.innerHeight;
frontend/src/pages/ChatPage.js:351:        const vv = window.visualViewport;
frontend/src/pages/ChatPage.js:355:            // visualViewport scroll updates --hp-vh continuously as the user
frontend/src/pages/ChatPage.js:377:        api.get("/chat/conversations").then(({ data }) => {
frontend/src/pages/ChatPage.js:389:    // ----------- Load messages once when convo opens -----------
frontend/src/pages/ChatPage.js:391:    const [hasMoreMessages, setHasMoreMessages] = useState(true);
frontend/src/pages/ChatPage.js:395:        setHasMoreMessages(true);
frontend/src/pages/ChatPage.js:397:        // it's OK to jump to the latest message ONCE". Subsequent loads must
frontend/src/pages/ChatPage.js:400:        api.get(`/chat/messages/${activeConvoId}`).then(({ data }) => {
frontend/src/pages/ChatPage.js:402:            setMessages(data);
frontend/src/pages/ChatPage.js:403:            // One-time jump to latest message when the thread first opens.
frontend/src/pages/ChatPage.js:405:            // forced scrolls from incoming messages, image loads, or keyboard.
frontend/src/pages/ChatPage.js:417:    // Load older messages (cursor pagination) when user scrolls to the top
frontend/src/pages/ChatPage.js:418:    const loadOlderMessages = useCallback(async () => {
frontend/src/pages/ChatPage.js:419:        if (!activeConvoId || loadingOlder || !hasMoreMessages || messages.length === 0) return;
frontend/src/pages/ChatPage.js:420:        const oldest = messages[0]?.ts;
frontend/src/pages/ChatPage.js:424:            const { data } = await api.get(`/chat/messages/${activeConvoId}`, { params: { before: oldest, limit: 50 } });
frontend/src/pages/ChatPage.js:425:            const older = data?.messages || [];
frontend/src/pages/ChatPage.js:426:            if (older.length === 0) setHasMoreMessages(false);
frontend/src/pages/ChatPage.js:427:            else setMessages((prev) => [...older, ...prev]);
frontend/src/pages/ChatPage.js:428:            if (!data?.has_more) setHasMoreMessages(false);
frontend/src/pages/ChatPage.js:429:        } catch (_) { setHasMoreMessages(false); }
frontend/src/pages/ChatPage.js:431:    }, [activeConvoId, loadingOlder, hasMoreMessages, messages]);
frontend/src/pages/ChatPage.js:436:        api.get(`/chat/presence/${activeOther.id}`).then(({ data }) => {
frontend/src/pages/ChatPage.js:446:        offs.push(subscribe("message", (ev) => {
frontend/src/pages/ChatPage.js:451:                setMessages((prev) => {
frontend/src/pages/ChatPage.js:465:                    // Immediately mark conversation as read since we're viewing it
frontend/src/pages/ChatPage.js:468:                // Only auto-scroll when the USER sent the message. Never force-
frontend/src/pages/ChatPage.js:469:                // scroll for incoming messages — let the user read in peace.
frontend/src/pages/ChatPage.js:474:                // Update conversations list with new last message
frontend/src/pages/ChatPage.js:479:                    return [{ ...base, last_message: m.text || "[وسائط]", last_ts: m.ts, unread: (base.unread || 0) + (m.sender_id !== user.id ? 1 : 0) }, ...others];
frontend/src/pages/ChatPage.js:493:            setMessages((prev) => prev.map((m) => m.id === ev.message_id ? { ...m, delivered: true } : m));
frontend/src/pages/ChatPage.js:498:                setMessages((prev) => prev.map((m) => m.sender_id === user.id ? { ...m, read_at: ev.ts || new Date().toISOString() } : m));
frontend/src/pages/ChatPage.js:502:        // Reactions WS — peer reacted on a message in our convo.
frontend/src/pages/ChatPage.js:503:        offs.push(subscribe("reaction", (ev) => {
frontend/src/pages/ChatPage.js:505:            setMessages((prev) => prev.map((m) => m.id === ev.message_id ? { ...m, reactions: ev.reactions } : m));
frontend/src/pages/ChatPage.js:508:        offs.push(subscribe("message_deleted", (ev) => {
frontend/src/pages/ChatPage.js:509:            setMessages((prev) => prev.map((m) => m.id === ev.message_id ? {
frontend/src/pages/ChatPage.js:510:                ...m, deleted: true, deleted_at: ev.deleted_at, text: null, image: null, voice: null, location: null, reply_to: null, reactions: {}, pending: false,
frontend/src/pages/ChatPage.js:517:    // ----------- Send message -----------
frontend/src/pages/ChatPage.js:538:        setMessages((m) => [...m, optimistic]);
frontend/src/pages/ChatPage.js:544:            const { data: msg } = await api.post("/chat/send", {
frontend/src/pages/ChatPage.js:553:            setMessages((m) => m.map((x) => x.id === tmpId ? msg : x));
frontend/src/pages/ChatPage.js:556:            setMessages((m) => m.map((x) => x.id === tmpId ? { ...x, pending: false, failed: true } : x));
frontend/src/pages/ChatPage.js:580:            const { data: sig } = await api.get("/cloudinary/signature", { params: { resource_type: type === "voice" ? "video" : "image", folder: "chat" } });
frontend/src/pages/ChatPage.js:633:        for (const m of messages) {
frontend/src/pages/ChatPage.js:645:    }, [messages, lang]);
frontend/src/pages/ChatPage.js:674:                            <button key={c.id} data-testid={`convo-${c.id}`} onClick={() => { setActiveConvoId(c.id); setActiveOther(c.other); }} className={`w-full p-3 flex items-center gap-3 hover:bg-[var(--surface-elevated)] border-b border-[var(--border)] text-start ${activeConvoId === c.id ? "bg-[var(--primary)]/10" : ""}`}>
frontend/src/pages/ChatPage.js:681:                                    <div className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{c.last_message}</div>
frontend/src/pages/ChatPage.js:689:                {/* Active chat — full-height shell so input bar stays fixed */}
frontend/src/pages/ChatPage.js:694:                                <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
frontend/src/pages/ChatPage.js:699:                        <div className="hp-chat-shell">
frontend/src/pages/ChatPage.js:701:                            <div className="flex items-center gap-3 p-3 border-b border-[var(--border)] bg-[var(--surface)]" data-testid="chat-header">
frontend/src/pages/ChatPage.js:702:                                <button onClick={() => { setActiveConvoId(null); setActiveOther(null); }} className="text-[var(--text-muted)] hover:text-[var(--primary)] md:hidden" aria-label="رجوع"><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
frontend/src/pages/ChatPage.js:715:                            {/* Listing context card — shown when chat was opened from a listing */}
frontend/src/pages/ChatPage.js:717:                                <Link to={`/listing/${listingCtx.slug || listingCtx.id}`} className="hp-chat-listing-card" data-testid="chat-listing-context" onClick={(e) => e.stopPropagation()}>
frontend/src/pages/ChatPage.js:721:                                    <div className="hp-chat-listing-card-body">
frontend/src/pages/ChatPage.js:722:                                        <div className="hp-chat-listing-card-label">{tr("بخصوص الإعلان")}</div>
frontend/src/pages/ChatPage.js:723:                                        <div className="hp-chat-listing-card-title">{listingCtx.title}</div>
frontend/src/pages/ChatPage.js:725:                                            <div className="hp-chat-listing-card-price">
frontend/src/pages/ChatPage.js:730:                                    <ChevronRight className="w-4 h-4 hp-chat-listing-card-arrow" />
frontend/src/pages/ChatPage.js:734:                            {/* Messages */}
frontend/src/pages/ChatPage.js:735:                            <div ref={scrollRef} onScroll={handleScroll} className="hp-chat-messages flex flex-col p-2 sm:p-3 relative" data-testid="chat-messages">
frontend/src/pages/ChatPage.js:737:                                    <div key={row.id} className="hp-chat-date">{row.label}</div>
frontend/src/pages/ChatPage.js:741:                                        onReply={setReplyTo} onImageClick={setImgPreview}
frontend/src/pages/ChatPage.js:745:                                                await api.delete(`/chat/messages/${msg.id}`);
frontend/src/pages/ChatPage.js:746:                                                setMessages(prev => prev.map(x => x.id === msg.id ? { ...x, deleted: true, deleted_at: new Date().toISOString(), text: null, image: null, voice: null, location: null, reply_to: null, reactions: {} } : x));
frontend/src/pages/ChatPage.js:751:                                                const { data } = await api.post(`/chat/messages/${msg.id}/react`, { emoji });
frontend/src/pages/ChatPage.js:752:                                                setMessages(prev => prev.map(x => x.id === msg.id ? { ...x, reactions: data.reactions } : x));
frontend/src/pages/ChatPage.js:763:                                    <button data-testid="chat-scroll-down" onClick={() => scrollToBottom(true)} className="hp-scroll-down" aria-label={tr("النزول")}>
frontend/src/pages/ChatPage.js:769:                            {/* Reply preview */}
frontend/src/pages/ChatPage.js:777:                                    <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full hover:bg-[var(--surface)] flex items-center justify-center" aria-label="إلغاء"><X className="w-3.5 h-3.5" /></button>
frontend/src/pages/ChatPage.js:782:                            <div className="hp-chat-input-bar">
frontend/src/pages/ChatPage.js:783:                                <label data-testid="chat-image-btn" className="cursor-pointer w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0">
frontend/src/pages/ChatPage.js:787:                                <button data-testid="chat-location-btn" onClick={sendLocation} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></button>
frontend/src/pages/ChatPage.js:789:                                    <button data-testid="chat-stop-rec" onClick={stopRecord} className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse shrink-0"><Square className="w-3 h-3 fill-current" /></button>
frontend/src/pages/ChatPage.js:791:                                    <button data-testid="chat-mic" onClick={startRecord} className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text-muted)] flex items-center justify-center shrink-0"><Mic className="w-4 h-4" /></button>
frontend/src/pages/ChatPage.js:794:                                    ref={inputRef} data-testid="chat-input"
frontend/src/pages/ChatPage.js:805:                                <button data-testid="chat-send" onClick={() => { send(); notifyTyping(false); }} className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] flex items-center justify-center hover:bg-[var(--primary-hover)] shrink-0 active:scale-95 transition-transform">
frontend/src/pages/ChatPage.js:813:            {imgPreview && <ImageViewer images={[imgPreview]} initialIndex={0} onClose={() => setImgPreview(null)} />}
frontend/src/pages/FlightsPage.js:139:                onClick={() => setOpen((o) => !o)}
frontend/src/pages/FlightsPage.js:165:                                onClick={() => { onChange(a.code); setOpen(false); setQ(""); }}
frontend/src/pages/FlightsPage.js:257:                    <button data-testid="trip-oneway" onClick={() => setTripType("oneway")} className={`flex-1 py-2.5 rounded-full text-sm font-arabic font-bold ${tripType === "oneway" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("ذهاب فقط")}</button>
frontend/src/pages/FlightsPage.js:258:                    <button data-testid="trip-round" onClick={() => setTripType("round")} className={`flex-1 py-2.5 rounded-full text-sm font-arabic font-bold ${tripType === "round" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface-elevated)] text-[var(--text)]"}`}>{tr("ذهاب وعودة")}</button>
frontend/src/pages/FlightsPage.js:297:                                onClick={() => searchTrip(p.key)}
frontend/src/pages/HomePage.js:72:                console.error("[HomePage] load failed:", e?.message || e, "BACKEND_URL=", process.env.REACT_APP_BACKEND_URL);
frontend/src/pages/HomePage.js:78:    // Infinite scroll — fetches the next 20 when the sentinel scrolls into view
frontend/src/pages/HomePage.js:181:                <button data-testid="toggle-categories" onClick={onToggle} className="text-xs text-[var(--primary)] font-bold font-arabic flex items-center gap-1">
frontend/src/pages/HomePage.js:213:                        <button data-testid="layout-grid" onClick={() => setLayout("grid")} className={`px-2.5 py-1 rounded-full text-[10px] font-arabic font-bold ${layout === "grid" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "text-[var(--text-muted)]"}`}>{t("layout_grid")}</button>
frontend/src/pages/HomePage.js:214:                        <button data-testid="layout-wide" onClick={() => setLayout("wide")} className={`px-2.5 py-1 rounded-full text-[10px] font-arabic font-bold ${layout === "wide" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "text-[var(--text-muted)]"}`}>{t("layout_wide")}</button>
frontend/src/pages/ListingDetail.js:5:import { Heart, Phone, MessageCircle, MapPin, Eye, Calendar, Share2, Flag, ChevronLeft, Star, ChevronRight, Sparkles, TrendingUp, ShieldAlert, Maximize2, RotateCw, Edit3, RefreshCw, CheckCircle2, Trash2, Bell, Tag } from "lucide-react";
frontend/src/pages/ListingDetail.js:14:import ImageViewer from "@/components/ImageViewer";
frontend/src/pages/ListingDetail.js:15:import Viewer360 from "@/components/Viewer360";
frontend/src/pages/ListingDetail.js:17:import Spin360Viewer from "@/components/Spin360Viewer";
frontend/src/pages/ListingDetail.js:50:    const [showViewer, setShowViewer] = useState(false);
frontend/src/pages/ListingDetail.js:54:    const [following, setFollowing] = useState(false);
frontend/src/pages/ListingDetail.js:58:    const [offerMessage, setOfferMessage] = useState("");
frontend/src/pages/ListingDetail.js:60:    const [sellerTrust, setSellerTrust] = useState(null);
frontend/src/pages/ListingDetail.js:71:                trackEvent("listing_view", { listing_id: l.data.id, category: l.data.category, country_code: l.data.country_code });
frontend/src/pages/ListingDetail.js:74:                api.get(`/sellers/${l.data.user_id}/trust`).then(({ data }) => setSellerTrust(data)).catch(() => {});
frontend/src/pages/ListingDetail.js:76:                    api.get(`/sellers/${l.data.user_id}/follow-status`).then(({ data }) => setFollowing(!!data.following)).catch(() => {});
frontend/src/pages/ListingDetail.js:84:    const toggleFollow = async () => {
frontend/src/pages/ListingDetail.js:87:            const { data } = await api.post(`/sellers/${listing.user_id}/follow`);
frontend/src/pages/ListingDetail.js:88:            setFollowing(!!data.following);
frontend/src/pages/ListingDetail.js:110:    const startChat = () => {
frontend/src/pages/ListingDetail.js:112:        trackEvent("chat_started", { listing_id: listing.id, category: listing.category, country_code: listing.country_code });
frontend/src/pages/ListingDetail.js:113:        nav(`/chat?to=${listing.user_id}&listing=${listing.id}`);
frontend/src/pages/ListingDetail.js:125:            await api.post(`/listings/${listing.id}/offers`, { amount, message: offerMessage });
frontend/src/pages/ListingDetail.js:128:            setOfferMessage("");
frontend/src/pages/ListingDetail.js:139:            alert(data.message || "تم التجديد");
frontend/src/pages/ListingDetail.js:202:                    <button data-testid="edit-listing-btn" onClick={handleEdit} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
frontend/src/pages/ListingDetail.js:205:                    <button data-testid="republish-btn" onClick={handleRepublish} className="bg-[var(--success)] hover:opacity-90 text-white rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
frontend/src/pages/ListingDetail.js:208:                    <button data-testid="pause-resume-btn" onClick={handlePauseToggle} className={`${listing.status === "paused" ? "bg-emerald-500 text-white" : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"} rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1`}>
frontend/src/pages/ListingDetail.js:211:                    <button data-testid="mark-sold-btn" onClick={handleMarkSold} className="bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
frontend/src/pages/ListingDetail.js:214:                    <button data-testid="delete-listing-btn" onClick={handleDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-full px-3 py-1.5 text-xs font-bold font-arabic flex items-center gap-1">
frontend/src/pages/ListingDetail.js:225:                        <div className="relative aspect-[16/10] bg-[var(--surface-elevated)] cursor-zoom-in" onClick={() => listing.images?.length && setShowViewer(true)}>
frontend/src/pages/ListingDetail.js:235:                                <button data-testid="open-viewer-btn" onClick={(e) => { e.stopPropagation(); setShowViewer(true); }} className="absolute top-3 end-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1 backdrop-blur hover:bg-black/80">
frontend/src/pages/ListingDetail.js:239:                            {/* Show 360 button when EITHER the seller flagged
frontend/src/pages/ListingDetail.js:242:                                <button data-testid="open-spin360-btn" onClick={(e) => { e.stopPropagation(); setShow360(true); }} className="absolute top-3 end-28 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1 backdrop-blur hover:opacity-90 shadow-lg">
frontend/src/pages/ListingDetail.js:251:                                    <button key={i} data-testid={`img-thumb-${i}`} onClick={() => setActiveImg(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${activeImg === i ? "border-[var(--primary)]" : "border-transparent"}`}>
frontend/src/pages/ListingDetail.js:264:                            <button data-testid="share-btn" onClick={async () => {
frontend/src/pages/ListingDetail.js:266:                                const shareData = { title: listing.title, text: `${listing.title} - الحراج بلس`, url };
frontend/src/pages/ListingDetail.js:268:                                    if (navigator.share) {
frontend/src/pages/ListingDetail.js:269:                                        await navigator.share(shareData);
frontend/src/pages/ListingDetail.js:275:                            }} className="px-3 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body text-sm font-bold whitespace-nowrap" title={tr("مشاركة الإعلان")}><Share2 className="w-4 h-4" /><span>{tr("مشاركة الإعلان")}</span></button>
frontend/src/pages/ListingDetail.js:291:                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views || 0} مشاهدة</span>
frontend/src/pages/ListingDetail.js:364:                    {/* Seller Info & Contact (always before similar listings) */}
frontend/src/pages/ListingDetail.js:365:                    <div data-testid="seller-info-block" className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)] lg:hidden">
frontend/src/pages/ListingDetail.js:366:                        <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-4">{t("seller_info")}</h2>
frontend/src/pages/ListingDetail.js:369:                                {listing.seller?.name?.[0] || "U"}
frontend/src/pages/ListingDetail.js:373:                                    {listing.seller?.name}
frontend/src/pages/ListingDetail.js:374:                                    {listing.seller?.verified && <Star className="w-3.5 h-3.5 fill-[var(--primary)] text-[var(--primary)]" />}
frontend/src/pages/ListingDetail.js:375:                                    {sellerTrust && <span title={tr("درجة مبنية على التوثيق والتقييمات والنشاط والبلاغات")} className={`text-[10px] rounded-full px-1.5 py-0.5 font-latin ${sellerTrust.score >= 80 ? "bg-emerald-100 text-emerald-700" : sellerTrust.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{sellerTrust.score}/100</span>}
frontend/src/pages/ListingDetail.js:378:                                    {t("joined")} {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString("ar") : ""}
frontend/src/pages/ListingDetail.js:382:                                <button data-testid="follow-seller-btn-mobile" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
frontend/src/pages/ListingDetail.js:383:                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
frontend/src/pages/ListingDetail.js:388:                            <button data-testid="watch-price-btn-mobile" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
frontend/src/pages/ListingDetail.js:393:                            {listing.show_phone !== false && (listing.contact_phone || listing.seller?.phone_full) && !listing.is_demo && (() => {
frontend/src/pages/ListingDetail.js:394:                                const ph = listing.contact_phone || listing.seller.phone_full;
frontend/src/pages/ListingDetail.js:395:                                const cc = listing.country_code || listing.seller?.country_code || "";
frontend/src/pages/ListingDetail.js:404:                                            <MessageCircle className="w-4 h-4" /> {t("whatsapp")}
frontend/src/pages/ListingDetail.js:410:                                <button data-testid="make-offer-btn-mobile" onClick={() => { if (!user) return nav("/login"); setOfferAmount(listing.price ? String(listing.price) : ""); setShowOffer(true); }} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:415:                                <button onClick={startChat} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:416:                                    <MessageCircle className="w-4 h-4" /> {t("chat_inapp")}
frontend/src/pages/ListingDetail.js:430:                    {/* Similar listings — placed AFTER seller info as requested */}
frontend/src/pages/ListingDetail.js:443:                {/* Right/Sidebar - Seller (Desktop only) */}
frontend/src/pages/ListingDetail.js:446:                        <h3 className="font-arabic font-bold text-base text-[var(--text)] mb-4">{t("seller_info")}</h3>
frontend/src/pages/ListingDetail.js:449:                                {listing.seller?.name?.[0] || "U"}
frontend/src/pages/ListingDetail.js:453:                                    {listing.seller?.name}
=== MOBILE USAGE ===
mobile/src/ErrorBoundary.js:4:import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
mobile/src/ErrorBoundary.js:11:        this.state = { hasError: false, message: "" };
mobile/src/ErrorBoundary.js:14:        return { hasError: true, message: err?.message || String(err) };
mobile/src/ErrorBoundary.js:22:    reset = () => this.setState({ hasError: false, message: "" });
mobile/src/ErrorBoundary.js:29:        const msg = this.state.message || (runtimeErr && runtimeErr.message) || "";
mobile/src/ErrorBoundary.js:32:            <View style={s.wrap} testID="error-boundary">
mobile/src/ErrorBoundary.js:39:            </View>
mobile/src/I18nContext.js:9:import { I18nManager, View } from "react-native";
mobile/src/I18nContext.js:76:        "ابحث عن محادثة...": "Search for a chat...",
mobile/src/I18nContext.js:90:        "اختر سبب الإبلاغ": "Select Report Reason",
mobile/src/I18nContext.js:108:        "اكتب تعليقك (اختياري)": "Write your comment (optional)",
mobile/src/I18nContext.js:109:        "اكتب رسالتك...": "Write your message...",
mobile/src/I18nContext.js:115:        "الأكثر مشاهدة": "Most Viewed",
mobile/src/I18nContext.js:116:        "الإبلاغ": "Report",
mobile/src/I18nContext.js:117:        "الإبلاغ عن الإعلان": "Report Ad",
mobile/src/I18nContext.js:118:        "الإبلاغ عن المستخدم": "Report User",
mobile/src/I18nContext.js:123:        "البائعون": "Sellers",
mobile/src/I18nContext.js:131:        "التقييم": "Rating",
mobile/src/I18nContext.js:132:        "التقييمات": "Reviews",
mobile/src/I18nContext.js:145:        "الرسائل": "Messages",
mobile/src/I18nContext.js:161:        "المحادثات": "Chats",
mobile/src/I18nContext.js:168:        "المفضلة": "Favorites",
mobile/src/I18nContext.js:176:        "بائع": "Seller",
mobile/src/I18nContext.js:196:        "تعذر إرسال البلاغ": "Couldn't send report",
mobile/src/I18nContext.js:197:        "تعذر إرسال الرسالة": "Couldn't send message",
mobile/src/I18nContext.js:220:        "تقييم": "Rating",
mobile/src/I18nContext.js:221:        "تقييمات": "Ratings",
mobile/src/I18nContext.js:227:        "تم استلام بلاغك": "Report submitted",
mobile/src/I18nContext.js:244:        "تواصل مع البائعين من صفحة الإعلان": "Contact sellers on the ad page",
mobile/src/I18nContext.js:281:        "رسائل المحادثة": "Chat messages",
mobile/src/I18nContext.js:282:        "رسالة...": "Message...",
mobile/src/I18nContext.js:294:        "سجّل دخولك لعرض محفظتك": "Log in to view your wallet",
mobile/src/I18nContext.js:295:        "سجّل دخولك للتواصل مع البائعين والمشترين": "Log in to contact buyers and sellers",
mobile/src/I18nContext.js:319:        "عرض الإعلان": "View ad",
mobile/src/I18nContext.js:320:        "عرض الكل": "View all",
mobile/src/I18nContext.js:321:        "عرض رقم جوالي للمشترين": "Share my phone number",
mobile/src/I18nContext.js:334:        "قارن أسعار 5 محركات بحث في ضغطة واحدة": "Compare prices from 5 search engines in one click",
mobile/src/I18nContext.js:338:        "قيّم البائع": "Rate seller",
mobile/src/I18nContext.js:353:        "لا توجد إعلانات في المفضلة": "No ads in favorites",
mobile/src/I18nContext.js:357:        "لا توجد تقييمات بعد": "No ratings yet",
mobile/src/I18nContext.js:362:        "لا توجد محادثات بعد": "No messages yet",
mobile/src/I18nContext.js:377:        "متابعاتي": "My follows",
mobile/src/I18nContext.js:378:        "متابعة": "Follow",
mobile/src/I18nContext.js:379:        "متابعة بحساب Apple": "Follow with Apple",
mobile/src/I18nContext.js:380:        "متابعة بحساب Google": "Follow with Google",
mobile/src/I18nContext.js:381:        "متابعون": "Followers",
mobile/src/I18nContext.js:382:        "متابَع": "Following",
mobile/src/I18nContext.js:400:        "مشاركة": "Share",
mobile/src/I18nContext.js:401:        "مشاركة الإعلان": "Share This Ad",
mobile/src/I18nContext.js:403:        "معلومات البائع": "Seller Information",
mobile/src/I18nContext.js:404:        "مفضلة": "Favorite",
mobile/src/I18nContext.js:431:        "نلتزم بحماية بياناتك ولا نشاركها مع أطراف ثالثة.": "We are committed to protecting your data and will not share it with third parties.",
mobile/src/I18nContext.js:453:        "🎙️ رسالة صوتية": "🎙️ Voice message",
mobile/src/I18nContext.js:454:        "💬 محادثة داخل التطبيق": "💬 In-app chat",
mobile/src/I18nContext.js:456:        "📍 الموقع المشترك": "📍 Shared location",
mobile/src/I18nContext.js:1868:        "اكتب تعليقك (اختياري)": "Écrire votre commentaire (facultatif)",
mobile/src/I18nContext.js:1869:        "اكتب رسالتك...": "Écrire votre message...",
mobile/src/I18nContext.js:1896:        "الحراج بلس — منصة بيع وشراء عربية مدعومة بالذكاء الاصطناعي.": "Haraj Plus — Plateforme d'achat et de vente arabe alimentée par l'IA.",
mobile/src/I18nContext.js:1905:        "الرسائل": "Messages",
mobile/src/I18nContext.js:1957:        "تعذر إرسال الرسالة": "Message impossible",
mobile/src/I18nContext.js:2041:        "رسائل المحادثة": "Messages",
mobile/src/I18nContext.js:2042:        "رسالة...": "Message...",
mobile/src/I18nContext.js:2108:        "كيف أنشر إعلاناً جديداً؟": "Comment publier une nouvelle annonce ?",
mobile/src/I18nContext.js:2213:        "🎙️ رسالة صوتية": "🎙️ Message vocal",
mobile/src/I18nContext.js:2214:        "💬 محادثة داخل التطبيق": "💬 Chat intégré",
mobile/src/I18nContext.js:2277:                // effect on all already-mounted views. Use expo-updates when
mobile/src/I18nContext.js:2302:        <View style={{ flex: 1 }} key={lang}>{children}</View>
mobile/src/ThemeContext.js:29:      // system so the first screen follows the device automatically.
mobile/src/api.js:21:// Secure-first storage: keychain on iOS, EncryptedSharedPreferences on Android.
mobile/src/biometric.js:45:        promptMessage: "أثبت هويتك لتفعيل الدخول بالبصمة",
mobile/src/biometric.js:79:        promptMessage: "الدخول إلى الحراج بلس",
mobile/src/components/AIAssistantFab.js:11:import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View, Text } from "react-native";
mobile/src/components/AIAssistantFab.js:58:    const hideOnRoute = routeName === "AIAssistant" || routeName === "ReelsTab" || routeName === "Login" || routeName === "Register" || routeName === "Chat";
mobile/src/components/AIAssistantFab.js:119:        <Animated.View
mobile/src/components/AIAssistantFab.js:124:            <View style={styles.fab}>
mobile/src/components/AIAssistantFab.js:126:                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
mobile/src/components/AIAssistantFab.js:127:            </View>
mobile/src/components/AIAssistantFab.js:136:        </Animated.View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:9:import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
mobile/src/components/AnimalsEquipmentBoxesMobile.js:53:  return <View style={s.box} testID="animals-details-box">
mobile/src/components/AnimalsEquipmentBoxesMobile.js:57:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:70:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:73:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:84:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:87:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:98:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:101:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:112:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:115:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:127:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:130:            {isBirds && <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:141:                </View>}
mobile/src/components/AnimalsEquipmentBoxesMobile.js:144:            {isHorse && <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:155:                </View>}
mobile/src/components/AnimalsEquipmentBoxesMobile.js:156:        </View>;
mobile/src/components/AnimalsEquipmentBoxesMobile.js:191:  return <View style={s.box} testID="equipment-details-box">
mobile/src/components/AnimalsEquipmentBoxesMobile.js:195:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:206:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:209:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:220:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:223:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:234:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:237:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:249:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:252:            <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:263:            </View>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:266:            {isRental && <View style={s.row}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:277:                </View>}
mobile/src/components/AnimalsEquipmentBoxesMobile.js:278:        </View>;
mobile/src/components/AnimalsEquipmentBoxesMobile.js:282:   Shared primitives
mobile/src/components/AnimalsEquipmentBoxesMobile.js:288:  return <View style={s.cell}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:291:        </View>;
mobile/src/components/AnimalsEquipmentBoxesMobile.js:309:                    <View style={s.sheet}>
mobile/src/components/AnimalsEquipmentBoxesMobile.js:321:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:6:import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
mobile/src/components/AuctionsServicesBoxesMobile.js:62:  return <View style={s.box} testID="auctions-details-box">
mobile/src/components/AuctionsServicesBoxesMobile.js:65:            <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:76:            </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:78:            <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:94:            </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:96:            <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:107:            </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:109:            <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:121:            </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:123:            <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:134:            </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:136:            {(incrementTooLow || buyNowBelowStart) && <View style={{
mobile/src/components/AuctionsServicesBoxesMobile.js:141:                </View>}
mobile/src/components/AuctionsServicesBoxesMobile.js:142:        </View>;
mobile/src/components/AuctionsServicesBoxesMobile.js:202:  return <View style={s.box} testID="services-pro-details-box">
mobile/src/components/AuctionsServicesBoxesMobile.js:205:            <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:216:            </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:220:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:226:                        <View style={s.cell} />
mobile/src/components/AuctionsServicesBoxesMobile.js:227:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:228:                    {isScheduled && <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:239:                        </View>}
mobile/src/components/AuctionsServicesBoxesMobile.js:240:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:251:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:252:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:263:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:264:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:275:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:276:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:287:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:292:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:303:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:304:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:315:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:316:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:327:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:332:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:343:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:344:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:355:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:356:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:367:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:372:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:383:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:384:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:395:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:396:                    <View style={s.row}>
mobile/src/components/AuctionsServicesBoxesMobile.js:407:                    </View>
mobile/src/components/AuctionsServicesBoxesMobile.js:411:        </View>;
mobile/src/components/AuctionsServicesBoxesMobile.js:415:   Shared primitives
mobile/src/components/AuctionsServicesBoxesMobile.js:421:  return <View style={s.cell}>
mobile/src/components/AuctionsServicesBoxesMobile.js:424:        </View>;
mobile/src/components/AuctionsServicesBoxesMobile.js:442:                    <View style={s.sheet}>
mobile/src/components/AuctionsServicesBoxesMobile.js:454:                    </View>
mobile/src/components/CategoryCascadesMobile.js:1:// Mobile cascading selectors for cars + phones. Shares backend endpoints with
mobile/src/components/CategoryCascadesMobile.js:4:import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
mobile/src/components/CategoryCascadesMobile.js:38:                    <View style={ps.sheet}>
mobile/src/components/CategoryCascadesMobile.js:50:                    </View>
mobile/src/components/CategoryCascadesMobile.js:105:  return <View style={s.wrap}>
mobile/src/components/CategoryCascadesMobile.js:107:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:117:            </View>
mobile/src/components/CategoryCascadesMobile.js:118:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:125:            </View>
mobile/src/components/CategoryCascadesMobile.js:126:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:133:            </View>
mobile/src/components/CategoryCascadesMobile.js:134:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:141:            </View>
mobile/src/components/CategoryCascadesMobile.js:142:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:149:            </View>
mobile/src/components/CategoryCascadesMobile.js:150:        </View>;
mobile/src/components/CategoryCascadesMobile.js:206:  return <View style={s.wrap}>
mobile/src/components/CategoryCascadesMobile.js:208:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:220:            </View>
mobile/src/components/CategoryCascadesMobile.js:221:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:228:            </View>
mobile/src/components/CategoryCascadesMobile.js:229:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:236:            </View>
mobile/src/components/CategoryCascadesMobile.js:237:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:241:                <View style={{
mobile/src/components/CategoryCascadesMobile.js:244:            </View>
mobile/src/components/CategoryCascadesMobile.js:245:        </View>;
mobile/src/components/CategoryCascadesMobile.js:278:  return <View style={s.wrap}>
mobile/src/components/CategoryCascadesMobile.js:280:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:287:            </View>
mobile/src/components/CategoryCascadesMobile.js:288:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:295:            </View>
mobile/src/components/CategoryCascadesMobile.js:296:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:303:            </View>
mobile/src/components/CategoryCascadesMobile.js:304:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:311:            </View>
mobile/src/components/CategoryCascadesMobile.js:312:        </View>;
mobile/src/components/CategoryCascadesMobile.js:325:  return <View style={s.wrap}>
mobile/src/components/CategoryCascadesMobile.js:327:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:334:            </View>
mobile/src/components/CategoryCascadesMobile.js:335:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:342:            </View>
mobile/src/components/CategoryCascadesMobile.js:343:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:350:            </View>
mobile/src/components/CategoryCascadesMobile.js:351:            <View style={s.row}>
mobile/src/components/CategoryCascadesMobile.js:358:            </View>
mobile/src/components/CategoryCascadesMobile.js:359:        </View>;
mobile/src/components/CategoryCascadesMobile.js:365:  return <View style={{
mobile/src/components/CategoryCascadesMobile.js:370:        </View>;
mobile/src/components/CountrySwitcher.js:6:import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
mobile/src/components/CountrySwitcher.js:32:                    <View style={styles.sheet}>
mobile/src/components/CountrySwitcher.js:33:                        <View style={styles.sheetHead}>
mobile/src/components/CountrySwitcher.js:38:                        </View>
mobile/src/components/CountrySwitcher.js:48:                                        <View style={{
mobile/src/components/CountrySwitcher.js:56:                                        </View>
mobile/src/components/CountrySwitcher.js:62:                    </View>
mobile/src/components/FloatingTabBar.js:11:import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
mobile/src/components/FloatingTabBar.js:15:import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
mobile/src/components/FloatingTabBar.js:44:// Result: the FAB looks like a floating capsule with transparent breathing
mobile/src/components/FloatingTabBar.js:70:  // Reels and the chat-thread mode to hide the bar.
mobile/src/components/FloatingTabBar.js:95:    { name: "ChatTab",    icon: MessageCircle, label: t("رسائلي") },
mobile/src/components/FloatingTabBar.js:135:    <View pointerEvents="box-none" style={styles.wrap}>
mobile/src/components/FloatingTabBar.js:137:      <View pointerEvents="box-none" style={[styles.fabAnchor, { bottom: fabBottom }]}>
mobile/src/components/FloatingTabBar.js:138:        <Animated.View pointerEvents="none" style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
mobile/src/components/FloatingTabBar.js:140:        <Animated.View pointerEvents="none" style={[styles.burstRing, { transform: [{ scale: burstScale }], opacity: burstOpacity }]} />
mobile/src/components/FloatingTabBar.js:141:        <Animated.View style={{ transform: [{ scale: fabPress }] }}>
mobile/src/components/FloatingTabBar.js:152:        </Animated.View>
mobile/src/components/FloatingTabBar.js:153:      </View>
mobile/src/components/FloatingTabBar.js:156:      <View style={[styles.barOuter, { width: W, height: barTotalH }]}>
mobile/src/components/FloatingTabBar.js:163:        <View style={[styles.tabsRow, { height: BAR_HEIGHT, paddingBottom: 0 }]}>
mobile/src/components/FloatingTabBar.js:165:            if (tab.name === "_SPACER") return <View key="spacer" style={styles.spacer} />;
mobile/src/components/FloatingTabBar.js:167:            if (routeIndex === -1) return <View key={tab.name} style={styles.spacer} />;
mobile/src/components/FloatingTabBar.js:191:        </View>
mobile/src/components/FloatingTabBar.js:192:      </View>
mobile/src/components/FloatingTabBar.js:193:    </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:9:import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
mobile/src/components/JobsRealEstateBoxesMobile.js:39:  return <View style={s.box} testID="jobs-details-box">
mobile/src/components/JobsRealEstateBoxesMobile.js:43:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:54:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:57:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:72:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:75:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:86:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:89:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:100:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:103:            {isSeeker ? <View style={{
mobile/src/components/JobsRealEstateBoxesMobile.js:113:                </View> : <View style={{
mobile/src/components/JobsRealEstateBoxesMobile.js:123:                </View>}
mobile/src/components/JobsRealEstateBoxesMobile.js:124:        </View>;
mobile/src/components/JobsRealEstateBoxesMobile.js:154:  return <View style={s.box} testID="realestate-details-box">
mobile/src/components/JobsRealEstateBoxesMobile.js:158:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:170:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:173:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:184:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:187:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:199:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:202:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:213:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:216:            <View style={s.row}>
mobile/src/components/JobsRealEstateBoxesMobile.js:227:            </View>
mobile/src/components/JobsRealEstateBoxesMobile.js:228:        </View>;
mobile/src/components/JobsRealEstateBoxesMobile.js:232:   Shared primitives
mobile/src/components/JobsRealEstateBoxesMobile.js:238:  return <View style={s.cell}>
mobile/src/components/JobsRealEstateBoxesMobile.js:241:        </View>;
mobile/src/components/JobsRealEstateBoxesMobile.js:259:                    <View style={s.sheet}>
mobile/src/components/JobsRealEstateBoxesMobile.js:271:                    </View>
mobile/src/components/ListingCard.js:2:import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
mobile/src/components/ListingCard.js:27:      api.get(`/favorites/${listing.id}/check`).then(({
mobile/src/components/ListingCard.js:30:        if (mounted) setFav(!!data?.favorited);
mobile/src/components/ListingCard.js:45:        await api.delete(`/favorites/${listing.id}`);
mobile/src/components/ListingCard.js:48:        await api.post(`/favorites/${listing.id}`);
mobile/src/components/ListingCard.js:59:                <View style={styles.wideImgBox}>
mobile/src/components/ListingCard.js:62:        }} style={styles.wideImg} /> : <View style={styles.imgPlaceholder} />}
mobile/src/components/ListingCard.js:63:                </View>
mobile/src/components/ListingCard.js:64:                <View style={styles.wideBody}>
mobile/src/components/ListingCard.js:67:                    <View style={styles.wideFoot}>
mobile/src/components/ListingCard.js:69:                        <View style={styles.cityRow}>
mobile/src/components/ListingCard.js:72:                        </View>
mobile/src/components/ListingCard.js:73:                    </View>
mobile/src/components/ListingCard.js:74:                </View>
mobile/src/components/ListingCard.js:80:            <View style={styles.imgBox}>
mobile/src/components/ListingCard.js:83:      }} style={styles.img} /> : <View style={styles.imgPlaceholder} />}
mobile/src/components/ListingCard.js:87:                {boosted && <View style={styles.boostBadge}>
mobile/src/components/ListingCard.js:90:                    </View>}
mobile/src/components/ListingCard.js:91:                {isOwner && status === "paused" && <View style={[styles.statusBadge, {
mobile/src/components/ListingCard.js:95:                    </View>}
mobile/src/components/ListingCard.js:96:                {status === "sold" && <View style={[styles.statusBadge, {
mobile/src/components/ListingCard.js:100:                    </View>}
mobile/src/components/ListingCard.js:101:            </View>
mobile/src/components/ListingCard.js:102:            <View style={styles.body}>
mobile/src/components/ListingCard.js:104:                <View style={styles.footer}>
mobile/src/components/ListingCard.js:106:                </View>
mobile/src/components/ListingCard.js:107:                <View style={styles.cityRow}>
mobile/src/components/ListingCard.js:113:                </View>
mobile/src/components/ListingCard.js:114:            </View>
mobile/src/components/LocationPicker.js:15:import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, StyleSheet } from "react-native";
mobile/src/components/LocationPicker.js:21:// 🔒 URL is loaded from EXPO_PUBLIC_BACKEND_URL via the shared `api`
mobile/src/components/LocationPicker.js:22:// instance — never hardcode preview URLs here.
mobile/src/components/LocationPicker.js:91:        const detail = `${e?.response?.status || ""} ${e?.message || ""}`.trim();
mobile/src/components/LocationPicker.js:138:        const detail = `${e?.response?.status || ""} ${e?.message || ""}`.trim();
mobile/src/components/LocationPicker.js:163:    <View>
mobile/src/components/LocationPicker.js:165:        <View style={{ marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fca5a5" }}>
mobile/src/components/LocationPicker.js:172:        </View>
mobile/src/components/LocationPicker.js:175:        <View style={{ marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: palette.surfaceCard, borderWidth: 1, borderColor: palette.border }}>
mobile/src/components/LocationPicker.js:179:        </View>
mobile/src/components/LocationPicker.js:185:          <View key={lvl} style={styles.row}>
mobile/src/components/LocationPicker.js:199:          </View>
mobile/src/components/LocationPicker.js:204:        <View style={styles.modalBg}>
mobile/src/components/LocationPicker.js:205:          <View style={styles.sheet}>
mobile/src/components/LocationPicker.js:206:            <View style={styles.sheetHead}>
mobile/src/components/LocationPicker.js:211:            </View>
mobile/src/components/LocationPicker.js:212:            <View style={styles.search}>
mobile/src/components/LocationPicker.js:222:            </View>
mobile/src/components/LocationPicker.js:241:                    <View style={{ padding: 16 }}>
mobile/src/components/LocationPicker.js:245:                    </View>
mobile/src/components/LocationPicker.js:250:          </View>
mobile/src/components/LocationPicker.js:251:        </View>
mobile/src/components/LocationPicker.js:253:    </View>
mobile/src/components/NotificationBell.js:5:import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
mobile/src/components/NotificationBell.js:45:                <View style={styles.badge} testID="notification-bell-badge">
mobile/src/components/NotificationBell.js:47:                </View>
mobile/src/components/Skeleton.js:4:import { Animated, View, StyleSheet, Dimensions, Easing } from "react-native";
mobile/src/components/Skeleton.js:26:    return <Animated.View style={[styles.box, { width, height, opacity: op }, style]} />;
mobile/src/components/Skeleton.js:31:    return <Animated.View style={[styles.line, { width, height, opacity: op }, style]} />;
mobile/src/components/Skeleton.js:38:        <View style={[styles.cardWrap, { width: cardW }]} testID="skeleton-listing-card">
mobile/src/components/Skeleton.js:42:        </View>
mobile/src/components/Skeleton.js:49:        <View style={styles.grid} testID="skeleton-grid">
mobile/src/components/Skeleton.js:51:        </View>
mobile/src/components/Skeleton.js:58:        <View style={styles.grid} testID="skeleton-cat-grid">
mobile/src/components/Skeleton.js:62:        </View>
mobile/src/components/StandaloneFloatingTabBar.js:4:import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, I18nManager, Dimensions } from "react-native";
mobile/src/components/StandaloneFloatingTabBar.js:8:import { Home, Film, MessageCircle, User, Plus } from "lucide-react-native";
mobile/src/components/StandaloneFloatingTabBar.js:64:    { key: "ChatTab",    icon: MessageCircle, label: t("رسائلي") },
mobile/src/components/StandaloneFloatingTabBar.js:91:    <View pointerEvents="box-none" style={styles.wrap}>
mobile/src/components/StandaloneFloatingTabBar.js:92:      <View pointerEvents="box-none" style={[styles.fabAnchor, { bottom: fabBottom }]}>
mobile/src/components/StandaloneFloatingTabBar.js:93:        <Animated.View pointerEvents="none" style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
mobile/src/components/StandaloneFloatingTabBar.js:94:        <Animated.View pointerEvents="none" style={[styles.burstRing, { transform: [{ scale: burstScale }], opacity: burstOpacity }]} />
mobile/src/components/StandaloneFloatingTabBar.js:95:        <Animated.View style={{ transform: [{ scale: fabPress }] }}>
mobile/src/components/StandaloneFloatingTabBar.js:106:        </Animated.View>
mobile/src/components/StandaloneFloatingTabBar.js:107:      </View>
mobile/src/components/StandaloneFloatingTabBar.js:109:      <View style={[styles.barOuter, { width: W, height: barTotalH }]}>
mobile/src/components/StandaloneFloatingTabBar.js:113:        <View style={[styles.tabsRow, { height: BAR_HEIGHT }]}>
mobile/src/components/StandaloneFloatingTabBar.js:115:            if (tab.key === "_SPACER") return <View key="spacer" style={styles.spacer} />;
mobile/src/components/StandaloneFloatingTabBar.js:133:        </View>
mobile/src/components/StandaloneFloatingTabBar.js:134:      </View>
mobile/src/components/StandaloneFloatingTabBar.js:135:    </View>
mobile/src/components/Viewer360Mobile.js:2: * Lightweight 360° viewer for React Native — no 3D, no heavy libs.
mobile/src/components/Viewer360Mobile.js:8:import { View, Image, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder } from "react-native";
mobile/src/components/Viewer360Mobile.js:16:export default function Viewer360Mobile({
mobile/src/components/Viewer360Mobile.js:68:  return <View style={styles.wrap} {...panResponder.panHandlers} testID="viewer-360-mobile">
mobile/src/components/Viewer360Mobile.js:75:            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12} testID="viewer-360-mobile-close">
mobile/src/components/Viewer360Mobile.js:79:            <View style={styles.helpChip} pointerEvents="none">
mobile/src/components/Viewer360Mobile.js:81:            </View>
mobile/src/components/Viewer360Mobile.js:83:            <View style={styles.bottomBar}>
mobile/src/components/Viewer360Mobile.js:84:                <View style={styles.indexChip}>
mobile/src/components/Viewer360Mobile.js:85:                    <Text style={styles.indexText} testID="viewer-360-mobile-index">{index + 1} / {frameCount}</Text>
mobile/src/components/Viewer360Mobile.js:86:                </View>
mobile/src/components/Viewer360Mobile.js:87:                <TouchableOpacity onPress={() => setAutoSpin(s => !s)} style={[styles.spinBtn, autoSpin && styles.spinBtnActive]} testID="viewer-360-mobile-autospin">
mobile/src/components/Viewer360Mobile.js:90:            </View>
mobile/src/components/Viewer360Mobile.js:91:        </View>;
mobile/src/components/chatBgSvg.js:1:export const CHAT_BG_SVG = `<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg" style="background:#f9f6f1">
mobile/src/components/chatBgSvg.js:2:<g transform="translate(45.8,39.9) rotate(25) translate(-16.7,-16.7)" opacity="0.38"><svg x="0" y="0" width="33.4" height="33.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3-15h6"></path></svg></g>
mobile/src/components/chatBgSvg.js:3:<g transform="translate(124.7,33.7) rotate(0) translate(-26.0,-26.0)" opacity="0.32"><svg x="0" y="0" width="52.0" height="52.0" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18M4 6h16a1 1 0 0 1 1 1v9H3V7a1 1 0 0 1 1-1zm4 6h8"></path></svg></g>
mobile/src/components/chatBgSvg.js:4:<g transform="translate(193.3,45.5) rotate(-5) translate(-20.7,-20.7)" opacity="0.33"><svg x="0" y="0" width="41.4" height="41.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h20v12H2V8zm7-5 3 4 3-4m-3 4v1"></path></svg></g>
mobile/src/components/chatBgSvg.js:5:<g transform="translate(276.3,42.1) rotate(25) translate(-26.8,-26.8)" opacity="0.30"><svg x="0" y="0" width="53.5" height="53.5" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-12h4"></path></svg></g>
mobile/src/components/chatBgSvg.js:6:<g transform="translate(346.4,42.3) rotate(5) translate(-17.9,-17.9)" opacity="0.29"><svg x="0" y="0" width="35.8" height="35.8" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11zm-11-3a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path></svg></g>
mobile/src/components/chatBgSvg.js:7:<g transform="translate(43.8,118.0) rotate(-5) translate(-23.6,-23.6)" opacity="0.31"><svg x="0" y="0" width="47.2" height="47.2" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5zm16 0a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z"></path></svg></g>
mobile/src/components/chatBgSvg.js:8:<g transform="translate(125.9,106.4) rotate(-15) translate(-19.7,-19.7)" opacity="0.31"><svg x="0" y="0" width="39.3" height="39.3" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4m-2-2v4M18 11h.01M16 13h.01M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"></path></svg></g>
mobile/src/components/chatBgSvg.js:9:<g transform="translate(190.0,119.2) rotate(0) translate(-25.3,-25.3)" opacity="0.32"><svg x="0" y="0" width="50.6" height="50.6" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2m-12 0v4h12v-4H6z"></path></svg></g>
mobile/src/components/chatBgSvg.js:10:<g transform="translate(280.6,106.4) rotate(0) translate(-23.0,-23.0)" opacity="0.35"><svg x="0" y="0" width="45.9" height="45.9" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3V3zm9 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 0c-2-1.5-2-3.5 0-5s2-3.5 0-5M6 6h.01"></path></svg></g>
mobile/src/components/chatBgSvg.js:11:<g transform="translate(353.7,121.5) rotate(0) translate(-20.9,-20.9)" opacity="0.33"><svg x="0" y="0" width="41.9" height="41.9" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14a1 1 0 0 1 1 1v19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm-1 9h16M9 6v3"></path></svg></g>
mobile/src/components/chatBgSvg.js:12:<g transform="translate(46.8,197.2) rotate(25) translate(-17.4,-17.4)" opacity="0.26"><svg x="0" y="0" width="34.9" height="34.9" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h20v8H2V8zm3 4h14M12 4v4m0 8v4m-4-1 1.5-3m5 3-1.5-3M7 6l1.5 2m7-2-1.5 2"></path></svg></g>
mobile/src/components/chatBgSvg.js:13:<g transform="translate(119.1,186.2) rotate(25) translate(-24.9,-24.9)" opacity="0.33"><svg x="0" y="0" width="49.9" height="49.9" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a6 6 0 0 1 6 6v8a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6zm-3 6h6m-6 4h6"></path></svg></g>
mobile/src/components/chatBgSvg.js:14:<g transform="translate(185.8,192.9) rotate(-25) translate(-16.9,-16.9)" opacity="0.29"><svg x="0" y="0" width="33.9" height="33.9" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14l2-5h12l2 5M4 14v4h1a2 2 0 0 0 4 0h6a2 2 0 0 0 4 0h1v-4H4zm3 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM6 9l1.5-3h9L18 9"></path></svg></g>
mobile/src/components/chatBgSvg.js:15:<g transform="translate(269.6,186.1) rotate(-15) translate(-20.3,-20.3)" opacity="0.28"><svg x="0" y="0" width="40.5" height="40.5" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h13v10H1V8zm13 3h4l3 3v4h-7V11zm-9 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm-9-9V4h11v4"></path></svg></g>
mobile/src/components/chatBgSvg.js:16:<g transform="translate(359.0,190.9) rotate(-25) translate(-19.8,-19.8)" opacity="0.33"><svg x="0" y="0" width="39.7" height="39.7" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15V9h9v10H2v-4zm9-6h7l3 4v6h-10V9zm-6 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"></path></svg></g>
mobile/src/components/chatBgSvg.js:17:<g transform="translate(42.1,276.4) rotate(5) translate(-17.4,-17.4)" opacity="0.30"><svg x="0" y="0" width="34.8" height="34.8" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 14h3l2-4h4l2 3h1M13 10l1-3h3"></path></svg></g>
mobile/src/components/chatBgSvg.js:18:<g transform="translate(108.0,270.5) rotate(-5) translate(-19.1,-19.1)" opacity="0.36"><svg x="0" y="0" width="38.3" height="38.3" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM9 9l1-3h4l2 3M8 17l4-8h3"></path></svg></g>
mobile/src/components/chatBgSvg.js:19:<g transform="translate(205.0,275.6) rotate(15) translate(-25.8,-25.8)" opacity="0.30"><svg x="0" y="0" width="51.6" height="51.6" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3V5zm0 5h18M7 5v14m10-14v14M5 5V3h14v2M7 17a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm8 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"></path></svg></g>
mobile/src/components/chatBgSvg.js:20:<g transform="translate(276.0,274.6) rotate(25) translate(-24.5,-24.5)" opacity="0.34"><svg x="0" y="0" width="49.0" height="49.0" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-9"></path></svg></g>
mobile/src/components/chatBgSvg.js:21:<g transform="translate(343.0,275.8) rotate(-15) translate(-22.7,-22.7)" opacity="0.39"><svg x="0" y="0" width="45.4" height="45.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M3 21h18M9 21v-5h6v5M7 8h2v2H7V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8zm-8 5h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"></path></svg></g>
mobile/src/components/chatBgSvg.js:22:<g transform="translate(46.7,352.1) rotate(-15) translate(-25.1,-25.1)" opacity="0.38"><svg x="0" y="0" width="50.1" height="50.1" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V9zm0 2h20v4H2v-4zm2 4v2m16-2v2M5 7V5h14v2"></path></svg></g>
mobile/src/components/chatBgSvg.js:23:<g transform="translate(109.4,337.2) rotate(-15) translate(-23.0,-23.0)" opacity="0.30"><svg x="0" y="0" width="46.1" height="46.1" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 20h20M2 14h20M6 10V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"></path></svg></g>
mobile/src/components/chatBgSvg.js:24:<g transform="translate(199.9,338.5) rotate(-15) translate(-24.2,-24.2)" opacity="0.25"><svg x="0" y="0" width="48.4" height="48.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"></path></svg></g>
mobile/src/components/chatBgSvg.js:25:<g transform="translate(275.4,349.6) rotate(-25) translate(-26.4,-26.4)" opacity="0.33"><svg x="0" y="0" width="52.8" height="52.8" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l2 2m-2-8a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM9 3h6l.5 2.5h-7L9 3zm-.5 16.5h7l-.5 2.5H9l-.5-2.5z"></path></svg></g>
mobile/src/components/chatBgSvg.js:26:<g transform="translate(349.1,341.0) rotate(0) translate(-23.9,-23.9)" opacity="0.36"><svg x="0" y="0" width="47.7" height="47.7" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3 6h18M16 10a4 4 0 0 1-8 0"></path></svg></g>
mobile/src/components/chatBgSvg.js:27:<g transform="translate(39.5,428.9) rotate(0) translate(-24.6,-24.6)" opacity="0.40"><svg x="0" y="0" width="49.2" height="49.2" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l3 6-9 12L3 9l3-6zm-3 6h18M12 21 6.5 9m5.5 12 5.5-12"></path></svg></g>
mobile/src/components/chatBgSvg.js:28:<g transform="translate(116.7,422.6) rotate(-25) translate(-22.4,-22.4)" opacity="0.38"><svg x="0" y="0" width="44.9" height="44.9" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14M4 8h4M4 16h4M18 5v14m-2-11h4m-4 8h4M10 12h4"></path></svg></g>
mobile/src/components/chatBgSvg.js:29:<g transform="translate(196.3,418.7) rotate(-5) translate(-17.6,-17.6)" opacity="0.35"><svg x="0" y="0" width="35.2" height="35.2" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5 3 8H9l3-8zm0 0-5 3m5-3 5 3m-8 5-3 3m11-3 3 3m-14 0h10"></path></svg></g>
mobile/src/components/chatBgSvg.js:30:<g transform="translate(266.5,415.0) rotate(15) translate(-23.9,-23.9)" opacity="0.38"><svg x="0" y="0" width="47.7" height="47.7" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18c-1 0-4-1-4-5s3-5 4-5m6 10c1 0 4-1 4-5s-3-5-4-5M9 18h6M9 13h6m-3-4V2m0 0-3 2m3-2 3 2"></path></svg></g>
mobile/src/components/chatBgSvg.js:31:<g transform="translate(347.4,414.4) rotate(-15) translate(-18.8,-18.8)" opacity="0.34"><svg x="0" y="0" width="37.7" height="37.7" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l3 9h10l1-9H3zM9 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 6H1"></path></svg></g>
mobile/src/components/chatBgSvg.js:32:<g transform="translate(37.0,498.5) rotate(-25) translate(-21.1,-21.1)" opacity="0.32"><svg x="0" y="0" width="42.3" height="42.3" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM8 7h8M8 11h8m-8 4h5"></path></svg></g>
mobile/src/components/chatBgSvg.js:33:<g transform="translate(126.4,495.3) rotate(25) translate(-22.4,-22.4)" opacity="0.33"><svg x="0" y="0" width="44.7" height="44.7" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3-15h6"></path></svg></g>
mobile/src/components/chatBgSvg.js:34:<g transform="translate(188.2,500.7) rotate(-5) translate(-24.8,-24.8)" opacity="0.34"><svg x="0" y="0" width="49.5" height="49.5" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18M4 6h16a1 1 0 0 1 1 1v9H3V7a1 1 0 0 1 1-1zm4 6h8"></path></svg></g>
mobile/src/components/chatBgSvg.js:35:<g transform="translate(277.8,500.4) rotate(5) translate(-20.8,-20.8)" opacity="0.40"><svg x="0" y="0" width="41.6" height="41.6" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h20v12H2V8zm7-5 3 4 3-4m-3 4v1"></path></svg></g>
mobile/src/components/chatBgSvg.js:36:<g transform="translate(355.3,493.4) rotate(-15) translate(-19.5,-19.5)" opacity="0.31"><svg x="0" y="0" width="39.0" height="39.0" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-12h4"></path></svg></g>
mobile/src/components/chatBgSvg.js:37:<g transform="translate(43.7,574.8) rotate(15) translate(-18.2,-18.2)" opacity="0.28"><svg x="0" y="0" width="36.3" height="36.3" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11zm-11-3a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path></svg></g>
mobile/src/components/chatBgSvg.js:38:<g transform="translate(125.6,567.1) rotate(25) translate(-17.2,-17.2)" opacity="0.35"><svg x="0" y="0" width="34.5" height="34.5" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5zm16 0a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z"></path></svg></g>
mobile/src/components/chatBgSvg.js:39:<g transform="translate(188.8,570.3) rotate(-5) translate(-23.7,-23.7)" opacity="0.32"><svg x="0" y="0" width="47.3" height="47.3" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4m-2-2v4M18 11h.01M16 13h.01M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"></path></svg></g>
mobile/src/components/chatBgSvg.js:40:<g transform="translate(270.8,573.5) rotate(-5) translate(-21.5,-21.5)" opacity="0.32"><svg x="0" y="0" width="43.0" height="43.0" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2m-12 0v4h12v-4H6z"></path></svg></g>
mobile/src/components/chatBgSvg.js:41:<g transform="translate(344.8,573.2) rotate(5) translate(-25.6,-25.6)" opacity="0.24"><svg x="0" y="0" width="51.1" height="51.1" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3V3zm9 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 0c-2-1.5-2-3.5 0-5s2-3.5 0-5M6 6h.01"></path></svg></g>
mobile/src/components/chatBgSvg.js:42:<g transform="translate(40.9,651.5) rotate(0) translate(-22.9,-22.9)" opacity="0.26"><svg x="0" y="0" width="45.8" height="45.8" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14a1 1 0 0 1 1 1v19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm-1 9h16M9 6v3"></path></svg></g>
mobile/src/components/chatBgSvg.js:43:<g transform="translate(116.4,659.3) rotate(-5) translate(-22.3,-22.3)" opacity="0.32"><svg x="0" y="0" width="44.6" height="44.6" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h20v8H2V8zm3 4h14M12 4v4m0 8v4m-4-1 1.5-3m5 3-1.5-3M7 6l1.5 2m7-2-1.5 2"></path></svg></g>
mobile/src/components/chatBgSvg.js:44:<g transform="translate(195.1,646.2) rotate(-5) translate(-18.7,-18.7)" opacity="0.39"><svg x="0" y="0" width="37.4" height="37.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a6 6 0 0 1 6 6v8a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6zm-3 6h6m-6 4h6"></path></svg></g>
mobile/src/components/chatBgSvg.js:45:<g transform="translate(274.1,657.6) rotate(15) translate(-24.7,-24.7)" opacity="0.35"><svg x="0" y="0" width="49.4" height="49.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14l2-5h12l2 5M4 14v4h1a2 2 0 0 0 4 0h6a2 2 0 0 0 4 0h1v-4H4zm3 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM6 9l1.5-3h9L18 9"></path></svg></g>
mobile/src/components/chatBgSvg.js:46:<g transform="translate(348.2,643.2) rotate(5) translate(-20.9,-20.9)" opacity="0.31"><svg x="0" y="0" width="41.8" height="41.8" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h13v10H1V8zm13 3h4l3 3v4h-7V11zm-9 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm-9-9V4h11v4"></path></svg></g>
mobile/src/components/chatBgSvg.js:47:<g transform="translate(31.4,725.5) rotate(15) translate(-23.8,-23.8)" opacity="0.38"><svg x="0" y="0" width="47.6" height="47.6" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15V9h9v10H2v-4zm9-6h7l3 4v6h-10V9zm-6 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"></path></svg></g>
mobile/src/components/chatBgSvg.js:48:<g transform="translate(122.9,736.0) rotate(-15) translate(-21.9,-21.9)" opacity="0.40"><svg x="0" y="0" width="43.8" height="43.8" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 14h3l2-4h4l2 3h1M13 10l1-3h3"></path></svg></g>
mobile/src/components/chatBgSvg.js:49:<g transform="translate(188.8,733.5) rotate(25) translate(-26.2,-26.2)" opacity="0.39"><svg x="0" y="0" width="52.4" height="52.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM9 9l1-3h4l2 3M8 17l4-8h3"></path></svg></g>
mobile/src/components/chatBgSvg.js:50:<g transform="translate(277.3,730.8) rotate(-5) translate(-22.3,-22.3)" opacity="0.29"><svg x="0" y="0" width="44.5" height="44.5" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18v14H3V5zm0 5h18M7 5v14m10-14v14M5 5V3h14v2M7 17a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm8 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"></path></svg></g>
mobile/src/components/chatBgSvg.js:51:<g transform="translate(342.2,737.3) rotate(-25) translate(-20.7,-20.7)" opacity="0.35"><svg x="0" y="0" width="41.5" height="41.5" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-9"></path></svg></g>
mobile/src/components/chatBgSvg.js:52:<g transform="translate(35.8,797.5) rotate(5) translate(-22.5,-22.5)" opacity="0.35"><svg x="0" y="0" width="45.0" height="45.0" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M3 21h18M9 21v-5h6v5M7 8h2v2H7V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8zm-8 5h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"></path></svg></g>
mobile/src/components/chatBgSvg.js:53:<g transform="translate(110.2,805.6) rotate(25) translate(-26.0,-26.0)" opacity="0.29"><svg x="0" y="0" width="52.1" height="52.1" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V9zm0 2h20v4H2v-4zm2 4v2m16-2v2M5 7V5h14v2"></path></svg></g>
mobile/src/components/chatBgSvg.js:54:<g transform="translate(185.3,801.0) rotate(5) translate(-19.7,-19.7)" opacity="0.35"><svg x="0" y="0" width="39.4" height="39.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 20h20M2 14h20M6 10V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"></path></svg></g>
mobile/src/components/chatBgSvg.js:55:<g transform="translate(263.4,802.2) rotate(-5) translate(-19.2,-19.2)" opacity="0.33"><svg x="0" y="0" width="38.4" height="38.4" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"></path></svg></g>
mobile/src/components/chatBgSvg.js:56:<g transform="translate(357.6,802.7) rotate(-5) translate(-24.5,-24.5)" opacity="0.37"><svg x="0" y="0" width="49.1" height="49.1" viewBox="0 0 24 24" fill="none" stroke="#c8a97a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l2 2m-2-8a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM9 3h6l.5 2.5h-7L9 3zm-.5 16.5h7l-.5 2.5H9l-.5-2.5z"></path></svg></g>
mobile/src/notifications.js:23: * Route a tapped notification → navigate to the listing/chat/etc.
mobile/src/notifications.js:25: * "/chat?to=xyz"). We open it via the harajplus:// scheme so deep-link
mobile/src/notifications.js:49:    // Seller profile
mobile/src/notifications.js:50:    m = url.match(/^\/seller\/([^/?#]+)/);
mobile/src/notifications.js:51:    if (m && _navigationRef?.navigate) { _navigationRef.navigate("SellerProfile", { sellerId: m[1] }); return; }
mobile/src/notifications.js:52:    // Chat
mobile/src/notifications.js:53:    m = url.match(/^\/chat(\?to=([^&]+))?/);
mobile/src/notifications.js:56:        _navigationRef.navigate("Chat", to ? { to } : {});
mobile/src/screens/AIAssistantScreen.js:3:import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
mobile/src/screens/AIAssistantScreen.js:27:  const [messages, setMessages] = useState([]);
mobile/src/screens/AIAssistantScreen.js:35:          setMessages(JSON.parse(raw));
mobile/src/screens/AIAssistantScreen.js:41:    AsyncStorage.setItem(HIST_KEY, JSON.stringify(messages.slice(-30))).catch(() => {});
mobile/src/screens/AIAssistantScreen.js:45:  }, [messages]);
mobile/src/screens/AIAssistantScreen.js:50:    const next = [...messages, {
mobile/src/screens/AIAssistantScreen.js:54:    setMessages(next);
mobile/src/screens/AIAssistantScreen.js:62:        message: text,
mobile/src/screens/AIAssistantScreen.js:66:      setMessages([...next, {
mobile/src/screens/AIAssistantScreen.js:72:      setMessages([...next, {
mobile/src/screens/AIAssistantScreen.js:83:    setMessages([]);
mobile/src/screens/AIAssistantScreen.js:85:  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
mobile/src/screens/AIAssistantScreen.js:90:            <View style={styles.header}>
mobile/src/screens/AIAssistantScreen.js:98:                <View style={styles.headerInner}>
mobile/src/screens/AIAssistantScreen.js:99:                    <View style={styles.botIcon}><Bot size={20} color={colors.primary} /></View>
mobile/src/screens/AIAssistantScreen.js:100:                    <View style={{
mobile/src/screens/AIAssistantScreen.js:105:                    </View>
mobile/src/screens/AIAssistantScreen.js:106:                    {messages.length > 0 && <TouchableOpacity onPress={reset} style={styles.resetBtn}>
mobile/src/screens/AIAssistantScreen.js:109:                </View>
mobile/src/screens/AIAssistantScreen.js:110:            </View>
mobile/src/screens/AIAssistantScreen.js:112:            {/* Messages */}
mobile/src/screens/AIAssistantScreen.js:113:            {messages.length === 0 ? <View style={styles.empty}>
mobile/src/screens/AIAssistantScreen.js:121:                </View> : <FlatList ref={listRef} data={messages} keyExtractor={(_, i) => String(i)} contentContainerStyle={{
mobile/src/screens/AIAssistantScreen.js:127:      return <View style={[styles.bubbleWrap, {
mobile/src/screens/AIAssistantScreen.js:130:                                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
mobile/src/screens/AIAssistantScreen.js:134:                                </View>
mobile/src/screens/AIAssistantScreen.js:135:                            </View>;
mobile/src/screens/AIAssistantScreen.js:136:    }} ListFooterComponent={busy ? <View style={[styles.bubbleWrap, {
mobile/src/screens/AIAssistantScreen.js:139:                            <View style={[styles.bubble, styles.botBubble, {
mobile/src/screens/AIAssistantScreen.js:149:                            </View>
mobile/src/screens/AIAssistantScreen.js:150:                        </View> : null} />}
mobile/src/screens/AIAssistantScreen.js:153:            <View style={styles.inputBar}>
mobile/src/screens/AIAssistantScreen.js:160:            </View>
mobile/src/screens/AIAssistantScreen.js:161:        </KeyboardAvoidingView>;
mobile/src/screens/AuctionsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Modal, TextInput, FlatList, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
mobile/src/screens/AuctionsScreen.js:55:  return <ScrollView style={{
mobile/src/screens/AuctionsScreen.js:66:            <View style={[styles.hero, shadow.card]}>
mobile/src/screens/AuctionsScreen.js:74:                <View style={styles.heroRow}>
mobile/src/screens/AuctionsScreen.js:75:                    <View style={styles.heroIconBox}><Gavel size={26} color={colors.secondary} /></View>
mobile/src/screens/AuctionsScreen.js:76:                    <View style={{
mobile/src/screens/AuctionsScreen.js:81:                    </View>
mobile/src/screens/AuctionsScreen.js:82:                </View>
mobile/src/screens/AuctionsScreen.js:83:                <View style={styles.chipsRow}>
mobile/src/screens/AuctionsScreen.js:84:                    <View style={styles.chip}><Sparkles size={11} color={colors.accent} /><Text style={styles.chipText}>{t("مزايدة فورية")}</Text></View>
mobile/src/screens/AuctionsScreen.js:85:                    <View style={styles.chip}><Users size={11} color={colors.primary} /><Text style={styles.chipText}>{t("من جميع الدول")}</Text></View>
mobile/src/screens/AuctionsScreen.js:86:                </View>
mobile/src/screens/AuctionsScreen.js:87:            </View>
mobile/src/screens/AuctionsScreen.js:90:            <View style={styles.listHead}>
mobile/src/screens/AuctionsScreen.js:91:                <View style={{
mobile/src/screens/AuctionsScreen.js:98:                </View>
mobile/src/screens/AuctionsScreen.js:102:            </View>
mobile/src/screens/AuctionsScreen.js:106:    }} /> : items.length === 0 ? <View style={styles.empty}>
mobile/src/screens/AuctionsScreen.js:109:                </View> : items.map(l => <AuctionCard key={l.id} listing={l} onBid={() => setActive(l)} />)}
mobile/src/screens/AuctionsScreen.js:115:        </ScrollView>;
mobile/src/screens/AuctionsScreen.js:126:  return <View style={[styles.card, shadow.card]}>
mobile/src/screens/AuctionsScreen.js:130:                <View style={styles.cardImgBox}>
mobile/src/screens/AuctionsScreen.js:136:        }} /> : <View style={{
mobile/src/screens/AuctionsScreen.js:140:                    <View style={styles.liveBadge}>
mobile/src/screens/AuctionsScreen.js:141:                        <View style={styles.liveDot} />
mobile/src/screens/AuctionsScreen.js:143:                    </View>
mobile/src/screens/AuctionsScreen.js:144:                    <View style={styles.bidsBadge}>
mobile/src/screens/AuctionsScreen.js:147:                    </View>
mobile/src/screens/AuctionsScreen.js:148:                </View>
mobile/src/screens/AuctionsScreen.js:150:            <View style={{
mobile/src/screens/AuctionsScreen.js:155:                <View style={styles.cardFoot}>
mobile/src/screens/AuctionsScreen.js:156:                    <View>
mobile/src/screens/AuctionsScreen.js:159:                    </View>
