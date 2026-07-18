# studious-fiesta

Red social web básica desarrollada con **React** (frontend) y **FastAPI** (backend).

## Documentación

- [Plan de desarrollo (20 días)](./PLAN_DESARROLLO.md)
- [Arquitectura](./docs/arquitectura.md)

## Estado

| Fase | Estado |
|------|--------|
| 0 — Arranque | En curso (Día 1: setup base ✅) |
| 1 — Backend | Pendiente |
| 2 — Frontend | Pendiente |
| 3 — Integración | Pendiente |
| 4 — Despliegue | Pendiente |
| 5 — Entrega | Pendiente |

## Requisitos

- Node.js 18+
- Python 3.11+
- npm

## Instalación

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # Windows: copy .env.example .env
uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000` · Swagger en `/docs`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run dev
```

App disponible en `http://localhost:5173`

## Estructura del proyecto

```
studious-fiesta/
├── backend/          # FastAPI
├── frontend/         # React + Vite
├── docs/             # Arquitectura y wireframes
├── PLAN_DESARROLLO.md
└── README.md
```

## Scripts útiles

| Comando | Ubicación | Descripción |
|---------|-----------|-------------|
| `uvicorn app.main:app --reload` | backend | Servidor de desarrollo |
| `pytest` | backend | Tests |
| `npm run dev` | frontend | Servidor Vite |
| `npm run build` | frontend | Build de producción |
