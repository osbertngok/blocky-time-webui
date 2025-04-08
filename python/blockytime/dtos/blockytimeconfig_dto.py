from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Tuple


class TimePrecision(Enum):
    Rough = 0
    HalfHour = 1
    QuarterHour = 2


@dataclass
class BlockyTimeConfig:
    special_time_period: List[Tuple[int, int]]
    disable_pixelate: bool
    main_time_precision: TimePrecision

    def to_dict(self) -> Dict[str, Any]:
        return {
            "specialTimePeriod": self.special_time_period,
            "disablePixelate": self.disable_pixelate,
            "mainTimePrecision": self.main_time_precision.value,
        }
