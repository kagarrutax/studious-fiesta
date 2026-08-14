from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class NotificationActor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    actor_id: int | None = None
    type: str
    entity_type: str | None = None
    entity_id: int | None = None
    payload: dict[str, Any] | None = None
    read_at: datetime | None = None
    created_at: datetime
    actor: NotificationActor | None = None


class NotificationPage(BaseModel):
    items: list[NotificationOut]
    next_cursor: int | None = None
    limit: int = Field(ge=1, le=50)


class UnreadCountOut(BaseModel):
    unread: int
