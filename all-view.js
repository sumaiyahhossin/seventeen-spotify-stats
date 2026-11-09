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
const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayBefore=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)};
const monday=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)};
const firstOfMonth=date=>date.slice(0,7)+'-01';
const unique=arr=>[...new Set(arr)];
const artistIds=[['SEVENTEEN','7nqOGRxlXj7N2JYbgNEjYH'],['S.Coups',null],['Jeonghan','6KDLlQYeeqUe5OQ2JrdNzF'],['Joshua','74AwWFYdjQ3ER5vHO4H7b0'],['Jun','38Gn0ZVC8TQwuaMxBK1yRV'],['Hoshi','6nWKAdMv1BDq1zHfZzkdbR'],['Wonwoo','3rHcBT06Vb1XGVUWhDALZt'],['Woozi','4TdiASPlU3QdZvGQBothcQ'],['Dokyeom','7G1kUsPtQCdolV6CPwHmh2'],['Mingyu','5gUpo0BRmo6EOTbyU3z5Ay'],['The8','4DqFd6XE3dX4LWXHJVVpLk'],['Seungkwan','0Vb2DjojEYsasFpc3aTZb6'],['Vernon','2Y34b9AOK30zXgL7cAH4NG'],['Dino','5YaeXxzvqGNBCguELlKo6G'],['BSS','1uAT5bTSp6dWbNmixIUP5t'],['JxW','7GvlsjcgBrsE578yghOq7D'],['HxW','1EReYiseDwE51FzGm7EK9n'],['CxM','7kjuLdYbtTkWBToMu2ebZN'],['DxS','4wBjmEkWhY4T22q00CiF5V'],['V8',null],['Picheolin','3V2EC4dPYLgtbi0TtrB1RA'],['JxJ',null]];
const members=new Set(artistIds.slice(1,14).map(x=>x[0]));
const units=new Set(artistIds.slice(14).map(x=>x[0]));
const state={catalog:null,group:null,solo:null,media:null,followers:{},manifest:null,rows:[],albums:[],albumSpecs:[],snapshots:new Map(),page:0,limit:50,period:'overall'};
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
    if(release.title)row.releaseNames.add(release.title);
    const date=release.track_release_dates?.[id]||releaseDate;
    if(/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&(!row.date||date<row.date))row.date=date;
    const title=scope==='group'?snapshot.names?.[id]:state.media.tracks?.[id]?.title;
    const candidate=title||nameFromRelease(release,id,index);
    if(candidate&&(!row.title||title))row.title=normalizeTitle(candidate);
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
   if(!row.title)row.title=normalizeTitle(snapshot.names?.[id]||state.media.tracks?.[id]?.title||'');
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
async function snapshot(scope,date){
 const key=scope+'-'+date;
 if(state.snapshots.has(key))return state.snapshots.get(key);
 const current=state[scope];
 if(current.date===date)return current;
 if(!(scope==='group'?(state.manifest.dates||[]):(state.manifest.solo_dates||[])).includes(date))return null;
 let saved=null;
 try{saved=await read('data/history/'+scope+'-'+date+'.json')}catch{}
 if(!saved||saved.date!==date||!saved.tracks)saved=null;
 state.snapshots.set(key,saved);
 return saved;
}
function boundaryDate(scope,period){
 const current=state[scope].date;
 if(period==='daily')return dayBefore(current);
 if(period==='weekly')return dayBefore(monday(current));
 if(period==='monthly')return dayBefore(firstOfMonth(current));
 return null;
}
async function applyPeriod(){
 const rows=[...state.rows,...state.albums],period=state.period;
 if(period==='overall'){rows.forEach(row=>row.gain=null);return}
 const boundaries=await Promise.all(['group','solo'].map(async scope=>snapshot(scope,boundaryDate(scope,period))));
 const baselines={group:boundaries[0],solo:boundaries[1]};
 for(const row of rows){
  const ids=row.ids||[row.id],now=state[row.scope].tracks,previous=baselines[row.scope]?.tracks;
  const deltas=ids.map(id=>{
   const a=now?.[id],b=previous?.[id];
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
function artworkFor(row){
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
 const rows=artistStats().filter(a=>scope==='all'||(scope==='members'?members.has(a.name):units.has(a.name)));
 rows.sort((a,b)=>(b[metric]??-1)-(a[metric]??-1)||a.name.localeCompare(b.name));
 $('artistNote').textContent='Monthly listeners and streams: '+state.group.date+' (group), '+state.solo.date+' (solo/unit). Followers: separately verified. JxJ and V8 have no independent Spotify profile. Shared recordings may be credited to multiple profiles, but count once in the combined catalog.';
 $('artists').innerHTML=rows.map((a,i)=>
 '<tr><td><div class="svt-all-person">'+
 '<img class="svt-all-avatar artist-profile-photo" data-all-artist-photo="'+esc(a.name)+'" alt="'+esc(a.name)+' profile photo" loading="lazy">'+
 '<div class="svt-all-person-copy"><span class="svt-all-song">'+(a[metric]==null?'—':i+1)+'. '+esc(a.name)+'</span>'+
 '<div class="svt-all-sub">'+(a.name==='SEVENTEEN'?'Group':members.has(a.name)?'Member':'Unit')+
 ' · '+(a.recordings.size||0)+' recordings<span class="svt-all-mobile-selected"> · '+
 (metric==='listeners'?'Listeners':metric==='followers'?'Followers':'Streams')+': '+fmt(a[metric])+
 '</span></div></div></div></td><td class="svt-all-num">'+fmt(a.streams)+
 '</td><td class="svt-all-num">'+fmt(a.listeners)+'</td><td class="svt-all-num">'+fmt(a.followers)+'</td></tr>'
 ).join('')||'<tr><td colspan="4" class="svt-all-status">No artists found.</td></tr>';
 paintArtists();
}
function renderTracks(){
 const query=$('search').value.trim().toLowerCase(),owner=$('owner').value;
 const order=$('sort').value,period=state.period,isAlbum=$('viewType').value==='albums';
 const entire=isAlbum?state.albums:state.rows;
 const rows=entire.filter(r=>(owner==='all'||r.owners.includes(owner))&&
  (!query||[r.title,r.id||'',...r.owners,...r.releaseNames].join(' ').toLowerCase().includes(query)));
 const score=row=>period==='overall'?row.streams:row.gain;
 rows.sort((a,b)=>order==='title'?(a.title||'').localeCompare(b.title||''):
  order==='newest'?(b.date||'').localeCompare(a.date||''):
  order==='oldest'?(a.date||'9999').localeCompare(b.date||'9999'):
  (score(b)??-1)-(score(a)??-1)||String(a.title).localeCompare(String(b.title)));
 const totalPages=Math.max(1,Math.ceil(rows.length/state.limit));
 state.page=Math.min(state.page,totalPages-1);
 const shown=rows.slice(state.page*state.limit,(state.page+1)*state.limit);
 $('recordHeading').textContent=isAlbum?'Every album':'Every saved recording';
 $('gainTitle').textContent=period==='overall'?'Selected gain':period[0].toUpperCase()+period.slice(1)+' gain';
 $('coverage').textContent='Latest saved group: '+state.group.date+' · solo/unit: '+state.solo.date+
  ' · '+(period==='overall'?'Cumulative verified totals':period+' gains need a comparable saved date');
 $('recordCount').textContent=rows.length.toLocaleString()+(isAlbum?' albums':' recordings')+
  ' · '+entire.length.toLocaleString()+' '+(isAlbum?'total albums':'distinct recordings');
 $('recordings').innerHTML=shown.map(row=>{
  const name=esc(row.title||'Unidentified Spotify recording');
  const artwork=esc(artworkFor(row));
  const isTrack=validId(row.id||'');
  const link=isTrack?'<a class="svt-all-song" href="https://open.spotify.com/track/'+encodeURIComponent(row.id)+
   '" target="_blank" rel="noopener noreferrer">'+name+'</a>':'<span class="svt-all-song">'+name+'</span>';
  const sub=(isAlbum?row.owners.join(' · '):row.releaseNames[0]||'Release not documented')+
   (!isAlbum&&row.releaseNames.length>1?' · '+row.releaseNames.length+' releases':'')+
   (row.date?' · '+row.date:'');
  return '<tr><td><div class="svt-all-record"><span class="svt-all-art-holder">'+
   '<img class="svt-all-cover cover" data-cover-track="'+artwork+'" data-cover-name="'+name+
   '" data-cover-kind="'+(isAlbum?'album':'track')+'" alt="'+name+' cover" loading="lazy">'+
   '<span class="cover-placeholder" hidden></span></span>'+
   '<div class="svt-all-record-copy">'+link+'<div class="svt-all-sub">'+esc(sub)+
   '</div></div></div></td><td>'+esc(row.owners.join(' · '))+'</td><td>'+esc(row.date||'—')+
   '</td><td class="svt-all-num">'+fmt(row.streams)+'</td>'+
   '<td class="svt-all-num">'+(period==='overall'?'—':fmt(row.gain))+'</td></tr>';
 }).join('')||'<tr><td colspan="5" class="svt-all-status">No matching '+(isAlbum?'albums':'recordings')+'.</td></tr>';
 $('pageInfo').textContent=(state.page+1)+' / '+totalPages;
 $('prev').disabled=state.page===0;$('next').disabled=state.page+1>=totalPages;
 window.svtSharedMedia?.fillArtwork();
}
async function init(){
 try{
  const [catalog,group,solo,media,followers,manifest,admin,soloAlbumSpecs]=await Promise.all([
   read('data/catalog.json'),read('data/group.json'),read('data/solo.json'),
   read('data/solo-media.json'),read('data/solo-followers.json').catch(()=>({followers:{}})),
   read('data/manifest.json'),read('data/admin-releases.json').catch(()=>({releases:[]})),
   read('data/solo-albums.json')
  ]);
  state.catalog=catalog;state.group=group;state.solo=solo;state.media=media;state.followers=followers.followers||{};state.manifest=manifest;state.albumSpecs=soloAlbumSpecs;
  for(const release of admin.releases||[]){const list=catalog[release.scope];if(list&&!list.some(r=>r.key===release.key))list.push(release)}
  buildRows();
  for(const extra of admin.releases||[])if(extra.scope==='solo'&&extra.release_type==='album')
   state.albumSpecs.push({key:extra.key,displayName:extra.title,releaseDate:extra.release_date,owners:[extra.artist],tracks:extra.tracks});
  buildAlbums();
  const names=unique(state.rows.flatMap(r=>r.owners)).filter(x=>x!=='Unassigned solo/unit').sort((a,b)=>a.localeCompare(b));
  $('owner').innerHTML='<option value="all">All recordings</option>'+names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('');
  await applyPeriod();renderArtists();renderTracks();
 }catch(error){
  console.error('All view could not load saved sources',error);
  $('artists').innerHTML='<tr><td colspan="4" class="status">Artist data unavailable. Please try refreshing.</td></tr>';
  $('recordings').innerHTML='<tr><td colspan="5" class="status">Saved archive unavailable. Please try refreshing.</td></tr>';
  $('coverage').textContent='Unable to load a required saved source.';
 }
}
for(const id of ['artistMetric','artistScope'])$(id).addEventListener('change',renderArtists);
for(const id of ['search','owner','sort','viewType'])$(id).addEventListener(id==='search'?'input':'change',()=>{state.page=0;renderTracks()});
window.svtAllShown=()=>{if(state.rows.length){renderArtists();renderTracks()}};
window.addEventListener('svt-media-ready',()=>{if(state.rows.length){renderArtists();renderTracks()}});
$('period').addEventListener('change',async()=>{state.period=$('period').value;state.page=0;$('coverage').textContent='Checking saved calendar boundaries…';await applyPeriod();renderTracks()});
$('prev').addEventListener('click',()=>{state.page--;renderTracks();$('recordings').scrollIntoView({block:'nearest'})});
$('next').addEventListener('click',()=>{state.page++;renderTracks();$('recordings').scrollIntoView({block:'nearest'})});
init();

})();
