from .base_dto import BaseDTO
from .type_dto import TypeDTO
from dataclasses import dataclass
from typing import Dict, Any, List


@dataclass
class TrendItemDTO(BaseDTO):
    time_label: str
    type_: TypeDTO
    duration: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            "timeLabel": self.time_label,
            "type": self.type_.to_dict(),
            "duration": self.duration,
        }
    
@dataclass
class TrendDataPoint(BaseDTO):
    time_label: str
    duration: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            "timeLabel": self.time_label,
            "duration": self.duration,
        }

@dataclass
class TrendDataDTO(BaseDTO):
    type_: TypeDTO
    items: List[TrendDataPoint]

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            "type": self.type_.to_dict(),
            "items": [item.to_dict() for item in self.items]
        }