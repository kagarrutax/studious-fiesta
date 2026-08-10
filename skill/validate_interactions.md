# Validate Interactions Skill

## Instrucciones para el Agente IA

1. Lee `spec/00_project_spec.md`.
2. Lee `spec/05_interactions_spec.md`.
3. Analiza endpoints de likes y comentarios en backend y sus equivalentes UI en frontend.
4. Identifica si el toggle de likes y la agregación de comentarios funcionan sin errores.
5. Determina si faltan validaciones, como evitar múltiples likes por el mismo usuario.
6. Implementa correcciones para cumplir exactamente la spec.
7. Ejecuta tests de inserción/borrado de interacciones. Si fallan, detente.
8. Revisa la seguridad: comprueba que las interacciones usen el ID del token JWT y no parámetros manipulables del body.
9. Valida que la UI se actualice conforme a los criterios de aceptación.
10. Documenta el resumen de cambios o el estado exitoso.
