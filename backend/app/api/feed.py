from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.posts import load_posts_query, paginate_posts
from app.db import get_db
from app.models import Follow, Post, User
from app.schemas import PostPage

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=PostPage)
def following_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
) -> PostPage:
    following_ids = db.scalars(
        select(Follow.followed_id).where(Follow.user_id == current_user.id)
    ).all()
    author_ids = list({*following_ids, current_user.id})
    query = load_posts_query().where(
        Post.author_id.in_(author_ids),
        Post.community_id.is_(None),
    )
    return paginate_posts(db, current_user.id, query, limit=limit, cursor=cursor)
