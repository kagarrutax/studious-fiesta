# Mobile Parity Spec — Expo

## Objetivo

Igualar en Android/Expo las funciones académicas y sociales disponibles en web, incluyendo actualización guiada del APK al abrir.

## Alcance

- Navegación: Feed, Explorar, Crear, Mensajes y Perfil.
- Feed global/siguiendo, guardados, hashtags, compartir y reportar.
- Perfil académico editable, avatar/portada, follows, XP e insignias.
- Comunidades, recursos y eventos.
- Chat y avisos en tiempo real mediante WebSocket.
- Dashboard y búsqueda global por tipo.
- Aviso de nueva versión con botón **Actualizar**.

## Actualización

- `GET /api/mobile/version` devuelve `version`, `version_code`, `apk_url` y `mandatory`.
- Solo los builds nativos comparan `version_code`; Expo Go y web no bloquean.
- Si hay una versión superior, se muestra un modal al iniciar.
- **Actualizar** abre `apk_url`; **Más tarde** solo existe cuando `mandatory=false`.

## Criterios de aceptación

- [x] La sesión JWT se conserva y todas las rutas privadas están protegidas.
- [x] Chat, presencia, typing, leídos y badge de avisos se actualizan sin recargar.
- [x] Los dominios académicos permiten sus acciones principales.
- [x] Feed/perfil/búsqueda/dashboard muestran la misma información esencial que web.
- [x] Una versión remota superior muestra el modal de actualización.
- [x] Loading, vacío y error existen en cada listado.
- [x] `npx expo export --platform web` y chequeos de TypeScript terminan sin errores.

## Seguridad

- JWT solo en SecureStore (salvo web de desarrollo).
- No registrar token, contraseña ni respuestas sensibles.
- Validar MIME/tamaño antes de uploads y mostrar errores del API.
- Cerrar WebSockets al hacer logout.

## Testing

Smoke Android: abrir → actualizar (si aplica) → login → feed → perfil → comunidad → recurso → evento → chat → aviso.
