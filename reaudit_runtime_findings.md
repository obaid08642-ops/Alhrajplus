# إعادة التدقيق — أدلة Runtime

## Web `/reels`

تم تشغيل Web build محليًا على نسخة الإنتاج وزيارة `http://localhost:36767/reels`.

النتيجة: المسار يفتح بعد انتهاء splash، ولا يظهر crash أو شاشة بيضاء. الصفحة تعرض حالة فارغة حقيقية: لا توجد فيديوهات، مع زر `Post an ad with video`.

الاستنتاج المؤقت: شكوى عدم فتح الـStories قد تكون مرتبطة بالموبايل أو بالتنقل/البيانات/الترجمة، وليست مثبتة كـroute crash على Web من هذا الاختبار وحده. يجب اختبار زر الانتقال، API response، وMobile route separately.

## ملاحظة baseline

نجح Web production build وExpo web export، لكن هذا لا يثبت أن كل route أو كل interaction أو كل authenticated flow يعمل. ستُعامل هذه الفحوص كـbuild evidence فقط، لا كمعيار جاهزية كامل.

## Mobile Expo Web `/reels`

تم تشغيل Expo web export محليًا وزيارة `http://localhost:4174/reels`. بعد انتهاء spinner، ظهر عنوان `ReelsTab` وحالة `No stories yet` مع CTA `Post Your First Story`.

الاستنتاج: مسار Reels في Mobile bundle قابل للتحميل في بيئة Web. هذا لا يثبت أن زر الـTab يفتح المسار على Android/iOS الفعلي، ولا يثبت أن نشر Story أو تحميل بيانات Story يعمل. يجب اختبار navigation event وPOST workflow وAPI response على جهاز/جلسة.

## Web BottomNav computed runtime

تم فحص الصفحة الرئيسية محليًا عبر DOM/computed styles على `[data-testid="bottom-nav-pill"]`.

النتيجة الحاسمة: عنصر الشريط موجود، لكن `background` الفعلي هو `rgba(0, 0, 0, 0)`، و`border` هو `rgb(225, 231, 239)`، وألوان عناصر التنقل الفعلية `rgb(15, 23, 42)`. هذا يثبت شكوى المستخدم بأن الشريط يظهر شفافًا/أبيضًا؛ class `bg-[var(--primary)]/95` لا ينتج اللون المتوقع في build الحالي. هذه مشكلة فعلية وليست تفضيلًا بصريًا.

كما أن الواجهة الرئيسية في runtime تعرض نصوصًا إنجليزية (`Sell, Buy, Rent, Hire`, `Home`, `Story`, `Chat`, `More`) رغم وجود نظام ترجمة، لذلك يجب اختبار language initialization وtranslation resolution على runtime وليس الاكتفاء بوجود مفاتيح القاموس.

## Web route smoke tests

### `/auctions`

المسار يفتح ويعرض `Live Auctions` وحالة `Active Auctions (0)` مع empty state وأزرار إنشاء المزاد. لا يوجد crash في هذا الاختبار، لكن لا يزال bid flow من إعلان/إشعار/جلسة مستخدم غير مثبت.

### `/map`

المسار يفشل فعليًا في Web build المحلي ويعرض صفحة `حدث خطأ غير متوقع — تعذر تحميل هذه الصفحة` مع زر إعادة المحاولة. هذا عطل مؤكد في route/runtime، ويجب فحص lazy export وLeaflet/import/API أولًا قبل أي تحسين بصري.

## Root cause `/map`

Console runtime سجل:

```text
TypeError: a.map is not a function
[AppErrorBoundary] render failed TypeError: a.map is not a function
```

في `SearchAndMap.js`، `MapPage` ينفذ `setItems(data)` مباشرة من `/listings/map/nearby` ثم يستخدم `items.map(...)` دون التأكد أن `data` مصفوفة. عند تشغيل build المحلي، `BACKEND_URL` فارغ، فيعود طلب API إلى خادم الواجهة/HTML أو response غير متوقع، فتنهار الصفحة بدل عرض حالة خطأ مترجمة. الإصلاح المطلوب مزدوج: ضمان env/runtime backend config، وإضافة response-shape guard وloading/error/empty state في MapPage.

## Web routes failing with AppErrorBoundary

### `/register`

المسار لا يعرض نموذج التسجيل؛ يعرض مباشرة `حدث خطأ غير متوقع / تعذر تحميل هذه الصفحة`.

### `/post`

المسار لا يعرض شاشة إنشاء الإعلان أو الحقول؛ يعرض نفس `AppErrorBoundary`.

هذان عطلان مؤكدان في runtime المحلي، حتى لو نجح build. يجب استخراج console stack لكل route وتحديد هل السبب lazy import أو مكوّن داخلي أو اعتماد API/Context، ثم اختبار guest flow قبل authenticated submit.

## Root cause `/register` and likely `/post`

Console runtime سجل:

```text
TypeError: X.find is not a function
[AppErrorBoundary] render failed TypeError: X.find is not a function
```

`RegisterPage` ينفذ `api.get("/meta/countries").then(({ data }) => setCountries(data))` ثم `countries.find(...)` دون guard. عندما يكون API base فارغًا أو يعيد object/error/HTML بدل array، تنهار الشاشة. `PostListing` يحتوي نمطًا مشابهًا على `categories.find` و`countries.find`، ولذلك يحتاج نفس response-shape validation وحالات API failure بدل اعتماد أن الاستجابة دائمًا array.

### `/deals`

المسار يفشل في Web build المحلي ويعرض AppErrorBoundary. Console سجل `TypeError: a.map is not a function` داخل chunk الخاص بـDealsPage. السبب المرجح هو response غير مصفوفة من `/deals/today` مع غياب guard، ويتطلب التحقق من shape وإظهار error/empty state.

### `/flights`

المسار يفتح ويعرض نموذج رحلة وموفري البحث وروابطهم، لكن هذا لا يثبت أن الروابط تعمل أو أن الحجز داخل النظام منفذ؛ يجب اختبار validation والروابط الخارجية وحالة provider unavailable.
