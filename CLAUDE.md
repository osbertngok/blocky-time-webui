# BlockyTime WebUI — Agent Guide

## What this project is

A web app for viewing and editing time-tracking data from the **BlockyTime** iOS app.
The backend is a Flask/SQLAlchemy server backed by a SQLite database (`DB.db`).
Time is logged as 15-minute **blocks**, each tagged with a **Type** and an optional **Project**.

---

## Data model

| Concept | Description |
|---|---|
| **Block** | One 15-minute time entry. Fields: `date` (unix timestamp), `type_uid`, `project_uid`, `comment`. Each block = **0.25 hours**. |
| **Type** | Top-level activity category (e.g. Work, Sleep, Sports). Has a `uid`, `name`, `color`, `priority`. |
| **Project** | Second-level object linked to one or more Types (e.g. Work → Development). Has `uid`, `name`, `abbr`. |
| **Category** | Optional grouping for Types (rarely used). |

Dates are stored as **Unix timestamps** (seconds). The app timezone is **Asia/Hong_Kong (UTC+8)**.

---

## AI tools CLI

All data operations are available as a CLI. Run via:

```bash
make ai-tools ARGS="<command> [flags]"
```

All commands output **JSON on stdout**.

### Available commands

| Command | Purpose |
|---|---|
| `list-commands` | Print full JSON schema of all commands |
| `get-types` | All types with linked projects (includes UIDs) |
| `get-projects` | All projects |
| `get-blocks --start-date YYYY-MM-DD --end-date YYYY-MM-DD` | Raw blocks in a date range |
| `set-blocks [--data JSON]` | Upsert blocks (JSON via `--data` or stdin) |
| `delete-blocks --start-date YYYY-MM-DD --end-date YYYY-MM-DD` | Delete all blocks in a range |
| `get-daily-summary --start-date YYYY-MM-DD --end-date YYYY-MM-DD` | Human-readable ledger grouped by day |
| `get-active-days --start-date YYYY-MM-DD --end-date YYYY-MM-DD [--type-uid INT]` | Dates that have at least one block |
| `get-stats --start-date YYYY-MM-DD --end-date YYYY-MM-DD [--type-uids INT ...]` | Hours per type/project, sorted descending |

All date range commands also accept `--timezone` (default: `Asia/Hong_Kong`).

### Examples

```bash
# Understand the user's schedule for a week
make ai-tools ARGS="get-daily-summary --start-date 2026-03-10 --end-date 2026-03-17"

# Which days did the user go to work?
make ai-tools ARGS="get-active-days --start-date 2026-03-01 --end-date 2026-03-31 --type-uid 1"

# How much time was spent on each activity this week?
make ai-tools ARGS="get-stats --start-date 2026-03-10 --end-date 2026-03-17"

# Fill in missing blocks (upsert)
make ai-tools ARGS='set-blocks --data "[{\"date\":\"2026-03-14T09:00\",\"type_uid\":1,\"project_uid\":8,\"comment\":\"\"},{\"date\":\"2026-03-14T09:15\",\"type_uid\":1,\"project_uid\":8,\"comment\":\"\"}]"'

# Delete a day's blocks and re-fill
make ai-tools ARGS="delete-blocks --start-date 2026-03-14 --end-date 2026-03-15"
```

### set-blocks input format

Each item in the JSON array:

```json
{
  "date": "2026-03-14T09:00",
  "type_uid": 1,
  "project_uid": 8,
  "comment": ""
}
```

- `date`: ISO datetime string (`YYYY-MM-DDTHH:MM`) or unix timestamp integer
- `type_uid`: required integer (see type reference below)
- `project_uid`: optional integer, `null` if none
- `comment`: optional string

---

## Type & Project reference

Run `make ai-tools ARGS="get-types"` for the live list. Common types:

| uid | Type | Notes |
|---|---|---|
| 1 | Work | Projects: Development (8), Business (9), Infrastructure (10), Integration (7), Communication (14), … |
| 2 | Social | |
| 4 | Meal | |
| 5 | Housework | Projects: Cooking (36), Wash Dishes (37), Errands (39), Shopping (46), Cleaning (53), … |
| 6 | Sports | Projects: Table Tennis (16), Badminton (17), Swimming (18), Running (40), … |
| 9 | GTD | Projects: Planning (31), Logging (32), System Building (33) |
| 10 | Sleep | |
| 11 | Fixed | Projects: Commute (6), Driving (34), Wash Up (35) |
| 12 | Relationship | |
| 13 | Entertainment | |
| 14 | Idle | |
| 15 | Family | Projects: Grandma (20), Parents (21), Fish's Family (22) |
| 16 | Learning | Projects: Programming (30), Rust (29), Russian (28), LLM (42), … |
| 17 | Music | |
| 18 | PR | |
| 19 | Pet | |
| 21 | Health | |
| 22 | Finance | Projects: Bank (43), Tax (44) |

---

## Common agent workflows

### Fill in a day's blank blocks
1. `get-types` — confirm type/project UIDs
2. `get-daily-summary` — see what's already logged
3. `get-active-days` — understand the user's routine around that date
4. `set-blocks` — write the missing 15-minute blocks

### Understand the user's weekly routine
1. `get-stats` over a longer period (e.g. 4 weeks) to see time allocation
2. `get-daily-summary` for a representative week to see intra-day patterns
3. `get-active-days --type-uid 1` to identify working days

---

## Development

```bash
make build        # set up Python venv
make run          # start Flask server (port from .env, default 5002)
make fe-dev       # start Vite frontend dev server
make pull-db      # pull DB from iPhone via USB
make push-db      # push DB to iPhone via USB
make test         # run pytest
make check        # mypy type check
make lint         # autoflake + isort + black
```

Key paths:
- DB: `python/blockytime/data/dynamic/DB.db`
- Backend services: `python/blockytime/services/`
- API routes: `python/blockytime/routes/`
- AI tools script: `python/blockytime/scripts/ai_tools.py`
