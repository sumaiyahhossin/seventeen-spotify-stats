"""Shared New York reporting-date rules for the Spotify collectors.

Spotify reporting dates trail the New York collection date by one day.
A reporting date first becomes eligible at 2 PM on the following calendar day.
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
    lag = 1 if local.hour >= CUTOFF_HOUR else 2
    return local.date() - dt.timedelta(days=lag)


def oldest_due_date(latest: dt.date | None, at: dt.datetime) -> dt.date | None:
    eligible = available_reporting_date(at)
    pending = latest + dt.timedelta(days=1) if latest is not None else eligible
    return pending if pending <= eligible else None
