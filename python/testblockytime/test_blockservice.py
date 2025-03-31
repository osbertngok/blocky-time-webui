import pytest
from pytest import fixture
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.services.blockservice import BlockService
from blockytime.dtos.block_dto import BlockDTO
from datetime import datetime
from typing import List
import os
import pytz

import logging


# Configure SQLAlchemy logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

class TestBlockService:

    @fixture
    def engine(self) -> Engine:
        # Load from data/test_db.db
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_file_path = os.path.join(current_dir, 'data', 'test_db.db')
        engine = create_engine(f'sqlite:///{db_file_path}')
        return engine
    
    def test_get_blocks(self, engine: Engine) -> None:
        # Get blocks from the engine
        tz = pytz.timezone('Asia/Singapore')
        start = tz.localize(datetime(2025, 1, 1))  # 2025-01-01 00:00:00 GMT+8
        end = tz.localize(datetime(2025, 1, 2))    # 2025-01-02 00:00:00 GMT+8
        blocks: List[BlockDTO] = BlockService(engine).get_blocks(start_date=start, end_date=end)
        assert len(blocks) == 96  # Expecting 96 quarter-hour blocks in a day
        assert blocks[0].date == 1735660800  # 2025-01-01 00:00:00 GMT+8
        assert blocks[0].type_.uid == 16  # Type 1 is "Work"
        assert blocks[0].type_.name == "Learning"
        assert blocks[0].project.uid == 30  # Project 1 is "Project 1"
        assert blocks[0].project.name == "Programming"
        assert blocks[0].comment == ""
