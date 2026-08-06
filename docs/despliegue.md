# Despliegue — Studious Party

Guía para publicar backend (FastAPI) y frontend (React) en línea.

## Opción recomendada

| Pieza | Plataforma | Notas |
|-------|------------|-------|
| Backend | [Render](https://render.com) o [Railway](https://railway.app) | Servicio Web + disco o BD |
| Frontend | [Vercel](https://vercel.com) | Build estático de Vite |
| BD prod | PostgreSQL (addon Render/Railway) | O SQLite en disco persistente (limitado) |

## Backend (Render)

1. Crear **Web Service** desde el repo, root `backend`.
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Variables de entorno:

| Variable | Ejemplo |
|----------|---------|
| `SECRET_KEY` | cadena larga aleatoria |
| `DATABASE_URL` | `postgresql://...` o SQLite en disco |
| `CORS_ORIGINS` | `https://tu-app.vercel.app` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `UPLOAD_DIR` | `uploads` |

5. Comprobar: `https://tu-api.onrender.com/docs` y `/api/health`.

Hay un borrador en `backend/render.yaml`.

### Nota sobre imágenes

En Render el filesystem es efímero salvo que uses disco persistente. Para entrega académica puede bastar SQLite + uploads en disco, o URLs externas de imagen.

## Frontend (Vercel)

1. Importar el repo, root `frontend`.
2. Framework: Vite.
3. Build: `npm run build` · Output: `dist`.
4. Variable: `VITE_API_URL=https://tu-api.onrender.com`
5. `vercel.json` ya incluye rewrite SPA (`/*` → `/index.html`).

## Checklist post-despliegue

- [ ] `/api/health` responde `ok`
- [ ] Login/registro desde la URL de Vercel
- [ ] Crear post, like, comentario
- [ ] CORS sin errores en consola
- [ ] Actualizar README con URL pública

## Alternativas del enunciado

VPS Ubuntu, Fly.io, DigitalOcean, Oracle Cloud Free, AWS Free Tier — mismo esquema: API + estáticos + `CORS_ORIGINS` + `VITE_API_URL`.
