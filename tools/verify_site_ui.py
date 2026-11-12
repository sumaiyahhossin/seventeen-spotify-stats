"""Smoke-test the real dashboard DOM at desktop and mobile widths."""
from __future__ import annotations
import contextlib
import json
import re
import datetime
import http.server
import pathlib
import socketserver
import threading
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

ROOT=pathlib.Path(__file__).resolve().parents[1]
PORT=8765
class Server(socketserver.ThreadingMixIn,http.server.HTTPServer):
    daemon_threads=True

def read_layout(driver, name):
    WebDriverWait(driver,40).until(lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>=1)
    row=driver.find_element(By.CSS_SELECTOR,'#ranking .rank-row')
    name_el=row.find_element(By.CSS_SELECTOR,'.track-copy .track-name')
    cover=row.find_element(By.CSS_SELECTOR,'.cover-slot')
    data=driver.execute_script("""
      const title=arguments[0].getBoundingClientRect(),cover=arguments[1].getBoundingClientRect();
      return {titleLeft:title.left,coverRight:cover.right,gap:title.left-cover.right,
              aligned:getComputedStyle(arguments[0]).textAlign,
              coverVisible:cover.width>0&&cover.height>0};
    """,name_el,cover)
    print(name,data,flush=True)
    assert data['coverVisible'], name+' missing cover slot'
    assert -2<=data['gap']<=35, f"{name}: title not next to cover; gap {data['gap']}"
    assert data['aligned'] in ('left','start'), name+' title aligned incorrectly'
    return data

def click(driver,selector):
    WebDriverWait(driver,30).until(lambda d:d.execute_script("""
        const el=document.querySelector(arguments[0]);
        if(!el || el.disabled)return false;
        el.click();
        return true;
    """,selector))

def check_column_dividers(driver, section):
    # The old test only checked for a 1px ::before in the FIRST row. That
    # allowed visibly broken lines between rows. Check one overlay spanning
    # from the header to the final row at the real metric column positions.
    WebDriverWait(driver,15).until(lambda d:d.execute_script("""
        const rules=document.querySelector('#svtPrimaryStats .svt-continuous-column-rules');
        return rules && !rules.hidden && rules.querySelectorAll('.svt-column-rule').length>=2;
    """))
    result=driver.execute_script("""
        const root=document.getElementById('svtPrimaryStats');
        const head=root.querySelector('.table-head');
        const ranking=document.getElementById('ranking');
        const first=ranking.querySelector('.rank-row');
        const last=ranking.querySelector('.rank-row:last-of-type');
        const rules=root.querySelector('.svt-continuous-column-rules');
        const visible=[...first.querySelectorAll(':scope>.rank-metric')]
          .filter(el=>getComputedStyle(el).display!=='none')
          .sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);
        const lines=[...rules.querySelectorAll('.svt-column-rule')];
        const offset=(parseFloat(getComputedStyle(first).columnGap)||0)/2;
        const headerVisible=head&&getComputedStyle(head).display!=='none';
        const expectedTop=headerVisible?head.getBoundingClientRect().top:ranking.getBoundingClientRect().top;
        const rect=rules.getBoundingClientRect();
        return {
          metrics:visible.length,lines:lines.length,
          maxHorizontalError:Math.max(0,...lines.map((line,i)=>
            Math.abs(line.getBoundingClientRect().left-(visible[i].getBoundingClientRect().left-offset)))),
          correctStart:Math.abs(rect.top-expectedTop)<2,
          reachesBottom:Math.abs(rect.bottom-ranking.getBoundingClientRect().bottom)<2,
          fullLastRow:rect.bottom>=last.getBoundingClientRect().bottom-2,
          widths:lines.map(l=>l.getBoundingClientRect().width),
          noOldPerRowLines:visible.every(v=>getComputedStyle(v,'::before').content==='none')
        };
    """)
    assert result['metrics']>=2 and result['lines']==result['metrics'], (section,result)
    assert result['maxHorizontalError']<2, (section,result)
    assert result['correctStart'] and result['reachesBottom'] and result['fullLastRow'], (section,result)
    assert all(abs(width-1)<0.2 for width in result['widths']), (section,result)
    assert result['noOldPerRowLines'], (section,result)
    print(section,'continuous full-height ranking dividers:',result,flush=True)

def check_trend_palette(driver, section):
    colors=driver.execute_script("""
      const metric=document.querySelector('#svtPrimaryStats #ranking .rank-row>.rank-metric');
      if(!metric)return {error:'No visible metric'};
      const original=metric.className;
      try{
        const value=metric.querySelector('.metric-value');
        const compact=metric.querySelector('.metric-compact');
        metric.classList.remove('positive','negative','unchanged','missing-value');
        metric.classList.add('positive');
        const increase=[getComputedStyle(value).color,getComputedStyle(compact).color];
        metric.classList.replace('positive','negative');
        const decrease=[getComputedStyle(value).color,getComputedStyle(compact).color];
        return {increase,decrease};
      }finally{metric.className=original}
    """)
    assert colors.get('increase')==['rgb(160, 201, 232)']*2,(section,colors)
    assert colors.get('decrease')==['rgb(243, 182, 209)']*2,(section,colors)
    print(section,'Serenity / Rose Quartz ranking palette verified:',colors,flush=True)

def check_summary_growth_header_white(driver, section):
    # Header totals and explanatory text remain white in OT13, Units/Solo
    # and All, even while the smaller ranking deltas use the two accent colors.
    colors=driver.execute_script("""
      const results={};
      for(const [id,noteId] of [['gain',null],['all-summaryGrowth','all-summaryGrowthNote']]){
        const el=document.getElementById(id);
        const saved=el.className;
        const note=noteId?document.getElementById(noteId):el.nextElementSibling;
        try{
          el.classList.remove('svt-gain-positive','svt-gain-negative');
          const neutral=getComputedStyle(el).color;
          el.classList.add('svt-gain-positive');
          const positive=getComputedStyle(el).color;
          el.classList.replace('svt-gain-positive','svt-gain-negative');
          const negative=getComputedStyle(el).color;
          results[id]={neutral,positive,negative,note:getComputedStyle(note).color};
        }finally{el.className=saved}
      }
      return results;
    """)
    for metric, result in colors.items():
        assert all(result[k]=='rgb(255, 255, 255)'
                   for k in ('neutral','positive','negative')), (section,metric,result)
        assert result['note']=='rgb(244, 240, 255)', (section,metric,result)
    print(section,'white summary growth headings / comparisons:',colors,flush=True)

def check_daily_tracks_four_columns(driver, section):
    # Daily tracks must show the real cumulative count AND the two gains,
    # including on the smallest supported phone viewport.
    WebDriverWait(driver,25).until(lambda d:d.execute_script("""
      const first=document.querySelector('#ranking .rank-row');
      return document.body.classList.contains('svt-daily-tracks')&&first&&
        first.querySelectorAll(':scope > .rank-metric').length===3;
    """))
    metrics=driver.execute_script("""
      const row=document.querySelector('#ranking .rank-row');
      const head=document.querySelector('#svtPrimaryStats .table-head');
      const ranking=document.querySelector('#ranking');
      const fields=['streams','gain','change'];
      const rect=r=>{const a=r.getBoundingClientRect();return {x:a.x,right:a.right,width:a.width}};
      return {
        headerVisible:getComputedStyle(head.querySelector('.svt-total-heading')).display!=='none',
        visibleMetrics:fields.every(k=>!!row.querySelector('.rank-metric-'+k)),
        positions:fields.map(k=>rect(row.querySelector('.rank-metric-'+k))),
        heading:rect(head),table:rect(ranking),
        rules:document.querySelectorAll('#svtPrimaryStats .svt-column-rule').length,
        note:document.getElementById('gain').nextElementSibling.textContent,
        followersNote:document.getElementById('followersChange').textContent
      };
    """)
    assert metrics['headerVisible'] and metrics['visibleMetrics'],(section,metrics)
    positions=metrics['positions']
    assert all(positions[i]['x']>positions[i-1]['right']-2 for i in (1,2)),(section,metrics)
    assert positions[-1]['right']<=metrics['table']['right']+2,(section,metrics)
    assert abs(metrics['heading']['width']-metrics['table']['width'])<2,(section,metrics)
    assert metrics['rules']==3,(section,'Expected continuous lines at three metrics',metrics)
    print(section,'Daily Tracks cumulative total, gain and change:',metrics,flush=True)

def check_compact_row_height_and_full_width(driver, section, width):
    dims=driver.execute_script("""
      const area=document.getElementById('svtPrimaryStats');
      const ranking=area.querySelector('#ranking');
      const row=ranking.querySelector('.rank-row');
      const head=area.querySelector('.table-head');
      const parent=ranking.parentElement;
      return {
        rowHeight:row.getBoundingClientRect().height,
        tableWidth:ranking.getBoundingClientRect().width,
        parentWidth:parent.getBoundingClientRect().width,
        headWidth:head.getBoundingClientRect().width
      };
    """)
    limit=65 if width>900 else 58
    if dims['rowHeight']>limit:
        # A tab change can update its CSS class before its asynchronous rows
        # finish repainting. Wait for the actual final layout before failing.
        try:
            WebDriverWait(driver,12).until(lambda d:d.execute_script("""
              const row=document.querySelector('#ranking .rank-row');
              return row&&row.getBoundingClientRect().height<=arguments[0];
            """,limit))
        except Exception:
            debug=driver.execute_script("""
              const row=document.querySelector('#ranking .rank-row');
              const dims=e=>{const r=e.getBoundingClientRect();
                const c=getComputedStyle(e);
                return {height:r.height,width:r.width,gridRow:c.gridRow,
                        gridColumn:c.gridColumn,display:c.display};};
              return {row:dims(row),
                track:dims(row.querySelector(':scope>.track')),
                metrics:[...row.querySelectorAll(':scope>.rank-metric')].map(dims),
                body:document.body.className,
                text:row.textContent.slice(0,180)};
            """)
            raise AssertionError((section,'rows too tall after paint',dims,debug))
        dims['rowHeight']=driver.execute_script(
            "return document.querySelector('#ranking .rank-row').getBoundingClientRect().height")
    assert dims['rowHeight']<=limit,(section,'rows too tall',dims)
    assert abs(dims['tableWidth']-dims['parentWidth'])<=3,(section,'table width changed',dims)
    assert abs(dims['tableWidth']-dims['headWidth'])<=3,(section,'header width changed',dims)
    print(section,'compact row height / original full width:',dims,flush=True)

def check_viewport(driver,width,height):
    driver.set_window_size(width,height)
    driver.get(f'http://127.0.0.1:{PORT}/?view=group')
    WebDriverWait(driver,30).until(lambda d:
        d.execute_script("return document.body.classList.contains('svt-units-solo')===false"))
    read_layout(driver,f'OT13 {width}px')
    check_column_dividers(driver,f'OT13 {width}px')
    check_trend_palette(driver,f'OT13 {width}px')
    check_summary_growth_header_white(driver,f'OT13 {width}px')
    check_compact_row_height_and_full_width(driver,f'OT13 {width}px',width)
    # A song's history must link to its Spotify recording, never its artist.
    track_link=driver.execute_script("""
      const row=[...document.querySelectorAll('#ranking .rank-row')]
        .find(r=>r.querySelector('.track-stream-link[href^="https://open.spotify.com/track/"]'));
      if(!row)return null;
      const expected=row.querySelector('.track-stream-link').href;
      row.querySelector('.rank-metric').click();
      return {expected,
        label:document.getElementById('svtHistoryLinkLabel').textContent,
        actual:document.getElementById('svtHistoryProfileLink').href,
        hidden:document.getElementById('svtHistoryProfile').hidden};
    """)
    assert track_link and not track_link['hidden'],(width,'No Spotify song link',track_link)
    assert track_link['label']=='Track Link:' and track_link['actual']==track_link['expected'],track_link
    WebDriverWait(driver,35).until(lambda d:d.execute_script("""
        return !document.getElementById('svtHistoryCopy').disabled;
    """))
    driver.execute_script("""
        window.__svtTestCopied='';
        Object.defineProperty(navigator,'clipboard',{
            configurable:true,value:{writeText:async text=>{window.__svtTestCopied=text}}
        });
    """)
    click(driver,'#svtHistoryCopy')
    WebDriverWait(driver,10).until(lambda d:
        d.execute_script("return !!window.__svtTestCopied"))
    song_copy=driver.execute_script("return window.__svtTestCopied")
    song_days=[line for line in song_copy.splitlines() if re.match(r'^\d{1,2}/\d{1,2} - ',line)]
    assert song_copy.startswith('"') and ' Streams on Spotify' in song_copy and track_link['expected'] in song_copy,song_copy
    assert 1<=len(song_days)<=7 and '@pledis_17 #SEVENTEEN #세븐틴' in song_copy,song_copy
    print('OT13 Copy for X: song and exact Spotify track URL',len(song_days),flush=True)
    print('OT13 track history uses direct song link:',track_link,flush=True)
    click(driver,'.svt-history-close')
    driver.execute_script("""
      const category=document.querySelector('#rankCategory button[data-type="tracks"]');
      if(category&&!category.classList.contains('active'))category.click();
      const period=document.getElementById('rankPeriod');
      if(period.value!=='daily'){period.value='daily';period.dispatchEvent(new Event('change',{bubbles:true}))}
    """)
    check_daily_tracks_four_columns(driver,f'OT13 {width}px')
    # The history inspector must open on metric click and close without leaving
    # the page covered by an invisible blocking overlay.
    click(driver,'#total')
    WebDriverWait(driver,15).until(lambda d:d.execute_script(
        "return !document.querySelector('.svt-history-dialog')?.hidden"))
    WebDriverWait(driver,30).until(lambda d:d.execute_script("""
        return document.querySelectorAll('#svtHistoryRows tr').length===10 &&
          !!document.querySelector('#svtHistoryRows tr:first-child td:first-child');
    """))
    # Every date uses the same weight. The earliest date must not be
    # arbitrarily emphasized just because it is the first table row.
    first_weight=driver.execute_script("""
        return Number.parseInt(getComputedStyle(document.querySelector(
          '#svtHistoryRows tr:first-child td:first-child')).fontWeight,10);
    """)
    assert first_weight<=500,f'Oldest history date was unexpectedly bold: {first_weight}'
    WebDriverWait(driver,30).until(lambda d:d.execute_script("""
        return !document.getElementById('svtHistoryCopy').disabled;
    """))
    driver.execute_script("""
        window.__svtTestCopied='';
        Object.defineProperty(navigator,'clipboard',{
            configurable:true,value:{writeText:async text=>{window.__svtTestCopied=text}}
        });
    """)
    click(driver,'#svtHistoryCopy')
    WebDriverWait(driver,10).until(lambda d:
        d.execute_script("return !!window.__svtTestCopied"))
    copied=driver.execute_script("return window.__svtTestCopied")
    dated=[line for line in copied.splitlines() if re.match(r'^\d{1,2}/\d{1,2} - ',line)]
    assert 1<=len(dated)<=7,(width,'Copy for X must use up to 7 saved dates',copied)
    assert copied.startswith('#SEVENTEEN Total Streams on Spotify'),copied
    assert '@pledis_17 #SEVENTEEN #세븐틴' in copied,copied
    assert 'https://open.spotify.com/artist/7nqOGRxlXj7N2JYbgNEjYH' in copied,copied
    assert all('—' not in line and '*' not in line for line in dated),copied
    print('OT13 Copy for X: saved days, formatting and profile link',len(dated),flush=True)
    click(driver,'.svt-history-close')
    WebDriverWait(driver,15).until(lambda d:d.execute_script(
        "return document.querySelector('.svt-history-dialog')?.hidden===true"))
    click(driver,'#tabs button[data-tab="solo"]')
    read_layout(driver,f'Units & Solo {width}px')
    check_column_dividers(driver,f'Units & Solo {width}px')
    check_trend_palette(driver,f'Units & Solo {width}px')
    check_summary_growth_header_white(driver,f'Units & Solo {width}px')
    check_compact_row_height_and_full_width(driver,f'Units & Solo {width}px',width)
    driver.execute_script("""
      const category=document.querySelector('#rankCategory button[data-type="tracks"]');
      if(category&&!category.classList.contains('active'))category.click();
      const period=document.getElementById('rankPeriod');
      if(period.value!=='daily'){period.value='daily';period.dispatchEvent(new Event('change',{bubbles:true}))}
    """)
    check_daily_tracks_four_columns(driver,f'Units & Solo {width}px')
    # Regression: a saved count of zero is not a missing song. The main
    # combined total must include all distinct Spotify IDs exactly once.
    latest=json.loads((ROOT/'data/solo.json').read_text(encoding='utf-8'))
    catalogue=json.loads((ROOT/'data/catalog.json').read_text(encoding='utf-8'))
    # Two Picheolin singles have identical cumulative counts on Gilboard.
    # Preserve all 183 raw Spotify IDs in history, but rank and total only
    # 181 unique recordings when the reissued editions match.
    reissues={
        '3Y0ZwgYVHuwbW0JGjsYodR':'5W1bn5PzFgKok4GAZ1JUAw',
        '594CTGIIVVTitwRhQJcWgM':'34wTGQ1yV5XtrSMR5dMLWY'
    }
    assert len(latest['tracks'])==183
    for single,album in reissues.items():
        assert latest['tracks'][single]==latest['tracks'][album], (
            f'Pre-release and album counts diverged for {single}; review before deduplicating')
    expected=sum(value for track,value in latest['tracks'].items()
                 if track not in reissues)
    WebDriverWait(driver,30).until(lambda d:
        d.find_element(By.ID,'total').text.strip()==f'{expected:,}')
    print('Verified all solo/unit streams:', f'{expected:,}',flush=True)
    # Artist history captions use Korean names and real Spotify profile IDs.
    # Check both audience and total-stream cards at desktop and mobile sizes.
    click(driver,'#artistProfiles [data-solo-artist="Joshua"]')
    for card, expected_title in [
        ('#listeners',"Joshua's Monthly Listeners on Spotify"),
        ('#total',"Joshua's Total Streams on Spotify")
    ]:
        click(driver,card)
        WebDriverWait(driver,30).until(lambda d:d.execute_script("""
            const popup=document.querySelector('.svt-history-dialog');
            return popup&&!popup.hidden&&
                document.getElementById('svtHistoryNote').textContent.startsWith('Last ');
        """))
        actual=driver.execute_script("""
            return {
                title:document.getElementById('svtHistoryTitle').textContent,
                note:document.getElementById('svtHistoryNote').textContent,
                label:document.getElementById('svtHistoryProfile').textContent,
                hidden:document.getElementById('svtHistoryProfile').hidden,
                url:document.getElementById('svtHistoryProfileLink').href
            };
        """)
        assert actual['title']==expected_title,(width,card,actual)
        assert '· 조슈아.' in actual['note'] and '· Joshua.' not in actual['note'],actual
        assert not actual['hidden'] and 'Profile Link:' in actual['label'],actual
        assert actual['url']=='https://open.spotify.com/artist/74AwWFYdjQ3ER5vHO4H7b0',actual
        print('Joshua Spotify history title / Korean name / profile:',actual,flush=True)
        click(driver,'.svt-history-close')
    click(driver,'#allSoloArtists')

    # Test zero-count profiles and units with a separately grouped album.
    artist_releases=catalogue['solo']
    for owner in ('Hoshi','Seungkwan','JxJ','V8','Picheolin'):
        releases=[release for release in artist_releases
                  if release.get('artist','').lower()==owner.lower()]
        ids={track for release in releases for track in release['tracks']}
        if owner=='JxJ':
            ids={track for release in artist_releases if release['key']=='sharedTracks'
                 for track in release['tracks']}
        assert ids, f'{owner} has no mapped recordings'
        count=sum(latest['tracks'][track] for track in ids if track not in reissues)
        click(driver,f'#artistProfiles [data-solo-artist="{owner}"]')
        WebDriverWait(driver,30).until(lambda d:
            d.find_element(By.ID,'total').text.strip()==f'{count:,}')
        print(owner,'verified solo/unit streams:',f'{count:,}',flush=True)
        if owner=='JxJ':
            click(driver,'#total')
            WebDriverWait(driver,20).until(lambda d:
                not d.execute_script("return document.querySelector('.svt-history-dialog')?.hidden"))
            assert driver.execute_script("""
                return document.getElementById('svtHistoryProfile').hidden &&
                    !document.getElementById('svtHistoryProfileLink').hasAttribute('href');
            """),'A unit without a Spotify artist account must not get a false profile link'
            click(driver,'.svt-history-close')
            # Shared Jeonghan/Joshua recordings must be credited to JxJ,
            # with individual member tags ordered oldest-to-youngest.
            driver.execute_script("""
                const search=document.getElementById('search');
                search.value="12 o'clock";search.dispatchEvent(new Event('input',{bubbles:true}));
            """)
            WebDriverWait(driver,25).until(lambda d:d.execute_script("""
                return !!document.querySelector(
                  '#ranking .rank-row[data-history-id="1dp1GI9YcKDoxrKBpp0u9F"] .rank-metric');
            """))
            driver.execute_script("""
                document.querySelector(
                 '#ranking .rank-row[data-history-id="1dp1GI9YcKDoxrKBpp0u9F"] .rank-metric').click();
            """)
            WebDriverWait(driver,30).until(lambda d:d.execute_script("""
                return !document.getElementById('svtHistoryCopy').disabled;
            """))
            driver.execute_script("window.__svtTestCopied='';")
            click(driver,'#svtHistoryCopy')
            WebDriverWait(driver,12).until(lambda d:
                d.execute_script("return !!window.__svtTestCopied"))
            unit_post=driver.execute_script("return window.__svtTestCopied")
            unit_days=[line for line in unit_post.splitlines() if re.match(
                r'^\d{1,2}/\d{1,2} - ',line)]
            assert unit_post.startswith("JxJ's \"12 o'clock\" Streams on Spotify"),unit_post
            assert '@pledis_17 #SEVENTEEN #JEONGHAN #JOSHUA' in unit_post,unit_post
            assert 'https://open.spotify.com/track/1dp1GI9YcKDoxrKBpp0u9F' in unit_post,unit_post
            assert 1<=len(unit_days)<=7,unit_post
            print('JxJ Copy for X: age-order member hashtags, song URL,',len(unit_days),'days',flush=True)
            click(driver,'.svt-history-close')
            driver.execute_script("""
                const search=document.getElementById('search');
                search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
            """)

    # Gilboard consists of six credited Picheolin recordings; its July
    # prerelease singles must not create two more distinct recordings.
    click(driver,'#artistProfiles [data-solo-artist="Picheolin"]')
    # Derive current values from the snapshot instead of hardcoding a daily
    # stream count that becomes stale whenever the collector works.
    WebDriverWait(driver,30).until(lambda d:
        d.find_element(By.ID,'total').text.strip()==f'{count:,}'
        and d.find_element(By.ID,'periodComparisonValue').text.strip()=='6')
    print('Picheolin canonical profile: 6 tracks,',f'{count:,}',flush=True)
    # The stream history inspector must use the same canonical total.
    click(driver,'#total')
    WebDriverWait(driver,30).until(lambda d:
        not d.execute_script("return document.querySelector('.svt-history-dialog')?.hidden"))
    # The inspector fetches historical snapshots after opening the dialog;
    # wait for its asynchronous rows instead of racing the network.
    WebDriverWait(driver,30).until(lambda d:d.execute_script("""
      const rows=[...document.querySelectorAll('#svtHistoryRows tr')];
      return rows.length>0 && rows.some(x=>/\\d/.test(x.textContent||''));
    """))
    inspected=driver.execute_script("""
      return [...document.querySelectorAll('#svtHistoryRows tr')].map(x=>x.textContent);
    """)
    assert inspected, 'Picheolin historical total not loaded'
    click(driver,'.svt-history-close')
    click(driver,'#allSoloArtists')
    WebDriverWait(driver,30).until(lambda d:
        d.find_element(By.ID,'total').text.strip()==f'{expected:,}')

    # The 2026-11-05 workbook wrote Jun's track "9" as "9.0".
    # Both dates have saved counts: don't silently omit it from daily growth.
    history_check=driver.execute_async_script("""
      const done=arguments[arguments.length-1];
      Promise.all([getDate('solo','2026-11-06'),getDate('solo','2026-11-05')])
       .then(([now,previous])=>{
        const ids=soloLegacyTrackIds(now,null);
        const gains=ids.map(id=>safeGain(now,previous,id));
        const jun=ids.find(id=>now.names[id]==='9');
        done({total:ids.length,matched:gains.filter(v=>v!=null).length,
          gain:gains.filter(v=>v!=null).reduce((a,b)=>a+b,0),
          junGain:jun?safeGain(now,previous,jun):null});
       }).catch(e=>done({error:String(e)}));
    """)
    print('Verified historical solo gains:',history_check,flush=True)
    assert history_check=={'total':181,'matched':181,'gain':981931,'junGain':12925}, history_check

    # The desktop smoke test may leave Discography selected for the mobile pass.
    # Explicitly select Tracks before checking the ranked list.
    click(driver,'#rankCategory button[data-type="tracks"]')
    # Daily tracks must rank by daily gain, not by cumulative streams.
    driver.execute_script("""
      const order=document.getElementById('order');
      order.value='most';order.dispatchEvent(new Event('change',{bubbles:true}));
      const period=document.getElementById('rankPeriod');
      period.value='daily';period.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    WebDriverWait(driver,40).until(lambda d:
        len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))==181
        and d.execute_script("return document.body.classList.contains('svt-solo-period-only')"))
    def metric_snapshot():
        return driver.execute_script("""
          const rows=[...document.querySelectorAll('#ranking .rank-row')];
          const parse=r=>{const v=r.querySelector('.rank-metric-gain .metric-value')?.textContent||'';
            return v.includes('—')?null:Number(v.replace(/[+,*\\s]/g,''));};
          return {rows:rows.length,ids:[...new Set(rows.map(r=>r.dataset.historyId))].length,
            totals:rows.filter(r=>r.querySelector('.rank-metric-streams')).length,
            gains:rows.map(parse),
            changes:rows.filter(r=>r.querySelector('.rank-metric-change')).length,
            hiddenHeader:getComputedStyle(document.querySelector('.svt-total-heading')).display==='none'};
        """)
    daily_tracks=metric_snapshot()
    assert daily_tracks['rows']==daily_tracks['ids']==181, daily_tracks
    assert daily_tracks['totals']==181 and daily_tracks['changes']==181, daily_tracks
    assert not daily_tracks['hiddenHeader'],daily_tracks
    gains=[g for g in daily_tracks['gains'] if g is not None]
    assert gains==sorted(gains,reverse=True), f'Daily solo tracks not ranked by gain: {gains[:12]}'
    print('Daily solo tracks: 181 unique recordings, sorted by verified gain',flush=True)

    click(driver,'#rankCategory button[data-type="albums"]')
    WebDriverWait(driver,40).until(lambda d:
        len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))==11)
    daily_albums=metric_snapshot()
    assert daily_albums['totals']==0 and daily_albums['changes']==11,daily_albums
    album_gains=[g for g in daily_albums['gains'] if g is not None]
    assert album_gains==sorted(album_gains,reverse=True),f'Daily albums not ranked by gain: {album_gains}'
    print('Daily solo albums sorted by daily gain',flush=True)
    # The daily tab sorts by daily gain; verify Most/Least STREAMED
    # using the cumulative Overall tab rather than confusing the two.
    driver.execute_script("""
      const el=document.getElementById('rankPeriod');
      el.value='overall';el.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    WebDriverWait(driver,40).until(lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>=10)
    entries=driver.find_elements(By.CSS_SELECTOR,'#ranking .rank-row')
    titles=[x.find_element(By.CSS_SELECTOR,'.track-name').text for x in entries]
    print('Album names:',titles,flush=True)
    expected=['DREAMSCAPE','V8','THIS MAN','9','BEAM','SECOND WIND','TELEPARTY','HYPE VIBES','STARDUST','Gilboard','Serenade']
    assert len(entries)==11, f"Album view needs exactly 11 official releases, got {len(entries)}"
    for name in expected:
        assert any(name.lower() in title.lower() for title in titles),f"Missing album {name}"
    # Album history has a real album URL where one is saved. Other albums
    # must link to a verified song from that release, not a false album URL.
    for name,label,prefix in [('V8','Album Link:','https://open.spotify.com/album/5HQrHtpGthJMePFhXT3jKS'),
                               ('DREAMSCAPE','Track Link:','https://open.spotify.com/track/')]:
        result=driver.execute_script("""
          const [album]=arguments;
          const row=[...document.querySelectorAll('#ranking .rank-row')]
            .find(r=>(r.querySelector('.track-name')?.textContent||'').includes(album));
          if(!row)return null;
          row.querySelector('.rank-metric').click();
          const area=document.getElementById('svtHistoryProfile');
          return {hidden:area.hidden,
                  label:document.getElementById('svtHistoryLinkLabel').textContent,
                  url:document.getElementById('svtHistoryProfileLink').href};
        """,name)
        assert result and not result['hidden'] and result['label']==label,(width,name,result)
        assert result['url'].startswith(prefix),(width,name,result)
        print(name,'album history correctly linked:',result,flush=True)
        click(driver,'.svt-history-close')
    # The album type and full dated title must be visible on every album.
    undated=[row.find_element(By.CSS_SELECTOR,'.track-copy').text for row in entries
            if 'Released ' not in row.find_element(By.CSS_SELECTOR,'.track-copy').text]
    assert not undated, f"Official albums without release dates: {undated}"
    # The Most/Least streamed options must sort FULL album totals,
    # not remain in the source catalog's fixed release sequence.
    # Album stream leaders change as real Spotify snapshots update.
    # Check that the UI is sorted by displayed cumulative totals rather than
    # assuming a particular release must permanently lead the chart.
    totals=driver.execute_script("""
      return [...document.querySelectorAll('#ranking .rank-row')].map(row=>{
        const value=row.querySelector('.rank-metric-streams .metric-value')?.textContent||'';
        return Number(value.replace(/[^0-9]/g,''))||0;
      });
    """)
    assert totals==sorted(totals,reverse=True), f'Album totals not sorted from highest: {totals}'
    driver.execute_script("""
      const el=document.getElementById('order');
      el.value='least';el.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    WebDriverWait(driver,20).until(lambda d:
        '9' in d.find_element(By.CSS_SELECTOR,'#ranking .rank-row .track-name').text)
    smallest=[x.text for x in driver.find_elements(By.CSS_SELECTOR,'#ranking .track-name')]
    print('Album least-streamed order:',smallest,flush=True)
    least_totals=driver.execute_script("""
      return [...document.querySelectorAll('#ranking .rank-row')].map(row=>{
        const value=row.querySelector('.rank-metric-streams .metric-value')?.textContent||'';
        return Number(value.replace(/[^0-9]/g,''))||0;
      });
    """)
    assert least_totals==sorted(least_totals),f"Album totals not sorted from lowest: {least_totals}"
    driver.execute_script("""
      const el=document.getElementById('order');
      el.value='most';el.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    read_layout(driver,f'Units & Solo albums {width}px')
    # Check both original single and full album artwork with no diamond fallback.
    click(driver,'#rankCategory button[data-type="tracks"]')
    WebDriverWait(driver,40).until(lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>150)
    assert len(driver.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))==181, 'Combined Tracks view duplicates a reissued song'
    # Every unit/solo song in the combined Tracks view must be linked to
    # its exact Spotify recording, not the first similarly named group song.
    missing_links=driver.execute_script("""
      return [...document.querySelectorAll('#ranking .rank-row')]
       .filter(row=>!row.querySelector('a.track-name[href^="https://open.spotify.com/track/"]'))
       .map(row=>row.querySelector('.track-name')?.textContent?.trim()||'unknown');
    """)
    assert not missing_links, f"Tracks without their exact Spotify links: {missing_links[:12]}"
    # Off-screen image elements can remain unpainted with native lazy loading,
    # so load only visible images and assert every local URL is assigned.
    images=driver.find_elements(By.CSS_SELECTOR,'#ranking .rank-row img.cover')
    missing_sources=driver.execute_script("""
      return [...document.querySelectorAll('#ranking img.cover')]
       .filter(img=>img.dataset.coverTrack?.startsWith('image:')&&!img.getAttribute('src'))
       .map(img=>img.dataset.coverTrack);
    """)
    assert not missing_sources, f"Saved cover missing src: {missing_sources[:5]}"
    for img in images[:8]:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});",img)
        WebDriverWait(driver,15).until(
            lambda d: d.execute_script("return arguments[0].complete&&arguments[0].naturalWidth>1",img))
    print(f"Verified all {len(images)} local cover URLs and first 8 loaded images",flush=True)
    # The November 6 workbook repeats each complete unit album in the
    # two member sections. Both member SUBTOTALS must remain immediately
    # after their own tracks; the Albums tab still displays only one album.
    click(driver,'#rankCategory button[data-type="discography"]')
    # This check targets the actual Nov 6 workbook credit breakdown. The
    # latest live snapshots use canonical track IDs instead of workbook totals.
    driver.execute_script("""
      const picker=document.getElementById('archiveDate');
      picker.value='2026-11-06';
      picker.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    WebDriverWait(driver,35).until(lambda d:
        '2026-11-06' in d.find_element(By.ID,'dateNotice').text)
    WebDriverWait(driver,40).until(
       lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .album-total-row'))>=90)
    sections=driver.execute_script("""
      return [...document.querySelectorAll('#ranking .album-total-row')].map(row=>({
        title:row.querySelector('.track-name')?.textContent||'',
        dated:!!row.querySelector('.release-date'),
        total:row.querySelector('.rank-metric-streams .metric-value')?.textContent||''
      }));
    """)
    for key in ('Jeonghan 6-Track Total','Joshua 6-Track Total',
                '1st Mini Album - DREAMSCAPE','The8 7-Track Total',
                'Vernon 7-Track Total','1st Mini Album - V8'):
        assert any(key in row['title'] for row in sections),f'Missing album section subtotal: {key}'
    assert not any('Full 7-Track Album Total' in row['title'] or
                   'Full 8-Track Album Total' in row['title'] for row in sections), (
        'Complete unit album titles must not have redundant track-total suffixes')
    missing_dates=[row['title'] for row in sections if not row['dated']]
    print(f'Discography: {len(sections)} release-total rows, missing dates:',missing_dates,flush=True)
    assert not missing_dates,f'Undated solo release totals: {missing_dates[:20]}'

    if width>=1000:
        for snapshot_date in ('2025-11-16','2026-01-12','2026-07-14'):
            driver.execute_script("""
              const picker=document.getElementById('archiveDate');
              picker.value=arguments[0];picker.dispatchEvent(new Event('change',{bubbles:true}));
            """,snapshot_date)
            WebDriverWait(driver,35).until(lambda d:
                snapshot_date in d.find_element(By.ID,'dateNotice').text)
            WebDriverWait(driver,35).until(lambda d:
                len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>=70)
            time.sleep(2.5)
            audit=driver.execute_script("""
              const rows=[...document.querySelectorAll('#ranking .rank-row')];
              const missing=rows.filter(row=>!row.querySelector('.release-date'))
               .map(row=>row.querySelector('.track-name')?.textContent||'unknown');
              const late=rows.filter(row=>{
               const text=row.querySelector('.release-date')?.textContent||'';
               const date=text.replace(/^Released\\s*/, '').trim();
               const ms=Date.parse(date);
               return Number.isFinite(ms)&&ms>Date.parse(arguments[0]+'T23:59:59Z');
              }).map(row=>row.querySelector('.track-name')?.textContent||'unknown');
              const totals=rows.filter(row=>row.classList.contains('album-total-row'));
              return {n:rows.length,totals:totals.length,missing,late,
                spider:totals.filter(row=>/spider/i.test(row.querySelector('.track-name')?.textContent||''))
                  .map(row=>row.querySelector('.track-copy')?.textContent||'')};
            """,snapshot_date)
            print('Historic release-date audit:',snapshot_date,audit,flush=True)
            assert audit['n']>=70, f'{snapshot_date}: rows missing'
            assert not audit['missing'],f'{snapshot_date}: undated releases {audit["missing"][:20]}'
            assert not audit['late'],f'{snapshot_date}: displayed a future/unreleased song {audit["late"][:20]}'
            if snapshot_date=='2025-11-16':
                assert any('Apr 2, 2021' in title for title in audit['spider']), (
                    'Spider must retain its original April 2, 2021 date, not SHINGIRU date')
        # Restore the most recent snapshot before the mobile run. The July
        # 2026 archive correctly contains fewer than 11 albums at that date.
        click(driver,'#latestDate')
        WebDriverWait(driver,35).until(lambda d:
            'Latest confirmed snapshot' in d.find_element(By.ID,'dateNotice').text)
    else:
        click(driver,'#latestDate')
        WebDriverWait(driver,35).until(lambda d:
            'Latest confirmed snapshot' in d.find_element(By.ID,'dateNotice').text)


def main():
    socketserver.TCPServer.allow_reuse_address=True
    handler=lambda *args,**kwargs:http.server.SimpleHTTPRequestHandler(*args,directory=str(ROOT),**kwargs)
    with Server(('127.0.0.1',PORT),handler) as server:
        thread=threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        opts=Options()
        for arg in ('--headless=new','--no-sandbox','--disable-dev-shm-usage','--window-size=1300,900'):
            opts.add_argument(arg)
        driver=webdriver.Chrome(options=opts)
        try:
            check_viewport(driver,1300,900)
            check_viewport(driver,390,850)
            # All is an in-page tab with the original header, OG image resolvers
            # and canonical album sleeves, not a second dark-themed website.
            for width in (1300,390):
                driver.set_window_size(width,850)
                driver.get(f'http://127.0.0.1:{PORT}/index.html?view=all')
                WebDriverWait(driver,60).until(lambda d:
                    d.execute_script("return document.body.classList.contains('svt-all-view')") and
                    len(d.find_elements(By.CSS_SELECTOR,'#all-artists tr'))>=15)
                assert not driver.find_element(By.ID,'svtAllView').get_attribute('hidden')
                assert driver.find_element(By.ID,'svtPrimaryStats').get_attribute('hidden') is not None
                assert driver.find_element(By.CSS_SELECTOR,'#tabs [data-tab="all"]').get_attribute('class').find('active')>=0
                assert len(driver.find_elements(By.CSS_SELECTOR,'main .hero h1'))==1,'All lost the original site hero'
                assert driver.execute_script("""
                    const nav=document.getElementById('tabs');
                    const items=[...nav.querySelectorAll('button[data-tab]')];
                    const rects=items.map(el=>el.getBoundingClientRect());
                    return items.length===3 &&
                      Math.max(...rects.map(r=>r.top))-Math.min(...rects.map(r=>r.top))<2 &&
                      rects.every(r=>r.right<=nav.getBoundingClientRect().right+2) &&
                      items.every(el=>el.scrollWidth<=el.clientWidth+3);
                """),f'OT13, Units & Solo and All did not fit in one row at {width}px'

                assert len(driver.find_elements(By.CSS_SELECTOR,'#all-rankCategory [data-all-rank]'))==6,                    'All should offer six distinct ranking choices'
                assert driver.find_element(By.CSS_SELECTOR,'#all-rankCategory [data-all-rank="tracks"]').get_attribute('class').find('active')>=0
                # The combined period selector must behave like the primary
                # OT13/solo dropdown, with an actual visible chevron.
                assert driver.execute_script("""
                    const el=document.getElementById('all-period');
                    const style=getComputedStyle(el);
                    const choices=[...el.options].map(o=>o.value);
                    return !el.disabled && el.getBoundingClientRect().width>=100 &&
                      style.backgroundImage.includes('svg') &&
                      ['overall','daily','weekly','monthly','yearly'].every(x=>choices.includes(x));
                """),'All period dropdown arrow, clickability or time-period options missing'
                # Overall keeps cumulative track ranking while the growth
                # summary always shows the latest verified one-day difference.
                driver.execute_script("""
                    const period=document.getElementById('all-period');
                    period.value='overall';period.dispatchEvent(new Event('change',{bubbles:true}));
                """)
                WebDriverWait(driver,40).until(lambda d:
                    d.find_element(By.ID,'all-summaryTracks').text.strip() not in ('','—') and
                    d.find_element(By.ID,'all-summaryStreams').text.strip() not in ('','—'))
                assert len(driver.find_elements(By.CSS_SELECTOR,'#svtAllView .svt-all-stats > .stat'))==4
                assert driver.execute_script("""
                    const grid=getComputedStyle(document.querySelector('#svtAllView .svt-all-stats'));
                    return grid.gridTemplateColumns.split(' ').length===2 &&
                      getComputedStyle(document.getElementById('all-summaryStreams')).textAlign==='left';
                """),'All summary must be a 2x2 grid with left-aligned total streams'
                current_group=json.loads((ROOT/'data/group.json').read_text(encoding='utf-8'))
                current_solo=json.loads((ROOT/'data/solo.json').read_text(encoding='utf-8'))
                if current_group['date']=='2026-11-08' and current_solo['date']=='2026-11-08':
                    observed=driver.execute_script("""
                       return [document.getElementById('all-summaryStreams').textContent,
                          document.getElementById('all-summaryGrowth').textContent,
                          document.getElementById('all-summaryTracks').textContent,
                          document.getElementById('all-summaryDate').textContent]
                    """)
                    assert observed[0]=='10,315,463,577',f'Combined total double-counted source recordings: {observed}'
                    assert observed[1]=='+2,493,721',f'Overall must show latest verified daily stream growth: {observed}'
                    assert driver.execute_script("""
                        return document.getElementById('all-summaryGrowthHeading').textContent==='DAILY STREAM GROWTH' &&
                          document.getElementById('all-summaryGrowthNote').textContent.includes('Nov 7, 2026');
                    """),'Overall daily growth label/period did not match saved archive'
                    driver.execute_script("""
                        const period=document.getElementById('all-period');
                        period.value='daily';period.dispatchEvent(new Event('change',{bubbles:true}));
                    """)
                    WebDriverWait(driver,30).until(lambda d:
                        d.find_element(By.ID,'all-summaryGrowth').text.strip()=='+2,493,721')
                    driver.execute_script("""
                        const period=document.getElementById('all-period');
                        period.value='overall';period.dispatchEvent(new Event('change',{bubbles:true}));
                    """)
                    assert observed[2]=='406',f'Expected 406 canonical recordings, not {observed}'
                    assert 'Nov 8, 2026' in observed[3],f'Combined date missing: {observed}'
                    print('Verified combined total 10,315,463,577 · daily +2,493,721 · 406 tracks',flush=True)
                    # All must fully bridge the November 6 legacy workbook
                    # to November 7's Spotify-ID snapshots for ALL 406 canonical
                    # recordings: group 227 + solo 183, net of mirrored editions.
                    # Avoid firing two asynchronous snapshot changes together:
                    # first settle the selected historical date, then period.
                    driver.execute_script("""
                        const picker=document.getElementById('all-archiveDate');
                        picker.value='2026-11-07';
                        picker.dispatchEvent(new Event('change',{bubbles:true}));
                    """)
                    try:
                        WebDriverWait(driver,25).until(lambda d:
                            d.execute_script("return document.getElementById('all-summaryDate')?.textContent?.includes('Nov 7, 2026')"))
                    except Exception:
                        print('Archive date loading diagnosis:',driver.execute_script("""
                            return {summary:document.getElementById('all-summaryDate')?.textContent,
                             selected:document.getElementById('all-archiveDate')?.value,
                             period:document.getElementById('all-period')?.value,
                             coverage:document.getElementById('all-coverage')?.textContent,
                             state:(()=>{const x=window.svtAllAudit?.();return x?{date:x.date,period:x.period,tracks:x.tracks,verified:x.verified,missing:x.missing?.slice(0,8)}:null})(),
                             url:location.href};
                        """),flush=True)
                        raise
                    driver.execute_script("""
                        const period=document.getElementById('all-period');
                        period.value='daily';period.dispatchEvent(new Event('change',{bubbles:true}));
                    """)
                    try:
                        WebDriverWait(driver,30).until(lambda d:
                            d.find_element(By.ID,'all-summaryGrowth').text.strip() not in ('','—')
                            and '*' not in d.find_element(By.ID,'all-summaryGrowth').text)
                    except Exception:
                        print('All date/period diagnostics:',driver.execute_script("""
                            return {date:document.getElementById('all-summaryDate')?.textContent,
                              streams:document.getElementById('all-summaryStreams')?.textContent,
                              growth:document.getElementById('all-summaryGrowth')?.textContent,
                              note:document.getElementById('all-summaryGrowthNote')?.textContent,
                              coverage:document.getElementById('all-summaryCoverage')?.textContent,
                              period:document.getElementById('all-period')?.value};
                        """),flush=True)
                        raise
                    click(driver,'#all-rankCategory [data-all-rank="streams"]')
                    assert driver.execute_script("""
                        const names=new Set(['SEVENTEEN','JxJ','Joshua','Jeonghan','V8']);
                        const rows=[...document.querySelectorAll('#all-artists tr')]
                          .filter(r=>names.has(r.querySelector('.svt-all-song')?.textContent?.trim()));
                        return rows.length===5&&rows.every(r=>
                          !r.textContent.includes('Verified subset') &&
                          !r.querySelectorAll('td')[1].textContent.includes('*'));
                    """), 'All daily artist gains still have missing canonical recordings'
                    for metric in ('weekly','monthly'):
                        driver.execute_script("""
                            const period=document.getElementById('all-period');
                            period.value=arguments[0];
                            period.dispatchEvent(new Event('change',{bubbles:true}));
                        """,metric)
                        try:
                            WebDriverWait(driver,40).until(lambda d:
                                d.find_element(By.ID,'all-summaryGrowthHeading').text.upper().startswith(metric.upper())
                                and d.find_element(By.ID,'all-summaryGrowth').text.strip() not in ('','—')
                                and '*' not in d.find_element(By.ID,'all-summaryGrowth').text)
                        except Exception:
                            print(metric+' All history integrity details:',driver.execute_script("""
                              const a=window.svtAllAudit?.();
                              return {date:a?.date,soloDate:a?.soloDate,period:a?.period,
                                allTracks:a?.tracks,verified:a?.verified,
                                missing:a?.missing?.slice(0,25),
                                heading:document.getElementById('all-summaryGrowthHeading')?.textContent,
                                growth:document.getElementById('all-summaryGrowth')?.textContent,
                                growthNote:document.getElementById('all-summaryGrowthNote')?.textContent,
                                coverage:document.getElementById('all-coverage')?.textContent};
                            """),flush=True)
                            raise
                    driver.execute_script("""
                        const picker=document.getElementById('all-archiveDate');
                        picker.value='2026-11-08';
                        picker.dispatchEvent(new Event('change',{bubbles:true}));
                    """)
                    WebDriverWait(driver,30).until(lambda d:d.execute_script("""
                        return document.getElementById('all-summaryDate')?.textContent?.includes('Nov 8, 2026') &&
                          document.getElementById('all-summaryStreams')?.textContent?.trim()==='10,315,463,577';
                    """))
                    driver.execute_script("""
                        const period=document.getElementById('all-period');
                        period.value='overall';period.dispatchEvent(new Event('change',{bubbles:true}));
                    """)
                    WebDriverWait(driver,30).until(lambda d:d.execute_script("""
                        return document.getElementById('all-period')?.value==='overall' &&
                          document.getElementById('all-summaryStreams')?.textContent?.trim()==='10,315,463,577';
                    """))

                # Full history inspector: prove the last 10 saved daily rows,
                # 10 weekly periods and 12 calendar months render as actual
                # numbers or explicit absence, not empty/stuck loading states.
                if width>=1200:
                    for mode,expected in (('daily',10),('weekly',10),('monthly',12)):
                        driver.execute_script("""
                            const p=document.getElementById('all-period');
                            p.value=arguments[0];
                            p.dispatchEvent(new Event('change',{bubbles:true}));
                        """,mode)
                        WebDriverWait(driver,30).until(lambda d:d.execute_script("""
                            return document.getElementById('all-period')?.value===arguments[0] &&
                              document.getElementById('all-summaryGrowthHeading')?.textContent
                                .toLowerCase().startsWith(arguments[0]);
                        """,mode))
                        driver.execute_script("document.getElementById('all-summaryStreams').closest('.stat').click()")
                        WebDriverWait(driver,65).until(lambda d:d.execute_script("""
                            const dialog=document.getElementById('svt-all-history-dialog');
                            const rows=[...document.querySelectorAll('#all-history-body tr')];
                            return dialog?.open && rows.length===arguments[0] &&
                              rows.every(row=>!row.textContent.includes('Loading saved history'));
                        """,expected))
                        records=driver.execute_script("""
                            return [...document.querySelectorAll('#all-history-body tr')].map(
                              row=>[...row.querySelectorAll('td')].map(cell=>cell.textContent.trim()));
                        """)
                        if mode=='monthly':
                            # November is a partial month. Never show a
                            # comparison with all of October as its "Change".
                            november=next((row for row in records if row[0]=='Nov 2026'),None)
                            assert november and '*' in november[1],(
                                'November month-to-date total must be marked partial',records)
                            assert november[3]!='—',(
                                'November month-to-date change should use Oct 1–8',records)
                        assert len(records)==expected,(mode,len(records),records)
                        assert all(len(record)==4 for record in records),(mode,records)
                        # Independently verify the popup arithmetic across
                        # consecutive complete saved totals. Missing and partial
                        # observations must never be promoted to full gains.
                        def exact(cell):
                            if not cell or cell=='—' or '*' in cell or cell=='Not recorded':
                                return None
                            try:
                                return int(cell.replace(',','').replace('−','-').replace('+',''))
                            except ValueError:
                                return None
                        checked_gains=checked_changes=0
                        for position in range(1,len(records)):
                            yesterday,today=records[position-1],records[position]
                            previous_total,actual_total=exact(yesterday[1]),exact(today[1])
                            current_gain=exact(today[2])
                            if previous_total is not None and actual_total is not None and current_gain is not None:
                                assert current_gain==actual_total-previous_total,(
                                  'Saved totals disagree with period gain',mode,today,yesterday)
                                checked_gains+=1
                            if position>1:
                                prior_gain,change=exact(yesterday[2]),exact(today[3])
                                if prior_gain is not None and current_gain is not None and change is not None:
                                    assert change==current_gain-prior_gain,(
                                      'Change in increase disagrees with saved period gains',mode,today,yesterday)
                                    checked_changes+=1
                        if mode=='monthly':
                            diagnostics=driver.execute_async_script("""
                              const done=arguments[arguments.length-1];
                              const dates=['2025-12-31','2026-01-16','2026-02-28','2026-03-31',
                                '2026-04-30','2026-05-31','2026-06-30','2026-07-31',
                                '2026-08-31','2026-09-30','2026-10-31','2026-11-08'];
                              Promise.all(dates.map(d=>window.svtAllHistoryAudit(d)))
                                .then(all=>done(all.map(r=>({date:r.date,matched:r.matched,eligible:r.eligible,
                                  missing:r.missing.slice(0,20)}))))
                                .catch(e=>done([{error:String(e)}]));
                            """)
                            print('Full-year All recording coverage:',diagnostics,flush=True)
                        assert checked_gains>=3,(mode,'Too few fully comparable gains',checked_gains,records)
                        assert checked_changes>=2,(mode,'Too few verified gain changes',checked_changes,records)
                        print('Verified historical arithmetic',mode,checked_gains,'gains and',checked_changes,'changes',flush=True)
                        valid=sum(any(character.isdigit() for character in record[1])
                                  for record in records)
                        if mode in ('daily','weekly'):
                            assert valid>=9,(mode,valid,records)
                        else:
                            assert valid>=8,(mode,valid,records)
                            assert any('Dec 2025' in record[0] for record in records),records
                        print('All history verified:',mode,expected,'rows,',
                              valid,'with saved totals',flush=True)
                        if mode=='daily':
                            WebDriverWait(driver,40).until(lambda d:d.execute_script("""
                                return !document.getElementById('all-history-copy').disabled;
                            """))
                            driver.execute_script("""
                                window.__svtAllCopied='';
                                Object.defineProperty(navigator,'clipboard',{
                                    configurable:true,value:{writeText:async text=>{
                                        window.__svtAllCopied=text;
                                    }}
                                });
                            """)
                            click(driver,'#all-history-copy')
                            WebDriverWait(driver,12).until(lambda d:
                                d.execute_script("return !!window.__svtAllCopied"))
                            post=driver.execute_script("return window.__svtAllCopied")
                            days=[line for line in post.splitlines()
                                  if re.match(r'^\d{1,2}/\d{1,2} - ',line)]
                            assert post.startswith('#SEVENTEEN Spotify Streams') and 1<=len(days)<=7,post
                            assert '@pledis_17 #SEVENTEEN #세븐틴' in post,post
                            print('All Copy for X: seven or fewer verified days',len(days),flush=True)
                        driver.execute_script("""
                            document.querySelector('#svt-all-history-dialog .all-history-close').click()
                        """)
                        WebDriverWait(driver,15).until(lambda d:d.execute_script("""
                            return !document.getElementById('svt-all-history-dialog')?.open;
                        """))
                    # The visible All track ranking must actually render
                    # Total, Increase, and Change as three separate numeric
                    # columns in daily, weekly and monthly modes.
                    click(driver,'#all-rankCategory [data-all-rank="tracks"]')
                    for ranking_period in ('daily','weekly','monthly'):
                        driver.execute_script("""
                            const p=document.getElementById('all-period');
                            p.value=arguments[0];p.dispatchEvent(new Event('change',{bubbles:true}));
                        """,ranking_period)
                        WebDriverWait(driver,35).until(lambda d:d.execute_script("""
                            const rows=[...document.querySelectorAll('#all-recordings tr')]
                              .filter(row=>row.querySelectorAll('td').length===4);
                            return document.getElementById('all-gainTitle')?.textContent?.includes(arguments[0].toUpperCase()) &&
                                   !document.getElementById('all-gainTitle')?.hidden &&
                                   !document.getElementById('all-changeTitle')?.hidden &&
                                   rows.length>=25;
                        """,ranking_period))
                        table_counts=driver.execute_script("""
                            const rows=[...document.querySelectorAll('#all-recordings tr')]
                              .filter(row=>row.querySelectorAll('td').length===4);
                            const numeric=td=>td&&/[0-9]/.test(td.textContent)&&!td.textContent.includes('—');
                            return {
                                rows:rows.length,
                                total:rows.filter(r=>numeric(r.querySelectorAll('td')[1])).length,
                                gain:rows.filter(r=>numeric(r.querySelectorAll('td')[2])).length,
                                change:rows.filter(r=>numeric(r.querySelectorAll('td')[3])).length
                            };
                        """)
                        assert table_counts['total']>=25,(ranking_period,table_counts)
                        assert table_counts['gain']>=20,(ranking_period,table_counts)
                        assert table_counts['change']>=10,(ranking_period,table_counts)
                        print('All visible',ranking_period,'totals/gains/changes:',table_counts,flush=True)
                    click(driver,'#all-rankCategory [data-all-rank="streams"]')
                    driver.execute_script("""
                        const p=document.getElementById('all-period');
                        p.value='overall';p.dispatchEvent(new Event('change',{bubbles:true}));
                    """)

                assert driver.execute_script("""
                    const card=getComputedStyle(document.querySelector('#all-summaryStreams').closest('.stat'));
                    return card.backgroundImage==='none' &&
                           card.backgroundColor==='rgb(37, 41, 67)' &&
                           card.backdropFilter==='none';
                """),'All summary cards are no longer flat and lightweight'

                stars=driver.execute_script("""
                    const names=[...document.querySelectorAll('#svtNameLayer .falling-name')];
                    const visible=names.filter(el=>getComputedStyle(el).display!=='none');
                    const moving=visible.find(el=>!el.classList.contains('svt-eternity-tag'));
                    const css=getComputedStyle(moving);
                    return {total:names.length,visible:visible.length,
                      expected:50,
                      animation:css.animationName,direction:css.animationDirection,
                      transform:css.transform,
                      phrases:names.filter(el=>/^(OT13|SEVENTEEN WILL CHALLENGE ETERNITY)$/.test(el.textContent.trim())).length,
                      color:css.color,cursor:getComputedStyle(document.body,'::after').display};
                """)
                assert stars['total']==51 and stars['visible']==stars['expected'] and stars['phrases']==2 and stars['color']=='rgb(255, 255, 255)' and stars['cursor']=='none',(
                    f'Starfield labels or layout incorrect: {stars}')
                assert stars['animation']=='svt-name-diagonal-v171' and stars['direction']=='normal',(
                    f'Starfield motion is missing: {stars}')
                time.sleep(.75)
                moved=driver.execute_script("""
                    return getComputedStyle([...document.querySelectorAll('#svtNameLayer .falling-name')].find(el=>getComputedStyle(el).display!=='none'&&!el.classList.contains('svt-eternity-tag'))).transform;
                """)
                assert moved!=stars['transform'],('Starfield labels are stationary',stars,moved)
                hover_features=driver.execute_script("""
                    const ot=document.querySelector('#svtNameLayer .svt-ot13');
                    ot.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse',clientX:50,clientY:80}));
                    const groupPhoto=document.querySelector('#svt-name-photo')?.classList.contains('svt-group-preview');
                    const button=document.querySelector('#svt-star-trigger');
                    const shown=button && getComputedStyle(button).display!=='none';
                    button?.click();
                    return {groupPhoto,shown,celebrationPieces:document.querySelectorAll('.svt-celebration-piece').length,
                      flowers:document.querySelectorAll('.svt-celebration-piece.svt-flower').length};
                """)
                assert hover_features['groupPhoto'] and hover_features['shown'] and hover_features['celebrationPieces']>0 and hover_features['flowers']>0,(
                    f'OT13 photo or flower celebration missing: {hover_features}')
                print(f'Starfield and hover effects verified at {width}px',flush=True)
                assert driver.execute_script("""
                    return document.documentElement.scrollWidth<=window.innerWidth+5
                """),f'All overflowed the viewport at {width}px'
                WebDriverWait(driver,30).until(lambda d:d.execute_script("""
                    return document.querySelector('#all-artists [data-all-artist-photo="V8"]')?.getAttribute('src')?.includes('assets/profile-photos/v8.jpg')
                """))
                picheolin=driver.execute_script("""
                    return [...document.querySelectorAll('#all-artists tr')]
                     .filter(row=>/Picheolin/i.test(row.querySelector('.svt-all-song')?.textContent||''))
                     .map(row=>row.querySelectorAll('td')[1]?.textContent.trim());
                """)
                # Daily stream totals change; the test must compare against
                # the current canonical snapshot instead of a frozen number.
                solo_snap=json.loads((ROOT/'data/solo.json').read_text(encoding='utf-8'))
                solo_catalog=json.loads((ROOT/'data/catalog.json').read_text(encoding='utf-8'))['solo']
                picheolin_ids={track for release in solo_catalog if release.get('artist')=='Picheolin'
                               for track in release['tracks']}
                picheolin_duplicates={'3Y0ZwgYVHuwbW0JGjsYodR','594CTGIIVVTitwRhQJcWgM'}
                expected_picheolin=sum(solo_snap['tracks'][tid] for tid in picheolin_ids
                                       if tid not in picheolin_duplicates)
                assert picheolin==[f'{expected_picheolin:,}'],(
                    f'All Artists Picheolin total not canonical: {picheolin}; expected {expected_picheolin:,}')
                assert driver.execute_script("""
                    return [...document.querySelectorAll('#all-artists tr')].every(row=>row.querySelectorAll('td').length===2);
                """),'Across all artists must show only the currently selected metric'
                for metric,label in [('followers','HIGHEST FOLLOWERS'),
                                     ('listeners','HIGHEST MONTHLY LISTENERS'),
                                     ('streams','HIGHEST STREAMS')]:
                    click(driver,f'#all-rankCategory [data-all-rank="{metric}"]')
                    assert not driver.find_element(By.ID,'all-audienceSection').get_attribute('hidden')
                    assert driver.find_element(By.ID,'all-catalogSection').get_attribute('hidden') is not None
                    assert driver.find_element(By.ID,'all-artistMetricHeading').text==label
                    scores=driver.execute_script("""
                        return [...document.querySelectorAll('#all-artists tbody tr')]
                         .map(r=>Number(r.querySelectorAll('td')[1]?.textContent.replace(/,/g,'')))
                         .filter(Number.isFinite);
                    """)
                    assert scores==sorted(scores,reverse=True),(
                        f'All artist {metric} ranking is not highest-first: {scores[:8]}')
                    assert driver.execute_script("""
                        return [...document.querySelectorAll('#all-artists tr')]
                         .every(r=>r.querySelectorAll('td').length===2);
                    """),'Artist metric switch exposed irrelevant columns'
                click(driver,'#all-rankCategory [data-all-rank="tracks"]')
                assert driver.execute_script("""
                    const titles=[...document.querySelectorAll('#all-artists .svt-all-song')].map(x=>x.textContent);
                    return titles.includes('Picheolin');
                """),'Stream rankings lost a recorded profile'
                # Search is intentionally persisted on refresh; clear the prior viewport's
                # Love Is Gone filter before testing Picheolin's full six-recording catalog.
                driver.execute_script("""
                    const search=document.getElementById('all-search');
                    search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
                    const el=document.getElementById('all-owner');
                    el.value='Picheolin';el.dispatchEvent(new Event('change',{bubbles:true}));
                """)
                WebDriverWait(driver,15).until(lambda d:
                    d.find_element(By.ID,'all-recordCount').text.startswith('6 recordings'))
                sources=driver.execute_script("""
                    return [...document.querySelectorAll('#all-recordings img[data-cover-track]')]
                       .map(img=>img.dataset.coverTrack);
                """)
                assert len(sources)==6 and all(v.startswith('image:assets/solo-track-covers/') for v in sources),(
                    f'All tracks did not reuse original solo covers: {sources}')
                click(driver,'#all-rankCategory [data-all-rank="albums"]')
                driver.execute_script("""
                    document.getElementById('all-owner').value='JxJ';
                    document.getElementById('all-owner').dispatchEvent(new Event('change',{bubbles:true}));
                """)
                WebDriverWait(driver,15).until(lambda d:
                    len(d.find_elements(By.CSS_SELECTOR,'#all-recordings .svt-all-record'))>0)
                album_sources=driver.execute_script("""
                    return [...document.querySelectorAll('#all-recordings img[data-cover-track]')]
                       .map(img=>img.dataset.coverTrack);
                """)
                assert any('solo-album-covers/jxj_dreamscape.jpg' in x for x in album_sources),(
                    f'All Albums did not reuse JxJ album sleeve: {album_sources}')
                driver.execute_script("""
                    document.getElementById('all-owner').value='all';
                    document.getElementById('all-owner').dispatchEvent(new Event('change',{bubbles:true}));
                """)
                click(driver,'#all-rankCategory [data-all-rank="discography"]')
                assert not driver.find_element(By.ID,'all-catalogSection').get_attribute('hidden')
                assert 'discography' in driver.find_element(By.ID,'all-recordCount').text
                WebDriverWait(driver,20).until(lambda d:
                    len(d.find_elements(By.CSS_SELECTOR,'#all-recordings .svt-all-release-row'))>0)
                assert not driver.execute_script("""
                    return !!document.getElementById('svtAllMilestones');
                """),'All milestones should live on a separate page, not the dashboard'
                assert driver.find_element(By.CSS_SELECTOR,'#svtAllView a.milestone-nav-link').get_attribute('href').endswith('/streaming-milestones.html?view=all')
                assert driver.execute_script("""
                    return getComputedStyle(document.querySelector('#all-catalogSection')).color !== 'rgb(35, 52, 82)'
                """),'All is still using the incorrect white theme'

                click(driver,'#all-rankCategory [data-all-rank="tracks"]')
                # A legacy workbook reused Water's current Spotify ID for Candy;
                # All must look up Water's actual archive recording by name.
                driver.execute_script("""
                    for(const [id,value] of [
                        ['all-owner','SEVENTEEN'],
                        ['all-period','weekly'],['all-sort','streams'],['all-search','Water']]){
                        const el=document.getElementById(id);el.value=value;
                        el.dispatchEvent(new Event(id==='all-search'?'input':'change',{bubbles:true}));
                    }
                """)
                WebDriverWait(driver,30).until(lambda d:
                    'Highest weekly gain' in d.find_element(By.ID,'all-sort').text)
                WebDriverWait(driver,30).until(lambda d:
                    d.find_element(By.ID,'all-recordings').text.find('Water')>=0)
                water=driver.execute_script("""
                    const row=[...document.querySelectorAll('#all-recordings tr')]
                        .find(r=>r.querySelector('.svt-all-song')?.textContent==='Water');
                    return {value:row?.querySelector('.svt-all-num:not(.svt-all-stream-total)')?.textContent?.trim()||'',
                        rows:[...document.querySelectorAll('#all-recordings tr')]
                            .map(r=>Number(r.querySelector('.svt-all-num:not(.svt-all-stream-total)')?.textContent.replace(/[^0-9]/g,'')))};
                """)
                if json.loads((ROOT/'data/group.json').read_text(encoding='utf-8'))['date']=='2026-11-08':
                    assert water['value']=='+66,556',f'Water weekly gained an unrelated song: {water}'
                else:
                    assert water['value'] not in ('+9,749,826','—'),f'Water weekly archive identity error: {water}'
                # All must never display lowercase raw collector release labels.
                display=driver.execute_script("""
                    const row=[...document.querySelectorAll('#all-recordings tr')]
                     .find(tr=>tr.querySelector('.svt-all-song')?.textContent==='Water');
                    return row?.querySelector('.svt-all-sub')?.textContent||'';
                """)
                assert 'spill the feels album' not in display.lower(),(
                    f'All displayed an unformatted raw album name: {display}')
                # These are documented OT13 casing corrections, not guesses.
                for query,expected in [('Mansae','MANSAE'),('Rock with you','Rock with You'),
                                       ('GOM','God of Music'),('To you','To You')]:
                    driver.execute_script("""
                        const el=document.getElementById('all-search');
                        el.value=arguments[0];el.dispatchEvent(new Event('input',{bubbles:true}));
                    """,query)
                    WebDriverWait(driver,15).until(lambda d:
                        len(d.find_elements(By.CSS_SELECTOR,'#all-recordings .svt-all-song'))>0)
                    titles=driver.execute_script("""
                        return [...document.querySelectorAll('#all-recordings .svt-all-song')]
                         .map(e=>e.textContent.trim());
                    """)
                    assert expected in titles,f'All title case not identical to original: {query} -> {titles[:10]}'
                driver.execute_script("""
                    const el=document.getElementById('all-search');
                    el.value='girlsnboys';el.dispatchEvent(new Event('input',{bubbles:true}));
                    document.getElementById('all-owner').value='all';
                    document.getElementById('all-owner').dispatchEvent(new Event('change',{bubbles:true}));
                """)
                WebDriverWait(driver,15).until(lambda d:
                    'girlsnboys' in d.find_element(By.ID,'all-recordings').text)
                assert 'girlsnboys' in driver.find_element(By.ID,'all-recordings').text,                    'Intentionally lowercase original solo titles must remain unchanged'
                driver.execute_script("""
                    document.getElementById('all-search').value='';
                    document.getElementById('all-search').dispatchEvent(new Event('input',{bubbles:true}));
                """)
                assert driver.find_element(By.ID,'all-gainTitle').text=='WEEKLY INCREASE'
                assert driver.find_element(By.ID,'all-changeTitle').text=='CHANGE'
                assert driver.execute_script("""
                    return [...document.querySelectorAll('#all-recordings tr')].every(
                        row=>row.querySelectorAll('td').length===4);
                """),'All period rankings should display total streams and streams added'
                # The compact combined ranking matches OG's dense track layout.
                assert driver.execute_script("""
                    const row=document.querySelector('#all-recordings tr');
                    return !!row && row.getBoundingClientRect().height < 85;
                """),'All song ranking occupies too much vertical space'
                # Cross-catalog Joshua tracks count once, with The8's
                # independently released Love Is Gone still included.
                driver.execute_script("""
                    for(const [id,value] of [
                        ['all-owner','all'],['all-period','overall'],['all-search','Love Is Gone']]){
                         const el=document.getElementById(id);el.value=value;
                         el.dispatchEvent(new Event(id==='all-search'?'input':'change',{bubbles:true}));
                    }
                """)
                WebDriverWait(driver,30).until(lambda d:
                    '3 recordings' in d.find_element(By.ID,'all-recordCount').text)
                matching=driver.execute_script("""
                    return [...document.querySelectorAll('#all-recordings a[href*="spotify.com/track"]')]
                     .map(a=>a.getAttribute('href').split('/').pop());
                """)
                assert len(matching)==len(set(matching))==3,                    f'Joshua cross-catalog doubles or The8 missing: {matching}'
                assert '4iIx4KfhlrkWBw1nTBo313' not in matching,                    'Duplicate Joshua recording ID still included'
                assert '4FTcJ9B6S2QXObqRr9UG8U' in matching and '6kkFC7qnkFNpd6zv31mVdU' in matching,                    f'Canonical Joshua or distinct The8 song missing: {matching}'
                # A refresh in the All tab must preserve both the main section
                # and the selected All ranking category.
                click(driver,'#all-rankCategory [data-all-rank="followers"]')
                driver.refresh()
                WebDriverWait(driver,55).until(lambda d:
                    d.execute_script("return document.body.classList.contains('svt-all-view')") and
                    d.execute_script("return document.querySelector('#all-rankCategory [data-all-rank=followers]')?.classList.contains('active')"))
                assert '?view=all' in driver.current_url,                    'All tab URL was lost after refresh'
                assert not driver.find_element(By.ID,'all-audienceSection').get_attribute('hidden')
                click(driver,'#all-rankCategory [data-all-rank="tracks"]')
                click(driver,'#tabs button[data-tab="group"]')
                read_layout(driver,f'OT13 after All {width}px')
                assert not driver.execute_script("return document.body.classList.contains('svt-all-view')")
                print('In-page All photo, song cover, album sleeve and navigation verified:',width,flush=True)
            # Verify the smallest practical phone width, not just 390px.
            driver.set_window_size(320,850)
            driver.get(f'http://127.0.0.1:{PORT}/index.html?view=all')
            WebDriverWait(driver,40).until(lambda d:
                d.execute_script("return document.body.classList.contains('svt-all-view')"))
            assert driver.execute_script("""
                const nav=document.getElementById('tabs');
                const items=[...nav.querySelectorAll('button[data-tab]')];
                const bounds=items.map(el=>el.getBoundingClientRect());
                return bounds.length===3 &&
                  Math.max(...bounds.map(b=>b.top))-Math.min(...bounds.map(b=>b.top))<2 &&
                  bounds.every(b=>b.right<=nav.getBoundingClientRect().right+2) &&
                  items.every(el=>el.scrollWidth<=el.clientWidth+3);
            """),'Three archive tabs wrapped or were clipped at 320px'
            print('Archive navigation stayed on one row at 320px mobile',flush=True)
            # Legacy All links should land on this same in-page view.
            driver.get(f'http://127.0.0.1:{PORT}/all.html')
            WebDriverWait(driver,40).until(lambda d:
                d.execute_script("return document.body.classList.contains('svt-all-view')"))
            assert 'index.html?view=all' in driver.current_url,'Legacy All did not redirect to the main dashboard'
            print('All legacy navigation, Picheolin streams and both responsive views verified',flush=True)
            # All has a dedicated milestone page with the original dark layout,
            # and the documented Feb 6 LOVE, MONEY, FAME threshold date.
            for width in (1300,390):
                driver.set_window_size(width,850)
                driver.get(f'http://127.0.0.1:{PORT}/all-milestones.html')
                # A previous visit can restore Upcoming and hide Reached.
                # Selenium .text is empty inside a hidden panel; test the
                # underlying loaded data, then click Reached like a real user.
                WebDriverWait(driver,40).until(lambda d:d.execute_script("""
                    return document.querySelectorAll('#rows .song-title').length>0 &&
                     (document.getElementById('status')?.textContent||'').includes('distinct recordings reached');
                """))
                click(driver,'#tabReached')
                assert driver.find_element(By.CSS_SELECTOR,'a.back').get_attribute('href').endswith('index.html?view=all')
                assert driver.execute_script("""
                    const bg=getComputedStyle(document.body);
                    return bg.backgroundImage==='none' && bg.backgroundColor==='rgb(16, 18, 41)';
                """),'All milestone page background is no longer flat navy'
                driver.execute_script("""
                    const el=document.getElementById('search');
                    el.value='LOVE, MONEY, FAME';el.dispatchEvent(new Event('input',{bubbles:true}));
                """)
                WebDriverWait(driver,15).until(lambda d:
                    'LOVE, MONEY, FAME' in d.find_element(By.ID,'rows').text)
                money=driver.execute_script("""
                    const tr=[...document.querySelectorAll('#rows tr')]
                        .find(tr=>tr.querySelector('.song-title')?.textContent==='LOVE, MONEY, FAME');
                    return {title:tr?.querySelector('.song-title')?.textContent,
                      reached:tr?.querySelector('[data-label="MILESTONE REACHED"]')?.textContent};
                """)
                assert money['title']=='LOVE, MONEY, FAME' and 'Feb 6, 2026' in (money['reached'] or ''),(
                    f'LOVE, MONEY, FAME 100M date missing: {money}')
                click(driver,'#tabUpcoming')
                WebDriverWait(driver,25).until(lambda d:
                    'distinct recordings' in d.find_element(By.ID,'upcomingStatus').text)
                # Clear the reached-only search on the new upcoming panel.
                driver.execute_script("""
                    const el=document.getElementById('upcomingSearch');
                    el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));
                """)
                assert len(driver.find_elements(By.CSS_SELECTOR,'#upcomingRows .song-title'))>=390,                    'Combined upcoming milestones omitted many unit/solo songs'
                # The combined reached history should have dates, not external
                # Source buttons. Historical evidence remains in its data file.
                click(driver,'#tabReached')
                assert driver.execute_script("""
                    return document.querySelectorAll('#rows .milestone-source').length===0;
                """),'Unexpected Source link in reached milestones'
                click(driver,'#tabUpcoming')
                # GOLM (Inst.) and the rest of its 2023 single use the shared
                # verified cover rather than CORS-blocked Spotify requests.
                driver.execute_script("""
                    const search=document.getElementById('upcomingSearch');
                    search.value='GOLM (Inst.)';search.dispatchEvent(new Event('input',{bubbles:true}));
                """)
                WebDriverWait(driver,20).until(lambda d:d.execute_script("""
                    return [...document.querySelectorAll('#upcomingRows tr')].some(r=>
                        (r.querySelector('.song-title')?.textContent||'').includes('GOLM (Inst.)'));
                """))
                driver.execute_script("""
                    const r=[...document.querySelectorAll('#upcomingRows tr')].find(x=>
                        (x.querySelector('.song-title')?.textContent||'').includes('GOLM (Inst.)'));
                    r?.scrollIntoView({block:'center'});
                """)
                WebDriverWait(driver,18).until(lambda d:d.execute_script("""
                    const r=[...document.querySelectorAll('#upcomingRows tr')].find(x=>
                        (x.querySelector('.song-title')?.textContent||'').includes('GOLM (Inst.)'));
                    const img=r?.querySelector('img.song-cover');
                    return Boolean(img?.complete&&img.naturalWidth>0);
                """))
                print('All milestones GOLM (Inst.) cover loads:',width,flush=True)
                driver.execute_script("""
                    const search=document.getElementById('upcomingSearch');
                    search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
                """)

                # The page must not send hundreds of CORS-blocked Spotify
                # oEmbed calls when showing the full upcoming list.
                assert driver.execute_script("""
                    return [...performance.getEntriesByType('resource')].filter(item=>
                      item.name.includes('open.spotify.com/oembed')).length===0;
                """),'All milestone covers still request blocked Spotify oEmbed endpoints'
                assert driver.execute_script("""
                    const cover=document.querySelector('#upcomingRows .song-cover');
                    return !!cover && !!document.querySelector('#upcomingRows .song-title');
                """),'Combined milestone listing lost song artwork positions'

                assert driver.execute_script("""
                    return document.documentElement.scrollWidth<=window.innerWidth+5
                """),f'All milestone page horizontal overflow at {width}px'
                print('Dedicated All milestone page, LOVE MONEY FAME date, mobile:',width,flush=True)
            # The OT13 milestone page must also load GOLM (Inst.) art.
            driver.get(f'http://127.0.0.1:{PORT}/milestones.html')
            click(driver,'#tabUpcoming')
            driver.execute_script("""
                const search=document.getElementById('upcomingSearch');
                search.value='GOLM (Inst.)';search.dispatchEvent(new Event('input',{bubbles:true}));
            """)
            WebDriverWait(driver,18).until(lambda d:d.execute_script("""
                const row=[...document.querySelectorAll('#upcomingRows tr')].find(x=>
                    (x.querySelector('.song-title')?.textContent||'').includes('GOLM (Inst.)'));
                const img=row?.querySelector('img.song-cover');
                if(row)row.scrollIntoView({block:'center'});
                return Boolean(img?.complete&&img.naturalWidth>0);
            """))
            print('OT13 milestones GOLM (Inst.) cover loads',flush=True)
            driver.get(f'http://127.0.0.1:{PORT}/milestones.html?type=solo')
            WebDriverWait(driver,40).until(lambda d:'UNITS & SOLO' in d.find_element(By.CSS_SELECTOR,'.eyebrow').text)
            # Selenium .text is empty inside the hidden Upcoming panel unless
            # the tab is selected. Test what a user actually clicks and sees.
            click(driver,'#tabUpcoming')
            # Check the actual content, not just the page heading: 'Like you'
            # is below 1M on Nov 6 and must be an upcoming UNIT milestone.
            latest=json.loads((ROOT/'data/solo.json').read_text(encoding='utf-8'))
            day=datetime.date.fromisoformat(latest['date'])
            expected_date=f"{day.strftime('%b')} {day.day}, {day.year}"
            time.sleep(5)
            print('Solo milestone initial DOM:',driver.execute_script("""
              return {status:document.getElementById('status')?.textContent,
                upcoming:document.getElementById('upcomingStatus')?.textContent,
                rows:document.querySelectorAll('#rows tr').length,
                upcomingRows:document.querySelectorAll('#upcomingRows tr').length,
                scriptLoaded:typeof window.location?.pathname};
            """),flush=True)
            try: print('Browser JS errors:',driver.get_log('browser')[-15:],flush=True)
            except Exception: pass
            milestone_names=[el.text.strip() for el in driver.find_elements(
                By.CSS_SELECTOR,'#upcomingRows .song-title')]
            details=driver.execute_script("""
              const el=document.getElementById('upcomingThreshold');
              return {filter:el?.value, status:document.getElementById('upcomingStatus')?.textContent,
                titles:[...document.querySelectorAll('#upcomingRows .song-title')].slice(0,60).map(x=>x.textContent)};
            """)
            print('Solo milestone diagnostic:',details,flush=True)
            print('Solo page current status:',driver.find_element(By.ID,'status').text,flush=True)
            print('Solo reached rows:',
                  [t.text for t in driver.find_elements(By.CSS_SELECTOR,'#rows .song-title')][:15],
                  flush=True)
            assert any(name.lower()=='like you' for name in milestone_names), 'Unit/single milestone missing Like you'
            assert not any(name.lower()=='maestro' for name in milestone_names), 'OT13 milestone leaked into Units & Solo'
            assert expected_date in driver.find_element(By.ID,'upcomingStatus').text, 'Wrong solo milestone source date'
            print('Separate Unit/Solo milestones verified:',len(milestone_names),
                  'actual unit/solo tracks, source:',expected_date,flush=True)
            click(driver,'#tabReached')
            # Reached milestones are 100M+ in BOTH views. Verify the two
            # known unit records with their exact/upper-bound historical dates.
            WebDriverWait(driver,45).until(
                lambda d:any('Fighting' in t.text for t in
                    d.find_elements(By.CSS_SELECTOR,'#rows .song-title')))
            results=driver.execute_script("""
              return {
                thresholds:[...document.querySelectorAll('#threshold option')].map(o=>Number(o.value)),
                rows:[...document.querySelectorAll('#rows tr')].map(row=>({
                   name:row.querySelector('.song-title')?.textContent||'',
                   reached:row.querySelector('[data-label="MILESTONE REACHED"]')?.textContent||''
                }))
              };
            """)
            print('Reached 100M+ unit records:',results,flush=True)
            assert results['thresholds'] and min(results['thresholds'])>=100_000_000, (
                'Reached milestones unexpectedly include thresholds below 100M')
            fighting=next((x for x in results['rows'] if 'Fighting' in x['name']),None)
            bittersweet=next((x for x in results['rows'] if 'Bittersweet' in x['name']),None)
            assert fighting and 'Jun 28, 2024' in fighting['reached'], (
                'Missing verified June 28 2024 Fighting 100M milestone')
            assert bittersweet and 'Sep 11, 2025' in bittersweet['reached'], (
                'Bittersweet 100M must show the user-confirmed Sep 11, 2025 milestone date')
            print('Website smoke checks passed',flush=True)
        finally:
            driver.quit()
            server.shutdown()

if __name__=='__main__':
    main()
