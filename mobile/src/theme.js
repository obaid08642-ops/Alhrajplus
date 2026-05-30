// Design tokens — mirror exactly the CSS variables used in web /app/frontend
// Source of truth: web Tailwind classes "var(--primary)" etc.
export const colors = {
    primary: "#1F7BBF",        // ↑ darker for stronger contrast on light bg
    primaryHover: "#155A8E",
    primaryFg: "#FFFFFF",
    secondary: "#0F1A35",
    accent: "#FFD166",
    bg: "#F5F9FD",
    surface: "#FFFFFF",
    surfaceElevated: "#EEF6FC",
    text: "#0B1530",           // ↑ deeper for max readability
    textMuted: "#475569",      // ↑ darker than #64748B — passes WCAG AA on light bg
    border: "#C9DCEF",         // ↑ slightly darker so cards have visible edges
    success: "#0F9F6E",
    danger: "#DC2626",
    warning: "#D97706",
    // Bottom nav specific (matches web BottomNav.js literals)
    navActive: "#1F7BBF",
    navInactive: "#5E84A8",    // ↑ darker than #88B8DC so inactive tabs remain readable
    navBg: "rgba(255,255,255,0.92)",  // ↑ less transparent
};

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, "2xl": 28, "3xl": 32, full: 999 };

// Spacing scale matches Tailwind: 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32
export const space = (n) => n * 4;

// Typography — uses system Arabic + bold weights
export const font = {
    arabic: { fontWeight: "700" }, // bold display
    arabicBlack: { fontWeight: "900" },
    body: { fontWeight: "400" },
};

export const shadow = {
    card: {
        shadowColor: "#0F1B3A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    fab: {
        shadowColor: "#4FB6E6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 12,
    },
    nav: {
        shadowColor: "#0F1B3A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10,
    },
};

// Legacy alias so existing screens keep compiling during migration
export const theme = {
    colors: {
        ...colors,
        primaryDark: colors.primaryHover,
        bgDark: "#0A1128",
        surfaceDark: "#162033",
        surfaceElevatedDark: "#1E2A44",
        textDark: "#E7EEF8",
        textMutedDark: "#94A3B8",
        borderDark: "#1E2A44",
    },
    radius,
    spacing: space,
};
