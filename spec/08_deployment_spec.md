# Deployment Spec

## Objetivo
Publicar la aplicación en un entorno accesible desde internet.

## Estado actual
Pendiente (según documentación actual del repositorio, Fase 4). Configuración base lista en `render.yaml` y `vercel.json`.

## Alcance
- Despliegue de Backend en Render (u otro PAAS).
- Despliegue de Frontend en Vercel.
- Migración a PostgreSQL (recomendado para producción).

## Fuera de alcance
- CI/CD complejos con pipelines extensos, más allá de la integración estándar de Vercel/Render.
- Balanceo de carga manual.

## Archivos involucrados
- `backend/render.yaml`
- `frontend/vercel.json`
- Variables de entorno de producción.

## Pasos
1. Configurar base de datos PostgreSQL en Render/Supabase.
2. Desplegar backend configurando variables de entorno de BD y JWT.
3. Desplegar frontend en Vercel apuntando `VITE_API_URL` a la URL del backend.

## Criterios de aceptación
- Backend responde en URL pública HTTPS.
- Frontend sirve la app estática y conecta sin errores de CORS al backend.

## Testing
- Prueba funcional completa en entorno de producción (E2E).

## Seguridad
- Asegurar que `.env` no se sube al repositorio.
- Cambiar SECRET_KEY de JWT en producción.
- Configurar orígenes CORS permitidos en backend de forma estricta.

## Riesgos
- Desconexiones entre servicios si hay fallos en variables de entorno.
- Pérdida de base de datos efímera si se mantiene SQLite en producción.
