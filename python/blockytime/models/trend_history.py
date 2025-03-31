from sqlalchemy import Column, Integer, Text
from .base import Base

class TrendHistory(Base):
    __tablename__ = 'TrendHistory'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    target = Column(Integer, nullable=False)
    target_ids = Column(Text, default='') 