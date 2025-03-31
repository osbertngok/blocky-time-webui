from dataclasses import dataclass
from typing import Dict, Any
from .base_dto import BaseDTO

@dataclass
class CategoryDTO(BaseDTO):
    name: str = ''

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'name': self.name
        } 