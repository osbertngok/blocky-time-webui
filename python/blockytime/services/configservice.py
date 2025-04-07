from blockytime.dtos.blockytimeconfig_dto import BlockyTimeConfig
from blockytime.interfaces.configserviceinterface import ConfigServiceInterface
from blockytime.models.config import Config
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session


class ConfigService(ConfigServiceInterface):

    def __init__(self, engine: Engine):
        self.engine = engine

    def get_config(self) -> BlockyTimeConfig:
        ret = BlockyTimeConfig(
            main_time_precision=1, disable_pixelate=False, special_time_period=[]
        )
        with Session(self.engine) as session:
            configs = session.query(Config).all()
            for config in configs:
                if config.key == "mainTimePrecision":
                    ret.main_time_precision = int(config.value[-1])
                elif config.key == "disablePixelate":
                    ret.disable_pixelate = config.value == "I_1"
                elif config.key == "specialTimePeriod":
                    ret.special_time_period = [
                        tuple(map(int, s.split("-")))
                        for s in config.value.replace("S_", "").split(",")
                    ]
        return ret
