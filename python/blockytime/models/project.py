from sqlalchemy import Column, Integer, Text, Boolean
from .base import Base

class Project(Base):
    __tablename__ = 'Project'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, default='')
    abbr = Column(Text, default='')
    latin = Column(Text, default='')
    acronym = Column(Text, default='')
    hidden = Column(Boolean)
    classify_uid = Column(Integer, default=0)
    taglist = Column(Text, default='')
    priority = Column(Integer) 