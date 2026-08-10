# Arquitectura — Studious Party

**Tipo de red:** Red estudiantil / universitaria (comunidad de estudiantes)  
**Estilo de referencia:** Feed tipo Instagram/Facebook adaptado a vida universitaria  
**Última actualización:** Día 2

## Visión general

```
┌─────────────────┐     REST / JSON + JWT      ┌─────────────────┐     SQL      ┌──────────────┐
│  React (Vite)   │ ──────────────────────────▶│    FastAPI      │ ───────────▶│ SQLite / PG  │
│  :5173          │ ◀──────────────────────────│    :8000        │ ◀───────────│              │
└─────────────────┘                            └─────────────────┘              └──────────────┘
     Cliente                                         Servidor                      Persistencia
```

## Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Frontend | React 19 + Vite + React Router | UI, rutas, estado de auth |
| Backend | FastAPI + Pydantic | API REST, JWT, validación |
| BD | SQLAlchemy + SQLite (dev) / PostgreSQL (prod) | Usuarios, posts, likes, comentarios |

## Módulos backend

| Módulo | Contenido |
|--------|-----------|
| `app/core` | Configuración, seguridad JWT, hashing |
| `app/models` | Modelos SQLAlchemy (User, Post, Like, Comment, Follow) |
| `app/schemas` | Esquemas Pydantic (request/response) |
| `app/api` | Routers: auth, users, posts, stats, follows |
| `app/db` | Engine, Session, Base |

## Módulos frontend

| Módulo | Contenido |
|--------|-----------|
| `src/pages` | Home, Login, Register, Feed, Profile, Dashboard |
| `src/components` | Layout, PostCard, CommentList, forms |
| `src/services` | Cliente axios (`api.js`) |
| `src/context` | `AuthContext` (token / sesión) |

## Autenticación (JWT)

| Campo | Valor |
|-------|-------|
| Algoritmo | HS256 |
| Payload | `sub` (user id), `exp` |
| Expiración | 60 minutos (configurable) |
| Entrega | `{ "access_token": "...", "token_type": "bearer" }` |
| Uso | Header `Authorization: Bearer <token>` |
| Cliente | `localStorage` clave `token` |

## Modelo entidad-relación

```
┌──────────────┐       1:N        ┌────────────────┐
│    User      │─────────────────▶│     Post       │
│──────────────│                  │────────────────│
│ id (PK)      │                  │ id (PK)        │
│ username     │                  │ content        │
│ email        │                  │ image_url      │
│ password_hash│                  │ author_id (FK) │
│ avatar_url   │                  │ created_at     │
│ bio          │                  └───────┬────────┘
│ created_at   │                          │
└──────┬───────┘              ┌───────────┼───────────┐
       │                      │ 1:N       │ 1:N       │
       │               ┌──────▼─────┐ ┌───▼──────────┐
       │               │    Like    │ │   Comment    │
       │               │────────────│ │──────────────│
       ├──────────────▶│ user_id FK │ │ user_id FK   │
       │               │ post_id FK │ │ post_id FK   │
       │               │ UNIQUE(u,p)│ │ content      │
       │               └────────────┘ │ created_at   │
       │                              └──────────────┘
       │               ┌──────────────┐
       │               │    Follow    │
       │               │──────────────│
       └──────────────▶│ user_id FK   │ (follower)
                       │ followed_idFK│ (following)
                       │ UNIQUE(u,f)  │
                       └──────────────┘
```

## Endpoints definitivos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | No | Info API |
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | Sí | Usuario actual |
| GET | `/api/users/{id}` | Opcional | Perfil público (con counts de follow) |
| POST | `/api/users/{id}/follow` | Sí | Seguir a un usuario |
| DELETE | `/api/users/{id}/follow` | Sí | Dejar de seguir a un usuario |
| GET | `/api/users/{id}/followers`| Opcional | Listar seguidores |
| GET | `/api/posts` | Sí | Feed |
| POST | `/api/posts` | Sí | Crear publicación |
| GET | `/api/posts/{id}` | Sí | Detalle de post |
| POST | `/api/posts/{id}/like` | Sí | Toggle like |
| GET | `/api/posts/{id}/comments` | Sí | Listar comentarios |
| POST | `/api/posts/{id}/comments` | Sí | Crear comentario |
| GET | `/api/stats` | Sí | Dashboard (totales) |

## Wireframes (páginas)

Ver descripciones en [`docs/wireframes/README.md`](./wireframes/README.md).

| Pantalla | Ruta frontend | Contenido principal |
|----------|---------------|---------------------|
| Home | `/` | Marca + estado API |
| Login | `/login` | Formulario email/password |
| Registro | `/register` | username, email, password |
| Feed | `/feed` | Lista de posts + crear post |
| Perfil | `/users/:id` | Bio, avatar, posts del usuario |
| Dashboard | `/dashboard` | Totales (users, posts, likes) |

## Decisiones de diseño

1. **Tipo:** red estudiantil (Studious Party) — posts de texto + imagen opcional.
2. **Likes y comentarios:** ambos (el enunciado pide al menos uno).
3. **BD local:** SQLite; producción: PostgreSQL si la plataforma lo permite.
4. **Imágenes:** URL o archivo local en `uploads/` (iteración Día 4).
5. **Estilos:** CSS propio por ahora; Tailwind opcional más adelante.
