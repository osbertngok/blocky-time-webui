from dataclasses import dataclass
from typing import Optional
from .base_dto import BaseDTO

@dataclass
class TypeDTO(BaseDTO):
    category_uid: int = 0
    name: str = ''
    color: Optional[int] = None
    hidden: Optional[bool] = None
    priority: Optional[int] = None 

    def to_dict(self) -> dict:
        return {
            'uid': self.uid,
            'category_uid': self.category_uid,
            'name': self.name,
            'color': self.color,
            'hidden': self.hidden,
            'priority': self.priority
        }