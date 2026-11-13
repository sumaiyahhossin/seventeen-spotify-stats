#!/usr/bin/env python3
"""Explain whether a collector published a fresh saved date or only checked.

A green workflow run must not be mistaken for a fresh Spotify snapshot.
This is an observability check, never a reason to invent missing streams.
"""
import datetime as dt
import json
import os
import pathlib
import sys
from zoneinfo import ZoneInfo
from reporting_window import available_reporting_date

ROOT = pathlib.Path(__file__).resolve().parents[1]
TZ = ZoneInfo("America/New_York")

def main():
    kind = sys.argv[1] if len(sys.argv)>1 else "group"
    if kind not in ("group", "solo"):
        raise SystemExit("Expected group or solo")
    path = ROOT / "data" / f"{kind}.json"
    now = dt.datetime.now(TZ)
    latest = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    saved = latest.get("date", "none")
    eligible = available_reporting_date(now).isoformat()
    count = len(latest.get("tracks") or {})
    unchanged = saved != eligible
    note = (f"{kind.upper()} | latest saved date: {saved} | "
            f"date eligible through: {eligible} | saved recordings: {count}")
    print(note, flush=True)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as file:
            file.write(f"### {kind.upper()} Spotify snapshot freshness\n\n")
            file.write(f"- Latest saved reporting date: **{saved}**\n")
            file.write(f"- Collection date eligible through: **{eligible}** (6 PM New York)\n")
            file.write(f"- Saved track IDs: **{count}**\n")
            file.write("- Status: **Pending verified new counters; retry next hour**\n\n"
                       if unchanged else "- Status: **Reporting date saved**\n\n")
    if saved == "none" or not count:
        print("::warning::No valid published Spotify track snapshot found")
    elif saved < eligible:
        print("::notice::Spotify reporting date remains pending; next scheduled check will retry. A green check is not proof of new counters.")

if __name__ == "__main__":
    main()
