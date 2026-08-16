# تقرير تنظيف البيانات و3D — 2026-08-16

## ما تم تنفيذه

تم حذف مسار 360 من Web وReact Native وbackend validation، وحُذفت مكونات Viewer360 وSpin360 وملفاتهما، كما أزيلت نصوص 360 من كتالوج الترجمة. أصبح المسار التفاعلي المدعوم هو نموذج GLB/GLTF الجاهز فقط.

تمت إزالة سكربت إنشاء الإعلانات والحسابات التجريبية `backend/seed_demo_listings.py`، وإزالة demo badge وشروط منع الاتصال والعروض المرتبطة بها من واجهات تفاصيل الإعلان. أُنشئ سكربت migration صريح باسم `backend/cleanup_legacy_demo_360.py` لحذف السجلات التي تحمل `is_demo=true` وإزالة `custom_fields.is_360` من السجلات المتبقية. لم يُشغّل السكربت على قاعدة بيانات خارجية من داخل sandbox حتى لا تُحذف بيانات staging/production دون مراجعة اتصال قاعدة البيانات.

تمت إضافة رفع GLB/GLTF من React Native باستخدام `expo-document-picker` وCloudinary signed raw upload، مع حد ملف 80MB، كما بقي رفع الويب موجودًا. أضيفت للمستخدم روابط إرشادية إلى Meshy وPolycam لتحويل الصور أو الفيديو خارجيًا إلى GLB/GLTF؛ هذه الروابط ليست API مدمجًا، ولا يوجد ادعاء بأن التحويل الداخلي أو الخطة المجانية بلا حدود متاح.

## التحقق

نجح `python3 -m py_compile backend/server.py backend/cleanup_legacy_demo_360.py`، ونجح `CI=true yarn build` للويب، ونجح `npx expo export --platform web` للموبايل، ونجح `git diff --check`. آخر commit محلي هو `61ad53d feat: retire 360 and remove demo data paths`، و`main` المحلي يشير إلى نفس commit.

## قاعدة البيانات

قبل staging يجب مراجعة `MONGO_URL` و`DB_NAME` ثم تشغيل migration مرة واحدة فقط:

```bash
python -m backend.cleanup_legacy_demo_360
```

بعدها تُراجع Cloudinary orphan resources من سجل الحذف/لوحة التنظيف؛ migration لا يحذف ملفات Cloudinary عشوائيًا لأنه لا يملك mapping موثوقًا لكل asset قديم.

## GitHub

تم تحديث `main` المحلي إلى `61ad53d`. فشل push إلى `origin/main` برسالة GitHub HTTP 403، رغم أن `gh api` يعرض الحساب `obaid08642-ops` و`viewerPermission=ADMIN`. كما رفض Git Data API برسالة `Resource not accessible by integration`. لذلك لا أُسجل أن main البعيد تم تحديثه. المطلوب من صاحب الحساب إعادة إصدار/تفعيل GitHub token بصلاحية Contents: Read and write أو تنفيذ `git push origin main` من جهازه بعد التحقق من أن commit المحلي `61ad53d` هو المطلوب.
