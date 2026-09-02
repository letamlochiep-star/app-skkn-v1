#!/usr/bin/env python3
import json, sys
from pathlib import Path
from jsonschema import Draft202012Validator

if len(sys.argv) != 3:
    print("usage: validate_payload.py <schema.json> <payload.json>", file=sys.stderr)
    raise SystemExit(2)
schema = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
payload = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
errors = sorted(Draft202012Validator(schema).iter_errors(payload), key=lambda e: list(e.path))
if errors:
    for e in errors:
        print(f"ERROR {list(e.path)}: {e.message}")
    raise SystemExit(1)
print("VALID")
