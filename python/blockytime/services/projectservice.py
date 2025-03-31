from blockytime.interfaces.projectserviceinterface import ProjectServiceInterface
from blockytime.dtos.project_dto import ProjectDTO
from datetime import datetime
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from blockytime.models.project import Project

class ProjectService(ProjectServiceInterface):
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_projects(self) -> list[ProjectDTO]:
        with Session(self._engine) as session:
            projects = session.query(Project).all()
            return [project.to_dto() for project in projects]
