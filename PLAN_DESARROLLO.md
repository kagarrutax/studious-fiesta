# Plan de desarrollo — Proyecto grupal práctico

**Asignatura / actividad:** Desarrollo de una Red Social Web Básica  
**Proyecto / nombre del sitio:** Studious Party (`studious-party`)  
**Duración:** 20 días laborables (4 semanas, lunes a viernes)  
**Equipo:** 3–5 estudiantes  
**Estado:** Fase 3 — integración lista · Siguiente: despliegue online (Fase 4)

---

## 1. Objetivo del proyecto

Aplicar conocimientos de desarrollo web moderno mediante la creación de una aplicación tipo red social con **React** y **FastAPI**, integrando:

- Frontend y backend
- Autenticación
- Publicación de contenido
- Interacción entre usuarios
- Despliegue en servidores reales

La aplicación será una versión **simplificada pero completamente funcional**, centrada en la interacción básica y un diseño visual moderno.

---

## 2. Requisitos oficiales (enunciado)

### Tecnologías obligatorias

| Obligatorio | Elección del equipo |
|-------------|---------------------|
| React (frontend) | Vite + React Router + axios |
| FastAPI (backend) | SQLAlchemy + JWT |
| Base de datos | SQLite (dev) · PostgreSQL recomendado (prod) |
| GitHub (repo público) | Este repositorio |
| Despliegue online | Render/Railway/Fly.io/VPS + Vercel |

Otras BD permitidas: MySQL, MongoDB, SQLite, PostgreSQL.

### Funcionalidades mínimas requeridas

| # | Funcionalidad | Fase del plan |
|---|---------------|---------------|
| 1 | Login y registro | Días 3, 9 |
| 2 | Perfil básico de usuario | Días 4, 12 |
| 3 | Publicación de contenido | Días 4, 10 |
| 4 | Feed principal de publicaciones | Días 4, 10 |
| 5 | Interacción (likes **o** comentarios) | Días 5, 11 |
| 6 | Dashboard / panel básico | Días 6, 12 |
| 7 | Navegación funcional entre módulos | Días 8, 13 |
| 8 | Interfaz responsive (móvil) | Días 12–13, 15 |

> El enunciado exige likes **o** comentarios. Este plan implementa **ambos** para enriquecer la demo.

### Tipos de red sugeridos (elegir uno en Día 1)

- Facebook (posts de texto + muro)
- TikTok (videos / publicaciones cortas)
- Instagram (imágenes)
- LinkedIn (perfil profesional)
- Red estudiantil / universitaria
- Comunidad temática (videojuegos, música, tecnología)

### Arquitectura requerida

```
Cliente (React) ──REST/JSON──▶ Servidor (FastAPI) ──▶ Base de datos
```

---

## 3. Entregables obligatorios

### A) Repositorio GitHub público

- Código organizado (`backend/`, `frontend/`, `docs/`)
- Historial de commits del equipo
- README.md completo (ver sección 8)

### B) Aplicación desplegada

Enlace funcional online. Plataformas sugeridas por el enunciado:

| Backend | Frontend |
|---------|----------|
| VPS Ubuntu, Render, Railway, Fly.io | Vercel |
| DigitalOcean, Oracle Cloud Free, AWS Free | Netlify / mismo VPS |

### C) Presentación final

Demostración funcional explicando:

1. Arquitectura implementada  
2. Flujo general del sistema  
3. Comunicación React ↔ FastAPI  
4. Base de datos utilizada  
5. Proceso de despliegue  
6. Funcionalidades implementadas  

---

## 4. Resumen de fases (20 días)

| Fase | Días | Enfoque | Hito de control |
|------|------|---------|-----------------|
| **0** | 1–2 | Planificación y setup | Repo + arquitectura + tipo de red elegido |
| **1** | 3–7 | Backend FastAPI | API completa en Swagger |
| **2** | 8–13 | Frontend React | UI completa + responsive |
| **3** | 14–15 | Integración y QA | Build de producción listo |
| **4** | 16–18 | Despliegue online | URL pública funcional |
| **5** | 19–20 | README + presentación | Entrega y demo |

---

## 5. Roles del equipo (3–5 personas)

| Rol | Responsabilidades | Fases |
|-----|-------------------|-------|
| **Backend** | Modelos, endpoints, JWT, seeders | 1, 3, 4 |
| **Frontend** | UI, rutas, auth context, responsive | 2, 3, 4 |
| **Full-stack / integración** | CORS, env vars, flujo E2E | 3, 4 |
| **DevOps** | Deploy backend + frontend, secretos | 4, 5 |
| **Documentación / PM** | README, wireframes, slides, demo | 0, 5 |

- **3 personas:** Backend · Frontend · DevOps/Docs (rotan integración).  
- **5 personas:** un rol por área + integración dedicada.

---

## 6. Convenciones de trabajo

### Git
- Rama `main` siempre desplegable.
- Features: `feature/auth`, `feature/feed`, `feature/deploy`, etc.
- PR con revisión de ≥ 1 compañero.
- Commits claros y frecuentes.

### Comunicación
- Stand-up diario 10 min (qué hice / qué haré / bloqueos).
- Tablero: GitHub Projects / Trello / Notion  
  Columnas: *Por hacer · En progreso · Revisión · Hecho*.

### Definición de “hecho”
- [ ] Código en PR revisado
- [ ] Probado (Swagger o navegador)
- [ ] Sin secretos en el código
- [ ] Alineado con funcionalidades mínimas del enunciado

---

## 7. Stack y modelo (propuesta)

### Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite + React Router + axios |
| Backend | FastAPI + SQLAlchemy + Pydantic |
| Auth | JWT (`Authorization: Bearer`) |
| BD | SQLite (local) / PostgreSQL (producción) |
| Estilos | CSS Modules o Tailwind (definir Día 2) |
| Deploy | Render/Railway (API) + Vercel (UI) |

### Modelo de datos (borrador — validar Día 2)

```
Usuario
  id, username, email, password_hash
  avatar_url, bio, created_at

Publicacion
  id, contenido, imagen_url?, usuario_id, created_at

Like
  id, usuario_id, publicacion_id
  UNIQUE(usuario_id, publicacion_id)

Comentario
  id, contenido, usuario_id, publicacion_id, created_at
```

### Endpoints mínimos

| Método | Ruta | Auth | Función mínima cubierta |
|--------|------|------|-------------------------|
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/users/{id}` | Opcional | Perfil |
| GET | `/api/posts` | Sí | Feed |
| POST | `/api/posts` | Sí | Publicar |
| POST | `/api/posts/{id}/like` | Sí | Likes |
| GET/POST | `/api/posts/{id}/comments` | Sí | Comentarios |
| GET | `/api/stats` | Sí | Dashboard |

---

## 8. README obligatorio (checklist del enunciado)

El `README.md` final **debe** incluir:

- [ ] Nombre de la red social  
- [ ] Objetivo del proyecto  
- [ ] Tecnologías utilizadas  
- [ ] Explicación de la arquitectura  
- [ ] Módulos y funcionalidades  
- [ ] Modelo de base de datos  
- [ ] Capturas de pantalla  
- [ ] Guía de instalación y ejecución  
- [ ] Dependencias utilizadas  
- [ ] Explicación del despliegue  
- [ ] Integrantes del grupo  
- [ ] Conclusiones técnicas  

---

## 9. Plan día a día

### Fase 0 — Arranque y planificación (Días 1–2)

#### Día 1 — Definición y setup
- [ ] Reunión: elegir tipo de red (Facebook / Instagram / LinkedIn / estudiantil / temática…).
- [ ] Asignar roles (backend, frontend, DevOps, docs).
- [x] Repositorio GitHub, `.gitignore`, README inicial.
- [x] Entornos locales (Node, Python, venv).
- [x] Inicializar FastAPI + React (Vite).
- [x] Estructura base (`backend/`, `frontend/`, `docs/`).

**Entregable:** repo ejecutable en local · **estado: hecho**.

#### Día 2 — Diseño de la solución
- [x] Confirmar nombre definitivo de la red social → **Studious Party**.
- [x] Modelo de BD (usuarios, publicaciones, likes, comentarios).
- [x] Wireframes: login, registro, feed, perfil, dashboard, crear publicación.
- [x] Lista definitiva de endpoints REST.
- [x] Esquema JWT (payload, expiración).
- [ ] Tablero de tareas con backlog de 20 días.
- [x] Documentar decisiones en `docs/arquitectura.md`.

**Entregable:** arquitectura + wireframes documentados · **estado: hecho** (falta tablero externo del equipo).

---

### Fase 1 — Backend FastAPI (Días 3–7)

#### Día 3 — Modelos y autenticación
- [x] Conectar BD (SQLite/PostgreSQL) con SQLAlchemy.
- [x] Modelo `Usuario` (+ Post, Like, Comment preparados).
- [x] `POST /api/auth/register` y `POST /api/auth/login` → JWT.
- [x] `GET /api/auth/me` protegido.
- [x] Probar en Swagger (`/docs`) / pytest.

#### Día 4 — Publicaciones y perfil
- [x] Modelo `Publicacion`.
- [x] `GET/POST /api/posts`, `GET /api/users/{id}`.
- [x] Rutas protegidas con dependencia JWT.
- [x] Subida básica de imágenes (`POST /api/posts/upload` + estáticos `/uploads`).

#### Día 5 — Interacciones
- [x] Modelos `Like` y `Comentario`.
- [x] Toggle like + listar/crear comentarios.
- [x] Contadores en respuesta de posts.
- [x] Tests pytest (recomendado).

#### Día 6 — Dashboard y robustez
- [x] `GET /api/stats` (totales para panel).
- [ ] Extras opcionales según tipo de red (seguir usuarios, tags…).
- [x] Validaciones Pydantic en schemas.
- [ ] Refactor del backend.

#### Día 7 — Cierre backend
- [x] Flujo completo en Swagger / Postman.
- [x] Seeders con datos de demo (`python -m app.seed`).
- [x] Resumen de API en README.
- [ ] **Hito:** merge `feature/backend` → `main`.

---

### Fase 2 — Frontend React (Días 8–13)

#### Día 8 — Rutas, layout y auth context
- [x] Estructura `pages/`, `components/`, `services/`, `context/`.
- [x] React Router: públicas (login, register) y protegidas (feed, perfil, dashboard).
- [x] Layout + navbar responsive.
- [x] Contexto de autenticación + token en `localStorage`.

#### Día 9 — Login y registro
- [x] Formularios con validación.
- [x] Integración con API (axios).
- [x] Redirección según sesión.

#### Día 10 — Feed y publicaciones
- [x] Listado de posts en tarjetas.
- [x] Formulario crear publicación (texto / imagen URL).
- [x] Estados de carga y error.

#### Día 11 — Likes y comentarios
- [x] Botón like + conteo.
- [x] Listado y alta de comentarios.
- [x] Actualización local tras interacción.

#### Día 12 — Perfil, dashboard y responsive
- [x] Perfil propio y de otros usuarios.
- [x] Dashboard con estadísticas.
- [x] Estilos + media queries / diseño móvil.

#### Día 13 — Navegación y pulido
- [x] Flujo: login → feed → publicar → like/comentar → perfil → dashboard → logout.
- [x] Consistencia visual básica.
- [x] Protección de rutas.
- [ ] **Hito:** merge `feature/frontend` → `main`.

---

### Fase 3 — Integración y pruebas (Días 14–15)

#### Día 14 — Integración E2E
- [x] `VITE_API_URL` apuntando al backend real.
- [x] Flujo completo usuario real (local).
- [ ] Sesión de debugging en equipo.
- [x] CORS configurado (`CORS_ORIGINS`).

#### Día 15 — QA y preparación a producción
- [ ] Pruebas multi-navegador y móvil.
- [x] Errores básicos: token inválido, campos vacíos.
- [x] `npm run build`.
- [x] Backend prod-ready (`requirements.txt`, `.env.example`, guía deploy).
- [ ] **Hito:** tag `v0.1.0-rc`.

---

### Fase 4 — Despliegue online (Días 16–18)

#### Día 16 — Backend en producción
- [ ] Elegir plataforma (Render, Railway, Fly.io, VPS Ubuntu…).
- [ ] Variables: `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`.
- [ ] Migrar / crear BD en prod.
- [ ] Verificar API + documentar URL base.

#### Día 17 — Frontend en producción
- [ ] Desplegar en Vercel (recomendado) u otra.
- [ ] Env con URL del backend desplegado.
- [ ] Probar flujo completo en internet.

#### Día 18 — Ajustes post-despliegue
- [ ] Sin secretos en el repo.
- [ ] CORS + fallback SPA (404 → `index.html`).
- [ ] Carga de imágenes y performance básica.
- [ ] Documentar despliegue en README.

**Entregable:** enlace funcional de la app (obligatorio).

---

### Fase 5 — Documentación, presentación y entrega (Días 19–20)

#### Día 19 — README y ensayo
- [ ] Completar los 12 puntos del README obligatorio (sección 8).
- [ ] Insertar capturas de pantalla.
- [ ] Preparar slides de presentación.
- [ ] Ensayo de demo (5–10 min).

#### Día 20 — Entrega y presentación
- [ ] Repo actualizado + URL de despliegue verificada.
- [ ] Presentación: arquitectura, flujo, React↔FastAPI, BD, deploy, funcionalidades.
- [ ] Entregar enlace del repositorio y de la app.
- [ ] Retrospectiva breve del equipo.

---

## 10. Estructura de carpetas objetivo

```
studious-fiesta/
├── backend/
│   ├── app/
│   │   ├── api/          # routers REST
│   │   ├── core/         # config, security JWT
│   │   ├── models/       # SQLAlchemy
│   │   ├── schemas/      # Pydantic
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
└── README.md             # documentación técnica obligatoria
```

---

## 11. Matriz de trabajo en paralelo

| Días | Backend | Frontend | DevOps / Docs |
|------|---------|----------|---------------|
| 1–2 | Diseño BD | Wireframes | Repo, tablero, nombre de la red |
| 3–7 | API completa | Componentes base / mockups | Borrador README |
| 8–13 | Fixes API | UI completa | Capturas parciales |
| 14–15 | CORS, bugs | Integración E2E | Checklist QA |
| 16–18 | Deploy API | Deploy UI | Secretos, docs deploy |
| 19–20 | Soporte demo | Soporte demo | README final + slides |

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Backend tarde → frontend bloqueado | Mock API días 8–9 |
| Solo likes **o** comentarios a medias | Priorizar uno bien; el otro como extra |
| Deploy falla el último día | Probar staging en Día 14–15 |
| README incompleto | Usar checklist de la sección 8 desde Día 7 |
| Demo se cae por token / CORS | Cuenta de demo + checklist pre-presentación |

---

## 13. Checklist de entrega final (según enunciado)

### Funcionalidades
- [ ] Login y registro  
- [ ] Perfil básico  
- [ ] Publicar contenido  
- [ ] Feed principal  
- [ ] Likes y/o comentarios  
- [ ] Dashboard  
- [ ] Navegación entre módulos  
- [ ] Responsive móvil  

### Entregables
- [ ] Repo GitHub público organizado  
- [ ] README con los 12 apartados obligatorios  
- [ ] App desplegada con URL funcional  
- [ ] Presentación (arquitectura, flujo, React↔API, BD, deploy, features)  

### Demo sugerida (orden)
1. Registro / login  
2. Crear publicación  
3. Like + comentario  
4. Ver perfil  
5. Abrir dashboard  
6. Mostrar responsive (móvil)  
7. Mostrar Swagger / arquitectura  

---

*Plan alineado al enunciado «Proyecto grupal práctico — Red Social Web Básica». Última actualización: agosto 2026.*
