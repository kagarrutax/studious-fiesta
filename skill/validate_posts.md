# Validate Posts Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md`.
2. Lee `spec/03_posts_spec.md`.
3. Analiza el código en `backend/app/routers/posts.py` y los componentes de creación de posts del frontend.
4. Verifica si el backend soporta carga de texto e imágenes, y si el frontend lo permite.
5. Identifica las brechas contra los criterios de aceptación de la spec.
6. Implementa ajustes necesarios (ej. manejo de FormData, validaciones de archivo).
7. Ejecuta los tests de subida y creación. Detente en caso de falla.
8. Pasa la revisión de seguridad asegurando que los archivos subidos estén restringidos (tipo/tamaño).
9. Valida los criterios de aceptación finales.
10. Documenta los resultados.
