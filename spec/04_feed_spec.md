# Feed Spec

## Objetivo
Proveer un listado cronológico de las publicaciones de la plataforma.

## Estado actual
Implementado. Ruta de backend (`/api/posts`) y vista de feed principal en frontend.

## Alcance
- Visualizar todos los posts recientes.
- Paginación o listado limitado (si aplica).

## Fuera de alcance
- Algoritmo de recomendación.
- Filtrado complejo de posts.

## Archivos involucrados
- `backend/app/routers/posts.py` (método GET)
- `frontend/src/pages/Feed.jsx` (o similar)

## Pasos
1. Consultar publicaciones ordenadas descendentemente por fecha.
2. Incluir información básica del autor en cada post.
3. Renderizar listado en frontend.

## Criterios de aceptación
- El feed carga correctamente los posts recientes.
- Se muestran autores y contenido de cada post.

## Testing
- Pruebas de integración verificando respuesta JSON del feed.

## Seguridad
- Protección de ruta de feed si es privada (requiere auth).

## Riesgos
- Sobrecarga de base de datos si hay muchos posts sin paginación eficiente.
