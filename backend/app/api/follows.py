from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Follow, User
from app.schemas import FollowerOut, FollowToggleOut

router = APIRouter(prefix="/users", tags=["follows"])


def _followers_count(db: Session, user_id: int) -> int:
    return db.scalar(select(func.count()).select_from(Follow).where(Follow.followed_id == user_id)) or 0


@router.post("/{user_id}/follow", response_model=FollowToggleOut)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FollowToggleOut:
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes seguirte a ti mismo")

    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    existing = db.scalar(
        select(Follow).where(Follow.user_id == current_user.id, Follow.followed_id == user_id)
    )
    if existing is None:
        db.add(Follow(user_id=current_user.id, followed_id=user_id))
        db.commit()

    return FollowToggleOut(following=True, followers_count=_followers_count(db, user_id))


@router.delete("/{user_id}/follow", response_model=FollowToggleOut)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FollowToggleOut:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    existing = db.scalar(
        select(Follow).where(Follow.user_id == current_user.id, Follow.followed_id == user_id)
    )
    if existing is not None:
        db.delete(existing)
        db.commit()

    return FollowToggleOut(following=False, followers_count=_followers_count(db, user_id))


@router.get("/{user_id}/followers", response_model=list[FollowerOut])
def list_followers(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[FollowerOut]:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    followers = db.scalars(
        select(User)
        .join(Follow, Follow.user_id == User.id)
        .where(Follow.followed_id == user_id)
        .order_by(Follow.created_at.desc())
    ).all()

    return [FollowerOut(id=u.id, username=u.username, avatar_url=u.avatar_url) for u in followers]
