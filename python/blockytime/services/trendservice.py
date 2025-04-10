from ..interfaces.trendserviceinterface import TrendServiceInterface
from ..dtos.type_dto import TypeDTO
from ..dtos.trenditem_dto import TrendItemDTO
from datetime import datetime
from typing import List, Tuple
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from ..interfaces.trendserviceinterface import TrendGroupBy
from ..models.block import Block
from ..models.type_ import Type
from sqlalchemy import func

class TrendService(TrendServiceInterface):

    def __init__(self, engine: Engine):
        self._engine = engine

    def get_trends(self, start_date: datetime, end_date: datetime, group_by: TrendGroupBy) -> List[Tuple[TypeDTO, List[TrendItemDTO]]]:
        with Session(self._engine) as session:
            start_ts = int(start_date.timestamp())
            end_ts = int(end_date.timestamp())
            if group_by == TrendGroupBy.DAY:
                results = session.query(
                    Type.uid, 
                    Type.name, 
                    Type.color, 
                    Type.hidden, 
                    Type.priority,
                    func.strftime('%Y-%m-%d', func.datetime(Block.date, 'unixepoch')).label("time"),
                    func.sum(Block.duration).label("duration")) \
                .join(Block, Type.uid == Block.type_uid) \
                .where(Block.date >= start_ts, Block.date < end_ts) \
                .group_by(Type.uid, "time") \
                .order_by("time") \
                .all()
            elif group_by == TrendGroupBy.WEEK:
                results = session.query(
                    Type.uid, 
                    Type.name, 
                    Type.color, 
                    Type.hidden, 
                    Type.priority,
                    func.strftime('%Y-%m-%d', func.datetime((Block.date - 8 * 60 * 60) // (7 * 24 * 60 * 60) * 7 * 24 * 60 * 60, 'unixepoch')).label("time"),
                    func.sum(Block.duration).label("duration")) \
                .join(Block, Type.uid == Block.type_uid) \
                .where(Block.date >= start_ts, Block.date < end_ts) \
                .group_by(Type.uid, "time") \
                .order_by("time") \
                .all()
            elif group_by == TrendGroupBy.MONTH:
                results = session.query(
                    Type.uid, 
                    Type.name, 
                    Type.color, 
                    Type.hidden, 
                    Type.priority,
                    func.strftime('%Y-%m', func.datetime(Block.date - 8 * 60 * 60, 'unixepoch')).label("time"),
                    func.sum(Block.duration).label("duration")) \
                .join(Block, Type.uid == Block.type_uid) \
                .where(Block.date >= start_ts, Block.date < end_ts) \
                .group_by(Type.uid, "time") \
                .order_by("time") \
                .all()

        return [TrendItemDTO(
            time_label=row.time,
            type_=TypeDTO(
                uid=row.uid,
                name=row.name,
                color=row.color,
                hidden=row.hidden,
                priority=row.priority,
            ),
            duration=row.duration
        ) for row in results]