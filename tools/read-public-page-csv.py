"""Convert only the authorized public SEO export to an offline source snapshot."""
import csv
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

csv.field_size_limit(100_000_000)
source, destination = map(Path, sys.argv[1:3])
with source.open(encoding="utf-8-sig", newline="") as handle:
    rows = list(csv.DictReader(handle))
if not rows or len({row["url"] for row in rows}) != len(rows):
    raise ValueError("Empty export or duplicate URL")
for row in rows:
    for field in ("content", "sources"):
        if field in row:
            row[field] = json.loads(row[field])
with destination.open("x", encoding="utf-8") as handle:
    json.dump({"sourceCsvSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "pages": rows}, handle, ensure_ascii=False)
print(json.dumps({"rows": len(rows), "uniqueUrls": len({row["url"] for row in rows}), "families": Counter(row["family"] for row in rows), "columns": list(rows[0])}))
