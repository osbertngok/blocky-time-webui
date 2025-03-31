from typing import Protocol
from datetime import datetime
from blockytime.dtos.block_dto import BlockDTO

class BlockServiceInterface(Protocol):
    def get_blocks(self, start_date: datetime, end_date: datetime) -> list[BlockDTO]:
        """
        Get blocks for a given date range
        """
        ...

    def update_blocks(self, blocks: list[BlockDTO]) -> bool:
        """
        Update blocks
        """
        ...