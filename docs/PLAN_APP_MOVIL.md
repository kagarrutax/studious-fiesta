# Plan — App móvil Studious Party (Expo + MVP)

**Stack:** Expo (React Native) + JavaScript/JSX  
**API:** `https://studious-party-api.onrender.com` (misma que la web)  
**Carpeta:** [`mobile/`](../mobile/)

## Alcance MVP

Incluye: login/registro, feed, crear post con imagen, likes, comentarios, perfil propio/ajeno, búsqueda, follow, editar/borrar posts, cold start retry.

Fuera de alcance: push notifications, App Store/Play Store producción.

## Arquitectura

```
Expo App ──REST/JWT──▶ FastAPI (Render) ──SQL──▶ Supabase Postgres
                │
                └── GET /api/media/{id} (imágenes persistentes)
```

- Token JWT en **SecureStore** (o `localStorage` en web).
- Cliente axios en [`mobile/src/services/api.js`](../mobile/src/services/api.js).
- URLs de media en [`mobile/src/utils/media.js`](../mobile/src/utils/media.js).

## Pantallas

| Ruta | Función |
|------|---------|
| `(auth)/` | Welcome |
| `(auth)/login` | Login |
| `(auth)/register` | Registro |
| `(app)/feed` | Feed + interacciones |
| `(app)/search` | Buscar usuarios y posts |
| `(app)/compose` | Crear post + imagen |
| `(app)/profile` | Perfil propio + logout |
| `(app)/profile/[id]` | Perfil de otro usuario |

## Cómo correr

Ver [`mobile/README.md`](../mobile/README.md).

## Criterios de aceptación

- [x] Scaffold Expo + AuthContext + SecureStore
- [x] Login / registro contra API
- [x] Feed con likes y comentarios
- [x] Compose con `expo-image-picker` → `POST /api/posts/upload`
- [x] Perfil propio y ajeno
- [x] Documentación en repo
- [x] Perfil EAS `preview` para APK (`mobile/eas.json`)
- [x] Cold start móvil: `withRetry` / wake `/api/health` en login, register y feed
- [x] Cold start web (login/register/feed/dashboard)
- [x] Editar / borrar posts (API PATCH/DELETE + web + móvil)
- [x] Búsqueda móvil (`GET /api/search`)
- [x] Follow móvil + contadores

## Sprint 2 (cerrado en este repo)

El equipo no continuó las ramas; Adrian implementó las 3 mejoras en `main`/rama actual.

| Entrega | Estado |
|---------|--------|
| Cold start web + móvil | Hecho |
| Editar / borrar posts | Hecho |
| Búsqueda + follow móvil | Hecho |
