# Notifications Spec — Buzón (Fase 8)

## Objetivo
Buzón de avisos persistente en servidor con badge y lista en vivo vía WebSocket (like, comment, follow).

## Estado actual
Pendiente de implementación (sustituye avisos solo-toast de sesión).

## Alcance
- Tabla `notifications` + REST listado / unread-count / marcar leído.
- Helper `notify(...)` que inserta y emite WS.
- WS `GET /ws/notifications?token=` → eventos `notification.new`, `notification.read`, `badge`.
- Hooks en like (nuevo), comment y follow (primera vez).
- UI: página `/notifications`, badge Navbar, sync inicial + live.

## Fuera de alcance
- Push nativo FCM.
- Notificaciones de message / event / resource (enganchar en fases 5–7).
- Email de avisos.

## Archivos involucrados
- `backend/app/models/notification.py`
- `backend/app/services/realtime.py`, `notify.py`
- `backend/app/api/notifications.py`, `ws.py`
- `backend/app/api/posts.py`, `follows.py` (hooks)
- `frontend/src/context/NotificationsContext.jsx`
- `frontend/src/pages/Notifications.jsx`, `Navbar.jsx`
- `backend/tests/test_notifications.py`
- `supabase/migrations/20260814030000_notifications.sql`

## Criterios de aceptación
- [x] Like/comment/follow generan fila para el destinatario (no para uno mismo).
- [x] `GET /api/notifications` y `GET /api/notifications/unread-count` requieren JWT.
- [x] Marcar una/todas como leídas actualiza `read_at` y emite `badge`.
- [x] Cliente WS autenticado recibe `notification.new` sin F5.
- [x] Badge Navbar refleja unread del servidor.

## Testing
- `pytest tests/test_notifications.py`

## Seguridad
- JWT en REST; token en query solo para WS (no loguear token).
- No exponer datos de otros usuarios vía listado.
- Validar `limit` acotado.

## Riesgos
- Multi-instancia Render sin Redis: fan-out solo local (1 instancia OK para MVP).
- Token en query puede filtrarse en proxies; documentado como trade-off WS.

## Estado actual
Implementado (Fase 8 mínima / Sprint S3).

