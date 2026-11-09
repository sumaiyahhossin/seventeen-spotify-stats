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
target_date = (now.date() - datetime.timedelta(days=1 if in_window else 2)).isoformat()
for kind in ("group", "solo"):
    saved = root / "data" / f"{kind}.json"
    try:
        snapshot = json.loads(saved.read_text(encoding="utf-8")) if saved.exists() else {}
    except (OSError, ValueError):
        snapshot = {}
    # Check the actual published reporting date. This also handles legacy
    # workflow state created before the 2 PM timezone cutoff fix.
    already_done = snapshot.get("date") == target_date
    enabled = manual or (in_window and not already_done)
    print(f"{kind}={str(enabled).lower()}")
    print(f"{kind}: {'collect' if enabled else 'skip'} "
          f"(manual={manual}, local={now:%Y-%m-%d %H:%M}, "
          f"reporting_date={target_date}, completed={already_done})", file=__import__("sys").stderr)
run = manual or (in_window and any(
    (not (root / "data" / f"{kind}.json").exists()) or
    json.loads((root / "data" / f"{kind}.json").read_text(encoding="utf-8")).get("date") != target_date
    for kind in ("group", "solo")))
print(f"run={str(run).lower()}")
