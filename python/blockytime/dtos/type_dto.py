from dataclasses import dataclass
from typing import Optional
from .base_dto import BaseDTO
from .category_dto import CategoryDTO
@dataclass
class TypeDTO(BaseDTO):
    category: Optional[CategoryDTO] = None
    name: str = ''
    color: Optional[int] = None
    hidden: Optional[bool] = None
    priority: Optional[int] = None 

    def to_dict(self) -> dict:
        return {
            'uid': self.uid,
            'category': self.category.to_dict() if self.category else None,
            'name': self.name,
            'color': self.color,
            'hidden': self.hidden,
            'priority': self.priority
        }