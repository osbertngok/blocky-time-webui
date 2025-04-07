from dataclasses import dataclass
from typing import Any, Dict, List, Tuple


@dataclass
class BlockyTimeConfig:
    special_time_period: List[Tuple[int, int]]
    disable_pixelate: bool
    main_time_precision: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "specialTimePeriod": self.special_time_period,
            "disablePixelate": self.disable_pixelate,
            "mainTimePrecision": self.main_time_precision,
        }
