from datetime import datetime, date
from typing import List, Optional, Dict, cast
from zoneinfo import ZoneInfo

from sqlalchemy import func, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from ..dtos.statistics_dto import StatisticsDTO
from ..dtos.type_dto import TypeDTO
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..models.block import Block
from ..models.type_ import Type
from ..utils import timeit

# Server timezone configuration
SERVER_TZ = ZoneInfo("Asia/Hong_Kong")
SERVER_TZ_OFFSET = 8 * 3600  # 8 hours in seconds


class StatisticsService(StatisticsServiceInterface):
    def __init__(self, engine: Engine):
        self._engine = engine

    @timeit
    def get_statistics(
        self,
        start_date: date,
        end_date: date,
        type_uids: Optional[List[int]] = None,
        time_slot_minutes: int = 30,
        hour: Optional[int] = None,
        minute: Optional[int] = None,
        day_of_week: Optional[int] = None
    ) -> List[StatisticsDTO]:
        if time_slot_minutes not in (15, 30):
            raise ValueError("time_slot_minutes must be either 15 or 30")
        
        # Only validate minute if it's provided
        if minute is not None:
            if minute % time_slot_minutes != 0:
                raise ValueError(f"minute must be a multiple of {time_slot_minutes}. currently it is {minute}")

        with Session(self._engine) as session:
            query = session.query(
                Block.type_uid,
                func.count(Block.uid).label('count')
            )

            # Add time slot filtering if specified
            if hour is not None:
                # Adjust for HK timezone (UTC+8)
                query = query.filter(
                    func.strftime(
                        '%H',
                        func.datetime(Block.date + SERVER_TZ_OFFSET, "unixepoch")
                    ) == str(hour).zfill(2)
                )
                
                if minute is not None:
                    query = query.filter(
                        func.strftime(
                            '%M', 
                            func.datetime(Block.date + SERVER_TZ_OFFSET, "unixepoch")
                        ).between(
                            str(minute).zfill(2),
                            str(minute + time_slot_minutes - 1).zfill(2)
                        )
                    )

            # Add day of week filtering if specified
            if day_of_week is not None:
                query = query.filter(
                    func.strftime(
                        '%w',
                        func.datetime(Block.date + SERVER_TZ_OFFSET, "unixepoch")
                    ) == str(day_of_week)
                )

            # Base time filtering
            query = query.filter(
                Block.date >= int(datetime.combine(start_date, datetime.min.time()).timestamp()),
                Block.date < int(datetime.combine(end_date, datetime.min.time()).timestamp())
            )

            # Type filtering
            if type_uids:
                query = query.filter(Block.type_uid.in_(type_uids))

            # Group by type
            query = query.group_by(Block.type_uid)

            # Order by duration
            query = query.order_by(text("count DESC"))

            # Print the SQL query
            print("Generated SQL:", str(query.statement.compile(compile_kwargs={"literal_binds": True})))
            print("Parameters:", {
                "start_date": start_date,
                "end_date": end_date,
                "hour": hour,
                "minute": minute,
                "time_slot_minutes": time_slot_minutes,
                "day_of_week": day_of_week
            })

            # Get types
            type_dict: Dict[int, TypeDTO] = {
                t.uid: TypeDTO(uid=t.uid, name=t.name, color=t.color, hidden=t.hidden, priority=t.priority)
                for t in session.query(Type.uid, Type.name, Type.color, Type.hidden, Type.priority).all()
            }

            # Convert to DTOs
            results = []
            for row in query.all():
                if row.type_uid in type_dict:
                    results.append(
                        StatisticsDTO(
                            type_=type_dict[row.type_uid],
                            duration=cast(float, row.count) * 0.25  # Each block is 15 minutes
                        )
                    )

            return results
