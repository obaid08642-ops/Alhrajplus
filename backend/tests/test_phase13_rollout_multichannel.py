"""Phase 13 — multichannel rollout and feature-flag contracts."""

from pathlib import Path

import server


ROOT = Path(__file__).resolve().parents[2]


def test_feature_flag_resolution_defaults_admin_value_and_environment_kill_switch(monkeypatch):
    monkeypatch.delenv("FEATURE_FLAG_IMAGE_SEARCH", raising=False)
    defaults = server._resolved_feature_flags()
    assert defaults == {
        "image_search": True,
        "voice_search": True,
        "pwa_install": True,
        "premium_navigation": True,
    }

    stored = server._resolved_feature_flags({"image_search": False, "voice_search": "off"})
    assert stored["image_search"] is False
    assert stored["voice_search"] is False

    monkeypatch.setenv("FEATURE_FLAG_IMAGE_SEARCH", "true")
    assert server._resolved_feature_flags({"image_search": False})["image_search"] is True
    monkeypatch.setenv("FEATURE_FLAG_IMAGE_SEARCH", "0")
    assert server._resolved_feature_flags({"image_search": True})["image_search"] is False


def test_shared_rollout_contract_is_exposed_and_consumed_by_web_and_mobile():
    backend = (ROOT / "backend" / "server.py").read_text(encoding="utf-8")
    web_api = (ROOT / "frontend" / "src" / "lib" / "api.js").read_text(encoding="utf-8")
    web_flags = (ROOT / "frontend" / "src" / "contexts" / "FeatureFlagsContext.js").read_text(encoding="utf-8")
    web_search = (ROOT / "frontend" / "src" / "pages" / "SearchAndMap.js").read_text(encoding="utf-8")
    web_profile = (ROOT / "frontend" / "src" / "pages" / "ProfilePage.js").read_text(encoding="utf-8")
    mobile_api = (ROOT / "mobile" / "src" / "api.js").read_text(encoding="utf-8")
    mobile_flags = (ROOT / "mobile" / "src" / "featureFlags.js").read_text(encoding="utf-8")
    mobile_search = (ROOT / "mobile" / "src" / "screens" / "SearchScreen.js").read_text(encoding="utf-8")

    for token in ('@api.get("/meta/feature-flags")', '@api.get("/admin/feature-flags")', '@api.put("/admin/feature-flags")', "ROLLOUT_FEATURE_FLAG_DEFAULTS"):
        assert token in backend
    for source in (web_api, mobile_api):
        assert 'api.get("/meta/feature-flags")' in source
        assert "getFeatureFlags" in source
    for source in (web_flags, mobile_flags):
        assert "DEFAULT_FEATURE_FLAGS" in source
        assert "image_search" in source
        assert "premium_navigation" in source
    for token in ('useFeatureFlag("image_search")', 'useFeatureFlag("voice_search")', 'imageSearchEnabled &&', 'voiceSearchEnabled &&'):
        assert token in web_search
    assert 'useFeatureFlag("pwa_install")' in web_profile
    for token in ('useFeatureFlags()', 'image_search !== false', 'voice_search !== false', 'imageSearchEnabled &&'):
        assert token in mobile_search


def test_premium_navigation_rollout_flag_reaches_all_navigation_variants():
    for path in (
        ROOT / "frontend" / "src" / "components" / "layout" / "BottomNav.js",
        ROOT / "mobile" / "src" / "components" / "FloatingTabBar.js",
        ROOT / "mobile" / "src" / "components" / "StandaloneFloatingTabBar.js",
    ):
        source = path.read_text(encoding="utf-8")
        assert "premium_navigation" in source
        assert "premiumNavigationEnabled" in source
