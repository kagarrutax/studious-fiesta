from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.media import StoredMedia

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{public_id}")
def get_media(public_id: str, db: Session = Depends(get_db)) -> Response:
    media = db.scalar(select(StoredMedia).where(StoredMedia.public_id == public_id))
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")
    return Response(
        content=media.data,
        media_type=media.content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


def store_media_bytes(db: Session, *, data: bytes, content_type: str) -> str:
    public_id = uuid4().hex
    db.add(
        StoredMedia(
            public_id=public_id,
            content_type=content_type,
            data=data,
        )
    )
    db.flush()
    return f"/api/media/{public_id}"
