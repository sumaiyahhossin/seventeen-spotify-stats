import datetime
import json
import os
import pathlib
import zoneinfo

now = datetime.datetime.now(zoneinfo.ZoneInfo('America/New_York'))
state_file = pathlib.Path(__file__).resolve().parents[1] / 'data/state.json'
state = json.loads(state_file.read_text()) if state_file.exists() else {}
entry = state.get('group', {})
today = now.date().isoformat()
pending = bool(entry.get('pending')) and entry.get('checked_date') != today
# GitHub cron uses UTC; two daily entries cover both EST and EDT.
daily_window = now.hour == 16 and now.minute >= 47
retry_window = now.hour >= 16 and entry.get('checked_date') != today
manual = os.getenv('GITHUB_EVENT_NAME') in ('workflow_dispatch', 'push')
run = manual or daily_window or (pending and retry_window)
print('run=' + str(run).lower())
