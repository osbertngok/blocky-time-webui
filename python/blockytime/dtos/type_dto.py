from dataclasses import dataclass
from typing import Optional, List
from .base_dto import BaseDTO
from .category_dto import CategoryDTO
from .project_dto import ProjectDTO

@dataclass
class TypeDTO(BaseDTO):
    uid: Optional[int] = None
    category: Optional[CategoryDTO] = None
    name: str = ''
    color: Optional[int] = None
    hidden: Optional[bool] = None
    priority: Optional[int] = None
    projects: Optional[List[ProjectDTO]] = None

    def to_dict(self) -> dict:
        return {
            'uid': self.uid,
            'category': self.category.to_dict() if self.category else None,
            'projects': [project.to_dict() if project is not None else None for project in self.projects] if self.projects is not None else [],
            'name': self.name,
            'color': self.color,
            'hidden': self.hidden,
            'priority': self.priority
        }