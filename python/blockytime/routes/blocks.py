import logging
import time
from typing import List, Sequence

from flask import Blueprint, jsonify, request

from ..dtos.block_dto import BlockDTO
from ..dtos.project_dto import ProjectDTO
from ..dtos.type_dto import TypeDTO
from ..interfaces.blockserviceinterface import BlockServiceInterface
from ..routes.decorators import (
    RouteReturn,
    inject_blockservice,
    make_gzip_json_response,
    parse_date_range_params,
)

log = logging.getLogger(__name__)

bp = Blueprint("blocks", __name__)


@bp.route("/api/v1/blocks", methods=["GET"])
@inject_blockservice
def get_blocks(block_service: BlockServiceInterface) -> RouteReturn:
    """
    params: start_date, end_date (YYYY-MM-DD)
    """
    starting_time = time.monotonic()
    try:
        start_date, end_date = parse_date_range_params()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    try:
        blocks: Sequence[BlockDTO] = block_service.get_blocks(start_date, end_date)
        return make_gzip_json_response([block.to_dict() for block in blocks])
    except Exception as e:
        log.error("get_blocks failed", exc_info=True)
        return jsonify({"data": None, "error": str(e)}), 500
    finally:
        log.info(f"get_blocks took {time.monotonic() - starting_time} seconds")


@bp.route("/api/v1/blocks", methods=["PUT"])
@inject_blockservice
def update_blocks(block_service: BlockServiceInterface) -> RouteReturn:
    """
    params: blocks (list of BlockDTO)
    """
    try:
        if isinstance(request.json, list):
            blocks: List[BlockDTO] = []
            for item in request.json:
                if isinstance(item, dict):
                    if (
                        "date" in item
                        and "comment" in item
                        and "operation" in item
                        and (
                            (
                                item["operation"] == "upsert"
                                and "type_" in item
                                and "project" in item
                            )
                            or (item["operation"] == "delete")
                        )
                    ):
                        if item["operation"] == "upsert":
                            if (
                                "type_" in item
                                and item["type_"] is not None
                                and item["type_"]["uid"] is None
                            ):
                                return (
                                    jsonify(
                                        {
                                            "error": "type_.uid is required for upsert operation if type_ is not None"
                                        }
                                    ),
                                    400,
                                )
                            if (
                                "project" in item
                                and item["project"] is not None
                                and item["project"]["uid"] is None
                            ):
                                return (
                                    jsonify(
                                        {
                                            "error": "project.uid is required for upsert operation if project is not None"
                                        }
                                    ),
                                    400,
                                )
                        blocks.append(
                            BlockDTO(
                                date=item["date"],
                                type_=(
                                    TypeDTO(uid=item["type_"]["uid"])
                                    if "type_" in item and item["type_"] is not None
                                    else None
                                ),
                                project=(
                                    ProjectDTO(uid=item["project"]["uid"])
                                    if "project" in item and item["project"] is not None
                                    else None
                                ),
                                comment=item["comment"],
                                operation=item["operation"],
                            )
                        )
                    else:
                        return jsonify({"error": "invalid block"}), 400
                else:
                    return jsonify({"error": "expecting list of blocks"}), 400

            if not blocks:
                return jsonify({"error": "blocks is required"}), 400
        else:
            return jsonify({"error": "expecting list of blocks"}), 400
    except Exception as e:
        log.error("update_blocks request parsing failed", exc_info=True)
        return jsonify({"error": str(e)}), 500

    try:
        if block_service.update_blocks(blocks):
            return jsonify({"message": "Blocks updated successfully"}), 200
        else:
            return jsonify({"error": "Failed to update blocks"}), 500
    except Exception as e:
        log.error("update_blocks service call failed", exc_info=True)
        return jsonify({"error": str(e)}), 500
