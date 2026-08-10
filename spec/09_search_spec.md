# Spec — Búsqueda de usuarios y publicaciones

## Objetivo

Permitir que un usuario de Studious Party pueda realizar búsquedas
desde la aplicación y encontrar usuarios y publicaciones.

## Estado actual

Actualmente la aplicación no cuenta con ninguna funcionalidad de búsqueda de texto implementada. Existen modelos de `User` y `Post` bien definidos en SQLAlchemy (`backend/app/models/`). En frontend, la navegación (`Navbar.jsx`) no posee un campo ni enlace de búsqueda. La aplicación soporta lista de posts en `/api/posts` pero sin filtrado textual.

## Alcance

La búsqueda incluirá:
- usuarios (búsqueda sobre el campo `username`);
- publicaciones de texto (búsqueda sobre el campo `content`).

Debe existir conceptualmente:
GET /api/search?q=texto

La ruta exacta será `/api/search` y se incluirá en el `APIRouter` principal.

## Fuera de alcance

NO implementar:
- búsqueda mediante inteligencia artificial;
- Elasticsearch;
- historial de búsquedas;
- recomendaciones;
- filtros avanzados;
- búsqueda por imágenes;
- hashtags;
- búsqueda en tiempo real compleja.

## Backend

- **Endpoint:** `GET /api/search` en un nuevo archivo `backend/app/api/search.py` o directamente.
- **Parámetro:** `q` (string, validado, mínimo 1 caracter si se ignoran espacios).
- **Validaciones:** `q` no puede estar vacío (trim() en backend).
- **Estructura de respuesta:**
  ```json
  {
      "users": [...],
      "posts": [...]
  }
  ```
- **Límite de resultados:** Máximo 20 usuarios y 20 posts por respuesta para evitar saturar base de datos.
- **Campos devueltos (User):** `id`, `username`, `avatar_url`, `bio`, `created_at`.
- **Campos devueltos (Post):** los de `PostOut` (con `id`, `content`, `author`, `likes_count`, etc.).

## Frontend

- **Página Search:** `frontend/src/pages/Search.jsx` renderizada en la ruta `/search`.
- **Campo de búsqueda:** input type="text" con botón, o debounced input.
- **Resultados de usuarios:** Lista de usuarios (avatar + nombre).
- **Resultados de publicaciones:** Uso de `PostCard` existente.
- **Estados:** Loading, Errores (toast/mensaje), Resultados vacíos ("No se encontraron resultados").

## Navegación

Añadir un enlace "Buscar" o un icono en `Navbar.jsx` que dirija a `/search`. Se mantendrá el responsive.

## Criterios de aceptación

Como mínimo:
- buscar usuario existente;
- buscar publicación existente;
- mostrar resultados correctamente;
- manejar búsquedas sin resultados;
- impedir consultas vacías;
- funcionar correctamente en móvil;
- no romper funcionalidades existentes.

## Testing

Backend tests en `tests/test_search.py`:
- usuario existente;
- usuario inexistente;
- publicación existente;
- publicación inexistente;
- consulta vacía;
- consulta con espacios;
- coincidencias múltiples;
- estructura de respuesta.

## Seguridad

- **Validación de entrada:** `q` limitado en longitud (ej: max 100 caracteres) y trim.
- **Protección contra consultas inseguras:** Uso de funciones ORM `ilike` paramétricas en SQLAlchemy.
- **Datos públicos permitidos:** Sólo `UserPublic` y `PostOut`.
- **Datos que nunca deben devolverse:** `password_hash`, `email` (según se necesite proteger, al menos no passwords).
- **Manejo de errores:** Capturar errores 500 y devolver un mensaje genérico sin trazas.

## Riesgos y supuestos

- Búsqueda `ilike` puede ser ineficiente sin un índice Full-Text adecuado si la base de datos crece, pero es aceptable para esta etapa en SQLite/PostgreSQL básico.
- Conflictos en imports circulares si se cruzan dependencias de posts y users, aunque los schemas ya están aislados.
