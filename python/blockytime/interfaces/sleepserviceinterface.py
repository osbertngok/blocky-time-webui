from datetime import date, datetime
from typing import Protocol
import numpy as np

from blockytime.dtos.sleep_dto import SleepStatsDTO
import pytz


class SleepServiceInterface(Protocol):

    def _get_date_boundaries(
        self, 
        date_obj: date, 
        cut_off_hour: int,
        timezone: pytz.BaseTzInfo
    ) -> tuple[int, int]:
        """Calculate the Unix epoch timestamps for the sleep day boundaries.

        For a given date, returns:
        - start_timestamp: previous day {cut_off_hour}:00 in specified timezone
        - end_timestamp: current day {cut_off_hour}:00 in specified timezone

        Args:
            date_obj: The date to calculate boundaries for
            cut_off_hour: The hour in local time to use as the boundary (0-23)
            timezone: The timezone to use for the cut-off time
        """
        ...

    def calculate_sleep_stats(
        self,
        start_date: date,
        end_date: date,
        cut_off_hour: int,
        timezone: pytz.BaseTzInfo,
        start_time_cut_off_hour: int,
        end_time_cut_off_hour: int,
        filter_start_time_after: float,
        filter_end_time_after: float,
        decay_factor: float = 0.1,
        window_size: int = 7,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Calculate sleep statistics with moving averages.

        Args:
            start_date: Start date for sleep stats
            end_date: End date for sleep stats
            decay_factor: Decay factor for exponential weighted moving average
            window_size: Window size for moving average calculation

        Returns:
            Tuple of (
                start_moving_avg,
                end_moving_avg,
                duration_moving_avg,
                moving_avg_dates,
                start_hours,
                end_hours,
                dates
            )
        """
        ...