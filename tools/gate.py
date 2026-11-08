import datetime
import json
import os
import pathlib
import zoneinfo

eastern_now = datetime.datetime.now(zoneinfo.ZoneInfo('America/New_York'))
ny_now = datetime.datetime.now(zoneinfo.ZoneInfo('America/New_York'))
state_file = pathlib.Path(__file__).resolve().parents[1] / 'data/state.json'
state = json.loads(state_file.read_text()) if state_file.exists() else {}
snapshot_file = pathlib.Path(__file__).resolve().parents[1] / 'data/group.json'
snapshot = json.loads(snapshot_file.read_text()) if snapshot_file.exists() else {}
today = ny_now.date().isoformat()
# Start at 2:00 PM New York time, retry each hour until the new day's streams are saved.
# A missing follower count must not trigger more stream runs after success.
due = eastern_now.hour >= 14 and state.get('group', {}).get('checked_date') != today
manual = os.getenv('GITHUB_EVENT_NAME') == 'workflow_dispatch'
print('run=' + str(manual or due).lower())
