from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.posts import load_posts_query, serialize_post
from app.db import get_db
from app.models import Comment, Like, Post, User

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    recent_posts = db.scalars(
        load_posts_query().order_by(Post.created_at.desc()).limit(5)
    ).all()
    recent_users = db.scalars(select(User).order_by(User.created_at.desc()).limit(5)).all()

    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "posts": db.scalar(select(func.count()).select_from(Post)) or 0,
        "likes": db.scalar(select(func.count()).select_from(Like)) or 0,
        "comments": db.scalar(select(func.count()).select_from(Comment)) or 0,
        "recent_posts": [serialize_post(post, current_user.id).model_dump(mode="json") for post in recent_posts],
        "recent_users": [
            {
                "id": user.id,
                "username": user.username,
                "created_at": user.created_at,
            }
            for user in recent_users
        ],
    }
