from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.communities import router as communities_router
from app.api.events import router as events_router
from app.api.feed import router as feed_router
from app.api.follows import router as follows_router
from app.api.media import router as media_router
from app.api.messages import router as messages_router
from app.api.notifications import router as notifications_router
from app.api.posts import router as posts_router
from app.api.resources import router as resources_router
from app.api.gamification import router as gamification_router
from app.api.stats import router as stats_router
from app.api.users import router as users_router
from app.api.search import router as search_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(media_router)
router.include_router(feed_router)
router.include_router(posts_router)
router.include_router(users_router)
router.include_router(follows_router)
router.include_router(notifications_router)
router.include_router(communities_router)
router.include_router(resources_router)
router.include_router(events_router)
router.include_router(messages_router)
router.include_router(gamification_router)
router.include_router(stats_router)
router.include_router(search_router)


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
