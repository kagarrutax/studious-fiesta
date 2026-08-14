# Plan de implementación — Studious Party (plataforma académica)

**Documento:** hoja de ruta real de evolución del MVP actual → red social académica.  
**Stack actual:** React/Vite + Tailwind · FastAPI + SQLAlchemy · Expo · Postgres (Supabase) / SQLite local · Vercel + Render.  
**Producción hoy:** https://studious-party.vercel.app · https://studious-party-api.onrender.com  

**Regla de oro:** no construir todo de una vez. Cada fase = PR pequeño, testeable, mergeable. Primero lo esencial; lo avanzado después.

---

## 0. Estado actual (punto de partida)

### Ya existe (reutilizar)

| Área | Qué hay |
|------|---------|
| Auth | Registro, login JWT, logout, `GET/PATCH /auth/me`, avatar |
| Feed | Crear post (texto/imagen), editar, borrar, likes, comentarios |
| Perfil | Bio, avatar, posts del usuario |
| Social | Seguir / dejar de seguir, lista de seguidores, contadores |
| Búsqueda | Usuarios + posts (`GET /api/search`) |
| Panel | Totales + posts/usuarios recientes |
| UX | Toasts + centro de avisos **solo en cliente** |
| Media | `stored_media` + `/api/media/{id}` |
| Móvil | Auth, feed, compose, search, follow, edit/delete |

### Falta vs objetivo

Recuperación de contraseña · validación de email · portada/carrera · lista “siguiendo” · feed personalizado · compartir/guardar/reportar · hashtags · respuestas a comentarios · comunidades · recursos académicos · eventos · mensajería · notificaciones de servidor · dashboard rico · gamificación · búsqueda global con filtros · paginación / rate limit / Alembic formal.

### Identidad visual (mantener)

- Fondo verde oscuro `#0F2D23` / superficies `#16382C` `#1E5A43`
- Acción amarillo/dorado `#FFD54A` `#FFC107`
- Acento menta `#8FD19E` · texto crema `#FFF8E1`
- Tema oscuro, cards redondeadas, responsive, estados loading / empty / error
- Logo oficial en `frontend/public/logo.png` y assets móviles

### Navegación objetivo (web)

```text
Inicio | Feed | Comunidades | Recursos | Eventos | Mensajes | Avisos | Perfil ▾
                                                                    └ Cerrar sesión
```

“Panel/Dashboard” pasa a ser vista del perfil o subruta `/dashboard` accesible desde el menú del perfil.  
En móvil: tabs principales + stacks internos (no saturar la barra).

---

# 1. Plan general (visión por capas)

```text
                    ┌─────────────┐  ┌─────────────┐
                    │  Web (Vite) │  │ Expo móvil  │
                    └──────┬──────┘  └──────┬──────┘
                           │ REST + WebSocket (JWT)
                    ┌──────▼────────────────▼──────┐
                    │         FastAPI /api          │
                    │   + WS /ws (chat + buzón)     │
                    └──────┬────────────────┬──────┘
                           │                │
                    ┌──────▼──────┐  ┌──────▼──────────┐
                    │  Postgres   │  │ Storage archivos │
                    │  (Supabase) │  │ (media + docs)   │
                    └─────────────┘  └─────────────────┘
```

**Principios**

1. **Un dominio = un módulo API** (`communities.py`, `events.py`, …) + modelos + tests.
2. **Misma API para web y móvil**; UI puede ir desfasada 1 fase.
3. **Migraciones SQL en `supabase/migrations/`** (y adoptar Alembic cuando el esquema crezca).
4. **Paginación desde Fase 3** (`limit`/`cursor` o `page`).
5. **Mensajería y buzón (avisos) en tiempo real desde el diseño** — WebSocket obligatorio en Fases 7–8; REST solo para historial, envío autenticado y marcar leído. No dejar el chat/buzón en “solo polling”.
6. **Archivos grandes (PDF/ZIP)** → storage dedicado (Supabase Storage o S3), no disco efímero de Render.
7. **Capa realtime compartida** (`services/realtime.py` / connection manager): un canal por usuario para el buzón y canales por conversación para el chat.

**Prioridad de valor (MoSCoW)**

| Must (MVP plataforma) | Should | Could | Won’t (v1) |
|-----------------------|--------|-------|------------|
| Auth + reset password | Comunidades | Gamificación | Stories / video live |
| Feed + guardar + hashtags | Recursos PDF | Ranking global | OAuth Google (opcional luego) |
| Perfil académico + follow feed | Eventos RSVP | Reacciones múltiples | App Store producción |
| **Chat 1:1 en tiempo real** | Dashboard | Moderación avanzada | Multi-tenant universidades |
| **Buzón de avisos en tiempo real** | Búsqueda ampliada | Push nativo FCM | Grupos de chat masivos |

---

# 2. Arquitectura de módulos

```text
backend/app/
  api/
    auth.py          # + password reset
    users.py         # perfil académico
    follows.py       # + following + timeline
    posts.py         # + share/save/report/hashtags/replies
    communities.py   # NUEVO
    resources.py     # NUEVO
    events.py        # NUEVO
    messages.py      # NUEVO — REST + push WS a conversación
    notifications.py # NUEVO — REST + push WS a buzón del usuario
    gamification.py  # NUEVO
    search.py        # ampliar
    stats.py         # dashboard rico
    media.py         # + docs storage
    ws.py            # NUEVO — endpoints WebSocket + auth JWT en query/header
  models/            # 1 archivo o paquete por dominio
  schemas/
  services/          # lógica (xp, notify, storage, realtime)
  core/              # security, rate_limit, config

frontend/src/
  pages/             # una página por sección nav
  components/        # PostCard, CommunityCard, EventCard, ChatThread…
  features/          # (opcional) hooks por dominio
  context/           # Auth, Toast, Notifications

mobile/app/(app)/    # espejo gradual de features web
```

**Dependencias entre módulos**

```text
Auth/Users ──► Follows ──► Feed timeline
     │              │
     ├─► Posts ◄────┘
     │      │
     │      ├─► Notifications
     │      ├─► Gamification (hooks en acciones)
     │      └─► Search index
     ├─► Communities ──► Posts (community_id)
     ├─► Resources
     ├─► Events
     └─► Messages ──► Notifications
              │              │
              └──── WebSocket realtime ────┘
                   (chat + buzón)
```

---

# 3. Estructura de base de datos

## 3.1 Tablas actuales (mantener)

`users` · `posts` · `likes` · `comments` · `follows` · `stored_media`

## 3.2 Extensiones a `users`

| Columna | Tipo | Notas |
|---------|------|--------|
| `cover_url` | text null | Portada |
| `career` | varchar(120) null | Carrera |
| `university` | varchar(120) null | |
| `semester` | smallint null | |
| `is_verified` | bool default false | Email validado |
| `xp` | int default 0 | Gamificación |
| `level` | int default 1 | |
| `last_seen_at` | timestamptz null | Estado “en línea” |

## 3.3 Tablas nuevas (por dominio)

### Auth

- `password_reset_tokens` (`user_id`, `token_hash`, `expires_at`, `used_at`)
- `email_verification_tokens` (igual patrón)

### Feed social

- `post_saves` (`user_id`, `post_id`, unique)
- `post_shares` (`user_id`, `post_id`, `created_at`) — contador + opcional destino
- `post_reports` (`reporter_id`, `post_id`, `reason`, `status`)
- `hashtags` (`id`, `name` unique)
- `post_hashtags` (`post_id`, `hashtag_id`)
- Extender `comments`: `parent_id` null (respuestas)

### Comunidades

- `communities` (`id`, `name`, `slug`, `description`, `cover_url`, `rules`, `owner_id`, `created_at`)
- `community_members` (`community_id`, `user_id`, `role` enum: member|mod|admin, `joined_at`)
- `posts.community_id` null (post global vs comunidad)

### Recursos

- `subjects` (`id`, `name`, `code` null) — materias
- `resources` (`id`, `uploader_id`, `subject_id`, `title`, `description`, `category`, `file_url`, `file_type`, `size_bytes`, `downloads_count`, `avg_rating`, `created_at`)
- `resource_ratings` (`resource_id`, `user_id`, `score` 1–5, unique)

### Eventos

- `events` (`id`, `creator_id`, `community_id` null, `title`, `description`, `starts_at`, `ends_at`, `location`, `created_at`)
- `event_attendees` (`event_id`, `user_id`, `status` going|interested|declined, unique)

### Mensajería

- `conversations` (`id`, `created_at`, `updated_at`)
- `conversation_participants` (`conversation_id`, `user_id`, `last_read_at`)
- `messages` (`id`, `conversation_id`, `sender_id`, `body`, `created_at`, `edited_at` null)

### Notificaciones

- `notifications` (`id`, `user_id`, `actor_id` null, `type`, `entity_type`, `entity_id`, `payload` jsonb, `read_at` null, `created_at`)

### Gamificación

- `badges` (`id`, `code`, `name`, `description`, `icon`)
- `user_badges` (`user_id`, `badge_id`, `earned_at`)
- `xp_events` (`id`, `user_id`, `action`, `points`, `created_at`) — auditoría

## 3.3 Orden de migraciones sugerido

1. Extender `users` + tokens auth  
2. Saves / reports / hashtags / `comments.parent_id`  
3. Communities + `posts.community_id`  
4. Subjects + resources + ratings  
5. Events + attendees  
6. Notifications  
7. Conversations + messages  
8. Badges + xp_events  

---

# 4. Endpoints / API (mapa)

Base: `/api` · Auth: Bearer JWT (salvo rutas públicas marcadas).

## Auth / usuarios

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/auth/register` | ya |
| POST | `/auth/login` | ya |
| GET/PATCH | `/auth/me` | ampliar campos académicos |
| POST | `/auth/me/avatar` | ya |
| POST | `/auth/me/cover` | nuevo |
| POST | `/auth/forgot-password` | email + token |
| POST | `/auth/reset-password` | |
| POST | `/auth/verify-email` | |
| GET | `/users/{id}` | ya + campos nuevos |
| GET | `/users/{id}/following` | nuevo |
| GET | `/users/{id}/saved-posts` | |

## Follow / feed

| Método | Ruta | Notas |
|--------|------|--------|
| POST/DELETE | `/users/{id}/follow` | ya |
| GET | `/users/{id}/followers` | ya |
| GET | `/feed` | timeline: following + propio (paginado) |
| GET | `/posts` | feed global (mantener) |

## Posts

| Método | Ruta | Notas |
|--------|------|--------|
| CRUD + like + comments | `/posts…` | ya |
| POST | `/posts/{id}/save` · DELETE unsave | |
| POST | `/posts/{id}/share` | |
| POST | `/posts/{id}/report` | |
| PATCH/DELETE | `/comments/{id}` | autor |
| GET | `/hashtags/{name}/posts` | |

## Comunidades

| Método | Ruta |
|--------|------|
| GET/POST | `/communities` |
| GET/PATCH | `/communities/{id}` |
| POST/DELETE | `/communities/{id}/join` |
| GET | `/communities/{id}/members` |
| GET/POST | `/communities/{id}/posts` |

## Recursos

| Método | Ruta |
|--------|------|
| GET/POST | `/resources` |
| GET | `/resources/{id}` · `/resources/{id}/download` |
| POST | `/resources/{id}/rate` |
| GET | `/subjects` |

## Eventos

| Método | Ruta |
|--------|------|
| GET/POST | `/events` |
| GET/PATCH/DELETE | `/events/{id}` |
| POST | `/events/{id}/rsvp` body `{status}` |
| GET | `/events/{id}/attendees` |

## Mensajes (REST + tiempo real)

| Método | Ruta | Notas |
|--------|------|--------|
| GET/POST | `/conversations` | Inbox / abrir chat |
| GET | `/conversations/{id}/messages` | Historial paginado |
| POST | `/conversations/{id}/messages` | Persiste + **emite WS** a participantes |
| POST | `/conversations/{id}/read` | Actualiza `last_read_at` + emite `message.read` |
| WS | `/ws/chat?token=` | Canal de usuario: eventos `message.new`, `message.read`, `typing`, `presence` |
| WS | `/ws/conversations/{id}?token=` | (opcional) canal por conversación abierta |

**Contrato WS (chat) — ejemplos**

```json
{ "type": "message.new", "conversation_id": 12, "message": { "id": 90, "body": "Hola", "sender_id": 3, "created_at": "..." } }
{ "type": "message.read", "conversation_id": 12, "user_id": 5, "last_read_at": "..." }
{ "type": "typing", "conversation_id": 12, "user_id": 3 }
{ "type": "presence", "user_id": 3, "status": "online" }
```

El cliente **no espera al refresh** para ver mensajes nuevos: al conectar el WS, el hilo y el inbox se actualizan al instante.

## Notificaciones / buzón (REST + tiempo real)

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/notifications` | Historial del buzón (paginado) |
| GET | `/notifications/unread-count` | Badge Navbar |
| PATCH | `/notifications/read` | Marcar todas |
| PATCH | `/notifications/{id}/read` | Marcar una |
| WS | `/ws/notifications?token=` | **Buzón en vivo**: push al llegar like, follow, comment, mensaje, evento, recurso |

**Contrato WS (buzón)**

```json
{ "type": "notification.new", "notification": { "id": 1, "type": "like", "actor_id": 3, "entity_type": "post", "entity_id": 44, "created_at": "..." } }
{ "type": "notification.read", "ids": [1, 2] }
{ "type": "badge", "unread": 4 }
```

Navbar y página `/notifications` se suscriben al mismo canal: el badge sube **sin F5**.

## Stats / gamificación / search

| Método | Ruta |
|--------|------|
| GET | `/stats` | ampliar dashboard |
| GET | `/gamification/me` · `/gamification/leaderboard` |
| GET | `/search?q=&type=users\|posts\|communities\|events\|resources` |

---

# 5. Frontend — páginas y componentes clave

| Ruta | Página | Componentes nuevos / a mejorar |
|------|--------|--------------------------------|
| `/` | Home | Hero marca (ya) |
| `/feed` | Feed | Composer mejorado, PostCard (save/share/report/hashtags), infinite scroll |
| `/communities` · `/communities/:id` | Lista + detalle | `CommunityCard`, `JoinButton`, reglas |
| `/resources` · `/resources/:id` | Biblioteca | `ResourceCard`, uploader, filtros materia |
| `/events` · `/events/:id` | Agenda | `EventCard`, RSVP |
| `/messages` · `/messages/:id` | Inbox + chat **en vivo** | `ConversationList`, `ChatThread`, hook `useChatSocket` |
| `/notifications` | **Buzón** de avisos en vivo | Lista + badge Navbar vía `useNotificationsSocket` |
| `/users/:id` | Perfil | Portada, carrera, tabs (posts / guardados / following) |
| `/dashboard` | Panel | Widgets (eventos, notifs, stats, ranking snippet) |
| `/search` | Buscador | Tabs tipo + filtros |
| `/login` `/register` `/forgot-password` | Auth | Formularios + validación visual |

**Navbar:** links de navegación propuesta; avatar abre menú (Perfil, Panel, Cerrar sesión). Badge de avisos desde API.

---

# 6. Orden de implementación paso a paso

## Prioridad ejecutable (sprints sugeridos de 1–2 semanas)

| Sprint | Foco | Entrega demostrable |
|--------|------|---------------------|
| S0 | Análisis + migraciones base + **nav shell** | Rutas Comunidades/Recursos/Eventos/Mensajes/Avisos + menú perfil |
| S1 | Fase 2 (perfil académico + following) — **hecho** | Carrera/universidad/portada + lista siguiendo |
| S2 | Fase 3 esencial (save, hashtags, feed following, paginación) — **hecho** | Tabs Global/Siguiendo + Guardar + #tags |
| S3 | Fase 8 mínima + **WS buzón** (like/follow/comment en vivo) — **hecho** | Badge real sin F5 |
| S4 | Fase 4 comunidades MVP — **hecho** | Crear/unirse/postear |
| S5 | Fase 5 recursos MVP — **hecho** | Subir PDF + listar/descargar |
| S6 | Fase 6 eventos MVP — **hecho** | Crear + RSVP |
| S7 | Fase 7 **chat 1:1 en tiempo real (WebSocket)** — **hecho** | Inbox + hilo live |
| S8 | Fase 9 dashboard + Fase 11 búsqueda global — **hecho** | Panel + search types |
| S9 | Fase 3 avanzada (share/report) + Fase 10 XP/insignias — **hecho** | Gamificación básica |
| S10 | Fase 12 seguridad + Fase 13 tests (local; **sin deploy**) — **hecho** | Rate limit + ownership tests |

---

# 7. Fases detalladas (entregables)

---

## Fase 1 — Análisis y arquitectura

**Objetivo:** Congelar el mapa técnico y la deuda del MVP.

**Funcionalidades:** inventario, ADR cortos (storage, **WebSocket realtime para chat+buzón**, email), convención de ramas/PRs.

**BD:** ninguna nueva (solo documento del modelo objetivo §3).

**Backend:** revisar `router.py`, `create_all` vs migraciones; decidir Alembic.

**Frontend:** wireframe nav nueva; inventario componentes reutilizables (`PostCard`, `Toast`, `AuthContext`).

**API:** N/A.

**Componentes/páginas:** actualizar este plan si hay hallazgos.

**Orden:** 1) leer código 2) diagrama ER 3) checklist de deuda (paginación, CORS, uploads) 4) ADR storage/email.

**Done cuando:** equipo acuerda stack, storage de archivos, proveedor email, y orden de sprints.

---

## Fase 2 — Usuarios y perfiles

**Objetivo:** Identidad académica completa y grafo social usable.

**Funcionalidades:**  
Esenciales: ampliar perfil (carrera, universidad, semestre, portada), lista following, editar perfil.  
Luego: forgot/reset password, verificación email.

**BD:** columnas en `users`; `password_reset_tokens`; (opc) `email_verification_tokens`.

**Backend:** `users.py`, `auth.py`, `follows.py` (+ `GET .../following`).

**Frontend:** `Profile.jsx` (portada, tabs), formularios auth, páginas forgot/reset.

**API:** ver §4 Auth/Users/Follow.

**Orden:** 1) migración users 2) PATCH me + cover 3) UI perfil 4) following list 5) reset password 6) verify email.

**Done cuando:** un usuario edita datos académicos, ve seguidores/siguiendo, y puede resetear contraseña (aunque el email sea Mailtrap/Resend en staging).

---

## Fase 3 — Feed social

**Objetivo:** Interacción rica sin romper el PostCard actual.

**Funcionalidades:**  
Esenciales: guardar posts, hashtags al crear, respuestas a comentarios, feed `/feed` (siguiendo), paginación.  
Luego: compartir, reportar, reacciones extra.

**BD:** `post_saves`, `hashtags`, `post_hashtags`, `comments.parent_id`; luego shares/reports.

**Backend:** extender `posts.py`; endpoint `/feed`.

**Frontend:** composer (hashtags), PostCard (guardar, hilos), tabs Feed global / Siguiendo.

**API:** §4 Posts + Feed.

**Orden:** 1) paginación list posts 2) saves 3) hashtags 4) comment replies 5) feed following 6) share/report.

**Done cuando:** usuario guarda un post, usa `#campus`, responde un comentario y ve timeline de gente que sigue.

---

## Fase 4 — Comunidades

**Objetivo:** Espacios temáticos (materias, clubes).

**Funcionalidades:** crear, unirse/salir, roles member/admin, reglas, posts con `community_id`.

**BD:** `communities`, `community_members`; FK en `posts`.

**Backend:** `communities.py`; validar membresía al postear.

**Frontend:** `/communities`, detalle, composer contextual.

**API:** §4 Comunidades.

**Orden:** 1) CRUD comunidad 2) join/leave 3) members/roles 4) posts de comunidad 5) UI reglas.

**Done cuando:** dos usuarios se unen a una comunidad y publican ahí; no-miembro no puede postear.

---

## Fase 5 — Recursos académicos

**Objetivo:** Biblioteca de materiales.

**Funcionalidades:** upload PDF/DOCX/PPTX/ZIP/imagen, categorías, materias, descarga, valoración 1–5, búsqueda.

**BD:** `subjects`, `resources`, `resource_ratings`.

**Backend:** `resources.py` + storage (Supabase Storage); límites MIME/tamaño.

**Frontend:** `/resources`, uploader, filtros, detalle con rating.

**API:** §4 Recursos.

**Orden:** 1) subjects seed 2) upload+metadata 3) list/filter 4) download counter 5) ratings 6) search hook.

**Done cuando:** se sube un PDF, otro usuario lo descarga y lo valora; el archivo no se pierde al redeploy.

---

## Fase 6 — Eventos

**Objetivo:** Agenda del campus.

**Funcionalidades:** crear evento (fecha/hora/lugar/desc), RSVP, lista participantes; recordatorios vía notificaciones (Fase 8) o cron simple.

**BD:** `events`, `event_attendees`.

**Backend:** `events.py`; job/cron “recordatorio 24h” (puede ser script + Render cron).

**Frontend:** `/events`, detalle, botón asistencia.

**API:** §4 Eventos.

**Orden:** 1) CRUD 2) RSVP 3) UI calendario/lista 4) recordatorios.

**Done cuando:** creador publica evento, 3 usuarios confirman asistencia y aparece en dashboard.

---

## Fase 7 — Mensajería (tiempo real)

**Objetivo:** Chat 1:1 **en tiempo real** (grupos = Could). El inbox y el hilo se actualizan al instante vía WebSocket.

**Funcionalidades:**  
- Conversaciones, historial REST, envío de mensajes  
- **WebSocket** para `message.new`, `message.read`, `typing`, presencia (`last_seen_at` / online)  
- Inbox: al recibir un mensaje, la conversación sube al tope y el contador de no leídos cambia **sin refrescar**  
- Notificar también al buzón (Fase 8) con tipo `message`

**BD:** `conversations`, `conversation_participants`, `messages`.

**Backend:**  
- `messages.py` (REST)  
- `ws.py` + `services/realtime.py` (ConnectionManager: sockets por `user_id` y por `conversation_id`)  
- Auth JWT en el handshake WS (`?token=` o primer frame `auth`)  
- Tras `POST .../messages`: persistir → broadcast WS a participantes online  

**Frontend:**  
- `/messages` (lista) + `/messages/:id` (hilo)  
- `useChatSocket` / contexto que mantiene la conexión mientras hay sesión  
- Indicador “escribiendo…”, ticks de leído, empty/loading/error  
- Reconexión automática si cae el WS (Render cold start)

**API:** §4 Mensajes (REST + WS).

**Orden:**  
1) ConnectionManager + auth WS  
2) CRUD conversaciones + historial  
3) POST mensaje + emit `message.new`  
4) UI hilo conectado al WS  
5) Inbox reactivo (`conversation.updated`)  
6) read receipts + typing + presence  

**Done cuando:** A envía un mensaje y B lo ve **en &lt;1 s** sin recargar; el inbox de B refleja el hilo al tope; al abrir el chat, A recibe `message.read` en vivo.

---

## Fase 8 — Notificaciones / buzón (tiempo real)

**Objetivo:** **Buzón de avisos en vivo** (sustituye el historial solo-toast). Badge y lista se actualizan por WebSocket.

**Funcionalidades:**  
- Crear notificación al like / comment / follow / message / event / resource  
- Listar historial REST; marcar leído (una / todas)  
- **WS `/ws/notifications`**: push `notification.new`, `badge`, `notification.read`  
- Página `/notifications` (buzón) + badge en Navbar  
- Toast corto opcional al llegar un evento WS (sin sustituir el buzón)

**BD:** `notifications`.

**Backend:**  
- `notifications.py` + helper `notify(...)` que: inserta fila → emite WS al `user_id` destino  
- Reutilizar el mismo ConnectionManager que el chat (canal por usuario)

**Frontend:**  
- `NotificationsContext` o hook `useNotificationsSocket`  
- Navbar badge desde estado en vivo + sync inicial `GET /notifications/unread-count`  
- Buzón: lista, empty state, marcar leído (emite/recibe confirmación)

**API:** §4 Notificaciones / buzón.

**Orden:**  
1) modelo + REST list/read/count  
2) WS canal usuario + evento `notification.new`  
3) hooks en like/follow/comment  
4) UI buzón + badge live  
5) enganchar message/event/resource  

**Done cuando:** un like genera ítem en el buzón de B **sin F5**; el badge sube al instante; marcar leído limpia badge en todos los tabs abiertos del mismo usuario.

---

## Fase 9 — Dashboard

**Objetivo:** Panel útil, no solo contadores.

**Funcionalidades:** actividad reciente, eventos próximos, notificaciones, seguidores, stats propias, atajos a recursos.

**BD:** vistas/consultas sobre tablas existentes (sin tablas nuevas obligatorias).

**Backend:** ampliar `GET /stats` o `GET /dashboard/me`.

**Frontend:** `Dashboard.jsx` con widgets; accesible desde menú perfil.

**API:** stats/dashboard.

**Orden:** 1) endpoint agregado 2) widgets UI 3) empty states 4) enlace desde nav perfil.

**Done cuando:** el panel muestra datos personales coherentes (no solo globales) en &lt;2s con warm API.

---

## Fase 10 — Gamificación

**Objetivo:** Motivación ligera sin ensuciar el core.

**Funcionalidades:** XP por acciones, niveles, insignias, ranking.

**BD:** `xp`/`level` en users; `badges`, `user_badges`, `xp_events`.

**Backend:** `services/xp.py` llamado desde posts/comments/resources; `gamification.py`.

**Frontend:** bloque en perfil + `/dashboard` ranking; toast al ganar insignia.

**API:** §4 Gamificación.

**Orden:** 1) tabla reglas XP 2) award en acciones 3) badges seed 4) leaderboard 5) UI.

**Done cuando:** publicar y comentar sube XP; aparece insignia “Primera publicación”; ranking top 10 responde.

---

## Fase 11 — Búsqueda

**Objetivo:** Un buscador para toda la plataforma.

**Funcionalidades:** tipos users/posts/communities/events/resources; filtros (materia, fecha); UI por tabs.

**BD:** índices (`ILIKE`/`pg_trgm` si Postgres).

**Backend:** ampliar `search.py`.

**Frontend:** `Search.jsx` con tabs y filtros.

**API:** `GET /search?q=&type=&…`.

**Orden:** 1) contrato unificado 2) cada tipo 3) filtros 4) UI 5) empty/error.

**Done cuando:** una query encuentra al menos un resultado en cada tipo poblado; filtros no rompen la query vacía.

---

## Fase 12 — Seguridad y optimización

**Objetivo:** Endurecer antes de demo/entrega formal.

**Funcionalidades/técnicas:** validación Pydantic estricta, autorización por ownership/roles, MIME allowlist, tamaño máx, rate limit (login, upload, messages), sanitizar HTML si hubiera rich text, HTTPS, secretos fuera del repo, paginación en todos los listados, índices FK, manejo de errores uniforme, cold-start retry (ya existe — mantener).

**BD:** índices; políticas storage.

**Backend:** middleware rate limit; tests de permisos.

**Frontend:** confirmaciones destructivas; disabled states; mensajes de error amigables.

**Orden:** checklist seguridad → aplicar por módulo crítico (auth, upload, messages).

**Done cuando:** checklist de seguridad pasada; tests de “otro usuario no borra tu post/recurso” en verde. — **hecho (S10 local; deploy fuera de alcance hasta que lo pidas).**

---

## Fase 13 — Pruebas

**Objetivo:** Regresión automatizada + QA manual.

**Backend (pytest):** auth (register/login/reset), feed CRUD, comments/replies, follows, communities membership, resources download authz, events RSVP, search, notifications.

**Frontend:** smoke manual / Playwright opcional (login → post → like).

**Responsive:** 375 / 768 / 1280 en nav, feed, chat, perfil.

**Done cuando:** suite CI verde en PR a `main` y checklist QA firmada.

---

## Fase 14 — Despliegue

**Objetivo:** Entorno estable y documentado.

**Tareas:** variables Render/Vercel/Supabase; bucket storage; SMTP/Resend; dominio + HTTPS; backups DB; healthchecks; monitoreo básico (logs Render); actualizar `README` y `docs/despliegue.md`; APK EAS al cerrar features móviles espejo.

**Done cuando:** deploy limpio desde `main`, `/api/health` ok, login web+móvil contra prod, y runbook de rollback escrito.

---

# 8. Mejoras UI/UX prioritarias (transversales)

Aplicar en paralelo a S1–S3 (no esperar al final):

| Superficie | Mejora |
|------------|--------|
| **Navbar** | Logo, links nuevos, menú perfil, badge avisos API, logout solo en menú |
| **Feed** | Composer claro, tabs Global/Siguiendo, skeleton, infinite scroll |
| **PostCard** | Acciones save/share/report, hashtags clickables, hilo de respuestas, lightbox (ya) |
| **Perfil** | Portada, grid stats, tabs posts/guardados/siguiendo |
| **Dashboard** | Widgets, no solo 4 números |
| **Avisos / buzón** | Página dedicada + badge **en vivo** (WS) |
| **Mensajes** | Inbox + hilo con entrega inmediata (WS), typing, leídos |
| **Buscador** | Tabs por tipo + filtros |

Estados obligatorios en cada lista: **loading**, **empty**, **error**, **success toast**.

---

# 9. Espejo móvil (Expo)

Paridad v1.1.0 (APK preview versionCode 5) — **hecho**:

| Tras fase web | Móvil |
|---------------|-------|
| 2–3 | Perfil ampliado, saves, feed following |
| 4 | Tab o stack Comunidades |
| 5–6 | Recursos / Eventos (lista) |
| 7–8 | Mensajes **tiempo real** + buzón/notifs **tiempo real** |
| 10–11 | XP en perfil + search types |
| Extra | Modal **Actualizar** al abrir APK (`GET /api/mobile/version`) |

Rebuild APK (`eas build --profile preview`) al cerrar cada bloque móvil visible para demos.

---

# 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Disco Render efímero | Supabase Storage / S3 desde Fase 5 |
| Cold start API | Mantener `withRetry` / wake health; WS con reconnect + backoff |
| WebSocket en Render (multi-instancia) | Empezar **1 instancia**; si escala: Redis pub/sub para fan-out entre workers |
| Alcance infinito | MoSCoW; gamificación y reportes al final |
| Migraciones inconsistentes | Una migración SQL por PR; no solo `create_all` en prod |
| APK “virus” Play Protect | Documentar sideload; Expo Go para demos internas |

---

# 11. Definition of Done global (plataforma v1)

- [ ] Nav objetivo en web; logout en menú perfil  
- [ ] Perfil académico + following + feed siguiendo  
- [ ] Saves + hashtags + replies  
- [ ] Comunidades MVP  
- [ ] Recursos con archivo persistente  
- [ ] Eventos + RSVP  
- [ ] Chat 1:1 **en tiempo real** (WS): mensaje visible sin refrescar  
- [ ] Inbox de mensajes reactivo (tope + no leídos en vivo)  
- [ ] **Buzón** de notificaciones de servidor + badge **en vivo**  
- [ ] Dashboard personal  
- [ ] Búsqueda multi-tipo  
- [ ] Tests críticos (incl. WS smoke) + deploy documentado  

**Fuera de v1 (backlog explícito):** OAuth, push nativo, video, stories, multi-universidad, moderación IA.

---

# 12. Primeras 10 tareas ejecutables (empezar mañana)

1. Crear ramas `feature/nav-shell` — rutas placeholder Comunidades/Recursos/Eventos/Mensajes/Avisos + menú perfil.  
2. Migración `users` (+ cover, career, university, semester).  
3. `PATCH /auth/me` acepta campos nuevos + UI editar perfil.  
4. Upload portada `POST /auth/me/cover`.  
5. `GET /users/{id}/following` + UI en perfil.  
6. Paginación `GET /posts?cursor=&limit=`.  
7. Tabla `post_saves` + endpoints + botón en PostCard.  
8. Parseo hashtags al crear post + links en contenido.  
9. `comments.parent_id` + UI respuestas.  
10. `GET /feed` (following) + tabs en Feed.jsx.

---

*Documento vivo: actualizar la sección “Estado actual” al cerrar cada sprint. Stack y marca Studious Party no se reinventan; se extienden.*
