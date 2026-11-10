#!/usr/bin/env python3
"""Read-only full saved-history audit. Never replaces, invents or fills stream values.

Run in CI every ten minutes. Zero counts are valid observations.
The report page reads these same saved snapshots directly.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
TRACK_ID = re.compile(r"^[A-Za-z0-9]{22}$")


def read(path: Path) -> dict:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def snapshot_path(scope: str, day: str, legacy: set[str]) -> Path | None:
    paths = ([ROOT / f"solo-{day}.json", DATA / "history" / f"solo-{day}.json"]
             if scope == "solo" and day in legacy else
             [DATA / "history" / f"{scope}-{day}.json"])
    return next((path for path in paths if path.is_file()), None)


def audit() -> dict:
    manifest = read(DATA / "manifest.json")
    modern = {scope: read(DATA / f"{scope}.json") for scope in ("group", "solo")}
    legacy = set(manifest.get("solo_legacy_dates", []))
    dated = {"group": set(manifest.get("dates", [])),
             "solo": set(manifest.get("solo_dates", [])) | legacy}
    problems = []
    overview = {}
    newly_added = []

    for scope in ("group", "solo"):
        days = sorted(dated[scope])
        # Missing calendar days are not the same as broken JSON files.
        # Record gaps explicitly instead of silently passing the archive.
        missing_days = []
        for before, after in zip(days, days[1:]):
            try:
                current_day = dt.date.fromisoformat(before) + dt.timedelta(days=1)
                next_day = dt.date.fromisoformat(after)
                while current_day < next_day:
                    missing_days.append(current_day.isoformat())
                    current_day += dt.timedelta(days=1)
            except ValueError:
                continue
        previous = None
        all_recordings = modern[scope].get("canonical_track_ids") if scope == "group" else list(modern[scope].get("tracks", {}))
        canonical_ids = set(all_recordings or modern[scope].get("tracks", {}))
        validated = 0
        legacy_days = 0
        zero_values = 0
        for date in days:
            try:
                dt.date.fromisoformat(date)
            except ValueError:
                problems.append({"date": date, "scope": scope, "error": "Invalid manifest date"})
                continue
            if date == modern[scope].get("date"):
                snap = modern[scope]
                path = DATA / f"{scope}.json"
                saved = DATA / "history" / f"{scope}-{date}.json"
                if saved.exists() and read(saved).get("tracks") != snap.get("tracks"):
                    problems.append({"date": date, "scope": scope, "error": "Current and archived daily counts differ"})
            else:
                path = snapshot_path(scope, date, legacy)
                if path is None:
                    problems.append({"date": date, "scope": scope, "error": "Manifest lists day but snapshot file is missing"})
                    continue
                try:
                    snap = read(path)
                except (ValueError, OSError) as exc:
                    problems.append({"date": date, "scope": scope, "error": "Unreadable snapshot: " + str(exc)})
                    continue
            if snap.get("date") != date:
                problems.append({"date": date, "scope": scope, "error": "Saved date does not match manifest"})
                continue
            tracks = snap.get("tracks")
            if not isinstance(tracks, dict) or not tracks:
                problems.append({"date": date, "scope": scope, "error": "Snapshot has no track observations"})
                continue
            invalid = [track for track, value in tracks.items()
                       if isinstance(value, bool) or not isinstance(value, (int, float)) or
                       not (0 <= value < float("inf"))]
            if invalid:
                problems.append({"date": date, "scope": scope, "error": f"{len(invalid)} invalid track values",
                                 "sample": invalid[:5]})
            zero_values += sum(value == 0 for value in tracks.values())
            is_legacy = snap.get("source") == "historical spreadsheet"
            if is_legacy:
                legacy_days += 1
                # Excel row identifiers are not Spotify IDs. Never claim a
                # modern catalog is missing merely because legacy keys differ.
                if not snap.get("names"):
                    problems.append({"date": date, "scope": scope, "error": "Legacy spreadsheet lacks names"})
            else:
                if scope == "group":
                    expected = set(snap.get("canonical_track_ids") or canonical_ids)
                else:
                    # The earlier archive may predate newly released recordings.
                    # Only require tracks already stored in a comparable date.
                    expected = set(previous["tracks"]) & canonical_ids if previous and not previous.get("source") else set(tracks) & canonical_ids
                missing = expected - set(tracks)
                if missing:
                    problems.append({"date": date, "scope": scope,
                                     "error": f"{len(missing)} previously verified canonical recordings missing",
                                     "sample": sorted(missing)[:10]})
                if previous and not previous.get("source"):
                    for track in (set(tracks) & canonical_ids) - set(previous["tracks"]):
                        newly_added.append({"date": date, "scope": scope, "id": track})
            previous = snap
            validated += 1
        overview[scope] = {"listed_dates": len(days), "checked_dates": validated,
                           "missing_calendar_days": len(missing_days),
                           "missing_calendar_dates": missing_days,
                           "legacy_dates": legacy_days, "saved_zero_values": zero_values,
                           "latest_date": modern[scope].get("date"),
                           "latest_entries": len(modern[scope].get("tracks", {}))}
    # Coverage for the All view is the intersection of the independently
    # collected OT13 and Unit/Solo reporting dates.
    shared = dated["group"] & dated["solo"]
    first = min(dated["group"] | dated["solo"])
    latest = min(modern["group"].get("date", ""), modern["solo"].get("date", ""))
    day = dt.date.fromisoformat(first)
    finish = dt.date.fromisoformat(latest)
    missing_shared = []
    while day <= finish:
        if day.isoformat() not in shared:
            missing_shared.append(day.isoformat())
        day += dt.timedelta(days=1)
    weeks = []
    sunday = finish - dt.timedelta(days=(finish.weekday() + 1) % 7)
    for count in range(10):
        end = sunday - dt.timedelta(weeks=count)
        baseline = end - dt.timedelta(days=7)
        weeks.append({"ending": end.isoformat(), "baseline": baseline.isoformat(),
                      "both_boundaries_saved": end.isoformat() in shared and baseline.isoformat() in shared})
    months = []
    current_month = dt.date(finish.year, finish.month, 1)
    for count in range(12):
        last_day = current_month - dt.timedelta(days=1)
        next_month = current_month - dt.timedelta(days=1)
        begin_month = dt.date(next_month.year, next_month.month, 1)
        baseline = begin_month - dt.timedelta(days=1)
        months.append({"month": begin_month.strftime("%Y-%m"), "baseline": baseline.isoformat(),
                       "ending": last_day.isoformat(),
                       "both_boundaries_saved": baseline.isoformat() in shared and last_day.isoformat() in shared})
        current_month = begin_month
    year_coverage = {
        "first_saved_date": first, "latest_saved_date": latest,
        "shared_saved_dates": len(shared),
        "missing_shared_dates": len(missing_shared),
        "missing_shared_date_list": missing_shared,
        "latest_ten_weeks": weeks,
        "recent_twelve_completed_months": months,
    }
    return {"checked_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
            "result": "issues" if problems else "gaps recorded" if any(item["missing_calendar_days"] for item in overview.values()) else "pass",
            "overview": overview, "year_coverage": year_coverage,
            "issues": problems, "newly_added": newly_added}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="collection-audit.json")
    args = parser.parse_args()
    report = audit()
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Full archive audit: {report['result']} ({len(report['issues'])} issues)")
    for scope, item in report["overview"].items():
        print(f"{scope}: {item['checked_dates']} / {item['listed_dates']} days; "
              f"{item['latest_entries']} latest entries; {item['saved_zero_values']} valid zeros; "
              f"{item['missing_calendar_days']} unrecorded calendar dates")
    coverage = report["year_coverage"]
    print(f"All: {coverage['shared_saved_dates']} shared saved dates, "
          f"{coverage['missing_shared_dates']} dates without both archives")
    print(f"All: {sum(x['both_boundaries_saved'] for x in coverage['latest_ten_weeks'])}"
          "/10 recent weekly endpoint pairs saved")
    print(f"All: {sum(x['both_boundaries_saved'] for x in coverage['recent_twelve_completed_months'])}"
          "/12 previous complete monthly endpoint pairs saved")
    for item in report["issues"][:40]:
        print(f"ISSUE {item['date']} {item['scope']}: {item['error']}")
    summary = __import__("os").environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as file:
            file.write(f"## Saved history audit — {report['result'].upper()}\n\n")
            file.write(f"Checked {sum(x['checked_dates'] for x in report['overview'].values())} saved snapshot dates. "
                       f"Zero streams are valid observations.\n\n")
            for scope, item in report["overview"].items():
                file.write(f"- {scope}: {item['checked_dates']}/{item['listed_dates']} validated, "
                           f"{item['saved_zero_values']} zero entries.\n")
            file.write(f"- All shared archive: {coverage['shared_saved_dates']} days saved, "
                       f"{coverage['missing_shared_dates']} missing between archive endpoints.\\n")
            file.write(f"- Recent ten weekly endpoints: "
                       f"{sum(x['both_boundaries_saved'] for x in coverage['latest_ten_weeks'])}/10.\\n")
            file.write(f"- Previous twelve completed monthly endpoints: "
                       f"{sum(x['both_boundaries_saved'] for x in coverage['recent_twelve_completed_months'])}/12.\\n")
            for issue in report["issues"][:20]:
                file.write(f"- **{issue['date']} {issue['scope']}**: {issue['error']}\n")
    return 0 if not report["issues"] else 1


if __name__ == "__main__":
    sys.exit(main())
