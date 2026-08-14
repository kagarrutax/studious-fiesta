"""Simple in-memory rate limiter (single-process / local & 1-instance Render)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import settings


class RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str, *, limit: int, window_seconds: float) -> None:
        if not settings.rate_limit_enabled:
            return
        if limit <= 0:
            return
        now = time.monotonic()
        bucket = self._buckets[key]
        cutoff = now - window_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
            )
        bucket.append(now)


rate_limiter = RateLimiter()


def client_key(request: Request, suffix: str) -> str:
    host = request.client.host if request.client else "unknown"
    return f"{host}:{suffix}"


def limit_login(request: Request) -> None:
    rate_limiter.hit(
        client_key(request, "login"),
        limit=settings.rate_limit_login_per_minute,
        window_seconds=60.0,
    )


def limit_register(request: Request) -> None:
    rate_limiter.hit(
        client_key(request, "register"),
        limit=settings.rate_limit_register_per_minute,
        window_seconds=60.0,
    )


def limit_upload(request: Request) -> None:
    rate_limiter.hit(
        client_key(request, "upload"),
        limit=settings.rate_limit_upload_per_minute,
        window_seconds=60.0,
    )


def limit_message(request: Request) -> None:
    rate_limiter.hit(
        client_key(request, "message"),
        limit=settings.rate_limit_message_per_minute,
        window_seconds=60.0,
    )
