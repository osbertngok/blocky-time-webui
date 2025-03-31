from sqlalchemy import Integer, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class Stamper(Base):
    __tablename__ = 'Stamper'

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, default='')
    color: Mapped[int] = mapped_column(Integer)
    fav: Mapped[bool] = mapped_column(Boolean)
    priority: Mapped[int] = mapped_column(Integer)
    timestamp: Mapped[int] = mapped_column(Integer)
    sub_uids: Mapped[str] = mapped_column(Text)
    group_number: Mapped[int] = mapped_column(Integer)
    group_name: Mapped[str] = mapped_column(Text)
    ext_i: Mapped[int] = mapped_column(Integer)
    ext_t: Mapped[str] = mapped_column(Text) 