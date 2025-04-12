from datetime import datetime
from typing import List, Protocol

from ..dtos.statistics_dto import StatisticsDTO


class StatisticsServiceInterface(Protocol):

    def get_statistics(
        self, start_date: datetime, end_date: datetime
    ) -> List[StatisticsDTO]: ...
