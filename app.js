const $=s=>document.querySelector(s),fmt=n=>n==null?'—':Number(n).toLocaleString('en-US');
let artworkMap={tracks:{},albums:{}};let sortOrder='most';let tab='group',rank='tracks-daily',rankType='tracks',catalog={},current={},history={},dates=[],selection='latest',period='week';
// Keep the visitor's exact view when the dashboard refreshes.
const viewStateKey='svt-dashboard-view-v2';
try{
 const saved=JSON.parse(sessionStorage.getItem(viewStateKey)||'null');
 if(saved){
  if(['group','solo'].includes(saved.tab))tab=saved.tab;
  if(['tracks','albums','discography'].includes(saved.rankType))rankType=saved.rankType;
  if(['daily','weekly','monthly','yearly','overall'].includes(saved.period))rank=rankType+'-'+saved.period;
  if(['most','least'].includes(saved.sortOrder))sortOrder=saved.sortOrder;
  if(saved.selection==='latest'||/^\\d{4}-\\d{2}-\\d{2}$/.test(saved.selection||''))selection=saved.selection;
 }
 if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
}catch(e){console.warn('Could not restore saved view',e)}
let savedScroll=0;
try{savedScroll=Number(JSON.parse(sessionStorage.getItem(viewStateKey)||'{}').scrollY)||0}catch{}
function saveView(){
 try{sessionStorage.setItem(viewStateKey,JSON.stringify({tab,rankType,period:$('#rankPeriod')?.value||'daily',sortOrder,selection,search:$('#search')?.value||'',scrollY:window.scrollY}))}catch{}
}
window.addEventListener('pagehide',saveView);
let scrollSavePending=false;
window.addEventListener('scroll',()=>{if(!scrollSavePending){scrollSavePending=true;requestAnimationFrame(()=>{scrollSavePending=false;saveView()})}},{passive:true});
const load=async p=>{try{const r=await fetch(p+'?v='+Date.now());return r.ok?await r.json():null}catch{return null}};
const idName={};
function buildNames(){
 // Artwork metadata is not a reliable track-ID title source: some artwork
 // entries reuse an album's first Spotify ID for several different songs.
 // Use catalog track order when the description has a complete track list.
 for(const type of ['group','solo'])for(const item of catalog[type]||[]){
  const raw=((item.description||'').match(/\(\d+\s+tracks?\)\s*:\s*(.*)$/i)||[])[1]||'';
  const names=[];
  // Split track lists only at commas outside parentheses (e.g. "LOVE, MONEY, FAME").
  let depth=0,part='';
  for(const ch of raw){if(ch==='(')depth++;else if(ch===')')depth=Math.max(0,depth-1);if(ch===','&&depth===0){names.push(part.trim());part='';}else part+=ch;}
  if(part.trim())names.push(part.trim());
  if(names.length!==item.tracks.length)continue;
  item.tracks.forEach((id,i)=>{if(names[i]&&!idName[id])idName[id]=names[i]});
 }
 // Spotify's official HAPPY BURSTDAY track order, absent from the source catalog description.
 const burstday=(catalog.group||[]).find(x=>x.title==='happy burstday album');
 const burstdayNames=['HBD','THUNDER','Bad Influence (Prod. by Pharrell Williams)','Skyfall (THE 8 Solo)','Fortunate Change (JOSHUA Solo)','99.9% (WONWOO Solo)','Raindrops (SEUNGKWAN Solo)','Damage (HOSHI Solo) (feat. Timbaland)','Shake It Off (MINGYU Solo)','Happy Virus (DK Solo)','Destiny (WOOZI Solo)','Shining Star (Vernon Solo)','Gemini (JUN Solo)','Trigger (DINO Solo)','Coincidence (JEONGHAN Solo)','Jungle (S.COUPS Solo)'];
 if(burstday?.tracks?.length===burstdayNames.length)burstday.tracks.forEach((id,i)=>{idName[id]=burstdayNames[i]});
 // Explicit names for catalog entries whose descriptions are missing or
 // malformed. These IDs are grounded in the corresponding release listings.
 const verifiedNames={
  '2UE9XGbAzicJIyo4bB6sqM':'MAESTRO',
  '469YeZRBzZw8AnNQvG5GRS':'CALL CALL CALL! (Korean Ver.)',
  '5NfUbEKgLTdUWHTcU7F56Q':'LOVE, MONEY, FAME (Sped Up Ver.)',
  '2kMUi2FZkuj8d4lNo3UtzY':'LOVE, MONEY, FAME - TAK Remix',
  '2LBoWyCgW1BBwNbtN61Ik6':'LOVE, MONEY, FAME (feat. DJ Khaled) - Timbaland Remix',
  '36LcCpAK7ColfpTTRNChhz':'LOVE, MONEY, FAME (feat. DJ Khaled) - Kenia OS Remix',
  '5Pqo2Fel77vnFY03uGFtiD':'Ready to Love',
  '6KfYVOicblNB8CaDZwbxiT':'Dirty Dancing (feat. JOSHUA, DK & DINO)',
  '0xZ4WU5UfctiSeETi6pMEo':'God of Light Music',
  '6P7m3AZlTUm39hkeAgQNMk':'Super (Workout Remix)',
  '3CEm0R0huTRT1IcxYhuTWv':'Candy',
  '5ZwXgb8dQuK1GC15s7tG5L':'Til My Fingers Bleed (with DINO, Duckwrth & Telle)'
 };
 Object.assign(idName,verifiedNames);
 // Preserve the proper display name for the Dirty Dancing remix.
 idName['6KfYVOicblNB8CaDZwbxiT']='Dirty Dancing (feat. JOSHUA, DK & DINO)';
}
const albumTitles={
 '17 carat album':'17 CARAT','boys be album':'BOYS BE','love & letter album':'LOVE & LETTER','love & letter repackage new tracks':'LOVE & LETTER (Repackage)','going seventeen album':'Going Seventeen','al1 album':'Al1','teen, age album':'TEEN, AGE',"director's cut album":"DIRECTOR'S CUT",'we make you album':'WE MAKE YOU','you make my day album':'YOU MAKE MY DAY','you make my dawn album':'YOU MADE MY DAWN','an ode new tracks album':'An Ode','heng':'Heng:garæ','24h mini album':'24H',';[semicolon] album':'; [Semicolon]','your choice album':'Your Choice','attacca album':'Attacca','face the sun album':'Face the Sun','sector 17 repackage album new tracks':'SECTOR 17','dream ep album':'DREAM','fml album':'FML','always yours new tracks album':'ALWAYS YOURS','always yours best album':'ALWAYS YOURS','seventeenth heaven album':'SEVENTEENTH HEAVEN','17 is right here best album':'17 IS RIGHT HERE','spill the feels album':'SPILL THE FEELS','love, money, fame remixes album':'LOVE, MONEY, FAME (Remixes)','shohikigen album':'消費期限 (Shohikigen)','happy burstday album':'HAPPY BURSTDAY','maestro remix single':'MAESTRO (Remixes)'
};
function albumDisplayName(name){
 const raw=String(name||''),n=raw.toLowerCase();
 if(n.includes('17 is right here'))return '17 IS RIGHT HERE — '+(n.includes('new tracks')?'New Tracks':n.includes('original tracks')?'Original Tracks':n.includes('best album')?'All Tracks':'All Tracks');
 if(n.includes('always yours'))return 'ALWAYS YOURS — '+(n.includes('new tracks')?'New Tracks':n.includes('original tracks')?'Original Tracks':'All Tracks');
 return albumTitles[n]||raw.replace(/\b(?:album|new tracks)\b/gi,'').replace(/\s+/g,' ').trim();
}
function catalogReleaseLabel(item){
 const name=String(item.title||'').toLowerCase(),count=(item.tracks||[]).length;
 if(name.includes('love & letter repackage'))return 'LOVE & LETTER (Repackage) — '+(count===5?'New Tracks':count===10?'All Catalogued Tracks':'Partial Track List');
 if(name.includes('sector 17 repackage'))return 'SECTOR 17 — '+(count===4?'New Tracks':count===9?'All Catalogued Tracks':'Partial Track List');
 if(name.includes('17 is right here'))return '17 IS RIGHT HERE — '+(count===4?'New Tracks (4)':count===1?'Additional Track (1)':count===2?'Additional Tracks (2)':'Additional Tracks ('+count+')')+' · Partial Collection';
 return albumDisplayName(item.title);
}
function unresolvedName(id){const n=idName[id];return !n||n===id||/^[A-Za-z0-9]{22}$/.test(n)}
function resolveMissingNames(s,p){
 if(!s||isHistorical(s)||!p||!isHistorical(p))return;
 const candidates=Object.keys(p.tracks).filter(k=>historicalKind(p,k)==='track');
 for(const id of Object.keys(s.tracks)){
  if(!unresolvedName(id))continue;
  const matches=candidates.filter(k=>{
   const delta=s.tracks[id]-p.tracks[k];
   return delta>=0&&delta<100000&&p.names?.[k];
  });
  if(matches.length!==1)continue;
  const name=p.names[matches[0]];
  if(name&&normTrackName(name))idName[id]=name;
 }
}
// Prefer archived Group titles; avoid hundreds of browser requests on startup.
function hydrateMissingNames(){return}
function restoreGroupNames(s,p){
 if(tab!=='group'||!s||isHistorical(s)||!p||!isHistorical(p))return;
 const old=Object.keys(p.tracks).filter(k=>historicalKind(p,k)==='track'&&p.names?.[k]);
 for(const id of Object.keys(s.tracks)){
  let key=p.tracks[id]!=null?id:null;
  if(!key){
   const same=old.filter(k=>{const d=s.tracks[id]-p.tracks[k];return d>=0&&d<100000});
   if(same.length===1)key=same[0];
  }
  if(key&&p.names[key])idName[id]=p.names[key];
 }
}
function typeDates(type){return dates.filter(d=>history[type+'-'+d]!==null)}
async function getDate(type,date){if(!date)return null;const key=type+'-'+date;if(!(key in history))history[key]=await load((type==='solo'?'':'data/history/')+key+'.json');return history[key]}
async function latest(type){if(current[type])return current[type];for(const d of dates.slice(0,14)){const snapshot=await getDate(type,d);if(snapshot)return snapshot}return null}
async function selectedSnapshot(){if(selection==='latest')return latest(tab);const exact=await getDate(tab,selection);if(exact||tab!=='solo')return exact;for(const d of dates.filter(d=>d<=selection).slice(0,14)){const saved=await getDate(tab,d);if(saved)return saved}return null}
async function prior(s){if(!s)return null;const yesterday=shifted(s.date,-1);return getDate(tab,yesterday)}
function normTrackName(name){return String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function comparablePrevious(s,p,id){
 if(p?.tracks?.[id]!=null){const a=normTrackName(s?.names?.[id]||idName[id]),b=normTrackName(p.names?.[id]);if(!a||!b||a===b)return {id,value:p.tracks[id]};}
 // Historical Excel rows may have legacy row IDs rather than Spotify track IDs.
 if(!isHistorical(s)&&isHistorical(p)){
  const name=normTrackName(s.names?.[id]||idName[id]);
  if(!name||name===normTrackName(id))return null;
  const candidates=Object.keys(p.tracks).filter(k=>historicalKind(p,k)==='track'&&normTrackName(p.names?.[k])===name&&p.tracks[k]<=s.tracks[id]);
  if(!candidates.length)return null;
  const best=candidates.sort((a,b)=>p.tracks[b]-p.tracks[a])[0];
  if(s.tracks[id]-p.tracks[best]>100000)return null;
  return {id:best,value:p.tracks[best]};
 }
 return null;
}
function safeGain(s,p,id){
 if(!p||!s||!s.tracks||!p.tracks||s.tracks[id]==null)return null;
 const prev=comparablePrevious(s,p,id);
 if(!prev||(s.anomalies||[]).includes(id)||(p.anomalies||[]).includes(prev.id))return null;
 const days=(Date.parse(s.date)-Date.parse(p.date))/86400000;
 if(days!==1)return null;
 const delta=s.tracks[id]-prev.value;
 // Large jumps at the boundary between spreadsheet and Spotify snapshots are
 // not reliable daily gains without independent verification.
 if(isHistorical(s)!==isHistorical(p)&&delta>2000000)return null;
 return delta>=0?delta:null;
}
function historicalKind(s,id){
 const name=(s?.names?.[id]||'').trim();
 if(!name)return 'track';
 if(/\bTOTAL STREAMS\s*$/i.test(name))return 'grand';
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
 const raw=String(name||'').trim(),key=coverKey(raw);
 if(/^[A-Za-z0-9]{22}$/.test(raw))return 'Unidentified Spotify track';
 const official={
  '20 0':'20','247 0':'247','gom':'God of Music','golm':'God of Light Music',
  'gom inst':'God of Music (Inst.)','gom trot remix':'God of Music (Trot Remix)',
  'golm inst':'God of Light Music (Inst.)',
  'f ck my life':'F*ck My Life','fuck my life':'F*ck My Life','super':'Super','hot':'HOT','thunder':'THUNDER','rock with you':'Rock with you',
  'very nice':'VERY NICE','maestro':'MAESTRO',"don't wanna cry":"Don't Wanna Cry",
  'darling':'Darl+ing','darl ing':'Darl+ing','shining diamond':'Shining Diamond',
  'adore u':'Adore U','left right':'Left & Right','ready to love':'Ready to love',
  'home run':'HOME;RUN','home':'Home','world':'_WORLD','shadow':'Shadow',
  'clap':'CLAP','fear':'Fear','hit':'HIT','mansae':'MANSAE','pretty u':'Pretty U',
  'oh my':'Oh My!','thanks':'THANKS','getting closer':'Getting Closer',
  'fighting':'Fighting (Feat. Lee Young Ji)','spell':'Spell',
  'sos':'SOS','247':'247','1 to 13':'1 TO 13','no f u n':'No F.U.N',
  'where love passed':'Where Love Passed','back 2 back':'Back 2 Back',
  'run to you japanese ver':'Run to You (Japanese Ver.)',
  'maestro japanese ver':'MAESTRO (Japanese Ver.)',
  'circles japanese ver':'Circles (Japanese Ver.)',
  'love money fame english ver':'LOVE, MONEY, FAME (English Ver.)',
  'oh my chinese ver':'Oh My! (Chinese Ver.)',
  'world feat anne marie':'_WORLD (feat. Anne-Marie)',
  'power of love holiday ver':'Power of Love (Holiday Ver.)',
  'power of love inst':'Power of Love (Inst.)',
  'hitorijanai korean ver':'Hitorijanai (Korean Ver.)',
  '24h korean ver':'24H (Korean Ver.)'
 };
 if(official[key])return official[key];
 if(/^[a-z0-9\s&+'’!?.:;,_()\-]+$/.test(raw)&&/[a-z]/.test(raw)&&raw===raw.toLowerCase())
  return raw.replace(/\b[a-z]/g,c=>c.toUpperCase()).replace(/\bAnd\b/g,'and').replace(/\bWith\b/g,'with');
 return raw;
}
function sheetRows(s,p,pp){
 if(!s)return[];
 if(!isHistorical(s))return trackIds(s).map(id=>({id,name:displayTrackName(s.names?.[id]||idName[id]||id),streams:s.tracks[id],gain:safeGain(s,p,id),change:dailyChange(s,p,pp,id),kind:'track'}));
 const rows=[];
 for(const [id,value] of Object.entries(s.tracks)){
  const kind=historicalKind(s,id);
  if(kind==='grand'||kind==='audience')continue;
  let name=s.names?.[id]||id;
  if(name==='247.0')name='247';
  if(/love\s*&\s*letter\s*repackage\s*new\s*tracks\s*total/i.test(name))name='Love & Letter Repackage New Tracks Total:';
  // Keep the source sheet's New Tracks/Original Tracks distinction intact.
  rows.push({id,name:displayTrackName(name),streams:value,gain:safeGain(s,p,id),change:dailyChange(s,p,pp,id),kind});
 }
 return rows;
}
function isAlbumTitle(name){
 const n=String(name||'').toLowerCase();
 if(/remix|ost|digital single|\bsingle\b/.test(n))return false;
 return /always yours|17 is right here|sector 17|love & letter repackage|director.s cut|\balbum\b|\brepackage\b|\bmini\b|\bep\b|\bheng\b|\bsemicolon\b|\bserenade\b/.test(n);
}
function uniqueRows(rows){
 const seen=new Set();
 return rows.filter(row=>{
  // Spotify may expose separate track IDs for the same recording. A title
  // alone is not enough to merge versions, and matching counts alone are
  // not enough either. Keep unidentified IDs distinct.
  const title=normTrackName(row.name);
  const hasVerifiedTitle=title&&title!==normTrackName(row.id||'');
  const key=(hasVerifiedTitle?title:(row.id||title))+'|'+row.streams;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
// Confirmed November 6 alias pairs: different catalog IDs carrying the
// same recording's cumulative stream count. Only collapse a pair while its
// saved values agree; never infer duplicates from matching numbers alone.
const groupStreamAliases=[["6I2tqFhk8tq69iursYxuxd","3g9z9amouOxjEZve1SpSTE"],["1Rrj7KyS2R6SP9CQMDJW1w","3nAUdBQxle8l1EeOxW3m0R"],["6LnEoRQKMcaFTR5UvaKuBy","4CAK2Dmo5YVGDQxs789pbx"],["1117juaaAkSIUsQxTmmcKM","2mFCN72V3rTq1BT4WWddIF"],["2UE9XGbAzicJIyo4bB6sqM","743yOACnWcrrijTnWdT5YN"],["4MTNimMDRyFZv37Thcktwa","6KNp9wSUGYhtbE33su6xZv"],["2kDrUAONMhG6CbDGBkhdrY","2TLzrymJ9lpH2wXp1ub5Aj"],["3I5W8iA8iZAyO62UVceK3F","2r3aqjJhVFc5JjQAaFKNdR"],["63jDEQCIg1YJLYeiqKJxFg","0C49m3uL232ZGOwrEZucxS"],["74rpBQDDUA116sss0a0Tiy","3bxt2gMvBO1Q1g0WZVOSdq"],["2UHaIBd2uiIFLZ9pgHMpJl","1GzYKagCh7jmdETXLcxT3H"]];
function trackIds(s){
 const ids=Object.keys(s?.tracks||{}).filter(id=>!isHistorical(s)||historicalKind(s,id)==='track');
 const seen=new Set();
 const redundant=new Set();
 if(!isHistorical(s))for(const [primary,alias] of groupStreamAliases){
  if(s.tracks[primary]!=null&&s.tracks[alias]!=null&&s.tracks[primary]===s.tracks[alias])
   redundant.add(alias);
 }
 return ids.filter(id=>{
   if(redundant.has(id))return false;
   const name=normTrackName(s.names?.[id]||idName[id]);
   // Never remove an unidentified Spotify track merely because its stream
   // count matches another song. Equal play counts do not prove duplication.
   // Only collapse rows whose verified normalized title AND count match.
   const key=(name&&name!==normTrackName(id)?name:id)+'|'+s.tracks[id];
   if(seen.has(key))return false;
   seen.add(key);
   return true;
 });
}
// The daily ranking compares two consecutive daily stream counts, not
// a daily stream count with zero. Missing days or values remain unavailable.
function dailyChange(s,p,pp,id){
 const today=safeGain(s,p,id);
 const matched=comparablePrevious(s,p,id);
 const yesterday=matched?safeGain(p,pp,matched.id):null;
 return today==null||yesterday==null?null:today-yesterday;
}
function sumDaily(s,p,ids){
 const gains=ids.map(id=>safeGain(s,p,id));
 return gains.every(n=>n!=null)?gains.reduce((a,b)=>a+b,0):null;
}
function discographyRows(s,p,pp,baseline){
 if(!s)return [];
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly');
 const rows=[];
 for(const item of catalog[tab]||[]){
  const ids=[...new Set(item.tracks||[])];
  if(!ids.length)continue;
  const streams=ids.every(id=>s.tracks?.[id]!=null)?ids.reduce((a,id)=>a+s.tracks[id],0):null;
  const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids);
  const previousGain=sumDaily(p,pp,ids);
  const albumTotalRow={name:catalogReleaseLabel(item),streams,gain,change:periodic?sumPeriodChange(s,baseline,ids):gain!=null&&previousGain!=null?gain-previousGain:null,kind:'album',releaseOrder:rows.length};
  for(const id of ids){
   if(s.tracks?.[id]==null)continue;
   const g=periodic?periodGain(s,baseline,id):safeGain(s,p,id);
   rows.push({id,name:displayTrackName(s.names?.[id]||idName[id]||id),streams:s.tracks[id],gain:g,change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id),kind:'track',releaseOrder:rows.length});
  }
  rows.push(albumTotalRow);
 }
 return rows;
}
function buildRows(s,p,pp,baseline){
 if(!s)return[];
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly'),albums=rank.startsWith('albums'),discography=rank.startsWith('discography');
 if(discography)return discographyRows(s,p,pp,baseline);
 let rows=[];
 if(albums&&isHistorical(s)){
   rows=Object.entries(s.tracks).filter(([id])=>historicalKind(s,id)==='album'&&isAlbumTitle(s.names?.[id])).map(([id,streams])=>({
     id,name:albumDisplayName((s.names[id]||id).replace(/\s*Total\s*:?$/i,'').trim()),streams,
     gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id)
   }));
 }else if(albums){
   for(const item of catalog[tab]||[]){
     if(!isAlbumTitle(item.title))continue;
     const ids=[...new Set(item.tracks)];
     const streams=ids.every(id=>s.tracks[id]!=null)?ids.reduce((a,id)=>a+s.tracks[id],0):null;
     const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids),yesterday=sumDaily(p,pp,ids);
     rows.push({name:catalogReleaseLabel(item),streams,gain,change:periodic?sumPeriodChange(s,baseline,ids):gain!=null&&yesterday!=null?gain-yesterday:null});
   }
 }else{
   rows=trackIds(s).map(id=>({
     id,name:displayTrackName((s.names?.[id]||idName[id]||id)==='247.0'?'247':s.names?.[id]||idName[id]||id),
     streams:s.tracks[id],gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id)
   }));
 }
 rows=uniqueRows(rows).filter(r=>albums||r.streams!=null);
 rows.sort((a,b)=>{const x=daily||periodic?a.gain:a.streams,y=daily||periodic?b.gain:b.streams;if(x==null)return y==null?0:1;if(y==null)return -1;return sortOrder==='least'?x-y:y-x});
 return rows;
}

const coverCache=new Map(),coverLookup=new Map(),releaseCoverLookup=new Map();
const releaseArtNames={'fml album':'FML','al1 album':'Al1','you make my day album':'YOU MAKE MY DAY',';[semicolon] album':'Semicolon','we make you album':'WE MAKE YOU','24h single':'24H','24h mini album':'24H','fallin\' flower single':'Fallin\' Flower','hitorijanai single':'Not Alone','an ode new tracks album':'An Ode'};
const releaseArtCache=new Map();
const persistentCoverKey='svt-artwork-cache-v2-original-releases';
let persistentCovers={};
try{persistentCovers=JSON.parse(localStorage.getItem(persistentCoverKey)||'{}')||{}}catch{}
function rememberCover(key,url){
 if(!url)return;
 persistentCovers[key]=url;
 try{localStorage.setItem(persistentCoverKey,JSON.stringify(persistentCovers))}catch{}
}

const releaseArtwork={
 'love letter repackage':'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02eb366517758754ca13a4adf5',
 'love letter repackage original tracks':'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02eb366517758754ca13a4adf5'
};
const coverKey=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function buildCoverLookup(){
 for(const type of ['group','solo'])for(const item of catalog[type]||[]){
  const names=(item.description||'').split(':').slice(1).join(':').split(',').map(x=>x.trim());
  const first=item.tracks.find(id=>/^[a-zA-Z0-9]{22}$/.test(id));
  if(first){const title=coverKey(item.title).replace(/\b(album|mini|ep)\b/g,'').trim();if(title&&!releaseCoverLookup.has(title))releaseCoverLookup.set(title,first)}
  item.tracks.forEach((id,i)=>{const key=coverKey(names[i]);if(key&&/^[a-zA-Z0-9]{22}$/.test(id)&&!coverLookup.has(key))coverLookup.set(key,id)});
 }
}
// Earliest catalog release wins. Best-of albums and anthology entries
// are intentionally excluded as original artwork sources.
const firstReleaseById=new Map(),firstReleaseByTitle=new Map();
function buildFirstReleaseCovers(){
 for(const item of catalog.group||[]){
  const title=coverKey(item.title);
  if(/best album|17 is right here|always yours best|remix/.test(title))continue;
  const ids=(item.tracks||[]).filter(id=>/^[A-Za-z0-9]{22}$/.test(id));
  if(!ids.length)continue;
  const art='track:'+ids[0];
  for(const id of ids)if(!firstReleaseById.has(id))firstReleaseById.set(id,art);
  const match=(item.description||'').match(/\(\d+\s+tracks?\)\s*:\s*(.*)$/i);
  if(!match)continue;
  const names=match[1].split(/,\s*/).map(coverKey);
  if(names.length!==ids.length)continue; // Avoid comma-in-title misalignment.
  names.forEach(name=>{
   if(name&&!firstReleaseByTitle.has(name))firstReleaseByTitle.set(name,art);
  });
 }
}
const originalReleaseSongs={
 '17 carat album':['shining diamond','adore u','ah yeah','jam jam','20'],
 'fml album':['f ck my life','super','fire','i don t understand but i luv u','dust','april shower'],
 'sector 17 repackage album new tracks':['circles','world','cheers','fallin flower korean ver'],
 '17 is right here best album':['maestro','lalali','spell','cheers to youth','call call call korean ver','happy ending korean ver','24h korean ver','not alone korean ver','power of love korean ver','dream korean ver','ima even if the world ends tomorrow korean ver','adore u inst'],
 'boys be album':['fronting','mansae','when i grow up','omg','rock'],
 'love & letter album':['chuck','pretty u','still lonely','hit song','say yes','drift away','adore u vocal team ver','monday to saturday hiphop team ver','shining diamond performance team ver','love letter'],
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
const japaneseOriginalArtwork={
 'call call call':'WE MAKE YOU',
 'happy ending':'Happy Ending',
 'fallin flower':'Fallin Flower',
 '24h':'24H',
 'hitorijanai':'Not Alone',
 'power of love':'Power of Love',
 'dream':'DREAM',
 'highlight japanese ver':'WE MAKE YOU',
 'lean on me japanese ver':'WE MAKE YOU',
 '20 japanese ver':'WE MAKE YOU',
 'love letter japanese ver':'WE MAKE YOU',
 'oh my japanese ver':'Happy Ending',
 'healing japanese ver':'Happy Ending',
 'good to me japanese ver':'Fallin Flower',
 'smile flower japanese ver':'Fallin Flower',
 'pinwheel japanese ver':'24H',
 '247 japanese ver':'24H',
 'chilli japanese ver':'24H',
 'together japanese ver':'24H',
 'run to you japanese ver':'Not Alone',
 'home run japanese ver':'Not Alone',
 'home japanese ver':'Power of Love',
 'snap shoot japanese ver':'Power of Love',
 'rock with you japanese ver':'DREAM',
 'all my love japanese ver':'DREAM',
 'darl ing holiday ver':'DREAM',
 'god of light music':'God of Light Music',
 'god of light music inst':'God of Light Music'
};
const spotifyTrackLinks=new Map();
function buildSpotifyTrackLinks(){
 spotifyTrackLinks.clear();
 for(const type of ['group','solo'])for(const item of catalog[type]||[]){
  const names=(item.description||'').split(':').slice(1).join(':').split(',').map(x=>x.trim());
  if(names.length!==item.tracks.length)continue;
  item.tracks.forEach((id,i)=>{
   const key=coverKey(names[i]);
   if(key&&/^[a-zA-Z0-9]{22}$/.test(id)&&!spotifyTrackLinks.has(key))spotifyTrackLinks.set(key,id);
  });
 }
}
function streamTrackUrl(row){
 if(row.kind==='album'||row.kind==='grand'||row.kind==='audience'||rank.startsWith('albums'))return null;
 const key=coverKey(row.name);
 const aliases={'god of music':'gom','god of light music':'golm','god of music inst':'gom inst','god of light music inst':'golm inst','god of music trot remix':'gom trot remix','20 0':'20','247 0':'247'};
 const normalized=aliases[key]||key;
 const mapped=artworkMap.tracks[normalized]||artworkMap.tracks[key];
 const id=(row.id&&/^[a-zA-Z0-9]{22}$/.test(row.id)?row.id:null)
   ||spotifyTrackLinks.get(normalized)||spotifyTrackLinks.get(key)
   ||(mapped?.id&&/^[a-zA-Z0-9]{22}$/.test(mapped.id)?mapped.id:null);
 return id?'https://open.spotify.com/track/'+id:null;
}
function artworkTrack(row){
 // Solo spreadsheet IDs are legacy row keys, not Spotify IDs. Resolve them
 // through the matching member/unit catalog release before using generic art.
 if(tab==='solo'){
  const name=coverKey(row.name).replace(/\btotal\b/g,'').trim();
  const albumRow=row.kind==='album'||rank.startsWith('albums');
  const entries=catalog.solo||[];
  if(albumRow){const match=entries.find(x=>coverKey(x.title)===name||coverKey(x.title).replace(/\b(album|ep|single|mini)\b/g,'').trim()===name);const id=match?.tracks?.find(v=>/^[a-zA-Z0-9]{22}$/.test(v));if(id)return 'track:'+id;}
  else {
   const matches=entries.flatMap(x=>{const names=((x.description||'').match(/\(\d+\s+tracks?\)\s*:\s*(.*)$/i)||[])[1];const titles=names?names.split(/,\s*/).map(coverKey):[];return (x.tracks||[]).map((id,i)=>({id,title:titles[i],artist:x.artist,release:x.title}))}).filter(x=>x.title===name&&/^[a-zA-Z0-9]{22}$/.test(x.id));
   if(matches.length)return 'track:'+matches[0].id;
   // A Spotify ID identifies its own single/album artwork reliably when
   // a solo song's release description has no complete track listing.
   if(row.id&&/^[a-zA-Z0-9]{22}$/.test(row.id))return 'track:'+row.id;
  }
 }

 const originalCoverKey=coverKey(row.name);
 // Resolve the FIRST release before any anthology track-ID artwork.
 // An anthology's Spotify track ID points to the anthology cover even when
 // the recording originally appeared years earlier.
 const isAlbumRow=row.kind==='album'||rank.startsWith('albums');
 const isAlternate=/\b(remix|instrumental|inst|sped up|slowed|workout|orchestra|feat|with|holiday|korean ver|chinese ver|japanese ver)\b/.test(originalCoverKey);
 // First release by song identity or catalog release, never anthology artwork.
 if(!isAlbumRow&&tab==='group'){
  const firstByTitle=firstReleaseByTitle.get(originalCoverKey);
  const firstById=firstReleaseById.get(row.id);
  if(firstByTitle&&!isAlternate)return firstByTitle;
  if(firstById&&!isAlternate)return firstById;
 }
 // Explicitly verified: all six FML songs debuted on April 24, 2023.
 // The anthology Spotify IDs must never determine their artwork.
 if(!isAlbumRow&&tab==='group'&&[
  'f ck my life','super','fire','i don t understand but i luv u',
  'dust','april shower'
 ].includes(originalCoverKey))return 'album:1JBzeeCJ3axQMVkqWbKh0I';
 if(!isAlbumRow&&tab==='group'){
  if(japaneseOriginalArtwork[originalCoverKey])return 'release:'+encodeURIComponent(japaneseOriginalArtwork[originalCoverKey]);
  const original=originalReleaseLookup.get(originalCoverKey);
  if(original&&!isAlternate)return 'track:'+original;
  // The Korean versions and anthology-exclusive recordings are first
  // released on 17 IS RIGHT HERE, not the earlier Japanese singles.
  if(['call call call korean ver','happy ending korean ver','fallin flower korean ver',
      '24h korean ver','not alone korean ver','power of love korean ver',
      'dream korean ver','ima even if the world ends tomorrow korean ver',
      'adore u inst'].includes(originalCoverKey))return 'release:'+encodeURIComponent('17 IS RIGHT HERE');
 }
 if(!isAlbumRow&&row.id&&/^[A-Za-z0-9]{22}$/.test(row.id))return 'track:'+row.id;
 // Release artwork must come from the release itself, not whichever track
 // happens to be first in the collector's list.
 if(row.kind==='album'||rank.startsWith('albums')){
  const k=originalCoverKey;
  const officialRelease=k.includes('17 is right here')?'17 IS RIGHT HERE':
   k.includes('heng')?'Heng:garæ':k.includes('al1')?'Al1':
   k.includes('you make my day')?'YOU MAKE MY DAY':
   k.includes('semicolon')?'Semicolon':
   k.includes('fallin flower')?'Fallin Flower':null;
  if(officialRelease)return 'release:'+encodeURIComponent(officialRelease);
 }

 if(!rank.startsWith('albums')&&row.kind!=='album'&&['fallin flower','good to me japanese ver','smile flower japanese ver'].includes(originalCoverKey))return 'release:'+encodeURIComponent('Fallin Flower');
 const originalKey=coverKey(row.name);
 const isAlbum=row.kind==='album'||rank.startsWith('albums');
 if(!isAlbum&&japaneseOriginalArtwork[originalKey])return 'release:'+encodeURIComponent(japaneseOriginalArtwork[originalKey]);
 // Prefer the artwork from the song's first original release over the
 // compilation/repackage entry in artwork-map.json.
 if(!isAlbum){
  const firstRelease=originalReleaseLookup.get(originalKey);
  if(firstRelease)return 'track:'+firstRelease;
 }
 // The anthology maps include re-recorded Spotify IDs for old songs.
 // Always use the verified first-release album for the original recording.
 // Keep Korean/Japanese versions and remixes distinct from the original.
 if(!isAlbum&&tab==='group'){
  const originalAlbum=originalReleaseLookup.get(originalKey);
  const alternateVersion=/\b(remix|inst|instrumental|korean ver|japanese ver|chinese ver|sped up|orchestra|workout|holiday|feat)\b/.test(originalKey);
  if(originalAlbum&&!alternateVersion)return 'track:'+originalAlbum;
 }
 const exactKey=originalKey==='247'?'247 0':originalKey;
 const mapped=isAlbum?artworkMap.albums[exactKey]||artworkMap.albums[exactKey.replace(/\btotal\b/g,'').trim()]:artworkMap.tracks[exactKey];
 if(mapped?.id){
  const release=releaseArtNames[mapped.release];
  if(release)return 'release:'+encodeURIComponent(release);
  return 'track:'+mapped.id;
 }
 const normalized=coverKey(row.name).replace(/\btotal\b/g,'').trim();
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
  const simplified=name.replace(/\b(album|mini|ep|total)\b/g,'').trim();
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
 if(!coverCache.has('fallback:'+id))coverCache.set('fallback:'+id,persistentCovers['fallback:'+id]?Promise.resolve(persistentCovers['fallback:'+id]):fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/'+kind+'/'+value)).then(r=>r.ok?r.json():null).then(d=>{const url=d?.thumbnail_url||null;rememberCover('fallback:'+id,url);return url}).catch(()=>null));
 return coverCache.get('fallback:'+id);
}
function fillArtwork(){
 const imgs=document.querySelectorAll('img[data-cover-track]');
 const setImage=(img,url)=>{if(!img.isConnected)return;if(!url){img.style.display='none';const placeholder=img.parentElement?.querySelector('.cover-placeholder');if(placeholder)placeholder.hidden=false;return}img.onload=()=>img.classList.add('loaded');img.onerror=()=>{img.style.display='none';const placeholder=img.parentElement?.querySelector('.cover-placeholder');if(placeholder)placeholder.hidden=false};img.src=url};
 const resolve=async(img)=>{
  const id=img.dataset.coverTrack, fallback=img.dataset.coverFallback;
  let url=null;
  try{
   if(id?.startsWith('image:'))url=id.slice(6);
   else if(id?.startsWith('release:')){
    const title=decodeURIComponent(id.slice(8));
    if(!releaseArtCache.has(title))releaseArtCache.set(title,persistentCovers['release:'+title]?Promise.resolve(persistentCovers['release:'+title]):fetch('https://itunes.apple.com/search?'+new URLSearchParams({term:'SEVENTEEN '+title,entity:'album',limit:'50'})).then(r=>r.ok?r.json():null).then(data=>{
     const matches=(data?.results||[]).filter(x=>/seventeen/i.test(x.artistName||'')&&coverKey(x.collectionName).replace(/\\b(ep|single|album)\\b/g,'').trim()===coverKey(title));
     const url=matches[0]?.artworkUrl100?.replace('100x100bb','600x600bb')||null;rememberCover('release:'+title,url);return url;
    }).catch(()=>null));
    url=await releaseArtCache.get(title);
   }else url=await spotifyCover(id);
   if(!url&&fallback)url=await spotifyCover(fallback);
   if(!url&&id?.startsWith('release:')){
    // Avoid a blank album cover if the exact release lookup is unavailable.
    const title=decodeURIComponent(id.slice(8));
    const fallbackId=releaseCoverLookup.get(coverKey(title));
    if(fallbackId)url=await spotifyCover('track:'+fallbackId);
   }
   setImage(img,url);
  }catch(e){console.warn('Artwork unavailable',id,e);if(fallback){try{setImage(img,await spotifyCover(fallback))}catch{setImage(img,null)}}else setImage(img,null)}
 };
 if(!('IntersectionObserver' in window)){imgs.forEach(resolve);return}
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);resolve(entry.target)}},{rootMargin:'240px'});
 imgs.forEach(img=>observer.observe(img));
}
const soloArtists=[["Jeonghan","6KDLlQYeeqUe5OQ2JrdNzF"],["Joshua","74AwWFYdjQ3ER5vHO4H7b0"],["Jun","38Gn0ZVC8TQwuaMxBK1yRV"],["Hoshi","6nWKAdMv1BDq1zHfZzkdbR"],["Wonwoo","3rHcBT06Vb1XGVUWhDALZt"],["Woozi","4TdiASPlU3QdZvGQBothcQ"],["DK","7G1kUsPtQCdolV6CPwHmh2"],["Mingyu","5gUpo0BRmo6EOTbyU3z5Ay"],["The8","4DqFd6XE3dX4LWXHJVVpLk"],["Seungkwan","0Vb2DjojEYsasFpc3aTZb6"],["Vernon","2Y34b9AOK30zXgL7cAH4NG"],["Dino","5YaeXxzvqGNBCguELlKo6G"],["BSS","1uAT5bTSp6dWbNmixIUP5t"],["JxW","7GvlsjcgBrsE578yghOq7D"],["HxW","1EReYiseDwE51FzGm7EK9n"],["CxM","7kjuLdYbtTkWBToMu2ebZN"],["DxS","4wBjmEkWhY4T22q00CiF5V"],["V8",null],["Picheolin","3V2EC4dPYLgtbi0TtrB1RA"],["Gilboard",null]];
const artistPhotoCache=new Map();
function renderArtistProfiles(){
 const area=$('#artistProfiles');
 if(!area)return;
 area.hidden=tab!=='solo';
 if(tab!=='solo')return;
 area.innerHTML='<div class="artist-profiles-heading">MEMBERS & UNITS <span>✦</span></div><div class="artist-profile-grid">'+soloArtists.map(([name,id])=>{
  const photo=id?'<img class="artist-profile-photo" data-artist-photo="'+id+'" alt="" loading="lazy">':'<span class="artist-profile-placeholder">💎</span>';
  const label='<span class="artist-profile-name">'+escapeHtml(name)+'</span>';
  return id?'<a class="artist-profile" href="https://open.spotify.com/artist/'+id+'" target="_blank" rel="noopener noreferrer" title="Open '+escapeHtml(name)+' on Spotify">'+photo+label+'</a>':'<div class="artist-profile">'+photo+label+'</div>';
 }).join('')+'</div>';
 area.querySelectorAll('img[data-artist-photo]').forEach(img=>{
  const id=img.dataset.artistPhoto;
  if(!artistPhotoCache.has(id))artistPhotoCache.set(id,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/artist/'+id))
    .then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null));
  artistPhotoCache.get(id).then(url=>{if(url&&img.isConnected){img.src=url;img.classList.add('loaded')}else if(img.isConnected){img.style.display='none';img.insertAdjacentHTML('afterend','<span class="artist-profile-placeholder">💎</span>')}})
 });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let renderToken=0;
// Compare equal-length windows: last 7 days vs preceding 7 days,
// current calendar month-to-date vs same days last month, and year-to-date
// vs the same elapsed days in the preceding year.
function utcDate(date){return new Date(date+'T00:00:00Z')}
function isoDate(d){return d.toISOString().slice(0,10)}
function shifted(date,days){const d=utcDate(date);d.setUTCDate(d.getUTCDate()+days);return isoDate(d)}
function shiftedMonth(date,n){const d=utcDate(date),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);const month=d.getUTCMonth();d.setUTCDate(day);if(d.getUTCMonth()!==month)d.setUTCDate(0);return isoDate(d)}
function shiftedYear(date,n){const d=utcDate(date),month=d.getUTCMonth();d.setUTCFullYear(d.getUTCFullYear()+n);if(d.getUTCMonth()!==month)d.setUTCDate(0);return isoDate(d)}
function periodDates(date){
 const d=utcDate(date),day=d.getUTCDay(),elapsed=(day+6)%7;
 if(rank.endsWith('weekly')){
  const start=shifted(date,-elapsed-1);
  return {start,prevStart:shifted(start,-7),prevEnd:shifted(date,-7),label:'week to date'};
 }
 if(rank.endsWith('monthly')){
  const first=isoDate(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)));
  const start=shifted(first,-1);
  return {start,prevStart:shiftedMonth(start,-1),prevEnd:shiftedMonth(date,-1),label:'month to date'};
 }
 if(rank.endsWith('yearly')){
  const first=isoDate(new Date(Date.UTC(d.getUTCFullYear(),0,1)));
  const start=shifted(first,-1);
  return {start,prevStart:shiftedYear(start,-1),prevEnd:shiftedYear(date,-1),label:'year to date'};
 }
 return null;
}
async function periodBaseline(s){
 if(!s||!(rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly')))return null;
 const range=periodDates(s.date);if(!range)return null;
 const available=new Set(dates);
 const get=async d=>available.has(d)?getDate(tab,d):null;
 const [start,prevStart,prevEnd]=await Promise.all([get(range.start),get(range.prevStart),get(range.prevEnd)]);
 return {start,prevStart,prevEnd,range};
}
function snapshotDelta(now,old,id){
 if(!now||!old||now.tracks?.[id]==null)return null;
 const prev=comparablePrevious(now,old,id);
 if(!prev||(now.anomalies||[]).includes(id)||(old.anomalies||[]).includes(prev.id))return null;
 const delta=now.tracks[id]-prev.value;
 // A cross-source jump is suspicious only for adjacent-day comparisons.
 // Year-to-date uses the real December 31 baseline: millions of legitimate
 // accumulated streams must not be rejected by a one-day safety threshold.
 const elapsedDays=(Date.parse(now.date)-Date.parse(old.date))/86400000;
 if(!Number.isFinite(elapsedDays)||elapsedDays<=0)return null;
 if(isHistorical(now)!==isHistorical(old)){
  if(elapsedDays<=2&&delta>100000)return null;
  // For long periods, require the same verified Spotify track ID or
  // an explicitly name-matched historical entry before comparing sources.
  if(prev.id!==id){
   const currentName=normTrackName(now.names?.[id]||idName[id]);
   const oldName=normTrackName(old.names?.[prev.id]);
   if(!currentName||currentName!==oldName)return null;
  }
 }
 return delta>=0?delta:null;
}
function periodGain(s,context,id){
 return context?.start?snapshotDelta(s,context.start,id):null;
}
function periodChange(s,context,id){
 if(!context?.start||!context.prevStart||!context.prevEnd)return null;
 const now=snapshotDelta(s,context.start,id);
 const previousId=comparablePrevious(s,context.prevEnd,id)?.id;
 // A previous period must cover the same elapsed number of days.
 const elapsed=(Date.parse(s.date)-Date.parse(context.start.date))/86400000;
 const previousElapsed=(Date.parse(context.prevEnd.date)-Date.parse(context.prevStart.date))/86400000;
 if(elapsed!==previousElapsed)return null;
 const before=previousId?snapshotDelta(context.prevEnd,context.prevStart,previousId):null;
 return now==null||before==null?null:now-before;
}
function sumPeriod(s,context,ids){const values=ids.map(id=>periodGain(s,context,id));return values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null}
function sumPeriodChange(s,context,ids){const values=ids.map(id=>periodChange(s,context,id));return values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null}
async function render(){const token=++renderToken;$('#ranking').innerHTML='<div class="empty">Loading saved streaming data…</div>';try{renderArtistProfiles();const s=await selectedSnapshot(),p=await prior(s),pp=await prior(p);const baseline=await periodBaseline(s);if(token!==renderToken)return;syncCalendar();restoreGroupNames(s,p);
 $('#date').textContent=s?.date||'—';const ids=s?trackIds(s):[];$('#count').textContent=s?fmt(ids.length):'—';$('#listeners').textContent=fmt(audienceValue(s,'listeners'));const currentFollowers=audienceValue(s,'followers'),previousFollowers=audienceValue(p,'followers');
 $('#followers').textContent=fmt(currentFollowers);
 if(currentFollowers==null)$('#followersChange').textContent=previousFollowers!=null?'Current count unavailable · previous count '+fmt(previousFollowers)+' ('+(p?.date||'')+')':'Current follower count unavailable';const listenerNow=audienceValue(s,'listeners'),listenerPrev=audienceValue(p,'listeners'),followerNow=audienceValue(s,'followers'),followerPrev=audienceValue(p,'followers');const showDelta=(selector,now,prev)=>{const n=now!=null&&prev!=null&&p&&s&&((Date.parse(s.date)-Date.parse(p.date))/86400000===1)?now-prev:null;$(selector).textContent=n==null?'Change from previous day unavailable':(n>=0?'+':'−')+fmt(Math.abs(n))+' vs previous day';};showDelta('#listenersChange',listenerNow,listenerPrev);
 if(currentFollowers!=null)showDelta('#followersChange',followerNow,followerPrev);const grandId=s&&isHistorical(s)?Object.keys(s.tracks).find(id=>historicalKind(s,id)==='grand'):null;$('#total').textContent=s?fmt(grandId?s.tracks[grandId]:ids.reduce((a,id)=>a+s.tracks[id],0)):'—';const gains=s?ids.map(id=>safeGain(s,p,id)).filter(n=>n!=null):[];const grandGain=grandId?safeGain(s,p,grandId):null;const completeGain=s&&p&&gains.length===ids.length;
 const hasVerifiedTotal=grandGain!=null||completeGain;
 const partialGain=!hasVerifiedTotal&&gains.length?gains.reduce((a,b)=>a+b,0):null;
 $('#gain').textContent=hasVerifiedTotal?'+'+fmt(grandGain!=null?grandGain:gains.reduce((a,b)=>a+b,0)):partialGain!=null?'+'+fmt(partialGain)+'*':'—';
 const gainNote=$('#gain').nextElementSibling;
 if(gainNote)gainNote.textContent=hasVerifiedTotal?'Verified gain for '+s.date+' versus '+p.date:partialGain!=null?'* Partial gain for '+s.date+': '+gains.length+' of '+ids.length+' tracks matched against '+(p?.date||'the previous snapshot')+'. NOT the full daily total.':'Daily gain unavailable for '+(s?.date||'this date')+' — waiting for two comparable consecutive snapshots.';

 $('#order').hidden=rank.startsWith('discography');const q=$('#search').value.toLowerCase();const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly'),discography=rank.startsWith('discography'),periodLabel=rank.endsWith('weekly')?'WEEKLY':rank.endsWith('monthly')?'MONTHLY':'YEARLY';const headers=document.querySelectorAll('.table-head span');headers[1].textContent=daily?'DAILY STREAMS ADDED':periodic?periodLabel+' STREAMS ADDED':'TOTAL STREAMS';headers[2].textContent=daily?'VS PREVIOUS DAY':periodic?'VS PREVIOUS PERIOD':'DAILY GAIN';document.querySelector('.table-head').classList.remove('period-ranking');$('#ranking').classList.remove('period-ranking');const rows=buildRows(s,p,pp,baseline).filter(x=>discography||x.name.toLowerCase().includes(q));$('#ranking').innerHTML=rows.length?rows.slice(0,discography?1000:250).map((r,i)=>`<div class="rank-row ${r.kind==='album'?'album-total-row':''}"><div class="track"><span class="place">${discography?(r.kind==='album'?'◆':'·'):String(i+1).padStart(2,'0')}</span>${discography&&r.kind!=='album'?'':`<span class="cover-slot">${artworkTrack(r)?`<img class="cover" data-cover-track="${artworkTrack(r)}" data-cover-fallback="${artworkMap.tracks[coverKey(r.name)]?.id||artworkMap.albums[coverKey(r.name)]?.id||''}" alt="" loading="lazy"><span class="cover-placeholder" hidden>💎</span>`:`<span class="cover-placeholder">💎</span>`}</span>`}${streamTrackUrl(r)?`<a class="track-name track-stream-link" data-track-name-id="${r.id||''}" href="${streamTrackUrl(r)}" target="_blank" rel="noopener noreferrer" title="Stream ${escapeHtml(r.name)} on Spotify">${escapeHtml(r.name)}</a>`:`<span class="track-name" data-track-name-id="${r.id||''}">${escapeHtml(r.name)}</span>`}</div><div class="num">${periodic&&r.gain!=null?"+":""}${fmt(daily||periodic?r.gain:r.streams)}</div><div class="num change ${(daily||periodic?r.change:r.gain)<0?'negative':''}">${(daily||periodic?r.change:r.gain)==null?'—':((daily||periodic?r.change:r.gain)>=0?'+':'−')+fmt(Math.abs(daily||periodic?r.change:r.gain))}</div></div>`).join('') :'<div class="empty">'+(!s?'No saved data is available for this category.':periodic?'No comparable saved snapshots for this period. Try another date.':'No matching entries found.')+'</div>';fillArtwork()}catch(error){console.error('Dashboard render failed',error);if(token===renderToken)$('#ranking').innerHTML='<div class="empty">Unable to display this snapshot. Please select another saved date or refresh.</div>'}}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;$('#tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render()});
function syncRank(){rank=rankType+'-'+$('#rankPeriod').value;render()}
$('#rankCategory').addEventListener('click',e=>{const button=e.target.closest('button[data-type]');if(!button)return;rankType=button.dataset.type;$('#rankCategory').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));syncRank()});
$('#rankPeriod').addEventListener('change',syncRank);

$('#order').addEventListener('change',e=>{sortOrder=e.target.value;render()});
$('#search').addEventListener('input',render);function availableDates(){return [...new Set([...dates,...(current[tab]?.date?[current[tab].date]:[])])].filter(Boolean).sort()}
function navigateDate(step){
 const available=availableDates(),today=selection==='latest'?(current[tab]?.date||available.at(-1)):selection;
 let i=available.indexOf(today);
 if(i<0)i=available.findIndex(d=>d>today);
 if(i<0)i=available.length;
 const target=available[Math.max(0,Math.min(available.length-1,i+step))];
 if(target){selection=target;syncCalendar();render()}
}
function syncCalendar(){
 const available=availableDates(),date=selection==='latest'?(current[tab]?.date||available.at(-1)):selection;
 const picker=$('#archiveDate');
 if(!picker)return;
 picker.value=date||'';
 picker.min=available[0]||'';picker.max=available.at(-1)||'';
 $('#prevDate').disabled=!date||available.indexOf(date)<=0;
 $('#nextDate').disabled=!date||available.indexOf(date)>=available.length-1;
 $('#dateNotice').textContent=selection==='latest'?'Latest confirmed snapshot':'Saved snapshot · '+(date||'');
}
$('#prevDate').addEventListener('click',()=>navigateDate(-1));
$('#nextDate').addEventListener('click',()=>navigateDate(1));
$('#latestDate').addEventListener('click',()=>{selection='latest';syncCalendar();render()});
$('#archiveDate').addEventListener('change',e=>{
 const requested=e.target.value,available=availableDates();
 if(!requested||!available.length)return;
 const target=available.includes(requested)?requested:available.reduce((best,d)=>Math.abs(Date.parse(d)-Date.parse(requested))<Math.abs(Date.parse(best)-Date.parse(requested))?d:best);
 selection=target;syncCalendar();render();
});
(async()=>{
 try{
  const saved=JSON.parse(sessionStorage.getItem(viewStateKey)||'null');
  if(saved){
   $('#rankPeriod').value=['daily','weekly','monthly','yearly','overall'].includes(saved.period)?saved.period:'daily';
   $('#order').value=sortOrder;
   $('#search').value=saved.search||'';
   $('#tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
   $('#rankCategory').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.type===rankType));
  }
 }catch{}
 [catalog,artworkMap]=await Promise.all([load('data/catalog.json'),load('data/artwork-map.json')]);catalog=catalog||{};artworkMap=artworkMap||{tracks:{},albums:{}};buildNames();buildCoverLookup();buildFirstReleaseCovers();buildOriginalReleaseLookup();buildSpotifyTrackLinks();[current.group,current.solo]=await Promise.all([load('data/group.json'),load('data/solo.json')]);const manifest=await load('data/manifest.json')||{dates:[]};dates=[...new Set([...(manifest.dates||[]),...['group','solo'].map(t=>current[t]?.date).filter(Boolean)])].sort().reverse();syncCalendar();await render();
 requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,savedScroll)));
 // Reload live stream data every five minutes without losing the current view.
 setInterval(()=>{saveView();window.location.reload()},300000);
})();
