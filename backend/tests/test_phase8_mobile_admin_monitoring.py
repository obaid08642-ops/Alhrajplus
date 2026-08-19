"""Phase 8 — Mobile admin monitoring parity contract."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MOBILE = ROOT / "mobile"
SERVER = ROOT / "backend" / "server.py"


def test_mobile_admin_dashboard_includes_protected_monitoring_panel():
    dashboard = (MOBILE / "src" / "screens" / "AdminDashboardScreen.js").read_text(encoding="utf-8")
    assert 'import AdminMonitoringPanel from "../components/AdminMonitoringPanel"' in dashboard
    assert "<AdminMonitoringPanel />" in dashboard
    assert 'toLocaleString("en-US")' in dashboard
    assert "adminMfaRequired" in dashboard


def test_mobile_monitoring_panel_reads_health_and_confirms_manual_run():
    source = (MOBILE / "src" / "components" / "AdminMonitoringPanel.js").read_text(encoding="utf-8")
    for token in (
        'api.get("/admin/monitoring")',
        'api.post("/admin/monitoring/run")',
        "Alert.alert",
        "listing_schema",
        "api_health",
        "email_alerts_configured",
        "numberingSystem: \"latn\"",
        'testID="admin-monitoring-run"',
    ):
        assert token in source


def test_backend_monitoring_endpoint_remains_admin_scoped_and_read_only():
    server = SERVER.read_text(encoding="utf-8")
    assert '@admin_router.get("/monitoring")' in server
    assert '@admin_router.post("/monitoring/run")' in server
    assert "Run an on-demand check without sending a duplicate operational email" in server
    assert "This never changes a listing or calls a search-engine indexing API" in server
