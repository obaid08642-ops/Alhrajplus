// Design tokens — Phase 4 redesign.
// Baby-blue primary + vibrant-orange accent (FAB only) + off-white cards
// + 16-24px radius + soft shadows. Matches the new identity brief.
export const colors = {
    // PRIMARY — baby blue. Logo, headers, dominant icons, holograms, prices.
    primary: "#89CFF0",
    primaryHover: "#5FB6E0",   // hover/pressed state — slightly deeper baby blue
    primaryDeep: "#2A8CBD",    // text-on-light uses this for AA contrast
    primaryFg: "#0B1530",      // text color sitting on the primary surface

    // ACCENT — vibrant orange. RESERVED for the central "create listing" FAB
    // in the tab bar and tiny attention dots. Do NOT use anywhere else.
    accent: "#FF8C00",
    accentHover: "#E67A00",
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

    // Bottom nav — primary for active tab, muted slate for inactive.
    navActive: "#5FB6E0",
    navInactive: "#94A3B8",
    navBg: "rgba(255,255,255,0.96)",

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
        shadowColor: "#89CFF0",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
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
        shadowColor: "#FF8C00",
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
