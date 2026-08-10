from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user
from app.api.posts import load_posts_query, serialize_post
from app.db import get_db
from app.models.user import User
from app.models.post import Post
from app.schemas.search import SearchResponse

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
    q_trimmed = q.strip()
    if not q_trimmed:
        raise HTTPException(status_code=400, detail="Consulta vacía no permitida")

    search_term = f"%{q_trimmed}%"

    users = db.scalars(
        select(User)
        .where(User.username.ilike(search_term))
        .limit(20)
    ).all()

    posts = db.scalars(
        load_posts_query()
        .where(Post.content.ilike(search_term))
        .order_by(Post.created_at.desc())
        .limit(20)
    ).all()

    return SearchResponse(
        users=users,
        posts=[serialize_post(post, current_user.id) for post in posts]
    )
