"""Backup rotation utility for DB.db.

Pull-backup rotation (N = BLOCKY_MAX_BACKUPS, default 10):
  Slots .1 – .N; overflow .N+1 is removed on success.

Push-backup rotation (M = BLOCKY_MAX_PUSH_BACKUPS, default 10):
  Same scheme applied to DB.db.pre-push (different base path).
  Slots .1 – .M; overflow .M+1 is removed on success.
"""

import logging
import os

log = logging.getLogger(__name__)

MAX_BACKUPS: int = int(os.environ.get("BLOCKY_MAX_BACKUPS", "10"))
MAX_PUSH_BACKUPS: int = int(os.environ.get("BLOCKY_MAX_PUSH_BACKUPS", "10"))


def rotate_backups(output_path: str, max_backups: int = MAX_BACKUPS) -> None:
    """Rotate existing backups before overwriting output_path.

    Shifts .N → .N+1 (overflow), .N-1 → .N, …, .1 → .2, output_path → .1.
    Call cleanup_overflow() after a successful operation to remove the overflow slot.
    """
    for n in range(max_backups, 0, -1):
        src = f"{output_path}.{n}"
        dst = f"{output_path}.{n + 1}"
        if os.path.exists(src):
            os.replace(src, dst)
            log.debug("rotate_backups: %s → %s", src, dst)

    if os.path.exists(output_path):
        dst = f"{output_path}.1"
        os.replace(output_path, dst)
        log.debug("rotate_backups: %s → %s", output_path, dst)


def cleanup_overflow(output_path: str, max_backups: int = MAX_BACKUPS) -> None:
    """Remove the overflow slot (max_backups+1) after a successful operation."""
    overflow = f"{output_path}.{max_backups + 1}"
    if os.path.exists(overflow):
        os.remove(overflow)
        log.debug("cleanup_overflow: removed %s", overflow)
