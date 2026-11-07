# SEVENTEEN Spotify Streams

A static GitHub Pages dashboard with two Selenium collectors, dated snapshots and rankings.

## Setup
1. Create a GitHub repository and upload these files at the repository root.
2. In Settings → Pages, choose **Deploy from a branch**, `main`, `/ (root)`.
3. In Actions, enable GitHub Actions and allow workflow **Read and write permissions** (Settings → Actions → General).
4. Run **Spotify stream snapshots** manually once to establish a baseline. Scheduled checks then run at midnight KST and hourly while pending.

## Data integrity
- The two Java collectors are retained in `src/`; `tools/instrument.py` creates copies with machine-readable track metrics in `build/`.
- A run is rejected if any catalogued track is missing or zero. A matching dataset stays pending; no fake daily gain is recorded.
- The group and solo collectors have separate pending states. The website reads `data/group.json`, `data/solo.json`, and `data/history/*.json`.
- Spotify can publish stats late; the archive date is the **capture date**, not a claimed Spotify reporting date.
- A full scrape may take hours and can exceed GitHub-hosted runner limits; if that occurs, split into smaller jobs or use a self-hosted runner.
- GitHub scheduled workflows are best effort and can start late. Hourly retry means the next *scheduled attempt*, not guaranteed exact execution.
- Play counts are obtained by scraping Spotify's website; Spotify may change markup, restrict automated access, or impose terms that must be respected.
- No real stream counts are included; the dashboard stays empty until the first successful collection.

## Rankings
Album/collection totals use the original group arrays; track rankings deduplicate by Spotify track ID. Grouping titles are inferred from source comments and should be reviewed. Daily gains compare the latest snapshot with the immediately preceding archived snapshot, not necessarily the previous calendar day.

## Date and initial test
- The scheduled collector begins at **00:00 KST on November 8, 2026**, and checks hourly until each of the two collectors independently confirms new counts. GitHub schedules may start late.
- Each snapshot is labeled **two KST calendar days before collection**: November 8 KST is saved as November 6 stream data. This is a user-requested reporting convention, not an independently verified Spotify reporting guarantee.
- For the **November 7, 2026 2:15 PM New York** test (November 8, 2026 4:15 AM KST), the one-time scheduled test is eligible to run automatically if the repository is already live; otherwise trigger **Actions → Spotify stream snapshots → Run workflow** manually. This project has not been deployed or run against Spotify from this environment.
- A manual first run creates a baseline; it cannot verify that the stream counts changed without an earlier baseline.
- GitHub Actions must be enabled in a repository and the project must be pushed for any automatic run to occur.

The one-time test is scheduled for 19:15 UTC on November 7, 2026. GitHub may delay or skip scheduled runs. The workflow must already be committed to the default branch with Actions enabled for this to happen automatically.

## One-time test and daily schedule
- Nov 7, 2026 at 2:35 PM EST (19:35 UTC): one-time scheduled test (GitHub Actions schedule may be delayed).
- Daily at midnight KST (15:00 UTC): normal scheduled collection.
- Hourly at minute 15 UTC: retry only when pending.
- The scheduled workflow must be committed to the repository default branch, and Actions must be enabled. To test immediately, use Actions → Spotify stream snapshots → Run workflow.

## Imported historical Group statistics

`data/history/group-YYYY-MM-DD.json` contains 334 historical Group snapshots dated 2025-11-16 through 2026-11-04, imported from the supplied Excel workbook. The website loads archives on demand (rather than fetching hundreds of JSON files at once), and shows the newest available historical Group snapshot until a live collector produces a newer one. `history-import-report.json` records validation findings. Original spreadsheet totals were not edited; anomalous decreases are flagged and excluded from daily-growth calculations. Daily changes are shown only between adjacent calendar dates with valid nondecreasing cumulative totals. Album totals only appear when every constituent Spotify track ID can be matched unambiguously; historical track-name-only entries cannot always be matched. The spreadsheet's own date headers were preserved without applying an additional two-day offset.

**The two supplied Excel workbooks have identical SHA-256 hashes.** No separate Unit/Duo historical workbook was received. Unit/Solo history is still awaiting that different file. Run `python tools/import_history.py '/path/to/group.xlsx'` to reproduce the import. Do not treat this archive as verified live Spotify data.
