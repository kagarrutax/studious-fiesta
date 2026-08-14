from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommunityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    rules: str | None = Field(default=None, max_length=4000)
    cover_url: str | None = Field(default=None, max_length=500)
    slug: str | None = Field(default=None, min_length=2, max_length=80)


class CommunityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    rules: str | None = Field(default=None, max_length=4000)
    cover_url: str | None = Field(default=None, max_length=500)


class CommunityOwner(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None = None
    cover_url: str | None = None
    rules: str | None = None
    owner_id: int
    created_at: datetime
    owner: CommunityOwner | None = None
    members_count: int = 0
    posts_count: int = 0
    is_member: bool = False
    my_role: str | None = None


class CommunityPage(BaseModel):
    items: list[CommunityOut]
    next_cursor: int | None = None
    limit: int = 20


class CommunityMemberOut(BaseModel):
    id: int
    username: str
    avatar_url: str | None = None
    role: str
    joined_at: datetime


class CommunityPostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
