from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.rate_limit import limit_upload
from app.core.uploads import save_upload
from app.db import get_db
from app.models import Comment, Follow, Hashtag, Like, Post, PostHashtag, PostReport, PostSave, PostShare, User
from app.models.social import extract_hashtag_names
from app.schemas import (
    CommentCreate,
    CommentOut,
    LikeToggleOut,
    PostCreate,
    PostOut,
    PostPage,
    PostUpdate,
    SaveToggleOut,
)
from app.schemas.gamification import ReportIn, ReportOut, ShareOut
from app.services.notify import notify
from app.services.xp import award_xp

router = APIRouter(prefix="/posts", tags=["posts"])


def serialize_post(post: Post, current_user_id: int) -> PostOut:
    return PostOut(
        id=post.id,
        content=post.content,
        image_url=post.image_url,
        author_id=post.author_id,
        community_id=post.community_id,
        created_at=post.created_at,
        author=post.author,
        likes_count=len(post.likes),
        comments_count=len(post.comments),
        liked_by_me=any(like.user_id == current_user_id for like in post.likes),
        saved_by_me=any(save.user_id == current_user_id for save in post.saves),
        shares_count=len(post.shares),
        reported_by_me=any(r.reporter_id == current_user_id for r in post.reports),
        hashtags=[link.hashtag.name for link in post.hashtag_links if link.hashtag],
    )


def load_posts_query():
    return select(Post).options(
        selectinload(Post.author),
        selectinload(Post.likes),
        selectinload(Post.comments),
        selectinload(Post.saves),
        selectinload(Post.shares),
        selectinload(Post.reports),
        selectinload(Post.hashtag_links).selectinload(PostHashtag.hashtag),
    )


def get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.scalar(load_posts_query().where(Post.id == post_id))
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    return post


def sync_post_hashtags(db: Session, post: Post, content: str) -> None:
    names = extract_hashtag_names(content)
    for link in list(post.hashtag_links):
        db.delete(link)
    db.flush()
    for name in names:
        tag = db.scalar(select(Hashtag).where(Hashtag.name == name))
        if tag is None:
            tag = Hashtag(name=name)
            db.add(tag)
            db.flush()
        db.add(PostHashtag(post_id=post.id, hashtag_id=tag.id))


def paginate_posts(
    db: Session,
    current_user_id: int,
    query,
    *,
    limit: int,
    cursor: int | None,
) -> PostPage:
    limit = max(1, min(limit, 50))
    q = query.order_by(Post.created_at.desc(), Post.id.desc())
    if cursor is not None:
        cursor_post = db.get(Post, cursor)
        if cursor_post is not None:
            q = q.where(
                (Post.created_at < cursor_post.created_at)
                | ((Post.created_at == cursor_post.created_at) & (Post.id < cursor_post.id))
            )
    posts = db.scalars(q.limit(limit + 1)).all()
    has_more = len(posts) > limit
    items = posts[:limit]
    next_cursor = items[-1].id if has_more and items else None
    return PostPage(
        items=[serialize_post(post, current_user_id) for post in items],
        next_cursor=next_cursor,
    )


@router.get("", response_model=PostPage)
def list_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
    author_id: int | None = Query(default=None),
) -> PostPage:
    query = load_posts_query()
    if author_id is not None:
        query = query.where(Post.author_id == author_id)
    else:
        query = query.where(Post.community_id.is_(None))
    return paginate_posts(db, current_user.id, query, limit=limit, cursor=cursor)


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post_json(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    content = payload.content.strip()
    post = Post(
        content=content,
        image_url=payload.image_url,
        author_id=current_user.id,
    )
    db.add(post)
    db.flush()
    sync_post_hashtags(db, post, content)
    db.commit()
    award_xp(db, current_user.id, "post")
    return serialize_post(get_post_or_404(db, post.id), current_user.id)


@router.post("/upload", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post_with_image(
    request: Request,
    content: str = Form(..., min_length=1, max_length=2000),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    limit_upload(request)
    image_url = await save_upload(image, db)
    text = content.strip()
    post = Post(
        content=text,
        image_url=image_url,
        author_id=current_user.id,
    )
    db.add(post)
    db.flush()
    sync_post_hashtags(db, post, text)
    db.commit()
    award_xp(db, current_user.id, "post")
    return serialize_post(get_post_or_404(db, post.id), current_user.id)


@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    return serialize_post(get_post_or_404(db, post_id), current_user.id)


@router.patch("/{post_id}", response_model=PostOut)
@router.put("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    post = get_post_or_404(db, post_id)
    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para editar esta publicación")

    if payload.content is not None:
        post.content = payload.content.strip()
        sync_post_hashtags(db, post, post.content)

    db.commit()
    return serialize_post(get_post_or_404(db, post_id), current_user.id)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = get_post_or_404(db, post_id)
    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para eliminar esta publicación")

    db.delete(post)
    db.commit()
    return None


@router.post("/{post_id}/save", response_model=SaveToggleOut)
def save_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SaveToggleOut:
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    existing = db.scalar(
        select(PostSave).where(PostSave.post_id == post_id, PostSave.user_id == current_user.id)
    )
    if existing is None:
        db.add(PostSave(user_id=current_user.id, post_id=post_id))
        db.commit()
    return SaveToggleOut(saved=True)


@router.delete("/{post_id}/save", response_model=SaveToggleOut)
def unsave_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SaveToggleOut:
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    existing = db.scalar(
        select(PostSave).where(PostSave.post_id == post_id, PostSave.user_id == current_user.id)
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
    return SaveToggleOut(saved=False)


@router.post("/{post_id}/share", response_model=ShareOut)
def share_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShareOut:
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    existing = db.scalar(
        select(PostShare).where(PostShare.post_id == post_id, PostShare.user_id == current_user.id)
    )
    if existing is None:
        db.add(PostShare(user_id=current_user.id, post_id=post_id))
        db.commit()
        award_xp(db, current_user.id, "share")
    count = db.scalar(select(func.count()).select_from(PostShare).where(PostShare.post_id == post_id)) or 0
    return ShareOut(shared=True, shares_count=count)


@router.post("/{post_id}/report", response_model=ReportOut)
def report_post(
    post_id: int,
    payload: ReportIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    if post.author_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes reportar tu propio post")
    existing = db.scalar(
        select(PostReport).where(
            PostReport.post_id == post_id,
            PostReport.reporter_id == current_user.id,
        )
    )
    if existing is None:
        db.add(
            PostReport(
                reporter_id=current_user.id,
                post_id=post_id,
                reason=payload.reason.strip(),
                status="open",
            )
        )
        db.commit()
    return ReportOut(reported=True)


@router.post("/{post_id}/like", response_model=LikeToggleOut)
def toggle_like(
    post_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LikeToggleOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")

    existing = db.scalar(
        select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(Like(user_id=current_user.id, post_id=post_id))
        db.commit()
        liked = True
        notify(
            db,
            recipient_id=post.author_id,
            actor_id=current_user.id,
            type="like",
            entity_type="post",
            entity_id=post_id,
            payload={"actor_username": current_user.username},
            background_tasks=background_tasks,
        )

    likes_count = len(db.scalars(select(Like).where(Like.post_id == post_id)).all())
    return LikeToggleOut(liked=liked, likes_count=likes_count)


@router.get("/{post_id}/comments", response_model=list[CommentOut])
def list_comments(
    post_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[CommentOut]:
    if db.get(Post, post_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")

    comments = db.scalars(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    ).all()
    return [
        CommentOut(
            id=comment.id,
            content=comment.content,
            user_id=comment.user_id,
            post_id=comment.post_id,
            created_at=comment.created_at,
            author=comment.user,
        )
        for comment in comments
    ]


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    payload: CommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentOut:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")

    comment = Comment(
        content=payload.content.strip(),
        user_id=current_user.id,
        post_id=post_id,
    )
    db.add(comment)
    db.commit()
    comment = db.scalar(
        select(Comment).options(selectinload(Comment.user)).where(Comment.id == comment.id)
    )
    assert comment is not None
    award_xp(db, current_user.id, "comment")
    notify(
        db,
        recipient_id=post.author_id,
        actor_id=current_user.id,
        type="comment",
        entity_type="post",
        entity_id=post_id,
        payload={
            "actor_username": current_user.username,
            "comment_id": comment.id,
            "preview": comment.content[:120],
        },
        background_tasks=background_tasks,
    )
    return CommentOut(
        id=comment.id,
        content=comment.content,
        user_id=comment.user_id,
        post_id=comment.post_id,
        created_at=comment.created_at,
        author=comment.user,
    )
