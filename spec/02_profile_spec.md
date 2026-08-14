# Profile Spec

## Objetivo
Visualizar y gestionar el perfil académico/público de los usuarios.

## Estado actual
Implementado (MVP + Fase 2 plan plataforma).

- `GET /api/users/{id}` — bio, avatar, cover, career, university, semester, counts, `is_following`
- `PATCH /api/auth/me` — bio + campos académicos
- `POST /api/auth/me/avatar` · `POST /api/auth/me/cover`
- `GET /api/users/{id}/followers` · `GET /api/users/{id}/following`
- UI: portada, editar perfil, tabs Seguidores/Siguiendo, posts con `author_id`

## Alcance
- Datos de perfil (username, avatar, cover, bio, carrera, universidad, semestre).
- Contadores y listas follow.
- Posts del usuario (`GET /api/posts?author_id=`).

## Fuera de alcance
- Reset password / verify email (siguiente en Fase 2).
- Privacidad granular.

## Archivos involucrados
- `backend/app/api/users.py`
- `backend/app/api/auth.py`
- `backend/app/api/follows.py`
- `frontend/src/pages/Profile.jsx`
- `backend/tests/test_profile.py`, `test_follows.py`

## Criterios de aceptación
- [x] Perfil muestra datos correctos; 404 si no existe.
- [x] Propietario edita bio y datos académicos.
- [x] Listas seguidores y siguiendo.
- [x] No se expone `password_hash` en respuestas públicas.

## Testing
- `pytest tests/test_profile.py tests/test_follows.py`

## Seguridad
- JWT en rutas de perfil.
- `UserPublic` / `UserProfile` sin hash ni secretos.
