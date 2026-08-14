from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/mobile", tags=["mobile"])


class MobileVersionOut(BaseModel):
    version: str
    version_code: int
    apk_url: str
    mandatory: bool


@router.get("/version", response_model=MobileVersionOut)
def mobile_version() -> MobileVersionOut:
    """Public metadata used by installed APKs to offer an update."""
    return MobileVersionOut(
        version=settings.mobile_latest_version,
        version_code=settings.mobile_latest_version_code,
        apk_url=settings.mobile_apk_url,
        mandatory=settings.mobile_update_mandatory,
    )
