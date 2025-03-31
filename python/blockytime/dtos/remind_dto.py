from dataclasses import dataclass
from typing import Optional
from .base_dto import BaseDTO

@dataclass
class RemindDTO(BaseDTO):
    key: str = ''
    block_date: Optional[int] = None
    alert_type: Optional[int] = None
    alert_offset: Optional[int] = None
    ring_index: Optional[int] = None
    alert_msg: str = ''
    type_uid: Optional[int] = None
    project_uid: Optional[int] = None
    place_uid: Optional[int] = None
    person_uids: Optional[str] = None
    comment: Optional[str] = None
    repeat: Optional[int] = None
    state: Optional[bool] = None
    ext_i: Optional[int] = None
    ext_t: str = ''
    ext_d: Optional[float] = None 