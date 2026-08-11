from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.uploads import save_upload
from app.db import get_db
from app.models import Comment, Like, Post, User
from app.schemas import CommentCreate, CommentOut, LikeToggleOut, PostCreate, PostOut

router = APIRouter(prefix="/posts", tags=["posts"])


def serialize_post(post: Post, current_user_id: int) -> PostOut:
    return PostOut(
        id=post.id,
        content=post.content,
        image_url=post.image_url,
        author_id=post.author_id,
        created_at=post.created_at,
        author=post.author,
        likes_count=len(post.likes),
        comments_count=len(post.comments),
        liked_by_me=any(like.user_id == current_user_id for like in post.likes),
    )


def load_posts_query():
    return select(Post).options(
        selectinload(Post.author),
        selectinload(Post.likes),
        selectinload(Post.comments),
    )


def get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.scalar(load_posts_query().where(Post.id == post_id))
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no encontrada")
    return post


@router.get("", response_model=list[PostOut])
def list_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PostOut]:
    posts = db.scalars(load_posts_query().order_by(Post.created_at.desc())).all()
    return [serialize_post(post, current_user.id) for post in posts]


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post_json(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    post = Post(
        content=payload.content.strip(),
        image_url=payload.image_url,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    return serialize_post(get_post_or_404(db, post.id), current_user.id)


@router.post("/upload", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post_with_image(
    content: str = Form(..., min_length=1, max_length=2000),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    image_url = await save_upload(image, db)
    post = Post(
        content=content.strip(),
        image_url=image_url,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    return serialize_post(get_post_or_404(db, post.id), current_user.id)


@router.get("/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    return serialize_post(get_post_or_404(db, post_id), current_user.id)


@router.post("/{post_id}/like", response_model=LikeToggleOut)
def toggle_like(
    post_id: int,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentOut:
    if db.get(Post, post_id) is None:
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
    return CommentOut(
        id=comment.id,
        content=comment.content,
        user_id=comment.user_id,
        post_id=comment.post_id,
        created_at=comment.created_at,
        author=comment.user,
    )
