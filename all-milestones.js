'use strict';
// Dedicated All milestone page. Original OT13 and Unit/Solo pages are unchanged.
const $=id=>document.getElementById(id);
const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameKey=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
const coverKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const format=d=>/^\d{4}-\d\d-\d\d$/.test(String(d||''))?
 new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'}):'—';
const days=(a,b)=>a&&b?Math.round((Date.parse(b)-Date.parse(a))/86400000):null;
const short=n=>n>=1e9?(n/1e9)+'B':(n/1e6)+'M';
const compact=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(n):'—';
const wide=(x,y)=>'<span class="wide-value">'+x+'</span><span class="narrow-value" aria-hidden="true">'+y+'</span>';
const thresholds=[100e6,200e6,300e6,400e6,500e6,600e6,700e6,800e6,900e6,1000e6];
const upcoming=[1e6,10e6,20e6,30e6,40e6,50e6,60e6,70e6,80e6,90e6,...thresholds];
const aliases=new Map([
 ['3Y0ZwgYVHuwbW0JGjsYodR','5W1bn5PzFgKok4GAZ1JUAw'],
 ['594CTGIIVVTitwRhQJcWgM','34wTGQ1yV5XtrSMR5dMLWY'],
 ['4iIx4KfhlrkWBw1nTBo313','4FTcJ9B6S2QXObqRr9UG8U']
]);
const canonical=id=>aliases.get(id)||id;
const milestoneAlias={
 lovemoneyfame:'lovemoneyfamefeatdjkhaled',
 world:'world',theworld:'world',
 leftandright:'leftandright',leftright:'leftandright',
 godofmusic:'godofmusic',gom:'godofmusic'
};
const groupDates={"g3":"2015-12-04","g4":"2016-02-12","g14":"2018-08-13","g17":"2019-05-19","g19":"2019-08-05","g21":"2019-12-01","g26":"2020-09-15","g30":"2021-07-30","g31":"2021-06-30","g34":"2022-04-15","g38":"2022-08-26","g40":"2022-12-08","g42":"2023-08-16","g45":"2023-09-01","g47":"2023-12-25","g48":"2024-02-16","g55":"2024-05-03","g57":"2024-10-18","g60":"2025-06-30","g61":"2025-07-14","g62":"2025-07-25","g63":"2025-10-10","g64":"2026-02-27","g7":"2016-07-04","g23":"2020-06-22","g24":"2020-08-24","g37":"2022-07-18","g44":"2023-08-23","g50":"2024-04-29","g51":"2024-04-29","g52":"2024-04-29","g53":"2024-04-29","g54":"2024-04-29","g1":"2015-05-29","g2":"2015-09-10","g5":"2016-04-25","g6":"2016-07-04","g8":"2016-12-05","g9":"2017-05-22","g10":"2017-11-06","g11":"2018-02-05","g12":"2018-05-30","g13":"2018-07-16","g16":"2019-01-21","g18":"2019-05-29","g20":"2019-09-16","g22":"2020-04-01","g25":"2020-09-09","g27":"2020-10-19","g28":"2021-04-21","g29":"2021-06-18","g32":"2021-10-22","g33":"2021-12-08","g35":"2022-05-27","g36":"2022-07-18","g39":"2022-11-09","g41":"2023-04-24","g43":"2023-08-23","g46":"2023-10-23","g49":"2024-04-29","g56":"2024-10-14","g58":"2024-11-27","g59":"2025-05-26"};
const state={rows:[],group:null,solo:null,previousGroup:null,previousSolo:null,
 evidence:{byName:{},byTrack:{}},media:{tracks:{},albums:{}},
 art:{tracks:{}},releaseDates:new Map(),owners:new Map(),view:'reached',
 covers:new Map(),viewReady:false};
const fetchJson=async path=>{const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()};
const safeFetch=p=>fetchJson(p).catch(()=>null);
function makeCatalog(catalog){
 for(const scope of ['group','solo']){
  for(const item of catalog[scope]||[]){
   const date=(scope==='group'?groupDates[item.key]:null)||item.release_date||item.releaseDate||null;
   const owner=scope==='group'?'SEVENTEEN':item.artist||'Unit/Solo';
   for(const raw of item.tracks||[]){
    if(!/^[a-zA-Z0-9]{22}$/.test(raw))continue;
    const id=canonical(raw),release=item.track_release_dates?.[raw]||date;
    if(release&&(!state.releaseDates.has(id)||release<state.releaseDates.get(id)))
     state.releaseDates.set(id,release);
    const owners=state.owners.get(id)||new Set();
    owners.add(owner);state.owners.set(id,owners);
   }
  }
 }
}
function buildNow(){
 const byId=new Map();
 const groupIds=state.group.canonical_track_ids||Object.keys(state.group.tracks||{});
 for(const id of groupIds){
  const value=state.group.tracks?.[id];
  if(!Number.isFinite(value)||value<0)continue;
  byId.set(id,{id,scope:'group',name:state.group.names?.[id]||state.media.tracks?.[id]?.title||id,
   value,owners:state.owners.get(id)||new Set(['SEVENTEEN'])});
 }
 for(const [raw,value] of Object.entries(state.solo.tracks||{})){
  if(!/^[a-zA-Z0-9]{22}$/.test(raw)||!Number.isFinite(value)||value<0)continue;
  const id=canonical(raw),name=state.media.tracks?.[raw]?.title||state.media.tracks?.[id]?.title||'';
  const existing=byId.get(id);
  if(existing){
   // Shared Spotify IDs or independently sourced aliases are the same recording.
   // Do not add the stream counts, even if future collectors observe slight differences.
   if(value!==existing.value)console.warn('Mirrored recording has mismatched snapshots',id,value,existing.value);
   for(const owner of state.owners.get(id)||[])existing.owners.add(owner);
   continue;
  }
  byId.set(id,{id,scope:'solo',name:name||id,value,owners:state.owners.get(id)||new Set(['Unit/Solo'])});
 }
 state.rows=[...byId.values()].map(row=>({...row,release:state.releaseDates.get(row.id)||null}));
 const groupCount=groupIds.filter(id=>Number.isFinite(state.group.tracks?.[id])).length;
 const soloCount=Object.keys(state.solo.tracks||{}).length;
 $('status').textContent='All '+state.rows.length+' distinct recordings · '+format(state.group.date)+
  ' · Group '+groupCount+' + Unit/Solo '+soloCount+' source records, shared recordings counted only once';
 if(state.rows.length!==406&&state.group.date==='2026-11-08'&&state.solo.date==='2026-11-08')
  console.warn('Unexpected combined recording count',state.rows.length);
}
function priorFor(row){
 const previous=row.scope==='group'?state.previousGroup:state.previousSolo;
 const latest=row.scope==='group'?state.group:state.solo;
 if(!previous||!latest||days(previous.date,latest.date)!==1)return null;
 const value=previous.tracks?.[row.id];
 return Number.isFinite(value)&&value<=row.value?value:null;
}
function evidenceFor(row,target){
 const direct=state.evidence.byTrack?.['track:'+row.id]?.[target];
 if(direct)return direct;
 const k=nameKey(row.name),key=milestoneAlias[k]||k;
 return state.evidence.byName?.['name:'+key]?.[target]||
  state.evidence.byName?.['name:'+k]?.[target]||null;
}
function visualName(row){
 const owners=[...row.owners].filter(o=>o&&o!=='SEVENTEEN');
 return row.scope==='group'? 'SEVENTEEN'+(owners.length?' · '+owners.join(', '):''):
  owners.length?owners.join(', '):'Unit/Solo';
}
async function coverUrl(row){
 const local=state.media.tracks?.[row.id]?.local;
 if(local&&row.scope==='solo')return local;
 const entry=state.art.tracks?.[coverKey(row.name)];
 let id=entry?.id||row.id;
 let type=entry?.id?'album':'track';
 if(!/^[a-zA-Z0-9]{22}$/.test(id||'')){id=row.id;type='track'}
 const key=type+':'+id;
 if(!state.covers.has(key)){
  state.covers.set(key,(async()=>{
   try{
    const r=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/'+type+'/'+id));
    const data=r.ok?await r.json():null;
    return data?.thumbnail_url||null;
   }catch{return null}
  })());
 }
 const url=await state.covers.get(key);
 return url||'';
}
function paintCovers(){
 document.querySelectorAll('.song-cover[data-spotify-id]').forEach(img=>{
  if(img.dataset.loaded==='1')return;
  img.dataset.loaded='1';
  const row=state.rows.find(r=>r.id===img.dataset.spotifyId);
  if(!row)return;
  coverUrl(row).then(url=>{
   if(img.isConnected&&url)img.src=url;
   else if(img.isConnected)img.style.opacity='.35';
  });
 });
}
function titleHtml(row,index){
 const source='<img class="song-cover" data-spotify-id="'+esc(row.id)+'" alt="" loading="lazy">';
 const link='<a href="https://open.spotify.com/track/'+encodeURIComponent(row.id)+'" target="_blank" rel="noopener noreferrer" class="song-title">'+esc(row.name)+'</a>';
 return '<div class="song-cell"><span class="song-rank">'+String(index+1).padStart(2,'0')+'</span>'+
  source+'<div class="song-meta">'+link+'<span class="song-release">'+esc(visualName(row))+
  (row.release?' · Released '+format(row.release):'')+'</span></div></div>';
}
function reachedRows(){
 const threshold=Number($('threshold').value),sort=$('sort').value,search=$('search').value.trim().toLowerCase();
 const rows=state.rows.filter(r=>r.value>=threshold&&
  (!search||r.name.toLowerCase().includes(search)||visualName(r).toLowerCase().includes(search)))
  .map(r=>{
   const e=evidenceFor(r,threshold);
   const date=e?.date||null;
   const elapsed=date&&r.release?days(r.release,date):null;
   return {...r,date,duration:elapsed!=null&&elapsed>=0?elapsed:null,
    source:e?.source||'',url:e?.url||''};
  });
 rows.sort((a,b)=>{
  if(sort==='name')return a.name.localeCompare(b.name,'en');
  if(sort==='release-newest'||sort==='release-oldest'){
   const x=a.release||'0000',y=b.release||'0000';
   return sort==='release-newest'?y.localeCompare(x):x.localeCompare(y);
  }
  if(sort==='fast'||sort==='slow'){
   if(a.duration==null&&b.duration==null)return b.value-a.value;
   if(a.duration==null)return 1;if(b.duration==null)return -1;
   return sort==='fast'?a.duration-b.duration:b.duration-a.duration;
  }
  const x=a.date||'',y=b.date||'';
  return sort==='earliest'?x.localeCompare(y)||b.value-a.value:y.localeCompare(x)||b.value-a.value;
 });
 $('rows').innerHTML=rows.map((r,i)=>{
  const reached=r.date?format(r.date):'Date not verified';
  const source=r.url?'<a class="milestone-source" target="_blank" rel="noopener noreferrer" href="'+esc(r.url)+'">Source</a>':'';
  const span=r.duration==null?'—':fmt(r.duration)+' days';
  return '<tr><td>'+titleHtml(r,i)+'</td>'+
   '<td data-label="MILESTONE REACHED"><span class="reached-value">'+wide(reached,r.date?format(r.date):'—')+'</span>'+
   (source?'<div class="song-release">'+source+'</div>':'')+'</td>'+
   '<td data-label="DAYS TO REACH"><span class="days-value">'+span+'</span></td></tr>';
 }).join('')||'<tr><td colspan="3">No combined recordings have reached this threshold.</td></tr>';
 const dated=rows.filter(r=>r.date).length;
 $('status').textContent=rows.length+' distinct recordings reached '+short(threshold)+' · '+
  dated+' documented milestone dates · '+(rows.length-dated)+' crossings without verified dates'+
  ' · OT13, Units & Solo combined without duplicate tracks';
 paintCovers();
}
function upcomingRows(){
 const threshold=Number($('upcomingThreshold').value),sort=$('upcomingSort').value,
  search=$('upcomingSearch').value.trim().toLowerCase();
 const rows=[];
 for(const r of state.rows){
  if(search&&!r.name.toLowerCase().includes(search)&&!visualName(r).toLowerCase().includes(search))continue;
  const target=upcoming.find(x=>r.value<x);
  if(!target||(threshold&&target!==threshold))continue;
  const prior=priorFor(r),gain=prior==null?null:r.value-prior,
   remaining=target-r.value,estimatedDays=gain>0?Math.ceil(remaining/gain):null;
  const date=estimatedDays!=null&&estimatedDays<36500?
   new Date(Date.parse((r.scope==='group'?state.group.date:state.solo.date)+'T12:00:00Z')+
    estimatedDays*86400000).toISOString().slice(0,10):null;
  rows.push({...r,target,gain,remaining,estimatedDays,expected:date});
 }
 rows.sort((a,b)=>{
  if(sort==='closest')return a.remaining-b.remaining||a.name.localeCompare(b.name);
  if(sort==='soonest')return (a.estimatedDays??Infinity)-(b.estimatedDays??Infinity)||a.remaining-b.remaining;
  if(sort==='streams')return b.value-a.value||a.name.localeCompare(b.name);
  if(sort==='name')return a.name.localeCompare(b.name);
  return a.target-b.target||b.value-a.value;
 });
 $('upcomingRows').innerHTML=rows.map((r,i)=>
  '<tr><td>'+titleHtml(r,i)+'</td>'+
  '<td data-label="NEXT MILESTONE"><span class="reached-value">'+short(r.target)+'</span></td>'+
  '<td data-label="STREAMS LEFT">'+wide(fmt(r.remaining),compact(r.remaining))+'</td>'+
  '<td data-label="DAILY GAIN">'+wide(r.gain==null?'—':'+'+fmt(r.gain),r.gain==null?'—':'+'+compact(r.gain))+'</td>'+
  '<td data-label="ESTIMATED ARRIVAL">'+wide(r.expected?format(r.expected):'—',
    r.expected?format(r.expected):'—')+'</td></tr>'
 ).join('')||'<tr><td colspan="5">No upcoming milestones match this filter.</td></tr>';
 const matched=rows.filter(r=>r.gain!=null).length;
 $('upcomingStatus').textContent=rows.length+' distinct recordings · Latest Group '+format(state.group.date)+
  ' · Unit/Solo '+format(state.solo.date)+' · '+matched+' verified consecutive-day gains · '+(rows.length-matched)+' missing comparisons';
 paintCovers();
}
function updateThresholds(){
 const max=Math.max(0,...state.rows.map(r=>r.value));
 const selectedReached=$('threshold').value,selectedUpcoming=$('upcomingThreshold').value;
 $('threshold').innerHTML=thresholds.filter(t=>t<=300e6||max>=t).map(t=>
  '<option value="'+t+'">'+short(t)+'</option>').join('');
 $('upcomingThreshold').innerHTML='<option value="0">All next milestones</option>'+
  upcoming.filter(t=>t<=400e6||max>=t).map(t=>'<option value="'+t+'">'+short(t)+'</option>').join('');
 if([...$('threshold').options].some(o=>o.value===selectedReached))$('threshold').value=selectedReached;
 if([...$('upcomingThreshold').options].some(o=>o.value===selectedUpcoming))$('upcomingThreshold').value=selectedUpcoming;
}
function setView(next){
 state.view=next==='upcoming'?'upcoming':'reached';
 $('reachedView').hidden=state.view!=='reached';$('upcomingView').hidden=state.view!=='upcoming';
 $('tabReached').setAttribute('aria-selected',String(state.view==='reached'));
 $('tabUpcoming').setAttribute('aria-selected',String(state.view==='upcoming'));
 try{sessionStorage.setItem('svt-all-milestone-selected-view',state.view)}catch{}
 if(state.view==='upcoming'&&state.viewReady)upcomingRows();
}
$('tabReached').addEventListener('click',()=>setView('reached'));
$('tabUpcoming').addEventListener('click',()=>setView('upcoming'));
for(const id of ['threshold','sort','search'])
 $(id).addEventListener(id==='search'?'input':'change',reachedRows);
for(const id of ['upcomingThreshold','upcomingSort','upcomingSearch'])
 $(id).addEventListener(id==='upcomingSearch'?'input':'change',upcomingRows);
const selectorKey='svt-all-milestones-filters-v1';
try{
 const selected=JSON.parse(sessionStorage.getItem(selectorKey)||'null');
 if(selected){
  for(const id of ['threshold','sort','search','upcomingThreshold','upcomingSort','upcomingSearch']){
   if(selected[id]!=null)$(id).value=selected[id];
  }
 }
 const selectedView=sessionStorage.getItem('svt-all-milestone-selected-view');
 if(selectedView==='upcoming')state.view='upcoming';
}catch{}
for(const id of ['threshold','sort','search','upcomingThreshold','upcomingSort','upcomingSearch']){
 $(id).addEventListener(id.includes('Search')||id==='search'?'input':'change',()=>{
  const fields={};
  for(const x of ['threshold','sort','search','upcomingThreshold','upcomingSort','upcomingSearch'])fields[x]=$(x).value;
  try{sessionStorage.setItem(selectorKey,JSON.stringify(fields))}catch{}
 });
}
setView(state.view);
async function init(){
 try{
  const [group,solo,catalog,media,art,evidence]=await Promise.all([
   fetchJson('data/group.json'),fetchJson('data/solo.json'),fetchJson('data/catalog.json'),
   fetchJson('data/solo-media.json'),safeFetch('data/artwork-map.json'),
   safeFetch('data/all-milestone-evidence.json')
  ]);
  state.group=group;state.solo=solo;state.media=media;
  state.art=art||{tracks:{}};state.evidence=evidence||{byName:{},byTrack:{}};
  makeCatalog(catalog);buildNow();
  updateThresholds();state.viewReady=true;
  reachedRows();upcomingRows();setView(state.view);
  const previousDay=date=>new Date(Date.parse(date+'T12:00:00Z')-86400000).toISOString().slice(0,10);
  const [pGroup,pSolo]=await Promise.all([
   safeFetch('data/history/group-'+previousDay(group.date)+'.json'),
   safeFetch('data/history/solo-'+previousDay(solo.date)+'.json')
  ]);
  state.previousGroup=pGroup;state.previousSolo=pSolo;
  upcomingRows();
 }catch(err){
  console.error('All milestone data error',err);
  $('status').textContent='Could not load the combined milestone snapshots. Refresh to try again.';
  $('rows').innerHTML='<tr><td colspan="3">Saved milestone data unavailable.</td></tr>';
  $('upcomingStatus').textContent='Combined streams unavailable.';
 }
}
init();