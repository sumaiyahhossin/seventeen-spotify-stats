const $=s=>document.querySelector(s),fmt=n=>n==null?'—':Number(n).toLocaleString('en-US');
let artworkMap={tracks:{},albums:{}};let sortOrder='most';let tab='group',rank='tracks-overall',catalog={},current={},history={},dates=[],selection='latest';
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
function displayTrackName(name){
 const raw=String(name||'');
 const key=coverKey(raw);
 if(key==='gom'||key==='god of music')return 'God of Music';
 if(key==='golm'||key==='god of light music')return 'God of Light Music';
 if(key==='gom inst')return 'God of Music (Inst.)';
 if(key==='gom trot remix')return 'God of Music (Trot Remix)';
 if(key==='golm inst')return 'God of Light Music (Inst.)';
 return raw;
}
function sheetRows(s,p){
 if(!s)return[];
 if(!isHistorical(s))return trackIds(s).map(id=>({id,name:s.names?.[id]||idName[id]||id,streams:s.tracks[id],gain:safeGain(s,p,id),kind:'track'}));
 const rows=[];
 for(const [id,value] of Object.entries(s.tracks)){
  const kind=historicalKind(s,id);
  if(kind==='grand'||kind==='audience')continue;
  let name=s.names?.[id]||id;
  if(name==='247.0')name='247';
  if(/love\s*&\s*letter\s*repackage\s*new\s*tracks\s*total/i.test(name))name='Love & Letter Repackage Original Tracks Total:';
  rows.push({id,name:displayTrackName(name),streams:value,gain:safeGain(s,p,id),kind});
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
   rows=trackIds(s).map(id=>({id,name:displayTrackName((s.names?.[id]||idName[id]||id)==='247.0'?'247':s.names?.[id]||idName[id]||id),streams:s.tracks[id],gain:safeGain(s,p,id)}));
 }
 rows=uniqueRows(rows).filter(r=>daily?r.gain!=null:r.streams!=null);
 rows.sort((a,b)=>sortOrder==='least'?(daily?a.gain-b.gain:a.streams-b.streams):(daily?b.gain-a.gain:b.streams-a.streams));
 return rows;
}

const coverCache=new Map(),coverLookup=new Map(),releaseCoverLookup=new Map();
const releaseArtNames={'fml album':'FML','al1 album':'Al1','you make my day album':'You Make My Day',';[semicolon] album':'Semicolon','we make you album':'We Make You','24h single':'24H','24h mini album':'24H','fallin\\' flower single':'Fallin Flower','hitorijanai single':'Not Alone','an ode new tracks album':'An Ode','seventeenth heaven album':'Seventeenth Heaven'};
const releaseArtCache=new Map();
const releaseArtwork={
 'love letter repackage':'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02eb366517758754ca13a4adf5',
 'love letter repackage original tracks':'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02eb366517758754ca13a4adf5'
};
const coverKey=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function buildCoverLookup(){
 for(const type of ['group','solo'])for(const item of catalog[type]||[]){
  const names=(item.description||'').split(':').slice(1).join(':').split(',').map(x=>x.trim());
  const first=item.tracks.find(id=>/^[a-zA-Z0-9]{22}$/.test(id));
  if(first){const title=coverKey(item.title).replace(/\\b(album|mini|ep)\\b/g,'').trim();if(title&&!releaseCoverLookup.has(title))releaseCoverLookup.set(title,first)}
  item.tracks.forEach((id,i)=>{const key=coverKey(names[i]);if(key&&/^[a-zA-Z0-9]{22}$/.test(id)&&!coverLookup.has(key))coverLookup.set(key,id)});
 }
}
const originalReleaseSongs={
 'boys be album':['fronting','mansae','when i grow up','omg','rock'],
 'love & letter album':['chuck','pretty u','still lonely','hit song','say yes','drift away','love letter'],
 'love & letter repackage new tracks':['no f u n','very nice','healing','simple','space'],
 'going seventeen album':['beautiful','boomboom','boom boom','highlight','lean on me','fast pace','don t listen in secret','i don t know','smile flower'],
 'al1 album':['don t wanna cry','habit','if i','swimming fool','my i','crazy in love'],
 'teen, age album':['intro new world','change up','without you','clap','bring it','lilili yabbay','trauma','pinwheel','flower','rocket','hello','campfire','outro'],
 "director's cut album":['thinkin about you','thanks','run to you','falling for u'],
 'you make my day album':['oh my','holiday','come to me','what s good','moonwalker','our dawn is hotter than day'],
 'you make my dawn album':['good to me','home','hug','chilli','shhh','getting closer'],
 'an ode new tracks album':['hit','lie again','fear','let me hear you say','247','second life','network love','back it up','lucky','snap shoot'],
 'heng':['fearless','left right','i wish','my my','kidult','together'],
 ';[semicolon] album':['home run','do re mi','hey buddy','light a flame','ah love','all my love'],
 'your choice album':['heaven s cloud','ready to love','anyone','gam3 bo1','wave','same dream same mind same night'],
 'attacca album':['to you','rock with you','crush','pang','imperfect love','i can t run away','2 minus 1'],
 'face the sun album':['hot','don quixote','march','domino','shadow','bout you','if you leave me','ash'],
 'seventeenth heaven album':['sos','god of music','diamond days','back 2 back','monster','yawn','headliner'],
 'spill the feels album':['eyes on you','love money fame','1 to 13','candy','rain','water']
};
const originalReleaseLookup=new Map();
function buildOriginalReleaseLookup(){
 for(const [title,names] of Object.entries(originalReleaseSongs)){
  const item=(catalog.group||[]).find(x=>x.title===title);
  const id=item?.tracks?.find(x=>/^[a-zA-Z0-9]{22}$/.test(x));
  if(id)for(const name of names)originalReleaseLookup.set(coverKey(name),id);
 }
}
const originalJapaneseReleases={
 'call call call':'We Make You',
 'highlight japanese ver':'We Make You',
 'lean on me japanese ver':'We Make You',
 '20 japanese ver':'We Make You',
 'love letter japanese ver':'We Make You',
 'happy ending':'Happy Ending',
 'oh my japanese ver':'Happy Ending',
 'healing japanese ver':'Happy Ending',
 'fallin flower':'Fallin Flower',
 'good to me japanese ver':'Fallin Flower',
 'smile flower japanese ver':'Fallin Flower',
 '24h':'24H',
 'pinwheel japanese ver':'24H',
 '247 japanese ver':'24H',
 'chilli japanese ver':'24H',
 'together japanese ver':'24H',
 'hitorijanai':'Not Alone',
 'run to you japanese ver':'Not Alone',
 'home run japanese ver':'Not Alone',
 'power of love':'Power of Love',
 'home japanese ver':'Power of Love',
 'snap shoot japanese ver':'Power of Love',
 'dream':'DREAM',
 'rock with you japanese ver':'DREAM',
 'all my love japanese ver':'DREAM',
 'darl ing holiday ver':'DREAM',
 'ima even if the world ends tomorrow':'Always Yours',
 'sara sara':'Always Yours',
 'oh my':'You Make My Day',
 'holiday':'You Make My Day',
 'moonwalker':'You Make My Day',
 'do re mi':'Semicolon',
 'home run':'Semicolon',
 'all my love':'Semicolon'
};
function artworkTrack(row){
 const rawKey=coverKey(row.name);
 const isAlbum=row.kind==='album'||rank.startsWith('albums');
 if(!isAlbum&&originalJapaneseReleases[rawKey])return 'release:'+encodeURIComponent(originalJapaneseReleases[rawKey]);
 const exactKey=rawKey==='247'?'247 0':rawKey;
 const mapped=isAlbum?artworkMap.albums[exactKey]||artworkMap.albums[exactKey.replace(/\\btotal\\b/g,'').trim()]:artworkMap.tracks[exactKey];
 if(mapped?.id){
  const release=releaseArtNames[mapped.release];
  if(release)return 'release:'+encodeURIComponent(release);
  return 'track:'+mapped.id;
 }
 const normalized=coverKey(row.name).replace(/\\btotal\\b/g,'').trim();
 const originalRelease=originalReleaseLookup.get(normalized);
 if(row.kind!=='album'&&!rank.startsWith('albums')&&originalRelease)return 'track:'+originalRelease;
 if(row.kind==='album'||rank.startsWith('albums')){
  if(normalized.includes('love letter repackage'))return 'image:'+releaseArtwork['love letter repackage'];
  if(normalized.includes('we make you'))return 'track:31d4AK9HwMELTaoTZKVz5v';
  if(normalized.includes('heng'))return 'track:065yxZRBAsenRLZacB1uc2';
  if(normalized.includes('happy burstday'))return 'track:6E0o3c4mgb7K5DB2TXg4XX';
  if(normalized.includes('17 is right here'))return 'track:2UE9XGbAzicJIyo4bB6sqM';
 }
 if(normalized==='left right'||normalized==='left and right'||normalized==='left right ')return 'track:065yxZRBAsenRLZacB1uc2';
 if(normalized==='maestro')return 'track:2UE9XGbAzicJIyo4bB6sqM';
 if(normalized==='thunder')return 'track:6E0o3c4mgb7K5DB2TXg4XX';
 if(normalized==='call call call'||normalized==='call call call japanese ver')return 'track:31d4AK9HwMELTaoTZKVz5v';
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
  const simplified=name.replace(/\\b(album|mini|ep|total)\\b/g,'').trim();
  const exact=releaseCoverLookup.get(simplified);if(exact)return exact;
  const album=(catalog[tab]||[]).find(x=>{const title=coverKey(x.title);return title===name||(name.length>8&&title.includes(name))||(title.length>8&&name.includes(title))});
  return album?.tracks?.find(id=>/^[a-zA-Z0-9]{22}$/.test(id))||null;
 }
 return coverLookup.get(coverKey(row.name))||null;
}
function spotifyCover(id){
 if(!id)return Promise.resolve(null);
 const kind=id.startsWith('album:')?'album':'track';
 const value=id.replace(/^(album:|track:)/,'');
 const key=kind+':'+value;
 if(!coverCache.has(key))coverCache.set(key,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/'+kind+'/'+value)).then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null));
 return coverCache.get(key);
}
function fillArtwork(){
 const loadImage=img=>{
  const source=img.dataset.coverTrack;
  const fallback=img.dataset.coverFallback;
  const show=url=>{
   if(!url||!img.isConnected)return false;
   img.onerror=()=>{img.onerror=null;if(fallback&&source!==fallback)spotifyCover(fallback).then(next=>{if(next)img.src=next;else img.classList.remove('loaded')});else img.classList.remove('loaded')};
   img.src=url;img.classList.add('loaded');return true;
  };
  if(source.startsWith('image:')){show(source.slice(6));return}
  if(source.startsWith('release:')){
   const title=decodeURIComponent(source.slice(8));
   if(!releaseArtCache.has(title))releaseArtCache.set(title,fetch('https://itunes.apple.com/search?'+new URLSearchParams({term:'SEVENTEEN '+title,entity:'album',limit:'100',country:'US'})).then(r=>r.ok?r.json():null).then(data=>{
    const clean=t=>coverKey(t).replace(/\\b(ep|single|album|mini|the|1st|2nd|3rd)\\b/g,'').trim();
    const matches=(data?.results||[]).filter(x=>/seventeen/i.test(x.artistName||'')&&clean(x.collectionName)===clean(title));
    return matches[0]?.artworkUrl100?.replace('100x100bb','600x600bb')||null;
   }).catch(()=>null));
