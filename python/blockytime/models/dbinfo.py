from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DBInfo(Base):
    __tablename__ = "DBinfo"

    version: Mapped[int] = mapped_column(Integer, primary_key=True)
    info: Mapped[str] = mapped_column(String)
