# Phase 2 architecture matrix

## Repository state
[31m??[m pasted_content_6_master_plan_2026-08-17.md
[31m??[m phase1_completion_gate_2026-08-17.md
[31m??[m phase1_project_inventory_2026-08-17.md
[31m??[m phase2_architecture_matrix_2026-08-17.md
[33mbaf81b2[m fix: close notification translation and mobile search gaps
[33m752775b[m complete provider controls and audit evidence
[33m3be60e8[m audit and harden cross-platform marketplace flows

## Backend endpoints
@api.delete("/admin/demo-listings"
@api.delete("/blocks/{target_id}"
@api.delete("/buy-requests/{request_id}"
@api.delete("/chat/messages/{message_id}"
@api.delete("/favorites/{listing_id}"
@api.delete("/follow/category/{name}"
@api.delete("/listing-comments/{comment_id}"
@api.delete("/listings/{listing_id}"
@api.delete("/listings/{listing_id}/boost"
@api.delete("/price-alerts/{listing_id}"
@api.delete("/push/unregister"
@api.delete("/search/history"
@api.delete("/search/saved/{sid}"
@api.delete("/users/me/draft-listing"
@api.delete("/watches/{listing_id}"
@api.get("/"
@api.get("/admin/ai/config"
@api.get("/ads"
@api.get("/ai/assistant/history"
@api.get("/ai/price-badge/{listing_id}"
@api.get("/ai/providers/status"
@api.get("/auctions/active"
@api.get("/auctions/{listing_id}/bids"
@api.get("/auth/apple/start"
@api.get("/auth/google/start"
@api.get("/auth/me"
@api.get("/auth/me/stats"
@api.get("/auth/providers"
@api.get("/auth/snapchat/start"
@api.get("/auth/verify-email"
@api.get("/auth/x/start"
@api.get("/blocks/{target_id}/status"
@api.get("/buy-requests"
@api.get("/buy-requests/mine"
@api.get("/chat/conversations"
@api.get("/chat/location-share/{share_id}"
@api.get("/chat/messages/{convo_id}"
@api.get("/chat/presence/{user_id}"
@api.get("/cloudinary/signature"
@api.get("/coins/ledger"
@api.get("/coins/me"
@api.get("/cron/daily-digest"
@api.get("/deals/today"
@api.get("/favorites"
@api.get("/favorites/{listing_id}/check"
@api.get("/following"
@api.get("/geo/cities"
@api.get("/geo/detect-country"
@api.get("/geo/districts"
@api.get("/geo/reverse"
@api.get("/geo/search"
@api.get("/health", include_in_schema=False
@api.get("/health/ready", include_in_schema=False
@api.get("/listings"
@api.get("/listings/by-slug/{slug}"
@api.get("/listings/map/nearby"
@api.get("/listings/me/mine"
@api.get("/listings/recent"
@api.get("/listings/recommended"
@api.get("/listings/trending"
@api.get("/listings/{listing_id}"
@api.get("/listings/{listing_id}/applications"
@api.get("/listings/{listing_id}/comments"
@api.get("/listings/{listing_id}/like/check"
@api.get("/listings/{listing_id}/neighbors"
@api.get("/listings/{listing_id}/offers"
@api.get("/listings/{listing_id}/similar"
@api.get("/meta/car-brands"
@api.get("/meta/car-models"
@api.get("/meta/car-trims"
@api.get("/meta/categories"
@api.get("/meta/countries"
@api.get("/meta/phone-brands"
@api.get("/meta/phone-models"
@api.get("/meta/phone-variants"
@api.get("/meta/theme"
@api.get("/notifications"
@api.get("/notifications/unread-count"
@api.get("/offers/mine"
@api.get("/price-alerts"
@api.get("/push/preferences"
@api.get("/push/web/vapid-public-key"
@api.get("/referral/leaderboard"
@api.get("/referral/me"
@api.get("/robots.txt", include_in_schema=False
@api.get("/search"
@api.get("/search/history"
@api.get("/search/saved"
@api.get("/search/suggest"
@api.get("/search/trending"
@api.get("/sellers/{seller_id}"
@api.get("/sellers/{seller_id}/follow-status"
@api.get("/sellers/{seller_id}/listings"
@api.get("/sellers/{seller_id}/ratings"
@api.get("/sellers/{seller_id}/trust"
@api.get("/seo/indexnow/key", include_in_schema=False
@api.get("/seo/listing/{listing_id}", include_in_schema=False
@api.get("/sitemap.xml", include_in_schema=False
@api.get("/static-pages/{slug}"
@api.get("/support/tickets"
@api.get("/support/tickets/{ticket_id}"
@api.get("/users/me/notifications/settings"
@api.get("/users/me/resume"
@api.get("/voice/ice-servers"
@api.get("/wallet/me"
@api.get("/wallet/transactions"
@api.get("/watches"
@api.patch("/job-applications/{application_id}"
@api.patch("/listing-offers/{offer_id}"
@api.post("/admin/digest/test"
@api.post("/ads/{aid}/click"
@api.post("/ads/{aid}/impression"
@api.post("/ai/assistant"
@api.post("/ai/image-search"
@api.post("/ai/listing-autofill"
@api.post("/ai/price-suggest"
@api.post("/ai/suggest-category"
@api.post("/ai/transcribe"
@api.post("/ai/translate"
@api.post("/analytics/events"
@api.post("/auctions/{listing_id}/bid"
@api.post("/auth/apple/native"
@api.post("/auth/forgot-password"
@api.post("/auth/google"
@api.post("/auth/login"
@api.post("/auth/logout"
@api.post("/auth/refresh"
@api.post("/auth/register"
@api.post("/auth/request-account-deletion"
@api.post("/auth/resend-verification"
@api.post("/auth/reset-password"
@api.post("/auth/snapchat/callback"
@api.post("/auth/x/callback"
@api.post("/blocks/{target_id}"
@api.post("/buy-requests"
@api.post("/chat/location-share"
@api.post("/chat/location-share/{share_id}/stop"
@api.post("/chat/messages/{message_id}/react"
@api.post("/chat/send"
@api.post("/coins/spend"
@api.post("/contact"
@api.post("/cron/daily-digest"
@api.post("/favorites/{listing_id}"
@api.post("/follow/category/{name}"
@api.post("/listings"
@api.post("/listings/suggest-price"
@api.post("/listings/{listing_id}/applications"
@api.post("/listings/{listing_id}/boost"
@api.post("/listings/{listing_id}/click"
@api.post("/listings/{listing_id}/comments"
@api.post("/listings/{listing_id}/like"
@api.post("/listings/{listing_id}/mark-sold"
@api.post("/listings/{listing_id}/offers"
@api.post("/listings/{listing_id}/pause"
@api.post("/listings/{listing_id}/republish"
@api.post("/listings/{listing_id}/resume"
@api.post("/listings/{listing_id}/view"
@api.post("/notifications/read-all"
@api.post("/notifications/{nid}/read"
@api.post("/price-alerts/{listing_id}"
@api.post("/push/register"
@api.post("/push/test"
@api.post("/push/web/subscribe"
@api.post("/push/web/unsubscribe"
@api.post("/reports"
@api.post("/search/log"
@api.post("/search/save"
@api.post("/sellers/{seller_id}/follow"
@api.post("/sellers/{seller_id}/ratings"
@api.post("/seo/indexnow/resubmit-all", include_in_schema=False
@api.post("/support/tickets"
@api.post("/support/tickets/{ticket_id}/replies"
@api.post("/users/me/draft-listing"
@api.post("/users/me/search-event"
@api.post("/wallet/claim-welcome-bonus"
@api.post("/wallet/spend"
@api.post("/wallet/topup"
@api.post("/watches"
@api.put("/admin/ai/config"
@api.put("/auth/me"
@api.put("/listings/{listing_id}"
@api.put("/push/preferences"
@api.put("/users/me"
@api.put("/users/me/notifications/settings"
@api.put("/users/me/resume"
@api.put("/users/me/storefront"
@app.get("/", include_in_schema=False
@app.get("/api/_metrics", include_in_schema=False
@app.get("/api/auth/google/callback", include_in_schema=False
@app.get("/api/auth/snapchat/callback", include_in_schema=False
@app.get("/api/auth/snapchat/callback-redirect", include_in_schema=False
@app.get("/api/auth/x/callback-redirect", include_in_schema=False
@app.get("/api/debug/db-check", include_in_schema=False
@app.get("/api/debug/listings-raw", include_in_schema=False
@app.get("/api/og/listing/{listing_id}", include_in_schema=False
@app.get("/health", include_in_schema=False
@app.get("/robots.txt", include_in_schema=False
@app.get("/sitemap.xml", include_in_schema=False
@app.get("/{key}.txt", include_in_schema=False
@app.post("/api/auth/apple/callback", include_in_schema=False
@router.get("/admin/import"
@router.get("/cache/stats"
@router.get("/children"
@router.get("/countries"
@router.get("/detect-country"
@router.get("/get/{loc_id}"
@router.get("/locate"
@router.get("/path/{loc_id}"
@router.post("/admin/import"

## Web routes
frontend/src/App.js:95:        <Routes>
frontend/src/App.js:96:            <Route path="/login" element={<LoginPage />} />
frontend/src/App.js:97:            <Route path="/register" element={<RegisterPage />} />
frontend/src/App.js:98:            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
frontend/src/App.js:99:            <Route path="/reset-password" element={<ResetPasswordPage />} />
frontend/src/App.js:100:            <Route path="/verify-email" element={<VerifyEmailPage />} />
frontend/src/App.js:101:            <Route path="/download" element={<DownloadPage />} />
frontend/src/App.js:102:            <Route path="/auth/callback" element={<AuthCallback />} />
frontend/src/App.js:103:            <Route path="/auth/google/callback" element={<AuthCallback />} />
frontend/src/App.js:104:            <Route path="/auth/x/callback" element={<XAuthCallback />} />
frontend/src/App.js:105:            <Route path="/auth/snapchat/callback" element={<SnapAuthCallback />} />
frontend/src/App.js:106:            <Route path="/" element={<Layout><HomePage /></Layout>} />
frontend/src/App.js:107:            <Route path="/category/:categoryKey" element={<Layout><CategoryPage /></Layout>} />
frontend/src/App.js:108:            <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />
frontend/src/App.js:109:            <Route path="/seller/:sellerId" element={<Layout><SellerStorefrontPage /></Layout>} />
frontend/src/App.js:110:            <Route path="/post" element={<Layout><PostListing /></Layout>} />
frontend/src/App.js:111:            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
frontend/src/App.js:112:            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
frontend/src/App.js:113:            <Route path="/favorites" element={<Layout><AccountCollectionPage /></Layout>} />
frontend/src/App.js:114:            <Route path="/my-listings" element={<Layout><AccountCollectionPage /></Layout>} />
frontend/src/App.js:115:            <Route path="/offers" element={<Layout><AccountCollectionPage /></Layout>} />
frontend/src/App.js:116:            <Route path="/following" element={<Layout><AccountCollectionPage /></Layout>} />
frontend/src/App.js:117:            <Route path="/saved-searches" element={<Layout><AccountCollectionPage /></Layout>} />
frontend/src/App.js:118:            <Route path="/buy-requests" element={<Layout><WorkflowPage kind="buy" /></Layout>} />
frontend/src/App.js:119:            <Route path="/support" element={<Layout><WorkflowPage kind="support" /></Layout>} />
frontend/src/App.js:120:            <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
frontend/src/App.js:121:            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
frontend/src/App.js:122:            <Route path="/map" element={<Layout><MapPage /></Layout>} />
frontend/src/App.js:123:            <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
frontend/src/App.js:124:            <Route path="/reels" element={<Layout><ReelsPage /></Layout>} />
frontend/src/App.js:125:            <Route path="/auctions" element={<Layout><AuctionsPage /></Layout>} />
frontend/src/App.js:126:            <Route path="/flights" element={<Layout><FlightsPage /></Layout>} />
frontend/src/App.js:127:            <Route path="/deals" element={<Layout><DealsPage /></Layout>} />
frontend/src/App.js:128:            <Route path="/wallet" element={<Layout><WalletPage /></Layout>} />
frontend/src/App.js:129:            <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
frontend/src/App.js:130:            <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
frontend/src/App.js:131:            <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
frontend/src/App.js:132:            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
frontend/src/App.js:133:            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
frontend/src/components/NotificationBell.js:150:                                    to={notificationUrl(n)}
frontend/src/components/layout/BottomNav.js:61:                to={to}
frontend/src/components/layout/BottomNav.js:96:                to="/post"
frontend/src/components/layout/BottomNav.js:121:                    <SideItem to="/" icon={Home} label={tr("الرئيسية")} navKey="home" />
frontend/src/components/layout/BottomNav.js:122:                    <SideItem to="/reels" icon={Film} label={tr("ستوري")} navKey="reels" />
frontend/src/components/layout/BottomNav.js:127:                    <SideItem to="/chat" icon={MessageCircle} label={tr("محادثة")} navKey="messages" badge={unread} />
frontend/src/components/layout/BottomNav.js:128:                    <SideItem to="/profile" icon={Menu} label={tr("المزيد")} navKey="more" />
frontend/src/components/layout/TopBar.js:152:                <Link to="/" className="flex items-baseline gap-1 select-none shrink-0" data-testid="logo-link">
frontend/src/components/layout/TopBar.js:285:                    <Link to="/login" data-testid="login-cta" className="bg-[var(--secondary)] dark:bg-[var(--accent)] text-white dark:text-[#0A1128] px-2.5 sm:px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs hover:scale-105 hover:shadow-lg transition-all font-arabic shrink-0 border border-white/15 whitespace-nowrap">
frontend/src/components/listings/ListingCard.js:53:            to={`/listing/${listing.id}`}
frontend/src/lib/notificationLinks.js:52:    if (senderId) return `/chat?to=${encodeURIComponent(senderId)}${listingId ? `&listing=${encodeURIComponent(listingId)}` : ""}`;
frontend/src/pages/AdminPage.js:472:                        <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic font-bold text-sm text-[var(--text)] hover:text-[var(--primary)] block">{l.title}</Link>
frontend/src/pages/AdminPage.js:579:                                            <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-bold text-[var(--text)] hover:text-[var(--primary)] text-xs">{(l.title || "").slice(0, 50)}</Link>
frontend/src/pages/AdminPage.js:644:        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="p-3 text-start">#</th><th className="p-3 text-start">{tr("الإعلان")}</th><th className="p-3 text-start">{tr("الحالة")}</th><th className="p-3 text-start">{tr("تاريخ الإنشاء")}</th><th className="p-3 text-start">{tr("الوسائط")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[var(--border)]/50"><td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td><td className="p-3"><Link to={`/listing/${item.id}`} target="_blank" rel="noreferrer" className="font-bold hover:text-[var(--primary)]">{item.title || item.id}</Link></td><td className="p-3">{item.status || "—"}</td><td className="p-3 font-latin">{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td><td className="p-3 font-latin">{(item.images?.length || 0) + (item.videos?.length || 0)}</td></tr>)}{!loading && items.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-[var(--text-muted)]">{tr("لا توجد إعلانات مطابقة")}</td></tr>}</tbody></table></div></div>
frontend/src/pages/AdminPage.js:713:                            <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic-body text-[var(--text)] hover:text-[var(--primary)] truncate">{l.title || l.id}</Link>
frontend/src/pages/AdminPage.js:885:                                                <Link to={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="font-arabic font-bold text-xs text-[var(--text)] hover:text-[var(--primary)] block truncate">{l.title}</Link>
frontend/src/pages/AdminPage.js:944:                                    <Link to={`/listing/${r.target_id}`} target="_blank" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-1.5 rounded-full text-xs font-bold mt-1">
frontend/src/pages/AuctionsPage.js:71:                <Link to="/post" data-testid="auction-create-btn" className="bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] rounded-full px-4 py-1.5 text-xs font-bold font-arabic">
frontend/src/pages/AuctionsPage.js:90:                    <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{tr("أنشئ أول مزاد")}</Link>
frontend/src/pages/AuctionsPage.js:109:            <Link to={`/listing/${listing.id}`} className="block aspect-[5/3] bg-[var(--surface-elevated)] overflow-hidden relative">
frontend/src/pages/AuctionsPage.js:209:            navigate("/login");
frontend/src/pages/Auth.js:180:                    <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />{tr(" الرئيسية")}</Link>
frontend/src/pages/Auth.js:203:                        <Link to="/forgot-password" data-testid="forgot-password-link" className="text-xs text-[var(--primary)] font-bold font-arabic-body">{t("forgot_password")}</Link>
frontend/src/pages/Auth.js:213:                    {t("no_account")} <Link to="/register" data-testid="goto-register" className="text-[var(--primary)] font-bold">{t("register")}</Link>
frontend/src/pages/Auth.js:277:                    <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />{tr(" الرئيسية")}</Link>
frontend/src/pages/Auth.js:330:                    {t("already_have_account")} <Link to="/login" data-testid="goto-login" className="text-[var(--primary)] font-bold">{t("login")}</Link>
frontend/src/pages/Auth.js:357:                <Link to="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />{tr(" العودة")}</Link>
frontend/src/pages/Auth.js:373:                                        <Link to={resetLink} data-testid="dev-reset-link" className="bg-[var(--primary)] text-[var(--primary-fg)] inline-block px-4 py-2 rounded-full text-xs font-bold">{tr("إعادة تعيين الآن")}</Link>
frontend/src/pages/CategoryPage.js:98:            path={seoPath}
frontend/src/pages/CategoryPage.js:102:                <Link to="/" className="text-[var(--text-muted)] hover:text-[var(--primary)]"><ChevronLeft className="w-5 h-5 rotate-180" /></Link>
frontend/src/pages/ChatPage.js:40: * - Same-origin /listing/* URLs become <Link to="/listing/..."> so the
frontend/src/pages/ChatPage.js:61:                    <Link key={i} to={u.pathname + u.search + u.hash} className="underline text-[var(--primary)] break-all" data-testid="chat-msg-link">
frontend/src/pages/ChatPage.js:269:    // When the user opens the chat from a listing detail page (?to=<seller>&listing=<id>)
frontend/src/pages/ChatPage.js:680:            <Link to="/login" className="bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-bold">{t("login")}</Link>
frontend/src/pages/ChatPage.js:747:                                <Link to={`/listing/${listingCtx.slug || listingCtx.id}`} className="hp-chat-listing-card" data-testid="chat-listing-context" onClick={(e) => e.stopPropagation()}>
frontend/src/pages/DealsPage.js:55:                    <Link to="/" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">
frontend/src/pages/DealsPage.js:70:        <Link to={`/listing/${deal.id}`} data-testid={`deal-card-${deal.id}`} className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all flex flex-col relative">
frontend/src/pages/HomePage.js:133:                    <Link key={it.label} to={it.to} data-testid={`quick-${it.label}`} className={`relative bg-gradient-to-br ${it.color} rounded-2xl p-3 sm:p-4 border border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5 transition-all flex flex-col items-center gap-1.5`}>
frontend/src/pages/HomePage.js:160:                            <Link to="/post" data-testid="hero-post-btn" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 font-arabic">
frontend/src/pages/HomePage.js:163:                            <Link to="/map" data-testid="hero-map-btn" className="bg-white/10 backdrop-blur border border-white/30 text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-bold text-xs sm:text-sm hover:bg-white/20 transition-all font-arabic">
frontend/src/pages/HomePage.js:188:                        <Link key={c.key} to={`/category/${c.key}`} data-testid={`cat-${c.key}`}
frontend/src/pages/HomePage.js:285:        <Link to={`/listing/${listing.id}`} className="group flex bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all">
frontend/src/pages/HomePage.js:318:                    <Link to="/register" data-testid="cta-register-btn" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-5 py-2 font-bold text-xs sm:text-sm hover:bg-[var(--primary-hover)] font-arabic">{t("register")}</Link>
frontend/src/pages/ListingDetail.js:164:            {loadError && <Link to="/" className="inline-flex rounded-full bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 font-bold">{tr("العودة للرئيسية")}</Link>}
frontend/src/pages/ListingDetail.js:177:        nav(`/chat?to=${listing.user_id}&listing=${listing.id}`);
frontend/src/pages/ListingDetail.js:301:            <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-4 font-arabic"><ChevronLeft className="w-4 h-4 rotate-180" />{tr(" العودة")}</Link>
frontend/src/pages/ListingDetail.js:491:                                    <Link to={`/seller/${listing.user_id}`} className="hover:text-[var(--primary)] hover:underline">{listing.seller?.name}</Link>
frontend/src/pages/ListingDetail.js:566:                                    <Link to={`/seller/${listing.user_id}`} className="hover:text-[var(--primary)] hover:underline">{listing.seller?.name}</Link>
frontend/src/pages/ListingDetail.js:678:                                    nav(`/chat?to=${listing.seller.id}&listing_id=${listing.id}`);
frontend/src/pages/ProfilePage.js:206:                <Link to="/wallet" data-testid="menu-wallet" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:211:                <Link to="/notifications" data-testid="menu-notifications" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:216:                <Link to="/settings" data-testid="menu-settings" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:221:                <Link to="/about" data-testid="menu-about" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:226:                <Link to="/terms" data-testid="menu-terms" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:231:                <Link to="/privacy" data-testid="menu-privacy" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:236:                <Link to="/contact" data-testid="menu-contact" className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors">
frontend/src/pages/ProfilePage.js:266:                        <Link to="/post" data-testid="profile-post-cta" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2 rounded-full font-arabic font-bold text-sm">{t("cta_post")}</Link>
frontend/src/pages/ProfilePage.js:299:                            <Link key={offer.id} to={`/listing/${offer.listing_id}`} className="flex items-center gap-3 bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
frontend/src/pages/ReelsPage.js:49:        nav(`/chat?to=${l.user_id}&listing=${l.id}`);
frontend/src/pages/ReelsPage.js:70:                <Link to="/post" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-5 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("أنشر إعلان بفيديو")}</Link>
frontend/src/pages/ReelsPage.js:81:            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-fg)] px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
frontend/src/pages/ReelsPage.js:92:                            <Link to={`/listing/${l.id}`} className="block text-white mb-3">
frontend/src/pages/ReelsPage.js:102:                                    to={`/listing/${l.id}`}
frontend/src/pages/SearchAndMap.js:321:                                    <Link to={`/listing/${it.id}`} className="text-xs text-[var(--primary)] underline">{tr("عرض الإعلان")}</Link>
frontend/src/pages/StaticPages.js:35:                <Link to="/profile" className="text-[var(--text-muted)]"><ArrowLeft className="w-5 h-5" /></Link>
frontend/src/pages/StaticPages.js:68:                    <Link key={it.label} to={it.to} data-testid={`settings-${it.label}`} className="flex items-center gap-3 p-4 hover:bg-[var(--surface-elevated)]">
frontend/src/pages/StaticPages.js:91:            <Link to="/profile" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" />{tr(" العودة")}</Link>
frontend/src/pages/VerifyEmailPage.js:34:                        <Link to="/" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("الذهاب للرئيسية")}</Link>
frontend/src/pages/VerifyEmailPage.js:42:                        <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">{tr("العودة لتسجيل الدخول")}</Link>
frontend/src/pages/WalletPage.js:48:                <Link to="/login" className="inline-block bg-[var(--primary)] text-[var(--primary-fg)] px-6 py-2.5 rounded-full font-arabic font-bold text-sm">
frontend/src/pages/WalletPage.js:100:                <Link to="/my-listings" data-testid="boost-listing-link" className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
frontend/src/pages/SellerStorefrontPage.js:35:                        <Link to={`/chat?to=${seller.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm"><MessageCircle className="w-4 h-4" />{tr("تواصل مع المتجر")}</Link>
frontend/src/pages/SellerStorefrontPage.js:41:            <section><div className="flex items-center justify-between mb-3"><h2 className="font-arabic font-black text-xl text-[var(--text)]">{tr("كتالوج المتجر")}</h2><span className="text-xs text-[var(--text-muted)] font-arabic-body">{items.length} {tr("إعلان")}</span></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{items.map((item) => <Link key={item.id} to={`/listing/${item.id}`} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg transition-all"><div className="aspect-[4/3] bg-[var(--surface-elevated)]">{item.images?.[0] && <img src={item.images[0]} alt={item.title || ""} className="w-full h-full object-cover" loading="lazy" />}</div><div className="p-3"><div className="font-arabic font-bold text-sm text-[var(--text)] line-clamp-2 min-h-10">{item.title}</div><div className="mt-2 flex justify-between gap-2 text-xs"><b className="font-latin text-[var(--primary)]">{item.price ? `${Number(item.price).toLocaleString()} ${item.currency || ""}` : tr("السعر عند التواصل")}</b><span className="text-[var(--text-muted)]">{item.views || 0} {tr("مشاهدة")}</span></div></div></Link>)}</div>{items.length === 0 && <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-muted)] font-arabic-body">{tr("لا توجد إعلانات نشطة")}</div>}</section>
frontend/src/pages/NotificationsPage.js:25:    return <main className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-24 overflow-x-hidden" dir={direction} data-testid="notifications-page"><div className="flex items-center justify-between mb-5"><div><h1 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2"><Bell className="w-6 h-6 text-[var(--primary)]" />{tr("الإشعارات")}</h1><p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{tr("رسائل فورية، عروض، تحديثات الإعلانات والتنبيهات المهمة")}</p></div>{items.some((n) => !n.read) && <button onClick={markAll} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-arabic font-bold flex items-center gap-1"><CheckCheck className="w-4 h-4" />{tr("تعليم الكل كمقروء")}</button>}</div>{loading ? <div className="py-16 text-center text-[var(--text-muted)] font-arabic-body">{tr("جاري التحميل...")}</div> : items.length === 0 ? <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] font-arabic-body"><Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />{tr("لا توجد إشعارات بعد")}</div> : <div className="w-full max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">{items.map((n) => { const Icon = ICONS[n.type] || Bell; return <Link key={n.id} to={notificationUrl(n)} onClick={() => !n.read && markOne(n.id)} className={`flex gap-3 p-4 min-w-0 overflow-hidden border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-elevated)] ${!n.read ? "bg-[var(--primary)]/5" : ""}`}><div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center shrink-0 text-[var(--primary)]"><Icon className="w-5 h-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 min-w-0"><h2 className="font-arabic font-bold text-sm text-[var(--text)] truncate min-w-0">{n.title}</h2>{!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}</div>{n.body && <p className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{n.body}</p>}<time className="block text-[10px] text-[var(--text-muted)] mt-2">{new Date(n.created_at || n.ts).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</time></div>{!n.read && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}</Link>; })}</div>}</main>;
frontend/src/pages/AccountCollectionPage.js:74:      {!busy && !error && rows.length === 0 && <div className="py-20 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]"><Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" /><p className="font-arabic font-bold text-[var(--text)]">{t("لا توجد بيانات بعد")}</p><Link to="/" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-fg)] font-arabic font-bold text-sm">{t("استكشف الإعلانات")}</Link></div>}
frontend/src/pages/AccountCollectionPage.js:81:      {!busy && otherRows.length > 0 && <div className="space-y-3 mt-2">{otherRows.map((row, index) => <div key={row.id || row.search_id || row.user_id || index} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-arabic font-bold text-[var(--text)] truncate">{row.name || row.title || row.query || row.keyword || t("عنصر محفوظ")}</p><p className="text-xs text-[var(--text-muted)] font-arabic-body truncate">{row.description || row.city || row.country_code || row.status || ""}</p></div>{(row.listing_id || row.id) && config.key === "offers" && <Link to={`/listing/${row.listing_id || row.id}`} className="shrink-0 p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]" aria-label={t("فتح الإعلان")}><ExternalLink className="w-4 h-4" /></Link>}</div>)}</div>}

## Mobile screens/navigation
mobile/src/AuthContext.js
mobile/src/CountryContext.js
mobile/src/ErrorBoundary.js
mobile/src/I18nContext.js
mobile/src/ThemeContext.js
mobile/src/analytics.js
mobile/src/api.js
mobile/src/biometric.js
mobile/src/categoryIcons.js
mobile/src/components/AIAssistantFab.js
mobile/src/components/AnimalsEquipmentBoxesMobile.js
mobile/src/components/AuctionsServicesBoxesMobile.js
mobile/src/components/CategoryCascadesMobile.js
mobile/src/components/CountrySwitcher.js
mobile/src/components/FloatingTabBar.js
mobile/src/components/JobsRealEstateBoxesMobile.js
mobile/src/components/ListingCard.js
mobile/src/components/LocationPicker.js
mobile/src/components/Model3DViewerMobile.js
mobile/src/components/NotificationBell.js
mobile/src/components/Skeleton.js
mobile/src/components/StandaloneFloatingTabBar.js
mobile/src/components/VoiceCallWebView.js
mobile/src/components/chatBgSvg.js
mobile/src/googleAuth.js
mobile/src/notifications.js
mobile/src/phoneValidator.js
mobile/src/screens/AIAssistantScreen.js
mobile/src/screens/AuctionsScreen.js
mobile/src/screens/AuthScreens.js
mobile/src/screens/ChatScreen.js
mobile/src/screens/FlightsScreen.js
mobile/src/screens/HomeScreen.js
mobile/src/screens/ListingDetailScreen.js
mobile/src/screens/MapScreen.js
mobile/src/screens/MoreScreens.js
mobile/src/screens/OffersScreen.js
mobile/src/screens/OtherScreens.js
mobile/src/screens/PasswordReset.js
mobile/src/screens/PostScreen.js
mobile/src/screens/ProfileScreen.js
mobile/src/screens/ReelsScreen.js
mobile/src/screens/SearchScreen.js
mobile/src/screens/SellerProfile.js
mobile/src/screens/WalletScreen.js
mobile/src/screens/WorkflowScreens.js
mobile/src/socialAuth.js
mobile/src/theme.js
mobile/src/useChatSocket.js

## Shared API references
frontend/src/components/GeoAutocomplete.js:1:// GeoAutocomplete — web component for city/district autocomplete via /api/geo
frontend/src/components/GeoAutocomplete.js:2:// Uses static country.cities list + /api/geo/search (Nominatim) + /api/geo/districts (Overpass)
frontend/src/components/LocationPicker.jsx:1:// LocationPicker (Web) — cascading dropdown backed by /api/locations/children.
frontend/src/components/NotificationBell.js:14: * - Polls /api/notifications every 60s (cheap, just an unread count).
frontend/src/components/layout/TopBar.js:31:    // Live autocomplete (debounced) — calls /api/search/suggest
frontend/src/contexts/CountryContext.js:9: * - When a logged-in user changes it, we also PATCH /api/users/me so the
frontend/src/contexts/CountryContext.js:67:    // user's IP via /api/geo/detect-country. If detection succeeds and the
frontend/src/hooks/useAuctionLive.js:35:        const url = `${base}/api/ws/auctions/${listingId}`;
frontend/src/lib/api.js:45:const api = axios.create({
frontend/src/lib/useChatSocket.js:57:        const url = `${base}/api/ws/chat?token=${encodeURIComponent(token)}`;
frontend/src/lib/webPush.js:7: * - Posts the subscription to /api/push/web/subscribe
frontend/src/pages/Auth.js:45:// Backend exposes /api/auth/google/start which returns a Google consent URL.
frontend/src/pages/ChatPage.js:612:            const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/${type === "voice" ? "video" : "image"}/upload`, { method: "POST", body: fd });
mobile/src/api.js:13:const api = axios.create({
mobile/src/components/LocationPicker.js:3:// `/api/locations/children` endpoint. Re-renders automatically when the
mobile/src/components/NotificationBell.js:2:// Polls GET /api/notifications/unread-count when the host screen comes into
mobile/src/screens/ChatScreen.js:672:      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
mobile/src/screens/ChatScreen.js:766:        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
mobile/src/screens/HomeScreen.js:246:                {/* Image search — parity with web /api/ai/image-search */}
mobile/src/screens/PostScreen.js:230:        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
mobile/src/screens/PostScreen.js:304:      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/raw/upload`, { method: "POST", body: fd });
mobile/src/screens/PostScreen.js:349:      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`, {
mobile/src/screens/PostScreen.js:628:// =============== Geo Picker Modal (uses /api/geo/search or /api/geo/districts) ===============
mobile/src/screens/PostScreen.js:919:  // backend category keys (seen via /api/meta/categories): phones, cars,
mobile/src/screens/SearchScreen.js:91:        // Upload audio and send to /api/ai/transcribe
mobile/src/socialAuth.js:15: *   2. Hit /api/auth/<provider>/start?mobile_redirect=... to get the provider URL.
mobile/src/useChatSocket.js:42:        const url = `${BACKEND_URL.replace(/^http/i, "ws")}/api/ws/chat?token=${encodeURIComponent(token)}`;

## Database/index/schema references
backend/ai_validate_locations.py:142:    from motor.motor_asyncio import AsyncIOMotorClient
backend/ai_validate_locations.py:162:    print(f"[ai-validate] inserted {len(records)} into MongoDB")
backend/catalogs.py:2:Curated catalogs for cascading post-listing fields.
backend/catalogs.py:7:- Production-ready scale: covers the 90% of listings posted in the GCC region.
backend/locations.py:4:• Parses Geonames `XX.txt` country dumps into a unified `locations` MongoDB
backend/locations.py:704:        # Mongo `_id` collision guard — Geonames IDs are globally unique so
backend/locations.py:713:        await db.locations.create_index([("country", 1), ("level", 1)])
backend/locations.py:714:        await db.locations.create_index([("parent_id", 1)])
backend/locations.py:715:        await db.locations.create_index([("country", 1), ("name", 1)])
backend/locations.py:766:        await db.locations.create_index([("country", 1), ("level", 1)])
backend/locations.py:767:        await db.locations.create_index([("parent_id", 1)])
backend/locations.py:768:        await db.locations.create_index([("country", 1), ("name", 1)])
backend/master_egypt_parser.py:61:    return int(h[:8], 16)  # 0 .. 2^32-1 (fits MongoDB int32)
backend/push_service.py:56:                # iOS rich notifications (mutable-content + attachment) + Android big-picture.
backend/push_service.py:132:    `pref_key`: if set, users whose `notification_prefs.<pref_key>` is `False`
backend/push_service.py:134:    `url`: deep-link target. Web service-worker uses it on notification click;
backend/push_service.py:146:            {"id": {"$in": uids}, f"notification_prefs.{pref_key}": False},
backend/search_engine.py:2:Lightweight Elasticsearch-like search for listings, on top of MongoDB.
backend/search_engine.py:6:- For < ~500K active listings the approach below feels identical to ES users:
backend/search_engine.py:11:- build_search_blob(listing_doc) -> str   (call on insert/update; stored as `search_blob`)
backend/search_engine.py:12:- search_listings(db, q, base_filter, sort, limit, skip) -> (items, total, fuzzy_used)
backend/search_engine.py:21:# Public listing visibility policy. Legacy records may not have a moderation
backend/search_engine.py:27:def public_listing_filter(extra: Optional[dict] = None) -> dict:
backend/search_engine.py:28:    """Return a Mongo filter for listings eligible for public discovery.
backend/search_engine.py:31:    related listings so one endpoint cannot re-expose records hidden by another.
backend/search_engine.py:48:def public_listing_filter_for_country(country_code: Optional[str] = None, extra: Optional[dict] = None) -> dict:
backend/search_engine.py:53:    explicitly request another ISO-2 country, in which case Mongo returns only
backend/search_engine.py:59:    return public_listing_filter(merged)
backend/search_engine.py:100:def build_search_blob(listing: dict) -> str:
backend/search_engine.py:101:    """Concatenate searchable fields after normalization. Store on the listing as `search_blob`."""
backend/search_engine.py:103:        listing.get("title", ""),
backend/search_engine.py:104:        listing.get("description", ""),
backend/search_engine.py:105:        listing.get("category", ""),
backend/search_engine.py:106:        listing.get("subcategory", ""),
backend/search_engine.py:107:        listing.get("city", ""),
backend/search_engine.py:108:        listing.get("district", ""),
backend/search_engine.py:110:    cf = listing.get("custom_fields") or {}
backend/search_engine.py:116:# ---------- Mongo-side fast search ----------
backend/search_engine.py:127:    total = await db.listings.count_documents(query)
backend/search_engine.py:128:    items = await db.listings.find(query, {"_id": 0}).sort(sort).skip(skip).limit(limit).to_list(length=limit)
backend/search_engine.py:141:    """RapidFuzz over recent listings — kicks in only when exact/regex search returns nothing."""
backend/search_engine.py:142:    cursor = db.listings.find(base_filter, {"_id": 0}).sort(sort).limit(candidate_pool)
backend/search_engine.py:174:async def search_listings(
backend/search_engine.py:195:        total2 = await db.listings.count_documents(loose)
backend/search_engine.py:197:            items2 = await db.listings.find(loose, {"_id": 0}).sort(sort).skip(skip).limit(limit).to_list(length=limit)
backend/search_engine.py:213:    base = public_listing_filter(extra)
backend/search_engine.py:214:    cursor = db.listings.find(base, {"_id": 0, "title": 1}).sort([("created_at", -1)]).limit(limit * 4)
backend/seed_locations.py:14:from motor.motor_asyncio import AsyncIOMotorClient
backend/seed_locations.py:39:    await db.locations.create_index([("country", 1), ("level", 1)])
backend/seed_locations.py:40:    await db.locations.create_index([("parent_id", 1)])
backend/seed_locations.py:41:    await db.locations.create_index([("country", 1), ("name", 1)])
backend/seo_submitter.py:4:Submits new/updated listing URLs to multiple search engines INSTANTLY (instead of
backend/seo_submitter.py:14:Google: IndexNow is not adopted by Google. We add the listing URL to sitemap.xml
backend/seo_submitter.py:18:The IndexNow key is a random hex string we generate on first run and store in MongoDB.
backend/seo_submitter.py:21:All submissions are FIRE-AND-FORGET — if a search engine is down, listing creation
backend/seo_submitter.py:39:async def get_or_create_indexnow_key(db) -> str:
backend/seo_submitter.py:72:        key = await get_or_create_indexnow_key(db)
backend/server.py:34:from motor.motor_asyncio import AsyncIOMotorClient
backend/server.py:42:    search_listings as _search_listings_engine,
backend/server.py:44:    public_listing_filter,
backend/server.py:45:    public_listing_filter_for_country,
backend/server.py:49:    get_or_create_indexnow_key as _get_indexnow_key,
backend/server.py:60:# Slug generation — SEO-friendly URLs for listings
backend/server.py:98:async def _unique_slug(base: str, listing_id: str) -> str:
backend/server.py:99:    """Append short suffix from listing_id if base is empty or already taken."""
backend/server.py:100:    base = base or "listing"
backend/server.py:101:    suffix = listing_id.replace("-", "")[:6]
backend/server.py:103:    existing = await db.listings.find_one({"slug": candidate, "id": {"$ne": listing_id}}, {"_id": 0, "id": 1})
backend/server.py:322:# Only enforced on hot paths (/api/listings + /api/auth/*) to keep overhead
backend/server.py:329:    "listings": int(os.environ.get("RATE_LIMIT_LISTINGS", "100")),  # /api/listings
backend/server.py:344:    if path == "/api/listings" or path.startswith("/api/listings?"):
backend/server.py:345:        return "listings"
backend/server.py:416:# Debug endpoint — confirms which Mongo cluster + DB the live container is using
backend/server.py:430:    for name in ("listings", "users", "messages", "conversations", "ads", "categories", "cities", "meta_categories"):
backend/server.py:437:        "listings_total": counts.get("listings", 0),
backend/server.py:438:        "listings_active": await db.listings.count_documents({"status": "active"}) if counts.get("listings", 0) else 0,
backend/server.py:439:        "listings_approved": await db.listings.count_documents({"moderation": "approved"}) if counts.get("listings", 0) else 0,
backend/server.py:440:        "listings_visible": await db.listings.count_documents({"status": "active", "moderation": "approved"}) if counts.get("listings", 0) else 0,
backend/server.py:449:        sample = await db.listings.find_one({}, {"_id": 0, "id": 1, "title": 1, "status": 1, "moderation": 1, "country_code": 1, "category": 1, "is_demo": 1, "created_at": 1})
backend/server.py:450:        distinct_status = sorted([x for x in await db.listings.distinct("status") if x is not None])
backend/server.py:451:        distinct_mod = sorted([x for x in await db.listings.distinct("moderation") if x is not None])
backend/server.py:464:        "sample_listing": sample,
backend/server.py:469:# Debug-only: raw listings (no status/moderation filter). Use to confirm whether
backend/server.py:471:@app.get("/api/debug/listings-raw", include_in_schema=False)
backend/server.py:472:async def _debug_listings_raw(limit: int = 5):
backend/server.py:474:    items = await db.listings.find({}, {"_id": 0}).limit(limit).to_list(length=limit)
backend/server.py:479:# Server-side OG share endpoint — `/api/og/listing/{id}`.
backend/server.py:483:# listing URL (https://alhraj.online/listing/{id}) renders to them as the
backend/server.py:489:# on the SPA at `/listing/{id}`.
backend/server.py:491:@app.get("/api/og/listing/{listing_id}", include_in_schema=False)
backend/server.py:492:async def _og_listing_share(listing_id: str):
backend/server.py:494:        doc = await db.listings.find_one(public_listing_filter({"id": listing_id}), {"_id": 0})
backend/server.py:513:    spa_url = f"https://alhraj.online/listing/{listing_id}"
backend/server.py:585:    A running process is not enough for production readiness: MongoDB must
backend/server.py:665:            "listings_entries": len(_LISTINGS_CACHE) if "_LISTINGS_CACHE" in globals() else 0,
backend/server.py:735:    my_listings = await db.listings.find({"user_id": user_id, "status": "active"}, {"_id": 0, "id": 1, "title": 1, "views": 1, "favorites": 1, "price": 1, "currency": 1}).to_list(length=200)
backend/server.py:736:    if not my_listings:
backend/server.py:739:    listing_ids = [l["id"] for l in my_listings]
backend/server.py:740:    total_views = sum(l.get("views", 0) for l in my_listings)
backend/server.py:741:    favs_count = await db.favorites.count_documents({"listing_id": {"$in": listing_ids}, "created_at": {"$gte": since}})
backend/server.py:744:    # Top listing of the day
backend/server.py:745:    top = sorted(my_listings, key=lambda x: x.get("views", 0), reverse=True)[:3]
backend/server.py:826:    # Find all users who have at least one active listing
backend/server.py:831:    user_ids = [doc["_id"] async for doc in db.listings.aggregate(pipeline)]
backend/server.py:939:    contact_phone: Optional[str] = None  # optional override phone for this listing
backend/server.py:944:    listing_id: Optional[str] = None
backend/server.py:956:    target_type: str  # listing | user | message
backend/server.py:981:    placement: str  # home_top | home_middle | home_bottom | listing_bottom | sidebar
backend/server.py:1025:    listing_id: Optional[str] = Field(default=None, max_length=120)
backend/server.py:1342:    """User-facing profile stats: total listings, active, sold, join date."""
backend/server.py:1345:        "total_listings": await db.listings.count_documents({"user_id": uid}),
backend/server.py:1346:        "active_listings": await db.listings.count_documents({"user_id": uid, "status": "active"}),
backend/server.py:1347:        "sold_listings": await db.listings.count_documents({"user_id": uid, "status": "sold"}),
backend/server.py:1876:    listing_status: Optional[bool] = None
backend/server.py:1936:async def get_notification_prefs(user: dict = Depends(get_current_user)):
backend/server.py:1937:    prefs = user.get("notification_prefs") or {}
backend/server.py:1941:        "listing_status": prefs.get("listing_status", True),
backend/server.py:1950:async def set_notification_prefs(body: NotificationPrefsIn, user: dict = Depends(get_current_user)):
backend/server.py:1954:            update[f"notification_prefs.{k}"] = bool(v)
backend/server.py:1960:# Test push — useful for users to verify their device receives notifications
backend/server.py:2066:    # Store state in MongoDB (short TTL) so it survives across the auth redirect
backend/server.py:2493:    cursor = db.listings.find(q, {"_id": 0, "price": 1}).limit(100)
backend/server.py:2508:# AI Smart Pricing Badge — classifies a listing's price vs market
backend/server.py:2510:@api.get("/ai/price-badge/{listing_id}")
backend/server.py:2511:async def price_badge(listing_id: str):
backend/server.py:2512:    """Returns a badge (deal/fair/high) for a listing based on its category's price distribution."""
backend/server.py:2513:    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "price": 1, "category": 1, "country_code": 1, "subcategory": 1})
backend/server.py:2514:    if not listing or not listing.get("price"):
backend/server.py:2517:        "category": listing["category"],
backend/server.py:2521:        "id": {"$ne": listing_id},
backend/server.py:2523:    if listing.get("country_code"):
backend/server.py:2524:        q["country_code"] = listing["country_code"]
backend/server.py:2525:    if listing.get("subcategory"):
backend/server.py:2526:        q["subcategory"] = listing["subcategory"]
backend/server.py:2527:    cursor = db.listings.find(q, {"_id": 0, "price": 1}).limit(200)
backend/server.py:2532:    p = listing["price"]
backend/server.py:2554:    """Returns today's best deals: listings priced significantly below their category median."""
backend/server.py:2555:    # Get all active listings (small subset for performance)
backend/server.py:2556:    q: dict = public_listing_filter_for_country(country_code, {"price": {"$gt": 0}})
backend/server.py:2557:    cursor = db.listings.find(q, {"_id": 0}).limit(500)
backend/server.py:2644:    folder: str = Query("listings"),
backend/server.py:2649:    allowed = ("listings/", "stories/", "avatars/", "ads/", "chat/")
backend/server.py:2732:@api.post("/listings")
backend/server.py:2733:async def create_listing(body: ListingIn, user: dict = Depends(get_current_user)):
backend/server.py:2745:    # be a supported marketplace country; otherwise a listing could be stored
backend/server.py:2753:    listing_id = str(uuid.uuid4())
backend/server.py:2757:        "id": listing_id,
backend/server.py:2790:    doc["slug"] = f"{base_slug}-{listing_id.replace('-', '')[:6]}" if base_slug else f"listing-{listing_id.replace('-', '')[:8]}"
backend/server.py:2791:    await db.listings.insert_one(doc)
backend/server.py:2796:    # with the specific flag codes so the queue at /admin/listings/pending is actionable.
backend/server.py:2802:                await _send_user_notification(
backend/server.py:2807:                    url=f"/admin/listings/{listing_id}",
backend/server.py:2808:                    extra_data={"listing_id": listing_id, "flags": mod_flags},
backend/server.py:2815:    # Fire-and-forget; never blocks listing creation.
backend/server.py:2820:        _seo_submit_bg(db, [f"{fe}/listing/{doc['slug']}", f"{fe}/listing/{doc['id']}"], host)
backend/server.py:2821:        _google_idx_updated(f"{fe}/listing/{doc['slug']}")
backend/server.py:2824:    # Smart notification: tell users who recently viewed the same category.
backend/server.py:2828:    # Async AI moderation pass (Gemini classifier). Re-flags risky listings.
backend/server.py:2836:            await ai_moderate_listing(doc["id"], doc.get("title", ""), doc.get("description", ""))
backend/server.py:2906:    Used by listing create/update to mark `moderation=pending` AND tell the admin
backend/server.py:2920:async def ai_moderate_listing(listing_id: str, title: str, description: str) -> None:
backend/server.py:2921:    """Best-effort AI moderation pass using Gemini. Classifies listings against
backend/server.py:2926:    On error or missing LLM key, silently no-op so listing flow is never blocked.
backend/server.py:2937:            session_id=f"mod-{listing_id[:8]}",
backend/server.py:2966:            existing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "moderation_flags": 1}) or {}
backend/server.py:2973:        await db.listings.update_one({"id": listing_id}, {"$set": update})
backend/server.py:2980:                    await _send_user_notification(
backend/server.py:2985:                        url=f"/admin/listings/{listing_id}",
backend/server.py:2986:                        extra_data={"listing_id": listing_id, "score": score, "categories": cats, "reason": reason},
backend/server.py:2995:# Make Offer — structured negotiation without leaving the listing
backend/server.py:2997:@api.post("/listings/{listing_id}/offers")
backend/server.py:2998:async def create_listing_offer(listing_id: str, body: OfferIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:2999:    listing = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 0, "id": 1, "user_id": 1, "title": 1, "price": 1, "currency": 1, "status": 1})
backend/server.py:3000:    if not listing:
backend/server.py:3002:    if listing.get("user_id") == user["id"]:
backend/server.py:3004:    if listing.get("status") not in (None, "active"):
backend/server.py:3006:    existing = await db.listing_offers.find_one({"listing_id": listing_id, "buyer_id": user["id"], "status": {"$in": ["pending", "countered"]}})
backend/server.py:3011:        "id": str(uuid.uuid4()), "listing_id": listing_id, "seller_id": listing["user_id"],
backend/server.py:3012:        "buyer_id": user["id"], "amount": float(body.amount), "currency": listing.get("currency"),
backend/server.py:3017:        await db.listing_offers.update_one({"id": existing["id"]}, {"$set": {"amount": offer["amount"], "message": offer["message"], "status": "pending", "updated_at": now, "expires_at": expires_at, "decision_at": None, "decision_by": None}})
backend/server.py:3020:        await db.listing_offers.insert_one(offer)
backend/server.py:3023:        asyncio.create_task(_send_user_notification(listing["user_id"], "عرض سعر جديد", f"تم تقديم عرض بقيمة {offer['amount']:,.0f} {listing.get('currency') or ''} على إعلانك", "listing_offer", f"/listing/{listing_id}", {"listing_id": listing_id, "offer_id": offer["id"]}))
backend/server.py:3025:            asyncio.create_task(_chat_hub.send_to_user(listing["user_id"], {"type": "listing_offer", "data": payload}))
backend/server.py:3027:        logger.debug("offer notification scheduling failed", exc_info=True)
backend/server.py:3030:@api.get("/listings/{listing_id}/offers")
backend/server.py:3031:async def list_listing_offers(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:3032:    listing = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 0, "user_id": 1})
backend/server.py:3033:    if not listing or listing.get("user_id") != user["id"]:
backend/server.py:3035:    return await db.listing_offers.find({"listing_id": listing_id}, {"_id": 0}).sort("updated_at", -1).to_list(length=200)
backend/server.py:3038:async def my_listing_offers(role: str = "all", country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:3042:    items = await db.listing_offers.find(match, {"_id": 0}).sort("updated_at", -1).limit(100).to_list(length=100)
backend/server.py:3043:    listing_ids = list({x.get("listing_id") for x in items if x.get("listing_id")})
backend/server.py:3044:    listings = {}
backend/server.py:3045:    if listing_ids:
backend/server.py:3046:        async for listing in db.listings.find(public_listing_filter_for_country(country_code, {"id": {"$in": listing_ids}}), {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "images": {"$slice": 1}, "status": 1}):
backend/server.py:3047:            listings[listing["id"]] = listing
backend/server.py:3049:        item["listing"] = listings.get(item.get("listing_id"))
backend/server.py:3053:@api.patch("/listing-offers/{offer_id}")
backend/server.py:3054:async def decide_listing_offer(offer_id: str, body: OfferDecisionIn, user: dict = Depends(get_current_user)):
backend/server.py:3055:    offer = await db.listing_offers.find_one({"id": offer_id}, {"_id": 0})
backend/server.py:3065:                await db.listing_offers.update_one({"id": offer_id}, {"$set": {"status": "expired", "updated_at": datetime.now(timezone.utc).isoformat()}})
backend/server.py:3082:    await db.listing_offers.update_one({"id": offer_id}, {"$set": update})
backend/server.py:3086:        asyncio.create_task(_send_user_notification(recipient, title, body.message or title, "listing_offer_update", f"/listing/{offer['listing_id']}", {"listing_id": offer["listing_id"], "offer_id": offer_id, "status": update["status"]}))
backend/server.py:3088:            asyncio.create_task(_chat_hub.send_to_user(recipient, {"type": "listing_offer_update", "data": {"offer_id": offer_id, **update}}))
backend/server.py:3090:        logger.debug("offer decision notification scheduling failed", exc_info=True)
backend/server.py:3093:@api.get("/listings")
backend/server.py:3094:async def list_listings(
backend/server.py:3114:    # under ~10KB even on slow networks, scalable to millions of listings.
backend/server.py:3121:    # Check in-memory cache before hitting Mongo. Honors If-None-Match.
backend/server.py:3146:    query: dict = public_listing_filter_for_country(country_code)
backend/server.py:3186:    # Slim projection — only the fields a listing card actually renders.
backend/server.py:3199:        items, total, fuzzy_used = await _search_listings_engine(
backend/server.py:3205:        pool = await db.listings.find(query, projection).limit(500).to_list(length=500)
backend/server.py:3215:    # Skip the expensive count when paginating by cursor — Mongo can't short-circuit
backend/server.py:3217:    total = None if using_cursor else await db.listings.count_documents(query)
backend/server.py:3219:    cursor_q = db.listings.find(query, projection).sort(sort_field).skip(effective_skip).limit(limit)
backend/server.py:3244:# Two-tier cache for listings: Redis (if REDIS_URL set) → in-memory fallback.
backend/server.py:3249:_LISTINGS_CACHE_TTL = 60   # listings list — 60s
backend/server.py:3250:_DETAIL_CACHE_TTL = 120    # listing detail — 120s
backend/server.py:3313:            # Gzip when payload exceeds ~4KB — saves ~70% on listing pages.
backend/server.py:3337:    # Also force sitemap rebuild so newly created/updated/deleted listings
backend/server.py:3346:# Lightweight search + trending. Uses Mongo's built-in text index
backend/server.py:3351:async def search_listings(q: str = "", limit: int = 20, country_code: Optional[str] = None):
backend/server.py:3352:    """Full-text search over active listings. Ranked by score=views*0.7 + recency*0.3. Hard cap 20."""
backend/server.py:3356:    query: dict = public_listing_filter_for_country(country_code, {"$text": {"$search": q.strip()}})
backend/server.py:3364:        pool = await db.listings.find(query, SLIM).sort([("created_at", -1)]).limit(60).to_list(length=60)
backend/server.py:3372:        pool = await db.listings.find(fallback_query, SLIM).sort([("created_at", -1)]).limit(60).to_list(length=60)
backend/server.py:3397:@api.get("/listings/recommended")
backend/server.py:3398:async def recommended_listings(category: Optional[str] = None, country_code: Optional[str] = None, limit: int = 20):
backend/server.py:3407:    base_query: dict = public_listing_filter_for_country(country_code)
backend/server.py:3413:        cat_items = await db.listings.find(cq, SLIM).sort([("created_at", -1)]).limit(cat_split).to_list(length=cat_split)
backend/server.py:3420:    trend_items = await db.listings.find(tq, SLIM).sort([("views", -1), ("created_at", -1)]).limit(trend_split or limit).to_list(length=trend_split or limit)
backend/server.py:3432:@api.post("/listings/{listing_id}/click")
backend/server.py:3433:async def track_click(listing_id: str, country_code: Optional[str] = None):
backend/server.py:3435:    result = await db.listings.update_one(
backend/server.py:3436:        public_listing_filter_for_country(country_code, {"id": listing_id}),
backend/server.py:3444:# Uses Redis when available, falls back to Mongo. Per-user, capped at 20.
backend/server.py:3446:@api.post("/listings/{listing_id}/view")
backend/server.py:3447:async def track_view(listing_id: str, request: Request, country_code: Optional[str] = None):
backend/server.py:3448:    """Record a viewed listing only when it belongs to the active public country."""
backend/server.py:3449:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:3455:    # Upsert into Mongo so we survive Redis flushes / multi-instance restarts.
backend/server.py:3457:        {"user_id": user["id"], "listing_id": listing_id},
backend/server.py:3458:        {"$set": {"user_id": user["id"], "listing_id": listing_id, "ts": now_iso}},
backend/server.py:3471:@api.get("/listings/recent")
backend/server.py:3472:async def recent_listings(country_code: Optional[str] = None, user: dict = Depends(get_current_user), limit: int = 20):
backend/server.py:3473:    """Recently viewed listings for the authenticated user, newest first."""
backend/server.py:3475:    rv = await db.recently_viewed.find({"user_id": user["id"]}, {"_id": 0, "listing_id": 1, "ts": 1}).sort("ts", -1).limit(limit).to_list(length=limit)
backend/server.py:3476:    ids = [r["listing_id"] for r in rv]
backend/server.py:3484:    docs = await db.listings.find(public_listing_filter_for_country(country_code, {"id": {"$in": ids}}), SLIM).to_list(length=limit)
backend/server.py:3501:    """Persist a search so we can notify the user when matching new listings appear."""
backend/server.py:3540:# Category follow — opt-in subscription to new listings in a category.
backend/server.py:3571:    listing_status: Optional[bool] = None
backend/server.py:3573:@api.get("/users/me/notifications/settings")
backend/server.py:3575:    prefs = (user.get("notification_prefs") or {})
backend/server.py:3580:        "listing_status": prefs.get("listing_status", True),
backend/server.py:3585:@api.put("/users/me/notifications/settings")
backend/server.py:3590:    prefixed = {f"notification_prefs.{k}": v for k, v in update.items()}
backend/server.py:3599:@api.post("/listings/{listing_id}/boost")
backend/server.py:3600:async def boost_listing(listing_id: str, user: dict = Depends(get_current_user)):
backend/server.py:3601:    item = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1, "is_boosted": 1, "boost_until": 1})
backend/server.py:3619:        await db.listings.update_one({"id": listing_id}, {"$set": {"is_boosted": True, "boost_until": boost_until}})
backend/server.py:3621:            await _coins_log(user["id"], "spend", -charged, "listing_boost", listing_id, f"boost:{listing_id}:{boost_until[:10]}")
backend/server.py:3629:@api.delete("/listings/{listing_id}/boost")
backend/server.py:3630:async def unboost_listing(listing_id: str, user: dict = Depends(get_current_user)):
backend/server.py:3631:    item = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1})
backend/server.py:3636:    await db.listings.update_one({"id": listing_id}, {"$set": {"is_boosted": False}})
backend/server.py:3641:async def _notify_category_watchers(listing: dict):
backend/server.py:3642:    """When a new listing is approved, push to users who recently viewed the same
backend/server.py:3643:    category. Caps at 200 recipients per listing to keep the burst bounded."""
backend/server.py:3644:    cat = listing.get("category")
backend/server.py:3649:        # Distinct users who recently viewed any listing in the same category.
backend/server.py:3650:        cat_listing_ids = await db.listings.distinct("id", {"category": cat})
backend/server.py:3651:        if not cat_listing_ids:
backend/server.py:3655:            {"listing_id": {"$in": cat_listing_ids[:500]}, "ts": {"$gte": cutoff}},
backend/server.py:3657:        owner = listing.get("user_id")
backend/server.py:3663:                listing.get("title") or "",
backend/server.py:3664:                {"type": "category_new", "listing_id": listing.get("id"), "category": cat},
backend/server.py:3670:@api.get("/listings/trending")
backend/server.py:3671:async def trending_listings(limit: int = 20, country_code: Optional[str] = None, days: int = 7):
backend/server.py:3672:    """Most-viewed active listings in the past `days`. Hard cap 20."""
backend/server.py:3675:    query: dict = public_listing_filter_for_country(country_code, {"created_at": {"$gte": cutoff}})
backend/server.py:3681:    cursor = db.listings.find(query, SLIM).sort([("views", -1), ("created_at", -1)]).limit(limit)
backend/server.py:3692:@api.get("/listings/by-slug/{slug}")
backend/server.py:3693:async def get_listing_by_slug(slug: str, request: Request, country_code: Optional[str] = None):
backend/server.py:3694:    """Resolve a listing by its SEO slug. Used by /listing/:slug URLs."""
backend/server.py:3695:    item = await db.listings.find_one(
backend/server.py:3696:        public_listing_filter_for_country(country_code, {"slug": slug}),
backend/server.py:3701:    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
backend/server.py:3703:    # Decide which phone the seller actually exposes on THIS listing.
backend/server.py:3714:@api.get("/listings/{listing_id}/neighbors")
backend/server.py:3715:async def listing_neighbors(listing_id: str, country_code: Optional[str] = None):
backend/server.py:3716:    current = await db.listings.find_one({"$or": [{"id": listing_id}, {"slug": listing_id}]}, {"_id": 0, "id": 1, "slug": 1, "category": 1, "country_code": 1, "created_at": 1})
backend/server.py:3720:    base = public_listing_filter_for_country(cc, {"category": current.get("category"), "id": {"$ne": current.get("id")}})
backend/server.py:3722:    newer = await db.listings.find({**base, "created_at": {"$gt": stamp}}, {"_id": 0, "id": 1, "slug": 1, "title": 1}).sort("created_at", 1).limit(1).to_list(length=1)
backend/server.py:3723:    older = await db.listings.find({**base, "created_at": {"$lt": stamp}}, {"_id": 0, "id": 1, "slug": 1, "title": 1}).sort("created_at", -1).limit(1).to_list(length=1)
backend/server.py:3727:@api.get("/listings/{listing_id}")
backend/server.py:3728:async def get_listing(listing_id: str, request: Request, country_code: Optional[str] = None):
backend/server.py:3730:    item = await db.listings.find_one(
backend/server.py:3731:        public_listing_filter_for_country(country_code, {"$or": [{"id": listing_id}, {"slug": listing_id}]}),
backend/server.py:3736:    await db.listings.update_one({"id": item["id"]}, {"$inc": {"views": 1}})
backend/server.py:3745:    item["like_count"] = await db.listing_likes.count_documents({"listing_id": item["id"]})
backend/server.py:3746:    item["comment_count"] = await db.listing_comments.count_documents({"listing_id": item["id"], "deleted": {"$ne": True}})
backend/server.py:3749:@api.get("/listings/{listing_id}/like/check")
backend/server.py:3750:async def check_listing_like(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:3751:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:3753:    return {"liked": bool(await db.listing_likes.find_one({"listing_id": listing_id, "user_id": user["id"]}, {"_id": 1}))}
backend/server.py:3754:@api.post("/listings/{listing_id}/like")
backend/server.py:3755:async def toggle_listing_like(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:3756:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:3758:    existing = await db.listing_likes.find_one({"listing_id": listing_id, "user_id": user["id"]})
backend/server.py:3760:        await db.listing_likes.delete_one({"listing_id": listing_id, "user_id": user["id"]})
backend/server.py:3763:        await db.listing_likes.insert_one({"id": uuid.uuid4().hex, "listing_id": listing_id, "user_id": user["id"], "created_at": datetime.now(timezone.utc).isoformat()})
backend/server.py:3765:    return {"liked": liked, "like_count": await db.listing_likes.count_documents({"listing_id": listing_id})}
backend/server.py:3767:@api.get("/listings/{listing_id}/comments")
backend/server.py:3768:async def list_listing_comments(listing_id: str, country_code: Optional[str] = None, limit: int = 50, before: Optional[str] = None):
backend/server.py:3769:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:3772:    query = {"listing_id": listing_id, "deleted": {"$ne": True}}
backend/server.py:3775:    comments = await db.listing_comments.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
backend/server.py:3783:    return {"items": comments, "total": await db.listing_comments.count_documents({"listing_id": listing_id, "deleted": {"$ne": True}})}
backend/server.py:3785:@api.post("/listings/{listing_id}/comments")
backend/server.py:3786:async def create_listing_comment(listing_id: str, body: ListingCommentIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:3787:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 0, "user_id": 1, "title": 1}):
backend/server.py:3790:    if await db.listing_comments.count_documents({"user_id": user["id"], "created_at": {"$gte": cutoff}}) >= 10:
backend/server.py:3794:        existing = await db.listing_comments.find_one(
backend/server.py:3795:            {"listing_id": listing_id, "user_id": user["id"], "client_comment_id": body.client_comment_id, "deleted": {"$ne": True}},
backend/server.py:3801:    comment = {"id": uuid.uuid4().hex, "listing_id": listing_id, "user_id": user["id"], "text": body.text.strip(), "parent_id": body.parent_id, "client_comment_id": body.client_comment_id, "created_at": now, "updated_at": now, "deleted": False}
backend/server.py:3802:    await db.listing_comments.insert_one(comment)
backend/server.py:3806:@api.delete("/listing-comments/{comment_id}")
backend/server.py:3807:async def delete_listing_comment(comment_id: str, user: dict = Depends(get_current_user)):
backend/server.py:3808:    comment = await db.listing_comments.find_one({"id": comment_id}, {"_id": 0, "user_id": 1})
backend/server.py:3813:    await db.listing_comments.update_one({"id": comment_id}, {"$set": {"deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}})
backend/server.py:3816:@api.get("/listings/{listing_id}/similar")
backend/server.py:3817:async def similar_listings(listing_id: str, limit: int = 12, country_code: Optional[str] = None):
backend/server.py:3818:    base = await db.listings.find_one(
backend/server.py:3819:        public_listing_filter_for_country(country_code, {"id": listing_id}),
backend/server.py:3842:        same_city = await db.listings.find(
backend/server.py:3843:            public_listing_filter_for_country(country_code, {"category": base_category, "city": base_city, "id": {"$ne": listing_id}}),
backend/server.py:3847:            more = await db.listings.find(
backend/server.py:3848:                public_listing_filter_for_country(country_code, {"category": base_category, "city": {"$ne": base_city}, "id": {"$ne": listing_id}}),
backend/server.py:3854:    # Build OR query: any candidate listing whose title contains any base token,
backend/server.py:3857:    candidates = await db.listings.find(
backend/server.py:3858:        public_listing_filter_for_country(country_code, {
backend/server.py:3859:            "id": {"$ne": listing_id},
backend/server.py:3898:        # tie-breaker: newer listings preferred
backend/server.py:3915:@api.delete("/listings/{listing_id}")
backend/server.py:3916:async def delete_listing(listing_id: str, user: dict = Depends(get_current_user)):
backend/server.py:3917:    item = await db.listings.find_one({"id": listing_id})
backend/server.py:3928:    await db.listings.delete_one({"id": listing_id})
backend/server.py:3929:    related_deleted = await _delete_listing_related_records(listing_id)
backend/server.py:3932:    asyncio.create_task(_cleanup_listing_media(listing_id, media_to_clean))
backend/server.py:3938:            _google_idx_deleted(f"{fe}/listing/{slug}")
backend/server.py:3939:        _google_idx_deleted(f"{fe}/listing/{listing_id}")
backend/server.py:3983:async def _cleanup_listing_media(listing_id: str, media: dict) -> dict:
backend/server.py:3984:    """Delete Cloudinary images + videos associated with a deleted listing.
backend/server.py:4040:                        "listing_id": listing_id,
backend/server.py:4056:            "listing_id": listing_id,
backend/server.py:4063:    logger.info(f"[media-cleanup] listing={listing_id} img={summary['images_deleted']} vid={summary['videos_deleted']} fail={summary['failed']}")
backend/server.py:4067:async def _delete_listing_related_records(listing_id: str) -> dict:
backend/server.py:4068:    """Remove dependent marketplace records after a listing is deleted.
backend/server.py:4073:        "listing_offers": {"listing_id": listing_id},
backend/server.py:4074:        "listing_comments": {"listing_id": listing_id},
backend/server.py:4075:        "listing_likes": {"listing_id": listing_id},
backend/server.py:4076:        "favorites": {"listing_id": listing_id},
backend/server.py:4077:        "watches": {"listing_id": listing_id},
backend/server.py:4078:        "recently_viewed": {"listing_id": listing_id},
backend/server.py:4079:        "reports": {"target_type": "listing", "target_id": listing_id},
backend/server.py:4080:        "bids": {"listing_id": listing_id},
backend/server.py:4081:        "price_alerts": {"listing_id": listing_id},
backend/server.py:4082:        "messages": {"listing_id": listing_id},
backend/server.py:4089:            logger.warning(f"[listing-delete] dependent cleanup failed collection={collection_name}: {exc}")
backend/server.py:4131:@api.get("/listings/me/mine")
backend/server.py:4132:async def my_listings(user: dict = Depends(get_current_user)):
backend/server.py:4133:    items = await db.listings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=200)
backend/server.py:4144:def _auction_end_datetime(listing: dict) -> Optional[datetime]:
backend/server.py:4146:    cf = listing.get("custom_fields") or {}
backend/server.py:4147:    meta = listing.get("auction_meta") or {}
backend/server.py:4148:    raw = (listing.get("auction_end_at") or listing.get("end_time")
backend/server.py:4149:           or listing.get("closes_at") or cf.get("end_time")
backend/server.py:4163:    q: dict = public_listing_filter_for_country(country_code, {"category": "auctions"})
backend/server.py:4164:    candidates = await db.listings.find(q, {"_id": 0}).sort("created_at", -1).limit(min(60, limit * 3)).to_list(length=min(60, limit * 3))
backend/server.py:4170:            await db.listings.update_one({"id": it["id"], "status": "active"}, {"$set": {"status": "ended", "ended_at": now.isoformat()}})
backend/server.py:4178:            {"listing_id": it["id"]},
backend/server.py:4183:        it["bid_count"] = await db.bids.count_documents({"listing_id": it["id"]})
backend/server.py:4186:@api.get("/auctions/{listing_id}/bids")
backend/server.py:4187:async def auction_bids(listing_id: str, country_code: Optional[str] = None, limit: int = 20):
backend/server.py:4188:    listing = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id, "category": "auctions"}), {"_id": 0})
backend/server.py:4189:    if not listing:
backend/server.py:4192:    bids = await db.bids.find({"listing_id": listing_id}, {"_id": 0}).sort("amount", -1).limit(limit).to_list(length=limit)
backend/server.py:4203:# Auctions live WebSocket — fan-out new bids to all watchers of a listing.
backend/server.py:4207:_AUCTION_WATCHERS: dict = {}  # listing_id -> set of WebSocket
backend/server.py:4210:async def _broadcast_auction_event(listing_id: str, event: dict) -> None:
backend/server.py:4211:    conns = _AUCTION_WATCHERS.get(listing_id) or set()
backend/server.py:4224:@app.websocket("/api/ws/auctions/{listing_id}")
backend/server.py:4225:async def auctions_ws(websocket: WebSocket, listing_id: str):
backend/server.py:4232:    listing_guard = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id, "category": "auctions"}), {"_id": 0})
backend/server.py:4233:    if not listing_guard:
backend/server.py:4237:    conns = _AUCTION_WATCHERS.setdefault(listing_id, set())
backend/server.py:4241:        top = await db.bids.find_one({"listing_id": listing_id}, {"_id": 0}, sort=[("amount", -1)])
backend/server.py:4242:        count = await db.bids.count_documents({"listing_id": listing_id})
backend/server.py:4243:        listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "price": 1, "auction_end_at": 1, "status": 1})
backend/server.py:4248:            "starting_price": (listing or {}).get("price"),
backend/server.py:4249:            "auction_end_at": (listing or {}).get("auction_end_at"),
backend/server.py:4250:            "status": (listing or {}).get("status"),
backend/server.py:4272:            _AUCTION_WATCHERS.pop(listing_id, None)
backend/server.py:4275:@api.post("/auctions/{listing_id}/bid")
backend/server.py:4276:async def place_bid(listing_id: str, body: BidIn, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:4277:    listing = await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id, "category": "auctions"}), {"_id": 0})
backend/server.py:4278:    if not listing:
backend/server.py:4280:    if listing.get("user_id") == user["id"]:
backend/server.py:4282:    end_dt = _auction_end_datetime(listing)
backend/server.py:4284:        await db.listings.update_one({"id": listing_id, "status": "active"}, {"$set": {"status": "ended", "ended_at": datetime.now(timezone.utc).isoformat()}})
backend/server.py:4286:    if listing.get("status") != "active":
backend/server.py:4289:    top = await db.bids.find_one({"listing_id": listing_id}, {"_id": 0}, sort=[("amount", -1)])
backend/server.py:4293:    auction_meta = listing.get("auction_meta") or {}
backend/server.py:4294:    cf = listing.get("custom_fields") or {}
backend/server.py:4300:        or listing.get("min_increment")
backend/server.py:4301:        or listing.get("bid_increment")
backend/server.py:4310:    current = top["amount"] if top else (listing.get("price") or 0)
backend/server.py:4322:        "listing_id": listing_id,
backend/server.py:4325:        "currency": listing.get("currency", "ر.س"),
backend/server.py:4337:                   or listing.get("end_time") or listing.get("closes_at"))
backend/server.py:4353:                await db.listings.update_one({"id": listing_id}, {"$set": update_doc})
backend/server.py:4358:    count = await db.bids.count_documents({"listing_id": listing_id})
backend/server.py:4366:    asyncio.create_task(_broadcast_auction_event(listing_id, event))
backend/server.py:4370:            asyncio.create_task(_send_user_notification(
backend/server.py:4373:                body=f"عرض جديد بقيمة {body.amount} {listing.get('currency', 'ر.س')} على «{(listing.get('title') or '')[:40]}»",
backend/server.py:4375:                url=f"/listing/{listing_id}",
backend/server.py:4376:                extra_data={"listing_id": listing_id, "amount": body.amount},
backend/server.py:4383:# Map endpoint - returns listings with lat/lng
backend/server.py:4384:@api.get("/listings/map/nearby")
backend/server.py:4385:async def listings_map(
backend/server.py:4390:    q: dict = public_listing_filter_for_country(country_code, {"lat": {"$ne": None}, "lng": {"$ne": None}})
backend/server.py:4393:    items = await db.listings.find(q, {"_id": 0, "id": 1, "title": 1, "price": 1, "currency": 1, "category": 1, "city": 1, "country_code": 1, "lat": 1, "lng": 1, "images": 1}).limit(limit).to_list(length=limit)
backend/server.py:4400:@api.post("/favorites/{listing_id}")
backend/server.py:4401:async def toggle_favorite(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:4404:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:4406:    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id})
backend/server.py:4408:        await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
backend/server.py:4409:        await db.listings.update_one({"id": listing_id, "favorites": {"$gt": 0}}, {"$inc": {"favorites": -1}})
backend/server.py:4412:        "user_id": user["id"], "listing_id": listing_id,
backend/server.py:4415:    await db.listings.update_one({"id": listing_id}, {"$inc": {"favorites": 1}})
backend/server.py:4418:@api.delete("/favorites/{listing_id}")
backend/server.py:4419:async def delete_favorite(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:4422:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:4424:    res = await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
backend/server.py:4426:        await db.listings.update_one({"id": listing_id, "favorites": {"$gt": 0}}, {"$inc": {"favorites": -1}})
backend/server.py:4429:@api.get("/favorites/{listing_id}/check")
backend/server.py:4430:async def check_favorite(listing_id: str, country_code: Optional[str] = None, user: dict = Depends(get_current_user)):
backend/server.py:4431:    if not await db.listings.find_one(public_listing_filter_for_country(country_code, {"id": listing_id}), {"_id": 1}):
backend/server.py:4433:    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id})
backend/server.py:4439:    listing_ids = [f["listing_id"] for f in favs]
backend/server.py:4440:    listings = await db.listings.find(public_listing_filter_for_country(country_code, {"id": {"$in": listing_ids}}), {"_id": 0}).to_list(length=500)
backend/server.py:4441:    return listings
backend/server.py:4445:# Price Alerts — notify a user when a listing's price drops below a target.
backend/server.py:4447:# /listings/{id}. No background poller needed.
backend/server.py:4449:@api.post("/price-alerts/{listing_id}")
backend/server.py:4450:async def create_price_alert(listing_id: str, payload: dict, user: dict = Depends(get_current_user)):
backend/server.py:4454:    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "id": 1, "price": 1, "title": 1})
backend/server.py:4455:    if not listing:
backend/server.py:4460:        "listing_id": listing_id,
backend/server.py:4463:        "current_price": listing.get("price"),
backend/server.py:4464:        "title": listing.get("title"),
backend/server.py:4466:    # Upsert by (user, listing) — one alert per user per listing.
backend/server.py:4468:        {"user_id": user["id"], "listing_id": listing_id},
backend/server.py:4479:@api.delete("/price-alerts/{listing_id}")
backend/server.py:4480:async def delete_price_alert(listing_id: str, user: dict = Depends(get_current_user)):
backend/server.py:4481:    await db.price_alerts.delete_one({"user_id": user["id"], "listing_id": listing_id})
backend/server.py:4486:# Block user — hides their listings + prevents messaging.
backend/server.py:4509:async def _check_price_alerts(listing_id: str, new_price: Optional[float]):
backend/server.py:4510:    """Fire push notifications to anyone whose target_price >= new_price."""
backend/server.py:4513:    alerts = await db.price_alerts.find({"listing_id": listing_id, "target_price": {"$gte": new_price}}, {"_id": 0}).to_list(length=500)
backend/server.py:4520:                {"type": "price_alert", "listing_id": listing_id},
backend/server.py:4684:    # persisted this request and the first attempt actually reached Mongo,
backend/server.py:4713:        "listing_id": body.listing_id,
backend/server.py:4739:            "listing_id": body.listing_id,
backend/server.py:4764:    # In-app notification + push (respects user's `messages` pref) — only if
backend/server.py:4768:        await db.notifications.insert_one({
backend/server.py:4774:            "data": {"convo_id": convo_id, "sender_id": user["id"], "listing_id": body.listing_id},
backend/server.py:4782:            url=f"/chat?to={user['id']}" + (f"&listing={body.listing_id}" if body.listing_id else ""),
backend/server.py:4783:            data={"type": "new_message", "convo_id": convo_id, "sender_id": user["id"], "listing_id": body.listing_id},
backend/server.py:5028:@api.post("/listings/{listing_id}/applications")
backend/server.py:5029:async def apply_to_job(listing_id: str, body: JobApplicationIn, user: dict = Depends(get_current_user)):
backend/server.py:5031:    listing = await db.listings.find_one(public_listing_filter_for_country(cc, {"id": listing_id}), {"_id": 0, "id": 1, "user_id": 1, "category": 1, "country_code": 1})
backend/server.py:5032:    if not listing:
backend/server.py:5034:    if listing.get("user_id") == user["id"]:
backend/server.py:5035:        raise HTTPException(400, "Cannot apply to your own listing")
backend/server.py:5036:    existing = await db.job_applications.find_one({"listing_id": listing_id, "applicant_id": user["id"]}, {"_id": 0})
backend/server.py:5046:    application = {"id": str(uuid.uuid4()), "listing_id": listing_id, "applicant_id": user["id"], "owner_id": listing["user_id"], "country_code": cc, "resume_url": resume_url, "cover_note": body.cover_note.strip(), "status": "submitted", "created_at": now, "updated_at": now}
backend/server.py:5050:@api.get("/listings/{listing_id}/applications")
backend/server.py:5051:async def list_job_applications(listing_id: str, user: dict = Depends(get_current_user)):
backend/server.py:5052:    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "user_id": 1})
backend/server.py:5053:    if not listing or listing.get("user_id") != user["id"]:
backend/server.py:5054:        raise HTTPException(403, "Only the listing owner can view applications")
backend/server.py:5055:    return await db.job_applications.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(length=500)
backend/server.py:5071:    ticket = {"id": str(uuid.uuid4()), "user_id": user["id"], "subject": body.subject.strip(), "message": body.message.strip(), "category": body.category.strip() or "general", "priority": priority, "listing_id": body.listing_id, "status": "open", "messages": [{"id": str(uuid.uuid4()), "author_id": user["id"], "message": body.message.strip(), "created_at": now}], "created_at": now, "updated_at": now}
backend/server.py:5230:# Sell with AI — Auto-fill listing from image
backend/server.py:5245:@api.post("/listings/suggest-price")
backend/server.py:5247:    """Market-based price suggestion built from REAL listings in our DB.
backend/server.py:5267:        cursor = db.listings.find(q, {"_id": 0, "price": 1, "currency": 1})

## Risk markers
backend/seed_data.py:209:            {"key": "vin", "label_ar": "رقم الهيكل VIN", "label_en": "VIN", "type": "text", "required": False, "placeholder": "17 characters"},
backend/seed_data.py:331:            {"key": "schedule", "label_ar": "متى تحتاج الخدمة؟", "label_en": "Schedule", "type": "text", "required": False, "placeholder": "مثلاً: غداً 8 صباحاً، أو خلال الأسبوع"},
backend/seed_data.py:445:            {"key": "game_title", "label_ar": "اسم اللعبة", "label_en": "Game Title", "type": "text", "required": False, "placeholder": "FIFA 24 / GTA / EA Sports..."},
backend/seed_data.py:459:            {"key": "plant_type", "label_ar": "نوع النبات (إن وُجد)", "label_en": "Plant Type", "type": "text", "required": False, "placeholder": "نخيل / ورد / صبار..."},
backend/seed_data.py:474:            {"key": "brand", "label_ar": "الماركة", "label_en": "Brand", "type": "text", "required": False, "placeholder": "Nike / Adidas / Trek..."},
backend/seed_data.py:475:            {"key": "size", "label_ar": "المقاس", "label_en": "Size", "type": "text", "required": False, "placeholder": "M / L / 42 / 26 inch..."},
backend/seed_data.py:504:            {"key": "model", "label_ar": "الموديل", "label_en": "Model", "type": "text", "required": True, "placeholder": "iPhone 15 Pro / Galaxy S24..."},
backend/seed_data.py:523:            {"key": "breed", "label_ar": "السلالة", "label_en": "Breed", "type": "text", "required": False, "placeholder": "شيرازي / بريش..."},
backend/seed_data.py:524:            {"key": "age", "label_ar": "العمر", "label_en": "Age", "type": "text", "required": False, "placeholder": "3 شهور / سنة..."},
backend/seed_data.py:554:            {"key": "weight", "label_ar": "الوزن/الكمية", "label_en": "Weight", "type": "text", "required": False, "placeholder": "1 كجم / علبة..."},
backend/seed_data.py:566:            {"key": "industry", "label_ar": "النشاط", "label_en": "Industry", "type": "text", "required": False, "placeholder": "مطعم / كافيه / تجارة..."},
backend/server.py:1561:    # X does not return email by default; use x_id@x.local as placeholder
backend/server.py:1562:    placeholder_email = f"x_{x_id}@x.local"
backend/server.py:1563:    user = await db.users.find_one({"$or": [{"x_id": x_id}, {"email": placeholder_email}]})
backend/server.py:1567:            "id": uid, "name": x_name, "email": placeholder_email,
backend/server.py:1631:    placeholder_email = f"x_{x_id}@x.local"
backend/server.py:1632:    user = await db.users.find_one({"$or": [{"x_id": x_id}, {"email": placeholder_email}]})
backend/server.py:1639:            "id": uid, "name": x_name, "email": placeholder_email,
backend/server.py:1744:    placeholder_email = f"snap_{snap_id}@snapchat.local"
backend/server.py:1745:    user = await db.users.find_one({"$or": [{"snap_id": snap_id}, {"email": placeholder_email}]})
backend/server.py:1749:            "id": uid, "name": snap_name, "email": placeholder_email,
backend/server.py:1823:    placeholder_email = f"snap_{snap_id}@snapchat.local"
backend/server.py:1824:    user = await db.users.find_one({"$or": [{"snap_id": snap_id}, {"email": placeholder_email}]})
backend/server.py:1828:            "id": uid, "name": snap_name, "email": placeholder_email,
backend/server.py:2035:            # disabled-password placeholder — user must use Google or password-reset
backend/server.py:2234:        # Apple may not return an email if the user chose private relay; fall back to placeholder.
backend/server.py:2721:    """Accept only an uploaded/hosted GLB or GLTF asset; no fake conversion."""
backend/server.py:2942:                "categories ممكن أن تحتوي: scam, drugs, adult, fraud, weapons, hate, fake, prohibited. "
backend/server.py:4450:async def create_price_alert(listing_id: str, payload: dict, user: dict = Depends(get_current_user)):
backend/server.py:4480:async def delete_price_alert(listing_id: str, user: dict = Depends(get_current_user)):
backend/server.py:4953:# These are first-class persisted workflows; no mock cards or fake success.
backend/server.py:9190:    # an empty ads collection must render an honest empty state, not fake data.
backend/tests/test_haraj_plus.py:477:            "target_id": "fake-listing-id",
backend/tests/test_iter12_features.py:75:        "images": ["https://via.placeholder.com/400"],
backend/tests/test_iter19_push.py:134:        "keys": {"p256dh": "BHFakeP256dhKeyForTestingPurposesOnly1234567890abcdef", "auth": "fakeAuthSecret1234"},
backend/tests/test_iteration7_x_oauth.py:53:            json={"code": "fake_code_abc", "state": "this-state-does-not-exist"},
backend/tests/test_iteration8_snap_push.py:113:                      json={"code": "fake_code_xyz", "state": "bogus_state_value"})
backend/tests/test_iteration8_snap_push.py:232:                      json={"code": "fake", "state": "unknown_state_xxx"})
backend/tests/conftest.py:6:mock/test server or staging URL is started.
backend/tests/test_phase10_seo_model_unit.py:19:            "title": 'عنوان "><script>alert(1)</script>',
backend/tests/test_phase10_seo_model_unit.py:57:        assert "<script>alert(1)</script>" not in body
backend/tests/test_phase10_seo_model_unit.py:58:        assert "&lt;script&gt;alert(1)&lt;/script&gt;" in body
frontend/src/components/AIAssistantWidget.js:277:                            <input data-testid="ai-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={tr("اكتب رسالتك...")} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm font-arabic-body text-[var(--text)] outline-none focus:border-[var(--primary)]" disabled={busy} />
frontend/src/components/AnimalsEquipmentBoxes.js:143:                <TextCell label={tr("الموديل")} value={cf.model} required onChange={(v) => set({ model: v })} placeholder={tr("مثال: CAT 320D")} testid="eq-model" />
frontend/src/components/AnimalsEquipmentBoxes.js:191:function TextCell({ label, value, onChange, required, placeholder, testid }) {
frontend/src/components/AnimalsEquipmentBoxes.js:201:                placeholder={placeholder}
frontend/src/components/AuctionsServicesBoxes.js:202:                    <TextCell label={tr("نقطة الالتقاط")} value={cf.pickup_location} required onChange={(v) => set({ pickup_location: v })} placeholder={tr("المدينة، الحي")} testid="svc-pickup" />
frontend/src/components/AuctionsServicesBoxes.js:203:                    <TextCell label={tr("نقطة الوصول")} value={cf.dropoff_location} required onChange={(v) => set({ dropoff_location: v })} placeholder={tr("المدينة، الحي")} testid="svc-dropoff" />
frontend/src/components/AuctionsServicesBoxes.js:286:function TextCell({ label, value, onChange, required, placeholder, testid }) {
frontend/src/components/AuctionsServicesBoxes.js:296:                placeholder={placeholder}
frontend/src/components/CategoryCascades.js:96:                <Field label={tr("اللون")} value={v.color || ""} onChange={(x) => set({ color: x })} placeholder={tr("مثال: أبيض / أسود")} testid="car-color" />
frontend/src/components/CategoryCascades.js:163:                <Field label={tr("الماركة / المصدر")} value={v.brand || ""} onChange={(x) => set({ brand: x })} placeholder={tr("مثال: IKEA / محلي")} testid="furn-brand" />
frontend/src/components/CategoryCascades.js:214:function Field({ label, value, onChange, placeholder, testid }) {
frontend/src/components/CategoryCascades.js:222:                placeholder={placeholder}
frontend/src/components/CitySelect.js:16:    placeholder,
frontend/src/components/CitySelect.js:72:    const displayLabel = value || (placeholder || tr(kind === "city" ? "اختر المدينة" : "اختر الحي / المنطقة"));
frontend/src/components/CitySelect.js:117:                                placeholder={kind === "city" ? tr("اكتب اسم المدينة...") : tr("اكتب اسم الحي...")}
frontend/src/components/CitySelect.js:118:                                className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)] placeholder:text-[var(--text-muted)]"
frontend/src/components/GeoAutocomplete.js:16:    placeholder,
frontend/src/components/GeoAutocomplete.js:96:                placeholder={placeholder || tr(kind === "city" ? "ابحث عن مدينة..." : "ابحث عن حي...")}
frontend/src/components/JobsRealEstateBoxes.js:55:                <TextCell label={tr("المسمى الوظيفي")} value={cf.job_title} required onChange={(v) => set({ job_title: v })} placeholder={tr("مثال: مهندس برمجيات أول")} testid="job-title" />
frontend/src/components/JobsRealEstateBoxes.js:60:                    <TextCell label={tr("الراتب المتوقع")} value={cf.expected_salary} onChange={(v) => set({ expected_salary: v })} placeholder={tr("مثال: 8,000 ر.س")} testid="job-expected-salary" />
frontend/src/components/JobsRealEstateBoxes.js:62:                    <TextCell label={tr("نطاق الراتب")} value={cf.salary_range} onChange={(v) => set({ salary_range: v })} placeholder={tr("مثال: 6,000 - 10,000 ر.س")} testid="job-salary-range" />
frontend/src/components/JobsRealEstateBoxes.js:77:                    <TextAreaCell colSpan label={tr("المهارات والقدرات")} value={cf.skills} onChange={(v) => set({ skills: v })} placeholder={tr("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} testid="job-skills" />
frontend/src/components/JobsRealEstateBoxes.js:79:                    <TextAreaCell colSpan label={tr("المتطلبات والشروط")} value={cf.requirements} onChange={(v) => set({ requirements: v })} placeholder={tr("اذكر المؤهلات والمتطلبات الإلزامية...")} testid="job-requirements" />
frontend/src/components/JobsRealEstateBoxes.js:170:function TextCell({ label, value, onChange, required, placeholder, testid }) {
frontend/src/components/JobsRealEstateBoxes.js:180:                placeholder={placeholder}
frontend/src/components/JobsRealEstateBoxes.js:230:function TextAreaCell({ label, value, onChange, placeholder, colSpan, testid }) {
frontend/src/components/JobsRealEstateBoxes.js:238:                placeholder={placeholder}
frontend/src/components/LocationPicker.jsx:150:                            placeholder={tr("ابحث...")}
frontend/src/components/LocationPicker.jsx:152:                            className="flex-1 bg-transparent outline-none text-sm font-arabic-body text-[var(--text)] placeholder:text-[var(--text-muted)]"
frontend/src/components/layout/TopBar.js:166:                            placeholder={t("search_placeholder")}
frontend/src/components/layout/TopBar.js:168:                            className="bg-transparent flex-1 mx-2 outline-none text-xs sm:text-sm placeholder:text-[var(--text-muted)] text-[var(--text)] font-arabic-body min-w-0"
frontend/src/components/ui/command.jsx:41:        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
frontend/src/components/ui/input.jsx:10:        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
frontend/src/components/ui/select.jsx:17:      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
frontend/src/components/ui/textarea.jsx:9:        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
frontend/src/contexts/I18nContext.js:23:        search_placeholder: "ابحث عن أي شيء... (AI)",
frontend/src/contexts/I18nContext.js:63:        search_placeholder: "Search anything... (AI)",
frontend/src/contexts/I18nContext.js:103:        search_placeholder: "تلاش کریں...",
frontend/src/contexts/I18nContext.js:142:        search_placeholder: "कुछ भी खोजें...",
frontend/src/contexts/I18nContext.js:179:        search_placeholder: "যেকোনো কিছু খুঁজুন...",
frontend/src/contexts/I18nContext.js:216:        search_placeholder: "Rechercher...",
frontend/src/hooks/useAuctionLive.js:101:        // No-op manual refresh placeholder so callers used to polling can switch
frontend/src/pages/AdminPage.js:112:        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm space-y-3"><div className="flex flex-wrap items-center gap-2"><b>{tr("ترتيب التدوير")}</b><input value={(config.order || []).join(", ")} onChange={(e) => setConfig({ ...config, order: e.target.value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) })} placeholder={rotation || "gemini, grok"} className="flex-1 min-w-[220px] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 font-mono text-xs" /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><label>{tr("الوضع")}<select value={config.mode || "automatic"} onChange={(e) => setConfig({ ...config, mode: e.target.value })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1"><option value="automatic">Automatic</option><option value="priority">Priority</option><option value="manual">Manual + fallback</option></select></label><label>{tr("المزود الأساسي")}<input value={config.primary || ""} onChange={(e) => setConfig({ ...config, primary: e.target.value.toLowerCase() })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1" /></label><label>{tr("أقصى محاولات") }<input type="number" min="1" max="20" value={config.max_attempts ?? 3} onChange={(e) => setConfig({ ...config, max_attempts: Number(e.target.value) })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label><label>{tr("عتبة الحصة %")}<input type="number" min="0" max="100" value={config.quota_threshold_pct ?? 90} onChange={(e) => setConfig({ ...config, quota_threshold_pct: Number(e.target.value) })} className="block w-full mt-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 font-latin" /></label></div><div className="flex flex-wrap gap-4 text-xs"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.rotation_enabled !== false} onChange={(e) => setConfig({ ...config, rotation_enabled: e.target.checked })} />{tr("التدوير التلقائي")}</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={config.fallback_enabled !== false} onChange={(e) => setConfig({ ...config, fallback_enabled: e.target.checked })} />{tr("fallback عند الفشل")}</label></div><p className="text-xs text-[var(--text-muted)]">{tr("تحكم إداري غير سري؛ مفاتيح API تبقى في متغيرات الخادم ولا تُحفظ هنا")}</p><div className="flex items-center gap-2"><button onClick={saveConfig} disabled={saving} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50">{saving ? tr("حفظ...") : tr("حفظ إعدادات AI")}</button>{saved && <span className="text-xs text-emerald-600">{saved}</span>}</div></div>
frontend/src/pages/AdminPage.js:166:            <div className="flex flex-wrap gap-2"><select value={device} onChange={(e) => setDevice(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm"><option value="">كل الأجهزة</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select><input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={3} placeholder={tr("الدولة مثل SA")} className="w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-latin" /></div>
frontend/src/pages/AdminPage.js:322:            alert(tr("✅ تم حفظ إعدادات SEO"));
frontend/src/pages/AdminPage.js:323:        } catch (_) { alert(tr("فشل الحفظ")); } finally { setBusy(false); }
frontend/src/pages/AdminPage.js:532:                <input data-testid="filter-q" placeholder={tr("بحث في العنوان...")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="col-span-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AdminPage.js:545:                <input data-testid="filter-country" placeholder={tr("الدولة (SA)")} value={filters.country_code} onChange={(e) => { setSkip(0); setFilters({ ...filters, country_code: e.target.value.toUpperCase() }); }} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm uppercase" />
frontend/src/pages/AdminPage.js:638:        try { const { data } = await api.post("/admin/listings/bulk-delete", explicit.length ? { ids: explicit } : { older_than_days: ageDays, status }); alert(`${tr("تم حذف")} ${data.deleted} ${tr("إعلان")}. ${tr("تمت جدولة")} ${data.media_queued} ${tr("وسيط")}.`); await load(); } catch (e) { alert(e.response?.data?.detail || tr("تعذر الحذف الجماعي")); } finally { setBusy(false); }
frontend/src/pages/AdminPage.js:640:    const preview = async () => { try { const { data } = await api.post("/admin/listings/bulk-delete", { older_than_days: ageDays, status, dry_run: true }); alert(`${tr("عدد الإعلانات المطابقة")}: ${data.matched}`); } catch (e) { alert(e.response?.data?.detail || tr("تعذر المعاينة")); } };
frontend/src/pages/AdminPage.js:668:            alert(`${tr("✅ تم إصلاح")}: ${r.users_fixed} ${tr("مستخدم")} • ${r.listings_fixed} ${tr("إعلان")}`);
frontend/src/pages/AdminPage.js:670:        } catch (e) { alert(tr("فشل الإصلاح")); }
frontend/src/pages/AdminPage.js:749:                <input data-testid="users-q" placeholder={tr("بحث (اسم / بريد / جوال)")} value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="col-span-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AdminPage.js:750:                <input data-testid="users-cc" placeholder={tr("الدولة")} maxLength={3} value={filters.country_code} onChange={(e) => setFilters({ ...filters, country_code: e.target.value.toUpperCase() })} className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm uppercase" />
frontend/src/pages/AdminPage.js:976:        if (!form.title || !form.body) { alert(tr("املأ العنوان والنص")); return; }
frontend/src/pages/AdminPage.js:977:        if (!schedAt) { alert(tr("اختر تاريخ ووقت الإرسال")); return; }
frontend/src/pages/AdminPage.js:980:            alert(tr("اختر وقتاً مستقبلياً")); return;
frontend/src/pages/AdminPage.js:991:            alert(tr("تم جدولة الإشعار ✅"));
frontend/src/pages/AdminPage.js:993:            alert(e.response?.data?.detail || tr("تعذرت الجدولة"));
frontend/src/pages/AdminPage.js:1002:        } catch (_) { alert(tr("فشل الإلغاء")); }
frontend/src/pages/AdminPage.js:1006:        if (!form.title || !form.body) { alert(tr("املأ العنوان والنص")); return; }
frontend/src/pages/AdminPage.js:1014:            alert(e.response?.data?.detail || "تعذر الإرسال");
frontend/src/pages/AdminPage.js:1023:            if (!data.suggestions?.length) alert(tr("لم يتم توليد اقتراحات"));
frontend/src/pages/AdminPage.js:1025:            alert(tr("تعذر توليد الاقتراحات"));
frontend/src/pages/AdminPage.js:1034:            alert(`${tr("✅ تم إرسال الإشعار التجريبي إلى حسابك")}\n\nExpo: ${data?.push?.expo ?? 0}  •  Web: ${data?.push?.web ?? 0}`);
frontend/src/pages/AdminPage.js:1036:            alert(e?.response?.data?.detail || tr("تعذر إرسال الإشعار التجريبي"));
frontend/src/pages/AdminPage.js:1055:                        <input data-testid="notif-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("🔥 عرض اليوم!")} />
frontend/src/pages/AdminPage.js:1059:                        <textarea data-testid="notif-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={500} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder={tr("اكتشف صفقات حصرية على الإعلانات الجديدة!")} />
frontend/src/pages/AdminPage.js:1064:                            <input data-testid="notif-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={300} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="/listing/abc123  •  /auctions  •  https://..." />
frontend/src/pages/AdminPage.js:1069:                            <input data-testid="notif-image" type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} maxLength={400} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="https://res.cloudinary.com/.../image.jpg" />
frontend/src/pages/AdminPage.js:1088:                                <input value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })} maxLength={2} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="SA / AE / KW..." />
frontend/src/pages/AdminPage.js:1094:                                <input data-testid="notif-category" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="cars / electronics ..." />
frontend/src/pages/AdminPage.js:1208:                    <input data-testid="ad-title-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={tr("عنوان الإعلان")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1212:                            <input data-testid="ad-image-input" required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder={tr("رابط الصورة (https://...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1213:                            <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder={tr("رابط عند الضغط (اختياري)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1218:                            <input data-testid="ad-iframe-url-input" required value={form.iframe_url} onChange={(e) => setForm({ ...form, iframe_url: e.target.value })} placeholder={tr("رابط iframe الكامل (https://trip.com/...)")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none ltr-text" dir="ltr" />
frontend/src/pages/AdminPage.js:1220:                                <input type="number" value={form.iframe_width} onChange={(e) => setForm({ ...form, iframe_width: parseInt(e.target.value) || 300 })} placeholder="العرض (px)" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1221:                                <input type="number" value={form.iframe_height} onChange={(e) => setForm({ ...form, iframe_height: parseInt(e.target.value) || 250 })} placeholder="الارتفاع (px)" className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none" />
frontend/src/pages/AdminPage.js:1304:        } catch (e) { alert(e.response?.data?.detail || tr("فشل الإضافة")); }
frontend/src/pages/AdminPage.js:1311:        catch (e) { alert(e.response?.data?.detail || tr("فشل الحذف")); }
frontend/src/pages/AdminPage.js:1322:        } catch (e) { alert(e.response?.data?.detail || tr("فشل")); }
frontend/src/pages/AdminPage.js:1332:        } catch (e) { alert(e.response?.data?.detail || tr("فشل")); }
frontend/src/pages/AdminPage.js:1362:                    <input data-testid="new-city-ar" value={newCity.name_ar} onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })} placeholder={tr("الاسم بالعربية *")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" />
frontend/src/pages/AdminPage.js:1363:                    <input data-testid="new-city-en" value={newCity.name_en} onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })} placeholder={tr("English name (optional)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none" dir="ltr" />
frontend/src/pages/AdminPage.js:1364:                    <input data-testid="new-city-districts" value={newCity.districts} onChange={(e) => setNewCity({ ...newCity, districts: e.target.value })} placeholder={tr("الأحياء (مفصولة بفاصلة)")} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" />
frontend/src/pages/AdminPage.js:1390:                                    <input data-testid="new-district-input" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} placeholder={tr("اسم الحي الجديد")} className="flex-1 bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] outline-none font-arabic-body" onKeyDown={(e) => e.key === "Enter" && addDistrict()} />
frontend/src/pages/AdminPage.js:1477:            alert(err?.response?.data?.detail || tr("تعذرت الإضافة"));
frontend/src/pages/AdminPage.js:1511:                    <input data-testid="bw-new" placeholder={tr("أضف كلمة محظورة جديدة...")} value={newWord} onChange={(e) => setNewWord(e.target.value)} maxLength={60} className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AdminPage.js:1514:                <input data-testid="bw-filter" placeholder={tr("بحث في القائمة...")} value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-arabic-body" />
frontend/src/pages/AuctionsPage.js:256:                        <input data-testid="bid-amount" type="number" min={minRequired} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${minRequired}`} className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl px-3 py-3 text-base font-bold text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin" />
frontend/src/pages/Auth.js:52:            alert(tr("تعذر بدء تسجيل الدخول بـ Google"));
frontend/src/pages/Auth.js:55:        alert(tr("Google OAuth غير مُعد على الخادم. تواصل مع الدعم."));
frontend/src/pages/Auth.js:72:            alert(tr("تعذر بدء تسجيل الدخول بـ X — تأكد من إعدادات Developer Portal"));
frontend/src/pages/Auth.js:80:            alert(tr("تعذر بدء تسجيل الدخول بـ Snapchat. تأكد من إعدادات Snap Developer Portal."));
frontend/src/pages/Auth.js:89:                alert(tr("تعذر بدء تسجيل الدخول بـ Apple"));
frontend/src/pages/Auth.js:92:            alert(tr("Apple Sign In غير مُعد على الخادم. تواصل مع الدعم."));
frontend/src/pages/Auth.js:193:                    <Field icon={Mail} type="email" placeholder={t("email")} value={email} onChange={setEmail} testid="login-email" />
frontend/src/pages/Auth.js:196:                        <input data-testid="login-password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")}
frontend/src/pages/Auth.js:290:                    <Field icon={User} placeholder={t("name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="reg-name" />
frontend/src/pages/Auth.js:291:                    <Field icon={Mail} type="email" placeholder={t("email")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="reg-email" />
frontend/src/pages/Auth.js:292:                    <PasswordFieldWithStrength value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={`${t("password")} (8 أحرف على الأقل)`} testid="reg-password" />
frontend/src/pages/Auth.js:293:                    <PasswordFieldWithStrength value={confirmPw} onChange={setConfirmPw} placeholder={tr("تأكيد كلمة المرور")} testid="reg-confirm-password" />
frontend/src/pages/Auth.js:306:                            <input data-testid="reg-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} placeholder={tr("رقم الجوال")} maxLength={cur?.phone_length || 9}
frontend/src/pages/Auth.js:320:                    <Field icon={Gift} placeholder={tr("كود الإحالة (اختياري)")} value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v.toUpperCase() })} testid="reg-referral" />
frontend/src/pages/Auth.js:381:                        <Field icon={Mail} type="email" placeholder={t("email")} value={email} onChange={setEmail} testid="forgot-email" />
frontend/src/pages/Auth.js:409:function PasswordFieldWithStrength({ value, onChange, placeholder, testid }) {
frontend/src/pages/Auth.js:416:                <input data-testid={testid} type={show ? "text" : "password"} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
frontend/src/pages/Auth.js:473:                        <PasswordFieldWithStrength value={password} onChange={setPassword} placeholder={tr("كلمة المرور الجديدة")} testid="reset-password" />
frontend/src/pages/Auth.js:474:                        <PasswordFieldWithStrength value={confirmPw} onChange={setConfirmPw} placeholder={tr("تأكيد كلمة المرور")} testid="reset-confirm-password" />
frontend/src/pages/Auth.js:483:function Field({ icon: Icon, type = "text", placeholder, value, onChange, testid, minLength }) {
frontend/src/pages/Auth.js:487:            <input data-testid={testid} type={type} minLength={minLength} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
frontend/src/pages/CategoryPage.js:125:                    <input data-testid="filter-min-price" type="number" placeholder={tr("السعر من")} value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:126:                    <input data-testid="filter-max-price" type="number" placeholder={tr("السعر إلى")} value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:127:                    <input data-testid="filter-city" type="text" placeholder={tr("المدينة")} value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/ChatPage.js:618:        } catch (_) { alert(tr("فشل الرفع")); }
frontend/src/pages/ChatPage.js:621:        if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
frontend/src/pages/ChatPage.js:625:            () => alert(tr("تعذر الوصول للموقع"))
frontend/src/pages/ChatPage.js:640:        } catch (_) { alert(tr("تعذر الوصول للميكروفون")); }
frontend/src/pages/ChatPage.js:650:        } catch (_) { alert(tr("تعذرت الترجمة")); }
frontend/src/pages/ChatPage.js:833:                                    rows={1} placeholder={tr("اكتب رسالتك...")}
frontend/src/pages/DownloadPage.js:13: *   If the URL is empty we stay on the page and show the QR placeholders.
frontend/src/pages/DownloadPage.js:16: *   greyed-out placeholder showing "قريباً" so the page is always usable
frontend/src/pages/FlightsPage.js:153:                            placeholder={tr("ابحث عن مدينة أو مطار أو رمز IATA...")}
frontend/src/pages/FlightsPage.js:203:        if (!from || !to || !date) { alert(tr("الرجاء اختيار المطار والتاريخ")); return; }
frontend/src/pages/FlightsPage.js:204:        if (from === to) { alert(tr("لا يمكن أن يكون مطار المغادرة والوصول متشابهين")); return; }
frontend/src/pages/ListingDetail.js:145:        } catch (_) { alert(tr("تعذر تنفيذ الإجراء")); }
frontend/src/pages/ListingDetail.js:156:                alert(tr("✅ تم تفعيل تنبيه الأسعار. ستتلقى إشعاراً عند تخفيض السعر."));
frontend/src/pages/ListingDetail.js:158:        } catch (_) { alert(tr("تعذر تنفيذ الإجراء")); }
frontend/src/pages/ListingDetail.js:210:        } catch (e) { alert(e.response?.data?.detail || tr("تعذر نشر التعليق")); }
frontend/src/pages/ListingDetail.js:218:        if (!Number.isFinite(amount) || amount <= 0) return alert(tr("أدخل قيمة عرض صحيحة"));
frontend/src/pages/ListingDetail.js:225:            alert(tr("تم إرسال عرضك للبائع بنجاح"));
frontend/src/pages/ListingDetail.js:227:            alert(e.response?.data?.detail || tr("تعذر إرسال العرض"));
frontend/src/pages/ListingDetail.js:235:            alert(data.message || "تم التجديد");
frontend/src/pages/ListingDetail.js:239:            alert(e.response?.data?.detail || "تعذر التجديد");
frontend/src/pages/ListingDetail.js:247:            alert(tr("✅ تم تحديد الإعلان كمباع. شكراً لاستخدامك الحراج بلس!"));
frontend/src/pages/ListingDetail.js:250:            alert(e.response?.data?.detail || "تعذر التحديث");
frontend/src/pages/ListingDetail.js:261:            alert(sold ? "✅ شكراً، نتمنى لك بيعاً موفقاً دائماً!" : "تم حذف الإعلان");
frontend/src/pages/ListingDetail.js:264:            alert(e.response?.data?.detail || "تعذر الحذف");
frontend/src/pages/ListingDetail.js:292:            alert(isPaused ? tr("✓ تم استئناف الإعلان") : tr("⏸️ تم إيقاف الإعلان مؤقتاً"));
frontend/src/pages/ListingDetail.js:294:            alert(e.response?.data?.detail || tr("تعذر التحديث"));
frontend/src/pages/ListingDetail.js:377:                                        alert(tr("✅ تم نسخ رابط الإعلان"));
frontend/src/pages/ListingDetail.js:412:                                <input data-testid="listing-comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={1000} placeholder={tr("اكتب تعليقًا عامًا...")} className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/ListingDetail.js:649:                        <input autoFocus required type="number" min="1" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-3" placeholder={listing.price ? String(listing.price) : "0"} />
frontend/src/pages/ListingDetail.js:651:                        <textarea rows={3} value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-4" placeholder={tr("اكتب رسالة للبائع...")} />
frontend/src/pages/PostListing.js:93:        }).catch(() => alert(tr("تعذر تحميل الإعلان")));
frontend/src/pages/PostListing.js:348:                alert(`💡 ${data.note}\nنطاق السوق: ${data.suggested_min.toLocaleString()} - ${data.suggested_max.toLocaleString()}`);
frontend/src/pages/PostListing.js:350:                alert(data.note || "لا توجد بيانات كافية");
frontend/src/pages/PostListing.js:352:        } catch (_) { alert(tr("تعذر اقتراح السعر")); }
frontend/src/pages/PostListing.js:423:        if (file.size > 8 * 1024 * 1024) { alert(tr("حجم الصورة كبير جداً (الحد الأقصى 8MB)")); return; }
frontend/src/pages/PostListing.js:448:            alert(tr("✨ تم تعبئة الإعلان بالذكاء الاصطناعي! راجع التفاصيل وعدّل ما تشاء."));
frontend/src/pages/PostListing.js:685:                        <input data-testid="post-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("مثال: تويوتا كامري 2020 — وارد الخليج")} />
frontend/src/pages/PostListing.js:731:                        <textarea data-testid="post-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={tr("اكتب وصفاً تفصيلياً...")} />
frontend/src/pages/PostListing.js:806:                                    <input data-testid="post-price" type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl ps-4 pe-16 py-3 text-base border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold tracking-wider" placeholder={tr("اتركه فارغاً للسوم")} style={{ minHeight: "48px" }} />
frontend/src/pages/PostListing.js:848:                                <input data-testid={`field-${f.key}`} type={f.type} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
frontend/src/pages/PostListing.js:850:                                <input data-testid={`field-${f.key}`} value={form.custom_fields[f.key] || ""} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" placeholder={f.placeholder || ""} />
frontend/src/pages/PostListing.js:986:                            if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
frontend/src/pages/PostListing.js:989:                                () => alert(tr("تعذر الوصول للموقع. تأكد من السماح بالموقع"))
frontend/src/pages/PostListing.js:1011:                        placeholder based on the active country (NOT always +966). */}
frontend/src/pages/PostListing.js:1071:                                            placeholder={ph}
frontend/src/pages/ProfilePage.js:103:        } catch (e) { alert(e.response?.data?.detail || tr("تعذر تحديث العرض")); }
frontend/src/pages/ProfilePage.js:171:                            alert(tr("تم نسخ رابط الدعوة ✅"));
frontend/src/pages/ProfilePage.js:348:            alert(e.response?.data?.detail || tr("تعذر حفظ الرقم"));
frontend/src/pages/ProfilePage.js:357:                <input data-testid="profile-phone-input" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))} placeholder="5xxxxxxxx" className="flex-1 bg-[var(--surface-elevated)] rounded-lg px-3 py-1.5 text-sm border border-[var(--primary)] outline-none font-latin tracking-wider" autoFocus />
frontend/src/pages/ReelsPage.js:59:                alert(tr("✅ تم نسخ رابط الإعلان"));
frontend/src/pages/SearchAndMap.js:162:            alert(tr("المتصفح لا يدعم البحث الصوتي"));
frontend/src/pages/SearchAndMap.js:186:                    <input data-testid="search-page-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSearchParams({ q })} placeholder={t("search_placeholder")} className="bg-transparent flex-1 mx-3 outline-none text-sm text-[var(--text)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:213:                            <input data-testid="filter-min" type="number" placeholder={tr("السعر من")} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:214:                            <input data-testid="filter-max" type="number" placeholder={tr("السعر إلى")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:281:        if (!navigator.geolocation) { alert(tr("المتصفح لا يدعم تحديد الموقع")); return; }
frontend/src/pages/SearchAndMap.js:284:            () => alert(tr("تعذر الوصول للموقع"))
frontend/src/pages/StaticPages.js:28:            alert(tr("تم استلام طلب حذف الحساب. سيتم مراجعته من قبل الإدارة خلال 48 ساعة."));
frontend/src/pages/StaticPages.js:29:        } catch (_) { alert(tr("تعذر إرسال الطلب")); }
frontend/src/pages/StaticPages.js:165:                    <input data-testid="contact-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={tr("الموضوع")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/StaticPages.js:166:                    <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={tr("اكتب رسالتك...")} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]"></textarea>
frontend/src/pages/WorkflowPage.js:36:      {isBuy ? <><input required minLength={3} value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("عنوان الطلب")} className="field" /><div className="grid sm:grid-cols-2 gap-3"><input required value={form.category} onChange={e => set("category", e.target.value)} placeholder={t("الفئة")} className="field" /><input value={form.city} onChange={e => set("city", e.target.value)} placeholder={t("المدينة")} className="field" /></div><div className="grid sm:grid-cols-2 gap-3"><input type="number" min="0" value={form.budget_min} onChange={e => set("budget_min", e.target.value)} placeholder={t("الميزانية من")} className="field" /><input type="number" min="0" value={form.budget_max} onChange={e => set("budget_max", e.target.value)} placeholder={t("الميزانية إلى")} className="field" /></div><textarea required value={form.description} onChange={e => set("description", e.target.value)} placeholder={t("وصف الطلب")} className="field min-h-28" /></> : <><input required minLength={3} value={form.subject} onChange={e => set("subject", e.target.value)} placeholder={t("موضوع التذكرة")} className="field" /><div className="grid sm:grid-cols-2 gap-3"><select value={form.category} onChange={e => set("category", e.target.value)} className="field"><option value="general">{t("عام")}</option><option value="account">{t("الحساب")}</option><option value="listing">{t("إعلان")}</option><option value="payment">{t("الدفع")}</option><option value="report">{t("بلاغ")}</option></select><select value={form.priority} onChange={e => set("priority", e.target.value)} className="field"><option value="normal">{t("عادي")}</option><option value="high">{t("مرتفع")}</option><option value="urgent">{t("عاجل")}</option></select></div><textarea required value={form.message} onChange={e => set("message", e.target.value)} placeholder={t("اكتب رسالتك")} className="field min-h-28" /></>}
mobile/src/biometric.js:40:        Alert.alert("تعذّر التفعيل", "جهازك لا يدعم البصمة أو لم تُسجّل بصمة/FaceID في الإعدادات.");
mobile/src/biometric.js:58:        Alert.alert("خطأ", "تعذّر حفظ بيانات الدخول بأمان");
mobile/src/components/AnimalsEquipmentBoxesMobile.js:105:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:110:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:125:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:139:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:218:        })} placeholder={t("مثال: CAT 320D")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:232:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AnimalsEquipmentBoxesMobile.js:247:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:85:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:90:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:98:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:103:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:116:        })} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:230:          })} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:242:          })} placeholder={t("المدينة، الحي")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:247:          })} placeholder={t("المدينة، الحي")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:266:          })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/AuctionsServicesBoxesMobile.js:271:          })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/CategoryCascadesMobile.js:24:  placeholder,
mobile/src/components/CategoryCascadesMobile.js:34:                <Text style={value ? ps.txt : ps.ph}>{value || placeholder || "—"}</Text>
mobile/src/components/CategoryCascadesMobile.js:108:                <Lab text={t("الماركة")}><Picker value={v.car_brand || ""} options={brands} placeholder="—" onChange={b => set({
mobile/src/components/CategoryCascadesMobile.js:113:                <Lab text={t("الموديل")}><Picker value={v.car_model || ""} options={models} placeholder="—" disabled={!v.car_brand} onChange={m => set({
mobile/src/components/CategoryCascadesMobile.js:119:                <Lab text={t("السنة")}><Picker value={v.car_year || ""} options={years} placeholder="—" onChange={y => set({
mobile/src/components/CategoryCascadesMobile.js:122:                <Lab text={t("الفئة")}><Picker value={v.car_trim || ""} options={trims} placeholder="—" disabled={!v.car_model} onChange={tx => set({
mobile/src/components/CategoryCascadesMobile.js:127:                <Lab text={t("الممشى (كم)")}><Picker value={v.mileage || ""} options={CAR_OPTS.mileage} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:130:                <Lab text={t("ناقل الحركة")}><Picker value={v.transmission || ""} options={CAR_OPTS.transmission} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:135:                <Lab text={t("نوع الوقود")}><Picker value={v.fuel_type || ""} options={CAR_OPTS.fuel_type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:138:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={CAR_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:143:                <Lab text={t("نوع الإعلان")}><Picker value={v.listing_type || ""} options={CAR_OPTS.listing_type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:146:                <Lab text={t("اللون")}><Picker value={v.color || ""} options={CAR_OPTS.color} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:209:                <Lab text={t("الماركة")}><Picker value={v.phone_brand || ""} options={brands} placeholder="—" onChange={b => set({
mobile/src/components/CategoryCascadesMobile.js:215:                <Lab text={t("الموديل")}><Picker value={v.phone_model || ""} options={models} placeholder="—" disabled={!v.phone_brand} onChange={m => set({
mobile/src/components/CategoryCascadesMobile.js:222:                <Lab text={t("السعة")}><Picker value={v.phone_storage || ""} options={storages} placeholder="—" disabled={!v.phone_model} onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:225:                <Lab text={t("اللون")}><Picker value={v.phone_color || ""} options={palette} placeholder="—" disabled={!v.phone_model} onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:230:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={PHONE_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:233:                <Lab text={t("الذاكرة (RAM)")}><Picker value={v.ram || ""} options={PHONE_OPTS.ram} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:238:                <Lab text={t("الضمان")}><Picker value={v.warranty || ""} options={PHONE_OPTS.warranty} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:281:                <Lab text={t("نوع الأثاث")}><Picker value={v.furniture_type || ""} options={FURNITURE_OPTS.type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:284:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={FURNITURE_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:289:                <Lab text={t("الخامة")}><Picker value={v.material || ""} options={FURNITURE_OPTS.material} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:292:                <Lab text={t("اللون")}><Picker value={v.color || ""} options={FURNITURE_OPTS.color} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:297:                <Lab text={t("مدة الاستخدام")}><Picker value={v.usage_duration || ""} options={FURNITURE_OPTS.usage_duration} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:300:                <Lab text={t("الماركة / المصدر")}><Picker value={v.brand || ""} options={FURNITURE_OPTS.brand} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:305:                <Lab text={t("المقاس")}><Picker value={v.size || ""} options={FURNITURE_OPTS.size} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:308:                <Lab text={t("مكان الاستخدام")}><Picker value={v.location || ""} options={FURNITURE_OPTS.location} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:328:                <Lab text={t("نوع الجهاز")}><Picker value={v.appliance_type || ""} options={APPLIANCE_OPTS.appliance_type} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:331:                <Lab text={t("الماركة")}><Picker value={v.brand || ""} options={APPLIANCE_OPTS.brand} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:336:                <Lab text={t("الحالة")}><Picker value={v.condition || ""} options={APPLIANCE_OPTS.condition} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:339:                <Lab text={t("الضمان")}><Picker value={v.warranty || ""} options={APPLIANCE_OPTS.warranty} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:344:                <Lab text={t("استهلاك الطاقة")}><Picker value={v.power || ""} options={APPLIANCE_OPTS.power} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:347:                <Lab text={t("نوع الاستخدام")}><Picker value={v.usage || ""} options={APPLIANCE_OPTS.usage} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:352:                <Lab text={t("الفولت / الجهد")}><Picker value={v.voltage || ""} options={APPLIANCE_OPTS.voltage} placeholder="—" onChange={x => set({
mobile/src/components/CategoryCascadesMobile.js:355:                <Lab text={t("بلد المنشأ")}><Picker value={v.origin || ""} options={APPLIANCE_OPTS.origin} placeholder="—" onChange={x => set({
mobile/src/components/JobsRealEstateBoxesMobile.js:47:        })} placeholder={t("مثال: مهندس برمجيات أول")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:61:        })} placeholder={t("مثال: 8,000 ر.س")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:65:        })} placeholder={t("مثال: 6,000 - 10,000 ر.س")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:109:      })} placeholder={t("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/components/JobsRealEstateBoxesMobile.js:119:      })} placeholder={t("اذكر المؤهلات والمتطلبات الإلزامية...")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/components/JobsRealEstateBoxesMobile.js:191:        })} keyboardType="numeric" placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/JobsRealEstateBoxesMobile.js:197:        })} keyboardType="numeric" placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/components/LocationPicker.js:217:                placeholder={t("ابحث...")}
mobile/src/components/LocationPicker.js:218:                placeholderTextColor={palette.textSubtle}
mobile/src/components/Skeleton.js:1:// Lightweight pulsing skeleton placeholders. No external libs — uses Animated.
mobile/src/components/Skeleton.js:34:// Listing card placeholder (matches ListingCard footprint roughly)
mobile/src/screens/AIAssistantScreen.js:154:                <TextInput value={input} onChangeText={setInput} placeholder={t("اكتب رسالتك...")} placeholderTextColor={colors.textMuted} style={styles.input} editable={!busy} multiline maxLength={2000} />
mobile/src/screens/AuctionsScreen.js:232:      Alert.alert(t("تنبيه"), `${t("الحد الأدنى للمزايدة")}: ${minRequired.toLocaleString()} (${t("زيادة لا تقل عن")} ${minIncrement.toLocaleString()})`);
mobile/src/screens/AuctionsScreen.js:242:      Alert.alert(t("تنبيه"), e.response?.data?.detail || t("تعذر إيداع المزايدة"));
mobile/src/screens/AuctionsScreen.js:282:                        <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={String(minRequired)} placeholderTextColor={colors.textMuted} style={styles.bidInput} />
mobile/src/screens/AuthScreens.js:85:        Alert.alert(t("خطأ"), e.message || `${t("حدث خطأ. حاول مرة أخرى.")} (${provider})`);
mobile/src/screens/AuthScreens.js:181:          Alert.alert(
mobile/src/screens/AuthScreens.js:188:                if (ok) Alert.alert("✅", `${t("تفعيل الدخول بـ")}${bioLabel}.`);
mobile/src/screens/AuthScreens.js:204:      Alert.alert("✅", `${t("تفعيل الدخول بـ")}${bioLabel}.`);
mobile/src/screens/AuthScreens.js:237:                    <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="mobile-login-email" />
mobile/src/screens/AuthScreens.js:238:                    <TextInput placeholder={t("كلمة المرور")} placeholderTextColor={theme.colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry style={styles.input} testID="mobile-login-password" />
mobile/src/screens/AuthScreens.js:336:                    <TextInput placeholder={t("الاسم الكامل")} placeholderTextColor={theme.colors.textMuted} value={form.name} onChangeText={v => setForm({
mobile/src/screens/AuthScreens.js:340:                    <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={form.email} onChangeText={v => setForm({
mobile/src/screens/AuthScreens.js:344:                    <TextInput placeholder={t("كلمة المرور")} placeholderTextColor={theme.colors.textMuted} value={form.password} onChangeText={v => setForm({
mobile/src/screens/AuthScreens.js:348:                    <TextInput placeholder={t("رقم الجوال") + ` (${phoneExampleFor(form.country_code)})`} placeholderTextColor={theme.colors.textMuted} value={form.phone} onChangeText={v => setForm({
mobile/src/screens/ChatScreen.js:274:                    <TextInput value={search} onChangeText={setSearch} placeholder={t("ابحث عن محادثة...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
mobile/src/screens/ChatScreen.js:689:      Alert.alert(t("خطأ"), t("تعذر إرسال الصورة"));
mobile/src/screens/ChatScreen.js:701:        Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع"));
mobile/src/screens/ChatScreen.js:715:      Alert.alert(t("خطأ"), t("تعذر إرسال الموقع"));
mobile/src/screens/ChatScreen.js:787:          Alert.alert(t("إذن"), t("نحتاج صلاحية الميكروفون"));
mobile/src/screens/ChatScreen.js:794:        if (!AudioRecorder) { Alert.alert(t("خطأ"), t("ميكروفون غير متاح")); return; }
mobile/src/screens/ChatScreen.js:806:      Alert.alert(t("خطأ"), t("تعذر التسجيل"));
mobile/src/screens/ChatScreen.js:864:        Alert.alert(t("خيارات"), `${other.name || t("المستخدم")}`, [{
mobile/src/screens/ChatScreen.js:873:              Alert.alert("✅", t("تم استلام بلاغك"));
mobile/src/screens/ChatScreen.js:875:              Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
mobile/src/screens/ChatScreen.js:884:              Alert.alert("🚫", t("تم حظر المستخدم"));
mobile/src/screens/ChatScreen.js:887:              Alert.alert(t("خطأ"), t("تعذر الحظر"));
mobile/src/screens/ChatScreen.js:999:                <TextInput value={input} onChangeText={handleInputChange} placeholder={t("رسالة...")} placeholderTextColor={colors.textMuted} style={s.composerInput} multiline maxLength={2000} onBlur={() => sendTyping(false)} />
mobile/src/screens/ChatScreen.js:1095:            Alert.alert("✓", t("تمت إعادة التوجيه"));
mobile/src/screens/ChatScreen.js:1097:            Alert.alert(t("خطأ"), t("تعذرت إعادة التوجيه"));
mobile/src/screens/ChatScreen.js:1296:      Alert.alert(t("خطأ"), t("تعذر تشغيل الصوت"));
mobile/src/screens/FlightsScreen.js:306:                        <TextInput value={q} onChangeText={setQ} placeholder={t("ابحث عن مدينة أو رمز (مثل RUH, DXB)")} placeholderTextColor={colors.textMuted} style={pStyles.input} autoFocus />
mobile/src/screens/FlightsScreen.js:403:      Alert.alert(t("تنبيه"), t("الرجاء اختيار المطار والتاريخ"));
mobile/src/screens/FlightsScreen.js:407:      Alert.alert(t("تنبيه"), t("لا يمكن أن يكون المغادرة والوصول متشابهين"));
mobile/src/screens/HomeScreen.js:166:      Alert.alert(
mobile/src/screens/HomeScreen.js:174:              if (!perm.granted) { Alert.alert(t("تنبيه"), t("يلزم إذن الكاميرا")); return; }
mobile/src/screens/HomeScreen.js:203:      if (!b64) { Alert.alert(t("خطأ"), t("تعذر قراءة الصورة")); return; }
mobile/src/screens/HomeScreen.js:208:        if (!q) { Alert.alert(t("تنبيه"), t("لم نتمكن من فهم الصورة. حاول بصورة أوضح.")); return; }
mobile/src/screens/HomeScreen.js:211:        Alert.alert(t("خطأ"), t("خطأ في البحث بالصورة"));
mobile/src/screens/ListingDetailScreen.js:78:        Alert.alert(t("خطأ"), t("تعذر تحميل الإعلان"));
mobile/src/screens/ListingDetailScreen.js:171:    } catch (e) { Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر نشر التعليق")); }
mobile/src/screens/ListingDetailScreen.js:181:      Alert.alert(t("تم"), t("تم استلام بلاغك"));
mobile/src/screens/ListingDetailScreen.js:183:      Alert.alert(t("خطأ"), t("تعذر إرسال البلاغ"));
mobile/src/screens/ListingDetailScreen.js:191:      Alert.alert(t("تم"), data.message || t("تم التجديد"));
mobile/src/screens/ListingDetailScreen.js:193:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التجديد"));
mobile/src/screens/ListingDetailScreen.js:197:    Alert.alert(t("تأكيد"), t("هل تم بيع المنتج؟"), [{
mobile/src/screens/ListingDetailScreen.js:205:          Alert.alert(t("تم"), t("شكراً لك! نتمنى لك بيعاً موفقاً دائماً"));
mobile/src/screens/ListingDetailScreen.js:208:          Alert.alert(t("خطأ"), t("تعذر التحديث"));
mobile/src/screens/ListingDetailScreen.js:222:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
mobile/src/screens/ListingDetailScreen.js:238:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
mobile/src/screens/ListingDetailScreen.js:244:      Alert.alert(t("خطأ"), t("أدخل سعراً صحيحاً"));
mobile/src/screens/ListingDetailScreen.js:255:      Alert.alert(t("تم"), t("تم تفعيل التنبيه"));
mobile/src/screens/ListingDetailScreen.js:257:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التفعيل"));
mobile/src/screens/ListingDetailScreen.js:264:      Alert.alert(t("تم"), t("تم إلغاء التنبيه"));
mobile/src/screens/ListingDetailScreen.js:269:      Alert.alert(t("غير متاح"), t("لا توجد إحداثيات لهذا الإعلان"));
mobile/src/screens/ListingDetailScreen.js:363:        Alert.alert(t("تأكيد الحذف"), t("هل تريد حذف هذا الإعلان نهائياً؟"), [{
mobile/src/screens/ListingDetailScreen.js:372:              Alert.alert("تم الحذف");
mobile/src/screens/ListingDetailScreen.js:375:              Alert.alert(t("خطأ"), t("تعذر الحذف"));
mobile/src/screens/ListingDetailScreen.js:419:                    <TextInput value={commentText} onChangeText={setCommentText} maxLength={1000} placeholder={t("اكتب تعليقًا عامًا...")} placeholderTextColor={theme.colors.textMuted} style={styles.commentInput} multiline />
mobile/src/screens/ListingDetailScreen.js:511:        Alert.alert(t("الإبلاغ عن الإعلان"), t("اختر سبب الإبلاغ"), [{
mobile/src/screens/MapScreen.js:84:                        placeholder={t("ابحث في الخريطة...")}
mobile/src/screens/MapScreen.js:85:                        placeholderTextColor="#94A3B8"
mobile/src/screens/PasswordReset.js:27:        Alert.alert(t("رمز التحقق"), data.dev_reset_link);
mobile/src/screens/PasswordReset.js:45:                        <TextInput placeholder={t("البريد الإلكتروني")} placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} testID="mobile-forgot-email" />
mobile/src/screens/PasswordReset.js:79:      Alert.alert("تم تغيير كلمة المرور بنجاح");
mobile/src/screens/PasswordReset.js:91:                <TextInput placeholder={t("رمز التحقق")} placeholderTextColor={theme.colors.textMuted} value={token} onChangeText={setToken} autoCapitalize="none" style={styles.input} testID="mobile-reset-token" />
mobile/src/screens/PasswordReset.js:92:                <TextInput placeholder={t("كلمة المرور الجديدة")} placeholderTextColor={theme.colors.textMuted} value={pw} onChangeText={setPw} secureTextEntry style={styles.input} testID="mobile-reset-password" />
mobile/src/screens/PostScreen.js:123:    Alert.alert(
mobile/src/screens/PostScreen.js:141:        Alert.alert(t("إذن الكاميرا"), t("الرجاء السماح بالوصول للكاميرا من الإعدادات"));
mobile/src/screens/PostScreen.js:156:      Alert.alert(t("إذن"), t("نحتاج صلاحية الصور"));
mobile/src/screens/PostScreen.js:180:        Alert.alert(t("لم يتمكن المساعد من قراءة الصورة"), t("جرّب صورة أوضح للمنتج"));
mobile/src/screens/PostScreen.js:200:      Alert.alert(t("تم بالذكاء الاصطناعي"), filledMsg || t("تم"));
mobile/src/screens/PostScreen.js:202:      Alert.alert(t("خطأ"), formatApiError(e.response?.data?.detail) || t("تعذر التعبئة"));
mobile/src/screens/PostScreen.js:242:      Alert.alert(t("خطأ"), t("فشل رفع الصورة"));
mobile/src/screens/PostScreen.js:250:      Alert.alert(t("إذن"), t("نحتاج صلاحية الصور"));
mobile/src/screens/PostScreen.js:263:      Alert.alert(t("إذن"), t("نحتاج صلاحية الكاميرا"));
mobile/src/screens/PostScreen.js:268:    Alert.alert(t("الكاميرا"), t("ماذا تريد التقاطه؟"), [
mobile/src/screens/PostScreen.js:297:    if (asset.size && asset.size > 80 * 1024 * 1024) { Alert.alert(t("خطأ"), t("ملف 3D أكبر من 80 ميجابايت")); return; }
mobile/src/screens/PostScreen.js:308:    } catch (_) { Alert.alert(t("خطأ"), t("فشل رفع نموذج 3D")); }
mobile/src/screens/PostScreen.js:314:      Alert.alert(t("إذن"), t("نحتاج صلاحية الوسائط"));
mobile/src/screens/PostScreen.js:360:        Alert.alert(t("خطأ"), t("فشل رفع الفيديو"));
mobile/src/screens/PostScreen.js:363:      Alert.alert(t("خطأ"), t("فشل رفع الفيديو"));
mobile/src/screens/PostScreen.js:375:      Alert.alert(t("إذن"), t("نحتاج صلاحية الموقع"));
mobile/src/screens/PostScreen.js:396:        Alert.alert("✅", `${t("تم اقتراح:")} ${leaf?.name || ""}\n${t("يمكنك تغييرها يدوياً.")}`);
mobile/src/screens/PostScreen.js:404:          Alert.alert("⚠️", t("موقعك خارج المنطقة المدعومة. اختر المدينة يدوياً."));
mobile/src/screens/PostScreen.js:407:          Alert.alert("✅", `${t("تم اقتراح:")} ${data.city}${data.district ? " — " + data.district : ""}\n${t("يمكنك تغييرها يدوياً.")}`);
mobile/src/screens/PostScreen.js:410:          Alert.alert("✅", t("تم تحديد موقعك. اختر المدينة يدوياً."));
mobile/src/screens/PostScreen.js:414:        Alert.alert("✅", t("تم تحديد موقعك"));
mobile/src/screens/PostScreen.js:417:      Alert.alert(t("خطأ"), t("تعذّر الوصول للموقع"));
mobile/src/screens/PostScreen.js:741:                        <TextInput value={q} onChangeText={setQ} placeholder={kind === "city" ? t("ابحث أو اختر من القائمة...") : t("ابحث أو اختر الحي...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
mobile/src/screens/PostScreen.js:1043:                <TextInput value={form.title} onChangeText={v => update("title", v)} placeholder={t("مثال: تويوتا كامري 2020 ممتازة")} placeholderTextColor={colors.textMuted} style={s.input} />
mobile/src/screens/PostScreen.js:1103:                <TextInput value={form.description} onChangeText={v => update("description", v)} placeholder={t("اوصف منتجك بالتفصيل...")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/screens/PostScreen.js:1173:                        <TextInput value={form.price} onChangeText={v => update("price", v.replace(/[^0-9.]/g, ""))} placeholder={t("اتركه فارغاً للسوم")} placeholderTextColor={colors.textMuted} style={[s.input, {
mobile/src/screens/PostScreen.js:1199:      }))} placeholder={t("اختر...")} onChange={v => updateCF(f.key, v)} /> : f.type === "number" ? <TextInput value={String(form.custom_fields[f.key] || "")} onChangeText={v => updateCF(f.key, v)} keyboardType="numeric" placeholder={f.placeholder || ""} placeholderTextColor={colors.textMuted} style={s.input} /> : <TextInput value={form.custom_fields[f.key] || ""} onChangeText={v => updateCF(f.key, v)} keyboardType={f.type === "url" ? "url" : "default"} placeholder={f.type === "date" ? "YYYY-MM-DD" : (f.placeholder || "")} placeholderTextColor={colors.textMuted} style={s.input} />}
mobile/src/screens/PostScreen.js:1334:                        placeholder={t("مثال: 5xxxxxxxx (بدون كود الدولة)")}
mobile/src/screens/PostScreen.js:1335:                        placeholderTextColor={colors.textMuted}
mobile/src/screens/PostScreen.js:1456:  placeholder,
mobile/src/screens/PostScreen.js:1465:                <Text style={value ? s.inputText : s.inputPh}>{sel?.label || placeholder}</Text>
mobile/src/screens/PostScreen.js:1470:                        <Text style={s.modalTitle}>{placeholder}</Text>
mobile/src/screens/PostScreen.js:1514:                        <TextInput value={q} onChangeText={setQ} placeholder={t("ابحث...")} placeholderTextColor={colors.textMuted} style={s.searchInput} />
mobile/src/screens/ProfileScreen.js:101:      Alert.alert("✅", next ? t("أصبح رقم جوالك مرئياً للمشترين") : t("تم إخفاء رقم جوالك"));
mobile/src/screens/ProfileScreen.js:103:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر التحديث"));
mobile/src/screens/ProfileScreen.js:109:    Alert.alert(t("تأكيد"), t("هل تريد تسجيل الخروج؟"), [{
mobile/src/screens/SearchScreen.js:122:        if (!AudioRecorder) { Alert.alert(t("خطأ"), t("ميكروفون غير متاح")); return; }
mobile/src/screens/SearchScreen.js:143:        Alert.alert(t("خطأ"), t("تعذر قراءة الصورة"));
mobile/src/screens/SearchScreen.js:154:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر تحليل الصورة؛ حاول مرة أخرى"));
mobile/src/screens/SearchScreen.js:286:      Alert.alert(t("تنبيه"), t("اكتب عبارة بحث أولاً"));
mobile/src/screens/SearchScreen.js:297:      Alert.alert("✅", t("تم حفظ البحث. سننبهك عند ظهور نتائج جديدة."));
mobile/src/screens/SearchScreen.js:299:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر الحفظ"));
mobile/src/screens/SearchScreen.js:317:        }} onSubmitEditing={() => runSearch()} placeholder={t("ابحث عن أي شيء...")} placeholderTextColor={colors.textMuted} style={s.searchInput} autoFocus={!initialQ} returnKeyType="search" />
mobile/src/screens/SearchScreen.js:509:            })} placeholder={t("من")} placeholderTextColor={colors.textMuted} keyboardType="numeric" style={s.priceInput} />
mobile/src/screens/SearchScreen.js:514:            })} placeholder={t("إلى")} placeholderTextColor={colors.textMuted} keyboardType="numeric" style={s.priceInput} />
mobile/src/screens/SellerProfile.js:74:      Alert.alert(t("خطأ"), t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/SellerProfile.js:83:      Alert.alert("✅", t("شكراً لك!"));
mobile/src/screens/SellerProfile.js:94:      Alert.alert(t("خطأ"), e.response?.data?.detail || t("حدث خطأ. حاول مرة أخرى."));
mobile/src/screens/SellerProfile.js:132:          Alert.alert(t("خيارات"), "", [{
mobile/src/screens/SellerProfile.js:141:                Alert.alert("✅", t("تم استلام بلاغك"));
mobile/src/screens/SellerProfile.js:150:                Alert.alert("🚫", t("تم الحظر"));
mobile/src/screens/SellerProfile.js:190:                        <TextInput value={comment} onChangeText={setComment} placeholder={t("اكتب تعليقك (اختياري)")} placeholderTextColor={theme.colors.textMuted} multiline style={s.input} testID="mobile-rating-comment" />
mobile/src/screens/WalletScreen.js:57:      Alert.alert(t("تم!"), `تم استلام مكافأتك ${r.amount} ر.س 🎉`);
mobile/src/screens/WalletScreen.js:65:      Alert.alert(t("تنبيه"), typeof msg === "string" ? msg : t("تعذر استلام المكافأة"));
mobile/src/screens/OffersScreen.js:32:    catch (e) { Alert.alert(t("خطأ"), e.response?.data?.detail || t("تعذر تحديث العرض")); }
mobile/src/screens/OffersScreen.js:53:    <Modal visible={!!counter} transparent animationType="fade" onRequestClose={() => setCounter(null)}><View style={s.modalBg}><View style={[s.modal, { backgroundColor: palette.surface }]}><Text style={[s.modalTitle, { color: palette.text }]}>{t("العرض المضاد")}</Text><TextInput value={counterAmount} onChangeText={setCounterAmount} keyboardType="decimal-pad" placeholder={t("قيمة العرض")} placeholderTextColor={palette.textMuted} style={[s.input, { color: palette.text, borderColor: palette.border }]} /><View style={s.modalActions}><TouchableOpacity onPress={() => setCounter(null)} style={[s.modalBtn, { backgroundColor: palette.surfaceElevated }]}><Text style={{ color: palette.text, fontWeight: "800" }}>{t("إلغاء")}</Text></TouchableOpacity><TouchableOpacity onPress={() => counterAmount && decide(counter, "counter", counterAmount)} style={[s.modalBtn, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryFg, fontWeight: "800" }}>{t("إرسال")}</Text></TouchableOpacity></View></View></View></Modal>
mobile/src/screens/WorkflowScreens.js:8:function Field({ value, onChangeText, placeholder, multiline = false, keyboardType }) {
mobile/src/screens/WorkflowScreens.js:10:  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.muted} keyboardType={keyboardType} multiline={multiline} style={[s.field, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }, multiline && s.multiline]} />;
mobile/src/screens/WorkflowScreens.js:27:  return <SafeAreaView style={[s.root, { backgroundColor: palette.bg }]}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><FlatList data={rows} keyExtractor={(x) => String(x.id)} refreshing={loading} onRefresh={load} contentContainerStyle={s.content} ListHeaderComponent={<View><Text style={[s.title, { color: palette.text }]}>{t(buy ? "طلبات الشراء" : "الدعم والمساعدة")}</Text><Text style={[s.caption, { color: palette.muted }]}>{t(buy ? "اطلب منتجًا أو خدمة في الدولة المختارة" : "أنشئ تذكرة وتابع حالتها")}</Text>{buy ? <><Field value={form.title} onChangeText={(v) => set("title", v)} placeholder={t("عنوان الطلب")} /><Field value={form.category} onChangeText={(v) => set("category", v)} placeholder={t("الفئة")} /><Field value={form.city} onChangeText={(v) => set("city", v)} placeholder={t("المدينة")} /><View style={s.row}><Field value={form.budget_min} onChangeText={(v) => set("budget_min", v)} placeholder={t("الميزانية من")} keyboardType="numeric" /><Field value={form.budget_max} onChangeText={(v) => set("budget_max", v)} placeholder={t("الميزانية إلى")} keyboardType="numeric" /></View><Field value={form.description} onChangeText={(v) => set("description", v)} placeholder={t("وصف الطلب")} multiline /></> : <><Field value={form.subject} onChangeText={(v) => set("subject", v)} placeholder={t("موضوع التذكرة")} /><Field value={form.message} onChangeText={(v) => set("message", v)} placeholder={t("اكتب رسالتك")} multiline /></>}<TouchableOpacity disabled={busy} onPress={submit} style={[s.button, { backgroundColor: palette.primary }]}><Text style={s.buttonText}>{busy ? t("جاري الحفظ...") : t(buy ? "نشر طلب الشراء" : "إرسال التذكرة")}</Text></TouchableOpacity>{notice ? <Text style={[s.notice, { color: palette.text }]}>{notice}</Text> : null}<Text style={[s.section, { color: palette.text }]}>{t("السجلات السابقة")}</Text></View>} renderItem={({ item }) => <View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={s.cardHeader}><Text style={[s.cardTitle, { color: palette.text }]}>{item.title || item.subject}</Text><Text style={[s.status, { color: palette.primary }]}>{item.status}</Text></View><Text style={[s.cardBody, { color: palette.muted }]}>{item.description || item.message}</Text></View>} ListEmptyComponent={!loading ? <Text style={[s.empty, { color: palette.muted }]}>{t("لا توجد بيانات بعد")}</Text> : <ActivityIndicator color={palette.primary} />} /></KeyboardAvoidingView></SafeAreaView>;
