from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class BaseDTO:
    """Base DTO class with common fields"""

    def to_dict(self) -> Dict[str, Any]:
        return {
        } 