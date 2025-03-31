from typing import Protocol
from datetime import datetime
from blockytime.dtos.type_dto import TypeDTO

class TypeServiceInterface(Protocol):
    def get_types(self) -> list[TypeDTO]:
        """
        Get types
        """
        ...