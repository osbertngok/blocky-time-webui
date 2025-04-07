from datetime import date
from typing import Protocol

from blockytime.dtos.sleep_dto import SleepStatsDTO


class SleepServiceInterface(Protocol):

    def get_sleep_stats(
        self, start_date: date, end_date: date
    ) -> list[SleepStatsDTO]: ...
