const $=s=>document.querySelector(s),fmt=n=>n==null?'—':Number(n).toLocaleString('en-US');
let tab='group',rank='tracks-overall',catalog={},current={},history={},dates=[],selection='latest';
const load=async p=>{try{const r=await fetch(p+'?v='+Date.now());return r.ok?await r.json():null}catch{return null}};
const idName={};
function buildNames(){for(const type of ['group','solo'])for(const item of catalog[type]||[]){const raw=(item.description||'').split(':').slice(1).join(':');const names=raw.split(',').map(x=>x.trim());item.tracks.forEach((id,i)=>{if(!idName[id])idName[id]=names[i]||id})}}
function typeDates(type){return dates.filter(d=>history[type+'-'+d]!==null)}
async function getDate(type,date){if(!date)return null;const key=type+'-'+date;if(!(key in history))history[key]=await load('data/history/'+key+'.json');return history[key]}
async function latest(type){if(current[type])return current[type];for(const d of dates){const s=await getDate(type,d);if(s)return s}return null}
async function selectedSnapshot(){return selection==='latest'?latest(tab):getDate(tab,selection)}
async function prior(s){if(!s)return null;for(const d of dates){if(d>=s.date)continue;const p=await getDate(tab,d);if(p)return p}return null}
function safeGain(s,p,id){if(!p||!s||!s.tracks||!p.tracks||s.tracks[id]==null||p.tracks[id]==null)return null;if((s.anomalies||[]).includes(id)||(p.anomalies||[]).includes(id))return null;const days=(Date.parse(s.date)-Date.parse(p.date))/86400000;if(days!==1)return null;const delta=s.tracks[id]-p.tracks[id];return delta>=0?delta:null}
function historicalKind(s,id){
 const name=(s?.names?.[id]||'').trim();
 if(!name)return 'track';
 if(/^SEVENTEEN TOTAL STREAMS$/i.test(name))return 'grand';
 if(/monthly\s+listeners?|followers?/i.test(name))return 'audience';
 if(/\btotal\s*:?$/i.test(name))return 'album';
 return 'track';
}
function isHistorical(s){return s?.source==='historical spreadsheet'}
function audienceValue(s,kind){
 if(!s)return null;
 if(!isHistorical(s)){
  const v=kind==='listeners'?(s.monthly_listeners??s.listeners):(s.followers);
  return Number.isFinite(Number(v))&&v!=null?Number(v):null;
 }
 const found=Object.keys(s.tracks).find(id=>{
  const name=s.names?.[id]||'';
  return kind==='listeners'?/monthly\s+listeners?/i.test(name):/followers?/i.test(name);
 });
 return found?s.tracks[found]:null;
}
function sheetRows(s,p){
 if(!s)return[];
 if(!isHistorical(s))return buildRows(s,p);
 const rows=[];
 for(const [id,value] of Object.entries(s.tracks)){
  const kind=historicalKind(s,id);
  if(kind==='grand'||kind==='audience')continue;
  const name=s.names?.[id]||id;
  rows.push({id,name,streams:value,gain:safeGain(s,p,id),kind});
 }
 return rows;
}
function isAlbumTitle(name){
 const n=String(name||'').toLowerCase();
 return /\balbum\b|\brepackage\b|\bmini\b|\bep\b/.test(n)&&!/\bsingle\b|\bost\b/.test(n);
}
function uniqueRows(rows){
 const seen=new Set();
 return rows.filter(row=>{
  const key=row.name.toLowerCase().replace(/[^a-z0-9]/g,'')+'|'+row.streams;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
function trackIds(s){
 const ids=Object.keys(s?.tracks||{}).filter(id=>!isHistorical(s)||historicalKind(s,id)==='track');
 if(!isHistorical(s))return ids;
 const seen=new Set();
 return ids.filter(id=>{
   const name=(s.names?.[id]||id).trim().toLowerCase().replace(/\s+/g,' ');
   const key=name+'|'+s.tracks[id];
   if(seen.has(key))return false;
   seen.add(key);
   return true;
 });
}
function buildRows(s,p){
 if(!s)return[];
 const daily=rank.endsWith('daily'),albums=rank.startsWith('albums');
 if(rank==='sheet')return sheetRows(s,p);
 let rows=[];
 if(albums&&isHistorical(s)){
   rows=Object.entries(s.tracks).filter(([id])=>historicalKind(s,id)==='album'&&isAlbumTitle(s.names[id])).map(([id,streams])=>({id,name:(s.names[id]||id).replace(/\s*Total\s*:?$/i,'').trim(),streams,gain:safeGain(s,p,id)}));
 }else if(albums){
   for(const item of catalog[tab]||[]){
     if(!isAlbumTitle(item.title))continue;
     const ids=[...new Set(item.tracks)];const present=ids.filter(id=>s.tracks[id]!=null);
     if(!present.length)continue;
     const complete=present.length===ids.length;
     const streams=present.reduce((a,id)=>a+s.tracks[id],0);
     const gains=ids.map(id=>safeGain(s,p,id));
     rows.push({name:item.title,streams:complete?streams:null,gain:complete&&gains.every(n=>n!=null)?gains.reduce((a,b)=>a+b,0):null});
   }
 }else{
   rows=trackIds(s).map(id=>({id,name:s.names?.[id]||idName[id]||id,streams:s.tracks[id],gain:safeGain(s,p,id)}));
 }
 rows=uniqueRows(rows).filter(r=>daily?r.gain!=null:r.streams!=null);
 rows.sort((a,b)=>daily?b.gain-a.gain:b.streams-a.streams);
 return rows;
}

const coverCache=new Map(),coverLookup=new Map();
const coverKey=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function buildCoverLookup(){
 for(const type of ['group','solo'])for(const item of catalog[type]||[]){
  const names=(item.description||'').split(':').slice(1).join(':').split(',').map(x=>x.trim());
  item.tracks.forEach((id,i)=>{const key=coverKey(names[i]);if(key&&/^[a-zA-Z0-9]{22}$/.test(id)&&!coverLookup.has(key))coverLookup.set(key,id)});
 }
}
function artworkTrack(row){
 const normalized=coverKey(row.name);
 if(!row.kind&& !rank.startsWith('albums') && ['super','f ck my life','fire','i don t understand but i luv u','dust','april shower'].includes(normalized))return 'album:1JBzeeCJ3axQMVkqWbKh0I';
 if(!row.kind&& !rank.startsWith('albums') && ['shining diamond','adore u','ah yeah','jam jam','20'].includes(normalized))return 'album:0H2K2JrzdvJcxBEPyxC2sl';
 if(row.kind==='album'||rank.startsWith('albums')){
  if(normalized.includes('fml'))return 'album:1JBzeeCJ3axQMVkqWbKh0I';
  if(normalized.includes('17 carat'))return 'album:0H2K2JrzdvJcxBEPyxC2sl';
 }
 const original=coverLookup.get(normalized);
 if(!row.kind&&!rank.startsWith('albums')&&original)return original;
 if(row.id&&/^[a-zA-Z0-9]{22}$/.test(row.id))return row.id;
 if(row.kind==='album'||rank.startsWith('albums')){
  const name=coverKey(row.name);
  const album=(catalog[tab]||[]).find(x=>{const title=coverKey(x.title);return title===name||(name.length>5&&title.includes(name))||(title.length>5&&name.includes(title))});
  return album?.tracks?.find(id=>/^[a-zA-Z0-9]{22}$/.test(id))||null;
 }
 return coverLookup.get(coverKey(row.name))||null;
}
function fillArtwork(){
 if(!('IntersectionObserver' in window))return;
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   observer.unobserve(entry.target);
   const img=entry.target,id=img.dataset.coverTrack;
   if(!coverCache.has(id))coverCache.set(id,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/'+(id.startsWith('album:')?'album/'+id.slice(6):'track/'+id))).then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null));
   coverCache.get(id).then(url=>{if(url&&img.isConnected){img.src=url;img.classList.add('loaded')}});
  }
 },{rootMargin:'180px'});
 document.querySelectorAll('img[data-cover-track]').forEach(img=>observer.observe(img));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let renderToken=0;
async function render(){const token=++renderToken;$('#ranking').innerHTML='<div class="empty">Loading saved statistics… ♡</div>';const s=await selectedSnapshot(),p=await prior(s);if(token!==renderToken)return;
 $('#status').textContent=s?(s.source==='historical spreadsheet'?'Historical spreadsheet snapshot':'Latest confirmed snapshot available'):'Waiting for first confirmed snapshot';$('#last').textContent=s?.captured_at?'Captured '+new Date(s.captured_at).toLocaleString():s?'Imported from spreadsheet':'—';$('#date').textContent=s?.date||'—';const ids=trackIds(s);$('#count').textContent=s?fmt(ids.length):'—';$('#listeners').textContent=fmt(audienceValue(s,'listeners'));$('#followers').textContent=fmt(audienceValue(s,'followers'));const listenerNow=audienceValue(s,'listeners'),listenerPrev=audienceValue(p,'listeners'),followerNow=audienceValue(s,'followers'),followerPrev=audienceValue(p,'followers');const showDelta=(selector,now,prev)=>{const n=now!=null&&prev!=null&&p&&s&&((Date.parse(s.date)-Date.parse(p.date))/86400000===1)?now-prev:null;$(selector).textContent=n==null?'Change from previous day unavailable':(n>=0?'+':'−')+fmt(Math.abs(n))+' vs previous day';};showDelta('#listenersChange',listenerNow,listenerPrev);showDelta('#followersChange',followerNow,followerPrev);const grandId=s&&isHistorical(s)?Object.keys(s.tracks).find(id=>historicalKind(s,id)==='grand'):null;$('#total').textContent=s?fmt(grandId?s.tracks[grandId]:ids.reduce((a,id)=>a+s.tracks[id],0)):'—';const gains=s?ids.map(id=>safeGain(s,p,id)).filter(n=>n!=null):[];const grandGain=grandId?safeGain(s,p,grandId):null;$('#gain').textContent=grandGain!=null?'+'+fmt(grandGain):s&&p&&gains.length===ids.length?'+'+fmt(gains.reduce((a,b)=>a+b,0)):'—';
 const q=$('#search').value.toLowerCase();const rows=buildRows(s,p).filter(x=>x.name.toLowerCase().includes(q));$('#ranking').innerHTML=rows.length?rows.slice(0,rank==='sheet'?500:250).map((r,i)=>`<div class="rank-row ${r.kind==='album'?'album-total-row':''}"><div class="track"><span class="place">${rank==='sheet'?(r.kind==='album'?'◆':'·'):String(i+1).padStart(2,'0')}</span><span class="cover-slot">${artworkTrack(r)?`<a class="cover-link" href="${artworkTrack(r).startsWith('album:')?'https://open.spotify.com/album/'+artworkTrack(r).slice(6):'https://open.spotify.com/track/'+artworkTrack(r)}" target="_blank" rel="noopener noreferrer" aria-label="Open on Spotify"><img class="cover" data-cover-track="${artworkTrack(r)}" alt="" loading="lazy"></a>`:`<span class="cover-placeholder">💎</span>`}</span><span class="track-name">${escapeHtml(r.name)}</span></div><div class="num">${fmt(rank.endsWith('daily')?r.gain:r.streams)}</div><div class="num change">${r.gain==null?'—':'+'+fmt(r.gain)}</div></div>`).join(''):'<div class="empty">No verified data for this ranking and date. ♡</div>';fillArtwork()}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;$('#tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render()});
$('#ranktabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;rank=b.dataset.rank;$('#ranktabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render()});
$('#search').addEventListener('input',render);$('#archiveDate').addEventListener('change',e=>{selection=e.target.value;render()});
(async()=>{catalog=await load('data/catalog.json')||{};buildNames();buildCoverLookup();[current.group,current.solo]=await Promise.all([load('data/group.json'),load('data/solo.json')]);const manifest=await load('data/manifest.json')||{dates:[]};dates=[...new Set([...(manifest.dates||[]),...['group','solo'].map(t=>current[t]?.date).filter(Boolean)])].sort().reverse();for(const d of dates){const o=document.createElement('option');o.value=d;o.textContent=d;$('#archiveDate').append(o)}render()})();
