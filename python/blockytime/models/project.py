from sqlalchemy import Column, Integer, Text, Boolean
from .base import Base
from ..dtos.project_dto import ProjectDTO
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

    def to_dto(self) -> ProjectDTO:
        return ProjectDTO(
            uid=self.uid,
            name=self.name,
            abbr=self.abbr,
            latin=self.latin,
            acronym=self.acronym,
            hidden=self.hidden,
            classify_uid=self.classify_uid,
            taglist=self.taglist,
            priority=self.priority
        )
