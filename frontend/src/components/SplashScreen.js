import { useState, useEffect } from "react";

export default function SplashScreen() {
    const [hide, setHide] = useState(false);
    useEffect(() => {
        const t1 = setTimeout(() => setHide(true), 2000);
        return () => clearTimeout(t1);
    }, []);
    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-[#0A1128] via-[#1A2952] to-[#0A1128] transition-opacity duration-700 ${hide ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <div className="absolute inset-0 grain-overlay opacity-30"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#4FB6E6]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.6s" }}></div>
            <div className="relative flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#4FB6E6]/40 rounded-full blur-2xl scale-110 animate-pulse"></div>
                    <img src="/logo-haraj.png" alt="الحراج بلس" className="relative w-32 h-32 sm:w-40 sm:h-40 object-contain animate-fade-up drop-shadow-2xl" />
                </div>
                <div className="text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
                    <div className="flex items-baseline justify-center gap-2">
                        <h1 className="font-arabic font-black text-3xl sm:text-4xl text-white tracking-tight">الحراج</h1>
                        <span className="font-arabic font-bold text-base sm:text-lg text-[#4FB6E6]">بلس</span>
                    </div>
                    <p className="text-white/60 font-arabic-body text-xs sm:text-sm mt-1">بيع و اشتري | جديد أو مستعمل</p>
                </div>
                <div className="w-44 h-0.5 bg-white/10 rounded-full overflow-hidden animate-fade-up" style={{ animationDelay: "0.6s" }}>
                    <div className="h-full bg-gradient-to-r from-[#4FB6E6] to-[#D4AF37] rounded-full" style={{ animation: "splashLoad 1.4s ease-out forwards" }}></div>
                </div>
            </div>
            <style>{`
                @keyframes splashLoad { from { width: 0% } to { width: 100% } }
            `}</style>
        </div>
    );
}
