# Plan — App móvil Studious Party (Expo + MVP)

**Stack:** Expo (React Native) + JavaScript/JSX  
**API:** `https://studious-party-api.onrender.com` (misma que la web)  
**Carpeta:** [`mobile/`](../mobile/)

## Alcance MVP

Incluye: login/registro, feed, crear post con imagen, likes, comentarios, perfil propio/ajeno.  
Fuera de v1: búsqueda, follow, dashboard, editar/borrar, push, stores.

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
- [x] Cold start móvil: `withRetry` / wake `/api/health` en login, register y feed (Adrian — Sprint 2)

## Sprint 2 (equipo)

Reparto en [`equipo-features.md`](./equipo-features.md) y PDF [`Reparto_Sprint2_Mejoras_UX.pdf`](./Reparto_Sprint2_Mejoras_UX.pdf).

| Persona | Entrega |
|---------|---------|
| Adrian | Cold start **móvil** (hecho en código; redeploy/APK al cerrar sprint) |
| Meilyn | Cold start **web** + QA |
| Jessica | Editar / borrar posts |
| Yadira | Búsqueda móvil |
| Yokabeth | Follow móvil |

Fuera de v1 pendiente de otras personas: búsqueda, follow, editar/borrar, push, stores.
