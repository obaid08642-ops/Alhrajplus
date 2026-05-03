import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
    Search, MapPin, Heart, MessageCircle, User, Home as HomeIcon,
    Plus, Bell, Moon, Sun, Globe, ChevronLeft, Sparkles, Crown,
    Car, Building2, Smartphone, Sofa, Briefcase, Wrench, Gavel,
    ShoppingBag, Bird, BookOpen, Gamepad2, Leaf, Dumbbell, Baby,
    Shapes, Phone, Star, TrendingUp, Filter, Mic, Camera, Play
} from "lucide-react";

const HeroBanner = "https://images.unsplash.com/photo-1709626011483-5bb4b5470ac9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";
const ImgCar = "https://images.unsplash.com/photo-1760689044812-9572c8e9289c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";
const ImgRealEstate = "https://images.unsplash.com/photo-1649225560384-0294a3c7be55?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";
const ImgLivestock = "https://images.unsplash.com/photo-1518978288375-f36cefcc992e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";
const ImgElectronics = "https://images.unsplash.com/photo-1777013211433-689cef726241?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";

const CATEGORIES = [
    { key: "cars", label: "السيارات", icon: Car, count: "125K", color: "from-sky-200 to-sky-50" },
    { key: "realestate", label: "العقار", icon: Building2, count: "89K", color: "from-amber-100 to-yellow-50" },
    { key: "electronics", label: "إلكترونيات", icon: Smartphone, count: "67K", color: "from-blue-100 to-indigo-50" },
    { key: "furniture", label: "الأثاث", icon: Sofa, count: "34K", color: "from-rose-100 to-pink-50" },
    { key: "jobs", label: "وظائف", icon: Briefcase, count: "12K", color: "from-emerald-100 to-green-50" },
    { key: "services", label: "خدمات", icon: Wrench, count: "8K", color: "from-orange-100 to-amber-50" },
    { key: "auctions", label: "مزادات", icon: Gavel, count: "1.2K", color: "from-purple-100 to-violet-50" },
    { key: "personal", label: "شخصية", icon: ShoppingBag, count: "45K", color: "from-fuchsia-100 to-pink-50" },
    { key: "livestock", label: "مواشي", icon: Bird, count: "9K", color: "from-lime-100 to-green-50" },
    { key: "books", label: "كتب", icon: BookOpen, count: "5K", color: "from-teal-100 to-cyan-50" },
    { key: "games", label: "ألعاب", icon: Gamepad2, count: "7K", color: "from-red-100 to-rose-50" },
    { key: "garden", label: "نباتات", icon: Leaf, count: "2K", color: "from-green-100 to-emerald-50" },
    { key: "sports", label: "رياضة", icon: Dumbbell, count: "11K", color: "from-cyan-100 to-blue-50" },
    { key: "kids", label: "أطفال", icon: Baby, count: "6K", color: "from-pink-100 to-rose-50" },
    { key: "all", label: "كل الحراج", icon: Shapes, count: "+", color: "from-slate-100 to-gray-50" },
];

const STORIES = [
    { name: "كلاسيك", img: ImgCar },
    { name: "فلل فاخرة", img: ImgRealEstate },
    { name: "iPhone جديد", img: ImgElectronics },
    { name: "أبقار", img: ImgLivestock },
    { name: "Tesla", img: ImgCar },
    { name: "شقق الرياض", img: ImgRealEstate },
];

const FEATURED = [
    { id: 1, title: "مرسيدس S-Class 2023 فل كامل", price: "385,000", city: "الرياض - حي الياسمين", img: ImgCar, badge: "صفقة جيدة", badgeType: "good", time: "منذ ساعتين", views: 1240 },
    { id: 2, title: "فيلا فاخرة 6 غرف مع مسبح", price: "2,750,000", city: "جدة - الشاطئ", img: ImgRealEstate, badge: "موثّق", badgeType: "verified", time: "منذ 5 ساعات", views: 890 },
    { id: 3, title: "iPhone 15 Pro Max 256GB", price: "4,899", city: "الدمام - الشاطئ", img: ImgElectronics, badge: "ذكاء AI", badgeType: "ai", time: "منذ يوم", views: 2103 },
    { id: 4, title: "ناقة عمانية أصيلة", price: "45,000", city: "حائل - الشنان", img: ImgLivestock, badge: "نادر", badgeType: "rare", time: "منذ 3 أيام", views: 540 },
];

function ThemeToggle({ isDark, onToggle }) {
    return (
        <button
            onClick={onToggle}
            data-testid="theme-toggle-btn"
            className="relative w-10 h-10 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/20 flex items-center justify-center transition-all duration-300 border border-[var(--border)]"
            aria-label="تبديل الوضع"
        >
            {isDark
                ? <Sun className="w-4 h-4 text-[var(--accent)]" />
                : <Moon className="w-4 h-4 text-[var(--secondary)]" />}
        </button>
    );
}

function TopBar({ isDark, onToggle }) {
    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--surface)]/70 border-b border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
                {/* Logo */}
                <div className="flex items-baseline gap-1.5 select-none" data-testid="logo">
                    <span className="font-arabic font-black text-2xl tracking-tight text-[var(--secondary)] dark:text-white">الحراج</span>
                    <span className="font-arabic font-bold text-sm text-[var(--primary)] -mt-1">بلس</span>
                </div>

                {/* Search */}
                <div className="flex-1 mx-2 sm:mx-4 relative">
                    <div className="flex items-center bg-[var(--surface-elevated)] rounded-full px-4 py-2.5 border border-[var(--border)] hover:border-[var(--primary)] transition-all">
                        <Search className="w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            data-testid="search-input"
                            placeholder="ابحث عن أي شيء... (مدعوم بالذكاء الاصطناعي)"
                            className="bg-transparent flex-1 mx-3 outline-none text-sm placeholder:text-[var(--text-muted)] text-[var(--text)] font-arabic-body"
                        />
                        <button data-testid="voice-search" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            <Mic className="w-4 h-4" />
                        </button>
                        <span className="mx-2 text-[var(--border)]">|</span>
                        <button data-testid="image-search" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right actions */}
                <button data-testid="lang-btn" className="hidden sm:flex w-10 h-10 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/20 items-center justify-center border border-[var(--border)] transition-all">
                    <Globe className="w-4 h-4 text-[var(--text)]" />
                </button>
                <button data-testid="notif-btn" className="relative w-10 h-10 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/20 flex items-center justify-center border border-[var(--border)] transition-all">
                    <Bell className="w-4 h-4 text-[var(--text)]" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--danger)] rounded-full pulse-glow"></span>
                </button>
                <ThemeToggle isDark={isDark} onToggle={onToggle} />
            </div>
        </header>
    );
}

function Hero() {
    return (
        <section className="relative max-w-7xl mx-auto mt-6 px-4 sm:px-6">
            <div className="relative rounded-3xl overflow-hidden h-[260px] sm:h-[320px] grain-overlay shadow-lg">
                <img src={HeroBanner} alt="hero" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-[var(--secondary)]/85 via-[var(--secondary)]/45 to-transparent"></div>
                <div className="relative h-full flex flex-col justify-center p-6 sm:p-12 max-w-2xl">
                    <span className="inline-flex items-center gap-2 bg-[var(--primary)]/20 backdrop-blur-md border border-[var(--primary)]/30 text-white rounded-full px-3 py-1.5 text-xs font-bold w-fit mb-4 font-arabic">
                        <Sparkles className="w-3.5 h-3.5" /> مدعوم بالذكاء الاصطناعي
                    </span>
                    <h1 className="font-arabic font-black text-3xl sm:text-5xl text-white leading-[1.1] tracking-tight mb-3">
                        كل ما تحتاجه<br/>
                        <span className="text-[var(--primary)]">في مكان واحد</span>
                    </h1>
                    <p className="text-white/85 text-sm sm:text-base font-arabic-body mb-5 max-w-md">
                        بيع، اشتري، استأجر، وظّف — أكثر من 500K إعلان حقيقي حولك في الخليج
                    </p>
                    <div className="flex gap-3">
                        <button data-testid="cta-post" className="bg-[var(--primary)] text-[var(--primary-fg)] rounded-full px-5 py-3 font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 font-arabic">
                            <Plus className="w-4 h-4" /> أنشر إعلانك
                        </button>
                        <button data-testid="cta-explore" className="bg-white/10 backdrop-blur border border-white/30 text-white rounded-full px-5 py-3 font-bold text-sm hover:bg-white/20 transition-all font-arabic">
                            تصفّح الأقسام
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Stories() {
    return (
        <section className="max-w-7xl mx-auto mt-8 px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-arabic font-bold text-xl text-[var(--text)]">قصص حية</h2>
                <button className="text-sm text-[var(--primary)] font-bold font-arabic" data-testid="stories-all">عرض الكل</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <button data-testid="add-story" className="shrink-0 w-20 h-20 rounded-full bg-[var(--surface-elevated)] border-2 border-dashed border-[var(--primary)] flex flex-col items-center justify-center gap-1 hover:bg-[var(--primary)]/10 transition-all">
                    <Plus className="w-5 h-5 text-[var(--primary)]" />
                    <span className="text-[10px] font-bold text-[var(--primary)] font-arabic">أضف</span>
                </button>
                {STORIES.map((s, i) => (
                    <button key={i} className="shrink-0 flex flex-col items-center gap-1.5" data-testid={`story-${i}`}>
                        <div className="relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-[var(--accent)] via-[var(--primary)] to-[var(--accent)]">
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-[var(--surface)]">
                                <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                                <Play className="w-3 h-3 text-[var(--primary-fg)] fill-current" />
                            </div>
                        </div>
                        <span className="text-[11px] font-arabic-body text-[var(--text-muted)] max-w-[80px] truncate">{s.name}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function CategoriesGrid() {
    return (
        <section className="max-w-7xl mx-auto mt-10 px-4 sm:px-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="font-arabic font-black text-2xl text-[var(--text)]">الأقسام</h2>
                    <p className="text-sm text-[var(--text-muted)] font-arabic-body mt-1">15 قسم — اختر الفئة قبل النشر</p>
                </div>
                <button className="text-sm text-[var(--primary)] font-bold font-arabic" data-testid="categories-all">جميع الأقسام →</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4">
                {CATEGORIES.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <button
                            key={c.key}
                            data-testid={`cat-${c.key}`}
                            className="group relative aspect-square rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-[var(--primary)] hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:opacity-0 dark:group-hover:opacity-10`}></div>
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--surface-elevated)] group-hover:bg-[var(--primary)]/20 flex items-center justify-center transition-all">
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)] group-hover:text-[var(--secondary)] dark:group-hover:text-[var(--primary-hover)] transition-colors" strokeWidth={2} />
                            </div>
                            <span className="relative font-arabic font-bold text-sm sm:text-base text-[var(--text)]">{c.label}</span>
                            <span className="relative text-[11px] text-[var(--text-muted)] font-arabic-body">{c.count} إعلان</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function FeaturedListings() {
    return (
        <section className="max-w-7xl mx-auto mt-12 px-4 sm:px-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="font-arabic font-black text-2xl text-[var(--text)] flex items-center gap-2">
                        قريب منك <MapPin className="w-5 h-5 text-[var(--primary)]" />
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] font-arabic-body mt-1">إعلانات في مدينتك ومدن قريبة — مرتبة بالذكاء</p>
                </div>
                <div className="flex gap-2">
                    <button className="hidden sm:flex items-center gap-1.5 bg-[var(--surface-elevated)] hover:bg-[var(--primary)]/15 text-[var(--text)] px-4 py-2 rounded-full text-sm font-bold border border-[var(--border)] transition-all font-arabic">
                        <Filter className="w-3.5 h-3.5" /> فلترة
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {FEATURED.map((item, i) => (
                    <article
                        key={item.id}
                        data-testid={`listing-${item.id}`}
                        className="group bg-[var(--surface)] rounded-3xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--primary)]/15 transition-all duration-500 cursor-pointer animate-fade-up"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur hover:bg-white flex items-center justify-center shadow-lg" data-testid={`fav-${item.id}`}>
                                <Heart className="w-4 h-4 text-[var(--secondary)]" />
                            </button>
                            <div className="absolute top-3 left-3">
                                {item.badgeType === 'good' && (
                                    <span className="bg-[var(--success)]/95 text-white rounded-full px-3 py-1 text-[10px] font-black font-arabic flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> {item.badge}
                                    </span>
                                )}
                                {item.badgeType === 'verified' && (
                                    <span className="bg-[var(--primary)]/95 text-[var(--primary-fg)] rounded-full px-3 py-1 text-[10px] font-black font-arabic flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> {item.badge}
                                    </span>
                                )}
                                {item.badgeType === 'ai' && (
                                    <span className="bg-gradient-to-r from-[var(--accent)] to-amber-400 text-[var(--secondary)] rounded-full px-3 py-1 text-[10px] font-black font-arabic flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> {item.badge}
                                    </span>
                                )}
                                {item.badgeType === 'rare' && (
                                    <span className="bg-[var(--secondary)]/95 text-white rounded-full px-3 py-1 text-[10px] font-black font-arabic flex items-center gap-1">
                                        <Crown className="w-3 h-3" /> {item.badge}
                                    </span>
                                )}
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="bg-white/90 backdrop-blur rounded-full px-3 py-1.5 text-xs font-bold text-[var(--secondary)] flex items-center gap-1 font-arabic">
                                    <Phone className="w-3 h-3" /> اتصال
                                </button>
                                <button className="bg-[var(--primary)] rounded-full px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] flex items-center gap-1 font-arabic">
                                    <MessageCircle className="w-3 h-3" /> مراسلة
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-arabic font-bold text-base text-[var(--text)] line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors">{item.title}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="font-latin font-black text-2xl text-[var(--secondary)] dark:text-[var(--primary)]">{item.price}</span>
                                <span className="text-xs text-[var(--text-muted)] font-arabic-body">ر.س</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-arabic-body">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.city}</span>
                                <span>{item.time}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function BottomNav() {
    const items = [
        { icon: HomeIcon, label: "الرئيسية", active: true, key: "home" },
        { icon: Search, label: "بحث", active: false, key: "search" },
        { icon: Plus, label: "إعلان", active: false, key: "post", primary: true },
        { icon: MessageCircle, label: "الرسائل", active: false, key: "messages", badge: 3 },
        { icon: User, label: "حسابي", active: false, key: "profile" },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/85 backdrop-blur-xl border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto flex items-center justify-around py-2 px-2">
                {items.map(({ icon: Icon, label, active, key, primary, badge }) => (
                    <button
                        key={key}
                        data-testid={`nav-${key}`}
                        className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                            primary
                                ? 'bg-[var(--primary)] text-[var(--primary-fg)] -mt-7 w-14 h-14 justify-center shadow-lg shadow-[var(--primary)]/40'
                                : active
                                    ? 'text-[var(--primary)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                    >
                        <div className="relative">
                            <Icon className={primary ? "w-6 h-6" : "w-5 h-5"} strokeWidth={primary ? 2.5 : 2} />
                            {badge && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--danger)] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                                    {badge}
                                </span>
                            )}
                        </div>
                        {!primary && <span className="text-[10px] font-arabic font-bold">{label}</span>}
                    </button>
                ))}
            </div>
        </nav>
    );
}

const HomePage = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (isDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    }, [isDark]);

    return (
        <div className="min-h-screen bg-[var(--bg)] pb-24" dir="rtl">
            <TopBar isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            <Hero />
            <Stories />
            <CategoriesGrid />
            <FeaturedListings />
            <BottomNav />
        </div>
    );
};

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
