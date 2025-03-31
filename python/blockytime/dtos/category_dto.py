from dataclasses import dataclass
from typing import Dict, Any, Optional
from .base_dto import BaseDTO

@dataclass
class CategoryDTO(BaseDTO):
    uid: Optional[int] = None
    name: str = ''

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'uid': self.uid,
            'name': self.name
        } 