# Resources Spec — Fase 5

## Objetivo
Biblioteca académica: subir materiales (PDF/Office/ZIP/imagen), listar por materia, descargar y valorar 1–5.

## Estado actual
Pendiente de implementación.

## Alcance
- Tablas `subjects`, `resources`, `resource_ratings`.
- Seed de materias básicas al arrancar (SQLite/Postgres).
- Upload autenticado vía `stored_media` (misma persistencia que avatares; límites MIME/tamaño).
- Listado con filtro `subject_id` / `q` / `category`.
- Descarga autenticada que incrementa `downloads_count`.
- Valoración 1–5 (upsert por usuario) y `avg_rating`.
- UI `/resources` + `/resources/:id`.

## Fuera de alcance
- Supabase Storage / S3 dedicado (siguiente harden; MVP usa `stored_media`).
- Preview in-browser de Office.
- Moderación / reportes de recursos.

## Archivos involucrados
- `backend/app/models/resource.py`
- `backend/app/api/resources.py`
- `backend/app/schemas/resource.py`
- `frontend/src/pages/Resources.jsx`, `ResourceDetail.jsx`
- `supabase/migrations/20260814050000_resources.sql`
- `backend/tests/test_resources.py`

## Criterios de aceptación
- [x] Usuario autenticado sube un PDF (u otro tipo permitido) con título y materia.
- [x] Otro usuario lista, descarga (contador +1) y valora.
- [x] `GET /subjects` devuelve catálogo.
- [x] Tipos/tamaño inválidos → 400.
- [x] Rutas requieren JWT.

## Testing
- `pytest tests/test_resources.py`

## Seguridad
- JWT obligatorio.
- Whitelist MIME + tope de bytes.
- Solo dueño puede borrar (si se expone DELETE).
- No servir bytes sin auth en download.

## Riesgos
- Archivos grandes en `LargeBinary`/Postgres; tope MVP 15 MB.

## Estado actual
Implementado (Fase 5 / Sprint S5). Storage MVP = `stored_media` (persistente en Postgres/Supabase).
