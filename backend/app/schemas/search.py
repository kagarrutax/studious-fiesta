from pydantic import BaseModel
from app.schemas.post import AuthorBrief, PostOut

class SearchResponse(BaseModel):
    users: list[AuthorBrief]
    posts: list[PostOut]
