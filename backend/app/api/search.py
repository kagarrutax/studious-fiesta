from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.posts import load_posts_query, serialize_post
from app.db import get_db
from app.models import Community, CommunityMember, Event, Post, Resource, User
from app.schemas.search import (
    SearchCommunityHit,
    SearchEventHit,
    SearchResourceHit,
    SearchResponse,
)

router = APIRouter(prefix="/search", tags=["search"])

SEARCH_TYPES = ("all", "users", "posts", "communities", "events", "resources")


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, max_length=100),
    type: str = Query(default="all", max_length=20),
    subject_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
    q_trimmed = q.strip()
    if not q_trimmed:
        raise HTTPException(status_code=400, detail="Consulta vacía no permitida")

    kind = (type or "all").strip().lower()
    if kind not in SEARCH_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"type inválido. Usa: {', '.join(SEARCH_TYPES)}",
        )

    search_term = f"%{q_trimmed}%"
    want = lambda name: kind in ("all", name)

    users: list[User] = []
    posts: list = []
    communities: list[SearchCommunityHit] = []
    events: list[SearchEventHit] = []
    resources: list[SearchResourceHit] = []

    if want("users"):
        users = list(
            db.scalars(select(User).where(User.username.ilike(search_term)).limit(20)).all()
        )

    if want("posts"):
        posts = list(
            db.scalars(
                load_posts_query()
                .where(Post.content.ilike(search_term), Post.community_id.is_(None))
                .order_by(Post.created_at.desc())
                .limit(20)
            ).all()
        )

    if want("communities"):
        rows = db.scalars(
            select(Community)
            .where(
                or_(
                    Community.name.ilike(search_term),
                    Community.slug.ilike(search_term),
                    Community.description.ilike(search_term),
                )
            )
            .order_by(Community.id.desc())
            .limit(20)
        ).all()
        for c in rows:
            count = (
                db.scalar(
                    select(func.count())
                    .select_from(CommunityMember)
                    .where(CommunityMember.community_id == c.id)
                )
                or 0
            )
            communities.append(
                SearchCommunityHit(
                    id=c.id,
                    name=c.name,
                    slug=c.slug,
                    description=c.description,
                    members_count=count,
                )
            )

    if want("events"):
        rows = db.scalars(
            select(Event)
            .where(
                or_(
                    Event.title.ilike(search_term),
                    Event.description.ilike(search_term),
                    Event.location.ilike(search_term),
                )
            )
            .order_by(Event.starts_at.desc())
            .limit(20)
        ).all()
        events = [SearchEventHit.model_validate(e) for e in rows]

    if want("resources"):
        stmt = select(Resource).where(
            or_(Resource.title.ilike(search_term), Resource.description.ilike(search_term))
        )
        if subject_id is not None:
            stmt = stmt.where(Resource.subject_id == subject_id)
        rows = db.scalars(stmt.order_by(Resource.id.desc()).limit(20)).all()
        resources = [SearchResourceHit.model_validate(r) for r in rows]

    return SearchResponse(
        users=users,
        posts=[serialize_post(post, current_user.id) for post in posts],
        communities=communities,
        events=events,
        resources=resources,
    )
