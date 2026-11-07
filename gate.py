import datetime
import json
import os
import pathlib
import zoneinfo

now = datetime.datetime.now(zoneinfo.ZoneInfo('Asia/Seoul'))
state_file = pathlib.Path(__file__).resolve().parents[1] / 'data/state.json'
state = json.loads(state_file.read_text()) if state_file.exists() else {}
pending = any(state.get(k, {}).get('pending') for k in ('group', 'solo'))

# One-time scheduled test: Nov 7, 2026 2:35 PM EST = Nov 8, 2026 4:35 AM KST.
# GitHub's cron syntax has no year, so guard the test against repeating in 2027.
test_window = (now.date() == datetime.date(2026, 11, 8) and now.hour == 4 and now.minute >= 35 and now.minute < 55)
# Normal daily collection at midnight KST; retry hourly if either collector is pending.
daily_window = now.date() >= datetime.date(2026, 11, 8) and now.hour == 0
run = os.getenv('GITHUB_EVENT_NAME') == 'workflow_dispatch' or test_window or daily_window or (now.date() >= datetime.date(2026, 11, 8) and pending)
print('run=' + str(run).lower())
