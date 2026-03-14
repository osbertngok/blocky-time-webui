"""AI-callable CLI tools for BlockyTime data.

Usage:
    python -m python.blockytime.scripts.ai_tools <command> [args]

Commands:
    list-commands       Print JSON description of all available commands
    get-types           List all types (with categories and linked projects)
    get-projects        List all projects
    get-blocks          Get raw blocks for a date range
    set-blocks          Upsert blocks (JSON via --data or stdin)
    delete-blocks       Delete all blocks in a date range
    get-daily-summary   Compact human-readable ledger grouped by day
    get-active-days     List days that have at least one block
    get-stats           Aggregated hours per type/project for a date range
"""

import argparse
import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

import pytz
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session

from python.blockytime.models.block import Block
from python.blockytime.models.project import Project
from python.blockytime.models.type_ import Type
from python.blockytime.paths import DB_PATH

DEFAULT_TIMEZONE = "Asia/Hong_Kong"

COMMANDS_DESCRIPTION = [
    {
        "name": "list-commands",
        "description": "Print JSON description of all available AI tool commands.",
        "args": [],
    },
    {
        "name": "get-types",
        "description": (
            "List all activity types with their category and linked projects. "
            "Use the returned uid values when calling set-blocks."
        ),
        "args": [],
    },
    {
        "name": "get-projects",
        "description": (
            "List all projects (second-level objects). "
            "Use the returned uid values when calling set-blocks."
        ),
        "args": [],
    },
    {
        "name": "get-blocks",
        "description": (
            "Return raw blocks (15-min time entries) for a date range. "
            "Each block has a unix timestamp, type, project, and comment."
        ),
        "args": [
            {"name": "--start-date", "format": "YYYY-MM-DD", "required": True},
            {"name": "--end-date", "format": "YYYY-MM-DD (exclusive)", "required": True},
            {"name": "--timezone", "default": DEFAULT_TIMEZONE, "required": False},
        ],
    },
    {
        "name": "set-blocks",
        "description": (
            "Upsert (create or overwrite) blocks. "
            "Supply a JSON array via --data or pipe to stdin. "
            "Each item: {\"date\": \"YYYY-MM-DDTHH:MM\" or unix_ts, "
            "\"type_uid\": int, \"project_uid\": int|null, \"comment\": str}"
        ),
        "args": [
            {"name": "--data", "format": "JSON string", "required": False,
             "note": "If omitted, JSON is read from stdin"},
            {"name": "--timezone", "default": DEFAULT_TIMEZONE, "required": False,
             "note": "Used when date is a naive ISO string without tz offset"},
        ],
    },
    {
        "name": "delete-blocks",
        "description": "Delete all blocks whose timestamp falls in [start_date, end_date).",
        "args": [
            {"name": "--start-date", "format": "YYYY-MM-DD", "required": True},
            {"name": "--end-date", "format": "YYYY-MM-DD (exclusive)", "required": True},
            {"name": "--timezone", "default": DEFAULT_TIMEZONE, "required": False},
        ],
    },
    {
        "name": "get-daily-summary",
        "description": (
            "Return a human-readable ledger grouped by calendar day. "
            "Each day maps to a list of {time, type_uid, type, project_uid, project, comment}. "
            "Useful for understanding the user's daily schedule, commute, meals, etc."
        ),
        "args": [
            {"name": "--start-date", "format": "YYYY-MM-DD", "required": True},
            {"name": "--end-date", "format": "YYYY-MM-DD (exclusive)", "required": True},
            {"name": "--timezone", "default": DEFAULT_TIMEZONE, "required": False},
        ],
    },
    {
        "name": "get-active-days",
        "description": (
            "Return a sorted list of calendar dates (YYYY-MM-DD) that have at least one block. "
            "Optionally filter to only count days where a specific type_uid appears. "
            "Useful for identifying working days, gym days, etc."
        ),
        "args": [
            {"name": "--start-date", "format": "YYYY-MM-DD", "required": True},
            {"name": "--end-date", "format": "YYYY-MM-DD (exclusive)", "required": True},
            {"name": "--type-uid", "format": "int", "required": False,
             "note": "If given, only days with a block of this type are returned"},
            {"name": "--timezone", "default": DEFAULT_TIMEZONE, "required": False},
        ],
    },
    {
        "name": "get-stats",
        "description": (
            "Return aggregated statistics (total blocks and hours) grouped by type and project "
            "for a date range. Sorted by hours descending. "
            "Each block = 0.25 hours (15 minutes)."
        ),
        "args": [
            {"name": "--start-date", "format": "YYYY-MM-DD", "required": True},
            {"name": "--end-date", "format": "YYYY-MM-DD (exclusive)", "required": True},
            {"name": "--type-uids", "format": "int [int ...]", "required": False,
             "note": "If given, only include these type UIDs"},
            {"name": "--timezone", "default": DEFAULT_TIMEZONE, "required": False},
        ],
    },
]


def get_engine() -> Any:
    return create_engine(f"sqlite:///{DB_PATH}")


def parse_date(date_str: str, tz: Any) -> datetime:
    """Parse YYYY-MM-DD to timezone-aware datetime at midnight."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return tz.localize(dt)


def parse_block_date(value: Any, tz: Any) -> int:
    """Convert a block date (ISO string or unix int) to a unix timestamp int."""
    if isinstance(value, (int, float)):
        return int(value)
    dt = datetime.fromisoformat(str(value))
    if dt.tzinfo is None:
        dt = tz.localize(dt)
    return int(dt.timestamp())


# ---------------------------------------------------------------------------
# Command implementations
# ---------------------------------------------------------------------------

def cmd_list_commands(_args: argparse.Namespace) -> None:
    print(json.dumps(COMMANDS_DESCRIPTION, indent=2))


def cmd_get_types(_args: argparse.Namespace) -> None:
    engine = get_engine()
    with Session(engine) as session:
        types = session.query(Type).order_by(Type.priority).all()
        result = [t.to_dto().to_dict() for t in types]
    print(json.dumps(result, indent=2))


def cmd_get_projects(_args: argparse.Namespace) -> None:
    engine = get_engine()
    with Session(engine) as session:
        projects = session.query(Project).order_by(Project.priority).all()
        result = [p.to_dto().to_dict() for p in projects]
    print(json.dumps(result, indent=2))


def cmd_get_blocks(args: argparse.Namespace) -> None:
    tz = pytz.timezone(args.timezone)
    start_ts = int(parse_date(args.start_date, tz).timestamp())
    end_ts = int(parse_date(args.end_date, tz).timestamp())

    engine = get_engine()
    with Session(engine) as session:
        blocks = (
            session.query(Block)
            .filter(Block.date >= start_ts, Block.date < end_ts)
            .order_by(Block.date)
            .all()
        )
        result = [b.to_dto().to_dict() for b in blocks]
    print(json.dumps(result, indent=2))


def cmd_set_blocks(args: argparse.Namespace) -> None:
    if args.data:
        data: List[Dict[str, Any]] = json.loads(args.data)
    else:
        data = json.load(sys.stdin)

    tz = pytz.timezone(args.timezone)
    engine = get_engine()

    with Session(engine) as session:
        for item in data:
            date_ts = parse_block_date(item["date"], tz)

            # Delete any existing block at this timestamp
            session.execute(delete(Block).where(Block.date == date_ts))

            type_uid: int = int(item["type_uid"])
            type_ = session.query(Type).filter(Type.uid == type_uid).first()
            if type_ is None:
                print(
                    json.dumps({"error": f"Type with uid={type_uid} not found"}),
                    file=sys.stderr,
                )
                sys.exit(1)

            project_uid: Optional[int] = item.get("project_uid") or None
            project = (
                session.query(Project).filter(Project.uid == project_uid).first()
                if project_uid is not None
                else None
            )

            block = Block(
                date=date_ts,
                type_uid=type_uid,
                type_=type_,
                project_uid=project_uid,
                project=project,
                comment=item.get("comment", ""),
            )
            session.add(block)

        session.commit()

    print(json.dumps({"status": "ok", "upserted": len(data)}))


def cmd_delete_blocks(args: argparse.Namespace) -> None:
    tz = pytz.timezone(args.timezone)
    start_ts = int(parse_date(args.start_date, tz).timestamp())
    end_ts = int(parse_date(args.end_date, tz).timestamp())

    engine = get_engine()
    with Session(engine) as session:
        result = session.execute(
            delete(Block).where(Block.date >= start_ts, Block.date < end_ts)
        )
        session.commit()

    print(json.dumps({"status": "ok", "deleted": result.rowcount}))


def cmd_get_daily_summary(args: argparse.Namespace) -> None:
    tz = pytz.timezone(args.timezone)
    start_ts = int(parse_date(args.start_date, tz).timestamp())
    end_ts = int(parse_date(args.end_date, tz).timestamp())

    engine = get_engine()
    with Session(engine) as session:
        blocks = (
            session.query(Block)
            .filter(Block.date >= start_ts, Block.date < end_ts)
            .order_by(Block.date)
            .all()
        )

        summary: Dict[str, List[Dict[str, Any]]] = {}
        for b in blocks:
            dt = datetime.fromtimestamp(b.date, tz=tz)
            day_str = dt.strftime("%Y-%m-%d")
            if day_str not in summary:
                summary[day_str] = []
            summary[day_str].append(
                {
                    "time": dt.strftime("%H:%M"),
                    "type_uid": b.type_uid,
                    "type": b.type_.name if b.type_ else None,
                    "project_uid": b.project_uid,
                    "project": b.project.name if b.project else None,
                    "comment": b.comment or "",
                }
            )

    print(json.dumps(summary, indent=2))


def cmd_get_active_days(args: argparse.Namespace) -> None:
    tz = pytz.timezone(args.timezone)
    start_ts = int(parse_date(args.start_date, tz).timestamp())
    end_ts = int(parse_date(args.end_date, tz).timestamp())

    engine = get_engine()
    with Session(engine) as session:
        query = session.query(Block).filter(
            Block.date >= start_ts, Block.date < end_ts
        )
        if args.type_uid is not None:
            query = query.filter(Block.type_uid == args.type_uid)

        blocks = query.order_by(Block.date).all()

        days = set()
        for b in blocks:
            dt = datetime.fromtimestamp(b.date, tz=tz)
            days.add(dt.strftime("%Y-%m-%d"))

    print(json.dumps(sorted(days), indent=2))


def cmd_get_stats(args: argparse.Namespace) -> None:
    tz = pytz.timezone(args.timezone)
    start_ts = int(parse_date(args.start_date, tz).timestamp())
    end_ts = int(parse_date(args.end_date, tz).timestamp())

    engine = get_engine()
    with Session(engine) as session:
        query = session.query(Block).filter(
            Block.date >= start_ts, Block.date < end_ts
        )
        if args.type_uids:
            query = query.filter(Block.type_uid.in_(args.type_uids))

        blocks = query.all()

        stats: Dict[tuple, Dict[str, Any]] = {}
        for b in blocks:
            key = (b.type_uid, b.project_uid)
            if key not in stats:
                stats[key] = {
                    "type_uid": b.type_uid,
                    "type": b.type_.name if b.type_ else None,
                    "project_uid": b.project_uid,
                    "project": b.project.name if b.project else None,
                    "blocks": 0,
                    "hours": 0.0,
                }
            stats[key]["blocks"] += 1
            stats[key]["hours"] = round(stats[key]["blocks"] * 0.25, 2)

    result = sorted(stats.values(), key=lambda x: -x["hours"])
    print(json.dumps(result, indent=2))


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ai_tools",
        description="BlockyTime AI tool commands. All output is JSON on stdout.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-commands", help="Print JSON description of all commands")
    sub.add_parser("get-types", help="List all types with categories and projects")
    sub.add_parser("get-projects", help="List all projects")

    def add_date_range(p: argparse.ArgumentParser) -> None:
        p.add_argument("--start-date", required=True, help="Start date YYYY-MM-DD")
        p.add_argument(
            "--end-date", required=True, help="End date YYYY-MM-DD (exclusive)"
        )
        p.add_argument("--timezone", default=DEFAULT_TIMEZONE)

    p_get_blocks = sub.add_parser("get-blocks", help="Get blocks for a date range")
    add_date_range(p_get_blocks)

    p_set_blocks = sub.add_parser("set-blocks", help="Upsert blocks from JSON")
    p_set_blocks.add_argument(
        "--data",
        default=None,
        help="JSON array of blocks; if omitted, read from stdin",
    )
    p_set_blocks.add_argument("--timezone", default=DEFAULT_TIMEZONE)

    p_del_blocks = sub.add_parser(
        "delete-blocks", help="Delete all blocks in a date range"
    )
    add_date_range(p_del_blocks)

    p_summary = sub.add_parser(
        "get-daily-summary", help="Compact day-by-day ledger of blocks"
    )
    add_date_range(p_summary)

    p_active = sub.add_parser(
        "get-active-days", help="List dates that have at least one block"
    )
    add_date_range(p_active)
    p_active.add_argument(
        "--type-uid",
        type=int,
        default=None,
        help="Filter to days that include a block with this type_uid",
    )

    p_stats = sub.add_parser(
        "get-stats", help="Aggregated hours per type/project for a date range"
    )
    add_date_range(p_stats)
    p_stats.add_argument(
        "--type-uids",
        nargs="*",
        type=int,
        default=None,
        help="Only include these type UIDs",
    )

    return parser


COMMAND_MAP = {
    "list-commands": cmd_list_commands,
    "get-types": cmd_get_types,
    "get-projects": cmd_get_projects,
    "get-blocks": cmd_get_blocks,
    "set-blocks": cmd_set_blocks,
    "delete-blocks": cmd_delete_blocks,
    "get-daily-summary": cmd_get_daily_summary,
    "get-active-days": cmd_get_active_days,
    "get-stats": cmd_get_stats,
}


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    handler = COMMAND_MAP.get(args.command)
    if handler is None:
        parser.print_help()
        sys.exit(1)
    handler(args)


if __name__ == "__main__":
    main()
