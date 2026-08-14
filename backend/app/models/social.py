from datetime import datetime, timezone
import re

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

HASHTAG_RE = re.compile(r"(?<!\w)#([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_]{2,50})", re.UNICODE)


class PostSave(Base):
    __tablename__ = "post_saves"
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post_save"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")
    post = relationship("Post", back_populates="saves")


class Hashtag(Base):
    __tablename__ = "hashtags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    posts = relationship("PostHashtag", back_populates="hashtag", cascade="all, delete-orphan")


class PostHashtag(Base):
    __tablename__ = "post_hashtags"
    __table_args__ = (UniqueConstraint("post_id", "hashtag_id", name="uq_post_hashtag"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False, index=True)
    hashtag_id: Mapped[int] = mapped_column(ForeignKey("hashtags.id"), nullable=False, index=True)

    post = relationship("Post", back_populates="hashtag_links")
    hashtag = relationship("Hashtag", back_populates="posts")


class PostShare(Base):
    __tablename__ = "post_shares"
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post_share"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User")
    post = relationship("Post", back_populates="shares")


class PostReport(Base):
    __tablename__ = "post_reports"
    __table_args__ = (UniqueConstraint("reporter_id", "post_id", name="uq_user_post_report"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(280), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    reporter = relationship("User")
    post = relationship("Post", back_populates="reports")


def extract_hashtag_names(content: str) -> list[str]:
    found = HASHTAG_RE.findall(content or "")
    # preserve order, unique case-insensitive
    seen: set[str] = set()
    names: list[str] = []
    for raw in found:
        key = raw.lower()
        if key in seen:
            continue
        seen.add(key)
        names.append(key)
    return names
