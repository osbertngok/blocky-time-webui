from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class LinkDTO:
    type_uid: int
    project_uid: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            'type_uid': self.type_uid,
            'project_uid': self.project_uid
        } 