import logging

from flask import Blueprint, jsonify

from ..dtos.blockytimeconfig_dto import BlockyTimeConfig
from ..interfaces.configserviceinterface import ConfigServiceInterface
from ..routes.decorators import RouteReturn, inject_configservice

log = logging.getLogger(__name__)

bp = Blueprint("configs", __name__)


@bp.route("/api/v1/configs", methods=["GET"])
@inject_configservice
def get_configs(config_service: ConfigServiceInterface) -> RouteReturn:
    try:
        config: BlockyTimeConfig = config_service.get_config()
        return jsonify({"data": config.to_dict()}), 200
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
