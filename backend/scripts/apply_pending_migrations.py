"""Apply supabase/migrations/*.sql against DATABASE_URL (local/dev helper)."""

from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import create_engine, text

from app.core.config import settings

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "supabase" / "migrations"


def split_statements(sql: str) -> list[str]:
    cleaned = re.sub(r"--.*?$", "", sql, flags=re.MULTILINE)
    parts = [p.strip() for p in cleaned.split(";")]
    return [p for p in parts if p]


def main() -> None:
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not files:
        raise SystemExit(f"No migrations in {MIGRATIONS_DIR}")

    engine = create_engine(settings.database_url)
    print(f"DB host: {settings.database_url.split('@')[-1]}")
    for path in files:
        stmts = split_statements(path.read_text(encoding="utf-8"))
        if not stmts:
            continue
        print(f"Applying {path.name} ({len(stmts)} stmts) ...")
        with engine.begin() as conn:
            for stmt in stmts:
                try:
                    conn.execute(text(stmt))
                except Exception as exc:  # noqa: BLE001 — continue on already-applied
                    msg = str(exc).lower()
                    if any(s in msg for s in ("already exists", "duplicate")):
                        print(f"  skip: {exc.__class__.__name__}")
                        continue
                    raise
        print(f"  OK {path.name}")
    print("Done.")


if __name__ == "__main__":
    main()
