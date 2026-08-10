# Skill — Implementar búsqueda

## Propósito
Guiar al agente IA para implementar correctamente la función de búsqueda cumpliendo la regla Spec-As-Source y los estándares de seguridad de Studious Party.

## Spec relacionada
`spec/09_search_spec.md`

## Precondiciones
El modelo de datos y la arquitectura frontend/backend existen y están funcionales.

## Archivos permitidos
- `backend/app/api/search.py` (nuevo)
- `backend/app/api/router.py` (modificar)
- `backend/app/schemas/search.py` (nuevo)
- `backend/tests/test_search.py` (nuevo)
- `frontend/src/pages/Search.jsx` (nuevo)
- `frontend/src/components/Navbar.jsx` (modificar)
- `frontend/src/App.jsx` (modificar)
- `frontend/src/services/api.js` (modificar, si se declaran métodos explícitos)

## Archivos que no deben modificarse
- Los modelos base `user.py` y `post.py`.
- Base de datos `.db`.
- Configuraciones de despliegue y root.

## Etapa 1 — Análisis
Confirmar los modelos y schemas que se van a retornar para no filtrar el `password_hash`.

## Etapa 2 — Backend
Implementar endpoint `GET /api/search?q=...` utilizando `ilike` en SQLAlchemy con un `limit(20)`.

## Etapa 3 — Testing backend
Crear `tests/test_search.py` y correr la suite para validar el comportamiento en backend.

## Etapa 4 — Frontend
Crear `Search.jsx` reusando `PostCard` y añadiendo entrada en `App.jsx` y `Navbar.jsx`.

## Etapa 5 — Testing funcional
Verificar flujos desde UI (Login -> Buscar -> Abrir perfil/post).

## Etapa 6 — Seguridad
Verificar la ausencia total de datos confidenciales en los schemas de respuesta de Search.

## Etapa 7 — Validación
Cruzar con criterios de aceptación en la spec.

## Condiciones de detención
Si un test falla:
DETENER -> ANALIZAR -> CORREGIR -> VOLVER A PROBAR.
