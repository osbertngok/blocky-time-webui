from datetime import date
from blockytime.dtos.sleep_dto import SleepStatsDTO
from typing import Protocol

class SleepServiceInterface(Protocol):

    def get_sleep_stats(self, start_date: date, end_date: date) -> list[SleepStatsDTO]:
        ...