from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuthorBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class PostCreate(BaseModel):
    content: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str | None = None
    image_url: str | None
    author_id: int
    created_at: datetime
    author: AuthorBrief
    likes_count: int = 0
    comments_count: int = 0
    liked_by_me: bool = False


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None
    cover_url: str | None = None
    bio: str | None = None
    created_at: datetime
    posts_count: int = 0


class UserProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)
    cover_url: str | None = Field(default=None, max_length=500)


class PostUpdate(BaseModel):
    content: str | None = Field(default=None, max_length=2000)
