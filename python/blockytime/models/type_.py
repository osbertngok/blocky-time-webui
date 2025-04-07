from sqlalchemy import Boolean, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..dtos.type_dto import TypeDTO
from .base import Base
from .link import Link


class Type(Base):
    __tablename__ = "Type"

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_uid: Mapped[int] = mapped_column(
        Integer, ForeignKey("Category.uid"), default=0
    )
    name: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[int] = mapped_column(Integer)
    hidden: Mapped[bool] = mapped_column(Boolean)
    priority: Mapped[int] = mapped_column(Integer)

    category = relationship("Category")

    projects = relationship("Project", secondary=Link.__table__)

    def to_dto(self) -> TypeDTO:
        return TypeDTO(
            uid=self.uid,
            name=self.name,
            color=self.color,
            hidden=self.hidden,
            priority=self.priority,
            category=self.category.to_dto() if self.category else None,
            projects=(
                [project.to_dto() for project in self.projects]
                if self.projects
                else None
            ),
        )
