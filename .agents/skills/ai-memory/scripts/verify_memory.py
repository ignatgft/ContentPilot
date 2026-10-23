#!/usr/bin/env python3
"""
Verify memory structure and reference files.
"""

import os
import sys

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
REFERENCES_DIR = os.path.join(BASE_DIR, "references")

REQUIRED_FILES = [
    os.path.join(BASE_DIR, "SKILL.md"),
    os.path.join(REFERENCES_DIR, "ARCHITECTURE.md"),
    os.path.join(REFERENCES_DIR, "DECISIONS.md"),
    os.path.join(REFERENCES_DIR, "GOTCHAS.md"),
    os.path.join(REFERENCES_DIR, "IMPLEMENTATION_STATUS.md"),
]

def main():
    missing = []
    for path in REQUIRED_FILES:
        if not os.path.isfile(path):
            missing.append(path)

    if missing:
        print("FAIL: The following memory files are missing:")
        for m in missing:
            print(f"  - {m}")
        return 1

    print("SUCCESS: All core memory files exist and are verified.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
