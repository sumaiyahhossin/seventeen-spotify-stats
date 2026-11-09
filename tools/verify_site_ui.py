"""Smoke-test the real dashboard DOM at desktop and mobile widths."""
from __future__ import annotations
import contextlib
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
    read_layout(driver,f'Units & Solo albums {width}px')
    # Check both original single and full album artwork with no diamond fallback.
    click(driver,'#rankCategory button[data-type="tracks"]')
    WebDriverWait(driver,40).until(lambda d:len(d.find_elements(By.CSS_SELECTOR,'#ranking .rank-row'))>150)
    time.sleep(4)
    images=driver.find_elements(By.CSS_SELECTOR,'#ranking .rank-row img.cover')
    broken=driver.execute_script("""
      return [...document.querySelectorAll('#ranking img.cover')].slice(0,25)
        .filter(img => !img.complete || img.naturalWidth<2)
        .map(img=>({source:img.dataset.coverTrack,url:img.src}));
    """)
    print(f"First {min(25,len(images))} unit/solo covers broken:",broken,flush=True)
    assert not broken, f"Local cover assets not loading: {broken[:4]}"

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
            print('Separate Unit/Solo milestones page verified',flush=True)
            print('Website smoke checks passed',flush=True)
        finally:
            driver.quit()
            server.shutdown()

if __name__=='__main__':
    main()
