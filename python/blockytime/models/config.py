from sqlalchemy import Column, Text
from .base import Base

class Config(Base):
    __tablename__ = 'Config'

    key = Column(Text, primary_key=True, default='')
    value = Column(Text, default='') 