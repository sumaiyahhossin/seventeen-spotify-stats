import datetime
import json
import os
import pathlib
import zoneinfo

now = datetime.datetime.now(zoneinfo.ZoneInfo('America/New_York'))
state_file = pathlib.Path(__file__).resolve().parents[1] / 'data/state.json'
state = json.loads(state_file.read_text()) if state_file.exists() else {}
today = now.date().isoformat()
# Collect at or after 8:59 PM New York time (EST/EDT), then retry hourly
# until the day's snapshot is confirmed, including after failed runs.
due = (now.hour > 20 or (now.hour == 20 and now.minute >= 59)) and state.get('group', {}).get('checked_date') != today
manual = os.getenv('GITHUB_EVENT_NAME') in ('workflow_dispatch', 'push')
print('run=' + str(manual or due).lower())
