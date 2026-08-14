from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.api.events import upcoming_events_brief
from app.api.posts import load_posts_query, serialize_post
from app.db import get_db
from app.models import (
    Comment,
    Community,
    CommunityMember,
    Follow,
    Like,
    Notification,
    Post,
    Resource,
    User,
)
from app.services.notify import unread_count

router = APIRouter(prefix="/stats", tags=["stats"])


def _me_stats(db: Session, user_id: int) -> dict:
    likes_received = (
        db.scalar(
            select(func.count())
            .select_from(Like)
            .join(Post, Post.id == Like.post_id)
            .where(Post.author_id == user_id)
        )
        or 0
    )
    comments_received = (
        db.scalar(
            select(func.count())
            .select_from(Comment)
            .join(Post, Post.id == Comment.post_id)
            .where(Post.author_id == user_id)
        )
        or 0
    )
    return {
        "posts": db.scalar(select(func.count()).select_from(Post).where(Post.author_id == user_id))
        or 0,
        "likes_received": likes_received,
        "comments_received": comments_received,
        "followers": db.scalar(
            select(func.count()).select_from(Follow).where(Follow.followed_id == user_id)
        )
        or 0,
        "following": db.scalar(
            select(func.count()).select_from(Follow).where(Follow.user_id == user_id)
        )
        or 0,
        "communities": db.scalar(
            select(func.count())
            .select_from(CommunityMember)
            .where(CommunityMember.user_id == user_id)
        )
        or 0,
        "resources": db.scalar(
            select(func.count()).select_from(Resource).where(Resource.uploader_id == user_id)
        )
        or 0,
        "unread_notifications": unread_count(db, user_id),
    }


@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    recent_posts = db.scalars(
        load_posts_query()
        .where(Post.community_id.is_(None))
        .order_by(Post.created_at.desc())
        .limit(5)
    ).all()
    recent_users = db.scalars(select(User).order_by(User.created_at.desc()).limit(5)).all()

    notices = db.scalars(
        select(Notification)
        .options(selectinload(Notification.actor))
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .limit(5)
    ).all()

    my_communities = db.scalars(
        select(Community)
        .join(CommunityMember, CommunityMember.community_id == Community.id)
        .where(CommunityMember.user_id == current_user.id)
        .order_by(CommunityMember.joined_at.desc())
        .limit(5)
    ).all()

    my_resources = db.scalars(
        select(Resource)
        .where(Resource.uploader_id == current_user.id)
        .order_by(Resource.id.desc())
        .limit(5)
    ).all()

    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "posts": db.scalar(select(func.count()).select_from(Post)) or 0,
        "likes": db.scalar(select(func.count()).select_from(Like)) or 0,
        "comments": db.scalar(select(func.count()).select_from(Comment)) or 0,
        "me": _me_stats(db, current_user.id),
        "recent_posts": [serialize_post(post, current_user.id).model_dump(mode="json") for post in recent_posts],
        "recent_users": [
            {
                "id": user.id,
                "username": user.username,
                "created_at": user.created_at,
            }
            for user in recent_users
        ],
        "upcoming_events": upcoming_events_brief(db, current_user.id, limit=5),
        "recent_notifications": [
            {
                "id": n.id,
                "type": n.type,
                "read_at": n.read_at,
                "created_at": n.created_at,
                "actor_username": n.actor.username if n.actor else None,
            }
            for n in notices
        ],
        "my_communities": [
            {"id": c.id, "name": c.name, "slug": c.slug} for c in my_communities
        ],
        "my_resources": [{"id": r.id, "title": r.title} for r in my_resources],
        "leaderboard": [
            {
                "id": u.id,
                "username": u.username,
                "xp": int(u.xp or 0),
                "level": int(u.level or 1),
            }
            for u in db.scalars(select(User).order_by(User.xp.desc(), User.id.asc()).limit(10)).all()
        ],
    }
