"""
الحراج بلس - Seed Data
الفئات الكاملة + المدن + الإعدادات الافتراضية
"""

# ============================================================
# COUNTRIES with phone codes & cities & districts
# ============================================================
COUNTRIES = [
    {
        "code": "SA",
        "name_ar": "السعودية",
        "name_en": "Saudi Arabia",
        "phone_code": "+966",
        "phone_length": 9,
        "currency": "ر.س",
        "currency_code": "SAR",
        "flag": "🇸🇦",
        "cities": [
            {"name_ar": "الرياض", "name_en": "Riyadh", "districts": ["العليا", "الياسمين", "النخيل", "الملز", "الروضة", "الرحاب", "النرجس", "الندى", "السليمانية", "العزيزية", "الشفا", "بدر", "العقيق", "النفل", "الفيحاء", "اليرموك", "حطين", "قرطبة", "الواحة", "العارض"]},
            {"name_ar": "جدة", "name_en": "Jeddah", "districts": ["الشاطئ", "الحمراء", "الروضة", "السلامة", "الفيصلية", "الزهراء", "النزهة", "الأندلس", "النعيم", "البساتين", "الصفا", "المروة", "الواحة", "الفيحاء", "أبحر الشمالية", "أبحر الجنوبية", "الحمدانية", "الكورنيش"]},
            {"name_ar": "مكة المكرمة", "name_en": "Makkah", "districts": ["العزيزية", "الششة", "الكعكية", "النسيم", "العتيبية", "بطحاء قريش", "النوارية", "الزاهر", "الراقي", "الزهراء"]},
            {"name_ar": "المدينة المنورة", "name_en": "Madinah", "districts": ["العزيزية", "قباء", "العاقول", "السلام", "الخالدية", "العنبرية", "الحرة الشرقية", "الحرة الغربية", "الجامعة"]},
            {"name_ar": "الدمام", "name_en": "Dammam", "districts": ["الشاطئ", "الفيصلية", "النور", "الجلوية", "الفردوس", "الإسكان", "الراكة", "الفيحاء", "الواحة", "النخيل"]},
            {"name_ar": "الخبر", "name_en": "Khobar", "districts": ["العقربية", "الراكة", "الثقبة", "اليرموك", "الكورنيش", "الخبر الشمالية", "الخبر الجنوبية"]},
            {"name_ar": "الظهران", "name_en": "Dhahran", "districts": ["الدوحة", "تهامة", "هجر", "الكوثر"]},
            {"name_ar": "الطائف", "name_en": "Taif", "districts": ["الشهداء", "الفيصلية", "الحوية", "العقيق", "السداد"]},
            {"name_ar": "تبوك", "name_en": "Tabuk", "districts": ["العزيزية", "الفيصلية", "السلام", "الورود", "المروج"]},
            {"name_ar": "أبها", "name_en": "Abha", "districts": ["المنسك", "العرين", "السامر", "الموظفين"]},
            {"name_ar": "خميس مشيط", "name_en": "Khamis Mushait", "districts": ["الرصراص", "العزيزية", "الفيصلية"]},
            {"name_ar": "نجران", "name_en": "Najran", "districts": ["الفيصلية", "الفهد", "الخالدية"]},
            {"name_ar": "جازان", "name_en": "Jazan", "districts": ["الشاطئ", "الكورنيش", "السلامة"]},
            {"name_ar": "حائل", "name_en": "Hail", "districts": ["الشنان", "الزهراء", "العزيزية"]},
            {"name_ar": "بريدة", "name_en": "Buraydah", "districts": ["الصفراء", "النفل", "الإسكان"]},
            {"name_ar": "عنيزة", "name_en": "Unaizah", "districts": ["النزهة", "الورود", "الفهد"]},
            {"name_ar": "الأحساء", "name_en": "Al-Ahsa", "districts": ["الهفوف", "المبرز", "الجشة"]},
            {"name_ar": "حفر الباطن", "name_en": "Hafr Al-Batin", "districts": ["الخالدية", "النموذجية", "الفيصلية"]},
            {"name_ar": "ينبع", "name_en": "Yanbu", "districts": ["شرم ينبع", "الفيحاء", "السلام"]},
            {"name_ar": "القطيف", "name_en": "Qatif", "districts": ["الواحة", "الجش", "تاروت"]},
            {"name_ar": "عرعر", "name_en": "Arar", "districts": ["العزيزية", "النموذجية", "الفيصلية"]},
            {"name_ar": "الخرج", "name_en": "Al-Kharj", "districts": ["الفيصلية", "العزيزية", "المنتزه"]},
            {"name_ar": "الباحة", "name_en": "Al-Baha", "districts": ["الزرقاء", "العقيق", "السحابة"]},
            {"name_ar": "الجبيل", "name_en": "Jubail", "districts": ["الفناتير", "اللؤلؤ", "البلدة"]},
            {"name_ar": "سكاكا", "name_en": "Sakaka", "districts": ["الفيصلية", "العزيزية", "الشلهوب"]},
            {"name_ar": "القريات", "name_en": "Qurayyat", "districts": ["العزيزية", "الواحة"]},
            {"name_ar": "رفحاء", "name_en": "Rafha", "districts": ["المنتزه", "النموذجية"]},
            {"name_ar": "تبرجل", "name_en": "Tabarjal", "districts": ["تبرجل"]},
            {"name_ar": "ضباء", "name_en": "Duba", "districts": ["ضباء"]},
            {"name_ar": "الوجه", "name_en": "Al-Wajh", "districts": ["الوجه"]},
            {"name_ar": "بدر", "name_en": "Badr", "districts": ["بدر"]},
            {"name_ar": "العلا", "name_en": "Al-Ula", "districts": ["العلا", "مغيراء"]},
            {"name_ar": "خيبر", "name_en": "Khaybar", "districts": ["خيبر"]},
            {"name_ar": "املج", "name_en": "Umluj", "districts": ["املج"]},
            {"name_ar": "محايل عسير", "name_en": "Muhayil", "districts": ["محايل"]},
            {"name_ar": "بيشة", "name_en": "Bisha", "districts": ["بيشة", "النماص"]},
            {"name_ar": "صبيا", "name_en": "Sabya", "districts": ["صبيا"]},
            {"name_ar": "أبو عريش", "name_en": "Abu Arish", "districts": ["أبو عريش"]},
            {"name_ar": "صامطة", "name_en": "Samtah", "districts": ["صامطة"]},
            {"name_ar": "الدوادمي", "name_en": "Al-Dawadmi", "districts": ["الدوادمي"]},
            {"name_ar": "شقراء", "name_en": "Shaqra", "districts": ["شقراء"]},
            {"name_ar": "وادي الدواسر", "name_en": "Wadi Al-Dawasir", "districts": ["وادي الدواسر"]},
            {"name_ar": "السليل", "name_en": "Al-Sulayyil", "districts": ["السليل"]},
            {"name_ar": "العقير", "name_en": "Al-Uqair", "districts": ["العقير"]},
        ]
    },
    {
        "code": "AE", "name_ar": "الإمارات", "name_en": "UAE", "phone_code": "+971", "phone_length": 9,
        "currency": "د.إ", "currency_code": "AED", "flag": "🇦🇪",
        "cities": [
            {"name_ar": "دبي", "name_en": "Dubai", "districts": ["الجميرا", "ديرة", "بر دبي", "المرابع العربية", "وسط المدينة", "الخليج التجاري", "نخلة جميرا", "دبي مارينا", "الكرامة", "البرشاء"]},
            {"name_ar": "أبوظبي", "name_en": "Abu Dhabi", "districts": ["الكورنيش", "الريم", "ياس", "السعديات", "الخالدية", "المشرف", "المرور"]},
            {"name_ar": "الشارقة", "name_en": "Sharjah", "districts": ["النهدة", "المجاز", "الناصرية", "الزاهية"]},
            {"name_ar": "العين", "name_en": "Al-Ain", "districts": ["الجيمي", "المعتمدية", "الفلج هزاع"]},
            {"name_ar": "عجمان", "name_en": "Ajman", "districts": ["الراشدية", "الجرف", "النخيل"]},
            {"name_ar": "رأس الخيمة", "name_en": "Ras Al-Khaimah", "districts": ["النخيل", "الحمرة", "النعيم"]},
            {"name_ar": "الفجيرة", "name_en": "Fujairah", "districts": ["مدينة الفجيرة", "دبا الفجيرة"]},
            {"name_ar": "أم القيوين", "name_en": "Umm Al-Quwain", "districts": ["السلمى", "الراس"]},
        ]
    },
    {
        "code": "KW", "name_ar": "الكويت", "name_en": "Kuwait", "phone_code": "+965", "phone_length": 8,
        "currency": "د.ك", "currency_code": "KWD", "flag": "🇰🇼",
        "cities": [
            {"name_ar": "مدينة الكويت", "name_en": "Kuwait City", "districts": ["السالمية", "حولي", "بيان", "السرة", "الجابرية"]},
            {"name_ar": "الفروانية", "name_en": "Farwaniya", "districts": ["العارضية", "الرقعي", "الأندلس"]},
            {"name_ar": "الأحمدي", "name_en": "Ahmadi", "districts": ["فهد الأحمد", "الفنطاس", "المهبولة"]},
            {"name_ar": "الجهراء", "name_en": "Jahra", "districts": ["تيماء", "النعيم", "الواحة"]},
            {"name_ar": "مبارك الكبير", "name_en": "Mubarak Al-Kabeer", "districts": ["العدان", "القرين", "أبو فطيرة"]},
        ]
    },
    {
        "code": "QA", "name_ar": "قطر", "name_en": "Qatar", "phone_code": "+974", "phone_length": 8,
        "currency": "ر.ق", "currency_code": "QAR", "flag": "🇶🇦",
        "cities": [
            {"name_ar": "الدوحة", "name_en": "Doha", "districts": ["الكورنيش", "اللؤلؤة", "الوكرة", "الريان", "أم صلال"]},
            {"name_ar": "الريان", "name_en": "Al-Rayyan", "districts": ["الغرافة", "أبو هامور", "اللقطة"]},
            {"name_ar": "الوكرة", "name_en": "Al-Wakrah", "districts": ["الوكرة", "الوكير"]},
            {"name_ar": "الخور", "name_en": "Al-Khor", "districts": ["الخور", "الذخيرة"]},
        ]
    },
    {
        "code": "BH", "name_ar": "البحرين", "name_en": "Bahrain", "phone_code": "+973", "phone_length": 8,
        "currency": "د.ب", "currency_code": "BHD", "flag": "🇧🇭",
        "cities": [
            {"name_ar": "المنامة", "name_en": "Manama", "districts": ["العدلية", "السيف", "الجفير"]},
            {"name_ar": "المحرق", "name_en": "Muharraq", "districts": ["عراد", "الحد"]},
            {"name_ar": "الرفاع", "name_en": "Riffa", "districts": ["الرفاع الشرقي", "الرفاع الغربي"]},
            {"name_ar": "مدينة عيسى", "name_en": "Isa Town", "districts": ["مدينة عيسى"]},
        ]
    },
    {
        "code": "OM", "name_ar": "عُمان", "name_en": "Oman", "phone_code": "+968", "phone_length": 8,
        "currency": "ر.ع", "currency_code": "OMR", "flag": "🇴🇲",
        "cities": [
            {"name_ar": "مسقط", "name_en": "Muscat", "districts": ["السيب", "بوشر", "روي", "مطرح", "العذيبة"]},
            {"name_ar": "صلالة", "name_en": "Salalah", "districts": ["الحافة", "الدهاريز"]},
            {"name_ar": "صحار", "name_en": "Sohar", "districts": ["مجز الصغرى", "الصرة"]},
            {"name_ar": "نزوى", "name_en": "Nizwa", "districts": ["نزوى", "بهلاء"]},
        ]
    },
    {
        "code": "EG", "name_ar": "مصر", "name_en": "Egypt", "phone_code": "+20", "phone_length": 10,
        "currency": "ج.م", "currency_code": "EGP", "flag": "🇪🇬",
        "cities": [
            {"name_ar": "القاهرة", "name_en": "Cairo", "districts": ["مدينة نصر", "المعادي", "مصر الجديدة", "الزمالك", "وسط البلد", "الدقي", "المهندسين", "حلوان", "شبرا", "العباسية", "روكسي", "السيدة زينب", "الجيزة", "6 أكتوبر", "الشيخ زايد", "التجمع الخامس", "التجمع الأول", "مدينتي", "الرحاب", "العاصمة الإدارية"]},
            {"name_ar": "الإسكندرية", "name_en": "Alexandria", "districts": ["سيدي جابر", "ميامي", "العصافرة", "سموحة", "محرم بك", "العجمي", "بورسعيد", "الإبراهيمية", "كامب شيزار", "كفر عبده", "ستانلي", "روشدي", "بولكلي", "كليوباترا"]},
            {"name_ar": "الجيزة", "name_en": "Giza", "districts": ["الهرم", "الدقي", "العجوزة", "المهندسين", "فيصل", "إمبابة", "بولاق الدكرور", "أوسيم", "البدرشين"]},
            {"name_ar": "شرم الشيخ", "name_en": "Sharm El Sheikh", "districts": ["خليج نعمة", "هضبة أم السيد", "الهضبة", "خليج القرش"]},
            {"name_ar": "الغردقة", "name_en": "Hurghada", "districts": ["الممشى", "السقالة", "الدهار", "العربية", "النصر"]},
            {"name_ar": "بورسعيد", "name_en": "Port Said", "districts": ["العرب", "المناخ", "الزهور", "الضواحي"]},
            {"name_ar": "السويس", "name_en": "Suez", "districts": ["الأربعين", "السويس", "عتاقة"]},
            {"name_ar": "الإسماعيلية", "name_en": "Ismailia", "districts": ["السلام", "النميس", "الشيخ زايد"]},
            {"name_ar": "أسوان", "name_en": "Aswan", "districts": ["السد العالي", "إدفو", "كوم أمبو"]},
            {"name_ar": "الأقصر", "name_en": "Luxor", "districts": ["الكرنك", "إسنا", "أرمنت"]},
            {"name_ar": "أسيوط", "name_en": "Asyut", "districts": ["شرق", "غرب", "ديروط"]},
            {"name_ar": "المنصورة", "name_en": "Mansoura", "districts": ["جامعة المنصورة", "طلخا", "ميت غمر"]},
            {"name_ar": "طنطا", "name_en": "Tanta", "districts": ["السيد البدوي", "السنطة", "بسيون"]},
            {"name_ar": "الزقازيق", "name_en": "Zagazig", "districts": ["السلام", "البنوك", "الجامعة"]},
            {"name_ar": "المنيا", "name_en": "Minya", "districts": ["شرق النيل", "غرب النيل", "ملوي"]},
            {"name_ar": "بني سويف", "name_en": "Beni Suef", "districts": ["شرق", "غرب", "ببا"]},
            {"name_ar": "سوهاج", "name_en": "Sohag", "districts": ["شرق", "غرب", "أخميم"]},
            {"name_ar": "قنا", "name_en": "Qena", "districts": ["نقادة", "قوص", "أبوتشت"]},
            {"name_ar": "كفر الشيخ", "name_en": "Kafr el-Sheikh", "districts": ["كفر الشيخ", "دسوق", "بلطيم"]},
            {"name_ar": "الدقهلية", "name_en": "Dakahlia", "districts": ["المنصورة", "ميت غمر", "السنبلاوين"]},
            {"name_ar": "البحيرة", "name_en": "Beheira", "districts": ["دمنهور", "كفر الدوار", "إيتاي البارود"]},
            {"name_ar": "مرسى مطروح", "name_en": "Marsa Matruh", "districts": ["العلمين", "سيدي براني", "السلوم"]},
            {"name_ar": "العاصمة الإدارية", "name_en": "New Capital", "districts": ["الحي السكني الأول", "الحي الحكومي", "حي R3", "حي R7"]},
            {"name_ar": "الفيوم", "name_en": "Fayoum", "districts": ["الفيوم", "إطسا", "سنورس", "طامية", "يوسف الصديق", "إبشواي"]},
            {"name_ar": "دمياط", "name_en": "Damietta", "districts": ["دمياط", "رأس البر", "فارسكور", "كفر سعد", "الزرقا"]},
            {"name_ar": "القليوبية", "name_en": "Qalyubia", "districts": ["بنها", "قليوب", "الخانكة", "شبرا الخيمة", "العبور", "قها"]},
            {"name_ar": "المنوفية", "name_en": "Monufia", "districts": ["شبين الكوم", "منوف", "أشمون", "تلا", "بركة السبع", "السادات"]},
            {"name_ar": "البحر الأحمر", "name_en": "Red Sea", "districts": ["سفاجا", "القصير", "مرسى علم", "حلايب", "شلاتين"]},
            {"name_ar": "شمال سيناء", "name_en": "North Sinai", "districts": ["العريش", "بئر العبد", "الشيخ زويد", "رفح"]},
            {"name_ar": "جنوب سيناء", "name_en": "South Sinai", "districts": ["الطور", "دهب", "نويبع", "طابا", "سانت كاترين"]},
            {"name_ar": "الوادي الجديد", "name_en": "New Valley", "districts": ["الخارجة", "الداخلة", "باريس", "الفرافرة", "بلاط"]},
            {"name_ar": "مطروح", "name_en": "Matrouh", "districts": ["مطروح", "السلوم", "النجيلة", "سيوة"]},
            {"name_ar": "العاشر من رمضان", "name_en": "10th of Ramadan", "districts": ["الحي الأول", "الحي الثاني", "المنطقة الصناعية"]},
            {"name_ar": "السادس من أكتوبر", "name_en": "6th of October", "districts": ["الحي الأول", "الحي الثاني", "الحي الثالث", "الحي السابع", "الشيخ زايد", "حدائق الأهرام"]},
            {"name_ar": "الشرقية", "name_en": "Sharqia", "districts": ["الزقازيق", "العاشر من رمضان", "بلبيس", "أبو حماد", "كفر صقر", "ههيا"]},
            {"name_ar": "الغربية", "name_en": "Gharbia", "districts": ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "بسيون"]},
            {"name_ar": "بلطيم", "name_en": "Baltim", "districts": ["بلطيم", "المصيف"]},
            {"name_ar": "إدفو", "name_en": "Edfu", "districts": ["إدفو"]},
            {"name_ar": "نقادة", "name_en": "Naqada", "districts": ["نقادة"]},
            {"name_ar": "الخصوص", "name_en": "Khusus", "districts": ["الخصوص"]},
        ]
    },
]


# ============================================================
# CATEGORIES — 15 main with custom fields per category
# ============================================================

# Common car makes
CAR_MAKES = ["تويوتا", "نيسان", "هوندا", "هيونداي", "كيا", "مرسيدس", "BMW", "أودي", "لكزس", "فورد", "شفروليه", "GMC", "دودج", "كرايسلر", "جيب", "كاديلاك", "لينكولن", "بيوك", "بنتلي", "رولز رويس", "فيراري", "لامبورغيني", "بورش", "مازيراتي", "أستون مارتن", "جاكوار", "لاند روفر", "فولفو", "ميتسوبيشي", "سوزوكي", "إنفينيتي", "أكورا", "تسلا", "جيلي", "MG", "شيري", "هافال", "جينيسيس", "ماكلارين", "بوغاتي", "بيك أب", "آخر"]

PROPERTY_TYPES_RENT = ["شقة", "فيلا", "بيت", "دور", "غرفة", "استراحة", "محل", "مكتب", "مستودع", "أرض"]
PROPERTY_TYPES_SALE = ["شقة", "فيلا", "بيت", "عمارة", "دور", "أرض سكنية", "أرض تجارية", "مزرعة", "استراحة", "محل", "مكتب", "عمارة كاملة"]


CATEGORIES = [
    {
        "key": "cars", "name_ar": "السيارات", "name_en": "Cars", "icon": "Car", "order": 1,
        "subcategories": [
            {"key": "cars_used", "name_ar": "سيارات مستعملة", "name_en": "Used Cars"},
            {"key": "cars_new", "name_ar": "سيارات جديدة", "name_en": "New Cars"},
            {"key": "trucks", "name_ar": "شاحنات ومعدات ثقيلة", "name_en": "Trucks & Heavy"},
            {"key": "spare_parts", "name_ar": "قطع غيار", "name_en": "Spare Parts"},
            {"key": "accessories", "name_ar": "إكسسوارات", "name_en": "Accessories"},
            {"key": "car_services", "name_ar": "خدمات السيارات", "name_en": "Car Services"},
            {"key": "plates", "name_ar": "لوحات مميزة", "name_en": "Plates"},
        ],
        "fields": [
            {"key": "make", "label_ar": "الماركة", "label_en": "Make", "type": "select", "options": CAR_MAKES, "required": True},
            {"key": "model", "label_ar": "الموديل", "label_en": "Model", "type": "text", "required": True},
            {"key": "year", "label_ar": "سنة الصنع", "label_en": "Year", "type": "number", "required": True, "min": 1970, "max": 2027},
            {"key": "kilometers", "label_ar": "الكيلومترات", "label_en": "Kilometers", "type": "number", "required": False},
            {"key": "transmission", "label_ar": "ناقل الحركة", "label_en": "Transmission", "type": "select", "options": ["أوتوماتيك", "عادي"], "required": True},
            {"key": "fuel_type", "label_ar": "نوع الوقود", "label_en": "Fuel", "type": "select", "options": ["بنزين", "ديزل", "كهرباء", "هايبرد"], "required": True},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "ممتاز", "جيد جداً", "جيد", "يحتاج صيانة"], "required": True},
            {"key": "body_type", "label_ar": "الفئة", "label_en": "Body Type", "type": "select", "options": ["سيدان", "SUV", "كوبيه", "هاتشباك", "بيك أب", "فان", "كابريوليه", "كروس أوفر"], "required": False},
            {"key": "color", "label_ar": "اللون", "label_en": "Color", "type": "select", "options": ["أبيض", "أسود", "فضي", "رمادي", "أزرق", "أحمر", "ذهبي", "بني", "أخضر", "آخر"], "required": False},
            {"key": "seller_type", "label_ar": "البائع", "label_en": "Seller", "type": "select", "options": ["فرد", "معرض"], "required": True},
            {"key": "seal_status", "label_ar": "حالة الجمرك", "label_en": "Customs", "type": "select", "options": ["مدفوع", "معروض للتنازل"], "required": False},
        ]
    },
    {
        "key": "realestate", "name_ar": "العقار", "name_en": "Real Estate", "icon": "Building2", "order": 2,
        "subcategories": [
            {"key": "apt_rent", "name_ar": "شقق للإيجار", "name_en": "Apartments Rent"},
            {"key": "apt_sale", "name_ar": "شقق للبيع", "name_en": "Apartments Sale"},
            {"key": "villa_rent", "name_ar": "فلل للإيجار", "name_en": "Villas Rent"},
            {"key": "villa_sale", "name_ar": "فلل للبيع", "name_en": "Villas Sale"},
            {"key": "land", "name_ar": "أراضي", "name_en": "Land"},
            {"key": "commercial", "name_ar": "تجاري", "name_en": "Commercial"},
            {"key": "farms", "name_ar": "مزارع واستراحات", "name_en": "Farms"},
        ],
        "fields": [
            {"key": "deal_type", "label_ar": "نوع الإعلان", "label_en": "Deal", "type": "select", "options": ["للبيع", "للإيجار", "للتقبيل"], "required": True},
            {"key": "property_type", "label_ar": "نوع العقار", "label_en": "Type", "type": "select", "options": PROPERTY_TYPES_SALE, "required": True},
            {"key": "area_m2", "label_ar": "المساحة (م²)", "label_en": "Area (m²)", "type": "number", "required": True},
            {"key": "rooms", "label_ar": "عدد الغرف", "label_en": "Rooms", "type": "number", "required": False},
            {"key": "bathrooms", "label_ar": "عدد الحمامات", "label_en": "Bathrooms", "type": "number", "required": False},
            {"key": "floor", "label_ar": "الدور", "label_en": "Floor", "type": "text", "required": False},
            {"key": "age_years", "label_ar": "عمر العقار", "label_en": "Age", "type": "number", "required": False},
            {"key": "facade", "label_ar": "الواجهة", "label_en": "Facade", "type": "select", "options": ["شمالية", "جنوبية", "شرقية", "غربية", "ثلاث واجهات", "أربع واجهات"], "required": False},
            {"key": "street_width", "label_ar": "عرض الشارع (م)", "label_en": "Street Width", "type": "number", "required": False},
            {"key": "furnished", "label_ar": "مفروشة", "label_en": "Furnished", "type": "select", "options": ["نعم", "لا", "جزئياً"], "required": False},
            {"key": "rent_period", "label_ar": "فترة الإيجار", "label_en": "Rent Period", "type": "select", "options": ["يومي", "شهري", "سنوي"], "required": False},
        ]
    },
    {
        "key": "electronics", "name_ar": "إلكترونيات", "name_en": "Electronics", "icon": "Smartphone", "order": 3,
        "subcategories": [
            {"key": "mobiles", "name_ar": "جوالات", "name_en": "Mobiles"},
            {"key": "laptops", "name_ar": "حاسبات", "name_en": "Laptops"},
            {"key": "tablets", "name_ar": "تابلت", "name_en": "Tablets"},
            {"key": "audio", "name_ar": "سماعات", "name_en": "Audio"},
            {"key": "tv", "name_ar": "تلفزيونات", "name_en": "TVs"},
            {"key": "appliances", "name_ar": "أجهزة كهربائية", "name_en": "Appliances"},
            {"key": "gaming", "name_ar": "ألعاب إلكترونية", "name_en": "Gaming"},
        ],
        "fields": [
            {"key": "brand", "label_ar": "الماركة", "label_en": "Brand", "type": "select", "options": ["Apple", "Samsung", "Huawei", "Xiaomi", "Oppo", "Realme", "Honor", "Nokia", "Sony", "LG", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Microsoft", "Google", "OnePlus", "آخر"], "required": True},
            {"key": "model", "label_ar": "الموديل", "label_en": "Model", "type": "text", "required": True},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد بكرتونه", "مستعمل ممتاز", "مستعمل جيد", "يحتاج صيانة"], "required": True},
            {"key": "storage", "label_ar": "السعة", "label_en": "Storage", "type": "select", "options": ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"], "required": False},
            {"key": "ram", "label_ar": "الذاكرة العشوائية (RAM)", "label_en": "RAM", "type": "select", "options": ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB"], "required": False},
            {"key": "warranty", "label_ar": "الضمان", "label_en": "Warranty", "type": "select", "options": ["مع ضمان", "بدون ضمان", "ضمان منتهي"], "required": False},
        ]
    },
    {
        "key": "jobs", "name_ar": "وظائف", "name_en": "Jobs", "icon": "Briefcase", "order": 4,
        "subcategories": [
            {"key": "job_offer", "name_ar": "عرض وظيفة", "name_en": "Job Offered"},
            {"key": "job_seeker", "name_ar": "باحث عن عمل", "name_en": "Job Wanted"},
        ],
        "fields": [
            {"key": "job_title", "label_ar": "المسمى الوظيفي", "label_en": "Job Title", "type": "text", "required": True},
            {"key": "post_type", "label_ar": "نوع الإعلان", "label_en": "Post Type", "type": "select", "options": ["عرض وظيفة", "باحث عن عمل"], "required": True},
            {"key": "industry", "label_ar": "المجال", "label_en": "Industry", "type": "select", "options": ["تقنية المعلومات", "هندسة", "طب وصحة", "تعليم", "مبيعات وتسويق", "محاسبة ومالية", "موارد بشرية", "قانون", "إعلام", "ضيافة", "بناء", "صناعة", "نقل ولوجستيات", "خدمة عملاء", "إداري", "آخر"], "required": True},
            {"key": "experience_years", "label_ar": "سنوات الخبرة", "label_en": "Years of Experience", "type": "select", "options": ["بدون خبرة", "1-2 سنة", "3-5 سنوات", "6-10 سنوات", "أكثر من 10"], "required": True},
            {"key": "education", "label_ar": "المؤهل العلمي", "label_en": "Education", "type": "select", "options": ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"], "required": True},
            {"key": "employment_type", "label_ar": "نوع الدوام", "label_en": "Employment Type", "type": "select", "options": ["دوام كامل", "دوام جزئي", "عقد", "تدريب", "عمل حر / فريلانس", "عن بُعد"], "required": True},
            {"key": "salary_min", "label_ar": "الراتب من", "label_en": "Salary From", "type": "number", "required": False},
            {"key": "salary_max", "label_ar": "الراتب إلى", "label_en": "Salary To", "type": "number", "required": False},
            {"key": "salary_currency", "label_ar": "العملة", "label_en": "Currency", "type": "select", "options": ["ر.س", "د.إ", "د.ك", "ر.ق", "د.ب", "ر.ع", "USD", "EUR"], "required": False},
            {"key": "skills", "label_ar": "المهارات (افصل بفواصل)", "label_en": "Skills", "type": "text", "required": False},
            {"key": "languages", "label_ar": "اللغات", "label_en": "Languages", "type": "text", "required": False},
            {"key": "gender_preference", "label_ar": "الجنس المطلوب", "label_en": "Gender", "type": "select", "options": ["لا يهم", "ذكر", "أنثى"], "required": False},
            {"key": "nationality_preference", "label_ar": "الجنسية المفضلة", "label_en": "Nationality", "type": "text", "required": False},
            {"key": "benefits", "label_ar": "المميزات (سكن/تأمين/مواصلات...)", "label_en": "Benefits", "type": "text", "required": False},
            {"key": "work_hours", "label_ar": "ساعات العمل", "label_en": "Work Hours", "type": "text", "required": False},
            {"key": "company_name", "label_ar": "اسم الشركة", "label_en": "Company", "type": "text", "required": False},
        ]
    },
    {
        "key": "services", "name_ar": "خدمات", "name_en": "Services", "icon": "Wrench", "order": 5,
        "subcategories": [
            {"key": "plumbing", "name_ar": "سباكة", "name_en": "Plumbing"},
            {"key": "electrical", "name_ar": "كهرباء", "name_en": "Electrical"},
            {"key": "ac", "name_ar": "تكييف وتبريد", "name_en": "AC & Cooling"},
            {"key": "cleaning", "name_ar": "نظافة", "name_en": "Cleaning"},
            {"key": "moving", "name_ar": "نقل عفش", "name_en": "Moving"},
            {"key": "drivers", "name_ar": "سائقين", "name_en": "Drivers"},
            {"key": "delivery", "name_ar": "توصيل ونقل", "name_en": "Delivery"},
            {"key": "construction", "name_ar": "بناء وترميم", "name_en": "Construction"},
            {"key": "painting", "name_ar": "دهانات", "name_en": "Painting"},
            {"key": "carpentry", "name_ar": "نجارة", "name_en": "Carpentry"},
            {"key": "tutoring", "name_ar": "تدريس خصوصي", "name_en": "Tutoring"},
            {"key": "beauty", "name_ar": "تجميل", "name_en": "Beauty"},
            {"key": "events", "name_ar": "تنظيم فعاليات", "name_en": "Events"},
            {"key": "tech_support", "name_ar": "صيانة كمبيوتر", "name_en": "Tech Support"},
            {"key": "gardening", "name_ar": "بستنة", "name_en": "Gardening"},
        ],
        "fields": [
            {"key": "service_type", "label_ar": "نوع الخدمة", "label_en": "Service", "type": "select", "options": ["سباكة", "كهرباء", "تكييف", "نظافة", "نقل عفش", "سائق", "توصيل", "بناء", "دهان", "نجارة", "تدريس", "تجميل", "تنظيم فعاليات", "صيانة أجهزة", "بستنة", "آخر"], "required": True},
            {"key": "frequency", "label_ar": "تكرار الخدمة", "label_en": "Frequency", "type": "select", "options": ["مرة واحدة", "أسبوعي", "شهري", "حسب الطلب", "اشتراك دائم"], "required": True},
            {"key": "schedule", "label_ar": "متى تحتاج الخدمة؟", "label_en": "Schedule", "type": "text", "required": False, "placeholder": "مثلاً: غداً 8 صباحاً، أو خلال الأسبوع"},
            {"key": "pickup_address", "label_ar": "نقطة الالتقاط (إن وجدت)", "label_en": "Pickup", "type": "text", "required": False},
            {"key": "dropoff_address", "label_ar": "نقطة الوصول (إن وجدت)", "label_en": "Dropoff", "type": "text", "required": False},
            {"key": "pricing_type", "label_ar": "طريقة التسعير", "label_en": "Pricing", "type": "select", "options": ["بالساعة", "بالزيارة", "بالقطعة/المهمة", "متر مربع", "حسب الاتفاق"], "required": True},
            {"key": "rate", "label_ar": "السعر", "label_en": "Rate", "type": "number", "required": False},
            {"key": "experience", "label_ar": "سنوات الخبرة", "label_en": "Experience", "type": "select", "options": ["مبتدئ", "1-3 سنوات", "4-7 سنوات", "8+ سنوات"], "required": False},
            {"key": "certified", "label_ar": "حاصل على شهادات؟", "label_en": "Certified", "type": "select", "options": ["نعم", "لا"], "required": False},
            {"key": "available_24_7", "label_ar": "متاح 24/7؟", "label_en": "24/7", "type": "select", "options": ["نعم", "لا"], "required": False},
            {"key": "post_type", "label_ar": "نوع الإعلان", "label_en": "Post Type", "type": "select", "options": ["تقديم خدمة", "طلب خدمة"], "required": True},
        ]
    },
    {
        "key": "furniture", "name_ar": "الأثاث", "name_en": "Furniture", "icon": "Sofa", "order": 6,
        "subcategories": [
            {"key": "majlis", "name_ar": "مجالس ومفروشات", "name_en": "Majlis"},
            {"key": "bedroom", "name_ar": "غرف نوم", "name_en": "Bedroom"},
            {"key": "tables", "name_ar": "طاولات وكراسي", "name_en": "Tables"},
            {"key": "wardrobes", "name_ar": "خزائن", "name_en": "Wardrobes"},
            {"key": "kitchen", "name_ar": "أثاث مطبخ", "name_en": "Kitchen"},
            {"key": "decor", "name_ar": "تحف وديكور", "name_en": "Decor"},
            {"key": "office_furniture", "name_ar": "أثاث مكتبي", "name_en": "Office"},
        ],
        "fields": [
            {"key": "furniture_type", "label_ar": "نوع الأثاث", "label_en": "Type", "type": "select", "options": ["كنب", "سرير", "خزانة", "طاولة", "كراسي", "مكتب", "ركن", "تحفة", "سجاد", "ستائر", "آخر"], "required": True},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "شبه جديد", "مستعمل ممتاز", "مستعمل جيد"], "required": True},
            {"key": "material", "label_ar": "الخامة", "label_en": "Material", "type": "select", "options": ["خشب", "معدن", "قماش", "جلد", "بلاستيك", "آخر"], "required": False},
            {"key": "color", "label_ar": "اللون", "label_en": "Color", "type": "select", "options": ["أبيض", "أسود", "بني", "رمادي", "بيج", "أزرق", "أحمر", "أخضر", "ذهبي", "آخر"], "required": False},
            {"key": "age_years", "label_ar": "عمر القطعة (بالسنوات)", "label_en": "Age (years)", "type": "number", "required": False},
            {"key": "dimensions", "label_ar": "الأبعاد (طول×عرض×ارتفاع سم)", "label_en": "Dimensions", "type": "text", "required": False},
        ]
    },
    {
        "key": "livestock", "name_ar": "مواشي وحيوانات", "name_en": "Livestock & Pets", "icon": "Bird", "order": 7,
        "subcategories": [
            {"key": "camels", "name_ar": "إبل", "name_en": "Camels"},
            {"key": "horses", "name_ar": "خيل", "name_en": "Horses"},
            {"key": "sheep", "name_ar": "غنم وماعز", "name_en": "Sheep"},
            {"key": "cattle", "name_ar": "أبقار", "name_en": "Cattle"},
            {"key": "birds", "name_ar": "طيور", "name_en": "Birds"},
            {"key": "cats", "name_ar": "قطط", "name_en": "Cats"},
            {"key": "dogs", "name_ar": "كلاب", "name_en": "Dogs"},
            {"key": "fish", "name_ar": "أسماك", "name_en": "Fish"},
            {"key": "rabbits", "name_ar": "أرانب", "name_en": "Rabbits"},
            {"key": "supplies", "name_ar": "مستلزمات", "name_en": "Supplies"},
        ],
        "fields": [
            {"key": "animal_type", "label_ar": "نوع الحيوان", "label_en": "Animal", "type": "text", "required": True},
            {"key": "age_months", "label_ar": "العمر (بالأشهر)", "label_en": "Age (months)", "type": "number", "required": False},
            {"key": "breed", "label_ar": "السلالة", "label_en": "Breed", "type": "text", "required": False},
            {"key": "gender", "label_ar": "الجنس", "label_en": "Gender", "type": "select", "options": ["ذكر", "أنثى", "زوج"], "required": False},
            {"key": "vaccinated", "label_ar": "ملقّح؟", "label_en": "Vaccinated", "type": "select", "options": ["نعم", "لا"], "required": False},
        ]
    },
    {
        "key": "personal", "name_ar": "شخصية", "name_en": "Personal", "icon": "ShoppingBag", "order": 8,
        "subcategories": [
            {"key": "men_clothes", "name_ar": "ملابس رجالية", "name_en": "Men's Clothing"},
            {"key": "women_clothes", "name_ar": "ملابس نسائية", "name_en": "Women's Clothing"},
            {"key": "kids_clothes", "name_ar": "ملابس أطفال", "name_en": "Kids' Clothing"},
            {"key": "perfumes", "name_ar": "عطور", "name_en": "Perfumes"},
            {"key": "watches", "name_ar": "ساعات", "name_en": "Watches"},
            {"key": "jewelry", "name_ar": "مجوهرات", "name_en": "Jewelry"},
            {"key": "bags", "name_ar": "حقائب", "name_en": "Bags"},
            {"key": "shoes", "name_ar": "أحذية", "name_en": "Shoes"},
            {"key": "glasses", "name_ar": "نظارات", "name_en": "Glasses"},
        ],
        "fields": [
            {"key": "item_type", "label_ar": "نوع المنتج", "label_en": "Type", "type": "text", "required": True},
            {"key": "brand", "label_ar": "الماركة", "label_en": "Brand", "type": "text", "required": False},
            {"key": "size", "label_ar": "المقاس", "label_en": "Size", "type": "text", "required": False},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "مستعمل ممتاز", "مستعمل جيد"], "required": True},
        ]
    },
    {
        "key": "auctions", "name_ar": "مزادات", "name_en": "Auctions", "icon": "Gavel", "order": 9,
        "subcategories": [
            {"key": "car_auctions", "name_ar": "مزاد سيارات", "name_en": "Cars"},
            {"key": "real_estate_auctions", "name_ar": "مزاد عقارات", "name_en": "Real Estate"},
            {"key": "antiques", "name_ar": "تحف ومقتنيات", "name_en": "Antiques"},
            {"key": "rare_items", "name_ar": "نوادر", "name_en": "Rare Items"},
        ],
        "fields": [
            {"key": "starting_bid", "label_ar": "سعر البداية", "label_en": "Starting Bid", "type": "number", "required": True},
            {"key": "min_increment", "label_ar": "أقل زيادة", "label_en": "Min Increment", "type": "number", "required": True},
            {"key": "end_date", "label_ar": "تاريخ انتهاء المزاد", "label_en": "End Date", "type": "datetime", "required": True},
            {"key": "item_type", "label_ar": "نوع الصنف", "label_en": "Item Type", "type": "text", "required": True},
        ]
    },
    {
        "key": "books", "name_ar": "كتب", "name_en": "Books", "icon": "BookOpen", "order": 10,
        "subcategories": [
            {"key": "academic", "name_ar": "كتب دراسية", "name_en": "Academic"},
            {"key": "religious", "name_ar": "كتب دينية", "name_en": "Religious"},
            {"key": "novels", "name_ar": "روايات", "name_en": "Novels"},
            {"key": "magazines", "name_ar": "مجلات", "name_en": "Magazines"},
        ],
        "fields": [
            {"key": "title", "label_ar": "اسم الكتاب", "label_en": "Title", "type": "text", "required": True},
            {"key": "author", "label_ar": "المؤلف", "label_en": "Author", "type": "text", "required": False},
            {"key": "language", "label_ar": "اللغة", "label_en": "Language", "type": "select", "options": ["عربي", "إنجليزي", "آخر"], "required": False},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "ممتاز", "جيد"], "required": True},
        ]
    },
    {
        "key": "games", "name_ar": "ألعاب", "name_en": "Games", "icon": "Gamepad2", "order": 11,
        "subcategories": [
            {"key": "consoles", "name_ar": "أجهزة ألعاب", "name_en": "Consoles"},
            {"key": "video_games", "name_ar": "ألعاب فيديو", "name_en": "Video Games"},
            {"key": "toys", "name_ar": "ألعاب أطفال", "name_en": "Toys"},
            {"key": "board_games", "name_ar": "ألعاب طاولة", "name_en": "Board Games"},
        ],
        "fields": [
            {"key": "game_type", "label_ar": "نوع المنتج", "label_en": "Item Type", "type": "select", "options": ["جهاز كونسول", "لعبة فيديو", "ملحقات (يد تحكم/سماعة)", "لعبة طاولة", "لعبة أطفال", "كرت اشتراك"], "required": True},
            {"key": "platform", "label_ar": "المنصة", "label_en": "Platform", "type": "select", "options": ["PS5", "PS4", "Xbox Series X/S", "Xbox One", "Nintendo Switch", "PC", "Mobile", "آخر"], "required": False},
            {"key": "game_title", "label_ar": "اسم اللعبة", "label_en": "Game Title", "type": "text", "required": False, "placeholder": "FIFA 24 / GTA / EA Sports..."},
            {"key": "region", "label_ar": "المنطقة", "label_en": "Region", "type": "select", "options": ["عربي", "إنجليزي", "آسيوي", "أوروبي", "أمريكي"], "required": False},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد بالعلبة", "مستعمل ممتاز", "مستعمل جيد"], "required": True},
        ]
    },
    {
        "key": "garden", "name_ar": "نباتات وحدائق", "name_en": "Garden", "icon": "Leaf", "order": 12,
        "subcategories": [
            {"key": "plants", "name_ar": "نباتات", "name_en": "Plants"},
            {"key": "garden_tools", "name_ar": "أدوات حدائق", "name_en": "Tools"},
            {"key": "outdoor_furniture", "name_ar": "أثاث خارجي", "name_en": "Outdoor Furniture"},
        ],
        "fields": [
            {"key": "item_kind", "label_ar": "نوع المنتج", "label_en": "Item Kind", "type": "select", "options": ["نبات", "بذور وأشتال", "تربة وأسمدة", "أدوات حدائق", "نظام ري", "أثاث خارجي"], "required": True},
            {"key": "plant_type", "label_ar": "نوع النبات (إن وُجد)", "label_en": "Plant Type", "type": "text", "required": False, "placeholder": "نخيل / ورد / صبار..."},
            {"key": "size", "label_ar": "الحجم", "label_en": "Size", "type": "select", "options": ["صغير", "متوسط", "كبير", "ضخم"], "required": False},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "مستعمل ممتاز", "مستعمل جيد"], "required": False},
        ]
    },
    {
        "key": "sports", "name_ar": "رياضة", "name_en": "Sports", "icon": "Dumbbell", "order": 13,
        "subcategories": [
            {"key": "fitness", "name_ar": "أجهزة رياضية", "name_en": "Fitness"},
            {"key": "bicycles", "name_ar": "دراجات", "name_en": "Bicycles"},
            {"key": "outdoor", "name_ar": "تخييم ورحلات", "name_en": "Outdoor"},
            {"key": "team_sports", "name_ar": "رياضات جماعية", "name_en": "Team Sports"},
        ],
        "fields": [
            {"key": "sport_type", "label_ar": "نوع المنتج", "label_en": "Item Type", "type": "select", "options": ["دراجة هوائية", "دراجة كهربائية", "أجهزة لياقة", "ملابس رياضية", "أحذية رياضية", "أدوات تخييم", "كرات ومضارب", "آخر"], "required": True},
            {"key": "brand", "label_ar": "الماركة", "label_en": "Brand", "type": "text", "required": False, "placeholder": "Nike / Adidas / Trek..."},
            {"key": "size", "label_ar": "المقاس", "label_en": "Size", "type": "text", "required": False, "placeholder": "M / L / 42 / 26 inch..."},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "مستعمل ممتاز", "مستعمل جيد"], "required": True},
        ]
    },
    {
        "key": "kids", "name_ar": "أطفال ورضع", "name_en": "Kids & Babies", "icon": "Baby", "order": 14,
        "subcategories": [
            {"key": "baby_gear", "name_ar": "مستلزمات رضع", "name_en": "Baby Gear"},
            {"key": "kids_toys", "name_ar": "ألعاب أطفال", "name_en": "Toys"},
            {"key": "kids_furniture", "name_ar": "أثاث أطفال", "name_en": "Kids Furniture"},
        ],
        "fields": [
            {"key": "item_type", "label_ar": "نوع المنتج", "label_en": "Item Type", "type": "select", "options": ["ملابس", "ألعاب", "أثاث (مهد/سرير)", "عربة أطفال", "كرسي سيارة", "حفاضات ومستلزمات", "كتب أطفال", "آخر"], "required": True},
            {"key": "age_range", "label_ar": "الفئة العمرية", "label_en": "Age Range", "type": "select", "options": ["حديث الولادة", "0-1 سنة", "1-3 سنوات", "3-5 سنوات", "5-10 سنوات", "10+"], "required": True},
            {"key": "gender", "label_ar": "الجنس", "label_en": "Gender", "type": "select", "options": ["ولد", "بنت", "محايد"], "required": False},
            {"key": "brand", "label_ar": "الماركة", "label_en": "Brand", "type": "text", "required": False},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "مستعمل ممتاز", "مستعمل جيد"], "required": True},
        ]
    },
    {
        "key": "all", "name_ar": "كل الحراج", "name_en": "Everything Else", "icon": "Shapes", "order": 15,
        "subcategories": [
            {"key": "misc", "name_ar": "متفرقات", "name_en": "Misc"},
        ],
        "fields": [
            {"key": "item_type", "label_ar": "نوع المنتج", "label_en": "Type", "type": "text", "required": True},
            {"key": "condition", "label_ar": "الحالة", "label_en": "Condition", "type": "select", "options": ["جديد", "مستعمل"], "required": False},
        ]
    },
]


# ============================================================
# Default Theme Settings (changeable from Admin)
# ============================================================
DEFAULT_THEME = {
    "primary_color": "#89CFF0",
    "primary_hover": "#6DAEE0",
    "secondary_color": "#0A1128",
    "accent_color": "#D4AF37",
    "font_arabic_heading": "Alexandria",
    "font_arabic_body": "Tajawal",
    "font_latin_heading": "Outfit",
    "font_latin_body": "Plus Jakarta Sans",
    "logo_text": "الحراج",
    "logo_suffix": "بلس",
    "site_name": "الحراج بلس",
    "tagline_ar": "بيع و اشتري | جديد أو مستعمل",
    "tagline_en": "Buy & Sell | New or Used",
}
