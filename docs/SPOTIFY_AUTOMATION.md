# SEVENTEEN Spotify Stats — automation runbook

## Daily schedule (America/New_York)

**6:00 PM New York time** is the first eligible collection time for the **previous calendar day's** Spotify reporting date. All date calculations use America/New_York, including daylight-saving time.

The Actions scheduler checks once per hour. Before 6 PM, it does not open a new reporting day; it only retries any earlier date that is still outstanding. Once a date has been verified and saved, that dataset stops collecting until another reporting date becomes eligible. GitHub may start scheduled jobs a few minutes late.

## The three steps in “Spotify stream snapshots”

1. **Preflight:** determine whether group, solo, or both are due. Run deterministic cutoff, time-zone, DST and midnight tests; validate existing JSON and Python syntax before expensive Selenium collection.
2. **Independent collectors:** group and solo run as separate jobs. For each song, make three page attempts. If Spotify still supplies no verified count, save **0 for that date**, add the track to `unavailable_tracks`, then validate and publish the other songs to main. A missing-value zero is not a verified stream total, and is excluded from daily/period gains. A failed solo job must not block verified group data from being published.
3. **Freshness summary:** show the latest saved reporting date for each dataset, and whether the expected date remains pending. The workflow can complete without producing a new day if Spotify has not published refreshed numbers for any comparable track. Look at the saved date, not just the green check.

## Followers

The 18 solo/unit Spotify artist-profile followers are a separate, independently scheduled workflow. Their reporting cutoff also starts at 6 PM NY. It retries missing exact follower readings rather than inventing counts or converting shortened follower badges into precise integers.

## Publishing to the website

“Deploy SEVENTEEN Spotify Stats to GitHub Pages” runs for site changes and when collectors complete. It deploys the latest main branch even when one collector job fails, provided verified files changed.

Before uploading, it checks saved JSON and JavaScript syntax. **After** GitHub Pages reports a deployment, `tools/verify_published_site.py` checks the live website, not just the repository, for both exact group/solo track data and the history manifest. A live mismatch makes the deployment workflow fail visibly.

## Automatic overdue warning

If the previous day's report is still missing at **10:00 PM New York time** (four hours after the 6 PM cutoff), the collection freshness check turns red and identifies the affected dataset. The overdue signal remains active across midnight until the reporting date is saved. Track-level missing values are explicitly marked zero placeholders after three unsuccessful attempts, not claimed as measured streams.

## If the latest date is missing

- Inspect **Spotify stream snapshots** and expand the affected group or solo collection job.
- Look for `STAT_TRACK_UNAVAILABLE` and its Spotify track ID. After three unsuccessful page attempts, publish zero for the missing song for that reporting date and mark it in `unavailable_tracks`; never pretend it was a measured Spotify zero.
- The system retries the oldest missing reporting date; later dates must not silently replace it.
- Inspect the **Deploy SEVENTEEN Spotify Stats to GitHub Pages** run separately. A committed JSON snapshot is not proof that the public website is serving it.
- The latest dates can differ between group and solo while an individual dataset is retrying.

Never copy yesterday's count into a new day. A failed track is saved as **0 with unavailable metadata** after three attempts; exclude it from stream-growth calculations and flag totals as partial.
