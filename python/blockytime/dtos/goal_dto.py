from dataclasses import dataclass
from typing import Optional, Dict, Any
from .base_dto import BaseDTO

@dataclass
class GoalDTO(BaseDTO):
    uid: Optional[int] = None
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

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'uid': self.uid,
            'type': self.type,
            'hours': self.hours,
            'duration_type': self.duration_type,
            'attr_uid': self.attr_uid,
            'type_uid': self.type_uid,
            'project_uid': self.project_uid,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'comment': self.comment,
            'remind_policy': self.remind_policy,
            'state': self.state,
            'fav': self.fav,
            'priority': self.priority,
            'ext_i': self.ext_i,
            'ext_t': self.ext_t
        } 