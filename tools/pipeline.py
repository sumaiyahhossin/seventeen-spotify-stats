import json, pathlib, sys, subprocess, datetime, zoneinfo, re, os
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; TZ=zoneinfo.ZoneInfo('America/New_York')
now=datetime.datetime.now(TZ)
today=now.date().isoformat()
# After 2 PM, today's fresh Spotify counter observation is eligible;
# date advancement is still blocked unless real counters changed.
# Each reporting date opens at 2 PM New York, but an unfinished date
# remains pending across midnight (and across subsequent 2 PM cutoffs).
# Never derive the target exclusively from today's calendar date.
from reporting_window import available_reporting_date
available_through=available_reporting_date(now).isoformat()
state_path=DATA/'state.json'
state=json.loads(state_path.read_text()) if state_path.exists() else {'group':{},'solo':{}}
kind=sys.argv[1]
entry=state.setdefault(kind,{})
current_path=DATA/f'{kind}.json'
previous=json.loads(current_path.read_text()) if current_path.exists() else None
if previous and previous.get('date'):
    report_date=(datetime.date.fromisoformat(previous['date'])+datetime.timedelta(days=1)).isoformat()
else:
    report_date=entry.get('pending') or available_through
# Explicit pending state takes priority when it represents an older missing
# report than the date inferred from the newest snapshot.
if entry.get('pending') and entry['pending']<report_date:
    report_date=entry['pending']
if report_date>available_through:
    print(f'{kind}: no new reporting date is due (last saved: {previous.get("date") if previous else "none"}; available through: {available_through})')
    sys.exit(0)
entry['pending']=report_date
force_collect = os.getenv('FORCE_COLLECT') == 'true'
if force_collect:
    print(f'{kind}: forced retry of pending reporting date {report_date}')
else:
    print(f'{kind}: collecting pending reporting date {report_date}; latest eligible {available_through}')
if not os.getenv('COLLECTOR_CLASSPATH'):
    raise SystemExit('Set COLLECTOR_CLASSPATH to Selenium dependency classpath')
subprocess.run([sys.executable,str(ROOT/'tools/instrument.py'),kind],check=True)
classname='Stream_Stats' if kind=='group' else 'Stream_Stats_Units_Duos'
subprocess.run(['javac','-cp',os.environ['COLLECTOR_CLASSPATH'],'-d',str(ROOT/'build'),str(ROOT/'build'/f'{classname}.java')],check=True)
# Only the first catalog track determines whether to start the full group scan.
# A missing baseline falls back to the normal full collection.
collector_env=os.environ.copy()
# Fast single-song probes save hours of scanning, but they can miss a partial
# Spotify refresh when that particular song stays unchanged. Cross-check the
# entire catalog at least every four hours while a date remains pending.
last_full_scan=entry.get('last_full_scan')
try:
    last_full_at=datetime.datetime.fromisoformat(last_full_scan) if last_full_scan else None
    last_full_age=now-last_full_at.astimezone(TZ) if last_full_at else None
except (ValueError,TypeError):
    last_full_age=None
full_scan=force_collect or last_full_age is None or last_full_age>=datetime.timedelta(hours=4)
if full_scan:
    collector_env.pop('SVT_FIRST_TRACK_PREVIOUS',None)
    entry['last_full_scan']=now.isoformat()
    print(f'{kind}: full catalog verification (force={force_collect}, fallback for partial Spotify updates)',flush=True)
elif kind in ('group','solo') and previous:
    first_id='4BHThgh4ODCszIJ6e4YGGw' if kind=='group' else '1beUALLSloBEvYre65QiW6'
    first_old=previous.get('tracks',{}).get(first_id)
    if first_old is None and kind=='solo' and previous.get('source')=='historical spreadsheet':
        first_old=previous['tracks'].get('legacy:betterhalffeatomoinotake:2')
    if isinstance(first_old,int) and first_old>0:
        collector_env['SVT_FIRST_TRACK_PREVIOUS']=str(first_old)
result=subprocess.run(['java','-cp',str(ROOT/'build')+os.pathsep+os.environ['COLLECTOR_CLASSPATH'],classname],capture_output=True,text=True,timeout=18000,env=collector_env)
if 'STAT_FIRST_UNCHANGED|' in result.stdout or 'STAT_FIRST_PROBE_FAILED|' in result.stdout:
    print(kind,': fast probe has not refreshed (or failed); periodic full scan remains scheduled')
    entry['last_attempt']=now.isoformat()
    state_path.write_text(json.dumps(state,indent=2))
    sys.exit(0)

(ROOT/'build'/f'{kind}.log').write_text(result.stdout+'\n'+result.stderr)
tracks={};listeners={};followers=None;solo_followers={}
for line in result.stdout.splitlines():
    m=re.match(r'STAT_TRACK\|https://open\.spotify\.com/track/([A-Za-z0-9]+)\|(\d+)',line)
    if m: tracks[m.group(1)]=int(m.group(2))
    m=re.match(r'STAT_LISTENERS\|([A-Za-z0-9]+)\|(\d+)',line)
    if m: listeners[m.group(1)]=int(m.group(2))
    m=re.match(r'STAT_FOLLOWERS\|(\d+)',line)
    if m: followers=int(m.group(1))
    m=re.match(r'STAT_FOLLOWERS\|([A-Za-z0-9]{22})\|(\d+)',line)
    if m and kind=='solo': solo_followers[m.group(1)]=int(m.group(2))
if kind=='group' and followers is None:
    reasons=[line for line in result.stdout.splitlines() if line.startswith('STAT_FOLLOWERS_UNAVAILABLE|')]
    reason=reasons[-1].split('|',1)[1] if reasons else 'no exact follower metric emitted'
    print(f'group: exact Spotify followers unavailable ({reason}); streams and monthly listeners can still be saved')
    if not (os.getenv('SPOTIFY_CLIENT_ID') and os.getenv('SPOTIFY_CLIENT_SECRET')):
        print('group: Spotify API credentials not configured; Selenium About-dialog extraction is the only follower source')
# Prefer Spotify's exact artist follower count when API credentials are configured.
# The public artist page often displays only a rounded number.
if kind=='group' and followers is None and os.getenv('SPOTIFY_CLIENT_ID') and os.getenv('SPOTIFY_CLIENT_SECRET'):
    try:
        import urllib.request, urllib.parse, base64
        auth=base64.b64encode((os.environ['SPOTIFY_CLIENT_ID']+':'+os.environ['SPOTIFY_CLIENT_SECRET']).encode()).decode()
        token_request=urllib.request.Request(
            'https://accounts.spotify.com/api/token',
            data=urllib.parse.urlencode({'grant_type':'client_credentials'}).encode(),
            headers={'Authorization':'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'})
        with urllib.request.urlopen(token_request,timeout=20) as response:
            access_token=json.load(response)['access_token']
        artist_request=urllib.request.Request(
            'https://api.spotify.com/v1/artists/7nqOGRxlXj7N2JYbgNEjYH',
            headers={'Authorization':'Bearer '+access_token})
        with urllib.request.urlopen(artist_request,timeout=20) as response:
            artist_data=json.load(response)
        api_followers=artist_data.get('followers',{}).get('total')
        if isinstance(api_followers,int) and api_followers>0:
            followers=api_followers
            print('group: exact Spotify followers retrieved from artist API')
        else:
            print('group: Spotify artist API did not provide exact followers')
    except Exception as error:
        print(f'group: Spotify artist API follower request failed ({type(error).__name__}); keeping unavailable')
# When OAuth credentials are available, use Spotify's exact follower totals
# for every solo/unit artist (not rounded public-page numbers).
if kind=='solo' and os.getenv('SPOTIFY_CLIENT_ID') and os.getenv('SPOTIFY_CLIENT_SECRET'):
    try:
        import urllib.request, urllib.parse, base64
        auth=base64.b64encode((os.environ['SPOTIFY_CLIENT_ID']+':'+os.environ['SPOTIFY_CLIENT_SECRET']).encode()).decode()
        token_request=urllib.request.Request(
            'https://accounts.spotify.com/api/token',
            data=urllib.parse.urlencode({'grant_type':'client_credentials'}).encode(),
            headers={'Authorization':'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'})
        with urllib.request.urlopen(token_request,timeout=20) as response:
            token=json.load(response)['access_token']
        profiles=json.loads((DATA/'profile-images.json').read_text())
        artists=list(profiles)
        request=urllib.request.Request(
            'https://api.spotify.com/v1/artists?'+urllib.parse.urlencode({'ids':','.join(artists)}),
            headers={'Authorization':'Bearer '+token})
        with urllib.request.urlopen(request,timeout=20) as response:
            artist_data=json.load(response)
        for artist in artist_data.get('artists') or []:
            if not isinstance(artist,dict):continue
            follower_count=(artist.get('followers') or {}).get('total')
            if isinstance(follower_count,int) and follower_count>=0 and artist.get('id') in profiles:
                solo_followers[artist['id']]=follower_count
        print(f'solo: exact followers available for {len(solo_followers)} artist profiles')
    except Exception as error:
        print(f'solo: Spotify artist API follower request failed ({type(error).__name__}); retaining only verified dialog counts')
cat=json.loads((DATA/'catalog.json').read_text())[kind]
# Additional releases are not hardcoded into the legacy Selenium Java source.
# Scan those recordings separately with the same authenticated GitHub runner.
admin_ids=sorted({tid for item in cat if item.get('admin_added')
                  for tid in item.get('tracks',[])})
if admin_ids:
    admin_source=ROOT/'src'/'Admin_Track_Collector.java'
    subprocess.run(['javac','-cp',os.environ['COLLECTOR_CLASSPATH'],'-d',str(ROOT/'build'),str(admin_source)],check=True)
    admin_result=subprocess.run(
        ['java','-cp',str(ROOT/'build')+os.pathsep+os.environ['COLLECTOR_CLASSPATH'],
         'Admin_Track_Collector',*admin_ids],
        capture_output=True,text=True,timeout=3600)
    for line in admin_result.stdout.splitlines():
        m=re.match(r'STAT_TRACK\|https://open\.spotify\.com/track/([A-Za-z0-9]+)\|(\d+)',line)
        if m: tracks[m.group(1)]=int(m.group(2))
    if admin_result.returncode:
        raise SystemExit('Admin-added track scan failed; retry later instead of publishing incomplete data')
    print(f'{kind}: scanned {len(admin_ids)} admin-added recordings',flush=True)
expected={tid for item in cat for tid in item['tracks']}
by_id={tid:(item.get('artist'),item.get('title')) for item in cat for tid in item['tracks']}
# A zero from Spotify is a failed lookup, not a successful number. The initial
# full scan is attempt one; make at most two additional targeted passes. This
# applies to every group, unit, and solo track, not just selected songs.
unresolved={tid for tid in expected if tracks.get(tid,0)<=0}
if unresolved:
    print(f'{kind}: {len(unresolved)} zero/missing tracks after scan 1 of 3',flush=True)
    for tid in sorted(unresolved):
        print(f'  {tid}: {by_id.get(tid)}',flush=True)
if result.returncode:
    print(f'{kind}: collector exited {result.returncode}; not accepting zeros from a crashed scan')
    entry['last_attempt']=now.isoformat()
    state_path.write_text(json.dumps(state,indent=2))
    sys.exit(1)

for attempt in (2,3):
    if not unresolved:
        break
    retry_env=collector_env.copy()
    retry_env.pop('SVT_FIRST_TRACK_PREVIOUS',None)
    retry_env['SVT_ONLY_TRACKS']=','.join(sorted(unresolved))
    print(f'{kind}: scan {attempt} of 3 for {len(unresolved)} zero/missing tracks',flush=True)
    retry_admin_ids=sorted(unresolved.intersection(admin_ids))
    if retry_admin_ids:
        retry_admin=subprocess.run(
            ['java','-cp',str(ROOT/'build')+os.pathsep+os.environ['COLLECTOR_CLASSPATH'],
             'Admin_Track_Collector',*retry_admin_ids],
            capture_output=True,text=True,timeout=3600)
        for line in retry_admin.stdout.splitlines():
            m=re.match(r'STAT_TRACK\|https://open\.spotify\.com/track/([A-Za-z0-9]+)\|(\d+)',line)
            if m and int(m.group(2))>0: tracks[m.group(1)]=int(m.group(2))
        if retry_admin.returncode:
            raise SystemExit('Admin track retry crashed; not accepting missing results')
    legacy_unresolved=unresolved.difference(admin_ids)
    if not legacy_unresolved:
        unresolved={tid for tid in expected if tracks.get(tid,0)<=0}
        continue
    retry_env['SVT_ONLY_TRACKS']=','.join(sorted(legacy_unresolved))
    retry_result=subprocess.run(
        ['java','-cp',str(ROOT/'build')+os.pathsep+os.environ['COLLECTOR_CLASSPATH'],classname],
        capture_output=True,text=True,timeout=2400,env=retry_env)
    print(f'{kind}: scan {attempt} exit={retry_result.returncode}',flush=True)
    for line in retry_result.stdout.splitlines():
        match=re.match(r'STAT_TRACK\|https://open\.spotify\.com/track/([A-Za-z0-9]+)\|(\d+)',line)
        if match and match.group(1) in unresolved and int(match.group(2))>0:
            tracks[match.group(1)]=int(match.group(2))
        elif line.startswith('STAT_TRACK_UNAVAILABLE|'):
            print(f'{kind}: {line}',flush=True)
    unresolved={tid for tid in expected if tracks.get(tid,0)<=0}

# After all three scans, persist genuine zero results explicitly; never
# substitute old counts or create fake positive values.
for tid in sorted(unresolved):
    tracks[tid]=0
    print(f'{kind}: zero after 3 scans: {tid} {by_id.get(tid)}',flush=True)
if unresolved:
    print(f'{kind}: accepting {len(unresolved)} confirmed zero tracks; all expected IDs included',flush=True)

# Compare with the latest saved group snapshot, including manually imported history.
if not previous:
    manifest_file=DATA/'manifest.json'
    if manifest_file.exists():
        manifest=json.loads(manifest_file.read_text())
        for old_date in sorted(manifest.get('dates',[]),reverse=True):
            if old_date>=report_date:continue
            old_path=DATA/'history'/f'{kind}-{old_date}.json'
            if not old_path.exists() and kind=='solo':
                old_path=ROOT/f'solo-{old_date}.json'
            if old_path.exists():
                previous=json.loads(old_path.read_text())
                break
    if previous is None and kind=='solo':
        for old_date in sorted(manifest.get('solo_dates',[]),reverse=True):
            if old_date >= report_date:continue
            old_path=ROOT/f'solo-{old_date}.json'
            if old_path.exists():
                previous=json.loads(old_path.read_text())
                break
if previous:
    old=previous['tracks']
    comparable=[k for k in expected if k in old]
    if kind=='solo' and previous.get('source')=='historical spreadsheet':
        # Trust the verified spreadsheet position of Better Half, not title
        # matching among other artists' recordings.
        first_id='1beUALLSloBEvYre65QiW6'
        legacy_id='legacy:betterhalffeatomoinotake:2'
        if legacy_id in old and first_id in tracks:
            comparable.append(first_id)
            old={**old,first_id:old[legacy_id]}
    if comparable and not any(tracks[k]>old[k] for k in comparable):
        # Followers may update before Spotify publishes fresh track streams.
        # Save a newly obtained exact follower count without overwriting the
        # existing track counts or falsely completing the daily collection.
        if kind=='group' and followers and report_date >= '2026-11-06' and followers != previous.get('followers'):
            # Preserve the snapshot's original collection date, but never
            # attach follower data to dates before tracking began.
            previous['followers']=followers
            current_path.write_text(json.dumps(previous,ensure_ascii=False,indent=2))
            archive=DATA/'history'/f'{kind}-{previous["date"]}.json'
            if archive.exists():
                archived=json.loads(archive.read_text())
                archived['followers']=followers
                archive.write_text(json.dumps(archived,ensure_ascii=False,indent=2))
            print(kind,'saved exact follower count',followers,'without replacing unchanged streams')
        print(kind,'Spotify counts unchanged; retry next hour')
        entry['last_attempt']=now.isoformat();state_path.write_text(json.dumps(state,indent=2));sys.exit(0)
    regressions=sum(tracks[k]<old.get(k,0) for k in expected)
    if regressions>max(2,len(expected)//20):
        print(kind,'too many decreased counts; retry next hour')
        entry['last_attempt']=now.isoformat();state_path.write_text(json.dumps(state,indent=2));sys.exit(0)
# Preserve stable song identities and historical baseline mappings across daily runs.
# Never infer identities from equal stream totals or overwrite a known track name.
if kind=='group' and previous:
    previous_names=previous.get('names') or {}
    previous_ids=previous.get('canonical_track_ids') or []
    previous_baselines=previous.get('baseline_ids_2026_11_05') or {}
    preserved_names={track_id:previous_names[track_id] for track_id in tracks if track_id in previous_names}
    preserved_ids=[track_id for track_id in previous_ids if track_id in tracks]
    preserved_baselines={track_id:baseline_id for track_id,baseline_id in previous_baselines.items() if track_id in tracks}
else:
    preserved_names={}
    preserved_ids=[]
    preserved_baselines={}
snapshot={'date':report_date,'captured_at':now.isoformat(),'tracks':tracks,'listeners':listeners}
if kind=='solo' and solo_followers:
    snapshot['followers']=solo_followers
if kind=='group':
    if preserved_names: snapshot['names']=preserved_names
    if preserved_ids:
        # Keep established song identity/order; append genuinely new Spotify IDs.
        snapshot['canonical_track_ids']=preserved_ids+[track_id for track_id in tracks if track_id not in previous['tracks']]
    if preserved_baselines: snapshot['baseline_ids_2026_11_05']=preserved_baselines

if kind=='group':
    artist='7nqOGRxlXj7N2JYbgNEjYH'
    if listeners.get(artist): snapshot['monthly_listeners']=listeners[artist]
    if followers: snapshot['followers']=followers
    # Only publish follower counts returned by this collection run.
    # Do not carry a previous or manually supplied value forward.
if previous:
    p=DATA/'history'/f'{kind}-{previous["date"]}.json'
    if not p.exists() and previous.get('source')!='historical spreadsheet':
        p.write_text(json.dumps(previous,ensure_ascii=False,indent=2))
current_path.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2))
archive_path=DATA/'history'/f'{kind}-{report_date}.json'
archive_path.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2))
manifest_path=DATA/'manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'dates':[]}
date_key='solo_dates' if kind=='solo' else 'dates'
manifest.setdefault(date_key,[])
if previous and previous['date'] not in manifest[date_key]:manifest[date_key].append(previous['date'])
if report_date not in manifest[date_key]:manifest[date_key].append(report_date)
manifest[date_key]=sorted(set(manifest[date_key]),reverse=True)
manifest_path.write_text(json.dumps(manifest,indent=2))
entry.update({'checked_date':today,'reported_date':report_date,'pending':None,'last_success':now.isoformat()})
state_path.write_text(json.dumps(state,indent=2))
print(kind,'saved Spotify reporting date',report_date,'tracks:',len(tracks))
