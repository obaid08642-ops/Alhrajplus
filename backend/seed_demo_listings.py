"""
Demo listings seeder.

Run via:    python -m backend.seed_demo_listings
            or directly: python seed_demo_listings.py

Inserts 10 demo listings per existing category, all owned by ONE system user
("حساب تجريبي"). Each listing has is_demo=True so the frontend hides
chat/call CTAs and shows a "إعلان تجريبي" badge.

Re-runnable: each invocation FIRST removes existing demo listings (so the
sample stays fresh) then re-seeds. The system demo user is preserved.
"""
import asyncio
import os
import random
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

from seed_data import COUNTRIES, CATEGORIES

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "haraj_plus")

DEMO_USER_EMAIL = "demo@harajplus.local"
DEMO_USER_NAME = "حساب تجريبي"
DEMO_LABEL = "إعلان تجريبي"

# Lightweight pool: 8 small thumbnails (Unsplash auto-resizes via ?w=400)
# Reuse across all 150 listings — keeps DB payload tiny and CDN cache hot.
STOCK_IMAGES = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=70",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=70",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=70",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=70",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=70",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=70",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=70",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&q=70",
]

# A few Arabic title fragments per category key. Fallback uses the category
# name itself when no specific fragments exist.
TITLE_FRAGMENTS = {
    "cars": ["تويوتا كامري 2021 نظيفة", "هوندا أكورد 2020", "مرسيدس C200 موديل 2022", "BMW X5 وارد الوكالة", "نيسان باترول 2019", "لكزس ES 2020", "هيونداي سوناتا 2021", "كيا سبورتاج 2022", "فورد F150 ديزل", "شيفروليه تاهو 2018"],
    "real_estate": ["شقة فاخرة في حي الياسمين", "فيلا للبيع شمال الرياض", "أرض تجارية على شارع رئيسي", "شقة دور أرضي مع حديقة", "عمارة استثمارية بحي النخيل", "استراحة للإيجار اليومي", "محل تجاري طريق الملك فهد", "بيت شعبي للهدم", "شقة عوائل مفروشة", "دور علوي تشطيب لوكس"],
    "electronics": ["آيفون 15 برو ماكس جديد", "سامسونج S24 ألترا 512", "لاب توب Dell XPS 13", "ماك بوك برو M3 2024", "ساعة آبل ووتش الجيل 9", "سماعات سوني WH-1000XM5", "شاشة LG OLED 65 بوصة", "كاميرا كانون R6 Mark II", "بلايستيشن 5 برو", "تابلت آيباد برو M2"],
    "jobs": ["مطلوب محاسب خبرة 5 سنوات", "وظيفة مدير مبيعات شركة كبرى", "مطلوب مهندس برمجيات Senior", "وظيفة سكرتيرة تنفيذية", "مطلوب طبيب أسنان للعمل", "مدرس رياضيات خبرة دولية", "مطلوب فني صيانة سيارات", "موظف خدمة عملاء", "كاشير سوبر ماركت", "سائق توصيل بسيارة"],
    "services": ["نقل أثاث مع الفك والتركيب", "خدمة كهربائي منازل 24 ساعة", "تنظيف فلل وشقق احترافي", "مصمم جرافيك للهويات", "مطور مواقع وتطبيقات", "مصور حفلات ومناسبات", "خدمة سباكة شاملة", "تركيب ستائر وكنب", "ترجمة معتمدة", "تدريس خصوصي ثانوي"],
    "fashion": ["عبايات تركية فاخرة جديدة", "ساعة رولكس أصلية مع الضمان", "حقيبة لويس فيتون أصلية", "بدلة رجالية إيطالية", "نظارات شمسية ريبان", "حذاء نايك جوردن 1", "فستان سهرة مطرز", "إكسسوارات ذهب 21", "شال كشمير أصلي", "بنطلون جينز أمريكي"],
    "furniture": ["كنب 7 مقاعد جلد طبيعي", "غرفة نوم تركية كاملة", "طقم سفرة 12 شخص", "مجلس عربي أصيل", "كرسي مكتب طبي", "طاولة قهوة رخامية", "خزانة ملابس 4 أبواب", "سرير أطفال خشب زان", "إنارة كريستال للمعيشة", "سجادة تركية يدوي"],
    "pets": ["قطة شيرازي صغيرة", "كلب لابرادور ودود", "أرانب أنجوري للبيع", "ببغاء كوكتيل متكلم", "سمك زينة استوائي", "هامستر صغير مع القفص", "حصان عربي أصيل", "صقر شاهين مدرب", "أسماك كوي يابانية", "خيول قزمة"],
    "books": ["مكتبة كاملة كتب دينية", "كتب تطوير ذات نادرة", "موسوعة الفقه الإسلامي", "رواية الأسود يليق بك", "كتب جامعية هندسة", "مجموعة كتب نجيب محفوظ", "أطلس العالم الحديث", "قرآن كريم مذهب", "كتب تعليم الأطفال", "مجلدات الأدب العربي"],
    "kids": ["دراجة أطفال 16 إنش", "كرسي سيارة للأطفال", "ألعاب تعليمية مونتيسوري", "ملابس مواليد جديدة", "مهد خشبي مع تجهيزات", "عربة أطفال دوبل", "لعبة ليجو 1000 قطعة", "روبوت برمجي أطفال", "كتب تلوين وأنشطة", "ألعاب خارجية للحديقة"],
    "sports": ["دراجة هوائية جبلية", "جهاز رياضي متعدد", "دمبل قابلة للتعديل", "خيمة كشتة 8 أشخاص", "صنارة صيد احترافية", "بدلة غوص كاملة", "كرة قدم أصلية", "مضرب تنس Wilson", "أحذية جري نايك", "حقيبة جيم كبيرة"],
    "auctions": ["لوحة سيارة مميزة", "سيف فضي قديم نادر", "ساعة جيب أنتيكة", "عملة معدنية نادرة", "خاتم ذهب مرصع", "مخطوطة عربية قديمة", "إبريق فضي تراثي", "خنجر يدوي مزخرف", "سجادة فارسية عتيقة", "تحفة برونزية أصلية"],
    "all": ["إعلان متنوع جديد", "منتج عرض خاص اليوم", "صفقة مميزة لفترة محدودة", "عرض حصري على المنتج", "بيع سريع بسعر مخفض", "منتج مستعمل بحالة الجديد", "تنزيلات نهاية الموسم", "عرض تصفية المخزون", "صفقة استثمارية مغرية", "منتج مميز للبيع"],
}


def _short_desc(title: str) -> str:
    return f"{title} — {random.choice(['متوفر للتواصل', 'يقبل التفاوض', 'بحالة ممتازة'])}."


def _gen_listing(user_id: str, cat_key: str, idx: int) -> dict:
    titles = TITLE_FRAGMENTS.get(cat_key) or TITLE_FRAGMENTS["all"]
    title = titles[idx % len(titles)]
    desc = _short_desc(title)
    price = round(random.uniform(500, 250000), -2)
    country = random.choice(COUNTRIES)
    city = random.choice(country.get("cities", [{"name_ar": "المدينة"}]))
    # ONE image only — production rule for fast lists.
    one_image = random.choice(STOCK_IMAGES)
    now = datetime.now(timezone.utc).isoformat()
    lid = str(uuid.uuid4())
    slug = f"demo-{cat_key}-{idx}-{lid.replace('-', '')[:6]}"
    return {
        "id": lid,
        "user_id": user_id,
        "title": title,
        "description": desc,
        "category": cat_key,
        "subcategory": "",
        "price": price,
        "currency": country.get("currency", "ر.س"),
        "currency_code": country.get("currency_code", "SAR"),
        "country_code": country["code"],
        "city": city.get("name_ar") if isinstance(city, dict) else str(city),
        "images": [one_image],
        "media_urls": [one_image],
        "show_phone": False,
        "status": "active",
        "moderation": "approved",
        "is_demo": True,
        "demo_label": DEMO_LABEL,
        "notifications_disabled": True,
        "views": random.randint(10, 5000),
        "favorites": random.randint(0, 200),
        "slug": slug,
        "search_blob": f"{title} {cat_key}".lower(),
        "created_at": now,
        "updated_at": now,
    }


async def seed():
    if not MONGO_URL:
        raise SystemExit("MONGO_URL env var is required")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # 1) Remove old demo data so re-running the script is idempotent.
    await db.listings.delete_many({"is_demo": True})

    # 2) Ensure demo user exists.
    demo_user = await db.users.find_one({"email": DEMO_USER_EMAIL})
    if not demo_user:
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto").hash(uuid.uuid4().hex)
        demo_user = {
            "id": str(uuid.uuid4()),
            "name": DEMO_USER_NAME,
            "email": DEMO_USER_EMAIL,
            "phone": "",
            "phone_full": "",
            "country_code": "SA",
            "city": None,
            "password_hash": pwd,
            "role": "user",
            "verified": True,
            "trust_score": 100,
            "avatar_url": None,
            "bio": "حساب نظام لعرض إعلانات تجريبية فقط.",
            "language": "ar",
            "banned": False,
            "is_demo": True,
            "referral_code": "DEMO",
            "referred_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(demo_user)

    uid = demo_user["id"]

    # 3) Bulk insert 10 listings per category.
    bulk: list[dict] = []
    for cat in CATEGORIES:
        for i in range(10):
            bulk.append(_gen_listing(uid, cat["key"], i))

    if bulk:
        await db.listings.insert_many(bulk)

    print(f"Inserted {len(bulk)} demo listings across {len(CATEGORIES)} categories.")
    client.close()


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(seed())
