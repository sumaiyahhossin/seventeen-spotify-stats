Does not change the original workbook or pretend that spreadsheet names are Spotify IDs.
import collections,datetime,hashlib,json,pathlib,re,sys,zipfile,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else ROOT.parent/'SEVENTEEN Spotify Streams.xlsx'
DATA=ROOT/'data'; OUT=DATA/'history';OUT.mkdir(exist_ok=True)
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
def colnum(s):
 n=0
 for c in s:n=n*26+ord(c)-64
 return n-1
def norm(s):return re.sub(r'[^a-z0-9]+','',s.casefold())
def asnum(v):
 try:
  n=float(v)
  return int(n) if n>=0 and n.is_integer() else None
 except (ValueError,TypeError):return None
catalog=json.loads((DATA/'catalog.json').read_text())['group']
lookup=collections.defaultdict(set)
for album in catalog:
 desc=album.get('description','');names=desc.split(':',1)[-1].split(',')
 for name,id in zip(names,album['tracks']):lookup[norm(name.strip())].add(id)
with zipfile.ZipFile(SOURCE) as z:
 ss=[''.join(t.text or '' for t in x.iter() if t.tag==NS+'t') for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
 snapshots={};issues=[];bad_dates=[];duplicate_dates=[];non_numeric=0;skipped=0
 for si in range(1,14):
  expected_month=11 if si in (1,13) else (si+10)%12+1 # corrected below
  expected_month=[11,12,1,2,3,4,5,6,7,8,9,10,11][si-1]
  year=2025 if si<=2 else 2026
  blocks={};rows=collections.defaultdict(dict)
  with z.open(f'xl/worksheets/sheet{si}.xml') as fh:
   for _,el in ET.iterparse(fh,events=('end',)):
    if el.tag!=NS+'row':continue
    r=int(el.attrib['r'])
    for c in el:
     if c.tag!=NS+'c':continue
     ref=c.attrib.get('r','');m=re.match(r'([A-Z]+)\d+',ref)
     if not m:continue
     ci=colnum(m.group(1));v=next((x.text for x in c if x.tag==NS+'v'),None)
     if v is None:continue
     if c.attrib.get('t')=='s':v=ss[int(v)]
     if r==1:
      dm=re.match(r'^(\d{1,2})/(\d{1,2}) Song Name',str(v))
      if dm:
       month,day=map(int,dm.groups())
       if month!=expected_month:continue # ignore stale copies from adjacent months
       try:d=datetime.date(year,month,day).isoformat()
       except ValueError:bad_dates.append([si,ref,v]);continue
       if d in snapshots:duplicate_dates.append([d,si]);continue
       blocks[ci]=d;snapshots[d]={'date':d,'source':'historical spreadsheet','tracks':{},'names':{},'captured_at':None}
     else:
      rows[r][ci]=v
    el.clear()
  for ci,date in blocks.items():
   snap=snapshots[date]
   name_counts=collections.Counter(norm(str(row.get(ci,''))) for row in rows.values() if isinstance(row.get(ci),str))
   for row_index,row in rows.items():
    name=row.get(ci);value=asnum(row.get(ci+1))
    if not isinstance(name,str) or not name.strip() or name in ('N/A','Song Name'):continue
    if value is None:
     if row.get(ci+1) is not None:non_numeric+=1
     continue
    possible=lookup.get(norm(name),set())
    key=next(iter(possible)) if len(possible)==1 and name_counts[norm(name)]==1 else 'legacy:'+norm(name)+':'+str(row_index)
    if key in snap['tracks']:
     if snap['tracks'][key]!=value:issues.append({'date':date,'track':name,'issue':'conflicting duplicate within date','values':[snap['tracks'][key],value]})
     continue
    snap['tracks'][key]=value;snap['names'][key]=name
  if si in (1,13):print('Parsed month',si,'dates',len(blocks),flush=True)
 previous={};regressions=0
 for date in sorted(snapshots):
  s=snapshots[date];s['anomalies']=[]
  for key,value in s['tracks'].items():
   if key in previous and value<previous[key][0]:
    regressions+=1;s['anomalies'].append(key)
    if len(issues)<500:issues.append({'date':date,'track':s['names'][key],'issue':'cumulative streams decreased','previous_date':previous[key][1],'previous':previous[key][0],'current':value})
   previous[key]=(value,date)
  if not s['tracks']:del snapshots[date]
 for date,s in snapshots.items():
  (OUT/f'group-{date}.json').write_text(json.dumps(s,ensure_ascii=False,separators=(',',':')))
 manifestpath=DATA/'manifest.json';manifest=json.loads(manifestpath.read_text())
 manifest['dates']=sorted(set(manifest.get('dates',[]))|set(snapshots),reverse=True)
 manifestpath.write_text(json.dumps(manifest,indent=2))
 report={'source_file':SOURCE.name,'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'dataset':'group','historical_dates_imported':len(snapshots),'first_date':min(snapshots),'last_date':max(snapshots),'total_track_observations':sum(len(s['tracks']) for s in snapshots.values()),'non_numeric_total_cells_skipped':non_numeric,'duplicate_date_headers_skipped':duplicate_dates,'invalid_date_headers':bad_dates,'cumulative_decreases_flagged':regressions,'issues_sample':issues[:250],'note':'Daily growth is a difference between available snapshots, not necessarily a one-day gain if dates are missing. Original cumulative values are preserved. Workbook (1) was byte-identical, not Unit/Duo.'}
 (ROOT/'history-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print({k:v for k,v in report.items() if k not in ('issues_sample','duplicate_date_headers_skipped','source_sha256')},flush=True)
