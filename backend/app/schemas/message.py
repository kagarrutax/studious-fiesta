from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.post import AuthorBrief


class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: AuthorBrief
    receiver: AuthorBrief


class ConversationOut(BaseModel):
    user: AuthorBrief
    last_message: str
    last_message_at: datetime
    unread_count: int = 0
