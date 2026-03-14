"""Pull DB.db from a USB-connected iPhone running BlockyTime."""

import os
import shutil
import sys
import tempfile

from python.blockytime.backup import cleanup_overflow, rotate_backups

BUNDLE_ID = "com.anniapp.Timeblocks"
DB_FILENAME = "DB.db"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "dynamic")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, DB_FILENAME)


def main() -> None:
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
        print(f"Error: Could not connect to device. Is an iPhone connected and trusted?\n{e}")
        sys.exit(1)

    print(f"Connected to {lockdown.display_name} (iOS {lockdown.product_version})")
    print(f"Accessing app container for {BUNDLE_ID}...")

    try:
        service = HouseArrestService(lockdown=lockdown, bundle_id=BUNDLE_ID, documents_only=True)
    except Exception as e:
        print(f"Error: Could not access app container for {BUNDLE_ID}.\n{e}")
        sys.exit(1)

    remote_path = f"Documents/{DB_FILENAME}"
    print(f"Pulling {remote_path}...")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Rotate backups before overwriting
    print("Rotating backups...")
    rotate_backups(OUTPUT_PATH)

    # Pull to a temp file first, then move atomically
    tmp_dir = tempfile.mkdtemp(dir=OUTPUT_DIR)
    tmp_path = os.path.join(tmp_dir, DB_FILENAME)
    try:
        service.pull(remote_path, tmp_dir)
        shutil.move(tmp_path, OUTPUT_PATH)
    except Exception as e:
        print(f"Error: Could not pull {remote_path} from app container.\n{e}")
        shutil.rmtree(tmp_dir, ignore_errors=True)
        sys.exit(1)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    cleanup_overflow(OUTPUT_PATH)

    abs_output = os.path.abspath(OUTPUT_PATH)
    size_kb = os.path.getsize(abs_output) / 1024
    print(f"Saved {size_kb:.1f} KB to {abs_output}")


if __name__ == "__main__":
    main()
