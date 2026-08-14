# Validate Resources Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md` y `spec/12_resources_spec.md`.
2. Revisa `backend/app/api/resources.py`, modelos y UI de recursos.
3. Compara con criterios (upload, download count, rating, subjects).
4. Implementa faltantes; no rompas media/posts existentes.
5. Ejecuta `pytest tests/test_resources.py` (`skill/run_tests.md`).
6. Ejecuta `skill/security_review.md` (MIME, tamaño, JWT).
7. Reporta al orquestador.
