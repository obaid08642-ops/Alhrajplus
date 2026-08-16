import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src" / "auto_translations.json"
data = json.loads(path.read_text(encoding="utf-8"))
updates = {
    "تواصل مع البائع": {"en": "Contact seller", "ur": "فروخت کنندہ سے رابطہ", "hi": "विक्रेता से संपर्क करें", "bn": "বিক্রেতার সাথে যোগাযোগ করুন", "fr": "Contacter le vendeur"},
    "إظهار المساعد الذكي": {"en": "Show AI Assistant", "ur": "AI اسسٹنٹ دکھائیں", "hi": "AI सहायक दिखाएँ", "bn": "AI সহকারী দেখান", "fr": "Afficher l’assistant IA"},
    "ارفع ستوري": {"en": "Upload Story", "ur": "اسٹوری اپ لوڈ کریں", "hi": "स्टोरी अपलोड करें", "bn": "স্টোরি আপলোড করুন", "fr": "Télécharger une story"},
    "ارفع ستوري فيديو": {"en": "Upload Video Story", "ur": "ویڈیو اسٹوری اپ لوڈ کریں", "hi": "वीडियो स्टोरी अपलोड करें", "bn": "ভিডিও স্টোরি আপলোড করুন", "fr": "Télécharger une story vidéo"},
    "نشر ستوري": {"en": "Publish Story", "ur": "اسٹوری شائع کریں", "hi": "स्टोरी प्रकाशित करें", "bn": "স্টোরি প্রকাশ করুন", "fr": "Publier une story"},
    "ستوري": {"en": "Story", "ur": "اسٹوری", "hi": "स्टोरी", "bn": "স্টোরি", "fr": "Story"},
    "وضع الستوري — فيديو قصير مطلوب": {"en": "Story mode — a short video is required", "ur": "اسٹوری موڈ — مختصر ویڈیو درکار ہے", "hi": "स्टोरी मोड — छोटी वीडियो आवश्यक है", "bn": "স্টোরি মোড — ছোট ভিডিও প্রয়োজন", "fr": "Mode story — une courte vidéo est requise"},
    "العودة للرئيسية": {"en": "Back to home", "ur": "ہوم پر واپس جائیں", "hi": "होम पर वापस जाएँ", "bn": "হোমে ফিরে যান", "fr": "Retour à l’accueil"},
    "تعذر تحميل الإعلان": {"en": "Unable to load listing", "ur": "اشتہار لوڈ نہیں ہو سکا", "hi": "विज्ञापन लोड नहीं हो सका", "bn": "বিজ্ঞাপন লোড করা যায়নি", "fr": "Impossible de charger l’annonce"},
    "الإعلان غير موجود": {"en": "Listing not found", "ur": "اشتہار نہیں ملا", "hi": "विज्ञापन नहीं मिला", "bn": "বিজ্ঞাপন পাওয়া যায়নি", "fr": "Annonce introuvable"},
    "تواصل مع المتجر": {"en": "Contact store", "ur": "اسٹور سے رابطہ", "hi": "स्टोर से संपर्क करें", "bn": "স্টোরে যোগাযোগ করুন", "fr": "Contacter la boutique"},
}
for key, value in updates.items():
    data[key] = value
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"updated {len(updates)} translation keys")
