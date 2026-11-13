const $=s=>document.querySelector(s),fmt=n=>n==null?'—':Number(n).toLocaleString('en-US');
function followerCapturedLabel(observation){const captured=observation?.captured_at?new Date(observation.captured_at):null;return captured&&Number.isFinite(captured.getTime())?'Updated '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'}).format(captured):'Latest saved follower count'} let selectedSoloArtist=null;
let addedUnitArtistOrder=[];
let verifiedSoloFollowers={};
let soloAlbums=[],soloMedia={tracks:{},albums:{}},soloLegacyLinks={byIndex:{}},soloHistoryReference=null;
let artworkMap={tracks:{},albums:{}};let sortOrder='most';let tab='group',rank='tracks-daily',rankType='tracks',catalog={},current={},history={},dates=[],groupDates=[],soloDates=[],soloHistoricalDates=new Set(),selection='latest',period='week';
// To keep the selected view after refresh.
const viewStateKey='svt-dashboard-view-v2';
const activeDashboardModeKey='svt-dashboard-active-section-v1';
let activeDashboardMode='dashboard';
try{
 const requested=new URLSearchParams(location.search).get('view');
 if(requested==='all')activeDashboardMode='all';
 else if(requested==='group'||requested==='solo')activeDashboardMode='dashboard';
 else{
  const remembered=JSON.parse(sessionStorage.getItem(viewStateKey)||'null');
  const last=remembered?.activeView||sessionStorage.getItem(activeDashboardModeKey);
  if(last==='all')activeDashboardMode='all';
 }
}catch(e){console.warn('Unable to restore the active dashboard section',e)}

const savedArchiveKey='svt-selected-archive-date-v1';
try{selectedSoloArtist=sessionStorage.getItem('svt-selected-solo-artist')||null}catch{}
try{const remembered=localStorage.getItem(savedArchiveKey);if(remembered&&/^\d{4}-\d{2}-\d{2}$/.test(remembered))selection=remembered}catch{}
try{
 const saved=JSON.parse(sessionStorage.getItem(viewStateKey)||'null');
 if(saved){
  if(['group','solo'].includes(saved.tab))tab=saved.tab;
  if(['tracks','albums','discography'].includes(saved.rankType))rankType=saved.rankType;
  if(['daily','weekly','monthly','yearly','overall'].includes(saved.period))rank=rankType+'-'+saved.period;
  if(['most','least','newest','oldest','az','za'].includes(saved.sortOrder))sortOrder=saved.sortOrder;
  if(saved.selection==='latest'||/^\d{4}-\d{2}-\d{2}$/.test(saved.selection||''))selection=saved.selection;
  try{const remembered=localStorage.getItem(savedArchiveKey);if(remembered&&/^\d{4}-\d{2}-\d{2}$/.test(remembered))selection=remembered}catch{}
 }
 if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
}catch(e){console.warn('Could not restore saved view',e)}
// Explicit navigation from the combined All page takes precedence over
// an earlier saved tab, while preserving the rest of the user's settings.
try{
 const requestedTab=new URLSearchParams(location.search).get('view');
 if(requestedTab==='group'||requestedTab==='solo')tab=requestedTab;
}catch{}
let selectedPeriodKey=null;
try{selectedPeriodKey=JSON.parse(sessionStorage.getItem(viewStateKey)||'{}').selectedPeriodKey||null}catch{}
let savedScroll=0;
try{savedScroll=Number(JSON.parse(sessionStorage.getItem(viewStateKey)||'{}').scrollY)||0}catch{}
function saveView(){
 try{if(selectedSoloArtist)sessionStorage.setItem('svt-selected-solo-artist',selectedSoloArtist);else sessionStorage.removeItem('svt-selected-solo-artist')}catch{}
 try{if(selection==='latest')localStorage.removeItem(savedArchiveKey);else localStorage.setItem(savedArchiveKey,selection)}catch{}
 try{sessionStorage.setItem(viewStateKey,JSON.stringify({tab,rankType,period:$('#rankPeriod')?.value||'daily',sortOrder,selection,selectedPeriodKey,search:$('#search')?.value||'',activeView:activeDashboardMode,scrollY:window.scrollY}))}catch{}
}
window.addEventListener('pagehide',saveView);
let scrollSavePending=false;
window.addEventListener('scroll',()=>{if(!scrollSavePending){scrollSavePending=true;requestAnimationFrame(()=>{scrollSavePending=false;saveView()})}},{passive:true});
// Cache static history files instead of forcing new URLs for every visit.
const load=async p=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 // Always refresh live snapshots; history files may stay cached.
 const live=/^data\/(?:group|solo|manifest)\.json$/.test(p);
 try{const r=await fetch(p,{signal:controller.signal,cache:live?'no-store':'default'});return r.ok?await r.json():null}
 catch{return null}finally{clearTimeout(timer)}
};
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
  '1FlIEnP3DdFgeP3dhVfNZf':"247",
  '2UHaIBd2uiIFLZ9pgHMpJl':"Home - Japanese ver.",
  '74rpBQDDUA116sss0a0Tiy':"Snap Shoot - Japanese ver.",
  '2kDrUAONMhG6CbDGBkhdrY':"_WORLD (feat. Anne-Marie)",
  '6KfYVOicblNB8CaDZwbxiT':"Dirty Dancing (feat. JOSHUA, DK & DINO)",
  '3oTDi9MWC0JB39FcsLRon3':"SOS",
  '0xZ4WU5UfctiSeETi6pMEo':"God of Light Music",
  '6rp55IcEsq3nJgTc0kMa0h':"Rain",
  '5UpOKgvHCp0HkXDgxmWM7F':"1 TO 13",
  '1DQGGkXu9SIwWiK5uuBvcO':"Candy",
  '2LBoWyCgW1BBwNbtN61Ik6':"LOVE, MONEY, FAME (feat. DJ Khaled) - Timbaland Remix",
  '36LcCpAK7ColfpTTRNChhz':"LOVE, MONEY, FAME (feat. DJ Khaled) - Kenia OS Remix",

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
  'jxj_dreamscape':'DREAMSCAPE','jeonghan_g2':'DREAMSCAPE','joshua_g8':'DREAMSCAPE','jun_g10':'9','bss_g2':'SECOND WIND','bss_g4':'TELEPARTY',
  'jxw_g1':'THIS MAN','hxw_g1':'BEAM','cxm_g1':'HYPE VIBES',
  'dxs_g1':'Serenade','dino_g1':'ICARUS','v8':'V8','picheolin_g3':'吉BOARD (Gilboard)',
  'gilboard':'吉BOARD (Gilboard)','dino_g4':'吉BOARD (Gilboard)','the8_g12':'V8','vernon_g9':'V8'
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
 if(tab!=='group'||!s||isHistorical(s))return;
 // To keep the exact catalog song names instead of guessing from similar stream totals.
 for(const id of Object.keys(s.tracks)){
  if(!idName[id]&&s.names?.[id])idName[id]=s.names[id];
 }
}
// Keep a bounded cache and deduplicate simultaneous historical requests.
const archiveInFlight=new Map(),archiveLRU=[];
function useDatesForTab(){
 const source=tab==='solo'?soloDates:groupDates;
 dates=[...new Set([...source,...(current[tab]?.date?[current[tab].date]:[])])].sort().reverse();
}
function typeDates(type){return type==='solo'?soloDates:groupDates}
async function getDate(type,date){
 if(!date)return null;
 const key=type+'-'+date;
 if(Object.prototype.hasOwnProperty.call(history,key))return history[key];
 if(archiveInFlight.has(key))return archiveInFlight.get(key);
 const path=type==='solo'&&soloHistoricalDates.has(date)
  ?'solo-'+date+'.json':'data/history/'+key+'.json';
 const request=load(path).then(snapshot=>{
  if(snapshot&&snapshot.date===date&&snapshot.tracks&&typeof snapshot.tracks==='object'){
   history[key]=snapshot;archiveLRU.push(key);
   while(archiveLRU.length>56)delete history[archiveLRU.shift()];
   return snapshot;
  }
  return null;
 }).finally(()=>archiveInFlight.delete(key));
 archiveInFlight.set(key,request);
 return request;
}
async function latest(type){
 if(current[type]){
  const archived=await getDate(type,current[type].date);
  if(archived&&archived.date===current[type].date&&Object.keys(archived.tracks||{}).length===Object.keys(current[type].tracks||{}).length)
   return {...current[type],...archived};
  return current[type];
 }
 for(const d of dates.slice(0,14)){const snapshot=await getDate(type,d);if(snapshot)return snapshot}
 return null;
}
function periodKey(date){
 const d=utcDate(date);
 if(rank.endsWith('weekly')){
  const monday=shifted(date,-((d.getUTCDay()+6)%7));
  return 'W:'+monday;
 }
 if(rank.endsWith('monthly'))return 'M:'+date.slice(0,7);
 if(rank.endsWith('yearly'))return 'Y:'+date.slice(0,4);
 return null;
}
function syncPeriodPicker(){
 const picker=$('#periodPicker');
 if(!picker)return;
 const periodic=['weekly','monthly','yearly'].some(p=>rank.endsWith(p));
 $('#dailyPickerWrap').hidden=rank.endsWith('overall');
 // One calendar works for daily, weekly, monthly and yearly navigation.
 $('#archiveDate').hidden=false;
 picker.hidden=true;
 const dateLabel=document.querySelector('#dailyPickerWrap label');
 if(dateLabel)dateLabel.textContent=rank.endsWith('weekly')?'STREAMING WEEK':rank.endsWith('monthly')?'STREAMING MONTH':rank.endsWith('yearly')?'STREAMING YEAR':'STREAMING DATE';
 if(!periodic)return;
 const available=[...new Set([...dates,...(current[tab]?.date?[current[tab].date]:[])].filter(d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&d>='2025-01-01').map(periodKey).filter(Boolean))].sort();
 const latestDate=current[tab]?.date||dates[0];
 const defaultKey=(selection!=='latest'&&availableDates().includes(selection)?periodKey(selection):latestDate?periodKey(latestDate):available[0]);
 if(!selectedPeriodKey||!available.includes(selectedPeriodKey)||selectedPeriodKey[0]!==defaultKey?.[0])selectedPeriodKey=defaultKey;
 const label=k=>{
  if(k.startsWith('W:')){
   const start=k.slice(2),end=shifted(start,6);
   return new Date(start+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+' – '+new Date(end+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  }
  if(k.startsWith('M:'))return new Date(k.slice(2)+'-01T00:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  return k.slice(2);
 };
 picker.innerHTML=available.map(k=>'<option value="'+k+'">'+label(k)+'</option>').join('');
 picker.value=selectedPeriodKey;
}
// To use the corrected Candy total without overwriting the original collector snapshot.
function correctedSnapshot(saved){return saved;}
async function selectedSnapshot(){
 if(['weekly','monthly','yearly'].some(p=>rank.endsWith(p))&&selectedPeriodKey){
  const matching=[...new Set([...dates,...(current[tab]?.date?[current[tab].date]:[])])].filter(d=>periodKey(d)===selectedPeriodKey).sort().reverse();
  for(const d of matching){const saved=await getDate(tab,d);if(saved)return correctedSnapshot(saved)}
  return null;
 }
 if(selection==='latest')return correctedSnapshot(await latest(tab));
 const target=dates.includes(selection)?selection:dates.find(d=>d<=selection);
 return correctedSnapshot(await getDate(tab,target));
}
async function prior(s){if(!s)return null;const yesterday=shifted(s.date,-1);return getDate(tab,yesterday)}
function normTrackName(name){
 return String(name||'').toLowerCase().normalize('NFKC')
  .replace(/\b(\d+)\.0\b/g,'$1')
  .replace(/[^a-z0-9]/g,'');
}
function comparablePrevious(s,p,id){
 if(!s||!p||s.tracks?.[id]==null)return null;
 // Historical workbooks insert and remove rows. Match within the same
 // member's section and the same title, not the previous sheet's row number.
 if(tab==='solo'&&isHistorical(s)&&isHistorical(p)){
  const nowSections=soloLegacySections(s)||{};
  const priorSections=soloLegacySections(p)||{};
  const owner=Object.keys(nowSections).find(name=>(nowSections[name]||[]).some(row=>row.id===id));
  if(!owner)return null;
  const nowRow=(nowSections[owner]||[]).find(row=>row.id===id);
  const kind=historicalKind(s,id);
  const key=soloHistoricalNameKey(nowRow.name);
  const sourceMatches=(nowSections[owner]||[]).filter(row=>
   historicalKind(s,row.id)===kind&&soloHistoricalNameKey(row.name)===key);
  const previousMatches=(priorSections[owner]||[]).filter(row=>
   historicalKind(p,row.id)===kind&&soloHistoricalNameKey(row.name)===key);
  if(!previousMatches.length||previousMatches.length!==sourceMatches.length)return null;
  const position=sourceMatches.findIndex(row=>row.id===id);
  const prior=previousMatches[position];
  return prior&&Number.isFinite(prior.value)?{id:prior.id,value:prior.value}:null;
 }
 // Live solo IDs and archived spreadsheet row identifiers are different.
 // Match by the explicit Spotify-ID-to-workbook mapping, not loose titles.
 if(tab==='solo'&&!isHistorical(s)&&isHistorical(p)){
  const verified=verifiedSoloLegacyValue(p,id);
  if(verified&&s.tracks[id]>=verified.value)return verified;
 }
 // The 2026-11-05 workbook misspells Anne-Marie as Anne-Marrie.
 // Match the verified Spotify track ID to that exact legacy row, preserving
 // the recorded stream totals and day-over-day comparisons.
 if(id==='2kDrUAONMhG6CbDGBkhdrY'&&isHistorical(p)){
  const legacyId='legacy:worldfeatannemarrie:213';
  if(p.tracks?.[legacyId]!=null)return {id:legacyId,value:p.tracks[legacyId]};
 }
 // Verified November 5 spreadsheet titles omit the producer/featured-artist
 // credits for these two HAPPY BURSTDAY tracks. Their Spotify IDs and
 // historical row IDs are confirmed; do not treat the title suffix as a new song.
 if(isHistorical(p)){
  const verifiedAliases={
   '2B0l8kFr4PzxH6gqX3NIoi':'legacy:badinfluence:337',
   '3ESkEsiPkaXl0CCRUMGkIk':'legacy:damagehoshisolo:342'
  };
  const legacyId=verifiedAliases[id];
  if(legacyId&&p.tracks?.[legacyId]!=null)return {id:legacyId,value:p.tracks[legacyId]};
 }
 // November 6's canonical tracks all have explicit, preserved November 5
 // workbook mappings. Use those recorded identifiers at the exact boundary
 // even where display titles differ in punctuation, credits or spelling.
 // Never extrapolate this shortcut to earlier archive dates.
 if(isHistorical(p)&&p.date==='2026-11-05'&&s.date==='2026-11-06'){
  const mapped=s.baseline_ids_2026_11_05?.[id];
  if(mapped&&p.tracks?.[mapped]!=null&&historicalKind(p,mapped)==='track'&&
     Number.isFinite(s.tracks[id])&&s.tracks[id]>=p.tracks[mapped])
   return {id:mapped,value:p.tracks[mapped]};
 }
 // Verified legacy title aliases in the imported SEVENTEEN workbook.
 // These are fixed Spotify-ID-to-row-ID links, not fuzzy substring guesses.
 if(tab==='group'&&isHistorical(p)){
  const legacyAliases={
   '2kDrUAONMhG6CbDGBkhdrY':'worldfeatannemarrie',
   '6KfYVOicblNB8CaDZwbxiT':'dirtydancingfearjoshuadkdino',
   '3oTDi9MWC0JB39FcsLRon3':'sosprodmarshmello',
   '0xZ4WU5UfctiSeETi6pMEo':'golm',
   '2B0l8kFr4PzxH6gqX3NIoi':'badinfluence',
   '3ESkEsiPkaXl0CCRUMGkIk':'damagehoshisolo'
  };
  const legacyId=s.baseline_ids_2026_11_05?.[id]||current.group?.baseline_ids_2026_11_05?.[id];
  if(legacyAliases[id]&&legacyId&&
     normTrackName(p.names?.[legacyId]).startsWith(legacyAliases[id])&&
     historicalKind(p,legacyId)==='track'&&Number.isFinite(p.tracks[legacyId]))
   return {id:legacyId,value:p.tracks[legacyId]};
 }
 // Imported spreadsheet IDs stay stable across the historical workbook.
 // The verified Nov 5 ID mapping is therefore valid for earlier months too.
 if(isHistorical(p)&&s.baseline_ids_2026_11_05?.[id]){
  const priorId=s.baseline_ids_2026_11_05[id];
  const expectedName=normTrackName(s.names?.[id]||idName[id]);
  const previousName=normTrackName(p.names?.[priorId]);
  // Historical sheets sometimes reassign the same ID to a different song.
  // Only trust the saved mapping when the recording name still matches.
  const canonicalHistoricalName=n=>normTrackName(String(n||'')
   .replace(/\s*\((?:prod\.?\s*by|feat\.?|ft\.?)\s+[^)]*\)/gi,'')
   .replace(/\s*\b(?:feat\.?|ft\.?)\s+.*$/i,''));
  if(p.tracks[priorId]!=null&&historicalKind(p,priorId)==='track'&&expectedName&&
    (previousName===expectedName||
     (canonicalHistoricalName(s.names?.[id]||idName[id])===canonicalHistoricalName(p.names?.[priorId])&&
      canonicalHistoricalName(p.names?.[priorId]).length>=5)))
   return {id:priorId,value:p.tracks[priorId]};
 }
 // To use the same Spotify ID when both snapshots contain it.
 if(p.tracks?.[id]!=null){
  const kindNow=historicalKind(s,id),kindBefore=historicalKind(p,id);
  // A spreadsheet may reuse a Spotify ID for a different song on another day.
  // Never treat that as a real stream gain.
  const nowName=normTrackName(s.names?.[id]||idName[id]);
  const oldName=normTrackName(p.names?.[id]||idName[id]);
  if(kindNow===kindBefore&&(kindNow==='grand'||kindNow==='album'||!isHistorical(p)||!nowName||!oldName||nowName===oldName))
   return {id,value:p.tracks[id]};
  // Fall through to the title-based match for reassigned historical IDs.
 }
 // To match legacy spreadsheet IDs only when the song title is unique.
 const name=normTrackName(s.names?.[id]||idName[id]);
 if(!name||name===normTrackName(id))return null;
 // Match harmless credit differences, but never merge remixes, live versions,
 // instrumentals or different recordings merely because their base title agrees.
 const comparableTitle=n=>normTrackName(String(n||'')
  .replace(/\\s*\\((?:prod\\.?\\s*by|feat\\.?|ft\\.?)\\s+[^)]*\\)/gi,'')
  .replace(/\\s*\\b(?:feat\\.?|ft\\.?)\\s+.*$/i,''));
 const normalized=comparableTitle(s.names?.[id]||idName[id]);
 const matches=Object.keys(p.tracks||{}).filter(k=>historicalKind(p,k)==='track'&&
  (normTrackName(p.names?.[k])===name||
   (normalized.length>=5&&comparableTitle(p.names?.[k])===normalized)));
 if(!matches.length)return null;
 // To treat repeated spreadsheet rows for the same recording as one baseline.
 const values=[...new Set(matches.map(k=>p.tracks[k]))];
 if(values.length===1)return {id:matches[0],value:values[0]};
 // The spreadsheet sometimes has distinct recordings sharing a title.
 // Resolve by the unique plausible one-day baseline, not by the title alone.
 const days=Math.max(1,(Date.parse(s.date)-Date.parse(p.date))/86400000);
 const plausible=values.filter(v=>s.tracks[id]>=v&&s.tracks[id]-v<=Math.max(150000*days,s.tracks[id]*0.002*days));
 if(plausible.length!==1)return null;
 const key=matches.find(k=>p.tracks[k]===plausible[0]);
 return {id:key,value:plausible[0]};
}
function safeGain(s,p,id){
 if(!p||!s||!s.tracks||!p.tracks||s.tracks[id]==null)return null;
 const prev=comparablePrevious(s,p,id);
 if(!prev||(s.anomalies||[]).includes(id)||(p.anomalies||[]).includes(prev.id))return null;
 // A three-attempt zero is a missing observation, not a real cumulative counter.
 if((!isHistorical(s)&&s.tracks[id]===0)||(!isHistorical(p)&&prev.value===0)||
    (s.unavailable_tracks||[]).includes(id)||(p.unavailable_tracks||[]).includes(prev.id))return null;
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
 if(/\bTOTAL STREAMS\s*$/i.test(name)||/^\s*picheolin\s+streams\s*$/i.test(name))return 'grand';
 if(/monthly\s+listeners?|followers?/i.test(name))return 'audience';
 if(/\b(?:total|tota;)\s*:?$/i.test(name))return 'album';
 return 'track';
}
function isHistorical(s){return s?.source==='historical spreadsheet'}
function audienceValue(s,kind){
 if(!s)return null;
 // Followers were first tracked on November 6, 2026. Never use older
 // spreadsheet follower rows or display a made-up historical baseline.
 // Show any follower values actually saved in an archive snapshot, regardless of date.
 // Never infer a follower count when the historical source has none.
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

/* Each historical member has their own listener/follower row in the workbook.
   Do not use Jeonghan's audience metrics for another member or for all units. */
function soloArtistAudienceValue(snapshot,artist,kind){
 if(!snapshot||['JxJ','V8'].includes(artist))return null;
 const owner=String(artist||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 if(!isHistorical(snapshot)){
  const id=soloArtists.find(([name])=>name.toLowerCase()===artist.toLowerCase())?.[1];
  const value=kind==='listeners'?snapshot.listeners?.[id]:snapshot.followers?.[id];
  return value!=null&&Number.isFinite(Number(value))?Number(value):null;
 }
 const suffix=kind==='listeners'?/monthlylisteners?$/i:/followers?$/i;
 for(const [id,name] of Object.entries(snapshot.names||{})){
  const normalized=String(name).toLowerCase().replace(/[^a-z0-9]/g,'');
  if(normalized.startsWith(owner)&&suffix.test(normalized)){
   const n=snapshot.tracks?.[id];
   if(Number.isFinite(Number(n))&&n!=null)return Number(n);
  }
 }
 return null;
}

function displayTrackName(name){
 const raw=String(name||'').trim().replace(/&#x20;|&nbsp;/gi,' ').trim(),key=coverKey(raw);
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
  'power of love holiday ver':'Home - Japanese ver.',
  'power of love inst':'Snap Shoot - Japanese ver.',
  'hitorijanai korean ver':'Hitorijanai (Korean Ver.)',
  '24h korean ver':'24H (Korean Ver.)'
 };
 if(/^9(?:\.0+)?$/.test(raw))return '9';
 if(/^mi[ -]?cheo mi[ -]?cheo(?:\s+tota;?:?)?$/i.test(raw))return 'Mi-cheo Mi-cheo';
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
 // A Japanese "Single Album" is an album release, not a standalone single.
 if(/remix|ost|digital single/.test(n)||(/\bsingle\b/.test(n)&&!/\bsingle\s+album\b/.test(n)))return false;
 return /always yours|17 is right here|sector 17|love & letter repackage|director.s cut|\balbum\b|\brepackage\b|\bmini\b|\bep\b|\bheng\b|\bsemicolon\b|\bserenade\b|\bdreamscape\b|^9$|^v8$|\bthis man\b|\bbeam\b|\bsecond wind\b|\bteleparty\b|\bhype vibes\b|\bgilboard\b/.test(n);
}
function uniqueRows(rows){
 const seen=new Set();
 return rows.filter(row=>{
  // Spotify may expose separate track IDs for the same recording. A title
  // alone is not enough to merge versions, and matching counts alone are
  // not enough either. Keep unidentified IDs distinct.
  const title=normTrackName(row.name);
  const hasVerifiedTitle=title&&title!==normTrackName(row.id||'');
  // Never discard distinct Spotify IDs just because titles and counts match.
  // Alternate versions, OST editions and collaborations can share both.
  const key=row.id?'id:'+row.id:'title:'+title+'|'+row.streams;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
// Confirmed November 6 alias pairs: different catalog IDs carrying the
// same recording's cumulative stream count. Only collapse a pair while its
// saved values agree; never infer duplicates from matching numbers alone.
const groupStreamAliases=[["2kDrUAONMhG6CbDGBkhdrY","2TLzrymJ9lpH2wXp1ub5Aj"],["6I2tqFhk8tq69iursYxuxd","3g9z9amouOxjEZve1SpSTE"],["1Rrj7KyS2R6SP9CQMDJW1w","3nAUdBQxle8l1EeOxW3m0R"],["6LnEoRQKMcaFTR5UvaKuBy","4CAK2Dmo5YVGDQxs789pbx"],["1117juaaAkSIUsQxTmmcKM","2mFCN72V3rTq1BT4WWddIF"],["2UE9XGbAzicJIyo4bB6sqM","743yOACnWcrrijTnWdT5YN"],["4MTNimMDRyFZv37Thcktwa","6KNp9wSUGYhtbE33su6xZv"],["3I5W8iA8iZAyO62UVceK3F","2r3aqjJhVFc5JjQAaFKNdR"],["63jDEQCIg1YJLYeiqKJxFg","0C49m3uL232ZGOwrEZucxS"]];
// These two original singles were reissued unchanged on Gilboard.
// Their distinct Spotify IDs have the SAME observed per-day stream counts,
// so counting both copies inflates Picheolin and combined solo/unit totals.
// Keep the source snapshots and both discography release entries intact.
const soloReissueAliases=new Map([
 ['3Y0ZwgYVHuwbW0JGjsYodR','5W1bn5PzFgKok4GAZ1JUAw'], // Love Sick
 ['594CTGIIVVTitwRhQJcWgM','34wTGQ1yV5XtrSMR5dMLWY'] // Mi-cheo Mi-cheo
]);
const canonicalSoloRecordingId=id=>soloReissueAliases.get(id)||id;
function uniqueSoloSpotifyIds(ids,s){
 const listed=new Set(ids),seen=new Set();
 return ids.filter(id=>{
  const canonical=canonicalSoloRecordingId(id);
  // Only collapse two live Spotify IDs where the SAVED counts agree.
  // For Excel snapshots, verified workbook-to-Spotify links provide identity.
  const verifiedSame=isHistorical(s)||!s||
   (Number.isFinite(s.tracks?.[id])&&s.tracks[id]===s.tracks?.[canonical]);
  if(canonical!==id&&listed.has(canonical)&&verifiedSame)return false;
  const key=verifiedSame?canonical:id;
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
function trackIds(s){
 if(tab==='group'&&Array.isArray(s?.canonical_track_ids))
  return s.canonical_track_ids.filter(id=>s.tracks?.[id]!=null);
 const ids=Object.keys(s?.tracks||{}).filter(id=>(!isHistorical(s)||historicalKind(s,id)==='track')&&!/^\s*picheolin\s+streams\s*$/i.test(s.names?.[id]||id));
 // Distinct Spotify IDs are distinct solo/unit recordings, even when titles match.
 if(tab==='solo'&&!isHistorical(s))return uniqueSoloSpotifyIds(ids,s);
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
function dailyComparison(s,p,pp,ids){
 const values=ids.map(id=>dailyChange(s,p,pp,id));
 const valid=values.filter(value=>value!=null);
 return {value:valid.length?valid.reduce((total,value)=>total+value,0):null,
  partial:valid.length<ids.length,matched:valid.length,total:ids.length};
}
function sumDailyChange(s,p,pp,ids){return dailyComparison(s,p,pp,ids).value}
function dailyGainSummary(s,p,ids){
 const values=ids.map(id=>safeGain(s,p,id));
 const valid=values.filter(value=>value!=null);
 return {value:valid.length?valid.reduce((total,value)=>total+value,0):null,
  partial:valid.length<ids.length,matched:valid.length,total:ids.length};
}
function sumDaily(s,p,ids){return dailyGainSummary(s,p,ids).value}
function formatDiscographyAlbumName(name){
 const raw=String(name||'').replace(/\s*Total\s*:?$/i,'').trim();
 if(/^icarus(?:\s+(?:single|album|ost))?$/i.test(raw))return 'ICARUS';
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

/* Legacy spreadsheet supplied release-total rows. Prefer those exact totals
   and their historical deltas to partially matched catalog track sums. */
function historicalAlbumAggregate(snapshot,releaseKey,variant='full'){
 if(!isHistorical(snapshot)||!releaseKey)return null;
 const matches=Object.keys(snapshot.tracks||{}).filter(id=>{
  if(historicalKind(snapshot,id)!=='album'||historicalAlbumReleaseKey(snapshot.names?.[id])!==releaseKey)return false;
  const label=String(snapshot.names?.[id]||'');
  if(variant==='new')return /\bnew\s+tracks?\b/i.test(label);
  if(variant==='original')return /\boriginal\s+tracks?\b/i.test(label);
  return !/\b(?:new|original)\s+tracks?\b/i.test(label);
 });
 return matches.length===1?matches[0]:null;
}
function archivedAlbumMetrics(s,p,pp,baseline,id){
 if(!id)return null;
 const periodic=['weekly','monthly','yearly'].some(part=>rank.endsWith(part));
 return {streams:s.tracks[id],
  gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),
  gainPartial:periodic&&incompleteObservedPeriod(s,baseline,id),
  change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id),
  changePartial:periodic&&incompletePeriodComparison(s,baseline,id)};
}

function discographyRows(s,p,pp,baseline){
 if(!s)return [];
 if(tab==='solo'&&isHistorical(s))return soloLegacyRows(s,p,pp,baseline,'discography');
 const periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly');
 if(isHistorical(s)&&tab==='group'){
  // Render historical streams against the SAME catalog, release sequence,
  // album groupings and 17 IS RIGHT HERE layout as November 6, 2026.
  // Only stream values vary by snapshot. Missing recordings stay unknown.
  const remap=snapshot=>{
   if(!snapshot||!isHistorical(snapshot))return snapshot;
   const lookup=new Map();
   const creditKey=name=>normTrackName(String(name||'')
    .replace(/\s*\((?:prod\.?(?:\s*by)?|feat\.?|ft\.?)\s+[^)]*\)/gi,'')
    .replace(/\s*\b(?:feat\.?|ft\.?)\s+.*$/i,''));
   const creditLookup=new Map();
   for(const [id,value] of Object.entries(snapshot.tracks||{})){
    if(historicalKind(snapshot,id)!=='track'||!Number.isFinite(Number(value)))continue;
    const name=normTrackName(snapshot.names?.[id]||'');
    if(name){
     if(!lookup.has(name))lookup.set(name,[]);
     lookup.get(name).push({id,value});
    }
    const credit=creditKey(snapshot.names?.[id]);
    // "SOS (Prod. Marshmello)" is an explicitly verified short-title match.
    if(credit.length>=5||credit==='sos'){
     if(!creditLookup.has(credit))creditLookup.set(credit,[]);
     creditLookup.get(credit).push({id,value});
    }
   }
   const tracks={...snapshot.tracks};
   const names={...snapshot.names};
   const canonical=current.group||{};
   const baselineIds=canonical.baseline_ids_2026_11_05||{};
   for(const [id,name] of Object.entries(canonical.names||{})){
    if(!/^[a-zA-Z0-9]{22}$/.test(id))continue;
    if(snapshot.tracks[id]!=null&&normTrackName(snapshot.names?.[id])===normTrackName(name)){
     tracks[id]=snapshot.tracks[id];names[id]=name;continue;
    }
    const exact=lookup.get(normTrackName(name))||[];
    const credited=creditLookup.get(creditKey(name))||[];
    // The spreadsheet repeats certain identical recordings in album and
    // anthology sections. Reuse a title only when EVERY duplicate has the
    // exact same saved total; different totals remain different recordings.
    const uniqueRecording=entries=>entries.length&&
     new Set(entries.map(row=>row.value)).size===1?entries[0]:null;
    let match=uniqueRecording(exact);
    if(!match&&exact.length===0)match=uniqueRecording(credited);
    if(!match){
     const legacyId=baselineIds[id];
     if(legacyId&&snapshot.tracks[legacyId]!=null&&historicalKind(snapshot,legacyId)==='track'){
      const oldName=snapshot.names?.[legacyId];
      const verifiedAlias={
       '2kDrUAONMhG6CbDGBkhdrY':'worldfeatannemarrie',
       '6KfYVOicblNB8CaDZwbxiT':'dirtydancingfearjoshuadkdino',
       '0xZ4WU5UfctiSeETi6pMEo':'golm',
       '2B0l8kFr4PzxH6gqX3NIoi':'badinfluence',
       '3ESkEsiPkaXl0CCRUMGkIk':'damagehoshisolo'
      };
      const legacyName=normTrackName(oldName);
      const aliasMatches=verifiedAlias[id]&&legacyName.startsWith(verifiedAlias[id]);
      if(normTrackName(oldName)===normTrackName(name)||
         (creditKey(oldName).length>=5&&creditKey(oldName)===creditKey(name))||
         aliasMatches)
       match={id:legacyId,value:snapshot.tracks[legacyId]};
     }
    }
    if(match){tracks[id]=match.value;names[id]=name;}
   }
   // Verified duplicate Spotify IDs in the live collector reference the
   // same recording. Copy their historic value ONLY if the primary was
   // matched and the two modern IDs still have identical recorded totals.
   // This avoids confusing original _WORLD with the Anne-Marie edition.
   for(const [primary,alias] of groupStreamAliases){
    if(tracks[alias]!=null||tracks[primary]==null)continue;
    if(canonical.tracks?.[primary]!==canonical.tracks?.[alias])continue;
    tracks[alias]=tracks[primary];
    names[alias]=canonical.names?.[alias]||canonical.names?.[primary]||'';
   }
   return {...snapshot,tracks,names};
  };
  s=remap(s);p=remap(p);pp=remap(pp);
  // Period baselines retain their original archive values; translate their
  // snapshots as well rather than treating missing records as zero.
  if(baseline){
   // Preserve absent observation arrays: [] is truthy and previously made
   // regular monthly/yearly periods skip their real start/end snapshots.
   // Only sparse-archive fallbacks supply observedPairs explicitly.
   const converted={...baseline,
    start:remap(baseline.start),prevStart:remap(baseline.prevStart),prevEnd:remap(baseline.prevEnd)};
   if(Array.isArray(baseline.observedPairs))
    converted.observedPairs=baseline.observedPairs.map(([now,before])=>[remap(now),remap(before)]);
   if(Array.isArray(baseline.previousObservedPairs))
    converted.previousObservedPairs=baseline.previousObservedPairs.map(([now,before])=>[remap(now),remap(before)]);
   // Sparse-month/track-anomaly verification pairs ALSO require the same
   // legacy-ID-to-Spotify-ID mapping. Leaving them raw made individual
   // discography track gains disappear while album subtotals survived.
   if(Array.isArray(baseline.fallbackPairs))
    converted.fallbackPairs=baseline.fallbackPairs.map(([now,before])=>[remap(now),remap(before)]);
   if(Array.isArray(baseline.previousFallbackPairs))
    converted.previousFallbackPairs=baseline.previousFallbackPairs.map(([now,before])=>[remap(now),remap(before)]);
   baseline=converted;
  }
 }

 const daily=rank.endsWith('daily');
 const rows=[];
 const releasesByKey=new Map((catalog[tab]||[]).map(item=>[item.key,item]));
 const combined={
  g7:{keys:['g6','g7'],name:'LOVE & LETTER (Repackage) — All Tracks'},
  g37:{keys:['g36','g37'],name:'SECTOR 17 — All Tracks'}
 };
 // Keep Units & Solo discography in the same member/release sequence as
 // the latest 11/26 tab of the uploaded Unit & Solo Spotify Streams workbook.
 // Newer catalog releases stay after their member's spreadsheet entries.
 const soloSheetArtistOrder=['S.Coups','Jeonghan','Joshua','Jun','Hoshi','Wonwoo','Woozi','Dokyeom','Mingyu','The8','Seungkwan','Vernon','Dino','Bss','Jxw','Hxw','Cxm','Dxs','V8','Picheolin','JxJ',...addedUnitArtistOrder];
 const soloSheetReleaseOverrides={
  the8_g4:3,the8_g3:4
 };
 const duplicateAlbumSections=new Set(['jeonghan_g2','joshua_g8','the8_g12','vernon_g9','dino_g4','picheolin_g3']);
 const releasesForDiscography=tab==='solo'?[...(catalog.solo||[])].filter(x=>{
  const owner=String(x.artist||'').toLowerCase();
  if(selectedSoloArtist){
   const selected=selectedSoloArtist.toLowerCase();
   // A shared Spotify track ID is not permission to list another artist's
   // entire release. Vernon participates in 54321 on The8's STARDUST,
   // but his discography should contain his own single entry, not the
   // STARDUST album and the same recording a second time.
   // The one additional member-unit appearance without a separate member
   // catalog release is Wonwoo's credited JxW tracks.
   return owner===selected||(selected==='wonwoo'&&x.key==='jxw_g1');
  }
  return !duplicateAlbumSections.has(x.key);
 }).sort((a,b)=>{
  const ai=soloSheetArtistOrder.findIndex(n=>n.toLowerCase()===String(a.artist).toLowerCase());
  const bi=soloSheetArtistOrder.findIndex(n=>n.toLowerCase()===String(b.artist).toLowerCase());
  // Each member's release chronology must follow verified calendar dates,
  // not Java collector groups (which can put newer singles before old songs).
  if(!selectedSoloArtist&&ai!==bi)return (ai<0?999:ai)-(bi<0?999:bi);
  const aDate=String(a.release_date||''),bDate=String(b.release_date||'');
  if(aDate!==bDate){
   if(!/^20\\d{2}-\\d{2}-\\d{2}$/.test(aDate))return 1;
   if(!/^20\\d{2}-\\d{2}-\\d{2}$/.test(bDate))return -1;
   return aDate.localeCompare(bDate);
  }
  const order=item=>soloSheetReleaseOverrides[item.key]??(catalog.solo||[]).filter(x=>x.artist===item.artist).findIndex(x=>x.key===item.key)+1;
  return order(a)-order(b);
 }):catalog[tab]||[];
 for(const item of releasesForDiscography){
  // LIMBO is one two-version release. Show its Chinese and Korean recordings
  // together, then one combined total; never show two identical album cards.
  if(tab==='solo'&&item.key==='jun_g4Korean')continue;
  if(tab==='solo'&&item.key==='jun_g4Chinese'){
   const versions=['jun_g4Chinese','jun_g4Korean']
    .map(key=>(catalog.solo||[]).find(release=>release.key===key)).filter(Boolean);
   const limboIds=[...new Set(versions.flatMap(release=>release.tracks||[]))];
   for(const id of limboIds){
    rows.push({id,name:soloMedia.tracks?.[id]?.title||displayTrackName(s.names?.[id]||idName[id]||id),
     artworkRelease:item.key,releaseDate:item.release_date,
     streams:Number.isFinite(s.tracks?.[id])&&s.tracks[id]>=0?s.tracks[id]:null,
     gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),
     change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id),
     kind:'track',releaseOrder:rows.length});
   }
   const totals=limboIds.map(id=>s.tracks?.[id]);
   const gains=limboIds.map(id=>periodic?periodGain(s,baseline,id):safeGain(s,p,id));
   const changes=limboIds.map(id=>periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id));
   rows.push({name:'LIMBO',artworkRelease:item.key,
    historyReleases:['jun_g4Chinese','jun_g4Korean'],releaseDate:item.release_date,
    streams:totals.length===2&&totals.every(n=>Number.isFinite(n)&&n>0)?totals.reduce((a,b)=>a+b,0):null,
    gain:gains.length===2&&gains.every(n=>n!=null)?gains.reduce((a,b)=>a+b,0):null,
    change:changes.length===2&&changes.every(n=>n!=null)?changes.reduce((a,b)=>a+b,0):null,
    kind:'album',releaseOrder:rows.length});
   continue;
  }
  // Gilboard's duplicate catalog entries belong to Picheolin's discography.
  if(tab==='solo'&&item.key==='sharedTracks')continue;
  const combo=tab==='group'?combined[item.key]:null;
  const ids=[...new Set((combo?combo.keys.flatMap(k=>releasesByKey.get(k)?.tracks||[]):item.tracks)||[])];
  if(!ids.length)continue;
  const streams=ids.every(id=>Number.isFinite(s.tracks?.[id])&&s.tracks[id]>=0)?ids.reduce((a,id)=>a+s.tracks[id],0):null;
  const observedGains=periodic?ids.map(id=>periodGain(s,baseline,id)).filter(v=>v!=null):[];
  const partialGain=periodic&&observedGains.length>0&&observedGains.length<ids.length;
  const gain=periodic?(observedGains.length?observedGains.reduce((a,b)=>a+b,0):null):sumDaily(s,p,ids);
  const dayChange=sumDailyChange(s,p,pp,ids);
  // A saved workbook total has the authoritative historical album count.
  // Do not apply the full ALWAYS YOURS/17 IS RIGHT HERE total to smaller
  // anthology subdivisions (which intentionally contain fewer tracks).
  const historicalMode=['g6','g36','g43'].includes(item.key)?'new':item.key==='g49'?'original':'full';
  const sourceKey=tab==='group'&&item.key!=='g44'&&!/^g5[0-4]$/.test(item.key)
   ?historicalAlbumAggregate(s,item.key==='g6'?'g7':item.key==='g36'?'g37':historicalAlbumReleaseKey(item.title)||item.key,historicalMode)
   :null;
  const savedAlbum=archivedAlbumMetrics(s,p,pp,baseline,sourceKey);
  const canonicalAlbum=tab==='solo'?soloAlbums.find(a=>a.key===item.key):null;
  const albumTotalRow={name:canonicalAlbum?.displayName||combo?.name||catalogReleaseLabel(item),artworkRelease:item.key,releaseDate:tab==='group'?(groupOriginalReleaseDates[item.key]||groupStandaloneReleaseDates[item.key]||null):(item.release_date||null),
   streams:savedAlbum?.streams??streams,gain:savedAlbum?savedAlbum.gain:gain,
   gainPartial:savedAlbum?!!savedAlbum.gainPartial:(periodic&&ids.some(id=>incompleteObservedPeriod(s,baseline,id))),
   estimatedGain:!savedAlbum&&partialGain,
   change:savedAlbum?savedAlbum.change:(periodic?sumPeriodChange(s,baseline,ids):dayChange),
   changePartial:savedAlbum?savedAlbum.changePartial:(periodic?periodComparison(s,baseline,ids).partial:dailyComparison(s,p,pp,ids).partial),
   kind:'album',releaseOrder:rows.length};
  for(const id of [...new Set(item.tracks||[])]){
   // Show the complete catalog even when a historical snapshot has no matching Spotify ID.
   const g=periodic?periodGain(s,baseline,id):safeGain(s,p,id);
   const gilboardEdition=tab==='solo'&&item.key==='picheolin_g3'&&
      ['34wTGQ1yV5XtrSMR5dMLWY','5W1bn5PzFgKok4GAZ1JUAw'].includes(id);
   rows.push({id,name:tab==='solo'?(soloMedia.tracks?.[id]?.title||displayTrackName(s.names?.[id]||idName[id]||id)):displayTrackName(s.names?.[id]||idName[id]||id),artworkRelease:item.key,
    edition:gilboardEdition?'Gilboard album version':null,
    streams:s.tracks?.[id]??null,gain:g,change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id),
    gainPartial:periodic&&g!=null&&incompleteObservedPeriod(s,baseline,id),
    changePartial:periodic&&incompletePeriodComparison(s,baseline,id),
    kind:'track',releaseOrder:rows.length});
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
    const allObserved=periodic?allIds.map(id=>periodGain(s,baseline,id)).filter(v=>v!=null):[];
    const allPartial=periodic&&allObserved.length>0&&allObserved.length<allIds.length;
    const allGain=periodic?(allObserved.length?allObserved.reduce((a,b)=>a+b,0):null):sumDaily(s,p,allIds);
    const dayChange=sumDailyChange(s,p,pp,allIds);
    const archivedId=historicalAlbumAggregate(s,'g49','full');
    const saved=archivedAlbumMetrics(s,p,pp,baseline,archivedId);
    rows.push({name:'17 IS RIGHT HERE — All Tracks',artworkRelease:'g49',
     streams:saved?.streams??allStreams,gain:saved?saved.gain:allGain,
     gainPartial:saved?!!saved.gainPartial:(periodic&&allIds.some(id=>incompleteObservedPeriod(s,baseline,id))),
     estimatedGain:!saved&&allPartial,
     change:saved?saved.change:(periodic?sumPeriodChange(s,baseline,allIds):dayChange),
     changePartial:saved?saved.changePartial:(periodic?periodComparison(s,baseline,allIds).partial:dailyComparison(s,p,pp,allIds).partial),
     kind:'album',releaseOrder:rows.length});
   }
  }else rows.push(albumTotalRow);
 }
 // Discography rows are built in oldest-first release order. Reverse entire
 // release groups for newest-first; do not reverse songs within an album.
 if(sortOrder==='newest'){
  const blocks=[];
  let currentBlock=null;
  for(const row of rows){
   const release=row.artworkRelease||'unknown';
   if(!currentBlock||currentBlock.key!==release){
    currentBlock={key:release,rows:[]};
    blocks.push(currentBlock);
   }
   currentBlock.rows.push(row);
  }
  return blocks.reverse().flatMap(block=>block.rows);
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

// First public release dates for standalone singles, collaborations and OSTs.
// Dates are kept separate from the album mapping so reissues do not
// silently change the first-release chronology.
const groupStandaloneReleaseDates={
 g3:'2015-12-04',g4:'2016-02-12',g14:'2018-08-13',g15:'2018-08-28',
 g17:'2019-05-19',g19:'2019-08-05',g21:'2019-12-01',
 g26:'2020-09-17',g30:'2021-06-23',g31:'2021-08-13',
 g34:'2022-04-15',g38:'2022-08-26',g40:'2023-01-17',
 g42:'2023-08-16',g45:'2023-09-01',g47:'2023-12-26',g48:'2024-02-16',g55:'2024-05-03',g57:'2024-10-18',g60:'2025-06-30',g61:'2025-07-14',g62:'2025-07-25',g63:'2025-10-10',g64:'2026-02-27'
};
const groupOriginalReleaseDates={"g7":"2016-07-04","g23":"2020-06-22","g24":"2020-08-24","g37":"2022-07-18","g44":"2023-08-23","g50":"2024-04-29","g51":"2024-04-29","g52":"2024-04-29","g53":"2024-04-29","g54":"2024-04-29","g1":"2015-05-29","g2":"2015-09-10","g5":"2016-04-25","g6":"2016-07-04","g8":"2016-12-05","g9":"2017-05-22","g10":"2017-11-06","g11":"2018-02-05","g12":"2018-05-30","g13":"2018-07-16","g16":"2019-01-21","g18":"2019-05-29","g20":"2019-09-16","g22":"2020-04-01","g23":"2020-06-22","g25":"2020-09-09","g27":"2020-10-19","g28":"2021-04-21","g29":"2021-06-18","g32":"2021-10-22","g33":"2021-12-08","g35":"2022-05-27","g36":"2022-07-18","g39":"2022-11-09","g41":"2023-04-24","g43":"2023-08-23","g46":"2023-10-23","g49":"2024-04-29","g56":"2024-10-14","g58":"2024-11-27","g59":"2025-05-26"};
// Anchor legacy spreadsheet song identities to the verified November 6, 2026
// Spotify recording IDs, so archive dates and covers don't drift by snapshot.
const archiveCanonicalIds=new Map();
function buildArchiveCanonicalIds(snapshot){
 archiveCanonicalIds.clear();
 const matches=new Map();
 for(const [id,name] of Object.entries(snapshot?.names||{})){
  if(!/^[a-zA-Z0-9]{22}$/.test(id)||snapshot.tracks?.[id]==null)continue;
  const key=normTrackName(name);
  if(!key)continue;
  if(matches.has(key)&&matches.get(key)!==id)matches.set(key,null);
  else if(!matches.has(key))matches.set(key,id);
 }
 for(const [name,id] of matches)if(id)archiveCanonicalIds.set(name,id);
}
function canonicalArchiveRow(row){
 if(tab!=='group'||rank.startsWith('discography')||row.kind==='album'||row.kind==='grand')return row;
 const id=archiveCanonicalIds.get(normTrackName(row.name));
 return id?{...row,id}:row;
}
function originalReleaseDate(row){
 row=canonicalArchiveRow(row);
 if(tab==='solo'&&/^legacy:/.test(String(row.id||''))){
  if(row.releaseDate)return row.releaseDate;
  // Earlier workbooks have dynamically shifted row indexes. An ambiguous
  // unrecognized older source is undated rather than borrowing a false date.
  if(row.sourceDate&&row.sourceDate!=='2026-11-06')return null;
 }
 if(tab==='solo'&&row.kind!=='album'){
  const archive=/^legacy:/.test(String(row.id||''))&&
   (!row.sourceDate||row.sourceDate==='2026-11-06')
   ?soloLegacyLinks.byIndex?.[Number(String(row.id).split(':').at(-1))]:null;
  if(archive?.releaseDate)return archive.releaseDate;
  if(rank.startsWith('discography')&&row.artworkRelease){
   const item=(catalog.solo||[]).find(x=>x.key===row.artworkRelease);
   const releaseDate=item?.track_release_dates?.[row.id]||item?.release_date;
   if(releaseDate)return releaseDate;
  }
 }
 // The historical workbook lists the original singles and separate later
 // Gilboard album copies. Use their particular edition's release date.
 if(tab==='solo'&&/^legacy:/.test(String(row.id||''))&&
    ['Picheolin','Gilboard'].includes(row.soloOwner)){
  const index=Number(String(row.id).split(':').at(-1));
  if(index===377||index===378)return '2026-07-15';
  if(index===379||index===380)return '2026-07-22';
  if(index>=381&&index<=399)return '2026-08-03';
 }
 // Original song releases are authoritative even on later anthology/album pages.
 // A standalone Picheolin single keeps its July date inside August's Gilboard.
 if(tab==='solo'&&row.id&&row.kind!=='album'&&row.kind!=='grand'){
  const date=originalSoloSongDate(row.id);
  if(date)return date;
 }
 // Later remix singles have distinct dates in all track, album and history views.
 if(tab==='group'){
  const remixName=String(row.name||'').toLowerCase();
  if(row.id==='2LBoWyCgW1BBwNbtN61Ik6'||(/love[, ]+money[, ]+fame/.test(remixName)&&/timbaland\s*remix/.test(remixName)))return '2024-11-01';
  if(row.id==='36LcCpAK7ColfpTTRNChhz'||(/love[, ]+money[, ]+fame/.test(remixName)&&/kenia\s*os\s*remix/.test(remixName)))return '2024-11-08';
 }
 // Shingo Katori x SEVENTEEN BETTING: official digital release January 17, 2023.
 if(tab==='group'&&/^betting(?:\s*\(.*\))?$/i.test(String(row.name||'').trim()))return '2023-01-17';
 // Original Hospital Playlist Pt. 8 single: both vocal and instrumental versions.
 // Override incorrect historical/catalog dates, including June 30.
 if(tab==='group'&&(row.id==='4rrGSoMxUV0diSX4zpoCTf'||row.id==='2h1Ul51I7yWhu2KcI6RSaO'||/^is it still beautiful(?:\s*[-–]\s*instrumental)?$/i.test(String(row.name||'').trim())))return '2021-08-13';
 // Exact Spotify recording: Chinese single released August 28, 2018.
 if(row.id==='65QDnqGpWrHhnViAM1D4Sd'||(tab==='group'&&/oh my/i.test(row.name||'')&&/chinese/i.test(row.name||'')))return '2018-08-28';
 // Historical spreadsheet rows can carry a later compilation date. Prefer
 // the original recording's canonical catalog date on all archive views.
 if(tab==='group'&&!rank.startsWith('discography')&&row.kind!=='album'&&row.kind!=='grand'){
  const original=trackOriginalReleaseDates();
  const verified=original.byId.get(row.id)||original.byName.get(normTrackName(row.name||''));
  if(verified)return verified;
 }
 if(row.releaseDate)return row.releaseDate;
 const key=row.artworkRelease;
 if(rank.startsWith('discography')&&tab==='group'&&key==='g62'&&row.id==='0L3tD2Sc15kj9WQyUF7uTm')return '2025-08-15';
 if(rank.startsWith('discography')&&tab==='group'&&key==='g57'){
  if(row.id==='2LBoWyCgW1BBwNbtN61Ik6')return '2024-11-01';
  if(row.id==='36LcCpAK7ColfpTTRNChhz')return '2024-11-08';
  return '2024-10-18';
 }
 // A track shown inside a reissue is dated to that edition, not its debut.
 if(rank.startsWith('discography')&&tab==='group'&&/^g(49|50|51|52|53|54)$/.test(key||''))return '2024-04-29';
 if(tab==='group'&&key&&(groupOriginalReleaseDates[key]||groupStandaloneReleaseDates[key]))return groupOriginalReleaseDates[key]||groupStandaloneReleaseDates[key];
 const item=(catalog[tab]||[]).find(x=>x.key===key);
 const date=item?.release_date||item?.releaseDate||item?.first_release_date;
 if(/^\d{4}-\d{2}-\d{2}$/.test(date||''))return date;
 // Historical spreadsheets do not carry artworkRelease keys. Match their
 // stable Spotify IDs or unique track titles to the original catalog so
 // release dates display on every archived day, not only the latest snapshot.
 if(row.kind!=='album'&&row.kind!=='grand'){
  const chronology=trackOriginalReleaseDates();
  const byId=chronology.byId.get(row.id);
  if(byId)return byId;
  const byName=chronology.byName.get(normTrackName(row.name||''));
  if(byName)return byName;
 }
 // Archive album rows may not have a release key. Resolve the exact catalog
 // title before using legacy aliases, for both group and solo/unit archives.
 if(row.kind==='album'||rank.startsWith('albums')){
  const title=normTrackName(row.name||'');
  const matched=(catalog[tab]||[]).find(item=>normTrackName(item.title||'')===title||normTrackName(catalogReleaseLabel(item))===title);
  if(matched){
   const dated=tab==='group'?(groupOriginalReleaseDates[matched.key]||groupStandaloneReleaseDates[matched.key]):(matched.release_date||matched.releaseDate||matched.first_release_date);
   if(/^\\d{4}-\\d{2}-\\d{2}$/.test(dated||''))return dated;
  }
 }
 // Older spreadsheet album rows have no catalog key: identify their
 // original release from the album title, never their spreadsheet row order.
 if(tab==='group'){
  const name=normTrackName(row.name||'');
  const aliases={g1:['17carat'],g2:['boysbe'],g5:['loveletter'],g6:['loveletterrepackage'],g8:['goingseventeen'],g9:['al1'],g10:['teenage'],g11:['directorscut'],g12:['wemakeyou'],g13:['youmakemyday'],g16:['youmademydawn'],g18:['happyending'],g20:['anode'],g22:['fallinflower'],g23:['henggarae'],g25:['24h'],g27:['semicolon'],g28:['hitorijanai','notalone'],g29:['yourchoice'],g32:['attacca'],g33:['poweroflove'],g35:['facethesun'],g36:['sector17'],g39:['dream'],g41:['fml'],g43:['alwaysyours'],g46:['seventeenthheaven'],g49:['17isrighthere'],g56:['spillthefeels'],g58:['shohikigen'],g59:['happyburstday']};
  for(const [release,terms] of Object.entries(aliases)){
   if(terms.some(term=>name.includes(term))){
    if(release==='g5'&&name.includes('repackage'))return groupOriginalReleaseDates.g6;
    return groupOriginalReleaseDates[release];
   }
  }
 }
 return null;
}
let cachedSoloSongDateMap=null;
function originalSoloSongDate(id){
 if(!cachedSoloSongDateMap){
  cachedSoloSongDateMap=new Map();
  for(const item of catalog.solo||[]){
   for(const trackId of item.tracks||[]){
    const date=item.track_release_dates?.[trackId]||item.release_date||null;
    if(!/^20\d{2}-\d{2}-\d{2}$/.test(date||''))continue;
    const prior=cachedSoloSongDateMap.get(trackId);
    if(!prior||date<prior)cachedSoloSongDateMap.set(trackId,date);
   }
  }
 }
 return cachedSoloSongDateMap.get(id)||null;
}
// Track chronology comes from the original catalog release containing each song,
// not from the track's alphabetical name or its cumulative streams.
function trackOriginalReleaseDates(){
 const byId=new Map(),byName=new Map(),orderById=new Map(),orderByName=new Map();
 // The catalog follows the supplied original discography. Include singles,
 // OSTs and bonus tracks even when their exact day is not documented.
 // Reissue entries cannot replace an earlier appearance of a recording.
 for(const [releaseIndex,item] of (catalog[tab]||[]).entries()){
  const date=tab==='group'?(groupOriginalReleaseDates[item.key]||groupStandaloneReleaseDates[item.key]):
   item.release_date||item.releaseDate||item.first_release_date;
  const verifiedDate=/^\d{4}-\d{2}-\d{2}$/.test(date||'')?date:null;
  const ids=item.tracks||[];
  const description=String(item.description||'');
  const names=description.includes(':')?description.slice(description.indexOf(':')+1).split(/,\s*/):[];
  ids.forEach((id,i)=>{
   if(!orderById.has(id))orderById.set(id,releaseIndex);
   if(verifiedDate&&(!byId.has(id)||verifiedDate<byId.get(id)))byId.set(id,verifiedDate);
   const name=names.length===ids.length?normTrackName(names[i]):'';
   if(name){
    if(!orderByName.has(name))orderByName.set(name,releaseIndex);
    if(verifiedDate&&(!byName.has(name)||verifiedDate<byName.get(name)))byName.set(name,verifiedDate);
   }
  });
 }
 return {byId,byName,orderById,orderByName};
}
function formatOriginalRelease(date){return new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})}

/* Historical spreadsheet album-total rows correspond to the same catalog
   releases as live album sums. Use stable release keys across archive modes. */
function historicalAlbumReleaseKey(name){
 const n=String(name||'').toLowerCase();
 const patterns=[
  [/17 is right here/,'g49'],
  [/always yours/,'g43'],
  [/sector 17/,'g37'],
  [/love\s*&\s*letter.*repackage/,'g7'],
  [/love\s*&\s*letter/,'g5'],
  [/face the sun/,'g35'],
  [/an ode/,'g20'],
  [/17 carat/,'g1'],
  [/boys be/,'g2'],
  [/going seventeen/,'g8'],
  [/\bal1\b/,'g9'],
  [/teen,?\s*age/,'g10'],
  [/director.s cut/,'g11'],
  [/we make you/,'g12'],
  [/you make my day/,'g13'],
  [/you made my dawn/,'g16'],
  [/you make my dawn/,'g16'],
  [/happy ending/,'g18'],
  [/fallin.?\s*flower/,'g22'],
  [/heng[:\s-]*gar/,'g23'],
  [/\b24h\b/,'g25'],
  [/semicolon/,'g27'],
  [/hitorijanai/,'g28'],
  [/your choice/,'g29'],
  [/attacca/,'g32'],
  [/power of love/,'g33'],
  [/\bdream\b/,'g39'],
  [/\bfml\b/,'g41'],
  [/seventeenth heaven/,'g46'],
  [/spill the feels/,'g56'],
  [/shohikigen/,'g58'],
  [/happy burstday/,'g59']
 ];
 return patterns.find(([re])=>re.test(n))?.[1]||null;
}
function canonicalGroupAlbumKey(keys){
 return keys.includes('g7')?'g7':keys.includes('g37')?'g37':keys[0]||null;
}

function buildRows(s,p,pp,baseline){
 if(!s)return[];
 if(tab==='solo'&&isHistorical(s))return soloLegacyRows(s,p,pp,baseline,rank.startsWith('albums')?'albums':rank.startsWith('discography')?'discography':'tracks');
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly'),albums=rank.startsWith('albums'),discography=rank.startsWith('discography');
 if(discography)return discographyRows(s,p,pp,baseline);
 let rows=[];
 if(albums&&isHistorical(s)&&tab==='group'){
   rows=Object.entries(s.tracks).filter(([id])=>historicalKind(s,id)==='album'&&isAlbumTitle(s.names?.[id])&&!/\b(?:new|original)\s+tracks?\b/i.test(s.names?.[id]||'')).map(([id,streams])=>{
     const albumIdentity=historicalAlbumReleaseKey(s.names[id]);
     return {
      id,name:albumDisplayName((s.names[id]||id).replace(/\s*Total\s*:?$/i,'').trim()),
      artworkRelease:albumIdentity,albumIdentity,kind:'album',streams,
      gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),
      change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id)
     };
   });
 }else if(albums&&tab==='solo'){
   rows=canonicalSoloAlbumRows(s,p,pp,baseline);
 }else if(albums&&tab==='group'){
   // Match the album sum expressions printed by Stream_Stats.java.
   // In particular, repackage totals combine their base and added arrays.
   const releasesByKey=new Map((catalog.group||[]).map(item=>[item.key,item]));
   for(const spec of [...requestedGroupAlbums,...(catalog.group||[]).filter(x=>x.admin_added&&x.release_type==='album').map(x=>({keys:[x.key],name:x.title}))]){
     const ids=[...new Set(spec.keys.flatMap(key=>releasesByKey.get(key)?.tracks||[]))];
     const streams=ids.length&&ids.every(id=>s.tracks[id]!=null)?ids.reduce((sum,id)=>sum+s.tracks[id],0):null;
     const gainSummary=periodic?partialPeriodSum(s,baseline,ids):null;
     const gain=periodic?gainSummary.value:sumDaily(s,p,ids);
     const dayChange=sumDailyChange(s,p,pp,ids);
     rows.push({name:spec.name,artworkRelease:canonicalGroupAlbumKey(spec.keys),albumIdentity:canonicalGroupAlbumKey(spec.keys),historyReleases:spec.keys,kind:'album',streams,gain,gainPartial:!!gainSummary?.partial,
       change:periodic?sumPeriodChange(s,baseline,ids):dayChange,changePartial:periodic?periodComparison(s,baseline,ids).partial:dailyComparison(s,p,pp,ids).partial});
   }
 }else if(albums){
   for(const item of catalog[tab]||[]){
     if(!(item.admin_added&&item.release_type==='album')&&!isAlbumTitle(item.title)&&!['dino_g4','jxj_dreamscape','jeonghan_g2','joshua_g8','picheolin_g3'].includes(item.key))continue;
     if(['gilboard','sharedTracks'].includes(item.key))continue;
     const ids=[...new Set(item.tracks)];
     const streams=ids.every(id=>Number.isFinite(s.tracks[id])&&(tab==='solo'?s.tracks[id]>=0:s.tracks[id]>0))?ids.reduce((a,id)=>a+s.tracks[id],0):null;
     const gain=periodic?sumPeriod(s,baseline,ids):sumDaily(s,p,ids),dayChange=sumDailyChange(s,p,pp,ids);
     rows.push({name:catalogReleaseLabel(item),artworkRelease:item.key,kind:'album',streams,gain,change:periodic?sumPeriodChange(s,baseline,ids):dayChange,changePartial:periodic?periodComparison(s,baseline,ids).partial:dailyComparison(s,p,pp,ids).partial});
   }
 }else{
   rows=trackIds(s).map(id=>({
     id,name:tab==='solo'?(soloMedia.tracks?.[id]?.title||displayTrackName(s.names?.[id]||idName[id]||id)):displayTrackName((s.names?.[id]||idName[id]||id)==='247.0'?'247':s.names?.[id]||idName[id]||id),
     streams:Number.isFinite(s.tracks[id])&&(tab==='solo'?s.tracks[id]>=0:s.tracks[id]>0)?s.tracks[id]:null,gain:periodic?periodGain(s,baseline,id):safeGain(s,p,id),change:periodic?periodChange(s,baseline,id):dailyChange(s,p,pp,id),
     gainPartial:periodic&&incompleteObservedPeriod(s,baseline,id),
     changePartial:periodic&&incompletePeriodComparison(s,baseline,id)
   }));
 }
 if(albums)rows.forEach(row=>{row.name=cleanAlbumLabel(row.name)});
 rows=uniqueRows(rows); // Preserve catalog tracks with unavailable snapshot counts.
 // Resolve release dates for every archive row regardless of sorting mode.
 rows.forEach(row=>{row.releaseDate=originalReleaseDate(row)});
 if(!albums&&(sortOrder==='oldest'||sortOrder==='newest')){
  const releaseDates=trackOriginalReleaseDates();
  rows.forEach(row=>{
   const normalized=normTrackName(row.name);
   // Keep verified original-date overrides (including remixes and OSTs)
   // when sorting oldest/newest; do not overwrite them with catalog defaults.
   row.releaseDate=row.releaseDate||releaseDates.byId.get(row.id)||
    releaseDates.byName.get(normalized)||null;
   row.releaseOrder=releaseDates.orderById.get(row.id)??
    releaseDates.orderByName.get(normalized)??null;
  });
 }
 rows.sort((a,b)=>{
  if(sortOrder==='az'||sortOrder==='za'){
   const cmp=String(a.name||'').localeCompare(String(b.name||''),'en',{sensitivity:'base',numeric:true});
   return sortOrder==='az'?cmp:-cmp;
  }
  if(sortOrder==='oldest'||sortOrder==='newest'){
   const x=originalReleaseDate(a),y=originalReleaseDate(b);
   // Preserve the oldest-release ordering, and reverse ONLY the dated
   // release order for newest. Undated records always follow dated ones.
   // For tracks, the supplied discography sequence covers singles and OSTs
   // that have no verified calendar date. Reverse the SAME sequence for newest.
   if(!albums&&tab==='group'){
    const ai=a.releaseOrder,bi=b.releaseOrder;
    if(ai!=null||bi!=null){
     if(ai==null)return 1;
     if(bi==null)return -1;
     if(ai!==bi)return sortOrder==='oldest'?ai-bi:bi-ai;
    }
   }
   if(!x||!y)return x?-1:y?1:String(a.name||'').localeCompare(String(b.name||''),'en',{sensitivity:'base'});
   const cmp=x.localeCompare(y);
   return cmp?(sortOrder==='oldest'?cmp:-cmp):String(a.name||'').localeCompare(String(b.name||''),'en',{sensitivity:'base'});
  }
  const x=daily||periodic?a.gain:a.streams,y=daily||periodic?b.gain:b.streams;
  if(x==null)return y==null?0:1;
  if(y==null)return -1;
  return sortOrder==='least'?x-y:y-x;
 });
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
 if(tab==='solo'){
  let id=row.spotifyTrackId||(/^legacy:/.test(String(row.id||''))?
   soloLegacyLinks.byIndex?.[Number(String(row.id).split(':').at(-1))]?.id:
   /^[A-Za-z0-9]{22}$/.test(row.id||'')?row.id:null);
  if(id){
   if(!rank.startsWith('discography')){
    const first={'34wTGQ1yV5XtrSMR5dMLWY':'594CTGIIVVTitwRhQJcWgM',
      '5W1bn5PzFgKok4GAZ1JUAw':'3Y0ZwgYVHuwbW0JGjsYodR'};
    id=first[id]||id;
   }
   return 'https://open.spotify.com/track/'+id;
  }
 }

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
 // Map legacy Picheolin row positions to their correct original single or
 // August album artwork, rather than matching ambiguous titles.
 if(tab==='solo'&&/^legacy:/.test(String(row.id||''))&&
    ['Picheolin','Gilboard'].includes(row.soloOwner)){
  const index=Number(String(row.id).split(':').at(-1));
  const release=(index===377||index===378)?'picheolin_g1':
     (index===379||index===380)?'picheolin_g2':
     (index>=381&&index<=387)?'picheolin_g3':
     (index>=392&&index<=399)?'gilboard':null;
  if(release){
   const item=(catalog.solo||[]).find(x=>x.key===release);
   if(row.kind==='album')return {artworkRelease:release};
   const position=index>=392?index-392:index>=381?index-381:0;
   const id=item?.tracks?.[position];
   if(id)return {id};
   return {artworkRelease:release};
  }
 }
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
 row=canonicalArchiveRow(row);
 if(tab==='solo'){
  const archived=/^legacy:/.test(String(row.id||''))?
    soloLegacyLinks.byIndex?.[Number(String(row.id).split(':').at(-1))]:null;
  const spec=soloAlbums.find(a=>a.key===row.artworkRelease)||
    soloAlbums.find(a=>a.releaseKeys?.includes(row.artworkRelease));
  const isAlbum=row.kind==='album'||rank.startsWith('albums');
  if(isAlbum&&spec&&soloMedia.albums?.[spec.key])return 'image:'+soloMedia.albums[spec.key];
  // Every individual single/OST release total also gets its own exact cover.
  // The preceding workbook row holds the last track of that SAME release;
  // never search by a generic title or another artist's matching song.
  if(isAlbum){
   const entry=(catalog.solo||[]).find(item=>item.key===row.artworkRelease);
   const firstId=entry?.tracks?.[0];
   const firstCover=soloMedia.tracks?.[firstId]?.local;
   if(firstCover)return 'image:'+firstCover;
   if(/^legacy:/.test(String(row.id||''))){
    const index=Number(String(row.id).split(':').at(-1));
    const previous=soloLegacyLinks.byIndex?.[index-1];
    const matchedCover=soloMedia.tracks?.[previous?.id]?.local;
    if(matchedCover)return 'image:'+matchedCover;
   }
  }
  let id=row.spotifyTrackId||archived?.id||row.id;
  if(!rank.startsWith('discography')){
   const first={'34wTGQ1yV5XtrSMR5dMLWY':'594CTGIIVVTitwRhQJcWgM',
    '5W1bn5PzFgKok4GAZ1JUAw':'3Y0ZwgYVHuwbW0JGjsYodR'};
   id=first[id]||id;
  }
  const photo=soloMedia.tracks?.[id]?.local;
  if(photo)return 'image:'+photo;
  if(spec&&soloMedia.albums?.[spec.key])return 'image:'+soloMedia.albums[spec.key];
 }

 // Keep the Korean recording on its original An Ode artwork in Tracks and History.
 // Discography appearances on 17 IS RIGHT HERE retain that edition's sleeve.
 if(tab==='group'&&(row.id==='2lYLfG1WddMzvyJvc7imyB'||/happy\s*ending/i.test(row.name||'')&&/korean\s*ver/i.test(row.name||''))&&!(rank.startsWith('discography')&&/^g(49|50|51|52|53|54)$/.test(row.artworkRelease||'')))return 'release:'+encodeURIComponent('An Ode');
 // Each remix edition has its own sleeve and release date.
 if(rank.startsWith('discography')&&tab==='group'){
  if(row.artworkRelease==='g55')return 'release:'+encodeURIComponent('MAESTRO (Orchestra Remix)');
  if(row.artworkRelease==='g57'){
   const title=row.id==='2LBoWyCgW1BBwNbtN61Ik6'?'LOVE, MONEY, FAME (feat. DJ Khaled) (Timbaland Remix)':row.id==='36LcCpAK7ColfpTTRNChhz'?'LOVE, MONEY, FAME (feat. DJ Khaled) (Kenia OS Remix)':'LOVE, MONEY, FAME (Remixes)';
   return 'release:'+encodeURIComponent(title);
  }
 }
 // Compilation artwork applies to the specific Discography appearance only.
 if(rank.startsWith('discography')&&tab==='group'&&/^g(49|50|51|52|53|54)$/.test(row.artworkRelease||''))return 'release:'+encodeURIComponent('17 IS RIGHT HERE');
 // Release-specific artwork must win over anthology/legacy ID matching.
 // The same recording can appear on several releases with different sleeves.
 if(tab==='group'){
  const key=coverKey(row.name||'');
  const release=row.artworkRelease;
  const albumRow=row.kind==='album'||rank.startsWith('albums');
  const direct={g5:'LOVE & LETTER',g6:'LOVE & LETTER (Repackage)',g7:'LOVE & LETTER (Repackage)',g19:'HIT',g20:'An Ode',g24:'24H',g25:'24H',g35:'Face the Sun',g36:'SECTOR 17',g37:'SECTOR 17',g43:'ALWAYS YOURS',g44:'ALWAYS YOURS'};
  if(rank.startsWith('discography')&&release&&direct[release])return 'release:'+encodeURIComponent(direct[release]);
  if(rank.startsWith('discography')&&release==='g34')return 'release:'+encodeURIComponent('Darl+ing');
  if(rank.startsWith('discography')&&!albumRow){
   if(key==='hit'&&release==='g19')return 'release:'+encodeURIComponent('HIT');
   if(key==='darl ing'||key==='darling')return 'release:'+encodeURIComponent('Darl+ing');
   if(key==='24h'&&release!=='g44')return 'release:'+encodeURIComponent('24H');
  }
 }
 // Happy Ending (Korean Ver.) debuted on An Ode, not 17 IS RIGHT HERE.
 if(rank.startsWith('discography')&&tab==='group'&&/happy\s*ending/i.test(row.name||'')&&/korean\s*(?:ver(?:sion)?\.?|version)/i.test(row.name||''))return 'release:'+encodeURIComponent('An Ode');
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

// Last-resort artwork lookup for specifically missing solo and collaboration covers.
// Match the exact recording/version; never substitute a similarly named release.
const missingSoloArtwork=[
 [/^earth$/i,'THE8','Earth'],
 [/^limbo\s*\(korean\s*(?:version|ver\.)\)$/i,'JUN','LIMBO Korean Version'],
 [/^limbo\s*\(chinese\s*(?:version|ver\.)\)$/i,'JUN','LIMBO Chinese Version'],
 [/^spring,?\s*summer,?\s*fall,?\s*winter\s*\(japanese\s*(?:version|ver\.)\)$/i,'SEVENTEEN','Spring Summer Fall Winter Japanese Version'],
 [/^5,?4,?3\s*\(pretty woman\).*flo milli/i,'LAY BANKZ','5,4,3 Pretty Woman Flo Milli'],
 [/^5,?4,?3\s*\(pretty woman\).*lay bankz/i,'LAY BANKZ','5,4,3 Pretty Woman Lay Bankz']
];
const missingSoloArtCache=new Map();
function missingSoloCover(row){
 if(tab!=='solo')return Promise.resolve(null);
 const spec=missingSoloArtwork.find(([pattern])=>pattern.test(String(row.name||'')));
 if(!spec)return Promise.resolve(null);
 const key=spec[1]+'|'+spec[2];
 if(missingSoloArtCache.has(key))return missingSoloArtCache.get(key);
 const p=(async()=>{
  const simplify=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const version=x=>/japanese/i.test(x)?'japanese':/chinese/i.test(x)?'chinese':/korean/i.test(x)?'korean':'';
  const wantedVersion=version(row.name);
  for(const country of ['US','JP']){
   try{
    const params=new URLSearchParams({term:spec[1]+' '+spec[2],entity:'song',limit:'200',country});
    const response=await fetch('https://itunes.apple.com/search?'+params);
    if(!response.ok)continue;
    const data=await response.json();
    const found=(data.results||[]).find(x=>{
     const title=simplify(x.trackName),original=simplify(row.name);
     const base=original.replace(/\b(?:korean|chinese|japanese)\s*(?:version|ver)\b/g,'').trim();
     if(!title.includes(base)||!x.artworkUrl100)return false;
     if(wantedVersion&&version(x.trackName+' '+x.collectionName)!==wantedVersion)return false;
     if(/flo milli/i.test(row.name)&&!/flo milli/i.test(x.trackName+' '+x.artistName))return false;
     if(/lay bankz/i.test(row.name)&&!/lay bankz/i.test(x.trackName+' '+x.artistName))return false;
     return true;
    });
    if(found)return found.artworkUrl100.replace(/\d+x\d+bb/,'600x600bb');
   }catch(e){console.warn('Solo artwork lookup failed',key,e)}
  }
  return null;
 })();
 missingSoloArtCache.set(key,p);
 return p;
}

const genericCoverCache=new Map();
function findMissingArtwork(name,kind){
 const key=(tab||'group')+'|'+kind+'|'+name;
 if(genericCoverCache.has(key))return genericCoverCache.get(key);
 const p=(async()=>{
  const normalize=v=>String(v||'').toLowerCase().replace(/&#x20;|&nbsp;/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
  const wanted=normalize(name).replace(/\s+total$/,'');
  if(!wanted||wanted.length<3)return null;
  const artist=tab==='group'?'SEVENTEEN':selectedSoloArtist||'SEVENTEEN';
  const searchTerms=[artist+' '+name,'SEVENTEEN '+name];
  for(const term of searchTerms){
   try{
    const params=new URLSearchParams({term,entity:kind==='album'?'album':'song',limit:'100',country:'US'});
    const response=await fetch('https://itunes.apple.com/search?'+params);
    if(!response.ok)continue;
    const data=await response.json();
    const results=(data.results||[]).filter(x=>{
     const title=normalize(kind==='album'?x.collectionName:x.trackName);
     const credit=normalize(x.artistName);
     if(title!==wanted||!x.artworkUrl100)return false;
     return tab==='group'?credit.includes('seventeen'):credit.includes(normalize(artist))||credit.includes('seventeen')||['jxj','jxw','v8','bss','hxw','cxm','dxs'].includes(normalize(artist));
    });
    if(results.length)return results[0].artworkUrl100.replace(/\d+x\d+bb/,'600x600bb');
   }catch(e){console.warn('Artwork search unavailable',name,e)}
  }
  return null;
 })();
 genericCoverCache.set(key,p);
 return p;
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
   if(!url)url=await missingSoloCover({name:img.dataset.coverName||''});
   if(!url)url=await findMissingArtwork(img.dataset.coverName||'',img.dataset.coverKind||'track');
   
   setImage(img,url);
  }catch(e){console.warn('Artwork unavailable',id,e);if(fallback){try{setImage(img,await spotifyCover(fallback))}catch{setImage(img,null)}}else setImage(img,null)}
 };
 if(!('IntersectionObserver' in window)){imgs.forEach(resolve);return}
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);resolve(entry.target)}},{rootMargin:'240px'});
 imgs.forEach(img=>{
  // Local album/track images are already verified in the repository. Set
  // their URLs immediately; native loading="lazy" still avoids downloading
  // offscreen covers. This prevents empty src elements when the observer
  // misses a mobile scroll/resize and keeps the cover alongside each title.
  const source=img.dataset.coverTrack||'';
  if(source.startsWith('image:')){
   setImage(img,source.slice(6));
   return;
  }
  observer.observe(img);
 });
}
const soloArtists=[["S.Coups",null],["Jeonghan","6KDLlQYeeqUe5OQ2JrdNzF"],["Joshua","74AwWFYdjQ3ER5vHO4H7b0"],["Jun","38Gn0ZVC8TQwuaMxBK1yRV"],["Hoshi","6nWKAdMv1BDq1zHfZzkdbR"],["Wonwoo","3rHcBT06Vb1XGVUWhDALZt"],["Woozi","4TdiASPlU3QdZvGQBothcQ"],["Dokyeom","7G1kUsPtQCdolV6CPwHmh2"],["Mingyu","5gUpo0BRmo6EOTbyU3z5Ay"],["The8","4DqFd6XE3dX4LWXHJVVpLk"],["Seungkwan","0Vb2DjojEYsasFpc3aTZb6"],["Vernon","2Y34b9AOK30zXgL7cAH4NG"],["Dino","5YaeXxzvqGNBCguELlKo6G"],["BSS","1uAT5bTSp6dWbNmixIUP5t"],["JxW","7GvlsjcgBrsE578yghOq7D"],["HxW","1EReYiseDwE51FzGm7EK9n"],["CxM","7kjuLdYbtTkWBToMu2ebZN"],["DxS","4wBjmEkWhY4T22q00CiF5V"],["V8",null],["Picheolin","3V2EC4dPYLgtbi0TtrB1RA"],["JxJ",null]];
const artistPhotoCache=new Map();
const artistImageManifest=fetch('data/profile-images.json',{cache:'no-cache'})
 .then(r=>r.ok?r.json():{}).catch(()=>({}));
function showArtistPhoto(img,urls){
 const candidates=[...new Set((Array.isArray(urls)?urls:[urls]).filter(Boolean))];
 let index=0;
 img.onload=()=>{if(img.isConnected){img.classList.add('loaded');img.style.display=''}};
 img.onerror=()=>{img.classList.remove('loaded');if(++index<candidates.length){img.src=candidates[index]}else{img.style.display='none'}};
 if(candidates.length)img.src=candidates[0];
}

const sharedSoloProfilePhotos={
  'S.Coups':['https://koreanindo.net/wp-content/uploads/2025/09/seventeen-scoups-mingyu-cxm-scoups-5-scaled.jpeg'],
  V8:['assets/profile-photos/v8.jpg','https://books.r10s.jp/fan/images/oshiraku-images/v8_conceptphoto1_25f8875b2d.jpg'],
  JxJ:['assets/profile-photos/jxj.jpg','https://www.allkpop.com/upload/2026/09/content/281130/web_data/allkpop_1790609592_htt9wk4biaabw8m.jpg']
 };
function renderArtistProfiles(){
 const area=$('#artistProfiles');
 if(!area)return;
 area.hidden=tab!=='solo';
 if(tab!=='solo')return;
 area.innerHTML='<div class="artist-profiles-heading">SOLOS & UNITS <span>✦</span></div>'+(selectedSoloArtist?'<div class="artist-selection-heading"><button type="button" id="allSoloArtists">← All units & solos</button><strong>'+escapeHtml(selectedSoloArtist)+' · STREAMING STATS</strong></div>':'')+'<div class="artist-profile-grid">'+soloArtists.map(([name,id])=>{
  const photo=name==='V8'||name==='JxJ'||name==='S.Coups'?'<img class="artist-profile-photo" data-unit-photo="'+name+'" alt="'+name+' full unit concept photo" loading="lazy">':id?'<img class="artist-profile-photo" data-artist-photo="'+id+'" alt="'+name+' artist photo" loading="lazy">':'';
  const observation=id?verifiedSoloFollowers[id]:null;const followerCount=observation&&Number.isFinite(Number(observation.count))?fmt(Number(observation.count)):null;const captured=observation?.captured_at?new Date(observation.captured_at):null;const capturedLabel=captured&&Number.isFinite(captured.getTime())?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'}).format(captured):'';const followerMarkup=followerCount!==null?'<span class="artist-profile-followers verified"><strong>'+followerCount+'</strong><small>followers'+(capturedLabel?' · '+capturedLabel:'')+'</small></span>':'<span class="artist-profile-followers">'+(id?'Today follower count unavailable':'No Spotify follower profile')+'</span>';return '<button type="button" class="artist-profile'+(selectedSoloArtist===name?' selected':'')+'" data-solo-artist="'+escapeHtml(name)+'" aria-pressed="'+(selectedSoloArtist===name)+'" title="View '+escapeHtml(name)+' statistics">'+photo+'<span class="artist-profile-name">'+escapeHtml(name)+'</span>'+followerMarkup+'</button>';
 }).join('')+'</div>';
 area.querySelector('#allSoloArtists')?.addEventListener('click',()=>{selectedSoloArtist=null;saveView();render()});
 area.querySelectorAll('[data-solo-artist]').forEach(button=>button.addEventListener('click',()=>{selectedSoloArtist=button.dataset.soloArtist;saveView();render()}));
 area.querySelectorAll('img[data-unit-photo]').forEach(img=>showArtistPhoto(img,sharedSoloProfilePhotos[img.dataset.unitPhoto]));
 area.querySelectorAll('img[data-artist-photo]').forEach(img=>{
  const id=img.dataset.artistPhoto;
  if(!artistPhotoCache.has(id)){
   artistPhotoCache.set(id,artistImageManifest.then(map=>{
    if(map[id])return map[id];
    return fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/artist/'+id))
      .then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||null).catch(()=>null);
   }));
  }
  artistPhotoCache.get(id).then(url=>{if(img.isConnected&&url)showArtistPhoto(img,url)});
 });
}
// The All tab calls the same image resolver as the original artist and ranking views.
window.svtSharedMedia={
 // Expose the same workbook-aware matching used by Units & Solo history.
 verifiedSoloLegacyValue(snapshot,spotifyId){return verifiedSoloLegacyValue(snapshot,spotifyId)},
 // Match the original OT13 and Units/Solo naming rules. Raw collector
 // catalog labels are lower-case and should never be printed verbatim in All.
 trackTitle(name,scope,id){
  const raw=String(name||'').trim();
  if(scope==='solo'){
   const original=soloMedia.tracks?.[id]?.title;
   return original||displayTrackName(raw);
  }
  return displayTrackName(raw);
 },
 releaseTitle(release){
  return catalogReleaseLabel(release);
 },
 artistImage(img,name){
  if(!img)return;
  const originals=sharedSoloProfilePhotos[name];
  if(originals){showArtistPhoto(img,originals);return}
  const id=name==='SEVENTEEN'?'7nqOGRxlXj7N2JYbgNEjYH':
   soloArtists.find(([artist])=>artist===name)?.[1];
  if(!id)return;
  if(!artistPhotoCache.has(id)){
   artistPhotoCache.set(id,artistImageManifest.then(map=>
    map[id]||fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/artist/'+id))
     .then(r=>r.ok?r.json():null).then(data=>data?.thumbnail_url||null).catch(()=>null)));
  }
  artistPhotoCache.get(id).then(url=>{if(img.isConnected&&url)showArtistPhoto(img,url)});
 },
 coverFor(row){
  const previousTab=tab,previousRank=rank;
  try{
   tab=row.scope==='solo'?'solo':'group';
   rank=row.discographyAppearance?'discography-overall':(row.kind==='album'?'albums':'tracks')+'-overall';
   return artworkTrack({id:row.id||null,name:row.title||row.name||'',kind:row.kind||'track',
    artworkRelease:row.releaseKey||row.artworkRelease||null,releaseDate:row.date||null})||
    (/^[a-zA-Z0-9]{22}$/.test(row.id||'')?'track:'+row.id:null);
  }finally{tab=previousTab;rank=previousRank}
 },
 fillArtwork
};
// Artist ownership is based on the Unit & Solo workbook. Track IDs, not
// matching titles, distinguish DREAMSCAPE "Coloring" from V8 "coloring".
function ownedSoloIds(artist){
 const releases=catalog.solo||[];
 const ids=new Set(releases.filter(item=>String(item.artist||'').toLowerCase()===artist.toLowerCase() && !(artist==='Jeonghan' && ['jxj_dreamscape','jxw_g1'].includes(item.key))).flatMap(item=>item.tracks||[]));
 const get=key=>releases.find(item=>item.key===key)?.tracks||[];
 const add=(key,indices)=>indices.forEach(i=>{if(get(key)[i])ids.add(get(key)[i])});
 // The sharedTracks catalog is the seven-track JxJ DREAMSCAPE album,
 // despite the imported release's generic Gilboard ownership label.
 // Member credits remain the six-track Jeonghan/Joshua lists above.
 if(artist==='JxJ')add('sharedTracks',[0,1,2,3,4,5,6]);
 if(artist==='Wonwoo')add('jxw_g1',[0,2]);
 if(artist==='Dino')add('picheolin_g3',[0]);
 return ids;
}

/* Keep the original Unit & Solo workbook credits when displaying archived
   snapshots. Workbook row IDs differ from Spotify IDs; artist block boundaries
   (not fuzzy song-title matching) keep recordings such as Jeonghan's Coloring
   separate from V8's coloring and correctly separate unit members' tracks. */
const soloLegacyOwners=['S.Coups','Jeonghan','Joshua','Jun','Hoshi','Wonwoo','Woozi',
 'Dokyeom','Mingyu','The8','Seungkwan','Vernon','Dino','BSS',
 'JxW','HxW','CxM','DxS'];
const soloLegacyCache=new WeakMap();
function soloLegacySections(s){
 if(!s||!isHistorical(s))return null;
 if(soloLegacyCache.has(s))return soloLegacyCache.get(s);
 const rows=Object.keys(s.tracks||{}).map(id=>({
  id,name:String(s.names?.[id]||'').trim(),value:s.tracks[id],
  index:Number(String(id).split(':').at(-1))
 })).filter(row=>Number.isFinite(row.index)).sort((a,b)=>a.index-b.index);
 const groups={};let cursor=0;
 const norm=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const owner of soloLegacyOwners){
  const end=rows.findIndex((row,i)=>i>=cursor&&
   norm(row.name)===norm(owner+' TOTAL STREAMS'));
  if(end<0)continue;
  groups[owner]=rows.slice(cursor,end+1);
  cursor=end+1;
 }
 // V8 has no artist profile, but does have its own eight-track unit total.
 let end=rows.findIndex((row,i)=>i>=cursor&&norm(row.name)==='v8total');
 if(end>=0){groups.V8=rows.slice(cursor,end+1);cursor=end+1}
 end=rows.findIndex((row,i)=>i>=cursor&&norm(row.name)==='picheolinstreams');
 if(end>=0){groups.Picheolin=rows.slice(cursor,end+1);cursor=end+1}
 // The seven-track full Gilboard compilation follows the six Picheolin
 // credits; LIKE IT belongs to Dino, not Picheolin.
 end=rows.findIndex((row,i)=>i>=cursor&&
  /(?:gilboard|board)/i.test(row.name)&&/\btotal\s*:?$/i.test(row.name));
 if(end>=0){groups.Gilboard=rows.slice(cursor,end+1);cursor=end+1}
 // The last seven-track DREAMSCAPE group is JxJ's shared unit album.
 end=rows.findIndex((row,i)=>i>=cursor&&norm(row.name)==='dreamscapetotal');
 if(end>=0){groups.JxJ=rows.slice(cursor,end+1);cursor=end+1}
 soloLegacyCache.set(s,groups);
 return groups;
}
/* Historical Excel sheets insert songs over time. Index positions in an
   earlier sheet cannot be interpreted using November 6's row numbers. */
// Excel coerces Jun's recording '9' to '9.0' in some dated exports.
const soloHistoricalNameKey=name=>String(name||'').trim().replace(/^9\.0$/,'9')
 .normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu,'');
function matchedSoloReferenceIndex(snapshot,owner,source,expectedKind=null){
 if(!soloHistoryReference)return snapshot?.date==='2026-11-06'?source.index:null;
 if(snapshot?.date===soloHistoryReference.date)return source.index;
 const targetKind=expectedKind||historicalKind(snapshot,source.id);
 // Excel coerces Jun's track title "9" into the numeric-looking "9.0".
 // This is one verified song-specific alias, not a broad fuzzy match.
 const normalizeSourceName=value=>owner==='Jun'&&targetKind==='track'&&
  String(value||'').trim()==='9.0'?'9':soloHistoricalNameKey(value);
 const name=normalizeSourceName(source.name);
 const section=soloLegacySections(snapshot)?.[owner]||[];
 const reference=soloLegacySections(soloHistoryReference)?.[owner]||[];
 const previous=section.find(row=>row.index===source.index-1);
 // The November 2025/January 2026 workbook mislabeled Spider's own
 // 54M+ subtotal as "SHINGIRU Total"; the adjacent real Spider row and
 // identical number establish that it belongs to Spider, not SHINGIRU.
 if(owner==='Hoshi'&&targetKind==='album'&&name==='shingirutotal'&&
    soloHistoricalNameKey(previous?.name)==='spider'&&previous?.value===source.value)
   return null; // Resolve via the preceding Spider recording, never SHINGIRU.
 const unnamedTotal=targetKind==='album'&&previous&&
  soloHistoricalNameKey(previous.name)===name&&previous.value===source.value;
 const refName=unnamedTotal?name+'total':name;
 const options=reference.filter(row=>soloHistoricalNameKey(row.name)===refName&&
  historicalKind(soloHistoryReference,row.id)===targetKind);
 const priorSame=section.filter(row=>row.index<=source.index&&
  normalizeSourceName(row.name)===name&&
  (historicalKind(snapshot,row.id)===targetKind||row.index===source.index));
 const direct=options[unnamedTotal?0:priorSame.length-1];
 if(direct)return direct.index;
 // A historical workbook may credit a song to two members even though the
 // reference sheet lists that Spotify recording only under one. Recover a
 // release date only when every matching title resolves to the SAME exact
 // Spotify recording. Shared titles with different IDs stay unresolved.
 const globalRows=[...soloLegacyOwners,'V8','Picheolin','Gilboard','JxJ']
  .flatMap(credit=>soloLegacySections(soloHistoryReference)?.[credit]||[])
  .filter(row=>soloHistoricalNameKey(row.name)===refName&&
    historicalKind(soloHistoryReference,row.id)===targetKind);
 const candidates=[...new Map(globalRows.map(row=>[row.index,row])).values()];
 if(targetKind==='track'){
  const ids=new Set(candidates.map(row=>soloLegacyLinks.byIndex?.[row.index]?.id));
  if(ids.size===1&&!ids.has(undefined)&&candidates.length)return candidates[0].index;
 }else if(targetKind==='album'&&candidates.length===1){
  const prior=soloLegacyLinks.byIndex?.[candidates[0].index-1];
  if(prior?.releaseKey)return candidates[0].index;
 }
 return null;
}
function soloSnapshotAlbumRow(snapshot,owner,canonicalIndex){
 if(!snapshot||!canonicalIndex||!soloHistoryReference)return null;
 const reference=soloLegacySections(soloHistoryReference)?.[owner]||[];
 const desired=reference.find(row=>row.index===canonicalIndex);
 if(!desired)return null;
 const title=soloHistoricalNameKey(desired.name);
 const kind=historicalKind(soloHistoryReference,desired.id);
 const alternatives=reference.filter(row=>soloHistoricalNameKey(row.name)===title&&
  historicalKind(soloHistoryReference,row.id)===kind);
 const nth=alternatives.findIndex(row=>row.index===canonicalIndex);
 return (soloLegacySections(snapshot)?.[owner]||[])
  .filter(row=>soloHistoricalNameKey(row.name)===title&&historicalKind(snapshot,row.id)===kind)[nth]||null;
}

// Resolve the SAME Spotify recording in imported Excel snapshots. Their
// "legacy:" row IDs are not Spotify IDs, so ordinary key lookups cannot
// compute the daily gains at the November 6 -> November 7 transition.
// Only use the owner-specific, verified Nov 6 workbook track linkage.
// Resolve Spotify IDs to a row in each dated workbook by member and
// exact track title, never by a row index copied from another month.
function verifiedSoloLegacyValue(snapshot,spotifyId){
 if(!snapshot||!isHistorical(snapshot)||!soloHistoryReference)return null;
 const referenceSections=soloLegacySections(soloHistoryReference)||{};
 const snapshotSections=soloLegacySections(snapshot)||{};
 const possibilities=[];
 for(const [index,link] of Object.entries(soloLegacyLinks.byIndex||{})){
  if(link?.id!==spotifyId)continue;
  const referenceOwner=Object.keys(referenceSections).find(owner=>
   (referenceSections[owner]||[]).some(row=>row.index===Number(index)&&historicalKind(soloHistoryReference,row.id)==='track'));
  if(!referenceOwner)continue;
  const referenceRows=(referenceSections[referenceOwner]||[]).filter(row=>
   historicalKind(soloHistoryReference,row.id)==='track');
  const target=referenceRows.find(row=>row.index===Number(index));
  if(!target)continue;
  const key=soloHistoricalNameKey(target.name);
  const referenceMatches=referenceRows.filter(row=>soloHistoricalNameKey(row.name)===key);
  const snapshotMatches=(snapshotSections[referenceOwner]||[]).filter(row=>
   historicalKind(snapshot,row.id)==='track'&&soloHistoricalNameKey(row.name)===key);
  // If the workbook added/removed an identically titled edition, its
  // ordinal is ambiguous. Do not assign a different song's streams.
  if(!snapshotMatches.length||snapshotMatches.length!==referenceMatches.length)continue;
  const position=referenceMatches.findIndex(row=>row.index===target.index);
  const matched=snapshotMatches[position];
  if(matched&&Number.isFinite(matched.value)&&matched.value>=0)
   possibilities.push({id:matched.id,value:matched.value});
 }
 if(!possibilities.length||new Set(possibilities.map(row=>row.value)).size!==1){
  // The two GILBOARD album IDs are reissues of confirmed earlier singles;
  // before Aug 3 the saved sheet contains their original single rows.
  const single={
   '34wTGQ1yV5XtrSMR5dMLWY':'594CTGIIVVTitwRhQJcWgM',
   '5W1bn5PzFgKok4GAZ1JUAw':'3Y0ZwgYVHuwbW0JGjsYodR'
  }[spotifyId];
  if(single&&snapshot.date<'2026-08-03'){
   const matchedSingle=verifiedSoloLegacyValue(snapshot,single);
   if(matchedSingle)return matchedSingle;
   // Some July sheets list these singles outside the later Gilboard
   // artist block, so the ordinary owner-section matcher cannot find them.
   // Their exact song titles have one unique saved numeric observation.
   const canonicalName=spotifyId==='34wTGQ1yV5XtrSMR5dMLWY'?
    'micheomicheo':'lovesick';
   const rows=Object.entries(snapshot.names||{}).filter(([key,name])=>
    soloHistoricalNameKey(name)===canonicalName&&
    Number.isFinite(snapshot.tracks?.[key]));
   if(rows.length&&rows.every(([key])=>
     snapshot.tracks[key]===snapshot.tracks[rows[0][0]]))
    return {id:rows[0][0],value:snapshot.tracks[rows[0][0]]};
  }

  // In older BSS workbooks, Good Day 2025's track and subtotal were
  // accidentally labeled identically. Their two saved values are equal;
  // match exactly once, never add them or assign other identically named tracks.
  if(spotifyId==='4SinziOMDPR58wWHakWP9v'&&snapshot.date<'2026-05-01'){
   const matches=Object.entries(snapshot.names||{}).filter(([id,name])=>
    soloHistoricalNameKey(name)==='goodday2025telepathybythemoonlightwindow'&&
    Number.isFinite(snapshot.tracks?.[id]));
   if(matches.length===2&&snapshot.tracks[matches[0][0]]===snapshot.tracks[matches[1][0]])
    return {id:matches[0][0],value:snapshot.tracks[matches[0][0]]};
  }
  return null;
 }
 return possibilities[0];
}
function soloLegacyTrackIds(s,owner){
 const sections=soloLegacySections(s);if(!sections)return [];
 const chosen=owner?[owner]:[...soloLegacyOwners,'V8','Picheolin','Gilboard','JxJ'];
 const seen=new Set(),ids=[];
 for(const key of chosen)for(const row of sections[key]||[]){
  if(historicalKind(s,row.id)!=='track')continue;
  if(/\btota\s*;\s*:?$/i.test(row.name))continue;
  // The original sheet repeats a recording under individual and unit albums.
  // Only collapse truly identical named rows with identical saved totals.
  const mapped=matchedSoloReferenceIndex(s,key,row,'track');
   const recording=mapped!=null?soloLegacyLinks.byIndex?.[mapped]?.id:null;
   const signature=recording?canonicalSoloRecordingId(recording):normTrackName(row.name)+'|'+row.value;
  if(seen.has(signature))continue;
  seen.add(signature);ids.push(row.id);
 }
 return ids;
}

/* Exactly one official complete album in the Albums view.
   Historical spreadsheet subtotals stay unmodified in the archive. */
function canonicalSoloAlbumRows(s,p,pp,baseline){
 if(!s)return [];
 const periodic=['weekly','monthly','yearly'].some(k=>rank.endsWith(k));
 const historical=isHistorical(s);
 const idAt=(snapshot,index,owner)=>snapshot&&index&&owner?
  soloSnapshotAlbumRow(snapshot,owner,index)?.id||null:null;
 const delta=(newer,older,index,owner,requireConsecutive=true)=>{
  if(!newer||!older)return null;
  const a=idAt(newer,index,owner),b=idAt(older,index,owner);
  if(!a||!b)return null;
  const gap=(Date.parse(newer.date)-Date.parse(older.date))/86400000;
  if(gap<=0||(requireConsecutive&&gap!==1))return null;
  const current=Number(newer.tracks?.[a]),previous=Number(older.tracks?.[b]);
  if(!Number.isFinite(current)||!Number.isFinite(previous)||current<previous)return null;
  return current-previous;
 };
 const adminSoloAlbums=(catalog.solo||[]).filter(x=>x.admin_added&&x.release_type==='album').map(x=>({key:x.key,displayName:x.title,releaseDate:x.release_date,owners:[x.artist],tracks:x.tracks}));
 const result=[...(soloAlbums||[]),...adminSoloAlbums].filter(a=>!selectedSoloArtist||
  a.owners?.some(owner=>owner.toLowerCase()===selectedSoloArtist.toLowerCase())
 ).map(a=>{
  let ids=[...new Set(a.tracks||[])];
  // A member profile uses only tracks credited to that member, while
  // V8/JxJ show their complete 8/7-track albums, respectively.
  if(selectedSoloArtist&&!['JxJ','V8','Gilboard','Picheolin'].includes(selectedSoloArtist)){
   ids=ids.filter(id=>ownedSoloIds(selectedSoloArtist).has(id));
  }else if(selectedSoloArtist==='Picheolin')ids=ids.filter(id=>ownedSoloIds('Picheolin').has(id));
  if(!ids.length)return null;
  let streams=null,gain=null,change=null;
  if(historical){
   const ref=a.legacyTotalIndices||{};
   const sourceOwner=selectedSoloArtist&&ref[selectedSoloArtist]!=null
    ?selectedSoloArtist:ref.all!=null?'Gilboard':
      a.key==='jxj_dreamscape'?'JxJ':a.key==='v8'?'V8':Object.keys(ref)[0];
   const index=ref[sourceOwner]??ref.all;
   const key=idAt(s,index,sourceOwner);
   if(!key)return null;
   streams=s.tracks[key];
   if(periodic){
    // Use the same verified workbook-row matching and sparse-day fallback
    // as individual tracks. Requiring an exact start snapshot made many
    // historical solo/unit album gains disappear.
    gain=periodGain(s,baseline,key);
    change=periodChange(s,baseline,key);
   }else{
    gain=delta(s,p,index,sourceOwner,true);
    const yesterday=delta(p,pp,index,sourceOwner,true);
    change=gain!=null&&yesterday!=null?gain-yesterday:null;
   }
  }else{
   const vals=ids.map(id=>s.tracks?.[id]);
   if(vals.every(v=>Number.isFinite(v)&&v>=0))streams=vals.reduce((sum,value)=>sum+value,0);
   const gains=ids.map(id=>periodic?periodGain(s,baseline,id):safeGain(s,p,id));
   if(gains.every(v=>v!=null))gain=gains.reduce((sum,value)=>sum+value,0);
   const cmp=periodic?periodComparison(s,baseline,ids):dailyComparison(s,p,pp,ids);
   change=cmp.value;
  }
  return {name:a.displayName,artworkRelease:a.key,albumIdentity:a.key,
    releaseDate:a.releaseDate,kind:'album',streams,gain,change};
 }).filter(Boolean);
 // Rank albums using the selected period's gain, or cumulative streams in
 // Overall. Daily rankings must not sort by the all-time album total.
 if(sortOrder==='az'||sortOrder==='za')result.sort((a,b)=>{
  const cmp=a.name.localeCompare(b.name,'en',{numeric:true,sensitivity:'base'});
  return sortOrder==='az'?cmp:-cmp;
 });
 else if(sortOrder==='newest'||sortOrder==='oldest')result.sort((a,b)=>{
  const cmp=String(a.releaseDate||'').localeCompare(String(b.releaseDate||''));
  return sortOrder==='newest'?-cmp:cmp;
 });
 else result.sort((a,b)=>{
  const x=rank.endsWith('overall')?a.streams:a.gain;
  const y=rank.endsWith('overall')?b.streams:b.gain;
  if(x==null)return y==null?0:1;
  if(y==null)return -1;
  return (sortOrder==='least'?x-y:y-x)||String(a.name).localeCompare(String(b.name));
 });
 return result;
}

function soloLegacyRows(s,p,pp,baseline,view){
 if(view==='albums')return canonicalSoloAlbumRows(s,p,pp,baseline);
 const sections=soloLegacySections(s);if(!sections)return [];
 const periodic=['weekly','monthly','yearly'].some(period=>rank.endsWith(period));
 const owners=selectedSoloArtist?[selectedSoloArtist]:[...soloLegacyOwners,'V8','Picheolin','Gilboard','JxJ'];
 const rows=[];const seen=new Set();
 for(const owner of owners)for(const source of sections[owner]||[]){
  const kind=historicalKind(s,source.id);
  const sourceIndex=Number(String(source.id).split(':').at(-1));
  const previousSource=(sections[owner]||[]).find(row=>row.index===sourceIndex-1);
  // A November 2025 Good Day subtotal omitted the word "Total".
  const missingTotalLabel=owner==='BSS'&&previousSource&&
   soloHistoricalNameKey(previousSource.name)===soloHistoricalNameKey(source.name)&&
   previousSource.value===source.value&&/good\s*day\s*2025/i.test(source.name);
  const album=kind==='album'||/\btota\s*;\s*:?$/i.test(source.name)||!!missingTotalLabel;
  if(kind==='grand'||kind==='audience')continue;
  if(view==='albums'&&!album)continue;
  if(view==='tracks'&&album)continue;
  const legacyIndex=sourceIndex;
  const resolvedIndex=matchedSoloReferenceIndex(s,owner,source,album?'album':kind);
  const workbookTrack=resolvedIndex!=null?soloLegacyLinks.byIndex?.[resolvedIndex]:null;
  const fullAlbum=resolvedIndex!=null?soloAlbums.find(a=>
   Object.values(a.legacyTotalIndices||{}).includes(resolvedIndex)):null;
  // Each artist subtotal is meaningful in Discography. Only Albums
  // collapses DREAMSCAPE and V8 into one complete canonical release.
  if(!album){
   // Use the exact Spotify recording ID when available. A shared track
   // should appear once in combined totals, but separate recordings with the
   // same title must never erase each other.
   const fingerprint=workbookTrack?.id?canonicalSoloRecordingId(workbookTrack.id):normTrackName(source.name)+'|'+source.value;
   // Keep identical stream totals as distinct release editions in discography,
   // not as duplicate entries in the overall track tally.
   const editionCopy=view==='discography'&&['Picheolin','Gilboard'].includes(owner)&&
    [384,385,395,396].includes(Number(source.id.split(':').at(-1)));
   if(view!=='discography'&&seen.has(fingerprint)&&!editionCopy)continue;
   seen.add(fingerprint);
  }
  const name=album?formatDiscographyAlbumName(source.name.replace(/\s*(?:Total|Tota;)\s*:?$/i,'').trim()):displayTrackName(source.name);
  const row={id:source.id,name,streams:source.value,
   gain:periodic?periodGain(s,baseline,source.id):safeGain(s,p,source.id),
   change:periodic?periodChange(s,baseline,source.id):dailyChange(s,p,pp,source.id),
   gainPartial:periodic&&incompleteObservedPeriod(s,baseline,source.id),
   changePartial:periodic&&incompletePeriodComparison(s,baseline,source.id),
   kind:album?'album':'track',soloOwner:owner,sourceDate:s.date,releaseOrder:rows.length,
   spotifyTrackId:!album?workbookTrack?.id||null:null,
   artworkRelease:!album?workbookTrack?.releaseKey||null:fullAlbum?.key||workbookTrack?.releaseKey||null,
   edition:!album&&['Picheolin','Gilboard'].includes(owner)&&
      [384,385,395,396].includes(Number(source.id.split(':').at(-1)))?'Gilboard album version':null};
  // Include dates only where the catalog or a verified release map identifies
  // the recording; never borrow another member's similarly named song date.
  if(album&&fullAlbum){
   const credit=Object.entries(fullAlbum.legacyTotalIndices||{})
    .filter(([label,index])=>label!=='all'&&index===resolvedIndex)[0]?.[0]||owner;
   const size=fullAlbum.tracks?.length||0;
   const creditCounts={
    jxj_dreamscape:{Jeonghan:6,Joshua:6,JxJ:7},
    v8:{The8:7,Vernon:7,V8:8},
    gilboard:{Picheolin:6,Dino:2}
   };
   const fullUnit=(fullAlbum.key==='jxj_dreamscape'&&credit==='JxJ')||
    (fullAlbum.key==='v8'&&credit==='V8')||
    (fullAlbum.key==='gilboard'&&resolvedIndex===fullAlbum.legacyTotalIndices.all);
   const count=creditCounts[fullAlbum.key]?.[credit]||(fullUnit?size:null);
   const suffix=count?(fullUnit?' — Full '+size+'-Track Album Total':
    ' — '+credit+' '+count+'-Track Total'):' — Album Total';
   // The full release already has an album row; show its original clean title.
   row.name=fullUnit?fullAlbum.displayName:fullAlbum.displayName+suffix;
   row.releaseDate=fullAlbum.releaseDate;
   row.albumIdentity=fullAlbum.key+':'+(fullUnit?'full':credit);
  }else if(album){
   // Original workbook release totals sit immediately after their tracks.
   // Identify their exact catalog release before assigning the original date.
   const preceding=previousSource?
    soloLegacyLinks.byIndex?.[matchedSoloReferenceIndex(s,owner,previousSource)]:null;
   const release=(catalog.solo||[]).find(item=>item.key===preceding?.releaseKey);
   if(release){
    row.artworkRelease=release.key;
    row.releaseDate=release.release_date||null;
    row.albumIdentity=release.key+':'+owner;
    const officialReleaseTitle=properReleaseName(release)||catalogReleaseLabel(release)||release.title;
    if(/^total$/i.test(row.name)||missingTotalLabel||
       !soloHistoricalNameKey(row.name).includes(soloHistoricalNameKey(officialReleaseTitle)))
     row.name=officialReleaseTitle+' — Total';
   }
  }
  if(!album&&workbookTrack){
   row.releaseDate=workbookTrack.releaseDate||null;
   const official=soloMedia.tracks?.[workbookTrack.id]?.title;
   if(official)row.name=official;
  }
  row.releaseDate=row.releaseDate||
    (s.date==='2026-11-06'?originalReleaseDate(row):null);
  rows.push(row);
 }
 if(view==='discography'){
   // Keep album subtotal directly after the tracks from its release.
   // Oldest-first is the default for member discographies regardless of
   // global Most Streamed sorting selected elsewhere.
   rows.sort((a,b)=>{
    const x=originalReleaseDate(a),y=originalReleaseDate(b);
    if(!x||!y)return x?-1:y?1:(a.releaseOrder??0)-(b.releaseOrder??0);
    const cmp=x.localeCompare(y);
    return (sortOrder==='newest'?-cmp:cmp)||(a.releaseOrder??0)-(b.releaseOrder??0);
   });
   return rows;
  }
 rows.sort((a,b)=>{
  if(sortOrder==='az'||sortOrder==='za'){
   const v=a.name.localeCompare(b.name,'en',{sensitivity:'base',numeric:true});
   return sortOrder==='az'?v:-v;
  }
  if(sortOrder==='oldest'||sortOrder==='newest'){
   const x=a.releaseDate,y=b.releaseDate;
   if(!x||!y)return x?-1:y?1:a.releaseOrder-b.releaseOrder;
   return sortOrder==='oldest'?x.localeCompare(y):y.localeCompare(x);
  }
  const x=rank.endsWith('overall')?a.streams:a.gain;
  const y=rank.endsWith('overall')?b.streams:b.gain;
  if(x==null)return y==null?0:1;
  if(y==null)return -1;
  return sortOrder==='least'?x-y:y-x;
 });
 return rows;
}

function soloArtistTrackIds(s){
 if(!s)return [];
 if(tab==='solo'&&isHistorical(s))return soloLegacyTrackIds(s,selectedSoloArtist);
 if(tab!=='solo'||!selectedSoloArtist)return trackIds(s);
 const ids=ownedSoloIds(selectedSoloArtist);
 return trackIds(s).filter(id=>ids.has(id));
}
function soloArtistRows(rows,s,p,baseline,pp){
 if(tab==='solo'&&rank.startsWith('albums'))return rows;
 if(tab==='solo'&&isHistorical(s))return rows; // Already filtered by the workbook's artist credit blocks.
 if(tab!=='solo'||!selectedSoloArtist)return rows;
 const ids=ownedSoloIds(selectedSoloArtist);
 const artist=selectedSoloArtist.toLowerCase();
 const releases=catalog.solo||[];
 return rows.flatMap(row=>{
  if(row.kind==='album'){
   // Keep multi-release combined totals intact. Recomputing from just the
   // artwork release discards the Korean LIMBO version from Jun's total.
   if(row.historyReleases?.includes('jun_g4Chinese')&&row.historyReleases?.includes('jun_g4Korean')){
    return selectedSoloArtist==='Jun'?[row]:[];
   }
   const release=releases.find(item=>item.key===row.artworkRelease);
   if(!release)return [];
   if(selectedSoloArtist==='Jeonghan'&&['jxj_dreamscape','jxw_g1'].includes(release.key))return [];
   const preferredV8={V8:'v8',The8:'the8_g12',Vernon:'vernon_g9'};
   if(['v8','the8_g12','vernon_g9'].includes(release.key)&&release.key!==preferredV8[selectedSoloArtist])return [];
   const dreamscapeKeys=['jeonghan_g2','joshua_g8','jxj_dreamscape'];
   const preferredDreamscape={Jeonghan:'jeonghan_g2',Joshua:'joshua_g8',JxJ:'jxj_dreamscape'};
   if(dreamscapeKeys.includes(release.key)&&release.key!==preferredDreamscape[selectedSoloArtist])return [];
   if(['picheolin_g3','dino_g4'].includes(release.key)&&release.key!==(selectedSoloArtist==='Dino'?'dino_g4':'picheolin_g3'))return [];
   const allIds=[...new Set(release.tracks||[])];
   const matching=allIds.filter(id=>ids.has(id));
   if(!matching.length)return [];
   // Only the unit profile receives all tracks. An individual member sees
   // their own contribution and the corresponding 6/7-track subtotal.
   const allAvailable=matching.every(id=>s?.tracks?.[id]!=null);
   const streams=allAvailable?matching.reduce((sum,id)=>sum+Number(s.tracks[id]),0):null;
   const periodic=['weekly','monthly','yearly'].some(period=>rank.endsWith(period));
   const gains=matching.map(id=>periodic?periodGain(s,baseline,id):safeGain(s,p,id));
   const gain=gains.every(value=>value!=null)?gains.reduce((sum,value)=>sum+value,0):null;
   const comparison=periodic?periodComparison(s,baseline,matching):dailyComparison(s,p,pp,matching);
   return [{...row,streams,gain,change:comparison.value,changePartial:comparison.partial}];
  }
  if(row.id){
   if(!ids.has(row.id))return [];
   const key=row.artworkRelease;
   if(selectedSoloArtist==='Jeonghan'&&['jxj_dreamscape','jxw_g1'].includes(key))return [];
   const v8={V8:'v8',The8:'the8_g12',Vernon:'vernon_g9'};
   if(['v8','the8_g12','vernon_g9'].includes(key)&&key!==v8[selectedSoloArtist])return [];
   const dreamscape={Jeonghan:'jeonghan_g2',Joshua:'joshua_g8',JxJ:'jxj_dreamscape'};
   if(['jeonghan_g2','joshua_g8','jxj_dreamscape'].includes(key)&&key!==dreamscape[selectedSoloArtist])return [];
   if(['picheolin_g3','dino_g4'].includes(key)&&key!==(selectedSoloArtist==='Dino'?'dino_g4':'picheolin_g3'))return [];
   return [row];
  }
  return [];
 });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let renderToken=0;
// To compare matching calendar periods instead of unrelated dates.
function utcDate(date){return new Date(date+'T00:00:00Z')}
function isoDate(d){return d.toISOString().slice(0,10)}
function shifted(date,days){const d=utcDate(date);d.setUTCDate(d.getUTCDate()+days);return isoDate(d)}
function shiftedMonth(date,n){const d=utcDate(date),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n);const month=d.getUTCMonth();d.setUTCDate(day);if(d.getUTCMonth()!==month)d.setUTCDate(0);return isoDate(d)}
function shiftedYear(date,n){const d=utcDate(date),month=d.getUTCMonth();d.setUTCFullYear(d.getUTCFullYear()+n);if(d.getUTCMonth()!==month)d.setUTCDate(0);return isoDate(d)}
function periodDates(date){
 const d=utcDate(date),elapsed=(d.getUTCDay()+6)%7;
 let first,prevFirst,prevLast;
 if(rank.endsWith('weekly')){
  first=shifted(date,-elapsed);
  prevFirst=shifted(first,-7);
  prevLast=shifted(date,-7);
 }else if(rank.endsWith('monthly')){
  first=date.slice(0,7)+'-01';
  prevFirst=shiftedMonth(first,-1);
  // Completed calendar months compare with the entire previous month,
  // even when one month has 28/29/30 days and the other has 31.
  // In-progress months compare like-for-like dates wherever possible.
  const currentMonthDays=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
  const previousMonthDays=new Date(Date.UTC(Number(prevFirst.slice(0,4)),Number(prevFirst.slice(5,7)),0)).getUTCDate();
  const previousDays=d.getUTCDate()===currentMonthDays?previousMonthDays:Math.min(d.getUTCDate(),previousMonthDays);
  prevLast=shifted(prevFirst,previousDays-1);
 }else if(rank.endsWith('yearly')){
  first=date.slice(0,4)+'-01-01';
  prevFirst=shiftedYear(first,-1);
  prevLast=shifted(prevFirst,Math.min(Math.round((Date.parse(date)-Date.parse(first))/86400000),365));
 }else return null;
 return {start:shifted(first,-1),first,prevStart:shifted(prevFirst,-1),prevEnd:prevLast};
}
async function periodBaseline(s){
 if(!s||!['weekly','monthly','yearly'].some(p=>rank.endsWith(p)))return null;
 const range=periodDates(s.date),available=new Set(dates);
 // A calendar-period gain must start at its actual boundary. Using a
 // nearby observation silently turns a weekly/monthly number into an
 // arbitrary shorter interval.
 const get=async date=>available.has(date)?getDate(tab,date):null;
 const [start,prevStart,prevEnd]=await Promise.all([
  get(range.start),get(range.prevStart),get(range.prevEnd)
 ]);
 // If the current boundary is missing, show only the sum of consecutive,
 // individually verified daily observations. Never bridge a missing date.
 // Changes compare ONLY equivalent calendar days from the prior period.
 if(!start&&(rank.endsWith('weekly')||rank.endsWith('monthly'))){
  const periodFirst=range.first;
  const periodPreviousFirst=rank.endsWith('weekly')
   ?shifted(periodFirst,-7):shiftedMonth(periodFirst,-1);
  const currentDays=dates.filter(date=>date>=periodFirst&&date<=s.date).sort();
  const makePairs=async days=>(await Promise.all(days.map(async day=>{
   const before=shifted(day,-1);
   if(!available.has(before))return null;
   const [now,previous]=await Promise.all([getDate(tab,day),getDate(tab,before)]);
   return now&&previous?[now,previous]:null;
  }))).filter(Boolean);
  const observedPairs=await makePairs(currentDays);
  const priorEquivalentDays=observedPairs.map(([now])=>
   rank.endsWith('weekly')?shifted(now.date,-7):shiftedMonth(now.date,-1)
  ).filter(day=>day>=periodPreviousFirst);
  const previousObservedPairs=await makePairs(priorEquivalentDays);
  return {start:null,prevStart,prevEnd,range,observedPairs,
   previousObservedPairs,partialPeriod:true,
   partialWeek:rank.endsWith('weekly')};
 }
 // Early November 2025 has no pre-November baseline. Build weekly gains
 // from the real consecutive-day observations instead of returning blanks.
 if(tab==='group'&&rank.endsWith('weekly')&&
    (s.date.startsWith('2025-11')||!start||start.date!==range.start||
     !prevStart||prevStart.date!==range.prevStart||
     !prevEnd||prevEnd.date!==range.prevEnd)){
  const weekStart=range.first;
  const observed=dates.filter(d=>d>=weekStart&&d<=s.date).sort();
  const makePairs=async dayList=>(await Promise.all(dayList.map(async day=>{
   const previousDay=shifted(day,-1);
   if(!available.has(previousDay))return null;
   const [now,previous]=await Promise.all([getDate('group',day),getDate('group',previousDay)]);
   return now&&previous?[now,previous]:null;
  }))).filter(Boolean);
  const previousWeekStart=shifted(weekStart,-7);
  // Align the comparison to the same weekday in the prior week.
  const previousWeekEnd=range.prevEnd;
  const previousDates=dates.filter(d=>d>=previousWeekStart&&d<=previousWeekEnd).sort();
  return {start,prevStart,prevEnd,range,
   observedPairs:await makePairs(observed),
   previousObservedPairs:await makePairs(previousDates),
   partialWeek:true};
 }
 // The 2025 archive begins on November 16, not January 1.
 // Show only real consecutive observations for 2025 Yearly; never call the
 // incomplete archive a full-year gain or manufacture January–October data.
 if(tab==='group'&&rank.endsWith('yearly')&&s.date.startsWith('2025-')&&!start){
  const observed=dates.filter(d=>d.startsWith('2025-')&&d<=s.date&&available.has(shifted(d,-1))).sort();
  const observedPairs=(await Promise.all(observed.map(async d=>{
   const [now,before]=await Promise.all([getDate('group',d),getDate('group',shifted(d,-1))]);
   return now&&before?[now,before]:null;
  }))).filter(Boolean);
  return {start:null,prevStart:null,prevEnd:null,range,
   observedPairs,previousObservedPairs:[],partialYear:true,
   observedDates:observedPairs.map(([now])=>now.date)};
 }
 // Historical months with missing dates: count only actual consecutive daily
 // observations. This prevents a gap from being reported as a single day's
 // streams, and never assumes an absent spreadsheet row is zero.
 if(tab==='group'&&rank.endsWith('monthly')&&['2025-11','2025-12'].includes(s.date.slice(0,7))){
  const month=s.date.slice(0,7);
  const observed=dates.filter(d=>d.startsWith(month)&&d<=s.date).sort();
  const pairs=await Promise.all(observed.map(async day=>{
   const previousDay=shifted(day,-1);
   if(!dates.includes(previousDay))return null;
   const [now,previous]=await Promise.all([getDate('group',day),getDate('group',previousDay)]);
   return now&&previous?[now,previous]:null;
  }));
  const missing=[];
  const last=Number(s.date.slice(8));
  for(let day=1;day<=last;day++){
   const d=month+'-'+String(day).padStart(2,'0');
   if(!dates.includes(d))missing.push(day);
  }
  let previousPairs=[];
  if(month==='2025-12'){
   const november=dates.filter(d=>d.startsWith('2025-11')).sort();
   const comparison=await Promise.all(november.map(async day=>{
    const yesterday=shifted(day,-1);
    if(!dates.includes(yesterday))return null;
    const [now,before]=await Promise.all([getDate('group',day),getDate('group',yesterday)]);
    return now&&before?[now,before]:null;
   }));
   previousPairs=comparison.filter(Boolean);
  }
  return {start:await getDate('group',observed[0]),prevStart:null,prevEnd:null,range,
   observedPairs:pairs.filter(Boolean),previousObservedPairs:previousPairs,
   observedDays:observed.length,missingDays:missing,partialMonth:month};
 }
 // Always retain consecutive-day observations for week/month rows.
 // Some recordings are absent or reset even when the whole snapshot's
 // anomaly list is empty; per-track fallback must still work.
 if(rank.endsWith('weekly')||rank.endsWith('monthly')){
  const pairsFor=async(first,last)=>{
   const dayList=dates.filter(date=>date>=first&&date<=last).sort();
   return (await Promise.all(dayList.map(async day=>{
    const yesterday=shifted(day,-1);
    if(!available.has(yesterday))return null;
    const [now,previous]=await Promise.all([getDate(tab,day),getDate(tab,yesterday)]);
    return now&&previous?[now,previous]:null;
   }))).filter(Boolean);
  };
  const currentPairs=await pairsFor(range.first,s.date);
  const previousFirst=rank.endsWith('weekly')?shifted(range.first,-7):shiftedMonth(range.first,-1);
  const previousPairs=await pairsFor(previousFirst,range.prevEnd);
  return {start,prevStart,prevEnd,range,
   fallbackPairs:currentPairs,previousFallbackPairs:previousPairs};
 }
 return {start,prevStart,prevEnd,range};
}
// To reuse the verified November 5 track match for earlier spreadsheet dates.
function bridgeHistoricalTrack(now,old,id){
 if(!now||!old||isHistorical(now)||!isHistorical(old))return null;
 return comparablePrevious(now,old,id)?.id||null;
}
// A current Spotify track ID may not appear in a pre-November-2026
// spreadsheet. Resolve it using the workbook ID verified at the November 5
// crossover; do not substitute album or anthology subtotal rows.
function historicalGroupTrackId(snapshot,id){
 if(!snapshot||!isHistorical(snapshot)||tab!=='group'||snapshot.tracks?.[id]!=null)return id;
 const mapped=current.group?.baseline_ids_2026_11_05?.[id];
 const liveName=current.group?.names?.[id]||idName[id]||'';
 const oldName=mapped?snapshot.names?.[mapped]:'';
 const clean=n=>normTrackName(String(n||'')
  .replace(/\s*\((?:prod\.?\s*by|feat\.?|ft\.?)\s+[^)]*\)/gi,'')
  .replace(/\s*\b(?:feat\.?|ft\.?)\s+.*$/i,''));
 const verifiedAliases={
  '2kDrUAONMhG6CbDGBkhdrY':'worldfeatannemarrie',
  '6KfYVOicblNB8CaDZwbxiT':'dirtydancingfearjoshuadkdino',
  '3oTDi9MWC0JB39FcsLRon3':'sosprodmarshmello',
  '0xZ4WU5UfctiSeETi6pMEo':'golm',
  '2B0l8kFr4PzxH6gqX3NIoi':'badinfluence',
  '3ESkEsiPkaXl0CCRUMGkIk':'damagehoshisolo'
 };
 if(mapped&&snapshot.tracks?.[mapped]!=null&&historicalKind(snapshot,mapped)==='track'&&
    (normTrackName(liveName)===normTrackName(oldName)||
     (verifiedAliases[id]&&normTrackName(oldName).startsWith(verifiedAliases[id]))||
     (clean(liveName).length>=5&&clean(liveName)===clean(oldName))))
  return mapped;
 // Duplicate workbook rows for the same song are safe ONLY when every
 // matching track row has an identical recorded stream count.
 const matches=Object.keys(snapshot.tracks||{}).filter(key=>
  historicalKind(snapshot,key)==='track'&&
  normTrackName(snapshot.names?.[key])===normTrackName(liveName));
 if(!matches.length||new Set(matches.map(key=>snapshot.tracks[key])).size!==1)return id;
 return matches[0];
}
function snapshotDelta(now,old,id){
 if(!now||!old)return null;
 id=historicalGroupTrackId(now,id);
 if(now.tracks?.[id]==null)return null;
 const historical=!isHistorical(now)&&isHistorical(old);
 const matched=historical?bridgeHistoricalTrack(now,old,id):null;
 const prev=matched?{id:matched,value:old.tracks[matched]}:comparablePrevious(now,old,id);
 if(!prev||(now.anomalies||[]).includes(id)||(old.anomalies||[]).includes(prev.id))return null;
 if((!isHistorical(now)&&now.tracks[id]===0)||(!isHistorical(old)&&prev.value===0)||
    (now.unavailable_tracks||[]).includes(id)||(old.unavailable_tracks||[]).includes(prev.id))return null;
 const days=(Date.parse(now.date)-Date.parse(old.date))/86400000;
 if(!Number.isFinite(days)||days<=0)return null;
 const delta=now.tracks[id]-prev.value;
 if(delta<0)return null;
 // To avoid inflated gains from unmatched spreadsheet recordings.
 if(historical&&prev.id!==id&&!matched)return null;
 // To avoid counting a spreadsheet-to-Spotify correction as monthly streams.
 if(historical&&delta>Math.max(100000*days,now.tracks[id]*0.05))return null;
 return delta;
}
// A single anomalous day inside a period invalidates the full-boundary
// difference for that recording, even if both month-end values look valid.
function incompleteObservedPeriod(s,context,id){
 if(!context?.range?.first)return false;
 const expected=Math.round((Date.parse(s.date)-Date.parse(context.range.first))/86400000)+1;
 const pairs=context.observedPairs||context.fallbackPairs;
 if(!pairs)return false;
 return pairs.length!==expected||
  pairs.some(([now,prev])=>snapshotDelta(now,prev,id)==null);
}
function periodGain(s,context,id){
 if(context?.observedPairs){
  const gains=context.observedPairs.map(([now,previous])=>snapshotDelta(now,previous,id));
  const valid=gains.filter(v=>v!=null);
  return valid.length?valid.reduce((a,b)=>a+b,0):null;
 }
 const direct=context?.start?snapshotDelta(s,context.start,id):null;
 if(direct!=null&&!incompleteObservedPeriod(s,context,id))return direct;
 const valid=(context?.fallbackPairs||[]).map(([now,prev])=>snapshotDelta(now,prev,id)).filter(v=>v!=null);
 return valid.length?valid.reduce((a,b)=>a+b,0):null;
}
function periodChange(s,context,id){
 if(!context)return null;
 // Both regular and sparse archives use real, dated consecutive-day pairs.
 // Match days across periods before subtracting. An invalid track observation
 // in one week/month cannot be compared against a different set of days.
 const current=context.observedPairs||context.fallbackPairs||[];
 const previous=context.previousObservedPairs||context.previousFallbackPairs||[];
 const priorMap=new Map(previous.map(pair=>[pair[0].date,pair]));
 const offset=date=>rank.endsWith('weekly')?shifted(date,-7):shiftedMonth(date,-1);
 const differences=[];
 for(const pair of current){
  const old=priorMap.get(offset(pair[0].date));
  if(!old)continue;
  const gain=snapshotDelta(pair[0],pair[1],id);
  const previousGain=snapshotDelta(old[0],old[1],id);
  if(gain!=null&&previousGain!=null)differences.push(gain-previousGain);
 }
 const partialComparison=differences.length?differences.reduce((a,b)=>a+b,0):null;
 if(context.observedPairs)return partialComparison;
 // When all exact boundaries are present and every intervening observation
 // is valid, use complete period totals. Otherwise use the matched-day
 // partial comparison above, marked with * by the row renderer.
 if(incompleteObservedPeriod(s,context,id))return partialComparison;
 if(!context.start||!context.prevStart||!context.prevEnd)return partialComparison;
 const now=snapshotDelta(s,context.start,id);
 const startMatch=comparablePrevious(s,context.start,id);
 const prevEndMatch=comparablePrevious(s,context.prevEnd,id);
 const matched=prevEndMatch||(startMatch&&context.prevEnd.tracks?.[startMatch.id]!=null
  ?{id:startMatch.id,value:context.prevEnd.tracks[startMatch.id]}:null);
 if(!matched)return partialComparison;
 const before=snapshotDelta(context.prevEnd,context.prevStart,matched.id);
 if(now==null||before==null)return partialComparison;
 const elapsed=(Date.parse(s.date)-Date.parse(context.start.date))/86400000;
 const previousElapsed=(Date.parse(context.prevEnd.date)-Date.parse(context.prevStart.date))/86400000;
 return rank.endsWith('monthly')||elapsed===previousElapsed?now-before:partialComparison;
}
function incompletePeriodComparison(s,context,id){
 if(!context||!(rank.endsWith('weekly')||rank.endsWith('monthly')))return false;
 const pairs=context.observedPairs||context.fallbackPairs||[];
 const previous=context.previousObservedPairs||context.previousFallbackPairs||[];
 const expected=Math.round((Date.parse(s.date)-Date.parse(context.range?.first))/86400000)+1;
 const priorMap=new Map(previous.map(pair=>[pair[0].date,pair]));
 const offset=date=>rank.endsWith('weekly')?shifted(date,-7):shiftedMonth(date,-1);
 const valid=pairs.filter(pair=>{
  const old=priorMap.get(offset(pair[0].date));
  return old&&snapshotDelta(pair[0],pair[1],id)!=null&&snapshotDelta(old[0],old[1],id)!=null;
 });
 return valid.length!==expected||incompleteObservedPeriod(s,context,id);
}
// To keep album and track comparisons aligned to the same dates.
function sumPeriod(s,context,ids){
 if(!ids.length)return null;
 const values=ids.map(id=>periodGain(s,context,id));
 return values.every(v=>v!=null)?values.reduce((a,b)=>a+b,0):null;
}
function partialPeriodSum(s,context,ids){
 const values=ids.map(id=>periodGain(s,context,id));
 const valid=values.filter(v=>v!=null);
 return {value:valid.length?valid.reduce((a,b)=>a+b,0):null,
  partial:valid.length<ids.length||ids.some(id=>incompleteObservedPeriod(s,context,id))};
}
function periodComparison(s,context,ids){
 if(!ids.length)return {value:null,partial:false,matched:0,total:0};
 const values=ids.map(id=>periodChange(s,context,id));
 const valid=values.filter(v=>v!=null);
 return {value:valid.length?valid.reduce((a,b)=>a+b,0):null,
  partial:valid.length<ids.length||ids.some(id=>incompletePeriodComparison(s,context,id)),
  matched:valid.length,total:ids.length};
}
function sumPeriodChange(s,context,ids){return periodComparison(s,context,ids).value}
async function updateYear2026Streams(){
 const value=document.getElementById('svtYear2026Streams');
 const note=document.getElementById('svtYear2026Note');
 if(!value)return;
 const total=snapshot=>{
  if(!snapshot)return null;
  const grand=Object.keys(snapshot.tracks||{}).find(id=>historicalKind(snapshot,id)==='grand');
  if(grand&&Number.isFinite(snapshot.tracks[grand]))return snapshot.tracks[grand];
  const ids=snapshot.canonical_track_ids;
  if(Array.isArray(ids)&&ids.length===227&&ids.every(id=>Number.isFinite(snapshot.tracks?.[id])))
   return ids.reduce((sum,id)=>sum+snapshot.tracks[id],0);
  return null;
 };
 try{
  const newest=[...(current.group?.date?[current.group.date]:[]),...dates.filter(d=>d.startsWith('2026-'))].sort().at(-1);
  const now=newest===current.group?.date?await latest('group'):await getDate('group',newest);
  const before=await getDate('group','2025-12-31');
  const latestTotal=total(now),previousTotal=total(before);
  if(latestTotal==null||previousTotal==null||latestTotal<previousTotal){
   value.textContent='Unavailable';
   note.textContent='* · Year still counting · Awaiting comparable archive totals';
   return;
  }
  value.textContent=(latestTotal-previousTotal).toLocaleString('en-US');
  note.textContent='* · Year still counting · Updated through '+now.date+' · Refreshes with daily snapshots';
 }catch(e){
  value.textContent='Unavailable';
  note.textContent='* · Year still counting · Data temporarily unavailable';
  console.warn('Yearly stream calculation unavailable',e);
 }
}

const rankCompactFormatter=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
/* Every ranking uses the same cumulative totals, period gain and period-to-period comparison.
   A missing previous snapshot is shown as unavailable; it is never treated as zero. */
function rankMetricHtml(value,key,label,{signed=false,estimated=false,partial=false}={}){
 const missing=value==null||!Number.isFinite(Number(value));
 const number=Number(value);
 const display=missing?'—':(estimated?'≈':signed?(number>=0?'+':'−'):'')+fmt(Math.abs(number))+(partial?'*':'');
 const compact=missing?'—':(estimated?'≈':signed?(number>=0?'+':'−'):'')+
  rankCompactFormatter.format(Math.abs(number))+(partial?'*':'');
 return '<div class="num rank-metric rank-metric-'+key+(missing?' missing-value':number<0?' negative':number>0&&signed?' positive':number===0&&signed?' unchanged':'')+'" title="'+label+': '+display+'">'+
  '<span class="metric-label">'+label+'</span><span class="metric-value">'+display+'</span>'+
  '<span class="metric-compact" aria-hidden="true">'+compact+'</span></div>';
}
/* One absolutely positioned rule per metric column, spanning the header and
   the entire list. Per-row pseudo-borders were clipped by overflow:hidden and
   visibly broke at every row; measuring the real grid keeps all views aligned. */
function syncRankingColumnRules(){
 const root=document.getElementById('svtPrimaryStats');
 const list=document.getElementById('ranking');
 if(!root||!list)return;
 let rules=root.querySelector(':scope > .svt-continuous-column-rules');
 if(!rules){
  rules=document.createElement('div');
  rules.className='svt-continuous-column-rules';
  rules.setAttribute('aria-hidden','true');
  root.appendChild(rules);
 }
 const first=list.querySelector('.rank-row');
 if(!first||root.hidden){rules.hidden=true;rules.replaceChildren();return}
 const columns=[...first.querySelectorAll(':scope > .rank-metric')].filter(el=>
  getComputedStyle(el).display!=='none').sort((a,b)=>
  a.getBoundingClientRect().left-b.getBoundingClientRect().left);
 if(columns.length<2){rules.hidden=true;rules.replaceChildren();return}
 const rootRect=root.getBoundingClientRect();
 const listRect=list.getBoundingClientRect();
 const head=root.querySelector('.table-head');
 const headVisible=head&&getComputedStyle(head).display!=='none';
 const start=headVisible?head.getBoundingClientRect().top:listRect.top;
 const columnGap=parseFloat(getComputedStyle(first).columnGap)||0;
 rules.style.top=(start-rootRect.top)+'px';
 rules.style.height=Math.max(0,listRect.bottom-start)+'px';
 rules.replaceChildren(...columns.map(metric=>{
  const line=document.createElement('i');
  line.className='svt-column-rule';
  line.style.left=(metric.getBoundingClientRect().left-rootRect.left-columnGap/2)+'px';
  return line;
 }));
 rules.hidden=false;
}
window.addEventListener('resize',()=>requestAnimationFrame(syncRankingColumnRules),{passive:true});

/* A colored delta must be an observed signed number, never a missing
   comparison, a track count, or a neutral zero. */
function updatePrimaryDeltaTones(){
 for(const id of ['gain','listenersChange','followersChange']){
  const el=document.getElementById(id);
  if(!el)continue;
  const match=el.textContent.trim().match(/^([+−-])\s*([\d,]+)/);
  const value=match?Number(match[2].replaceAll(',','')):0;
  const positive=Boolean(value>0&&match?.[1]==='+');
  const negative=Boolean(value>0&&match?.[1]!=='+' );
  el.classList.toggle('svt-gain-positive',positive);
  el.classList.toggle('svt-gain-negative',negative);
 }
}
function renderRankMetrics(row,selectedDate=''){
 const incompleteMonth=rank.endsWith('monthly')&&selectedDate&&
  Number(selectedDate.slice(8))<new Date(Date.UTC(Number(selectedDate.slice(0,4)),Number(selectedDate.slice(5,7)),0)).getUTCDate();
 const gainLabel=rank.endsWith('weekly')?'Gain this week':rank.endsWith('monthly')?
  (incompleteMonth?'Month-to-date gain':'Monthly gain'):
  rank.endsWith('yearly')?'Gain this year':'Gain vs yesterday';
 const compareWith=rank.endsWith('weekly')?'last week':rank.endsWith('monthly')?
  (incompleteMonth?'same days last month':'previous month'):
  rank.endsWith('yearly')?'last year':'yesterday';
 // Solo/unit charts show the selected gain and change until Overall is chosen.
 // The history inspector still exposes the verified cumulative stream count.
 const showStreams=rank.endsWith('overall')||(rank.endsWith('daily')&&rankType==='tracks')||(tab==='group'&&!rank.endsWith('daily'))||(tab==='solo'&&rank.startsWith('discography'));
 return (showStreams?rankMetricHtml(row.streams,'streams','Total streams'):'')+
  rankMetricHtml(row.gain,'gain',row.gainPartial?gainLabel+' (verified observed dates only)':gainLabel,{signed:true,estimated:row.estimatedGain,partial:row.gainPartial})+
  rankMetricHtml(row.change,'change','Change vs '+compareWith,{signed:true,partial:row.changePartial});
}

// Keep song and release titles on one line on narrow phones, choosing a font
// size from the actual rendered width rather than relying on device presets.
// Only measure and adjust after the ranking rows exist (no per-row listeners).
let compactNameFitFrame=0;
function fitMobileRankingNames(){
 if(!window.matchMedia('(max-width:900px)').matches){
  document.querySelectorAll('#ranking .track-copy .track-name').forEach(el=>el.style.removeProperty('font-size'));
  return;
 }
 const names=[...document.querySelectorAll('#ranking .rank-row .track-copy .track-name')];
 if(!names.length)return;
 for(const name of names)name.style.removeProperty('font-size');
 const metrics=names.map(name=>{
  const style=getComputedStyle(name);
  return {name,baseline:parseFloat(style.fontSize)||10,
   available:name.clientWidth,natural:name.scrollWidth};
 });
 for(const {name,baseline,available,natural} of metrics){
  if(available<1||natural<=available+1)continue;
  // Leave a little room for Safari's rounded glyph widths.
  const size=Math.max(6,Math.floor(baseline*(available-2)/natural*10)/10);
  name.style.setProperty('font-size',size+'px','important');
  name.title=name.title||name.textContent.trim();
 }
}
function scheduleMobileRankingNameFit(){
 if(compactNameFitFrame)cancelAnimationFrame(compactNameFitFrame);
 compactNameFitFrame=requestAnimationFrame(()=>{
  compactNameFitFrame=0;
  fitMobileRankingNames();
 });
}
window.addEventListener('resize',scheduleMobileRankingNameFit,{passive:true});
window.addEventListener('orientationchange',scheduleMobileRankingNameFit,{passive:true});
document.fonts?.ready.then(scheduleMobileRankingNameFit).catch(()=>{});

async function render(){const token=++renderToken;
 const milestoneLink=document.querySelector('.milestone-nav-link');
 if(milestoneLink)milestoneLink.href='streaming-milestones.html?view='+(tab==='solo'?'solo':'group');
 document.body.classList.toggle('svt-units-solo',tab==='solo');
 document.body.classList.toggle('svt-solo-all',tab==='solo'&&!selectedSoloArtist);
 document.body.classList.toggle('svt-solo-without-audience',tab==='solo'&&['JxJ','V8'].includes(selectedSoloArtist));
 $('#ranking').innerHTML='<div class="empty">Loading saved streaming data…</div>';try{
 if(tab==='solo'){
  try{
   const response=await fetch('data/solo-followers.json',{cache:'no-store'});
   if(response.ok){
    const body=await response.json();
    if(body&&body.followers)verifiedSoloFollowers=body.followers;
   }
  }catch(error){console.warn('Follower data refresh unavailable; keeping last verified readings',error)}
 }
 if(token!==renderToken)return;
 useDatesForTab();renderArtistProfiles();syncPeriodPicker();const s=await selectedSnapshot(),p=await prior(s),pp=await prior(p);const baseline=await periodBaseline(s);if(token!==renderToken)return;if(tab==='group')updateYear2026Streams();syncCalendar();restoreGroupNames(s,p);
 document.body.classList.toggle('svt-overall-four-cols',rank.endsWith('overall'));
 document.body.classList.toggle('svt-daily-ranking',rank.endsWith('daily')&&tab==='group');
 document.body.classList.toggle('svt-daily-tracks',rank.endsWith('daily')&&rankType==='tracks');
 document.body.classList.toggle('svt-solo-period-only',tab==='solo'&&!rank.endsWith('overall')&&!rank.startsWith('discography'));
 document.body.classList.toggle('svt-solo-daily',tab==='solo'&&rank.endsWith('daily'));
 document.body.classList.toggle('svt-discography-table',rank.startsWith('discography'));
 const isPeriod=['weekly','monthly','yearly'].some(p=>rank.endsWith(p));
 const periodName=rank.endsWith('weekly')?'Weekly':rank.endsWith('monthly')?'Monthly':rank.endsWith('yearly')?'Yearly':'Daily';
 const periodDateLabel=()=>{
  if(!s)return '—';
  const format=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'});
  if(rank.endsWith('monthly'))return new Date(s.date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'});
  if(rank.endsWith('yearly'))return s.date.slice(0,4);
  if(rank.endsWith('weekly')){const monday=shifted(s.date,-((utcDate(s.date).getUTCDay()+6)%7));return format(monday)+' – '+format(shifted(monday,6))}
  return format(s.date);
 };
 $('#date').textContent=periodDateLabel();
 $('#dateDescription').textContent=baseline?.partialMonth
  ?'Partial '+new Date(baseline.partialMonth+'-01T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})+
   ' · Counted gains: '+(()=>{
     const dates=[...new Set(baseline.observedPairs.map(([now])=>now.date))].sort();
     const groups=[];
     for(const d of dates){
       const day=Number(d.slice(8)),last=groups[groups.length-1];
       if(last&&day===last[1]+1)last[1]=day;
       else groups.push([day,day]);
     }
     return groups.map(([a,b])=>a===b?String(a):a+'–'+b).join(', ');
   })()
  :isPeriod?'Latest available snapshot in selected '+periodName.toLowerCase()+' period.':'Spotify updates once a day.';
 if(baseline?.partialWeek){
  $('#dateDescription').textContent='Partial week: '+(baseline.observedPairs?.length||0)+
   ' verified consecutive-day gains. Missing days are not estimated; comparisons require matching weekdays.';
 }
 if(baseline?.partialYear){
  $('#dateDescription').textContent='Partial 2025: only '+baseline.observedDates.length+
   ' confirmed consecutive-day gains from the saved November–December archive. January–October and missing dates are not counted.';
 }
 if(baseline?.partialMonth==='2025-12'){
  $('#dateDescription').textContent+=' · Versus November 2025: comparison uses only saved consecutive-day gains in each month; missing days are not estimated.';
 }
 if(s?.unavailable_tracks?.length){
  $('#dateDescription').textContent+=' · '+s.unavailable_tracks.length+' track count(s) saved as 0 after three failed Spotify attempts; totals are partial.';
 }
 $('#gainHeading').textContent=(isPeriod?periodName.toUpperCase():rank.endsWith('overall')?'TOTAL':'DAILY')+' STREAM GROWTH';
 const ids=s?(tab==='solo'&&isHistorical(s)?soloLegacyTrackIds(s,null):trackIds(s)):[];
 const memberIds=tab==='solo'&&selectedSoloArtist&&s?soloArtistTrackIds(s):ids;
 const groupTrackCount=s&&tab==='group'&&isHistorical(s)?(Object.values(s.names||{}).some(n=>/^tiny light$/i.test(String(n).trim()))?227:226):ids.length;
 
 const periodStart=isPeriod?baseline?.start:p;
 // Gains use the prior day as their numeric baseline, but calendar-month
 // labels start on day 1. Never describe Oct 31 as part of November.
 const periodStartDate=isPeriod?(baseline?.range?.first||s?.date||''):(periodStart?.date||'');
 const monthEndDate=s&&rank.endsWith('monthly')
  ?new Date(Date.UTC(Number(s.date.slice(0,4)),Number(s.date.slice(5,7)),0)).toISOString().slice(0,10)
  :null;
 const periodWindowLabel=rank.endsWith('monthly')&&s
  ?periodStartDate+' through '+(s.date===monthEndDate?monthEndDate:s.date+
    ' (month to date; full month ends '+monthEndDate+')')
  :periodStartDate+' through '+(s?.date||'');
 const audiencePeriod=isPeriod?periodName.toLowerCase()+' period':rank.endsWith('overall')?'selected date':'day';
 const setAudience=(kind,valueId,changeId)=>{
  const getter=x=>tab==='solo'&&selectedSoloArtist
   ?soloArtistAudienceValue(x,selectedSoloArtist,kind):audienceValue(x,kind);
  const now=getter(s),before=getter(periodStart);
  $(valueId).textContent=fmt(now);
  const valid=now!=null&&before!=null&&s&&periodStart&&Date.parse(s.date)>Date.parse(periodStart.date);
  const diff=valid?now-before:null;
  $(changeId).textContent=diff==null?'Change for '+audiencePeriod+' unavailable':(diff>=0?'+':'−')+fmt(Math.abs(diff))+' vs '+(isPeriod?'start of '+audiencePeriod:'previous day');
 };
 setAudience('listeners','#listeners','#listenersChange');
 setAudience('followers','#followers','#followersChange');
 // An independent follower scan is timestamped when collected. Show its
 // real observation date only in the latest view, never backdate to an archive.
 if(tab==='solo'&&selectedSoloArtist&&selection==='latest'){
  const artistId=soloArtists.find(([name])=>name===selectedSoloArtist)?.[1];
  const observation=artistId?verifiedSoloFollowers[artistId]:null;
  if(observation&&Number.isFinite(Number(observation.count))){
   $('#followers').textContent=fmt(Number(observation.count));
   $('#followersChange').textContent=followerCapturedLabel(observation);
  }
 }

 const grandId=tab==='group'&&s&&isHistorical(s)?Object.keys(s.tracks).find(id=>historicalKind(s,id)==='grand'):null;
 const totalIds=tab==='solo'&&selectedSoloArtist?memberIds:ids;
 // A recorded zero is an observed count, not a missing recording.
 const totalMissing=totalIds.filter(id=>!Number.isFinite(s?.tracks?.[id])||s.tracks[id]<0);
 const recordedZeroes=totalIds.filter(id=>s?.tracks?.[id]===0).length;
 const calculatedTotal=s&&totalIds.length&&!totalMissing.length
  ?totalIds.reduce((sum,id)=>sum+s.tracks[id],0):null;
 const verifiedWorkbookGrand=grandId&&Number.isFinite(s?.tracks?.[grandId])?s.tracks[grandId]:null;
 const soloWorkbookGrand=tab==='solo'&&selectedSoloArtist&&isHistorical(s)
  ?(soloLegacySections(s)?.[selectedSoloArtist]||[]).find(row=>historicalKind(s,row.id)==='grand')?.value:null;
 $('#total').textContent=s?fmt(verifiedWorkbookGrand??soloWorkbookGrand??calculatedTotal):'—';
 $('#total').closest('.stat').querySelector('span').textContent=totalMissing.length?
  totalMissing.length+' recording(s) without saved counts · complete total unavailable':
  tab==='solo'?'Total recorded Spotify streams · '+totalIds.length+' unique recordings'+
   (recordedZeroes?' ('+recordedZeroes+' recorded as 0)':''):
   'Total Spotify track streams';
 const gainNote=$('#gain').nextElementSibling;
 const comparisonCard=$('#periodComparisonCard');
 const comparisonValue=$('#periodComparisonValue');
 const comparisonHeading=$('#periodComparisonHeading');
 const comparisonDetail=$('#periodComparisonDetail');
 comparisonCard.hidden=false;
 comparisonHeading.textContent=isPeriod?'VS PREVIOUS '+periodName.toUpperCase()+' PERIOD':'VS PREVIOUS DAY';
 comparisonValue.textContent='—';
 comparisonDetail.textContent='Comparison unavailable';
 if(gainNote)gainNote.textContent='Compared with previous '+(isPeriod?periodName.toLowerCase()+' period':'day')+': awaiting calculation';
 if(isPeriod){
  const summary=memberIds.map(id=>periodGain(s,baseline,id));
  const valid=summary.filter(n=>n!=null);
  // Group-wide historical workbook totals include all songs, including
  // recordings whose individual IDs were changed or omitted in old sheets.
  // Compare those totals directly rather than calling an incomplete song sum
  // the monthly growth of the whole group.
  const archivedGroupTotal=snapshot=>{
   if(!snapshot||tab!=='group')return null;
   const grand=isHistorical(snapshot)
    ?Object.keys(snapshot.tracks||{}).find(id=>historicalKind(snapshot,id)==='grand'):null;
   if(grand&&Number.isFinite(snapshot.tracks[grand]))return snapshot.tracks[grand];
   // For newer Spotify snapshots, use the canonical 227 unique songs.
   // Never sum album totals or duplicate entries into a group total.
   const canonical=snapshot.canonical_track_ids;
   if(Array.isArray(canonical)&&canonical.length===227&&
      canonical.every(id=>Number.isFinite(snapshot.tracks?.[id])))
    return canonical.reduce((sum,id)=>sum+snapshot.tracks[id],0);
   return null;
  };
  // Compare equal elapsed windows, never a partial week/month with a full one.
  const comparisonStart=baseline?.prevStart;
  const priorPeriodEndDate=rank.endsWith('weekly')?shifted(s.date,-7):rank.endsWith('monthly')?(()=>{
   const [year,month,day]=s.date.split('-').map(Number);
   const last=new Date(Date.UTC(year,month-1,0)).getUTCDate();
   return new Date(Date.UTC(year,month-2,Math.min(day,last))).toISOString().slice(0,10);
  })():rank.endsWith('yearly')?shifted(s.date,-365):null;
  // Reuse the validated prior-period endpoint found by periodBaseline.
  // An exact-date lookup can fail even when a usable saved snapshot exists.
  const priorPeriodEnd=baseline?.prevEnd||null;
  const previousStartTotal=archivedGroupTotal(comparisonStart);
  const previousEndTotal=archivedGroupTotal(priorPeriodEnd);
  const previousPeriodGain=previousStartTotal!=null&&previousEndTotal!=null&&previousEndTotal>=previousStartTotal?previousEndTotal-previousStartTotal:null;
  // The Nov 6 Spotify export uses a different track population than the
  // historical workbook. Bridge its independently verified daily gain to
  // the Nov 5 workbook grand total instead of subtracting incompatible totals.
  let currentTotal=archivedGroupTotal(s);
  if(tab==='group'&&s?.date==='2026-11-06'&&s.verified_daily_gain_2026_11_05===1891578){
   const nov5=await getDate('group','2026-11-05');
   const nov5Total=archivedGroupTotal(nov5);
   if(nov5Total!=null)currentTotal=nov5Total+1891578;
  }
  const historicTotal=archivedGroupTotal(baseline?.start);
  // For the sparse Nov/Dec 2025 archive, only count actual consecutive
  // saved days. A gap must never be presented as verified daily growth.
  const observedGrandGains=baseline?.observedPairs?.map(([now,previous])=>{
   const a=archivedGroupTotal(now),b=archivedGroupTotal(previous);
   return a!=null&&b!=null&&a>=b?a-b:null;
  });
  const observedGrandGain=observedGrandGains?.length&&observedGrandGains.every(v=>v!=null)
   ?observedGrandGains.reduce((a,b)=>a+b,0):null;
  const groupTotalGain=observedGrandGains
   ?observedGrandGain
   :tab==='group'&&currentTotal!=null&&historicTotal!=null&&
    Date.parse(s.date)>Date.parse(baseline.start.date)&&currentTotal>=historicTotal
    ?currentTotal-historicTotal:null;
  if(groupTotalGain!=null){
   $('#gain').textContent='+'+fmt(groupTotalGain);
   const periodFirst=baseline?.range?.first||s.date;
   const lastDayOfMonth=rank.endsWith('monthly')
    ?new Date(Date.UTC(Number(s.date.slice(0,4)),Number(s.date.slice(5,7)),0)).toISOString().slice(0,10):null;
   const periodLast=rank.endsWith('monthly')?lastDayOfMonth:s.date;
   const completePeriod=rank.endsWith('monthly')&&s.date===lastDayOfMonth;
   const fmtPeriodDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'});
   if(baseline?.partialMonth){
    const counted=baseline.observedPairs.length;
    const missing=baseline.missingDays.length;
    if(gainNote)gainNote.textContent='Partial archive: '+counted+' consecutive day-to-day changes counted; '+missing+' calendar dates without snapshots';
    comparisonDetail.textContent='Previous-month comparison unavailable for incomplete historical coverage';
   }
   if(previousPeriodGain!=null&&!baseline?.partialMonth){
    const difference=groupTotalGain-previousPeriodGain;
    comparisonValue.textContent=(difference>=0?'+':'−')+fmt(Math.abs(difference));
    comparisonDetail.textContent=difference>=0?'More streams than previous equivalent period':'Fewer streams than previous equivalent period';
    if(gainNote)gainNote.textContent=comparisonValue.textContent+' vs previous equivalent '+periodName.toLowerCase()+' period';
   }
  }else{
   if(gainNote)gainNote.textContent='Comparison unavailable for this saved period';
   $('#gain').textContent=valid.length?'+'+fmt(valid.reduce((a,b)=>a+b,0))+(valid.length<memberIds.length?'*':''):'—';
   if(gainNote){
    const compared=tab==='solo'?periodComparison(s,baseline,memberIds):null;
    gainNote.textContent=!valid.length
     ?'No comparable saved track counts for this '+periodName.toLowerCase()+' period.'
     :(valid.length<memberIds.length?'* Partial '+periodName.toLowerCase()+' gain ('+valid.length+' of '+memberIds.length+' tracks)':'Matched '+periodName.toLowerCase()+' gain')+' for '+periodWindowLabel;
    if(compared?.value!=null){
     const delta=compared.value;
     gainNote.textContent+=' · Change vs previous '+periodName.toLowerCase()+': '+
      (delta>=0?'+':'−')+fmt(Math.abs(delta))+
      (compared.partial?'* (matched days only)':'');
    }
   }
  }
 }else{
  const gains=s?memberIds.map(id=>safeGain(s,p,id)).filter(n=>n!=null):[];
  // Historical group totals come from the verified workbook grand-total row,
  // never from a potentially partial subset of tracks.
  const getGrand=snapshot=>{
   if(!snapshot||tab!=='group'||!isHistorical(snapshot))return null;
   const key=Object.keys(snapshot.tracks||{}).find(id=>historicalKind(snapshot,id)==='grand');
   const value=key?snapshot.tracks[key]:null;
   return Number.isFinite(value)?value:null;
  };
  const sGrand=getGrand(s),pGrand=getGrand(p);
  const historicalGrandGain=sGrand!=null&&pGrand!=null&&shifted(s.date,-1)===p.date&&sGrand>=pGrand?sGrand-pGrand:null;
  const grandGain=historicalGrandGain??(grandId&&!(tab==='solo'&&selectedSoloArtist)?safeGain(s,p,grandId):null);
  const verifiedDailyGain=tab==='group'&&s?.date==='2026-11-06'&&ids.length===227&&s.verified_daily_gain_2026_11_05===1891578?1891578:null;
  // A partial set of per-song matches is not a trustworthy OT13 daily gain.
  const completeSoloGain=memberIds.length>0&&gains.length===memberIds.length;
  const verifiedSoloGain=tab==='solo'&&gains.length?gains.reduce((sum,value)=>sum+value,0):null;
  const fullIds=tab==='group'&&!isHistorical(s)&&s?.canonical_track_ids?.length
   ? [...new Set(s.canonical_track_ids)] : null;
  const fullGroupGain=fullIds&&p&&s&&shifted(s.date,-1)===p.date&&
    fullIds.every(id=>Number.isFinite(s.tracks?.[id])&&Number.isFinite(p.tracks?.[id]))
   ?fullIds.reduce((sum,id)=>sum+s.tracks[id]-p.tracks[id],0):null;
  const authoritativeGain=verifiedDailyGain??grandGain??(fullGroupGain!=null&&fullGroupGain>=0?fullGroupGain:null);
  const hasVerifiedTotal=authoritativeGain!=null||verifiedSoloGain!=null;
  $('#gain').textContent=hasVerifiedTotal?'+'+fmt(authoritativeGain??verifiedSoloGain)+
   (tab==='solo'&&!completeSoloGain?'*':''):'—';
  if(gainNote){
   const today=authoritativeGain??verifiedSoloGain;
   const previousGrand=grandId&&p&&pp?safeGain(p,pp,grandId):null;
   const previousGains=p&&pp?memberIds.map(id=>safeGain(p,pp,id)):[];
   const archivedGrand=snapshot=>{
    if(!snapshot)return null;
    const id=Object.keys(snapshot.tracks||{}).find(id=>historicalKind(snapshot,id)==='grand');
    return id&&Number.isFinite(snapshot.tracks[id])?snapshot.tracks[id]:null;
   };
   const prevTotal=archivedGrand(p),beforePrevTotal=archivedGrand(pp);
   const historicalPreviousGain=prevTotal!=null&&beforePrevTotal!=null&&prevTotal>=beforePrevTotal?prevTotal-beforePrevTotal:null;
   const yesterday=historicalPreviousGain!=null?historicalPreviousGain:previousGrand!=null?previousGrand:previousGains.length&&previousGains.every(v=>v!=null)?previousGains.reduce((a,b)=>a+b,0):null;
   const consecutive=s&&p&&pp&&shifted(s.date,-1)===p.date&&shifted(p.date,-1)===pp.date;
   if(tab==='solo'){
    // Hide the redundant summary sentence (not the verified number).
    gainNote.textContent='';
   }else if(today!=null&&yesterday!=null&&consecutive){
    const change=today-yesterday;
    comparisonValue.textContent=(change>=0?'+':'−')+fmt(Math.abs(change));
    comparisonDetail.textContent=change>=0?'More streams than previous day':'Fewer streams than previous day';
    if(gainNote)gainNote.textContent=comparisonValue.textContent+' vs previous day';
   }else if(today!=null){gainNote.textContent='Previous-day comparison unavailable';comparisonDetail.textContent='Previous-day comparison unavailable';}
   else gainNote.textContent='Verified daily gain unavailable; incomplete matching track data';
  }
 }
 // This dashboard card is the track inventory, not a second stream-growth comparison.
 // Keep the existing growth comparison in the growth card's supporting text.
 comparisonHeading.textContent=tab==='group'?'TOTAL TRACKS':selectedSoloArtist?'ARTIST TRACKS':'UNIT & SOLO TRACKS';
 const displayedTrackCount=tab==='group'?groupTrackCount:memberIds.length;
 comparisonValue.textContent=s?fmt(displayedTrackCount):'—';
 comparisonDetail.textContent=s?(tab==='group'?'Unique group tracks in the selected archive':'Tracks included in the selected profile'):'No saved snapshot available';
 const discography=rank.startsWith('discography');
 const orderSelect=$('#order');
 const orderPicker=orderSelect.closest('.order-picker');
 // Discography keeps the same release order by default, but can be flipped.
 orderPicker.hidden=false;
 for(const option of orderSelect.options)option.hidden=discography&&!['oldest','newest'].includes(option.value);
 if(discography){
  if(!['oldest','newest'].includes(sortOrder))sortOrder='oldest';
  orderSelect.value=sortOrder;
 }else{
  orderSelect.value=sortOrder;
 }
 const metricPeriod=rank.endsWith('daily')?'daily':rank.endsWith('weekly')?'weekly':rank.endsWith('monthly')?'monthly':'yearly';
 orderSelect.querySelector('option[value="most"]').textContent=tab==='solo'&&!rank.endsWith('overall')?'Highest '+metricPeriod+' gain':'Most streamed';
 orderSelect.querySelector('option[value="least"]').textContent=tab==='solo'&&!rank.endsWith('overall')?'Lowest '+metricPeriod+' gain':'Least streamed';
 const q=$('#search').value.toLowerCase();
 const daily=rank.endsWith('daily'),periodic=rank.endsWith('weekly')||rank.endsWith('monthly')||rank.endsWith('yearly');
 const periodLabel=rank.endsWith('weekly')?'WEEKLY':rank.endsWith('monthly')?'MONTHLY':'YEARLY';
 const headers=document.querySelectorAll('.table-head span');
 headers[0].textContent='NAME';
 headers[1].textContent=rank.endsWith('overall')?'OVERALL STREAMS':'TOTAL STREAMS';
 headers[2].textContent=rank.endsWith('weekly')?'GAIN THIS WEEK':rank.endsWith('monthly')?'MONTH-TO-DATE GAIN':rank.endsWith('yearly')?'GAIN THIS YEAR':'DAILY INCREASE';
 headers[3].textContent='CHANGE';
 headers[3].title=rank.endsWith('monthly')?'Current month-to-date gain minus the gain from the same calendar days of the previous month (full-month comparisons for completed months)': 'Current gain minus the previous '+(rank.endsWith('weekly')?'week':rank.endsWith('yearly')?'year':'day')+' gain';
 document.querySelector('.table-head').classList.remove('period-ranking');$('#ranking').classList.remove('period-ranking');
 const allRankingRows=soloArtistRows(buildRows(s,p,pp,baseline),s,p,baseline,pp);
 // Discography search must work across both song names and release names.
 // Keep a matching album's tracks together; when a song alone matches,
 // retain its album-total row so the result still has context.
 const matchingDiscographyAlbums=new Set();
 const matchingDiscographyTracks=new Set();
 if(discography&&q.trim()){
  for(const item of allRankingRows){
   if(!String(item.name||'').toLowerCase().includes(q.trim()))continue;
   if(item.kind==='album'&&item.artworkRelease)matchingDiscographyAlbums.add(item.artworkRelease);
   if(item.kind==='track'&&item.artworkRelease)matchingDiscographyTracks.add(item.artworkRelease);
  }
 }
 const rows=allRankingRows.filter(x=>{
  if(q.trim()){
   const titleMatch=String(x.name||'').toLowerCase().includes(q.trim());
   if(!discography&&!titleMatch)return false;
   if(discography&&!titleMatch){
    const albumMatch=matchingDiscographyAlbums.has(x.artworkRelease);
    const trackAlbumTotal=x.kind==='album'&&matchingDiscographyTracks.has(x.artworkRelease);
    if(!albumMatch&&!trackAlbumTotal)return false;
   }
  }
  // The archive is a historical view: a future recording or album must
  // never appear before its first release, even as a blank placeholder.
  if(!s?.date)return true;
  const release=originalReleaseDate(x);
  if(release&&/^\d{4}-\d{2}-\d{2}$/.test(release)&&release>s.date)return false;
  if(tab==='group'&&/^(?:tiny\s*light)$/i.test(String(x.name||'').trim())&&s.date<'2026-02-27')return false;
  return true;
 });
 // A flagged workbook boundary must not hide a track's independently
 // verified daily increases. Clearly mark any rescued partial period.
 if(periodic&&baseline?.fallbackPairs?.length){
  for(const row of rows){
   if(row.gain==null)continue;
   const releases=row.historyReleases?.length?row.historyReleases:
    row.artworkRelease?[row.artworkRelease]:[];
   const ids=row.id?[row.id]:[...new Set(releases.flatMap(key=>
    (catalog[tab]||[]).find(item=>item.key===key)?.tracks||[]))];
   if(!ids.length)continue;
   const incomplete=ids.some(id=>!baseline.start||
    snapshotDelta(s,baseline.start,id)==null||
    incompleteObservedPeriod(s,baseline,id));
   if(incomplete){
    row.gainPartial=true;
    if(row.change!=null)row.changePartial=true;
   }
  }
 }
 // A missing period boundary means these are observed-day subtotals,
 // not a complete week/month. Label them so comparisons aren't misleading.
 if(periodic&&baseline?.partialPeriod){
  for(const row of rows){
   row.gainPartial=row.gain!=null;
   row.changePartial=row.change!=null;
  }
 }
 // Estimates are displayed only for missing growth, never recorded totals.
 if(daily||periodic){
  for(const row of rows){
   if(row.gain!=null||!row.id||row.streams==null)continue;
   let observed=null,observedDays=0,targetDays=0;
   if(daily&&p&&pp){
    observed=snapshotDelta(p,pp,row.id);
    observedDays=(Date.parse(p.date)-Date.parse(pp.date))/86400000;
    targetDays=(Date.parse(s.date)-Date.parse(p.date))/86400000;
    if(targetDays!==1)observed=null;
   }else if(periodic&&baseline?.prevStart&&baseline?.prevEnd){
    observed=snapshotDelta(baseline.prevEnd,baseline.prevStart,row.id);
    observedDays=(Date.parse(baseline.prevEnd.date)-Date.parse(baseline.prevStart.date))/86400000;
    targetDays=baseline.start?(Date.parse(s.date)-Date.parse(baseline.start.date))/86400000:0;
   }
   if(observed==null||observedDays<=0||targetDays<=0)continue;
   const estimate=Math.round(observed*targetDays/observedDays);
   if(estimate>=0&&estimate<=row.streams){row.gain=estimate;row.estimatedGain=true}
  }
 }
 // Resolve all per-row gains, then sort by the numbers actually displayed.
 if(tab==='solo'&&!discography&&(sortOrder==='most'||sortOrder==='least')){
  rows.sort((a,b)=>{
   const x=rank.endsWith('overall')?a.streams:a.gain;
   const y=rank.endsWith('overall')?b.streams:b.gain;
   if(x==null)return y==null?0:1;
   if(y==null)return -1;
   return (sortOrder==='least'?x-y:y-x)||String(a.name||'').localeCompare(String(b.name||''),'en',{numeric:true,sensitivity:'base'});
  });
 }
 // Rank movement compares the same Tracks/Albums chart with the immediately
 // preceding calendar day, week, month, or year (not the previous saved date).
 const positionKeyForDisplay=r=>r.albumIdentity?'album:'+r.albumIdentity:r.id&&String(r.id).startsWith('legacy:')?'name:'+normTrackName(r.name):r.id||'name:'+normTrackName(r.name);
 const rankMovements=new Map();
 if(!discography&&s){
  const priorDate=(daily||rank.endsWith('overall'))?shifted(s.date,-1):periodic?baseline?.prevEnd?.date:null;
  const previousSnapshot=priorDate?await getDate(tab,priorDate):null;
  if(previousSnapshot){
   const previousPrior=await prior(previousSnapshot);
   const previousPriorPrior=await prior(previousPrior);
   const previousBaseline=periodic?await periodBaseline(previousSnapshot):null;
   const priorRows=soloArtistRows(buildRows(previousSnapshot,previousPrior,previousPriorPrior,previousBaseline),previousSnapshot,previousPrior,previousBaseline,previousPriorPrior);
   // Rank changes belong to streaming positions, not the visible sort order.
   const positionKey=r=>r.albumIdentity?'album:'+r.albumIdentity:r.id&&String(r.id).startsWith('legacy:')?'name:'+normTrackName(r.name):r.id||'name:'+normTrackName(r.name);
   const streamValue=r=>daily||periodic?r.gain:r.streams;
   const byStreams=list=>[...list].sort((a,b)=>{
    const x=streamValue(a),y=streamValue(b);
    if(x==null)return y==null?0:1;
    if(y==null)return -1;
    return (sortOrder==='least'?x-y:y-x)||String(a.name||'').localeCompare(String(b.name||''),'en',{sensitivity:'base',numeric:true});
   });
   const positions=new Map();
   byStreams(priorRows).forEach((r,i)=>{
    positions.set(positionKey(r),i+1);
    const nameKey='name:'+normTrackName(r.name);
    if(!positions.has(nameKey))positions.set(nameKey,i+1);
   });
   byStreams(rows).forEach((r,i)=>{
    const key=positionKey(r);
    const old=positions.get(key)??positions.get('name:'+normTrackName(r.name));
    if(old!=null)rankMovements.set(key,old-(i+1));
   });
  }
 }
 $('#ranking').innerHTML=rows.length?rows.slice(0,discography?1000:250).map((r,i)=>`<div class="rank-row ${r.kind==='album'?'album-total-row':''}" data-history-id="${escapeHtml(r.id||'')}" data-history-release="${escapeHtml(r.artworkRelease||r.releaseKey||r.key||r.albumKey||'')}" data-history-releases="${escapeHtml((r.historyReleases||((r.kind==='album'&&/17 IS RIGHT HERE/i.test(r.name||''))?['g49','g50','g51','g52','g53','g54']:[])).join(','))}"><div class="track"><span class="rank-position"><span class="place">${discography?(r.kind==='album'?'◆':'·'):String(i+1).padStart(2,'0')}</span>${!discography?`<span class="rank-trend ${rankMovements.has(positionKeyForDisplay(r))?rankMovements.get(positionKeyForDisplay(r))>0?'rank-up':rankMovements.get(positionKeyForDisplay(r))<0?'rank-down':'rank-same':'rank-unknown'}" title="${rankMovements.has(positionKeyForDisplay(r))?'Streaming rank change versus previous '+(daily?'day':rank.endsWith('weekly')?'week':rank.endsWith('monthly')?'month':rank.endsWith('yearly')?'year':'period'):'Previous streaming rank unavailable'}">${rankMovements.has(positionKeyForDisplay(r))?rankMovements.get(positionKeyForDisplay(r))>0?'↑ '+rankMovements.get(positionKeyForDisplay(r)):rankMovements.get(positionKeyForDisplay(r))<0?'↓ '+Math.abs(rankMovements.get(positionKeyForDisplay(r))):'=':'—'}</span>`:''}</span>${`<span class="cover-slot">${true?`<img class="cover" data-cover-track="${artworkTrack(r)||'missing'}" data-cover-name="${escapeHtml(r.name)}" data-cover-kind="${r.kind==='album'?'album':'track'}" data-cover-fallback="${historicalAlbumCoverFallback(r)||artworkMap.tracks[coverKey(r.name)]?.id||artworkMap.albums[coverKey(r.name)]?.id||''}" alt="" loading="lazy"><span class="cover-placeholder" hidden></span>`:`<span class="cover-placeholder"></span>`}</span>`}<span class="track-copy">${streamTrackUrl(r)?`<a class="track-name track-stream-link" data-track-name-id="${r.id||''}" href="${streamTrackUrl(r)}" target="_blank" rel="noopener noreferrer" title="Stream ${escapeHtml(r.name)} on Spotify">${escapeHtml(r.name)}</a>`:`<span class="track-name" data-track-name-id="${r.id||''}">${escapeHtml(r.name)}</span>`}${(rankType==="albums"||rankType==="tracks"||discography||r.kind==="album")&&originalReleaseDate(r)?`<span class="release-date">Released ${formatOriginalRelease(originalReleaseDate(r))}</span>`:""}</span></div>${renderRankMetrics(r,s?.date||'')}</div>`).join('') :'<div class="empty">'+(!s?'No saved data is available for this category.':periodic?'No comparable saved snapshots for this period. Try another date.':'No matching entries found.')+'</div>';updatePrimaryDeltaTones();fillArtwork();requestAnimationFrame(syncRankingColumnRules);scheduleMobileRankingNameFit()}catch(error){console.error('Dashboard render failed',error);if(token===renderToken)$('#ranking').innerHTML='<div class="empty">Unable to display this snapshot. Please select another saved date or refresh.</div>'}}
function selectDashboardMode(view){
 const isAll=view==='all';
 activeDashboardMode=isAll?'all':'dashboard';
 try{sessionStorage.setItem(activeDashboardModeKey,activeDashboardMode)}catch{}
 const main=$('#svtPrimaryStats'),all=$('#svtAllView');
 if(main)main.hidden=isAll;
 if(all)all.hidden=!isAll;
 document.body.classList.toggle('svt-all-view',isAll);
 $('#tabs').querySelectorAll('button').forEach(button=>{
  const active=button.dataset.tab===(isAll?'all':tab);
  button.classList.toggle('active',active);
  button.setAttribute('aria-selected',String(active));
 });
 try{
  const url=new URL(location.href);
  if(isAll)url.searchParams.set('view','all');
  else if(url.searchParams.get('view')==='all')url.searchParams.delete('view');
  history.replaceState(null,'',url.pathname+url.search+url.hash);
 }catch{}
 saveView();
 if(isAll)window.svtAllShown?.();
}
// Select All immediately on reload, rather than waiting for Spotify data
// fetches and first rendering OT13 underneath a saved All tab.
selectDashboardMode(activeDashboardMode);
$('#tabs').addEventListener('click',e=>{
 const button=e.target.closest('button[data-tab]');if(!button)return;
 if(button.dataset.tab==='all'){selectDashboardMode('all');return}
 tab=button.dataset.tab;
 selectDashboardMode('dashboard');
 saveView();render();
});
function syncRank(){rank=rankType+'-'+$('#rankPeriod').value;syncPeriodPicker();saveView();render()}
$('#rankCategory').addEventListener('click',e=>{const button=e.target.closest('button[data-type]');if(!button)return;rankType=button.dataset.type;$('#rankCategory').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));syncRank()});
$('#rankPeriod').addEventListener('change',()=>{
 // Keep the calendar anchored to the period the visitor was browsing.
 // For example, November 2025 monthly -> daily stays in November 2025.
 const oldPeriod=rank.split('-').at(-1);
 const oldKey=selectedPeriodKey;
 const allDates=availableDates();
 if(['weekly','monthly','yearly'].includes(oldPeriod)&&oldKey){
  const matches=allDates.filter(d=>{
   if(oldKey.startsWith('M:'))return d.slice(0,7)===oldKey.slice(2);
   if(oldKey.startsWith('Y:'))return d.slice(0,4)===oldKey.slice(2);
   if(oldKey.startsWith('W:')){
    const start=oldKey.slice(2);
    return d>=start&&d<=shifted(start,6);
   }
   return false;
  });
  if(matches.length)selection=matches[matches.length-1];
 }
 selectedPeriodKey=null;
 syncRank();
});
$('#periodPicker').addEventListener('change',e=>{selectedPeriodKey=e.target.value;saveView();render()});

$('#order').addEventListener('change',e=>{sortOrder=e.target.value;saveView();render()});
$('#search').addEventListener('input',render);function availableDates(){return [...new Set([...(tab==='solo'?soloDates:groupDates),current[tab]?.date].filter(Boolean))].filter(d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&d>='2025-01-01').sort()}
function navigateDate(step){
 const periodic=['weekly','monthly','yearly'].some(p=>rank.endsWith(p));
 if(periodic){
  const picker=$('#periodPicker'),keys=[...picker.options].map(o=>o.value);
  const i=keys.indexOf(selectedPeriodKey),target=keys[i+step];
  if(target){selectedPeriodKey=target;saveView();render()}
  return;
 }
 const available=availableDates(),today=selection==='latest'?(current[tab]?.date||available.at(-1)):selection;
 let i=available.indexOf(today);
 if(i<0)i=available.findIndex(d=>d>today);
 if(i<0)i=available.length;
 const target=available[Math.max(0,Math.min(available.length-1,i+step))];
 if(target){selection=target;saveView();render()}
}
function syncCalendar(){
 const periodic=['weekly','monthly','yearly'].some(p=>rank.endsWith(p));
 const available=availableDates(),date=selection==='latest'?(current[tab]?.date||available.at(-1)):selection;
 const picker=$('#archiveDate');
 if(!picker)return;
 picker.min='2025-01-01';
 picker.max=available.at(-1)||'2025-01-01';
 picker.value=available.includes(date)?date:(available.at(-1)||'');
 if(periodic){
  const selectedDates=available.filter(d=>periodKey(d)===selectedPeriodKey);
  picker.value=selectedDates.at(-1)||available.at(-1)||'';
 const pretty=$('#prettyDate');
 if(pretty&&picker.value){const [year,month,day]=picker.value.split('-').map(Number);pretty.textContent=periodic?(rank.endsWith('yearly')?String(year):rank.endsWith('monthly')?new Date(Date.UTC(year,month-1,1)).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'}):(()=>{const monday=selectedPeriodKey?.startsWith('W:')?selectedPeriodKey.slice(2):shifted(picker.value,-((new Date(picker.value+'T00:00:00Z').getUTCDay()+6)%7));const sunday=shifted(monday,6);const format=d=>new Date(d+'T00:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric'});return format(monday)+' – '+format(sunday)+', '+sunday.slice(0,4)})()):new Date(Date.UTC(year,month-1,day)).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'});}

  const keys=[...$('#periodPicker').options].map(o=>o.value),i=keys.indexOf(selectedPeriodKey);
  $('#prevDate').disabled=i<=0;
  $('#nextDate').disabled=i<0||i===keys.length-1;
  $('#dateNotice').textContent=selectedPeriodKey?'Selected '+rank.split('-').at(-1)+' period':'No saved period';
 }else{
  $('#prevDate').disabled=!date||available.indexOf(date)<=0;
  $('#nextDate').disabled=!date||available.indexOf(date)>=available.length-1;
  $('#dateNotice').textContent=selection==='latest'?'Latest confirmed snapshot':'Saved snapshot · '+(date||'');
 const pretty=$('#prettyDate');
 if(pretty&&picker.value){const [year,month,day]=picker.value.split('-').map(Number);pretty.textContent=periodic?(rank.endsWith('yearly')?String(year):rank.endsWith('monthly')?new Date(Date.UTC(year,month-1,1)).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',year:'numeric'}):(()=>{const monday=selectedPeriodKey?.startsWith('W:')?selectedPeriodKey.slice(2):shifted(picker.value,-((new Date(picker.value+'T00:00:00Z').getUTCDay()+6)%7));const sunday=shifted(monday,6);const format=d=>new Date(d+'T00:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric'});return format(monday)+' – '+format(sunday)+', '+sunday.slice(0,4)})()):new Date(Date.UTC(year,month-1,day)).toLocaleDateString('en-US',{timeZone:'UTC',month:'long',day:'numeric',year:'numeric'});}

 }
}
$('#prevDate').addEventListener('click',()=>navigateDate(-1));
$('#nextDate').addEventListener('click',()=>navigateDate(1));
$('#latestDate').addEventListener('click',()=>{selection='latest';selectedPeriodKey=null;saveView();render()});
$('#prettyDate').addEventListener('click',()=>{
 const picker=$('#archiveDate');
 try{if(typeof picker.showPicker==='function')picker.showPicker();else picker.focus()}catch{picker.focus();picker.click()}
});
$('#archiveDate').addEventListener('change',e=>{
 const requested=e.target.value,available=availableDates();
 if(!requested||!available.length)return;
 const periodic=['weekly','monthly','yearly'].some(p=>rank.endsWith(p));
 if(periodic){
  const keys=[...$('#periodPicker').options].map(o=>o.value);
  const requestedKey=periodKey(requested);
  if(keys.includes(requestedKey))selectedPeriodKey=requestedKey;
  else{
   const closest=available.reduce((best,d)=>Math.abs(Date.parse(d)-Date.parse(requested))<Math.abs(Date.parse(best)-Date.parse(requested))?d:best);
   selectedPeriodKey=periodKey(closest);
  }
 }else{
  const target=available.includes(requested)?requested:available.reduce((best,d)=>Math.abs(Date.parse(d)-Date.parse(requested))<Math.abs(Date.parse(best)-Date.parse(requested))?d:best);
  selection=target;
 }
 saveView();syncCalendar();render();
});
(async()=>{
 try{
  const saved=JSON.parse(sessionStorage.getItem(viewStateKey)||'null');
  if(saved){
   $('#rankPeriod').value=['daily','weekly','monthly','yearly','overall'].includes(saved.period)?saved.period:'daily';
   $('#order').value=sortOrder;
   $('#search').value=saved.search||'';
   $('#tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===(activeDashboardMode==='all'?'all':tab)));
   $('#rankCategory').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.type===rankType));
  }
 }catch{}
 let adminReleases;
 [catalog,artworkMap,soloAlbums,soloMedia,soloLegacyLinks,soloHistoryReference,adminReleases]=await Promise.all([
 load('data/catalog.json'),load('data/artwork-map.json'),
 load('data/solo-albums.json'),load('data/solo-media.json'),
 load('data/solo-legacy-track-links.json'),load('solo-2026-11-06.json'),load('data/admin-releases.json')]);
 catalog=catalog||{};soloAlbums=soloAlbums||[];
 try{verifiedSoloFollowers=(await load('data/solo-followers.json'))?.followers||{}}catch{verifiedSoloFollowers={}}

 // Preview newly published releases immediately, even before the next collector
 // regenerates catalog.json. Existing snapshots are never filled with fake data.
 adminReleases=adminReleases||{releases:[],artists:[]};
 for(const entry of adminReleases.releases||[]){
  const list=catalog[entry.scope]||(catalog[entry.scope]=[]);
  if(!list.some(item=>item.key===entry.key))
   list.push({...entry,admin_added:true});
 }
 for(const release of adminReleases.releases||[]){
  for(const [id,title] of Object.entries(release.track_titles||{})){
   if(!idName[id])idName[id]=title;
  }
 }
 const unitDebutOrder=['BSS','JxW','HxW','CxM','DxS','V8','Picheolin','JxJ'];
 const newUnits=(adminReleases.artists||[]).filter(x=>x.kind==='unit')
  .sort((a,b)=>String(a.debut_date).localeCompare(String(b.debut_date))||String(a.name).localeCompare(String(b.name)));
 addedUnitArtistOrder=newUnits.map(x=>x.name);
 for(const profile of newUnits){
  if(!soloArtists.some(([name])=>name.toLowerCase()===profile.name.toLowerCase()))
   soloArtists.push([profile.name,null]);
 }
 // Keep all solo members first, followed by units in debut order.
 const memberOrder=['S.Coups','Jeonghan','Joshua','Jun','Hoshi','Wonwoo','Woozi','Dokyeom','Mingyu','The8','Seungkwan','Vernon','Dino'];
 soloArtists.sort((a,b)=>{
  const order=name=>{
   const member=memberOrder.indexOf(name);if(member>=0)return member;
   const unit=unitDebutOrder.indexOf(name);if(unit>=0)return 100+unit;
   const added=newUnits.find(x=>x.name===name);
   return 200+(added?newUnits.indexOf(added):999);
  };
  return order(a[0])-order(b[0]);
 });
 soloMedia=soloMedia||{tracks:{},albums:{}};
 soloLegacyLinks=soloLegacyLinks||{byIndex:{}};
 // DREAMSCAPE is credited to Jeonghan × Joshua; reuse their seven existing
 // Spotify IDs instead of inventing a second set of stream counts.
 const jxjTracks=['5ZMx7DaPnVisUBLcrFcnCl','1dp1GI9YcKDoxrKBpp0u9F','4XBeSUSswrGhqYrwm3IS7A','1bGAA82A31CWflD6bqY5g6','2SWWDlOjKqgVvocnIfxId9','69umJ9yk5uay7PQmhBOKk8','2lDG4sMZwAC2TTlXNHMgA1'];
 if(Array.isArray(catalog.solo)&&!catalog.solo.some(item=>item.key==='jxj_dreamscape'))
  catalog.solo.push({key:'jxj_dreamscape',title:'DREAMSCAPE',release_date:'2026-10-19',description:"DREAMSCAPE (7 tracks): Like you, 12 o'clock, Outside, One plus one, Not personal, Coloring, No looking back",artist:'JxJ',tracks:jxjTracks});
 artworkMap=artworkMap||{tracks:{},albums:{}};buildNames();
 // Keep the two distinct Coloring recordings and official sheet spellings
 // attached to their Spotify track IDs, not to the shared song title.
 Object.assign(idName,{
  '69umJ9yk5uay7PQmhBOKk8':'Coloring',
  '1R0kXShLtjjIkZoET8vdb1':'coloring',
  '5fKEfBrvtCM4CNnlSAskuD':'Dexire',
  '5ZMx7DaPnVisUBLcrFcnCl':'Like you',
  '2SWWDlOjKqgVvocnIfxId9':'Not personal',
  '42m5wYT5EOnP1UoDF2pCxh':'mia',
  '7qNXDUu4dkeOm67eF35qiL':'8DM'
 });
 buildCoverLookup();buildFirstReleaseCovers();buildOriginalReleaseLookup();buildSpotifyTrackLinks();[current.group,current.solo]=await Promise.all([load('data/group.json'),load('data/solo.json')]);
 const verifiedArchiveReference=await load('data/history/group-2026-11-06.json').catch(()=>null);
 buildArchiveCanonicalIds(verifiedArchiveReference||current.group);
 const manifest=await load('data/manifest.json')||{dates:[],solo_dates:[]};
 groupDates=[...new Set([...(manifest.dates||[]),current.group?.date].filter(Boolean))].sort().reverse();
 soloHistoricalDates=new Set(manifest.solo_legacy_dates||manifest.solo_dates||[]);
 soloDates=[...new Set([...(manifest.solo_dates||[]),current.solo?.date].filter(Boolean))].sort().reverse();
 useDatesForTab();syncCalendar();await render();
 // Make the originals' exact album-cover and profile lookups available to All.
 window.dispatchEvent(new Event('svt-media-ready'));
 selectDashboardMode(activeDashboardMode);
 requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,savedScroll)));
 // Refresh only while the page is visible, and never interrupt a historical view.
 // Daily snapshots update far less often than every five minutes.
 setInterval(()=>{if(document.visibilityState==='visible'&&selection==='latest'){saveView();window.location.reload()}},1800000);
})();
