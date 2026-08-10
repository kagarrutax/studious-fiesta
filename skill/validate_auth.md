# Validate Auth Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md` para contexto.
2. Lee `spec/01_auth_spec.md`.
3. Analiza el código actual en:
   - `backend/app/routers/auth.py`
   - Vistas de React relacionadas al Login y Registro.
4. Identifica si el registro, login y `/me` funcionan según lo esperado.
5. Determina si falta algún criterio de aceptación de la spec.
6. Si falta algo, propón la implementación estrictamente necesaria.
7. Ejecuta tests del backend (`pytest`) relacionados a auth. Si fallan, detente.
8. Ejecuta revisión de seguridad evaluando hash de contraseñas y validación de tokens.
9. Verifica todos los criterios de aceptación listados en `spec/01_auth_spec.md`.
10. Documenta los hallazgos y cambios (si aplica).
