# Project Orchestrator Skill

Esta skill orquesta la ejecución del desarrollo basándose en Spec-As-Source.

## Instrucciones para el Agente IA

1. **Leer la Especificación Principal**: Debes comenzar leyendo `spec/00_project_spec.md` para entender el contexto global del proyecto.
2. **Seleccionar Skill/Spec Específica**: Determinar qué funcionalidad requiere validación o implementación según la solicitud del usuario.
3. **Analizar el Código**: Buscar en `backend/` y `frontend/` el código existente para esa funcionalidad.
4. **Identificar Estado**: Comparar el código existente con lo descrito en la especificación (`spec/XX_*.md`).
5. **Determinar Faltantes**: Enumerar qué partes de la especificación aún no están implementadas.
6. **Implementar**: Generar y modificar únicamente el código necesario para cumplir la spec, sin afectar lo que ya funciona.
7. **Ejecutar Tests**: Llamar a `skill/run_tests.md` para verificar cambios.
8. **Revisión de Seguridad**: Llamar a `skill/security_review.md`.
9. **Detenerse si fallan**: Si los tests o la seguridad fallan, detener y reportar al usuario.
10. **Validar Criterios**: Comprobar uno por uno los criterios de aceptación.
11. **Documentar**: Entregar reporte de los cambios realizados.
