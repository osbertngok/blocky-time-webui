from sqlalchemy import Column, Integer, ForeignKey
from .base import Base

class Link(Base):
    __tablename__ = 'Link'

    type_uid = Column(Integer, ForeignKey('Type.uid'), primary_key=True)
    project_uid = Column(Integer, ForeignKey('Project.uid'), primary_key=True) 