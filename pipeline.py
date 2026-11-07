import json, pathlib, sys, subprocess, datetime, zoneinfo, re, os
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; TZ=zoneinfo.ZoneInfo('Asia/Seoul')
now=datetime.datetime.now(TZ)
today=now.date().isoformat()
report_date=(now.date()-datetime.timedelta(days=2)).isoformat()
state_path=DATA/'state.json'
state=json.loads(state_path.read_text()) if state_path.exists() else {'group':{},'solo':{}}
kind=sys.argv[1]
entry=state.setdefault(kind,{})
current_path=DATA/f'{kind}.json'
previous=json.loads(current_path.read_text()) if current_path.exists() else None
# A daily run at 00:00 NY time begins checking; pending remains until fresh data is confirmed.
if not entry.get('pending') and entry.get('checked_date')!=today:
    entry['pending']=today
if not entry.get('pending'):
    print(kind,'already updated today');sys.exit(0)
if not os.getenv('COLLECTOR_CLASSPATH'):
    raise SystemExit('Set COLLECTOR_CLASSPATH to Selenium dependency classpath')
subprocess.run([sys.executable,str(ROOT/'tools/instrument.py'),kind],check=True)
classname='Stream_Stats' if kind=='group' else 'Stream_Stats_Units_Duos'
subprocess.run(['javac','-cp',os.environ['COLLECTOR_CLASSPATH'],'-d',str(ROOT/'build'),str(ROOT/'build'/f'{classname}.java')],check=True)
result=subprocess.run(['java','-cp',str(ROOT/'build')+os.pathsep+os.environ['COLLECTOR_CLASSPATH'],classname],capture_output=True,text=True,timeout=18000)
(ROOT/'build'/f'{kind}.log').write_text(result.stdout+'\n'+result.stderr)
tracks={};listeners={}
for line in result.stdout.splitlines():
    m=re.match(r'STAT_TRACK\|https://open\.spotify\.com/track/([A-Za-z0-9]+)\|(\d+)',line)
    if m: tracks[m.group(1)]=int(m.group(2))
    m=re.match(r'STAT_LISTENERS\|([A-Za-z0-9]+)\|(\d+)',line)
    if m: listeners[m.group(1)]=int(m.group(2))
cat=json.loads((DATA/'catalog.json').read_text())[kind]
expected={id for item in cat for id in item['tracks']}
missing=expected-set(tracks)
if result.returncode or missing or any(tracks[t]<=0 for t in expected):
    print(f'{kind}: incomplete collection; missing {len(missing)} of {len(expected)} tracks; exit={result.returncode}; retry next hour')
    entry['last_attempt']=now.isoformat();state_path.write_text(json.dumps(state,indent=2));sys.exit(0)
if previous:
    old=previous['tracks']
    if not any(tracks.get(k,0)>old.get(k,0) for k in expected):
        print(kind,'Spotify counts unchanged; retry next hour')
        entry['last_attempt']=now.isoformat();state_path.write_text(json.dumps(state,indent=2));sys.exit(0)
    # Block large regressions from partial / corrupted reads.
    regressions=sum(tracks[k]<old.get(k,0) for k in expected)
    if regressions>max(2,len(expected)//20):
        print(kind,'too many decreased counts; retry next hour')
        entry['last_attempt']=now.isoformat();state_path.write_text(json.dumps(state,indent=2));sys.exit(0)
snapshot={'date':report_date,'captured_at':now.isoformat(),'tracks':tracks,'listeners':listeners}
# Archive previous confirmed data by its own date, never overwrite that snapshot.
if previous:
    p=DATA/'history'/f'{kind}-{previous["date"]}.json'
    if not p.exists():p.write_text(json.dumps(previous,ensure_ascii=False,indent=2))
current_path.write_text(json.dumps(snapshot,ensure_ascii=False,indent=2))
manifest_path=DATA/'manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'dates':[]}
if previous and previous['date'] not in manifest['dates']:manifest['dates'].append(previous['date'])
manifest['dates']=sorted(set(manifest['dates']),reverse=True)
manifest_path.write_text(json.dumps(manifest,indent=2))
entry.update({'checked_date':today,'pending':None,'last_success':now.isoformat()})
state_path.write_text(json.dumps(state,indent=2))
print(kind,'saved Spotify reporting date',report_date,'tracks:',len(tracks))
