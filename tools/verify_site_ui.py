"""Smoke-test the real dashboard DOM at desktop and mobile widths."""
from __future__ import annotations
import contextlib
import json
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
    element=WebDriverWait(driver,30).until(lambda d:d.find_element(By.CSS_SELECTOR,selector))
    driver.execute_script('arguments[0].click()',element)

def check_viewport(driver,width,height):
    driver.set_window_size(width,height)
    driver.get(f'http://127.0.0.1:{PORT}/')
    read_layout(driver,f'OT13 {width}px')
    click(driver,'#tabs button[data-tab="solo"]')
    read_layout(driver,f'Units & Solo {width}px')
    click(driver,'#rankCategory button[data-type="albums"]')
    WebDriverWait(driver,40).until(lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>=10)
    entries=driver.find_elements(By.CSS_SELECTOR,'#ranking .rank-row')
    titles=[x.find_element(By.CSS_SELECTOR,'.track-name').text for x in entries]
    print('Album names:',titles,flush=True)
    expected=['DREAMSCAPE','V8','THIS MAN','9','BEAM','SECOND WIND','TELEPARTY','HYPE VIBES','STARDUST','Gilboard','Serenade']
    assert len(entries)==11, f"Album view needs exactly 11 official releases, got {len(entries)}"
    for name in expected:
        assert any(name.lower() in title.lower() for title in titles),f"Missing album {name}"
    # The album type and full dated title must be visible on every album.
    undated=[row.find_element(By.CSS_SELECTOR,'.track-copy').text for row in entries
            if 'Released ' not in row.find_element(By.CSS_SELECTOR,'.track-copy').text]
    assert not undated, f"Official albums without release dates: {undated}"
    # The Most/Least streamed options must sort FULL album totals,
    # not remain in the source catalog's fixed release sequence.
    assert 'SECOND WIND' in titles[0], f'Incorrect top-streamed album: {titles[0]}'
    driver.execute_script("""
      const el=document.getElementById('order');
      el.value='least';el.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    WebDriverWait(driver,20).until(lambda d:
        '9' in d.find_element(By.CSS_SELECTOR,'#ranking .rank-row .track-name').text
        and 'SECOND WIND' in d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row .track-name')[-1].text)
    smallest=[x.text for x in driver.find_elements(By.CSS_SELECTOR,'#ranking .track-name')]
    print('Album least-streamed order:',smallest,flush=True)
    assert smallest[0].endswith(' - 9'),f"Incorrect least-streamed album: {smallest[0]}"
    driver.execute_script("""
      const el=document.getElementById('order');
      el.value='most';el.dispatchEvent(new Event('change',{bubbles:true}));
    """)
    read_layout(driver,f'Units & Solo albums {width}px')
    # Check both original single and full album artwork with no diamond fallback.
    click(driver,'#rankCategory button[data-type="tracks"]')
    WebDriverWait(driver,40).until(lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>150)
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
                'Full 7-Track Album Total','The8 7-Track Total',
                'Vernon 7-Track Total','Full 8-Track Album Total'):
        assert any(key in row['title'] for row in sections),f'Missing album section subtotal: {key}'
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
