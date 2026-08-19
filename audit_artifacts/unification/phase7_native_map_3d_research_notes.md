# ملاحظات بحث المرحلة 7 — خريطة ونماذج 3D أصلية

| القرار | المصدر | النتيجة العملية |
|---|---|---|
| MapLibre React Native | [Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/) | يحتاج development/production build وليس Expo Go؛ يثبت عبر `@maplibre/maplibre-react-native` ويحتاج config plugin في Expo. استعملت مصدر raster OSM داخل style محلي كي لا يتطلب مفتاح Google أو بيانات إنتاج. |
| Expo Maps | [Expo Maps](https://docs.expo.dev/versions/latest/sdk/maps/) | موثق كـ alpha ويتطلب Maps SDK for Android ومفتاح Google. لم أعتمده لأن المفتاح غير متاح ولا ينبغي إنشاء/تعديل تكامل إنتاجي في هذه المرحلة. |
| React Native Filament | [Getting Started](https://margelo.github.io/react-native-filament/docs/guides) | محرك Native يدعم Android/iOS، يحتاج `react-native-filament` و`react-native-worklets-core` وBabel plugin؛ يذكر أن حجم المكتبة في التطبيق نحو 4MB. |
| تحميل نماذج Filament | [Asset Loading](https://margelo.github.io/react-native-filament/docs/guides/asset-loading) | يدعم رابط HTTPS مباشر لـ`.glb` ويصرح حاليًا بدعم GLB فقط؛ لذلك وُحد رفع Mobile على GLB وعُرضت رسالة تحويل واضحة للنماذج GLTF القديمة. |

## نتائج prebuild المعزول

- نجح `expo prebuild --platform all --no-install --clean` في نسخة مؤقتة.
- يظهر `$MLRN.post_install(installer)` في `ios/Podfile`، ما يثبت تطبيق plugin MapLibre المطلوب في iOS.
- لا يثبت prebuild بناء Pods/Gradle أو تشغيل MapLibre/Filament على جهاز؛ اختبار Android وiOS الفعلي يبقى بوابة قبول قبل إصدار المستخدمين.
