from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Comment, Like, Post, User

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "posts": db.scalar(select(func.count()).select_from(Post)) or 0,
        "likes": db.scalar(select(func.count()).select_from(Like)) or 0,
        "comments": db.scalar(select(func.count()).select_from(Comment)) or 0,
    }
