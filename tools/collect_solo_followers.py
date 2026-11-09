"""Collect exact Spotify followers for all solo/unit profiles, independently of streams.

Never backfill these into old dated stream snapshots: a follower count observed
now is not the follower count on November 7. Missing readings retry hourly;
verified readings refresh daily.
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
# Match the 2 PM New York reporting-day gate used by solo_followers_due.py.
REPORT_DATE=TODAY.date() if TODAY.hour>=14 else TODAY.date()-dt.timedelta(days=1)
REPORT_CUTOFF=dt.datetime.combine(REPORT_DATE,dt.time(14,0),tzinfo=ZoneInfo('America/New_York'))

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
        fresh=(observed.astimezone(ZoneInfo('America/New_York'))>=REPORT_CUTOFF and observed<=TODAY)
    except (KeyError,ValueError,TypeError):
        fresh=False
    if not (isinstance(count,int) and count>=0 and fresh):
        pending.append(artist_id)
print(f'solo/unit followers: {len(saved)}/{len(ids)} already recorded; {len(pending)} due for {REPORT_DATE}',flush=True)
if not pending:
    sys.exit(0)

# Rotate across overdue profiles rather than retrying the first few each hour.
# Small bounded batches prevent competing stream jobs from timing out.
FULL_SCAN=os.getenv('SVT_FOLLOWERS_FULL_SCAN','').strip().lower() in ('1','true','yes','on')
if FULL_SCAN:
    print('Full manual follower scan: checking every due profile',flush=True)
else:
    rotation=(int(TODAY.timestamp()//3600)*3)%len(pending)
    pending=(pending[rotation:]+pending[:rotation])[:3]
print(f'Follower scan mode: {"FULL" if FULL_SCAN else "HOURLY"}; profiles this run: {len(pending)}',flush=True)
print('Follower scan batch: '+', '.join(pending),flush=True)
print('API verification for '+str(len(pending))+' profiles',flush=True)

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
        # Spotify removed GET /v1/artists?ids=... in Development Mode.
        # The single-artist endpoint remains supported, although Spotify may
        # omit the followers field entirely for Development Mode apps.
        for artist_id in pending:
            try:
                url='https://api.spotify.com/v1/artists/'+artist_id
                req=urllib.request.Request(url,headers={'Authorization':'Bearer '+token})
                with urllib.request.urlopen(req,timeout=25) as response:
                    artist=json.load(response)
                count=(artist.get('followers') or {}).get('total')
                if isinstance(count,int) and count>=0:
                    found[artist_id]=count
            except Exception as error:
                print(f'Artist API unavailable for {artist_id} ({type(error).__name__})',flush=True)
        print(f'Spotify API: verified {len(found)} follower totals',flush=True)
    except Exception as error:
        print(f'Spotify API unavailable ({type(error).__name__}); using the artist About dialog',flush=True)

missing=[id for id in pending if id not in found]
if missing:
    classpath=os.getenv('COLLECTOR_CLASSPATH')
    if not classpath:
        print('Missing COLLECTOR_CLASSPATH: cannot run fallback artist collector',file=sys.stderr)
    else:
        # Probe only this hour's rotating batch; preserve every exact result.
        print('Browser fallback for '+str(len(missing))+' unresolved profiles',flush=True)
        subprocess.run([sys.executable,str(ROOT/'tools/instrument.py'),'solo'],check=True)
        subprocess.run(['javac','-cp',classpath,'-d',str(ROOT/'build'),
                        str(ROOT/'build'/'Stream_Stats_Units_Duos.java')],check=True)
        env=os.environ.copy()
        env.pop('SVT_FIRST_TRACK_PREVIOUS',None)
        env['SVT_FOLLOWERS_ONLY']=','.join(missing)
        result=subprocess.run(['java','-cp',str(ROOT/'build')+os.pathsep+classpath,
                               'Stream_Stats_Units_Duos'],capture_output=True,text=True,
                              timeout=3300 if FULL_SCAN else 1200,env=env)
        for line in result.stdout.splitlines():
            match=re.fullmatch(r'STAT_FOLLOWERS\|([a-zA-Z0-9]{22})\|(\d+)',line.strip())
            if match and match.group(1) in missing:
                found[match.group(1)]=int(match.group(2))
            elif line.startswith(('STAT_FOLLOWERS_UNAVAILABLE|','STAT_FOLLOWERS_DIAGNOSTIC|')):
                print(line,flush=True)
        if result.returncode:
            print(f'Browser follower probe failed (Java exit {result.returncode}): {result.stderr[-500:]}',file=sys.stderr)
        if any(id not in found for id in missing):
            diagnostics=[line for line in result.stdout.splitlines() if line.startswith(('STAT_FOLLOWERS_UNAVAILABLE|','STAT_FOLLOWERS_DIAGNOSTIC|'))]
            print('Some exact follower totals are still unavailable; retaining those profiles as unverified. '+ ' ; '.join(diagnostics[-6:]),flush=True)
        else:
            print('Browser fallback verified '+str(sum(id in found for id in missing))+' additional artists.',flush=True)

if found:
    now=TODAY.isoformat()
    history=data.get('history',{})
    if not isinstance(history,dict): history={}
    # Keep real observation dates; do NOT assign Nov 7 or any older day
    # to counts that were actually captured on Nov 9 or later.
    observed_day=TODAY.date().isoformat()
    observations=history.setdefault(observed_day,{})
    for artist_id,count in found.items():
        saved[artist_id]={'count':count,'captured_at':now,'source':'spotify-exact-followers'}
        observations[artist_id]={'count':count,'captured_at':now,'source':'spotify-exact-followers'}
    data={'updated_at':now,'followers':saved,'history':history}
    OUTPUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
remaining=sorted(id for id in ids if id not in saved or not isinstance(saved[id].get('count'),int))
print(f'Solo/unit follower archive: {len(ids)-len(remaining)}/{len(ids)} verified. '
      f'Unverified artist profiles: {len(remaining)}; unverified values remain blank.',flush=True)
