'use strict';
const $=id=>document.getElementById(id);
const milestoneMode=new URLSearchParams(location.search).get('type')==='solo'?'solo':'group';
const inSoloMilestones=milestoneMode==='solo';
if(inSoloMilestones){
 document.title='Units & Solo Spotify Milestones · SEVENTEEN';
 const eyebrow=document.querySelector('.hero .eyebrow');
 const intro=document.querySelector('.hero p');
 if(eyebrow)eyebrow.textContent='UNITS & SOLO · SPOTIFY HISTORY';
 if(intro)intro.textContent='Milestones for unit and solo songs only, from their own saved streaming archive.';
}
let unitTrackLinks={byIndex:{}},unitMedia={tracks:{},albums:{}};
let knownMilestoneTrackIds=new Set();
const soloLegacyCanonicalNames=new Map(),soloTrackIdsByName=new Map();
const soloNormalizeName=name=>String(name||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function indexOriginalSoloNames(reference){
 for(const [legacyId,name] of Object.entries(reference?.names||{})){
  const index=Number(legacyId.split(':').at(-1));
  const entry=unitTrackLinks.byIndex?.[index];
  if(!entry?.id||!name)continue;
  const normalized=soloNormalizeName(name);
  soloLegacyCanonicalNames.set(index,normalized);
  const ids=soloTrackIdsByName.get(normalized)||new Set();
  ids.add(entry.id);soloTrackIdsByName.set(normalized,ids);
 }
}
const releaseByKey={"g3":"2015-12-04","g4":"2016-02-12","g14":"2018-08-13","g17":"2019-05-19","g19":"2019-08-05","g21":"2019-12-01","g26":"2020-09-15","g30":"2021-07-30","g31":"2021-06-30","g34":"2022-04-15","g38":"2022-08-26","g40":"2022-12-08","g42":"2023-08-16","g45":"2023-09-01","g47":"2023-12-25","g48":"2024-02-16","g55":"2024-05-03","g57":"2024-10-18","g60":"2025-06-30","g61":"2025-07-14","g62":"2025-07-25","g63":"2025-10-10","g64":"2026-02-27","g7":"2016-07-04","g23":"2020-06-22","g24":"2020-08-24","g37":"2022-07-18","g44":"2023-08-23","g50":"2024-04-29","g51":"2024-04-29","g52":"2024-04-29","g53":"2024-04-29","g54":"2024-04-29","g1":"2015-05-29","g2":"2015-09-10","g5":"2016-04-25","g6":"2016-07-04","g8":"2016-12-05","g9":"2017-05-22","g10":"2017-11-06","g11":"2018-02-05","g12":"2018-05-30","g13":"2018-07-16","g16":"2019-01-21","g18":"2019-05-29","g20":"2019-09-16","g22":"2020-04-01","g25":"2020-09-09","g27":"2020-10-19","g28":"2021-04-21","g29":"2021-06-18","g32":"2021-10-22","g33":"2021-12-08","g35":"2022-05-27","g36":"2022-07-18","g39":"2022-11-09","g41":"2023-04-24","g43":"2023-08-23","g46":"2023-10-23","g49":"2024-04-29","g56":"2024-10-14","g58":"2024-11-27","g59":"2025-05-26"};
const norm=s=>String(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9]/g,'');
const format=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});
const compactMilestoneFormatter=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
const mobileCount=n=>compactMilestoneFormatter.format(n);
const mobileDate=d=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')))return '—';
 const [year,month,day]=d.split('-');return Number(month)+'/'+Number(day)+'/'+year.slice(2);
};
const responsiveValue=(full,small)=>'<span class="wide-value">'+full+'</span><span class="narrow-value" aria-hidden="true">'+small+'</span>';
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);
function calendarElapsed(a,b){
 if(!a||!b||b<a)return '';
 const [ay,am,ad]=a.split('-').map(Number),[by,bm,bd]=b.split('-').map(Number);
 const end=Date.UTC(by,bm-1,bd);
 let months=(by-ay)*12+(bm-am);
 const anniversary=n=>{
  const y=ay+Math.floor((am-1+n)/12),m=(am-1+n)%12;
  const day=Math.min(ad,new Date(Date.UTC(y,m+1,0)).getUTCDate());
  return Date.UTC(y,m,day);
 };
 while(months>0&&anniversary(months)>end)months--;
 const remaining=Math.round((end-anniversary(months))/86400000);
 const years=Math.floor(months/12),rest=months%12;
 return [years?years+' '+(years===1?'year':'years'):'',rest?rest+' '+(rest===1?'month':'months'):'',remaining+' '+(remaining===1?'day':'days')].filter(Boolean).join(' ');
}

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const soloMilestoneEvidence={
 'track:7eBpUuPnDTfbeP1P4P93CS':{
  100000000:{date:'2024-06-28',source:'Korean Sales #456 Spotify milestone archive',
   url:'https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html'}
 },
 'track:347PJwH4XqRbeaKaIW9sX3':{
  100000000:{date:'2025-09-11',
   source:'September 11, 2025 milestone date supplied by the site owner; a September 15, 2025 news report independently confirms it had passed 100M',
   url:'https://www.adatah.com/lifestyle/24415917937/bittersweet-wonwoo-mingyu-seventeen-feat-lee-hi-berhasil-mencapai-100-juta-streaming-di-spotify'}
 }
};
const externalEvidence={
 ['name:'+norm('Oh My!')]:{100000000:{date:'2026-09-23',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('HOT')]:{300000000:{date:'2026-08-18',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('17 (feat. Joshua and DK of SEVENTEEN)')]:{100000000:{date:'2026-08-17',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('Darl+ing')]:{200000000:{date:'2026-02-15',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('LOVE, MONEY, FAME (feat. DJ Khaled)')]:{100000000:{date:'2026-02-06',source:'Spotify total reported as of Feb 6 by Maeil Business',url:'https://www.mk.co.kr/en/musics/11956771'}},
 ['name:'+norm('Super')]:{300000000:{date:'2026-01-14',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('To you')]:{100000000:{date:'2025-11-22',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('THUNDER')]:{100000000:{date:'2026-04-18',source:'Pledis confirmation reported Apr 20 (Saturday crossing)',url:'https://www.koreaherald.com/article/10720987'}}
};
// The archive calls this recording "LOVE, MONEY, FAME" without its feature
// suffix. Both titles refer to the exact track confirmed at 100M on Feb 6.
(externalEvidence['name:'+norm('LOVE, MONEY, FAME')]??={})[100000000]={
 date:'2026-02-06',source:'ChartMasters February 6, 2026 milestone; Pledis confirmed the February 6 total',
 url:'https://chartmasters.org/artist/seventeen/'
};
// Dated 200M Spotify milestones supplied from milestone announcements.
for(const [song,date,source,url] of [
 ['Rock with you','2025-05-12','Spotify milestone announcement',''],
 ['Darl+ing','2026-02-15','Spotify milestone announcement',''],
 ['VERY NICE','2025-02-28','Spotify milestone announcement (approximate date)',''],
 ["Don't Wanna Cry",'2024-04-16','Spotify milestone announcement',''],
 ['HOT','2024-04-24','Spotify milestone announcement (approximate date)',''],
 ['Super','2024-05-02','svt_spotify milestone announcement','https://x.com/svt_spotify/status/1786091976246644797']
]){
 (externalEvidence['name:'+norm(song)]??={})[200000000]={date,source,url};
}
// Cross-checked 100M Spotify milestones, distinct from YouTube views.
for(const [song,date,url,source] of [
 ['Don\'t Wanna Cry','2021-03-13','https://koreansalestwt.blogspot.com/2022/01/k-pop-artist-song-milestones-on-spotify.html','Korean Sales Spotify milestone archive'],
 ['Super','2023-08-05','https://www.ptkorea.com/123870/','chartdata Spotify milestone announcement']
]){
 (externalEvidence['name:'+norm(song)]??={})[100000000]={date,url,source};
}
// Earliest documented date when reporting dates differ.
(externalEvidence['name:'+norm('Darl+ing')]??={})[100000000]={date:'2023-07-19',url:'https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html',source:'Korean Sales milestone archive'};
// Additional cross-checked milestones from independent reports.
for(const [song,threshold,date,url,source] of [
 ['Pretty U',100000000,'2023-12-21','https://www.allkpop.com/article/2023/12/seventeens-pretty-u-surpasses-100-million-streams-on-spotify','Allkpop, December 22, 2023'],
 ['THUNDER',100000000,'2026-04-18','https://www.koreaherald.com/article/10720987','The Korea Herald, citing Pledis'],
 ['HOT',100000000,'2023-02-03','https://twfan.net/user/1295744033680003072/favorite/2','SEVENTEEN Spotify fan update']
]){
 const key='name:'+norm(song);
 (externalEvidence[key]??={})[threshold]={date,source,url};
}
// Left & Right is sometimes catalogued with an ampersand or 'and'.
for(const title of ['Left & Right','Left and Right','Left Right']){
 (externalEvidence['name:'+norm(title)]??={})[100000000]={date:'2023-06-11',source:'Historical 100M Spotify milestone',url:''};
}
// Historical 100M dates supplied by milestone trackers.
for(const [song,date,url,source] of [
 ['VERY NICE','2022-11-09','https://www.reddit.com/r/seventeen/comments/yqtt7l/221110_seventeens_very_nice_has_now_surpassed_100/','r/seventeen dated announcement'],
 ['Rock with you','2023-04-03','https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html','Korean Sales milestone archive'],
 ['Left & Right','2023-06-11','https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html','Historical milestone listing'],
 ['CLAP','2023-06-12','https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html','Historical milestone listing'],
 ['HOT','2023-02-02','https://x.com/WORLDMUSICAWARD/status/1621335112515190786','World Music Awards dated announcement']
]){
 (externalEvidence['name:'+norm(song)]??={})[100000000]={date,url,source};
}
// Korean Sales milestone listing, entry #474.
(externalEvidence['name:'+norm('Ready to love')]??={})[100000000]={date:'2024-08-04',url:'https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html',source:'Korean Sales #474'};
// Earliest dates recorded in Korean Sales milestones #386 and #399.
(externalEvidence['name:'+norm('Pretty U')]??={})[100000000]={date:'2023-12-21',url:'https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html',source:'Korean Sales #386'};
(externalEvidence['name:'+norm('_WORLD')]??={})[100000000]={date:'2024-01-23',url:'https://koreansalestwt.blogspot.com/2023/02/k-pop-artist-song-milestones-on-spotify.html',source:'Korean Sales #399'};
// User-supplied 100M dates; source confirmation pending.
(externalEvidence['name:'+norm('MAESTRO')]??={})[100000000]={date:'2025-04-11',source:'User-provided milestone date',url:''};
(externalEvidence['name:'+norm('God of Music')]??={})[100000000]={date:'2025-01-22',source:'User-provided milestone date',url:''};
// User-supplied announcement date for Home reaching 100M.
(externalEvidence['name:'+norm('Home')]??={})[100000000]={date:'2024-12-05',source:'Dated SEVENTEEN Spotify milestone announcement (link pending)',url:''};
// SEVENTEEN Spotify (@svt_spotify), September 26, 2025 announcement.
(externalEvidence['name:'+norm('HIT')]??={})[100000000]={date:'2025-09-26',source:'SEVENTEEN Spotify announcement, Sep 26 2025',url:'https://x.com/svt_spotify'};
// Additional published Spotify track milestones (not music-video views).
for(const [song,threshold,date] of [
 ['HIT',100000000,'2025-09-26'],
 ['Rock with you',200000000,'2025-05-12'],
 ['CHEERS',100000000,'2025-04-12'],
 
 ['VERY NICE',200000000,'2025-02-28']
]){
 const key='name:'+norm(song);
 (externalEvidence[key]??={})[threshold]={date,source:'ChartMasters Spotify streams milestone',url:'https://chartmasters.org/artist/seventeen/'};
}
// Use the original release artwork from the same artwork-map as the Tracks view.
const milestoneCoverCache=new Map();
let milestoneArtwork={tracks:{}};
let verifiedMilestoneCovers={albums:{}};
const coverKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const releaseAliases={'fml album':'FML','al1 album':'Al1','you make my day album':'YOU MAKE MY DAY','you made my dawn album':'YOU MADE MY DAWN','an ode album':'An Ode','seventeenth heaven album':'SEVENTEENTH HEAVEN','17 is right here best album':'17 IS RIGHT HERE','spill the feels album':'SPILL THE FEELS','happy burstday album':'HAPPY BURSTDAY','love & letter album':'LOVE & LETTER','attacca album':'Attacca','face the sun album':'Face the Sun','your choice album':'Your Choice','heng garae album':'Heng:garæ','you make my dawn':'YOU MADE MY DAWN'};
async function originalArtwork(name){
 const entry=milestoneArtwork.tracks[coverKey(name)];
 if(!entry?.release&&!['oh my','god of music'].includes(coverKey(name)))return '';
 const forced={'oh my':'YOU MAKE MY DAY','god of music':'SEVENTEENTH HEAVEN'};
 const release=forced[coverKey(name)]||releaseAliases[coverKey(entry?.release)]||String(entry?.release||'').replace(/\\s+(?:album|single|mini album|ep)$/i,'').trim();
 const cacheKey='release:'+release;
 if(!milestoneCoverCache.has(cacheKey))milestoneCoverCache.set(cacheKey,(async()=>{
  try{
   const params=new URLSearchParams({term:'SEVENTEEN '+release,entity:'album',limit:'100',country:'US'});
   const response=await fetch('https://itunes.apple.com/search?'+params);
   if(!response.ok)return '';
   const data=await response.json();
   const clean=x=>coverKey(x).replace(/\\b(album|single|ep|mini)\\b/g,'').trim();
   const matches=(data.results||[]).filter(x=>/seventeen/i.test(x.artistName||'')&&clean(x.collectionName)===clean(release));
   const selected=matches.find(x=>String(x.artistName).toLowerCase()==='seventeen')||matches[0];
   return selected?.artworkUrl100?.replace(/\\d+x\\d+bb/,'600x600bb')||'';
  }catch{return ''}
 })());
 return milestoneCoverCache.get(cacheKey);
}
// Match the Tracks artwork first, with fallbacks for missing catalog mappings.
async function spotifyArtwork(id){
 if(!/^[a-zA-Z0-9]{22}$/.test(id||''))return '';
 const key='spotify:'+id;
 if(!milestoneCoverCache.has(key))milestoneCoverCache.set(key,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/track/'+id)).then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||'').catch(()=>''));
 return milestoneCoverCache.get(key);
}
async function trackArtwork(name){
 const key='track:'+coverKey(name);
 if(!milestoneCoverCache.has(key))milestoneCoverCache.set(key,(async()=>{
  try{
   const params=new URLSearchParams({term:'SEVENTEEN '+name,entity:'song',limit:'50',country:'US'});
   const response=await fetch('https://itunes.apple.com/search?'+params);
   if(!response.ok)return '';
   const data=await response.json();
   const clean=s=>coverKey(s).replace(/\\b(feat|featuring|ft)\\b.*$/,'').trim();
   const matches=(data.results||[]).filter(x=>/seventeen/i.test(x.artistName||'')&&clean(x.trackName)===clean(name));
   const selected=matches.find(x=>String(x.artistName).toLowerCase()==='seventeen')||matches[0];
   return selected?.artworkUrl100?.replace(/\\d+x\\d+bb/,'600x600bb')||'';
  }catch{return ''}
 })());
 return milestoneCoverCache.get(key);
}
function loadMilestoneCovers(){
 for(const img of document.querySelectorAll('.song-cover[data-song-name]')){
  if(inSoloMilestones){
   const local=unitMedia.tracks?.[img.dataset.spotifyId]?.local;
   if(local)img.src=local;
   continue;
  }
  const name=img.dataset.songName,id=img.dataset.spotifyId;
  (async()=>{
   // Pin to the verified original 2018 YOU MAKE MY DAY album, not a reissue track.
   if(coverKey(name)==='oh my'){
    try{
     const res=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/album/5VmjGHq779chFVL7dgLbyo'));
     const data=res.ok?await res.json():null;
     if(data?.thumbnail_url&&img.isConnected){img.src=data.thumbnail_url;return}
    }catch{}
    // If Spotify is blocked, use the album-specific Apple Music lookup below.
    const original=await originalArtwork(name);
    if(original&&img.isConnected){img.src=original;return}
   }
   const entry=milestoneArtwork.tracks[coverKey(name)];
   // Prefer the exact recording's verified cover URL from the OT13 archive.
   // iTunes album search can return a different SEVENTEEN release (e.g. Darl+ing for HOT).
   const verified=verifiedMilestoneCovers.albums?.[entry?.id]||verifiedMilestoneCovers.albums?.[id];
   if(verified){img.src=verified;continue}
   const fallback=async()=>await spotifyArtwork(entry?.id||id)||await trackArtwork(name);
   let url=await originalArtwork(name);
   if(!url)url=await fallback();
   if(!img.isConnected||!url)return;
   img.onerror=async()=>{img.onerror=null;const alternative=await fallback();if(alternative&&alternative!==img.src&&img.isConnected)img.src=alternative};
   img.src=url;
  })();
 }
}

let records=[], releases=new Map(), trackNames=new Map(), first=new Map(), latestValues=new Map(), observations=new Map(), ready=false;
// Original song releases, never the 2024 anthology reissue.
const originalSongDates={
 hot:'2022-05-27',prettyu:'2016-04-25',rockwithyou:'2021-10-22',
 verynice:'2016-07-04'
};
// Reached milestones: 100M and above in BOTH views. Upcoming targets remain independent.
const milestones=[100000000,200000000,300000000,400000000,500000000,600000000,700000000,800000000,900000000,1000000000];
function buildReleases(catalog){
 for(const item of (inSoloMilestones?catalog.solo:catalog.group)||[]){
  const date=inSoloMilestones?(item.release_date||item.releaseDate):(releaseByKey[item.key]||item.release_date||item.releaseDate);
  if(!/^\d{4}-\d\d-\d\d$/.test(date||''))continue;
  const ids=item.tracks||[];
  if(inSoloMilestones)ids.forEach(id=>knownMilestoneTrackIds.add(id));
  for(const id of ids){
   const original=inSoloMilestones?(item.track_release_dates?.[id]||date):date;
   if(!releases.has(id)||original<releases.get(id))releases.set(id,original)
  }
  const description=String(item.description||'');
  const match=description.match(/\(\d+\s+tracks?\)\s*:\s*(.*)$/i);
  if(match){
   const titles=[];let depth=0,part='';
   for(const ch of match[1]){if(ch==='(')depth++;else if(ch===')')depth--;if(ch===','&&depth===0){titles.push(part.trim());part=''}else part+=ch}
   if(part.trim())titles.push(part.trim());
   if(titles.length===ids.length)titles.forEach((title,i)=>{
    if(!trackNames.has(ids[i]))trackNames.set(ids[i],title);
    const key='name:'+norm(title);
    if(!releases.has(key)||date<releases.get(key))releases.set(key,date);
   });
  }
 }
}
function trackRows(snapshot){
 const out=new Map();
 for(const [rawId,value] of Object.entries(snapshot.tracks||{})){
  if(!Number.isFinite(value)||value<0)continue;
  let id=rawId;
  if(inSoloMilestones){
   if(/^legacy:/.test(id)){
    const index=Number(id.split(':').at(-1));
    const title=soloNormalizeName(snapshot.names?.[rawId]||'');
    const indexed=unitTrackLinks.byIndex?.[index];
    if(indexed&&title===soloLegacyCanonicalNames.get(index))id=indexed.id;
    else{
     const matches=soloTrackIdsByName.get(title);
     id=matches?.size===1?[...matches][0]:null;
    }
   }
   if(!id||!knownMilestoneTrackIds.has(id))continue;
  }
  const savedName=inSoloMilestones?unitMedia.tracks?.[id]?.title:null;
  const name=savedName||snapshot.names?.[rawId]||trackNames.get(id)||'';
  if(!name||/total\s*:?$/i.test(name)||/total streams|monthly listener|followers|\b(?:album total|original tracks|new tracks|stream change|daily streams|weekly streams|monthly streams)\b/i.test(name))continue;
  const canonicalName=name.replace(/\bGOM\b/gi,'God of Music').replace(/^maestro$/i,'MAESTRO');
  const key=inSoloMilestones?'track:'+id:'name:'+norm(canonicalName);
  const prior=out.get(key);
  if(!prior||value>prior.value)out.set(key,{id,name:canonicalName,value});
 }
 return out;
}

const upcomingTargets=[1000000,10000000,20000000,30000000,40000000,50000000,60000000,70000000,80000000,90000000,100000000,200000000,300000000,400000000,500000000,600000000,700000000,800000000,900000000,1000000000];
let currentSnapshot=null,previousSnapshot=null;
const shortStreams=n=>n>=1000000000?(n/1000000000)+'B':(n/1000000)+'M';
function nextTarget(value){return upcomingTargets.find(target=>value<target)||null}
function updateMilestoneOptions(){
 if(!currentSnapshot)return;
 const values=[...trackRows(currentSnapshot).values()].map(row=>row.value);
 const max=Math.max(0,...values);
 const reached=$('threshold'),upcoming=$('upcomingThreshold');
 const previousReached=reached.value,previousUpcoming=upcoming.value;
 reached.innerHTML=milestones.filter(target=>target<=300000000||max>=target).map(target=>'<option value="'+target+'">'+shortStreams(target)+'</option>').join('');
 upcoming.innerHTML='<option value="0">All next milestones</option>'+upcomingTargets.filter(target=>target<=400000000||max>=upcomingTargets[upcomingTargets.indexOf(target)-1]).map(target=>'<option value="'+target+'">'+shortStreams(target)+'</option>').join('');
 if([...reached.options].some(o=>o.value===previousReached))reached.value=previousReached;
 if([...upcoming.options].some(o=>o.value===previousUpcoming))upcoming.value=previousUpcoming;
}

function renderUpcoming(){
 const filter=Number($('upcomingThreshold').value),sort=$('upcomingSort').value,query=norm($('upcomingSearch').value);
 if(!currentSnapshot){$('upcomingStatus').textContent='Loading latest Spotify snapshot…';return}
 const now=trackRows(currentSnapshot);
 const prev=previousSnapshot?trackRows(previousSnapshot):new Map();
 const deltaDays=previousSnapshot?days(previousSnapshot.date,currentSnapshot.date):0;
 const rows=[];
 for(const [key,item] of now){
  if(query&&!norm(item.name).includes(query))continue;
  const target=nextTarget(item.value);
  if(!target||(filter&&target!==filter))continue;
  const old=prev.get(key);
  // Missing calendar days cannot be converted into a one-day gain.
  const observed=old&&deltaDays>0&&item.value>=old.value?item.value-old.value:null;
  const gain=deltaDays===1?observed:null;
  const remaining=target-item.value;
  const estimate=gain>0?Math.ceil(remaining/gain):null;
  const expected=estimate!=null&&estimate<=365000?new Date(Date.parse(currentSnapshot.date+'T12:00:00Z')+estimate*86400000).toISOString().slice(0,10):null;
  rows.push({...item,target,gain,observed,deltaDays,remaining,estimate,expected});
 }
 rows.sort((a,b)=>{
  if(sort==='closest')return a.remaining-b.remaining||a.name.localeCompare(b.name);
  if(sort==='soonest')return (a.estimate==null?1:0)-(b.estimate==null?1:0)||(a.estimate??0)-(b.estimate??0)||a.name.localeCompare(b.name);
  if(sort==='streams')return b.value-a.value||a.name.localeCompare(b.name);
  if(sort==='name')return a.name.trim().localeCompare(b.name.trim(),'en',{numeric:true,sensitivity:'base'});
  return a.target-b.target||b.value-a.value;
 });
 const hasGap=Boolean(previousSnapshot&&deltaDays>1);
 const gainHeader=document.querySelector('#upcomingView thead th:nth-child(4)');
 if(gainHeader)gainHeader.textContent=hasGap?'GAIN SINCE LAST SNAPSHOT':'DAILY GAIN';
 $('upcomingRows').innerHTML=rows.length?rows.map((r,i)=>{
  const img='<img class="song-cover" data-song-name="'+esc(r.name)+'" data-spotify-id="'+esc(r.id||'')+'" alt="" loading="lazy">';
  return '<tr><td><div class="song-cell"><span class="song-rank">'+String(i+1).padStart(2,'0')+'</span>'+img+'<div class="song-meta"><span class="song-title">'+esc(r.name)+'</span><span class="song-release">'+r.value.toLocaleString()+' streams'+(releases.get(r.id)?' · Released '+esc(format(releases.get(r.id))):'')+'</span></div></div></td>'+
  '<td data-label="NEXT MILESTONE"><span class="reached-value">'+shortStreams(r.target)+'</span></td>'+
  '<td data-label="STREAMS LEFT" title="'+r.remaining.toLocaleString()+' streams">'+responsiveValue(r.remaining.toLocaleString(),mobileCount(r.remaining))+'</td>'+
  '<td data-label="'+(hasGap?'OBSERVED GAIN':'DAILY GAIN')+'" title="'+(r.observed==null?'Unavailable':r.observed.toLocaleString()+' streams over '+r.deltaDays+' day'+(r.deltaDays===1?'':'s'))+'">'+responsiveValue(r.observed==null?'—':'+'+r.observed.toLocaleString()+(hasGap?' ('+r.deltaDays+' days)':''),r.observed==null?'—':'+'+mobileCount(r.observed)+(hasGap?' / '+r.deltaDays+'d':''))+'</td>'+
  '<td data-label="ESTIMATED ARRIVAL" title="'+(r.expected?format(r.expected):'Unavailable')+'">'+
   responsiveValue('<span class="days-value">'+(r.estimate==null?'—':r.estimate.toLocaleString()+' days')+'</span>'+(r.expected?'<div class="song-release">'+format(r.expected)+'</div>':''),r.expected?mobileDate(r.expected):(r.estimate==null?'—':r.estimate+'d'))+'</td></tr>';
 }).join(''):'<tr><td colspan="5">No tracks waiting for this milestone.</td></tr>';
 $('upcomingStatus').textContent=rows.length+' songs · Sorted by '+($('upcomingSort').selectedOptions[0]?.textContent||'Next milestone')+' · Latest snapshot: '+format(currentSnapshot.date)+(hasGap?' · Showing actual '+deltaDays+'-day change since '+format(previousSnapshot.date)+'; daily estimates require consecutive dates':deltaDays!==1?' · Daily growth unavailable until two consecutive snapshots exist':' · Estimates use the latest one-day gain');
 loadMilestoneCovers();scheduleMilestoneNameFit();
}

// The compact milestone tables share one-row song labels. Shrink only titles
// that overflow their own column, so every screen width gets an appropriate
// font size without shrinking all titles unnecessarily.
let milestoneNameFitFrame=0;
function fitMilestoneNamesOnMobile(){
 const names=[...document.querySelectorAll('#reachedView .song-title, #upcomingView .song-title')];
 if(!window.matchMedia('(max-width:650px)').matches){
  for(const el of names)el.style.removeProperty('font-size');
  return;
 }
 const visible=names.filter(el=>el.getClientRects().length>0);
 for(const el of visible)el.style.removeProperty('font-size');
 const sizes=visible.map(el=>{
  const computed=getComputedStyle(el);
  return {el,size:parseFloat(computed.fontSize)||9,width:el.clientWidth,content:el.scrollWidth};
 });
 for(const {el,size,width,content} of sizes){
  if(width<1||content<=width+1)continue;
  el.style.setProperty('font-size',Math.max(6,Math.floor(size*(width-2)/content*10)/10)+'px','important');
  el.title=el.title||el.textContent.trim();
 }
}
function scheduleMilestoneNameFit(){
 if(milestoneNameFitFrame)cancelAnimationFrame(milestoneNameFitFrame);
 milestoneNameFitFrame=requestAnimationFrame(()=>{
  milestoneNameFitFrame=0;
  fitMilestoneNamesOnMobile();
 });
}
window.addEventListener('resize',scheduleMilestoneNameFit,{passive:true});
window.addEventListener('orientationchange',scheduleMilestoneNameFit,{passive:true});
document.fonts?.ready.then(scheduleMilestoneNameFit).catch(()=>{});

function setMilestoneView(view){
 const upcoming=view==='upcoming';
 $('reachedView').hidden=upcoming;
 $('upcomingView').hidden=!upcoming;
 $('tabReached').setAttribute('aria-selected',String(!upcoming));
 $('tabUpcoming').setAttribute('aria-selected',String(upcoming));
 try{sessionStorage.setItem('svt-milestone-view',view)}catch{}
 if(upcoming)renderUpcoming();
 scheduleMilestoneNameFit();
}
$('tabReached').addEventListener('click',()=>setMilestoneView('reached'));
$('tabUpcoming').addEventListener('click',()=>setMilestoneView('upcoming'));
for(const id of ['upcomingThreshold','upcomingSort','upcomingSearch'])$(id).addEventListener(id==='upcomingSearch'?'input':'change',renderUpcoming);
setMilestoneView('reached');

function build(){
 const threshold=Number($('threshold').value),sort=$('sort').value,query=norm($('search').value);
 let rows=[];
 for(const [key,item] of first){
  if(query&&!norm(item.name).includes(query))continue;
  const o=observations.get(key)||[];
  const crossed=o.find(x=>x.milestone===threshold);
  const aliases={
  'leftandright':'leftandright','leftright':'leftandright',
  'world':'world','theworld':'world',
  'lovemoneyfame':'lovemoneyfamefeatdjkhaled',
  'lovemoneyfamefeatdjkhaled':'lovemoneyfamefeatdjkhaled',
  'godofmusic':'godofmusic','gom':'godofmusic',
  'ohmy':'ohmy'
 };
 const normalized=norm(item.name);
 const lookup='name:'+(aliases[normalized]||normalized);
 const evidence=inSoloMilestones?soloMilestoneEvidence[key]?.[threshold]:(externalEvidence[key]?.[threshold]||externalEvidence[lookup]?.[threshold]);
  // A crossing is not sufficient: the latest available track-level total
  // must independently confirm the threshold. Never count album aggregates.
  const currentValue=latestValues.get(key);
  const reached=Number.isFinite(currentValue)&&currentValue>=threshold;
  if(!reached)continue;
  const release=inSoloMilestones?(releases.get(item.id)||null):(originalSongDates[normalized]||releases.get('name:'+normalized)||releases.get(item.id)||releases.get(key)||null);
  // Daily snapshot crossings use the date of the first snapshot at/above the milestone.
  // Keep earlier documented announcement dates when a gap in snapshots could hide the true crossing.
  const verifiedDate=crossed?.exact?crossed.date:(evidence?.date||null);
  const duration=verifiedDate&&release&&days(release,verifiedDate)>=0?days(release,verifiedDate):null;
  rows.push({id:item.id,name:item.name,release,date:verifiedDate,knownBy:evidence?.by||null,range:!verifiedDate&&crossed&&!crossed.exact?crossed:null,duration,source:evidence?.source,url:evidence?.url,status:crossed?.exact?'Verified daily snapshot crossing':evidence?.date?'Published historical crossing':evidence?.by?'Confirmed before archive':'Between archived snapshots'});
 }
 rows.sort((a,b)=>{
  if(sort==='name')return a.name.localeCompare(b.name);
  if(sort==='release-newest'||sort==='release-oldest')return (a.release==null?1:0)-(b.release==null?1:0)||(a.release&&b.release?(sort==='release-newest'?b.release.localeCompare(a.release):a.release.localeCompare(b.release)):0)||a.name.localeCompare(b.name);
  if(sort==='fast'||sort==='slow')return (a.duration==null?1:0)-(b.duration==null?1:0)||(a.duration!=null&&b.duration!=null?(sort==='fast'?a.duration-b.duration:b.duration-a.duration):0)||a.name.localeCompare(b.name);
  return (a.date==null?1:0)-(b.date==null?1:0)||(a.date&&b.date?(sort==='earliest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date)):0)||a.name.localeCompare(b.name);
 });
 $('rows').innerHTML=rows.length?rows.map((r,index)=>{
  const image='<img class="song-cover" data-song-name="'+esc(r.name)+'" data-spotify-id="'+esc(r.id||'')+'" alt="" loading="lazy">';
  const released=r.release?format(r.release):'Release date unavailable';
  const reached=r.date?format(r.date):r.knownBy?'By '+format(r.knownBy):r.range?format(r.range.from)+' – '+format(r.range.date):'Unknown';
  const elapsed=r.duration!=null?r.duration.toLocaleString()+' days <span class="elapsed-calendar">('+esc(calendarElapsed(r.release,r.date))+')</span>':'—';
  return '<tr><td><div class="song-cell"><span class="song-rank">'+String(index+1).padStart(2,'0')+'</span>'+image+'<div class="song-meta"><span class="song-title">'+esc(r.name)+'</span><span class="song-release">Released '+esc(released)+'</span></div></div></td>'+
   '<td data-label="MILESTONE REACHED" title="'+esc(reached)+'"><span class="reached-value">'+responsiveValue(esc(reached),r.date?mobileDate(r.date):r.knownBy?'≤ '+mobileDate(r.knownBy):r.range?mobileDate(r.range.date):'—')+'</span></td>'+
   '<td data-label="TIME FROM RELEASE" title="'+(r.duration==null?'Unavailable':r.duration.toLocaleString()+' days')+'"><span class="days-value">'+responsiveValue(elapsed,r.duration==null?'—':r.duration.toLocaleString()+'d')+'</span></td></tr>';
 }).join(''):'<tr><td colspan="3">No songs with a recorded milestone at this level.</td></tr>';
 loadMilestoneCovers();scheduleMilestoneNameFit();

 const verified=rows.filter(x=>x.date).length;
 $('status').textContent=ready?rows.length+' songs reached '+(threshold/1000000)+'M · '+verified+' dated milestones backed by archive or cited external records · '+(rows.length-verified)+' dates not exact':'Loading…';
}
async function jsonWithTimeout(url,ms=12000){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),ms);
 try{
  const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw new Error(url+' HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(timer)}
}
async function start(){
 // Always show usable milestone rows from the current snapshot first.
 // Older history is an optional enhancement, never a loading prerequisite.
 let latest;
 try{
  const [catalog,group,artwork,unitLinks,unitCovers,reference,groupCovers]=await Promise.all([
   jsonWithTimeout('data/catalog.json',12000).catch(()=>({group:[],solo:[]})),
   jsonWithTimeout('data/'+milestoneMode+'.json',15000),
   jsonWithTimeout('data/artwork-map.json',12000).catch(()=>({tracks:{}})),
   inSoloMilestones?jsonWithTimeout('data/solo-legacy-track-links.json',12000).catch(()=>({byIndex:{}})):Promise.resolve({byIndex:{}}),
   inSoloMilestones?jsonWithTimeout('data/solo-media.json',12000).catch(()=>({tracks:{}})):Promise.resolve({tracks:{}}),
   inSoloMilestones?jsonWithTimeout('solo-2026-11-06.json',12000).catch(()=>({names:{}})):Promise.resolve({names:{}}),
   jsonWithTimeout('data/group-cover-urls.json',12000).catch(()=>({albums:{}}))
  ]);
  unitTrackLinks=unitLinks;unitMedia=unitCovers;
  if(inSoloMilestones)indexOriginalSoloNames(reference);
  milestoneArtwork=artwork;verifiedMilestoneCovers=groupCovers;
  latest=group;
  currentSnapshot=group;
  buildReleases(catalog);
  const latestRows=trackRows(latest);
  for(const [key,item] of latestRows){
   first.set(key,{...item,firstValue:item.value});
   latestValues.set(key,item.value);
  }
  updateMilestoneOptions();
  ready=true;build();renderUpcoming();
  // Only one previous daily snapshot is used to calculate the current growth rate.
  // Upcoming milestones never wait for the historical milestone scan.
  (async()=>{
   try{
    const previousDate=new Date(Date.parse(group.date+'T12:00:00Z')-86400000).toISOString().slice(0,10);
    const candidates=[previousDate];
    if(inSoloMilestones){
     // New solo archives live under data/history. Older workbook snapshots
     // can also be at the repository root; scan actual saved dates only.
     const manifest=await jsonWithTimeout('data/manifest.json',10000).catch(()=>({}));
     const available=(manifest.solo_dates||[]).filter(d=>d<group.date).sort().reverse();
     for(const d of available.slice(0,7))if(!candidates.includes(d))candidates.push(d);
    }
    for(const date of candidates){
     const paths=inSoloMilestones?['data/history/solo-'+date+'.json','solo-'+date+'.json']:
      ['data/history/group-'+date+'.json'];
     for(const file of paths){
      try{
       const snapshot=await jsonWithTimeout(file,6000);
       if(snapshot?.date===date){previousSnapshot=snapshot;break}
      }catch{}
     }
     if(previousSnapshot)break;
    }
   }catch(error){console.warn('Previous milestone snapshot unavailable',error)}
   renderUpcoming();
  })();
  $('status').textContent+=' · Checking historical dates in background…';
 }catch(error){
  $('status').textContent='Could not load the current song snapshot. Please refresh the page.';
  $('rows').innerHTML='<tr><td colspan="4">Current stream data unavailable. Try refreshing.</td></tr>';
  console.error('Milestone snapshot error',error);
  return;
 }
 try{
  const manifest=await jsonWithTimeout('data/manifest.json',12000);
  const dates=[...new Set((inSoloMilestones?manifest.solo_dates:manifest.dates)||[])].filter(date=>date<=latest.date).sort();
  const soloLegacyDates=new Set(inSoloMilestones?manifest.solo_legacy_dates||[]:[]);
  // Older unit/solo workbook files live at the repository root, while newer
  // automated collector snapshots live under data/history/.
  const historicalPath=date=>inSoloMilestones&&soloLegacyDates.has(date)
   ?'solo-'+date+'.json':'data/history/'+milestoneMode+'-'+date+'.json';
  // Cap historical requests per session; this page must not wait an hour
  // for hundreds of simultaneous archive downloads.
  const selected=dates.slice(-120);
  const snapshots=new Array(selected.length);
  let cursor=0;
  async function worker(){
   while(cursor<selected.length){
    const index=cursor++,date=selected[index];
    try{snapshots[index]=await jsonWithTimeout(historicalPath(date),7000)}catch{}
   }
  }
  await Promise.all(Array.from({length:6},worker));
  let previous=null;
  for(const snapshot of snapshots){
   if(!snapshot)continue;
   const current=trackRows(snapshot);
   if(previous){
    let matched=0,drops=0;
    for(const [key,item] of current){
     const old=previous.rows.get(key);
     if(old&&old.value>1000000){matched++;if(item.value<old.value*.8)drops++}
    }
    if(matched>=30&&drops/matched>.12)continue;
   }
   for(const [key,item] of current){
    if(!first.has(key))first.set(key,{...item,firstValue:item.value});
    const earlier=previous?.rows.get(key);
    if(earlier){
     for(const milestone of milestones){
      if(earlier.value<milestone&&item.value>=milestone){
       if(!observations.has(key))observations.set(key,[]);
       observations.get(key).push({milestone,date:snapshot.date,from:previous.date,exact:days(previous.date,snapshot.date)===1});
      }
     }
    }
   }
   previous={date:snapshot.date,rows:current};
  }
  build();

 }catch(error){
  build();
  $('status').textContent+=' · Historical dates temporarily unavailable';
  console.warn('Milestone archive scan',error);
 }
}

// Preserve page controls across reloads; refreshing should only update the data.
const selectionKey='svt-milestones-controls-v1';
try{
 const saved=JSON.parse(sessionStorage.getItem(selectionKey)||'{}');
 const urlThreshold=new URLSearchParams(location.search).get('milestone');
 if(urlThreshold&&[...$('threshold').options].some(o=>o.value===urlThreshold))$('threshold').value=urlThreshold;
 else if(saved.threshold&&[...$('threshold').options].some(o=>o.value===saved.threshold))$('threshold').value=saved.threshold;
 if(saved.sort&&[...$('sort').options].some(o=>o.value===saved.sort))$('sort').value=saved.sort;
 if(typeof saved.search==='string')$('search').value=saved.search;
}catch{}
function saveSelection(){
 try{sessionStorage.setItem(selectionKey,JSON.stringify({threshold:$('threshold').value,sort:$('sort').value,search:$('search').value}))}catch{}
}
for(const id of ['threshold','sort','search'])$(id).addEventListener(id==='search'?'input':'change',()=>{saveSelection();build()});
start();
