"""Shared New York reporting-date rules for the Spotify collectors.

A same-day observation becomes eligible at 2 PM New York time.
Publishing still requires a verified change in Spotify's actual counters.
Earlier pending dates are never skipped.
"""
import datetime as dt
from zoneinfo import ZoneInfo

NEW_YORK = ZoneInfo("America/New_York")
CUTOFF_HOUR = 14


def available_reporting_date(at: dt.datetime) -> dt.date:
    if at.tzinfo is None or at.utcoffset() is None:
        raise ValueError("Reporting time must have a timezone")
    local = at.astimezone(NEW_YORK)
    return local.date() if local.hour >= CUTOFF_HOUR else local.date() - dt.timedelta(days=1)


def oldest_due_date(latest: dt.date | None, at: dt.datetime) -> dt.date | None:
    eligible = available_reporting_date(at)
    pending = latest + dt.timedelta(days=1) if latest is not None else eligible
    return pending if pending <= eligible else None
