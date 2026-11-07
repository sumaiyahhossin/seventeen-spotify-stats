import datetime
import json
import os
import pathlib
import zoneinfo

now = datetime.datetime.now(zoneinfo.ZoneInfo('America/New_York'))
state_file = pathlib.Path(__file__).resolve().parents[1] / 'data/state.json'
state = json.loads(state_file.read_text()) if state_file.exists() else {}
today = now.date().isoformat()
# Collect at 5 PM New York time (EST/EDT), then retry every hour
# if the day's snapshot is not yet confirmed, including after failed runs.
due = now.hour >= 17 and state.get('group', {}).get('checked_date') != today
manual = os.getenv('GITHUB_EVENT_NAME') in ('workflow_dispatch', 'push')
print('run=' + str(manual or due).lower())
