from dataclasses import dataclass
from typing import Any, Dict

from .base_dto import BaseDTO
from .type_dto import TypeDTO


@dataclass
class StatisticsDTO(BaseDTO):
    type_: TypeDTO
    duration: float
    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            "type": self.type_.to_dict(),
            "duration": self.duration,
        }
