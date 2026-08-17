import { createContext, useContext, useEffect, useState } from "react";
import AUTO_TRANSLATIONS from "@/auto_translations.json";

const I18nCtx = createContext(null);

const TRANSLATIONS = {
    ar: {
        site_name: "الحراج بلس", tagline: "بيع و اشتري أي شيء",
        nav_home: "الرئيسية", nav_search: "بحث", nav_post: "إعلان", nav_messages: "الرسائل", nav_profile: "حسابي",
        cta_post: "أنشر إعلانك", cta_explore: "تصفّح الأقسام",
        sec_categories: "الأقسام", sec_categories_sub: "اختر الفئة قبل النشر",
        sec_nearby: "قريب منك", sec_nearby_sub: "إعلانات في مدينتك ومدن قريبة",
        sec_stories: "قصص حية",
        login: "تسجيل الدخول", register: "إنشاء حساب", logout: "خروج",
        email: "البريد الإلكتروني", password: "كلمة المرور", forgot_password: "نسيت كلمة المرور؟", reset_password: "إعادة تعيين",
        name: "الاسم الكامل", phone: "رقم الجوال", country: "الدولة", city: "المدينة",
        already_have_account: "لديك حساب؟", no_account: "ليس لديك حساب؟",
        post_title: "نشر إعلان جديد", choose_category: "اختر الفئة أولاً",
        listing_details: "تفاصيل الإعلان", upload_media: "ارفع الصور والفيديو",
        title: "العنوان", description: "الوصف", price: "السعر",
        publish: "نشر الإعلان", cancel: "إلغاء", next: "التالي", back: "رجوع",
        all_categories: "جميع الأقسام", view_all: "عرض الكل",
        search_placeholder: "ابحث عن أي شيء... (AI)",
        call: "اتصال", whatsapp: "واتساب", message: "مراسلة", chat_inapp: "مراسلة داخل التطبيق",
        similar_listings: "منتجات مماثلة", admin_panel: "لوحة الإدارة", ad_label: "إعلان مدفوع",
        not_available: "غير متاح حالياً", verified: "موثّق", good_price: "صفقة جيدة", ai_smart: "تحليل ذكي",
        loading: "جاري التحميل...", no_results: "لا توجد نتائج",
        my_listings: "إعلاناتي", favorites: "المفضلة",
        seller_info: "معلومات البائع", joined: "انضم في",
        show_phone: "إظهار رقم الجوال للمشترين", location_on_map: "الموقع على الخريطة",
        save: "حفظ", use_my_location: "استخدام موقعي الحالي",
        disclaimer_short: "تنبيه أمان",
        disclaimer_text: "الحراج بلس وسيط فقط لربط البائع بالمشتري ولا نتلقى أي مدفوعات. يُرجى توخي الحذر، التحقق من المنتج، والمقابلة في أماكن عامة آمنة عند إتمام الصفقة.",
        forgot_email_sent: "إذا كان البريد مسجلاً، تم إرسال رابط الاستعادة",
        new_password: "كلمة المرور الجديدة",
        referral_program: "برنامج الإحالة",
        your_referral_code: "كود الإحالة الخاص بك",
        invited_count: "عدد المدعوين",
        copy_link: "نسخ الرابط",
        view_layout: "طريقة العرض", layout_grid: "شبكة", layout_wide: "عريض",
        ai_price_suggest: "اقتراح السعر بالذكاء الاصطناعي",
        camera: "الكاميرا", gallery: "المعرض",
        zoom_in: "تكبير", zoom_out: "تصغير", close: "إغلاق",
        premium_locked: "🔒 الباقات المدفوعة معطلة — جميع الميزات مجانية حالياً",
        Coins: "Coins", "تستخدم Coins لترويج إعلاناتك": "تستخدم Coins لترويج إعلاناتك", "آخر حركة": "آخر حركة",
    },
    en: {
        site_name: "Haraj Plus", tagline: "Sell & Buy Anything",
        nav_home: "Home", nav_search: "Search", nav_post: "Post", nav_messages: "Messages", nav_profile: "Profile",
        cta_post: "Post Your Ad", cta_explore: "Browse Categories",
        sec_categories: "Categories", sec_categories_sub: "Choose category before posting",
        sec_nearby: "Near You", sec_nearby_sub: "Listings in your city and nearby",
        sec_stories: "Live Stories",
        login: "Login", register: "Sign Up", logout: "Logout",
        email: "Email", password: "Password", forgot_password: "Forgot password?", reset_password: "Reset Password",
        name: "Full Name", phone: "Phone", country: "Country", city: "City",
        already_have_account: "Have an account?", no_account: "No account?",
        post_title: "Post New Listing", choose_category: "Choose category first",
        listing_details: "Listing Details", upload_media: "Upload Photos & Videos",
        title: "Title", description: "Description", price: "Price",
        publish: "Publish Listing", cancel: "Cancel", next: "Next", back: "Back",
        all_categories: "All Categories", view_all: "View All",
        search_placeholder: "Search anything... (AI)",
        call: "Call", whatsapp: "WhatsApp", message: "Message", chat_inapp: "In-App Message",
        similar_listings: "Similar Listings", admin_panel: "Admin Panel", ad_label: "Sponsored",
        not_available: "Not Available", verified: "Verified", good_price: "Good Deal", ai_smart: "AI Insight",
        loading: "Loading...", no_results: "No results",
        my_listings: "My Listings", favorites: "Favorites",
        seller_info: "Seller Info", joined: "Joined",
        show_phone: "Show phone to buyers", location_on_map: "Location on Map",
        save: "Save", use_my_location: "Use my current location",
        disclaimer_short: "Safety Notice",
        disclaimer_text: "Haraj Plus is only a marketplace platform connecting buyers and sellers. We do NOT process payments. Please verify the product, meet in public safe places, and exercise caution when completing the deal.",
        forgot_email_sent: "If email is registered, a reset link has been sent",
        new_password: "New Password",
        referral_program: "Referral Program",
        your_referral_code: "Your Referral Code",
        invited_count: "Invited Friends",
        copy_link: "Copy Link",
        view_layout: "Layout", layout_grid: "Grid", layout_wide: "Wide",
        ai_price_suggest: "AI Price Suggestion",
        camera: "Camera", gallery: "Gallery",
        zoom_in: "Zoom In", zoom_out: "Zoom Out", close: "Close",
        premium_locked: "🔒 Premium packages disabled — all features free for now",
        Coins: "Coins", "تستخدم Coins لترويج إعلاناتك": "Use Coins to boost your listings", "آخر حركة": "Latest activity",
    },
    ur: {
        site_name: "حراج پلس", tagline: "خریدیں اور بیچیں",
        nav_home: "ہوم", nav_search: "تلاش", nav_post: "اشتہار", nav_messages: "پیغامات", nav_profile: "پروفائل",
        cta_post: "اشتہار شائع کریں", cta_explore: "زمرے دیکھیں",
        sec_categories: "زمرے", sec_categories_sub: "زمرہ منتخب کریں",
        sec_nearby: "آپ کے قریب", sec_nearby_sub: "آپ کے شہر کے اشتہارات",
        sec_stories: "لائیو کہانیاں",
        login: "لاگ ان", register: "رجسٹر", logout: "لاگ آؤٹ",
        email: "ای میل", password: "پاس ورڈ", forgot_password: "پاس ورڈ بھول گئے؟", reset_password: "ری سیٹ کریں",
        name: "نام", phone: "فون", country: "ملک", city: "شہر",
        already_have_account: "اکاؤنٹ ہے؟", no_account: "اکاؤنٹ نہیں؟",
        post_title: "نیا اشتہار", choose_category: "زمرہ منتخب کریں",
        listing_details: "تفصیلات", upload_media: "تصاویر اپلوڈ",
        title: "عنوان", description: "تفصیل", price: "قیمت",
        publish: "شائع کریں", cancel: "منسوخ", next: "اگلا", back: "واپس",
        all_categories: "تمام", view_all: "سب",
        search_placeholder: "تلاش کریں...",
        call: "کال", whatsapp: "واٹس ایپ", message: "پیغام", chat_inapp: "ایپ میں پیغام",
        similar_listings: "ملتے جلتے اشتہارات", admin_panel: "ایڈمن پینل", ad_label: "اشتہار",
        not_available: "دستیاب نہیں", verified: "تصدیق شدہ", good_price: "اچھی قیمت", ai_smart: "AI تجزیہ",
        loading: "لوڈ ہو رہا ہے...", no_results: "کوئی نتیجہ نہیں",
        my_listings: "میرے اشتہارات", favorites: "پسندیدہ",
        seller_info: "بائع معلومات", joined: "شامل ہوا",
        show_phone: "فون نمبر دکھائیں", location_on_map: "نقشے پر مقام",
        save: "محفوظ کریں", use_my_location: "میرا موجودہ مقام",
        disclaimer_short: "حفاظتی نوٹ",
        disclaimer_text: "حراج پلس صرف خریدار اور فروخت کنندہ کو ملاتا ہے۔ ہم رقم وصول نہیں کرتے۔ احتیاط برتیں اور عوامی محفوظ مقام پر ملاقات کریں۔",
        forgot_email_sent: "اگر ای میل رجسٹرڈ ہے تو لنک بھیج دیا گیا",
        new_password: "نیا پاس ورڈ",
        referral_program: "ریفرل پروگرام",
        your_referral_code: "آپ کا کوڈ",
        invited_count: "مدعو دوست",
        copy_link: "لنک کاپی",
        view_layout: "ترتیب", layout_grid: "گرڈ", layout_wide: "چوڑا",
        ai_price_suggest: "AI قیمت تجویز",
        camera: "کیمرا", gallery: "گیلری",
        zoom_in: "زوم ان", zoom_out: "زوم آؤٹ", close: "بند",
        premium_locked: "🔒 پریمیم پیکجز معطل ہیں",
    },
    hi: {
        site_name: "हराज प्लस", tagline: "खरीदें और बेचें",
        nav_home: "होम", nav_search: "खोज", nav_post: "पोस्ट", nav_messages: "संदेश", nav_profile: "प्रोफ़ाइल",
        cta_post: "विज्ञापन पोस्ट करें", cta_explore: "श्रेणियाँ देखें",
        sec_categories: "श्रेणियाँ", sec_categories_sub: "पहले श्रेणी चुनें",
        sec_nearby: "आपके पास", sec_nearby_sub: "आपके शहर में",
        sec_stories: "लाइव स्टोरीज़",
        login: "लॉग इन", register: "साइन अप", logout: "लॉग आउट",
        email: "ईमेल", password: "पासवर्ड", forgot_password: "पासवर्ड भूल गए?", reset_password: "रीसेट करें",
        name: "पूरा नाम", phone: "फ़ोन", country: "देश", city: "शहर",
        already_have_account: "खाता है?", no_account: "खाता नहीं?",
        post_title: "नया विज्ञापन", choose_category: "श्रेणी चुनें",
        listing_details: "विवरण", upload_media: "फ़ोटो/वीडियो",
        title: "शीर्षक", description: "विवरण", price: "कीमत",
        publish: "प्रकाशित करें", cancel: "रद्द", next: "अगला", back: "वापस",
        all_categories: "सभी", view_all: "सब देखें",
        search_placeholder: "कुछ भी खोजें...",
        call: "कॉल", whatsapp: "व्हाट्सएप", message: "संदेश", chat_inapp: "ऐप संदेश",
        similar_listings: "समान विज्ञापन", admin_panel: "एडमिन", ad_label: "विज्ञापन",
        not_available: "उपलब्ध नहीं", verified: "सत्यापित", good_price: "अच्छी कीमत", ai_smart: "AI विश्लेषण",
        loading: "लोड हो रहा है...", no_results: "कोई परिणाम नहीं",
        my_listings: "मेरे विज्ञापन", favorites: "पसंदीदा",
        seller_info: "विक्रेता जानकारी", joined: "शामिल हुए",
        show_phone: "फ़ोन दिखाएँ", location_on_map: "नक्शे पर स्थान",
        save: "सहेजें", use_my_location: "मेरा वर्तमान स्थान",
        disclaimer_short: "सुरक्षा सूचना",
        disclaimer_text: "हराज प्लस केवल खरीदार-विक्रेता प्लेटफ़ॉर्म है। हम भुगतान नहीं करते। सावधान रहें, सार्वजनिक स्थान पर मिलें।",
        forgot_email_sent: "यदि ईमेल पंजीकृत है, तो लिंक भेजा गया",
        new_password: "नया पासवर्ड",
        referral_program: "रेफ़रल प्रोग्राम", your_referral_code: "आपका कोड",
        invited_count: "आमंत्रित मित्र", copy_link: "लिंक कॉपी",
        view_layout: "लेआउट", layout_grid: "ग्रिड", layout_wide: "वाइड",
        ai_price_suggest: "AI मूल्य सुझाव",
        camera: "कैमरा", gallery: "गैलरी",
        zoom_in: "ज़ूम इन", zoom_out: "ज़ूम आउट", close: "बंद",
        premium_locked: "🔒 प्रीमियम पैकेज अक्षम",
    },
    bn: {
        site_name: "হারাজ প্লাস", tagline: "কিনুন ও বিক্রি করুন",
        nav_home: "হোম", nav_search: "অনুসন্ধান", nav_post: "পোস্ট", nav_messages: "বার্তা", nav_profile: "প্রোফাইল",
        cta_post: "বিজ্ঞাপন পোস্ট করুন", cta_explore: "বিভাগ দেখুন",
        sec_categories: "বিভাগ", sec_categories_sub: "প্রথমে বিভাগ নির্বাচন করুন",
        sec_nearby: "আপনার কাছে", sec_nearby_sub: "আপনার শহরে",
        sec_stories: "লাইভ স্টোরি",
        login: "লগ ইন", register: "নিবন্ধন", logout: "লগ আউট",
        email: "ইমেইল", password: "পাসওয়ার্ড", forgot_password: "পাসওয়ার্ড ভুলে গেছেন?", reset_password: "রিসেট",
        name: "পূর্ণ নাম", phone: "ফোন", country: "দেশ", city: "শহর",
        already_have_account: "অ্যাকাউন্ট আছে?", no_account: "অ্যাকাউন্ট নেই?",
        post_title: "নতুন বিজ্ঞাপন", choose_category: "বিভাগ নির্বাচন",
        listing_details: "বিস্তারিত", upload_media: "ছবি/ভিডিও",
        title: "শিরোনাম", description: "বিবরণ", price: "মূল্য",
        publish: "প্রকাশ করুন", cancel: "বাতিল", next: "পরবর্তী", back: "পিছনে",
        all_categories: "সব", view_all: "সব দেখুন",
        search_placeholder: "যেকোনো কিছু খুঁজুন...",
        call: "কল", whatsapp: "হোয়াটসঅ্যাপ", message: "বার্তা", chat_inapp: "অ্যাপ বার্তা",
        similar_listings: "অনুরূপ বিজ্ঞাপন", admin_panel: "অ্যাডমিন", ad_label: "বিজ্ঞাপন",
        not_available: "অনুপলব্ধ", verified: "যাচাইকৃত", good_price: "ভাল মূল্য", ai_smart: "AI বিশ্লেষণ",
        loading: "লোড হচ্ছে...", no_results: "কোন ফলাফল নেই",
        my_listings: "আমার বিজ্ঞাপন", favorites: "পছন্দের",
        seller_info: "বিক্রেতা তথ্য", joined: "যোগ দিয়েছেন",
        show_phone: "ফোন দেখান", location_on_map: "মানচিত্রে অবস্থান",
        save: "সংরক্ষণ", use_my_location: "আমার বর্তমান অবস্থান",
        disclaimer_short: "নিরাপত্তা নোটিশ",
        disclaimer_text: "হারাজ প্লাস শুধুমাত্র ক্রেতা-বিক্রেতা প্ল্যাটফর্ম। আমরা পেমেন্ট গ্রহণ করি না। সতর্ক থাকুন, পাবলিক স্থানে দেখা করুন।",
        forgot_email_sent: "ইমেইল নিবন্ধিত থাকলে লিঙ্ক পাঠানো হয়েছে",
        new_password: "নতুন পাসওয়ার্ড",
        referral_program: "রেফারেল প্রোগ্রাম", your_referral_code: "আপনার কোড",
        invited_count: "আমন্ত্রিত বন্ধু", copy_link: "লিঙ্ক কপি",
        view_layout: "লেআউট", layout_grid: "গ্রিড", layout_wide: "প্রশস্ত",
        ai_price_suggest: "AI মূল্য পরামর্শ",
        camera: "ক্যামেরা", gallery: "গ্যালারি",
        zoom_in: "জুম ইন", zoom_out: "জুম আউট", close: "বন্ধ",
        premium_locked: "🔒 প্রিমিয়াম প্যাকেজ নিষ্ক্রিয়",
    },
    fr: {
        site_name: "Haraj Plus", tagline: "Acheter et Vendre",
        nav_home: "Accueil", nav_search: "Rechercher", nav_post: "Publier", nav_messages: "Messages", nav_profile: "Profil",
        cta_post: "Publier une annonce", cta_explore: "Catégories",
        sec_categories: "Catégories", sec_categories_sub: "Choisissez d'abord",
        sec_nearby: "Près de vous", sec_nearby_sub: "Annonces à proximité",
        sec_stories: "Stories",
        login: "Connexion", register: "S'inscrire", logout: "Déconnexion",
        email: "Email", password: "Mot de passe", forgot_password: "Mot de passe oublié?", reset_password: "Réinitialiser",
        name: "Nom complet", phone: "Téléphone", country: "Pays", city: "Ville",
        already_have_account: "Déjà un compte?", no_account: "Pas de compte?",
        post_title: "Nouvelle annonce", choose_category: "Choisir d'abord",
        listing_details: "Détails", upload_media: "Photos & Vidéos",
        title: "Titre", description: "Description", price: "Prix",
        publish: "Publier", cancel: "Annuler", next: "Suivant", back: "Retour",
        all_categories: "Toutes", view_all: "Tout voir",
        search_placeholder: "Rechercher...",
        call: "Appeler", whatsapp: "WhatsApp", message: "Message", chat_inapp: "Message app",
        similar_listings: "Annonces similaires", admin_panel: "Admin", ad_label: "Sponsorisé",
        not_available: "Non disponible", verified: "Vérifié", good_price: "Bonne affaire", ai_smart: "AI",
        loading: "Chargement...", no_results: "Aucun résultat",
        my_listings: "Mes annonces", favorites: "Favoris",
        seller_info: "Vendeur", joined: "Inscrit",
        show_phone: "Afficher téléphone", location_on_map: "Sur la carte",
        save: "Enregistrer", use_my_location: "Ma position actuelle",
        disclaimer_short: "Avis de sécurité",
        disclaimer_text: "Haraj Plus est seulement une plateforme reliant acheteurs et vendeurs. Nous ne recevons aucun paiement. Soyez prudent, rencontrez en public.",
        forgot_email_sent: "Si l'email est enregistré, un lien a été envoyé",
        new_password: "Nouveau mot de passe",
        referral_program: "Parrainage", your_referral_code: "Votre code",
        invited_count: "Amis invités", copy_link: "Copier le lien",
        view_layout: "Disposition", layout_grid: "Grille", layout_wide: "Large",
        ai_price_suggest: "Suggestion IA prix",
        camera: "Caméra", gallery: "Galerie",
        zoom_in: "Zoom +", zoom_out: "Zoom -", close: "Fermer",
        premium_locked: "🔒 Forfaits désactivés",
    },
};

const RTL_LANGS = ["ar", "ur"];

// Module-level mutable language state. Updated by I18nProvider on every render.
// Allows `tr()` to be imported and called from any component (even those that don't call useI18n()).
// React re-renders consumers when language changes, so tr() will see the latest lang.
const DEVICE_LANG_MAP = { ar: "ar", en: "en", ur: "ur", hi: "hi", bn: "bn", fr: "fr" };
function detectDeviceLanguage() {
    if (typeof navigator === "undefined") return "ar";
    const candidates = [...(navigator.languages || []), navigator.language || ""];
    for (const raw of candidates) {
        const base = String(raw).toLowerCase().split("-")[0].split("_")[0];
        if (DEVICE_LANG_MAP[base]) return DEVICE_LANG_MAP[base];
    }
    return "ar";
}

const _storedLang = typeof window !== "undefined" ? localStorage.getItem("hp_lang") : null;
const _manualLang = typeof window !== "undefined" ? localStorage.getItem("hp_lang_manual") === "1" : false;
let _currentLang = (_manualLang && _storedLang) || detectDeviceLanguage();

export function tr(text) {
    if (text == null) return text;
    if (_currentLang === "ar") return text;
    if (typeof text !== "string") return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const entry = AUTO_TRANSLATIONS[trimmed];
    if (entry && entry[_currentLang]) {
        const lead = text.match(/^\s*/)[0];
        const tail = text.match(/\s*$/)[0];
        return lead + entry[_currentLang] + tail;
    }
    return text;
}

export function I18nProvider({ children }) {
    const [lang, setLang] = useState(() => {
        const manual = localStorage.getItem("hp_lang_manual") === "1";
        return manual ? (localStorage.getItem("hp_lang") || detectDeviceLanguage()) : detectDeviceLanguage();
    });
    _currentLang = lang;
    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
        localStorage.setItem("hp_lang", lang);
        _currentLang = lang;
    }, [lang]);
    useEffect(() => {
        const syncDeviceLanguage = () => {
            if (localStorage.getItem("hp_lang_manual") === "1") return;
            const next = detectDeviceLanguage();
            setLang((current) => current === next ? current : next);
        };
        window.addEventListener("focus", syncDeviceLanguage);
        document.addEventListener("visibilitychange", syncDeviceLanguage);
        return () => {
            window.removeEventListener("focus", syncDeviceLanguage);
            document.removeEventListener("visibilitychange", syncDeviceLanguage);
        };
    }, []);
    const t = (key) => {
        if (key == null) return key;
        const direct = TRANSLATIONS[lang]?.[key];
        if (direct) return direct;
        const auto = typeof key === "string" ? AUTO_TRANSLATIONS[key.trim()]?.[lang] : null;
        return auto || TRANSLATIONS.ar[key] || key;
    };
    const isRTL = RTL_LANGS.includes(lang);
    // helper: pick best name from object {name, name_ar, name_en}
    // Backend now returns a pre-translated `name` field when ?lang= is passed
    const pickName = (obj) => {
        if (!obj) return "";
        if (obj.name) return obj.name; // pre-translated by backend
        if (lang === "ar") return obj.name_ar || obj.name_en || "";
        return obj.name_en || obj.name_ar || "";
    };
    const pickLabel = (field) => {
        if (!field) return "";
        if (field.label) return field.label; // pre-translated by backend
        if (lang === "ar") return field.label_ar || field.label_en || field.key;
        return field.label_en || field.label_ar || field.key;
    };
    const chooseLanguage = (next) => {
        if (next === "auto") {
            localStorage.removeItem("hp_lang_manual");
            setLang(detectDeviceLanguage());
            return;
        }
        if (!next || !TRANSLATIONS[next]) return;
        localStorage.setItem("hp_lang_manual", "1");
        setLang(next);
    };
    return (
        <I18nCtx.Provider value={{ lang, setLang: chooseLanguage, t, tr, isRTL, pickName, pickLabel, available: ["auto", "ar", "en", "ur", "hi", "bn", "fr"] }}>
            {children}
        </I18nCtx.Provider>
    );
}

export const useI18n = () => useContext(I18nCtx);
