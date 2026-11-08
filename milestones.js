'use strict';
const $=id=>document.getElementById(id);
const releaseByKey={"g3":"2015-12-04","g4":"2016-02-12","g14":"2018-08-13","g17":"2019-05-19","g19":"2019-08-05","g21":"2019-12-01","g26":"2020-09-15","g30":"2021-07-30","g31":"2021-06-30","g34":"2022-04-15","g38":"2022-08-26","g40":"2022-12-08","g42":"2023-08-16","g45":"2023-09-01","g47":"2023-12-25","g48":"2024-02-16","g55":"2024-05-03","g57":"2024-10-18","g60":"2025-06-30","g61":"2025-07-14","g62":"2025-07-25","g63":"2025-10-10","g64":"2026-02-27","g7":"2016-07-04","g23":"2020-06-22","g24":"2020-08-24","g37":"2022-07-18","g44":"2023-08-23","g50":"2024-04-29","g51":"2024-04-29","g52":"2024-04-29","g53":"2024-04-29","g54":"2024-04-29","g1":"2015-05-29","g2":"2015-09-10","g5":"2016-04-25","g6":"2016-07-04","g8":"2016-12-05","g9":"2017-05-22","g10":"2017-11-06","g11":"2018-02-05","g12":"2018-05-30","g13":"2018-07-16","g16":"2019-01-21","g18":"2019-05-29","g20":"2019-09-16","g22":"2020-04-01","g25":"2020-09-09","g27":"2020-10-19","g28":"2021-04-21","g29":"2021-06-18","g32":"2021-10-22","g33":"2021-12-08","g35":"2022-05-27","g36":"2022-07-18","g39":"2022-11-09","g41":"2023-04-24","g43":"2023-08-23","g46":"2023-10-23","g49":"2024-04-29","g56":"2024-10-14","g58":"2024-11-27","g59":"2025-05-26"};
const norm=s=>String(s||'').toLowerCase().normalize('NFKC').replace(/[^a-z0-9]/g,'');
const format=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const externalEvidence={
 'name:'+norm('Oh My!'):{100000000:{date:'2026-09-23',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('HOT'):{300000000:{date:'2026-08-18',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('17 (feat. Joshua and DK of SEVENTEEN)'):{100000000:{date:'2026-08-17',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('Darl+ing'):{200000000:{date:'2026-02-15',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('LOVE, MONEY, FAME (feat. DJ Khaled)'):{100000000:{date:'2026-02-06',source:'Spotify total reported as of Feb 6 by Maeil Business',url:'https://www.mk.co.kr/en/musics/11956771'}},
 'name:'+norm('Super'):{300000000:{date:'2026-01-14',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('To you'):{100000000:{date:'2025-11-22',source:'ChartMasters milestone history',url:'https://chartmasters.org/artist/seventeen/'}},
 'name:'+norm('THUNDER'):{100000000:{date:'2026-04-18',source:'Pledis confirmation reported Apr 20 (Saturday crossing)',url:'https://www.koreaherald.com/article/10720987'}}
};
let records=[], releases=new Map(), first=new Map(), observations=new Map(), ready=false;
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
    const key='name:'+norm(title);
    if(!releases.has(key)||date<releases.get(key))releases.set(key,date);
   });
  }
 }
}
function trackRows(snapshot){
 const out=new Map();
 for(const [id,value] of Object.entries(snapshot.tracks||{})){
  const name=snapshot.names?.[id]||'';
  if(!Number.isFinite(value)||!name||/total\s*:?$/i.test(name)||/total streams|monthly listener|followers/i.test(name))continue;
  const key='name:'+norm(name); // bridge spreadsheet legacy IDs and Spotify IDs by song name
  out.set(key,{id,name,value});
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
  const reached=!!evidence||item.firstValue>=threshold||o.some(x=>x.milestone===threshold);
  if(!reached)continue;
  const release=releases.get(item.id)||releases.get(key)||null;
  const verifiedDate=evidence?.date||(crossed?.exact?crossed.date:null);
  const duration=verifiedDate&&release&&days(release,verifiedDate)>=0?days(release,verifiedDate):null;
  rows.push({name:item.name,release,date:verifiedDate,range:!evidence&&crossed&&!crossed.exact?crossed:null,duration,source:evidence?.source,url:evidence?.url,status:evidence?'Published historical record':crossed?.exact?'Verified daily crossing':crossed?'Between saved dates':'Before archive'});
 }
 rows.sort((a,b)=>{
  if(sort==='name')return a.name.localeCompare(b.name);
  if(sort==='fast'||sort==='slow')return (a.duration==null?1:0)-(b.duration==null?1:0)||(a.duration!=null&&b.duration!=null?(sort==='fast'?a.duration-b.duration:b.duration-a.duration):0)||a.name.localeCompare(b.name);
  return (a.date==null?1:0)-(b.date==null?1:0)||(a.date&&b.date?(sort==='earliest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date)):0)||a.name.localeCompare(b.name);
 });
 $('rows').innerHTML=rows.length?rows.map((r,i)=>'<tr><td>'+esc(r.name)+'</td><td>'+(r.date?format(r.date):r.range?format(r.range.from)+' – '+format(r.range.date):'Unknown')+'</td><td>'+(r.duration!=null?r.duration.toLocaleString()+' days':r.release?'Not verifiable':'Release date unavailable')+'</td><td><span class="pill">'+esc(r.status)+'</span></td></tr>').join(''):'<tr><td colspan="4">No songs with a recorded milestone at this level.</td></tr>';
 const verified=rows.filter(x=>x.date).length;
 $('status').textContent=ready?rows.length+' songs reached '+(threshold/1000000)+'M · '+verified+' dated milestones backed by archive or cited external records · '+(rows.length-verified)+' dates not exact':'Loading…';
}
async function start(){
 try{
  const [manifest,catalog]=await Promise.all([fetch('data/manifest.json').then(r=>r.json()),fetch('data/catalog.json').then(r=>r.json())]);
  buildReleases(catalog);
  const dates=[...new Set(manifest.dates)].sort();
  const snapshots=new Array(dates.length);
  let cursor=0,done=0;
  async function worker(){
   while(cursor<dates.length){
    const index=cursor++,date=dates[index];
    try{const response=await fetch('data/history/group-'+date+'.json');if(response.ok)snapshots[index]=await response.json()}catch{}
    done++;$('status').textContent='Checking historical snapshots: '+done+' / '+dates.length;
   }
  }
  await Promise.all(Array.from({length:12},worker));
  let previous=null;
  for(const snapshot of snapshots){
   if(!snapshot)continue;
   const current=trackRows(snapshot);
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
  ready=true;build();
 }catch(error){$('status').textContent='Unable to load saved archive. Please refresh.';console.error(error)}
}
for(const id of ['threshold','sort','search'])$(id).addEventListener(id==='search'?'input':'change',build);
start();
