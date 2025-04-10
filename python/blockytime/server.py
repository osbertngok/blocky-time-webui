import logging
import os
import sys
from typing import TYPE_CHECKING

from flasgger import Swagger
from flask import Flask
from flask import Response as FlaskResponse
from flask import jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import OperationalError

from .interfaces.blockserviceinterface import BlockServiceInterface
from .interfaces.configdict import ConfigDict
from .interfaces.configserviceinterface import ConfigServiceInterface
from .interfaces.typeserviceinterface import TypeServiceInterface
from .interfaces.statisticsserviceinterface import StatisticsServiceInterface
from .log import ColoredFormatter
from .paths import DATA_PATH, DB_PATH, LOG_PATH
from .routes import blocks, configs, types, stats
from .routes.decorators import RouteReturn
from .services.blockservice import BlockService
from .services.configservice import ConfigService
from .services.di import FlaskWithServiceProvider, ServiceProvider
from .services.typeservice import TypeService
from .services.statisticsservice import StatisticsService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(LOG_PATH)],
)

# Set the custom formatter
for handler in logging.getLogger().handlers:
    handler.setFormatter(ColoredFormatter())

log = logging.getLogger(__name__)


if TYPE_CHECKING:
    from flask import Flask


def load_config(app: Flask) -> None:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

    # Near the top with other environment variables
    BLOCKYTIME_SERVER_PORT = int(os.getenv("BLOCKYTIME_SERVER_PORT", "5001"))
    app.config = ConfigDict(root_path=app.config.root_path, defaults=app.config)
    app.config["BLOCKYTIME_SERVER_PORT"] = BLOCKYTIME_SERVER_PORT
    app.config["GOOGLE_API_KEY"] = GOOGLE_API_KEY


def define_root_static_files(app: Flask) -> None:
    """Define routes for serving static files from root and assets directories"""

    # Add static routes for /assets/
    app.add_url_rule(
        "/assets/<path:filename>",
        endpoint="assets",
        view_func=lambda filename: send_from_directory("data/static/assets", filename),
    )

    # Add static routes for root-level static files
    @app.route("/<path:filename>.svg")
    @app.route("/<path:filename>.html")
    @app.route("/<path:filename>.css")
    @app.route("/<path:filename>.png")
    @app.route("/<path:filename>.jpg")
    def serve_static(filename: str) -> RouteReturn:
        """Serve static files from root path"""
        ext = request.path.split(".")[-1]
        return send_from_directory("data/static", f"{filename}.{ext}")

    # Catch-all route for client-side routing
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path: str) -> RouteReturn:
        # Skip API routes
        if path.startswith("api/"):
            return jsonify({"error": "Not Found"}), 404
        # Return index.html for all other routes
        return send_from_directory("data/static", "index.html")


def define_swagger(app: Flask) -> None:
    # Enable CORS
    CORS(app)

    # Configure Swagger
    app.config["SWAGGER"] = {
        "title": "FTCRM API",
        "uiversion": 3,
        "version": "1.0.0",
        "description": """
        API for managing business cards and company information from Russian trade expositions.
        
        This API provides endpoints for:
        * OCR processing of business cards
        * Company information management
        * Due diligence requests
        * Tag management
        """,
        "termsOfService": "",
        "contact": {"name": "API Support", "email": "support@example.com"},
        "license": {
            "name": "Private License",
        },
    }

    # Initialize Swagger
    Swagger(app)


def create_app() -> Flask:
    # Create and configure service provider and do manual dependency injection
    # Initialize database
    try:
        engine: Engine = init_database(DB_PATH, DATA_PATH)
        log.info(f"Database initialized with engine: {engine}")

        # Verify database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            log.info(f"Database connection test successful: {result.scalar()}")
    except RuntimeError as e:
        log.critical(f"Failed to initialize application: {e}")
        sys.exit(1)

    service_provider = ServiceProvider()

    app = FlaskWithServiceProvider(__name__, service_provider=service_provider)
    load_config(app)
    service_provider.register(BlockServiceInterface, BlockService(engine))  # type: ignore
    service_provider.register(TypeServiceInterface, TypeService(engine))  # type: ignore
    service_provider.register(ConfigServiceInterface, ConfigService(engine))  # type: ignore
    service_provider.register(StatisticsServiceInterface, StatisticsService(engine))  # type: ignore
    service_provider.register(ConfigDict, app.config)

    # Define static file routes
    define_root_static_files(app)
    define_swagger(app)

    # Set secret key for sessions
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

    # Apply auth middleware to all routes
    # app.before_request(require_auth)

    # Register blueprints
    app.register_blueprint(blocks.bp)
    app.register_blueprint(types.bp)
    app.register_blueprint(configs.bp)
    app.register_blueprint(stats.bp)
    # log.info("Registered company, namecard and auth routes")

    # Register routes
    @app.route("/")
    def index() -> FlaskResponse:
        """Serve index.html"""
        return send_from_directory("data/static", "index.html")

    @app.route("/api/v1/config")
    def config() -> FlaskResponse:
        return jsonify(
            {
                "google_api_key": app.config["GOOGLE_API_KEY"],
            }
        )

    return app


def ensure_data_directory(data_path: str) -> None:
    """Ensure the data directory exists"""
    try:
        os.makedirs(data_path, exist_ok=True)
        log.info(f"Data directory ensured at: {data_path}")
    except OSError as e:
        log.error(f"Failed to create data directory: {e}")
        raise RuntimeError(f"Failed to create data directory: {e}") from e


def check_db_connection(engine: Engine) -> None:
    """Test database connection"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
        log.info("Database connection successful")
    except OperationalError as e:
        log.error(f"Database connection failed: {e}")
        raise RuntimeError(f"Database connection failed: {e}") from e


def init_database(db_path: str, data_path: str) -> Engine:
    """Initialize database and create tables if they don't exist"""
    try:
        # Ensure data directory exists
        ensure_data_directory(data_path=data_path)

        # Create database engine
        engine: Engine = create_engine(f"sqlite:///{db_path}")

        # Test database connection
        check_db_connection(engine=engine)

        return engine

    except Exception as e:
        log.error(f"Database initialization failed: {e}")
        if isinstance(e, RuntimeError):
            raise
        raise RuntimeError(f"Database initialization failed: {e}") from e


# And only create the app in __main__.py:
from .server import create_app

if __name__ == "__main__":
    app = create_app()  # Create app once
    app.run(host="0.0.0.0", port=app.config["BLOCKYTIME_SERVER_PORT"])
