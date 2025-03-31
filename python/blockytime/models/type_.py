from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey
from .base import Base

class Type(Base):
    __tablename__ = 'Type'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    category_uid = Column(Integer, ForeignKey('Category.uid'), default=0)
    name = Column(Text, default='')
    color = Column(Integer)
    hidden = Column(Boolean)
    priority = Column(Integer) 