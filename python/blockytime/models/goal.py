from sqlalchemy import Integer, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class Goal(Base):
    __tablename__ = 'Goal'

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hours: Mapped[float] = mapped_column(Float)
    duration_type: Mapped[int] = mapped_column(Integer)
    attr_uid: Mapped[int] = mapped_column(Integer)
    type_uid: Mapped[int] = mapped_column(Integer, ForeignKey('Type.uid'))
    project_uid: Mapped[int] = mapped_column(Integer, ForeignKey('Project.uid'))
    start_date: Mapped[int] = mapped_column(Integer)
    end_date: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    remind_policy: Mapped[int] = mapped_column(Integer)
    state: Mapped[int] = mapped_column(Integer)
    fav: Mapped[bool] = mapped_column(Boolean)
    priority: Mapped[int] = mapped_column(Integer)
    ext_i: Mapped[int] = mapped_column(Integer)
    ext_t: Mapped[str] = mapped_column(Text) 