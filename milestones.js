'use strict';
const $=id=>document.getElementById(id);
const releaseByKey={"g3":"2015-12-04","g4":"2016-02-12","g14":"2018-08-13","g17":"2019-05-19","g19":"2019-08-05","g21":"2019-12-01","g26":"2020-09-15","g30":"2021-07-30","g31":"2021-06-30","g34":"2022-04-15","g38":"2022-08-26","g40":"2022-12-08","g42":"2023-08-16","g45":"2023-09-01","g47":"2023-12-25","g48":"2024-02-16","g55":"2024-05-03","g57":"2024-10-18","g60":"2025-06-30","g61":"2025-07-14","g62":"2025-07-25","g63":"2025-10-10","g64":"2026-02-27","g7":"2016-07-04","g23":"2020-06-22","g24":"2020-08-24","g37":"2022-07-18","g44":"2023-08-23","g50":"2024-04-29","g51":"2024-04-29","g52":"2024-04-29","g53":"2024-04-29","g54":"2024-04-29","g1":"2015-05-29","g2":"2015-09-10","g5":"2016-04-25","g6":"2016-07-04","g8":"2016-12-05","g9":"2017-05-22","g10":"2017-11-06","g11":"2018-02-05","g12":"2018-05-30","g13":"2018-07-16","g16":"2019-01-21","g18":"2019-05-29","g20":"2019-09-16","g22":"2020-04-01","g25":"2020-09-09","g27":"2020-10-19","g28":"2021-04-21","g29":"2021-06-18","g32":"2021-10-22","g33":"2021-12-08","g35":"2022-05-27","g36":"2022-07-18","g39":"2022-11-09","g41":"2023-04-24","g43":"2023-08-23","g46":"2023-10-23","g49":"2024-04-29","g56":"2024-10-14","g58":"2024-11-27","g59":"2025-05-26"};
const norm=s=>String(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9]/g,'');
const format=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const externalEvidence={
 ['name:'+norm('Oh My!')]:{100000000:{date:'2026-09-23',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('HOT')]:{300000000:{date:'2026-08-18',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('17 (feat. Joshua and DK of SEVENTEEN)'):{100000000:{date:'2026-08-17',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('Darl+ing')]:{200000000:{date:'2026-02-15',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('LOVE, MONEY, FAME (feat. DJ Khaled)'):{100000000:{date:'2026-02-06',source:'Spotify total reported as of Feb 6 by Maeil Business',url:'https://www.mk.co.kr/en/musics/11956771'}},
 ['name:'+norm('Super')]:{300000000:{date:'2026-01-14',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('To you')]:{100000000:{date:'2025-11-22',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 ['name:'+norm('THUNDER')]:{100000000:{date:'2026-04-18',source:'Pledis confirmation reported Apr 20 (Saturday crossing)',url:'https://www.koreaherald.com/article/10720987'}}
};
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
const milestoneCoverCache=new Map();
async function loadMilestoneCovers(){
 for(const img of document.querySelectorAll('.song-cover[data-spotify-id]')){
  const id=img.dataset.spotifyId;if(!id)continue;
  if(!milestoneCoverCache.has(id))milestoneCoverCache.set(id,fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/track/'+id)).then(r=>r.ok?r.json():null).then(d=>d?.thumbnail_url||'').catch(()=>'') );
  milestoneCoverCache.get(id).then(url=>{if(url&&img.isConnected)img.src=url});
 }
}
let records=[], releases=new Map(), trackNames=new Map(), first=new Map(), latestValues=new Map(), observations=new Map(), ready=false;
const milestones=[100000000,200000000,300000000,400000000,500000000,600000000,700000000,800000000,900000000,1000000000];
function buildReleases(catalog){
 for(const item of catalog.group||[]){
  const date=releaseByKey[item.key]||item.release_date||item.releaseDate;
  if(!/^\d{4}-\d\d-\d\d$/.test(date||''))continue;
  const ids=item.tracks||[];
  for(const id of ids){if(!releases.has(id)||date<releases.get(id))releases.set(id,date)}
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
 for(const [id,value] of Object.entries(snapshot.tracks||{})){
  const name=snapshot.names?.[id]||trackNames.get(id)||'';
  if(!Number.isFinite(value)||!name||/total\s*:?$/i.test(name)||/total streams|monthly listener|followers|\b(?:album total|original tracks|new tracks|stream change|daily streams|weekly streams|monthly streams)\b/i.test(name))continue;
  const canonicalName=name.replace(/\bGOM\b/gi,'God of Music');
  const key='name:'+norm(canonicalName); // bridge spreadsheet legacy IDs and Spotify IDs by song name
  out.set(key,{id,name:canonicalName,value});
 }
 return out;
}
function build(){
 const threshold=Number($('threshold').value),sort=$('sort').value,query=norm($('search').value);
 let rows=[];
 for(const [key,item] of first){
  if(query&&!norm(item.name).includes(query))continue;
  const o=observations.get(key)||[];
  const crossed=o.find(x=>x.milestone===threshold);
  const evidence=externalEvidence[key]?.[threshold];
  // A crossing is not sufficient: the latest available track-level total
  // must independently confirm the threshold. Never count album aggregates.
  const currentValue=latestValues.get(key);
  const reached=Number.isFinite(currentValue)&&currentValue>=threshold;
  if(!reached)continue;
  const release=releases.get(item.id)||releases.get(key)||null;
  const verifiedDate=evidence?.date||(crossed?.exact?crossed.date:null);
  const duration=verifiedDate&&release&&days(release,verifiedDate)>=0?days(release,verifiedDate):null;
  rows.push({id:item.id,name:item.name,release,date:verifiedDate,range:!evidence&&crossed&&!crossed.exact?crossed:null,duration,source:evidence?.source,url:evidence?.url,status:evidence?'Published historical record':crossed?.exact?'Verified daily crossing':crossed?'Between saved dates':'Before archive'});
 }
 rows.sort((a,b)=>{
  if(sort==='name')return a.name.localeCompare(b.name);
  if(sort==='fast'||sort==='slow')return (a.duration==null?1:0)-(b.duration==null?1:0)||(a.duration!=null&&b.duration!=null?(sort==='fast'?a.duration-b.duration:b.duration-a.duration):0)||a.name.localeCompare(b.name);
  return (a.date==null?1:0)-(b.date==null?1:0)||(a.date&&b.date?(sort==='earliest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date)):0)||a.name.localeCompare(b.name);
 });
 $('rows').innerHTML=rows.length?rows.map(r=>{
  const id=/^[a-zA-Z0-9]{22}$/.test(r.id||'')?r.id:'';
  const image='<img class="song-cover" data-spotify-id="'+esc(id)+'" alt="" loading="lazy">';
  return '<tr><td><div class="song-cell">'+image+'<span class="song-title">'+esc(r.name)+'</span></div></td>'+
   '<td>'+(r.release?format(r.release):'Unknown')+'</td>'+
   '<td>'+(r.date?format(r.date):r.range?format(r.range.from)+' – '+format(r.range.date):'Unknown')+'</td>'+
   '<td>'+(r.duration!=null?'<span class="days-value">'+r.duration.toLocaleString()+' days</span>':'—')+'</td></tr>';
 }).join(''):'<tr><td colspan="4">No songs with a recorded milestone at this level.</td></tr>';
 loadMilestoneCovers();

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
  const [catalog,group]=await Promise.all([
   jsonWithTimeout('data/catalog.json',12000).catch(()=>({group:[]})),
   jsonWithTimeout('data/group.json',15000)
  ]);
  latest=group;
  buildReleases(catalog);
  const latestRows=trackRows(latest);
  for(const [key,item] of latestRows){
   first.set(key,{...item,firstValue:item.value});
   latestValues.set(key,item.value);
  }
  ready=true;build();
  $('status').textContent+=' · Checking historical dates in background…';
 }catch(error){
  $('status').textContent='Could not load the current song snapshot. Please refresh the page.';
  $('rows').innerHTML='<tr><td colspan="4">Current stream data unavailable. Try refreshing.</td></tr>';
  console.error('Milestone snapshot error',error);
  return;
 }
 try{
  const manifest=await jsonWithTimeout('data/manifest.json',12000);
  const dates=[...new Set(manifest.dates||[])].filter(date=>date<=latest.date).sort();
  // Cap historical requests per session; this page must not wait an hour
  // for hundreds of simultaneous archive downloads.
  const selected=dates.slice(-120);
  const snapshots=new Array(selected.length);
  let cursor=0;
  async function worker(){
   while(cursor<selected.length){
    const index=cursor++,date=selected[index];
    try{snapshots[index]=await jsonWithTimeout('data/history/group-'+date+'.json',7000)}catch{}
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
  $('status').textContent+=' · Historical scan complete ('+selected.length+' recent saved dates checked)';
 }catch(error){
  build();
  $('status').textContent+=' · Historical dates temporarily unavailable';
  console.warn('Milestone archive scan',error);
 }
}

for(const id of ['threshold','sort','search'])$(id).addEventListener(id==='search'?'input':'change',build);
start();
