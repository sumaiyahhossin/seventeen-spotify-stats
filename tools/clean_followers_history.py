"""Remove follower history before the first real collector date."""
import json
from pathlib import Path

START = "2026-11-06"
DATA = Path(__file__).resolve().parents[1] / "data"
paths = sorted((DATA / "history").glob("group-*.json"))
paths.append(DATA / "group.json")
changed = 0
for path in paths:
    if not path.exists():
        continue
    snapshot = json.loads(path.read_text())
    if snapshot.get("date", "") >= START:
        continue
    dirty = False
    if "followers" in snapshot:
        del snapshot["followers"]
        dirty = True
    names = snapshot.get("names", {})
    tracks = snapshot.get("tracks", {})
    for track_id, name in list(names.items()):
        if "follower" in str(name).lower():
            del names[track_id]
            tracks.pop(track_id, None)
            dirty = True
    if dirty:
        path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
        changed += 1
print(f"Removed pre-{START} follower values from {changed} snapshots")
