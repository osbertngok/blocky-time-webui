from typing import Callable, TypeVar, cast, Any, Dict, Union, Tuple
from functools import wraps
from flasgger import swag_from as _swag_from
from flask import Response as FlaskResponse, current_app
from ..services.di import get_service_provider, FlaskWithServiceProvider
from ..interfaces.blockserviceinterface import BlockServiceInterface
from ..interfaces.typeserviceinterface import TypeServiceInterface


RouteReturn = Union[FlaskResponse, Tuple[FlaskResponse, int]]
F = TypeVar('F', bound=Callable[..., Any])


def swag_from(specs: Dict[str, Any] | str) -> Callable[[F], F]:
    def decorator(f: F) -> F:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            return _swag_from(specs)(f)(*args, **kwargs)
        return cast(F, wrapped)
    return decorator 


R = TypeVar('R', bound=RouteReturn, covariant=True)

def inject_blockservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject photo service as named argument"""
    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(cast(FlaskWithServiceProvider, current_app))
        service = service_provider.get(BlockServiceInterface) # type: ignore
        return f(block_service=service, *args, **kwargs)
    return wrapper

def inject_typeservice(f: Callable[..., R]) -> Callable[..., R]:
    """Inject type service as named argument"""
    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> R:
        service_provider = get_service_provider(cast(FlaskWithServiceProvider, current_app))
        service = service_provider.get(TypeServiceInterface) # type: ignore
        return f(type_service=service, *args, **kwargs)
    return wrapper