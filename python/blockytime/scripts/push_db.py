"""Push local DB.db to a USB-connected iPhone running BlockyTime.

Before pushing, the iPhone's current DB is pulled and saved as a rotating
pre-push backup (DB.db.pre-push.1 … .N, controlled by BLOCKY_MAX_PUSH_BACKUPS,
default 10).
"""

import os
import shutil
import sys
import tempfile

from blockytime.backup import MAX_PUSH_BACKUPS, cleanup_overflow, rotate_backups

BUNDLE_ID = "com.anniapp.Timeblocks"
DB_FILENAME = "DB.db"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "dynamic")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, DB_FILENAME)
PRE_PUSH_BACKUP_PATH = os.path.join(OUTPUT_DIR, "DB.db.pre-push")


def main() -> None:
    if not os.path.exists(OUTPUT_PATH):
        print(f"Error: Local DB not found at {os.path.abspath(OUTPUT_PATH)}")
        sys.exit(1)

    try:
        from pymobiledevice3.lockdown import create_using_usbmux
        from pymobiledevice3.services.house_arrest import HouseArrestService
    except ImportError:
        print("Error: pymobiledevice3 is not installed. Run 'make build' first.")
        sys.exit(1)

    print("Connecting to USB device...")
    try:
        lockdown = create_using_usbmux()
    except Exception as e:
        print(
            f"Error: Could not connect to device. Is an iPhone connected and trusted?\n{e}"
        )
        sys.exit(1)

    print(f"Connected to {lockdown.display_name} (iOS {lockdown.product_version})")
    print(f"Accessing app container for {BUNDLE_ID}...")

    try:
        service = HouseArrestService(
            lockdown=lockdown, bundle_id=BUNDLE_ID, documents_only=True
        )
    except Exception as e:
        print(f"Error: Could not access app container for {BUNDLE_ID}.\n{e}")
        sys.exit(1)

    remote_path = f"Documents/{DB_FILENAME}"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Back up iPhone's current DB before overwriting it
    print("Backing up iPhone DB before push...")
    rotate_backups(PRE_PUSH_BACKUP_PATH, MAX_PUSH_BACKUPS)
    tmp_dir = tempfile.mkdtemp(dir=OUTPUT_DIR)
    tmp_path = os.path.join(tmp_dir, DB_FILENAME)
    try:
        service.pull(remote_path, tmp_dir)
        shutil.move(tmp_path, PRE_PUSH_BACKUP_PATH)
    except Exception as e:
        print(f"Error: Could not back up iPhone DB before push.\n{e}")
        shutil.rmtree(tmp_dir, ignore_errors=True)
        sys.exit(1)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    cleanup_overflow(PRE_PUSH_BACKUP_PATH, MAX_PUSH_BACKUPS)
    print(f"iPhone DB backed up to {os.path.abspath(PRE_PUSH_BACKUP_PATH)}")

    # Push local DB to the iPhone
    print(f"Pushing {os.path.abspath(OUTPUT_PATH)} → {remote_path} ...")
    try:
        service.push(OUTPUT_PATH, remote_path)
    except Exception as e:
        print(f"Error: Could not push DB to device.\n{e}")
        sys.exit(1)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"Pushed {size_kb:.1f} KB to {lockdown.display_name}")


if __name__ == "__main__":
    main()
