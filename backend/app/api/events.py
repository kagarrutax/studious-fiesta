from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Community, Event, EventAttendee, User
from app.schemas.event import (
    AttendeeOut,
    EventCreate,
    EventCreator,
    EventOut,
    EventPage,
    EventUpdate,
    RsvpIn,
)

router = APIRouter(prefix="/events", tags=["events"])


def load_event_query():
    return select(Event).options(
        selectinload(Event.creator),
        selectinload(Event.attendees),
    )


def get_event_or_404(db: Session, event_id: int) -> Event:
    event = db.scalar(load_event_query().where(Event.id == event_id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")
    return event


def serialize_event(event: Event, current_user_id: int) -> EventOut:
    going = 0
    interested = 0
    my_status = None
    for row in event.attendees:
        if row.status == "going":
            going += 1
        elif row.status == "interested":
            interested += 1
        if row.user_id == current_user_id:
            my_status = row.status
    return EventOut(
        id=event.id,
        creator_id=event.creator_id,
        community_id=event.community_id,
        title=event.title,
        description=event.description,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        location=event.location,
        created_at=event.created_at,
        creator=EventCreator.model_validate(event.creator) if event.creator else None,
        going_count=going,
        interested_count=interested,
        my_status=my_status,
    )


def _upcoming_clause(now: datetime | None = None):
    """Keep events visible until they end (or for a while after start if no end)."""
    now = now or datetime.now(timezone.utc)
    grace_start = now - timedelta(hours=6)
    return or_(
        Event.ends_at.is_not(None) & (Event.ends_at >= now),
        Event.ends_at.is_(None) & (Event.starts_at >= grace_start),
    )


@router.get("", response_model=EventPage)
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50),
    cursor: int | None = Query(default=None),
    upcoming: bool = Query(default=False),
) -> EventPage:
    stmt = load_event_query()
    if upcoming:
        stmt = stmt.where(_upcoming_clause()).order_by(Event.starts_at.asc(), Event.id.asc())
        if cursor is not None:
            stmt = stmt.where(Event.id > cursor)
    else:
        stmt = stmt.order_by(Event.starts_at.desc(), Event.id.desc())
        if cursor is not None:
            stmt = stmt.where(Event.id < cursor)
    rows = list(db.scalars(stmt.limit(limit + 1)).all())
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1].id if rows else None
    return EventPage(
        items=[serialize_event(e, current_user.id) for e in rows],
        next_cursor=next_cursor,
        limit=limit,
    )


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EventOut:
    if payload.community_id is not None and db.get(Community, payload.community_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comunidad no encontrada")

    event = Event(
        creator_id=current_user.id,
        community_id=payload.community_id,
        title=payload.title.strip(),
        description=(payload.description or "").strip() or None,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        location=(payload.location or "").strip() or None,
    )
    db.add(event)
    db.flush()
    # Creator auto-RSVP as going
    db.add(EventAttendee(event_id=event.id, user_id=current_user.id, status="going"))
    db.commit()
    return serialize_event(get_event_or_404(db, event.id), current_user.id)


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EventOut:
    return serialize_event(get_event_or_404(db, event_id), current_user.id)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EventOut:
    event = get_event_or_404(db, event_id)
    if event.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el creador puede editar")

    data = payload.model_dump(exclude_unset=True)
    starts = data.get("starts_at", event.starts_at)
    ends = data.get("ends_at", event.ends_at)
    if ends is not None and starts is not None and ends < starts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ends_at debe ser >= starts_at")

    if "community_id" in data and data["community_id"] is not None:
        if db.get(Community, data["community_id"]) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comunidad no encontrada")

    for key, value in data.items():
        if key in ("title", "description", "location") and isinstance(value, str):
            value = value.strip() or None
            if key == "title" and value is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Título inválido")
        setattr(event, key, value)

    db.commit()
    return serialize_event(get_event_or_404(db, event_id), current_user.id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_event_or_404(db, event_id)
    if event.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el creador puede borrar")
    db.delete(event)
    db.commit()
    return None


@router.post("/{event_id}/rsvp", response_model=EventOut)
def rsvp_event(
    event_id: int,
    payload: RsvpIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EventOut:
    event = get_event_or_404(db, event_id)
    existing = db.scalar(
        select(EventAttendee).where(
            EventAttendee.event_id == event_id,
            EventAttendee.user_id == current_user.id,
        )
    )
    if existing is None:
        db.add(
            EventAttendee(
                event_id=event_id,
                user_id=current_user.id,
                status=payload.status,
            )
        )
    else:
        existing.status = payload.status
    db.commit()
    return serialize_event(get_event_or_404(db, event_id), current_user.id)


@router.get("/{event_id}/attendees", response_model=list[AttendeeOut])
def list_attendees(
    event_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[AttendeeOut]:
    get_event_or_404(db, event_id)
    stmt = (
        select(EventAttendee)
        .options(selectinload(EventAttendee.user))
        .where(EventAttendee.event_id == event_id)
        .order_by(EventAttendee.created_at.asc())
    )
    if status_filter:
        stmt = stmt.where(EventAttendee.status == status_filter.strip().lower())
    rows = db.scalars(stmt).all()
    return [
        AttendeeOut(
            id=row.user.id,
            username=row.user.username,
            avatar_url=row.user.avatar_url,
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
        if row.user is not None
    ]


def upcoming_events_brief(db: Session, current_user_id: int, limit: int = 5) -> list[dict]:
    rows = db.scalars(
        load_event_query()
        .where(_upcoming_clause())
        .order_by(Event.starts_at.asc())
        .limit(limit)
    ).all()
    return [serialize_event(e, current_user_id).model_dump(mode="json") for e in rows]
