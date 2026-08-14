# Validate Communities Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md` y `spec/11_communities_spec.md`.
2. Revisa `backend/app/api/communities.py`, modelos y UI de comunidades.
3. Identifica faltantes vs criterios (join, posts, 403 no-miembro, feed global).
4. Implementa lo necesario sin romper posts globales.
5. Ejecuta `pytest tests/test_communities.py` y suite si aplica (`skill/run_tests.md`).
6. Ejecuta `skill/security_review.md`.
7. Marca criterios y reporta al orquestador.
