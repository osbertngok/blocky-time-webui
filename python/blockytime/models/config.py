from sqlalchemy import Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Config(Base):
    __tablename__ = "Config"

    key: Mapped[str] = mapped_column(Text, primary_key=True, default="")
    value: Mapped[str] = mapped_column(Text, default="")
