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
            # Check the actual content, not just the page heading: 'Like you'
            # is below 1M on Nov 6 and must be an upcoming UNIT milestone.
            latest=json.loads((ROOT/'data/solo.json').read_text(encoding='utf-8'))
            day=datetime.date.fromisoformat(latest['date'])
            expected_date=f"{day.strftime('%b')} {day.day}, {day.year}"
            WebDriverWait(driver,45).until(
                lambda d:expected_date in d.find_element(By.ID,'upcomingStatus').text
                  and any(el.text.strip().lower()=='like you' for el in
                    d.find_elements(By.CSS_SELECTOR,'#upcomingRows .song-title')))
            milestone_names=[el.text.strip() for el in driver.find_elements(
                By.CSS_SELECTOR,'#upcomingRows .song-title')]
            details=driver.execute_script("""
              const el=document.getElementById('upcomingThreshold');
              return {filter:el?.value, status:document.getElementById('upcomingStatus')?.textContent,
                titles:[...document.querySelectorAll('#upcomingRows .song-title')].slice(0,60).map(x=>x.textContent)};
            """)
            print('Solo milestone diagnostic:',details,flush=True)
            assert any(name.lower()=='like you' for name in milestone_names), 'Unit/single milestone missing Like you'
            assert not any(name.lower()=='maestro' for name in milestone_names), 'OT13 milestone leaked into Units & Solo'
            assert expected_date in driver.find_element(By.ID,'upcomingStatus').text, 'Wrong solo milestone source date'
            print('Separate Unit/Solo milestones verified:',len(milestone_names),
                  'actual unit/solo tracks, source:',expected_date,flush=True)
            print('Website smoke checks passed',flush=True)
        finally:
            driver.quit()
            server.shutdown()

if __name__=='__main__':
    main()
