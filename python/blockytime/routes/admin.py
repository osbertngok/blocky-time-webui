"""Admin routes for device management operations."""

import logging
import os
import shutil
import tempfile

from flask import Blueprint, jsonify
from sqlalchemy import Engine

from ..backup import MAX_PUSH_BACKUPS, cleanup_overflow, rotate_backups
from ..routes.decorators import RouteReturn

log = logging.getLogger(__name__)

BUNDLE_ID = "com.anniapp.Timeblocks"
DB_FILENAME = "DB.db"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "dynamic")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, DB_FILENAME)
PRE_PUSH_BACKUP_PATH = os.path.join(OUTPUT_DIR, "DB.db.pre-push")


def create_admin_blueprint(engine: Engine) -> Blueprint:
    bp = Blueprint("admin", __name__)

    @bp.route("/api/v1/admin/pull-db", methods=["POST"])
    def pull_db() -> RouteReturn:
        """Pull DB.db from a USB-connected iPhone and reload the database."""
        try:
            from pymobiledevice3.lockdown import create_using_usbmux
            from pymobiledevice3.services.house_arrest import HouseArrestService
        except ImportError:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "pymobiledevice3 is not installed. Run 'make build' first.",
                    }
                ),
                500,
            )

        log.info("pull-db: connecting to USB device...")
        try:
            lockdown = create_using_usbmux()
        except Exception as e:
            msg = (
                f"Could not connect to device. Is an iPhone connected and trusted? {e}"
            )
            log.warning(f"pull-db: {msg}")
            return jsonify({"status": "error", "message": msg}), 503

        device_name = lockdown.display_name
        ios_version = lockdown.product_version
        log.info(f"pull-db: connected to {device_name} (iOS {ios_version})")

        try:
            service = HouseArrestService(
                lockdown=lockdown, bundle_id=BUNDLE_ID, documents_only=True
            )
        except Exception as e:
            msg = f"Could not access app container for {BUNDLE_ID}: {e}"
            log.warning(f"pull-db: {msg}")
            return jsonify({"status": "error", "message": msg}), 503

        remote_path = f"Documents/{DB_FILENAME}"
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Rotate backups before overwriting
        log.info("pull-db: rotating backups...")
        rotate_backups(OUTPUT_PATH)

        tmp_dir = tempfile.mkdtemp(dir=OUTPUT_DIR)
        tmp_path = os.path.join(tmp_dir, DB_FILENAME)
        try:
            service.pull(remote_path, tmp_dir)
            shutil.move(tmp_path, OUTPUT_PATH)
        except Exception as e:
            msg = f"Could not pull {remote_path} from app container: {e}"
            log.error(f"pull-db: {msg}")
            shutil.rmtree(tmp_dir, ignore_errors=True)
            return jsonify({"status": "error", "message": msg}), 500
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

        cleanup_overflow(OUTPUT_PATH)
        log.info("pull-db: backup rotation complete")

        abs_output = os.path.abspath(OUTPUT_PATH)
        size_kb = os.path.getsize(abs_output) / 1024
        log.info(f"pull-db: saved {size_kb:.1f} KB to {abs_output}")

        # Dispose connection pool so next query reads the fresh DB file
        engine.dispose()
        log.info("pull-db: connection pool disposed, fresh connections will use new DB")

        return jsonify(
            {
                "status": "success",
                "device": f"{device_name} (iOS {ios_version})",
                "size_kb": round(size_kb, 1),
            }
        )

    @bp.route("/api/v1/admin/push-db", methods=["POST"])
    def push_db() -> RouteReturn:
        """Push local DB.db to a USB-connected iPhone.

        Before pushing, the iPhone's current DB is pulled and saved as a
        rotating pre-push backup (DB.db.pre-push.1 … .N, controlled by
        BLOCKY_MAX_PUSH_BACKUPS env var, default 10).
        """
        if not os.path.exists(OUTPUT_PATH):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Local DB not found at {OUTPUT_PATH}",
                    }
                ),
                400,
            )

        try:
            from pymobiledevice3.lockdown import create_using_usbmux
            from pymobiledevice3.services.house_arrest import HouseArrestService
        except ImportError:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "pymobiledevice3 is not installed. Run 'make build' first.",
                    }
                ),
                500,
            )

        log.info("push-db: connecting to USB device...")
        try:
            lockdown = create_using_usbmux()
        except Exception as e:
            msg = (
                f"Could not connect to device. Is an iPhone connected and trusted? {e}"
            )
            log.warning(f"push-db: {msg}")
            return jsonify({"status": "error", "message": msg}), 503

        device_name = lockdown.display_name
        ios_version = lockdown.product_version
        log.info(f"push-db: connected to {device_name} (iOS {ios_version})")

        try:
            service = HouseArrestService(
                lockdown=lockdown, bundle_id=BUNDLE_ID, documents_only=True
            )
        except Exception as e:
            msg = f"Could not access app container for {BUNDLE_ID}: {e}"
            log.warning(f"push-db: {msg}")
            return jsonify({"status": "error", "message": msg}), 503

        remote_path = f"Documents/{DB_FILENAME}"
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Back up iPhone's current DB before overwriting it
        log.info("push-db: backing up iPhone DB before push...")
        rotate_backups(PRE_PUSH_BACKUP_PATH, MAX_PUSH_BACKUPS)
        tmp_dir = tempfile.mkdtemp(dir=OUTPUT_DIR)
        tmp_path = os.path.join(tmp_dir, DB_FILENAME)
        try:
            service.pull(remote_path, tmp_dir)
            shutil.move(tmp_path, PRE_PUSH_BACKUP_PATH)
        except Exception as e:
            msg = f"Could not back up iPhone DB before push: {e}"
            log.error(f"push-db: {msg}")
            shutil.rmtree(tmp_dir, ignore_errors=True)
            return jsonify({"status": "error", "message": msg}), 500
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        cleanup_overflow(PRE_PUSH_BACKUP_PATH, MAX_PUSH_BACKUPS)
        log.info("push-db: iPhone DB backed up to %s", PRE_PUSH_BACKUP_PATH)

        # Push local DB to the iPhone
        log.info("push-db: pushing %s → %s ...", OUTPUT_PATH, remote_path)
        try:
            service.push(OUTPUT_PATH, remote_path)
        except Exception as e:
            msg = f"Could not push {OUTPUT_PATH} to device: {e}"
            log.error(f"push-db: {msg}")
            return jsonify({"status": "error", "message": msg}), 500

        size_kb = os.path.getsize(OUTPUT_PATH) / 1024
        log.info(f"push-db: pushed {size_kb:.1f} KB to {device_name}")

        return jsonify(
            {
                "status": "success",
                "device": f"{device_name} (iOS {ios_version})",
                "size_kb": round(size_kb, 1),
            }
        )

    return bp
