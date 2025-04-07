from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class ConfigDTO:
    uid: Optional[int] = None
    key: str = ""
    value: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {"uid": self.uid, "key": self.key, "value": self.value}
