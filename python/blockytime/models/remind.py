from sqlalchemy import Column, Integer, Text, Boolean, Float, String, ForeignKey
from .base import Base

class Remind(Base):
    __tablename__ = 'Remind'

    uid = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(Text, nullable=False, default='')
    block_date = Column(Integer)
    alert_type = Column(Integer)
    alert_offset = Column(Integer)
    ring_index = Column(Integer)
    alert_msg = Column(Text, default='')
    type_uid = Column(Integer, ForeignKey('Type.uid'))
    project_uid = Column(Integer, ForeignKey('Project.uid'))
    place_uid = Column(Integer)
    person_uids = Column(String)
    comment = Column(Text)
    repeat = Column(Integer)
    state = Column(Boolean)
    ext_i = Column(Integer)
    ext_t = Column(Text, default='')
    ext_d = Column(Float) 