from sqlalchemy import Integer, Text, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .base import Base
from ..dtos.block_dto import BlockDTO


class Block(Base):
    """
    Quarter-hourly block of time logged by the user.
    """
    __tablename__ = 'Block'

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[int] = mapped_column(Integer)
    type_uid: Mapped[int] = mapped_column(Integer, ForeignKey('Type.uid'), nullable=True, default=0)
    project_uid: Mapped[int] = mapped_column(Integer, ForeignKey('Project.uid'), nullable=True, default=0)
    comment: Mapped[str] = mapped_column(Text, default='')

    type_ = relationship('Type', foreign_keys=[type_uid])
    project = relationship('Project', foreign_keys=[project_uid])


    def to_dto(self) -> BlockDTO:
        return BlockDTO(
            uid=self.uid,
            date=self.date,
            type_=self.type_.to_dto() if self.type_ else None,
            project=self.project.to_dto() if self.project else None,
            comment=self.comment)