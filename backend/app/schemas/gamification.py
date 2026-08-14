from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BadgeOut(BaseModel):
    code: str
    name: str
    description: str | None = None
    earned_at: datetime | None = None


class GamificationMeOut(BaseModel):
    xp: int
    level: int
    badges: list[BadgeOut]
    next_level_xp: int


class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None
    xp: int
    level: int


class ShareOut(BaseModel):
    shared: bool
    shares_count: int


class ReportIn(BaseModel):
    reason: str = Field(min_length=3, max_length=280)


class ReportOut(BaseModel):
    reported: bool
