import pytest
from pytest import fixture
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.services.typeservice import TypeService
from blockytime.dtos.type_dto import TypeDTO
from datetime import datetime
from typing import List
import os
import pytz

import logging


# Configure SQLAlchemy logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

class TestTypeService:

    @fixture
    def engine(self) -> Engine:
        # Load from data/test_db.db
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_file_path = os.path.join(current_dir, 'data', 'test_db.db')
        engine = create_engine(f'sqlite:///{db_file_path}')
        return engine
    
    def test_get_types(self, engine: Engine) -> None:
        # Get blocks from the engine
        types: List[TypeDTO] = TypeService(engine).get_types()
        assert len(types) == 17  # Expecting 17 types
        assert types[0].uid == 1  # Type 1 is "Work"
        assert types[0].name == "Work"
        assert len(types[0].projects) == 11
        assert types[0].projects[0].uid == 9
        assert types[0].projects[0].name == "Business"
        assert types[0].projects[1].uid == 8
        assert types[0].projects[1].name == "Development"
        assert types[0].projects[2].uid == 10
        assert types[0].projects[2].name == "Infrastructure"
        
