from sqlalchemy import Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class TrendHistory(Base):
    __tablename__ = "TrendHistory"

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target: Mapped[int] = mapped_column(Integer, nullable=False)
    target_ids: Mapped[str] = mapped_column(Text, default="")
