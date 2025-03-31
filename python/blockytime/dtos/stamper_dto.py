from dataclasses import dataclass
from typing import Optional, Dict, Any
from .base_dto import BaseDTO

@dataclass
class StamperDTO(BaseDTO):
    name: str = ''
    color: Optional[int] = None
    fav: Optional[bool] = None
    priority: Optional[int] = None
    timestamp: Optional[int] = None
    sub_uids: Optional[str] = None
    group_number: Optional[int] = None
    group_name: Optional[str] = None
    ext_i: Optional[int] = None
    ext_t: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'name': self.name,
            'color': self.color,
            'fav': self.fav,
            'priority': self.priority,
            'timestamp': self.timestamp,
            'sub_uids': self.sub_uids,
            'group_number': self.group_number,
            'group_name': self.group_name,
            'ext_i': self.ext_i,
            'ext_t': self.ext_t
        } 