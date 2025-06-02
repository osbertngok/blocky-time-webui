from datetime import date, datetime, timedelta
from typing import cast

import pytz
from blockytime.models.block import Block
from blockytime.models.type_ import Type
from sqlalchemy import func
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from ..dtos.sleep_dto import SleepStatsDTO
from ..interfaces.sleepserviceinterface import SleepServiceInterface
import numpy as np
from typing import List


class SleepService(SleepServiceInterface):

    def __init__(self, engine: Engine):
        self.engine = engine
        self.timezone = pytz.timezone("Asia/Shanghai")

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
        # Create naive datetime at 00:00:00
        naive_start_of_day = datetime.combine(date_obj, datetime.min.time())
        
        # Get UTC offset for this date
        utc_offset = timezone.utcoffset(naive_start_of_day).total_seconds() / 3600

        # For start_date: previous day cut_off_hour:00 in local time
        start_timestamp = int(
            (naive_start_of_day - timedelta(days=1) + timedelta(hours=cut_off_hour - utc_offset)).timestamp()
        )

        # For end_date: current day cut_off_hour:00 in local time
        end_timestamp = int((naive_start_of_day + timedelta(hours=cut_off_hour - utc_offset)).timestamp())

        return start_timestamp, end_timestamp

    def get_sleep_stats(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> list[SleepStatsDTO]:
        with Session(self.engine) as session:
            # Convert datetime to date for boundary calculation
            start_date_obj = start_date.date()
            end_date_obj = end_date.date()
            
            # Calculate the Unix epoch timestamps for the boundaries
            start_timestamp, _ = self._get_date_boundaries(start_date_obj, 18, self.timezone)
            _, end_timestamp = self._get_date_boundaries(end_date_obj, 18, self.timezone)

            # Calculate sleep day (18:00 GMT+8 to next day 18:00 GMT+8)
            # 14 * 60 * 60 = 14 hours in seconds (18:00 GMT+8 = 10:00 UTC)
            # 24 * 60 * 60 = 24 hours in seconds
            utc_offset = int(self.timezone.utcoffset(datetime.now()).total_seconds() / 3600)
            sleep_day_offset = (24 - 18 + utc_offset) * 3600  # Convert hours to seconds
            sleep_day = (Block.date - sleep_day_offset) // (24 * 60 * 60)

            results = (
                session.query(
                    sleep_day.label("sleep_day"),
                    func.min(Block.date).label("min_date"),
                    func.max(Block.date).label("max_date"),
                    (func.max(Block.date) - func.min(Block.date)).label("duration"),
                    func.count(Block.date).label("count"),
                )
                .join(Type, Block.type_uid == Type.uid)
                .filter(
                    Block.date >= start_timestamp,
                    Block.date < end_timestamp,
                    Type.name == "Sleep",
                )
                .group_by(sleep_day)
                .all()
            )

            # Convert results to SleepStatsDTO
            return [
                SleepStatsDTO(
                    date=row.sleep_day,
                    start_time=row.min_date,
                    end_time=row.max_date,
                    duration=row.duration / 3600.0,  # Convert seconds to hours
                )
                for row in results
                if row.duration / 3600.0 - cast(float, row.count) * 0.25 <= 1.0
            ]

    def calculate_sleep_stats(
        self,
        start_date: datetime,
        end_date: datetime,
        decay_factor: float = 0.1,
        window_size: int = 7,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
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
                end_hours
            )
        """
        # Get sleep stats from service
        sleep_stats: List[SleepStatsDTO] = self.get_sleep_stats(start_date, end_date)

        # Extract sleep durations
        sime_day_tuple = [
            (
                stat.date,
                ((stat.start_time + self.timezone.utcoffset(datetime.now()).total_seconds() - 8 * 3600) % (24 * 3600)) / 3600.0 + 8,  # hour in GMT+8, [8, 24+8)
                ((stat.end_time + self.timezone.utcoffset(datetime.now()).total_seconds() - 14 * 3600) % (24 * 3600)) / 3600.0 + 14,  # hour in GMT+8, [14, 24+14)
                stat.duration,
            )
            for stat in sleep_stats
        ]

        # Filtering
        sime_day_tuple = [
            (date, start_hour, end_hour, duration)
            for date, start_hour, end_hour, duration in sime_day_tuple
            if start_hour > 20.0 and end_hour > 27.0  # (20, 31) ~ 8PM - 7AM, (27, 37) ~ 3AM - 1PM
        ]

        # Sort by date
        sime_day_tuple.sort(key=lambda x: x[0])

        # Separate dates and hours
        dates = np.array([x[0] for x in sime_day_tuple])
        start_hours = np.array([x[1] for x in sime_day_tuple])
        end_hours = np.array([x[2] for x in sime_day_tuple])
        durations = np.array([x[3] for x in sime_day_tuple])

        def ewma(data):
            weights = np.array([decay_factor**i for i in range(window_size)][::-1])
            weights = weights / weights.sum()  # Normalize weights to sum to 1
            return np.convolve(data, weights, mode="valid")

        start_moving_avg = ewma(start_hours)
        end_moving_avg = ewma(end_hours)
        duration_moving_avg = ewma(durations)
        moving_avg_dates = dates[window_size - 1 :]  # Align dates with moving average

        return start_moving_avg, end_moving_avg, duration_moving_avg, moving_avg_dates, start_hours, end_hours
