from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PeerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    body: str
    created_at: datetime
    edited_at: datetime | None = None


class MessagePage(BaseModel):
    items: list[MessageOut]
    next_cursor: int | None = None
    limit: int = 30


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class ConversationCreate(BaseModel):
    user_id: int = Field(gt=0)


class ConversationOut(BaseModel):
    id: int
    peer: PeerOut
    last_message: MessageOut | None = None
    unread_count: int = 0
    updated_at: datetime
    peer_online: bool = False
    peer_last_seen_at: datetime | None = None


class ConversationPage(BaseModel):
    items: list[ConversationOut]
    next_cursor: int | None = None
    limit: int = 20


class ReadOut(BaseModel):
    conversation_id: int
    last_read_at: datetime
    unread_count: int = 0
