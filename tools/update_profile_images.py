"""Cache verified Spotify artist thumbnail URLs for the static Pages site.

The browser no longer needs to make cross-origin Spotify oEmbed requests to
display the units/solo profile grid. Existing good URLs are retained when
Spotify temporarily fails.
"""
import concurrent.futures
import json
import pathlib
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "profile-images.json"
ARTISTS = {
    "Jeonghan": "6KDLlQYeeqUe5OQ2JrdNzF",
    "Joshua": "74AwWFYdjQ3ER5vHO4H7b0",
    "Jun": "38Gn0ZVC8TQwuaMxBK1yRV",
    "Hoshi": "6nWKAdMv1BDq1zHfZzkdbR",
    "Wonwoo": "3rHcBT06Vb1XGVUWhDALZt",
    "Woozi": "4TdiASPlU3QdZvGQBothcQ",
    "Dokyeom": "7G1kUsPtQCdolV6CPwHmh2",
    "Mingyu": "5gUpo0BRmo6EOTbyU3z5Ay",
    "The8": "4DqFd6XE3dX4LWXHJVVpLk",
    "Seungkwan": "0Vb2DjojEYsasFpc3aTZb6",
    "Vernon": "2Y34b9AOK30zXgL7cAH4NG",
    "Dino": "5YaeXxzvqGNBCguELlKo6G",
    "BSS": "1uAT5bTSp6dWbNmixIUP5t",
    "JxW": "7GvlsjcgBrsE578yghOq7D",
    "HxW": "1EReYiseDwE51FzGm7EK9n",
    "CxM": "7kjuLdYbtTkWBToMu2ebZN",
    "DxS": "4wBjmEkWhY4T22q00CiF5V",
    "Picheolin": "3V2EC4dPYLgtbi0TtrB1RA",
}

def fetch_image(item):
    name, artist_id = item
    artist_url = "https://open.spotify.com/artist/" + artist_id
    url = "https://open.spotify.com/oembed?url=" + urllib.parse.quote(artist_url, safe="")
    request = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SEVENTEEN-Spotify-Stats/1.0)",
    })
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            info = json.load(response)
        thumb = info.get("thumbnail_url") or ""
        if thumb.startswith("https://") and ("scdn.co/" in thumb or "spotifycdn.com/" in thumb):
            return artist_id, thumb, name
        print(f"{name}: Spotify returned no artist photograph")
    except Exception as exc:
        print(f"{name}: photo lookup unavailable: {type(exc).__name__}: {exc}")
    return artist_id, None, name

def main():
    existing = json.loads(TARGET.read_text()) if TARGET.exists() else {}
    updated = dict(existing)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for artist_id, image, name in pool.map(fetch_image, ARTISTS.items()):
            if image:
                updated[artist_id] = image
                print(f"{name}: artist image resolved")
    TARGET.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Saved {len(updated)}/{len(ARTISTS)} solo and unit profile photo URLs")

if __name__ == "__main__":
    main()
