# Messages Spec — Fase 7

## Objetivo
Chat 1:1 en tiempo real: inbox, hilo, leídos y typing vía WebSocket.

## Estado actual
Pendiente de implementación.

## Alcance
- Tablas `conversations` (1:1 con `pair_key`), `conversation_participants`, `messages`.
- REST: abrir/listar conversaciones, historial paginado, enviar, marcar leído.
- WS `/ws/chat?token=` → `message.new`, `message.read`, `typing`, `presence`, `conversation.updated`.
- Notificación de buzón tipo `message` al destinatario.
- UI `/messages` (inbox) + `/messages/:id` (hilo live).
- Reconexión automática del socket.

## Fuera de alcance
- Grupos de chat.
- Adjuntos / stickers.
- Push nativo FCM.
- Cifrado E2E.

## Archivos involucrados
- `backend/app/models/message.py`
- `backend/app/api/messages.py`
- `backend/app/api/ws.py`
- `backend/app/schemas/message.py`
- `frontend/src/context/ChatContext.jsx`
- `frontend/src/pages/Messages.jsx`, `MessageThread.jsx`
- `supabase/migrations/20260814070000_messages.sql`
- `backend/tests/test_messages.py`

## Criterios de aceptación
- [x] A abre (o reutiliza) conversación 1:1 con B.
- [x] A envía mensaje; B lo recibe por WS sin F5.
- [x] Inbox de B sube el hilo al tope y muestra no leídos.
- [x] Al abrir el hilo, se marca leído y A recibe `message.read`.
- [x] No-participante → 403.
- [x] JWT en REST; token en query solo para WS.

## Testing
- `pytest tests/test_messages.py`

## Seguridad
- Solo participantes leen/escriben.
- Body max 2000 chars (Pydantic).
- No auto-conversación consigo mismo.
- No loguear el token WS.

## Riesgos
- Multi-instancia Render sin Redis (1 instancia OK).
- Token en query (trade-off WS documentado en Fase 8).

## Estado actual
Implementado (Fase 7 / Sprint S7).
