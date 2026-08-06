from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Post, User
from app.schemas import UserProfile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> UserProfile:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    posts_count = db.scalar(select(func.count()).select_from(Post).where(Post.author_id == user_id)) or 0
    return UserProfile(
        id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        bio=user.bio,
        created_at=user.created_at,
        posts_count=posts_count,
    )
