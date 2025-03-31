from flask import Blueprint, request, jsonify
from datetime import datetime
import pytz
from typing import Callable, Any, TypeVar, cast, List
from ..interfaces.blockserviceinterface import BlockServiceInterface
from ..dtos.block_dto import BlockDTO
from ..routes.decorators import RouteReturn, inject_blockservice


import logging

log = logging.getLogger(__name__)

bp = Blueprint('blocks', __name__)



@bp.route('/api/v1/blocks', methods=['GET'])
@inject_blockservice
def get_blocks(block_service: BlockServiceInterface) -> RouteReturn:
    """
    params: start_date, end_date (YYYY-MM-DD)
    """
    # start_date and end_date are strs in YYYY-MM-DD format
    try:
        start_date_str: str | None = request.args.get('start_date')
        if start_date_str is None:
            return jsonify({'error': 'start_date is required'}), 400
            
        end_date_str: str | None = request.args.get('end_date')
        if end_date_str is None:
            return jsonify({'error': 'end_date is required'}), 400

        # Parse dates and localize to GMT+8
        tz = pytz.timezone('Asia/Singapore')
        start_date = tz.localize(datetime.strptime(start_date_str, '%Y-%m-%d'))
        end_date = tz.localize(datetime.strptime(end_date_str, '%Y-%m-%d'))
        
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    blocks: List[BlockDTO] = block_service.get_blocks(start_date, end_date)

    return jsonify({
        "data": [block.to_dict() for block in blocks],
        "error": None
    }), 200
