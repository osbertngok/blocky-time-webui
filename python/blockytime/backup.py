"""Backup rotation utility for DB.db.

Rotation scheme (N slots, .1 – .N, where N = BLOCKY_MAX_BACKUPS env var, default 10):
  Before pull:  .N → .N+1 (overflow slot, removed on success)
                .N-1 → .N
                ...
                .1 → .2
                DB.db → .1
  After success: remove .N+1 if present.
"""

import logging
import os

log = logging.getLogger(__name__)

MAX_BACKUPS: int = int(os.environ.get("BLOCKY_MAX_BACKUPS", "10"))


def rotate_backups(output_path: str) -> None:
    """Rotate existing backups before pulling a fresh DB.

    Keeps up to MAX_BACKUPS (BLOCKY_MAX_BACKUPS env var, default 10).
    The overflow slot (MAX_BACKUPS+1) is removed by cleanup_overflow() on success.
    """
    # Rotate from highest to lowest to avoid overwriting
    for n in range(MAX_BACKUPS, 0, -1):
        src = f"{output_path}.{n}"
        dst = f"{output_path}.{n + 1}"
        if os.path.exists(src):
            os.replace(src, dst)
            log.debug("rotate_backups: %s → %s", src, dst)

    # Current DB becomes .1
    if os.path.exists(output_path):
        dst = f"{output_path}.1"
        os.replace(output_path, dst)
        log.debug("rotate_backups: %s → %s", output_path, dst)


def cleanup_overflow(output_path: str) -> None:
    """Remove the overflow backup (slot MAX_BACKUPS+1) after a successful pull."""
    overflow = f"{output_path}.{MAX_BACKUPS + 1}"
    if os.path.exists(overflow):
        os.remove(overflow)
        log.debug("cleanup_overflow: removed %s", overflow)
