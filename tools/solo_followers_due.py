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
due=[]
for artist_id in manifest:
    record=records.get(artist_id,{})
    try:
        captured=dt.datetime.fromisoformat(record['captured_at'])
        fresh=dt.timedelta(0) <= now-captured < dt.timedelta(hours=23)
    except (ValueError,TypeError,KeyError):
        fresh=False
    if not isinstance(record.get('count'),int) or not fresh:
        due.append(artist_id)
print('due='+str(bool(due)).lower())
print(f'Follower profiles due: {len(due)} of {len(manifest)}',file=__import__('sys').stderr)
