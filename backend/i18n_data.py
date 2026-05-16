"""
Centralised i18n dictionary for category names, subcategory names, field labels,
and dropdown option values. Used by /api/meta/categories?lang=<code>.

Languages: ar (default), en, ur, hi, bn, fr.

Rules for the localizer in seed_data.py:
  • If a translation is missing, fall back to English, then to the original
    Arabic string. Never leak Arabic into a non-Arabic UI when we have at
    least an English version.
  • Brand/model identifiers that are universally written in Latin script
    (e.g. "BMW", "Samsung", "PS5") are intentionally absent from this map —
    they stay as-is in every language.
"""
from __future__ import annotations
from typing import Dict

# Each entry maps the canonical Arabic string -> per-language translation.
# Add only strings that actually appear as dropdown options or labels.
OPTIONS_I18N: Dict[str, Dict[str, str]] = {
    # --- Common conditions ---
    "جديد": {"en": "New", "ur": "نیا", "hi": "नया", "bn": "নতুন", "fr": "Neuf"},
    "جديد بكرتونه": {"en": "New (Sealed)", "ur": "نیا (سیل بند)", "hi": "नया (सीलबंद)", "bn": "নতুন (সিল)", "fr": "Neuf scellé"},
    "ممتاز": {"en": "Excellent", "ur": "بہترین", "hi": "उत्कृष्ट", "bn": "চমৎকার", "fr": "Excellent"},
    "جيد جداً": {"en": "Very Good", "ur": "بہت اچھا", "hi": "बहुत अच्छा", "bn": "খুব ভালো", "fr": "Très bon"},
    "جيد": {"en": "Good", "ur": "اچھا", "hi": "अच्छा", "bn": "ভালো", "fr": "Bon"},
    "مستعمل": {"en": "Used", "ur": "استعمال شدہ", "hi": "इस्तेमाल किया हुआ", "bn": "ব্যবহৃত", "fr": "Occasion"},
    "مستعمل ممتاز": {"en": "Used – Excellent", "ur": "استعمال شدہ – بہترین", "hi": "इस्तेमाल किया हुआ – उत्कृष्ट", "bn": "ব্যবহৃত – চমৎকার", "fr": "Occasion – Excellent"},
    "مستعمل جيد": {"en": "Used – Good", "ur": "استعمال شدہ – اچھا", "hi": "इस्तेमाल किया हुआ – अच्छा", "bn": "ব্যবহৃত – ভালো", "fr": "Occasion – Bon"},
    "شبه جديد": {"en": "Like New", "ur": "تقریباً نیا", "hi": "लगभग नया", "bn": "প্রায় নতুন", "fr": "Comme neuf"},
    "يحتاج صيانة": {"en": "Needs Repair", "ur": "مرمت درکار", "hi": "मरम्मत आवश्यक", "bn": "মেরামত প্রয়োজন", "fr": "Réparation nécessaire"},
    # --- Yes / No ---
    "نعم": {"en": "Yes", "ur": "ہاں", "hi": "हाँ", "bn": "হ্যাঁ", "fr": "Oui"},
    "لا": {"en": "No", "ur": "نہیں", "hi": "नहीं", "bn": "না", "fr": "Non"},
    "جزئياً": {"en": "Partially", "ur": "جزوی", "hi": "आंशिक रूप से", "bn": "আংশিকভাবে", "fr": "Partiellement"},
    "لا يهم": {"en": "Any", "ur": "کوئی فرق نہیں", "hi": "कोई भी", "bn": "যেকোনো", "fr": "Indifférent"},
    "آخر": {"en": "Other", "ur": "دیگر", "hi": "अन्य", "bn": "অন্যান্য", "fr": "Autre"},
    # --- Transmissions / Fuel ---
    "أوتوماتيك": {"en": "Automatic", "ur": "آٹومیٹک", "hi": "ऑटोमेटिक", "bn": "অটোমেটিক", "fr": "Automatique"},
    "عادي": {"en": "Manual", "ur": "مینوئل", "hi": "मैनुअल", "bn": "ম্যানুয়াল", "fr": "Manuel"},
    "بنزين": {"en": "Petrol", "ur": "پیٹرول", "hi": "पेट्रोल", "bn": "পেট্রোল", "fr": "Essence"},
    "ديزل": {"en": "Diesel", "ur": "ڈیزل", "hi": "डीज़ल", "bn": "ডিজেল", "fr": "Diesel"},
    "كهرباء": {"en": "Electric", "ur": "الیکٹرک", "hi": "इलेक्ट्रिक", "bn": "ইলেকট্রিক", "fr": "Électrique"},
    "هايبرد": {"en": "Hybrid", "ur": "ہائبرڈ", "hi": "हाइब्रिड", "bn": "হাইব্রিড", "fr": "Hybride"},
    # --- Body types ---
    "سيدان": {"en": "Sedan", "ur": "سیڈان", "hi": "सेडान", "bn": "সেডান", "fr": "Berline"},
    "كوبيه": {"en": "Coupe", "ur": "کوپے", "hi": "कूपे", "bn": "কুপে", "fr": "Coupé"},
    "هاتشباك": {"en": "Hatchback", "ur": "ہیچ بیک", "hi": "हैचबैक", "bn": "হ্যাচব্যাক", "fr": "Hayon"},
    "بيك أب": {"en": "Pickup", "ur": "پک اپ", "hi": "पिकअप", "bn": "পিকআপ", "fr": "Pickup"},
    "فان": {"en": "Van", "ur": "وین", "hi": "वैन", "bn": "ভ্যান", "fr": "Fourgonnette"},
    "كابريوليه": {"en": "Convertible", "ur": "کیبریولیٹ", "hi": "कन्वर्टिबल", "bn": "কনভার্টিবল", "fr": "Cabriolet"},
    "كروس أوفر": {"en": "Crossover", "ur": "کراس اوور", "hi": "क्रॉसओवर", "bn": "ক্রসওভার", "fr": "Crossover"},
    # --- Colors ---
    "أبيض": {"en": "White", "ur": "سفید", "hi": "सफ़ेद", "bn": "সাদা", "fr": "Blanc"},
    "أسود": {"en": "Black", "ur": "کالا", "hi": "काला", "bn": "কালো", "fr": "Noir"},
    "فضي": {"en": "Silver", "ur": "چاندی", "hi": "रजत", "bn": "রূপালী", "fr": "Argent"},
    "رمادي": {"en": "Gray", "ur": "سرمئی", "hi": "ग्रे", "bn": "ধূসর", "fr": "Gris"},
    "أزرق": {"en": "Blue", "ur": "نیلا", "hi": "नीला", "bn": "নীল", "fr": "Bleu"},
    "أحمر": {"en": "Red", "ur": "سرخ", "hi": "लाल", "bn": "লাল", "fr": "Rouge"},
    "ذهبي": {"en": "Gold", "ur": "سنہری", "hi": "स्वर्ण", "bn": "সোনালী", "fr": "Or"},
    "بني": {"en": "Brown", "ur": "بھورا", "hi": "भूरा", "bn": "বাদামী", "fr": "Marron"},
    "أخضر": {"en": "Green", "ur": "سبز", "hi": "हरा", "bn": "সবুজ", "fr": "Vert"},
    # --- Seller / Customs ---
    "فرد": {"en": "Individual", "ur": "انفرادی", "hi": "व्यक्तिगत", "bn": "ব্যক্তি", "fr": "Particulier"},
    "معرض": {"en": "Dealer", "ur": "ڈیلر", "hi": "डीलर", "bn": "ডিলার", "fr": "Concessionnaire"},
    "مدفوع": {"en": "Paid", "ur": "ادا شدہ", "hi": "भुगतान किया", "bn": "পরিশোধিত", "fr": "Payé"},
    "معروض للتنازل": {"en": "Transferable", "ur": "منتقلی", "hi": "स्थानांतरणीय", "bn": "হস্তান্তরযোগ্য", "fr": "Transférable"},
    # --- Real Estate deals & types ---
    "للبيع": {"en": "For Sale", "ur": "برائے فروخت", "hi": "बिक्री के लिए", "bn": "বিক্রয়ের জন্য", "fr": "À vendre"},
    "للإيجار": {"en": "For Rent", "ur": "کرایہ پر", "hi": "किराये पर", "bn": "ভাড়ার জন্য", "fr": "À louer"},
    "للتقبيل": {"en": "Lease Transfer", "ur": "لیز منتقلی", "hi": "लीज़ ट्रांसफ़र", "bn": "লিজ হস্তান্তর", "fr": "Cession de bail"},
    "شقة": {"en": "Apartment", "ur": "اپارٹمنٹ", "hi": "अपार्टमेंट", "bn": "অ্যাপার্টমেন্ট", "fr": "Appartement"},
    "فيلا": {"en": "Villa", "ur": "ولا", "hi": "विला", "bn": "ভিলা", "fr": "Villa"},
    "بيت": {"en": "House", "ur": "گھر", "hi": "घर", "bn": "বাড়ি", "fr": "Maison"},
    "عمارة": {"en": "Building", "ur": "عمارت", "hi": "इमारत", "bn": "ভবন", "fr": "Immeuble"},
    "عمارة كاملة": {"en": "Full Building", "ur": "مکمل عمارت", "hi": "पूरी इमारत", "bn": "সম্পূর্ণ ভবন", "fr": "Immeuble entier"},
    "دور": {"en": "Floor", "ur": "منزل", "hi": "मंज़िल", "bn": "তলা", "fr": "Étage"},
    "غرفة": {"en": "Room", "ur": "کمرہ", "hi": "कमरा", "bn": "ঘর", "fr": "Chambre"},
    "استراحة": {"en": "Rest House", "ur": "ریسٹ ہاؤس", "hi": "रेस्ट हाउस", "bn": "বিশ্রামাগার", "fr": "Maison de repos"},
    "محل": {"en": "Shop", "ur": "دکان", "hi": "दुकान", "bn": "দোকান", "fr": "Boutique"},
    "مكتب": {"en": "Office", "ur": "آفس", "hi": "ऑफ़िस", "bn": "অফিস", "fr": "Bureau"},
    "مستودع": {"en": "Warehouse", "ur": "گودام", "hi": "गोदाम", "bn": "গুদাম", "fr": "Entrepôt"},
    "أرض": {"en": "Land", "ur": "زمین", "hi": "ज़मीन", "bn": "জমি", "fr": "Terrain"},
    "أرض سكنية": {"en": "Residential Land", "ur": "رہائشی زمین", "hi": "आवासीय ज़मीन", "bn": "আবাসিক জমি", "fr": "Terrain résidentiel"},
    "أرض تجارية": {"en": "Commercial Land", "ur": "کاروباری زمین", "hi": "वाणिज्यिक ज़मीन", "bn": "বাণিজ্যিক জমি", "fr": "Terrain commercial"},
    "مزرعة": {"en": "Farm", "ur": "فارم", "hi": "खेत", "bn": "খামার", "fr": "Ferme"},
    # --- Facades ---
    "شمالية": {"en": "North", "ur": "شمالی", "hi": "उत्तर", "bn": "উত্তর", "fr": "Nord"},
    "جنوبية": {"en": "South", "ur": "جنوبی", "hi": "दक्षिण", "bn": "দক্ষিণ", "fr": "Sud"},
    "شرقية": {"en": "East", "ur": "مشرقی", "hi": "पूर्व", "bn": "পূর্ব", "fr": "Est"},
    "غربية": {"en": "West", "ur": "مغربی", "hi": "पश्चिम", "bn": "পশ্চিম", "fr": "Ouest"},
    "ثلاث واجهات": {"en": "3 Facades", "ur": "تین اطراف", "hi": "3 दिशाएँ", "bn": "৩ দিক", "fr": "3 façades"},
    "أربع واجهات": {"en": "4 Facades", "ur": "چار اطراف", "hi": "4 दिशाएँ", "bn": "৪ দিক", "fr": "4 façades"},
    # --- Rent periods ---
    "يومي": {"en": "Daily", "ur": "روزانہ", "hi": "दैनिक", "bn": "দৈনিক", "fr": "Quotidien"},
    "شهري": {"en": "Monthly", "ur": "ماہانہ", "hi": "मासिक", "bn": "মাসিক", "fr": "Mensuel"},
    "سنوي": {"en": "Yearly", "ur": "سالانہ", "hi": "वार्षिक", "bn": "বার্ষিক", "fr": "Annuel"},
    "أسبوعي": {"en": "Weekly", "ur": "ہفتہ وار", "hi": "साप्ताहिक", "bn": "সাপ্তাহিক", "fr": "Hebdomadaire"},
    # --- Warranty ---
    "مع ضمان": {"en": "With Warranty", "ur": "وارنٹی کے ساتھ", "hi": "वारंटी के साथ", "bn": "ওয়ারেন্টি সহ", "fr": "Sous garantie"},
    "بدون ضمان": {"en": "No Warranty", "ur": "وارنٹی نہیں", "hi": "वारंटी नहीं", "bn": "ওয়ারেন্টি নেই", "fr": "Sans garantie"},
    "ضمان منتهي": {"en": "Expired Warranty", "ur": "وارنٹی ختم", "hi": "वारंटी समाप्त", "bn": "ওয়ারেন্টি শেষ", "fr": "Garantie expirée"},
    # --- Jobs ---
    "عرض وظيفة": {"en": "Job Offered", "ur": "ملازمت کی پیشکش", "hi": "नौकरी की पेशकश", "bn": "চাকরির অফার", "fr": "Offre d'emploi"},
    "باحث عن عمل": {"en": "Job Wanted", "ur": "ملازمت کی تلاش", "hi": "नौकरी की तलाश", "bn": "চাকরি প্রত্যাশী", "fr": "Recherche d'emploi"},
    "تقنية المعلومات": {"en": "IT", "ur": "آئی ٹی", "hi": "आईटी", "bn": "আইটি", "fr": "Informatique"},
    "هندسة": {"en": "Engineering", "ur": "انجینئرنگ", "hi": "इंजीनियरिंग", "bn": "ইঞ্জিনিয়ারিং", "fr": "Ingénierie"},
    "طب وصحة": {"en": "Healthcare", "ur": "صحت", "hi": "स्वास्थ्य", "bn": "স্বাস্থ্য", "fr": "Santé"},
    "تعليم": {"en": "Education", "ur": "تعلیم", "hi": "शिक्षा", "bn": "শিক্ষা", "fr": "Éducation"},
    "مبيعات وتسويق": {"en": "Sales & Marketing", "ur": "سیلز و مارکیٹنگ", "hi": "बिक्री और मार्केटिंग", "bn": "বিক্রয় ও বিপণন", "fr": "Ventes & Marketing"},
    "محاسبة ومالية": {"en": "Accounting & Finance", "ur": "اکاؤنٹنگ", "hi": "लेखा एवं वित्त", "bn": "হিসাবরক্ষণ ও অর্থ", "fr": "Comptabilité"},
    "موارد بشرية": {"en": "HR", "ur": "ایچ آر", "hi": "एचआर", "bn": "এইচআর", "fr": "Ressources humaines"},
    "قانون": {"en": "Legal", "ur": "قانون", "hi": "विधि", "bn": "আইন", "fr": "Juridique"},
    "إعلام": {"en": "Media", "ur": "میڈیا", "hi": "मीडिया", "bn": "মিডিয়া", "fr": "Médias"},
    "ضيافة": {"en": "Hospitality", "ur": "مہمان نوازی", "hi": "हॉस्पिटैलिटी", "bn": "আতিথেয়তা", "fr": "Hôtellerie"},
    "بناء": {"en": "Construction", "ur": "تعمیرات", "hi": "निर्माण", "bn": "নির্মাণ", "fr": "Construction"},
    "صناعة": {"en": "Manufacturing", "ur": "صنعت", "hi": "विनिर्माण", "bn": "উৎপাদন", "fr": "Industrie"},
    "نقل ولوجستيات": {"en": "Logistics", "ur": "نقل و حمل", "hi": "रसद", "bn": "পরিবহন", "fr": "Logistique"},
    "خدمة عملاء": {"en": "Customer Service", "ur": "کسٹمر سروس", "hi": "ग्राहक सेवा", "bn": "গ্রাহক সেবা", "fr": "Service client"},
    "إداري": {"en": "Administrative", "ur": "انتظامی", "hi": "प्रशासनिक", "bn": "প্রশাসনিক", "fr": "Administratif"},
    "بدون خبرة": {"en": "No Experience", "ur": "بغیر تجربہ", "hi": "बिना अनुभव", "bn": "অভিজ্ঞতা ছাড়া", "fr": "Sans expérience"},
    "1-2 سنة": {"en": "1-2 years", "ur": "1-2 سال", "hi": "1-2 साल", "bn": "১-২ বছর", "fr": "1-2 ans"},
    "3-5 سنوات": {"en": "3-5 years", "ur": "3-5 سال", "hi": "3-5 साल", "bn": "৩-৫ বছর", "fr": "3-5 ans"},
    "6-10 سنوات": {"en": "6-10 years", "ur": "6-10 سال", "hi": "6-10 साल", "bn": "৬-১০ বছর", "fr": "6-10 ans"},
    "أكثر من 10": {"en": "10+ years", "ur": "10 سال سے زیادہ", "hi": "10+ साल", "bn": "১০+ বছর", "fr": "10+ ans"},
    "ثانوي": {"en": "High School", "ur": "ہائی اسکول", "hi": "हाई स्कूल", "bn": "উচ্চ মাধ্যমিক", "fr": "Lycée"},
    "دبلوم": {"en": "Diploma", "ur": "ڈپلومہ", "hi": "डिप्लोमा", "bn": "ডিপ্লোমা", "fr": "Diplôme"},
    "بكالوريوس": {"en": "Bachelor", "ur": "بیچلر", "hi": "स्नातक", "bn": "স্নাতক", "fr": "Licence"},
    "ماجستير": {"en": "Master", "ur": "ماسٹرز", "hi": "स्नातकोत्तर", "bn": "স্নাতকোত্তর", "fr": "Master"},
    "دكتوراه": {"en": "PhD", "ur": "ڈاکٹریٹ", "hi": "पीएच.डी.", "bn": "পিএইচডি", "fr": "Doctorat"},
    "دوام كامل": {"en": "Full-time", "ur": "فل ٹائم", "hi": "पूर्णकालिक", "bn": "পূর্ণকালীন", "fr": "Temps plein"},
    "دوام جزئي": {"en": "Part-time", "ur": "پارٹ ٹائم", "hi": "अंशकालिक", "bn": "খণ্ডকালীন", "fr": "Temps partiel"},
    "عقد": {"en": "Contract", "ur": "کنٹریکٹ", "hi": "अनुबंध", "bn": "চুক্তি", "fr": "Contrat"},
    "تدريب": {"en": "Internship", "ur": "ٹریننگ", "hi": "इंटर्नशिप", "bn": "ইন্টার্নশিপ", "fr": "Stage"},
    "عمل حر / فريلانس": {"en": "Freelance", "ur": "فری لانس", "hi": "फ्रीलांस", "bn": "ফ্রিল্যান্স", "fr": "Freelance"},
    "عن بُعد": {"en": "Remote", "ur": "ریموٹ", "hi": "रिमोट", "bn": "রিমোট", "fr": "À distance"},
    "ذكر": {"en": "Male", "ur": "مرد", "hi": "पुरुष", "bn": "পুরুষ", "fr": "Homme"},
    "أنثى": {"en": "Female", "ur": "خاتون", "hi": "महिला", "bn": "নারী", "fr": "Femme"},
    "زوج": {"en": "Pair", "ur": "جوڑا", "hi": "जोड़ी", "bn": "জোড়া", "fr": "Paire"},
    # --- Services ---
    "سباكة": {"en": "Plumbing", "ur": "پلمبنگ", "hi": "नलसाज़ी", "bn": "প্লাম্বিং", "fr": "Plomberie"},
    "كهرباء": {"en": "Electrical", "ur": "بجلی", "hi": "बिजली", "bn": "বিদ্যুৎ", "fr": "Électricité"},
    "تكييف": {"en": "AC", "ur": "اے سی", "hi": "एसी", "bn": "এসি", "fr": "Climatisation"},
    "نظافة": {"en": "Cleaning", "ur": "صفائی", "hi": "सफाई", "bn": "পরিষ্কার", "fr": "Nettoyage"},
    "نقل عفش": {"en": "Moving", "ur": "منتقلی", "hi": "मूविंग", "bn": "স্থানান্তর", "fr": "Déménagement"},
    "سائق": {"en": "Driver", "ur": "ڈرائیور", "hi": "ड्राइवर", "bn": "চালক", "fr": "Chauffeur"},
    "توصيل": {"en": "Delivery", "ur": "ڈلیوری", "hi": "डिलीवरी", "bn": "ডেলিভারি", "fr": "Livraison"},
    "دهان": {"en": "Painting", "ur": "پینٹنگ", "hi": "पेंटिंग", "bn": "রঙ", "fr": "Peinture"},
    "نجارة": {"en": "Carpentry", "ur": "بڑھئی", "hi": "बढ़ईगीरी", "bn": "ছুতার", "fr": "Menuiserie"},
    "تدريس": {"en": "Tutoring", "ur": "ٹیوشن", "hi": "ट्यूशन", "bn": "টিউশন", "fr": "Tutorat"},
    "تجميل": {"en": "Beauty", "ur": "بیوٹی", "hi": "ब्यूटी", "bn": "সৌন্দর্য", "fr": "Beauté"},
    "تنظيم فعاليات": {"en": "Events", "ur": "تقریبات", "hi": "इवेंट्स", "bn": "ইভেন্ট", "fr": "Événements"},
    "صيانة أجهزة": {"en": "Tech Repair", "ur": "ٹیک مرمت", "hi": "तकनीकी मरम्मत", "bn": "যন্ত্র মেরামত", "fr": "Réparation"},
    "بستنة": {"en": "Gardening", "ur": "باغبانی", "hi": "बागवानी", "bn": "বাগান", "fr": "Jardinage"},
    "تكييف وتبريد": {"en": "AC & Cooling", "ur": "اے سی و کولنگ", "hi": "एसी और कूलिंग", "bn": "এসি ও শীতলীকরণ", "fr": "Clim & Réfrigération"},
    "بناء وترميم": {"en": "Construction & Renovation", "ur": "تعمیر و مرمت", "hi": "निर्माण और नवीनीकरण", "bn": "নির্মাণ ও সংস্কার", "fr": "Construction & Rénovation"},
    "دهانات": {"en": "Painting", "ur": "پینٹنگ", "hi": "पेंटिंग", "bn": "রঙ করা", "fr": "Peinture"},
    "صيانة كمبيوتر": {"en": "Computer Repair", "ur": "کمپیوٹر مرمت", "hi": "कंप्यूटर मरम्मत", "bn": "কম্পিউটার মেরামত", "fr": "Réparation PC"},
    "مرة واحدة": {"en": "One-time", "ur": "ایک بار", "hi": "एक बार", "bn": "একবার", "fr": "Une fois"},
    "حسب الطلب": {"en": "On demand", "ur": "آن ڈیمانڈ", "hi": "मांग पर", "bn": "চাহিদা অনুযায়ী", "fr": "À la demande"},
    "اشتراك دائم": {"en": "Subscription", "ur": "سبسکرپشن", "hi": "सब्सक्रिप्शन", "bn": "সাবস্ক্রিপশন", "fr": "Abonnement"},
    "بالساعة": {"en": "Per hour", "ur": "فی گھنٹہ", "hi": "प्रति घंटा", "bn": "প্রতি ঘণ্টা", "fr": "À l'heure"},
    "بالزيارة": {"en": "Per visit", "ur": "فی وزٹ", "hi": "प्रति दौरा", "bn": "প্রতি পরিদর্শন", "fr": "Par visite"},
    "بالقطعة/المهمة": {"en": "Per task", "ur": "فی کام", "hi": "प्रति कार्य", "bn": "প্রতি কাজ", "fr": "Par tâche"},
    "متر مربع": {"en": "Per m²", "ur": "فی مربع میٹر", "hi": "प्रति वर्ग मीटर", "bn": "প্রতি বর্গ মিটার", "fr": "Par m²"},
    "حسب الاتفاق": {"en": "Negotiable", "ur": "قابل گفتگو", "hi": "बातचीत योग्य", "bn": "আলোচনা সাপেক্ষ", "fr": "Négociable"},
    "مبتدئ": {"en": "Beginner", "ur": "ابتدائی", "hi": "शुरुआती", "bn": "শিক্ষানবিশ", "fr": "Débutant"},
    "1-3 سنوات": {"en": "1-3 years", "ur": "1-3 سال", "hi": "1-3 साल", "bn": "১-৩ বছর", "fr": "1-3 ans"},
    "4-7 سنوات": {"en": "4-7 years", "ur": "4-7 سال", "hi": "4-7 साल", "bn": "৪-৭ বছর", "fr": "4-7 ans"},
    "8+ سنوات": {"en": "8+ years", "ur": "8+ سال", "hi": "8+ साल", "bn": "৮+ বছর", "fr": "8+ ans"},
    "تقديم خدمة": {"en": "Offer Service", "ur": "سروس فراہم کریں", "hi": "सेवा प्रदान करें", "bn": "সেবা প্রদান", "fr": "Proposer service"},
    "طلب خدمة": {"en": "Request Service", "ur": "سروس درکار", "hi": "सेवा अनुरोध", "bn": "সেবা চাই", "fr": "Demander service"},
    # --- Furniture ---
    "كنب": {"en": "Sofa", "ur": "صوفہ", "hi": "सोफा", "bn": "সোফা", "fr": "Canapé"},
    "سرير": {"en": "Bed", "ur": "بستر", "hi": "बिस्तर", "bn": "বিছানা", "fr": "Lit"},
    "خزانة": {"en": "Wardrobe", "ur": "الماری", "hi": "अलमारी", "bn": "আলমারি", "fr": "Armoire"},
    "طاولة": {"en": "Table", "ur": "میز", "hi": "मेज़", "bn": "টেবিল", "fr": "Table"},
    "كراسي": {"en": "Chairs", "ur": "کرسیاں", "hi": "कुर्सियाँ", "bn": "চেয়ার", "fr": "Chaises"},
    "ركن": {"en": "Corner", "ur": "کارنر", "hi": "कॉर्नर", "bn": "কোনার", "fr": "Coin"},
    "تحفة": {"en": "Decor", "ur": "ڈیکور", "hi": "सजावट", "bn": "সাজসজ্জা", "fr": "Décor"},
    "سجاد": {"en": "Carpet", "ur": "قالین", "hi": "कालीन", "bn": "কার্পেট", "fr": "Tapis"},
    "ستائر": {"en": "Curtains", "ur": "پردے", "hi": "पर्दे", "bn": "পর্দা", "fr": "Rideaux"},
    "خشب": {"en": "Wood", "ur": "لکڑی", "hi": "लकड़ी", "bn": "কাঠ", "fr": "Bois"},
    "معدن": {"en": "Metal", "ur": "دھات", "hi": "धातु", "bn": "ধাতু", "fr": "Métal"},
    "قماش": {"en": "Fabric", "ur": "کپڑا", "hi": "कपड़ा", "bn": "কাপড়", "fr": "Tissu"},
    "جلد": {"en": "Leather", "ur": "چمڑا", "hi": "चमड़ा", "bn": "চামড়া", "fr": "Cuir"},
    "بلاستيك": {"en": "Plastic", "ur": "پلاسٹک", "hi": "प्लास्टिक", "bn": "প্লাস্টিক", "fr": "Plastique"},
    # --- Books ---
    "عربي": {"en": "Arabic", "ur": "عربی", "hi": "अरबी", "bn": "আরবি", "fr": "Arabe"},
    "إنجليزي": {"en": "English", "ur": "انگریزی", "hi": "अंग्रेज़ी", "bn": "ইংরেজি", "fr": "Anglais"},
    # --- Currencies ---
    "ر.س": {"en": "SAR", "ur": "ریال", "hi": "रियाल", "bn": "রিয়াল", "fr": "SAR"},
    "د.إ": {"en": "AED", "ur": "درہم", "hi": "दिरहम", "bn": "দিরহাম", "fr": "AED"},
    "د.ك": {"en": "KWD", "ur": "دینار", "hi": "दिनार", "bn": "দিনার", "fr": "KWD"},
    "ر.ق": {"en": "QAR", "ur": "ریال", "hi": "रियाल", "bn": "রিয়াল", "fr": "QAR"},
    "د.ب": {"en": "BHD", "ur": "دینار", "hi": "दिनार", "bn": "দিনার", "fr": "BHD"},
    "ر.ع": {"en": "OMR", "ur": "ریال", "hi": "रियाल", "bn": "রিয়াল", "fr": "OMR"},
    # --- Age ranges (kids) ---
    "0-1 سنة": {"en": "0-1 year", "ur": "0-1 سال", "hi": "0-1 साल", "bn": "০-১ বছর", "fr": "0-1 an"},
    "1-3 سنوات": {"en": "1-3 years", "ur": "1-3 سال", "hi": "1-3 साल", "bn": "১-৩ বছর", "fr": "1-3 ans"},
    "3-5 سنوات": {"en": "3-5 years", "ur": "3-5 سال", "hi": "3-5 साल", "bn": "৩-৫ বছর", "fr": "3-5 ans"},
    "5-10 سنوات": {"en": "5-10 years", "ur": "5-10 سال", "hi": "5-10 साल", "bn": "৫-১০ বছর", "fr": "5-10 ans"},
    "10+": {"en": "10+", "ur": "10+", "hi": "10+", "bn": "১০+", "fr": "10+"},
    # --- Car brands (most stay Latin, translate Arabic ones) ---
    "تويوتا": {"en": "Toyota", "ur": "ٹویوٹا", "hi": "टोयोटा", "bn": "টয়োটা", "fr": "Toyota"},
    "نيسان": {"en": "Nissan", "ur": "نسان", "hi": "निसान", "bn": "নিসান", "fr": "Nissan"},
    "هوندا": {"en": "Honda", "ur": "ہونڈا", "hi": "होंडा", "bn": "হোন্ডা", "fr": "Honda"},
    "هيونداي": {"en": "Hyundai", "ur": "ہنڈائی", "hi": "हुंडई", "bn": "হুন্ডাই", "fr": "Hyundai"},
    "كيا": {"en": "Kia", "ur": "کیا", "hi": "किआ", "bn": "কিয়া", "fr": "Kia"},
    "مرسيدس": {"en": "Mercedes", "ur": "مرسڈیز", "hi": "मर्सिडीज़", "bn": "মার্সিডিজ", "fr": "Mercedes"},
    "أودي": {"en": "Audi", "ur": "آڈی", "hi": "ऑडी", "bn": "অডি", "fr": "Audi"},
    "لكزس": {"en": "Lexus", "ur": "لیکسس", "hi": "लेक्सस", "bn": "লেক্সাস", "fr": "Lexus"},
    "فورد": {"en": "Ford", "ur": "فورڈ", "hi": "फोर्ड", "bn": "ফোর্ড", "fr": "Ford"},
    "شفروليه": {"en": "Chevrolet", "ur": "شیورلیٹ", "hi": "शेवरले", "bn": "শেভ্রোলেট", "fr": "Chevrolet"},
    "دودج": {"en": "Dodge", "ur": "ڈاج", "hi": "डॉज", "bn": "ডজ", "fr": "Dodge"},
    "كرايسلر": {"en": "Chrysler", "ur": "کرائسلر", "hi": "क्राइस्लर", "bn": "ক্রাইসলার", "fr": "Chrysler"},
    "جيب": {"en": "Jeep", "ur": "جیپ", "hi": "जीप", "bn": "জিপ", "fr": "Jeep"},
    "كاديلاك": {"en": "Cadillac", "ur": "کیڈلک", "hi": "कैडिलैक", "bn": "ক্যাডিলাক", "fr": "Cadillac"},
    "لينكولن": {"en": "Lincoln", "ur": "لنکن", "hi": "लिंकन", "bn": "লিংকন", "fr": "Lincoln"},
    "بيوك": {"en": "Buick", "ur": "بیوک", "hi": "बुइक", "bn": "বুইক", "fr": "Buick"},
    "بنتلي": {"en": "Bentley", "ur": "بنٹلے", "hi": "बेंटले", "bn": "বেন্টলি", "fr": "Bentley"},
    "رولز رويس": {"en": "Rolls-Royce", "ur": "رولز رائس", "hi": "रोल्स-रॉयस", "bn": "রোলস-রয়েস", "fr": "Rolls-Royce"},
    "فيراري": {"en": "Ferrari", "ur": "فراری", "hi": "फेरारी", "bn": "ফেরারি", "fr": "Ferrari"},
    "لامبورغيني": {"en": "Lamborghini", "ur": "لیمبرگینی", "hi": "लम्बोर्गिनी", "bn": "লাম্বরগিনি", "fr": "Lamborghini"},
    "بورش": {"en": "Porsche", "ur": "پورشے", "hi": "पोर्श", "bn": "পোর্শে", "fr": "Porsche"},
    "مازيراتي": {"en": "Maserati", "ur": "مازیراتی", "hi": "मासेराती", "bn": "মাসেরাতি", "fr": "Maserati"},
    "أستون مارتن": {"en": "Aston Martin", "ur": "ایسٹن مارٹن", "hi": "एस्टन मार्टिन", "bn": "অ্যাস্টন মার্টিন", "fr": "Aston Martin"},
    "جاكوار": {"en": "Jaguar", "ur": "جیگوار", "hi": "जैगुआर", "bn": "জাগুয়ার", "fr": "Jaguar"},
    "لاند روفر": {"en": "Land Rover", "ur": "لینڈ روور", "hi": "लैंड रोवर", "bn": "ল্যান্ড রোভার", "fr": "Land Rover"},
    "فولفو": {"en": "Volvo", "ur": "والوو", "hi": "वोल्वो", "bn": "ভলভো", "fr": "Volvo"},
    "ميتسوبيشي": {"en": "Mitsubishi", "ur": "متسوبشی", "hi": "मित्सुबिशी", "bn": "মিৎসুবিশি", "fr": "Mitsubishi"},
    "سوزوكي": {"en": "Suzuki", "ur": "سوزوکی", "hi": "सुज़ुकी", "bn": "সুজুকি", "fr": "Suzuki"},
    "إنفينيتي": {"en": "Infiniti", "ur": "انفینیٹی", "hi": "इन्फिनिटी", "bn": "ইনফিনিটি", "fr": "Infiniti"},
    "أكورا": {"en": "Acura", "ur": "ایکورا", "hi": "एक्यूरा", "bn": "একিউরা", "fr": "Acura"},
    "تسلا": {"en": "Tesla", "ur": "ٹیسلا", "hi": "टेस्ला", "bn": "টেসলা", "fr": "Tesla"},
    "جيلي": {"en": "Geely", "ur": "گیلی", "hi": "जीली", "bn": "জিলি", "fr": "Geely"},
    "شيري": {"en": "Chery", "ur": "چیری", "hi": "चेरी", "bn": "চেরি", "fr": "Chery"},
    "هافال": {"en": "Haval", "ur": "حوال", "hi": "हवल", "bn": "হাভাল", "fr": "Haval"},
    "جينيسيس": {"en": "Genesis", "ur": "جینیسس", "hi": "जेनेसिस", "bn": "জেনেসিস", "fr": "Genesis"},
    "ماكلارين": {"en": "McLaren", "ur": "میک لارن", "hi": "मैक्लारेन", "bn": "ম্যাকলারেন", "fr": "McLaren"},
    "بوغاتي": {"en": "Bugatti", "ur": "بوگاٹی", "hi": "बुगाटी", "bn": "বুগাটি", "fr": "Bugatti"},
}


# Category name translations (top-level categories + their subcategories)
CATEGORY_I18N: Dict[str, Dict[str, str]] = {
    # Main categories
    "السيارات": {"en": "Cars", "ur": "گاڑیاں", "hi": "कारें", "bn": "গাড়ি", "fr": "Voitures"},
    "العقار": {"en": "Real Estate", "ur": "جائیداد", "hi": "रियल एस्टेट", "bn": "রিয়েল এস্টেট", "fr": "Immobilier"},
    "إلكترونيات": {"en": "Electronics", "ur": "الیکٹرانکس", "hi": "इलेक्ट्रॉनिक्स", "bn": "ইলেকট্রনিক্স", "fr": "Électronique"},
    "وظائف": {"en": "Jobs", "ur": "ملازمتیں", "hi": "नौकरियाँ", "bn": "চাকরি", "fr": "Emplois"},
    "خدمات": {"en": "Services", "ur": "خدمات", "hi": "सेवाएँ", "bn": "সেবা", "fr": "Services"},
    "الأثاث": {"en": "Furniture", "ur": "فرنیچر", "hi": "फर्नीचर", "bn": "আসবাবপত্র", "fr": "Mobilier"},
    "مواشي وحيوانات": {"en": "Livestock & Pets", "ur": "مویشی و پالتو", "hi": "पशुधन एवं पालतू", "bn": "গবাদিপশু ও পোষা", "fr": "Bétail & Animaux"},
    "شخصية": {"en": "Personal", "ur": "ذاتی", "hi": "व्यक्तिगत", "bn": "ব্যক্তিগত", "fr": "Personnel"},
    "مزادات": {"en": "Auctions", "ur": "نیلامیاں", "hi": "नीलामी", "bn": "নিলাম", "fr": "Enchères"},
    "كتب": {"en": "Books", "ur": "کتابیں", "hi": "किताबें", "bn": "বই", "fr": "Livres"},
    "ألعاب": {"en": "Games", "ur": "گیمز", "hi": "खेल", "bn": "গেমস", "fr": "Jeux"},
    "نباتات وحدائق": {"en": "Garden", "ur": "باغ", "hi": "बगीचा", "bn": "বাগান", "fr": "Jardin"},
    "رياضة": {"en": "Sports", "ur": "کھیل", "hi": "खेल", "bn": "খেলাধুলা", "fr": "Sports"},
    "أطفال ورضع": {"en": "Kids & Babies", "ur": "بچے", "hi": "बच्चे", "bn": "শিশু", "fr": "Enfants"},
    "كل الحراج": {"en": "Everything Else", "ur": "سب کچھ", "hi": "अन्य सभी", "bn": "সব কিছু", "fr": "Tout le reste"},
    # Subcategories
    "سيارات مستعملة": {"en": "Used Cars", "ur": "استعمال شدہ گاڑیاں", "hi": "इस्तेमाल की गई कारें", "bn": "ব্যবহৃত গাড়ি", "fr": "Voitures d'occasion"},
    "سيارات جديدة": {"en": "New Cars", "ur": "نئی گاڑیاں", "hi": "नई कारें", "bn": "নতুন গাড়ি", "fr": "Voitures neuves"},
    "شاحنات ومعدات ثقيلة": {"en": "Trucks & Heavy", "ur": "ٹرک", "hi": "ट्रक", "bn": "ট্রাক", "fr": "Camions"},
    "قطع غيار": {"en": "Spare Parts", "ur": "اسپیئر پارٹس", "hi": "स्पेयर पार्ट्स", "bn": "যন্ত্রাংশ", "fr": "Pièces détachées"},
    "إكسسوارات": {"en": "Accessories", "ur": "لوازمات", "hi": "एक्सेसरीज़", "bn": "আনুষাঙ্গিক", "fr": "Accessoires"},
    "خدمات السيارات": {"en": "Car Services", "ur": "کار سروسز", "hi": "कार सेवाएँ", "bn": "গাড়ি সেবা", "fr": "Services auto"},
    "لوحات مميزة": {"en": "Plates", "ur": "نمبر پلیٹس", "hi": "नंबर प्लेट", "bn": "নম্বর প্লেট", "fr": "Plaques"},
    "شقق للإيجار": {"en": "Apartments for Rent", "ur": "اپارٹمنٹ کرایہ", "hi": "किराये के अपार्टमेंट", "bn": "ভাড়ার অ্যাপার্টমেন্ট", "fr": "Appartements à louer"},
    "شقق للبيع": {"en": "Apartments for Sale", "ur": "اپارٹمنٹ فروخت", "hi": "बिक्री के अपार्टमेंट", "bn": "বিক্রয়ের অ্যাপার্টমেন্ট", "fr": "Appartements à vendre"},
    "فلل للإيجار": {"en": "Villas for Rent", "ur": "ولا کرایہ", "hi": "किराये के विला", "bn": "ভাড়ার ভিলা", "fr": "Villas à louer"},
    "فلل للبيع": {"en": "Villas for Sale", "ur": "ولا فروخت", "hi": "बिक्री के विला", "bn": "বিক্রয়ের ভিলা", "fr": "Villas à vendre"},
    "أراضي": {"en": "Land", "ur": "زمینیں", "hi": "ज़मीन", "bn": "জমি", "fr": "Terrains"},
    "تجاري": {"en": "Commercial", "ur": "تجارتی", "hi": "वाणिज्यिक", "bn": "বাণিজ্যিক", "fr": "Commercial"},
    "مزارع واستراحات": {"en": "Farms & Rest Houses", "ur": "فارمز", "hi": "खेत", "bn": "খামার", "fr": "Fermes"},
    "جوالات": {"en": "Mobiles", "ur": "موبائل", "hi": "मोबाइल", "bn": "মোবাইল", "fr": "Mobiles"},
    "حاسبات": {"en": "Laptops", "ur": "لیپ ٹاپس", "hi": "लैपटॉप", "bn": "ল্যাপটপ", "fr": "Ordinateurs"},
    "تابلت": {"en": "Tablets", "ur": "ٹیبلٹس", "hi": "टैबलेट", "bn": "ট্যাবলেট", "fr": "Tablettes"},
    "سماعات": {"en": "Audio", "ur": "آڈیو", "hi": "ऑडियो", "bn": "অডিও", "fr": "Audio"},
    "تلفزيونات": {"en": "TVs", "ur": "ٹی وی", "hi": "टीवी", "bn": "টিভি", "fr": "Téléviseurs"},
    "أجهزة كهربائية": {"en": "Appliances", "ur": "آلات", "hi": "उपकरण", "bn": "যন্ত্রপাতি", "fr": "Électroménager"},
    "ألعاب إلكترونية": {"en": "Gaming", "ur": "گیمنگ", "hi": "गेमिंग", "bn": "গেমিং", "fr": "Jeux vidéo"},
    "مجالس ومفروشات": {"en": "Majlis", "ur": "مجلس", "hi": "मजलिस", "bn": "মজলিস", "fr": "Majlis"},
    "غرف نوم": {"en": "Bedroom", "ur": "بیڈ روم", "hi": "बेडरूम", "bn": "শয়নকক্ষ", "fr": "Chambre"},
    "طاولات وكراسي": {"en": "Tables & Chairs", "ur": "میز و کرسیاں", "hi": "मेज़ और कुर्सियाँ", "bn": "টেবিল ও চেয়ার", "fr": "Tables & Chaises"},
    "خزائن": {"en": "Wardrobes", "ur": "الماریاں", "hi": "अलमारी", "bn": "আলমারি", "fr": "Armoires"},
    "أثاث مطبخ": {"en": "Kitchen", "ur": "کچن", "hi": "रसोई", "bn": "রান্নাঘর", "fr": "Cuisine"},
    "تحف وديكور": {"en": "Decor", "ur": "ڈیکور", "hi": "सजावट", "bn": "সাজসজ্জা", "fr": "Décor"},
    "أثاث مكتبي": {"en": "Office Furniture", "ur": "آفس فرنیچر", "hi": "ऑफिस फर्नीचर", "bn": "অফিস আসবাব", "fr": "Mobilier de bureau"},
    "إبل": {"en": "Camels", "ur": "اونٹ", "hi": "ऊँट", "bn": "উট", "fr": "Chameaux"},
    "خيل": {"en": "Horses", "ur": "گھوڑے", "hi": "घोड़े", "bn": "ঘোড়া", "fr": "Chevaux"},
    "غنم وماعز": {"en": "Sheep & Goats", "ur": "بھیڑ بکریاں", "hi": "भेड़ बकरी", "bn": "ভেড়া ছাগল", "fr": "Moutons & Chèvres"},
    "أبقار": {"en": "Cattle", "ur": "گائے", "hi": "गाय", "bn": "গরু", "fr": "Bovins"},
    "طيور": {"en": "Birds", "ur": "پرندے", "hi": "पक्षी", "bn": "পাখি", "fr": "Oiseaux"},
    "قطط": {"en": "Cats", "ur": "بلیاں", "hi": "बिल्लियाँ", "bn": "বিড়াল", "fr": "Chats"},
    "كلاب": {"en": "Dogs", "ur": "کتے", "hi": "कुत्ते", "bn": "কুকুর", "fr": "Chiens"},
    "أسماك": {"en": "Fish", "ur": "مچھلی", "hi": "मछली", "bn": "মাছ", "fr": "Poissons"},
    "أرانب": {"en": "Rabbits", "ur": "خرگوش", "hi": "खरगोश", "bn": "খরগোশ", "fr": "Lapins"},
    "مستلزمات": {"en": "Supplies", "ur": "لوازمات", "hi": "आपूर्ति", "bn": "সরবরাহ", "fr": "Fournitures"},
    "ملابس رجالية": {"en": "Men's Clothing", "ur": "مردانہ کپڑے", "hi": "पुरुषों के कपड़े", "bn": "পুরুষ পোশাক", "fr": "Vêtements hommes"},
    "ملابس نسائية": {"en": "Women's Clothing", "ur": "خواتین کے کپڑے", "hi": "महिलाओं के कपड़े", "bn": "মহিলা পোশাক", "fr": "Vêtements femmes"},
    "ملابس أطفال": {"en": "Kids' Clothing", "ur": "بچوں کے کپڑے", "hi": "बच्चों के कपड़े", "bn": "শিশু পোশাক", "fr": "Vêtements enfants"},
    "عطور": {"en": "Perfumes", "ur": "عطر", "hi": "इत्र", "bn": "সুগন্ধি", "fr": "Parfums"},
    "ساعات": {"en": "Watches", "ur": "گھڑیاں", "hi": "घड़ियाँ", "bn": "ঘড়ি", "fr": "Montres"},
    "مجوهرات": {"en": "Jewelry", "ur": "زیورات", "hi": "गहने", "bn": "গহনা", "fr": "Bijoux"},
    "حقائب": {"en": "Bags", "ur": "بیگز", "hi": "बैग", "bn": "ব্যাগ", "fr": "Sacs"},
    "أحذية": {"en": "Shoes", "ur": "جوتے", "hi": "जूते", "bn": "জুতা", "fr": "Chaussures"},
    "نظارات": {"en": "Glasses", "ur": "عینکیں", "hi": "चश्मा", "bn": "চশমা", "fr": "Lunettes"},
    "مزاد سيارات": {"en": "Cars Auction", "ur": "گاڑیوں کی نیلامی", "hi": "कार नीलामी", "bn": "গাড়ি নিলাম", "fr": "Enchères voitures"},
    "مزاد عقارات": {"en": "Real Estate Auction", "ur": "جائیداد نیلامی", "hi": "रियल एस्टेट नीलामी", "bn": "সম্পত্তি নিলাম", "fr": "Enchères immobilier"},
    "تحف ومقتنيات": {"en": "Antiques", "ur": "نوادرات", "hi": "प्राचीन वस्तुएँ", "bn": "প্রাচীন সামগ্রী", "fr": "Antiquités"},
    "نوادر": {"en": "Rare Items", "ur": "نوادر", "hi": "दुर्लभ", "bn": "বিরল", "fr": "Rares"},
    "كتب دراسية": {"en": "Academic", "ur": "تعلیمی", "hi": "अकादमिक", "bn": "একাডেমিক", "fr": "Académique"},
    "كتب دينية": {"en": "Religious", "ur": "مذہبی", "hi": "धार्मिक", "bn": "ধর্মীয়", "fr": "Religieux"},
    "روايات": {"en": "Novels", "ur": "ناولز", "hi": "उपन्यास", "bn": "উপন্যাস", "fr": "Romans"},
    "مجلات": {"en": "Magazines", "ur": "میگزین", "hi": "पत्रिकाएँ", "bn": "ম্যাগাজিন", "fr": "Magazines"},
    "أجهزة ألعاب": {"en": "Consoles", "ur": "گیم کنسولز", "hi": "गेम कंसोल", "bn": "গেম কনসোল", "fr": "Consoles"},
    "ألعاب فيديو": {"en": "Video Games", "ur": "ویڈیو گیمز", "hi": "वीडियो गेम", "bn": "ভিডিও গেম", "fr": "Jeux vidéo"},
    "ألعاب أطفال": {"en": "Toys", "ur": "کھلونے", "hi": "खिलौने", "bn": "খেলনা", "fr": "Jouets"},
    "ألعاب طاولة": {"en": "Board Games", "ur": "بورڈ گیمز", "hi": "बोर्ड गेम", "bn": "বোর্ড গেম", "fr": "Jeux de société"},
    "نباتات": {"en": "Plants", "ur": "پودے", "hi": "पौधे", "bn": "গাছ", "fr": "Plantes"},
    "أدوات حدائق": {"en": "Garden Tools", "ur": "باغ کے اوزار", "hi": "बगीचे के औज़ार", "bn": "বাগানের সরঞ্জাম", "fr": "Outils de jardin"},
    "أثاث خارجي": {"en": "Outdoor Furniture", "ur": "بیرونی فرنیچر", "hi": "बाहरी फर्नीचर", "bn": "বাইরের আসবাব", "fr": "Mobilier extérieur"},
    "أجهزة رياضية": {"en": "Fitness", "ur": "فٹنس", "hi": "फिटनेस", "bn": "ফিটনেস", "fr": "Fitness"},
    "دراجات": {"en": "Bicycles", "ur": "سائیکلیں", "hi": "साइकिल", "bn": "সাইকেল", "fr": "Vélos"},
    "تخييم ورحلات": {"en": "Outdoor", "ur": "آؤٹ ڈور", "hi": "आउटडोर", "bn": "আউটডোর", "fr": "Plein air"},
    "رياضات جماعية": {"en": "Team Sports", "ur": "ٹیم اسپورٹس", "hi": "टीम स्पोर्ट्स", "bn": "টিম খেলা", "fr": "Sports d'équipe"},
    "مستلزمات رضع": {"en": "Baby Gear", "ur": "بچوں کا سامان", "hi": "बच्चों का सामान", "bn": "শিশুর সামগ্রী", "fr": "Équipement bébé"},
    "أثاث أطفال": {"en": "Kids Furniture", "ur": "بچوں کا فرنیچر", "hi": "बच्चों का फर्नीचर", "bn": "শিশু আসবাব", "fr": "Mobilier enfant"},
    "متفرقات": {"en": "Misc", "ur": "متفرق", "hi": "विविध", "bn": "বিবিধ", "fr": "Divers"},
    "نقل وعفش": {"en": "Moving", "ur": "منتقلی", "hi": "मूविंग", "bn": "স্থানান্তর", "fr": "Déménagement"},
    "سائقين": {"en": "Drivers", "ur": "ڈرائیورز", "hi": "ड्राइवर", "bn": "চালক", "fr": "Chauffeurs"},
    "توصيل ونقل": {"en": "Delivery", "ur": "ڈلیوری", "hi": "डिलीवरी", "bn": "ডেলিভারি", "fr": "Livraison"},
    "تدريس خصوصي": {"en": "Tutoring", "ur": "ٹیوشن", "hi": "ट्यूशन", "bn": "টিউশন", "fr": "Tutorat"},
}


def t_option(text: str, lang: str) -> str:
    """Translate a single dropdown option."""
    if not text:
        return text
    if lang == "ar":
        return text
    entry = OPTIONS_I18N.get(text)
    if not entry:
        return text  # fallback to original (often already in English/Latin)
    return entry.get(lang) or entry.get("en") or text


def t_category(text: str, lang: str) -> str:
    """Translate a category/subcategory name."""
    if not text or lang == "ar":
        return text
    entry = CATEGORY_I18N.get(text)
    if not entry:
        return text
    return entry.get(lang) or entry.get("en") or text


def localize_categories(categories: list, lang: str) -> list:
    """Return a deep-copied categories list with `name`, `subcategories[].name`,
    `fields[].label`, and `fields[].options[]` translated to `lang`.

    The original `name_ar` / `name_en` / `label_ar` / `label_en` are preserved
    so older clients keep working.
    """
    if lang == "ar":
        # Fast path — return as-is with `name`/`label` aliases for parity
        return [_inject_aliases(c, "ar") for c in categories]
    out = []
    for c in categories:
        nc = {**c}
        nc["name"] = t_category(c.get("name_ar", ""), lang) or c.get("name_en", "")
        nc["subcategories"] = [
            {**s, "name": t_category(s.get("name_ar", ""), lang) or s.get("name_en", "")}
            for s in c.get("subcategories", [])
        ]
        nc["fields"] = []
        for f in c.get("fields", []):
            nf = {**f}
            # Label
            ar_label = f.get("label_ar", "")
            en_label = f.get("label_en", "")
            nf["label"] = t_option(ar_label, lang) if ar_label in OPTIONS_I18N else (en_label or ar_label)
            # Options
            if isinstance(f.get("options"), list):
                nf["options"] = [t_option(opt, lang) for opt in f["options"]]
                # Also send original Arabic so the form posts the canonical key
                nf["options_ar"] = list(f["options"])
            nc["fields"].append(nf)
        out.append(nc)
    return out


def _inject_aliases(c: dict, lang: str) -> dict:
    """Even when lang=ar, add a `name` field so frontend code can always read `cat.name`."""
    nc = {**c}
    nc["name"] = c.get("name_ar", "")
    nc["subcategories"] = [{**s, "name": s.get("name_ar", "")} for s in c.get("subcategories", [])]
    nc["fields"] = []
    for f in c.get("fields", []):
        nf = {**f, "label": f.get("label_ar", "")}
        if isinstance(f.get("options"), list):
            nf["options_ar"] = list(f["options"])
        nc["fields"].append(nf)
    return nc
