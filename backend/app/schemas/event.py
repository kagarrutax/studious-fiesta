from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

RSVP_STATUSES = ("going", "interested", "declined")


class EventCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = Field(default=None, max_length=200)
    community_id: int | None = None

    @model_validator(mode="after")
    def validate_range(self):
        if self.ends_at is not None and self.ends_at < self.starts_at:
            raise ValueError("ends_at debe ser >= starts_at")
        return self


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    location: str | None = Field(default=None, max_length=200)
    community_id: int | None = None


class EventCreator(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    community_id: int | None = None
    title: str
    description: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = None
    created_at: datetime
    creator: EventCreator | None = None
    going_count: int = 0
    interested_count: int = 0
    my_status: str | None = None


class EventPage(BaseModel):
    items: list[EventOut]
    next_cursor: int | None = None
    limit: int = 20


class RsvpIn(BaseModel):
    status: str = Field(default="going")

    @model_validator(mode="after")
    def validate_status(self):
        status = (self.status or "").strip().lower()
        if status not in RSVP_STATUSES:
            raise ValueError(f"status debe ser uno de: {', '.join(RSVP_STATUSES)}")
        self.status = status
        return self


class AttendeeOut(BaseModel):
    id: int
    username: str
    avatar_url: str | None = None
    status: str
    created_at: datetime
