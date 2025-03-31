from sqlalchemy import Column, Integer, Text
from .base import Base
from ..dtos.category_dto import CategoryDTO
class Category(Base):
    __tablename__ = 'Category'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, default='') 

    def to_dto(self) -> CategoryDTO:
        return CategoryDTO(
            uid=self.uid,
            name=self.name)
