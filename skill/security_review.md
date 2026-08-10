# Security Review Skill

## Instrucciones para el Agente IA

1. Escanea las implementaciones de Pydantic para validar entradas.
2. Verifica en routers (`backend/app/routers/`) que exista protección de dependencias (`Depends(get_current_user)`).
3. Asegura que ninguna ruta devuelva hashes de contraseñas u otra data sensible que el frontend no deba exponer.
4. Verifica que `backend/.env` (si existe en tu contexto) no contenga claves quemadas en código y esté ignorado en git.
5. Si la seguridad está comprometida, DETENTE e implementa correcciones.
6. Reporta el estado de seguridad al orquestador.
