from datetime import date
from typing import List, Optional, Protocol

from ..dtos.statistics_dto import StatisticsDTO


class StatisticsServiceInterface(Protocol):

    def get_statistics(
        self,
        start_date: date,
        end_date: date,
        type_uids: Optional[List[int]] = None,
        time_slot_minutes: int = 30,  # Support 15 or 30 minutes
        hour: Optional[int] = None,   # 0-23
        minute: Optional[int] = None  # 0-59, must be multiple of time_slot_minutes
    ) -> List[StatisticsDTO]:
        """
        Get statistics for a date range, optionally filtered by type and time slot.

        Args:
            start_date: Start date inclusive
            end_date: End date exclusive
            type_uids: Optional list of type UIDs to filter by
            time_slot_minutes: Size of time slot (15 or 30 minutes)
            hour: Optional hour to filter (0-23)
            minute: Optional minute to filter (must be multiple of time_slot_minutes)

        Returns:
            List of StatisticsDTO with duration and type information
        
        Raises:
            ValueError: If time_slot_minutes is not 15 or 30, or if minute is not a multiple
                      of time_slot_minutes
        """
        ...
