from blockytime.interfaces.blockserviceinterface import BlockServiceInterface
from blockytime.dtos.block_dto import BlockDTO
from datetime import datetime
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.models.block import Block


class BlockService(BlockServiceInterface):
    def __init__(self, engine: Engine):
        self.engine = engine

    def get_blocks(self, start_date: datetime, end_date: datetime) -> list[BlockDTO]:
        with Session(self.engine) as session:
            # Convert timezone-aware datetime to UTC timestamp
            start_ts = int(start_date.timestamp())
            end_ts = int(end_date.timestamp())
            
            blocks = session.query(Block).filter(
                Block.date >= start_ts,
                Block.date < end_ts
            ).order_by(Block.date).all()
            
            return [block.to_dto() for block in blocks]

