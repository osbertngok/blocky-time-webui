from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class ConfigDTO:
    key: str = ''
    value: str = ''

    def to_dict(self) -> Dict[str, Any]:
        return {
            'key': self.key,
            'value': self.value
        } 