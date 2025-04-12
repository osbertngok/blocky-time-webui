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

    def _get_date_boundaries(self, date_obj: date) -> tuple[int, int]:
        """Calculate the Unix epoch timestamps for the sleep day boundaries.

        For a given date, returns:
        - start_timestamp: previous day 18:00 GMT+8 (10:00 UTC)
        - end_timestamp: current day 18:00 GMT+8 (10:00 UTC)
        """
        # Convert date to datetime at 00:00:00
        start_of_day = datetime.combine(date_obj, datetime.min.time())

        # For start_date: previous day 18:00 GMT+8 (10:00 UTC)
        start_timestamp = int(
            (start_of_day - timedelta(days=1) + timedelta(hours=10)).timestamp()
        )

        # For end_date: current day 18:00 GMT+8 (10:00 UTC)
        end_timestamp = int((start_of_day + timedelta(hours=10)).timestamp())

        return start_timestamp, end_timestamp

    def get_sleep_stats(self, start_date: date, end_date: date) -> list[SleepStatsDTO]:
        with Session(self.engine) as session:
            # Calculate the Unix epoch timestamps for the boundaries
            start_timestamp, _ = self._get_date_boundaries(start_date)
            _, end_timestamp = self._get_date_boundaries(end_date)

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
