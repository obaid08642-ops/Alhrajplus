# Regression Audit — 2026-08-17

## Scope

راجعت المراحل المنفذة قبل الاستكمال، مع التركيز على Backend وWeb وMobile، وعقود الدولة، الإشعارات، Chat/WebRTC، AI، Coins/Wallet، الحقول المتخصصة، والوسائط.

## Passed checks

- `python3 -m compileall -q backend`
- `python3 -m py_compile backend/server.py backend/ai_orchestrator.py`
- `git diff --check`
- Web production build عبر `npm run build`
- Web tests: i18n smoke suite، 2 tests passed
- Mobile Expo web export
- Debug authorization smoke test: endpoints الحساسة ترفض الزائر غير الموثق
- WebRTC source/build checks

## Confirmed fixes during audit

1. حماية `/api/debug/db-check` و`/api/debug/listings-raw` بمصادقة Admin.
2. تقييد OG listing وseller listings/trust وswipe neighbors بالدولة المختارة.
3. تصحيح SearchPage ليستخدم `CountryContext` بدل `user.country_code` عندما يختار المستخدم دولة مختلفة.
4. تقييد قرار عروض الإعلانات بالدولة المختارة.
5. دعم `deep_link` و`link` و`payload` في Mobile notification routing، وتمرير `openBidFor` إلى شاشة المزادات.
6. تحسين WebRTC بإدارة ICE candidates قبل remote description ومنع تكرار offer وتحسين حالات signaling error/close.

## Environment limitation

اختبارات التكامل التي تعتمد على MongoDB لم تكتمل محليًا لأن MongoDB غير متاح على `localhost:27017`. شغّل الاختبارات نفسها على staging/production-like Mongo قبل release gate، ولا تُعتبر هذه المجموعة ناجحة اعتمادًا على build فقط.

## Decision

تم إصلاح الفجوات المؤكدة وإعادة تشغيل الفحوصات الثابتة وبناء Web/Mobile بنجاح. لا ينبغي إعلان الجاهزية النهائية قبل اختبار التكامل على Mongo وRender staging واختبار مكالمة حقيقية على جهازين.

## Release-gate staging smoke test

- `https://www.alhraj.online` حمّل التطبيق وظهرت عناصر الصفحة الرئيسية، البحث، القصص، المزادات، الخريطة، الفئات، وبطاقات الإعلانات.
- `https://alhrajplus.onrender.com/api/health` أعاد `{"status":"ok","db":"connected"}`؛ اتصال Render بقاعدة البيانات ناجح وقت الاختبار.
- `GET /api/listings?country_code=SA&limit=20` أعاد نتائج تحمل `country_code=SA` فقط.
- `GET /api/listings?country_code=EG&limit=20` أعاد نتائج تحمل `country_code=EG` فقط.
- توجد بيانات legacy غير متسقة تحتاج تنظيفًا إداريًا/ترحيلًا: إعلان موسوم `SA` بمدينة `الإسكندرية`، وإعلانات موسومة `EG` بعملة `ر.س`. العزل البرمجي حسب `country_code` يعمل، لكن صحة بيانات الدولة/المدينة/العملة تحتاج migration قبل الإنتاج النهائي.
- بوابة الاختبارات المحلية: Web i18n 2/2 ناجحة، Web build ناجح، Mobile Expo web export ناجح، وPython compile ناجح. Suite Backend الكامل لا يمكن اعتماده محليًا لأن اختبارات التكامل تعتمد على MongoDB/بيئة تشغيل خارجية؛ شغّل 76 فشلًا و41 نجاحًا و46 skipped قبل إيقافه بعد 612 ثانية، ومعظم الفشل بدأ من تسجيل المستخدم بإجابة 500 بسبب بيئة التكامل المحلية.
