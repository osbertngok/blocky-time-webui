import time
import logging
from functools import wraps
from typing import Callable, TypeVar, ParamSpec

P = ParamSpec('P')
T = TypeVar('T')

log = logging.getLogger(__name__)

def timeit(func: Callable[P, T]) -> Callable[P, T]:
    """
    Decorator that logs the execution time of a function using time.monotonic().
    
    Args:
        func: The function to be timed
        
    Returns:
        Wrapped function that logs its execution time
    """
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        start_time = time.monotonic()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            elapsed_time = time.monotonic() - start_time
            log.info(f"{func.__module__}.{func.__qualname__} took {elapsed_time:.3f} seconds")
    
    return wrapper
