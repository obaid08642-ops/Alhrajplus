"""Phase 7 — Native map and 3D viewer contracts without WebView."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MOBILE = ROOT / "mobile"


def test_mobile_source_and_dependencies_are_webview_free():
    package = json.loads((MOBILE / "package.json").read_text(encoding="utf-8"))
    assert "react-native-webview" not in package["dependencies"]
    assert not (MOBILE / "src" / "screens" / "MapScreen.js").exists()
    assert not (MOBILE / "src" / "components" / "Model3DViewerMobile.js").exists()
    for source in (MOBILE / "src").rglob("*.js"):
        assert "react-native-webview" not in source.read_text(encoding="utf-8")


def test_native_map_uses_maplibre_with_geojson_listings_and_osm_style():
    package = json.loads((MOBILE / "package.json").read_text(encoding="utf-8"))
    assert "@maplibre/maplibre-react-native" in package["dependencies"]
    native_map = (MOBILE / "src" / "screens" / "MapScreen.native.js").read_text(encoding="utf-8")
    for token in ("@maplibre/maplibre-react-native", "GeoJSONSource", "OSM_RASTER_STYLE", "/listings/map/nearby", "ListingDetail"):
        assert token in native_map
    assert "WebView" not in native_map


def test_native_3d_viewer_uses_filament_and_enforces_glb_uploads():
    package = json.loads((MOBILE / "package.json").read_text(encoding="utf-8"))
    assert "react-native-filament" in package["dependencies"]
    assert "react-native-worklets-core" in package["dependencies"]
    viewer = (MOBILE / "src" / "components" / "Model3DViewerMobile.native.js").read_text(encoding="utf-8")
    for token in ("FilamentScene", "FilamentView", "<Model", "isGlb", "transformToUnitCube", "ZoomIn"):
        assert token in viewer
    assert "WebView" not in viewer

    post = (MOBILE / "src" / "screens" / "PostScreen.js").read_text(encoding="utf-8")
    assert '"model/gltf-binary"' in post
    assert '"model/gltf+json"' not in post
    assert "يرجى اختيار ملف GLB للعرض الأصلي" in post


def test_native_plugins_and_babel_support_maplibre_and_filament():
    app_config = (MOBILE / "app.config.js").read_text(encoding="utf-8")
    babel = (MOBILE / "babel.config.js").read_text(encoding="utf-8")
    assert "@maplibre/maplibre-react-native" in app_config
    assert "react-native-worklets-core/plugin" in babel
