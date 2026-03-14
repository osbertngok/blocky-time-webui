import gzip
import json
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Tuple, TypeVar, Union, cast

import pytz
from flasgger import swag_from as _swag_from
from flask import Response as FlaskResponse
from flask import current_app, make_response, request

from ..constants import DEFAULT_TZ
from ..interfaces.blockserviceinterface import BlockServiceInterface
from ..interfaces.configserviceinterface import ConfigServiceInterface
from ..interfaces.projectserviceinterface import ProjectServiceInterface
from ..interfaces.sleepserviceinterface import SleepServiceInterface
from ..interfaces.statisticsserviceinterface import StatisticsServiceInterface
from ..interfaces.trendserviceinterface import TrendServiceInterface
from ..interfaces.typeserviceinterface import TypeServiceInterface
from ..services.di import FlaskWithServiceProvider, get_service_provider

RouteReturn = Union[FlaskResponse, Tuple[FlaskResponse, int]]
F = TypeVar("F", bound=Callable[..., Any])


def make_gzip_json_response(data: Any) -> RouteReturn:
    """Build a JSON response with gzip compression when the client supports it."""
    ret = {"data": data, "error": None}
    gzip_supported = "gzip" in request.headers.get("Accept-Encoding", "").lower()
    if gzip_supported:
        content = gzip.compress(json.dumps(ret).encode("utf-8"), 5)
    else:
        content = json.dumps(ret).encode("utf-8")
    response = make_response(content)
    response.headers["Content-Type"] = "application/json"
    response.headers["Content-Length"] = str(len(content))
    if gzip_supported:
        response.headers["Content-Encoding"] = "gzip"
    return response, 200


def parse_date_range_params() -> Tuple[datetime, datetime]:
    """Parse start_date and end_date from request args, localized to the default timezone.

    Raises ValueError with a descriptive message if a parameter is missing or malformed.
    """
    start_date_str = request.args.get("start_date")
    if start_date_str is None:
        raise ValueError("start_date is required")
    end_date_str = request.args.get("end_date")
    if end_date_str is None:
        raise ValueError("end_date is required")
    tz = pytz.timezone(DEFAULT_TZ)
    start_date = tz.localize(datetime.strptime(start_date_str, "%Y-%m-%d"))
    end_date = tz.localize(datetime.strptime(end_date_str, "%Y-%m-%d"))
    return start_date, end_date


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


def inject_projectservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject project service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(ProjectServiceInterface)  # type: ignore
        return f(project_service=service, *args, **kwargs)

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


def inject_sleepservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject sleep service as named argument"""

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(
            cast(FlaskWithServiceProvider, current_app)
        )
        service = service_provider.get(SleepServiceInterface)  # type: ignore
        return f(sleep_service=service, *args, **kwargs)

    return wrapper
