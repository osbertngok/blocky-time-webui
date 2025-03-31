from blockytime.interfaces.blockserviceinterface import BlockServiceInterface
from blockytime.dtos.block_dto import BlockDTO
from datetime import datetime
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.models.block import Block
from typing import List

import logging

log = logging.getLogger(__name__)

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
        
    def update_blocks(self, blocks: List[BlockDTO]) -> bool:
        try:
            with Session(self.engine) as session:
                if all(block.operation in ['add', 'delete']  and block.type_ is not None and block.project is not None for block in blocks):
                    for block in blocks:
                        assert block.type_ is not None
                        assert block.project is not None
                        if block.operation == 'add':
                            session.add(Block(
                                date=block.date,
                                type_id=block.type_.uid,
                                project_id=block.project.uid,
                                comment=block.comment
                            ))
                        elif block.operation == 'delete':
                            session.delete(Block(
                                uid=block.uid
                            ))
                else:
                    log.error(f"Invalid block: {blocks}")
                    return False
                session.commit()
                return True
        except Exception as e:
            log.error(e)
            return False

