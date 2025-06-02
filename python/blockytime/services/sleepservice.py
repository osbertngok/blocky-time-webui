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

    def get_sleep_stats(self, start_date: date, end_date: date) -> list[SleepStatsDTO]:
        with Session(self.engine) as session:
            # Calculate the Unix epoch timestamps for the boundaries
            start_timestamp, _ = self._get_date_boundaries(start_date, 18, self.timezone)
            _, end_timestamp = self._get_date_boundaries(end_date, 18, self.timezone)

            # Calculate sleep day (18:00 GMT+8 to next day 18:00 GMT+8)
            # 14 * 60 * 60 = 14 hours in seconds (18:00 GMT+8 = 10:00 UTC)
            # 24 * 60 * 60 = 24 hours in seconds
            sleep_day = (Block.date - 14 * 60 * 60) // (24 * 60 * 60)

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
