// Design tokens — Phase 18 redesign (Feb 2026).
// Primary = web-parity medium sky-blue (#4FB6E6 → #2196D9 hover) applied
// across BOTH top header AND bottom tab bar. FAB stays vibrant orange so
// the central "create listing" CTA pops against the primary blue surface.
export const colors = {
    // PRIMARY — medium sky blue (matches web's --primary).
    primary: "#01c9ff",
    primaryHover: "#6DAEE0",   // deeper hover state — used by gradient & pressed.
    primaryDeep: "#0F1B3A",    // navy text/icon on light surfaces (AAA contrast).
    primaryFg: "#FFFFFF",      // text/icons sitting ON the primary surface.

    // ACCENT — vibrant orange. RESERVED for the central "create listing" FAB
    // in the tab bar and tiny attention dots. Do NOT use anywhere else.
    accent: "#D4AF37",
    accentHover: "#B8941F",
    accentFg: "#FFFFFF",

    // Surfaces — pure white background + soft off-white card surface.
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceCard: "#F8FAFC",    // off-white cards
    surfaceElevated: "#F1F5F9",

    // Text — deep navy on white passes AAA.
    text: "#0B1530",
    textMuted: "#475569",
    textSubtle: "#64748B",

    // Border — kept very light so soft shadows do the work.
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",

    // Semantics
    success: "#10B981",
    danger:  "#EF4444",
    warning: "#F59E0B",

    // Bottom nav — when tab bar background is primary blue, active=white
    // (high-contrast pill highlight) and inactive=white at 70% opacity.
    navActive: "#FFFFFF",
    navInactive: "rgba(255,255,255,0.72)",
    navBg: "#01c9ff",

    // Legacy alias kept so older screens compile until migration finishes.
    secondary: "#0F1A35",
};

// Unified radius scale — Phase 4 mandate: every card / button / image in 16-24.
// `sm` is reserved for chips/badges; full=pill.
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, "2xl": 28, "3xl": 32, full: 999 };

export const space = (n) => n * 4;

export const font = {
    arabic:      { fontWeight: "700" },
    arabicBlack: { fontWeight: "900" },
    body:        { fontWeight: "400" },
};

// Soft, blurred shadows — replace hard borders. All shadows tinted with the
// primary baby blue so cards feel cohesive.
export const shadow = {
    card: {
        // Owner-mandated card shadow — soft, diffused, primary-blue tinted.
        shadowColor: "#01c9ff",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardLarge: {
        shadowColor: "#0F1B3A",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.10,
        shadowRadius: 28,
        elevation: 8,
    },
    fab: {
        // Orange-tinted glow for the central create-listing FAB.
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.40,
        shadowRadius: 24,
        elevation: 14,
    },
    nav: {
        shadowColor: "#0F1B3A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.10,
        shadowRadius: 30,
        elevation: 10,
    },
    soft: {
        shadowColor: "#0F1B3A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
};

// Backwards-compat: many screens import `theme.colors`, `theme.radius`, etc.
export const theme = {
    colors: {
        ...colors,
        primaryDark: colors.primaryDeep,
        bgDark: "#0A1128",
        surfaceDark: "#162033",
        surfaceElevatedDark: "#1E2A44",
        textDark: "#E7EEF8",
        textMutedDark: "#94A3B8",
        borderDark: "#1E2A44",
    },
    radius,
    spacing: space,
    shadow,
};
