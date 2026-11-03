#!/usr/bin/env python3

import json
from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parents[1]
QUERY_PATH = ROOT / "prisma" / "mock-data.sql"
OUTPUT_PATH = ROOT / "src" / "data" / "mock-data.json"


def main() -> None:
    connection = duckdb.connect(":memory:")
    try:
        rows = connection.execute(QUERY_PATH.read_text(encoding="utf-8")).fetchall()
    finally:
        connection.close()

    fixture = {
        "users": [
            {
                "id": "demo-user",
                "email": "demo@todo.dev",
                "name": "Demo User",
                "googleId": "mock-google-demo-user",
                "role": "user",
            }
        ],
        "todos": [
            {
                "id": todo_id,
                "title": title,
                "done": done,
                "createdAt": created_at,
                "userId": user_id,
            }
            for todo_id, title, done, created_at, user_id in rows
        ],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(fixture, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(fixture['todos'])} sample todos to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
