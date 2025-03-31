from flask import Blueprint, request, jsonify
from datetime import datetime
import pytz
from typing import Callable, Any, TypeVar, cast, List
from ..interfaces.typeserviceinterface import TypeServiceInterface
from ..dtos.type_dto import TypeDTO
from ..routes.decorators import RouteReturn, inject_typeservice
import logging

log = logging.getLogger(__name__)

bp = Blueprint('types', __name__)

@bp.route('/api/v1/types', methods=['GET'])
@inject_typeservice
def get_types(type_service: TypeServiceInterface) -> RouteReturn:
    try:
        types: List[TypeDTO] = type_service.get_types()

        return jsonify({
            "data": [type_.to_dict() for type_ in types],
            "error": None
        }), 200
    except Exception as e:
        return jsonify({
            "data": None,
            "error": str(e)
        }), 500
