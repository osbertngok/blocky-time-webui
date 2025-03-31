from sqlalchemy import Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from ..dtos.category_dto import CategoryDTO
class Category(Base):
    __tablename__ = 'Category'

    uid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, default='') 

    def to_dto(self) -> CategoryDTO:
        return CategoryDTO(
            uid=self.uid,
            name=self.name)
