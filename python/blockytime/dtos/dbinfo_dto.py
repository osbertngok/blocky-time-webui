from dataclasses import dataclass

@dataclass
class DBInfoDTO:
    version: int
    info: str 