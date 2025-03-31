from datetime import date
from sqlalchemy import Column, Integer, Date, Text, ForeignKey
from .base import Base

class Block(Base):
    __tablename__ = 'Block'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date)
    type_uid = Column(Integer, ForeignKey('Type.uid'), default=0)
    project_uid = Column(Integer, ForeignKey('Project.uid'), default=0)
    comment = Column(Text, default='') 