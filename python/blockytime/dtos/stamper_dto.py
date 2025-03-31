from dataclasses import dataclass
from typing import Optional
from datetime import date
from .base_dto import BaseDTO

@dataclass
class StamperDTO(BaseDTO):
    name: str = ''
    color: Optional[int] = None
    fav: Optional[bool] = None
    priority: Optional[int] = None
    timestamp: Optional[date] = None
    sub_uids: Optional[str] = None
    group_number: Optional[int] = None
    group_name: Optional[str] = None
    ext_i: Optional[int] = None
    ext_t: Optional[str] = None 