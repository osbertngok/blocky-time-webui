from datetime import datetime
from typing import List, Protocol, Tuple
from ..dtos.trenditem_dto import TrendItemDTO
from ..dtos.type_dto import TypeDTO
from enum import Enum

class TrendGroupBy(Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

class TrendServiceInterface(Protocol):

    def get_trends(self, start_date: datetime, end_date: datetime, group_by: TrendGroupBy) -> List[Tuple[TypeDTO, List[TrendItemDTO]]]:
        ...