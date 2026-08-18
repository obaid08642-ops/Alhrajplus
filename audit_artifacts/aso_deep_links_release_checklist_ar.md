# قائمة جاهزية ASO والروابط العميقة لتطبيق الحراج بلس

## الحالة التقنية الحالية

يستخدم التطبيق scheme داخليًا باسم `harajplus`، ويحتوي على خريطة تنقل صحيحة لمسار الإعلان `listing/:id`. كما أن إعداد Expo يعلن نطاقي `alhraj.online` و`alhrajplus.com` ضمن Android App Links وiOS Universal Links. لا توجد معرفات متجر أو ملفات association منشورة من المشروع، ولذلك لم تتم إضافة Smart App Banner أو ملفات وهمية قد تسبب روابط مكسورة.

| العنصر | حالة المصدر | المطلوب قبل تفعيله في الإنتاج |
|---|---|---|
| Android App Links | مهيأ في `mobile/app.json` مع `autoVerify: true` | نشر `/.well-known/assetlinks.json` لكل نطاق، باستخدام `package_name=com.harajplus.app` وبصمة SHA-256 الفعلية لشهادة توقيع إصدار Google Play. |
| iOS Universal Links | مهيأ عبر `applinks:alhraj.online` و`applinks:alhrajplus.com` | نشر `/.well-known/apple-app-site-association` أو `/apple-app-site-association` بقيمة `appID` الفعلية المكوّنة من Apple Team ID و`com.harajplus.app`. |
| مسار الإعلان | مهيأ في React Navigation | اختبار رابط حقيقي مثل `https://alhraj.online/listing/<slug>` على Android وiOS، مع التحقق من fallback للويب إن لم يكن التطبيق مثبتًا. |
| Smart App Banner | غير مضاف عمدًا | إضافته فقط بعد تزويد App Store ID الرسمي؛ يمنع استخدام قيمة بديلة أو صفرية. |
| Google Play Deep Links | يحتاج تحققًا خارجيًا | فحص صفحة **Grow > Deep links** في Play Console بعد نشر build موقع وموقع association. |

## استراتيجية ASO المقترحة للإصدار الأول

ينبغي إعداد صفحات متجر مستقلة ومترجمة للعربية والإنجليزية والأوردية والهندية والبنغالية والفرنسية، مع التركيز على وظيفة التطبيق الحقيقية لا على الحشو بالكلمات. ينصح بأن يصف العنوان المختصر القيمة الفعلية للتطبيق، وأن تبرز أول لقطة شاشة نشر إعلان، والبحث المحلي، ورسائل التواصل، ثم توزع بقية اللقطات على الفئات الأساسية. يجب اختبار نسخة واحدة متغير واحد في كل مرة عبر Product Page Optimization في Apple وStore Listing Experiments في Google Play عند توفر حسابات المتاجر.

| مكوّن المتجر | معيار التنفيذ |
|---|---|
| الاسم والعنوان الفرعي | اسم مميز وواضح لا يكرر كلمات عامة أو أسماء تطبيقات منافسة. |
| الكلمات المفتاحية | مفردات دقيقة مرتبطة بوظائف التطبيق وفئاته، مفصولة حسب قواعد المتجر؛ لا تكرر الصيغ المفردة والجمع ولا تستخدم علامات تجارية بلا ترخيص. |
| الوصف | الفقرة الأولى تشرح الفائدة الحقيقية، ثم مزايا محددة ومثبتة؛ لا يتضمن سعرًا ثابتًا أو وعود ترتيب/ذكاء اصطناعي غير قابلة للتحقق. |
| الصور والفيديو | واجهات فعلية من التطبيق، محلية لكل لغة، وتوضح تدفق المستخدم من البحث إلى الإعلان والتواصل. |
| التقييمات | طلب تقييم عبر واجهة النظام بعد نجاح واضح للمستخدم، وليس عند أول فتح أو أثناء عائق. |
| القياس | نسبة فتح الرابط للتطبيق، تغطية deep links، صفحة المتجر إلى تثبيت، تثبيت إلى إكمال تسجيل، ونشر إعلان أول. |

> لا يمكن نشر أو اختبار ملفات association من دون Apple Team ID وبصمة SHA-256 الفعلية لشهادة توقيع Android. استعمال placeholders ينجح في البناء لكنه يفشل التحقق أو يوجه المستخدمين إلى تجربة غير موثوقة.

## تحقق ما بعد النشر

بعد توفير بيانات التوقيع ومعرفات المتاجر، يختبر الفريق النطاقين والروابط التالية على أجهزة حقيقية ويحتفظ بلقطات النتائج: Android App Links verifier، Play Console Deep Links coverage، iOS Universal Link من Safari وتطبيقات الرسائل، fallback للويب دون التطبيق، ومسار تسجيل الدخول العائد إلى الإعلان الأصلي.

## مراجع

[1] [Apple: Creating your product page](https://developer.apple.com/app-store/product-page/)

[2] [Google Play Console: Verify and maintain deep links](https://support.google.com/googleplay/android-developer/answer/12463044?hl=en)

[3] [Android Developers: App Links](https://developer.android.com/training/app-links)

[4] [Apple: Allowing apps and websites to link to your content](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content)
