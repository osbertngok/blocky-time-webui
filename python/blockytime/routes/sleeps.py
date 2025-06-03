from datetime import datetime, timedelta
from typing import Any

from flask import Blueprint, jsonify, request
import pytz

from ..routes.decorators import inject_sleepservice, RouteReturn
from ..interfaces.sleepserviceinterface import SleepServiceInterface

bp = Blueprint("sleep", __name__)

@bp.route("/api/v1/sleep/stats", methods=["GET"])
@inject_sleepservice
def get_sleep_stats(sleep_service: SleepServiceInterface) -> RouteReturn:
    """Get sleep statistics for the given date range."""
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    decay_factor = float(request.args.get("decay_factor", 0.75))
    window_size = int(request.args.get("window_size", 14))
    
    if not start_date_str or not end_date_str:
        return jsonify({"error": "start_date and end_date are required"}), 400
        
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    stats = sleep_service.calculate_sleep_stats(
        start_date=start_date,
        end_date=end_date,
        cut_off_hour=18,
        timezone=pytz.timezone("Asia/Shanghai"),
        start_time_cut_off_hour=8,
        end_time_cut_off_hour=14,
        filter_start_time_after=20.0,  # 8 PM
        filter_end_time_after=27.0,    # 3 AM
        decay_factor=decay_factor,
        window_size=window_size
    )
    
    # Convert days since epoch to YYYY-MM-DD format
    epoch = datetime(1970, 1, 1).date()
    moving_avg_dates = [(epoch + timedelta(days=int(d))).strftime("%Y-%m-%d") for d in stats[3]]
    dates = [(epoch + timedelta(days=int(d))).strftime("%Y-%m-%d") for d in stats[6]]
    
    return jsonify({
        "start_moving_avg": stats[0].tolist(),
        "end_moving_avg": stats[1].tolist(),
        "duration_moving_avg": stats[2].tolist(),
        "moving_avg_dates": moving_avg_dates,
        "start_hours": stats[4].tolist(),
        "end_hours": stats[5].tolist(),
        "dates": dates
    }) 