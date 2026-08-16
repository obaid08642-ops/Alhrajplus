# تقرير تحقق Staging — Phase 13

## الخادم

تم الاختبار على `https://alhrajplus.onrender.com` بتاريخ 2026-08-16.

## الاختبارات العامة

| Endpoint | Status | النتيجة |
|---|---:|---|
| `/api/health` | 200 | الحالة `ok` وقاعدة البيانات `connected` |
| `/api/meta/theme` | 200 | يعيد primary/accent/fonts؛ primary الحالي `#01c9ff` |
| `/api/meta/categories` | 200 | يعيد 23 فئة |
| `/api/listings?limit=1` | 200 | يعيد envelope حقيقيًا: total/items/page/limit/next_cursor |
| `/api/deals/today?limit=3` | 200 | قائمة فارغة حقيقية؛ يجب أن تعرض الواجهة empty state لا cards وهمية |
| `/api/auctions/active?limit=3` | 200 | يعيد مزادين نشطين |
| `/api/auth/providers` | 200 | يعيد إعدادات Google/Apple/X/Snapchat |

## اختبارات i18n العامة

تم تشغيل:

```text
REACT_APP_BACKEND_URL=https://alhrajplus.onrender.com pytest -q backend/tests/test_iter21_i18n_categories.py -k 'MetaCategoriesI18n or AuthProviders'
8 passed, 6 deselected
```

## اختبارات محجوبة

الجزء المحمي من `test_iter21_i18n_categories.py` و`test_iteration5_deals.py` لم يُغلق؛ لأن بيانات admin المضمنة في الاختبارات (`admin@harajplus.com`) أعادت 401 على staging. لا توجد صلاحية لاستخدام أو تخمين حساب admin الحقيقي. يلزم تشغيل هذه الاختبارات بعد توفير حساب staging أو token صالح.

## Builds وStatic Checks

| فحص | النتيجة |
|---|---|
| `python3 -m py_compile backend/server.py backend/cleanup_legacy_demo_360.py` | ناجح |
| `python3 -m json.tool frontend/src/auto_translations.json` | ناجح |
| `git diff --check` | ناجح |
| Web production build | ناجح |
| Expo web export | ناجح |

## ملاحظات القبول

قائمة الصفقات الفارغة ليست فشلًا؛ هي دليل أن endpoint يعمل ويعيد `[]`. لا يجوز إعادة mock cards لإخفاء ذلك. يجب في staging المحمي التحقق أيضًا من chat WebSocket، push/deep links، Redis، Cloudinary deletion، admin analytics، bulk cleanup، وauthenticated notification flows بعد توفير صلاحية دخول مناسبة.
