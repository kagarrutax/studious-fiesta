from pydantic import BaseModel, ConfigDict


class FollowToggleOut(BaseModel):
    following: bool
    followers_count: int


class FollowerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None
