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

## ✅ Phase 5 — Runtime Layout Overhaul (Feb 2026, current)
- **Theme**: `shadow.card` now matches owner spec exactly — `#89CFF0` tint, offset `{0,4}`, opacity `0.06`, radius `12`, elevation `3`.
- **FloatingTabBar**: FAB rebuilt as freestanding circular button with outer translucent halo (`rgba(255,140,0,0.10)`) wrapping the gradient core (`#FFB04A → #FF8C00`), white 3px ring, orange-tinted shadow.
- **HomeScreen TopBar**: `CountrySwitcher` REMOVED from global header (now exclusive to `SettingsScreen`). Added "حراج بلس" brand title row above the search pill. Search box, category items, empty state all migrated from borderWidth to soft `shadow.card` + `borderRadius: 20`.
- **ListingCard**: explicit `borderRadius: 20` (replaces `radius.xl=24`). Borders already absent — only soft shadow.
- **ListingDetailScreen**: Permanent "تواصل مع البائع" CTA injected at top of body, no longer gated by `show_phone`. Navigates to `Chat` with payload `{ to, listing_id, seller_id, seller_name, listing }`.
- **ChatScreen**: Strict null-guard `m?.reply_to ?? null` on quoted-reply renderer (prevents `Property 'replyTo' doesn't exist` crash).
- **Modals**: Both `CountrySwitcher` and Settings (`MoreScreens`) modals now use centered fade modal with `rgba(0,0,0,0.40)` backdrop + `borderRadius: 20` + baby-blue tinted shadow. No more full-screen slide-ups.
- **Validation**: `expo export --platform web` succeeded — 3038 modules, 4.71 MB bundle, no errors. Backend `/meta/categories` and `/listings` return `200`.


## Future / Out-of-scope
- Voice messages in chat (record/send/playback).
- Chat "Forward Message".
- Market-based AI pricing (external scraping).
- AR Try-On, Escrow, WebRTC calls, Blockchain badges.

## Test Credentials
See `/app/memory/test_credentials.md`.
