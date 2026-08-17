import importlib.util
import sys
from datetime import timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
spec = importlib.util.spec_from_file_location("server_under_test", str(ROOT / "backend/server.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

legacy = module._auction_end_datetime({"custom_fields": {"end_date": "2026-06-10"}})
assert legacy is not None
assert legacy.year == 2026 and legacy.month == 6 and legacy.day == 10
assert legacy.hour == 23 and legacy.minute == 59 and legacy.tzinfo == timezone.utc

modern = module._auction_end_datetime({"custom_fields": {"end_time": "2026-12-01T10:00:00+00:00"}})
assert modern is not None and modern.isoformat().startswith("2026-12-01T10:00:00")

print("auction end compatibility: PASS")
