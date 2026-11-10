(()=>{
'use strict';
const groupStandaloneReleaseDates={
 g3:'2015-12-04',g4:'2016-02-12',g14:'2018-08-13',g15:'2018-08-28',
 g17:'2019-05-19',g19:'2019-08-05',g21:'2019-12-01',
 g26:'2020-09-17',g30:'2021-06-23',g31:'2021-08-13',
 g34:'2022-04-15',g38:'2022-08-26',g40:'2023-01-17',
 g42:'2023-08-16',g45:'2023-09-01',g47:'2023-12-26',g48:'2024-02-16',g55:'2024-05-03',g57:'2024-10-18',g60:'2025-06-30',g61:'2025-07-14',g62:'2025-07-25',g63:'2025-10-10',g64:'2026-02-27'
};
const groupOriginalReleaseDates={"g7":"2016-07-04","g23":"2020-06-22","g24":"2020-08-24","g37":"2022-07-18","g44":"2023-08-23","g50":"2024-04-29","g51":"2024-04-29","g52":"2024-04-29","g53":"2024-04-29","g54":"2024-04-29","g1":"2015-05-29","g2":"2015-09-10","g5":"2016-04-25","g6":"2016-07-04","g8":"2016-12-05","g9":"2017-05-22","g10":"2017-11-06","g11":"2018-02-05","g12":"2018-05-30","g13":"2018-07-16","g16":"2019-01-21","g18":"2019-05-29","g20":"2019-09-16","g22":"2020-04-01","g23":"2020-06-22","g25":"2020-09-09","g27":"2020-10-19","g28":"2021-04-21","g29":"2021-06-18","g32":"2021-10-22","g33":"2021-12-08","g35":"2022-05-27","g36":"2022-07-18","g39":"2022-11-09","g41":"2023-04-24","g43":"2023-08-23","g46":"2023-10-23","g49":"2024-04-29","g56":"2024-10-14","g58":"2024-11-27","g59":"2025-05-26"};
const $=id=>document.getElementById('all-'+id);
let latestArchives=null;
const allModes=new Set(['tracks','albums','discography','followers','listeners','streams']);
const allModeStorage='svt-all-six-category-v1';
let rememberedMode='tracks';
try{const saved=sessionStorage.getItem(allModeStorage);if(allModes.has(saved))rememberedMode=saved}catch{}

const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayBefore=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)};
const monday=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)};
const firstOfMonth=date=>date.slice(0,7)+'-01';
const firstOfYear=date=>date.slice(0,4)+'-01-01';
const sameTitle=name=>String(name||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const unique=arr=>[...new Set(arr)];
const artistIds=[['SEVENTEEN','7nqOGRxlXj7N2JYbgNEjYH'],['S.Coups',null],['Jeonghan','6KDLlQYeeqUe5OQ2JrdNzF'],['Joshua','74AwWFYdjQ3ER5vHO4H7b0'],['Jun','38Gn0ZVC8TQwuaMxBK1yRV'],['Hoshi','6nWKAdMv1BDq1zHfZzkdbR'],['Wonwoo','3rHcBT06Vb1XGVUWhDALZt'],['Woozi','4TdiASPlU3QdZvGQBothcQ'],['Dokyeom','7G1kUsPtQCdolV6CPwHmh2'],['Mingyu','5gUpo0BRmo6EOTbyU3z5Ay'],['The8','4DqFd6XE3dX4LWXHJVVpLk'],['Seungkwan','0Vb2DjojEYsasFpc3aTZb6'],['Vernon','2Y34b9AOK30zXgL7cAH4NG'],['Dino','5YaeXxzvqGNBCguELlKo6G'],['BSS','1uAT5bTSp6dWbNmixIUP5t'],['JxW','7GvlsjcgBrsE578yghOq7D'],['HxW','1EReYiseDwE51FzGm7EK9n'],['CxM','7kjuLdYbtTkWBToMu2ebZN'],['DxS','4wBjmEkWhY4T22q00CiF5V'],['V8',null],['Picheolin','3V2EC4dPYLgtbi0TtrB1RA'],['JxJ',null]];
const members=new Set(artistIds.slice(1,14).map(x=>x[0]));
const units=new Set(artistIds.slice(14).map(x=>x[0]));
const state={metricBaseline:null,followersHistory:{},catalog:null,group:null,solo:null,media:null,followers:{},manifest:null,rows:[],albums:[],discography:[],mode:rememberedMode,albumSpecs:[],legacyLinks:null,milestonePrevious:{},snapshots:new Map(),page:0,limit:50,period:'overall'};
async function read(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw new Error(path+' returned '+r.status);return r.json()}
function nameFromRelease(release,id,index){
 const official=release.track_titles?.[id];
 if(official)return official;
 const description=String(release.description||'');
 const names=description.includes(':')?description.slice(description.indexOf(':')+1).split(/,\s*/):[];
 return names.length===release.tracks.length?names[index]:null;
}
function normalizeTitle(raw){
 const t=String(raw||'').trim().replace(/\s+/g,' ');
 const special={'20.0':'20','247.0':'247','golm':'God of Light Music','god of light music':'God of Light Music','9 teen':'9-TEEN','a teen':'A-TEEN'};
 return special[t.toLowerCase()]||t;
}
// Use the same display capitalization as OT13 and Units/Solo, including
// deliberately styled titles such as _WORLD, MANSAE, 9-TEEN, V8 and GILBOARD.
function originalAllTrackTitle(name,scope,id){
 const formatter=window.svtSharedMedia?.trackTitle;
 return normalizeTitle(formatter?formatter(name,scope,id):name);
}
function originalAllReleaseTitle(release){
 const formatter=window.svtSharedMedia?.releaseTitle;
 const label=formatter?formatter(release):String(release.title||release.key||'');
 return /^g\d+$/i.test(String(label).trim())?String(release.title||release.description||'Unnamed release').replace(/\s*\([^)]*tracks?\).*$/i,''):label;
}
function validId(id){return /^[A-Za-z0-9]{22}$/.test(id)}
function buildRows(){
 const byId=new Map();
 for(const scope of ['group','solo']){
  const snapshot=state[scope];
  for(const release of state.catalog[scope]||[]){
   const canonicalOwner=artistIds.find(([name])=>name.toLowerCase()===String(release.artist||'').toLowerCase())?.[0];
   // "Gilboard" is a release grouping, not a Spotify artist profile.
   // The sharedTracks release is DREAMSCAPE's JxJ catalog grouping.
   const artist=scope==='group'?'SEVENTEEN':
    release.key==='sharedTracks'?'JxJ':
    release.key==='gilboard'?'Picheolin':(canonicalOwner||release.artist);
   const releaseDate=scope==='group'?(groupOriginalReleaseDates[release.key]||groupStandaloneReleaseDates[release.key]||release.release_date):release.release_date;
   (release.tracks||[]).forEach((id,index)=>{
    if(!validId(id))return;
    // Exclude known legacy aliases from the group catalog. The current
    // collector's canonical IDs are the authoritative recording population.
    if(scope==='group'&&Array.isArray(snapshot.canonical_track_ids)&&
       !snapshot.canonical_track_ids.includes(id))return;
    let row=byId.get(id);
    if(!row){row={id,scope,owners:new Set(),releaseNames:new Set(),date:null,title:null,streams:null,releaseKey:release.key};byId.set(id,row)}
    if(artist)row.owners.add(artist);
    // The Gilboard-only "Like It" recording is Dino's solo, not Picheolin's.
    if(release.key==='gilboard'&&index===6){row.owners.delete('Picheolin');row.owners.add('Dino')}
    if(release.title)row.releaseNames.add(originalAllReleaseTitle(release));
    const date=release.track_release_dates?.[id]||releaseDate;
    if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&(!row.date||date<row.date))row.date=date;
    const title=scope==='group'?snapshot.names?.[id]:state.media.tracks?.[id]?.title;
    const candidate=title||nameFromRelease(release,id,index);
    if(candidate&&(!row.title||(scope===row.scope&&title)))row.title=originalAllTrackTitle(candidate,scope,id);
    const count=snapshot.tracks?.[id];
    if(Number.isFinite(count)&&count>=0)row.streams=count;
   });
  }
  // Catalog additions may lag the collector; include verified recording IDs
  // from current snapshots even when release metadata has not arrived yet.
  for(const [id,count] of Object.entries(snapshot.tracks||{})){
   if(!validId(id)||!Number.isFinite(count))continue;
   if(scope==='group'&&Array.isArray(snapshot.canonical_track_ids)&&!snapshot.canonical_track_ids.includes(id))continue;
   let row=byId.get(id);
   if(!row){row={id,scope,owners:new Set([scope==='group'?'SEVENTEEN':'Unassigned solo/unit']),releaseNames:new Set(),date:null,title:null,streams:null};byId.set(id,row)}
   if(row.streams==null)row.streams=count;
   if(!row.title)row.title=originalAllTrackTitle(snapshot.names?.[id]||state.media.tracks?.[id]?.title||'',scope,id);
  }
 }
 // Shared unit tracks can belong to multiple artist views, without
 // adding their stream count twice in the combined recording catalog.
 const byRelease=new Map((state.catalog.solo||[]).map(r=>[r.key,r]));
 const assign=(artist,key,indices)=>{const r=byRelease.get(key);for(const i of indices){const row=byId.get(r?.tracks?.[i]);if(row)row.owners.add(artist)}};
 assign('Wonwoo','jxw_g1',[0,2]);assign('Dino','picheolin_g3',[0]);
 // Gilboard's pre-release singles have the same recorded cumulative
 // streams as their album editions. Keep their oldest release dates,
 // but count each verified identical recording exactly once.
 for(const [singleId,albumId] of [
  ['3Y0ZwgYVHuwbW0JGjsYodR','5W1bn5PzFgKok4GAZ1JUAw'],
  ['594CTGIIVVTitwRhQJcWgM','34wTGQ1yV5XtrSMR5dMLWY']
 ]){
  const single=byId.get(singleId),album=byId.get(albumId);
  if(!single||!album||!Number.isFinite(single.streams)||
     single.streams!==album.streams)continue;
  for(const owner of single.owners)album.owners.add(owner);
  for(const release of single.releaseNames)album.releaseNames.add(release);
  if(single.date&&(!album.date||single.date<album.date))
   album.date=single.date;
  byId.delete(singleId);
 }
 // Cross-catalog identity audit (Nov 6, 7 and 8): Joshua's original
 // "Love Is Gone (with JOSHUA)" is the SAME recording in two catalogues
 // but was assigned two different Spotify IDs. The other Dylan Matthew
 // version already shares its exact Spotify ID and is merged by byId.
 // The8's own "Love is gone" is a different song and is not merged.
 const crossCatalogAliases=[
  ['4iIx4KfhlrkWBw1nTBo313','4FTcJ9B6S2QXObqRr9UG8U']
 ];
 for(const [soloId,groupId] of crossCatalogAliases){
  const duplicate=byId.get(soloId),canonical=byId.get(groupId);
  if(!duplicate||!canonical)continue;
  for(const owner of duplicate.owners)canonical.owners.add(owner);
  for(const release of duplicate.releaseNames)canonical.releaseNames.add(release);
  if(duplicate.date&&(!canonical.date||duplicate.date<canonical.date))
   canonical.date=duplicate.date;
  // Use one verified recording count, never sum the mirrored observations.
  byId.delete(soloId);
 }
 // Jeonghan's six DREAMSCAPE credits are already represented by jeonghan_g2.
 // Avoid assigning Joshua's separate solo recording to Jeonghan.
 state.rows=[...byId.values()].map(r=>({...r,owners:[...r.owners],releaseNames:[...r.releaseNames]}));
}
function buildAlbums(){
 const byKey=new Map((state.catalog.group||[]).map(item=>[item.key,item]));
 const result=[];
 // Reuse the original dashboard's canonical album definitions.
 const groupSpecs=typeof requestedGroupAlbums!=='undefined'?requestedGroupAlbums:[];
 for(const spec of groupSpecs){
  const releases=spec.keys.map(key=>byKey.get(key)).filter(Boolean);
  const ids=unique(releases.flatMap(item=>item.tracks||[])).filter(validId);
  if(!ids.length)continue;
  const streams=ids.every(id=>Number.isFinite(state.group.tracks?.[id]))
   ?ids.reduce((sum,id)=>sum+state.group.tracks[id],0):null;
  const key=spec.keys[0];
  result.push({title:spec.name,kind:'album',scope:'group',releaseKey:key,
   owners:['SEVENTEEN'],releaseNames:[spec.name],ids,
   date:groupOriginalReleaseDates[key]||groupStandaloneReleaseDates[key]||releases[0]?.release_date||null,streams});
 }
 for(const spec of state.albumSpecs){
  const ids=unique(spec.tracks||[]).filter(validId);
  if(!ids.length)continue;
  const owners=spec.owners?.length?spec.owners:[spec.artist||'Unassigned solo/unit'];
  const streams=ids.every(id=>Number.isFinite(state.solo.tracks?.[id]))
   ?ids.reduce((sum,id)=>sum+state.solo.tracks[id],0):null;
  result.push({title:spec.displayName||spec.title||spec.key,scope:'solo',kind:'album',
   releaseKey:spec.key,owners,ids,releaseNames:[spec.displayName||spec.title||spec.key],
   date:spec.releaseDate||spec.release_date||null,streams});
 }
 state.albums=result;
}
function buildDiscography(){
 const all=[];
 // Each official release and track appearance stays visible. This catalog
 // is a list of release appearances, never the source for combined totals.
 const validSolo=new Set(Object.keys(state.solo.tracks||{}));
 const validGroup=new Set(state.group.canonical_track_ids||Object.keys(state.group.tracks||{}));
 const canonical=new Map(state.rows.map(row=>[row.id,row]));
 for(const scope of ['group','solo']){
  const snap=state[scope],valid=scope==='group'?validGroup:validSolo;
  const releases=(state.catalog[scope]||[]).filter(item=>
   item.key!=='sharedTracks'&&item.key!=='gilboard'&&!item.is_placeholder);
  const seenReleases=new Set();
  for(const release of releases){
   const key=scope+':'+release.key;
   if(seenReleases.has(key))continue;
   seenReleases.add(key);
   const ids=unique((release.tracks||[]).filter(id=>validId(id)&&valid.has(id)));
   if(!ids.length)continue;
   const owner=scope==='group'?'SEVENTEEN':
    artistIds.find(([name])=>name.toLowerCase()===String(release.artist||'').toLowerCase())?.[0]||
    release.artist||'Unassigned solo/unit';
   const name=originalAllReleaseTitle(release);
   const date=scope==='group'?
    (groupOriginalReleaseDates[release.key]||groupStandaloneReleaseDates[release.key]||release.release_date||null):
    (release.release_date||release.releaseDate||null);
   const streams=ids.every(id=>Number.isFinite(snap.tracks?.[id]))?
    ids.reduce((sum,id)=>sum+snap.tracks[id],0):null;
   const isAlbum=/\b(album|mini|ep|repackage|best|compilation)\b/i.test(String(release.title||''));
   // A header separates release editions in the same order as OT13/solo Discography.
   const displayOrder=all.length;

   for(const id of ids){
    const row=canonical.get(id);
    const title=scope==='group'?snap.names?.[id]:state.media.tracks?.[id]?.title;
    all.push({id,title:originalAllTrackTitle(title||row?.title||id,scope,id),kind:'track',scope,
     owners:row?.owners?.length?row.owners:[owner],releaseNames:[name],date:release.track_release_dates?.[id]||date,
     releaseKey:release.key,streams:snap.tracks?.[id]??null,
     sortDate:date,releaseOrder:all.length,discographyTrack:true});
   }
   all.push({kind:'album',title:name,scope,releaseKey:release.key,
    owners:[owner],releaseNames:[name],date,sortDate:date,streams,ids,releaseOrder:all.length,discographyHeader:true});
  }
 }
 // Some unit albums (JxJ, V8) are defined in the canonical solo album
 // catalog instead of as a standalone unit release in the per-member catalog.
 // Include an actual unit release heading so artist filtering keeps the album
 // alongside its songs, without changing the underlying recording totals.
 for(const spec of state.albumSpecs||[]){
  if(!['jxj_dreamscape','v8','gilboard'].includes(spec.key))continue;
  const ids=unique((spec.tracks||[]).filter(id=>validId(id)&&validSolo.has(id)));
  if(!ids.length)continue;
  const owners=spec.owners||[],name=spec.displayName||spec.key;
  const date=spec.releaseDate||spec.release_date||null,begin=all.length;
  const streams=ids.every(id=>Number.isFinite(state.solo.tracks?.[id]))?
   ids.reduce((sum,id)=>sum+state.solo.tracks[id],0):null;

  for(const id of ids){
   const main=canonical.get(id),name=state.media.tracks?.[id]?.title||main?.title||id;
   all.push({id,title:originalAllTrackTitle(name,'solo',id),kind:'track',scope:'solo',
    owners:main?.owners?.length?main.owners:owners,releaseNames:[spec.displayName||spec.key],
    date,sortDate:date,releaseKey:spec.key,releaseOrder:all.length,
    streams:state.solo.tracks[id],discographyTrack:true});
  }
  all.push({kind:'album',title:name,scope:'solo',releaseKey:spec.key,
   owners,releaseNames:[name],date,sortDate:date,streams,ids,
   releaseOrder:all.length,discographyHeader:true});
 }
 state.discography=all;
}
async function snapshot(scope,date){
 const key=scope+'-'+date;
 if(state.snapshots.has(key))return state.snapshots.get(key);
 const current=state[scope];
 if(current.date===date)return current;
 const valid=(scope==='group'?state.manifest.dates:
  [...(state.manifest.solo_dates||[]),...(state.manifest.solo_legacy_dates||[])])||[];
 if(!valid.includes(date))return null;
 let saved=null;
 const paths=scope==='solo'&&(state.manifest.solo_legacy_dates||[]).includes(date)?
  ['solo-'+date+'.json','data/history/solo-'+date+'.json']:
  ['data/history/'+scope+'-'+date+'.json'];
 for(const path of paths){
  try{const value=await read(path);if(value?.date===date&&value.tracks){saved=value;break}}catch{}
 }
 state.snapshots.set(key,saved);
 return saved;
}
function boundaryDate(scope,period){
 const date=state[scope].date;
 if(period==='daily')return dayBefore(date);
 if(period==='weekly')return dayBefore(monday(date));
 if(period==='monthly')return dayBefore(firstOfMonth(date));
 if(period==='yearly')return dayBefore(firstOfYear(date));
 return null;
}
// Historical spreadsheets reused Spotify IDs for different songs and stored
// the actual song under a separate legacy key (e.g. Water vs Candy).
// Never subtract two songs merely because their dictionary keys match.
function verifiedBaselineValue(scope,id,baseline){
 if(!baseline?.tracks)return null;
 const currentName=scope==='group'?state.group.names?.[id]:
  (state.media.tracks?.[id]?.title||state.rows.find(r=>r.id===id)?.title);
 const title=sameTitle(currentName);
 if(!title)return null;
 const recorded=baseline.tracks[id],recordedName=baseline.names?.[id];
 // Modern Spotify snapshots have stable ID identities. Older imported
 // archives require a title match, not just a key match.
 if(Number.isFinite(recorded)&&
    ((!baseline.names&&!baseline.source)||
     (recordedName&&sameTitle(recordedName)===title)))
  return recorded;
 const candidates=[];
 for(const [oldId,oldName] of Object.entries(baseline.names||{})){
  if(sameTitle(oldName)!==title||!Number.isFinite(baseline.tracks[oldId]))continue;
  if(scope==='solo'){
   const index=Number(oldId.split(':').at(-1));
   const linked=state.legacyLinks?.byIndex?.[index]?.id;
   // Shared solo titles are ambiguous without an explicit workbook mapping.
   if(linked!==id)continue;
  }
  candidates.push(baseline.tracks[oldId]);
 }
 // Multiple keys for identical values are a verified duplicate edition;
 // distinct values with the same title may represent different recordings.
 return candidates.length&&candidates.every(n=>n===candidates[0])?candidates[0]:null;
}
async function applyPeriod(){
 const metricBaselines=await Promise.all(['group','solo'].map(scope=>state.period==='overall'?Promise.resolve(null):snapshot(scope,boundaryDate(scope,state.period))));
 state.metricBaseline={group:metricBaselines[0],solo:metricBaselines[1]};
 const rows=[...state.rows,...state.albums,...state.discography],period=state.period;
 if(period==='overall'){rows.forEach(row=>row.gain=null);return}
 const boundaries=await Promise.all(['group','solo'].map(async scope=>
  snapshot(scope,boundaryDate(scope,period))));
 const baselines={group:boundaries[0],solo:boundaries[1]};
 for(const row of rows){
  const ids=row.ids||[row.id],now=state[row.scope].tracks,old=baselines[row.scope];
  const deltas=ids.map(id=>{
   const a=now?.[id],b=verifiedBaselineValue(row.scope,id,old);
   return Number.isFinite(a)&&Number.isFinite(b)&&a>=b?a-b:null;
  });
  row.gain=deltas.length&&deltas.every(Number.isFinite)?deltas.reduce((a,b)=>a+b,0):null;
 }
}
function artistStats(){
 const byName=new Map(artistIds.map(([name,id])=>[name,{name,id,recordings:new Set()}]));
 for(const row of state.rows)for(const owner of row.owners)if(byName.has(owner))byName.get(owner).recordings.add(row.id);
 const group=state.group,solo=state.solo;
 return [...byName.values()].map(a=>{
  const isGroup=a.name==='SEVENTEEN';
  const snap=isGroup?group:solo;
  const listeners=a.id==null?null:(snap.listeners?.[a.id]??snap.monthly_listeners?.[a.id]);
  const observed=isGroup?group.followers?.[a.id]:state.followers[a.id]?.count;
  const followers=Number.isFinite(observed)?observed:null;
  const totals=[...a.recordings].map(id=>state.rows.find(r=>r.id===id)?.streams).filter(Number.isFinite);
  const streams=totals.length?totals.reduce((sum,n)=>sum+n,0):null;
  return {...a,listeners:Number.isFinite(listeners)?listeners:null,followers,streams};
 });
}
// Combined headline figures use the same canonical recording list as All's
// track ranking: no summing artist cards (whose member/unit credits overlap).
function renderSummary(){
 const rows=state.rows||[];
 const observed=rows.filter(row=>Number.isFinite(row.streams)&&row.streams>=0);
 const streams=observed.reduce((sum,row)=>sum+row.streams,0);
 const allComplete=rows.length>0&&observed.length===rows.length;
 $('summaryStreams').textContent=allComplete?fmt(streams):'—';
 $('summaryTracks').textContent=rows.length?fmt(rows.length):'—';
 const groupDate=state.group?.date,soloDate=state.solo?.date;
 const dateFormat=date=>/^\d{4}-\d{2}-\d{2}$/.test(date||'')?
  new Date(date+'T12:00:00Z').toLocaleDateString('en-US',
   {timeZone:'UTC',year:'numeric',month:'short',day:'numeric'}):'—';
 const sameDay=!!groupDate&&groupDate===soloDate;
 $('summaryDate').textContent=sameDay?dateFormat(groupDate):'See dates below';
 $('toolbarDate').textContent=sameDay?dateFormat(groupDate):
  'OT13 '+(groupDate||'—')+' · Solo '+(soloDate||'—');
 $('summaryDateNote').textContent=sameDay?'Both archives · '+groupDate:
  'OT13 '+(groupDate||'—')+' · Unit/Solo '+(soloDate||'—');
 const prev=state.milestonePrevious||{};
 const deltas=rows.map(row=>{
  const source=prev[row.scope];
  if(!source||!Number.isFinite(row.streams)||source.date!==dayBefore(state[row.scope]?.date))
   return null;
  const older=verifiedBaselineValue(row.scope,row.id,source);
  return Number.isFinite(older)&&row.streams>=older?row.streams-older:null;
 });
 const valid=deltas.filter(Number.isFinite);
 const complete=sameDay&&rows.length>0&&valid.length===rows.length;
 $('summaryGrowth').textContent=complete?'+'+fmt(valid.reduce((a,b)=>a+b,0)):'—';
 $('summaryGrowthNote').textContent=complete?'From '+dayBefore(groupDate)+' to '+groupDate:
  'Daily growth requires full consecutive snapshots for both categories';
 $('summaryCoverage').textContent=allComplete?
  fmt(rows.length)+' distinct Spotify recordings · group, members and units combined without duplicate editions or shared recording IDs. '+
  (complete?'All '+fmt(rows.length)+' recordings have verified previous-day comparisons.':
   'The daily change is withheld where comparable snapshots are missing.'):
  'Some unique recordings lack verified totals; no combined number is displayed until all totals are available.';
}
function artworkFor(row){
 // HIT's pre-release single uses its own sleeve, not the later An Ode cover.
 if(row.scope==='group'&&row.id==='0uIw1c0E2nyFWWwEVzhl30'&&row.releaseKey==='g19')return 'release:HIT';
 try{const source=window.svtSharedMedia?.coverFor(row);if(source)return source}catch(e){console.warn('Shared cover not ready',e)}
 if(row.scope==='solo'){
  const localAlbum=row.kind==='album'?state.media.albums?.[row.releaseKey]:null;
  const localTrack=state.media.tracks?.[row.id]?.local;
  if(localAlbum||localTrack)return 'image:'+(localAlbum||localTrack);
 }
 const id=row.id||row.ids?.[0];
 return validId(id||'')?'track:'+id:'missing';
}
function paintArtists(){
 document.querySelectorAll('#svtAllView [data-all-artist-photo]').forEach(img=>{
  if(img.dataset.requested)return;
  img.dataset.requested='1';
  window.svtSharedMedia?.artistImage(img,img.dataset.allArtistPhoto);
 });
}
function renderArtists(){
 const metric=$('artistMetric').value,scope=$('artistScope').value;
 const labels={streams:'HIGHEST STREAMS',followers:'HIGHEST FOLLOWERS',
  listeners:'HIGHEST MONTHLY LISTENERS'};
 $('artistMetricHeading').textContent=(labels[metric]||labels.streams)+(state.period==='overall'?'':' · '+state.period.toUpperCase()+' CHANGE');
 const header=$('artistSectionTitle');
 if(header)header.textContent=(metric==='streams'?'Total Streams':
  metric==='followers'?'Highest Followers':'Highest Monthly Listeners');
 // One selected metric, one descending ranking. A profile without a verified
 // value for the selected metric is excluded, not ranked as 0.
 const period=state.period;
 const boundary=period==='overall'?null:boundaryDate('solo',period);
 const history=state.followersHistory||{};
 const followerDates=Object.keys(history).sort();
 const observedDate=followerDates.at(-1);
 const followerBase=period==='overall'?null:history[boundary]||null;
 const rows=artistStats()
  .map(a=>{
   if(period==='overall')return {...a,change:null};
   let current=a[metric],previous=null;
   if(metric==='followers'){
    // Only compare exact dated observations; do not fabricate daily values.
    const observed=history[observedDate]?.[a.id]?.count;
    const baseline=followerBase?.[a.id]?.count;
    current=Number.isFinite(observed)?observed:current;
    previous=Number.isFinite(baseline)?baseline:null;
   }else if(metric==='listeners'){
    const scope=a.name==='SEVENTEEN'?'group':'solo';
    const baseline=state.metricBaseline?.[scope];
    previous=baseline?.listeners?.[a.id]??baseline?.monthly_listeners?.[a.id]??null;
   }else{
    const totals=[...a.recordings].map(id=>{
     const row=state.rows.find(r=>r.id===id);
     const snap=row&&state.metricBaseline?.[row.scope];
     return row&&snap?verifiedBaselineValue(row.scope,id,snap):null;
    });
    previous=totals.length&&totals.every(Number.isFinite)?totals.reduce((sum,n)=>sum+n,0):null;
   }
   return {...a,change:Number.isFinite(current)&&Number.isFinite(previous)?current-previous:null};
  })
  .filter(a=>(scope==='all'||(scope==='members'?members.has(a.name):units.has(a.name)))&&
   Number.isFinite(a[metric]))
  .sort((a,b)=>period==='overall'?b[metric]-a[metric]||a.name.localeCompare(b.name):
   (Number.isFinite(b.change)?b.change:-Infinity)-(Number.isFinite(a.change)?a.change:-Infinity)||a.name.localeCompare(b.name));
 const source=metric==='streams'?'recording totals':metric==='listeners'?
  'monthly listener observations':'verified follower snapshots';
 $('artistNote').textContent=rows.length+' profiles with saved '+source+
  ' · ranked from highest to lowest · profiles with unavailable values are hidden. '+
  'Group: '+state.group.date+' · Solo/Unit: '+state.solo.date+'. '+
  'Streams on member and unit profiles may overlap; the combined track catalog counts distinct recordings once.';
 $('artists').innerHTML=rows.map((a,i)=>
  '<tr><td><div class="svt-all-person">'+
  '<span class="svt-all-rank">'+String(i+1).padStart(2,'0')+'</span>'+
  '<img class="svt-all-avatar artist-profile-photo" data-all-artist-photo="'+esc(a.name)+'" alt="'+esc(a.name)+' profile photo" loading="lazy">'+
  '<div class="svt-all-person-copy"><span class="svt-all-song">'+esc(a.name)+'</span>'+
  '<div class="svt-all-sub">'+(a.name==='SEVENTEEN'?'Group':members.has(a.name)?'Member':'Unit')+
  ' · '+(a.recordings.size||0)+' recordings</div></div></div></td>'+
  '<td class="svt-all-num">'+fmt(a[metric])+(period==='overall'?'':'<div class="svt-all-sub">'+(Number.isFinite(a.change)?(a.change>0?'+':'')+fmt(a.change):'—')+' '+period+' change</div>')+'</td></tr>'
 ).join('')||'<tr><td colspan="2" class="svt-all-status">No verified '+labels[metric].toLowerCase()+
 ' are available for these profiles.</td></tr>';
 paintArtists();
}
function selectAllCategory(mode,options={}){
 if(!allModes.has(mode))mode='tracks';
 state.mode=mode;
 const audience=['streams','followers','listeners'].includes(mode);
 $('audienceSection').hidden=!audience;
 $('catalogSection').hidden=audience;
 $('viewType').value=audience?'tracks':mode;
 if(audience)$('artistMetric').value=mode;
 for(const button of document.querySelectorAll('#all-rankCategory button[data-all-rank]')){
  const active=button.dataset.allRank===mode;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
 }
 if(mode==='discography'&&options.userChoice)$('sort').value='oldest';
 else if(mode!=='discography'&&options.userChoice&&$('sort').value==='oldest')
  $('sort').value='streams';
 try{sessionStorage.setItem(allModeStorage,mode)}catch{}
 if(state.rows.length){
  if(audience)renderArtists();
  else{if(options.userChoice)state.page=0;renderTracks()}
 }
}
function renderTracks(){
 const query=$('search').value.trim().toLowerCase(),owner=$('owner').value;
 const order=$('sort').value,period=state.period,mode=state.mode;
 const isDiscography=mode==='discography',isAlbum=mode==='albums';
 const entire=isDiscography?state.discography:isAlbum?state.albums:state.rows;
 const rows=entire.filter(r=>{
  if(owner!=='all'&&!r.owners.includes(owner))return false;
  if(!query)return true;
  // Original snapshot aliases remain searchable even when the original
  // ranking prints the official display form (GOM → God of Music).
  const rawName=r.id?(r.scope==='group'?state.group.names?.[r.id]:
   state.media.tracks?.[r.id]?.title):'';
  return [r.title,rawName,r.id||'',...r.owners,...r.releaseNames]
   .join(' ').toLowerCase().includes(query);
 });
 // Discography is a release-by-release timeline, never a stream ranking.
 const sortSelect=$('sort');
 for(const option of sortSelect.options)option.hidden=isDiscography&&!['oldest','newest'].includes(option.value);
 if(isDiscography&&!['oldest','newest'].includes(sortSelect.value))sortSelect.value='oldest';
 const effectiveOrder=sortSelect.value;
 const score=row=>period==='overall'?row.streams:row.gain;
 const metricLabel=period==='overall'?'total streams':period+' gain';
 $('sort').querySelector('[value="streams"]').textContent='Highest '+metricLabel;
 $('sort').querySelector('[value="least"]').textContent='Lowest '+metricLabel;
 if(isDiscography){
  // Keep each release's original track order and its subtotal row together.
  // Only flip the order of release blocks, never individual album tracks.
  const blocks=new Map();
  for(const row of rows){
   const key=row.scope+':'+row.releaseKey;
   if(!blocks.has(key))blocks.set(key,{date:row.sortDate||row.date||'',first:row.releaseOrder??0,items:[]});
   blocks.get(key).items.push(row);
  }
  rows.splice(0,rows.length,...[...blocks.values()]
   .sort((a,b)=>{
    if(!a.date)return b.date?1:a.first-b.first;
    if(!b.date)return -1;
    const compare=a.date.localeCompare(b.date);
    return (effectiveOrder==='newest'?-compare:compare)||(effectiveOrder==='newest'?b.first-a.first:a.first-b.first);
   }).flatMap(block=>block.items.sort((a,b)=>(a.releaseOrder??0)-(b.releaseOrder??0))));
 }else rows.sort((a,b)=>{
  if(effectiveOrder==='title')return (a.title||'').localeCompare(b.title||'');
  if(effectiveOrder==='newest')return (b.sortDate||b.date||'').localeCompare(a.sortDate||a.date||'');
  if(effectiveOrder==='oldest')return (a.sortDate||a.date||'9999').localeCompare(b.sortDate||b.date||'9999');
  const x=score(a),y=score(b);
  if(!Number.isFinite(x))return Number.isFinite(y)?1:0;
  if(!Number.isFinite(y))return -1;
  return (effectiveOrder==='least'?x-y:y-x)||String(a.title).localeCompare(String(b.title));
 });
 const totalPages=Math.max(1,Math.ceil(rows.length/state.limit));
 state.page=Math.min(state.page,totalPages-1);
 const shown=rows.slice(state.page*state.limit,(state.page+1)*state.limit);
 const verified=rows.filter(r=>Number.isFinite(score(r))).length;
 $('recordHeading').textContent=isDiscography?'Every release · Group + Units & Solo':
  isAlbum?'Every saved album':'Every saved recording';
 $('catalogModeLabel').textContent=isDiscography?'Discography · Group, Members & Units':
  isAlbum?'Album Rankings · All Artists':'Track Rankings · All Artists';
 $('gainTitle').textContent=period==='overall'?'TOTAL STREAMS':period.toUpperCase()+' GAIN';
 const date=state.group.date,from=boundaryDate('group',period);
 const periodRange=period==='overall'?'all-time totals':
  (from&&date?dayBefore(date)>from?dayBefore(date):date:date);
 const periodText=period==='overall'?'Cumulative Spotify observations':
  'Verified '+period+' gains from '+(from||'—')+' to '+date+
  ' (beginning after the baseline date)';
 $('coverage').textContent='Latest saved: Group '+state.group.date+' · Unit/Solo '+state.solo.date+
  ' · '+periodText;
 $('recordCount').textContent=isDiscography?
  rows.length.toLocaleString()+' discography entries · source release appearances (not added to All totals)':
  rows.length.toLocaleString()+(isAlbum?' albums':' recordings')+
  ' · '+verified.toLocaleString()+' with verified '+metricLabel;
 $('recordings').innerHTML=shown.map((row,i)=>{
  const name=esc(row.title||'Unidentified Spotify recording');
  const artwork=esc(artworkFor(row)),isTrack=validId(row.id||''),value=score(row);
  const link=isTrack?'<a class="svt-all-song" href="https://open.spotify.com/track/'+encodeURIComponent(row.id)+
   '" target="_blank" rel="noopener noreferrer">'+name+'</a>':'<span class="svt-all-song">'+name+'</span>';
  const sub=row.owners.join(' · ')+
   ' · '+(isAlbum?'Album':(row.releaseNames[0]||'Release not documented'))+
   (!isAlbum&&row.releaseNames.length>1?' · '+row.releaseNames.length+' releases':'')+
   (row.date?' · '+row.date:'');
  const ranked=isDiscography?(row.discographyHeader?'◆':'·'):
   Number.isFinite(value)?String(state.page*state.limit+i+1).padStart(2,'0'):'—';
  const printed=Number.isFinite(value)?(period==='overall'?'':'+')+fmt(value):'—';
  return '<tr'+(isDiscography&&row.discographyHeader?' class="svt-all-release-row"':'')+
   '><td><div class="svt-all-record"><span class="svt-all-rank">'+ranked+'</span>'+
   '<span class="svt-all-art-holder"><img class="svt-all-cover cover" data-cover-track="'+artwork+
   '" data-cover-name="'+name+'" data-cover-kind="'+(isAlbum?'album':'track')+
   '" alt="'+name+' cover" loading="lazy"><span class="cover-placeholder" hidden></span></span>'+
   '<div class="svt-all-record-copy">'+link+'<div class="svt-all-sub">'+esc(sub)+
   '</div></div></div></td><td class="svt-all-num">'+printed+'</td></tr>';
 }).join('')||'<tr><td colspan="2" class="svt-all-status">No matching '+(isDiscography?'releases':isAlbum?'albums':'recordings')+'.</td></tr>';
 $('pageInfo').textContent=(state.page+1)+' / '+totalPages;
 $('prev').disabled=state.page===0;$('next').disabled=state.page+1>=totalPages;
 window.svtSharedMedia?.fillArtwork();
}
async function init(){
 try{
  const [catalog,group,solo,media,followers,manifest,admin,soloAlbumSpecs,legacyLinks]=await Promise.all([
   read('data/catalog.json'),read('data/group.json'),read('data/solo.json'),
   read('data/solo-media.json'),read('data/solo-followers.json').catch(()=>({followers:{}})),
   read('data/manifest.json'),read('data/admin-releases.json').catch(()=>({releases:[]})),
   read('data/solo-albums.json'),read('data/solo-legacy-track-links.json')
  ]);
  latestArchives={group,solo};
  state.catalog=catalog;state.group=group;state.solo=solo;state.media=media;state.followers=followers.followers||{};state.followersHistory=followers.history||{};state.manifest=manifest;state.albumSpecs=soloAlbumSpecs;state.legacyLinks=legacyLinks;
  for(const release of admin.releases||[]){const list=catalog[release.scope];if(list&&!list.some(r=>r.key===release.key))list.push(release)}
  const picker=document.getElementById('all-archiveDate');
  const sharedDates=(manifest.dates||[]).filter(d=>(manifest.solo_dates||[]).includes(d)||(manifest.solo_legacy_dates||[]).includes(d)).sort();
  if(picker){picker.min=sharedDates[0]||group.date;picker.max=sharedDates.at(-1)||group.date;picker.value=group.date===solo.date?group.date:'';picker.title='Choose a day with saved OT13 and Units & Solo snapshots';}
  buildRows();
  for(const extra of admin.releases||[])if(extra.scope==='solo'&&extra.release_type==='album')
   state.albumSpecs.push({key:extra.key,displayName:extra.title,releaseDate:extra.release_date,owners:[extra.artist],tracks:extra.tracks});
  buildAlbums();buildDiscography();
  const names=unique(state.rows.flatMap(r=>r.owners)).filter(x=>x!=='Unassigned solo/unit').sort((a,b)=>a.localeCompare(b));
  $('owner').innerHTML='<option value="all">All recordings</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
  await applyPeriod();selectAllCategory(state.mode);renderArtists();renderTracks();
  const [prevGroup,prevSolo]=await Promise.all([
   snapshot('group',dayBefore(group.date)),snapshot('solo',dayBefore(solo.date))]);
  state.milestonePrevious={group:prevGroup,solo:prevSolo};
  renderSummary();syncAllDatePicker();
 }catch(error){
  console.error('All view could not load saved sources',error);
  $('artists').innerHTML='<tr><td colspan="2" class="svt-all-status">Artist data unavailable. Please try refreshing.</td></tr>';
  $('recordings').innerHTML='<tr><td colspan="2" class="svt-all-status">Saved archive unavailable. Please try refreshing.</td></tr>';
  $('coverage').textContent='Unable to load a required saved source.';
 }
}
$('rankCategory').addEventListener('click',event=>{
 const button=event.target.closest('button[data-all-rank]');
 if(button)selectAllCategory(button.dataset.allRank,{userChoice:true});
});
for(const id of ['artistMetric','artistScope'])$(id).addEventListener('change',()=>{
 if($('artistMetric').value!==state.mode&&['streams','listeners','followers'].includes($('artistMetric').value))
  selectAllCategory($('artistMetric').value);
 renderArtists();
});
for(const id of ['search','owner','sort','viewType'])$(id).addEventListener(id==='search'?'input':'change',()=>{state.page=0;renderTracks()});
window.svtAllShown=()=>{selectAllCategory(state.mode);if(state.rows.length){renderSummary();renderArtists();renderTracks();}};
window.addEventListener('svt-media-ready',()=>{if(state.rows.length){renderSummary();renderArtists();renderTracks();}});
const allArchiveDate=document.getElementById('all-archiveDate');
function syncAllDatePicker(){
 if(!allArchiveDate)return;
 const date=state.group?.date===state.solo?.date?state.group.date:null;
 const button=document.getElementById('all-dateButton');
 if(button)button.textContent=date?new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}):'Choose saved date';
 if(date)allArchiveDate.value=date;
 const dates=(state.manifest?.dates||[]).filter(d=>(state.manifest?.solo_dates||[]).includes(d)||(state.manifest?.solo_legacy_dates||[]).includes(d)).sort();
 const pos=dates.indexOf(date);
 for(const [id,disabled] of [['all-datePrev',pos<=0],['all-dateNext',pos<0||pos>=dates.length-1]]){
  const btn=document.getElementById(id);if(btn)btn.disabled=disabled;
 }
}
document.getElementById('all-dateButton')?.addEventListener('click',()=>{if(allArchiveDate.showPicker)allArchiveDate.showPicker();else allArchiveDate.focus()});
for(const [id,step] of [['all-datePrev',-1],['all-dateNext',1]]){
 document.getElementById(id)?.addEventListener('click',()=>{
  const dates=(state.manifest?.dates||[]).filter(d=>(state.manifest?.solo_dates||[]).includes(d)||(state.manifest?.solo_legacy_dates||[]).includes(d)).sort();
  const index=dates.indexOf(allArchiveDate.value);
  if(index>=0&&dates[index+step]){allArchiveDate.value=dates[index+step];allArchiveDate.dispatchEvent(new Event('change'))}
 });
}
document.getElementById('all-dateLatest')?.addEventListener('click',()=>{
 const dates=(state.manifest?.dates||[]).filter(d=>(state.manifest?.solo_dates||[]).includes(d)||(state.manifest?.solo_legacy_dates||[]).includes(d)).sort();
 if(dates.length){allArchiveDate.value=dates.at(-1);allArchiveDate.dispatchEvent(new Event('change'))}
});

if(allArchiveDate)allArchiveDate.addEventListener('change',async()=>{
 const date=allArchiveDate.value;
 if(!date||!latestArchives)return;
 allArchiveDate.disabled=true;
 try{
  const [group,solo]=await Promise.all(['group','solo'].map(scope=>date===latestArchives[scope].date?latestArchives[scope]:snapshot(scope,date)));
  if(!group||!solo){$('coverage').textContent='No matching saved snapshots for both OT13 and Units & Solo on '+date+'.';return}
  state.group=group;state.solo=solo;
  buildRows();buildAlbums();buildDiscography();
  state.page=0;
  await applyPeriod();
  const [prevGroup,prevSolo]=await Promise.all([snapshot('group',dayBefore(date)),snapshot('solo',dayBefore(date))]);
  state.milestonePrevious={group:prevGroup,solo:prevSolo};
  renderSummary();selectAllCategory(state.mode);renderArtists();renderTracks();syncAllDatePicker();
 }catch(error){console.warn('Combined archive date',error);$('coverage').textContent='Could not load that archived date.'}
 finally{allArchiveDate.disabled=false}
});
$('period').addEventListener('change',async()=>{state.period=$('period').value;state.page=0;$('coverage').textContent='Checking saved calendar boundaries…';await applyPeriod();renderTracks();renderArtists()});
$('prev').addEventListener('click',()=>{state.page--;renderTracks();$('recordings').scrollIntoView({block:'nearest'})});
$('next').addEventListener('click',()=>{state.page++;renderTracks();$('recordings').scrollIntoView({block:'nearest'})});
selectAllCategory(state.mode);
init();

})();
