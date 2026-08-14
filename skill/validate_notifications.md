# Validate Notifications Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md` y `spec/10_notifications_spec.md`.
2. Compara con `backend/app/api/notifications.py`, `ws.py`, `services/notify.py`, `services/realtime.py`.
3. Verifica hooks en like / comment / follow (sin auto-notificar).
4. Revisa UI: `NotificationsContext`, `Notifications.jsx`, badge en `Navbar.jsx`.
5. Implementa faltantes según la spec y el plan (Fase 8).
6. Ejecuta `pytest tests/test_notifications.py` y el suite si aplica (`skill/run_tests.md`).
7. Ejecuta `skill/security_review.md` (JWT REST, auth WS, sin secretos en respuestas).
8. Valida criterios de aceptación uno a uno.
9. Reporta el resultado al orquestador.
