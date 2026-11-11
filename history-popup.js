/* Streaming history inspector. Read-only; never estimates missing dates or streams. */
(() => {
 'use strict';
 const $=sel=>document.querySelector(sel);
 const pad=n=>String(n).padStart(2,'0');
 const fmt=n=>Number(n).toLocaleString('en-US');
 const dateText=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
 const previousDate=d=>{const day=new Date(d+'T12:00:00Z');day.setUTCDate(day.getUTCDate()-1);return day.toISOString().slice(0,10)};
 const css=`
 .svt-history-open{cursor:pointer!important;pointer-events:auto!important}
 .svt-history-open:focus-visible{outline:2px solid #d4a8ed;outline-offset:3px}
 .svt-history-open:hover .metric-value,.svt-history-open:hover strong{text-decoration:underline;text-decoration-style:dotted;text-underline-offset:4px}
 .svt-history-dialog[hidden]{display:none!important;visibility:hidden!important;pointer-events:none!important}
 .svt-history-dialog{position:fixed;inset:0;z-index:99990;background:rgba(4,5,16,.82);display:flex;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(7px)}
 .svt-history-window{width:min(740px,100%);max-height:min(790px,92dvh);overflow:auto;border:1px solid #8d71b8;border-radius:19px;background:#181a35;color:#f8f3ff;padding:20px;box-shadow:0 20px 70px #040313}
 .svt-history-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
 .svt-history-close{border:1px solid #8777a8;background:#363054;color:#fff;border-radius:10px;padding:8px 13px;font:700 18px system-ui;cursor:pointer}
 .svt-history-window h2{margin:4px 0 8px;font:800 clamp(18px,3vw,25px) system-ui}
 .svt-history-note{font:12px/1.5 system-ui;color:#c4b9de;margin:5px 0 14px}
 .svt-history-profile{margin:13px 0 0;font:12px/1.5 system-ui;color:#e9e1f4;overflow-wrap:anywhere}
 .svt-history-profile a{color:#A0C9E8;text-decoration:underline;text-underline-offset:3px}
 .svt-history-profile a:focus-visible{outline:2px solid #F3B6D1;outline-offset:3px;border-radius:2px}
 .svt-history-wrap{overflow-x:auto;border:1px solid #4c476c;border-radius:12px}
 .svt-history-table{width:100%;border-collapse:collapse;min-width:540px;font:12px/1.4 system-ui;text-align:right}
 .svt-history-table th,.svt-history-table td{padding:12px 10px;border-bottom:1px solid #373755;white-space:nowrap;font-variant-numeric:tabular-nums}
 .svt-history-table th{color:#d1b6ed;background:#22223e;text-transform:uppercase;letter-spacing:.035em;font-size:10px}
 .svt-history-table td:first-child,.svt-history-table th:first-child{text-align:left}
 .svt-history-table tr:last-child td{border-bottom:0}
 .svt-history-table tbody tr td{font-weight:400}
 .svt-history-table .unavailable{color:#a9a6c1}
 .svt-history-table .negative{color:#F3B6D1;font-weight:700}
 .svt-history-table .positive{color:#A0C9E8;font-weight:700}
 @media(max-width:600px){
  .svt-history-dialog{padding:4px;box-sizing:border-box}
  .svt-history-window{box-sizing:border-box;width:100%;max-width:100%;min-width:0;padding:12px 5px;border-radius:12px}
  .svt-history-wrap{box-sizing:border-box;width:100%;max-width:100%;overflow-x:hidden}
  .svt-history-table{width:100%;min-width:0;max-width:100%;table-layout:fixed;font:clamp(8px,2.55vw,11px)/1.32 system-ui;text-align:right}
  .svt-history-table th,.svt-history-table td{box-sizing:border-box;padding:9px 2px;letter-spacing:-.25px;border-bottom:1px solid #373755;overflow:hidden;text-overflow:clip;word-break:normal}
  .svt-history-table th{font-size:clamp(7px,2.3vw,10px);line-height:1.2}
  .svt-history-table th:nth-child(1){width:25%}
  .svt-history-table th:nth-child(2){width:31%}
  .svt-history-table th:nth-child(3){width:22%}
  .svt-history-table th:nth-child(4){width:22%}
  .svt-history-table th:last-child{font-size:0}
  .svt-history-table th:last-child::after{content:'Change';font-size:clamp(7px,2.3vw,10px)}
  .svt-history-table th:first-child,.svt-history-table td:first-child{text-align:left;white-space:normal;overflow-wrap:break-word}
  .svt-history-table td:not(:first-child){white-space:nowrap;font-variant-numeric:tabular-nums}
 }
 @media(max-width:350px){
  .svt-history-dialog{padding:2px}
  .svt-history-window{padding:10px 3px}
  .svt-history-table{font-size:8px}
  .svt-history-table th,.svt-history-table td{padding:9px 1px;letter-spacing:-.35px}
 }
 `;
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 const modal=document.createElement('div');modal.className='svt-history-dialog';modal.hidden=true;modal.setAttribute('role','presentation');
 modal.innerHTML='<section class="svt-history-window" role="dialog" aria-modal="true" aria-labelledby="svtHistoryTitle"><div class="svt-history-top"><div><div style="font:750 10px system-ui;letter-spacing:.15em;color:#d6b1f5">✦ VERIFIED STREAM HISTORY</div><h2 id="svtHistoryTitle">History</h2></div><button type="button" class="svt-history-close" aria-label="Close history">×</button></div><p class="svt-history-note" id="svtHistoryNote"></p><div class="svt-history-wrap"><table class="svt-history-table"><thead><tr><th>Date</th><th>Total</th><th>Increase</th><th>Change in increase</th></tr></thead><tbody id="svtHistoryRows"></tbody></table></div><p class="svt-history-note">A dash means comparable saved data is unavailable. Daily increases need consecutive dates. No missing dates are estimated.</p><p class="svt-history-profile" id="svtHistoryProfile" hidden>Profile Link: <a id="svtHistoryProfileLink" target="_blank" rel="noopener noreferrer"></a></p></section>';
 document.body.append(modal);
 // Keep keyboard focus inside the modal and return it to the opener.
 let historyOpener=null;
 const close=()=>{
  if(modal.hidden)return;
  modal.hidden=true;
  document.body.style.removeProperty('overflow');
  if(historyOpener?.isConnected&&typeof historyOpener.focus==='function')
   historyOpener.focus();
  historyOpener=null;
 };
 modal.querySelector('.svt-history-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{
  if(modal.hidden)return;
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key!=='Tab')return;
  const focusable=[...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
   .filter(el=>el.getClientRects().length);
  if(!focusable.length){e.preventDefault();return}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){
   e.preventDefault();last.focus();
  }else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){
   e.preventDefault();first.focus();
  }
 });
 const numberOrNull=n=>n!=null&&Number.isFinite(Number(n))?Number(n):null;
 const scopeIsSolo=()=>tab==='solo';
 const exactIds=(snapshot,ids,reference)=>{
  const vals=[];
  for(const id of ids){
   let value=numberOrNull(snapshot.tracks?.[id]);
   if(value==null&&!scopeIsSolo()&&typeof historicalGroupTrackId==='function'){
    const mappedId=historicalGroupTrackId(snapshot,id);
    value=numberOrNull(snapshot.tracks?.[mappedId]);
   }
   if(value==null&&reference&&snapshot.date<reference.date&&
      typeof comparablePrevious==='function'){
    const mapped=(scopeIsSolo()&&isHistorical(snapshot)&&typeof verifiedSoloLegacyValue==='function'
      ?verifiedSoloLegacyValue(snapshot,id):null)||comparablePrevious(reference,snapshot,id);
    if(mapped)value=numberOrNull(mapped.value);
   }
   if(value==null)return null;
   vals.push(value);
  }
  return vals.reduce((a,b)=>a+b,0);
 };
 // Historical Excel row IDs change whenever a song is inserted. Find
 // the same member/recording by title + occurrence, not by stale row index.
 const matchedLegacyValue=(snapshot,reference,legacyId,owner,kind)=>{
  if(!isHistorical(snapshot)||!isHistorical(reference))return null;
  const sourceSections=soloLegacySections(reference)||{};
  const destSections=soloLegacySections(snapshot)||{};
  const sourceOwner=owner&&sourceSections[owner]?.some(row=>row.id===legacyId)
    ?owner:Object.keys(sourceSections).find(k=>sourceSections[k]?.some(row=>row.id===legacyId));
  if(!sourceOwner)return null;
  const source=(sourceSections[sourceOwner]||[]).find(row=>row.id===legacyId);
  const key=soloHistoricalNameKey(source?.name);
  if(!key)return null;
  const sourceMatches=(sourceSections[sourceOwner]||[]).filter(row=>
   historicalKind(reference,row.id)===kind&&soloHistoricalNameKey(row.name)===key);
  const destMatches=(destSections[sourceOwner]||[]).filter(row=>
   historicalKind(snapshot,row.id)===kind&&soloHistoricalNameKey(row.name)===key);
  if(!destMatches.length||destMatches.length!==sourceMatches.length)return null;
  const occurrence=sourceMatches.findIndex(row=>row.id===legacyId);
  return numberOrNull(destMatches[occurrence]?.value);
 };
 function metricValue(snapshot,metric,reference,scope,owner){
  if(!snapshot)return null;
  if(metric.kind==='audience'){
   return scope==='solo'&&owner?numberOrNull(soloArtistAudienceValue(snapshot,owner,metric.value)):
    numberOrNull(audienceValue(snapshot,metric.value));
  }
  if(metric.kind==='track'){
   if(scope==='solo'&&isHistorical(snapshot)){
    if(isHistorical(reference)&&String(metric.id).startsWith('legacy:'))
     return matchedLegacyValue(snapshot,reference,metric.id,owner,'track');
    if(typeof verifiedSoloLegacyValue==='function'){
     const resolved=verifiedSoloLegacyValue(snapshot,metric.id);
     return resolved?numberOrNull(resolved.value):null;
    }
    return null;
   }
   // Never use a numeric legacy ID in a live Spotify snapshot.
   if(String(metric.id).startsWith('legacy:')&&!isHistorical(snapshot))return null;
   let value=numberOrNull(snapshot.tracks?.[metric.id]);
   if(value==null&&scope==='group'&&typeof historicalGroupTrackId==='function')
    value=numberOrNull(snapshot.tracks?.[historicalGroupTrackId(snapshot,metric.id)]);
   if(value==null&&scope==='group'&&isHistorical(snapshot)&&isHistorical(reference)&&
      typeof comparablePrevious==='function'){
    const previous=comparablePrevious(reference,snapshot,metric.id);
    value=previous?numberOrNull(previous.value):null;
   }
   if(value==null&&reference&&snapshot.date<reference.date&&
      !isHistorical(reference)){
    const found=comparablePrevious(reference,snapshot,metric.id);
    value=found?numberOrNull(found.value):null;
   }
   return value;
  }
  if(metric.kind==='album'){
   // Multi-part group releases (notably the 33-track 17 IS RIGHT HERE)
   // must use the same full album as the dashboard, NOT g49's 4-track
   // original subtotal. Historical workbooks already save the full subtotal.
   if(scope==='group'&&metric.releases?.length){
    const keys=metric.releases,primary=typeof canonicalGroupAlbumKey==='function'
      ?canonicalGroupAlbumKey(keys):keys[0];
    if(isHistorical(snapshot)&&typeof historicalAlbumAggregate==='function'){
     const archived=historicalAlbumAggregate(snapshot,primary,'full');
     if(archived&&numberOrNull(snapshot.tracks[archived])!=null)
      return numberOrNull(snapshot.tracks[archived]);
    }
    const ids=[...new Set(keys.flatMap(key=>
     (catalog.group||[]).find(item=>item.key===key)?.tracks||[]))];
    return ids.length?exactIds(snapshot,ids,reference):null;
   }
   // Multi-release solo/unit totals must use ALL of their recording IDs,
   // not only the artwork release. Historical spreadsheets use different row
   // identifiers, so resolve each recording by its verified workbook mapping.
   if(scope==='solo'&&metric.releases?.length){
    const ids=uniqueSoloSpotifyIds([...new Set(metric.releases.flatMap(key=>
     (catalog.solo||[]).find(item=>item.key===key)?.tracks||[]))],snapshot);
    if(!ids.length)return null;
    if(isHistorical(snapshot)){
     if(typeof verifiedSoloLegacyValue!=='function')return null;
     const values=ids.map(id=>verifiedSoloLegacyValue(snapshot,id)?.value);
     return values.every(value=>numberOrNull(value)!=null)
      ?values.reduce((sum,value)=>sum+Number(value),0):null;
    }
    return exactIds(snapshot,ids,reference);
   }
   // A legacy subtotal ID must be rematched by member/title each month;
   // the same row number can mean a different album in an older workbook.
   if(scope==='solo'&&String(metric.id).startsWith('legacy:')&&
      isHistorical(snapshot)&&isHistorical(reference))
    return matchedLegacyValue(snapshot,reference,metric.id,owner,'album');
   if(metric.id&&snapshot.tracks?.[metric.id]!=null)
    return numberOrNull(snapshot.tracks[metric.id]);
   const item=(catalog[scope]||[]).find(x=>x.key===metric.release);
   if(!item)return null;
   const releaseIds=[...new Set(item.tracks||[])].filter(id=>scope!=='solo'||!owner||
     ownedSoloIds(owner).has(id));
   const ids=scope==='solo'?uniqueSoloSpotifyIds(releaseIds,snapshot):releaseIds;
   return ids.length?exactIds(snapshot,ids,reference):null;
  }
  if(scope==='group'){
   if(isHistorical(snapshot)){
    const grand=Object.keys(snapshot.tracks||{}).find(id=>historicalKind(snapshot,id)==='grand');
    return grand?numberOrNull(snapshot.tracks[grand]):null;
   }
   const ids=Array.isArray(snapshot.canonical_track_ids)?snapshot.canonical_track_ids:
    [...new Set((catalog.group||[]).flatMap(item=>item.tracks||[]))];
   return ids.length?exactIds(snapshot,[...new Set(ids)],reference):null;
  }
  if(owner){
   if(isHistorical(snapshot)){
    const block=soloLegacySections(snapshot)?.[owner]||[];
    const grand=block.find(item=>historicalKind(snapshot,item.id)==='grand');
    if(grand)return numberOrNull(snapshot.tracks[grand.id]);
    // JxJ and V8 have no workbook artist-grand row. Add their own unique tracks.
    const ids=soloLegacyTrackIds(snapshot,owner);
    return ids.length?exactIds(snapshot,ids,reference):null;
   }
   const ids=uniqueSoloSpotifyIds([...ownedSoloIds(owner)],snapshot);
   return ids.length?exactIds(snapshot,ids,reference):null;
  }
  if(isHistorical(snapshot)){
   // Historical workbooks save artist grand totals, not a combined solo/unit grand.
   // Sum the distinct dated track recordings; never add album totals twice.
   const ids=soloLegacyTrackIds(snapshot,null);
   return ids.length?exactIds(snapshot,ids,reference):null;
  }
  const ids=uniqueSoloSpotifyIds([...new Set((catalog.solo||[]).flatMap(item=>item.tracks||[]))],snapshot);
  return ids.length?exactIds(snapshot,ids,reference):null;
 }
 // Use official Korean member names in the history description while
 // retaining recognizable English names in dialog titles. Units without a
 // separate Spotify artist account intentionally have no profile link.
 const koreanNames={
  'S.Coups':'에스쿱스',Jeonghan:'정한',Joshua:'조슈아',Jun:'준',Hoshi:'호시',
  Wonwoo:'원우',Woozi:'우지',Dokyeom:'도겸',Mingyu:'민규',The8:'디에잇',
  Seungkwan:'승관',Vernon:'버논',Dino:'디노',BSS:'부석순',
  JxW:'정한 X 원우',HxW:'호시 X 우지',CxM:'에스쿱스 X 민규',
  DxS:'도겸 X 승관',V8:'버논 X 디에잇',JxJ:'정한 X 조슈아',
  Picheolin:'피철인'
 };
 const profileFor=(scope,owner)=>{
  const artistId=scope==='group'?'7nqOGRxlXj7N2JYbgNEjYH':
   scope==='solo'&&owner?soloArtists.find(([name])=>name===owner)?.[1]:null;
  return typeof artistId==='string'&&/^[a-zA-Z0-9]{22}$/.test(artistId)
   ?'https://open.spotify.com/artist/'+artistId:null;
 };
 const ownerTitle=(scope,owner)=>scope==='group'?'SEVENTEEN':owner||null;
 const possessive=name=>name+(name.endsWith('s')?"'":"'s");
 let opening=0;
 async function show(metric){
  const id=++opening;
  const scope=tab,owner=selectedSoloArtist;
  modal.hidden=false;document.body.style.overflow='hidden';
  const tbody=$('#svtHistoryRows');tbody.innerHTML='<tr><td colspan="4">Loading saved snapshots…</td></tr>';
  const artist=ownerTitle(scope,owner);
  const measure=metric.value==='listeners'?'Monthly Listeners':
   metric.value==='followers'?'Followers':metric.kind==='total'?'Total Streams':null;
  $('#svtHistoryTitle').textContent=artist&&measure
   ?possessive(artist)+' '+measure+' on Spotify'
   :measure||metric.title||'Track streams';
  $('#svtHistoryNote').textContent='Loading saved streaming history…';
  const profile=profileFor(scope,owner);
  const profileArea=$('#svtHistoryProfile'),profileLink=$('#svtHistoryProfileLink');
  profileArea.hidden=!profile;
  if(profile){profileLink.href=profile;profileLink.textContent=profile}
  else{profileLink.removeAttribute('href');profileLink.textContent=''};
  let ref;
  try{ref=await selectedSnapshot()||await latest(scope)}
  catch(error){tbody.innerHTML='<tr><td colspan="4">Unable to load selected archive. Try selecting a date and reopening.</td></tr>';return}
  if(id!==opening)return;
  if(!ref?.date){tbody.innerHTML='<tr><td colspan="4">No saved streaming snapshot is available for this view.</td></tr>';return}
  // Dedicated follower readings are collected independently of stream
  // snapshots. Do not pretend a November 9 reading existed on November 7.
  let followerData=null,profileId=null;
  if(scope==='solo'&&metric.value==='followers'){
   try{followerData=await load('data/solo-followers.json')}catch{}
   profileId=soloArtists.find(([name])=>name===owner)?.[1]||null;
   if(selection==='latest'){
    const savedDays=Object.keys(followerData?.history||{}).filter(d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)).sort();
    const lastDay=savedDays.at(-1);
    if(lastDay&&lastDay>ref.date)ref={...ref,date:lastDay};
   }
  }
  const mode=rank.endsWith('monthly')?'monthly':rank.endsWith('weekly')?'weekly':'daily';
  // Both audience and streaming counters can show verified downward revisions.
  const canDecrease=true;
  const periodCount=mode==='monthly'?12:10;
  const titleLabel=mode==='monthly'?'month':mode==='weekly'?'week':'day';
  const historyMeasureNote=metric.value==='listeners'
   ?'Monthly listeners are a rolling audience measure and may rise or fall.'
   :metric.value==='followers'
   ?'Follower totals are observed counts; daily changes require two dated readings.'
   :'Stream totals are cumulative; increases require comparable recordings.';
  $('#svtHistoryNote').textContent='Last '+periodCount+' '+titleLabel+'s through '+dateText(ref.date)+' · '+(scope==='group'?'세븐틴':koreanNames[owner]||owner||'Units & Solo')+'. '+historyMeasureNote;
  if(followerData&&profileId)
   $('#svtHistoryNote').textContent+=' · Followers are dated when collected; no November 7 count is fabricated.';
  const lookup=async date=>{
   try{return date===ref.date?ref:await getDate(scope,date)}
   catch{return null}
  };
  const valueOf=async date=>{
   if(followerData&&profileId){
    const saved=followerData.history?.[date]?.[profileId];
    return saved?numberOrNull(saved.count):null;
   }
   const snap=await lookup(date);
   if(!snap)return null;
   try{return metricValue(snap,metric,ref,scope,owner)}catch(error){console.warn('History value unavailable',error);return null}
  };
  const renderRow=(label,total,increase,change,partial=false,changePartial=false)=>{
   const tr=document.createElement('tr');
   const showNumber=(n,signed=false)=>n==null?'—':(signed?(n>=0?'+':'−'):'')+fmt(Math.abs(n));
   const cells=[label,showNumber(total),showNumber(increase,true)+(partial&&increase!=null?'*':''),showNumber(change,true)+(changePartial&&change!=null?'*':'')];
   for(let k=0;k<cells.length;k++){
    const td=document.createElement('td');td.textContent=cells[k];
    if(k>1&&((k===2?increase:change)!=null))td.className=(k===2?increase:change)>=0?'positive':'negative';
    if(cells[k]==='—')td.className='unavailable';
    tr.append(td);
   }
   tbody.append(tr);
  };
  tbody.replaceChildren();
  if(mode==='daily'){
   const days=[];let day=ref.date;
   for(let i=0;i<12;i++){days.push(day);day=previousDate(day)}
   const values=await Promise.all(days.map(async date=>({date,value:await valueOf(date)})));
   if(id!==opening)return;
   for(let i=9;i>=0;i--){
    const day=values[i],prev=values[i+1],before=values[i+2];
    const gain=day.value!=null&&prev.value!=null&&(canDecrease||day.value>=prev.value)?day.value-prev.value:null;
    const old=prev.value!=null&&before.value!=null&&(canDecrease||prev.value>=before.value)?prev.value-before.value:null;
    renderRow(dateText(day.date),day.value,gain,gain!=null&&old!=null?gain-old:null);
   }
  }else{
   // Use fixed calendar weeks/months (including periods with no saved day),
   // not ten arbitrary snapshots. A full period increase requires the
   // previous boundary observation and the final day of that period.
   const move=(date,n)=>{
    const d=new Date(date+'T12:00:00Z');
    if(mode==='weekly')d.setUTCDate(d.getUTCDate()+7*n);
    else {d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+n)}
    return d.toISOString().slice(0,10);
   };
   const periodStart=date=>mode==='monthly'?date.slice(0,7)+'-01':(()=>{
    const d=new Date(date+'T12:00:00Z');
    d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
    return d.toISOString().slice(0,10);
   })();
   const endOf=start=>{const next=move(start,1);return previousDate(next)};
   // Followers have their own dated collection archive. Stream snapshot
   // dates must not be mistaken for follower observations.
   const sourceDates=followerData&&profileId
    ?Object.keys(followerData.history||{}).filter(d=>followerData.history[d]?.[profileId]?.count!=null)
    :((scope==='solo'?soloDates:groupDates)||[]);
   const dateList=[...new Set([...sourceDates,ref.date])].filter(d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&d<=ref.date).sort();
   const start=periodStart(ref.date);
   const periods=Array.from({length:periodCount+1},(_,i)=>move(start,i-periodCount));
   // Compute full calendar periods from exact boundary snapshots.
   // For incomplete weeks/months, compare the same number of elapsed
   // calendar days in the previous period, never a full month against a
   // seven-day month-to-date total.
   const previousEnd=first=>previousDate(first);
   const elapsedDays=(start,end)=>Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
   const cache=new Map(),knownDates=new Set(dateList);
   const cachedValue=async date=>{
    // Avoid issuing hundreds of guaranteed 404 requests for dates absent
    // from early solo/unit archives (especially the 12-month inspector).
    if(!knownDates.has(date))return null;
    if(!cache.has(date))cache.set(date,valueOf(date));
    return cache.get(date);
   };
   const currentPeriod=async first=>{
    const last=endOf(first),visibleEnd=last<ref.date?last:ref.date;
    const boundary=previousDate(first);
    // The end-of-period snapshot may be missing while earlier dated totals
    // exist. Show the most recent actual observation, but NEVER call it a
    // completed-period gain or silently use it as the exact period end.
    const candidates=dateList.filter(d=>d>=first&&d<=visibleEnd);
    let lastObserved=null,total=null;
    for(let i=candidates.length-1;i>=0;i--){
     const value=await cachedValue(candidates[i]);
     if(value!=null){lastObserved=candidates[i];total=value;break}
    }
    const before=await cachedValue(boundary);
    const complete=lastObserved===visibleEnd&&total!=null&&before!=null&&
      (canDecrease||total>=before);
    if(complete)return {total,gain:total-before,partial:false,days:elapsedDays(first,visibleEnd)};
    // Missing boundaries: add only real consecutive daily differences.
    // Flag the incomplete result with *, never classify it as a whole period.
    const days=elapsedDays(first,visibleEnd);
    let subtotal=0,observed=0;
    for(let d=first;d<=visibleEnd;d=nextDay(d)){
     const previous=previousDate(d);
     const [nowValue,prevValue]=await Promise.all([cachedValue(d),cachedValue(previous)]);
     if(nowValue!=null&&prevValue!=null&&(canDecrease||nowValue>=prevValue)){
      subtotal+=nowValue-prevValue;observed++;
     }
    }
    return {total,gain:observed?subtotal:null,partial:true,days,observed};
   };
   const nextDay=date=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)};
   const nextDayOffset=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
   const currentPeriodPartial=async(first,visibleEnd)=>{
    let gain=0,observed=0;
    for(let d=first;d<=visibleEnd;d=nextDay(d)){
     const [a,b]=await Promise.all([cachedValue(d),cachedValue(previousDate(d))]);
     if(a!=null&&b!=null&&(canDecrease||a>=b)){gain+=a-b;observed++}
    }
    return {gain:observed?gain:null,partial:true};
   };
   const periodData=await Promise.all(periods.map(async first=>{
    const end=endOf(first),visibleEnd=end<ref.date?end:ref.date;
    const details=await currentPeriod(first);
    const label=mode==='monthly'
      ?new Date(first+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'})
      :dateText(first)+' – '+dateText(end);
    return {first,label,...details,visibleEnd};
   }));
   if(id!==opening)return;
   // Keep all 12 calendar-month rows visible. Unknown or unreliable
   // observations are shown as unavailable rather than silently omitted.
   for(let i=1;i<periodData.length;i++){
    const row=periodData[i],prior=periodData[i-1];
    let comparison=prior.gain,comparisonPartial=prior.partial;
    // A partial current calendar week/month must compare like-for-like days.
    if(row.visibleEnd<endOf(row.first)){
      const previousStart=prior.first;
      const sameDayEnd=nextDayOffset(previousStart,row.days-1);
      const priorRangeEnd=sameDayEnd<endOf(previousStart)?sameDayEnd:endOf(previousStart);
      // Reuse exact previous boundary and same elapsed-day end if present.
      const [begin,endValue]=await Promise.all([
       cachedValue(previousDate(previousStart)),cachedValue(priorRangeEnd)
      ]);
      if(begin!=null&&endValue!=null&&(canDecrease||endValue>=begin)){
       comparison=endValue-begin;comparisonPartial=false;
      }else{
       const aligned=await currentPeriodPartial(previousStart,priorRangeEnd);
       comparison=aligned.gain;comparisonPartial=aligned.partial;
      }
    }
    const change=row.gain!=null&&comparison!=null?row.gain-comparison:null;
    renderRow(row.label,row.total,row.gain,change,
     row.partial||row.visibleEnd<endOf(row.first),
     row.partial||comparisonPartial||row.visibleEnd<endOf(row.first));
   }
   if(mode==='monthly'){
    if(!tbody.children.length){
     const tr=document.createElement('tr'),td=document.createElement('td');
     td.colSpan=4;
     td.textContent='No verified monthly observations available in this 12-month window.';
     tr.append(td);tbody.append(tr);
    }
   }
   $('#svtHistoryNote').textContent+=' · * Partial observed dates or an in-progress period; changes compare matching elapsed calendar days.';

  }
  historyOpener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  modal.querySelector('.svt-history-close').focus();
 }
 for(const [id,title] of [['total','Track streams · Total'],['gain','Total stream growth'],['listeners','Monthly listeners'],['followers','Followers']]){
  const el=document.getElementById(id);
  if(!el)continue;
  const card=el.closest('.stat');if(!card)continue;
  card.classList.add('svt-history-open');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Show last ten days of '+title);
  const metric=id==='listeners'||id==='followers'?{kind:'audience',value:id,title}:{kind:'total',title};
  card.addEventListener('click',()=>show(metric).catch(console.error));
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(metric).catch(console.error)}});
 }
 const ranking=document.getElementById('ranking');
 ranking?.addEventListener('click',event=>{
  const metric=event.target.closest('.rank-metric');
  if(!metric||!ranking.contains(metric))return;
  const row=metric.closest('.rank-row');
  if(!row)return;
  const title=row.querySelector('.track-name')?.textContent?.trim()||'Release';
  const release=row.dataset.historyRelease||'';
  const releases=(row.dataset.historyReleases||'').split(',').filter(Boolean);
  const id=row.dataset.historyId||'';
  show({kind:row.classList.contains('album-total-row')?'album':'track',release,releases,id,title}).catch(console.error);
 });
 ranking?.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const metric=event.target.closest('.rank-metric');
  if(!metric)return;
  event.preventDefault();metric.click();
 });
 const observer=new MutationObserver(()=>{
  ranking?.querySelectorAll('.rank-metric:not(.svt-history-open)').forEach(el=>{
   el.classList.add('svt-history-open');el.tabIndex=0;el.setAttribute('role','button');
   el.setAttribute('aria-label','View ten-day history for this stream metric');
  });
 });
 if(ranking)observer.observe(ranking,{childList:true,subtree:true});
})();
