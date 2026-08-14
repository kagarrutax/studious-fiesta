from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.router import router
from app.api.ws import router as ws_router
from app.core.config import settings
from app.core.uploads import ensure_upload_dir
from app.db import Base, engine
import app.models  # noqa: F401 — registra modelos en Base.metadata


def _ensure_sqlite_schema() -> None:
    """SQLite create_all no altera tablas: añade columnas nuevas si faltan."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        user_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()}
        alters = []
        if "cover_url" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN cover_url VARCHAR(500)")
        if "career" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN career VARCHAR(120)")
        if "university" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN university VARCHAR(120)")
        if "semester" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN semester INTEGER")
        if "last_seen_at" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN last_seen_at DATETIME")
        if "xp" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0")
        if "level" not in user_cols:
            alters.append("ALTER TABLE users ADD COLUMN level INTEGER NOT NULL DEFAULT 1")
        for stmt in alters:
            conn.execute(text(stmt))

        post_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(posts)")).fetchall()}
        if "community_id" not in post_cols:
            conn.execute(text("ALTER TABLE posts ADD COLUMN community_id INTEGER"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_schema()
    ensure_upload_dir()
    # Seed badges once DB is ready
    from app.db import SessionLocal
    from app.services.xp import ensure_badges

    db = SessionLocal()
    try:
        ensure_badges(db)
    finally:
        db.close()
    yield


upload_path = ensure_upload_dir()

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

# Orígenes explícitos + regex para Vite en localhost/127.0.0.1 (cualquier puerto).
cors_origins = list(
    dict.fromkeys(
        [
            *settings.cors_origins_list,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://((localhost|127\.0\.0\.1)(:\d+)?|([a-z0-9-]+\.)?vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(ws_router)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Studious Party API", "docs": "/docs"}
