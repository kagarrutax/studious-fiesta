# Studious Party

Red social web básica — **proyecto grupal práctico** con React y FastAPI.

**Nombre del sitio:** Studious Party (`studious-party`)  
**Repositorio:** `studious-fiesta`  
**URL desplegada:** _(pendiente — Fase 4)_

## Documentación

- [Plan de desarrollo (20 días)](./PLAN_DESARROLLO.md)
- [Plan de implementación — sistema de diseño (Tailwind)](./PLAN_IMPLEMENTACION_DISENO.md)
- [Plan sprint 23 h (equipo)](./docs/PLAN_IMPLEMENTACION_23H.md)
- [Guía PDF sprint 23 h](./docs/Guia_Sprint_23H_Studious_Party.pdf)
- [Reparto de features](./docs/equipo-features.md)
- [Arquitectura](./docs/arquitectura.md)
- [Guía de despliegue](./docs/despliegue.md)

## Objetivo

Aplicar desarrollo web moderno creando una red social simplificada pero funcional: autenticación, publicaciones, interacciones, dashboard y despliegue en servidor online.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite + React Router + axios |
| Backend | FastAPI + SQLAlchemy + Pydantic + JWT (bcrypt) |
| Base de datos | SQLite (desarrollo) · PostgreSQL recomendado (producción) |
| Control de versiones | GitHub |
| Despliegue previsto | Render/Railway (API) + Vercel (frontend) |

## Arquitectura

```
React (Vite :5173) ──REST/JSON + JWT──▶ FastAPI (:8000) ──SQL──▶ SQLite/PostgreSQL
```

Cliente-servidor: el frontend consume endpoints REST; el backend valida JWT, persiste datos y sirve imágenes en `/uploads`.

## Módulos y funcionalidades

| Módulo | Qué hace |
|--------|----------|
| Auth | Registro, login JWT, `/api/auth/me` |
| Users | Perfil público `/api/users/{id}` |
| Posts | Feed, crear post (JSON o imagen), detalle |
| Interactions | Toggle like, listar/crear comentarios |
| Stats | Totales para el panel `/api/stats` |
| UI | Home, login, registro, feed, perfil, dashboard |

## Modelo de base de datos

- **users** — id, username, email, password_hash, avatar_url, bio, created_at  
- **posts** — id, content, image_url, author_id, created_at  
- **likes** — id, user_id, post_id (único por usuario+post)  
- **comments** — id, content, user_id, post_id, created_at  

Detalle en [`docs/arquitectura.md`](./docs/arquitectura.md).

## API (resumen)

| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Sí |
| GET | `/api/users/{id}` | Sí |
| GET/POST | `/api/posts` | Sí |
| POST | `/api/posts/upload` | Sí |
| GET | `/api/posts/{id}` | Sí |
| POST | `/api/posts/{id}/like` | Sí |
| GET/POST | `/api/posts/{id}/comments` | Sí |
| GET | `/api/stats` | Sí |
| GET | `/api/health` | No |

Documentación interactiva: `http://localhost:8000/docs`

## Estado del plan

| Fase | Estado |
|------|--------|
| 0 — Arranque | Completada |
| 1 — Backend | Completada |
| 2 — Frontend | Completada |
| 3 — Integración | En curso |
| 4 — Despliegue | Pendiente |
| 5 — Entrega | Pendiente |

## Funcionalidades mínimas (enunciado)

- [x] Login y registro
- [x] Perfil básico de usuario
- [x] Publicación de contenido
- [x] Feed principal
- [x] Likes y/o comentarios
- [x] Dashboard / panel básico
- [x] Navegación entre módulos
- [x] Interfaz responsive

## Requisitos locales

- Node.js 18+
- Python 3.11+
- npm

## Instalación y ejecución

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: `http://127.0.0.1:8000` · Swagger: `/docs`

**Importante:** no uses el puerto 8000 si otra app (p. ej. Django) ya lo ocupa.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

App: `http://127.0.0.1:5173`

### Datos de demo

```bash
cd backend
venv\Scripts\activate
python -m app.seed
```

| Email | Password |
|-------|----------|
| `ana@studious.party` | `demo1234` |
| `bruno@studious.party` | `demo1234` |
| `carla@studious.party` | `demo1234` |

## Dependencias

- Backend: ver `backend/requirements.txt`
- Frontend: ver `frontend/package.json`

## Despliegue

Ver [`docs/despliegue.md`](./docs/despliegue.md). Archivos de apoyo:

- `backend/render.yaml` (o servicio Web en Render)
- `frontend/vercel.json` (SPA + variable `VITE_API_URL`)

## Capturas de pantalla

_(Añadir en Fase 5: home, feed, perfil, panel, Swagger.)_

## Integrantes

| Nombre | Rol |
|--------|-----|
| _Pendiente_ | Backend / Frontend / Docs |

## Conclusiones técnicas

_(Completar tras el despliegue y la demo.)_

## Estructura

```
studious-fiesta/
├── backend/              # FastAPI
├── frontend/             # React + Vite
├── docs/
├── PLAN_DESARROLLO.md
└── README.md
```

## Scripts útiles

| Comando | Ubicación | Descripción |
|---------|-----------|-------------|
| `uvicorn app.main:app --reload` | backend | Servidor de desarrollo |
| `python -m app.seed` | backend | Datos demo |
| `pytest` | backend | Tests |
| `npm run dev` | frontend | Servidor Vite |
| `npm run build` | frontend | Build de producción |
