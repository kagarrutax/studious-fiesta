# Reparto de features — equipo de 5 (Studious Party)

**Regla:** cada persona = 1 rama = 1 PR. No subir directo a `main`.  
**Probar antes de merge:** login → crear post → like → comentario.

| Persona | Integrante | Feature | Rama |
|---------|------------|---------|------|
| 1 | Yokabeth Valdes | Seguir usuarios | `feature/seguir-usuarios` |
| 2 | Jessica Angulo | Editar y borrar posts | `feature/editar-borrar-post` |
| 3 | YadiiCabeza96 | Búsqueda | `feature/busqueda` |
| 4 | meilynperea2-debug | Dashboard actividad | `feature/dashboard-actividad` |
| 5 | Adrian Arboleda | UX / toasts + docs | `feature/notificaciones-ui` |

---

## Persona 1 — Yokabeth Valdes — Seguir usuarios (Follow)

**Qué entrega:** botón “Seguir / Dejar de seguir” en el perfil; lista básica de seguidores.

**Archivos (principalmente):**

| Capa | Archivos |
|------|----------|
| Modelo / migración | `backend/app/models/user.py` (o modelo `Follow` nuevo), `supabase/migrations/` (nueva migración) |
| API | **nuevo** `backend/app/api/follows.py`, `backend/app/api/router.py`, `backend/app/schemas/` |
| Tests | **nuevo** `backend/tests/test_follows.py` |
| UI | `frontend/src/pages/Profile.jsx`, `frontend/src/services/api.js` |

**No tocar:** `PostCard.jsx`, `Feed.jsx`, `auth.py` (salvo necesidad mínima).

**Endpoints sugeridos:**

- `POST /api/users/{id}/follow`
- `DELETE /api/users/{id}/follow`
- `GET /api/users/{id}/followers`

---

## Persona 2 — Jessica Angulo — Editar y borrar publicaciones

**Qué entrega:** el autor puede editar el texto de su post y eliminarlo.

**Archivos (principalmente):**

| Capa | Archivos |
|------|----------|
| API | `backend/app/api/posts.py` |
| Schemas | `backend/app/schemas/post.py` |
| Tests | `backend/tests/test_posts.py` |
| UI | `frontend/src/components/PostCard.jsx`, `frontend/src/pages/Feed.jsx`, `frontend/src/pages/Profile.jsx` |

**No tocar:** auth, follows, stats, Navbar (salvo un menú “⋯” dentro del post).

**Endpoints sugeridos:**

- `PATCH /api/posts/{id}`
- `DELETE /api/posts/{id}`

---

## Persona 3 — YadiiCabeza96 — Búsqueda de usuarios y posts

**Qué entrega:** caja de búsqueda; resultados de usuarios (y opcional posts por texto).

**Archivos (principalmente):**

| Capa | Archivos |
|------|----------|
| API | **nuevo** `backend/app/api/search.py`, `backend/app/api/router.py` |
| Tests | **nuevo** `backend/tests/test_search.py` |
| UI | **nuevo** `frontend/src/pages/Search.jsx`, `frontend/src/App.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/services/api.js` |

**No tocar:** lógica de likes/comentarios en `posts.py`, ni modelos de follow (Persona 1).

**Endpoints sugeridos:**

- `GET /api/search?q=...` → `{ users: [], posts: [] }`

---

## Persona 4 — meilynperea2-debug — Dashboard con actividad reciente

**Qué entrega:** en el panel, además de totales, mostrar “últimos posts” / “usuarios nuevos”.

**Archivos (principalmente):**

| Capa | Archivos |
|------|----------|
| API | `backend/app/api/stats.py` (ampliar respuesta) |
| Schemas | si hace falta, schema en `backend/app/schemas/` |
| Tests | ampliar tests de stats o **nuevo** `backend/tests/test_stats.py` |
| UI | `frontend/src/pages/Dashboard.jsx` |

**No tocar:** Feed, Profile, auth, PostCard.

**Ejemplo de ampliación:**

```json
{
  "users_count": 10,
  "posts_count": 40,
  "likes_count": 100,
  "comments_count": 25,
  "recent_posts": [ ... ],
  "recent_users": [ ... ]
}
```

---

## Persona 5 — Adrian Arboleda — Mejoras UX / notificaciones en UI

**Qué entrega (sin chat real):** toasts de éxito/error, estados de carga claros, y un centro simple de “avisos” en el cliente (por ejemplo: “tu post se publicó”, “comentario enviado”). Opcional: badge en Navbar.

**Archivos (principalmente):**

| Capa | Archivos |
|------|----------|
| UI compartida | **nuevo** `frontend/src/components/Toast.jsx` (o similar), `frontend/src/components/Layout.jsx`, `frontend/src/components/Navbar.jsx` |
| Integración ligera | `frontend/src/pages/Feed.jsx`, `Login.jsx`, `Register.jsx` (solo llamar al toast; no reescribir lógica) |
| Docs entrega | `README.md` (URLs, integrantes), capturas en `docs/` |

**No tocar:** backend salvo un endpoint opcional muy chico. Prioridad frontend + documentación de entrega.

> Si Persona 5 prefiere backend: puede hacer **tags en posts** (`#campus`) en `posts.py` + filtro en feed — pero avisar a Persona 2 y 3 para no chocar.

---

## Orden de merge recomendado (menos conflictos)

1. Persona 5 (toasts/docs) — o en paralelo si no toca los mismos JSX que otros  
2. Persona 2 (editar/borrar post)  
3. Persona 4 (dashboard)  
4. Persona 3 (búsqueda — toca Navbar/App)  
5. Persona 1 (follows — migración BD; merge con cuidado)

Si Persona 1 y 3 terminan juntos: merge primero follows (migración), luego search.

---

## Checklist antes de abrir PR

- [ ] Rama actualizada con `main` (`git pull origin main` y resolver conflictos en la rama)
- [ ] Probado en local: `http://127.0.0.1:5173` + API `:8002`
- [ ] No incluye `.env` ni contraseñas
- [ ] Descripción del PR: qué hace + cómo probarlo
- [ ] Otra persona del equipo revisa

## Comandos base

```powershell
git checkout main
git pull
git checkout -b feature/nombre-de-tu-feature
# ... cambios ...
git add .
git commit -m "add brief description of feature"
git push -u origin HEAD
# Luego abrir Pull Request en GitHub hacia main
```
