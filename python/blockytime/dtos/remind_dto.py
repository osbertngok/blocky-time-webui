from dataclasses import dataclass
from typing import Optional, Dict, Any
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

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'key': self.key,
            'block_date': self.block_date,
            'alert_type': self.alert_type,
            'alert_offset': self.alert_offset,
            'ring_index': self.ring_index,
            'alert_msg': self.alert_msg,
            'type_uid': self.type_uid,
            'project_uid': self.project_uid,
            'place_uid': self.place_uid,
            'person_uids': self.person_uids,
            'comment': self.comment,
            'repeat': self.repeat,
            'state': self.state,
            'ext_i': self.ext_i,
            'ext_t': self.ext_t,
            'ext_d': self.ext_d
        } 