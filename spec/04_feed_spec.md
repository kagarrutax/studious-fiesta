# Feed Spec

## Objetivo
Proveer un listado cronológico de publicaciones, con timeline de seguidos, paginación, guardados y hashtags.

## Estado actual
Implementado (MVP + Fase 3 plan plataforma).

- `GET /api/posts` — feed global paginado (`items`, `next_cursor`, `limit`, `cursor`, `author_id`)
- `GET /api/feed` — posts de usuarios seguidos + propios
- Guardar/desguardar: `POST|DELETE /api/posts/{id}/save`
- Hashtags parseados al crear/editar; expuestos en `PostOut.hashtags`
- UI: `Feed.jsx` tabs Global / Siguiendo, “Cargar más”, composer con `#tags`
- `PostCard`: botón Guardar, hashtags clickeables → búsqueda

## Alcance
- Visualizar posts recientes (global).
- Timeline “Siguiendo”.
- Paginación por cursor.
- Guardar publicaciones.
- Hashtags en contenido.

## Fuera de alcance
- Algoritmo de recomendación.
- Compartir / reportar (Fase 3 avanzada del plan).
- Respuestas anidadas a comentarios (siguiente iteración Fase 3).

## Archivos involucrados
- `backend/app/api/posts.py`
- `backend/app/api/feed.py`
- `backend/app/models/social.py`
- `frontend/src/pages/Feed.jsx`
- `frontend/src/components/PostCard.jsx`
- `backend/tests/test_feed_social.py`

## Criterios de aceptación
- [x] El feed carga posts recientes con autor.
- [x] Requiere autenticación.
- [x] Paginación no rompe serialización JSON (`PostPage`).
- [x] Tab Siguiendo solo muestra red del usuario (+ propios).
- [x] Guardar persiste y se refleja en `saved_by_me`.
- [x] `#campus` se indexa y se muestra como enlace.

## Testing
- `pytest tests/test_posts.py tests/test_feed_social.py`

## Seguridad
- Endpoints con `Depends(get_current_user)`.
- `limit` acotado (1–50).

## Riesgos
- Clientes móviles antiguos que esperaban `list` en `/api/posts` (ya adaptados a `items`).
