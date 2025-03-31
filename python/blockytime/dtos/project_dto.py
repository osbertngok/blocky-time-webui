from dataclasses import dataclass
from typing import Optional
from .base_dto import BaseDTO

@dataclass
class ProjectDTO(BaseDTO):
    uid: Optional[int] = None
    name: str = ''
    abbr: str = ''
    latin: str = ''
    acronym: str = ''
    hidden: Optional[bool] = None
    classify_uid: int = 0
    taglist: str = ''
    priority: Optional[int] = None 

    def to_dict(self) -> dict:
        return {
            'uid': self.uid,
            'name': self.name,
            'abbr': self.abbr,
            'latin': self.latin,
            'acronym': self.acronym,
            'hidden': self.hidden,
            'classify_uid': self.classify_uid,
            'taglist': self.taglist,
            'priority': self.priority
        }