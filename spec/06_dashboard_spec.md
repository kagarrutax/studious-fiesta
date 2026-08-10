# Dashboard Spec

## Objetivo
Proveer un resumen estadístico y panel de control para el usuario.

## Estado actual
Implementado. Ruta de backend `/api/stats` y vista en frontend.

## Alcance
- Mostrar estadísticas generales (número de posts, interacciones).

## Fuera de alcance
- Gráficos avanzados o reportes exportables.
- Administración global (rol de superadmin).

## Archivos involucrados
- `backend/app/routers/stats.py`
- `frontend/src/pages/Dashboard.jsx`

## Pasos
1. Consultar conteos agregados en base de datos.
2. Formatear como JSON.
3. Mostrar en tarjetas resumen en frontend.

## Criterios de aceptación
- El dashboard carga correctamente con las cifras actualizadas de la cuenta o globales.

## Testing
- Verificar que el endpoint `/stats` devuelve los campos requeridos con formato numérico.

## Seguridad
- Proteger endpoint con autenticación.

## Riesgos
- Consultas agregadas (COUNT) pueden ser lentas en tablas muy grandes sin indexación.
