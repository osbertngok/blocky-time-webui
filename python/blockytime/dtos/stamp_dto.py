from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import date
from .base_dto import BaseDTO

@dataclass
class StampDTO(BaseDTO):
    stamper_uid: Optional[int] = None
    interval: Optional[float] = None
    block_data: Optional[bytes] = None
    reminds: Optional[str] = None
    timestamp: Optional[date] = None
    ext_i: Optional[int] = None
    ext_t: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'stamper_uid': self.stamper_uid,
            'interval': self.interval,
            'block_data': self.block_data.hex() if self.block_data else None,
            'reminds': self.reminds,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'ext_i': self.ext_i,
            'ext_t': self.ext_t
        } 