from datetime import datetime
from typing import List

from sqlalchemy import func
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from ..dtos.statistics_dto import StatisticsDTO
from ..dtos.type_dto import TypeDTO
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..models.block import Block
from ..models.type_ import Type


class StatisticsService(StatisticsServiceInterface):
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_statistics(
        self, start_date: datetime, end_date: datetime
    ) -> List[StatisticsDTO]:
        with Session(self._engine) as session:
            # Convert timezone-aware datetime to UTC timestamp
            start_ts = int(start_date.timestamp())
            end_ts = int(end_date.timestamp())
            results = (
                session.query(
                    Type.uid.label("uid"),
                    Type.name.label("name"),
                    Type.color.label("color"),
                    Type.hidden.label("hidden"),
                    Type.priority.label("priority"),
                    (func.count(Block.date) * 0.25).label("duration"),
                )
                .join(Type, Block.type_uid == Type.uid)
                .filter(Block.date >= start_ts, Block.date < end_ts)
                .group_by(Block.type_uid)
                .order_by((func.count(Block.date) * 0.25).label("duration").desc())
                .all()
            )
            return [
                StatisticsDTO(
                    type_=TypeDTO(
                        uid=row.uid,
                        name=row.name,
                        color=row.color,
                        hidden=row.hidden,
                        priority=row.priority,
                    ),
                    duration=row.duration,
                )
                for row in results
            ]
