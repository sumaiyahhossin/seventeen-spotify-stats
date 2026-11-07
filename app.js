const $=s=>document.querySelector(s),fmt=n=>n==null?'—':Number(n).toLocaleString('en-US');
let artworkMap={tracks:{},albums:{}};let sortOrder='most';let tab='group',rank='tracks-daily',rankType='tracks',catalog={},current={},history={},dates=[],selection='latest',period='week';
const load=async p=>{try{const r=await fetch(p+'?v='+Date.now());return r.ok?await r.json():null}catch{return null}};
const idName={};
function buildNames(){
 for(const type of ['group','solo'])for(const item of catalog[type]||[]){
  const raw=((item.description||'').match(/\(\d+\s+tracks?\)\s*:\s*(.*)$/i)||[])[1]||'';
  // A comma inside a song title is not a separator. Do not shift every
  // subsequent track name when the list is incomplete or ambiguous.
  const names=raw.split(/,\s*/).map(x=>x.trim());
  if(names.length!==item.tracks.length)continue;
  item.tracks.forEach((id,i)=>{if(names[i]&&!idName[id])idName[id]=names[i]});
 }
}
const albumTitles={
 '17 carat album':'17 CARAT','boys be album':'BOYS BE','love & letter album':'LOVE & LETTER','love & letter repackage new tracks':'LOVE & LETTER (Repackage)','going seventeen album':'Going Seventeen','al1 album':'Al1','teen, age album':'TEEN, AGE',"director's cut album":"DIRECTOR'S CUT",'we make you album':'WE MAKE YOU','you make my day album':'YOU MAKE MY DAY','you make my dawn album':'YOU MADE MY DAWN','an ode new tracks album':'An Ode','heng':'Heng:garæ','24h mini album':'24H',';[semicolon] album':'; [Semicolon]','your choice album':'Your Choice','attacca album':'Attacca','face the sun album':'Face the Sun','sector 17 repackage album new tracks':'SECTOR 17','dream ep album':'DREAM','fml album':'FML','always yours new tracks album':'ALWAYS YOURS','always yours best album':'ALWAYS YOURS','seventeenth heaven album':'SEVENTEENTH HEAVEN','17 is right here best album':'17 IS RIGHT HERE','spill the feels album':'SPILL THE FEELS','love, money, fame remixes album':'LOVE, MONEY, FAME (Remixes)','shohikigen album':'消費期限 (Shohikigen)','happy burstday album':'HAPPY BURSTDAY','maestro remix single':'MAESTRO (Remixes)'
};
function albumDisplayName(name){return albumTitles[String(name||'').toLowerCase()]||name.replace(/\b(?:album|new tracks)\b/gi,'').replace(/\s+/g,' ').trim()}
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
async function getDate(type,date){if(!date)return null;const key=type+'-'+date;if(!(key in history))history[key]=await load('data/history/'+key+'.json');return history[key]}
async function latest(type){if(current[type])return current[type];for(const d of dates){const s=await getDate(type,d);if(s)return s}return null}
async function selectedSnapshot(){return selection==='latest'?latest(tab):getDate(tab,selection)}
async function prior(s){if(!s)return null;for(const d of dates){if(d>=s.date)continue;const p=await getDate(tab,d);if(p)return p}return null}
function normTrackName(name){return String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function comparablePrevious(s,p,id){
 if(p?.tracks?.[id]!=null)return {id,value:p.tracks[id]};
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
 const official={
  '20 0':'20','247 0':'247','gom':'God of Music','golm':'God of Light Music',
  'gom inst':'God of Music (Inst.)','gom trot remix':'God of Music (Trot Remix)',
  'golm inst':'God of Light Music (Inst.)',
  'super':'Super','hot':'HOT','thunder':'THUNDER','rock with you':'Rock with you',
  'very nice':'VERY NICE','maestro':'MAESTRO',"don't wanna cry":"Don't Wanna Cry",
  'darling':'Darl+ing','darl ing':'Darl+ing','shining diamond':'Shining Diamond',
  'adore u':'Adore U','left right':'Left & Right','ready to love':'Ready to love',
  'home run':'HOME;RUN','home':'Home','world':'_WORLD','shadow':'Shadow',
  'clap':'CLAP','fear':'Fear','hit':'HIT','mansae':'MANSAE','pretty u':'Pretty U',
  'oh my':'Oh My!','thanks':'THANKS','getting closer':'Getting Closer',
  'fighting':'Fighting (Feat. Lee Young Ji)','spell':'Spell'
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
  if(/love\s*&\s*letter\s*repackage\s*new\s*tracks\s*total/i.test(name))name='Love & Letter Repackage Original Tracks Total:';
  if(/sector\s*17\s*new\s*tracks\s*total/i.test(name))name=name.replace(/New Tracks/i,'Original Tracks');
  rows.push({id,name:displayTrackName(name),streams:value,gain:safeGain(s,p,id),change:dailyChange(s,p,pp,id),kind});
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
 const seen=new Set();
 const namedValues=new Set(ids.filter(id=>normTrackName(s.names?.[id]||idName[id])!==normTrackName(id)).map(id=>s.tracks[id]));
 return ids.filter(id=>{
   const name=normTrackName(s.names?.[id]||idName[id]);
   // The catalog has alternate Spotify IDs for the same recordings; some
   // aliases have no title and exactly repeat a named recording's count.
   if(!isHistorical(s)&&(!name||name===normTrackName(id))&&namedValues.has(s.tracks[id]))return false;
   const key=(name||id)+'|'+s.tracks[id];
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
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly');
 const rows=[];
 for(const item of catalog[tab]||[]){
  const ids=[...new Set(item.tracks||[])];
  if(!ids.length)continue;
  const streams=ids.every(id=>s.tracks?.[id]!=null)?ids.reduce((a,id)=>a+s.tracks[id],0):null;
  const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids);
  const previousGain=sumDaily(p,pp,ids);
  rows.push({name:albumDisplayName(item.title),streams,gain,change:gain!=null&&previousGain!=null&&!periodic?gain-previousGain:null,kind:'album',releaseOrder:rows.length});
  for(const id of ids){
   if(s.tracks?.[id]==null)continue;
   const g=periodic?periodGain(s,baseline,id):safeGain(s,p,id);
   rows.push({id,name:displayTrackName(s.names?.[id]||idName[id]||id),streams:s.tracks[id],gain:g,change:dailyChange(s,p,pp,id),kind:'track',releaseOrder:rows.length});
  }
 }
 return rows;
}
function buildRows(s,p,pp,baseline){
 if(!s)return[];
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly'),albums=rank.startsWith('albums'),discography=rank.startsWith('discography');
 if(discography)return discographyRows(s,p,pp,baseline);
 let rows=[];
 if(albums&&isHistorical(s)){
   rows=Object.entries(s.tracks).filter(([id])=>historicalKind(s,id)==='album'&&isAlbumTitle(s.names[id])).map(([id,streams])=>({
     id,name:(s.names[id]||id).replace(/\s*Total\s*:?$/i,'').trim(),streams,
     gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),change:dailyChange(s,p,pp,id)
   }));
 }else if(albums){
   for(const item of catalog[tab]||[]){
     if(!isAlbumTitle(item.title))continue;
     const ids=[...new Set(item.tracks)];
     if(!ids.every(id=>s.tracks[id]!=null))continue;
     const streams=ids.reduce((a,id)=>a+s.tracks[id],0);
     const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids),yesterday=sumDaily(p,pp,ids);
     rows.push({name:albumDisplayName(item.title),streams,gain,change:gain!=null&&yesterday!=null?gain-yesterday:null});
   }
 }else{
   rows=trackIds(s).map(id=>({
     id,name:displayTrackName((s.names?.[id]||idName[id]||id)==='247.0'?'247':s.names?.[id]||idName[id]||id),
     streams:s.tracks[id],gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),change:dailyChange(s,p,pp,id)
   }));
 }
 rows=uniqueRows(rows).filter(r=>r.streams!=null);
 rows.sort((a,b)=>{const x=daily||periodic?a.gain:a.streams,y=daily||periodic?b.gain:b.streams;if(x==null)return y==null?0:1;if(y==null)return -1;return sortOrder==='least'?x-y:y-x});
 return rows;
}

const coverCache=new Map(),coverLookup=new Map(),releaseCoverLookup=new Map();
const releaseArtNames={'fml album':'FML','al1 album':'Al1','you make my day album':'YOU MAKE MY DAY',';[semicolon] album':'Semicolon','we make you album':'WE MAKE YOU','24h single':'24H','24h mini album':'24H','fallin\' flower single':'Fallin\' Flower','hitorijanai single':'Not Alone','an ode new tracks album':'An Ode'};
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
  if(first){const title=coverKey(item.title).replace(/\b(album|mini|ep)\b/g,'').trim();if(title&&!releaseCoverLookup.has(title))releaseCoverLookup.set(title,first)}
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
 const originalCoverKey=coverKey(row.name);
 if(!rank.startsWith('albums')&&row.kind!=='album'&&['fallin flower','good to me japanese ver','smile flower japanese ver'].includes(originalCoverKey))return 'image:https://contents.perfect.ne.jp/media/974caa/qesyun3wko.jpg';
 const originalKey=coverKey(row.name);
 const isAlbum=row.kind==='album'||rank.startsWith('albums');
 if(!isAlbum&&japaneseOriginalArtwork[originalKey])return 'release:'+encodeURIComponent(japaneseOriginalArtwork[originalKey]);
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
 if(!coverCache.has('fallback:'+id))coverCache.set('fallback:'+id,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/'+kind+'/'+value)).then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null));
 return coverCache.get('fallback:'+id);
}
function fillArtwork(){
 if(!('IntersectionObserver' in window)){document.querySelectorAll('img[data-cover-track]').forEach(img=>spotifyCover(img.dataset.coverFallback||img.dataset.coverTrack).then(url=>{if(url){img.src=url;img.classList.add('loaded')}}));return;}
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   observer.unobserve(entry.target);
   const img=entry.target,id=img.dataset.coverTrack;
   if(id.startsWith('image:')){img.src=id.slice(6);img.classList.add('loaded');continue}
   if(id.startsWith('release:')){
    const title=decodeURIComponent(id.slice(8));
    if(!releaseArtCache.has(title))releaseArtCache.set(title,fetch('https://itunes.apple.com/search?'+new URLSearchParams({term:'SEVENTEEN '+title,entity:'album',limit:'50'})).then(r=>r.ok?r.json():null).then(data=>{
     const matches=(data?.results||[]).filter(x=>/seventeen/i.test(x.artistName||'')&&coverKey(x.collectionName).replace(/\b(ep|single|album)\b/g,'').trim()===coverKey(title));
     return matches[0]?.artworkUrl100?.replace('100x100bb','600x600bb')||null;
    }).catch(()=>null));
    releaseArtCache.get(title).then(url=>{if(url&&img.isConnected){img.src=url;img.classList.add('loaded')}else if(img.isConnected){const fallback=img.dataset.coverFallback;if(fallback)spotifyCover(fallback).then(u=>{if(u&&img.isConnected){img.src=u;img.classList.add('loaded')}})}});
    continue;
   }
   if(!coverCache.has(id))coverCache.set(id,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/'+(id.startsWith('album:')?'album/'+id.slice(6):'track/'+id.replace(/^track:/,'')))).then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null));
   coverCache.get(id).then(url=>{if(url&&img.isConnected){img.src=url;img.classList.add('loaded')}});
  }
 },{rootMargin:'180px'});
 document.querySelectorAll('img[data-cover-track]').forEach(img=>observer.observe(img));
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
async function periodBaseline(s){
 if(!s||!(rank.endsWith('weekly')||rank.endsWith('monthly')))return null;
 const days=rank.endsWith('weekly')?7:30;
 const target=new Date(Date.parse(s.date+'T00:00:00Z')-days*86400000).toISOString().slice(0,10);
 const candidate=dates.find(d=>d===target);
 return candidate?getDate(tab,candidate):null;
}
function periodGain(s,p,id){
 if(!s||!p||s.tracks?.[id]==null)return null;
 const prev=comparablePrevious(s,p,id);
 if(!prev||(s.anomalies||[]).includes(id)||(p.anomalies||[]).includes(prev.id))return null;
 const gap=(Date.parse(s.date)-Date.parse(p.date))/86400000;
 const required=rank.endsWith('weekly')?7:30;
 if(gap!==required)return null;
 const value=s.tracks[id]-prev.value;
 if(isHistorical(s)!==isHistorical(p)&&value>2000000)return null;
 return value>=0?value:null;
}
function sumPeriod(s,p,ids){const values=ids.map(id=>periodGain(s,p,id));return values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null}
async function render(){renderArtistProfiles();const token=++renderToken;$('#ranking').innerHTML='<div class="empty">Loading saved streaming data…</div>';const s=await selectedSnapshot(),p=await prior(s),pp=await prior(p);const baseline=await periodBaseline(s);if(token!==renderToken)return;syncCalendar();restoreGroupNames(s,p);
 $('#date').textContent=s?.date||'—';const ids=s?trackIds(s):[];$('#count').textContent=s?fmt(ids.length):'—';$('#listeners').textContent=fmt(audienceValue(s,'listeners'));$('#followers').textContent=fmt(audienceValue(s,'followers'));const listenerNow=audienceValue(s,'listeners'),listenerPrev=audienceValue(p,'listeners'),followerNow=audienceValue(s,'followers'),followerPrev=audienceValue(p,'followers');const showDelta=(selector,now,prev)=>{const n=now!=null&&prev!=null&&p&&s&&((Date.parse(s.date)-Date.parse(p.date))/86400000===1)?now-prev:null;$(selector).textContent=n==null?'Change from previous day unavailable':(n>=0?'+':'−')+fmt(Math.abs(n))+' vs previous day';};showDelta('#listenersChange',listenerNow,listenerPrev);showDelta('#followersChange',followerNow,followerPrev);const grandId=s&&isHistorical(s)?Object.keys(s.tracks).find(id=>historicalKind(s,id)==='grand'):null;$('#total').textContent=s?fmt(grandId?s.tracks[grandId]:ids.reduce((a,id)=>a+s.tracks[id],0)):'—';const gains=s?ids.map(id=>safeGain(s,p,id)).filter(n=>n!=null):[];const grandGain=grandId?safeGain(s,p,grandId):null;$('#gain').textContent=grandGain!=null?'+'+fmt(grandGain):s&&p&&gains.length===ids.length?'+'+fmt(gains.reduce((a,b)=>a+b,0)):'—';
 $('#order').hidden=rank.startsWith('discography');const q=$('#search').value.toLowerCase();const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly'),discography=rank.startsWith('discography'),periodLabel=rank.endsWith('weekly')?'WEEKLY':'MONTHLY';const headers=document.querySelectorAll('.table-head span');headers[1].textContent=daily?'DAILY STREAMS ADDED':periodic?periodLabel+' STREAMS ADDED':'TOTAL STREAMS';headers[2].textContent=daily?'VS PREVIOUS DAY':periodic?'':'DAILY GAIN';document.querySelector('.table-head').classList.toggle('period-ranking',periodic);$('#ranking').classList.toggle('period-ranking',periodic);const rows=buildRows(s,p,pp,baseline).filter(x=>discography||x.name.toLowerCase().includes(q));$('#ranking').innerHTML=rows.length?rows.slice(0,discography?1000:250).map((r,i)=>`<div class="rank-row ${r.kind==='album'?'album-total-row':''}"><div class="track"><span class="place">${discography?(r.kind==='album'?'◆':'·'):String(i+1).padStart(2,'0')}</span>${discography&&r.kind!=='album'?'':`<span class="cover-slot">${artworkTrack(r)?`<img class="cover" data-cover-track="${artworkTrack(r)}" data-cover-fallback="${artworkMap.tracks[coverKey(r.name)]?.id||artworkMap.albums[coverKey(r.name)]?.id||''}" alt="" loading="lazy">`:`<span class="cover-placeholder">💎</span>`}</span>`}${streamTrackUrl(r)?`<a class="track-name track-stream-link" data-track-name-id="${r.id||''}" href="${streamTrackUrl(r)}" target="_blank" rel="noopener noreferrer" title="Stream ${escapeHtml(r.name)} on Spotify">${escapeHtml(r.name)}</a>`:`<span class="track-name" data-track-name-id="${r.id||''}">${escapeHtml(r.name)}</span>`}</div><div class="num">${periodic&&r.gain!=null?"+":""}${fmt(daily||periodic?r.gain:r.streams)}</div><div class="num change ${(daily?r.change:periodic?null:r.gain)<0?'negative':''}">${(daily?r.change:periodic?null:r.gain)==null?'—':((daily?r.change:r.gain)>=0?'+':'−')+fmt(Math.abs(daily?r.change:r.gain))}</div></div>`).join('') :'<div class="empty">'+(periodic?'No comparable '+(rank.endsWith('weekly')?'7-day':'30-day')+' snapshots for this date. Try another saved day.':'No matching entries found.')+'</div>';fillArtwork()}
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
(async()=>{[catalog,artworkMap]=await Promise.all([load('data/catalog.json'),load('data/artwork-map.json')]);catalog=catalog||{};artworkMap=artworkMap||{tracks:{},albums:{}};buildNames();buildCoverLookup();buildOriginalReleaseLookup();buildSpotifyTrackLinks();[current.group,current.solo]=await Promise.all([load('data/group.json'),load('data/solo.json')]);const manifest=await load('data/manifest.json')||{dates:[]};dates=[...new Set([...(manifest.dates||[]),...['group','solo'].map(t=>current[t]?.date).filter(Boolean)])].sort().reverse();syncCalendar();render()})();
