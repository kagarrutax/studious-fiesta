"""XP awards and badge unlocking."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Comment, Post, Resource, User
from app.models.gamification import DEFAULT_BADGES, Badge, UserBadge, XpEvent
from app.models.social import PostShare

XP_RULES = {
    "post": 10,
    "comment": 5,
    "resource": 15,
    "share": 3,
}

BADGE_BY_ACTION = {
    "post": "first_post",
    "comment": "first_comment",
    "resource": "first_resource",
    "share": "first_share",
}


def level_for_xp(xp: int) -> int:
    return max(1, 1 + int(xp) // 100)


def ensure_badges(db: Session) -> None:
    existing = db.scalar(select(func.count()).select_from(Badge)) or 0
    if existing > 0:
        return
    for code, name, description in DEFAULT_BADGES:
        db.add(Badge(code=code, name=name, description=description, icon=code))
    db.commit()


def _grant_badge(db: Session, user_id: int, code: str) -> dict | None:
    badge = db.scalar(select(Badge).where(Badge.code == code))
    if badge is None:
        return None
    already = db.scalar(
        select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id)
    )
    if already is not None:
        return None
    db.add(UserBadge(user_id=user_id, badge_id=badge.id))
    db.flush()
    return {"code": badge.code, "name": badge.name, "description": badge.description}


def award_xp(db: Session, user_id: int, action: str) -> dict:
    """Award XP for an action and unlock first-* badges when applicable."""
    ensure_badges(db)
    points = XP_RULES.get(action, 0)
    user = db.get(User, user_id)
    if user is None:
        return {"xp": 0, "level": 1, "points": 0, "new_badges": []}

    if points > 0:
        db.add(XpEvent(user_id=user_id, action=action, points=points))
        user.xp = int(user.xp or 0) + points
        user.level = level_for_xp(user.xp)

    new_badges: list[dict] = []
    badge_code = BADGE_BY_ACTION.get(action)
    if badge_code:
        # Only on first occurrence of the underlying entity
        count = 0
        if action == "post":
            count = db.scalar(select(func.count()).select_from(Post).where(Post.author_id == user_id)) or 0
        elif action == "comment":
            count = (
                db.scalar(select(func.count()).select_from(Comment).where(Comment.user_id == user_id)) or 0
            )
        elif action == "resource":
            count = (
                db.scalar(
                    select(func.count()).select_from(Resource).where(Resource.uploader_id == user_id)
                )
                or 0
            )
        elif action == "share":
            count = (
                db.scalar(select(func.count()).select_from(PostShare).where(PostShare.user_id == user_id))
                or 0
            )
        if count == 1:
            earned = _grant_badge(db, user_id, badge_code)
            if earned:
                new_badges.append(earned)

    db.commit()
    db.refresh(user)
    return {
        "xp": int(user.xp or 0),
        "level": int(user.level or 1),
        "points": points,
        "new_badges": new_badges,
    }


def list_user_badges(db: Session, user_id: int) -> list[dict]:
    ensure_badges(db)
    rows = db.scalars(
        select(UserBadge)
        .options(selectinload(UserBadge.badge))
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.earned_at.asc())
    ).all()
    return [
        {
            "code": row.badge.code,
            "name": row.badge.name,
            "description": row.badge.description,
            "earned_at": row.earned_at,
        }
        for row in rows
        if row.badge is not None
    ]
