import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from blockytime.dtos.block_dto import BlockDTO
from blockytime.interfaces.blockserviceinterface import BlockServiceInterface
from blockytime.models.block import Block
from blockytime.models.project import Project
from blockytime.models.type_ import Type
from sqlalchemy import delete
from sqlalchemy.engine import Engine, Result
from sqlalchemy.orm import Session

log = logging.getLogger(__name__)


class BlockService(BlockServiceInterface):

    _cache: Dict[str, Tuple[List[BlockDTO], datetime]] = {}

    def __init__(self, engine: Engine):
        self.engine = engine

    def get_cache_key(self, start_date: datetime, end_date: datetime) -> str:
        return f"{start_date.timestamp()}-{end_date.timestamp()}"

    def get_blocks(self, start_date: datetime, end_date: datetime) -> list[BlockDTO]:
        cache_key = self.get_cache_key(start_date, end_date)
        if cache_key in self._cache:
            blocks, timestamp = self._cache[cache_key]
            if timestamp > datetime.now():
                return blocks

        with Session(self.engine) as session:
            # Convert timezone-aware datetime to UTC timestamp
            start_ts = int(start_date.timestamp())
            end_ts = int(end_date.timestamp())

            blocks = (
                session.query(Block)
                .filter(Block.date >= start_ts, Block.date < end_ts)
                .order_by(Block.date)
                .all()
            )
            self._cache[cache_key] = (
                [block.to_dto() for block in blocks],
                datetime.now() + timedelta(seconds=1),
            )

            return self._cache[cache_key][0]

    def update_blocks(self, blocks: List[BlockDTO]) -> bool:
        try:
            with Session(self.engine) as session:
                if all(
                    block.operation in ["upsert", "delete"]
                    and (block.operation == "delete" or block.type_ is not None)
                    for block in blocks
                ):
                    # delete first, then add
                    # date is unique
                    for block in blocks:
                        if block.operation == "upsert":
                            assert block.type_ is not None
                        if block.operation in ["delete", "upsert"]:
                            result: Result = session.execute(
                                delete(Block).where(Block.date == block.date)
                            )
                            log.info(
                                f"Deleted {result.rowcount} blocks for date {block.date}"
                            )
                    for block in blocks:
                        if block.operation == "upsert":
                            assert block.type_ is not None
                            type_uid = block.type_.uid
                            project_uid = (
                                block.project.uid if block.project is not None else None
                            )
                            type_ = (
                                session.query(Type).filter(Type.uid == type_uid).first()
                            )
                            assert (
                                type_ is not None
                            ), f"Cannot find type with uid {type_uid}"
                            project = (
                                session.query(Project)
                                .filter(Project.uid == project_uid)
                                .first()
                                if project_uid is not None
                                else None
                            )
                            raw_block = Block(
                                date=block.date,
                                type_uid=type_uid,
                                type_=type_,
                                project_uid=project_uid,
                                project=project,
                                comment=block.comment,
                            )
                            session.add(
                                raw_block
                            )  # this returns None, so we can't log the result
                            log.info(f"Affected block for {raw_block.to_dto()}")
                else:
                    log.error(f"Invalid block: {blocks}")
                    return False
                session.commit()
                return True
        except Exception as e:
            import traceback

            traceback.print_exc()
            log.error(e)
            return False
        finally:
            self._cache.clear()
