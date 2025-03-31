from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from ..dtos.block_dto import BlockDTO


class Block(Base):
    """
    Quarter-hourly block of time logged by the user.
    """
    __tablename__ = 'Block'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Integer)
    type_uid = Column(Integer, ForeignKey('Type.uid'), nullable=True, default=0)
    project_uid = Column(Integer, ForeignKey('Project.uid'), nullable=True, default=0)
    comment = Column(Text, default='')

    type_ = relationship('Type', foreign_keys=[type_uid])
    project = relationship('Project', foreign_keys=[project_uid])


    def to_dto(self) -> BlockDTO:
        return BlockDTO(
            uid=self.uid,
            date=self.date,
            type_=self.type_.to_dto() if self.type_ else None,
            project=self.project.to_dto() if self.project else None,
            comment=self.comment)