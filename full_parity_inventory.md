=== BACKEND PUBLIC/USER ROUTES ===
205 /tmp/backend_routes_full.txt
200:@api.get("/health", include_in_schema=False)
577:@api.get("/health/ready", include_in_schema=False)
808:@api.post("/cron/daily-digest")
809:@api.get("/cron/daily-digest")
995:@api.get("/")
999:@api.get("/meta/categories")
1011:@api.get("/meta/car-brands")
1017:@api.get("/meta/car-models")
1023:@api.get("/meta/car-trims")
1029:@api.get("/meta/phone-brands")
1035:@api.get("/meta/phone-models")
1041:@api.get("/meta/phone-variants")
1047:@api.get("/auth/providers")
1060:@api.get("/meta/countries")
1110:@api.get("/meta/theme")
1121:@api.post("/auth/register")
1196:@api.post("/auth/login")
1225:@api.post("/auth/logout")
1230:@api.get("/auth/me")
1244:@api.put("/users/me")
1245:@api.put("/auth/me")
1289:@api.get("/auth/me/stats")
1301:@api.post("/auth/refresh")
1364:@api.post("/auth/forgot-password")
1393:@api.post("/auth/reset-password")
1419:@api.get("/auth/x/start")
1454:@api.post("/auth/x/callback")
1607:@api.get("/auth/snapchat/start")
1641:@api.post("/auth/snapchat/callback")
1832:@api.post("/push/register")
1848:@api.delete("/push/unregister")
1854:@api.get("/push/web/vapid-public-key")
1860:@api.post("/push/web/subscribe")
1878:@api.post("/push/web/unsubscribe")
1884:@api.get("/push/preferences")
1898:@api.put("/push/preferences")
1910:@api.post("/push/test")
2004:@api.get("/auth/google/start")
2114:@api.post("/auth/google")
2222:@api.post("/auth/apple/native")
2281:@api.get("/auth/apple/start")
2437:@api.post("/ai/price-suggest")
2459:@api.get("/ai/price-badge/{listing_id}")
2501:@api.get("/deals/today")
2553:@api.get("/referral/me")
2570:@api.get("/referral/leaderboard")
2590:@api.get("/cloudinary/signature")
2619:@api.post("/listings")
2875:@api.post("/listings/{listing_id}/offers")
2905:@api.get("/listings/{listing_id}/offers")
2912:@api.get("/offers/mine")
2928:@api.patch("/listing-offers/{offer_id}")
2958:@api.get("/listings")
3215:@api.get("/search")
3268:@api.get("/listings/recommended")
3305:@api.post("/listings/{listing_id}/click")
3316:@api.post("/listings/{listing_id}/view")
3339:@api.get("/listings/recent")
3367:@api.post("/search/save")
3391:@api.get("/search/saved")
3397:@api.delete("/search/saved/{sid}")
3406:@api.post("/follow/category/{name}")
3415:@api.delete("/follow/category/{name}")
3420:@api.get("/following")
3437:@api.get("/users/me/notifications/settings")
3449:@api.put("/users/me/notifications/settings")
3463:@api.post("/listings/{listing_id}/boost")
3478:@api.delete("/listings/{listing_id}/boost")
3519:@api.get("/listings/trending")
3543:@api.get("/listings/by-slug/{slug}")
3565:@api.get("/listings/{listing_id}")
3587:@api.get("/listings/{listing_id}/like/check")
3591:@api.post("/listings/{listing_id}/like")
3604:@api.get("/listings/{listing_id}/comments")
3622:@api.post("/listings/{listing_id}/comments")
3635:@api.delete("/listing-comments/{comment_id}")
3645:@api.get("/listings/{listing_id}/similar")
3744:@api.delete("/listings/{listing_id}")
3928:@api.get("/listings/me/mine")
3940:@api.get("/auctions/active")
3957:@api.get("/auctions/{listing_id}/bids")
4037:@api.post("/auctions/{listing_id}/bid")
4144:@api.get("/listings/map/nearby")
4162:@api.post("/favorites/{listing_id}")
4178:@api.delete("/favorites/{listing_id}")
4187:@api.get("/favorites/{listing_id}/check")
4192:@api.get("/favorites")
4205:@api.post("/price-alerts/{listing_id}")
4230:@api.get("/price-alerts")
4235:@api.delete("/price-alerts/{listing_id}")
4244:@api.post("/blocks/{target_id}")
4255:@api.delete("/blocks/{target_id}")
4260:@api.get("/blocks/{target_id}/status")
4377:@api.get("/chat/presence/{user_id}")
4386:@api.post("/chat/send")
4477:@api.get("/chat/conversations")
4495:@api.get("/chat/messages/{convo_id}")
4520:@api.delete("/chat/messages/{message_id}")
4551:@api.post("/chat/messages/{message_id}/react")
4599:@api.post("/reports")
4623:@api.post("/contact")
4640:@api.post("/auth/request-account-deletion")
4652:@api.get("/ads")
4666:@api.post("/ads/{aid}/impression")
4671:@api.post("/ads/{aid}/click")
4692:@api.post("/ai/image-search")
4747:@api.post("/listings/suggest-price")
4828:@api.post("/ai/listing-autofill")
4931:@api.post("/ai/suggest-category")
4973:@api.post("/ai/translate")
5034:@api.put("/listings/{listing_id}")
5146:@api.post("/listings/{listing_id}/pause")
5169:@api.post("/listings/{listing_id}/resume")
5191:@api.post("/listings/{listing_id}/republish")
5222:@api.post("/listings/{listing_id}/mark-sold")
5248:@api.post("/chat/location-share")
5283:@api.get("/chat/location-share/{share_id}")
5300:@api.post("/chat/location-share/{share_id}/stop")
5323:@api.post("/analytics/events")
5354:@admin_router.get("/analytics/overview")
5410:@admin_router.get("/stats")
5465:@admin_router.get("/listings/pending")
5470:@admin_router.get("/listings")
5512:@admin_router.post("/listings/{lid}/approve")
5541:@admin_router.post("/listings/{lid}/reject")
5569:@admin_router.get("/users")
5588:@admin_router.get("/users/{uid}")
5614:@admin_router.post("/users/{uid}/ban")
5621:@admin_router.post("/users/{uid}/unban")
5628:@admin_router.post("/users/{uid}/verify")
5635:@admin_router.get("/reports")
5639:@admin_router.post("/reports/{rid}/close")
5646:@admin_router.delete("/listings/{lid}")
5661:@admin_router.get("/media-cleanup/log")
5668:@admin_router.post("/media-cleanup/scan")
5697:@admin_router.post("/media-cleanup/delete")
5729:@admin_router.get("/data-integrity")
5759:@admin_router.post("/data-integrity/fix")
5785:@admin_router.post("/theme")
5795:@admin_router.get("/ads")
5825:@admin_router.get("/logs")
5832:@admin_router.get("/banned-words")
5842:@admin_router.post("/banned-words")
5860:@admin_router.delete("/banned-words/{word}")
5870:@admin_router.post("/ads")
5880:@admin_router.delete("/ads/{aid}")
5885:@admin_router.put("/ads/{aid}")
5912:@admin_router.get("/finance/summary")
5927:@admin_router.get("/seo")
5950:@admin_router.post("/seo")
5957:@admin_router.post("/notifications/broadcast")
6009:@admin_router.post("/notifications/test")
6042:@admin_router.get("/notifications/ai-suggest")
6081:@api.get("/notifications")
6094:@api.post("/notifications/{nid}/read")
6099:@api.post("/notifications/read-all")
6105:@api.get("/notifications/unread-count")
6128:@api.post("/users/me/draft-listing")
6150:@api.delete("/users/me/draft-listing")
6165:@api.post("/users/me/search-event")
6202:@admin_router.post("/notifications/schedule")
6228:@admin_router.get("/geo/overrides")
6241:@admin_router.post("/geo/cities/add")
6262:@admin_router.post("/geo/cities/remove")
6281:@admin_router.post("/geo/districts/update")
6300:@admin_router.get("/notifications/schedule")
6307:@admin_router.delete("/notifications/schedule/{sid}")
6633:@api.get("/auth/verify-email")
6650:@api.post("/auth/resend-verification")
6673:@api.post("/watches")
6697:@api.delete("/watches/{listing_id}")
6702:@api.get("/watches")
6715:@api.post("/sellers/{seller_id}/follow")
6734:@api.get("/sellers/{seller_id}/follow-status")
6743:@api.get("/sellers/{seller_id}")
6769:@api.get("/sellers/{seller_id}/trust")
6804:@api.get("/sellers/{seller_id}/listings")
6817:@api.get("/sellers/{seller_id}/ratings")
6839:@api.post("/sellers/{seller_id}/ratings")
6874:@api.post("/search/log")
6904:@api.get("/search/trending")
6912:@api.get("/search/suggest")
6921:@api.get("/search/history")
6937:@api.delete("/search/history")
6966:@api.post("/admin/digest/test")
6972:@api.delete("/admin/demo-listings")
7082:@api.get("/sitemap.xml", include_in_schema=False)
7116:@api.get("/seo/indexnow/key", include_in_schema=False)
7124:@api.post("/seo/indexnow/resubmit-all", include_in_schema=False)
7143:@api.get("/robots.txt", include_in_schema=False)
7164:@api.get("/seo/listing/{listing_id}", include_in_schema=False)
7266:@api.get("/wallet/me")
7275:@api.get("/wallet/transactions")
7284:@api.post("/wallet/topup")
7307:@api.post("/wallet/claim-welcome-bonus")
7377:@api.get("/static-pages/{slug}")
7385:@api.post("/wallet/spend")
7439:@api.post("/ai/assistant")
7491:@api.get("/ai/assistant/history")
7506:@api.post("/ai/transcribe")
7567:@api.get("/geo/detect-country")
7621:@api.get("/geo/reverse")
7691:@api.get("/geo/search")
7810:@api.get("/geo/districts")
7944:@api.get("/geo/cities")
=== WEB ROUTES ===
86:            <Route path="/login" element={<LoginPage />} />
87:            <Route path="/register" element={<RegisterPage />} />
88:            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
89:            <Route path="/reset-password" element={<ResetPasswordPage />} />
90:            <Route path="/verify-email" element={<VerifyEmailPage />} />
91:            <Route path="/download" element={<DownloadPage />} />
92:            <Route path="/auth/callback" element={<AuthCallback />} />
93:            <Route path="/auth/google/callback" element={<AuthCallback />} />
94:            <Route path="/auth/x/callback" element={<XAuthCallback />} />
95:            <Route path="/auth/snapchat/callback" element={<SnapAuthCallback />} />
96:            <Route path="/" element={<Layout><HomePage /></Layout>} />
97:            <Route path="/category/:categoryKey" element={<Layout><CategoryPage /></Layout>} />
98:            <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />
99:            <Route path="/post" element={<Layout><PostListing /></Layout>} />
100:            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
101:            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
102:            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
103:            <Route path="/map" element={<Layout><MapPage /></Layout>} />
104:            <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
105:            <Route path="/reels" element={<Layout><ReelsPage /></Layout>} />
106:            <Route path="/auctions" element={<Layout><AuctionsPage /></Layout>} />
107:            <Route path="/flights" element={<Layout><FlightsPage /></Layout>} />
108:            <Route path="/deals" element={<Layout><DealsPage /></Layout>} />
109:            <Route path="/wallet" element={<Layout><WalletPage /></Layout>} />
110:            <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
111:            <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
112:            <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
113:            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
114:            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
=== MOBILE NAV/SCREENS ===
mobile/src/screens/ChatScreen.js:161:  // ChatScreen is mounted as <Tab.Screen name="ChatTab">). Setting
=== FEATURE MARKERS WEB ===
frontend/src/pages/AdminPage.js:31:        { key: "notifications", label: tr("الإشعارات"), icon: Bell },
frontend/src/pages/AdminPage.js:63:            {tab === "notifications" && <NotificationsPanel />}
frontend/src/pages/AdminPage.js:77:        api.get("/admin/analytics/overview", { params: { days } })
frontend/src/pages/AdminPage.js:85:        ["page_view", "مشاهدات الصفحات"],
frontend/src/pages/AdminPage.js:87:        ["listing_view", "مشاهدات الإعلانات"],
frontend/src/pages/AdminPage.js:88:        ["contact_seller", "تواصل مع البائع"],
frontend/src/pages/AdminPage.js:106:                <FinanceCard label={tr("الأحداث")} value={report.events_total} />
frontend/src/pages/AdminPage.js:107:                <FinanceCard label={tr("الزوار الفريدون")} value={report.unique_visitors} />
frontend/src/pages/AdminPage.js:108:                <FinanceCard label={tr("الجلسات")} value={report.unique_sessions} />
frontend/src/pages/AdminPage.js:109:                <FinanceCard label={tr("الإعلانات المنشورة")} value={funnel.listing_published || 0} />
frontend/src/pages/AdminPage.js:116:                        <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, ((funnel[key] || 0) / Math.max(1, funnel.page_view || 1)) * 100)}%` }} /></div>
frontend/src/pages/AdminPage.js:137:                <div className="space-y-2">{(report.top_listings || []).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-arabic-body">{row.title || row.id}</span><span className="font-latin font-bold shrink-0">{row.views} {tr("مشاهدة")}</span></div>)}</div>
frontend/src/pages/AdminPage.js:154:                        <FinanceCard label={tr("إجمالي العمولات")} value={finance.total_commission || 0} suffix="ر.س" />
frontend/src/pages/AdminPage.js:155:                        <FinanceCard label={tr("معاملات هذا الشهر")} value={finance.this_month_count || 0} />
frontend/src/pages/AdminPage.js:156:                        <FinanceCard label={tr("محافظ المستخدمين")} value={finance.total_wallets || 0} suffix="ر.س" />
frontend/src/pages/AdminPage.js:157:                        <FinanceCard label={tr("سحوبات معلقة")} value={finance.pending_withdrawals || 0} />
frontend/src/pages/AdminPage.js:172:function FinanceCard({ label, value, suffix }) {
frontend/src/pages/AdminPage.js:243:        { label: "إجمالي المشاهدات", value: stats.total_views || 0 },
frontend/src/pages/AdminPage.js:248:    const maxV = Math.max(1, ...daily.map((d) => d.views || 0));
frontend/src/pages/AdminPage.js:267:                                    <div className="bg-[var(--accent)] rounded-t opacity-70" style={{ height: `${(d.views / maxV) * 40}%` }} title={`${d.views} مشاهدة`}></div>
frontend/src/pages/AdminPage.js:317:        bank_request: tr("طلب تحويل بنكي / IBAN"),
frontend/src/pages/AdminPage.js:719:                                                <div className="text-[10px] text-[var(--text-muted)] font-latin">{l.price} {l.currency} • {l.status} • {l.moderation}</div>
frontend/src/pages/AdminPage.js:790:function NotificationsPanel() {
frontend/src/pages/AdminPage.js:802:            const { data } = await api.get("/admin/notifications/schedule");
frontend/src/pages/AdminPage.js:817:            await api.post("/admin/notifications/schedule", {
frontend/src/pages/AdminPage.js:833:            await api.delete(`/admin/notifications/schedule/${sid}`);
frontend/src/pages/AdminPage.js:843:            const { data } = await api.post("/admin/notifications/broadcast", form);
frontend/src/pages/AdminPage.js:854:            const { data } = await api.get("/admin/notifications/ai-suggest");
frontend/src/pages/AdminPage.js:866:            const { data } = await api.post("/admin/notifications/test");
frontend/src/pages/AdminPage.js:867:            alert(`${tr("✅ تم إرسال الإشعار التجريبي إلى حسابك")}\n\nExpo: ${data?.push?.expo ?? 0}  •  Web: ${data?.push?.web ?? 0}`);
frontend/src/pages/AdminPage.js:897:                            <input data-testid="notif-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={300} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)] font-latin" placeholder="/listing/abc123  •  /auctions  •  https://..." />
frontend/src/pages/AdminPage.js:927:                                <input data-testid="notif-category" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] outline-none focus:border-[var(--primary)] text-[var(--text)]" placeholder="cars / electronics ..." />
frontend/src/pages/AuctionsPage.js:8:import { useAuctionLive } from "@/hooks/useAuctionLive";
frontend/src/pages/AuctionsPage.js:10:export default function AuctionsPage() {
frontend/src/pages/AuctionsPage.js:25:        api.get("/auctions/active", { params })
frontend/src/pages/AuctionsPage.js:30:    // Auto-open bid dialog if requested via query param + the listing is in
frontend/src/pages/AuctionsPage.js:31:    // the active list. Falls back silently if the auction has ended.
frontend/src/pages/AuctionsPage.js:68:                <Link to="/post" data-testid="auction-create-btn" className="bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] rounded-full px-4 py-1.5 text-xs font-bold font-arabic">
frontend/src/pages/AuctionsPage.js:85:                    {items.map((l) => <AuctionCard key={l.id} listing={l} onBid={() => setActive(l)} />)}
frontend/src/pages/AuctionsPage.js:94:function AuctionCard({ listing, onBid }) {
frontend/src/pages/AuctionsPage.js:96:    const startPrice = listing.price || 0;
frontend/src/pages/AuctionsPage.js:97:    const currentPrice = top?.amount || startPrice;
frontend/src/pages/AuctionsPage.js:99:        <div data-testid={`auction-card-${listing.id}`} className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-lg transition-all flex flex-col">
frontend/src/pages/AuctionsPage.js:119:                        <div className="font-latin font-black text-lg text-[var(--accent)] truncate">{Number(currentPrice).toLocaleString()} <span className="text-[10px] text-[var(--text-muted)]">{listing.currency || "ر.س"}</span></div>
frontend/src/pages/AuctionsPage.js:138:    // pushed directly from the server via WebSocket. Falls back to REST bids
frontend/src/pages/AuctionsPage.js:140:    const live = useAuctionLive(listing.id);
frontend/src/pages/AuctionsPage.js:143:    // Owner-defined min increment (saved as `custom_fields.bid_increment` in the post form).
frontend/src/pages/AuctionsPage.js:147:        || listing.auction_meta?.min_increment
frontend/src/pages/AuctionsPage.js:148:        || listing.auction_meta?.bid_increment
frontend/src/pages/AuctionsPage.js:153:    const currentAmount = top?.amount || listing.price || 0;
frontend/src/pages/AuctionsPage.js:164:        api.get(`/auctions/${listing.id}/bids`).then(({ data }) => setBids(data || []));
frontend/src/pages/AuctionsPage.js:170:        api.get(`/auctions/${listing.id}/bids`).then(({ data }) => setBids(data || [])).catch(() => { });
frontend/src/pages/AuctionsPage.js:188:            await api.post(`/auctions/${listing.id}/bid`, { amount: val });
frontend/src/pages/AuctionsPage.js:212:                            <div className="font-latin font-black text-2xl text-[var(--accent)]">{Number(top?.amount || listing.price || 0).toLocaleString()} <span className="text-xs">{listing.currency || "ر.س"}</span></div>
frontend/src/pages/Auth.js:9:// left of every Auth card so visitors can pick their language before signing in.
frontend/src/pages/Auth.js:109:                <svg className="w-5 h-5" viewBox="0 0 24 24">
frontend/src/pages/Auth.js:124:                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
frontend/src/pages/Auth.js:137:                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.55 8.625L23 22h-6.844l-5.36-7.005L4.62 22H1.36l8.07-9.225L1 2h7l4.846 6.405L18.244 2zm-1.197 18h1.86L7.04 4H5.07l11.977 16z"/></svg>
frontend/src/pages/Auth.js:147:                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166.34c2.853-.04 5.49 1.92 6.34 4.6.31 1.05.21 2.18.21 3.27 0 .85-.21 1.7-.07 2.55.31 0 .61-.07.92-.13.21-.04.42-.07.62-.04.42.07.85.21.92.71.07.55-.42.85-.85.99-.42.21-.92.28-1.34.42-.42.21-.71.55-.85.99-.07.21-.07.42 0 .62.42 1.27 1.34 2.4 2.55 3.06.42.21.92.42 1.41.42.21 0 .42-.07.62.07.21.21.21.55 0 .78-.34.42-.85.71-1.34.99-.71.34-1.55.42-2.33.42-.42 0-.85.13-1.2.42-.42.34-.62.85-.92 1.27-.34.42-.78.55-1.27.55-.42 0-.85-.13-1.27-.21-.42-.07-.85-.07-1.27 0-.55.07-1.06.34-1.55.42-.21.07-.42.07-.62 0-.42-.13-.71-.42-.92-.78-.34-.42-.62-.85-1.06-1.13-.42-.28-.99-.34-1.48-.42-.71-.07-1.41-.13-2.05-.42-.55-.21-.99-.55-1.34-.99-.21-.21-.21-.55-.07-.78.21-.21.42-.13.62-.13.42 0 .85-.13 1.27-.34 1.27-.62 2.26-1.84 2.69-3.21.07-.21 0-.42-.07-.62-.21-.42-.55-.78-.99-.92-.42-.13-.85-.21-1.27-.42-.42-.13-.92-.42-.85-.99 0-.42.42-.62.85-.71.21-.07.42 0 .62.04.34.07.62.13.92.13.13-.85-.07-1.7-.07-2.55 0-1.06-.07-2.18.21-3.21C6.747 2.18 9.319.3 12.166.34z"/></svg>
frontend/src/pages/CategoryPage.js:4:import ListingCard from "@/components/listings/ListingCard";
frontend/src/pages/CategoryPage.js:24:        min_price: searchParams.get("min") || "",
frontend/src/pages/CategoryPage.js:25:        max_price: searchParams.get("max") || "",
frontend/src/pages/CategoryPage.js:60:                if (filters.min_price) params.min_price = filters.min_price;
frontend/src/pages/CategoryPage.js:61:                if (filters.max_price) params.max_price = filters.max_price;
frontend/src/pages/CategoryPage.js:81:            const shortKey = key === "subcategory" ? "sub" : key === "min_price" ? "min" : key === "max_price" ? "max" : key;
frontend/src/pages/CategoryPage.js:115:                    <input data-testid="filter-min-price" type="number" placeholder={tr("السعر من")} value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:116:                    <input data-testid="filter-max-price" type="number" placeholder={tr("السعر إلى")} value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)]" />
frontend/src/pages/CategoryPage.js:121:                        <option value="price_asc">{tr("السعر: من الأقل")}</option>
frontend/src/pages/CategoryPage.js:122:                        <option value="price_desc">{tr("السعر: من الأعلى")}</option>
frontend/src/pages/CategoryPage.js:147:                        <ListingCard key={l.id} listing={l} compact />
frontend/src/pages/ChatPage.js:10:import ImageViewer from "@/components/ImageViewer";
frontend/src/pages/ChatPage.js:12:import { playNotificationSound } from "@/lib/notificationSound";
frontend/src/pages/ChatPage.js:77:    const liveShare = m.location?.live_share_id;
frontend/src/pages/ChatPage.js:152:            {m.location && !liveShare && (
frontend/src/pages/ChatPage.js:157:            {liveShare && (
frontend/src/pages/ChatPage.js:237:    const [imgPreview, setImgPreview] = useState(null);
frontend/src/pages/ChatPage.js:243:    // Listing context card — fetched once when the chat opens with ?listing=<id>.
frontend/src/pages/ChatPage.js:244:    // Acts as a persistent reference at the top of the thread so buyer + seller
frontend/src/pages/ChatPage.js:245:    // both know which ad they're discussing (sellers often have many ads).
frontend/src/pages/ChatPage.js:253:    // inside its messages and pin that listing as the sticky context card —
frontend/src/pages/ChatPage.js:266:    // ----------- Auto-send "listing card" first message -----------
frontend/src/pages/ChatPage.js:267:    // When the user opens the chat from a listing detail page (?to=<seller>&listing=<id>)
frontend/src/pages/ChatPage.js:269:    // send a templated intro message so both buyer and seller have a clear
frontend/src/pages/ChatPage.js:318:                requestAnimationFrame(() => {
frontend/src/pages/ChatPage.js:340:    // Reads window.visualViewport.height (shrinks when the on-screen keyboard
frontend/src/pages/ChatPage.js:347:            const h = window.visualViewport?.height || window.innerHeight;
frontend/src/pages/ChatPage.js:351:        const vv = window.visualViewport;
frontend/src/pages/ChatPage.js:355:            // visualViewport scroll updates --hp-vh continuously as the user
frontend/src/pages/ChatPage.js:370:    // ----------- Notification ping + vibration -----------
frontend/src/pages/ChatPage.js:371:    // Signature Harajplus sound — see /lib/notificationSound.js
frontend/src/pages/ChatPage.js:372:    const playPing = () => { playNotificationSound(); };
frontend/src/pages/ChatPage.js:406:            requestAnimationFrame(() => {
frontend/src/pages/ChatPage.js:446:        offs.push(subscribe("message", (ev) => {
frontend/src/pages/ChatPage.js:465:                    // Immediately mark conversation as read since we're viewing it
frontend/src/pages/ChatPage.js:484:        offs.push(subscribe("typing", (ev) => {
frontend/src/pages/ChatPage.js:488:        offs.push(subscribe("presence", (ev) => {
frontend/src/pages/ChatPage.js:492:        offs.push(subscribe("delivered", (ev) => {
frontend/src/pages/ChatPage.js:496:        offs.push(subscribe("read", (ev) => {
frontend/src/pages/ChatPage.js:503:        offs.push(subscribe("reaction", (ev) => {
frontend/src/pages/ChatPage.js:508:        offs.push(subscribe("message_deleted", (ev) => {
frontend/src/pages/ChatPage.js:605:            mr.ondataavailable = (e) => chunks.push(e.data);
frontend/src/pages/ChatPage.js:636:                out.push({ kind: "date", id: `d_${dlabel}_${m.id}`, label: dlabel });
frontend/src/pages/ChatPage.js:641:            out.push({ kind: "msg", id: m.id, m, firstOfRun });
frontend/src/pages/ChatPage.js:715:                            {/* Listing context card — shown when chat was opened from a listing */}
frontend/src/pages/ChatPage.js:717:                                <Link to={`/listing/${listingCtx.slug || listingCtx.id}`} className="hp-chat-listing-card" data-testid="chat-listing-context" onClick={(e) => e.stopPropagation()}>
frontend/src/pages/ChatPage.js:721:                                    <div className="hp-chat-listing-card-body">
frontend/src/pages/ChatPage.js:722:                                        <div className="hp-chat-listing-card-label">{tr("بخصوص الإعلان")}</div>
frontend/src/pages/ChatPage.js:723:                                        <div className="hp-chat-listing-card-title">{listingCtx.title}</div>
frontend/src/pages/ChatPage.js:724:                                        {listingCtx.price != null && (
frontend/src/pages/ChatPage.js:725:                                            <div className="hp-chat-listing-card-price">
frontend/src/pages/ChatPage.js:726:                                                {Number(listingCtx.price).toLocaleString()} {listingCtx.currency_code || listingCtx.currency || ""}
frontend/src/pages/ChatPage.js:730:                                    <ChevronRight className="w-4 h-4 hp-chat-listing-card-arrow" />
frontend/src/pages/ChatPage.js:741:                                        onReply={setReplyTo} onImageClick={setImgPreview}
frontend/src/pages/ChatPage.js:769:                            {/* Reply preview */}
frontend/src/pages/ChatPage.js:813:            {imgPreview && <ImageViewer images={[imgPreview]} initialIndex={0} onClose={() => setImgPreview(null)} />}
frontend/src/pages/DealsPage.js:56:                    {deals.map((d) => <DealCard key={d.id} deal={d} />)}
frontend/src/pages/DealsPage.js:63:function DealCard({ deal }) {
frontend/src/pages/DealsPage.js:65:        <Link to={`/listing/${deal.id}`} data-testid={`deal-card-${deal.id}`} className="group bg-[var(--surface)] rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all flex flex-col relative">
frontend/src/pages/DealsPage.js:83:                        <span className="font-latin font-black text-base text-emerald-600">{Number(deal.price).toLocaleString()}</span>
frontend/src/pages/DownloadPage.js:92:                        <StoreCard key={s.key} store={s} />
frontend/src/pages/DownloadPage.js:106:function StoreCard({ store }) {
frontend/src/pages/DownloadPage.js:112:            data-testid={`store-card-${store.key}`}
frontend/src/pages/HomePage.js:8:import ListingCard from "@/components/listings/ListingCard";
frontend/src/pages/HomePage.js:45:                // Misconfigured/offline backends can return an HTML fallback or an error object.
frontend/src/pages/HomePage.js:70:                // "API returned []" from "request failed entirely".
frontend/src/pages/HomePage.js:78:    // Infinite scroll — fetches the next 20 when the sentinel scrolls into view
frontend/src/pages/HomePage.js:124:        { to: "/auctions", icon: "🔨", label: tr("مزادات"), color: "from-amber-100 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10" },
frontend/src/pages/HomePage.js:125:        { to: "/reels", icon: "🎬", label: tr("قصص فيديو"), color: "from-pink-100 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/10" },
frontend/src/pages/HomePage.js:230:                            <WideListingCard listing={l} />
frontend/src/pages/HomePage.js:239:                            <ListingCard listing={l} compact />
frontend/src/pages/HomePage.js:283:function WideListingCard({ listing }) {
frontend/src/pages/HomePage.js:298:                        {listing.price ? (
frontend/src/pages/HomePage.js:299:                            <span className="font-latin font-black text-lg sm:text-xl text-[var(--primary)]">{Number(listing.price).toLocaleString()} <span className="text-xs">{listing.currency}</span></span>
frontend/src/pages/ListingDetail.js:5:import { Heart, Phone, MessageCircle, MapPin, Eye, Calendar, Share2, Flag, ChevronLeft, Star, ChevronRight, Sparkles, TrendingUp, ShieldAlert, Maximize2, RotateCw, Edit3, RefreshCw, CheckCircle2, Trash2, Bell, Tag } from "lucide-react";
frontend/src/pages/ListingDetail.js:12:import ListingCard from "@/components/listings/ListingCard";
frontend/src/pages/ListingDetail.js:14:import ImageViewer from "@/components/ImageViewer";
frontend/src/pages/ListingDetail.js:15:import Viewer360 from "@/components/Viewer360";
frontend/src/pages/ListingDetail.js:17:import Spin360Viewer from "@/components/Spin360Viewer";
frontend/src/pages/ListingDetail.js:18:import PriceBadge from "@/components/PriceBadge";
frontend/src/pages/ListingDetail.js:30:function buildHologramIcon({ price, currency }) {
frontend/src/pages/ListingDetail.js:31:    const display = price ? Number(price).toLocaleString() : "★";
frontend/src/pages/ListingDetail.js:32:    const sub = price ? (currency || "ر.س") : "إعلان";
frontend/src/pages/ListingDetail.js:38:        html: `<div class="hologram-pin"><div class="hp-ring hp-ring-1"></div><div class="hp-ring hp-ring-2"></div><div class="hp-chip"><div class="hp-price">${display}</div><div class="hp-curr">${sub}</div></div><div class="hp-stem"></div><div class="hp-base"></div></div>`,
frontend/src/pages/ListingDetail.js:50:    const [showViewer, setShowViewer] = useState(false);
frontend/src/pages/ListingDetail.js:54:    const [following, setFollowing] = useState(false);
frontend/src/pages/ListingDetail.js:56:    const [showOffer, setShowOffer] = useState(false);
frontend/src/pages/ListingDetail.js:57:    const [offerAmount, setOfferAmount] = useState("");
frontend/src/pages/ListingDetail.js:58:    const [offerMessage, setOfferMessage] = useState("");
frontend/src/pages/ListingDetail.js:59:    const [offerSaving, setOfferSaving] = useState(false);
frontend/src/pages/ListingDetail.js:60:    const [sellerTrust, setSellerTrust] = useState(null);
frontend/src/pages/ListingDetail.js:61:    const [liked, setLiked] = useState(false);
frontend/src/pages/ListingDetail.js:62:    const [likeCount, setLikeCount] = useState(0);
frontend/src/pages/ListingDetail.js:63:    const [comments, setComments] = useState([]);
frontend/src/pages/ListingDetail.js:64:    const [commentText, setCommentText] = useState("");
frontend/src/pages/ListingDetail.js:65:    const [commentBusy, setCommentBusy] = useState(false);
frontend/src/pages/ListingDetail.js:76:                trackEvent("listing_view", { listing_id: l.data.id, category: l.data.category, country_code: l.data.country_code });
frontend/src/pages/ListingDetail.js:79:                setLikeCount(Number(l.data.like_count || 0));
frontend/src/pages/ListingDetail.js:80:                api.get(`/listings/${l.data.id}/comments`).then(({ data }) => setComments(data?.items || [])).catch(() => {});
frontend/src/pages/ListingDetail.js:81:                api.get(`/sellers/${l.data.user_id}/trust`).then(({ data }) => setSellerTrust(data)).catch(() => {});
frontend/src/pages/ListingDetail.js:82:                if (user) api.get(`/listings/${l.data.id}/like/check`).then(({ data }) => setLiked(!!data.liked)).catch(() => {});
frontend/src/pages/ListingDetail.js:84:                    api.get(`/sellers/${l.data.user_id}/follow-status`).then(({ data }) => setFollowing(!!data.following)).catch(() => {});
frontend/src/pages/ListingDetail.js:92:    const toggleFollow = async () => {
frontend/src/pages/ListingDetail.js:95:            const { data } = await api.post(`/sellers/${listing.user_id}/follow`);
frontend/src/pages/ListingDetail.js:96:            setFollowing(!!data.following);
frontend/src/pages/ListingDetail.js:106:                await api.post(`/watches`, { listing_id: listing.id, target_price: listing.price });
frontend/src/pages/ListingDetail.js:126:    const toggleLike = async () => {
frontend/src/pages/ListingDetail.js:128:        const previous = liked;
frontend/src/pages/ListingDetail.js:129:        setLiked(!previous);
frontend/src/pages/ListingDetail.js:130:        setLikeCount((count) => Math.max(0, count + (previous ? -1 : 1)));
frontend/src/pages/ListingDetail.js:132:            const { data } = await api.post(`/listings/${listing.id}/like`);
frontend/src/pages/ListingDetail.js:133:            setLiked(!!data.liked);
frontend/src/pages/ListingDetail.js:134:            setLikeCount(Number(data.like_count || 0));
frontend/src/pages/ListingDetail.js:136:            setLiked(previous);
frontend/src/pages/ListingDetail.js:137:            setLikeCount((count) => Math.max(0, count + (previous ? 1 : -1)));
frontend/src/pages/ListingDetail.js:141:    const submitComment = async (e) => {
frontend/src/pages/ListingDetail.js:144:        const text = commentText.trim();
frontend/src/pages/ListingDetail.js:146:        setCommentBusy(true);
frontend/src/pages/ListingDetail.js:148:            const { data } = await api.post(`/listings/${listing.id}/comments`, { text });
frontend/src/pages/ListingDetail.js:149:            setComments((items) => [data, ...items]);
frontend/src/pages/ListingDetail.js:150:            setCommentText("");
frontend/src/pages/ListingDetail.js:152:        finally { setCommentBusy(false); }
frontend/src/pages/ListingDetail.js:155:    const submitOffer = async (e) => {
frontend/src/pages/ListingDetail.js:158:        const amount = Number(offerAmount);
frontend/src/pages/ListingDetail.js:160:        setOfferSaving(true);
frontend/src/pages/ListingDetail.js:162:            await api.post(`/listings/${listing.id}/offers`, { amount, message: offerMessage });
frontend/src/pages/ListingDetail.js:163:            setShowOffer(false);
frontend/src/pages/ListingDetail.js:164:            setOfferAmount("");
frontend/src/pages/ListingDetail.js:165:            setOfferMessage("");
frontend/src/pages/ListingDetail.js:169:        } finally { setOfferSaving(false); }
frontend/src/pages/ListingDetail.js:262:                        <div className="relative aspect-[16/10] bg-[var(--surface-elevated)] cursor-zoom-in" onClick={() => listing.images?.length && setShowViewer(true)}>
frontend/src/pages/ListingDetail.js:272:                                <button data-testid="open-viewer-btn" onClick={(e) => { e.stopPropagation(); setShowViewer(true); }} className="absolute top-3 end-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1 backdrop-blur hover:bg-black/80">
frontend/src/pages/ListingDetail.js:276:                            {/* Show 360 button when EITHER the seller flagged
frontend/src/pages/ListingDetail.js:296:                    {/* Title + price */}
frontend/src/pages/ListingDetail.js:302:                            <button data-testid="like-btn" onClick={toggleLike} className={`px-3 h-10 rounded-full flex items-center justify-center gap-1.5 font-arabic-body text-sm font-bold transition-colors ${liked ? "bg-red-500/10 text-red-600" : "bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-red-600"}`} title={tr("إعجاب بالإعلان")}><Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> <span>{likeCount}</span></button>
frontend/src/pages/ListingDetail.js:303:                            <button data-testid="share-btn" onClick={async () => {
frontend/src/pages/ListingDetail.js:305:                                const shareData = { title: listing.title, text: `${listing.title} - الحراج بلس`, url };
frontend/src/pages/ListingDetail.js:307:                                    if (navigator.share) {
frontend/src/pages/ListingDetail.js:308:                                        await navigator.share(shareData);
frontend/src/pages/ListingDetail.js:314:                            }} className="px-3 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] font-arabic-body text-sm font-bold whitespace-nowrap" title={tr("مشاركة الإعلان")}><Share2 className="w-4 h-4" /><span>{tr("مشاركة الإعلان")}</span></button>
frontend/src/pages/ListingDetail.js:318:                            {listing.price ? (
frontend/src/pages/ListingDetail.js:320:                                    <span className="font-latin font-black text-3xl sm:text-4xl text-[var(--secondary)] dark:text-[var(--primary)]">{Number(listing.price).toLocaleString()}</span>
frontend/src/pages/ListingDetail.js:327:                        {listing.price && <div className="mb-3"><PriceBadge listingId={listing.id} variant="full" /></div>}
frontend/src/pages/ListingDetail.js:331:                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views || 0} مشاهدة</span>
frontend/src/pages/ListingDetail.js:341:                    {/* Public comments */}
frontend/src/pages/ListingDetail.js:343:                        <div className="flex items-center justify-between mb-4"><h2 className="font-arabic font-bold text-lg text-[var(--text)]">{tr("التعليقات")}</h2><span className="text-xs text-[var(--text-muted)] font-latin">{comments.length}</span></div>
frontend/src/pages/ListingDetail.js:345:                            <form onSubmit={submitComment} className="flex gap-2 mb-4">
frontend/src/pages/ListingDetail.js:346:                                <input data-testid="listing-comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={1000} placeholder={tr("اكتب تعليقًا عامًا...")} className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-xl px-3 py-2.5 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/ListingDetail.js:347:                                <button data-testid="listing-comment-submit" disabled={commentBusy || !commentText.trim()} className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl px-4 py-2 font-arabic font-bold text-xs disabled:opacity-50">{commentBusy ? tr("جارٍ النشر...") : tr("نشر")}</button>
frontend/src/pages/ListingDetail.js:350:                        {comments.length === 0 ? <p className="text-sm text-[var(--text-muted)] font-arabic-body">{tr("لا توجد تعليقات بعد")}</p> : <div className="space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-2xl bg-[var(--surface-elevated)] p-3"><div className="flex items-center gap-2 mb-1"><span className="font-arabic font-bold text-xs text-[var(--text)]">{comment.author?.name || tr("مستخدم")}</span>{comment.author?.verified && <CheckCircle2 className="w-3 h-3 text-[var(--primary)]" />}<span className="text-[10px] text-[var(--text-muted)] font-latin ms-auto">{new Date(comment.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}</span></div><p className="text-sm text-[var(--text)] font-arabic-body whitespace-pre-wrap">{comment.text}</p></div>)}</div>}
frontend/src/pages/ListingDetail.js:400:                                    <Marker position={[listing.lat, listing.lng]} icon={buildHologramIcon({ price: listing.price, currency: listing.currency, category: listing.category })}>
frontend/src/pages/ListingDetail.js:416:                    {/* Seller Info & Contact (always before similar listings) */}
frontend/src/pages/ListingDetail.js:417:                    <div data-testid="seller-info-block" className="bg-[var(--surface)] rounded-3xl p-4 sm:p-6 border border-[var(--border)] lg:hidden">
frontend/src/pages/ListingDetail.js:418:                        <h2 className="font-arabic font-bold text-lg text-[var(--text)] mb-4">{t("seller_info")}</h2>
frontend/src/pages/ListingDetail.js:421:                                {listing.seller?.name?.[0] || "U"}
frontend/src/pages/ListingDetail.js:425:                                    {listing.seller?.name}
frontend/src/pages/ListingDetail.js:426:                                    {listing.seller?.verified && <Star className="w-3.5 h-3.5 fill-[var(--primary)] text-[var(--primary)]" />}
frontend/src/pages/ListingDetail.js:427:                                    {sellerTrust && <span title={tr("درجة مبنية على التوثيق والتقييمات والنشاط والبلاغات")} className={`text-[10px] rounded-full px-1.5 py-0.5 font-latin ${sellerTrust.score >= 80 ? "bg-emerald-100 text-emerald-700" : sellerTrust.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{sellerTrust.score}/100</span>}
frontend/src/pages/ListingDetail.js:430:                                    {t("joined")} {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString("ar") : ""}
frontend/src/pages/ListingDetail.js:434:                                <button data-testid="follow-seller-btn-mobile" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
frontend/src/pages/ListingDetail.js:435:                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
frontend/src/pages/ListingDetail.js:440:                            <button data-testid="watch-price-btn-mobile" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
frontend/src/pages/ListingDetail.js:445:                            {listing.show_phone !== false && (listing.contact_phone || listing.seller?.phone_full) && !listing.is_demo && (() => {
frontend/src/pages/ListingDetail.js:446:                                const ph = listing.contact_phone || listing.seller.phone_full;
frontend/src/pages/ListingDetail.js:447:                                const cc = listing.country_code || listing.seller?.country_code || "";
frontend/src/pages/ListingDetail.js:462:                                <button data-testid="make-offer-btn-mobile" onClick={() => { if (!user) return nav("/login"); setOfferAmount(listing.price ? String(listing.price) : ""); setShowOffer(true); }} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:479:                    {/* Sponsored ad — between contact info and similar listings (per user request) */}
frontend/src/pages/ListingDetail.js:482:                    {/* Similar listings — placed AFTER seller info as requested */}
frontend/src/pages/ListingDetail.js:489:                                {similar.map((s) => <ListingCard key={s.id} listing={s} compact />)}
frontend/src/pages/ListingDetail.js:495:                {/* Right/Sidebar - Seller (Desktop only) */}
frontend/src/pages/ListingDetail.js:498:                        <h3 className="font-arabic font-bold text-base text-[var(--text)] mb-4">{t("seller_info")}</h3>
frontend/src/pages/ListingDetail.js:501:                                {listing.seller?.name?.[0] || "U"}
frontend/src/pages/ListingDetail.js:505:                                    {listing.seller?.name}
frontend/src/pages/ListingDetail.js:506:                                    {listing.seller?.verified && <Star className="w-3.5 h-3.5 fill-[var(--primary)] text-[var(--primary)]" />}
frontend/src/pages/ListingDetail.js:507:                                    {sellerTrust && <span title={tr("درجة مبنية على التوثيق والتقييمات والنشاط والبلاغات")} className={`text-[10px] rounded-full px-1.5 py-0.5 font-latin ${sellerTrust.score >= 80 ? "bg-emerald-100 text-emerald-700" : sellerTrust.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{sellerTrust.score}/100</span>}
frontend/src/pages/ListingDetail.js:510:                                    {t("joined")} {listing.seller?.created_at ? new Date(listing.seller.created_at).toLocaleDateString("ar") : ""}
frontend/src/pages/ListingDetail.js:514:                                <button data-testid="follow-seller-btn-desktop" onClick={toggleFollow} className={`shrink-0 text-[10px] font-arabic font-bold px-3 py-1.5 rounded-full transition-all ${following ? "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)]" : "bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)]"}`}>
frontend/src/pages/ListingDetail.js:515:                                    {following ? tr("متابَع ✓") : tr("+ متابعة")}
frontend/src/pages/ListingDetail.js:521:                            <button data-testid="watch-price-btn-desktop" onClick={toggleWatch} className={`w-full mb-2.5 rounded-xl py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 font-arabic transition-all ${watching ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300/50" : "bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/10 text-[var(--text)]"}`}>
frontend/src/pages/ListingDetail.js:528:                            {listing.show_phone !== false && (listing.contact_phone || listing.seller?.phone_full) && !listing.is_demo ? (
frontend/src/pages/ListingDetail.js:531:                                        const ph = listing.contact_phone || listing.seller.phone_full;
frontend/src/pages/ListingDetail.js:532:                                        const cc = listing.country_code || listing.seller?.country_code || "";
frontend/src/pages/ListingDetail.js:554:                                <button data-testid="make-offer-btn-desktop" onClick={() => { if (!user) return nav("/login"); setOfferAmount(listing.price ? String(listing.price) : ""); setShowOffer(true); }} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--secondary)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:558:                            <button data-testid="chat-with-seller-btn" onClick={startChat} disabled={!!listing.is_demo} style={listing.is_demo ? { display: "none" } : undefined} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 font-arabic">
frontend/src/pages/ListingDetail.js:580:            {showOffer && (
frontend/src/pages/ListingDetail.js:582:                    <form onSubmit={submitOffer} className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-2xl p-5 font-arabic">
frontend/src/pages/ListingDetail.js:585:                            <button type="button" onClick={() => setShowOffer(false)} className="text-[var(--text-muted)] text-xl" aria-label={tr("إغلاق")}>×</button>
frontend/src/pages/ListingDetail.js:588:                        <input autoFocus required type="number" min="1" step="0.01" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-3" placeholder={listing.price ? String(listing.price) : "0"} />
frontend/src/pages/ListingDetail.js:590:                        <textarea rows={3} value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} className="w-full bg-[var(--surface-elevated)] rounded-xl px-3 py-3 border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] mb-4" placeholder={tr("اكتب رسالة للبائع...")} />
frontend/src/pages/ListingDetail.js:591:                        <button disabled={offerSaving} className="w-full bg-[var(--primary)] text-[var(--primary-fg)] rounded-xl py-3 font-black disabled:opacity-60">{offerSaving ? tr("جارٍ الإرسال...") : tr("إرسال العرض")}</button>
frontend/src/pages/ListingDetail.js:595:            {showViewer && <ImageViewer images={listing.images} initialIndex={activeImg} onClose={() => setShowViewer(false)} />}
frontend/src/pages/ListingDetail.js:596:            {show360 && <Viewer360 images={listing.images} onClose={() => setShow360(false)} />}
frontend/src/pages/ListingDetail.js:599:                BottomNav. Auctions show "مزايدة الآن", regular listings show
frontend/src/pages/ListingDetail.js:601:            {!isOwner && listing.seller?.id && (
frontend/src/pages/ListingDetail.js:604:                        {(listing.category === "auctions" || listing.auction_meta || listing.is_auction) ? (
frontend/src/pages/ListingDetail.js:607:                                onClick={() => nav(`/auctions?openBidFor=${listing.id}`)}
frontend/src/pages/ListingDetail.js:617:                                    nav(`/chat?to=${listing.seller.id}&listing_id=${listing.id}`);
frontend/src/pages/PostListing.js:5:import { CarCascade, PhoneCascade, FurnitureCascade, HomeAppliancesCascade } from "@/components/CategoryCascades";
frontend/src/pages/PostListing.js:6:import { JobsDetailsBox, RealEstateDetailsBox } from "@/components/JobsRealEstateBoxes";
frontend/src/pages/PostListing.js:7:import { AuctionsDetailsBox, ServicesProDetailsBox } from "@/components/AuctionsServicesBoxes";
frontend/src/pages/PostListing.js:37:        price: "",
frontend/src/pages/PostListing.js:75:                price: data.price?.toString() || "",
frontend/src/pages/PostListing.js:114:            cars: ["سيارة", "سياره", "كامري", "كرولا", "هوندا", "تويوتا", "نيسان", "بي ام", "بمب", "مرسيدس", "لكزس", "هيونداي", "كيا", "فورد", "car", "toyota", "honda", "bmw"],
frontend/src/pages/PostListing.js:120:            jobs: ["وظيفة", "موظف", "موظفة", "للعمل", "للتوظيف", "مطلوب موظف", "مطلوب عامل"],
frontend/src/pages/PostListing.js:172:            const xhr = new XMLHttpRequest();
frontend/src/pages/PostListing.js:277:                price: form.price ? parseFloat(form.price) : null,
frontend/src/pages/PostListing.js:296:    // them with a push notification after ~10 minutes. Debounced to avoid spam.
frontend/src/pages/PostListing.js:306:                price: form.price ? parseFloat(form.price) : null,
frontend/src/pages/PostListing.js:312:    }, [step, form.title, form.category, form.city, form.price, form.images]);
frontend/src/pages/PostListing.js:314:    const aiSuggestPrice = async () => {
frontend/src/pages/PostListing.js:316:            const { data } = await api.post("/ai/price-suggest", {
frontend/src/pages/PostListing.js:323:                setForm((f) => ({ ...f, price: String(Math.round((data.suggested_min + data.suggested_max) / 2)) }));
frontend/src/pages/PostListing.js:412:            const midPrice = data.suggested_price_min && data.suggested_price_max
frontend/src/pages/PostListing.js:413:                ? Math.round((data.suggested_price_min + data.suggested_price_max) / 2)
frontend/src/pages/PostListing.js:420:                price: midPrice ? String(midPrice) : f.price,
frontend/src/pages/PostListing.js:431:        // Step 1 auto-advances on card click; skip the "category required" gate here.
frontend/src/pages/PostListing.js:485:                        2) Row of 2 big cards: نشر ستوري + إنشاء مزاد
frontend/src/pages/PostListing.js:486:                        3) Row of 2 cards: وظائف + خدمات
frontend/src/pages/PostListing.js:511:                    {/* Row 1: Story + Auction */}
frontend/src/pages/PostListing.js:530:                            data-testid="entry-auction"
frontend/src/pages/PostListing.js:531:                            onClick={() => { setForm({ ...form, category: "auctions", subcategory: "", custom_fields: { is_auction: true } }); setStep(2); }}
frontend/src/pages/PostListing.js:544:                    {/* Row 2: Jobs + Services */}
frontend/src/pages/PostListing.js:546:                        <button data-testid="quick-jobs" type="button" onClick={() => { setForm({ ...form, category: "jobs", subcategory: "", custom_fields: {} }); setStep(2); }}
frontend/src/pages/PostListing.js:575:                    {form.custom_fields?.is_auction && (
frontend/src/pages/PostListing.js:597:                        User explicitly requested this before title + description so the
frontend/src/pages/PostListing.js:598:                        intent (Offer vs Request) is the first decision. */}
frontend/src/pages/PostListing.js:607:                                    data-testid="post-type-service-offer"
frontend/src/pages/PostListing.js:616:                                    data-testid="post-type-service-request"
frontend/src/pages/PostListing.js:627:                    {/* ===== Jobs-only Listing Type selector at TOP =====
frontend/src/pages/PostListing.js:628:                        Mirrors services. User explicitly requested at the very TOP
frontend/src/pages/PostListing.js:630:                    {form.category === "jobs" && (
frontend/src/pages/PostListing.js:631:                        <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 border-2 border-[var(--primary)]/30 rounded-2xl p-3" data-testid="jobs-post-type-top">
frontend/src/pages/PostListing.js:638:                                    data-testid="post-type-job-offer"
frontend/src/pages/PostListing.js:639:                                    onClick={() => setForm({ ...form, custom_fields: { ...form.custom_fields, post_type: "عرض وظيفة" }, subcategory: "job_offer" })}
frontend/src/pages/PostListing.js:647:                                    data-testid="post-type-job-seeker"
frontend/src/pages/PostListing.js:648:                                    onClick={() => setForm({ ...form, custom_fields: { ...form.custom_fields, post_type: "باحث عن عمل" }, subcategory: "job_seeker" })}
frontend/src/pages/PostListing.js:695:                    {/* Cascading brand→model→year→trim for cars only. Phones cascade lives
frontend/src/pages/PostListing.js:697:                    {form.category === "cars" && (
frontend/src/pages/PostListing.js:698:                        <CarCascade
frontend/src/pages/PostListing.js:710:                    {/* ===== PHONES Details Box (placed AFTER description, BEFORE price) =====
frontend/src/pages/PostListing.js:712:                        warranty | —). Lives inside <CarCascade/PhoneCascade> components which
frontend/src/pages/PostListing.js:753:                    {/* ===== AUCTIONS Details Box (AFTER description) =====
frontend/src/pages/PostListing.js:756:                        Generic renderer below is suppressed for `auctions` → no duplicates. */}
frontend/src/pages/PostListing.js:757:                    {form.category === "auctions" && (
frontend/src/pages/PostListing.js:758:                        <AuctionsDetailsBox form={form} setForm={setForm} tr={tr} currency={country?.currency || "ر.س"} />
frontend/src/pages/PostListing.js:763:                        خيول adds 1 row). breed cascade is bound to animal_type. Price renders
frontend/src/pages/PostListing.js:764:                        inside the box → standalone price block is suppressed for `livestock`. */}
frontend/src/pages/PostListing.js:777:                    {form.category !== "jobs" && form.category !== "services" && form.category !== "realestate" && form.category !== "auctions" && form.category !== "livestock" && form.category !== "equipment" && (
frontend/src/pages/PostListing.js:779:                            <label className="block text-sm font-arabic font-bold text-[var(--text)] mb-1.5">{t("price")}</label>
frontend/src/pages/PostListing.js:782:                                    <input data-testid="post-price" type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surface-elevated)] rounded-xl ps-4 pe-16 py-3 text-base border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-latin font-bold tracking-wider" placeholder={tr("اتركه فارغاً للسوم")} style={{ minHeight: "48px" }} />
frontend/src/pages/PostListing.js:785:                                <button type="button" data-testid="ai-price-btn" onClick={aiSuggestPrice} className="shrink-0 flex items-center gap-1 bg-gradient-to-r from-[var(--accent)] to-amber-400 text-[var(--secondary)] rounded-xl px-3 py-2.5 text-xs font-bold font-arabic" style={{ minHeight: "48px" }}>
frontend/src/pages/PostListing.js:786:                                    <Sparkle className="w-3.5 h-3.5" /> {t("ai_price_suggest")}
frontend/src/pages/PostListing.js:793:                    {/* ===== JOBS Details Box (full OLX/Haraj-level spec) =====
frontend/src/pages/PostListing.js:794:                        Strict 2-column grid. Generic renderer below is suppressed for `jobs`. */}
frontend/src/pages/PostListing.js:795:                    {form.category === "jobs" && (
frontend/src/pages/PostListing.js:796:                        <JobsDetailsBox form={form} setForm={setForm} tr={tr} />
frontend/src/pages/PostListing.js:800:                        Strict 2-column grid. Price moves INTO the box (global price hidden
frontend/src/pages/PostListing.js:801:                        for realestate). Generic renderer below is suppressed for `realestate`. */}
frontend/src/pages/PostListing.js:802:                    {form.category === "realestate" && (
frontend/src/pages/PostListing.js:803:                        <RealEstateDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
frontend/src/pages/PostListing.js:806:                    {/* Custom fields for category — skip post_type since it's at the top for jobs/services */}
frontend/src/pages/PostListing.js:808:                        Skipped entirely for cars / phones / services / jobs / realestate /
frontend/src/pages/PostListing.js:810:                    {!(form.category === "cars" || form.category === "phones" || form.category === "services" || form.category === "jobs" || form.category === "realestate" || form.category === "furniture" || form.category === "electronics" || form.category === "auctions" || form.category === "livestock" || form.category === "equipment") && cat?.fields?.filter((f) => f.key !== "post_type").map((f) => (
frontend/src/pages/PostListing.js:898:                        can show the rotation viewer (requires ≥ 8 images). */}
frontend/src/pages/PostListing.js:1085:                            <div>{tr("السعر: ")}<span className="text-[var(--text)] font-bold">{form.price ? `${Number(form.price).toLocaleString()} ${form.currency}` : "على السوم"}</span></div>
frontend/src/pages/PostListing.js:1117:function EntryCard({ icon: Icon, label, sub, color, accent, border, onClick, testId }) {
frontend/src/pages/ProfilePage.js:9:import ListingCard from "@/components/listings/ListingCard";
frontend/src/pages/ProfilePage.js:11:// Bold country card — primary entry point for changing country (per UX spec).
frontend/src/pages/ProfilePage.js:12:function CountryCard() {
frontend/src/pages/ProfilePage.js:64:    const [favorites, setFavorites] = useState([]);
frontend/src/pages/ProfilePage.js:67:    const [offers, setOffers] = useState([]);
frontend/src/pages/ProfilePage.js:68:    const [offerBusy, setOfferBusy] = useState("");
frontend/src/pages/ProfilePage.js:77:        api.get("/favorites").then(({ data }) => setFavorites(data));
frontend/src/pages/ProfilePage.js:80:        api.get("/offers/mine").then(({ data }) => setOffers(data || [])).catch(() => {});
frontend/src/pages/ProfilePage.js:91:    const decideOffer = async (offer, action) => {
frontend/src/pages/ProfilePage.js:92:        setOfferBusy(offer.id);
frontend/src/pages/ProfilePage.js:94:            await api.patch(`/listing-offers/${offer.id}`, { action });
frontend/src/pages/ProfilePage.js:95:            setOffers((items) => items.map((item) => item.id === offer.id ? { ...item, status: action === "accept" ? "accepted" : "rejected" } : item));
frontend/src/pages/ProfilePage.js:97:        finally { setOfferBusy(""); }
frontend/src/pages/ProfilePage.js:126:                                <span className="text-[var(--text-muted)]">❤ {stats.favorites_count}</span>
frontend/src/pages/ProfilePage.js:142:                    <Stat label={tr("المفضلة")} value={favorites.length} />
frontend/src/pages/ProfilePage.js:143:                    <Stat label={tr("درجة الموثوقية")} value={user.trust_score || 50} />
frontend/src/pages/ProfilePage.js:147:            {/* Referral Card */}
frontend/src/pages/ProfilePage.js:177:            {/* Country switcher — bold card. The ONLY place to change country
frontend/src/pages/ProfilePage.js:179:            <CountryCard />
frontend/src/pages/ProfilePage.js:224:            {/* Download App card — adaptive: highlights the user's platform store */}
frontend/src/pages/ProfilePage.js:225:            <DownloadAppCard />
frontend/src/pages/ProfilePage.js:231:                <button data-testid="tab-favorites" onClick={() => setTab("favorites")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center justify-center gap-2 ${tab === "favorites" ? "bg-[var(--primary)] text-[var(--primary-fg)]" : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"}`}>
frontend/src/pages/ProfilePage.js:232:                    <Heart className="w-4 h-4" /> {t("favorites")}
frontend/src/pages/ProfilePage.js:234:                <button data-testid="tab-offers" onClick={() => setTab("offers")} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full font-arabic font-bold text-sm flex items-center justify-center gap-2 ${tab === "offers" ? "bg-[var(--accent)] text-[var(--secondary)]" : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"}`}>
frontend/src/pages/ProfilePage.js:249:                                <ListingCard listing={l} compact />
frontend/src/pages/ProfilePage.js:257:            ) : tab === "favorites" ? (
frontend/src/pages/ProfilePage.js:258:                favorites.length === 0 ? (
frontend/src/pages/ProfilePage.js:264:                        {favorites.map((l) => <ListingCard key={l.id} listing={l} compact />)}
frontend/src/pages/ProfilePage.js:268:                offers.length === 0 ? (
frontend/src/pages/ProfilePage.js:275:                        {offers.map((offer) => (
frontend/src/pages/ProfilePage.js:276:                            <Link key={offer.id} to={`/listing/${offer.listing_id}`} className="flex items-center gap-3 bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
frontend/src/pages/ProfilePage.js:277:                                {offer.listing?.images?.[0] ? <img src={offer.listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 rounded-xl bg-[var(--surface-elevated)] flex items-center justify-center"><Tag className="w-5 h-5 text-[var(--primary)]" /></div>}
frontend/src/pages/ProfilePage.js:279:                                    <div className="font-arabic font-bold text-sm text-[var(--text)] truncate">{offer.listing?.title || tr("إعلان غير متاح")}</div>
frontend/src/pages/ProfilePage.js:280:                                    <div className="text-xs text-[var(--text-muted)] font-arabic-body mt-1">{offer.is_seller ? tr("عرض وارد") : tr("عرضي")} · {Number(offer.amount).toLocaleString()} {offer.currency || ""}</div>
frontend/src/pages/ProfilePage.js:283:                                    <span className={`text-[10px] font-arabic font-bold rounded-full px-2 py-1 ${offer.status === "accepted" ? "bg-emerald-100 text-emerald-700" : offer.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{offer.status === "accepted" ? tr("مقبول") : offer.status === "rejected" ? tr("مرفوض") : offer.status === "countered" ? tr("عرض مضاد") : tr("قيد المراجعة")}</span>
frontend/src/pages/ProfilePage.js:284:                                    {offer.is_seller && offer.status === "pending" && (
frontend/src/pages/ProfilePage.js:286:                                            <button type="button" data-testid={`accept-offer-${offer.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); decideOffer(offer, "accept"); }} disabled={offerBusy === offer.id} className="text-[10px] bg-emerald-600 text-white rounded-lg px-2 py-1 font-arabic font-bold disabled:opacity-50">{tr("قبول")}</button>
frontend/src/pages/ProfilePage.js:287:                                            <button type="button" data-testid={`reject-offer-${offer.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); decideOffer(offer, "reject"); }} disabled={offerBusy === offer.id} className="text-[10px] bg-red-100 text-red-700 rounded-lg px-2 py-1 font-arabic font-bold disabled:opacity-50">{tr("رفض")}</button>
frontend/src/pages/ProfilePage.js:356: * DownloadAppCard
frontend/src/pages/ProfilePage.js:364:function DownloadAppCard() {
frontend/src/pages/ProfilePage.js:381:        <div data-testid="profile-download-card" className="bg-gradient-to-br from-[var(--primary)]/10 via-[var(--surface)] to-[var(--accent)]/10 rounded-3xl border border-[var(--primary)]/30 p-5 mb-6">
frontend/src/pages/ReelsPage.js:4:import { Heart, MessageCircle, Share2, ChevronUp, ChevronDown, Volume2, VolumeX, ArrowLeft } from "lucide-react";
frontend/src/pages/ReelsPage.js:8:export default function ReelsPage() {
frontend/src/pages/ReelsPage.js:11:    const [reels, setReels] = useState([]);
frontend/src/pages/ReelsPage.js:21:            setReels(withVideos);
frontend/src/pages/ReelsPage.js:30:    }, [active, reels]);
frontend/src/pages/ReelsPage.js:40:            const { data } = await api.post(`/favorites/${l.id}`);
frontend/src/pages/ReelsPage.js:41:            setFavs((f) => ({ ...f, [l.id]: data.favorited }));
frontend/src/pages/ReelsPage.js:45:    const messageSeller = (l) => {
frontend/src/pages/ReelsPage.js:50:    const shareReel = async (l) => {
frontend/src/pages/ReelsPage.js:53:            if (navigator.share) {
frontend/src/pages/ReelsPage.js:54:                await navigator.share({ title: l.title, text: `${l.title} - الحراج بلس`, url });
frontend/src/pages/ReelsPage.js:62:    if (reels.length === 0) return (
frontend/src/pages/ReelsPage.js:76:            <button data-testid="reels-back-btn" onClick={() => nav(-1)} aria-label="رجوع" className="absolute top-3 start-3 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white">
frontend/src/pages/ReelsPage.js:79:            <Link to="/post?video=1" data-testid="reels-upload-btn" aria-label={tr("ارفع ستوري فيديو")} className="absolute top-3 end-3 z-30 flex items-center gap-1.5 bg-gradient-to-r from-[#4FB6E6] to-[#3AA9DD] text-white px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">
frontend/src/pages/ReelsPage.js:85:                {reels.map((l, i) => (
frontend/src/pages/ReelsPage.js:92:                                {l.price && <div className="font-latin font-black text-xl text-[var(--primary)]">{Number(l.price).toLocaleString()} {l.currency}</div>}
frontend/src/pages/ReelsPage.js:96:                                bottom of the reel empty. Primary = view ad,
frontend/src/pages/ReelsPage.js:97:                                Accent = chat with seller. */}
frontend/src/pages/ReelsPage.js:101:                                    data-testid={`reel-open-${l.id}`}
frontend/src/pages/ReelsPage.js:107:                                    onClick={() => messageSeller(l)}
frontend/src/pages/ReelsPage.js:108:                                    data-testid={`reel-contact-${l.id}`}
frontend/src/pages/ReelsPage.js:117:                            <button data-testid={`reel-fav-${l.id}`} onClick={() => toggleFav(l)} className="flex flex-col items-center gap-1"><div className={`w-11 h-11 rounded-full backdrop-blur flex items-center justify-center ${favs[l.id] ? "bg-red-500" : "bg-white/15"}`}><Heart className={`w-5 h-5 ${favs[l.id] ? "fill-white" : ""}`} /></div><span className="text-[10px]">{tr("مفضلة")}</span></button>
frontend/src/pages/ReelsPage.js:118:                            <button data-testid={`reel-msg-${l.id}`} onClick={() => messageSeller(l)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div><span className="text-[10px]">{tr("رسالة")}</span></button>
frontend/src/pages/ReelsPage.js:119:                            <button data-testid={`reel-share-${l.id}`} onClick={() => shareReel(l)} className="flex flex-col items-center gap-1"><div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Share2 className="w-5 h-5" /></div><span className="text-[10px]">{tr("شارك")}</span></button>
frontend/src/pages/SearchAndMap.js:10:import ListingCard from "@/components/listings/ListingCard";
frontend/src/pages/SearchAndMap.js:31:    cars: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M19 17h2v-3.28a1.81 1.81 0 0 0-1.06-1.66l-1.66-.76l-1.21-1.95A1.94 1.94 0 0 0 15.39 8H8.61a2 2 0 0 0-1.7.95L5.71 11l-1.66.74A1.85 1.85 0 0 0 3 13.5V17h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
frontend/src/pages/SearchAndMap.js:32:    motors: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 17.5h-5L8 11l4-3 4 6"/></svg>`,
frontend/src/pages/SearchAndMap.js:33:    real_estate: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
frontend/src/pages/SearchAndMap.js:34:    apartments: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>`,
frontend/src/pages/SearchAndMap.js:35:    electronics: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
frontend/src/pages/SearchAndMap.js:36:    mobiles: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
frontend/src/pages/SearchAndMap.js:37:    computers: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
frontend/src/pages/SearchAndMap.js:38:    furniture: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M3 18v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6"/><path d="M2 21v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/><path d="M4 18h16"/></svg>`,
frontend/src/pages/SearchAndMap.js:39:    fashion: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`,
frontend/src/pages/SearchAndMap.js:40:    jewelry: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="11" y1="3" x2="8" y2="9"/><line x1="13" y1="3" x2="16" y2="9"/><line x1="2" y1="9" x2="22" y2="9"/></svg>`,
frontend/src/pages/SearchAndMap.js:41:    jobs: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
frontend/src/pages/SearchAndMap.js:42:    services: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
frontend/src/pages/SearchAndMap.js:43:    sports: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/></svg>`,
frontend/src/pages/SearchAndMap.js:44:    games: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"/></svg>`,
frontend/src/pages/SearchAndMap.js:45:    books: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
frontend/src/pages/SearchAndMap.js:46:    food: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M3 11h18M3 11l1 7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-7"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
frontend/src/pages/SearchAndMap.js:47:    pets: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10z"/></svg>`,
frontend/src/pages/SearchAndMap.js:48:    baby: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="12" cy="12" r="10"/><path d="M9 12h.01M15 12h.01M9.5 16a3.5 3.5 0 0 0 5 0"/></svg>`,
frontend/src/pages/SearchAndMap.js:49:    beauty: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`,
frontend/src/pages/SearchAndMap.js:50:    industrial: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>`,
frontend/src/pages/SearchAndMap.js:51:    agricultural: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5a4 4 0 0 0 6 0a5.5 5.5 0 0 1 3.3-1.5c1.71.06 3.13.74 4 2.2"/><path d="M2 16c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5a4 4 0 0 0 6 0a5.5 5.5 0 0 1 3.3-1.5c1.71.06 3.13.74 4 2.2"/><path d="M12 2v6M9 5l3 3 3-3"/></svg>`,
frontend/src/pages/SearchAndMap.js:52:    art: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><circle cx="13.5" cy="6.5" r=".5" fill="white"/><circle cx="17.5" cy="10.5" r=".5" fill="white"/><circle cx="8.5" cy="7.5" r=".5" fill="white"/><circle cx="6.5" cy="12.5" r=".5" fill="white"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
frontend/src/pages/SearchAndMap.js:53:    auction: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`,
frontend/src/pages/SearchAndMap.js:54:    general: `<svg viewBox="0 0 24 24" width="16" height="16" ${SVG_BASE}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
frontend/src/pages/SearchAndMap.js:61:// Hologram pin: floating, glowing price chip + category SVG icon
frontend/src/pages/SearchAndMap.js:62:function buildHologramIcon({ price, currency, category }) {
frontend/src/pages/SearchAndMap.js:63:    const display = price ? Number(price).toLocaleString() : "★";
frontend/src/pages/SearchAndMap.js:64:    const sub = price ? (currency || "ر.س") : (category || "—");
frontend/src/pages/SearchAndMap.js:77:              <div class="hp-price">${display}</div>
frontend/src/pages/SearchAndMap.js:109:    const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
frontend/src/pages/SearchAndMap.js:110:    const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
frontend/src/pages/SearchAndMap.js:125:        // Debounce search input by 300ms and cancel any previous in-flight request.
frontend/src/pages/SearchAndMap.js:132:                if (minPrice) params.min_price = minPrice;
frontend/src/pages/SearchAndMap.js:133:                if (maxPrice) params.max_price = maxPrice;
frontend/src/pages/SearchAndMap.js:156:    }, [q, user, sortBy, days, minPrice, maxPrice, userLoc, country, locationFilter]);
frontend/src/pages/SearchAndMap.js:196:                        <option value="price_asc">{tr("الأرخص")}</option>
frontend/src/pages/SearchAndMap.js:197:                        <option value="price_desc">{tr("الأغلى")}</option>
frontend/src/pages/SearchAndMap.js:212:                            <input data-testid="filter-min" type="number" placeholder={tr("السعر من")} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:213:                            <input data-testid="filter-max" type="number" placeholder={tr("السعر إلى")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-[var(--surface-elevated)] rounded-xl px-3 py-2 text-sm border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--primary)] font-arabic-body" />
frontend/src/pages/SearchAndMap.js:245:                    {results.map((l) => <ListingCard key={l.id} listing={l} compact />)}
frontend/src/pages/SearchAndMap.js:287:                        <Marker key={it.id} position={[it.lat, it.lng]} icon={buildHologramIcon({ price: it.price, currency: it.currency, category: it.category })}>
frontend/src/pages/SearchAndMap.js:291:                                    {it.price && <div className="text-[var(--primary)] font-bold">{Number(it.price).toLocaleString()} {it.currency}</div>}
frontend/src/pages/StaticPages.js:8:import NotificationsPanel from "@/components/NotificationsPanel";
frontend/src/pages/StaticPages.js:27:            await api.post("/auth/request-account-deletion");
frontend/src/pages/StaticPages.js:79:            {user && <NotificationsPanel />}
frontend/src/pages/WalletPage.js:76:                <div className="bg-[var(--surface)] border-2 border-dashed border-[var(--accent)] rounded-2xl p-5 mb-5 flex items-center gap-3" data-testid="welcome-bonus-card">
frontend/src/components/AIAssistantWidget.js:24:        const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
frontend/src/components/AIAssistantWidget.js:25:        if (saved && typeof saved.x === "number" && typeof saved.y === "number") return saved;
frontend/src/components/AIAssistantWidget.js:90:    // Re-clamp on viewport resize so the FAB never gets stuck off-screen.
frontend/src/components/AnimalsEquipmentBoxes.js:15: * Storage: all values land in `form.custom_fields.{key}`. Price is mirrored to
frontend/src/components/AnimalsEquipmentBoxes.js:16: * `form.price` so the listing's headline price stays populated — the standalone
frontend/src/components/AnimalsEquipmentBoxes.js:17: * global price block must be suppressed for `livestock` and `equipment` in the
frontend/src/components/AnimalsEquipmentBoxes.js:85:                <PriceCell label={tr("السعر")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v })} testid="animal-price" />
frontend/src/components/AnimalsEquipmentBoxes.js:151:                <PriceCell label={isRental ? tr("سعر الإيجار") : tr("السعر")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v })} testid="eq-price" />
frontend/src/components/AnimalsEquipmentBoxes.js:168:   Shared cell primitives
frontend/src/components/AnimalsEquipmentBoxes.js:230:function PriceCell({ label, value, currency, onChange, required, testid }) {
frontend/src/components/AuctionsServicesBoxes.js:2: * Market-level Details Boxes for Auctions + Services (PRO with conditional logic).
frontend/src/components/AuctionsServicesBoxes.js:4: *   <AuctionsDetailsBox form={form} setForm={setForm} tr={tr} currency={..} />
frontend/src/components/AuctionsServicesBoxes.js:11: * All values land in `form.custom_fields.{key}` — except the auction starting
frontend/src/components/AuctionsServicesBoxes.js:12: * price which mirrors to `form.price` (so the listing's headline price stays
frontend/src/components/AuctionsServicesBoxes.js:13: * populated and the auction infra has its own `starting_price` snapshot).
frontend/src/components/AuctionsServicesBoxes.js:20:   AUCTIONS — 5 rows × 2 cols (10 fields)
frontend/src/components/AuctionsServicesBoxes.js:25:    auction_duration: ["3 أيام", "5 أيام", "7 أيام", "10 أيام", "14 يوم", "30 يوم", "حسب التاريخ المحدد"],
frontend/src/components/AuctionsServicesBoxes.js:34:export function AuctionsDetailsBox({ form, setForm, tr, currency = "ر.س" }) {
frontend/src/components/AuctionsServicesBoxes.js:38:    // ─── Auto-calculate end_time from auction_duration ────────────────────
frontend/src/components/AuctionsServicesBoxes.js:40:        const d = cf.auction_duration;
frontend/src/components/AuctionsServicesBoxes.js:50:    }, [cf.auction_duration]);
frontend/src/components/AuctionsServicesBoxes.js:53:    const startNum = parseFloat(form.price || cf.starting_price || 0);
frontend/src/components/AuctionsServicesBoxes.js:55:    const reserveNum = parseFloat(cf.reserve_price || 0);
frontend/src/components/AuctionsServicesBoxes.js:56:    const buyNowNum = parseFloat(cf.buy_now_price || 0);
frontend/src/components/AuctionsServicesBoxes.js:61:        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="auctions-details-box">
frontend/src/components/AuctionsServicesBoxes.js:71:                <PriceCell label={tr("سعر البداية")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v, custom_fields: { ...form.custom_fields, starting_price: v } })} testid="auc-starting-price" />
frontend/src/components/AuctionsServicesBoxes.js:75:                <NumberCell label={tr("السعر الاحتياطي (سري)")} value={cf.reserve_price} onChange={(v) => set({ reserve_price: v })} suffix={currency} testid="auc-reserve-price" hint={tr("لن يُباع تحته")} />
frontend/src/components/AuctionsServicesBoxes.js:76:                <NumberCell label={tr("اشتر الآن (Buy Now)")} value={cf.buy_now_price} onChange={(v) => set({ buy_now_price: v })} suffix={currency} testid="auc-buy-now" hint={buyNowNum > 0 ? "⚡ " + tr("سيُبرز في الكرت") : null} />
frontend/src/components/AuctionsServicesBoxes.js:79:                <SelectCell label={tr("مدة المزاد")} value={cf.auction_duration} options={AUC_OPTIONS.auction_duration} required onChange={(v) => set({ auction_duration: v })} testid="auc-duration" />
frontend/src/components/AuctionsServicesBoxes.js:80:                <DateTimeCell label={tr("وقت الانتهاء")} value={cf.end_time} onChange={(v) => set({ end_time: v })} testid="auc-end-time" hint={cf.auction_duration && cf.auction_duration !== "حسب التاريخ المحدد" ? tr("✓ تلقائي من المدة") : null} />
frontend/src/components/AuctionsServicesBoxes.js:96:                <CountdownPreview iso={cf.end_time} tr={tr} />
frontend/src/components/AuctionsServicesBoxes.js:102:function CountdownPreview({ iso, tr }) {
frontend/src/components/AuctionsServicesBoxes.js:103:    // UI hook only — purely visual preview of the live countdown.
frontend/src/components/AuctionsServicesBoxes.js:111:        <div className="text-[10px] font-arabic-body text-[var(--text-muted)] mt-1" data-testid="auc-countdown-preview">
frontend/src/components/AuctionsServicesBoxes.js:202:                    <NumberCell label={tr("السعر المقترح")} value={cf.price_estimate} onChange={(v) => set({ price_estimate: v })} testid="svc-price-estimate" />
frontend/src/components/AuctionsServicesBoxes.js:257:   Shared 2-col cell primitives (kept local for zero-coupling)
frontend/src/components/AuctionsServicesBoxes.js:320:function PriceCell({ label, value, currency, onChange, required, testid }) {
frontend/src/components/AuthCallback.js:88:                // Tokens saved but /me failed — could be cold start.
frontend/src/components/CategoryCascades.js:5: * Cascading + structured selectors for cars + phones.
frontend/src/components/CategoryCascades.js:9: * these cascades is mounted so there's zero duplication below the price.
frontend/src/components/CategoryCascades.js:18:const CAR_STATIC_OPTIONS = {
frontend/src/components/CategoryCascades.js:54:export function CarCascade({ value, onChange, tr = TR }) {
frontend/src/components/CategoryCascades.js:62:        api.get("/meta/car-brands").then(({ data }) => {
frontend/src/components/CategoryCascades.js:69:        if (!v.car_brand) { setModels([]); return; }
frontend/src/components/CategoryCascades.js:70:        api.get("/meta/car-models", { params: { brand: v.car_brand } })
frontend/src/components/CategoryCascades.js:73:    }, [v.car_brand]);
frontend/src/components/CategoryCascades.js:76:        if (!v.car_brand || !v.car_model) { setTrims([]); return; }
frontend/src/components/CategoryCascades.js:77:        api.get("/meta/car-trims", { params: { brand: v.car_brand, model: v.car_model } })
frontend/src/components/CategoryCascades.js:80:    }, [v.car_brand, v.car_model]);
frontend/src/components/CategoryCascades.js:85:        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="car-cascade">
frontend/src/components/CategoryCascades.js:88:                <Pick label={tr("الماركة")} value={v.car_brand || ""} options={brands} onChange={(b) => set({ car_brand: b, car_model: "", car_trim: "" })} testid="car-brand" />
frontend/src/components/CategoryCascades.js:89:                <Pick label={tr("الموديل")} value={v.car_model || ""} options={models} onChange={(m) => set({ car_model: m, car_trim: "" })} disabled={!v.car_brand} testid="car-model" />
frontend/src/components/CategoryCascades.js:90:                <Pick label={tr("السنة")} value={v.car_year || ""} options={years} onChange={(y) => set({ car_year: y })} testid="car-year" />
frontend/src/components/CategoryCascades.js:91:                <Pick label={tr("الفئة")} value={v.car_trim || ""} options={trims} onChange={(t) => set({ car_trim: t })} disabled={!v.car_model} testid="car-trim" />
frontend/src/components/CategoryCascades.js:92:                <Pick label={tr("الممشى (كم)")} value={v.mileage || ""} options={CAR_STATIC_OPTIONS.mileage} onChange={(x) => set({ mileage: x })} testid="car-mileage" />
frontend/src/components/CategoryCascades.js:93:                <Pick label={tr("ناقل الحركة")} value={v.transmission || ""} options={CAR_STATIC_OPTIONS.transmission} onChange={(x) => set({ transmission: x })} testid="car-transmission" />
frontend/src/components/CategoryCascades.js:94:                <Pick label={tr("نوع الوقود")} value={v.fuel_type || ""} options={CAR_STATIC_OPTIONS.fuel_type} onChange={(x) => set({ fuel_type: x })} testid="car-fuel" />
frontend/src/components/CategoryCascades.js:95:                <Pick label={tr("الحالة")} value={v.condition || ""} options={CAR_STATIC_OPTIONS.condition} onChange={(x) => set({ condition: x })} testid="car-condition" />
frontend/src/components/CategoryCascades.js:96:                <Field label={tr("اللون")} value={v.color || ""} onChange={(x) => set({ color: x })} placeholder={tr("مثال: أبيض / أسود")} testid="car-color" />
frontend/src/components/CategoryCascades.js:97:                <Pick label={tr("نوع الإعلان")} value={v.listing_type || ""} options={CAR_STATIC_OPTIONS.listing_type} onChange={(x) => set({ listing_type: x })} testid="car-listing-type" />
frontend/src/components/CitySelect.js:76:            {/* Trigger button - shows like a real dropdown */}
frontend/src/components/CountryPicker.js:9: * Opens on first visit (no country saved) OR when the user clicks the country
frontend/src/components/CountryPicker.js:13: * also synced to /users/me so push notifications / recommendations target the
frontend/src/components/GeoAutocomplete.js:80:                local.push({ name: r.name, parent: r.parent, source: "geo" });
frontend/src/components/ImageViewer.js:5:export default function ImageViewer({ images = [], initialIndex = 0, onClose }) {
frontend/src/components/ImageViewer.js:117:        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" data-testid="image-viewer-overlay">
frontend/src/components/JobsRealEstateBoxes.js:2: * OLX/Haraj-grade Details Boxes for Jobs + Real Estate categories.
frontend/src/components/JobsRealEstateBoxes.js:4: *   <JobsDetailsBox form={form} setForm={setForm} tr={tr} />
frontend/src/components/JobsRealEstateBoxes.js:5: *   <RealEstateDetailsBox form={form} setForm={setForm} tr={tr} country={country} />
frontend/src/components/JobsRealEstateBoxes.js:8: * (except multi-line free-text fields like requirements/skills which live at the
frontend/src/components/JobsRealEstateBoxes.js:12: * global price block is suppressed for both categories so the price input shown
frontend/src/components/JobsRealEstateBoxes.js:13: * here is the single source of truth (writes directly to `form.price`).
frontend/src/components/JobsRealEstateBoxes.js:15: * Storage keys → `form.custom_fields.{key}`; price → `form.price`.
frontend/src/components/JobsRealEstateBoxes.js:21:   JOBS — 4 rows × 2 cols + conditional block per post_type
frontend/src/components/JobsRealEstateBoxes.js:23:const JOB_OPTIONS = {
frontend/src/components/JobsRealEstateBoxes.js:24:    job_type: [
frontend/src/components/JobsRealEstateBoxes.js:43:export function JobsDetailsBox({ form, setForm, tr }) {
frontend/src/components/JobsRealEstateBoxes.js:49:        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="jobs-details-box">
frontend/src/components/JobsRealEstateBoxes.js:54:                {/* Row 1: job_title (input) | job_type (dropdown) */}
frontend/src/components/JobsRealEstateBoxes.js:55:                <TextCell label={tr("المسمى الوظيفي")} value={cf.job_title} required onChange={(v) => set({ job_title: v })} placeholder={tr("مثال: مهندس برمجيات أول")} testid="job-title" />
frontend/src/components/JobsRealEstateBoxes.js:56:                <SelectCell label={tr("نوع الوظيفة")} value={cf.job_type} options={JOB_OPTIONS.job_type} required onChange={(v) => set({ job_type: v })} testid="job-type" />
frontend/src/components/JobsRealEstateBoxes.js:60:                    <TextCell label={tr("الراتب المتوقع")} value={cf.expected_salary} onChange={(v) => set({ expected_salary: v })} placeholder={tr("مثال: 8,000 ر.س")} testid="job-expected-salary" />
frontend/src/components/JobsRealEstateBoxes.js:62:                    <TextCell label={tr("نطاق الراتب")} value={cf.salary_range} onChange={(v) => set({ salary_range: v })} placeholder={tr("مثال: 6,000 - 10,000 ر.س")} testid="job-salary-range" />
frontend/src/components/JobsRealEstateBoxes.js:64:                <SelectCell label={tr("مستوى الخبرة")} value={cf.experience_level} options={JOB_OPTIONS.experience_level} required onChange={(v) => set({ experience_level: v })} testid="job-experience-level" />
frontend/src/components/JobsRealEstateBoxes.js:67:                <SelectCell label={tr("المؤهل العلمي")} value={cf.education_level} options={JOB_OPTIONS.education_level} required onChange={(v) => set({ education_level: v })} testid="job-education-level" />
frontend/src/components/JobsRealEstateBoxes.js:68:                <SelectCell label={tr("جدول العمل")} value={cf.work_schedule} options={JOB_OPTIONS.work_schedule} onChange={(v) => set({ work_schedule: v })} testid="job-work-schedule" />
frontend/src/components/JobsRealEstateBoxes.js:71:                <SelectCell label={tr("نمط الموقع")} value={cf.location_type} options={JOB_OPTIONS.location_type} required onChange={(v) => set({ location_type: v })} testid="job-location-type" />
frontend/src/components/JobsRealEstateBoxes.js:72:                <SelectCell label={tr("المجال / التخصص")} value={cf.field} options={JOB_OPTIONS.field} required onChange={(v) => set({ field: v })} testid="job-field" />
frontend/src/components/JobsRealEstateBoxes.js:77:                    <TextAreaCell colSpan label={tr("المهارات والقدرات")} value={cf.skills} onChange={(v) => set({ skills: v })} placeholder={tr("اذكر مهاراتك، مثال: Python, React, إدارة فرق...")} testid="job-skills" />
frontend/src/components/JobsRealEstateBoxes.js:79:                    <TextAreaCell colSpan label={tr("المتطلبات والشروط")} value={cf.requirements} onChange={(v) => set({ requirements: v })} placeholder={tr("اذكر المؤهلات والمتطلبات الإلزامية...")} testid="job-requirements" />
frontend/src/components/JobsRealEstateBoxes.js:111:export function RealEstateDetailsBox({ form, setForm, tr, country }) {
frontend/src/components/JobsRealEstateBoxes.js:117:        <div className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--border)] space-y-2" data-testid="realestate-details-box">
frontend/src/components/JobsRealEstateBoxes.js:134:                <PriceCell label={tr("السعر")} value={form.price} currency={currency} required onChange={(v) => setForm({ ...form, price: v })} testid="re-price" />
frontend/src/components/JobsRealEstateBoxes.js:149:   Shared 2-col cell primitives
frontend/src/components/JobsRealEstateBoxes.js:209:function PriceCell({ label, value, currency, onChange, required, testid }) {
frontend/src/components/ListingTypeBadge.js:2: * Compact overlay badge that surfaces intent on listing cards.
frontend/src/components/ListingTypeBadge.js:8: *        "عرض وظيفة"  | "باحث عن عمل"   → Jobs
frontend/src/components/ListingTypeBadge.js:13: * Renders a coloured pill — green for "offer/sale", blue for "request/rent",
frontend/src/components/ListingTypeBadge.js:22:    let tone = "neutral"; // "offer" | "request" | "transfer"
frontend/src/components/ListingTypeBadge.js:27:        tone = pt === "عرض وظيفة" ? "offer" : "request";
frontend/src/components/ListingTypeBadge.js:31:        tone = pt === "تقديم خدمة" ? "offer" : "request";
frontend/src/components/ListingTypeBadge.js:35:        if (dt === "للبيع") tone = "offer";
frontend/src/components/ListingTypeBadge.js:36:        else if (dt === "للإيجار") tone = "request";
frontend/src/components/ListingTypeBadge.js:42:    const toneCls = tone === "offer"
frontend/src/components/ListingTypeBadge.js:44:        : tone === "request"
frontend/src/components/NotificationBell.js:8:import { playNotificationSound } from "@/lib/notificationSound";
frontend/src/components/NotificationBell.js:13: * - Polls /api/notifications every 60s (cheap, just an unread count).
frontend/src/components/NotificationBell.js:16: * - Dropdown lists the latest 20 notifications with deep-links.
frontend/src/components/NotificationBell.js:21:    listing_offer: { Icon: Tag, color: "text-amber-500" },
frontend/src/components/NotificationBell.js:22:    listing_offer_update: { Icon: CheckCircle2, color: "text-emerald-500" },
frontend/src/components/NotificationBell.js:25:    price_drop: { Icon: Tag, color: "text-orange-500" },
frontend/src/components/NotificationBell.js:26:    auction: { Icon: Hammer, color: "text-purple-500" },
frontend/src/components/NotificationBell.js:36:        case "price_drop":
frontend/src/components/NotificationBell.js:37:        case "listing_offer":
frontend/src/components/NotificationBell.js:38:        case "listing_offer_update": return n.data?.listing_id ? `/listing/${n.data.listing_id}` : "/";
frontend/src/components/NotificationBell.js:43:export default function NotificationBell() {
frontend/src/components/NotificationBell.js:57:            const { data } = await api.get("/notifications", { params: { limit: 20 } });
frontend/src/components/NotificationBell.js:63:                try { playNotificationSound(); } catch (_) {}
frontend/src/components/NotificationBell.js:85:        const offOffer = subscribe("listing_offer", refresh);
frontend/src/components/NotificationBell.js:86:        const offOfferUpdate = subscribe("listing_offer_update", refresh);
frontend/src/components/NotificationBell.js:87:        return () => { offMessage?.(); offOffer?.(); offOfferUpdate?.(); };
frontend/src/components/NotificationBell.js:100:            await api.post("/notifications/read-all");
frontend/src/components/NotificationBell.js:109:        try { await api.post(`/notifications/${id}/read`); } catch (_) {}
frontend/src/components/NotificationsPanel.js:4:import { isWebPushSupported, getWebPushStatus, subscribeWebPush, unsubscribeWebPush, sendTestPush, getWebPushUnsupportedReason } from "@/lib/webPush";
frontend/src/components/NotificationsPanel.js:10:    "no-push-api": "متصفحك لا يدعم Push API — جرّب Chrome/Edge/Firefox",
frontend/src/components/NotificationsPanel.js:11:    "no-notification-api": "متصفحك لا يدعم نظام الإشعارات",
frontend/src/components/NotificationsPanel.js:15: * NotificationsPanel — settings UI for web push & per-type preferences.
frontend/src/components/NotificationsPanel.js:19: *   2. Per-event preferences (messages, listing_status, deals, watchlist, broadcasts, comments).
frontend/src/components/NotificationsPanel.js:27:    { key: "comments", label: "التعليقات والردود" },
frontend/src/components/NotificationsPanel.js:31:export default function NotificationsPanel() {
frontend/src/components/NotificationsPanel.js:32:    const supported = isWebPushSupported();
frontend/src/components/NotificationsPanel.js:38:    const refreshStatus = async () => setStatus(await getWebPushStatus());
frontend/src/components/NotificationsPanel.js:42:        api.get("/push/preferences").then(({ data }) => setPrefs(data)).catch(() => {});
frontend/src/components/NotificationsPanel.js:47:        const r = await subscribeWebPush();
frontend/src/components/NotificationsPanel.js:50:        else if (r.reason === "unsupported") setMsg(tr("❌ المتصفح لا يدعم Web Push"));
frontend/src/components/NotificationsPanel.js:58:        await unsubscribeWebPush();
frontend/src/components/NotificationsPanel.js:66:        const r = await sendTestPush();
frontend/src/components/NotificationsPanel.js:74:        try { await api.put("/push/preferences", { [key]: next[key] }); } catch (_) {}
frontend/src/components/NotificationsPanel.js:78:        <div data-testid="notifications-panel" className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-3">
frontend/src/components/NotificationsPanel.js:94:                                        const reason = getWebPushUnsupportedReason();
frontend/src/components/NotificationsPanel.js:106:                            <button data-testid="webpush-test" onClick={testIt} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:border-[var(--primary)]">
frontend/src/components/NotificationsPanel.js:109:                            <button data-testid="webpush-disable" onClick={disable} disabled={busy} className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold border border-red-500/30">
frontend/src/components/NotificationsPanel.js:114:                        <button data-testid="webpush-enable" onClick={enable} disabled={busy} className="px-3 py-1.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold disabled:opacity-50">
frontend/src/components/PriceBadge.js:12: * Compact version: used in listing cards (small chip).
frontend/src/components/PriceBadge.js:13: * Full version: used in listing detail (card with icon + label + sub).
frontend/src/components/PriceBadge.js:15:export default function PriceBadge({ listingId, variant = "full" }) {
frontend/src/components/PriceBadge.js:21:        api.get(`/ai/price-badge/${listingId}`)
frontend/src/components/PriceBadge.js:32:            <span data-testid={`price-chip-${badge.badge}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-arabic font-black border ${color}`}>
frontend/src/components/PriceBadge.js:39:        <div data-testid={`price-badge-${badge.badge}`} className={`rounded-2xl border p-3 flex items-start gap-3 ${color}`}>
frontend/src/components/SEO.js:6: * to understand the page content. Open Graph + Twitter cards for rich social sharing.
frontend/src/components/SEO.js:14:    const title = `${listing.title} ${listing.price ? `بسعر ${listing.price.toLocaleString()} ${listing.currency || "ر.س"}` : ""} | ${listing.city || ""} - الحراج بلس`.slice(0, 200);
frontend/src/components/SEO.js:33:        "offers": {
frontend/src/components/SEO.js:34:            "@type": "Offer",
frontend/src/components/SEO.js:36:            "priceCurrency": listing.currency_code || "SAR",
frontend/src/components/SEO.js:37:            "price": listing.price || 0,
frontend/src/components/SEO.js:38:            "priceValidUntil": new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
frontend/src/components/SEO.js:41:            "seller": {
frontend/src/components/SEO.js:43:                "name": listing.seller?.name || "بائع",
frontend/src/components/SEO.js:83:            <meta name="twitter:card" content="summary_large_image" />
frontend/src/components/SmartAppBanner.js:42:    // in App" buttons Twitter/Reddit show on shared links.
frontend/src/components/Spin360Viewer.js:7: * Real 3D Viewer using Three.js / WebGL.
frontend/src/components/Spin360Viewer.js:14: * (paid). This viewer renders genuine 3D scene (WebGL), not a 2D frame switcher.
frontend/src/components/Spin360Viewer.js:16:export default function Spin360Viewer({ images = [], onClose }) {
frontend/src/components/Spin360Viewer.js:64:        // with N images we get genuine multi-view 3D.
frontend/src/components/Spin360Viewer.js:192:            raf = requestAnimationFrame(animate);
frontend/src/components/Spin360Viewer.js:253:        <div className="fixed inset-0 z-[60] bg-gradient-to-br from-black via-[#0F1A35] to-black flex flex-col items-center justify-center" data-testid="spin360-viewer">
frontend/src/components/Viewer360.js:6: * Lightweight 360° image-sequence viewer (web).
frontend/src/components/Viewer360.js:8: * No 3D, no WebGL — just a swipe-to-rotate frame-flip viewer powered by the
frontend/src/components/Viewer360.js:10: * 360 viewers used on car marketplaces.
frontend/src/components/Viewer360.js:16:export default function Viewer360({ images = [], onClose }) {
frontend/src/components/Viewer360.js:64:        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none" data-testid="viewer-360-modal">
frontend/src/components/Viewer360.js:98:                data-testid="viewer-360-close"
frontend/src/components/Viewer360.js:114:                    data-testid="viewer-360-zoom-out"
frontend/src/components/Viewer360.js:121:                <div className="bg-white/15 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20" data-testid="viewer-360-index">
frontend/src/components/Viewer360.js:125:                    data-testid="viewer-360-zoom-in"
frontend/src/components/Viewer360.js:133:                    data-testid="viewer-360-autospin"
frontend/src/components/layout/BottomNav.js:45:    //  - Reels/Stories (immersive vertical video)
frontend/src/components/layout/BottomNav.js:48:    //  - Auction detail (sticky "مزايدة" button lives at bottom)
frontend/src/components/layout/BottomNav.js:50:    const onReels = pathname.startsWith("/reels");
frontend/src/components/layout/BottomNav.js:52:    const onAuction = /^\/auctions?\/[^/]+/.test(pathname);
frontend/src/components/layout/BottomNav.js:53:    if (onReels || onListing || onAuction || aiOpen) return null;
frontend/src/components/layout/BottomNav.js:114:                    <SideItem to="/reels" icon={Film} label={tr("ستوري")} navKey="reels" />
frontend/src/components/layout/TopBar.js:7:import NotificationBell from "@/components/NotificationBell";
frontend/src/components/layout/TopBar.js:228:                {/* Notifications bell */}
frontend/src/components/layout/TopBar.js:229:                <NotificationBell />
frontend/src/components/listings/ListingCard.js:10:export default function ListingCard({ listing, compact = true }) {
frontend/src/components/listings/ListingCard.js:18:            const { data } = await api.post(`/favorites/${listing.id}`);
frontend/src/components/listings/ListingCard.js:19:            setFav(data.favorited);
frontend/src/components/listings/ListingCard.js:29:            data-testid={`listing-card-${listing.id}`}
frontend/src/components/listings/ListingCard.js:51:                {/* Jobs / services intent badge — shown on top-right corner of the image overlay.
frontend/src/components/listings/ListingCard.js:52:                    Auto-hidden for non-job/service listings via the component itself. */}
frontend/src/components/listings/ListingCard.js:61:                        {listing.price ? (
frontend/src/components/listings/ListingCard.js:63:                                <span className="font-latin font-black text-base text-[var(--secondary)] dark:text-[var(--primary)]">{Number(listing.price).toLocaleString()}</span>
=== FEATURE MARKERS MOBILE ===
mobile/src/screens/AIAssistantScreen.js:3:import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
mobile/src/screens/AIAssistantScreen.js:85:  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
mobile/src/screens/AIAssistantScreen.js:90:            <View style={styles.header}>
mobile/src/screens/AIAssistantScreen.js:98:                <View style={styles.headerInner}>
mobile/src/screens/AIAssistantScreen.js:99:                    <View style={styles.botIcon}><Bot size={20} color={colors.primary} /></View>
mobile/src/screens/AIAssistantScreen.js:100:                    <View style={{
mobile/src/screens/AIAssistantScreen.js:105:                    </View>
mobile/src/screens/AIAssistantScreen.js:109:                </View>
mobile/src/screens/AIAssistantScreen.js:110:            </View>
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
mobile/src/screens/AuctionsScreen.js:1:// AuctionsScreen — mirrors web /app/frontend/src/pages/AuctionsPage.js
mobile/src/screens/AuctionsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Modal, TextInput, FlatList, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
mobile/src/screens/AuctionsScreen.js:13:export default function AuctionsScreen({ route }) {
mobile/src/screens/AuctionsScreen.js:34:      } = await api.get("/auctions/active", {
mobile/src/screens/AuctionsScreen.js:48:  // When the list is populated AND a target listing was requested, open its
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
mobile/src/screens/AuctionsScreen.js:117:function AuctionCard({
mobile/src/screens/AuctionsScreen.js:125:  const currentPrice = top?.amount || listing.price || 0;
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
mobile/src/screens/AuctionsScreen.js:153:                <Text style={styles.cardTitle} numberOfLines={1}>{listing.title}</Text>
mobile/src/screens/AuctionsScreen.js:154:                <Text style={styles.cardCity} numberOfLines={1}>{listing.city}</Text>
mobile/src/screens/AuctionsScreen.js:155:                <View style={styles.cardFoot}>
mobile/src/screens/AuctionsScreen.js:156:                    <View>
mobile/src/screens/AuctionsScreen.js:157:                        <Text style={styles.cardLabel}>{top ? t("أعلى مزايدة") : t("السعر الابتدائي")}</Text>
mobile/src/screens/AuctionsScreen.js:158:                        <Text style={styles.cardPrice}>{Number(currentPrice).toLocaleString()} <Text style={styles.cardCurrency}>{listing.currency || t("ر.س")}</Text></Text>
mobile/src/screens/AuctionsScreen.js:159:                    </View>
mobile/src/screens/AuctionsScreen.js:164:                </View>
mobile/src/screens/AuctionsScreen.js:165:            </View>
mobile/src/screens/AuctionsScreen.js:166:        </View>;
mobile/src/screens/AuctionsScreen.js:182:    const loadBids = () => api.get(`/auctions/${listing.id}/bids`).then(({ data }) => {
mobile/src/screens/AuctionsScreen.js:190:  // Owner-defined min increment per bid (saved as `custom_fields.bid_increment`).
mobile/src/screens/AuctionsScreen.js:194:    || listing.auction_meta?.min_increment
mobile/src/screens/AuctionsScreen.js:195:    || listing.auction_meta?.bid_increment
mobile/src/screens/AuctionsScreen.js:200:  const currentAmount = top?.amount || listing.price || 0;
mobile/src/screens/AuctionsScreen.js:215:      await api.post(`/auctions/${listing.id}/bid`, {
mobile/src/screens/AuctionsScreen.js:225:  return <Modal animationType="slide" transparent visible onRequestClose={onClose}>
mobile/src/screens/AuctionsScreen.js:226:            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBg}>
mobile/src/screens/AuctionsScreen.js:227:                <View style={[styles.modalSheet, {
mobile/src/screens/AuctionsScreen.js:230:                    <View style={styles.modalHead}>
mobile/src/screens/AuctionsScreen.js:231:                        <View style={{
mobile/src/screens/AuctionsScreen.js:239:                        </View>
mobile/src/screens/AuctionsScreen.js:241:                    </View>
mobile/src/screens/AuctionsScreen.js:242:                    <View style={{
mobile/src/screens/AuctionsScreen.js:246:                        <View style={styles.topBidBox}>
mobile/src/screens/AuctionsScreen.js:247:                            <View>
mobile/src/screens/AuctionsScreen.js:248:                                <Text style={styles.cardLabel}>{top ? t("أعلى مزايدة") : t("السعر الابتدائي")}</Text>
mobile/src/screens/AuctionsScreen.js:249:                                <Text style={styles.modalPrice}>{Number(top?.amount || listing.price || 0).toLocaleString()} <Text style={styles.cardCurrency}>{listing.currency || t("ر.س")}</Text></Text>
mobile/src/screens/AuctionsScreen.js:250:                            </View>
mobile/src/screens/AuctionsScreen.js:251:                            <View style={{
mobile/src/screens/AuctionsScreen.js:254:                                <Text style={styles.cardLabel}>{t("عدد المزايدات")}</Text>
mobile/src/screens/AuctionsScreen.js:256:                            </View>
mobile/src/screens/AuctionsScreen.js:257:                        </View>
mobile/src/screens/AuctionsScreen.js:265:                        {bids.length > 0 && <View style={{
mobile/src/screens/AuctionsScreen.js:275:            }) => <View style={[styles.bidRow, index === 0 && styles.bidRowTop]}>
mobile/src/screens/AuctionsScreen.js:280:                                        </View>} />
mobile/src/screens/AuctionsScreen.js:281:                            </View>}
mobile/src/screens/AuctionsScreen.js:282:                    </View>
mobile/src/screens/AuctionsScreen.js:283:                </View>
mobile/src/screens/AuctionsScreen.js:284:            </KeyboardAvoidingView>
mobile/src/screens/AuctionsScreen.js:381:  card: {
mobile/src/screens/AuctionsScreen.js:389:  cardImgBox: {
mobile/src/screens/AuctionsScreen.js:434:  cardTitle: {
mobile/src/screens/AuctionsScreen.js:439:  cardCity: {
mobile/src/screens/AuctionsScreen.js:444:  cardFoot: {
mobile/src/screens/AuctionsScreen.js:453:  cardLabel: {
mobile/src/screens/AuctionsScreen.js:457:  cardPrice: {
mobile/src/screens/AuctionsScreen.js:462:  cardCurrency: {
mobile/src/screens/AuctionsScreen.js:521:  modalPrice: {
mobile/src/screens/AuthScreens.js:2:import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from "react-native";
mobile/src/screens/AuthScreens.js:18:  // Strategy 1: popToTop — if Login was pushed on top of Main, pop back to it
mobile/src/screens/AuthScreens.js:43:    <View style={styles.authHeader} testID="auth-header">
mobile/src/screens/AuthScreens.js:54:      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
mobile/src/screens/AuthScreens.js:56:          <View style={styles.langSheet}>
mobile/src/screens/AuthScreens.js:63:          </View>
mobile/src/screens/AuthScreens.js:66:    </View>
mobile/src/screens/AuthScreens.js:91:  return <View style={{
mobile/src/screens/AuthScreens.js:104:            <View style={{
mobile/src/screens/AuthScreens.js:114:            </View>
mobile/src/screens/AuthScreens.js:115:        </View>;
mobile/src/screens/AuthScreens.js:225:  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/AuthScreens.js:226:            <ScrollView contentContainerStyle={styles.scroll}>
mobile/src/screens/AuthScreens.js:228:                <View style={styles.card}>
mobile/src/screens/AuthScreens.js:229:                    <View style={styles.logo}>
mobile/src/screens/AuthScreens.js:232:                    </View>
mobile/src/screens/AuthScreens.js:235:                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}
mobile/src/screens/AuthScreens.js:249:                    {askEnable && <View style={styles.enableBioBox}>
mobile/src/screens/AuthScreens.js:251:                            <View style={styles.enableBioRow}>
mobile/src/screens/AuthScreens.js:258:                            </View>
mobile/src/screens/AuthScreens.js:259:                        </View>}
mobile/src/screens/AuthScreens.js:261:                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>{t("أو")}</Text><View style={styles.line} /></View>
mobile/src/screens/AuthScreens.js:275:                </View>
mobile/src/screens/AuthScreens.js:276:            </ScrollView>
mobile/src/screens/AuthScreens.js:277:        </KeyboardAvoidingView>;
mobile/src/screens/AuthScreens.js:324:  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/AuthScreens.js:325:            <ScrollView contentContainerStyle={styles.scroll}>
mobile/src/screens/AuthScreens.js:327:                <View style={styles.card}>
mobile/src/screens/AuthScreens.js:328:                    <View style={styles.logo}>
mobile/src/screens/AuthScreens.js:331:                    </View>
mobile/src/screens/AuthScreens.js:334:                    {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}
mobile/src/screens/AuthScreens.js:357:                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>{t("أو")}</Text><View style={styles.line} /></View>
mobile/src/screens/AuthScreens.js:363:                </View>
mobile/src/screens/AuthScreens.js:364:            </ScrollView>
mobile/src/screens/AuthScreens.js:365:        </KeyboardAvoidingView>;
mobile/src/screens/AuthScreens.js:402:    backgroundColor: theme.colors.surfaceCard,
mobile/src/screens/AuthScreens.js:458:  card: {
mobile/src/screens/ChatScreen.js:2:// Two views: conversations list  +  chat thread (selected by route.params.to or list tap).
mobile/src/screens/ChatScreen.js:5:import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar, StyleSheet, RefreshControl, Modal, Linking, PanResponder, Animated } from "react-native";
mobile/src/screens/ChatScreen.js:18:import { requestRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets } from "expo-audio";
mobile/src/screens/ChatScreen.js:120:  // already have seller_name/avatar/id in the route params. Use them
mobile/src/screens/ChatScreen.js:123:  const initialSellerName = route.params?.seller_name;
mobile/src/screens/ChatScreen.js:124:  const initialSellerAvatar = route.params?.seller_avatar;
mobile/src/screens/ChatScreen.js:133:      name: initialSellerName || "مستخدم",
mobile/src/screens/ChatScreen.js:134:      avatar: initialSellerAvatar,
mobile/src/screens/ChatScreen.js:179:    //    different seller after the screen was already mounted, and also
mobile/src/screens/ChatScreen.js:183:      name: initialSellerName || t("مستخدم"),
mobile/src/screens/ChatScreen.js:184:      avatar: initialSellerAvatar,
mobile/src/screens/ChatScreen.js:228:    return <View style={s.guestWrap}>
mobile/src/screens/ChatScreen.js:229:                <View style={s.guestIcon}>
mobile/src/screens/ChatScreen.js:231:                </View>
mobile/src/screens/ChatScreen.js:237:            </View>;
mobile/src/screens/ChatScreen.js:242:  return <View style={{
mobile/src/screens/ChatScreen.js:247:            <View style={[s.listHeader, {
mobile/src/screens/ChatScreen.js:255:            </View>
mobile/src/screens/ChatScreen.js:258:    }} /> : filtered.length === 0 ? <View style={s.empty}>
mobile/src/screens/ChatScreen.js:259:                    <View style={s.emptyIcon}><Send size={32} color={colors.primary} /></View>
mobile/src/screens/ChatScreen.js:262:                </View> : <FlatList data={filtered} keyExtractor={c => c.id} contentContainerStyle={{
mobile/src/screens/ChatScreen.js:274:    })} />} ItemSeparatorComponent={() => <View style={s.sep} />} />}
mobile/src/screens/ChatScreen.js:275:        </View>;
mobile/src/screens/ChatScreen.js:287:            <View style={s.avatarWrap}>
mobile/src/screens/ChatScreen.js:293:                {convo.online && <View style={s.onlineDot} />}
mobile/src/screens/ChatScreen.js:294:            </View>
mobile/src/screens/ChatScreen.js:295:            <View style={{
mobile/src/screens/ChatScreen.js:299:                <View style={s.convoTop}>
mobile/src/screens/ChatScreen.js:302:                </View>
mobile/src/screens/ChatScreen.js:303:                <View style={s.convoBottom}>
mobile/src/screens/ChatScreen.js:310:                    {unread > 0 && <View style={s.unreadBadge}>
mobile/src/screens/ChatScreen.js:312:                        </View>}
mobile/src/screens/ChatScreen.js:313:                </View>
mobile/src/screens/ChatScreen.js:314:            </View>
mobile/src/screens/ChatScreen.js:348:  // tried to render the reply preview.
mobile/src/screens/ChatScreen.js:403:      // Auto-mark as read since we're viewing
mobile/src/screens/ChatScreen.js:462:  // Auto-send listing context on first open via "Contact Seller" CTA.
mobile/src/screens/ChatScreen.js:478:    const priceLine = listing.price ? ` (${Number(listing.price).toLocaleString()} ${listing.currency || ""})` : "";
mobile/src/screens/ChatScreen.js:479:    const text = `${t("مرحباً، أنا مهتم بإعلانك")}: ${listing.title}${priceLine}\n${url}`;
mobile/src/screens/ChatScreen.js:601:      } = await Location.requestForegroundPermissionsAsync();
mobile/src/screens/ChatScreen.js:687:        const perm = await requestRecordingPermissionsAsync();
mobile/src/screens/ChatScreen.js:712:  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
mobile/src/screens/ChatScreen.js:720:            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
mobile/src/screens/ChatScreen.js:722:            </View>
mobile/src/screens/ChatScreen.js:724:            <View style={[s.threadHeader, {
mobile/src/screens/ChatScreen.js:737:                <View style={s.threadAvatar}>
mobile/src/screens/ChatScreen.js:745:                </View>
mobile/src/screens/ChatScreen.js:746:                <View style={{
mobile/src/screens/ChatScreen.js:750:                    <View style={{
mobile/src/screens/ChatScreen.js:756:                        {other.verified && <View style={s.verifiedDot} />}
mobile/src/screens/ChatScreen.js:757:                    </View>
mobile/src/screens/ChatScreen.js:761:                </View>
mobile/src/screens/ChatScreen.js:806:            </View>
mobile/src/screens/ChatScreen.js:815:                    <View style={{
mobile/src/screens/ChatScreen.js:819:                        {listing.price && <Text style={s.listingPrice}>{Number(listing.price).toLocaleString()} {listing.currency}</Text>}
mobile/src/screens/ChatScreen.js:820:                    </View>
mobile/src/screens/ChatScreen.js:824:            {loading ? <View style={{
mobile/src/screens/ChatScreen.js:827:    }}><ActivityIndicator color={colors.primary} /></View> : <View style={{ flex: 1 }}>
mobile/src/screens/ChatScreen.js:840:                              {showDay && <View style={s.dayChip}><Text style={s.dayChipText}>{fmtDay(itemTs)}</Text></View>}
mobile/src/screens/ChatScreen.js:846:                </View>}
mobile/src/screens/ChatScreen.js:849:            {showActions && <View style={s.actionSheet}>
mobile/src/screens/ChatScreen.js:851:                        <View style={[s.actionIcon, {
mobile/src/screens/ChatScreen.js:853:        }]}><ImageIcon size={20} color="#fff" /></View>
mobile/src/screens/ChatScreen.js:857:                        <View style={[s.actionIcon, {
mobile/src/screens/ChatScreen.js:859:        }]}><MapPin size={20} color="#fff" /></View>
mobile/src/screens/ChatScreen.js:865:                        <View style={[s.actionIcon, {
mobile/src/screens/ChatScreen.js:867:        }]}><X size={20} color="#fff" /></View>
mobile/src/screens/ChatScreen.js:870:                </View>}
mobile/src/screens/ChatScreen.js:873:            <View style={{
mobile/src/screens/ChatScreen.js:877:                {replyTo && <View style={s.replyBox}>
mobile/src/screens/ChatScreen.js:878:                        <View style={[s.replyBar, {
mobile/src/screens/ChatScreen.js:881:                        <View style={{
mobile/src/screens/ChatScreen.js:886:                        </View>
mobile/src/screens/ChatScreen.js:890:                    </View>}
mobile/src/screens/ChatScreen.js:891:                <View style={[s.composer, {
mobile/src/screens/ChatScreen.js:909:                </View>
mobile/src/screens/ChatScreen.js:910:            </View>
mobile/src/screens/ChatScreen.js:913:            {lightbox && <Modal visible transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
mobile/src/screens/ChatScreen.js:914:                    <View style={s.lightboxBg}>
mobile/src/screens/ChatScreen.js:921:                    </View>
mobile/src/screens/ChatScreen.js:925:            {longPressMsg && <Modal visible transparent animationType="fade" onRequestClose={() => setLongPressMsg(null)}>
mobile/src/screens/ChatScreen.js:927:                    <View style={s.lpSheet}>
mobile/src/screens/ChatScreen.js:929:                        <View style={s.reactRow}>
mobile/src/screens/ChatScreen.js:949:                        </View>
mobile/src/screens/ChatScreen.js:963:                    </View>
mobile/src/screens/ChatScreen.js:969:        </KeyboardAvoidingView>;
mobile/src/screens/ChatScreen.js:1000:    return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
mobile/src/screens/ChatScreen.js:1002:            <View style={[s.lpSheet, { maxHeight: "70%" }]}>
mobile/src/screens/ChatScreen.js:1012:            </View>
mobile/src/screens/ChatScreen.js:1028:  // onSwipeReply(m). The bubble follows the finger up to ±90 px then springs
mobile/src/screens/ChatScreen.js:1059:  // Build the URL (or coords) for whichever media this message carries.
mobile/src/screens/ChatScreen.js:1076:  return <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
mobile/src/screens/ChatScreen.js:1080:            <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther, isImage && {
mobile/src/screens/ChatScreen.js:1084:                {m.forwarded_from ? <View style={s.fwdBadge}>
mobile/src/screens/ChatScreen.js:1086:                </View> : null}
mobile/src/screens/ChatScreen.js:1087:                {/* Quoted reply preview */}
mobile/src/screens/ChatScreen.js:1088:                {replyTo && <View style={[s.replyPreview, isMine && {
mobile/src/screens/ChatScreen.js:1091:                        <View style={[s.replyBar, {
mobile/src/screens/ChatScreen.js:1094:                        <View style={{
mobile/src/screens/ChatScreen.js:1107:                        </View>
mobile/src/screens/ChatScreen.js:1108:                    </View>}
mobile/src/screens/ChatScreen.js:1121:                <View style={[s.metaRow, isImage && {
mobile/src/screens/ChatScreen.js:1135:                </View>
mobile/src/screens/ChatScreen.js:1136:            </View>
mobile/src/screens/ChatScreen.js:1140:                <View style={[s.reactionsRow, isMine ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
mobile/src/screens/ChatScreen.js:1142:                        <View key={em} style={s.reactionChip}>
mobile/src/screens/ChatScreen.js:1145:                        </View>
mobile/src/screens/ChatScreen.js:1147:                </View>
mobile/src/screens/ChatScreen.js:1150:  </Animated.View>;
mobile/src/screens/ChatScreen.js:1226:  return <View style={s.voiceBubble}>
mobile/src/screens/ChatScreen.js:1230:            <View style={s.voiceWave}>
mobile/src/screens/ChatScreen.js:1235:                  // Active bar bounces a bit while playing for a TikTok-like animation.
mobile/src/screens/ChatScreen.js:1237:                  return <View key={i} style={[s.voiceBar, {
mobile/src/screens/ChatScreen.js:1244:            </View>
mobile/src/screens/ChatScreen.js:1248:        </View>;
mobile/src/screens/ChatScreen.js:1253:  return <View style={[s.bubbleWrap, {
mobile/src/screens/ChatScreen.js:1256:            <View style={[s.bubble, s.bubbleOther, {
mobile/src/screens/ChatScreen.js:1264:            </View>
mobile/src/screens/ChatScreen.js:1265:        </View>;
mobile/src/screens/ChatScreen.js:1278:  return <View style={{
mobile/src/screens/ChatScreen.js:1523:  listingPrice: {
mobile/src/screens/ChatScreen.js:1553:    ...shadow.card,
mobile/src/screens/ChatScreen.js:1703:    ...shadow.cardLarge
mobile/src/screens/ChatScreen.js:1735:    backgroundColor: colors.surfaceCard
mobile/src/screens/ChatScreen.js:1829:  replyPreview: {
mobile/src/screens/ChatScreen.js:1865:    ...shadow.card,
mobile/src/screens/FlightsScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Linking, Alert, Platform } from "react-native";
mobile/src/screens/FlightsScreen.js:301:  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
mobile/src/screens/FlightsScreen.js:302:            <View style={pStyles.bg}>
mobile/src/screens/FlightsScreen.js:303:                <View style={pStyles.sheet}>
mobile/src/screens/FlightsScreen.js:304:                    <View style={pStyles.head}>
mobile/src/screens/FlightsScreen.js:308:                    </View>
mobile/src/screens/FlightsScreen.js:316:                                <View style={{
mobile/src/screens/FlightsScreen.js:321:                                </View>
mobile/src/screens/FlightsScreen.js:323:                </View>
mobile/src/screens/FlightsScreen.js:324:            </View>
mobile/src/screens/FlightsScreen.js:423:  return <ScrollView style={{
mobile/src/screens/FlightsScreen.js:431:            <View style={[styles.hero, shadow.card]}>
mobile/src/screens/FlightsScreen.js:439:                <View style={styles.heroRow}>
mobile/src/screens/FlightsScreen.js:440:                    <View style={styles.heroIconBox}><Plane size={22} color="#fff" /></View>
mobile/src/screens/FlightsScreen.js:441:                    <View style={{
mobile/src/screens/FlightsScreen.js:446:                    </View>
mobile/src/screens/FlightsScreen.js:447:                </View>
mobile/src/screens/FlightsScreen.js:448:            </View>
mobile/src/screens/FlightsScreen.js:451:            <View style={styles.formCard}>
mobile/src/screens/FlightsScreen.js:453:                <View style={styles.tripTypeRow}>
mobile/src/screens/FlightsScreen.js:460:                </View>
mobile/src/screens/FlightsScreen.js:463:                <View style={{
mobile/src/screens/FlightsScreen.js:466:                    <View>
mobile/src/screens/FlightsScreen.js:467:                        <View style={styles.fieldLabel}><MapPin size={11} color={colors.text} /><Text style={styles.fieldLabelText}>{t("من")}</Text></View>
mobile/src/screens/FlightsScreen.js:472:                    </View>
mobile/src/screens/FlightsScreen.js:473:                    <View>
mobile/src/screens/FlightsScreen.js:474:                        <View style={styles.fieldLabel}><MapPin size={11} color={colors.text} /><Text style={styles.fieldLabelText}>{t("إلى")}</Text></View>
mobile/src/screens/FlightsScreen.js:479:                    </View>
mobile/src/screens/FlightsScreen.js:480:                </View>
mobile/src/screens/FlightsScreen.js:483:                <View style={{
mobile/src/screens/FlightsScreen.js:488:                    <View style={{
mobile/src/screens/FlightsScreen.js:491:                        <View style={styles.fieldLabel}><Calendar size={11} color={colors.text} /><Text style={styles.fieldLabelText}>تاريخ الذهاب</Text></View>
mobile/src/screens/FlightsScreen.js:495:                    </View>
mobile/src/screens/FlightsScreen.js:496:                    {tripType === "round" ? <View style={{
mobile/src/screens/FlightsScreen.js:499:                            <View style={styles.fieldLabel}><Calendar size={11} color={colors.text} /><Text style={styles.fieldLabelText}>تاريخ العودة</Text></View>
mobile/src/screens/FlightsScreen.js:503:                        </View> : <View style={{
mobile/src/screens/FlightsScreen.js:506:                            <View style={styles.fieldLabel}><Users size={11} color={colors.text} /><Text style={styles.fieldLabelText}>المسافرون</Text></View>
mobile/src/screens/FlightsScreen.js:507:                            <View style={styles.paxRow}>
mobile/src/screens/FlightsScreen.js:511:                            </View>
mobile/src/screens/FlightsScreen.js:512:                        </View>}
mobile/src/screens/FlightsScreen.js:513:                </View>
mobile/src/screens/FlightsScreen.js:514:                {tripType === "round" && <View style={{
mobile/src/screens/FlightsScreen.js:517:                        <View style={styles.fieldLabel}><Users size={11} color={colors.text} /><Text style={styles.fieldLabelText}>{t("عدد المسافرين")}</Text></View>
mobile/src/screens/FlightsScreen.js:518:                        <View style={styles.paxRow}>
mobile/src/screens/FlightsScreen.js:522:                        </View>
mobile/src/screens/FlightsScreen.js:523:                    </View>}
mobile/src/screens/FlightsScreen.js:526:                <View style={styles.providersHead}>
mobile/src/screens/FlightsScreen.js:529:                </View>
mobile/src/screens/FlightsScreen.js:530:                <View style={styles.providersGrid}>
mobile/src/screens/FlightsScreen.js:543:                            {p.full && <View style={styles.recommend}><Text style={styles.recommendText}>⭐ {t("موصى به")}</Text></View>}
mobile/src/screens/FlightsScreen.js:546:                </View>
mobile/src/screens/FlightsScreen.js:549:            </View>
mobile/src/screens/FlightsScreen.js:555:        </ScrollView>;
mobile/src/screens/FlightsScreen.js:589:  formCard: {
mobile/src/screens/HomeScreen.js:3:import { View, Text, ScrollView, TouchableOpacity, FlatList, Image, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, StatusBar } from "react-native";
mobile/src/screens/HomeScreen.js:16:import ListingCard from "../components/ListingCard";
mobile/src/screens/HomeScreen.js:17:import NotificationBell from "../components/NotificationBell";
mobile/src/screens/HomeScreen.js:25:const CARD_GAP = 10;
mobile/src/screens/HomeScreen.js:26:const CARD_W = (SCREEN_W - 16 * 2 - CARD_GAP) / 2;
mobile/src/screens/HomeScreen.js:103:  }) => <View style={{
mobile/src/screens/HomeScreen.js:104:    width: CARD_W
mobile/src/screens/HomeScreen.js:106:            <ListingCard listing={item} />
mobile/src/screens/HomeScreen.js:107:        </View>, []);
mobile/src/screens/HomeScreen.js:110:  const Header = useMemo(() => <View>
mobile/src/screens/HomeScreen.js:115:            <View style={styles.sectionHead}>
mobile/src/screens/HomeScreen.js:116:                <View>
mobile/src/screens/HomeScreen.js:119:                </View>
mobile/src/screens/HomeScreen.js:120:            </View>
mobile/src/screens/HomeScreen.js:121:        </View>, [nav, insets, visibleCats, categories.length, showAllCats, lang]);
mobile/src/screens/HomeScreen.js:122:  return <View style={{
mobile/src/screens/HomeScreen.js:128:      gap: CARD_GAP,
mobile/src/screens/HomeScreen.js:130:      marginBottom: CARD_GAP
mobile/src/screens/HomeScreen.js:133:    }} ListHeaderComponent={Header} renderItem={renderItem} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7} removeClippedSubviews ListEmptyComponent={loading ? <SkeletonListingGrid count={8} /> : <View style={styles.empty}>
mobile/src/screens/HomeScreen.js:135:                    </View>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} />} onEndReached={loadMore} onEndReachedThreshold={0.6} ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{
mobile/src/screens/HomeScreen.js:141:        </View>;
mobile/src/screens/HomeScreen.js:173:              const perm = await ImagePicker.requestCameraPermissionsAsync();
mobile/src/screens/HomeScreen.js:221:  return <View style={{ paddingTop: insets.top + 4 }}>
mobile/src/screens/HomeScreen.js:228:            <View style={styles.brandRow}>
mobile/src/screens/HomeScreen.js:230:                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
mobile/src/screens/HomeScreen.js:239:                    <NotificationBell />
mobile/src/screens/HomeScreen.js:240:                </View>
mobile/src/screens/HomeScreen.js:241:            </View>
mobile/src/screens/HomeScreen.js:242:            <View style={styles.topBar}>
mobile/src/screens/HomeScreen.js:263:            </View>
mobile/src/screens/HomeScreen.js:265:            <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
mobile/src/screens/HomeScreen.js:267:                    <View style={styles.langSheet}>
mobile/src/screens/HomeScreen.js:274:                    </View>
mobile/src/screens/HomeScreen.js:277:        </View>;
mobile/src/screens/HomeScreen.js:286:  return <View style={{
mobile/src/screens/HomeScreen.js:290:            <View style={[styles.heroWrap, shadow.card]}>
mobile/src/screens/HomeScreen.js:299:                <View style={[styles.glowBlob, {
mobile/src/screens/HomeScreen.js:304:                <View style={[styles.glowBlob, {
mobile/src/screens/HomeScreen.js:310:                <View style={styles.heroInner}>
mobile/src/screens/HomeScreen.js:311:                    <View style={styles.aiBadge}>
mobile/src/screens/HomeScreen.js:314:                    </View>
mobile/src/screens/HomeScreen.js:322:                    <View style={{
mobile/src/screens/HomeScreen.js:334:                    </View>
mobile/src/screens/HomeScreen.js:335:                </View>
mobile/src/screens/HomeScreen.js:336:            </View>
mobile/src/screens/HomeScreen.js:337:        </View>;
mobile/src/screens/HomeScreen.js:353:    to: "Auctions",
mobile/src/screens/HomeScreen.js:359:    to: "ReelsTab",
mobile/src/screens/HomeScreen.js:377:  return <View style={styles.quickWrap}>
mobile/src/screens/HomeScreen.js:389:        </View>;
mobile/src/screens/HomeScreen.js:403:  return <View style={{
mobile/src/screens/HomeScreen.js:407:            <View style={styles.sectionHead}>
mobile/src/screens/HomeScreen.js:417:            </View>
mobile/src/screens/HomeScreen.js:418:            <View style={styles.catsGrid}>
mobile/src/screens/HomeScreen.js:426:                            <View style={styles.catIconWrap}>
mobile/src/screens/HomeScreen.js:428:                            </View>
mobile/src/screens/HomeScreen.js:432:            </View>
mobile/src/screens/HomeScreen.js:433:        </View>;
mobile/src/screens/HomeScreen.js:442:  return <View style={styles.ctaWrap}>
mobile/src/screens/HomeScreen.js:450:            <View style={{
mobile/src/screens/HomeScreen.js:458:            </View>
mobile/src/screens/HomeScreen.js:459:        </View>;
mobile/src/screens/HomeScreen.js:548:    ...shadow.card
mobile/src/screens/HomeScreen.js:662:    backgroundColor: colors.surfaceCard,
mobile/src/screens/HomeScreen.js:666:    ...shadow.card
mobile/src/screens/HomeScreen.js:711:    backgroundColor: colors.surfaceCard,
mobile/src/screens/HomeScreen.js:716:    ...shadow.card
mobile/src/screens/HomeScreen.js:737:    backgroundColor: colors.surfaceCard,
mobile/src/screens/HomeScreen.js:739:    ...shadow.card
mobile/src/screens/ListingDetailScreen.js:2:import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, FlatList, Dimensions, Modal, TextInput } from "react-native";
mobile/src/screens/ListingDetailScreen.js:3:import { Phone, MessageCircle, Bell, BellOff, Share2, ChevronRight, Gavel, Heart, CheckCircle2 } from "lucide-react-native";
mobile/src/screens/ListingDetailScreen.js:11:import ListingCard from "../components/ListingCard";
mobile/src/screens/ListingDetailScreen.js:12:import Viewer360Mobile from "../components/Viewer360Mobile";
mobile/src/screens/ListingDetailScreen.js:48:  const [following, setFollowing] = useState(false);
mobile/src/screens/ListingDetailScreen.js:50:  const [priceAlertOpen, setPriceAlertOpen] = useState(false);
mobile/src/screens/ListingDetailScreen.js:51:  const [priceAlertVal, setPriceAlertVal] = useState("");
mobile/src/screens/ListingDetailScreen.js:52:  const [liked, setLiked] = useState(false);
mobile/src/screens/ListingDetailScreen.js:53:  const [likeCount, setLikeCount] = useState(0);
mobile/src/screens/ListingDetailScreen.js:54:  const [comments, setComments] = useState([]);
mobile/src/screens/ListingDetailScreen.js:55:  const [commentText, setCommentText] = useState("");
mobile/src/screens/ListingDetailScreen.js:56:  const [commentBusy, setCommentBusy] = useState(false);
mobile/src/screens/ListingDetailScreen.js:57:  const carouselRef = useRef(null);
mobile/src/screens/ListingDetailScreen.js:62:        const [l, s, b] = await Promise.all([api.get(`/listings/${id}`), api.get(`/listings/${id}/similar`), api.get(`/ai/price-badge/${id}`).catch(() => ({
mobile/src/screens/ListingDetailScreen.js:66:        trackEvent("listing_view", { listing_id: l.data.id, category: l.data.category, country_code: l.data.country_code });
mobile/src/screens/ListingDetailScreen.js:69:        setLikeCount(Number(l.data.like_count || 0));
mobile/src/screens/ListingDetailScreen.js:70:        api.get(`/listings/${id}/comments`).then(({ data }) => setComments(data?.items || [])).catch(() => {});
mobile/src/screens/ListingDetailScreen.js:71:        if (user) api.get(`/listings/${id}/like/check`).then(({ data }) => setLiked(!!data?.liked)).catch(() => {});
mobile/src/screens/ListingDetailScreen.js:72:        // Fire-and-forget: log to "recently viewed" so /listings/recent works.
mobile/src/screens/ListingDetailScreen.js:73:        api.post(`/listings/${id}/view`).catch(() => {});
mobile/src/screens/ListingDetailScreen.js:81:  // Load follow + watch status once we know who the seller is.
mobile/src/screens/ListingDetailScreen.js:83:    if (!user || !listing?.seller?.id) return;
mobile/src/screens/ListingDetailScreen.js:84:    const sellerId = listing.seller.id;
mobile/src/screens/ListingDetailScreen.js:85:    api.get(`/sellers/${sellerId}/follow-status`).then(({
mobile/src/screens/ListingDetailScreen.js:87:    }) => setFollowing(!!data?.following)).catch(() => {});
mobile/src/screens/ListingDetailScreen.js:93:  }, [user, listing?.seller?.id, id]);
mobile/src/screens/ListingDetailScreen.js:94:  if (!listing) return <View style={styles.center}><Text>{t("جاري التحميل...")}</Text></View>;
mobile/src/screens/ListingDetailScreen.js:108:    const raw = (listing.seller?.phone_full || "").trim();
mobile/src/screens/ListingDetailScreen.js:114:    // Bare digits → assume seller's country.
mobile/src/screens/ListingDetailScreen.js:115:    const cc = (listing.seller?.country_code || listing.country_code || "SA").toUpperCase();
mobile/src/screens/ListingDetailScreen.js:120:  const shareAd = async () => {
mobile/src/screens/ListingDetailScreen.js:123:      await Share.share({
mobile/src/screens/ListingDetailScreen.js:130:  const toggleLike = async () => {
mobile/src/screens/ListingDetailScreen.js:132:    const previous = liked;
mobile/src/screens/ListingDetailScreen.js:133:    setLiked(!previous);
mobile/src/screens/ListingDetailScreen.js:134:    setLikeCount(count => Math.max(0, count + (previous ? -1 : 1)));
mobile/src/screens/ListingDetailScreen.js:136:      const { data } = await api.post(`/listings/${id}/like`);
mobile/src/screens/ListingDetailScreen.js:137:      setLiked(!!data?.liked);
mobile/src/screens/ListingDetailScreen.js:138:      setLikeCount(Number(data?.like_count || 0));
mobile/src/screens/ListingDetailScreen.js:140:      setLiked(previous);
mobile/src/screens/ListingDetailScreen.js:141:      setLikeCount(count => Math.max(0, count + (previous ? 1 : -1)));
mobile/src/screens/ListingDetailScreen.js:144:  const submitComment = async () => {
mobile/src/screens/ListingDetailScreen.js:146:    const text = commentText.trim();
mobile/src/screens/ListingDetailScreen.js:148:    setCommentBusy(true);
mobile/src/screens/ListingDetailScreen.js:150:      const { data } = await api.post(`/listings/${id}/comments`, { text });
mobile/src/screens/ListingDetailScreen.js:151:      setComments(items => [data, ...items]);
mobile/src/screens/ListingDetailScreen.js:152:      setCommentText("");
mobile/src/screens/ListingDetailScreen.js:154:    finally { setCommentBusy(false); }
mobile/src/screens/ListingDetailScreen.js:207:  const toggleFollowSeller = async () => {
mobile/src/screens/ListingDetailScreen.js:212:    const sellerId = listing?.seller?.id;
mobile/src/screens/ListingDetailScreen.js:213:    if (!sellerId) return;
mobile/src/screens/ListingDetailScreen.js:217:      } = await api.post(`/sellers/${sellerId}/follow`);
mobile/src/screens/ListingDetailScreen.js:218:      setFollowing(!!data?.following);
mobile/src/screens/ListingDetailScreen.js:223:  const submitWatchPrice = async () => {
mobile/src/screens/ListingDetailScreen.js:224:    const target = parseFloat(priceAlertVal);
mobile/src/screens/ListingDetailScreen.js:232:        target_price: target
mobile/src/screens/ListingDetailScreen.js:235:      setPriceAlertOpen(false);
mobile/src/screens/ListingDetailScreen.js:236:      setPriceAlertVal("");
mobile/src/screens/ListingDetailScreen.js:256:  const isAuction = listing && (listing.category === "auctions" || !!listing.auction_meta || !!listing.is_auction);
mobile/src/screens/ListingDetailScreen.js:257:  return <View style={[styles.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/ListingDetailScreen.js:269:        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: isAuction ? 120 : 90 }}>
mobile/src/screens/ListingDetailScreen.js:270:            <View style={styles.imageWrap}>
mobile/src/screens/ListingDetailScreen.js:271:                {listing.images?.length ? <FlatList ref={carouselRef} data={listing.images} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(_, i) => `img-${i}`} getItemLayout={(_, i) => ({
mobile/src/screens/ListingDetailScreen.js:286:                            </TouchableOpacity>} testID="mobile-image-carousel" /> : <View style={[styles.mainImage, styles.ph]}><Text style={styles.phText}>{t("لا توجد صور")}</Text></View>}
mobile/src/screens/ListingDetailScreen.js:287:                {listing.images?.length > 1 && <View style={styles.dotsRow} pointerEvents="none">
mobile/src/screens/ListingDetailScreen.js:288:                        {listing.images.map((_, i) => <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />)}
mobile/src/screens/ListingDetailScreen.js:289:                    </View>}
mobile/src/screens/ListingDetailScreen.js:293:            </View>
mobile/src/screens/ListingDetailScreen.js:295:            {listing.images?.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs} contentContainerStyle={{
mobile/src/screens/ListingDetailScreen.js:300:        carouselRef.current?.scrollToIndex?.({
mobile/src/screens/ListingDetailScreen.js:309:                </ScrollView>}
mobile/src/screens/ListingDetailScreen.js:311:            {isOwner && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ownerBar} testID="owner-bar">
mobile/src/screens/ListingDetailScreen.js:358:                </ScrollView>}
mobile/src/screens/ListingDetailScreen.js:360:            <View style={styles.body}>
mobile/src/screens/ListingDetailScreen.js:361:                {listing.status === "paused" && <View style={styles.pausedBanner} testID="listing-paused-banner">
mobile/src/screens/ListingDetailScreen.js:363:                    </View>}
mobile/src/screens/ListingDetailScreen.js:365:                <View style={styles.priceRow}>
mobile/src/screens/ListingDetailScreen.js:366:                    {listing.price ? <Text style={styles.price}>{Number(listing.price).toLocaleString()} <Text style={styles.currency}>{listing.currency}</Text></Text> : <Text style={styles.priceMuted}>{t("على السوم")}</Text>}
mobile/src/screens/ListingDetailScreen.js:367:                </View>
mobile/src/screens/ListingDetailScreen.js:368:                <View style={styles.engagementRow}>
mobile/src/screens/ListingDetailScreen.js:369:                    <TouchableOpacity onPress={toggleLike} style={[styles.engagementBtn, liked && styles.engagementBtnActive]} testID="mobile-like-btn">
mobile/src/screens/ListingDetailScreen.js:370:                        <Heart size={17} color={liked ? "#E11D48" : theme.colors.textMuted} fill={liked ? "#E11D48" : "transparent"} />
mobile/src/screens/ListingDetailScreen.js:371:                        <Text style={[styles.engagementText, liked && { color: "#E11D48" }]}>{likeCount}</Text>
mobile/src/screens/ListingDetailScreen.js:373:                    <View style={styles.engagementBtn}><Text style={styles.engagementText}>👁 {Number(listing.views || 0)}</Text></View>
mobile/src/screens/ListingDetailScreen.js:374:                    <View style={styles.engagementBtn}><Text style={styles.engagementText}>💬 {comments.length}</Text></View>
mobile/src/screens/ListingDetailScreen.js:375:                </View>
mobile/src/screens/ListingDetailScreen.js:376:                {badge?.badge && <View style={[styles.badge, {
mobile/src/screens/ListingDetailScreen.js:380:                        <View style={{
mobile/src/screens/ListingDetailScreen.js:385:                        </View>
mobile/src/screens/ListingDetailScreen.js:386:                    </View>}
mobile/src/screens/ListingDetailScreen.js:392:                {user ? <View style={styles.commentComposer}>
mobile/src/screens/ListingDetailScreen.js:393:                    <TextInput value={commentText} onChangeText={setCommentText} maxLength={1000} placeholder={t("اكتب تعليقًا عامًا...")} placeholderTextColor={theme.colors.textMuted} style={styles.commentInput} multiline />
mobile/src/screens/ListingDetailScreen.js:394:                    <TouchableOpacity onPress={submitComment} disabled={commentBusy || !commentText.trim()} style={[styles.commentSubmit, (commentBusy || !commentText.trim()) && { opacity: 0.5 }]} testID="mobile-comment-submit"><Text style={styles.commentSubmitText}>{commentBusy ? t("جارٍ النشر...") : t("نشر")}</Text></TouchableOpacity>
mobile/src/screens/ListingDetailScreen.js:395:                </View> : <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.commentLogin}><Text style={styles.commentLoginText}>{t("سجل الدخول لكتابة تعليق")}</Text></TouchableOpacity>}
mobile/src/screens/ListingDetailScreen.js:396:                {comments.length === 0 ? <Text style={styles.emptyComments}>{t("لا توجد تعليقات بعد")}</Text> : comments.map(comment => <View key={comment.id} style={styles.commentCard}><View style={styles.commentMeta}><Text style={styles.commentAuthor}>{comment.author?.name || t("مستخدم")}</Text>{comment.author?.verified && <CheckCircle2 size={13} color={theme.colors.primary} />}<Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text></View><Text style={styles.commentBody}>{comment.text}</Text></View>)}
mobile/src/screens/ListingDetailScreen.js:399:                <TouchableOpacity onPress={() => listing.seller?.id && navigation.navigate("SellerProfile", {
mobile/src/screens/ListingDetailScreen.js:400:        sellerId: listing.seller.id
mobile/src/screens/ListingDetailScreen.js:401:      })} style={styles.sellerCard} testID="mobile-seller-card">
mobile/src/screens/ListingDetailScreen.js:402:                    <View style={styles.avatar}><Text style={styles.avatarText}>{listing.seller?.name?.[0] || "U"}</Text></View>
mobile/src/screens/ListingDetailScreen.js:403:                    <View style={{
mobile/src/screens/ListingDetailScreen.js:406:                        <Text style={styles.sellerName}>{listing.seller?.name}</Text>
mobile/src/screens/ListingDetailScreen.js:407:                        <Text style={styles.sellerCity}>{listing.city}</Text>
mobile/src/screens/ListingDetailScreen.js:408:                    </View>
mobile/src/screens/ListingDetailScreen.js:409:                    {!isOwner && listing.seller?.id && user && <TouchableOpacity onPress={toggleFollowSeller} style={[styles.followBtn, following && styles.followBtnActive]} testID="mobile-follow-seller-btn">
mobile/src/screens/ListingDetailScreen.js:410:                            <Text style={[styles.followBtnText, following && {
mobile/src/screens/ListingDetailScreen.js:413:                                {following ? t("متابَع") : t("متابعة")}
mobile/src/screens/ListingDetailScreen.js:423:                {/* Permanent, high-visibility "Contact Seller" CTA — owner mandate.
mobile/src/screens/ListingDetailScreen.js:425:                    directly to the in-app chat with full seller + listing payload. */}
mobile/src/screens/ListingDetailScreen.js:426:                {!isOwner && listing.seller?.id && <TouchableOpacity onPress={() => {
mobile/src/screens/ListingDetailScreen.js:433:          to: listing.seller.id,
mobile/src/screens/ListingDetailScreen.js:435:          seller_id: listing.seller.id,
mobile/src/screens/ListingDetailScreen.js:436:          seller_name: listing.seller.name,
mobile/src/screens/ListingDetailScreen.js:439:      }} style={styles.contactSellerBtn} testID="mobile-contact-seller-btn" activeOpacity={0.88}>
mobile/src/screens/ListingDetailScreen.js:441:                    <Text style={styles.contactSellerText}>{t("تواصل مع البائع")}</Text>
mobile/src/screens/ListingDetailScreen.js:444:                {listing.show_phone !== false && listing.seller?.phone_full && !listing.is_demo && <View style={{
mobile/src/screens/ListingDetailScreen.js:457:                    </View>}
mobile/src/screens/ListingDetailScreen.js:459:                {listing.is_demo && <View style={styles.demoBadge}>
mobile/src/screens/ListingDetailScreen.js:461:                    </View>}
mobile/src/screens/ListingDetailScreen.js:463:                <TouchableOpacity onPress={shareAd} style={styles.shareBtn} testID="mobile-share-btn">
mobile/src/screens/ListingDetailScreen.js:464:                    <Share2 size={14} color={theme.colors.primary} />
mobile/src/screens/ListingDetailScreen.js:465:                    <Text style={styles.shareText}>{t("مشاركة الإعلان")}</Text>
mobile/src/screens/ListingDetailScreen.js:468:                {!isOwner && user && listing.price && <TouchableOpacity onPress={() => {
mobile/src/screens/ListingDetailScreen.js:473:        setPriceAlertVal(String(Math.round((listing.price || 0) * 0.9)));
mobile/src/screens/ListingDetailScreen.js:474:        setPriceAlertOpen(true);
mobile/src/screens/ListingDetailScreen.js:475:      }} style={[styles.priceAlertBtn, watching && styles.priceAlertBtnActive]} testID="mobile-price-alert">
mobile/src/screens/ListingDetailScreen.js:477:                        <Text style={[styles.priceAlertText, watching && {
mobile/src/screens/ListingDetailScreen.js:508:                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
mobile/src/screens/ListingDetailScreen.js:509:                            {similar.slice(0, 8).map(s => <View key={s.id} style={{
mobile/src/screens/ListingDetailScreen.js:513:                                    <ListingCard listing={s} />
mobile/src/screens/ListingDetailScreen.js:514:                                </View>)}
mobile/src/screens/ListingDetailScreen.js:515:                        </ScrollView>
mobile/src/screens/ListingDetailScreen.js:517:            </View>
mobile/src/screens/ListingDetailScreen.js:519:            <Modal visible={!!zoomImg} transparent animationType="fade" onRequestClose={() => setZoomImg(null)}>
mobile/src/screens/ListingDetailScreen.js:530:            <Modal visible={show360} transparent animationType="fade" onRequestClose={() => setShow360(false)}>
mobile/src/screens/ListingDetailScreen.js:531:                <Viewer360Mobile images={listing.images || []} onClose={() => setShow360(false)} />
mobile/src/screens/ListingDetailScreen.js:533:        </ScrollView>
mobile/src/screens/ListingDetailScreen.js:536:            For auctions: a single primary "مزايدة" button.
mobile/src/screens/ListingDetailScreen.js:539:        {!isOwner && (isAuction || listing.seller?.id) && (
mobile/src/screens/ListingDetailScreen.js:540:          <View style={[styles.stickyCta, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
mobile/src/screens/ListingDetailScreen.js:541:            {isAuction ? (
mobile/src/screens/ListingDetailScreen.js:545:                  // Navigate to the Auctions screen which hosts the BidSheet
mobile/src/screens/ListingDetailScreen.js:547:                  navigation.navigate("Auctions", { openBidFor: listing.id });
mobile/src/screens/ListingDetailScreen.js:549:                style={styles.stickyBtnAuction}
mobile/src/screens/ListingDetailScreen.js:557:              listing.seller?.id && (
mobile/src/screens/ListingDetailScreen.js:562:                      to: listing.seller.id,
mobile/src/screens/ListingDetailScreen.js:564:                      seller_id: listing.seller.id,
mobile/src/screens/ListingDetailScreen.js:565:                      seller_name: listing.seller.name,
mobile/src/screens/ListingDetailScreen.js:578:          </View>
mobile/src/screens/ListingDetailScreen.js:580:      </View>;
mobile/src/screens/ListingDetailScreen.js:621:  stickyBtnAuction: {
mobile/src/screens/ListingDetailScreen.js:731:  // Permanent "Contact Seller" CTA — primary blue, prominent, with soft shadow.
mobile/src/screens/ListingDetailScreen.js:732:  contactSellerBtn: {
mobile/src/screens/ListingDetailScreen.js:747:  contactSellerText: {
mobile/src/screens/ListingDetailScreen.js:776:  commentComposer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
mobile/src/screens/ListingDetailScreen.js:777:  commentInput: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surfaceElevated, color: theme.colors.text, textAlign: "right" },
mobile/src/screens/ListingDetailScreen.js:778:  commentSubmit: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
mobile/src/screens/ListingDetailScreen.js:779:  commentSubmitText: { color: theme.colors.primaryFg, fontWeight: "900", fontSize: 12 },
mobile/src/screens/ListingDetailScreen.js:780:  commentLogin: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 14, padding: 12, alignItems: "center", marginBottom: 12 },
mobile/src/screens/ListingDetailScreen.js:781:  commentLoginText: { color: theme.colors.primary, fontWeight: "800", fontSize: 13 },
mobile/src/screens/ListingDetailScreen.js:782:  emptyComments: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 14, textAlign: "right" },
mobile/src/screens/ListingDetailScreen.js:783:  commentCard: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 14, padding: 12, marginBottom: 8 },
mobile/src/screens/ListingDetailScreen.js:784:  commentMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 },
mobile/src/screens/ListingDetailScreen.js:785:  commentAuthor: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
mobile/src/screens/ListingDetailScreen.js:786:  commentDate: { color: theme.colors.textMuted, fontSize: 10, marginStart: "auto" },
mobile/src/screens/ListingDetailScreen.js:787:  commentBody: { color: theme.colors.text, fontSize: 13, lineHeight: 20, textAlign: "right" },
mobile/src/screens/ListingDetailScreen.js:788:  priceRow: {
mobile/src/screens/ListingDetailScreen.js:793:  price: {
mobile/src/screens/ListingDetailScreen.js:802:  priceMuted: {
mobile/src/screens/ListingDetailScreen.js:844:  sellerCard: {
mobile/src/screens/ListingDetailScreen.js:867:  sellerName: {
mobile/src/screens/ListingDetailScreen.js:872:  sellerCity: {
mobile/src/screens/ListingDetailScreen.js:891:  shareBtn: {
mobile/src/screens/ListingDetailScreen.js:903:  shareIcon: {
mobile/src/screens/ListingDetailScreen.js:908:  shareText: {
mobile/src/screens/ListingDetailScreen.js:927:  priceAlertBtn: {
mobile/src/screens/ListingDetailScreen.js:939:  priceAlertText: {
mobile/src/screens/ListingDetailScreen.js:1021:  followBtn: {
mobile/src/screens/ListingDetailScreen.js:1027:  followBtnActive: {
mobile/src/screens/ListingDetailScreen.js:1032:  followBtnText: {
mobile/src/screens/ListingDetailScreen.js:1037:  priceAlertBtnActive: {
mobile/src/screens/ListingDetailScreen.js:1055:  priceModalBg: {
mobile/src/screens/ListingDetailScreen.js:1061:  priceModalSheet: {
mobile/src/screens/ListingDetailScreen.js:1066:  priceModalTitle: {
mobile/src/screens/ListingDetailScreen.js:1072:  priceModalSub: {
mobile/src/screens/ListingDetailScreen.js:1079:  priceModalInputWrap: {
mobile/src/screens/ListingDetailScreen.js:1088:  priceModalInput: {
mobile/src/screens/ListingDetailScreen.js:1095:  priceModalCurrency: {
mobile/src/screens/ListingDetailScreen.js:1100:  priceModalBtn: {
mobile/src/screens/ListingDetailScreen.js:1106:  priceModalBtnCancel: {
mobile/src/screens/ListingDetailScreen.js:1111:  priceModalBtnOk: {
mobile/src/screens/ListingDetailScreen.js:1114:  priceModalBtnTextCancel: {
mobile/src/screens/ListingDetailScreen.js:1119:  priceModalBtnTextOk: {
mobile/src/screens/MapScreen.js:2:import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
mobile/src/screens/MapScreen.js:3:import { WebView } from "react-native-webview";
mobile/src/screens/MapScreen.js:12:// Hologram-pin Leaflet map rendered inside a WebView. Works in Expo Go.
mobile/src/screens/MapScreen.js:45:        const perm = await Location.requestForegroundPermissionsAsync();
mobile/src/screens/MapScreen.js:68:    return <View style={styles.center}>
mobile/src/screens/MapScreen.js:71:            </View>;
mobile/src/screens/MapScreen.js:73:  return <SafeAreaView style={styles.wrap}>
mobile/src/screens/MapScreen.js:74:            <View style={styles.header}>
mobile/src/screens/MapScreen.js:77:                <View style={styles.searchRow}>
mobile/src/screens/MapScreen.js:88:                </View>
mobile/src/screens/MapScreen.js:89:            </View>
mobile/src/screens/MapScreen.js:90:            <WebView ref={ref} originWhitelist={["*"]} source={{
mobile/src/screens/MapScreen.js:96:        </SafeAreaView>;
mobile/src/screens/MapScreen.js:112:    price: i.price ? Number(i.price).toLocaleString() : "",
mobile/src/screens/MapScreen.js:126:<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
mobile/src/screens/MapScreen.js:184:  var map = L.map('map').setView([${center.lat}, ${center.lng}], 11);
mobile/src/screens/MapScreen.js:189:    cars: '<polyline points="3 12 5 6 19 6 21 12 21 18 17 18 17 16 7 16 7 18 3 18 3 12"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/>',
mobile/src/screens/MapScreen.js:191:    realestate: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
mobile/src/screens/MapScreen.js:192:    jobs: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
mobile/src/screens/MapScreen.js:198:    auctions: '<path d="M12 2l5 5-7 7-5-5z"/><line x1="14" y1="14" x2="20" y2="20"/>',
mobile/src/screens/MapScreen.js:220:            '<svg class="icon-svg" viewBox="0 0 24 24">' + svg + '</svg>' +
mobile/src/screens/MapScreen.js:226:      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open', id: m.id }));
mobile/src/screens/MoreScreens.js:2: * Search + Category browsing + Notifications + Static pages — bundle of
mobile/src/screens/MoreScreens.js:6:import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
mobile/src/screens/MoreScreens.js:13:import ListingCard from "../components/ListingCard";
mobile/src/screens/MoreScreens.js:21:  removeClippedSubviews: true
mobile/src/screens/MoreScreens.js:53:  if (!cats.length) return <View style={s.center}><Text style={s.muted}>{t("لا توجد تصنيفات")}</Text></View>;
mobile/src/screens/MoreScreens.js:59:  })} style={s.catCard} testID={`mobile-cat-${item.key}`}>
mobile/src/screens/MoreScreens.js:111:  }) => <View style={{
mobile/src/screens/MoreScreens.js:115:            <ListingCard listing={item} onPress={() => navigation?.navigate?.("ListingDetail", {
mobile/src/screens/MoreScreens.js:118:        </View>, [navigation]);
mobile/src/screens/MoreScreens.js:119:  return <View style={[s.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/MoreScreens.js:121:            {loading ? <View style={s.center}><ActivityIndicator color={theme.colors.primary} size="large" /></View> : <FlatList data={items} keyExtractor={item => String(item?.id)} numColumns={2} contentContainerStyle={{
mobile/src/screens/MoreScreens.js:124:    }} renderItem={renderListing} ListEmptyComponent={<View style={{
mobile/src/screens/MoreScreens.js:127:    }}><Text style={s.muted}>{t("لا توجد إعلانات في هذا التصنيف")}</Text></View>} {...FLAT_PERF} />}
mobile/src/screens/MoreScreens.js:128:        </View>;
mobile/src/screens/MoreScreens.js:131:// ---------- NOTIFICATIONS SCREEN ----------
mobile/src/screens/MoreScreens.js:132:export function NotificationsScreen({
mobile/src/screens/MoreScreens.js:142:    api.get("/notifications").then(({
mobile/src/screens/MoreScreens.js:148:      await api.post(`/notifications/${n.id}/read`);
mobile/src/screens/MoreScreens.js:150:    // Owner mandate: tapping a notification MUST navigate to the relevant
mobile/src/screens/MoreScreens.js:154:    // push payload uses) and falls back to type/reference_id heuristics.
mobile/src/screens/MoreScreens.js:157:    // 1) Use the push-payload `url` field if backend included it.
mobile/src/screens/MoreScreens.js:162:        m = url.match(/^\/seller\/([^/?#]+)/);
mobile/src/screens/MoreScreens.js:163:        if (m) { navigation.navigate("SellerProfile", { sellerId: m[1] }); return; }
mobile/src/screens/MoreScreens.js:173:    // 2) Type-based fallback (legacy notifications without `url`).
mobile/src/screens/MoreScreens.js:179:    if (type.startsWith("listing") || type === "price_drop") {
mobile/src/screens/MoreScreens.js:183:    if (type === "auction" || type.startsWith("auction") || type === "bid_outbid") {
mobile/src/screens/MoreScreens.js:186:      navigation.navigate("Auctions");
mobile/src/screens/MoreScreens.js:189:    // 3) Last-resort fallback — if a reference_id looks like a listing UUID,
mobile/src/screens/MoreScreens.js:195:  // Visual icon + tint per notification type — clean baby-blue family.
mobile/src/screens/MoreScreens.js:200:      case "price_alert": return { emoji: "🔔", tint: "#F59E0B" };
mobile/src/screens/MoreScreens.js:207:  if (!user) return <View style={s.center}><Text style={s.muted}>{t("يجب تسجيل الدخول أولاً")}</Text></View>;
mobile/src/screens/MoreScreens.js:208:  if (loading) return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:209:  return <View style={{ flex: 1, backgroundColor: palette.bg }}>
mobile/src/screens/MoreScreens.js:217:                return <TouchableOpacity onPress={() => open(item)} style={[s.notifCard, !item.read && s.notifCardUnread]} testID={`notif-${item.id}`}>
mobile/src/screens/MoreScreens.js:218:                  <View style={[s.notifIconWrap, { backgroundColor: `${tint}22` }]}>
mobile/src/screens/MoreScreens.js:220:                  </View>
mobile/src/screens/MoreScreens.js:221:                  <View style={{ flex: 1, gap: 3 }}>
mobile/src/screens/MoreScreens.js:225:                  </View>
mobile/src/screens/MoreScreens.js:226:                  {!item.read && <View style={s.notifDot} />}
mobile/src/screens/MoreScreens.js:229:              ListEmptyComponent={<View style={{ padding: 60, alignItems: "center" }}>
mobile/src/screens/MoreScreens.js:232:              </View>} />
mobile/src/screens/MoreScreens.js:233:        </View>;
mobile/src/screens/MoreScreens.js:254:  return <ScrollView style={[s.wrap, { backgroundColor: palette.bg }]}>
mobile/src/screens/MoreScreens.js:256:            <View style={s.menu}>
mobile/src/screens/MoreScreens.js:266:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("SavedSearches")}>
mobile/src/screens/MoreScreens.js:269:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Following")}>
mobile/src/screens/MoreScreens.js:275:                <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate("Notifications")}>
mobile/src/screens/MoreScreens.js:298:            </View>
mobile/src/screens/MoreScreens.js:300:            <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
mobile/src/screens/MoreScreens.js:302:                    <View style={s.sheet}>
mobile/src/screens/MoreScreens.js:309:                    </View>
mobile/src/screens/MoreScreens.js:313:            <Modal visible={countryOpen} transparent animationType="fade" onRequestClose={() => setCountryOpen(false)}>
mobile/src/screens/MoreScreens.js:315:                    <View style={s.sheet}>
mobile/src/screens/MoreScreens.js:317:                        <ScrollView style={{ maxHeight: 360 }}>
mobile/src/screens/MoreScreens.js:323:                        </ScrollView>
mobile/src/screens/MoreScreens.js:324:                    </View>
mobile/src/screens/MoreScreens.js:327:        </ScrollView>;
mobile/src/screens/MoreScreens.js:330:// Local fallback used only when the network call fails — keeps UX intact offline.
mobile/src/screens/MoreScreens.js:382:  if (loading) return <View style={{
mobile/src/screens/MoreScreens.js:385:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:386:  return <ScrollView style={[s.wrap, { backgroundColor: palette.bg }]} contentContainerStyle={{
mobile/src/screens/MoreScreens.js:391:        </ScrollView>;
mobile/src/screens/MoreScreens.js:457:  catCard: {
mobile/src/screens/MoreScreens.js:487:  // New card-based notification design — soft shadow + 20 radius + icon avatar.
mobile/src/screens/MoreScreens.js:488:  notifCard: {
mobile/src/screens/MoreScreens.js:493:    backgroundColor: theme.colors.surfaceCard,
mobile/src/screens/MoreScreens.js:496:    ...shadow.card
mobile/src/screens/MoreScreens.js:498:  notifCardUnread: {
mobile/src/screens/MoreScreens.js:578:// ---------- SAVED SEARCHES + FOLLOWING ----------
mobile/src/screens/MoreScreens.js:579:export function SavedSearchesScreen({
mobile/src/screens/MoreScreens.js:589:    api.get("/search/saved").then(({
mobile/src/screens/MoreScreens.js:598:      await api.delete(`/search/saved/${id}`);
mobile/src/screens/MoreScreens.js:602:  if (loading) return <View style={{
mobile/src/screens/MoreScreens.js:605:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:606:  return <View style={{
mobile/src/screens/MoreScreens.js:619:    }) => <View style={s.menuItem}>
mobile/src/screens/MoreScreens.js:632:                        <TouchableOpacity onPress={() => del(item.id)} testID={`saved-del-${item.id}`}>
mobile/src/screens/MoreScreens.js:638:                    </View>} ListEmptyComponent={<View style={{
mobile/src/screens/MoreScreens.js:643:      }}>{t("لا توجد أبحاث محفوظة")}</Text></View>} />
mobile/src/screens/MoreScreens.js:644:        </View>;
mobile/src/screens/MoreScreens.js:646:export function FollowingScreen({
mobile/src/screens/MoreScreens.js:654:    sellers: []
mobile/src/screens/MoreScreens.js:656:  const [sellerMap, setSellerMap] = useState({}); // id -> { name, avatar }
mobile/src/screens/MoreScreens.js:659:    api.get("/following").then(async ({
mobile/src/screens/MoreScreens.js:664:        sellers: []
mobile/src/screens/MoreScreens.js:667:      // Fetch seller details in parallel so we can show real names.
mobile/src/screens/MoreScreens.js:668:      const ids = (d.sellers || []).map(x => x.seller_id).filter(Boolean);
mobile/src/screens/MoreScreens.js:670:        const results = await Promise.all(ids.map(id => api.get(`/sellers/${id}`).then(r => [id, r.data]).catch(() => [id, null])));
mobile/src/screens/MoreScreens.js:678:        setSellerMap(map);
mobile/src/screens/MoreScreens.js:682:  if (loading) return <View style={{
mobile/src/screens/MoreScreens.js:685:  }}><ActivityIndicator color={theme.colors.primary} /></View>;
mobile/src/screens/MoreScreens.js:686:  return <ScrollView style={{
mobile/src/screens/MoreScreens.js:708:    }}>{t("لا يوجد")}</Text> : data.categories.map(c => <View key={c.category} style={s.menuItem}>
