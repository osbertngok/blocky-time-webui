from datetime import date, datetime
from typing import Any, Dict, List, cast
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, literal
from sqlalchemy.engine import Engine, Row
from sqlalchemy.orm import Session

from ..dtos.trenditem_dto import TrendDataDTO, TrendDataPoint
from ..dtos.type_dto import TypeDTO
from ..interfaces.trendserviceinterface import TrendGroupBy, TrendServiceInterface
from ..models.block import Block
from ..models.type_ import Type
from ..utils import timeit

# Server timezone configuration
SERVER_TZ = ZoneInfo("Asia/Hong_Kong")
SERVER_TZ_OFFSET = 8 * 3600  # 8 hours in seconds


def get_local_midnight_timestamp(d: date, tz: ZoneInfo = SERVER_TZ) -> int:
    """
    Get Unix timestamp for midnight (00:00:00) of given date in server timezone.
    """
    return int(datetime.combine(d, datetime.min.time()).replace(tzinfo=tz).timestamp())

@timeit
def get_trend_data(
    session: Session,
    start_ts: int,
    end_ts: int,
    time_format_str: str,
) -> List[Row[Any]]:
    """
    Get trend data with customizable time grouping.

    Args:
        session: SQLAlchemy session
        start_ts: Start timestamp
        end_ts: End timestamp
        time_format_str: Format string for the time grouping
            e.g., for daily: "%Y-%m-%d"
            e.g., for weekly: "%Y-%W-1"
            e.g., for monthly: "%Y-%m-01"
    """
    # First, create a subquery for all possible dates in the range
    date_series = (
        session.query(
            func.strftime(
                time_format_str,
                func.datetime(Block.date + SERVER_TZ_OFFSET, "unixepoch"),
            ).label("time")
        )
        .where(Block.date >= start_ts, Block.date < end_ts)
        .group_by("time")
        .subquery()
    )

    # Then, create a subquery for all types
    types = session.query(Type).subquery()

    # Create a cross join between dates and types to get all possible combinations
    base = (
        session.query(
            types.c.uid,
            date_series.c.time,
        )
        .select_from(date_series)
        .join(types, literal(1) == literal(1))
        .order_by(types.c.uid, date_series.c.time)
        .subquery()
    )

    # As for Blocks, let's group them by type and date.
    blocks = (
        session.query(
            Block.type_uid.label("type_uid"),
            func.strftime(
                    time_format_str,
                    func.datetime(Block.date + SERVER_TZ_OFFSET, "unixepoch")
                ).label("time_label"),
            func.coalesce((func.count(Block.uid) * 0.25), literal(0.0)).label(
                "duration"
            ),
        )
        .group_by(
            Block.type_uid,
            "time_label"
        )
        .order_by(
            Block.type_uid,
            "time_label"
        )
        .subquery()
    )
    # Finally, left join with actual block counts
    results = (
        session.query(
            base.c.uid.label("type_uid"),
            base.c.time.label("time_label"),
            func.coalesce((func.sum(blocks.c.duration)), literal(0.0)).label(
                "duration"
            ),
        )
        .outerjoin(
            blocks,
            and_(
                blocks.c.type_uid == base.c.uid,
                blocks.c.time_label == base.c.time
            )
        )
        .group_by(base.c.uid, base.c.time)
        .order_by(base.c.uid, base.c.time)
        .all()
    )

    return cast(List[Row[Any]], results)


class TrendService(TrendServiceInterface):

    def __init__(self, engine: Engine):
        self._engine = engine

    def get_trends(
        self, start_date: date, end_date: date, group_by: TrendGroupBy
    ) -> List[TrendDataDTO]:
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

            time_format_str = {
                TrendGroupBy.DAY: "%Y-%m-%d",
                TrendGroupBy.WEEK: "%Y-%W-1",
                TrendGroupBy.MONTH: "%Y-%m-01",
            }

            results = get_trend_data(
                session, start_ts, end_ts, time_format_str[group_by]
            )

            # Process results into TrendData format
            trends_by_type: Dict[int, List[TrendDataPoint]] = {}
            type_dict: Dict[int, TypeDTO] = {
                t.uid: TypeDTO(uid=t.uid, name=t.name, color=t.color, hidden=t.hidden, priority=t.priority, projects=[])
                for t in session.query(Type.uid, Type.name, Type.color, Type.hidden, Type.priority).all()
            } # Just to ensure no projects is loaded. We dont' need that here.
            for r in results:
                if r.type_uid not in trends_by_type:
                    trends_by_type[r.type_uid] = []

                trends_by_type[r.type_uid].append(
                    TrendDataPoint(time_label=r.time_label, duration=r.duration)
                )

            return [
                TrendDataDTO(type_=type_dict[type_uid], items=items)
                for type_uid, items in sorted(trends_by_type.items())
            ]
