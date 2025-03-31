from dataclasses import dataclass
from typing import Optional
from .base_dto import BaseDTO

@dataclass
class GoalDTO(BaseDTO):
    type: int = 0
    hours: Optional[float] = None
    duration_type: Optional[int] = None
    attr_uid: Optional[int] = None
    type_uid: Optional[int] = None
    project_uid: Optional[int] = None
    start_date: Optional[int] = None
    end_date: Optional[int] = None
    comment: Optional[str] = None
    remind_policy: Optional[int] = None
    state: Optional[int] = None
    fav: Optional[bool] = None
    priority: Optional[int] = None
    ext_i: Optional[int] = None
    ext_t: Optional[str] = None 