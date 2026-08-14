# Communities Spec — Fase 4

## Objetivo
Espacios temáticos (materias, clubes) con membresía, roles básicos y posts propios.

## Estado actual
Pendiente de implementación.

## Alcance
- CRUD comunidad (crear + listar + detalle + editar nombre/desc/reglas por admin).
- Unirse / salir; roles `member` | `admin` (owner = admin al crear).
- Posts con `community_id`; solo miembros pueden postear.
- UI: `/communities` lista + crear; `/communities/:id` detalle, join, feed y composer.

## Fuera de alcance
- Moderación avanzada / bans.
- Roles `mod` con permisos extra (campo reservado, comportamiento = member).
- Cover upload dedicado (URL opcional en create/update).

## Archivos involucrados
- `backend/app/models/community.py`
- `backend/app/api/communities.py`
- `backend/app/schemas/community.py`
- `backend/app/models/post.py` (`community_id`)
- `frontend/src/pages/Communities.jsx`, `CommunityDetail.jsx`
- `supabase/migrations/20260814040000_communities.sql`
- `backend/tests/test_communities.py`

## Criterios de aceptación
- [x] Usuario autenticado crea comunidad y queda como admin.
- [x] Otro usuario se une y puede postear en la comunidad.
- [x] No-miembro recibe 403 al postear.
- [x] Feed global no mezcla posts de comunidad (solo `community_id` null).
- [x] Listado de miembros y contadores correctos.

## Testing
- `pytest tests/test_communities.py`

## Seguridad
- JWT en todas las rutas.
- Solo admin edita comunidad.
- Validar slug único y longitudes Pydantic.

## Riesgos
- SQLite `ALTER` para `posts.community_id` en local.

## Estado actual
Implementado (Fase 4 / Sprint S4).
