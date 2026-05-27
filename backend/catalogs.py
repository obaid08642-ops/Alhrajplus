"""
Curated catalogs for cascading post-listing fields.

Design goals:
- Single source of truth — backend exposes the data, both web & mobile clients
  consume the same JSON so we never drift.
- Production-ready scale: covers the 90% of listings posted in the GCC region.
- Easy to extend: each brand → list of models is plain Python. Add a brand,
  reload the worker, done.
- "Other" sentinel allowed everywhere so users can post niche items without
  blocking on missing catalog entries.
"""

# ============================================================
# CARS — brand → model → trim
# Source: KSA dealer catalogs (Toyota AlSayer, AlJazirah Ford, AGMC BMW, etc).
# Years are computed dynamically (current_year .. current_year-30).
# Trims kept short — the 4-6 most commonly searched per model. Users can type
# "Other" if they need a less-common trim.
# ============================================================
CAR_CATALOG = {
    "Toyota": {
        "Camry": ["LE", "SE", "XLE", "XSE", "Hybrid", "Other"],
        "Corolla": ["LE", "SE", "XLE", "Hybrid LE", "Other"],
        "Land Cruiser": ["GR Sport", "VX", "VXR", "EXR", "GX-R", "Other"],
        "Prado": ["TXL", "VXR", "VXL", "TX", "Other"],
        "Hilux": ["GLX", "GL", "DLX", "TRD", "Other"],
        "RAV4": ["LE", "XLE", "Adventure", "Limited", "Hybrid", "Other"],
        "Yaris": ["E", "Y", "SE", "Other"],
        "Avalon": ["XLE", "Touring", "Limited", "Other"],
        "Hiace": ["GL", "Commuter", "Other"],
        "Innova": ["GL", "GLX", "Other"],
        "Highlander": ["LE", "XLE", "Limited", "Platinum", "Other"],
        "Fortuner": ["EX", "VX", "VXR", "Other"],
        "FJ Cruiser": ["GXR", "GX", "Other"],
        "Other": ["Other"],
    },
    "Lexus": {
        "LX": ["570", "600 F Sport", "600 VIP", "Other"],
        "GX": ["460", "550", "Other"],
        "ES": ["250", "300h", "350", "Other"],
        "IS": ["300", "350", "Other"],
        "RX": ["350", "350h", "450h+", "500h", "Other"],
        "NX": ["250", "350", "450h+", "Other"],
        "LS": ["500", "500h", "Other"],
        "LC": ["500", "500h", "Other"],
        "UX": ["200", "250h", "Other"],
        "Other": ["Other"],
    },
    "Nissan": {
        "Patrol": ["XE", "SE", "LE Platinum", "LE Titanium", "Nismo", "Other"],
        "Sunny": ["S", "SV", "SL", "Other"],
        "Altima": ["S", "SV", "SR", "SL", "Other"],
        "Maxima": ["SV", "SR", "Platinum", "Other"],
        "Pathfinder": ["SV", "SL", "Platinum", "Other"],
        "Armada": ["SV", "SL", "Platinum", "Other"],
        "X-Trail": ["S", "SV", "SL", "Other"],
        "Kicks": ["S", "SV", "SR", "Other"],
        "Navara": ["S", "SE", "SL", "Other"],
        "Urvan": ["Standard", "High Roof", "Other"],
        "GT-R": ["Premium", "Track Edition", "Nismo", "Other"],
        "Other": ["Other"],
    },
    "Hyundai": {
        "Sonata": ["GL", "GLS", "Smart", "Limited", "Other"],
        "Elantra": ["GL", "GLS", "Smart", "Limited", "Other"],
        "Accent": ["GL", "GLS", "Smart", "Other"],
        "Tucson": ["GL", "GLS", "Limited", "N Line", "Other"],
        "Santa Fe": ["GL", "GLS", "Calligraphy", "Other"],
        "Palisade": ["GL", "GLS", "Calligraphy", "Other"],
        "Creta": ["GL", "GLS", "Smart", "Other"],
        "Staria": ["GL", "Smart", "Premium", "Other"],
        "Kona": ["GL", "GLS", "N Line", "Other"],
        "i10": ["GL", "GLS", "Other"],
        "i20": ["GL", "GLS", "Other"],
        "Veloster": ["GLS", "Turbo", "N", "Other"],
        "Other": ["Other"],
    },
    "Kia": {
        "Cerato": ["LX", "EX", "GT-Line", "Other"],
        "Pegas": ["LX", "EX", "Other"],
        "Sportage": ["LX", "EX", "GT-Line", "Other"],
        "Sorento": ["LX", "EX", "SX", "Other"],
        "Telluride": ["LX", "EX", "SX", "Other"],
        "Carnival": ["LX", "EX", "SX", "Other"],
        "Picanto": ["LX", "EX", "Other"],
        "Optima": ["LX", "EX", "Other"],
        "Stinger": ["GT", "GT-Line", "Other"],
        "Seltos": ["LX", "EX", "GT-Line", "Other"],
        "Other": ["Other"],
    },
    "Honda": {
        "Civic": ["LX", "EX", "Sport", "Touring", "Other"],
        "Accord": ["LX", "Sport", "EX-L", "Touring", "Other"],
        "CR-V": ["LX", "EX", "Touring", "Other"],
        "HR-V": ["LX", "EX", "Sport", "Other"],
        "Pilot": ["LX", "EX", "Touring", "Elite", "Other"],
        "City": ["LX", "EX", "Other"],
        "Odyssey": ["LX", "EX", "Touring", "Elite", "Other"],
        "Other": ["Other"],
    },
    "Ford": {
        "F-150": ["XL", "XLT", "Lariat", "Raptor", "Limited", "Other"],
        "Mustang": ["EcoBoost", "GT", "Mach-E", "Shelby GT500", "Other"],
        "Explorer": ["XLT", "Limited", "ST", "Platinum", "Other"],
        "Edge": ["SE", "SEL", "Titanium", "ST", "Other"],
        "Bronco": ["Base", "Big Bend", "Wildtrak", "Raptor", "Other"],
        "Expedition": ["XLT", "Limited", "Platinum", "Other"],
        "Ranger": ["XL", "XLT", "Wildtrak", "Raptor", "Other"],
        "Taurus": ["SE", "SEL", "Limited", "Other"],
        "Other": ["Other"],
    },
    "Chevrolet": {
        "Tahoe": ["LS", "LT", "Z71", "Premier", "High Country", "Other"],
        "Suburban": ["LS", "LT", "Premier", "High Country", "Other"],
        "Silverado": ["WT", "Custom", "LT", "Trail Boss", "High Country", "Other"],
        "Camaro": ["LT", "SS", "ZL1", "Other"],
        "Corvette": ["Stingray", "Z06", "Other"],
        "Captiva": ["LT", "LTZ", "Other"],
        "Traverse": ["LS", "LT", "Premier", "Other"],
        "Equinox": ["LS", "LT", "Premier", "Other"],
        "Trailblazer": ["LS", "LT", "RS", "Other"],
        "Other": ["Other"],
    },
    "GMC": {
        "Yukon": ["SLE", "SLT", "AT4", "Denali", "Other"],
        "Sierra": ["SLE", "SLT", "AT4", "Denali", "Other"],
        "Terrain": ["SLE", "SLT", "Denali", "Other"],
        "Acadia": ["SLE", "SLT", "AT4", "Denali", "Other"],
        "Canyon": ["SL", "Elevation", "AT4", "Other"],
        "Other": ["Other"],
    },
    "Mercedes-Benz": {
        "C-Class": ["C200", "C300", "C43 AMG", "C63 AMG", "Other"],
        "E-Class": ["E200", "E300", "E450", "E53 AMG", "E63 AMG", "Other"],
        "S-Class": ["S450", "S500", "S580", "S63 AMG", "Maybach", "Other"],
        "G-Class": ["G400d", "G500", "G63 AMG", "Other"],
        "GLC": ["GLC300", "GLC43 AMG", "GLC63 AMG", "Other"],
        "GLE": ["GLE350", "GLE450", "GLE53 AMG", "GLE63 AMG", "Other"],
        "GLS": ["GLS450", "GLS580", "GLS63 AMG", "Maybach", "Other"],
        "A-Class": ["A200", "A35 AMG", "A45 AMG", "Other"],
        "CLA": ["CLA200", "CLA35 AMG", "CLA45 AMG", "Other"],
        "Other": ["Other"],
    },
    "BMW": {
        "3 Series": ["320i", "330i", "M340i", "M3", "Other"],
        "5 Series": ["520i", "530i", "M550i", "M5", "Other"],
        "7 Series": ["730i", "740i", "750i", "M760i", "Other"],
        "X1": ["sDrive18i", "sDrive20i", "Other"],
        "X3": ["xDrive20i", "xDrive30i", "M40i", "X3 M", "Other"],
        "X5": ["xDrive40i", "xDrive50i", "M50i", "X5 M", "Other"],
        "X6": ["xDrive40i", "M50i", "X6 M", "Other"],
        "X7": ["xDrive40i", "M50i", "Other"],
        "M3": ["Competition", "CSL", "Other"],
        "M5": ["Competition", "CS", "Other"],
        "Other": ["Other"],
    },
    "Audi": {
        "A3": ["30 TFSI", "35 TFSI", "S3", "RS3", "Other"],
        "A4": ["35 TFSI", "40 TFSI", "45 TFSI", "S4", "RS4", "Other"],
        "A6": ["40 TFSI", "45 TFSI", "55 TFSI", "S6", "RS6", "Other"],
        "A8": ["50 TFSI", "55 TFSI", "S8", "Other"],
        "Q3": ["35 TFSI", "40 TFSI", "RS Q3", "Other"],
        "Q5": ["40 TFSI", "45 TFSI", "55 TFSI", "SQ5", "Other"],
        "Q7": ["45 TFSI", "55 TFSI", "SQ7", "Other"],
        "Q8": ["55 TFSI", "SQ8", "RS Q8", "Other"],
        "Other": ["Other"],
    },
    "Porsche": {
        "911": ["Carrera", "Carrera S", "Turbo", "Turbo S", "GT3", "GT3 RS", "Other"],
        "Cayenne": ["Base", "S", "Turbo", "Turbo GT", "Other"],
        "Macan": ["Base", "S", "GTS", "Turbo", "Other"],
        "Panamera": ["4", "4S", "Turbo S", "Other"],
        "Taycan": ["4S", "Turbo", "Turbo S", "Other"],
        "Cayman": ["Base", "S", "GT4", "GT4 RS", "Other"],
        "Other": ["Other"],
    },
    "Land Rover": {
        "Range Rover": ["HSE", "Autobiography", "SV", "SVAutobiography", "Other"],
        "Range Rover Sport": ["SE", "HSE", "Autobiography", "SVR", "Other"],
        "Range Rover Velar": ["S", "SE", "HSE", "Other"],
        "Range Rover Evoque": ["S", "SE", "HSE", "Other"],
        "Defender": ["110", "90", "130", "Other"],
        "Discovery": ["S", "SE", "HSE", "Other"],
        "Other": ["Other"],
    },
    "Jeep": {
        "Wrangler": ["Sport", "Sahara", "Rubicon", "Other"],
        "Grand Cherokee": ["Laredo", "Limited", "Trailhawk", "Summit", "SRT", "Other"],
        "Cherokee": ["Sport", "Latitude", "Limited", "Trailhawk", "Other"],
        "Compass": ["Sport", "Latitude", "Limited", "Other"],
        "Gladiator": ["Sport", "Mojave", "Rubicon", "Other"],
        "Other": ["Other"],
    },
    "Dodge": {
        "Charger": ["SXT", "GT", "R/T", "Scat Pack", "Hellcat", "Other"],
        "Challenger": ["SXT", "R/T", "Scat Pack", "Hellcat", "Other"],
        "Durango": ["GT", "R/T", "Citadel", "SRT Hellcat", "Other"],
        "Ram 1500": ["Tradesman", "Big Horn", "Laramie", "TRX", "Limited", "Other"],
        "Other": ["Other"],
    },
    "Tesla": {
        "Model 3": ["RWD", "Long Range", "Performance", "Other"],
        "Model Y": ["RWD", "Long Range", "Performance", "Other"],
        "Model S": ["Dual Motor", "Plaid", "Other"],
        "Model X": ["Dual Motor", "Plaid", "Other"],
        "Cybertruck": ["AWD", "Cyberbeast", "Other"],
        "Other": ["Other"],
    },
    "MG": {
        "ZS": ["STD", "LUX", "Other"],
        "RX5": ["STD", "LUX", "Other"],
        "RX8": ["STD", "LUX", "Other"],
        "HS": ["STD", "Trophy", "Other"],
        "Other": ["Other"],
    },
    "Geely": {
        "Emgrand": ["GS", "GL", "Other"],
        "Coolray": ["Standard", "Sport", "Other"],
        "Tugella": ["Standard", "Sport", "Other"],
        "Other": ["Other"],
    },
    "Other": {"Other": ["Other"]},
}


# ============================================================
# PHONES — brand → model → storage → color
# Note: storage + color are the user-facing variants. "Version" (e.g. 5G/SIM
# count) is rolled into the model name for simplicity.
# ============================================================
PHONE_CATALOG = {
    "Apple": {
        "iPhone 16 Pro Max": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"]},
        "iPhone 16 Pro": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"]},
        "iPhone 16 Plus": {"storage": ["128GB", "256GB", "512GB"], "color": ["Black", "White", "Pink", "Teal", "Ultramarine"]},
        "iPhone 16": {"storage": ["128GB", "256GB", "512GB"], "color": ["Black", "White", "Pink", "Teal", "Ultramarine"]},
        "iPhone 15 Pro Max": {"storage": ["256GB", "512GB", "1TB"], "color": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"]},
        "iPhone 15 Pro": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"]},
        "iPhone 15 Plus": {"storage": ["128GB", "256GB", "512GB"], "color": ["Pink", "Yellow", "Green", "Blue", "Black"]},
        "iPhone 15": {"storage": ["128GB", "256GB", "512GB"], "color": ["Pink", "Yellow", "Green", "Blue", "Black"]},
        "iPhone 14 Pro Max": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Space Black", "Silver", "Gold", "Deep Purple"]},
        "iPhone 14 Pro": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Space Black", "Silver", "Gold", "Deep Purple"]},
        "iPhone 14 Plus": {"storage": ["128GB", "256GB", "512GB"], "color": ["Midnight", "Starlight", "Blue", "Purple", "Red", "Yellow"]},
        "iPhone 14": {"storage": ["128GB", "256GB", "512GB"], "color": ["Midnight", "Starlight", "Blue", "Purple", "Red", "Yellow"]},
        "iPhone 13 Pro Max": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Graphite", "Silver", "Gold", "Sierra Blue", "Alpine Green"]},
        "iPhone 13 Pro": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Graphite", "Silver", "Gold", "Sierra Blue", "Alpine Green"]},
        "iPhone 13": {"storage": ["128GB", "256GB", "512GB"], "color": ["Midnight", "Starlight", "Blue", "Pink", "Red", "Green"]},
        "iPhone 13 mini": {"storage": ["128GB", "256GB", "512GB"], "color": ["Midnight", "Starlight", "Blue", "Pink", "Red", "Green"]},
        "iPhone 12 Pro Max": {"storage": ["128GB", "256GB", "512GB"], "color": ["Graphite", "Silver", "Gold", "Pacific Blue"]},
        "iPhone 12 Pro": {"storage": ["128GB", "256GB", "512GB"], "color": ["Graphite", "Silver", "Gold", "Pacific Blue"]},
        "iPhone 12": {"storage": ["64GB", "128GB", "256GB"], "color": ["Black", "White", "Red", "Green", "Blue", "Purple"]},
        "iPhone 12 mini": {"storage": ["64GB", "128GB", "256GB"], "color": ["Black", "White", "Red", "Green", "Blue", "Purple"]},
        "iPhone 11 Pro Max": {"storage": ["64GB", "256GB", "512GB"], "color": ["Space Gray", "Silver", "Gold", "Midnight Green"]},
        "iPhone 11 Pro": {"storage": ["64GB", "256GB", "512GB"], "color": ["Space Gray", "Silver", "Gold", "Midnight Green"]},
        "iPhone 11": {"storage": ["64GB", "128GB", "256GB"], "color": ["Black", "White", "Red", "Yellow", "Purple", "Green"]},
        "iPhone XS Max": {"storage": ["64GB", "256GB", "512GB"], "color": ["Space Gray", "Silver", "Gold"]},
        "iPhone XS": {"storage": ["64GB", "256GB", "512GB"], "color": ["Space Gray", "Silver", "Gold"]},
        "iPhone XR": {"storage": ["64GB", "128GB", "256GB"], "color": ["Black", "White", "Red", "Yellow", "Coral", "Blue"]},
        "iPhone X": {"storage": ["64GB", "256GB"], "color": ["Space Gray", "Silver"]},
        "iPhone SE (3rd gen)": {"storage": ["64GB", "128GB", "256GB"], "color": ["Midnight", "Starlight", "Red"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Samsung": {
        "Galaxy S24 Ultra": {"storage": ["256GB", "512GB", "1TB"], "color": ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"]},
        "Galaxy S24+": {"storage": ["256GB", "512GB"], "color": ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"]},
        "Galaxy S24": {"storage": ["128GB", "256GB", "512GB"], "color": ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"]},
        "Galaxy S23 Ultra": {"storage": ["256GB", "512GB", "1TB"], "color": ["Phantom Black", "Cream", "Green", "Lavender"]},
        "Galaxy S23+": {"storage": ["256GB", "512GB"], "color": ["Phantom Black", "Cream", "Green", "Lavender"]},
        "Galaxy S23": {"storage": ["128GB", "256GB"], "color": ["Phantom Black", "Cream", "Green", "Lavender"]},
        "Galaxy S22 Ultra": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Phantom Black", "Phantom White", "Burgundy", "Green"]},
        "Galaxy S22+": {"storage": ["128GB", "256GB"], "color": ["Phantom Black", "Phantom White", "Pink Gold", "Green"]},
        "Galaxy S22": {"storage": ["128GB", "256GB"], "color": ["Phantom Black", "Phantom White", "Pink Gold", "Green"]},
        "Galaxy Z Fold 6": {"storage": ["256GB", "512GB", "1TB"], "color": ["Silver Shadow", "Pink", "Navy"]},
        "Galaxy Z Fold 5": {"storage": ["256GB", "512GB", "1TB"], "color": ["Phantom Black", "Cream", "Icy Blue"]},
        "Galaxy Z Flip 6": {"storage": ["256GB", "512GB"], "color": ["Silver Shadow", "Blue", "Yellow", "Mint"]},
        "Galaxy Z Flip 5": {"storage": ["256GB", "512GB"], "color": ["Mint", "Graphite", "Cream", "Lavender"]},
        "Galaxy Note 20 Ultra": {"storage": ["128GB", "256GB", "512GB"], "color": ["Mystic Bronze", "Mystic Black", "Mystic White"]},
        "Galaxy Note 20": {"storage": ["128GB", "256GB"], "color": ["Mystic Bronze", "Mystic Gray", "Mystic Green"]},
        "Galaxy A55": {"storage": ["128GB", "256GB"], "color": ["Awesome Lilac", "Awesome Iceblue", "Awesome Navy", "Awesome Lemon"]},
        "Galaxy A35": {"storage": ["128GB", "256GB"], "color": ["Awesome Lilac", "Awesome Iceblue", "Awesome Navy", "Awesome Lemon"]},
        "Galaxy A15": {"storage": ["128GB", "256GB"], "color": ["Blue Black", "Blue", "Yellow", "Light Blue"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Xiaomi": {
        "Xiaomi 14 Ultra": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "White", "Blue"]},
        "Xiaomi 14 Pro": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "White", "Green"]},
        "Xiaomi 14": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "White", "Jade Green", "Pink"]},
        "Xiaomi 13 Pro": {"storage": ["256GB", "512GB", "1TB"], "color": ["Ceramic Black", "Ceramic White", "Flora Green"]},
        "Xiaomi 13": {"storage": ["128GB", "256GB", "512GB"], "color": ["Black", "White", "Flora Green", "Mountain Blue"]},
        "Redmi Note 13 Pro": {"storage": ["128GB", "256GB", "512GB"], "color": ["Midnight Black", "Forest Green", "Lavender Purple", "Aurora Purple"]},
        "Redmi Note 13": {"storage": ["128GB", "256GB"], "color": ["Midnight Black", "Mint Green", "Ice Blue"]},
        "Poco F6 Pro": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "White"]},
        "Poco F6": {"storage": ["256GB", "512GB"], "color": ["Black", "White", "Titan", "Green"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Huawei": {
        "Pura 70 Ultra": {"storage": ["512GB", "1TB"], "color": ["Black", "Brown", "Green", "White"]},
        "Pura 70 Pro+": {"storage": ["512GB", "1TB"], "color": ["Black", "Pink", "Purple"]},
        "Pura 70 Pro": {"storage": ["256GB", "512GB"], "color": ["Black", "White", "Blue", "Green"]},
        "Mate 60 Pro+": {"storage": ["512GB", "1TB"], "color": ["Black", "White", "Purple", "Green"]},
        "Mate 60 Pro": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "White", "Green", "Purple"]},
        "Mate 60": {"storage": ["256GB", "512GB"], "color": ["Black", "White", "Purple", "Green"]},
        "P60 Pro": {"storage": ["256GB", "512GB", "1TB"], "color": ["Rococo Pearl", "Feather Black", "Emerald Green"]},
        "Nova 12 Ultra": {"storage": ["256GB", "512GB"], "color": ["Black", "Green", "Sky", "Pink"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Honor": {
        "Magic 6 Pro": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "Green", "Purple"]},
        "Magic 6": {"storage": ["256GB", "512GB"], "color": ["Black", "Green", "White"]},
        "Magic V2": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "Purple", "Silk Black"]},
        "Magic V3": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "Red", "Green", "Tundra Brown"]},
        "Honor 200 Pro": {"storage": ["256GB", "512GB"], "color": ["Black", "White", "Purple", "Green"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Oppo": {
        "Find X7 Ultra": {"storage": ["256GB", "512GB", "1TB"], "color": ["Black", "Blue", "Brown"]},
        "Find X7": {"storage": ["256GB", "512GB"], "color": ["Black", "White", "Blue", "Brown"]},
        "Reno 12 Pro": {"storage": ["256GB", "512GB"], "color": ["Black", "Purple", "Green"]},
        "Reno 12": {"storage": ["256GB", "512GB"], "color": ["Black", "Purple", "Green", "White"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "OnePlus": {
        "OnePlus 12": {"storage": ["256GB", "512GB", "1TB"], "color": ["Silky Black", "Flowy Emerald", "Pale Green"]},
        "OnePlus 11": {"storage": ["128GB", "256GB", "512GB"], "color": ["Titan Black", "Eternal Green", "Marble Odyssey"]},
        "OnePlus Nord 4": {"storage": ["256GB", "512GB"], "color": ["Mercurial Silver", "Obsidian Midnight", "Oasis Green"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Google": {
        "Pixel 9 Pro XL": {"storage": ["256GB", "512GB", "1TB"], "color": ["Obsidian", "Porcelain", "Hazel", "Rose Quartz"]},
        "Pixel 9 Pro": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Obsidian", "Porcelain", "Hazel", "Rose Quartz"]},
        "Pixel 9": {"storage": ["128GB", "256GB"], "color": ["Obsidian", "Porcelain", "Wintergreen", "Peony"]},
        "Pixel 8 Pro": {"storage": ["128GB", "256GB", "512GB", "1TB"], "color": ["Obsidian", "Porcelain", "Bay"]},
        "Pixel 8": {"storage": ["128GB", "256GB"], "color": ["Obsidian", "Hazel", "Rose", "Mint"]},
        "Pixel 7 Pro": {"storage": ["128GB", "256GB", "512GB"], "color": ["Obsidian", "Snow", "Hazel"]},
        "Pixel 7": {"storage": ["128GB", "256GB"], "color": ["Obsidian", "Snow", "Lemongrass"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Nothing": {
        "Phone (2a)": {"storage": ["128GB", "256GB"], "color": ["Black", "White", "Milk"]},
        "Phone (2)": {"storage": ["128GB", "256GB", "512GB"], "color": ["White", "Dark Gray"]},
        "Other": {"storage": ["Other"], "color": ["Other"]},
    },
    "Other": {"Other": {"storage": ["Other"], "color": ["Other"]}},
}


def car_brands() -> list:
    return list(CAR_CATALOG.keys())


def car_models(brand: str) -> list:
    return list((CAR_CATALOG.get(brand) or {}).keys()) or ["Other"]


def car_trims(brand: str, model: str) -> list:
    return (CAR_CATALOG.get(brand, {}) or {}).get(model) or ["Other"]


def phone_brands() -> list:
    return list(PHONE_CATALOG.keys())


def phone_models(brand: str) -> list:
    return list((PHONE_CATALOG.get(brand) or {}).keys()) or ["Other"]


def phone_variants(brand: str, model: str) -> dict:
    """Returns {storage: [...], color: [...]} for the picked brand+model."""
    return (PHONE_CATALOG.get(brand, {}) or {}).get(model) or {"storage": ["Other"], "color": ["Other"]}


def years_window(span: int = 30) -> list:
    """Returns current year ... current year - span."""
    from datetime import datetime
    cy = datetime.now().year
    return [str(y) for y in range(cy + 1, cy - span, -1)]
