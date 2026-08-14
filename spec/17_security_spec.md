# Security Spec — Fase 12 / Sprint S10 (local)

## Objetivo
Endurecer auth, uploads y mensajes con rate limit y tests de ownership. Sin deploy.

## Alcance
- Rate limit in-memory: login/register, upload de posts, envío de mensajes.
- Settings: `RATE_LIMIT_ENABLED`, límites por ventana.
- Tests: otro usuario no borra post/recurso/evento; rate limit responde 429.
- Checklist de seguridad en esta spec.

## Fuera de alcance
- Deploy Render/Vercel (solo local).
- Redis / rate limit multi-instancia.
- Reset password / SMTP.

## Criterios
- [x] Login abusivo → 429.
- [x] Ownership tests en verde.
- [x] JWT + MIME allowlist ya existentes.
- [x] Secretos solo vía env / `.env` (no hardcode en frontend).

## Testing
- `pytest tests/test_security.py`

## Checklist seguridad (local)
- [x] Endpoints sensibles con `get_current_user`
- [x] Sin `password_hash` en respuestas públicas
- [x] MIME/tamaño en uploads
- [x] Rate limit login + mensajes + upload
- [x] 403 en borrado cruzado
