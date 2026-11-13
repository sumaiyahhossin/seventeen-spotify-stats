#!/usr/bin/env python3
"""Confirm GitHub Pages actually serves the verified JSON from the deployed commit.

GitHub's successful deployment status alone does not prove the live CDN is
serving the new group/solo counts. Re-read exact source data with cache busting.
"""
import json
import os
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def fetch_json(base: str, filename: str):
    url = urljoin(base.rstrip("/") + "/", filename)
    separator = "&" if "?" in url else "?"
    request = Request(
        f"{url}{separator}verify={time.time_ns()}",
        headers={"Cache-Control": "no-cache", "User-Agent": "SEVENTEEN-Spotify-Pages-Verifier/1.0"},
    )
    with urlopen(request, timeout=15) as response:
        if response.status != 200:
            raise OSError(f"{filename} returned HTTP {response.status}")
        return json.load(response)


def verify(base: str, attempts: int = 8, delay: int = 12):
    files = ("data/group.json", "data/solo.json", "data/manifest.json")
    expected = {name: json.loads((ROOT / name).read_text(encoding="utf-8")) for name in files}
    for attempt in range(1, attempts + 1):
        try:
            remote = {name: fetch_json(base, name) for name in files}
            for kind in ("group", "solo"):
                key = f"data/{kind}.json"
                if (remote[key].get("date") != expected[key].get("date")
                        or remote[key].get("tracks") != expected[key].get("tracks")):
                    raise ValueError(
                        f"{kind} stats differ: committed {expected[key].get('date')}, "
                        f"live {remote[key].get('date')}"
                    )
                dates_key = "dates" if kind == "group" else "solo_dates"
                if expected[key].get("date") not in remote["data/manifest.json"].get(dates_key, []):
                    raise ValueError(f"Live manifest does not list {kind}'s current date")
            if remote["data/manifest.json"] != expected["data/manifest.json"]:
                raise ValueError("Live manifest still differs from the committed manifest")
            print("Verified live GitHub Pages serves both snapshot datasets and manifest")
            for kind in ("group", "solo"):
                doc = remote[f"data/{kind}.json"]
                print(f"{kind}: {doc['date']}, {len(doc['tracks'])} track counters")
            return
        except (HTTPError, URLError, OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            print(f"Pages verification attempt {attempt}/{attempts}: {error}", flush=True)
            if attempt < attempts:
                time.sleep(delay)
    raise SystemExit("GitHub Pages did not serve the committed snapshots; deployment must be investigated")


if __name__ == "__main__":
    site = os.environ.get("SITE_URL", "").strip() or (sys.argv[1] if len(sys.argv) > 1 else "")
    if not site.startswith("https://"):
        raise SystemExit("Set SITE_URL to the GitHub Pages HTTPS deployment address")
    verify(site)
