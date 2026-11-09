"""Cache precise unit/solo Spotify covers as same-site assets.

Each Spotify track ID has its own original recording cover. No fuzzy title
search is used, so "Coloring" and similarly named songs cannot steal covers.
An album's cover is separately cached under its canonical release key.
"""
from __future__ import annotations
import concurrent.futures, datetime, json, pathlib, shutil, time
import urllib.error, urllib.parse, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
TRACK_FOLDER=ROOT/'assets'/'solo-track-covers'
ALBUM_FOLDER=ROOT/'assets'/'solo-album-covers'
TRACK_FOLDER.mkdir(parents=True,exist_ok=True)
ALBUM_FOLDER.mkdir(parents=True,exist_ok=True)
catalog=json.loads((DATA/'catalog.json').read_text(encoding='utf-8'))['solo']
albums=json.loads((DATA/'solo-albums.json').read_text(encoding='utf-8'))
existing_path=DATA/'solo-media.json'
existing=json.loads(existing_path.read_text(encoding='utf-8')) if existing_path.exists() else {}
track_ids=sorted({tid for item in catalog for tid in item['tracks']})
album_ids={album['key']:album.get('albumId') for album in albums if album.get('albumId')}

def get(url, timeout=16, binary=False):
    request=urllib.request.Request(url,headers={
       'User-Agent':'Mozilla/5.0 (compatible; SVT-Spotify-Stats-CoverArchive/1.0)',
       'Accept':'image/jpeg,image/png,image/webp,*/*' if binary else 'application/json',
    })
    with urllib.request.urlopen(request,timeout=timeout) as res:
        return res.read(2_000_000 if binary else 70_000)

def oembed(kind, identifier):
    source=f'https://open.spotify.com/{kind}/{identifier}'
    data=json.loads(get('https://open.spotify.com/oembed?url='+urllib.parse.quote(source,safe='')))
    url=data.get('thumbnail_url') or ''
    if not url.startswith('https://') or not ('spotifycdn.com/' in url or 'scdn.co/' in url):
        raise ValueError('Spotify did not return a verified album cover')
    return url

def cache_image(dest_stem, spotify_url):
    matches=[p for p in dest_stem.parent.glob(dest_stem.name+'.*') if p.suffix in ('.jpg','.png','.webp') and p.stat().st_size>1000]
    if matches:return matches[0].relative_to(ROOT).as_posix()
    payload=get(spotify_url,binary=True)
    if payload[:3]==b'\\xff\\xd8\\xff':ext='.jpg'
    elif payload[:8]==b'\\x89PNG\\r\\n\\x1a\\n':ext='.png'
    elif payload[:4]==b'RIFF' and payload[8:12]==b'WEBP':ext='.webp'
    else:raise ValueError('unrecognized image response')
    if len(payload)<1200:raise ValueError('empty image')
    filename=dest_stem.with_suffix(ext);filename.write_bytes(payload)
    return filename.relative_to(ROOT).as_posix()

def fetch_track(tid):
    previous=existing.get('tracks',{}).get(tid,{})
    old=previous.get('local') if isinstance(previous,dict) else None
    if old and (ROOT/old).is_file():return tid,{'local':old,'spotify_url':previous.get('spotify_url','')},None
    for attempt in range(3):
        try:
            photo=oembed('track',tid)
            local=cache_image(TRACK_FOLDER/tid,photo)
            return tid,{'local':local,'spotify_url':photo},None
        except Exception as e:
            if attempt==2:return tid,None,f'{tid}: {type(e).__name__} {e}'
            time.sleep(.3*(attempt+1))

def fetch_album(album):
    key=album['key'];ids=album_ids
    if key in ids:
        try:
            photo=oembed('album',ids[key])
            return key,cache_image(ALBUM_FOLDER/key,photo),None
        except Exception as e:print('Album direct cover unavailable:',key,type(e).__name__)
    cover=album['coverTrack']
    source=next((p for p in TRACK_FOLDER.glob(cover+'.*') if p.is_file() and p.stat().st_size>1000),None)
    if source:
        dest=ALBUM_FOLDER/(key+source.suffix)
        if not dest.exists():shutil.copyfile(source,dest)
        return key,dest.relative_to(ROOT).as_posix(),None
    return key,None,'No verified release cover for '+key

def main():
    tracks={}
    errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for tid,result,error in pool.map(fetch_track,track_ids):
            if result:tracks[tid]=result
            if error:errors.append(error)
    arts={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for key,cover,error in pool.map(fetch_album,albums):
            if cover:arts[key]=cover
            if error:errors.append(error)
    out={'source':'Exact Spotify oEmbed track/release IDs; mirrored to GitHub Pages; no fuzzy title matching',
         'tracks':tracks,'albums':arts,'missingTracks':[t for t in track_ids if t not in tracks],
         'missingAlbums':[a['key'] for a in albums if a['key'] not in arts]}
    existing_path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\\n',encoding='utf-8')
    for x in errors:print('WARN:',x)
    print(f'Cached {len(tracks)}/{len(track_ids)} exact Spotify track covers and {len(arts)}/{len(albums)} album covers')
    if len(tracks)!=len(track_ids) or len(arts)!=len(albums):
        raise SystemExit('Partial cover cache; missing items explicitly listed in data/solo-media.json')
if __name__=='__main__':main()
