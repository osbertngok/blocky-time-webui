from blockytime.interfaces.typeserviceinterface import TypeServiceInterface
from blockytime.dtos.type_dto import TypeDTO
from datetime import datetime
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.models.type_ import Type

class TypeService(TypeServiceInterface):
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_types(self) -> list[TypeDTO]:
        with Session(self._engine) as session:
            types = session.query(Type).all()
            return [type_.to_dto() for type_ in types]
