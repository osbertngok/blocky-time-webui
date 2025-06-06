import gzip
import json
import logging
import time
from datetime import datetime
from typing import List

import pytz
from flask import Blueprint, jsonify, make_response, request

from ..dtos.statistics_dto import StatisticsDTO
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..routes.decorators import RouteReturn, inject_statisticsservice

log = logging.getLogger(__name__)

bp = Blueprint("stats", __name__)


@bp.route("/api/v1/stats", methods=["GET"])
@inject_statisticsservice
def get_stats(statistics_service: StatisticsServiceInterface) -> RouteReturn:
    """
    params: start_date, end_date (YYYY-MM-DD)
    """
    # time this function
    starting_time = time.monotonic()
    # start_date and end_date are strs in YYYY-MM-DD format
    try:
        start_date_str: str | None = request.args.get("start_date")
        if start_date_str is None:
            return jsonify({"error": "start_date is required"}), 400

        end_date_str: str | None = request.args.get("end_date")
        if end_date_str is None:
            return jsonify({"error": "end_date is required"}), 400

        # Parse dates and localize to GMT+8
        tz = pytz.timezone("Asia/Singapore")
        start_date = tz.localize(datetime.strptime(start_date_str, "%Y-%m-%d"))
        end_date = tz.localize(datetime.strptime(end_date_str, "%Y-%m-%d"))

    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    try:
        type_uids = request.args.getlist('type_uid', type=int)
        time_slot_minutes = request.args.get('time_slot_minutes', type=int, default=30)
        hour = request.args.get('hour', type=int, default=None)
        minute = request.args.get('minute', type=int, default=None)
        day_of_week = request.args.get('day_of_week', type=int, default=None)

        stats: List[StatisticsDTO] = statistics_service.get_statistics(
            start_date, end_date, type_uids if type_uids else None, time_slot_minutes, hour, minute, day_of_week
        )
        ret = {"data": [stat.to_dict() for stat in stats], "error": None}
        gzip_supported = "gzip" in request.headers.get("Accept-Encoding", "").lower()
        if gzip_supported:
            content = gzip.compress(json.dumps(ret).encode("utf-8"), 5)
        else:
            content = json.dumps(ret).encode("utf-8")
        response = make_response(content)
        response.headers["Content-Type"] = "application/json"
        response.headers["Content-Length"] = str(len(content))
        if gzip_supported:
            response.headers["Content-Encoding"] = "gzip"
        return response, 200
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"data": None, "error": str(e)}), 500
    finally:
        ending_time = time.monotonic()
        log.info(f"get_stats took {ending_time - starting_time} seconds")
