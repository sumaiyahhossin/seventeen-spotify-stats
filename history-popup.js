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
 .svt-history-wrap{overflow-x:auto;border:1px solid #4c476c;border-radius:12px}
 .svt-history-table{width:100%;border-collapse:collapse;min-width:540px;font:12px/1.4 system-ui;text-align:right}
 .svt-history-table th,.svt-history-table td{padding:12px 10px;border-bottom:1px solid #373755;white-space:nowrap;font-variant-numeric:tabular-nums}
 .svt-history-table th{color:#d1b6ed;background:#22223e;text-transform:uppercase;letter-spacing:.035em;font-size:10px}
 .svt-history-table td:first-child,.svt-history-table th:first-child{text-align:left}
 .svt-history-table tr:last-child td{border-bottom:0}
 .svt-history-table tr:first-child td{font-weight:800}
 .svt-history-table .unavailable{color:#a9a6c1}
 .svt-history-table .negative{color:#f4a5bd}
 .svt-history-table .positive{color:#b7edcf}
 @media(max-width:600px){.svt-history-window{padding:14px}.svt-history-table th,.svt-history-table td{padding:10px 8px}}
 `;
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 const modal=document.createElement('div');modal.className='svt-history-dialog';modal.hidden=true;modal.setAttribute('role','presentation');
 modal.innerHTML='<section class="svt-history-window" role="dialog" aria-modal="true" aria-labelledby="svtHistoryTitle"><div class="svt-history-top"><div><div style="font:750 10px system-ui;letter-spacing:.15em;color:#d6b1f5">✦ VERIFIED STREAM HISTORY</div><h2 id="svtHistoryTitle">History</h2></div><button type="button" class="svt-history-close" aria-label="Close history">×</button></div><p class="svt-history-note" id="svtHistoryNote"></p><div class="svt-history-wrap"><table class="svt-history-table"><thead><tr><th>Date</th><th>Total</th><th>Increase</th><th>Change in increase</th></tr></thead><tbody id="svtHistoryRows"></tbody></table></div><p class="svt-history-note">A dash means the saved data is unavailable. Increases require two consecutive dates; changes require three. No missing days are filled with estimates.</p></section>';
 document.body.append(modal);
 const close=()=>{modal.hidden=true;document.body.style.removeProperty('overflow')};
 modal.querySelector('.svt-history-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 document.addEventListener('keydown',e=>{if(!modal.hidden&&e.key==='Escape')close()});
 const numberOrNull=n=>n!=null&&Number.isFinite(Number(n))?Number(n):null;
 const scopeIsSolo=()=>tab==='solo';
 const exactIds=(snapshot,ids,reference)=>{
  const vals=[];
  for(const id of ids){
   let value=numberOrNull(snapshot.tracks?.[id]);
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
 function metricValue(snapshot,metric,reference,scope,owner){
  if(!snapshot)return null;
  if(metric.kind==='audience'){
   return scope==='solo'&&owner?numberOrNull(soloArtistAudienceValue(snapshot,owner,metric.value)):
    numberOrNull(audienceValue(snapshot,metric.value));
  }
  if(metric.kind==='track'){
   let value=numberOrNull(snapshot.tracks?.[metric.id]);
   if(value==null&&reference&&snapshot.date<reference.date){
    const found=(scope==='solo'&&isHistorical(snapshot)&&typeof verifiedSoloLegacyValue==='function'
      ?verifiedSoloLegacyValue(snapshot,metric.id):null)||comparablePrevious(reference,snapshot,metric.id);
    value=found?numberOrNull(found.value):null;
   }
   return value;
  }
  if(metric.kind==='album'){
   // A legacy workbook subtotal has its own ID. Otherwise calculate from
   // all unique recordings in the catalog; never count a track twice.
   if(metric.id&&snapshot.tracks?.[metric.id]!=null)
    return numberOrNull(snapshot.tracks[metric.id]);
   const item=(catalog[scope]||[]).find(x=>x.key===metric.release);
   if(!item)return null;
   const ids=[...new Set(item.tracks||[])].filter(id=>scope!=='solo'||!owner||
     ownedSoloIds(owner).has(id));
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
    return grand?numberOrNull(snapshot.tracks[grand.id]):null;
   }
   const ids=[...ownedSoloIds(owner)];
   return ids.length?exactIds(snapshot,ids,reference):null;
  }
  if(isHistorical(snapshot)){
   const grand=Object.keys(snapshot.tracks||{}).find(id=>historicalKind(snapshot,id)==='grand'&&/solo|unit/i.test(snapshot.names?.[id]||''));
   return grand?numberOrNull(snapshot.tracks[grand]):null;
  }
  const ids=[...new Set((catalog.solo||[]).flatMap(item=>item.tracks||[]))];
  return ids.length?exactIds(snapshot,ids,reference):null;
 }
 let opening=0;
 async function show(metric){
  const id=++opening;
  const scope=tab,owner=selectedSoloArtist;
  modal.hidden=false;document.body.style.overflow='hidden';
  const tbody=$('#svtHistoryRows');tbody.innerHTML='<tr><td colspan="4">Loading saved snapshots…</td></tr>';
  $('#svtHistoryTitle').textContent=metric.title||'Track streams';
  $('#svtHistoryNote').textContent='Loading the last ten dated snapshots…';
  let ref;
  try{ref=await selectedSnapshot()||await latest(scope)}
  catch(error){tbody.innerHTML='<tr><td colspan="4">Unable to load selected archive. Try selecting a date and reopening.</td></tr>';return}
  if(id!==opening)return;
  if(!ref?.date){tbody.innerHTML='<tr><td colspan="4">No saved streaming snapshot is available for this view.</td></tr>';return}
  const mode=rank.endsWith('monthly')?'monthly':rank.endsWith('weekly')?'weekly':'daily';
  const titleLabel=mode==='monthly'?'month':mode==='weekly'?'week':'day';
  $('#svtHistoryNote').textContent='Last 10 '+titleLabel+'s through '+dateText(ref.date)+' · '+(scope==='group'?'OT13':owner||'Units & Solo')+' · oldest first. Total is cumulative; increase requires verified comparable snapshots.';
  const lookup=async date=>{
   try{return date===ref.date?ref:await getDate(scope,date)}
   catch{return null}
  };
  const valueOf=async date=>{
   const snap=await lookup(date);
   if(!snap)return null;
   try{return metricValue(snap,metric,ref,scope,owner)}catch(error){console.warn('History value unavailable',error);return null}
  };
  const renderRow=(label,total,increase,change,partial=false)=>{
   const tr=document.createElement('tr');
   const showNumber=(n,signed=false)=>n==null?'—':(signed?(n>=0?'+':'−'):'')+fmt(Math.abs(n));
   const cells=[label,showNumber(total),showNumber(increase,true)+(partial&&increase!=null?'*':''),showNumber(change,true)];
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
    const gain=day.value!=null&&prev.value!=null&&day.value>=prev.value?day.value-prev.value:null;
    const old=prev.value!=null&&before.value!=null&&prev.value>=before.value?prev.value-before.value:null;
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
   const dateList=[...new Set([...((scope==='solo'?soloDates:groupDates)||[]),ref.date])].filter(d=>/^20\\d{2}-\\d{2}-\\d{2}$/.test(d)&&d<=ref.date).sort();
   const start=periodStart(ref.date);
   const periods=Array.from({length:11},(_,i)=>move(start,i-10));
   const periodData=await Promise.all(periods.map(async first=>{
    const last=endOf(first),visibleEnd=last<ref.date?last:ref.date;
    const observed=dateList.filter(d=>d>=first&&d<=visibleEnd);
    const lastObserved=observed.at(-1)||null;
    const priorBoundary=previousDate(first);
    const startAvailable=dateList.includes(priorBoundary);
    const hasFullEnd=!!lastObserved&&lastObserved===visibleEnd;
    const [lastValue,firstValue]=await Promise.all([
      lastObserved?valueOf(lastObserved):Promise.resolve(null),
      startAvailable?valueOf(priorBoundary):Promise.resolve(null)
    ]);
    const gain=hasFullEnd&&firstValue!=null&&lastValue!=null&&lastValue>=firstValue
       ?lastValue-firstValue:null;
    const label=mode==='monthly'
       ?new Date(first+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'})
       :dateText(first)+' – '+dateText(last);
    return {label,total:lastValue,gain,partial:visibleEnd!==last||!hasFullEnd};
   }));
   if(id!==opening)return;
   for(let i=1;i<periodData.length;i++){
    const row=periodData[i],prior=periodData[i-1];
    const change=row.gain!=null&&prior.gain!=null&&!row.partial&&!prior.partial?row.gain-prior.gain:null;
    renderRow(row.label,row.total,row.gain,change,row.partial);
   }
   $('#svtHistoryNote').textContent+=' · * In-progress period; missing boundaries are shown as —.';
  }
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
  const id=row.dataset.historyId||'';
  show({kind:row.classList.contains('album-total-row')?'album':'track',release,id,title}).catch(console.error);
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
