from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import router
from app.core.config import settings
from app.core.uploads import ensure_upload_dir
from app.db import Base, engine
import app.models  # noqa: F401 — registra modelos en Base.metadata


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_upload_dir()
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
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Studious Party API", "docs": "/docs"}
