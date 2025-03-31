from sqlalchemy import Column, Integer, Float, LargeBinary, Text, Date, ForeignKey
from .base import Base

class Stamp(Base):
    __tablename__ = 'Stamp'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    stamper_uid = Column(Integer, ForeignKey('Stamper.uid'))
    interval = Column(Float)
    block_data = Column(LargeBinary)
    reminds = Column(Text)
    timestamp = Column(Date)
    ext_i = Column(Integer)
    ext_t = Column(Text) 