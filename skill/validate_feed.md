# Validate Feed Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md`.
2. Lee `spec/04_feed_spec.md`.
3. Analiza el código en `backend/app/routers/posts.py` (método de listado) y `frontend/src/pages/Feed.jsx`.
4. Evalúa cómo se obtienen, ordenan y muestran los posts.
5. Identifica faltantes según el alcance y criterios de la spec.
6. Implementa paginación o ajustes de renderizado si la spec lo requiere o para optimización.
7. Ejecuta tests del listado. Detente si se rompe la serialización JSON.
8. Ejecuta revisión de seguridad verificando si el endpoint requiere autenticación correctamente.
9. Asegura el cumplimiento de los criterios de aceptación.
10. Escribe los cambios documentados en un reporte final.
