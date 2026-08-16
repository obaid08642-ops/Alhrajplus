# Button, Icon, and Emoji Inventory

## Baseline counts

| Scope | Count | Meaning |
|---|---:|---|
| Web clickable candidates | 399 | button/a/Link/onClick and component candidates؛ تحتاج تصنيفًا وظيفيًا |
| Mobile clickable candidates | 296 | TouchableOpacity/Pressable/Button/onPress candidates |
| Source emoji candidates | 231 | خارج ملف الترجمة؛ تشمل UI icons، رسائل chat protocols، comments، وحقول بيانات |

## Required classification

### A. يجب تحويله إلى Vector Premium

يشمل أي Emoji يستخدم كعنوان قسم أو زر أو badge أو أيقونة تنقل أو حالة بصرية: `HomePage` quick links، `ListingDetail` 3D/bid/directions، `PostListing` category choices، `ProfilePage` stats/actions، `ReelsPage` empty state، `DealsPage` deal badge، `FlightsPage` provider cards، `CountryPicker` و`CitySelect`، و`AdminPage` action labels.

سيتم استخدام `lucide-react` على Web و`lucide-react-native` على Mobile، مع مكوّنات مشتركة أو mapping موحد للأسماء، وبدون Unicode emoji داخل عناصر التحكم.

### B. يجب تحويله إلى Vector مع الحفاظ على semantics

يشمل location، map، camera، microphone، image، voice، attachment، share، link، bell، auction hammer، verified، calendar، phone، eye، mouse/click، plane، home، job، service، vehicle، furniture، animal، tools.

### C. ليس زرًا ويحتاج فصلًا عن النص

رموز chat مثل صورة/صوت/موقع، reactions، وemoji التي يكتبها المستخدم. لا ينبغي تغيير محتوى رسالة المستخدم تلقائيًا، لكن يجب أن يكون renderer قادرًا على عرض attachments عبر أيقونات Vector، مع إبقاء reaction picker كميزة مستقلة إن كانت مطلوبة.

### D. يحتاج مراجعة ترجمة لا استبدالًا بصريًا فقط

أي key ترجمة يحتوي emoji مثل `صفقات اليوم` أو `وظائف` أو `خدمات` أو `الموقع`. يجب فصل label عن icon في البيانات، بحيث تصبح الترجمة نصًا نظيفًا، والأيقونة component مستقلًا.

## Interaction audit requirements

كل زر أو عنصر قابل للنقر يجب أن يملك: action حقيقي، loading/disabled state، pressed/hover/focus state، accessibility label، اختبار RTL/LTR، واختبار غياب الصلاحية أو غياب الرابط. ستُراجع خصوصًا الأزرار التي تنفذ `alert()` فقط، أو تظهر `قريباً`، أو تستخدم placeholder URL، أو لا تملك handler.

## First high-impact replacement batch

1. Home quick-link icons: deals, auctions, reels, map.
2. ListingDetail: 3D, directions, bid.
3. ProfilePage: stats and phone visibility.
4. ReelsPage empty state and video controls.
5. PostListing category/detail headers.
6. Flights provider cards.
7. Country/city/map controls.
8. Admin action/status badges.

لا يتم حذف Emoji من بيانات chat أو user-generated content آليًا. يتم تغيير العرض فقط عندما يكون الرمز جزءًا من واجهة النظام.
