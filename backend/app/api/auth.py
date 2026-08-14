from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.rate_limit import limit_login, limit_register, limit_upload
from app.core.security import create_access_token, hash_password, verify_password
from app.core.uploads import save_upload
from app.db import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserProfileUpdate, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    limit_register(request)
    existing = db.scalar(
        select(User).where((User.email == payload.email) | (User.username == payload.username))
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email o username ya está registrado",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)) -> Token:
    limit_login(request)
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    token = create_access_token(subject=user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    data = payload.model_dump(exclude_unset=True)

    def clean_text(value: object) -> str | None:
        if not isinstance(value, str):
            return None
        stripped = value.strip()
        return stripped or None

    if "bio" in data:
        current_user.bio = clean_text(data["bio"])
    if "avatar_url" in data:
        current_user.avatar_url = clean_text(data["avatar_url"])
    if "cover_url" in data:
        current_user.cover_url = clean_text(data["cover_url"])
    if "career" in data:
        current_user.career = clean_text(data["career"])
    if "university" in data:
        current_user.university = clean_text(data["university"])
    if "semester" in data:
        current_user.semester = data["semester"]

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserPublic)
async def upload_my_avatar(
    request: Request,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    limit_upload(request)
    current_user.avatar_url = await save_upload(image, db)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/cover", response_model=UserPublic)
async def upload_my_cover(
    request: Request,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    limit_upload(request)
    current_user.cover_url = await save_upload(image, db)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
