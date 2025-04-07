from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Remind(Base):
    __tablename__ = "Remind"

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(Text, nullable=False, default="")
    block_date: Mapped[int] = mapped_column(Integer)
    alert_type: Mapped[int] = mapped_column(Integer)
    alert_offset: Mapped[int] = mapped_column(Integer)
    ring_index: Mapped[int] = mapped_column(Integer)
    alert_msg: Mapped[str] = mapped_column(Text, default="")
    type_uid: Mapped[int] = mapped_column(Integer, ForeignKey("Type.uid"))
    project_uid: Mapped[int] = mapped_column(Integer, ForeignKey("Project.uid"))
    place_uid: Mapped[int] = mapped_column(Integer)
    person_uids: Mapped[str] = mapped_column(String)
    comment: Mapped[str] = mapped_column(Text)
    repeat: Mapped[int] = mapped_column(Integer)
    state: Mapped[bool] = mapped_column(Boolean)
    ext_i: Mapped[int] = mapped_column(Integer)
    ext_t: Mapped[str] = mapped_column(Text, default="")
    ext_d: Mapped[float] = mapped_column(Float)
