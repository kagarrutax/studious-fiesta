# Profile Spec

## Objetivo
Visualizar y gestionar la información pública de los usuarios registrados.

## Estado actual
Implementado. Ruta de backend (`/api/users/{id}`) y vista de frontend.

## Alcance
- Visualización de datos de perfil (username, avatar, bio).
- Listado de posts del usuario.

## Fuera de alcance
- Edición de perfil compleja.
- Privacidad granular de cuenta.

## Archivos involucrados
- `backend/app/routers/users.py`
- `frontend/src/pages/Profile.jsx` (o similar)

## Pasos
1. Obtener ID del usuario desde la ruta.
2. Consultar detalles del usuario en base de datos.
3. Renderizar vista de perfil en frontend.

## Criterios de aceptación
- El perfil muestra información correcta del usuario.
- Si el usuario no existe, devuelve error 404.

## Testing
- Validar que `/api/users/{id}` retorna 200 con datos válidos o 404 si es inválido.

## Seguridad
- Proteger información sensible (no enviar password_hash ni email si no corresponde).
- Validar permisos de visualización.

## Riesgos
- Exposición accidental de datos privados del usuario.
