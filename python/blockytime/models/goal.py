from sqlalchemy import Column, Integer, Float, Text, Boolean, ForeignKey
from .base import Base

class Goal(Base):
    __tablename__ = 'Goal'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(Integer, default=0, nullable=False)
    hours = Column(Float)
    duration_type = Column(Integer)
    attr_uid = Column(Integer)
    type_uid = Column(Integer, ForeignKey('Type.uid'))
    project_uid = Column(Integer, ForeignKey('Project.uid'))
    start_date = Column(Integer)
    end_date = Column(Integer)
    comment = Column(Text)
    remind_policy = Column(Integer)
    state = Column(Integer)
    fav = Column(Boolean)
    priority = Column(Integer)
    ext_i = Column(Integer)
    ext_t = Column(Text) 