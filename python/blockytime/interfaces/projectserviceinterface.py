from typing import Protocol

from blockytime.dtos.project_dto import ProjectDTO


class ProjectServiceInterface(Protocol):
    def get_projects(self) -> list[ProjectDTO]:
        """
        Get projects
        """
        ...
