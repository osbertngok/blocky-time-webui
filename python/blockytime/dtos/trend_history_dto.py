from dataclasses import dataclass
from typing import Dict, Any, Optional
from .base_dto import BaseDTO

@dataclass
class TrendHistoryDTO(BaseDTO):
    target: int
    target_ids: str = ''
    uid: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'uid': self.uid,
            'target': self.target,
            'target_ids': self.target_ids
        } 