from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class DBInfoDTO:
    version: int
    info: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            'version': self.version,
            'info': self.info
        } 