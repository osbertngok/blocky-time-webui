from sqlalchemy import Column, Integer, Text, Boolean
from .base import Base

class Stamper(Base):
    __tablename__ = 'Stamper'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, default='')
    color = Column(Integer)
    fav = Column(Boolean)
    priority = Column(Integer)
    timestamp = Column(Integer)
    sub_uids = Column(Text)
    group_number = Column(Integer)
    group_name = Column(Text)
    ext_i = Column(Integer)
    ext_t = Column(Text) 