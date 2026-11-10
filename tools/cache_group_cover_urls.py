#!/usr/bin/env python3
"""Build a static URL-only cache for SEVENTEEN group album cover artwork.

Fetch metadata from Spotify oEmbed (or a verified matching iTunes album)
during GitHub Actions, never directly in the visiting browser. This avoids
browser CORS restrictions and rate-limit bursts on the All milestone page.
Do not alter the original artwork map or download any third-party images.
"""
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = ROOT / "data" / "artwork-map.json"
OUT_PATH = ROOT / "data" / "group-cover-urls.json"
USER_AGENT = "Mozilla/5.0 (compatible; SEVENTEENStatsArtworkCache/1.0)"
ALIASES = {
    "fml album": "FML",
    "al1 album": "Al1",
    "you make my day album": "YOU MAKE MY DAY",
    "you make my dawn album": "YOU MADE MY DAWN",
    "an ode album": "An Ode",
    "seventeenth heaven album": "SEVENTEENTH HEAVEN",
    "17 is right here best album": "17 IS RIGHT HERE",
    "spill the feels album": "SPILL THE FEELS",
    "happy burstday album": "HAPPY BURSTDAY",
    "attacca album": "Attacca",
    "face the sun album": "Face the Sun",
    "your choice album": "Your Choice",
    "heng garae album": "Heng:garæ",
}


def request_json(url):
    request = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            return json.load(response)
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return None


def normalize(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def image_from_spotify(album_id):
    url = "https://open.spotify.com/oembed?" + urllib.parse.urlencode(
        {"url": f"https://open.spotify.com/album/{album_id}"}
    )
    value = request_json(url) or {}
    image = value.get("thumbnail_url", "")
    if isinstance(image, str) and image.startswith("https://"):
        return image
    return ""


def image_from_itunes(release):
    if not release:
        return ""
    alias = ALIASES.get(normalize(release), release)
    alias = re.sub(r"\s+(album|single|mini album|ep)$", "", alias, flags=re.I).strip()
    if not alias:
        return ""
    url = "https://itunes.apple.com/search?" + urllib.parse.urlencode(
        {"term": "SEVENTEEN " + alias, "entity": "album", "limit": "80", "country": "US"}
    )
    value = request_json(url) or {}
    expected = normalize(alias)
    matches = [
        item for item in value.get("results", [])
        if "seventeen" in str(item.get("artistName", "")).lower()
        and normalize(re.sub(r"\b(album|ep|single)\b", "", item.get("collectionName", ""), flags=re.I)) == expected
    ]
    selected = next((item for item in matches if item.get("artistName", "").lower() == "seventeen"), None)
    if selected is None and matches:
        selected = matches[0]
    image = (selected or {}).get("artworkUrl100", "")
    if image.startswith("https://"):
        return re.sub(r"\d+x\d+bb", "600x600bb", image)
    return ""


def main():
    mapping = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    album_releases = {}
    for value in (mapping.get("tracks") or {}).values():
        album_id = value.get("id")
        if album_id and re.fullmatch(r"[A-Za-z0-9]{22}", album_id):
            album_releases.setdefault(album_id, value.get("release", ""))
    existing = {}
    if OUT_PATH.exists():
        try:
            existing = json.loads(OUT_PATH.read_text(encoding="utf-8")).get("albums", {})
        except (ValueError, OSError):
            pass
    resolved = dict(existing)
    print("Checking", len(album_releases), "canonical album covers")
    for position, (album_id, release) in enumerate(album_releases.items(), 1):
        if resolved.get(album_id, "").startswith("https://"):
            continue
        image = image_from_spotify(album_id)
        if not image:
            image = image_from_itunes(release)
        if image:
            resolved[album_id] = image
        print(f"{position}/{len(album_releases)} {release!r}: {'found' if image else 'unavailable'}", flush=True)
        time.sleep(0.8)
    output = {
        "source": "Spotify album oEmbed thumbnail URLs, with exact-album iTunes fallback. Metadata URLs only; no image downloads.",
        "albums": {key: resolved[key] for key in sorted(resolved) if key in album_releases and resolved.get(key, "").startswith("https://")},
    }
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(output['albums'])}/{len(album_releases)} album cover URLs")


if __name__ == "__main__":
    main()
