from typing import Callable, TypeVar, cast, Any, Dict, Union, Tuple
from functools import wraps
from flasgger import swag_from as _swag_from
from flask import Response as FlaskResponse

F = TypeVar('F', bound=Callable[..., Any])
RouteReturn = Union[FlaskResponse, Tuple[FlaskResponse, int]]

def swag_from(specs: Dict[str, Any] | str) -> Callable[[F], F]:
    def decorator(f: F) -> F:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            return _swag_from(specs)(f)(*args, **kwargs)
        return cast(F, wrapped)
    return decorator 