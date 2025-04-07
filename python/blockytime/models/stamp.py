from sqlalchemy import Float, ForeignKey, Integer, LargeBinary, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Stamp(Base):
    __tablename__ = "Stamp"

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    stamper_uid: Mapped[int] = mapped_column(Integer, ForeignKey("Stamper.uid"))
    interval: Mapped[float] = mapped_column(Float)
    block_data: Mapped[bytes] = mapped_column(LargeBinary)
    reminds: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[int] = mapped_column(Integer)
    ext_i: Mapped[int] = mapped_column(Integer)
    ext_t: Mapped[str] = mapped_column(Text)
