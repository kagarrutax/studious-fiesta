from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.api.media import store_media_bytes
from app.core.rate_limit import limit_upload
from app.db import get_db
from app.models import Resource, ResourceRating, Subject, User
from app.models.resource import DEFAULT_SUBJECTS
from app.schemas.resource import (
    ALLOWED_CATEGORIES,
    ResourceOut,
    ResourcePage,
    ResourceRateIn,
    ResourceRateOut,
    ResourceUploader,
    SubjectOut,
)

router = APIRouter(tags=["resources"])

ALLOWED_RESOURCE_TYPES = {
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_RESOURCE_BYTES = 15 * 1024 * 1024


def ensure_subjects(db: Session) -> None:
    existing = db.scalar(select(func.count()).select_from(Subject)) or 0
    if existing > 0:
        return
    for name, code in DEFAULT_SUBJECTS:
        db.add(Subject(name=name, code=code))
    db.commit()


def serialize_resource(resource: Resource, current_user_id: int) -> ResourceOut:
    my_rating = None
    for rating in resource.ratings:
        if rating.user_id == current_user_id:
            my_rating = rating.score
            break
    return ResourceOut(
        id=resource.id,
        uploader_id=resource.uploader_id,
        subject_id=resource.subject_id,
        title=resource.title,
        description=resource.description,
        category=resource.category,
        file_url=resource.file_url,
        file_type=resource.file_type,
        size_bytes=resource.size_bytes,
        downloads_count=resource.downloads_count,
        avg_rating=float(resource.avg_rating or 0),
        created_at=resource.created_at,
        uploader=ResourceUploader.model_validate(resource.uploader) if resource.uploader else None,
        subject=SubjectOut.model_validate(resource.subject) if resource.subject else None,
        my_rating=my_rating,
    )


def load_resource_query():
    return select(Resource).options(
        selectinload(Resource.uploader),
        selectinload(Resource.subject),
        selectinload(Resource.ratings),
    )


def get_resource_or_404(db: Session, resource_id: int) -> Resource:
    resource = db.scalar(load_resource_query().where(Resource.id == resource_id))
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurso no encontrado")
    return resource


def refresh_avg_rating(db: Session, resource: Resource) -> None:
    avg = db.scalar(
        select(func.avg(ResourceRating.score)).where(ResourceRating.resource_id == resource.id)
    )
    resource.avg_rating = float(avg or 0.0)


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[SubjectOut]:
    ensure_subjects(db)
    rows = db.scalars(select(Subject).order_by(Subject.name.asc())).all()
    return [SubjectOut.model_validate(s) for s in rows]


@router.get("/resources", response_model=ResourcePage)
def list_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
    subject_id: int | None = Query(default=None),
    category: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=120),
) -> ResourcePage:
    ensure_subjects(db)
    stmt = load_resource_query().order_by(Resource.id.desc())
    if cursor is not None:
        stmt = stmt.where(Resource.id < cursor)
    if subject_id is not None:
        stmt = stmt.where(Resource.subject_id == subject_id)
    if category:
        stmt = stmt.where(Resource.category == category.strip().lower())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(Resource.title.ilike(like) | Resource.description.ilike(like))
    rows = list(db.scalars(stmt.limit(limit + 1)).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1].id if rows else None
    return ResourcePage(
        items=[serialize_resource(r, current_user.id) for r in rows],
        next_cursor=next_cursor,
        limit=limit,
    )


@router.post("/resources", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
async def upload_resource(
    request: Request,
    title: str = Form(..., min_length=2, max_length=200),
    description: str | None = Form(default=None),
    category: str = Form(default="notes"),
    subject_id: int | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceOut:
    limit_upload(request)
    ensure_subjects(db)
    cat = (category or "notes").strip().lower()
    if cat not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Categoría inválida. Usa: {', '.join(ALLOWED_CATEGORIES)}",
        )
    if subject_id is not None and db.get(Subject, subject_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materia no encontrada")

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo no permitido. Usa PDF, DOCX, PPTX, ZIP o imagen.",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Archivo vacío")
    if len(data) > MAX_RESOURCE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo supera el límite de 15 MB.",
        )

    file_url = store_media_bytes(db, data=data, content_type=content_type)
    resource = Resource(
        uploader_id=current_user.id,
        subject_id=subject_id,
        title=title.strip(),
        description=(description or "").strip() or None,
        category=cat,
        file_url=file_url,
        file_type=content_type,
        size_bytes=len(data),
    )
    db.add(resource)
    db.commit()
    from app.services.xp import award_xp

    award_xp(db, current_user.id, "resource")
    return serialize_resource(get_resource_or_404(db, resource.id), current_user.id)


@router.get("/resources/{resource_id}", response_model=ResourceOut)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceOut:
    return serialize_resource(get_resource_or_404(db, resource_id), current_user.id)


@router.get("/resources/{resource_id}/download")
def download_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi import Response
    from fastapi.responses import RedirectResponse

    from app.models.media import StoredMedia

    resource = get_resource_or_404(db, resource_id)
    resource.downloads_count = int(resource.downloads_count or 0) + 1
    db.commit()

    file_url = resource.file_url or ""
    if file_url.startswith("/api/media/"):
        public_id = file_url.rsplit("/", 1)[-1]
        media = db.scalar(select(StoredMedia).where(StoredMedia.public_id == public_id))
        if media is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")
        filename = f"resource-{resource.id}"
        return Response(
            content=media.data,
            media_type=media.content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "private, max-age=60",
            },
        )
    return RedirectResponse(url=file_url, status_code=status.HTTP_302_FOUND)


@router.post("/resources/{resource_id}/rate", response_model=ResourceRateOut)
def rate_resource(
    resource_id: int,
    payload: ResourceRateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceRateOut:
    resource = get_resource_or_404(db, resource_id)
    existing = db.scalar(
        select(ResourceRating).where(
            ResourceRating.resource_id == resource_id,
            ResourceRating.user_id == current_user.id,
        )
    )
    if existing is None:
        db.add(
            ResourceRating(
                resource_id=resource_id,
                user_id=current_user.id,
                score=payload.score,
            )
        )
    else:
        existing.score = payload.score
    db.flush()
    refresh_avg_rating(db, resource)
    db.commit()
    return ResourceRateOut(avg_rating=float(resource.avg_rating), my_rating=payload.score)


@router.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = get_resource_or_404(db, resource_id)
    if resource.uploader_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el autor puede borrar")
    db.delete(resource)
    db.commit()
    return None
