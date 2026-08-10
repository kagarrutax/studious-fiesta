from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.follows import router as follows_router
from app.api.posts import router as posts_router
from app.api.stats import router as stats_router
from app.api.users import router as users_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(posts_router)
router.include_router(users_router)
router.include_router(follows_router)
router.include_router(stats_router)


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
