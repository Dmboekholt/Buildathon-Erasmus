#!/usr/bin/env python3
"""Run due check-ins once (for cron: 0 9 * * * cd backend && python scripts/run_scheduler.py)."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.services.scheduler import run_due_check_ins


def main() -> None:
    settings = get_settings()
    results = run_due_check_ins(settings)
    print(json.dumps({"count": len(results), "results": results}, indent=2))


if __name__ == "__main__":
    main()
