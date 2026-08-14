from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuthorBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class PostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)


class PostUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=2000)


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    image_url: str | None
    author_id: int
    community_id: int | None = None
    created_at: datetime
    author: AuthorBrief
    likes_count: int = 0
    comments_count: int = 0
    liked_by_me: bool = False
    saved_by_me: bool = False
    shares_count: int = 0
    reported_by_me: bool = False
    hashtags: list[str] = []


class PostPage(BaseModel):
    items: list[PostOut]
    next_cursor: int | None = None


class SaveToggleOut(BaseModel):
    saved: bool


class BadgeBrief(BaseModel):
    code: str
    name: str
    description: str | None = None


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None
    cover_url: str | None = None
    bio: str | None = None
    career: str | None = None
    university: str | None = None
    semester: int | None = None
    created_at: datetime
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    xp: int = 0
    level: int = 1
    badges: list[BadgeBrief] = []


class UserProfileUpdate(BaseModel):
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)
    cover_url: str | None = Field(default=None, max_length=500)
    career: str | None = Field(default=None, max_length=120)
    university: str | None = Field(default=None, max_length=120)
    semester: int | None = Field(default=None, ge=1, le=20)
