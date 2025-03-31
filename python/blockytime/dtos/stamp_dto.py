from dataclasses import dataclass
from typing import Optional
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