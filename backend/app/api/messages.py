from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.rate_limit import limit_message
from app.db import get_db
from app.models import Conversation, ConversationParticipant, Message, User
from app.models.message import pair_key_for
from app.schemas.message import (
    ConversationCreate,
    ConversationOut,
    ConversationPage,
    MessageCreate,
    MessageOut,
    MessagePage,
    PeerOut,
    ReadOut,
)
from app.services.notify import notify
from app.services.realtime import realtime_manager

router = APIRouter(tags=["messages"])


def serialize_message(msg: Message) -> MessageOut:
    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        body=msg.body,
        created_at=msg.created_at,
        edited_at=msg.edited_at,
    )


def _participant(db: Session, conversation_id: int, user_id: int) -> ConversationParticipant | None:
    return db.scalar(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )


def _require_participant(db: Session, conversation_id: int, user_id: int) -> ConversationParticipant:
    row = _participant(db, conversation_id, user_id)
    if row is None:
        conv = db.get(Conversation, conversation_id)
        if conv is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No participas en esta conversación")
    return row


def _peer_for(conversation: Conversation, user_id: int) -> User | None:
    for part in conversation.participants:
        if part.user_id != user_id:
            return part.user
    return None


def _unread_count(db: Session, conversation_id: int, user_id: int, last_read_at: datetime | None) -> int:
    stmt = select(func.count()).select_from(Message).where(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
    )
    if last_read_at is not None:
        stmt = stmt.where(Message.created_at > last_read_at)
    return db.scalar(stmt) or 0


def _last_message(db: Session, conversation_id: int) -> Message | None:
    return db.scalar(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.id.desc())
        .limit(1)
    )


def serialize_conversation(db: Session, conversation: Conversation, current_user_id: int) -> ConversationOut:
    peer = _peer_for(conversation, current_user_id)
    if peer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación incompleta")
    me = next((p for p in conversation.participants if p.user_id == current_user_id), None)
    last = _last_message(db, conversation.id)
    unread = _unread_count(db, conversation.id, current_user_id, me.last_read_at if me else None)
    return ConversationOut(
        id=conversation.id,
        peer=PeerOut.model_validate(peer),
        last_message=serialize_message(last) if last else None,
        unread_count=unread,
        updated_at=conversation.updated_at,
        peer_online=realtime_manager.is_online(peer.id),
        peer_last_seen_at=peer.last_seen_at,
    )


def load_conversation(db: Session, conversation_id: int) -> Conversation | None:
    return db.scalar(
        select(Conversation)
        .options(selectinload(Conversation.participants).selectinload(ConversationParticipant.user))
        .where(Conversation.id == conversation_id)
    )


def get_or_create_conversation(db: Session, user_a: int, user_b: int) -> Conversation:
    key = pair_key_for(user_a, user_b)
    existing = db.scalar(select(Conversation).where(Conversation.pair_key == key))
    if existing is not None:
        loaded = load_conversation(db, existing.id)
        assert loaded is not None
        return loaded

    conv = Conversation(pair_key=key)
    db.add(conv)
    db.flush()
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user_a))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user_b))
    db.commit()
    loaded = load_conversation(db, conv.id)
    assert loaded is not None
    return loaded


def _emit_chat(user_ids: list[int], payload: dict, background_tasks: BackgroundTasks | None) -> None:
    async def _push() -> None:
        for uid in user_ids:
            await realtime_manager.send_to_user(uid, payload)

    if background_tasks is not None:
        background_tasks.add_task(_push)


@router.get("/conversations", response_model=ConversationPage)
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
) -> ConversationPage:
    stmt = (
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id == current_user.id)
        .options(selectinload(Conversation.participants).selectinload(ConversationParticipant.user))
        .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
    )
    if cursor is not None:
        cursor_row = db.get(Conversation, cursor)
        if cursor_row is not None:
            stmt = stmt.where(
                (Conversation.updated_at < cursor_row.updated_at)
                | ((Conversation.updated_at == cursor_row.updated_at) & (Conversation.id < cursor_row.id))
            )
    rows = list(db.scalars(stmt.limit(limit + 1)).unique().all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1].id if rows else None
    return ConversationPage(
        items=[serialize_conversation(db, c, current_user.id) for c in rows],
        next_cursor=next_cursor,
        limit=limit,
    )


@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
def open_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationOut:
    if payload.user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes chatear contigo mismo")
    peer = db.get(User, payload.user_id)
    if peer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    conv = get_or_create_conversation(db, current_user.id, payload.user_id)
    return serialize_conversation(db, conv, current_user.id)


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ConversationOut:
    _require_participant(db, conversation_id, current_user.id)
    conv = load_conversation(db, conversation_id)
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
    return serialize_conversation(db, conv, current_user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=MessagePage)
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(30, ge=1, le=50),
    cursor: int | None = Query(default=None),
) -> MessagePage:
    _require_participant(db, conversation_id, current_user.id)
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.id.desc())
        .limit(limit + 1)
    )
    if cursor is not None:
        stmt = stmt.where(Message.id < cursor)
    rows = list(db.scalars(stmt).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1].id if rows else None
    items = [serialize_message(m) for m in reversed(rows)]
    return MessagePage(items=items, next_cursor=next_cursor, limit=limit)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    limit_message(request)
    _require_participant(db, conversation_id, current_user.id)
    conv = load_conversation(db, conversation_id)
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mensaje vacío")

    msg = Message(conversation_id=conversation_id, sender_id=current_user.id, body=body)
    conv.updated_at = datetime.now(timezone.utc)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    out = serialize_message(msg)
    dumped = out.model_dump(mode="json")
    participant_ids = [p.user_id for p in conv.participants]
    _emit_chat(
        participant_ids,
        {"type": "message.new", "conversation_id": conversation_id, "message": dumped},
        background_tasks,
    )
    peer = _peer_for(conv, current_user.id)
    if peer is not None:
        preview = body[:120]
        notify(
            db,
            recipient_id=peer.id,
            actor_id=current_user.id,
            type="message",
            entity_type="conversation",
            entity_id=conversation_id,
            payload={"actor_username": current_user.username, "preview": preview},
            background_tasks=background_tasks,
        )
        # conversation.updated for inbox sort
        conv_out = serialize_conversation(db, conv, peer.id)
        _emit_chat(
            [peer.id],
            {
                "type": "conversation.updated",
                "conversation": conv_out.model_dump(mode="json"),
            },
            background_tasks,
        )
        mine = serialize_conversation(db, conv, current_user.id)
        _emit_chat(
            [current_user.id],
            {"type": "conversation.updated", "conversation": mine.model_dump(mode="json")},
            background_tasks,
        )
    return out


@router.post("/conversations/{conversation_id}/read", response_model=ReadOut)
def mark_conversation_read(
    conversation_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReadOut:
    part = _require_participant(db, conversation_id, current_user.id)
    now = datetime.now(timezone.utc)
    part.last_read_at = now
    db.commit()
    conv = load_conversation(db, conversation_id)
    assert conv is not None
    participant_ids = [p.user_id for p in conv.participants]
    payload = {
        "type": "message.read",
        "conversation_id": conversation_id,
        "user_id": current_user.id,
        "last_read_at": now.isoformat(),
    }
    _emit_chat(participant_ids, payload, background_tasks)
    return ReadOut(conversation_id=conversation_id, last_read_at=now, unread_count=0)
