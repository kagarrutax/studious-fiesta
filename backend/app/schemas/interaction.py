from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.post import AuthorBrief


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    user_id: int
    post_id: int
    created_at: datetime
    author: AuthorBrief


class LikeToggleOut(BaseModel):
    liked: bool
    likes_count: int
