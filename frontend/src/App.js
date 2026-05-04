import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import AuthCallback from "@/components/AuthCallback";
import HomePage from "@/pages/HomePage";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "@/pages/Auth";
import CategoryPage from "@/pages/CategoryPage";
import ListingDetail from "@/pages/ListingDetail";
import PostListing from "@/pages/PostListing";
import ChatPage from "@/pages/ChatPage";
import ProfilePage from "@/pages/ProfilePage";
import { SearchPage, MapPage } from "@/pages/SearchAndMap";
import AdminPage from "@/pages/AdminPage";
import ReelsPage from "@/pages/ReelsPage";
import AuctionsPage from "@/pages/AuctionsPage";
import FlightsPage from "@/pages/FlightsPage";
import { SettingsPage, TermsPage, PrivacyPage, AboutPage, ContactPage } from "@/pages/StaticPages";

function Layout({ children, hideNav = false }) {
    return (
        <div className="min-h-screen bg-[var(--bg)] pb-24" dir="rtl">
            {!hideNav && <TopBar />}
            {children}
            {!hideNav && <BottomNav />}
        </div>
    );
}

// Detects #session_id= in URL and processes Emergent Google Auth
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AppRouter() {
    const location = useLocation();
    if (location.hash?.includes("session_id=")) return <AuthCallback />;
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/category/:categoryKey" element={<Layout><CategoryPage /></Layout>} />
            <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />
            <Route path="/post" element={<Layout><PostListing /></Layout>} />
            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            <Route path="/map" element={<Layout><MapPage /></Layout>} />
            <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
            <Route path="/reels" element={<Layout><ReelsPage /></Layout>} />
            <Route path="/auctions" element={<Layout><AuctionsPage /></Layout>} />
            <Route path="/flights" element={<Layout><FlightsPage /></Layout>} />
            <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
            <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        </Routes>
    );
}

function App() {
    const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("hp_splash_shown"));
    useEffect(() => {
        if (showSplash) {
            const t = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("hp_splash_shown", "1");
            }, 2200);
            return () => clearTimeout(t);
        }
    }, [showSplash]);

    return (
        <I18nProvider>
            <ThemeProvider>
                <AuthProvider>
                    {showSplash && <SplashScreen />}
                    <BrowserRouter>
                        <AppRouter />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}

export default App;
