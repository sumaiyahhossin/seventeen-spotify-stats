"""Collect exact Spotify followers for all solo/unit profiles, independently of streams.

Never backfill these into old dated stream snapshots: a follower count observed
now is not the follower count on November 7. GitHub Actions retries missing
profiles every hour, and refreshes older verified readings daily.
"""
import base64
import datetime as dt
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo

ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
OUTPUT=DATA/'solo-followers.json'
TODAY=dt.datetime.now(ZoneInfo('America/New_York'))
MAX_AGE=dt.timedelta(hours=23)

def load(path, default):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, OSError):
        return default

manifest=load(DATA/'profile-images.json',{})
admin=load(DATA/'admin-releases.json',{})
ids=set(id for id in manifest if re.fullmatch(r'[a-zA-Z0-9]{22}',id))
for release in admin.get('releases',[]):
    if release.get('scope')!='solo': continue
    m=re.fullmatch(r'https://open\.spotify\.com/artist/([A-Za-z0-9]{22})',release.get('spotify_artist_url',''))
    if m: ids.add(m.group(1))
# Neither JxJ nor V8 has a Spotify artist profile; do not invent one.
data=load(OUTPUT,{'followers':{}})
saved=data.get('followers',{})
if not isinstance(saved,dict): saved={}
pending=[]
for artist_id in sorted(ids):
    entry=saved.get(artist_id,{})
    count=entry.get('count') if isinstance(entry,dict) else None
    try:
        observed=dt.datetime.fromisoformat(entry['captured_at'])
        fresh=TODAY-observed<MAX_AGE and observed<=TODAY
    except (KeyError,ValueError,TypeError):
        fresh=False
    if not (isinstance(count,int) and count>=0 and fresh):
        pending.append(artist_id)
print(f'solo/unit followers: {len(saved)}/{len(ids)} already recorded, {len(pending)} need exact verification',flush=True)
if not pending:
    sys.exit(0)

found={}
client_id=os.getenv('SPOTIFY_CLIENT_ID')
client_secret=os.getenv('SPOTIFY_CLIENT_SECRET')
if client_id and client_secret:
    try:
        credential=base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
        token_request=urllib.request.Request(
            'https://accounts.spotify.com/api/token',
            data=urllib.parse.urlencode({'grant_type':'client_credentials'}).encode(),
            headers={'Authorization':'Basic '+credential,'Content-Type':'application/x-www-form-urlencoded'})
        with urllib.request.urlopen(token_request,timeout=25) as response:
            token=json.load(response)['access_token']
        for offset in range(0,len(pending),50):
            group=pending[offset:offset+50]
            url='https://api.spotify.com/v1/artists?'+urllib.parse.urlencode({'ids':','.join(group)})
            req=urllib.request.Request(url,headers={'Authorization':'Bearer '+token})
            with urllib.request.urlopen(req,timeout=35) as response:
                artists=json.load(response).get('artists',[])
            for artist in artists or []:
                if not artist or artist.get('id') not in group: continue
                count=(artist.get('followers') or {}).get('total')
                if isinstance(count,int) and count>=0:found[artist['id']]=count
        print(f'Spotify API: verified {len(found)} follower totals',flush=True)
    except Exception as error:
        print(f'Spotify API unavailable ({type(error).__name__}); using the artist About dialog',flush=True)

missing=[id for id in pending if id not in found]
if missing:
    classpath=os.getenv('COLLECTOR_CLASSPATH')
    if not classpath:
        print('Missing COLLECTOR_CLASSPATH: cannot run fallback artist collector',file=sys.stderr)
    else:
        subprocess.run([sys.executable,str(ROOT/'tools/instrument.py'),'solo'],check=True)
        subprocess.run(['javac','-cp',classpath,'-d',str(ROOT/'build'),
                        str(ROOT/'build'/'Stream_Stats_Units_Duos.java')],check=True)
        env=os.environ.copy()
        env.pop('SVT_FIRST_TRACK_PREVIOUS',None)
        env['SVT_FOLLOWERS_ONLY']=','.join(missing)
        result=subprocess.run(['java','-cp',str(ROOT/'build')+os.pathsep+classpath,
                               'Stream_Stats_Units_Duos'],capture_output=True,text=True,
                              timeout=2400,env=env)
        for line in result.stdout.splitlines():
            match=re.fullmatch(r'STAT_FOLLOWERS\|([a-zA-Z0-9]{22})\|(\d+)',line.strip())
            if match and match.group(1) in missing:
                found[match.group(1)]=int(match.group(2))
            elif line.startswith('STAT_FOLLOWERS_UNAVAILABLE|'):
                print(line,flush=True)
        if result.returncode:
            print(f'Follower-only Java collector exited {result.returncode}: {result.stderr[-500:]}',flush=True)
        print(f'Spotify About dialogs: verified {len(found)} total profiles in this pass',flush=True)

if found:
    now=TODAY.isoformat()
    for artist_id,count in found.items():
        saved[artist_id]={'count':count,'captured_at':now,'source':'spotify-exact-followers'}
    data={'updated_at':now,'followers':saved}
    OUTPUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
remaining=sorted(id for id in ids if id not in saved or not isinstance(saved[id].get('count'),int))
print(f'Solo/unit follower archive: {len(ids)-len(remaining)}/{len(ids)} verified. '
      f'Unverified artist profiles: {len(remaining)}; scheduled hourly retries continue.',flush=True)
