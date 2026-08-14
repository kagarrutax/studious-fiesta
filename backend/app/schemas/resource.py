from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


ALLOWED_CATEGORIES = ("notes", "slides", "exam", "other")


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None = None


class ResourceUploader(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uploader_id: int
    subject_id: int | None = None
    title: str
    description: str | None = None
    category: str
    file_url: str
    file_type: str
    size_bytes: int
    downloads_count: int
    avg_rating: float
    created_at: datetime
    uploader: ResourceUploader | None = None
    subject: SubjectOut | None = None
    my_rating: int | None = None


class ResourcePage(BaseModel):
    items: list[ResourceOut]
    next_cursor: int | None = None
    limit: int = 20


class ResourceCreateMeta(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    category: str = Field(default="notes", max_length=40)
    subject_id: int | None = None


class ResourceRateIn(BaseModel):
    score: int = Field(ge=1, le=5)


class ResourceRateOut(BaseModel):
    avg_rating: float
    my_rating: int
