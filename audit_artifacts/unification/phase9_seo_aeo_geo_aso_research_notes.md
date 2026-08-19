# ملاحظات بحث المرحلة 9 — SEO / AEO / GEO / ASO

| المصدر الرسمي | النتيجة التي توجه التنفيذ |
|---|---|
| [Google: الصفحات المحلية](https://developers.google.com/search/docs/specialty/international/localized-versions) | يجب أن تسرد كل نسخة لغة نفسها وكل البدائل بروابط مطلقة متبادلة؛ تفضّل Google تضمين `x-default` للفallback غير المطابق. ولا تعتمد Google على `hreflang` أو `lang` وحدهما لاكتشاف لغة المحتوى. |
| [Google: سياسات البيانات المنظمة](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) | JSON-LD هو الصيغة الموصى بها، ويجب أن يمثل المحتوى الظاهر للمستخدم وأن يضم الخصائص المطلوبة والمناسبة؛ لا يضمن markup الظهور كـrich result. |
| [Google: تحسين البحث التوليدي](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | SEO الأساسي والمحتوى المفيد والفريد والقابل للزحف هو أساس الظهور في AI Overviews/AI Mode؛ لا يوجد schema خاص مطلوب لـAEO/GEO ولا تعتمد Google `llms.txt` للترتيب. ويقاس الأداء عبر Generative AI performance report في Search Console. |
| [Google: app deep links](https://developers.google.com/search/blog/2025/05/app-deep-links) | لا تغير deep links ترتيب صفحات الويب؛ لكنها تحسن انتقال المستخدم للصفحة المطابقة داخل التطبيق. يلزم تطابق المحتوى بين التطبيق والويب، مع Android App Links وiOS Universal Links للتحقق. |

## قرار المرحلة

يركز التنفيذ على **اتساق المحتوى القابل للزحف**، والروابط الدولية، والـJSON-LD الصادق، والـdeep links المتطابقة مع صفحة الإعلان، وبيانات store metadata منظمة. لن تنفذ المرحلة تكتيكات مضللة مثل spam keywords أو `llms.txt` بوصفه إشارة ترتيب أو ادعاء ترتيب رقم 1؛ هذه ليست ضمانات مدعومة من المصدر الرسمي.
