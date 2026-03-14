import logging
import time
from typing import List

from flask import Blueprint, jsonify, request

from ..dtos.statistics_dto import StatisticsDTO
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..routes.decorators import (
    RouteReturn,
    inject_statisticsservice,
    make_gzip_json_response,
    parse_date_range_params,
)

log = logging.getLogger(__name__)

bp = Blueprint("stats", __name__)


@bp.route("/api/v1/stats", methods=["GET"])
@inject_statisticsservice
def get_stats(statistics_service: StatisticsServiceInterface) -> RouteReturn:
    """
    params: start_date, end_date (YYYY-MM-DD)
    """
    starting_time = time.monotonic()
    try:
        start_date, end_date = parse_date_range_params()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    try:
        type_uids = request.args.getlist("type_uid", type=int)
        time_slot_minutes = request.args.get("time_slot_minutes", type=int, default=30)
        hour = request.args.get("hour", type=int, default=None)
        minute = request.args.get("minute", type=int, default=None)
        day_of_week = request.args.get("day_of_week", type=int, default=None)

        stats: List[StatisticsDTO] = statistics_service.get_statistics(
            start_date,
            end_date,
            type_uids if type_uids else None,
            time_slot_minutes,
            hour,
            minute,
            day_of_week,
        )
        return make_gzip_json_response([stat.to_dict() for stat in stats])
    except Exception as e:
        log.error("get_stats failed", exc_info=True)
        return jsonify({"data": None, "error": str(e)}), 500
    finally:
        log.info(f"get_stats took {time.monotonic() - starting_time} seconds")
