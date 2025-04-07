from dataclasses import dataclass
from typing import Any, Dict, Optional

from .base_dto import BaseDTO
from .project_dto import ProjectDTO
from .type_dto import TypeDTO


@dataclass
class BlockDTO(BaseDTO):
    date: int
    uid: Optional[int] = None
    type_: Optional[TypeDTO] = None
    project: Optional[ProjectDTO] = None
    operation: Optional[str] = ""  # Can be 'upsert', 'delete', ''
    comment: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            **super().to_dict(),
            "uid": self.uid,
            "date": self.date,
            "type_": self.type_.to_dict() if self.type_ else None,
            "project": self.project.to_dict() if self.project else None,
            "operation": self.operation,
            "comment": self.comment,
        }
