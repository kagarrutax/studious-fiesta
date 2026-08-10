# Validate Dashboard Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md`.
2. Lee `spec/06_dashboard_spec.md`.
3. Analiza el código de `/api/stats` y `Dashboard.jsx`.
4. Verifica si las métricas devueltas por la API coinciden con los requerimientos (totales de usuario).
5. Determina si falta la integración de la API con los componentes visuales.
6. Implementa lo que falte, priorizando consultas eficientes en la base de datos.
7. Ejecuta tests del endpoint `/stats`. Detente si hay errores 500.
8. Realiza revisión de seguridad asegurando que un usuario no pueda ver las estadísticas de otro de manera no autorizada.
9. Valida los criterios de aceptación: la data mostrada debe ser coherente.
10. Elabora reporte de cambios.
