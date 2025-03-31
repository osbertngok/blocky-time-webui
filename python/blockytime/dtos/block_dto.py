from dataclasses import dataclass
from datetime import date
from typing import Optional, Dict, Any
from .base_dto import BaseDTO
from .type_dto import TypeDTO
from .project_dto import ProjectDTO

@dataclass
class BlockDTO(BaseDTO):
    date: date
    type_: TypeDTO
    project: ProjectDTO
    comment: str = '' 

    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'type_': self.type_.to_dict(),
            'project': self.project.to_dict(),
            'comment': self.comment
        }