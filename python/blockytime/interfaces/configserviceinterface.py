from typing import Protocol

from ..dtos.blockytimeconfig_dto import BlockyTimeConfig


class ConfigServiceInterface(Protocol):

    def get_config(self) -> BlockyTimeConfig: ...
