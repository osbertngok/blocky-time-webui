from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

def get_engine(db_path):
    return create_engine(f'sqlite:///{db_path}')

def get_session(engine):
    Session = sessionmaker(bind=engine)
    return Session()
