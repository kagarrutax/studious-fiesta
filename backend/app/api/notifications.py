from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationPage, UnreadCountOut
from app.services.notify import emit_read, serialize_notification, unread_count

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _to_out(n: Notification) -> NotificationOut:
    return NotificationOut.model_validate(serialize_notification(n))


@router.get("", response_model=NotificationPage)
def list_notifications(
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(None, description="ID menor que este (paginación)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPage:
    stmt = (
        select(Notification)
        .options(selectinload(Notification.actor))
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .limit(limit + 1)
    )
    if cursor is not None:
        stmt = stmt.where(Notification.id < cursor)

    rows = list(db.scalars(stmt).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1].id if rows else None

    return NotificationPage(
        items=[_to_out(n) for n in rows],
        next_cursor=next_cursor,
        limit=limit,
    )


@router.get("/unread-count", response_model=UnreadCountOut)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountOut:
    return UnreadCountOut(unread=unread_count(db, current_user.id))


@router.patch("/read", response_model=UnreadCountOut)
def mark_all_read(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountOut:
    now = datetime.now(timezone.utc)
    rows = list(
        db.scalars(
            select(Notification).where(
                Notification.user_id == current_user.id,
                Notification.read_at.is_(None),
            )
        ).all()
    )
    ids = [r.id for r in rows]
    for row in rows:
        row.read_at = now
    db.commit()
    count = unread_count(db, current_user.id)
    if ids:
        emit_read(user_id=current_user.id, ids=ids, unread=count, background_tasks=background_tasks)
    return UnreadCountOut(unread=count)


@router.patch("/{notification_id}/read", response_model=UnreadCountOut)
def mark_one_read(
    notification_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountOut:
    row = db.get(Notification, notification_id)
    if row is None or row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aviso no encontrado")
    if row.read_at is None:
        row.read_at = datetime.now(timezone.utc)
        db.commit()
        count = unread_count(db, current_user.id)
        emit_read(
            user_id=current_user.id,
            ids=[notification_id],
            unread=count,
            background_tasks=background_tasks,
        )
        return UnreadCountOut(unread=count)
    return UnreadCountOut(unread=unread_count(db, current_user.id))
