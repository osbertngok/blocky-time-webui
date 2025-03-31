from dataclasses import dataclass
from typing import Optional, Dict, Any
from .base_dto import BaseDTO
from .type_dto import TypeDTO
from .project_dto import ProjectDTO

@dataclass
class BlockDTO(BaseDTO):
    date: int
    type_: Optional[TypeDTO] = None
    project: Optional[ProjectDTO] = None
    operation: Optional[str] = '' # Can be 'add', 'delete', ''
    comment: str = '' 

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            'date': self.date,
            'type_': self.type_.to_dict() if self.type_ else None,
            'project': self.project.to_dict() if self.project else None,
            'operation': self.operation,
            'comment': self.comment
        }