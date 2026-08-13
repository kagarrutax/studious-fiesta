from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Message, User
from app.schemas import AuthorBrief, ConversationOut, MessageCreate, MessageOut

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    content_clean = payload.content.strip()
    if not content_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El mensaje no puede estar vacío",
        )

    receiver = db.get(User, payload.receiver_id)
    if receiver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario destinatario no encontrado",
        )

    if receiver.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviarte mensajes a ti mismo",
        )

    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        content=content_clean,
    )
    db.add(message)
    db.commit()

    loaded = db.scalar(
        select(Message)
        .options(selectinload(Message.sender), selectinload(Message.receiver))
        .where(Message.id == message.id)
    )
    assert loaded is not None
    return loaded


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ConversationOut]:
    all_msgs = db.scalars(
        select(Message)
        .options(selectinload(Message.sender), selectinload(Message.receiver))
        .where(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id,
            )
        )
        .order_by(Message.created_at.desc())
    ).all()

    conversations_map: dict[int, dict] = {}
    for msg in all_msgs:
        other_user = msg.receiver if msg.sender_id == current_user.id else msg.sender
        if other_user.id not in conversations_map:
            conversations_map[other_user.id] = {
                "user": AuthorBrief(
                    id=other_user.id,
                    username=other_user.username,
                    avatar_url=other_user.avatar_url,
                ),
                "last_message": msg.content,
                "last_message_at": msg.created_at,
                "unread_count": 0,
            }
        
        if msg.receiver_id == current_user.id and not msg.is_read:
            conversations_map[other_user.id]["unread_count"] += 1

    result = list(conversations_map.values())
    result.sort(key=lambda c: c["last_message_at"], reverse=True)
    return [ConversationOut(**item) for item in result]


@router.get("/{user_id}", response_model=list[MessageOut])
def get_conversation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageOut]:
    target_user = db.get(User, user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    unread_msgs = db.scalars(
        select(Message).where(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
        )
    ).all()
    if unread_msgs:
        for msg in unread_msgs:
            msg.is_read = True
        db.commit()

    messages = db.scalars(
        select(Message)
        .options(selectinload(Message.sender), selectinload(Message.receiver))
        .where(
            or_(
                (Message.sender_id == current_user.id) & (Message.receiver_id == user_id),
                (Message.sender_id == user_id) & (Message.receiver_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
    ).all()

    return messages
