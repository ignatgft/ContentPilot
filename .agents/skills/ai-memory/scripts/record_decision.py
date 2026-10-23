#!/usr/bin/env python3
"""
Helper script to record a new Architecture Decision Record (ADR) into DECISIONS.md.
Usage:
    python record_decision.py --title "Use Redis for Global Cache" --decision "Adopt Redis 7" --drivers "High concurrency"
"""

import argparse
import os
import re
from datetime import datetime

DECISIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "references", "DECISIONS.md")

def get_next_adr_number(content: str) -> int:
    matches = re.findall(r"## ADR-(\d+):", content)
    if not matches:
        return 1
    return max(int(m) for m in matches) + 1

def main():
    parser = argparse.ArgumentParser(description="Record a new ADR")
    parser.add_argument("--title", required=True, help="ADR Title")
    parser.add_argument("--decision", required=True, help="Decision outcome summary")
    parser.add_argument("--context", default="", help="Context & Problem Statement")
    parser.add_argument("--consequences", default="", help="Key consequences or trade-offs")
    args = parser.parse_args()

    if not os.path.exists(DECISIONS_FILE):
        print(f"Error: {DECISIONS_FILE} does not exist.")
        return 1

    with open(DECISIONS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    adr_num = get_next_adr_number(content)
    num_str = f"{adr_num:03d}"
    today = datetime.now().strftime("%Y-%m-%d")

    new_adr = f"""
## ADR-{num_str}: {args.title}
- **Status**: Accepted
- **Date**: {today}
- **Context**: {args.context if args.context else "Architectural improvement and system maintenance."}
- **Decision**: {args.decision}
- **Consequences**:
  - Positive: {args.consequences if args.consequences else "Maintains clean system boundaries and consistency."}
"""

    with open(DECISIONS_FILE, "a", encoding="utf-8") as f:
        f.write(new_adr)

    print(f"Recorded ADR-{num_str}: {args.title} into {DECISIONS_FILE}")
    return 0

if __name__ == "__main__":
    exit(main())
