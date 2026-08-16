# Technical truth audit — Alhrajplus

## 1. الحقيقة الخاصة بالـ 3D

المشروع يحتوي الآن على **عارض 3D حقيقي لملف GLB/GLTF جاهز** على الويب والموبايل. تم إلغاء تجربة 360 image-sequence من واجهات النشر والعرض. العارض لا يحوّل الصور أو الفيديو إلى نموذج هندسي تلقائيًا. المستخدم أو فريق التشغيل يجب أن يرفع ملف GLB/GLTF تم إنتاجه مسبقًا ببرنامج نمذجة أو خدمة photogrammetry/AI خارجية، ثم يعرضه النظام بالسحب والتدوير والتكبير.

الويب يستخدم `@google/model-viewer` مع `camera-controls` و`auto-rotate`. الموبايل يستخدم `react-native-webview` ويحمل `model-viewer` من CDN مع camera controls وAR modes حسب دعم الجهاز. لذلك عبارة «3D موجود» صحيحة بمعنى **عرض نموذج GLB/GLTF**، وليست صحيحة إذا فُهمت بمعنى «ارفع 10 صور أو فيديو وسيُنتج النظام mesh 3D تلقائيًا»؛ هذا الجزء لم يُنفذ بعد.

## 2. ما الذي ينقص لتحويل الصور أو الفيديو إلى 3D؟

يلزم pipeline مستقل: استقبال الصور أو الفيديو، التحقق من التغطية والزوايا والجودة، تخزين job، تشغيل photogrammetry أو AI reconstruction، فحص النموذج الناتج، ضغطه إلى GLB/GLTF، وضعه في Cloudinary/S3، ثم ربطه بالإعلان. هذا يحتاج worker/background compute، queue، تكلفة GPU أو مزود API، limits، privacy policy للصور، ومراجعة فشل النتائج. لا يوجد في المستودع الحالي كود photogrammetry أو mesh reconstruction أو worker لهذه العملية.

## 3. حالة رفع الوسائط

الويب وReact Native يدعمان رفع الصور والفيديو إلى مسار signed upload. رفع GLB/GLTF موجود في الويب والموبايل، والموبايل يستخدم WebView/CDN عند العرض. أضيف اختيار الملف ورفع النموذج من الهاتف أيضًا. تم حذف 360 من الواجهات ومن تحقق backend؛ تبقى سجلات قديمة فقط حتى تشغيل migration الصريح `python -m backend.cleanup_legacy_demo_360` على قاعدة staging/production بعد مراجعة الاتصال.

## 4. ما هو mock أو seed أو fallback؟

`seed_data.py` وملفات الفئات تحتوي بيانات seed للفئات والحقول والقوائم، وهي ليست بيانات مستخدمين وهمية في الإنتاج؛ يجب تشغيل seed فقط في بيئة التهيئة أو migration. توجد fallbacks محلية للقوائم عندما يفشل endpoint، وplaceholders في حقول الإدخال، وهذه ليست سجلات marketplace إنتاجية. لا ينبغي تشغيل seed في production إلا كجزء من migration idempotent.

الخرائط تعتمد fallback محليًا عند فشل البحث، وبيانات الدولة والمدن الثابتة تُستخدم كfallback. بعض الشاشات تعرض empty states أو placeholders عمدًا. لا يوجد دليل في الجرد الحالي على أن إعلانات المستخدمين الفعلية تُستبدل تلقائيًا بقوائم mock عند نجاح backend، لكن يجب تعطيل أي demo seed وإزالة حسابات الاختبار من production database قبل الإطلاق.

## 5. الميزات المكتملة محليًا مقابل الخارجية

| المجال | الحالة |
|---|---|
| Likes, comments, views, favorites, follow | backend وواجهات الطرفين موجودة |
| Offers, counter-offer, expiry | موجودة على الطرفين في المسار الأساسي |
| Realtime chat وoffline outbox | موجودة، وتحتاج Redis/staging load test |
| Notifications وcold-start deep link | موجودة، وتحتاج APNs/FCM/HMS device test |
| Admin analytics, User 360, retention cleanup | Web admin موجود، وليس تطبيقًا عامًا للمستخدم |
| Storefront | Web وموبايل يعرضان هوية البائع والكتالوج الأساسي |
| 360 | أُلغي من تجربة المنتج؛ migration يزيل العلم القديم من السجلات |
| GLB/GLTF viewer | Web وموبايل موجودان |
| Images/video upload | موجودان، مع اعتماد Cloudinary signed config |
| Automatic photos/video → 3D | غير مدمج؛ روابط Meshy وPolycam الإرشادية أضيفت، ويحتاج API/worker خارجي إذا أردنا دمجًا داخليًا |
| VIN integration | حقول VIN موجودة؛ مزود lookup خارجي غير موصول |
| Payments/escrow | ليست مكتملة دون مزود دفع وسياسات مالية |
| Property valuation | حقول عقارية موجودة؛ valuation provider غير موصول |
| Jobs ATS | حقول وظائف موجودة؛ ATS/email workflow متقدم غير موصول |
| Voice/video calls | غير مكتملة دون مزود RTC |
| Shipping/delivery | حقول تفضيلات موجودة؛ orchestration وشركات الشحن غير موصولة |
| KYC حكومي | غير موجود دون مزود وهوية وسياسة امتثال |

## 6. Git/main

تم تحديث `main` المحلي إلى commit `dddc914` نفسه الموجود على `production-readiness-premium`. الـ remote هو مستودع GitHub الصحيح، لكن push فشل لأن GitHub connector غير مفعّل في الجلسة، وليس بسبب تعارض أو فشل في Git history. لم يتم استخدام force push.
