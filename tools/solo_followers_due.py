"""Gate independent solo/unit follower collection.

Missing verified values retry every hour. Once all artist profiles have an exact
count, refresh observations daily instead of needlessly opening every profile.
"""
import datetime as dt
import json
import pathlib
from zoneinfo import ZoneInfo

ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
now=dt.datetime.now(ZoneInfo('America/New_York'))
try:
    data=json.loads((DATA/'solo-followers.json').read_text())
except (OSError,ValueError):
    data={}
try:
    manifest=json.loads((DATA/'profile-images.json').read_text())
except (OSError,ValueError):
    manifest={}
records=data.get('followers',{})
# Spotify reporting resets at 2 PM America/New_York, including daylight
# saving transitions. Before 2 PM, finish yesterday's missing observations;
# at/after 2 PM begin today's, retrying only missing profiles hourly.
target_date=(now.date() if now.hour>=14 else (now.date()-dt.timedelta(days=1)))
due=[]
for artist_id in manifest:
    record=records.get(artist_id,{})
    try:
        captured=dt.datetime.fromisoformat(record['captured_at'])
        observed_date=captured.astimezone(ZoneInfo('America/New_York')).date()
        has_exact=isinstance(record.get('count'),int) and record['count']>=0
    except (ValueError,TypeError,KeyError,AttributeError):
        observed_date=None
        has_exact=False
    if not has_exact or observed_date is None or observed_date<target_date:
        due.append(artist_id)
print('due='+str(bool(due)).lower())
print(f'Follower reporting date {target_date}: {len(due)} of {len(manifest)} profiles due',file=__import__('sys').stderr)
