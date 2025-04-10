from functools import wraps
from typing import Any, Callable, Dict, Tuple, TypeVar, Union, cast

from flasgger import swag_from as _swag_from
from flask import Response as FlaskResponse
from flask import current_app

from ..interfaces.blockserviceinterface import BlockServiceInterface
from ..interfaces.configserviceinterface import ConfigServiceInterface
from ..interfaces.typeserviceinterface import TypeServiceInterface
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..services.di import FlaskWithServiceProvider, get_service_provider

RouteReturn = Union[FlaskResponse, Tuple[FlaskResponse, int]]
F = TypeVar("F", bound=Callable[..., Any])


def swag_from(specs: Dict[str, Any] | str) -> Callable[[F], F]:
    def decorator(f: F) -> F:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            return _swag_from(specs)(f)(*args, **kwargs)

        return cast(F, wrapped)

    return decorator


R = TypeVar("R", bound=RouteReturn, covariant=True)


def inject_blockservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject photo service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(BlockServiceInterface)  # type: ignore
        return f(block_service=service, *args, **kwargs)

    return wrapper


def inject_typeservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject type service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(TypeServiceInterface)  # type: ignore
        return f(type_service=service, *args, **kwargs)

    return wrapper


def inject_configservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject config service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(ConfigServiceInterface)  # type: ignore
        return f(config_service=service, *args, **kwargs)

    return wrapper

def inject_statisticsservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject statistics service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(StatisticsServiceInterface)  # type: ignore
        return f(statistics_service=service, *args, **kwargs)

    return wrapper

def inject_trendservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject trend service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(TrendServiceInterface)  # type: ignore
        return f(trend_service=service, *args, **kwargs)
    
    return wrapper