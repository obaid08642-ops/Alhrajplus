import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "frontend/src/auto_translations.json"
data = json.loads(path.read_text())
english = {
    "إضافة بنر إعلاني": "Add advertising banner", "ابحث في:": "Search in:", "الرئيسية": "Home", "العودة": "Back",
    "المسافرون": "Passengers", "تاريخ الذهاب": "Departure date", "تاريخ العودة": "Return date", "حدد الموقع": "Select location",
    "خدمة الإيميل غير مفعّلة بعد. استخدم الرابط مباشرة:": "Email service is not enabled yet. Use the link directly:",
    "عدد المسافرين": "Number of passengers", "استكشف الإعلانات": "Explore listings", "اكتب رسالتك": "Write your message",
    "البيانات مرتبطة بالدولة المختارة": "Data is linked to the selected country", "الحساب": "Account", "الدفع": "Payment",
    "السعر: ": "Price: ", "الصور: ": "Images: ", "العنوان: ": "Title: ", "الفئة: ": "Category: ", "المدينة: ": "City: ",
    "المزادات النشطة ": "Active auctions ", "الميزانية إلى": "Budget to", "الميزانية من": "Budget from", "بلاغ": "Report",
    "تذاكر الدعم": "Support tickets", "تعذر حفظ البيانات": "Could not save the data", "تم الحفظ بنجاح": "Saved successfully",
    "طلبات الشراء": "Buy requests", "طلبات حقيقية مرتبطة بالدولة والفئة والميزانية": "Real requests linked to country, category, and budget",
    "عاجل": "Urgent", "عام": "General", "عنصر محفوظ": "Saved item", "عنوان الطلب": "Request title", "فتح الإعلان": "Open listing",
    "كلمة محظورة: ": "Blocked word: ", "مبلغ المزايدة ": "Bid amount ", "متابعة البلاغات والأسئلة مع سجل الرسائل": "Track reports and questions with message history",
    "مرتفع": "High", "موضوع التذكرة": "Ticket subject", "وصف الطلب": "Request description",
    "❌ تعذّر الإرسال: ": "❌ Could not send: ", "❌ تعذّر التفعيل: ": "❌ Could not activate: ",
}
for key, en in english.items():
    entry = data.setdefault(key, {})
    entry.setdefault("en", en)
    entry.setdefault("ur", en)
    entry.setdefault("hi", en)
    entry.setdefault("bn", en)
    entry.setdefault("fr", en)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
print(f"updated {len(english)} translation entries")
