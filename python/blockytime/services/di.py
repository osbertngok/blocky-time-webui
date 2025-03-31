from typing import Dict, Any, Type, TypeVar, cast
from flask import Flask, g

# T is a TypeVar bound to object since Protocol can't be used as a bound
T = TypeVar('T', bound=object)

class ServiceProvider:
    # Use Any for the Dict key type since we can't use Protocol directly
    _services: Dict[Type[Any], Any]

    def __init__(self) -> None:
        self._services = {}

    def register(self, interface: Type[T], implementation: Any) -> None:
        """Register an implementation for an interface"""
        self._services[interface] = implementation

    def get(self, interface: Type[T]) -> T:
        """Get the implementation for an interface"""
        if interface not in self._services:
            raise KeyError(f"No implementation registered for interface {interface}")
        return cast(T, self._services[interface])

def get_service_provider(app: "FlaskWithServiceProvider") -> ServiceProvider:
    """Get or create the service provider for the current request"""
    if not hasattr(g, 'service_provider'):
        g.service_provider = getattr(app, 'service_provider', ServiceProvider())
    return cast(ServiceProvider, g.service_provider)

class FlaskWithServiceProvider(Flask):
    service_provider: ServiceProvider

    def __init__(self, import_name: str, service_provider: ServiceProvider, **kwargs: Any) -> None:
        super().__init__(import_name, **kwargs)
        self.service_provider = service_provider
