# Posts Spec

## Objetivo
Permitir a los usuarios crear y visualizar publicaciones en la plataforma.

## Estado actual
Implementado. Rutas de backend para crear, subir imagen y obtener post por ID.

## Alcance
- Creación de publicaciones de texto.
- Adjuntar imágenes a publicaciones (`/api/posts/upload`).
- Visualización individual de una publicación (`/api/posts/{id}`).

## Fuera de alcance
- Edición de publicaciones.
- Borrado de publicaciones.
- Soporte para videos o múltiples imágenes.

## Archivos involucrados
- `backend/app/routers/posts.py`
- `frontend/src/components/PostForm.jsx` (o similar)

## Pasos
1. Recibir datos del post (texto/imagen).
2. Asociar post al usuario autenticado.
3. Guardar en base de datos.
4. Retornar datos del nuevo post.

## Criterios de aceptación
- Usuarios autenticados pueden crear posts.
- Los posts creados son visibles con el nombre del autor.

## Testing
- Pruebas de creación de post con token válido.
- Pruebas de subida de archivos (mockeado o temporal).

## Seguridad
- Validar tamaño y tipo de archivo en `/upload`.
- Requerir JWT válido para creación.

## Riesgos
- Inyección de contenido malicioso.
- Almacenamiento local de archivos sin control de capacidad (`/uploads`).
