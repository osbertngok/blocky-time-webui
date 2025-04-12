import gzip
import json
import logging
import time
from datetime import datetime
from typing import List, Sequence

import pytz
from flask import Blueprint, jsonify, make_response, request

from ..dtos.block_dto import BlockDTO
from ..dtos.project_dto import ProjectDTO
from ..dtos.type_dto import TypeDTO
from ..interfaces.blockserviceinterface import BlockServiceInterface
from ..routes.decorators import RouteReturn, inject_blockservice

log = logging.getLogger(__name__)

bp = Blueprint("blocks", __name__)


@bp.route("/api/v1/blocks", methods=["GET"])
@inject_blockservice
def get_blocks(block_service: BlockServiceInterface) -> RouteReturn:
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
        blocks: Sequence[BlockDTO] = block_service.get_blocks(start_date, end_date)
        ret = {"data": [block.to_dict() for block in blocks], "error": None}
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
        log.info(f"get_blocks took {ending_time - starting_time} seconds")


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
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    try:
        if block_service.update_blocks(blocks):
            return jsonify({"message": "Blocks updated successfully"}), 200
        else:
            return jsonify({"error": "Failed to update blocks"}), 500
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
