from dataclasses import dataclass
from typing import Optional

@dataclass
class BaseDTO:
    """Base DTO class with common fields"""
    uid: int 