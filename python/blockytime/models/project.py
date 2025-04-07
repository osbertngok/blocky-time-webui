from sqlalchemy import Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..dtos.project_dto import ProjectDTO
from .base import Base


class Project(Base):
    __tablename__ = "Project"

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, default="")
    abbr: Mapped[str] = mapped_column(Text, default="")
    latin: Mapped[str] = mapped_column(Text, default="")
    acronym: Mapped[str] = mapped_column(Text, default="")
    hidden: Mapped[bool] = mapped_column(Boolean)
    classify_uid: Mapped[int] = mapped_column(Integer, default=0)
    taglist: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[int] = mapped_column(Integer)

    def to_dto(self) -> ProjectDTO:
        return ProjectDTO(
            uid=self.uid,
            name=self.name,
            abbr=self.abbr,
            latin=self.latin,
            acronym=self.acronym,
            hidden=self.hidden,
            classify_uid=self.classify_uid,
            taglist=self.taglist,
            priority=self.priority,
        )
