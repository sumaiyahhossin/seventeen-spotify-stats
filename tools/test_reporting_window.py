#!/usr/bin/env python3
"""Deterministic tests for Spotify collection eligibility and cross-midnight retry."""
import datetime as dt
import unittest
from zoneinfo import ZoneInfo

from reporting_window import available_reporting_date, oldest_due_date

NY = ZoneInfo("America/New_York")


def moment(year, month, day, hour, minute=0):
    return dt.datetime(year, month, day, hour, minute, tzinfo=NY)


class ReportingWindowTests(unittest.TestCase):
    def test_same_day_eligible_at_two_pm(self):
        self.assertEqual(available_reporting_date(moment(2026, 11, 10, 13, 59)),
                         dt.date(2026, 11, 9))
        self.assertEqual(available_reporting_date(moment(2026, 11, 10, 14)),
                         dt.date(2026, 11, 10))
        self.assertEqual(oldest_due_date(dt.date(2026, 11, 9), moment(2026, 11, 10, 14)),
                         dt.date(2026, 11, 10))

    def test_never_advance_before_spotify_window(self):
        self.assertIsNone(oldest_due_date(dt.date(2026, 11, 9),
                                         moment(2026, 11, 10, 13, 59)))
        self.assertIsNone(oldest_due_date(dt.date(2026, 11, 10),
                                         moment(2026, 11, 10, 15)))

    def test_retries_across_midnight_with_oldest_pending(self):
        self.assertEqual(oldest_due_date(dt.date(2026, 11, 8),
                                         moment(2026, 11, 11, 1)),
                         dt.date(2026, 11, 9))
        self.assertEqual(oldest_due_date(dt.date(2026, 11, 9),
                                         moment(2026, 11, 11, 1)),
                         dt.date(2026, 11, 10))
        self.assertEqual(oldest_due_date(dt.date(2026, 11, 10),
                                         moment(2026, 11, 11, 1)), None)

    def test_saved_date_stops_retries_until_next_day_two_pm(self):
        # Once Nov 10 is saved, no more collections for it overnight,
        # and the Nov 11 report cannot open before 2 PM local time.
        saved=dt.date(2026, 11, 10)
        for day,hour in [(10,14),(10,23),(11,0),(11,1),(11,13)]:
            self.assertIsNone(oldest_due_date(saved,moment(2026,11,day,hour)))
        self.assertEqual(oldest_due_date(saved,moment(2026,11,11,14)),
                         dt.date(2026,11,11))
        # If Nov 10 was NOT saved, midnight does not cancel its retries.
        self.assertEqual(oldest_due_date(dt.date(2026,11,9),
                                         moment(2026,11,11,0)),
                         dt.date(2026,11,10))
        self.assertEqual(oldest_due_date(dt.date(2026,11,9),
                                         moment(2026,11,11,13,59)),
                         dt.date(2026,11,10))

    def test_dst_spring_and_fall_cutoffs(self):
        for year, month, day in [(2026, 3, 8), (2026, 11, 1)]:
            date=dt.date(year,month,day)
            self.assertEqual(available_reporting_date(moment(year,month,day,13,59)),
                             date-dt.timedelta(days=1))
            self.assertEqual(available_reporting_date(moment(year,month,day,14)),
                             date)

    def test_utc_input_uses_new_york_cutoff(self):
        utc = dt.timezone.utc
        self.assertEqual(available_reporting_date(
            dt.datetime(2026,11,10,18,59,tzinfo=utc)),dt.date(2026,11,9))
        self.assertEqual(available_reporting_date(
            dt.datetime(2026,11,10,19,0,tzinfo=utc)),dt.date(2026,11,10))

    def test_timezone_required(self):
        with self.assertRaises(ValueError):
            available_reporting_date(dt.datetime(2026,11,10,14))


if __name__ == "__main__":
    unittest.main()
