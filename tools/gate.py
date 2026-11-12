"""Schedule Spotify collections from 2 PM New York daily, with hourly retries
even after midnight until the oldest missing reporting date is published.

Each dataset has independent progress determined by its last saved date.
At 2 PM NY, the previous calendar day's Spotify report becomes eligible.
Publishing still requires fresh Spotify counters; do not fill a date with unchanged observations.
"""
import datetime
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

root=Path(__file__).resolve().parents[1]
now=datetime.datetime.now(ZoneInfo("America/New_York"))
manual=os.environ.get("GITHUB_EVENT_NAME")=="workflow_dispatch"
from reporting_window import available_reporting_date, oldest_due_date
eligible_date=available_reporting_date(now)
any_enabled=False

for kind in ("group","solo"):
    saved=root/"data"/f"{kind}.json"
    try:
        snapshot=json.loads(saved.read_text(encoding="utf-8")) if saved.exists() else {}
    except (OSError,ValueError):
        snapshot={}
    try:
        last_date=datetime.date.fromisoformat(snapshot["date"])
        pending_date=last_date+datetime.timedelta(days=1)
    except (KeyError,ValueError,TypeError):
        pending_date=eligible_date
    # Retry the oldest due reporting date hourly, including across midnight.
    enabled=oldest_due_date(pending_date-datetime.timedelta(days=1),now) is not None
    any_enabled=any_enabled or enabled
    print(f"{kind}={str(enabled).lower()}")
    print(f"{kind}: {'collect' if enabled else 'skip'} "
          f"(local={now:%Y-%m-%d %H:%M}, pending={pending_date}, "
          f"available_through={eligible_date})",file=__import__("sys").stderr)

print(f"run={str(any_enabled).lower()}")
