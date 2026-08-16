# تقرير تنفيذ Feature Parity — Alhrajplus Premium

## نطاق هذه الدفعة

هذه الدفعة لا تدّعي أن جميع ميزات المنافسين اكتملت. ما يلي هو ما تم تنفيذه وتثبيته فعليًا على فرع `production-readiness-premium` بعد الجرد السابق.

| المجال | التنفيذ الفعلي | الويب | React Native | Backend | حالة التحقق |
|---|---|---:|---:|---:|---|
| Visitor/session intelligence | معرف زائر وجلسة، نوع الجهاز، OS، المتصفح، المصدر، الحملة، referrer، أبعاد الشاشة، مدة الجلسة وheartbeat كل 30 ثانية | نعم | جزئي | نعم | compile + web build |
| Admin live visitors | جلسات حديثة، نشطون آخر دقيقتين، متوسط المدة، الدولة، المسار، الأجهزة، أكثر الشاشات زيارة، تصدير وتحليل أساسي | نعم | لا ينطبق | نعم | web build |
| User 360 | العروض، الإحالات، نقاط الإحالة، عدد الجلسات، آخر الأجهزة والمسارات، الإعلانات والبلاغات | نعم | لا ينطبق | نعم | compile + web build |
| Referral ledger | حالة pending/qualified/rewarded/rejected، التأهيل بعد تحقق البريد، إعداد النقاط من الإدارة، تصدير CSV | نعم | يعتمد على API الحالي | نعم | compile + web build |
| Seller storefront | صفحة عامة `/seller/:sellerId`، هوية المتجر، الغلاف والشعار والوصف، التقييم، المتابعون، الكتالوج، رابط من الإعلان | نعم | ملف البائع يعرض store_name وstore_description وstore_slug | نعم | web build + Expo export |
| Vertical fields — Cars | VIN، المواصفات الإقليمية، حجم المحرك، السلندرات، التمويل، تقرير الفحص، إضافة إلى الحقول الموجودة | نعم عبر schema API | يستلم schema عبر API | نعم | compile + web build |
| Vertical fields — Real Estate | الملكية، المرافق، الخدمات، التقسيط، الدفعة المقدمة، تاريخ التوفر، ترخيص الوسيط | نعم عبر schema API | يستلم schema عبر API | نعم | compile + web build |
| Vertical fields — Jobs | حجم الشركة، آخر موعد، مدينة العمل، التأشيرة، portfolio، CV requirement | نعم عبر schema API | يستلم schema عبر API | نعم | compile + web build |
| Negotiation | صلاحية افتراضية 72 ساعة، منع القرار على العرض المنتهي، counter-offer، تاريخ القرار، إشعارات التحديث | نعم | يعتمد على inbox/API المشترك | نعم | compile + web build |

## Commits الرئيسية

| Commit | الغرض |
|---|---|
| `c771fb4` | Admin visitor intelligence وReferral Operations |
| `34aff7d` | User 360 والجلسات والإحالات |
| `a92ce71` | Premium seller storefront على الويب |
| `1e618a9` | توسيع schemas للسيارات والعقار والوظائف |
| `a1c5ece` | Expiring counter-offer workflow |
| `941672a` | أكثر الشاشات زيارة وتوزيع الأجهزة |
| `0d698b4` | عرض هوية المتجر في SellerProfile للموبايل |

## ما لم يُثبت بعد

لا يزال اعتماد الإنتاج الكامل مشروطًا بـ staging حقيقي مع MongoDB وRedis، load tests لاتصالات WebSocket واستعلامات analytics، APNs/FCM/HMS على أجهزة حقيقية، مراجعة سياسة الخصوصية وconsent الخاص بالـ telemetry، وتهيئة indexes وretention jobs للبيانات التحليلية. كذلك لا تزال بعض ميزات السوق الكبيرة، مثل الدفع/escrow، VIN provider مدفوع، CRM متقدم، وتوصيات ranking مدعومة ببيانات إنتاج، خارج هذه الدفعة وتحتاج تكاملات وخطة تشغيل منفصلة.

## تحديث lifecycle و360/3D

صلاحية **72 ساعة** تخص العرض التفاوضي وcounter-offer فقط، ولا تخص الإعلان المنشور. الإعلان يبقى منشورًا حتى يبيعه صاحبه أو يوقفه أو يحذفه أو يقرر المشرف حذفه. أضيف تبويب Admin باسم **عمر وتنظيف الإعلانات** يتيح مراجعة الإعلانات الأقدم من 30 يومًا أو 60 يومًا أو 6 أشهر أو سنة أو 5 سنوات، مع فلترة الحالة، المعاينة، تحديد الإعلانات، والحذف الجماعي اليدوي. لا يوجد auto-delete مفاجئ؛ الحذف العمري يحتاج إجراءً إداريًا صريحًا.

الحذف الآن يزيل سجل الإعلان والبيانات التابعة له من MongoDB، بما في ذلك العروض والتعليقات والإعجابات والمفضلة والمتابعات والبلاغات المرتبطة. كما تُجدول صور Cloudinary وفيديوهاته ونموذج GLB/GLTF إن وجد للتنظيف مع retry وaudit log. لذلك لا يُعد حذف الإعلان ضمانًا لحذف الوسائط لحظيًا من واجهة Cloudinary، لكنه يضعها في مسار تنظيف موثوق وقابل للتدقيق وإعادة المحاولة عند انقطاع الخدمة.

بالنسبة إلى 360، التنفيذ الحالي هو **image-sequence viewer حقيقي** وليس 3D اصطناعيًا: يرفع المستخدم من 8 إلى 24 صورة مرتبة حول المنتج، والأفضل عمليًا 12 إلى 24 إطارًا لتدوير أكثر سلاسة، ثم يدور المنتج بالسحب مع zoom وauto-spin. أضيف تحقق backend وfrontend لمنع حفظ وضع 360 بعدد صور غير صالح.

أضيف أيضًا خيار **3D حقيقي اختياري على الويب** عبر ملف GLB/GLTF، ورفع signed إلى Cloudinary raw، ثم عرضه باستخدام model-viewer مع camera controls وauto-rotate والتكبير. لم يتم تحويل صورة واحدة إلى 3D تلقائيًا؛ هذا متعمد لأن تحويل صورة عادية إلى نموذج ثلاثي الأبعاد موثوق يحتاج pipeline AI/photogrammetry خارجية وقد ينتج هندسة وهمية. تطبيق الموبايل يستمر حاليًا في دعم image-sequence 360، بينما عارض GLB يحتاج طبقة native/Expo منفصلة قبل إعلان parity كاملة بين الويب وiOS/Android/Huawei.

آخر تحقق لهذه الدفعة: `python3 -m py_compile backend/server.py` و`CI=true yarn build` نجحا، مع تثبيت اعتماد `@google/model-viewer` عبر Yarn.
