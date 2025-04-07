import logging
import os

log = logging.getLogger(__name__)

# Get data path from environment or use default
DATA_PATH = os.getenv(
    "BLOCKYTIME_DATA_PATH", os.path.join(os.path.dirname(__file__), "..", "data")
)
DYNAMIC_PATH = os.path.join(DATA_PATH, "dynamic")

# Ensure data paths exist
os.makedirs(DATA_PATH, exist_ok=True)
os.makedirs(DYNAMIC_PATH, exist_ok=True)

# Define paths for different data types
DB_PATH = os.path.join(DYNAMIC_PATH, "DB.db")
LOG_PATH = os.path.join(DYNAMIC_PATH, "blockytime.log")
