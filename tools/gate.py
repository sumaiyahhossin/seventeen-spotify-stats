import datetime
import json
import os
import pathlib
import zoneinfo

now = datetime.datetime.now(zoneinfo.ZoneInfo('Asia/Seoul'))
state_file = pathlib.Path(__file__).resolve().parents[1] / 'data/state.json'
state = json.loads(state_file.read_text()) if state_file.exists() else {}
pending = any(state.get(k, {}).get('pending') for k in ('group', 'solo'))

test_window = (now.date() == datetime.date(2026, 11, 8) and (now.hour == 4 and now.minute >= 49 or now.hour == 5))
daily_window = now.date() >= datetime.date(2026, 11, 8) and now.hour == 0
run = os.getenv('GITHUB_EVENT_NAME') in ('workflow_dispatch', 'push') or test_window or daily_window or (now.date() >= datetime.date(2026, 11, 8) and pending)
print('run=' + str(run).lower())
