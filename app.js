const $=s=>document.querySelector(s),fmt=n=>n==null?'—':Number(n).toLocaleString('en-US');
let selectedSoloArtist=null;
let artworkMap={tracks:{},albums:{}};let sortOrder='most';let tab='group',rank='tracks-daily',rankType='tracks',catalog={},current={},history={},dates=[],selection='latest',period='week';
// Keep the visitor's exact view when the dashboard refreshes.
const viewStateKey='svt-dashboard-view-v2';
const savedArchiveKey='svt-selected-archive-date-v1';
try{selectedSoloArtist=sessionStorage.getItem('svt-selected-solo-artist')||null}catch{}
try{const remembered=localStorage.getItem(savedArchiveKey);if(remembered&&/^\d{4}-\d{2}-\d{2}$/.test(remembered))selection=remembered}catch{}
try{
 const saved=JSON.parse(sessionStorage.getItem(viewStateKey)||'null');
 if(saved){
  if(['group','solo'].includes(saved.tab))tab=saved.tab;
  if(['tracks','albums','discography'].includes(saved.rankType))rankType=saved.rankType;
  if(['daily','weekly','monthly','yearly','overall'].includes(saved.period))rank=rankType+'-'+saved.period;
  if(['most','least'].includes(saved.sortOrder))sortOrder=saved.sortOrder;
  if(saved.selection==='latest'||/^\d{4}-\d{2}-\d{2}$/.test(saved.selection||''))selection=saved.selection;
  try{const remembered=localStorage.getItem(savedArchiveKey);if(remembered&&/^\d{4}-\d{2}-\d{2}$/.test(remembered))selection=remembered}catch{}
 }
 if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
}catch(e){console.warn('Could not restore saved view',e)}
let savedScroll=0;
try{savedScroll=Number(JSON.parse(sessionStorage.getItem(viewStateKey)||'{}').scrollY)||0}catch{}
function saveView(){
 try{if(selectedSoloArtist)sessionStorage.setItem('svt-selected-solo-artist',selectedSoloArtist);else sessionStorage.removeItem('svt-selected-solo-artist')}catch{}
 try{if(selection==='latest')localStorage.removeItem(savedArchiveKey);else localStorage.setItem(savedArchiveKey,selection)}catch{}
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
 // 17 IS RIGHT HERE original-hits disc: its catalog lacks a usable
 // track-list description, so provide its release-order titles explicitly.
 const hits=(catalog.group||[]).find(x=>x.key==='g53');
 const hitNames=['Adore U','MANSAE','Pretty U','VERY NICE','BOOMBOOM',"Don't Wanna Cry",'CLAP','THANKS','Oh My!','Home','Fear','Left & Right','HOME;RUN','Ready to love','Rock with you','HOT','_WORLD (feat. Anne-Marie)','F*ck My Life','Super','God of Music'];
 if(hits?.tracks?.length===hitNames.length)hits.tracks.forEach((id,i)=>{idName[id]=hitNames[i]});
 const digital=(catalog.group||[]).find(x=>x.key==='g54');
 if(digital?.tracks?.length===1)idName[digital.tracks[0]]='Adore U (Inst.) (Digital Only)';
 // Spotify's official HAPPY BURSTDAY track order, absent from the source catalog description.
 const burstday=(catalog.group||[]).find(x=>x.title==='happy burstday album');
 const burstdayNames=['HBD','THUNDER','Bad Influence (Prod. by Pharrell Williams)','Skyfall (THE 8 Solo)','Fortunate Change (JOSHUA Solo)','99.9% (WONWOO Solo)','Raindrops (SEUNGKWAN Solo)','Damage (HOSHI Solo) (feat. Timbaland)','Shake It Off (MINGYU Solo)','Happy Virus (DK Solo)','Destiny (WOOZI Solo)','Shining Star (Vernon Solo)','Gemini (JUN Solo)','Trigger (DINO Solo)','Coincidence (JEONGHAN Solo)','Jungle (S.COUPS Solo)'];
 if(burstday?.tracks?.length===burstdayNames.length)burstday.tracks.forEach((id,i)=>{idName[id]=burstdayNames[i]});
 // Explicit names for catalog entries whose descriptions are missing or
 // malformed. These IDs are grounded in the corresponding release listings.
 const verifiedNames={
  '1WEk8mX0loccWCAcTZqVH8':"Don't Wanna Cry",
  '0xZ4WU5UfctiSeETi6pMEo':'God of Light Music',
  '6h13gMfEDlVlXFb8iDVaXb':'God of Light Music (Trot Remix)',
  '7viNY0jOjNJuLwsgAOPsBK':'God of Light Music (Inst.)',
  '5jXlUt3NS0iu7pHYPqpK2O':'24H',
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
 // The final greatest-hits entry has no title in the source description.
 idName['6KNp9wSUGYhtbE33su6xZv']='God of Music';
 // Preserve the proper display name for the Dirty Dancing remix.
 idName['6KfYVOicblNB8CaDZwbxiT']='Dirty Dancing (feat. JOSHUA, DK & DINO)';
}
const albumTitles={
 '17 carat album':'17 CARAT','boys be album':'BOYS BE','love & letter album':'LOVE & LETTER','love & letter repackage new tracks':'LOVE & LETTER (Repackage)','going seventeen album':'Going Seventeen','al1 album':'Al1','teen, age album':'TEEN, AGE',"director's cut album":"DIRECTOR'S CUT",'we make you album':'WE MAKE YOU','you make my day album':'YOU MAKE MY DAY','you make my dawn album':'YOU MADE MY DAWN','an ode new tracks album':'An Ode','heng':'Heng:garæ','24h mini album':'24H',';[semicolon] album':'; [Semicolon]','your choice album':'Your Choice','attacca album':'Attacca','face the sun album':'Face the Sun','sector 17 repackage album new tracks':'SECTOR 17','dream ep album':'DREAM','fml album':'FML','always yours new tracks album':'ALWAYS YOURS','always yours best album':'ALWAYS YOURS','seventeenth heaven album':'SEVENTEENTH HEAVEN','17 is right here best album':'17 IS RIGHT HERE','spill the feels album':'SPILL THE FEELS','love, money, fame remixes album':'LOVE, MONEY, FAME (Remixes)','shohikigen album':'消費期限 (Shohikigen)','happy burstday album':'HAPPY BURSTDAY','maestro remix single':'MAESTRO (Remixes)'
};
function albumDisplayName(name){
 const raw=String(name||''),n=raw.toLowerCase();
 if(n.includes('17 is right here'))return '17 IS RIGHT HERE — '+(n.includes('new tracks')?'New Tracks':n.includes('original tracks')?'Original Tracks':'All Tracks');
 if(n.includes('always yours'))return 'ALWAYS YOURS — '+(n.includes('new tracks')?'New Tracks':n.includes('original tracks')?'Original Tracks':'All Tracks');
 return (albumTitles[n]||raw).replace(/\b(?:album)\b/gi,'').replace(/\s+/g,' ').trim();
}
function properReleaseName(item){
 const title=String(item.title||'').toLowerCase();
 const namedSoloReleases={
  'jxj_dreamscape':'DREAMSCAPE','jun_g10':'9','bss_g2':'SECOND WIND','bss_g4':'TELEPARTY',
  'jxw_g1':'THIS MAN','hxw_g1':'BEAM','cxm_g1':'HYPE VIBES',
  'dxs_g1':'Serenade','v8':'V8','picheolin_g3':'吉BOARD (Gilboard)',
  'gilboard':'吉BOARD (Gilboard)','the8_g12':'V8','vernon_g9':'V8'
 };
 if(namedSoloReleases[item.key])return namedSoloReleases[item.key];
 if(title==='q&a single')return 'Q&A';
 if(title==='chocolate single')return 'Chocolate';
 if(title==='oh my!')return 'Oh My! (Chinese Ver.)';
 if(title==='24h single')return '24H';
 if(title==='_world')return '_WORLD (feat. Anne-Marie)';
 return null;
}
function catalogReleaseLabel(item){
 const proper=properReleaseName(item);if(proper)return proper;
 const name=String(item.title||'').toLowerCase(),count=(item.tracks||[]).length;
 if(name.includes('love & letter repackage'))return 'LOVE & LETTER (Repackage) — New Tracks';
 if(name.includes('sector 17 repackage'))return 'SECTOR 17 — New Tracks';
 if(name.includes('17 is right here'))return '17 IS RIGHT HERE — '+(count===4?'New Tracks (4)':count===1?'Additional Track (1)':count===2?'Additional Tracks (2)':'Additional Tracks ('+count+')')+' · Partial Collection';
 return formatDiscographyAlbumName(item.title);
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
  // Historical-to-current comparisons may span weeks or months. The old
  // 100k limit incorrectly hid legitimate gains for popular tracks.
  // Daily anomaly checks remain in safeGain and snapshotDelta.
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
 // Followers were first tracked on November 6, 2026. Never use older
 // spreadsheet follower rows or display a made-up historical baseline.
 if(kind==='followers' && (!s.date || s.date < '2026-11-06'))return null;
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
  '9 teen':'9-TEEN','a teen':'A-TEEN','24h':'24H','24 h':'24H','no f u n':'NO F.U.N','god of light music':'God of Light Music','god of light music inst':'God of Light Music (Inst.)','golm':'God of Light Music','golm inst':'God of Light Music (Inst.)','golm trot remix':'God of Light Music (Trot Remix)','20 0':'20','247 0':'247','gom':'God of Music','golm':'God of Light Music',
  'gom inst':'God of Music (Inst.)','gom trot remix':'God of Music (Trot Remix)',
  'golm inst':'God of Light Music (Inst.)',
  'f ck my life':'F*ck My Life','fuck my life':'F*ck My Life','super':'Super','hot':'HOT','thunder':'THUNDER','rock with you':'Rock with you',
  'very nice':'VERY NICE','boom boom':'BOOMBOOM','boomboom':'BOOMBOOM','hit song':'Hit Song','lilili yabbay':'Lilili Yabbay','gam3 bo1':'GAM3 BO1','2 minus 1':'2 MINUS 1','2 minus 1 bonus track':'2 MINUS 1 (Bonus Track)','i don t understand but i luv u':'I Don’t Understand But I Luv U','don quixote':'DON QUIXOTE','fire':'Fire','snap shoot':'Snap Shoot','back it up':'Back it up','my my':'My My','kidult':'Kidult','heaven s cloud':'Heaven’s Cloud','change up':'CHANGE UP','bring it':'BRING IT','trauma':'TRAUMA','pinwheel':'Pinwheel','flower':'Flower','rocket':'ROCKET','campfire':'Campfire','network love':'Network Love','second life':'Second Life','let me hear you say':'Let me hear you say','lie again':'Lie Again','lucky':'Lucky','fearless':'Fearless','together':'Together','i wish':'I Wish','wave':'Wave','anyone':'Anyone','dust':'Dust','april shower':'April shower','monster':'Monster','yawn':'Yawn','headliner':'Headliner','diamond days':'Diamond Days','eyes on you':'Eyes on you','candy':'Candy','rain':'Rain','water':'Water','maestro':'MAESTRO','don t wanna cry':"Don't Wanna Cry",
  'darling':'Darl+ing','darl ing':'Darl+ing','shining diamond':'Shining Diamond',
  'adore u':'Adore U','left right':'Left & Right','ready to love':'Ready to love',
  'home run':'HOME;RUN','home':'Home','world':'_WORLD','shadow':'Shadow',
  'clap':'CLAP','fear':'Fear','hit':'HIT','mansae':'MANSAE','pretty u':'Pretty U',
  'oh my':'Oh My!','thanks':'THANKS','getting closer':'Getting Closer',
  'fighting':'Fighting (Feat. Lee Young Ji)','spell':'Spell',
  'sos':'SOS','247':'247','1 to 13':'1 TO 13','no f u n':'NO F.U.N',
  'where love passed':'Where Love Passed','back 2 back':'Back 2 Back',
  'run to you japanese ver':'Run to You (Japanese Ver.)',
  'maestro japanese ver':'MAESTRO (Japanese Ver.)',
  'circles japanese ver':'Circles (Japanese Ver.)',
  'love money fame english ver':'LOVE, MONEY, FAME (English Ver.)',
  'oh my chinese ver':'Oh My! (Chinese Ver.)',
  'don t listen in secret':"Don't Listen in Secret",'when i grow up':'When I Grow Up',
  'thinkin about you':"Thinkin' About You",'run to you':'Run to You',
  'come to me':'Come to Me','our dawn is hotter than day':'Our Dawn Is Hotter Than Day',
  'let me hear you say':'Let Me Hear You Say','back it up':'Back It Up',
  'ready to love':'Ready to Love','to you':'To You','rock with you':'Rock with You',
  'i can t run away':"I Can't Run Away",'april shower':'April Shower',
  'same dream same mind same night':'Same Dream, Same Mind, Same Night',
  'cheers to youth':'Cheers to Youth','eyes on you':'Eyes on You',
  'power of love':'Power of Love','sweetest thing':'Sweetest Thing',
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
 if(!ids.length)return null;
 const gains=ids.map(id=>safeGain(s,p,id));
 return gains.every(n=>n!=null)?gains.reduce((a,b)=>a+b,0):null;
}
function formatDiscographyAlbumName(name){
 const raw=String(name||'').replace(/\s*Total\s*:?$/i,'').trim();
 if(/love\s*&\s*letter.*repackage/i.test(raw))
  return 'LOVE & LETTER (Repackage) — '+(/new tracks/i.test(raw)?'New Tracks':'All Tracks');
 if(/sector\s*17.*repackage/i.test(raw))
  return 'SECTOR 17 — '+(/new tracks/i.test(raw)?'New Tracks':'All Tracks');
 if(/oh my/i.test(raw)&&/chinese/i.test(raw))return 'Oh My! (Chinese Ver.)';
 if(/^9[ -]teen(?:\\s+ost)?$/i.test(raw))return '9-TEEN';
 if(/^_world(?:\\s+single)?$/i.test(raw))return '_WORLD (feat. Anne-Marie)';
 const withoutType=raw.replace(/\s+(?:ost|single)(?:\s+album)?$/i,'').trim();
 const formatted=albumDisplayName(withoutType);
 const special={
  '24h':'24H','darl+ing':'Darl+ing','power of love':'Power of Love',
  '9-teen':'9-TEEN','a-teen':'A-TEEN','oh my!':'Oh My! (Chinese Ver.)',
  'q&a':'Q&A','fml':'FML','hit':'HIT','sweetest thing':'Sweetest Thing',
  'fallin\' flower':"Fallin' Flower",'hitorijanai':'Hitorijanai',
  'love & letter':'LOVE & LETTER','sector 17':'SECTOR 17'
 };
 const key=formatted.toLowerCase().trim();
 if(special[key])return special[key];
 return formatted.replace(/\b[a-z]/g,c=>c.toUpperCase())
  .replace(/\bOst\b/g,'OST').replace(/\bEp\b/g,'EP')
  .replace(/\b17 Is Right Here\b/g,'17 IS RIGHT HERE')
  .replace(/\bLove & Letter\b/g,'LOVE & LETTER')
  .replace(/\bSector 17\b/g,'SECTOR 17')
  .replace(/\bTeen, Age\b/g,'TEEN, AGE')
  .replace(/\bFml\b/g,'FML');
}
function discographyRows(s,p,pp,baseline){
 if(!s)return [];
 if(isHistorical(s)){
  // Imported spreadsheet rows already contain full-album and split totals.
  // Preserve every original/new/full row in Discography.
  return Object.entries(s.tracks||{}).filter(([id])=>['album','track'].includes(historicalKind(s,id)))
   .map(([id,streams],i)=>({id,name:historicalKind(s,id)==='album'?formatDiscographyAlbumName(s.names?.[id]||id):displayTrackName(s.names?.[id]||id),streams,
    gain:periodGain(s,baseline,id)??safeGain(s,p,id),
    change:dailyChange(s,p,pp,id),kind:historicalKind(s,id),releaseOrder:i}));
 }

 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly');
 const rows=[];
 const releasesByKey=new Map((catalog[tab]||[]).map(item=>[item.key,item]));
 const combined={
  g7:{keys:['g6','g7'],name:'LOVE & LETTER (Repackage) — All Tracks'},
  g37:{keys:['g36','g37'],name:'SECTOR 17 — All Tracks'}
 };
 for(const item of catalog[tab]||[]){
  // Gilboard's duplicate catalog entries belong to Picheolin's discography.
  if(tab==='solo'&&(item.key==='gilboard'||item.key==='sharedTracks'))continue;
  const combo=tab==='group'?combined[item.key]:null;
  const ids=[...new Set((combo?combo.keys.flatMap(k=>releasesByKey.get(k)?.tracks||[]):item.tracks)||[])];
  if(!ids.length)continue;
  const streams=ids.every(id=>s.tracks?.[id]!=null)?ids.reduce((a,id)=>a+s.tracks[id],0):null;
  const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids);
  const previousGain=sumDaily(p,pp,ids);
  const albumTotalRow={name:combo?.name||catalogReleaseLabel(item),artworkRelease:item.key,streams,gain,change:periodic?sumPeriodChange(s,baseline,ids):gain!=null&&previousGain!=null?gain-previousGain:null,kind:'album',releaseOrder:rows.length};
  for(const id of [...new Set(item.tracks||[])]){
   if(s.tracks?.[id]==null)continue;
   const g=periodic?periodGain(s,baseline,id):safeGain(s,p,id);
   rows.push({id,name:displayTrackName(s.names?.[id]||idName[id]||id),streams:s.tracks[id],gain:g,change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id),kind:'track',releaseOrder:rows.length});
  }
  if(item.key==='g6'||item.key==='g36'){
   rows.push({...albumTotalRow,
    name:item.key==='g6'?'LOVE & LETTER (Repackage) — New Tracks':'SECTOR 17 — New Tracks',
    releaseOrder:rows.length});
  }else if(item.key==='g7'||item.key==='g37'){
   rows.push({...albumTotalRow,releaseOrder:rows.length});
  }else if(tab==='group'&&/^g(49|50|51|52|53|54)$/.test(item.key)){
   // The six 17 IS RIGHT HERE catalog segments form one 33-track album.
   // Display no intermediate totals; append one full-album total after Adore U (Inst.).
   if(item.key==='g54'){
    const allIds=[...new Set(['g49','g50','g51','g52','g53','g54']
     .flatMap(k=>releasesByKey.get(k)?.tracks||[]))];
    const allStreams=allIds.every(id=>s.tracks?.[id]!=null)
     ?allIds.reduce((total,id)=>total+s.tracks[id],0):null;
    const allGain=periodic?sumPeriod(s,baseline,allIds):sumDaily(s,p,allIds);
    const prevGain=sumDaily(p,pp,allIds);
    rows.push({name:'17 IS RIGHT HERE — All Tracks',artworkRelease:'g49',
     streams:allStreams,gain:allGain,
     change:periodic?sumPeriodChange(s,baseline,allIds):
      allGain!=null&&prevGain!=null?allGain-prevGain:null,
     kind:'album',releaseOrder:rows.length});
   }
  }else rows.push(albumTotalRow);
 }
 return rows;
}
const requestedGroupAlbums=[{"name":"1st Best Album - 17 IS RIGHT HERE","keys":["g49","g50","g51","g52","g53","g54"]},{"name":"Repackage Album - SECTOR 17","keys":["g36","g37"]},{"name":"4th Full Album - Face the Sun","keys":["g35"]},{"name":"1st Full Repackage Album - LOVE & LETTER","keys":["g6","g7"]},{"name":"10th Mini Album - FML","keys":["g41"]},{"name":"9th Mini Album - Attacca","keys":["g32"]},{"name":"2nd Full Album - TEEN, AGE","keys":["g10"]},{"name":"3rd Full Album - An Ode","keys":["g20"]},{"name":"7th Mini Album - Heng:garæ","keys":["g23"]},{"name":"1st Japanese Best Album - ALWAYS YOURS","keys":["g43","g44"]},{"name":"4th Mini Album - Al1","keys":["g9"]},{"name":"6th Mini Album - YOU MADE MY DAWN","keys":["g16"]},{"name":"8th Mini Album - Your Choice","keys":["g29"]},{"name":"5th Full Album - HAPPY BURSTDAY","keys":["g59"]},{"name":"1st Full Album - LOVE & LETTER","keys":["g5"]},{"name":"3rd Mini Album - Going Seventeen","keys":["g8"]},{"name":"11th Mini Album - SEVENTEENTH HEAVEN","keys":["g46"]},{"name":"2nd Special Album - ; [Semicolon]","keys":["g27"]},{"name":"5th Mini Album - YOU MAKE MY DAY","keys":["g13"]},{"name":"12th Mini Album - SPILL THE FEELS","keys":["g56"]},{"name":"1st Special Album - DIRECTOR'S CUT","keys":["g11"]},{"name":"1st Mini Album - 17 CARAT","keys":["g1"]},{"name":"2nd Mini Album - BOYS BE","keys":["g2"]},{"name":"2nd Japanese Single Album - Fallin' Flower","keys":["g22"]},{"name":"1st Japanese Mini Album - WE MAKE YOU","keys":["g12"]},{"name":"2nd Japanese Mini Album - 24H","keys":["g25"]},{"name":"3rd Japanese Single Album - Hitorijanai","keys":["g28"]},{"name":"1st Japanese Single Album - Happy Ending","keys":["g18"]},{"name":"1st Japanese EP Album - DREAM","keys":["g39"]},{"name":"4th Japanese Single Album - Power of Love","keys":["g33"]},{"name":"5th Japanese Single Album - Shohikigen","keys":["g58"]}];
function cleanAlbumLabel(name){
 let n=String(name||'').replace(/\s*Total\s*:?$/i,'').trim();
 if(/17 is right here/i.test(n))return '1st Best Album - 17 IS RIGHT HERE';
 if(/always yours/i.test(n))return '1st Japanese Best Album - ALWAYS YOURS';
 if(/sector 17/i.test(n)&&/repackage/i.test(n))return 'Repackage Album - SECTOR 17';
 if(/love\s*&\s*letter/i.test(n)&&/repackage/i.test(n))return '1st Full Repackage Album - LOVE & LETTER';
 if(/love\s*&\s*letter/i.test(n)&&/1st full|full album/i.test(n))return '1st Full Album - LOVE & LETTER';
 n=n.replace(/\s+Album\s+-\s+/gi,' Album - ').replace(/\s+Album\s*$/gi,'');
 n=n.replace(/\s+-\s+/g,' - ').replace(/\s+/g,' ').trim();
 const match=n.match(/^(.*?)\s+-\s+(.*?)$/);
 if(match){
  let type=match[1].trim(),title=match[2].replace(/\s+Album$/i,'').trim();
  if(!/\bAlbum$/i.test(type))type+=' Album';
  return type+' - '+title;
 }
 return n;
}
function buildRows(s,p,pp,baseline){
 if(!s)return[];
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly'),albums=rank.startsWith('albums'),discography=rank.startsWith('discography');
 if(discography)return discographyRows(s,p,pp,baseline);
 let rows=[];
 if(albums&&isHistorical(s)){
   rows=Object.entries(s.tracks).filter(([id])=>historicalKind(s,id)==='album'&&isAlbumTitle(s.names?.[id])&&!/\b(?:new|original)\s+tracks?\b/i.test(s.names?.[id]||'')).map(([id,streams])=>({
     id,name:albumDisplayName((s.names[id]||id).replace(/\s*Total\s*:?$/i,'').trim()),streams,
     gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id)
   }));
 }else if(albums&&tab==='group'){
   // Match the album sum expressions printed by Stream_Stats.java.
   // In particular, repackage totals combine their base and added arrays.
   const releasesByKey=new Map((catalog.group||[]).map(item=>[item.key,item]));
   for(const spec of requestedGroupAlbums){
     const ids=[...new Set(spec.keys.flatMap(key=>releasesByKey.get(key)?.tracks||[]))];
     const streams=ids.length&&ids.every(id=>s.tracks[id]!=null)?ids.reduce((sum,id)=>sum+s.tracks[id],0):null;
     const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids);
     const yesterday=sumDaily(p,pp,ids);
     rows.push({name:spec.name,artworkRelease:spec.name.includes('Repackage')?(spec.name.includes('SECTOR 17')?'g36':'g7'):spec.keys[0],streams,gain,
       change:periodic?sumPeriodChange(s,baseline,ids):gain!=null&&yesterday!=null?gain-yesterday:null});
   }
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
 if(albums)rows.forEach(row=>{row.name=cleanAlbumLabel(row.name)});
 rows=uniqueRows(rows).filter(r=>albums||r.streams!=null);
 rows.sort((a,b)=>{const x=daily||periodic?a.gain:a.streams,y=daily||periodic?b.gain:b.streams;if(x==null)return y==null?0:1;if(y==null)return -1;return sortOrder==='least'?x-y:y-x});
 return rows;
}

const coverCache=new Map(),coverLookup=new Map(),releaseCoverLookup=new Map();
const releaseArtNames={'fml album':'FML','al1 album':'Al1','you make my day album':'YOU MAKE MY DAY',';[semicolon] album':'Semicolon','we make you album':'WE MAKE YOU','24h single':'24H','24h mini album':'24H','fallin\' flower single':'Fallin\' Flower','hitorijanai single':'Not Alone','an ode new tracks album':'An Ode'};
const releaseArtCache=new Map();
const persistentCoverKey='svt-artwork-cache-v10-love-letter-verified-ids';
let persistentCovers={};
try{persistentCovers=JSON.parse(localStorage.getItem(persistentCoverKey)||'{}')||{}}catch{}
function rememberCover(key,url){
 if(!url)return;
 persistentCovers[key]=url;
 try{localStorage.setItem(persistentCoverKey,JSON.stringify(persistentCovers))}catch{}
}

const releaseArtwork={};
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
const verifiedOriginalCovers={
 'oh my':'YOU MAKE MY DAY','home run':'Semicolon','light a flame':'Semicolon',
 'our dawn is hotter than day':'YOU MAKE MY DAY','fallin flower':'Fallin Flower',
 'call call call':'WE MAKE YOU','24h':'24H','hitorijanai':'Not Alone',
 'not alone':'Not Alone','all my love':'Semicolon','happy ending':'Happy Ending',
 'do re mi':'Semicolon','god of light music':'God of Light Music',
 'god of light music inst':'God of Light Music',
 'god of light music trot remix':'God of Light Music',
 'moonwalker':'YOU MAKE MY DAY','ah love':'Semicolon',
 'come to me':'YOU MAKE MY DAY','hey buddy':'Semicolon',
 'what s good':'YOU MAKE MY DAY','no f u n':'Love & Letter (Repackage)',
 'dream':'DREAM'
};
// Historical spreadsheet rows have legacy IDs rather than Spotify IDs.
// Resolve artwork through the same current catalog used by the latest date.
function historicalArtworkId(row){
 const key=coverKey(row.name||'');
 const items=catalog[tab]||[];
 if(row.kind==='album'||rank.startsWith('albums')){
  const match=items.find(item=>coverKey(catalogReleaseLabel(item))===key)
   ||items.find(item=>coverKey(albumDisplayName(item.title))===key);
  if(match)return {artworkRelease:match.key};
  const releaseAliases={
   '17 is right here all tracks':'17 IS RIGHT HERE',
   '17 is right here new tracks':'17 IS RIGHT HERE',
   'sector 17 all tracks':'SECTOR 17',
   'sector 17 new tracks':'SECTOR 17',
   'love letter repackage all tracks':'LOVE & LETTER (Repackage)',
   'love letter repackage new tracks':'LOVE & LETTER (Repackage)',
   'always yours all tracks':'ALWAYS YOURS',
   'always yours new tracks':'ALWAYS YOURS'
  };
  if(releaseAliases[key])return {release:releaseAliases[key]};
  // Legacy spreadsheet album totals use long ordinal labels. Match the
  // actual album title, not the "1st Mini Album" prefix.
  const original=String(row.name||'').replace(/\s*total\s*:?$/i,'').trim();
  const releaseNames=[
   ['17 IS RIGHT HERE',/17 is right here/i],
   ['ALWAYS YOURS',/always yours/i],
   ['SECTOR 17',/sector\s*17/i],
   ['LOVE & LETTER (Repackage)',/love\s*(?:&|and)\s*letter.*repackage|love\s*letter\s*repackage/i],
   ['LOVE & LETTER',/love\s*(?:&|and)\s*letter/i],
   ['17 CARAT',/17 carat/i],['BOYS BE',/boys be/i],
   ['Going Seventeen',/going seventeen/i],['Al1',/\bal1\b/i],
   ['TEEN, AGE',/teen,?\s*age/i],["DIRECTOR'S CUT",/director.s cut/i],
   ['WE MAKE YOU',/we make you/i],['YOU MAKE MY DAY',/you make my day/i],
   ['YOU MADE MY DAWN',/you ma(?:de|ke) my dawn/i],['An Ode',/an ode/i],
   ['Heng:garæ',/heng.?gar/i],['Semicolon',/semicolon/i],
   ['Your Choice',/your choice/i],['Attacca',/attacca/i],
   ['Face the Sun',/face the sun/i],['FML',/\bfml\b/i],
   ['SEVENTEENTH HEAVEN',/seventeenth heaven/i],
   ['SPILL THE FEELS',/spill the feels/i],['HAPPY BURSTDAY',/happy burstday/i],
   ['24H',/\b24h\b/i],['DREAM',/\bdream\b/i],
   ['Shohikigen',/shohikigen/i],['Fallin Flower',/fallin.?\s*flower/i],
   ['Not Alone',/hitorijanai|not alone/i],['Happy Ending',/happy ending/i],
   ['Power of Love',/power of love/i],['Q&A',/q\s*&\s*a/i],
   ['Chocolate',/chocolate/i],['9-TEEN',/9.teen/i],['A-TEEN',/a.teen/i],
   ['HIT',/\bhit\b/i],['Darl+ing',/darl\+?ing/i],
   ['God of Light Music',/golm|god of light music/i],
   ['Sweetest Thing',/sweetest thing/i]
  ];
  const found=releaseNames.find(([,pattern])=>pattern.test(original));
  if(found)return {release:found[0]};
  // Historical album labels include ordinal/type prefixes and "Total" suffixes.
  // Normalize them to the same release keys used for current-date artwork.
  const strip=n=>coverKey(n).replace(/\b(?:1st|2nd|3rd|4th|full|mini|special|japanese|korean|best|repackage|album|ep|single|digital|original|new|all|tracks|track|total|ost)\b/g,' ').replace(/\s+/g,' ').trim();
  const normalized=strip(row.name);
  const candidates=items.filter(item=>{
   const names=[item.title,catalogReleaseLabel(item)];
   return names.some(n=>strip(n)===normalized&&normalized.length>2);
  });
  if(candidates.length)return {artworkRelease:candidates[0].key};
  const known=(artworkMap.albums||{})[key]||(artworkMap.albums||{})[normalized];
  if(known?.id)return {id:known.id};
  return null;
 }
 if(/^[A-Za-z0-9]{22}$/.test(row.id||''))return null;
 const ids=[...new Set(items.flatMap(item=>item.tracks||[]))];
 const matches=ids.filter(id=>coverKey(idName[id]||'')===key);
 if(matches.length)return {id:matches[0]};
 // Spreadsheet rows often use legacy:* IDs and spelling variants. Use
 // the same first-release artwork indexes as the latest snapshot.
 const first=originalReleaseLookup.get(key)||firstReleaseByTitle.get(key);
 if(first)return {art:first};
 const mapped=coverLookup.get(key)||artworkMap.tracks[key]?.id;
 if(mapped)return {id:mapped};
 return null;
}
// Canonical cover IDs for historical spreadsheet album labels.
function historicalAlbumCoverFallback(row){
 if(tab!=='group'||!(row.kind==='album'||rank.startsWith('albums')))return null;
 const title=String(row.name||'');
 const matches=[
  [/your choice/i,'g29'],
  [/you make my dawn/i,'g16'],
  [/\bdream\b/i,'g39'],
  [/\b24h\b/i,'g25'],
  [/we make you/i,'g12']
 ];
 const key=matches.find(([pattern])=>pattern.test(title))?.[1];
 const id=(catalog.group||[]).find(item=>item.key===key)?.tracks?.[0];
 return /^[A-Za-z0-9]{22}$/.test(id||'')?'track:'+id:null;
}
function artworkTrack(row){
 const historical=historicalArtworkId(row);
 if(historical?.release)return 'release:'+encodeURIComponent(historical.release);
 if(historical?.artworkRelease)row={...row,artworkRelease:historical.artworkRelease};
 if(historical?.id)row={...row,id:historical.id};
 if(historical?.art)return historical.art;
 const name=coverKey(row.name).replace(/\btotal\b/g,'').trim();
 const isAlbum=row.kind==='album'||rank.startsWith('albums');
 const validId=id=>/^[A-Za-z0-9]{22}$/.test(id||'');
 const isVersion=/\b(remix|instrumental|inst|sped up|slowed|workout|orchestra|feat|with|holiday|korean ver|chinese ver|japanese ver)\b/.test(name);
 const releases=catalog[tab]||[];
 if(isAlbum&&tab==='group'&&row.artworkRelease==='g24'){
  const single=(catalog.group||[]).find(item=>item.key==='g24');
  const id=single?.tracks?.[0];
  if(/^[A-Za-z0-9]{22}$/.test(id||''))return 'track:'+id;
 }
 if(isAlbum&&tab==='group'&&row.artworkRelease){
  const directRelease={
   g5:'LOVE & LETTER',g6:'LOVE & LETTER (Repackage)',g7:'LOVE & LETTER (Repackage)',
   g35:'Face the Sun',g36:'SECTOR 17',g37:'SECTOR 17',
   g49:'17 IS RIGHT HERE',g50:'17 IS RIGHT HERE',g51:'17 IS RIGHT HERE',g52:'17 IS RIGHT HERE',
   g43:'ALWAYS YOURS',g44:'ALWAYS YOURS',g25:'24H',g15:'Oh My! (Chinese Ver.)'
  };
  if(directRelease[row.artworkRelease])return 'release:'+encodeURIComponent(directRelease[row.artworkRelease]);
 }
 if(isAlbum&&tab==='group'){
  const spec=requestedGroupAlbums.find(item=>item.name===row.name || item.keys.includes(row.artworkRelease));
  if(spec){
   const first=(catalog.group||[]).find(item=>item.key===spec.keys[0]);
   const title=first?.title||'';
   const aliases={
    '17 is right here best album':'17 IS RIGHT HERE',
    'sector 17 repackage album new tracks':'SECTOR 17',
    'face the sun album':'Face the Sun',
    'love & letter repackage new tracks':'LOVE & LETTER (Repackage)',
    'fml album':'FML','attacca album':'Attacca','teen, age album':'TEEN, AGE',
    'an ode new tracks album':'An Ode','heng':'Heng:garæ',
    'always yours best album':'ALWAYS YOURS',
    'always yours new tracks album':'ALWAYS YOURS',
    'al1 album':'Al1','you make my dawn album':'YOU MADE MY DAWN',
    'your choice album':'Your Choice','happy burstday album':'HAPPY BURSTDAY',
    'love & letter album':'LOVE & LETTER','going seventeen album':'Going Seventeen',
    'seventeenth heaven album':'SEVENTEENTH HEAVEN',
    ';[semicolon] album':'Semicolon','you make my day album':'YOU MAKE MY DAY',
    'spill the feels album':'SPILL THE FEELS',
    "director's cut album":"DIRECTOR'S CUT",
    '17 carat album':'17 CARAT','boys be album':'BOYS BE',
    "fallin' flower single":"Fallin Flower",
    'we make you album':'WE MAKE YOU','24h mini album':'24H',
    'hitorijanai single':'Not Alone','happy ending single':'Happy Ending',
    'dream ep album':'DREAM','power of love single':'Power of Love',
    'shohikigen album':'Shohikigen',
    'q&a single':'Q&A','chocolate single':'Chocolate'
   };
   // Resolve by the actual release, not a track from a repackage.
   if(spec.keys[0]==='g5')return 'release:'+encodeURIComponent('LOVE & LETTER');
   if(spec.keys[0]==='g7')return 'release:'+encodeURIComponent('LOVE & LETTER (Repackage)');
   if(spec.keys[0]==='g36')return 'release:'+encodeURIComponent('SECTOR 17');
   if(aliases[title])return 'release:'+encodeURIComponent(aliases[title]);
  }
 }
 if(isAlbum&&tab==='group'){
  // Album labels are cleaned for display, so resolve these releases explicitly.
  if(/fallin.? flower/i.test(row.name))return 'release:'+encodeURIComponent('Fallin Flower');
  if(/happy burstday/i.test(row.name))return 'release:'+encodeURIComponent('HAPPY BURSTDAY');
  if(/you ma(?:de|ke) my dawn/i.test(row.name))return 'release:'+encodeURIComponent('YOU MADE MY DAWN');
  if(/love\s*&?\s*letter/i.test(row.name)){
   return 'release:'+encodeURIComponent(/repackage/i.test(row.name)?'LOVE & LETTER (Repackage)':'LOVE & LETTER');
  }
 }
 if(isAlbum&&tab==='group'){
  const match=(catalog.group||[]).find(item=>coverKey(catalogReleaseLabel(item))===name);
  if(match?.title==='q&a single')return 'release:'+encodeURIComponent('Q&A');
  if(match?.title==='chocolate single')return 'release:'+encodeURIComponent('Chocolate');
 }
 if(isAlbum&&tab==='solo'){
  const soloRelease=(catalog.solo||[]).find(item=>item.key===row.artworkRelease)
   ||(catalog.solo||[]).find(item=>coverKey(catalogReleaseLabel(item))===name);
  const spotifyAlbums={v8:'5HQrHtpGthJMePFhXT3jKS',the8_g12:'5HQrHtpGthJMePFhXT3jKS',vernon_g9:'5HQrHtpGthJMePFhXT3jKS'};
  if(soloRelease&&spotifyAlbums[soloRelease.key])return 'album:'+spotifyAlbums[soloRelease.key];
  const first=soloRelease?.tracks?.find(validId);
  if(first)return 'track:'+first;
 }
 if(isAlbum){
  // Album rows must display their own release, including compilations.
  const release=releases.find(item=>coverKey(item.title)===name)
   ||releases.find(item=>coverKey(catalogReleaseLabel(item))===name)
   ||releases.find(item=>coverKey(item.title).replace(/\b(album|ep|single|mini|new tracks)\b/g,'').trim()===name);
  const id=release?.tracks?.find(validId);
  if(id)return 'track:'+id;
  const mapped=artworkMap.albums[name];
  if(mapped?.id)return 'track:'+mapped.id;
  return null;
 }
 if(tab==='group'){
  // Use the actual original release title, never a track ID that Spotify
  // may serve with the later 17 IS RIGHT HERE compilation artwork.
  const originalAlbumTitles={
   'q&a single':'Q&A','chocolate single':'Chocolate',
   'fml album':'FML','al1 album':'Al1',
   '17 carat album':'17 CARAT','boys be album':'BOYS BE',
   'love & letter album':'LOVE & LETTER',
   'love & letter repackage new tracks':'LOVE & LETTER (Repackage)',
   'going seventeen album':'Going Seventeen','teen, age album':'TEEN, AGE',
   "director's cut album":"DIRECTOR'S CUT",
   'you make my day album':'YOU MAKE MY DAY',
   'you make my dawn album':'YOU MADE MY DAWN',
   'an ode new tracks album':'An Ode','heng':'Heng:garæ',
   ';[semicolon] album':'Semicolon','your choice album':'Your Choice',
   'attacca album':'Attacca','face the sun album':'Face the Sun',
   'sector 17 repackage album new tracks':'SECTOR 17',
   'seventeenth heaven album':'SEVENTEENTH HEAVEN',
   'spill the feels album':'SPILL THE FEELS',
   '17 is right here best album':'17 IS RIGHT HERE'
  };
  for(const [release,songs] of Object.entries(originalReleaseSongs)){
   if(songs.includes(name)&&originalAlbumTitles[release])
    return 'release:'+encodeURIComponent(originalAlbumTitles[release]);
  }
  if(name==='q a')return 'release:'+encodeURIComponent('Q&A');
  if(name==='chocolate')return 'release:'+encodeURIComponent('Chocolate');
  // Explicit first-release artwork, independent of Spotify anthology track IDs.
  const originalCover=verifiedOriginalCovers[name];
  if(originalCover){
   // Resolve to the first track of the *original catalog release*, never a
   // 17 IS RIGHT HERE anthology ID or an imprecise album-title search.
   const sourceTitles={
    'YOU MAKE MY DAY':'you make my day album',
    'Semicolon':';[semicolon] album',
    'Fallin Flower':"fallin' flower single",
    'WE MAKE YOU':'we make you album',
    '24H':'24h mini album',
    'Not Alone':'hitorijanai single',
    'Happy Ending':'happy ending single',
    'God of Light Music':'golm',
    'Love & Letter (Repackage)':'love & letter repackage new tracks',
    'DREAM':'dream ep album'
   };
   const originalItem=(catalog.group||[]).find(item=>item.title===sourceTitles[originalCover]);
   const originalId=originalItem?.tracks?.find(validId);
   if(originalId)return 'release:'+encodeURIComponent(originalCover);
   return 'release:'+encodeURIComponent(originalCover);
  }
  // The discography's first release wins over anthology Spotify track IDs.
  // Japanese versions, remixes and other distinct recordings stay separate.
  if(japaneseOriginalArtwork[name])return 'release:'+encodeURIComponent(japaneseOriginalArtwork[name]);
  const original=originalReleaseLookup.get(name);
  if(original&&!isVersion)return 'track:'+original;
  const first=firstReleaseByTitle.get(name);
  if(first&&!isVersion)return first;
  const byId=firstReleaseById.get(row.id);
  if(byId&&!isVersion)return byId;
  // For songs exclusive to 17 IS RIGHT HERE, use the actual compilation.
  if(['maestro','lalali','spell','cheers to youth','call call call korean ver',
      'happy ending korean ver','24h korean ver','not alone korean ver',
      'power of love korean ver','dream korean ver',
      'ima even if the world ends tomorrow korean ver','adore u inst'].includes(name))
   return 'release:'+encodeURIComponent('17 IS RIGHT HERE');
  return validId(row.id)?'track:'+row.id:null;
 }
 // Solo/unit: preserve the member and track ID, never borrow another artist's cover.
 if(validId(row.id))return 'track:'+row.id;
 const matches=releases.flatMap(item=>{
  const desc=(item.description||'').split(':').slice(1).join(':');
  const titles=desc.split(/,\s*/).map(coverKey);
  if(titles.length!==item.tracks.length)return [];
  return item.tracks.map((id,i)=>({id,title:titles[i]}));
 }).filter(item=>item.title===name&&validId(item.id));
 return matches.length===1?'track:'+matches[0].id:null;
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
   else if(id?.startsWith('album:'))url=await spotifyCover(id);
   else if(id?.startsWith('release:')){
    const title=decodeURIComponent(id.slice(8));
    if(!releaseArtCache.has(title)){
     const cacheKey='release:'+title;
     const fetchOriginal=async()=>{
      // Verified Apple Music release IDs: original is 10 tracks, repackage 15.
      // Never use fuzzy title search for these two distinct album covers.
      const verifiedLoveLetterIds={
       'LOVE & LETTER':'1107471199',
       'LOVE & LETTER (Repackage)':'1130828885'
      };
      if(verifiedLoveLetterIds[title]){
       try{
        const response=await fetch('https://itunes.apple.com/lookup?id='+verifiedLoveLetterIds[title]+'&country=US');
        if(response.ok){
         const data=await response.json();
         const album=(data.results||[]).find(x=>x.wrapperType==='collection'&&/seventeen/i.test(x.artistName||''));
         if(album?.artworkUrl100){
          const url=album.artworkUrl100.replace(/\d+x\d+bb/,'600x600bb');
          rememberCover(cacheKey,url);
          return url;
         }
        }
       }catch(e){console.warn('Verified LOVE & LETTER artwork lookup failed',title,e)}
       return null; // Do not substitute the other edition's artwork.
      }
      const aliases={
       'Semicolon':['; [Semicolon]','Semicolon','; [Semicolon] - EP','SEVENTEEN Special Album ; [Semicolon]'],
       'Al1':['Al1','Al1 - EP'],
       'Q&A':['Q&A','Q&A - Single'],
       'Chocolate':['Chocolate (2016 월간 윤종신 2월호)','Chocolate'],
       'FML':['FML','FML - EP'],
       'LOVE & LETTER (Repackage)':['Love & Letter Repackage Album','Love & Letter (Repackage)','Love & Letter Repackage'],
       'LOVE & LETTER':['Love & Letter','FIRST LOVE & LETTER'],
       'HAPPY BURSTDAY':['HAPPY BURSTDAY'],
       'Not Alone':['ひとりじゃない','Hitorijanai','Not Alone'],
       'Fallin Flower':["Fallin' Flower",'舞い落ちる花びら',"Fallin' Flower - Single"],
       'God of Light Music':['God of Light Music','GOLM'],
       'DREAM':['DREAM','DREAM - EP'],
       'Happy Ending':['Happy Ending','Happy Ending - Single'],
       '24H':['24H','24H - EP'],
       'Power of Love':['Power of Love','あいのちから'],
       'WE MAKE YOU':['WE MAKE YOU','WE MAKE YOU - EP']
      };
      const candidates=aliases[title]||[title];
      const clean=n=>coverKey(n).replace(/\b(mini album|ep|single|album)\b/g,'').trim();
      for(const term of candidates){
       try{
        const params=new URLSearchParams({term:'SEVENTEEN '+term,entity:'album',limit:'100',country:/[\u3040-\u30ff\u4e00-\u9fff]/.test(term)?'JP':'US'});
        const response=await fetch('https://itunes.apple.com/search?'+params);
        if(!response.ok)continue;
        const data=await response.json();
        const matches=(data.results||[]).filter(x=>{
         const artist=String(x.artistName||'');
         // Collaborations credit SEVENTEEN alongside their collaborators.
         if(!/seventeen/i.test(artist))return false;
         const found=clean(x.collectionName);
         return candidates.some(t=>found===clean(t));
        });
        // Prefer the canonical release rather than a later compilation,
        // remaster, remix or an unrelated artist's similarly named album.
        const picked=matches.sort((a,b)=>{
         const score=x=>{
          const n=String(x.collectionName||'').toLowerCase();
          const artist=String(x.artistName||'').toLowerCase();
          return (artist==='seventeen'?20:artist.includes('seventeen')?10:0)
           +(n===title.toLowerCase()?8:0)
           +(/remix|instrumental|karaoke|tribute/.test(n)?-30:0);
         };
         return score(b)-score(a);
        })[0];
        if(picked?.artworkUrl100){
         const url=picked.artworkUrl100.replace(/\d+x\d+bb/,'600x600bb');
         rememberCover(cacheKey,url);
         return url;
        }
       }catch(e){console.warn('Original release cover lookup failed',title,e)}
      }
      // Some Japanese singles and newer releases are not returned by
      // iTunes' album-only endpoint. Try songs from that exact release.
      for(const term of candidates){
       try{
        const params=new URLSearchParams({term:'SEVENTEEN '+term,entity:'song',limit:'200',country:/[\u3040-\u30ff\u4e00-\u9fff]/.test(term)?'JP':'US'});
        const response=await fetch('https://itunes.apple.com/search?'+params);
        if(!response.ok)continue;
        const data=await response.json();
        const exact=(data.results||[]).find(x=>/seventeen/i.test(x.artistName||'')&&
         candidates.some(t=>clean(x.collectionName)===clean(t))&&x.artworkUrl100);
        if(exact){
         const url=exact.artworkUrl100.replace(/\d+x\d+bb/,'600x600bb');
         rememberCover(cacheKey,url);
         return url;
        }
       }catch(e){console.warn('Song artwork fallback failed',title,e)}
      }
      return null;
     };
     releaseArtCache.set(title,persistentCovers[cacheKey]?Promise.resolve(persistentCovers[cacheKey]):fetchOriginal());
    }
    url=await releaseArtCache.get(title);
   }else url=await spotifyCover(id);
   if(!url&&fallback)url=await spotifyCover(fallback);
   
   setImage(img,url);
  }catch(e){console.warn('Artwork unavailable',id,e);if(fallback){try{setImage(img,await spotifyCover(fallback))}catch{setImage(img,null)}}else setImage(img,null)}
 };
 if(!('IntersectionObserver' in window)){imgs.forEach(resolve);return}
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);resolve(entry.target)}},{rootMargin:'240px'});
 imgs.forEach(img=>observer.observe(img));
}
const soloArtists=[["Jeonghan","6KDLlQYeeqUe5OQ2JrdNzF"],["Joshua","74AwWFYdjQ3ER5vHO4H7b0"],["Jun","38Gn0ZVC8TQwuaMxBK1yRV"],["Hoshi","6nWKAdMv1BDq1zHfZzkdbR"],["Wonwoo","3rHcBT06Vb1XGVUWhDALZt"],["Woozi","4TdiASPlU3QdZvGQBothcQ"],["DK","7G1kUsPtQCdolV6CPwHmh2"],["Mingyu","5gUpo0BRmo6EOTbyU3z5Ay"],["The8","4DqFd6XE3dX4LWXHJVVpLk"],["Seungkwan","0Vb2DjojEYsasFpc3aTZb6"],["Vernon","2Y34b9AOK30zXgL7cAH4NG"],["Dino","5YaeXxzvqGNBCguELlKo6G"],["BSS","1uAT5bTSp6dWbNmixIUP5t"],["JxJ",null],["JxW","7GvlsjcgBrsE578yghOq7D"],["HxW","1EReYiseDwE51FzGm7EK9n"],["CxM","7kjuLdYbtTkWBToMu2ebZN"],["DxS","4wBjmEkWhY4T22q00CiF5V"],["V8",null],["Picheolin","3V2EC4dPYLgtbi0TtrB1RA"]];
const artistPhotoCache=new Map();
function renderArtistProfiles(){
 const area=$('#artistProfiles');
 if(!area)return;
 area.hidden=tab!=='solo';
 if(tab!=='solo')return;
 area.innerHTML='<div class="artist-profiles-heading">MEMBERS & UNITS <span>✦</span></div>'+(selectedSoloArtist?'<div class="artist-selection-heading"><button type="button" id="allSoloArtists">← All units & solos</button><strong>'+escapeHtml(selectedSoloArtist)+' · STREAMING STATS</strong></div>':'')+'<div class="artist-profile-grid">'+soloArtists.map(([name,id])=>{
  const photo=name==='V8'?'<img class="artist-profile-photo" data-artist-photo="v8-debut" alt="V8 debut album artwork featuring Vernon and The8" loading="lazy">':id?'<img class="artist-profile-photo" data-artist-photo="'+id+'" alt="" loading="lazy">':'<span class="artist-profile-placeholder">💎</span>';
  const label='<span class="artist-profile-name">'+escapeHtml(name)+'</span>';
  return '<button type="button" class="artist-profile'+(selectedSoloArtist===name?' selected':'')+'" data-solo-artist="'+escapeHtml(name)+'" aria-pressed="'+(selectedSoloArtist===name)+'" title="View '+escapeHtml(name)+' statistics">'+photo+label+'</button>';
 }).join('')+'</div>';
 area.querySelector('#allSoloArtists')?.addEventListener('click',()=>{selectedSoloArtist=null;saveView();render()});
 area.querySelectorAll('[data-solo-artist]').forEach(button=>button.addEventListener('click',()=>{selectedSoloArtist=button.dataset.soloArtist;saveView();render()}));
 area.querySelectorAll('img[data-artist-photo]').forEach(img=>{
  const id=img.dataset.artistPhoto;
  if(!artistPhotoCache.has(id))artistPhotoCache.set(id,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent(id==='v8-debut'?'https://open.spotify.com/album/5HQrHtpGthJMePFhXT3jKS':'https://open.spotify.com/artist/'+id))
    .then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null));
  artistPhotoCache.get(id).then(url=>{if(url&&img.isConnected){img.src=url;img.classList.add('loaded')}else if(img.isConnected){img.style.display='none';img.insertAdjacentHTML('afterend','<span class="artist-profile-placeholder">💎</span>')}})
 });
}
function soloArtistTrackIds(s){
 if(!s||tab!=='solo'||!selectedSoloArtist)return trackIds(s);
 const artist=selectedSoloArtist.toLowerCase();
 const items=(catalog.solo||[]).filter(item=>String(item.artist||'').toLowerCase()===artist);
 const knownIds=new Set(items.flatMap(item=>item.tracks||[]));
 const names=new Set([...knownIds].map(id=>normTrackName(idName[id])).filter(Boolean));
 return trackIds(s).filter(id=>knownIds.has(id)||(isHistorical(s)&&(
   names.has(normTrackName(s.names?.[id]))||
   String(s.names?.[id]||'').toLowerCase().includes(artist)
 )));
}
function soloArtistRows(rows,s){
 if(tab!=='solo'||!selectedSoloArtist)return rows;
 const ids=new Set(soloArtistTrackIds(s));
 const artist=selectedSoloArtist.toLowerCase();
 const keys=new Set((catalog.solo||[]).filter(item=>String(item.artist||'').toLowerCase()===artist).map(item=>item.key));
 return rows.filter(row=>ids.has(row.id)||keys.has(row.artworkRelease)||String(row.name||'').toLowerCase().includes(artist));
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
 // Show the current period's gain even when the previous comparable period
 // has not been archived (particularly year-over-year comparisons).
 if(start)return {start,prevStart,prevEnd,range};
 // Only fall back to a full rolling period when the calendar boundary is absent.
 const length=rank.endsWith('weekly')?7:rank.endsWith('monthly')?30:365;
 const currentStart=shifted(s.date,-length);
 const previousStart=shifted(s.date,-length*2);
 const [rollingStart,rollingPreviousStart]=await Promise.all([get(currentStart),get(previousStart)]);
 return {start:rollingStart,prevStart:rollingPreviousStart,prevEnd:rollingStart,range};
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
// Every album and track uses the same date-aligned period comparison.
function sumPeriod(s,context,ids){if(!ids.length)return null;const values=ids.map(id=>periodGain(s,context,id));return values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null}
function sumPeriodChange(s,context,ids){if(!ids.length)return null;const values=ids.map(id=>periodChange(s,context,id));return values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null}
async function render(){const token=++renderToken;$('#ranking').innerHTML='<div class="empty">Loading saved streaming data…</div>';try{renderArtistProfiles();const s=await selectedSnapshot(),p=await prior(s),pp=await prior(p);const baseline=await periodBaseline(s);if(token!==renderToken)return;syncCalendar();restoreGroupNames(s,p);
 $('#date').textContent=s?.date||'—';const ids=s?trackIds(s):[];// Historical spreadsheets repeat songs under repackages and compilations,
 // so their raw row count is not the canonical distinct-song count.
 // The verified group archive has 227 songs with Tiny Light, 226 before it.
 const groupTrackCount=s&&tab==='group'&&isHistorical(s)
  ?(Object.values(s.names||{}).some(n=>/^tiny light$/i.test(String(n).trim()))?227:226)
  :ids.length;
 $('#count').textContent=s?fmt(groupTrackCount):'—';$('#listeners').textContent=fmt(audienceValue(s,'listeners'));const currentFollowers=audienceValue(s,'followers'),previousFollowers=audienceValue(p,'followers');
 $('#followers').textContent=fmt(currentFollowers);
 if(currentFollowers==null)$('#followersChange').textContent=previousFollowers!=null?'Current count unavailable · previous count '+fmt(previousFollowers)+' ('+(p?.date||'')+')':'Current follower count unavailable';const listenerNow=audienceValue(s,'listeners'),listenerPrev=audienceValue(p,'listeners'),followerNow=audienceValue(s,'followers'),followerPrev=audienceValue(p,'followers');const showDelta=(selector,now,prev)=>{const n=now!=null&&prev!=null&&p&&s&&((Date.parse(s.date)-Date.parse(p.date))/86400000===1)?now-prev:null;$(selector).textContent=n==null?'Change from previous day unavailable':(n>=0?'+':'−')+fmt(Math.abs(n))+' vs previous day';};showDelta('#listenersChange',listenerNow,listenerPrev);
 if(currentFollowers!=null)showDelta('#followersChange',followerNow,followerPrev);const grandId=s&&isHistorical(s)?Object.keys(s.tracks).find(id=>historicalKind(s,id)==='grand'):null;$('#total').textContent=s?fmt(grandId?s.tracks[grandId]:ids.reduce((a,id)=>a+s.tracks[id],0)):'—';const gains=s?ids.map(id=>safeGain(s,p,id)).filter(n=>n!=null):[];const grandGain=grandId?safeGain(s,p,grandId):null;const completeGain=s&&p&&gains.length===ids.length;
 const hasVerifiedTotal=grandGain!=null||completeGain;
 const partialGain=!hasVerifiedTotal&&gains.length?gains.reduce((a,b)=>a+b,0):null;
 $('#gain').textContent=hasVerifiedTotal?'+'+fmt(grandGain!=null?grandGain:gains.reduce((a,b)=>a+b,0)):partialGain!=null?'+'+fmt(partialGain)+'*':'—';
 const gainNote=$('#gain').nextElementSibling;
 if(gainNote)gainNote.textContent=hasVerifiedTotal?'Verified gain for '+s.date+' versus '+p.date:partialGain!=null?'* Partial gain for '+s.date+': '+gains.length+' of '+ids.length+' tracks could be compared with the imported '+(p?.date||'previous')+' snapshot. This does NOT mean Selenium missed the other tracks.':'Daily gain unavailable for '+(s?.date||'this date')+' — waiting for two comparable consecutive snapshots.';

 if(tab==='solo'&&selectedSoloArtist&&s){
  const memberIds=soloArtistTrackIds(s);
  const memberGains=memberIds.map(id=>safeGain(s,p,id)).filter(v=>v!=null);
  $('#count').textContent=fmt(memberIds.length);
  $('#total').textContent=memberIds.length?fmt(memberIds.reduce((sum,id)=>sum+Number(s.tracks[id]||0),0)):'—';
  $('#gain').textContent=memberIds.length&&memberGains.length===memberIds.length?'+'+fmt(memberGains.reduce((sum,v)=>sum+v,0)):'—';
  if(gainNote)gainNote.textContent=memberIds.length&&memberGains.length===memberIds.length?'Verified artist-specific daily gain':'Artist-specific daily gain unavailable until comparable snapshots exist';
 }
 $('#order').hidden=rank.startsWith('discography');const q=$('#search').value.toLowerCase();const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly'),discography=rank.startsWith('discography'),periodLabel=rank.endsWith('weekly')?'WEEKLY':rank.endsWith('monthly')?'MONTHLY':'YEARLY';const headers=document.querySelectorAll('.table-head span');headers[1].textContent=daily?'DAILY STREAMS ADDED':periodic?periodLabel+' STREAMS ADDED':'TOTAL STREAMS';headers[2].textContent=daily?'GAIN VS DAY BEFORE':periodic?rank.endsWith('weekly')?'GAIN VS LAST WEEK':rank.endsWith('monthly')?'GAIN VS LAST MONTH':'GAIN VS LAST YEAR':'GAIN VS YESTERDAY';document.querySelector('.table-head').classList.remove('period-ranking');$('#ranking').classList.remove('period-ranking');const rows=soloArtistRows(buildRows(s,p,pp,baseline),s).filter(x=>discography||x.name.toLowerCase().includes(q));$('#ranking').innerHTML=rows.length?rows.slice(0,discography?1000:250).map((r,i)=>`<div class="rank-row ${r.kind==='album'?'album-total-row':''}"><div class="track"><span class="place">${discography?(r.kind==='album'?'◆':'·'):String(i+1).padStart(2,'0')}</span>${`<span class="cover-slot">${artworkTrack(r)?`<img class="cover" data-cover-track="${artworkTrack(r)}" data-cover-fallback="${historicalAlbumCoverFallback(r)||artworkMap.tracks[coverKey(r.name)]?.id||artworkMap.albums[coverKey(r.name)]?.id||''}" alt="" loading="lazy"><span class="cover-placeholder" hidden>💎</span>`:`<span class="cover-placeholder">💎</span>`}</span>`}${streamTrackUrl(r)?`<a class="track-name track-stream-link" data-track-name-id="${r.id||''}" href="${streamTrackUrl(r)}" target="_blank" rel="noopener noreferrer" title="Stream ${escapeHtml(r.name)} on Spotify">${escapeHtml(r.name)}</a>`:`<span class="track-name" data-track-name-id="${r.id||''}">${escapeHtml(r.name)}</span>`}</div><div class="num">${periodic&&r.gain!=null?"+":""}${fmt(daily||periodic?r.gain:r.streams)}</div><div class="num change ${(daily||periodic?r.change:r.gain)<0?'negative':''}">${(daily||periodic?r.change:r.gain)==null?'—':((daily||periodic?r.change:r.gain)>=0?'+':'−')+fmt(Math.abs(daily||periodic?r.change:r.gain))}</div></div>`).join('') :'<div class="empty">'+(!s?'No saved data is available for this category.':periodic?'No comparable saved snapshots for this period. Try another date.':'No matching entries found.')+'</div>';fillArtwork()}catch(error){console.error('Dashboard render failed',error);if(token===renderToken)$('#ranking').innerHTML='<div class="empty">Unable to display this snapshot. Please select another saved date or refresh.</div>'}}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;$('#tabs').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render()});
function syncRank(){rank=rankType+'-'+$('#rankPeriod').value;render()}
$('#rankCategory').addEventListener('click',e=>{const button=e.target.closest('button[data-type]');if(!button)return;rankType=button.dataset.type;$('#rankCategory').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));syncRank()});
$('#rankPeriod').addEventListener('change',syncRank);

$('#order').addEventListener('change',e=>{sortOrder=e.target.value;render()});
$('#search').addEventListener('input',render);function availableDates(){return [...new Set([...dates,...(current[tab]?.date?[current[tab].date]:[])])].filter(d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&d>='2025-01-01').sort()}
function navigateDate(step){
 const available=availableDates(),today=selection==='latest'?(current[tab]?.date||available.at(-1)):selection;
 let i=available.indexOf(today);
 if(i<0)i=available.findIndex(d=>d>today);
 if(i<0)i=available.length;
 const target=available[Math.max(0,Math.min(available.length-1,i+step))];
 if(target){selection=target;saveView();syncCalendar();render()}
}
function syncCalendar(){
 const available=availableDates(),date=selection==='latest'?(current[tab]?.date||available.at(-1)):selection;
 const picker=$('#archiveDate');
 if(!picker)return;
 picker.value=date||'';
 picker.min=available[0]||'2025-01-01';picker.max=available.at(-1)||'';
 $('#prevDate').disabled=!date||available.indexOf(date)<=0;
 $('#nextDate').disabled=!date||available.indexOf(date)>=available.length-1;
 $('#dateNotice').textContent=selection==='latest'?'Latest confirmed snapshot':'Saved snapshot · '+(date||'');
}
$('#prevDate').addEventListener('click',()=>navigateDate(-1));
$('#nextDate').addEventListener('click',()=>navigateDate(1));
$('#latestDate').addEventListener('click',()=>{selection='latest';saveView();syncCalendar();render()});
$('#archiveDate').addEventListener('change',e=>{
 const requested=e.target.value,available=availableDates();
 if(!requested||!available.length)return;
 const target=available.includes(requested)?requested:available.reduce((best,d)=>Math.abs(Date.parse(d)-Date.parse(requested))<Math.abs(Date.parse(best)-Date.parse(requested))?d:best);
 selection=target;saveView();syncCalendar();render();
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
 [catalog,artworkMap]=await Promise.all([load('data/catalog.json'),load('data/artwork-map.json')]);catalog=catalog||{};
 // DREAMSCAPE is credited to Jeonghan × Joshua; reuse their seven existing
 // Spotify IDs instead of inventing a second set of stream counts.
 const jxjTracks=['5ZMx7DaPnVisUBLcrFcnCl','1dp1GI9YcKDoxrKBpp0u9F','4XBeSUSswrGhqYrwm3IS7A','1bGAA82A31CWflD6bqY5g6','2SWWDlOjKqgVvocnIfxId9','69umJ9yk5uay7PQmhBOKk8','2lDG4sMZwAC2TTlXNHMgA1'];
 if(Array.isArray(catalog.solo)&&!catalog.solo.some(item=>item.key==='jxj_dreamscape'))
  catalog.solo.push({key:'jxj_dreamscape',title:'DREAMSCAPE',description:"DREAMSCAPE (7 tracks): Like you, 12 o'clock, Outside, One plus one, Not personal, Coloring, No looking back",artist:'JxJ',tracks:jxjTracks});
 artworkMap=artworkMap||{tracks:{},albums:{}};buildNames();buildCoverLookup();buildFirstReleaseCovers();buildOriginalReleaseLookup();buildSpotifyTrackLinks();[current.group,current.solo]=await Promise.all([load('data/group.json'),load('data/solo.json')]);const manifest=await load('data/manifest.json')||{dates:[]};dates=[...new Set([...(manifest.dates||[]),...['group','solo'].map(t=>current[t]?.date).filter(Boolean)])].sort().reverse();syncCalendar();await render();
 requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,savedScroll)));
 // Reload live stream data every five minutes without losing the current view.
 setInterval(()=>{saveView();window.location.reload()},300000);
})();
