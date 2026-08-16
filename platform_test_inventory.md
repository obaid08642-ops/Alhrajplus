=== frontend scripts ===
{
  "start": "craco start",
  "build": "craco build",
  "test": "craco test"
}
=== mobile scripts ===
{
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web"
}
=== test files ===
backend/tests/__pycache__/conftest.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_chat_hub_unit.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_haraj_plus.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_haraj_plus.cpython-312.pyc
backend/tests/__pycache__/test_iter12_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter12_features.cpython-312.pyc
backend/tests/__pycache__/test_iter13_regression.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter13_regression.cpython-312.pyc
backend/tests/__pycache__/test_iter14_trip_egypt.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter14_trip_egypt.cpython-312.pyc
backend/tests/__pycache__/test_iter15_trip_ads.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter15_trip_ads.cpython-312.pyc
backend/tests/__pycache__/test_iter16_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter16_features.cpython-312.pyc
backend/tests/__pycache__/test_iter17_seo.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter17_seo.cpython-312.pyc
backend/tests/__pycache__/test_iter18_search.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter18_search.cpython-312.pyc
backend/tests/__pycache__/test_iter19_push.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter19_push.cpython-312.pyc
backend/tests/__pycache__/test_iter20_chat_ws.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter20_chat_ws.cpython-312.pyc
backend/tests/__pycache__/test_iter21_i18n_categories.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iter21_i18n_categories.cpython-312.pyc
backend/tests/__pycache__/test_iteration11_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration11_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration3_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration3_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration4_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration4_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration5_deals.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration5_deals.cpython-312.pyc
backend/tests/__pycache__/test_iteration6_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration6_features.cpython-312.pyc
backend/tests/__pycache__/test_iteration7_x_oauth.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration7_x_oauth.cpython-312.pyc
backend/tests/__pycache__/test_iteration8_snap_push.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration8_snap_push.cpython-312.pyc
backend/tests/__pycache__/test_iteration9_search.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_iteration9_search.cpython-312.pyc
backend/tests/__pycache__/test_new_features.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_new_features.cpython-312.pyc
backend/tests/__pycache__/test_public_visibility_policy.cpython-312-pytest-9.0.3.pyc
backend/tests/__pycache__/test_public_visibility_policy.cpython-312.pyc
backend/tests/conftest.py
backend/tests/test_chat_hub_unit.py
backend/tests/test_haraj_plus.py
backend/tests/test_iter12_features.py
backend/tests/test_iter13_regression.py
backend/tests/test_iter14_trip_egypt.py
backend/tests/test_iter15_trip_ads.py
backend/tests/test_iter16_features.py
backend/tests/test_iter17_seo.py
backend/tests/test_iter18_search.py
backend/tests/test_iter19_push.py
backend/tests/test_iter20_chat_ws.py
backend/tests/test_iter21_i18n_categories.py
backend/tests/test_iteration11_features.py
backend/tests/test_iteration3_features.py
backend/tests/test_iteration4_features.py
backend/tests/test_iteration5_deals.py
backend/tests/test_iteration6_features.py
backend/tests/test_iteration7_x_oauth.py
backend/tests/test_iteration8_snap_push.py
backend/tests/test_iteration9_search.py
backend/tests/test_new_features.py
backend/tests/test_public_visibility_policy.py
frontend/src/components/ui/aspect-ratio.jsx


## Local regression result — 2026-08-16

تم تشغيل الاختبارات المحلية المختارة. فشلت المجموعة لأن اختبارات WebSocket الشبكية اتصلت بمنفذ لا توجد عليه نسخة backend محلية، فكان الرد `404` بدل رمز رفض token المتوقع `4401/401/403`. هذا دليل على نقص test harness أو خدمة backend المحلية في هذه الجلسة، وليس إثباتًا أن مسار token نفسه فشل في staging. يجب تشغيل mock/server fixture أو staging URL قبل اعتماد النتيجة.


## Unit baseline clarification — 2026-08-16

المجموعة المسماة محليًا ما زالت تحتوي اختبارات API تعتمد على `127.0.0.1:8000`، لذلك ظهر `ConnectionError` في اختبار VAPID عند عدم تشغيل backend. لا ينبغي اعتبارها unit tests حتى تُفصل requests الخارجية أو تُشغل عبر fixture mock. الاختبار المستقل المؤكد سابقًا هو ChatHub unit: 2 passed.
