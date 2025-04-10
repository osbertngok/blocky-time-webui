from ..interfaces.trendserviceinterface import TrendServiceInterface
from ..dtos.trenditem_dto import TrendDataDTO, TrendDataPoint
from datetime import datetime
from typing import List, Callable
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from ..interfaces.trendserviceinterface import TrendGroupBy
from ..models.block import Block
from ..models.type_ import Type
from sqlalchemy import func, literal, and_
from enum import Enum
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.engine import Row
from ..dtos.type_dto import TypeDTO
from zoneinfo import ZoneInfo

from datetime import date

# Server timezone configuration
SERVER_TZ = ZoneInfo('Asia/Hong_Kong')
SERVER_TZ_OFFSET = 8 * 3600  # 8 hours in seconds

def get_local_midnight_timestamp(d: date, tz: ZoneInfo = SERVER_TZ) -> int:
    """
    Get Unix timestamp for midnight (00:00:00) of given date in server timezone.
    """
    return int(
        datetime.combine(d, datetime.min.time())
        .replace(tzinfo=tz)
        .timestamp()
    )

def get_trend_data(
    session,
    start_ts: int,
    end_ts: int,
    time_formatter: Callable[[ColumnElement], ColumnElement]
) -> List[Row]:
    """
    Get trend data with customizable time grouping.
    
    Args:
        session: SQLAlchemy session
        start_ts: Start timestamp
        end_ts: End timestamp
        time_formatter: Function that formats Block.date into desired grouping format
            e.g., for daily: lambda d: func.strftime('%Y-%m-%d', func.datetime(d, 'unixepoch'))
            e.g., for monthly: lambda d: func.strftime('%Y-%m-01', func.datetime(d, 'unixepoch'))
    """
    # First, create a subquery for all possible dates in the range
    date_series = session.query(
        time_formatter(Block.date).label("time")
    ) \
    .where(Block.date >= start_ts, Block.date < end_ts) \
    .group_by("time") \
    .subquery()

    # Then, create a subquery for all types
    types = session.query(Type) \
        .subquery()

    # Create a cross join between dates and types to get all possible combinations
    base = session.query(
        date_series.c.time,
        types.c.uid,
        types.c.name,
        types.c.color,
        types.c.hidden,
        types.c.priority
    ) \
    .select_from(date_series) \
    .join(types, literal(1) == literal(1)) \
    .subquery()

    # Finally, left join with actual block counts
    return session.query(
        base.c.uid.label("type_uid"),
        base.c.name.label("type_name"),
        base.c.color.label("type_color"),
        base.c.hidden.label("type_hidden"),
        base.c.priority.label("type_priority"),
        base.c.time.label("time_label"),
        func.coalesce(
            (func.count(Block.uid) * 0.25),
            literal(0.0)
        ).label("duration")
    ) \
    .outerjoin(
        Block,
        and_(
            Block.type_uid == base.c.uid,
            time_formatter(Block.date) == base.c.time,
            Block.date >= start_ts,
            Block.date < end_ts
        )
    ) \
    .group_by(base.c.uid, base.c.time) \
    .order_by(base.c.time, base.c.priority.desc()) \
    .all()

class TrendService(TrendServiceInterface):

    def __init__(self, engine: Engine):
        self._engine = engine

    def get_trends(self, start_date: date, end_date: date, group_by: TrendGroupBy) -> List[TrendDataDTO]:
        """
        Get trends data grouped by the specified time period.
        
        Args:
            start_date: Start date
            end_date: End date
            group_by: TrendGroupBy enum specifying how to group the data
        """
        start_ts = get_local_midnight_timestamp(start_date)
        end_ts = get_local_midnight_timestamp(end_date)

        with Session(self._engine) as session:
            time_formatters = {
                TrendGroupBy.DAY: lambda d: func.strftime(
                    '%Y-%m-%d', 
                    func.datetime(d + SERVER_TZ_OFFSET, 'unixepoch')
                ),
                TrendGroupBy.WEEK: lambda d: func.strftime(
                    '%Y-%W-1', 
                    func.datetime(d + SERVER_TZ_OFFSET, 'unixepoch')
                ),
                TrendGroupBy.MONTH: lambda d: func.strftime(
                    '%Y-%m-01', 
                    func.datetime(d + SERVER_TZ_OFFSET, 'unixepoch')
                )
            }

            results: List[Row] = get_trend_data(
                session,
                start_ts,
                end_ts,
                time_formatters[group_by]
            )

            # Process results into TrendData format
            trends_by_type = {}
            type_dict = {}
            for r in results:
                if r.type_uid not in trends_by_type:
                    trends_by_type[r.type_uid] = []
                    type_dict[r.type_uid] = TypeDTO(
                        uid=r.type_uid,
                        name=r.type_name,
                        color=r.type_color,
                        hidden=r.type_hidden,
                        priority=r.type_priority,
                        projects=[]
                    )
                
                trends_by_type[r.type_uid].append(TrendDataPoint(
                    time_label=r.time_label,
                    duration=r.duration
                ))

            return [
                TrendDataDTO(type_=type_dict[type_uid], items=items)
                for type_uid, items in sorted(trends_by_type.items())
            ]
