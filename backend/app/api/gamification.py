from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.schemas.gamification import BadgeOut, GamificationMeOut, LeaderboardEntry
from app.services.xp import ensure_badges, list_user_badges

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/me", response_model=GamificationMeOut)
def my_gamification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GamificationMeOut:
    ensure_badges(db)
    user = db.get(User, current_user.id)
    assert user is not None
    xp = int(user.xp or 0)
    level = int(user.level or 1)
    badges = [BadgeOut(**b) for b in list_user_badges(db, user.id)]
    next_level_xp = level * 100
    return GamificationMeOut(xp=xp, level=level, badges=badges, next_level_xp=next_level_xp)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
) -> list[LeaderboardEntry]:
    ensure_badges(db)
    rows = db.scalars(
        select(User).order_by(User.xp.desc(), User.id.asc()).limit(limit)
    ).all()
    return [
        LeaderboardEntry(
            id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            xp=int(u.xp or 0),
            level=int(u.level or 1),
        )
        for u in rows
    ]
