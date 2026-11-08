#!/usr/bin/env python3
"""Fail closed when a new Spotify snapshot silently drops song data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

def read(path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)

def check(kind):
    path = DATA / f"{kind}.json"
    if not path.exists():
        return
    latest = read(path)
    tracks = latest.get("tracks", {})
    if not isinstance(tracks, dict) or not tracks:
        raise ValueError(f"{path}: missing track streams")
    if any(not isinstance(v, (int, float)) or v < 0 for v in tracks.values()):
        raise ValueError(f"{path}: invalid stream counts")
    date = latest.get("date")
    if not date:
        raise ValueError(f"{path}: missing snapshot date")
    archived = DATA / "history" / f"{kind}-{date}.json"
    if archived.exists():
        saved = read(archived)
        if saved.get("tracks") != tracks:
            raise ValueError(f"{archived}: same-day history differs from current snapshot")
    if kind == "group":
        canonical = latest.get("canonical_track_ids", [])
        if canonical:
            if len(set(canonical)) != len(canonical):
                raise ValueError("Duplicate canonical song IDs")
            missing = [song for song in canonical if song not in tracks]
            if missing:
                raise ValueError(f"Missing {len(missing)} canonical song streams")
        if date >= "2026-11-06" and len(canonical) < 227:
            raise ValueError(f"Group song catalog shrank to {len(canonical)}; expected at least 227")
        baseline = DATA / "history" / "group-2026-11-06.json"
        if baseline.exists() and date >= "2026-11-06":
            original = read(baseline)
            lost = set(original.get("canonical_track_ids", [])) - set(tracks)
            if lost:
                raise ValueError(f"{len(lost)} previously tracked group songs disappeared")
    print(f"Validated {kind} snapshot: {date}, {len(tracks)} entries")

if __name__ == "__main__":
    check("group")
    check("solo")
