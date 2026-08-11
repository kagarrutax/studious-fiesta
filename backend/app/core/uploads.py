from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.media import store_media_bytes
from app.core.config import settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def ensure_upload_dir() -> Path:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


async def save_upload(file: UploadFile, db: Session | None = None) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de archivo no permitido. Usa JPG, PNG, WEBP o GIF.",
        )

    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen supera el límite de 5 MB.",
        )

    # Preferir BD compartida (Supabase) para que local y Render vean las mismas imágenes.
    if db is not None:
        return store_media_bytes(db, data=data, content_type=file.content_type or "application/octet-stream")

    extension = Path(file.filename or "upload.bin").suffix.lower() or ".bin"
    from uuid import uuid4

    filename = f"{uuid4().hex}{extension}"
    destination = ensure_upload_dir() / filename
    destination.write_bytes(data)
    return f"/uploads/{filename}"
