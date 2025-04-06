from dataclasses import dataclass
from datetime import datetime, date

@dataclass
class SleepStatsDTO:
    date: int # num of dates since 1970-01-01
    start_time: int # num of seconds since 1970-01-01
    end_time: int # num of seconds since 1970-01-01
    duration: float # in hours
