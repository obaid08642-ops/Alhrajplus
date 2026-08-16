# Static scan للنصوص المرئية — إعادة التدقيق

## نتائج أولية

ظهر في Web عدد من النصوص الإنجليزية المرئية أو accessibility التي تحتاج مراجعة، منها `Mobile/Tablet/Desktop` في Admin filters، `Trip.com Search`، ومكوّنات UI المشتركة التي تحتوي `More`, `Previous`, `Next`, `Close` و`breadcrumb`. بعضها قد يكون accessibility fallback أو مكتبة عامة، لكنه لم يُراجع runtime في كل لغة.

في Mobile ظهر `VIDEO` داخل PostScreen، وحقول التاريخ تستخدم placeholders بصيغة إنجليزية (`YYYY-MM-DD HH:mm`, `YYYY-MM-DD`). يجب تحديد هل المطلوب إبقاء format تقنيًا أم عرضه حسب locale.

فشل جزء من regex scan العربي بسبب collation في grep؛ لذلك لا تُعتبر هذه النتيجة جردًا نهائيًا. يلزم استخدام parser/scan آمن للـJSX والنصوص قبل إغلاق بند الترجمة.
