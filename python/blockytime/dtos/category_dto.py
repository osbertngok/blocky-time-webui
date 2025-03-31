from dataclasses import dataclass
from .base_dto import BaseDTO

@dataclass
class CategoryDTO(BaseDTO):
    name: str = '' 