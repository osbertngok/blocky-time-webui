import logging
import time
from typing import List

from flask import Blueprint, jsonify, request

from ..dtos.trenditem_dto import TrendDataDTO
from ..interfaces.trendserviceinterface import TrendGroupBy, TrendServiceInterface
from ..routes.decorators import (
    RouteReturn,
    inject_trendservice,
    make_gzip_json_response,
    parse_date_range_params,
)

log = logging.getLogger(__name__)


bp = Blueprint("trends", __name__)


@bp.route("/api/v1/trends", methods=["GET"])
@inject_trendservice
def get_trends(trend_service: TrendServiceInterface) -> RouteReturn:
    """
    params: start_date, end_date (YYYY-MM-DD)
    """
    starting_time = time.monotonic()
    try:
        start_date, end_date = parse_date_range_params()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    try:
        group_by: str | None = request.args.get("group_by")
        if group_by is None:
            return jsonify({"error": "group_by is required"}), 400
        try:
            group_by_enum: TrendGroupBy = TrendGroupBy(group_by)
        except ValueError:
            return jsonify({"error": f"Invalid group_by: {group_by}"}), 400

        trends: List[TrendDataDTO] = trend_service.get_trends(
            start_date, end_date, group_by_enum
        )
        return make_gzip_json_response([trend.to_dict() for trend in trends])
    except Exception as e:
        log.error("get_trends failed", exc_info=True)
        return jsonify({"data": None, "error": str(e)}), 500
    finally:
        log.info(f"get_trends took {time.monotonic() - starting_time} seconds")
