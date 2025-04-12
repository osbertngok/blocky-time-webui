import logging
from typing import List

from flask import Blueprint, jsonify

from ..dtos.type_dto import TypeDTO
from ..interfaces.typeserviceinterface import TypeServiceInterface
from ..routes.decorators import RouteReturn, inject_typeservice

log = logging.getLogger(__name__)

bp = Blueprint("types", __name__)


@bp.route("/api/v1/types", methods=["GET"])
@inject_typeservice
def get_types(type_service: TypeServiceInterface) -> RouteReturn:
    try:
        types: List[TypeDTO] = type_service.get_types()

        return (
            jsonify({"data": [type_.to_dict() for type_ in types], "error": None}),
            200,
        )
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"data": None, "error": str(e)}), 500
