from typing import List, Protocol
from ..dtos.trenditem_dto import TrendDataDTO
from enum import Enum
from datetime import date

class TrendGroupBy(Enum):
    DAY = "DAY"
    WEEK = "WEEK"
    MONTH = "MONTH"

class TrendServiceInterface(Protocol):

    def get_trends(self, start_date: date, end_date: date, group_by: TrendGroupBy) -> List[TrendDataDTO]:
        ...