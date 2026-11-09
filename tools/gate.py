"""Gate the two independent Spotify collectors at 2 PM New York time.

Each dataset retries hourly until its own newly validated snapshot is
published. After success it sleeps until 2 PM the next local calendar day.
"""
import datetime
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

root = Path(__file__).resolve().parents[1]
now = datetime.datetime.now(ZoneInfo("America/New_York"))
today = now.date().isoformat()
path = root / "data" / "state.json"
try:
    state = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
except (OSError, ValueError):
    state = {}

manual = os.environ.get("GITHUB_EVENT_NAME") == "workflow_dispatch"
in_window = now.hour >= 14
for kind in ("group", "solo"):
    already_done = state.get(kind, {}).get("checked_date") == today
    enabled = manual or (in_window and not already_done)
    print(f"{kind}={str(enabled).lower()}")
    print(f"{kind}: {'collect' if enabled else 'skip'} "
          f"(manual={manual}, local={now:%Y-%m-%d %H:%M}, "
          f"completed_today={already_done})", file=__import__("sys").stderr)
print(f"run={str(manual or (in_window and any(state.get(k, {}).get('checked_date') != today for k in ('group', 'solo')))).lower()}")
