from datetime import datetime
from typing import List, Optional

from flask import Blueprint, jsonify, request
from sqlalchemy.engine import Engine

from ..routes.decorators import inject_sleepservice
from ..interfaces.sleepserviceinterface import SleepServiceInterface

bp = Blueprint("sleep", __name__)

@bp.route("/api/v1/sleep/stats", methods=["GET"])
@inject_sleepservice
def get_sleep_stats(sleep_service: SleepServiceInterface) -> dict:
    """Get sleep statistics for the given date range."""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    decay_factor = float(request.args.get("decay_factor", 0.1))
    window_size = int(request.args.get("window_size", 7))
    
    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date are required"}), 400
        
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    stats = sleep_service.calculate_sleep_stats(
        start_date=start,
        end_date=end,
        decay_factor=decay_factor,
        window_size=window_size
    )
    
    return jsonify({
        "start_moving_avg": stats[0].tolist(),
        "end_moving_avg": stats[1].tolist(),
        "duration_moving_avg": stats[2].tolist(),
        "moving_avg_dates": [d.strftime("%Y-%m-%d") for d in stats[3]],
        "start_hours": stats[4].tolist(),
        "end_hours": stats[5].tolist()
    }) 