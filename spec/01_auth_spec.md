# Auth Spec

## Objetivo
Gestionar el acceso y la identidad de los usuarios a través del registro y el inicio de sesión.

## Estado actual
Implementado. Rutas de backend (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) e interfaces de frontend funcionales.

## Alcance
- Registro de nuevos usuarios.
- Inicio de sesión y generación de JWT.
- Obtención de datos del usuario autenticado (`/me`).

## Fuera de alcance
- Recuperación de contraseñas.
- Autenticación con terceros (Google, GitHub, etc.).
- Verificación por correo electrónico.

## Archivos involucrados
- `backend/app/routers/auth.py`
- `frontend/src/pages/Login.jsx` (o similar)
- `frontend/src/pages/Register.jsx` (o similar)

## Pasos
1. Validar payload de registro/login.
2. Verificar existencia de usuario.
3. Hashear contraseña (registro) o comparar hash (login).
4. Generar y devolver token JWT.

## Criterios de aceptación
- Un usuario puede crear una cuenta.
- Un usuario puede iniciar sesión y recibir un token válido.
- La contraseña se almacena de forma segura (hash).
- Rutas protegidas bloquean el acceso sin token.

## Testing
- Pruebas unitarias sobre endpoints de registro y login (`pytest`).
- Verificación manual de redirección en frontend tras login.

## Seguridad
- Validar formato de email y longitud de contraseña.
- Hashear contraseña con bcrypt.
- Emitir JWT con expiración definida.

## Riesgos
- Exposición de token en el cliente si no se almacena adecuadamente.
- Ataques de fuerza bruta (sin rate limiting).
