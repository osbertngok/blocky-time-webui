from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from ..dtos.type_dto import TypeDTO


class Type(Base):
    __tablename__ = 'Type'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    category_uid = Column(Integer, ForeignKey('Category.uid'), default=0)
    name = Column(Text, default='')
    color = Column(Integer)
    hidden = Column(Boolean)
    priority = Column(Integer)

    category = relationship('Category')

    def to_dto(self) -> TypeDTO:
        return TypeDTO(
            uid=self.uid,
            name=self.name,
            color=self.color,
            hidden=self.hidden,
            priority=self.priority,
            category=self.category.to_dto() if self.category else None
            )
