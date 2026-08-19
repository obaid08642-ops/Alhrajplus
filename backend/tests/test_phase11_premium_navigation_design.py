"""Phase 11 — Premium bottom-navigation parity contracts."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_web_bottom_navigation_uses_premium_outline_icons_and_transparent_notch():
    source = (ROOT / "frontend" / "src" / "components" / "layout" / "BottomNav.js").read_text(encoding="utf-8")

    for token in (
        'const FLOATING_FAB_COLOR = "#B7F20A"',
        'const FLOATING_FAB_FOREGROUND = "#062C1F"',
        'data-testid={`nav-icon-${key}`}',
        'color-mix(in srgb, var(--nav-fg) 16%, transparent)',
        'fill="none"',
        'TRANSPARENT_NOTCH_MASK',
        'maskImage: TRANSPARENT_NOTCH_MASK',
        'backgroundColor: "var(--nav-bg)"',
        'data-testid="nav-post-fab"',
    ):
        assert token in source


def test_mobile_navigation_variants_share_dimensions_icon_halos_and_lime_fab():
    primary = (ROOT / "mobile" / "src" / "components" / "FloatingTabBar.js").read_text(encoding="utf-8")
    standalone = (ROOT / "mobile" / "src" / "components" / "StandaloneFloatingTabBar.js").read_text(encoding="utf-8")

    for source, icon_test_id in (
        (primary, 'testID={`tab-icon-${tab.name}`}'),
        (standalone, 'testID={`standalone-tab-icon-${tab.key}`}'),
    ):
        for token in (
            'const BAR_HEIGHT = 32',
            'const HOLE_RADIUS = 46',
            'const FAB_W = 52',
            'const FAB_H = 74',
            'const FAB_SUBMERGE = 34',
            'const FLOATING_FAB_COLOR = "#B7F20A"',
            'const FLOATING_FAB_FOREGROUND = "#062C1F"',
            'fillRule="evenodd"',
            "iconHalo:",
            icon_test_id,
        ):
            assert token in source

    assert "pulseRing" not in standalone
    assert "burstRing" not in standalone
    assert 'backgroundColor: FLOATING_FAB_COLOR' in standalone
