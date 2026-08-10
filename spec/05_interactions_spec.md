# Interactions Spec

## Objetivo
Fomentar el engagement de los usuarios a través de likes y comentarios en las publicaciones.

## Estado actual
Implementado. Rutas de backend para toggle like y listar/crear comentarios.

## Alcance
- Dar y quitar "Me gusta" a publicaciones.
- Agregar comentarios de texto a publicaciones.
- Visualizar comentarios asociados a un post.

## Fuera de alcance
- Respuestas anidadas a comentarios.
- Edición/Borrado de comentarios.

## Archivos involucrados
- `backend/app/routers/interactions.py` (o dentro de posts.py)
- `frontend/src/components/PostActions.jsx` (o similar)

## Pasos
1. Recibir solicitud de like/comentario con el ID del post.
2. Validar autenticación.
3. Registrar interacción en base de datos asociada al usuario y post.

## Criterios de aceptación
- Usuario puede dar y quitar like a un post.
- Usuario puede comentar en un post.
- El conteo de likes y los comentarios se actualizan.

## Testing
- Pruebas unitarias comprobando la unicidad del like por usuario y post.

## Seguridad
- Validar existencia del post antes de registrar interacción.
- Validar JWT y asociar interacción al token decodificado, no a un parámetro.

## Riesgos
- Múltiples clicks rápidos pueden generar inconsistencias (race conditions en SQLite).
