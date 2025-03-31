from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class DBInfoDTO:
    version: int
    info: str
    uid: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'uid': self.uid,
            'version': self.version,
            'info': self.info
        } 