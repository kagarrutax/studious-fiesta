# Search Spec — Fase 11 / Sprint S8

## Objetivo
Un buscador para toda la plataforma: users, posts, communities, events, resources.

## Estado actual
Implementado para users + posts. Ampliar tipos y tabs.

## Alcance
- `GET /api/search?q=&type=all|users|posts|communities|events|resources`
- Filtro opcional `subject_id` (recursos).
- Respuesta unificada con listas por tipo (vacías si no aplican).
- UI `/search` con tabs.
- JWT; `q` 1–100 tras trim; `ilike` parametrizado.

## Fuera de alcance
- Elasticsearch / IA.
- Historial de búsquedas.
- Búsqueda por imagen.

## Archivos involucrados
- `backend/app/api/search.py`
- `backend/app/schemas/search.py`
- `frontend/src/pages/Search.jsx`
- `backend/tests/test_search.py`

## Criterios de aceptación
- [x] Users y posts siguen funcionando (compat).
- [x] Una query encuentra cada tipo poblado.
- [x] `type` inválido → 422.
- [x] Vacío/espacios → 400.
- [x] Sin `password_hash` ni `email` en users.

## Testing
- `pytest tests/test_search.py`

## Seguridad
- JWT; ORM `ilike`; límite 20 por tipo.

## Riesgos
- `ilike` sin pg_trgm en datasets grandes (aceptable en MVP).

## Estado actual
Implementado (Fase 11 / Sprint S8).
