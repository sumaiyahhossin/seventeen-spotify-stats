"""Schedule Spotify collections from 2 PM New York daily, with hourly retries
even after midnight until the oldest missing reporting date is published.

Each dataset has independent progress determined by the last saved date, not
a day-of-run checkbox. No future-dated data is created.
"""
import datetime
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

root=Path(__file__).resolve().parents[1]
now=datetime.datetime.now(ZoneInfo("America/New_York"))
manual=os.environ.get("GITHUB_EVENT_NAME")=="workflow_dispatch"
eligible_date=now.date()-datetime.timedelta(days=1 if now.hour>=14 else 2)
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
    # Retry when the previous reporting date is still pending, even at
    # 12 AM, 4 AM, or 1 PM the following day.
    enabled=pending_date<=eligible_date
    any_enabled=any_enabled or enabled
    print(f"{kind}={str(enabled).lower()}")
    print(f"{kind}: {'collect' if enabled else 'skip'} "
          f"(local={now:%Y-%m-%d %H:%M}, pending={pending_date}, "
          f"available_through={eligible_date})",file=__import__("sys").stderr)

print(f"run={str(any_enabled).lower()}")
