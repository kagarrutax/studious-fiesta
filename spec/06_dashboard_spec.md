# Dashboard Spec — Fase 9 / Sprint S8

## Objetivo
Panel útil: métricas personales, actividad reciente, eventos, avisos y atajos.

## Estado actual
Implementado (globales + eventos). Pendiente: bloque personal coherente.

## Alcance
- `GET /api/stats` con totales globales **y** `me` (posts, follows, comunidades, recursos, avisos no leídos).
- Widgets: avisos recientes, mis comunidades, recursos recientes, próximos eventos.
- Acceso desde menú perfil (`/dashboard`).

## Fuera de alcance
- Gráficos exportables.
- Superadmin.
- Ranking XP (Fase 10).

## Archivos involucrados
- `backend/app/api/stats.py`
- `frontend/src/pages/Dashboard.jsx`
- `backend/tests/test_stats.py`

## Criterios de aceptación
- [x] El panel carga con JWT.
- [x] `me` refleja datos del usuario autenticado, no de otros.
- [x] Empty states si no hay eventos/comunidades/avisos.
- [x] No se expone `password_hash`.

## Testing
- `pytest tests/test_stats.py`

## Seguridad
- `Depends(get_current_user)`.
- Stats personales solo del token.

## Riesgos
- COUNT en tablas grandes; límites pequeños (5) en listados recientes.

## Estado actual
Implementado (Fase 9 / Sprint S8).
