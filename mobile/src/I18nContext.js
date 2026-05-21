/**
 * Minimal mobile i18n — AR/EN only. Persisted to AsyncStorage.
 * Pages pass `lang` to backend (e.g. /meta/categories?lang=en) which returns
 * translated category names/options. App-level UI strings are looked up in
 * the STRINGS map below; missing keys fall back to the key itself.
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

const I18nCtx = createContext(null);

const STRINGS = {
    ar: {
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        forgot_password: "نسيت كلمة المرور؟",
        reset_password: "إعادة تعيين كلمة المرور",
        new_password: "كلمة المرور الجديدة",
        send_link: "إرسال رابط الاستعادة",
        save: "حفظ",
        home: "الرئيسية",
        chat: "رسائل",
        profile: "حسابي",
        post_ad: "إضافة إعلان",
        logout: "تسجيل الخروج",
        language: "اللغة",
        loading: "جاري التحميل...",
        no_data: "لا توجد بيانات",
        no_results: "لا توجد نتائج",
        no_notifications: "لا توجد إشعارات",
        send: "إرسال",
        write_message: "اكتب رسالة...",
        check_email_for_reset: "تحقق من بريدك الإلكتروني للرابط",
        password_changed: "تم تغيير كلمة المرور بنجاح",
        error_generic: "حدث خطأ. حاول مرة أخرى.",
        token: "رمز التحقق",
        search: "ابحث عن إعلان...",
        categories: "التصنيفات",
        subcategories: "تصنيف فرعي",
        notifications: "الإشعارات",
        settings: "الإعدادات",
        terms: "الشروط والأحكام",
        privacy: "سياسة الخصوصية",
        about: "عن التطبيق",
        contact: "تواصل معنا",
        login_required: "يجب تسجيل الدخول أولاً",
        favorites: "المفضلة",
        my_listings: "إعلاناتي",
        my_chats: "المحادثات",
        edit: "تعديل",
        delete: "حذف",
        republish: "تجديد",
        mark_sold: "تم البيع",
        confirm: "تأكيد",
        cancel: "إلغاء",
        yes: "نعم",
        no_phone_added: "لم يتم إضافة رقم جوال",
        add_phone: "إضافة الجوال",
    },
    en: {
        login: "Login",
        register: "Register",
        email: "Email",
        password: "Password",
        forgot_password: "Forgot password?",
        reset_password: "Reset Password",
        new_password: "New Password",
        send_link: "Send Reset Link",
        save: "Save",
        home: "Home",
        chat: "Chat",
        profile: "Profile",
        post_ad: "Post Ad",
        logout: "Logout",
        language: "Language",
        loading: "Loading...",
        no_data: "No data",
        no_results: "No results",
        no_notifications: "No notifications",
        send: "Send",
        write_message: "Write a message...",
        check_email_for_reset: "Check your email for the reset link",
        password_changed: "Password changed successfully",
        error_generic: "Something went wrong. Try again.",
        token: "Verification Code",
        search: "Search listings...",
        categories: "Categories",
        subcategories: "subcategories",
        notifications: "Notifications",
        settings: "Settings",
        terms: "Terms & Conditions",
        privacy: "Privacy Policy",
        about: "About",
        contact: "Contact Us",
        login_required: "Login required",
        favorites: "Favorites",
        my_listings: "My Listings",
        my_chats: "Messages",
        edit: "Edit",
        delete: "Delete",
        republish: "Republish",
        mark_sold: "Mark as Sold",
        confirm: "Confirm",
        cancel: "Cancel",
        yes: "Yes",
        no_phone_added: "Phone number not added",
        add_phone: "Add Phone",
    },
};

const KEY = "hp_lang";
let _currentLang = "ar";
export function currentLang() { return _currentLang; }

export function I18nProvider({ children }) {
    const [lang, setLangState] = useState("ar");

    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem(KEY);
            if (saved === "ar" || saved === "en") {
                setLangState(saved);
                _currentLang = saved;
            }
        })();
    }, []);

    const setLang = useCallback(async (l) => {
        if (l !== "ar" && l !== "en") return;
        setLangState(l);
        _currentLang = l;
        await AsyncStorage.setItem(KEY, l);
        // RTL is determined at next app launch; we don't force it mid-session
        try {
            const wantRTL = l === "ar";
            if (I18nManager.isRTL !== wantRTL) {
                I18nManager.allowRTL(wantRTL);
                // Note: forceRTL takes effect only after restart
            }
        } catch (_) {}
    }, []);

    const t = useCallback((key) => STRINGS[lang]?.[key] || STRINGS.ar[key] || key, [lang]);

    return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx) || { lang: "ar", setLang: () => {}, t: (k) => STRINGS.ar[k] || k };
