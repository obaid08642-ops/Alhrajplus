import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import HomePage from "@/pages/HomePage";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "@/pages/Auth";
import CategoryPage from "@/pages/CategoryPage";
import ListingDetail from "@/pages/ListingDetail";
import PostListing from "@/pages/PostListing";
import ChatPage from "@/pages/ChatPage";
import ProfilePage from "@/pages/ProfilePage";
import { SearchPage, MapPage } from "@/pages/SearchAndMap";
import AdminPage from "@/pages/AdminPage";

function Layout({ children, hideNav = false }) {
    return (
        <div className="min-h-screen bg-[var(--bg)] pb-24" dir="rtl">
            {!hideNav && <TopBar />}
            {children}
            {!hideNav && <BottomNav />}
        </div>
    );
}

function App() {
    return (
        <I18nProvider>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
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
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}

export default App;
