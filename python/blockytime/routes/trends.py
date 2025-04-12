import gzip
import json
import logging
import time
from datetime import datetime
from typing import List, Tuple

import pytz
from flask import Blueprint, jsonify, make_response, request

from ..dtos.trenditem_dto import TrendItemDTO
from ..dtos.type_dto import TypeDTO
from ..interfaces.trendserviceinterface import TrendGroupBy, TrendServiceInterface
from ..routes.decorators import RouteReturn, inject_trendservice

log = logging.getLogger(__name__)


bp = Blueprint("trends", __name__)


@bp.route("/api/v1/trends", methods=["GET"])
@inject_trendservice
def get_trends(trend_service: TrendServiceInterface) -> RouteReturn:
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

        group_by: str | None = request.args.get("group_by")
        if group_by is None:
            return jsonify({"error": "group_by is required"}), 400

        try:
            group_by_enum: TrendGroupBy = TrendGroupBy(group_by)
        except ValueError:
            return jsonify({"error": f"Invalid group_by: {group_by}"}), 400

        # Parse dates and localize to GMT+8
        tz = pytz.timezone("Asia/Singapore")
        start_date = tz.localize(datetime.strptime(start_date_str, "%Y-%m-%d"))
        end_date = tz.localize(datetime.strptime(end_date_str, "%Y-%m-%d"))

    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    try:
        trends: List[Tuple[TypeDTO, List[TrendItemDTO]]] = trend_service.get_trends(
            start_date, end_date, group_by_enum
        )
        ret = {"data": [trend.to_dict() for trend in trends], "error": None}
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
        return jsonify({"data": None, "error": str(e)}), 500
    finally:
        ending_time = time.monotonic()
        log.info(f"get_trends took {ending_time - starting_time} seconds")
