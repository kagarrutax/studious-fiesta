# Plan de desarrollo — studious-fiesta

**Proyecto:** Red social web básica (React + FastAPI)  
**Repositorio:** [studious-fiesta](https://github.com/)  
**Duración:** 20 días laborables (4 semanas, lunes a viernes)  
**Equipo:** 3–5 integrantes  
**Estado actual:** Fase 0 — Día 1 completado (setup base). Pendiente: diseño (Día 2).

---

## Resumen ejecutivo

| Fase | Días | Enfoque principal | Hito de control |
|------|------|-------------------|-----------------|
| 0 | 1–2 | Planificación y setup | Repo + arquitectura documentada |
| 1 | 3–7 | Backend FastAPI | API funcional en Swagger |
| 2 | 8–13 | Frontend React | Flujo UI completo en local |
| 3 | 14–15 | Integración y QA | Build de producción listo |
| 4 | 16–18 | Despliegue | App accesible en línea |
| 5 | 19–20 | Documentación y entrega | Demo + README completo |

---

## Roles sugeridos (3–5 personas)

| Rol | Responsabilidades principales | Fases activas |
|-----|------------------------------|---------------|
| **Backend** | Modelos, endpoints, auth JWT, tests | 1, 3, 4 |
| **Frontend** | UI, rutas, contexto auth, estilos | 2, 3, 4 |
| **Full-stack / integración** | CORS, variables de entorno, E2E | 3, 4 |
| **DevOps / despliegue** | Render/Railway, Vercel, CI básico | 4, 5 |
| **Documentación / PM** | README, wireframes, tablero, presentación | 0, 5 |

> Con 3 personas: Backend + Frontend + DevOps/Docs (rotando integración).  
> Con 5 personas: un rol por área + integración dedicada.

---

## Convenciones de trabajo

### Git
- Rama principal: `main` (siempre desplegable).
- Ramas por feature: `feature/backend-auth`, `feature/feed-ui`, etc.
- Pull requests con revisión de al menos 1 compañero antes de merge.
- Commits descriptivos en español o inglés (consistencia en el equipo).

### Comunicación diaria
- **Stand-up:** 10 min — qué hice / qué haré / bloqueos.
- **Tablero:** Trello, Notion o GitHub Projects con columnas *Por hacer · En progreso · Revisión · Hecho*.

### Definición de “hecho” (DoD) por tarea
- [ ] Código en rama con PR revisado
- [ ] Probado manualmente (Swagger o navegador)
- [ ] Sin secretos hardcodeados
- [ ] Documentado en README o comentario si aplica

---

## Stack tecnológico acordado

| Capa | Tecnología | Notas |
|------|------------|-------|
| Frontend | React + Vite | React Router, axios/fetch |
| Backend | FastAPI | SQLAlchemy o TortoiseORM |
| Base de datos | SQLite (dev) / PostgreSQL (prod) | Migraciones con Alembic recomendado |
| Auth | JWT | Access token en header `Authorization: Bearer` |
| Estilos | Tailwind / CSS Modules | A definir día 1 |
| Despliegue | Render/Railway (API) + Vercel/Netlify (UI) | A confirmar día 16 |

---

## Modelo de datos (borrador — validar día 2)

```
Usuario
  ├── id, username, email, password_hash
  ├── avatar_url, bio, created_at
  └── publicaciones[], likes[], comentarios[]

Publicacion
  ├── id, contenido, imagen_url (opcional)
  ├── usuario_id, created_at
  └── likes[], comentarios[]

Like
  ├── id, usuario_id, publicacion_id
  └── UNIQUE(usuario_id, publicacion_id)

Comentario
  ├── id, contenido, usuario_id, publicacion_id
  └── created_at
```

### Endpoints mínimos del API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Registro |
| POST | `/auth/login` | No | Login → JWT |
| GET | `/posts` | Sí | Feed |
| POST | `/posts` | Sí | Crear publicación |
| GET | `/users/{id}` | Opcional | Perfil público |
| POST | `/posts/{id}/like` | Sí | Toggle like |
| GET | `/posts/{id}/comments` | Sí | Listar comentarios |
| POST | `/posts/{id}/comments` | Sí | Crear comentario |
| GET | `/stats` | Sí | Dashboard (totales) |

---

## Plan detallado por día

### Fase 0: Arranque y planificación (Días 1–2)

#### Día 1 — Definición y setup inicial
- [ ] Reunión de equipo: tipo de red social (ej. estilo Instagram).
- [ ] Asignar roles tentativos.
- [x] Crear/verificar repositorio GitHub, `.gitignore`, README inicial.
- [x] Configurar entornos locales (Node, Python, venv, BD).
- [x] Inicializar FastAPI (estructura de carpetas) y React con Vite.
- [ ] Primer commit con estructura básica.

**Entregable:** Repo con `backend/` y `frontend/` ejecutables en local.

#### Día 2 — Diseño de la solución
- [ ] Diseñar modelo de BD (usuarios, publicaciones, likes, comentarios).
- [ ] Wireframes: feed, login, perfil, panel, crear publicación.
- [ ] Listar endpoints REST definitivos.
- [ ] Definir esquema JWT (expiración, payload).
- [ ] Crear tablero de tareas con tareas diarias.
- [ ] Commit con diagrama de arquitectura y decisiones en `docs/`.

**Entregable:** `docs/arquitectura.md` + wireframes + tablero activo.

---

### Fase 1: Backend — Lado del servidor (Días 3–7)

#### Día 3 — Modelos y autenticación
- [ ] Configurar BD y conexión desde FastAPI.
- [ ] Modelo `Usuario` (id, username, email, password hash, foto, bio).
- [ ] Endpoints: `POST /register`, `POST /login` (devuelve JWT).
- [ ] Probar con Swagger UI (`/docs`).

#### Día 4 — Publicaciones y perfil
- [ ] Modelo `Publicacion` (contenido, imagen opcional, fecha, usuario_id).
- [ ] Endpoints: `GET /posts`, `POST /posts`, `GET /users/{id}`.
- [ ] Proteger rutas con dependencia de usuario autenticado.
- [ ] Subida de imágenes básica (local o cloud).

#### Día 5 — Interacciones: likes y comentarios
- [ ] Modelos `Like` y `Comentario`.
- [ ] Endpoints: toggle like, listar y crear comentarios.
- [ ] Incluir conteo de likes/comentarios en respuestas de posts.
- [ ] Tests unitarios básicos con pytest (recomendado).

#### Día 6 — Panel y ajustes
- [ ] Endpoint de estadísticas para dashboard.
- [ ] Endpoints extra según tipo de red (seguir usuarios, etc.).
- [ ] Validaciones y manejo de errores centralizado.
- [ ] Refactorización del backend.

#### Día 7 — Integración y pruebas del backend
- [ ] Flujo completo con Swagger y Postman/Insomnia.
- [ ] Seeders con datos de prueba.
- [ ] Documentación API en README.
- [ ] **Hito:** merge rama `backend` → `main`.

---

### Fase 2: Frontend — Interfaz de usuario (Días 8–13)

#### Día 8 — Configuración React, rutas y layout
- [ ] Estructura: `components/`, `pages/`, `services/`, `context/`.
- [ ] React Router: rutas públicas y protegidas.
- [ ] Layout con navbar responsive.
- [ ] Contexto de autenticación + almacenamiento del token.

#### Día 9 — Autenticación y registro
- [ ] Páginas Login y Registro con validación.
- [ ] Llamadas al backend (axios/fetch), token en localStorage.
- [ ] Redirección según estado de autenticación.

#### Día 10 — Feed y publicaciones
- [ ] Página Feed con tarjetas de publicaciones.
- [ ] Formulario crear publicación (texto/imagen).
- [ ] Estados de carga y error.

#### Día 11 — Likes y comentarios
- [ ] Botón like con toggle y conteo.
- [ ] Listado y formulario de comentarios.
- [ ] Actualización optimista o refetch.

#### Día 12 — Perfil y panel
- [ ] Perfil propio y de otros usuarios.
- [ ] Dashboard con datos agregados.
- [ ] Estilizado general + responsive (móvil).

#### Día 13 — Navegación y pulido visual
- [ ] Flujo completo: login → feed → crear → perfil → logout.
- [ ] Consistencia visual (colores, tipografía).
- [ ] Rutas protegidas en frontend.
- [ ] **Hito:** merge rama `frontend` → `main`.

---

### Fase 3: Integración completa y pruebas (Días 14–15)

#### Día 14 — Integración y pruebas E2E
- [ ] Conectar servicios reales; variables de entorno (`VITE_API_URL`).
- [ ] Flujo completo: registro → login → post → like → comentario → perfil → dashboard.
- [ ] Sesión de debugging en equipo.
- [ ] Ajuste CORS en backend.

#### Día 15 — Pruebas finales y preparación para despliegue
- [ ] Pruebas multi-navegador y responsive.
- [ ] Manejo de errores (token expirado, campos vacíos).
- [ ] `npm run build` de React.
- [ ] Backend listo para prod (`requirements.txt`, env vars).
- [ ] **Hito:** tag `v0.1.0-rc` en `main`.

---

### Fase 4: Despliegue en servidor online (Días 16–18)

#### Día 16 — Despliegue del backend
- [ ] Elegir plataforma (Render, Railway, Fly.io, VPS).
- [ ] Configurar `SECRET_KEY`, `DATABASE_URL`, dependencias.
- [ ] Migrar BD en producción.
- [ ] Verificar API operativa; documentar URL base.

#### Día 17 — Despliegue del frontend
- [ ] Desplegar en Vercel/Netlify.
- [ ] Variable de entorno apuntando al backend en prod.
- [ ] Probar aplicación completa en línea.

#### Día 18 — Ajustes post-despliegue y seguridad
- [ ] Revisar que no haya secretos en el código.
- [ ] CORS, redirección SPA (404 → index.html).
- [ ] Performance básica y carga de imágenes.
- [ ] Documentar pasos de despliegue en README.

---

### Fase 5: Documentación, presentación y entrega (Días 19–20)

#### Día 19 — Documentación y presentación
- [ ] README completo (objetivo, stack, arquitectura, BD, capturas, instalación, despliegue, integrantes).
- [ ] Capturas de pantalla de la app.
- [ ] Slides: flujo, arquitectura, demo en vivo.
- [ ] Ensayo de demo (5–7 minutos).

#### Día 20 — Entrega final
- [ ] Versión final en repositorio; enlace de despliegue funcional.
- [ ] Presentación ante instructor/compañeros.
- [ ] Entregar URL del repo y de la app desplegada.
- [ ] Retrospectiva breve del equipo.

---

## Estructura de carpetas objetivo

```
studious-fiesta/
├── backend/
│   ├── app/
│   │   ├── api/          # routers
│   │   ├── core/         # config, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── arquitectura.md
│   └── wireframes/
├── PLAN_DESARROLLO.md
└── README.md
```

---

## Matriz de paralelización (referencia)

| Días | Backend | Frontend | DevOps/Docs |
|------|---------|----------|-------------|
| 1–2 | Setup + diseño BD | Setup + wireframes | Repo, tablero, README |
| 3–7 | API completa | Mockups / componentes base | — |
| 8–13 | Soporte API, fixes | UI completa | — |
| 14–15 | CORS, bugs | Integración, bugs | E2E, env vars |
| 16–18 | Deploy API | Deploy UI | CI, secrets |
| 19–20 | — | — | README, slides, demo |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Retraso en backend bloquea frontend | Mock API con JSON Server días 8–9 |
| Conflictos de merge | Ramas cortas, PR diarios |
| Subida de imágenes compleja | Empezar con URLs; archivos locales en iteración 2 |
| Token expirado en demo | Refresh manual o mensaje claro de re-login |
| Despliegue fallido día 16 | Probar deploy en día 14 en entorno staging |

---

## Checklist de entrega final

- [ ] Repositorio público con historial de commits grupal
- [ ] README con instalación, arquitectura y capturas
- [ ] Backend desplegado y documentado (`/docs` accesible)
- [ ] Frontend desplegado con URL pública
- [ ] Flujo demo: registro → login → post → like → comentario → perfil
- [ ] Presentación 5–7 min con demo en vivo
- [ ] Retrospectiva documentada (opcional en README)

---

*Última actualización: julio 2026 — Fase 0 pendiente de inicio.*
