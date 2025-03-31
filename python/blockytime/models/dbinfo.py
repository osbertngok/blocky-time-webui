from sqlalchemy import Column, Integer, String
from .base import Base

class DBInfo(Base):
    __tablename__ = 'DBinfo'

    version = Column(Integer, primary_key=True)
    info = Column(String) 