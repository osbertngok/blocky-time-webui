from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Link(Base):
    __tablename__ = "Link"

    type_uid: Mapped[int] = mapped_column(
        Integer, ForeignKey("Type.uid"), primary_key=True
    )
    project_uid: Mapped[int] = mapped_column(
        Integer, ForeignKey("Project.uid"), primary_key=True
    )
