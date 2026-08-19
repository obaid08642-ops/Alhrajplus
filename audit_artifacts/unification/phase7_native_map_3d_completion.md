# المرحلة 7 — إزالة WebView للخريطة والنماذج ثلاثية الأبعاد

## النتيجة

أزيلت **كل** تبعية واستخدامات `WebView` من تطبيق Mobile. أصبحت الخريطة في Android وiOS خريطة MapLibre أصلية، وأصبح عرض النموذج ثلاثي الأبعاد عارض Filament أصليًا. حذفت أيضًا حزمة `react-native-webview` من `package.json` و`yarn.lock`، لذلك لا تحمل حزمة التطبيق مكوّن متصفح مضمن لهذه الميزات.

| السطح | التنفيذ السابق | التنفيذ الحالي | ما حُفظ |
|---|---|---|---|
| خريطة الإعلانات | Leaflet داخل HTML/WebView | MapLibre Native مع GeoJSON | طلب `/listings/map/nearby`، الفئات، البحث المحلي، الموقع الحالي، فتح تفاصيل الإعلان، وألوان العلامات المميزة. |
| عرض 3D | `@google/model-viewer` داخل HTML/WebView | React Native Filament | رابط `custom_fields.model_3d_url`، زر الإغلاق، إضاءة المشهد، تدوير النموذج، والتكبير/التصغير. |
| Expo Web preview | WebView للوظائف نفسها | fallbacks منصاتية بلا متصفح مضمن | قائمة إعلانات للخريطة ورسالة واضحة لعارض 3D؛ لا تؤثر في موقع Web المستقل. |

## تفاصيل التنفيذ

تستخدم `MapScreen.native.js` مصدر raster خاصًا بـOpenStreetMap داخل style محلي لـMapLibre، وبذلك لا تحتاج الخريطة إلى مفتاح Google أو تغيير بيانات/تكاملات إنتاجية. تعرض العلامات من `GeoJSONSource` وطبقات دائرة أصلية، لا مئات من مكونات HTML أو Views عائمة. تُستقبل الفئة من Backend، بينما يجري البحث النصي محليًا لأن endpoint الخريطة الحالي لا يطبق `q` في Backend. يبقى إسناد OpenStreetMap ظاهرًا صراحةً في الخريطة.

يستخدم `Model3DViewerMobile.native.js` مكونات `FilamentScene` و`FilamentView` و`Model` و`Camera`. يدعم Filament رابط HTTPS مباشر لملف `.glb` ويعرض النموذج داخل واجهة Native. أضيفت أزرار فعلية للتدوير يمينًا ويسارًا والتكبير والتصغير، مع تسميات وصول مترجمة. تُضبط النماذج إلى وحدة العرض عبر `transformToUnitCube` لتقليل أثر اختلاف أحجام ملفات المصدر.

> يدعم Filament ملفات **GLB** فقط في مسار التحميل الحالي. لذلك حُدّث اختيار الملف في Mobile ليقبل GLB فقط ويمنع رفع GLTF الجديد برسالة مترجمة. ملفات GLTF الموجودة سابقًا لا تُعرض داخل متصفح بديل؛ تعرض رسالة واضحة تطلب إعادة الرفع بصيغة GLB. لا يجري أي تحويل تلقائي ولا تعديل لبيانات الإنتاج في هذه المرحلة. [1]

## التحقق والاختبارات

| بوابة التحقق | النتيجة |
|---|---|
| اختبار عقد المرحلة 7 | ناجح — 4 passed؛ يتحقق من غياب WebView، MapLibre، Filament، GLB، وتهيئة Babel/Expo. |
| بوابة Backend الحتمية الكاملة | ناجح — 107 passed. |
| اختبارات Web | ناجح — 19 passed في 5 suites. |
| Web production build | ناجح. |
| Android JavaScript bundle | ناجح — 7.25 MB. |
| iOS JavaScript bundle | ناجح — 7.22 MB. |
| Mobile Web export | ناجح — 4.88 MB. |
| Android+iOS prebuild المعزول | ناجح؛ يظهر `$MLRN.post_install(installer)` في Podfile من plugin MapLibre. |
| فحص المصدر والاعتمادات | ناجح؛ لا استيراد أو استخدام أو تبعية لـ`react-native-webview`. |
| Expo Doctor | 17/18؛ التحذير الوحيد سابق للمكالمات: React Native Directory لا يسجل اختبار New Architecture لـ`react-native-webrtc` و`react-native-callkeep`. لا تحذير لـMapLibre أوFilament. |

## بوابة الإطلاق والقيود

مرَّت الحزم وprebuild، لكن يجب قبل إصدار المستخدمين تنفيذ بناء native فعلي على Android وiOS وتشغيل الخريطة وملف GLB حقيقيين على جهازين. ينبغي اختبار إذن الموقع، الضغط على علامة، تبديل الفئات، البحث، واستعادة التطبيق من الخلفية. وينبغي اختبار ملف GLB صغير ثم كبير، التحكم في التدوير/التكبير، وتحرير الذاكرة عند إغلاق العارض.

خدمة بلاطات `tile.openstreetmap.org` مناسبة للإثبات والزيارات المحدودة، لكنها ليست ضمانًا لخدمة إنتاجية ذات حجم مرتفع. قبل الإطلاق واسع النطاق ينبغي اعتماد مزود بلاطات متعاقد أو مستضاف ذاتيًا، مع الحفاظ على الإسناد ومتطلبات التخزين المؤقت. ولم يُنشأ أي حساب أو مفتاح أو تكلفة خارجية ضمن هذه المرحلة. [2]

تحتاج جميع الوحدات الأصلية الجديدة إلى **development أو production build**؛ لا يمكن اختبار MapLibre أو Filament في Expo Go. وتبقى ملفات GLTF القديمة قيد ترحيل متعمد إلى GLB، لا تُعرض عبر متصفح خفي، حمايةً لشرط إزالة WebView. [1] [3]

## المراجع

[1] [React Native Filament — Asset Loading](https://margelo.github.io/react-native-filament/docs/guides/asset-loading)

[2] [OpenStreetMap — Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)

[3] [MapLibre React Native — Expo Setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
