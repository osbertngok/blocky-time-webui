from sqlalchemy import Column, Integer, Text
from .base import Base

class Category(Base):
    __tablename__ = 'Category'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, default='') 