"""In-process WebSocket connection manager (per user channel)."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._rooms: dict[int, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._rooms[user_id].add(websocket)

    async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._rooms.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._rooms.pop(user_id, None)

    async def send_to_user(self, user_id: int, message: dict[str, Any]) -> None:
        async with self._lock:
            sockets = list(self._rooms.get(user_id, set()))
        dead: list[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                logger.debug("WS send failed for user %s", user_id, exc_info=True)
                dead.append(ws)
        for ws in dead:
            await self.disconnect(user_id, ws)

    async def send_many(self, user_id: int, messages: list[dict[str, Any]]) -> None:
        for message in messages:
            await self.send_to_user(user_id, message)

    def is_online(self, user_id: int) -> bool:
        return bool(self._rooms.get(user_id))

    def online_user_ids(self) -> list[int]:
        return [uid for uid, sockets in self._rooms.items() if sockets]


realtime_manager = ConnectionManager()
