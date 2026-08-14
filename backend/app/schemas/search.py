from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.post import AuthorBrief, PostOut


class SearchCommunityHit(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    members_count: int = 0


class SearchEventHit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    location: str | None = None
    starts_at: datetime


class SearchResourceHit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    subject_id: int | None = None


class SearchResponse(BaseModel):
    users: list[AuthorBrief]
    posts: list[PostOut]
    communities: list[SearchCommunityHit] = []
    events: list[SearchEventHit] = []
    resources: list[SearchResourceHit] = []
