import logging
import sys
from typing import Any

from .paths import LOG_PATH


# Define color codes
class ColoredFormatter(logging.Formatter):
    """Custom formatter that adds colors to log levels"""

    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[0;36m",  # Cyan
        "INFO": "\033[0;32m",  # Green
        "WARNING": "\033[0;33m",  # Yellow
        "ERROR": "\033[0;31m",  # Red
        "CRITICAL": "\033[0;37;41m",  # White on Red
        "RESET": "\033[0m",  # Reset
    }

    def __init__(self) -> None:
        # Use detailed format with thread name, function name and line number
        super().__init__(
            fmt="%(asctime)s - %(threadName)s - %(name)s:%(funcName)s:%(lineno)d - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    def format(self, record: Any) -> str:
        # Save original levelname
        original_levelname = record.levelname
        # Add color to levelname
        record.levelname = f"{self.COLORS.get(record.levelname, self.COLORS['RESET'])}{record.levelname}{self.COLORS['RESET']}"
        # Format the message
        result = super().format(record)
        # Restore original levelname
        record.levelname = original_levelname
        return result


# Configure logging with the same detailed format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(threadName)s - %(name)s:%(funcName)s:%(lineno)d - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(LOG_PATH)],
)

# Set the custom formatter
for handler in logging.getLogger().handlers:
    handler.setFormatter(ColoredFormatter())

log = logging.getLogger(__name__)
