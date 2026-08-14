# Validate Messages Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md` y `spec/14_messages_spec.md`.
2. Revisa `backend/app/api/messages.py`, `ws.py`, modelos y UI de chat.
3. Compara con criterios (1:1, WS live, read, 403).
4. Implementa faltantes; reutiliza `services/realtime.py`.
5. Ejecuta `pytest tests/test_messages.py` (`skill/run_tests.md`).
6. Ejecuta `skill/security_review.md`.
7. Reporta al orquestador.
