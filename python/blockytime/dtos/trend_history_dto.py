from dataclasses import dataclass
from .base_dto import BaseDTO

@dataclass
class TrendHistoryDTO(BaseDTO):
    target: int
    target_ids: str = '' 