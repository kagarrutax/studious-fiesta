# Posts Spec

## Objetivo
Permitir crear, editar, eliminar y visualizar publicaciones (texto e imagen).

## Estado actual
Implementado.

- Crear JSON `POST /api/posts` y con imagen `POST /api/posts/upload`
- Obtener `GET /api/posts/{id}`
- Editar `PATCH|PUT /api/posts/{id}` (solo autor)
- Eliminar `DELETE /api/posts/{id}` (solo autor)
- Likes y comentarios en el mismo router
- Hashtags sincronizados al crear/editar

## Alcance
- Creación de publicaciones de texto.
- Adjuntar imágenes (`/api/posts/upload` → `stored_media`).
- Edición y borrado por el autor.
- Visualización individual.

## Fuera de alcance
- Videos o múltiples imágenes por post.
- Edición/borrado de comentarios.

## Archivos involucrados
- `backend/app/api/posts.py`
- `backend/app/schemas/post.py`
- `frontend/src/pages/Feed.jsx`
- `frontend/src/components/PostCard.jsx`
- `backend/tests/test_posts.py`

## Criterios de aceptación
- [x] Usuarios autenticados pueden crear posts.
- [x] Posts visibles con nombre del autor.
- [x] Solo el autor edita/borra.
- [x] Hashtags se extraen del contenido.

## Testing
- `pytest tests/test_posts.py`

## Seguridad
- JWT obligatorio.
- Validar tipo/tamaño de upload.
- 403 si otro usuario edita/borra.

## Riesgos
- Disco efímero en Render para uploads locales (mitigado parcialmente con `stored_media`).
