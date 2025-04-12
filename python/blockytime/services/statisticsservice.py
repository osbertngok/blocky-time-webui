from datetime import datetime, date
from typing import List, Optional, Dict

from sqlalchemy import func, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from ..dtos.statistics_dto import StatisticsDTO
from ..dtos.type_dto import TypeDTO
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..models.block import Block
from ..models.type_ import Type
from ..utils import timeit


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
        minute: Optional[int] = None
    ) -> List[StatisticsDTO]:
        if time_slot_minutes not in (15, 30):
            raise ValueError("time_slot_minutes must be either 15 or 30")
        
        if minute is not None and minute % time_slot_minutes != 0:
            raise ValueError(f"minute must be a multiple of {time_slot_minutes}")

        with Session(self._engine) as session:
            query = session.query(
                Block.type_uid,
                func.count(Block.uid).label('count')
            )

            # Base time filtering
            query = query.filter(
                Block.date >= int(datetime.combine(start_date, datetime.min.time()).timestamp()),
                Block.date < int(datetime.combine(end_date, datetime.min.time()).timestamp())
            )

            # Add time slot filtering if specified
            if hour is not None:
                query = query.filter(
                    func.strftime('%H', func.datetime(Block.date, 'unixepoch')) == str(hour).zfill(2)
                )
                
                if minute is not None:
                    query = query.filter(
                        func.strftime(
                            '%M', 
                            func.datetime(Block.date, 'unixepoch')
                        ).between(
                            str(minute).zfill(2),
                            str(minute + time_slot_minutes - 1).zfill(2)
                        )
                    )

            # Type filtering
            if type_uids:
                query = query.filter(Block.type_uid.in_(type_uids))

            # Group by type
            query = query.group_by(Block.type_uid)

            # Order by duration
            query = query.order_by(text("count DESC"))
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
                            duration=row.count * 0.25  # Each block is 15 minutes
                        )
                    )

            return results
