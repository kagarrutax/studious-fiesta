# Validate Deployment Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md`.
2. Lee `spec/08_deployment_spec.md`.
3. Analiza `backend/render.yaml` y `frontend/vercel.json`.
4. Identifica si faltan variables de entorno necesarias (ej. BASE_URL de la DB).
5. Determina si el frontend tiene la directiva para redirigir tráfico no encontrado al index.html (SPA fallback).
6. Implementa cambios de configuración en los archivos sin romper nada local.
7. Ejecuta simulaciones de build local (`npm run build` en frontend). Detente si falla.
8. Revisa seguridad: que el archivo yaml o json no tengan tokens fijos (hardcoded).
9. Valida los criterios de aceptación (archivos configurados, build exitoso).
10. Elabora reporte de preparación para despliegue.
