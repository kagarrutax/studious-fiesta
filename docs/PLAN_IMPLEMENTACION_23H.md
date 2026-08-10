# Plan de implementación — Sprint 23 horas

**Proyecto:** Studious Party (`studious-fiesta`)  
**Objetivo:** cerrar extras del equipo + pulir entrega en **23 horas**  
**Base ya lista:** auth, feed, likes, comentarios, perfil, dashboard, diseño, Supabase, Vercel + Render  

**Integrantes**

| # | Integrante | Feature dueña |
|---|------------|---------------|
| 1 | Yokabeth Valdes | Seguir usuarios |
| 2 | Jessica Angulo | Editar / borrar posts |
| 3 | YadiiCabeza96 | Búsqueda |
| 4 | meilynperea2-debug | Dashboard con actividad |
| 5 | Adrian Arboleda | UX (toasts) + docs de entrega |

**Reglas del sprint**

- 1 persona = 1 rama = 1 PR (ver `docs/equipo-features.md`)
- No push directo a `main`
- Antes de merge: login → post → like → comentario
- Coordinador del reloj: **Adrian** (aviso cada fase)

**Reloj total:** 23 h (calendario del sprint). Trabajo en paralelo dentro de cada fase.

```text
Hora  0 ──────── 3 ──── 11 ──── 16 ──── 20 ──── 23
       Setup     Build   Merge   QA      Entrega
       Fase 0    Fase 1  Fase 2  Fase 3  Fase 4
```

---

## Fase 0 — Arranque sincronizado (horas 0–3)

**Meta:** todos con el mismo `main`, entorno OK, ramas creadas.

| Min | Quién | Qué hace |
|-----|-------|----------|
| 0:00–0:30 | Todos | `git clone` / `git pull`, leer este plan + `docs/equipo-features.md` |
| 0:30–1:30 | Todos | Backend venv + `pip install -r requirements.txt`; frontend `npm install`; API `:8002` + Vite `:5173` |
| 1:30–2:00 | Adrian | Confirmar URLs prod (Vercel / Render / Supabase); avisar si algo falla |
| 2:00–2:30 | Todos | Crear y pushear su rama vacía desde `main` |
| 2:30–3:00 | Todos | Smoke test local: registro, login, un post |

**Ramas a crear**

```text
feature/seguir-usuarios          → Yokabeth
feature/editar-borrar-post       → Jessica
feature/busqueda                 → YadiiCabeza96
feature/dashboard-actividad      → meilynperea2-debug
feature/notificaciones-ui        → Adrian
```

**Hito Fase 0:** 5 ramas en GitHub + app local responde.

---

## Fase 1 — Construcción en paralelo (horas 3–11)

**Meta:** cada feature usable en su rama (backend + UI mínima).  
**Duración:** 8 h · **todos a la vez**

### Yokabeth (8 h) — Follow

| Bloque | Horas | Tarea |
|--------|-------|--------|
| A | 3–5 | Modelo `Follow` + migración Supabase / SQLAlchemy |
| B | 5–8 | API: follow / unfollow / listar followers |
| C | 8–11 | Botón en `Profile.jsx` + llamada en `api.js` |

**Done cuando:** desde un perfil ajeno puedo seguir y dejar de seguir.

### Jessica (8 h) — Editar / borrar post

| Bloque | Horas | Tarea |
|--------|-------|--------|
| A | 3–5 | `PATCH` y `DELETE /api/posts/{id}` (solo autor) |
| B | 5–8 | Tests básicos en `test_posts.py` |
| C | 8–11 | Menú en `PostCard.jsx` (editar texto / eliminar) |

**Done cuando:** el autor edita y borra su post; otro usuario no puede.

### YadiiCabeza96 (8 h) — Búsqueda

| Bloque | Horas | Tarea |
|--------|-------|--------|
| A | 3–6 | `GET /api/search?q=` (users + posts) |
| B | 6–8 | Página `Search.jsx` + ruta en `App.jsx` |
| C | 8–11 | Link/caja en `Navbar.jsx` |

**Done cuando:** busco un username o texto y veo resultados.

### meilynperea2-debug (8 h) — Dashboard

| Bloque | Horas | Tarea |
|--------|-------|--------|
| A | 3–6 | Ampliar `GET /api/stats` con `recent_posts` y `recent_users` |
| B | 6–11 | UI en `Dashboard.jsx` (listas + totales) |

**Done cuando:** el panel muestra totales y actividad reciente.

### Adrian (8 h) — UX + docs

| Bloque | Horas | Tarea |
|--------|-------|--------|
| A | 3–6 | Componente Toast + cable en Layout |
| B | 6–9 | Toasts en login, registro, crear post, errores API |
| C | 9–11 | Borrador README: integrantes, URLs, capturas pendientes |

**Done cuando:** acciones clave muestran feedback visual; README tiene esqueleto de entrega.

**Hito Fase 1:** 5 PRs abiertos (aunque sean draft). Check-in grupal a la **hora 11**.

---

## Fase 2 — Integración y merges (horas 11–16)

**Meta:** todo en `main` sin romper lo base.  
**Duración:** 5 h

**Orden de merge (evitar conflictos)**

| Orden | Hora aprox. | PR | Quién mergea / revisa |
|-------|-------------|-----|------------------------|
| 1 | 11:00–12:00 | UX / toasts (Adrian) | Jessica revisa |
| 2 | 12:00–13:00 | Editar/borrar (Jessica) | Yokabeth revisa |
| 3 | 13:00–14:00 | Dashboard (meilyn) | Yadii revisa |
| 4 | 14:00–15:00 | Búsqueda (Yadii) | meilyn revisa |
| 5 | 15:00–16:00 | Follow (Yokabeth) | Adrian revisa + migración BD |

Tras cada merge: `git pull` en las ramas que sigan abiertas.

**Si hay conflicto en Navbar / Profile / PostCard**

1. Quien mergea después hace rebase/merge desde `main`
2. No reescribir la feature del otro; solo adaptar imports/UI

**Hito Fase 2:** `main` tiene las 5 features; API + frontend local OK.

---

## Fase 3 — QA cruzado (horas 16–20)

**Meta:** cazar bugs entre módulos.  
**Duración:** 4 h · parejas rotativas

| Hora | Tester | Prueba el módulo de |
|------|--------|---------------------|
| 16–17 | Jessica | Follow (Yokabeth) |
| 16–17 | Yokabeth | Editar/borrar (Jessica) |
| 17–18 | meilyn | Búsqueda (Yadii) |
| 17–18 | Yadii | Dashboard (meilyn) |
| 18–19 | Todos | Flujo completo en local (script abajo) |
| 19–20 | Adrian + 1 | Flujo en **producción** (Vercel + Render) |

**Script de prueba (todos)**

1. Registro usuario nuevo  
2. Login  
3. Crear post texto + post con imagen  
4. Like + comentario  
5. Editar y borrar post propio  
6. Buscar usuario / texto  
7. Seguir a otro usuario  
8. Ver dashboard (totales + recientes)  
9. Ver toasts / mensajes de error  
10. Probar en móvil (responsive)

Bugs → issues o commits `fix/...` chicos; **no** features nuevas.

**Hito Fase 3:** checklist sin blockers; prod responde.

---

## Fase 4 — Entrega y cierre (horas 20–23)

**Meta:** material de entrega académica listo.  
**Duración:** 3 h

| Hora | Quién | Entregable |
|------|-------|------------|
| 20–21 | Adrian | README final: URLs, stack, cómo correr, integrantes |
| 20–21 | Yadii + Jessica | 4–6 capturas (login, feed, search, profile/follow, dashboard) → `docs/` |
| 21–22 | Yokabeth + meilyn | Actualizar `docs/arquitectura.md` si hubo tablas/endpoints nuevos |
| 21–22 | Adrian | Verificar deploy (health API + login en Vercel) |
| 22–23 | Todos | Repaso oral 5 min c/u de su feature; lista “qué aprendimos” |
| 23:00 | Adrian | Tag o commit final `chore: sprint-23h delivery` en `main` |

**URLs a documentar**

- App: `https://studious-party.vercel.app`  
- API: `https://studious-party-api.onrender.com`  
- Docs API: `https://studious-party-api.onrender.com/docs`  
- Local: `http://127.0.0.1:5173` + API `http://127.0.0.1:8002`

**Hito Fase 4:** repo + demo online listos para presentar.

---

## Vista rápida por persona (sus 23 h)

Asumiendo presencia en todo el sprint (paralelo + QA + entrega):

| Integrante | F0 | F1 (build) | F2 (merge) | F3 (QA) | F4 (entrega) |
|------------|----|------------|------------|---------|--------------|
| Yokabeth | setup + rama | Follow | merge #5 + ayudar | testea Jessica | arquitectura |
| Jessica | setup + rama | Edit/Delete | merge #2 + review Adrian | testea Yokabeth | capturas |
| YadiiCabeza96 | setup + rama | Search | merge #4 + review meilyn | testea meilyn | capturas |
| meilynperea2-debug | setup + rama | Dashboard | merge #3 + review Yadii | testea Yadii | arquitectura |
| Adrian | setup + coords | Toasts + README | orden merges + review Follow | QA prod | README + tag final |

---

## Fuera de alcance (no en estas 23 h)

- Chat en tiempo real  
- Stories / videos  
- App móvil nativa  
- Refactors grandes del diseño  
- Cambiar de hosting  

Si sobra tiempo al final de Fase 1: tests extra o pulir UI de la **propia** feature — no invadir archivos de otro.

---

## Contacto rápido / bloqueos

| Problema | A quién avisar |
|----------|----------------|
| Git / ramas / merge | Adrian |
| BD / migración Supabase | Yokabeth + Adrian |
| API posts rota | Jessica |
| Navbar / rutas | Yadii |
| Stats / panel | meilyn |
| Deploy Vercel/Render | Adrian |

**Documento hermano:** detalle de archivos por feature → [`docs/equipo-features.md`](./equipo-features.md)
