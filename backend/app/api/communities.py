from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.api.posts import get_post_or_404, load_posts_query, paginate_posts, serialize_post, sync_post_hashtags
from app.db import get_db
from app.models import Community, CommunityMember, Post, User
from app.models.community import slugify
from app.schemas import PostOut, PostPage
from app.schemas.community import (
    CommunityCreate,
    CommunityMemberOut,
    CommunityOut,
    CommunityOwner,
    CommunityPage,
    CommunityPostCreate,
    CommunityUpdate,
)

router = APIRouter(prefix="/communities", tags=["communities"])


def _membership(db: Session, community_id: int, user_id: int) -> CommunityMember | None:
    return db.scalar(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == user_id,
        )
    )


def _members_count(db: Session, community_id: int) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(CommunityMember)
            .where(CommunityMember.community_id == community_id)
        )
        or 0
    )


def _posts_count(db: Session, community_id: int) -> int:
    return (
        db.scalar(select(func.count()).select_from(Post).where(Post.community_id == community_id))
        or 0
    )


def _unique_slug(db: Session, base: str) -> str:
    slug = slugify(base)
    candidate = slug
    n = 2
    while db.scalar(select(Community.id).where(Community.slug == candidate)) is not None:
        candidate = f"{slug}-{n}"[:80]
        n += 1
    return candidate


def serialize_community(db: Session, community: Community, current_user_id: int) -> CommunityOut:
    member = _membership(db, community.id, current_user_id)
    return CommunityOut(
        id=community.id,
        name=community.name,
        slug=community.slug,
        description=community.description,
        cover_url=community.cover_url,
        rules=community.rules,
        owner_id=community.owner_id,
        created_at=community.created_at,
        owner=CommunityOwner.model_validate(community.owner) if community.owner else None,
        members_count=_members_count(db, community.id),
        posts_count=_posts_count(db, community.id),
        is_member=member is not None,
        my_role=member.role if member else None,
    )


def get_community_or_404(db: Session, community_id: int) -> Community:
    community = db.scalar(
        select(Community).options(selectinload(Community.owner)).where(Community.id == community_id)
    )
    if community is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comunidad no encontrada")
    return community


@router.get("", response_model=CommunityPage)
def list_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
    q: str | None = Query(default=None, max_length=80),
) -> CommunityPage:
    stmt = select(Community).options(selectinload(Community.owner)).order_by(Community.id.desc())
    if cursor is not None:
        stmt = stmt.where(Community.id < cursor)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(Community.name.ilike(like) | Community.slug.ilike(like))
    rows = list(db.scalars(stmt.limit(limit + 1)).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1].id if rows else None
    return CommunityPage(
        items=[serialize_community(db, c, current_user.id) for c in rows],
        next_cursor=next_cursor,
        limit=limit,
    )


@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
def create_community(
    payload: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    base_slug = payload.slug.strip() if payload.slug else payload.name
    slug = _unique_slug(db, base_slug)
    community = Community(
        name=payload.name.strip(),
        slug=slug,
        description=(payload.description or "").strip() or None,
        rules=(payload.rules or "").strip() or None,
        cover_url=payload.cover_url,
        owner_id=current_user.id,
    )
    db.add(community)
    db.flush()
    db.add(
        CommunityMember(
            community_id=community.id,
            user_id=current_user.id,
            role="admin",
        )
    )
    db.commit()
    return serialize_community(db, get_community_or_404(db, community.id), current_user.id)


@router.get("/{community_id}", response_model=CommunityOut)
def get_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    return serialize_community(db, get_community_or_404(db, community_id), current_user.id)


@router.patch("/{community_id}", response_model=CommunityOut)
def update_community(
    community_id: int,
    payload: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    community = get_community_or_404(db, community_id)
    member = _membership(db, community_id, current_user.id)
    if member is None or member.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admins pueden editar")

    if payload.name is not None:
        community.name = payload.name.strip()
    if payload.description is not None:
        community.description = payload.description.strip() or None
    if payload.rules is not None:
        community.rules = payload.rules.strip() or None
    if payload.cover_url is not None:
        community.cover_url = payload.cover_url
    db.commit()
    return serialize_community(db, get_community_or_404(db, community_id), current_user.id)


@router.post("/{community_id}/join", response_model=CommunityOut)
def join_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    community = get_community_or_404(db, community_id)
    existing = _membership(db, community_id, current_user.id)
    if existing is None:
        db.add(
            CommunityMember(
                community_id=community.id,
                user_id=current_user.id,
                role="member",
            )
        )
        db.commit()
    return serialize_community(db, get_community_or_404(db, community_id), current_user.id)


@router.delete("/{community_id}/join", response_model=CommunityOut)
def leave_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityOut:
    community = get_community_or_404(db, community_id)
    member = _membership(db, community_id, current_user.id)
    if member is None:
        return serialize_community(db, community, current_user.id)
    if community.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El dueño no puede salir de la comunidad",
        )
    db.delete(member)
    db.commit()
    return serialize_community(db, get_community_or_404(db, community_id), current_user.id)


@router.get("/{community_id}/members", response_model=list[CommunityMemberOut])
def list_members(
    community_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[CommunityMemberOut]:
    get_community_or_404(db, community_id)
    rows = db.scalars(
        select(CommunityMember)
        .options(selectinload(CommunityMember.user))
        .where(CommunityMember.community_id == community_id)
        .order_by(CommunityMember.joined_at.asc())
    ).all()
    return [
        CommunityMemberOut(
            id=m.user.id,
            username=m.user.username,
            avatar_url=m.user.avatar_url,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in rows
        if m.user is not None
    ]


@router.get("/{community_id}/posts", response_model=PostPage)
def list_community_posts(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
) -> PostPage:
    get_community_or_404(db, community_id)
    query = load_posts_query().where(Post.community_id == community_id)
    return paginate_posts(db, current_user.id, query, limit=limit, cursor=cursor)


@router.post(
    "/{community_id}/posts",
    response_model=PostOut,
    status_code=status.HTTP_201_CREATED,
)
def create_community_post(
    community_id: int,
    payload: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    get_community_or_404(db, community_id)
    if _membership(db, community_id, current_user.id) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes unirte a la comunidad para publicar",
        )
    content = payload.content.strip()
    post = Post(
        content=content,
        image_url=payload.image_url,
        author_id=current_user.id,
        community_id=community_id,
    )
    db.add(post)
    db.flush()
    sync_post_hashtags(db, post, content)
    db.commit()
    from app.services.xp import award_xp

    award_xp(db, current_user.id, "post")
    return serialize_post(get_post_or_404(db, post.id), current_user.id)
