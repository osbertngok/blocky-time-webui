from blockytime.interfaces.blockserviceinterface import BlockServiceInterface
from blockytime.dtos.block_dto import BlockDTO
from datetime import datetime
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.models.block import Block

class BlockService(BlockServiceInterface):
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_blocks(self, start_date: datetime, end_date: datetime) -> list[BlockDTO]:
        with Session(self._engine) as session:
            blocks = session.query(Block).filter(Block.start >= start_date, Block.end <= end_date).all()
            return [block.to_dto() for block in blocks]
