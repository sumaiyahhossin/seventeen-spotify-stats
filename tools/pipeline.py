import json, pathlib, sys, subprocess, datetime, zoneinfo, re, os
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; TZ=zoneinfo.ZoneInfo('America/New_York')
now=datetime.datetime.now(TZ)
today=now.date().isoformat()
report_date=(now.date()-datetime.timedelta(days=1)).isoformat()
state_path=DATA/'state.json'
state=json.loads(state_path.read_text()) if state_path.exists() else {'group':{},'solo':{}}
kind=sys.argv[1]
entry=state.setdefault(kind,{})
current_path=DATA/f'{kind}.json'
previous=json.loads(current_path.read_text()) if current_path.exists() else None
if entry.get('checked_date')!=today:
    entry['pending']=today
force_collect = os.getenv('FORCE_COLLECT') == 'true' or (kind == 'group' and not (previous or {}).get('followers'))
if not entry.get('pending') and not force_collect:
    print(kind,'already updated today');sys.exit(0)
if force_collect:
    print(kind,'forced collection requested; bypassing daily completion check')
if not os.getenv('COLLECTOR_CLASSPATH'):
    raise SystemExit('Set COLLECTOR_CLASSPATH to Selenium dependency classpath')
subprocess.run([sys.executable,str(ROOT/'tools/instrument.py'),kind],check=True)
classname='Stream_Stats' if kind=='group' else 'Stream_Stats_Units_Duos'
subprocess.run(['javac','-cp',os.environ['COLLECTOR_CLASSPATH'],'-d',str(ROOT/'build'),str(ROOT/'build'/f'{classname}.java')],check=True)
result=subprocess.run(['java','-cp',str(ROOT/'build')+os.pathsep+os.environ['COLLECTOR_CLASSPATH'],classname],capture_output=True,text=True,timeout=18000)
(ROOT/'build'/f'{kind}.log').write_text(result.stdout+'\n'+result.stderr)
tracks={};listeners={};followers=None
for line in result.stdout.splitlines():
    m=re.match(r'STAT_TRACK\|https://open\.spotify\.com/track/([A-Za-z0-9]+)\|(\d+)',line)
    if m: tracks[m.group(1)]=int(m.group(2))
    m=re.match(r'STAT_LISTENERS\|([A-Za-z0-9]+)\|(\d+)',line)
    if m: listeners[m.group(1)]=int(m.group(2))
    m=re.match(r'STAT_FOLLOWERS\|(\d+)',line)
    if m: followers=int(m.group(1))
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
cat=json.loads((DATA/'catalog.json').read_text())[kind]
expected={id for item in cat for id in item['tracks']}
missing=expected-set(tracks)
if result.returncode or missing or any(tracks[t]<=0 for t in expected):
    print(f'{kind}: incomplete collection; missing {len(missing)} of {len(expected)} tracks; exit={result.returncode}; retry next hour')
    entry['last_attempt']=now.isoformat();state_path.write_text(json.dumps(state,indent=2));sys.exit(0)
# Compare with the latest saved group snapshot, including manually imported history.
if not previous:
    manifest_file=DATA/'manifest.json'
    if manifest_file.exists():
        manifest=json.loads(manifest_file.read_text())
        for old_date in sorted(manifest.get('dates',[]),reverse=True):
            if old_date>=report_date:continue
            old_path=DATA/'history'/f'{kind}-{old_date}.json'
            if old_path.exists():
                previous=json.loads(old_path.read_text())
                break
if previous:
    old=previous['tracks']
    comparable=[k for k in expected if k in old]
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
    if not p.exists():p.write_text(json.dumps(previous,ensure_ascii=False,indent=2))
current_path.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2))
archive_path=DATA/'history'/f'{kind}-{report_date}.json'
archive_path.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2))
manifest_path=DATA/'manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'dates':[]}
if previous and previous['date'] not in manifest['dates']:manifest['dates'].append(previous['date'])
if report_date not in manifest['dates']:manifest['dates'].append(report_date)
manifest['dates']=sorted(set(manifest['dates']),reverse=True)
manifest_path.write_text(json.dumps(manifest,indent=2))
entry.update({'checked_date':today,'pending':None,'last_success':now.isoformat()})
state_path.write_text(json.dumps(state,indent=2))
print(kind,'saved Spotify reporting date',report_date,'tracks:',len(tracks))
