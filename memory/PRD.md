# PRD — Native Mobile Rebuild & Feature Parity

## Original Problem Statement
Native rebuild of mobile app for 100% UI/feature parity with web app. Strict 2-column Details Box layouts, dynamic cascading dropdowns, conditional logic across 10+ categories.

## Constraints (User-Enforced)
- ❌ NO testing_agent, NO screenshots (extreme low-credit mode).
- ✅ Runtime verification via `expo start --web` + curl + bundle eval ONLY.
- ✅ Communication strictly in Arabic.
- ✅ Phased delivery — STOP after each phase, wait for local owner verification.

## Architecture
- `/app/backend/server.py` — FastAPI monolith (~7600 LOC; refactor FORBIDDEN).
- `/app/frontend/` — React 19 + Tailwind web app.
- `/app/mobile/` — Expo SDK 54 React Native app.
- MongoDB (`MONGO_URL`, `DB_NAME` from `.env`).
- Gemini AI via Emergent LLM Key.

## ✅ Phase 1 — Slim App Bar + RTL + Dropdowns (approved)
- Root cause for huge top space: PostScreen/ChatScreen/SearchScreen rendered TWO headers (React-Navigation Stack header + custom in-screen header) consuming ~25% of screen.
- App.js: `headerShown:false` for Post/Chat/Search. Stack header `height:52`, fontSize:15.
- Custom headers: paddingTop reduced from +6/+8 to +2; fontSize 15→14; minHeight 44.
- RTL tab order (الرئيسية on RIGHT for Arabic).
- Dropdowns centered (not pinned to bottom corner) — CategoryCascades + Jobs/Realestate/Auctions/Animals + CountrySwitcher.
- AuctionsScreen BidModal: missing `useSafeAreaInsets()` crash fix.
- Theme contrast WCAG AA.
- Removed corrupted zero-byte filename `mobile/\x01\x90\xf8@@\xd0\xc39@8` (broke macOS clones).

## ✅ Phase 2 — Phone source + AI + Dial codes (approved)
- Backend: `ListingIn.contact_phone_source` ("account" | "custom"). `/listings/{id}` derives `seller.phone_full` from listing's chosen source. `show_phone=false` strips phone.
- Mobile PostScreen: phone source radio (use registered / use custom) + custom phone TextInput. Dial-coded `contact_phone` built before submit using 30-country map.
- AI button: explicit Alert.alert ActionSheet → Camera or Gallery. Verifies real AI output before claiming success.
- ListingDetail client-side: normalizes legacy `SA501234567` → `+966501234567` (tel: / wa.me).
- Backend `/auth/register` + `/users/me` update: stores `phone_full` with international `+` prefix.
- Verified via curl: SA→+966, EG→+20, custom→stored, hidden→null.

## ✅ Phase 3 — Search/Auctions/Chat/Map/GPS (approved)
- Hook audit AST: 0 violations across entire `src/`.
- Backend `/chat/conversations` returns FLAT `other_id/other_name/other_avatar/other_verified` (mobile ChatScreen reads flat). End-to-end verified: send → list → reply → fetch messages all OK.
- Map hologram: 15 category-specific emoji icons (🚗📱🏠💼🛠️🛋️💻🐪🚜🔨...).
- GPS auto-detect: `Location.getForegroundPermissionsAsync()` never prompts; falls through to IP detect → SA default. No first-launch popup.
- CountrySwitcher modal centered + fade + tap-outside-to-close.
- WebSocket fan-out via `_chat_hub.send_to_user` + mobile `useChatSocket.js`.

## ✅ Phase 4 — Reels polish + New Design System (commit `053a32a`)
### Reels (Stories):
- `snapToInterval` + `snapToAlignment='start'` + `disableIntervalMomentum` + `bounces=false` → TikTok/Shorts smoothness.
- Tab bar auto-hidden on focus, restored on blur (top-level useCallback).
- Side rail wired: Like (favorites API + optimistic toggle), Share (native Share API), Price chip, Location chip.
- `عرض الإعلان` CTA never overlaps bottom nav.

### New Design System (theme.js):
- **Primary**: `#89CFF0` baby blue (logo, headers, dominant icons, holograms, prices). `primaryDeep #2A8CBD` for text-on-light AA contrast.
- **Accent**: `#FF8C00` vibrant orange — RESERVED for the central FAB and small attention dots. Applied in FloatingTabBar gradient + shadow tint + pulse ring + Home hero CTA.
- **Surfaces**: pure white bg + `#F8FAFC` off-white cards.
- **Radius**: unified 16-24 scale; cards = `radius.xl` (24); buttons = pill (999).
- **Shadows**: hard borders REPLACED by tinted soft shadows (`shadow.card`, `shadow.cardLarge`, `shadow.fab`, `shadow.nav`, `shadow.soft`).
- ListingCard + HomeScreen QuickItems migrated to soft shadows (no borderWidth).
- Lucide-react-native icons (already used) — thin strokeWidth across components.

## ✅ Phase 14 — Real min-bid fix + Anti-Snipe + Chat SVG pattern (Feb 2026, current)
**🔥 Root-cause fix for min-bid bypass:**
- Post form saves bid increment under `custom_fields.bid_increment` (NOT `min_increment`). All three layers (`server.py`, `AuctionsPage.js`, `AuctionsScreen.js`) now read `custom_fields.bid_increment` FIRST, with `min_increment`, `auction_meta.*` as legacy fallbacks. A 500 SAR-set auction will now properly reject 1 SAR bids.

**Anti-Snipe (60s extension):**
- `server.py POST /auctions/{id}/bid`: after inserting a valid bid, computes seconds-left from `custom_fields.end_time`. If `0 < seconds_left < 60`, atomically extends `end_time` by 60 seconds and broadcasts `extended_to` in the WS auction event. Wrapped in try/except so any parsing edge case never blocks a valid bid.

**Chat WhatsApp-style product pattern:**
- Owner provided a 20 KB SVG with 44 product icons (cars, phones, tablets, furniture, sports, tools, etc.).
- **Web**: copied to `/app/frontend/public/chat-bg.svg`, applied via `background-image: url("/chat-bg.svg")` on `.hp-chat-messages`. Replaced the legacy inline data-URI pattern (was 3 generic icons).
- **Mobile**: SVG content stored as a JS string at `mobile/src/components/chatBgSvg.js`. `ChatScreen` renders it once via `SvgXml` as an absolute-positioned full-screen layer behind the message list. Background color updated to `#f9f6f1` (matches the SVG's baked bg) so seams are invisible.

**Verification:**
- `expo export` succeeded (4.73 MB bundle, no errors).
- Backend `/api/listings` returns 200.
- Web `/chat-bg.svg` returns 200.
- ESLint clean on all modified files.
- `expo-linear-gradient` import re-verified intact (no crash regression).

## ✅ Phase 13 — Min-bid enforcement + Reactions + Bid CTA wiring (Feb 2026)
**🔥 Critical bid fix (backend + frontend):**
- `server.py POST /auctions/{id}/bid`: now reads `auction_meta.min_increment` (or legacy `min_increment` / `custom_fields.min_increment`) and rejects bids below `current_top + min_increment`. Returns `الحد الأدنى للمزايدة: X (زيادة لا تقل عن Y)`.
- `AuctionsPage.js` (web) + `AuctionsScreen.js` (mobile) `BidDialog/BidModal`: same client-side validation **before** the API call — instant error, no roundtrip. Placeholder shows the correct required amount.

**Reactions feature (backend + web + mobile):**
- `server.py POST /chat/messages/{id}/react` (NEW): one-reaction-per-user-per-message, toggle on repeat, broadcast via existing `_chat_hub.send_to_user` to both participants.
- `ChatPage.js` (web): right-click / long-press shows emoji strip `❤️ 👍 😂 😮 😢 🙏`. Reactions chips render under bubble. WS handler updates list live.
- `ChatScreen.js` (mobile): long-press action sheet now starts with the emoji reactions strip (above Reply/Forward/Copy). Reactions chips render under bubble. `_toggleReactionLocal` helper for optimistic UI. WS subscribe `"reaction"` event updates messages live.

**BidDialog hides BottomNav:**
- `AuctionsPage.js` `BidDialog`: adds `body.ai-panel-open` class on mount → `BottomNav` already observes this and hides itself. Sticky bid button is no longer covered.

**Deep-link from listing → auction bid:**
- Web: `/auctions?openBidFor=ID` auto-opens `BidDialog`.
- Mobile: `AuctionsScreen` reads `route.params.openBidFor` and auto-opens `BidModal` after listings load.

**Verification:**
- `expo export` succeeded (4.73 MB).
- Backend `/api/listings` returns 200.
- ESLint clean on 4 modified files.

## ✅ Phase 12 — Listing/Auction sticky CTA + back button + chat polish (Feb 2026)
**Web:**
- `BottomNav.js`: also hides on `/listing/:id` and `/auctions/:id` (in addition to `/reels` and AI-panel-open). Ensures the page's sticky "تواصل / مزايدة" CTA at the bottom is never obscured.
- `ListingDetail.js`: new sticky bottom CTA bar (`fixed inset-x-0 bottom-0`) — auctions show **"مزايدة الآن"** (orange/accent), regular listings show **"تواصل مع البائع"** (baby-blue). Hidden for the owner. Safe-area aware (`env(safe-area-inset-bottom)`).

**Mobile:**
- `ListingDetailScreen.js`:
  - `useFocusEffect` now hides the floating tab bar (parent + grandparent navigators) while this screen is active. Restored on blur. So the bid/contact CTA below is never covered.
  - New **floating back button** at top-right (RTL aware via `insetInlineEnd`) — high-contrast black pill with `ChevronRight` icon. Works against any image background.
  - New **sticky bottom CTA**: `Gavel` + "مزايدة الآن" for auctions (navigates to `Auctions` with `openBidFor` param), `MessageCircle` + "تواصل مع البائع" for regular listings (passes full payload to `Chat`). Safe-area padding via `useSafeAreaInsets`.
  - Owner sees neither (their owner-bar handles edit/pause/sold).
- `ChatScreen.js`: background changed from WhatsApp tan `#E5DDD5` → brand-aligned baby-blue tint `#F1F7FF`. Chat features verified: forward (✅), reply (✅), voice (✅), image (✅), location (✅), linkified URLs (✅).
  - Note: reactions (emoji react like ❤️/👍) requires backend `reactions` field on chat_messages + a longpress UI — slated as P2.

**Verification:**
- `expo export` succeeded (4.73 MB).
- ESLint clean on 4 files.
- LinearGradient import in ChatScreen confirmed intact (no crash regression).

## ✅ Phase 11 — Crash fix + Open in App + Reels CTAs + OG share (Feb 2026)
**🔥 Crash fix (CRITICAL):**
- `FloatingTabBar.js`: removed leftover `<LinearGradient>` JSX (import was already gone) — was throwing `ReferenceError: Property 'LinearGradient' doesn't exist` and blocking the entire app boot. FAB now uses solid baby-blue per spec; no expo-linear-gradient dependency.

**Open in App banner (web):**
- `SmartAppBanner.js` upgraded: CTA changed from "تحميل من Store" → "افتح في التطبيق" which fires a `harajplus:/<path>` deep-link. If the app isn't installed (page still visible after 1.2s), bounces to the configured store URL. Hidden inside the actual native app (UA token `HarajPlusApp|Expo`).
- Added Smart App Banner meta tags in `public/index.html`: `apple-itunes-app`, `google-play-app`, `twitter:app:*` so iOS Safari shows its native banner too.

**Reels twin-CTA (web + mobile):**
- **Mobile `ReelsScreen.js`**: new `ctaRow` at bottom — "عرض الإعلان" (primary baby-blue) + "تواصل مع البائع" (accent orange). The Contact button navigates to `Chat` with full seller + listing payload.
- **Web `ReelsPage.js`**: same twin-CTA stack — fills the previously-empty bottom whitespace circled in owner's screenshot.

**OG share fix (server-side meta):**
- New backend endpoint `GET /api/og/listing/{id}` (`server.py`) — returns a minimal HTML page with proper `og:title`, `og:description`, `og:image`, twitter cards, schema.org Product JSON-LD, and a `<meta refresh>` redirect to the SPA for real users. Verified via curl: returns 200 with `آيفون 15 برو — 4,500 SAR | الحراج بلس`. Solves WhatsApp/Twitter/Facebook crawler previews when sharing listings.

**Verification:**
- `expo export` succeeded (4.73 MB).
- Backend OG endpoint tested via curl → 200 + correct og:* tags.
- ESLint clean on 4 mobile/web files.

## ✅ Phase 10 — Chat scroll fix + Deep-links + Auto-link URLs + Download App card (Feb 2026)
**Critical chat fix:**
- `chat.css`: removed `scroll-behavior: smooth` from `.hp-chat-messages` (was animating every micro-shift triggered by WS `presence`/`read` events). Added `overflow-anchor: none` to disable browser anchor jumping.
- `ChatPage.js`: dropped the `visualViewport.scroll` listener that was repeatedly resetting `--hp-vh` and forcing re-layout — kept only `resize` (for keyboard open/close).

**Auto-link URLs in messages (web + mobile):**
- `ChatPage.js`: new `linkify(text)` helper detects http(s) URLs and emits internal `<Link>` (same-origin → SPA routing, never reloads) or `<a target="_blank">` for external links — listing URLs auto-pasted in chat now work.
- `ChatScreen.js`: mirror `renderLinkedText()` for native — taps call `Linking.openURL`.

**Notification deep-linking parity (mobile):**
- `MoreScreens.js / NotificationsScreen`: route handler now reads `notification.data.sender_id` (chat) or `data.listing_id` (listing) — mirrors web `urlFor()`. Still falls back to legacy `reference_id`.

**Download App card:**
- **Web `ProfilePage.js`**: new `DownloadAppCard` component below the menu. Auto-detects platform via `detectPlatform()`. Mobile users see their matching store as a big primary CTA; others as smaller secondary tiles. Desktop users see a balanced 3-column grid. Each tile opens `STORE_URLS[key]` and shows "قريباً" + greyed-out state if URL is empty.
- **Mobile `ProfileScreen.js`**: `DownloadAppCardMobile` — same logic; reads store URLs from `Constants.expoConfig.extra.appStoreUrl / playStoreUrl / appGalleryUrl`. Uses `Linking.openURL`.

**Mobile parity audit — gaps surfaced (P2 backlog):**
- Mobile Profile lacks: wallet quick-access tile, referral copy-button polish (present but minimal), premium-locked banner.
- Mobile chat lacks: in-line listing context card at top of thread (web shows the listing card; mobile only shows listing_id in the message).
- Mobile lacks dedicated `/about`, `/terms`, `/privacy`, `/contact` static-page rendering parity (currently navigated via slug param but not styled).
- Mobile has no `/deals` page parity (DealsScreen exists but not wired to the new theme).
- Mobile push-notifications click handler needs to feed into the same `NotificationsScreen.open()` routing.

## ✅ Phase 9 — Web Reels/AI overlap + Mobile AI FAB + Mobile lang/dark toggles (Feb 2026)
**Web fixes:**
- `BottomNav.js`: now hides itself on `/reels/*` AND when the AI Assistant panel is open (detected via `MutationObserver` on `document.body.classList`). Eliminates the floating `+` overlapping the AI chat input and the bottom pill obscuring full-screen reels.
- `AIAssistantWidget.js`: on `open` toggle, adds/removes `body.ai-panel-open` class so global UI (`BottomNav`) can react reliably.

**Mobile additions:**
- **`AIAssistantFab.js`** (NEW): draggable AI assistant FAB rendered globally via `App.js`. Smooth `PanResponder` + `Animated.ValueXY` (no per-frame re-render). Snaps to nearest horizontal edge on release, persists position to `AsyncStorage`. Close (`×`) button hides it. Tap (negligible movement) → navigates to `AIAssistant`. Hides automatically on `AIAssistant`, `ReelsTab`, `Login`, `Register`, `Chat` routes.
- **`HomeScreen.js TopBar`**: added Globe + Moon/Sun buttons (right side, before NotificationBell). Globe opens a centered fade language picker (6 languages). Dark-mode button persists preference (full theme propagation is P2).

## ✅ Phase 7 — Login Navigation Bug + Auth Header + Map Pings + New Tab Bar (Feb 2026, current)
**Critical login fix:**
- **AuthScreens.js**: After password login, social OAuth, biometric login, or fresh registration → `navigation.reset({ index:0, routes:[{name:"Main"}] })`. Also added a `useEffect` that watches `user` state from `AuthContext`; if it ever becomes truthy while sitting on Login/Register (e.g., social deep-link comes back later), auto-navigate to Main. This eliminates the "logged in but stuck on login screen" bug across email, Google, Snapchat, X, Apple, biometric.
- Verified via backend `/auth/register` returns `{access_token, refresh_token, user}` → mobile client now properly leaves the auth stack.

**Auth header (Login + Register):**
- New `AuthHeader` component renders at top of both screens. RIGHT side: `← الرئيسية` button → resets to Main. LEFT side: language pill `🌐 العربية 🇸🇦` opens a centered fade modal with all 6 supported languages, persists via I18nContext.

**MapScreen markers redesign:**
- Removed emoji + price chip + stem. New design: **concentric pulsing rings** (3 layers, staggered animation-delay 0/0.5/1.0s) around a white core that holds a lucide-style SVG icon. Two families — `.blue` (primary `#89CFF0` rings, orange-stroked icon) and `.orange` (accent `#FF8C00` rings) — alternated every third pin so featured listings stand out. Matches owner's image #2 exactly.

**FloatingTabBar — new layout (image #3):**
- Pill background changed from frosted blue to **pure white** `#FFFFFF` with rounded 28 corners.
- Tab #2 (was Reels/`Film` icon) → relabeled `المزيد` with `MoreHorizontal` (…) icon (route still navigates to ReelsScreen for stories).
- FAB redesigned: solid **baby-blue** `#89CFF0` circle (68×68), 3px white ring, baby-blue glow shadow, soft halo `rgba(137,207,240,0.14)`. Inside: `+` icon + "أنشئ إعلان" label, matching reference.
- Pulse ring tint switched from orange → baby-blue.

**Validation**: `expo export --platform web` succeeded — 4.72 MB. ESLint clean. Backend `/api/auth/register` returns valid token (curl-tested).


- **ChatScreen bubbles**: outgoing bubble migrated from WhatsApp green `#075E54` → branded baby-blue `#5FB6E0`. Padding/radius bumped (radius 18, padding 12×8) for breathing room. Voice play button inverts to white-on-blue when message is mine. Forward badge tinted `rgba(137,207,240,0.18)` with primaryDeep text, aligned to start (no longer overlapping reply preview).
- **SearchScreen**: search pill, filter button, suggestion box, chips, tags, price inputs all migrated from `borderWidth:1` borders to `shadow.card` + `borderRadius:20`. Search input now RTL-aligned. Active filter chips use primary-tinted soft pill without border. Filter icon button is square-rounded 44×44.
- **NotificationsScreen**: rebuilt from flat list rows → soft-shadow cards with circular tinted icon avatar, page title, timestamp, and orange unread dot. Empty state has emoji + caption.
- **ReelsScreen**: useFocusEffect now hides BOTH the bottom tab bar AND any parent header (incl. grandparent stack), restored on blur. Reel overlay paddings normalized (top:50, bottom:24). Bottom title/price/CTA get `paddingEnd:76` to never collide with the right-side action rail. Side rail bottom raised to 150, gap 22, fixed-width sideBtn(56) keeps icons/text vertically aligned. Price pill width fixed to 64. CTA radius now 20 with baby-blue glow.

## ✅ Phase 5 — Runtime Layout Overhaul (Feb 2026)
- **FloatingTabBar**: FAB rebuilt as freestanding circular button with outer translucent halo (`rgba(255,140,0,0.10)`) wrapping the gradient core (`#FFB04A → #FF8C00`), white 3px ring, orange-tinted shadow.
- **HomeScreen TopBar**: `CountrySwitcher` REMOVED from global header (now exclusive to `SettingsScreen`). Added "حراج بلس" brand title row above the search pill. Search box, category items, empty state all migrated from borderWidth to soft `shadow.card` + `borderRadius: 20`.
- **ListingCard**: explicit `borderRadius: 20` (replaces `radius.xl=24`). Borders already absent — only soft shadow.
- **ListingDetailScreen**: Permanent "تواصل مع البائع" CTA injected at top of body, no longer gated by `show_phone`. Navigates to `Chat` with payload `{ to, listing_id, seller_id, seller_name, listing }`.
- **ChatScreen**: Strict null-guard `m?.reply_to ?? null` on quoted-reply renderer (prevents `Property 'replyTo' doesn't exist` crash).
- **Modals**: Both `CountrySwitcher` and Settings (`MoreScreens`) modals now use centered fade modal with `rgba(0,0,0,0.40)` backdrop + `borderRadius: 20` + baby-blue tinted shadow. No more full-screen slide-ups.
- **Validation**: `expo export --platform web` succeeded — 3038 modules, 4.71 MB bundle, no errors. Backend `/meta/categories` and `/listings` return `200`.


## ✅ Phase 17 — Tab Bar Flush + Image Search + Brand Name + Chat Auto-Send (Feb 2026)
- **FloatingTabBar**: `paddingBottom` reduced from `Math.max(insets.bottom, 10)` → `insets.bottom`. FAB `bottom` from 30 → 22. Bar now sits flush at screen bottom with NO extra gap (mirrors owner mockup).
- **App Brand Name**: `HomeScreen.TopBar` brand title fixed from `"حراج بلس"` → **`"الحراج بلس"`** (matches `app.json`).
- **Image Search in Top Header (parity with web)**: `HomeScreen.TopBar` now renders a `Camera` icon inside the search pill (`testID="home-image-search-btn"`). Tap → Alert action sheet (الكاميرا / المعرض) → `ImagePicker` (`base64: true`) → `POST /api/ai/image-search` → navigate to `Search` with returned Arabic `q` param. Re-uses existing backend Gemini endpoint (no backend changes).
- **Chat Auto-Send Listing Context**: `ChatThread` now fires a one-shot `useEffect` after history loads. Detects mount-time `listing` prop (passed from "تواصل مع البائع" CTA) and posts `/chat/send` with `{listing_id, text: "مرحباً، أنا مهتم بإعلانك: <title> (<price> <currency>)\nhttps://alhrajplus.com/listing/<id>"}`. Guarded by `autoSentRef` + history scan (idempotent across re-opens — never duplicates).
- **Validation**: `npx expo export --platform web` → 3040 modules, 4.76 MB, no errors. ESLint clean across `HomeScreen.js`, `ChatScreen.js`, `FloatingTabBar.js`. Backend `/api/ai/image-search` responds correctly (400 on invalid input as designed).


## Future / Out-of-scope
- Voice messages in chat (record/send/playback).
- Chat "Forward Message".

## ✅ Phase 18 — Primary color overhaul + Chat fix + Search crash + Dark mode toggle (Feb 2026)
- **Primary color → #4FB6E6** (web parity, was `#89CFF0`). Updated `theme.js` (`primary`, `primaryHover #2196D9`, `primaryFg #FFFFFF`, `navActive #FFFFFF`, `navInactive rgba(255,255,255,0.72)`, `navBg #4FB6E6`, card-shadow tint).
- **FloatingTabBar**: entire pill background → `colors.primary` (full primary blue). Active tab gets translucent white pill; inactive tab text/icon = white 72% opacity. FAB kept vibrant orange `#FF8C00` (per user directive) with orange halo + pulse ring. Tab label "المزيد" → **"قصص"** with Film icon (mirrors web Stories/Reels).
- **HomeScreen TopBar**: full LinearGradient `primary → primaryHover` covering brand row + search pill region. White text/icons on gradient. Search box bg = pure white (high contrast). AI bot pill bg = white with primary icon.
- **ChatScreen — "Contact Seller" flash fix**: lazy `useState` initializer now seeds `activeOther`/`activeConvoId` synchronously from `route.params` so the thread renders IMMEDIATELY when arriving from a listing's "تواصل مع البائع" CTA. Previously the convo list flashed for ~1 frame before the useEffect populated state, which the user perceived as "opens chat home instead of the thread". The async enrichment effect remains (fetches `/users/{id}` to fill avatar/verified).
- **SearchScreen + ChatScreen voice mic crash fix**: `expo-audio` v1.1.1 dropped the top-level `AudioModule`/`AudioRecorder` named exports — code was calling `AudioModule.requestRecordingPermissionsAsync()` on `undefined`. Replaced with the documented top-level functions `requestRecordingPermissionsAsync` / `setAudioModeAsync` + grabbed the native `AudioRecorder` constructor via `import AudioModuleDefault from "expo-audio/build/AudioModule"`. Added a defensive `if (!AudioRecorder) return` guard so the screen never throws if the native module is unavailable (e.g. on web).
- **Dark mode activation**: new `/app/mobile/src/ThemeContext.js` providing `{ isDark, palette, toggle }`. `App.js` wraps tree with `ThemeModeProvider`. Top-bar Moon/Sun button now flips global state + persists via AsyncStorage (`hp_dark_mode`). `HomeScreen` root bg + StatusBar barStyle react live. Other screens to be migrated incrementally.
- **Validation**: `npx expo export --platform web` → 3040 modules, 4.76 MB, no errors. ESLint clean across all 5 modified files (`theme.js`, `FloatingTabBar.js`, `HomeScreen.js`, `ChatScreen.js`, `SearchScreen.js`, new `ThemeContext.js`, `App.js`). Backend `/api/deals/today` returns 200 (deals route healthy).

- Market-based AI pricing (external scraping).
- AR Try-On, Escrow, WebRTC calls, Blockchain badges.

## Test Credentials
See `/app/memory/test_credentials.md`.


## ✅ Phase 19 — Critical fixes: Vercel build + Chat replyTo crash + Dark mode propagation (Feb 2026)
- **🛑 BLOCKER — Vercel build failure**: `Module not found: '/chat-bg.svg' in src/styles`. Root cause: `chat.css` referenced the asset via absolute public path `url("/chat-bg.svg")` which CRA+webpack's css-loader could not resolve under Vercel's stricter mode. Copied the SVG into `src/styles/chat-bg.svg` and switched to `url("./chat-bg.svg")`. `yarn build` now exits 0 (verified locally).
- **🛑 BLOCKER — ChatScreen Render Error**: `Property 'replyTo' doesn't exist` at line 805. The `replyTo`/`setReplyTo` symbols were referenced 6+ times inside `ChatThread` but the `useState` declaration was missing. Added `const [replyTo, setReplyTo] = useState(null);` next to the other ChatThread states. Composer reply-preview, long-press "reply" action, and the sendText snapshot all now resolve cleanly.
- **🌙 Dark mode propagation**: extended `useThemeMode().palette` consumption to the major screens:
  - `ChatScreen` (convo list View bg + StatusBar barStyle).
  - `SearchScreen` (root View bg + StatusBar barStyle).
  - `ProfileScreen` (guest & authed root View bg).
  - `MoreScreens.NotificationsScreen` (root bg uses palette).
  - `OtherScreens.FavoritesScreen / MyListingsScreen / DealsScreen` (root bg + title color).
- **Validation**: `yarn build` (frontend) → exits 0, build folder ready. `npx expo export --platform web` → 3040 modules, no errors. ESLint clean across all 7 modified files.


## ✅ Phase 20 — New Tab Bar (U-notch + lime FAB) + WhatsApp-fixed chat BG (Feb 2026)
- **🎨 FloatingTabBar — complete rebuild to match owner's mockup (IMG_2738)**:
  - **U-shaped concave notch** in the center of the bar — drawn via SVG `<Path>` (`react-native-svg`). Notch radius 40px, bar height 72px, corner radius 26px.
  - **Vertical lime-green capsule FAB** (`#B5E61D`, 72×96 → renders as a tall pill via `borderRadius: 999`). White 2px ring + soft white halo wrapper + lime-tinted pulse ring. FAB label = **"أضف إعلان"** (white-on-lime, 10px, weight 900).
  - **Full-bleed bar** touches the screen's left/right edges (no side margin) so it doesn't appear "raised" anymore. `paddingBottom: insets.bottom` only.
  - **Tab labels (RTL)**: الرئيسية | قصص | [+] | رسائلي | حسابي. Inactive = white at 78% opacity; active = pure white + bold.
  - **Dark-mode aware**: bar surface flips from sky-blue (`#4FB6E6`) to deep navy (`#0F1B3A`) when the user toggles dark mode via the home Moon/Sun button. Default is light.
- **HomeScreen TopBar — dark-mode aware**: top gradient now flips from `[primary, primaryHover]` to `["#0F1B3A", "#152244"]` when dark mode is on.
- **💬 Chat background — WhatsApp-style FIXED**: the SVG product-pattern bg used to be a sibling of the `FlatList` *inside* the messages container, which (on iOS+KeyboardAvoidingView resize) caused it to repaint and visually shift. Lifted the bg layer to be the FIRST `absoluteFillObject` child of the outer `KeyboardAvoidingView` — now it sits truly behind the header, messages, and composer. No more bg movement on scroll. Removed the redundant inner bg layer.
- **Validation**: `npx expo export --platform web` → 3041 modules (one new file: rebuilt `FloatingTabBar.js`), 4.76 MB, no errors. ESLint clean on `FloatingTabBar.js`, `ChatScreen.js`, `HomeScreen.js`. Backend `/api/ai/image-search` healthy (HTTP 400 on invalid input as designed).

## ✅ Phase 21 — Tab Bar revision 2 + visibility rules + Map embed (Feb 2026)
- **🎨 FloatingTabBar — second revision** per owner verbal spec:
  - **Flush to screen bottom**: removed `paddingBottom: insets.bottom`; instead the SVG bar shape now extends through the safe inset (`totalH = BAR_HEIGHT + insets.bottom`) so the surface colour reaches the true screen edge with zero white margin.
  - **Slimmer bar**: `BAR_HEIGHT` 72 → **48 px** (content), no rounded corners (full-bleed).
  - **Deeper U-notch**: `NOTCH_RADIUS` 40 → **38** (semicircle: width 76, depth 38 ≈ 79% of bar height). Bar's bottom strip (~10 px / 21%) stays solid blue under the FAB.
  - **FAB capsule** `60×84` (was 72×96) with `FAB_SUBMERGE = 22` → ~74% of FAB sits ABOVE the bar, ~26% inside the notch leaving a small **visible transparent gap** between the capsule's curved bottom and the notch arc (screen content shows through).
  - Lime glow + pulse ring retained.
- **🚫 Tab bar visibility rules (owner mandate)**:
  - `Reels/Stories`: already hidden via `useFocusEffect → tabBarStyle: {display:'none'}` in ReelsScreen.
  - `Chat thread inside ChatTab`: NEW — added `useEffect` in ChatScreen that toggles `parent.setOptions({ tabBarStyle: {display:'none'} })` whenever `activeConvoId && activeOther` are set, restoring on unmount. Solves the "tab bar shows over a 1:1 chat" flicker.
  - `ListingDetail / Stack Chat`: already hidden by Stack covering the tabs.
- **🗺️ Map needs tab bar** — but Map is a Stack screen (not inside Tab navigator). Created a NEW component `/app/mobile/src/components/StandaloneFloatingTabBar.js` (identical visual to FloatingTabBar) that uses `useNavigation()` to navigate to tabs via `nav.navigate("Main", {screen: tabName})`. Rendered at the bottom of `MapScreen` so the bar appears persistently on Map.
- **Validation**: `npx expo export --platform web` → 3043 modules (new file), no errors. ESLint clean on all 4 modified files (`FloatingTabBar.js`, `StandaloneFloatingTabBar.js`, `ChatScreen.js`, `MapScreen.js`).


## ✅ Phase 22 — Reels UX + Map search + Voice playback + Post camera-video + FAB haptic + Dark-mode expansion (Feb 2026)
- **🎥 Reels (Stories) UX fixes**:
  - **Default = NOT muted** (`muted` initial state flipped from `true` → `false`). Player `p.muted = false` on init.
  - **Mute button moved DOWN** — removed from the topBar, now absolute-positioned at `top: 110, right: 16` so it sits below the safe-area without overlapping brand text.
  - **Tap on video = pause/play** (NOT navigate to listing). Added `userPaused` local state; `onTapVideo` toggles it. The auto-play-when-active effect now respects `userPaused`. Tapping the play overlay icon also shows when paused. Listing detail is still reachable via the explicit "فتح الإعلان" CTA below.
- **🗺️ Map search bar**: added a search row at the top of MapScreen with a debounced (350ms) call to `/api/listings/map/nearby?q=...`. Listings update on the map live as the user types.
- **🎙️ Voice notes playback fix**: iOS records in earpiece-route mode (`allowsRecording: true`) — when the recording stops, the audio session needs to be switched back to playback (`allowsRecording: false, playsInSilentMode: true`) or `useAudioPlayer` plays silently. Added `setAudioModeAsync` call (a) once on ChatScreen mount, and (b) immediately after `recording.stop()`.
- **📸 Post camera supports VIDEO**: `takePhoto` now opens an Alert action sheet (صورة / فيديو / إلغاء). The video branch calls `launchCameraAsync({ mediaTypes: Videos, videoMaxDuration: 60 })` and routes through a new shared `uploadVideoAsset` helper (also reused by the gallery `pickVideo`).
- **🟢 FAB haptic + lime-burst animation**: added `expo-haptics@56.0.3`. On FAB press: `Haptics.impactAsync(Medium)` + spring-scale + a **burst ring** (lime border, scales 0.7→2.2, fades over 520 ms). Applied to BOTH `FloatingTabBar` and `StandaloneFloatingTabBar` for parity.
- **🌙 Dark-mode propagation (Phase 22 batch)**: added `useThemeMode().palette` inline overrides on root containers of:
  - `ListingDetailScreen` (root View bg)
  - `PostScreen` (root KeyboardAvoidingView bg)
  - `AuctionsScreen` (root ScrollView bg)
  - `AuthScreens.LoginScreen` + `RegisterScreen` (root KeyboardAvoidingView bg)
- **Validation**: `npx expo export --platform web` → 3050 modules (new haptics + standalone bar), no errors. ESLint clean across all 9 modified files.



## ✅ Phase 23 — Dark mode finalization across remaining screens (Feb 2026)
- **Local install error**: user reported `"expo-haptics" is added as a dependency but doesn't seem to be installed`. Expected when pulling fresh — solution: `yarn install` (or `npm install`) locally then `npx expo start -c`. Dependency correctly listed in `package.json` + `yarn.lock`.
- **🌙 Dark-mode expanded** to all remaining screens via `useThemeMode().palette` inline overrides on root containers:
  - `AIAssistantScreen`, `FlightsScreen`, `WalletScreen`, `SellerProfile`
  - `MoreScreens.SettingsScreen` (+ NEW dark-mode toggle menu item at top with ☀️/🌙 icon and persisted state)
  - `MoreScreens.CategoryListingsScreen`, `StaticPageScreen`, `SavedSearchesScreen`, `FollowingScreen`, `NotifSettingsScreen`
- **Fixed pre-existing syntax fragment** in `WalletScreen.js` (stray `});,` at end of file).
- **Validation**: `npx expo export --platform web` → 3050 modules, no errors. ESLint clean across all 6 modified files.

## ✅ Phase 24 — Map crash hardening + Tab bar revision 3 (slimmer + true cut-through notch + visible gap) (Feb 2026)
- **🗺️ Map crash fix**: MapScreen now hardened against any failure path:
  - Renamed the inner `setTimeout` variable from `t` (which shadowed the i18n `t`) to `tid`.
  - Wrapped `buildHtml(items, myPos)` in try/catch — never throws to the renderer.
  - `setLoading(false)` now in a `finally` block so the screen NEVER stays in the loading spinner forever if the network fails.
  - `setItems(Array.isArray(data) ? data : [])` defensively guards against unexpected backend shapes.
  - Added an `err` state for debugging (not surfaced as a fatal modal yet).
- **🎨 Tab bar revision 3 (owner spec)**:
  - **Slimmer bar**: `BAR_HEIGHT` 48 → **42 px** ("نقلل ارتفاعه ملي أو ملي ونص").
  - **Smaller FAB capsule**: `FAB_W` 60 → **56**, `FAB_H` 84 → **80**. This makes the FAB strictly smaller than the notch (38 × 2 = 76 diameter), creating a visible transparent gap on every side.
  - **Deeper notch + visible gap**: `NOTCH_RADIUS = 38` on a 42-px bar → notch cuts almost all the way through (leaves a 4-px solid blue strip at the bottom). `FAB_SUBMERGE = 30` → FAB bottom sits 8 px above the notch's lowest point, creating a **visible transparent gap** between the FAB capsule's curved bottom and the notch curve (screen content shows through).
  - **Pulse + Burst rings → border-only** (no opaque fill) so the transparent gap stays truly transparent during the animation; only the lime border traces around.
  - **Tab labels** font 10.5 → 9.5 px, icons 20 → 18 px to fit the slimmer bar.
  - Applied identically to both `FloatingTabBar.js` AND `StandaloneFloatingTabBar.js` (Map).
- **Validation**: `npx expo export --platform web` → 3050 modules, no errors. ESLint clean on 3 modified files (`FloatingTabBar.js`, `StandaloneFloatingTabBar.js`, `MapScreen.js`).



## ✅ Phase 25 — Map crash fix (burstScale undefined) + Map search-hit highlight (Feb 2026)
- **🛑 BLOCKER fix — Map crash**: `ReferenceError: Property 'burstScale' doesn't exist` in `StandaloneFloatingTabBar.js`. The JSX referenced `burstScale`/`burstOpacity` (lime burst ring) but the interpolated values were never defined in the component scope. Added them with the missing `Haptics.impactAsync` + `burst.setValue/Animated.timing` block. Map screen now opens.
- **🟢 Map search-matched glow** (owner directive: "النتائج علي الخريطة تتوهج بشكل اكبر او تتلون بلون مختلف"):
  - New `lime` marker family in the WebView CSS: rings border `#B5E61D` width 3 px + core bg lime + `box-shadow: 0 0 24px rgba(181,230,29,0.9)`.
  - Marker size when matched: **110×110** (was 80×80) → ~38% bigger.
  - Ring radii r1/r2/r3 = 48/76/104 px (was 36/56/76).
  - Icon stroke flips from orange to `#0F2A1B` so it reads on lime.
  - Detection: `m.matched = !!query && (title or category includes query, lowercased)`.
  - Non-matched items keep the original blue/orange alternation.
- **Validation**: `npx expo export --platform web` → 3050 modules, no errors. ESLint clean on both modified files.

## ✅ Phase 26 — Reels: tab bar fully hidden + visible exit button + video stops on leave (Feb 2026)
- **🚫 Tab bar completely hidden on Reels** (owner mandate — was sometimes flickering back). Now hides on BOTH the parent Tab navigator AND its grandparent Stack via `nav.getParent()?.getParent()?.setOptions({tabBarStyle:{display:'none'}})`. Restored on blur for both levels.
- **❌ Exit (X) button highly visible** (was semi-transparent black, invisible on dark videos):
  - Background `rgba(0,0,0,0.55)` → **solid red `#EF4444`** + white 2 px border.
  - Size 40×40 → **44×44**.
  - X icon stroke 2.6 → **3** + size 20 → 22.
  - Added soft black shadow (radius 8, opacity 0.45) so it pops against any video background.
- **⏸ Video stops on screen unfocus** (owner mandate — was looping forever after leaving Reels):
  - Added `useIsFocused()` to `ReelItem`.
  - Play condition tightened: `isFocused && active && !userPaused` — pauses immediately on tab switch, X press, or navigation to ListingDetail.
  - Added unmount cleanup that calls `player.pause()` so audio stops if the list re-renders or the screen tears down.
- **Validation**: `npx expo export --platform web` → 3050 modules, no errors. ESLint clean on `ReelsScreen.js`.

