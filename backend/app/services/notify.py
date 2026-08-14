"""Create notifications and push them over WebSocket."""

from __future__ import annotations

from typing import Any

from fastapi import BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.notification import Notification
from app.schemas.notification import NotificationActor, NotificationOut
from app.services.realtime import realtime_manager


def unread_count(db: Session, user_id: int) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        )
        or 0
    )


def serialize_notification(n: Notification) -> dict[str, Any]:
    out = NotificationOut(
        id=n.id,
        user_id=n.user_id,
        actor_id=n.actor_id,
        type=n.type,
        entity_type=n.entity_type,
        entity_id=n.entity_id,
        payload=n.payload,
        read_at=n.read_at,
        created_at=n.created_at,
        actor=NotificationActor.model_validate(n.actor) if n.actor is not None else None,
    )
    return out.model_dump(mode="json")


async def _push_new(user_id: int, notification: dict[str, Any], unread: int) -> None:
    await realtime_manager.send_many(
        user_id,
        [
            {"type": "notification.new", "notification": notification},
            {"type": "badge", "unread": unread},
        ],
    )


async def _push_read(user_id: int, ids: list[int], unread: int) -> None:
    await realtime_manager.send_many(
        user_id,
        [
            {"type": "notification.read", "ids": ids},
            {"type": "badge", "unread": unread},
        ],
    )


def notify(
    db: Session,
    *,
    recipient_id: int,
    actor_id: int,
    type: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    payload: dict[str, Any] | None = None,
    background_tasks: BackgroundTasks | None = None,
) -> Notification | None:
    if recipient_id == actor_id:
        return None

    row = Notification(
        user_id=recipient_id,
        actor_id=actor_id,
        type=type,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload,
    )
    db.add(row)
    db.commit()
    row = db.scalar(
        select(Notification)
        .options(selectinload(Notification.actor))
        .where(Notification.id == row.id)
    )
    assert row is not None

    serialized = serialize_notification(row)
    count = unread_count(db, recipient_id)
    if background_tasks is not None:
        background_tasks.add_task(_push_new, recipient_id, serialized, count)
    return row


def emit_read(
    *,
    user_id: int,
    ids: list[int],
    unread: int,
    background_tasks: BackgroundTasks | None = None,
) -> None:
    if background_tasks is not None:
        background_tasks.add_task(_push_read, user_id, ids, unread)
