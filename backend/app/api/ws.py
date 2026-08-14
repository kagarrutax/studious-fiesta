"""WebSocket endpoints (auth via query token)."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db import get_db
from app.models import ConversationParticipant, User
from app.services.notify import unread_count
from app.services.realtime import realtime_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


def _user_id_from_token(token: str | None) -> int | None:
    if not token:
        return None
    subject = decode_access_token(token)
    if subject is None:
        return None
    try:
        return int(subject)
    except ValueError:
        return None


def _touch_last_seen(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if user is None:
        return
    user.last_seen_at = datetime.now(timezone.utc)
    db.commit()


async def _relay_typing(db: Session, user_id: int, conversation_id: int) -> None:
    part = db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    if part is None:
        return
    others = db.scalars(
        select(ConversationParticipant.user_id).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id != user_id,
        )
    ).all()
    payload = {"type": "typing", "conversation_id": conversation_id, "user_id": user_id}
    for oid in others:
        await realtime_manager.send_to_user(oid, payload)


async def _emit_presence(db: Session, user_id: int, status: str) -> None:
    user = db.get(User, user_id)
    payload = {
        "type": "presence",
        "user_id": user_id,
        "status": status,
        "username": user.username if user else None,
        "avatar_url": user.avatar_url if user else None,
    }
    # Broadcast to every other connected client (global "online" rail).
    for oid in realtime_manager.online_user_ids():
        if oid != user_id:
            await realtime_manager.send_to_user(oid, payload)


async def _send_online_snapshot(db: Session, user_id: int) -> None:
    ids = [uid for uid in realtime_manager.online_user_ids() if uid != user_id]
    users: list[User] = []
    if ids:
        users = list(db.scalars(select(User).where(User.id.in_(ids))).all())
    await realtime_manager.send_to_user(
        user_id,
        {
            "type": "presence.snapshot",
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "avatar_url": u.avatar_url,
                }
                for u in users
            ],
        },
    )


async def _mark_online(db: Session, user_id: int, websocket: WebSocket) -> None:
    was_offline = not realtime_manager.is_online(user_id)
    await realtime_manager.connect(user_id, websocket)
    if was_offline:
        _touch_last_seen(db, user_id)
        await _emit_presence(db, user_id, "online")
    await _send_online_snapshot(db, user_id)


async def _mark_offline(db: Session, user_id: int, websocket: WebSocket) -> None:
    await realtime_manager.disconnect(user_id, websocket)
    if not realtime_manager.is_online(user_id):
        _touch_last_seen(db, user_id)
        await _emit_presence(db, user_id, "offline")


@router.websocket("/ws/notifications")
async def notifications_ws(
    websocket: WebSocket,
    token: str | None = Query(None),
    db: Session = Depends(get_db),
) -> None:
    user_id = _user_id_from_token(token)
    if user_id is None:
        await websocket.close(code=1008)
        return

    user = db.get(User, user_id)
    if user is None:
        await websocket.close(code=1008)
        return

    await _mark_online(db, user_id, websocket)
    badge = unread_count(db, user_id)
    await realtime_manager.send_to_user(user_id, {"type": "badge", "unread": badge})

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
                continue
            if isinstance(data, dict) and data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("notifications WS ended for user %s", user_id, exc_info=True)
    finally:
        await _mark_offline(db, user_id, websocket)


@router.websocket("/ws/chat")
async def chat_ws(
    websocket: WebSocket,
    token: str | None = Query(None),
    db: Session = Depends(get_db),
) -> None:
    user_id = _user_id_from_token(token)
    if user_id is None:
        await websocket.close(code=1008)
        return

    user = db.get(User, user_id)
    if user is None:
        await websocket.close(code=1008)
        return

    await _mark_online(db, user_id, websocket)

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
                continue
            if not isinstance(data, dict):
                continue
            kind = data.get("type")
            if kind == "ping":
                await websocket.send_json({"type": "pong"})
            elif kind == "typing":
                cid = data.get("conversation_id")
                if isinstance(cid, int):
                    await _relay_typing(db, user_id, cid)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("chat WS ended for user %s", user_id, exc_info=True)
    finally:
        await _mark_offline(db, user_id, websocket)
