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
const displayDate=date=>/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))?
 new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'}):String(date||'—');
const displayMonth=date=>/^\d{4}-\d{2}/.test(String(date||''))?
 new Date(date.slice(0,7)+'-01T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',year:'numeric'}):String(date||'—');
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
const allViewKey='svt-all-view-state-v2';
let allRemembered={};
try{allRemembered=JSON.parse(sessionStorage.getItem(allViewKey)||'{}')||{}}catch{}
const allRestoredScroll=(()=>{
 try{const saved=JSON.parse(sessionStorage.getItem('svt-dashboard-view-v2')||'{}');return saved.activeView==='all'&&Number.isFinite(Number(saved.scrollY))?Number(saved.scrollY):null}catch{return null}
})();
const state={metricBaseline:null,followersHistory:{},catalog:null,group:null,solo:null,media:null,followers:{},manifest:null,rows:[],albums:[],discography:[],mode:rememberedMode,albumSpecs:[],legacyLinks:null,milestonePrevious:{},snapshots:new Map(),page:Number.isInteger(allRemembered.page)&&allRemembered.page>=0?allRemembered.page:0,limit:50,period:['overall','daily','weekly','monthly','yearly'].includes(allRemembered.period)?allRemembered.period:'overall'};
function saveAllViewState(){
 if(!state.group?.date||!state.solo?.date)return;
 try{sessionStorage.setItem(allViewKey,JSON.stringify({
  date:state.group.date===state.solo.date?state.group.date:null,
  period:state.period,mode:state.mode,page:state.page,
  owner:$('owner')?.value||'all',query:$('search')?.value||'',sort:$('sort')?.value||'streams',artistSort:$('artistSort')?.value||'most'
 }))}catch{}
}
window.addEventListener('pagehide',saveAllViewState);
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
 if(release.key==='g49')return '17 IS RIGHT HERE — New Tracks';
 if(release.key==='g50')return '17 IS RIGHT HERE — Korean Versions';
 if(release.key==='g51'||release.key==='g52')return '17 IS RIGHT HERE — Additional Tracks';
 if(release.key==='g53')return '17 IS RIGHT HERE — Original Tracks';
 if(release.key==='g54')return '17 IS RIGHT HERE — Digital Bonus Track';
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
   if(/^\d{4}-\d{2}-\d{2}$/.test(releaseDate||'')&&releaseDate>snapshot.date)continue;
   (release.tracks||[]).forEach((id,index)=>{
    if(!validId(id))return;
    const released=release.track_release_dates?.[id]||releaseDate;
    if(/^\d{4}-\d{2}-\d{2}$/.test(released||'')&&released>snapshot.date)return;
    // Exclude known legacy aliases from the group catalog. The current
    // collector's canonical IDs are the authoritative recording population.
    if(scope==='group'&&Array.isArray(latestArchives?.group?.canonical_track_ids)&&
       !latestArchives.group.canonical_track_ids.includes(id))return;
    let row=byId.get(id);
    if(!row){row={id,scope,owners:new Set(),releaseNames:new Set(),date:null,title:null,streams:null,releaseKey:release.key};byId.set(id,row)}
    if(artist)row.owners.add(artist);
    // The Gilboard-only "Like It" recording is Dino's solo, not Picheolin's.
    if(release.key==='gilboard'&&index===6){row.owners.delete('Picheolin');row.owners.add('Dino')}
    if(release.title)row.releaseNames.add(originalAllReleaseTitle(release));
    const date=release.track_release_dates?.[id]||releaseDate;
    if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&(!row.date||date<row.date))row.date=date;
    const title=scope==='group'?(latestArchives?.group?.names?.[id]||nameFromRelease(release,id,index)||snapshot.names?.[id]):state.media.tracks?.[id]?.title;
    const candidate=title||nameFromRelease(release,id,index);
    if(candidate&&(!row.title||(scope===row.scope&&title)))row.title=originalAllTrackTitle(candidate,scope,id);
    const count=archivedTrackValue(scope,id,candidate||'');
    if(Number.isFinite(count)&&count>=0)row.streams=count;
   });
  }
  // Catalog additions may lag the collector; include verified recording IDs
  // from current snapshots even when release metadata has not arrived yet.
  for(const [id,count] of Object.entries(snapshot.tracks||{})){
   if(!validId(id)||!Number.isFinite(count))continue;
   if(snapshot.source==='historical spreadsheet'&&!byId.has(id))continue;
   if(scope==='group'&&Array.isArray(latestArchives?.group?.canonical_track_ids)&&!latestArchives.group.canonical_track_ids.includes(id))continue;
   let row=byId.get(id);
   if(!row){row={id,scope,owners:new Set([scope==='group'?'SEVENTEEN':'Unassigned solo/unit']),releaseNames:new Set(),date:null,title:null,streams:null};byId.set(id,row)}
   if(row.streams==null&&(!snapshot.source||snapshot.source!=='historical spreadsheet'))row.streams=count;
   if(!row.title)row.title=originalAllTrackTitle((scope==='group'?latestArchives?.group?.names?.[id]:state.media.tracks?.[id]?.title)||snapshot.names?.[id]||'',scope,id);
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
  const values=ids.map(id=>archivedTrackValue('group',id,latestArchives?.group?.names?.[id]||state.rows.find(row=>row.id===id)?.title||''));
  const streams=values.every(Number.isFinite)?values.reduce((sum,value)=>sum+value,0):null;
  const key=spec.keys[0];
  result.push({title:spec.name,kind:'album',scope:'group',releaseKey:key,
   owners:['SEVENTEEN'],releaseNames:[spec.name],ids,
   date:groupOriginalReleaseDates[key]||groupStandaloneReleaseDates[key]||releases[0]?.release_date||null,streams});
 }
 for(const spec of state.albumSpecs){
  const ids=unique(spec.tracks||[]).filter(validId);
  if(!ids.length)continue;
  const owners=spec.owners?.length?spec.owners:[spec.artist||'Unassigned solo/unit'];
  const values=ids.map(id=>archivedTrackValue('solo',id,state.media.tracks?.[id]?.title||state.rows.find(row=>row.id===id)?.title||''));
  const streams=values.every(Number.isFinite)?values.reduce((sum,value)=>sum+value,0):null;
  result.push({title:spec.displayName||spec.title||spec.key,scope:'solo',kind:'album',
   releaseKey:spec.key,owners,ids,releaseNames:[spec.displayName||spec.title||spec.key],
   date:spec.releaseDate||spec.release_date||null,streams});
 }
 state.albums=result;
}
// Compare older spreadsheets by confirmed recording identity, not recycled row IDs.
// Historical workbooks are expensive to cross-check by artist and duplicate
// edition. Resolve each snapshot/Spotify ID once, then reuse that verified
// observation throughout tracks, albums, discography and history.
const archivedValueCache=new WeakMap();
function archivedSnapshotValue(snap,scope,id,title){
 if(!snap||!id)return null;
 let values=archivedValueCache.get(snap);
 if(!values){values=new Map();archivedValueCache.set(snap,values)}
 const key=scope+'|'+id+'|'+sameTitle(title);
 if(values.has(key))return values.get(key);
 const verified=uncachedArchivedSnapshotValue(snap,scope,id,title);
 values.set(key,verified);
 return verified;
}
function uncachedArchivedSnapshotValue(snap,scope,id,title){
 if(!snap||!id)return null;
 const referenceName=(scope==='group'?latestArchives?.group?.names?.[id]:state.media?.tracks?.[id]?.title)||title||'';
 const direct=snap.tracks?.[id];
 const historical=snap.source==='historical spreadsheet';
 if(Number.isFinite(direct)&&(!historical||
   (snap.names?.[id]&&sameTitle(snap.names[id])===sameTitle(referenceName))))return direct;
 if(!historical)return null;
 if(scope==='solo'){
  // Original Units & Solo checks workbook owner, song, and duplicate ordinal.
  const matched=window.svtSharedMedia?.verifiedSoloLegacyValue?.(snap,id);
  return matched&&Number.isFinite(matched.value)?matched.value:null;
 }
 const normalized=sameTitle(referenceName);
 if(!normalized)return null;
 const mapped=latestArchives?.group?.baseline_ids_2026_11_05?.[id];
 // Confirmed workbook spellings differ from their canonical Spotify names.
 // Explicit ID-to-row aliases: never equate unrelated similarly named editions.
 const verifiedNames={
  '2kDrUAONMhG6CbDGBkhdrY':'worldfeatannemarrie',
  '6KfYVOicblNB8CaDZwbxiT':'dirtydancingfearjoshuadkdino',
  '3oTDi9MWC0JB39FcsLRon3':'sosprodmarshmello',
  '0xZ4WU5UfctiSeETi6pMEo':'golm',
  '2B0l8kFr4PzxH6gqX3NIoi':'badinfluence',
  '3ESkEsiPkaXl0CCRUMGkIk':'damagehoshisolo'
 };
 const mappedName=sameTitle(snap.names?.[mapped]);
 if(mapped&&Number.isFinite(snap.tracks?.[mapped])&&
  (mappedName===normalized||verifiedNames[id]===mappedName))
   return snap.tracks[mapped];
 const matches=Object.entries(snap.names||{}).filter(([key,name])=>
  sameTitle(name)===normalized&&Number.isFinite(snap.tracks?.[key])&&
  // The saved group archive's legacy keys ending in total are album subtotals.
  !/\btotal\b/i.test(name));
 return matches.length&&(matches.length===1||matches.every(([key])=>snap.tracks[key]===snap.tracks[matches[0][0]]))?
  snap.tracks[matches[0][0]]:null;
}
function archivedTrackValue(scope,id,title){
 return archivedSnapshotValue(state[scope],scope,id,title);
}
function buildDiscography(){
 const all=[];
 const anthologyKeys=new Set(['g49','g50','g51','g52','g53','g54']);
 const anthologyIds=unique((state.catalog.group||[]).filter(r=>anthologyKeys.has(r.key)).flatMap(r=>r.tracks||[]));
 // Each official release and track appearance stays visible. This catalog
 // is a list of release appearances, never the source for combined totals.
 const validSolo=new Set(Object.keys(state.solo.tracks||{}));
 const validGroup=new Set(state.group.canonical_track_ids||Object.keys(state.group.tracks||{}));
 const canonical=new Map(state.rows.map(row=>[row.id,row]));
 for(const scope of ['group','solo']){
  const snap=state[scope],valid=scope==='group'?validGroup:validSolo;
  const releases=(state.catalog[scope]||[]).filter(item=>
   item.key!=='sharedTracks'&&item.key!=='gilboard'&&
   !['jeonghan_g2','joshua_g8','jxj_dreamscape','the8_g12','vernon_g9','v8'].includes(item.key)&&!item.is_placeholder);
  const seenReleases=new Set();
  for(const release of releases){
   const key=scope+':'+release.key;
   if(seenReleases.has(key))continue;
   seenReleases.add(key);
   // A missing historical snapshot value must not erase a released song from Discography.
   const ids=unique((release.tracks||[]).filter(id=>validId(id)));
   if(!ids.length)continue;
   const owner=scope==='group'?'SEVENTEEN':
    artistIds.find(([name])=>name.toLowerCase()===String(release.artist||'').toLowerCase())?.[0]||
    release.artist||'Unassigned solo/unit';
   const name=originalAllReleaseTitle(release);
   const date=scope==='group'?
    (groupOriginalReleaseDates[release.key]||groupStandaloneReleaseDates[release.key]||release.release_date||null):
    (release.release_date||release.releaseDate||null);
   if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&date>snap.date)continue;
   const releaseValues=ids.map((id,i)=>archivedTrackValue(scope,id,scope==='group'?(latestArchives?.group?.names?.[id]||nameFromRelease(release,id,i)||''):(state.media.tracks?.[id]?.title||'')));
   const streams=releaseValues.every(Number.isFinite)?releaseValues.reduce((sum,n)=>sum+n,0):null;
   const isAlbum=/\b(album|mini|ep|repackage|best|compilation)\b/i.test(String(release.title||''));
   // A header separates release editions in the same order as OT13/solo Discography.
   const displayOrder=all.length;

   for(const id of ids){
    const row=canonical.get(id);
    const title=scope==='group'?(window.svtSharedMedia?.trackTitle?.(latestArchives?.group?.names?.[id]||row?.title||nameFromRelease(release,id,ids.indexOf(id)),scope,id)||latestArchives?.group?.names?.[id]||row?.title):state.media.tracks?.[id]?.title;
    all.push({id,title:originalAllTrackTitle(title||row?.title||id,scope,id),kind:'track',scope,
     owners:row?.owners?.length?row.owners:[owner],releaseNames:[name],date:release.track_release_dates?.[id]||date,
     releaseKey:scope==='group'&&anthologyKeys.has(release.key)?'g49':release.key,streams:archivedTrackValue(scope,id,title||row?.title||''),
     sortDate:date,releaseOrder:all.length,discographyTrack:true});
   }
   if(scope==='group'&&anthologyKeys.has(release.key)){
    if(release.key==='g54'){
     const totalValues=all.filter(row=>row.scope==='group'&&row.releaseKey==='g49'&&row.kind==='track').map(row=>row.streams);
     const total=totalValues.length===anthologyIds.length&&totalValues.every(Number.isFinite)?totalValues.reduce((sum,n)=>sum+n,0):null;
     all.push({kind:'album',title:'1st Best Album - 17 IS RIGHT HERE',scope,releaseKey:'g49',
      owners:[owner],releaseNames:['17 IS RIGHT HERE'],date,sortDate:date,streams:total,
      ids:anthologyIds,releaseOrder:all.length,discographyHeader:true});
    }
   }else all.push({kind:'album',title:name,scope,releaseKey:release.key,
    owners:[owner],releaseNames:[name],date,sortDate:date,streams,ids,releaseOrder:all.length,discographyHeader:true});
  }
 }
 // Some unit albums (JxJ, V8) are defined in the canonical solo album
 // catalog instead of as a standalone unit release in the per-member catalog.
 // Include an actual unit release heading so artist filtering keeps the album
 // alongside its songs, without changing the underlying recording totals.
 const seenUnitAlbums=new Set();
 for(const spec of state.albumSpecs||[]){
  if(!['jxj_dreamscape','v8','gilboard'].includes(spec.key)||seenUnitAlbums.has(spec.key))continue;
  seenUnitAlbums.add(spec.key);
  const ids=unique((spec.tracks||[]).filter(id=>validId(id)));
  if(!ids.length)continue;
  const owners=['jxj_dreamscape','v8'].includes(spec.key)?[spec.key==='v8'?'V8':'JxJ']:(spec.owners||[]),name=spec.displayName||spec.key;
  const date=spec.releaseDate||spec.release_date||null,begin=all.length;
  if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&date>state.solo.date)continue;
  const streams=ids.every(id=>Number.isFinite(archivedTrackValue('solo',id,state.media.tracks?.[id]?.title||'')))?
   ids.reduce((sum,id)=>sum+archivedTrackValue('solo',id,state.media.tracks?.[id]?.title||''),0):null;

  for(const id of ids){
   const main=canonical.get(id),name=state.media.tracks?.[id]?.title||main?.title||id;
   all.push({id,title:originalAllTrackTitle(name,'solo',id),kind:'track',scope:'solo',
    owners:main?.owners?.length?main.owners:owners,releaseNames:[spec.displayName||spec.key],
    date,sortDate:date,releaseKey:spec.key,releaseOrder:all.length,
    streams:archivedTrackValue('solo',id,name),discographyTrack:true});
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
 const title=scope==='group'?latestArchives?.group?.names?.[id]:state.media?.tracks?.[id]?.title;
 return archivedSnapshotValue(baseline,scope,id,title||'');
}
function earlierBoundary(scope,period){
 const current=boundaryDate(scope,period);
 if(!current)return null;
 if(period==='daily')return dayBefore(current);
 if(period==='weekly')return dayBefore(monday(current));
 if(period==='monthly')return dayBefore(firstOfMonth(current));
 if(period==='yearly')return dayBefore(firstOfYear(current));
 return null;
}
function verifiedGainBetween(scope,id,newer,older,title,releaseDate){
 if(!newer||!older)return null;
 const released=/^\d{4}-\d{2}-\d{2}$/.test(releaseDate||'');
 // A recording released during this period had zero pre-release streams.
 // Only use zero when its verified release date is later than the baseline.
 const a=released&&newer.date<releaseDate?0:archivedSnapshotValue(newer,scope,id,title);
 const b=released&&older.date<releaseDate?0:archivedSnapshotValue(older,scope,id,title);
 if(!Number.isFinite(a)||!Number.isFinite(b))return null;
 // A verified counter can decrease after Spotify revises its statistics.
 // Preserve the recorded signed change; do not call it missing streams.
 const gain=a-b;
 // The values above are already matched to the exact saved recording.
 // Do not silently discard real changes because they exceed an arbitrary
 // daily-growth threshold (particularly a newly released track).
 return gain;
}
let periodEpoch=0;
async function applyPeriod(){
 const epoch=++periodEpoch,period=state.period,scopes=['group','solo'];
 const dateKey=state.group?.date+'|'+state.solo?.date;
 if(period==='overall'){
  state.metricBaseline={group:null,solo:null};
  [...state.rows,...state.albums,...state.discography].forEach(row=>{row.gain=null;row.change=null});
  return true;
 }
 const [currentBoundaries,olderBoundaries]=await Promise.all([
  Promise.all(scopes.map(scope=>snapshot(scope,boundaryDate(scope,period)))),
  Promise.all(scopes.map(scope=>snapshot(scope,earlierBoundary(scope,period))))
 ]);
 if(epoch!==periodEpoch||period!==state.period||dateKey!==state.group?.date+'|'+state.solo?.date)return false;
 const baseline={group:currentBoundaries[0],solo:currentBoundaries[1]};
 const older={group:olderBoundaries[0],solo:olderBoundaries[1]};
 state.metricBaseline=baseline;
 for(const row of [...state.rows,...state.albums,...state.discography]){
  const ids=row.ids||[row.id],scope=row.scope;
  const deltas=ids.map(id=>{
   const title=scope==='group'?latestArchives?.group?.names?.[id]:state.media?.tracks?.[id]?.title;
   const releaseDate=state.rows.find(record=>record.id===id)?.date||row.date;
   return verifiedGainBetween(scope,id,state[scope],baseline[scope],title||row.title,releaseDate);
  });
  row.gain=deltas.length&&deltas.every(Number.isFinite)?deltas.reduce((sum,v)=>sum+v,0):null;
  const prior=ids.map(id=>{
   const title=scope==='group'?latestArchives?.group?.names?.[id]:state.media?.tracks?.[id]?.title;
   const releaseDate=state.rows.find(record=>record.id===id)?.date||row.date;
   return verifiedGainBetween(scope,id,baseline[scope],older[scope],title||row.title,releaseDate);
  });
  const priorGain=prior.length&&prior.every(Number.isFinite)?prior.reduce((sum,v)=>sum+v,0):null;
  row.change=Number.isFinite(row.gain)&&Number.isFinite(priorGain)?row.gain-priorGain:null;
 }
 return true;
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
  const releases=state.rows.filter(row=>a.recordings.has(row.id)&&row.date).map(row=>row.date).sort();
  return {...a,listeners:Number.isFinite(listeners)?listeners:null,followers,streams,
   earliestRelease:releases[0]||null,latestRelease:releases.at(-1)||null};
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
  'OT13 '+displayDate(groupDate)+' · Solo '+displayDate(soloDate);
 $('summaryDateNote').textContent=sameDay?'Both archives · '+displayDate(groupDate):
  'OT13 '+displayDate(groupDate)+' · Unit/Solo '+displayDate(soloDate);
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
 const period=state.period;
 const heading=document.getElementById('all-summaryGrowthHeading');
 if(heading)heading.textContent=period==='overall'?'STREAM GROWTH · OVERALL':period.toUpperCase()+' STREAM GROWTH';
 const verifiedGains=rows.map(row=>row.gain);
 const allVerified=period!=='overall'&&rows.length>0&&sameDay&&verifiedGains.every(Number.isFinite);
 const totalGrowth=allVerified?verifiedGains.reduce((sum,n)=>sum+n,0):null;
 if(period==='overall'){
  $('summaryGrowth').textContent='—';
  $('summaryGrowthNote').textContent='Cumulative streams shown on the left. Choose a time period to see growth.';
 }else{
  const observedGains=verifiedGains.filter(Number.isFinite);
  const verifiedSubset=observedGains.length?observedGains.reduce((sum,n)=>sum+n,0):null;
  const figure=allVerified?totalGrowth:verifiedSubset;
  $('summaryGrowth').textContent=Number.isFinite(figure)?
   (figure>0?'+':'')+fmt(figure)+(allVerified?'':'*'):'—';
  const corrections=observedGains.filter(n=>n<0).length;
  const note=allVerified?
   (period==='daily'?'From '+displayDate(dayBefore(groupDate))+' to '+displayDate(groupDate):'Verified '+period+' net counter change ending '+displayDate(groupDate)):
   observedGains.length?observedGains.length+' of '+rows.length+' recordings verified · partial '+period+' change only (*)':
    'No comparable '+period+' archive observations — no estimated growth';
  $('summaryGrowthNote').textContent=note+(corrections?' · '+corrections+' saved counter decrease'+(corrections===1?'':'s')+' included':'');
 }
 $('summaryGrowth').classList.toggle('svt-gain-positive',Number.isFinite(totalGrowth)&&totalGrowth>0);
 $('summaryGrowth').classList.toggle('svt-gain-negative',Number.isFinite(totalGrowth)&&totalGrowth<0);
 $('summaryCoverage').textContent=allComplete?
  fmt(rows.length)+' distinct Spotify recordings · group, members and units combined without duplicate editions or shared recording IDs. '+
  (complete?'All '+fmt(rows.length)+' recordings have verified previous-day comparisons.':
   'The daily change is withheld where comparable snapshots are missing.'):
  'Some unique recordings lack verified totals; no combined number is displayed until all totals are available.';
}
function artworkFor(row){
 // HIT's pre-release single uses its own sleeve, not the later An Ode cover.
 if(row.scope==='group'&&row.id==='0uIw1c0E2nyFWWwEVzhl30'&&row.releaseKey==='g19')return 'release:HIT';
 try{const source=window.svtSharedMedia?.coverFor({...row,discographyAppearance:state.mode==='discography'});if(source)return source}catch(e){console.warn('Shared cover not ready',e)}
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
 $('artistMetricHeading').textContent=metric==='streams'&&state.period!=='overall'?state.period.toUpperCase()+' STREAMS GAINED':
  (labels[metric]||labels.streams)+(state.period==='overall'?'':' · '+state.period.toUpperCase()+' CHANGE');
 const header=$('artistSectionTitle');
 if(header)header.textContent=(metric==='streams'?(state.period==='overall'?'Total Streams':state.period[0].toUpperCase()+state.period.slice(1)+' Streams Gained'):
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
    // Streams ranked by the selected period's gain, not cumulative streams.
    // Each recording contributes at most once to an artist's total.
    const tracks=state.rows.filter(row=>a.recordings.has(row.id));
    const verified=tracks.filter(row=>Number.isFinite(row.gain));
    const observedGain=verified.length?verified.reduce((sum,row)=>sum+row.gain,0):null;
    const complete=tracks.length>0&&verified.length===tracks.length;
    return {...a,change:complete?observedGain:null,observedGain,
     observedTracks:verified.length,totalTracks:tracks.length,partial:!complete};
   }
   return {...a,change:Number.isFinite(current)&&Number.isFinite(previous)?current-previous:null};
  })
  .filter(a=>(scope==='all'||(scope==='members'?members.has(a.name):units.has(a.name)))&&
   Number.isFinite(a[metric]))
  .sort((a,b)=>{
   const sort=$('artistSort')?.value||'most';
   if(sort==='az')return a.name.localeCompare(b.name);
   if(sort==='za')return b.name.localeCompare(a.name);
   if(sort==='newest')return (b.latestRelease||'').localeCompare(a.latestRelease||'')||a.name.localeCompare(b.name);
   if(sort==='oldest')return (a.earliestRelease||'9999').localeCompare(b.earliestRelease||'9999')||a.name.localeCompare(b.name);
   const av=metric==='streams'&&period!=='overall'?a.observedGain:period==='overall'?a[metric]:a.change;
   const bv=metric==='streams'&&period!=='overall'?b.observedGain:period==='overall'?b[metric]:b.change;
   const metricA=Number.isFinite(av)?av:(sort==='least'?Infinity:-Infinity);
   const metricB=Number.isFinite(bv)?bv:(sort==='least'?Infinity:-Infinity);
   return (sort==='least'?metricA-metricB:metricB-metricA)||a.name.localeCompare(b.name);
  });
 const source=metric==='streams'?'recording totals':metric==='listeners'?
  'monthly listener observations':'verified follower snapshots';
 $('artistNote').textContent=rows.length+' profiles with saved '+source+
  ' · ranked from highest to lowest · profiles with unavailable values are hidden. '+
  'Group: '+displayDate(state.group.date)+' · Solo/Unit: '+displayDate(state.solo.date)+'. '+
  'Streams on member and unit profiles may overlap; the combined track catalog counts distinct recordings once.'+
  (metric==='streams'&&period!=='overall'?' * Indicates only a verified subset of '+period+' streams, not a complete period total.':'');
 $('artists').innerHTML=rows.map((a,i)=>
  '<tr><td><div class="svt-all-person">'+
  '<span class="svt-all-rank">'+String(i+1).padStart(2,'0')+'</span>'+
  '<img class="svt-all-avatar artist-profile-photo" data-all-artist-photo="'+esc(a.name)+'" alt="'+esc(a.name)+' profile photo" loading="lazy">'+
  '<div class="svt-all-person-copy"><span class="svt-all-song">'+esc(a.name)+'</span>'+
  '<div class="svt-all-sub">'+(a.name==='SEVENTEEN'?'Group':members.has(a.name)?'Member':'Unit')+
  ' · '+(a.recordings.size||0)+' recordings</div></div></div></td>'+
  '<td class="svt-all-num '+(metric==='streams'&&period!=='overall'?
   Number.isFinite(a.observedGain)?a.observedGain>0?'svt-gain-positive':a.observedGain<0?'svt-gain-negative':'svt-gain-neutral':'svt-gain-neutral':'')+'">'+
  (metric==='streams'&&period!=='overall'
   ?(Number.isFinite(a.observedGain)?(a.observedGain>0?'+':'')+fmt(a.observedGain)+(a.partial?'*':''):'—')+
    '<div class="svt-all-sub">'+(a.partial?
      'Verified subset: '+(a.observedTracks||0)+' / '+(a.totalTracks||0)+' tracks · incomplete '+period:
      period+' streams gained')+'</div>'
   :fmt(a[metric])+(period==='overall'?'':'<div class="svt-all-sub '+(Number.isFinite(a.change)?a.change>0?'svt-gain-positive':a.change<0?'svt-gain-negative':'svt-gain-neutral':'svt-gain-neutral')+'">'+(Number.isFinite(a.change)?(a.change>0?'+':'')+fmt(a.change):'—')+' '+period+' change</div>'))+
  '</td></tr>'
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
  if(effectiveOrder==='title-za')return (b.title||'').localeCompare(a.title||'');
  if(effectiveOrder==='newest')return (b.sortDate||b.date||'').localeCompare(a.sortDate||a.date||'');
  if(effectiveOrder==='oldest')return (a.sortDate||a.date||'9999').localeCompare(b.sortDate||b.date||'9999');
  const x=score(a),y=score(b);
  if(!Number.isFinite(x))return Number.isFinite(y)?1:0;
  if(!Number.isFinite(y))return -1;
  return (effectiveOrder==='least'?x-y:y-x)||String(a.title).localeCompare(String(b.title));
 });
 const totalPages=isDiscography?1:Math.max(1,Math.ceil(rows.length/state.limit));
 state.page=isDiscography?0:Math.min(state.page,totalPages-1);
 const shown=isDiscography?rows:rows.slice(state.page*state.limit,(state.page+1)*state.limit);
 const sourceRows=isDiscography?state.discography:isAlbum?state.albums:state.rows;
 const pagination=document.querySelector('#svtAllView .svt-all-pagination');
 if(pagination){
  pagination.hidden=isDiscography;
  pagination.style.setProperty('display',isDiscography?'none':'flex','important');
  pagination.setAttribute('aria-hidden',String(isDiscography));
 }
 const verified=rows.filter(r=>Number.isFinite(score(r))).length;
 $('recordHeading').textContent=isDiscography?'Every release · Group + Units & Solo':
  isAlbum?'Every saved album':'Every saved recording';
 $('catalogModeLabel').textContent=isDiscography?'Discography · Group, Members & Units':
  isAlbum?'Album Rankings · All Artists':'Track Rankings · All Artists';
 $('totalTitle').textContent='TOTAL STREAMS';
 $('gainTitle').hidden=period==='overall';
 $('gainTitle').textContent=period.toUpperCase()+' INCREASE';
 $('changeTitle').hidden=period==='overall';
 $('changeTitle').textContent='CHANGE';
 document.getElementById('svtAllView').classList.toggle('svt-all-period-metrics',period!=='overall');
 const date=state.group.date,from=boundaryDate('group',period);
 const periodRange=period==='overall'?'all-time totals':
  (from&&date?dayBefore(date)>from?dayBefore(date):date:date);
 const periodText=period==='overall'?'Cumulative Spotify observations':
  'Verified '+period+' gains from '+displayDate(from)+' to '+displayDate(date)+
  ' (beginning after the baseline date)';
 $('coverage').textContent='Latest saved: Group '+displayDate(state.group.date)+' · Unit/Solo '+displayDate(state.solo.date)+
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
   (row.date?' · '+displayDate(row.date):'');
  const ranked=isDiscography?(row.discographyHeader?'◆':'·'):
   Number.isFinite(value)?String(state.page*state.limit+i+1).padStart(2,'0'):'—';
  const printTotal=fmt(row.streams);
  const added=row.gain;
  const printGain=Number.isFinite(added)?(added>0?'+':'')+fmt(added):'—';
  const gainColor=Number.isFinite(added)?(added>0?'svt-gain-positive':added<0?'svt-gain-negative':'svt-gain-neutral'):'svt-gain-neutral';
  const changed=row.change;
  const printChange=Number.isFinite(changed)?(changed>0?'+':'')+fmt(changed):'—';
  const changeColor=Number.isFinite(changed)?(changed>0?'svt-gain-positive':changed<0?'svt-gain-negative':'svt-gain-neutral'):'svt-gain-neutral';
  return '<tr'+(isDiscography&&row.discographyHeader?' class="svt-all-release-row"':'')+
   '><td><div class="svt-all-record"><span class="svt-all-rank">'+ranked+'</span>'+
   '<span class="svt-all-art-holder"><img class="svt-all-cover cover" data-cover-track="'+artwork+
   '" data-cover-name="'+name+'" data-cover-kind="'+(isAlbum?'album':'track')+
   '" alt="'+name+' cover" loading="lazy"><span class="cover-placeholder" hidden></span></span>'+
   '<div class="svt-all-record-copy">'+link+'<div class="svt-all-sub">'+esc(sub)+
   '</div></div></div></td><td class="svt-all-num svt-all-stream-total" data-all-history="'+sourceRows.indexOf(row)+'" tabindex="0" role="button" title="View saved stream history">'+printTotal+'</td>'+
   (period==='overall'?'':'<td class="svt-all-num '+gainColor+'" data-all-history="'+sourceRows.indexOf(row)+'" tabindex="0" role="button" title="View saved stream history">'+printGain+'</td>'+
    '<td class="svt-all-num '+changeColor+'" data-all-history="'+sourceRows.indexOf(row)+'" tabindex="0" role="button" title="View saved stream history">'+printChange+'</td>')+'</tr>';
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
  if(sharedDates.includes(allRemembered.date)&&allRemembered.date!==group.date){
   const [savedGroup,savedSolo]=await Promise.all(['group','solo'].map(scope=>snapshot(scope,allRemembered.date)));
   if(savedGroup&&savedSolo){state.group=savedGroup;state.solo=savedSolo;}
  }
  if(picker){picker.min=sharedDates[0]||group.date;picker.max=sharedDates.at(-1)||group.date;picker.value=state.group.date===state.solo.date?state.group.date:'';picker.title='Choose a day with saved OT13 and Units & Solo snapshots';}
  // Old spreadsheet IDs need the canonical matcher loaded by the OT13/solo app.
  // A race between the two scripts previously left All with blank historical rows.
  if(!window.svtSharedMedia?.verifiedSoloLegacyValue){
   await Promise.race([
    new Promise(resolve=>window.addEventListener('svt-media-ready',resolve,{once:true})),
    new Promise(resolve=>setTimeout(resolve,6000))
   ]);
  }
  $('period').value=state.period;
  if(typeof allRemembered.query==='string')$('search').value=allRemembered.query;
  if(['streams','least','newest','oldest','title','title-za'].includes(allRemembered.sort))$('sort').value=allRemembered.sort;
  buildRows();
  for(const extra of admin.releases||[])if(extra.scope==='solo'&&extra.release_type==='album')
   state.albumSpecs.push({key:extra.key,displayName:extra.title,releaseDate:extra.release_date,owners:[extra.artist],tracks:extra.tracks});
  buildAlbums();buildDiscography();
  const names=unique(state.rows.flatMap(r=>r.owners)).filter(x=>x!=='Unassigned solo/unit').sort((a,b)=>a.localeCompare(b));
  $('owner').innerHTML='<option value="all">All recordings</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
  if(names.includes(allRemembered.owner))$('owner').value=allRemembered.owner;
  if(['most','least','az','za','newest','oldest'].includes(allRemembered.artistSort))$('artistSort').value=allRemembered.artistSort;
  await applyPeriod();selectAllCategory(state.mode);renderArtists();renderTracks();
  const [prevGroup,prevSolo]=await Promise.all([
   snapshot('group',dayBefore(state.group.date)),snapshot('solo',dayBefore(state.solo.date))]);
  state.milestonePrevious={group:prevGroup,solo:prevSolo};
  renderSummary();syncAllDatePicker();
  saveAllViewState();
  if(allRestoredScroll!==null)requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,allRestoredScroll)));
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
for(const id of ['artistMetric','artistScope','artistSort'])$(id).addEventListener('change',()=>{
 if($('artistMetric').value!==state.mode&&['streams','listeners','followers'].includes($('artistMetric').value))
  selectAllCategory($('artistMetric').value);
 renderArtists();
});
for(const id of ['search','owner','sort','viewType'])$(id).addEventListener(id==='search'?'input':'change',()=>{state.page=0;renderTracks();saveAllViewState()});
window.svtAllShown=()=>{selectAllCategory(state.mode);if(state.rows.length){renderSummary();renderArtists();renderTracks();}};
window.addEventListener('svt-media-ready',async()=>{
 if(!state.rows.length)return;
 // Rebuild archived values after original history identity metadata becomes ready.
 buildRows();buildAlbums();buildDiscography();
 if(!await applyPeriod())return;
 renderSummary();renderArtists();renderTracks();
});
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
  if(!await applyPeriod())return;
  const [prevGroup,prevSolo]=await Promise.all([snapshot('group',dayBefore(date)),snapshot('solo',dayBefore(date))]);
  state.milestonePrevious={group:prevGroup,solo:prevSolo};
  renderSummary();selectAllCategory(state.mode);renderArtists();renderTracks();syncAllDatePicker();saveAllViewState();
 }catch(error){console.warn('Combined archive date',error);$('coverage').textContent='Could not load that archived date.'}
 finally{allArchiveDate.disabled=false}
});
$('period').addEventListener('change',async()=>{state.period=$('period').value;state.page=0;$('coverage').textContent='Checking saved calendar boundaries…';if(!await applyPeriod())return;renderSummary();renderTracks();renderArtists();saveAllViewState()});
$('prev').addEventListener('click',()=>{state.page--;renderTracks();saveAllViewState();$('recordings').scrollIntoView({block:'nearest'})});
$('next').addEventListener('click',()=>{state.page++;renderTracks();saveAllViewState();$('recordings').scrollIntoView({block:'nearest'})});

/* All archive history inspector: real dated snapshots, no interpolated values. */
const allHistoryDialog=document.createElement('dialog');
allHistoryDialog.id='svt-all-history-dialog';
allHistoryDialog.innerHTML='<div class="all-history-head"><h2 id="all-history-title">Stream history</h2><button type="button" aria-label="Close history">×</button></div><p id="all-history-note"></p><div class="all-history-scroll"><table><thead><tr><th>Date</th><th>Total</th><th>Increase</th><th>Change in increase</th></tr></thead><tbody id="all-history-body"></tbody></table></div>';
document.body.append(allHistoryDialog);
const historyCss=document.createElement('style');
historyCss.textContent='#svt-all-history-dialog{width:min(740px,94vw);max-height:88dvh;overflow:auto;border:1px solid #8570b6;border-radius:18px;background:#191a36;color:#f8f3ff;padding:20px;box-shadow:0 20px 80px #080817}#svt-all-history-dialog::backdrop{background:#050515cc;backdrop-filter:blur(6px)}#svt-all-history-dialog .all-history-head{display:flex;justify-content:space-between;align-items:center;gap:12px}#svt-all-history-dialog h2{font:800 22px Manrope,sans-serif;margin:0}#svt-all-history-dialog button{border:1px solid #8275ad;background:#343154;color:white;border-radius:9px;padding:8px 14px;cursor:pointer}#all-history-note{font:12px/1.5 Manrope,sans-serif;color:#c4b9de}#svt-all-history-dialog .all-history-scroll{overflow-x:auto}#svt-all-history-dialog table{width:100%;border-collapse:collapse;font:12px/1.5 Manrope,sans-serif;min-width:500px}#svt-all-history-dialog th,#svt-all-history-dialog td{padding:11px 8px;text-align:right;border-bottom:1px solid #44405e;white-space:nowrap}#svt-all-history-dialog th:first-child,#svt-all-history-dialog td:first-child{text-align:left}#svtAllView [data-all-history]{cursor:pointer;text-decoration:underline dotted transparent;text-underline-offset:4px}#svtAllView [data-all-history]:hover,#svtAllView [data-all-history]:focus-visible{text-decoration-color:#f0b6e7;outline-color:#d4a8ed}';
document.head.append(historyCss);
allHistoryDialog.querySelector('button').addEventListener('click',()=>allHistoryDialog.close());
const historyDay=(date,offset)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)};
const historyPeriodStart=(date,mode)=>{if(mode==='monthly')return date.slice(0,7)+'-01';const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)};
const historyPeriodShift=(date,mode,offset)=>{const d=new Date(date+'T12:00:00Z');if(mode==='monthly')d.setUTCMonth(d.getUTCMonth()+offset);else d.setUTCDate(d.getUTCDate()+7*offset);return d.toISOString().slice(0,10)};
function historySnapshotValue(snap,row){
 if(!snap)return null;
 const ids=row.ids||[row.id];
 const values=ids.map(id=>{
  const releaseDate=state.rows.find(record=>record.id===id)?.date||row.date;
  if(releaseDate&&snap.date<releaseDate)return null;
  return archivedSnapshotValue(snap,row.scope,id,
   id===row.id?row.title:row.scope==='group'?latestArchives?.group?.names?.[id]:state.media?.tracks?.[id]?.title);
 });
 return values.length&&values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0):null;
}
let historyRequest=0;
async function historyValueAt(date,row){
 if(row.scope==='all'){
  const [group,solo]=await Promise.all(['group','solo'].map(scope=>snapshot(scope,date)));
  if(!group||!solo)return null;
  let total=0,matched=0,eligible=0;
  const values=Object.create(null);
  for(const track of state.rows){
   if(track.date&&track.date>date)continue;
   eligible++;
   const value=historySnapshotValue(track.scope==='group'?group:solo,track);
   if(!Number.isFinite(value))continue;
   total+=value;matched++;values[track.id]=value;
  }
  // Historical workbook mismatches should not erase every known observation.
  // A partial total is visibly marked and never described as the complete total.
  return matched?{total,matched,eligible,complete:matched===eligible,values}:null;
 }
 if(row.date&&date<row.date)return null;
 return historySnapshotValue(await snapshot(row.scope,date),row);
}
// Read-only diagnostic: exposes which catalog recordings cannot be matched
// in each saved historical snapshot (never fills missing observations).
window.svtAllHistoryAudit=async date=>{
 const row={scope:'all'};
 const value=await historyValueAt(date,row);
 const unmatched=state.rows.filter(track=>!(track.date&&track.date>date)&&
  !Object.prototype.hasOwnProperty.call(value?.values||{},track.id));
 return {date,matched:value?.matched??0,eligible:value?.eligible??0,
  complete:!!value?.complete,
  missing:unmatched.map(track=>({id:track.id,title:track.title,scope:track.scope,release:track.date}))};
};
async function showAllHistory(row){
 const request=++historyRequest;
 const mode=['monthly','yearly'].includes(state.period)?'monthly':state.period==='weekly'?'weekly':'daily';
 const count=mode==='monthly'?12:10;
 const end=row.scope==='all'?(state.group.date===state.solo.date?state.group.date:state.group.date<state.solo.date?state.group.date:state.solo.date):state[row.scope].date;
 const tbody=document.getElementById('all-history-body');
 document.getElementById('all-history-title').textContent=row.title||'Combined streams';
 document.getElementById('all-history-note').textContent='Last '+count+' '+(mode==='monthly'?'months':mode==='weekly'?'weeks':'days')+' through '+displayDate(end)+' · verified saved observations only. * means a verified subset or incomplete period, not a full historical total. Unrecorded dates are labeled; missing comparisons show —. Pink negative changes reflect recorded counter decreases or revisions.';
 tbody.innerHTML='<tr><td colspan="4">Loading saved history…</td></tr>';
 if(!allHistoryDialog.open)allHistoryDialog.showModal();
 // Require exact saved dates for comparisons; never interpolate records.
 const hasSavedDate=(scope,date)=>!!date&&(scope==='group'?
  (state.manifest?.dates||[]).includes(date):
  scope==='solo'?[...(state.manifest?.solo_dates||[]),...(state.manifest?.solo_legacy_dates||[])].includes(date):
  (state.manifest?.dates||[]).includes(date)&&
   [...(state.manifest?.solo_dates||[]),...(state.manifest?.solo_legacy_dates||[])].includes(date));
 const periods=[];
 if(mode==='daily'){
  for(let i=count+1;i>=0;i--){
   const date=historyDay(end,-i);
   periods.push({date,label:displayDate(date),partial:false});
  }
 }else{
  const first=historyPeriodStart(end,mode);
  const eligible=state.manifest?.dates||[];
  const soloEligible=new Set([...(state.manifest?.solo_dates||[]),...(state.manifest?.solo_legacy_dates||[])]);
  const known=(row.scope==='solo'?Array.from(soloEligible):row.scope==='all'?eligible.filter(d=>soloEligible.has(d)):eligible).sort();
  for(let i=count;i>=0;i--){
   const start=historyPeriodShift(first,mode,-i);
   const last=historyDay(historyPeriodShift(start,mode,1),-1);
   const cutoff=last<end?last:end;
   const candidates=known.filter(d=>d>=start&&d<=cutoff);
   const observation=candidates.at(-1)||null;
   periods.push({date:observation,start,last,label:mode==='monthly'?displayMonth(start):displayDate(start)+' – '+displayDate(last),
    partial:observation!==last});
  }
 }
 // For incomplete months/weeks, align comparison to the same number
 // of elapsed calendar days in the preceding period, never a full period.
 const alignedPriorDates=[];
 if(mode!=='daily')for(let i=1;i<periods.length;i++){
  const current=periods[i],prior=periods[i-1];
  if(!current.partial||!current.date||!prior.start)continue;
  const elapsed=Math.round((Date.parse(current.date)-Date.parse(current.start))/86400000);
  const aligned=historyDay(prior.start,elapsed);
  if(aligned<=prior.last&&hasSavedDate(row.scope,aligned)){
   current.alignedPriorDate=aligned;alignedPriorDates.push(aligned);
  }
 }
 const observations=await Promise.all([...new Set([...periods.map(p=>p.date),...alignedPriorDates].filter(Boolean))].map(async date=>{
  try{return [date,await historyValueAt(date,row)]}catch(error){console.warn('All history observation',date,error);return [date,null]}
 }));
 if(request!==historyRequest)return;
 const byDate=new Map(observations);
 const signed=n=>Number.isFinite(n)?(n>0?'+':'')+fmt(n):'—';
 const tone=n=>Number.isFinite(n)?n>0?'svt-gain-positive':n<0?'svt-gain-negative':'svt-gain-neutral':'svt-gain-neutral';
 const output=[];
 for(let i=0;i<count;i++){
  const current=mode==='daily'?periods[i+2]:periods[i+1];
  const prev=mode==='daily'?periods[i+1]:periods[i];
  const before=mode==='daily'?periods[i]:i>0?periods[i-1]:null;
  const present=byDate.get(current.date),previous=byDate.get(prev.date);
  const older=before?byDate.get(before.date):null;
  const isCombined=row.scope==='all';
  const total=isCombined?present?.total:present;
  const completeTotal=isCombined?present?.complete:Number.isFinite(total);
  const comparable=(a,b)=>{
   if(!a?.values||!b?.values)return {gain:null,complete:false};
   let gain=0,count=0;
   for(const [trackId,value] of Object.entries(a.values)){
    let earlier=b.values[trackId];
    if(!Number.isFinite(earlier)){
     // First appearance after a verified release date: the recording had
     // no Spotify streams before that date, rather than missing data.
     const released=state.rows.find(record=>record.id===trackId)?.date;
     if(released&&b.date<released&&a.date>=released)earlier=0;
     else continue;
    }
    const difference=value-earlier;
    // Preserve verified downward corrections rather than dropping the date.
    // An edition swap or workbook mapping jump is not a streaming increase.
    // Every value is an exact verified archive identity. Keep legitimate
    // corrections and newly released songs, even when their gain is large.
    gain+=difference;count++;
   }
   const complete=!!(a.complete&&b.complete&&count===a.eligible);
   // When both full canonical populations are present, subtract the actual
   // saved combined totals. This includes all net Spotify corrections.
   return {gain:complete?a.total-b.total:count?gain:null,complete,matched:count};
  };
  if(isCombined&&present)present.date=current.date;
  if(isCombined&&previous)previous.date=prev.date;
  if(isCombined&&older&&before)older.date=before.date;
  const alignedPrevious=current.alignedPriorDate?byDate.get(current.alignedPriorDate):null;
  // Monthly/weekly "Change" on a partial period compares the exact
  // same elapsed days of the prior period, NOT a complete previous month.
  const oldReference=mode!=='daily'&&current.partial?alignedPrevious:previous;
  if(isCombined&&oldReference&&current.alignedPriorDate)oldReference.date=current.alignedPriorDate;
  const pair=isCombined?comparable(present,previous):null;
  const oldPair=isCombined?comparable(oldReference,older):null;
  const releasedNow=!isCombined&&row.date&&current.date>=row.date&&prev.date<row.date;
  const gain=isCombined?pair.gain:
   Number.isFinite(total)&&(releasedNow?total:Number.isFinite(previous)?total-previous:null);
  const oldGain=isCombined?oldPair.gain:
   Number.isFinite(oldReference)&&Number.isFinite(older)?oldReference-older:null;
  const exactPeriodChange=mode==='daily'||Boolean(before&&
   prev.date===prev.last&&before.date===before.last&&
   (!current.partial||!!current.alignedPriorDate));
  const change=exactPeriodChange&&(!isCombined||pair.complete&&oldPair.complete)&&
   Number.isFinite(gain)&&Number.isFinite(oldGain)?gain-oldGain:null;
  const partial=(mode!=='daily'&&(current.partial||prev.partial))||
   (isCombined&&!pair.complete);
  const label=current.label;
  const recorded=hasSavedDate(row.scope,current.date);
  const totalLabel=!recorded?'Not recorded':fmt(total)+((current.partial||!completeTotal)&&Number.isFinite(total)?'*':'');
  output.push('<tr><td>'+esc(label)+'</td><td>'+totalLabel+
   '</td><td class="'+tone(gain)+'">'+signed(gain)+(partial&&Number.isFinite(gain)?'*':'')+
   '</td><td class="'+tone(change)+'">'+signed(change)+(partial&&Number.isFinite(change)?'*':'')+'</td></tr>');
 }
 tbody.innerHTML=output.join('');
}
for(const [id,title] of [['all-summaryStreams','All artists · Total streams'],['all-summaryGrowth','All artists · Stream growth']]){
 const el=document.getElementById(id),card=el?.closest('.stat');
 if(!card)continue;
 card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','View combined saved stream history');
 card.classList.add('svt-all-summary-history');
 card.addEventListener('click',()=>showAllHistory({scope:'all',title}).catch(console.error));
 card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click()}});
}
document.getElementById('all-recordings')?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){const element=event.target.closest('[data-all-history]');if(element){event.preventDefault();element.click();}}});
document.getElementById('all-recordings')?.addEventListener('click',event=>{
 const element=event.target.closest('[data-all-history]');
 if(!element)return;
 const index=Number(element.dataset.allHistory);
 const rows=state.mode==='discography'?state.discography:state.mode==='albums'?state.albums:state.rows;
 const row=rows[index];
 if(row)showAllHistory(row).catch(console.error);
});

// Public-data diagnostic for the automated browser checks: identify exactly
// which dated recordings still lack a verified like-for-like comparison.
window.svtAllAudit=()=>({
 date:state.group?.date,soloDate:state.solo?.date,period:state.period,
 tracks:state.rows.length,
 verified:state.rows.filter(row=>Number.isFinite(row.gain)).length,
 missing:state.rows.filter(row=>!Number.isFinite(row.gain)).map(row=>({
  id:row.id,title:row.title,scope:row.scope,release:row.date,total:row.streams
 }))
});
selectAllCategory(state.mode);
init();

})();
