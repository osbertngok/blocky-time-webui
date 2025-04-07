from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class BaseDTO:
    """Base DTO class with common fields"""

    def to_dict(self) -> Dict[str, Any]:
        return {}
