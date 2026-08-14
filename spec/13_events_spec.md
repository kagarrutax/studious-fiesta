# Events Spec — Fase 6

## Objetivo
Agenda del campus: crear eventos, RSVP y listar asistentes.

## Estado actual
Pendiente de implementación.

## Alcance
- Tablas `events`, `event_attendees`.
- CRUD evento (crear/listar/detalle/editar/borrar por creador).
- RSVP con status `going` | `interested` | `declined`.
- Lista de asistentes.
- UI `/events` + `/events/:id`.
- Snippet de próximos eventos en `GET /stats` (dashboard).

## Fuera de alcance
- Cron de recordatorios 24h (siguiente iteración).
- Calendario visual mensual.
- Eventos privados / invitaciones exclusivas.

## Archivos involucrados
- `backend/app/models/event.py`
- `backend/app/api/events.py`
- `backend/app/schemas/event.py`
- `frontend/src/pages/Events.jsx`, `EventDetail.jsx`
- `supabase/migrations/20260814060000_events.sql`
- `backend/tests/test_events.py`

## Criterios de aceptación
- [x] Usuario crea evento con título, fechas y lugar.
- [x] Otros usuarios hacen RSVP; se listan asistentes.
- [x] Solo el creador edita/borra.
- [x] Próximos eventos aparecen en `/api/stats`.
- [x] JWT en todas las rutas.

## Testing
- `pytest tests/test_events.py`

## Seguridad
- Validar `ends_at >= starts_at`.
- Status RSVP enumerado.
- 403 si no-creador edita/borra.

## Riesgos
- Zonas horarias: almacenar UTC; UI muestra local.

## Estado actual
Implementado (Fase 6 / Sprint S6). Recordatorios cron = fuera de alcance de este slice.
