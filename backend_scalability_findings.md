# تدقيق قابلية التوسع في backend — 16 أغسطس 2026

## ما تحسن

يوجد Motor مع فهارس أساسية على الرسائل والمحادثات والإعلانات والمفضلة والمزايدات والإشعارات والبحث والمتابعة. توجد طبقة cache من Redis مع fallback للذاكرة، وrate limiter محلي، وmetrics خفيف، وأصبح readiness يفحص Mongo وRedis في production. أضيف Redis Pub/Sub اختياريًا إلى ChatHub، مع اختبارين محليين يغطيان التوصيل والتنظيف عند فشل socket.

## العوائق المؤكدة أمام ملايين المستخدمين

الـ rate limiter الحالي يعتمد على dict داخل العملية؛ لذلك لا يوحّد الحد بين instances ولا يصلح للحماية الموزعة. cache الذاكرة fallback ليس آمنًا للتوسع الأفقي، وغياب Redis في production أصبح يجب أن يجعل readiness غير جاهز، لكن يلزم تزويد الاستضافة بعنوان Redis مدار فعليًا.

كان ChatHub يعتمد على ذاكرة worker واحدة، وقد بدأ تحويله إلى Redis Pub/Sub. لا يزال يلزم اختبار multi-instance فعلي على staging، واختبار reconnect، وفقدان Redis، وتسليم الرسائل عند إعادة تشغيل worker، وتناسق presence وdelivered/read.

Docker وRender يستخدمان worker واحدًا وRender starter موصوف بأنه 0.5 CPU/512 MB، وهذا مناسب لـ staging وليس برهانًا على تحمل ملايين الزوار. رفع عدد workers أو instances يحتاج benchmark واقعي، Mongo replica/cluster، Redis managed، CDN، queue، مراقبة خارجية، وضبط autoscaling.

يوجد sitemap يحمل حتى 50,000 إعلان في الذاكرة دفعة واحدة. هذا يوافق حد sitemap التقليدي لكنه ليس استراتيجية كافية لمخزون ضخم أو ملايين الصفحات؛ الأفضل sitemap index وتقسيم ملفات مع cursor أو pagination. توجد كذلك عدة `asyncio.create_task` داخل request lifecycle، وهذا قد يفقد العمل عند إعادة التشغيل ولا يملك retry/deduplication/queue durability. عمليات مثل إرسال push، AI moderation، تنظيف الوسائط، وتنبيهات المتابعين تحتاج queue موثوقة عند التوسع.

يوجد تقرير إداري يحمل 50,000 سجل في بعض المسارات. يجب تحويل التقارير الضخمة إلى aggregation وpagination وexport jobs. كما ينبغي إضافة compound indexes حسب explain plans وليس الاكتفاء بفهرسة عامة.

## الحكم

الحالة الحالية قوية كنسخة pre-production محسّنة، لكنها ليست منصة مثبتة التحمل لملايين المستخدمين. لا يمكن إثبات ذلك بالكود أو build؛ يجب إجراء load test على staging قريب من الإنتاج وقياس p95/p99 وerror rate وMongo/Redis saturation وWebSocket concurrent connections وqueue lag وCore Web Vitals من مستخدمين حقيقيين.
