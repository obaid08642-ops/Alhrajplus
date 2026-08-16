# Alhrajplus — Deploy Environment Checklist

## قاعدة مهمة

وجود اسم المتغير في Render أو السيرفر لا يثبت أن القيمة صحيحة أو أن الخدمة تعمل. يجب اختبار القيمة عبر readiness وsmoke test، مع عدم طباعتها في السجلات.

## Required backend

| Variable | Purpose | Required for |
|---|---|---|
| `MONGO_URL` | MongoDB connection string | كل backend |
| `DB_NAME` | اسم قاعدة البيانات | كل backend |
| `JWT_SECRET` | توقيع access tokens | كل backend؛ يجب أن يكون عشوائيًا وطويلًا |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | bootstrap/admin protection | الإدارة |
| `FRONTEND_URL` | روابط التحقق وCORS والـ deep links | web/auth |
| `BACKEND_PUBLIC_URL` | canonical callbacks وSEO/links | production |
| `CORS_ORIGINS` | origins المسموحة | production |
| `REDIS_URL` | cache/PubSub/rate-limit المستقبلي | multi-instance production |
| `CRON_SECRET` | حماية endpoints المجدولة | jobs/notifications |

## Media and communication

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, و`CLOUDINARY_API_SECRET` لازمة للصور والفيديو والـ transformations. `RESEND_API_KEY` و`SENDER_EMAIL` لازمان للبريد والتحقق. يجب اختبار upload/delete وemail delivery في staging.

## AI and SEO

`EMERGENT_LLM_KEY` أو `GEMINI_API_KEY` يستخدم للميزات التي تعتمد على LLM. `GOOGLE_INDEXING_SA_JSON` أو ملف service account مكافئ يستخدم فقط إن كان تدفق Google indexing مفعّلًا، مع أقل صلاحيات ممكنة. عدم وجوده يجب أن يؤدي إلى graceful degradation لا إلى فشل النشر.

## OAuth and push

Google يحتاج `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, و`GOOGLE_REDIRECT_URI`. Apple يحتاج `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, و`APPLE_REDIRECT_URI`. X/Snapchat لهما مفاتيح مستقلة. Web Push يحتاج `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, و`VAPID_CLAIM_EMAIL`.

## Redis recommendation

استخدم Redis مُدارًا خارجيًا مع TLS وACL/password، مثل Redis Cloud أو Upstash أو AWS ElastiCache/MemoryDB. يجب أن تكون قيمة `REDIS_URL` بصيغة TLS المناسبة، وأن تسمح بالاتصالات من Render. خصص namespace أو database منفصلة للتطبيق، وضع memory policy مناسبة للكاش، وراقب evictions وconnected clients وlatency.

Redis Pub/Sub مناسب للأحداث الفورية بين نسخ WebSocket، لكنه **ليس durable queue**. للـ SEO jobs والإشعارات وإعادة المحاولة استخدم Redis Streams أو worker queue موثوقة، مع idempotency وdead-letter handling.

## Verification sequence

1. شغّل `/api/health/ready` من نفس شبكة Render.
2. نفّذ register/login، نشر إعلان بصورة، فتح صفحة إعلان، إرسال رسالة، إرسال عرض سعر، وقبول العرض في staging.
3. شغّل نسختين backend على الأقل وتحقق من وصول WebSocket event بينهما.
4. اختبر Mongo indexes وRedis reconnect وgraceful degradation.
5. راجع logs بحثًا عن secrets أو PII قبل اعتماد الإنتاج.
6. خذ backup واسترجاعًا تجريبيًا قبل تنظيف بيانات `TEST_` أو تشغيل migration.

## Current local evidence

Python syntax نجح، ChatHub unit tests: `2 passed`، Web build تحت `CI=true` نجح، وExpo web export نجح. لم يتم إثبات صحة الخدمات البعيدة أو load test الحقيقي من البيئة المحلية.
